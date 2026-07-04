# Todo — Ad landing pages + tracking fixes

Plan: `/Users/edlaycock/.claude/plans/warm-noodling-dahl.md`

## Task 1 — Consent Mode v2 signals
- [x] BaseLayout `consent 'default'`: added `ad_user_data` + `ad_personalization` = `'denied'`
- [x] BaseLayout return-visitor `consent 'update'`: both = stored granted/denied
- [x] CookieBanner `applyConsent` `consent 'update'`: both = granted/denied

## Task 2 — Per-page attribution
- [x] app.js `generate_lead`: `event_label = form.dataset.leadSource || 'quote_enquiry'` (label only)

## Task 4 — Keep /lp/ out of search
- [x] astro.config sitemap filter: also excludes `/lp/`
- [x] `noindex,follow` meta on each lp page

## Task 3 — Five landing pages under src/pages/lp/
- [x] `.lp-sticky-cta` component added to public/styles.css + guarded JS in app.js
- [x] `drainage.astro` template (built by main agent)
- [x] `agricultural.astro` (subagent)
- [x] `demolition.astro` (subagent)
- [x] `earthworks.astro` (subagent)
- [x] `groundworks.astro` (subagent)

## Verification
- [x] All 5 pages compile via @astrojs/compiler — 0 errors each (full `astro build` blocked in sandbox, see lessons.md)
- [x] Each page: exactly one functional quoteForm, correct `data-lead-source`, form fields byte-identical to contact.astro
- [x] Each page: noindex,follow + ServiceSchema + correct path; no /contact links, no cta-strip; all images exist
- [x] Nav/header/footer identical by construction (all render via BaseLayout, no overrides, no `active`)
- [ ] LOCAL (needs working env): `npm run build` passes, all five compile
- [ ] LOCAL: `astro preview` — each form submits, `#qfSuccess` shows, `generate_lead` fires correct per-page label (dataLayer/GA4 DebugView)
- [ ] LOCAL: `dist/sitemap-0.xml` has no `/lp/` routes
- [ ] LOCAL: GTM Preview — all four consent signals denied by default, granted with `sc_consent=granted`

## Manual (Ed — cannot be done in code)
- [ ] GA4 542209922: mark `generate_lead` as key event, import as Ads conversion (launch blocker)
- [ ] Check YTQ apiKey `ytq_live_demo_key_12345` is not a dead demo key on prod
- [ ] Sandbox build hang: node_modules has iCloud-evicted files; run `npm ci` locally to restore (see lessons.md)
