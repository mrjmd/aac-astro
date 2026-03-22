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

/** Haversine distance in miles between two lat/lng points */
function distanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get projects for a specific location (city + state match, with proximity fallback) */
export async function getForLocation(
  city: string,
  state: string,
  count = 3,
  coordinates?: { lat: number; lng: number }
) {
  const all = await getAll();
  const cityMatch = all.filter(
    p => p.data.city.toLowerCase() === city.toLowerCase() && p.data.state === state
  );
  if (cityMatch.length >= count) return cityMatch.slice(0, count);

  // Fall back to same-state projects, sorted by proximity if coordinates available
  const stateMatch = all.filter(
    p => p.data.state === state && !cityMatch.includes(p)
  );

  if (coordinates) {
    stateMatch.sort((a, b) => {
      const aDist = a.data.coordinates
        ? distanceMiles(coordinates.lat, coordinates.lng, a.data.coordinates.lat, a.data.coordinates.lng)
        : Infinity;
      const bDist = b.data.coordinates
        ? distanceMiles(coordinates.lat, coordinates.lng, b.data.coordinates.lat, b.data.coordinates.lng)
        : Infinity;
      return aDist - bDist;
    });
  }

  return [...cityMatch, ...stateMatch].slice(0, count);
}

/** Get projects by service type */
export async function getByService(serviceType: string, count = 3) {
  const all = await getAll();
  return all.filter(p => p.data.serviceTypes.includes(serviceType)).slice(0, count);
}

// Supplementary images from media photos (not tied to project content entries)
const SUPPLEMENTARY_IMAGES = [
  '/images/projects/media-matt-crack-injection-ladder.jpg',
  '/images/projects/media-matt-crack-injection-overhead.jpg',
  '/images/projects/media-matt-foundation-inspection.jpg',
  '/images/projects/media-ed-concrete-floor-repair.jpg',
  '/images/projects/media-ed-concrete-floor-grinding.jpg',
  '/images/projects/media-rob-bulkhead-setup.jpg',
  '/images/projects/media-rob-polyfoam-setup.jpg',
  '/images/projects/media-rob-polyfoam-injection.jpg',
  '/images/projects/media-rob-bulkhead-finished.jpg',
];

/** Stable hash for deterministic image assignment (djb2 algorithm) */
function stableHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

/** Build a deduplicated, sorted pool of all available project images */
async function buildImagePool(): Promise<string[]> {
  const all = await getAll();
  const pool = new Set<string>();

  for (const project of all) {
    const { beforeImage, afterImage } = project.data;
    if (beforeImage && !beforeImage.includes('placeholder')) {
      pool.add(beforeImage);
    }
    if (afterImage && !afterImage.includes('placeholder')) {
      pool.add(afterImage);
    }
  }

  // Add supplementary media images
  for (const img of SUPPLEMENTARY_IMAGES) {
    pool.add(img);
  }

  return [...pool].sort();
}

/**
 * Get the best project image for a city page.
 *
 * Tier 0: Frontmatter heroImage override (if provided)
 * Tier 1: Exact city+state project match
 * Tier 2: Cross-state pool with deterministic hash assignment
 */
export async function getProjectImageForCity(
  city: string,
  stateAbbr: string,
  coordinates?: { lat: number; lng: number },
  heroImageOverride?: string,
  heroImageAltOverride?: string,
): Promise<{ src: string; alt: string }> {
  // Tier 0: Frontmatter override
  if (heroImageOverride) {
    return {
      src: heroImageOverride,
      alt: heroImageAltOverride || `Foundation repair in ${city}, ${stateAbbr}`,
    };
  }

  const all = await getAll();

  // Tier 1: Exact city match
  const cityProjects = all.filter(
    p => p.data.city.toLowerCase() === city.toLowerCase() && p.data.state === stateAbbr
  );

  if (cityProjects.length > 0) {
    const project = cityProjects[0];
    const after = project.data.afterImage;
    const before = project.data.beforeImage;
    const hasAfter = after && !after.includes('placeholder');
    const hasBefore = before && !before.includes('placeholder');
    if (hasAfter || hasBefore) {
      return {
        src: hasAfter ? after : before,
        alt: `Foundation repair project in ${city}, ${stateAbbr}`,
      };
    }
    // Both are placeholders — fall through to Tier 2
  }

  // Tier 2: Cross-state pool with deterministic hash
  const pool = await buildImagePool();
  if (pool.length === 0) {
    return {
      src: '/images/projects/media-matt-crack-injection-ladder.jpg',
      alt: `Foundation repair near ${city}, ${stateAbbr}`,
    };
  }

  const hash = stableHash(`${city}-${stateAbbr}`);
  const index = hash % pool.length;

  return {
    src: pool[index],
    alt: `Foundation repair near ${city}, ${stateAbbr}`,
  };
}

/** Map service page slugs to project serviceType enum values */
export const SERVICE_SLUG_MAP: Record<string, string> = {
  // Foundation repair services
  'foundation-crack-injection': 'crack-injection',
  'wall-crack-repair': 'wall-crack-repair',
  'leaky-bulkhead-repair': 'bulkhead-repair',
  'carbon-fiber-stitches': 'carbon-fiber',
  'sewer-well-conduit-line-repair': 'sewer-conduit',
  // Concrete repair services
  'driveway': 'driveway',
  'patio': 'patio',
  'walkway-stairway': 'walkway',
  'pool-deck': 'pool-deck',
  'garage': 'garage-floor',
};
