/**
 * Unified Monthly Report
 *
 * The "open one file and see everything" dashboard. Combines:
 * - Health check status (are events flowing?)
 * - Monthly KPIs with trends (sessions, leads, conversion rate)
 * - Conversion journey signals (lift analysis)
 * - Search-to-conversion bridge (which queries drive leads?)
 * - Channel + device + landing page performance
 * - Click location breakdown
 *
 * Output:
 *   - data/reports/monthly.json (raw data)
 *   - data/reports/monthly.html (unified dashboard)
 *
 * Usage:
 *   npm run report:monthly              # last 30 days
 *   npm run report:monthly -- --days 60 # custom period
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

const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 30;

const CONVERSION_EVENTS = ['phone_call_click', 'text_message_click'];
const MICRO_EVENTS = ['call_modal_open', 'text_photos_modal_open', 'scroll_depth', 'blog_read_complete', 'video_play', 'video_complete'];
const EXPECTED_EVENTS = [...CONVERSION_EVENTS, ...MICRO_EVENTS];
const MIN_SAMPLE = 5;

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

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const round2 = (n) => Math.round(n * 100) / 100;
const round1 = (n) => Math.round(n * 10) / 10;

async function main() {
  const startDate = daysAgo(DAYS);
  const endDate = daysAgo(1);
  const dateRanges = [{ startDate, endDate }];
  const prevStartDate = daysAgo(DAYS * 2);
  const prevEndDate = daysAgo(DAYS + 1);
  const prevDateRanges = [{ startDate: prevStartDate, endDate: prevEndDate }];

  console.log(`\n📊 Monthly Report (${startDate} to ${endDate}, ${DAYS} days)\n`);

  const auth = await authorize();
  const api = google.analyticsdata({ version: 'v1beta', auth });
  let searchconsole;
  try {
    searchconsole = google.searchconsole({ version: 'v1', auth });
  } catch { /* GSC optional */ }

  // -----------------------------------------------------------------------
  // Fetch everything in parallel
  // -----------------------------------------------------------------------
  console.log('  Fetching data (13 queries)...');

  const q = (body, label) => api.properties.runReport({
    property: GA4_PROPERTY, requestBody: body,
  }).then(r => parseGA4Report(r)).catch(err => {
    console.warn(`    Warning: ${label} failed: ${err.message}`);
    return [];
  });

  const [
    totals, prevTotals,
    calls, texts, prevCalls, prevTexts,
    channels, devices, landing, convPages, clickLocs,
    eventHealth, weeklyTrend,
  ] = await Promise.all([
    // Current period totals
    q({ dateRanges, metrics: [{ name: 'sessions' }, { name: 'totalUsers' }] }, 'totals'),
    // Previous period totals
    q({ dateRanges: prevDateRanges, metrics: [{ name: 'sessions' }, { name: 'totalUsers' }] }, 'prev totals'),
    // Calls by region
    q({ dateRanges, dimensions: [{ name: 'customEvent:phone_region' }], metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'phone_call_click', matchType: 'EXACT' } } } }, 'calls'),
    // Texts by region
    q({ dateRanges, dimensions: [{ name: 'customEvent:phone_region' }], metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'text_message_click', matchType: 'EXACT' } } } }, 'texts'),
    // Previous calls
    q({ dateRanges: prevDateRanges, dimensions: [{ name: 'customEvent:phone_region' }], metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'phone_call_click', matchType: 'EXACT' } } } }, 'prev calls'),
    // Previous texts
    q({ dateRanges: prevDateRanges, dimensions: [{ name: 'customEvent:phone_region' }], metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'text_message_click', matchType: 'EXACT' } } } }, 'prev texts'),
    // Channels
    q({ dateRanges, dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }, 'channels'),
    // Devices
    q({ dateRanges, dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }] }, 'devices'),
    // Landing pages
    q({ dateRanges, dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 20 }, 'landing'),
    // Conversion pages
    q({ dateRanges, dimensions: [{ name: 'pagePath' }, { name: 'customEvent:phone_region' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: CONVERSION_EVENTS } } },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }], limit: 20 }, 'conv pages'),
    // Click locations
    q({ dateRanges, dimensions: [{ name: 'customEvent:click_location' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: CONVERSION_EVENTS } } } }, 'click locs'),
    // Event health check
    q({ dateRanges, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }],
      dimensionFilter: { orGroup: { expressions: EXPECTED_EVENTS.map(e => ({
        filter: { fieldName: 'eventName', stringFilter: { value: e, matchType: 'EXACT' } }
      })) } } }, 'event health'),
    // Weekly trend (by week)
    q({ dateRanges, dimensions: [{ name: 'week' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'week' } }] }, 'weekly trend'),
  ]);

  // Fetch conversion lift signals (landing page level)
  const allLandingUsers = {};
  for (const r of landing) allLandingUsers[r.landingPage] = r.totalUsers;

  const convLandingRes = await q({
    dateRanges,
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: CONVERSION_EVENTS } } },
    limit: 100,
  }, 'conv by landing');

  // GSC top queries
  let gscQueries = [];
  if (searchconsole) {
    try {
      console.log('  Fetching GSC queries...');
      const gscRes = await searchconsole.searchanalytics.query({
        siteUrl: GSC_SITE,
        requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 15 },
      });
      gscQueries = (gscRes.data.rows || []).map(r => ({
        query: r.keys[0], clicks: r.clicks, impressions: r.impressions,
        ctr: round2(r.ctr * 100), position: round1(r.position),
      }));
    } catch (err) { console.warn(`    GSC query failed: ${err.message}`); }
  }

  // -----------------------------------------------------------------------
  // Compute metrics
  // -----------------------------------------------------------------------
  console.log('  Computing metrics...');

  const sessions = totals[0]?.sessions || 0;
  const users = totals[0]?.totalUsers || 0;
  const prevSessions = prevTotals[0]?.sessions || 0;
  const prevUsers = prevTotals[0]?.totalUsers || 0;

  const sumRegion = (rows, region) => rows.find(r => r['customEvent:phone_region'] === region)?.eventCount || 0;
  const sumAll = (rows) => rows.reduce((s, r) => s + (r.eventCount || 0), 0);

  const ctCalls = sumRegion(calls, 'CT'), maCalls = sumRegion(calls, 'MA');
  const ctTexts = sumRegion(texts, 'CT'), maTexts = sumRegion(texts, 'MA');
  const totalConversions = sumAll(calls) + sumAll(texts);
  const convRate = sessions > 0 ? round2(totalConversions / sessions * 100) : 0;

  const prevConversions = sumAll(prevCalls) + sumAll(prevTexts);
  const prevConvRate = prevSessions > 0 ? round2(prevConversions / prevSessions * 100) : 0;

  // Event health
  const eventCounts = {};
  for (const r of eventHealth) eventCounts[r.eventName] = r.eventCount;
  const healthItems = EXPECTED_EVENTS.map(e => ({
    name: e, count: eventCounts[e] || 0,
    status: (eventCounts[e] || 0) > 0 ? 'ok' : CONVERSION_EVENTS.includes(e) ? 'warning' : 'info',
  }));

  // Lift signals
  const overallRate = users > 0 ? totalConversions / users : 0;
  const liftSignals = [];
  for (const r of convLandingRes) {
    const pageUsers = allLandingUsers[r.landingPage] || 0;
    if (pageUsers < MIN_SAMPLE) continue;
    const segRate = r.totalUsers / pageUsers;
    const lift = overallRate > 0 ? round1(segRate / overallRate) : 0;
    if (lift > 1.0) {
      liftSignals.push({
        page: r.landingPage, segRate: round2(segRate * 100),
        baseRate: round2(overallRate * 100), lift, sample: pageUsers, conversions: r.eventCount,
      });
    }
  }
  liftSignals.sort((a, b) => b.lift - a.lift);

  // Conversion pages aggregated
  const convPageAgg = {};
  for (const r of convPages) {
    if (!convPageAgg[r.pagePath]) convPageAgg[r.pagePath] = { total: 0, ct: 0, ma: 0 };
    convPageAgg[r.pagePath].total += r.eventCount;
    if (r['customEvent:phone_region'] === 'CT') convPageAgg[r.pagePath].ct += r.eventCount;
    else if (r['customEvent:phone_region'] === 'MA') convPageAgg[r.pagePath].ma += r.eventCount;
  }
  const convPageList = Object.entries(convPageAgg).sort((a, b) => b[1].total - a[1].total).slice(0, 15);

  // -----------------------------------------------------------------------
  // Build report
  // -----------------------------------------------------------------------
  const report = {
    period: { startDate, endDate, days: DAYS },
    generatedAt: new Date().toISOString(),
    current: { sessions, users, totalConversions, convRate, ctCalls, maCalls, ctTexts, maTexts },
    previous: { sessions: prevSessions, users: prevUsers, totalConversions: prevConversions, convRate: prevConvRate },
    healthItems, liftSignals, channels, devices, landing, convPageList,
    clickLocs, gscQueries, weeklyTrend,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, 'monthly.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(REPORTS_DIR, 'monthly.html'), generateHTML(report));

  console.log('\n' + '='.repeat(50));
  console.log('  MONTHLY REPORT');
  console.log('='.repeat(50));
  console.log(`  Sessions: ${sessions} (prev: ${prevSessions})`);
  console.log(`  Leads: ${totalConversions} (prev: ${prevConversions})`);
  console.log(`  Conv Rate: ${convRate}% (prev: ${prevConvRate}%)`);
  console.log(`  CT: ${ctCalls} calls, ${ctTexts} texts | MA: ${maCalls} calls, ${maTexts} texts`);
  if (liftSignals.length > 0) {
    console.log('\n  Top Lift Signals:');
    for (const s of liftSignals.slice(0, 5)) {
      console.log(`    ${s.lift}x  ${s.page} (${s.segRate}% vs ${s.baseRate}% baseline)`);
    }
  }
  console.log(`\n  Report: data/reports/monthly.html`);
  console.log('='.repeat(50) + '\n');
}

function generateHTML(report) {
  const c = report.current;
  const p = report.previous;

  const trend = (curr, prev) => {
    if (prev === 0) return '';
    const pct = Math.round((curr - prev) / prev * 100);
    if (pct > 0) return `<span style="color:#059669;font-size:0.75rem;">▲ ${pct}%</span>`;
    if (pct < 0) return `<span style="color:#dc2626;font-size:0.75rem;">▼ ${Math.abs(pct)}%</span>`;
    return `<span style="color:#9ca3af;font-size:0.75rem;">—</span>`;
  };

  // Health status
  const healthBadges = report.healthItems.map(h => {
    const color = h.status === 'ok' ? '#059669' : h.status === 'warning' ? '#dc2626' : '#9ca3af';
    const icon = h.status === 'ok' ? '●' : h.status === 'warning' ? '○' : '○';
    return `<span style="color:${color};font-size:0.8rem;margin-right:0.75rem;" title="${h.count} events">${icon} ${h.name.replace(/_/g, ' ')} (${h.count})</span>`;
  }).join('');

  // Lift table
  const liftRows = report.liftSignals.slice(0, 15).map(s => {
    const liftColor = s.lift >= 3 ? '#059669' : s.lift >= 1.5 ? '#2563eb' : '#6b7280';
    return `<tr><td>${escHtml(s.page)}</td><td class="num">${s.baseRate}%</td><td class="num highlight">${s.segRate}%</td><td class="num"><strong style="color:${liftColor}">${s.lift}x</strong></td><td class="num">${s.sample}</td><td class="num">${s.conversions}</td></tr>`;
  }).join('');

  // Conv pages
  const convPageRows = report.convPageList.map(([page, d]) =>
    `<tr><td>${escHtml(page)}</td><td class="num">${d.total}</td><td class="num" style="color:#2563eb">${d.ct}</td><td class="num" style="color:#059669">${d.ma}</td></tr>`
  ).join('');

  // Landing pages
  const landingRows = report.landing.slice(0, 15).map(r =>
    `<tr><td>${escHtml(r.landingPage)}</td><td class="num">${r.sessions.toLocaleString()}</td><td class="num">${r.totalUsers.toLocaleString()}</td></tr>`
  ).join('');

  // Channels
  const channelRows = report.channels.map(r =>
    `<tr><td>${escHtml(r.sessionDefaultChannelGroup)}</td><td class="num">${r.sessions.toLocaleString()}</td><td class="num">${r.totalUsers.toLocaleString()}</td></tr>`
  ).join('');

  // Click locations
  const clickLocRows = report.clickLocs.sort((a, b) => b.eventCount - a.eventCount).map(r =>
    `<tr><td>${escHtml(r['customEvent:click_location'] || '(not set)')}</td><td class="num">${r.eventCount}</td></tr>`
  ).join('');

  // Devices
  const deviceRows = report.devices.sort((a, b) => b.sessions - a.sessions).map(r =>
    `<tr><td>${escHtml(r.deviceCategory)}</td><td class="num">${r.sessions.toLocaleString()}</td></tr>`
  ).join('');

  // GSC queries
  const gscRows = report.gscQueries.map(r =>
    `<tr><td>${escHtml(r.query)}</td><td class="num">${r.clicks}</td><td class="num">${r.impressions.toLocaleString()}</td><td class="num">${r.ctr}%</td><td class="num">${r.position}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monthly Report — Attack A Crack</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a1a; padding: 2rem; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.1rem; margin: 2rem 0 0.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
  h3 { font-size: 0.95rem; margin: 1.25rem 0 0.5rem; color: #374151; }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
  a { color: #2563eb; text-decoration: none; }

  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
  .card { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .card .label { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 1.5rem; font-weight: 800; margin-top: 0.15rem; }
  .card .trend { margin-top: 0.25rem; }
  .card .value.ct { color: #2563eb; }
  .card .value.ma { color: #059669; }

  .table-wrap { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  th { background: #1a1a1a; color: white; padding: 0.625rem 0.75rem; text-align: left; font-weight: 600; white-space: nowrap; }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.highlight { font-weight: 700; color: #059669; }
  tr:hover { background: #f0f9ff; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  @media (max-width: 768px) { .two-col, .three-col { grid-template-columns: 1fr; } }

  .health-bar { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.5rem; line-height: 2; }
  .section-note { font-size: 0.8125rem; color: #6b7280; margin-bottom: 0.75rem; }
</style>
</head>
<body>
  <h1>Monthly Report</h1>
  <p class="meta">${report.period.startDate} to ${report.period.endDate} (${report.period.days} days) &mdash; vs prior ${report.period.days} days &mdash; Generated ${new Date(report.generatedAt).toLocaleString()}</p>

  <h2>Event Health</h2>
  <div class="health-bar">${healthBadges}</div>

  <div class="cards">
    <div class="card">
      <div class="label">Total Leads</div>
      <div class="value">${c.totalConversions}</div>
      <div class="trend">${trend(c.totalConversions, p.totalConversions)} vs prior period</div>
    </div>
    <div class="card">
      <div class="label">Sessions</div>
      <div class="value">${c.sessions.toLocaleString()}</div>
      <div class="trend">${trend(c.sessions, p.sessions)}</div>
    </div>
    <div class="card">
      <div class="label">Conv Rate</div>
      <div class="value">${c.convRate}%</div>
      <div class="trend">${trend(c.convRate, p.convRate)}</div>
    </div>
    <div class="card">
      <div class="label">Users</div>
      <div class="value">${c.users.toLocaleString()}</div>
      <div class="trend">${trend(c.users, p.users)}</div>
    </div>
    <div class="card"><div class="label">CT Calls</div><div class="value ct">${c.ctCalls}</div></div>
    <div class="card"><div class="label">MA Calls</div><div class="value ma">${c.maCalls}</div></div>
    <div class="card"><div class="label">CT Texts</div><div class="value ct">${c.ctTexts}</div></div>
    <div class="card"><div class="label">MA Texts</div><div class="value ma">${c.maTexts}</div></div>
  </div>

  <h2>Signal Significance</h2>
  <p class="section-note">Landing pages ranked by conversion lift. Baseline conversion rate: ${c.convRate > 0 ? round2(c.totalConversions / c.users * 100) : 0}%</p>
  ${liftRows ? `<div class="table-wrap"><table>
    <thead><tr><th>Landing Page</th><th style="text-align:right">Baseline</th><th style="text-align:right">Segment CR</th><th style="text-align:right">Lift</th><th style="text-align:right">Sample</th><th style="text-align:right">Conversions</th></tr></thead>
    <tbody>${liftRows}</tbody>
  </table></div>` : '<p class="section-note">Not enough data for lift analysis.</p>'}

  <h2>Where Conversions Happen</h2>
  <div class="two-col">
    <div>
      <h3>Conversion Pages (CT / MA)</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Page</th><th style="text-align:right">Total</th><th style="text-align:right;color:#93c5fd;">CT</th><th style="text-align:right;color:#6ee7b7;">MA</th></tr></thead>
        <tbody>${convPageRows}</tbody>
      </table></div>
    </div>
    <div>
      <h3>Click Location</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Location</th><th style="text-align:right">Count</th></tr></thead>
        <tbody>${clickLocRows}</tbody>
      </table></div>
    </div>
  </div>

  <h2>Traffic</h2>
  <div class="three-col">
    <div>
      <h3>Channels</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Channel</th><th style="text-align:right">Sessions</th><th style="text-align:right">Users</th></tr></thead>
        <tbody>${channelRows}</tbody>
      </table></div>
    </div>
    <div>
      <h3>Top Landing Pages</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Page</th><th style="text-align:right">Sessions</th><th style="text-align:right">Users</th></tr></thead>
        <tbody>${landingRows}</tbody>
      </table></div>
    </div>
    <div>
      <h3>Devices</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Device</th><th style="text-align:right">Sessions</th></tr></thead>
        <tbody>${deviceRows}</tbody>
      </table></div>
    </div>
  </div>

  ${gscRows ? `
  <h2>Top Search Queries (GSC)</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Query</th><th style="text-align:right">Clicks</th><th style="text-align:right">Impressions</th><th style="text-align:right">CTR</th><th style="text-align:right">Position</th></tr></thead>
    <tbody>${gscRows}</tbody>
  </table></div>` : ''}

  <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:0.75rem;">
    Attack A Crack &mdash; Monthly Report &mdash; Raw data: data/reports/monthly.json
  </div>
</body>
</html>`;
}

main().catch(err => {
  console.error('❌ Monthly report failed:', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
