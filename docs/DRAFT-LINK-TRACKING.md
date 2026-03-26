# Draft Blog Post Link Tracking

Links to draft blog posts from published content cause 404s in Google Search Console. This doc tracks every link removed and where to restore it when the draft is published.

## How to use this doc

1. **When removing a link to a draft:** Add an entry below with the source file, line context, draft slug, and date removed.
2. **When publishing a draft:** Search this doc for the slug. Restore all listed links, then delete those entries.
3. **Prevention:** `npm run validate:links` catches these. The `validate-draft-links.js` script specifically flags published→draft cross-links.

---

## Removed Links (restore when draft is published)

### `carbon-fiber-straps-bowing-walls` (removed 2026-03-26)

| Source file | What was linked | Replacement text |
|---|---|---|
| `blog/carbon-fiber-staples-vs-stitches.md` (body) | `[carbon fiber straps for bowing walls](/blog/carbon-fiber-straps-bowing-walls)` | "carbon fiber straps provide full-wall stabilization — ask us about the best approach for your situation" |
| `services/carbon-fiber-stitches.md` (line ~44) | `[carbon fiber straps for bowing walls](/blog/carbon-fiber-straps-bowing-walls)` | "full carbon fiber straps" (plain text) |
| `services/carbon-fiber-stitches.md` (line ~137) | `[carbon fiber straps for bowing walls](/blog/carbon-fiber-straps-bowing-walls)` | "Full carbon fiber straps" (plain text) |
| `blog/bowing-basement-walls-causes-repair.md` (relatedPosts) | `"carbon-fiber-straps-bowing-walls"` | removed from array |
| `blog/horizontal-foundation-cracks.md` (relatedPosts) | `"carbon-fiber-straps-bowing-walls"` | removed from array |
| `blog/carbon-fiber-staples-vs-stitches.md` (relatedPosts) | `"carbon-fiber-straps-bowing-walls"` | removed from array |
| `blog/carbon-fiber-foundation-repair-guide.md` (relatedPosts) | `"carbon-fiber-straps-bowing-walls"` | removed from array |

### `basement-humidity-control-guide` (removed 2026-03-26)

| Source file | What was linked | Replacement text |
|---|---|---|
| `blog/sump-pump-vs-crack-injection.md` (line ~143) | `[dehumidifier and moisture management approach](/blog/basement-humidity-control-guide)` | "A dehumidifier and moisture management approach" (plain text) |

---

## Notes

- Draft→draft links (e.g., `hartford-ct-foundation-problems.md` linking to `poured-concrete-foundation-repair.md`) are acceptable since neither is published. They'll resolve when both are published.
- Links inside HTML comments (`<!-- -->`) are not rendered and don't cause 404s. These are left in place intentionally.
