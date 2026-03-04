/**
 * Projects Utility
 *
 * Data access for project case studies. Used by:
 * - /updates page (all projects)
 * - City pages (projects matching city/state)
 * - Service pages (projects matching service type)
 */

import { getCollection } from 'astro:content';

/** Get all published projects, sorted by date descending */
export async function getAll() {
  const projects = await getCollection('projects');
  return projects
    .filter(p => p.data.published)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Get projects for a specific location (city + state match) */
export async function getForLocation(city: string, state: string, count = 3) {
  const all = await getAll();
  const cityMatch = all.filter(
    p => p.data.city.toLowerCase() === city.toLowerCase() && p.data.state === state
  );
  if (cityMatch.length >= count) return cityMatch.slice(0, count);

  // Fall back to same-state projects
  const stateMatch = all.filter(
    p => p.data.state === state && !cityMatch.includes(p)
  );
  return [...cityMatch, ...stateMatch].slice(0, count);
}

/** Get projects by service type */
export async function getByService(serviceType: string, count = 3) {
  const all = await getAll();
  return all.filter(p => p.data.serviceType === serviceType).slice(0, count);
}

/** Map service page slugs to project serviceType enum values */
export const SERVICE_SLUG_MAP: Record<string, string> = {
  'foundation-crack-injection': 'crack-injection',
  'wall-crack-repair': 'wall-crack-repair',
  'leaky-bulkhead-repair': 'bulkhead-repair',
  'carbon-fiber-stitches': 'carbon-fiber',
  'sewer-well-conduit-line-repair': 'sewer-conduit',
};
