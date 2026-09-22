# Jason's implementation brief (19 Sep 2026): status of every change ID

Verified against the live site on 22 September 2026. Method: fresh fetch of
every URL the brief names, git history for the old identity, and a grep of the
rendered HTML. This supersedes `jason-audit-verification-2026-09-22.md`, which
reviewed only the email. The email turned out to be a loose summary of this
document, and this document is a great deal more specific and more useful.

Three-line verdict:

- The brief is AI-generated from a real crawl plus cached data. Everything it
  says about pages that changed on 14 to 16 September is accurate, so it did
  fetch the live site. Everything it says about the project and legacy pages
  comes from a cache, and is wrong today.
- It found two things we missed. One is a genuine legal exposure. One is my
  own error. Both are being fixed.
- Roughly half the document is a commercial repositioning of the brand, which
  is a business decision for Jason and Ed to make in a meeting, not a defect
  list for a developer.

## Where the brief was right and we were not

| ID | Finding | Status |
|---|---|---|
| SC-001, SC-D07, SC-S04, SC-H04, SC-AB04 | `/demolition` states Surrey Contracting "carrys out fully licensed and fully insured asbestos removal" and repeats it in an FAQ. The homepage says "asbestos removal coordination" and "work with the client's asbestos surveyor". The demolition cost guide says licensed work is done by an HSE-licensed contractor. Three different claims on one site. | **CONFIRMED. The most important finding in the document.** Licensed asbestos removal may only be carried out by an HSE-licensed contractor under the Control of Asbestos Regulations 2012. If Surrey Contracting does not hold that licence, the demolition page is advertising work it cannot lawfully do. **Jason must answer one question: does Surrey Contracting hold a current HSE asbestos licence?** If no, the demolition page and the homepage service card change to coordination wording this week. Copy prepared, awaiting that answer. |
| SC-S03, SC-009, SC-L03, SC-GD01 | "Private approved inspector" is outdated. Approved Inspectors were replaced by Registered Building Control Approvers in England. | **CONFIRMED, and this one is mine.** I wrote it on all four town pages and the planning guide on 14 to 16 September. Fixed in source today; ships with the next deploy. |
| SC-E07, SC-D06 | Missing spaces ("South East.We", "works.Whether", "costs.Surrey", "requirements.Where") and "carrys" on the earthworks and demolition pages. | **CONFIRMED.** Nine joined sentences and one spelling error, on the two service pages that were never rewritten. Fixed in source today. |
| SC-HS01 | "Safety is our number one priority" appears twice on `/health-safety`. | **CONFIRMED.** The hero lede and the first H2 are word-for-word identical. Not changed yet: it is a heading on a page Ed has not asked to touch, so it is proposed rather than done. |
| SC-P04, SC-P05, SC-010, SC-L04 | Hard Landscaping is a portfolio filter, two of seven projects are landscaping, and a patio is the Guildford groundworks proof. | **CONFIRMED.** Already flagged on 22 September. The brief's proposed Guildford wording is the same honest pattern already used on Weybridge and Epsom. Needs a replacement Guildford job before the landscaping card comes down, or the page loses its only evidence. |
| SC-H07, SC-P05 | No demolition case study exists. | **CONFIRMED.** Blocked on Jason since 20 August. |

## Where the brief was wrong, with proof

| ID | Claim | Status |
|---|---|---|
| SC-002, SC-003, SC-S01, and the "CRITICAL TEMPLATE FIX" rows in section 16 | `/projects/domestic-earthworks` and `/projects/landscape-guildford` "still display the old 01932 number, Leatherhead address, old company number and Commercial Surfacing navigation". The brief says these two URLs "prove" the global template has not propagated. | **FALSE on the live site.** Fresh fetch today: both pages return 200 with 01483 323568 (3 times each), Tannery Lane (2), company number 15877451 (2), and zero hits for 01932, KT24, 15454300 or Commercial Surfacing. Every one of the 26 pages in the sitemap renders the same single `Nav.astro` and `Footer.astro`; there is no second template for them to be stuck on. |
| Section 16, tarmac rows | `/projects/tarmac-repairs-sutton` and `/projects/tarmac-driveway` "still expose Commercial Surfacing in page template". | **IMPOSSIBLE on the live site, and this is the tell.** Both URLs have returned a 301 to `/projects` since Deployment 1 on 19 August. A redirect has no page template. The brief lists both in its "pages reviewed" and describes their content, which means that part of the audit was reading a cached copy, not the live site. |
| SC-004 | Legacy surfacing and driveway URLs need auditing and deciding. | **ALREADY DONE** in August. Three tarmac project URLs 301 to `/projects`, `/surfacing` and `/lp/surfacing` 301 to `/groundworks`, and the `project-*` legacy pattern redirects to the current slugs. The brief's point that a driveway page should not redirect to Groundworks is fair in principle, which is why those three go to `/projects`, not `/groundworks`. |
| Section 21 sign-off items 2 to 5 | Old number, old address, old company number, Commercial Surfacing to be removed. | **ALREADY TRUE.** Zero occurrences of any of them on any live page. Git history confirms 01932 932650 and KT24 5JQ were the genuine old identity, removed in June (commit 5250d8d) and finally from schema on 20 August. The auditor had real historical data, just not current data. |

Why the split: the brief correctly describes `/areas`, the Weybridge and Epsom
disclosure wording, both guides, the homepage FAQ and the current company
number, all of which have only existed since 14 to 16 September. So it fetched
the live site for those. For the project and legacy pages it reports content
that has not been served since August. That is what a browsing AI tool does
when it mixes a live fetch with its own index.

## Where the brief is opinion, not defect

These are legitimate suggestions. They are also a strategic shift, and they
belong in the meeting rather than in a developer's ticket queue.

| Theme | IDs | What it amounts to |
|---|---|---|
| Reposition the brand toward developers, main contractors and commercial packages, away from residential | SC-H02, H03, H05, SC-G02, G03, SC-E02 to E06, SC-L02, SC-A02, SC-SEC01 to 02, SC-AB02 to 03 | A business decision. It changes who the site is written for. It also sits awkwardly with the residential ad funnel, the "5 working day site visit" promise on the homepage, and the review pipeline aimed at homeowners. Worth doing only if Jason actually wants fewer residential enquiries, and that is his call to make explicitly. |
| Rewrite the demolition and earthworks service pages | SC-D02 to D08, SC-E02 to E06 | Both pages are the oldest copy on the site and the weakest, and the brief is right that they are adjective-heavy. The supplied replacement copy is competent but generic, and it makes claims about crushing and RAMS that need confirming as true. A rewrite is worth doing; it should be written from what Surrey Contracting actually does, not pasted in. |
| Structured case studies (Brief, Delivery, Quantities, Constraints, Outcome) | SC-016, section 16 | Good format. Southbank already uses it. The other five would benefit. Needs facts from Jason for each. |
| Real photography as `<img>` rather than CSS backgrounds | SC-011, SC-D09, SC-E08, section 18 | Sound advice. Demolition page has 2 `<img>` against 7 CSS backgrounds. Blocked on the same thing as everything else: there are no usable demolition photos except the Esher set, which has no facts attached. |
| Form fields for drawings and programme | SC-S06, SC-C02 | Reasonable for commercial leads. Adds friction for residential ones. Same positioning question. |
| Title and meta rewrites | Section 17 | Mostly fine. The recommended homepage title is shorter than the one Ed approved on 11 September; no reason to change it. |
| Author and review details on guides | SC-GD02 | Ed removed author credit and dates from the site in PR #9. Not doing this. |
| Article or BlogPosting schema | Section 19 | Ed's rule is LocalBusiness and FAQPage only on the homepage; guides carry BreadcrumbList and FAQPage. Not adding Article. |
| Soften "industry would rather hide" | SC-HS02 | Tone call. Defensible either way. |

## What the brief explicitly approves

Worth noting, because it undercuts the idea that the site is broken:

- Every H1 on the site: "Keep current H1. No change required." (SC-H01, G01, D01, E01, A01, AB01, L01)
- The four town pages: "Quality/local differentiation is already a strength of the current four pages and should be preserved." (SC-A03)
- Weybridge and Epsom nearest-project wording: "This is better than inventing local relevance." (SC-L06)
- The groundworks planning guide: "This is the standard the weaker service pages should move toward." (SC-GD02)
- The demolition cost guide's asbestos wording: "more legally cautious than the main Demolition page." (SC-GD03)
- Groundworks alt text: "Do not rewrite good alt text simply to add more keywords." (SC-G05)

## What I got wrong on 22 September, before seeing this document

I told Ed the audit "contains not one single specific example, no URL, no
screenshot, no page named". That was true of the email. It is not true of the
brief behind it, which names 25 URLs and 60-odd change IDs. I should have
asked whether there was a source document before characterising the audit.

I also missed the asbestos inconsistency and introduced the outdated building
control term. The brief caught both.

## Actions

| # | Action | Owner | Status |
|---|---|---|---|
| 1 | Answer: does Surrey Contracting hold a current HSE asbestos licence? | Jason | **Answered 22 Sep: no.** "We are not licensed to remove asbestos. We work closely with licensed asbestos removal companies who carry out that work, and we coordinate it." He asked for the wording to be made consistent across the site. |
| 2 | Replace "private approved inspector" with Registered Building Control Approver on 4 town pages and the guide | Ed / Claude | Done in source, ships next deploy |
| 3 | Fix joined sentences and "carrys" on `/demolition` and `/earthworks` | Ed / Claude | Done in source, ships next deploy |
| 4 | Change asbestos wording on `/demolition` and the homepage demolition card to coordination language | Ed / Claude | Done in source 22 Sep on Jason's answer, plus three further places the register had not listed: the demolition FAQ that named it as a service, the About page enabling-works list, and both llms files. PR open for Ed to merge. |
| 5 | Remove the duplicate "number one priority" heading | Ed | Proposed. Not changed without Ed's say-so. |
| 6 | Reply to Jason with this register, and ask which tool produced the brief | Ed | Draft updated |
| 7 | Meeting: decide the commercial-vs-residential positioning before any service page rewrite | Ed and Jason | Next week |
| 8 | Esher demolition facts, a Guildford groundworks job, 3 to 4 more projects | Jason | Outstanding since 20 August |
| 9 | Rewrite `/demolition` and `/earthworks` once positioning is decided | Ed / Claude | After 7 |
| 10 | Search Console: request indexing for everything changed since 14 September | Ed | Outstanding |

## Appendix: prepared asbestos wording (not deployed)

Deploy only once Jason has answered the licence question. If the answer is
"no licence", this replaces the current claims. If "yes", keep the current
wording and add the licence number to the page instead. Everything below
describes coordination, which is true whichever way the answer goes.

**`/demolition`, section heading**
Asbestos surveys and licensed removal coordination

**`/demolition`, section lede (replaces "Surrey Contracting carries out fully
licensed and fully insured asbestos removal")**
Before any soft strip or structural demolition, a refurbishment and demolition
asbestos survey has to be in place where asbestos may be present. Where the
survey finds licensed work, that removal is carried out by an HSE-licensed
specialist contractor before the affected demolition proceeds. Surrey
Contracting sequences the survey, the specialist removal and the demolition
programme so they run as one package rather than three.

**`/demolition`, FAQ answer (replaces "Yes. Surrey Contracting carries out
fully licensed and insured asbestos removal...")**
Not directly. Licensed asbestos removal can only be carried out by an
HSE-licensed contractor, and we bring a specialist in for that work. What we
do is make sure the survey is in place first, sequence the removal ahead of
the demolition, and handle the site access and handover so the two programmes
do not fight each other. The FAQ question itself changes to "Who carries out
asbestos removal before a demolition?" so the answer is not a bare "no".

**`/demolition`, page description (the meta description currently reads
"...on-site crushing and asbestos removal across Surrey")**
Soft strip out, structural demolition, on-site crushing and coordinated
asbestos removal across Surrey. CHAS and SSIP accredited. Free measured site
visit.

**Homepage demolition service card (replaces "...soft strip-outs, on-site
crushing and asbestos removal")**
Commercial and residential demolition, from small residential projects to
large commercial sites: soft strip-outs, on-site crushing, and licensed
asbestos removal coordinated through specialist contractors where required.

The demolition-cost guide already carries the correct distinction and does not
change. The homepage FAQ answers already use "coordination" wording and do not
change.
