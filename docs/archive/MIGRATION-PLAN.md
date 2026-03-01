# Attack A Crack: Best-in-Class SEO Migration Plan

## Executive Summary

Transform the existing Squarespace site (attackacrack.com) into a high-performance, SEO-dominant Astro site with 100+ location pages, expanded blog architecture, and comprehensive local SEO targeting for Connecticut and Massachusetts markets.

### Key Decisions
- **Hosting:** Vercel (automatic previews, excellent Astro support)
- **Images:** Partially ready - will use available photos, placeholder strategy for gaps
- **City Content:** AI-assisted generation with human review
- **Launch Strategy:** Core + major cities first (services, blog, state hubs + top 20 cities), then expand

### Expanded Scope (Added)
- **MA-Only Services:** Concrete resurfacing line (stairway, walkway, driveway, garage, pool deck, patio)
- **Educational Content:** Foundation types (fieldstone, cinderblock), services we don't do
- **Production Pipeline:** Automated SEO/performance validation in CI/CD
- **Blog CMS:** API + GUI for non-technical publishing with automatic SEO validation

---

## Current State Analysis

### Live Squarespace Site (attackacrack.com)
- **Pages:** 6 service pages, 2 state pages, blog, partners section
- **SEO:** LocalBusiness schema, proper meta tags, sitemap
- **Strengths:** Good local signals, dual-market targeting (CT/MA), 240+ Google reviews
- **Weaknesses:** Squarespace platform limitations, limited city-level targeting

### Current Astro Codebase (`/Users/matt/Projects/aac-astro`)
- **Stack:** Astro 5.18, Tailwind CSS 4.2.1, TypeScript
- **Pages:** 5 static pages (/, /about, /services, /blog, /partners)
- **SEO Foundation:** LocalBusiness schema, sitemap, geo-tags, canonical URLs
- **Gaps:**
  - All content hardcoded (no Content Collections)
  - Placeholder images (picsum.photos)
  - No dynamic routes
  - No location/city pages
  - Blog is static mockup (3 hardcoded posts)

### Old-Version Directory (React SPA)
- Contains content and design patterns to reference
- Not SEO-friendly (client-side rendered)
- Good visual design already migrated to Astro

---

## Architecture Transformation

### A. Content Collections Structure

Create `src/content/` with typed collections:

```
src/content/
  config.ts                    # Schema definitions

  services/                    # Foundation repair services (CT + MA)
    wall-crack-repair.md
    leaky-bulkhead-repair.md
    sewer-well-conduit-line-repair.md
    foundation-crack-injection.md
    carbon-fiber-stitches.md
    free-foundation-consultations.md

  resurfacing/                 # Concrete resurfacing (MA-ONLY)
    stairway.md
    walkway.md
    driveway.md
    garage.md
    pool-deck.md
    patio.md

  foundation-types/            # Educational content
    fieldstone.md
    cinderblock.md
    poured-concrete.md         # Optional: add more types

  resources/                   # Additional educational content
    what-we-dont-do.md         # Services we don't offer but can identify

  blog/                        # 20+ blog posts (migrated + new)

  locations/
    connecticut/               # 30+ CT city pages
    massachusetts/             # 80+ MA city pages

  team/                        # 5 team member profiles

  faqs/                        # Service-specific FAQs
```

**Schema Design (`src/content/config.ts`):**
- `services`: title, slug, metaTitle, metaDescription, icon, beforeImage, afterImage, faqs[]
- `blog`: title, publishDate, author, category, tags, excerpt, heroImage, relatedPosts[]
- `locations`: city, state, region, phoneNumber, nearbyCities[], localKeywords[], uniqueContent
- `team`: name, role, location, image, bio, specialties[]

### B. URL Architecture (SEO Silo Strategy)

```
/                                    # Homepage
/services                            # Service hub (all services)
/services/[slug]                     # Foundation repair services (CT + MA)

# MA-Only Concrete Resurfacing Section
/concrete-resurfacing                # Resurfacing hub (MA-only badge prominent)
/concrete-resurfacing/stairway       # Stairway resurfacing
/concrete-resurfacing/walkway        # Walkway resurfacing
/concrete-resurfacing/driveway       # Driveway resurfacing
/concrete-resurfacing/garage         # Garage floor resurfacing
/concrete-resurfacing/pool-deck      # Pool deck resurfacing
/concrete-resurfacing/patio          # Patio resurfacing

# Educational/Resource Pages
/foundation-types/fieldstone         # Fieldstone foundation guide
/foundation-types/cinderblock        # Cinderblock foundation guide
/what-we-dont-do                     # Services we don't do (but can help identify)

# Location Pages
/connecticut                         # CT state hub
/connecticut/[city]                  # 30+ CT city pages
/massachusetts                       # MA state hub
/massachusetts/[city]                # 80+ MA city pages

# Blog
/blog                                # Blog index (paginated)
/blog/[slug]                         # Individual posts
/blog/category/[category]            # Category archives

# Other
/about                               # About/Team
/partners                            # Partner hub
/partners/[type]                     # 4 partner type pages
```

### C. Dynamic Route Templates

| Template | Location | Purpose |
|----------|----------|---------|
| `[slug].astro` | `src/pages/services/` | Service detail pages |
| `[city].astro` | `src/pages/connecticut/` | CT city pages |
| `[city].astro` | `src/pages/massachusetts/` | MA city pages |
| `[slug].astro` | `src/pages/blog/` | Blog posts |
| `[category].astro` | `src/pages/blog/category/` | Category archives |
| `[type].astro` | `src/pages/partners/` | Partner pages |

---

## Local SEO Strategy

### City Page Expansion

**Connecticut (30 cities):**
Hartford, New Haven, Bridgeport, Stamford, Waterbury, Danbury, Norwalk, Greenwich, Fairfield, Westport, Middletown, Manchester, Bristol, New London, Norwich, Meriden, West Hartford, Glastonbury, East Hartford, Southington, Vernon, Torrington, Wallingford, Naugatuck, Groton, Cheshire, Shelton, Milford, Stratford, Enfield

**Massachusetts (80 cities):**
- Metro Boston: Boston, Cambridge, Somerville, Newton, Brookline, Quincy, Braintree, Weymouth, Milton
- North Shore: Salem, Beverly, Gloucester, Peabody, Lynn, Haverhill, Lawrence
- South Shore: Plymouth, Brockton, Fall River, New Bedford, Taunton, Marshfield, Scituate
- Central/West: Worcester, Springfield, Fitchburg, Leominster, Framingham, Natick

### Unique Content Per City (Avoiding Thin Content)

Each city page will include:
1. **City-specific intro** referencing local landmarks/neighborhoods
2. **Local statistics** (population, average home age, common foundation types)
3. **Neighborhood coverage list**
4. **City-specific testimonial** (where available)
5. **Local service considerations** (soil conditions, climate factors)
6. **Unique FAQ section** ("How much does foundation repair cost in [City]?")
7. **Nearby cities internal links**

### Schema Markup Strategy

| Page Type | Schema Types |
|-----------|-------------|
| Homepage | WebSite, Organization |
| Service Pages | Service, FAQPage |
| Location Pages | LocalBusiness, AggregateRating, FAQPage |
| Blog Posts | Article, FAQPage (if applicable) |
| State Hubs | LocalBusiness with areaServed |

---

## Blog Expansion Strategy

### Content Categories
1. **guides** - Educational how-to content
2. **case-studies** - Project showcases with before/after
3. **cost-guides** - Pricing and budgeting information
4. **maintenance-tips** - Seasonal/preventive content
5. **news** - Industry and company updates

### Initial Blog Posts (20 articles)

**From Squarespace (migrate existing):**
- All existing blog content with preserved URLs

**New High-Value Content:**
- "Foundation Repair Cost Guide 2026: CT & MA Pricing"
- "Vertical vs Horizontal Foundation Cracks: What's Worse?"
- "When to Worry About Foundation Cracks"
- "Basement Waterproofing vs Foundation Repair"
- "Signs Your Bulkhead Needs Repair"
- "DIY vs Professional Foundation Repair"
- "How Long Does Foundation Repair Take?"
- "Foundation Problems in Older New England Homes"
- City-specific guides for major markets

### Blog Post Template Features
- Article schema with author attribution
- Related posts component
- Service page internal links
- Location-relevant CTA
- Table of contents for long-form content

---

## Performance Optimization

### Image Strategy
1. Replace all picsum.photos placeholders with real images
2. Use Astro's `<Image />` component for automatic WebP/AVIF
3. Implement responsive images with `widths` and `sizes`
4. Lazy load below-fold images
5. Organize in `src/assets/images/` by type

### Core Web Vitals Targets
| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID/INP | < 100ms |
| CLS | < 0.1 |

### Font Optimization
- Self-host Inter and Space Grotesk using @fontsource
- Implement font-display: swap
- Subset to needed characters only

### Caching & CDN
- Deploy to Vercel
- 1-year cache for static assets (/_astro/*)
- Brotli compression enabled
- Edge caching for HTML

---

## Production Pipeline (CI/CD Quality Gates)

### Automated Checks (GitHub Actions / Vercel Build)

Every build will run these checks - **failing any check blocks deployment**:

#### 1. Performance Checks
```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    budgetPath: ./lighthouse-budget.json
    # Fail if any page scores below thresholds
```

**Thresholds (lighthouse-budget.json):**
```json
{
  "performance": 90,
  "accessibility": 95,
  "best-practices": 90,
  "seo": 95
}
```

#### 2. JSON Schema Validation
```bash
# Custom script to validate all JSON-LD on every page
npm run validate:schema
```

**Validates:**
- LocalBusiness schema on location pages
- Service schema on service pages
- Article schema on blog posts
- FAQPage schema where present
- AggregateRating structure

#### 3. Image Optimization Checks
```bash
# Ensure no unoptimized images slip through
npm run check:images
```

**Validates:**
- All images use Astro's `<Image />` component (no raw `<img>`)
- No external image URLs (except whitelisted CDNs)
- All images have alt text
- All images have width/height defined (CLS prevention)
- Images are in `src/assets/` not `public/`

#### 4. Metadata Checks
```bash
npm run check:seo
```

**Validates per page:**
- Title exists and is 50-60 characters
- Meta description exists and is 150-160 characters
- Canonical URL is set
- Open Graph tags present (og:title, og:description, og:image)
- H1 tag exists and is unique per page
- No duplicate titles/descriptions across site

#### 5. Content Collection Validation
- Zod schemas enforce required fields at build time
- Missing required fields = build failure
- Type mismatches = build failure

### Pipeline Configuration

**GitHub Actions Workflow (`.github/workflows/quality.yml`):**
```yaml
name: Quality Gates

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Site
        run: npm run build

      - name: Validate Schema
        run: npm run validate:schema

      - name: Check Images
        run: npm run check:images

      - name: Check SEO
        run: npm run check:seo

      - name: Lighthouse Audit
        uses: treosh/lighthouse-ci-action@v9
        with:
          uploadArtifacts: true
          budgetPath: ./lighthouse-budget.json

  deploy:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        # Only deploys if all quality gates pass
```

### Custom Validation Scripts

**`scripts/validate-schema.js`:**
- Crawls built HTML files
- Extracts JSON-LD scripts
- Validates against Schema.org standards
- Reports errors with file paths

**`scripts/check-images.js`:**
- AST parses Astro components
- Flags any `<img>` tags not using Image component
- Checks for missing alt attributes
- Verifies image assets exist

**`scripts/check-seo.js`:**
- Parses built HTML
- Validates meta tag presence and length
- Checks for duplicate titles/descriptions
- Validates heading hierarchy

---

## Blog CMS Architecture (Decap CMS)

### Overview
Non-technical users need a simple way to publish blog posts while ensuring every post meets SEO requirements automatically. We'll use Decap CMS (formerly Netlify CMS) - a free, git-based CMS.

### How It Works
1. Editor visits `attackacrack.com/admin`
2. Logs in via GitHub OAuth
3. Fills out blog post form with required fields
4. Decap validates all required fields before allowing save
5. On publish, commits directly to repo (or creates PR for review)
6. GitHub Actions runs quality gates
7. If passes, auto-deploys to Vercel
8. If fails, deployment blocked with error notification

### Setup Requirements
```
public/
  admin/
    index.html          # Decap CMS app loader
    config.yml          # Collection schemas, fields, validation
```

### Benefits
- **Free** - No hosting costs
- **Version controlled** - All content in git history
- **No backend** - Static files only
- **Built-in validation** - Required fields enforced in UI
- **Preview mode** - See post before publishing

### Publishing Flow
```
Editor writes post → Decap validates → Git commit → GitHub Actions →
Quality gates pass? → Yes: Deploy to Vercel → Live in ~2-3 min
                   → No: Block deploy, notify editor of issues
```

### Blog Post Schema (Required Fields)

```yaml
# Enforced by CMS or Content Collection schema
title:
  required: true
  min_length: 30
  max_length: 60

meta_description:
  required: true
  min_length: 120
  max_length: 160

slug:
  required: true
  pattern: "^[a-z0-9-]+$"

category:
  required: true
  options: [guides, case-studies, cost-guides, maintenance-tips, news]

hero_image:
  required: true
  # Must be uploaded, not external URL

hero_image_alt:
  required: true
  min_length: 10

author:
  required: true
  # Select from team collection

publish_date:
  required: true

excerpt:
  required: true
  min_length: 100
  max_length: 200

target_location:
  required: false
  # Optional: CT, MA, or specific city for geo-targeting

body:
  required: true
  min_length: 800  # Enforce substantial content
```

### SEO Validation in CMS UI

**Real-time feedback as user types:**
- Title character counter (turns red if too long/short)
- Description character counter
- Slug validation (no spaces, lowercase only)
- Image alt text required before publish
- Estimated reading time displayed
- SEO score preview (like Yoast)

### Geo-Specific SEO for Blog Posts

When `target_location` is set:
- Auto-inject location into title: "Foundation Repair Tips for Boston Homeowners"
- Add location to meta description
- Include city in schema markup
- Auto-link to relevant city page
- Show in city page's "Local Resources" section

---

## Migration Plan

### URL Redirects (301)

| Old Squarespace URL | New Astro URL |
|---------------------|---------------|
| `/wall-crack-repair` | `/services/wall-crack-repair` |
| `/leaky-bulkhead-repair` | `/services/leaky-bulkhead-repair` |
| `/sewer-well-conduit-line-repair` | `/services/sewer-well-conduit-line-repair` |
| `/foundation-crack-injection` | `/services/foundation-crack-injection` |
| `/carbon-fiber-stitches` | `/services/carbon-fiber-stitches` |
| `/free-foundation-consultations` | `/services/free-foundation-consultations` |
| `/connecticut` | `/connecticut` (no change) |
| `/massachusetts` | `/massachusetts` (no change) |
| `/blog/*` | `/blog/*` (preserve slugs) |

### Redirect Implementation
Create `vercel.json` with 301 redirect rules:

```json
{
  "redirects": [
    { "source": "/wall-crack-repair", "destination": "/services/wall-crack-repair", "permanent": true },
    { "source": "/leaky-bulkhead-repair", "destination": "/services/leaky-bulkhead-repair", "permanent": true },
    { "source": "/sewer-well-conduit-line-repair", "destination": "/services/sewer-well-conduit-line-repair", "permanent": true },
    { "source": "/foundation-crack-injection", "destination": "/services/foundation-crack-injection", "permanent": true },
    { "source": "/carbon-fiber-stitches", "destination": "/services/carbon-fiber-stitches", "permanent": true },
    { "source": "/free-foundation-consultations", "destination": "/services/free-foundation-consultations", "permanent": true }
  ]
}
```

---

## Implementation Phases

### Phase 0: Documentation & Version Control (Before Any Changes)
- [x] Copy this plan to `docs/MIGRATION-PLAN.md`
- [ ] Commit and push to GitHub
- [ ] Verify remote is up to date

**Commit Strategy (Throughout Project):**
- Commit after completing each phase
- Commit after any significant milestone within a phase
- Push to remote after each commit
- Use descriptive commit messages referencing the phase

### Phase 1: Content Collections Foundation (Week 1)
- [ ] Create `src/content/config.ts` with all schemas
- [ ] Create collection directory structure
- [ ] Migrate team data to `src/content/team/`
- [ ] Migrate service data to `src/content/services/`
- [ ] Create reusable components: Breadcrumbs, SchemaMarkup, SEOHead

**Critical Files:**
- `src/content/config.ts` (new)
- `src/layouts/Layout.astro` (enhance)
- `src/components/Breadcrumbs.astro` (new)

### Phase 2: Service Pages Architecture (Week 1-2)
- [ ] Create `/services/index.astro` hub page
- [ ] Create `/services/[slug].astro` dynamic route
- [ ] Migrate 6 service pages with full content
- [ ] Implement Service + FAQPage schema
- [ ] Add before/after image toggle
- [ ] Internal linking to related services

**Critical Files:**
- `src/pages/services/index.astro` (new)
- `src/pages/services/[slug].astro` (new)

### Phase 3: Blog Architecture (Week 2)
- [ ] Migrate all Squarespace blog posts to markdown
- [ ] Create `/blog/[slug].astro` dynamic route
- [ ] Create `/blog/category/[category].astro`
- [ ] Implement Article schema
- [ ] Add related posts component
- [ ] Add pagination to blog index
- [ ] Create 5+ new blog posts

**Critical Files:**
- `src/pages/blog/index.astro` (rewrite)
- `src/pages/blog/[slug].astro` (new)
- `src/pages/blog/category/[category].astro` (new)

### Phase 4: State Hub Pages (Week 2-3)
- [ ] Create `/connecticut/index.astro` state hub
- [ ] Create `/massachusetts/index.astro` state hub
- [ ] Implement city listing with links
- [ ] Add state-specific testimonials
- [ ] Implement LocalBusiness + AggregateRating schema

**Critical Files:**
- `src/pages/connecticut/index.astro` (new)
- `src/pages/massachusetts/index.astro` (new)

### Phase 5: Major City Pages - Initial Launch (Week 3-4)
- [ ] Create dynamic route templates for cities
- [ ] Generate AI-assisted content for top 20 cities (10 CT, 10 MA)
- [ ] Review and refine generated content
- [ ] Implement city-specific FAQPage schema
- [ ] Add nearby cities internal linking

**Initial 20 Cities (Launch Priority):**
- CT: Hartford, New Haven, Stamford, Bridgeport, Waterbury, Danbury, Norwalk, Greenwich, West Hartford, Manchester
- MA: Boston, Quincy, Worcester, Cambridge, Brockton, Plymouth, Fall River, New Bedford, Newton, Framingham

**Critical Files:**
- `src/pages/connecticut/[city].astro` (new)
- `src/pages/massachusetts/[city].astro` (new)
- `src/content/locations/connecticut/*.md` (new, 10 files for launch)
- `src/content/locations/massachusetts/*.md` (new, 10 files for launch)

### Phase 5b: City Page Expansion (Post-Launch)
- [ ] Generate remaining 90 city pages in batches
- [ ] 20 cities per week until complete
- [ ] Monitor indexing and adjust content as needed

### Phase 6: MA-Only Concrete Resurfacing Section (Week 4)
- [ ] Create `src/content/resurfacing/` collection with schema
- [ ] Create `/concrete-resurfacing/index.astro` hub (MA-only badge prominent)
- [ ] Create `/concrete-resurfacing/[slug].astro` dynamic route
- [ ] Add 6 resurfacing service pages (stairway, walkway, driveway, garage, pool deck, patio)
- [ ] Implement Service schema for each
- [ ] Cross-link with MA location pages only
- [ ] Update MA state hub to feature resurfacing services

**Critical Files:**
- `src/pages/concrete-resurfacing/index.astro` (new)
- `src/pages/concrete-resurfacing/[slug].astro` (new)
- `src/content/resurfacing/*.md` (new, 6 files)

### Phase 7: Educational Content Pages (Week 4-5)
- [ ] Create `/foundation-types/fieldstone` page
- [ ] Create `/foundation-types/cinderblock` page
- [ ] Create `/what-we-dont-do` resource page
- [ ] Implement proper internal linking from blog/service pages
- [ ] Add FAQ schema to educational pages

### Phase 8: Partner Pages (Week 5)
- [ ] Create `/partners/index.astro` hub
- [ ] Create `/partners/[type].astro` for 4 partner types
- [ ] Migrate content from Squarespace

### Phase 9: Production Pipeline Setup (Week 5)
- [ ] Create `.github/workflows/quality.yml` with all quality gates
- [ ] Create `scripts/validate-schema.js`
- [ ] Create `scripts/check-images.js`
- [ ] Create `scripts/check-seo.js`
- [ ] Create `lighthouse-budget.json` with thresholds
- [ ] Add npm scripts for validation commands
- [ ] Test pipeline on PR to verify gates work

**Critical Files:**
- `.github/workflows/quality.yml` (new)
- `scripts/validate-schema.js` (new)
- `scripts/check-images.js` (new)
- `scripts/check-seo.js` (new)
- `lighthouse-budget.json` (new)

### Phase 10: Decap CMS Integration (Week 5-6)
- [ ] Create `public/admin/index.html` with Decap loader
- [ ] Create `public/admin/config.yml` with blog collection schema
- [ ] Configure GitHub OAuth for editor authentication
- [ ] Set up required field validation (title, description, image, etc.)
- [ ] Configure editorial workflow (draft → review → publish)
- [ ] Create editorial guidelines document for team
- [ ] Test end-to-end: create post → build → deploy

**Critical Files:**
- `public/admin/index.html` (new)
- `public/admin/config.yml` (new)

### Phase 11: Image Migration & Optimization (Week 6)
- [ ] Download all images from Squarespace
- [ ] Collect real project photos (foundation repairs, resurfacing jobs)
- [ ] Organize in `src/assets/images/` by type
- [ ] Convert all components to Astro Image component usage
- [ ] Implement responsive loading
- [ ] Run image check script to verify compliance

### Phase 12: SEO & Performance Polish (Week 6-7)
- [ ] Run full Lighthouse audits on all page types
- [ ] Validate all schema with Google Rich Results Test
- [ ] Configure 301 redirects in `vercel.json`
- [ ] Verify sitemap includes all dynamic routes
- [ ] Test all internal links (broken link checker)
- [ ] Mobile testing across devices
- [ ] Verify all quality gates pass in CI

### Phase 13: Launch (Week 7)
- [ ] Final QA across all pages
- [ ] DNS cutover to Vercel
- [ ] Submit sitemaps to Google Search Console
- [ ] Submit to Bing Webmaster Tools
- [ ] Update Google Business Profiles with new URL
- [ ] Monitor for crawl errors
- [ ] Baseline analytics setup (GA4, Search Console)

### Phase 14: Post-Launch Expansion (Ongoing)
- [ ] Add remaining 90 city pages (20/week)
- [ ] Publish 2-4 blog posts per month
- [ ] Monitor rankings and adjust content
- [ ] Gather customer testimonials for city pages
- [ ] Expand resurfacing content with case studies

---

## Verification Plan

### Pre-Launch Testing
1. **Build Test:** `npm run build` succeeds without errors
2. **Preview Test:** `npm run preview` and manually test all routes
3. **Lighthouse:** Score 90+ on Performance, Accessibility, SEO, Best Practices
4. **Schema Validation:** Google Rich Results Test for each page type
5. **Mobile Test:** Chrome DevTools device emulation + real device
6. **Link Check:** Run broken link checker on preview URL
7. **Redirect Test:** Verify all 301s redirect correctly

### Post-Launch Monitoring
1. Google Search Console: Monitor indexing, crawl errors, Core Web Vitals
2. Google Analytics: Track organic traffic, bounce rate, conversions
3. Rank tracking for target keywords (city + service combinations)

---

## Expected Outcomes

### Page Count

**Initial Launch (Core + Major Cities):**
- **Current:** 5 pages
- **At Launch:** ~75 pages
  - 1 homepage
  - 7 foundation repair pages (1 hub + 6 services)
  - 7 concrete resurfacing pages (1 hub + 6 services, MA-only)
  - 3 educational pages (fieldstone, cinderblock, what-we-dont-do)
  - 22 location pages (2 state hubs + 20 major cities)
  - 15+ blog posts
  - 5 partner pages
  - 1 about page

**Full Expansion (Post-Launch):**
- **Final:** 175+ pages
  - 112 location pages (2 state hubs + 110 cities)
  - 30+ blog posts (growing 2-4/month)
  - Additional educational content as needed

### SEO Impact
- Dramatically expanded local keyword coverage
- City-level ranking opportunities for 110 markets
- Enhanced schema for rich snippets (stars, FAQs)
- Improved internal linking for crawlability
- Faster page speed for ranking boost

### Technical Improvements
- Static generation for maximum performance
- Modern image formats (WebP/AVIF)
- Content Collections for maintainability
- Type-safe content with Zod schemas
- **Automated quality gates** - nothing deploys without passing:
  - Lighthouse performance/SEO thresholds
  - JSON-LD schema validation
  - Image optimization verification
  - Meta tag completeness checks
- **Editorial workflow** - non-technical blog publishing with built-in SEO guardrails

### Infrastructure Deliverables
- GitHub Actions CI/CD pipeline with quality gates
- Custom validation scripts (schema, images, SEO)
- Blog CMS with required field enforcement
- Vercel deployment configuration
- 301 redirect mapping
