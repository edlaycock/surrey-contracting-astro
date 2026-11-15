# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## YourTradeQuotes case studies

Case studies written and approved in YourTradeQuotes (YTQ) appear on this site
at `/case-studies` and `/case-studies/<slug>`, beside the Sanity projects (which
are unchanged). The contract is Case Study Core v1 (`vendor/caseStudyCore/spec`,
`feed.md` and `rendering.md`), matched to YTQ's implementation in its PR #295.

**How it works.** The site pulls; YTQ never pushes content.

1. YTQ publishes and sends a signed, content-free "fetch now" POST to
   `/api/ytq-refresh` (`src/pages/api/ytq-refresh.ts`). The route verifies it
   (`src/lib/caseStudies/signal.ts`, a copy of YTQ's reference verifier: key
   derived from `YTQ_SECRET_KEY`, bound to this site's host and path, 300 s
   window, nonce replay store, constant-time compare), answers 202, and starts a
   sync. Anything else gets a plain 401.
2. The sync (`src/lib/caseStudies/sync.ts`) pages through YTQ's `caseStudyFeed`
   from the stored cursor with the secret key in `x-ytq-api-key`, validates every
   record with the vendored core before storing it, downloads each photo by ref,
   checks its sha256, makes resized copies (480 to 1600 wide, with sharp), and
   only then moves the photos into the public media folder and commits. A
   tombstone deletes the page, its photos and copies. Each result is
   acknowledged to YTQ (`live` with the page URL, `removed`, or `failed` with an
   error code). Idempotent by id and version; a transient failure keeps the
   cursor, so the next run repeats the page safely.
3. A timer in the server process repeats the sync hourly (`YTQ_POLL_MINUTES`), in
   case a signal is missed (`src/lib/caseStudies/poller.ts`, started by
   `src/middleware.ts`).
4. The pages and `/sitemap-case-studies.xml` (listed in `sitemap-index.xml`) are
   rendered at request time from the store, so a publish or a removal shows
   without a rebuild. A removed case study answers 410 Gone. With none
   published, `/case-studies` is a 404 and the sitemap is empty.

The store is `YTQ_CASE_STUDY_DIR` (on the VPS the Docker volume
`ytq-case-studies` at `/data/ytq-case-studies`, outside the web root):
`state.json`, `media/` and a `staging/` folder for downloads in progress.

**Environment** (server only; names here, values never in the repo):

| Name | Purpose |
|---|---|
| `YTQ_CASE_STUDIES` | `on` switches the kit on. Anything else: no feed call, no timer, the refresh route answers 401 |
| `YTQ_SECRET_KEY` | the existing YTQ secret key (also used by the enquiry relay). No new secret |
| `YTQ_CASE_STUDY_DIR` | the store. Set by `docker-compose.yml`; defaults to `.ytq-case-studies/` in dev |
| `YTQ_REFRESH_URL` | optional, default `https://surreycontracting.co.uk/api/ytq-refresh`. Its host and path are what the signature is checked against, so it must be exactly the URL registered in YTQ |
| `YTQ_POLL_MINUTES` | optional, default 60 (minimum 5) |
| `YTQ_ACCOUNT_ID` | optional; otherwise the account the feed reports is stored and then required |
| `YTQ_FEED_ENDPOINT` | local testing against a stub only |

**The refresh URL for YTQ Settings, Integrations:**
`https://surreycontracting.co.uk/api/ytq-refresh` (no `www`: YTQ does not follow
redirects, and `https://surreycontracting.co.uk` must be on the account's allowed
websites in YTQ, or YTQ refuses the URL and the acknowledgements).

**Vendored core.** `vendor/caseStudyCore` is a byte-for-byte copy of YTQ's
`functions/caseStudyCore`, pinned by `vendor/caseStudyCore.pin.json` (tree hash
`65e54a66…`). `npm run test:case-study-core` (also in `postbuild`) fails on any
changed, added or missing file, then runs every core fixture. To update: replace
the folder with the new tagged copy and the pin file, nothing else.

**Tests** (no network; the feed is a local stub):

- `npm run test:case-study-core`: the drift check and the core fixtures.
- `npm run test:case-studies`: signature, paging, held-back cursor, tombstones,
  validation failures, acknowledgements, partial failure, rendering.
- `npm run test:case-study-pages`: after `npm run build`, runs the built server
  on 127.0.0.1 with a stub feed and checks the pages, photos, sitemap, 410 and
  that no customer detail, consent data, id or hash reaches the output.
- `npm test` runs the first two with the enquiry relay tests.
