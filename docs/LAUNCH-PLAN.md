# Attack A Crack: Launch Plan

## Overview

**Current State:** 55 pages built, 12 migration phases complete, SEO strategy documented.
**Goal:** Production-ready launch with comprehensive content, proper linking, and all quality gates passing.
**Deployment:** https://aac-website-theta.vercel.app/

### User Decisions (Confirmed)
- Navigation: Simple hub links (not dropdowns)
- Team pages: Keep hardcoded only, remove content files
- City count for launch: 80 cities (20 CT, 30 MA, 10 each RI/NH/ME)
- Content scope: Services, FAQ, blog posts, About page story/values, Partners with testimonials

---

## Session 0: Immediate Technical Tasks

- [x] Block robots.txt to prevent staging indexing
- [x] Install @vercel/speed-insights
- [x] Add SpeedInsights component to Layout.astro
- [x] Create this LAUNCH-PLAN.md document

---

## Session 1: Documentation & Quick Fixes

### Documentation Consolidation
- [ ] Create `docs/archive/` directory
- [ ] Move `docs/SEO.md` to archive (DELETE - fully superseded)
- [ ] Move `docs/KEYWORD-STRATEGY.md` to archive
- [ ] Move `docs/MIGRATION-PLAN.md` to archive
- [ ] Move `docs/REMAINING-TASKS.md` to archive
- [ ] Move `docs/SEO-ENHANCEMENT-PLAN.md` to archive

**Active docs after consolidation:**
1. `LAUNCH-PLAN.md` - This master checklist
2. `SEO-STRATEGY-2026.md` - Reference strategy document

### Fix Footer Links
- [ ] Update "Foundation Blog" → /blog
- [ ] Update "Partnerships" → /partners
- [ ] Update "Wall Crack Repair" → /services/wall-crack-repair
- [ ] Update "Leaky Bulkheads" → /services/leaky-bulkhead-repair
- [ ] Update "About Our Team" → /about
- [ ] Add state hub links to footer

### Remove Team Content Files
- [ ] Delete `src/content/team/*.md` files
- [ ] Verify team display remains hardcoded on About page

### Create Areas We Serve Hub
- [ ] Create `src/pages/areas-we-serve/index.astro`
- [ ] Add all 5 state links (CT, MA, RI, NH, ME)
- [ ] Add service area description
- [ ] Link to city pages

---

## Session 2: Navigation & Linking

### Navbar Updates
- [ ] Add "Areas We Serve" link to navbar
- [ ] Link to `/areas-we-serve` hub page

### Services Hub Enhancement
- [ ] Add Foundation Types section link
- [ ] Add Concrete Resurfacing section link
- [ ] Ensure all service categories visible

### Fix Orphan Pages
- [ ] Foundation Types pages linked from services
- [ ] Concrete Resurfacing pages linked from services
- [ ] State hubs linked from footer
- [ ] Cross-link service pages to locations

---

## Session 3: Content Migration

### Blog Posts from Current Site
- [ ] Audit existing blog content on attackacrack.com
- [ ] Migrate any missing blog posts
- [ ] Ensure proper frontmatter (title, date, category)
- [ ] Add to `src/content/blog/`

### About Page Enhancement
- [ ] Add "Our Story" section content
- [ ] Add "Our Values" section content
- [ ] Add company history/timeline
- [ ] Add E-E-A-T signals (experience, credentials)

### Partners & Testimonials
- [ ] Review existing partner pages
- [ ] Ensure testimonials included
- [ ] Add schema markup for testimonials

### FAQ Content
- [ ] Compare current site FAQs with new site
- [ ] Add any missing Q&As
- [ ] Expand FAQ content where needed

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
