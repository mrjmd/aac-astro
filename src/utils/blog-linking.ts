/**
 * Blog Linking Utility
 *
 * Reverse-lookup helpers for linking blog posts from service, location, and project pages.
 * Follows the same pattern as src/utils/projects.ts.
 */

import { getCollection } from 'astro:content';
import { isPublished } from './blog';

/** Get published blog posts related to a service slug */
export async function getBlogForService(serviceSlug: string, count = 4) {
  const posts = await getCollection('blog', isPublished);
  return posts
    .filter(p => p.data.relatedServices?.includes(serviceSlug))
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    .slice(0, count);
}

/**
 * Get published blog posts relevant to a location.
 *
 * 3-tier matching:
 * 1. Exact city + state match
 * 2. targetLocation contains city name or state abbreviation
 * 3. Same-state fallback
 */
export async function getBlogForLocation(city: string, stateAbbr: string, count = 3) {
  const posts = await getCollection('blog', isPublished);
  const cityLower = city.toLowerCase();

  const scored = posts.map(p => {
    let score = 0;
    // Tier 1: exact city + state
    if (p.data.city?.toLowerCase() === cityLower && p.data.state === stateAbbr) score += 10;
    // Tier 2: targetLocation mentions city or state
    else if (p.data.targetLocation) {
      const tl = p.data.targetLocation.toLowerCase();
      if (tl.includes(cityLower)) score += 5;
      else if (tl.includes(stateAbbr.toLowerCase())) score += 3;
    }
    // Tier 3: same state
    else if (p.data.state === stateAbbr) score += 1;

    return { post: p, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.publishDate.valueOf() - a.post.data.publishDate.valueOf())
    .slice(0, count)
    .map(s => s.post);
}

/** Get latest published blog posts (for homepage) */
export async function getLatestBlog(count = 3) {
  const posts = await getCollection('blog', isPublished);
  return posts
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    .slice(0, count);
}
