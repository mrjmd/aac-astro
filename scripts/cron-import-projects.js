#!/usr/bin/env node

/**
 * Automated Project Import (Cron)
 *
 * Runs on schedule (GitHub Actions, Mon + Thu 6am ET) to:
 *   1. Fetch new job events since last check (with 14-day lookback buffer)
 *   2. Filter to Mike's photos via Drive API
 *   3. Classify before/after photos with Claude
 *   4. Generate project case study .md files (auto-published)
 *   5. Schedule new projects to Buffer (for GBP posting)
 *   6. Update dedup manifest
 *
 * The GitHub Action handles git commit + push → triggers Vercel rebuild.
 *
 * Auth: Uses service account in CI (GOOGLE_SERVICE_ACCOUNT_KEY env var),
 *       falls back to OAuth2 locally.
 *
 * Usage:
 *   node scripts/cron-import-projects.js              # Normal cron run
 *   node scripts/cron-import-projects.js --dry-run    # Preview without writing
 *   node scripts/cron-import-projects.js --skip-buffer # Skip Buffer posting
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

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
  SERVICE_LABELS,
} from './lib/project-import-core.js';
import { getToken, createPost, buildPostText } from './lib/buffer-client.js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_BUFFER = args.includes('--skip-buffer');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LOOKBACK_DAYS = 14; // Look back 14 days from last check for late photo uploads

// ---------------------------------------------------------------------------
// Buffer posting (replaces direct GBP API)
// ---------------------------------------------------------------------------

const SITE_IMAGE_BASE = process.env.SITE_IMAGE_BASE || '';
const BUFFER_CHANNEL_ID = process.env.BUFFER_CHANNEL_ID || '';

async function postToBuffer(token, project) {
  if (!BUFFER_CHANNEL_ID) {
    console.log('     ⚠️  BUFFER_CHANNEL_ID not configured — skipping');
    return false;
  }

  const postText = buildPostText(project);
  const imageUrl = project.afterImage && !project.afterImage.includes('placeholder')
    ? `${SITE_IMAGE_BASE}${project.afterImage}`
    : null;

  try {
    await createPost({
      token,
      channelId: BUFFER_CHANNEL_ID,
      text: postText,
      imageUrl,
      linkUrl: `https://www.attackacrack.com/projects/${project.slug}`,
    });
    return true;
  } catch (err) {
    console.log(`     ⚠️  Buffer post failed: ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🤖 Attack A Crack — Automated Project Import\n');

  if (DRY_RUN) {
    console.log('  ℹ️  DRY RUN — no files will be written\n');
  }

  // Auth — prefer service account key from env (CI), fall back to OAuth2 (local)
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || null;
  const auth = await authorize({ serviceAccountKey });

  // Determine "since" from manifest with lookback buffer
  const manifest = loadManifest();
  let since;

  if (manifest.lastCheck) {
    const lastCheck = new Date(manifest.lastCheck);
    const lookback = new Date(lastCheck.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    since = lookback.toISOString().slice(0, 10);
    console.log(`  Last check: ${manifest.lastCheck}`);
    console.log(`  Looking back to: ${since} (${LOOKBACK_DAYS}-day buffer for late photo uploads)\n`);
  } else {
    since = '2025-01-01';
    console.log(`  No previous check — importing all events since ${since}\n`);
  }

  // Fetch events
  const events = await fetchJobEvents(auth, { since });

  if (events.length === 0) {
    console.log('  No new matching events. Nothing to import.');
    manifest.lastCheck = new Date().toISOString();
    if (!DRY_RUN) saveManifest(manifest);
    return;
  }

  // Ensure output directories
  if (!DRY_RUN) {
    if (!existsSync(PROJECTS_DIR)) mkdirSync(PROJECTS_DIR, { recursive: true });
    if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
  }

  let imported = 0;
  let skipped = 0;
  const newProjects = [];

  for (const event of events) {
    const eventId = event.id;
    const eventDate = new Date(event.start?.dateTime || event.start?.date);
    const description = event.description || '';
    const locationStr = event.location || '';

    // Check dedup
    if (manifest.imported[eventId]) {
      skipped++;
      continue;
    }

    // Parse location
    const { city, state } = await parseLocation(locationStr);
    if (!city || !state) {
      console.log(`  ⏭️  Skipping "${event.summary}" — could not parse location: "${locationStr}"`);
      skipped++;
      continue;
    }

    const serviceTypes = await detectServiceTypes(description + ' ' + (event.summary || ''));
    const primaryType = serviceTypes[0];
    let slug = generateSlug(city, primaryType, eventDate);
    let mdPath = join(PROJECTS_DIR, `${slug}.md`);
    let suffix = 2;
    while (existsSync(mdPath)) {
      slug = `${generateSlug(city, primaryType, eventDate)}-${suffix}`;
      mdPath = join(PROJECTS_DIR, `${slug}.md`);
      suffix++;
    }

    console.log(`  📋 Processing: ${event.summary || 'Unnamed'} — ${city}, ${state}`);

    // Filter to Mike's photos
    const attachments = event.attachments || [];
    let mikePhotos;

    if (DRY_RUN) {
      mikePhotos = attachments;
    } else {
      mikePhotos = await filterMikePhotos(auth, attachments);
    }

    // Proceed even with 0 photos — we still want the map data / local SEO ping

    // Download photos
    const downloadedPaths = [];
    if (!DRY_RUN) {
      for (let i = 0; i < mikePhotos.length; i++) {
        const ext = mikePhotos[i].mimeType?.includes('png') ? 'png' : 'jpg';
        const tempPath = join(IMAGES_DIR, `${slug}-photo-${i}.${ext}`);
        const ok = await downloadPhoto(auth, mikePhotos[i].fileId, tempPath);
        if (ok) downloadedPaths.push(tempPath);
      }
    }

    // Classify before/after
    let beforePath = null;
    let afterPath = null;
    const PLACEHOLDER = '/images/projects/placeholder.svg';
    let beforeImage = `/images/projects/${slug}-before.jpg`;
    let afterImage = `/images/projects/${slug}-after.jpg`;

    if (!DRY_RUN && downloadedPaths.length === 0) {
      beforeImage = PLACEHOLDER;
      afterImage = PLACEHOLDER;
    } else if (!DRY_RUN && downloadedPaths.length > 0) {
      const classified = await classifyPhotos(downloadedPaths);
      beforePath = classified.before;
      afterPath = classified.after;

      const finalBeforePath = join(IMAGES_DIR, `${slug}-before.jpg`);
      const finalAfterPath = join(IMAGES_DIR, `${slug}-after.jpg`);

      const { renameSync, copyFileSync, unlinkSync } = await import('fs');

      if (beforePath && existsSync(beforePath)) {
        renameSync(beforePath, finalBeforePath);
        beforePath = finalBeforePath;
      }
      if (afterPath && existsSync(afterPath)) {
        if (afterPath !== beforePath) {
          renameSync(afterPath, finalAfterPath);
        } else {
          copyFileSync(finalBeforePath, finalAfterPath);
        }
        afterPath = finalAfterPath;
      }

      if (!beforePath && afterPath) beforeImage = afterImage;
      if (!afterPath && beforePath) afterImage = beforeImage;

      // Clean up temp photos
      for (const p of downloadedPaths) {
        if (p !== beforePath && p !== afterPath && existsSync(p)) {
          unlinkSync(p);
        }
      }
    }

    // Generate content
    let summary, body;
    if (DRY_RUN) {
      summary = `[DRY RUN] ${city} ${primaryType}`;
      body = summary;
    } else {
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

    const coordinates = lookupCoordinates(city);
    const title = `${SERVICE_LABELS[primaryType] || 'Foundation Repair'} in ${city}, ${state}`;

    // Cron imports default to published: true (auto-publish)
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
      console.log(`     📄 Would write: ${slug}.md (published: true)`);
    } else {
      writeFileSync(mdPath, markdown);
      console.log(`     ✅ Written: ${slug}.md (published: true)`);

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

      newProjects.push({ slug, city, state, serviceType: primaryType, summary, afterImage });
    }

    imported++;
    console.log();
  }

  // Phase 2: Check existing events for photo updates
  let updatedCount = 0;
  const updatedProjects = [];

  console.log('\n🔄 Phase 2: Checking existing events for photo updates...\n');

  for (const event of events) {
    const eventId = event.id;
    const entry = manifest.imported[eventId];

    // Only check events that are already imported (skip new ones handled above)
    if (!entry || !entry.photoFileIds) continue;

    const result = await checkAndUpdatePhotos(auth, event, entry, { dryRun: DRY_RUN });

    if (result.updated) {
      const d = result.details;
      console.log(`  📸 ${entry.slug}: photos changed (${d.previousCount} → ${d.currentCount}, +${d.added} -${d.removed})`);

      if (!DRY_RUN) {
        entry.photoFileIds = extractPhotoFileIds(event.attachments);
        entry.lastProcessedAt = new Date().toISOString();
        entry.publishedToGBP = false;
        saveManifest(manifest);

        updatedProjects.push({
          slug: entry.slug,
          city: entry.city,
          state: entry.state,
          serviceType: entry.serviceTypes?.[0] || entry.serviceType,
          summary: '',
          afterImage: d.afterImage,
        });
      }
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`\n  📋 ${updatedCount} project(s) updated with new photos\n`);
  } else {
    console.log('  No photo updates found.\n');
  }

  // Combine new and updated projects for Buffer posting
  const allPostableProjects = [...newProjects, ...updatedProjects];

  // Buffer posting for new + updated projects (schedules to GBP via Buffer)
  if (!DRY_RUN && !SKIP_BUFFER && allPostableProjects.length > 0) {
    let bufferToken;
    try {
      bufferToken = getToken();
    } catch {
      console.log('\n  ⚠️  Buffer token not configured — skipping social posting');
      bufferToken = null;
    }

    if (bufferToken) {
      console.log(`\n📣 Scheduling ${allPostableProjects.length} project(s) to Buffer...\n`);

      for (const project of allPostableProjects) {
        const eventEntry = Object.entries(manifest.imported).find(
          ([, v]) => v.slug === project.slug
        );

        if (eventEntry && !eventEntry[1].publishedToGBP) {
          console.log(`  📋 Buffer: ${project.slug}`);
          const ok = await postToBuffer(bufferToken, project);
          if (ok) {
            manifest.imported[eventEntry[0]].publishedToGBP = true;
            console.log('     ✅ Queued to Buffer');
          }
          console.log();
        }
      }
    }
  }

  // Save manifest
  if (!DRY_RUN) {
    manifest.lastCheck = new Date().toISOString();
    saveManifest(manifest);
    console.log(`  📋 Manifest updated (${Object.keys(manifest.imported).length} total entries)\n`);
  }

  // Summary
  console.log('-----------------------------------');
  console.log('  Cron Import Summary');
  console.log('-----------------------------------');
  console.log(`  Events scanned: ${events.length}`);
  console.log(`  New projects: ${imported}`);
  console.log(`  Updated projects: ${updatedCount}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('-----------------------------------\n');
}

main().catch(err => {
  console.error('❌ Cron import failed:', err.message);
  process.exit(1);
});
