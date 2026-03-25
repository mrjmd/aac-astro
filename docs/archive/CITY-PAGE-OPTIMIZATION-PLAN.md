# City Page Conversion Optimization Plan

> **Status:** Planning — implement before paid traffic ramps up significantly
> **Created:** March 24, 2026
> **Context:** 60 MA city ad groups live in Google Ads, all landing on city pages. Desktop +25% bid and hourly schedule applied.

---

## Why This Matters

City pages were built for SEO — comprehensive content, schema markup, internal linking, and local relevance. They're excellent organic landing pages. But **paid traffic behaves differently**:

- Visitors have already expressed intent (they searched and clicked an ad)
- They want to act fast — call, text, or submit a form
- They don't know the brand yet (unlike organic visitors who may have seen the site before)
- **79% of ad spend is mobile** — the phone is the conversion device
- **Desktop just got a +25% bid boost** — those visitors prefer forms over calling

The current city pages need conversion-focused enhancements without hurting their SEO performance.

---

## Current State Audit

### What's Already Strong

| Element | Assessment |
|---------|-----------|
| Hero section | City name in H1, phone CTA + "Text Us Photos" above fold |
| Phone number | Clickable `tel:` link with GA4 tracking |
| Trust badges | 5-Star Reviews, Lifetime Guarantee in hero |
| Pricing section | Transparent pricing pre-qualifies leads |
| FAQs | City-specific with schema markup |
| Testimonial | Social proof (one per page) |
| Services grid | Full capability display |
| Nearby cities | Internal linking for SEO |
| Blog guides | Topical authority |
| Schema markup | HomeAndConstructionBusiness + FAQPage |

### Conversion Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| **No sticky mobile CTA** | Phone number scrolls off screen immediately. 79% of traffic is mobile. | P0 |
| **No review count near hero** | Paid visitors don't know the brand — "260+ 5-Star Reviews" builds instant trust | P0 |
| **Hero image hidden on mobile** | `hidden lg:block` — mobile sees only text, no visual credibility | P1 |
| **No form option** | Desktop visitors (+25% bid) may prefer form over calling | P1 |
| **No urgency signals** | "Same-day estimates" in ad copy but not on page | P2 |
| **Testimonial buried** | Social proof is below services, pricing, FAQs — too far for paid visitors | P2 |
| **Content-heavy middle** | Great for SEO, but paid visitors don't need convincing — they need CTAs | P2 |

---

## Phase 1: Quick Wins (Before Paid Traffic Ramps)

### 1A. Sticky Mobile CTA Bar

**What:** Fixed-bottom bar on mobile/tablet with "Call Now" and "Text Photos" buttons, always visible while scrolling. Hidden on desktop.

**Component:** `src/components/StickyCTA.astro`

**Design spec:**
- Fixed bottom, full width, z-40 (below navbar z-50 and modal z-[100])
- `lg:hidden` — mobile/tablet only
- Two buttons: yellow "Call Now" (`tel:` link) + dark "Text Photos" (`.open-modal` trigger)
- Compact height (~56px)
- Hidden initially, appears on scroll past hero section (IntersectionObserver)
- Small "260+ 5-Star Reviews" text between buttons

**Z-index stack (no conflicts):**
```
z-[100]  — LocationModal (existing)
z-[60]   — Mobile menu (existing)
z-50     — Navbar (existing)
z-40     — StickyCTA (new)
```

**Integration:**
- Import in all 5 city page templates (`src/pages/{state}/[city].astro`)
- Pass phone number and state as props
- Add `id="hero-section"` to hero `<section>` for scroll detection
- Add `pb-16 lg:pb-0` to prevent content from being covered

**Tracking:** Existing GA4 inline script in Layout.astro auto-tracks all `tel:` and `.open-modal` clicks. No new tracking code needed.

### 1B. Compact Review Snippet in Hero

**What:** Add "260+ 5-Star Google Reviews" with star icons near the hero CTA buttons.

**Implementation:** Single line addition in hero markup using existing `reviewCountDisplay` from `src/utils/reviews.ts`. Link to Google Reviews URL from `src/utils/reviews.ts`.

**Files:** All 5 city page templates.

---

## Phase 2: Deeper Optimizations (After Initial Conversion Data — April/May)

### 2A. Lead Capture Form

**What:** Simple "Get a Free Quote" form for desktop visitors who prefer not to call. Fields: name, phone, city, describe your problem.

**Options:**
- Embedded form on city pages (desktop only, `hidden lg:block`)
- Modal form triggered by a third CTA button
- Third-party form service (Typeform, Google Forms embed) — simplest to start

**Consideration:** Form submissions need to be tracked as conversions in GA4 and Google Ads. This requires a new event (`form_submit_click`) and a thank-you page or inline confirmation.

### 2B. Urgency Signals

**What:** Contextual urgency that's honest, not fake:
- "Spring scheduling filling up — call for availability"
- "Same-day estimates available"
- "Currently serving [city] this week"

**Implementation:** Seasonal banner or badge in hero section. Can be date-driven (show spring message March–May, winter prep message Sept–Nov).

### 2C. Testimonial Promotion

**What:** Move a compact review snippet higher on the page — below the hero, above the content. Keep the full testimonial section where it is for scroll depth.

**Implementation:** Small card with quote excerpt, author, stars. Uses existing testimonial data from frontmatter/centralized pool.

### 2D. Content Reorganization

**What:** For paid visitors, reorder sections to front-load conversion elements:
1. Hero with CTAs
2. ProcessBar (how it works)
3. Review snippet
4. Pricing (key decision factor)
5. Services
6. Content / FAQs / Blog (SEO value, but below conversion elements)

**Consideration:** This changes the page for ALL visitors (organic + paid). If we want different ordering for paid vs organic, that requires Phase 3 (dedicated landing page).

---

## Phase 3: Paid-Only Landing Page (When Data Supports It — June+)

### 3A. Dedicated `/lp/{state}/{city}` Template

**What:** Stripped-down landing page optimized purely for paid traffic conversion. Points Google Ads RSAs here instead of the SEO city pages.

**Design:**
- Shorter — hero, pricing, 1 testimonial, form, phone CTA
- No blog links, no nearby cities, no long-form content (SEO doesn't matter for ads-only pages)
- `noindex` (no organic ranking needed)
- Stronger urgency and social proof
- A/B test against city pages via Google Ads experiment

**When:** Only worth building once we have conversion data to benchmark against. Need 2-4 weeks of data from the current city pages first.

### 3B. Google Ads Experiments

**What:** Run a proper A/B test: 50% of ad traffic → city page, 50% → `/lp/` page. Measure conversion rate difference.

**Prerequisites:** Conversion tracking must be recording data (2+ weeks). Minimum 100 clicks per variant for statistical significance.

---

## Google Ads Keyword Fix: Low Search Volume

### Problem

195 of 360 city-specific keywords flagged as "low search volume" by Google Ads. These keywords won't serve ads. The 11 smallest cities (Bourne, Cohasset, Dennis, Duxbury, Foxborough, Hull, Mashpee, Norwell, Sandwich, Swansea, Whitman) have ALL keywords dead.

### Root Cause

Hyper-local long-tail keywords like "foundation repair norwell" don't have enough monthly search volume for Google to activate them. This is normal for smaller cities.

### Solution

Add **broader keywords without city names** to each city ad group. The campaign's location targeting handles geographic filtering; the city landing page URL and RSA headlines provide local relevance.

**Keywords to add per city ad group:**
- `"foundation repair near me"` (PHRASE)
- `"basement crack repair"` (PHRASE)
- `"foundation contractor"` (PHRASE)
- `"basement waterproofing"` (PHRASE)

**Implementation:** Add `--add-broad` mode to `scripts/google-ads-keywords.js`:
```bash
npm run ads:keywords -- --add-broad --campaign "Leads-Search-3" [--execute]
```

**Expected outcome:** Each city ad group will have a mix of city-specific keywords (for larger cities where they work) plus broader keywords that trigger for users in the geographic area, landing on the city-specific page.

---

## Technical Reference

### Existing Utilities to Reuse

| Utility | Path | Provides |
|---------|------|----------|
| Phone numbers | `src/utils/contact.ts` | `phoneMA`, `phoneCT`, `phoneMAHref`, `phoneCTHref` |
| Review data | `src/utils/reviews.ts` | `reviewCountDisplay` ("260+"), `rating`, Google Review URLs |
| Modal trigger | `src/components/LocationModal.astro` | Triggered by `.open-modal` class on any button |
| GA4 tracking | `src/layouts/Layout.astro` | Auto-tracks all `tel:` and `sms:` link clicks |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/StickyCTA.astro` | **New** — sticky bottom CTA component |
| `src/pages/massachusetts/[city].astro` | Import StickyCTA, add hero id, review snippet, footer padding |
| `src/pages/connecticut/[city].astro` | Same |
| `src/pages/new-hampshire/[city].astro` | Same |
| `src/pages/rhode-island/[city].astro` | Same |
| `src/pages/maine/[city].astro` | Same |
| `scripts/google-ads-keywords.js` | Add `--add-broad` mode |

---

## Implementation Checklist

### Phase 1 (This Week)
- [ ] Build `StickyCTA.astro` component
- [ ] Add sticky CTA to all 5 state city page templates
- [ ] Add review snippet to hero section on all city page templates
- [ ] Screenshot verify mobile (375px) — sticky bar visible, no overlap
- [ ] Screenshot verify desktop — sticky bar hidden
- [ ] Run `npm run validate` — all checks pass
- [ ] Add `--add-broad` mode to `google-ads-keywords.js`
- [ ] Run broader keywords: `npm run ads:keywords -- --add-broad --campaign "Leads-Search-3" --execute`

### Phase 2 (April)
- [ ] Add lead capture form (desktop visitors)
- [ ] Add seasonal urgency banner
- [ ] Move compact testimonial higher on page
- [ ] Evaluate content section reordering

### Phase 3 (June+, data-dependent)
- [ ] Build `/lp/{state}/{city}` template
- [ ] Set up Google Ads experiment (50/50 split)
- [ ] Analyze results after 2 weeks / 200+ clicks
