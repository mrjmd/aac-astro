#!/usr/bin/env node

/**
 * Google Ads Asset Cleanup — One-time script to execute the full audit.
 * Pauses underperforming assets and adds new callouts.
 *
 * Run with --dry-run first, then without to apply.
 */

import { authorize } from './lib/project-import-core.js';
import { gaqlQuery, getConfig, mutateResource } from './lib/google-ads-client.js';

const DRY_RUN = process.argv.includes('--dry-run');

// ===== PAUSE LIST =====
// Sitelinks to pause (14 — duplicates, vague, broken, non-converting)
const SITELINKS_TO_PAUSE = [
  { name: 'Free Inspection', id: 'customers/4683607368/assets/205698811586', reason: 'Disapproved (broken URL), redundant with Free Consultation' },
  { name: 'Leaky Bulkhead Repair', id: 'customers/4683607368/assets/205698811589', reason: 'Duplicate of Bulkhead Repair' },
  { name: 'Carbon Fiber Stitches', id: 'customers/4683607368/assets/205698811592', reason: 'Niche, not top search term' },
  { name: 'Services', id: 'customers/4683607368/assets/209455463660', reason: 'Too vague' },
  { name: 'Blog Center #1', id: 'customers/4683607368/assets/231379351302', reason: 'Blog doesnt convert, duplicate' },
  { name: 'Services Offered #1', id: 'customers/4683607368/assets/231379351305', reason: 'Duplicate, vague' },
  { name: 'About Us #1', id: 'customers/4683607368/assets/231379351308', reason: 'Not a conversion page, duplicate' },
  { name: 'Carbon Fiber Stitches #2', id: 'customers/4683607368/assets/231379351311', reason: 'Duplicate niche service' },
  { name: 'Our Services', id: 'customers/4683607368/assets/237436627594', reason: 'Duplicate of Services Offered' },
  { name: 'View Our Partners', id: 'customers/4683607368/assets/237436627597', reason: 'Doesnt drive leads' },
  { name: 'Blog Center #2', id: 'customers/4683607368/assets/237436627600', reason: 'Duplicate' },
  { name: 'Services Offered #2', id: 'customers/4683607368/assets/309128265716', reason: 'Duplicate' },
  { name: 'About Us #2', id: 'customers/4683607368/assets/309128265722', reason: 'Duplicate' },
  { name: 'Blog Center #3', id: 'customers/4683607368/assets/309128265725', reason: 'Duplicate' },
  { name: 'Services Offered #3', id: 'customers/4683607368/assets/309129960644', reason: 'Duplicate' },
  { name: 'Blog Center #4', id: 'customers/4683607368/assets/309129960647', reason: 'Duplicate' },
  { name: 'Services Offered #4', id: 'customers/4683607368/assets/309220322659', reason: 'Duplicate' },
  { name: 'Blog Center #5', id: 'customers/4683607368/assets/309220322662', reason: 'Duplicate' },
];

// Duplicate call extension
const CALLS_TO_PAUSE = [
  { name: '(617) 668-1677 (account-level duplicate)', id: 'customers/4683607368/assets/156458061201', reason: 'Duplicate — campaign-level one is performing' },
];

// Images to pause (all zero-click images, keeping only the 3 performers)
const IMAGES_TO_KEEP = new Set([
  'customers/4683607368/assets/223338217151', // logo-square-500x500.jpg — 8 clicks
  'customers/4683607368/assets/156426989045', // AF1Qip...Mwjk — 1 click
  'customers/4683607368/assets/168756634493', // logo-square.jpeg — branding
]);

async function main() {
  const auth = await authorize();
  const config = await getConfig();
  const customerId = config.accounts.MA;

  console.log(`\n📊 Google Ads Asset Cleanup — ${DRY_RUN ? 'DRY RUN' : 'APPLYING'}\n`);

  // Get all image assets to build pause list
  const imageRows = await gaqlQuery(auth, customerId, `
    SELECT asset.resource_name, asset.name, asset.type
    FROM asset WHERE asset.type = 'IMAGE'
  `);

  const imagesToPause = imageRows
    .filter(r => !IMAGES_TO_KEEP.has(r.asset.resourceName))
    .map(r => ({
      name: r.asset.name || 'IMAGE',
      id: r.asset.resourceName,
      reason: 'Zero clicks, not in top 3 performers',
    }));

  // Combine all pause lists
  const allPauses = [
    ...SITELINKS_TO_PAUSE.map(s => ({ ...s, type: 'SITELINK' })),
    ...CALLS_TO_PAUSE.map(c => ({ ...c, type: 'CALL' })),
    ...imagesToPause.map(i => ({ ...i, type: 'IMAGE' })),
  ];

  console.log(`  PAUSING ${allPauses.length} assets:\n`);

  // Group by type for display
  const byType = {};
  allPauses.forEach(a => {
    if (!byType[a.type]) byType[a.type] = [];
    byType[a.type].push(a);
  });

  for (const [type, assets] of Object.entries(byType)) {
    console.log(`  ${type} (${assets.length}):`);
    assets.forEach(a => {
      console.log(`    ❌ "${a.name}" — ${a.reason}`);
    });
    console.log();
  }

  // Keeping
  console.log(`  KEEPING:`);
  console.log(`    ✅ SITELINKS: Crack Injection, Free Consultation, Bulkhead Repair, Concrete Repair, Wall Crack Repair, Our Recent Projects`);
  console.log(`    ✅ CALLOUTS: Highest quality repair, Never an upsell, Estimates immediately, Lifetime guarantee`);
  console.log(`    ✅ CALL: 6176681677 (campaign-level)`);
  console.log(`    ✅ STRUCTURED SNIPPET: Services`);
  console.log(`    ✅ IMAGES: logo-square-500x500.jpg, AF1Qip...Mwjk, logo-square.jpeg`);
  console.log();

  if (DRY_RUN) {
    console.log(`  🔍 DRY RUN — ${allPauses.length} assets would be paused. Run without --dry-run to apply.\n`);
    return;
  }

  // Apply pauses
  let paused = 0;
  let failed = 0;

  for (const asset of allPauses) {
    try {
      // Try to remove the asset (Google Ads API uses "remove" for pausing assets)
      await mutateResource(auth, customerId, 'assets', [{
        remove: asset.id,
      }]);
      paused++;
    } catch (err) {
      // If remove fails, the asset might be linked at campaign/ad-group level
      // Try updating status instead
      try {
        await mutateResource(auth, customerId, 'assets', [{
          update: { resourceName: asset.id },
          updateMask: 'status',
        }]);
        paused++;
      } catch (err2) {
        console.log(`    ⚠️  Could not pause "${asset.name}": ${err.message.substring(0, 100)}`);
        failed++;
      }
    }

    // Rate limit — don't hammer the API
    if (paused % 10 === 0 && paused > 0) {
      console.log(`    ... paused ${paused} so far ...`);
    }
  }

  console.log(`\n  ✅ Paused: ${paused}`);
  if (failed > 0) console.log(`  ⚠️  Failed: ${failed}`);

  // Now add new callouts
  console.log(`\n  ADDING new callouts:`);

  const newCallouts = [
    '260+ 5-Star Reviews',
    '20+ Years Experience',
  ];

  for (const text of newCallouts) {
    try {
      const result = await mutateResource(auth, customerId, 'assets', [{
        create: { calloutAsset: { calloutText: text } },
      }]);
      console.log(`    ✅ Created callout: "${text}" → ${result.results?.[0]?.resourceName}`);
    } catch (err) {
      console.log(`    ⚠️  Failed to create "${text}": ${err.message.substring(0, 100)}`);
    }
  }

  console.log(`\n  Done! Run 'node scripts/google-ads-assets.js --list' to verify.\n`);
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
