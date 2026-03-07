/**
 * Centralized Contact Info Utility
 *
 * Single source of truth for phone numbers, email, and addresses.
 * To update: Edit src/content/settings/general.json (or via Decap CMS).
 *
 * NOTE: ~80 markdown files (blog posts, location pages, partner pages) also
 * contain hardcoded phone numbers in body text. Markdown can't import TS.
 * If phone numbers change, grep for the old number across src/content/.
 */

import settings from '../content/settings/general.json';

// Phones
export const phoneCT = settings.phone_ct;
export const phoneMA = settings.phone_ma;
export const phoneCTHref = `tel:${settings.phone_ct}`;
export const phoneMAHref = `tel:${settings.phone_ma}`;

// Email
export const email = settings.email;
export const emailHref = `mailto:${settings.email}`;

// Addresses
export const addressCT = settings.address_ct;
export const addressMA = settings.address_ma;
