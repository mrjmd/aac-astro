#!/usr/bin/env node

/**
 * Automated Project Import (Cron)
 *
 * Runs on schedule (GitHub Actions, Mon + Thu 6am ET) to:
 *   1. Fetch new job events since last check (with 14-day lookback buffer)
 *   2. Filter to Mike's photos via Drive API
 *   3. Classify before/after photos with Claude
 *   4. Generate project case study .md files (auto-published)
 *   5. Post new projects to Google Business Profile
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
 *   node scripts/cron-import-projects.js --skip-gbp   # Skip GBP posting
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
  PROJECTS_DIR,
  IMAGES_DIR,
  SERVICE_LABELS,
} from './lib/project-import-core.js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_GBP = args.includes('--skip-gbp');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LOOKBACK_DAYS = 14; // Look back 14 days from last check for late photo uploads

// ---------------------------------------------------------------------------
// GBP posting (inline — adapted from batch-post-gbp.js)
// ---------------------------------------------------------------------------

const SITE_URL = 'https://www.attackacrack.com';

const GBP_CONFIG = {
  CT: {
    account: process.env.GBP_CT_ACCOUNT || 'accounts/XXXXXXXXXX',
    location: process.env.GBP_CT_LOCATION || 'locations/XXXXXXXXXX',
  },
  MA: {
    account: process.env.GBP_MA_ACCOUNT || 'accounts/XXXXXXXXXX',
    location: process.env.GBP_MA_LOCATION || 'locations/XXXXXXXXXX',
  },
};

const STATE_ROUTING = {
  CT: 'CT', RI: 'CT',
  MA: 'MA', NH: 'MA', ME: 'MA',
};

const GBP_SERVICE_LABELS = {
  'crack-injection': 'foundation crack injection',
  'wall-crack-repair': 'wall crack repair',
  'bulkhead-repair': 'bulkhead repair',
  'carbon-fiber': 'carbon fiber reinforcement',
  'sewer-conduit': 'sewer & conduit repair',
  'concrete-repair': 'concrete repair',
  'garage-floor': 'garage floor repair',
  'driveway': 'driveway repair',
  'patio': 'patio repair',
  'pool-deck': 'pool deck repair',
  'stairway': 'stairway repair',
  'walkway': 'walkway repair',
  'floor-crack': 'floor crack repair',
};

async function postToGBP(auth, project) {
  const { google } = await import('googleapis');
  const gbpLocation = STATE_ROUTING[project.state] || 'MA';
  const config = GBP_CONFIG[gbpLocation];

  if (!config || config.account.includes('XXXX')) {
    console.log(`     ⚠️  GBP ${gbpLocation} location IDs not configured — skipping`);
    return false;
  }

  const serviceLabel = GBP_SERVICE_LABELS[project.serviceType] || 'foundation repair';
  const projectUrl = `${SITE_URL}/projects/${project.slug}`;
  const postText = `Just completed ${serviceLabel} in ${project.city}, ${project.state}. ${project.summary}`;

  try {
    await google.mybusinessbusinessinformation({
      version: 'v1',
      auth,
    }).accounts.locations.localPosts.create({
      parent: `${config.account}/${config.location}`,
      requestBody: {
        languageCode: 'en-US',
        summary: postText.substring(0, 1500),
        callToAction: {
          actionType: 'LEARN_MORE',
          url: projectUrl,
        },
        topicType: 'STANDARD',
      },
    });
    return true;
  } catch (err) {
    console.log(`     ⚠️  GBP post failed: ${err.message}`);
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
      };

      newProjects.push({ slug, city, state, serviceType: primaryType, summary });
    }

    imported++;
    console.log();
  }

  // GBP posting for new projects
  if (!DRY_RUN && !SKIP_GBP && newProjects.length > 0) {
    console.log(`\n📣 Posting ${newProjects.length} new project(s) to Google Business Profile...\n`);

    for (const project of newProjects) {
      const eventEntry = Object.entries(manifest.imported).find(
        ([, v]) => v.slug === project.slug
      );

      if (eventEntry && !eventEntry[1].publishedToGBP) {
        console.log(`  📋 GBP: ${project.slug}`);
        const ok = await postToGBP(auth, project);
        if (ok) {
          manifest.imported[eventEntry[0]].publishedToGBP = true;
          console.log('     ✅ Posted to GBP');
        }
        console.log();
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
  console.log(`  Skipped: ${skipped}`);
  console.log('-----------------------------------\n');
}

main().catch(err => {
  console.error('❌ Cron import failed:', err.message);
  process.exit(1);
});
