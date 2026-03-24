#!/usr/bin/env node

/**
 * Google Ads Negative Keywords Manager
 *
 * Adds negative keywords to a campaign or shared negative keyword list.
 * Can also list existing negative keywords.
 *
 * Usage:
 *   node scripts/google-ads-negatives.js --list                    # show existing negatives
 *   node scripts/google-ads-negatives.js --add "term1" "term2"     # add negatives to all campaigns
 *   node scripts/google-ads-negatives.js --dry-run --add "term"    # preview without applying
 */

import { authorize } from './lib/project-import-core.js';
import { getConfig } from './lib/google-ads-client.js';

const API_VERSION = 'v23';
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIST_MODE = args.includes('--list');
const ADD_MODE = args.includes('--add');
const acctIdx = args.indexOf('--account');
const ACCOUNT_KEY = acctIdx !== -1 ? args[acctIdx + 1] : 'MA';

// Get terms to add (everything after --add that doesn't start with --)
const addIdx = args.indexOf('--add');
const termsToAdd = addIdx !== -1
  ? args.slice(addIdx + 1).filter(a => !a.startsWith('--'))
  : [];

async function gaqlQuery(auth, customerId, config, query) {
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
    throw new Error(`Google Ads API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rows = [];
  if (Array.isArray(data)) {
    for (const batch of data) {
      if (batch.results) rows.push(...batch.results);
    }
  }
  return rows;
}

async function mutate(auth, customerId, config, operations) {
  const token = await auth.getAccessToken();
  const accessToken = typeof token === 'string' ? token : token.token;

  const url = `${BASE_URL}/customers/${customerId}/campaignCriteria:mutate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': config.developerToken,
      'login-customer-id': config.managerAccountId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operations }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Ads mutate error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

async function main() {
  const auth = await authorize();
  const config = await getConfig();
  const customerId = config.accounts[ACCOUNT_KEY];

  if (!customerId) {
    console.error(`No account found for "${ACCOUNT_KEY}"`);
    process.exit(1);
  }

  console.log(`\n📊 Google Ads Negative Keywords — ${ACCOUNT_KEY} (${customerId})\n`);

  // Get active campaigns
  const campaignRows = await gaqlQuery(auth, customerId, config, `
    SELECT campaign.id, campaign.name, campaign.status
    FROM campaign
    WHERE campaign.status = 'ENABLED'
  `);
  const campaigns = campaignRows.map(r => ({
    id: r.campaign.id,
    name: r.campaign.name,
    resourceName: r.campaign.resourceName,
  }));

  console.log(`  Active campaigns: ${campaigns.map(c => c.name).join(', ')}\n`);

  if (LIST_MODE) {
    // List existing negative keywords
    console.log('  Existing negative keywords:\n');
    for (const campaign of campaigns) {
      const negRows = await gaqlQuery(auth, customerId, config, `
        SELECT
          campaign_criterion.keyword.text,
          campaign_criterion.keyword.match_type,
          campaign_criterion.negative
        FROM campaign_criterion
        WHERE campaign.id = ${campaign.id}
          AND campaign_criterion.negative = TRUE
          AND campaign_criterion.type = 'KEYWORD'
      `);

      console.log(`  ${campaign.name}:`);
      if (negRows.length === 0) {
        console.log('    (none)');
      } else {
        negRows.forEach(r => {
          const kw = r.campaignCriterion?.keyword;
          console.log(`    [${kw?.matchType}] "${kw?.text}"`);
        });
      }
      console.log();
    }
    return;
  }

  if (ADD_MODE && termsToAdd.length > 0) {
    console.log(`  Adding ${termsToAdd.length} negative keywords to ${campaigns.length} campaign(s):`);
    termsToAdd.forEach(t => console.log(`    - "${t}"`));
    console.log();

    if (DRY_RUN) {
      console.log('  🔍 DRY RUN — no changes made\n');
      return;
    }

    for (const campaign of campaigns) {
      const operations = termsToAdd.map(term => {
        // Support [term] for exact match, default to phrase match
        let matchType = 'PHRASE';
        let text = term;
        if (term.startsWith('[') && term.endsWith(']')) {
          matchType = 'EXACT';
          text = term.slice(1, -1);
        }
        return {
          create: {
            campaign: campaign.resourceName,
            negative: true,
            keyword: { text, matchType },
          },
        };
      });

      try {
        const result = await mutate(auth, customerId, config, operations);
        const count = result.results?.length || 0;
        console.log(`  ✅ Added ${count} negatives to "${campaign.name}"`);
      } catch (err) {
        console.error(`  ❌ Failed on "${campaign.name}": ${err.message}`);
      }
    }

    console.log('\n  Done. Run with --list to verify.\n');
    return;
  }

  console.log('Usage:');
  console.log('  --list                           Show existing negative keywords');
  console.log('  --add "term1" "term2" ...        Add negative keywords (phrase match)');
  console.log('  --dry-run --add "term1" ...      Preview without applying');
  console.log('  --account CT                     Target CT account (default: MA)');
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
