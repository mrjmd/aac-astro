/**
 * Keyword Cannibalization Audit
 *
 * Uses GSC data to find queries where 2+ pages compete for impressions.
 * Classifies conflicts by zone (service vs city, blog vs service, etc.)
 * and severity, then generates recommendations.
 *
 * Output:
 *   - data/reports/cannibalization-audit.json (raw data)
 *   - data/reports/cannibalization-audit.html (interactive report)
 *
 * Usage:
 *   npm run audit:cannibalization                # last 90 days (default)
 *   npm run audit:cannibalization -- --days 30   # custom period
 *   npm run audit:cannibalization -- --min-impressions 20  # filter noise
 */

import { google } from 'googleapis';
import { authorize } from './lib/project-import-core.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'data', 'reports');
const GSC_SITE = 'https://www.attackacrack.com';

const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const minImpIdx = args.indexOf('--min-impressions');
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 90;
const MIN_IMPRESSIONS = minImpIdx !== -1 ? parseInt(args[minImpIdx + 1], 10) : 5;

const STATE_DIRS = ['connecticut', 'massachusetts', 'rhode-island', 'new-hampshire', 'maine'];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Page Classification
// ---------------------------------------------------------------------------

function classifyPage(path) {
  if (path === '/' || path === '') return 'homepage';
  if (/^\/services\/?$/.test(path) || /^\/locations\/?$/.test(path) || /^\/blog\/?$/.test(path) || /^\/concrete-repair\/?$/.test(path)) return 'hub';
  if (/^\/services\/[^/]+/.test(path)) return 'service';
  if (/^\/concrete-repair\/[^/]+/.test(path)) return 'service';
  for (const state of STATE_DIRS) {
    if (new RegExp(`^/${state}/[^/]+`).test(path)) return 'city';
    if (new RegExp(`^/${state}/?$`).test(path)) return 'hub';
  }
  if (/^\/blog\/[^/]+/.test(path)) return 'blog';
  if (/^\/projects\/[^/]+/.test(path)) return 'project';
  if (/^\/partners/.test(path)) return 'partner';
  return 'other';
}

function classifyZone(typeA, typeB) {
  const pair = [typeA, typeB].sort().join('+');
  const zones = {
    'city+service': { zone: 'A', label: 'Service vs City' },
    'hub+service': { zone: 'A', label: 'Service vs Hub' },
    'blog+service': { zone: 'B', label: 'Blog vs Service' },
    'city+city': { zone: 'C', label: 'City vs City' },
    'blog+blog': { zone: 'D', label: 'Blog vs Blog' },
    'blog+city': { zone: 'E', label: 'Blog vs City' },
    'blog+hub': { zone: 'E', label: 'Blog vs Hub' },
    'city+hub': { zone: 'A', label: 'City vs Hub' },
    'homepage+service': { zone: 'A', label: 'Homepage vs Service' },
    'blog+homepage': { zone: 'B', label: 'Blog vs Homepage' },
    'city+homepage': { zone: 'A', label: 'City vs Homepage' },
  };
  return zones[pair] || { zone: 'X', label: `${typeA} vs ${typeB}` };
}

function assignSeverity(winnerShare, totalImpressions) {
  if (winnerShare < 50 && totalImpressions >= 100) return 'CRITICAL';
  if (winnerShare < 60 && totalImpressions >= 50) return 'HIGH';
  if (winnerShare < 70 && totalImpressions >= 20) return 'MEDIUM';
  return 'LOW';
}

function generateRecommendation(zone, severity, pages) {
  const recs = {
    A: 'Usually fine — Google differentiates local vs commercial intent. Monitor unless the city page is outranking the service page for non-geo queries.',
    B: severity === 'CRITICAL' || severity === 'HIGH'
      ? 'Blog may be stealing commercial queries from service page. Ensure blog links prominently to the service page. Consider adding stronger CTAs to the blog post or consolidating.'
      : 'Minor overlap. Ensure blog links to service page. Different intent usually resolves naturally.',
    C: 'City pages competing — check if content is too similar. Add unique local content (soil type, neighborhood specifics, local projects) to differentiate.',
    D: severity === 'CRITICAL' || severity === 'HIGH'
      ? 'Multiple blog posts targeting same keyword. Consolidate into one pillar post or differentiate title angles. The weaker post should link to the stronger one.'
      : 'Minor blog overlap. Differentiate title tags and ensure clear internal linking hierarchy.',
    E: 'Blog post competing with city page. Ensure the blog post links to the city page as the canonical local resource. City page should rank for "[service] [city]" queries.',
    X: 'Unexpected page type combination. Review manually.',
  };
  return recs[zone] || recs.X;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startDate = daysAgo(DAYS);
  const endDate = daysAgo(1);
  console.log(`\n🔍 Cannibalization Audit (${startDate} to ${endDate}, ${DAYS} days, min ${MIN_IMPRESSIONS} impressions)\n`);

  const auth = await authorize();
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  // Fetch query+page combinations
  console.log('  Fetching GSC query+page data (up to 25K rows)...');
  const gscRes = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 25000,
    },
  });

  const rows = (gscRes.data.rows || []).map(r => ({
    query: r.keys[0],
    page: r.keys[1].replace(GSC_SITE, ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  console.log(`  ${rows.length} query+page rows fetched\n`);

  // Group by query
  const queryGroups = {};
  for (const row of rows) {
    if (!queryGroups[row.query]) queryGroups[row.query] = [];
    queryGroups[row.query].push(row);
  }

  // Find conflicts (queries with 2+ pages)
  const conflicts = [];
  let totalQueries = Object.keys(queryGroups).length;

  for (const [query, pages] of Object.entries(queryGroups)) {
    if (pages.length < 2) continue;

    const totalImpressions = pages.reduce((s, p) => s + p.impressions, 0);
    const totalClicks = pages.reduce((s, p) => s + p.clicks, 0);

    if (totalImpressions < MIN_IMPRESSIONS) continue;

    // Sort by impressions desc — winner is first
    pages.sort((a, b) => b.impressions - a.impressions);

    const winnerShare = round1(pages[0].impressions / totalImpressions * 100);
    const winnerType = classifyPage(pages[0].page);

    // Get all unique page types involved
    const pageTypes = [...new Set(pages.map(p => classifyPage(p.page)))];

    // Classify zone using the two most prominent page types
    let zoneInfo;
    if (pageTypes.length === 1) {
      zoneInfo = classifyZone(pageTypes[0], pageTypes[0]);
    } else {
      zoneInfo = classifyZone(pageTypes[0], pageTypes[1]);
    }

    const severity = assignSeverity(winnerShare, totalImpressions);
    const recommendation = generateRecommendation(zoneInfo.zone, severity, pages);

    conflicts.push({
      query,
      severity,
      zone: zoneInfo.zone,
      zoneLabel: zoneInfo.label,
      totalImpressions,
      totalClicks,
      winnerShare,
      pages: pages.map((p, i) => ({
        url: p.page,
        type: classifyPage(p.page),
        impressions: p.impressions,
        clicks: p.clicks,
        ctr: round2(p.ctr * 100),
        position: round1(p.position),
        impressionShare: round1(p.impressions / totalImpressions * 100),
        role: i === 0 ? 'winner' : 'splitter',
      })),
      recommendation,
    });
  }

  // Sort: CRITICAL first, then HIGH, etc., then by total impressions
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  conflicts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.totalImpressions - a.totalImpressions);

  // Summary stats
  const summary = {
    totalQueries,
    queriesWithSplitRankings: conflicts.length,
    critical: conflicts.filter(c => c.severity === 'CRITICAL').length,
    high: conflicts.filter(c => c.severity === 'HIGH').length,
    medium: conflicts.filter(c => c.severity === 'MEDIUM').length,
    low: conflicts.filter(c => c.severity === 'LOW').length,
    byZone: {},
  };
  for (const c of conflicts) {
    summary.byZone[c.zoneLabel] = (summary.byZone[c.zoneLabel] || 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    period: { startDate, endDate, days: DAYS, minImpressions: MIN_IMPRESSIONS },
    summary,
    conflicts,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, 'cannibalization-audit.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(REPORTS_DIR, 'cannibalization-audit.html'), generateHTML(report));

  // Console output
  console.log('='.repeat(55));
  console.log('  CANNIBALIZATION AUDIT');
  console.log('='.repeat(55));
  console.log(`  Queries analyzed: ${totalQueries}`);
  console.log(`  Split rankings found: ${conflicts.length}`);
  console.log(`  CRITICAL: ${summary.critical} | HIGH: ${summary.high} | MEDIUM: ${summary.medium} | LOW: ${summary.low}`);

  if (Object.keys(summary.byZone).length > 0) {
    console.log('\n  By Zone:');
    for (const [zone, count] of Object.entries(summary.byZone).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${zone}: ${count}`);
    }
  }

  if (conflicts.length > 0) {
    console.log('\n  Top Conflicts:');
    for (const c of conflicts.slice(0, 10)) {
      const pages = c.pages.map(p => `${p.url} (${p.impressionShare}%)`).join(' vs ');
      console.log(`    [${c.severity}] "${c.query}" — ${c.totalImpressions} imp — ${c.zoneLabel}`);
      console.log(`      ${pages}`);
    }
  }

  console.log(`\n  Report: data/reports/cannibalization-audit.html`);
  console.log('='.repeat(55) + '\n');
}

// ---------------------------------------------------------------------------
// HTML Report
// ---------------------------------------------------------------------------

function generateHTML(report) {
  const { summary, conflicts } = report;

  const sevColor = (s) => s === 'CRITICAL' ? '#dc2626' : s === 'HIGH' ? '#d97706' : s === 'MEDIUM' ? '#ca8a04' : '#9ca3af';
  const zoneColor = (z) => ({ A: '#2563eb', B: '#dc2626', C: '#9333ea', D: '#d97706', E: '#059669', X: '#6b7280' })[z] || '#6b7280';

  const conflictRows = conflicts.map(c => {
    const pagesHTML = c.pages.map(p => {
      const barWidth = Math.max(p.impressionShare, 3);
      const barColor = p.role === 'winner' ? '#2563eb' : '#f87171';
      return `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:0.75rem;">
        <span style="min-width:50px;text-align:right;font-variant-numeric:tabular-nums;">${p.impressionShare}%</span>
        <div style="width:${barWidth}%;height:16px;background:${barColor};border-radius:2px;min-width:4px;"></div>
        <a href="${GSC_SITE}${escHtml(p.url)}" target="_blank" style="color:#2563eb;">${escHtml(p.url)}</a>
        <span style="color:#9ca3af;font-size:0.65rem;">${p.type} · pos ${p.position} · ${p.clicks} clicks</span>
      </div>`;
    }).join('');

    return `<tr data-severity="${c.severity}" data-zone="${c.zone}">
      <td>
        <div style="font-weight:600;margin-bottom:2px;">${escHtml(c.query)}</div>
        <div style="font-size:0.7rem;color:#6b7280;">${c.totalImpressions} impressions · ${c.totalClicks} clicks</div>
      </td>
      <td><span style="background:${zoneColor(c.zone)};color:white;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:600;white-space:nowrap;">${c.zoneLabel}</span></td>
      <td><span style="color:${sevColor(c.severity)};font-weight:700;font-size:0.8rem;">${c.severity}</span></td>
      <td style="min-width:300px;">${pagesHTML}</td>
      <td style="font-size:0.75rem;color:#4b5563;max-width:250px;">${escHtml(c.recommendation)}</td>
    </tr>`;
  }).join('');

  const zoneSummary = Object.entries(summary.byZone).sort((a, b) => b[1] - a[1]).map(([zone, count]) =>
    `<span style="margin-right:1rem;font-size:0.8rem;">${zone}: <strong>${count}</strong></span>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cannibalization Audit — Attack A Crack</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a1a; padding: 2rem; max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.1rem; margin: 2rem 0 0.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }

  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
  .card { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; }
  .card .label { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 1.5rem; font-weight: 800; margin-top: 0.15rem; }

  .table-wrap { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  th { background: #1a1a1a; color: white; padding: 0.625rem 0.75rem; text-align: left; font-weight: 600; white-space: nowrap; position: sticky; top: 0; }
  td { padding: 0.625rem 0.75rem; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:hover { background: #f0f9ff; }

  .filters { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
  .filter-btn { border: none; background: #e5e7eb; padding: 0.375rem 0.75rem; font-size: 0.75rem; border-radius: 4px; cursor: pointer; font-weight: 500; }
  .filter-btn.active { background: #1a1a1a; color: white; }
  .zone-summary { margin-bottom: 1rem; }
</style>
</head>
<body>
  <h1>Cannibalization Audit</h1>
  <p class="meta">${report.period.startDate} to ${report.period.endDate} (${report.period.days} days, min ${report.period.minImpressions} impressions) &mdash; Generated ${new Date(report.generatedAt).toLocaleString()}</p>

  <div class="cards">
    <div class="card"><div class="label">Queries Analyzed</div><div class="value">${summary.totalQueries.toLocaleString()}</div></div>
    <div class="card"><div class="label">Split Rankings</div><div class="value">${summary.queriesWithSplitRankings}</div></div>
    <div class="card"><div class="label">Critical</div><div class="value" style="color:#dc2626;">${summary.critical}</div></div>
    <div class="card"><div class="label">High</div><div class="value" style="color:#d97706;">${summary.high}</div></div>
    <div class="card"><div class="label">Medium</div><div class="value" style="color:#ca8a04;">${summary.medium}</div></div>
    <div class="card"><div class="label">Low</div><div class="value" style="color:#9ca3af;">${summary.low}</div></div>
  </div>

  <div class="zone-summary">${zoneSummary}</div>

  <h2>Conflicts</h2>
  <div class="filters">
    <button class="filter-btn active" onclick="filterTable('all')">All (${conflicts.length})</button>
    <button class="filter-btn" onclick="filterTable('CRITICAL')" style="color:#dc2626;">Critical (${summary.critical})</button>
    <button class="filter-btn" onclick="filterTable('HIGH')" style="color:#d97706;">High (${summary.high})</button>
    <button class="filter-btn" onclick="filterTable('MEDIUM')">Medium (${summary.medium})</button>
    <button class="filter-btn" onclick="filterTable('LOW')">Low (${summary.low})</button>
  </div>

  <div class="table-wrap"><table>
    <thead><tr><th>Query</th><th>Zone</th><th>Severity</th><th>Competing Pages (impression share)</th><th>Recommendation</th></tr></thead>
    <tbody>${conflictRows}</tbody>
  </table></div>

  <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:0.75rem;">
    Attack A Crack &mdash; Cannibalization Audit &mdash; Raw data: data/reports/cannibalization-audit.json
  </div>

<script>
  function filterTable(severity) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = (severity === 'all' || row.dataset.severity === severity) ? '' : 'none';
    });
  }
</script>
</body>
</html>`;
}

main().catch(err => {
  console.error('❌ Cannibalization audit failed:', err.message);
  process.exit(1);
});
