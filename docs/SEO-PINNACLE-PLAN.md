# Site-Wide SEO Pinnacle & Expertise Deep-Dive

*Prepared: March 2026*
*Status: Phase A-C complete. B13 Phase 1 + B14 complete. Phase D1-D5 complete. D6 pending. D7 complete. E1-E3 complete. E4-E5 pending (need Google Cloud creds).*
*Last verified: March 4, 2026 — all 155 pages pass 8 validation checks, 0 errors*

---

## Context

After reviewing the site with Gemini CLI, we want to push to absolute best-in-class SEO, performance, and content quality. Gemini made architectural changes (SEOHead component, customSchema pattern, breadcrumb schema, author schema, hreflang) and fixed its own regressions. Claude then completed all remaining technical SEO, validation hardening, and site crawl work.

---

## Phase A: Fix Gemini Regressions

- [x] **A1. Fix SEOHead title suffix** — Changed to `"Attack A Crack"` (17-char suffix), added `title.includes()` duplicate detection
- [x] **A2. Fix OG image default** — Changed from `picsum.photos` to `/images/logo.jpg`
- [x] **A3. Verify Layout + SEOHead integration** — No double `<title>`/description/canonical tags. Layout delegates all meta to SEOHead.
- [x] **A4. Run `npm run validate`** — All 145 pages pass all checks. Committed `a81bf65`.

---

## Phase B: Technical SEO — Full Pinnacle

### B1. Geo-tags on all 80 city pages

- [x] `coordinates` field added to location schema in `src/content.config.ts`
- [x] CT template passes `city`/`state`/`coordinates` to Layout
- [x] MA template passes `city`/`state`/`coordinates` to Layout
- [x] SEOHead renders `geo.position`, `geo.placename`, `geo.region`, `ICBM` conditionally
- [x] RI template (`src/pages/rhode-island/[city].astro`) — fixed, now passes `city`/`state`/`coordinates`
- [x] NH template (`src/pages/new-hampshire/[city].astro`) — fixed
- [x] ME template (`src/pages/maine/[city].astro`) — fixed
- [x] Populated `coordinates` on all 80 city `.md` files via `scripts/populate-coordinates.js`

### B2. Unify schema rendering

- [x] All ~14 page templates now pass `customSchema` + `breadcrumbItems` to Layout
- [x] No templates render `<SchemaMarkup>` in their HTML output
- [x] Remove dead `SchemaMarkup` import from `src/pages/connecticut/[city].astro`
- [x] Remove dead `SchemaMarkup` import from `src/pages/massachusetts/[city].astro`
- [x] Remove dead `SchemaMarkup` import from `src/pages/concrete-repair/index.astro`
- [x] Delete `src/components/SchemaMarkup.astro` file (no longer imported anywhere — removed)

### B3. Breadcrumb schema on all page types

- [x] `breadcrumbItems` prop supported by Layout and rendered as JSON-LD BreadcrumbList
- [x] All templates pass `breadcrumbItems` to Layout
- [x] Blog category pages (`blog/category/[category]/[...page].astro`) — fixed, was the only template missing it

### B4. Author schema enrichment on blog posts

- [x] Created `src/utils/authors.ts` with Luc Richard and Matt profiles (`jobTitle`, `worksFor`, `knowsAbout`, `sameAs`)
- [x] Blog template (`src/pages/blog/[slug].astro`) imports `getAuthorSchema()` and injects Person schema
- [ ] Verify author data accuracy with Matt — Luc's real credentials, certifications, professional links

### B5. subOrganization schema (multi-hub entity)

- [x] Homepage schema includes CT + MA offices as `subOrganization` entities
- [x] Areas We Serve page schema includes `subOrganization`

### B6. OG placeholder detection in validation

- [x] Hard error in `scripts/check-seo.js` if any `og:image` contains "picsum.photos"

### B7. hreflang tag

- [x] `<link rel="alternate" hreflang="en-us">` added to SEOHead.astro

### B8. Security headers in Vercel config

- [x] `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` added to `vercel.json`

### B9. Expand Lighthouse CI test URLs

- [x] Added Hartford city page + blog post to `lighthouserc.cjs` (7 URLs now, up from 5)

### B10. Sitemap validation in CI

- [x] New `scripts/validate-sitemap.js` — verifies URL count (50+), HTTPS domain, page count
- [x] Added to `package.json` validate pipeline as `validate:sitemap`

### B11. Stricter schema validation

- [x] `AggregateRating` must have `itemReviewed`
- [x] `BreadcrumbList` items must have absolute HTTPS URLs
- [x] Updated `scripts/validate-schema.js`

### B12. Optional geo-tags on blog posts

- [x] `city`, `state`, `coordinates` fields added to blog schema in `src/content.config.ts`
- [x] Blog template conditionally passes `city`/`state`/`coordinates` to Layout when present

### B13. Automated Case Study Pipeline ("Recent Projects")

*Post-launch project. See detailed design below.*

- [x] Phase 1: Content collection + static pages (pre-launch ready)
- [ ] Phase 2: Mobile intake form for technician (post-launch)
- [ ] Phase 3: GBP auto-posting integration (post-launch)

### B14. "Repair-first" naming sweep

- [x] Completed by Gemini — pages emphasize "repair" while still mentioning both where appropriate
- [x] Verified: content leads with "repair" terminology per SEO research (2-3x search volume over "resurfacing")

### Bonus: Utilities created

- [x] `src/utils/faqs.ts` — Centralized home FAQ data with `getFaqSchema()` function
- [x] `src/utils/authors.ts` — Author profiles with `getAuthorSchema()` for Person schema
- [x] `scripts/populate-coordinates.js` — Idempotent script to add lat/lng to city files
- [x] `scripts/validate-sitemap.js` — Sitemap validation (URL count, HTTPS, domain)

---

## Phase C: Crawl Existing Site for Expertise Baseline

- [x] **C1. Crawl attackacrack.com** — Fetched all service, about, blog, and partner pages. Extracted technical details, materials, process descriptions, certifications. Output: `docs/EXPERTISE-BASELINE.md`
- [x] **C2. Gap analysis** — 15 high-priority gaps identified (copper ports, 100 PSI pressure, Kevlar grid carbon fiber, Justin La Fontaine's tenure, winter bulkhead advantage, etc.)
- [x] **C3. Brainstorm agenda** — 38 questions organized by topic. Output: `docs/BRAINSTORM-AGENDA.md`

---

## Phase D: Expertise Injection (Immediate — No Matt Input Needed)

*Per Gemini review: the expertise baseline findings haven't been "poured" into service content yet. This can be done now using `docs/EXPERTISE-BASELINE.md` without waiting for Matt's brainstorm answers.*

- [x] **D1. Service page expertise upgrade** — Updated all 6 service pages with technical details from `docs/EXPERTISE-BASELINE.md`:
  - `foundation-crack-injection.md` — Fixed "low-pressure" → "100 PSI", added copper ports, diamond saw, 5-step process
  - `wall-crack-repair.md` — Added diamond saw prep, copper ports, crack assessment techniques (displacement, sighting, prodding)
  - `leaky-bulkhead-repair.md` — Added MA vs CT bulkhead construction, winter repair advantage, lifetime guarantee claim
  - `carbon-fiber-stitches.md` — Added Kevlar grid, 800,000 PSI tensile strength, replaced steel I-beams context
  - `sewer-well-conduit-line-repair.md` — Added failed sealant removal step, active leak capability detail
  - `free-foundation-consultations.md` — Added diagnostic criteria (width, displacement, patterns), first visit = repair visit
- [x] **D2. About page expertise** — Updated 30+ → 33+ everywhere, added Justin La Fontaine detail, GBAR, diamond saw/copper port/100 PSI in values
- [x] **D3. Validate** — All 146 pages pass 8 checks. Committed `86082a0`.

### Gemini Review Notes (Addressed)

| Gemini Finding | Status |
|------|--------|
| "Resurfacing" still in primary headers | Already addressed — B14 complete, Gemini's sweep leads with "repair" |
| Multi-hub entity schema premature | Already implemented (B5) — subOrganization on homepage + areas-we-serve. Low risk, easy to remove if needed. |
| Video roadmap missing | Valid — added as D4 below |

---

## Phase D-ext: Asset Requests + Video Roadmap

- [x] **D4. Create `docs/ASSET-REQUEST.md`** — Matt-friendly photo/video punch list:
  - Exactly which photos are placeholder (9 currently flagged by `check:images`)
  - Specific shot descriptions (e.g., "1 photo of copper injection port installed in crack", "1 photo of fieldstone foundation wall")
  - Video Phase 0: "Record 3 ten-second phone clips: (1) injection port being drilled, (2) resin flowing into crack, (3) finished sealed crack"
  - Format as a printable checklist Matt can hand to the technician
- [x] **D5. Resolve link warnings** — Fixed all 30 warnings:
  - 12 nearbyCities cross-state warnings — fixed validator to prefer same-state matches
  - 2 foundation-type orphans — added hub-page exemption in validator
  - 13 orphan cities — added reciprocal nearbyCities entries (10 neighbor files edited)
  - Result: 0 errors, 0 warnings
- [ ] **D6. Resolve placeholder image warnings** — Replace 9 picsum.photos references with real images or proper fallback images

---

## Phase D-blog: New Blog Posts (Keyword Gaps)

*These require either Matt's input or research-based drafting.*

- [x] **D7. New blog posts:** (6 posts written, all pass validation)

| Topic | Monthly Volume | KD | File |
|-------|:--------------:|:--:|------|
| Does Insurance Cover Foundation Repair? | 1,600 | 18 | `does-insurance-cover-foundation-repair.md` |
| Cement vs Concrete: Homeowner's Guide | 14,800 | 22 | `cement-vs-concrete-homeowners-guide.md` |
| Foundation Repair Seasonal Guide | 720 | 8 | `foundation-repair-seasonal-guide.md` |
| How We Diagnose Foundation Problems | 480 | 12 | `how-we-diagnose-foundation-problems.md` |
| Pool Deck Crack Repair Guide | 5,400 | 15 | `pool-deck-crack-repair-guide.md` |
| Driveway Crack Repair Guide | 1,900 | 12 | `driveway-crack-repair-guide.md` |

- [ ] **D8. About page E-E-A-T (full)** — Luc's credentials/timeline, company milestones, Person schema (needs Matt's input beyond baseline)
- [ ] **D9. City page deep localization** — Neighborhood specifics for top 20 cities

---

## B13 Detailed Design: Automated Case Study Pipeline

### The Vision

Technician finishes a job → takes 2-3 photos on phone → writes a sentence or two → submits from phone. The system automatically:
1. Creates a "Recent Project" page on the website with before/after photos, geo-tags, and schema
2. Posts to the Google Business Profile with photos + link back to the case study

### Architecture: Three Phases

```
Phase 1 (Pre-Launch)     Phase 2 (Post-Launch)      Phase 3 (Post-Launch)
─────────────────────    ─────────────────────────   ──────────────────────
Content collection       Mobile intake form          GBP auto-posting
+ page templates         + image pipeline            + notifications
+ manual posting         + auto rebuild              + analytics
```

---

### Phase 1: Foundation (Build Before Launch, Post Content After)

**Content Collection Schema** (`src/content.config.ts`)

```typescript
const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),                    // Auto-generated: "Foundation Repair in [City]"
    date: z.coerce.date(),
    city: z.string(),
    state: z.enum(['CT', 'MA', 'RI', 'NH', 'ME']),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
    serviceType: z.enum([
      'crack-injection',
      'wall-crack-repair',
      'bulkhead-repair',
      'carbon-fiber',
      'sewer-conduit',
      'concrete-repair'
    ]),
    beforeImage: z.string(),              // Path to before photo
    afterImage: z.string(),               // Path to after photo
    summary: z.string().max(280),         // Technician's 1-2 sentences
    metaDescription: z.string().min(120).max(160).optional(), // Auto-generated if omitted
    technicianNote: z.string().optional(), // Optional longer technical note
    published: z.boolean().default(true),
  }),
});
```

**Pages:**
- `/projects/` — Grid of all projects, filterable by service type and state
- `/projects/[slug]` — Individual project page with before/after, LocalBusiness schema, geo-tags
- City pages gain a "Recent Work in [City]" section querying matching projects

**Manual posting via Decap CMS** (`public/admin/config.yml` entry):
- Simple form: date, city, state, service type, 2 photos, 1-2 sentences
- Works on mobile browser at `attackacrack.com/admin`

---

### Phase 2: Mobile-First Intake Pipeline

**Goal:** Make it brain-dead simple for the technician. Open phone → snap photos → type a sentence → done.

**Option A: Decap CMS on Mobile (Simplest)**
- Already in the project
- Works in mobile Safari/Chrome
- Technician bookmarks `attackacrack.com/admin`
- Submits → creates a Git commit → triggers Vercel rebuild
- **Pros:** No new infrastructure, already works
- **Cons:** Git-based CMS can be slow, mobile UX is acceptable but not great

**Option B: Airtable + Make/Zapier (No-Code Automation)**
- Technician uses Airtable mobile app (excellent UX)
- Form: photos, city dropdown, service type, sentence
- Make.com automation triggers on new Airtable record:
  1. Optimizes photos (resize, WebP conversion via Cloudinary)
  2. Commits a new `.md` file to GitHub via API
  3. Vercel auto-rebuilds
  4. (Phase 3) Posts to GBP
- **Pros:** Best mobile UX, no code for the form, visual automation builder
- **Cons:** Monthly cost (~$20-50/mo for Airtable + Make), vendor dependency

**Option C: Custom PWA with Vercel Serverless (Most Control)**
- Simple PWA: camera capture, city picker, text field, submit button
- Serverless function on submit:
  1. Uploads photos to Vercel Blob or Cloudinary
  2. Uses AI (Claude API) to expand 1-2 sentences into a proper case study paragraph + auto-generate metaDescription
  3. Commits `.md` file to GitHub via Octokit
  4. Vercel rebuilds automatically
- **Pros:** Full control, can add AI enrichment, installable on phone home screen
- **Cons:** Custom dev work, need to maintain

**Recommendation: Start with Option A (Decap CMS), migrate to Option B (Airtable + Make) if the technician finds Decap too clunky. Option C only if you want AI enrichment of the descriptions.**

---

### Phase 3: Google Business Profile Auto-Posting

**How GBP Posts Work:**
- Google Business Profile API v1 (formerly Google My Business API)
- Endpoint: `accounts/{accountId}/locations/{locationId}/localPosts`
- Post types: `STANDARD` (text + photo + optional CTA button)
- CTA options: `LEARN_MORE` with URL back to the case study page
- Photos: uploaded separately via Media endpoint, then referenced in post

**Pipeline:**
```
New project published
        │
        ▼
Automation trigger (webhook on Vercel deploy, or Airtable trigger)
        │
        ▼
Format GBP post:
  - Photo: afterImage (the "after" is more compelling)
  - Text: "Just completed [serviceType] in [City], [State]. [summary]"
  - CTA: "Learn More" → https://www.attackacrack.com/projects/[slug]
        │
        ▼
Google Business Profile API
  - POST to CT location (if CT/RI job)
  - POST to MA location (if MA/NH/ME job)
```

**Requirements:**
- Google Cloud project with Business Profile API enabled
- OAuth2 credentials for the AAC Google account
- CT and MA location IDs (Matt needs to provide MA Place ID)
- Service account or refresh token stored as environment variable

**Implementation Options:**
- **Make.com / Zapier**: Has GBP integration built in. Easiest path.
- **Custom serverless function**: More control over formatting, but need to manage OAuth tokens.
- **n8n (self-hosted)**: Free alternative to Make, runs on a $5/mo VPS.

**Recommendation: Use Make.com for GBP posting. It has a native Google Business Profile module, handles OAuth refresh automatically, and the technician never touches it.**

---

### Phase 2-3 Combined Flow (Recommended Stack)

```
┌─────────────────┐
│  Technician's    │
│  Phone           │
│  (Airtable app)  │
└────────┬────────┘
         │ New record: photos, city, service, sentence
         ▼
┌─────────────────┐
│  Make.com        │
│  Automation      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────┐
│ GitHub │ │ Google BPP   │
│ commit │ │ API post     │
│ (.md)  │ │ (photo+link) │
└───┬────┘ └──────────────┘
    │
    ▼
┌─────────────────┐
│ Vercel rebuild   │
│ (auto on push)   │
│                  │
│ New project page │
│ City page update │
└─────────────────┘
```

**Estimated Costs:**
- Airtable: Free tier (1,000 records) or Plus ($20/mo)
- Make.com: Free tier (1,000 ops/mo) or Core ($9/mo)
- Cloudinary: Free tier (25K transformations/mo) — more than enough
- Total: $0-30/mo depending on volume

**Timeline:**
- Phase 1 (content collection + pages): 1 session to build
- Phase 2 (Airtable + Make pipeline): 1-2 sessions to set up and test
- Phase 3 (GBP posting): 1 session once OAuth is configured

---

### AI Enrichment (Optional Enhancement)

If using Option C (custom PWA) or as a Make.com step:

**Input from technician:**
```
City: Framingham
Service: crack-injection
Photos: [before.jpg, after.jpg]
Note: "8ft vertical crack in poured foundation, basement was flooding every rain"
```

**AI expands to:**
```markdown
## Foundation Crack Injection in Framingham, MA

An 8-foot vertical crack in a poured concrete foundation was causing
basement flooding during every rainstorm. Our team injected the crack
with polyurethane resin at high pressure, sealing it from the interior
surface through to the exterior soil. The repair was completed in under
two hours with a lifetime guarantee.
```

This keeps the technician's input minimal (10 seconds on phone) while producing SEO-rich content for the website.

---

## Phase E: Updates Page, Cross-linking, and Historical Import

*Planned: March 2026. Phases E1-E3 ready to implement now. E4-E5 need Google Cloud setup.*

### E1. Projects Utility + Component

- [x] Create `src/utils/projects.ts` — async data utility (pattern: `src/utils/testimonials.ts`)
  - `getForLocation(city, state, count)` — for city pages
  - `getByService(serviceType, count)` — for service pages
  - `getAll()` — for updates page
  - `SERVICE_SLUG_MAP` — maps service page slugs to project serviceType values
- [x] Create `src/components/ProjectCards.astro` — reusable section (heading + 1-3 cards + "View All" link)

### E2. Cross-link Projects into City + Service Pages

- [x] All 5 city templates — insert "Recent Work in [City]" after Testimonial, before Nearby Cities:
  - `src/pages/connecticut/[city].astro`
  - `src/pages/massachusetts/[city].astro`
  - `src/pages/rhode-island/[city].astro`
  - `src/pages/new-hampshire/[city].astro`
  - `src/pages/maine/[city].astro`
- [x] Service template — `src/pages/services/[slug].astro` — insert after Customer Reviews, before Related Services
  - Mapping: `foundation-crack-injection` → `crack-injection`, `leaky-bulkhead-repair` → `bulkhead-repair`, etc.
- [x] Concrete repair template — `src/pages/concrete-repair/[slug].astro` — same pattern, serviceType `concrete-repair`
- [x] All sections conditionally render only when matching projects exist (ProjectCards only renders when projects.length > 0)

### E3. `/updates` Page + Blog Redirect

- [x] Create `src/pages/updates.astro` — combined blog + projects view
  - Hero: "UPDATES." (matches blog typographic style)
  - Filter bar: "All" | "Articles (N)" | "Projects (N)" — client-side JS with `data-type` attributes
  - Unified 3-col card grid, interleaved by date
  - ItemList schema, breadcrumbs: Home > Updates
  - Title: "Foundation Repair Updates" (42 chars with suffix)
  - Hide "Projects" filter if zero published
- [x] 301 redirect in `vercel.json`: `/blog` → `/updates`
  - Blog index file stays (pagination URLs work for old bookmarks)
  - Individual posts at `/blog/[slug]` continue working
  - Category pages at `/blog/category/...` continue working
- [x] Navbar: "Blog" → "Updates", href → `/updates` (`src/components/Navbar.astro`)
- [x] Footer: update blog link (`src/components/Footer.astro`)
- [x] Add `'updates/index.html'` to HUB_PAGES in `scripts/validate-schema.js`
- [x] `npm run validate` — all 155 pages pass

### E4. Google Calendar Historical Import

Script: `scripts/import-calendar-projects.js`

- [ ] OAuth2 auth with Google Calendar API + Drive API
- [ ] Credentials in `scripts/.credentials/` (gitignored)
- [ ] Fetch events from 2025-01-01 to now where `harrringtonm@gmail.com` is attendee + has attachments
- [ ] Download photos from Google Drive via attachment file IDs
- [ ] Parse location field → city/state
- [ ] **AI enrichment (Claude API, multimodal):** Send event description + before/after photos to Claude Sonnet → generate 280-char summary. Event titles are customer names (not useful for content), so the AI works from the description text and visual analysis of the photos to determine repair type and write a results-focused summary.
- [ ] Generate `.md` files with `published: false` for review before publishing
- [ ] `--dry-run` flag to preview without writing files
- [ ] Dependencies: `googleapis`, `@anthropic-ai/sdk` (devDependencies)
- [ ] npm script: `"import:calendar": "node scripts/import-calendar-projects.js"`

**Prerequisites from Matt:**
- Google Cloud project with Calendar API + Drive API enabled
- OAuth2 credentials (desktop app type), download JSON to `scripts/.credentials/google-oauth.json`

### E5. GBP Batch Posting Script

Script: `scripts/batch-post-gbp.js`

- [ ] Read published project `.md` files not yet posted
- [ ] Format GBP post: after photo + summary + "Learn More" CTA → project page URL
- [ ] Route to CT or MA GBP location based on project state (RI/NH/ME → MA)
- [ ] Track posted slugs in `scripts/.credentials/gbp-posted.json` (avoid duplicates)
- [ ] Exponential backoff for rate limits
- [ ] `--dry-run` and `--limit=N` flags
- [ ] npm script: `"post:gbp": "node scripts/batch-post-gbp.js"`

**Prerequisites from Matt:**
- Enable GBP API in same Google Cloud project
- Provide CT and MA GBP account/location IDs

---

## Verification Strategy

After each batch:
1. `npm run validate` — all pages pass (8 checks: build, schema, images, SEO, a11y, links, uniqueness, sitemap)
2. `npx @lhci/cli autorun` — Lighthouse CI passes
3. Screenshot key pages for visual confirmation
4. Google Rich Results Test on representative URLs (manual)

---

## Data Needed from Matt

| Item | Why | Phase | Status |
|------|-----|-------|--------|
| Real photos for ~30 placeholders | Replace picsum.photos images | B ongoing | Waiting |
| Luc's credentials — certs, training, years | Author schema + About page E-E-A-T | B4, D3 | Waiting |
| MA Google Place ID | GBP API + schema | B5, B13.3 | Waiting |
| 3-5 detailed job stories | Service pages + blog content | D1, D2 | Waiting |
| Insurance guidance | Blog post + FAQ content | D2 | Waiting |
| Testimonial verification (20 reviews) | Legal/accuracy compliance | Pre-launch | Waiting |
| Before/after photos from recent jobs | Seed case study system | B13.1 | Waiting |
| Brainstorm session answers | Close 15 expertise gaps from site crawl | D1-D4 | Waiting |
| Google Cloud project + OAuth creds | Calendar import + GBP posting scripts | E4, E5 | Waiting |
| CT + MA GBP account/location IDs | GBP batch posting | E5 | Waiting |
