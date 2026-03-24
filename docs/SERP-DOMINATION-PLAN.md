# SERP Domination Plan: Attack A Crack Foundation Repair

> **Execution plan.** For analysis, see `SEO-STRATEGY-2026.md` (Part 23) and `COMPETITIVE-ANALYSIS.md`.
> Baseline: 234 tracked keywords, 20 at #1 (SEMrush, March 9, 2026). Site launched March 21, 2026.

---

## Pillar 1: Rich Result Expansion (Schema Upgrades)

**Priority: HIGH — no dependencies, can start immediately.**

Schema upgrades directly increase SERP real estate (rich snippets, knowledge panels, review stars). Current schemas: `HomeAndConstructionBusiness`, `AggregateRating`, `Article`, `FAQPage`, `BreadcrumbList`, `ItemList`.

### HowTo Schema on Service Pages

Add `HowTo` structured data to service pages that describe a repair process. Google renders these as expandable step-by-step rich results.

- [x] Add `HowTo` schema to epoxy crack injection service page — already had steps in frontmatter
- [x] Add `HowTo` schema to carbon fiber strap service page — already had steps in frontmatter
- [x] Add `HowTo` schema to bulkhead waterproofing service page — already had steps in frontmatter
- [x] Add `HowTo` schema to basement floor crack repair service page — already had steps in frontmatter
- [x] Template: steps with `name`, `text` — already implemented in both service templates
- [x] Validate all with `npm run validate:schema` — confirmed all 5 pages render HowTo in build output

**Files to modify:** Service page templates in `src/content/services/` and `src/content/concrete-repair/`, plus schema generation in page templates under `src/pages/`.

### VideoObject Schema

Video embeds are live on 11 pages (18 videos total). See `docs/VIDEO-STRATEGY-2026.md` Section 7 for full inventory.

- [x] VideoObject schema live on about page (2 videos: founder story + team) — added March 24
- [x] 18 YouTube Shorts embedded across 11 pages with right-float layout (March 24)
- [x] Created reusable `VideoObject` schema helper in `src/utils/video.ts` — central video registry with `getVideoSchemas()` function (March 24)
- [x] Added VideoObject schema to all 13 pages with video embeds: 6 service pages, services hub, about, what-we-dont-do, 4 blog posts (March 24)
- [x] Required properties all included: `name`, `description`, `thumbnailUrl`, `uploadDate`, `contentUrl`, `embedUrl`

### ImageObject for Before/After Projects

91 project case studies exist. Before/after photos are prime candidates for `ImageObject` schema.

- [x] `ImageObject` schema already in project page template (`src/pages/projects/[slug].astro` lines 174-197) — renders for all projects with real images
- [x] Includes `contentUrl`, `description`, `name` — auto-generated from project frontmatter
- [ ] Consider `ImageGallery` wrapper for multi-photo projects
- [ ] Verify image descriptions match actual photo content (Gemini AI classified; some may be wrong)
- [ ] Run `fix-placeholder-projects.js` on 6 projects still using placeholder images

### Organization Credential & Profile Expansion

**`src/layouts/Layout.astro` (line ~94) and `src/pages/index.astro` (line ~71):**

Expand the `sameAs` array and add `hasCredential`:

- [x] `hasCredential` — CT HIC + MA HIC already in Layout.astro (added in trust badges commit)
- [x] `sameAs` expanded to 8 URLs in Layout.astro and index.astro: Facebook, Instagram, LinkedIn, BBB, Yelp CT, Yelp MA, Google Maps CT, Google Maps MA (March 24)
- [x] `sameAs` updated in `src/utils/authors.ts` — Luc now has Facebook, Instagram, LinkedIn (March 24)

### FAQPage Schema Audit

- [x] All 12 service/concrete-repair pages confirmed to have `FAQPage` schema (March 24 audit)
- [x] Cross-checked against HUB_PAGES exclusion list — no issues

---

## Pillar 2: Featured Snippet & PAA Capture

**Priority: MEDIUM — start structuring now, optimize after GSC data arrives.**

### Snippet Format Targets

| Query Type | Format | Target Page | Action |
|---|---|---|---|
| "how to fix basement cracks" | Numbered list | Service pages, how-to blog posts | Ensure clean `<ol>` markup |
| "foundation repair cost" | Table | `basement-waterproofing-cost-guide.md` | Add comparison table (method / cost range / duration) |
| "what is epoxy crack injection" | Paragraph | Epoxy injection service page | Add concise 40-60 word definition as opening paragraph |
| "foundation crack types" | List | `types-of-foundation-cracks.md` | Ensure list format with clear H2/H3 structure |

- [x] Cost comparison tables added to both published cost guides (foundation + bulkhead) (March 24)
- [x] "What is X?" definitions added to all 6 service pages (March 24)
- [x] Fixed `<ol>` numbered list formatting in basement-floor-crack-repair-guide.md (March 24). Other how-to posts use H3 headings as section dividers (correct for SEO).
- [x] Added FAQPage schema via frontmatter FAQs to flex-seal and lally-columns posts (March 24). Blog template auto-generates FAQPage schema from `faqs:` frontmatter.

### Priority PAA Questions to Target

These are high-volume PAA questions that appear across foundation repair SERPs:

- [x] "How much does foundation crack repair cost?" → `foundation-repair-cost-guide-2026.md` (published, comparison table added March 24)
- [x] "Are cracks in basement floor normal?" → `basement-floor-cracks-leaking.md` (published, addresses "normal vs problem" directly)
- [x] "How long does foundation crack injection last?" → foundation-crack-injection service page FAQ (published, "How long does injected material last?")
- [x] "Is foundation crack repair covered by insurance?" → `does-insurance-cover-foundation-repair.md` (published, dedicated post)
- [x] "When should I worry about foundation cracks?" → `foundation-settling-when-to-worry.md` (published)
- [x] "Can I fix a foundation crack myself?" → `flex-seal-basement-cracks.md` + `diy-vs-professional-foundation-repair.md` (both published)

**Reference:** Frase semantic analysis targets in `SEO-STRATEGY-2026.md` Parts 19-22 for term gaps.

---

## Pillar 3: Ranking Optimization for Existing Pages

**Priority: HIGH for quick wins, MEDIUM for page 2 targets.**

All content referenced below is already published. This is about ranking higher, not writing new content.

### Quick Wins — Positions 4-10 (Push to Top 3)

| Keyword | Current Pos | Volume | Target Page | Action |
|---|---|---|---|---|
| foundation crack repair near me | 4 | 390 | Service hub | Internal link consolidation, schema enhancement |
| leaky bulkhead | 5 | 170 | Bulkhead service page | Semantic completeness (Frase Part 20) |
| concrete foundation crack repair | 2 | 10 | Epoxy injection page | Hold/defend — minimal intervention needed |

- [x] Audit internal links pointing to quick-win pages — 10 links added across 8 blog posts (March 24)
- [ ] Run Frase-style semantic audit on bulkhead page (see SEO-STRATEGY-2026.md Part 20)
- [x] Quick-win pages confirmed: all have `FAQPage` + `HowTo` schema (March 24 audit)

### Page 2 Targets — Positions 11-20 (Push to Page 1)

| Keyword | Current Pos | Volume | Target Page |
|---|---|---|---|
| foundation crack repair cost | 12 | 30 | Cost guide blog post |
| bulkhead waterproofing | 14 | 30 | Bulkhead service page |
| carbon fiber foundation repair | 16 | 10 | Carbon fiber service page |

- [ ] Add content depth to page 2 targets — compare word count against top 3 ranking competitors
- [ ] Strengthen internal linking to page 2 target pages from blog posts and location pages
- [ ] Add missing semantic terms identified in Frase audits (Parts 19-22)

### Already-Published "Gap" Posts — Ranking Optimization

These posts target high-volume topics where competitors get significant traffic. The content exists; it needs to rank.

**`lally-columns-guide.md`** — A-1 gets 175 visits/mo from this topic
- [x] Semantic audit completed against A-1 (9 articles) + Fine Homebuilding + NE Structural Works + Groundworks (March 24). Added: 6 column types (brick/wood/block/hollow/improvised), 1898 Waltham history, building codes & permits, 180-day temp column rule, footing specs (24x24x12 rebar), home inspection section, "can I move a column" section, top plate/cap plate details, 30-60% strength loss figure, road salt corrosion, LVL beams, floor lifting angle, FAQPage schema. Post grew from ~1,100 to ~2,200 words.
- [x] Internal links added from carbon-fiber-foundation-repair-guide and signs-of-foundation-problems (March 24)
- [ ] Monitor position in GSC after 30 days

**`flex-seal-basement-cracks.md`** — 49,500 volume cluster, A-1 gets 198 visits/mo
- [x] Content depth audit completed against A-1 (4 articles), NJ Basement Waterproofing, Flex Seal official, RI Pros (March 24). Added: product variants (Liquid/Spray/Shot/Tape/Paste), tie rod failure point, hydraulic cement comparison, home inspection/real estate angle, 5 FAQs for PAA capture. Post grew from ~950 to ~1,500 words. A-1 wins on URL volume (4 thin articles) not depth — our single comprehensive article should outrank.
- [x] Title changed to question format "Does Flex Seal Work on Basement Cracks?" matching primary query. Meta description updated with product variant names for keyword breadth. (March 24)
- [x] Internal links added from DIY-vs-pro and water-in-basement posts (March 24)

**`basement-floor-crack-repair-guide.md` + `basement-floor-cracks-leaking.md`** — 13,400/mo cluster
- [x] Posts interlink via relatedPosts frontmatter
- [ ] Add comparison table for repair methods (Pillar 2 overlap)
- [x] Internal links added from waterproofing, cost guide, sump pump posts (March 24)

### Title & Meta CTR Optimization

**WAIT for 2-3 weeks of GSC impression/CTR data before rewriting any titles or descriptions.** Changing titles on pages that haven't been indexed long enough wastes the baseline measurement.

- [ ] After April 7: Pull GSC data for pages with high impressions but low CTR
- [ ] A/B test title formats: "How to X" vs "X: Complete Guide" vs "X Cost, Methods & What to Expect"
- [ ] Prioritize pages where CTR is below 3% with position < 10

---

## Pillar 4: Entity & Knowledge Panel Building

**Priority: MEDIUM — NAP audit is quick, knowledge panel is long-term.**

### NAP Consistency Audit

- [ ] Verify identical Name/Address/Phone on: Google Maps (CT), Google Maps (MA), BBB, ASHI NE directory, GBAR directory, Quincy Chamber, Yelp, Facebook
- [ ] Document all citation URLs in a spreadsheet for ongoing monitoring
- [ ] Fix any inconsistencies immediately — NAP mismatches confuse entity recognition

### Google Business Profile (Cross-ref POST-LAUNCH-PLAN.md)

- [ ] Verify website URL is set to `https://www.attackacrack.com` on both GBP listings
- [ ] Add all service categories (foundation repair, waterproofing, concrete repair)
- [ ] Post weekly GBP updates (project photos, tips) — ties to content calendar
- [ ] Respond to all reviews within 24 hours

### Author Entity: Luc Richard (E-E-A-T)

- [x] Author schema in `src/utils/authors.ts` has `knowsAbout` array (6 topics) + `sameAs` (3 URLs) + detailed `description`
- [x] Author bio renders on all blog posts via `getAuthorSchema()` — includes credentials and experience
- [ ] Create/update Luc's profile on industry directories (ASHI, etc.)
- [ ] Long-term: LinkedIn articles, industry publication guest posts

### Knowledge Panel (Long-Term)

- [ ] Monitor for automatic knowledge panel generation after entity signals strengthen
- [ ] Wikipedia/Wikidata — not realistic until significant media coverage or notability criteria met
- [ ] Focus on structured data and citations — these feed the knowledge graph

---

## Pillar 5: Backlink Strategy Execution

**Priority: HIGH for directory listings, MEDIUM for Google Guaranteed, ONGOING for content links.**

See `POST-LAUNCH-PLAN.md` for the full backlink section — this covers execution specifics only.

### Directory Backlinks (Quick Wins)

| Source | Est. DA | Status | Action |
|---|---|---|---|
| BBB profile | 78 | Active | [ ] Verify link to website is live and correct |
| ASHI NE directory | 50+ | Unknown | [ ] Verify listing exists, add if not, confirm dofollow |
| GBAR directory | 40+ | Unknown | [ ] Verify listing exists with correct URL |
| Quincy Chamber | 35+ | Member | [ ] Verify directory listing has backlink |
| CT chamber(s) | 30-40 | Unknown | [ ] Join relevant CT chamber, get directory listing |
| Yelp | 93 | Unknown | [ ] Claim/create business listing for both locations |

- [ ] Audit all directory listings — confirm each links to `https://www.attackacrack.com`
- [ ] Check dofollow vs nofollow status on each directory link

### Google Guaranteed Badge

Green checkmark in Local Services Ads. Foundation repair is an eligible category.

- [ ] Research Local Services Ads requirements for CT and MA
- [ ] Budget: ~$50-100/person for background checks
- [ ] Apply through Google Local Services portal
- [ ] Timeline: typically 2-4 weeks for approval

### Manufacturer Directories

- [ ] Polygem "find an installer" page — apply for listing
- [ ] Sika certified applicator directory — apply for listing
- [ ] Any other product manufacturer directories (Simpson Strong-Tie, etc.)

### Ongoing Link Building

- [ ] HARO/Connectively — set alerts for foundation repair, home improvement, real estate topics
- [ ] Partner reciprocal links — approach realtors and home inspectors for mutual referral pages
- [ ] Local sponsorships — youth sports, community events (.org and .edu backlinks)
- [ ] Angi Super Service Award — need 3+ reviews with 4.5+ average on Angi platform

---

## Timeline

### NOW — Weeks 1-2 (March 24 - April 7)

- [x] Schema: `hasCredential` already in Layout.astro (CT HIC, MA HIC)
- [x] Schema: `sameAs` expanded to 8 URLs in Layout.astro, index.astro, authors.ts (March 24)
- [x] Schema: `HowTo` already on all 5 service pages + basement floor (was pre-existing)
- [x] Schema: `FAQPage` on all 12 service/concrete-repair pages (was pre-existing)
- [ ] Backlinks: Audit all directory listings (BBB, ASHI, GBAR, chambers)
- [ ] Semantic: Run content depth audit on quick-win pages (pos 4-10) — needs GSC data
- [x] Internal linking: 10 links added to gap posts from related content (March 24)
- [x] Snippet prep: "What is X?" definitions on 6 service pages + comparison tables on 2 cost guides (March 24)

### AFTER GSC DATA — Weeks 3-4 (April 7-21)

- [ ] Pull first GSC impression/CTR report
- [ ] Identify high-impression/low-CTR pages for title optimization
- [ ] Review position changes on quick-win keywords
- [ ] Begin title/meta A/B testing on underperforming pages
- [ ] Content depth audit: compare word counts vs ranking competitors

### MONTH 2 (April 21 - May 21)

- [ ] Apply for Google Guaranteed / Local Services Ads
- [ ] Apply for manufacturer directory listings
- [ ] Begin featured snippet monitoring (track which queries show snippets)
- [x] `VideoObject` schema on all 13 video-embedded pages via `src/utils/video.ts` helper (March 24)
- [ ] PAA optimization based on actual search appearance data
- [ ] Begin HARO/Connectively responses

### ONGOING

- [ ] Weekly: GBP posts, review responses
- [ ] Monthly: Position tracking review, content depth updates
- [ ] Monthly: New backlink opportunities (sponsorships, partners)
- [ ] Quarterly: Full SEMrush keyword tracking refresh
- [ ] Quarterly: Competitor re-analysis (A-1, CrackX, Groundworks positions)

---

## SERP Feature Competitive Landscape (March 2026, from SEMrush data)

| SERP Feature | AAC Status | Competitors | Strategy |
|---|---|---|---|
| **Local Pack** | Winning 20+ keywords at #1 | A-1 wins MA-specific ("foundation repair massachusetts" #1), Groundworks national | GBP optimization (Matt) |
| **AI Overview** | Winning 4 keywords (concrete stitches, crumbling foundations, pyrrhotite, bulkhead leaking) | Groundworks dominates broad repair terms via `/resources/` pages; CrackX wins DIY vs pro, bulkhead door, hairline cracks | "What is X?" definitions on service pages (done March 24) |
| **Featured Snippet** | Not winning any yet | CrackX has bulkhead repair cost snippet | Cost comparison tables added (done March 24) |
| **PAA** | Not specifically targeted | CrackX owns bulkhead PAA positions | FAQPage schema on all 12 service pages (confirmed March 24) |
| **Knowledge Panel** | Not confirmed | A-1 + CrackX both have them | `sameAs` expanded to 8 URLs (done March 24) — monitor for panel appearance |
| **ImageObject / Image Pack** | Not targeted | CrackX wins "seeping water" via Image Pack; Groundworks wins "flooded basement" | Add ImageObject schema to project pages with real photos (next) |
| **Video / Video Carousel** | 18 videos on 11 pages; VideoObject schema on about page | Appears as SERP feature on nearly every query; A-1 shows Video Carousel | Add VideoObject schema to remaining 9 pages; shoot homepage intro + Flex Seal debunk |
| **Things to Know** | Not targeted | A-1 lally columns, CrackX concrete piers | Deep educational content (lally guide exists, needs ranking time) |
| **Google Guaranteed** | Not applied | **Nobody in competitive set has it** | First mover advantage — apply for Local Services Ads |
| **Reviews in SERP** | 260+ Google reviews, AggregateRating schema live | A-1 shows review rich results for CT queries | Already implemented — continue review acquisition |

**Key insight:** Video is now partially addressed (18 embeds, schema on 1 page — need schema on remaining 9). The two biggest untapped SERP features are Google Guaranteed (no competitor has it) and Image Pack (91 real project photos available for ImageObject schema). Highest-value new videos to shoot: homepage intro and Flex Seal debunk.

---

## References

- `docs/SEO-STRATEGY-2026.md` — Full 23-part analysis (Parts 19-22: Frase audits, Part 23: SERP Acquisition Playbook)
- `docs/COMPETITIVE-ANALYSIS.md` — Competitor benchmarks, Lighthouse scores, keyword overlap
- `docs/POST-LAUNCH-PLAN.md` — Canonical task tracker (backlinks, GBP, video, content calendar)
- `docs/VIDEO-STRATEGY-2026.md` — Video content plan (triggers VideoObject schema work)
- `docs/seo-reports/` — SEMrush CSV baseline data (March 9, 2026)
- `src/layouts/Layout.astro` — Global Organization schema (line ~94: `sameAs`)
- `src/pages/index.astro` — Homepage schema (line ~71: `sameAs`)
- `src/utils/authors.ts` — Author entity schema (line ~17: `sameAs`)
