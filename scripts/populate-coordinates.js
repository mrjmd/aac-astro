/**
 * populate-coordinates.js
 *
 * Adds latitude/longitude coordinates to all city markdown files in
 * src/content/locations/. Reads each .md file, parses the YAML frontmatter,
 * and inserts a `coordinates:` block with `lat:` and `lng:` fields if not
 * already present.
 *
 * Usage: node scripts/populate-coordinates.js
 *
 * Idempotent — safe to run multiple times. Files that already have coordinates
 * are skipped.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const LOCATIONS_DIR = path.join(
  PROJECT_ROOT,
  "src",
  "content",
  "locations"
);

// ---------------------------------------------------------------------------
// Coordinate lookup table — keyed by "City, State"
// ---------------------------------------------------------------------------
const COORDINATES = {
  // Connecticut (20 cities)
  "Bridgeport, Connecticut": { lat: 41.1865, lng: -73.1952 },
  "Bristol, Connecticut": { lat: 41.6718, lng: -72.9493 },
  "Danbury, Connecticut": { lat: 41.3948, lng: -73.454 },
  "East Hartford, Connecticut": { lat: 41.7823, lng: -72.6126 },
  "Enfield, Connecticut": { lat: 41.9762, lng: -72.5918 },
  "Glastonbury, Connecticut": { lat: 41.7123, lng: -72.6084 },
  "Greenwich, Connecticut": { lat: 41.0263, lng: -73.6282 },
  "Hartford, Connecticut": { lat: 41.7658, lng: -72.6734 },
  "Manchester, Connecticut": { lat: 41.7759, lng: -72.5215 },
  "Meriden, Connecticut": { lat: 41.5382, lng: -72.807 },
  "Middletown, Connecticut": { lat: 41.5623, lng: -72.6506 },
  "Milford, Connecticut": { lat: 41.2223, lng: -73.0568 },
  "New Britain, Connecticut": { lat: 41.6612, lng: -72.7795 },
  "New Haven, Connecticut": { lat: 41.3083, lng: -72.9279 },
  "Norwalk, Connecticut": { lat: 41.1177, lng: -73.4082 },
  "Shelton, Connecticut": { lat: 41.3165, lng: -73.0932 },
  "Stamford, Connecticut": { lat: 41.0534, lng: -73.5387 },
  "Torrington, Connecticut": { lat: 41.8009, lng: -73.121 },
  "Waterbury, Connecticut": { lat: 41.5582, lng: -73.0515 },
  "West Hartford, Connecticut": { lat: 41.762, lng: -72.742 },

  // Massachusetts (30 cities)
  "Beverly, Massachusetts": { lat: 42.5584, lng: -70.88 },
  "Boston, Massachusetts": { lat: 42.3601, lng: -71.0589 },
  "Brockton, Massachusetts": { lat: 42.0834, lng: -71.0184 },
  "Brookline, Massachusetts": { lat: 42.3318, lng: -71.1212 },
  "Cambridge, Massachusetts": { lat: 42.3736, lng: -71.1097 },
  "Fall River, Massachusetts": { lat: 41.7015, lng: -71.155 },
  "Framingham, Massachusetts": { lat: 42.2793, lng: -71.4162 },
  "Haverhill, Massachusetts": { lat: 42.7762, lng: -71.0773 },
  "Hingham, Massachusetts": { lat: 42.2418, lng: -70.8898 },
  "Lawrence, Massachusetts": { lat: 42.707, lng: -71.1631 },
  "Lexington, Massachusetts": { lat: 42.4473, lng: -71.2245 },
  "Lynn, Massachusetts": { lat: 42.4668, lng: -70.9495 },
  "Marshfield, Massachusetts": { lat: 42.0918, lng: -70.7075 },
  "Milton, Massachusetts": { lat: 42.2498, lng: -71.0662 },
  "Natick, Massachusetts": { lat: 42.2835, lng: -71.3468 },
  "Needham, Massachusetts": { lat: 42.2813, lng: -71.2326 },
  "New Bedford, Massachusetts": { lat: 41.6362, lng: -70.9342 },
  "Newton, Massachusetts": { lat: 42.337, lng: -71.2092 },
  "Peabody, Massachusetts": { lat: 42.5279, lng: -70.9287 },
  "Plymouth, Massachusetts": { lat: 41.9584, lng: -70.6673 },
  "Quincy, Massachusetts": { lat: 42.2529, lng: -71.0023 },
  "Salem, Massachusetts": { lat: 42.5195, lng: -70.8967 },
  "Scituate, Massachusetts": { lat: 42.1995, lng: -70.7256 },
  "Shrewsbury, Massachusetts": { lat: 42.2959, lng: -71.7126 },
  "Somerville, Massachusetts": { lat: 42.3876, lng: -71.0995 },
  "Taunton, Massachusetts": { lat: 41.9006, lng: -71.0898 },
  "Waltham, Massachusetts": { lat: 42.3765, lng: -71.2356 },
  "Wellesley, Massachusetts": { lat: 42.2968, lng: -71.2924 },
  "Weymouth, Massachusetts": { lat: 42.2188, lng: -70.9399 },
  "Worcester, Massachusetts": { lat: 42.2626, lng: -71.8023 },

  // Rhode Island (10 cities)
  "Bristol, Rhode Island": { lat: 41.6771, lng: -71.2662 },
  "Coventry, Rhode Island": { lat: 41.7001, lng: -71.6828 },
  "Cranston, Rhode Island": { lat: 41.7798, lng: -71.4373 },
  "East Providence, Rhode Island": { lat: 41.8137, lng: -71.3701 },
  "Newport, Rhode Island": { lat: 41.4901, lng: -71.3128 },
  "North Kingstown, Rhode Island": { lat: 41.5501, lng: -71.4662 },
  "Pawtucket, Rhode Island": { lat: 41.8787, lng: -71.3826 },
  "Providence, Rhode Island": { lat: 41.824, lng: -71.4128 },
  "Warwick, Rhode Island": { lat: 41.7001, lng: -71.4162 },
  "Woonsocket, Rhode Island": { lat: 42.0029, lng: -71.5145 },

  // New Hampshire (10 cities)
  "Derry, New Hampshire": { lat: 42.8806, lng: -71.3273 },
  "Dover, New Hampshire": { lat: 43.1979, lng: -70.8737 },
  "Exeter, New Hampshire": { lat: 42.9815, lng: -70.9478 },
  "Hampton, New Hampshire": { lat: 42.9376, lng: -70.8389 },
  "Londonderry, New Hampshire": { lat: 42.8651, lng: -71.3734 },
  "Manchester, New Hampshire": { lat: 42.9956, lng: -71.4548 },
  "Nashua, New Hampshire": { lat: 42.7654, lng: -71.4676 },
  "Portsmouth, New Hampshire": { lat: 43.0718, lng: -70.7626 },
  "Rochester, New Hampshire": { lat: 43.3045, lng: -70.9756 },
  "Salem, New Hampshire": { lat: 42.7886, lng: -71.2009 },

  // Maine (10 cities)
  "Biddeford, Maine": { lat: 43.4926, lng: -70.4534 },
  "Gorham, Maine": { lat: 43.6795, lng: -70.4442 },
  "Kennebunk, Maine": { lat: 43.384, lng: -70.5445 },
  "Kittery, Maine": { lat: 43.0884, lng: -70.7356 },
  "Portland, Maine": { lat: 43.6591, lng: -70.2568 },
  "Saco, Maine": { lat: 43.5009, lng: -70.4428 },
  "Scarborough, Maine": { lat: 43.5784, lng: -70.3218 },
  "South Portland, Maine": { lat: 43.6415, lng: -70.2408 },
  "Westbrook, Maine": { lat: 43.677, lng: -70.3712 },
  "York, Maine": { lat: 43.1609, lng: -70.6484 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .md files under a directory.
 */
function collectMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Split a markdown file into { frontmatter: string, body: string }.
 * frontmatter is the raw YAML text between the `---` delimiters (without the
 * delimiters themselves). body includes everything after the closing `---`.
 */
function splitFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)?$/);
  if (!match) {
    return null;
  }
  return {
    frontmatter: match[1],
    body: match[2] ?? "",
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const files = collectMarkdownFiles(LOCATIONS_DIR);
  console.log(`Found ${files.length} location file(s).\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  const missing = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parts = splitFrontmatter(raw);

    if (!parts) {
      console.log(`  SKIP (no frontmatter): ${path.relative(PROJECT_ROOT, filePath)}`);
      skipped++;
      continue;
    }

    const parsed = YAML.parse(parts.frontmatter);

    // Already has coordinates — skip
    if (parsed.coordinates && parsed.coordinates.lat != null && parsed.coordinates.lng != null) {
      console.log(`  SKIP (already has coordinates): ${path.relative(PROJECT_ROOT, filePath)}`);
      skipped++;
      continue;
    }

    const city = parsed.city;
    const state = parsed.state;
    const key = `${city}, ${state}`;
    const coords = COORDINATES[key];

    if (!coords) {
      console.log(`  NOT FOUND: ${key} — ${path.relative(PROJECT_ROOT, filePath)}`);
      missing.push(key);
      notFound++;
      continue;
    }

    // Insert coordinates block into the YAML frontmatter.
    // We insert it right before the closing `---` to keep it tidy, placing it
    // after the last existing field. We work with the raw YAML string to avoid
    // reformatting existing fields.
    const coordinatesBlock = `coordinates:\n  lat: ${coords.lat}\n  lng: ${coords.lng}`;

    // Build the new file content
    const newContent = `---\n${parts.frontmatter}\n${coordinatesBlock}\n---${parts.body}`;

    fs.writeFileSync(filePath, newContent, "utf-8");
    console.log(`  UPDATED: ${path.relative(PROJECT_ROOT, filePath)} — ${coords.lat}, ${coords.lng}`);
    updated++;
  }

  // Summary
  console.log("\n--- Summary ---");
  console.log(`  Total files:    ${files.length}`);
  console.log(`  Updated:        ${updated}`);
  console.log(`  Skipped:        ${skipped}`);
  console.log(`  Not found:      ${notFound}`);

  if (missing.length > 0) {
    console.log(`\n  Missing lookup entries:`);
    for (const m of missing) {
      console.log(`    - ${m}`);
    }
  }

  if (notFound > 0) {
    process.exit(1);
  }
}

main();
