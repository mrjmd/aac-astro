/**
 * Lighthouse Audit Script
 *
 * Runs Lighthouse against the staging site for a representative set of pages,
 * performing 3 runs per page and taking median scores. Outputs a JSON report
 * and prints a summary table to stdout.
 *
 * Usage: node scripts/lighthouse-audit.js
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const BASE_URL = 'https://www.attackacrack.com';
const RUNS_PER_PAGE = 3;
const OUTPUT_FILE = join(PROJECT_ROOT, '.lighthouse-audit-results.json');

/** Fixed pages that are always audited. */
const FIXED_PAGES = [
  '/',
  '/about',
  '/services',
  '/concrete-repair',
  '/blog',
  '/connecticut',
  '/massachusetts',
  '/projects',
  '/locations',
  '/updates',
];

/**
 * Slug pools — one random page is picked from each pool per run.
 * Patterns match sitemap paths (without trailing slash).
 */
const SLUG_POOLS = [
  { label: 'service detail',         pattern: /^\/services\/[^/]+$/ },
  { label: 'concrete-repair detail', pattern: /^\/concrete-repair\/[^/]+$/ },
  { label: 'blog post',              pattern: /^\/blog\/[^/]+$/, exclude: /^\/blog\/category\// },
  { label: 'CT city',                pattern: /^\/connecticut\/[^/]+$/ },
  { label: 'MA city',                pattern: /^\/massachusetts\/[^/]+$/, exclude: /trusted-partners/ },
  { label: 'RI city',                pattern: /^\/rhode-island\/[^/]+$/ },
  { label: 'NH city',                pattern: /^\/new-hampshire\/[^/]+$/ },
  { label: 'ME city',                pattern: /^\/maine\/[^/]+$/ },
  { label: 'project detail',         pattern: /^\/projects\/[^/]+$/ },
  { label: 'partner page',           pattern: /^\/partners\/[^/]+$/, exclude: /\/(capture|qr)$/ },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Parse sitemap.xml from dist/ and return all paths (no trailing slash). */
function parseSitemapPaths() {
  const sitemapPath = join(PROJECT_ROOT, 'dist', 'sitemap-0.xml');
  const xml = readFileSync(sitemapPath, 'utf-8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  return urls.map(u => {
    const path = new URL(u).pathname;
    return path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  });
}

/** Build the page list: fixed pages + one random pick per slug pool. */
function buildPageList() {
  const allPaths = parseSitemapPaths();
  const pages = [...FIXED_PAGES];

  for (const pool of SLUG_POOLS) {
    const candidates = allPaths.filter(p =>
      pool.pattern.test(p) && (!pool.exclude || !pool.exclude.test(p))
    );
    if (candidates.length === 0) {
      console.warn(`  ⚠ No candidates for "${pool.label}" pool`);
      continue;
    }
    const pick = pickRandom(candidates);
    pages.push(pick);
  }

  return pages;
}

const CATEGORY_IDS = ['performance', 'accessibility', 'best-practices', 'seo'];

const CWV_METRICS = [
  { id: 'first-contentful-paint', key: 'FCP' },
  { id: 'largest-contentful-paint', key: 'LCP' },
  { id: 'total-blocking-time', key: 'TBT' },
  { id: 'cumulative-layout-shift', key: 'CLS' },
  { id: 'speed-index', key: 'SI' },
];

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function extractCategoryScores(lhr) {
  const scores = {};
  for (const id of CATEGORY_IDS) {
    const cat = lhr.categories[id];
    scores[id] = cat ? cat.score : null;
  }
  return scores;
}

function extractMetrics(lhr) {
  const metrics = {};
  for (const { id, key } of CWV_METRICS) {
    const audit = lhr.audits[id];
    if (audit && audit.numericValue !== undefined) {
      metrics[key] = audit.numericValue;
    } else {
      metrics[key] = null;
    }
  }
  return metrics;
}

function extractFailingAudits(lhr) {
  const failing = [];
  for (const [auditId, audit] of Object.entries(lhr.audits)) {
    if (audit.score !== null && audit.score < 1) {
      const entry = {
        id: auditId,
        title: audit.title,
        score: audit.score,
        displayValue: audit.displayValue || null,
      };
      // Always include element-level items when available
      if (audit.details?.items?.length) {
        entry.items = audit.details.items;
      }
      failing.push(entry);
    }
  }
  // Sort by score ascending (worst first)
  failing.sort((a, b) => a.score - b.score);
  return failing;
}

function medianCategoryScores(allRuns) {
  const result = {};
  for (const id of CATEGORY_IDS) {
    const values = allRuns.map((r) => r.categoryScores[id]).filter((v) => v !== null);
    result[id] = median(values);
  }
  return result;
}

function medianMetrics(allRuns) {
  const result = {};
  for (const { key } of CWV_METRICS) {
    const values = allRuns.map((r) => r.metrics[key]).filter((v) => v !== null);
    result[key] = median(values);
  }
  return result;
}

function mergeFailingAudits(allRuns) {
  // Take failing audits from the median run (middle run index)
  const midIndex = Math.floor(allRuns.length / 2);
  return allRuns[midIndex].failingAudits;
}

function formatScore(score) {
  if (score === null) return '  -  ';
  return String(Math.round(score * 100)).padStart(4);
}

function formatMs(value) {
  if (value === null) return '     -';
  if (value < 1) {
    // CLS is unitless, typically < 1
    return value.toFixed(3).padStart(6);
  }
  return String(Math.round(value)).padStart(6);
}

function printSummaryRow(path, scores, metrics) {
  const perf = formatScore(scores.performance);
  const a11y = formatScore(scores.accessibility);
  const bp = formatScore(scores['best-practices']);
  const seo = formatScore(scores.seo);
  const fcp = formatMs(metrics.FCP);
  const lcp = formatMs(metrics.LCP);
  const tbt = formatMs(metrics.TBT);
  const cls = formatMs(metrics.CLS);
  const si = formatMs(metrics.SI);

  const paddedPath = path.padEnd(42);
  console.log(
    `  ${paddedPath} ${perf} ${a11y} ${bp} ${seo}  | ${fcp} ${lcp} ${tbt} ${cls} ${si}`
  );
}

function printTableHeader() {
  console.log('');
  console.log('  Lighthouse Audit Results (median of 3 runs)');
  console.log('  ' + '='.repeat(110));
  const header =
    '  ' +
    'Page'.padEnd(42) +
    ' Perf  A11y    BP  SEO  |    FCP    LCP    TBT    CLS     SI';
  console.log(header);
  console.log('  ' + '-'.repeat(110));
}

function printTableFooter() {
  console.log('  ' + '='.repeat(110));
  console.log('');
  console.log('  Scores: 0-100 | FCP/LCP/TBT/SI in ms | CLS unitless');
  console.log('');
}

async function runLighthouseOnPage(url, port) {
  const config = {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
      },
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 823,
        deviceScaleFactor: 1.75,
        disabled: false,
      },
      emulatedUserAgent:
        'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    },
  };

  const flags = {
    port,
    output: 'json',
    logLevel: 'error',
  };

  const result = await lighthouse(url, flags, config);
  return result.lhr;
}

async function main() {
  console.log('');
  console.log('  Building page list from sitemap...');
  const PAGES = buildPageList();

  console.log('  Launching headless Chrome...');

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  console.log(`  Chrome running on port ${chrome.port}`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Pages: ${PAGES.length} | Runs per page: ${RUNS_PER_PAGE}`);
  console.log(`  Total Lighthouse runs: ${PAGES.length * RUNS_PER_PAGE}`);

  const allResults = [];
  const startTime = Date.now();

  printTableHeader();

  for (let i = 0; i < PAGES.length; i++) {
    const path = PAGES[i];
    const url = `${BASE_URL}${path}`;
    const progress = `[${String(i + 1).padStart(2)}/${PAGES.length}]`;

    process.stdout.write(`\r  ${progress} Running: ${path}...`);

    const runs = [];
    let errorMsg = null;

    for (let run = 0; run < RUNS_PER_PAGE; run++) {
      try {
        process.stdout.write(
          `\r  ${progress} Running: ${path} (run ${run + 1}/${RUNS_PER_PAGE})...          `
        );
        const lhr = await runLighthouseOnPage(url, chrome.port);
        runs.push({
          categoryScores: extractCategoryScores(lhr),
          metrics: extractMetrics(lhr),
          failingAudits: extractFailingAudits(lhr),
        });
      } catch (err) {
        errorMsg = err.message;
        console.error(`\n  ERROR on ${path} run ${run + 1}: ${err.message}`);
      }
    }

    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(80) + '\r');

    if (runs.length === 0) {
      console.log(`  ${path.padEnd(42)} FAILED: ${errorMsg}`);
      allResults.push({
        path,
        url,
        error: errorMsg,
        scores: null,
        metrics: null,
        failingAudits: null,
        runCount: 0,
      });
      continue;
    }

    const scores = medianCategoryScores(runs);
    const metrics = medianMetrics(runs);
    const failing = mergeFailingAudits(runs);

    printSummaryRow(path, scores, metrics);

    allResults.push({
      path,
      url,
      error: null,
      scores,
      metrics,
      failingAudits: failing,
      runCount: runs.length,
    });
  }

  printTableFooter();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Completed in ${elapsed}s`);

  await chrome.kill();

  // Write full results to JSON
  const output = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    runsPerPage: RUNS_PER_PAGE,
    elapsedSeconds: parseFloat(elapsed),
    results: allResults,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`  Results written to ${OUTPUT_FILE}`);
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
