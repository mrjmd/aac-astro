#!/usr/bin/env node

/**
 * Buffer Batch Post Scheduler — Project Case Studies
 *
 * Schedules all 91 imported project case studies to Buffer for GBP posting.
 * Uses a diversity interleaving algorithm to ensure varied service types
 * and geographic spread across the posting schedule.
 *
 * Usage:
 *   node scripts/buffer-post-projects.js --list-channels
 *   node scripts/buffer-post-projects.js --dry-run --start-date 2026-03-10
 *   node scripts/buffer-post-projects.js --start-date 2026-03-10
 *   node scripts/buffer-post-projects.js --start-date 2026-03-10 --limit 5
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import { getToken, getOrganizations, getChannels, createPost, buildPostText } from './lib/buffer-client.js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const LIST_CHANNELS = args.includes('--list-channels');
const DRY_RUN = args.includes('--dry-run');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const START_DATE = getArgValue('--start-date');
const LIMIT = getArgValue('--limit') ? parseInt(getArgValue('--limit')) : null;
const CHANNEL_ID = getArgValue('--channel-id') || process.env.BUFFER_CHANNEL_ID;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const PROJECTS_DIR = resolve('src/content/projects');
const IMAGES_DIR = resolve('public/images/projects');
const MANIFEST_PATH = resolve('data/buffer-post-manifest.json');
const IMPORT_MANIFEST_PATH = resolve('data/import-manifest.json');
const SITE_IMAGE_BASE = process.env.SITE_IMAGE_BASE || '';
const MIN_IMAGE_DIM = 250; // GBP minimum: 250x250px

// ---------------------------------------------------------------------------
// Manifest I/O
// ---------------------------------------------------------------------------

function loadManifest() {
  if (existsSync(MANIFEST_PATH)) {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  }
  return { lastRun: null, channelId: null, posts: {} };
}

function saveManifest(manifest) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Project loading — parse frontmatter from .md files
// ---------------------------------------------------------------------------

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let inArray = false;

  for (const line of lines) {
    if (inArray && line.match(/^\s+-\s+/)) {
      fm[currentKey].push(line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, ''));
      continue;
    }
    inArray = false;

    const kv = line.match(/^(\w+):\s*(.*)/);
    if (!kv) continue;

    const [, key, val] = kv;
    currentKey = key;

    if (val === '') {
      fm[key] = [];
      inArray = true;
    } else {
      fm[key] = val.replace(/^["']|["']$/g, '');
    }
  }

  return fm;
}

function loadProjects() {
  const files = readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.md'));
  const projects = [];

  for (const file of files) {
    const content = readFileSync(join(PROJECTS_DIR, file), 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm || fm.published === 'false') continue;

    const slug = file.replace(/\.md$/, '');
    const serviceTypes = Array.isArray(fm.serviceTypes) ? fm.serviceTypes : [fm.serviceTypes];
    const afterImage = fm.afterImage || '';
    const isPlaceholder = afterImage.includes('placeholder');

    // Check image dimensions (GBP requires minimum 250x250)
    let imageTooSmall = false;
    if (!isPlaceholder && afterImage) {
      const localPath = join(IMAGES_DIR, afterImage.split('/').pop());
      if (existsSync(localPath)) {
        try {
          const info = execSync(`sips -g pixelWidth -g pixelHeight "${localPath}" 2>/dev/null`, { encoding: 'utf-8' });
          const w = parseInt(info.match(/pixelWidth:\s*(\d+)/)?.[1] || '0');
          const h = parseInt(info.match(/pixelHeight:\s*(\d+)/)?.[1] || '0');
          if (w < MIN_IMAGE_DIM || h < MIN_IMAGE_DIM) {
            imageTooSmall = true;
          }
        } catch { /* skip check if sips unavailable */ }
      }
    }

    projects.push({
      slug,
      city: fm.city,
      state: fm.state,
      serviceType: serviceTypes[0],
      serviceTypes,
      summary: fm.summary || '',
      afterImage,
      hasImage: !isPlaceholder && afterImage !== '' && !imageTooSmall,
    });
  }

  return projects;
}

// ---------------------------------------------------------------------------
// Diversity interleaving algorithm
// ---------------------------------------------------------------------------

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Swap adjacent same-city posts to improve geographic spread.
 */
function declusterByCity(arr) {
  const result = [...arr];
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].city === result[i + 1].city) {
      // Find next different-city project to swap with
      for (let j = i + 2; j < result.length; j++) {
        if (result[j].city !== result[i].city) {
          [result[i + 1], result[j]] = [result[j], result[i + 1]];
          break;
        }
      }
    }
  }
  return result;
}

/**
 * Interleave rare (non-crack-injection) and common (crack-injection) projects.
 * Every 3rd slot pulls from the rare pool for service type diversity.
 */
function interleaveProjects(projects) {
  const rare = projects.filter(p => p.serviceType !== 'crack-injection');
  const common = projects.filter(p => p.serviceType === 'crack-injection');

  const shuffledRare = declusterByCity(shuffleArray(rare));
  const shuffledCommon = declusterByCity(shuffleArray(common));

  const result = [];
  let rareIdx = 0;
  let commonIdx = 0;
  let slot = 0;

  while (rareIdx < shuffledRare.length || commonIdx < shuffledCommon.length) {
    // Every 3rd slot: pull from rare pool if available
    if (slot % 3 === 2 && rareIdx < shuffledRare.length) {
      result.push(shuffledRare[rareIdx++]);
    } else if (commonIdx < shuffledCommon.length) {
      result.push(shuffledCommon[commonIdx++]);
    } else if (rareIdx < shuffledRare.length) {
      result.push(shuffledRare[rareIdx++]);
    }
    slot++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scheduling — weekdays at 9 AM ET
// ---------------------------------------------------------------------------

/**
 * Generate posting schedule: Monday-Friday at 9:00 AM ET (14:00 UTC).
 * Returns array of ISO 8601 timestamps.
 */
function generateSchedule(startDate, count) {
  const dates = [];
  const current = new Date(startDate + 'T14:00:00Z'); // 9 AM ET = 14:00 UTC

  // Advance to next weekday if starting on weekend
  while (current.getUTCDay() === 0 || current.getUTCDay() === 6) {
    current.setUTCDate(current.getUTCDate() + 1);
  }

  while (dates.length < count) {
    const day = current.getUTCDay();
    if (day >= 1 && day <= 5) {
      dates.push(current.toISOString());
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Token not needed for dry-run (but needed for everything else)
  let token;
  if (DRY_RUN) {
    token = process.env.BUFFER_API_TOKEN || 'dry-run';
  } else {
    try {
      token = getToken();
    } catch (err) {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    }
  }

  // --list-channels: discover org + channel IDs
  if (LIST_CHANNELS) {
    console.log('📋 Buffer Organizations & Channels:\n');
    const orgs = await getOrganizations(token);

    if (!orgs.length) {
      console.log('  No organizations found. Set up your Buffer account first.');
      return;
    }

    for (const org of orgs) {
      console.log(`  Organization: ${org.name} (${org.ownerEmail})`);
      console.log(`    Org ID: ${org.id}\n`);

      const channels = await getChannels(token, org.id);
      if (!channels.length) {
        console.log('    No channels connected.\n');
        continue;
      }

      for (const ch of channels) {
        console.log(`    ${ch.service} — ${ch.displayName || ch.name}`);
        console.log(`      Channel ID: ${ch.id}`);
        console.log(`      Queue paused: ${ch.isQueuePaused}`);
        console.log();
      }
    }
    return;
  }

  // Validate required args
  if (!START_DATE && !DRY_RUN) {
    console.error('❌ --start-date YYYY-MM-DD is required (or use --dry-run)');
    process.exit(1);
  }

  if (!CHANNEL_ID && !DRY_RUN) {
    console.error('❌ --channel-id or BUFFER_CHANNEL_ID env var is required (or use --dry-run)');
    console.error('   Run with --list-channels to find your channel ID');
    process.exit(1);
  }

  const startDate = START_DATE || '2026-03-10';

  console.log('📣 Buffer Batch Post Scheduler — Project Case Studies\n');
  if (DRY_RUN) console.log('  ℹ️  DRY RUN — no posts will be created\n');

  // Load projects
  const allProjects = loadProjects();
  console.log(`  📁 Loaded ${allProjects.length} projects from content collection`);

  // Filter to those with real images (skip placeholders for GBP)
  const withImages = allProjects.filter(p => p.hasImage);
  console.log(`  🖼️  ${withImages.length} have real images (${allProjects.length - withImages.length} placeholder-only, skipped)`);

  // Filter already-scheduled
  const manifest = loadManifest();
  const unscheduled = withImages.filter(p => !manifest.posts[p.slug]);
  console.log(`  📋 ${unscheduled.length} not yet scheduled (${withImages.length - unscheduled.length} already in manifest)\n`);

  if (unscheduled.length === 0) {
    console.log('  ✅ All eligible projects already scheduled. Nothing to do.');
    return;
  }

  // Interleave for diversity
  const ordered = interleaveProjects(unscheduled);
  const toSchedule = LIMIT ? ordered.slice(0, LIMIT) : ordered;

  // Generate schedule
  const schedule = generateSchedule(startDate, toSchedule.length);

  // Preview
  console.log(`  📅 Scheduling ${toSchedule.length} posts, ${startDate} through ${schedule[schedule.length - 1]?.slice(0, 10)}\n`);
  console.log('  ---');

  let scheduled = 0;
  let errors = 0;

  for (let i = 0; i < toSchedule.length; i++) {
    const project = toSchedule[i];
    const dueAt = schedule[i];
    const postText = buildPostText(project);
    const imageUrl = project.afterImage ? `${SITE_IMAGE_BASE}${project.afterImage}` : null;

    console.log(`  ${i + 1}. ${project.slug}`);
    console.log(`     📅 ${dueAt.slice(0, 10)} | ${project.serviceType} | ${project.city}, ${project.state}`);

    if (DRY_RUN) {
      console.log(`     📝 ${postText.split('\n')[0]}`);
      if (imageUrl) console.log(`     🖼️  ${imageUrl}`);
      console.log(`     (${postText.length} chars)`);
      console.log();
      scheduled++;
      continue;
    }

    try {
      const result = await createPost({
        token,
        channelId: CHANNEL_ID,
        text: postText,
        imageUrl,
        linkUrl: `https://www.attackacrack.com/projects/${project.slug}`,
        scheduledAt: dueAt,
      });

      const postId = result?.id || 'unknown';

      manifest.posts[project.slug] = {
        bufferPostId: postId,
        scheduledAt: dueAt,
        status: 'scheduled',
      };

      console.log(`     ✅ Scheduled (Buffer ID: ${postId})`);
      scheduled++;
    } catch (err) {
      console.log(`     ❌ Failed: ${err.message}`);
      errors++;
    }

    console.log();
  }

  // Update import manifest publishedToGBP flags
  if (!DRY_RUN && existsSync(IMPORT_MANIFEST_PATH)) {
    const importManifest = JSON.parse(readFileSync(IMPORT_MANIFEST_PATH, 'utf-8'));
    let updated = 0;

    for (const [eventId, entry] of Object.entries(importManifest.imported || {})) {
      if (manifest.posts[entry.slug] && !entry.publishedToGBP) {
        importManifest.imported[eventId].publishedToGBP = true;
        updated++;
      }
    }

    if (updated > 0) {
      writeFileSync(IMPORT_MANIFEST_PATH, JSON.stringify(importManifest, null, 2) + '\n');
      console.log(`  📋 Updated ${updated} entries in import-manifest.json (publishedToGBP: true)`);
    }
  }

  // Save buffer manifest
  if (!DRY_RUN) {
    manifest.lastRun = new Date().toISOString();
    manifest.channelId = CHANNEL_ID;
    saveManifest(manifest);
    console.log(`  📋 Buffer manifest saved (${Object.keys(manifest.posts).length} total entries)`);
  }

  // Summary
  console.log('\n  -----------------------------------');
  console.log('  Batch Scheduling Summary');
  console.log('  -----------------------------------');
  console.log(`  Total eligible:  ${unscheduled.length}`);
  console.log(`  Scheduled:       ${scheduled}`);
  if (errors > 0) console.log(`  Errors:          ${errors}`);
  if (LIMIT) console.log(`  Limit:           ${LIMIT}`);
  console.log('  -----------------------------------\n');
}

main().catch(err => {
  console.error('❌ Buffer batch scheduling failed:', err.message);
  process.exit(1);
});
