/**
 * Weekly Performance Report
 *
 * Quick-glance dashboard: leads, conversion rate trend, top pages,
 * click locations, device split, channel performance.
 *
 * Compares this week vs previous 3 weeks for trend context.
 *
 * Output:
 *   - data/reports/weekly.json (raw data)
 *   - data/reports/weekly.html (browser-friendly dashboard)
 *
 * Usage:
 *   npm run report:weekly              # last 7 days vs prior 3 weeks
 *   npm run report:weekly -- --days 14 # custom period
 */

import { google } from 'googleapis';
import { authorize } from './lib/project-import-core.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'data', 'reports');
const GA4_PROPERTY = 'properties/347942677';

const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 7;

const CONVERSION_EVENTS = ['phone_call_click', 'text_message_click'];

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

async function fetchWeekData(api, startDate, endDate) {
  const dateRanges = [{ startDate, endDate }];

  // All queries in parallel
  const [
    totalsRes, callsRes, textsRes, channelsRes, devicesRes,
    landingRes, convPagesRes, clickLocRes, newVsRetRes, dailyRes,
  ] = await Promise.all([
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges, metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'customEvent:phone_region' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'phone_call_click', matchType: 'EXACT' } } },
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'customEvent:phone_region' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'text_message_click', matchType: 'EXACT' } } },
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: CONVERSION_EVENTS } } },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10,
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'customEvent:click_location' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: CONVERSION_EVENTS } } },
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    }}),
    api.properties.runReport({ property: GA4_PROPERTY, requestBody: {
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }}),
  ]);

  const totals = parseGA4Report(totalsRes);
  const calls = parseGA4Report(callsRes);
  const texts = parseGA4Report(textsRes);

  const sessions = totals[0]?.sessions || 0;
  const users = totals[0]?.totalUsers || 0;
  const ctCalls = calls.find(r => r['customEvent:phone_region'] === 'CT')?.eventCount || 0;
  const maCalls = calls.find(r => r['customEvent:phone_region'] === 'MA')?.eventCount || 0;
  const ctTexts = texts.find(r => r['customEvent:phone_region'] === 'CT')?.eventCount || 0;
  const maTexts = texts.find(r => r['customEvent:phone_region'] === 'MA')?.eventCount || 0;
  const totalCalls = calls.reduce((s, r) => s + (r.eventCount || 0), 0);
  const totalTexts = texts.reduce((s, r) => s + (r.eventCount || 0), 0);
  const totalConversions = totalCalls + totalTexts;
  const convRate = sessions > 0 ? Math.round(totalConversions / sessions * 10000) / 100 : 0;

  return {
    startDate, endDate, sessions, users,
    ctCalls, maCalls, ctTexts, maTexts,
    totalCalls, totalTexts, totalConversions, convRate,
    channels: parseGA4Report(channelsRes),
    devices: parseGA4Report(devicesRes),
    landingPages: parseGA4Report(landingRes),
    conversionPages: parseGA4Report(convPagesRes),
    clickLocations: parseGA4Report(clickLocRes),
    newVsReturning: parseGA4Report(newVsRetRes),
    daily: parseGA4Report(dailyRes),
  };
}

function generateHTML(report) {
  const { current, previous, weeks } = report;
  const c = current;

  // Trend arrows
  const trend = (curr, prev) => {
    if (prev === 0) return '';
    const pct = Math.round((curr - prev) / prev * 100);
    if (pct > 0) return `<span style="color:#059669;font-size:0.75rem;">▲ ${pct}%</span>`;
    if (pct < 0) return `<span style="color:#dc2626;font-size:0.75rem;">▼ ${Math.abs(pct)}%</span>`;
    return `<span style="color:#9ca3af;font-size:0.75rem;">—</span>`;
  };

  const p = previous;

  // Daily sparkline (CSS bars)
  const maxDailySessions = Math.max(...c.daily.map(d => d.sessions), 1);
  const dailyBars = c.daily.map(d => {
    const pct = Math.round(d.sessions / maxDailySessions * 100);
    const dateStr = d.date;
    const label = `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
    return `<div class="spark-col">
      <div class="spark-bar" style="height:${pct}%;" title="${label}: ${d.sessions} sessions"></div>
      <div class="spark-label">${label}</div>
    </div>`;
  }).join('');

  // Landing pages with conversion data
  const convPageMap = {};
  for (const r of c.conversionPages) convPageMap[r.pagePath] = r.eventCount;

  const landingRows = c.landingPages.map(r => {
    const convs = convPageMap[r.landingPage] || 0;
    const rate = r.sessions > 0 ? Math.round(convs / r.sessions * 10000) / 100 : 0;
    return `<tr>
      <td>${escHtml(r.landingPage)}</td>
      <td class="num">${r.sessions.toLocaleString()}</td>
      <td class="num">${convs}</td>
      <td class="num" style="color:${rate >= 3 ? '#059669' : rate > 0 ? '#2563eb' : '#1a1a1a'};font-weight:${rate > 0 ? '600' : '400'}">${rate}%</td>
    </tr>`;
  }).join('');

  // Channel rows
  const channelRows = c.channels.map(r => {
    const ch = r.sessionDefaultChannelGroup;
    return `<tr><td>${escHtml(ch)}</td><td class="num">${r.sessions.toLocaleString()}</td><td class="num">${r.totalUsers.toLocaleString()}</td></tr>`;
  }).join('');

  // Click location rows
  const clickLocRows = c.clickLocations
    .sort((a, b) => b.eventCount - a.eventCount)
    .map(r => `<tr><td>${escHtml(r['customEvent:click_location'] || '(not set)')}</td><td class="num">${r.eventCount}</td></tr>`)
    .join('');

  // Device rows
  const deviceRows = c.devices
    .sort((a, b) => b.sessions - a.sessions)
    .map(r => `<tr><td>${escHtml(r.deviceCategory)}</td><td class="num">${r.sessions.toLocaleString()}</td><td class="num">${r.totalUsers.toLocaleString()}</td></tr>`)
    .join('');

  // New vs returning
  const nvrRows = c.newVsReturning.map(r =>
    `<tr><td>${escHtml(r.newVsReturning || '(not set)')}</td><td class="num">${r.sessions.toLocaleString()}</td></tr>`
  ).join('');

  // Trend mini-chart (4 weeks)
  const allWeeks = [...weeks, current];
  const maxWeekConv = Math.max(...allWeeks.map(w => w.totalConversions), 1);
  const maxWeekSess = Math.max(...allWeeks.map(w => w.sessions), 1);
  const trendBars = allWeeks.map((w, i) => {
    const isCurrentWeek = i === allWeeks.length - 1;
    const convPct = Math.round(w.totalConversions / maxWeekConv * 100);
    const sessPct = Math.round(w.sessions / maxWeekSess * 100);
    const weekLabel = isCurrentWeek ? 'This wk' : `${w.startDate.slice(5)}`;
    return `<div class="trend-col">
      <div class="trend-bars">
        <div class="trend-bar sessions" style="height:${sessPct}%;" title="${w.sessions} sessions"></div>
        <div class="trend-bar conversions" style="height:${convPct}%;" title="${w.totalConversions} conversions"></div>
      </div>
      <div class="trend-label${isCurrentWeek ? ' current' : ''}">${weekLabel}</div>
      <div class="trend-value">${w.totalConversions} leads</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Weekly Performance — Attack A Crack</title>
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
  tr:hover { background: #f0f9ff; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  @media (max-width: 768px) { .two-col, .three-col { grid-template-columns: 1fr; } }

  /* Daily sparkline */
  .sparkline { display: flex; align-items: flex-end; gap: 3px; height: 80px; background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1rem; }
  .spark-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
  .spark-bar { width: 100%; background: #2563eb; border-radius: 2px 2px 0 0; min-height: 2px; margin-top: auto; }
  .spark-label { font-size: 0.6rem; color: #9ca3af; margin-top: 4px; }

  /* Trend chart */
  .trend-chart { display: flex; align-items: flex-end; gap: 8px; height: 120px; background: white; border-radius: 8px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1rem; }
  .trend-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
  .trend-bars { flex: 1; display: flex; gap: 2px; align-items: flex-end; width: 100%; }
  .trend-bar { flex: 1; border-radius: 2px 2px 0 0; min-height: 2px; }
  .trend-bar.sessions { background: #cbd5e1; }
  .trend-bar.conversions { background: #059669; }
  .trend-label { font-size: 0.65rem; color: #9ca3af; margin-top: 4px; white-space: nowrap; }
  .trend-label.current { color: #1a1a1a; font-weight: 700; }
  .trend-value { font-size: 0.65rem; color: #6b7280; }
  .legend { display: flex; gap: 1rem; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem; }
  .legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
</style>
</head>
<body>
  <h1>Weekly Performance</h1>
  <p class="meta">${c.startDate} to ${c.endDate} &mdash; Generated ${new Date(report.generatedAt).toLocaleString()}</p>

  <div class="cards">
    <div class="card">
      <div class="label">Total Leads</div>
      <div class="value">${c.totalConversions}</div>
      <div class="trend">${trend(c.totalConversions, p.totalConversions)} vs prior week</div>
    </div>
    <div class="card">
      <div class="label">Sessions</div>
      <div class="value">${c.sessions.toLocaleString()}</div>
      <div class="trend">${trend(c.sessions, p.sessions)} vs prior week</div>
    </div>
    <div class="card">
      <div class="label">Conv Rate</div>
      <div class="value">${c.convRate}%</div>
      <div class="trend">${trend(c.convRate, p.convRate)} vs prior week</div>
    </div>
    <div class="card">
      <div class="label">CT Calls</div>
      <div class="value ct">${c.ctCalls}</div>
    </div>
    <div class="card">
      <div class="label">MA Calls</div>
      <div class="value ma">${c.maCalls}</div>
    </div>
    <div class="card">
      <div class="label">CT Texts</div>
      <div class="value ct">${c.ctTexts}</div>
    </div>
    <div class="card">
      <div class="label">MA Texts</div>
      <div class="value ma">${c.maTexts}</div>
    </div>
    <div class="card">
      <div class="label">Users</div>
      <div class="value">${c.users.toLocaleString()}</div>
      <div class="trend">${trend(c.users, p.users)} vs prior week</div>
    </div>
  </div>

  <h2>4-Week Trend</h2>
  <div class="legend">
    <span><span class="legend-dot" style="background:#cbd5e1;"></span>Sessions</span>
    <span><span class="legend-dot" style="background:#059669;"></span>Conversions</span>
  </div>
  <div class="trend-chart">${trendBars}</div>

  <h2>Daily Sessions</h2>
  <div class="sparkline">${dailyBars}</div>

  <h2>Top Landing Pages</h2>
  <div class="table-wrap"><table>
    <thead><tr><th>Landing Page</th><th style="text-align:right">Sessions</th><th style="text-align:right">Conversions</th><th style="text-align:right">Conv Rate</th></tr></thead>
    <tbody>${landingRows}</tbody>
  </table></div>

  <h2>Conversion Breakdown</h2>
  <div class="three-col">
    <div>
      <h3>Click Location</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Location</th><th style="text-align:right">Count</th></tr></thead>
        <tbody>${clickLocRows}</tbody>
      </table></div>
    </div>
    <div>
      <h3>Traffic Channel</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Channel</th><th style="text-align:right">Sessions</th><th style="text-align:right">Users</th></tr></thead>
        <tbody>${channelRows}</tbody>
      </table></div>
    </div>
    <div>
      <h3>Device</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Device</th><th style="text-align:right">Sessions</th><th style="text-align:right">Users</th></tr></thead>
        <tbody>${deviceRows}</tbody>
      </table></div>
    </div>
  </div>

  <h3>New vs Returning</h3>
  <div class="table-wrap" style="max-width:300px;"><table>
    <thead><tr><th>Type</th><th style="text-align:right">Sessions</th></tr></thead>
    <tbody>${nvrRows}</tbody>
  </table></div>

  <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:0.75rem;">
    Attack A Crack &mdash; Weekly Performance Report &mdash; Raw data: data/reports/weekly.json
  </div>
</body>
</html>`;
}

async function main() {
  const endDate = daysAgo(1);
  const startDate = daysAgo(DAYS);
  console.log(`\n📈 Weekly Performance Report (${startDate} to ${endDate})\n`);

  const auth = await authorize();
  const api = google.analyticsdata({ version: 'v1beta', auth });

  // Fetch current week + 3 prior weeks for trend
  console.log('  Fetching current period...');
  const current = await fetchWeekData(api, startDate, endDate);

  const weeks = [];
  for (let i = 1; i <= 3; i++) {
    const wEnd = daysAgo(1 + DAYS * i);
    const wStart = daysAgo(DAYS + DAYS * i);
    console.log(`  Fetching week ${i} prior (${wStart} to ${wEnd})...`);
    weeks.push(await fetchWeekData(api, wStart, wEnd));
  }

  const previous = weeks[0]; // most recent prior week

  const report = {
    generatedAt: new Date().toISOString(),
    period: { startDate, endDate, days: DAYS },
    current,
    previous,
    weeks: weeks.reverse(), // oldest first for chart
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, 'weekly.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(REPORTS_DIR, 'weekly.html'), generateHTML(report));

  // Console output
  console.log('\n' + '='.repeat(50));
  console.log('  WEEKLY PERFORMANCE');
  console.log('='.repeat(50));
  console.log(`  Sessions: ${current.sessions} (${current.sessions > previous.sessions ? '▲' : '▼'} vs prior week: ${previous.sessions})`);
  console.log(`  Leads: ${current.totalConversions} (${current.totalConversions > previous.totalConversions ? '▲' : '▼'} vs prior: ${previous.totalConversions})`);
  console.log(`  Conv Rate: ${current.convRate}%`);
  console.log(`  CT: ${current.ctCalls} calls, ${current.ctTexts} texts`);
  console.log(`  MA: ${current.maCalls} calls, ${current.maTexts} texts`);
  console.log(`\n  Report: data/reports/weekly.html`);
  console.log('='.repeat(50) + '\n');
}

main().catch(err => {
  console.error('❌ Weekly report failed:', err.message);
  process.exit(1);
});
