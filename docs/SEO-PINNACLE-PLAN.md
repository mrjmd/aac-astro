# Site-Wide SEO Pinnacle & Expertise Deep-Dive

*Prepared: March 2026*
*Status: In Progress — Gemini completed Phase A + partial Phase B*
*Last verified: March 4, 2026*

---

## Context

After reviewing the site with Gemini CLI, we want to push to absolute best-in-class SEO, performance, and content quality. Gemini made architectural changes (SEOHead component, customSchema pattern, breadcrumb schema, author schema, hreflang) and fixed its own regressions. This plan tracks remaining work.

**Important:** Gemini's changes (34 modified + 6 new files) are in the working tree but **not committed**. They must pass `npm run validate` before committing.

---

## Phase A: Fix Gemini Regressions

- [x] **A1. Fix SEOHead title suffix** — Changed to `"Attack A Crack"` (17-char suffix), added `title.includes()` duplicate detection
- [x] **A2. Fix OG image default** — Changed from `picsum.photos` to `/images/logo.jpg`
- [x] **A3. Verify Layout + SEOHead integration** — No double `<title>`/description/canonical tags. Layout delegates all meta to SEOHead.
- [ ] **A4. Run `npm run validate`** — All 145+ pages must pass. Not yet run.

---

## Phase B: Technical SEO — Full Pinnacle

### B1. Geo-tags on all 80 city pages

- [x] `coordinates` field added to location schema in `src/content.config.ts`
- [x] CT template (`src/pages/connecticut/[city].astro`) passes `city`/`state`/`coordinates` to Layout
- [x] MA template (`src/pages/massachusetts/[city].astro`) passes `city`/`state`/`coordinates` to Layout
- [x] SEOHead renders `geo.position`, `geo.placename`, `geo.region`, `ICBM` conditionally
- [ ] RI template (`src/pages/rhode-island/[city].astro`) — **does NOT pass** `city`/`state`/`coordinates` (wrong "Amston, CT" geo tags)
- [ ] NH template (`src/pages/new-hampshire/[city].astro`) — same issue
- [ ] ME template (`src/pages/maine/[city].astro`) — same issue
- [ ] Populate `coordinates` on all 80 city `.md` files (zero populated today — script needed)

### B2. Unify schema rendering

- [x] All ~14 page templates now pass `customSchema` + `breadcrumbItems` to Layout
- [x] No templates render `<SchemaMarkup>` in their HTML output
- [ ] Remove dead `SchemaMarkup` import from `src/pages/connecticut/[city].astro` (line 8)
- [ ] Remove dead `SchemaMarkup` import from `src/pages/massachusetts/[city].astro` (line 8)
- [ ] Remove dead `SchemaMarkup` import from `src/pages/concrete-repair/index.astro` (line 8)
- [ ] Delete `src/components/SchemaMarkup.astro` file (no longer used)

### B3. Breadcrumb schema on all page types

- [x] `breadcrumbItems` prop supported by Layout and rendered as JSON-LD BreadcrumbList
- [x] All templates pass `breadcrumbItems` to Layout (part of B2 unification)

### B4. Author schema enrichment on blog posts

- [x] Created `src/utils/authors.ts` with Luc Richard and Matt profiles (`jobTitle`, `worksFor`, `knowsAbout`, `sameAs`)
- [x] Blog template (`src/pages/blog/[slug].astro`) imports `getAuthorSchema()` and injects Person schema
- [ ] Verify author data accuracy with Matt — Luc's real credentials, certifications, professional links

### B5. subOrganization schema (multi-hub entity)

- [ ] Add CT and MA offices as `subOrganization` entities on homepage schema
- [ ] Add to Areas We Serve page schema

### B6. OG placeholder detection in validation

- [ ] Add hard error to `scripts/check-seo.js` if any `og:image` contains "picsum.photos"

### B7. hreflang tag

- [x] `<link rel="alternate" hreflang="en-us">` added to SEOHead.astro

### B8. Security headers in Vercel config

- [ ] Add `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` to `vercel.json`

### B9. Expand Lighthouse CI test URLs

- [ ] Add a city page + blog post URL to `lighthouserc.cjs`

### B10. Sitemap validation in CI

- [ ] New `scripts/validate-sitemap.js` — verify URL count, HTTPS domain, expected page count
- [ ] Add to `package.json` validate pipeline

### B11. Stricter schema validation

- [ ] `AggregateRating` must have `itemReviewed`
- [ ] `BreadcrumbList` must have absolute URLs
- [ ] `FAQPage` items must be complete
- [ ] Update `scripts/validate-schema.js`

### B12. Optional geo-tags on blog posts

- [x] `coordinates` field added to blog schema in `src/content.config.ts`
- [ ] Verify blog template conditionally passes `city`/`state`/`geoPosition` to Layout when present

### B13. Micro case study system ("Recent Projects")

- [ ] New `projects` content collection schema in `src/content.config.ts`
- [ ] Index page at `/projects/` with filterable grid
- [ ] Individual project pages with before/after, LocalBusiness schema, geo-tags
- [ ] City page templates query matching projects → "Recent Work in [City]"
- [ ] DecapCMS config entry for easy posting
- *Blocked on:* Matt providing before/after photos and workflow preference

### B14. "Repair-first" naming sweep (NEW — Gemini claimed done but wasn't)

Gemini claimed a "repair-first" sweep was completed, but verification found "resurfacing" still present in high-impact locations:

- [ ] `src/pages/massachusetts/index.astro` — meta description + body text say "resurfacing"
- [ ] `src/content/concrete-repair/driveway.md` — metaTitle, metaDescription, excerpt, body, FAQs
- [ ] `src/content/concrete-repair/patio.md` — metaTitle, metaDescription, body
- [ ] `src/content/concrete-repair/walkway.md` — metaTitle, metaDescription, body, FAQs
- [ ] `src/content/concrete-repair/pool-deck.md` — metaTitle, metaDescription, body
- [ ] `src/content/concrete-repair/garage.md` — metaTitle, metaDescription, body
- [ ] `src/content/concrete-repair/stairway.md` — metaTitle, metaDescription

*Per project memory: "Repair" not "resurfacing" — SEO research confirmed repair has 2-3x search volume.*

### Bonus: New utilities created by Gemini

- [x] `src/utils/faqs.ts` — Centralized home FAQ data with `getFaqSchema()` function (6 FAQs, includes pricing)

---

## Phase C: Crawl Existing Site for Expertise Baseline

- [ ] **C1. Crawl attackacrack.com** — Fetch service/about/methodology content. Extract technical details, materials, process descriptions, equipment, certifications. Output: `docs/EXPERTISE-BASELINE.md`
- [ ] **C2. Gap analysis** — Compare extracted details against `src/content/services/*.md`. Flag missing expertise.
- [ ] **C3. Prepare brainstorm agenda** — Questions for Matt & Luc's deep-dive. Topics: injection methodology, diagnostics, material science, regional expertise, case studies, insurance.

---

## Phase D: Content Enrichment (Interactive Session with Matt)

- [ ] **D1. Service page enrichment** — "Materials We Use" (brands/specs), "What to Expect" walkthroughs, regional notes, expanded FAQs
- [ ] **D2. New blog posts** (keyword gaps):

| Topic | Monthly Volume | KD |
|-------|:--------------:|:--:|
| Does Insurance Cover Foundation Repair? | 1,600 | 18 |
| Cement vs Concrete: Homeowner's Guide | 14,800 | 22 |
| Foundation Repair Seasonal Guide | 720 | 8 |
| How We Diagnose Foundation Problems | 480 | 12 |
| Pool Deck Crack Repair Guide | 5,400 | 15 |
| Driveway Crack Repair Guide | 1,900 | 12 |

- [ ] **D3. About page E-E-A-T** — Luc's credentials/timeline, company milestones, Person schema
- [ ] **D4. City page deep localization** — Neighborhood specifics for top 20 cities

---

## Execution Order

1. **A4** — Validate + commit Gemini's work (Phase A + B2-B4, B7, B12 schema)
2. **B1 remaining** — Fix RI/NH/ME templates, populate coordinates on 80 city files
3. **B2 cleanup** — Remove dead imports, delete SchemaMarkup.astro
4. **B14** — "Repair-first" sweep on MA hub + 6 concrete-repair files
5. **C1** — Crawl existing site (parallel with B5-B11)
6. **B5-B6, B8-B11** — Entity schema, validation hardening, security headers
7. **B13** — Micro case study system
8. **C2-C3** — Gap analysis + brainstorm prep
9. **D1-D4** — Content enrichment (interactive session)
10. **Ongoing** — Post micro case studies per job (post-launch)

---

## Verification Strategy

After each batch:
1. `npm run validate` — all pages pass
2. `npx @lhci/cli autorun` — Lighthouse CI passes
3. Screenshot key pages for visual confirmation
4. Google Rich Results Test on representative URLs (manual)

---

## Data Needed from Matt & Jim

| Item | Why | Phase | Status |
|------|-----|-------|--------|
| Real photos for ~30 placeholders | Replace picsum.photos images | B ongoing | Waiting |
| Luc's credentials — certs, training, years | Author schema + About page E-E-A-T | B4, D3 | Waiting |
| MA Google Place ID | Google Business Profile link | B5 | Waiting |
| 3-5 detailed job stories | Service pages + blog content | D1, D2 | Waiting |
| Insurance guidance | Blog post + FAQ content | D2 | Waiting |
| Testimonial verification (20 reviews) | Legal/accuracy compliance | Pre-launch | Waiting |
| Before/after photos from recent jobs | Seed micro case study system | B13 | Waiting |
| Job posting workflow preference | DecapCMS form design | B13 | Waiting |

---

## Questions for Review

1. **Priority:** Phase B technical SEO or Phase C expertise crawl after committing Gemini's fixes?
2. **Blog topics:** Other topics beyond the 6 listed that customers ask about?
3. **City pages:** Which 20 cities for deep localization in D4?
4. **Timeline:** Hard deadlines for launch?
