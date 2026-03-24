#!/usr/bin/env node

/**
 * Google Ads Keyword & Ad Group Manager
 *
 * List, create, and manage keywords and ad groups. Supports bulk creation
 * of city-specific ad groups with keywords and responsive search ads.
 *
 * Usage:
 *   node scripts/google-ads-keywords.js --list                    # list all ad groups + keywords
 *   node scripts/google-ads-keywords.js --list-ad-groups          # list ad groups only
 *   node scripts/google-ads-keywords.js --add "keyword" --ad-group "Boston MA" --match PHRASE [--dry-run]
 *   node scripts/google-ads-keywords.js --create-city-groups \
 *     --state MA \
 *     --campaign "Leads-Search-3" \
 *     --base-keywords "foundation repair,basement crack repair" \
 *     [--execute]                                                  # dry-run by default
 *   node scripts/google-ads-keywords.js --add-broad \
 *     --campaign "Leads-Search-3" \
 *     [--execute]                                                  # add broader keywords to all city ad groups
 *   node scripts/google-ads-keywords.js --update-rsa \
 *     --campaign "Leads-Search-3" \
 *     [--execute]                                                  # update RSAs with improved headlines
 *   node scripts/google-ads-keywords.js --account MA              # target account (default: MA)
 */

import { writeFile, mkdir } from 'fs/promises';
import { authorize } from './lib/project-import-core.js';
import { gaqlQuery, getConfig, microsToDollars, mutateResource } from './lib/google-ads-client.js';
import { loadCityPages, filterCitiesByState, cityToAdGroupName } from './lib/city-pages.js';

const OUTPUT_PATH = 'data/reports/google-ads-keywords.json';

// Parse CLI args
const args = process.argv.slice(2);
const acctIdx = args.indexOf('--account');
const ACCOUNT_KEY = acctIdx !== -1 ? args[acctIdx + 1] : 'MA';
const LIST = args.includes('--list');
const LIST_AD_GROUPS = args.includes('--list-ad-groups');
const ADD = args.includes('--add');
const CREATE_CITY_GROUPS = args.includes('--create-city-groups');
const ADD_BROAD = args.includes('--add-broad');
const UPDATE_RSA = args.includes('--update-rsa');
const DRY_RUN = args.includes('--dry-run');
const EXECUTE = args.includes('--execute');

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

// ===== LIST AD GROUPS =====

async function listAdGroups(auth, customerId) {
  console.log('  Fetching ad groups...');
  const rows = await gaqlQuery(auth, customerId, `
    SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.resource_name,
      campaign.name, campaign.id, campaign.resource_name
    FROM ad_group
    WHERE campaign.status = 'ENABLED' AND ad_group.status != 'REMOVED'
    ORDER BY campaign.name, ad_group.name
  `);

  return rows.map(r => ({
    id: r.adGroup?.id,
    name: r.adGroup?.name,
    status: r.adGroup?.status,
    resourceName: r.adGroup?.resourceName,
    campaign: r.campaign?.name,
    campaignId: r.campaign?.id,
    campaignResource: r.campaign?.resourceName,
  }));
}

// ===== LIST KEYWORDS =====

async function listKeywords(auth, customerId) {
  console.log('  Fetching keywords...');
  const rows = await gaqlQuery(auth, customerId, `
    SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
      ad_group_criterion.status, ad_group_criterion.resource_name,
      ad_group_criterion.negative,
      campaign.name, ad_group.name, ad_group.id,
      metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
    FROM keyword_view
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY ad_group.name, metrics.cost_micros DESC
  `);

  return rows.map(r => ({
    keyword: r.adGroupCriterion?.keyword?.text,
    matchType: r.adGroupCriterion?.keyword?.matchType,
    status: r.adGroupCriterion?.status,
    resourceName: r.adGroupCriterion?.resourceName,
    negative: r.adGroupCriterion?.negative || false,
    campaign: r.campaign?.name,
    adGroup: r.adGroup?.name,
    adGroupId: r.adGroup?.id,
    impressions: parseInt(r.metrics?.impressions || '0', 10),
    clicks: parseInt(r.metrics?.clicks || '0', 10),
    cost: microsToDollars(r.metrics?.costMicros),
    conversions: parseFloat(r.metrics?.conversions || '0'),
  }));
}

// ===== FIND CAMPAIGN BY NAME =====

async function findCampaign(auth, customerId, campaignName) {
  const rows = await gaqlQuery(auth, customerId, `
    SELECT campaign.resource_name, campaign.name, campaign.id
    FROM campaign WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
  `);
  if (rows.length === 0) throw new Error(`Campaign "${campaignName}" not found`);
  return {
    resourceName: rows[0].campaign?.resourceName,
    name: rows[0].campaign?.name,
    id: rows[0].campaign?.id,
  };
}

// ===== FIND AD GROUP BY NAME =====

async function findAdGroup(auth, customerId, adGroupName) {
  const rows = await gaqlQuery(auth, customerId, `
    SELECT ad_group.resource_name, ad_group.name, ad_group.id
    FROM ad_group
    WHERE ad_group.name = '${adGroupName.replace(/'/g, "\\'")}'
      AND ad_group.status != 'REMOVED'
  `);
  if (rows.length === 0) return null;
  return {
    resourceName: rows[0].adGroup?.resourceName,
    name: rows[0].adGroup?.name,
    id: rows[0].adGroup?.id,
  };
}

// ===== ADD KEYWORD TO AD GROUP =====

async function addKeyword(auth, customerId, { adGroupName, keyword, matchType, dryRun }) {
  const adGroup = await findAdGroup(auth, customerId, adGroupName);
  if (!adGroup) throw new Error(`Ad group "${adGroupName}" not found`);

  const normalizedMatch = matchType.toUpperCase();
  if (!['BROAD', 'PHRASE', 'EXACT'].includes(normalizedMatch)) {
    throw new Error(`Invalid match type "${matchType}". Use BROAD, PHRASE, or EXACT.`);
  }

  const operation = {
    create: {
      adGroup: adGroup.resourceName,
      keyword: { text: keyword, matchType: normalizedMatch },
      status: 'ENABLED',
    },
  };

  if (dryRun) {
    console.log(`\n  [DRY RUN] Would add keyword:`);
    console.log(`    "${keyword}" (${normalizedMatch}) → ad group "${adGroupName}"`);
    return { dryRun: true };
  }

  console.log(`  Adding "${keyword}" (${normalizedMatch}) → "${adGroupName}"...`);
  const result = await mutateResource(auth, customerId, 'adGroupCriteria', [operation]);
  console.log(`  ✅ Keyword added`);
  return result;
}

// ===== GENERATE CITY KEYWORDS =====

function generateCityKeywords(baseKeywords, city) {
  const keywords = [];
  const cityLower = city.city.toLowerCase();
  const stateAbbrLower = city.stateAbbr.toLowerCase();

  for (const base of baseKeywords) {
    // "foundation repair boston" — PHRASE
    keywords.push({
      text: `${base} ${cityLower}`,
      matchType: 'PHRASE',
    });
    // "foundation repair boston ma" — PHRASE
    keywords.push({
      text: `${base} ${cityLower} ${stateAbbrLower}`,
      matchType: 'PHRASE',
    });
    // "[foundation repair boston]" — EXACT
    keywords.push({
      text: `${base} ${cityLower}`,
      matchType: 'EXACT',
    });
  }

  return keywords;
}

// ===== GENERATE RSA HEADLINES & DESCRIPTIONS =====

// Pick the first option that fits within maxLen chars
function pickHeadline(options, maxLen = 30) {
  for (const opt of options) {
    if (opt.length <= maxLen) return opt;
  }
  return null; // all too long — shouldn't happen with good fallbacks
}

function generateRSA(city, baseKeywords) {
  const { city: cityName, stateAbbr } = city;

  // Build 15 headlines with fallbacks for long city names (30 char max)
  const headlines = [
    // 1. Primary service + city (pinned to headline 1)
    pickHeadline([
      `Foundation Repair ${cityName}`,
      `Foundation Repair ${stateAbbr}`,
    ]),
    // 2. City + state + service variant
    pickHeadline([
      `${cityName} ${stateAbbr} Foundation Repair`,
      `${cityName} ${stateAbbr} Crack Repair`,
      `${cityName} Foundation Repair`,
    ]),
    // 3. Dynamic keyword insertion
    '{Keyword:Foundation Repair}',
    // 4. Service variant + city
    pickHeadline([
      `Basement Crack Repair ${cityName}`,
      `Crack Repair ${cityName} ${stateAbbr}`,
      `Basement Repair ${cityName}`,
    ]),
    // 5. Authority
    pickHeadline([
      `${cityName} Foundation Experts`,
      `${cityName} Repair Experts`,
    ]),
    // 6. CTA
    'Free Estimate - Call Now',
    // 7. Trust
    'Lifetime Guarantee',
    // 8. Social proof
    '260+ 5-Star Reviews',
    // 9. Credibility
    '20+ Years Experience',
    // 10. Urgency
    'Same-Day Estimates Available',
    // 11. "Near me" variant (matches broad keywords)
    'Foundation Repair Near Me',
    // 12. Service variant (matches broad keyword)
    'Basement Waterproofing',
    // 13. Differentiator vs corporate competitors
    'Family Owned, Not Corporate',
    // 14. Trust / differentiator
    'No Upsells, Just Repairs',
    // 15. CTA variant
    'Free Foundation Inspection',
  ].filter(Boolean).filter(h => h.length <= 30).slice(0, 15);

  // Descriptions (max 90 chars each, 4 required)
  const descriptions = [
    pickHeadline([
      `Expert foundation crack repair in ${cityName}, ${stateAbbr}. Lifetime guarantee. Call today!`,
      `Expert foundation crack repair in ${cityName}. Lifetime guarantee. Call today!`,
    ], 90),
    'Family owned, 20+ years experience. 260+ 5-star reviews. Not a franchise.',
    pickHeadline([
      `Professional basement crack repair in ${cityName}. Free estimates. No obligation.`,
      `Professional crack repair in ${cityName}, ${stateAbbr}. Free estimates. No obligation.`,
    ], 90),
    pickHeadline([
      `Higher quality repairs guaranteed for life. Serving ${cityName} and all of ${stateAbbr}.`,
      `Higher quality repairs guaranteed for life. Serving ${cityName} area.`,
    ], 90),
  ].filter(Boolean).filter(d => d.length <= 90).slice(0, 4);

  return { headlines, descriptions };
}

// ===== CREATE CITY AD GROUPS =====

async function createCityGroups(auth, customerId, { campaignName, stateAbbr, baseKeywords, execute }) {
  // Load cities
  const allCities = await loadCityPages();
  const cities = filterCitiesByState(allCities, stateAbbr);
  if (cities.length === 0) throw new Error(`No cities found for state "${stateAbbr}"`);

  // Find campaign
  console.log(`  Finding campaign "${campaignName}"...`);
  const campaign = await findCampaign(auth, customerId, campaignName);
  console.log(`  ✅ Campaign: ${campaign.name} (${campaign.resourceName})`);

  // Get existing ad groups for idempotency
  console.log('  Checking existing ad groups...');
  const existingGroups = await listAdGroups(auth, customerId);
  const existingNames = new Set(existingGroups.map(g => g.name));

  const plan = [];
  const skipped = [];

  for (const city of cities) {
    const adGroupName = cityToAdGroupName(city.city, city.stateAbbr);
    if (existingNames.has(adGroupName)) {
      skipped.push(adGroupName);
      continue;
    }

    const keywords = generateCityKeywords(baseKeywords, city);
    const rsa = generateRSA(city, baseKeywords);
    const landingUrl = `https://www.attackacrack.com${city.url}`;

    plan.push({ city, adGroupName, keywords, rsa, landingUrl });
  }

  // Report plan
  console.log(`\n  📋 City Ad Group Plan for ${stateAbbr}:`);
  console.log(`    Campaign: ${campaignName}`);
  console.log(`    Cities to create: ${plan.length}`);
  console.log(`    Already existing (skip): ${skipped.length}`);
  console.log(`    Keywords per city: ${plan[0]?.keywords.length || 0}`);
  console.log(`    Total new keywords: ${plan.reduce((sum, p) => sum + p.keywords.length, 0)}`);
  console.log(`    Base keywords: ${baseKeywords.join(', ')}`);

  if (skipped.length > 0) {
    console.log(`\n  ⏭️  Skipping existing: ${skipped.join(', ')}`);
  }

  if (plan.length === 0) {
    console.log('\n  ✅ All city ad groups already exist. Nothing to create.');
    return { created: 0, skipped: skipped.length };
  }

  // Show preview
  console.log(`\n  Preview (first 3 cities):`);
  for (const item of plan.slice(0, 3)) {
    console.log(`\n    📍 ${item.adGroupName}`);
    console.log(`       Landing: ${item.landingUrl}`);
    console.log(`       Keywords:`);
    for (const kw of item.keywords) {
      const display = kw.matchType === 'EXACT' ? `[${kw.text}]` : `"${kw.text}"`;
      console.log(`         ${display} (${kw.matchType})`);
    }
    console.log(`       RSA Headlines (${item.rsa.headlines.length}): ${item.rsa.headlines.slice(0, 3).join(' | ')} ...`);
  }

  if (!execute) {
    console.log(`\n  ⚠️  DRY RUN — pass --execute to create these ad groups.`);
    console.log(`     Command: npm run ads:keywords -- --create-city-groups --state ${stateAbbr} --campaign "${campaignName}" --base-keywords "${baseKeywords.join(',')}" --execute`);

    // Save plan to file for review
    const report = { dryRun: true, campaign: campaignName, state: stateAbbr, plan, skipped };
    await mkdir('data/reports', { recursive: true });
    await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));
    console.log(`\n  📄 Full plan saved to ${OUTPUT_PATH}`);
    return { dryRun: true, planned: plan.length, skipped: skipped.length };
  }

  // Execute creation
  console.log(`\n  🚀 Creating ${plan.length} city ad groups...`);
  const results = [];

  for (const item of plan) {
    try {
      console.log(`\n  Creating "${item.adGroupName}"...`);

      // 1. Create ad group
      const agResult = await mutateResource(auth, customerId, 'adGroups', [{
        create: {
          campaign: campaign.resourceName,
          name: item.adGroupName,
          status: 'ENABLED',
          type: 'SEARCH_STANDARD',
        },
      }]);
      const adGroupResource = agResult.results?.[0]?.resourceName;
      console.log(`    ✅ Ad group created: ${adGroupResource}`);

      // 2. Add keywords (batched)
      const kwOps = item.keywords.map(kw => ({
        create: {
          adGroup: adGroupResource,
          keyword: { text: kw.text, matchType: kw.matchType },
          status: 'ENABLED',
        },
      }));
      await mutateResource(auth, customerId, 'adGroupCriteria', kwOps);
      console.log(`    ✅ ${kwOps.length} keywords added`);

      // 3. Create RSA with landing page
      const rsaPayload = {
        create: {
          adGroup: adGroupResource,
          ad: {
            responsiveSearchAd: {
              headlines: item.rsa.headlines.map((text, i) => ({
                text,
                ...(i === 0 ? { pinnedField: 'HEADLINE_1' } : {}), // Pin first headline (city name)
              })),
              descriptions: item.rsa.descriptions.map(text => ({ text })),
            },
            finalUrls: [item.landingUrl],
          },
          status: 'ENABLED',
        },
      };
      await mutateResource(auth, customerId, 'adGroupAds', [rsaPayload]);
      console.log(`    ✅ RSA created → ${item.landingUrl}`);

      results.push({ adGroupName: item.adGroupName, status: 'created', adGroupResource });
    } catch (err) {
      console.log(`    ❌ Failed: ${err.message}`);
      results.push({ adGroupName: item.adGroupName, status: 'failed', error: err.message });
    }
  }

  // Summary
  const created = results.filter(r => r.status === 'created').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`\n  📊 Results: ${created} created, ${failed} failed, ${skipped.length} skipped`);

  // Save results
  const report = { dryRun: false, campaign: campaignName, state: stateAbbr, results, skipped };
  await mkdir('data/reports', { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));
  console.log(`  📄 Results saved to ${OUTPUT_PATH}`);

  return { created, failed, skipped: skipped.length };
}

// ===== BROAD KEYWORDS FOR CITY AD GROUPS =====

const BROAD_KEYWORDS = [
  { text: 'foundation repair near me', matchType: 'PHRASE' },
  { text: 'basement crack repair', matchType: 'PHRASE' },
  { text: 'foundation contractor', matchType: 'PHRASE' },
  { text: 'basement waterproofing', matchType: 'PHRASE' },
];

async function addBroadKeywords(auth, customerId, { campaignName, execute }) {
  // Find campaign
  console.log(`  Finding campaign "${campaignName}"...`);
  const campaign = await findCampaign(auth, customerId, campaignName);
  console.log(`  ✅ Campaign: ${campaign.name} (${campaign.resourceName})`);

  // Get all city ad groups in this campaign (match "City ST" pattern, skip generic groups like "Ad group 1")
  const adGroups = await listAdGroups(auth, customerId);
  const cityPattern = /^[A-Z][a-zA-Z\s]+\s[A-Z]{2}$/;
  const allCampaignGroups = adGroups.filter(ag => ag.campaign === campaign.name);
  const campaignGroups = allCampaignGroups.filter(ag => cityPattern.test(ag.name));
  const skippedGroups = allCampaignGroups.filter(ag => !cityPattern.test(ag.name));
  console.log(`  Found ${campaignGroups.length} city ad groups in campaign (skipping ${skippedGroups.length} non-city groups)`);
  if (skippedGroups.length > 0) {
    console.log(`  Skipped: ${skippedGroups.map(g => g.name).join(', ')}`);
  }

  if (campaignGroups.length === 0) {
    console.log('  ⚠️  No ad groups found. Nothing to do.');
    return { added: 0, skipped: 0 };
  }

  // Get existing keywords to avoid duplicates
  console.log('  Fetching existing keywords for dedup...');
  const existingKeywords = await gaqlQuery(auth, customerId, `
    SELECT ad_group.id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
    FROM keyword_view
    WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
  `);

  // Build lookup: adGroupId -> Set of "text|matchType"
  const existingLookup = {};
  for (const row of existingKeywords) {
    const agId = row.adGroup?.id;
    if (!agId) continue;
    if (!existingLookup[agId]) existingLookup[agId] = new Set();
    const key = `${row.adGroupCriterion?.keyword?.text?.toLowerCase()}|${row.adGroupCriterion?.keyword?.matchType}`;
    existingLookup[agId].add(key);
  }

  // Plan additions
  const plan = [];
  let skipCount = 0;

  for (const ag of campaignGroups) {
    const existing = existingLookup[ag.id] || new Set();
    const toAdd = [];

    for (const kw of BROAD_KEYWORDS) {
      const key = `${kw.text.toLowerCase()}|${kw.matchType}`;
      if (existing.has(key)) {
        skipCount++;
        continue;
      }
      toAdd.push(kw);
    }

    if (toAdd.length > 0) {
      plan.push({ adGroup: ag, keywords: toAdd });
    }
  }

  const totalNew = plan.reduce((sum, p) => sum + p.keywords.length, 0);

  console.log(`\n  📋 Broad Keyword Plan:`);
  console.log(`    Ad groups to update: ${plan.length} of ${campaignGroups.length}`);
  console.log(`    Keywords to add: ${totalNew}`);
  console.log(`    Already existing (skip): ${skipCount}`);
  console.log(`    Keywords: ${BROAD_KEYWORDS.map(k => `"${k.text}" (${k.matchType})`).join(', ')}`);

  if (totalNew === 0) {
    console.log('\n  ✅ All broad keywords already exist in all ad groups. Nothing to add.');
    return { added: 0, skipped: skipCount };
  }

  // Preview first 3
  console.log(`\n  Preview (first 3 ad groups):`);
  for (const item of plan.slice(0, 3)) {
    console.log(`    📂 ${item.adGroup.name}: +${item.keywords.length} keywords`);
    for (const kw of item.keywords) {
      console.log(`       "${kw.text}" (${kw.matchType})`);
    }
  }

  if (!execute) {
    console.log(`\n  ⚠️  DRY RUN — pass --execute to add these keywords.`);
    console.log(`     Command: npm run ads:keywords -- --add-broad --campaign "${campaignName}" --execute`);
    return { dryRun: true, planned: totalNew, skipped: skipCount };
  }

  // Execute
  console.log(`\n  🚀 Adding broad keywords to ${plan.length} ad groups...`);
  let addedTotal = 0;
  let failedTotal = 0;

  for (const item of plan) {
    try {
      const ops = item.keywords.map(kw => ({
        create: {
          adGroup: item.adGroup.resourceName,
          keyword: { text: kw.text, matchType: kw.matchType },
          status: 'ENABLED',
        },
      }));
      await mutateResource(auth, customerId, 'adGroupCriteria', ops);
      addedTotal += ops.length;
      console.log(`    ✅ ${item.adGroup.name}: +${ops.length} keywords`);
    } catch (err) {
      failedTotal += item.keywords.length;
      console.log(`    ❌ ${item.adGroup.name}: ${err.message}`);
    }
  }

  console.log(`\n  📊 Results: ${addedTotal} added, ${failedTotal} failed, ${skipCount} already existed`);
  return { added: addedTotal, failed: failedTotal, skipped: skipCount };
}

// ===== UPDATE RSAs ON CITY AD GROUPS =====

async function updateRSAs(auth, customerId, { campaignName, execute }) {
  // Load cities for URL/name mapping
  const allCities = await loadCityPages();
  const cityMap = new Map();
  for (const city of allCities) {
    cityMap.set(cityToAdGroupName(city.city, city.stateAbbr), city);
  }

  // Find campaign
  console.log(`  Finding campaign "${campaignName}"...`);
  const campaign = await findCampaign(auth, customerId, campaignName);
  console.log(`  ✅ Campaign: ${campaign.name}`);

  // Get city ad groups
  const adGroups = await listAdGroups(auth, customerId);
  const cityPattern = /^[A-Z][a-zA-Z\s]+\s[A-Z]{2}$/;
  const cityGroups = adGroups.filter(ag => ag.campaign === campaign.name && cityPattern.test(ag.name));
  console.log(`  Found ${cityGroups.length} city ad groups`);

  // Get existing RSAs
  console.log('  Fetching existing RSAs...');
  const existingAds = await gaqlQuery(auth, customerId, `
    SELECT ad_group.name, ad_group.resource_name,
      ad_group_ad.resource_name, ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad.final_urls, ad_group_ad.ad_strength
    FROM ad_group_ad
    WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
      AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      AND ad_group_ad.status = 'ENABLED'
  `);

  // Map ad group name -> existing RSA info
  const adMap = new Map();
  for (const row of existingAds) {
    adMap.set(row.adGroup?.name, {
      adResource: row.adGroupAd?.resourceName,
      agResource: row.adGroup?.resourceName,
      strength: row.adGroupAd?.adStrength,
      headlineCount: row.adGroupAd?.ad?.responsiveSearchAd?.headlines?.length || 0,
      descCount: row.adGroupAd?.ad?.responsiveSearchAd?.descriptions?.length || 0,
      finalUrls: row.adGroupAd?.ad?.finalUrls,
    });
  }

  // Plan updates
  const plan = [];
  const skipped = [];

  for (const ag of cityGroups) {
    const city = cityMap.get(ag.name);
    if (!city) {
      skipped.push({ name: ag.name, reason: 'no city match' });
      continue;
    }

    const existing = adMap.get(ag.name);
    const rsa = generateRSA(city, ['foundation repair', 'basement crack repair']);
    const landingUrl = `https://www.attackacrack.com${city.url}`;

    plan.push({
      adGroupName: ag.name,
      adGroupResource: ag.resourceName,
      existingAdResource: existing?.adResource || null,
      currentStrength: existing?.strength || 'NONE',
      currentHeadlines: existing?.headlineCount || 0,
      newHeadlines: rsa.headlines.length,
      newDescriptions: rsa.descriptions.length,
      rsa,
      landingUrl,
    });
  }

  // Summary
  const strengths = {};
  for (const p of plan) {
    strengths[p.currentStrength] = (strengths[p.currentStrength] || 0) + 1;
  }

  console.log(`\n  📋 RSA Update Plan:`);
  console.log(`    Ad groups to update: ${plan.length}`);
  console.log(`    Skipped: ${skipped.length}`);
  console.log(`    Current ad strength: ${Object.entries(strengths).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  console.log(`    New headline count: 15 (all cities)`);
  console.log(`    New description count: 4 (all cities)`);

  if (skipped.length > 0) {
    console.log(`\n  ⏭️  Skipped: ${skipped.map(s => `${s.name} (${s.reason})`).join(', ')}`);
  }

  // Preview first 3
  console.log(`\n  Preview (first 3):`);
  for (const item of plan.slice(0, 3)) {
    console.log(`\n    📍 ${item.adGroupName} (current: ${item.currentStrength}, ${item.currentHeadlines}h)`);
    console.log(`       Headlines (${item.rsa.headlines.length}):`);
    for (const h of item.rsa.headlines) {
      console.log(`         ${h} (${h.length})`);
    }
    console.log(`       Descriptions (${item.rsa.descriptions.length}):`);
    for (const d of item.rsa.descriptions) {
      console.log(`         ${d} (${d.length})`);
    }
  }

  if (!execute) {
    console.log(`\n  ⚠️  DRY RUN — pass --execute to update these RSAs.`);
    console.log(`     Command: npm run ads:keywords -- --update-rsa --campaign "${campaignName}" --execute`);
    return { dryRun: true, planned: plan.length, skipped: skipped.length };
  }

  // Execute: remove old RSA, create new one
  console.log(`\n  🚀 Updating RSAs on ${plan.length} ad groups...`);
  let updated = 0;
  let failed = 0;

  for (const item of plan) {
    try {
      // Remove existing RSA if present
      if (item.existingAdResource) {
        await mutateResource(auth, customerId, 'adGroupAds', [{
          remove: item.existingAdResource,
        }]);
      }

      // Create new RSA
      const rsaPayload = {
        create: {
          adGroup: item.adGroupResource,
          ad: {
            responsiveSearchAd: {
              headlines: item.rsa.headlines.map((text, i) => ({
                text,
                ...(i === 0 ? { pinnedField: 'HEADLINE_1' } : {}),
              })),
              descriptions: item.rsa.descriptions.map(text => ({ text })),
            },
            finalUrls: [item.landingUrl],
          },
          status: 'ENABLED',
        },
      };
      await mutateResource(auth, customerId, 'adGroupAds', [rsaPayload]);
      updated++;
      console.log(`    ✅ ${item.adGroupName}: 15h/4d → ${item.landingUrl}`);
    } catch (err) {
      failed++;
      console.log(`    ❌ ${item.adGroupName}: ${err.message}`);
    }
  }

  console.log(`\n  📊 Results: ${updated} updated, ${failed} failed, ${skipped.length} skipped`);
  return { updated, failed, skipped: skipped.length };
}

// ===== MAIN =====

async function main() {
  const auth = await authorize();
  const config = await getConfig();
  const customerId = config.accounts[ACCOUNT_KEY];

  if (!customerId) {
    console.error(`❌ No account for "${ACCOUNT_KEY}". Available: ${Object.keys(config.accounts).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🔑 Google Ads Keywords — ${ACCOUNT_KEY} (${customerId})\n`);

  if (LIST || LIST_AD_GROUPS) {
    const adGroups = await listAdGroups(auth, customerId);
    console.log(`\n  Ad Groups (${adGroups.length}):`);
    for (const ag of adGroups) {
      console.log(`    ${ag.name} [${ag.status}] — campaign: ${ag.campaign}`);
    }

    if (LIST) {
      const keywords = await listKeywords(auth, customerId);
      console.log(`\n  Keywords (${keywords.length}):`);

      // Group by ad group
      const grouped = {};
      for (const kw of keywords) {
        const key = kw.adGroup || '(ungrouped)';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(kw);
      }

      for (const [group, kws] of Object.entries(grouped)) {
        console.log(`\n    📂 ${group}:`);
        for (const kw of kws) {
          const display = kw.matchType === 'EXACT' ? `[${kw.keyword}]`
            : kw.matchType === 'PHRASE' ? `"${kw.keyword}"`
            : kw.keyword;
          const neg = kw.negative ? ' [NEGATIVE]' : '';
          console.log(`      ${display} — ${kw.clicks} clicks, $${kw.cost}, ${kw.conversions} conv${neg}`);
        }
      }

      // Save report
      const report = { generatedAt: new Date().toISOString(), account: ACCOUNT_KEY, adGroups, keywords };
      await mkdir('data/reports', { recursive: true });
      await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));
      console.log(`\n  ✅ Report saved to ${OUTPUT_PATH}`);
    }

  } else if (ADD) {
    const addIdx = args.indexOf('--add');
    const keyword = args[addIdx + 1];
    const adGroupName = getArg('--ad-group');
    const matchType = getArg('--match') || 'PHRASE';

    if (!keyword || !adGroupName) {
      console.error('❌ Usage: --add "keyword" --ad-group "Ad Group Name" [--match PHRASE|EXACT|BROAD]');
      process.exit(1);
    }

    await addKeyword(auth, customerId, { adGroupName, keyword, matchType, dryRun: DRY_RUN });

  } else if (UPDATE_RSA) {
    const campaignName = getArg('--campaign');
    if (!campaignName) {
      console.error('❌ Usage: --update-rsa --campaign "Campaign Name" [--execute]');
      process.exit(1);
    }
    await updateRSAs(auth, customerId, { campaignName, execute: EXECUTE });

  } else if (ADD_BROAD) {
    const campaignName = getArg('--campaign');
    if (!campaignName) {
      console.error('❌ Usage: --add-broad --campaign "Campaign Name" [--execute]');
      process.exit(1);
    }
    await addBroadKeywords(auth, customerId, { campaignName, execute: EXECUTE });

  } else if (CREATE_CITY_GROUPS) {
    const stateAbbr = getArg('--state');
    const campaignName = getArg('--campaign');
    const baseKeywordsRaw = getArg('--base-keywords');

    if (!stateAbbr || !campaignName || !baseKeywordsRaw) {
      console.error('❌ Usage: --create-city-groups --state MA --campaign "Campaign Name" --base-keywords "foundation repair,crack repair"');
      process.exit(1);
    }

    const baseKeywords = baseKeywordsRaw.split(',').map(k => k.trim().toLowerCase());
    await createCityGroups(auth, customerId, {
      campaignName,
      stateAbbr,
      baseKeywords,
      execute: EXECUTE,
    });

  } else {
    console.log('  Usage:');
    console.log('    --list                    List all ad groups + keywords');
    console.log('    --list-ad-groups          List ad groups only');
    console.log('    --add "kw" --ad-group "X" Add keyword to ad group');
    console.log('    --create-city-groups      Bulk create city ad groups');
    console.log('    --add-broad --campaign X  Add broader keywords to all city ad groups');
    console.log('    --update-rsa --campaign X Update RSAs on all city ad groups');
    console.log('    --account MA|CT           Target account (default: MA)');
  }
}

main().catch(err => {
  console.error('❌ Keywords script failed:', err.message);
  process.exit(1);
});
