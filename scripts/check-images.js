#!/usr/bin/env node

/**
 * Image Optimization Check Script
 *
 * Validates that images are properly optimized in the Astro build.
 * Run after build: npm run check:images
 */

import { readdir, readFile, stat, access } from 'fs/promises';
import { join, relative, extname, parse } from 'path';
import { JSDOM } from 'jsdom';

const SRC_DIR = 'src';
const DIST_DIR = 'dist';

// External URLs that are allowed (CDNs, etc.)
const ALLOWED_EXTERNAL_DOMAINS = [
  'picsum.photos',  // Placeholder images (to be replaced)
];

let errors = [];
let warnings = [];
let imagesChecked = 0;

async function getAllFiles(dir, extension) {
  const files = [];

  async function walk(currentDir) {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walk(fullPath);
        } else if (entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Directory doesn't exist or can't be read
    }
  }

  await walk(dir);
  return files;
}

async function checkAstroFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relativePath = relative(SRC_DIR, filePath);

  // Check for raw <img> tags that should use Astro's Image component
  // Exclude cases that are already using dynamic props or inside Image components
  const rawImgMatches = content.matchAll(/<img\s+[^>]*>/gi);

  for (const match of rawImgMatches) {
    const imgTag = match[0];

    // Skip if it's inside a comment or string
    if (imgTag.includes('<!--') || imgTag.includes('-->')) continue;

    // Check for missing alt
    if (!imgTag.includes('alt=')) {
      errors.push(`${relativePath}: <img> tag missing alt attribute`);
    }

    // Check for missing dimensions (can cause CLS)
    const hasWidth = imgTag.includes('width=') || imgTag.includes('class=');
    const hasHeight = imgTag.includes('height=') || imgTag.includes('class=');

    // We allow class-based sizing via Tailwind
    if (!hasWidth && !hasHeight && !imgTag.includes('class=')) {
      warnings.push(`${relativePath}: <img> tag should have width/height or CSS sizing`);
    }

    // Check for external URLs
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      const src = srcMatch[1];
      if (src.startsWith('http://') || src.startsWith('https://')) {
        const isAllowed = ALLOWED_EXTERNAL_DOMAINS.some(domain => src.includes(domain));
        if (!isAllowed) {
          warnings.push(`${relativePath}: External image URL should be local: ${src.substring(0, 50)}...`);
        } else {
          warnings.push(`${relativePath}: Placeholder image to be replaced: ${src.substring(0, 50)}...`);
        }
      }
    }

    imagesChecked++;
  }
}

async function checkHtmlOutput(filePath) {
  const html = await readFile(filePath, 'utf-8');
  const relativePath = relative(DIST_DIR, filePath);
  const dom = new JSDOM(html);
  const images = dom.window.document.querySelectorAll('img');

  for (const img of images) {
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt');

    // Check for missing alt text
    if (!alt && alt !== '') {
      errors.push(`${relativePath}: Image missing alt attribute: ${src?.substring(0, 50) || 'unknown'}`);
    }

    // Check for external images that should be local
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
      const isAllowed = ALLOWED_EXTERNAL_DOMAINS.some(domain => src.includes(domain));
      if (!isAllowed) {
        // This is a warning, not an error, as some external images may be intentional
        warnings.push(`${relativePath}: Consider hosting image locally: ${src.substring(0, 50)}...`);
      }
    }
  }
}

async function checkImageAssets() {
  // Check that images in src/assets are reasonable sizes
  const assetDir = join(SRC_DIR, 'assets', 'images');

  try {
    const images = await getAllFiles(assetDir, '');
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];

    for (const imagePath of images) {
      const ext = extname(imagePath).toLowerCase();
      if (!imageExtensions.includes(ext)) continue;

      const stats = await stat(imagePath);
      const sizeKB = stats.size / 1024;

      // Warn about very large images (over 500KB)
      if (sizeKB > 500 && ext !== '.svg') {
        warnings.push(`${relative(SRC_DIR, imagePath)}: Image is ${Math.round(sizeKB)}KB - consider optimizing`);
      }

      imagesChecked++;
    }
  } catch (e) {
    // No assets/images directory yet - that's OK
  }
}

async function checkWebpSiblings() {
  const PROJECTS_DIR = 'public/images/projects';
  try {
    const entries = await readdir(PROJECTS_DIR);
    const jpgs = entries.filter(f => f.endsWith('.jpg'));

    for (const jpg of jpgs) {
      const { name } = parse(jpg);
      // Check that all 3 WebP sizes exist
      for (const suffix of ['', '-400w', '-800w']) {
        const webpFile = join(PROJECTS_DIR, `${name}${suffix}.webp`);
        try {
          await access(webpFile);
        } catch {
          errors.push(`${jpg}: Missing optimized WebP: ${name}${suffix}.webp (run \`npm run optimize:images\`)`);
        }
      }
    }

    // Warn about oversized WebP files
    const webps = entries.filter(f => f.endsWith('.webp'));
    for (const webp of webps) {
      const stats = await stat(join(PROJECTS_DIR, webp));
      const sizeKB = stats.size / 1024;
      if (sizeKB > 400) {
        warnings.push(`${webp}: WebP is ${Math.round(sizeKB)}KB (> 400KB threshold)`);
      }
    }
  } catch (e) {
    // No projects directory — skip
  }
}

async function main() {
  console.log('🖼️  Checking image optimization...\n');

  try {
    // Check Astro source files
    const astroFiles = await getAllFiles(SRC_DIR, '.astro');
    for (const file of astroFiles) {
      await checkAstroFile(file);
    }

    // Check built HTML
    const htmlFiles = await getAllFiles(DIST_DIR, '.html');
    for (const file of htmlFiles) {
      await checkHtmlOutput(file);
    }

    // Check image assets
    await checkImageAssets();

    // Check WebP siblings for project images
    await checkWebpSiblings();

    console.log(`🖼️  Images checked: ${imagesChecked}`);
    console.log('');

    if (warnings.length > 0) {
      console.log(`⚠️  Warnings (${warnings.length}):`);
      // Group and limit placeholder warnings
      const placeholderWarnings = warnings.filter(w => w.includes('Placeholder'));
      const otherWarnings = warnings.filter(w => !w.includes('Placeholder'));

      otherWarnings.forEach(w => console.log(`   ${w}`));

      if (placeholderWarnings.length > 0) {
        console.log(`   [${placeholderWarnings.length} placeholder images to be replaced - see Phase 11]`);
      }
      console.log('');
    }

    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):`);
      errors.forEach(e => console.log(`   ${e}`));
      console.log('');
      process.exit(1);
    }

    console.log('✅ Image check passed!');

  } catch (error) {
    console.error('Failed to check images:', error);
    process.exit(1);
  }
}

main();
