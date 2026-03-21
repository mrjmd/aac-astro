# Attack A Crack: Launch Plan

> **The only task tracker.** Launch sequence first, then post-launch growth. Completed work is archived in `docs/archive/LAUNCH-PLAN-COMPLETED.md`.

*Updated: March 21, 2026 — Launch day prep. All pre-launch work complete.*
*Preview: https://aac-astro.vercel.app/*

---

## Section 1: Launch Sequence (Do These In Order)

### Step 1: Code Changes (Claude)

- [x] **Switch `public/robots.txt` to production mode** — `Allow: /`, sitemap URL, AI crawler rules
- [x] **Update `lighthouserc.cjs`** — Removed `is-crawlable: 'off'`, raised SEO threshold to 0.93
- [ ] **Commit and push to main** — CI deploys updated robots.txt + lighthouse config to Vercel

### Step 2: Update Secrets (Matt)

- [ ] **Update `SITE_IMAGE_BASE`** — In GitHub repo Settings > Secrets: change from `https://aac-astro.vercel.app` to `https://attackacrack.com`

### Step 3: Add Domain in Vercel (Matt)

- [ ] **Go to Vercel Dashboard** > Project (aac-astro) > Settings > Domains
- [ ] **Add `attackacrack.com`** and **`www.attackacrack.com`**
- [ ] **Set `www.attackacrack.com` as primary** (matches `site` in `astro.config.mjs`)
- [ ] **Configure non-www → www redirect** (Vercel offers this in domain settings)
- [ ] **Note the DNS records Vercel tells you to create** (either nameservers or A/CNAME records)

### Step 4: DNS Cutover (Matt)

Two options — pick one:

**Option A (Recommended): Vercel Nameservers**
- [ ] Go to your domain registrar (wherever `attackacrack.com` is registered)
- [ ] Change nameservers to the ones Vercel showed you in Step 3

**Option B: A/CNAME Records (if you can't change nameservers)**
- [ ] Add `A` record: `attackacrack.com` → `76.76.21.21`
- [ ] Add `CNAME` record: `www.attackacrack.com` → `cname.vercel-dns.com`

### Step 5: Verify SSL (Matt — wait 5-30 min after DNS change)

- [ ] Visit `https://www.attackacrack.com` — confirm lock icon shows
- [ ] Visit `https://attackacrack.com` — confirm it redirects to `https://www.attackacrack.com`
- [ ] Visit `http://attackacrack.com` — confirm it redirects to HTTPS

### Step 6: Spot-Check Redirects (Matt — same session)

Test these critical old URLs in your browser:
- [ ] `attackacrack.com/concrete-foundation-crack-repair-ct` → should 301 to `/connecticut` (this was 908 sessions)
- [ ] `attackacrack.com/tips` → should 301 to `/updates`
- [ ] `attackacrack.com/contact` → should 301 to `/`
- [ ] `attackacrack.com/foundation-types` → should 301 to `/blog/category/foundation-types`
- [ ] `attackacrack.com/wall-crack-repair` → should 301 to `/services/wall-crack-repair`
- [ ] Spot-check 5-10 more from the 74 redirects in `vercel.json`

### Step 7: Google Search Console (Matt — same day)

- [ ] Go to [Google Search Console](https://search.google.com/search-console)
- [ ] If existing property is for old Squarespace: add new property `https://www.attackacrack.com`
- [ ] Verify ownership (DNS TXT record or HTML file upload)
- [ ] Go to Sitemaps > Add: `https://www.attackacrack.com/sitemap-index.xml`
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

### Step 8: Bing Webmaster Tools (Matt — same day)

- [ ] Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [ ] Sign in and choose "Import from Google Search Console" (one-click)
- [ ] Submit same sitemap URL

### Step 9: Monitor First 48 Hours (Both)

- [ ] Check GSC for crawl errors (Coverage report)
- [ ] Check GA4 for traffic flowing (Realtime report)
- [ ] Check Vercel dashboard for 404 spikes (Functions/Analytics tab)
- [ ] Watch for old URLs 404ing that aren't in the 74 redirects — add new redirects as needed

---

## Section 2: Completed Pre-Launch Work

Everything below was completed before launch. Kept for reference.

### Testimonial Verification — DONE (March 10, 2026)

- [x] All 20 testimonials in `src/content/settings/testimonials.json` verified against real GBP reviews
- [x] All 8 partner page testimonials verified or marked as illustrative

### Manual QA — DONE

- [x] All navigation links work
- [x] All footer links work
- [x] Contact forms submit correctly
- [x] Phone numbers correct: CT (860) 573-8760, MA (617) 668-1677
- [x] Addresses correct: CT 23 Elsmere Road, Amston, CT 06231; MA 30 Randlett St #2, Quincy, MA 02169
- [x] "260+ Google reviews" claim is current
- [x] Images load on all pages
- [x] Schema validates — Spot-checked 5 representative pages
- [x] Favicon displays correctly
- [x] Featured projects filtering audit — 8 files renamed, walkway tags added
- [x] "What We Don't Do" cross-linking — 3 blog posts + footer
- [x] Visual sideways image audit — 217 JPGs checked, no issues

### 301 Redirects — DONE (74 total)

- [x] 31 indexed URLs from Google Search Console covered
- [x] 19 new redirects from Google Analytics top pages
- [x] Blog tag/category wildcard redirect
- [x] External backlinks checked
- [x] 24 Squarespace-era redirects added

### Analytics & Tracking — DONE

- [x] Google Search Console — existing property, DNS verification carries over
- [x] GA4 live — `PUBLIC_GA4_ID=G-VQGHX85D5D` in Vercel production env

### GitHub Secrets — DONE

- [x] `GEMINI_API_KEY`, `BUFFER_API_TOKEN`, `BUFFER_CHANNEL_ID`, `SITE_IMAGE_BASE`, `GOOGLE_OAUTH_*` (3 secrets)

### Validation Pipeline — DONE

- [x] `npm run validate` passes (0 errors, 0 warnings across all 7 checks)
- [x] Pre-commit hook enforces validation on every commit
- [x] CI/CD gated: build → validate → deploy (only on main, only after all pass)

### DecapCMS — DONE

- [x] Netlify site, GitHub repo connected, Identity + Git Gateway enabled
- [x] Working at `aac-astro.vercel.app/admin/`

### Content — DONE

- [x] 40 published blog posts, 41 drafts ready for post-launch publishing
- [x] 80 city pages (20 CT, 30 MA, 10 each RI/NH/ME)
- [x] 6 service pages + 6 concrete repair pages
- [x] 96 project case studies with before/after photos
- [x] 8 partner type pages
- [x] Basement floor crack repair blog post published (targets 13,400+ vol cluster)

### SEO Optimization — DONE

- [x] Cement → concrete keyword optimization across all pages
- [x] Bulkhead keyword optimization
- [x] Crack injection H2 hierarchy fix
- [x] Internal linking (7 posts)
- [x] targetLocation expansion (7 posts)
- [x] BBB listing submitted (Authority Score 78)

---

## Section 3: Post-Launch Growth

### Immediate Fast Follow (Days 1-3 After Launch)

Publish these two drafts ASAP — A-1 Foundation is getting real traffic from these exact topics and AAC has completed drafts sitting unpublished:

- [ ] **Publish `lally-columns-guide.md`** — 5,400 monthly searches, KD 10. A-1 gets 175 visits/mo from their version. Matt: review for accuracy, then flip `draft: false`.
- [ ] **Publish `flex-seal-basement-cracks.md`** — 49,500 vol long-tail cluster. A-1 gets 198 visits/mo. Matt: review for accuracy, then flip `draft: false`.

### Week 1: Foundation

- [ ] Optimize Google Business Profile (photos, posts, Q&A, services, attributes)
- [ ] Set up uptime monitoring (UptimeRobot free tier)
- [ ] Fix any 404s discovered in monitoring
- [ ] Verify Vercel cache headers working correctly (`/_astro/*` = 1yr, `/*.html` = revalidate)
- [ ] Test all 74 redirects systematically (not just spot-check)

### Week 2-4: Content Publishing + Citations

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

### Month 2-3: Expansion + Link Building

- [ ] **CT city expansion** — 16 new cities (see `docs/CT-CITY-EXPANSION-PLAN.md`)
- [ ] Write 20+ more city pages (expand into underserved NE areas)
- [ ] Optimize pages at positions 4-10: foundation crack, leaky bulkhead, basement wall crack
- [ ] Push bulkhead cluster from positions 14-20 to page 1
- [ ] Backlink outreach: todayshomeowner.com, HARO/Connectively journalist queries
- [ ] Partner reciprocal links
- [ ] Video content: embed YouTube clips on service pages, post to GBP (see `docs/VIDEO-STRATEGY-2026.md`)
- [ ] Continue 2-4 posts/month per content calendar (`docs/CONTENT-CALENDAR-2026.md`)

### Matt's Items (No Deadline — Ongoing Improvements)

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

### Deferred Items

- [ ] Partner expansion — drafts ready: insurance adjusters, mold remediation, plumbers, landscapers
- [ ] Brand voice review — `docs/archive/BRAND-VOICE.md`
- [ ] Marketing plan review — `docs/MARKETING-PLAN-2026.md`
- [ ] Basement floor multi-state blog post (all 5 states, linking to MA service page)
- [ ] Handle old Squarespace CDN image URLs (low priority, monitor)
- [ ] Financing page integration (Hearth/GreenSky)

### SEO Quick Wins (Claude — post-launch with GSC data)

- [ ] Title tag optimization — audit against target keywords from SEMrush
- [ ] Meta description optimization — rewrite underperformers using CTR data from GSC
- [ ] H1/H2 keyword alignment — match heading hierarchy to target SERP terms
- [ ] Content depth audit — compare word counts against ranking competitors
- [ ] High-Performance Continuity: CT State Hub must match keyword depth of old `/concrete-foundation-crack-repair-ct` page (908 sessions)

### Ongoing

- [ ] B13 Phase 2: Mobile intake form for technician case studies
- [ ] Social media posting (3x/week per marketing plan)
- [ ] PAA targeting in blog content
- [ ] Monitor competitor moves (see `docs/SEO-STRATEGY-2026.md` Part 23)
- [ ] WordPress-era URL audit (hunt old 2022 URLs for 301 redirects)
- [ ] Panic cluster Frase audits ("water in basement after rain", "musty smell", "white powder")

### Tech Debt

- [ ] 80+ location markdown files have hardcoded phone numbers. If a number changes, grep `src/content/`.
- [ ] Lighthouse CI on real servers — set up Vercel preview deployments for CI Lighthouse runs
- [ ] Extract HowTo schema into shared component for services + blog posts
- [ ] Google OAuth refresh token expiry — re-run `import-calendar-projects.js` locally if cron fails, update `GOOGLE_OAUTH_REFRESH_TOKEN` secret

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
