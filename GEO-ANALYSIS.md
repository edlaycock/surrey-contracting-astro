# GEO / AI-Search Analysis — Surrey Contracting

**Site analysed:** https://surreycontracting.cumulusdigital.co.uk (live staging)
**Date:** 2026-06-09
**Stack:** Astro (static prerender) + JSON-LD + nginx

---

## 1. GEO Readiness Score: 59 / 100

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Citability | 25% | 14/25 | Good service paragraphs; no definitions, answer-blocks or sourced stats |
| Structural readability | 20% | 13/20 | Clean hierarchy + lists, but **two `<h1>`** and no question/FAQ headings |
| Multi-modal | 15% | 8/15 | Images present; no video, infographics or data charts |
| Authority & brand | 20% | 10/20 | Strong schema, but Demolition missing; no dates; minimal off-site mentions |
| Technical accessibility | 20% | 14/20 | SSR excellent; crawlers allowed; **llms.txt stale**, **sitemap 404** |

---

## 2. Platform Breakdown

| Platform | Score | Why |
|----------|-------|-----|
| **Google AI Overviews** | 64/100 | Strong LocalBusiness/Service schema + true SSR. Held back by incomplete schema (no Demolition), 404 sitemap, no FAQ blocks. |
| **ChatGPT (search)** | 50/100 | Cites Wikipedia (~48%) and Reddit (~11%). No entity presence off-site. llms.txt present but stale. |
| **Perplexity** | 47/100 | Reddit-led (~47%). No community footprint. Clean content helps but discovery weak. |
| **Bing Copilot** | 55/100 | SSR + schema help; needs Bing indexing + IndexNow once on the live domain. |

---

## 3. AI Crawler Access Status

`robots.txt` explicitly **allows** the key crawlers — good:

| Crawler | Status |
|---------|--------|
| GPTBot (OpenAI) | ✅ Allowed |
| ClaudeBot (Anthropic) | ✅ Allowed |
| PerplexityBot | ✅ Allowed |
| Google-Extended | ✅ Allowed |
| OAI-SearchBot | ⚠️ Not named (falls under `*: Allow /`, so OK, but list it explicitly) |
| ChatGPT-User | ⚠️ Not named (same) |
| Bingbot | ⚠️ Not named |

**Issue:** `Sitemap: https://surreycontracting.co.uk/sitemap-index.xml` → **HTTP 404**. The referenced sitemap is on the not-yet-live production domain and doesn't resolve. AI/search crawlers following robots.txt hit a dead end.

---

## 4. llms.txt Status — PRESENT BUT STALE (high priority)

`/llms.txt` exists (good), but it describes the **old static site**, not the current Astro build:

- **Wrong URLs:** lists `services.html`, `about.html`, `contact.html` etc. The live site uses clean URLs (`/services`, `/about`, `/contact`, plus `/groundworks`, `/earthworks`, `/surfacing`, `/demolition`).
- **Missing Demolition** entirely — the newly added 4th core service is absent.
- **Lists the email** that was just removed from the customer-facing site (minor inconsistency).
- Individual service pages (`/demolition`, `/groundworks`, `/earthworks`, `/surfacing`) are not linked.

A corrected template is in section 10.

---

## 5. Brand Mention Analysis

Brand mentions now correlate ~3× more strongly with AI citation than backlinks. For a local contractor this is the biggest off-site lever.

| Signal | Likely status | Action |
|--------|---------------|--------|
| Wikipedia / Wikidata | None (expected for an SMB) | Not realistic short-term; skip |
| Google Business Profile | Verify/optimise | **Highest local-AI lever** — complete profile, categories incl. Demolition, photos, posts |
| YouTube | Likely none | Post 3-5 short project videos (cut/fill, car-park resurface, demolition) — strongest citation correlation |
| Reddit / forums | Likely none | Genuine answers in r/DIYUK, r/HomeImprovementUK, local subs |
| LinkedIn | Verify | Company page + project posts |
| Local citations (Checkatrade, Yell, FMB, Bark) | Verify NAP consistency | Ensure name/address/phone identical to site |

> Note: off-site presence was not crawled in this pass — verify each and treat "likely" as a prompt to check.

---

## 6. Passage-Level Citability

Optimal AI-citation block = **134–167 words, self-contained, answers in the first 40–60 words.** Current service intros are close in length but are descriptive rather than answer-first, and carry no stats or definitions.

**Reformat opportunities (add, don't replace):**
- Lead each service page with a one-line definition: *"Bulk earthworks (cut and fill) is the large-scale moving of soil and rock to bring a site to the right level for construction."*
- Add 2-3 specific, quotable facts with numbers (plant sizes, typical timescales, tonnage, years, project counts).
- Add an FAQ block per service page (see §8).

---

## 7. Server-Side Rendering Check ✅

Astro static prerender means **all body content is in the raw HTML** — verified (service names, copy and JSON-LD all present without JavaScript). This is the single biggest technical strength: AI crawlers (which do not run JS) get the full page. No action needed.

---

## 8. Top 5 Highest-Impact Changes

1. **Add Demolition to the machine-readable layer.** It's in the nav/footer/tiles but missing from: JSON-LD `OfferCatalog` (still lists Groundworks, Bulk Earthworks, Commercial Surfacing, Residential Driveways & Paving), the homepage `<title>`, and the meta description. AI/search see only the old four.
2. **Rewrite `/llms.txt`** with clean URLs + Demolition (template below).
3. **Fix the robots.txt sitemap** — point to a sitemap that resolves (and generate `/sitemap-index.xml` for the live host), so crawlers can discover all pages.
4. **Resolve the double `<h1>`** on the homepage (the two hero slides each render an `<h1>`). One H1 per page; make slide 2's a `<p>`/`<span>` or `<h2>`.
5. **Add FAQ blocks** (question-based H3s) to each service page — directly matches AI Overview query patterns and is currently absent (zero question headings site-wide).

---

## 9. Schema Recommendations

Current schema is genuinely strong (LocalBusiness, Service ×4, OfferCatalog, GeoCircle, PostalAddress, BreadcrumbList). Gaps:

- **Add a 5th `Service` + `Offer` for Demolition** in the homepage `OfferCatalog`, and confirm `/demolition` emits its own `Service` schema (it does emit Service + BreadcrumbList — good).
- **Add `FAQPage` schema** on service pages once FAQ copy exists (informational, supports AI extraction).
- **Add `sameAs`** to the `LocalBusiness` node linking Google Business Profile, LinkedIn, YouTube, Checkatrade — entity reconciliation across platforms.
- **Add `aggregateRating` / `review`** if genuine reviews exist (the homepage already claims "5★ client rating" in copy but not in schema).

---

## 10. Ready-to-Use `llms.txt` (corrected)

```
# Surrey Contracting Limited

> Surrey Contracting Limited is a demolition, groundworks, bulk earthworks and
> commercial surfacing contractor based near Leatherhead, Surrey, operating across
> Surrey, London and the South East.

## Services
- Demolition: commercial & residential demolition, soft strip, concrete crushing, asbestos removal, site hoarding (https://surreycontracting.co.uk/demolition)
- Groundworks: foundations, drainage, excavation, site prep, build to DPC (https://surreycontracting.co.uk/groundworks)
- Bulk Earthworks: cut and fill, site levelling, land clearance, lakes & ponds (https://surreycontracting.co.uk/earthworks)
- Commercial Surfacing: car parks, access roads, reinstatement, kerbing (https://surreycontracting.co.uk/surfacing)

## Key Pages
- Home: https://surreycontracting.co.uk/
- Sectors: https://surreycontracting.co.uk/sectors
- Projects: https://surreycontracting.co.uk/projects
- About: https://surreycontracting.co.uk/about
- Health & Safety: https://surreycontracting.co.uk/health-safety
- Contact: https://surreycontracting.co.uk/contact

## Contact
- Phone: 01932 932650
- Enquiries: https://surreycontracting.co.uk/contact
- Address: Upper Leewood Farm Yard, Effingham Common Road, Leatherhead, KT24 5JQ

## Areas Covered
Surrey, London and the South East, including Cobham, Leatherhead, Guildford, Esher,
Woking, Reigate, Dorking, Epsom, Weybridge, Kingston, Redhill and Surbiton.

## Accreditations
CHAS, Constructionline, SafeContractor, SSIP, SMAS Worksafe, CITB, CSCS, NPORS, IPAF.
```

---

## Quick Wins (do now)
- Rewrite `/llms.txt` (above).
- Add Demolition to `<title>`, meta description, and JSON-LD OfferCatalog.
- Fix robots.txt sitemap reference + ship a resolving sitemap.
- Collapse the homepage to a single `<h1>`.

## Medium Effort
- FAQ block + `FAQPage` schema per service page.
- Answer-first opening line + 2-3 sourced stats per service page.
- `sameAs` links once GBP/LinkedIn/YouTube exist.

## High Impact (off-site)
- Optimise Google Business Profile (incl. Demolition category).
- 3-5 YouTube project videos.
- Consistent local citations (Checkatrade, FMB, Yell) with identical NAP.
