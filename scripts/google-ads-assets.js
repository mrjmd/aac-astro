#!/usr/bin/env node

/**
 * Google Ads Asset Manager
 *
 * List, create, pause, and optimize ad assets (sitelinks, callouts,
 * structured snippets, call extensions) via the Google Ads REST API.
 *
 * Usage:
 *   node scripts/google-ads-assets.js --list                     # all assets with performance
 *   node scripts/google-ads-assets.js --list --type sitelink      # filter by type
 *   node scripts/google-ads-assets.js --optimize                  # show recommendations
 *   node scripts/google-ads-assets.js --cleanup --dry-run         # preview pauses
 *   node scripts/google-ads-assets.js --cleanup                   # apply pauses
 *   node scripts/google-ads-assets.js --create sitelink --title "X" --desc1 "Y" --desc2 "Z" --url "U"
 *   node scripts/google-ads-assets.js --create callout --text "X"
 *   node scripts/google-ads-assets.js --create snippet --header services --values "A,B,C"
 *   node scripts/google-ads-assets.js --pause "customers/.../assets/123"
 *   node scripts/google-ads-assets.js --link "customers/.../assets/123" --campaign "Leads-Search-3"
 *   node scripts/google-ads-assets.js --account MA                # target account (default: MA)
 */

import { writeFile, mkdir } from 'fs/promises';
import { authorize } from './lib/project-import-core.js';
import { gaqlQuery, getConfig, microsToDollars, mutateResource } from './lib/google-ads-client.js';

const OUTPUT_PATH = 'data/reports/google-ads-assets.json';

// Parse CLI args
const args = process.argv.slice(2);
const acctIdx = args.indexOf('--account');
const ACCOUNT_KEY = acctIdx !== -1 ? args[acctIdx + 1] : 'MA';
const LIST = args.includes('--list');
const OPTIMIZE = args.includes('--optimize');
const CLEANUP = args.includes('--cleanup');
const CREATE = args.includes('--create');
const PAUSE = args.includes('--pause');
const LINK = args.includes('--link');
const DRY_RUN = args.includes('--dry-run');

const typeIdx = args.indexOf('--type');
const TYPE_FILTER = typeIdx !== -1 ? args[typeIdx + 1].toUpperCase() : null;

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

async function listAssets(auth, customerId) {
  const report = { accountAssets: [], campaignAssets: [], adGroupAssets: [] };

  // Account-level assets
  console.log('  Fetching account-level assets...');
  const acctRows = await gaqlQuery(auth, customerId, `
    SELECT
      asset.resource_name, asset.name, asset.type,
      asset.sitelink_asset.link_text, asset.sitelink_asset.description1,
      asset.sitelink_asset.description2,
      asset.callout_asset.callout_text,
      asset.structured_snippet_asset.header,
      asset.call_asset.phone_number
    FROM asset
    WHERE asset.type IN ('SITELINK', 'CALLOUT', 'STRUCTURED_SNIPPET', 'CALL', 'IMAGE')
  `);

  report.accountAssets = acctRows.map(r => {
    const a = r.asset;
    return {
      resourceName: a.resourceName,
      name: a.name || a.sitelinkAsset?.linkText || a.calloutAsset?.calloutText || a.callAsset?.phoneNumber || a.type,
      type: a.type,
      details: {
        linkText: a.sitelinkAsset?.linkText,
        desc1: a.sitelinkAsset?.description1,
        desc2: a.sitelinkAsset?.description2,
        calloutText: a.calloutAsset?.calloutText,
        snippetHeader: a.structuredSnippetAsset?.header,
        phoneNumber: a.callAsset?.phoneNumber,
      },
    };
  });

  // Campaign-level asset links with performance
  console.log('  Fetching campaign-level assets...');
  try {
    const campRows = await gaqlQuery(auth, customerId, `
      SELECT
        campaign.name, campaign.status,
        asset.resource_name, asset.name, asset.type,
        asset.sitelink_asset.link_text,
        asset.callout_asset.callout_text,
        asset.call_asset.phone_number,
        campaign_asset.status, campaign_asset.source,
        metrics.impressions, metrics.clicks, metrics.cost_micros
      FROM campaign_asset
      WHERE campaign.status IN ('ENABLED', 'PAUSED')
        AND segments.date DURING LAST_30_DAYS
    `);

    report.campaignAssets = campRows.map(r => ({
      campaign: r.campaign?.name,
      campaignStatus: r.campaign?.status,
      resourceName: r.asset?.resourceName,
      name: r.asset?.name || r.asset?.sitelinkAsset?.linkText || r.asset?.calloutAsset?.calloutText || r.asset?.callAsset?.phoneNumber || r.asset?.type,
      type: r.asset?.type,
      assetStatus: r.campaignAsset?.status,
      source: r.campaignAsset?.source,
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
      cost: microsToDollars(r.metrics?.costMicros),
      ctr: parseInt(r.metrics?.impressions || '0') > 0
        ? Math.round(parseInt(r.metrics?.clicks || '0') / parseInt(r.metrics?.impressions) * 10000) / 100
        : 0,
    }));
  } catch (err) {
    console.log('  ⚠️  Campaign assets query failed:', err.message.substring(0, 200));
  }

  // Ad group-level asset links
  console.log('  Fetching ad group-level assets...');
  try {
    const agRows = await gaqlQuery(auth, customerId, `
      SELECT
        campaign.name, ad_group.name,
        asset.resource_name, asset.name, asset.type,
        asset.sitelink_asset.link_text,
        asset.callout_asset.callout_text,
        ad_group_asset.status, ad_group_asset.source,
        metrics.impressions, metrics.clicks
      FROM ad_group_asset
      WHERE ad_group.status IN ('ENABLED', 'PAUSED')
        AND segments.date DURING LAST_30_DAYS
    `);

    report.adGroupAssets = agRows.map(r => ({
      campaign: r.campaign?.name,
      adGroup: r.adGroup?.name,
      resourceName: r.asset?.resourceName,
      name: r.asset?.name || r.asset?.sitelinkAsset?.linkText || r.asset?.calloutAsset?.calloutText || r.asset?.type,
      type: r.asset?.type,
      assetStatus: r.adGroupAsset?.status,
      source: r.adGroupAsset?.source,
      impressions: parseInt(r.metrics?.impressions || '0', 10),
      clicks: parseInt(r.metrics?.clicks || '0', 10),
    }));
  } catch (err) {
    console.log('  ⚠️  Ad group assets query failed:', err.message.substring(0, 200));
  }

  return report;
}

function printAssets(report, typeFilter) {
  const filter = (items) => typeFilter ? items.filter(a => a.type === typeFilter) : items;

  console.log(`\n  ACCOUNT-LEVEL ASSETS (${filter(report.accountAssets).length}):`);
  filter(report.accountAssets).forEach(a => {
    console.log(`    🟢 [${a.type}] "${a.name}" (${a.resourceName})`);
    if (a.details.desc1) console.log(`       Desc1: ${a.details.desc1}`);
    if (a.details.desc2) console.log(`       Desc2: ${a.details.desc2}`);
  });

  // Group campaign assets by campaign
  const byCampaign = {};
  filter(report.campaignAssets).forEach(a => {
    if (!byCampaign[a.campaign]) byCampaign[a.campaign] = [];
    byCampaign[a.campaign].push(a);
  });

  for (const [campaign, assets] of Object.entries(byCampaign)) {
    console.log(`\n  CAMPAIGN: ${campaign} (${assets.length} assets):`);
    assets.sort((a, b) => b.impressions - a.impressions).forEach(a => {
      const src = a.source === 'ADVERTISER' ? '' : ` (${a.source})`;
      const perf = a.impressions > 0 ? `${a.impressions} imp, ${a.clicks} clicks, ${a.ctr}% CTR` : 'no impressions';
      const flag = a.impressions === 0 ? ' ⚠️' : '';
      console.log(`    [${a.type}] "${a.name}" — ${a.assetStatus}${src} — ${perf}${flag}`);
    });
  }

  // Group ad group assets
  const byAdGroup = {};
  filter(report.adGroupAssets).forEach(a => {
    const key = `${a.campaign} > ${a.adGroup}`;
    if (!byAdGroup[key]) byAdGroup[key] = [];
    byAdGroup[key].push(a);
  });

  for (const [key, assets] of Object.entries(byAdGroup)) {
    console.log(`\n  AD GROUP: ${key} (${assets.length} assets):`);
    assets.sort((a, b) => b.impressions - a.impressions).forEach(a => {
      const src = a.source === 'ADVERTISER' ? '' : ` (${a.source})`;
      const flag = a.impressions === 0 ? ' ⚠️' : '';
      console.log(`    [${a.type}] "${a.name}" — ${a.assetStatus}${src} — ${a.impressions} imp, ${a.clicks} clicks${flag}`);
    });
  }
}

function analyzeOptimizations(report) {
  const recommendations = [];

  // Find zero-impression assets
  const zeroImpCampaign = report.campaignAssets.filter(a => a.impressions === 0 && a.assetStatus === 'ENABLED');
  const zeroImpAdGroup = report.adGroupAssets.filter(a => a.impressions === 0 && a.assetStatus === 'ENABLED');

  if (zeroImpCampaign.length > 0) {
    recommendations.push({
      action: 'PAUSE',
      reason: 'Zero impressions (campaign-level)',
      assets: zeroImpCampaign.map(a => ({ name: a.name, type: a.type, campaign: a.campaign, source: a.source, resourceName: a.resourceName })),
    });
  }

  if (zeroImpAdGroup.length > 0) {
    recommendations.push({
      action: 'PAUSE',
      reason: 'Zero impressions (ad group-level, often Google AI)',
      assets: zeroImpAdGroup.map(a => ({ name: a.name, type: a.type, adGroup: a.adGroup, source: a.source, resourceName: a.resourceName })),
    });
  }

  // Find duplicates (similar names)
  const sitelinks = report.campaignAssets.filter(a => a.type === 'SITELINK');
  const names = sitelinks.map(a => a.name?.toLowerCase());
  const seen = {};
  names.forEach((n, i) => {
    if (!n) return;
    const base = n.replace(/our |the |view |see /g, '').trim();
    if (!seen[base]) seen[base] = [];
    seen[base].push(sitelinks[i]);
  });
  const dupes = Object.entries(seen).filter(([, v]) => v.length > 1);
  if (dupes.length > 0) {
    recommendations.push({
      action: 'REVIEW',
      reason: 'Potentially duplicate sitelinks',
      assets: dupes.map(([base, items]) => ({
        baseName: base,
        duplicates: items.map(a => ({ name: a.name, campaign: a.campaign, impressions: a.impressions })),
      })),
    });
  }

  return recommendations;
}

async function createAsset(auth, customerId, type) {
  const assetType = type?.toLowerCase();
  let payload;

  if (assetType === 'sitelink') {
    const title = getArg('--title');
    const desc1 = getArg('--desc1');
    const desc2 = getArg('--desc2');
    const url = getArg('--url');
    if (!title || !url) { console.error('--title and --url required for sitelink'); process.exit(1); }
    payload = {
      sitelinkAsset: {
        linkText: title,
        description1: desc1 || '',
        description2: desc2 || '',
        finalUrls: [url],
      },
    };
  } else if (assetType === 'callout') {
    const text = getArg('--text');
    if (!text) { console.error('--text required for callout'); process.exit(1); }
    payload = { calloutAsset: { calloutText: text } };
  } else if (assetType === 'snippet') {
    const header = getArg('--header')?.toUpperCase();
    const values = getArg('--values')?.split(',').map(v => v.trim());
    if (!header || !values) { console.error('--header and --values required for snippet'); process.exit(1); }
    // Header IDs: SERVICES=13, TYPES=12, BRANDS=3, etc.
    const HEADERS = { SERVICES: 13, TYPES: 12, BRANDS: 3, AMENITIES: 1, DESTINATIONS: 5, NEIGHBORHOODS: 10 };
    payload = { structuredSnippetAsset: { header: header, values } };
  } else if (assetType === 'call') {
    const phone = getArg('--phone') || '6176681677';
    payload = { callAsset: { phoneNumber: `+1${phone.replace(/\D/g, '')}`, countryCode: 'US' } };
  } else {
    console.error(`Unknown asset type: ${type}. Use: sitelink, callout, snippet, call`);
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`  🔍 DRY RUN — would create ${assetType}:`, JSON.stringify(payload, null, 2));
    return;
  }

  const result = await mutateResource(auth, customerId, 'assets', [{ create: payload }]);
  const created = result.results?.[0]?.resourceName;
  console.log(`  ✅ Created ${assetType}: ${created}`);
  return created;
}

async function pauseAsset(auth, customerId, resourceName) {
  // Pause by updating status — assets can't be directly paused,
  // but campaign_asset and ad_group_asset links can be removed
  // For account-level assets, we update the status
  if (DRY_RUN) {
    console.log(`  🔍 DRY RUN — would pause: ${resourceName}`);
    return;
  }

  // Determine if this is an asset or a link
  if (resourceName.includes('/campaignAssets/')) {
    await mutateResource(auth, customerId, 'campaignAssets', [{ remove: resourceName }]);
    console.log(`  ✅ Removed campaign asset link: ${resourceName}`);
  } else if (resourceName.includes('/adGroupAssets/')) {
    await mutateResource(auth, customerId, 'adGroupAssets', [{ remove: resourceName }]);
    console.log(`  ✅ Removed ad group asset link: ${resourceName}`);
  } else {
    // Account-level asset — update status to PAUSED
    await mutateResource(auth, customerId, 'assets', [{
      update: { resourceName, status: 'PAUSED' },
      updateMask: 'status',
    }]);
    console.log(`  ✅ Paused asset: ${resourceName}`);
  }
}

async function main() {
  const auth = await authorize();
  const config = await getConfig();
  const customerId = config.accounts[ACCOUNT_KEY];

  if (!customerId) {
    console.error(`No account for "${ACCOUNT_KEY}". Available: ${Object.keys(config.accounts).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n📊 Google Ads Assets — ${ACCOUNT_KEY} (${customerId})\n`);

  if (LIST || OPTIMIZE || CLEANUP) {
    const report = await listAssets(auth, customerId);

    // Save report
    await mkdir('data/reports', { recursive: true });
    await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));

    if (LIST) {
      printAssets(report, TYPE_FILTER);
    }

    if (OPTIMIZE || CLEANUP) {
      const recs = analyzeOptimizations(report);

      console.log(`\n  OPTIMIZATION RECOMMENDATIONS (${recs.length}):\n`);
      recs.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.action}: ${rec.reason}`);
        if (rec.assets) {
          rec.assets.forEach(a => {
            if (a.duplicates) {
              console.log(`     "${a.baseName}": ${a.duplicates.map(d => `"${d.name}" (${d.impressions} imp)`).join(', ')}`);
            } else {
              console.log(`     [${a.type}] "${a.name}" — ${a.source || 'advertiser'}${a.campaign ? ` in ${a.campaign}` : ''}${a.adGroup ? ` > ${a.adGroup}` : ''}`);
            }
          });
        }
        console.log();
      });

      if (CLEANUP) {
        const toPause = recs.filter(r => r.action === 'PAUSE').flatMap(r => r.assets.filter(a => a.resourceName));

        if (toPause.length === 0) {
          console.log('  Nothing to clean up.');
          return;
        }

        console.log(`  ${DRY_RUN ? 'Would pause' : 'Pausing'} ${toPause.length} assets:\n`);

        for (const asset of toPause) {
          try {
            await pauseAsset(auth, customerId, asset.resourceName);
          } catch (err) {
            console.log(`  ❌ Failed to pause "${asset.name}": ${err.message.substring(0, 150)}`);
          }
        }
      }
    }

    console.log(`\n  Report saved to ${OUTPUT_PATH}\n`);
    return;
  }

  if (CREATE) {
    const createIdx = args.indexOf('--create');
    const type = args[createIdx + 1];
    await createAsset(auth, customerId, type);
    return;
  }

  if (PAUSE) {
    const pauseIdx = args.indexOf('--pause');
    const resourceName = args[pauseIdx + 1];
    await pauseAsset(auth, customerId, resourceName);
    return;
  }

  if (LINK) {
    const linkIdx = args.indexOf('--link');
    const assetResourceName = args[linkIdx + 1];
    const campaignName = getArg('--campaign');

    if (!campaignName) { console.error('--campaign required for --link'); process.exit(1); }

    // Find campaign resource name
    const campRows = await gaqlQuery(auth, customerId, `
      SELECT campaign.resource_name, campaign.name FROM campaign WHERE campaign.name = '${campaignName}'
    `);
    if (campRows.length === 0) { console.error(`Campaign "${campaignName}" not found`); process.exit(1); }

    const campaignResource = campRows[0].campaign.resourceName;

    if (DRY_RUN) {
      console.log(`  🔍 DRY RUN — would link ${assetResourceName} to ${campaignName}`);
      return;
    }

    await mutateResource(auth, customerId, 'campaignAssets', [{
      create: {
        campaign: campaignResource,
        asset: assetResourceName,
        fieldType: 'SITELINK', // TODO: detect from asset type
      },
    }]);
    console.log(`  ✅ Linked asset to "${campaignName}"`);
    return;
  }

  // No mode specified — show help
  console.log('Usage:');
  console.log('  --list [--type sitelink]       List all assets with performance');
  console.log('  --optimize                     Show recommended changes');
  console.log('  --cleanup [--dry-run]           Pause underperforming assets');
  console.log('  --create sitelink --title X --desc1 Y --desc2 Z --url U');
  console.log('  --create callout --text X');
  console.log('  --create snippet --header services --values "A,B,C"');
  console.log('  --create call --phone 6176681677');
  console.log('  --pause "customers/.../assets/123"');
  console.log('  --link "customers/.../assets/123" --campaign "Leads-Search-3"');
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
