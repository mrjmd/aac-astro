# SEO Strategy & Implementation Guide - Attack A Crack

This document outlines the technical SEO foundation implemented for the Attack A Crack Astro website, along with a roadmap for ongoing optimization and local search dominance.

## ✅ Technical Steps Completed

### 1. Automated Sitemap Generation
- **Integration:** Installed `@astrojs/sitemap`.
- **Functionality:** Configured to automatically generate a `sitemap-index.xml` file during the build process.
- **Benefit:** Ensures search engines can discover all pages on the site instantly.

### 2. Advanced Local Business Schema (JSON-LD)
- **Type:** Upgraded from generic `LocalBusiness` to `HomeAndConstructionBusiness`.
- **Localization:** Added `areaServed` property explicitly targeting **Connecticut** and **Massachusetts**.
- **Details:** Included geo-coordinates, operating hours, price range, and social media links to build trust with Google's Knowledge Graph.

### 3. Meta Tag Optimization
- **Geo-Tags:** Added `geo.region`, `geo.placename`, and `geo.position` to reinforce geographic relevance.
- **Social Graph:** Fully implemented Open Graph (Facebook) and Twitter Card meta tags for better social sharing visibility.
- **Canonicalization:** Dynamic canonical tags implemented to prevent duplicate content penalties.

### 4. Search Engine Instructions
- **Robots.txt:** Created a custom `robots.txt` file to guide crawlers and point them directly to the sitemap.

---

## 🛠️ Things Left To Do (Technical)

### 1. Image Asset Optimization
- **Current State:** Using external `picsum.photos` placeholders.
- **Action:** Replace placeholders with real high-quality photos stored in `src/assets/`.
- **Implementation:** Use Astro's `<Image />` component to enable automatic WebP/AVIF conversion and lazy loading.

### 2. Performance Fine-Tuning
- **Action:** Run a Lighthouse audit on the production build.
- **Goal:** Achieve 100/100 scores in Performance, Accessibility, and SEO.

### 3. Review Schema Integration
- **Action:** Wrap the testimonial data in `Review` and `AggregateRating` schema.
- **Benefit:** This can trigger "Star Ratings" in Google search results, significantly increasing click-through rates.

---

## 📈 Ongoing Practices & Recommendations

### 1. Localized Landing Pages (The "Silo" Strategy)
To capture "near me" searches, create dedicated pages for high-value service areas:
- `/connecticut/foundation-repair`
- `/massachusetts/basement-waterproofing`
- `/quincy-ma/wall-crack-repair`

### 2. Content Marketing (The "Expert" Strategy)
The foundation repair industry is driven by trust. Use the `/blog` to answer common customer questions:
- "How much does it cost to fix a foundation crack in CT?"
- "Signs your basement bulkhead needs replacing."
- "DIY vs Professional foundation repair: When to call the experts."

### 3. Google Business Profile (GBP) Management
- **Consistency:** Ensure your Name, Address, and Phone (NAP) on the website matches your GBP exactly.
- **Updates:** Post regular updates and photos to your GBP.
- **Reviews:** Actively encourage customers to leave reviews on Google, then feature those reviews on the site.

### 4. Backlink Building
- **Local Citations:** Ensure you are listed in local directories (Yelp, Angi, BBB, local Chamber of Commerce).
- **Partnerships:** Get links from local real estate agents or home inspectors.

---

## 💡 Best-in-Class Recommendations

- **Speed is a Ranking Factor:** Astro is fast by default, but keep it fast by avoiding heavy third-party scripts (like unoptimized chat widgets or heavy tracking pixels).
- **Mobile First:** Most local searches happen on mobile. Always test new features on a mobile device first.
- **User Intent:** Focus on "Conversion SEO." It's not just about getting traffic; it's about getting the *right* traffic that clicks the "Text Photos" button.
