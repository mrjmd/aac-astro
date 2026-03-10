#!/usr/bin/env node

/**
 * One-time backfill: Populate photoFileIds on existing manifest entries.
 *
 * Without this, the first --update run would see every existing event as
 * "changed" (since [] differs from the current photo set).
 *
 * For each manifest entry, fetches the calendar event by ID and records
 * the current attachment file IDs. Sets lastProcessedAt to importedAt
 * as a baseline.
 *
 * Saves incrementally (crash-safe).
 *
 * Usage:
 *   node scripts/backfill-photo-ids.js             # Backfill all entries
 *   node scripts/backfill-photo-ids.js --dry-run   # Preview without writing
 */

import { google } from 'googleapis';

import {
  authorize,
  extractPhotoFileIds,
  loadManifest,
  saveManifest,
  CALENDAR_EMAIL,
} from './lib/project-import-core.js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

async function main() {
  console.log('🔧 Attack A Crack — Backfill Photo File IDs\n');

  if (DRY_RUN) {
    console.log('  ℹ️  DRY RUN — manifest will not be modified\n');
  }

  const auth = await authorize();
  const calendar = google.calendar({ version: 'v3', auth });
  const manifest = loadManifest();

  const entries = Object.entries(manifest.imported);
  console.log(`  Found ${entries.length} manifest entries to backfill\n`);

  let backfilled = 0;
  let alreadyDone = 0;
  let errors = 0;

  for (const [eventId, entry] of entries) {
    // Skip entries that already have photoFileIds
    if (entry.photoFileIds && entry.photoFileIds.length > 0) {
      alreadyDone++;
      continue;
    }

    try {
      const res = await calendar.events.get({
        calendarId: CALENDAR_EMAIL,
        eventId,
      });

      const fileIds = extractPhotoFileIds(res.data.attachments);

      if (DRY_RUN) {
        console.log(`  📋 ${entry.slug}: ${fileIds.length} photo(s) found`);
      } else {
        entry.photoFileIds = fileIds;
        entry.lastProcessedAt = entry.importedAt || new Date().toISOString();
        saveManifest(manifest);
        console.log(`  ✅ ${entry.slug}: ${fileIds.length} photo ID(s) recorded`);
      }

      backfilled++;
    } catch (err) {
      console.log(`  ⚠️  ${entry.slug} (${eventId}): ${err.message}`);
      errors++;
    }
  }

  console.log('\n-----------------------------------');
  console.log('  Backfill Summary');
  console.log('-----------------------------------');
  console.log(`  Total entries: ${entries.length}`);
  console.log(`  Backfilled: ${backfilled}`);
  console.log(`  Already done: ${alreadyDone}`);
  console.log(`  Errors: ${errors}`);
  console.log('-----------------------------------\n');
}

main().catch(err => {
  console.error('❌ Backfill failed:', err.message);
  process.exit(1);
});
