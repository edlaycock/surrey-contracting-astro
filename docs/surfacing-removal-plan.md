# Plan: Removing Commercial Surfacing from the website

**Requested by:** Jason
**Status:** Plan only — nothing has been changed
**Prepared:** 2026-07-16

Surfacing is one of the four disciplines the site is *built around*. It appears
in the company strapline, the hero animation, the schema markup, four case
studies, and a live Google Ads campaign. This is not a case of deleting a page —
it touches 24 files and three external systems.

This document is the full inventory and sequence.

---

## 1. Two options

**Option A — Remove.** Delete surfacing entirely; `/surfacing` 301-redirects to
`/services`.

**Option B — Refer to SHS.** Keep `/surfacing` as a short referral page ("we no
longer offer surfacing — for surfacing works, speak to SHS"), with a link out.
Nav/footer entries either point there or are removed.

**Recommendation: a hybrid.**

| Asset | Do this | Why |
|---|---|---|
| `/surfacing` (service page) | **Option B — repurpose as a referral page** | It's indexed and has SEO equity. Surfacing enquiries will keep arriving from organic search for months regardless of what we do. A referral page converts that into goodwill (and a warm lead for SHS) instead of a dead end. |
| `/lp/surfacing` (ad page) | **Option A — delete** | We're paying for these clicks. No reason to keep buying traffic for work we don't do. |
| Nav / footer / CTAs | Remove the links | Surfacing shouldn't be presented as a service we sell. |

The two options share roughly 80% of the same work — everything in §4 and §5 is
identical either way. The difference is only what happens at `/surfacing` itself
and at the ~14 link/CTA touchpoints.

### Information needed before implementation

1. **SHS full name, website URL, and phone number** — for the referral wording.
2. **Relationship** — sister company, partner, or recommended contractor? This
   changes the wording ("our sister company" vs "we recommend").
3. **Strapline sign-off** (see §3) — the company's positioning line has to change,
   and that's Jason's call, not a developer's.
4. **The Southbank Centre case study** — see §6.

---

## 2. Do this FIRST: Google Ads

> ⚠ **Sequencing matters.** If `/lp/surfacing` is deleted while the ads still
> point at it, the destination URL 404s. Google disapproves the ads, and until
> that happens you're paying for clicks that land on an error page. **Pause the
> ads before the code ships, not after.**

1. Pause the surfacing campaign / ad group in Google Ads (account 437-958-2050).
2. Remove or pause any surfacing keywords in shared/other campaigns.
3. Check sitelinks and callout extensions for surfacing references.
4. Leave historical data alone — no need to delete anything for reporting.

Once paused, the code changes can ship at any time.

---

## 3. The strapline decision (needs Jason)

Surfacing isn't just a page — it's in the company's positioning line:

> "Demolition, Groundworks, Earthworks **& Surfacing** across Surrey & the Home Counties"

This appears in the utility bar (every page), the homepage `<h2>`, the meta
descriptions, the JSON-LD, and `llms.txt`. It needs replacing with an agreed
form of words. Options:

- "Demolition, Groundworks, Earthworks & Civils across Surrey & the Home Counties"
- "Demolition, Groundworks, Earthworks & Drainage across Surrey & the Home Counties"
- "Demolition, Groundworks & Bulk Earthworks across Surrey & the Home Counties"

Related: the site repeatedly says **"four core disciplines"** and the homepage
hero rotates through **four** words. Dropping to three needs a consistent story.
If drainage is promoted into the fourth slot, that's the tidiest fix — drainage
already has its own landing page and content.

---

## 4. Code changes — full inventory

24 files. Grouped by type of change.

### 4.1 Pages to delete

| File | Action |
|---|---|
| `src/pages/lp/surfacing.astro` | **Delete** (after ads paused) |
| `src/pages/surfacing.astro` | **Option A:** delete · **Option B:** rewrite as referral page |

### 4.2 Global navigation (appears on every page)

| File | Line | Current |
|---|---|---|
| `src/components/Nav.astro` | 24 | Desktop dropdown → `/surfacing` |
| `src/components/Nav.astro` | 56 | Mobile drawer → `/surfacing` |
| `src/components/Footer.astro` | 18 | Footer services list → `/surfacing` |
| `src/components/UtilityBar.astro` | 6 | Strapline (see §3) |

### 4.3 Homepage — `src/pages/index.astro` (30 references, the biggest job)

| Line(s) | What |
|---|---|
| 21 | JSON-LD organisation description |
| 74 | JSON-LD `Offer` → Commercial Surfacing service — **delete the offer object** |
| 80–82 | `<title>`, meta description, `ogTitle` |
| 107 | Hero paragraph |
| 122–128 | **Hero word rotator** — `aria-label` + word spans (see ⚠ below) |
| 134 | "through to completed surfacing and external works" |
| 168 | Long SEO paragraph |
| 177–178 | Section `<h2>` + "Four core disciplines" lede |
| 209–213 | Service card linking to `/surfacing` — **delete the whole card** |
| 262, 264, 268 | About-section copy |
| 298–311 | **Entire "Hard-wearing surfacing for commercial sites" feature block** incl. photo and CTA button |
| 410–412 | Project card photo + "Surfacing" tag |
| 485 | Testimonial about a car park resurfacing — **replace with a non-surfacing testimonial** |
| 572 | Quote form checkbox "Commercial Surfacing" |
| ~~404~~ | "Surface-water drainage" — **KEEP, this is drainage** |

> ⚠ **The hero rotator has a linked constant.** The markup at 122–128 holds four
> distinct words plus a duplicate for the seamless loop, but `src/scripts/app.js:33`
> sets `wordsCount = 3`, which does not match the four words currently in the
> markup. Whoever edits this must check the intended loop behaviour and re-test
> the animation, not just delete a `<span>`. Removing a word without updating
> `wordsCount` will break the rotation.

### 4.4 Services page — `src/pages/services.astro`

| Line(s) | What |
|---|---|
| 6 | Meta description |
| 23 | Page lede |
| 100–116 | **Entire `#commercial-surfacing` section** — photo, copy, bullet list, CTA |
| 126 | Residential surfacing / driveways paragraph |
| ~~68~~ | "Surface-water & foul drainage" — **KEEP** |

Note: `id="commercial-surfacing"` may be linked from elsewhere as an anchor —
check for `/services#commercial-surfacing` before deleting.

### 4.5 Other pages

| File | Refs | Notes |
|---|---|---|
| `src/pages/groundworks.astro` | 9 | Cross-references to surfacing |
| `src/pages/about.astro` | 7 | Company description copy |
| `src/pages/sectors.astro` | 6 | Sector descriptions |
| `src/pages/demolition.astro` | 4 | |
| `src/pages/contact.astro` | 2 | Incl. form checkbox (line 75) |
| `src/pages/earthworks.astro` | 1 | |
| `src/pages/projects.astro` | 1 | Meta description |

### 4.6 Landing pages (`/lp/*`) — form checkboxes

Each of the five surviving LP pages has a "Commercial Surfacing" option in its
quote form, plus some cross-copy:

`lp/groundworks.astro` (5), `lp/agricultural.astro` (5), `lp/drainage.astro`
(line 181 checkbox), `lp/earthworks.astro` (1), `lp/demolition.astro` (1).

> ⚠ **`lp/drainage.astro` shows 13 "surfac" matches but only ONE is surfacing.**
> The other 12 are **"surface water drainage"** — a completely different thing.
> See §7.

### 4.7 Static files

| File | What |
|---|---|
| `public/llms.txt` | Lines 3, 12, 29 — description, service list, URL entry |
| `public/styles.css` | 1 reference — check whether it's a surfacing-specific class |
| `public/training-manual/index.html` | Client training doc mentions surfacing |
| `public/assets/img/surfacing.jpg` | Delete once unreferenced |
| `public/assets/img/Commercial-Surfacing.png` | Delete once unreferenced |
| `public/assets/img/Surface water drainage.jpg` | **KEEP** — drainage |

### 4.8 Config & scripts

| File | What |
|---|---|
| `src/scripts/app.js` | Line 33 `wordsCount` — see §4.3 warning |
| `astro.config.mjs` | Lines 15–17: three `/project-tarmac-*` redirects — depends on §6 |
| `scripts/seed-projects.mjs` | Seed data references surfacing |
| `studio/schemaTypes/project.ts` | Line 3: `CATEGORY_OPTIONS` includes `'Surfacing'` and `'Driveways'` |

---

## 5. Redirects & SEO

`/surfacing` and `/lp/surfacing` are indexed. Neither should be allowed to 404.

| From | To (Option A) | To (Option B) |
|---|---|---|
| `/surfacing` | 301 → `/services` | *stays live as referral page* |
| `/lp/surfacing` | 301 → `/services` | 301 → `/surfacing` |

Add these to the `redirects` block in `astro.config.mjs`.

Then:
1. Resubmit the sitemap in Google Search Console (it regenerates automatically —
   `/lp/*` was already excluded, `/surfacing` will drop out under Option A).
2. Monitor Search Console **Coverage** and **Performance** for surfacing queries
   for ~4 weeks.
3. Expect a traffic dip — surfacing terms are a meaningful share of organic
   visibility. That's the intended consequence, but worth knowing before someone
   reports it as a fault.

---

## 6. Case studies (Sanity CMS) — needs a decision

Four of the eleven live case studies are surfacing work:

| Slug | Categories | Recommendation |
|---|---|---|
| `southbank-centre` | Surfacing, **Groundworks, Drainage** | ⭐ **Re-tag, don't delete.** It's a flagship client and genuinely involved groundworks and drainage. Drop the "Surfacing" category, keep the project, and reword any surfacing-led copy. |
| `tarmac-driveway` | Driveways, Surfacing | Unpublish |
| `tarmac-driveway-fetcham` | Driveways, Surfacing | Unpublish |
| `tarmac-repairs-sutton` | Surfacing | Unpublish |

Removing three of eleven case studies takes the portfolio down to eight (nine
including Southbank). Worth flagging to Jason before it happens — it's a visible
reduction in the projects gallery.

**These are content changes made in Sanity Studio, not code.** Unpublishing
triggers an automatic rebuild via the webhook.

Then in code:
- Remove `'Surfacing'` (and probably `'Driveways'`) from `CATEGORY_OPTIONS` in
  `studio/schemaTypes/project.ts`
- Remove the corresponding filter chips on the projects page
- Decide on the three `/project-tarmac-*` redirects in `astro.config.mjs` — if
  the projects are unpublished, these should redirect to `/projects` rather than
  to now-dead detail pages

---

## 7. ⚠ The "surface water" trap

**Do not run a find-and-replace on "surfac".**

The site uses the word in two unrelated senses:

| Remove | Keep |
|---|---|
| "Commercial Surfacing" | "surface water drainage" |
| "surfacing contractor" | "surface-water & foul drainage" |
| "tarmac surfacing" | "base, binder & surface course" |
| "resurfacing" | "the finished surface" |
| | "SuDS / surface water networks" |

Drainage is a service we're keeping, and most of the "surfac" matches in
`lp/drainage.astro`, `services.astro:68`, and `index.astro:404` are drainage
content. Every change needs reading in context.

---

## 8. Analytics — no action required

- **GTM:** nothing surfacing-specific in the container. No changes.
- **GA4:** historical `generate_lead` events carry `event_label="lp_surfacing"`.
  Leave them — that's real history and deleting it corrupts year-on-year
  comparisons.
- **Google Ads:** covered in §2.

---

## 9. Suggested sequence

| # | Step | Where | Blocked by |
|---|---|---|---|
| 1 | Confirm SHS details + strapline wording | — | Jason |
| 2 | Pause surfacing ads | Google Ads | — |
| 3 | Re-tag / unpublish case studies | Sanity Studio | §6 decision |
| 4 | Code changes (§4) on a branch | Repo | 1 |
| 5 | Add redirects (§5) | `astro.config.mjs` | — |
| 6 | Build, screenshot review, check nothing drainage-related broke | Local | 4, 5 |
| 7 | Merge → auto-deploy | GitHub | 6 |
| 8 | Resubmit sitemap, monitor Search Console | GSC | 7 |

Steps 2 and 3 are safe to do immediately and independently. Step 4 is the bulk
of the work — roughly a half-day given the copy rewriting involved, most of it
in `index.astro` and `services.astro`.

---

## 10. Verification checklist

After deploy:

- [ ] `/surfacing` behaves as intended (301 or referral page — not a 404)
- [ ] `/lp/surfacing` redirects, doesn't 404
- [ ] Hero word rotator animates correctly and doesn't stall or flash
- [ ] No "Commercial Surfacing" checkbox on any quote form (8 forms)
- [ ] Nav dropdown, mobile drawer, and footer have no surfacing entry
- [ ] **Drainage content intact** — `/lp/drainage`, services drainage section,
      "surface water" copy all still correct
- [ ] Projects gallery filters have no empty "Surfacing" chip
- [ ] JSON-LD validates (Rich Results Test) with the surfacing `Offer` removed
- [ ] `llms.txt` no longer lists surfacing
- [ ] Sitemap has no `/surfacing`
- [ ] Test form submission still sends email and fires `generate_lead`

---

## 11. Build note

`node_modules` is currently absent from the working copy — run `npm ci` before
`npm run build` when implementing.
