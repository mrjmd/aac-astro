#!/usr/bin/env node

/**
 * Sitemap Validation Script
 *
 * Validates the generated sitemap against expected pages.
 * Run after build: npm run validate:sitemap
 */

import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';

const DIST_DIR = 'dist';
const EXPECTED_DOMAIN = 'https://www.attackacrack.com';

// Pages that should NOT appear in sitemap
const EXCLUDED_FROM_SITEMAP = [
  'admin/', // CMS admin
];

let errors = [];

async function getAllHtmlFiles(dir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name === 'index.html') {
        files.push(relative(dir, fullPath).replace('/index.html', '/'));
      }
    }
  }

  await walk(dir);
  return files;
}

async function main() {
  console.log('🗺️  Validating sitemap...\n');

  try {
    // Read sitemap index
    const sitemapIndex = await readFile(join(DIST_DIR, 'sitemap-index.xml'), 'utf-8');

    // Extract sitemap URLs from index
    const sitemapUrlMatches = sitemapIndex.match(/<loc>(.*?)<\/loc>/g) || [];
    const sitemapFiles = sitemapUrlMatches.map(m => m.replace(/<\/?loc>/g, ''));

    if (sitemapFiles.length === 0) {
      errors.push('No sitemaps found in sitemap-index.xml');
    }

    // Read all sitemap files and collect URLs
    const allSitemapUrls = new Set();
    for (const sitemapUrl of sitemapFiles) {
      const filename = sitemapUrl.split('/').pop();
      try {
        const sitemapContent = await readFile(join(DIST_DIR, filename), 'utf-8');
        const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g) || [];
        for (const match of urlMatches) {
          const url = match.replace(/<\/?loc>/g, '');
          allSitemapUrls.add(url);

          // Check domain
          if (!url.startsWith(EXPECTED_DOMAIN)) {
            errors.push(`Sitemap URL has wrong domain: ${url} (expected ${EXPECTED_DOMAIN})`);
          }

          // Check HTTPS
          if (!url.startsWith('https://')) {
            errors.push(`Sitemap URL not HTTPS: ${url}`);
          }
        }
      } catch {
        errors.push(`Could not read sitemap file: ${filename}`);
      }
    }

    // Get all HTML pages from build
    const htmlPages = await getAllHtmlFiles(DIST_DIR);
    const publicPages = htmlPages.filter(p =>
      !EXCLUDED_FROM_SITEMAP.some(ex => p.startsWith(ex))
    );

    console.log(`📄 Sitemap URLs: ${allSitemapUrls.size}`);
    console.log(`📄 Built pages: ${publicPages.length}`);
    console.log('');

    // Check minimum URL count (should have at least 100 pages)
    if (allSitemapUrls.size < 50) {
      errors.push(`Sitemap has too few URLs (${allSitemapUrls.size}, expected 50+)`);
    }

    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):`);
      errors.forEach(e => console.log(`   ${e}`));
      console.log('');
      process.exit(1);
    }

    console.log('✅ Sitemap validation passed!');
  } catch (error) {
    console.error('Failed to validate sitemap:', error);
    process.exit(1);
  }
}

main();
