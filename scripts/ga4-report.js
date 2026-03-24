#!/usr/bin/env node

/**
 * Google Analytics 4 Report
 *
 * Pulls page performance, conversion events, and traffic sources from
 * the GA4 Data API. Outputs JSON to data/reports/ga4-report.json.
 *
 * Usage:
 *   node scripts/ga4-report.js              # last 30 days
 *   node scripts/ga4-report.js --days 90    # last 90 days
 */

import { google } from 'googleapis';
import { writeFile, mkdir } from 'fs/promises';
import { authorize } from './lib/project-import-core.js';

const PROPERTY_ID = '347942677';
const PROPERTY = `properties/${PROPERTY_ID}`;
const OUTPUT_PATH = 'data/reports/ga4-report.json';

// Parse CLI args
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 30;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Parse GA4 runReport response into simple objects */
function parseReport(response) {
  const headers = response.data.dimensionHeaders?.map(h => h.name) || [];
  const metricHeaders = response.data.metricHeaders?.map(h => h.name) || [];
  const rows = response.data.rows || [];

  return rows.map(row => {
    const obj = {};
    row.dimensionValues?.forEach((v, i) => { obj[headers[i]] = v.value; });
    row.metricValues?.forEach((v, i) => {
      const val = v.value;
      obj[metricHeaders[i]] = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
    });
    return obj;
  });
}

async function main() {
  console.log(`\n📊 GA4 Report (last ${DAYS} days)\n`);

  const auth = await authorize();
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });

  const startDate = `${DAYS}daysAgo`;
  const endDate = 'today';

  // 1. Page Performance
  console.log('  Fetching page performance...');
  const pageRes = await analyticsdata.properties.runReport({
    property: PROPERTY,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 200,
    },
  });
  const pagePerformance = parseReport(pageRes);

  // 2. Conversion Events by Page
  console.log('  Fetching conversion events...');
  let conversionsByPage = [];
  try {
    const convRes = await analyticsdata.properties.runReport({
      property: PROPERTY,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'pagePath' },
          { name: 'eventName' },
        ],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: ['phone_call_click', 'text_message_click', 'page_not_found'],
            },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      },
    });
    conversionsByPage = parseReport(convRes);
  } catch (err) {
    console.log('  ⚠️  Conversion events query returned no data (events may not have fired yet)');
  }

  // 3. Traffic Sources
  console.log('  Fetching traffic sources...');
  const srcRes = await analyticsdata.properties.runReport({
    property: PROPERTY,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    },
  });
  const trafficSources = parseReport(srcRes);

  // 4. Device breakdown
  console.log('  Fetching device breakdown...');
  const deviceRes = await analyticsdata.properties.runReport({
    property: PROPERTY,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    },
  });
  const deviceBreakdown = parseReport(deviceRes);

  // Summary calculations
  const totalSessions = pagePerformance.reduce((sum, p) => sum + (p.sessions || 0), 0);
  const phoneCalls = conversionsByPage
    .filter(c => c.eventName === 'phone_call_click')
    .reduce((sum, c) => sum + (c.eventCount || 0), 0);
  const textMessages = conversionsByPage
    .filter(c => c.eventName === 'text_message_click')
    .reduce((sum, c) => sum + (c.eventCount || 0), 0);
  const totalConversions = phoneCalls + textMessages;

  // Find top converting page
  const convByPage = {};
  conversionsByPage
    .filter(c => c.eventName === 'phone_call_click' || c.eventName === 'text_message_click')
    .forEach(c => {
      convByPage[c.pagePath] = (convByPage[c.pagePath] || 0) + (c.eventCount || 0);
    });
  const topConvertingPage = Object.entries(convByPage).sort((a, b) => b[1] - a[1])[0];

  const report = {
    generatedAt: new Date().toISOString(),
    period: { days: DAYS, start: daysAgo(DAYS), end: daysAgo(0) },
    property: PROPERTY_ID,
    pagePerformance,
    conversionsByPage,
    trafficSources,
    deviceBreakdown,
    summary: {
      totalSessions,
      totalPhoneCalls: phoneCalls,
      totalTextMessages: textMessages,
      totalConversions,
      overallConversionRate: totalSessions > 0
        ? Math.round(totalConversions / totalSessions * 10000) / 100
        : 0,
      topConvertingPage: topConvertingPage ? topConvertingPage[0] : null,
    },
  };

  // Write output
  await mkdir('data/reports', { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));

  // Console summary
  console.log(`\n  ✅ Report saved to ${OUTPUT_PATH}\n`);
  console.log(`  Summary:`);
  console.log(`    Sessions: ${totalSessions.toLocaleString()}`);
  console.log(`    Phone calls: ${phoneCalls}`);
  console.log(`    Text messages: ${textMessages}`);
  console.log(`    Conversion rate: ${report.summary.overallConversionRate}%`);
  if (topConvertingPage) {
    console.log(`    Top converting page: ${topConvertingPage[0]} (${topConvertingPage[1]} conversions)`);
  }

  if (trafficSources.length > 0) {
    console.log(`\n  Traffic sources:`);
    trafficSources.slice(0, 10).forEach((s, i) => {
      console.log(`    ${i + 1}. ${s.sessionSource}/${s.sessionMedium} — ${s.sessions} sessions`);
    });
  }

  if (deviceBreakdown.length > 0) {
    console.log(`\n  Devices:`);
    deviceBreakdown.forEach(d => {
      console.log(`    ${d.deviceCategory}: ${d.sessions} sessions (${Math.round(d.bounceRate * 100)}% bounce)`);
    });
  }

  if (pagePerformance.length > 0) {
    console.log(`\n  Top 10 pages by sessions:`);
    pagePerformance.slice(0, 10).forEach((p, i) => {
      console.log(`    ${i + 1}. ${p.pagePath} — ${p.sessions} sessions`);
    });
  }
}

main().catch(err => {
  console.error('❌ GA4 report failed:', err.message);
  process.exit(1);
});
