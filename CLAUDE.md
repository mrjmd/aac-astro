# CLAUDE.md - Project Rules for AI Assistants

## Project Overview

Attack A Crack Foundation Repair - Astro static site for a New England foundation repair contractor.

- **Framework:** Astro 5 with content collections
- **Styling:** Tailwind CSS v4
- **Hosting:** Vercel (deploys gated on CI passing via GitHub Actions)
- **CI:** GitHub Actions (`.github/workflows/quality.yml`)
- **Launch status:** NOT LAUNCHED. Site must not be crawled until production launch.

## Robots.txt / Crawling

**The site is NOT live.** `robots.txt` blocks all crawlers (`Disallow: /`) until launch. This is intentional and must NOT be changed until the site is ready for production DNS cutover.

- `public/robots.txt` — staging mode, blocks all crawling
- `lighthouserc.cjs` — `is-crawlable` audit is set to `'off'` because of this
- **Pre-launch tasks:** When launching, switch robots.txt to production mode AND remove the `is-crawlable: 'off'` line from lighthouserc.cjs
- The `is-crawlable` Lighthouse skip is the **only** allowed SEO exception. Every other SEO check must pass at 100%.

## SEO is Sacrosanct

All SEO-related issues are hard failures. No warnings. No exceptions.

### Title Tags

- Rendered titles MUST be 30-60 characters
- Layout.astro appends ` | Attack A Crack` (17 chars) to titles that don't already contain it
- Therefore: `metaTitle` in frontmatter must be **max 43 characters** for pages that get the suffix
- Exception: titles that already include "Attack A Crack" (e.g., location pages) can use the full 60 chars
- The Zod schema allows max 60 because of this conditional logic; **actual enforcement happens in `check-seo.js`**
- Always run `npm run check:seo` after changing any title

### Meta Descriptions

- Must be 120-160 characters, no exceptions
- No duplicate descriptions across pages

### Heading Hierarchy

- Every page MUST have exactly one H1
- No skipped heading levels (H1 -> H3 is invalid)

### JSON-LD Structured Data

- Service pages need `Service` schema with name, description, provider
- Location pages need `LocalBusiness` (or `HomeAndConstructionBusiness`) with name, telephone, address
- Blog posts need `Article` (or `BlogPosting`) with headline, author
- Hub/index pages use `ItemList` schemas (validated separately)
- All schemas validated by `validate-schema.js`

### Open Graph & Canonical

- Every page needs og:title, og:description, og:image, og:url
- Every page needs a canonical URL (absolute HTTPS)

### Accessibility

- All axe-core violations are errors, including minor/moderate
- Images must have alt attributes

## Validation Pipeline

### Local (before commit)

```bash
npm run validate    # Build + all checks
```

This runs: `build` -> `validate:schema` -> `check:images` -> `check:seo` -> `check:a11y` -> `validate:links`

### Pre-commit Hook

A git pre-commit hook runs `npm run validate` automatically. If any check fails, the commit is blocked.

### CI/CD (GitHub Actions)

The `quality.yml` workflow runs the same checks on push/PR to main. All SEO/schema/a11y checks exit non-zero on any violation.

## Content Collections

| Collection | Path | Schema notes |
|---|---|---|
| services | `src/content/services/` | Foundation repair services (CT + MA) |
| concrete-repair | `src/content/concrete-repair/` | Concrete repair (MA only) |
| locations | `src/content/locations/{state}/` | City pages, nested by state |
| blog | `src/content/blog/` | Blog posts with categories |
| foundation-types | `src/content/foundation-types/` | Educational content |
| partners | `src/content/partners/` | Partner type pages |
| team | `src/content/team/` | Team profiles |
| faqs | `src/content/faqs/` | FAQ collections |
| resources | `src/content/resources/` | Additional resources |

## File Conventions

- Page templates: `src/pages/`
- Layouts: `src/layouts/Layout.astro`
- Components: `src/components/`
- Validation scripts: `scripts/`
- All scripts are ES modules (project uses `"type": "module"`)

## Visual Verification

A Playwright-based screenshot tool exists for verifying CSS, layout, and image changes.

### When to Use

- Any CSS or layout change (spacing, sizing, positioning, colors)
- Image-related changes (cropping, object-fit, new images)
- Component visual changes
- **Always verify visually before declaring a visual task complete**

### How to Run

```bash
node scripts/screenshot.js /                     # Full homepage (viewport only)
node scripts/screenshot.js / "#about"             # Specific section by CSS selector
node scripts/screenshot.js /services --width=375  # Mobile width
node scripts/screenshot.js / --full-page           # Full page screenshot
```

Output: `.claude/screenshots/screenshot.png` — read this file to verify the result.

### Requirements

- Requires Playwright chromium: `npx playwright install chromium` (one-time setup)
- Requires a build (`dist/` directory); the script will build automatically if needed
- NOT part of the validation pipeline or CI — purely a dev/verification tool
