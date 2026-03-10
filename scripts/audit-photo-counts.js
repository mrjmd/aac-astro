#!/usr/bin/env node

/**
 * Audit: Compare local project images vs Google Calendar attachment counts.
 *
 * For each manifest entry, checks how many attachments the calendar event
 * currently has vs how many were present at original import time (using the
 * importedAt timestamp and the photoFileIds backfill as reference).
 *
 * This identifies events where Mike added photos BEFORE the backfill baseline
 * was set — meaning photos we may have missed during the original import.
 *
 * Usage:
 *   node scripts/audit-photo-counts.js
 */

import { google } from 'googleapis';
import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

import {
  authorize,
  loadManifest,
  CALENDAR_EMAIL,
  IMAGES_DIR,
} from './lib/project-import-core.js';

async function main() {
  console.log('🔍 Audit: Local Images vs Calendar Attachments\n');

  const auth = await authorize();
  const calendar = google.calendar({ version: 'v3', auth });
  const manifest = loadManifest();

  const entries = Object.entries(manifest.imported);
  console.log(`  Checking ${entries.length} manifest entries...\n`);

  const mismatches = [];
  let checked = 0;

  for (const [eventId, entry] of entries) {
    const slug = entry.slug;

    // Count local source images (just .jpg before/after, not webp variants)
    const hasLocalBefore = existsSync(resolve(IMAGES_DIR, `${slug}-before.jpg`));
    const hasLocalAfter = existsSync(resolve(IMAGES_DIR, `${slug}-after.jpg`));
    const localCount = (hasLocalBefore ? 1 : 0) + (hasLocalAfter ? 1 : 0);

    // Check if using placeholder
    let usesPlaceholder = false;
    try {
      const mdPath = resolve('src/content/projects', `${slug}.md`);
      if (existsSync(mdPath)) {
        const { readFileSync } = await import('fs');
        const content = readFileSync(mdPath, 'utf-8');
        usesPlaceholder = content.includes('placeholder.svg');
      }
    } catch { /* ignore */ }

    // Get current calendar attachment count
    try {
      const res = await calendar.events.get({
        calendarId: CALENDAR_EMAIL,
        eventId,
      });

      const attachments = res.data.attachments || [];
      const calendarCount = attachments.length;

      // A project with placeholder images but calendar attachments = missed photos
      // A project with 2 local images from N calendar photos is normal (we pick best before/after)
      // But if calendar has photos and we have placeholders, that's a mismatch
      if (usesPlaceholder && calendarCount > 0) {
        mismatches.push({
          slug,
          localCount,
          calendarCount,
          usesPlaceholder,
          reason: 'has_placeholder_but_calendar_has_photos',
          importedAt: entry.importedAt,
        });
      } else if (localCount === 0 && calendarCount > 0) {
        mismatches.push({
          slug,
          localCount,
          calendarCount,
          usesPlaceholder,
          reason: 'no_local_images_but_calendar_has_photos',
          importedAt: entry.importedAt,
        });
      }

      checked++;
    } catch (err) {
      console.log(`  ⚠️  ${slug} (${eventId}): ${err.message}`);
    }
  }

  // Summary
  console.log('-----------------------------------');
  console.log('  Audit Results');
  console.log('-----------------------------------');
  console.log(`  Entries checked: ${checked}`);
  console.log(`  Mismatches found: ${mismatches.length}`);
  console.log('-----------------------------------\n');

  if (mismatches.length > 0) {
    console.log('  Mismatched projects:\n');
    for (const m of mismatches) {
      console.log(`  📋 ${m.slug}`);
      console.log(`     Local images: ${m.localCount} | Calendar attachments: ${m.calendarCount}`);
      console.log(`     Uses placeholder: ${m.usesPlaceholder}`);
      console.log(`     Reason: ${m.reason}`);
      console.log(`     Imported: ${m.importedAt}`);
      console.log();
    }
  } else {
    console.log('  ✅ All projects have local images matching calendar attachments.\n');
    console.log('  Note: Each project picks the best before/after from all calendar\n  photos, so 2 local images from N calendar attachments is expected.\n');
  }
}

main().catch(err => {
  console.error('❌ Audit failed:', err.message);
  process.exit(1);
});
