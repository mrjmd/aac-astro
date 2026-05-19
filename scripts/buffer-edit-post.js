#!/usr/bin/env node

/**
 * Buffer Post Editor — Swap image, text, or schedule on a scheduled post
 *
 * Looks up a project's Buffer post ID from data/buffer-post-manifest.json
 * (keyed on slug), then applies the requested edit via Buffer's editPost API.
 *
 * Common case (image swap on a scheduled post):
 *   node scripts/buffer-edit-post.js --slug hull-crack-injection-2025-07 --image before
 *   node scripts/buffer-edit-post.js --slug hull-crack-injection-2025-07 --image after
 *
 * Direct ID + custom URL:
 *   node scripts/buffer-edit-post.js --post-id 6a0c... --image-url https://...
 *
 * Reschedule:
 *   node scripts/buffer-edit-post.js --slug hull-... --due-at 2026-05-22T15:00:00Z
 *
 * Required env: BUFFER_API_TOKEN (or scripts/.credentials/buffer-token)
 * Default image base: SITE_IMAGE_BASE env var (default https://www.attackacrack.com)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getToken, editPost } from './lib/buffer-client.js';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const SLUG = getArgValue('--slug');
const POST_ID_ARG = getArgValue('--post-id');
const IMAGE_VARIANT = getArgValue('--image'); // "before" | "after"
const IMAGE_URL_ARG = getArgValue('--image-url'); // explicit URL override
const TEXT = getArgValue('--text');
const DUE_AT = getArgValue('--due-at');
const NOTE = getArgValue('--note');

const MANIFEST_PATH = resolve('data/buffer-post-manifest.json');
const SITE_IMAGE_BASE = process.env.SITE_IMAGE_BASE || 'https://www.attackacrack.com';

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!SLUG && !POST_ID_ARG) {
  fail('Either --slug or --post-id is required');
}
if (SLUG && POST_ID_ARG) {
  fail('Pass --slug OR --post-id, not both');
}
if (IMAGE_VARIANT && !['before', 'after'].includes(IMAGE_VARIANT)) {
  fail('--image must be "before" or "after"');
}
if (IMAGE_VARIANT && IMAGE_URL_ARG) {
  fail('Pass --image OR --image-url, not both');
}
if (!IMAGE_VARIANT && !IMAGE_URL_ARG && !TEXT && !DUE_AT) {
  fail('Nothing to change — pass at least one of --image, --image-url, --text, --due-at');
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) fail(`Manifest not found at ${MANIFEST_PATH}`);
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(m) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2) + '\n');
}

async function main() {
  const manifest = loadManifest();

  let slug = SLUG;
  let postId = POST_ID_ARG;
  let entry;

  if (slug) {
    entry = manifest.posts[slug];
    if (!entry) fail(`No manifest entry for slug "${slug}"`);
    if (entry.status === 'skipped') fail(`Slug "${slug}" is marked skipped — refusing to edit`);
    postId = entry.bufferPostId;
  } else {
    // --post-id path: find the matching slug for manifest annotation
    for (const [s, p] of Object.entries(manifest.posts)) {
      if (p.bufferPostId === postId) {
        slug = s;
        entry = p;
        break;
      }
    }
  }

  // Build image URL from variant if requested
  let imageUrl;
  if (IMAGE_VARIANT && slug) {
    imageUrl = `${SITE_IMAGE_BASE}/images/projects/${slug}-${IMAGE_VARIANT}.jpg`;
  } else if (IMAGE_URL_ARG) {
    imageUrl = IMAGE_URL_ARG;
  }

  const editArgs = { postId };
  if (imageUrl !== undefined) editArgs.imageUrl = imageUrl;
  if (TEXT) editArgs.text = TEXT;
  if (DUE_AT) editArgs.scheduledAt = DUE_AT;

  console.log('📝 Buffer Post Editor');
  console.log(`  Post ID: ${postId}${slug ? ` (${slug})` : ''}`);
  if (imageUrl) console.log(`  New image: ${imageUrl}`);
  if (TEXT) console.log(`  New text: ${TEXT.split('\n')[0]}…`);
  if (DUE_AT) console.log(`  New dueAt: ${DUE_AT}`);

  if (DRY_RUN) {
    console.log('\n  ℹ️  DRY RUN — no API call made');
    return;
  }

  const token = getToken();
  editArgs.token = token;
  const result = await editPost(editArgs);

  console.log(`\n  ✅ Updated post ${result.id}`);

  // Annotate manifest
  if (entry && slug) {
    const noteParts = [];
    if (imageUrl) noteParts.push(`image → ${imageUrl.split('/').pop()}`);
    if (TEXT) noteParts.push('text edited');
    if (DUE_AT) {
      noteParts.push(`rescheduled → ${DUE_AT}`);
      entry.scheduledAt = DUE_AT;
    }
    const autoNote = `Edited ${new Date().toISOString().slice(0, 10)}: ${noteParts.join(', ')}`;
    entry.note = NOTE || (entry.note ? `${entry.note} | ${autoNote}` : autoNote);
    saveManifest(manifest);
    console.log(`  📋 Manifest annotated: ${entry.note}`);
  }
}

main().catch(err => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
