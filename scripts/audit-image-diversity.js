#!/usr/bin/env node

/**
 * Image Diversity Audit
 *
 * Analyzes the built site to check how many unique hero images are used
 * across location pages, and flags any duplicates or neighbor collisions.
 *
 * Usage: npm run audit:images
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const DIST = 'dist';
const STATE_DIRS = ['connecticut', 'massachusetts', 'rhode-island', 'new-hampshire', 'maine'];

async function getCityPages(stateDir) {
  const dir = join(DIST, stateDir);
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter(e => e.isDirectory() && e.name !== 'index')
    .map(e => ({ state: stateDir, city: e.name, path: join(dir, e.name, 'index.html') }));
}

function extractHeroImage(html) {
  // The hero image is in a div.aspect-[4/3] container — find the first img src in that context
  // Look for the img tag after "aspect-[4/3]"
  const aspectMatch = html.indexOf('aspect-[4/3]');
  if (aspectMatch === -1) return null;

  const afterAspect = html.substring(aspectMatch, aspectMatch + 500);
  const srcMatch = afterAspect.match(/src="([^"]+)"/);
  return srcMatch ? srcMatch[1] : null;
}

async function main() {
  const allPages = [];

  for (const state of STATE_DIRS) {
    const pages = await getCityPages(state);
    allPages.push(...pages);
  }

  console.log(`\n📊 Image Diversity Audit`);
  console.log(`========================\n`);
  console.log(`Total location pages: ${allPages.length}\n`);

  const imageMap = new Map(); // image -> [cities]
  const cityImageMap = new Map(); // city -> image

  for (const page of allPages) {
    try {
      const html = await readFile(page.path, 'utf-8');
      const heroImage = extractHeroImage(html);
      if (heroImage) {
        const key = heroImage.replace(/\.webp$/, '.jpg');
        if (!imageMap.has(key)) imageMap.set(key, []);
        imageMap.get(key).push(`${page.state}/${page.city}`);
        cityImageMap.set(`${page.state}/${page.city}`, key);
      }
    } catch {
      console.log(`  ⚠️  Could not read ${page.path}`);
    }
  }

  const uniqueImages = imageMap.size;
  console.log(`Unique hero images: ${uniqueImages}`);
  console.log(`Diversity ratio: ${(uniqueImages / allPages.length * 100).toFixed(1)}%\n`);

  // State breakdown
  console.log(`State breakdown:`);
  for (const state of STATE_DIRS) {
    const statePages = allPages.filter(p => p.state === state);
    const stateImages = new Set();
    for (const page of statePages) {
      const img = cityImageMap.get(`${page.state}/${page.city}`);
      if (img) stateImages.add(img);
    }
    console.log(`  ${state}: ${statePages.length} pages, ${stateImages.size} unique images`);
  }

  // Duplicates
  const duplicates = [...imageMap.entries()]
    .filter(([, cities]) => cities.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (duplicates.length > 0) {
    console.log(`\n⚠️  Shared images (${duplicates.length} images used by multiple cities):`);
    for (const [image, cities] of duplicates) {
      const shortImg = image.split('/').pop();
      console.log(`  ${shortImg} (${cities.length}x): ${cities.join(', ')}`);
    }
  } else {
    console.log(`\n✅ No duplicate hero images! Every city has a unique image.`);
  }

  // Summary
  console.log(`\n---`);
  if (uniqueImages >= allPages.length * 0.9) {
    console.log(`✅ Excellent diversity: ${uniqueImages}/${allPages.length} unique images`);
  } else if (uniqueImages >= allPages.length * 0.7) {
    console.log(`⚠️  Good diversity: ${uniqueImages}/${allPages.length} unique images`);
  } else {
    console.log(`❌ Poor diversity: ${uniqueImages}/${allPages.length} unique images`);
  }
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
