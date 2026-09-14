# Lessons

Log each correction as: **Pattern** (what went wrong) + **Rule** (how to prevent it).

## Form JS binds only the first match
- **Pattern:** The quote handler (`getElementById('quoteForm')`) and YTQ connector (`querySelector('form[data-ytq-form]')`) bind only the first matching element, so duplicating the full form on one page yields a dead second form and invalid duplicate IDs.
- **Rule:** One functional `quoteForm` per page. Extra CTAs are anchor links to `#quoteForm`, never copies of the form.

## `npm run build` hangs in this sandbox (iCloud-evicted files + no network)
- **Pattern:** `astro build` stalls indefinitely at ~0.2s CPU with no output. A stack sample showed the main thread blocked in `read()` during a dynamic module import. `node_modules` contains duplicate " 2"/" 3"-suffixed files with the canonical name missing (e.g. the esbuild native binary), the same corruption seen in the repo (`Screenshot … 2.png`). Cause: iCloud "Optimize Storage" evicts file contents to dataless placeholders; reading one triggers an on-demand download that never completes because the sandbox has no network.
- **Rule:** Do not trust a hanging build as a code failure. Verify the build in a real environment with network, after `npm ci` (clean reinstall restores evicted/renamed binaries). In-sandbox, validate statically instead. Consider disabling iCloud optimisation for this repo + node_modules.

## Two git commands' output read as one (11 Sep 2026)
- **Pattern:** `git log origin/main -3` and `git log -1 <branch>` were run in one shell call and their output read as a single list, so the branch's own commit was taken to be on main. Ed was then told the P0/P1 work had been merged and reverted when it had never been merged at all.
- **Rule:** One git question per command, or label each command's output with an echo line. Before claiming anything about merge state, run `git merge-base --is-ancestor <commit> origin/main` and report that result, not a reading of a log listing.

## Built text-block sections on the homepage without showing a mock-up first (11 Sep 2026)
- **Pattern:** The brief prescribed question-shaped H2 sections and I built them literally: four full-width text blocks in a row. Ed's reaction on seeing the screenshot was that it was not user friendly on the eye and the content belonged in the FAQ. The plan had described the sections, but a description of a layout is not the same as seeing it, and approval of the cut list was not approval of the visual result.
- **Rule:** On a commercial page, explanatory content goes in the collapsed FAQ; the page itself stays visual (hero, tiles, gallery, map, form, logos). Any change that alters the homepage layout gets a screenshot or mock-up in front of Ed before the full build, not after.

## Framed a limited company around one person (11 Sep 2026)
- **Pattern:** The brief's author note ("Written by Jason, N years in groundworks, working on...") and a `founder: Person` schema node were built as specified. Ed's correction: Surrey Contracting Limited is a business with a team, not a sole trader, and the homepage must not present Jason as the owner-persona.
- **Rule:** The company is the author and the entity. Editorial credits are company-first ("Published by Surrey Contracting Limited. Reviewed by [name], Director"), no personal biographies on commercial pages, and no `founder` or `Person` nodes in the business schema unless Ed asks for them. When a brief personalises the business, raise it before building rather than follow it literally.

## Accreditation registration numbers must not be published (11 Sep 2026)
- **Pattern:** The 11 Sep brief (sections 1b and 2c) asked for CHAS, SafeContractor, SMAS and Constructionline registration numbers on the homepage, and placeholders for them were built in. Ed's instruction is that these numbers are not published. The brief text and the instruction conflicted and the brief was followed.
- **Rule:** No accreditation or registration numbers on the site, in copy, in the accreditations list or in schema. Logos plus links to the public registers only; a buyer can search those by company name. If a brief asks for the numbers, raise it before building rather than add placeholders for them. The Companies House number is not covered by this rule; it is already in the footer.

## The accreditation logo strip stands alone (11 Sep 2026)
- **Pattern:** After the registration numbers were removed, a list of scheme names, notes and register links was left beneath the logo strip. Ed does not want any section under the logos.
- **Rule:** The accreditations section is the heading and the logo marquee, nothing else. Register links, if wanted at all, belong inside the FAQ answer that asks how to check a contractor, not as a block on the page.

## No external register links either (11 Sep 2026)
- **Pattern:** With the list under the logos gone, the SSIP Portal, Constructionline and Companies House links were kept inline in the FAQ answer on checking a contractor. Ed wants those removed as well.
- **Rule:** No links to accreditation or company registers anywhere on the site. Accreditation is shown by the logo strip and stated in copy; the company number appears as plain text in the footer and FAQ. Treat this as one rule with the two entries above: logos only, no numbers, no register links, no supporting block.

## No author, reviewer or date credits (11 Sep 2026)
- **Pattern:** The brief's changes 2a and 2b (author note, Published and Last updated dates, dateModified in schema) were built, then reframed company-first after the sole-trader correction. Ed wants none of it on the page.
- **Rule:** Commercial pages carry no author, reviewer, published or updated credits, and the business schema carries no dateModified, unless Ed asks for them on a specific page. If a brief asks for them, raise it before building.
