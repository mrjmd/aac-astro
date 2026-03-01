#!/usr/bin/env node

/**
 * Accessibility Testing Script
 *
 * Uses axe-core to test key page types for accessibility violations.
 * - Fails build on critical or serious violations
 * - Fails build if axe cannot run properly
 * - Warns on minor violations
 */

import axe from 'axe-core';
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// Configure axe-core for Node.js environment
const distDir = resolve('dist');

// Create a virtual console to suppress jsdom canvas errors
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', (error) => {
  // Suppress canvas-related errors (not needed for a11y testing)
  if (error.message && error.message.includes('HTMLCanvasElement')) {
    return;
  }
  console.error(error);
});

// Pages to test (representative samples of each page type)
const pagesToTest = [
  'index.html',                           // Homepage
  'services/index.html',                  // Services hub
  'services/wall-crack-repair/index.html', // Service detail
  'blog/index.html',                      // Blog index
  'connecticut/index.html',               // State hub CT
  'massachusetts/index.html',             // State hub MA
  'foundation-types/index.html',          // Foundation types hub
  'about/index.html',                     // About page
];

// Also test some dynamic city pages if they exist
const cityPagePatterns = [
  'connecticut/hartford/index.html',
  'massachusetts/boston/index.html',
];

async function runAxe(html, pagePath) {
  // Create a DOM from the HTML
  const dom = new JSDOM(html, {
    url: `http://localhost/${pagePath}`,
    virtualConsole,
  });

  const { document, Node } = dom.window;

  // Set up global references that axe needs
  global.document = document;
  global.window = dom.window;
  global.Node = Node;
  global.NodeList = dom.window.NodeList;
  global.Element = dom.window.Element;
  global.HTMLElement = dom.window.HTMLElement;

  try {
    // Configure axe for relevant checks
    axe.configure({
      rules: [
        { id: 'color-contrast', enabled: false }, // Disable - can't test without CSS rendering
        { id: 'image-alt', enabled: true },
        { id: 'label', enabled: true },
        { id: 'link-name', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'html-has-lang', enabled: true },
        { id: 'landmark-one-main', enabled: true },
        { id: 'page-has-heading-one', enabled: true },
        { id: 'region', enabled: true },
      ]
    });

    // Run axe analysis on the document body
    const results = await axe.run(document.documentElement, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'best-practice']
      }
    });

    return results;
  } finally {
    // Clean up globals
    delete global.document;
    delete global.window;
    delete global.Node;
    delete global.NodeList;
    delete global.Element;
    delete global.HTMLElement;
    dom.window.close();
  }
}

function categorizeViolation(impact) {
  // critical and serious are blocking
  // moderate and minor are warnings
  if (impact === 'critical' || impact === 'serious') {
    return 'error';
  }
  return 'warning';
}

async function testPage(pagePath) {
  const fullPath = join(distDir, pagePath);

  if (!existsSync(fullPath)) {
    return { path: pagePath, skipped: true };
  }

  const html = readFileSync(fullPath, 'utf-8');

  try {
    const results = await runAxe(html, pagePath);
    return {
      path: pagePath,
      violations: results.violations,
      passes: results.passes.length,
    };
  } catch (error) {
    // Return error as a failure, not just a skip
    return {
      path: pagePath,
      runError: error.message,
    };
  }
}

async function main() {
  console.log('\n===================================');
  console.log('  Accessibility Testing (axe-core)');
  console.log('===================================\n');

  if (!existsSync(distDir)) {
    console.error('Error: dist/ directory not found. Run npm run build first.');
    process.exit(1);
  }

  // Gather all pages to test
  const allPages = [...pagesToTest, ...cityPagePatterns];

  // Also find some blog posts to test
  const blogDir = join(distDir, 'blog');
  if (existsSync(blogDir)) {
    const blogEntries = readdirSync(blogDir, { withFileTypes: true });
    const blogPosts = blogEntries
      .filter(e => e.isDirectory() && e.name !== 'category')
      .slice(0, 2)
      .map(e => `blog/${e.name}/index.html`);
    allPages.push(...blogPosts);
  }

  // Also find some foundation type pages
  const ftDir = join(distDir, 'foundation-types');
  if (existsSync(ftDir)) {
    const ftEntries = readdirSync(ftDir, { withFileTypes: true });
    const ftPages = ftEntries
      .filter(e => e.isDirectory())
      .slice(0, 2)
      .map(e => `foundation-types/${e.name}/index.html`);
    allPages.push(...ftPages);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  let testedCount = 0;
  let skippedCount = 0;
  let runErrorCount = 0;
  const errorDetails = [];
  const runErrors = [];

  for (const pagePath of allPages) {
    const result = await testPage(pagePath);

    if (result.skipped) {
      skippedCount++;
      continue;
    }

    if (result.runError) {
      console.log(`  [ERROR] ${pagePath}: Failed to run axe - ${result.runError}`);
      runErrorCount++;
      runErrors.push({ page: pagePath, error: result.runError });
      continue;
    }

    testedCount++;

    const errors = result.violations.filter(v => categorizeViolation(v.impact) === 'error');
    const warnings = result.violations.filter(v => categorizeViolation(v.impact) === 'warning');

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`  [PASS] ${pagePath} (${result.passes} checks passed)`);
    } else {
      const status = errors.length > 0 ? 'FAIL' : 'WARN';
      console.log(`  [${status}] ${pagePath}`);

      for (const violation of errors) {
        console.log(`         ERROR: ${violation.description} (${violation.impact})`);
        console.log(`                ${violation.help}`);
        console.log(`                See: ${violation.helpUrl}`);
        errorDetails.push({
          page: pagePath,
          violation: violation.id,
          description: violation.description,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.map(n => n.html).slice(0, 3),
        });
      }

      for (const violation of warnings) {
        console.log(`         WARN: ${violation.description} (${violation.impact})`);
      }
    }

    totalErrors += errors.length;
    totalWarnings += warnings.length;
  }

  console.log('\n-----------------------------------');
  console.log('  Summary');
  console.log('-----------------------------------');
  console.log(`  Pages tested: ${testedCount}`);
  console.log(`  Pages skipped: ${skippedCount}`);
  console.log(`  Run errors: ${runErrorCount}`);
  console.log(`  Critical/Serious issues: ${totalErrors}`);
  console.log(`  Minor issues (warnings): ${totalWarnings}`);
  console.log('-----------------------------------\n');

  // FAIL if axe couldn't run on pages (this is a CI failure)
  if (runErrorCount > 0) {
    console.log('FAILED: Could not run accessibility tests on some pages.\n');
    runErrors.forEach((e, i) => {
      console.log(`${i + 1}. ${e.page}: ${e.error}`);
    });
    process.exit(1);
  }

  if (totalErrors > 0) {
    console.log('FAILED: Critical or serious accessibility violations found.\n');
    console.log('Error Details:');
    errorDetails.forEach((e, i) => {
      console.log(`\n${i + 1}. ${e.page}`);
      console.log(`   Issue: ${e.description}`);
      console.log(`   Impact: ${e.impact}`);
      console.log(`   Fix: ${e.help}`);
      if (e.nodes && e.nodes.length > 0) {
        console.log(`   Elements:`);
        e.nodes.forEach(html => console.log(`      ${html.substring(0, 100)}...`));
      }
    });
    process.exit(1);
  }

  if (totalWarnings > 0) {
    console.log('PASSED with warnings: Minor accessibility issues found.\n');
    process.exit(0);
  }

  console.log('PASSED: No accessibility violations found.\n');
  process.exit(0);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
