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
  - **Interim option:** If city-specific photos aren't ready at launch, use one real regional photo per area (e.g., one South Shore photo for all 20 South Shore cities) instead of random picsum images. Picsum is the #1 "template site" signal for visitors.
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

- [x] Full `npm run validate` pass (clean) — 255 pages, 867 JSON-LD schemas, 0 errors across all 7 checks
- [ ] `npm run check:images` passes with 0 placeholder warnings — *currently 8 WebP files over 400KB (non-blocking warnings); placeholder removal blocked on Matt's photos*
- [ ] Lighthouse: Performance 90+, Accessibility 95+, SEO 95+
- [x] All pricing claims verified correct — **3 inconsistencies flagged for Matt's review (see below)**
- [x] Uniqueness validation passes — 80 locations, 3,160 comparisons, 0 duplicates

#### Pricing Inconsistencies (Matt to Confirm)

1. **Crack injection floor:** Service pages/FAQs say $800-$1,200. Several blog posts say $500-$1,500. Which is the real minimum?
   - Files: `basement-waterproofing-before-freeze.md:65`, `foundation-crack-repair-before-winter.md:43`, `year-end-foundation-maintenance.md:104`, `foundation-repair-myths.md:31`
2. **Bulkhead replacement:** `leaky-bulkhead-repair.md:17` says $5,000-$10,000+, but `bulkhead-repair-cost-guide-2026.md:30` says $3,000-$6,000+
3. **Wall stabilization floor:** Some posts say $5,000, others say $6,000 (minor)

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

- [x] **Audit all pages** for territory language limited to CT/MA — found 75 instances across 27 files (see `docs/archive/TERRITORY-LANGUAGE-REVIEW.md`)
- [x] Fix service page `[slug].astro` "Available In" section to include all 5 states (CT, MA, RI, NH, ME)
- [x] Fix concrete repair index page to say "all of New England" instead of "MA and CT"
- [x] Fix any other pages/components that limit territory to just 2 states — 46 changes across 27 files, keeping CT/MA in metaTitles for SEO
- [x] Verify all 5 states appear wherever service territory is mentioned — areaServed schemas updated, descriptions expanded

### "No Salesperson" / "Person Who Does the Work" Language — Remove

Matt doesn't want "no salespeople" / "no salesperson" language anywhere on the site. Also doesn't want "speak directly to the person who does the job" — Matt talks to customers with expertise but doesn't do the repairs himself. "Talk to an expert" is the right framing.

- [x] **Audit all pages and content** for "no sales", "salesperson", "salespeople" language
- [x] **Audit for "person who does the job/work/repair"** and similar claims
- [x] Replace with "talk to an expert" or equivalent language
- [x] Verify no instances remain after fix (one exception: `foundation-repair-warranty-guide.md` warns about other companies' salespeople — appropriate editorial content)

### Centralize Hardcoded Contact Details (Claude)

Phone numbers and addresses are hardcoded in 8+ templates (`services/[slug].astro`, `concrete-repair/[slug].astro`, `projects/[slug].astro`, all 5 city templates, `index.astro`). The project already centralizes pricing (`src/utils/pricing.ts`) and reviews (`src/utils/reviews.ts`) — contact info should follow the same pattern. If Luc changes a phone number, it's currently a search-and-replace across the codebase.

- [x] Create `src/utils/contact.ts` — export `phoneCT`, `phoneMA`, `addressCT`, `addressMA`, `email`
- [x] Update all templates to import from `contact.ts` instead of hardcoding
- [x] Update JSON-LD schemas (service, location, project) to use centralized values
- [x] Verify no hardcoded phone numbers or addresses remain in templates

### Project Coordinates, Proximity & Map (Claude)

**Phase 1: Fill Project Coordinates** — DONE
All 91 projects now have lat/lng coordinates.

- [x] Created `scripts/backfill-coordinates.js` with comprehensive 49-town coordinate lookup
- [x] Backfilled coordinates on all 70 projects that were missing them
- [x] Verified all 91 projects have `coordinates` populated

**Phase 2: Location Page Proximity** — DONE
Fallback projects now sorted by haversine distance instead of random.

- [x] Added `distanceMiles()` helper and proximity sorting to `getForLocation()` and `getProjectImageForCity()`
- [x] All 5 state city templates pass `location.data.coordinates` for proximity sorting
- [x] Verified: Salem MA shows Marblehead (4mi), Danvers (8mi), Malden (14mi) — nearest projects

**Phase 3: Massachusetts Project Pin Map** — DONE
Static SVG map with 47 city pins on the MA state page. Impressive South Shore density visible at a glance.

- [x] Created `ProjectMap.astro` — static SVG with MA outline and grouped pins (count badges for multi-project cities)
- [x] Added to Massachusetts state page as "Our Work Across Massachusetts" section
- [x] Pins are non-interactive (a11y clean); "Browse All Projects" link below map
- [x] All accessibility checks pass (36 checks on MA page)

### Image Optimization Pipeline — DONE (Deploy Blocker Fix)

Lighthouse CI performance dropped to 0.75 (threshold 0.85) after photo deep-dive commit. Root cause: 161 raw phone JPGs (184MB total) served unoptimized.

- [x] Installed `sharp` as devDependency for image processing
- [x] Created `scripts/optimize-images.js` — converts each .jpg to 3 responsive WebP sizes (400w, 800w, 1400w) at quality 82
- [x] Added `npm run optimize:images` script
- [x] Generated 483 WebP files (~39MB vs 184MB originals, ~79% reduction)
- [x] Created `src/utils/image.ts` with `webpSrc()` and `projectSrcset()` helpers
- [x] Updated all templates with `srcset`, `sizes`, `width`/`height`, and `loading="lazy"` (16 files)
- [x] Enhanced `check-images.js` to enforce WebP siblings for every .jpg in `public/images/projects/`
- [x] Full validation pipeline passes

**Workflow for future images:**
1. Drop `.jpg` into `public/images/projects/`
2. Run `npm run optimize:images` (generates 3 WebP sizes)
3. Commit both `.jpg` and `.webp` files
4. Pre-commit hook → `check:images` → blocks if `.webp` siblings missing

### Internal Linking — DONE (was 44 Orphaned Blog Posts → 0)

All 73 blog posts now have incoming internal links via template-level reverse-lookups. 163 template-level links added. `validate-links.js` reports 0 errors, 0 warnings.

- [x] Create shared utility `src/utils/blog-linking.ts` with `getBlogForLocation()` and `getBlogForService()`
- [x] **Service pages** (`services/[slug].astro`) — "Helpful Guides" section (up to 4 posts per service page)
- [x] **Concrete repair pages** (`concrete-repair/[slug].astro`) — same pattern
- [x] **Location pages** (all 5 state `[city].astro` templates) — "Foundation Guides" section with 3-tier geo matching
- [x] **Project detail pages** (`projects/[slug].astro`) — clickable service badges + "Related Articles" section
- [x] **Homepage** (`index.astro`) — "Latest from Our Blog" section (3 most recent posts)
- [x] **Blog related posts** (`blog/[slug].astro`) — improved fallback scoring (services +3, category +2, state +1)
- [x] **Update `validate-links.js`** — counts template-level reverse-lookup links
- [x] All checks pass, orphan count: 44 → 0

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

#### Interactive Service Area Map

Build an interactive New England map (same style as the MA project pin map on the Massachusetts page) where each dot is a clickable city linking to its city page. Not a static SVG — dots should be interactive.

- [x] Create ServiceAreaMap.astro with New England outline + 80 city dots (clickable → city page)
- [x] Color-code by state (CT/MA blue, RI purple, NH/ME green)
- [x] Add to areas-we-serve page (replaced hero image with interactive map)
- *Mirrors the style/approach of the MA ProjectMap.astro component — hover tooltips, click-to-navigate, state outlines*

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

### D9. City Page Deep Localization (Claude) — DONE (fortress flag deferred)

- [x] Neighborhood specifics for all 80 cities — template-driven "Neighborhoods We Serve" prose section renders neighborhood lists into natural-language paragraphs on all 5 state templates
- [x] State-specific "Why {City} Homes Need Foundation Repair" section added to all 5 state templates (MA: clay/freeze-thaw, CT: variable soils, ME: deep frost/rocky coast, RI: coastal/high water table, NH: extreme winters/granite)
- [x] Run uniqueness check against all 80 city pages — 3,160 comparisons, 0 errors, 0 warnings
- [x] Body content ranges 180-400 words per city (intentional variation based on city-specific geology/history)
- [ ] **Fortress cities (Quincy, Weymouth, Braintree):** Deferred — blocked on Matt's photos and brainstorm answers. Current city pages are launch-ready without the fortress flag. Re-evaluate post-brainstorm.

### Partner Decisions (Matt)

- [ ] Brainstorm additional partner personas (waterproofing, basement finishing, real estate attorneys)
- [ ] Provide partner testimonials for new persona types
- [ ] Name the trusted partners page (Preferred? Trusted? Recommended?)

### Schema Enhancements (Claude — when photos available)

- [x] Add ImageObject schema for before/after photos on service pages
- [x] Add ImageObject schema on project/case study pages
- [ ] **Future:** If blog posts start including repair step instructions, extract HowTo schema logic from `services/[slug].astro` into a shared `SchemaHowTo.astro` component so both services and blog posts can generate HowTo rich snippets without duplicating code

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

### On-Page Optimization Pass (Claude — blocked on Data Collection above)

**This pass should not begin until Matt provides GSC, Analytics, and SEMrush data.** Optimizing titles, descriptions, and headings without keyword performance data is guesswork. The exports above will tell us which pages underperform, which keywords to target, and where competitors outrank us.

- [ ] **Title tag optimization** — audit all pages against target keywords from SEMrush data, refine for CTR
- [ ] **Meta description optimization** — rewrite underperforming descriptions using click-through data from GSC
- [ ] **H1/H2 keyword alignment** — ensure heading hierarchy matches target SERP terms from keyword research
- [ ] **Content depth audit** — compare page word counts against ranking competitors from SEMrush
- [x] **Schema completeness audit** — comprehensive audit completed March 7. Key findings:
  - Validator does not check RI/NH/ME location pages (only CT/MA) — add to validator
  - Homepage missing AggregateRating (most impactful gap)
  - Concrete repair pages missing AggregateRating (inconsistent with service pages)
  - Blog posts missing `wordCount` and `articleSection` (easy additions)
  - Location pages missing `geo` GeoCoordinates on business schema (coordinates available but not used)
  - Blog index has no schema (should have ItemList)
  - Full findings documented in session; actionable items can be implemented post-launch data collection
- [x] **Internal link equity flow** — homepage → service pages → city pages → blog (proper silo)
- [x] **Image SEO** — all images have keyword-rich alt text (service type + city + state pattern), filenames, and proper dimensions

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
- [x] Test: set a post with past `publishDate` + `draft: false`, verify it appears after build
- [x] Test: set a post with future `publishDate` + `draft: false`, verify it does NOT appear — also fixed `getStaticPaths` to exclude unpublished posts from build & sitemap
- [x] Document workflow — see below

#### Auto-Publishing Workflow

**How it works:**

1. Every blog post in `src/content/blog/` has two fields that control visibility:
   - `draft: true/false` (default: `false`) — your editorial kill switch
   - `publishDate: YYYY-MM-DD` — the scheduled publication date

2. A post only appears on the site when **both** conditions are met:
   - `draft` is `false` (or omitted, since it defaults to false)
   - `publishDate` is today or earlier

3. A GitHub Actions cron job (`.github/workflows/weekly-redeploy.yml`) triggers a Vercel rebuild every **Monday at 6am ET**. This is when scheduled posts go live.

**To schedule a post for auto-publishing:**

1. Review the post content in `src/content/blog/{slug}.md`
2. Set `draft: false` (or remove the `draft` line entirely)
3. Confirm `publishDate` is set to the desired date (already set per content calendar)
4. Commit and push to `main`
5. The post will automatically appear on the next Monday rebuild after its `publishDate`

**To publish immediately (skip the weekly cron):**

1. Set `draft: false` and `publishDate` to today or earlier
2. Commit and push to `main` — the CI/CD deploy will include the post

**To unpublish a post:**

1. Set `draft: true` in the post's frontmatter
2. Commit and push — the post will be removed from the next build

**Important:** Posts with `draft: true` or future `publishDate` are completely excluded from the build output — they won't appear in listings, sitemaps, or even as direct URLs.

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

### Tech Debt

- [ ] ~80 markdown files (blog posts, location pages, partner pages) have hardcoded phone numbers in body text. Markdown can't import TS utilities. If phone numbers change, grep `src/content/` for the old number. Consider replacing inline phone numbers with CTAs or links to the contact page instead.

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
