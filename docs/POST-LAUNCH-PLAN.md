# Attack A Crack: Post-Launch Growth Plan

> **The only task tracker.** Site launched March 21, 2026.
> Launch history archived in `docs/archive/LAUNCH-HISTORY.md`.

---

## This Week: Content Blitz + Media Upgrades

### Blog: Publish Tier 1 + 2 Now, Then 2/Week for the Rest of the Year

**Tier 1 + 2 — Publish ASAP (Matt reviews, Claude deploys):**

These fill genuine search gaps and need to go live now:

- [x] `lally-columns-guide.md` — 5,400/mo, KD 10. Published Feb 14 with educational disclaimer (AAC doesn't do lally column work).
- [x] `flex-seal-basement-cracks.md` — 49,500 vol cluster. Published Feb 26. Crushes A-1's 5 thin posts.
- [x] `efflorescence-white-powder-basement-walls.md` — 18,100/mo panic search. Published Mar 10. 2.4x longer than Groundworks' version.
- [ ] `musty-smell-basement-causes-solutions.md` — panic search trigger, high intent.
- [ ] `french-drain-vs-crack-injection.md` — comparison content, converts well.
- [ ] `basement-waterproofing-cost-guide.md` — 5,400/mo cost intent, bottom of funnel.
- [ ] `stone-foundation-repair-guide.md` — 1,000/mo. Done Right Services owns this; easy grab.
- [ ] `foundation-repair-during-home-purchase.md` — real estate crossover, high commercial intent.
- [ ] `crawl-space-foundation-problems.md` — invades Groundworks territory.
- [ ] `sump-pump-vs-crack-injection.md` — comparison content.
- [ ] `basement-humidity-control-guide.md` — educational funnel entry point.
- [ ] `south-shore-foundation-problems.md` — Zone 1 fortress content.
- [ ] `poured-concrete-foundation-repair.md` — foundation type authority.
- [ ] `brick-foundation-repair-guide.md` — foundation type authority.
- [ ] `foundation-repair-home-sellers.md` — real estate B2B referral angle.

### 2026 Content Calendar: 2 Posts/Week, Every Week (Claude writes, Matt reviews monthly)

**This is the single most important content task.** The 26 remaining Tier 3 drafts cover ~13 weeks. After that, the pipeline is empty. We need a full calendar through end of 2026 — every post written, dated, and ready to publish.

**Cadence:** 2 posts/week = ~80 posts for the rest of 2026 (April–December). Between the 26 existing Tier 3 drafts and ~54 new posts to write, every week must have content queued.

**Matt's role:** Review in batches — once a week (2 posts) or once a month (8 posts). Claude writes them all; Matt approves before publish date.

**The full April–December 2026 calendar must be built out ASAP.** That's ~80 posts total (2/week × 40 weeks). 26 existing Tier 3 drafts + ~54 new posts to write. Every single one needs to exist as a draft before Matt starts his regular review cadence.

**Step 1 — Full content calendar research & planning (Claude):**
- [ ] Build the complete April–December calendar in `docs/CONTENT-CALENDAR-2026.md`
- [ ] For every post: topic, target keywords, search volume, keyword difficulty, competitive analysis (who ranks now and why we'll beat them), seasonal rationale (why this month)
- [ ] Organize by topic cluster and seasonal relevance (summer moisture, fall prep, winter freeze, spring thaw)
- [ ] Source ideas from: keyword gaps vs competitors, GSC data (once available), project case studies, PAA questions, seasonal search trends
- [ ] Present the full calendar to Matt for sign-off before writing begins

**Step 2 — Write all ~80 posts as drafts (Claude):**
- [ ] Slot the 26 existing Tier 3 drafts into their assigned weeks
- [ ] Write the remaining ~54 new posts as complete drafts with publication dates
- [ ] Each post: full content, SEO metadata, hero image (AI-generated where needed)
- [ ] All posts committed to the repo as draft markdown, ready for review

**Step 3 — Matt's regular review cadence:**
- [ ] Review posts in batches (weekly or monthly — Matt's call)
- [ ] Give feedback, approve or request changes
- [ ] Ensure the right hero image is in place
- [ ] Ship on the scheduled date

**Step 4 — Ongoing optimization:**
- [ ] Monitor which published posts get traction in GSC → write follow-up/cluster content around winners
- [ ] Refresh the calendar quarterly with new topics as data comes in

### Image Audit & Cleanup (Claude + Matt)

We have hundreds of real project photos across the site. The problem isn't quantity — it's relevance and accuracy. Images were bulk-assigned and some are wrong for their context.

**Completed — Hero image diversity overhaul (March 22, 2026):**
- [x] Rewrote `getProjectImageForCity()` with cross-state pool + deterministic hash — went from 6 unique images across 127 pages to 91 unique images (72% diversity)
- [x] Added 9 new media photos from Matt, Ed, and Rob with full WebP responsive variants
- [x] Added `heroImage` frontmatter override to location schema for manual curation
- [x] Created `scripts/audit-image-diversity.js` (`npm run audit:images`)

**Known issues still to fix:**
- [ ] CT city pages showing MA-only workers (e.g., Mike) or MA-only services (concrete resurfacing) — CT doesn't offer resurfacing
- [ ] City pages showing repair types not available in that state (resurfacing photos on CT pages)
- [ ] Random/low-quality shots used as heroes where a better image exists in the pool
- [ ] Some pages could benefit from targeted AI-generated hero images where no good real photo fits

**Step 1 — Full image audit (Claude):**
- [ ] Audit every location page hero: flag images that show the wrong state's crew, wrong service type for that state, or low-quality shots
- [ ] Audit service page images: ensure each service page shows that specific repair type, not a generic crack photo
- [ ] Audit blog post hero images: flag reused images and mismatched subjects
- [ ] Produce a report of all issues with recommended fixes

**Step 2 — Fix assignments (Claude):**
- [ ] Use `heroImage` frontmatter overrides on location pages where the algorithm picked a bad match
- [ ] Reassign blog/service images where needed
- [ ] Generate targeted AI hero images (via `scripts/generate-blog-images.js`) for pages where no real photo fits

**Step 3 — New real photos (Matt, ongoing):**
- [ ] As new projects are completed, add before/after photos → they automatically enter the hero image pool
- [ ] Prioritize photos from CT, RI, NH, ME jobs (these states have the fewest project photos)

### Video Content (Matt — see `docs/VIDEO-STRATEGY-2026.md`)

Video is the #1 E-E-A-T signal for home services. 30 seconds of before/after is worth 5,000 words.

**Completed — 18 videos embedded across 11 pages (March 24, 2026):**
- [x] 18 YouTube Shorts embedded across about, services hub, 5 service pages, 4 blog posts, and What We Don't Do
- [x] VideoObject schema on all 13 pages with video embeds via `src/utils/video.ts` helper
- [x] Right-float layout with text wrap on all markdown-embedded videos
- [ ] Shoot homepage intro video (highest-value E-E-A-T signal — no competitor has this)
- [ ] Shoot Flex Seal debunk video (49,500/mo keyword cluster — highest-value SEO video)
- [ ] Shoot CT state hub video, MA state hub video, concrete repair walkthrough
- [ ] Post videos to both GBP listings

### Backlink Building (Matt — AAC has ZERO authority backlinks)

This is the single biggest gap vs. competitors. A-1 has BBB links, CrackX has 492 from todayshomeowner.com.

**Important:** Most directory platforms (Yelp, Angi, Houzz, Thumbtack, Today's Homeowner) gate dofollow links behind expensive paid plans. Matt paid Angi thousands in 2024 — got 2 leads, zero ROI. These are lead-gen businesses, not backlink opportunities. Don't pay for links dressed up as lead gen.

**Step 1 — Backlink strategy session (Claude deep-dive):**
- [ ] Audit every existing profile (BBB, Yelp, Angi, Thumbtack) — check actual link attributes (dofollow vs nofollow)
- [ ] Analyze competitor backlink profiles — where are A-1, CrackX, Groundworks actually getting dofollow links?
- [ ] Research CrackX's 492 todayshomeowner.com links — paid content? Affiliate? Editorial?
- [ ] Build a ranked backlink opportunity list with estimated cost, effort, and link value
- [ ] Present findings to Matt with clear ROI recommendations

**Step 2 — Free/earned backlink opportunities (no pay-to-play):**
- [ ] **BBB** — ensure profile links back to attackacrack.com (already submitted)
- [ ] **Chamber of Commerce** — submit to CT and MA chapters (membership fee, but real .org dofollow links)
- [ ] **Partner reciprocal links** — ask realtors/inspectors in partner network to link back
- [ ] **Supplier/manufacturer directories** — get listed on Polygem, Sika "find an installer" pages
- [ ] **ASHI membership directory** — already a member, ensure link is active
- [ ] **Local sponsorships** — Little League, community events, 5Ks (event sites link to sponsors, .org domains)
- [ ] **Guest posts on home inspection blogs** — leverage existing partner relationships
- [ ] **Local press/news** — pitch stories (crumbling foundations in CT is genuinely newsworthy)
- [ ] **HARO/Connectively** — respond to journalist queries as a foundation repair expert

### GBP Optimization (Matt)

GBP controls 50%+ of local search results. Both locations need full optimization.

- [ ] Upload 10+ real project photos to each GBP listing
- [ ] Seed Q&A with 5 common questions on each listing
- [ ] Add all services to both listings
- [ ] Set up 2x/week GBP posting schedule
- [ ] Respond to all existing reviews (within 24 hours going forward)

---

## Monitor First 48 Hours

- [x] Check GSC for crawl errors (Coverage report) — 464 queries indexed in first 3 days
- [x] Check GA4 for traffic flowing (Realtime report) — 379 sessions in 3 days, 1.58% conversion rate
- [ ] Check Vercel dashboard for 404 spikes (Functions/Analytics tab)
- [ ] Watch for old URLs 404ing that aren't in the 74 redirects — add new redirects as needed
- [x] Use URL Inspection tool to request indexing on these 10 priority pages:
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

## Lighthouse Fixes (Claude)

- [x] **Fix crack injection A11y (95)** — Color contrast failure: blue badge (`text-aac-blue` on dark hero bg) had 3.2:1 ratio. Fixed: switched to `text-sky-400 bg-white/10` on all dark hero badges (7.83:1 contrast).
- [x] **Fix GSC `<parent_node>` schema error** — `aggregateRating` was on `Service` type (unsupported by Google for review snippets). Moved to `provider` (`HomeAndConstructionBusiness`) on both service and concrete-repair templates. Added validation rule to `validate-schema.js` to prevent regression.
- [ ] **Fix MA hub SEO (97)** — Tap target failure: `.project-pin` links on interactive map are 3x7px, too small/overlapping. Fix: increase pin hit areas or `aria-hidden` the map pins and rely on text city list.

## Analytics & Conversion Tracking (see `docs/ANALYTICS-PLAN.md`)

**Phase 1 is P0 — do this before anything else in Week 2.**

Google Ads are running on both CT and MA accounts with zero conversion tracking. We're spending blind.

- [x] **Add Google Ads conversion tags** (MA account) to `Layout.astro` — done March 23, 2026
- [x] **Add phone/text click tracking** via event delegation script — tracks CT vs MA independently
- [x] **Mark conversions in GA4** (`phone_call_click`, `text_message_click`)
- [x] **Link GA4 to both Google Ads accounts**
- [ ] Phase 2: LocationModal tracking, form submit tracking, custom dimensions, UTM templates, call forwarding
- [ ] Phase 3: Page type classification, GA4 Explorations, link GSC to GA4, monthly reporting
- [ ] Phase 4: Evaluate call tracking service, remarketing audiences, enhanced conversions
- [x] **Set up Google Ads API access** — adwords scope + developer token active
- [x] **Run Google Ads waste audit** (MA account) — via `scripts/master-audit.js`
- [x] **Implement negative keyword lists** from waste audit — competitor brands monitored, not adding negatives yet per Matt's decision
- [x] **Audit campaign structure + landing pages** — 60 city ad groups with city-specific landing pages created March 24
- [ ] Set up monthly Google Ads analysis cadence

## City Page Conversion Optimization (plan archived to `docs/archive/`)

Phase 1 complete (sticky CTA, review snippet, hero CTAs, services reorder, SMS, keywords, RSA, compact layout). Remaining work:

**Phase 2 — Deeper optimization (April, after conversion data):**
- [ ] Lead capture form for desktop visitors
- [ ] Seasonal urgency signals (honest: "spring scheduling filling up", date-driven banners)
- [ ] Testimonial placement higher on page (compact review snippet below hero, above content)

**Phase 3 — Paid-only landing page (June+, data-dependent):**
- [ ] Dedicated `/lp/` template, A/B test via Google Ads experiment (needs 2+ weeks of conversion data first)

## CI/CD Pipeline Upgrade (see `docs/CICD-IMPROVEMENT-PLAN.md`)

Switch from working on `main` to feature branches with Vercel preview environments and an on-demand regression suite.

- [ ] Create `scripts/check-sitemap-diff.js` and `scripts/check-redirects.js`
- [ ] Create `.github/workflows/regression.yml` (on-demand suite) and `.github/workflows/deploy.yml`
- [ ] Create `.github/workflows/claude-code.yml` (AI diagnosis on PR failures)
- [ ] Update `lighthouserc.cjs` (1 run/page, CI override comment)
- [ ] Archive `quality.yml`, update `import-projects.yml` for branch protection
- [ ] Re-enable Vercel GitHub integration for preview deployments only
- [ ] Enable branch protection on `main`
- [ ] Test full workflow: feature branch → push → preview → regression → auto-merge → deploy

## Week 2-4: Citations + Monitoring

- [ ] Citation audit — verify NAP consistency across BBB and any active directory profiles
- [ ] Fix inconsistent citations
- [ ] Submit to free directories where competitors are listed (skip pay-to-play platforms)
- [ ] Set up uptime monitoring (UptimeRobot free tier)
- [ ] Verify Vercel cache headers working correctly (`/_astro/*` = 1yr, `/*.html` = revalidate)
- [ ] Test all 74 redirects systematically (not just spot-check)
- [ ] Monitor position tracking (234 keywords baselined in SEMrush)
- [ ] Begin review acquisition campaign (target 300+)
- [ ] Export GSC data after 3 weeks of indexing → send to Claude for gap analysis
- [ ] Re-run SEMrush keyword gap analysis → send to Claude

## Month 2-3: Expansion + Link Building

- [x] **CT city expansion** — 16/16 new cities created (36 total CT cities) — completed, plan archived to `docs/archive/`
- [x] **MA city expansion Phases 1-4** — 30/41 new cities created (60 total MA cities) — plan archived to `docs/archive/`
- [ ] **MA city expansion Phase 5** — 11 competitor-targeted cities remain: Dedham, Medford, Malden, Revere, Chelmsford, Billerica, Andover, Methuen, Attleboro, Wareham, Stoughton. Also need to update `maRegions` in `src/pages/massachusetts/index.astro` to add Merrimack Valley region.
- [ ] Optimize pages at positions 4-10: foundation crack, leaky bulkhead, basement wall crack
- [ ] Push bulkhead cluster from positions 14-20 to page 1
- [ ] Execute backlink strategy from deep-dive analysis (see Backlink Building section above)
- [ ] Continue 2 posts/week from the full content calendar

## SERP Domination (see `docs/SERP-DOMINATION-PLAN.md`)

Execution plan for maximizing SERP coverage — schema upgrades, featured snippets, ranking optimization, entity building, and backlinks.

- [x] **Schema: Rich result expansion** — HowTo on all 5 service pages; VideoObject on all 13 video-embedded pages via `src/utils/video.ts`
- [x] **Schema: Credential & profile** — `hasCredential`, `memberOf`, `sameAs` (8 URLs: FB, IG, LinkedIn, BBB, Yelp CT/MA, Google Maps CT/MA) all live
- [x] **Ranking: Quick wins** — 10 internal links added to quick-win pages (Flex Seal, lally columns, basement floor cracks, bulkhead service)
- [x] **Ranking: Gap posts** — Internal links added from related published posts to boost authority
- [x] **Snippets: Featured snippet prep** — "What is X?" definitions on 6 service pages, cost comparison tables on both published cost guides
- [ ] **Entity: NAP consistency audit** — Verify identical info across BBB, ASHI, GBAR, chambers, Google Maps, Yelp
- [ ] **Backlinks: Directory verification** — Confirm all org memberships have active backlinks to attackacrack.com
- [ ] **Backlinks: Google Guaranteed** — Apply for Local Services Ads (green checkmark in SERP)

## Trust Badges & Credentials (plan archived to `docs/archive/`)

- [x] TrustBar component, all page placements, footer licenses, about page, schema — all done
- [ ] **Badge image optimization** — Run `npm run optimize:images` on badge logos (may already be WebP)
- [ ] **Competitive badge audit** — Add Section 10 to `docs/COMPETITIVE-ANALYSIS.md`

## SEO Quick Wins (Claude — with GSC data)

- [ ] Title tag optimization — audit against target keywords from SEMrush
- [ ] Meta description optimization — rewrite underperformers using CTR data from GSC
- [ ] H1/H2 keyword alignment — match heading hierarchy to target SERP terms
- [ ] Content depth audit — compare word counts against ranking competitors
- [ ] High-Performance Continuity: CT State Hub must match keyword depth of old `/concrete-foundation-crack-repair-ct` page (908 sessions)
- [ ] Add "bulkhead door" as H2 on bulkhead service page (searchers use "door" not "bulkhead")

## Luc's Professional Info (E-E-A-T — Matt)

Every piece of credential info strengthens Google's trust signal for AAC.

- [ ] Certifications and training
- [ ] Years in foundation repair specifically
- [ ] Professional memberships or associations
- [ ] LinkedIn profile URL
- [ ] Awards, press mentions, speaking engagements
- [ ] Justin La Fontaine's title/role and tenure

## Visual QA (Matt)

- [x] About page walkthrough
- [x] Mobile spot-check on each page type (iPhone + Android)

## Ongoing

- [ ] B13 Phase 2: Mobile intake form for technician case studies
- [ ] Social media posting (3x/week per marketing plan)
- [ ] PAA targeting in blog content
- [ ] Monitor competitor moves (see `docs/SEO-STRATEGY-2026.md` Part 23)
- [ ] WordPress-era URL audit (hunt old 2022 URLs for 301 redirects)
- [ ] Panic cluster Frase audits ("water in basement after rain", "musty smell", "white powder")

## Content Gaps Identified

- [ ] **Spring foundation inspection walkthrough** (HIGH PRIORITY — it's spring now) — draft exists at `spring-foundation-inspection-walkthrough.md`. When published, link back from `south-shore-foundation-problems.md`.
- [ ] **Quincy coastal foundation repair guide** — draft exists at `quincy-foundation-repair-coastal.md`. When published, link back from `south-shore-foundation-problems.md`.
- [ ] **Carbon fiber straps blog article** — AAC offers carbon fiber straps (wall stabilization) in MA. The horizontal cracks article references straps but had an incorrect link to the carbon fiber stitches service page (stitches ≠ straps). Need a dedicated blog post explaining straps as a service. When published, link back from the horizontal cracks article.
- [ ] **Foundation repair for home sellers** — draft exists at `foundation-repair-home-sellers.md`. When published, re-add links from `foundation-repair-warranty-guide.md` (transferability section) and add to its relatedPosts. Also re-add link from `selling-house-foundation-issues-ma.md` (draft).
- [ ] **Stone/fieldstone foundation repair guide** — draft exists at `stone-foundation-repair-guide.md`. When published, re-add links from `how-we-diagnose-foundation-problems.md` (foundation type section) and `south-shore-foundation-problems.md` (fieldstone section). Also re-add links from drafts: `poured-concrete-foundation-repair.md`, `hartford-ct-foundation-problems.md`, `new-england-foundation-types-visual-guide.md`.
- [ ] **Underpinning repair blog article** — Currently a negative keyword in Google Ads (we don't offer this service). Future blog post could educate on the topic + position AAC for related foundation work. When a post exists, re-evaluate as an ad keyword.
- [ ] **Slab jacking / mudjacking blog article** — Same as underpinning: currently negative keyword, not our service. Future educational content could capture this traffic and redirect to our concrete repair services. Re-evaluate as ad keyword when post exists.

## Deferred Items

- [ ] Partner expansion — drafts ready: insurance adjusters, mold remediation, plumbers, landscapers
- [ ] Brand voice review — `docs/archive/BRAND-VOICE.md`
- [ ] Marketing plan review — `docs/MARKETING-PLAN-2026.md`
- [ ] Basement floor multi-state blog post (all 5 states, linking to MA service page)
- [ ] Handle old Squarespace CDN image URLs (low priority, monitor)
- [ ] Financing page integration (Hearth/GreenSky)
- [ ] Consider upgrading Buffer to Team plan ($10/mo) for 2,000 scheduled posts

- [ ] Before/after photo verification — flip `beforeAfterVerified: true` on verified pairs

## Tech Debt

- [ ] 80+ location markdown files have hardcoded phone numbers. If a number changes, grep `src/content/`.
- [ ] Lighthouse CI on real servers — tracked in CI/CD Improvement Plan above
- [ ] Extract HowTo schema into shared component for services + blog posts
- [ ] Google OAuth refresh token expiry — re-run `import-calendar-projects.js` locally if cron fails, update `GOOGLE_OAUTH_REFRESH_TOKEN` secret
