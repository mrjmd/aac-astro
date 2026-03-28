/**
 * Centralized Review Data Utility
 *
 * Single source of truth for review counts and ratings used in:
 * - AggregateRating schemas
 * - UI display ("260+ 5-Star Reviews")
 *
 * To update: Edit src/content/settings/general.json
 * For phone/email/address info, see src/utils/contact.ts
 */

import settings from '../content/settings/general.json';

// Review data from centralized settings — per state
export const reviewCountCT = settings.google_reviews_count_ct;
export const reviewCountMA = settings.google_reviews_count_ma;
export const rating = settings.google_rating;

// Backward compat: reviewCount = CT count (used by state-specific pages)
export const reviewCount = reviewCountCT;

// Google Reviews URLs
export const googleReviewsUrlCT = settings.google_reviews_url_ct;
export const googleReviewsUrlMA = settings.google_reviews_url_ma;

// Formatted strings for UI — per state
export const reviewCountDisplayCT = `${reviewCountCT}+`;
export const reviewCountDisplayMA = `${Math.floor(reviewCountMA / 10) * 10}+`;
export const reviewCountDisplay = reviewCountDisplayCT;
export const ratingDisplay = rating.toString();

// AggregateRating schema object (reusable across pages)
export const aggregateRatingSchema = {
  "@type": "AggregateRating",
  "ratingValue": rating.toString(),
  "reviewCount": reviewCountCT.toString(),
  "bestRating": "5",
  "worstRating": "1"
};

// Helper function to create AggregateRating for a specific entity
export function createAggregateRating(entityName?: string) {
  return {
    ...aggregateRatingSchema,
    ...(entityName && { "itemReviewed": { "@type": "LocalBusiness", "name": entityName } })
  };
}
