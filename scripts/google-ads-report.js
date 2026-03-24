#!/usr/bin/env node

/**
 * Google Ads Report
 *
 * Pulls campaign performance, search terms (waste audit), keyword performance,
 * and geographic data from the Google Ads REST API using GAQL.
 * Outputs JSON to data/reports/google-ads-report.json.
 *
 * Usage:
 *   node scripts/google-ads-report.js              # last 30 days
 *   node scripts/google-ads-report.js --days 90    # last 90 days
 *   node scripts/google-ads-report.js --account MA  # specific account (default: MA)
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

// GAQL date range — only a few DURING literals exist, use explicit dates for everything else
const DURING_LITERALS = { 7: 'LAST_7_DAYS', 14: 'LAST_14_DAYS', 30: 'LAST_30_DAYS' };
const dateRange = DURING_LITERALS[DAYS]
  ? `DURING ${DURING_LITERALS[DAYS]}`
  : `BETWEEN '${daysAgo(DAYS)}' AND '${daysAgo(1)}'`;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log(`\n📊 Google Ads Report — ${ACCOUNT_KEY} account (last ${DAYS} days)\n`);

  const auth = await authorize();
  const config = await getConfig();
  const customerId = config.accounts[ACCOUNT_KEY];

  if (!customerId) {
    console.error(`❌ No account ID found for "${ACCOUNT_KEY}" in google-ads-config.json`);
    console.error(`   Available accounts: ${Object.keys(config.accounts).join(', ')}`);
    process.exit(1);
  }

  console.log(`  Account: ${ACCOUNT_KEY} (${customerId})`);
  console.log(`  MCC: ${config.managerAccountId}\n`);

  // 1. Campaign Summary
  console.log('  Fetching campaign performance...');
  const campaignRows = await gaqlQuery(auth, customerId, `
    SELECT
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date ${dateRange}
    ORDER BY metrics.cost_micros DESC
  `);

  const campaigns = campaignRows.map(r => ({
    name: r.campaign?.name,
    status: r.campaign?.status,
    impressions: parseInt(r.metrics?.impressions || '0', 10),
    clicks: parseInt(r.metrics?.clicks || '0', 10),
    cost: microsToDollars(r.metrics?.costMicros),
    conversions: parseFloat(r.metrics?.conversions || '0'),
    conversionValue: parseFloat(r.metrics?.conversionsValue || '0'),
    avgCpc: microsToDollars(r.metrics?.averageCpc),
  }));

  // 2. Search Terms (waste audit)
  console.log('  Fetching search terms...');
  const searchTermRows = await gaqlQuery(auth, customerId, `
    SELECT
      search_term_view.search_term,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM search_term_view
    WHERE segments.date ${dateRange}
      AND metrics.clicks > 0
    ORDER BY metrics.cost_micros DESC
  `);

  const searchTerms = searchTermRows.map(r => ({
    searchTerm: r.searchTermView?.searchTerm,
    campaign: r.campaign?.name,
    impressions: parseInt(r.metrics?.impressions || '0', 10),
    clicks: parseInt(r.metrics?.clicks || '0', 10),
    cost: microsToDollars(r.metrics?.costMicros),
    conversions: parseFloat(r.metrics?.conversions || '0'),
    conversionValue: parseFloat(r.metrics?.conversionsValue || '0'),
  }));

  // 3. Keyword Performance
  console.log('  Fetching keyword performance...');
  const keywordRows = await gaqlQuery(auth, customerId, `
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      campaign.name,
      ad_group.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.search_impression_share,
      ad_group_criterion.quality_info.quality_score
    FROM keyword_view
    WHERE segments.date ${dateRange}
      AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC
  `);

  const keywords = keywordRows.map(r => ({
    keyword: r.adGroupCriterion?.keyword?.text,
    matchType: r.adGroupCriterion?.keyword?.matchType,
    campaign: r.campaign?.name,
    adGroup: r.adGroup?.name,
    impressions: parseInt(r.metrics?.impressions || '0', 10),
    clicks: parseInt(r.metrics?.clicks || '0', 10),
    cost: microsToDollars(r.metrics?.costMicros),
    conversions: parseFloat(r.metrics?.conversions || '0'),
    searchImpressionShare: parseFloat(r.metrics?.searchImpressionShare || '0'),
    qualityScore: r.adGroupCriterion?.qualityInfo?.qualityScore || null,
  }));

  // 4. Geographic Performance
  console.log('  Fetching geographic performance...');
  let geographic = [];
  try {
    const geoRows = await gaqlQuery(auth, customerId, `
      SELECT
        geographic_view.country_criterion_id,
        geographic_view.location_type,
        campaign.name,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM geographic_view
      WHERE segments.date ${dateRange}
        AND metrics.clicks > 0
      ORDER BY metrics.cost_micros DESC
    `);

    geographic = geoRows.map(r => ({
      countryCriterionId: r.geographicView?.countryCriterionId,
      locationType: r.geographicView?.locationType,
      campaign: r.campaign?.name,
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
      conversions: parseFloat(r.metrics?.conversions || '0'),
    }));
  } catch (err) {
    console.log('  ⚠️  Geographic data not available:', err.message);
  }

  // Summary
  const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    period: { days: DAYS, start: daysAgo(DAYS), end: daysAgo(0) },
    account: `${ACCOUNT_KEY} (${customerId})`,
    campaigns,
    searchTerms,
    keywords,
    geographic,
    summary: {
      totalCost: Math.round(totalCost * 100) / 100,
      totalClicks,
      totalImpressions,
      totalConversions: Math.round(totalConversions * 100) / 100,
      costPerConversion: totalConversions > 0
        ? Math.round(totalCost / totalConversions * 100) / 100
        : null,
      ctr: totalImpressions > 0
        ? Math.round(totalClicks / totalImpressions * 10000) / 100
        : 0,
      searchTermCount: searchTerms.length,
      keywordCount: keywords.length,
    },
  };

  // Write output
  await mkdir('data/reports', { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));

  // Console summary
  console.log(`\n  ✅ Report saved to ${OUTPUT_PATH}\n`);
  console.log(`  Summary:`);
  console.log(`    Total spend: $${report.summary.totalCost.toLocaleString()}`);
  console.log(`    Clicks: ${totalClicks.toLocaleString()}`);
  console.log(`    Impressions: ${totalImpressions.toLocaleString()}`);
  console.log(`    CTR: ${report.summary.ctr}%`);
  console.log(`    Conversions: ${report.summary.totalConversions}`);
  console.log(`    Cost/conversion: ${report.summary.costPerConversion ? '$' + report.summary.costPerConversion : 'N/A (no conversions yet)'}`);
  console.log(`    Search terms: ${searchTerms.length}`);
  console.log(`    Keywords: ${keywords.length}`);

  if (campaigns.length > 0) {
    console.log(`\n  Campaigns:`);
    campaigns.forEach(c => {
      console.log(`    ${c.name} [${c.status}] — $${c.cost} spend, ${c.clicks} clicks, ${c.conversions} conv`);
    });
  }

  if (searchTerms.length > 0) {
    console.log(`\n  Top 15 search terms by cost (waste audit candidates):`);
    searchTerms.slice(0, 15).forEach((s, i) => {
      const flag = s.conversions === 0 && s.cost > 5 ? ' ⚠️  NO CONVERSIONS' : '';
      console.log(`    ${i + 1}. "${s.searchTerm}" — $${s.cost}, ${s.clicks} clicks, ${s.conversions} conv${flag}`);
    });
  }

  if (keywords.length > 0) {
    console.log(`\n  Top 10 keywords by cost:`);
    keywords.slice(0, 10).forEach((k, i) => {
      console.log(`    ${i + 1}. [${k.matchType}] "${k.keyword}" — $${k.cost}, ${k.clicks} clicks, QS: ${k.qualityScore || '?'}`);
    });
  }
}

main().catch(err => {
  console.error('❌ Google Ads report failed:', err.message);
  process.exit(1);
});
