/**
 * Shared core module for Google Calendar → Project Case Study imports.
 *
 * Used by both the CLI one-time import and the automated cron import.
 *
 * Exports:
 *   - authorize(options)        — Google OAuth2 or service account auth
 *   - fetchJobEvents(auth, options) — Fetch + filter calendar events
 *   - filterMikePhotos(auth, attachments) — Drive API owner filter
 *   - classifyPhotos(imagePaths) — Gemini AI before/after classification
 *   - downloadPhoto(auth, fileId, outputPath) — Download from Drive
 *   - parseLocation(str)        — Address → city/state
 *   - detectServiceType(text)   — Keywords → service type slug
 *   - generateContent(data)     — Gemini AI summary + description
 *   - generateMarkdown(data)    — Build frontmatter + body
 *   - lookupCoordinates(city)   — City → lat/lng
 *   - loadManifest()            — Read dedup manifest
 *   - saveManifest(manifest)    — Write dedup manifest
 *   - generateSlug(city, serviceType, date) — Slug generation
 */

import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { createServer } from 'http';
import { createInterface } from 'readline';

// ---------------------------------------------------------------------------
// Gemini client
// ---------------------------------------------------------------------------

const GEMINI_KEY_PATH = join(resolve('scripts/.credentials'), 'gemini-api-key');

function getGeminiClient() {
  // Check env vars first (CI), then local credentials file
  let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey && existsSync(GEMINI_KEY_PATH)) {
    apiKey = readFileSync(GEMINI_KEY_PATH, 'utf-8').trim();
  }
  if (!apiKey) {
    console.error('❌ No Gemini API key found. Set GEMINI_API_KEY env var or save key to scripts/.credentials/gemini-api-key');
    process.exit(1);
  }
  return new GoogleGenerativeAI(apiKey);
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const CREDENTIALS_DIR = resolve('scripts/.credentials');
export const OAUTH_CREDS_PATH = join(CREDENTIALS_DIR, 'google-oauth.json');
export const TOKEN_PATH = join(CREDENTIALS_DIR, 'google-token.json');
export const PROJECTS_DIR = resolve('src/content/projects');
export const IMAGES_DIR = resolve('public/images/projects');
export const MANIFEST_PATH = resolve('data/import-manifest.json');

export const CALENDAR_EMAIL = 'matt@attackacrack.com';
export const DEFAULT_SINCE = '2025-01-01';

/** Mike's two email addresses — check both for attendee matching and photo ownership */
export const MIKE_EMAILS = [
  'harrringtonm@gmail.com',
  'mike@attackacrack.com',
];

/** Minimum event duration in minutes to qualify as a real repair job */
export const MIN_DURATION_MINUTES = 120;

/** Event title keywords that disqualify an event (case-insensitive) */
export const EXCLUDE_KEYWORDS = [
  'callback', 'call back', 'call-back',
  'lunch', 'dinner', 'breakfast', 'coffee',
  'meeting', 'office', 'staff',
  'estimate only', 'consultation only',
];

/**
 * Google Calendar color IDs (from calendar.colors.get())
 *  10 (#51b749) = Green = Job (include)
 *   5 (#fbd75b) = Yellow = Callback (exclude)
 *   3 (#dbadff) = Purple = On-site investigation (exclude)
 *
 * Only green events are real repair jobs.
 * Events with no colorId (default calendar color) are included by default.
 */
export const JOB_COLOR_ID = '10';
export const EXCLUDE_COLOR_IDS = ['5', '3'];

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

export const SERVICE_LABELS = {
  'crack-injection': 'Foundation Crack Injection',
  'wall-crack-repair': 'Wall Crack Repair',
  'bulkhead-repair': 'Bulkhead Repair',
  'carbon-fiber': 'Carbon Fiber Reinforcement',
  'sewer-conduit': 'Sewer & Conduit Repair',
  'concrete-repair': 'Concrete Repair',
  'garage-floor': 'Garage Floor Repair',
  'driveway': 'Driveway Repair',
  'patio': 'Patio Repair',
  'pool-deck': 'Pool Deck Repair',
  'stairway': 'Stairway Repair',
  'walkway': 'Walkway Repair',
  'floor-crack': 'Floor Crack Repair',
};

export const VALID_SERVICE_TYPES = Object.keys(SERVICE_LABELS);

const STATE_PATTERNS = [
  { abbr: 'CT', patterns: ['ct', 'connecticut'] },
  { abbr: 'MA', patterns: ['ma', 'massachusetts'] },
  { abbr: 'RI', patterns: ['ri', 'rhode island'] },
  { abbr: 'NH', patterns: ['nh', 'new hampshire'] },
  { abbr: 'ME', patterns: ['me', 'maine'] },
];

export const CITY_COORDS = {
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
  'Concord': { lat: 43.2081, lng: -71.5376 },
  'Portsmouth': { lat: 43.0718, lng: -70.7626 },
  'Dover': { lat: 43.1979, lng: -70.8737 },
  // ME
  'Portland': { lat: 43.6591, lng: -70.2568 },
  'South Portland': { lat: 43.6415, lng: -70.2409 },
  'Biddeford': { lat: 43.4926, lng: -70.4534 },
  'Scarborough': { lat: 43.5781, lng: -70.3217 },
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Authorize with Google APIs.
 * @param {object} options
 * @param {string} [options.serviceAccountKey] - JSON string of service account key (for CI)
 * @returns {Promise<import('googleapis').Common.OAuth2Client>}
 */
export async function authorize({ serviceAccountKey } = {}) {
  // CI mode: service account
  if (serviceAccountKey) {
    const key = typeof serviceAccountKey === 'string'
      ? JSON.parse(serviceAccountKey)
      : serviceAccountKey;

    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: SCOPES,
    });
    return auth.getClient();
  }

  // Local mode: OAuth2
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
  const { client_id, client_secret } = creds.installed || creds.web;
  const oauth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333/callback');

  // Try saved token
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
    oauth2.setCredentials(token);

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

  // Auto-open browser on macOS
  try {
    const { exec } = await import('child_process');
    exec(`open "${authUrl}"`);
  } catch { /* manual fallback above */ }

  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost:3333');
      const authCode = url.searchParams.get('code');
      if (authCode) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authorization successful!</h1><p>You can close this tab and return to the terminal.</p>');
        server.close();
        resolve(authCode);
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
// Calendar events
// ---------------------------------------------------------------------------

/**
 * Fetch job events from Google Calendar, filtered by:
 *  1. Event is completed (end time in past)
 *  2. Mike is an attendee (either email)
 *  3. Has a location
 *  4. Has attachments
 *  5. Duration >= 2 hours (repairs are always 2+ hours)
 *  6. No excluded keywords in title (callback, lunch, etc.)
 *  7. Event color is green (colorId 10) or default — not yellow (callback) or purple (investigation)
 *
 * @param {object} auth - Google auth client
 * @param {object} options
 * @param {string} [options.since] - ISO date string (default: 2025-01-01)
 * @param {number} [options.limit] - Max events to return
 * @returns {Promise<Array>} Filtered calendar events
 */
export async function fetchJobEvents(auth, { since = DEFAULT_SINCE, limit = Infinity } = {}) {
  const calendar = google.calendar({ version: 'v3', auth });

  console.log(`📅 Fetching events since ${since} for ${CALENDAR_EMAIL}...\n`);

  const events = [];
  let pageToken;
  const skippedReasons = { duration: 0, keyword: 0, color: 0, noMike: 0, noLocation: 0, noAttachments: 0, future: 0 };

  do {
    const res = await calendar.events.list({
      calendarId: CALENDAR_EMAIL,
      timeMin: new Date(since).toISOString(),
      timeMax: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      pageToken,
    });

    for (const event of res.data.items || []) {
      // Must be completed (end time in the past)
      const endTime = new Date(event.end?.dateTime || event.end?.date);
      if (endTime > new Date()) { skippedReasons.future++; continue; }

      // Must have Mike as attendee
      const attendees = event.attendees || [];
      const hasMike = attendees.some(a =>
        MIKE_EMAILS.includes(a.email?.toLowerCase())
      );
      if (!hasMike) { skippedReasons.noMike++; continue; }

      // Must have a location
      if (!event.location?.trim()) { skippedReasons.noLocation++; continue; }

      // Must have attachments (photos)
      if (!event.attachments || event.attachments.length === 0) { skippedReasons.noAttachments++; continue; }

      // Minimum duration: 2 hours (repairs are always 2+ hours)
      const startTime = new Date(event.start?.dateTime || event.start?.date);
      const durationMinutes = (endTime - startTime) / (1000 * 60);
      if (durationMinutes < MIN_DURATION_MINUTES) {
        skippedReasons.duration++;
        continue;
      }

      // Exclude keywords in title (callbacks, lunch, meetings, etc.)
      const titleLower = (event.summary || '').toLowerCase();
      const hasExcluded = EXCLUDE_KEYWORDS.some(kw => titleLower.includes(kw));
      if (hasExcluded) {
        skippedReasons.keyword++;
        continue;
      }

      // Color filter: yellow (5) = callback, purple (3) = investigation — skip both
      // Green (10) or no color (default) = real job
      if (event.colorId && EXCLUDE_COLOR_IDS.includes(event.colorId)) {
        skippedReasons.color++;
        continue;
      }

      events.push(event);
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  console.log(`  Found ${events.length} qualifying job events`);
  console.log(`  Skipped: ${skippedReasons.duration} too short, ${skippedReasons.keyword} excluded keyword, ${skippedReasons.color} wrong color, ${skippedReasons.noAttachments} no attachments, ${skippedReasons.noLocation} no location, ${skippedReasons.noMike} no Mike\n`);
  return events.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Drive photo filtering
// ---------------------------------------------------------------------------

/**
 * Get all image attachments from a calendar event via Drive API.
 *
 * Note: Google Calendar copies attachments under the calendar owner's account,
 * so Drive file ownership does NOT reflect who uploaded the photo. We include
 * all image attachments and let Gemini classify before/after from content.
 *
 * @param {object} auth - Google auth client
 * @param {Array} attachments - Calendar event attachments
 * @returns {Promise<Array>} Image attachments with metadata
 */
export async function filterMikePhotos(auth, attachments) {
  const drive = google.drive({ version: 'v3', auth });
  const photos = [];

  for (const att of attachments) {
    if (!att.fileId) continue;

    try {
      const file = await drive.files.get({
        fileId: att.fileId,
        fields: 'name,mimeType,createdTime',
      });

      if (file.data.mimeType?.startsWith('image/')) {
        photos.push({
          ...att,
          name: file.data.name,
          mimeType: file.data.mimeType,
          createdTime: file.data.createdTime,
        });
      }
    } catch (err) {
      console.warn(`  ⚠️  Could not check file ${att.fileId}: ${err.message}`);
    }
  }

  // Sort by creation time
  photos.sort((a, b) =>
    new Date(a.createdTime || 0) - new Date(b.createdTime || 0)
  );

  return photos;
}

// ---------------------------------------------------------------------------
// Photo download
// ---------------------------------------------------------------------------

/**
 * Download a file from Google Drive.
 * @param {object} auth - Google auth client
 * @param {string} fileId - Drive file ID
 * @param {string} outputPath - Local path to save to
 * @returns {Promise<boolean>} Success
 */
export async function downloadPhoto(auth, fileId, outputPath) {
  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(res.data);
    writeFileSync(outputPath, buffer);
    return true;
  } catch (err) {
    console.warn(`  ⚠️  Could not download file ${fileId}: ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Gemini AI: classify before/after photos
// ---------------------------------------------------------------------------

/**
 * Use Gemini to classify photos as "before" or "after" repair.
 * Looks for: injection ports, sealed cracks, clean surfaces = after.
 * Active leaks, stains, open cracks = before.
 *
 * @param {string[]} imagePaths - Local file paths to images
 * @returns {Promise<{before: string|null, after: string|null}>} Paths classified
 */
export async function classifyPhotos(imagePaths) {
  if (imagePaths.length === 0) return { before: null, after: null };
  if (imagePaths.length === 1) return { before: null, after: imagePaths[0] };

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const parts = [];

  parts.push({
    text: `You are looking at ${imagePaths.length} photos from a foundation repair job. Classify each as "before" or "after" repair.

Look for these clues:
- BEFORE: active leaks, water stains, open/visible cracks, efflorescence, wet surfaces, deterioration
- AFTER: injection ports (small plastic caps), sealed/filled cracks, clean surfaces, fresh sealant, repair materials visible

Respond with ONLY a JSON array of objects: [{"index": 0, "classification": "before"}, {"index": 1, "classification": "after"}]
Use 0-based indexing matching the photo order.`,
  });

  for (const imgPath of imagePaths) {
    if (!existsSync(imgPath)) continue;
    try {
      const imageData = readFileSync(imgPath);
      const base64 = imageData.toString('base64');
      const ext = imgPath.split('.').pop().toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      parts.push({
        inlineData: { data: base64, mimeType },
      });
    } catch { /* skip unreadable images */ }
  }

  try {
    const result = await model.generateContent(parts);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { before: imagePaths[0], after: imagePaths[imagePaths.length - 1] };
    }

    const classifications = JSON.parse(jsonMatch[0]);
    let before = null;
    let after = null;

    for (const c of classifications) {
      if (c.classification === 'before' && !before) before = imagePaths[c.index];
      if (c.classification === 'after' && !after) after = imagePaths[c.index];
    }

    if (!after && imagePaths.length > 0) after = imagePaths[imagePaths.length - 1];
    if (!before && imagePaths.length > 1) before = imagePaths[0];

    return { before, after };
  } catch (err) {
    console.warn(`  ⚠️  Photo classification failed: ${err.message}`);
    return { before: imagePaths[0], after: imagePaths[imagePaths.length - 1] };
  }
}

// ---------------------------------------------------------------------------
// Location parsing
// ---------------------------------------------------------------------------

/**
 * Parse a location string into city + state using Gemini AI.
 * Handles any address format: "123 Main St, Springfield, MA 01103",
 * "Pokanoket Lane Marshfield MA", "23-25 Maple St, Auburndale MA 02466", etc.
 *
 * Falls back to regex parsing if AI is unavailable.
 */
export async function parseLocation(locationStr) {
  if (!locationStr) return { city: null, state: null };

  // Try AI parsing first (handles all formats reliably)
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(`Extract the city name and US state abbreviation from this address. This is in New England (CT, MA, RI, NH, or ME).

Address: "${locationStr}"

Respond with ONLY JSON, no markdown: {"city": "CityName", "state": "XX"}
If you cannot determine the city, use null. If you cannot determine the state, use null.
The city should be the actual municipality/town name, not a street name or neighborhood.`);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.city && parsed.state) {
        return { city: parsed.city, state: parsed.state };
      }
    }
  } catch {
    // Fall through to regex parser
  }

  // Fallback: regex-based parsing
  return parseLocationRegex(locationStr);
}

/** Regex fallback for location parsing (used when AI is unavailable) */
function parseLocationRegex(locationStr) {
  const lower = locationStr.toLowerCase();

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

  const parts = locationStr.split(',').map(s => s.trim());

  let city = null;
  if (parts.length >= 2) {
    const candidateIdx = parts.length >= 3 ? 1 : 0;
    city = parts[candidateIdx]
      .replace(/^\d+\s+/, '')
      .replace(/\s+(ct|ma|ri|nh|me|connecticut|massachusetts|rhode island|new hampshire|maine)\b.*/i, '')
      .trim();
  } else if (parts.length === 1) {
    city = locationStr
      .replace(/\d+/g, '')
      .replace(/\b(ct|ma|ri|nh|me|connecticut|massachusetts|rhode island|new hampshire|maine)\b/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (city) {
    city = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  return { city, state };
}

// ---------------------------------------------------------------------------
// Service type detection
// ---------------------------------------------------------------------------

/**
 * Use Gemini to classify the service type(s) from event description.
 * Returns an array of service type slugs (primary first).
 *
 * @param {string} text - Event description + title
 * @returns {Promise<string[]>} Service type slugs
 */
export async function detectServiceTypes(text) {
  const typeDescriptions = {
    'crack-injection': 'Injection into poured concrete foundation WALL cracks ONLY. Never use for floor cracks or garage floors.',
    'wall-crack-repair': 'Fixing cracks in block, stone, brick, or cinder block walls (NOT poured concrete)',
    'bulkhead-repair': 'Bulkhead/Bilco/hatchway basement entry repair',
    'carbon-fiber': 'Carbon fiber strip reinforcement for bowing/failing walls',
    'sewer-conduit': 'Sewer, conduit, pipe, or utility line repair through foundation',
    'concrete-repair': 'General concrete repair (use only when no specific subtype fits)',
    'garage-floor': 'Garage floor resurfacing, repair, coating, or any garage floor work. NOT crack-injection.',
    'floor-crack': 'Floor cracks, basement floor cracks, slab cracks. Repaired with epoxy or rubber seal, NOT injection. This is a separate service from crack-injection.',
    'driveway': 'Driveway concrete repair or resurfacing',
    'patio': 'Patio concrete repair or resurfacing',
    'pool-deck': 'Pool deck concrete repair or resurfacing',
    'stairway': 'Concrete step/stair repair or resurfacing',
    'walkway': 'Walkway/sidewalk concrete repair or resurfacing',
  };

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const typeList = Object.entries(typeDescriptions)
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join('\n');

    const result = await model.generateContent(
      `Classify this foundation/concrete repair job. Pick ALL service types that apply:\n\n${typeList}\n\nJob description: "${text}"\n\nRules:\n- "crack-injection" is ONLY for poured concrete foundation WALL cracks. NEVER for floors or garage floors.\n- Floor cracks and slab cracks = "floor-crack" (repaired with epoxy or rubber seal, not injection)\n- Garage floor work (resurfacing, repair, coating, cracks) = "garage-floor", NOT "crack-injection"\n- Only "wall-crack-repair" for block/stone/brick walls\n- Include specific concrete subtypes (garage-floor, driveway, stairway, etc.) when mentioned\n- List PRIMARY service first\n\nRespond with ONLY a JSON array: ["type1", "type2"]`
    );

    const responseText = result.response.text().trim();
    const match = responseText.match(/\[[\s\S]*\]/);
    if (match) {
      const types = JSON.parse(match[0]).filter(t => VALID_SERVICE_TYPES.includes(t));
      if (types.length > 0) return types;
    }
  } catch {
    // Fall through to default
  }

  return ['crack-injection'];
}

// ---------------------------------------------------------------------------
// Gemini AI: generate summary + description
// ---------------------------------------------------------------------------

/**
 * Generate a 280-char summary AND a 2-3 sentence case study description.
 *
 * @param {object} data
 * @param {string} data.eventDescription - Calendar event description
 * @param {string} data.city - City name
 * @param {string} data.state - State abbreviation
 * @param {string} data.serviceType - Service type slug
 * @param {string|null} data.beforeImagePath - Path to before photo
 * @param {string|null} data.afterImagePath - Path to after photo
 * @returns {Promise<{summary: string, description: string}>}
 */
export async function generateContent(data) {
  const { eventDescription, city, state, serviceType, beforeImagePath, afterImagePath } = data;
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const serviceLabel = SERVICE_LABELS[serviceType] || 'Foundation Repair';

  const parts = [];

  parts.push({
    text: `You are writing content for a foundation repair company's project portfolio page.

Job details:
- Service: ${serviceLabel}
- Location: ${city}, ${state}
- Description: ${eventDescription || 'No description provided'}

Write TWO things:
1. SUMMARY: A concise 1-2 sentence summary (max 280 characters). Describe the problem and repair outcome.
2. DESCRIPTION: A 2-3 sentence case study paragraph (60-150 words). Describe what was wrong, what was done, and the result. Write in third person past tense. Do not mention customer names.

Format your response EXACTLY as:
SUMMARY: <your summary>
DESCRIPTION: <your description>`,
  });

  // Attach photos if available
  for (const imgPath of [beforeImagePath, afterImagePath]) {
    if (imgPath && existsSync(imgPath)) {
      try {
        const imageData = readFileSync(imgPath);
        const base64 = imageData.toString('base64');
        const ext = imgPath.split('.').pop().toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        parts.push({
          inlineData: { data: base64, mimeType },
        });
      } catch { /* skip */ }
    }
  }

  try {
    const result = await model.generateContent(parts);
    const text = result.response.text().trim();

    const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?:\n|$)/);
    const descMatch = text.match(/DESCRIPTION:\s*([\s\S]+)/);

    let summary = summaryMatch ? summaryMatch[1].trim() : '';
    let description = descMatch ? descMatch[1].trim() : '';

    if (summary.length > 280) {
      summary = summary.substring(0, 277) + '...';
    }

    if (!summary) {
      summary = eventDescription
        ? eventDescription.substring(0, 280)
        : `${serviceLabel} completed in ${city}, ${state} with lifetime guarantee.`;
    }
    if (!description) {
      description = summary;
    }

    return { summary, description };
  } catch (err) {
    console.warn(`  ⚠️  Gemini API error: ${err.message}`);
    const fallback = eventDescription
      ? eventDescription.substring(0, 280)
      : `${serviceLabel} completed in ${city}, ${state} with lifetime guarantee.`;
    return { summary: fallback, description: fallback };
  }
}

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

export function generateSlug(city, serviceType, date) {
  const citySlug = (city || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const dateStr = date.toISOString().slice(0, 7); // YYYY-MM

  return `${citySlug}-${serviceType}-${dateStr}`;
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

export function generateMarkdown(data) {
  const {
    title, date, city, state, coordinates, serviceTypes,
    beforeImage, afterImage, summary, body,
    published = false,
  } = data;

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

  lines.push('serviceTypes:');
  for (const st of serviceTypes) {
    lines.push(`  - ${st}`);
  }
  lines.push(`beforeImage: ${beforeImage}`);
  lines.push(`afterImage: ${afterImage}`);
  lines.push(`summary: "${summary.replace(/"/g, '\\"')}"`);
  lines.push(`published: ${published}`);
  lines.push('---');
  lines.push('');
  lines.push(body || summary);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Coordinate lookup
// ---------------------------------------------------------------------------

export function lookupCoordinates(city) {
  return CITY_COORDS[city] || null;
}

// ---------------------------------------------------------------------------
// Dedup manifest
// ---------------------------------------------------------------------------

/**
 * Load the import manifest (dedup tracker).
 * @returns {{ lastCheck: string|null, imported: Record<string, {slug: string, importedAt: string, publishedToGBP: boolean}> }}
 */
export function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return { lastCheck: null, imported: {} };
  }
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    return { lastCheck: null, imported: {} };
  }
}

/**
 * Save the import manifest.
 * @param {{ lastCheck: string|null, imported: Record<string, object> }} manifest
 */
export function saveManifest(manifest) {
  const dir = resolve('data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}
