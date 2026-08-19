# Deployment 1 — Verification Results (Part D)

Branch: `claude/see-attached-kkhu2w` · Verified 2026-08-18 against a local build
(`npm run build` + `node dist/server/entry.mjs`, the same standalone server the
VPS/nginx setup proxies to). Re-run the curl checks against the preview URL
after deploying; expected results are identical because all redirects are
served by the Node server, which nginx proxies for every path.

> Stack note: the brief assumed Next.js; this repo is Astro 6 + Sanity. All
> redirects use `astro.config.mjs` `redirects` (Astro's framework config,
> permanent 301 by default, served server-side — verified below; not
> client-side).

## 1. `npm run build`

Passes with no errors. 19 static routes + sitemap generated; redirect routes
correctly produce no static files (served as real HTTP 301s at request time).

## 2. Grep sweep

```
$ grep -ril "surfacing\|tarmac\|resin\|car park\|resurfac" src/ public/
src/lib/sanity.ts
```

`content/` does not exist in this repo. The single remaining file is
`src/lib/sanity.ts`, which contains the **exclusion mechanism itself** (the
excluded slugs `tarmac-*`, the stripped category names and the term filter) —
the same category of exception as the redirects config in
`astro.config.mjs` (also retained, allowed by D2(a)) and
`docs/surfacing-removal-inventory.md` (allowed by D2(b)). No page copy,
metadata, form, alt text or crawler file matches. All surfacing-named image
assets were deleted.

## 3. Counters render real values in raw HTML (C1)

```
$ curl -s http://127.0.0.1:4321/ | grep -o 'stat-num[^<]*>[^<]*'
stat-num">100s
stat-num" data-target="15" data-suffix="+">15+
stat-num" data-target="90" data-suffix="%+">90%+
stat-num" data-target="100" data-suffix="%">100%
```

"15+" and "90%+" are in the initial markup; JS counts up to the value already
present, and is skipped entirely under `prefers-reduced-motion` or without JS.

## 4. Redirects — all HTTP 301, server-side

```
/surfacing                          301 -> /groundworks
/lp/surfacing                       301 -> /groundworks
/projects/tarmac-driveway           301 -> /projects
/projects/tarmac-driveway-fetcham   301 -> /projects
/projects/tarmac-repairs-sutton     301 -> /projects
/sitemap.xml                        301 -> /sitemap-index.xml
/project-tarmac-driveway            301 -> /projects   (legacy URL, re-pointed to avoid a 301 chain)
/project-tarmac-driveway-fetcham    301 -> /projects   (legacy)
/project-tarmac-repairs-sutton      301 -> /projects   (legacy)
```

## 5. Sitemap

`/sitemap.xml` → 301 → `/sitemap-index.xml` (200, valid XML, references
`sitemap-0.xml`; generated filenames unchanged). `sitemap-0.xml` is valid XML
with **19 URLs and zero surfacing/tarmac URLs** (verified by parsing).
`robots.txt` already points at `https://surreycontracting.co.uk/sitemap-index.xml`
and explicitly allows GPTBot, ClaudeBot, anthropic-ai, PerplexityBot,
Google-Extended (plus Applebot-Extended, cohere-ai) — unchanged.

## 6. One H1 + unique meta description per page

Automated audit of all 25 routes (13 pages, 5 retained LPs, 7 project pages):
every page has **exactly one H1** and a **unique** meta description. All
indexable pages are under 155 characters. The homepage H1 is now
"Groundworks, Earthworks & Demolition Contractor, Surrey & the Home Counties";
the tagline "Built on Experience. Driven by Quality." remains as visible hero
copy (a styled `<p>`). CMS-sourced project meta descriptions are truncated to
<155 chars at build time.

Exception (documented): the five retained `/lp/` pages carry their original
159–180-char meta descriptions. The brief's "Do NOT touch the five retained
/lp/ pages" was taken to override C2 for those pages (they are also excluded
from the sitemap). Happy to trim them in a follow-up if the client agrees.

## 7. JSON-LD

- **LocalBusiness** (`@type: HomeAndConstructionBusiness`, `@id:
  https://surreycontracting.co.uk/#business`) emitted on **every page** via
  `BaseLayout`: name "Surrey Contracting Limited", telephone "+441483323568" (updated 2026-08-19 per client instruction; was 01932 932650),
  registered yard address (Leatherhead, Surrey, KT24 5JQ, GB), url, geo,
  openingHours Mon–Fri 07:30–17:30, `areaServed` = the 12 towns listed on the
  site, `sameAs` = LinkedIn/Instagram/Facebook from the footer, Companies
  House + VAT identifiers, and an OfferCatalog naming the three services.
- **Service** schema on the homepage: **exactly three entries** (Groundworks,
  Bulk Earthworks & Excavation, Demolition), each with a one-line description,
  `areaServed`, and `provider` referencing the LocalBusiness `@id`. The three
  service pages keep their per-page Service + BreadcrumbList schema, provider
  now referencing the same `@id`. No surfacing service anywhere.
- All JSON-LD blocks parse as valid JSON in the built HTML (verified
  programmatically). Recommend a Rich Results Test pass on the preview URL as
  a final human check.

## 8. Forms (D8)

Eight forms existed (homepage, contact, six `/lp/`). `/lp/surfacing` is
deleted, leaving **seven**; the built HTML contains **zero** "Commercial
Surfacing" options — remaining options are exactly Demolition / Groundworks /
Bulk Earthworks / Other on all seven forms. The `/api/contact` endpoint was
exercised locally: honeypot path returns `{"ok":true}`; a genuine submission
correctly reaches the SMTP2GO send step (returns the "not configured" guard in
this environment because `SMTP2GO_API_KEY` is not available here). The email
template renders whatever `svc` values are submitted, so no template change was
needed. **Manual step on preview:** submit each of the seven forms once with
real env vars present and confirm delivery.

## 9. Visual check (D9)

Headless-Chromium screenshots at 1440px and 390px of the homepage, services
page and a project page: 3-card services grid balanced (CSS updated
`repeat(4,1fr)` → `repeat(3,1fr)`), about-page cards re-gridded to 3 columns,
testimonial slider works with 3 quotes (dots reduced to match), no gaps where
the surfacing feature section and cards were removed.

## 10. Lighthouse SEO

Homepage, headless Chromium: **SEO score 100** (≥ 95 required). No failing SEO
audits.

---

## Manual actions required in Sanity (cannot be done from this repo)

| # | Document ID | Action |
|---|---|---|
| 1 | `project-tarmac-driveway` | Unpublish (or delete). Code already excludes it and 301s its URL. |
| 2 | `project-tarmac-driveway-fetcham` | Unpublish (or delete). As above. |
| 3 | `project-tarmac-repairs-sutton` | Unpublish (or delete). As above. |
| 4 | `project-southbank-centre` | **Edit, keep published**: remove "Surfacing" from *categories*; change *services* from "Surfacing · Groundworks · Drainage" to "Groundworks · Drainage"; rewrite *summary* ("External works and surfacing programme…" → suggest "External works and drainage programme delivered around live cultural-venue operations on London's Southbank."); change gallery caption "Surfacing, base course" (suggest "Reduced dig, sub-base preparation"); review the Portable-Text *body* — it mentions "full-depth surfacing reconstruction in two adjacent service yards". Until edited, the rendered page copy still contains those CMS-sourced phrases (the front end already strips its Surfacing category/service labels). |
| 5 | Studio deploy | `studio/` schema no longer offers "Surfacing"/"Driveways" categories (adds "Demolition"). Redeploy the Studio (`sanity deploy`) so editors see the new list. |

## Flags for the client

1. **Email address discrepancy**: `.env.example`/`llms.txt` use
   `info@surreycontracting.co.uk`; the contact API's fallback and the old
   homepage JSON-LD used `info@surreycontractinggroup.co.uk`. The new visible
   email (quote section, contact page, footer) and JSON-LD use
   **info@surreycontracting.co.uk** — confirm this is the monitored inbox
   (the runtime `CONTACT_TO` env var on the VPS is what actually receives
   form mail and is unaffected).
2. Response commitment used: "We respond to every enquiry within one working
   day" + "free measured site visit within 5 working days" — both already
   site copy; confirm wording.
3. The five retained `/lp/` pages were left untouched except: the Commercial
   Surfacing checkbox (B7 "every form") and one "car parks" phrase in
   `/lp/drainage` body copy (required by the D2 sweep).
4. `public/training-manual/` + `docs/sanity-training-manual.*` (CMS editor
   guide) used tarmac projects as worked examples — re-exampled with the
   retained Ascot drainage project. Screenshot images inside it still show the
   old CMS content (binary files, not regenerated).
