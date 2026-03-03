/**
 * Centralized Pricing Utility
 *
 * Single source of truth for all pricing ranges displayed on the site.
 * To update prices: Edit src/content/settings/pricing.json
 *
 * IMPORTANT: This utility covers components and templates that can import TS.
 * Markdown content files (blog posts, location pages) must be updated manually
 * when prices change — search for dollar amounts with:
 *   grep -r '\$[0-9]' src/content/
 */

import pricing from '../content/settings/pricing.json';

// Raw values
export const crackRepairMin = pricing.crack_repair_min;
export const crackRepairMax = pricing.crack_repair_max;
export const bulkheadMin = pricing.bulkhead_min;
export const bulkheadMax = pricing.bulkhead_max;
export const carbonFiberMin = pricing.carbon_fiber_min;
export const carbonFiberMax = pricing.carbon_fiber_max;
export const sewerConduitMin = pricing.sewer_conduit_min;
export const sewerConduitMax = pricing.sewer_conduit_max;
export const wallStabilizationMin = pricing.wall_stabilization_min;
export const wallStabilizationMax = pricing.wall_stabilization_max;

// Formatted display strings
export const crackRepairRange = `$${crackRepairMin.toLocaleString()}-$${crackRepairMax.toLocaleString()}`;
export const bulkheadRange = `$${bulkheadMin.toLocaleString()}-$${bulkheadMax.toLocaleString()}`;
export const carbonFiberRange = `$${carbonFiberMin}-$${carbonFiberMax}`;
export const sewerConduitRange = `$${sewerConduitMin}-$${sewerConduitMax}`;
export const wallStabilizationRange = `$${wallStabilizationMin.toLocaleString()}-$${wallStabilizationMax.toLocaleString()}`;
