#!/usr/bin/env node

/**
 * Google Business Profile Batch Poster
 *
 * Reads published project case studies and posts them to the appropriate
 * Google Business Profile (CT or MA) with the after photo, summary, and
 * a "Learn More" CTA linking back to the project page.
 *
 * Prerequisites:
 *   1. Google Cloud project with Business Profile API enabled
 *   2. OAuth2 credentials saved to scripts/.credentials/google-oauth.json
 *   3. CT and MA GBP account/location IDs configured below
 *   4. npm install googleapis (devDependency)
 *
 * Usage:
 *   node scripts/batch-post-gbp.js              # Post all unposted projects
 *   node scripts/batch-post-gbp.js --dry-run    # Preview without posting
 *   node scripts/batch-post-gbp.js --limit 3    # Post max N projects
 *   node scripts/batch-post-gbp.js --force      # Re-post already-posted projects
 *
 * Tracking: Posted slugs are stored in scripts/.credentials/gbp-posted.json
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

// ---------------------------------------------------------------------------
// Config — Matt needs to fill in these IDs
// ---------------------------------------------------------------------------

const GBP_CONFIG = {
  // Get these from Google Business Profile Manager or API
  // Format: accounts/{accountId}/locations/{locationId}
  CT: {
    account: 'accounts/XXXXXXXXXX',    // TODO: Matt's CT GBP account ID
    location: 'locations/XXXXXXXXXX',  // TODO: Matt's CT GBP location ID
  },
  MA: {
    account: 'accounts/XXXXXXXXXX',    // TODO: Matt's MA GBP account ID
    location: 'locations/XXXXXXXXXX',  // TODO: Matt's MA GBP location ID
  },
};

// States routed to each GBP location
const STATE_ROUTING = {
  CT: 'CT', RI: 'CT',           // CT office handles CT + RI
  MA: 'MA', NH: 'MA', ME: 'MA', // MA office handles MA + NH + ME
};

const SITE_URL = 'https://www.attackacrack.com';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const CREDENTIALS_DIR = resolve('scripts/.credentials');
const OAUTH_CREDS_PATH = join(CREDENTIALS_DIR, 'google-oauth.json');
const TOKEN_PATH = join(CREDENTIALS_DIR, 'google-token.json');
const POSTED_PATH = join(CREDENTIALS_DIR, 'gbp-posted.json');
const PROJECTS_DIR = resolve('src/content/projects');
const IMAGES_DIR = resolve('public');

const SCOPES = ['https://www.googleapis.com/auth/business.manage'];

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

// ---------------------------------------------------------------------------
// Auth (reuses same OAuth flow as import script)
// ---------------------------------------------------------------------------

async function authorize() {
  if (!existsSync(OAUTH_CREDS_PATH)) {
    console.error(`\n❌ OAuth credentials not found at ${OAUTH_CREDS_PATH}`);
    console.error('  See scripts/import-calendar-projects.js for setup instructions.');
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(OAUTH_CREDS_PATH, 'utf-8'));
  const { client_id, client_secret } = creds.installed || creds.web;
  const oauth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333/callback');

  if (!existsSync(TOKEN_PATH)) {
    console.error('\n❌ No saved token. Run import-calendar-projects.js first to authenticate.');
    process.exit(1);
  }

  const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
  oauth2.setCredentials(token);

  // Refresh if needed
  if (token.expiry_date && token.expiry_date < Date.now()) {
    try {
      const { credentials } = await oauth2.refreshAccessToken();
      oauth2.setCredentials(credentials);
      writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
    } catch (err) {
      console.error('❌ Token refresh failed. Re-run import-calendar-projects.js to re-authenticate.');
      process.exit(1);
    }
  }

  return oauth2;
}

// ---------------------------------------------------------------------------
// Posted tracking
// ---------------------------------------------------------------------------

function getPostedSlugs() {
  if (!existsSync(POSTED_PATH)) return [];
  try {
    return JSON.parse(readFileSync(POSTED_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function markAsPosted(slug) {
  const posted = getPostedSlugs();
  if (!posted.includes(slug)) {
    posted.push(slug);
    if (!existsSync(CREDENTIALS_DIR)) mkdirSync(CREDENTIALS_DIR, { recursive: true });
    writeFileSync(POSTED_PATH, JSON.stringify(posted, null, 2));
  }
}

// ---------------------------------------------------------------------------
// Read project files
// ---------------------------------------------------------------------------

function getPublishedProjects() {
  if (!existsSync(PROJECTS_DIR)) return [];

  const files = readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.md'));
  const projects = [];

  for (const file of files) {
    const content = readFileSync(join(PROJECTS_DIR, file), 'utf-8');

    // Parse frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;

    const frontmatter = match[1];

    // Check published status
    const publishedMatch = frontmatter.match(/^published:\s*(.+)$/m);
    const published = publishedMatch ? publishedMatch[1].trim() === 'true' : true;
    if (!published) continue;

    // Extract fields
    const get = (key) => {
      const m = frontmatter.match(new RegExp(`^${key}:\\s*"?(.+?)"?$`, 'm'));
      return m ? m[1].trim() : null;
    };

    const slug = file.replace('.md', '');

    projects.push({
      slug,
      title: get('title'),
      date: get('date'),
      city: get('city'),
      state: get('state'),
      serviceType: get('serviceType'),
      afterImage: get('afterImage'),
      summary: get('summary'),
    });
  }

  // Sort by date descending
  projects.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return projects;
}

// ---------------------------------------------------------------------------
// GBP posting
// ---------------------------------------------------------------------------

const SERVICE_LABELS = {
  'crack-injection': 'foundation crack injection',
  'wall-crack-repair': 'wall crack repair',
  'bulkhead-repair': 'bulkhead repair',
  'carbon-fiber': 'carbon fiber reinforcement',
  'sewer-conduit': 'sewer & conduit repair',
  'concrete-repair': 'concrete repair',
};

async function postToGBP(auth, project) {
  const gbpLocation = STATE_ROUTING[project.state] || 'MA';
  const config = GBP_CONFIG[gbpLocation];

  if (!config || config.account.includes('XXXX')) {
    console.log(`     ⚠️  GBP ${gbpLocation} location IDs not configured — skipping`);
    return false;
  }

  const serviceLabel = SERVICE_LABELS[project.serviceType] || 'foundation repair';
  const projectUrl = `${SITE_URL}/projects/${project.slug}`;

  // Format post text
  const postText = `Just completed ${serviceLabel} in ${project.city}, ${project.state}. ${project.summary}`;

  // Upload photo first if available
  const imagePath = project.afterImage ? join(IMAGES_DIR, project.afterImage) : null;
  let mediaItem = null;

  if (imagePath && existsSync(imagePath)) {
    try {
      const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth });
      // Note: Photo upload uses the Business Profile API media endpoint
      // The exact API may vary — this is the general pattern
      const imageData = readFileSync(imagePath);

      // Upload via the accounts.locations.media endpoint
      const mediaRes = await google.mybusinessbusinessinformation({
        version: 'v1',
        auth,
      }).accounts.locations.media.create({
        parent: `${config.account}/${config.location}`,
        requestBody: {
          mediaFormat: 'PHOTO',
          locationAssociation: { category: 'ADDITIONAL' },
        },
        media: {
          mimeType: 'image/jpeg',
          body: imageData,
        },
      });

      mediaItem = mediaRes.data;
    } catch (err) {
      console.log(`     ⚠️  Photo upload failed: ${err.message}`);
      // Continue without photo
    }
  }

  // Create the local post
  try {
    // Note: The GBP API for local posts uses the v1 accounts.locations.localPosts endpoint
    // API structure may vary based on Google's current API version
    const response = await google.mybusinessbusinessinformation({
      version: 'v1',
      auth,
    }).accounts.locations.localPosts.create({
      parent: `${config.account}/${config.location}`,
      requestBody: {
        languageCode: 'en-US',
        summary: postText.substring(0, 1500), // GBP post limit
        callToAction: {
          actionType: 'LEARN_MORE',
          url: projectUrl,
        },
        topicType: 'STANDARD',
        ...(mediaItem ? {
          media: [{
            mediaFormat: 'PHOTO',
            sourceUrl: mediaItem.googleUrl || mediaItem.name,
          }],
        } : {}),
      },
    });

    return true;
  } catch (err) {
    console.log(`     ❌ GBP post failed: ${err.message}`);
    return false;
  }
}

// Exponential backoff wrapper
async function postWithBackoff(auth, project, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await postToGBP(auth, project);
    } catch (err) {
      if (attempt === maxRetries) throw err;

      const isRateLimit = err.code === 429 || (err.message && err.message.includes('quota'));
      if (!isRateLimit) throw err;

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`     ⏳ Rate limited. Waiting ${(delay / 1000).toFixed(1)}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('📣 Attack A Crack — GBP Batch Poster\n');

  if (DRY_RUN) {
    console.log('  ℹ️  DRY RUN — no posts will be created\n');
  }

  // Check for unconfigured GBP IDs
  const ctConfigured = !GBP_CONFIG.CT.account.includes('XXXX');
  const maConfigured = !GBP_CONFIG.MA.account.includes('XXXX');

  if (!ctConfigured && !maConfigured) {
    console.error('❌ No GBP location IDs configured.');
    console.error('   Edit GBP_CONFIG in this file with your account/location IDs.');
    console.error('   Get them from: https://business.google.com/ or via the GBP API.\n');
    process.exit(1);
  }

  console.log(`  CT GBP: ${ctConfigured ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`  MA GBP: ${maConfigured ? '✅ Configured' : '⚠️  Not configured'}\n`);

  // Get projects
  const allProjects = getPublishedProjects();
  console.log(`📄 Published projects found: ${allProjects.length}\n`);

  if (allProjects.length === 0) {
    console.log('  No published projects to post.');
    return;
  }

  // Filter already posted
  const postedSlugs = FORCE ? [] : getPostedSlugs();
  const toPost = allProjects
    .filter(p => !postedSlugs.includes(p.slug))
    .slice(0, LIMIT);

  console.log(`  Already posted: ${postedSlugs.length}`);
  console.log(`  To post: ${toPost.length}\n`);

  if (toPost.length === 0) {
    console.log('  All projects already posted. Use --force to re-post.');
    return;
  }

  // Authorize (skip for dry run if not checking real API)
  let auth = null;
  if (!DRY_RUN) {
    auth = await authorize();
  }

  let posted = 0;
  let failed = 0;

  for (const project of toPost) {
    const gbpTarget = STATE_ROUTING[project.state] || 'MA';
    console.log(`  📋 ${project.title}`);
    console.log(`     → GBP: ${gbpTarget} | ${project.city}, ${project.state}`);

    if (DRY_RUN) {
      const serviceLabel = SERVICE_LABELS[project.serviceType] || 'foundation repair';
      const postText = `Just completed ${serviceLabel} in ${project.city}, ${project.state}. ${project.summary}`;
      console.log(`     📝 Post: "${postText.substring(0, 100)}..."`);
      console.log(`     🔗 CTA: ${SITE_URL}/projects/${project.slug}`);
      posted++;
    } else {
      const ok = await postWithBackoff(auth, project);
      if (ok) {
        markAsPosted(project.slug);
        posted++;
        console.log('     ✅ Posted');
      } else {
        failed++;
      }
    }

    console.log();
  }

  // Summary
  console.log('-----------------------------------');
  console.log('  Posting Summary');
  console.log('-----------------------------------');
  console.log(`  Posted: ${posted}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total tracked: ${getPostedSlugs().length}`);
  console.log('-----------------------------------\n');
}

main().catch(err => {
  console.error('❌ Posting failed:', err.message);
  process.exit(1);
});
