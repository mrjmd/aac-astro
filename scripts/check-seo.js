#!/usr/bin/env node

/**
 * SEO Validation Script
 *
 * Validates SEO metadata across all pages in the build.
 * Run after build: npm run check:seo
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { JSDOM } from 'jsdom';

const DIST_DIR = 'dist';

// Paths to exclude from SEO checks (not public-facing pages)
const EXCLUDE_PATHS = [
  'admin/',  // Decap CMS admin interface
  'partners/capture/',  // Lead capture form (noindex, no SEO needed)
  'partners/qr/',  // QR code print page (noindex, no SEO needed)
];

// SEO constraints
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 120;
const DESCRIPTION_MAX = 160;

let errors = [];
let pagesChecked = 0;

// Track duplicates
const titles = new Map();
const descriptions = new Map();

async function getAllHtmlFiles(dir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

function checkTitle(title, filePath) {
  if (!title) {
    errors.push(`${filePath}: Missing <title> tag`);
    return;
  }

  const length = title.length;

  if (length < TITLE_MIN) {
    errors.push(`${filePath}: Title too short (${length} chars, min ${TITLE_MIN}): "${title}"`);
  } else if (length > TITLE_MAX) {
    errors.push(`${filePath}: Title too long (${length} chars, max ${TITLE_MAX}): "${title.substring(0, 50)}..."`);
  }

  // Track for duplicates
  if (titles.has(title)) {
    errors.push(`${filePath}: Duplicate title with ${titles.get(title)}: "${title.substring(0, 50)}..."`);
  } else {
    titles.set(title, filePath);
  }
}

function checkDescription(description, filePath) {
  if (!description) {
    errors.push(`${filePath}: Missing meta description`);
    return;
  }

  const length = description.length;

  if (length < DESCRIPTION_MIN) {
    errors.push(`${filePath}: Description too short (${length} chars, min ${DESCRIPTION_MIN})`);
  } else if (length > DESCRIPTION_MAX) {
    errors.push(`${filePath}: Description too long (${length} chars, max ${DESCRIPTION_MAX})`);
  }

  // Track for duplicates
  if (descriptions.has(description)) {
    errors.push(`${filePath}: Duplicate description with ${descriptions.get(description)}`);
  } else {
    descriptions.set(description, filePath);
  }
}

function checkHeadings(document, filePath) {
  const h1s = document.querySelectorAll('h1');

  if (h1s.length === 0) {
    errors.push(`${filePath}: Missing H1 tag`);
  } else if (h1s.length > 1) {
    errors.push(`${filePath}: Multiple H1 tags (${h1s.length})`);
  }

  // Check heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;

  for (const heading of headings) {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1 && lastLevel !== 0) {
      // Skip level (e.g., H1 -> H3)
      errors.push(`${filePath}: Skipped heading level (H${lastLevel} to H${level})`);
    }
    lastLevel = level;
  }
}

function checkOpenGraph(document, filePath) {
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');

  if (!ogTitle) errors.push(`${filePath}: Missing og:title`);
  if (!ogDesc) errors.push(`${filePath}: Missing og:description`);
  if (!ogImage) errors.push(`${filePath}: Missing og:image`);
  if (!ogUrl) errors.push(`${filePath}: Missing og:url`);

  // B6: Check for placeholder OG images
  if (ogImage) {
    const imageUrl = ogImage.getAttribute('content') || '';
    if (imageUrl.includes('picsum.photos')) {
      errors.push(`${filePath}: og:image contains placeholder (picsum.photos)`);
    }
  }
}

function checkCanonical(document, filePath) {
  const canonical = document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    errors.push(`${filePath}: Missing canonical URL`);
  } else {
    const href = canonical.getAttribute('href');
    if (!href || !href.startsWith('https://')) {
      errors.push(`${filePath}: Canonical URL should be absolute HTTPS`);
    }
  }
}

function checkImages(document, filePath) {
  const images = document.querySelectorAll('img');

  for (const img of images) {
    const alt = img.getAttribute('alt');
    if (!alt && alt !== '') {
      const src = img.getAttribute('src') || 'unknown';
      errors.push(`${filePath}: Image missing alt: ${src.substring(0, 40)}...`);
    }
  }
}

function checkLinks(document, filePath) {
  const links = document.querySelectorAll('a[href]');

  for (const link of links) {
    const href = link.getAttribute('href');

    // Check for empty hrefs
    if (!href || href === '#') {
      errors.push(`${filePath}: Link with empty or # href`);
    }

    // External links should have rel="noopener"
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      const rel = link.getAttribute('rel') || '';
      if (!rel.includes('noopener')) {
        // This is minor, so just track it
      }
    }
  }
}

async function validateFile(filePath) {
  const html = await readFile(filePath, 'utf-8');
  const relativePath = relative(DIST_DIR, filePath);

  // Skip excluded paths
  if (EXCLUDE_PATHS.some(excludePath => relativePath.startsWith(excludePath))) {
    return;
  }

  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Get title and description
  const title = document.querySelector('title')?.textContent?.trim();
  const descMeta = document.querySelector('meta[name="description"]');
  const description = descMeta?.getAttribute('content')?.trim();

  checkTitle(title, relativePath);
  checkDescription(description, relativePath);
  checkHeadings(document, relativePath);
  checkOpenGraph(document, relativePath);
  checkCanonical(document, relativePath);
  checkImages(document, relativePath);
  checkLinks(document, relativePath);

  pagesChecked++;
}

async function main() {
  console.log('🔍 Validating SEO metadata...\n');

  try {
    const files = await getAllHtmlFiles(DIST_DIR);

    for (const file of files) {
      await validateFile(file);
    }

    console.log(`📄 Pages checked: ${pagesChecked}`);
    console.log('');

    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):`);
      errors.forEach(e => console.log(`   ${e}`));
      console.log('');
      process.exit(1);
    }

    console.log('✅ SEO validation passed!');

  } catch (error) {
    console.error('Failed to validate SEO:', error);
    process.exit(1);
  }
}

main();
