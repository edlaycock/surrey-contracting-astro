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

### Placeholders

None. The two FAQ answers that needed figures (extension duration, quote turnaround) were rewritten without them at Ed's request. The only figures on the page are the already-published promises: respond within one working day, site visit within 5 working days. The guard stays in place so any future `{{` blocks the build.

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

### Build status (11 Sep 2026)
MERGED AND LIVE. PR #9 squash-merged as 7ba062c on 14 Sep 2026; deploy run #67 completed and the new homepage was serving by 08:59 UTC. Live validation done (item 3, evidence below and in the PR comment). Only Search Console indexing (item 8, Ed) remains. Decisions taken: keep 01483 323568; approved cut list applied; keep HomeAndConstructionBusiness; semantic schema (site-wide business node extended with dateModified and knowsAbout; FAQPage emitted from the homepage); live address form kept; "5 star client rating" removed; testimonials removed; Constructionline listed as a text entry with a placeholder number.

Two corrections from Ed after the first build, both applied and both logged in tasks/lessons.md:
- **No text-block sections.** The brief's question-shaped H2 sections read as walls of text. All of that content (what a groundworks contractor does, enabling works, what a demolition needs, how to check a contractor, cost) moved into the FAQ accordion, which now has 11 questions. Page order is hero, service tiles, projects, areas, FAQ, quote form, clients, accreditations, publisher note.
- **The company is the entity, not Jason.** The personal author note and the `founder: Person` schema node were the sole-trader framing. The note is now "Published by Surrey Contracting Limited. Reviewed by [name], Director." with the Published and Last updated dates; no personal biography, no Person node.
- **No accreditation registration numbers.** The brief's 1b and 2c asked for CHAS, SafeContractor, SMAS and Constructionline numbers; Ed's instruction is that they are not published. Removed everywhere.
- **Nothing under the accreditation logos.** The list of scheme names and register links that replaced the numbers is gone too. The accreditations section is the heading and the logo marquee only, as it was.
- **No register links anywhere.** The SSIP Portal, Constructionline and Companies House links were removed from the FAQ as well. The company number appears as plain text.
- **No author, reviewer or dates.** The brief's 2a and 2b (author note, Published and Last updated, `dateModified` in the business schema) are removed entirely. The page ends at the accreditations strip, as before.

Also applied, both literal readings of the brief:
- "LocalBusiness and FAQPage only": the homepage's standalone three-node Service @graph was removed. The business node's OfferCatalog still references the three services, and each service page declares its own Service schema. Reversible in one line if preferred.
- Meta description: the brief's wording was 161 characters against its own 155 limit; "south west London" became "SW London" (153 characters).

Not in the brief, done because verification item 7 exposed it: the hero background is the LCP resource and the 859 KB coverage map plus 19 marquee logos were competing with it at low priority from 686 ms. Added a homepage-only `preload` for the hero and `loading="lazy" decoding="async"` on the coverage map and marquee logos. No asset was changed.

### Review section (evidence per verification item)

1. **Build**: `npm run build` (Astro build plus the postbuild guard) exits 0, no warnings. This is the same command CI and the Docker image run.
2. **Placeholders**: `grep -c "{{"` on every built HTML file returns 0. Enforced by `scripts/check-homepage.mjs` across the whole site, not just the homepage.
3. **Schema, verified against the LIVE URL on 14 Sep**: validator.schema.org (`POST /validate`) returns `totalNumErrors: 0`, `totalNumWarnings: 0`, `numObjects: 2`, `isRendered: true`. Two top-level nodes: `HomeAndConstructionBusiness` (17 properties; `knowsAbout`, `identifier`, telephone `+441483323568`, Send/Woking address; `founder`, `dateModified`, `aggregateRating` and `review` all confirmed absent) and `FAQPage` (`#faq`, 10 questions, every question and answer matched character-for-character against the visible page text). 0 Article nodes, 0 Person nodes. Google's Rich Results Test could NOT be run: Chromium navigation to external hosts is reset by the sandbox egress proxy and the Search Console testing API rejects unauthenticated callers, so no validator screenshots exist. Run it manually if a visual record is wanted.
4. **DOM**: with JavaScript disabled (Playwright, `javaScriptEnabled: false`) the first `<p>` after the `<h1>` is "Surrey Contracting Limited is a groundworks, earthworks and demolition contractor..." and all 10 FAQ items are present in the server HTML as `<details>` with `<summary>` and `<p>`. Answer lengths 48, 51, 47, 65, 53, 50, 41, 52, 45, 52 words. The extension-duration question was removed at Ed's request. The only links inside answers are internal (service pages, the accreditations strip, the quote form, the phone number); no external links. The schema carries the same text with tags removed, and the guard compares the two.
5. **Word count**: 1,018 body-copy words (nav, footer, scripts, form controls excluded), reported by the guard on every build; the guard fails above 1,200.
6. **Forbidden terms**: zero occurrences of surfacing, tarmac, resin, surreyhillssurfacing (guarded). Zero em dashes on the homepage (guarded; the one found was an HTML comment in BaseLayout, now a colon). "Leatherhead" appears only as a service area and in the map alt text.
7. **Lighthouse, mobile, same sandbox, Lighthouse perf preset**. Before (pre-change commit rebuilt in a worktree, 3 runs): performance 54, 64, 60; LCP 10.1 to 10.3 s; TBT 130 to 410 ms; 37 requests, 5.5 MB. After (2 runs): performance 65, 65; LCP 16.2 s; TBT 80 to 100 ms; CLS 0.001; 13 initial requests, 2.8 MB. Performance is up, not down. The LCP figure needs reading with care: the before page's hero image finished loading at 27.5 s, after Lighthouse had stopped tracing, so its 10.3 s "LCP" was a text element and the hero never registered; the after page loads the hero at 16.1 s, 11 s sooner, and it now registers correctly as the LCP element. Hero and coverage map are both around 860 KB and are the next lever; recompressing them is an asset change outside this brief and is recommended separately.
8. **Search Console**: request indexing of the homepage after deploy. Ed. Date: ____________.

Public register note for change 2c: CHAS, SafeContractor and SMAS do not offer login-free public lookups of their own (CHAS's search sits inside the VeriforceONE client portal). The SSIP Portal is the public register that verifies all three, so those entries link there; Constructionline links to its supplier search; Companies House links to the company record. SSIP has no number (umbrella scheme) and CITB, CSCS, NPORS and IPAF show the scheme name only.

---

## SEO/AEO plan (20 Aug 2026) status

P0 and P1 shipped in PR #9, merged 14 Sep 08:57 UTC and live. Verified against the live site at 09:28 UTC the same morning.

* [x] P0: og:image + twitter:card default (1200x630 real site photo). Live.
* [x] P0: training-manual removed from robots.txt Disallow, noindex meta on the page. Live and verified.
* [x] P0: llms-full.txt verified, linked from llms.txt. Live and verified.
* [x] P0: demolition FAQ schema/visible drift fixed. Live.
* [x] P1: service page FAQs extended. Live and verified: groundworks 6, demolition 7, earthworks 7 FAQPage questions. Cost answers still carry no figures, pending Ed's sign-off.
* [x] P1: homepage 4-question FAQ. Superseded by the brief's six questions.
* [x] P2: location pages. Batch 1 built and raised as PR #10: /groundworks-guildford and /groundworks-woking. The two demolition town pages in the brief were not built (see below).
* [x] P3: cost and planning guides. Both built: /guides/demolition-cost-uk and /guides/groundworks-planning. The cost guide carries no figures (see below).

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

## P2 location pages, batch 1 (2026-09-14)

Brief asked for four pages: groundworks and demolition for Guildford and Woking.
Two were built. Two were refused, on the brief's own rule: "If a page would end
up as thin boilerplate because there is no real local proof, stop and flag it to
Ed rather than padding it."

### Built
- [x] `/groundworks-guildford`, backed by the published `landscape-guildford`
      case study (Guildford, Surrey: 30sqm porcelain patio and sleeper borders,
      base preparation and levels by the same team).
- [x] `/groundworks-woking`, backed by the published `domestic-earthworks` case
      study (Horsell, Woking: pool removal and garden preparation, around 220
      tonnes moved).

### Not built, and why
- [ ] `/demolition-guildford` and `/demolition-woking`. Sanity holds no
      demolition case study for any town. Building either page would mean
      swapping a town name into generic demolition copy with nothing local
      behind it, which is the doorway page the brief rules out. Blocked on
      Jason supplying facts for the Esher demolition (photos and video received
      20 Aug, facts still outstanding). Once that case study is published,
      `/demolition-esher` is the honest first demolition location page, not
      Guildford or Woking.

### URL structure
Flat `/groundworks-guildford`, not `/areas/guildford`. Reasons: the existing
site is flat (`/groundworks`, `/demolition`, `/earthworks`), the service and the
town both need to be in the URL because a town will eventually have more than
one service page, and a flat URL keeps the breadcrumb at Home > Groundworks >
Guildford rather than adding a hub level that would need its own content.

### Implementation
- `src/data/locations.ts` is the single source of truth: title, description,
  answer, local copy, case study slug and FAQs. Visible copy and the FAQPage
  JSON-LD render from the same strings.
- One route file, `src/pages/groundworks-[town].astro`, so both pages share a
  layout and cannot drift.
- `ServiceSchema.astro` extended backwards-compatibly with `areaServedTown`,
  `crumbName` and `parent`. The three existing service pages are unchanged.
- Internal links: `/groundworks` has a "Groundworks by town" section, the
  homepage "Areas we cover" list now links the towns that have pages (via
  `LOCATION_LINKS`), and both pages are in the footer Services column.
- `scripts/check-locations.mjs` runs in postbuild alongside check-homepage. It
  fails the build on a missing page, a duplicate title or description, more or
  fewer than one H1, an answer that falls after the first H2, a missing case
  study card, an em dash, FAQ schema that does not match visible text, a Service
  node whose areaServed is not the town, or a URL missing from sitemap-0.xml.

### Verified
- [x] `npm run build` clean, both guards pass
- [x] `sitemap-0.xml` contains `/groundworks-guildford` and `/groundworks-woking`
- [x] All four JSON-LD blocks per page parse: HomeAndConstructionBusiness,
      Service (areaServed City = town), BreadcrumbList (Home > Groundworks >
      Town), FAQPage (3 questions each)
- [x] One H1 per page, unique titles and meta descriptions, canonical correct
- [x] Screenshots at 1440 and 390 wide
- [x] validator.schema.org against the LIVE URLs, 18:05 UTC on 14 Sep:
      /groundworks-guildford and /groundworks-woking each return
      `totalNumErrors: 0`, `totalNumWarnings: 0`, `numObjects: 3`,
      `isRendered: true`, with no node or property errors on BreadcrumbList,
      Service or FAQPage. Use the POST `url` path; the POST `code` path gets
      captcha'd from this sandbox.
- [ ] Google's Rich Results Test stays unreachable: Chromium navigation to
      external hosts is reset by the sandbox egress proxy. Run it by hand if a
      visual record is wanted.

### Next batch, once this pattern is approved
Weybridge and Epsom were named in the brief as batch 2. Neither has a published
case study in Sanity today, so the same rule applies: they wait for real local
proof rather than shipping on a town name swap.

## P2 batch 1 merged and live (2026-09-14)

PR #10 squash-merged as `11411a0` at 17:58 UTC, deploy run #69. Ed asked twice
for the live validation while the PR was still open; three independent checks
(GitHub API, git ancestry, live 404s) said otherwise each time, and he then
asked me to merge it, which I did.

Verified against the live site at 18:05 UTC:
- [x] Both URLs return 200
- [x] Unique titles and meta descriptions matching locations.ts, canonicals correct
- [x] Exactly one H1 per page; direct answer appears before the first H2
- [x] Case study card rendered on both (the reason each page exists)
- [x] No em dash, no Article, no aggregateRating
- [x] JSON-LD per page: HomeAndConstructionBusiness, Service (areaServed City =
      town, containedInPlace Surrey, provider -> /#business), BreadcrumbList
      (Home > Groundworks > Town), FAQPage (3 questions matching visible text)
- [x] validator.schema.org: 0 errors, 0 warnings on both live URLs
- [x] sitemap-0.xml carries both; homepage areas list links both; footer carries
      both; /groundworks "Groundworks by town" links both; llms.txt lists both

Still open for Ed:
- [ ] Request indexing for both URLs in Search Console
- [ ] Confirm two pages instead of four is accepted (no demolition case study
      exists for any town, so those pages were refused)
- [ ] Confirm the flat /groundworks-guildford URL shape stands now that it is
      live and indexable

## P3 guides (2026-09-15)

Built both guides from the P3 brief, plus the company number correction Ed
asked for in the same message.

### Company number
Companies House number corrected from 15454300 to 15877451 in all four places
it appears: the footer line, the `identifier` array in the site-wide business
JSON-LD, the homepage FAQ answer about checking a contractor, and
llms-full.txt. Verified that the old number appears nowhere in the build.
Not independently checked against the Companies House register from here; the
number is as Ed supplied it.

### /guides/demolition-cost-uk
"What Drives the Cost of a Demolition". Six H2 questions with visible answers,
a cost line table (what each line covers, what moves it), a six step routine
for comparing two quotations, and the notices position (Section 80, prior
approval, party wall). About 1,280 body words.

**Carries no prices, deliberately.** Ed has never signed off figures and the
rest of the site already takes the line that demolition is quoted per project
after a measured site visit. The guide makes that an explicit section rather
than a gap. `scripts/check-guides.mjs` fails the build if a currency figure
ever appears on a guide page, so numbers cannot creep in unreviewed.
Trade-off recorded: queries like "demolition cost uk" expect numbers, so this
page will not compete with listicles carrying per square metre rates until Ed
supplies figures he will stand behind publicly.

### /guides/groundworks-planning
"Planning Groundworks Before the Machines Arrive". Six H2 questions, a
building control inspection stage table, and sections on site investigation,
drainage approvals (Approved Document H, build-over agreements, BRE Digest 365
percolation testing), sequencing, and party wall and tree constraints. About
1,070 body words. Every regulatory reference is to published UK law or an
Approved Document.

### Structure decisions
- **No /guides index page.** A hub carrying two cards would be thin. The
  guides are reachable from a new footer Guides column, from in-content links
  on /groundworks and /demolition, from llms.txt and llms-full.txt, and from
  the sitemap. Revisit a hub and a nav entry at four or more guides.
- **No duplicate FAQ accordion.** The first build rendered every answer twice,
  once under its H2 and again in a "Common questions" accordion, which put the
  demolition guide at 1,853 words of largely duplicated text. Each question now
  appears once, as an H2 with a visible answer, and the FAQPage JSON-LD is
  generated from those same strings. The opening direct answer sits before the
  first H2 and is not repeated as an FAQ entry.
- **No Service node on a guide.** The first build emitted one via
  ServiceSchema, which would have put a second Demolition Service entity at a
  guide URL competing with /demolition. Guides now emit BreadcrumbList and
  FAQPage only, alongside the site-wide business node, and the guard fails the
  build if a Service node reappears on a guide.
- **No Article schema.** Article wants an author and dates, and Ed removed
  author credit and review dates from the site in PR #9.

### Verified
- [x] `npm run build` clean, all three guards pass
- [x] Both guide URLs in sitemap-0.xml
- [x] One H1 each, unique titles (63 and 47 chars) and meta descriptions (141
      and 152 chars), canonicals correct
- [x] JSON-LD parses: business node, BreadcrumbList, FAQPage (6 questions each,
      every question and answer matched to visible text)
- [x] No em dash, no currency figure, no aggregateRating
- [x] No horizontal overflow at 1440 or 390 wide
- [ ] validator.schema.org against the live URLs after deploy. The POST `code`
      path is captcha'd from this sandbox; the POST `url` path works.

## Weybridge, Epsom and the /areas hub (2026-09-15)

Ed asked for Weybridge and Epsom, and for an "Areas We Cover" page with a map
and a summary list, after the P3 guides went live.

### Live validation of the P3 guides, completed first
PR #11 merged as `3cbb052`, deploy served both guides. validator.schema.org
against the LIVE URLs: /guides/demolition-cost-uk and /guides/groundworks-planning
each return `totalNumErrors: 0`, `totalNumWarnings: 0`, `numObjects: 3`,
`isRendered: true`, nodes HomeAndConstructionBusiness, BreadcrumbList and
FAQPage, no standalone Service node. Company number 15877451 confirmed live in
the footer, the business JSON-LD and the homepage FAQ; 15454300 appears nowhere.

### Weybridge and Epsom: the proof position, stated plainly
Sanity still holds the same 7 projects. There is no Weybridge case study and no
Epsom case study, and Jason has added nothing since 20 Aug. The P2 rule was
that a town gets a page only when local work backs it up, and I flagged that
for these two towns in PR #10 and again in chat. Ed asked for them anyway,
which is his call to make.

They were built without breaking the no-invention rule, by changing what the
page claims rather than inventing proof:
- New `proofLocal` flag in src/data/locations.ts. False for both towns.
- The evidence section heading becomes "Our nearest published project to
  Weybridge" instead of "Work we have completed in Weybridge", and a visible
  lead line says: "We have not published a Weybridge case study yet. The
  nearest completed work we can show is at Cobham, about four miles away in the
  same borough." Epsom says the same about Cobham, roughly eight miles away.
- `scripts/check-locations.mjs` now FAILS the build if a page with
  `proofLocal: false` does not carry that disclosure in visible text.
  Negative-tested: replacing the Weybridge lead with "Recent work in the
  Weybridge area." fails the build with a named error.
- llms-full.txt records the same distinction for machine readers.

Everything else on the pages is real: distance and route from the yard, local
geology (Weybridge sand and river terrace gravel at the Wey and Thames
confluence, high water table near the Navigation; Epsom London Clay through the
town with chalk rising onto the Downs, and what clay means for foundation depth
near trees), property and access types, and the correct building control
authority (Elmbridge for Weybridge, Epsom and Ewell for Epsom).

When a genuine case study lands for either town, set `proofLocal: true` and
rewrite `proofLead`.

### /areas
Hub page: coverage map, the direct answer first, a table of 12 towns with
approximate road distance from the Send yard, cards for the four towns that
have pages, and two further H2 questions with FAQPage schema. Distances are
labelled approximate on the page rather than presented as measured. Linked from
the main nav, the mobile drawer, the footer Company column, the homepage areas
section and /groundworks.

This reverses the "no hub page" line taken for the guides, because Ed asked for
it and because a coverage hub with 12 towns, a map and distances is real
content rather than two cards.

### Verified
- [x] `npm run build` clean, all three guards pass
- [x] 25 URLs in sitemap-0.xml including /areas and both new towns
- [x] Four location pages: one H1 each, unique titles and descriptions,
      areaServed City per town, Home > Groundworks > Town breadcrumbs, FAQ
      parity
- [x] /areas: one H1, coverage map present, all 12 towns listed, all 4 town
      pages linked, FAQ parity, BreadcrumbList, sitemap entry
- [x] Disclosure guard negative-tested
- [x] No horizontal overflow at 1440 or 390 wide
- [x] validator.schema.org against the LIVE URLs, 16 Sep: /areas,
      /groundworks-weybridge and /groundworks-epsom each return 0 errors and
      0 warnings, numObjects 3, isRendered true. /areas carries
      HomeAndConstructionBusiness, BreadcrumbList and FAQPage; the town pages
      carry Service (areaServed City = town), BreadcrumbList and FAQPage.
- [x] Both disclosure lines confirmed in the live HTML, under the heading
      "Our nearest published project to <town>".
- [x] 25 URLs in the live sitemap; homepage areas list links all four towns;
      /areas linked four times from the homepage (nav, drawer, footer, areas
      section).

### Still blocked on Jason
No demolition case study exists for any town, so /demolition-guildford and the
rest remain unbuilt. The Esher demolition photos and video from 20 Aug are
still unusable without the facts.

## Jason's implementation brief (22 Sep 2026)

Jason's 22 Sep email turned out to be a summary of a 35-page AI-generated
implementation brief dated 19 Sep. Full register in
`tasks/jason-brief-register-2026-09-22.md`; draft reply updated.

Verdict: the brief fetched the live site for the pages changed 14 to 16 Sep
and a cache for the project and legacy pages. Its headline "old template on
two project pages" claim is false today (fresh fetch, zero hits for the old
identity on all 26 pages) and its own reference list includes two URLs that
have been 301s since August. But it caught two real things we missed.

Shipped in PR #13, squash-merged as `20f2ad0` on 22 Sep, verified live:
- [x] "private approved inspector" replaced with Registered Building Control
      Approver on all four town pages and the planning guide. My error, from
      14 to 16 Sep. Approved Inspectors ceased in England in April 2024.
      Live: the term is on all five pages; "approved inspector" survives only
      in the guide's deliberate "the body that replaced approved inspectors"
      clause. FAQ schema on the four town pages carries the new wording and
      every answer still matches the visible text.
- [x] Nine joined sentences and "carrys" fixed on /demolition and /earthworks.
      Live: zero joined sentences on either page, "carrys" gone.
- [x] validator.schema.org, live: /groundworks-woking 0 errors, 0 warnings,
      3 objects (BreadcrumbList, Service, FAQPage), isRendered true.
- [ ] validator.schema.org, live: /guides/groundworks-planning. NOT OBTAINED
      on 22 Sep: four attempts (immediate, 75 s, 4 min and 20 min apart) all
      returned Google's captcha redirect, while a call to /groundworks-woking
      between them succeeded, so the throttle looks URL-specific. Stopped
      retrying rather than keep hitting it. A fifth attempt after a full
      hour also failed, so this is the final position for 22 Sep. Run it by
      hand in a browser at
      https://validator.schema.org/#url=https%3A%2F%2Fsurreycontracting.co.uk%2Fguides%2Fgroundworks-planning
      or retry from here tomorrow.
      CORRECTION to an earlier note: the JSON-LD on this page DID change in
      PR #13. The RBCA sentence lives inside A_BUILDING_CONTROL, which is the
      second FAQ answer, so the FAQPage answer text changed by exactly that
      one sentence (git diff of the constant against 20f2ad0^ confirms it is
      the only difference). Schema shape is unchanged: the same three nodes
      and six questions. Verified live today: every JSON-LD block parses, all
      six FAQ answers match the visible text, no standalone Service node. The
      four town pages carry the identical sentence change inside their FAQ
      answers and /groundworks-woking validated 0 errors, 0 warnings today,
      so the guide's external verdict is expected to match; it is recorded as
      pending until the validator actually returns it.
- [x] Draft reply to Jason run through the humanizer skill at Ed's request:
      five edits (one rule of three, two signposting sentences, one
      "actually" in a heading, one keep/keep/keep parallel). No dashes, no
      curly quotes.

Blocking on Jason:
- [ ] Does Surrey Contracting hold a current HSE asbestos licence? /demolition
      currently claims "fully licensed" removal; the homepage and the cost
      guide say coordination. If no licence, the demolition page is advertising
      work it cannot lawfully do. Replacement copy is prepared in the register
      appendix and deploys on his answer.

Ed's call, not changed:
- [ ] Duplicate "number one priority" heading on /health-safety
- [ ] The brief's commercial repositioning (developer/main contractor first,
      residential second). A business decision for the meeting; it conflicts
      with the residential ad funnel and the 5-working-day site visit promise.
- [ ] Demolition and earthworks page rewrites, after positioning is decided.

Lesson logged in lessons.md: I characterised the audit as having "no specific
examples" from the email alone. The source document had 25 URLs and 60-odd
change IDs. Ask whether a source document exists before characterising an
audit.

## Project case study form for Jason (22 Sep 2026)

Checked the repo first: no template of any kind existed, tracked or
untracked, only the promise of one in the reply. Built
`tasks/Surrey-Contracting-project-case-study-form.docx`.

- Fields map one-to-one onto `studio/schemaTypes/project.ts` (title,
  categories from the schema's list minus Hard Landscaping, sector from the
  schema's list, client, location, services, year, duration, status,
  summary) so what Jason writes goes into the CMS without translation.
- Narrative follows the structure the brief recommends and Southbank already
  uses: the brief, the delivery, key quantities, site constraints, the
  outcome. Each has a prompt and a grey writing box.
- Two rules built into the form: leave a figure blank rather than guess, and
  only name a client who is happy to be named. Town published, never a street
  address. Sign-off ticks for facts checked, client permission, and no
  licence or accreditation claimed that is not held.
- Worked example uses the Premier Inn Cobham job with only facts already
  published on the site.
- Generated with docx-js (scratchpad install, nothing added to the project).
  Passed the docx skill's XSD validator (95 paragraphs, all checks). Parsed
  by Mammoth with zero warnings; structure checked visually from that
  render. LibreOffice in this sandbox cannot open any docx, so no PDF render
  was possible; Word itself will render the shading and box heights.
- No em or en dashes.
- Ed opened it in Word (4 pages, shading and box heights render) and asked
  for clickable tick boxes rather than glyphs. Regenerated with real Word
  checkbox content controls (w14:checkbox): 18 controls, all unchecked,
  schema validation passed.

Ed sent the reply to Jason on 22 Sep, with the register PDF attached.

## Asbestos wording made consistent (22 Sep 2026)

Jason confirmed in writing: not licensed to remove asbestos; licensed
removal companies do that work and Surrey Contracting coordinates it. He
asked for the wording to be made clear and consistent across the site.

Changed, twelve replacements across five files, every one asserted to hit
exactly the expected number of times:
- /demolition: the "Licensed Asbestos Removal" section retitled and rewritten
  as survey and licensed-removal coordination; its five-item feature list
  rewritten; the FAQ "Does Surrey Contracting carry out asbestos removal
  before demolition?" replaced with "Who carries out asbestos removal before
  a demolition?" and an honest answer; the first FAQ's service list changed
  from "licensed asbestos removal" to coordination; the meta description.
  Both the hand-written JSON-LD copy and the visible copy changed together.
- Homepage demolition service card.
- About page enabling-works list (not in the register; found by grep).
- llms.txt and llms-full.txt service lists (not in the register; found by
  grep).
Not changed: the demolition cost guide, which already had the correct
position, and the homepage FAQ answers, which already said coordination.

Verified: build green with all three guards; ad-hoc parity check on
/demolition (no guard covers that page's hand-written FAQ JSON): all seven
questions and answers present in visible text; grep of the built site for
"carries out fully licensed", "Licensed ACM removal" and the old FAQ question
returns nothing.

PR opened for Ed to merge. Not merged unprompted: it changes a live claim.

## Landing page v2 (A/B) - demolition, groundworks, earthworks (30 Sep 2026)

STATUS: PLAN ONLY. NOTHING BUILT. Awaiting Ed's go-ahead on the open
questions at the end.

### Goal

Three new paid-traffic landing pages, /lp/demolition-2, /lp/groundworks-2
and /lp/earthworks-2, that recreate the structure of the old
contact.surreycontracting.co.uk pages (scraped verbatim into
tasks/source-pages/) inside this Astro site, using only claims, images and
accreditations the repo can stand behind. They run as B variants against the
existing /lp/demolition, /lp/groundworks and /lp/earthworks, which do not
change. Not live in search: noindex,follow, out of the sitemap, not linked
from nav or footer.

### Decisions already made (Ed)

- Source pages: demolition.md, groundworks.md, earthworks.md only.
  surfacing-commercial.md is out of scope: /surfacing and /lp/surfacing
  redirect to /groundworks and the homepage guard blocks surfacing, tarmac
  and resin wording. Not built.
- v1 pages untouched. v2 slugs: /lp/demolition-2, /lp/groundworks-2,
  /lp/earthworks-2 (files src/pages/lp/demolition-2.astro and so on). Plain
  numeric suffix, readable in GA4 and in the enquiry email's Page line.
- Dropped from the source: Constructionline Gold, "Licensed Asbestos
  Removal", CCDO-qualified operatives. Accreditations shown are the eight
  with logos in public/assets/acc/ (CHAS, SafeContractor, SSIP, SMAS, CITB,
  CSCS, NPORS, IPAF). Asbestos wording is the coordination copy approved on
  the live /demolition page in PR #16 (2dcdc55), after Jason's written
  confirmation on 22 Sep that the company is not licensed to remove asbestos.
  (The brief said PR #13; #13 was the building-control fix, #16 is the
  asbestos one.)
- No images from cdn.lugc.link, Landingi or Unsplash. public/assets/img/ only.
- Brand: existing tokens in public/styles.css (Montserrat, --yellow #E6A91A
  on dark surfaces only, --yellow-700 #8A6408 for text on light, --radius
  10px, --radius-lg 16px). New CSS only as one scoped block for new layouts.

### Repo facts checked for this plan (corrections to the brief in bold)

- **BaseLayout does not emit a quote form.** BaseLayout.astro emits GTM, the
  consent default, the business JSON-LD, the YTQ connector script and
  app.js. Each /lp page carries its own `<form id="quoteForm" data-ytq-form
  data-lead-source="lp_x">` inline, with the honeypot, the four service
  checkboxes and the qf-success paragraph. v2 pages copy that form block.
  One form per page (lessons.md: the JS binds only the first match).
- app.js appends `page` = pathname + query to the /api/contact FormData and
  fires `generate_lead` with event_label = data-lead-source, so a distinct
  lead source per v2 page gives clean attribution in both the email and GA4.
- Sitemap filter in astro.config.mjs excludes any page containing "/lp/".
  Confirmed on a fresh build: `grep -c "/lp/" dist/client/sitemap-0.xml` is 0.
  The new slugs are covered without a config change.
- No component links to /lp/ (grep of src/components, src/layouts,
  src/pages/index.astro). Nothing to remove.
- Postbuild guards: check-homepage.mjs scans every built page for `{{`
  placeholders but its forbidden-term, em-dash and FAQ-parity checks run on
  the homepage only. check-locations.mjs covers only the towns in
  src/data/locations.ts. check-guides.mjs covers only /guides. **No guard
  scans /lp pages** beyond the placeholder check. Plan adds one (below).
- Existing v1 /lp pages already drift: FAQ JSON-LD answer text does not
  match the visible answer on /lp/demolition (3 of 4), /lp/groundworks (2 of
  4) and /lp/earthworks (1 of 4), because the schema says "Surrey
  Contracting provides..." and the page says "Full structural...". So any
  new parity guard must be scoped to the v2 pages, or v1 breaks the build.
  The v1 drift is recorded here for Ed; it is not fixed by this work.
- Build works in this sandbox: `npm ci` then `npm run build` completed with
  all three guards green on 30 Sep (node 22.22, Astro 6.4). The iCloud hang
  in lessons.md applies to the Mac sandbox, not here.
- Playwright 1.56.1 is installed globally (/opt/node22/bin/playwright) with
  Chromium at /opt/pw-browsers (PLAYWRIGHT_BROWSERS_PATH is set). Visual
  checks are feasible.
- app.js writes two runtime strings with em dashes ("Thanks [em dash] we've got
  it", "Something went wrong [em dash] please call"). They are injected after a
  submit, so they are not in the built HTML and the dash grep will not see
  them. Site-wide, pre-existing, not changed here; noted as a follow-up.
- Real published projects (Sanity, seeded by scripts/seed-projects.mjs, local
  photos in public/assets/img/projects/): Southbank Centre (London SE1),
  Site Clearance and Earthworks (Farnham), Domestic Earthworks (Horsell,
  Woking), Drainage Installation (Ascot), Residential Re-landscape
  (Guildford), Concrete Base Installation, Premier Inn Cobham, Complete
  Re-landscape (Virginia Water). **No demolition case study exists**
  (still blocked on Jason, see the Weybridge/Epsom section above).

### Lessons from tasks/lessons.md that apply

1. One functional quoteForm per page; extra CTAs are anchors to #quoteForm.
2. Do not trust a hanging build; verify in a real environment. Here the
   build runs, so verify by building.
3. Show a mock-up or screenshot before the full build on a commercial page.
   Applied: Playwright screenshots at 375 and 1280 go to Ed before the PR is
   marked ready, and the first page (demolition-2) is built alone and shown
   before the other two are cloned from it.
4. The company is the entity, not a person: no author or founder framing.
5. No accreditation registration numbers, no register links, nothing under
   the logo strip. The v2 trust strip is logos plus one line of copy, no
   list.
6. No author, reviewer or date credits on commercial pages.
7. Check regulatory terms against the current regime: asbestos wording is
   the HSE-licensed-contractor copy already checked in PR #16; nothing new
   is written from memory. If a term is added (for example CDM or waste
   carrier), check GOV.UK or HSE first.
8. Report only on what we are responsible for: the Google Ads split itself
   is the other agency's to run since 9 Sep; the plan says what URLs and
   labels to give them, not how to run their account.

### Hypothesis (the variable under test)

v1 is a long-form service-detail page: hero with a four-stat trust bar,
intro paragraph, three alternating photo-and-copy blocks each with a
five-item feature list, four FAQs, then the form. It reads like the main
service page with the nav kept.

v2 tests a scan-first, trust-first structure taken from the source pages:
accreditation logos immediately under the hero, a compact tiled service
list, a short "why choose" band, a four-step "how it works" strip, FAQ,
then the form. Copy per section is one or two sentences, not a paragraph.

Hypothesis: paid visitors decide in the first two screens on whether the
firm looks legitimate and does the thing they searched for. Putting the
eight logos and the full service list above the fold, and cutting the
narrative blocks, will raise the enquiry rate (form sends plus phone
clicks per session) against v1.

Held constant so the result is about structure, not offer: same hero photo,
same H1 subject, same offer (free site visit, one working day response,
fixed-price itemised quotation), same two CTA labels, same form and fields,
same phone number, same FAQ count (five, one more than v1, because the
source has five and the "how do I get a quote" answer carries the offer),
same sticky CTA bar. Only the page structure and copy density change.

Measure: GA4 `generate_lead` by event_label (lp_demolition vs
lp_demolition_2, and the same for the other two) and `phone_click` by page
path, per session, over the same date range with a 50/50 final-URL split
in the ads. Ed or the ads agency decides the split and the run length; the
site only needs the two URLs to exist.

### Page structure (all three pages, same skeleton)

Section count is eight; eyebrow allowance is therefore two. They go on the
hero and on the closing CTA. No other section carries an eyebrow.

1. Hero (existing .page-hero classes, no .hero-trust bar). Eyebrow, H1,
   lede (20 words or fewer), two CTAs. The trust bar is dropped because the
   logo strip below replaces it and the hero must fit the viewport at
   375 wide with both CTAs visible.
2. Trust strip (new .lp2-trust). Eight logos in a static wrapping row using
   the existing .acc-badge look at a reduced height, no marquee, no
   animation, so every logo is visible at once and there is nothing to wait
   for. One line of copy beneath, no list, no numbers, no links.
3. Services (new .lp2-services). H2, one-line lede, then tiles in a
   two-column grid on desktop (one column under 700px): photo left, title
   and one sentence right. Six tiles for demolition and groundworks, four
   for earthworks. Two columns, never three, so the page never shows a row
   of three equal cards.
4. Why choose (new .lp2-why, dark band on --grey-800, --yellow accents).
   H2 and four items in a two-by-two grid: figure or scheme name in
   --yellow, one sentence in --grey-200. Four items, not three.
5. How it works (new .lp2-steps). H2 and four numbered steps on --grey-50.
   Steps carry the published promises: site visit within 5 working days,
   fixed-price itemised quotation, one point of contact.
6. Recent work (groundworks-2 and earthworks-2 only, reusing .proj-grid and
   .proj). Two or three real project tiles linking to /projects/<slug>, and
   a "View all projects" button. demolition-2 has no such section because no
   demolition case study is published; that gap is recorded in the claims
   table and is the one structural difference between the three pages.
7. FAQ (existing .faq-list and .faq-item). H2 and five details/summary
   items. Visible text is the single source; the FAQPage JSON-LD is built
   from the same constant so it cannot drift.
8. Closing CTA and form (existing .contact-grid, .contact-info,
   .quote-form). Eyebrow, H2, the two contact cards, the form with
   id="quoteForm" and a page-specific data-lead-source. Sticky .lp-sticky-cta
   bar as v1, with the unified CTA labels.

CTA labels, one per intent, used everywhere on the page including the
sticky bar: quote intent "Get a free quote" (anchor to #quoteForm); call
intent "Call 01483 323568" (tel: link). The form submit stays "Send
enquiry", which is the submit action rather than a link. v1 mixes "Get a
free quote" and "Get a quote"; v2 does not.

Motion (dial 3): hover lift on tiles and buttons as the existing classes
already do, details open and close, sticky bar slide as v1. No marquee, no
counters, no parallax. All transitions sit under the existing
prefers-reduced-motion rules; the scoped block adds its own
`@media (prefers-reduced-motion: reduce)` line switching its transitions
off.

Copy rules: UK English; no em or en dashes anywhere in visible copy, JSON-LD
or meta; hyphen only inside compound terms (soft strip-out, build-to-DPC,
1.5-tonne); no "fully accredited", "all relevant legislation" or similar
blanket claims; no figures that are not already published on the live
site; no client names except those already on the published project pages.

### Per-page outline with draft copy headings

#### /lp/demolition-2 (src/pages/lp/demolition-2.astro)

- Meta: title "Demolition Contractors Surrey | Free Site Visit, Written
  Quote"; description "Structural demolition, soft strip-out, site clearance
  and concrete crushing across Surrey, London and the South East. CHAS,
  SafeContractor and SSIP accredited. Call 01483 323568."
- Head: `<meta name="robots" content="noindex,follow">`, ServiceSchema
  name="Demolition" slug="lp/demolition-2", FAQPage JSON-LD from the FAQ
  constant. data-lead-source="lp_demolition_2".
- Hero. Eyebrow: "Demolition contractors, Surrey and the South East".
  H1: "Surrey demolition contractors". Lede (20 words): "Structural
  demolition, soft strip and site clearance for homeowners, developers and
  commercial clients. Free site visit, one working day response."
  CTAs: Get a free quote / Call 01483 323568.
- Trust strip. Line: "CHAS, SafeContractor and SSIP accredited. CSCS-carded
  operatives. Written risk assessments and method statements on every job."
- Services. H2 "Our demolition services". Lede "From first survey to a
  cleared site, one team and one point of contact." Tiles:
  1. Full structural demolition
  2. Soft strip-out
  3. Site clearance
  4. Concrete crushing
  5. Site hoarding and security
  6. Asbestos surveys and licensed removal coordination (approved wording:
     the refurbishment and demolition survey is arranged first, licensed
     removal is carried out by an HSE-licensed specialist contractor, and
     Surrey Contracting sequences the two with the demolition programme)
- Why choose. H2 "Why choose Surrey Contracting for demolition". Items:
  15+ years (already published on the homepage hero and About page);
  Accredited (CHAS, SafeContractor, SSIP, SMAS); Safety first (written risk
  assessments and method statements for every job); Own plant and crews
  (self-delivered, as the homepage says).
- How it works. H2 "How a demolition job runs with us". Steps: Free site
  visit within 5 working days; Fixed-price itemised quotation; Survey, RAMS
  and asbestos sequencing; Demolition, crushing and handover.
- No Recent work section (see claims table).
- FAQ. H2 "Demolition FAQs".
  1. What types of demolition do you carry out?
  2. Who carries out asbestos removal before a demolition? (question and
     answer verbatim from src/pages/demolition.astro lines 210 to 211)
  3. Do you crush concrete on site?
  4. What areas do you cover for demolition?
  5. How do I get a quote for demolition work?
- Closing. Eyebrow "Get your demolition quote". H2 "Ready to start your
  demolition project?" Form title "Get a free demolition quote".
- Sticky bar text: "Structural or soft strip demolition?" with "Free site
  visit, one working day response."

#### /lp/groundworks-2 (src/pages/lp/groundworks-2.astro)

- Meta: title "Groundworks Contractors Surrey | Foundations, Drainage, Site
  Prep"; description "Foundations, build to DPC, drainage, utility trenching
  and site preparation across Surrey, London and the South East. CHAS,
  SafeContractor and SSIP accredited. Call 01483 323568."
- Head as above with slug "lp/groundworks-2", data-lead-source
  "lp_groundworks_2".
- Hero. Eyebrow "Groundworks contractors, Surrey and the South East".
  H1 "Surrey groundworks contractors". Lede (19 words): "Foundations,
  drainage, trenching and site preparation for homeowners, developers and
  commercial clients. Free site visit, one working day response."
- Trust strip. Line: "CHAS, SafeContractor and SSIP accredited. CSCS, CITB,
  NPORS and IPAF carded operatives, insured on every project."
- Services. H2 "Our groundworks services". Lede "Complete groundworks for
  residential, commercial and developer-led projects." Tiles:
  1. Foundations and build to DPC
  2. Utility trenching and drainage
  3. Site preparation
  4. Excavations
  5. Agricultural groundworks
  6. Surface water drainage
- Why choose. H2 "Why choose Surrey Contracting for groundworks". Items:
  15+ years; Accredited; Safety first; Surrey and South East coverage
  (from Send, near Woking, the published base).
- How it works. H2 "How a groundworks job runs with us". Steps: Free site
  visit within 5 working days; Fixed-price itemised quotation; Programme
  agreed to your drawings and levels; Dig to DPC with one point of contact.
- Recent work. H2 "Groundworks we have delivered". Tiles: Drainage
  Installation, Ascot; Concrete Base Installation, Premier Inn Cobham; Site
  Clearance and Earthworks, Farnham. Button "View all projects" to
  /projects.
- FAQ. H2 "Groundworks FAQs".
  1. What groundworks services do you offer?
  2. Do you work on residential and commercial projects?
  3. Are you accredited and insured? (answer names CHAS, SafeContractor,
     SSIP and SMAS, CSCS cards and insurance; no Constructionline)
  4. What areas do you cover for groundworks?
  5. How do I get a groundworks quote?
- Closing. Eyebrow "Get your groundworks quote". H2 "Ready to start your
  groundworks project?" Form title "Get a free groundworks quote".
- Sticky bar text: "Foundations, drainage or site prep?"

#### /lp/earthworks-2 (src/pages/lp/earthworks-2.astro)

- Meta: title "Bulk Earthworks Contractors Surrey | Cut and Fill, Site
  Clearance"; description "Bulk earthworks, cut and fill, site levelling,
  excavation and site clearance across Surrey, London and the South East.
  CHAS, SafeContractor and SSIP accredited. Call 01483 323568."
- Head as above with slug "lp/earthworks-2", data-lead-source
  "lp_earthworks_2".
- Hero. Eyebrow "Bulk earthworks and site clearance, Surrey and the South
  East". H1 "Surrey earthworks contractors". Lede (19 words): "Bulk
  earthworks, site levelling, land clearance and excavation for developers,
  contractors and homeowners. Free site visit, one working day response."
- Trust strip. Line: "CHAS, SafeContractor and SSIP accredited. CSCS-carded
  operators. Excavators from 1.5 to 30 tonnes." (fleet range already
  published on /earthworks and /lp/earthworks)
- Services. H2 "Our earthworks and site clearance services". Lede
  "Bulk earthworks and excavation for developers, contractors and
  homeowners across the South East." Tiles (four, two by two):
  1. Bulk earthworks (cut and fill, topsoil strip, stockpiling, surplus
     removal)
  2. Commercial site clearance
  3. Bulk excavation (foundations, basements, ponds, lakes and swimming
     pools, as on the live /earthworks page)
  4. Land levelling and remediation support
- Why choose. H2 "Why choose Surrey Contracting for earthworks". Items:
  15+ years; Accredited; Safety first; Own plant (tracked excavators,
  dumpers and support plant, 1.5 to 30 tonnes).
- How it works. H2 "How an earthworks job runs with us". Steps: Free site
  visit within 5 working days; Fixed-price itemised quotation; Cut and fill
  to your drawings and levels; Muck away, compaction and handover.
- Recent work. H2 "Earthworks we have delivered". Tiles: Site Clearance and
  Earthworks, Farnham; Domestic Earthworks, Horsell, Woking; third slot is
  the "View all projects" card, not a third equal tile.
- FAQ. H2 "Bulk earthworks FAQs".
  1. What areas do you cover for bulk earthworks? (Guildford, Woking,
     Reigate, Epsom, Leatherhead and surrounding areas, all in areaServed)
  2. Do you handle commercial site clearance as well as residential?
  3. What is included in bulk earthworks?
  4. Are you accredited for excavation work? (replaces the source's "licensed
     excavation contractor", which names no licence; answer is CHAS,
     SafeContractor, SSIP, CSCS cards)
  5. How do I get a quote for earthworks or site clearance?
- Closing. Eyebrow "Get your earthworks quote". H2 "Ready to start your
  earthworks project?" Form title "Get a free earthworks quote".
- Sticky bar text: "Cut and fill or muck away?"

### Claims treatment table (source claim, where, treatment)

| Source claim | Pages | Treatment |
|---|---|---|
| Constructionline Gold Member (badge and text) | all three | Dropped. No logo in assets/acc, Ed's instruction. Note: src/data/homepage.ts FAQ answers still say the company holds Constructionline; homepage is out of scope here but Ed may want that reconciled. |
| "Licensed Asbestos Removal", "holds full asbestos removal licences" | demolition | Replaced with the PR #16 coordination wording: survey first, removal by an HSE-licensed specialist, Surrey Contracting sequences it. Tile, FAQ 2 and the services FAQ list all use it. |
| CCDO qualified operatives | demolition | Dropped. CSCS kept (logo exists). v1 /lp/demolition and live /demolition still say CCDO; unchanged here, flagged for Ed. |
| "15+ Years Experience", "over 15 years", "decade and a half" | all three | Retained as "15+ years": already on the homepage hero trust bar, About page and all v1 /lp pages. |
| CHAS Accredited, SafeContractor Approved, SSIP Certified | all three | Retained, worded "CHAS, SafeContractor and SSIP accredited" as the live site does. SMAS added because its logo exists. |
| CSCS Qualified Operatives | all three | Retained as "CSCS-carded". CITB, NPORS, IPAF named on groundworks-2 because the homepage FAQ already says operatives carry those cards and the logos exist. |
| "Fully insured", "Qualified & Insured" | groundworks, earthworks | Retained as "insured on every project": the live /earthworks FAQ already says operators are "fully trained, qualified and insured". |
| "Safe, efficient and fully accredited" | demolition | "fully accredited" replaced by the named schemes. |
| "compliance with all relevant legislation" | demolition | Dropped as a blanket claim. Replaced by "written risk assessments and method statements for every job", which is live copy. |
| "All staff fully trained and compliant" | groundworks | Replaced by the card schemes above. |
| "Modern Fleet", "Modern Plant & Equipment", "fleet of tracked excavators, dumpers and support plant" | demolition, earthworks | Retained as "own plant": "modern plant" is on live /services, /earthworks and About; the 1.5 to 30 tonne range is on live /earthworks. |
| Recent Demolition Projects: Weybridge structural demolition, Guildford site clearance, Croydon concrete crushing | demolition | Dropped. No demolition case study is published; the photos were CDN stock. demolition-2 has no Recent work section. |
| Our Projects gallery (six CDN photos captioned Excavation Works, Site Preparation, Agricultural, Surface Water Drainage, Utility Trenching, Groundworks) | groundworks | Replaced with three published projects: Drainage Installation Ascot, Concrete Base Premier Inn Cobham, Site Clearance and Earthworks Farnham. |
| Recent Earthworks Projects: Commercial Site Clearance Surrey, Bulk Excavation Home Counties, Land Levelling Surrey | earthworks | Replaced with two published projects (Farnham, Horsell) plus a link card. |
| "Land Levelling & Remediation ... environmental compliance for development-ready sites" | earthworks | Softened to "remediation support", the phrase on the live /earthworks and About pages. No compliance guarantee. |
| "ponds, lakes and swimming pools" | earthworks | Retained; live /earthworks has a "Lakes, Ponds & Swimming Pools" section. |
| "Agricultural Groundworks" | groundworks | Retained; live /groundworks has an agricultural section and /lp/agricultural exists. |
| "Are you a licensed excavation contractor? Yes." | earthworks | Question reworded to accreditation; there is no excavation licence to claim. |
| "Free, no-obligation quote", "detailed written quotation" | all three | Retained as "free site visit" and "fixed-price itemised quotation", both live on /demolition and the homepage; "within 5 working days" and "one working day response" are the published promises. |
| Coverage: Surrey, London and the South East; Guildford, Woking, Reigate, Epsom, Leatherhead | all three | Retained; matches areaServed in BaseLayout. Leatherhead appears only as a service area, as on the homepage. |
| Client names | none in source | None added except Premier Inn Cobham and the published project titles, which are already on /projects. |
| Guarantees, years founded, headcount, turnover | none in source | None; none introduced. |
| "© 2026", Quick Links, Accreditations footer | all three | Not applicable; BaseLayout footer. |

### Images per section (paths verified to exist under public/)

Hero images stay identical to v1 so the test is not confounded by the
photo. All non-hero images get loading="lazy" decoding="async" where they
are real img elements (tiles and project cards); the hero stays a CSS
background as v1.

demolition-2
- Hero: /assets/img/services/demolition-hero.jpg (149 KB)
- Tile 1 Full structural: /assets/img/demolition.jpg (261 KB)
- Tile 2 Soft strip: /assets/img/services/demolition-softstrip.webp (63 KB)
- Tile 3 Site clearance: /assets/img/services/demolition-clearance.webp (135 KB)
- Tile 4 Concrete crushing: /assets/img/services/demolition-crushing.jpg (458 KB)
- Tile 5 Hoarding: /assets/img/services/demolition-hoarding.webp (52 KB)
- Tile 6 Asbestos coordination: /assets/img/Asbestos.jpg (143 KB)
- Trust strip: /assets/acc/chas.webp, safe-contractor.webp, ssip.webp,
  smas.webp, citb.webp, cscs.webp, npors.webp, ipaf.webp (alt text from
  ACCREDITATION_LOGOS in src/data/homepage.ts, imported, not retyped)

groundworks-2
- Hero: /assets/img/services/groundworks-hero.jpg (562 KB)
- Tile 1 Foundations: /assets/img/services/groundworks-foundations.webp (100 KB)
- Tile 2 Trenching and drainage: /assets/img/services/groundworks-trench.jpg (653 KB)
- Tile 3 Site preparation: /assets/img/services/groundworks-siteprep.jpg (344 KB)
- Tile 4 Excavations: /assets/img/services/groundworks-excavation.jpg (604 KB)
- Tile 5 Agricultural: /assets/img/services/groundworks-agricultural.jpg (710 KB)
- Tile 6 Surface water drainage: "/assets/img/Surface water drainage.jpg"
  (154 KB; the filename has spaces and is already used quoted on the live
  /groundworks page; keep it quoted, do not rename the asset)
- Recent work: /assets/img/projects/drainage-ascot-4.jpg (404 KB),
  /assets/img/projects/concrete-base-cobham-3.jpg (303 KB),
  /assets/img/projects/site-clearance-earthworks.jpg (295 KB)
- Trust strip: as above

earthworks-2
- Hero: /assets/img/services/earthworks-hero.jpg (55 KB)
- Tile 1 Bulk earthworks: /assets/img/bulk-earthworks.jpg (235 KB)
- Tile 2 Site clearance: /assets/img/services/earthworks-clearance.jpg (78 KB)
- Tile 3 Bulk excavation: /assets/img/services/earthworks-excavations.jpg (81 KB)
- Tile 4 Levelling: /assets/img/services/earthworks-levelling.jpg (97 KB)
- Recent work: /assets/img/projects/site-clearance-earthworks-2.jpg (191 KB),
  /assets/img/projects/domestic-earthworks-3.jpg (429 KB)
- Trust strip: as above

Not used, and why: Demolition2.webp and demolition.jpg are byte-identical
copies (261 KB each), so one is enough; CAommercial 2.jpg, Commercial.jpg,
Hotel-and-Leisure.jpg and Schools.jpeg are sector shots, not service
shots; block-paving, brickwork, paving and hard-landscaping are
landscaping; the 800 KB-plus JPGs (drainage-ascot.jpg,
contact-hero-earthworks.jpg, Groundworks_Surrey_Contracting.jpg) are
avoided where a smaller sibling exists.

### Files to create or change

Create
- src/pages/lp/demolition-2.astro
- src/pages/lp/groundworks-2.astro
- src/pages/lp/earthworks-2.astro
  Each holds a `FAQS` constant of {q, a} pairs in the frontmatter; the
  visible details/summary markup and the FAQPage JSON-LD both render from
  it, so parity is structural, not a matter of care.
- scripts/check-lp.mjs: postbuild guard scoped by an explicit list to the
  three v2 pages. Fails the build if any of them: is missing; lacks
  `<meta name="robots" content="noindex,follow">`; contains an em or en
  dash; has other than exactly one h1 and exactly one id="quoteForm";
  has a FAQPage question or answer not in the visible text; has no Service
  or BreadcrumbList node; contains any of surfacing, tarmac, resin,
  surreyhillssurfacing, constructionline, ccdo, "asbestos removal licen",
  "fully licensed", aggregateRating; references an /assets/ path that does
  not exist under public/; or appears in dist/client/sitemap-0.xml. Same
  helper style as check-guides.mjs.

Change
- package.json "postbuild": append `&& node scripts/check-lp.mjs`.
- public/styles.css: append one block headed `/* ============ LP v2 (A/B)
  ============ */` with .lp2-trust, .lp2-services, .lp2-tile, .lp2-why,
  .lp2-steps and their breakpoints (700px, 480px) and a
  prefers-reduced-motion rule. Tokens only; no new colours, radii or fonts.
  Target under 120 lines. Nothing existing is edited.
- tasks/todo.md: this section, updated with build status and evidence.

Not changed: BaseLayout, Nav, Footer, ServiceSchema, app.js, astro.config,
the v1 /lp pages, any image.

### Implementation items (checkable)

- [ ] Build demolition-2 first, on this branch, with the scoped CSS block
      and the guard. Run the full verification below on that one page.
- [ ] Playwright screenshots of demolition-2 at 375 and 1280 sent to Ed
      before the other two pages are written (lessons.md: mock-up before
      the full build on a commercial page).
- [ ] After Ed's look, clone the skeleton to groundworks-2 and earthworks-2
      with their own copy, images, FAQ constants and lead sources.
- [ ] Extend the guard's page list to all three.
- [ ] Run the full verification on all three; record evidence here.
- [ ] Open a PR titled "LP v2 A/B variants: demolition-2, groundworks-2,
      earthworks-2 (noindex)". Body lists the three URLs, the lead-source
      labels and the claims table. Do not merge unprompted.
- [ ] Hand Ed the three final URLs and the GA4 event_label values for the
      ads split (or for the ads agency).

### Acceptance criteria

- Three pages build at /lp/demolition-2, /lp/groundworks-2,
  /lp/earthworks-2; the v1 pages are byte-identical to main.
- Each page: one h1; hero H1 renders on at most two lines at 375 and 1280
  wide; hero lede is 20 words or fewer; both hero CTAs are inside the
  first viewport at 375 by 812 and 1280 by 800; no horizontal scroll at
  either width.
- Exactly one form with id="quoteForm" per page, data-ytq-form present,
  data-lead-source is lp_<service>_2, same field names as v1 so
  /api/contact and the YTQ connector need no change.
- CTA labels: every quote link reads "Get a free quote" and every call link
  reads "Call 01483 323568"; no "Get a quote" or "Call us".
- At most two eyebrows per page.
- No section renders three equal cards in a row at any width.
- Zero em or en dashes in the built HTML of each page.
- noindex,follow present in the head; none of the three URLs in
  sitemap-0.xml; no link to any /lp/ URL from Nav, Footer or the homepage.
- FAQPage JSON-LD: five questions, each question and answer present
  character-for-character in the visible text.
- None of: Constructionline, CCDO, "asbestos removal licence", "fully
  licensed", surfacing, tarmac, resin, registration numbers, register
  links, author or date credits, aggregateRating.
- Every image path referenced exists under public/; no external image
  hosts.
- Only the scoped .lp2-* rules are added to styles.css; no existing rule is
  edited; colours resolve to existing tokens; yellow (#E6A91A) appears only
  on dark surfaces, gold (#8A6408) for accents on light.
- prefers-reduced-motion disables every transition the new block adds.
- `npm run build` exits 0 with all four postbuild guards passing.

### Verification steps (record evidence under each when done)

1. `npm ci && npm run build` from the repo root. Expect the three existing
   guards plus check-lp.mjs all green. (Confirmed possible in this sandbox
   on 30 Sep: build and guards green on the current tree.)
2. Dashes: `grep -rl -e "$(printf '\342\200\224')" -e "$(printf '\342\200\223')"
   dist/client/lp/` must print nothing (the two printf escapes are the em
   and en dash in UTF-8 octal, so the command itself carries no dash).
   Note: `grep -P '\x{2014}'` fails in this sandbox's locale; use the
   printf form above.
3. noindex: `grep -c 'name="robots" content="noindex,follow"'
   dist/client/lp/<slug>-2/index.html` is 1 for each page.
4. Sitemap: `grep -c "/lp/" dist/client/sitemap-0.xml` is 0.
5. Nav and footer: `grep -rn "/lp/" src/components src/layouts
   src/pages/index.astro` returns nothing.
6. FAQ parity: enforced by check-lp.mjs; also run the ad-hoc node snippet
   used on 22 Sep for /demolition against each v2 page and record "0 of 5
   not matching".
7. Single form: `grep -o 'id="quoteForm"' dist/client/lp/<slug>-2/index.html
   | wc -l` is 1.
8. Forbidden words: `grep -il "constructionline\|ccdo\|asbestos removal
   licen\|fully licensed\|surfacing\|tarmac\|resin" dist/client/lp/*-2/
   index.html` returns nothing.
9. Images: for each `/assets/...` referenced in the three built pages,
   `test -f public<path>`; the guard does this too.
10. Visual, Playwright with Chromium at /opt/pw-browsers (installed,
    1.56.1): start `node dist/server/entry.mjs` (standalone node adapter)
    or `npm run preview`, then a short script that for each page at
    375 by 812 and 1280 by 800: takes a full-page screenshot to the
    scratchpad; asserts h1 height divided by its computed line-height is
    at most 2; asserts both hero CTA bounding boxes have bottom at most
    innerHeight; asserts document.scrollWidth equals innerWidth; counts
    .eyebrow elements at most 2; counts details.faq-item equals 5. Attach
    the six screenshots to the PR and send them to Ed.
11. Schema, after deploy: validator.schema.org on each live URL (the pages
    are noindex but the validator still fetches them). Expect Service,
    BreadcrumbList, FAQPage plus the site-wide business node, 0 errors.
    Google's Rich Results Test cannot be automated from this sandbox
    (egress proxy resets), so Ed runs that by hand if he wants the record.
12. End to end after deploy: one test submission from /lp/demolition-2
    with a clearly marked test message; confirm the enquiry email's last
    line reads "Page: /lp/demolition-2" and GA4 DebugView shows
    generate_lead with event_label lp_demolition_2.

### Risks

- Confounding. Structure and copy density change together; that is the
  intended bundle, but if v2 wins nobody learns which element did it.
  Accepted for a first test; a follow-up could test the trust strip alone.
- Message match. Google Ads is with another agency since 9 Sep. If their
  ad headlines say "Demolition Contractors in Surrey" and the H1 says
  "Surrey demolition contractors", the words match but the order differs.
  Ed can swap the H1 order if the ads dictate; the two-line rule at 375
  wide is the constraint that drove the shorter form.
- H1 wrapping. Montserrat 800 at the page-title minimum of 36px fits about
  15 characters a line at 375 wide, so any H1 over 30 characters wraps to
  three lines. The proposed H1s are 28 to 30 characters. If Ed wants the
  longer source H1s, the scoped block can lower the v2 hero minimum to
  30px, and the Playwright check decides.
- Image weight. Several service JPGs are 450 to 710 KB and the groundworks
  hero is 562 KB. Lazy loading keeps them off the critical path but LCP on
  groundworks-2 will match v1, not beat it. Recompressing is an asset
  change outside this plan, as noted for the homepage on 14 Sep.
- v1 drift. The v1 /lp pages fail FAQ parity today. The new guard is scoped
  to v2 so the build stays green, but the drift remains live and is Ed's
  call to fix separately.
- Runtime dashes. app.js success and error messages contain em dashes and
  will show after a submit on every page, v2 included. A one-line change
  in app.js fixes it site-wide; not in this plan's scope unless Ed says so.
- Demolition proof. demolition-2 has no project tiles because none are
  published. If the Esher demolition facts arrive from Jason, a tile can
  be added later; until then the page leans on the trust strip and the
  process steps.
- Guard false positives. The forbidden-word list includes "resin"; no v2
  copy uses it, but "resinous" or similar in a future edit would trip it,
  as on the homepage. Intentional.
- Sanity dependency. Project tiles link to /projects/<slug> pages that
  render from Sanity. If a project is unpublished the link 404s; the guard
  cannot see that. Check the three slugs exist on the live /projects page
  before the PR.

### Open questions for Ed

1. Who runs the 50/50 split (Ed in the ads account, or the agency), and for
   how long? The site side is ready once the three URLs exist; the plan
   only needs the labels agreed: lp_demolition_2, lp_groundworks_2,
   lp_earthworks_2.
2. H1 order: "Surrey demolition contractors" (fits two lines at 375 wide)
   or the source's "Demolition contractors in Surrey" (three lines at 375
   unless the v2 hero minimum font drops to 30px). Same for the other two.
3. Should the v1 /lp pages' CCDO wording and FAQ schema drift, and the
   homepage FAQ's Constructionline sentence, be fixed in a separate small
   PR? They contradict the v2 rules but are outside this brief.
