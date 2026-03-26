/**
 * Content Decay Alert
 *
 * Compares GSC position data across two time windows to detect posts
 * and pages that are losing rankings. Flags any page where average
 * position has dropped significantly.
 *
 * Output:
 *   - data/reports/content-decay.json (raw data)
 *   - data/reports/content-decay.html (browser-friendly alert dashboard)
 *
 * Usage:
 *   npm run alert:decay                     # compare last 14 days vs prior 14 days
 *   npm run alert:decay -- --window 7       # 7-day windows
 *   npm run alert:decay -- --threshold 3    # alert on 3+ position drop (default: 3)
 */

import { google } from 'googleapis';
import { authorize } from './lib/project-import-core.js';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'data', 'reports');
const HISTORY_FILE = join(REPORTS_DIR, 'content-decay-history.json');
const GSC_SITE = 'https://www.attackacrack.com';

const args = process.argv.slice(2);
const windowIdx = args.indexOf('--window');
const threshIdx = args.indexOf('--threshold');
const minImpIdx = args.indexOf('--min-impressions');
const WINDOW = windowIdx !== -1 ? parseInt(args[windowIdx + 1], 10) : 14;
const THRESHOLD = threshIdx !== -1 ? parseFloat(args[threshIdx + 1]) : 3;
const MIN_IMPRESSIONS = minImpIdx !== -1 ? parseInt(args[minImpIdx + 1], 10) : 10;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

async function fetchWindowData(searchconsole, startDate, endDate) {
  // Query-level data (positions by query+page)
  const res = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit: 25000,
    },
  });

  return (res.data.rows || []).map(r => ({
    page: r.keys[0].replace(GSC_SITE, ''),
    query: r.keys[1],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

function aggregateByPage(rows) {
  const pages = {};
  for (const r of rows) {
    if (!pages[r.page]) {
      pages[r.page] = { queries: [], totalClicks: 0, totalImpressions: 0, positionSum: 0, positionWeight: 0 };
    }
    const p = pages[r.page];
    p.queries.push({ query: r.query, clicks: r.clicks, impressions: r.impressions, position: r.position });
    p.totalClicks += r.clicks;
    p.totalImpressions += r.impressions;
    // Weighted average position (weighted by impressions)
    p.positionSum += r.position * r.impressions;
    p.positionWeight += r.impressions;
  }

  for (const p of Object.values(pages)) {
    p.avgPosition = p.positionWeight > 0 ? round1(p.positionSum / p.positionWeight) : 0;
    p.queries.sort((a, b) => b.impressions - a.impressions);
  }
  return pages;
}

function aggregateByQuery(rows) {
  const queries = {};
  for (const r of rows) {
    if (!queries[r.query]) {
      queries[r.query] = { pages: [], totalClicks: 0, totalImpressions: 0, positionSum: 0, positionWeight: 0 };
    }
    const q = queries[r.query];
    q.pages.push({ page: r.page, clicks: r.clicks, impressions: r.impressions, position: r.position });
    q.totalClicks += r.clicks;
    q.totalImpressions += r.impressions;
    q.positionSum += r.position * r.impressions;
    q.positionWeight += r.impressions;
  }

  for (const q of Object.values(queries)) {
    q.avgPosition = q.positionWeight > 0 ? round1(q.positionSum / q.positionWeight) : 0;
    q.pages.sort((a, b) => b.impressions - a.impressions);
  }
  return queries;
}

async function main() {
  // Current window: last WINDOW days
  const currentEnd = daysAgo(1);
  const currentStart = daysAgo(WINDOW);
  // Previous window: the WINDOW days before that
  const prevEnd = daysAgo(WINDOW + 1);
  const prevStart = daysAgo(WINDOW * 2);

  console.log(`\n📉 Content Decay Alert`);
  console.log(`   Current: ${currentStart} to ${currentEnd}`);
  console.log(`   Previous: ${prevStart} to ${prevEnd}`);
  console.log(`   Threshold: ${THRESHOLD}+ position drop, min ${MIN_IMPRESSIONS} impressions\n`);

  const auth = await authorize();
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  console.log('  Fetching current window...');
  const currentRows = await fetchWindowData(searchconsole, currentStart, currentEnd);
  console.log(`    ${currentRows.length} rows`);

  console.log('  Fetching previous window...');
  const prevRows = await fetchWindowData(searchconsole, prevStart, prevEnd);
  console.log(`    ${prevRows.length} rows`);

  // Aggregate by page
  const currentPages = aggregateByPage(currentRows);
  const prevPages = aggregateByPage(prevRows);

  // Aggregate by query
  const currentQueries = aggregateByQuery(currentRows);
  const prevQueries = aggregateByQuery(prevRows);

  // Compare pages: find decaying pages
  const decayingPages = [];
  const improvingPages = [];
  const allPageChanges = [];

  for (const [page, current] of Object.entries(currentPages)) {
    const prev = prevPages[page];
    if (!prev) continue; // New page, no comparison
    if (current.totalImpressions < MIN_IMPRESSIONS && prev.totalImpressions < MIN_IMPRESSIONS) continue;

    const positionChange = round1(current.avgPosition - prev.avgPosition);
    const impressionChange = current.totalImpressions - prev.totalImpressions;
    const clickChange = current.totalClicks - prev.totalClicks;

    const entry = {
      page,
      currentPosition: current.avgPosition,
      previousPosition: prev.avgPosition,
      positionChange,
      currentImpressions: current.totalImpressions,
      previousImpressions: prev.totalImpressions,
      impressionChange,
      impressionChangePct: prev.totalImpressions > 0 ? round1((impressionChange / prev.totalImpressions) * 100) : 0,
      currentClicks: current.totalClicks,
      previousClicks: prev.totalClicks,
      clickChange,
      topQueries: current.queries.slice(0, 5),
    };

    allPageChanges.push(entry);

    // Position increased = ranking dropped (higher number = worse)
    if (positionChange >= THRESHOLD) {
      decayingPages.push(entry);
    } else if (positionChange <= -THRESHOLD) {
      improvingPages.push(entry);
    }
  }

  // Compare queries: find decaying queries
  const decayingQueries = [];
  for (const [query, current] of Object.entries(currentQueries)) {
    const prev = prevQueries[query];
    if (!prev) continue;
    if (current.totalImpressions < MIN_IMPRESSIONS && prev.totalImpressions < MIN_IMPRESSIONS) continue;

    const positionChange = round1(current.avgPosition - prev.avgPosition);
    if (positionChange >= THRESHOLD) {
      decayingQueries.push({
        query,
        currentPosition: current.avgPosition,
        previousPosition: prev.avgPosition,
        positionChange,
        currentImpressions: current.totalImpressions,
        previousImpressions: prev.totalImpressions,
        impressionChange: current.totalImpressions - prev.totalImpressions,
        primaryPage: current.pages[0]?.page || 'unknown',
      });
    }
  }

  // Detect disappeared pages (had impressions before, zero now)
  const disappearedPages = [];
  for (const [page, prev] of Object.entries(prevPages)) {
    if (prev.totalImpressions >= MIN_IMPRESSIONS && !currentPages[page]) {
      disappearedPages.push({
        page,
        previousImpressions: prev.totalImpressions,
        previousClicks: prev.totalClicks,
        previousPosition: prev.avgPosition,
        topQueries: prev.queries.slice(0, 3),
      });
    }
  }

  // Sort by severity
  decayingPages.sort((a, b) => b.positionChange - a.positionChange);
  improvingPages.sort((a, b) => a.positionChange - b.positionChange);
  decayingQueries.sort((a, b) => b.positionChange - a.positionChange);
  disappearedPages.sort((a, b) => b.previousImpressions - a.previousImpressions);

  // Save history for trend tracking
  const snapshot = {
    date: new Date().toISOString().split('T')[0],
    window: WINDOW,
    currentStart,
    currentEnd,
    decayingCount: decayingPages.length,
    improvingCount: improvingPages.length,
    disappearedCount: disappearedPages.length,
    topDecaying: decayingPages.slice(0, 5).map(p => ({ page: p.page, drop: p.positionChange })),
  };

  let history = [];
  if (existsSync(HISTORY_FILE)) {
    try { history = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8')); } catch { history = []; }
  }
  // Don't duplicate same-day entries
  history = history.filter(h => h.date !== snapshot.date);
  history.push(snapshot);
  history.sort((a, b) => a.date.localeCompare(b.date));

  const report = {
    generatedAt: new Date().toISOString(),
    period: { currentStart, currentEnd, prevStart, prevEnd, window: WINDOW, threshold: THRESHOLD, minImpressions: MIN_IMPRESSIONS },
    summary: {
      totalPagesCompared: allPageChanges.length,
      decaying: decayingPages.length,
      improving: improvingPages.length,
      disappeared: disappearedPages.length,
      decayingQueries: decayingQueries.length,
    },
    decayingPages,
    improvingPages: improvingPages.slice(0, 20),
    disappearedPages,
    decayingQueries: decayingQueries.slice(0, 30),
    history,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, 'content-decay.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(REPORTS_DIR, 'content-decay.html'), generateHTML(report));
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  // Console output
  console.log('\n' + '='.repeat(55));
  console.log('  CONTENT DECAY ALERT');
  console.log('='.repeat(55));
  console.log(`  Pages compared: ${allPageChanges.length}`);
  console.log(`  📉 Decaying: ${decayingPages.length} pages (${THRESHOLD}+ position drop)`);
  console.log(`  📈 Improving: ${improvingPages.length} pages`);
  console.log(`  🚫 Disappeared: ${disappearedPages.length} pages`);
  console.log(`  📉 Decaying queries: ${decayingQueries.length}`);

  if (decayingPages.length > 0) {
    console.log('\n  Top Decaying Pages:');
    for (const p of decayingPages.slice(0, 10)) {
      console.log(`    ▼${p.positionChange} pos  ${p.page}  (${p.previousPosition} → ${p.currentPosition}, ${p.impressionChangePct > 0 ? '+' : ''}${p.impressionChangePct}% imp)`);
    }
  }

  if (disappearedPages.length > 0) {
    console.log('\n  Disappeared Pages:');
    for (const p of disappearedPages.slice(0, 5)) {
      console.log(`    🚫 ${p.page}  (was pos ${p.previousPosition}, ${p.previousImpressions} imp)`);
    }
  }

  if (improvingPages.length > 0) {
    console.log('\n  Top Improving Pages:');
    for (const p of improvingPages.slice(0, 5)) {
      console.log(`    ▲${Math.abs(p.positionChange)} pos  ${p.page}  (${p.previousPosition} → ${p.currentPosition})`);
    }
  }

  if (decayingQueries.length > 0) {
    console.log('\n  Top Decaying Queries:');
    for (const q of decayingQueries.slice(0, 10)) {
      console.log(`    ▼${q.positionChange} pos  "${q.query}"  on ${q.primaryPage}`);
    }
  }

  console.log(`\n  Report: data/reports/content-decay.html`);
  console.log('='.repeat(55) + '\n');

  if (decayingPages.length > 0 || disappearedPages.length > 0) {
    process.exitCode = 1; // Non-zero so automation can detect issues
  }
}

function generateHTML(report) {
  const { summary, decayingPages, improvingPages, disappearedPages, decayingQueries, history } = report;

  const decayRows = decayingPages.map(p => {
    const queries = p.topQueries.map(q =>
      `<span style="display:inline-block;background:#f1f5f9;padding:1px 6px;border-radius:3px;font-size:0.7rem;margin:1px;">${escHtml(q.query)} (${q.impressions} imp)</span>`
    ).join(' ');
    const impColor = p.impressionChangePct < -10 ? '#dc2626' : p.impressionChangePct > 10 ? '#059669' : '#6b7280';
    return `<tr>
      <td><a href="${GSC_SITE}${escHtml(p.page)}" target="_blank">${escHtml(p.page)}</a></td>
      <td class="num">${p.previousPosition}</td>
      <td class="num" style="color:#dc2626;font-weight:600;">${p.currentPosition}</td>
      <td class="num" style="color:#dc2626;font-weight:700;">▼ ${p.positionChange}</td>
      <td class="num" style="color:${impColor};">${p.impressionChangePct > 0 ? '+' : ''}${p.impressionChangePct}%</td>
      <td class="num">${p.currentClicks} (${p.clickChange >= 0 ? '+' : ''}${p.clickChange})</td>
      <td style="max-width:300px;">${queries}</td>
    </tr>`;
  }).join('');

  const improveRows = improvingPages.slice(0, 15).map(p => `<tr>
    <td><a href="${GSC_SITE}${escHtml(p.page)}" target="_blank">${escHtml(p.page)}</a></td>
    <td class="num">${p.previousPosition}</td>
    <td class="num" style="color:#059669;font-weight:600;">${p.currentPosition}</td>
    <td class="num" style="color:#059669;font-weight:700;">▲ ${Math.abs(p.positionChange)}</td>
    <td class="num">${p.impressionChangePct > 0 ? '+' : ''}${p.impressionChangePct}%</td>
  </tr>`).join('');

  const disappearedRows = disappearedPages.map(p => {
    const queries = p.topQueries.map(q =>
      `<span style="display:inline-block;background:#f1f5f9;padding:1px 6px;border-radius:3px;font-size:0.7rem;margin:1px;">${escHtml(q.query)}</span>`
    ).join(' ');
    return `<tr>
      <td><a href="${GSC_SITE}${escHtml(p.page)}" target="_blank">${escHtml(p.page)}</a></td>
      <td class="num">${p.previousPosition}</td>
      <td class="num">${p.previousImpressions}</td>
      <td class="num">${p.previousClicks}</td>
      <td>${queries}</td>
    </tr>`;
  }).join('');

  const queryRows = decayingQueries.slice(0, 20).map(q => `<tr>
    <td>${escHtml(q.query)}</td>
    <td>${escHtml(q.primaryPage)}</td>
    <td class="num">${q.previousPosition}</td>
    <td class="num" style="color:#dc2626;font-weight:600;">${q.currentPosition}</td>
    <td class="num" style="color:#dc2626;">▼ ${q.positionChange}</td>
    <td class="num">${q.impressionChange >= 0 ? '+' : ''}${q.impressionChange}</td>
  </tr>`).join('');

  // History trend
  const historyRows = history.slice(-12).map(h => `<tr>
    <td>${h.date}</td>
    <td class="num" style="color:${h.decayingCount > 0 ? '#dc2626' : '#059669'};">${h.decayingCount}</td>
    <td class="num" style="color:#059669;">${h.improvingCount}</td>
    <td class="num" style="color:${h.disappearedCount > 0 ? '#dc2626' : '#6b7280'};">${h.disappearedCount}</td>
  </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Content Decay Alert — Attack A Crack</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a1a; padding: 2rem; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.1rem; margin: 2rem 0 0.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }

  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
  .card { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; }
  .card .label { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 1.5rem; font-weight: 800; margin-top: 0.15rem; }

  .table-wrap { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  th { background: #1a1a1a; color: white; padding: 0.625rem 0.75rem; text-align: left; font-weight: 600; white-space: nowrap; position: sticky; top: 0; }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr:hover { background: #f0f9ff; }

  .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.75rem 1rem; font-size: 0.8125rem; color: #92400e; margin-bottom: 1rem; }
</style>
</head>
<body>
  <h1>Content Decay Alert</h1>
  <p class="meta">Comparing ${report.period.currentStart} – ${report.period.currentEnd} vs ${report.period.prevStart} – ${report.period.prevEnd} (${report.period.window}-day windows) &mdash; Threshold: ${report.period.threshold}+ position drop &mdash; Generated ${new Date(report.generatedAt).toLocaleString()}</p>

  <div class="cards">
    <div class="card"><div class="label">Pages Compared</div><div class="value">${summary.totalPagesCompared}</div></div>
    <div class="card"><div class="label">Decaying</div><div class="value" style="color:${summary.decaying > 0 ? '#dc2626' : '#059669'};">${summary.decaying}</div></div>
    <div class="card"><div class="label">Improving</div><div class="value" style="color:#059669;">${summary.improving}</div></div>
    <div class="card"><div class="label">Disappeared</div><div class="value" style="color:${summary.disappeared > 0 ? '#dc2626' : '#6b7280'};">${summary.disappeared}</div></div>
    <div class="card"><div class="label">Queries Dropping</div><div class="value" style="color:${summary.decayingQueries > 0 ? '#dc2626' : '#059669'};">${summary.decayingQueries}</div></div>
  </div>

  ${decayingPages.length > 0 ? `
  <h2>Decaying Pages</h2>
  <p class="meta">Pages that dropped ${report.period.threshold}+ positions. Check if content needs refreshing, competitors published new content, or technical issues appeared.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Page</th><th style="text-align:right">Was</th><th style="text-align:right">Now</th><th style="text-align:right">Change</th><th style="text-align:right">Impressions</th><th style="text-align:right">Clicks</th><th>Top Queries</th></tr></thead>
    <tbody>${decayRows}</tbody>
  </table></div>` : '<div class="note" style="background:#f0fdf4;border-color:#86efac;color:#166534;">No decaying pages detected. All monitored pages are holding or improving position.</div>'}

  ${disappearedPages.length > 0 ? `
  <h2>Disappeared Pages</h2>
  <p class="meta">Pages that had impressions in the previous window but zero in the current window. May indicate deindexing, noindex, or redirect issues.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Page</th><th style="text-align:right">Was Position</th><th style="text-align:right">Was Impressions</th><th style="text-align:right">Was Clicks</th><th>Queries</th></tr></thead>
    <tbody>${disappearedRows}</tbody>
  </table></div>` : ''}

  ${queryRows ? `
  <h2>Decaying Queries</h2>
  <p class="meta">Individual queries losing position. High-value queries dropping may need content refresh or technical investigation.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Query</th><th>Primary Page</th><th style="text-align:right">Was</th><th style="text-align:right">Now</th><th style="text-align:right">Change</th><th style="text-align:right">Imp Change</th></tr></thead>
    <tbody>${queryRows}</tbody>
  </table></div>` : ''}

  ${improveRows ? `
  <h2>Improving Pages</h2>
  <p class="meta">Pages gaining position — your content is working here.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Page</th><th style="text-align:right">Was</th><th style="text-align:right">Now</th><th style="text-align:right">Change</th><th style="text-align:right">Impressions</th></tr></thead>
    <tbody>${improveRows}</tbody>
  </table></div>` : ''}

  ${history.length > 1 ? `
  <h2>Trend History</h2>
  <p class="meta">Decay alert history over time. Run this weekly to build a trend.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Date</th><th style="text-align:right">Decaying</th><th style="text-align:right">Improving</th><th style="text-align:right">Disappeared</th></tr></thead>
    <tbody>${historyRows}</tbody>
  </table></div>` : ''}

  <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:0.75rem;">
    Attack A Crack &mdash; Content Decay Alert &mdash; Raw data: data/reports/content-decay.json
  </div>
</body>
</html>`;
}

main().catch(err => {
  console.error('❌ Content decay alert failed:', err.message);
  process.exit(1);
});
