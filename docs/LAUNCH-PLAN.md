# Attack A Crack: Launch Checklist

> **The only task tracker.** Every remaining item before (and after) launch. Completed work is archived in `docs/archive/LAUNCH-PLAN-COMPLETED.md`.

*Updated: March 7, 2026*
*Preview: https://aac-astro.vercel.app/*

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

### 301 Redirects & Old Site Preservation (Claude + Matt)

**Current state:** Sitemap crawled, 31 redirects now in `vercel.json` (was 10). All old Squarespace URLs from the sitemap are mapped. Remaining items need Matt's account access.

- [x] **Crawl the live Squarespace site** — pulled full sitemap from `attackacrack.com/sitemap.xml` (36 URLs)
- [x] **Map every old URL to its new equivalent** — all 36 mapped, 21 new redirects added
- [x] **Add all missing 301 redirects to `vercel.json`** — 31 total redirects now (was 10)
- [x] **Handle blog post URLs** — all 12 old blog slugs redirected to new slugs
- [x] **Handle /store/ partner pages** — `/store` and `/store/p/:slug` → `/massachusetts/trusted-partners`
- [x] **Handle /home, /trusted-partners, /partners/general-contractors** — all redirected
- [ ] **Crawl Google Search Console** — export all indexed URLs (may include pages not in sitemap)
- [ ] **Export Google Analytics top pages** — identify every URL with real traffic
- [ ] **Handle any old `/blog/` tag/category pages** — redirect to new category structure if they exist
- [ ] **Handle old image URLs** — Squarespace CDN images linked from external sites
- [ ] **Test every redirect after DNS cutover** — verify all 31 redirects resolve correctly
- [ ] **Check for external backlinks** — Ahrefs/SEMrush backlink audit, ensure linked URLs redirect

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

## Bug Fixes (Claude)

### Projects on Service Pages — FIXED

- [x] Fix `getByService()` in `src/utils/projects.ts` — was querying `p.data.serviceType` (singular), now uses `serviceTypes.includes()` (array)
- [x] Add concrete repair service types to `SERVICE_SLUG_MAP` (driveway, patio, walkway, pool-deck, stairway, garage-floor)
- [x] Verify projects appear on all 6 service pages + 6 concrete repair pages after fix

### Service Area Display — Only Showing CT & MA (Should Be All New England)

Service pages (`services/[slug].astro`) only show CT and MA in the "Available In" section at the bottom. RI, NH, and ME are missing. The concrete repair index page says "For foundation repair, we serve both MA and CT" — should say all of New England.

- [ ] **Audit all pages** for territory language limited to CT/MA — find every instance across service pages, concrete repair pages, hubs, components, content files
- [x] Fix service page `[slug].astro` "Available In" section to include all 5 states (CT, MA, RI, NH, ME)
- [x] Fix concrete repair index page to say "all of New England" instead of "MA and CT"
- [ ] Fix any other pages/components that limit territory to just 2 states
- [ ] Verify all 5 states appear wherever service territory is mentioned

### "No Salesperson" / "Person Who Does the Work" Language — Remove

Matt doesn't want "no salespeople" / "no salesperson" language anywhere on the site. Also doesn't want "speak directly to the person who does the job" — Matt talks to customers with expertise but doesn't do the repairs himself. "Talk to an expert" is the right framing.

- [ ] **Audit all pages and content** for "no sales", "salesperson", "salespeople" language
- [ ] **Audit for "person who does the job/work/repair"** and similar claims
- [ ] Replace with "talk to an expert" or equivalent language
- [ ] Verify no instances remain after fix

### Projects on Location Pages — Improve Proximity

- [ ] Current fallback: random same-state projects. Improve to nearest-town proximity using coordinates from `CITY_COORDS` in `project-import-core.js`
- [ ] Verify location pages show local projects first, then nearby towns, then same-state

### Internal Linking — Resolve 44 Orphaned Blog Posts

44 of 73 blog posts have zero incoming internal links. Blog content exists but the rest of the site doesn't link to it. All fixes use existing schema fields (reverse-lookups at build time) — no new content fields needed.

- [ ] Create shared utility `src/utils/blog-linking.ts` with `getBlogForLocation()` and `getBlogForService()`
- [ ] **Service pages** (`services/[slug].astro`) — add "Helpful Guides" section using reverse-lookup from blog `relatedServices` (up to 4 posts per service page)
- [ ] **Concrete repair pages** (`concrete-repair/[slug].astro`) — same pattern as service pages
- [ ] **Location pages** (all 5 state `[city].astro` templates) — add "Foundation Guides" section with 3-tier matching: exact city → targetLocation contains → same state (up to 3 posts)
- [ ] **Project detail pages** (`projects/[slug].astro`) — make service type badges clickable links to service pages; add "Related Articles" section
- [ ] **Homepage** (`index.astro`) — add "Latest from Our Blog" section (3 most recent posts)
- [ ] **Blog related posts** (`blog/[slug].astro`) — improve fallback scoring: shared services (+3), shared category (+2), shared state (+1) instead of random same-category
- [ ] **Update `validate-links.js`** — recognize template-level reverse-lookup links so orphan count reflects reality
- [ ] Run `npm run validate` — all checks pass
- [ ] Verify orphan count drops significantly in `validate-links.js` output

---

## Page-Level Improvements

### Completed

- [x] Fix team section invisible on About page (move animation observer to Layout.astro)
- [x] Update values section headings: Honesty, Responsiveness, Quality
- [x] Create expanded team component (TeamExpanded.astro) for About page
- [x] Foundation Types → Blog migration (category, redirects, links)
- [x] Services Hub restructure (concrete repair card, "Dive Deeper" blog section)
- [x] Updates Page restructure (pagination, category filters, recent projects)
- [x] Trusted Partners cross-link from `/partners/`

### Remaining

#### Static SVG Map (Lower Priority)

- [ ] Create ServiceAreaMap.astro with New England outline + 80 city dots
- [ ] Color-code by establishment (CT/MA blue, RI/NH/ME lighter)
- [ ] Add to areas-we-serve page

#### Pre-Launch Visual QA Pass (Matt)

- [ ] Homepage walkthrough
- [ ] Services hub + each service page
- [ ] About page
- [ ] Updates page
- [ ] Areas We Serve
- [ ] Partners hub + Trusted Partners
- [ ] Sample blog post + sample location page
- [ ] Mobile spot-check on each

---

## Brand Voice Refresh (Matt → Claude)

The "Expert Jester" voice guide is complete with before/after copy proposals for 10 page sections. **Nothing changes on the site until Matt approves.**

See: `docs/BRAND-VOICE.md` — especially the "Proposed Changes Appendix"

- [ ] Matt reads `docs/BRAND-VOICE.md`
- [ ] Approve or revise homepage hero + CTA ("Your Foundation Called. We Answered.")
- [ ] Approve or revise homepage testimonials header
- [ ] Approve or revise about page story + values copy
- [ ] Approve or revise services hub descriptions
- [ ] Approve or revise team bios (Luc, Matt, Ed, Justin, Mike)
- [ ] Note any lines that feel off-brand or too casual
- [ ] Claude implements approved changes
- [ ] Visual verification of all changed pages

---

## Brainstorm Session — Expertise Deep-Dive (Matt)

38 unanswered questions in `docs/BRAINSTORM-AGENDA.md`. Answers unlock better content across the entire site.

### Priority A: Technical Specs (verify what's on the site now)
- [ ] Injection PSI — we wrote 100 PSI based on old site. Correct?
- [ ] Copper ports vs plastic — what brand/type?
- [ ] Diamond saw specifics — blade size, groove depth?
- [ ] Carbon fiber product specs — manufacturer, tensile strength?
- [ ] Finishing materials — what goes over the injection?

### Priority B: Luc's Credentials (E-E-A-T, About page)
- [ ] When did Luc start? (we say age 16 — confirm)
- [ ] Total years of experience?
- [ ] ASHI certification number?
- [ ] Any other certs, training, manufacturer certifications?
- [ ] Industry roles, associations, memberships?

### Priority C: Case Studies (blog content, project depth)
- [ ] 3-5 memorable job stories: hardest repair, unusual discovery, emergency call, historic home, dramatic transformation
- [ ] Real project details for the "What Does Foundation Repair Look Like" blog post

### Priority D: Operational Details
- [ ] First visit = same-day repair? How often?
- [ ] Insurance coverage — do you help homeowners navigate claims?
- [ ] Multiple crack discount — real policy?
- [ ] GBAR membership status?

### After Matt Answers:
- [ ] Claude weaves answers into service pages, blog posts, About page, location pages
- [ ] Update Person schema with verified credentials
- [ ] Enrich case study blog posts with real details

---

## Content Depth (Claude + Matt)

### D8. About Page E-E-A-T (Needs Brainstorm Answers)

- [ ] Luc's credentials: certs, training, years, professional links
- [ ] Justin La Fontaine's title/role and tenure
- [ ] Company milestones timeline
- [ ] Enrich Person schema with verified data

### D9. City Page Deep Localization (Claude)

- [ ] Neighborhood specifics for top 20 cities (hyper-local content)
- [ ] Run uniqueness check against all 80 city pages

### Partner Decisions (Matt)

- [ ] Brainstorm additional partner personas (waterproofing, basement finishing, real estate attorneys)
- [ ] Provide partner testimonials for new persona types
- [ ] Name the trusted partners page (Preferred? Trusted? Recommended?)

### Schema Enhancements (Claude — when photos available)

- [ ] Add ImageObject schema for before/after photos on service pages
- [ ] Add ImageObject schema on project/case study pages

---

## SEO Competitive Deep-Dive (Claude + Matt)

Full competitive audit to maximize SERP dominance before and after launch.

### Data Collection (Matt — needs account access)

- [ ] **Google Search Console export** — all queries, pages, impressions, clicks, positions for attackacrack.com
- [ ] **Google Analytics export** — top landing pages, organic traffic by page, bounce rates, conversion paths
- [ ] **SEMrush competitive analysis** — pull reports for:
  - [ ] attackacrack.com current keyword rankings (organic positions)
  - [ ] Top 5 competitors (identify who ranks for our target terms in CT, MA, RI, NH, ME)
  - [ ] Competitor keyword gaps — terms they rank for that we don't
  - [ ] Competitor backlink profiles — who's linking to them
  - [ ] Keyword difficulty + search volume for our target terms
  - [ ] SERP feature analysis — which terms trigger local packs, FAQs, featured snippets

### Competitive Analysis (Claude)

- [ ] **Identify top 5 local competitors** per state (CT, MA, RI, NH, ME) — who shows up in local 3-pack?
- [ ] **Audit competitor pages** — what content do they have that we don't?
- [ ] **Gap analysis** — high-volume keywords where competitors rank and we don't
- [ ] **SERP feature targeting** — identify which of our pages can win:
  - [ ] Featured snippets (definition queries, "how to" queries)
  - [ ] FAQ rich results (ensure FAQ schema on every page that answers questions)
  - [ ] Local pack (GBP optimization, citations, reviews)
  - [ ] People Also Ask (target PAA questions in blog content)
  - [ ] Image pack (before/after photos with proper alt text)
- [ ] **Content gap fill** — write new pages/posts targeting uncovered high-value terms
- [ ] **Internal linking audit** — ensure every page passes equity to target pages

### On-Page Optimization Pass (Claude)

- [ ] **Title tag optimization** — audit all 297 pages against target keywords, refine for CTR
- [ ] **Meta description optimization** — rewrite any underperforming descriptions for click-through
- [ ] **H1/H2 keyword alignment** — ensure heading hierarchy matches target SERP terms
- [ ] **Content depth audit** — are any pages thin compared to ranking competitors?
- [ ] **Schema completeness** — ensure every page type has maximum applicable schema markup
- [x] **Internal link equity flow** — homepage → service pages → city pages → blog (proper silo)
- [ ] **Image SEO** — all images have keyword-rich alt text, filenames, and proper dimensions

### Citation & Off-Page (Matt + Claude)

- [ ] **Citation audit** — verify NAP consistency across all directories (Yelp, BBB, Angi, HomeAdvisor, etc.)
- [ ] **Fix inconsistent citations** — same name, address, phone everywhere
- [ ] **Identify missing citations** — directories where competitors are listed but we aren't
- [ ] **Backlink acquisition plan** — based on competitor backlink analysis, identify realistic link targets

---

## Blog Content & Auto-Publishing

### Content Status

- 73 total blog posts (32 published, 41 drafts ready for Q2-Q4)
- All 41 drafts have complete 800-1200+ word content
- Content calendar: `docs/CONTENT-CALENDAR-2026.md`

### Matt Review (Blocking Publication)

- [ ] **Read all 41 draft blog posts** for accuracy and voice — every article needs a read-through
- [ ] Flag any that need revision
- [ ] Provide/source hero images — all 73 posts have `heroImage: ""`

### Auto-Publishing Setup — DONE

Shared `isPublished()` filter in `src/utils/blog.ts` checks both `!draft` and `publishDate <= now`. All 5 blog listing pages use it. Weekly Monday 6am ET cron redeploy via `.github/workflows/weekly-redeploy.yml`.

- [x] Add build-time filter: only publish posts where `draft !== true` AND `publishDate <= buildDate`
- [x] Add GitHub Action cron job (weekly, Monday 6am ET) to trigger Vercel redeploy
- [ ] Test: set a post with past `publishDate` + `draft: false`, verify it appears after build
- [ ] Test: set a post with future `publishDate` + `draft: false`, verify it does NOT appear
- [ ] Document workflow: Matt sets `draft: false` on reviewed posts; they auto-publish when `publishDate` arrives

---

## Automation & Infrastructure

### Project Import Pipeline (DONE — needs secrets)

Code is complete and tested. 91 projects imported. Cron runs Mon/Thu 6am ET via GitHub Actions.

- [x] Import pipeline code (`scripts/cron-import-projects.js`, `scripts/lib/project-import-core.js`)
- [x] GitHub Action workflow (`.github/workflows/import-projects.yml`)
- [x] Buffer/GBP integration (`scripts/lib/buffer-client.js`)
- [x] 91 historical projects imported with photos
- [x] 10 GBP posts queued via Buffer (through March 19)

#### GitHub Secrets Needed (Matt)

These must be added at github.com → repo → Settings → Secrets for the cron to work:

- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` — service account JSON for Calendar/Drive API
- [ ] `GEMINI_API_KEY` — for photo classification
- [ ] `BUFFER_API_TOKEN` — `QNzYfI...` (the token from tonight)
- [ ] `BUFFER_CHANNEL_ID` — `69aa1ae63f3b94a1211df5f1`
- [ ] `SITE_IMAGE_BASE` — `https://aac-astro.vercel.app`

#### Google Cloud Setup (Matt — partially done)

- [x] Google Cloud project exists
- [x] Calendar API + Drive API enabled
- [ ] Create service account (for CI/cron — different from OAuth)
- [ ] Share calendar with service account (read-only)
- [ ] Download service account key JSON → add as `GOOGLE_SERVICE_ACCOUNT_KEY` secret

#### Buffer Queue Refill

Buffer Essentials allows 10 scheduled posts. 73 projects remaining. Refill weekly:

```bash
SITE_IMAGE_BASE=https://aac-astro.vercel.app node scripts/buffer-post-projects.js \
  --channel-id 69aa1ae63f3b94a1211df5f1 --start-date YYYY-MM-DD
```

- [ ] Consider upgrading to Buffer Team ($10/mo) for 2,000 scheduled posts

### DecapCMS (Matt)

1. [ ] Create a Netlify site (deploy manually, drag empty folder)
2. [ ] Connect to GitHub repo (`mrjmd/aac-astro`, branch: `main`), disable auto-publishing
3. [ ] Enable Identity (invite-only registration)
4. [ ] Enable Git Gateway
5. [ ] Invite users
6. [ ] Claude updates `public/admin/config.yml` with Netlify site URL
7. [ ] Test: visit `/admin/`, log in, make test edit

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
- [ ] Verify Vercel cache headers working correctly
- [ ] Check server response times

### Month 1

- [ ] Publish 2-4 blog posts (per content calendar)
- [ ] Add 20+ more city pages
- [ ] Begin review acquisition campaign
- [ ] Citation audit and fixes

### Ongoing

- [ ] B13 Phase 2: Mobile intake form for technician case studies
- [ ] Execute 90-day SEO sprint (see `docs/SEO-STRATEGY-2026.md` Part 16)
- [ ] Off-page strategy execution (see `docs/SEO-STRATEGY-2026.md` Part 18)
- [ ] Social media posting (3x/week per marketing plan)

---

## Reference Documents

| Doc | Purpose |
|-----|---------|
| `docs/BRAND-VOICE.md` | Expert Jester voice guide + proposed copy changes (PENDING APPROVAL) |
| `docs/BRAINSTORM-AGENDA.md` | 38 expertise questions for Matt (UNANSWERED) |
| `docs/SEO-STRATEGY-2026.md` | SEO playbook (17 parts + off-page strategy) |
| `docs/CONTENT-CALENDAR-2026.md` | 52-week editorial calendar (41 drafts ready) |
| `docs/MARKETING-PLAN-2026.md` | Brand persona, channels, geo-targeting |
| `docs/MATT-TODO.md` | Everything Matt personally needs to do |
| `docs/archive/` | Completed work, original plans, consumed references |
| `CLAUDE.md` | Project rules and validation requirements |
