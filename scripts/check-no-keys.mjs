#!/usr/bin/env node
/**
 * Post-build guard: nothing the browser can download may carry a
 * YourTradeQuotes key or the YTQ endpoint (15 Oct 2026).
 *
 * Enquiries reach YTQ from the server only (src/lib/ytqRelay.ts, called by
 * /api/contact), with the secret key in the server's YTQ_SECRET_KEY. Until
 * then an inline connector in BaseLayout carried a key in every page. This
 * fails the build if any file under dist/client (pages, scripts, styles,
 * data) contains `ytq_live_`, `ytq_pub_` or `submitEnquiry`.
 *
 * dist/server is not scanned: the relay's endpoint URL lives there by design,
 * and the key never does (it is read from the environment at runtime).
 *
 * On a failure it prints the file and the pattern, never the matched text.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = process.argv[2] || 'dist/client';
const PATTERNS = ['ytq_live_', 'ytq_pub_', 'submitEnquiry'];
const TEXT = /\.(html?|m?js|cjs|css|json|txt|xml|map|webmanifest|svg)$/i;

if (!existsSync(DIST)) {
  console.error(`check-no-keys: ${DIST} not found (run the build first)`);
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

const failures = [];
let scanned = 0;
for (const file of walk(DIST)) {
  if (!TEXT.test(file)) continue;
  scanned++;
  const text = readFileSync(file, 'utf8');
  for (const p of PATTERNS) {
    if (text.includes(p)) failures.push(`${relative(DIST, file)}: contains "${p}"`);
  }
}

if (failures.length) {
  console.error('\ncheck-no-keys: FAILED (YourTradeQuotes keys and the endpoint belong on the server only)');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log(`check-no-keys: ${scanned} client files scanned, no YTQ key or endpoint`);
