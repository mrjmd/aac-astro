# Attack A Crack: Launch Checklist

> **The only task tracker.** Every remaining item before (and after) launch. Completed work is archived in `docs/archive/LAUNCH-PLAN-COMPLETED.md`.

*Consolidated: March 5, 2026*
*Deployment: https://aac-website-theta.vercel.app/*

---

## Pre-Launch Blockers

These must be done before DNS cutover. Nothing else launches the site.

### Photos (Matt)

- [ ] Provide real photos for service page heroes (6 minimum: injection, wall crack, bulkhead, carbon fiber, sewer/conduit, consultation)
- [ ] Provide About page story photo (`public/images/about-story.jpg`)
- [ ] Provide CT + MA hub hero images
- [ ] Replace remaining placeholder images as assets become available (~40 more across concrete repair, state hubs, blog, city pages)
- [ ] Remove picsum.photos whitelist from `check-images.js` once all placeholders replaced (makes placeholders a build error)
- [ ] Optimize all new images (proper sizing, WebP/AVIF)
- [ ] Verify all images have meaningful alt text

### Testimonial Verification (Matt)

- [ ] Verify 20 testimonial quotes match actual Google reviews — names, cities, text accurate
- [ ] Confirm legal/compliance: each quote from a real customer who gave permission

### Manual QA (Both)

- [ ] All navigation links work
- [ ] All footer links work
- [ ] Contact forms submit correctly
- [ ] Phone numbers correct: CT (860) 573-8760, MA (617) 668-1677
- [ ] Addresses correct: CT 23 Elsmere Road, Amston, CT 06231; MA 30 Randlett St #2, Quincy, MA 02169
- [ ] "260+ Google reviews" claim is current
- [ ] Images load on all pages
- [ ] Mobile responsive (iPhone, Android)
- [ ] Schema validates in Google Rich Results Test
- [ ] Favicon displays correctly

### Automated Validation (Claude)

- [ ] Full `npm run validate` pass (clean)
- [ ] `npm run check:images` passes with 0 placeholder warnings
- [ ] Lighthouse: Performance 90+, Accessibility 95+, SEO 95+
- [ ] All pricing claims verified correct
- [ ] Uniqueness validation passes

### DNS Cutover (Matt)

- [ ] Backup current attackacrack.com
- [ ] Switch `public/robots.txt` from `Disallow: /` to `Allow: /`
- [ ] Remove `is-crawlable: 'off'` from `lighthouserc.cjs`
- [ ] Raise `categories:seo` threshold in `lighthouserc.cjs` from 0.69 → **0.95**
- [ ] Point attackacrack.com DNS to Vercel
- [ ] Verify SSL certificate
- [ ] Test all redirects work (`vercel.json`)
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor for 404 errors

---

## Page-Level Improvements

### Critical Bug Fix

- [x] Fix team section invisible on About page (move animation observer to Layout.astro)

### About Page (2A, 2B)

- [x] Update values section headings: Honesty, Responsiveness, Quality
- [x] Create expanded team component (TeamExpanded.astro) for About page

### Foundation Types → Blog Migration (1D)

- [x] Add `foundation-types` category to blog schema
- [x] Add `showOnServicesPage` field to blog schema
- [x] Convert foundation-types content to blog posts
- [x] Add redirects from old `/foundation-types/` URLs
- [x] Remove old foundation-types pages
- [x] Update internal links

### Services Hub Restructure (1A, 1B, 1C)

- [x] Add Concrete Repair card with "MA Only" badge to main grid
- [x] Replace "Specialized Services" with "Dive Deeper" blog section
- [x] Wire up hero images on service cards (blocked on Matt's photos for full effect)
- [x] Flag 4-6 blog posts for `showOnServicesPage: true`

### Updates Page Restructure (3A, 3B, 3C)

- [x] Convert to paginated route (`/updates/[...page]`)
- [x] Add blog category filter pills
- [x] Separate "Recent Projects" section below articles
- [x] Keep old `/blog/` pages alive for SEO

### Trusted Partners Discoverability (4)

- [x] Add cross-link from `/partners/` to trusted partners directory

### Static SVG Map (5) — Lower Priority

- [ ] Create ServiceAreaMap.astro with New England outline + 80 city dots
- [ ] Color-code by establishment (CT/MA blue, RI/NH/ME lighter)
- [ ] Add to areas-we-serve page

### Pre-Launch Visual QA Pass (6) — Matt

- [ ] Homepage walkthrough
- [ ] Services hub + each service page
- [ ] About page
- [ ] Updates page
- [ ] Areas We Serve
- [ ] Partners hub + Trusted Partners
- [ ] Sample blog post + sample location page
- [ ] Mobile spot-check on each

---

## Content Depth (Claude + Matt)

Not strictly blocking launch, but significantly improves quality.

### D8. About Page E-E-A-T (Needs Matt)

- [ ] Luc's credentials: certs, training, years, professional links
- [ ] Justin La Fontaine's title/role and tenure
- [ ] Company milestones timeline
- [ ] Enrich Person schema with verified data
- [ ] Verify author data accuracy (B4 from Pinnacle Plan)

### D9. City Page Deep Localization (Claude)

- [ ] Neighborhood specifics for top 20 cities (hyper-local content)
- [ ] Run uniqueness check against all 80 city pages

### Brainstorm Session (Matt)

- [ ] Complete expertise deep-dive — 38 questions in `docs/BRAINSTORM-AGENDA.md`
- [ ] Weave answers into service pages, blog posts, location pages (Claude)

### Partner Decisions (Matt)

- [ ] Brainstorm additional partner personas (waterproofing, basement finishing, real estate attorneys)
- [ ] Provide partner testimonials for new persona types
- [ ] Name the trusted partners page (Preferred? Trusted? Recommended?)
- [ ] Add trusted partners to DecapCMS config

### Schema (Claude — when photos available)

- [ ] Add ImageObject schema for before/after photos on service pages
- [ ] Add ImageObject schema on project/case study pages

---

## Automation Setup (Matt + Claude)

### DecapCMS (Matt)

1. [ ] Create a Netlify site (deploy manually, drag empty folder)
2. [ ] Connect to GitHub repo (`mrjmd/aac-astro`, branch: `main`), disable auto-publishing
3. [ ] Enable Identity (invite-only registration)
4. [ ] Enable Git Gateway
5. [ ] Invite users (assistant's email)
6. [ ] Claude updates `public/admin/config.yml` with Netlify site URL
7. [ ] Test: visit `/admin/`, log in, make test edit

### Google Cloud (Matt)

- [ ] Create Google Cloud project (or use existing)
- [ ] Enable APIs: Calendar, Drive, Business Profile
- [ ] Create OAuth2 credentials (desktop app type)
- [ ] Download JSON to `scripts/.credentials/google-oauth.json`
- [ ] Install dependencies: `npm install googleapis @anthropic-ai/sdk --save-dev`
- [ ] Provide CT + MA GBP account/location IDs
- [ ] Test calendar import: `node scripts/import-calendar-projects.js --dry-run --limit 5`
- [ ] Configure GBP IDs in `scripts/batch-post-gbp.js` (replace `XXXXXXXXXX` placeholders)
- [ ] Test GBP posting: `node scripts/batch-post-gbp.js --dry-run`

### Monitoring (Matt)

- [ ] Set up Google Search Console
- [ ] Set up GA4 / Vercel Analytics
- [ ] Set up uptime monitoring
- [ ] Set up error tracking

---

## Post-Launch

### Week 1

- [ ] Monitor Google Search Console for errors
- [ ] Monitor uptime alerts
- [ ] Fix any 404s from old URLs
- [ ] Submit to Bing Webmaster Tools
- [ ] Begin GBP optimization
- [ ] Verify Vercel cache headers working correctly
- [ ] Check server response times

### Month 1

- [ ] Publish 2-4 blog posts (per content calendar)
- [ ] Add 20+ more city pages
- [ ] Begin review acquisition campaign
- [ ] Citation audit and fixes

### Ongoing (B13 Phases 2-3)

- [ ] B13 Phase 2: Mobile intake form for technician case studies
- [ ] B13 Phase 3: GBP auto-posting integration
- [ ] Execute 90-day SEO sprint (see `docs/SEO-STRATEGY-2026.md` Part 16)
- [ ] Off-page strategy execution (see `docs/SEO-STRATEGY-2026.md` Part 18)

---

## Blog Content Backlog (Reference)

### Tier 3: Consumer Language Content (Not Yet Written)

| Topic | Target Keywords | Volume |
|-------|-----------------|--------|
| Cement vs Concrete: What Homeowners Need to Know | cement repair terms | 14,800 |
| Pool Deck Repair Guide | concrete pool deck repair | 5,400 |
| Driveway Crack Repair Guide | driveway crack repair | 1,900 |

> Note: Tier 1 and Tier 2 posts are all written. See archive for full list.

---

## Reference Documents

| Doc | Purpose |
|-----|---------|
| `docs/SEO-STRATEGY-2026.md` | SEO playbook (17 parts + off-page strategy) |
| `docs/BRAINSTORM-AGENDA.md` | 38 questions for Matt's expertise session |
| `docs/MATT-TODO.md` | Everything Matt personally needs to do |
| `docs/archive/` | Completed work, original plans, consumed references |
| `CLAUDE.md` | Project rules and validation requirements |
