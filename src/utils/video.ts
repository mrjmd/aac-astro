/**
 * Video Schema Utility
 *
 * Central registry of all YouTube videos embedded on the site.
 * Generates VideoObject JSON-LD schema for any page by slug.
 *
 * To add a new video:
 * 1. Add the embed iframe to the page's markdown content
 * 2. Add an entry to VIDEO_REGISTRY below
 * 3. The page template will automatically include the VideoObject schema
 */

interface VideoEntry {
  id: string;          // YouTube video ID
  name: string;        // VideoObject name
  description: string; // VideoObject description
  uploadDate: string;  // ISO date string
}

interface VideoObjectSchema {
  "@type": "VideoObject";
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  contentUrl: string;
  embedUrl: string;
}

/**
 * All YouTube videos embedded on the site, keyed by page slug.
 * Service pages use their content collection ID (e.g., "foundation-crack-injection").
 * Blog posts use their content collection ID (e.g., "foundation-repair-warranty-guide").
 * Special pages use descriptive keys (e.g., "about", "services-hub", "what-we-dont-do").
 */
const VIDEO_REGISTRY: Record<string, VideoEntry[]> = {
  // === About page ===
  "about": [
    {
      id: "bxcldptZcFI",
      name: "Luc Richard: A Lifetime in Concrete",
      description: "Luc Richard grew up in his father's concrete company, learning to pour and finish concrete from age 16. That hands-on experience became the foundation for Attack A Crack, New England's specialist in high-pressure crack injection repair.",
      uploadDate: "2026-03-24",
    },
    {
      id: "lquOoplN6qY",
      name: "Attack A Crack: Our Team Coming Together",
      description: "Meet the Attack A Crack team — a family-owned foundation repair crew that has worked together for over 20 years. Lead technician Justin La Fontaine joined founder Luc Richard straight out of high school, and together they've perfected the methods that set Attack A Crack apart.",
      uploadDate: "2026-03-24",
    },
  ],

  // === Services hub ===
  "services-hub": [
    {
      id: "NMgOgA6yGMs",
      name: "Why Our Repair Method Is Better at Every Step",
      description: "Attack A Crack explains how their foundation repair method differs from competitors — diamond saw preparation, copper injection ports, and 100 PSI injection pressure that far exceeds the industry standard.",
      uploadDate: "2026-03-24",
    },
  ],

  // === Service pages ===
  "foundation-crack-injection": [
    {
      id: "Ijb7aXaaCSY",
      name: "Foundation Crack Injection Repair in Progress",
      description: "Watch Attack A Crack perform a foundation crack injection repair using high-pressure urethane injection at 100 PSI — filling the crack from interior surface through to exterior soil.",
      uploadDate: "2026-03-24",
    },
  ],
  "wall-crack-repair": [
    {
      id: "Ijb7aXaaCSY",
      name: "Foundation Wall Crack Repair in Progress",
      description: "Attack A Crack repairs a foundation wall crack using high-pressure injection — diamond saw preparation, copper port installation, and 100 PSI urethane injection through the full wall thickness.",
      uploadDate: "2026-03-24",
    },
  ],
  "carbon-fiber-stitches": [
    {
      id: "lYYIhHN9nxw",
      name: "Carbon Fiber Staple Installation",
      description: "Attack A Crack installs carbon fiber stitches across a foundation crack — Kevlar-grid reinforcement with 800,000 PSI tensile strength, bonded with structural epoxy for permanent stabilization.",
      uploadDate: "2026-03-24",
    },
  ],
  "leaky-bulkhead-repair": [
    {
      id: "8c_gHPiH9Ic",
      name: "Bulkhead Leak Repair",
      description: "Attack A Crack seals a leaking bulkhead-to-foundation joint using flexible urethane injection — creating a permanent waterproof seal at the cold joint where precast stairs meet the poured foundation.",
      uploadDate: "2026-03-24",
    },
  ],
  "sewer-well-conduit-line-repair": [
    {
      id: "Zu-RP5rLG_k",
      name: "Leaky Sewer Line Repair",
      description: "Attack A Crack seals a leaking sewer line penetration through a foundation wall using flexible urethane injection — no excavation required.",
      uploadDate: "2026-03-24",
    },
    {
      id: "esYW2dxMC3o",
      name: "Leaky Water Line Repair",
      description: "Attack A Crack seals a leaking water line penetration through a foundation wall using flexible urethane injection — permanently stopping water infiltration at the pipe gap.",
      uploadDate: "2026-03-24",
    },
  ],
  "free-foundation-consultations": [
    {
      id: "rLga9lmq_HQ",
      name: "Get Foundation Repair Quotes from Photos You Text Us",
      description: "Attack A Crack explains their photo-based assessment process — text photos of your foundation cracks and get an expert diagnosis and quote without scheduling an in-person visit.",
      uploadDate: "2026-03-24",
    },
  ],

  // === What We Don't Do ===
  "what-we-dont-do": [
    {
      id: "chZSnf8BRtQ",
      name: "Attack A Crack Does Specialized Repairs Only",
      description: "Attack A Crack explains their specialized focus — foundation crack repair and concrete repair only. When your project falls outside their expertise, they'll tell you honestly and refer you to the right specialist.",
      uploadDate: "2026-03-24",
    },
  ],

  // === Blog posts ===
  "foundation-repair-warranty-guide": [
    {
      id: "eg_jMeHCRIs",
      name: "Attack A Crack Lifetime Guarantee",
      description: "Attack A Crack explains their lifetime warranty on all foundation repair work — what it covers, how it transfers to new homeowners, and why they stand behind every repair.",
      uploadDate: "2026-03-24",
    },
    {
      id: "eqAU6S5WEl8",
      name: "Lifetime Guarantee Means Lifetime — the Home, Not the Homeowner",
      description: "Attack A Crack clarifies what lifetime warranty really means — the guarantee covers the repair for the life of the home, not just while you own it, and transfers to future owners.",
      uploadDate: "2026-03-24",
    },
  ],
  "foundation-repair-cost-guide-2026": [
    {
      id: "JofSoPnh97k",
      name: "Surprisingly Affordable Foundation Repairs",
      description: "Attack A Crack breaks down foundation repair costs — most crack injections cost $800-$1,200 per crack, a fraction of exterior excavation, with a lifetime guarantee included.",
      uploadDate: "2026-03-24",
    },
  ],
  "sump-pump-vs-crack-injection": [
    {
      id: "7WHRFcalczA",
      name: "Crack Injections Versus Sump Pumps",
      description: "Attack A Crack explains the difference between crack injection and sump pumps — one seals the entry point, the other manages water that has already entered. Learn which fix your basement actually needs.",
      uploadDate: "2026-03-24",
    },
  ],
  "foundation-settling-when-to-worry": [
    {
      id: "n8-oq3Y95yc",
      name: "Why Most Foundation Issues Are Not a Huge Deal",
      description: "Attack A Crack's Luc Richard explains the difference between normal foundation settling and signs of a real structural problem — most cracks homeowners worry about are routine and affordable to fix.",
      uploadDate: "2026-03-24",
    },
  ],
};

/**
 * Build a VideoObject schema from a video entry.
 */
function toVideoObjectSchema(video: VideoEntry): VideoObjectSchema {
  return {
    "@type": "VideoObject",
    "name": video.name,
    "description": video.description,
    "thumbnailUrl": `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    "uploadDate": video.uploadDate,
    "contentUrl": `https://www.youtube.com/shorts/${video.id}`,
    "embedUrl": `https://www.youtube.com/embed/${video.id}`,
  };
}

/**
 * Get VideoObject schemas for a page by slug.
 * Returns an array of VideoObject schemas, or an empty array if no videos exist.
 *
 * @example
 * // In a service page template:
 * import { getVideoSchemas } from '../../utils/video';
 * const videoSchemas = getVideoSchemas(service.id);
 * const schemas = [serviceSchema, howToSchema, faqSchema, ...videoSchemas].filter(Boolean);
 */
export function getVideoSchemas(pageSlug: string): VideoObjectSchema[] {
  // Normalize: strip .md extension if present
  const slug = pageSlug.replace(/\.md$/, '');
  const videos = VIDEO_REGISTRY[slug];
  if (!videos) return [];
  return videos.map(toVideoObjectSchema);
}
