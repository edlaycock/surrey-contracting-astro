#!/usr/bin/env node
/**
 * Post-build guard for the location pages (/groundworks-guildford and the
 * rest). Runs after `npm run build` alongside check-homepage.mjs, so it gates
 * CI and the Docker image alike.
 *
 * Fails the build if, on any page listed in src/data/locations.ts:
 *   - the page was not built at all
 *   - the title or meta description is missing, or duplicated across towns
 *   - there is not exactly one <h1>
 *   - the direct answer is missing, or does not appear before the first <h2>
 *   - the case study card did not render
 *   - a page whose case study is NOT in that town (proofLocal: false) fails to
 *     say so in plain words on the page, which would imply local work we have
 *     not published
 *   - a FAQPage question or answer in the JSON-LD is missing from visible text
 *   - the Service node is missing, or areaServed is not the town
 *   - the page contains an em dash
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/client';
const failures = [];

// Read the town data straight out of the TypeScript source. A parser would be
// overkill: the file is a plain literal and the fields we need are strings.
const src = readFileSync('src/data/locations.ts', 'utf8');
const field = (block, name) => {
  const m = block.match(new RegExp(`\\b${name}:\\s*\\n?\\s*(['\`])([\\s\\S]*?)\\1,`));
  return m ? m[2].replace(/\\'/g, "'").replace(/\s+/g, ' ').trim() : null;
};
const blocks = src.split(/\n  \{\n/).slice(1);
const towns = blocks.map((b) => ({
  slug: field(b, 'slug'),
  town: field(b, 'town'),
  title: field(b, 'title'),
  description: field(b, 'description'),
  answer: field(b, 'answer'),
  proofLead: field(b, 'proofLead'),
  proofLocal: /\bproofLocal:\s*true\b/.test(b),
}));

if (!towns.length) failures.push('locations: no entries parsed out of src/data/locations.ts');

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
   .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
// Inline tags vanish without leaving a space so "in Woking, four" reads the way
// a person sees it; block tags become a space so adjacent elements do not fuse.
const visibleText = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<\/?(a|strong|em|b|i|span|time)\b[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');

const seenTitles = new Map();
const seenDescriptions = new Map();

for (const t of towns) {
  const file = join(DIST, t.slug, "index.html");
  if (!existsSync(file)) {
    failures.push(`${t.slug}: page was not built (${file} missing)`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const visible = visibleText(html);
  const tag = () => t.slug;

  /* Title and meta description, unique across towns */
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/i) || [])[1];
  if (decode(title || '') !== t.title) failures.push(`${tag()}: <title> does not match locations.ts (got "${title}")`);
  if (decode(desc || '') !== t.description) failures.push(`${tag()}: meta description does not match locations.ts`);
  if (seenTitles.has(title)) failures.push(`${tag()}: duplicate <title>, shared with ${seenTitles.get(title)}`);
  if (seenDescriptions.has(desc)) failures.push(`${tag()}: duplicate meta description, shared with ${seenDescriptions.get(desc)}`);
  seenTitles.set(title, t.slug);
  seenDescriptions.set(desc, t.slug);

  /* Exactly one H1 */
  const h1s = (html.match(/<h1\b/gi) || []).length;
  if (h1s !== 1) failures.push(`${tag()}: ${h1s} <h1> elements, expected exactly 1`);

  /* Direct answer present, and ahead of the first H2 */
  const answer = t.answer.replace(/\s+/g, ' ');
  if (!visible.includes(answer)) {
    failures.push(`${tag()}: direct answer not found in visible text`);
  } else {
    const beforeH2 = visibleText(html.split(/<h2\b/i)[0]);
    if (!beforeH2.includes(answer)) failures.push(`${tag()}: direct answer appears after the first <h2>`);
  }

  /* The case study card is the reason this page exists */
  if (/class="loc-missing"/.test(html)) failures.push(`${tag()}: the case study card did not render`);
  if (!/class="loc-proof"/.test(html)) failures.push(`${tag()}: no project evidence card on the page`);

  /* A page whose case study is not in this town must say so on the page. */
  if (!t.proofLocal) {
    const lead = (t.proofLead || '').replace(/\s+/g, ' ');
    if (!lead) failures.push(`${tag()}: proofLocal is false but no proofLead was parsed`);
    else if (!visible.includes(lead)) failures.push(`${tag()}: proofLead is not visible on the page`);
    else if (!/not published|no .* case study|nearest/i.test(lead)) {
      failures.push(`${tag()}: proofLocal is false but proofLead does not say the work is not in this town`);
    }
  }

  /* Em dashes */
  if (html.includes('—')) failures.push(`${tag()}: em dash present`);

  /* Schema: FAQPage parity and Service areaServed */
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const nodes = ld.flatMap((d) => (d['@graph'] ? d['@graph'] : [d]));

  const faq = nodes.find((n) => n['@type'] === 'FAQPage');
  if (!faq) failures.push(`${tag()}: no FAQPage node in JSON-LD`);
  else {
    for (const q of faq.mainEntity) {
      if (!visible.includes(q.name)) failures.push(`${tag()}: FAQ question not in visible text: ${q.name}`);
      if (!visible.includes(q.acceptedAnswer.text.replace(/\s+/g, ' '))) failures.push(`${tag()}: FAQ answer not in visible text for: ${q.name}`);
    }
  }

  const service = nodes.find((n) => n['@type'] === 'Service');
  if (!service) failures.push(`${tag()}: no Service node in JSON-LD`);
  else if (service.areaServed?.name !== t.town) failures.push(`${tag()}: Service areaServed is not "${t.town}"`);

  if (!nodes.some((n) => n['@type'] === 'BreadcrumbList')) failures.push(`${tag()}: no BreadcrumbList in JSON-LD`);
  if (JSON.stringify(ld).includes('aggregateRating')) failures.push(`${tag()}: aggregateRating is not allowed`);

  console.log(`${t.slug}: ok (${faq ? faq.mainEntity.length : 0} FAQ questions, areaServed ${service?.areaServed?.name})`);
}

/* The sitemap has to carry the new URLs or nothing will find them */
const sitemap = join(DIST, 'sitemap-0.xml');
if (existsSync(sitemap)) {
  const xml = readFileSync(sitemap, 'utf8');
  for (const t of towns) {
    if (!xml.includes(`/${t.slug}`)) failures.push(`${t.slug}: missing from sitemap-0.xml`);
  }
} else {
  failures.push('sitemap-0.xml was not generated');
}

/* The /areas hub must exist, list every town, and link every town that has a
   page. A hub that silently drops a town is worse than no hub. */
const areasFile = join(DIST, 'areas', 'index.html');
if (!existsSync(areasFile)) {
  failures.push('/areas: page was not built');
} else {
  const areasHtml = readFileSync(areasFile, 'utf8');
  const areasVisible = visibleText(areasHtml);
  const h1s = (areasHtml.match(/<h1\b/gi) || []).length;
  if (h1s !== 1) failures.push(`/areas: ${h1s} <h1> elements, expected exactly 1`);
  if (areasHtml.includes('\u2014')) failures.push('/areas: em dash present');
  if (!/coverage-map/.test(areasHtml)) failures.push('/areas: coverage map image missing');
  for (const t of towns) {
    if (!areasVisible.includes(t.town)) failures.push(`/areas: ${t.town} missing from the town list`);
    if (!areasHtml.includes(`href="/${t.slug}"`)) failures.push(`/areas: no link to /${t.slug}`);
  }
  const areasLd = [...areasHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const areasNodes = areasLd.flatMap((d) => (d['@graph'] ? d['@graph'] : [d]));
  const areasFaq = areasNodes.find((n) => n['@type'] === 'FAQPage');
  if (!areasFaq) failures.push('/areas: no FAQPage node in JSON-LD');
  else {
    for (const q of areasFaq.mainEntity) {
      if (!areasVisible.includes(q.name)) failures.push(`/areas: FAQ question not in visible text: ${q.name}`);
      if (!areasVisible.includes(q.acceptedAnswer.text.replace(/\s+/g, ' '))) failures.push(`/areas: FAQ answer not in visible text for: ${q.name}`);
    }
  }
  if (!areasNodes.some((n) => n['@type'] === 'BreadcrumbList')) failures.push('/areas: no BreadcrumbList in JSON-LD');
  if (existsSync(sitemap) && !readFileSync(sitemap, 'utf8').includes('/areas')) failures.push('/areas: missing from sitemap-0.xml');
  console.log(`/areas: ok (${towns.length} town pages linked, ${areasFaq ? areasFaq.mainEntity.length : 0} FAQ questions)`);
}

if (failures.length) {
  console.error('\ncheck-locations: FAILED');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log('check-locations: all checks passed');
