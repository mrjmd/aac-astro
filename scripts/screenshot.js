/**
 * Screenshot utility for visual verification of CSS/layout changes.
 *
 * Usage:
 *   node scripts/screenshot.js <url-path> [css-selector] [--width=1280] [--full-page]
 *
 * Examples:
 *   node scripts/screenshot.js /                     # Full-page homepage
 *   node scripts/screenshot.js / "#about"             # Just the #about section
 *   node scripts/screenshot.js /services --width=375  # Mobile width
 *   node scripts/screenshot.js / --full-page           # Full page screenshot
 *
 * Output: .claude/screenshots/screenshot.png
 */

import { chromium } from '@playwright/test';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SCREENSHOT_DIR = resolve('.claude/screenshots');
const SCREENSHOT_PATH = resolve(SCREENSHOT_DIR, 'screenshot.png');
const PREVIEW_PORT = 4321;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;

function parseArgs(args) {
  const urlPath = args.find(a => a.startsWith('/')) || '/';
  const selector = args.find(a => !a.startsWith('/') && !a.startsWith('--'));
  const width = parseInt(args.find(a => a.startsWith('--width='))?.split('=')[1] || '1280', 10);
  const fullPage = args.includes('--full-page');
  return { urlPath, selector, width, fullPage };
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

async function main() {
  const { urlPath, selector, width, fullPage } = parseArgs(process.argv.slice(2));

  // Ensure dist exists
  if (!existsSync('dist')) {
    console.log('Building site...');
    execSync('npm run build', { stdio: 'inherit' });
  }

  // Ensure screenshot directory exists
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Start preview server
  console.log('Starting preview server...');
  const preview = spawn('npx', ['astro', 'preview', '--port', String(PREVIEW_PORT)], {
    stdio: 'pipe',
    detached: false,
  });

  let previewOutput = '';
  preview.stdout.on('data', d => { previewOutput += d.toString(); });
  preview.stderr.on('data', d => { previewOutput += d.toString(); });

  try {
    await waitForServer(PREVIEW_URL);

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width, height: 900 } });

    const url = `${PREVIEW_URL}${urlPath}`;
    console.log(`Navigating to ${url}${selector ? ` (selector: ${selector})` : ''}...`);
    await page.goto(url, { waitUntil: 'networkidle' });

    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        console.error(`Selector "${selector}" not found on page`);
        process.exit(1);
      }
      await element.screenshot({ path: SCREENSHOT_PATH });
    } else {
      await page.screenshot({ path: SCREENSHOT_PATH, fullPage });
    }

    console.log(`Screenshot saved to ${SCREENSHOT_PATH}`);
    await browser.close();
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
