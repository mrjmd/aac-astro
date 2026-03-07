# Territory Language Review: CT/MA → All New England

**Status:** IMPLEMENTED. All changes applied and validated (2026-03-07).
**Date:** 2026-03-07

## Background

We serve all 5 New England states (CT, MA, RI, NH, ME) but many pages still say "CT & MA." This doc lists every instance with a proposed fix. **No changes will be made until you approve.**

### Guiding Principles

1. **KEEP "CT & MA" in metaTitles** — these are SEO keyword positions, people search by state
2. **EXPAND descriptions** — add "& across New England" without dropping CT/MA
3. **REWRITE factual errors** — "Serving Connecticut and Massachusetts" must mention all 5
4. **DON'T over-correct** — blog weather/geology mentions referencing CT & MA conditions are fine (factual context, not service claims)
5. **areaServed schemas** — must list all 5 states for accuracy

---

## How to Use This Doc

For each instance below, mark your decision:
- **APPROVE** — use the proposed text as-is
- **MODIFY** — write your preferred text
- **SKIP** — leave as-is (with reason)

---

## Section A: Page-Level Descriptions (Meta/SEO)

These appear in search results. High SEO impact.

### A1. Homepage description
**File:** `src/pages/index.astro:28`
**Type:** meta description
**Current:**
> Attack A Crack provides expert foundation wall crack repair, bulkhead sealing, and concrete repair in CT & MA. 20+ years experience with a lifetime guarantee.

**Proposed:** EXPAND (keep CT/MA + add New England)
> Expert foundation wall crack repair, bulkhead sealing, and concrete repair in CT, MA, and across New England. Lifetime guarantee. (129 chars)

**Rationale:** Matt wants both — keep CT/MA geo keywords while adding New England. Trimmed "Attack A Crack provides" and "20+ years experience" to fit 160-char limit.
**Matt's decision:** APPROVE (with "both" approach)

---

### A2. Services hub description
**File:** `src/pages/services/index.astro:54`
**Type:** meta description
**Current:**
> Specialized foundation repair solutions with a lifetime guarantee. We repair wall cracks, leaky bulkheads, utility lines, and more in CT & MA.

**Proposed:** EXPAND (keep CT/MA + add New England)
> Specialized foundation repair solutions with a lifetime guarantee. We repair wall cracks, leaky bulkheads, utility lines, and more in CT, MA, and across New England. (165 chars — at limit)

**Matt's decision:** APPROVE (with "both" approach)

---

### A3. Partners hub description
**File:** `src/pages/partners/index.astro:30`
**Type:** meta description
**Current:**
> Partner with Attack A Crack for fast foundation repairs. Realtors, property managers, home inspectors, and contractors trust us throughout CT & MA.

**Proposed:** EXPAND (keep CT/MA + add New England)
> Partner with Attack A Crack for fast foundation repairs. Realtors, property managers, home inspectors, and contractors trust us in CT, MA, and across New England. (162 chars — at limit)

**Matt's decision:** APPROVE (with "both" approach)

---

## Section B: JSON-LD Structured Data (Schema)

Google reads these for business info. Must be factually accurate.

### B1. About page schema — description
**File:** `src/pages/about.astro:26`
**Type:** JSON-LD description
**Current:**
> Family-owned foundation repair company serving Connecticut and Massachusetts for over 33 years.

**Proposed:** REWRITE
> Family-owned foundation repair company serving Connecticut, Massachusetts, and all of New England for over 33 years.

**Matt's decision:** APPROVE

---

### B2. About page schema — areaServed
**File:** `src/pages/about.astro:35-38`
**Type:** JSON-LD areaServed array
**Current:** Lists only CT and MA
**Proposed:** REWRITE — add all 5 states:
```json
"areaServed": [
  { "@type": "State", "name": "Connecticut" },
  { "@type": "State", "name": "Massachusetts" },
  { "@type": "State", "name": "Rhode Island" },
  { "@type": "State", "name": "New Hampshire" },
  { "@type": "State", "name": "Maine" }
]
```

**Matt's decision:** APPROVE

---

### B3. Services hub schema — description
**File:** `src/pages/services/index.astro:29`
**Type:** JSON-LD ItemList description
**Current:**
> Specialized foundation repair solutions with lifetime guarantee in Connecticut and Massachusetts

**Proposed:** EXPAND (keep CT/MA + add New England)
> Specialized foundation repair solutions with lifetime guarantee in Connecticut, Massachusetts, and across New England

**Matt's decision:** APPROVE (with "both" approach)

---

### B4. Services hub schema — areaServed (per service)
**File:** `src/pages/services/index.astro:43-46`
**Type:** JSON-LD areaServed array (inside each ListItem)
**Current:** Lists only CT and MA
**Proposed:** REWRITE — same 5-state array as B2

**Matt's decision:** APPROVE

---

## Section C: Page Body Text & Headings

### C1. Partners hub — hero paragraph
**File:** `src/pages/partners/index.astro:51`
**Type:** body text
**Current:**
> We work with realtors, property managers, home inspectors, and contractors across Connecticut and Massachusetts.

**Proposed:** REWRITE
> We work with realtors, property managers, home inspectors, and contractors across Connecticut, Massachusetts, and all of New England.

**Matt's decision:** APPROVE

---

### C2. Partners hub — footer callout
**File:** `src/pages/partners/index.astro:210`
**Type:** footer tagline
**Current:**
> Serving Connecticut and Massachusetts

**Proposed:** REWRITE
> Serving all of New England

**Matt's decision:** APPROVE

---

### C3. Partner detail pages — footer callout
**File:** `src/pages/partners/[slug].astro:238`
**Type:** footer tagline
**Current:**
> Serving Connecticut and Massachusetts

**Proposed:** REWRITE
> Serving all of New England

**Matt's decision:** APPROVE

---

### C4. What We Don't Do — heading
**File:** `src/pages/what-we-dont-do.astro:77`
**Type:** H2 heading
**Current:**
> Foundation Repair (CT & MA)

**Proposed:** EXPAND (keep CT/MA + add New England)
> Foundation Repair (CT, MA & New England)

**Matt's decision:** APPROVE (with "both" approach)

---

### C5. What We Don't Do — body text
**File:** `src/pages/what-we-dont-do.astro:121`
**Type:** body text
**Current:**
> Crack repair, bulkhead waterproofing, and structural stabilization in CT & MA.

**Proposed:** EXPAND (keep CT/MA + add New England)
> Crack repair, bulkhead waterproofing, and structural stabilization in CT, MA, and across New England.

**Matt's decision:** APPROVE (with "both" approach)

---

### C6. What We Don't Do — footer tagline
**File:** `src/pages/what-we-dont-do.astro:182`
**Type:** footer text
**Current:**
> Foundation repair in CT & MA • Concrete repair in MA only

**Proposed:** EXPAND
> Foundation repair across New England • Concrete repair in MA only

**Matt's decision:** APPROVE

---

### C7. Team bio — Mike Harrington
**File:** `src/components/TeamExpanded.astro:42`
**Type:** body text (bio)
**Current:**
> ...the same quality and attention to detail that the company is known for across Connecticut and Massachusetts.

**Proposed:** EXPAND
> ...the same quality and attention to detail that the company is known for across New England.

**Matt's decision:** APPROVE

---

## Section D: FAQs

### D1. Homepage FAQ — service area question
**File:** `src/utils/faqs.ts:19`
**Type:** FAQ question text
**Current:**
> What areas in Connecticut and Massachusetts do you serve?

**Proposed:** REWRITE
> What areas do you serve?

**Matt's decision:** APPROVE

---

### D2. Homepage FAQ — service area answer
**File:** `src/utils/faqs.ts:20`
**Type:** FAQ answer text
**Current:**
> We serve homeowners across Connecticut and Massachusetts, including Hartford, New Haven, Fairfield County, Springfield, Worcester, and the Greater Boston area.

**Proposed:** REWRITE
> We serve homeowners across New England — Connecticut, Massachusetts, Rhode Island, New Hampshire, and Maine — including Hartford, New Haven, Springfield, Worcester, and Greater Boston.

**Note:** Matt wants only cities within ~1 hour of an HQ (Amston CT or Quincy MA). Dropped Providence, Nashua, Portland — those are 1.5+ hours from either HQ. Kept Hartford (~25min from Amston), New Haven (~50min), Springfield (~55min), Worcester (~1hr from Quincy), Greater Boston (immediate from Quincy). Also need to update the `<a>` links to include all states or use a single "areas we serve" link.
**Matt's decision:** APPROVE (with HQ-proximity city filter)

---

### D3. Homepage FAQ — cement vs concrete answer
**File:** `src/utils/faqs.ts:24`
**Type:** FAQ answer text (last sentence)
**Current:**
> ...throughout Connecticut and Massachusetts.

**Proposed:** EXPAND
> ...throughout New England.

**Matt's decision:** APPROVE

---

## Section E: Blog Category Descriptions

### E1. Guides category
**File:** `src/pages/blog/category/[category]/[...page].astro:23`
**Type:** category description
**Current:**
> Expert advice from CT and MA foundation repair specialists.

**Proposed:** EXPAND
> Expert advice from New England foundation repair specialists.

**Matt's decision:** APPROVE

---

### E2. Cost Guides category
**File:** `src/pages/blog/category/[category]/[...page].astro:25`
**Type:** category description
**Current:**
> Transparent foundation repair pricing guides for CT and MA homeowners.

**Proposed:** EXPAND
> Transparent foundation repair pricing guides for New England homeowners.

**Matt's decision:** APPROVE

---

### E3. News category
**File:** `src/pages/blog/category/[category]/[...page].astro:27`
**Type:** category description
**Current:**
> ...serving Connecticut and Massachusetts homeowners since 2004.

**Proposed:** EXPAND
> ...serving New England homeowners since 2004.

**Matt's decision:** APPROVE

---

### E4. Paginated category fallback
**File:** `src/pages/blog/category/[category]/[...page].astro:74`
**Type:** paginated page description
**Current:**
> Expert foundation repair content for CT and MA homeowners.

**Proposed:** EXPAND
> Expert foundation repair content for New England homeowners.

**Matt's decision:** APPROVE

---

## Section F: Service Content Frontmatter

metaTitles are **KEEP** (SEO keyword value). Descriptions and body text are EXPAND.

### F1–F6. Service metaTitles — KEEP (no change)
These all use "CT & MA" in titles and should stay for SEO keyword targeting:
- `services/wall-crack-repair.md:3` — "Foundation Wall Crack Repair in CT & MA"
- `services/leaky-bulkhead-repair.md:3` — "Leaky Bulkhead Door Repair in CT & MA"
- `services/free-foundation-consultations.md:3` — "Free Foundation Consultation in CT & MA"
- `services/foundation-crack-injection.md:3` — "Foundation Crack Injection Services CT & MA"
- `services/carbon-fiber-stitches.md:3` — "Carbon Fiber Foundation Repair in CT & MA"
- `services/sewer-well-conduit-line-repair.md:3` — "Sewer, Well & Conduit Line Sealing CT & MA"

**Matt's decision (all 6):** APPROVE (KEEP, no change)

---

### F7. Wall crack repair — metaDescription
**File:** `src/content/services/wall-crack-repair.md:4`
**Current:**
> Expert foundation wall crack repair using urethane injection, epoxy resin, and carbon fiber stitches. Lifetime guarantee in CT & MA.

**Proposed:** EXPAND
> Expert foundation wall crack repair using urethane injection, epoxy resin, and carbon fiber stitches. Lifetime guarantee across New England.

**Matt's decision:** APPROVE

---

### F8. Foundation crack injection — metaDescription
**File:** `src/content/services/foundation-crack-injection.md:4`
**Current:**
> Professional foundation crack injection using urethane and epoxy resins. Permanently seal cracks from the inside out. Lifetime guarantee in CT and MA.

**Proposed:** EXPAND
> Professional foundation crack injection using urethane and epoxy resins. Permanently seal cracks from the inside out. Lifetime guarantee across New England.

**Matt's decision:** APPROVE

---

### F9. Carbon fiber stitches — metaDescription
**File:** `src/content/services/carbon-fiber-stitches.md:4`
**Current:**
> Structural foundation repair using carbon fiber stitches. Stabilize cracked walls and prevent further movement. Lifetime guarantee in CT & MA.

**Proposed:** EXPAND
> Structural foundation repair using carbon fiber stitches. Stabilize cracked walls and prevent further movement. Lifetime guarantee across New England.

**Matt's decision:** APPROVE

---

### F10. Wall crack repair — FAQ
**File:** `src/content/services/wall-crack-repair.md:16`
**Type:** FAQ question
**Current:**
> How much does wall crack repair cost in CT and MA?

**Proposed:** EXPAND
> How much does wall crack repair cost in New England?

**Matt's decision:** APPROVE

---

## Section G: Partner Content Frontmatter

### G1. Realtors — excerpt
**File:** `src/content/partners/realtors.md:5`
**Current:**
> Your reliable foundation repair partner in CT and MA.

**Proposed:** EXPAND (combo — keep states + add New England)
> Your reliable foundation repair partner in CT, MA, and across New England.

**Matt's decision:** APPROVE (combo approach)

---

### G2. Property managers — excerpt
**File:** `src/content/partners/property-managers.md:5`
**Current:**
> Reliable foundation repair for property managers in CT and MA.

**Proposed:** EXPAND (combo)
> Reliable foundation repair for property managers in CT, MA, and across New England.

**Matt's decision:** APPROVE (combo approach)

---

### G3. Plumbers — metaDescription
**File:** `src/content/partners/plumbers.md:4`
**Current:**
> Partner with Attack A Crack for foundation crack repairs your plumbing clients need. We fix cracks and leaks you spot in basements. CT and MA coverage.

**Proposed:** EXPAND (combo)
> Partner with Attack A Crack for foundation crack repairs your plumbing clients need. We fix cracks and leaks you spot in basements. CT, MA, and New England coverage.

**Matt's decision:** APPROVE (combo approach)

---

### G4. Insurance adjusters — metaDescription
**File:** `src/content/partners/insurance-adjusters.md:4`
**Current:**
> Partner with Attack A Crack for fast, documented foundation crack repairs that simplify claims. Lifetime warranty, clear reports, CT and MA coverage.

**Proposed:** EXPAND (combo)
> Partner with Attack A Crack for fast, documented foundation crack repairs that simplify claims. Lifetime warranty, clear reports, CT, MA, and New England coverage.

**Matt's decision:** APPROVE (combo approach)

---

### G5. Landscapers — schema description
**File:** `src/content/partners/landscapers.md:14`
**Current:**
> Foundation crack injection is available throughout CT and MA.

**Proposed:** EXPAND (combo)
> Foundation crack injection is available throughout Connecticut, Massachusetts, and all of New England.

**Matt's decision:** APPROVE (combo approach)

---

### G6. Landscapers — FAQ answer
**File:** `src/content/partners/landscapers.md:23`
**Current:**
> Throughout CT and MA, we repair foundation wall cracks, floor cracks, bulkheads, and pipe penetrations.

**Proposed:** EXPAND (combo)
> Throughout Connecticut, Massachusetts, and all of New England, we repair foundation wall cracks, floor cracks, bulkheads, and pipe penetrations.

**Matt's decision:** APPROVE (combo approach)

---

### G7. Landscapers — body text
**File:** `src/content/partners/landscapers.md:51`
**Current:**
> Throughout Connecticut and Massachusetts, we handle:

**Proposed:** EXPAND (combo)
> Throughout Connecticut, Massachusetts, and all of New England, we handle:

**Matt's decision:** APPROVE (combo approach)

---

### G8–G10. Partner "coverage" bullet points
Three partner pages have a bullet point "CT and MA coverage":
- `src/content/partners/landscapers.md:75` — "CT and MA coverage for your service area"
- `src/content/partners/mold-remediation.md:68` — "CT and MA coverage for your service area"
- `src/content/partners/insurance-adjusters.md:67` — "CT and MA coverage from our two offices"
- `src/content/partners/plumbers.md:68` — "CT and MA coverage throughout our service area"

**Proposed:** EXPAND (combo) all to:
> **CT, MA, and New England-wide coverage** for your service area

(insurance adjusters: "**CT, MA, and New England-wide coverage** from our two offices")

**Matt's decision:** APPROVE (combo approach)

---

## Section H: Blog Content — metaTitles (KEEP)

These are SEO keyword positions. Proposed: no change.

- `blog/pool-deck-crack-repair-guide.md:3` — "Pool Deck Crack Repair Guide for CT & MA"
- `blog/driveway-crack-repair-guide.md:3` — "Driveway Crack Repair Guide for CT & MA"
- `blog/foundation-repair-cost-guide-2026.md:3` — "Foundation Repair Costs 2026 CT & MA Guide"
- `blog/cinderblock-foundation-repair-guide.md:3` — "Cinderblock Foundation Repair in CT & MA"
- `blog/fieldstone-foundation-repair-guide.md:3` — "Fieldstone Foundation Repair in CT & MA"

**Matt's decision (all 5):** APPROVE (KEEP, no change)

---

## Section I: Blog Content — metaDescriptions

### I1. Foundation repair cost guide
**File:** `src/content/blog/foundation-repair-cost-guide-2026.md:4`
**Current:**
> Comprehensive guide to foundation repair costs in Connecticut and Massachusetts.

**Proposed:** EXPAND
> Comprehensive guide to foundation repair costs in Connecticut, Massachusetts, and across New England.

**Matt's decision:** APPROVE

---

### I2. Cinderblock guide
**File:** `src/content/blog/cinderblock-foundation-repair-guide.md:4`
**Current:**
> Professional cinderblock and CMU foundation repair. Fix cracks, bowing walls, and water problems in block foundations throughout CT and MA.

**Proposed:** EXPAND
> Professional cinderblock and CMU foundation repair. Fix cracks, bowing walls, and water problems in block foundations throughout New England.

**Matt's decision:** APPROVE

---

### I3. How we diagnose
**File:** `src/content/blog/how-we-diagnose-foundation-problems.md:4`
**Current:**
> See exactly how professional foundation inspectors assess your home. Learn the diagnostic techniques, tools, and criteria our experts use in CT and MA.

**Proposed:** EXPAND
> See exactly how professional foundation inspectors assess your home. Learn the diagnostic techniques, tools, and criteria our experts use across New England.

**Matt's decision:** APPROVE

---

### I4. Does insurance cover
**File:** `src/content/blog/does-insurance-cover-foundation-repair.md:4`
**Current:**
> Find out when homeowners insurance covers foundation repair and when it doesn't. A plain-English guide for CT and MA homeowners from foundation repair experts.

**Proposed:** EXPAND
> Find out when homeowners insurance covers foundation repair and when it doesn't. A plain-English guide for New England homeowners from foundation repair experts.

**Matt's decision:** APPROVE

---

## Section J: Blog Body Text — SKIP (No Change Recommended)

These are editorial/contextual mentions of "Connecticut and Massachusetts" in blog posts discussing weather, geology, or regional conditions. They're factually accurate in context and don't make service-area claims. **Recommend leaving as-is:**

- `blog/basement-waterproofing-before-freeze.md:91` — curing temps in CT/MA vs NH/ME
- `blog/pool-deck-crack-repair-guide.md:32` — freeze-thaw cycles in CT/MA
- `blog/pool-deck-crack-repair-guide.md:171` — "across Connecticut and Massachusetts" (concrete repair IS MA-only though — **flag for review**)
- `blog/patio-crack-repair-guide.md:54` — tree roots in CT/MA neighborhoods
- `blog/new-england-foundation-types-visual-guide.md:51` — geology by region
- `blog/basement-humidity-control-guide.md:33` — poured concrete in CT/MA
- `blog/basement-humidity-control-guide.md:101` — summer humidity in CT/MA
- `blog/foundation-repair-seasonal-guide.md:36` — water table in CT/MA
- `blog/cement-vs-concrete-homeowners-guide.md:140` — "across Connecticut and Massachusetts" (service claim — **consider expanding**)
- `blog/fieldstone-foundation-repair-guide.md:64` — "throughout Connecticut and Massachusetts" (service claim — **consider expanding**)
- `blog/fieldstone-foundation-repair-guide.md:106` — "Serving Connecticut and Massachusetts" heading (service claim — **consider expanding**)
- `blog/bulkhead-repair-cost-guide-2026.md:23` — costs in CT/MA
- `blog/bulkhead-repair-cost-guide-2026.md:124` — costs in CT/MA
- `blog/driveway-crack-repair-guide.md:22` — weather in CT/MA
- `blog/driveway-crack-repair-guide.md:128` — "across Connecticut and Massachusetts" (concrete repair service claim)
- `blog/horizontal-foundation-cracks.md:33` — rainfall in CT/MA
- `blog/basement-floor-cracks-leaking.md:48` — water table in CT/MA
- `blog/foundation-repair-cost-guide-2026.md:26` — costs in CT/MA
- `blog/foundation-repair-cost-guide-2026.md:89` — "serves all of CT and MA"
- `blog/does-insurance-cover-foundation-repair.md:91` — freeze-thaw in CT/MA
- `blog/does-insurance-cover-foundation-repair.md:145` — costs in CT/MA
- `blog/nashua-nh-foundation-repair.md:53` — comparing NH to CT/MA weather
- `blog/cinderblock-foundation-repair-guide.md:133` — "throughout Connecticut and Massachusetts" (service claim — **consider expanding**)

### J-Exceptions: Blog service claims worth expanding

These blog body text mentions make explicit service-area claims (not just weather context):

**J1.** `blog/cement-vs-concrete-homeowners-guide.md:140`
> ...across Connecticut and Massachusetts.
→ **Proposed:** ...across New England.

**J2.** `blog/fieldstone-foundation-repair-guide.md:64`
> ...throughout Connecticut and Massachusetts.
→ **Proposed:** ...throughout New England.

**J3.** `blog/fieldstone-foundation-repair-guide.md:106`
> ### Serving Connecticut and Massachusetts
→ **Proposed:** ### Serving New England

**J4.** `blog/cinderblock-foundation-repair-guide.md:133`
> We repair cinderblock foundations throughout Connecticut and Massachusetts
→ **Proposed:** We repair cinderblock foundations throughout New England

**J5.** `blog/foundation-repair-cost-guide-2026.md:89`
> While Attack A Crack serves all of CT and MA
→ **Proposed:** While Attack A Crack serves all of New England

**J6.** `blog/pool-deck-crack-repair-guide.md:171` *(concrete repair is MA-only service)*
> ...across Connecticut and Massachusetts.
→ **Proposed:** ...across Massachusetts.

**J7.** `blog/driveway-crack-repair-guide.md:128` *(concrete repair is MA-only service)*
> ...across Connecticut and Massachusetts.
→ **Proposed:** ...across Massachusetts.

**Matt's decision (J1–J7):** APPROVE

---

## Summary

| Section | Count | Action |
|---------|-------|--------|
| A. Page descriptions | 3 | EXPAND |
| B. JSON-LD schemas | 4 | REWRITE |
| C. Page body/headings | 7 | EXPAND/REWRITE |
| D. FAQs | 3 | REWRITE |
| E. Blog categories | 4 | EXPAND |
| F. Service metaTitles | 6 | KEEP (no change) |
| F. Service descriptions | 4 | EXPAND |
| G. Partner content | 10 | EXPAND |
| H. Blog metaTitles | 5 | KEEP (no change) |
| I. Blog descriptions | 4 | EXPAND |
| J. Blog body (context) | ~18 | SKIP |
| J. Blog body (service claims) | 7 | EXPAND |
| **Total instances** | **~75** | |
| **Requiring changes** | **~46** | |
| **No change needed** | **~29** | |
