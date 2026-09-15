#!/usr/bin/env node
/**
 * Post-build guard for the guide pages under /guides. Runs after
 * `npm run build` alongside check-homepage and check-locations, so it gates CI
 * and the Docker image alike.
 *
 * Fails the build if, on any guide page:
 *   - the page was not built
 *   - the title or meta description is missing, or duplicated across guides
 *   - there is not exactly one <h1>
 *   - a FAQPage question or answer in the JSON-LD is missing from visible text
 *   - the BreadcrumbList node is missing, or a Service node is present
 *     (that entity belongs to the service page, not to a guide)
 *   - the page contains an em dash
 *   - a price or rate appears: no figures are signed off, so any "£" on a
 *     guide page means invented numbers have crept in
 *   - the URL is missing from sitemap-0.xml
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/client';
const GUIDES_DIR = join(DIST, 'guides');
const failures = [];

if (!existsSync(GUIDES_DIR)) {
  console.error('check-guides: FAILED\n - dist/client/guides does not exist');
  process.exit(1);
}

const slugs = readdirSync(GUIDES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

if (!slugs.length) failures.push('no guide pages were built');

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
   .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
// Inline tags vanish without leaving a space so "our guide to planning" reads
// the way a person sees it; block tags become a space so elements do not fuse.
const visibleText = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<\/?(a|strong|em|b|i|span|time)\b[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');

const seenTitles = new Map();
const seenDescriptions = new Map();

for (const slug of slugs) {
  const path = `guides/${slug}`;
  const file = join(GUIDES_DIR, slug, 'index.html');
  if (!existsSync(file)) {
    failures.push(`${path}: index.html missing`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const visible = visibleText(html);

  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || '');
  if (!title) failures.push(`${path}: no <title>`);
  if (!desc) failures.push(`${path}: no meta description`);
  if (seenTitles.has(title)) failures.push(`${path}: duplicate <title>, shared with ${seenTitles.get(title)}`);
  if (seenDescriptions.has(desc)) failures.push(`${path}: duplicate meta description, shared with ${seenDescriptions.get(desc)}`);
  seenTitles.set(title, path);
  seenDescriptions.set(desc, path);

  const h1s = (html.match(/<h1\b/gi) || []).length;
  if (h1s !== 1) failures.push(`${path}: ${h1s} <h1> elements, expected exactly 1`);

  if (html.includes('—')) failures.push(`${path}: em dash present`);

  // No cost figures are signed off. A currency symbol means invented numbers.
  const money = visible.match(/£\s?[\d,]+/g);
  if (money) failures.push(`${path}: price figures present (${money.slice(0, 3).join(', ')}), none are signed off`);

  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const nodes = ld.flatMap((d) => (d['@graph'] ? d['@graph'] : [d]));

  const faq = nodes.find((n) => n['@type'] === 'FAQPage');
  if (!faq) failures.push(`${path}: no FAQPage node in JSON-LD`);
  else {
    for (const q of faq.mainEntity) {
      if (!visible.includes(q.name)) failures.push(`${path}: FAQ question not in visible text: ${q.name}`);
      if (!visible.includes(q.acceptedAnswer.text.replace(/\s+/g, ' '))) failures.push(`${path}: FAQ answer not in visible text for: ${q.name}`);
    }
  }

  if (!nodes.some((n) => n['@type'] === 'BreadcrumbList')) failures.push(`${path}: no BreadcrumbList in JSON-LD`);
  // A guide is reference content. The Service entity belongs to the service
  // page; a second one at a guide URL would compete with it.
  if (nodes.some((n) => n['@type'] === 'Service')) failures.push(`${path}: Service node on a guide page, that entity belongs to the service page`);
  if (JSON.stringify(ld).includes('aggregateRating')) failures.push(`${path}: aggregateRating is not allowed`);

  console.log(`${path}: ok (${faq ? faq.mainEntity.length : 0} FAQ questions, no price figures)`);
}

const sitemap = join(DIST, 'sitemap-0.xml');
if (existsSync(sitemap)) {
  const xml = readFileSync(sitemap, 'utf8');
  for (const slug of slugs) {
    if (!xml.includes(`/guides/${slug}`)) failures.push(`guides/${slug}: missing from sitemap-0.xml`);
  }
} else {
  failures.push('sitemap-0.xml was not generated');
}

if (failures.length) {
  console.error('\ncheck-guides: FAILED');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log('check-guides: all checks passed');
