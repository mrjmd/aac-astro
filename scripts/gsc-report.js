#!/usr/bin/env node

/**
 * Google Search Console Report
 *
 * Pulls search query performance, page performance, and sitemap status
 * from the Search Console API. Outputs JSON to data/reports/gsc-report.json.
 *
 * Usage:
 *   node scripts/gsc-report.js              # last 30 days
 *   node scripts/gsc-report.js --days 90    # last 90 days
 */

import { google } from 'googleapis';
import { writeFile, mkdir } from 'fs/promises';
import { authorize } from './lib/project-import-core.js';

const SITE_URL = 'https://www.attackacrack.com';
const OUTPUT_PATH = 'data/reports/gsc-report.json';

// Parse CLI args
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 30;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

async function main() {
  console.log(`\n📊 Google Search Console Report (last ${DAYS} days)\n`);

  const auth = await authorize();
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const startDate = daysAgo(DAYS);
  const endDate = daysAgo(1); // GSC data has ~2 day lag

  // 1. Top Queries
  console.log('  Fetching top queries...');
  const queriesRes = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 500,
    },
  });
  const topQueries = (queriesRes.data.rows || []).map(r => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 10000) / 100, // percent with 2 decimals
    position: Math.round(r.position * 10) / 10,
  }));

  // 2. Top Pages
  console.log('  Fetching top pages...');
  const pagesRes = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 500,
    },
  });
  const topPages = (pagesRes.data.rows || []).map(r => ({
    page: r.keys[0].replace(SITE_URL, ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 10000) / 100,
    position: Math.round(r.position * 10) / 10,
  }));

  // 3. Query + Page combinations
  console.log('  Fetching query-page combinations...');
  const comboRes = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 1000,
    },
  });
  const queryPageCombinations = (comboRes.data.rows || []).map(r => ({
    query: r.keys[0],
    page: r.keys[1].replace(SITE_URL, ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: Math.round(r.ctr * 10000) / 100,
    position: Math.round(r.position * 10) / 10,
  }));

  // 4. Sitemap status
  console.log('  Fetching sitemap status...');
  let sitemapStatus = null;
  try {
    const sitemapRes = await searchconsole.sitemaps.list({ siteUrl: SITE_URL });
    sitemapStatus = (sitemapRes.data.sitemap || []).map(s => ({
      path: s.path,
      lastSubmitted: s.lastSubmitted,
      lastDownloaded: s.lastDownloaded,
      isPending: s.isPending,
      warnings: s.warnings,
      errors: s.errors,
    }));
  } catch (err) {
    console.log('  ⚠️  Could not fetch sitemap status:', err.message);
  }

  // Summary
  const totalImpressions = topQueries.reduce((sum, q) => sum + q.impressions, 0);
  const totalClicks = topQueries.reduce((sum, q) => sum + q.clicks, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    period: { days: DAYS, start: startDate, end: endDate },
    site: SITE_URL,
    topQueries,
    topPages,
    queryPageCombinations,
    sitemapStatus,
    summary: {
      totalImpressions,
      totalClicks,
      averageCTR: totalImpressions > 0 ? Math.round(totalClicks / totalImpressions * 10000) / 100 : 0,
      averagePosition: topQueries.length > 0
        ? Math.round(topQueries.reduce((sum, q) => sum + q.position, 0) / topQueries.length * 10) / 10
        : 0,
      queriesWithImpressions: topQueries.length,
      pagesWithClicks: topPages.filter(p => p.clicks > 0).length,
    },
  };

  // Write output
  await mkdir('data/reports', { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(report, null, 2));

  // Console summary
  console.log(`\n  ✅ Report saved to ${OUTPUT_PATH}\n`);
  console.log(`  Summary:`);
  console.log(`    Impressions: ${totalImpressions.toLocaleString()}`);
  console.log(`    Clicks: ${totalClicks.toLocaleString()}`);
  console.log(`    Avg CTR: ${report.summary.averageCTR}%`);
  console.log(`    Avg Position: ${report.summary.averagePosition}`);
  console.log(`    Queries: ${topQueries.length}`);
  console.log(`    Pages with clicks: ${report.summary.pagesWithClicks}`);

  if (topQueries.length > 0) {
    console.log(`\n  Top 10 queries by clicks:`);
    topQueries.slice(0, 10).forEach((q, i) => {
      console.log(`    ${i + 1}. "${q.query}" — ${q.clicks} clicks, ${q.impressions} imp, pos ${q.position}`);
    });
  }

  if (topPages.length > 0) {
    console.log(`\n  Top 10 pages by clicks:`);
    topPages.slice(0, 10).forEach((p, i) => {
      console.log(`    ${i + 1}. ${p.page} — ${p.clicks} clicks, ${p.impressions} imp`);
    });
  }
}

main().catch(err => {
  console.error('❌ GSC report failed:', err.message);
  process.exit(1);
});
