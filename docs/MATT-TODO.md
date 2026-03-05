# What Matt Needs to Do

*Last updated: March 4, 2026*

Everything the site needs from you before launch, organized by priority. Claude can't do these — they require your access, knowledge, or decision-making.

---

## 1. Photos & Video (Biggest Impact)

The site has 9 placeholder images (picsum.photos URLs) that need real photos before launch. Phone photos are fine — just well-lit, in focus, and horizontal (landscape).

**Image specs:** minimum 800x600px, `.webp` or `.jpg`. Ideal hero size: 1200x800. OG/social: 1200x630 `.jpg`.

### Priority 1: Service Pages — Before/After Pairs (18 photos)

Each service page needs 3 photos: hero, before, and after. Save to `public/images/services/`.

| Service | Files Needed | Shot Description |
|---------|-------------|------------------|
| **Crack Injection** | `injection-hero.jpg` | Wide shot of technician injecting a crack (ports visible, hose connected) |
| | `injection-before.jpg` | Close-up of a leaking/stained foundation crack before repair |
| | `injection-after.jpg` | Same crack after injection — sealed ports, clean wall |
| **Wall Crack Repair** | `wall-crack-hero.jpg` | Wide shot of a wall crack being assessed or repaired |
| | `wall-crack-before.jpg` | Foundation wall with visible crack (ruler/coin for scale is great) |
| | `wall-crack-after.jpg` | Same wall section after repair |
| **Bulkhead Repair** | `bulkhead-hero.jpg` | Exterior bulkhead door area (showing the joint/seam) |
| | `bulkhead-before.jpg` | Leaking bulkhead — water stains, efflorescence, or active leak |
| | `bulkhead-after.jpg` | Sealed bulkhead — clean, dry |
| **Carbon Fiber** | `carbon-fiber-hero.jpg` | Carbon fiber stitches installed across a crack (the X-pattern) |
| | `carbon-fiber-before.jpg` | Structural crack before carbon fiber — ideally showing displacement |
| | `carbon-fiber-after.jpg` | Carbon fiber stitches cured and finished |
| **Sewer/Conduit** | `utility-hero.jpg` | Pipe penetration through foundation wall |
| | `utility-before.jpg` | Leaking pipe penetration — water stains around pipe entry |
| | `utility-after.jpg` | Sealed penetration — urethane visible around pipe |
| **Consultation** | `consultation-hero.jpg` | Technician talking with homeowner in basement, or pointing at a crack |
| | `consultation-before.jpg` | Photo of a phone showing a texted crack photo (the "text us photos" workflow) |
| | `consultation-after.jpg` | Written quote or estimate on AAC letterhead (can blur the numbers) |

### Priority 2: Concrete Repair Pages — MA Only (18 photos)

Save to `public/images/concrete-repair/`.

| Surface | Files Needed | Shot Description |
|---------|-------------|------------------|
| **Driveway** | `driveway-hero.jpg`, `-before.jpg`, `-after.jpg` | Cracked/settled driveway, then repaired |
| **Patio** | `patio-hero.jpg`, `-before.jpg`, `-after.jpg` | Cracked/uneven patio, then repaired |
| **Walkway** | `walkway-hero.jpg`, `-before.jpg`, `-after.jpg` | Cracked walkway, then repaired |
| **Pool Deck** | `pool-deck-hero.jpg`, `-before.jpg`, `-after.jpg` | Damaged pool deck, then repaired |
| **Stairway** | `stairs-hero.jpg`, `-before.jpg`, `-after.jpg` | Crumbling/cracked stairs, then repaired |
| **Garage** | `garage-hero.jpg`, `-before.jpg`, `-after.jpg` | Cracked garage floor, then repaired |

### Priority 3: Standalone Page Images (9 photos)

These are hardcoded in page templates. Currently showing random placeholders.

| Page | File to Create | Shot Description |
|------|---------------|------------------|
| **About** | `public/images/about-story.jpg` | Team photo, or Luc/Justin working on a job together |
| **Services Hub** | `public/images/services-method.jpg` | Action shot of the injection process — diamond saw, port drilling, or resin flowing |
| **CT Hub** | `public/images/ct-hero.jpg` | A CT job site, or CT-recognizable backdrop |
| **MA Hub** | `public/images/ma-hero.jpg` | A MA job site, or MA-recognizable backdrop |
| **RI Hub** | `public/images/ri-hero.jpg` | Job site or recognizable RI location |
| **NH Hub** | `public/images/nh-hero.jpg` | Job site or recognizable NH location |
| **ME Hub** | `public/images/me-hero.jpg` | Job site or recognizable ME location |
| **Concrete Hub** | `public/images/concrete-repair-hero.jpg` | Concrete surface being repaired |
| | `public/images/concrete-repair-benefits.jpg` | Finished repaired concrete (clean, level) |

### Priority 4: Foundation Types (2 photos)

Save to `public/images/foundation-types/`.

| Type | File | Shot Description |
|------|------|------------------|
| **Cinderblock** | `cinderblock-hero.jpg` | Cinderblock/CMU foundation wall — ideally showing typical stair-step crack pattern |
| **Fieldstone** | `fieldstone-hero.jpg` | Fieldstone foundation wall — the rough, old-style New England foundation |

### Priority 5: City Page Photos (optional, great for SEO)

Each city page currently shows a placeholder. If you have photos from jobs in specific cities, name them `public/images/locations/{city-slug}.jpg` (e.g., `framingham.jpg`, `hartford.jpg`). Even 5-10 real photos from your most common cities would be a big improvement.

### Video: Three Quick Phone Clips

Raw phone clips, 10-15 seconds each, horizontal orientation. One job site visit = all three in under 2 minutes.

1. **Diamond saw cutting the groove** — Close-up of the saw blade cutting along a crack
2. **Resin injection** — Close-up of the injection gun connected to a port, resin flowing
3. **Finished repair** — Slow pan along a completed, sealed crack (ports trimmed, clean wall)

These go on YouTube, get embedded on service pages, and posted to GBP.

### Photo/Video Summary

| Category | Count |
|----------|:-----:|
| Service pages (hero + before/after) | 18 |
| Concrete repair pages | 18 |
| Standalone page images | 9 |
| Foundation types | 2 |
| **Total minimum** | **47** |
| City-specific (optional) | 5-80 |
| Video clips | 3 |

---

## 2. Luc's Professional Info

Needed for author schema (E-E-A-T) and the About page. Currently using placeholder data.

- [ ] Luc's certifications and training (any foundation repair certs, manufacturer training, etc.)
- [ ] How long he's been doing foundation repair specifically
- [ ] Professional memberships or associations
- [ ] LinkedIn profile URL (if public)
- [ ] Any awards, press mentions, or speaking engagements
- [ ] Justin La Fontaine's title/role and how long he's been with the company

---

## 3. Testimonial Verification

The site has ~20 customer testimonials. Before launch, confirm:

- [ ] Each testimonial is from a real customer who gave permission to use their quote
- [ ] Names and cities are accurate
- [ ] No testimonials are fabricated or embellished

This is a legal/compliance requirement, not just nice-to-have.

---

## 4. Google Cloud Setup (for Calendar Import + GBP Posting)

Two scripts are ready to go but need your Google Cloud credentials to run.

### Step 1: Google Cloud Project

- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Create a project (or use an existing one)
- [ ] Enable these APIs:
  - Google Calendar API
  - Google Drive API
  - Google Business Profile API (formerly My Business API)

### Step 2: OAuth Credentials

- [ ] In the Cloud Console, go to APIs & Services > Credentials
- [ ] Create OAuth 2.0 Client ID (type: "Desktop app")
- [ ] Download the JSON file
- [ ] Save it to `scripts/.credentials/google-oauth.json` (this folder is gitignored)

### Step 3: Install Dependencies

Run once when ready to use the scripts:
```bash
npm install googleapis @anthropic-ai/sdk --save-dev
```

### Step 4: First Run (Calendar Import)

```bash
node scripts/import-calendar-projects.js --dry-run --limit 5
```
This opens a browser for Google OAuth consent, then shows what it would import. Remove `--dry-run` to create project files.

### Step 5: GBP Posting Setup

- [ ] Get your CT and MA GBP account/location IDs from [business.google.com](https://business.google.com)
- [ ] Edit `scripts/batch-post-gbp.js` — replace the `XXXXXXXXXX` placeholders in `GBP_CONFIG` (lines 36-43)
- [ ] Test with: `node scripts/batch-post-gbp.js --dry-run`

---

## 5. Brand Voice & Marketing Review

### Brand Voice Refresh (Review Required)

The Expert Jester voice guide is in `docs/BRAND-VOICE.md`. It includes before/after copy proposals for every major page. Nothing changes on the site until you approve.

- [ ] Read `docs/BRAND-VOICE.md` — especially the "Proposed Changes Appendix"
- [ ] Approve or mark up homepage hero + CTA copy
- [ ] Approve or mark up about page story + values copy
- [ ] Approve or mark up services hub descriptions
- [ ] Approve or mark up team bios (Luc, Matt, Ed, Justin, Mike)
- [ ] Note any lines that feel off-brand or too casual

### Marketing Plan Review

The full marketing plan is in `docs/MARKETING-PLAN-2026.md`. Key decisions for you:

- [ ] Review social media strategy — are 3x/week posts feasible?
- [ ] Review paid advertising budget zones — agree with 70/30 conversion/awareness split?
- [ ] Review email marketing sequences — do you have an email platform preference?
- [ ] Review geo-targeting zones — agree South Shore is the fortress?
- [ ] Review SORA AI video concept — interested in testing AI video content?

### Blog Content Review (41 Full Articles Written)

All 41 draft blog posts now have complete, publish-ready content (800-1200+ words each). Calendar: `docs/CONTENT-CALENDAR-2026.md`.

- [ ] **Read every draft blog post** — check for accuracy, voice, and anything that feels off (they're in `src/content/blog/`, all with `draft: true`)
- [ ] Flag any articles that need revision before publishing
- [ ] Provide real project details for the case study posts (what-does-foundation-repair-look-like)
- [ ] Source/provide hero images for blog posts (all 73 posts currently have blank `heroImage`)
- [ ] Review content calendar timing — posts are scheduled weekly Apr-Dec 2026

---

## 6. Automated Blog Publishing Setup

Once blog posts are reviewed and approved, set up automatic weekly publishing:

- [ ] Decide publishing mechanism: flip `draft: true` → `false` on reviewed posts (simplest), or add a `status: scheduled` field
- [ ] Set up weekly cron build (GitHub Action or Vercel Cron) to trigger redeploy — posts whose `publishDate` has arrived will appear automatically
- [ ] Claude implements the Astro filtering logic and cron config

---

## 7. Content Decisions (Original)

### Brainstorm Session (15 expertise gaps)

The site crawl identified 15 gaps where real expertise details would strengthen content. Full question list: `docs/BRAINSTORM-AGENDA.md`. Key ones:

- [ ] What specific injection pressure do you use? (we wrote 100 PSI based on old site — confirm?)
- [ ] Copper ports vs plastic — what brand/type do you use?
- [ ] Carbon fiber product specs — manufacturer, tensile strength claims?
- [ ] Any jobs where you found something unexpected or solved an unusual problem? (great for case studies)
- [ ] Insurance: do you ever help homeowners navigate claims? What's your experience with insurance covering repairs?

### Partner Pages

- [ ] Which partners do you want featured? (real estate agents, home inspectors, etc.)
- [ ] Any co-marketing agreements or referral relationships to highlight?

---

## 8. Pre-Launch (When Ready)

These happen at DNS cutover time — don't do them early.

- [ ] Switch `public/robots.txt` from `Disallow: /` to `Allow: /`
- [ ] Remove `is-crawlable: 'off'` from `lighthouserc.cjs`
- [ ] Submit sitemap to Google Search Console
- [ ] Verify both CT and MA locations in Google Business Profile
- [ ] Set up Google Analytics / Vercel Analytics (if not already)
- [ ] DNS cutover to Vercel

---

## What Blocks Launch?

| Category | Items | Blocks Launch? |
|----------|:-----:|:--------------:|
| Photos (must-have: service heroes, about, CT/MA hubs) | ~6 | **Yes** |
| Photos (remaining services, concrete, states) | ~41 | No |
| Luc's info | 6 items | Partially (E-E-A-T) |
| Testimonial verification | 1 review pass | **Yes** |
| Google Cloud setup | 5 steps | No (post-launch) |
| Content decisions | ~10 questions | No |
| Pre-launch steps | 6 steps | **Yes** (at launch time) |
