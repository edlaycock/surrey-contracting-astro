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
- [ ] validator.schema.org against the live URLs after deploy

### Still blocked on Jason
No demolition case study exists for any town, so /demolition-guildford and the
rest remain unbuilt. The Esher demolition photos and video from 20 Aug are
still unusable without the facts.
