# Attack A Crack: Launch Plan

## Overview

**Current State:** Sessions 0-3 complete, validation passing, 60+ pages built.
**Goal:** Production-ready launch with comprehensive content, proper linking, and all quality gates passing.
**Deployment:** https://aac-website-theta.vercel.app/

### User Decisions (Confirmed)
- Navigation: Simple hub links (not dropdowns)
- Team pages: Keep hardcoded only, remove content files
- City count for launch: 80 cities (20 CT, 30 MA, 10 each RI/NH/ME)
- Content scope: Services, FAQ, blog posts, About page story/values, Partners with testimonials

---

## CI/CD Pipeline Status ✅ COMPLETE

All CI/CD infrastructure from MIGRATION-PLAN.md Phase 9-10 is implemented:

### Automated Quality Gates (`.github/workflows/quality.yml`)
- ✅ Build validation
- ✅ JSON-LD schema validation (`npm run validate:schema`)
- ✅ Image optimization checks (`npm run check:images`)
- ✅ SEO metadata checks (`npm run check:seo`)
- ✅ Accessibility checks (`npm run check:a11y`)
- ✅ Link validation (`npm run validate:links`)
- ✅ Lighthouse CI with thresholds (95% a11y, 95% SEO required)

### Validation Scripts (`scripts/`)
- ✅ `validate-schema.js` - JSON-LD validation
- ✅ `check-images.js` - Image optimization
- ✅ `check-seo.js` - Meta tag validation
- ✅ `check-a11y.js` - Accessibility checks
- ✅ `validate-links.js` - Broken link detection

### Decap CMS (`public/admin/`)
- ✅ `index.html` - CMS loader
- ✅ `config.yml` - Blog collection schema with required fields

### Vercel Configuration
- ✅ `vercel.json` - 301 redirects from old URLs
- ✅ `lighthouserc.js` - Lighthouse thresholds
- ✅ Cache headers configured

### Remaining Manual Setup (Matt)
- [ ] Add GitHub secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
- [ ] Configure GitHub OAuth for Decap CMS (editor authentication)

---

## Session 0: Immediate Technical Tasks ✅ COMPLETE

- [x] Block robots.txt to prevent staging indexing
- [x] Install @vercel/speed-insights
- [x] Add SpeedInsights component to Layout.astro
- [x] Create this LAUNCH-PLAN.md document

---

## Session 1: Documentation & Quick Fixes ✅ COMPLETE

### Documentation Consolidation
- [x] Create `docs/archive/` directory
- [x] Move `docs/SEO.md` to archive
- [x] Move `docs/KEYWORD-STRATEGY.md` to archive
- [x] Move `docs/MIGRATION-PLAN.md` to archive
- [x] Move `docs/REMAINING-TASKS.md` to archive
- [x] Move `docs/SEO-ENHANCEMENT-PLAN.md` to archive

**Active docs after consolidation:**
1. `LAUNCH-PLAN.md` - This master checklist
2. `SEO-STRATEGY-2026.md` - Reference strategy document

### Fix Footer Links
- [x] Update "Foundation Blog" → /blog
- [x] Update "Partnerships" → /partners
- [x] Update "Wall Crack Repair" → /services/wall-crack-repair
- [x] Update "Leaky Bulkheads" → /services/leaky-bulkhead-repair
- [x] Update "About Our Team" → /about
- [x] Add state hub links to footer

### Remove Team Content Files
- [x] Delete `src/content/team/*.md` files
- [x] Verify team display remains hardcoded on About page

### Create Areas We Serve Hub
- [x] Create `src/pages/areas-we-serve/index.astro`
- [x] Add all 5 state links (CT, MA, RI, NH, ME)
- [x] Add service area description
- [x] Link to city pages

---

## Session 2: Navigation & Linking ✅ COMPLETE

### Navbar Updates
- [x] Add "Areas" link to navbar
- [x] Link to `/areas-we-serve` hub page

### Services Hub Enhancement
- [x] Add Foundation Types section link
- [x] Add Concrete Resurfacing section link
- [x] Ensure all service categories visible

### Fix Orphan Pages
- [x] Foundation Types pages linked from services
- [x] Concrete Resurfacing pages linked from services
- [x] State hubs linked from footer
- [ ] Cross-link service pages to locations (Session 6)

---

## Session 3: Content Migration ✅ COMPLETE

### Blog Posts from Current Site
- [x] Audit existing blog content on attackacrack.com
- [x] Migrate 9 blog posts:
  - 10-essential-tips-worry-free-foundation.md
  - ashi-new-england-conference-2024.md
  - basement-leak-framingham-case-study.md
  - crumbling-foundations-massachusetts-connecticut.md
  - finished-basement-flooded-shrewsbury.md
  - how-to-check-your-foundation.md
  - leaky-bulkhead-wilmington-repair.md
  - nar-nxt-boston-2024-partnerships.md
  - winter-home-maintenance-checklist.md
- [x] Ensure proper frontmatter (title, date, category)

### About Page Enhancement
- [x] Add "Our Story" section content
- [x] Add "Our Values" section content
- [x] Add company history/timeline
- [x] Add E-E-A-T signals (experience, credentials)

### Partners & Testimonials
- [x] Review existing partner pages (4 partner pages exist)
- [x] Testimonials included on partner pages

### FAQ Content
- [x] FAQ content exists on service and location pages

---

## Session 4-5: City Page Generation

### Target: 80 Cities Total

| State | Target | Current | Remaining |
|-------|--------|---------|-----------|
| CT (eastern 2/3) | 20 | 9 | 11 |
| MA | 30 | 0 | 30 |
| RI | 10 | 0 | 10 |
| NH | 10 | 0 | 10 |
| ME | 10 | 0 | 10 |

### Content Requirements Per City
- Unique title, meta description
- Neighborhoods (3-5)
- Local landmarks (2-3)
- Common foundation types
- Average home age
- Local challenges paragraph
- nearbyCities references (5 cities)

### Session 4 Tasks
- [ ] Generate remaining 11 CT city pages
- [ ] Generate 30 MA city pages
- [ ] Validate schema and linking

### Session 5 Tasks
- [ ] Generate 10 RI city pages
- [ ] Generate 10 NH city pages
- [ ] Generate 10 ME city pages

---

## Session 6: Service Page Enhancements

### HowTo Schema
- [ ] Add HowTo schema to wall-crack-repair
- [ ] Add HowTo schema to foundation-crack-injection
- [ ] Add HowTo schema to leaky-bulkhead-repair
- [ ] Add HowTo schema to carbon-fiber-stitches
- [ ] Add HowTo schema to sewer-well-conduit-repair

### Location Links
- [ ] Add "Available in" section to each service page
- [ ] Link to relevant state hubs
- [ ] Link to major cities for each service

### Content Enhancement
- [ ] Add cement keyword variations where appropriate
- [ ] Expand FAQ content on service pages

---

## Session 7: Pre-Launch Validation

### Automated Validation
- [ ] `npm run build` passes
- [ ] `npm run validate:schema` passes
- [ ] `npm run check:images` passes
- [ ] `npm run check:seo` passes
- [ ] `npm run check:a11y` passes
- [ ] `npm run validate:links` passes

### Fix Any Issues
- [ ] Resolve build errors
- [ ] Fix broken links
- [ ] Fix accessibility issues
- [ ] Fix SEO issues

---

## Manual Tasks (Matt)

### Critical Blockers
- [ ] Replace placeholder images (~50 images needed)
  - [ ] 2 branded OG images
  - [ ] 1 hero photo
  - [ ] 8 homepage before/after photos
  - [ ] 5 team headshots
  - [ ] ~12 service page before/after photos
  - [ ] ~8 resurfacing photos
  - [ ] ~4 foundation type photos
  - [ ] 5 state hero images
  - [ ] ~5 blog post images

### Vercel Setup
- [ ] Verify Vercel project exists
- [ ] Get VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
- [ ] Add as GitHub repository secrets
- [ ] Test deployment pipeline

### Monitoring Setup
- [ ] Set up uptime monitoring (Better Stack, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up Google Search Console
- [ ] Set up Google Analytics 4

### Visual Design Review
- [ ] Review all page templates for consistency
- [ ] Check mobile responsiveness
- [ ] Verify color scheme consistency
- [ ] Check typography hierarchy
- [ ] Ensure CTA buttons are prominent

### Contact Info Verification
- [ ] CT Office: 23 Elsmere Road, Amston, CT 06231, (860) 573-8760
- [ ] MA Office: 30 Randlett St #2, Quincy, MA 02169, (617) 668-1677
- [ ] Verify "240+ Google reviews" claim is current

---

## Pre-Launch Checklist

### Manual QA
- [ ] All navigation links work
- [ ] All footer links work
- [ ] Contact forms submit correctly
- [ ] Phone numbers are correct
- [ ] Addresses are correct
- [ ] Images load on all pages
- [ ] Mobile responsive on iPhone, Android
- [ ] Page speed acceptable (Lighthouse 90+)
- [ ] Schema validates in Google Rich Results Test
- [ ] Robots.txt accessible
- [ ] Sitemap accessible
- [ ] Favicon displays

### DNS Cutover
- [ ] **Uncomment robots.txt** (re-enable indexing)
- [ ] Backup current site
- [ ] Point attackacrack.com DNS to Vercel
- [ ] Verify SSL certificate
- [ ] Test all redirects work
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor for 404 errors

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

## Blog Content Priority

### Tier 1: High Volume, Low Difficulty
| Topic | Volume | KD | Status |
|-------|--------|-----|--------|
| Foundation Repair Cost Guide 2026 | 8,100 | 12 | Draft exists |
| Horizontal vs Vertical Foundation Cracks | 3,600 | 9 | Needed |
| Signs of Foundation Problems | 4,400 | 21 | Needed |
| Bulkhead Repair Cost Guide | 480 | 4 | Needed |

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

## Success Criteria

Launch ready when:
1. All validation scripts pass (`npm run validate`)
2. No placeholder images remain
3. All navigation links work
4. Minimum 80 city pages published (20 CT, 30 MA, 10 each RI/NH/ME)
5. Lighthouse scores: Performance 90+, Accessibility 95+, SEO 95+
6. All redirects from old site configured
7. Vercel deployment working
8. Monitoring in place

---

## Reference Documents

- `docs/SEO-STRATEGY-2026.md` - Detailed SEO execution strategy
