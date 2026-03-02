/**
 * Centralized Review Data Utility
 *
 * Single source of truth for review counts and ratings used in:
 * - AggregateRating schemas
 * - UI display ("260+ 5-Star Reviews")
 *
 * To update: Edit src/content/settings/general.json
 */

import settings from '../content/settings/general.json';

// Review data from centralized settings
export const reviewCount = settings.google_reviews_count;
export const rating = settings.google_rating;

// Phone numbers
export const phoneCT = settings.phone_ct;
export const phoneMA = settings.phone_ma;

// Google Reviews URLs
export const googleReviewsUrlCT = settings.google_reviews_url_ct;

// Formatted strings for UI
export const reviewCountDisplay = `${reviewCount}+`;
export const ratingDisplay = rating.toString();

// AggregateRating schema object (reusable across pages)
export const aggregateRatingSchema = {
  "@type": "AggregateRating",
  "ratingValue": rating.toString(),
  "reviewCount": reviewCount.toString(),
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
