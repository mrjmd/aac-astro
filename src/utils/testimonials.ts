/**
 * Centralized Testimonials Utility
 *
 * Single source of truth for customer testimonials used across:
 * - Homepage review cards
 * - About page testimonial section
 * - Service pages (filtered by service type)
 * - Location pages (filtered by state/city)
 * - State hub pages (filtered by state)
 *
 * To update: Edit src/content/settings/testimonials.json
 */

import data from '../content/settings/testimonials.json';

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  location: string;
  state: 'CT' | 'MA';
  rating: number;
  service: string;
  featured: boolean;
}

export const allTestimonials: Testimonial[] = data.testimonials as Testimonial[];

/** Get featured testimonials (for homepage) */
export function getFeatured(count?: number): Testimonial[] {
  const featured = allTestimonials.filter(t => t.featured);
  return count ? featured.slice(0, count) : featured;
}

/** Get testimonials filtered by state */
export function getByState(state: 'CT' | 'MA', count?: number): Testimonial[] {
  const filtered = allTestimonials.filter(t => t.state === state);
  return count ? filtered.slice(0, count) : filtered;
}

/** Get testimonials filtered by service slug */
export function getByService(service: string, count?: number): Testimonial[] {
  const filtered = allTestimonials.filter(t => t.service === service || t.service === 'general');
  return count ? filtered.slice(0, count) : filtered;
}

/** Get testimonials matching a specific service (excluding general) */
export function getByServiceExact(service: string, count?: number): Testimonial[] {
  const filtered = allTestimonials.filter(t => t.service === service);
  return count ? filtered.slice(0, count) : filtered;
}

/** Get testimonials for a city (match by location string) */
export function getByCity(city: string, state: string): Testimonial[] {
  return allTestimonials.filter(t =>
    t.location.toLowerCase().includes(city.toLowerCase()) && t.state === state
  );
}

/** Get testimonials for a city, falling back to state-level if no exact city match */
export function getForLocation(city: string, state: 'CT' | 'MA', count = 1): Testimonial[] {
  const cityMatch = getByCity(city, state);
  if (cityMatch.length >= count) return cityMatch.slice(0, count);

  // Fall back to same-state testimonials
  const stateMatch = getByState(state).filter(t => !cityMatch.includes(t));
  return [...cityMatch, ...stateMatch].slice(0, count);
}
