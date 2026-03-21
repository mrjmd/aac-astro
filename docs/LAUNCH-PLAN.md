# Attack A Crack: Post-Launch Growth Plan

> **The only task tracker.** Active work at the top. Launch history and completed pre-launch work archived below.

*Launched: March 21, 2026 — Site live at www.attackacrack.com*

---

## Immediate Fast Follow (Days 1-3)

Publish these two drafts ASAP — A-1 Foundation is getting real traffic from these exact topics and AAC has completed drafts sitting unpublished:

- [ ] **Publish `lally-columns-guide.md`** — 5,400 monthly searches, KD 10. A-1 gets 175 visits/mo from their version. Matt: review for accuracy, then flip `draft: false`.
- [ ] **Publish `flex-seal-basement-cracks.md`** — 49,500 vol long-tail cluster. A-1 gets 198 visits/mo. Matt: review for accuracy, then flip `draft: false`.

## Monitor First 48 Hours

- [ ] Check GSC for crawl errors (Coverage report)
- [ ] Check GA4 for traffic flowing (Realtime report)
- [ ] Check Vercel dashboard for 404 spikes (Functions/Analytics tab)
- [ ] Watch for old URLs 404ing that aren't in the 74 redirects — add new redirects as needed
- [ ] Use URL Inspection tool to request indexing on these 10 priority pages:
  1. `/` (homepage)
  2. `/services/` (services hub)
  3. `/services/foundation-crack-injection/`
  4. `/connecticut/`
  5. `/massachusetts/`
  6. `/blog/`
  7. `/blog/basement-floor-crack-repair-guide/`
  8. `/blog/signs-of-foundation-problems/`
  9. `/about/`
  10. `/concrete-repair/`

## Lighthouse Fixes (Claude — from March 21 production audit)

Two pages scored below 100 in non-performance categories:

- [x] **Fix crack injection A11y (95)** — Color contrast failure: blue badge (`text-aac-blue` on dark hero bg) had 3.2:1 ratio. Fixed: switched to `text-sky-400 bg-white/10` on all dark hero badges (7.83:1 contrast).
- [ ] **Fix MA hub SEO (97)** — Tap target failure: `.project-pin` links on interactive map are 3x7px, too small/overlapping. Fix: increase pin hit areas or `aria-hidden` the map pins and rely on text city list.

## Week 1: Foundation

- [ ] Optimize Google Business Profile (photos, posts, Q&A, services, attributes)
- [ ] Set up uptime monitoring (UptimeRobot free tier)
- [ ] Fix any 404s discovered in monitoring
- [ ] Verify Vercel cache headers working correctly (`/_astro/*` = 1yr, `/*.html` = revalidate)
- [ ] Test all 74 redirects systematically (not just spot-check)

## Week 2-4: Content Publishing + Citations

- [ ] **Continue publishing draft blog posts** — 2-3 per week, prioritize by keyword volume:
  - `efflorescence-white-powder-basement-walls.md` (panic search target)
  - `musty-smell-basement-causes-solutions.md` (panic search target)
  - `french-drain-vs-crack-injection.md` (comparison content)
  - `basement-waterproofing-cost-guide.md` (cost intent)
- [ ] Citation audit — verify NAP consistency across Yelp, BBB, Angi, HomeAdvisor
- [ ] Fix inconsistent citations
- [ ] Submit to missing directories where competitors are listed
- [ ] Chamber of commerce listings (CT + MA)
- [ ] Monitor position tracking (234 keywords baselined in SEMrush)
- [ ] Begin review acquisition campaign (target 300+)

## Month 2-3: Expansion + Link Building

- [ ] **CT city expansion** — 16 new cities (see `docs/CT-CITY-EXPANSION-PLAN.md`)
- [ ] Write 20+ more city pages (expand into underserved NE areas)
- [ ] Optimize pages at positions 4-10: foundation crack, leaky bulkhead, basement wall crack
- [ ] Push bulkhead cluster from positions 14-20 to page 1
- [ ] Backlink outreach: todayshomeowner.com, HARO/Connectively journalist queries
- [ ] Partner reciprocal links
- [ ] Video content: embed YouTube clips on service pages, post to GBP (see `docs/VIDEO-STRATEGY-2026.md`)
- [ ] Continue 2-4 posts/month per content calendar (`docs/CONTENT-CALENDAR-2026.md`)

## SEO Quick Wins (Claude — with GSC data)

- [ ] Title tag optimization — audit against target keywords from SEMrush
- [ ] Meta description optimization — rewrite underperformers using CTR data from GSC
- [ ] H1/H2 keyword alignment — match heading hierarchy to target SERP terms
- [ ] Content depth audit — compare word counts against ranking competitors
- [ ] High-Performance Continuity: CT State Hub must match keyword depth of old `/concrete-foundation-crack-repair-ct` page (908 sessions)

## Matt's Items (No Deadline — Ongoing Improvements)

**Photos & Video** — No placeholders remain; these are upgrades for page-matched photos.
- [ ] Service page hero + before/after pairs (18 photos) → `public/images/services/`
- [ ] Concrete repair page photos (18 photos) → `public/images/concrete-repair/`
- [ ] Standalone page images (9 photos) — about, state hubs, etc.
- [ ] Home page hero images — hand-select from multiple projects
- [ ] Foundation type photos (cinderblock + fieldstone, 2 photos)
- [ ] City-specific photos (optional) → `public/images/locations/{city-slug}.jpg`
- [ ] 3 quick phone clips: diamond saw, resin injection, finished repair

**Luc's Professional Info (E-E-A-T)**
- [ ] Certifications and training
- [ ] Years in foundation repair specifically
- [ ] Professional memberships or associations
- [ ] LinkedIn profile URL
- [ ] Awards, press mentions, speaking engagements
- [ ] Justin La Fontaine's title/role and tenure

**Visual QA**
- [ ] About page walkthrough
- [ ] Mobile spot-check on each page type (iPhone + Android)

**Other**
- [ ] Consider upgrading Buffer to Team plan ($10/mo) for 2,000 scheduled posts
- [ ] Brainstorm session — 38 technical questions in `docs/BRAINSTORM-AGENDA.md`
- [ ] Before/after photo verification — flip `beforeAfterVerified: true` on verified pairs
- [ ] Blog draft review — 41 drafts ready, read for accuracy and voice

## Ongoing

- [ ] B13 Phase 2: Mobile intake form for technician case studies
- [ ] Social media posting (3x/week per marketing plan)
- [ ] PAA targeting in blog content
- [ ] Monitor competitor moves (see `docs/SEO-STRATEGY-2026.md` Part 23)
- [ ] WordPress-era URL audit (hunt old 2022 URLs for 301 redirects)
- [ ] Panic cluster Frase audits ("water in basement after rain", "musty smell", "white powder")

## Deferred Items

- [ ] Partner expansion — drafts ready: insurance adjusters, mold remediation, plumbers, landscapers
- [ ] Brand voice review — `docs/archive/BRAND-VOICE.md`
- [ ] Marketing plan review — `docs/MARKETING-PLAN-2026.md`
- [ ] Basement floor multi-state blog post (all 5 states, linking to MA service page)
- [ ] Handle old Squarespace CDN image URLs (low priority, monitor)
- [ ] Financing page integration (Hearth/GreenSky)

## Tech Debt

- [ ] 80+ location markdown files have hardcoded phone numbers. If a number changes, grep `src/content/`.
- [ ] Lighthouse CI on real servers — set up Vercel preview deployments for CI Lighthouse runs
- [ ] Extract HowTo schema into shared component for services + blog posts
- [ ] Google OAuth refresh token expiry — re-run `import-calendar-projects.js` locally if cron fails, update `GOOGLE_OAUTH_REFRESH_TOKEN` secret

---

## Launch History (March 21, 2026) — COMPLETE

### Launch Sequence (All 9 Steps Done)

1. **Code Changes** — Switched `robots.txt` to production, updated `lighthouserc.cjs` (removed `is-crawlable: 'off'`, raised SEO to 0.93), committed and pushed
2. **Update Secrets** — Changed `SITE_IMAGE_BASE` to `https://attackacrack.com`
3. **Add Domain in Vercel** — Added `attackacrack.com` and `www.attackacrack.com` to `aac-astro` project, www as primary, non-www → www redirect
4. **DNS Cutover** — A record and CNAME configured in Cloudflare (DNS only, no proxy)
5. **Verify SSL** — HTTPS confirmed on www and non-www, HTTP redirects to HTTPS
6. **Spot-Check Redirects** — All 74 redirects working, custom 404 serving correctly
7. **Google Search Console** — Property verified, sitemaps submitted, old Squarespace sitemap removed, indexing requested on priority pages
8. **Bing Webmaster Tools** — Site existed, sitemaps submitted
9. **Monitor** — In progress

### Completed Pre-Launch Work

- **Testimonial Verification** — All 20 testimonials verified against real GBP reviews; 8 partner page testimonials verified or marked illustrative
- **Manual QA** — All nav/footer links, contact forms, phone numbers, addresses, review counts, images, schema, favicon verified
- **301 Redirects** — 74 total (31 GSC indexed URLs, 19 GA top pages, 24 Squarespace-era, blog tag wildcards, external backlinks)
- **Analytics & Tracking** — GSC verified, GA4 live (`G-VQGHX85D5D`)
- **GitHub Secrets** — `GEMINI_API_KEY`, `BUFFER_API_TOKEN`, `BUFFER_CHANNEL_ID`, `SITE_IMAGE_BASE`, `GOOGLE_OAUTH_*`
- **Validation Pipeline** — `npm run validate` passes (0 errors, 0 warnings), pre-commit hook, CI/CD gated deploys
- **DecapCMS** — Working at `/admin/`
- **Content** — 40 published blog posts, 41 drafts, 80 city pages, 12 service pages, 96 projects, 8 partner pages
- **SEO** — Cement→concrete optimization, bulkhead keywords, H2 hierarchy, internal linking, BBB listing

---

## Reference Documents

| Doc | Purpose |
|-----|---------|
| `docs/SEO-STRATEGY-2026.md` | SEO playbook (23 parts, includes SERP Acquisition Playbook) |
| `docs/COMPETITIVE-ANALYSIS.md` | Competitor audit across 5 states (March 2026) |
| `docs/CONTENT-CALENDAR-2026.md` | Editorial calendar (81 posts: 40 published, 41 drafts) |
| `docs/CT-CITY-EXPANSION-PLAN.md` | 16 new CT cities post-launch |
| `docs/VIDEO-STRATEGY-2026.md` | 2-hour recording sprint plan + scripts |
| `docs/BRAINSTORM-AGENDA.md` | 38 expertise questions for Matt |
| `docs/LIGHTHOUSE-AUDIT-2026-03-21.md` | Lighthouse audit (16 pages, March 21) |
| `docs/seo-reports/` | GSC queries, SEMrush keyword gaps, competitor positions, backlinks |
| `docs/archive/` | Completed work, original plans, consumed references |
| `CLAUDE.md` | Project rules and validation requirements |
