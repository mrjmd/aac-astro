#!/usr/bin/env node

/**
 * Google Calendar → Project Case Study Importer
 *
 * Fetches job appointments from Google Calendar, downloads before/after photos
 * from Google Drive attachments, uses Claude to generate summaries, and outputs
 * Astro content collection .md files for the projects collection.
 *
 * Prerequisites:
 *   1. Google Cloud project with Calendar API + Drive API enabled
 *   2. OAuth2 credentials (desktop app type) saved to scripts/.credentials/google-oauth.json
 *   3. npm install googleapis @anthropic-ai/sdk (as devDependencies)
 *
 * Usage:
 *   node scripts/import-calendar-projects.js                    # Full import
 *   node scripts/import-calendar-projects.js --dry-run          # Preview without writing
 *   node scripts/import-calendar-projects.js --since 2025-06-01 # Custom start date
 *   node scripts/import-calendar-projects.js --limit 5          # Process max N events
 *
 * Output: src/content/projects/<slug>.md files with published: false
 */

import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { createInterface } from 'readline';
import { createServer } from 'http';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CREDENTIALS_DIR = resolve('scripts/.credentials');
const OAUTH_CREDS_PATH = join(CREDENTIALS_DIR, 'google-oauth.json');
const TOKEN_PATH = join(CREDENTIALS_DIR, 'google-token.json');
const PROJECTS_DIR = resolve('src/content/projects');
const IMAGES_DIR = resolve('public/images/projects');

const CALENDAR_EMAIL = 'harrringtonm@gmail.com';
const DEFAULT_SINCE = '2025-01-01';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

// Service type detection keywords
const SERVICE_PATTERNS = [
  { type: 'crack-injection', keywords: ['crack injection', 'inject', 'polyurethane', 'crack repair', 'vertical crack', 'poured'] },
  { type: 'wall-crack-repair', keywords: ['wall crack', 'horizontal crack', 'bowing', 'wall repair'] },
  { type: 'bulkhead-repair', keywords: ['bulkhead', 'bilco', 'hatchway', 'basement entry'] },
  { type: 'carbon-fiber', keywords: ['carbon fiber', 'kevlar', 'stabiliz', 'reinforc'] },
  { type: 'sewer-conduit', keywords: ['sewer', 'conduit', 'pipe', 'utility'] },
  { type: 'concrete-repair', keywords: ['concrete', 'driveway', 'patio', 'pool deck', 'walkway', 'steps', 'stoop', 'garage floor'] },
];

// State detection from location strings
const STATE_PATTERNS = [
  { abbr: 'CT', patterns: ['ct', 'connecticut'] },
  { abbr: 'MA', patterns: ['ma', 'massachusetts'] },
  { abbr: 'RI', patterns: ['ri', 'rhode island'] },
  { abbr: 'NH', patterns: ['nh', 'new hampshire'] },
  { abbr: 'ME', patterns: ['me', 'maine'] },
];

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const sinceIdx = args.indexOf('--since');
const SINCE = sinceIdx !== -1 ? args[sinceIdx + 1] : DEFAULT_SINCE;
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function authorize() {
  if (!existsSync(OAUTH_CREDS_PATH)) {
    console.error(`\n❌ OAuth credentials not found at ${OAUTH_CREDS_PATH}`);
    console.error('\nSetup steps:');
    console.error('  1. Go to https://console.cloud.google.com/apis/credentials');
    console.error('  2. Create OAuth 2.0 Client ID (Desktop app type)');
    console.error('  3. Download JSON and save to scripts/.credentials/google-oauth.json');
    console.error('  4. Enable Calendar API and Drive API in your project');
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(OAUTH_CREDS_PATH, 'utf-8'));
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web;

  const oauth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333/callback');

  // Try saved token
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
    oauth2.setCredentials(token);

    // Refresh if expired
    if (token.expiry_date && token.expiry_date < Date.now()) {
      try {
        const { credentials } = await oauth2.refreshAccessToken();
        oauth2.setCredentials(credentials);
        writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
      } catch {
        console.log('⚠️  Token expired and refresh failed. Re-authenticating...');
        return getNewToken(oauth2);
      }
    }
    return oauth2;
  }

  return getNewToken(oauth2);
}

async function getNewToken(oauth2) {
  const authUrl = oauth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES });

  console.log('\n🔐 Authorize this app by visiting:\n');
  console.log(`  ${authUrl}\n`);

  // Start local callback server
  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:3333');
      const code = url.searchParams.get('code');
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authorization successful!</h1><p>You can close this tab and return to the terminal.</p>');
        server.close();
        resolve(code);
      } else {
        res.writeHead(400);
        res.end('No code received');
      }
    });
    server.listen(3333, () => {
      console.log('  Waiting for authorization callback on http://localhost:3333/callback ...\n');
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('  Port 3333 in use. Enter the authorization code manually:');
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        rl.question('  Code: ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      } else {
        reject(err);
      }
    });
  });

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  if (!existsSync(CREDENTIALS_DIR)) mkdirSync(CREDENTIALS_DIR, { recursive: true });
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('✅ Token saved.\n');

  return oauth2;
}

// ---------------------------------------------------------------------------
// Google Calendar + Drive
// ---------------------------------------------------------------------------

async function fetchEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  console.log(`📅 Fetching events since ${SINCE} for ${CALENDAR_EMAIL}...\n`);

  const events = [];
  let pageToken;

  do {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(SINCE).toISOString(),
      timeMax: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      pageToken,
    });

    for (const event of res.data.items || []) {
      // Only include events with attachments (photos)
      if (event.attachments && event.attachments.length > 0) {
        events.push(event);
      }
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`  Found ${events.length} events with attachments\n`);
  return events.slice(0, LIMIT);
}

async function downloadPhoto(auth, fileId, outputPath) {
  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(res.data);
    if (!DRY_RUN) {
      writeFileSync(outputPath, buffer);
    }
    return true;
  } catch (err) {
    console.warn(`  ⚠️  Could not download file ${fileId}: ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Location parsing
// ---------------------------------------------------------------------------

function parseLocation(locationStr) {
  if (!locationStr) return { city: null, state: null };

  const lower = locationStr.toLowerCase();

  // Detect state
  let state = null;
  for (const { abbr, patterns } of STATE_PATTERNS) {
    for (const pat of patterns) {
      if (lower.includes(pat)) {
        state = abbr;
        break;
      }
    }
    if (state) break;
  }

  // Extract city — try common formats:
  // "123 Main St, Springfield, MA 01103"
  // "Springfield, MA"
  // "Springfield MA"
  const parts = locationStr.split(',').map(s => s.trim());

  let city = null;
  if (parts.length >= 2) {
    // City is usually the second-to-last part before state
    // "123 Main St, Springfield, MA 01103" → Springfield
    const candidateIdx = parts.length >= 3 ? 1 : 0;
    city = parts[candidateIdx]
      .replace(/^\d+\s+/, '') // Remove leading street numbers
      .replace(/\s+(ct|ma|ri|nh|me|connecticut|massachusetts|rhode island|new hampshire|maine)\b.*/i, '')
      .trim();
  } else if (parts.length === 1) {
    // "Springfield MA"
    city = locationStr
      .replace(/\d+/g, '')
      .replace(/\b(ct|ma|ri|nh|me|connecticut|massachusetts|rhode island|new hampshire|maine)\b/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Title case
  if (city) {
    city = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  return { city, state };
}

// ---------------------------------------------------------------------------
// Service type detection
// ---------------------------------------------------------------------------

function detectServiceType(text) {
  const lower = (text || '').toLowerCase();

  for (const { type, keywords } of SERVICE_PATTERNS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return type;
    }
  }

  // Default to crack-injection (most common service)
  return 'crack-injection';
}

// ---------------------------------------------------------------------------
// Claude AI enrichment
// ---------------------------------------------------------------------------

async function generateSummary(eventDescription, beforeImagePath, afterImagePath) {
  const client = new Anthropic();

  const content = [];

  // Add text context
  content.push({
    type: 'text',
    text: `You are writing a brief case study summary for a foundation repair company's website. Based on the job description and photos below, write a concise 1-2 sentence summary (max 280 characters) describing the problem and the repair. Focus on results: what was wrong, what was done, and the outcome. Do not mention the customer by name. Write in third person past tense.

Job description: ${eventDescription || 'Foundation repair job (no description provided)'}

Return ONLY the summary text, no quotes or formatting.`,
  });

  // Add before photo if available
  if (beforeImagePath && existsSync(beforeImagePath)) {
    try {
      const imageData = readFileSync(beforeImagePath);
      const base64 = imageData.toString('base64');
      const ext = beforeImagePath.split('.').pop().toLowerCase();
      const mediaType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      });
    } catch { /* skip if image can't be read */ }
  }

  // Add after photo if available
  if (afterImagePath && existsSync(afterImagePath)) {
    try {
      const imageData = readFileSync(afterImagePath);
      const base64 = imageData.toString('base64');
      const ext = afterImagePath.split('.').pop().toLowerCase();
      const mediaType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      });
    } catch { /* skip if image can't be read */ }
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content }],
    });

    let summary = response.content[0].text.trim();

    // Enforce 280 char limit
    if (summary.length > 280) {
      summary = summary.substring(0, 277) + '...';
    }

    return summary;
  } catch (err) {
    console.warn(`  ⚠️  Claude API error: ${err.message}`);
    return eventDescription
      ? eventDescription.substring(0, 280)
      : 'Foundation repair completed with lifetime guarantee.';
  }
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

function generateSlug(city, serviceType, date) {
  const citySlug = (city || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const dateStr = date.toISOString().slice(0, 7); // YYYY-MM
  const serviceShort = serviceType.replace(/-/g, '-');

  return `${citySlug}-${serviceShort}-${dateStr}`;
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

function generateMarkdown(data) {
  const { title, date, city, state, coordinates, serviceType, beforeImage, afterImage, summary, technicianNote, body } = data;

  const lines = [
    '---',
    `title: "${title}"`,
    `date: ${date.toISOString().slice(0, 10)}`,
    `city: ${city}`,
    `state: ${state}`,
  ];

  if (coordinates) {
    lines.push('coordinates:');
    lines.push(`  lat: ${coordinates.lat}`);
    lines.push(`  lng: ${coordinates.lng}`);
  }

  lines.push(`serviceType: ${serviceType}`);
  lines.push(`beforeImage: ${beforeImage}`);
  lines.push(`afterImage: ${afterImage}`);
  lines.push(`summary: "${summary.replace(/"/g, '\\"')}"`);

  if (technicianNote) {
    lines.push(`technicianNote: "${technicianNote.replace(/"/g, '\\"')}"`);
  }

  lines.push('published: false');
  lines.push('---');
  lines.push('');
  lines.push(body || summary);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Coordinate lookup (simple geocoding fallback)
// ---------------------------------------------------------------------------

const CITY_COORDS = {
  // Pre-populated for our service area — add more as needed
  // CT
  'Hartford': { lat: 41.7658, lng: -72.6734 },
  'Bridgeport': { lat: 41.1865, lng: -73.1952 },
  'New Haven': { lat: 41.3083, lng: -72.9279 },
  'Stamford': { lat: 41.0534, lng: -73.5387 },
  'Waterbury': { lat: 41.5582, lng: -73.0515 },
  'Danbury': { lat: 41.3948, lng: -73.4540 },
  'Manchester': { lat: 41.7759, lng: -72.5215 },
  'West Hartford': { lat: 41.7620, lng: -72.7420 },
  'Greenwich': { lat: 41.0263, lng: -73.6282 },
  'Norwalk': { lat: 41.1177, lng: -73.4082 },
  // MA
  'Boston': { lat: 42.3601, lng: -71.0589 },
  'Worcester': { lat: 42.2626, lng: -71.8023 },
  'Cambridge': { lat: 42.3736, lng: -71.1097 },
  'Quincy': { lat: 42.2529, lng: -71.0023 },
  'Newton': { lat: 42.3370, lng: -71.2092 },
  'Framingham': { lat: 42.2793, lng: -71.4162 },
  'Brockton': { lat: 42.0834, lng: -71.0184 },
  'Plymouth': { lat: 41.9584, lng: -70.6673 },
  'Fall River': { lat: 41.7015, lng: -71.1550 },
  'New Bedford': { lat: 41.6362, lng: -70.9342 },
  // RI
  'Providence': { lat: 41.8240, lng: -71.4128 },
  'Cranston': { lat: 41.7798, lng: -71.4373 },
  'Warwick': { lat: 41.7001, lng: -71.4162 },
  'Pawtucket': { lat: 41.8787, lng: -71.3826 },
  // NH
  'Nashua': { lat: 42.7654, lng: -71.4676 },
  'Manchester': { lat: 42.9956, lng: -71.4548 },
  'Portsmouth': { lat: 43.0718, lng: -70.7626 },
  'Dover': { lat: 43.1979, lng: -70.8737 },
  // ME
  'Portland': { lat: 43.6591, lng: -70.2568 },
  'South Portland': { lat: 43.6415, lng: -70.2409 },
  'Biddeford': { lat: 43.4926, lng: -70.4534 },
  'Scarborough': { lat: 43.5781, lng: -70.3217 },
};

function lookupCoordinates(city) {
  return CITY_COORDS[city] || null;
}

// ---------------------------------------------------------------------------
// Service type labels for titles
// ---------------------------------------------------------------------------

const SERVICE_LABELS = {
  'crack-injection': 'Foundation Crack Injection',
  'wall-crack-repair': 'Wall Crack Repair',
  'bulkhead-repair': 'Bulkhead Repair',
  'carbon-fiber': 'Carbon Fiber Reinforcement',
  'sewer-conduit': 'Sewer & Conduit Repair',
  'concrete-repair': 'Concrete Repair',
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔧 Attack A Crack — Calendar Project Importer\n');

  if (DRY_RUN) {
    console.log('  ℹ️  DRY RUN — no files will be written\n');
  }

  // Authorize
  const auth = await authorize();

  // Fetch events
  const events = await fetchEvents(auth);

  if (events.length === 0) {
    console.log('  No events with attachments found. Nothing to import.');
    return;
  }

  // Ensure output directories exist
  if (!DRY_RUN) {
    if (!existsSync(PROJECTS_DIR)) mkdirSync(PROJECTS_DIR, { recursive: true });
    if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
  }

  let imported = 0;
  let skipped = 0;

  for (const event of events) {
    const eventDate = new Date(event.start?.dateTime || event.start?.date);
    const description = event.description || '';
    const locationStr = event.location || '';

    // Parse location
    const { city, state } = parseLocation(locationStr);
    if (!city || !state) {
      console.log(`  ⏭️  Skipping "${event.summary}" — could not parse city/state from: "${locationStr}"`);
      skipped++;
      continue;
    }

    // Detect service type
    const serviceType = detectServiceType(description + ' ' + (event.summary || ''));

    // Generate slug
    const slug = generateSlug(city, serviceType, eventDate);

    // Check if already imported
    const mdPath = join(PROJECTS_DIR, `${slug}.md`);
    if (existsSync(mdPath)) {
      console.log(`  ⏭️  Already exists: ${slug}`);
      skipped++;
      continue;
    }

    console.log(`  📋 Processing: ${event.summary || 'Unnamed event'}`);
    console.log(`     City: ${city}, ${state} | Service: ${serviceType} | Date: ${eventDate.toISOString().slice(0, 10)}`);

    // Download photos
    const attachments = event.attachments || [];
    let beforeImage = `/images/projects/${slug}-before.jpg`;
    let afterImage = `/images/projects/${slug}-after.jpg`;
    let beforePath = join(IMAGES_DIR, `${slug}-before.jpg`);
    let afterPath = join(IMAGES_DIR, `${slug}-after.jpg`);

    if (attachments.length >= 2) {
      // First attachment = before, second = after
      const beforeOk = await downloadPhoto(auth, attachments[0].fileId, beforePath);
      const afterOk = await downloadPhoto(auth, attachments[1].fileId, afterPath);

      if (!beforeOk || !afterOk) {
        console.log('     ⚠️  Could not download all photos — using placeholders');
      }
    } else if (attachments.length === 1) {
      // Single photo — treat as after
      const ok = await downloadPhoto(auth, attachments[0].fileId, afterPath);
      beforeImage = afterImage; // Use same image for both
      if (!ok) {
        console.log('     ⚠️  Could not download photo — using placeholder');
      }
    }

    // AI enrichment
    console.log('     🤖 Generating summary with Claude...');
    const summary = DRY_RUN
      ? `[DRY RUN] Summary for ${city} ${serviceType}`
      : await generateSummary(description, beforePath, afterPath);

    // Look up coordinates
    const coordinates = lookupCoordinates(city);

    // Generate title
    const title = `${SERVICE_LABELS[serviceType] || 'Foundation Repair'} in ${city}, ${state}`;

    // Generate expanded body from AI
    const body = summary; // In production, could ask Claude for a longer paragraph

    // Build markdown
    const markdown = generateMarkdown({
      title,
      date: eventDate,
      city,
      state,
      coordinates,
      serviceType,
      beforeImage,
      afterImage,
      summary,
      technicianNote: description || null,
      body,
    });

    if (DRY_RUN) {
      console.log(`     📄 Would write: ${mdPath}`);
      console.log(`     📸 Would save:  ${beforePath}`);
      console.log(`     📸 Would save:  ${afterPath}`);
    } else {
      writeFileSync(mdPath, markdown);
      console.log(`     ✅ Written: ${slug}.md`);
    }

    imported++;
    console.log();
  }

  // Summary
  console.log('-----------------------------------');
  console.log('  Import Summary');
  console.log('-----------------------------------');
  console.log(`  Events processed: ${events.length}`);
  console.log(`  Projects imported: ${imported}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('-----------------------------------\n');

  if (imported > 0 && !DRY_RUN) {
    console.log('📝 Next steps:');
    console.log('  1. Review generated .md files in src/content/projects/');
    console.log('  2. Set published: true on projects you want to go live');
    console.log('  3. Run npm run validate to check everything passes');
    console.log('  4. Commit and push\n');
  }
}

main().catch(err => {
  console.error('❌ Import failed:', err.message);
  process.exit(1);
});
