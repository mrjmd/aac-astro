# Google Ads API — Design Document

## Company Information

**Company Name:** Attack A Crack Foundation Repair

**Contact:** Matt (Owner/Partner)

**Website:** https://www.attackacrack.com

**Business Model:** Attack A Crack Foundation Repair is a foundation repair contractor operating two branches in New England — one in Connecticut and one in Massachusetts. We operate two separate Google Ads accounts (one per branch) to generate leads from homeowners who need foundation crack injection, basement waterproofing, and related repair services. Both accounts are owned by our company. We do not manage ads for anyone else and do not operate as an advertising agency. We are applying for API access solely to analyze and optimize our own advertising.

---

## Tool Access / Use

Our tool is an internal command-line reporting and analysis system used exclusively by the business owner and our internal AI-assisted development workflow (Claude Code). It will **not** be accessible externally — there is no web UI, no external users, and no third-party access.

**Primary use cases:**

1. **Performance Reporting:** Pull campaign, keyword, and search term data from both Google Ads accounts into local JSON files for analysis. Reports are generated on-demand, not on a recurring schedule.

2. **Waste Identification & Cleanup:** Analyze search term reports to identify irrelevant queries consuming ad budget, then add negative keywords to eliminate waste. For example, our foundation repair ads trigger on searches like "foundation makeup" — the tool identifies these and adds them as negative keywords.

3. **Campaign Optimization:** Adjust bids based on performance data (increase bids on high-converting keywords, decrease or pause underperformers), restructure ad groups to align with our city-specific landing pages, and update ad copy based on performance analysis.

4. **Geographic Targeting:** Pull geographic performance data and adjust location targeting to concentrate spend in the cities and regions we actually service across Connecticut and Massachusetts.

5. **Cross-Platform Analysis:** Combine Google Ads data with Google Analytics 4 and Google Search Console data (also accessed via API) to understand which ad campaigns and keywords drive actual phone calls and text message inquiries to our two branch offices.

**Who will use it:** Only the business owner (sole user), assisted by an AI coding tool (Claude Code) that runs scripts and proposes changes for the owner to approve. No other employees, contractors, or external parties will have access to the tool or the data it produces.

**How data is used:** Reports are stored locally as JSON/CSV files, analyzed in the terminal, and used to make optimizations to campaigns. Changes include adding negative keywords, adjusting bids, pausing underperforming keywords, creating new ad groups, and updating geographic targeting. All changes are reviewed and approved by the business owner before execution. No data is shared externally or stored in any cloud database.

---

## Tool Design

The tool is a set of Node.js scripts that run from the command line. There is no web interface, no database, and no hosted application.

### Architecture

```
┌─────────────────────────────────────┐
│  Google Ads API                     │
│  (GoogleAdsService / SearchStream)  │
└──────────────┬──────────────────────┘
               │ HTTPS (REST/gRPC)
               ▼
┌─────────────────────────────────────┐
│  Node.js Report Script              │
│  scripts/google-ads-report.js       │
│                                     │
│  - Authenticates via OAuth2         │
│  - Queries campaign, keyword, and   │
│    search term performance data     │
│  - Writes results to local files    │
└──────────────┬──────────────────────┘
               │ JSON/CSV files
               ▼
┌─────────────────────────────────────┐
│  Local Analysis (Terminal)          │
│                                     │
│  - Owner reviews reports locally    │
│  - Identifies optimization actions  │
│  - Makes changes manually in the    │
│    Google Ads web UI                │
└─────────────────────────────────────┘
```

### How It Works

**Reporting flow (read):**
1. The owner runs `node scripts/google-ads-report.js` from the terminal.
2. The script authenticates with OAuth2 using stored credentials (client ID, client secret, refresh token) and the developer token.
3. The script queries the Google Ads API for the requested data (e.g., search terms for the last 30 days).
4. Results are written to local JSON files in a `data/google-ads/` directory.
5. The owner reviews the data in the terminal.

**Optimization flow (write):**
1. Based on the analysis, the tool generates recommended changes (e.g., a list of negative keywords to add, keywords to pause, bid adjustments).
2. The owner reviews each recommended change and approves or rejects it.
3. Approved changes are applied via the API (e.g., adding negative keywords to a campaign, pausing a keyword, updating a bid).
4. A log of all changes is written locally for audit purposes.

**All write operations require explicit owner approval before execution.** The tool never makes unsupervised changes to campaigns.

### Example Report Output

```
=== Search Terms Report (Last 30 Days) ===
Account: CT Branch (XXX-XXX-XXXX)

Search Term                          Clicks  Cost     Conv  CPA
─────────────────────────────────────────────────────────────────
foundation repair hartford ct        45      $312.50  8     $39.06
basement crack repair connecticut    32      $198.40  5     $39.68
foundation crack injection           28      $215.60  4     $53.90
foundation makeup tips               12      $84.00   0     N/A    ← IRRELEVANT
attack on titan season 5             3       $18.90   0     N/A    ← IRRELEVANT
concrete driveway repair             8       $52.80   0     N/A    ← WRONG SERVICE

Recommended Negative Keywords:
  - makeup
  - titan
  - driveway
  - [other irrelevant terms]

Total potential savings: $155.70/month (irrelevant search terms)
```

### Example Script Output (Terminal Mockups)

**Reporting (read):**

```
$ node scripts/google-ads-report.js --account ct --report search-terms --days 30

Authenticating with Google Ads API...
✓ Connected to Manager Account (XXX-XXX-XXXX)
✓ Querying CT Branch (XXX-XXX-XXXX)

Fetching search terms for last 30 days...
✓ Retrieved 847 search terms

Writing report to data/google-ads/ct-search-terms-2026-04.json
✓ Report saved

Summary:
  Total search terms: 847
  Total spend: $4,231.50
  Terms with conversions: 89
  Terms with zero conversions: 758
  Estimated waste (irrelevant terms): $634.20 (15.0%)

Run with --analyze flag for detailed recommendations.
```

**Analysis with recommendations:**

```
$ node scripts/google-ads-report.js --account ct --report search-terms --days 30 --analyze

=== WASTE AUDIT ===

Category: Non-Service Queries (34 terms, $284.50 wasted)
  "foundation makeup"          12 clicks, $84.00
  "concrete countertop diy"     8 clicks, $52.40
  ...

Category: Wrong Geography (12 terms, $156.30 wasted)
  "foundation repair new york"  6 clicks, $78.90
  ...

Category: Job Seekers (8 terms, $93.40 wasted)
  "foundation repair jobs ct"   5 clicks, $62.50
  ...

=== RECOMMENDED NEGATIVE KEYWORDS ===
makeup, countertop, diy, new york, jobs, salary, hiring, ...

Total recommended savings: $634.20/month
```

**Applying changes (write, with owner approval):**

```
$ node scripts/google-ads-optimize.js --account ct --apply-negatives

=== PROPOSED CHANGES ===

Add 54 negative keywords to Campaign "CT - Foundation Repair - Search":
  makeup, countertop, diy, new york, jobs, salary, hiring,
  titan, iphone, cosmetic, driveway, sidewalk, patio, ...

Pause 3 keywords with $500+ spend and zero conversions:
  "basement" (broad match)     — $312.50 spent, 0 conversions
  "concrete repair" (broad)    — $198.40 spent, 0 conversions
  "foundation" (broad)         — $156.20 spent, 0 conversions

Apply these changes? [y/N]: y

✓ Added 54 negative keywords to "CT - Foundation Repair - Search"
✓ Paused keyword "basement" (broad match)
✓ Paused keyword "concrete repair" (broad match)
✓ Paused keyword "foundation" (broad match)

Changes logged to data/google-ads/change-log-2026-04-15.json
```

---

## API Services Called

| API Service | Purpose | Read/Write | Frequency |
|------------|---------|-----------|-----------|
| `GoogleAdsService.SearchStream` | Query campaign, ad group, keyword, search term, and geographic performance metrics | Read | On-demand (weekly/monthly) |
| `GoogleAdsService.Mutate` | Add negative keywords, pause/enable keywords, update bids | Write | On-demand (after analysis, with owner approval) |
| `CampaignService` | Update campaign settings (geographic targeting, bid strategy, budget) | Write | Rarely (campaign restructuring) |
| `AdGroupService` | Create ad groups for city-specific keyword targeting | Write | Rarely (campaign restructuring) |
| `AdGroupCriterionService` | Add/remove keywords, add negative keywords | Write | After waste audits (monthly) |
| `CustomerService.ListAccessibleCustomers` | List linked accounts under the manager account | Read | Rarely (setup) |

### Specific Resources Queried (Read)

- **Campaign performance:** `campaign.name`, `campaign.status`, `metrics.clicks`, `metrics.impressions`, `metrics.cost_micros`, `metrics.conversions`
- **Keyword performance:** `ad_group_criterion.keyword.text`, `ad_group_criterion.keyword.match_type`, `metrics.clicks`, `metrics.cost_micros`, `metrics.conversions`, `metrics.search_impression_share`
- **Search terms:** `search_term_view.search_term`, `metrics.clicks`, `metrics.cost_micros`, `metrics.conversions`
- **Geographic performance:** `geographic_view.country_criterion_id`, `geographic_view.resource_name`, `metrics.clicks`, `metrics.cost_micros`, `metrics.conversions`

### Write Operations

All write operations are:
- **Owner-approved:** The tool proposes changes, the owner reviews and explicitly approves before execution
- **Logged:** Every mutation is recorded locally with timestamp, account, and details
- **Limited in scope:** Negative keywords, bid adjustments, keyword status changes, ad group creation. We do not programmatically create ad copy or modify billing.

### Rate Limits

Given the on-demand nature of the tool (run manually a few times per month), API usage will be minimal — well within Google's standard rate limits. Expected volume: fewer than 200 API calls per month across both accounts.

---

## Data Handling

- **Storage:** All data is stored locally on the owner's development machine in JSON/CSV files. No cloud storage, no databases, no hosted services.
- **Retention:** Reports are overwritten on each run. No long-term data retention beyond what Google Ads retains natively.
- **Access:** Only the business owner has access to the local machine and report files.
- **Security:** OAuth2 credentials (client ID, secret, refresh token) are stored in environment variables, not committed to source control. The `.env` file is in `.gitignore`.
- **No data sharing:** Report data is never transmitted to third parties, uploaded to external services, or made accessible via any network endpoint.
