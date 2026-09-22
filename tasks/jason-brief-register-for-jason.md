# Surrey Contracting website: status of every change in the 19 September brief

Prepared by Ed for Jason, Surrey Contracting Limited. Checked against the live site on 22 September 2026.

## How this was checked

Every URL named in the brief was fetched fresh from the live site on 22 September. All 26 pages in the sitemap were crawled and the rendered HTML searched for the old telephone number, the old postcode, the old company number and "Commercial Surfacing". The company's own code history was used to confirm what the old details were and when they were removed. Nothing below is taken from memory or from a cached copy.

## In three lines

- The brief was right about two things nobody had spotted. Both are dealt with below.
- Its biggest finding, that two project pages still carry the old company details, is not true of the live site. The evidence is below, including how the brief came to think otherwise.
- About half of the brief is a decision about the direction of the business rather than a fault with the website. Those items are listed for discussion, not actioned.

## 1. Confirmed, and what has been done

| Brief ID | Finding | Status |
|---|---|---|
| SC-001, SC-D07, SC-S04, SC-H04, SC-AB04 | The demolition page says Surrey Contracting "carries out fully licensed and fully insured asbestos removal" and repeats it in an FAQ. The homepage says the company coordinates it. The demolition cost guide says a licensed specialist carries it out. Three different claims on one site. | Confirmed. This is the most important item in the brief. Licensed asbestos removal may only be carried out by an HSE-licensed contractor. Jason to confirm in writing whether Surrey Contracting holds a current HSE asbestos licence. Replacement wording is in the appendix and goes live on that answer. |
| SC-S03, SC-009, SC-L03, SC-GD01 | "Private approved inspector" is out-of-date terminology. Approved Inspectors were replaced by Registered Building Control Approvers in England. | Confirmed and fixed. Corrected on all four town pages and the groundworks planning guide. Live since 22 September. |
| SC-E07, SC-D06 | Missing spaces ("South East.We", "works.Whether", "costs.Surrey") and the spelling "carrys" on the earthworks and demolition pages. | Confirmed and fixed. Nine joined sentences and one spelling corrected. Live since 22 September. |
| SC-HS01 | "Safety is our number one priority" appears twice on the health and safety page. | Confirmed. The hero line and the first heading are identical. Proposed change, to be agreed at the meeting. |
| SC-P04, SC-P05, SC-010, SC-L04 | Hard Landscaping is a portfolio filter, two of the seven published projects are landscaping, and a patio is the featured Guildford groundworks evidence. | Confirmed. The Guildford landscaping project is currently the only published work in Guildford, so it needs replacing with a genuine Guildford groundworks job before it comes down, or the Guildford page loses its only evidence. Jason to supply. |
| SC-H07, SC-P05 | No demolition case study is published. | Confirmed. Waiting on the Esher demolition facts since 20 August. |

## 2. Not correct on the live site, with the evidence

| Brief ID | Claim | What the live site shows |
|---|---|---|
| SC-002, SC-003, SC-S01, section 16 "critical template fix" | The Domestic Earthworks and Guildford landscaping project pages "still display the old 01932 number, Leatherhead address, old company number and Commercial Surfacing navigation" and "prove" the new header and footer have not propagated. | Both pages fetched fresh on 22 September. Both carry 01483 323568 (three times each), Tannery Lane, Send (twice) and company number 15877451 (twice). Zero occurrences of 01932, KT24, 15454300 or Commercial Surfacing. Every page on the site is generated from one shared header and one shared footer, so a page cannot be on a different template. |
| Section 16, tarmac rows | The Sutton and West Humble tarmac project pages "still expose Commercial Surfacing in page template". | Not possible. Both URLs have returned a permanent redirect to /projects since 19 August. A redirect has no page content to describe. The brief lists both among the pages it reviewed and describes their content, which shows that part of the audit was working from a cached copy of the old site rather than the live one. |
| SC-004 | Legacy surfacing and driveway URLs need auditing and deciding. | Already done in August. The three tarmac project URLs redirect to /projects, /surfacing and /lp/surfacing redirect to /groundworks, and the old project-* addresses redirect to the current pages. |
| Section 21, sign-off items 2 to 5 | Old number, old address, old company number and Commercial Surfacing to be removed. | Already true. Zero occurrences on any of the 26 live pages. The old details the brief quotes were genuinely the company's until June, so the tool had accurate historical information; it was not current. |

Why the brief is right about some pages and wrong about others: it correctly describes the Areas We Cover page, the Weybridge and Epsom wording, both guides and the current company number, none of which existed before 14 to 16 September. So it did fetch those pages live. For the project and legacy pages it reports content that has not been served since August. That is what happens when an AI tool mixes a live fetch with its own stored copy of a site.

## 3. Decisions rather than faults

These are reasonable suggestions. They change what the business is presenting itself as, so they are for the meeting rather than for a job list.

| Theme | Brief IDs | What it involves |
|---|---|---|
| Reposition the site towards developers, main contractors and commercial packages, and away from residential | SC-H02, H03, H05, SC-G02, G03, SC-E02 to E06, SC-L02, SC-A02, SC-SEC01 to 02, SC-AB02 to 03 | Changes who the site is written for. It sits awkwardly with the current residential enquiry flow, the ads built around it, and the five working day site visit promise on the homepage. Worth doing only if fewer residential enquiries is the intended outcome. |
| Rewrite the demolition and earthworks service pages | SC-D02 to D08, SC-E02 to E06 | Both are the oldest copy on the site and the brief is right that they are adjective-heavy. The supplied replacement copy is competent but generic, and makes claims about crushing and RAMS that need confirming as true before publication. A rewrite is worthwhile once the positioning is decided. |
| Structured case studies: brief, delivery, quantities, constraints, outcome | SC-016, section 16 | Good format. Southbank already uses it. The other five would benefit. Needs facts from Jason for each project. |
| Real project photography embedded as images rather than backgrounds | SC-011, SC-D09, SC-E08, section 18 | Sound advice. Depends on usable demolition and earthworks photographs with facts attached. |
| Enquiry form fields for drawings and programme | SC-S06, SC-C02 | Useful for commercial leads, adds friction for residential ones. Same positioning question. |
| New page titles and descriptions | Section 17 | Mostly fine. The recommended homepage title is shorter than the one agreed on 11 September; no reason to change. |
| Author and review details on the guides | SC-GD02 | Not adopted. Author credits and review dates were removed from the site on 11 September by decision. |
| Article schema on guides | Section 19 | Not adopted. The site's structured data policy is LocalBusiness and FAQPage on the homepage; guides carry BreadcrumbList and FAQPage. |
| Soften "incidents the industry would rather hide" | SC-HS02 | A tone call, defensible either way. For the meeting. |

## 4. What the brief says to keep

Worth noting alongside the faults:

- Every H1 on the site: "Keep current H1. No change required." (SC-H01, G01, D01, E01, A01, AB01, L01)
- The four town pages: "Quality/local differentiation is already a strength of the current four pages and should be preserved." (SC-A03)
- The Weybridge and Epsom nearest-project wording: "This is better than inventing local relevance." (SC-L06)
- The groundworks planning guide: "This is the standard the weaker service pages should move toward." (SC-GD02)
- The demolition cost guide's asbestos wording: "more legally cautious than the main Demolition page." (SC-GD03)

## 5. Actions

| # | Action | Owner | Status |
|---|---|---|---|
| 1 | Confirm in writing whether Surrey Contracting holds a current HSE asbestos licence | Jason | Blocking. Everything asbestos-related waits on this. |
| 2 | Building control terminology corrected on four town pages and the planning guide | Ed | Done, live 22 September |
| 3 | Spacing and spelling corrected on the demolition and earthworks pages | Ed | Done, live 22 September |
| 4 | Asbestos wording on the demolition page and homepage changed to match the answer to item 1 | Ed | Wording ready, goes live on Jason's answer |
| 5 | Esher demolition case study: client type, scope, difficulties, outcome, rough dates | Jason | Outstanding since 20 August |
| 6 | A completed Guildford groundworks project, so the landscaping one can be retired without emptying the Guildford page | Jason | Outstanding |
| 7 | Three or four further projects in the three core services, using the template Ed will send | Jason | Template this week |
| 8 | Decide the commercial versus residential positioning before any service page rewrite | Ed and Jason | Meeting, week of 29 September |
| 9 | Rewrite the demolition and earthworks pages once positioning is decided | Ed | After item 8 |
| 10 | Request re-indexing in Search Console for everything changed since 14 September | Ed | This week |
| 11 | Monthly one-page report on what has been done and what has moved | Ed | From October |

## Appendix: proposed asbestos wording, for approval

To be used if the licensed removal is subcontracted. If Surrey Contracting does hold an HSE licence, the current wording stays and the licence number is added instead.

Demolition page, section heading: Asbestos surveys and licensed removal coordination

Demolition page, section text: Before any soft strip or structural demolition, a refurbishment and demolition asbestos survey has to be in place where asbestos may be present. Where the survey finds licensed work, that removal is carried out by an HSE-licensed specialist contractor before the affected demolition proceeds. Surrey Contracting sequences the survey, the specialist removal and the demolition programme so they run as one package rather than three.

Demolition page, FAQ question and answer: "Who carries out asbestos removal before a demolition?" Licensed asbestos removal can only be carried out by an HSE-licensed contractor, and we bring a specialist in for that work. What we do is make sure the survey is in place first, sequence the removal ahead of the demolition, and handle the site access and handover so the two programmes do not fight each other.

Demolition page description (search result text): Soft strip out, structural demolition, on-site crushing and coordinated asbestos removal across Surrey. CHAS and SSIP accredited. Free measured site visit.

Homepage demolition card: Commercial and residential demolition, from small residential projects to large commercial sites: soft strip-outs, on-site crushing, and licensed asbestos removal coordinated through specialist contractors where required.

The demolition cost guide already states the correct position and does not change. The homepage FAQ answers already use coordination wording and do not change.
