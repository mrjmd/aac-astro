/**
 * Seasonal Benchmark Script
 *
 * Takes a monthly snapshot of key metrics and appends to a running benchmark file.
 * Over time, builds YoY comparison data so seasonal dips don't look like crises.
 *
 * Output:
 *   - data/reports/seasonal-benchmarks.json (running history)
 *   - data/reports/seasonal-benchmarks.html (browser-friendly trend view)
 *
 * Usage:
 *   npm run report:benchmark              # last full calendar month
 *   npm run report:benchmark -- --days 30 # custom period (last N days)
 *   npm run report:benchmark -- --month 2026-03  # specific month
 */

import { google } from 'googleapis';
import { authorize } from './lib/project-import-core.js';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'data', 'reports');
const BENCHMARK_FILE = join(REPORTS_DIR, 'seasonal-benchmarks.json');
const GA4_PROPERTY = 'properties/347942677';

// Parse CLI args
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const monthIdx = args.indexOf('--month');

let startDate, endDate, periodLabel;

if (monthIdx !== -1) {
  // Specific month: --month 2026-03
  const [year, month] = args[monthIdx + 1].split('-').map(Number);
  startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  periodLabel = args[monthIdx + 1];
} else if (daysIdx !== -1) {
  // Custom period: --days 30
  const days = parseInt(args[daysIdx + 1], 10);
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  startDate = start.toISOString().split('T')[0];
  endDate = end.toISOString().split('T')[0];
  periodLabel = `${startDate}_to_${endDate}`;
} else {
  // Default: last full calendar month
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  periodLabel = `${year}-${String(month).padStart(2, '0')}`;
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
  console.log(`\n📊 Seasonal Benchmark: ${periodLabel} (${startDate} to ${endDate})\n`);

  const auth = await authorize();
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
  const dateRanges = [{ startDate, endDate }];

  // 1. Total sessions + page type breakdown
  console.log('  Fetching sessions...');
  const sessionsRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'customEvent:page_type' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    },
  });
  const sessionsByType = parseGA4Report(sessionsRes);

  // 2. Phone calls by region
  console.log('  Fetching calls...');
  const callsRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'customEvent:phone_region' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'phone_call_click', matchType: 'EXACT' },
        },
      },
    },
  });
  const callsByRegion = parseGA4Report(callsRes);

  // 3. Text messages by region
  console.log('  Fetching texts...');
  const textsRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'customEvent:phone_region' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'text_message_click', matchType: 'EXACT' },
        },
      },
    },
  });
  const textsByRegion = parseGA4Report(textsRes);

  // 4. Traffic sources
  console.log('  Fetching traffic sources...');
  const sourcesRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    },
  });
  const trafficSources = parseGA4Report(sourcesRes);

  // 5. Device breakdown
  console.log('  Fetching device data...');
  const deviceRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }],
    },
  });
  const deviceBreakdown = parseGA4Report(deviceRes);

  // 6. Build snapshot
  const totalSessions = sessionsByType.reduce((s, r) => s + (r.sessions || 0), 0);
  const totalUsers = sessionsByType.reduce((s, r) => s + (r.activeUsers || 0), 0);
  const calls_ct = callsByRegion.find(r => r['customEvent:phone_region'] === 'CT')?.eventCount || 0;
  const calls_ma = callsByRegion.find(r => r['customEvent:phone_region'] === 'MA')?.eventCount || 0;
  const texts_ct = textsByRegion.find(r => r['customEvent:phone_region'] === 'CT')?.eventCount || 0;
  const texts_ma = textsByRegion.find(r => r['customEvent:phone_region'] === 'MA')?.eventCount || 0;
  const totalConversions = calls_ct + calls_ma + texts_ct + texts_ma;

  const snapshot = {
    period: periodLabel,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    sessions: totalSessions,
    users: totalUsers,
    calls_ct,
    calls_ma,
    texts_ct,
    texts_ma,
    total_conversions: totalConversions,
    conv_rate: totalSessions > 0 ? Math.round(totalConversions / totalSessions * 1000) / 10 : 0,
    sessions_by_type: Object.fromEntries(
      sessionsByType
        .filter(r => r['customEvent:page_type'])
        .map(r => [r['customEvent:page_type'], r.sessions])
    ),
    traffic_sources: Object.fromEntries(
      trafficSources.map(r => [r.sessionDefaultChannelGroup, r.sessions])
    ),
    device_breakdown: Object.fromEntries(
      deviceBreakdown.map(r => [r.deviceCategory, r.sessions])
    ),
  };

  // 7. Load existing benchmarks and append/update
  mkdirSync(REPORTS_DIR, { recursive: true });
  let benchmarks = [];
  if (existsSync(BENCHMARK_FILE)) {
    try {
      benchmarks = JSON.parse(readFileSync(BENCHMARK_FILE, 'utf-8'));
    } catch { benchmarks = []; }
  }

  // Replace if same period already exists, otherwise append
  const existingIdx = benchmarks.findIndex(b => b.period === periodLabel);
  if (existingIdx !== -1) {
    benchmarks[existingIdx] = snapshot;
    console.log(`  Updated existing benchmark for ${periodLabel}`);
  } else {
    benchmarks.push(snapshot);
    benchmarks.sort((a, b) => a.startDate.localeCompare(b.startDate));
    console.log(`  Added new benchmark for ${periodLabel}`);
  }

  writeFileSync(BENCHMARK_FILE, JSON.stringify(benchmarks, null, 2));
  console.log(`  ✅ Benchmarks saved: ${BENCHMARK_FILE}`);

  // 8. Generate HTML
  const htmlPath = join(REPORTS_DIR, 'seasonal-benchmarks.html');
  writeFileSync(htmlPath, generateHTML(benchmarks));
  console.log(`  ✅ HTML saved: ${htmlPath}`);
  console.log(`\n  Open in browser: file://${htmlPath}\n`);

  // 9. Print to terminal
  console.log('  ── Snapshot ──────────────────────────────────────');
  console.log(`  Period:      ${periodLabel}`);
  console.log(`  Sessions:    ${totalSessions.toLocaleString()}`);
  console.log(`  Users:       ${totalUsers.toLocaleString()}`);
  console.log(`  CT Calls:    ${calls_ct}  |  MA Calls: ${calls_ma}`);
  console.log(`  CT Texts:    ${texts_ct}  |  MA Texts: ${texts_ma}`);
  console.log(`  Total Leads: ${totalConversions}`);
  console.log(`  Conv Rate:   ${snapshot.conv_rate}%`);
  console.log(`  Mobile:      ${snapshot.device_breakdown.mobile || 0} sessions`);
  console.log(`  Desktop:     ${snapshot.device_breakdown.desktop || 0} sessions`);
  console.log('  ─────────────────────────────────────────────────\n');
}

function generateHTML(benchmarks) {
  const latest = benchmarks[benchmarks.length - 1];

  const trendRows = benchmarks.map(b => `
    <tr>
      <td>${b.period}</td>
      <td class="num">${b.sessions.toLocaleString()}</td>
      <td class="num">${b.users.toLocaleString()}</td>
      <td class="num ct">${b.calls_ct}</td>
      <td class="num ma">${b.calls_ma}</td>
      <td class="num ct">${b.texts_ct}</td>
      <td class="num ma">${b.texts_ma}</td>
      <td class="num highlight">${b.total_conversions}</td>
      <td class="num">${b.conv_rate}%</td>
    </tr>`).join('');

  // Simple bar chart using CSS
  const maxSessions = Math.max(...benchmarks.map(b => b.sessions), 1);
  const maxConv = Math.max(...benchmarks.map(b => b.total_conversions), 1);

  const chartBars = benchmarks.map(b => {
    const sessionPct = Math.round(b.sessions / maxSessions * 100);
    const convPct = Math.round(b.total_conversions / maxConv * 100);
    return `
    <div class="chart-row">
      <div class="chart-label">${b.period}</div>
      <div class="chart-bars">
        <div class="bar sessions" style="width: ${sessionPct}%"><span>${b.sessions.toLocaleString()}</span></div>
        <div class="bar conversions" style="width: ${convPct}%"><span>${b.total_conversions}</span></div>
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Seasonal Benchmarks — Attack A Crack</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a1a; padding: 2rem; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
  h2 { font-size: 1.1rem; margin: 2rem 0 0.75rem; }
  .table-wrap { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  th { background: #1a1a1a; color: white; padding: 0.625rem 0.75rem; text-align: left; font-weight: 600; white-space: nowrap; }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; white-space: nowrap; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.ct { color: #2563eb; }
  td.ma { color: #059669; }
  td.highlight { font-weight: 700; }
  tr:hover { background: #f0f9ff; }
  .chart-container { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 2rem; }
  .chart-row { display: flex; align-items: center; margin-bottom: 0.75rem; }
  .chart-label { width: 80px; font-size: 0.8125rem; font-weight: 600; flex-shrink: 0; }
  .chart-bars { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .bar { height: 22px; border-radius: 3px; display: flex; align-items: center; padding: 0 8px; font-size: 0.75rem; color: white; font-weight: 600; min-width: 30px; transition: width 0.3s; }
  .bar.sessions { background: #94a3b8; }
  .bar.conversions { background: #059669; }
  .legend { display: flex; gap: 1.5rem; margin-bottom: 1rem; font-size: 0.8125rem; }
  .legend-item { display: flex; align-items: center; gap: 0.375rem; }
  .legend-swatch { width: 14px; height: 14px; border-radius: 3px; }
</style>
</head>
<body>
  <h1>Seasonal Benchmarks</h1>
  <p class="meta">${benchmarks.length} month(s) tracked &mdash; Last updated ${latest ? new Date(latest.generatedAt).toLocaleString() : 'never'}</p>

  <h2>Trend</h2>
  <div class="chart-container">
    <div class="legend">
      <div class="legend-item"><div class="legend-swatch" style="background:#94a3b8"></div> Sessions</div>
      <div class="legend-item"><div class="legend-swatch" style="background:#059669"></div> Conversions</div>
    </div>
    ${chartBars}
  </div>

  <h2>Monthly Data</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Period</th>
          <th>Sessions</th>
          <th>Users</th>
          <th>Calls CT</th>
          <th>Calls MA</th>
          <th>Texts CT</th>
          <th>Texts MA</th>
          <th>Total Conv</th>
          <th>Conv Rate</th>
        </tr>
      </thead>
      <tbody>${trendRows}</tbody>
    </table>
  </div>
</body>
</html>`;
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
