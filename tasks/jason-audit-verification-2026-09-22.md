> **Superseded on the same day.** This reviewed Jason's *email* only. The email was a
> summary of a 35-page implementation brief which arrived afterwards and which is
> considerably more specific. See `jason-brief-register-2026-09-22.md` for the
> change-by-change status, including two findings in the brief that were correct
> and that this document missed (the asbestos licensing claim and the outdated
> building control terminology).

# Verification of Jason's audit claims, 22 September 2026

Every claim in Jason's email checked against the live site. Method: crawled all
26 URLs in `sitemap-0.xml`, plus a set of legacy URLs, and grepped the rendered
HTML. Nothing below is inferred from the repository; it is all from live pages.

## Claim by claim

| Jason's claim | Verdict | Evidence |
|---|---|---|
| Old Leatherhead address appears on some pages | **False** | "Leatherhead" appears on all 26 pages, but only ever as a service area: a `Place` in the `areaServed` array and an item in the "Areas we cover" list. It never appears as an address. The only postal address on the site is Unit 3, Tannery House, Tannery Lane, Send, Woking, GU23 7EF. |
| Old telephone number on some pages | **False** | One number exists site-wide: 01483 323568. 107 `tel:` links, all identical. No other UK number anywhere. (An apparent match, "061382551", is part of a Sanity image filename hash.) |
| Older company/business details | **False** | Company number 15877451 appears twice on every page (footer text and business JSON-LD). The previous number 15454300 returns zero matches site-wide. VAT 415 8380 91 is consistent. |
| Commercial Surfacing in navigation or footer | **False** | Zero occurrences of "surfacing", "tarmac", "resin", "Commercial Surfacing" or "surreyhillssurfacing" on any of the 26 pages. The single "driveway" hit is the word "driveways" describing access on the Weybridge page. |
| Older versions of the service offering | **False** | Every page's nav and footer list Demolition, Groundworks and Bulk Earthworks only. |
| Inconsistent headers and footers across pages | **False** | All 26 pages carry exactly one global nav and one global footer. The site is a single Astro application with one `Nav.astro` and one `Footer.astro`, so a page physically cannot render a different one. |
| Sitemap contains pages we do not want indexed | **False** | 26 URLs, all intended. `/training-manual` and the `/lp/` landing pages are excluded by a sitemap filter, and `/training-manual` additionally carries `noindex, nofollow`. |
| Old or duplicate URLs not dealt with | **False** | Legacy surfacing and project URLs all return 301 to a sensible target (`/surfacing`, `/lp/surfacing`, three tarmac project URLs, and the `project-*` legacy pattern). Genuinely non-existent paths (`/commercial-surfacing`, `/driveways`, `/landscaping`) return 404, which is correct. `/sitemap.xml` 301s to `/sitemap-index.xml`. |
| SEO hierarchy between the three services is unclear | **False** | `/services` is the hub with the three services beneath it. Every service page carries a `BreadcrumbList` reading Home > Services > [Service]. The business node carries an `OfferCatalog` naming all three with their URLs. Location pages nest one level deeper: Home > Groundworks > Town. |

## Claims that ARE correct

| Point | Verdict | Detail |
|---|---|---|
| Some projects do not match the three services | **True** | 2 of 7 published projects are categorised "Hard Landscaping": `complete-landscape` (Virginia Water) and `landscape-guildford`. "Hard Landscaping" is also offered as a filter chip on `/projects`. |
| More projects needed that line up with current services | **True** | 7 projects total. Breakdown: Groundworks 5, Drainage 2, Earthworks 2 (overlapping), Hard Landscaping 2, **Demolition 0**. |
| Do not buy backlinks before the foundations are clean | **True, and good judgement** | Correct order of work regardless of the audit findings. |
| Wants less reliance on paid ads long term | **Reasonable** | Organic and AEO work done this month supports that direction. |

## Findings Jason's email does not mention, which matter more

1. **Demolition has zero project evidence.** The `/demolition` service page carries
   no case study at all, and no demolition location page can be built. This has
   been blocked since 20 August waiting on the Esher demolition facts. It is the
   single biggest content gap on the site and it is the one thing on this list
   only Jason can unblock.
2. **Removing `landscape-guildford` would break a live page.** It is the sole
   published proof behind `/groundworks-guildford`, and a build guard fails the
   deployment if that card does not render. If it is retired it must be replaced
   with a genuine Guildford groundworks project first, not simply deleted.
3. **Weybridge and Epsom have no local case study.** Both pages state that in
   plain words on the page. Real projects in those towns would let them make a
   stronger claim.
4. **Search Console actions are still outstanding on Ed's side**: indexing not
   yet requested for the five pages added this month, and GA4 `generate_lead` is
   not yet marked as a key event or imported as an Ads conversion.

## The likely explanation for the discrepancy

The homepage and service pages were rebuilt on 14 September, and the location
pages, guides and company number correction landed on 14, 15 and 16 September.
Anything an AI tool or a cached search result reports from before those dates
describes a site that no longer exists. Google's index and third party AI
crawlers lag live changes by days to weeks, and several AI search tools answer
from training data rather than a live fetch.

So the audit is not necessarily wrong about what it saw. It is wrong about what
is there now.

## What is genuinely worth doing

1. Request indexing for the pages changed this month so Google refreshes faster.
2. Decide the position on the two Hard Landscaping projects, with the Guildford
   dependency in mind.
3. Get the Esher demolition facts from Jason and publish a demolition case study.
4. Supply more projects in the three current categories.
5. Only then spend on backlinks.
