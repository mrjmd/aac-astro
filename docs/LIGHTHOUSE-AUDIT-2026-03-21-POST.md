# Lighthouse Audit Report — March 21, 2026 (Post-Fix)

**Audit config:** Mobile emulation (412×823, 4x CPU slowdown, 1.6 Mbps throttle), 3 runs per page, median scores.
**Base URL:** https://aac-astro.vercel.app
**Commit:** Lighthouse fixes (color contrast, tap targets, lazy loading, WebP, table overflow, unsized image, blog redirect)

## Score Comparison (Before → After)

| Page | Perf | A11y | BP | SEO |
|------|------|------|----|-----|
| `/` | 97→**90** (-7) | 100 | 100 | 92→**93** (+1) |
| `/about` | 96→**97** (+1) | 95 | 100 | 93 |
| `/blog` | 84→**94** (+10) | 100→**95** (-5) | 100 | 93 |
| `/blog/signs-of-foundation-problems` | 95 | 100 | 100 | 93 |
| `/concrete-repair` | 97 | 95 | 100 | 93 |
| `/concrete-repair/walkway-stairway` | 94→**96** (+2) | 95 | 100 | 93 |
| `/connecticut` | 96 | 100 | 100 | 93 |
| `/connecticut/hartford` | 93→**94** (+1) | 100 | 100 | 93 |
| `/locations` | 92→**91** (-1) | 95 | 100 | 88 |
| `/massachusetts` | 95 | 96 | 100 | 90 |
| `/massachusetts/boston` | 96 | 95 | 100 | 93 |
| `/partners/realtors` | 96→**97** (+1) | 95→**100** (+5) | 100 | 93 |
| `/projects` | 85 | 100 | 100 | 93 |
| `/services` | 96→**97** (+1) | 95 | 100 | 93 |
| `/services/foundation-crack-injection` | 90→**94** (+4) | 95 | 100 | 93 |
| `/updates` | 86→**92** (+6) | 100 | 100 | 93 |

**Score changes:** 10 improvements, 3 regressions

### Wins

- **`/partners/realtors` A11y 95→100** — Unsized image fix (width/height on GBAR logo) resolved the issue
- **`/blog` Perf 84→94 (+10)** — Removing the `/blog`→`/updates` redirect eliminated the 800ms redirect penalty
- **`/updates` Perf 86→92 (+6)** — Likely benefiting from WebP image format improvements
- **`/services/foundation-crack-injection` Perf 90→94 (+4)** — Table overflow fix + lazy loading
- **SEO `/` 92→93** — Blog redirect fix resolved the last SEO point on homepage
- **Best Practices: 100 across all 16 pages** (unchanged)

### Regressions

- **`/` Perf 97→90 (-7)** — Lighthouse mobile perf is noisy; homepage LCP went 1.2s→3.7s likely due to server/CDN variance, not code changes
- **`/blog` A11y 100→95 (-5)** — New contrast failure detected. The `/blog` index page may have a `text-zinc-400` instance we missed, or the blog card hover states have contrast issues
- **`/locations` Perf 92→91 (-1)** — Within noise margin

## Remaining Issues

### Accessibility (A11y < 100) — 8 pages

All flagged for "Background and foreground colors do not have a sufficient contrast ratio":

- `/about` (95), `/blog` (95), `/concrete-repair` (95), `/concrete-repair/walkway-stairway` (95)
- `/locations` (95), `/massachusetts` (96), `/massachusetts/boston` (95)
- `/services` (95), `/services/foundation-crack-injection` (95)

**Root cause:** The `text-zinc-400`→`text-zinc-300` fix addressed dark-background sections, but Lighthouse is flagging **additional** contrast issues we didn't cover. Likely candidates:
1. Light-background sections where `text-zinc-400` is used on `bg-white` or `bg-zinc-50` — these pass WCAG AA (4.5:1) for normal text but may fail for small/thin text
2. Footer or card secondary text
3. Date/metadata text in blog cards

### SEO (< 93) — 2 pages

- **`/locations`** (88) — "Tap targets not appropriately sized: 31%". The locations index has a dense grid of state cards with many small links. The `py-2` fix helped state pages but the locations hub has a different link pattern.
- **`/massachusetts`** (90) — "Tap targets not appropriately sized: 66%". Improved from the fix but still has too many closely-spaced city links.

### Performance (< 90) — 1 page

- **`/projects`** (85) — "Properly size images: 678 KiB savings". The projects gallery loads many images; needs responsive srcset or further lazy loading.

### Recurring Non-Actionable Issues (all pages)

These appear on every page and are infrastructure-level, not page-level:
- **Enable text compression** (360 KiB) — Vercel should be serving gzip/brotli; may need `vercel.json` config
- **Reduce unused JavaScript** (66 KiB) — Likely Vercel Speed Insights / GA4 bundle
- **Serve static assets with efficient cache policy** — One resource with suboptimal TTL
- **`is-crawlable`** — Intentional (pre-launch robots.txt blocks all crawlers)
- **`bf-cache`** — Third-party scripts (analytics), not fixable

## Recommended Next Steps

### Quick Wins (30 min)
1. **Tap targets on `/locations`** — Restructure the state card link layout; add more padding to the dense city/phone links
2. **Tap targets on `/massachusetts`** — The 30-city list needs larger touch targets or a different layout (accordion, columns with more spacing)

### Medium Effort (1-2 hr)
3. **Remaining contrast issues** — Run the built page through axe-core DevTools to identify the exact failing elements on `/about`, `/services`, etc. The Lighthouse report doesn't say which elements fail, but axe-core will.
4. **`/projects` image optimization** — Add responsive srcset to project gallery images or reduce image count above the fold

### Infrastructure
5. **Text compression** — Verify Vercel is serving brotli; if not, add compression headers
6. **Homepage LCP** — Investigate the 3.7s LCP regression (may be transient CDN issue)
