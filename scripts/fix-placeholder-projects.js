#!/usr/bin/env node

/**
 * One-time fix: Re-download photos for projects that have placeholders
 * despite the calendar event having real photos.
 *
 * Downloads all photos, classifies before/after with Gemini, updates
 * the markdown frontmatter, and cleans up temp files.
 *
 * Usage:
 *   node scripts/fix-placeholder-projects.js --dry-run   # Preview
 *   node scripts/fix-placeholder-projects.js              # Fix all
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { google } from 'googleapis';

import {
  authorize,
  loadManifest,
  saveManifest,
  filterMikePhotos,
  classifyPhotos,
  downloadPhoto,
  updateMarkdownImages,
  extractPhotoFileIds,
  CALENDAR_EMAIL,
  IMAGES_DIR,
  PROJECTS_DIR,
} from './lib/project-import-core.js';
import { join } from 'path';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

async function main() {
  console.log('🔧 Fix Placeholder Projects\n');
  if (DRY_RUN) console.log('  ℹ️  DRY RUN\n');

  const auth = await authorize();
  const calendar = google.calendar({ version: 'v3', auth });
  const manifest = loadManifest();

  // Find placeholder projects that have calendar attachments
  const toFix = [];

  for (const [eventId, entry] of Object.entries(manifest.imported)) {
    const mdPath = resolve(PROJECTS_DIR, `${entry.slug}.md`);
    if (!existsSync(mdPath)) continue;

    const content = readFileSync(mdPath, 'utf-8');
    if (!content.includes('placeholder.svg')) continue;

    // Verify calendar still has attachments
    try {
      const res = await calendar.events.get({ calendarId: CALENDAR_EMAIL, eventId });
      const attachments = res.data.attachments || [];
      if (attachments.length > 0) {
        toFix.push({ eventId, entry, attachments });
      }
    } catch (err) {
      console.log(`  ⚠️  ${entry.slug}: ${err.message}`);
    }
  }

  console.log(`  Found ${toFix.length} placeholder projects with calendar photos\n`);

  if (toFix.length === 0) return;

  let fixed = 0;

  for (const { eventId, entry, attachments } of toFix) {
    const slug = entry.slug;
    console.log(`  📋 ${slug} (${attachments.length} attachments)`);

    if (DRY_RUN) {
      console.log(`     Would download, classify, and update\n`);
      fixed++;
      continue;
    }

    // Filter to image attachments
    const photos = await filterMikePhotos(auth, attachments);
    console.log(`     📸 ${photos.length} image(s)`);

    if (photos.length === 0) {
      console.log(`     ⏭️  No image attachments\n`);
      continue;
    }

    // Download
    const downloadedPaths = [];
    for (let i = 0; i < photos.length; i++) {
      const ext = photos[i].mimeType?.includes('png') ? 'png' : 'jpg';
      const tempPath = join(IMAGES_DIR, `${slug}-fix-${i}.${ext}`);
      const ok = await downloadPhoto(auth, photos[i].fileId, tempPath);
      if (ok) downloadedPaths.push(tempPath);
    }

    if (downloadedPaths.length === 0) {
      console.log(`     ❌ All downloads failed\n`);
      continue;
    }

    // Classify
    console.log(`     🤖 Classifying ${downloadedPaths.length} photos...`);
    const classified = await classifyPhotos(downloadedPaths);

    const finalBeforePath = join(IMAGES_DIR, `${slug}-before.jpg`);
    const finalAfterPath = join(IMAGES_DIR, `${slug}-after.jpg`);

    const { renameSync, copyFileSync, unlinkSync } = await import('fs');

    let beforeImage = `/images/projects/${slug}-before.jpg`;
    let afterImage = `/images/projects/${slug}-after.jpg`;

    if (classified.before && existsSync(classified.before)) {
      renameSync(classified.before, finalBeforePath);
    }
    if (classified.after && existsSync(classified.after)) {
      if (classified.after !== classified.before) {
        renameSync(classified.after, finalAfterPath);
      } else {
        copyFileSync(finalBeforePath, finalAfterPath);
      }
    }

    if (!classified.before && classified.after) beforeImage = afterImage;
    if (!classified.after && classified.before) afterImage = beforeImage;

    // Clean up temp files
    for (const p of downloadedPaths) {
      if (existsSync(p) && p !== finalBeforePath && p !== finalAfterPath) {
        try { unlinkSync(p); } catch { /* ignore */ }
      }
    }

    // Update markdown
    const mdPath = resolve(PROJECTS_DIR, `${slug}.md`);
    updateMarkdownImages(mdPath, beforeImage, afterImage);

    // Update manifest
    entry.photoFileIds = extractPhotoFileIds(attachments);
    entry.lastProcessedAt = new Date().toISOString();
    saveManifest(manifest);

    console.log(`     ✅ Fixed: ${beforeImage}, ${afterImage}\n`);
    fixed++;
  }

  console.log('-----------------------------------');
  console.log(`  Fixed: ${fixed}/${toFix.length}`);
  console.log('-----------------------------------\n');
}

main().catch(err => {
  console.error('❌ Fix failed:', err.message);
  process.exit(1);
});
