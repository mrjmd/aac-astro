# Remaining Manual Tasks

This document captures tasks that require manual intervention or access to external resources before launch.

## Pre-Launch Critical

### 1. Image Migration (Phase 11 - Manual)

**Status:** Infrastructure ready, images needed

Replace all `picsum.photos` placeholder URLs with real images:

**From Squarespace:**
- [ ] Download all service page images (before/after photos)
- [ ] Download blog post images
- [ ] Download team member photos
- [ ] Download any location-specific images
- [ ] Download company logo and favicon

**Image Processing:**
- [ ] Compress images (TinyPNG, Squoosh, or similar)
- [ ] Convert to WebP format
- [ ] Organize into `src/assets/images/` subdirectories
- [ ] Update content files to reference local images

**Directories ready:**
```
src/assets/images/
├── services/
├── resurfacing/
├── blog/
├── team/
├── locations/
├── foundation-types/
├── partners/
└── hero/
```

### 2. Vercel Deployment Setup

**Status:** Config ready, secrets needed

Add GitHub repository secrets for CI/CD deployment:

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `VERCEL_TOKEN` - Generate at vercel.com/account/tokens
   - `VERCEL_ORG_ID` - Found in Vercel project settings
   - `VERCEL_PROJECT_ID` - Found in Vercel project settings

**Vercel Project Setup:**
1. Create new project at vercel.com
2. Import the GitHub repository
3. Framework preset: Astro
4. Build command: `npm run build`
5. Output directory: `dist`

### 3. Decap CMS / Netlify Identity Setup

**Status:** CMS configured, authentication needed

For blog CMS at `/admin`:

**Option A: Netlify Identity (Recommended for Vercel)**
1. Create Netlify site (can be different from hosting)
2. Enable Identity service
3. Enable Git Gateway
4. Configure GitHub OAuth application
5. Add allowed users

**Option B: GitHub Backend (Alternative)**
Update `public/admin/config.yml`:
```yaml
backend:
  name: github
  repo: mrjmd/aac-astro
  branch: main
```

### 4. DNS Cutover

**Status:** Not started

When ready to launch:
1. Point `attackacrack.com` DNS to Vercel
2. Verify SSL certificate provisioning
3. Test all pages load correctly
4. Submit sitemap to Google Search Console
5. Submit sitemap to Bing Webmaster Tools

---

## Post-Launch Expansion

### 5. City Page Expansion

**Status:** 20 cities complete, 90 remaining

**Phase 5b cities to add:**

**Connecticut (20 more):**
- Fairfield, Westport, Middletown, Bristol, New London, Norwich
- Meriden, Glastonbury, East Hartford, Southington, Vernon
- Torrington, Wallingford, Naugatuck, Groton, Cheshire
- Shelton, Milford, Stratford, Enfield

**Massachusetts (70 more):**
- Metro Boston: Somerville, Brookline, Weymouth, Milton
- North Shore: Salem, Beverly, Gloucester, Peabody, Lynn, Haverhill, Lawrence
- South Shore: Marshfield, Scituate, Hingham, Cohasset, Duxbury
- Central/West: Springfield, Fitchburg, Leominster, Natick, Wellesley
- Cape & Islands: Barnstable, Falmouth, Yarmouth
- ... (see full list in MIGRATION-PLAN.md)

**Suggested pace:** 20 cities per week after launch

### 6. Blog Content Expansion

**Status:** 5 posts complete

**Recommended publishing schedule:** 2-4 posts per month

**High-value topics to add:**
- [ ] "Foundation Repair Cost Guide 2026: CT & MA Pricing" (update existing)
- [ ] "Signs Your Foundation Needs Immediate Attention"
- [ ] "Seasonal Foundation Maintenance Checklist"
- [ ] "How to Choose a Foundation Repair Contractor"
- [ ] City-specific guides for major markets (Boston, Hartford, etc.)

### 7. Google Business Profile Integration

**Status:** Not started

- [ ] Verify business listing for CT location
- [ ] Verify business listing for MA location
- [ ] Update website URLs to new domain
- [ ] Add photos to listings
- [ ] Set up review response workflow

---

## Technical Improvements (Nice to Have)

### 8. Performance Monitoring

- [ ] Set up Google Analytics 4
- [ ] Configure Search Console monitoring
- [ ] Set up uptime monitoring (Vercel, Pingdom, etc.)
- [ ] Configure error tracking (Sentry, etc.)

### 9. A/B Testing Infrastructure

- [ ] Set up conversion tracking for CTAs
- [ ] Consider Vercel Edge Config for experiments
- [ ] Track form submissions and phone clicks

---

## Validation Before Launch

Run these commands to verify site health:

```bash
# Build and run all validations
npm run validate

# Individual checks
npm run build
npm run validate:schema
npm run check:images
npm run check:seo
```

**Expected results:**
- Build: 55+ pages generated
- Schema: No errors (warnings OK)
- Images: No errors (placeholder warnings OK until images replaced)
- SEO: No errors (heading level warnings from nav/footer are OK)

---

## Contact & Support

For questions about this migration:
- Repository: github.com/mrjmd/aac-astro
- Migration plan: docs/MIGRATION-PLAN.md
