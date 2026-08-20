# Todo: surreycontracting.co.uk

## BRIEF (11 Sep 2026): Homepage answer-first structure, author and dates, schema
STATUS: STEP 0 COMPLETE. PLAN BELOW AWAITING ED'S APPROVAL. NOTHING BUILT.

### Step 0 findings (verified against repo and live site, 11 Sep 2026)

1. **Stack**: Astro 6.4 with `@astrojs/node` standalone adapter, static pages. No Next.js, no next-seo. The "Next.js / Sanity" note is wrong; the "Astro with /lp/ routes" note is right.
2. **Homepage route**: `src/pages/index.astro`. All section markup is inline in that file; no sub-components. Layout chain: `BaseLayout.astro` (UtilityBar, Nav, Footer) wraps it.
3. **Where copy lives**: in code. Sanity holds only the `project` type (case studies). Homepage text, FAQs, dates and author will go in one new constants file, `src/data/homepage.ts`, and both the markup and the JSON-LD render from it.
4. **Head metadata**: `src/layouts/BaseLayout.astro` `<head>`, with a `<slot name="head" />` for per-page additions. BaseLayout already emits a site-wide `HomeAndConstructionBusiness` JSON-LD node with `@id` `#business` on every page, and every service page's `Service.provider` references that `@id`. The homepage adds a `Service` `@graph` (three nodes) and, on this branch, a `FAQPage` block through the slot.
5. **Current title / meta on the live site**: `<title>` is "Groundworks & Earthworks Contractor Surrey | Demolition"; description is "Self-delivered groundworks, bulk earthworks and demolition across Surrey and the Home Counties. CHAS and SSIP accredited. Free measured site visit." The "Groundworks, Surfacing & Civils | Leatherhead" text Google still shows is a stale index of the pre-rebuild site, not current code. Adopting the brief's new title and meta is fine and will be done, but the SERP snippet only changes when Google recrawls (verification item 8, Search Console request indexing), not on deploy.
6. **Branch state**: the P0/P1 SEO/AEO branch (og:image, training-manual noindex, service-page FAQ depth, four-question homepage FAQ) was never merged. None of it is live. Main moved on with the enquiry-form PR (#8). This branch is now rebased onto current main; the two sets of changes coexist cleanly and will ship together. The brief's six-question FAQ supersedes the four-question one.
7. **Body-copy word count today**: 1,297 words (nav, footer and scripts excluded). Already over the brief's 1,200 cap before anything is added.
8. **Forbidden terms on the live homepage**: "surfacing", "tarmac", "resin", "surreyhillssurfacing": zero occurrences. "Leatherhead": six, all in the areas list, areaServed schema and the coverage-map alt text, never as an address. Compliant as-is.
9. **Deploy path**: push to `main` triggers GitHub Actions: `npm ci`, `npm run build`, rsync to the VPS, Docker build (which runs `npm run build` again). A `postbuild` script in package.json therefore runs in both places automatically.

### Decisions needed from Ed before build (each blocks the item named)

- [ ] **A. Phone number.** The brief's schema uses `+441932932650`. The site, ads, footer, llms.txt and the existing schema all use `01483 323568` (20 files; standardised in PR #6). Using the 01932 number would break NAP consistency and Google Business Profile matching. Proposed: keep 01483 323568 unless the number has genuinely changed. Blocks: change 3.
- [ ] **B. What gets cut to hit 1,200 words.** The brief adds roughly 950 words (answer paragraph 47, six H2 sections about 540, six FAQs about 330, author note about 40). To finish under 1,200 the homepage must lose about 1,050 words of existing copy, so this is a rewrite, not an addition. Proposed cuts, in order of least loss:
  - Hero slide 2 (word rotator) and its lede: about 50 words. Keeps slide 1 only, which also simplifies the DOM check in item 4.
  - "AI answer block" intro paragraph: about 70. Superseded by change 1a.
  - About section body copy and bullets: about 230. Replaced by the question-shaped H2 sections.
  - Four-step process section: about 80. Folded into FAQ 6 ("How do I get a quote?").
  - Stats band ("100s projects", "90%+ repeat-client rate", "100% Surrey-based"): about 15 words, and all three numbers are unsourced.
  - Values strip (4 cards): about 80.
  - Projects gallery: keep 3 tiles instead of 6, or keep 6 with one-line captions: about 90 saved.
  - Testimonials section: about 140. See G.
  - Areas, quote form, client and accreditation marquees stay.
  That reaches roughly 1,150 to 1,190 words including everything the brief adds. Blocks: change 1b and verification item 5.
- [ ] **C. Constructionline.** The brief lists it in FAQ 5 and in the legitimacy section, and existing homepage copy already says "CHAS, Constructionline, SafeContractor". There is no Constructionline logo in `/assets/acc/` (present: CHAS, SafeContractor, SSIP, SMAS, CITB, CSCS, NPORS, IPAF) and no registration number anywhere. Need the number and a logo from Jason or Ed, or drop it from all copy. CSCS is in the logo strip but not in the brief's FAQ 5 list; reconcile the same way. Blocks: 1b legitimacy section, FAQ 5, change 2c.
- [ ] **D. Schema type.** The brief specifies `LocalBusiness`. The live node is `HomeAndConstructionBusiness`, which is a subclass of LocalBusiness and more specific. Proposed: keep the subtype and add the brief's new fields (`founder`, `dateModified`, `knowsAbout`) to it. Note: the Cumulus AEO tool will keep reporting "no LocalBusiness" because its detector does not resolve subtypes (confirmed 21 Aug); that is the tool's defect, not the site's.
- [ ] **E. "One script tag with a two-node @graph".** BaseLayout emits the business node on every page and other pages depend on its `@id`. Two ways to satisfy the brief:
  - Semantic (recommended, about 10 lines): keep the site-wide node, extend it, and emit `FAQPage` from the homepage slot. Parsers see LocalBusiness + FAQPage in `<head>` exactly as intended; it is three `<script>` tags rather than one.
  - Literal: add a `suppressBusinessSchema` prop to BaseLayout, and have the homepage emit the brief's exact single `@graph`. More moving parts for the same parsed result.
- [ ] **F. Address fields.** The brief's `streetAddress` is "Unit 3 Tannery House" with `addressLocality` "Send". Live schema is "Unit 3, Tannery House, Tannery Lane, Send" with locality "Woking" (from the PR #6 NAP fix). Proposed: keep the live form; it includes the street and matches the footer. Blocks: change 3.
- [ ] **G. Pre-existing rating and testimonials.** The hero trust bar shows "5★ client rating" and the testimonials section carries three quotes attributed to initials. The brief's rule (no aggregateRating until real Google reviews are visible) and the standing repo rule (never invent reviews or ratings) both point at these. Proposed: remove the "5★" trust item now; cut the testimonials section as part of B unless Ed confirms they are real, attributable reviews. Ed's content, Ed's call.
- [ ] **H. Cost section wording.** The brief's second sentence promises "our own quoted ranges ... on our groundworks cost page", a page that does not exist yet. Proposed: render only the first sentence until `/groundworks-cost` ships, then add the second with the link. Avoids publishing a promise with nothing behind it.

### Placeholders that must come from Jason (build cannot deploy until every one is filled)

`QUOTE_LEAD_TIME`, `QUOTE_TURNAROUND`, `EXTENSION_DURATION`, `CHAS_NUMBER`, `CONSTRUCTIONLINE_NUMBER`, `SAFECONTRACTOR_NUMBER`, `SMAS_NUMBER`, `JASON_SURNAME`, `JASON_YEARS`, `JASON_SECTORS`, `REVIEW_DATE`.

Note on `QUOTE_LEAD_TIME`: the live site already states "free measured site visit within 5 working days" and "respond within one working day" on the homepage, contact page and llms-full.txt. Proposed: prefill with "5 working days" as the existing published promise and ask Jason to confirm, rather than block on it. Everything else has no existing source and stays a placeholder.

Jason was emailed for case-study facts on 20 Aug; no reply is recorded here. The registration numbers and personal details above are a separate, smaller ask. Suggested one-liner to him: surname, years in the trade, sectors worked, CHAS / SafeContractor / SMAS / Constructionline registration numbers, typical single-storey extension groundworks duration, written-quote turnaround.

### Build plan (after approval)

Files:
- `src/data/homepage.ts` (new): `FAQS[]`, `SECTIONS[]`, `DATES {published, modified}`, `AUTHOR`, `ACCREDITATIONS[] {name, number, registerUrl, logo}`, `QUOTE_LEAD_TIME`, `QUOTE_TURNAROUND`, `EXTENSION_DURATION`. Single source for visible copy and schema. Unfilled values are literal `{{NAME}}` strings so the guard catches them.
- `src/pages/index.astro`: direct-answer `<p>` inserted immediately after the `<h1>` inside the hero article (so it is the first `<p>` after the H1 in DOM order); sections rebuilt as question H2s from `SECTIONS`; FAQ rendered as `<details>` with `<summary>` heading and `<p>` answer (real text in server HTML, no JS accordion); author note plus visible Published / Last updated before the footer; new title and meta description; existing FAQ constants replaced by the brief's six.
- `src/layouts/BaseLayout.astro`: business node gains `founder`, `dateModified`, `knowsAbout` from the constants file.
- Accreditation strip: number and register link rendered under each logo from `ACCREDITATIONS`; CITB, NPORS, IPAF show scheme name only unless a company number is supplied.
- `scripts/check-homepage.mjs` + `"postbuild"` in package.json: fails the build if `dist/client/index.html` contains `{{`, any of surfacing / tarmac / resin / surreyhillssurfacing, or an em dash; prints the body-copy word count and fails above 1,200. Runs in CI and in the Docker build with no pipeline change.

Verification (evidence to be recorded in the review section below):
1. `npm run build` clean, no new warnings.
2. `grep -c "{{" dist/client/index.html` returns 0 (also enforced by postbuild).
3. Schema: live URL through validator.schema.org and Google's Rich Results Test via Playwright with the preinstalled Chromium, screenshots attached to the PR. If Rich Results Test blocks automation (login or captcha), validator.schema.org screenshot plus a note.
4. DOM: first `<p>` after `<h1>` is the answer paragraph; FAQ text present in server HTML with JS disabled (checked by parsing `dist/client/index.html`, which is the server output).
5. Body word count reported by the postbuild script.
6. Forbidden-term scan (enforced by postbuild); "Leatherhead" checked by context.
7. Lighthouse mobile before (current main) and after, via `npx lighthouse` against `astro preview`; performance must not drop more than 3 points.
8. After deploy: Search Console request indexing. Ed, account access needed. Date to be noted here.

Order: decisions A to H and Jason's values -> build with guard -> local verification 1, 2, 4, 5, 6, 7 -> PR with evidence -> Ed merges (deploy is automatic on main) -> live verification 3 -> Ed does 8.

### Review section (evidence per verification item)
Empty until build.

---

## SEO/AEO plan (20 Aug 2026) status

P0 and P1 are complete on this branch but NOT merged and NOT live. They ship with the brief above.

* [x] P0: og:image + twitter:card default (1200x630 real site photo). Not live.
* [x] P0: training-manual removed from robots.txt Disallow, noindex meta on the page. Not live.
* [x] P0: llms-full.txt verified, linked from llms.txt. Not live.
* [x] P0: demolition FAQ schema/visible drift fixed. Not live.
* [x] P1: service page FAQs extended (groundworks 6, demolition 7, earthworks 7; cost answers carry no figures pending Ed's sign-off). Not live.
* [x] P1: homepage 4-question FAQ. Superseded by the brief's six questions.
* [ ] P2: location pages. Awaiting approval and case studies from Jason. Proposed first batch: groundworks-guildford, groundworks-woking, demolition-esher (Esher demolition photos and video received 20 Aug; facts still needed).
* [ ] P3: cost and planning guides. Awaiting approval; cost figures need Ed's sign-off.

## NOT Claude Code tasks (Ed)
1. Google Business Profile at the Send address, categories Excavating Contractor and Demolition Contractor, real site photos.
2. Review pipeline: tier-1 PM, Cobham homeowner, developer contact, then every handover.
3. Citations: CHAS, Constructionline, SafeContractor directory profiles with matching NAP.
4. One link earn per month.

## Manual (Ed, cannot be done in code)
- [ ] GA4 542209922: mark `generate_lead` as key event, import as Ads conversion (launch blocker)
- [ ] Check YTQ apiKey `ytq_live_demo_key_12345` is not a dead demo key on prod
- [ ] Sandbox build hang: node_modules has iCloud-evicted files; run `npm ci` locally to restore (see lessons.md)

## Enquiry email: page attribution (2026-09-03) (merged, PR #8)
- [x] app.js appends `page` (pathname + query) to the `/api/contact` FormData on submit
- [x] contact.ts prints `Page:` as the last line of the email; falls back to the Referer header if `page` is missing
- [x] Verified: `astro build` passes; dev server with stubbed SMTP2GO shows `Page: /lp/groundworks?utm_source=google` and Referer fallback
- [x] "Where did you hear about us?" select on / and /contact: blank "Please choose" default, options Google, Facebook, Instagram, TikTok, YouTube, Referral, Sign Board, Other
- [x] Default recipient is info@surreycontracting.co.uk; privacy and cookies mailto links fixed to match
