/**
 * Buffer GraphQL API Client
 *
 * Shared module for scheduling posts via the Buffer GraphQL API.
 * Uses native fetch (Node 20+) — no new dependencies.
 *
 * Buffer API docs: https://developers.buffer.com
 * Endpoint: https://api.buffer.com (GraphQL POST)
 * Auth: Bearer token via BUFFER_API_TOKEN env var or scripts/.credentials/buffer-token
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_ENDPOINT = 'https://api.buffer.com';
const TOKEN_PATH = join(resolve('scripts/.credentials'), 'buffer-token');
const REQUEST_DELAY_MS = 200; // Minimum delay between requests
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Resolve Buffer API token from env var or local credentials file.
 */
export function getToken() {
  let token = process.env.BUFFER_API_TOKEN;
  if (!token && existsSync(TOKEN_PATH)) {
    token = readFileSync(TOKEN_PATH, 'utf-8').trim();
  }
  if (!token) {
    throw new Error(
      'No Buffer API token found. ' +
      'Set BUFFER_API_TOKEN env var or save token to scripts/.credentials/buffer-token'
    );
  }
  return token;
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

let lastRequestTime = 0;

async function rateLimitedFetch(url, options) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise(r => setTimeout(r, REQUEST_DELAY_MS - elapsed));
  }

  let retries = 0;
  while (retries <= MAX_RETRIES) {
    lastRequestTime = Date.now();
    const res = await fetch(url, options);

    // Log rate limit status if available
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (remaining && parseInt(remaining) < 20) {
      console.warn(`  ⚠️  Buffer rate limit: ${remaining} requests remaining`);
    }

    if (res.status === 429) {
      retries++;
      if (retries > MAX_RETRIES) {
        throw new Error('Buffer API rate limit exceeded after retries');
      }
      const backoff = Math.pow(2, retries) * 1000;
      console.warn(`  ⏳ Rate limited — retrying in ${backoff / 1000}s...`);
      await new Promise(r => setTimeout(r, backoff));
      continue;
    }

    return res;
  }
}

// ---------------------------------------------------------------------------
// GraphQL helper
// ---------------------------------------------------------------------------

async function graphql(token, query, variables) {
  const res = await rateLimitedFetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Buffer API request failed (${res.status}): ${body}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(`Buffer GraphQL error: ${json.errors.map(e => e.message).join(', ')}`);
  }

  return json.data;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/**
 * Get all organizations for the authenticated account.
 */
export async function getOrganizations(token) {
  const data = await graphql(token, `
    query GetOrganizations {
      account {
        organizations {
          id
          name
          ownerEmail
        }
      }
    }
  `);
  return data.account.organizations;
}

/**
 * Get all channels for an organization.
 */
export async function getChannels(token, organizationId) {
  const data = await graphql(token, `
    query GetChannels($orgId: OrganizationId!) {
      channels(input: { organizationId: $orgId }) {
        id
        name
        displayName
        service
        avatar
        isQueuePaused
      }
    }
  `, { orgId: organizationId });
  return data.channels;
}

/**
 * Create/schedule a post on Buffer via GraphQL.
 *
 * Automatically includes GBP metadata (type: whats_new, learn_more CTA).
 *
 * @param {Object} options
 * @param {string} options.token - Buffer API token
 * @param {string} options.channelId - Buffer channel ID
 * @param {string} options.text - Post text
 * @param {string} [options.imageUrl] - Image URL to attach
 * @param {string} [options.scheduledAt] - ISO 8601 timestamp for scheduled posting
 * @param {string} [options.linkUrl] - CTA link URL for "Learn More" button
 */
export async function createPost({ token, channelId, text, imageUrl, scheduledAt, linkUrl }) {
  const variables = { text, channelId };

  let variableDefs = '$text: String!, $channelId: ChannelId!';
  let inputFields = `
    text: $text,
    channelId: $channelId,
    schedulingType: automatic,
    mode: customScheduled,
    metadata: {
      google: {
        type: whats_new,
        detailsWhatsNew: {
          button: learn_more,
          link: $linkUrl
        }
      }
    }
  `;

  variableDefs += ', $linkUrl: String';
  variables.linkUrl = linkUrl || null;

  if (scheduledAt) {
    variableDefs += ', $dueAt: DateTime';
    inputFields += ', dueAt: $dueAt';
    variables.dueAt = scheduledAt;
  }

  let assetsBlock = '';
  if (imageUrl) {
    variableDefs += ', $imageUrl: String!';
    assetsBlock = ', assets: { images: [{ url: $imageUrl }] }';
    variables.imageUrl = imageUrl;
  }

  const query = `
    mutation CreatePost(${variableDefs}) {
      createPost(input: {
        ${inputFields}
        ${assetsBlock}
      }) {
        ... on PostActionSuccess {
          post {
            id
            text
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `;

  const data = await graphql(token, query, variables);

  if (data.createPost.message) {
    throw new Error(`Buffer post creation failed: ${data.createPost.message}`);
  }

  return data.createPost.post;
}

/**
 * Get all scheduled posts for a channel.
 * Returns array of { id, text, dueAt }.
 */
export async function getScheduledPosts(token, channelId) {
  // Look up org ID
  const orgs = await getOrganizations(token);
  if (!orgs.length) throw new Error('No Buffer organizations found');
  const orgId = orgs[0].id;

  const data = await graphql(token, `
    query GetScheduledPosts($input: PostsInput!) {
      posts(input: $input, first: 100) {
        edges {
          node {
            id
            text
            dueAt
            status
          }
        }
      }
    }
  `, {
    input: {
      organizationId: orgId,
      filter: {
        channelIds: [channelId],
        status: ['scheduled'],
      },
    },
  });

  return (data.posts?.edges || []).map(e => e.node);
}

// ---------------------------------------------------------------------------
// Post text builder
// ---------------------------------------------------------------------------

/** Service labels for post text (lowercase for natural reading) */
const BUFFER_SERVICE_LABELS = {
  'crack-injection': 'Foundation crack repair',
  'wall-crack-repair': 'Wall crack repair',
  'bulkhead-repair': 'Bulkhead repair',
  'carbon-fiber': 'Carbon fiber reinforcement',
  'sewer-conduit': 'Sewer & conduit repair',
  'concrete-repair': 'Concrete repair',
  'garage-floor': 'Garage floor repair',
  'driveway': 'Driveway repair',
  'patio': 'Patio repair',
  'pool-deck': 'Pool deck repair',
  'stairway': 'Stairway repair',
  'walkway': 'Walkway repair',
  'floor-crack': 'Floor crack repair',
  'fieldstone': 'Fieldstone foundation repair',
};

/**
 * Build GBP post text from a project.
 *
 * Rules (GBP best practices 2026):
 * - NO phone numbers, NO email, NO raw URLs, NO hashtags
 * - 150-300 chars ideal; first 100 chars visible before "Read More"
 * - Front-load: first line is the hook
 *
 * @param {Object} project - { city, state, serviceType, summary }
 * @returns {string} Post text
 */
export function buildPostText(project) {
  const serviceLabel = BUFFER_SERVICE_LABELS[project.serviceType] || 'Foundation repair';
  const hook = `${serviceLabel} in ${project.city}, ${project.state}`;
  const cta = 'See our work and get a free estimate at attackacrack.com';

  // Trim summary to fit within ~300 char total
  const maxSummaryLen = 300 - hook.length - cta.length - 4; // 4 = newlines
  let summary = project.summary || '';
  if (summary.length > maxSummaryLen) {
    summary = summary.substring(0, maxSummaryLen - 1).replace(/\s+\S*$/, '') + '…';
  }

  return `${hook}\n\n${summary}\n\n${cta}`;
}
