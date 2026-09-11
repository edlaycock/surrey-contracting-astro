#!/usr/bin/env node
/**
 * Post-build guard for the homepage. Runs automatically after `npm run build`
 * (package.json "postbuild"), so it gates CI and the Docker image alike.
 *
 * Fails the build if:
 *   - any built HTML page still contains an unfilled {{PLACEHOLDER}}
 *   - the homepage mentions surfacing, tarmac, resin or surreyhillssurfacing
 *   - the homepage contains an em dash
 *   - homepage body copy exceeds 1,200 words
 *   - the first <p> after the <h1> is not the direct-answer paragraph
 *   - any FAQPage question or answer in the JSON-LD is missing from the visible text
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/client';
const HOME = join(DIST, 'index.html');
const WORD_LIMIT = 1200;
const failures = [];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });

/* 1. Placeholders anywhere in the built site */
for (const file of walk(DIST)) {
  const n = (readFileSync(file, 'utf8').match(/\{\{/g) || []).length;
  if (n) failures.push(`${file}: ${n} unfilled {{placeholder}} occurrence(s)`);
}

const html = readFileSync(HOME, 'utf8');
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

/* 2. Forbidden terms and em dashes on the homepage */
for (const term of ['surfacing', 'tarmac', 'resin', 'surreyhillssurfacing']) {
  const n = (html.match(new RegExp(term, 'gi')) || []).length;
  if (n) failures.push(`homepage: "${term}" appears ${n} time(s)`);
}
if (html.includes('—')) failures.push('homepage: em dash present');

/* 3. Body copy word count: strip chrome, scripts, forms and tags */
const body = html
  .replace(/<(script|style|noscript|header|nav|footer|form|select)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ');
const words = decode(body).split(/\s+/).filter(Boolean).length;
console.log(`homepage body copy: ${words} words (limit ${WORD_LIMIT})`);
if (words > WORD_LIMIT) failures.push(`homepage body copy is ${words} words, over the ${WORD_LIMIT} limit`);

/* 4. Direct answer is the first <p> after the <h1> */
const afterH1 = html.split(/<\/h1>/i)[1] || '';
const firstP = afterH1.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
const firstPText = firstP ? decode(firstP[1].replace(/<[^>]+>/g, '')).trim() : '';
if (!firstPText.startsWith('Surrey Contracting Limited is a groundworks, earthworks and demolition contractor')) {
  failures.push(`first <p> after <h1> is not the direct answer (got: "${firstPText.slice(0, 60)}")`);
}

/* 5. FAQ schema matches visible text exactly */
const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const nodes = ld.flatMap((d) => (d['@graph'] ? d['@graph'] : [d]));
const faq = nodes.find((n) => n['@type'] === 'FAQPage');
const visible = decode(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
if (!faq) failures.push('homepage: no FAQPage node in JSON-LD');
else {
  for (const q of faq.mainEntity) {
    if (!visible.includes(q.name)) failures.push(`FAQ question not in visible text: ${q.name}`);
    if (!visible.includes(q.acceptedAnswer.text.replace(/\s+/g, ' '))) failures.push(`FAQ answer not in visible text for: ${q.name}`);
  }
  console.log(`FAQPage: ${faq.mainEntity.length} questions, all matched to visible text`);
}
if (nodes.some((n) => n['@type'] === 'Article')) failures.push('homepage: Article schema is not allowed');
if (JSON.stringify(ld).includes('aggregateRating')) failures.push('homepage: aggregateRating is not allowed');

if (failures.length) {
  console.error('\ncheck-homepage: FAILED');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log('check-homepage: all checks passed');
