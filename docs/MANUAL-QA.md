# Manual QA Checklist

> **How to use:** Go through each page, check the box when reviewed, add notes on the line below. When complete, Claude will address all notes in a single pass.
>
> **Preview:** https://aac-astro.vercel.app
>
> **What to check on each page:** Content accuracy, images loading, layout/spacing, mobile responsive, links working, phone numbers correct, any copy that feels off.

---

## Global Checks

These apply site-wide. Check once, not per-page.

- [x] **Navigation** — All nav links work (Services, Locations, About, Updates, Partners)
- [x] **Footer** — All footer links work, phone numbers correct, addresses correct
- [x] **Contact form** — "Text Us Photos" modal submits correctly
- [x] **Phone numbers** — CT: (860) 573-8760, MA: (617) 668-1677
- [x] **Addresses** — CT: 23 Elsmere Road, Amston, CT 06231; MA: 30 Randlett St #2, Quincy, MA 02169
- [x] **"260+ Google reviews" claim** — Still current?
- [ ] **Mobile responsive** — Spot-check on iPhone/Android
- [x] **Favicon** — Displays correctly in browser tab
- [ ] **Schema** — Paste page source into [Schema Markup Validator](https://validator.schema.org/) (spot-check 2-3 pages)

---

## Core Pages (5)

- [ ] **Homepage** — [Preview](https://aac-astro.vercel.app/)
  - Notes: The homepage hero needs to be updated so it's not only just images from a single job. It should show different jobs instead. That can be a post-launch task, but it should be a fast follow. The images showing under the "From Our Blog" section on the home page are not good; they're rotated sideways. I thought we had fixed that, but I see a wall crack that's about floor cracks. I see an article about carbon fiber staples that does not show any staples, and it looks like they're both sideways, so we gotta fix that. And look into whether there's a broader issue with blog posts still having sideways images. Under "How does foundation crack repair work?" in the Frequently Asked Questions section of the home page, we're still saying that we use low-pressure injection, which is specifically inaccurate. I thought we had fixed this throughout the site, so that's concerning. We need to do an audit and make sure that we're not claiming low pressure anywhere. We actually do a higher pressure injection of 95 to 100 psi, higher than the hand pumps. It's part of our value proposition. 
- [ ] **About** — [Preview](https://aac-astro.vercel.app/about)
  - Notes: in the About page, it could say at the very top "50+ years of experience" because it's referencing experience not in business. Down in the why trust attack a crack section. HIC licensed and certified. Let's remove the construction supervisor license in MA line. Instead of "Ashi affiliate member", I wonder if we shouldn't just say "active locally" or "local memberships" or something and make it more broad. Then we list underneath: we're members of Ashi, we're members of G Bar, we're members of local chambers of commerce, things like that. It says 260 plus 5-star reviews and then a 4.9-star average, but actually we're a 5.0-star average. Instead of "Meet the team in person", I think it should be "Contact the team today" or something. We're probably not going to meet you unless you actually book us for a job. You can talk to us, though, for free. 
- [ ] **What We Don't Do** — [Preview](https://aac-astro.vercel.app/what-we-dont-do)
  - Notes: where is the "What We Don't Do" page even linked from? It seems like an important page, but I don't see it cross-linked a lot of places, so I'm curious about that. I'd never actually looked at this page until this moment. Under "What We Do", Foundation Repair, it says CT and MA instead of CT, MA, and New England. Let's fix that. One thing I would want us to be emphasizing on this page is that you can always call us first. One of the reasons to call us first is because we will never try to upsell you into things that we don't do, because we don't make any money off of that. I don't want to put it that directly, but that's the idea to convey. I don't want to use upsell, but we want to convey that idea. We don't do basement waterproofing systems or sump pump installation, but you can call us and you can trust that we would only recommend that if it's really needed, because we don't do it. We can almost always refer you to someone. Same thing with all of these. Structural engineer: we don't do it, but we can often save you the need for a structural engineer by giving you our advice first. If we're not confident and we do think you should speak to a structural engineer, we'll tell you so and we'll give you a referral to one if you'd like. Excavation contractors? Ensure that they carry proper insurance for this work and that the repair isn't possible to do from the interior at a much more affordable cost. 
- [ ] **Privacy Policy** — [Preview](https://aac-astro.vercel.app/privacy)
  - Notes: it says Attack A Crack Foundation Repair operates the website, but it's really just Attack A Crack. 
- [ ] **Terms of Service** — [Preview](https://aac-astro.vercel.app/terms)
  - Notes: it says Attack A Crack Foundation Repair operates the website, but it's really just Attack A Crack. Multiple places it references an on-site consultation. We shouldn't say on-site. Contact us for a consultation is all it needs to say. Don't include "on-site". 

---

## Services (7)

- [ ] **Services Hub** — [Preview](https://aac-astro.vercel.app/services)
  - Notes: the concrete repair and resurfacing image on the main services page is still sideways. The "dive deeper" section doesn't show any thumbnail images for these posts. The Proven Methods Lifetime Guarantee section has a sideways image. Can we please just audit the whole site for sideways fucking images? I thought we did this. 
- [ ] **Foundation Crack Injection** — [Preview](https://aac-astro.vercel.app/services/foundation-crack-injection)
  - Notes: it says "low pressure" in the opening paragraph of foundation crack injection. It's not low pressure injection; it's high pressure injection. We got to audit the whole fucking site for this because you screwed it up. "permanent repair that’s as strong as — or stronger than — the original concrete" - Let's just say it's stronger than the original concrete. We don't inject stair-step cracks and block our masonry foundations typically. We also don't inject basement floor cracks. I'd also like to remove the line about 91+ documented projects on this page. 
- [ ] **Wall Crack Repair** — [Preview](https://aac-astro.vercel.app/services/wall-crack-repair)
  - Notes: let's get the 91+ documented projects thing off of here too. 
- [ ] **Leaky Bulkhead Repair** — [Preview](https://aac-astro.vercel.app/services/leaky-bulkhead-repair)
  - Notes: the "Why bulkheads leak" section doesn't mention heaving, which is actually the primary cause of these issues. Moisture gets up underneath the stairs and freezes, and that causes the soil underneath the stairs to expand and heave the entire precast bulkhead upwards. That causes the gasket to fail. One thing that's not mentioned in this page anywhere that I see is that the four bolts that hold the bulkhead to the main foundation are often failure points as well. You may see leaking inside your main basement from one of the four bolts, and our repair method will also address this. Under the Frequently Asked Questions, when it says "Can you repair any type of bulkhead?" The answer is not quite a simple yes. We can typically repair any kind of bulkhead, including pre-cast concrete, steel, and combination units; however, there are cases where a full CMU block bulkhead that is leaking may require excavation and sealing from the outside. In that case, we will let you know and can refer you to someone who can do that. Under the Featured Leaky Bulkhead Repair Projects, I see one bulkhead repair and then I see two crack injection repairs. They're not even all bulkhead repairs. They're being listed there as bulkhead repairs. 
- [ ] **Carbon Fiber Stitches** — [Preview](https://aac-astro.vercel.app/services/carbon-fiber-stitches)
  - Notes: under the "When carbon fiber is needed" section, diagonal cracks from corners of windows and doors is not a typical reason to do stitches. Let's remove that one. Under our process, step two is crack injection. We don't do that in every case, so we should say before installing stitches, we will often inject the crack to seal and fill it completely. However, for example, on a block stair step crack, we don't do that because injecting the block is pointless. Further down, we have a similar sentence: "We always combine stitches with crack injection for a complete structural and waterproof repair." That is not accurate. Let's just delete that sentence. Frequently asked questions also mentions diagonal cracks from corners, but that is not a typical reason we use carbon fiber. Let's delete that. The featured projects show projects that are not carbon fiber. Maybe it's fine; it's just a little confusing. 
- [ ] **Sewer/Conduit Repair** — [Preview](https://aac-astro.vercel.app/services/sewer-well-conduit-line-repair)
  - Notes: this one looks good. The only issue is down in the featured projects section. It just includes a bunch of projects that don't show super well or conduit line. This seems to be a recurring issue on all of them. 
- [ ] **Free Consultations** — [Preview](https://aac-astro.vercel.app/services/free-foundation-consultations)
  - Notes: in-person foundation inspections are only available in Massachusetts. The frequently asked questions: photo assessments typically get a response within minutes, and we usually have you a quote within an hour of sending us photos. In-person consultations only are offered in Massachusetts and typically take 30 minutes. There's a little bit too much emphasis on this page about the DIY thing. I think it's mentioned like four or five times. Can we pare it down a little bit? Get rid of that Frequently Asked Questions. Will you try to sell me services I don't need? I don't like that question. Get that out of there. Also, something about the DIY thing. If some old woman calls us, she's not going to want to hear about DIY, so it could be we'll talk you through DIY or what to tell a handyman for simple repairs, something like that. 

---

## Concrete Repair — MA Only (8)

- [ ] **Concrete Repair Hub** — [Preview](https://aac-astro.vercel.app/concrete-repair)
  - Notes:
- [ ] **Driveway** — [Preview](https://aac-astro.vercel.app/concrete-repair/driveway)
  - Notes:
- [ ] **Patio** — [Preview](https://aac-astro.vercel.app/concrete-repair/patio)
  - Notes:
- [ ] **Walkway** — [Preview](https://aac-astro.vercel.app/concrete-repair/walkway)
  - Notes:
- [ ] **Pool Deck** — [Preview](https://aac-astro.vercel.app/concrete-repair/pool-deck)
  - Notes:
- [ ] **Stairway** — [Preview](https://aac-astro.vercel.app/concrete-repair/stairway)
  - Notes:
- [ ] **Garage Floor** — [Preview](https://aac-astro.vercel.app/concrete-repair/garage)
  - Notes:
- [ ] **Basement Floor** — [Preview](https://aac-astro.vercel.app/concrete-repair/basement-floor)
  - Notes:

---

## Partners (5)

- [ ] **Partners Hub** — [Preview](https://aac-astro.vercel.app/partners)
  - Notes:
- [ ] **Realtors** — [Preview](https://aac-astro.vercel.app/partners/realtors)
  - Notes:
- [ ] **Home Inspectors** — [Preview](https://aac-astro.vercel.app/partners/home-inspectors)
  - Notes:
- [ ] **Contractors** — [Preview](https://aac-astro.vercel.app/partners/contractors)
  - Notes:
- [ ] **Property Managers** — [Preview](https://aac-astro.vercel.app/partners/property-managers)
  - Notes:

*6 additional partner pages (insurance adjusters, mold remediation, plumbers, landscapers, structural engineers, pest control) are drafted but unpublished — deferred to post-launch.*

---

## Updates & Blog

### Hub Pages (8)

- [ ] **Updates Hub** — [Preview](https://aac-astro.vercel.app/updates)
  - Notes:
- [ ] **Blog Index** — [Preview](https://aac-astro.vercel.app/blog)
  - Notes:
- [ ] **Category: Guides** — [Preview](https://aac-astro.vercel.app/blog/category/guides)
  - Notes:
- [ ] **Category: Case Studies** — [Preview](https://aac-astro.vercel.app/blog/category/case-studies)
  - Notes:
- [ ] **Category: Cost Guides** — [Preview](https://aac-astro.vercel.app/blog/category/cost-guides)
  - Notes:
- [ ] **Category: Tips** — [Preview](https://aac-astro.vercel.app/blog/category/maintenance-tips)
  - Notes:
- [ ] **Category: News** — [Preview](https://aac-astro.vercel.app/blog/category/news)
  - Notes:
- [ ] **Category: Foundation Types** — [Preview](https://aac-astro.vercel.app/blog/category/foundation-types)
  - Notes:

### Published Blog Posts (39 live)

- [ ] **10 Essential Tips for a Worry-Free Foundation** — [Preview](https://aac-astro.vercel.app/blog/10-essential-tips-worry-free-foundation)
  - Notes:
- [ ] **ASHI New England Conference 2024** — [Preview](https://aac-astro.vercel.app/blog/ashi-new-england-conference-2024)
  - Notes:
- [ ] **Basement Floor Crack Repair: Methods, Costs, and When to Call a Pro** — [Preview](https://aac-astro.vercel.app/blog/basement-floor-crack-repair-guide)
  - Notes:
- [ ] **Basement Floor Cracks Leaking Water** — [Preview](https://aac-astro.vercel.app/blog/basement-floor-cracks-leaking)
  - Notes:
- [ ] **Basement Leak Nightmare: Framingham Case Study** — [Preview](https://aac-astro.vercel.app/blog/basement-leak-framingham-case-study)
  - Notes:
- [ ] **Basement Waterproofing vs Foundation Repair** — [Preview](https://aac-astro.vercel.app/blog/basement-waterproofing-vs-foundation-repair)
  - Notes:
- [ ] **Bowing Basement Walls: Causes, Severity, and Repair** — [Preview](https://aac-astro.vercel.app/blog/bowing-basement-walls-causes-repair)
  - Notes:
- [ ] **Why Your Bulkhead Door Might Be Leaking** — [Preview](https://aac-astro.vercel.app/blog/bulkhead-leaking-causes-and-fixes)
  - Notes:
- [ ] **Bulkhead Repair Cost Guide 2026** — [Preview](https://aac-astro.vercel.app/blog/bulkhead-repair-cost-guide-2026)
  - Notes:
- [ ] **Bulkhead Sealant vs. Gaskets** — [Preview](https://aac-astro.vercel.app/blog/bulkhead-sealant-vs-gaskets)
  - Notes:
- [ ] **Carbon Fiber Foundation Repair** — [Preview](https://aac-astro.vercel.app/blog/carbon-fiber-foundation-repair-guide)
  - Notes:
- [ ] **Carbon Fiber Staples vs. Stitches** — [Preview](https://aac-astro.vercel.app/blog/carbon-fiber-staples-vs-stitches)
  - Notes:
- [ ] **Cement vs Concrete: What Every Homeowner Needs to Know** — [Preview](https://aac-astro.vercel.app/blog/cement-vs-concrete-homeowners-guide)
  - Notes:
- [ ] **Cinderblock (CMU) Foundation Repair** — [Preview](https://aac-astro.vercel.app/blog/cinderblock-foundation-repair-guide)
  - Notes:
- [ ] **Crumbling Foundations in MA and CT** — [Preview](https://aac-astro.vercel.app/blog/crumbling-foundations-massachusetts-connecticut)
  - Notes:
- [ ] **DIY vs Professional Foundation Repair** — [Preview](https://aac-astro.vercel.app/blog/diy-vs-professional-foundation-repair)
  - Notes:
- [ ] **Does Insurance Cover Foundation Repair?** — [Preview](https://aac-astro.vercel.app/blog/does-insurance-cover-foundation-repair)
  - Notes:
- [ ] **Driveway Crack Repair** — [Preview](https://aac-astro.vercel.app/blog/driveway-crack-repair-guide)
  - Notes:
- [ ] **Foundation Emergency: What to Do** — [Preview](https://aac-astro.vercel.app/blog/emergency-foundation-repair-what-to-do)
  - Notes:
- [ ] **Fieldstone Foundation Repair Guide** — [Preview](https://aac-astro.vercel.app/blog/fieldstone-foundation-repair-guide)
  - Notes:
- [ ] **Finished Basement Flooded in Shrewsbury** — [Preview](https://aac-astro.vercel.app/blog/finished-basement-flooded-shrewsbury)
  - Notes:
- [ ] **Foundation Repair Cost Guide 2026** — [Preview](https://aac-astro.vercel.app/blog/foundation-repair-cost-guide-2026)
  - Notes:
- [ ] **Best Time to Repair Foundation (Seasonal Guide)** — [Preview](https://aac-astro.vercel.app/blog/foundation-repair-seasonal-guide)
  - Notes:
- [ ] **Foundation Repair vs Replacement** — [Preview](https://aac-astro.vercel.app/blog/foundation-repair-vs-replacement)
  - Notes:
- [ ] **Foundation Repair Warranties Guide** — [Preview](https://aac-astro.vercel.app/blog/foundation-repair-warranty-guide)
  - Notes:
- [ ] **Foundation Settling: When to Worry** — [Preview](https://aac-astro.vercel.app/blog/foundation-settling-when-to-worry)
  - Notes:
- [ ] **Horizontal Foundation Cracks** — [Preview](https://aac-astro.vercel.app/blog/horizontal-foundation-cracks)
  - Notes:
- [ ] **How Long Does Foundation Repair Take?** — [Preview](https://aac-astro.vercel.app/blog/how-long-does-foundation-repair-take)
  - Notes:
- [ ] **How to Check Your Foundation for Problems** — [Preview](https://aac-astro.vercel.app/blog/how-to-check-your-foundation)
  - Notes:
- [ ] **How We Diagnose Foundation Problems** — [Preview](https://aac-astro.vercel.app/blog/how-we-diagnose-foundation-problems)
  - Notes:
- [ ] **Ice Dams: The Roof Problem That Wrecks Foundations** — [Preview](https://aac-astro.vercel.app/blog/ice-dam-foundation-damage)
  - Notes:
- [ ] **Leaky Bulkhead in Wilmington** — [Preview](https://aac-astro.vercel.app/blog/leaky-bulkhead-wilmington-repair)
  - Notes:
- [ ] **NAR NXT Boston 2024 Partnerships** — [Preview](https://aac-astro.vercel.app/blog/nar-nxt-boston-2024-partnerships)
  - Notes:
- [ ] **Pool Deck Crack Repair Guide** — [Preview](https://aac-astro.vercel.app/blog/pool-deck-crack-repair-guide)
  - Notes:
- [ ] **Signs of Foundation Problems** — [Preview](https://aac-astro.vercel.app/blog/signs-of-foundation-problems)
  - Notes:
- [ ] **Is Your Foundation Ready for Spring Thaw?** — [Preview](https://aac-astro.vercel.app/blog/spring-thaw-foundation-prep)
  - Notes:
- [ ] **Vertical vs. Horizontal Foundation Cracks** — [Preview](https://aac-astro.vercel.app/blog/vertical-vs-horizontal-foundation-cracks)
  - Notes:
- [ ] **Water in Basement After Rain** — [Preview](https://aac-astro.vercel.app/blog/water-in-basement-after-rain)
  - Notes:
- [ ] **Essential Winter Home Maintenance Checklist** — [Preview](https://aac-astro.vercel.app/blog/winter-home-maintenance-checklist)
  - Notes:

*1 additional post (Spring Foundation Inspection Walkthrough) auto-publishes March 24.*

*41 draft blog posts deferred to post-launch review — see "Deferred" section below.*

---

## Locations — Connecticut (21)

- [ ] **CT State Hub** — [Preview](https://aac-astro.vercel.app/connecticut)
  - Notes:
- [ ] **Bristol** — [Preview](https://aac-astro.vercel.app/connecticut/bristol)
  - Notes:
- [ ] **Cheshire** — [Preview](https://aac-astro.vercel.app/connecticut/cheshire)
  - Notes:
- [ ] **East Hartford** — [Preview](https://aac-astro.vercel.app/connecticut/east-hartford)
  - Notes:
- [ ] **Enfield** — [Preview](https://aac-astro.vercel.app/connecticut/enfield)
  - Notes:
- [ ] **Glastonbury** — [Preview](https://aac-astro.vercel.app/connecticut/glastonbury)
  - Notes:
- [ ] **Groton** — [Preview](https://aac-astro.vercel.app/connecticut/groton)
  - Notes:
- [ ] **Hartford** — [Preview](https://aac-astro.vercel.app/connecticut/hartford)
  - Notes:
- [ ] **Manchester** — [Preview](https://aac-astro.vercel.app/connecticut/manchester)
  - Notes:
- [ ] **Meriden** — [Preview](https://aac-astro.vercel.app/connecticut/meriden)
  - Notes:
- [ ] **Middletown** — [Preview](https://aac-astro.vercel.app/connecticut/middletown)
  - Notes:
- [ ] **New Britain** — [Preview](https://aac-astro.vercel.app/connecticut/new-britain)
  - Notes:
- [ ] **New Haven** — [Preview](https://aac-astro.vercel.app/connecticut/new-haven)
  - Notes:
- [ ] **New London** — [Preview](https://aac-astro.vercel.app/connecticut/new-london)
  - Notes:
- [ ] **Newington** — [Preview](https://aac-astro.vercel.app/connecticut/newington)
  - Notes:
- [ ] **Norwich** — [Preview](https://aac-astro.vercel.app/connecticut/norwich)
  - Notes:
- [ ] **Southington** — [Preview](https://aac-astro.vercel.app/connecticut/southington)
  - Notes:
- [ ] **Vernon** — [Preview](https://aac-astro.vercel.app/connecticut/vernon)
  - Notes:
- [ ] **Wallingford** — [Preview](https://aac-astro.vercel.app/connecticut/wallingford)
  - Notes:
- [ ] **West Hartford** — [Preview](https://aac-astro.vercel.app/connecticut/west-hartford)
  - Notes:
- [ ] **Wethersfield** — [Preview](https://aac-astro.vercel.app/connecticut/wethersfield)
  - Notes:

---

## Locations — Massachusetts (32)

- [ ] **MA State Hub** — [Preview](https://aac-astro.vercel.app/massachusetts)
  - Notes:
- [ ] **Trusted Partners** — [Preview](https://aac-astro.vercel.app/massachusetts/trusted-partners)
  - Notes:
- [ ] **Beverly** — [Preview](https://aac-astro.vercel.app/massachusetts/beverly)
  - Notes:
- [ ] **Boston** — [Preview](https://aac-astro.vercel.app/massachusetts/boston)
  - Notes:
- [ ] **Brockton** — [Preview](https://aac-astro.vercel.app/massachusetts/brockton)
  - Notes:
- [ ] **Brookline** — [Preview](https://aac-astro.vercel.app/massachusetts/brookline)
  - Notes:
- [ ] **Cambridge** — [Preview](https://aac-astro.vercel.app/massachusetts/cambridge)
  - Notes:
- [ ] **Fall River** — [Preview](https://aac-astro.vercel.app/massachusetts/fall-river)
  - Notes:
- [ ] **Framingham** — [Preview](https://aac-astro.vercel.app/massachusetts/framingham)
  - Notes:
- [ ] **Haverhill** — [Preview](https://aac-astro.vercel.app/massachusetts/haverhill)
  - Notes:
- [ ] **Hingham** — [Preview](https://aac-astro.vercel.app/massachusetts/hingham)
  - Notes:
- [ ] **Lawrence** — [Preview](https://aac-astro.vercel.app/massachusetts/lawrence)
  - Notes:
- [ ] **Lexington** — [Preview](https://aac-astro.vercel.app/massachusetts/lexington)
  - Notes:
- [ ] **Lynn** — [Preview](https://aac-astro.vercel.app/massachusetts/lynn)
  - Notes:
- [ ] **Marshfield** — [Preview](https://aac-astro.vercel.app/massachusetts/marshfield)
  - Notes:
- [ ] **Milton** — [Preview](https://aac-astro.vercel.app/massachusetts/milton)
  - Notes:
- [ ] **Natick** — [Preview](https://aac-astro.vercel.app/massachusetts/natick)
  - Notes:
- [ ] **Needham** — [Preview](https://aac-astro.vercel.app/massachusetts/needham)
  - Notes:
- [ ] **New Bedford** — [Preview](https://aac-astro.vercel.app/massachusetts/new-bedford)
  - Notes:
- [ ] **Newton** — [Preview](https://aac-astro.vercel.app/massachusetts/newton)
  - Notes:
- [ ] **Peabody** — [Preview](https://aac-astro.vercel.app/massachusetts/peabody)
  - Notes:
- [ ] **Plymouth** — [Preview](https://aac-astro.vercel.app/massachusetts/plymouth)
  - Notes:
- [ ] **Quincy** — [Preview](https://aac-astro.vercel.app/massachusetts/quincy)
  - Notes:
- [ ] **Salem** — [Preview](https://aac-astro.vercel.app/massachusetts/salem)
  - Notes:
- [ ] **Scituate** — [Preview](https://aac-astro.vercel.app/massachusetts/scituate)
  - Notes:
- [ ] **Shrewsbury** — [Preview](https://aac-astro.vercel.app/massachusetts/shrewsbury)
  - Notes:
- [ ] **Somerville** — [Preview](https://aac-astro.vercel.app/massachusetts/somerville)
  - Notes:
- [ ] **Taunton** — [Preview](https://aac-astro.vercel.app/massachusetts/taunton)
  - Notes:
- [ ] **Waltham** — [Preview](https://aac-astro.vercel.app/massachusetts/waltham)
  - Notes:
- [ ] **Wellesley** — [Preview](https://aac-astro.vercel.app/massachusetts/wellesley)
  - Notes:
- [ ] **Weymouth** — [Preview](https://aac-astro.vercel.app/massachusetts/weymouth)
  - Notes:
- [ ] **Worcester** — [Preview](https://aac-astro.vercel.app/massachusetts/worcester)
  - Notes:

---

## Locations — Rhode Island (11)

- [ ] **RI State Hub** — [Preview](https://aac-astro.vercel.app/rhode-island)
  - Notes:
- [ ] **Bristol** — [Preview](https://aac-astro.vercel.app/rhode-island/bristol)
  - Notes:
- [ ] **Coventry** — [Preview](https://aac-astro.vercel.app/rhode-island/coventry)
  - Notes:
- [ ] **Cranston** — [Preview](https://aac-astro.vercel.app/rhode-island/cranston)
  - Notes:
- [ ] **East Providence** — [Preview](https://aac-astro.vercel.app/rhode-island/east-providence)
  - Notes:
- [ ] **Newport** — [Preview](https://aac-astro.vercel.app/rhode-island/newport)
  - Notes:
- [ ] **North Kingstown** — [Preview](https://aac-astro.vercel.app/rhode-island/north-kingstown)
  - Notes:
- [ ] **Pawtucket** — [Preview](https://aac-astro.vercel.app/rhode-island/pawtucket)
  - Notes:
- [ ] **Providence** — [Preview](https://aac-astro.vercel.app/rhode-island/providence)
  - Notes:
- [ ] **Warwick** — [Preview](https://aac-astro.vercel.app/rhode-island/warwick)
  - Notes:
- [ ] **Woonsocket** — [Preview](https://aac-astro.vercel.app/rhode-island/woonsocket)
  - Notes:

---

## Locations — New Hampshire (11)

- [ ] **NH State Hub** — [Preview](https://aac-astro.vercel.app/new-hampshire)
  - Notes:
- [ ] **Derry** — [Preview](https://aac-astro.vercel.app/new-hampshire/derry)
  - Notes:
- [ ] **Dover** — [Preview](https://aac-astro.vercel.app/new-hampshire/dover)
  - Notes:
- [ ] **Exeter** — [Preview](https://aac-astro.vercel.app/new-hampshire/exeter)
  - Notes:
- [ ] **Hampton** — [Preview](https://aac-astro.vercel.app/new-hampshire/hampton)
  - Notes:
- [ ] **Londonderry** — [Preview](https://aac-astro.vercel.app/new-hampshire/londonderry)
  - Notes:
- [ ] **Manchester** — [Preview](https://aac-astro.vercel.app/new-hampshire/manchester)
  - Notes:
- [ ] **Nashua** — [Preview](https://aac-astro.vercel.app/new-hampshire/nashua)
  - Notes:
- [ ] **Portsmouth** — [Preview](https://aac-astro.vercel.app/new-hampshire/portsmouth)
  - Notes:
- [ ] **Rochester** — [Preview](https://aac-astro.vercel.app/new-hampshire/rochester)
  - Notes:
- [ ] **Salem** — [Preview](https://aac-astro.vercel.app/new-hampshire/salem)
  - Notes:

---

## Locations — Maine (11)

- [ ] **ME State Hub** — [Preview](https://aac-astro.vercel.app/maine)
  - Notes:
- [ ] **Biddeford** — [Preview](https://aac-astro.vercel.app/maine/biddeford)
  - Notes:
- [ ] **Gorham** — [Preview](https://aac-astro.vercel.app/maine/gorham)
  - Notes:
- [ ] **Kennebunk** — [Preview](https://aac-astro.vercel.app/maine/kennebunk)
  - Notes:
- [ ] **Kittery** — [Preview](https://aac-astro.vercel.app/maine/kittery)
  - Notes:
- [ ] **Portland** — [Preview](https://aac-astro.vercel.app/maine/portland)
  - Notes:
- [ ] **Saco** — [Preview](https://aac-astro.vercel.app/maine/saco)
  - Notes:
- [ ] **Scarborough** — [Preview](https://aac-astro.vercel.app/maine/scarborough)
  - Notes:
- [ ] **South Portland** — [Preview](https://aac-astro.vercel.app/maine/south-portland)
  - Notes:
- [ ] **Westbrook** — [Preview](https://aac-astro.vercel.app/maine/westbrook)
  - Notes:
- [ ] **York** — [Preview](https://aac-astro.vercel.app/maine/york)
  - Notes:

---

## Locations Hub (1)

- [ ] **All Locations** — [Preview](https://aac-astro.vercel.app/locations)
  - Notes:

---

## Projects (96)

> **Tip:** You don't need to review every project individually for content — they're generated from structured data. Focus on spot-checking 5-10 across different service types to verify layout, images, and summaries look right. Check any you know have real before/after photos.

- [ ] **Projects Hub** — [Preview](https://aac-astro.vercel.app/projects)
  - Notes:
- [ ] **Spot-check: Crack Injection** — [Preview](https://aac-astro.vercel.app/projects/duxbury-crack-injection-2026-03)
  - Notes:
- [ ] **Spot-check: Bulkhead** — [Preview](https://aac-astro.vercel.app/projects/groveland-bulkhead-repair-2025-08)
  - Notes:
- [ ] **Spot-check: Carbon Fiber** — [Preview](https://aac-astro.vercel.app/projects/weymouth-carbon-fiber-2025-08)
  - Notes:
- [ ] **Spot-check: Concrete Repair** — [Preview](https://aac-astro.vercel.app/projects/south-yarmouth-concrete-repair-2026-03)
  - Notes:
- [ ] **Spot-check: Sewer/Conduit** — [Preview](https://aac-astro.vercel.app/projects/burlington-sewer-conduit-2025-06)
  - Notes:
- [ ] **Spot-check: Wall Crack** — [Preview](https://aac-astro.vercel.app/projects/rockland-wall-crack-repair-2025-02)
  - Notes:
- [ ] **Spot-check: Fieldstone** — [Preview](https://aac-astro.vercel.app/projects/rockland-fieldstone-2025-08)
  - Notes:
- [ ] **Spot-check: Single image** — [Preview](https://aac-astro.vercel.app/projects/quincy-crack-injection-2025-09)
  - Notes:
- [ ] **Spot-check: Your choice**
  - Notes:

---

## Deferred to Post-Launch

### Draft Blog Posts (41)

These are complete 800-1200+ word drafts with `draft: true`. They won't appear on the live site. Review and publish post-launch per the content calendar (`docs/CONTENT-CALENDAR-2026.md`).

<details>
<summary>Click to see all 41 drafts</summary>

1. Basement Humidity Control Guide
2. Waterproofing Your Basement Before the First Freeze
3. Basement Waterproofing Cost Guide
4. Braintree Foundation Issues: South Shore
5. Brick Foundation Repair Guide
6. Concrete Driveway Repair Cost Massachusetts
7. Concrete Stair Repair Cost Guide
8. Crawl Space Foundation Problems
9. Efflorescence: White Powder on Basement Walls
10. Fall Foundation Inspection Checklist
11. Does Flex Seal Work on Basement Cracks?
12. Foundation Crack Repair Before Winter
13. Foundation Repair Cost in Quincy MA
14. Buying a Home With Foundation Issues
15. Foundation Repair for Realtors
16. Foundation Repair for Home Sellers
17. Foundation Repair Myths
18. French Drain vs. Crack Injection
19. Garage Floor Crack Repair
20. Hartford Area Foundation Problems
21. How to Choose a Foundation Repair Contractor
22. Lally Columns Guide
23. Massachusetts Concrete Repair Guide
24. Musty Smell in Your Basement?
25. Nashua and Southern NH Foundation Repair
26. New England Foundation Types Visual Guide
27. Patio Crack Repair Guide
28. Portland ME Foundation Repair
29. Poured Concrete Foundation Repair
30. How to Prevent Basement Flooding
31. Providence RI Foundation Challenges
32. Quincy Foundation Repair: Coastal Homes
33. Selling a House with Foundation Issues
34. South Shore Foundation Problems
35. Stone Foundation Repair Guide
36. Summer Foundation Maintenance Guide
37. Sump Pump vs. Crack Injection
38. Thanksgiving Basement Check
39. Weymouth Foundation Repair: South Shore
40. What Does Foundation Repair Look Like?
41. Year-End Home Maintenance: Foundation Edition

</details>

### Unpublished Partner Pages (6)

Insurance Adjusters, Mold Remediation, Plumbers, Landscapers, Structural Engineers, Pest Control — drafted, publish post-launch.

---

## Summary

| Section | Pages | Status |
|---------|-------|--------|
| Core Pages | 5 | Review |
| Services | 7 | Review |
| Concrete Repair | 8 | Review |
| Partners | 5 | Review |
| Updates/Blog Hubs | 8 | Review |
| Published Blog Posts | 39 | Review |
| Locations | 87 | Review (spot-check cities, review all hubs) |
| Projects | 96 | Spot-check 8-10 |
| **Total to review** | **~255** | |
| Draft Blog Posts | 41 | Post-launch |
| Draft Partners | 6 | Post-launch |
