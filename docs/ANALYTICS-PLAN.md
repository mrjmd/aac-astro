# Analytics & Conversion Tracking Plan

> **Status:** Planning complete, not yet implemented
> **Created:** March 22, 2026
> **Context:** Site launched March 21, 2026 at www.attackacrack.com

## Why

Google Ads are running for both the CT and MA branches but there is **no conversion tracking on the website**. We're spending blind. Meanwhile, the site's primary conversion actions (phone calls and text messages to two different branch numbers) are completely unmeasured. We need to know: which pages drive leads, which ad campaigns generate actual calls, and whether our content investment (80 city pages, 40 blog posts) is paying off.

## Current State

| Tracking | Status | Notes |
|----------|--------|-------|
| Google Analytics 4 | Pageviews only | No custom events, no conversions defined |
| Vercel Speed Insights | Active | Core Web Vitals auto-tracked |
| Vercel Analytics | Active | Page views, no custom events |
| Google Ads (CT account) | Running, no conversion tag | Spending blind |
| Google Ads (MA account) | Running, no conversion tag | Spending blind |
| Phone call tracking | None | Regular numbers shown directly |
| Text message tracking | None | `sms:` links untracked |
| Partner referral tracking | Working | `ref` param → Pipedrive |
| UTM parameters | None (except partner `ref`) | No campaign attribution |
| Google Search Console | Verified | Sitemap submitted, not linked to GA4 |
| SEO meta/schema/OG | Comprehensive | All pages properly tagged |

## The Three Questions This Plan Answers

1. **Are my Google Ads making money or losing money?** (Phase 1)
2. **Which content pages actually generate phone calls?** (Phase 2)
3. **Should I invest in more city pages, more blog posts, or more ad spend?** (Phase 3)

---

## Two Branches, Two Numbers, Independent Tracking

The site serves two branches with separate phone numbers for calling and texting:
- **Connecticut:** 860-573-8760
- **Massachusetts:** 617-668-1677

Every analytics event must capture which branch number was clicked. This enables:
- Per-branch lead counting (how many CT calls vs MA calls from the website?)
- Per-branch Google Ads ROI (CT ad spend vs CT conversions, MA ad spend vs MA conversions)
- Per-branch content ROI (do CT city pages drive CT calls? Do MA city pages drive MA calls?)

The two branches also have **separate Google Ads accounts**, each needing its own conversion tracking tag. The gtag.js approach handles this natively with two config lines.

---

## Phase 1: Stop Spending Blind (Week 1) — CRITICAL

### 1.1 Add Google Ads Conversion Tags

Since gtag.js is already loaded for GA4, adding Google Ads tracking is minimal. Add two new environment variables and two additional config lines.

**New env vars:**
- `PUBLIC_GOOGLE_ADS_CT_ID` (format: `AW-XXXXXXXXX`)
- `PUBLIC_GOOGLE_ADS_MA_ID` (format: `AW-YYYYYYYYY`)

**In `src/layouts/Layout.astro`, the existing gtag block (lines 146-152) becomes:**

```javascript
gtag('config', GA4_ID);
gtag('config', GOOGLE_ADS_CT_ID);  // CT branch
gtag('config', GOOGLE_ADS_MA_ID);  // MA branch
```

**Effort:** 30 min code + 30 min in each Google Ads admin
**Impact:** Google Ads can finally optimize bidding for both branches

### 1.2 Add Phone/Text Click Tracking via Event Delegation

A single script in `Layout.astro` catches all `tel:` and `sms:` link clicks across the entire site. No individual component changes needed.

```javascript
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href) return;

  // Determine which branch based on the number
  const CT_NUMBER = '8605738760';
  const MA_NUMBER = '6176681677';

  if (href.startsWith('tel:')) {
    const number = href.replace('tel:', '').replace(/\D/g, '');
    const region = number.includes(CT_NUMBER) ? 'CT' : 'MA';
    const adsId = region === 'CT' ? GOOGLE_ADS_CT_ID : GOOGLE_ADS_MA_ID;

    // GA4 event
    gtag('event', 'phone_call_click', {
      phone_region: region,
      phone_number: number,
      click_location: inferClickLocation(link),
      page_path: window.location.pathname,
      page_type: document.body.dataset.pageType || 'unknown'
    });

    // Google Ads conversion (routed to correct branch account)
    gtag('event', 'conversion', {
      send_to: adsId + '/PHONE_CONVERSION_LABEL',
      value: 500,
      currency: 'USD'
    });

  } else if (href.startsWith('sms:')) {
    const number = href.replace(/sms:[+]?/,'').replace(/\D/g,'');
    const region = number.includes(CT_NUMBER) ? 'CT' : 'MA';
    const adsId = region === 'CT' ? GOOGLE_ADS_CT_ID : GOOGLE_ADS_MA_ID;

    gtag('event', 'text_message_click', {
      phone_region: region,
      phone_number: number,
      page_path: window.location.pathname,
      page_type: document.body.dataset.pageType || 'unknown'
    });

    gtag('event', 'conversion', {
      send_to: adsId + '/TEXT_CONVERSION_LABEL',
      value: 500,
      currency: 'USD'
    });
  }
});

function inferClickLocation(link) {
  if (link.closest('nav')) return 'navbar';
  if (link.closest('footer')) return 'footer';
  if (link.closest('[data-modal]')) return 'modal';
  if (link.closest('[data-hero]')) return 'hero';
  return 'inline';
}
```

This single script covers all current and future tel:/sms: links. No changes to Navbar, Footer, LocationModal, or city page templates.

**Effort:** 1-2 hours
**Impact:** Can finally count leads from the website, per branch

### 1.3 Define Conversion Actions in Google Ads

In each Google Ads account (CT and MA), create conversion actions:

| Conversion Action | Category | Value | Count |
|---|---|---|---|
| Phone Call from Website | Phone call lead | $500 | One (per click) |
| Text Message from Website | Submit lead form | $500 | One |

Each conversion action generates a unique conversion label (e.g., `AbCdEf123`) used in the `send_to` parameter above.

### 1.4 Mark Conversions in GA4

In GA4 Admin → Events, mark as conversions:
- `phone_call_click`
- `text_message_click`

### 1.5 Link GA4 to Both Google Ads Accounts

In GA4 Admin → Product links → Google Ads links:
- Link to CT Google Ads account
- Link to MA Google Ads account
- Enable auto-tagging in both Google Ads accounts (appends `gclid` to URLs)

### Files Changed in Phase 1

| File | Change |
|------|--------|
| `src/layouts/Layout.astro` | Add Google Ads config lines + click tracking event delegation script |
| `.env` / `.env.example` | Add `PUBLIC_GOOGLE_ADS_CT_ID`, `PUBLIC_GOOGLE_ADS_MA_ID` |

---

## Phase 2: Attribution Foundation

### Code Changes — DONE (March 24, 2026)

These are all live in the codebase:

- [x] **LocationModal tracking** — `text_photos_modal_open` event fires when the "Text Photos" modal opens (`src/components/LocationModal.astro`)
- [x] **Partner form tracking** — `partner_form_submit` event fires on successful form submission, includes `referrer` and `partner` params (`src/pages/partners/capture.astro`)
- [x] **Page type classification** — `data-page-type` attribute on `<body>` across all 30 page templates. Values: `home`, `city`, `service`, `blog`, `hub`, `about`, `partner`, `project`, `legal`, `other`
- [x] **Phone/text events include page_type** — both `phone_call_click` and `text_message_click` now send `page_type` parameter

### Admin Tasks — Matt's To-Do List

#### 2.1 Create Custom Dimensions in GA4

These tell GA4 to recognize the event parameters already being sent from the site.

1. Go to **GA4** → click the **gear icon** (Admin) bottom-left → **Custom definitions** → **Custom dimensions**
2. Click **"Create custom dimension"**
3. Create three dimensions, one at a time:

| Step | Dimension name | Scope | Event parameter (type exactly) |
|------|---------------|-------|-------------------------------|
| First | Page Type | Event | `page_type` |
| Second | Phone Region | Event | `phone_region` |
| Third | Click Location | Event | `click_location` |

For each:
- Click "Create custom dimension"
- **Dimension name**: e.g., "Page Type"
- **Scope**: select "Event"
- **Event parameter**: type the exact string from the table (`page_type`, not "Page Type" — it's case-sensitive and must match what the code sends)
- **Description**: optional, add if you want
- Click **Save**

Data starts flowing immediately for new events. No backfill for historical events.

#### 2.2 Enable Google Ads Call Forwarding (Paid Traffic Only)

Google provides forwarding numbers for visitors who arrived via Google Ads:
- Visitor clicks ad → lands on site → Google replaces phone number with tracking number
- Call is recorded with duration, answered status
- Calls over 60 seconds count as conversions
- Only applies to Google Ads traffic; organic visitors see the real number

Set up in each Google Ads account:
- Enable "Website call conversions"
- Add the phone snippet (auto-detects and replaces numbers on the page)
- Configure for both CT and MA numbers

#### 2.3 UTM Parameter Templates

**Standard conventions (always lowercase, hyphens not spaces):**

| Channel | utm_source | utm_medium | utm_campaign |
|---------|-----------|-----------|-------------|
| Google Ads Search | google | cpc | {campaign_name} |
| Google Ads Display | google | display | {campaign_name} |
| Facebook Organic | facebook | social | {post_topic} |
| Facebook Ads | facebook | paid_social | {campaign_name} |
| Email Newsletter | newsletter | email | {send_date} |
| Partner Referral | partner | referral | {partner_slug} |
| Google Business Profile | google | gbp | {post_type} |
| Print Flyer / QR Code | flyer | print | {campaign} |

**Google Ads campaign URLs use ValueTrack:**
```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}
```

---

## Phase 3: Content Intelligence — Step-by-Step Walkthrough

### 3.1 Build GA4 Explorations

Explorations are custom dashboards in GA4. They live under the **Explore** tab (left sidebar, looks like a squiggly line icon).

#### Exploration 1: Content ROI — "Which pages drive leads?"

1. Go to **GA4** → **Explore** (left sidebar) → click the **"+"** button → choose **"Free form"**
2. Name it **"Content ROI"** (click the title at the top)
3. In the left panel under **Variables**:
   - **Dimensions**: click the "+" next to Dimensions → search for "Page path and screen class" → check it → click **Import**
   - **Metrics**: click the "+" next to Metrics → search for and import these three: **Sessions**, **Event count**, **Active users**
4. In the middle **Tab Settings** panel:
   - **Rows**: drag "Page path and screen class" into the Rows area
   - **Values**: drag "Event count" into the Values area
5. **Now the key part — filtering to phone_call_click events:**
   - In the left **Variables** panel, click "+" next to **Dimensions** → search for **"Event name"** → import it
   - In **Tab Settings**, find the **Filters** section at the bottom
   - Click "Drop or select dimension or metric" → select **"Event name"**
   - Set the condition to **"exactly matches"** → type **`phone_call_click`**
   - Click **Apply**
6. Now the table shows event counts filtered to only phone call clicks, broken down by page path
7. Sort by Event count (click the column header) to see which pages generate the most calls

**To see text clicks too:** Duplicate the tab (right-click the tab at the top → Duplicate), change the filter to `text_message_click`. Or change the filter to "matches regex" → `phone_call_click|text_message_click` to see both combined.

**To add a "total sessions" column for context:** Add a second tab with no event name filter, showing Sessions by page path. This lets you calculate conversion rate (clicks ÷ sessions) manually, or compare side by side.

**Pro tip:** Once built, click the three dots on the exploration → "Share" to make it visible to other GA4 users on the account.

#### Exploration 2: City Page Performance — "Are city pages worth it?"

1. **Explore** → **"+"** → **"Free form"** → name it **"City Page Performance"**
2. **Dimensions**: import "Page path and screen class" and "Page Type" (your custom dimension — it may take a few hours to appear after creation)
3. **Metrics**: import "Sessions" and "Event count"
4. **Tab Settings**:
   - **Rows**: Page path and screen class
   - **Values**: Sessions, Event count
   - **Filters**: Add two filters:
     - Filter 1: "Page Type" exactly matches `city`
     - Filter 2: "Event name" exactly matches `phone_call_click` (for the event count column)
5. This shows only city pages with their session counts and phone click counts

#### Exploration 3: CT vs MA Branch Performance

1. **Explore** → **"+"** → **"Free form"** → name it **"CT vs MA"**
2. **Dimensions**: import "Phone Region" (your custom dimension)
3. **Metrics**: import "Event count"
4. **Tab Settings**:
   - **Rows**: Phone Region
   - **Values**: Event count
   - **Filters**: "Event name" matches regex `phone_call_click|text_message_click`
5. You'll see two rows: CT and MA, with the total lead clicks for each

#### Exploration 4A: Direct Conversion Funnel — "What % of visitors convert?"

Most conversions happen via direct tel:/sms: links (in blog CTAs, city page hero, sticky CTA on state pages) — NOT through the modal. This funnel captures all conversions.

1. **Explore** → **"+"** → choose **"Funnel exploration"** (not Free form)
2. Name it **"Direct Conversion Funnel"**
3. Click **"Steps"** in the Tab Settings panel, then **pencil icon** to edit steps:
   - **Step 1**: Name: "Page Visit" → Condition: Event name = `session_start`
   - **Step 2**: Name: "Called or Texted" → Condition: Event name matches regex `phone_call_click|text_message_click`
   - Click **Apply**
4. **Breakdown** (optional): drag "Page Type" into the Breakdown area to compare conversion rates by page type (city vs blog vs service vs home)
5. The funnel shows: X% of all visitors converted to a phone call or text

This is the primary conversion funnel — it tells you overall conversion rate and which page types convert best.

#### Exploration 4B: Modal-Assisted Funnel — "Does the modal help or hurt?"

On generic pages (home, services, about, non-geo blog), visitors must go through the location modal to call or text. This funnel specifically tracks that path.

1. **Explore** → **"+"** → choose **"Funnel exploration"**
2. Name it **"Modal-Assisted Funnel"**
3. **Steps**:
   - **Step 1**: Name: "Page Visit" → Condition: Event name = `session_start`
   - **Step 2**: Name: "Opened Modal" → Condition: Event name matches regex `text_photos_modal_open|call_modal_open`
   - **Step 3**: Name: "Called or Texted" → Condition: Event name matches regex `phone_call_click|text_message_click`
   - Click **Apply**
4. **Breakdown**: drag "Page Type" into the Breakdown area

This tells you: of people who opened the modal, what % followed through? If the drop-off between modal open and conversion is high, the modal design might need work. Compare the modal open rate on generic pages (Funnel 4B step 2) vs the direct conversion rate on state pages (Funnel 4A) to see if the modal adds friction.

### 3.2 Link Google Search Console to GA4

This connects your search query data to your conversion data. The payoff: "someone searched 'foundation repair quincy' → landed on /massachusetts/quincy/ → called us."

1. Go to **GA4** → **Admin** (gear icon) → scroll down to **Product links** → **Search Console links**
2. Click **"Link"**
3. Click **"Choose accounts"** → select your Search Console property (`www.attackacrack.com`) → click **Confirm**
4. Click **"Next"** → select your web data stream (should be your only one) → click **Next**
5. Click **"Submit"**

**If you don't see your Search Console property:** Make sure the same Google account has admin access to both GA4 and Search Console. You verified GSC during launch, so this should just work.

Data takes 24-48 hours to start flowing. Once connected, a new **"Search Console"** section appears under GA4 → Reports → Acquisition. You'll see:
- Queries: what people searched
- Google organic search traffic: which pages got clicks from Google
- Combined with your conversion events: which search queries actually led to calls

### 3.3 Google Ads Conversion Tracking

~~**DONE (March 25, 2026).**~~ Conversions are imported from GA4 into Google Ads — no manual conversion labels needed in the code.

**What was set up:**
- In the MA Google Ads account, imported `phone_call_click` and `text_message_click` GA4 events as conversion actions
- "Phone Call from Website" — Phone call lead, $300 default value
- "Text Message from Website" — Submit lead form, $300 default value
- Google Ads attributes conversions only from its own ad clicks (no cross-account contamination)

**For CT Google Ads account:** Same process once the CT account is linked to MCC. Import the same two GA4 events — each account will only see conversions from its own traffic.

### 3.4 Monthly Reporting Template

| Metric | CT Branch | MA Branch | Total |
|--------|-----------|-----------|-------|
| Phone clicks from website | ? | ? | ? |
| Text clicks from website | ? | ? | ? |
| Total leads from website | ? | ? | ? |
| Google Ads spend | $? | $? | $? |
| Cost per lead (Ads) | $? | $? | $? |
| Organic sessions | ? | ? | ? |
| Organic conversion rate | ?% | ?% | ?% |
| Top converting pages | | | |
| Top search queries (GSC) | | | |

---

## Phase 4: Advanced (Month 3+)

### 4.1 Evaluate Call Tracking Service

After 2-3 months of data from Phases 1-3, evaluate whether a dedicated call tracking service (CallRail ~$45-95/mo, WhatConverts ~$30-100/mo) is worth it.

**What a call tracking service adds beyond Google's forwarding:**
- Tracks ALL calls (organic, direct, referral — not just Google Ads)
- Call recordings for quality assessment
- Call duration thresholds (distinguish real leads from hangups)
- Text message tracking with trackable SMS numbers
- Per-page, per-source attribution for every call
- Direct Pipedrive integration

**Decision criteria:** If you're spending $500+/mo on Google Ads, a $50/mo call tracking service pays for itself by identifying which campaigns actually generate qualified calls vs. noise.

### 4.2 Vercel Analytics Custom Events

Add duplicate events via Vercel's `track()` function as a cookie-free backup:
- `phone_click` and `text_click` mirror GA4 events
- Not affected by ad blockers that target Google's scripts
- Provides a second data source for conversion counting

### 4.3 Blog Engagement Tracking

```
Event: blog_read_complete
Parameters:
  post_slug, category, estimated_read_time
```

Use IntersectionObserver on a marker element at the end of blog content.

### 4.4 Google Ads Enhanced Conversions

Improves conversion measurement accuracy by passing hashed user data:
- Partner form submissions can pass hashed email/phone for better matching
- Enable in Google Ads → Goals → Settings → Enhanced Conversions

### 4.5 Remarketing Audiences

Create GA4 audiences for Google Ads remarketing:
- "Visited service page but didn't convert" (show them ads)
- "Visited city page in CT" (target with CT-specific ads)
- "Opened text-photos modal but didn't text" (high intent, didn't complete)

---

## Google Search Console — What to Monitor

### Weekly (15 min)

- **Performance → Search results:** Sort by impressions. Which queries is the site appearing for? Filter by page to see which city pages get impressions.
- **Top pages by clicks:** Which pages drive the most organic traffic?
- **Low CTR, high impressions:** Pages that rank but don't get clicked may need better title tags or meta descriptions.

### Monthly (30 min)

- **Index coverage:** How many pages indexed vs submitted? Watch for:
  - "Discovered — currently not indexed" (especially new city pages)
  - "Crawled — currently not indexed" (may indicate thin content)
- **Core Web Vitals:** Real-user CWV data. Compare with Vercel Speed Insights.
- **Links report:** Who links to you? Internal link structure healthy?
- **Search query growth:** Which queries gained impressions week-over-week?

### During City Page Expansion

As 41 new MA cities and 16 new CT cities are added:
- Monitor index coverage weekly — are new pages getting indexed?
- Watch for cannibalization: two city pages ranking for the same query
- Use GSC "Compare" to see if new pages gain traction over time

---

## Vercel Analytics — Role in the Stack

| Use Case | Use Vercel | Use GA4 |
|----------|-----------|---------|
| Core Web Vitals (LCP, CLS, INP) | Yes | No |
| Real-time page views | Yes (simpler) | Yes |
| Custom events / conversions | Backup | Primary |
| Source/medium attribution | Basic | Full |
| Privacy-friendly (no cookies) | Yes | No |
| Performance regression alerts | Yes | No |

**Action items:**
- Keep Vercel Speed Insights for CWV monitoring
- Set up Vercel Alerts (dashboard → Speed Insights → Alerts) for CWV degradation
- Monitor LCP < 2.5s, CLS < 0.1, INP < 200ms weekly

---

## Conversion Funnel Definition

### Macro-conversions (actual leads)
1. **Phone call** — visitor taps a `tel:` link
2. **Text message** — visitor taps an `sms:` link (the "Text Photos" flow)
3. **Partner form submission** — partner-referred lead submits capture form

### Micro-conversions (engagement signals)
1. **Location modal open** — clicked "Text Photos," saw state selection
2. **Multi-page session** — viewed 3+ pages (research/consideration)
3. **Service page view** — visited a specific service page from any entry point
4. **Blog post read complete** — scrolled to end of article
5. **Google Reviews click** — clicked external link to reviews (social proof)

### Funnel

```
AWARENESS           INTEREST            CONSIDERATION        CONVERSION
(Found the site)    (Engaged)           (Evaluating)         (Contacted us)

Organic search  →   Read blog post  →   Viewed service   →   Phone call
Google Ads      →   Viewed city     →   Opened modal     →   Text message
Referral        →   Scrolled 50%+   →   Checked reviews  →   Form submit
Direct          →   Viewed 2+ pages →   Return visit     →
```

---

## Dashboards & Reporting Cadence

### Daily (2 min)
- GA4 Real-time: Events firing? Any anomalies?
- Vercel Analytics: Traffic spikes or drops?

### Weekly (15 min)
- Total leads: phone_call_click + text_message_click, broken out by CT vs MA
- Conversion rate: conversions / sessions
- Top 5 landing pages by conversions
- Google Ads spend vs. conversions per branch
- Mobile vs. desktop split (foundation repair is heavily mobile)

### Monthly (30 min)
- Content ROI table (city pages vs blog posts vs service pages — sessions, conversions, conv rate)
- GSC: Index coverage, query growth, CWV
- Google Ads: Search terms report (wasted spend on irrelevant queries?)
- Vercel Speed Insights: CWV trends

### Anomalies to Watch
- **Sudden traffic drop:** Check GSC for manual actions or indexing issues
- **Conversion rate drop with stable traffic:** Phone numbers broken? Modal broken? Deploy broke something?
- **Traffic spike with zero conversions:** Bot traffic
- **Google Ads CPC spike:** Competitor entered market or seasonal shift
- **City pages with high GSC impressions, zero clicks:** Title/description not matching search intent

---

## Technical Implementation Notes

### Files Requiring Code Changes

| File | Change | Phase |
|------|--------|-------|
| `src/layouts/Layout.astro` | Add Google Ads config (2 accounts) + click tracking script | 1 |
| `.env` / `.env.example` | Add `PUBLIC_GOOGLE_ADS_CT_ID`, `PUBLIC_GOOGLE_ADS_MA_ID` | 1 |
| `src/components/LocationModal.astro` | Add gtag call in `openModal()` | 2 |
| `src/pages/partners/capture.astro` | Add gtag call on successful submit | 2 |
| Page templates (`src/pages/`) | Add `data-page-type` to body | 3 |

### External Dashboard Configuration (no code changes)

| Platform | Action | Phase |
|----------|--------|-------|
| GA4 Admin | Enhanced Measurement: verify all toggles on | 1 |
| GA4 Admin | Mark `phone_call_click` and `text_message_click` as conversions | 1 |
| GA4 Admin | Link to CT Google Ads account | 1 |
| GA4 Admin | Link to MA Google Ads account | 1 |
| Google Ads (CT) | Create phone + text conversion actions | 1 |
| Google Ads (MA) | Create phone + text conversion actions | 1 |
| Google Ads (both) | Enable auto-tagging | 1 |
| GA4 Admin | Create custom dimensions (page_type, phone_region, click_location) | 2 |
| Google Ads (both) | Enable website call forwarding | 2 |
| GA4 Admin | Link to Google Search Console | 3 |
| Vercel Dashboard | Set up Speed Insights alerts | 2 |
| Google Ads (both) | Enable Enhanced Conversions | 4 |

### Validation Pipeline Impact

Analytics scripts are client-side JavaScript — they don't affect the build or validation pipeline (`npm run validate`). However:
- New env vars need to be added to Vercel's environment settings (for both production and preview)
- Test the build locally before deploying: `npm run validate`
- Verify events fire correctly using GA4 DebugView (GA4 Admin → DebugView) or Chrome's Tag Assistant

### Privacy

The privacy policy at `/src/pages/privacy.astro` already discloses cookies and Google Analytics. Adding Google Ads tracking is covered under this existing disclosure. No cookie consent banner is needed for a US-only local service business under current law. If call tracking with recordings is added later, update the privacy policy to mention call recording.

---

## API Access: Connecting Claude Code to Google Ads, GA4, and Search Console

### Why API Access Matters

Beyond implementing tracking, Claude Code can **actively analyze your data** — auditing Google Ads spend, identifying keyword waste, cross-referencing search queries with conversion data, and generating actionable reports. This requires API access to query the data directly.

### Existing Google OAuth Infrastructure

The project already has Google OAuth2 configured for the Calendar and Drive APIs:
- **Client ID/Secret:** Stored locally + as GitHub secrets (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`)
- **Refresh token:** `GOOGLE_OAUTH_REFRESH_TOKEN`
- **Current scopes:** `calendar.readonly`, `drive.readonly`
- **Auth code:** `scripts/lib/project-import-core.js` (reusable `authorize()` function)

The same OAuth client can be reused for all Google APIs — just add new scopes and re-authorize once.

### New API Scopes Needed

| API | Scope | What It Enables |
|-----|-------|-----------------|
| Google Ads | `https://www.googleapis.com/auth/adwords` | Query campaign/keyword/search term data, audit spend |
| GA4 Data API | `https://www.googleapis.com/auth/analytics.readonly` | Query sessions, events, conversions, user paths |
| Search Console | `https://www.googleapis.com/auth/webmasters.readonly` | Query search queries, impressions, clicks, index coverage |

### Setup Steps

**Step 1: Google Ads Developer Token (one-time)**
- In Google Ads → Tools & Settings → API Center → Apply for a developer token
- Read-only access (Standard tier) is typically approved quickly
- Needed for both CT and MA accounts
- If accounts are under an MCC (Manager account), the token goes on the MCC

**Step 2: Add Scopes to OAuth Client (5 minutes)**
- In Google Cloud Console → APIs & Services → Library → Enable:
  - Google Ads API
  - Google Analytics Data API
  - Google Search Console API
- Update the `SCOPES` array in `scripts/lib/project-import-core.js` (or create a separate auth module for analytics)

**Step 3: Re-authorize (5 minutes)**
- Run the OAuth flow once locally to get a new refresh token covering all scopes
- Update the `GOOGLE_OAUTH_REFRESH_TOKEN` secret

**Step 4: Create Query Scripts**
- `scripts/google-ads-report.js` — pulls campaign, keyword, search term, and geographic data
- `scripts/ga4-report.js` — pulls session, event, and conversion data
- `scripts/gsc-report.js` — pulls query, page, and index coverage data
- Output goes to `data/` directory as JSON for Claude Code to read and analyze

### Script vs. MCP Server

**Start with scripts:** Claude runs `node scripts/google-ads-report.js --last-30-days` via bash, reads the output file, and analyzes. Works immediately, minimal setup.

**Graduate to MCP later:** An MCP server wraps the APIs as tools Claude can call directly (e.g., `google_ads_query({ sql: "SELECT ..." })`). Better for interactive analysis sessions but more setup. Build this when the script approach feels slow.

### What Claude Code Can Analyze With Access

| Analysis | API Source | Value |
|----------|-----------|-------|
| **Waste audit** — irrelevant search terms burning budget | Google Ads | Save 15-30% of ad spend |
| **Keyword performance** — which keywords convert | Google Ads + GA4 | Optimize bids |
| **Geographic targeting** — clicks by city/zip | Google Ads | Tighten geo-targeting |
| **Landing page alignment** — which pages get ad traffic | Google Ads | Route to city pages |
| **Search query gaps** — queries with impressions but no page | GSC | New content opportunities |
| **Index coverage** — are new city pages indexed? | GSC | Expansion monitoring |
| **Content ROI** — which pages drive conversions | GA4 | Investment decisions |
| **CT vs MA comparison** — branch performance | All three | Resource allocation |

### Full Google Ads Strategy

See `docs/GOOGLE-ADS-STRATEGY.md` for the complete deep-dive framework: waste audit, keyword strategy, competitive analysis, landing page optimization, bid strategy, and ongoing management playbook.

---

## Implementation Priority Summary

| Priority | What | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Google Ads conversion tags (both accounts) | 1 hour | Stop spending blind |
| **P0** | Phone/text click tracking (event delegation) | 2 hours | Count leads |
| **P0** | Mark conversions in GA4 + link to Ads | 30 min | Enable reporting |
| **P1** | LocationModal + form submit events | 1 hour | Funnel visibility |
| **P1** | Custom dimensions in GA4 | 15 min | Better segmentation |
| **P1** | Google Ads call forwarding | 1 hour | Track paid call duration |
| **P1** | UTM templates | 1 hour | Consistent attribution |
| **P2** | Page type classification | 2 hours | Content ROI analysis |
| **P2** | GA4 Explorations + reports | 3 hours | Dashboards |
| **P2** | Link GSC to GA4 | 10 min | Query → conversion analysis |
| **P3** | Call tracking service evaluation | 1 hour | Full call attribution |
| **P3** | Vercel custom events (backup) | 1 hour | Ad-blocker resilience |
| **P3** | Remarketing audiences | 2 hours | Retarget high-intent visitors |
