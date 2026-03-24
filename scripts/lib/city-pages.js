/**
 * City Pages Utility
 *
 * Reads city landing page content files and provides mapping utilities
 * for Google Ads scripts (keyword generation, ad group naming, etc.).
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCATIONS_DIR = join(__dirname, '../../src/content/locations');

// State directory names → URL path segments (these match the filesystem)
const STATE_DIRS = ['connecticut', 'maine', 'massachusetts', 'new-hampshire', 'rhode-island'];

/**
 * Load all city pages from content files.
 * Parses frontmatter for city, state, stateAbbr, and phoneNumber.
 *
 * @returns {Promise<Array<{ city, state, stateAbbr, slug, url, phoneNumber }>>}
 */
export async function loadCityPages() {
  const cities = [];

  for (const stateDir of STATE_DIRS) {
    const dirPath = join(LOCATIONS_DIR, stateDir);
    let files;
    try {
      files = await readdir(dirPath);
    } catch {
      continue; // skip if directory doesn't exist
    }

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const slug = file.replace('.md', '');
      const content = await readFile(join(dirPath, file), 'utf-8');

      // Parse frontmatter fields we need (simple regex, no yaml dep)
      const city = extractField(content, 'city');
      const state = extractField(content, 'state');
      const stateAbbr = extractField(content, 'stateAbbr');
      const phoneNumber = extractField(content, 'phoneNumber');

      if (!city || !stateAbbr) continue;

      cities.push({
        city,
        state: state || stateDir,
        stateAbbr,
        slug,
        url: `/${stateDir}/${slug}/`,
        phoneNumber: phoneNumber || null,
      });
    }
  }

  return cities.sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city));
}

/**
 * Filter cities by state abbreviation.
 * @param {Array} cities - From loadCityPages()
 * @param {string} stateAbbr - e.g. "MA", "CT"
 */
export function filterCitiesByState(cities, stateAbbr) {
  return cities.filter(c => c.stateAbbr === stateAbbr.toUpperCase());
}

/**
 * Generate an ad group name from city + state abbreviation.
 * @returns {string} e.g. "Boston MA", "New Haven CT"
 */
export function cityToAdGroupName(city, stateAbbr) {
  return `${city} ${stateAbbr}`;
}

/** Extract a YAML frontmatter field value (handles quoted and unquoted strings) */
function extractField(content, field) {
  const match = content.match(new RegExp(`^${field}:\\s*"?([^"\\n]+)"?`, 'm'));
  return match ? match[1].trim() : null;
}
