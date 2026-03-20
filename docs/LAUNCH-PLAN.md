# Attack A Crack: Launch Checklist

> **The only task tracker.** Three sections: launch blockers, Matt's items, post-launch sprint. Completed work is archived in `docs/archive/LAUNCH-PLAN-COMPLETED.md`.

*Updated: March 10, 2026 — Testimonials verified, partner drafts added*
*Preview: https://aac-astro.vercel.app/*

---

## Section 1: Launch Blockers

These must be done before DNS cutover. Nothing else launches the site.

### Testimonial Verification (Matt) — DONE

**Status: Verified.** Matt reviewed all testimonials on March 10, 2026 and replaced fake/paraphrased ones with real quotes from actual reviewers.

- [x] **Go into GBP dashboard** and match each of the 20 quotes in `src/content/settings/testimonials.json` to real reviews
- [x] Replace any that can't be matched with verbatim quotes from actual reviewers (real names, real text)
- [x] Confirm the 8 partner page testimonials (in `src/content/partners/*.md`) are either real or clearly marked as illustrative

### Manual QA (Both)

- [ ] All navigation links work
- [ ] All footer links work
- [ ] Contact forms submit correctly
- [ ] Phone numbers correct: CT (860) 573-8760, MA (617) 668-1677
- [ ] Addresses correct: CT 23 Elsmere Road, Amston, CT 06231; MA 30 Randlett St #2, Quincy, MA 02169
- [ ] "260+ Google reviews" claim is current
- [ ] Images load on all pages
- [ ] Mobile responsive (iPhone, Android)
- [x] Schema validates in Google Rich Results Test — Spot-checked 5 representative pages (homepage, service, city, blog, state hub). Fixed: blog Article image relative→absolute URL, duplicate BreadcrumbList on all pages, missing author lookup for "Matt Davis" and "Attack A Crack".
- [ ] Favicon displays correctly

### Manual QA Follow-Up (Claude)

- [x] **Featured projects filtering audit** — Renamed 8 mismatched project files to match serviceTypes. Added `walkway` to 4 stairway-tagged projects so they appear on walkway-stairway service page.
- [x] **"What We Don't Do" cross-linking** — Added contextual links in 3 blog posts (waterproofing, repair-vs-replacement, French drain) + footer Quick Links.
- [x] **Visual sideways image audit** — PIL dimension check on 217 JPGs found 6 tall-portrait anomalies, all verified as correctly oriented vertical crack photos. No sideways images found.
- [ ] **Home page hero images (Matt)** — Hand-select photos from multiple projects to feature in the home page hero section. Matt to choose which project photos best represent the range of services.

### Lighthouse Threshold (Claude)

- [ ] Lighthouse: Performance 90+, Accessibility 95+, SEO 95+
- [ ] `npm run check:images` passes with 0 placeholder warnings — *currently 8 WebP files over 400KB (non-blocking warnings)*

### 301 Redirects — DONE (74 total)

74 redirects in `vercel.json`, covering all three data sources:

- [x] **Crawl Google Search Console** — all 31 indexed URLs covered (real pages or redirects)
- [x] **Export Google Analytics top pages** — all 111 URLs cross-referenced, 19 new redirects added
- [x] **Handle any old `/blog/` tag/category pages** — `/blog/tag/:tag` wildcard redirect added
- [x] **Check for external backlinks** — GSC shows only `/` and `/massachusetts`, both real pages
- [x] **WordPress-era redirects** — 24 old URLs from Squarespace redirect config added
- [ ] **Handle old image URLs** — Squarespace CDN images linked from external sites (low priority, monitor post-launch)
- [ ] **Test every redirect after DNS cutover** — verify all 74 redirects resolve correctly

### DNS Cutover (Matt)

- [ ] Backup current attackacrack.com
- [ ] Switch `public/robots.txt` from `Disallow: /` to `Allow: /`
- [ ] Remove `is-crawlable: 'off'` from `lighthouserc.cjs`
- [ ] Raise `categories:seo` threshold in `lighthouserc.cjs` from 0.69 → **0.95**
- [ ] Point attackacrack.com DNS to Vercel
- [ ] Update `SITE_IMAGE_BASE` GitHub secret from `https://aac-astro.vercel.app` → `https://attackacrack.com`
- [ ] Verify SSL certificate
- [ ] Test all redirects work (`vercel.json`)
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor for 404 errors

### GitHub Secrets for CI/CD — DONE

- [x] `GEMINI_API_KEY` — photo classification + content generation
- [x] `BUFFER_API_TOKEN` — social media auto-posting
- [x] `BUFFER_CHANNEL_ID` — `69aa1ae63f3b94a1211df5f1`
- [x] `SITE_IMAGE_BASE` — `https://aac-astro.vercel.app` (change to `https://attackacrack.com` at launch)
- [x] `GOOGLE_OAUTH_CLIENT_ID` — OAuth2 for Calendar/Drive API (replaces service account — org policy blocks key creation)
- [x] `GOOGLE_OAUTH_CLIENT_SECRET` — OAuth2 client secret
- [x] `GOOGLE_OAUTH_REFRESH_TOKEN` — OAuth2 refresh token (see Tech Debt note on expiry)

---

## Section 2: Matt's Items

Everything the site needs from Matt before and around launch. Claude can't do these — they require your access, knowledge, or decision-making. (Merged from MATT-TODO.md, now archived.)

### Photos & Video

**Status: No picsum placeholders remain.** All pages use real project photos. The items below are upgrades — page-matched photos would be better than the current generic project shots.

**Priority 1: Service page hero + before/after pairs (18 photos)**
Save to `public/images/services/`. Each service page needs: hero, before, after.

| Service | Files Needed |
|---------|-------------|
| Crack Injection | `injection-hero.jpg`, `injection-before.jpg`, `injection-after.jpg` |
| Wall Crack Repair | `wall-crack-hero.jpg`, `wall-crack-before.jpg`, `wall-crack-after.jpg` |
| Bulkhead Repair | `bulkhead-hero.jpg`, `bulkhead-before.jpg`, `bulkhead-after.jpg` |
| Carbon Fiber | `carbon-fiber-hero.jpg`, `carbon-fiber-before.jpg`, `carbon-fiber-after.jpg` |
| Sewer/Conduit | `utility-hero.jpg`, `utility-before.jpg`, `utility-after.jpg` |
| Consultation | `consultation-hero.jpg`, `consultation-before.jpg`, `consultation-after.jpg` |

**Priority 2: Concrete repair pages (18 photos)** — Save to `public/images/concrete-repair/`
Driveway, patio, walkway, pool deck, stairway, garage — hero + before/after each.

**Priority 3: Standalone page images (9 photos)**
- `public/images/about-story.jpg` — Team photo or Luc/Justin working
- `public/images/services-method.jpg` — Injection process action shot
- `public/images/ct-hero.jpg`, `ma-hero.jpg`, `ri-hero.jpg`, `nh-hero.jpg`, `me-hero.jpg` — State hub heroes
- `public/images/concrete-repair-hero.jpg`, `concrete-repair-benefits.jpg`

**Priority 4:** Foundation types (cinderblock + fieldstone heroes, 2 photos)
**Priority 5:** City-specific photos (optional, great for local SEO — name as `public/images/locations/{city-slug}.jpg`)

**Video: 3 quick phone clips** (horizontal, 10-15 sec each)
1. Diamond saw cutting the groove
2. Resin injection close-up
3. Finished repair pan shot

**Total: 47 minimum photos + 3 video clips**

### Luc's Professional Info (E-E-A-T)

Needed for author schema and the About page. Currently using placeholder data.

- [ ] Luc's certifications and training (any foundation repair certs, manufacturer training)
- [ ] How long he's been doing foundation repair specifically
- [ ] Professional memberships or associations
- [ ] LinkedIn profile URL (if public)
- [ ] Awards, press mentions, or speaking engagements
- [ ] Justin La Fontaine's title/role and tenure

### Visual QA Pass

- [ ] Homepage walkthrough
- [ ] Services hub + each service page
- [ ] About page
- [ ] Updates page
- [ ] Locations
- [ ] Partners hub + Trusted Partners
- [ ] Sample blog post + sample location page
- [ ] Mobile spot-check on each

### Google Cloud Setup (for Calendar Import) — SUPERSEDED

- [x] ~~Create service account~~ — org policy blocks key creation; using OAuth2 refresh token instead (see Tech Debt)
- [x] ~~Share calendar with service account~~ — not needed with OAuth2
- [x] ~~Download service account key JSON~~ — not needed with OAuth2

### DecapCMS Setup

1. [x] Create a Netlify site — `bejewelled-youtiao-fcc0d4.netlify.app`
2. [x] Connect to GitHub repo (`mrjmd/aac-astro`, branch: `main`), disable auto-publishing
3. [x] Enable Identity (invite-only registration)
4. [x] Enable Git Gateway
5. [x] Invite users — matt@attackacrack.com
6. [x] Claude updates `public/admin/config.yml` with Netlify site URL + Vercel rewrite for `/.netlify/*`
7. [x] Test: visit `/admin/`, log in — working on `aac-astro.vercel.app/admin/`

### Buffer Queue Refill

Buffer Essentials allows 10 scheduled posts. 73 projects remaining. Refill weekly:

```bash
SITE_IMAGE_BASE=https://aac-astro.vercel.app node scripts/buffer-post-projects.js \
  --channel-id 69aa1ae63f3b94a1211df5f1 --start-date YYYY-MM-DD
```

- [ ] Consider upgrading to Buffer Team ($10/mo) for 2,000 scheduled posts

---

## Section 3: Post-Launch SEO Sprint

First 90 days after DNS cutover. Full strategy in `docs/SEO-STRATEGY-2026.md` (Parts 16-18, 23).

### Week 1: Foundation Setup

- [ ] Set up Google Search Console + verify both CT and MA properties
- [ ] Submit sitemap to GSC
- [ ] Set up GA4 / Vercel Analytics
- [ ] Optimize Google Business Profile (photos, posts, Q&A, services, attributes)
- [ ] Submit BBB listing (Authority Score 78 — every competitor has it)
- [ ] Set up uptime monitoring + error tracking
- [ ] Submit to Bing Webmaster Tools
- [ ] Fix any 404s from old URLs
- [ ] Verify Vercel cache headers working correctly

### Month 1: Citations & Content

- [ ] Citation audit — verify NAP consistency across Yelp, BBB, Angi, HomeAdvisor, etc.
- [ ] Fix inconsistent citations — same name, address, phone everywhere
- [ ] Submit to missing directories where competitors are listed
- [ ] Chamber of commerce listings (CT + MA)
- [ ] Publish 4 blog posts per content calendar
- [ ] Monitor position tracking (234 keywords baselined in SEMrush)
- [ ] Begin review acquisition campaign

### Month 2-3: Content Expansion & Link Building

- [ ] **CT city expansion** — add 16 new eastern/central CT city pages (see `docs/CT-CITY-EXPANSION-PLAN.md`)
- [ ] Write 20+ more city pages (expand into underserved NE areas)
- [x] Create dedicated "Basement Floor Crack Repair" service page (13,400 vol cluster) — `src/content/concrete-repair/basement-floor.md` (MA only, grind + epoxy/rubber method)
- [x] Write lally column content (5,400 vol, KD 10) — `src/content/blog/lally-columns-guide.md` (draft, pending Matt review)
- [x] Write Flex Seal debunking post (49,500 vol long-tail) — `src/content/blog/flex-seal-basement-cracks.md` (draft, pending Matt review)
- [x] SEO gap sprint: bulkhead keyword optimization, crack injection H2 hierarchy fix, sewer/conduit internal linking (7 posts), targetLocation expansion (7 posts), publish 3 approved drafts (bulkhead sealant, carbon fiber staples, basement floor repair)
- [ ] Optimize pages at positions 4-10: foundation crack, leaky bulkhead, basement wall crack
- [ ] Push bulkhead cluster from positions 14-20 to page 1
- [ ] Backlink outreach: todayshomeowner.com, HARO/Connectively journalist queries
- [ ] Partner reciprocal links
- [ ] Video content: embed YouTube clips on service pages, post to GBP
- [ ] Continue 2-4 posts/month per content calendar

### Deferred to Post-Launch

- [ ] **Blog draft review (42 drafts)** — All drafts have complete 800-1200+ word content. Read for accuracy and voice (`src/content/blog/`, `draft: true`), flag revisions, source hero images, provide real project details for case studies. Calendar: `docs/CONTENT-CALENDAR-2026.md`
- [ ] **Partner expansion** — unpublished drafts ready: insurance adjusters, mold remediation, plumbers, landscapers. New targets: structural engineers, waterproofers, basement finishing contractors, foundation inspectors, civil engineers, pest control, HVAC contractors, chimney repair
- [ ] **Brand voice review** — archived to `docs/archive/BRAND-VOICE.md`, revisit post-launch
- [ ] **Marketing plan review** — `docs/MARKETING-PLAN-2026.md` (social cadence, ad budget, email platform, geo-targeting, AI video)
- [ ] **Brainstorm session** — 38 technical questions in `docs/BRAINSTORM-AGENDA.md` (injection PSI, carbon fiber specs, job stories, etc.)

### Ongoing

- [ ] B13 Phase 2: Mobile intake form for technician case studies
- [ ] Social media posting (3x/week per marketing plan)
- [ ] Review acquisition (target 300+ Google reviews)
- [ ] PAA targeting in blog content
- [ ] Monitor competitor moves (see `docs/SEO-STRATEGY-2026.md` Part 23 watchlist)
- [ ] WordPress-era URL audit (hunt for old 2022 URLs for 301 redirects)
- [ ] Panic cluster Frase audits ("water in basement after rain", "musty smell", "white powder on walls")

### SEO Quick Wins (Claude — post-launch with GSC data)

- [ ] Title tag optimization — audit against target keywords from SEMrush
- [ ] Meta description optimization — rewrite underperformers using CTR data from GSC
- [ ] H1/H2 keyword alignment — match heading hierarchy to target SERP terms
- [ ] Content depth audit — compare word counts against ranking competitors
- [ ] High-Performance Continuity: Ensure CT State Hub matches keyword depth of old `/concrete-foundation-crack-repair-ct` page (908 sessions)

### Tech Debt

- [ ] 80+ location markdown files have phone numbers in frontmatter fields. Templates use centralized `contact.ts`, but content frontmatter is hardcoded. If a phone number changes, grep `src/content/` for the old number.
- [ ] Future: Extract HowTo schema into shared component for services + blog posts
- [ ] **Google auth: OAuth refresh token in CI** — using OAuth refresh token instead of service account key (org policy blocks key creation). Refresh token can expire after 6 months of inactivity or if Google password changes. If the cron fails with "OAuth refresh failed", re-run `node scripts/import-calendar-projects.js` locally to get a new token, then update `GOOGLE_OAUTH_REFRESH_TOKEN` GitHub secret. Long-term fix: Workload Identity Federation (OIDC).

---

## Reference Documents

| Doc | Purpose |
|-----|---------|
| `docs/archive/BRAND-VOICE.md` | Expert Jester voice guide + proposed copy changes (ARCHIVED — deferred to post-launch) |
| `docs/BRAINSTORM-AGENDA.md` | 38 expertise questions for Matt (UNANSWERED) |
| `docs/SEO-STRATEGY-2026.md` | SEO playbook (23 parts, includes SERP Acquisition Playbook) |
| `docs/CONTENT-CALENDAR-2026.md` | Editorial calendar (81 posts: 42 published, 39 drafts) |
| `docs/COMPETITIVE-ANALYSIS.md` | Competitor audit across 5 states (March 2026) |
| `docs/MARKETING-PLAN-2026.md` | Brand persona, channels, geo-targeting |
| `docs/archive/` | Completed work, original plans, consumed references |
| `CLAUDE.md` | Project rules and validation requirements |
