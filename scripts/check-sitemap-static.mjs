#!/usr/bin/env node
/**
 * Post-build guard: the static sitemaps never list a YourTradeQuotes case
 * study URL (16 Nov 2026, PR #45 review M1).
 *
 * /case-studies and /case-studies/<slug> are rendered at request time and are
 * 404 while nothing is published or the kit is switched off, so a static entry
 * would be a "Submitted URL not found" in Search Console from the first
 * deploy. They are listed only by the on-demand /sitemap-case-studies.xml,
 * which sitemap-index.xml does not name (it is submitted in Search Console
 * when the kit is switched on). Fails the build if any dist/client sitemap
 * file mentions case-studies.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = process.argv[2] || 'dist/client';
if (!existsSync(DIST)) {
  console.error(`check-sitemap-static: ${DIST} not found (run the build first)`);
  process.exit(1);
}
const files = readdirSync(DIST).filter((n) => /^sitemap.*\.xml$/.test(n));
const failures = [];
if (!files.includes('sitemap-index.xml')) failures.push('sitemap-index.xml missing');
for (const name of files) {
  if (/case-studies/.test(readFileSync(join(DIST, name), 'utf8'))) failures.push(`${name} mentions case-studies`);
}
if (failures.length) {
  console.error('\ncheck-sitemap-static: FAILED');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log(`check-sitemap-static: ${files.length} static sitemap files, no case-study URL`);
