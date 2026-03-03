/**
 * Trusted Partners Utility
 *
 * Data access helpers for the trusted partners directory.
 * To update: Edit src/content/settings/trusted-partners.json
 */

import data from '../content/settings/trusted-partners.json';

export interface TrustedPartner {
  id: string;
  name: string;
  company: string;
  category: string;
  website: string;
  description: string;
  state: string;
}

const partners: TrustedPartner[] = data as TrustedPartner[];

/** Extract last name for sorting */
function lastName(name: string): string {
  const parts = name.split(' ');
  return parts[parts.length - 1].replace(/^O'/, '');
}

/** Get all partners, optionally filtered by state, sorted by last name */
export function getAllPartners(state?: string): TrustedPartner[] {
  const filtered = state ? partners.filter(p => p.state === state) : partners;
  return filtered.sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)));
}

/** Get sorted unique category list, optionally filtered by state */
export function getCategories(state?: string): string[] {
  const filtered = state ? partners.filter(p => p.state === state) : partners;
  const categories = [...new Set(filtered.map(p => p.category))];
  return categories.sort((a, b) => a.localeCompare(b));
}

/** Get partners in a specific category, sorted by last name */
export function getByCategory(category: string, state?: string): TrustedPartner[] {
  return getAllPartners(state).filter(p => p.category === category);
}
