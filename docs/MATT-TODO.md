# What Matt Needs to Do

*Last updated: March 4, 2026*

Everything the site needs from you before launch, organized by priority. Claude can't do these — they require your access, knowledge, or decision-making.

---

## 1. Photos (Biggest Impact)

The site currently has 9 placeholder images (picsum.photos URLs that will look terrible in production). Full shot list is in `docs/ASSET-REQUEST.md`, but here's the priority order:

### Must-Have (blocks launch)

| What | Where it goes | File to create |
|------|--------------|----------------|
| Technician injecting a crack | Crack injection service page | `public/images/services/injection-hero.jpg` |
| Before/after crack injection pair | Crack injection service page | `injection-before.jpg`, `injection-after.jpg` |
| Carbon fiber stitches installed | Carbon fiber service page | `public/images/services/carbon-fiber-hero.jpg` |
| Team/job site photo | About page | `public/images/about-story.jpg` |
| CT job site or recognizable CT location | CT hub page | `public/images/ct-hero.jpg` |
| MA job site or recognizable MA location | MA hub page | `public/images/ma-hero.jpg` |

### Nice-to-Have (improves SEO, not blocking)

| What | Where |
|------|-------|
| Before/after pairs for each service (18 total) | Service pages |
| Concrete repair photos (18 total) | Concrete repair subpages |
| RI, NH, ME hub photos | State hub pages |
| City-specific job photos | City pages (80 pages, any real photos help) |
| Foundation type photos (cinderblock, fieldstone) | Foundation type pages |

### Quick Wins

- **3 phone video clips** (10-15 sec each, horizontal): diamond saw cutting, resin injection, finished repair. One job site visit = all three.
- **Any recent job photos** can be imported as project case studies via the calendar import script (see #4 below).

Full detailed shot list with exact filenames and descriptions: `docs/ASSET-REQUEST.md`

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

The site has ~20 customer testimonials. Before launch, you need to confirm:

- [ ] Each testimonial is from a real customer who gave permission to use their quote
- [ ] Names and cities are accurate
- [ ] No testimonials are fabricated or embellished

This is a legal/compliance requirement, not just nice-to-have.

---

## 4. Google Cloud Setup (for Calendar Import + GBP Posting)

Two scripts are ready to go but need your Google Cloud credentials to actually run.

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
This will open a browser for Google OAuth consent, then show what it would import. Remove `--dry-run` to actually create project files.

### Step 5: GBP Posting Setup

- [ ] Get your CT and MA GBP account/location IDs from [business.google.com](https://business.google.com)
- [ ] Edit `scripts/batch-post-gbp.js` — replace the `XXXXXXXXXX` placeholders in `GBP_CONFIG` (lines 36-43)
- [ ] Test with: `node scripts/batch-post-gbp.js --dry-run`

---

## 5. Content Decisions

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

## 6. Pre-Launch (When Ready)

These happen at DNS cutover time — don't do them early.

- [ ] Switch `public/robots.txt` from `Disallow: /` to `Allow: /`
- [ ] Remove `is-crawlable: 'off'` from `lighthouserc.cjs`
- [ ] Submit sitemap to Google Search Console
- [ ] Verify both CT and MA locations in Google Business Profile
- [ ] Set up Google Analytics / Vercel Analytics (if not already)
- [ ] DNS cutover to Vercel

---

## Summary

| Category | Items | Blocks Launch? |
|----------|:-----:|:--------------:|
| Photos (must-have) | ~6 | Yes |
| Photos (nice-to-have) | ~40 | No |
| Luc's info | 6 items | Partially (E-E-A-T) |
| Testimonial verification | 1 review pass | Yes |
| Google Cloud setup | 5 steps | No (post-launch feature) |
| Content decisions | ~10 questions | No |
| Pre-launch steps | 6 steps | Yes (at launch time) |
