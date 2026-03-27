# Attack A Crack: Post-Launch Growth Plan

> **The only task tracker.** Site launched March 21, 2026.
> Launch history archived in `docs/archive/LAUNCH-HISTORY.md`.

---

## This Week: Content Blitz + Media Upgrades

### Blog: Publish Tier 1 + 2 Now, Then 2/Week for the Rest of the Year

**Tier 1 — Publish ASAP (highest impact, spring-timing-sensitive):**

Prioritized by SEMrush keyword gap data (March 2026), search volume, competitive opportunity, and seasonal timing.

- [x] `lally-columns-guide.md` — 5,400/mo, KD 10. Published Feb 14.
- [x] `flex-seal-basement-cracks.md` — 49,500 vol cluster. Published Feb 26.
- [x] `efflorescence-white-powder-basement-walls.md` — 18,100/mo panic search. Published Mar 10.
- [x] `sump-pump-vs-crack-injection.md` — comparison content. Published.
- [x] `south-shore-foundation-problems.md` — Zone 1 fortress content. Published.
- [x] `prevent-basement-flooding-new-england.md` — 18,100 + 14,800/mo. Published Mar 19. AI hero image, spring checklist reordered per Matt's review.
- [x] `basement-humidity-control-guide.md` — 40,500/mo cluster. Published Mar 13. AI hero image.
- [x] `musty-smell-basement-causes-solutions.md` — panic search. Published Mar 16. AI hero image.
- [x] `crawl-space-foundation-problems.md` — 18,100/mo. Published Mar 4. Semantic upgrade: cost table, 7 FAQs with schema, expanded encapsulation/vapor barrier/dehumidifier sections, DIY vs pro (~1,740→3,000 words). AI hero image.
- [x] `basement-waterproofing-cost-guide.md` — 5,400/mo. Published Mar 8. Semantic upgrade: cost-by-size table, signs section, foundation type section, 6 FAQs with schema (~1,700→3,000 words). AI hero image.

**Tier 2 — Publish ASAP (strong opportunity, less time-pressure):**

- [x] `carbon-fiber-straps-bowing-walls.md` — Published Mar 11. Added tree roots/drainage as causes, MA-only (no CT number). AI hero image.
- [x] `french-drain-vs-crack-injection.md` — Published Mar 6. AI hero image.
- [x] `how-to-choose-foundation-repair-contractor.md` — 9,900/mo. Published Mar 2. CT license lookup link added, process language fixed. AI hero image.
- [x] `concrete-stair-repair-cost-guide.md` — 2,900/mo. Published Feb 28. Reframed repair methods, fixed timeline/process, MA-only. AI hero image.

### 2026 Content Calendar: 1 Post/Week, Every Week (Claude writes, Matt reviews in batches)

**This is the single most important content task.** The 26 remaining Tier 3 drafts cover ~13 weeks. After that, the pipeline is empty. We need a full calendar through end of 2026 — every post written, dated, and ready to publish.

**Cadence:** 2 posts/week = ~80 posts for the rest of 2026 (April–December). Between the 26 existing Tier 3 drafts and ~54 new posts to write, every week must have content queued.

**Matt's role:** Review in batches — once a week (2 posts) or once a month (8 posts). Claude writes them all; Matt approves before publish date.

**The full April–December 2026 calendar must be built out ASAP.** That's ~80 posts total (2/week × 40 weeks). 26 existing Tier 3 drafts + ~54 new posts to write. Every single one needs to exist as a draft before Matt starts his regular review cadence.

**Step 1 — Full content calendar research & planning (Claude):**
- [x] Build the complete April–December calendar in `docs/CONTENT-CALENDAR-2026.md` — completed March 24, 2026
- [x] For every post: topic, target keywords, search volume, keyword difficulty, competitive analysis, seasonal rationale
- [x] Organize by topic cluster and seasonal relevance
- [x] Source ideas from: keyword gaps (153 missing + 1,000 untapped from SEMrush), competitor positions (A-1, CrackX, Groundworks)
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
- [x] Shoot homepage intro video — company overview video embedded in hero (March 25, 2026). VideoObject schema live.
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
- [x] **BBB** — accredited, profile links back to attackacrack.com
- [x] **Chamber of Commerce** — Quincy Chamber joined; more chapters planned
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
- [x] **~~Fix MA hub SEO (97)~~** — Deferred. Tap target issue on interactive map pins is cosmetic; not worth the effort vs. other priorities.

## Analytics & Conversion Tracking (see `docs/ANALYTICS-PLAN.md`)

**Phases 1-2 complete.** Full implementation archived to `docs/archive/ANALYTICS-PHASES-1-2-COMPLETED.md`.

**Phase 3 — Content Intelligence (ACTIVE):**
- [x] GA4 Explorations built (Content ROI, City Performance, CT vs MA, Conversion Funnels)
- [x] GSC linked to GA4
- [x] Google Ads conversion tracking (MA account, imports from GA4)
- [x] GBP UTM links on both listings — done March 25, 2026
- [x] Data-driven attribution — already default on all GA4 properties
- [ ] First monthly report (after April 7)
- [ ] Set up monthly Google Ads analysis cadence

**Phase 4 — Engagement Intelligence (zero perf impact except Clarity):**
- [x] Scroll depth tracking on city pages — implemented March 25, 2026
- [x] Blog read-complete tracking — implemented March 25, 2026
- [x] Video play/complete tracking (play + complete events) — implemented March 25, 2026
- [ ] Microsoft Clarity on city pages only (2-4 week data sprint, then remove)

**Phase 5 — Automated API Scripts (all server-side, zero client impact):**
- [x] Google Ads report, negatives, assets scripts — built March 24
- [x] GA4 + GSC report scripts — built March 24
- [x] Search-to-Conversion bridge script (`npm run report:bridge`) — built March 25, uses click-share probabilistic model with confidence scores
- [x] Seasonal benchmarking script (`npm run report:benchmark`) — built March 25
- [ ] Content decay alert script
- [ ] Landing page performance script (see `docs/GOOGLE-ADS-STRATEGY.md`)
- [ ] Competitor auction insights script (see `docs/GOOGLE-ADS-STRATEGY.md`)

**Phase 6 — Strategic:**
- [ ] Quo VoIP integration — pull call logs, match to web sessions (replaces call forwarding)
- [ ] OCI: GCLID capture → Pipedrive → upload job revenue to Google Ads (full architecture in `docs/GOOGLE-ADS-STRATEGY.md`)
- [ ] Remarketing audiences in GA4
- [ ] Vercel custom events (ad-blocker backup)

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
- [x] **MA city expansion Phase 5** — 11/11 competitor-targeted cities created March 24: Dedham, Medford, Malden, Revere, Chelmsford, Billerica, Andover, Methuen, Attleboro, Wareham, Stoughton. maRegions updated. 71 total MA cities.
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
- [x] **Backlinks: Directory verification** — BBB accreditation live, Quincy Chamber of Commerce joined
- [ ] **Backlinks: Google Guaranteed** — Apply for Local Services Ads (green checkmark in SERP)

## Trust Badges & Credentials (plan archived to `docs/archive/`)

- [x] TrustBar component, all page placements, footer licenses, about page, schema — all done
- [x] **Badge image optimization** — Badges are inline SVGs/already optimized, no WebP conversion needed.
- [ ] **Competitive badge audit** — Add Section 10 to `docs/COMPETITIVE-ANALYSIS.md`

## Service Page Semantic Audits (Claude)

The bulkhead service page got a full Frase-style semantic audit (March 24) — grew from 1,800 to 2,500 words, added 6 new content sections, 2 FAQs. Same treatment needed for the other 5 service pages + homepage.

- [x] **All 6 service pages** — summary/deep-dive restructure, semantic term additions (hydrostatic pressure, freeze-thaw, radon, stair-step cracks, structural epoxy, post-repair care), video repositioning, link hover fix — March 25, 2026
- [x] **Homepage** — "Why Choose Us" section (6-point grid), "Why New England Homes Crack" educational content, hero video embed, VideoObject schema — March 25, 2026
- [x] **Phone number audit** — all 113 content files converted to clickable tel:/sms: links, call modal for generic pages, phone number rules added to CLAUDE.md — March 25, 2026
- [x] **Blog authorship fix** — all 47 posts changed from `author: "Attack A Crack"` to `author: "Matt Davis"`. Blog template updated to handle Matt Davis, Luc Richard, and fallback bios — March 26, 2026
- [x] **Internal linking pass** — 12 new cross-links added across published posts connecting new spring content cluster (humidity, musty smell, flooding, crawl space, waterproofing cost, french drain, carbon fiber straps, contractor guide) — March 26, 2026
- [x] **Process language audit** — fixed on-site assessment language in 3 posts to lead with "text us a photo" instead of implying in-person visits — March 26, 2026

Only make changes where there's clear evidence of ranking opportunity. Don't add content just for word count.

## SEO Quick Wins (Claude — with GSC data)

- [ ] Title tag optimization — audit against target keywords from SEMrush
- [ ] Meta description optimization — rewrite underperformers using CTR data from GSC
- [ ] H1/H2 keyword alignment — match heading hierarchy to target SERP terms
- [ ] Content depth audit — compare word counts against ranking competitors
- [ ] High-Performance Continuity: CT State Hub must match keyword depth of old `/concrete-foundation-crack-repair-ct` page (908 sessions)
- [x] Add "bulkhead door" as H2 on bulkhead service page — already present: "Bulkhead Door Leak Repair: A Permanent Solution" H2 + "bulkhead door" throughout metaTitle, excerpt, and body

## Luc's Professional Info (E-E-A-T — Matt)

- [x] All available credential info collected and applied — complete as of March 25, 2026

## Visual QA (Matt)

- [x] About page walkthrough
- [x] Mobile spot-check on each page type (iPhone + Android)

## Ongoing

- [ ] B13 Phase 2: Mobile intake form for technician case studies
- [ ] Social media posting (3x/week per marketing plan)
- [ ] PAA targeting in blog content
- [ ] Monitor competitor moves (see `docs/SEO-STRATEGY-2026.md` Part 23)
- [ ] WordPress-era URL audit (hunt old 2022 URLs for 301 redirects)
- [ ] Panic cluster Frase audits ("water in basement after rain") — musty smell and white powder posts now published with cross-links

## Content Gaps Identified

- [ ] **Spring foundation inspection walkthrough** (HIGH PRIORITY — it's spring now) — draft exists at `spring-foundation-inspection-walkthrough.md`. When published, link back from `south-shore-foundation-problems.md`.
- [ ] **Quincy coastal foundation repair guide** — draft exists at `quincy-foundation-repair-coastal.md`. When published, link back from `south-shore-foundation-problems.md`.
- [x] **Carbon fiber straps blog article** — `carbon-fiber-straps-bowing-walls.md` published March 11 (backdated). Full semantic audit, 5 FAQs, cost tables, straps-vs-anchors-vs-I-beams comparison. Internal links added from bowing walls article, carbon fiber staples article, and horizontal cracks article.
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
