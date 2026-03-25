# Connecticut City Expansion Plan

> **Status:** Post-launch task. Do not execute until after DNS cutover.
> **Goal:** Expand CT city pages from 20 to 36, adding eastern/central CT coverage based on Luc's actual service area feedback.

---

## Background

Luc confirmed he does NOT serve western CT (Stamford, Danbury, Fairfield, Greenwich, Torrington) — none of which have pages. All 20 current CT cities are valid and should be kept. The expansion adds 16 cities he specifically gets calls from, heavily skewing eastern and central CT.

---

## Current State: 20 CT Cities (all kept)

Hartford, West Hartford, East Hartford, Manchester, Glastonbury, Vernon, Enfield, Wethersfield, Newington, New Haven, Meriden, Wallingford, Cheshire, Middletown, Bristol, New Britain, Southington, Norwich, New London, Groton

---

## 16 New Cities to Add

| City | Region | File | Key Differentiator |
|------|--------|------|--------------------|
| South Windsor | Greater Hartford | `south-windsor.md` | CT River floodplain, tobacco-farming heritage, 1960s-80s suburban growth |
| Windsor | Greater Hartford | `windsor.md` | CT's oldest town, CT River / Farmington River confluence |
| Avon | Greater Hartford | `avon.md` | Farmington Valley, upscale suburb, Avon Mountain terrain |
| Simsbury | Greater Hartford | `simsbury.md` | Farmington River valley, colonial-era town, mix of historic and modern |
| Canton | Greater Hartford | `canton.md` | Farmington River valley, Collinsville village, hilly terrain |
| Rocky Hill | Greater Hartford | `rocky-hill.md` | CT River, dinosaur tracks area, 1950s-70s housing |
| East Hampton | Central CT | `east-hampton.md` | Lake Pocotopaug, "Belltown," mid-century housing |
| Chester | Central CT | `chester.md` | CT River village, older housing stock, artistic community |
| Bethany | Central CT | `bethany.md` | Rural-suburban New Haven County, rocky terrain, well water |
| Ledyard | Eastern CT | `ledyard.md` | Near Groton/sub base, Thames River area, military housing |
| Colchester | Eastern CT | `colchester.md` | Near Amston HQ, varied terrain, growing suburb |
| Windham | Eastern CT | `windham.md` | Willimantic area, mill town, Willimantic River valley |
| Canterbury | Eastern CT | `canterbury.md` | Rural Windham County, older farmsteads, newer subdivisions |
| Chaplin | Eastern CT | `chaplin.md` | Small rural town, Natchaug River, older housing stock |
| Lebanon | Eastern CT | `lebanon.md` | Historic town green, rural character, mixed-era homes |
| Salem | Eastern CT | `salem.md` | Rural eastern CT, newer developments on glacial terrain |

---

## Updated Region Map (36 cities total)

- **Greater Hartford (15):** Hartford, West Hartford, East Hartford, Manchester, Glastonbury, Vernon, Enfield, Wethersfield, Newington, *South Windsor, Windsor, Avon, Simsbury, Canton, Rocky Hill*
- **Greater New Haven (4):** New Haven, Meriden, Wallingford, Cheshire *(unchanged)*
- **Central Connecticut (7):** Middletown, Bristol, New Britain, Southington, *East Hampton, Chester, Bethany*
- **Eastern Connecticut (10):** Norwich, New London, Groton, *Ledyard, Colchester, Windham, Canterbury, Chaplin, Lebanon, Salem*

---

## Implementation Checklist

### 1. Create 16 new city files in `src/content/locations/connecticut/`

Each follows the existing pattern (use `enfield.md` as template):

**Frontmatter:**
- city, state: "Connecticut", stateAbbr: "CT"
- metaTitle: `"Foundation Repair in {City}, CT | Attack A Crack"` (≤60 chars, all verified)
- metaDescription: 120-160 chars, unique local detail per city
- region (per table above)
- population (census data)
- averageHomeAge (decade range)
- commonFoundationTypes (poured concrete, block/CMU, fieldstone for older towns)
- neighborhoods (3-5 real villages/areas)
- nearbyCities (3-5 adjacent cities with pages)
- phoneNumber: "860-573-8760"
- faqs (3): cost question, local geology question, area-specific question
- servesResurfacing: false
- coordinates: lat/lng

**Body:** H2 heading + 3 paragraphs (city character → geology/soil → AAC pitch with warranty/CTA)

### 2. Update CT index page (`src/pages/connecticut/index.astro`)

- Update `ctCities` array (line ~29) — add all 16 new cities
- Update `ctRegions` object (line ~38) — add cities to appropriate region buckets
- Update comment from "20 cities" to "36 cities"

### 3. Update nearbyCities on existing city files

| Existing City | Add to nearbyCities |
|---------------|---------------------|
| Manchester | South Windsor |
| East Hartford | South Windsor |
| Vernon | South Windsor |
| Glastonbury | Rocky Hill, South Windsor |
| Hartford | Windsor |
| Enfield | Windsor |
| West Hartford | Avon |
| Wethersfield | Rocky Hill |
| Newington | Rocky Hill |
| Bristol | Avon, Canton |
| Middletown | East Hampton, Rocky Hill, Chester |
| Cheshire | Bethany |
| New Haven | Bethany |
| Groton | Ledyard |
| Norwich | Ledyard, Colchester, Salem |

### 4. New city nearbyCities assignments

| New City | nearbyCities |
|----------|-------------|
| South Windsor | Manchester, East Hartford, Vernon, Windsor, Glastonbury |
| Windsor | Hartford, South Windsor, Simsbury, Enfield |
| Avon | Simsbury, Canton, West Hartford, Bristol |
| Simsbury | Avon, Canton, Windsor, West Hartford |
| Canton | Simsbury, Avon, Bristol |
| Rocky Hill | Wethersfield, Newington, Middletown, Glastonbury |
| East Hampton | Middletown, Colchester, Glastonbury |
| Chester | Middletown, East Hampton |
| Bethany | Cheshire, New Haven, Wallingford |
| Ledyard | Groton, Norwich, Colchester |
| Colchester | Lebanon, East Hampton, Norwich, Ledyard |
| Windham | Canterbury, Chaplin, Lebanon |
| Canterbury | Windham, Chaplin |
| Chaplin | Windham, Canterbury, Lebanon |
| Lebanon | Colchester, Windham, Chaplin |
| Salem | Colchester, Norwich, Ledyard |

### 5. Validate

```bash
npm run validate
```

Check: metaDescription lengths, metaTitle lengths, schema, heading hierarchy, link validation, uniqueness scores.

---

## Content Quality Notes

- Each city body must have genuinely unique content — specific landmarks, rivers, soil types, housing eras
- Smaller rural towns (Chaplin, Canterbury, Salem, Lebanon) need extra care for differentiation. Use: proximity to Amston HQ, specific river systems (Natchaug, Quinebaug), rural lot sizes, well water vs. municipal
- The ServiceAreaMap component auto-generates pins from coordinates — no map changes needed
- No 301 redirects needed (no pages being removed)
