# Surrey Contracting Limited SEO Action Plan

Audit date: 2026-06-17  
Target: https://surreycontracting.co.uk/  
Overall SEO Health Score: 70/100

## Priority Definitions

- Critical: blocks indexing or creates a penalty-level risk.
- High: materially affects crawl quality, trust, rankings, conversions, or AI discoverability.
- Medium: meaningful optimisation opportunity.
- Low: useful cleanup or backlog hardening.

## Critical

[Certain] No Critical issues were verified. The site is crawlable, indexable, has a working sitemap, and does not expose accidental `noindex` tags on crawled pages.

## High Priority

### 1. Consolidate Canonical URL Variants

Status: [Certain] Verified issue  
Evidence: `https://www.surreycontracting.co.uk/` returns 200. Trailing-slash variants such as `/about/` return 200 while canonicals point to `/about`. Sitemap submits trailing-slash URLs.

Recommended fix:

- Add a 301 redirect from `www.surreycontracting.co.uk` to `surreycontracting.co.uk`.
- Choose one trailing-slash policy.
- Align sitemap URLs, canonical tags, internal links, and server redirects to the same policy.

Likely files/config:

- `deploy/nginx.conf`
- `astro.config.mjs`
- `src/layouts/BaseLayout.astro`

Acceptance checks:

- `curl -I https://www.surreycontracting.co.uk/` returns 301 to `https://surreycontracting.co.uk/`.
- `curl -I https://surreycontracting.co.uk/about/` redirects to the chosen canonical URL, or canonicals/sitemap are changed to match trailing slash URLs.
- Sitemap lists only canonical URLs.

### 2. Fix The Internal `/index` 404

Status: [Certain] Verified issue  
Evidence: `src/pages/about.astro:95-96` links to `/index#quote` and `/index#projects`; production `/index` returns 404.

Recommended fix:

- Change `/index#quote` to `/#quote`.
- Change `/index#projects` to `/#projects`.

Acceptance checks:

- Crawl finds no internal `/index` URL.
- `curl -I https://surreycontracting.co.uk/index` can remain 404 as long as nothing links to it.

### 3. Fix Dead URLs In `llms.txt`

Status: [Certain] Verified issue  
Evidence: `public/llms.txt` links to `/services.html`, `/projects.html`, `/contact.html`, etc. These return 404 on production.

Recommended fix:

- Replace `.html` URLs with extensionless canonical URLs:
  - `https://surreycontracting.co.uk/services`
  - `https://surreycontracting.co.uk/sectors`
  - `https://surreycontracting.co.uk/projects`
  - `https://surreycontracting.co.uk/about`
  - `https://surreycontracting.co.uk/health-safety`
  - `https://surreycontracting.co.uk/contact`

Acceptance checks:

- Every URL in `https://surreycontracting.co.uk/llms.txt` returns 200 or a deliberate canonical 301.

### 4. Remove The Live Sample Case Study

Status: [Certain] Verified issue  
Evidence: `/projects/commercial-cut-fill-cobham` includes: `This is a sample case study created to verify the Studio-to-website pipeline.`

Recommended fix:

- Replace the body with real case-study copy, or unpublish/remove the page until it is ready.
- Add concrete details: brief, site constraints, scope, plant/materials, timeline, outcome, and location relevance.

Acceptance checks:

- Page no longer includes sample/placeholder text.
- Page has at least 500 useful words or a genuinely complete case-study structure.

### 5. Reduce Homepage Mobile Payload And LCP

Status: [Certain] Verified issue  
Evidence: Mobile Lighthouse performance 75, LCP 10.3s, total byte weight 4,644 KB. Lighthouse estimates 1.55 MB image savings.

Recommended fix:

- Convert large JPG/PNG assets to properly sized WebP/AVIF variants.
- Use a responsive image element for the hero image where possible, rather than only a CSS background.
- Preload the actual mobile LCP image.
- Lazy-load below-fold imagery.
- Compress/resize `/assets/img/coverage-map.png`, `/assets/img/hard-landscaping.jpg`, `/assets/img/brickwork.jpeg`, `/assets/img/bulk-earthworks.jpg`, `/assets/img/block-paving.jpeg`, `/assets/img/surfacing.jpg`, and `/assets/img/groundworks.webp`.

Acceptance checks:

- Mobile Lighthouse homepage performance reaches 85+.
- Mobile LCP falls below 2.5s in lab or a clearly improved repeatable local run.
- Homepage transferred bytes drop materially from 4.6 MB.

## Medium Priority

### 6. Fix Homepage Heading Semantics

Status: [Certain] Verified issue  
Evidence: Homepage exposes two H1s, including inactive slider text parsed as `A`.

Recommended fix:

- Keep one H1 on the homepage.
- Convert secondary/inactive hero slide headings to `p`, `div`, or `h2` depending on the intended hierarchy, while preserving visual styling.
- Hide inactive slider content from assistive tech if it should not be read until active.

Acceptance checks:

- Crawl reports one homepage H1.
- Lighthouse no longer reports the current heading-order failures, or remaining failures are consciously accepted.

### 7. Tighten Titles And Meta Descriptions

Status: [Certain] Verified issue  
Evidence: Several titles and meta descriptions exceed practical SERP lengths or are too generic.

Recommended fix:

- Rewrite homepage title around local service intent, for example: `Groundworks, Surfacing & Demolition Contractors in Surrey`.
- Keep key title tags roughly under 60 to 65 characters where possible.
- Keep meta descriptions roughly 140 to 160 characters, with service, location, and proof.

Acceptance checks:

- No key commercial page has an overlong title/meta unless there is a deliberate reason.

### 8. Strengthen Project Pages As Proof Assets

Status: [Certain] Verified issue  
Evidence: 8 of 11 project pages are under 300 words. `/projects` is 290 words.

Recommended fix:

- Give every project page a consistent structure:
  - Brief
  - Site constraints
  - Scope of works
  - Plant/materials used
  - Delivery process
  - Outcome
  - Related service links
- Add summaries/outcomes to project index cards.
- Link from service pages to relevant projects.

Acceptance checks:

- Priority project pages are 500+ useful words or complete enough to answer buyer questions.
- Service pages include relevant project links.

### 9. Add Project And Local Entity Schema

Status: [Likely] Opportunity  
Evidence: All project detail pages have `jsonld_count: 0`. Homepage LocalBusiness schema is valid but thin.

Recommended fix:

- Add project-page JSON-LD where it maps honestly to the content.
- Expand LocalBusiness schema with:
  - `sameAs`
  - `logo`
  - `image`
  - `geo`
  - `openingHoursSpecification`
  - `priceRange`
  - company registration/VAT identifiers where appropriate
- Add breadcrumbs to non-service pages.

Acceptance checks:

- JSON-LD parses.
- Rich Results validator or schema validator shows no syntax errors.

### 10. Make Review And Accreditation Proof Verifiable

Status: [Likely] Opportunity  
Evidence: Homepage claims `5-star client rating`, but no visible Google Business Profile/review source was found.

Recommended fix:

- Link to Google Business Profile if available.
- Show source and count for any rating claim.
- Add accreditation text near logo carousels so names are crawlable even if images are decorative.

Acceptance checks:

- Rating claims have a visible source.
- Accreditation/client names are visible as text or meaningful alt text.

### 11. Fix Mobile First-Viewport Overflow

Status: [Certain] Verified issue  
Evidence: `screenshots/home-mobile.png` shows hero eyebrow, H1, and intro copy clipped at 390px viewport.

Recommended fix:

- Rework narrow-screen hero typography and spacing.
- Remove or override nowrap behaviour that forces horizontal overflow.
- Test at 360px, 390px, and 430px widths.

Acceptance checks:

- No first-viewport horizontal clipping on mobile screenshots.
- Page has no horizontal scroll at common mobile widths.

### 12. Improve Image Alt And Dimensions

Status: [Certain] Verified issue  
Evidence: 27 empty alt attributes, mostly client/accreditation logos. Lighthouse also reports unsized image issues.

Recommended fix:

- Add meaningful alt text to trust/proof logos, or keep `alt=""` only when the same name is visible nearby as text.
- Add width/height attributes for image tags where applicable.

Acceptance checks:

- Crawl finds no trust logos with empty alt unless adjacent text covers the same information.
- Lighthouse unsized-image warning is reduced.

## Low Priority

### 13. Add Security Headers

Status: [Certain] Verified issue  
Evidence: Live responses lack common hardening headers.

Recommended fix:

- Add HSTS after confirming HTTPS is stable.
- Add `X-Content-Type-Options: nosniff`.
- Add `Referrer-Policy`.
- Add a cautious `Permissions-Policy`.
- Consider `Content-Security-Policy` only after testing forms, inline scripts, fonts, and images.

Acceptance checks:

- `curl -I https://surreycontracting.co.uk/` shows intended headers.

### 14. Reduce CSS Waste

Status: [Certain] Verified issue  
Evidence: Lighthouse estimates 31 to 34 KB unused CSS on the homepage and 14 KB minification savings.

Recommended fix:

- Minify `styles.css`.
- Consider route-level CSS only if it can be done without making the Astro site harder to maintain.

Acceptance checks:

- CSS transfer size drops.
- Lighthouse unused/minified CSS warnings improve.

### 15. Build Location And Subservice Content Deliberately

Status: [Likely] Opportunity  
Evidence: The site mentions towns and subservices but does not have dedicated support pages for many of them.

Recommended fix:

- Prioritise pages by actual commercial intent, not by generating thin location pages.
- Best first candidates:
  - Groundworks contractors Cobham
  - Commercial surfacing Surrey
  - Drainage contractors Surrey
  - Tarmac driveways Leatherhead/Cobham
  - Site clearance Surrey

Acceptance checks:

- Each new page has unique project proof, service detail, and local relevance.
- No doorway-style pages.

## Suggested Implementation Order

1. Fix `/index` CTAs and `llms.txt` URLs.
2. Replace the sample project content.
3. Add canonical host/trailing-slash redirects and align sitemap/canonicals.
4. Compress/responsive-load homepage images and fix mobile hero overflow.
5. Clean homepage H1/heading semantics.
6. Improve project proof content and service-to-project internal links.
7. Add richer LocalBusiness/project schema.
8. Add review/GBP proof and accreditation text.
9. Add security headers and CSS minification.

## Verification Checklist

Run after changes:

```bash
npm run build
curl -I https://www.surreycontracting.co.uk/
curl -I https://surreycontracting.co.uk/about/
curl -I https://surreycontracting.co.uk/index
curl -sS https://surreycontracting.co.uk/llms.txt
npx --yes lighthouse@latest https://surreycontracting.co.uk/ --only-categories=performance,seo,accessibility,best-practices --output=json --output-path=/tmp/surrey_lighthouse_mobile_after.json --quiet
```

Manual checks:

- Re-crawl internal links and confirm no self-created 404s.
- Re-check sitemap URLs against canonical tags.
- Capture mobile screenshots at 360px, 390px, and 430px.
- Validate JSON-LD after schema changes.

## PDF Report Note

[Certain] The audit skill recommends a PDF report. The referenced generator script was not present, so this action plan and `FULL-AUDIT-REPORT.md` are the completed artifacts for this pass. A PDF can be generated from these Markdown files next.
