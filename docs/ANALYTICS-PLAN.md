# Analytics & Conversion Tracking Plan

> **Status:** Phases 1-2 complete. Phase 3 active. Phases 4-6 planned.
> **Created:** March 22, 2026 | **Last updated:** March 26, 2026
> **Completed work:** Archived to `docs/archive/ANALYTICS-PHASES-1-2-COMPLETED.md`

## The Questions This Plan Answers

1. **Are my Google Ads making money or losing money?** → Phase 1 (DONE)
2. **Which content pages actually generate phone calls?** → Phase 2 (DONE)
3. **Should I invest in more city pages, more blog posts, or more ad spend?** → Phase 3 (ACTIVE)
4. **Are users actually engaging with our content?** → Phase 4 (NEXT)
5. **Can we automate the analysis so Claude does the math?** → Phase 5 (PLANNED)
6. **Can we close the loop from ad click to signed job?** → Phase 6 (STRATEGIC)

## Two Branches, Two Numbers

- **Connecticut:** 860-573-8760
- **Massachusetts:** 617-668-1677

Every event captures which branch. Separate Google Ads accounts per branch. Quo VoIP handles both lines.

---

## Completed: Phases 1-2

Full details archived. Summary of what's live:

- [x] GA4 + Google Ads MA conversion tracking
- [x] Phone/text click tracking (event delegation in Layout.astro)
- [x] LocationModal + partner form events
- [x] Page type classification (`data-page-type` on all 30 templates)
- [x] Custom dimensions in GA4 (page_type, phone_region, click_location)
- [x] GA4 linked to Google Ads MA + Google Search Console
- [x] GA4 Explorations built (Content ROI, City Performance, CT vs MA, Conversion Funnels)

---

## Phase 3: Content Intelligence (ACTIVE)

### 3.1 GA4 Explorations — DONE

Four explorations built in GA4 (see archive for step-by-step setup):
1. **Content ROI** — which pages drive phone_call_click events
2. **City Page Performance** — city pages filtered by sessions + call clicks
3. **CT vs MA** — branch performance comparison
4. **Conversion Funnels** — direct funnel (4A) + modal-assisted funnel (4B)

### 3.2 Link Google Search Console to GA4 — DONE

GSC linked. Query → landing page → conversion data flowing.

### 3.3 Google Ads Conversion Tracking — DONE

GA4 events imported as conversion actions in MA Google Ads account. CT pending MCC link.

### 3.4 Data-Driven Attribution Model

- [x] **Data-driven attribution** — already the default on all GA4 properties (Google removed the toggle; data-driven is now the only multi-touch option).

### 3.5 UTM Parameter Templates

- [x] **GBP UTM links** — done March 25, 2026. GBP traffic now attributable via `utm_medium=gbp`.

**GBP Website Links (set these in each GBP listing):**

| Listing | URL |
|---------|-----|
| CT GBP | `https://www.attackacrack.com/connecticut/?utm_source=google&utm_medium=gbp&utm_campaign=ct-branch&utm_content=website-button` |
| MA GBP | `https://www.attackacrack.com/massachusetts/?utm_source=google&utm_medium=gbp&utm_campaign=ma-branch&utm_content=website-button` |

**GBP Post Links (unique per post):**

```
https://www.attackacrack.com/[page]/?utm_source=google&utm_medium=gbp&utm_campaign=[ct-or-ma]-branch&utm_content=[post-topic]
```

**Full UTM Convention Table (always lowercase, hyphens not spaces):**

| Channel | utm_source | utm_medium | utm_campaign | utm_content |
|---------|-----------|-----------|-------------|-------------|
| Google Ads Search | google | cpc | {campaign_name} | {adgroupid} |
| Google Business Profile | google | gbp | {branch}-branch | {post-topic or button} |
| Facebook Organic | facebook | social | {post_topic} | |
| Facebook Ads | facebook | paid_social | {campaign_name} | |
| Email Newsletter | newsletter | email | {send_date} | |
| Partner Referral | partner | referral | {partner_slug} | |
| Print Flyer / QR Code | flyer | print | {campaign} | |

**Google Ads ValueTrack (auto-applied):**
```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}
```

### 3.6 Monthly Reporting Cadence

- [ ] **First monthly report** — pull after April 7 (2 full weeks of Phase 1 data)

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

## Phase 4: Engagement Intelligence

**All items are zero-performance-impact** unless noted. These piggyback on existing gtag.js and IntersectionObserver — no new script loads, no new third-party requests. See performance assessment at the end of this doc.

### 4.1 Scroll Depth on All Pages

- [x] Track scroll milestones: 25%, 50%, 75%, 100% — implemented March 25, 2026
- [x] Expanded to all pages (was city-only) — March 26, 2026
- **Why:** Understand how far visitors scroll on every page type. Filter by `page_type` in GA4 to compare engagement across city pages, blog posts, service pages, etc.
- **Implementation:** IntersectionObserver on 4 marker elements, ~15 lines inline JS
- **Performance impact:** Zero — 4 lightweight observers, fire-and-forget gtag calls

```javascript
// Fires: scroll_depth { depth: "25%|50%|75%|100%", page_type, page_path }
```

### 4.2 Blog Read-Complete Tracking

- [x] Fire `blog_read_complete` when visitor reaches end of article — implemented March 25, 2026
- **Why:** Which posts are actually being read vs bounced? Informs content investment decisions.
- **Implementation:** IntersectionObserver on end-of-article marker, ~8 lines inline JS
- **Performance impact:** Zero — 1 observer on 1 element

```
Event: blog_read_complete
Parameters: post_slug, category, page_path
```

### 4.3 Video Play/Complete Tracking

- [x] Track `video_play` and `video_complete` on YouTube embeds — implemented March 25, 2026
- **Why:** Validate whether the 18 embedded videos are worth the load cost. Do video watchers convert at higher rates?
- **Implementation:** YouTube iframe API event listeners. Videos are all <40s Shorts — no milestone percentages needed, just play + complete.
- **Performance impact:** Zero — YouTube iframe is already loaded on video pages. Adding 2 event listeners per embed.

```
Event: video_play    { video_id, video_title, page_path, page_type }
Event: video_complete { video_id, video_title, page_path, page_type }
```

### 4.4 Page Speed vs Conversion Correlation — DROPPED

Dropped March 30, 2026. Site is uniformly fast (Astro static, sub-1s LCP). Not enough variance to produce actionable insights.

### 4.5 Microsoft Clarity (Conditional — Heatmaps)

- [x] Install Clarity on city pages only for 2-4 week data sprint, then remove — installed March 2026, ID: w2bnacndl9
- **Why:** See where users click on city pages. Are they engaging with project galleries and before/after photos, or scrolling straight to the CTA?
- **Implementation:** Conditional script tag in Layout.astro, only loads when `pageType === 'city'`
- **Performance impact:** +22KB gzipped JS (67% increase on current 33KB total), continuous MutationObserver + scroll recording. **Not permanent.** Install, collect data, remove.

---

## Phase 5: Automated Reporting & API Scripts

All server-side Node.js. **Zero client-side performance impact.**

Existing infrastructure: Google OAuth2 with adwords + analytics.readonly + webmasters.readonly scopes. Developer token active on MCC. Scripts in `scripts/`.

### 5.1 Search-to-Conversion Bridge Script

- [x] **`scripts/search-to-conversion.js`** — built March 25, 2026. Run via `npm run report:bridge`
- Uses click-share probabilistic model: estimates per-query conversions based on each query's share of a page's organic clicks
- Outputs HTML report (`data/reports/search-to-conversion.html`) + JSON
- Three views: estimated query conversions (with confidence scores), top search queries (pure GSC), page conversion ranking (actual GA4)
- All conversions broken out by CT/MA calls and texts
- Run: `npm run report:bridge` or `npm run report:bridge -- --days 14`

### 5.2 Seasonal Benchmarking Script

- [x] **`scripts/seasonal-benchmark.js`** — built March 25, 2026. Run via `npm run report:benchmark`
- Monthly snapshot: sessions, users, calls/texts by CT/MA, conversion rate, traffic sources, device breakdown
- Appends to running `data/reports/seasonal-benchmarks.json`, generates HTML trend report with bar charts
- Run: `npm run report:benchmark -- --month 2026-03` (end of each month)

### 5.3 Analytics Health Check

- [x] **`scripts/analytics-health-check.js`** — built March 26, 2026. Run via `npm run report:health`
- Queries GA4 Data API to verify all 8 custom events and 7 custom dimensions are flowing correctly
- Checks for: missing events, `(not set)` dimension values, broken dimensions, page_type coverage gaps
- Outputs HTML dashboard (`data/reports/analytics-health.html`) + JSON
- Run: `npm run report:health` (default 7 days) or `npm run report:health -- --days 1`

**Vercel cron:** `api/analytics-health.ts` runs daily at 9am UTC (5am ET). Configured in `vercel.json`.

**Env vars required on Vercel:** `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`, `CRON_SECRET`

**Optional:** `HEALTH_ALERT_WEBHOOK` — Slack-compatible webhook for alerts

#### March 26 Health Check Findings & Fixes

First health check run revealed:
1. **`data-hero` and `data-modal` attributes missing from DOM** — click location detection for hero and modal was silently broken, all clicks reported as `inline`. Fixed by adding `data-hero` to Hero.astro and `data-modal` to LocationModal.astro.
2. **Sticky CTA clicks misattributed as `navbar`** — StickyCTA is a `<nav>` element, so all mobile sticky bar clicks were lumped with header nav. Added `data-sticky-cta` attribute and new `sticky_cta` click location value.
3. **`page_type` missing from 97% of sessions** — was only sent with custom events, not with `page_view`. Fixed by adding `gtag('set', { page_type })` before `gtag('config')` so it attaches to all events.
4. **Scroll depth limited to city pages** — expanded to all pages.

### 5.4 Automated Analytics Fix Pipeline (PLANNED)

**Goal:** When the daily health check finds issues, Claude Code automatically investigates and opens a PR with a fix. Matt gets notified via GitHub email.

**Architecture (two-step, async):**

```
Step 1: Vercel cron (daily, 5am ET)
  └─ Runs analytics health check via GA4 API
  └─ Issues found? → Creates GitHub Issue with label "analytics-health"
     (Issue body contains: which events broke, which dimensions, event counts, error details)
  └─ No issues? → Silent success, logged in Vercel function logs

Step 2: Claude Code remote trigger (daily, 5:30am ET)
  └─ Checks for open GitHub Issues labeled "analytics-health"
  └─ No issues? → Exits cleanly
  └─ Issue found? →
     1. Reads issue body for context
     2. Reads src/layouts/Layout.astro, components, and tracking code
     3. Investigates root cause (missing attrs, broken selectors, race conditions, etc.)
     4. Writes fix + runs npm run validate
     5. Opens PR referencing the issue
     6. If not code-fixable (GA4 admin config, low traffic): comments on issue with manual steps
```

**Why two steps:** Vercel has Google OAuth credentials for querying GA4. Claude's remote agent has the codebase and can write code. GitHub Issues bridge the two — Vercel writes the diagnosis, Claude reads it and acts.

**Prerequisites:**
- [ ] Connect GitHub to Claude Code remote agents (`/web-setup` or install Claude GitHub App)
- [ ] Set `GITHUB_TOKEN` env var on Vercel (for creating issues via GitHub API)
- [ ] Create Claude remote trigger with `analytics-health-fix` prompt
- [ ] Set Google OAuth env vars on Vercel (for health check API calls)
- [ ] Test end-to-end: manually trigger health check → verify issue created → verify Claude opens PR

**Notification flow:** GitHub → email notification for new PR. The PR *is* the alert, and it comes with the fix attached.

### 5.5 Conversion Journey Analytics

- [x] **`scripts/conversion-journeys.js`** — built March 26, 2026. Run via `npm run report:journeys`
- Analyzes conversion patterns across landing pages, channels, devices, click locations, and new vs returning visitors
- Computes **Signal Significance**: data-derived conversion lift per page, channel, device, and visitor type (no hardcoded weights)
- Landing page performance table with per-page conversion rates
- Run: `npm run report:journeys` (default 30 days) or `npm run report:journeys -- --days 90`

**Client ID custom dimension (added March 26):** The GA4 Data API doesn't expose `userPseudoId`, but we capture the GA4 client ID from the `_ga` cookie and send it as a user-scoped custom dimension `client_id`. Registered in GA4 Admin March 26.

**Per-user journey reconstruction (upgraded March 27):** Script now queries `customUser:client_id` to reconstruct individual journeys. New analyses: multi-session converter timelines, days-to-convert distribution, micro-conversion overlap (actual converter percentages), near-converters (high-intent non-converters), and channel assist/source shift patterns. Graceful fallback: if client_id data is all "(not set)", falls back to aggregate analysis with a note. Use `--skip-user-journeys` flag to skip per-user queries entirely. As of March 27, client_id data is still propagating in GA4 — re-run in 24-48 hours for full per-user analysis.

**First run findings (March 26, 2026):**
- 17 conversions, 1.85% conversion rate across 919 users
- /partners landing page: 11.9x conversion lift (referral visitors highly qualified)
- Referral traffic: 8.8x lift overall
- Mobile: 1.7x lift over desktop
- New vs returning nearly even (suggests multi-session journeys matter)

### 5.6 Content Decay Alert Script

- [ ] **`scripts/content-decay-alert.js`** — flags posts losing position
- **Why:** Once you rank for "flex-seal-basement-cracks" (49,500/mo cluster), competitors will try to out-content you. An automated alert when a high-value post drops from #1 to #4 lets you refresh before losing traffic.
- Data source: GSC API (positions by query over time)
- Output: "Needs attention" list — posts that dropped 3+ positions in the last 2 weeks
- Run: weekly

### 5.6 GA4 + GSC Reporting Scripts (existing)

Already built:
- `scripts/ga4-report.js` — page performance, conversions, traffic sources, device breakdown
- `scripts/gsc-report.js` — queries, pages, query-page combos, sitemap status
- `scripts/google-ads-report.js` — campaigns, search terms, keywords, geo, impression share

Additional scripts planned → see `docs/GOOGLE-ADS-STRATEGY.md`:
- Landing page performance script (Ads API)
- Competitor auction insights script (Ads API)

---

## Phase 6: Strategic / Advanced

### 6.1 Quo VoIP Integration — Call Quality Intelligence

**The preferred approach to call tracking. No forwarding numbers. Real numbers stay on the site.**

Matt's VoIP provider (Quo) has an API. Instead of Google forwarding numbers or CallRail, we pull call data directly from Quo and correlate it with web sessions.

**Architecture: `scripts/quo-call-report.js`**

1. Pull call logs from Quo API for CT (860) and MA (617) numbers
   - Data needed: timestamp, caller number, duration, answered/unanswered, which line
2. Pull GA4 sessions via GA4 Data API for the same time window
   - Data needed: session start time, landing page, source/medium, page_type, tel: click events
3. Match calls to sessions using timestamp correlation (call within ~5 min of tel: click event)
4. Output: JSON/CSV

```
Example output:
Call: 2:14pm, 4m30s, answered, MA line
→ Session: /massachusetts/quincy/ at 2:12pm via google/cpc
→ Search query (GSC): "foundation repair quincy ma"
→ Verdict: Qualified lead from Google Ads
```

**Advantages over forwarding numbers (Google Ads call forwarding):**
- Real numbers stay on the site — trust signal for local business
- Works for ALL traffic (organic, direct, referral — not just Ads)
- No per-minute costs, no third-party dependency
- Call duration + answered status = lead quality signal

**Advantages over CallRail ($45-95/mo):**
- No monthly cost
- No number swapping
- Same core data: duration, answered, timestamp

**Limitations:**
- Can't attribute calls without a website visit (e.g., someone sees the truck, calls directly)
- Matching is probabilistic (timestamp-based), not deterministic
- CallRail remains a fallback if Quo data proves insufficient

**Next step:** Matt to provide Quo API docs (endpoints, auth, available fields, rate limits).

### 6.2 Offline Conversion Imports (OCI)

**Full architecture documented in `docs/GOOGLE-ADS-STRATEGY.md`.** Summary:

Tell Google Ads which clicks became paying jobs. Google optimizes bidding to find more people like your actual $5K customers.

```
CAPTURE: Visitor clicks Ad → lands with ?gclid=abc123
STORE:   Site JS saves gclid to localStorage
PASS:    gclid included in GA4 conversion event params
CRM:     Matt creates Pipedrive deal, gclid stored in custom field
CLOSE:   Job completed, deal marked won with revenue
UPLOAD:  Monthly script uploads gclid + revenue to Google Ads API
LEARN:   Google optimizes bidding for revenue, not just clicks
```

**Prerequisites:** Pipedrive API access (have it), Google Ads API (have it), ~30 conversions/month for statistical significance. Build when volume justifies — likely Month 3-4.

### 6.3 Remarketing Audiences

- [ ] Create GA4 audiences for Google Ads retargeting:
  - "Visited service page but didn't convert" → show ads
  - "Visited city page in CT" → CT-specific ads
  - "Opened modal but didn't text" → high intent, didn't complete
- Needs 2+ weeks of conversion data. Build in April.

### 6.4 Enhanced Conversions

- [ ] Enable in Google Ads (Goals → Settings → Enhanced Conversions)
- Partner form can pass hashed email/phone for better matching
- Low effort, moderate improvement in conversion measurement accuracy

### 6.6 Vercel Custom Events (Ad-Blocker Backup)

- [ ] Duplicate phone/text events via Vercel's `track()` function
- Cookie-free, not blocked by ad blockers targeting Google scripts
- ~30% of users block GA4 — this provides a second conversion count
- Implementation: add `track('phone_click', { region })` alongside existing gtag calls

---

## Dashboards & Reporting Cadence

### Daily (2 min)
- GA4 Real-time: Events firing? Any anomalies?
- Vercel Analytics: Traffic spikes or drops?

### Weekly (15 min)
- Total leads: phone_call_click + text_message_click, by CT vs MA
- Conversion rate: conversions / sessions
- Top 5 landing pages by conversions
- Google Ads spend vs. conversions per branch
- Mobile vs. desktop split

### Monthly (30 min)
- Content ROI table (city vs blog vs service — sessions, conversions, rate)
- GSC: Index coverage, query growth, CWV
- Google Ads: Search terms report
- Vercel Speed Insights: CWV trends
- Seasonal benchmark snapshot (Phase 5.2)

### Anomaly Response Playbook

| Signal | Likely Cause | Action |
|--------|-------------|--------|
| Sudden traffic drop | GSC manual action, indexing issue, deploy broke sitemap | Check GSC Coverage, check Vercel deploy log, check sitemap.xml |
| Conversion rate drop, stable traffic | Phone number broken, modal broken, tracking code broken | Test tel:/sms: links manually, check GA4 Realtime events |
| Traffic spike + zero conversions | Bot traffic | Check GA4 → Tech → Browser for unusual user agents |
| Google Ads CPC spike | Competitor entered market, seasonal surge | Check Auction Insights, review search terms for new competitors |
| City page high impressions, zero clicks | Title/description mismatch with search intent | Rewrite meta title + description, check GSC CTR data |
| High-value post position drop | Competitor published competing content | Refresh content (Phase 5.3 alert), check GSC for new competitor URLs |

---

## Google Search Console — Monitoring Cadence

### Weekly (15 min)
- Performance → Search results: sort by impressions, filter by page
- Top pages by clicks: which pages drive organic traffic?
- Low CTR + high impressions: title/description not working

### Monthly (30 min)
- Index coverage: pages indexed vs submitted
- Core Web Vitals: real-user CWV data
- Links report: who links to us?
- Query growth: week-over-week impression trends

---

## Vercel Analytics — Role in the Stack

| Use Case | Use Vercel | Use GA4 |
|----------|-----------|---------|
| Core Web Vitals (LCP, CLS, INP) | Yes | No |
| Real-time page views | Yes (simpler) | Yes |
| Custom events / conversions | Backup (Phase 6.5) | Primary |
| Source/medium attribution | Basic | Full |
| Privacy-friendly (no cookies) | Yes | No |
| Performance regression alerts | Yes | No |

---

## Performance Impact Assessment

### Current Client-Side JS (~33KB total, all async)
- gtag.js (~28KB) — GA4 + Google Ads
- Vercel Analytics (~1KB) — cookie-free
- Vercel Speed Insights (~3KB) — Web Vitals
- Inline scripts (~1KB) — click tracking, IntersectionObserver animations

### Phase 4 Additions

| Item | New JS | New Requests | LCP Impact | Verdict |
|------|--------|-------------|-----------|---------|
| Scroll depth | ~15 lines inline | 0 | None | Zero concern |
| Blog read-complete | ~8 lines inline | 0 | None | Zero concern |
| Video play/complete | ~10 lines inline | 0 (YouTube already loaded) | None | Zero concern |
| Page speed analysis | 0 (server-side) | 0 | None | Zero concern |
| **Clarity** | **+22KB gzipped** | 1 load + continuous beacons | None (async) | **Only item with real cost — temporary install only** |

**Cumulative (without Clarity):** ~40 lines of inline JS, zero new script loads, zero new requests. Invisible to performance metrics.

**With Clarity (temporary):** +22KB JS, +continuous beacons. Passes all Lighthouse thresholds but adds meaningful background CPU. Install on city pages only for 2-4 weeks, then remove.

### Phase 5-6 Additions
All server-side Node.js scripts. Zero client impact.

---

## Phase 7: Unified Analytics Dashboard

### The Problem

As of March 26, 2026, we have 9 separate report scripts, GA4 explorations, and a Vercel cron — but no single place to go for a cohesive view. The experience is fragmented:
- Some data is in GA4 (real-time, explorations)
- Some is local HTML reports that must be manually run (`npm run report:*`)
- No historical continuity — reports show a snapshot, not a trend
- No automatic updates — you have to remember to run things
- Can't access reports from your phone or another computer

### The Vision

One always-up-to-date dashboard accessible from any browser that shows:
- **Health status** at a glance (events flowing? anything broken?)
- **This week vs last week** (leads, sessions, conversion rate, with trend arrows)
- **Position tracking over time** with trend lines (not point-in-time snapshots)
- **Conversion journeys** (once client_id data is flowing)
- **Signal significance** (which pages/actions drive conversions)
- **Content decay alerts** (sustained ranking drops, not daily noise)
- **Cannibalization warnings** (when they become relevant)
- Launch date (March 21) as a visible inflection point on all time-series charts

### Architecture Direction

**This should be a separate project, not part of the website repo.**

Reasons:
- The site is live and being vibe-coded. Adding a full interactive dashboard app increases risk of accidental breakage.
- Separation of concerns: the site serves customers, the dashboard serves Matt. Different audiences, different release cadence, different risk tolerance.
- The dashboard needs a database, interactive UI framework, and cron jobs — different stack concerns than a static Astro site.
- The data collection scripts (in this repo) remain the data layer. The dashboard project reads from their APIs or stored output.

**Likely architecture: Separate Vercel project**
- Its own repo, its own deploy, its own URL (e.g., `analytics.attackacrack.com` or a separate Vercel project URL)
- Interactive frontend (React/Next.js, or Astro with client-side islands) with date range filters, clickable drill-downs, user ID lookup
- Backend: Vercel serverless functions + Supabase (free tier) or Vercel KV for time-series storage
- Daily cron pulls from GA4 + GSC APIs and stores snapshots in the DB
- Auth: simple password gate or Vercel auth

**Crawl → Walk → Run:**
1. **Crawl (now):** Keep using the npm scripts in this repo for data collection. They work. Position tracker backfill is next.
2. **Walk (April):** New repo with dashboard MVP — health status, weekly performance, position trend charts with launch date marker. Read from GA4/GSC APIs directly.
3. **Run (May+):** Full interactive dashboard — date range pickers, per-query drill-down, user journey timelines (once client_id data is rich), cannibalization alerts, content decay trends. All auto-updating.

**Open design questions (for next planning session):**
- Stack choice: Next.js (most ecosystem support for dashboards) vs Astro + React islands (lighter)?
- DB: Supabase (Postgres, free tier, SQL) vs Vercel KV (simpler, key-value) vs Turso (SQLite edge)?
- How much real-time vs daily snapshots? (Daily is probably fine for a local business)
- Should the existing npm scripts push data to the dashboard DB, or should the dashboard pull directly from APIs?
- Mobile experience: how often will Matt check this from a phone vs laptop?

### Position Tracking (Sub-feature — builds in this repo, feeds the dashboard)

The core of the "trend over time" capability. Built March 27, 2026.

**`scripts/track-positions.js`** — Position snapshot collector — BUILT

- [x] Pulls daily positions from GSC API for top queries + pages (GSC stores 16 months of daily data)
- [x] **Backfill mode:** `npm run track:positions -- --backfill --since 2026-02-01` — pulls daily data retroactively. Initial backfill done: 17,567 rows across 52 days (Feb 1 – Mar 24).
- [x] **Daily mode:** `npm run track:positions` — appends latest available day to the running history
- [x] **Report-only mode:** `npm run track:positions -- --report` — regenerate HTML from existing data, no API calls
- [x] **Top-N filter:** `npm run track:positions -- --top 50` — limit to top N queries by impressions
- [x] Stores in `data/reports/position-history.json` (running time-series)
- [x] Each entry: `{ date, query, page, position, impressions, clicks, ctr }`

**Trend detection (implemented):**
- 7-day rolling average per query+page combo to smooth daily noise
- Flags decay when rolling average rises 3+ positions across 3+ consecutive data points
- Flags improvement when rolling average drops 3+ positions sustained
- March 21 launch as inflection point — categories: improved_since_launch, declined_since_launch, declining_pre_launch, new_post_launch, stable

**Report output** (`data/reports/position-trends.html`):
- Inline SVG sparklines per query with dashed launch-date marker
- Color-coded: green (improving), red (declining), gray (stable)
- Sectioned tables: "Improved since launch," "Declined since launch," "New rankings post-launch"
- Summary cards: total tracked, improved, declined, new, trending up/down

**Initial backfill findings (March 27, 2026):**
- 1,347 query+page combos tracked
- 112 improved since launch, 85 declined, 55 new post-launch
- Top improver: "basement foundation repair near me" → position 1
- Top decliner by impressions: "concrete foundation repair" → position 29 (3,675 imp)

**Schedule:** Run 3x/week (Mon/Wed/Fri) via local cron or Vercel cron. The backfill only needs to run once.

### How the Pieces Connect

```
THIS REPO (aac-astro)              DASHBOARD REPO (new, separate)
├── scripts/track-positions.js     ├── app/ (interactive UI)
├── scripts/report-*.js            ├── api/ (cron jobs, data ingestion)
├── scripts/alert-*.js             ├── db/ (time-series storage)
├── scripts/audit-*.js             └── pulls from GA4/GSC APIs directly
├── data/reports/*.json
└── Data collection layer          └── Presentation + interaction layer
```

The npm scripts in this repo continue to work standalone for quick local checks. The dashboard project is the "real" interface for ongoing monitoring.

### Implementation Phases

1. **Phase 7.1: Position tracking + backfill (this repo)** — DONE March 27. 17,567 rows, 52 days backfilled, 1,347 query+page combos tracked.
2. **Phase 7.2: Dashboard project kickoff (new repo)** — Scaffold the project, choose stack, set up DB, build the data ingestion cron. Map out the full UI before building.
3. **Phase 7.3: Dashboard MVP** — Health status + weekly performance + position trend charts with launch marker. Interactive date range picker. Accessible via URL.
4. **Phase 7.4: Full dashboard** — Per-user journey timelines, cannibalization view, content decay trends, conversion breakdown with filters, mobile-friendly.

---

## API Access (Reference)

OAuth2 configured. All three APIs active:

| API | Scope | Scripts |
|-----|-------|---------|
| Google Ads | `auth/adwords` | `google-ads-report.js`, `google-ads-negatives.js`, `google-ads-assets.js` |
| GA4 Data | `auth/analytics.readonly` | `ga4-report.js` |
| Search Console | `auth/webmasters.readonly` | `gsc-report.js` |

MCC: `944-839-2141` | MA Ads: `468-360-7368` | CT Ads: pending MCC link

See `docs/GOOGLE-ADS-STRATEGY.md` for full API setup, scripts, and analysis workflows.

---

## Implementation Priority

| Priority | Item | Effort | Who | Phase |
|----------|------|--------|-----|-------|
| ~~Done~~ | ~~GBP UTM links on both listings~~ | ~~10 min~~ | ~~Matt~~ | ~~3~~ |
| **Do now** | Switch to data-driven attribution | 5 min | Matt | 3 |
| ~~Done~~ | ~~Scroll depth tracking (all pages)~~ | ~~30 min~~ | ~~Claude~~ | ~~4~~ |
| ~~Done~~ | ~~Blog read-complete tracking~~ | ~~30 min~~ | ~~Claude~~ | ~~4~~ |
| ~~Done~~ | ~~Video play/complete tracking~~ | ~~1 hr~~ | ~~Claude~~ | ~~4~~ |
| ~~Done~~ | ~~Search-to-Conversion bridge script~~ | ~~3-4 hrs~~ | ~~Claude~~ | ~~5~~ |
| ~~Done~~ | ~~Seasonal benchmark baseline~~ | ~~1 hr~~ | ~~Claude~~ | ~~5~~ |
| ~~Done~~ | ~~Analytics health check script + Vercel cron~~ | ~~2 hrs~~ | ~~Claude~~ | ~~5~~ |
| ~~Done~~ | ~~Conversion journey analytics script~~ | ~~3 hrs~~ | ~~Claude~~ | ~~5~~ |
| ~~Done~~ | ~~Register `client_id` custom dimension in GA4 Admin~~ | ~~2 min~~ | ~~Matt~~ | ~~5~~ |
| ~~Done~~ | ~~Weekly + monthly dashboard scripts~~ | ~~2 hrs~~ | ~~Claude~~ | ~~5~~ |
| ~~Done~~ | ~~Content decay alert script~~ | ~~1 hr~~ | ~~Claude~~ | ~~5~~ |
| ~~Done~~ | ~~Cannibalization audit script~~ | ~~2 hrs~~ | ~~Claude~~ | ~~5~~ |
| ~~Done~~ | ~~Upgrade journey script with per-user reconstruction~~ | ~~2 hrs~~ | ~~Claude~~ | ~~5~~ |
| ~~Done~~ | ~~Position tracker + backfill (Feb 1 → present)~~ | ~~3 hrs~~ | ~~Claude~~ | ~~7~~ |
| **Next** | Unified dashboard architecture decision | Discussion | Matt + Claude | 7 |
| **Next** | Remarketing audiences in GA4 | 30 min | Matt | 6 |
| **Next** | Automated fix pipeline (Claude remote trigger) | 1 hr | Matt + Claude | 5 |
| **April** | Dashboard MVP (health + performance + position trends) | 4-6 hrs | Claude | 7 |
| **April** | First monthly report | 30 min | Matt + Claude | 3 |
| **April** | Clarity install (city pages, 2-4 weeks) | 15 min | Claude | 4 |
| **May** | Full dashboard (all tabs, all data sources) | 6-8 hrs | Claude | 7 |
| **May** | Quo API integration | 3-4 hrs | Claude | 6 |
| **Month 3-4** | OCI / GCLID pipeline | 4-6 hrs | Claude + Matt | 6 |
| **When ready** | Vercel custom events (backup) | 1 hr | Claude | 6 |
| **When ready** | Enhanced conversions | 30 min | Matt | 6 |
