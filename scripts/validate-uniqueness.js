#!/usr/bin/env node

/**
 * Content Uniqueness Validation Script
 *
 * Compares the body text of city/location pages to detect excessive similarity.
 * Flags any pair of pages with >20% text similarity as an error.
 *
 * Uses word 4-gram (shingle) overlap with Jaccard similarity for accurate
 * content comparison that's resistant to shared industry terminology.
 * Run: npm run validate:uniqueness
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const SIMILARITY_THRESHOLD = 0.20;  // Jaccard similarity (word 4-grams) — all 80 pages are <5%
const WARN_THRESHOLD = 0.15;
const CONTENT_DIR = resolve('src/content/locations');

// Extract body text from markdown (strip frontmatter and markdown syntax)
function extractBody(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  // Remove frontmatter
  const body = raw.replace(/^---[\s\S]*?---/, '').trim();
  // Strip markdown syntax: headings, bold, links, images
  return body
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

// Tokenize text into words
function tokenize(text) {
  return text.match(/\b[a-z]+\b/g) || [];
}

// Generate word n-grams (shingles)
function wordNgrams(words, n = 4) {
  const shingles = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    shingles.add(words.slice(i, i + n).join(' '));
  }
  return shingles;
}

// Jaccard similarity between two sets
function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

// Collect all location markdown files
function getAllLocationFiles() {
  const files = [];
  if (!existsSync(CONTENT_DIR)) return files;

  const states = readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  for (const state of states) {
    const stateDir = join(CONTENT_DIR, state);
    const cityFiles = readdirSync(stateDir, { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => ({
        id: `${state}/${e.name.replace('.md', '')}`,
        path: join(stateDir, e.name),
      }));
    files.push(...cityFiles);
  }
  return files;
}

// Main
console.log('🔍 Validating content uniqueness...\n');

const files = getAllLocationFiles();
console.log(`📄 Location pages found: ${files.length}`);

// Extract all body texts and compute shingles
const pages = files.map(f => {
  const body = extractBody(f.path);
  const words = tokenize(body);
  const shingles = wordNgrams(words, 4);
  return { ...f, body, shingles };
});

let errors = 0;
let warnings = 0;
let comparisons = 0;
const flagged = [];

// Compare every pair
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    comparisons++;
    const score = jaccard(pages[i].shingles, pages[j].shingles);

    if (score >= SIMILARITY_THRESHOLD) {
      errors++;
      flagged.push({ a: pages[i].id, b: pages[j].id, score });
    } else if (score >= WARN_THRESHOLD) {
      warnings++;
      flagged.push({ a: pages[i].id, b: pages[j].id, score, warning: true });
    }
  }
}

console.log(`🔄 Comparisons made: ${comparisons}\n`);

if (flagged.length > 0) {
  // Sort by similarity descending
  flagged.sort((a, b) => b.score - a.score);

  for (const f of flagged) {
    const pct = (f.score * 100).toFixed(1);
    if (f.warning) {
      console.log(`  ⚠️  [WARN] ${f.a} ↔ ${f.b}: ${pct}% similar`);
    } else {
      console.log(`  ❌ [ERROR] ${f.a} ↔ ${f.b}: ${pct}% similar (threshold: ${SIMILARITY_THRESHOLD * 100}%)`);
    }
  }
  console.log();
}

console.log('-----------------------------------');
console.log('  Summary');
console.log('-----------------------------------');
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);
console.log('-----------------------------------\n');

if (errors > 0) {
  console.log(`❌ Uniqueness validation FAILED — ${errors} page pair(s) exceed ${SIMILARITY_THRESHOLD * 100}% similarity.\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.log('PASSED with warnings.\n');
} else {
  console.log('✅ Uniqueness validation passed!\n');
}
