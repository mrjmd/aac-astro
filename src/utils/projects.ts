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

// State-level fallback images (best project photo per state)
const STATE_FALLBACK_IMAGES: Record<string, string> = {
  CT: '/images/projects/weymouth-crack-injection-2025-01-before.jpg',
  MA: '/images/projects/quincy-crack-injection-2025-10-before.jpg',
  RI: '/images/projects/rumford-crack-injection-2025-08-before.jpg',
  NH: '/images/projects/billerica-crack-injection-2025-01-before.jpg',
  ME: '/images/projects/ashland-crack-injection-2025-05-before.jpg',
};

/** Get the best project image for a city page. Prefers after images from local projects. */
export async function getProjectImageForCity(
  city: string,
  stateAbbr: string,
  coordinates?: { lat: number; lng: number }
): Promise<{ src: string; alt: string }> {
  const all = await getAll();

  // Try exact city match first
  const cityProjects = all.filter(
    p => p.data.city.toLowerCase() === city.toLowerCase() && p.data.state === stateAbbr
  );

  if (cityProjects.length > 0) {
    const project = cityProjects[0];
    return {
      src: project.data.afterImage !== '/images/projects/placeholder.svg'
        ? project.data.afterImage
        : project.data.beforeImage,
      alt: `Foundation repair project in ${city}, ${stateAbbr}`,
    };
  }

  // Fall back to same-state project, nearest first
  const stateProjects = all.filter(p => p.data.state === stateAbbr);
  if (coordinates) {
    stateProjects.sort((a, b) => {
      const aDist = a.data.coordinates
        ? distanceMiles(coordinates.lat, coordinates.lng, a.data.coordinates.lat, a.data.coordinates.lng)
        : Infinity;
      const bDist = b.data.coordinates
        ? distanceMiles(coordinates.lat, coordinates.lng, b.data.coordinates.lat, b.data.coordinates.lng)
        : Infinity;
      return aDist - bDist;
    });
  }
  if (stateProjects.length > 0) {
    const project = stateProjects[0];
    return {
      src: project.data.afterImage !== '/images/projects/placeholder.svg'
        ? project.data.afterImage
        : project.data.beforeImage,
      alt: `Foundation repair project near ${city}, ${stateAbbr}`,
    };
  }

  // Ultimate fallback
  return {
    src: STATE_FALLBACK_IMAGES[stateAbbr] || STATE_FALLBACK_IMAGES.MA,
    alt: `Foundation repair in ${stateAbbr}`,
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
