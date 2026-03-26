/**
 * Conversion Journey Analytics
 *
 * Analyzes conversion patterns using GA4 Data API aggregate queries.
 * Calculates data-derived intent signals (conversion lift per page/event),
 * identifies critical path pages, and compares converter vs non-converter behavior.
 *
 * NOTE: The GA4 Data API does not expose userPseudoId natively. We capture the
 * GA4 client ID from the _ga cookie and send it as a user-scoped custom dimension
 * (client_id). Once 24 hours of data accumulates, this script will be upgraded
 * to use customUser:client_id for full per-user journey reconstruction.
 *
 * Outputs:
 *   - data/reports/conversion-journeys.json (raw data)
 *   - data/reports/conversion-journeys.html (interactive report with filters)
 *
 * Usage:
 *   npm run report:journeys              # last 30 days (default)
 *   npm run report:journeys -- --days 90 # custom look-back window
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
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 30;

const CONVERSION_EVENTS = ['phone_call_click', 'text_message_click'];
const MICRO_EVENTS = ['call_modal_open', 'text_photos_modal_open', 'scroll_depth', 'blog_read_complete', 'video_play', 'video_complete'];
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

async function queryWithRetry(analyticsdata, params, label) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await analyticsdata.properties.runReport(params);
    } catch (err) {
      if (attempt === 0 && (err.code === 429 || err.code >= 500)) {
        console.log(`    Retrying ${label} after error ${err.code}...`);
        await new Promise(r => setTimeout(r, 5000));
      } else {
        throw err;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// GA4 API Queries
// ---------------------------------------------------------------------------

async function fetchConversionSummary(api, dateRanges) {
  console.log('  Fetching conversion summary...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [
        { name: 'eventName' },
        { name: 'customEvent:phone_region' },
        { name: 'customEvent:click_location' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: CONVERSION_EVENTS },
        },
      },
    },
  }, 'conversion summary');
  return parseGA4Report(res);
}

async function fetchConverterLandingPages(api, dateRanges) {
  console.log('  Fetching converter landing pages...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [
        { name: 'landingPage' },
        { name: 'eventName' },
        { name: 'customEvent:phone_region' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: CONVERSION_EVENTS },
        },
      },
      limit: 500,
    },
  }, 'converter landing pages');
  return parseGA4Report(res);
}

async function fetchConversionPages(api, dateRanges) {
  console.log('  Fetching conversion pages (where clicks happen)...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [
        { name: 'pagePath' },
        { name: 'eventName' },
        { name: 'customEvent:phone_region' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: CONVERSION_EVENTS },
        },
      },
      limit: 500,
    },
  }, 'conversion pages');
  return parseGA4Report(res);
}

async function fetchConverterChannels(api, dateRanges) {
  console.log('  Fetching converter channels...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'eventName' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: CONVERSION_EVENTS },
        },
      },
    },
  }, 'converter channels');
  return parseGA4Report(res);
}

async function fetchConverterDevices(api, dateRanges) {
  console.log('  Fetching converter devices...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [
        { name: 'deviceCategory' },
        { name: 'eventName' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: CONVERSION_EVENTS },
        },
      },
    },
  }, 'converter devices');
  return parseGA4Report(res);
}

async function fetchConverterNewVsReturning(api, dateRanges) {
  console.log('  Fetching new vs returning converters...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [
        { name: 'newVsReturning' },
      ],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: CONVERSION_EVENTS },
        },
      },
    },
  }, 'new vs returning');
  return parseGA4Report(res);
}

async function fetchAllLandingPages(api, dateRanges) {
  console.log('  Fetching all landing page sessions...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      limit: 1000,
    },
  }, 'all landing pages');
  return parseGA4Report(res);
}

async function fetchAllPageViews(api, dateRanges) {
  console.log('  Fetching all page view data...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      limit: 1000,
    },
  }, 'all page views');
  return parseGA4Report(res);
}

async function fetchAllChannels(api, dateRanges) {
  console.log('  Fetching all channel sessions...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    },
  }, 'all channels');
  return parseGA4Report(res);
}

async function fetchAllDevices(api, dateRanges) {
  console.log('  Fetching all device sessions...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    },
  }, 'all devices');
  return parseGA4Report(res);
}

async function fetchMicroConversionUsers(api, dateRanges) {
  console.log('  Fetching micro-conversion data...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: MICRO_EVENTS },
        },
      },
    },
  }, 'micro-conversions');
  return parseGA4Report(res);
}

async function fetchNewVsReturningAll(api, dateRanges) {
  console.log('  Fetching new vs returning (all users)...');
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    },
  }, 'new vs returning all');
  return parseGA4Report(res);
}

async function fetchTotalUsers(api, dateRanges) {
  const res = await queryWithRetry(api, {
    property: GA4_PROPERTY,
    requestBody: {
      dateRanges,
      metrics: [{ name: 'totalUsers' }, { name: 'sessions' }],
    },
  }, 'totals');
  const rows = parseGA4Report(res);
  return rows.length > 0 ? { users: rows[0].totalUsers, sessions: rows[0].sessions } : { users: 0, sessions: 0 };
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function computeSignalSignificance(data) {
  const { totalUsers, converterLanding, allLanding, converterPages, allPages,
          converterChannels, allChannels, converterDevices, allDevices,
          microConversions, converterNewVsReturning, allNewVsReturning } = data;

  const totalConverters = data.conversionSummary.reduce((s, r) => s + r.totalUsers, 0);
  if (totalConverters === 0 || totalUsers === 0) return [];
  const overallRate = totalConverters / totalUsers;

  const signals = [];

  // Landing page lift
  const allLandingMap = {};
  for (const r of allLanding) allLandingMap[r.landingPage] = r.totalUsers;

  const convLandingMap = {};
  for (const r of converterLanding) {
    convLandingMap[r.landingPage] = (convLandingMap[r.landingPage] || 0) + r.totalUsers;
  }

  for (const [page, convUsers] of Object.entries(convLandingMap)) {
    const totalPageUsers = allLandingMap[page] || 0;
    if (totalPageUsers < MIN_SAMPLE) continue;
    const segRate = convUsers / totalPageUsers;
    const lift = segRate / overallRate;
    if (lift > 1.0) {
      signals.push({
        action: `Landed on ${page}`,
        type: 'landing_page',
        baselineRate: round2(overallRate * 100),
        segmentRate: round2(segRate * 100),
        lift: round1(lift),
        sampleSize: totalPageUsers,
        converters: convUsers,
      });
    }
  }

  // Page view lift (pages where conversions happen)
  const allPageMap = {};
  for (const r of allPages) allPageMap[r.pagePath] = r.totalUsers;

  const convPageMap = {};
  for (const r of converterPages) {
    convPageMap[r.pagePath] = (convPageMap[r.pagePath] || 0) + r.eventCount;
  }

  for (const [page, convCount] of Object.entries(convPageMap)) {
    const totalPageUsers = allPageMap[page] || 0;
    if (totalPageUsers < MIN_SAMPLE) continue;
    const segRate = convCount / totalPageUsers;
    const lift = segRate / overallRate;
    if (lift > 1.0) {
      signals.push({
        action: `Converted on ${page}`,
        type: 'conversion_page',
        baselineRate: round2(overallRate * 100),
        segmentRate: round2(segRate * 100),
        lift: round1(lift),
        sampleSize: totalPageUsers,
        converters: convCount,
      });
    }
  }

  // Channel lift
  const allChannelMap = {};
  for (const r of allChannels) allChannelMap[r.sessionDefaultChannelGroup] = r.totalUsers;

  const convChannelMap = {};
  for (const r of converterChannels) {
    convChannelMap[r.sessionDefaultChannelGroup] = (convChannelMap[r.sessionDefaultChannelGroup] || 0) + r.totalUsers;
  }

  for (const [ch, convUsers] of Object.entries(convChannelMap)) {
    const totalChUsers = allChannelMap[ch] || 0;
    if (totalChUsers < MIN_SAMPLE) continue;
    const segRate = convUsers / totalChUsers;
    const lift = segRate / overallRate;
    signals.push({
      action: `Traffic: ${ch}`,
      type: 'channel',
      baselineRate: round2(overallRate * 100),
      segmentRate: round2(segRate * 100),
      lift: round1(lift),
      sampleSize: totalChUsers,
      converters: convUsers,
    });
  }

  // Device lift
  const allDeviceMap = {};
  for (const r of allDevices) allDeviceMap[r.deviceCategory] = r.totalUsers;

  const convDeviceMap = {};
  for (const r of converterDevices) {
    convDeviceMap[r.deviceCategory] = (convDeviceMap[r.deviceCategory] || 0) + r.totalUsers;
  }

  for (const [dev, convUsers] of Object.entries(convDeviceMap)) {
    const totalDevUsers = allDeviceMap[dev] || 0;
    if (totalDevUsers < MIN_SAMPLE) continue;
    const segRate = convUsers / totalDevUsers;
    const lift = segRate / overallRate;
    signals.push({
      action: `Device: ${dev}`,
      type: 'device',
      baselineRate: round2(overallRate * 100),
      segmentRate: round2(segRate * 100),
      lift: round1(lift),
      sampleSize: totalDevUsers,
      converters: convUsers,
    });
  }

  // Micro-conversion lift (modal opens, scroll depth, video play, blog read)
  const eventLabels = {
    call_modal_open: 'Opened call modal',
    text_photos_modal_open: 'Opened text/photos modal',
    scroll_depth: 'Scrolled page (any milestone)',
    blog_read_complete: 'Read blog post to end',
    video_play: 'Played a video',
    video_complete: 'Watched video to end',
  };

  // For micro-conversions, we measure: of people who triggered this event,
  // what % also had a conversion event? This is an upper-bound approximation
  // since we can't definitively link micro-events to conversion events per-user
  // via the aggregate API. The lift still correctly shows relative importance.
  for (const r of microConversions) {
    if (r.totalUsers < MIN_SAMPLE) continue;
    // We use the event's totalUsers as the denominator and estimate
    // conversion overlap proportionally
    const label = eventLabels[r.eventName] || r.eventName;
    signals.push({
      action: label,
      type: 'micro_conversion',
      baselineRate: round2(overallRate * 100),
      segmentRate: '—',
      lift: '—',
      sampleSize: r.totalUsers,
      converters: '—',
      note: `${r.totalUsers} users triggered this event (${r.eventCount} times). Exact converter overlap available once client_id dimension is live.`,
    });
  }

  // New vs returning lift
  const allNvrMap = {};
  for (const r of allNewVsReturning) allNvrMap[r.newVsReturning] = r.totalUsers;

  const convNvrMap = {};
  for (const r of converterNewVsReturning) {
    convNvrMap[r.newVsReturning] = (convNvrMap[r.newVsReturning] || 0) + r.totalUsers;
  }

  for (const [nv, convUsers] of Object.entries(convNvrMap)) {
    const totalNvUsers = allNvrMap[nv] || 0;
    if (totalNvUsers < MIN_SAMPLE) continue;
    const segRate = convUsers / totalNvUsers;
    const lift = segRate / overallRate;
    signals.push({
      action: `Visitor type: ${nv}`,
      type: 'visitor_type',
      baselineRate: round2(overallRate * 100),
      segmentRate: round2(segRate * 100),
      lift: round1(lift),
      sampleSize: totalNvUsers,
      converters: convUsers,
    });
  }

  return signals.sort((a, b) => {
    const aLift = typeof a.lift === 'number' ? a.lift : 0;
    const bLift = typeof b.lift === 'number' ? b.lift : 0;
    return bLift - aLift;
  });
}

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }

function computeConversionProfile(data) {
  const summary = data.conversionSummary;

  // By type + region
  let totalCalls = 0, totalTexts = 0, ctCalls = 0, maCalls = 0, ctTexts = 0, maTexts = 0;
  for (const r of summary) {
    const count = r.eventCount;
    if (r.eventName === 'phone_call_click') {
      totalCalls += count;
      if (r['customEvent:phone_region'] === 'CT') ctCalls += count;
      else if (r['customEvent:phone_region'] === 'MA') maCalls += count;
    } else {
      totalTexts += count;
      if (r['customEvent:phone_region'] === 'CT') ctTexts += count;
      else if (r['customEvent:phone_region'] === 'MA') maTexts += count;
    }
  }

  // Click location breakdown
  const clickLocations = {};
  for (const r of summary) {
    const loc = r['customEvent:click_location'] || '(not set)';
    clickLocations[loc] = (clickLocations[loc] || 0) + r.eventCount;
  }

  // Landing pages for converters
  const landingPages = {};
  for (const r of data.converterLanding) {
    landingPages[r.landingPage] = (landingPages[r.landingPage] || 0) + r.eventCount;
  }

  // Pages where conversions happen
  const conversionPages = {};
  for (const r of data.converterPages) {
    conversionPages[r.pagePath] = (conversionPages[r.pagePath] || 0) + r.eventCount;
  }

  // Channel breakdown
  const channels = {};
  for (const r of data.converterChannels) {
    channels[r.sessionDefaultChannelGroup] = (channels[r.sessionDefaultChannelGroup] || 0) + r.eventCount;
  }

  // Device breakdown
  const devices = {};
  for (const r of data.converterDevices) {
    devices[r.deviceCategory] = (devices[r.deviceCategory] || 0) + r.eventCount;
  }

  // New vs returning
  const newVsReturning = {};
  for (const r of data.converterNewVsReturning) {
    newVsReturning[r.newVsReturning] = (newVsReturning[r.newVsReturning] || 0) + r.eventCount;
  }

  const sortDesc = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);

  return {
    totalConversions: totalCalls + totalTexts,
    totalCalls, totalTexts,
    ctCalls, maCalls, ctTexts, maTexts,
    clickLocations: sortDesc(clickLocations),
    landingPages: sortDesc(landingPages).slice(0, 20),
    conversionPages: sortDesc(conversionPages).slice(0, 20),
    channels: sortDesc(channels),
    devices: sortDesc(devices),
    newVsReturning: sortDesc(newVsReturning),
    overallConvRate: data.totalUsers > 0 ? round2((totalCalls + totalTexts) / data.totalUsers * 100) : 0,
  };
}

function computeLandingPagePerformance(data) {
  const allMap = {};
  for (const r of data.allLanding) {
    allMap[r.landingPage] = { sessions: r.sessions, users: r.totalUsers };
  }

  const convMap = {};
  for (const r of data.converterLanding) {
    convMap[r.landingPage] = (convMap[r.landingPage] || 0) + r.eventCount;
  }

  const rows = [];
  for (const [page, stats] of Object.entries(allMap)) {
    const conversions = convMap[page] || 0;
    const convRate = stats.sessions > 0 ? round2(conversions / stats.sessions * 100) : 0;
    rows.push({
      page,
      sessions: stats.sessions,
      users: stats.users,
      conversions,
      convRate,
    });
  }

  return rows.sort((a, b) => b.conversions - a.conversions || b.sessions - a.sessions).slice(0, 30);
}

// ---------------------------------------------------------------------------
// HTML Report
// ---------------------------------------------------------------------------

function generateHTML(report) {
  const { profile, signals, landingPerf, totals } = report;

  // Summary cards
  const summaryCards = profile.totalConversions === 0
    ? '<p>No conversions found in this period.</p>'
    : `<div class="cards">
      <div class="card"><div class="label">Total Conversions</div><div class="value">${profile.totalConversions}</div></div>
      <div class="card"><div class="label">Conversion Rate</div><div class="value">${profile.overallConvRate}%</div></div>
      <div class="card"><div class="label">Total Users</div><div class="value">${totals.users.toLocaleString()}</div></div>
      <div class="card"><div class="label">CT Calls</div><div class="value ct">${profile.ctCalls}</div></div>
      <div class="card"><div class="label">MA Calls</div><div class="value ma">${profile.maCalls}</div></div>
      <div class="card"><div class="label">CT Texts</div><div class="value ct">${profile.ctTexts}</div></div>
      <div class="card"><div class="label">MA Texts</div><div class="value ma">${profile.maTexts}</div></div>
      <div class="card"><div class="label">Sessions</div><div class="value">${totals.sessions.toLocaleString()}</div></div>
    </div>`;

  // Signal table
  const signalRows = signals.filter(s => typeof s.lift === 'number').map(s => {
    const liftColor = s.lift >= 3 ? '#059669' : s.lift >= 1.5 ? '#2563eb' : '#6b7280';
    return `<tr>
      <td>${escHtml(s.action)}</td>
      <td><span class="type-badge type-${s.type}">${s.type.replace('_', ' ')}</span></td>
      <td class="num">${s.baselineRate}%</td>
      <td class="num highlight">${s.segmentRate}%</td>
      <td class="num"><strong style="color:${liftColor}">${s.lift}x</strong></td>
      <td class="num">${typeof s.sampleSize === 'number' ? s.sampleSize.toLocaleString() : s.sampleSize}</td>
      <td class="num">${typeof s.converters === 'number' ? s.converters : s.converters}</td>
    </tr>`;
  }).join('');

  // Micro-conversion signals (no lift calculable without user-level data)
  const microRows = signals.filter(s => s.type === 'micro_conversion').map(s => `
    <tr>
      <td>${escHtml(s.action)}</td>
      <td class="num">${s.sampleSize.toLocaleString()} users</td>
      <td style="font-size:0.75rem;color:#6b7280;">${s.note || ''}</td>
    </tr>
  `).join('');

  // Landing page performance
  const landingRows = landingPerf.map(r => {
    const rateColor = r.convRate >= 5 ? '#059669' : r.convRate >= 2 ? '#2563eb' : '#1a1a1a';
    return `<tr>
      <td>${escHtml(r.page)}</td>
      <td class="num">${r.sessions.toLocaleString()}</td>
      <td class="num">${r.users.toLocaleString()}</td>
      <td class="num">${r.conversions}</td>
      <td class="num" style="color:${rateColor};font-weight:600;">${r.convRate}%</td>
    </tr>`;
  }).join('');

  // Click location breakdown
  const clickLocRows = profile.clickLocations.map(([loc, count]) => `
    <tr><td>${escHtml(loc)}</td><td class="num">${count}</td></tr>
  `).join('');

  // Channel breakdown
  const channelRows = profile.channels.map(([ch, count]) => `
    <tr><td>${escHtml(ch)}</td><td class="num">${count}</td></tr>
  `).join('');

  // Device breakdown
  const deviceRows = profile.devices.map(([dev, count]) => `
    <tr><td>${escHtml(dev)}</td><td class="num">${count}</td></tr>
  `).join('');

  // New vs returning
  const nvrRows = profile.newVsReturning.map(([nv, count]) => `
    <tr><td>${escHtml(nv)}</td><td class="num">${count}</td></tr>
  `).join('');

  // Conversion pages (where the click happened)
  const convPageRows = profile.conversionPages.map(([page, count]) => `
    <tr><td>${escHtml(page)}</td><td class="num">${count}</td></tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Conversion Journeys — Attack A Crack</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a1a; padding: 2rem; max-width: 1100px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.15rem; margin: 2.5rem 0 0.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
  h3 { font-size: 0.95rem; margin: 1.25rem 0 0.5rem; color: #374151; }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
  .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.75rem 1rem; font-size: 0.8125rem; color: #92400e; margin-bottom: 1rem; }
  .note-blue { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }

  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
  .card { background: white; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .card .label { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 1.5rem; font-weight: 800; margin-top: 0.15rem; }
  .card .value.ct { color: #2563eb; }
  .card .value.ma { color: #059669; }

  .table-wrap { overflow-x: auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  th { background: #1a1a1a; color: white; padding: 0.625rem 0.75rem; text-align: left; font-weight: 600; white-space: nowrap; position: sticky; top: 0; }
  td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #eee; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.highlight { font-weight: 700; color: #059669; }
  tr:hover { background: #f0f9ff; }

  .type-badge { font-size: 0.65rem; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; font-weight: 600; }
  .type-landing_page { background: #dbeafe; color: #1d4ed8; }
  .type-conversion_page { background: #d1fae5; color: #065f46; }
  .type-channel { background: #fef3c7; color: #92400e; }
  .type-device { background: #f3e8ff; color: #6b21a8; }
  .type-visitor_type { background: #fce7f3; color: #9d174d; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <h1>Conversion Journey Analysis</h1>
  <p class="meta">${report.period.startDate} to ${report.period.endDate} (${report.period.days} days) &mdash; Generated ${new Date(report.generatedAt).toLocaleString()}</p>

  ${summaryCards}

  <h2>Signal Significance</h2>
  <p class="meta">Actions, pages, and channels ranked by conversion lift. Shows which behaviors correlate most strongly with converting. Baseline conversion rate: <strong>${profile.overallConvRate}%</strong></p>
  ${signalRows ? `
  <div class="table-wrap"><table>
    <thead><tr><th>Action / Page</th><th>Type</th><th style="text-align:right">Baseline CR</th><th style="text-align:right">Segment CR</th><th style="text-align:right">Lift</th><th style="text-align:right">Sample</th><th style="text-align:right">Converters</th></tr></thead>
    <tbody>${signalRows}</tbody>
  </table></div>` : '<p>Not enough data to calculate lift.</p>'}

  ${microRows ? `
  <h3>Micro-Conversion Events</h3>
  <div class="note note-blue">Micro-conversion lift requires user-level data to calculate precisely. Once the <code>client_id</code> custom dimension has 24+ hours of data, we can cross-reference micro-conversion users with converters for exact overlap.</div>
  <div class="table-wrap"><table>
    <thead><tr><th>Event</th><th style="text-align:right">Users</th><th>Note</th></tr></thead>
    <tbody>${microRows}</tbody>
  </table></div>` : ''}

  <h2>Landing Page Performance</h2>
  <p class="meta">Pages where converting sessions started. High conversion rate + high sessions = your best-performing entry points.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Landing Page</th><th style="text-align:right">Sessions</th><th style="text-align:right">Users</th><th style="text-align:right">Conversions</th><th style="text-align:right">Conv Rate</th></tr></thead>
    <tbody>${landingRows}</tbody>
  </table></div>

  <h2>Conversion Pages</h2>
  <p class="meta">Pages where the phone call or text click actually happened.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Page</th><th style="text-align:right">Conversions</th></tr></thead>
    <tbody>${convPageRows}</tbody>
  </table></div>

  <h2>Conversion Breakdown</h2>
  <div class="two-col">
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
        <thead><tr><th>Channel</th><th style="text-align:right">Conversions</th></tr></thead>
        <tbody>${channelRows}</tbody>
      </table></div>
    </div>
  </div>
  <div class="two-col">
    <div>
      <h3>Device</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Device</th><th style="text-align:right">Conversions</th></tr></thead>
        <tbody>${deviceRows}</tbody>
      </table></div>
    </div>
    <div>
      <h3>New vs Returning</h3>
      <div class="table-wrap"><table>
        <thead><tr><th>Visitor Type</th><th style="text-align:right">Conversions</th></tr></thead>
        <tbody>${nvrRows}</tbody>
      </table></div>
    </div>
  </div>

  <h2>Full Journey Upgrade</h2>
  <div class="note note-blue">
    <strong>Client ID custom dimension deployed.</strong> The GA4 client ID is now captured from the <code>_ga</code> cookie and sent as a user-scoped custom dimension on every event.<br><br>
    <strong>Next steps:</strong><br>
    1. Register <code>client_id</code> as a <strong>User-scoped</strong> custom dimension in GA4 Admin &rarr; Custom definitions<br>
    2. Wait 24 hours for data to accumulate<br>
    3. Re-run this script &mdash; it will be upgraded to reconstruct individual per-user journeys, multi-session paths, days-to-convert, near-converters, and source shift analysis
  </div>

  <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:0.75rem;">
    Attack A Crack &mdash; Conversion Journey Analytics &mdash; Raw data: data/reports/conversion-journeys.json
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startDate = daysAgo(DAYS);
  const endDate = daysAgo(1);
  const dateRanges = [{ startDate, endDate }];
  console.log(`\n🔍 Conversion Journey Analysis (${startDate} to ${endDate}, ${DAYS} days)\n`);

  const auth = await authorize();
  const api = google.analyticsdata({ version: 'v1beta', auth });

  // Fetch all data
  const [
    conversionSummary,
    converterLanding,
    converterPages,
    converterChannels,
    converterDevices,
    converterNewVsReturning,
    allLanding,
    allPages,
    allChannels,
    allDevices,
    microConversions,
    allNewVsReturning,
    totals,
  ] = await Promise.all([
    fetchConversionSummary(api, dateRanges),
    fetchConverterLandingPages(api, dateRanges),
    fetchConversionPages(api, dateRanges),
    fetchConverterChannels(api, dateRanges),
    fetchConverterDevices(api, dateRanges),
    fetchConverterNewVsReturning(api, dateRanges),
    fetchAllLandingPages(api, dateRanges),
    fetchAllPageViews(api, dateRanges),
    fetchAllChannels(api, dateRanges),
    fetchAllDevices(api, dateRanges),
    fetchMicroConversionUsers(api, dateRanges),
    fetchNewVsReturningAll(api, dateRanges),
    fetchTotalUsers(api, dateRanges),
  ]);

  const totalUsers = totals.users;
  console.log(`\n  Total users: ${totalUsers}, Total sessions: ${totals.sessions}`);

  const data = {
    conversionSummary, converterLanding, converterPages,
    converterChannels, converterDevices, converterNewVsReturning,
    allLanding, allPages, allChannels, allDevices,
    microConversions, allNewVsReturning, totalUsers,
  };

  console.log('  Computing analysis...');
  const profile = computeConversionProfile(data);
  const signals = computeSignalSignificance(data);
  const landingPerf = computeLandingPagePerformance(data);

  console.log(`  ${profile.totalConversions} total conversions (${profile.overallConvRate}% rate)`);

  const report = {
    period: { startDate, endDate, days: DAYS },
    generatedAt: new Date().toISOString(),
    profile,
    signals,
    landingPerf,
    totals,
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(join(REPORTS_DIR, 'conversion-journeys.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(REPORTS_DIR, 'conversion-journeys.html'), generateHTML(report));

  // Console output
  console.log('\n' + '='.repeat(60));
  console.log('  CONVERSION JOURNEY ANALYSIS');
  console.log('='.repeat(60));
  console.log(`  Total conversions: ${profile.totalConversions} (${profile.overallConvRate}% rate)`);
  console.log(`  CT Calls: ${profile.ctCalls} | MA Calls: ${profile.maCalls}`);
  console.log(`  CT Texts: ${profile.ctTexts} | MA Texts: ${profile.maTexts}`);

  if (signals.length > 0) {
    console.log('\n  Top Signals by Lift:');
    for (const s of signals.filter(s => typeof s.lift === 'number').slice(0, 8)) {
      console.log(`    ${s.lift}x  ${s.action} (${s.segmentRate}% vs ${s.baselineRate}% baseline, n=${s.sampleSize})`);
    }
  }

  if (profile.clickLocations.length > 0) {
    console.log('\n  Click Locations:');
    for (const [loc, count] of profile.clickLocations) {
      console.log(`    ${loc}: ${count}`);
    }
  }

  if (profile.newVsReturning.length > 0) {
    console.log('\n  New vs Returning:');
    for (const [nv, count] of profile.newVsReturning) {
      console.log(`    ${nv}: ${count}`);
    }
  }

  console.log(`\n  Report: data/reports/conversion-journeys.html`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('❌ Journey analysis failed:', err.message);
  if (err.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
