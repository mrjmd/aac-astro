import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Analytics Health Check — Vercel Cron Function
 *
 * Queries GA4 Data API to verify all custom events and dimensions are flowing.
 * Runs daily via Vercel cron. Sends alert webhook if issues are found.
 *
 * Required env vars:
 *   GOOGLE_OAUTH_CLIENT_ID      — Google OAuth client ID
 *   GOOGLE_OAUTH_CLIENT_SECRET   — Google OAuth client secret
 *   GOOGLE_OAUTH_REFRESH_TOKEN   — Google OAuth refresh token
 *
 * Optional env vars:
 *   HEALTH_ALERT_WEBHOOK         — URL to POST alerts to (Slack, email service, etc.)
 *   CRON_SECRET                  — Secret to authenticate cron requests
 */

// GA4 property ID
const GA4_PROPERTY = 'properties/347942677';

// Events we expect to see and their dimensions
const EXPECTED_EVENTS = [
  { name: 'phone_call_click', dimensions: ['phone_region', 'click_location'], critical: true },
  { name: 'text_message_click', dimensions: ['phone_region', 'click_location'], critical: true },
  { name: 'call_modal_open', dimensions: ['page_type'], critical: false },
  { name: 'text_photos_modal_open', dimensions: ['page_type'], critical: false },
  { name: 'scroll_depth', dimensions: ['depth', 'page_type'], critical: false },
  { name: 'blog_read_complete', dimensions: ['post_slug'], critical: false },
  { name: 'video_play', dimensions: ['video_id'], critical: false },
  { name: 'video_complete', dimensions: ['video_id'], critical: false },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

interface GA4Row {
  [key: string]: string | number;
}

function parseGA4Report(response: any): GA4Row[] {
  const dimHeaders = response.dimensionHeaders?.map((h: any) => h.name) || [];
  const metricHeaders = response.metricHeaders?.map((h: any) => h.name) || [];
  const rows = response.rows || [];
  return rows.map((row: any) => {
    const obj: GA4Row = {};
    row.dimensionValues?.forEach((v: any, i: number) => { obj[dimHeaders[i]] = v.value; });
    row.metricValues?.forEach((v: any, i: number) => {
      const val = v.value as string;
      obj[metricHeaders[i]] = val.includes('.') ? parseFloat(val) : parseInt(val, 10);
    });
    return obj;
  });
}

async function getAccessToken(): Promise<string> {
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REFRESH_TOKEN) {
    throw new Error('Missing Google OAuth env vars (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN)');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function ga4Report(accessToken: string, body: any): Promise<any> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 API error: ${res.status} ${text}`);
  }

  return res.json();
}

async function sendAlert(results: any): Promise<void> {
  const webhookUrl = process.env.HEALTH_ALERT_WEBHOOK;
  if (!webhookUrl) return;

  const issues = results.events.filter((e: any) => e.status === 'issue' || (e.status === 'no_data' && e.critical));

  if (issues.length === 0) return;

  const summary = issues.map((e: any) =>
    `${e.critical ? '🚨' : '⚠️'} ${e.name}: ${e.count} events — ${e.issues.join('; ')}`
  ).join('\n');

  const payload = {
    // Slack-compatible format
    text: `📊 Analytics Health Check — ${issues.length} issue(s) found`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Analytics Health Check* — ${results.period.startDate} to ${results.period.endDate}\n\n${summary}`,
        },
      },
    ],
    // Generic webhook fields
    subject: `Analytics Health Check: ${issues.length} issue(s)`,
    body: summary,
    status: 'alert',
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Alert webhook failed:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const startDate = daysAgo(7);
    const endDate = daysAgo(1);
    const dateRanges = [{ startDate, endDate }];

    const accessToken = await getAccessToken();

    // 1. Get event counts for all custom events
    const eventCountRes = await ga4Report(accessToken, {
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
    });

    const eventCounts: Record<string, number> = {};
    for (const row of parseGA4Report(eventCountRes)) {
      eventCounts[row.eventName as string] = row.eventCount as number;
    }

    // 2. Check each event's dimensions
    const results: any = {
      period: { startDate, endDate, days: 7 },
      generatedAt: new Date().toISOString(),
      events: [],
      summary: { total: 0, healthy: 0, noData: 0, issues: 0 },
    };

    for (const evt of EXPECTED_EVENTS) {
      const count = eventCounts[evt.name] || 0;
      const eventResult: any = {
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
          eventResult.issues.push(`CRITICAL: No ${evt.name} events in 7 days`);
        }
      } else {
        // Query each dimension
        for (const dimName of evt.dimensions) {
          const dim = `customEvent:${dimName}`;
          const dimRes = await ga4Report(accessToken, {
            dateRanges,
            dimensions: [{ name: dim }],
            metrics: [{ name: 'eventCount' }],
            dimensionFilter: {
              filter: {
                fieldName: 'eventName',
                stringFilter: { value: evt.name, matchType: 'EXACT' },
              },
            },
          });

          const dimRows = parseGA4Report(dimRes);
          const values = dimRows.map(r => ({ value: r[dim], count: r.eventCount }));
          const allNotSet = values.length > 0 && values.every(v => v.value === '(not set)');
          const hasNotSet = values.some(v => v.value === '(not set)');

          const dimResult: any = { name: dim, values, status: 'healthy', issues: [] };

          if (allNotSet) {
            dimResult.status = 'broken';
            dimResult.issues.push(`ALL values are (not set) — dimension likely not registered`);
            eventResult.status = 'issue';
            eventResult.issues.push(`Dimension ${dimName} is broken`);
          } else if (hasNotSet) {
            dimResult.status = 'warning';
            const notSetCount = values.find(v => v.value === '(not set)')?.count || 0;
            dimResult.issues.push(`${notSetCount} events with (not set)`);
            if (eventResult.status === 'healthy') eventResult.status = 'warning';
          }

          eventResult.dimensions.push(dimResult);
        }
      }

      results.events.push(eventResult);
      results.summary.total++;
      if (eventResult.status === 'healthy') results.summary.healthy++;
      else if (eventResult.status === 'no_data') results.summary.noData++;
      else results.summary.issues++;
    }

    // 3. Check page_type coverage
    const pageTypeRes = await ga4Report(accessToken, {
      dateRanges,
      dimensions: [{ name: 'customEvent:page_type' }],
      metrics: [{ name: 'sessions' }],
    });
    results.pageTypeCoverage = parseGA4Report(pageTypeRes)
      .map(r => ({ type: r['customEvent:page_type'], sessions: r.sessions }))
      .sort((a: any, b: any) => b.sessions - a.sessions);

    // 4. Send alert if issues found
    await sendAlert(results);

    // Log for Vercel function logs
    const { healthy, noData, issues } = results.summary;
    console.log(`Analytics health: ${healthy}/${results.summary.total} healthy, ${noData} no data, ${issues} issues`);

    return res.status(200).json(results);
  } catch (err: any) {
    console.error('Health check failed:', err);

    // Try to send error alert
    try {
      await sendAlert({
        period: { startDate: daysAgo(7), endDate: daysAgo(1) },
        events: [{ name: 'HEALTH_CHECK_ERROR', status: 'issue', critical: true, count: 0, issues: [err.message], dimensions: [] }],
      });
    } catch { /* ignore alert failure */ }

    return res.status(500).json({ error: err.message });
  }
}
