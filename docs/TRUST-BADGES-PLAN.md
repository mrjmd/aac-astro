# Trust Badges & Credentials Implementation Plan

Add visual trust badges, license numbers, and structured data for credentials across the site.

## 1. Badge Inventory

| Badge | Logo File | Link Target | Pages | Notes |
|---|---|---|---|---|
| BBB A+ Accredited | `public/images/bbb-logo-torch.png` | https://www.bbb.org/us/ct/north-windham/profile/concrete-repair/attack-a-crack-0111-74000203 | Homepage, CT, RI/NH/ME, services, blog, about (default) | Accredited since March 23, 2026 |
| ASHI New England | `public/images/ASHI-New-England-Logo.png` | https://www.ashinewengland.org/ | All pages (every badge set includes this) | Affiliate member |
| GBAR | `public/images/gbar-logo.jpeg` | https://www.gbar.org/ | MA pages + homepage only | Greater Boston Association of Realtors — MA-specific |
| Quincy Chamber | `public/images/quincy-chamber-member-logo.png` | https://www.quincychamber.com/ | MA pages only | Replaces BBB in MA badge set |
| CT HIC #0629164 | N/A (text only, in footer) | https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx | All pages (footer) | No permalink; search-based lookup |
| MA HIC #214356 | N/A (text only, in footer) | https://contractorhub.mass.gov/s/hic-contractor-search | All pages (footer) | No permalink; search-based lookup |

## 2. TrustBar Component Spec

**File:** `src/components/TrustBar.astro`

### Props

```typescript
interface Props {
  pathname: string; // Astro.url.pathname — determines which badge set to show
}
```

### Badge Selection Logic

```typescript
function getBadges(pathname: string) {
  if (pathname.startsWith('/massachusetts/')) {
    return [ASHI, GBAR, QUINCY_CHAMBER];  // 3 MA-specific badges
  }
  if (pathname === '/') {
    return [BBB, ASHI, HIC_BOTH];  // Homepage: both HIC numbers stacked as third badge
  }
  if (pathname.startsWith('/connecticut/')) {
    return [BBB, ASHI, HIC_CT];  // CT pages: CT license only
  }
  // RI, NH, ME, services, blog, about, etc.
  return [BBB, ASHI, HIC_BOTH];  // Both HIC numbers stacked
}
```

**HIC badge display:**
- `HIC_BOTH`: Two lines stacked — "CT HIC #0629164" / "MA HIC #214356" — text badge, no logo image
- `HIC_CT`: Single line — "CT HIC #0629164"
- Styled as a text badge matching the visual weight of the logo badges (same height/footprint)
- Links to the respective state lookup portals
- This is a placeholder for a third universal badge (e.g., Google Guaranteed) — when obtained, replace the HIC text badge and move HIC numbers to footer-only

### Layout & Styling

- **Container:** full-width, `bg-white` or `bg-zinc-50`, thin `border-y border-zinc-200`, compact padding (`py-4`)
- **Inner:** `max-w-7xl mx-auto px-6`, flex row, centered, `gap-8 md:gap-12`
- **Each badge:** anchor wrapping an image + text label
  - Image: `h-10 md:h-12` (40-50px), `object-contain`, grayscale filter (`grayscale`) with hover to full color (`hover:grayscale-0 transition-all`)
  - Label: `text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400` below the image
  - Link: `target="_blank" rel="noopener noreferrer"`, flex column centered
- **Mobile:** 3 badges in a single row — they're small enough. Use `justify-center` with even spacing.
- **Accessibility:** Each image gets descriptive alt text (e.g., "BBB A+ Accredited Business"). Link wraps both image and label so the entire badge is clickable.

### Markup Sketch

```astro
---
interface Props { pathname: string; }
const { pathname } = Astro.props;

const badges = [
  { name: 'BBB A+ Accredited', src: '/images/bbb-logo-torch.png', alt: 'BBB A+ Accredited Business', href: 'https://www.bbb.org/us/ct/north-windham/profile/concrete-repair/attack-a-crack-0111-74000203' },
  { name: 'ASHI New England', src: '/images/ASHI-New-England-Logo.png', alt: 'ASHI New England Affiliate Member', href: 'https://www.ashinewengland.org/' },
  { name: 'GBAR Member', src: '/images/gbar-logo.jpeg', alt: 'Greater Boston Association of Realtors Member', href: 'https://www.gbar.org/' },
  { name: 'Quincy Chamber', src: '/images/quincy-chamber-member-logo.png', alt: 'Quincy Chamber of Commerce Member', href: 'https://www.quincychamber.com/' },
];

const isMA = pathname.startsWith('/massachusetts/');
const isCT = pathname.startsWith('/connecticut/');

// Badge selection: always 3 badges
// MA pages: ASHI, GBAR, Quincy Chamber
// CT pages: BBB, ASHI, CT HIC only
// Homepage + all others: BBB, ASHI, both HIC numbers stacked
const showGBAR = isMA;
const showQuincyChamber = isMA;
const showHIC = !isMA;  // HIC badge replaces GBAR/Quincy on non-MA pages
const hicScope = isCT ? 'ct' : 'both';  // CT pages show CT license only
---

<div class="bg-white border-y border-zinc-200 py-4">
  <div class="max-w-7xl mx-auto px-6 flex items-center justify-center gap-8 md:gap-12">
    {selected.map(badge => (
      <a href={badge.href} target="_blank" rel="noopener noreferrer"
         class="flex flex-col items-center gap-1.5 group">
        <img src={badge.src} alt={badge.alt} loading="eager"
             class="h-10 md:h-12 object-contain grayscale group-hover:grayscale-0 transition-all" />
        <span class="text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-400">
          {badge.name}
        </span>
      </a>
    ))}
  </div>
</div>
```

## 3. Stats Bar Relocation

The yellow stats bar (20+ Years, Lifetime Guarantee, Reviews, Free Diagnosis) currently sits directly under the hero. It moves down to let the TrustBar take that position.

### Homepage (`src/pages/index.astro`)

- **Current order:** Hero -> Stats Bar (lines 82-96) -> Services -> Team -> Reviews -> ...
- **New order:** Hero -> **TrustBar** -> Services -> **Stats Bar** -> Team -> Reviews -> ...
- Stats bar moves below the `<Services />` component (currently line 98), above `<Team />`
- TrustBar usage: `<TrustBar pathname={Astro.url.pathname} />`

### City Pages (5 templates)

Files affected:
- `src/pages/connecticut/[city].astro`
- `src/pages/massachusetts/[city].astro`
- `src/pages/rhode-island/[city].astro`
- `src/pages/new-hampshire/[city].astro`
- `src/pages/maine/[city].astro`

- **New order:** Hero -> **TrustBar** -> (services/pricing sections) -> **Stats Bar** -> (remaining sections)
- Insert TrustBar immediately after the hero section
- Move the stats bar below the services/pricing content

## 4. Footer License Numbers

**File:** `src/components/Footer.astro`

Add license numbers in the footer's bottom bar area, above or alongside the copyright line.

### Markup

```html
<p class="text-xs text-zinc-400 font-medium">
  Licensed Home Improvement Contractor:
  <a href="https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx"
     target="_blank" rel="noopener noreferrer" class="hover:text-zinc-600 transition-colors">
    CT #0629164
  </a>
  <span class="mx-1">|</span>
  <a href="https://contractorhub.mass.gov/s/hic-contractor-search"
     target="_blank" rel="noopener noreferrer" class="hover:text-zinc-600 transition-colors">
    MA #214356
  </a>
</p>
```

- Small, understated — same size as copyright text
- Positioned on its own line above or below the copyright in the footer bottom section
- Links open the state lookup portals (no deep link possible, user must search)

## 5. Schema Additions

**File:** `src/layouts/Layout.astro` (JSON-LD block for `HomeAndConstructionBusiness`)

### Add `hasCredential`

```json
"hasCredential": [
  {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "Home Improvement Contractor License",
    "recognizedBy": {
      "@type": "Organization",
      "name": "State of Connecticut"
    },
    "identifier": "HIC.0629164"
  },
  {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "Home Improvement Contractor License",
    "recognizedBy": {
      "@type": "Organization",
      "name": "Commonwealth of Massachusetts"
    },
    "identifier": "214356"
  }
]
```

### Add `memberOf`

```json
"memberOf": [
  {
    "@type": "Organization",
    "name": "American Society of Home Inspectors - New England Chapter"
  },
  {
    "@type": "Organization",
    "name": "Greater Boston Association of Realtors"
  },
  {
    "@type": "Organization",
    "name": "Quincy Chamber of Commerce"
  }
]
```

### Extend `sameAs`

Add to the existing `sameAs` array:
- `"https://www.bbb.org/us/ct/north-windham/profile/concrete-repair/attack-a-crack-0111-74000203"`
- Google Maps URLs for both locations (if not already present)
- Yelp URL (if/when available)

## 6. About Page Update

**File:** `src/pages/about.astro` (E-E-A-T section, lines ~250-295)

Update the credentials prose to include:
- **BBB A+ Accredited** with link to profile
- Actual license numbers: CT HIC #0629164, MA HIC #214356
- Mention ASHI NE and GBAR memberships explicitly

This is a text/content update to the existing section, not a badge component insertion. The About page is where visitors expect detailed credential information.

## 7. Future Badges (Not Implemented)

These are documented for future pursuit. Prioritized by estimated impact:

| Badge | Impact | Requirements | Notes |
|---|---|---|---|
| **Google Guaranteed** | HIGH | Background checks (~$50-100/person), license verification, insurance ($1M GL min) | Green checkmark in SERPs. Foundation services eligible. Top priority. |
| **Angi Super Service Award** | MEDIUM | 3+ reviews, 4.5+ lifetime rating on Angi | Most competitors display this. Low effort if reviews exist. |
| **NFRA Membership + NCFRS Cert** | MEDIUM | National Foundation Repair Association membership, 150-question exam | Industry specialist credential. Differentiator in NE. |
| **BHA Certified Structural Repair** | MEDIUM | Basement Health Association exam ($500) | Only Pioneer has this in NE. Strong differentiator. |
| **Manufacturer Certifications** | LOW-MED | Rhino Carbon Fiber authorized installer, Simpson Strong-Tie trained | Product-specific trust signals. |
| **CT/MA Realtors Association** | LOW | Affiliate membership application | CT Basement Systems displays this. |

## 8. Implementation Checklist

- [ ] Create `src/components/TrustBar.astro` component
- [ ] Add TrustBar to `src/pages/index.astro` (below hero)
- [ ] Add TrustBar to all 5 city page templates
- [ ] Relocate stats bar on homepage (below Services section)
- [ ] Relocate stats bar on city pages (below services/pricing)
- [ ] Add license numbers to `src/components/Footer.astro`
- [ ] Add `hasCredential` to JSON-LD in `src/layouts/Layout.astro`
- [ ] Add `memberOf` to JSON-LD in `src/layouts/Layout.astro`
- [ ] Add BBB profile URL to `sameAs` in `src/layouts/Layout.astro`
- [ ] Update About page E-E-A-T section with license numbers and BBB link
- [ ] Run `npm run optimize:images` on badge logos
- [ ] Run `npm run validate` (all checks must pass)
- [ ] Visual verification: screenshot homepage trust bar
- [ ] Visual verification: screenshot MA city page (different badge set)
- [ ] Visual verification: screenshot footer license numbers
- [ ] Visual verification: screenshot mobile layout

## 9. Image Optimization Note

Badge logos already exist in `public/images/`. After implementation:

1. Run `npm run optimize:images` to generate WebP variants for the badge logos
2. Since these are small logos displayed at 40-50px height, the originals (PNG/JPEG) may be acceptable without WebP conversion -- assess file sizes after the optimize run
3. **Future improvement:** SVG versions of all logos would render crisply at any size and eliminate the need for optimization entirely. Worth pursuing if the organizations provide SVG assets.
