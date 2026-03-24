/**
 * Google Ads REST API Client
 *
 * The googleapis npm package doesn't include google.ads, so we use
 * the REST API directly with GAQL (Google Ads Query Language).
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '../.credentials/google-ads-config.json');
const API_VERSION = 'v23';
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

let _config = null;

/** Load the Google Ads config (developer token, account IDs) */
async function loadConfig() {
  if (_config) return _config;
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    _config = JSON.parse(raw);
    return _config;
  } catch (err) {
    throw new Error(
      `Google Ads config not found at ${CONFIG_PATH}. ` +
      `Create it with: { "developerToken": "...", "managerAccountId": "...", "accounts": { "MA": "..." } }`
    );
  }
}

/**
 * Run a GAQL query against a Google Ads customer account.
 *
 * @param {object} auth - OAuth2 client from authorize()
 * @param {string} customerId - Target account ID (no dashes, e.g. "4683607368")
 * @param {string} query - GAQL query string
 * @returns {Array} - Array of result row objects
 */
export async function gaqlQuery(auth, customerId, query) {
  const config = await loadConfig();
  const token = await auth.getAccessToken();
  const accessToken = typeof token === 'string' ? token : token.token;

  const url = `${BASE_URL}/customers/${customerId}/googleAds:searchStream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': config.developerToken,
      'login-customer-id': config.managerAccountId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Check for common issues
    if (response.status === 401) {
      throw new Error(`Google Ads API auth failed (401). Re-run OAuth: rm scripts/.credentials/google-token.json && node -e "import('./scripts/lib/project-import-core.js').then(m => m.authorize())"`);
    }
    if (response.status === 403 && errorBody.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
      throw new Error(`Developer token is still in test mode. Apply for production access in Google Ads MCC → Tools & Settings → API Center.`);
    }
    throw new Error(`Google Ads API error (${response.status}): ${errorBody}`);
  }

  // searchStream returns an array of batches, each containing results
  const data = await response.json();
  const rows = [];
  if (Array.isArray(data)) {
    for (const batch of data) {
      if (batch.results) {
        rows.push(...batch.results);
      }
    }
  }
  return rows;
}

/** Get the config (for account IDs, etc.) */
export async function getConfig() {
  return loadConfig();
}

/** Convert cost_micros to dollars */
export function microsToDollars(micros) {
  return Number((parseInt(micros || '0', 10) / 1_000_000).toFixed(2));
}
