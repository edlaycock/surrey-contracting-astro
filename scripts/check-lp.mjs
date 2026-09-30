#!/usr/bin/env node
/**
 * Post-build guard for the v2 landing pages (the A/B "B" variants under /lp/).
 * Runs after `npm run build` alongside the other check-*.mjs guards.
 *
 * Scoped by an explicit list, so the v1 /lp pages (which predate these rules)
 * do not fail the build. Add groundworks-2 and earthworks-2 to V2_PAGES when
 * they are built.
 *
 * Fails the build if, on any listed page:
 *   - the page was not built
 *   - <meta name="robots" content="noindex,follow"> is missing
 *   - an em dash or en dash appears anywhere in the HTML
 *   - there is not exactly one <h1> or exactly one id="quoteForm"
 *   - the form's data-lead-source is not the expected label
 *   - a FAQPage question or answer is not in the visible text
 *   - the Service or BreadcrumbList node is missing
 *   - a forbidden term appears (unsupported claims, the surfacing business,
 *     aggregateRating)
 *   - an /assets/ path is referenced that does not exist under public/, or an
 *     image is loaded from another host
 *   - the URL appears in sitemap-0.xml
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/client';
const PUBLIC = 'public';

const V2_PAGES = [
  { slug: 'lp/demolition-2', leadSource: 'lp_demolition_2' },
];

const FORBIDDEN = [
  'surfacing',
  'tarmac',
  'resin',
  'surreyhillssurfacing',
  'constructionline',
  'ccdo',
  'asbestos removal licen',
  'fully licensed',
  'aggregaterating',
];

const EM_DASH = '—';
const EN_DASH = '–';

const failures = [];

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
   .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
// Same approach as check-guides.mjs: inline tags vanish, block tags become a
// space so adjacent elements do not fuse.
const visibleText = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<\/?(a|strong|em|b|i|span|time)\b[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ');

for (const { slug, leadSource } of V2_PAGES) {
  const before = failures.length;
  const file = join(DIST, slug, 'index.html');
  if (!existsSync(file)) {
    failures.push(`${slug}: not built (${file} missing)`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const visible = visibleText(html);
  const lower = html.toLowerCase();

  if (!html.includes('<meta name="robots" content="noindex,follow">')) {
    failures.push(`${slug}: missing <meta name="robots" content="noindex,follow">`);
  }

  if (html.includes(EM_DASH)) failures.push(`${slug}: em dash present`);
  if (html.includes(EN_DASH)) failures.push(`${slug}: en dash present`);

  const h1s = (html.match(/<h1\b/gi) || []).length;
  if (h1s !== 1) failures.push(`${slug}: ${h1s} <h1> elements, expected exactly 1`);

  const forms = (html.match(/id="quoteForm"/g) || []).length;
  if (forms !== 1) failures.push(`${slug}: ${forms} id="quoteForm", expected exactly 1`);
  if (!html.includes(`data-lead-source="${leadSource}"`)) {
    failures.push(`${slug}: data-lead-source="${leadSource}" not found on the form`);
  }

  for (const term of FORBIDDEN) {
    if (lower.includes(term)) failures.push(`${slug}: forbidden term "${term}"`);
  }

  let ld = [];
  try {
    ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  } catch (e) {
    failures.push(`${slug}: JSON-LD does not parse (${e.message})`);
  }
  const nodes = ld.flatMap((d) => (d['@graph'] ? d['@graph'] : [d]));

  const faq = nodes.find((n) => n['@type'] === 'FAQPage');
  if (!faq) failures.push(`${slug}: no FAQPage node in JSON-LD`);
  else {
    for (const q of faq.mainEntity) {
      if (!visible.includes(q.name)) failures.push(`${slug}: FAQ question not in visible text: ${q.name}`);
      if (!visible.includes(q.acceptedAnswer.text.replace(/\s+/g, ' '))) failures.push(`${slug}: FAQ answer not in visible text for: ${q.name}`);
    }
    const visibleQs = (html.match(/<details class="faq-item"/g) || []).length;
    if (visibleQs !== faq.mainEntity.length) {
      failures.push(`${slug}: ${visibleQs} visible FAQ items but ${faq.mainEntity.length} in FAQPage JSON-LD`);
    }
  }
  if (!nodes.some((n) => n['@type'] === 'Service')) failures.push(`${slug}: no Service node in JSON-LD`);
  if (!nodes.some((n) => n['@type'] === 'BreadcrumbList')) failures.push(`${slug}: no BreadcrumbList in JSON-LD`);

  // Every local asset must exist; no image may come from another host.
  const assets = new Set(
    [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"|url\(['"]?(\/assets\/[^'")]+)['"]?\)/g)]
      .map((m) => decodeURI(decode(m[1] || m[2]))),
  );
  for (const a of assets) {
    if (!existsSync(join(PUBLIC, a))) failures.push(`${slug}: referenced asset does not exist: ${a}`);
  }
  const external = [...html.matchAll(/<img\b[^>]*\bsrc="(https?:)?\/\/[^"]+"/gi)].map((m) => m[0]);
  if (external.length) failures.push(`${slug}: ${external.length} image(s) loaded from an external host`);

  if (failures.length === before) console.log(`${slug}: ok (${faq ? faq.mainEntity.length : 0} FAQ questions, ${assets.size} assets checked)`);
}

const sitemap = join(DIST, 'sitemap-0.xml');
if (existsSync(sitemap)) {
  const xml = readFileSync(sitemap, 'utf8');
  for (const { slug } of V2_PAGES) {
    if (xml.includes(`/${slug}`)) failures.push(`${slug}: listed in sitemap-0.xml, it must stay out`);
  }
} else {
  failures.push('sitemap-0.xml was not generated');
}

if (failures.length) {
  console.error('\ncheck-lp: FAILED');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log('check-lp: all checks passed');
