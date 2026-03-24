#!/usr/bin/env node

/**
 * Master Audit — Cross-Platform Google Ads Optimization
 *
 * Aggregates data from Google Ads, GA4, GSC, and SEMrush to identify:
 *   1. Search Arbitrage — GSC queries near page 1 not in Google Ads
 *   2. Waste Detection — Ads search terms with spend but no conversions
 *   3. City Page Coverage — Cities with organic traffic but no paid keywords
 *   4. Competitor Gaps — SEMrush keywords competitors rank for but AAC doesn't
 *   5. Content Conversions — Blog posts driving conversions (sitelink candidates)
 *
 * Usage:
 *   node scripts/master-audit.js                    # full audit, 30 days
 *   node scripts/master-audit.js --days 90          # custom period
 *   node scripts/master-audit.js --skip-semrush     # skip SEMrush CSV parsing
 *   node scripts/master-audit.js --skip-ads         # skip Google Ads data
 *   node scripts/master-audit.js --skip-ga4         # skip GA4 data
 *   node scripts/master-audit.js --skip-gsc         # skip GSC data
 *   node scripts/master-audit.js --account MA       # target account (default: MA)
 */

import { readFile, readdir, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { authorize } from './lib/project-import-core.js';
import { gaqlQuery, getConfig, microsToDollars } from './lib/google-ads-client.js';
import { loadCityPages } from './lib/city-pages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = 'data/reports/master-audit.json';
const SEMRUSH_DIR = join(__dirname, '../docs/seo-reports');

// Parse CLI args
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 30;
const acctIdx = args.indexOf('--account');
const ACCOUNT_KEY = acctIdx !== -1 ? args[acctIdx + 1] : 'MA';
const SKIP_SEMRUSH = args.includes('--skip-semrush');
const SKIP_ADS = args.includes('--skip-ads');
const SKIP_GA4 = args.includes('--skip-ga4');
const SKIP_GSC = args.includes('--skip-gsc');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ===== CSV PARSER =====

function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]);
  return lines.slice(1)
    .filter(l => l.trim())
    .map(l => {
      const values = parseLine(l);
      const obj = {};
      headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
      return obj;
    });
}

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += char; }
  }
  result.push(current);
  return result;
}

// ===== DATA FETCHERS =====

async function fetchAdsData(auth, customerId) {
  console.log('  Fetching Google Ads data...');
  const dateRange = DAYS === 30 ? 'DURING LAST_30_DAYS' : `BETWEEN '${daysAgo(DAYS)}' AND '${daysAgo(1)}'`;

  const [searchTermRows, keywordRows, campaignRows] = await Promise.all([
    gaqlQuery(auth, customerId, `
      SELECT search_term_view.search_term, campaign.name, metrics.impressions,
        metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM search_term_view WHERE segments.date ${dateRange} AND metrics.clicks > 0
      ORDER BY metrics.cost_micros DESC
    `),
    gaqlQuery(auth, customerId, `
      SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
        ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM keyword_view WHERE segments.date ${dateRange} AND metrics.impressions > 0
      ORDER BY metrics.cost_micros DESC
    `),
    gaqlQuery(auth, customerId, `
      SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks,
        metrics.cost_micros, metrics.conversions
      FROM campaign WHERE segments.date ${dateRange}
    `),
  ]);

  return {
    searchTerms: searchTermRows.map(r => ({
      term: r.searchTermView?.searchTerm,
      campaign: r.campaign?.name,
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
      conversions: parseFloat(r.metrics?.conversions || '0'),
    })),
    keywords: keywordRows.map(r => ({
      text: r.adGroupCriterion?.keyword?.text?.toLowerCase(),
      matchType: r.adGroupCriterion?.keyword?.matchType,
      adGroup: r.adGroup?.name,
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
      conversions: parseFloat(r.metrics?.conversions || '0'),
    })),
    campaigns: campaignRows.map(r => ({
      name: r.campaign?.name,
      status: r.campaign?.status,
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
      conversions: parseFloat(r.metrics?.conversions || '0'),
    })),
  };
}

async function fetchGA4Data(auth) {
  console.log('  Fetching GA4 data...');
  const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });
  const property = 'properties/347942677';

  const [pageRes, convRes] = await Promise.all([
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }, { name: 'bounceRate' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 500,
      },
    }),
    analyticsdata.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: { values: ['phone_call_click', 'text_message_click'] },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      },
    }).catch(() => ({ data: { rows: [] } })),
  ]);

  const parseRows = (res) => {
    const headers = res.data.dimensionHeaders?.map(h => h.name) || [];
    const metricHeaders = res.data.metricHeaders?.map(h => h.name) || [];
    return (res.data.rows || []).map(row => {
      const obj = {};
      row.dimensionValues?.forEach((v, i) => { obj[headers[i]] = v.value; });
      row.metricValues?.forEach((v, i) => {
        obj[metricHeaders[i]] = v.value.includes('.') ? parseFloat(v.value) : parseInt(v.value, 10);
      });
      return obj;
    });
  };

  return {
    pages: parseRows(pageRes),
    conversions: parseRows(convRes),
  };
}

async function fetchGSCData(auth) {
  console.log('  Fetching GSC data...');
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const siteUrl = 'https://www.attackacrack.com';
  const startDate = daysAgo(DAYS);
  const endDate = daysAgo(2); // GSC has ~2 day lag

  const [queriesRes, pagesRes, combosRes] = await Promise.all([
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 500 },
    }),
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 500 },
    }),
    searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: { startDate, endDate, dimensions: ['query', 'page'], rowLimit: 1000 },
    }),
  ]);

  const mapRows = (rows, keyCount) => (rows || []).map(r => ({
    ...(keyCount === 1 ? { query: r.keys[0] } : { query: r.keys[0], page: r.keys[1].replace(siteUrl, '') }),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 10000) / 100,
    position: Math.round(r.position * 10) / 10,
  }));

  return {
    queries: mapRows(queriesRes.data.rows, 1),
    pages: (pagesRes.data.rows || []).map(r => ({
      page: r.keys[0].replace(siteUrl, ''),
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 10000) / 100,
      position: Math.round(r.position * 10) / 10,
    })),
    queryPageCombos: mapRows(combosRes.data.rows, 2),
  };
}

async function loadSemrushData() {
  console.log('  Loading SEMrush data...');
  const data = { missing: [], weak: [], untapped: [], shared: [] };

  const files = {
    missing: 'gap.keywords-missing.csv',
    weak: 'gap.keywords-weak.csv',
    untapped: 'gap.keywords-untapped.csv',
    shared: 'gap.keywords-shared.csv',
  };

  for (const [key, filename] of Object.entries(files)) {
    try {
      const raw = await readFile(join(SEMRUSH_DIR, filename), 'utf-8');
      data[key] = parseCSV(raw).map(row => ({
        keyword: row['Keyword'] || '',
        intent: row['Intents'] || '',
        volume: parseInt(row['Volume'] || '0', 10),
        difficulty: parseInt(row['Keyword Difficulty'] || '0', 10),
        cpc: parseFloat(row['CPC'] || '0'),
        competitionDensity: parseFloat(row['Competition Density'] || '0'),
        aacPosition: parseInt(row['attackacrack.com'] || '0', 10),
        a1Position: parseInt(row['a1foundationcrackrepair.com'] || '0', 10),
        crackxPosition: parseInt(row['crackx.com'] || '0', 10),
        groundworksPosition: parseInt(row['groundworks.com'] || '0', 10),
      }));
    } catch {
      console.log(`  ⚠️  ${filename} not found, skipping`);
    }
  }

  return data;
}

// ===== ANALYSES =====

function analyzeSearchArbitrage(gscData, adsData) {
  if (!gscData || !adsData) return null;

  // Build set of existing Google Ads keywords (normalized)
  const existingKeywords = new Set(
    (adsData.keywords || []).map(k => k.text?.toLowerCase())
  );

  // Find GSC queries at position 5-20 with decent impressions, not in Ads
  const opportunities = (gscData.queries || [])
    .filter(q =>
      q.position >= 5 && q.position <= 20 &&
      q.impressions >= 5 &&
      !existingKeywords.has(q.query.toLowerCase())
    )
    .map(q => ({
      query: q.query,
      position: q.position,
      impressions: q.impressions,
      clicks: q.clicks,
      ctr: q.ctr,
      suggestedMatchType: q.position <= 10 ? 'EXACT' : 'PHRASE',
      rationale: q.position <= 10
        ? 'Page 1 bottom — exact match to capture this traffic'
        : 'Page 2 — phrase match to nudge to page 1',
    }))
    .sort((a, b) => b.impressions - a.impressions);

  return {
    count: opportunities.length,
    estimatedImpressions: opportunities.reduce((sum, o) => sum + o.impressions, 0),
    opportunities: opportunities.slice(0, 20),
  };
}

function analyzeWaste(adsData) {
  if (!adsData) return null;

  const wasteTerms = (adsData.searchTerms || [])
    .filter(t => t.conversions === 0 && (t.cost > 5 || t.clicks > 3))
    .map(t => ({
      term: t.term,
      cost: t.cost,
      clicks: t.clicks,
      impressions: t.impressions,
      recommendation: t.cost > 10 ? 'ADD_NEGATIVE' : 'MONITOR',
    }))
    .sort((a, b) => b.cost - a.cost);

  const totalWaste = wasteTerms
    .filter(t => t.recommendation === 'ADD_NEGATIVE')
    .reduce((sum, t) => sum + t.cost, 0);

  return {
    count: wasteTerms.length,
    totalWaste: Math.round(totalWaste * 100) / 100,
    terms: wasteTerms,
  };
}

function analyzeCityPageCoverage(gscData, ga4Data, adsData, cityPages) {
  if (!cityPages) return null;

  // Build lookup maps
  const gscByPage = {};
  (gscData?.pages || []).forEach(p => { gscByPage[p.page] = p; });

  const ga4ByPage = {};
  (ga4Data?.pages || []).forEach(p => { ga4ByPage[p.pagePath] = p; });

  // Check which cities have ads keywords mentioning their name
  const adsKeywordTexts = (adsData?.keywords || []).map(k => k.text?.toLowerCase() || '');

  const coverage = cityPages.map(city => {
    const gsc = gscByPage[city.url] || gscByPage[city.url.replace(/\/$/, '')] || null;
    const ga4 = ga4ByPage[city.url] || ga4ByPage[city.url.replace(/\/$/, '')] || null;
    const cityLower = city.city.toLowerCase();
    const hasAdsKeywords = adsKeywordTexts.some(k => k.includes(cityLower));

    return {
      city: city.city,
      state: city.stateAbbr,
      url: city.url,
      organicClicks: gsc?.clicks || 0,
      organicImpressions: gsc?.impressions || 0,
      organicPosition: gsc?.position || null,
      ga4Sessions: ga4?.sessions || 0,
      hasAdsKeywords,
      recommendation: !hasAdsKeywords && (gsc?.clicks > 0 || ga4?.sessions > 0)
        ? 'CREATE_AD_GROUP'
        : !hasAdsKeywords
          ? 'CONSIDER_AD_GROUP'
          : 'COVERED',
    };
  });

  const uncovered = coverage.filter(c => c.recommendation === 'CREATE_AD_GROUP');
  const consider = coverage.filter(c => c.recommendation === 'CONSIDER_AD_GROUP');
  const covered = coverage.filter(c => c.recommendation === 'COVERED');

  return {
    total: cityPages.length,
    covered: covered.length,
    uncoveredWithTraffic: uncovered.length,
    uncoveredNoTraffic: consider.length,
    opportunities: uncovered.sort((a, b) => (b.organicClicks + b.ga4Sessions) - (a.organicClicks + a.ga4Sessions)),
  };
}

function analyzeCompetitorGaps(semrushData) {
  if (!semrushData) return null;

  // Focus on missing + weak keywords with commercial intent and decent volume
  const allGaps = [...(semrushData.missing || []), ...(semrushData.weak || [])];

  const highValue = allGaps
    .filter(k =>
      (k.intent.includes('Transactional') || k.intent.includes('Commercial')) &&
      k.volume >= 50 &&
      k.cpc >= 1
    )
    .sort((a, b) => b.volume - a.volume);

  const informational = allGaps
    .filter(k => k.intent.includes('Informational') && k.volume >= 100)
    .sort((a, b) => b.volume - a.volume);

  return {
    totalGaps: allGaps.length,
    highValueCount: highValue.length,
    highValue: highValue.slice(0, 20).map(k => ({
      keyword: k.keyword,
      volume: k.volume,
      cpc: k.cpc,
      difficulty: k.difficulty,
      intent: k.intent,
      aacPosition: k.aacPosition || 'not ranking',
      competitorBest: Math.min(
        k.a1Position || 999, k.crackxPosition || 999, k.groundworksPosition || 999
      ),
    })),
    contentOpportunities: informational.slice(0, 10).map(k => ({
      keyword: k.keyword,
      volume: k.volume,
      intent: k.intent,
    })),
  };
}

function analyzeContentConversions(ga4Data) {
  if (!ga4Data) return null;

  // Find blog pages with conversions
  const convByPage = {};
  (ga4Data.conversions || []).forEach(c => {
    if (!c.pagePath?.startsWith('/blog/')) return;
    convByPage[c.pagePath] = (convByPage[c.pagePath] || 0) + (c.eventCount || 0);
  });

  // Get session data for blog pages
  const blogPages = (ga4Data.pages || []).filter(p => p.pagePath?.startsWith('/blog/'));

  const sitelinkCandidates = Object.entries(convByPage)
    .map(([path, conversions]) => {
      const page = blogPages.find(p => p.pagePath === path);
      return {
        pagePath: path,
        conversions,
        sessions: page?.sessions || 0,
        conversionRate: page?.sessions > 0 ? Math.round(conversions / page.sessions * 10000) / 100 : 0,
        recommendation: 'ADD_AS_SITELINK',
      };
    })
    .sort((a, b) => b.conversions - a.conversions);

  // Also find high-traffic blog pages that might be worth promoting
  const highTrafficBlogs = blogPages
    .filter(p => p.sessions >= 5 && !convByPage[p.pagePath])
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10)
    .map(p => ({ pagePath: p.pagePath, sessions: p.sessions, note: 'High traffic, no conversions yet' }));

  return {
    sitelinkCandidates,
    highTrafficBlogs,
  };
}

// ===== MAIN =====

async function main() {
  console.log(`\n🔍 Master Audit — ${ACCOUNT_KEY} (last ${DAYS} days)\n`);

  const auth = await authorize();
  const config = await getConfig();
  const customerId = config.accounts[ACCOUNT_KEY];

  if (!customerId) {
    console.error(`❌ No account for "${ACCOUNT_KEY}". Available: ${Object.keys(config.accounts).join(', ')}`);
    process.exit(1);
  }

  // Fetch data in parallel
  const [adsData, ga4Data, gscData, semrushData, cityPages] = await Promise.all([
    SKIP_ADS ? null : fetchAdsData(auth, customerId).catch(err => { console.log(`  ⚠️  Ads: ${err.message}`); return null; }),
    SKIP_GA4 ? null : fetchGA4Data(auth).catch(err => { console.log(`  ⚠️  GA4: ${err.message}`); return null; }),
    SKIP_GSC ? null : fetchGSCData(auth).catch(err => { console.log(`  ⚠️  GSC: ${err.message}`); return null; }),
    SKIP_SEMRUSH ? null : loadSemrushData().catch(err => { console.log(`  ⚠️  SEMrush: ${err.message}`); return null; }),
    loadCityPages(),
  ]);

  console.log('\n  📊 Running analyses...\n');

  // Run analyses
  const searchArbitrage = analyzeSearchArbitrage(gscData, adsData);
  const waste = analyzeWaste(adsData);
  const cityPageCoverage = analyzeCityPageCoverage(gscData, ga4Data, adsData, cityPages);
  const competitorGaps = analyzeCompetitorGaps(semrushData);
  const contentConversions = analyzeContentConversions(ga4Data);

  // Build action items
  const actionItems = [];

  if (searchArbitrage?.count > 0) {
    actionItems.push(`Add ${searchArbitrage.count} search arbitrage keywords (est. ${searchArbitrage.estimatedImpressions} impressions/month)`);
  }
  if (waste?.totalWaste > 0) {
    actionItems.push(`Add ${waste.terms.filter(t => t.recommendation === 'ADD_NEGATIVE').length} negative keywords to save ~$${waste.totalWaste}/month`);
  }
  if (cityPageCoverage?.uncoveredWithTraffic > 0) {
    actionItems.push(`Create ad groups for ${cityPageCoverage.uncoveredWithTraffic} city pages with organic traffic but no ads`);
  }
  if (competitorGaps?.highValueCount > 0) {
    actionItems.push(`Target ${competitorGaps.highValueCount} high-value competitor keywords (commercial intent, vol 50+)`);
  }
  if (contentConversions?.sitelinkCandidates.length > 0) {
    actionItems.push(`Add ${contentConversions.sitelinkCandidates.length} converting blog posts as sitelink extensions`);
  }

  // Compile report
  const report = {
    generatedAt: new Date().toISOString(),
    period: { days: DAYS, start: daysAgo(DAYS), end: daysAgo(1) },
    account: `${ACCOUNT_KEY} (${customerId})`,
    sources: {
      ads: !!adsData,
      ga4: !!ga4Data,
      gsc: !!gscData,
      semrush: !!semrushData,
    },
    searchArbitrage,
    wasteDetection: waste,
    cityPageCoverage,
    competitorGaps,
    contentConversions,
    actionItems,
  };

  // Save report
  await mkdir('data/reports', { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));

  // Console summary
  console.log('  ═══════════════════════════════════════════════════');
  console.log('  📋 MASTER AUDIT RESULTS');
  console.log('  ═══════════════════════════════════════════════════\n');

  // 1. Search Arbitrage
  if (searchArbitrage) {
    console.log(`  1️⃣  SEARCH ARBITRAGE — ${searchArbitrage.count} opportunities`);
    if (searchArbitrage.opportunities.length > 0) {
      console.log(`     Est. ${searchArbitrage.estimatedImpressions} impressions/month if targeted\n`);
      for (const o of searchArbitrage.opportunities.slice(0, 5)) {
        console.log(`     "${o.query}" — pos ${o.position}, ${o.impressions} imp → ${o.suggestedMatchType}`);
      }
      if (searchArbitrage.count > 5) console.log(`     ... and ${searchArbitrage.count - 5} more`);
    } else {
      console.log('     No opportunities found (all GSC queries already in Ads)');
    }
  }

  // 2. Waste Detection
  if (waste) {
    console.log(`\n  2️⃣  WASTE DETECTION — $${waste.totalWaste} potential savings`);
    if (waste.terms.length > 0) {
      const negatives = waste.terms.filter(t => t.recommendation === 'ADD_NEGATIVE');
      if (negatives.length > 0) {
        console.log(`     ${negatives.length} terms recommended as negative keywords:\n`);
        for (const t of negatives.slice(0, 5)) {
          console.log(`     "${t.term}" — $${t.cost}, ${t.clicks} clicks, 0 conversions`);
        }
        console.log(`\n     Run: npm run ads:negatives -- --add ${negatives.slice(0, 3).map(t => `"${t.term}"`).join(' ')}`);
      }
    } else {
      console.log('     No significant waste detected');
    }
  }

  // 3. City Page Coverage
  if (cityPageCoverage) {
    console.log(`\n  3️⃣  CITY PAGE COVERAGE — ${cityPageCoverage.covered}/${cityPageCoverage.total} covered`);
    if (cityPageCoverage.uncoveredWithTraffic > 0) {
      console.log(`     ${cityPageCoverage.uncoveredWithTraffic} cities have organic traffic but NO ad groups:\n`);
      for (const c of cityPageCoverage.opportunities.slice(0, 5)) {
        console.log(`     ${c.city}, ${c.state} — ${c.organicClicks} organic clicks, ${c.ga4Sessions} GA4 sessions`);
      }
    }
    console.log(`     ${cityPageCoverage.uncoveredNoTraffic} cities have no traffic yet (consider ad groups to seed traffic)`);
  }

  // 4. Competitor Gaps
  if (competitorGaps) {
    console.log(`\n  4️⃣  COMPETITOR GAPS — ${competitorGaps.totalGaps} total, ${competitorGaps.highValueCount} high-value`);
    if (competitorGaps.highValue.length > 0) {
      console.log('     Top commercial-intent gaps:\n');
      for (const k of competitorGaps.highValue.slice(0, 5)) {
        console.log(`     "${k.keyword}" — vol ${k.volume}, CPC $${k.cpc}, competitor best pos: ${k.competitorBest}`);
      }
    }
    if (competitorGaps.contentOpportunities.length > 0) {
      console.log('\n     Content opportunities (informational, high volume):');
      for (const k of competitorGaps.contentOpportunities.slice(0, 3)) {
        console.log(`     "${k.keyword}" — vol ${k.volume}`);
      }
    }
  }

  // 5. Content Conversions
  if (contentConversions) {
    console.log(`\n  5️⃣  CONTENT CONVERSIONS — ${contentConversions.sitelinkCandidates.length} converting blog posts`);
    if (contentConversions.sitelinkCandidates.length > 0) {
      for (const c of contentConversions.sitelinkCandidates.slice(0, 5)) {
        console.log(`     ${c.pagePath} — ${c.conversions} conversions (${c.conversionRate}% rate)`);
      }
      console.log('\n     Recommendation: Add top converters as Google Ads sitelink extensions');
    }
    if (contentConversions.highTrafficBlogs.length > 0) {
      console.log(`\n     High-traffic blogs (no conversions yet — watch these):`);
      for (const b of contentConversions.highTrafficBlogs.slice(0, 3)) {
        console.log(`     ${b.pagePath} — ${b.sessions} sessions`);
      }
    }
  }

  // Action Items Summary
  if (actionItems.length > 0) {
    console.log('\n  ═══════════════════════════════════════════════════');
    console.log('  🎯 TOP ACTION ITEMS');
    console.log('  ═══════════════════════════════════════════════════\n');
    actionItems.forEach((item, i) => {
      console.log(`     ${i + 1}. ${item}`);
    });
  }

  console.log(`\n  ✅ Full report saved to ${OUTPUT_PATH}\n`);
}

main().catch(err => {
  console.error('❌ Master audit failed:', err.message);
  process.exit(1);
});
