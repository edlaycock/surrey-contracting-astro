# Todo — SEO/AEO work plan (surreycontracting.co.uk)

Context: audit (20 Aug 2026) verified the technical/AEO base is already strong: robots.txt allows AI crawlers, sitemap-index.xml valid, llms.txt present, HomeAndConstructionBusiness + Service + BreadcrumbList + FAQPage schema live, /lp/* correctly noindexed. Score 57/60. Remaining work is small fixes plus content depth. Do NOT rework existing schema or meta, it is verified correct.

Working rules for this repo:

* Plan mode for P2 and P3 before writing anything. Check the plan with Ed first.
* Simplicity first, minimal diffs, reuse existing components and layout patterns.
* Never invent reviews, ratings, testimonials, project details or client names. No aggregateRating schema, there are no verified reviews yet.
* Verify before done: `npm run build` clean, then confirm new URLs appear in sitemap-0.xml output and schema parses.
* UK English throughout. No em dashes in copy.
* After any correction from Ed, log the pattern in tasks/lessons.md.

## P0 — Quick fixes

* [x] og:image + twitter:card summary_large_image in BaseLayout. New 1200x630 `/assets/img/og-default.jpg` (cropped from Groundworks_Surrey_Contracting.jpg site photo) as the default; pages can still override via the existing `ogImage` prop.
* [x] /training-manual exposure: removed the Disallow line from robots.txt (it advertised the path) and added `noindex, nofollow` meta to the manual page itself. Sitemap already excluded it. Reversible if Ed prefers the old setup; gating would need hosting-level auth.
* [x] llms-full.txt — already existed (added with the search layer in commit 95c6663) and covers service detail, coverage, accreditations, process and NAP. Added a link to it from llms.txt.
* [x] Audit parity: /demolition and /earthworks both already had FAQPage schema + matching visible FAQs (5 each). Fixed one comma-level drift between schema and visible text in the demolition asbestos answer.

## P1 — FAQ and extraction depth

* [x] Service page FAQs extended: groundworks 3 → 6 (cost, what's needed for a quote, what is build to DPC — new visible FAQ section added before the bottom CTA, answers shared between schema and markup via constants). Demolition 5 → 7 (cost, planning permission to demolish a house). Earthworks 5 → 7 (what is cut and fill, muck-away cost).
  * NOTE for Ed: cost answers explain the pricing drivers and the fixed-price quote process but deliberately contain NO £ figures — per the no-invented-facts rule, ranges only go live once Ed supplies/approves them (same gate as the P3 cost guide). Say the word and they can be added.
* [x] Homepage FAQ block: 4 questions (services, areas, what's needed for a quote, response time) + FAQPage schema, rendered from one constants array so visible text and JSON-LD cannot drift.

## P2 — Location pages (AWAITING ED'S APPROVAL — plan proposed, nothing written)

Proposed: 4 pages at top level, /groundworks-guildford, /groundworks-woking, /demolition-guildford, /demolition-woking (matches existing flat routing; /areas/ would add a structure the site doesn't otherwise use). Then Weybridge and Epsom once the pattern is approved.

* [ ] Per page: distance/travel time from Send HQ, town-specific project link where one exists (landscape-guildford for Guildford groundworks; NOTE: no Woking or demolition-specific case studies exist in /projects — flag before writing, risk of thin pages for the demolition pair), local context, 3-question town FAQ.
* [ ] Unique title "[Service] Contractor [Town] | Surrey Contracting", unique meta description, single H1.
* [ ] Service + FAQPage + BreadcrumbList schema reusing existing components, areaServed set to the town.
* [ ] Internal links: from service page, homepage areas list (convert towns with pages to links), footer.
* [ ] If a page would be thin boilerplate with no real local proof, stop and flag to Ed.

## P3 — Informational guides (AWAITING ED'S APPROVAL)

* [ ] /guides/demolition-cost-uk — Ed to sanity-check every figure before publish.
* [ ] /guides/groundworks-planning — what to prepare before a groundworks quote.
* [ ] Guides section in nav/footer once two exist.

## Verification checklist before calling any phase done

* [x] `npm run build` passes, no new warnings (P0/P1 pass)
* [x] Pages present in generated sitemap-0.xml (P0/P1 pass)
* [x] All JSON-LD parses and FAQ schema questions match visible text exactly (P0/P1 pass)
* [x] No page ships aggregateRating or invented facts (P0/P1 pass; cost FAQs carry no figures)
* [ ] Lighthouse spot-check on one new page (do with P2 pages)

## NOT Claude Code tasks — Ed's list, higher impact than everything above

1. Google Business Profile at the Send address, categories: Excavating Contractor, Demolition Contractor. Photos from real sites. This plus reviews outranks every code change here.
2. Review pipeline: ask the tier-1 PM, the Cobham homeowner and the developer contact for Google reviews this week. Then every handover.
3. Citations: complete CHAS, Constructionline, SafeContractor public directory profiles with matching NAP. Yell/Checkatrade decision separately.
4. One link earn per month: supplier links, Send/Woking chamber, a case study pitched to a trade title.
