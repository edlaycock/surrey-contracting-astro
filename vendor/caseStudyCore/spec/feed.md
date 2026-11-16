# The YTQ pull feed

Case Study Core, `schema_version: 1`.

**Planned for Track 2. Nothing here is built.** This is the contract the YourTradeQuotes feed and its consumers (the WordPress plugin with "Connect to YourTradeQuotes" switched on, the server kit for non-WordPress sites) will be built to. Its source is YTQ_POST_JOB_TOOL_PLAN.md section 5.4 and CASE_STUDY_PRODUCT_PLAN.md section 3, with the owner's decisions of 14 November 2026 applied. Items marked **Proposed** are detail this document adds, several of them from the independent review of core v1, so the two sides can be built apart; each is to be confirmed when Track 2's first slice (Y1) starts.

Track 1 (the plugin on its own) does not use the feed.

## 1. Shape

The site pulls. YTQ never pushes content to a site and never holds a site's login.

```
YTQ publishes  ->  signed "fetch now" signal  ->  site pulls the feed  ->  site pulls photo bytes
                                                                       ->  site acknowledges with its URL
site's own timer (hourly) does the same pull, signal or no signal
```

- Endpoint: the YTQ Cloud Function `caseStudyFeed`. **Its name is a URL that customer sites call. It is never renamed.**
- Caller: a website's server only. Authentication is the account's secret key in the `x-ytq-api-key` header, never in the URL. A publishable key is refused, so a browser can never call it.
- The WordPress plugin holds no key of its own. It reads the key the YTQ connector (2.10.0 or later) already stores on that site.
- Every response has `Cache-Control: no-store`.
- Rate limits are per key and address, failing closed.

## 2. List: `GET ?since=<cursor>`

Returns the case studies published or removed since the cursor, oldest change first.

```json
{
  "schema_version": 1,
  "core_version": "1.0.0",
  "cursor": "opaque-string-to-send-next-time",
  "items": [
    { "record": { "…": "the feed projection of a published record" } },
    { "id": "cs_7Hq2mXw9LpA4", "removed": true, "version": 2, "removed_at": "2026-11-10T08:30:00Z" }
  ]
}
```

**The feed carries the record, not JSON-LD** (decided 14 November 2026). Each site builds JSON-LD from the record with its own copy of the core builder, and the fixtures keep the builders identical.

**What exactly travels: the feed projection.** Not the stored record as it is, but `feedProjection(record)` (Node) or `Wire::feedProjection($record)` (PHP):

- `consent.note` is removed. It is a private note for the trade.
- Every staff name is replaced with the fixed word `withheld`: `consent.confirmed_by`, each photo's `checked.confirmed_by`, and `consent.not_identifiable_statement.ticked_by`. A website has no use for who at the trade ticked a box; it needs to know that it was ticked and when.
- Everything else is unchanged, and the result is still a valid record, so the receiving site validates it with the same schema. The golden file is `core/fixtures/valid-full.feed.json`.
- **Only a publishable record is projected.** The function runs `assertPublishable` first and refuses a draft, an unpublished record or anything invalid (`feed.record_not_publishable`), the same way the JSON-LD builder does. A record with a stray field, or the free-text reason on an unpublished record, cannot leave through the feed.

So the times and the kind of permission travel; the names and the note stay in YTQ. **Proposed** as the default; Y1 confirms it.

- **An unpublish or a withdrawal reaches a site as a tombstone and nothing else:** `{id, removed: true, version, removed_at}`. It tells the site to remove the page, its images and every resized copy. It carries the version that was removed and when, and **no text at all**: not the reason, not who, not the record. A site does not need to know why a page was taken down, only that it was. `feedTombstone(record)` (Node) and `Wire::feedTombstone($record)` (PHP) build it from a valid unpublished record and refuse anything else; the golden file is `core/fixtures/valid-unpublished-withdrawn.tombstone.json`. **Proposed** for Y1 to confirm, in particular whether `removed_at` is wanted. A tombstone is also sent for a deleted case study. A deleted case study has no record to pass to `feedTombstone`, so the track builds that tombstone itself, in the same shape: the id, the last version it published and the time of the deletion as `removed_at`. Tombstones keep flowing even when the account's plan has lapsed.
- Never a URL to a photo. Photos are fetched by ref (section 3).
- No `since` returns everything currently published, for a first sync.
- **Proposed:** `?core=1.0` states the newest core version the site reads. The feed does not send that site a record it cannot read (`versioning.md` section 2).

**What the site does with an item.** It keeps, for each `id`, either the live record or a **tombstone marker** `{id, version, removed_at}`. A marker is never discarded while the site is connected. (**Proposed**; the review found that without markers a stale tombstone could remove a newer live page, and a replayed record could bring a removed page back.)

| Site has | Item is | Site does |
|---|---|---|
| Nothing | Record | Validates with its own core copy, stores, renders |
| Record, lower version | Record | Validates, replaces. Same URL |
| Record, same version | Record | Nothing. This is what makes every retry safe. A published version never changes (`record.md` section 5), so there is nothing to compare |
| Record, higher version | Record | Nothing. Stale delivery |
| Record, same or lower version | Tombstone | Removes the page and images, keeps a marker at the tombstone's version |
| Record, higher version | Tombstone | Nothing. The tombstone is older than the page: it was unpublished and then published again |
| Marker | Record with a higher version | Validates, stores, renders, drops the marker. Publishing again after an unpublish is always the next version |
| Marker | Record with the same or a lower version | Nothing. A replay of what was removed must not bring it back |
| Marker or nothing | Tombstone | Keeps a marker at the higher of the two versions. Removing something already gone is a success |

A record that fails the site's validation is not stored. The site acknowledges it as `failed` with the first error code, and never renders part of it.

## 3. Photo bytes: `GET ?photo=<ref>&id=<case study id>`

Returns the derivative's bytes (JPEG, metadata already stripped).

- **Consent is re-checked in the same request.** YTQ confirms, at that moment, that the case study is still published, that its consent has not been withdrawn, and that this photo is still part of it with its tick. If any of those is no longer true the answer is **410 Gone** and the site must delete any copy it holds.
- The site verifies the bytes against the record's `sha256` before using them, and discards a mismatch.
- The site stores the file under its own name derived from the ref or hash, and makes its resized copies from it.
- One audit row per photo fetch is kept on the YTQ side.

## 4. The "fetch now" signal

So a publish appears in seconds instead of waiting for the hourly timer.

- A `POST` from YTQ to the site's refresh route (WordPress: the plugin's REST route `ytq/v1/refresh`; server kit: `/api/ytq-refresh`).
- Body: `{account, timestamp, nonce}`. **It carries no content and no instruction other than "fetch".**
- No new secret is issued or stored anywhere: the signature is made from the site's existing secret key (the current key, or the previous one inside its 7-day grace after a rotation).
- **Proposed: the signing key is derived, not the bearer key itself.** `signing_key = HMAC-SHA256(secret_key, "ytq-refresh-v1")`. The same secret is sent as a bearer token on feed calls, and one value should not do both jobs.
- **Proposed: the signature is bound to where it is going.** It is the lower-case hex `HMAC-SHA256(signing_key, method + "|" + host + "|" + path + "|" + timestamp + "|" + nonce + "|" + account)`, sent in the header `x-ytq-signature`. `method` is `POST`; `host` is the lower-case host of the refresh route, without a port; `path` is its path, without a query string; `timestamp` is Unix seconds; `nonce` is 32 lower-case hex characters. A signal captured for one site cannot be replayed to another site on the same account.
- The site verifies the signature with a constant-time comparison against its own host and path, rejects a timestamp more than 300 seconds from its own clock, rejects a nonce it has seen in that window or one in any other format, and then does exactly what its timer would have done.
- A forged or replayed signal can at worst cause one rate-limited fetch. The site answers `202` to a good signal and a plain `401` to anything else, with no detail.
- YTQ never re-sends content after a timeout, because it never sent any. A publication with no acknowledgement is `uncertain` until the site's next fetch settles it.

## 5. Acknowledgement: `POST`

After acting on an item the site tells YTQ what happened.

```json
{
  "id": "cs_7Hq2mXw9LpA4",
  "version": 2,
  "state": "live",
  "url": "https://www.example-fencing.co.uk/case-studies/closeboard-garden-fencing-hersham-october-2026/",
  "site": { "type": "wordpress", "site_url": "https://www.example-fencing.co.uk/", "refresh_url": "https://www.example-fencing.co.uk/wp-json/ytq/v1/refresh", "plugin_version": "2.1.0", "core_version": "1.0.0" }
}
```

| `state` | Meaning | `url` |
|---|---|---|
| `live` | The page is public at this URL | Required |
| `held` | The site stored it as a draft and is waiting for someone there to publish it (section 6) | Absent |
| `removed` | The page and its images are gone | Absent |
| `failed` | The site could not store or render it. `error` carries a code | Absent |

- An acknowledgement is keyed by `id` and `version` and can be repeated safely.
- The `site` block is how a website registers itself as a target the first time it calls, so the trade types nothing.
- Only `live` with a URL unlocks sharing (`social.md`).

**Proposed: the addresses a site reports are not trusted as given.** `site.refresh_url` is somewhere YTQ will later send a signal, and `url` is somewhere it will fetch to check the page is live and then hand to people as the share link. A site that could put anything there could point a Cloud Function at an internal address, or have a trade share a link to someone else's page. So YTQ accepts `site_url`, `refresh_url` and `url` only when each is `https`, has no user part, resolves to a public address (not private, loopback or link-local, checked again at the time of each request), and its host is one of the account's allowed websites, the same list that already governs the account's publishable key. Anything else is refused and the target is not registered.

**Proposed: a removal that is never acknowledged is escalated.** After an unpublish, YTQ expects `removed` from every site that had the page. If a site has not acknowledged within 24 hours, YTQ re-signals once, then shows the trade "Still showing on your website" with the page address and what to do, and alerts support. If the reason for the unpublish was withdrawn permission, the alert is raised after one hour, not 24. YTQ also checks the page address itself: a 410 or 404 there settles the publication as `removed` even with no acknowledgement.

## 6. Publish on arrival, or hold as a draft

Review has already happened in YTQ, so by default a case study arriving on a WordPress site **is published on arrival**.

Each site has one setting, **Hold case studies from YourTradeQuotes as drafts**:

| Setting | A case study's first arrival | Acknowledged as |
|---|---|---|
| Off (the default for a trade's own site) | Published at once | `live` with the URL |
| On (**the starting value for agency-managed sites**) | Stored as a WordPress draft. A member of staff publishes it on the site | `held`, then `live` when published |

- **The hold applies to first publication only** (decided 14 November 2026). An edit to a page that is already live, arriving as the next version, replaces it at once whatever the setting.
- A case study that was unpublished and is published again arrives as a new first publication: on a site with the setting on, it is held.
- The setting changes only when the page appears. It does not make the content editable: a YTQ-sourced case study is read-only in WordPress and is edited in YTQ.
- A held draft that is unpublished in YTQ before anyone publishes it is removed by its tombstone like any other.
- In YTQ the trade sees "Waiting to be published on your website" for a held case study, and cannot share it yet.

## 7. What the feed never carries

Customer name, contact details, address, postcode, job or quote reference, exact dates, prices, the forbidden terms used for checking, AI prompts, or any photo that was not ticked: the record has no place for them. And from the record itself, the feed leaves out the private consent note and every staff name (section 2).

It does carry, because a site needs them to enforce the rules: the kind of permission, when it was confirmed and the wording version. On a tombstone it carries nothing but the id, the version and the time.
