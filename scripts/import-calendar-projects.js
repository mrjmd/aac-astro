#!/usr/bin/env node

/**
 * Google Calendar → Project Case Study Importer (CLI)
 *
 * One-time or manual import of job events from Matt's Google Calendar.
 * Fetches events where Mike is an attendee, downloads his photos from Drive,
 * uses Claude to classify before/after and generate descriptions, then outputs
 * Astro content collection .md files.
 *
 * Prerequisites:
 *   1. Google Cloud project with Calendar API + Drive API enabled
 *   2. OAuth2 credentials (desktop app) saved to scripts/.credentials/google-oauth.json
 *   3. npm install googleapis @anthropic-ai/sdk (as devDependencies)
 *
 * Usage:
 *   node scripts/import-calendar-projects.js                    # Full import
 *   node scripts/import-calendar-projects.js --dry-run          # Preview without writing
 *   node scripts/import-calendar-projects.js --since 2025-06-01 # Custom start date
 *   node scripts/import-calendar-projects.js --limit 5          # Process max N events
 *   node scripts/import-calendar-projects.js --update           # Check existing events for photo changes
 *   node scripts/import-calendar-projects.js --update --dry-run # Preview photo changes
 *
 * Output: src/content/projects/<slug>.md files with published: false
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import {
  authorize,
  fetchJobEvents,
  filterMikePhotos,
  classifyPhotos,
  downloadPhoto,
  parseLocation,
  detectServiceTypes,
  generateContent,
  generateMarkdown,
  generateSlug,
  lookupCoordinates,
  loadManifest,
  saveManifest,
  extractPhotoFileIds,
  checkAndUpdatePhotos,
  PROJECTS_DIR,
  IMAGES_DIR,
  DEFAULT_SINCE,
  SERVICE_LABELS,
} from './lib/project-import-core.js';

import { writeFileSync } from 'fs';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const UPDATE_MODE = args.includes('--update');
const sinceIdx = args.indexOf('--since');
const SINCE = sinceIdx !== -1 ? args[sinceIdx + 1] : DEFAULT_SINCE;
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔧 Attack A Crack — Calendar Project Importer\n');

  if (DRY_RUN) {
    console.log('  ℹ️  DRY RUN — no files will be written\n');
  }
  if (UPDATE_MODE) {
    console.log('  🔄 UPDATE MODE — checking existing events for photo changes\n');
  }

  // Auth
  const auth = await authorize();

  // Fetch filtered events
  const events = await fetchJobEvents(auth, { since: SINCE, limit: LIMIT });

  if (events.length === 0) {
    console.log('  No matching events found. Nothing to import.');
    return;
  }

  // Load dedup manifest
  const manifest = loadManifest();

  // Ensure output directories
  if (!DRY_RUN) {
    if (!existsSync(PROJECTS_DIR)) mkdirSync(PROJECTS_DIR, { recursive: true });
    if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
  }

  let imported = 0;
  let skipped = 0;
  let updated = 0;

  for (const event of events) {
    const eventId = event.id;
    const eventDate = new Date(event.start?.dateTime || event.start?.date);
    const description = event.description || '';
    const locationStr = event.location || '';

    // Check dedup manifest
    if (manifest.imported[eventId]) {
      if (UPDATE_MODE) {
        // Check for photo changes on existing events
        const entry = manifest.imported[eventId];
        console.log(`  🔍 Checking for updates: ${entry.slug}`);

        const result = await checkAndUpdatePhotos(auth, event, entry, { dryRun: DRY_RUN });

        if (result.updated) {
          const d = result.details;
          console.log(`     📸 Photos changed: ${d.previousCount} → ${d.currentCount} (+${d.added} -${d.removed})`);

          if (!DRY_RUN) {
            // Update manifest with new photo IDs and reset GBP status
            entry.photoFileIds = extractPhotoFileIds(event.attachments);
            entry.lastProcessedAt = new Date().toISOString();
            entry.publishedToGBP = false;
            saveManifest(manifest);
            console.log(`     ✅ Updated images + markdown, reset publishedToGBP`);
          } else {
            console.log(`     📄 Would update images + markdown + reset publishedToGBP`);
          }
          updated++;
        } else {
          console.log(`     ⏭️  No photo changes`);
          skipped++;
        }
        console.log();
        continue;
      }

      console.log(`  ⏭️  Already imported (manifest): ${manifest.imported[eventId].slug}`);
      skipped++;
      continue;
    }

    // Parse location
    const { city, state } = await parseLocation(locationStr);
    if (!city || !state) {
      console.log(`  ⏭️  Skipping "${event.summary}" — could not parse city/state from: "${locationStr}"`);
      skipped++;
      continue;
    }

    // Detect service types (AI-powered)
    const serviceTypes = await detectServiceTypes(description + ' ' + (event.summary || ''));
    const primaryType = serviceTypes[0];

    // Generate slug — append suffix if file already exists (same city/service/month)
    let slug = generateSlug(city, primaryType, eventDate);
    let mdPath = join(PROJECTS_DIR, `${slug}.md`);
    let suffix = 2;
    while (existsSync(mdPath)) {
      slug = `${generateSlug(city, primaryType, eventDate)}-${suffix}`;
      mdPath = join(PROJECTS_DIR, `${slug}.md`);
      suffix++;
    }

    console.log(`  📋 Processing: ${event.summary || 'Unnamed event'}`);
    console.log(`     City: ${city}, ${state} | Service: ${serviceTypes.join(', ')} | Date: ${eventDate.toISOString().slice(0, 10)}`);

    // Filter to Mike's photos only
    const attachments = event.attachments || [];
    console.log(`     📎 ${attachments.length} attachment(s) — checking ownership...`);

    let mikePhotos;
    if (DRY_RUN) {
      mikePhotos = attachments; // In dry run, skip Drive API calls
      console.log(`     📸 ${mikePhotos.length} attachment(s) (ownership check skipped in dry run)`);
    } else {
      mikePhotos = await filterMikePhotos(auth, attachments);
      console.log(`     📸 ${mikePhotos.length} photo(s) found`);
    }

    // Download Mike's photos to temp locations
    const downloadedPaths = [];
    if (!DRY_RUN) {
      for (let i = 0; i < mikePhotos.length; i++) {
        const ext = mikePhotos[i].mimeType?.includes('png') ? 'png' : 'jpg';
        const tempPath = join(IMAGES_DIR, `${slug}-photo-${i}.${ext}`);
        const ok = await downloadPhoto(auth, mikePhotos[i].fileId, tempPath);
        if (ok) downloadedPaths.push(tempPath);
      }
    }

    // Classify before/after with Claude
    let beforePath = null;
    let afterPath = null;
    const PLACEHOLDER = '/images/projects/placeholder.svg';
    let beforeImage = `/images/projects/${slug}-before.jpg`;
    let afterImage = `/images/projects/${slug}-after.jpg`;

    if (DRY_RUN) {
      console.log(`     🤖 [DRY RUN] Would classify ${mikePhotos.length} photos and generate content`);
    } else if (downloadedPaths.length === 0) {
      console.log('     📷 No photos — using placeholder');
      beforeImage = PLACEHOLDER;
      afterImage = PLACEHOLDER;
    } else {
      console.log('     🤖 Classifying photos with Claude...');
      const classified = await classifyPhotos(downloadedPaths);
      beforePath = classified.before;
      afterPath = classified.after;

      // Rename classified photos to final names
      const finalBeforePath = join(IMAGES_DIR, `${slug}-before.jpg`);
      const finalAfterPath = join(IMAGES_DIR, `${slug}-after.jpg`);

      if (beforePath && existsSync(beforePath)) {
        const { renameSync } = await import('fs');
        renameSync(beforePath, finalBeforePath);
        beforePath = finalBeforePath;
      }
      if (afterPath && existsSync(afterPath)) {
        const { renameSync } = await import('fs');
        if (afterPath !== beforePath) {
          renameSync(afterPath, finalAfterPath);
        } else {
          // Same photo for both — copy it
          const { copyFileSync } = await import('fs');
          copyFileSync(finalBeforePath, finalAfterPath);
        }
        afterPath = finalAfterPath;
      }

      // If only one photo, use it as after
      if (!beforePath && afterPath) {
        beforeImage = afterImage;
      }
      if (!afterPath && beforePath) {
        afterImage = beforeImage;
      }

      // Clean up any extra temp photos that weren't selected
      for (const p of downloadedPaths) {
        if (p !== beforePath && p !== afterPath && existsSync(p)) {
          const { unlinkSync } = await import('fs');
          unlinkSync(p);
        }
      }
    }

    // Generate content with Claude
    let summary, body;
    if (DRY_RUN) {
      summary = `[DRY RUN] Summary for ${city} ${primaryType}`;
      body = summary;
    } else {
      console.log('     🤖 Generating content with Claude...');
      const content = await generateContent({
        eventDescription: description,
        city,
        state,
        serviceType: primaryType,
        beforeImagePath: beforePath,
        afterImagePath: afterPath,
      });
      summary = content.summary;
      body = content.description;
    }

    // Coordinates
    const coordinates = lookupCoordinates(city);

    // Title
    const title = `${SERVICE_LABELS[primaryType] || 'Foundation Repair'} in ${city}, ${state}`;

    const markdown = generateMarkdown({
      title,
      date: eventDate,
      city,
      state,
      coordinates,
      serviceTypes,
      beforeImage,
      afterImage,
      summary,
      body,
      published: true,
    });

    if (DRY_RUN) {
      console.log(`     📄 Would write: ${mdPath}`);
    } else {
      writeFileSync(mdPath, markdown);
      console.log(`     ✅ Written: ${slug}.md`);

      // Update manifest incrementally (crash-safe)
      manifest.imported[eventId] = {
        slug,
        city,
        state,
        coordinates: coordinates || null,
        serviceTypes,
        date: eventDate.toISOString().slice(0, 10),
        importedAt: new Date().toISOString(),
        publishedToGBP: false,
        photoFileIds: extractPhotoFileIds(event.attachments),
        lastProcessedAt: new Date().toISOString(),
      };
      manifest.lastCheck = new Date().toISOString();
      saveManifest(manifest);
    }

    imported++;
    console.log();
  }

  // Summary
  console.log('-----------------------------------');
  console.log('  Import Summary');
  console.log('-----------------------------------');
  console.log(`  Events processed: ${events.length}`);
  console.log(`  Projects imported: ${imported}`);
  if (UPDATE_MODE) {
    console.log(`  Projects updated: ${updated}`);
  }
  console.log(`  Skipped: ${skipped}`);
  console.log('-----------------------------------\n');

  if (imported > 0 && !DRY_RUN) {
    console.log('📝 Next steps:');
    console.log('  1. Review generated .md files in src/content/projects/');
    console.log('  2. Set published: true on projects you want to go live');
    console.log('  3. Run npm run validate to check everything passes');
    console.log('  4. Commit and push\n');
  }
}

main().catch(err => {
  console.error('❌ Import failed:', err.message);
  process.exit(1);
});
