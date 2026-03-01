# SEO Enhancement Plan: LLM-Ready Optimization

## Overview

This plan implements SEO enhancements focused on LLM-ready structured data, accessibility testing, and multi-state geographic expansion based on Gemini's 2026 SEO recommendations.

**Current State:** 55 pages built, all 12 migration phases complete. Ready for enhancements.

---

## Implementation Phases

### Phase 1: Quick Wins

#### 1.1 Accessibility Testing
- Add `@axe-core/cli` and `axe-core` to devDependencies
- Create `scripts/check-a11y.js` that tests key page types
- Add to `.github/workflows/quality.yml`
- **Strictness:** Fail on critical/serious violations, warn on minor

#### 1.2 Service State Filtering
- Connecticut cities: Show only foundation repair services (NO resurfacing)
- Massachusetts cities: Show BOTH foundation repair AND resurfacing services
- Update `areaServed` schema to be accurate per service type

---

### Phase 2: LLM Schema Optimization

#### 2.1 Add `significantLink` Property
LLMs use this property to understand content relationships.

**Article schemas (blog, foundation-types):**
- Link to related services and foundation type pages
- Generate from `relatedPosts`, `relatedServices` fields

**Service schemas:**
- Link to related services and state hub pages
- Generate from `relatedServices` field

**LocalBusiness schemas (location pages):**
- Link to available services
- Link to nearby cities from `nearbyCities` field

#### 2.2 Add `mentions` Property
Helps LLMs understand entities discussed in content.

**Article schemas:**
- Extract from content tags, categories
- Include service names, foundation types, cities discussed

**LocalBusiness schemas:**
- Use `neighborhoods` and `localLandmarks` fields
- Include `@type: Neighborhood` and `@type: Landmark` entries

#### 2.3 Reverse Location Links on Service Pages
- Display "Available in: Boston, Cambridge, Worcester..." (max 10 cities)
- Link to state hub for remaining cities
- Filter by service availability (resurfacing: MA only)

---

### Phase 3: Rich Results Optimization

#### 3.1 Schema Enhancements
- Add `HowTo` schema to service pages with step-by-step processes
- Add `AggregateRating` to service pages
- Verify FAQ schema matches Google requirements

---

### Phase 4: Internal Linking Automation

#### 4.1 Region-Based Auto-Linking
Create `src/utils/regions.ts` with canonical region definitions:
- Auto-generate `nearbyCities` from same-region cities
- Allow manual override for edge cases

#### 4.2 Build-Time Link Validation
Create `scripts/validate-links.js`:
- Check all `nearbyCities` references exist
- Check all `relatedServices` references exist
- Warn on orphan pages (no incoming internal links)

---

### Phase 5: Review Data Centralization

#### 5.1 Single Source of Truth
Use `src/content/settings/general.json`:
```json
{
  "google_reviews_count": 240,
  "google_rating": 4.9
}
```

#### 5.2 Utility for Schema Usage
Create `src/utils/reviews.ts` to load review data at build time.

---

### Phase 6: Geographic Expansion

#### Service Area Definition

| State | Coverage | Services |
|-------|----------|----------|
| Connecticut | Eastern 2/3 only | Foundation Repair only |
| Massachusetts | Full state | Foundation Repair + Resurfacing |
| Rhode Island | Within 2hr of Quincy | Foundation Repair + Resurfacing |
| New Hampshire | Southern NH | Foundation Repair + Resurfacing |
| Maine | Southern ME | Foundation Repair + Resurfacing |

#### Connecticut County Filtering

**KEEP (Eastern 2/3):**
- Hartford County
- New Haven County
- Middlesex County
- New London County
- Windham County
- Tolland County

**REMOVE (Western 1/3):**
- Fairfield County (Stamford, Greenwich, Norwalk, etc.)
- Litchfield County

#### Content Schema Updates
```typescript
state: z.enum(['Connecticut', 'Massachusetts', 'Rhode Island', 'New Hampshire', 'Maine']),
stateAbbr: z.enum(['CT', 'MA', 'RI', 'NH', 'ME']),
```

---

## Service Availability Matrix

| Service Type | CT | MA | RI | NH | ME |
|--------------|:--:|:--:|:--:|:--:|:--:|
| Foundation Repair | Yes | Yes | Yes | Yes | Yes |
| Concrete Resurfacing | **No** | Yes | Yes | Yes | Yes |

**Rule:** Concrete resurfacing available everywhere EXCEPT Connecticut.

---

## Estimated City Count by State

| State | Estimated Cities |
|-------|------------------|
| Connecticut (filtered) | ~25 |
| Massachusetts | ~80 |
| Rhode Island | ~20 |
| New Hampshire | ~15 |
| Maine | ~15 |
| **Total** | **~155** |

---

## Verification Plan

### 1. Accessibility Testing
```bash
npm run check:a11y
# Should pass with no critical/serious violations
```

### 2. Service State Filtering
- `/connecticut/hartford` - Should NOT show concrete resurfacing
- `/massachusetts/boston` - SHOULD show both foundation repair AND resurfacing

### 3. LLM JSON-LD Verification
Test with Google Rich Results Test:
- `/blog/foundation-repair-cost-guide-2026` (Article + FAQ)
- `/services/wall-crack-repair` (Service + FAQ + HowTo)
- `/massachusetts/boston` (LocalBusiness + AggregateRating + FAQ)

Verify presence of:
- `significantLink` property
- `mentions` property

### 4. Internal Link Validation
```bash
npm run validate:links
# Should report no broken internal links
```

### 5. Full Validation Suite
```bash
npm run validate
# All checks should pass
```

---

## Deferred Items

| Item | Reason |
|------|--------|
| Visual Regression Testing | High effort, more valuable after city expansion |
| Google Places API Integration | Manual updates sufficient for launch |
| Geographic Proximity Calculation | Region-based linking adequate for now |

---

## Already Implemented

- Breadcrumb schemas (BreadcrumbList)
- 301 redirects from Squarespace URLs
- FAQ schemas on service/location/foundation-type pages
- Basic JSON-LD structured data

---

## Files to Modify

### Phase 1
- `package.json` - Add axe-core dependencies
- `scripts/check-a11y.js` - New file
- `.github/workflows/quality.yml` - Add a11y step
- `src/pages/connecticut/[city].astro` - Filter services
- `src/pages/massachusetts/[city].astro` - Already correct

### Phase 2
- `src/pages/blog/[slug].astro` - Add significantLink, mentions
- `src/pages/services/[slug].astro` - Add significantLink, mentions, location links
- `src/pages/foundation-types/[slug].astro` - Add significantLink, mentions
- `src/pages/connecticut/[city].astro` - Add significantLink, mentions
- `src/pages/massachusetts/[city].astro` - Add significantLink, mentions
- `src/pages/concrete-resurfacing/[slug].astro` - Add location links

### Phase 3
- `src/pages/services/[slug].astro` - Add HowTo, AggregateRating schemas

### Phase 4
- `src/utils/regions.ts` - New file with region definitions
- `scripts/validate-links.js` - New file

### Phase 5
- `src/utils/reviews.ts` - New file
- `src/content/settings/general.json` - Verify structure

### Phase 6
- `src/content/config.ts` - Expand state enum
- `src/pages/rhode-island/index.astro` - New file
- `src/pages/rhode-island/[city].astro` - New file
- `src/pages/new-hampshire/index.astro` - New file
- `src/pages/new-hampshire/[city].astro` - New file
- `src/pages/maine/index.astro` - New file
- `src/pages/maine/[city].astro` - New file
