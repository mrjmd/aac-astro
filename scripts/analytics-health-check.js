/**
 * Analytics Health Check
 *
 * Queries GA4 Data API to verify all custom events and dimensions are flowing.
 * Shows event counts, dimension values, and flags anything missing or broken.
 *
 * Output:
 *   - data/reports/analytics-health.json (raw data)
 *   - data/reports/analytics-health.html (browser-friendly dashboard)
 *
 * Usage:
 *   npm run report:health              # last 7 days (default)
 *   npm run report:health -- --days 14 # custom period
 *   npm run report:health -- --days 1  # just yesterday (quick check)
 */

import { google } from 'googleapis';
import { authorize } from './lib/project-import-core.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = join(__dirname, '..', 'data', 'reports');
const GA4_PROPERTY = 'properties/347942677';

// Parse CLI args
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 7;

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

// Expected events and the dimensions each should carry
const EXPECTED_EVENTS = [
  {
    name: 'phone_call_click',
    dimensions: ['customEvent:phone_region', 'customEvent:click_location'],
    critical: true,
  },
  {
    name: 'text_message_click',
    dimensions: ['customEvent:phone_region', 'customEvent:click_location'],
    critical: true,
  },
  {
    name: 'call_modal_open',
    dimensions: ['customEvent:page_type'],
    critical: false,
  },
  {
    name: 'text_photos_modal_open',
    dimensions: ['customEvent:page_type'],
    critical: false,
  },
  {
    name: 'scroll_depth',
    dimensions: ['customEvent:depth', 'customEvent:page_type'],
    critical: false,
  },
  {
    name: 'blog_read_complete',
    dimensions: ['customEvent:post_slug'],
    critical: false,
  },
  {
    name: 'video_play',
    dimensions: ['customEvent:video_id', 'customEvent:video_title'],
    critical: false,
  },
  {
    name: 'video_complete',
    dimensions: ['customEvent:video_id', 'customEvent:video_title'],
    critical: false,
  },
];

// Known valid values for key dimensions
const EXPECTED_VALUES = {
  'customEvent:phone_region': ['CT', 'MA'],
  'customEvent:click_location': ['navbar', 'footer', 'modal', 'hero', 'sticky_cta', 'inline'],
  'customEvent:depth': ['25%', '50%', '75%', '100%'],
  'customEvent:page_type': ['home', 'city', 'service', 'blog', 'about', 'hub', 'partner', 'project', 'legal', 'other'],
};

async function main() {
  const startDate = daysAgo(days);
  const endDate = daysAgo(1);
  console.log(`\n🩺 Analytics Health Check (${startDate} to ${endDate})\n`);

  const auth = await authorize();
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
  const dateRanges = [{ startDate, endDate }];

  const results = {
    period: { startDate, endDate, days },
    generatedAt: new Date().toISOString(),
    events: [],
    summary: { total: 0, healthy: 0, noData: 0, issues: 0 },
  };

  // 1. Get total event counts for all our custom events
  console.log('  Checking event counts...');
  const eventCountRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        orGroup: {
          expressions: EXPECTED_EVENTS.map(e => ({
            filter: {
              fieldName: 'eventName',
              stringFilter: { value: e.name, matchType: 'EXACT' },
            },
          })),
        },
      },
    },
  });
  const eventCounts = {};
  for (const row of parseGA4Report(eventCountRes)) {
    eventCounts[row.eventName] = row.eventCount;
  }

  // 2. For each event, query its dimensions to verify they're populated
  for (const evt of EXPECTED_EVENTS) {
    const count = eventCounts[evt.name] || 0;
    const eventResult = {
      name: evt.name,
      count,
      critical: evt.critical,
      status: 'healthy',
      dimensions: [],
      issues: [],
    };

    if (count === 0) {
      eventResult.status = 'no_data';
      if (evt.critical) {
        eventResult.issues.push(`⚠️  CRITICAL: No ${evt.name} events in ${days} days`);
      } else {
        eventResult.issues.push(`No ${evt.name} events (may be normal if no one triggered this action)`);
      }
    } else {
      // Query each dimension for this event
      console.log(`  Checking ${evt.name} dimensions (${count} events)...`);
      for (const dim of evt.dimensions) {
        try {
          const dimRes = await analyticsdata.properties.runReport({
            property: GA4_PROPERTY,
            requestBody: {
              dateRanges,
              dimensions: [{ name: dim }],
              metrics: [{ name: 'eventCount' }],
              dimensionFilter: {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: { value: evt.name, matchType: 'EXACT' },
                },
              },
            },
          });
          const dimRows = parseGA4Report(dimRes);
          const values = dimRows.map(r => ({
            value: r[dim],
            count: r.eventCount,
          }));

          const dimResult = {
            name: dim,
            values,
            status: 'healthy',
            issues: [],
          };

          // Check for (not set) values
          const notSet = values.find(v => v.value === '(not set)');
          if (notSet) {
            dimResult.issues.push(`${notSet.count} events with (not set) — dimension may not be registered or not sent`);
            dimResult.status = 'warning';
          }

          // Check for unexpected values
          if (EXPECTED_VALUES[dim]) {
            const unexpected = values.filter(v =>
              v.value !== '(not set)' && !EXPECTED_VALUES[dim].includes(v.value)
            );
            if (unexpected.length > 0) {
              dimResult.issues.push(`Unexpected values: ${unexpected.map(v => `"${v.value}" (${v.count}x)`).join(', ')}`);
              dimResult.status = 'warning';
            }
          }

          // Check if all values are (not set) — dimension is broken
          if (values.length > 0 && values.every(v => v.value === '(not set)')) {
            dimResult.status = 'broken';
            dimResult.issues.push(`ALL values are (not set) — dimension "${dim}" is likely not registered in GA4 Admin`);
          }

          eventResult.dimensions.push(dimResult);

          if (dimResult.status === 'broken') {
            eventResult.status = 'issue';
            eventResult.issues.push(`Dimension ${dim} is broken`);
          } else if (dimResult.status === 'warning' && eventResult.status === 'healthy') {
            eventResult.status = 'warning';
          }
        } catch (err) {
          eventResult.dimensions.push({
            name: dim,
            values: [],
            status: 'error',
            issues: [`API error: ${err.message}`],
          });
          eventResult.status = 'issue';
          eventResult.issues.push(`Failed to query ${dim}: ${err.message}`);
        }
      }
    }

    results.events.push(eventResult);
    results.summary.total++;
    if (eventResult.status === 'healthy') results.summary.healthy++;
    else if (eventResult.status === 'no_data') results.summary.noData++;
    else results.summary.issues++;
  }

  // 3. Check page_type coverage across all pages
  console.log('  Checking page_type coverage...');
  const pageTypeRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'customEvent:page_type' }],
      metrics: [{ name: 'sessions' }],
    },
  });
  const pageTypes = parseGA4Report(pageTypeRes);
  results.pageTypeCoverage = pageTypes.map(r => ({
    type: r['customEvent:page_type'],
    sessions: r.sessions,
  })).sort((a, b) => b.sessions - a.sessions);

  const unknownPages = pageTypes.find(r => r['customEvent:page_type'] === 'unknown');
  const notSetPages = pageTypes.find(r => r['customEvent:page_type'] === '(not set)');
  if (unknownPages && unknownPages.sessions > 10) {
    results.summary.issues++;
    results.pageTypeIssue = `${unknownPages.sessions} sessions with page_type="unknown" — some pages may be missing the pageType prop`;
  }
  if (notSetPages && notSetPages.sessions > 10) {
    results.summary.issues++;
    results.pageTypeIssue = `${notSetPages.sessions} sessions with page_type=(not set) — dimension may not be registered`;
  }

  // 4. Check click_location distribution for conversion events
  console.log('  Checking click location distribution...');
  const clickLocRes = await analyticsdata.properties.runReport({
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'customEvent:click_location' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        orGroup: {
          expressions: [
            { filter: { fieldName: 'eventName', stringFilter: { value: 'phone_call_click', matchType: 'EXACT' } } },
            { filter: { fieldName: 'eventName', stringFilter: { value: 'text_message_click', matchType: 'EXACT' } } },
          ],
        },
      },
    },
  });
  results.clickLocationBreakdown = parseGA4Report(clickLocRes).map(r => ({
    location: r['customEvent:click_location'],
    count: r.eventCount,
  })).sort((a, b) => b.count - a.count);

  // Save results
  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, 'analytics-health.json'), JSON.stringify(results, null, 2));
  writeFileSync(join(REPORTS_DIR, 'analytics-health.html'), generateHTML(results));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('  ANALYTICS HEALTH CHECK RESULTS');
  console.log('='.repeat(60));

  for (const evt of results.events) {
    const icon = evt.status === 'healthy' ? '✅' :
                 evt.status === 'no_data' ? '⬜' :
                 evt.status === 'warning' ? '⚠️ ' : '❌';
    console.log(`\n${icon} ${evt.name}: ${evt.count} events`);

    for (const dim of evt.dimensions) {
      const dimIcon = dim.status === 'healthy' ? '  ✓' :
                      dim.status === 'warning' ? '  ⚠' : '  ✗';
      const vals = dim.values.map(v => `${v.value}(${v.count})`).join(', ');
      console.log(`${dimIcon} ${dim.name}: ${vals}`);
      for (const issue of dim.issues) {
        console.log(`      → ${issue}`);
      }
    }

    for (const issue of evt.issues) {
      console.log(`    ${issue}`);
    }
  }

  console.log('\n📊 Page Type Coverage:');
  for (const pt of results.pageTypeCoverage) {
    console.log(`  ${pt.type}: ${pt.sessions} sessions`);
  }
  if (results.pageTypeIssue) {
    console.log(`  ⚠️  ${results.pageTypeIssue}`);
  }

  console.log('\n🖱️  Click Location Breakdown (phone + text):');
  for (const cl of results.clickLocationBreakdown) {
    console.log(`  ${cl.location}: ${cl.count}`);
  }

  const { healthy, noData, issues, total } = results.summary;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${healthy}/${total} healthy | ${noData} no data | ${issues} issues`);
  console.log(`  Report: data/reports/analytics-health.html`);
  console.log('='.repeat(60) + '\n');

  if (issues > 0) process.exit(1);
}

function generateHTML(results) {
  const statusColor = (s) =>
    s === 'healthy' ? '#16a34a' :
    s === 'no_data' ? '#9ca3af' :
    s === 'warning' ? '#d97706' : '#dc2626';

  const statusLabel = (s) =>
    s === 'healthy' ? 'Healthy' :
    s === 'no_data' ? 'No Data' :
    s === 'warning' ? 'Warning' : 'Issue';

  const eventRows = results.events.map(evt => {
    const dimDetails = evt.dimensions.map(dim => {
      const vals = dim.values.map(v =>
        `<span style="display:inline-block;background:#f1f5f9;padding:2px 8px;border-radius:4px;margin:2px;font-size:13px;${v.value === '(not set)' ? 'color:#dc2626;' : ''}">${v.value} <strong>${v.count}</strong></span>`
      ).join('');
      const issues = dim.issues.map(i => `<div style="color:#d97706;font-size:12px;margin-top:4px;">⚠ ${i}</div>`).join('');
      return `
        <div style="margin:8px 0;padding:8px;background:#fafafa;border-radius:6px;">
          <div style="font-size:13px;color:#64748b;margin-bottom:4px;">${dim.name.replace('customEvent:', '')}</div>
          <div>${vals || '<span style="color:#9ca3af">No values</span>'}</div>
          ${issues}
        </div>
      `;
    }).join('');

    const issues = evt.issues.map(i => `<div style="color:${evt.critical ? '#dc2626' : '#d97706'};font-size:13px;margin-top:4px;">${i}</div>`).join('');

    return `
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:12px 0;${evt.status === 'issue' ? 'border-color:#fca5a5;background:#fef2f2;' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong style="font-size:16px;">${evt.name}</strong>
            ${evt.critical ? '<span style="background:#fee2e2;color:#dc2626;font-size:11px;padding:2px 6px;border-radius:4px;margin-left:8px;">CONVERSION</span>' : ''}
          </div>
          <div>
            <span style="background:${statusColor(evt.status)};color:white;padding:4px 12px;border-radius:20px;font-size:13px;">${statusLabel(evt.status)}</span>
            <span style="font-size:20px;font-weight:bold;margin-left:12px;">${evt.count.toLocaleString()}</span>
          </div>
        </div>
        ${dimDetails}
        ${issues}
      </div>
    `;
  }).join('');

  const pageTypeRows = results.pageTypeCoverage.map(pt => `
    <tr>
      <td style="padding:6px 12px;">${pt.type}</td>
      <td style="padding:6px 12px;text-align:right;font-weight:bold;">${pt.sessions.toLocaleString()}</td>
    </tr>
  `).join('');

  const clickLocRows = results.clickLocationBreakdown.map(cl => `
    <tr>
      <td style="padding:6px 12px;">${cl.location}</td>
      <td style="padding:6px 12px;text-align:right;font-weight:bold;">${cl.count.toLocaleString()}</td>
    </tr>
  `).join('');

  const { healthy, noData, issues, total } = results.summary;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Analytics Health Check — Attack A Crack</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #64748b; margin-bottom: 24px; }
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
    .card { background: white; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
    .card .number { font-size: 32px; font-weight: bold; }
    .card .label { color: #64748b; font-size: 13px; margin-top: 4px; }
    h2 { font-size: 18px; margin: 32px 0 12px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 13px; color: #64748b; }
    td { border-top: 1px solid #f1f5f9; }
    tr:hover { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>Analytics Health Check</h1>
  <div class="subtitle">${results.period.startDate} to ${results.period.endDate} (${results.period.days} days) &mdash; Generated ${new Date(results.generatedAt).toLocaleString()}</div>

  <div class="summary-cards">
    <div class="card">
      <div class="number">${total}</div>
      <div class="label">Events Checked</div>
    </div>
    <div class="card">
      <div class="number" style="color:#16a34a;">${healthy}</div>
      <div class="label">Healthy</div>
    </div>
    <div class="card">
      <div class="number" style="color:#9ca3af;">${noData}</div>
      <div class="label">No Data</div>
    </div>
    <div class="card">
      <div class="number" style="color:${issues > 0 ? '#dc2626' : '#16a34a'};">${issues}</div>
      <div class="label">Issues</div>
    </div>
  </div>

  <h2>Event Status</h2>
  ${eventRows}

  <h2>Page Type Coverage</h2>
  <table>
    <tr><th>Page Type</th><th style="text-align:right;">Sessions</th></tr>
    ${pageTypeRows}
  </table>
  ${results.pageTypeIssue ? `<div style="color:#d97706;margin-top:8px;">⚠ ${results.pageTypeIssue}</div>` : ''}

  <h2>Click Location Breakdown (Conversions)</h2>
  <table>
    <tr><th>Location</th><th style="text-align:right;">Events</th></tr>
    ${clickLocRows}
  </table>
  ${results.clickLocationBreakdown.length === 0 ? '<div style="color:#9ca3af;margin-top:8px;">No conversion clicks yet</div>' : ''}

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
    Attack A Crack &mdash; Analytics Health Check &mdash; Raw data: data/reports/analytics-health.json
  </div>
</body>
</html>`;
}

main().catch(err => {
  console.error('❌ Health check failed:', err.message);
  process.exit(1);
});
