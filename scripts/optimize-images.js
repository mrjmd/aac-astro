#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * Converts all .jpg files in public/images/projects/ and public/images/blog/
 * to optimized WebP at three responsive sizes: 400w, 800w, and 1400w (full-size).
 *
 * Usage: npm run optimize:images
 *
 * Skips files where the .webp output already exists and is newer than the source .jpg.
 */

import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';
import sharp from 'sharp';

const IMAGE_DIRS = ['public/images/projects', 'public/images/blog'];
const QUALITY = 82;
const SIZES = [
  { suffix: '-400w', width: 400 },
  { suffix: '-800w', width: 800 },
  { suffix: '', width: 1400 },
];

async function processDir(dir) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return { processed: 0, skipped: 0 };
  }
  const jpgs = entries.filter(f => f.endsWith('.jpg'));

  console.log(`Found ${jpgs.length} .jpg files in ${dir}`);

  let processed = 0;
  let skipped = 0;

  for (const jpg of jpgs) {
    const srcPath = join(dir, jpg);
    const { name } = parse(jpg);
    const srcStat = await stat(srcPath);
    let allExist = true;

    for (const { suffix } of SIZES) {
      const outPath = join(dir, `${name}${suffix}.webp`);
      try {
        const outStat = await stat(outPath);
        if (outStat.mtimeMs < srcStat.mtimeMs) {
          allExist = false;
          break;
        }
      } catch {
        allExist = false;
        break;
      }
    }

    if (allExist) {
      skipped++;
      continue;
    }

    const image = sharp(srcPath);

    for (const { suffix, width } of SIZES) {
      const outPath = join(dir, `${name}${suffix}.webp`);
      await image
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outPath);
    }

    processed++;
    if (processed % 20 === 0) {
      console.log(`  Processed ${processed}/${jpgs.length - skipped}...`);
    }
  }

  return { processed, skipped };
}

async function main() {
  let totalProcessed = 0;
  let totalSkipped = 0;

  for (const dir of IMAGE_DIRS) {
    const { processed, skipped } = await processDir(dir);
    totalProcessed += processed;
    totalSkipped += skipped;
  }

  console.log(`\nDone! ${totalProcessed} images processed, ${totalSkipped} skipped (already up-to-date)`);
}

main().catch(err => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
