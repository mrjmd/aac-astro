# Blog Image Audit & AI Prompt Table

Generated 2026-03-16, reorganized 2026-03-19. For each of the 70 blog posts still using project photos as heroes, this table shows whether to keep the current photo or replace it with an AI-generated image, plus the prompt to use.

## Decision Criteria

- **KEEP** = Current project photo is topically relevant (e.g., bulkhead photo on a bulkhead post)
- **REPLACE** = Current project photo is generic/mismatched; AI image will be more relevant

## Feedback Workflow

Each REPLACE table row has **Status** and **Feedback** columns for iterating on images.

### Status values
- *(blank)* — Not yet generated
- `generated` — Image exists, waiting for review
- `approved` — Image is good, skip on future runs
- `redo` — Needs regeneration; put notes in Feedback column

### How to review
1. Run `node scripts/generate-blog-images.js` to generate images
2. Review images in `public/images/blog/` (use Finder, Preview, or VS Code)
3. For each row, set Status to `approved` or `redo`
4. For `redo` rows, add feedback like: "too dark", "remove text labels", "show more of the crack"
5. Run the script again — it regenerates only `redo` entries, appending your feedback to the prompt
6. Repeat until all rows are `approved`

### Reference images
To supply a reference image for a specific post, place the image at:
```
media/blog-refs/{slug}.jpg   (or .png, .webp)
```
The script detects reference images automatically and sends them to the API alongside the text prompt. Use this when you want to match a specific style, show "something like this", or provide a real photo to base the composition on.

## Posts Already Updated (Phase 3)

11 posts now use real/relevant images from the old Squarespace site:
- NAR NXT 2024 (real conference photos)
- ASHI New England 2024 (real booth photo)
- Wilmington Bulkhead (real job photos)
- Shrewsbury Flooded Basement (real job photos)
- Framingham Basement Leak (real job photos)
- Vertical vs Horizontal Cracks (real photos pulled from old Squarespace site)
- Foundation Repair Cost Guide (AI illustrations from old site)
- Crumbling Foundations MA/CT (real maps + damage photos)
- 10 Essential Tips (AI illustration from old site)
- How to Check Foundation (AI illustration from old site)
- Winter Maintenance Checklist (AI illustration from old site)

---

## KEEP — Project Photo Matches Topic (17 posts)

These posts use project photos that are topically relevant. No change needed.

| Blog Post | Current Image | Reason to Keep |
|---|---|---|
| bulkhead-leaking-causes-and-fixes | kingston-bulkhead-repair-2025-06-before.jpg | Real bulkhead repair photo matches bulkhead article |
| bulkhead-repair-cost-guide-2026 | groveland-bulkhead-repair-2025-08-after.jpg | Real bulkhead after-repair photo |
| bulkhead-sealant-vs-gaskets | kingston-bulkhead-repair-2025-06-before.jpg | Real leaking bulkhead gasket photo |
| carbon-fiber-foundation-repair-guide | weymouth-carbon-fiber-2025-08-before.jpg | Real carbon fiber job photo |
| carbon-fiber-staples-vs-stitches | weymouth-carbon-fiber-2025-08-before.jpg | Real carbon fiber job photo |
| lally-columns-guide | weymouth-carbon-fiber-2025-08-before.jpg | Shows basement structural support |
| ~~horizontal-foundation-cracks~~ | ~~rockland-wall-crack-repair-2025-02-after.jpg~~ | Moved to REPLACE — hero is a vertical crack, not horizontal |
| what-does-foundation-repair-look-like | abington-crack-injection-2025-03-before.jpg | Article is literally about what repair looks like |
| weymouth-foundation-repair-south-shore | weymouth-crack-injection-2025-07-2-before.jpg | Correct city match |
| ~~signs-of-foundation-problems~~ | ~~quincy-crack-injection-2025-08-2-before.jpg~~ | Moved to REPLACE — Matt wants new image |
| ~~how-we-diagnose-foundation-problems~~ | ~~milton-crack-injection-2026-03-before.jpg~~ | Moved to REPLACE — needs photo-based assessment image |
| water-in-basement-after-rain | hingham-crack-injection-2025-01-before.jpg | Shows water intrusion through crack |
| basement-floor-cracks-leaking | kingston-crack-injection-2026-01-before.jpg | Shows leaking floor crack |
| basement-floor-crack-repair-guide | kingston-crack-injection-2026-01-before.jpg | Shows floor crack before repair |
| flex-seal-basement-cracks | hingham-crack-injection-2025-01-before.jpg | Shows basement crack with water |
| ~~does-insurance-cover-foundation-repair~~ | ~~boston-crack-injection-2025-10-after.jpg~~ | Moved to REPLACE — current image doesn't work for insurance topic |
| poured-concrete-foundation-repair | quincy-crack-injection-2025-08-after.jpg | Shows poured concrete foundation |

---

## REPLACE — Published Posts, Need Images Now (16 posts)

These posts are already live and using generic/mismatched project photos. **Prioritize these for AI image generation before launch.**

**Prompt guidelines:**
- Style: Photorealistic, high-resolution, professional photography look
- Aspect: 16:9 landscape for hero use
- Lighting: Natural or well-lit interior/exterior
- No text overlays, watermarks, or logos

| # | Blog Post Slug | File Name | AI Image Prompt | Status | Feedback |
|---|---|---|---|---|---|
| 1 | diy-vs-professional-foundation-repair | diy-vs-pro-foundation-crack-repair.jpg | Photorealistic split image: one side showing a homeowner attempting DIY crack repair with hardware store products including plastic ports and handheld injection gun, the other side showing a professional with proper injection equipment and a finished clean repair. 16:9 landscape. | redo | Please use the reference image for what a finished professional job should look like. You can also find reference shots of what our employees, logo, and the branded shirts and hoodies that they wear look like, so you can put those under the professional shot. |
| 2 | basement-waterproofing-vs-foundation-repair | waterproofing-vs-crack-injection-basement.jpg | Photorealistic split image showing two panels: on the left, an excavated exterior basement wall with a waterproofing membrane section. On the right panel, a crack injection repair on an interior concrete basement wall, contrasting the two different approaches side by side. 16:9 landscape. | redo | There are now reference images to both what a waterproof membrane looks like and what a completed crack repair looks like. Let's use those reference shots to generate this side-by-side comparison. |
| 3 | ice-dam-foundation-damage | ice-dam-roof-water-foundation-damage.jpg | Photorealistic image of a New England home with visible ice dams on the roof edge, with water dripping down and pooling near the foundation, snow-covered winter scene. 16:9 landscape. | approved | the visible foundation should be poured concrete all the way around the home, it is currently shifting to fieldstone for part of it. |
| 4 | emergency-foundation-repair-what-to-do | basement-flooding-foundation-crack.jpg | Photorealistic image of water actively flowing into a basement through a foundation crack, dramatic lighting, showing the urgency of an emergency situation. 16:9 landscape. | approved | |
| 5 | spring-thaw-foundation-prep | spring-thaw-snowmelt-near-foundation.jpg | Photorealistic image of a New England home in early spring with melting snow, water running toward the foundation, showing the critical spring thaw period. 16:9 landscape. | approved | |
| 6 | cinderblock-foundation-repair-guide | cinderblock-cmu-wall-stairstep-crack.jpg | Photorealistic image of a concrete block (CMU) foundation wall in a basement showing typical block pattern, mortar joints, and a stair-step crack along the mortar joints (no cracks through the blocks themselves). 16:9 landscape. | redo | I've added a reference image of a stair-step CMU crack, this it needs to look like an actual thin stair-step crack that follows the mortar joints of the CMU. |
| 7 | fieldstone-foundation-repair-guide | fieldstone-foundation-wall-deterioration.jpg | Photorealistic image of a fieldstone foundation wall in a historic New England basement, showing irregular stones set in mortar, some deterioration and moisture. 16:9 landscape. | approved | |
| 8 | driveway-crack-repair-guide | cracked-concrete-driveway-repair.jpg | Photorealistic image of a concrete driveway with a prominent crack, homeowner or repair professional examining it, suburban New England home in background. 16:9 landscape. | approved | |
| 9 | foundation-settling-when-to-worry | foundation-settling-sloping-floor-gap.jpg | Photorealistic image of a home interior showing subtle signs of foundation settling: a slightly sloping floor visible from a low angle, a small gap between wall and floor. 16:9 landscape. | approved | |
| 10 | pool-deck-crack-repair-guide | cracked-concrete-pool-deck.jpg | Photorealistic image of a concrete pool deck with cracks around an in-ground pool, New England backyard setting, showing typical freeze-thaw damage patterns. 16:9 landscape. | approved | |
| 11 | foundation-repair-seasonal-guide | new-england-home-seasonal-foundation-stress.jpg | Photorealistic image showing a New England home across seasons — perhaps a four-panel or single image showing the transition from fall to winter, emphasizing seasonal foundation stress. 16:9 landscape. | approved | |
| 12 | cement-vs-concrete-homeowners-guide | cement-powder-vs-concrete-mix-comparison.jpg | Photorealistic educational image showing cement powder, concrete mix, and a finished concrete foundation side by side, clear visual comparison of the materials. 16:9 landscape. | approved | |
| 13 | bowing-basement-walls-causes-repair | bowing-basement-wall-horizontal-crack.jpg | Photorealistic image of a basement wall visibly bowing inward, with a horizontal crack and slight displacement visible, showing the seriousness of lateral pressure damage. 16:9 landscape. | approved | |
| 14 | foundation-repair-vs-replacement | foundation-wall-crack-vs-severe-damage.jpg | Photorealistic image showing a foundation wall with a single vertical crack on one side (repairable) contrasted with a  deteriorated wall section with numerous cracks on the other side (replacement candidate). 16:9 landscape. | redo | Single vertical crack on one side, numerous cracks and spalling on the other. |
| 15 | foundation-repair-warranty-guide | technician-handing-warranty-homeowner.jpg | Photorealistic image of a professional foundation repair technician from Attack A Crack handing a warranty document to a satisfied homeowner in their basement, completed repair visible behind them. 16:9 landscape. | redo | Let's use the reference images of what our completed jobs look like to be the finished repair in the background of the shot. |
| 16 | how-long-does-foundation-repair-take | foundation-crack-injection-pro-at-work.jpg | Photorealistic image of a foundation repair pro at work in a basement, injection equipment set up, ports installed on a wall crack, showing the active repair process. 16:9 landscape. | redo | Look through the media directory in the from Ed, from Matt, or from Rob images, and you'll get lots of examples of what the crew working on a crack actually looks like. You've also got the blog refs directory that shows what our employees actually look like. It'd be great to make this more realistic, one pro working on the crack with injection gun going into copper port. |
| 17 | does-insurance-cover-foundation-repair | insurance-documents-foundation-repair.jpg | Photorealistic image of a homeowner reviewing insurance documents at a kitchen table with a laptop, concerned expression, foundation repair invoice visible. 16:9 landscape. | approved | |
| 18 | signs-of-foundation-problems | basement-foundation-warning-signs.jpg | Photorealistic image of a New England basement showing multiple warning signs: a visible crack in the foundation wall, slight water staining, uneven floor. Well-lit, homeowner perspective. 16:9 landscape. | approved | |
| 19 | horizontal-foundation-cracks | horizontal-crack-bowing-wall.jpg | Photorealistic image of a horizontal crack running along a poured concrete foundation wall in a basement, showing the crack at mid-height with slight inward bowing visible. 16:9 landscape. | approved | |
| 20 | how-we-diagnose-foundation-problems | homeowner-texting-foundation-crack-photo.jpg | Photorealistic image of a homeowner taking a close-up photo of a foundation crack with their smartphone, texting it for a professional assessment. Well-lit basement. 16:9 landscape. | approved | Can we get the weird lightning coming out of the phone onto the crack out of there? |

---

## REPLACE — Not Yet Published, Can Be Done Post-Launch (37 posts)

These posts have future publish dates and are not yet live. Images can be generated after launch, sorted by publish date.

| # | Blog Post Slug | Publish Date | File Name | AI Image Prompt | Status | Feedback |
|---|---|---|---|---|---|---|
| 1 | spring-foundation-inspection-walkthrough | 2026-03-24 | spring-foundation-inspection-exterior.jpg | Photorealistic image of a homeowner inspecting the exterior perimeter of their home in early spring, checking grading and drainage near the foundation, melting snow visible. 16:9 landscape. | | |
| 2 | basement-humidity-control-guide | 2026-04-07 | basement-dehumidifier-humidity-control.jpg | Photorealistic image of a basement with a dehumidifier running, hygrometer showing humidity reading, concrete walls with slight condensation, well-lit modern basement. 16:9 landscape. | | |
| 3 | foundation-repair-during-home-purchase | 2026-04-14 | home-inspector-basement-foundation-walkthrough.jpg | Photorealistic image of a couple and a home inspector examining a basement foundation during a home purchase walkthrough, inspector pointing at the wall, flashlight in hand. 16:9 landscape. | | |
| 4 | crawl-space-foundation-problems | 2026-04-21 | damp-crawl-space-stone-foundation.jpg | Photorealistic image of a crawl space under a New England home showing stone/concrete foundation walls, dirt floor, moisture on surfaces, low ceiling, dim lighting with a flashlight beam. 16:9 landscape. | | |
| 5 | basement-waterproofing-cost-guide | 2026-04-28 | waterproofed-basement-drainage-sump-pump.jpg | Photorealistic image of a clean, professionally waterproofed basement showing sealed walls, interior drainage channel along the floor-wall joint, and sump pump basin. 16:9 landscape. | | |
| 6 | south-shore-foundation-problems | 2026-05-05 | south-shore-ma-neighborhood-foundations.jpg | Photorealistic aerial or wide-angle view of a typical South Shore Massachusetts neighborhood showing colonial and ranch homes, focusing on the relationship between terrain, water table, and homes. 16:9 landscape. | | |
| 7 | sump-pump-vs-crack-injection | 2026-05-12 | sump-pump-vs-crack-injection-ports.jpg | Photorealistic split-concept image showing a sump pump pit with pump installed on one side and crack injection ports on a foundation wall on the other side, clean basement setting. 16:9 landscape. | | |
| 8 | foundation-repair-home-sellers | 2026-05-19 | home-seller-reviewing-foundation-report.jpg | Photorealistic image of a real estate agent and homeowner reviewing documents at a kitchen table with a visible foundation inspection report, professional setting, home sale context. 16:9 landscape. | | |
| 9 | quincy-foundation-repair-coastal | 2026-05-26 | coastal-home-foundation-salt-moisture.jpg | Photorealistic image of a New England coastal home's stone/concrete foundation with visible moisture and salt deposits on the exterior walls, ocean visible in background, showing how proximity to water affects foundations. 16:9 landscape. | | |
| 10 | how-to-choose-foundation-repair-contractor | 2026-06-02 | foundation-contractor-greeting-homeowner.jpg | Photorealistic image of a foundation repair professional in branded uniform greeting a homeowner at their front door, professional truck visible in the driveway, trustworthy and approachable. 16:9 landscape. | | |
| 11 | musty-smell-basement-causes-solutions | 2026-06-02 | damp-basement-moisture-musty-smell.jpg | Photorealistic image of a damp basement corner with visible moisture on the concrete walls, slight condensation, maybe a dehumidifier nearby, moody atmospheric lighting suggesting dampness. 16:9 landscape. | | |
| 12 | stone-foundation-repair-guide | 2026-06-09 | old-fieldstone-foundation-wall-mortar.jpg | Photorealistic image of an old New England fieldstone foundation wall in a historic home's basement, showing the irregular stones, deteriorated mortar, and characteristic appearance. 16:9 landscape. | | |
| 13 | hartford-ct-foundation-problems | 2026-06-23 | hartford-ct-home-concrete-foundation.jpg | Photorealistic image of a Connecticut River Valley home's foundation, showing typical Hartford-area ranch or colonial architecture with concrete foundation visible at grade level. 16:9 landscape. | | |
| 14 | massachusetts-concrete-repair-guide | 2026-06-30 | massachusetts-concrete-damage-driveway-patio.jpg | Photorealistic image showing multiple concrete surfaces needing repair: a driveway with cracks, a patio section with spalling, wide angle shot of a Massachusetts suburban home exterior. 16:9 landscape. | | |
| 15 | efflorescence-white-powder-basement-walls | 2026-07-07 | efflorescence-white-mineral-basement-wall.jpg | Photorealistic close-up of a concrete basement wall showing white crystalline efflorescence deposits, with clear detail of the powdery mineral buildup pattern. 16:9 landscape. | | |
| 16 | foundation-repair-cost-quincy-ma | 2026-07-07 | quincy-ma-neighborhood-granite-foundations.jpg | Photorealistic image of a Quincy, Massachusetts neighborhood showing typical South Shore homes with granite curbs and concrete foundations, suburban coastal New England setting. 16:9 landscape. | | |
| 17 | patio-crack-repair-guide | 2026-07-14 | cracked-concrete-patio-settling.jpg | Photorealistic image of a concrete patio with visible cracks and settling, outdoor furniture partially visible, New England backyard setting with mature trees. 16:9 landscape. | | |
| 18 | foundation-repair-for-realtors | 2026-07-21 | realtor-showing-foundation-inspection-report.jpg | Photorealistic image of a realtor showing a home inspection report to clients at a property showing, professional setting, the basement or foundation area visible in background. 16:9 landscape. | | |
| 19 | prevent-basement-flooding-new-england | 2026-07-28 | dry-protected-basement-sump-pump.jpg | Photorealistic image of a clean, dry basement with a sump pump, sealed floor-wall joint, and dehumidifier — showing a well-protected basement in New England. 16:9 landscape. | | |
| 20 | concrete-stair-repair-cost-guide | 2026-08-04 | cracked-concrete-stairs-frost-damage.jpg | Photorealistic image of cracked and deteriorating concrete exterior stairs leading to a New England home entrance, showing spalling and frost damage typical of the region. 16:9 landscape. | | |
| 21 | new-england-foundation-types-visual-guide | 2026-08-11 | foundation-types-poured-block-stone-brick.jpg | Photorealistic cross-section illustration showing different foundation types common in New England: poured concrete, concrete block, fieldstone, and brick, arranged side by side for comparison. 16:9 landscape. | | |
| 22 | french-drain-vs-crack-injection | 2026-08-18 | french-drain-vs-injection-ports-crosssection.jpg | Photorealistic image showing a cross-section concept: an exterior French drain trench along a foundation wall on one side, and interior crack injection ports on the wall on the other. 16:9 landscape. | | |
| 23 | garage-floor-crack-repair | 2026-08-25 | cracked-garage-floor-concrete.jpg | Photorealistic image of a concrete garage floor with visible cracks running through it, a car partially visible, typical New England residential garage setting. 16:9 landscape. | | |
| 24 | braintree-foundation-issues-south-shore | 2026-09-01 | braintree-ma-colonial-home-foundation.jpg | Photorealistic image of a typical South Shore Massachusetts split-level or colonial home exterior, showing the foundation line where it meets the soil, suburban neighborhood setting. 16:9 landscape. | | |
| 25 | brick-foundation-repair-guide | 2026-09-08 | old-brick-foundation-mortar-stairstep-crack.jpg | Photorealistic image of an old New England brick foundation wall showing deteriorated mortar joints and stair-step cracking pattern, historic basement setting with stone floor. 16:9 landscape. | | |
| 26 | summer-foundation-maintenance-guide | 2026-09-22 | summer-foundation-drainage-grading-check.jpg | Photorealistic image of a homeowner checking their home's foundation drainage and grading on a hot summer day, garden hose testing drainage, dry cracked soil near foundation. 16:9 landscape. | | |
| 27 | fall-foundation-inspection-checklist | 2026-09-29 | fall-foundation-inspection-foliage.jpg | Photorealistic image of a homeowner walking along the exterior of their New England colonial home in autumn, examining the foundation base where it meets the ground, fall foliage in the background. 16:9 landscape. | | |
| 28 | foundation-crack-repair-before-winter | 2026-10-06 | foundation-crack-autumn-pre-winter-repair.jpg | Photorealistic image of a concrete foundation wall with a visible vertical crack, autumn leaves on the ground and bare trees in the background, late fall New England setting, showing urgency of pre-winter repair. 16:9 landscape. | | |
| 29 | basement-waterproofing-before-freeze | 2026-10-13 | basement-wall-waterproofing-sealant-tools.jpg | Photorealistic image of a basement wall being prepared for waterproofing, with sealant materials and tools visible, late autumn light coming through a small basement window. 16:9 landscape. | | |
| 30 | providence-ri-foundation-challenges | 2026-10-20 | providence-ri-historic-stone-brick-homes.jpg | Photorealistic image of a historic Providence, Rhode Island neighborhood showing older multi-story homes with stone/brick foundations, characteristic New England urban architecture. 16:9 landscape. | | |
| 31 | selling-house-foundation-issues-ma | 2026-10-27 | home-sale-basement-foundation-inspection.jpg | Photorealistic image of a home inspector and homeowner examining a basement foundation wall during a home sale inspection, clipboard in hand, flashlight illuminating a small crack, professional and reassuring tone. 16:9 landscape. | | |
| 32 | nashua-nh-foundation-repair | 2026-11-10 | nashua-nh-granite-foundation-frost-heave.jpg | Photorealistic image of a New Hampshire home in winter/spring showing granite foundation typical of the region, snow on the ground, frost heave effects visible near the foundation. 16:9 landscape. | | |
| 33 | thanksgiving-basement-check | 2026-11-24 | homeowner-flashlight-basement-inspection.jpg | Photorealistic image of a homeowner with a flashlight inspecting their basement foundation during the holiday season, warm lighting from upstairs visible, casual home inspection scene. 16:9 landscape. | | |
| 34 | concrete-driveway-repair-cost-massachusetts | 2026-12-01 | cracked-driveway-freeze-thaw-massachusetts.jpg | Photorealistic image of a cracked concrete driveway in front of a Massachusetts home, showing typical New England freeze-thaw damage with heaving and spalling. 16:9 landscape. | | |
| 35 | portland-me-foundation-repair | 2026-12-08 | portland-maine-granite-foundation-coastal.jpg | Photorealistic image of a historic Portland, Maine home exterior showing its granite/stone foundation, coastal New England architecture, harbor or ocean glimpse in background. 16:9 landscape. | | |
| 36 | year-end-foundation-maintenance | 2026-12-15 | winter-home-foundation-prep-snow.jpg | Photorealistic image of a New England home exterior in late December/early January, showing winter preparation: cleared gutters, proper grading, foundation vents closed, light snow. 16:9 landscape. | | |
| 37 | foundation-repair-myths | 2026-12-22 | homeowner-confused-foundation-advice.jpg | Photorealistic image of a homeowner looking skeptically at their phone/laptop while sitting in their basement near a foundation wall, expression suggesting confusion about conflicting advice. 16:9 landscape. | | |

---

## Implementation Notes

### AI Image Generation Settings
- **Style**: Photorealistic, professional photography quality
- **Resolution**: At least 2048px wide (will be resized to 1400w max)
- **Aspect ratio**: 16:9 landscape
- **Format**: Save as JPG, then process through our image pipeline
- **File naming**: Use the descriptive name from the File Name column (in `public/images/blog/`)

### Processing Pipeline
After generating each image:
```bash
# Place JPG in public/images/blog/
# Run optimize script to generate WebP variants
npm run optimize:images
```

### Frontmatter Update Pattern
```yaml
heroImage: "/images/blog/{file-name-from-table}.jpg"
heroImageAlt: "Descriptive alt text matching the image content"
```

### IPTC Metadata (Google 2026 Guidance)
All AI-generated images should include IPTC metadata:
- `DigitalSourceType`: `trainedAlgorithmicMedia`
- `Credit`: "AI-generated illustration"

Use ExifTool to add metadata before processing:
```bash
exiftool -IPTC:DigitalSourceType="trainedAlgorithmicMedia" -IPTC:Credit="AI-generated illustration" image.jpg
```
