# Surrey Contracting Limited SEO Audit

Audit date: 2026-06-17  
Audited target: https://surreycontracting.co.uk/  
Detected business type: [Likely] Local service contractor, service-area/hybrid construction business  
Overall SEO Health Score: 70/100

## Executive Summary

[Certain] The site is crawlable, indexable, fast enough on desktop, and has a solid base for a local service business. The problem is not basic discoverability. The problem is consistency and proof: duplicate host/slash variants are live, one internal CTA path creates a 404, `llms.txt` points AI crawlers to dead URLs, one case study contains sample content, and mobile performance is dragged down by large images.

No verified Critical issues were found. Critical means indexing is blocked, pages are noindexed by mistake, robots blocks important sections, or the site returns widespread non-200 status codes. That is not the case here.

## Score Breakdown

| Category | Weight | Score | Notes |
|---|---:|---:|---|
| Technical SEO | 22% | 72 | [Certain] Robots and sitemap are reachable, but duplicate `www`, trailing-slash duplication, one internal 404, and missing security headers reduce trust. |
| Content Quality | 23% | 68 | [Certain] Core service copy is usable, but case studies are thin and one live project has sample content. |
| On-Page SEO | 20% | 73 | [Certain] Titles, metas, canonicals, and H1s mostly exist, but homepage has two H1s and several snippets are too long or generic. |
| Schema / Structured Data | 10% | 65 | [Certain] Homepage LocalBusiness and service schema parse cleanly. [Likely] Project and richer local entity schema are missing opportunities. |
| Performance | 10% | 74 | [Certain] Desktop Lighthouse performance is 93. Mobile is 75 with 10.3s LCP in lab conditions. |
| AI Search Readiness | 10% | 70 | [Certain] AI crawler access is open and `llms.txt` exists, but `llms.txt` links are broken and entity proof is under-modelled. |
| Images | 5% | 62 | [Certain] Lighthouse estimates 1.55 MB image savings, and 27 client/accreditation images have empty alt text. |

Weighted score: 70/100.

## Evidence Collected

- [Certain] Crawled 25 internal URLs from production, including 24 valid HTML pages and one self-created 404 at `/index`.
- [Certain] `robots.txt` returned 200 and allows standard crawlers plus GPTBot, ClaudeBot, PerplexityBot, and Google-Extended.
- [Certain] Sitemap index and child sitemap returned 200. Child sitemap lists 24 URLs.
- [Certain] `npm run build` passed locally.
- [Certain] Lighthouse 13.4.0 was run on the homepage:
  - Mobile: Performance 75, SEO 100, Accessibility 87, Best Practices 96.
  - Desktop: Performance 93, SEO 100, Accessibility 87, Best Practices 96.
- [Certain] Screenshots were captured:
  - `screenshots/home-desktop.png`
  - `screenshots/home-mobile.png`
- [Certain] DataForSEO, Google Search Console, GA4, and backlink API integrations were not used. The relevant helper scripts were not present in the skill directory or repo, and no DataForSEO tool was exposed in this session.

## Top Issues

1. [Certain] `www.surreycontracting.co.uk` returns 200 instead of redirecting to the non-www canonical host. This creates duplicate crawlable host variants.
2. [Certain] The sitemap submits trailing-slash URLs, but canonicals use no trailing slash, and both variants return 200.
3. [Certain] About page CTAs link to `/index#quote` and `/index#projects`, creating a live `/index` 404.
4. [Certain] `public/llms.txt` sends AI crawlers to `.html` URLs that return 404.
5. [Certain] `/projects/commercial-cut-fill-cobham` contains live sample case-study text.
6. [Certain] Mobile Lighthouse shows a 10.3s LCP and 4.6 MB homepage transfer, mostly image weight.
7. [Certain] Homepage exposes two H1s, with the inactive slider H1 parsed as `A`.
8. [Certain] Project pages are thin, and all project detail pages have no JSON-LD.
9. [Certain] 27 client/accreditation images have empty alt text.
10. [Likely] On-site review/GBP proof is weaker than the claimed `5-star client rating`.

## Technical SEO

### Crawlability And Indexability

[Certain] The production site is broadly crawlable. Robots allows all crawlers, the sitemap is reachable, and 24 sitemap URLs returned 200 during the crawl.

[Certain] There is one internal 404: `https://surreycontracting.co.uk/index`. It is linked from `src/pages/about.astro` via `/index#quote` and `/index#projects`. Because fragments are not sent to the server, the browser requests `/index`, which returns 404.

[Certain] Legacy project redirects are working as 301s, for example `/project-tarmac-driveway` redirects to `/projects/tarmac-driveway`.

### Canonicals And URL Consolidation

[Certain] Canonical tags point to the non-www, no-trailing-slash URL pattern, for example `https://surreycontracting.co.uk/about`.

[Certain] The live host still serves duplicate URL variants:

- `https://www.surreycontracting.co.uk/` returns 200 instead of 301 redirecting to `https://surreycontracting.co.uk/`.
- `https://surreycontracting.co.uk/about/` returns 200 while the canonical points to `https://surreycontracting.co.uk/about`.
- The sitemap lists trailing-slash URLs such as `https://surreycontracting.co.uk/about/`.

[Likely] The cause is the combination of `@astrojs/sitemap` defaults in `astro.config.mjs`, no-slash canonical construction in `src/layouts/BaseLayout.astro`, and an nginx config that serves both `surreycontracting.co.uk` and `www.surreycontracting.co.uk` in the same block.

### Security Headers

[Certain] Homepage responses do not include the following headers:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`

[Certain] `Server: nginx/1.24.0 (Ubuntu)` exposes server/version detail. This is not a ranking issue by itself, but it is a hardening issue.

## Content Quality

[Certain] The core service pages are not thin. Word counts from the crawl:

- `/demolition`: 797 words
- `/groundworks`: 622 words
- `/earthworks`: 614 words
- `/surfacing`: 674 words

[Certain] The proof layer is weaker:

- `/projects` has 290 words.
- 8 of 11 project detail pages are under 300 words.
- `/projects/commercial-cut-fill-cobham` has 211 words and includes the text: `This is a sample case study created to verify the Studio-to-website pipeline.`

[Likely] This matters because a construction/local-service site needs proof close to the buying decision. Thin case studies make the site look less experienced than the homepage claims.

## On-Page SEO

### Titles And Meta Descriptions

[Certain] Every crawled 200 HTML page had a title and meta description.

[Certain] Several snippets should be tightened:

- Homepage title: 74 characters.
- `/projects/landscape-guildford` title: 72 characters.
- `/projects/concrete-base-cobham` title: 75 characters.
- Homepage meta description: 173 characters.
- `/surfacing` meta description: 169 characters.
- `/about` meta description: 201 characters.
- `/privacy` meta description: 166 characters.

[Likely] The issue is not that these are invalid. The issue is that Google may truncate them, and the homepage/title snippets could carry stronger local-service intent.

### Headings

[Certain] Homepage has two H1s in source:

- `Built on Experience.`
- `A`, from the inactive slider headline `A [rotating word] contractor for any site.`

[Certain] Lighthouse also reports non-sequential heading order on the homepage, including process-card `h4` elements and footer `h5` elements.

[Likely] The simplest fix is to keep one true H1 for the page and change inactive/secondary hero slide headings to non-H1 elements styled the same way.

### Internal Linking

[Certain] The site has a clear top-level navigation. [Likely] Internal linking into proof pages is still light. Several project pages receive only one internal link in the crawl, mostly from the project index.

[Likely] Service pages should link to relevant case studies directly, for example surfacing pages to tarmac/road/car park projects, groundworks pages to drainage/foundation projects, and earthworks pages to cut/fill/site clearance projects.

## Schema And Structured Data

[Certain] JSON-LD parses cleanly where present:

- Homepage: `LocalBusiness`
- `/demolition`, `/groundworks`, `/earthworks`, `/surfacing`: `Service` and `BreadcrumbList`

[Certain] 19 valid 200 pages have no JSON-LD, including all project detail pages.

[Likely] Best opportunities:

- Add richer `LocalBusiness` fields: `sameAs`, `logo`, `image`, `geo`, `openingHoursSpecification`, `priceRange`, company identifiers, and social profile links.
- Add `BreadcrumbList` to more pages.
- Add `CreativeWork`, `Article`, or a carefully modelled case-study schema pattern for project detail pages.
- Add `Review` or `AggregateRating` only if the review source and count are legitimate and visible on-page.

## Performance

[Certain] Lighthouse homepage results:

| Metric | Mobile | Desktop |
|---|---:|---:|
| Performance score | 75 | 93 |
| Largest Contentful Paint | 10.3s | 1.8s |
| Total Blocking Time | 0ms | 0ms |
| Cumulative Layout Shift | 0.01 | 0.007 |
| Total byte weight | 4,644 KB | 4,644 KB |

[Certain] Largest homepage resources include:

- `/assets/img/coverage-map.png`: 860 KB
- `/assets/img/hard-landscaping.jpg`: 838 KB
- `/assets/img/brickwork.jpeg`: 635 KB
- `/assets/img/bulk-earthworks.jpg`: 596 KB
- `/assets/img/block-paving.jpeg`: 567 KB
- `/assets/img/surfacing.jpg`: 476 KB
- `/assets/img/groundworks.webp`: 339 KB

[Certain] Lighthouse estimates 1.55 MB of image delivery savings and about 31 to 34 KB of unused CSS on the homepage.

[Likely] The LCP problem is the hero background image being delivered as a CSS background rather than a responsive/preloadable image with mobile-appropriate variants.

## Visual And Mobile UX

[Certain] The desktop first viewport renders correctly.

[Certain] The mobile screenshot at 390x844 shows first-viewport horizontal clipping: the hero eyebrow, H1, and intro copy extend beyond the viewport. This is visible in `screenshots/home-mobile.png`.

[Likely] The root causes are large hero type, `white-space: nowrap` behaviour in hero elements, and text sized for visual drama rather than narrow screens.

## Images

[Certain] The crawl found 105 images and 27 empty alt attributes.

[Certain] The empty alt attributes are mostly client logos and accreditation logos:

- Homepage client logos: DHL, Southbank, Environment Agency, Gratte Brothers, Coin Street, Hunter Hyland, Penningtons, Easigrass, OCB, Denville, Property Management Hampshire.
- Accreditation logos: CHAS, SafeContractor, SSIP, SMAS, CITB, CSCS, NPORS, IPAF.
- The same accreditation logo issue appears on `/health-safety`.

[Likely] If these logos are decorative, the names must still be present nearby as crawlable text. If they are trust evidence, they should have meaningful alt text.

## AI Search Readiness

[Certain] Positive signals:

- `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, and Google-Extended.
- `llms.txt` exists and is served at 200.
- NAP is consistent across homepage schema, footer, contact page, policy pages, and `llms.txt`.

[Certain] Weak signals:

- `llms.txt` key pages use `.html` URLs that return 404.
- Project pages have strong local proof potential but no schema.
- LocalBusiness schema lacks `sameAs`, `geo`, `openingHoursSpecification`, `logo`, `image`, `priceRange`, and company identifiers.
- Homepage claims a `5-star client rating`, but no visible Google Business Profile/review source is linked.

## Local SEO

[Certain] NAP consistency is good:

- Phone: `01932 932650`
- Address: `Upper Leewood Farm Yard, Effingham Common Road, Leatherhead, KT24 5JQ`
- Business name: `Surrey Contracting Limited`

[Likely] The site is missing stronger local proof:

- No visible Google Business Profile link.
- No review count/source attached to the `5-star client rating`.
- No dedicated high-intent location/service pages for places already mentioned, such as Cobham, Leatherhead, Guildford, Woking, Epsom, Reigate, Dorking, Weybridge, Kingston, and Redhill.

## Quick Wins

1. [Certain] Change `/index#quote` and `/index#projects` to `/#quote` and `/#projects`.
2. [Certain] Update `public/llms.txt` to use extensionless URLs.
3. [Certain] Replace or remove the sample case-study copy on `/projects/commercial-cut-fill-cobham`.
4. [Certain] Redirect `www` to non-www and choose one trailing-slash policy.
5. [Certain] Compress/resize homepage images, especially hero and map imagery.

## PDF Report

[Certain] The skill recommends a PDF report, but the referenced `scripts/google_report.py` helper was not present. A PDF can still be generated from these Markdown artifacts in a follow-up pass.
