# Surrey Hills Surfacing: handover for a separate Claude session

Paste this whole file as the first message of a new chat, with a line at the top
saying what you want done first. Keep SHS out of the Surrey Contracting session
and vice versa. The two businesses must not be discussed as one, and they must
never cross-link publicly.

## Why this is a separate session

The Surrey Contracting session carries a lot of context that is actively wrong
for SHS: a hard rule that the SC site must contain no surfacing, tarmac or resin
terminology and no links to surreyhillssurfacing.co.uk, plus build guards that
fail the SC deployment if any of those words appear. Mixing the two risks
carrying SC's constraints into SHS work where they do not belong, and carrying
SHS's surfacing vocabulary into SC where it is banned.

## What is actually known (verified)

- SHS is a separate business from Surrey Contracting Limited. Jason is the
  common thread.
- Surfacing was deliberately removed from the Surrey Contracting website in
  "Deployment 1". Three case studies were unpublished in Sanity by hand
  (`tarmac-driveway`, `tarmac-driveway-fetcham`, `tarmac-repairs-sutton`), a
  code-level filter blocks them from returning, and `/surfacing` and
  `/lp/surfacing` now 301 to `/groundworks`.
- A build guard on the SC site fails the deployment if the words surfacing,
  tarmac, resin or surreyhillssurfacing appear on the homepage, and fails on any
  unfilled placeholder anywhere.
- There is an MCP connector configured for SHS ("Novamira - Surrey Hills
  Surfacing"), which suggests the SHS site runs on WordPress with a Novamira
  endpoint. It has been intermittently failing to connect this session. Verify
  it connects before relying on it.

## What Jason said about SHS, verbatim

> I would like to chat Surrey hills surfacing though I want to bring it slightly
> more in line with Surrey Contracting's branding and shrink a few items down
> slightly, I have put some serious thought into SHS and I'm pretty sure I want
> to make some adjustments a little bit more focused on high end projects and
> commercial but not change much as it works well and has done majority of 2026
> again I want to understand what is working and what is not working so we can
> adjust accordingly together.

His meeting agenda items for SHS:
- Speak through SHS branding alignment and company position
- Bring SHS colours and styles in line with SC
- Line the two brands up alongside each other but without crossover
- SHS ads and spend

## What is NOT known, and must be established before any work

Do not assume any of this. Ask Jason or check directly.

1. The SHS domain and whether it is the live trading site.
2. The platform: WordPress via Novamira is likely but unconfirmed.
3. Whether SHS is a separate limited company, and if so its company number, VAT
   number and registered address. Do not reuse Surrey Contracting's.
4. Current SHS services and which Jason wants to keep, shrink or drop.
5. What "works well and has done majority of 2026" is measured against. Ask for
   the actual numbers: enquiries, conversion, ad spend, revenue by service.
6. Which ad accounts SHS runs and their spend.
7. Whether SHS has its own Search Console, GA4 and Google Business Profile.
8. Real SHS case studies with facts, not just photographs.
9. What "high end and commercial" means concretely: project size, client type,
   sectors.

## The one hard constraint

**No public crossover between the two brands.** Jason wants them "alongside each
other but without crossover". In practice that means:

- No links between surreycontracting.co.uk and the SHS site in either direction
- No shared case studies presented as the same company's work
- No shared schema entity, no shared `sameAs`, no shared company details
- Visual alignment is fine and is what Jason asked for. Entity merging is not.

If the two sites ever link to each other or share a business entity in
structured data, Google may treat them as one business and you will have
undermined both. Raise this explicitly before any branding work starts.

## Working rules that carry across from the Surrey Contracting work

These are Ed's standing rules and they apply to SHS too:

- Never invent reviews, ratings, testimonials, project details or client names.
- No `aggregateRating` schema. There are no verified reviews yet.
- No accreditation or registration numbers on the page.
- The company is the author and entity. No founder or personal biography
  sections, and no `Person` nodes in schema. Jason is a company director, not a
  sole trader, and the site should not read as one.
- UK English throughout. No em dashes in copy.
- Plan first and check the plan with Ed before building anything substantial.
- Verify before calling anything done: build clean, new URLs in the sitemap,
  schema parses.
- If a page would be thin boilerplate because there is no real proof behind it,
  stop and flag it rather than padding it.
- Log any correction from Ed as a pattern so it is not repeated.

## Suggested first tasks for the new session

1. Confirm the domain, platform and access. Check the Novamira MCP connector
   actually connects.
2. Crawl the live SHS site and produce a factual inventory: every URL, page
   titles, services offered, contact details, schema present, and whether the
   details are internally consistent. Do not take an AI tool's word for any of
   it, check the live HTML. This is exactly what was done for Surrey Contracting
   on 22 September and it found that an AI-generated audit was wrong on nine
   points out of nine.
3. Establish the numbers before proposing changes. "What is working" cannot be
   answered without enquiry and spend data.
4. Only then look at branding alignment, and treat the no-crossover rule as the
   first constraint rather than an afterthought.

## Context worth knowing about how Ed works

- He wants the honest answer, not the comfortable one, and will push back if
  something reads as padded or invented.
- He has been burned by AI-generated SEO audits before. Two "Cumulus" audits
  reviewed in September were substantially hallucinated, one with a 100 percent
  false-positive rate. Verify claims against primary sources every time.
- Layout changes should be shown as a screenshot before a full build.
- Explanatory content belongs in a collapsed FAQ rather than stacked text
  blocks, unless the page is a long-form guide where prose is the point.
