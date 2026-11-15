#!/usr/bin/env node
/**
 * The container's entry point (Dockerfile CMD): starts the Astro server, then
 * the YourTradeQuotes case-study safety poll.
 *
 * Importing dist/server/entry.mjs starts @astrojs/node's standalone server, as
 * `node dist/server/entry.mjs` did. The poll is started here, at process
 * start, because nothing inside the Astro app runs at start: middleware only
 * runs for on-demand requests, and almost every request to this site is a
 * prerendered page served before the app is reached.
 *
 * The poll code is src/lib/caseStudies/poller.ts, loaded with Node's type
 * stripping (Node 22.18 or later; the same way the tests load it). Its state
 * lives on globalThis, so it is shared with the copy bundled into the refresh
 * route: one run at a time, signals and timer alike. It does nothing unless
 * YTQ_CASE_STUDIES=on and YTQ_SECRET_KEY are set, and never runs at build time
 * (the build never loads this file). If it cannot load, the site still serves.
 */
await import('./dist/server/entry.mjs');
try {
  const { ensurePoller } = await import('./src/lib/caseStudies/poller.ts');
  ensurePoller();
} catch {
  console.error('[case-studies] poller did not start');
}
