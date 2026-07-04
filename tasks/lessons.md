# Lessons

Log each correction as: **Pattern** (what went wrong) + **Rule** (how to prevent it).

## Form JS binds only the first match
- **Pattern:** The quote handler (`getElementById('quoteForm')`) and YTQ connector (`querySelector('form[data-ytq-form]')`) bind only the first matching element, so duplicating the full form on one page yields a dead second form and invalid duplicate IDs.
- **Rule:** One functional `quoteForm` per page. Extra CTAs are anchor links to `#quoteForm`, never copies of the form.

## `npm run build` hangs in this sandbox (iCloud-evicted files + no network)
- **Pattern:** `astro build` stalls indefinitely at ~0.2s CPU with no output. A stack sample showed the main thread blocked in `read()` during a dynamic module import. `node_modules` contains duplicate " 2"/" 3"-suffixed files with the canonical name missing (e.g. the esbuild native binary), the same corruption seen in the repo (`Screenshot … 2.png`). Cause: iCloud "Optimize Storage" evicts file contents to dataless placeholders; reading one triggers an on-demand download that never completes because the sandbox has no network.
- **Rule:** Do not trust a hanging build as a code failure. Verify the build in a real environment with network, after `npm ci` (clean reinstall restores evicted/renamed binaries). In-sandbox, validate statically instead. Consider disabling iCloud optimisation for this repo + node_modules.
