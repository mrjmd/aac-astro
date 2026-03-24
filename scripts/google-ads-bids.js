#!/usr/bin/env node

/**
 * Google Ads Bid Adjustment Manager
 *
 * List, set, and manage bid adjustments for devices, ad schedules,
 * and locations across campaigns.
 *
 * Usage:
 *   node scripts/google-ads-bids.js --list                              # show all bid adjustments
 *   node scripts/google-ads-bids.js --device desktop +25                # desktop +25%
 *   node scripts/google-ads-bids.js --device mobile -10                 # mobile -10%
 *   node scripts/google-ads-bids.js --schedule --boost "8-16" +20 --reduce "23-5" -20
 *   node scripts/google-ads-bids.js --clear-schedule                    # remove all ad schedule entries
 *   node scripts/google-ads-bids.js --campaign "Leads-Search-3"         # target specific campaign
 *   node scripts/google-ads-bids.js --account MA                        # target account (default: MA)
 *   node scripts/google-ads-bids.js --dry-run                           # preview without applying
 */

import { writeFile, mkdir } from 'fs/promises';
import { authorize } from './lib/project-import-core.js';
import { gaqlQuery, getConfig, mutateResource } from './lib/google-ads-client.js';

const OUTPUT_PATH = 'data/reports/google-ads-bids.json';

// Parse CLI args
const args = process.argv.slice(2);
const acctIdx = args.indexOf('--account');
const ACCOUNT_KEY = acctIdx !== -1 ? args[acctIdx + 1] : 'MA';
const LIST = args.includes('--list');
const DEVICE = args.includes('--device');
const SCHEDULE = args.includes('--schedule');
const CLEAR_SCHEDULE = args.includes('--clear-schedule');
const DRY_RUN = args.includes('--dry-run');

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

// ===== LIST BID ADJUSTMENTS =====

async function listBidAdjustments(auth, customerId) {
  const report = { devices: [], schedules: [], locations: [] };

  // Device bid modifiers
  console.log('  Fetching device bid adjustments...');
  try {
    const deviceRows = await gaqlQuery(auth, customerId, `
      SELECT campaign.name, campaign_criterion.device.type,
        campaign_criterion.bid_modifier, campaign_criterion.resource_name
      FROM campaign_criterion
      WHERE campaign.status = 'ENABLED'
        AND campaign_criterion.type = 'DEVICE'
    `);
    report.devices = deviceRows.map(r => ({
      campaign: r.campaign?.name,
      device: r.campaignCriterion?.device?.type,
      bidModifier: r.campaignCriterion?.bidModifier,
      adjustment: r.campaignCriterion?.bidModifier
        ? `${r.campaignCriterion.bidModifier > 1 ? '+' : ''}${Math.round((r.campaignCriterion.bidModifier - 1) * 100)}%`
        : 'none',
      resourceName: r.campaignCriterion?.resourceName,
    }));
  } catch (err) {
    console.log('  ⚠️  Device adjustments not available:', err.message);
  }

  // Ad schedule
  console.log('  Fetching ad schedule bid adjustments...');
  try {
    const schedRows = await gaqlQuery(auth, customerId, `
      SELECT campaign.name,
        campaign_criterion.ad_schedule.day_of_week,
        campaign_criterion.ad_schedule.start_hour,
        campaign_criterion.ad_schedule.end_hour,
        campaign_criterion.ad_schedule.start_minute,
        campaign_criterion.ad_schedule.end_minute,
        campaign_criterion.bid_modifier,
        campaign_criterion.resource_name
      FROM campaign_criterion
      WHERE campaign.status = 'ENABLED'
        AND campaign_criterion.type = 'AD_SCHEDULE'
    `);
    report.schedules = schedRows.map(r => ({
      campaign: r.campaign?.name,
      day: r.campaignCriterion?.adSchedule?.dayOfWeek,
      startHour: r.campaignCriterion?.adSchedule?.startHour,
      endHour: r.campaignCriterion?.adSchedule?.endHour,
      bidModifier: r.campaignCriterion?.bidModifier,
      adjustment: r.campaignCriterion?.bidModifier
        ? `${r.campaignCriterion.bidModifier > 1 ? '+' : ''}${Math.round((r.campaignCriterion.bidModifier - 1) * 100)}%`
        : 'none',
      resourceName: r.campaignCriterion?.resourceName,
    }));
  } catch (err) {
    console.log('  ⚠️  Schedule adjustments not available:', err.message);
  }

  // Location targeting
  console.log('  Fetching location targeting...');
  try {
    const locRows = await gaqlQuery(auth, customerId, `
      SELECT campaign.name, campaign_criterion.location.geo_target_constant,
        campaign_criterion.bid_modifier, campaign_criterion.resource_name
      FROM campaign_criterion
      WHERE campaign.status = 'ENABLED'
        AND campaign_criterion.type = 'LOCATION'
    `);
    report.locations = locRows.map(r => ({
      campaign: r.campaign?.name,
      geoTarget: r.campaignCriterion?.location?.geoTargetConstant,
      bidModifier: r.campaignCriterion?.bidModifier,
      resourceName: r.campaignCriterion?.resourceName,
    }));
  } catch (err) {
    console.log('  ⚠️  Location targeting not available:', err.message);
  }

  return report;
}

// ===== FIND ENABLED CAMPAIGNS =====

async function findEnabledCampaigns(auth, customerId, campaignName) {
  let query = `
    SELECT campaign.resource_name, campaign.name, campaign.id
    FROM campaign WHERE campaign.status = 'ENABLED'
  `;
  if (campaignName) {
    query = `
      SELECT campaign.resource_name, campaign.name, campaign.id
      FROM campaign WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'
    `;
  }
  const rows = await gaqlQuery(auth, customerId, query);
  return rows.map(r => ({
    resourceName: r.campaign?.resourceName,
    name: r.campaign?.name,
    id: r.campaign?.id,
  }));
}

// ===== SET DEVICE BID =====

async function setDeviceBid(auth, customerId, { deviceType, adjustment, campaignName, dryRun }) {
  const normalizedDevice = deviceType.toUpperCase();
  if (!['DESKTOP', 'MOBILE', 'TABLET'].includes(normalizedDevice)) {
    throw new Error(`Invalid device "${deviceType}". Use desktop, mobile, or tablet.`);
  }

  // Parse adjustment: "+25" → 1.25, "-30" → 0.70
  const pct = parseInt(adjustment, 10);
  if (isNaN(pct) || pct < -90 || pct > 900) {
    throw new Error(`Invalid adjustment "${adjustment}". Use a number like +25 or -30 (range: -90 to +900).`);
  }
  const bidModifier = 1 + (pct / 100);

  const campaigns = await findEnabledCampaigns(auth, customerId, campaignName);
  if (campaigns.length === 0) throw new Error('No enabled campaigns found');

  // Check existing device criteria
  const existing = await listBidAdjustments(auth, customerId);
  const existingDevices = existing.devices.filter(d => d.device === normalizedDevice);

  for (const campaign of campaigns) {
    const existingForCampaign = existingDevices.find(d => d.campaign === campaign.name);
    const action = existingForCampaign ? 'update' : 'create';

    if (dryRun) {
      console.log(`\n  [DRY RUN] Would ${action} ${normalizedDevice} bid for "${campaign.name}":`);
      console.log(`    Modifier: ${bidModifier} (${pct >= 0 ? '+' : ''}${pct}%)`);
      if (existingForCampaign) {
        console.log(`    Current: ${existingForCampaign.adjustment}`);
      }
      continue;
    }

    console.log(`  Setting ${normalizedDevice} bid ${pct >= 0 ? '+' : ''}${pct}% for "${campaign.name}"...`);

    if (existingForCampaign) {
      // Update existing criterion
      await mutateResource(auth, customerId, 'campaignCriteria', [{
        update: {
          resourceName: existingForCampaign.resourceName,
          bidModifier,
        },
        updateMask: 'bid_modifier',
      }]);
    } else {
      // Create new criterion
      await mutateResource(auth, customerId, 'campaignCriteria', [{
        create: {
          campaign: campaign.resourceName,
          device: { type: normalizedDevice },
          bidModifier,
        },
      }]);
    }
    console.log(`  ✅ ${normalizedDevice} bid set to ${pct >= 0 ? '+' : ''}${pct}%`);
  }
}

// ===== PARSE HOUR RANGE =====

/**
 * Parse an hour range like "8-16" or "22-6" (overnight).
 * Google Ads requires startHour < endHour, so overnight ranges
 * are split into two blocks: e.g., "22-6" → [{22,24}, {0,6}].
 * Returns an array of {startHour, endHour} objects.
 */
function parseHourRange(range) {
  const [startStr, endStr] = range.split('-');
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);

  if (isNaN(start) || isNaN(end) || start < 0 || start > 23 || end < 0 || end > 24) {
    throw new Error(`Invalid hour range "${range}". Use format "8-16" (0-24).`);
  }

  // Overnight range (e.g., 22-6) — split into two blocks
  if (start > end) {
    return [
      { startHour: start, endHour: 24 },
      { startHour: 0, endHour: end },
    ];
  }

  return [{ startHour: start, endHour: end }];
}

// ===== SET AD SCHEDULE =====

async function setAdSchedule(auth, customerId, { blocks, campaignName, dryRun }) {
  const campaigns = await findEnabledCampaigns(auth, customerId, campaignName);
  if (campaigns.length === 0) throw new Error('No enabled campaigns found');

  // First, clear existing schedule criteria
  const existing = await listBidAdjustments(auth, customerId);

  for (const campaign of campaigns) {
    const existingSchedules = existing.schedules.filter(s => s.campaign === campaign.name);

    if (existingSchedules.length > 0) {
      if (dryRun) {
        console.log(`\n  [DRY RUN] Would remove ${existingSchedules.length} existing schedule entries for "${campaign.name}"`);
      } else {
        console.log(`  Removing ${existingSchedules.length} existing schedule entries for "${campaign.name}"...`);
        const removeOps = existingSchedules.map(s => ({ remove: s.resourceName }));
        await mutateResource(auth, customerId, 'campaignCriteria', removeOps);
        console.log('  ✅ Existing schedule cleared');
      }
    }

    // Create new schedule entries for each day × time block
    const createOps = [];
    for (const block of blocks) {
      const hourRanges = parseHourRange(block.hours);
      const pct = parseInt(block.adjustment, 10);
      const bidModifier = 1 + (pct / 100);

      for (const { startHour, endHour } of hourRanges) {
        for (const day of DAYS_OF_WEEK) {
          createOps.push({
            create: {
              campaign: campaign.resourceName,
              adSchedule: {
                dayOfWeek: day,
                startHour,
                endHour,
                startMinute: 'ZERO',
                endMinute: 'ZERO',
              },
              bidModifier,
            },
          });
        }
      }
    }

    if (dryRun) {
      console.log(`\n  [DRY RUN] Would create ${createOps.length} schedule entries for "${campaign.name}":`);
      for (const block of blocks) {
        const pct = parseInt(block.adjustment, 10);
        console.log(`    ${block.hours} → ${pct >= 0 ? '+' : ''}${pct}% (all 7 days)`);
      }
      continue;
    }

    console.log(`  Creating ${createOps.length} schedule entries for "${campaign.name}"...`);
    await mutateResource(auth, customerId, 'campaignCriteria', createOps);
    console.log('  ✅ Ad schedule set');
    for (const block of blocks) {
      const pct = parseInt(block.adjustment, 10);
      console.log(`    ${block.hours} → ${pct >= 0 ? '+' : ''}${pct}%`);
    }
  }
}

// ===== CLEAR AD SCHEDULE =====

async function clearAdSchedule(auth, customerId, { campaignName, dryRun }) {
  const campaigns = await findEnabledCampaigns(auth, customerId, campaignName);
  const existing = await listBidAdjustments(auth, customerId);

  for (const campaign of campaigns) {
    const schedules = existing.schedules.filter(s => s.campaign === campaign.name);
    if (schedules.length === 0) {
      console.log(`  No schedule entries for "${campaign.name}"`);
      continue;
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would remove ${schedules.length} schedule entries for "${campaign.name}"`);
      continue;
    }

    console.log(`  Removing ${schedules.length} schedule entries for "${campaign.name}"...`);
    const removeOps = schedules.map(s => ({ remove: s.resourceName }));
    await mutateResource(auth, customerId, 'campaignCriteria', removeOps);
    console.log('  ✅ Schedule cleared');
  }
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

  const campaignName = getArg('--campaign');
  console.log(`\n📊 Google Ads Bids — ${ACCOUNT_KEY} (${customerId})\n`);

  if (LIST) {
    const report = await listBidAdjustments(auth, customerId);

    console.log(`\n  Device Bid Adjustments (${report.devices.length}):`);
    if (report.devices.length === 0) {
      console.log('    None set — all devices at default bid');
    }
    for (const d of report.devices) {
      console.log(`    ${d.campaign}: ${d.device} → ${d.adjustment}`);
    }

    console.log(`\n  Ad Schedule (${report.schedules.length} entries):`);
    if (report.schedules.length === 0) {
      console.log('    None set — ads run 24/7 at default bid');
    } else {
      // Group by campaign and time block
      const grouped = {};
      for (const s of report.schedules) {
        const key = `${s.campaign}|${s.startHour}-${s.endHour}|${s.adjustment}`;
        if (!grouped[key]) grouped[key] = { ...s, days: [] };
        grouped[key].days.push(s.day);
      }
      for (const g of Object.values(grouped)) {
        const dayStr = g.days.length === 7 ? 'All days' : g.days.join(', ');
        console.log(`    ${g.campaign}: ${g.startHour}:00-${g.endHour}:00 → ${g.adjustment} (${dayStr})`);
      }
    }

    console.log(`\n  Location Targeting (${report.locations.length}):`);
    for (const l of report.locations) {
      const mod = l.bidModifier ? ` (bid: ${l.bidModifier})` : '';
      console.log(`    ${l.campaign}: ${l.geoTarget}${mod}`);
    }

    // Save report
    await mkdir('data/reports', { recursive: true });
    await writeFile(OUTPUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2));
    console.log(`\n  ✅ Report saved to ${OUTPUT_PATH}`);

  } else if (DEVICE) {
    const deviceIdx = args.indexOf('--device');
    const deviceType = args[deviceIdx + 1];
    const adjustment = args[deviceIdx + 2];

    if (!deviceType || !adjustment) {
      console.error('❌ Usage: --device desktop|mobile|tablet +25|-30');
      process.exit(1);
    }

    await setDeviceBid(auth, customerId, { deviceType, adjustment, campaignName, dryRun: DRY_RUN });

  } else if (SCHEDULE) {
    // Parse schedule blocks from args
    const blocks = [];
    const boostIdx = args.indexOf('--boost');
    const reduceIdx = args.indexOf('--reduce');

    if (boostIdx !== -1) {
      blocks.push({ hours: args[boostIdx + 1], adjustment: args[boostIdx + 2] });
    }
    if (reduceIdx !== -1) {
      blocks.push({ hours: args[reduceIdx + 1], adjustment: args[reduceIdx + 2] });
    }

    if (blocks.length === 0) {
      console.error('❌ Usage: --schedule --boost "8-16" +20 --reduce "23-5" -20');
      process.exit(1);
    }

    await setAdSchedule(auth, customerId, { blocks, campaignName, dryRun: DRY_RUN });

  } else if (CLEAR_SCHEDULE) {
    await clearAdSchedule(auth, customerId, { campaignName, dryRun: DRY_RUN });

  } else {
    console.log('  Usage:');
    console.log('    --list                              Show all bid adjustments');
    console.log('    --device desktop|mobile|tablet +25  Set device bid adjustment');
    console.log('    --schedule --boost "8-16" +20       Set ad schedule');
    console.log('    --clear-schedule                    Remove all schedule entries');
    console.log('    --campaign "Name"                   Target specific campaign');
    console.log('    --account MA|CT                     Target account (default: MA)');
    console.log('    --dry-run                           Preview without applying');
  }
}

main().catch(err => {
  console.error('❌ Bids script failed:', err.message);
  process.exit(1);
});
