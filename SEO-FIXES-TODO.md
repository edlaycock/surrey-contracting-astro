# SEO / AEO / GEO Fix Backlog — Surrey Contracting

Consolidated from the GEO, AEO and site-crawl audits (2026-06-09). Not yet applied.
Companion detail: `GEO-ANALYSIS.md`. Work top-down; each item notes the likely file.

Scores at time of audit: **GEO 59/100 · AEO 45/60 (75%)**.
Root cause behind most issues: **Demolition is in the human-facing site but missing
from the machine-readable layer**, and **the sitemap/canonical point at the not-yet-live
production domain**.

---

## 🔴 Critical

- [ ] **1. Add Demolition to the machine-readable layer.** Currently absent from:
  - Homepage JSON-LD `OfferCatalog` — only lists Groundworks, Bulk Earthworks, Commercial Surfacing, Residential Driveways & Paving. Add a 5th `Service` + `Offer` for Demolition. *(file: `src/pages/index.astro` head JSON-LD, or wherever the LocalBusiness/OfferCatalog is built)*
  - Homepage `<title>` — add Demolition. *(`src/pages/index.astro` BaseLayout title)*
  - Homepage meta description + `og:description` — currently "Groundworks, bulk earthworks and commercial surfacing…". *(same)*

- [ ] **2. Rewrite `/llms.txt`** — it still describes the OLD static site: lists `.html`
  URLs (`services.html`, `about.html`…), omits Demolition and the four service-detail
  pages. Corrected template is in `GEO-ANALYSIS.md` §10. *(file: `public/llms.txt`)*

- [ ] **3. Fix the sitemap/robots domain mismatch.** `robots.txt` `Sitemap:` and every
  `<loc>` in the sitemap point to `https://surreycontracting.co.uk/...` (production, not
  live yet) → all 24 URLs + the sitemap reference currently 404 for crawlers. Either
  (a) accept this and resolve when DNS cuts over, or (b) make the `site` config emit the
  staging host until then. *(files: `astro.config.*` `site:`, `public/robots.txt`)*

- [ ] **4. Resolve the duplicate project-URL patterns.** 9 old static `/project-*` pages
  coexist with the new Sanity `/projects/<slug>`. Flip `/projects` fully to Sanity and add
  **301 redirects** `/project-* → /projects/<slug>`. *(files: old `src/pages/project-*.astro`,
  nginx/Astro redirects, `projects.astro`)*

---

## 🟡 High

- [ ] **5. Add JSON-LD to `/services`, `/about`, `/contact`, `/projects`** — currently no
  structured data on these (only homepage + the four service-detail pages have it).
- [ ] **6. Add FAQ blocks + `FAQPage` schema** to each service page (question-based H3s).
  Zero question-style headings site-wide today; matches AI Overview query patterns.
- [ ] **7. Fix social links + add `sameAs`.** Footer LinkedIn/Instagram/Facebook are dead
  placeholders (`href="#"`). Point them at real profiles and add `sameAs` (GBP, LinkedIn,
  YouTube, Checkatrade) to the `LocalBusiness` node. *(files: `src/components/Footer.astro`,
  homepage JSON-LD)*
- [ ] **8. Collapse homepage to a single `<h1>`.** The hero slider renders one `<h1>` per
  slide (two total). Make slide 2 a `<p>`/`<span>` or `<h2>`. *(file: `src/pages/index.astro`)*
- [ ] **9. Add `review` / `aggregateRating` schema** — the homepage claims "5★ client
  rating" in copy but it's not in schema. Only add if backed by genuine reviews.

---

## 🟢 Medium

- [ ] **10. Add `/llms-full.txt`** (currently 404) — fuller content dump for LLMs.
- [ ] **11. Make service-page intros answer-first.** Lead with a one-line definition
  (e.g. "Bulk earthworks (cut and fill) is…") + 2-3 specific sourced stats; target
  134-167 word self-contained blocks for AI citation.
- [ ] **12. Re-check canonical tags** after DNS cutover (they point to production now).
- [ ] **13. Explicitly list `OAI-SearchBot`, `ChatGPT-User`, `Bingbot`** in robots.txt
  (currently only covered by the catch-all `*`).

---

## Off-site (not code — for client / marketing)

- [ ] **14. Google Business Profile** — complete/optimise, add Demolition as a category,
  photos, posts. Highest local-AI lever.
- [ ] **15. YouTube** — 3-5 short project videos (cut/fill, car-park resurface, demolition).
  Strongest brand-mention correlation with AI citations.
- [ ] **16. Local citations** — Checkatrade, FMB, Yell, Bark with identical NAP
  (01932 932650 / Upper Leewood Farm Yard, Effingham Common Road, Leatherhead, KT24 5JQ).

---

## Already strong (no action)
- Server-side rendering — full HTML, AI-crawler friendly (Astro static).
- Core schema — LocalBusiness, Service ×4, OfferCatalog, GeoCircle, BreadcrumbList.
- AI crawlers allowed (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).
- NAP consistent across pages; HTTPS; viewport; clean URLs; descriptive titles/meta.
