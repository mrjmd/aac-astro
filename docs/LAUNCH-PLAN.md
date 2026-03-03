# Attack A Crack: Launch Plan

> **Canonical task tracker.** Work through phases in order, checking off items as committed. New sessions: read this file first to find the next unchecked item.

## Overview

**Current State:** Sessions 0-3 complete, 70+ pages built, CI/CD passing, validation pipeline enforced.
**Goal:** Production-ready launch with accurate content, comprehensive local coverage, and all quality gates passing.
**Deployment:** https://aac-website-theta.vercel.app/

### User Decisions (Confirmed)

- Navigation: Simple hub links (not dropdowns)
- Team pages: Hardcoded only (no content files)
- City count for launch: 80 cities (20 CT, 30 MA, 10 each RI/NH/ME)
- Content scope: Services, FAQ, blog posts, About page story/values, Partners with testimonials
- "Repair" not "resurfacing" — 2-3x search volume advantage

---

## Sessions 0-3: COMPLETE (Historical Record)

<details>
<summary>Click to expand completed sessions</summary>

### Session 0: Immediate Technical Tasks

- [x] Block robots.txt to prevent staging indexing
- [x] Install @vercel/speed-insights
- [x] Add SpeedInsights component to Layout.astro
- [x] Create LAUNCH-PLAN.md document

### Session 1: Documentation & Quick Fixes

- [x] Archive legacy docs (SEO.md, KEYWORD-STRATEGY.md, MIGRATION-PLAN.md, REMAINING-TASKS.md, SEO-ENHANCEMENT-PLAN.md)
- [x] Fix all footer links (blog, partnerships, services, about, state hubs)
- [x] Remove team content files (keep hardcoded on About page)
- [x] Create Areas We Serve hub page with all 5 state links

### Session 2: Navigation & Linking

- [x] Add "Areas" link to navbar
- [x] Enhance Services hub (Foundation Types + Concrete Repair sections)
- [x] Fix orphan pages (foundation types, concrete repair, state hubs linked)

### Session 3: Content Migration

- [x] Migrate 9 blog posts from current attackacrack.com
- [x] Enhance About page (Our Story, Values, E-E-A-T signals)
- [x] Review partner pages and testimonials
- [x] FAQ content on service and location pages

### Additional Completed Work

- [x] Resurfacing → Repair rewrite (all content)
- [x] SEO enforcement pipeline (all checks are hard failures)
- [x] Homepage FAQ section with FAQPage schema
- [x] Homepage internal links and CTAs
- [x] Service image replacements with proper cropping

</details>

---

## Phase 1: Price Correction Sweep

**Priority: URGENT — do first. Inaccurate pricing erodes trust.**

Matt's principle: "Better for someone to expect they'll pay a little less than the quote they get."

### Correct Pricing Ranges

| Service | Wrong (on site now) | Correct |
|---------|-------------------|---------|
| Single crack injection | $300-$800 | **$800-$1,200** |
| Wall crack repair | $300-$800 | **$800-$1,200** |
| Bulkhead sealing | $400-$1,000 | **$1,800-$2,500** |
| Carbon fiber stitches | $800-$1,500/stitch | **$200-$300/stitch** |
| Sewer/conduit line | (unspecified) | **$650-$900** |
| Multi-crack jobs | $600-$1,800 for 2-3 | **"Significant multi-crack discounts available"** |
| Full wall stabilization | $5,000-$15,000 | **Review with Matt** |

### Tasks

- [x] Create pricing utility (`src/utils/pricing.ts`) as single source of truth
- [x] Create pricing settings file (`src/content/settings/pricing.json`)
- [x] Add pricing section to DecapCMS config (`public/admin/config.yml`)
- [x] Fix homepage FAQ pricing — `src/components/HomeFaq.astro` FAQ #3 ("$400-$800" → $800-$1,200)
- [x] Fix blog: `foundation-repair-cost-guide-2026.md` — full rewrite of cost table
- [x] Fix blog: `basement-waterproofing-vs-foundation-repair.md` — "$300-$2,500" range
- [x] Fix blog: `bulkhead-leaking-causes-and-fixes.md` — "$2,000-$5,000" bulkhead figure
- [x] Fix service page: `wall-crack-repair.md` — "$300-$800 per crack"
- [x] Fix all 10 CT location pages (all say "$500-$1,500"): bridgeport, danbury, greenwich, hartford, manchester, new-haven, norwalk, stamford, waterbury, west-hartford
- [x] Fix all 10 MA location pages (low-end ranges starting $450-$600): boston, brockton, cambridge, fall-river, framingham, new-bedford, newton, plymouth, quincy, worcester
- [x] Verify sweep complete: `grep -r '\$[0-9]' src/content/ src/components/` — no stale prices remain

---

## Phase 2: Page-Level Fixes

### 2A: Areas We Serve — Fix Layout

Issues: huge white gap between state cards and "Why New England Trusts Us", placeholder images, RI/NH/ME show "0+ cities".

- [x] Fix white gap between sections (reduced section padding)
- [x] Change "0+ cities" to "Expanding Soon" for states with no city pages yet
- [x] Tighten card layout for better visual density (compact inline headers)
- [x] Note placeholder images for Phase 8 (hero map, "Why Choose Us" photo)

File: `src/pages/areas-we-serve/index.astro`

### 2B: About Page — Fill Gaps

Issues: "What We Stand For" section has too much white space, placeholder image, thin E-E-A-T section, no real customer quotes.

- [x] Add visual treatment to "What We Stand For" section (dark bg with translucent cards)
- [x] Beef up E-E-A-T section with real stats (30+ years, 5 states, ASHI, 260+ reviews)
- [x] Add real customer testimonial section (completed in Phase 3)
- [x] Note placeholder image for Phase 8 (story section)

File: `src/pages/about.astro`

### 2C: Blog — Add Pagination

Currently 14 posts on one page, no pagination.

- [x] Add pagination to blog index (6 posts per page, `[...page].astro`)
- [x] Add pagination to category pages (`[category]/[...page].astro`)
- [x] Use Astro's built-in `paginate()` with `getStaticPaths()`
- [x] Add prev/next navigation UI (`Pagination.astro` component)

---

## Phase 3: Testimonials & Social Proof

Matt: "Pull quotes from the real reviews on Google. Let's do a lot more of that."

### 3A: Google Review Pull

- [x] Pull 20 customer quotes from Google reviews + existing site (names, cities, review text)
- [x] Categorize by: service type, location (CT vs MA), persona (homeowner, realtor, property manager)
- [x] Store in settings file (`src/content/settings/testimonials.json`) for reuse across pages

### 3B: Deploy Testimonials Across Site

- [x] Homepage: 4 featured review cards (was 2 hardcoded)
- [x] About page: customer testimonial section added
- [x] Service pages: service-specific reviews matched per page (2 per service page)
- [x] Location pages: auto-fallback from centralized data when no frontmatter testimonial
- [x] CT hub page: 3 CT-specific testimonials from centralized data
- [x] MA hub page: 3 MA-specific testimonials from centralized data

### 3C: Testimonial Infrastructure

- [x] Created `src/content/settings/testimonials.json` (20 testimonials)
- [x] Created `src/utils/testimonials.ts` (getFeatured, getByState, getByService, getForLocation)
- [x] Built reusable `<TestimonialCard />` component (light/dark variants)
- [x] Added testimonials to DecapCMS config for Matt to manage
- [ ] **Matt:** Verify testimonial quotes match actual Google reviews, add/edit as needed

---

## Phase 4: Partners Expansion

### 4A: New Partner Type Pages

Current: Realtors, Property Managers, Home Inspectors, Contractors.

| New Persona | Why They Refer |
|-------------|---------------|
| Insurance Adjusters | Encounter foundation claims regularly |
| Mold Remediation | Water intrusion from cracks causes mold — fix the source |
| Plumbers | Working in basements, see cracks/leaks constantly |
| Landscapers | Encounter concrete problems (walkways, patios, driveways, pool decks) |

Per page: unique value prop, service-specific benefits, referral program details, testimonial, FAQ with schema, volume/partner discount mention.

- [x] Create `src/content/partners/insurance-adjusters.md`
- [x] Create `src/content/partners/mold-remediation.md`
- [x] Create `src/content/partners/plumbers.md`
- [x] Create `src/content/partners/landscapers.md`
- [x] Partners index grid auto-populates from collection (no update needed)
- [ ] Brainstorm additional personas with Matt (waterproofing companies, basement finishing, real estate attorneys)

### 4B: Preferred/Trusted Partners Page (NEW)

Shell page for BNI chapter members and other recommended professionals. Content collection so it can grow over time.

- [ ] Create trusted partners content collection schema
- [ ] Create shell page `src/pages/partners/trusted.astro` (or `/recommended`)
- [ ] Add initial structure: intro text, empty partner grid, "coming soon" messaging
- [ ] Add to partners index and navigation
- [ ] Add to DecapCMS config for Matt to manage partner entries

---

## Phase 5: SEO Strategy Integration

Reference: `docs/SEO-STRATEGY-2026.md`

### 5A: Service Page Enhancements

- [ ] Add HowTo schema to all 6 service pages
- [ ] Add "cement" keyword variations in H2s where natural ("cement foundation repair" — 2,400 vol, rank #15-17)
- [ ] Expand FAQ answers — demonstrate expertise, not 2-sentence stubs
- [ ] Add "Available in CT & MA" sections with city page links
- [ ] Add author/expert attribution
- [ ] Note: real before/after photos deferred to Phase 8

Files: `src/pages/services/[slug].astro`, all 6 service content files

### 5B: Location Page Content Depth

- [ ] Add city-specific testimonials (from Phase 3A review pull)
- [ ] Verify >20% unique content between similar cities
- [ ] Add city-specific cost mentions using pricing utility (from Phase 1)
- [ ] Verify nearby city cross-links are working
- [ ] Add city-specific FAQ answers ("How much does foundation repair cost in [City]?")

### 5C: Blog Content Gaps

High-priority new posts:

| Topic | Volume | KD |
|-------|--------|-----|
| Horizontal Foundation Cracks: Causes & Solutions | 3,600 | 9 |
| Signs of Foundation Problems | 4,400 | 21 |
| Foundation Settling: When to Worry | 4,400 | 12 |
| Basement Floor Cracks Leaking Water | 210 | 6 |
| Water in Basement After Rain | 480 | 11 |
| Bulkhead Repair Cost Guide 2026 | 480 | 4 |

- [ ] Write: Horizontal Foundation Cracks
- [ ] Write: Signs of Foundation Problems
- [ ] Write: Foundation Settling: When to Worry
- [ ] Write: Basement Floor Cracks Leaking Water
- [ ] Write: Water in Basement After Rain
- [ ] Write: Bulkhead Repair Cost Guide 2026
- [ ] Review/update existing: `foundation-repair-cost-guide-2026.md` (pricing — Phase 1)
- [ ] Review/update existing: `vertical-vs-horizontal-foundation-cracks.md`

### 5D: Internal Linking Strategy

Blog (Problem) → Service (Solution) → City (Local):

- [ ] Add contextual links from blog posts to relevant service pages
- [ ] Add "Common in [City]" links from service pages to city pages
- [ ] Add "Related Articles" section at bottom of blog posts
- [ ] Cross-link nearby cities on location pages
- [ ] Link from partner pages to relevant services
- [ ] Audit and fix orphan pages identified by `validate:links`

### 5E: Schema Additions

- [ ] HowTo schema on all 6 service pages (covered in 5A)
- [ ] Verify Article/BlogPosting schema on blog posts
- [ ] Plan ImageObject schema for before/after photos (when real photos available)

---

## Phase 6: City Page Generation

### Target: 80 cities total

| State | Have | Target | Remaining |
|-------|------|--------|-----------|
| CT | 10 | 20 | 10 |
| MA | 10 | 30 | 20 |
| RI | 0 | 10 | 10 |
| NH | 0 | 10 | 10 |
| ME | 0 | 10 | 10 |
| **Total** | **20** | **80** | **60** |

### Content Quality Requirements (per city)

- Unique narrative (neighborhoods, soil conditions, home age, local challenges)
- Correct pricing from pricing utility (Phase 1)
- 3 unique FAQs with city-specific answers
- Real testimonial if available (from Phase 3A)
- nearbyCities cross-links
- Unique meta title and description (validated by `check:seo`)

### Tasks

- [ ] Generate remaining 10 CT city pages
- [ ] Generate 20 MA city pages
- [ ] Generate 10 RI city pages
- [ ] Generate 10 NH city pages
- [ ] Generate 10 ME city pages
- [ ] Validate all new pages pass `npm run validate`
- [ ] Run uniqueness check (Phase 9 script) against all city pages

---

## Phase 7: Performance Deep Dive

Matt: "We need to do a deep dive of performance for each section and really ensure all the best practices and our Lighthouse scores are rocking everywhere."

### Lighthouse Audit — Every Page Type

Run full Lighthouse on representative pages:

- [ ] Homepage
- [ ] Service page (e.g., foundation-crack-injection)
- [ ] Location page (e.g., connecticut/hartford)
- [ ] Blog post
- [ ] Blog index
- [ ] About page
- [ ] Areas We Serve
- [ ] Partners page

### Console Error Audit

- [ ] Check browser console on every page type above — zero errors allowed
- [ ] Document and resolve every issue found

### Core Web Vitals Targets

- LCP < 2.5s
- CLS < 0.1
- INP < 200ms

### Performance Checklist

- [ ] Image optimization (proper sizing, formats, lazy loading)
- [ ] Font loading strategy (preload critical fonts)
- [ ] CSS bundle size review (Tailwind purge working)
- [ ] JS bundle analysis (minimal JS on static pages)
- [ ] Check for CLS from `[data-animate]` elements (opacity transitions)
- [ ] Verify cache headers from Vercel
- [ ] Server response time check

---

## Phase 8: Imagery Replacement

**Blocked on Matt providing real photos.**

### Placeholder Images Requiring Real Assets

| Location | Current | Needed |
|----------|---------|--------|
| OG default | picsum | Branded OG image (1200x630) |
| About page story | picsum | Team/job site photo |
| Areas We Serve hero | picsum | New England service area map |
| Areas We Serve "Why Us" | picsum | Team on job site |
| CT hub hero | picsum | Connecticut landscape/job |
| MA hub hero | picsum | Massachusetts landscape/job |
| RI hub hero | picsum | Rhode Island landscape/job |
| NH hub hero | picsum | New Hampshire landscape/job |
| ME hub hero | picsum | Maine landscape/job |
| City pages (20) | picsum | Local/regional photos |
| Blog posts | picsum | Post-specific images |
| Team (Edward) | placeholder.svg | Real headshot |

### Pre-Launch Image Tasks

- [ ] Replace all placeholder images as Matt provides assets
- [ ] Remove picsum.photos whitelist from `check-images.js` (make placeholders a build error)
- [ ] Optimize all new images (proper sizing, WebP/AVIF where supported)
- [ ] Verify all images have meaningful alt text

---

## Phase 9: Validation & CI Hardening

### 9A: Uniqueness Validation Script

Matt: "I definitely want to add a validate uniqueness script to flag >80% content similarity between city pages."

- [ ] Create `scripts/validate-uniqueness.js` — compare text content of city pages
- [ ] Flag any pair with >80% similarity as an error
- [ ] Add `npm run validate:uniqueness` to `package.json`
- [ ] Add to CI pipeline (`quality.yml`)
- [ ] Add to `npm run validate` chain

### 9B: Lighthouse Warnings → Hard Failures

Matt: "In the CI they are currently just set as warnings, but before we launch those warnings need to be fully resolved."

- [ ] Audit all current Lighthouse warnings across page types
- [ ] Resolve every warning
- [ ] Update `lighthouserc.cjs` to make warnings into errors
- [ ] Verify CI fails on any Lighthouse regression

### 9C: Full Validation Sweep

- [ ] `npm run build` passes clean
- [ ] `npm run validate:schema` passes
- [ ] `npm run check:images` passes (no placeholders)
- [ ] `npm run check:seo` passes
- [ ] `npm run check:a11y` passes
- [ ] `npm run validate:links` passes
- [ ] `npm run validate:uniqueness` passes
- [ ] Lighthouse CI passes with error-level thresholds

---

## Phase 10: Pre-Launch Checklist

### Automated Validation

- [ ] Full `npm run validate` pass
- [ ] Lighthouse: Performance 90+, Accessibility 95+, SEO 95+
- [ ] No placeholder images remain
- [ ] All pricing claims verified correct
- [ ] Uniqueness validation passes

### Manual QA

- [ ] All navigation links work
- [ ] All footer links work
- [ ] Contact forms submit correctly
- [ ] Phone numbers correct: CT (860) 573-8760, MA (617) 668-1677
- [ ] Addresses correct: CT 23 Elsmere Road, Amston, CT 06231; MA 30 Randlett St #2, Quincy, MA 02169
- [ ] "240+ Google reviews" claim is current
- [ ] Images load on all pages
- [ ] Mobile responsive (iPhone, Android)
- [ ] Schema validates in Google Rich Results Test
- [ ] Favicon displays correctly

### DNS Cutover

- [ ] Switch `public/robots.txt` to allow crawling
- [ ] Remove `is-crawlable: 'off'` from `lighthouserc.cjs`
- [ ] Backup current site
- [ ] Point attackacrack.com DNS to Vercel
- [ ] Verify SSL certificate
- [ ] Test all redirects work (`vercel.json`)
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor for 404 errors

---

## Matt's Action Items (Blocking)

These require Matt's input before Claude can proceed:

- [ ] **Provide real photos** for 17+ placeholder locations (Phase 8)
- [ ] **Confirm full wall stabilization pricing** ($5,000-$15,000 — still correct?) (Phase 1)
- [ ] **Provide partner testimonials** for new persona types (Phase 4)
- [ ] **Finalize new partner persona list** (insurance adjusters, mold, plumbers, landscapers + others?) (Phase 4)
- [ ] **Name the trusted partners page** (Preferred Partners? Trusted Partners? Recommended?) (Phase 4B)
- [ ] **Set up GitHub OAuth** for DecapCMS editor authentication
- [ ] **Add Vercel secrets** to GitHub (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- [ ] **Set up monitoring:** Google Search Console, GA4, uptime monitoring, error tracking
- [ ] **Verify "240+ Google reviews" claim** is still accurate

---

## Post-Launch Tasks

### Week 1

- [ ] Monitor Google Search Console for errors
- [ ] Monitor uptime alerts
- [ ] Fix any 404s from old URLs
- [ ] Submit to Bing Webmaster Tools
- [ ] Begin GBP optimization

### Month 1

- [ ] Publish 2-4 blog posts (per content calendar)
- [ ] Add 20+ more city pages
- [ ] Begin review acquisition campaign
- [ ] Citation audit and fixes

---

## Blog Content Priority (Reference)

### Tier 1: High Volume, Low Difficulty

| Topic | Volume | KD | Status |
|-------|--------|-----|--------|
| Foundation Repair Cost Guide 2026 | 8,100 | 12 | Exists — needs pricing rewrite |
| Horizontal vs Vertical Foundation Cracks | 3,600 | 9 | Needed |
| Signs of Foundation Problems | 4,400 | 21 | Needed |
| Bulkhead Repair Cost Guide | 480 | 4 | Needed |
| Foundation Settling: When to Worry | 4,400 | 12 | Needed |

### Tier 2: Problem-Aware Content

| Topic | Volume | KD |
|-------|--------|-----|
| Water in Basement After Rain | 480 | 11 |
| Cracks in Basement Floor Leaking | 210 | 6 |
| What Causes Concrete to Crack | 720 | 15 |

### Tier 3: Consumer Language Content

| Topic | Target Keywords |
|-------|-----------------|
| Cement vs Concrete: What Homeowners Need to Know | cement repair terms |
| Pool Deck Repair Guide | concrete pool deck repair (5,400 vol) |
| Driveway Crack Repair Guide | driveway crack repair (1,900 vol) |

---

## Reference Documents

- `docs/SEO-STRATEGY-2026.md` — Detailed SEO execution strategy (17 parts)
- `CLAUDE.md` — Project rules and validation requirements
