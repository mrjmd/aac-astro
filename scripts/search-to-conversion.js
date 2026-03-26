/**
 * Search-to-Conversion Bridge Script
 *
 * Joins GSC query data + GA4 landing page + GA4 conversion events into one table.
 * Answers: "What did someone search, which page did they land on, and did they call us?"
 *
 * Output:
 *   - data/reports/search-to-conversion.json (raw data)
 *   - data/reports/search-to-conversion.html (browser-friendly report)
 *
 * Usage:
 *   npm run report:bridge              # last 28 days (default)
 *   npm run report:bridge -- --days 14 # custom period
 */

import { google } from 'googleapis';
import { authorize } from './lib/project-import-core.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'data', 'reports');
const GA4_PROPERTY = 'properties/347942677';
const GSC_SITE = 'https://www.attackacrack.com';

// Parse CLI args
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 28;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function parseGA4Report(response) {
  const dimHeaders = response.data.dimensionHeaders?.map(h => h.name) || [];
  const metricHeaders = response.data.metricHeaders?.map(h => h.name) || [];
  const rows = response.data.rows || [];
  return rows.map(row => {
    const obj = {};
    row.dimensionValues?.forEach((v, i) => { obj[dimHeaders[i]] = v.value; });
    row.metricValues?.forEach((v, i) => {
      const val = v.value;
      obj[metricHeaders[i]] = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
    });
    return obj;
  });
}

async function main() {
  console.log(`\n🔗 Search-to-Conversion Bridge Report (last ${days} days)\n`);

  const auth = await authorize();
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const startDate = daysAgo(days);
  const endDate = daysAgo(1); // GSC has ~2 day lag

  // 1. GSC: Top query+page combinations
  console.log('  Fetching GSC query+page data...');
  const gscRes = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 1000,
    },
  });
  const gscRows = (gscRes.data.rows || []).map(r => ({
    query: r.keys[0],
    page: r.keys[1].replace(GSC_SITE, ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  // 2. GA4: Conversions by landing page
  console.log('  Fetching GA4 conversion data...');

  // Phone calls by page and region
  const callsRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [
        { name: 'landingPage' },
        { name: 'customEvent:phone_region' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'phone_call_click', matchType: 'EXACT' },
        },
      },
      limit: 500,
    },
  });
  const callsByPage = parseGA4Report(callsRes);

  // Text messages by page and region
  const textsRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [
        { name: 'landingPage' },
        { name: 'customEvent:phone_region' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'text_message_click', matchType: 'EXACT' },
        },
      },
      limit: 500,
    },
  });
  const textsByPage = parseGA4Report(textsRes);

  // 3. GA4: Sessions by landing page (for conversion rate)
  console.log('  Fetching GA4 session data...');
  const sessionsRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 500,
    },
  });
  const sessionsByPage = parseGA4Report(sessionsRes);

  // 4. Build per-page conversion lookup
  const pageConversions = {};

  for (const row of callsByPage) {
    const page = row.landingPage;
    const region = row['customEvent:phone_region'] || 'unknown';
    if (!pageConversions[page]) pageConversions[page] = { calls_ct: 0, calls_ma: 0, texts_ct: 0, texts_ma: 0, sessions: 0 };
    if (region === 'CT') pageConversions[page].calls_ct += row.eventCount;
    else pageConversions[page].calls_ma += row.eventCount;
  }

  for (const row of textsByPage) {
    const page = row.landingPage;
    const region = row['customEvent:phone_region'] || 'unknown';
    if (!pageConversions[page]) pageConversions[page] = { calls_ct: 0, calls_ma: 0, texts_ct: 0, texts_ma: 0, sessions: 0 };
    if (region === 'CT') pageConversions[page].texts_ct += row.eventCount;
    else pageConversions[page].texts_ma += row.eventCount;
  }

  for (const row of sessionsByPage) {
    const page = row.landingPage;
    if (!pageConversions[page]) pageConversions[page] = { calls_ct: 0, calls_ma: 0, texts_ct: 0, texts_ma: 0, sessions: 0 };
    pageConversions[page].sessions = row.sessions;
  }

  // 5. GSC query table — pure search data, no fake per-query conversions
  const topQueries = gscRows
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 200)
    .map(gsc => ({
      query: gsc.query,
      page: gsc.page,
      gsc_clicks: gsc.clicks,
      gsc_impressions: gsc.impressions,
      gsc_ctr: Math.round(gsc.ctr * 1000) / 10,
      gsc_position: Math.round(gsc.position * 10) / 10,
      page_has_conversions: !!(pageConversions[gsc.page] && (
        pageConversions[gsc.page].calls_ct + pageConversions[gsc.page].calls_ma +
        pageConversions[gsc.page].texts_ct + pageConversions[gsc.page].texts_ma > 0
      )),
    }));

  // 6. Estimated query conversions via click-share model
  // For each page, calculate what % of GSC clicks each query represents,
  // then multiply by the page's actual conversions.
  const pageClickTotals = {};
  for (const row of gscRows) {
    pageClickTotals[row.page] = (pageClickTotals[row.page] || 0) + row.clicks;
  }

  const estimatedConversions = gscRows
    .filter(gsc => {
      const conv = pageConversions[gsc.page];
      return conv && (conv.calls_ct + conv.calls_ma + conv.texts_ct + conv.texts_ma > 0);
    })
    .map(gsc => {
      const conv = pageConversions[gsc.page];
      const pageTotal = conv.calls_ct + conv.calls_ma + conv.texts_ct + conv.texts_ma;
      const pageTotalClicks = pageClickTotals[gsc.page] || 1;
      const clickShare = gsc.clicks / pageTotalClicks;
      const estConv = clickShare * pageTotal;
      // Confidence: higher when fewer queries share the page's traffic
      // If this query is 90%+ of clicks, high confidence. If 2% of clicks among 50 queries, low.
      const queryCountForPage = gscRows.filter(r => r.page === gsc.page).length;
      let confidence;
      if (clickShare >= 0.7) confidence = 'High';
      else if (clickShare >= 0.3 || queryCountForPage <= 5) confidence = 'Medium';
      else confidence = 'Low';

      return {
        query: gsc.query,
        page: gsc.page,
        gsc_clicks: gsc.clicks,
        click_share: Math.round(clickShare * 1000) / 10,
        page_conversions: pageTotal,
        est_conversions: Math.round(estConv * 10) / 10,
        confidence,
        est_calls_ct: Math.round(clickShare * conv.calls_ct * 10) / 10,
        est_calls_ma: Math.round(clickShare * conv.calls_ma * 10) / 10,
        est_texts_ct: Math.round(clickShare * conv.texts_ct * 10) / 10,
        est_texts_ma: Math.round(clickShare * conv.texts_ma * 10) / 10,
      };
    })
    .sort((a, b) => b.est_conversions - a.est_conversions)
    .slice(0, 100);

  // 7. Build summary tables
  // Pages ranked by conversions
  const pageRanking = Object.entries(pageConversions)
    .map(([page, conv]) => ({
      page,
      ...conv,
      total: conv.calls_ct + conv.calls_ma + conv.texts_ct + conv.texts_ma,
      conv_rate: conv.sessions > 0 ? Math.round((conv.calls_ct + conv.calls_ma + conv.texts_ct + conv.texts_ma) / conv.sessions * 1000) / 10 : 0,
    }))
    .filter(p => p.total > 0 || p.sessions > 20)
    .sort((a, b) => b.total - a.total || b.sessions - a.sessions);

  // Grand totals
  const totals = {
    calls_ct: Object.values(pageConversions).reduce((s, p) => s + p.calls_ct, 0),
    calls_ma: Object.values(pageConversions).reduce((s, p) => s + p.calls_ma, 0),
    texts_ct: Object.values(pageConversions).reduce((s, p) => s + p.texts_ct, 0),
    texts_ma: Object.values(pageConversions).reduce((s, p) => s + p.texts_ma, 0),
    sessions: Object.values(pageConversions).reduce((s, p) => s + p.sessions, 0),
  };
  totals.total = totals.calls_ct + totals.calls_ma + totals.texts_ct + totals.texts_ma;
  totals.conv_rate = totals.sessions > 0 ? Math.round(totals.total / totals.sessions * 1000) / 10 : 0;

  // 8. Save JSON
  const report = {
    generatedAt: new Date().toISOString(),
    period: { days, start: startDate, end: endDate },
    totals,
    estimatedConversions,
    topQueries,
    pageRanking,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  const jsonPath = join(REPORTS_DIR, 'search-to-conversion.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`  ✅ JSON saved: ${jsonPath}`);

  // 8. Generate HTML report
  const htmlPath = join(REPORTS_DIR, 'search-to-conversion.html');
  writeFileSync(htmlPath, generateHTML(report));
  console.log(`  ✅ HTML saved: ${htmlPath}`);
  console.log(`\n  Open in browser: file://${htmlPath}\n`);

  // 9. Print summary to terminal
  console.log('  ── Summary ──────────────────────────────────────');
  console.log(`  Sessions: ${totals.sessions}`);
  console.log(`  CT Calls: ${totals.calls_ct}  |  MA Calls: ${totals.calls_ma}`);
  console.log(`  CT Texts: ${totals.texts_ct}  |  MA Texts: ${totals.texts_ma}`);
  console.log(`  Total Conversions: ${totals.total}  (${totals.conv_rate}%)`);
  console.log('  ─────────────────────────────────────────────────\n');
}

function generateHTML(report) {
  const { totals, estimatedConversions, topQueries, pageRanking, period } = report;

  const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const confidenceColor = (c) => c === 'High' ? '#059669' : c === 'Medium' ? '#d97706' : '#9ca3af';

  const estRows = estimatedConversions.map(r => `
    <tr>
      <td>${escHtml(r.query)}</td>
      <td><a href="https://www.attackacrack.com${r.page}" target="_blank">${escHtml(r.page)}</a></td>
      <td class="num">${r.gsc_clicks}</td>
      <td class="num">${r.click_share}%</td>
      <td class="num">${r.page_conversions}</td>
      <td class="num">${r.est_calls_ct}</td>
      <td class="num">${r.est_calls_ma}</td>
      <td class="num">${r.est_texts_ct}</td>
      <td class="num">${r.est_texts_ma}</td>
      <td class="num highlight">${r.est_conversions}</td>
      <td><span style="color:${confidenceColor(r.confidence)};font-weight:600">${r.confidence}</span></td>
    </tr>`).join('');

  const queryRows = topQueries.slice(0, 100).map(r => `
    <tr${r.page_has_conversions ? ' class="converting-page"' : ''}>
      <td>${escHtml(r.query)}</td>
      <td><a href="https://www.attackacrack.com${r.page}" target="_blank">${escHtml(r.page)}</a></td>
      <td class="num">${r.gsc_clicks}</td>
      <td class="num">${r.gsc_impressions}</td>
      <td class="num">${r.gsc_ctr}%</td>
      <td class="num">${r.gsc_position}</td>
      <td class="num">${r.page_has_conversions ? '&#x2705;' : ''}</td>
    </tr>`).join('');

  const pageRows = pageRanking.slice(0, 50).map(r => `
    <tr>
      <td><a href="https://www.attackacrack.com${r.page}" target="_blank">${escHtml(r.page)}</a></td>
      <td class="num">${r.sessions}</td>
      <td class="num">${r.calls_ct}</td>
      <td class="num">${r.calls_ma}</td>
      <td class="num">${r.texts_ct}</td>
      <td class="num">${r.texts_ma}</td>
      <td class="num ${r.total > 0 ? 'highlight' : ''}">${r.total}</td>
      <td class="num">${r.conv_rate}%</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Search-to-Conversion Report — Attack A Crack</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a1a; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .card { background: white; border-radius: 8px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .card .label { font-size: 0.75rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 1.75rem; font-weight: 800; margin-top: 0.25rem; }
  .card .value.ct { color: #2563eb; }
  .card .value.ma { color: #059669; }
  h2 { font-size: 1.1rem; margin: 2rem 0 0.75rem; }
  .table-wrap { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  th { background: #1a1a1a; color: white; padding: 0.625rem 0.75rem; text-align: left; font-weight: 600; white-space: nowrap; position: sticky; top: 0; }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; white-space: nowrap; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.highlight { font-weight: 700; color: #059669; }
  tr:hover { background: #f0f9ff; }
  tr.converting-page { background: #f0fdf4; }
  tr.converting-page:hover { background: #dcfce7; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .section { margin-bottom: 2rem; }
  .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.75rem 1rem; font-size: 0.8125rem; color: #92400e; margin-bottom: 1rem; }
</style>
</head>
<body>
  <h1>Search-to-Conversion Bridge</h1>
  <p class="meta">Period: ${period.start} to ${period.end} (${period.days} days) &mdash; Generated ${new Date(report.generatedAt).toLocaleString()}</p>

  <div class="cards">
    <div class="card"><div class="label">Sessions</div><div class="value">${totals.sessions.toLocaleString()}</div></div>
    <div class="card"><div class="label">CT Calls</div><div class="value ct">${totals.calls_ct}</div></div>
    <div class="card"><div class="label">MA Calls</div><div class="value ma">${totals.calls_ma}</div></div>
    <div class="card"><div class="label">CT Texts</div><div class="value ct">${totals.texts_ct}</div></div>
    <div class="card"><div class="label">MA Texts</div><div class="value ma">${totals.texts_ma}</div></div>
    <div class="card"><div class="label">Total Leads</div><div class="value">${totals.total}</div></div>
    <div class="card"><div class="label">Conv Rate</div><div class="value">${totals.conv_rate}%</div></div>
  </div>

  <div class="section">
    <h2>Estimated Query Conversions (Click-Share Model)</h2>
    <p class="meta">Estimates how many conversions each query drove based on its share of a page's organic clicks. A query responsible for 80% of a page's traffic gets credited with 80% of that page's conversions.</p>
    <div class="note">These are estimates, not exact counts. <strong>Confidence</strong> reflects how concentrated the page's traffic is &mdash; "High" means one query dominates, "Low" means traffic is split across many queries.</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Search Query</th>
            <th>Landing Page</th>
            <th>GSC Clicks</th>
            <th>Click Share</th>
            <th>Page Conv</th>
            <th>Est Calls CT</th>
            <th>Est Calls MA</th>
            <th>Est Texts CT</th>
            <th>Est Texts MA</th>
            <th>Est Total</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>${estRows}</tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <h2>Top Search Queries</h2>
    <p class="meta">What people searched and where they landed. Sorted by clicks. Green rows land on pages that have generated conversions (see Page Ranking below for actual numbers).</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Search Query</th>
            <th>Landing Page</th>
            <th>Clicks</th>
            <th>Impressions</th>
            <th>CTR</th>
            <th>Avg Position</th>
            <th>Page Converts?</th>
          </tr>
        </thead>
        <tbody>${queryRows}</tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <h2>Page Conversion Ranking</h2>
    <p class="meta">Which pages generate leads, broken out by branch and type. Read this alongside the query table above to connect search queries to converting pages.</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Sessions</th>
            <th>Calls CT</th>
            <th>Calls MA</th>
            <th>Texts CT</th>
            <th>Texts MA</th>
            <th>Total Conv</th>
            <th>Conv Rate</th>
          </tr>
        </thead>
        <tbody>${pageRows}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
