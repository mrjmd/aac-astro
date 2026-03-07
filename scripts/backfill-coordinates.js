#!/usr/bin/env node
/**
 * One-time script to backfill coordinates on all project .md files
 * that are missing them. Uses a comprehensive town lookup.
 *
 * Usage: node scripts/backfill-coordinates.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = path.join(__dirname, '..', 'src', 'content', 'projects');

// Comprehensive coordinates for all towns with projects
// Sources: Google Maps center points for each municipality
const TOWN_COORDS = {
  // Already in CITY_COORDS (keeping consistent)
  'Boston': { lat: 42.3601, lng: -71.0589 },
  'Worcester': { lat: 42.2626, lng: -71.8023 },
  'Quincy': { lat: 42.2529, lng: -71.0023 },
  'Newton': { lat: 42.3370, lng: -71.2092 },
  'Framingham': { lat: 42.2793, lng: -71.4162 },
  'Brockton': { lat: 42.0834, lng: -71.0184 },
  'Plymouth': { lat: 41.9584, lng: -70.6673 },
  'Fall River': { lat: 41.7015, lng: -71.1550 },

  // South Shore
  'Weymouth': { lat: 42.2211, lng: -70.9395 },
  'Hingham': { lat: 42.2418, lng: -70.8898 },
  'Scituate': { lat: 42.1951, lng: -70.7256 },
  'Marshfield': { lat: 42.0918, lng: -70.7076 },
  'Norwell': { lat: 42.1615, lng: -70.7934 },
  'Hanover': { lat: 42.1126, lng: -70.8120 },
  'Kingston': { lat: 41.9945, lng: -70.7242 },
  'Duxbury': { lat: 42.0409, lng: -70.6724 },
  'Hull': { lat: 42.3018, lng: -70.8579 },
  'Rockland': { lat: 42.1307, lng: -70.9068 },
  'Abington': { lat: 42.1048, lng: -70.9454 },
  'East Bridgewater': { lat: 42.0335, lng: -70.9590 },
  'Halifax': { lat: 41.9912, lng: -70.8620 },
  'Braintree': { lat: 42.2038, lng: -71.0022 },
  'Milton': { lat: 42.2498, lng: -71.0662 },
  'Randolph': { lat: 42.1625, lng: -71.0418 },
  'Canton': { lat: 42.1584, lng: -71.1448 },
  'Walpole': { lat: 42.1417, lng: -71.2498 },

  // Metro West / Inside 128
  'Dedham': { lat: 42.2418, lng: -71.1662 },
  'Norwood': { lat: 42.1815, lng: -71.2006 },
  'Belmont': { lat: 42.3790, lng: -71.1773 },
  'Lexington': { lat: 42.4473, lng: -71.2245 },
  'Burlington': { lat: 42.5048, lng: -71.1956 },
  'Malden': { lat: 42.4251, lng: -71.0662 },
  'Medford': { lat: 42.4184, lng: -71.1062 },
  'Ashland': { lat: 42.2612, lng: -71.4634 },
  'Billerica': { lat: 42.5584, lng: -71.2690 },

  // North Shore
  'Danvers': { lat: 42.5751, lng: -70.9300 },
  'Marblehead': { lat: 42.5001, lng: -70.8579 },
  'Groveland': { lat: 42.7562, lng: -71.0312 },

  // Cape & Islands
  'Sandwich': { lat: 41.7590, lng: -70.4930 },
  'East Sandwich': { lat: 41.7418, lng: -70.4389 },
  'Falmouth': { lat: 41.5515, lng: -70.6148 },
  'Middleborough': { lat: 41.8932, lng: -70.9112 },

  // South Coast
  'Attleboro': { lat: 41.9445, lng: -71.2856 },
  'Easton': { lat: 42.0251, lng: -71.1287 },

  // Western MA
  'West Springfield': { lat: 42.1070, lng: -72.6201 },
  'Belchertown': { lat: 42.2770, lng: -72.4018 },
  'Lenox': { lat: 42.3570, lng: -73.2851 },
  'Shrewsbury': { lat: 42.2959, lng: -71.7126 },

  // RI
  'Rumford': { lat: 41.8426, lng: -71.3534 },
};

const dryRun = process.argv.includes('--dry-run');

const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.md'));
let updated = 0;
let skipped = 0;
let missing = 0;

for (const file of files) {
  const filePath = path.join(PROJECTS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has coordinates
  if (content.includes('coordinates:')) {
    skipped++;
    continue;
  }

  // Extract city from frontmatter
  const cityMatch = content.match(/^city:\s*(.+)$/m);
  if (!cityMatch) {
    console.warn(`⚠️  No city found in ${file}`);
    missing++;
    continue;
  }

  const city = cityMatch[1].trim();
  const coords = TOWN_COORDS[city];

  if (!coords) {
    console.warn(`⚠️  No coordinates for "${city}" in ${file}`);
    missing++;
    continue;
  }

  // Insert coordinates after the state line
  const newContent = content.replace(
    /^(state:\s*.+)$/m,
    `$1\ncoordinates:\n  lat: ${coords.lat}\n  lng: ${coords.lng}`
  );

  if (dryRun) {
    console.log(`[DRY RUN] Would update ${file} — ${city} (${coords.lat}, ${coords.lng})`);
  } else {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Updated ${file} — ${city} (${coords.lat}, ${coords.lng})`);
  }
  updated++;
}

console.log(`\n--- Summary ---`);
console.log(`Already had coordinates: ${skipped}`);
console.log(`Updated: ${updated}`);
console.log(`Missing coords: ${missing}`);
console.log(`Total files: ${files.length}`);
