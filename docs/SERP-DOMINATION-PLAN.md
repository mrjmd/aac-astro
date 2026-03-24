# SERP Domination Plan: Attack A Crack Foundation Repair

> **Execution plan.** For analysis, see `SEO-STRATEGY-2026.md` (Part 23) and `COMPETITIVE-ANALYSIS.md`.
> Baseline: 234 tracked keywords, 20 at #1 (SEMrush, March 9, 2026). Site launched March 21, 2026.

---

## Pillar 1: Rich Result Expansion (Schema Upgrades)

**Priority: HIGH — no dependencies, can start immediately.**

Schema upgrades directly increase SERP real estate (rich snippets, knowledge panels, review stars). Current schemas: `HomeAndConstructionBusiness`, `AggregateRating`, `Article`, `FAQPage`, `BreadcrumbList`, `ItemList`.

### HowTo Schema on Service Pages

Add `HowTo` structured data to service pages that describe a repair process. Google renders these as expandable step-by-step rich results.

- [ ] Add `HowTo` schema to epoxy crack injection service page (most common service)
- [ ] Add `HowTo` schema to carbon fiber strap service page
- [ ] Add `HowTo` schema to bulkhead waterproofing service page
- [ ] Add `HowTo` schema to basement floor crack repair service page
- [ ] Template: each step needs `name`, `text`, optional `image` and `url`
- [ ] Validate all with `npm run validate:schema` after adding

**Files to modify:** Service page templates in `src/content/services/` and `src/content/concrete-repair/`, plus schema generation in page templates under `src/pages/`.

### VideoObject Schema (When Ready)

Video content strategy is in `docs/VIDEO-STRATEGY-2026.md` and `POST-LAUNCH-PLAN.md`. Schema goes in when YouTube embeds land.

- [ ] Create reusable `VideoObject` schema helper in `src/utils/`
- [ ] Add to blog posts and service pages that embed YouTube videos
- [ ] Required properties: `name`, `description`, `thumbnailUrl`, `uploadDate`, `contentUrl`

### ImageObject for Before/After Projects

91 project case studies exist. Before/after photos are prime candidates for `ImageObject` schema.

- [ ] Add `ImageObject` schema to project page template (`src/pages/projects/`)
- [ ] Include `contentUrl`, `description`, `name`, `datePublished`
- [ ] Consider `ImageGallery` wrapper for multi-photo projects

### Organization Credential & Profile Expansion

**`src/layouts/Layout.astro` (line ~94) and `src/pages/index.astro` (line ~71):**

Expand the `sameAs` array and add `hasCredential`:

- [ ] Add `hasCredential` to Organization schema:
  ```json
  "hasCredential": [
    {"@type": "EducationalOccupationalCredential", "credentialCategory": "license", "name": "CT Home Improvement Contractor License", "identifier": "HIC #0629164"},
    {"@type": "EducationalOccupationalCredential", "credentialCategory": "license", "name": "MA Home Improvement Contractor License", "identifier": "HIC #214356"},
    {"@type": "EducationalOccupationalCredential", "credentialCategory": "accreditation", "name": "BBB A+ Accreditation"}
  ]
  ```
- [ ] Expand `sameAs` array in Layout.astro (line 94) and index.astro (line 71):
  ```json
  "sameAs": [
    "https://www.facebook.com/attackacrack",
    "https://www.bbb.org/us/ct/north-windham/profile/concrete-repair/attack-a-crack-0111-74000203",
    "https://maps.google.com/?cid=XXXXX",
    "https://maps.google.com/?cid=XXXXX",
    "https://www.yelp.com/biz/attack-a-crack-XXXXX"
  ]
  ```
  **Action needed:** Get exact Google Maps CID values for CT and MA GBP listings, and Yelp business URL.
- [ ] Also update `sameAs` in `src/utils/authors.ts` for Luc Richard (line 17)

### FAQPage Schema Audit

- [ ] Audit all service pages — ensure every page with an FAQ section has `FAQPage` schema
- [ ] Cross-check against `scripts/validate-schema.js` HUB_PAGES exclusion list

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

- [ ] Add cost comparison tables to cost guide blog post (method, price range, when to use)
- [ ] Add concise "What is X?" opening paragraph to each service page (40-60 words, direct answer)
- [ ] Ensure how-to blog posts use proper numbered `<ol>` lists (not just bold text)
- [ ] Structure FAQ sections with exact PAA question phrasing as H3 headings

### Priority PAA Questions to Target

These are high-volume PAA questions that appear across foundation repair SERPs:

- [ ] "How much does foundation crack repair cost?" → cost guide post
- [ ] "Are cracks in basement floor normal?" → `basement-floor-cracks-leaking.md`
- [ ] "How long does foundation crack injection last?" → epoxy injection service page
- [ ] "Is foundation crack repair covered by insurance?" → dedicated blog post or FAQ
- [ ] "When should I worry about foundation cracks?" → `types-of-foundation-cracks.md`
- [ ] "Can I fix a foundation crack myself?" → `flex-seal-basement-cracks.md` (answer: temporary, call a pro)

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

- [ ] Audit internal links pointing to quick-win pages — add links from relevant blog posts
- [ ] Run Frase-style semantic audit on bulkhead page (see SEO-STRATEGY-2026.md Part 20)
- [ ] Ensure quick-win pages have `FAQPage` schema + `HowTo` schema (Pillar 1 overlap)

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
- [ ] Audit semantic completeness against A-1's content
- [ ] Add internal links from relevant location pages (MA especially)
- [ ] Monitor position in GSC after 30 days

**`flex-seal-basement-cracks.md`** — 49,500 volume cluster, A-1 gets 198 visits/mo
- [ ] Compare content depth against top 5 ranking pages
- [ ] Ensure title tag and meta description are CTR-optimized
- [ ] Add internal links from related blog posts (waterproofing, DIY vs pro)

**`basement-floor-crack-repair-guide.md` + `basement-floor-cracks-leaking.md`** — 13,400/mo cluster
- [ ] Ensure these two posts interlink and don't cannibalize each other
- [ ] Add comparison table for repair methods (Pillar 2 overlap)
- [ ] Internal links from all relevant location pages

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

- [ ] Ensure author schema in `src/utils/authors.ts` has complete `knowsAbout` array
- [ ] Add author bio to all blog posts with credentials and experience
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

- [ ] Schema: Add `hasCredential` to Organization schema
- [ ] Schema: Expand `sameAs` in Layout.astro, index.astro, authors.ts
- [ ] Schema: Add `HowTo` to top 4 service pages
- [ ] Schema: Add `FAQPage` to any service pages missing it
- [ ] Backlinks: Audit all directory listings (BBB, ASHI, GBAR, chambers)
- [ ] Semantic: Run content depth audit on quick-win pages (pos 4-10)
- [ ] Internal linking: Add links to gap posts from related content
- [ ] Snippet prep: Add cost comparison tables, "What is X?" paragraphs

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
- [ ] Add `VideoObject` schema when first YouTube embeds go live
- [ ] PAA optimization based on actual search appearance data
- [ ] Begin HARO/Connectively responses

### ONGOING

- [ ] Weekly: GBP posts, review responses
- [ ] Monthly: Position tracking review, content depth updates
- [ ] Monthly: New backlink opportunities (sponsorships, partners)
- [ ] Quarterly: Full SEMrush keyword tracking refresh
- [ ] Quarterly: Competitor re-analysis (A-1, CrackX, Groundworks positions)

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
