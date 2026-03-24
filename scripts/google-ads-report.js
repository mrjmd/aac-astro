#!/usr/bin/env node

/**
 * Google Ads Report — Deep Analysis Tool
 *
 * Comprehensive Google Ads reporting with multiple analysis sections.
 * Outputs JSON to data/reports/google-ads-report.json for Claude analysis.
 *
 * Usage:
 *   node scripts/google-ads-report.js                    # quick: campaigns + search terms + keywords
 *   node scripts/google-ads-report.js --full             # everything: + impression share, hourly, device, geo, monthly, budget, extensions
 *   node scripts/google-ads-report.js --full --days 365  # full year deep dive
 *   node scripts/google-ads-report.js --section geo      # single section only
 *   node scripts/google-ads-report.js --account MA       # target account (default: MA)
 *
 * Sections (--full runs all, --section runs one):
 *   campaigns, searchTerms, keywords, geo, impressionShare, budget, hourly, device, monthly, extensions
 */

import { writeFile, mkdir } from 'fs/promises';
import { authorize } from './lib/project-import-core.js';
import { gaqlQuery, getConfig, microsToDollars } from './lib/google-ads-client.js';

const OUTPUT_PATH = 'data/reports/google-ads-report.json';

// Parse CLI args
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 30;
const acctIdx = args.indexOf('--account');
const ACCOUNT_KEY = acctIdx !== -1 ? args[acctIdx + 1] : 'MA';
const FULL = args.includes('--full');
const sectionIdx = args.indexOf('--section');
const SECTION = sectionIdx !== -1 ? args[sectionIdx + 1] : null;

const CORE_SECTIONS = ['campaigns', 'searchTerms', 'keywords', 'geo'];
const DEEP_SECTIONS = ['impressionShare', 'budget', 'hourly', 'device', 'monthly', 'extensions'];
const ALL_SECTIONS = [...CORE_SECTIONS, ...DEEP_SECTIONS];

function shouldRun(section) {
  if (SECTION) return section === SECTION;
  if (FULL) return true;
  return CORE_SECTIONS.includes(section);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// GAQL date range
const DURING_LITERALS = { 7: 'LAST_7_DAYS', 14: 'LAST_14_DAYS', 30: 'LAST_30_DAYS' };
const dateRange = DURING_LITERALS[DAYS]
  ? `DURING ${DURING_LITERALS[DAYS]}`
  : `BETWEEN '${daysAgo(DAYS)}' AND '${daysAgo(1)}'`;

// For sections that need explicit dates regardless
const startDate = daysAgo(DAYS);
const endDate = daysAgo(1);

async function main() {
  const mode = SECTION ? `section: ${SECTION}` : FULL ? 'FULL deep dive' : 'quick summary';
  console.log(`\n📊 Google Ads Report — ${ACCOUNT_KEY} (${mode}, last ${DAYS} days)\n`);

  const auth = await authorize();
  const config = await getConfig();
  const customerId = config.accounts[ACCOUNT_KEY];

  if (!customerId) {
    console.error(`❌ No account for "${ACCOUNT_KEY}". Available: ${Object.keys(config.accounts).join(', ')}`);
    process.exit(1);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    period: { days: DAYS, start: startDate, end: endDate },
    account: `${ACCOUNT_KEY} (${customerId})`,
    mode,
  };

  // ===== CAMPAIGNS =====
  if (shouldRun('campaigns')) {
    console.log('  Fetching campaigns...');
    const rows = await gaqlQuery(auth, customerId, `
      SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks,
        metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.average_cpc
      FROM campaign WHERE segments.date ${dateRange} ORDER BY metrics.cost_micros DESC
    `);
    report.campaigns = rows.map(r => ({
      name: r.campaign?.name, status: r.campaign?.status,
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
      conversions: parseFloat(r.metrics?.conversions || '0'),
      conversionValue: parseFloat(r.metrics?.conversionsValue || '0'),
      avgCpc: microsToDollars(r.metrics?.averageCpc),
    }));
  }

  // ===== SEARCH TERMS =====
  if (shouldRun('searchTerms')) {
    console.log('  Fetching search terms...');
    const rows = await gaqlQuery(auth, customerId, `
      SELECT search_term_view.search_term, campaign.name, metrics.impressions,
        metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value
      FROM search_term_view WHERE segments.date ${dateRange} AND metrics.clicks > 0
      ORDER BY metrics.cost_micros DESC
    `);
    report.searchTerms = rows.map(r => ({
      searchTerm: r.searchTermView?.searchTerm, campaign: r.campaign?.name,
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
      conversions: parseFloat(r.metrics?.conversions || '0'),
      conversionValue: parseFloat(r.metrics?.conversionsValue || '0'),
    }));
  }

  // ===== KEYWORDS =====
  if (shouldRun('keywords')) {
    console.log('  Fetching keywords...');
    const rows = await gaqlQuery(auth, customerId, `
      SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
        campaign.name, ad_group.name, metrics.impressions, metrics.clicks,
        metrics.cost_micros, metrics.conversions, metrics.search_impression_share,
        ad_group_criterion.quality_info.quality_score
      FROM keyword_view WHERE segments.date ${dateRange} AND metrics.impressions > 0
      ORDER BY metrics.cost_micros DESC
    `);
    report.keywords = rows.map(r => ({
      keyword: r.adGroupCriterion?.keyword?.text,
      matchType: r.adGroupCriterion?.keyword?.matchType,
      campaign: r.campaign?.name, adGroup: r.adGroup?.name,
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
      conversions: parseFloat(r.metrics?.conversions || '0'),
      searchImpressionShare: parseFloat(r.metrics?.searchImpressionShare || '0'),
      qualityScore: r.adGroupCriterion?.qualityInfo?.qualityScore || null,
    }));
  }

  // ===== GEOGRAPHIC =====
  if (shouldRun('geo')) {
    console.log('  Fetching geographic data...');
    try {
      const rows = await gaqlQuery(auth, customerId, `
        SELECT geographic_view.country_criterion_id, geographic_view.location_type,
          campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
        FROM geographic_view WHERE segments.date ${dateRange} AND metrics.clicks > 0
        ORDER BY metrics.cost_micros DESC
      `);
      report.geographic = rows.map(r => ({
        countryCriterionId: r.geographicView?.countryCriterionId,
        locationType: r.geographicView?.locationType,
        campaign: r.campaign?.name,
        impressions: parseInt(r.metrics?.impressions || '0', 10),
        clicks: parseInt(r.metrics?.clicks || '0', 10),
        cost: microsToDollars(r.metrics?.costMicros),
        conversions: parseFloat(r.metrics?.conversions || '0'),
      }));
    } catch (err) {
      console.log('  ⚠️  Geo data not available:', err.message);
      report.geographic = null;
    }
  }

  // ===== IMPRESSION SHARE (--full or --section impressionShare) =====
  if (shouldRun('impressionShare')) {
    console.log('  Fetching impression share...');
    const rows = await gaqlQuery(auth, customerId, `
      SELECT campaign.name, metrics.search_impression_share,
        metrics.search_budget_lost_impression_share,
        metrics.search_rank_lost_impression_share,
        metrics.impressions, metrics.clicks, metrics.cost_micros
      FROM campaign WHERE segments.date ${dateRange}
        AND campaign.status = 'ENABLED' AND metrics.impressions > 0
    `);
    report.impressionShare = rows.map(r => ({
      campaign: r.campaign?.name,
      impressionShare: parseFloat(r.metrics?.searchImpressionShare || '0'),
      lostToBudget: parseFloat(r.metrics?.searchBudgetLostImpressionShare || '0'),
      lostToRank: parseFloat(r.metrics?.searchRankLostImpressionShare || '0'),
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
    }));
  }

  // ===== BUDGET =====
  if (shouldRun('budget')) {
    console.log('  Fetching budget info...');
    const rows = await gaqlQuery(auth, customerId, `
      SELECT campaign.name, campaign_budget.amount_micros, campaign.status
      FROM campaign WHERE campaign.status = 'ENABLED'
    `);
    report.budgets = rows.map(r => ({
      campaign: r.campaign?.name,
      dailyBudget: microsToDollars(r.campaignBudget?.amountMicros),
    }));
  }

  // ===== HOURLY PERFORMANCE =====
  if (shouldRun('hourly')) {
    console.log('  Fetching hourly performance...');
    const rows = await gaqlQuery(auth, customerId, `
      SELECT segments.hour, metrics.impressions, metrics.clicks,
        metrics.cost_micros, metrics.conversions
      FROM campaign WHERE segments.date ${dateRange}
        AND campaign.status = 'ENABLED'
      ORDER BY segments.hour
    `);
    // Aggregate by hour across campaigns
    const hourMap = {};
    rows.forEach(r => {
      const h = r.segments.hour;
      if (!hourMap[h]) hourMap[h] = { hour: parseInt(h), impressions: 0, clicks: 0, cost: 0, conversions: 0 };
      hourMap[h].impressions += parseInt(r.metrics?.impressions || '0', 10);
      hourMap[h].clicks += parseInt(r.metrics?.clicks || '0', 10);
      hourMap[h].cost += microsToDollars(r.metrics?.costMicros);
      hourMap[h].conversions += parseFloat(r.metrics?.conversions || '0');
    });
    report.hourlyPerformance = Object.values(hourMap).sort((a, b) => a.hour - b.hour);
  }

  // ===== DEVICE PERFORMANCE =====
  if (shouldRun('device')) {
    console.log('  Fetching device performance...');
    const rows = await gaqlQuery(auth, customerId, `
      SELECT segments.device, metrics.impressions, metrics.clicks,
        metrics.cost_micros, metrics.conversions, metrics.average_cpc
      FROM campaign WHERE segments.date ${dateRange}
        AND campaign.status = 'ENABLED'
    `);
    const deviceMap = {};
    rows.forEach(r => {
      const d = r.segments.device;
      if (!deviceMap[d]) deviceMap[d] = { device: d, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
      deviceMap[d].impressions += parseInt(r.metrics?.impressions || '0', 10);
      deviceMap[d].clicks += parseInt(r.metrics?.clicks || '0', 10);
      deviceMap[d].cost += microsToDollars(r.metrics?.costMicros);
      deviceMap[d].conversions += parseFloat(r.metrics?.conversions || '0');
    });
    report.devicePerformance = Object.values(deviceMap).sort((a, b) => b.cost - a.cost);
  }

  // ===== MONTHLY TRENDS =====
  if (shouldRun('monthly')) {
    console.log('  Fetching monthly trends...');
    const rows = await gaqlQuery(auth, customerId, `
      SELECT segments.month, metrics.impressions, metrics.clicks,
        metrics.cost_micros, metrics.conversions
      FROM campaign WHERE segments.date ${dateRange}
      ORDER BY segments.month
    `);
    const monthMap = {};
    rows.forEach(r => {
      const m = r.segments.month;
      if (!monthMap[m]) monthMap[m] = { month: m, impressions: 0, clicks: 0, cost: 0, conversions: 0 };
      monthMap[m].impressions += parseInt(r.metrics?.impressions || '0', 10);
      monthMap[m].clicks += parseInt(r.metrics?.clicks || '0', 10);
      monthMap[m].cost += microsToDollars(r.metrics?.costMicros);
      monthMap[m].conversions += parseFloat(r.metrics?.conversions || '0');
    });
    report.monthlyTrends = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  }

  // ===== AD EXTENSIONS =====
  if (shouldRun('extensions')) {
    console.log('  Fetching ad extensions...');
    try {
      const rows = await gaqlQuery(auth, customerId, `
        SELECT asset.type, asset.name, campaign_asset.status
        FROM campaign_asset WHERE campaign.status = 'ENABLED'
      `);
      report.extensions = rows.map(r => ({
        type: r.asset?.type, name: r.asset?.name, status: r.campaignAsset?.status,
      }));
    } catch (err) {
      console.log('  ⚠️  Extensions not available:', err.message);
      report.extensions = null;
    }
  }

  // ===== SUMMARY =====
  if (report.campaigns) {
    const totalCost = report.campaigns.reduce((sum, c) => sum + c.cost, 0);
    const totalClicks = report.campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = report.campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalConversions = report.campaigns.reduce((sum, c) => sum + c.conversions, 0);

    report.summary = {
      totalCost: Math.round(totalCost * 100) / 100,
      totalClicks, totalImpressions,
      totalConversions: Math.round(totalConversions * 100) / 100,
      costPerConversion: totalConversions > 0 ? Math.round(totalCost / totalConversions * 100) / 100 : null,
      ctr: totalImpressions > 0 ? Math.round(totalClicks / totalImpressions * 10000) / 100 : 0,
      searchTermCount: report.searchTerms?.length || 0,
      keywordCount: report.keywords?.length || 0,
    };
  }

  // ===== WRITE OUTPUT =====
  await mkdir('data/reports', { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n  ✅ Report saved to ${OUTPUT_PATH}\n`);

  // ===== CONSOLE SUMMARY =====
  if (report.summary) {
    console.log(`  Summary:`);
    console.log(`    Spend: $${report.summary.totalCost.toLocaleString()} | Clicks: ${report.summary.totalClicks.toLocaleString()} | CTR: ${report.summary.ctr}%`);
    console.log(`    Conversions: ${report.summary.totalConversions} | Cost/conv: ${report.summary.costPerConversion ? '$' + report.summary.costPerConversion : 'N/A'}`);
  }

  if (report.campaigns?.length > 0) {
    console.log(`\n  Campaigns:`);
    report.campaigns.forEach(c => {
      console.log(`    ${c.name} [${c.status}] — $${c.cost} spend, ${c.clicks} clicks, ${c.conversions} conv`);
    });
  }

  if (report.impressionShare?.length > 0) {
    console.log(`\n  Impression Share:`);
    report.impressionShare.forEach(s => {
      console.log(`    ${s.campaign}: ${(s.impressionShare * 100).toFixed(1)}% shown | ${(s.lostToBudget * 100).toFixed(1)}% lost to BUDGET | ${(s.lostToRank * 100).toFixed(1)}% lost to RANK`);
    });
  }

  if (report.budgets?.length > 0) {
    console.log(`\n  Daily Budgets:`);
    report.budgets.forEach(b => {
      console.log(`    ${b.campaign}: $${b.dailyBudget}/day`);
    });
  }

  if (report.hourlyPerformance?.length > 0) {
    console.log(`\n  Hourly Performance:`);
    console.log(`    Hour | Imp     | Clicks | Cost    | Conv`);
    report.hourlyPerformance.forEach(h => {
      const convFlag = h.conversions > 0 ? ' ✅' : '';
      console.log(`    ${String(h.hour).padStart(4)} | ${String(h.impressions).padStart(7)} | ${String(h.clicks).padStart(6)} | $${String(h.cost.toFixed(0)).padStart(5)} | ${h.conversions.toFixed(0)}${convFlag}`);
    });
  }

  if (report.devicePerformance?.length > 0) {
    console.log(`\n  Device Performance:`);
    report.devicePerformance.forEach(d => {
      const convRate = d.clicks > 0 ? ((d.conversions / d.clicks) * 100).toFixed(2) : '0';
      console.log(`    ${d.device}: $${d.cost.toFixed(0)} spend, ${d.clicks} clicks, ${d.conversions.toFixed(0)} conv (${convRate}% rate)`);
    });
  }

  if (report.monthlyTrends?.length > 0) {
    console.log(`\n  Monthly Trends:`);
    console.log(`    Month      | Spend     | Clicks | Conv | $/Conv`);
    report.monthlyTrends.forEach(m => {
      const cpc = m.conversions > 0 ? '$' + (m.cost / m.conversions).toFixed(0) : 'N/A';
      console.log(`    ${m.month} | $${String(m.cost.toFixed(0)).padStart(8)} | ${String(m.clicks).padStart(6)} | ${String(m.conversions.toFixed(0)).padStart(4)} | ${cpc}`);
    });
  }

  if (report.searchTerms?.length > 0) {
    console.log(`\n  Top 15 search terms by cost:`);
    report.searchTerms.slice(0, 15).forEach((s, i) => {
      const flag = s.conversions === 0 && s.cost > 5 ? ' ⚠️  NO CONV' : '';
      console.log(`    ${i + 1}. "${s.searchTerm}" — $${s.cost}, ${s.clicks} clicks, ${s.conversions} conv${flag}`);
    });
  }

  if (report.keywords?.length > 0) {
    console.log(`\n  Top 10 keywords by cost:`);
    report.keywords.slice(0, 10).forEach((k, i) => {
      console.log(`    ${i + 1}. [${k.matchType}] "${k.keyword}" — $${k.cost}, ${k.clicks} clicks, QS: ${k.qualityScore || '?'}, IS: ${(k.searchImpressionShare * 100).toFixed(0)}%`);
    });
  }

  if (report.extensions !== undefined) {
    if (report.extensions === null || report.extensions.length === 0) {
      console.log(`\n  ⚠️  No ad extensions found — missing sitelinks, callouts, structured snippets`);
    } else {
      console.log(`\n  Ad Extensions: ${report.extensions.length} active`);
    }
  }
}

main().catch(err => {
  console.error('❌ Google Ads report failed:', err.message);
  process.exit(1);
});
