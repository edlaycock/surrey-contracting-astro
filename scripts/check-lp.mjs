#!/usr/bin/env node
/**
 * Post-build guard for the v2 landing pages (the A/B "B" variants under /lp/).
 * Runs after `npm run build` alongside the other check-*.mjs guards.
 *
 * Scoped by an explicit list, so the v1 /lp pages (which predate these rules)
 * do not fail the build.
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
 *   - an /assets/ path is referenced that does not exist under public/ or
 *     cannot be URI-decoded, or an image is loaded from another host through
 *     an <img> or a CSS url()
 *   - the hero carries an eyebrow (Ed, 30 Sep: v2 heroes have none)
 *   - a /projects/<slug> link points at a page that was not built
 *   - the URL appears in any sitemap*.xml, llms.txt or llms-full.txt
 *
 * And on every landing page in src/pages/lp/ (v1 and v2):
 *   - name, phone, email, company, postcode and message lack data-tc-masked
 *   - lp/<slug>/thanks is missing, not noindex,nofollow, has a dash or a
 *     quote form, or does not link back to the LP
 *   - a /thanks URL appears in any sitemap*.xml or llms file
 *   - a /projects/<slug> link points at a page that was not built, or a
 *     case-study card link lacks target="_blank" rel="noopener"
 *
 * Surfacing exception (Ed, 1 Oct 2026): Jason confirmed that commercial and
 * public-sector surfacing belongs to Surrey Contracting; residential
 * surfacing belongs to Surrey Hills Surfacing, a separate client. Surrey
 * Contracting advertises commercial surfacing only; it stays off the main
 * site (nav, footer, homepage, services, sitemap). So exactly one
 * page, lp/commercial-surfacing, may use "surfacing" and "tarmac" (its
 * allowTerms below). "resin" stays forbidden there too (the claim is not
 * supported by anything the repo can stand behind), and
 * "surreyhillssurfacing" stays forbidden everywhere. That page also carries
 * extra forbidden terms so it cannot drift into residential or driveway
 * wording. Every other check applies to it unchanged.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/client';
const PUBLIC = 'public';

const V2_PAGES = [
  { slug: 'lp/demolition-2', leadSource: 'lp_demolition_2' },
  { slug: 'lp/groundworks-2', leadSource: 'lp_groundworks_2' },
  { slug: 'lp/earthworks-2', leadSource: 'lp_earthworks_2' },
  {
    slug: 'lp/commercial-surfacing',
    leadSource: 'lp_commercial_surfacing',
    // Ed, 1 Oct 2026: the only page allowed these two terms. Do not widen.
    allowTerms: ['surfacing', 'tarmac'],
    // Commercial and public sector only; residential belongs to SHS.
    extraForbidden: ['driveway', 'residential', 'homeowner', 'patio'],
  },
];

// Terms that no allowTerms entry may ever lift.
const NEVER_ALLOWED = ['resin', 'surreyhillssurfacing'];
for (const { slug, allowTerms = [] } of V2_PAGES) {
  for (const t of allowTerms) {
    if (NEVER_ALLOWED.includes(t)) {
      console.error(`check-lp: ${slug} tries to allow "${t}", which is forbidden on every page`);
      process.exit(1);
    }
  }
  if (allowTerms.length && slug !== 'lp/commercial-surfacing') {
    console.error(`check-lp: ${slug} has allowTerms; only lp/commercial-surfacing may (Ed, 1 Oct 2026)`);
    process.exit(1);
  }
}

const FORBIDDEN = [
  'surfacing',
  'tarmac',
  'resin',
  'surreyhillssurfacing',
  // 'constructionline' removed 2 Oct 2026: Ed reversed the 30 Sep ruling after
  // Jason confirmed Constructionline Gold membership.
  'ccdo',
  // Ed, 2 Oct 2026: Surrey Contracting is not approved for SafeContractor.
  'safecontractor',
  'safe contractor',
  'alcumus',
  'asbestos removal licen',
  'fully licensed',
  'aggregaterating',
  // Ed, 30 Sep: the v2 pages promise an itemised written quotation, not a set price.
  'fixed-price',
  'fixed price',
  // Offer parity with v1 (Ed, 30 Sep): v1 does not promise a visit window.
  '5 working days',
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

for (const { slug, leadSource, allowTerms = [], extraForbidden = [] } of V2_PAGES) {
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

  const hero = (html.match(/<section class="page-hero[\s\S]*?<\/section>/) || [''])[0];
  if (!hero) failures.push(`${slug}: no page-hero section found`);
  else if (/class="eyebrow\b/.test(hero)) failures.push(`${slug}: the hero carries an eyebrow, v2 heroes have none`);

  // Project tiles render from Sanity; a link to an unbuilt project would 404.
  for (const m of html.matchAll(/href="\/projects\/([^"\/#?]+)"/g)) {
    if (!existsSync(join(DIST, 'projects', m[1], 'index.html'))) failures.push(`${slug}: links to /projects/${m[1]}, which was not built`);
  }

  // "surreyhillssurfacing" contains "surfacing", so it is checked on its own
  // and an allowed "surfacing" never masks it.
  const forbidden = FORBIDDEN.filter((t) => !allowTerms.includes(t)).concat(extraForbidden);
  for (const term of forbidden) {
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
  const assets = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"|url\(['"]?(\/assets\/[^'")]+)['"]?\)/g)) {
    const raw = decode(m[1] || m[2]);
    try {
      assets.add(decodeURI(raw));
    } catch {
      failures.push(`${slug}: malformed asset path (cannot be URI-decoded): ${raw}`);
    }
  }
  for (const a of assets) {
    if (!existsSync(join(PUBLIC, a))) failures.push(`${slug}: referenced asset does not exist: ${a}`);
  }
  const external = [...html.matchAll(/<img\b[^>]*\bsrc="(https?:)?\/\/[^"]+"/gi)].map((m) => m[0]);
  if (external.length) failures.push(`${slug}: ${external.length} image(s) loaded from an external host`);
  // Same rule for CSS backgrounds, inline styles or <style> blocks.
  const externalCss = [...html.matchAll(/url\(['"]?(https?:)?\/\/[^'")]+/gi)].map((m) => m[0]);
  if (externalCss.length) failures.push(`${slug}: ${externalCss.length} CSS url() reference(s) to an external host: ${externalCss.slice(0, 2).join(', ')}`);

  if (failures.length === before) console.log(`${slug}: ok (${faq ? faq.mainEntity.length : 0} FAQ questions, ${assets.size} assets checked)`);
}

if (!existsSync(join(DIST, 'sitemap-0.xml'))) failures.push('sitemap-0.xml was not generated');
// Every sitemap file plus the llms files: none may list a landing page.
const indexFiles = readdirSync(DIST)
  .filter((f) => /^sitemap.*\.xml$/.test(f))
  .concat(['llms.txt', 'llms-full.txt'].filter((f) => existsSync(join(DIST, f))));
for (const f of indexFiles) {
  const text = readFileSync(join(DIST, f), 'utf8');
  for (const { slug } of V2_PAGES) {
    if (text.includes(`/${slug}`)) failures.push(`${slug}: listed in ${f}, it must stay out`);
  }
}

// Every landing page (v1 and v2 alike, Ed 13 Oct 2026): a thanks page that is
// noindex,nofollow and dash-free, TruConversion masking on the six personal
// fields of the form, and no thanks URL in any sitemap or llms file.
// TruConversion only masks an element that itself carries data-tc-masked.
const MASKED_FIELDS = ['name', 'phone', 'email', 'company', 'postcode', 'message'];
// Slugs from the LP source files, the same source as src/pages/lp/[slug]/thanks.astro
// (dist/client/lp also holds redirect stubs such as lp/surfacing, which are not LPs).
const lpSlugs = readdirSync('src/pages/lp').filter((f) => f.endsWith('.astro')).map((f) => f.slice(0, -'.astro'.length));
for (const s of lpSlugs) {
  if (!existsSync(join(DIST, 'lp', s, 'index.html'))) {
    failures.push(`lp/${s}: not built`);
    continue;
  }
  const lpHtml = readFileSync(join(DIST, 'lp', s, 'index.html'), 'utf8');
  for (const n of MASKED_FIELDS) {
    const field = (lpHtml.match(new RegExp(`<(?:input|textarea)\\b[^>]*\\bname="${n}"[^>]*>`)) || [''])[0];
    if (!field) failures.push(`lp/${s}: form field "${n}" not found`);
    else if (!/\sdata-tc-masked(?=[\s=>])/.test(field)) failures.push(`lp/${s}: field "${n}" lacks data-tc-masked`);
  }
  // Case-study cards (Ed, 13 Oct 2026): every /projects/<slug> link must point
  // at a built page, and every card link, plus the View all projects link in
  // the cards section, opens in a new tab with rel="noopener".
  for (const m of lpHtml.matchAll(/href="\/projects\/([^"\/#?]+)"/g)) {
    if (!existsSync(join(DIST, 'projects', m[1], 'index.html'))) failures.push(`lp/${s}: links to /projects/${m[1]}, which was not built`);
  }
  const cardsSection = (lpHtml.match(/<section class="page-section lp2-work">[\s\S]*?<\/section>/) || [''])[0];
  const cardLinks = [...lpHtml.matchAll(/<a\b[^>]*\bclass="proj"[^>]*>/g)].map((m) => m[0])
    .concat([...cardsSection.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]));
  for (const a of new Set(cardLinks)) {
    if (!/\btarget="_blank"/.test(a) || !/\brel="[^"]*\bnoopener\b[^"]*"/.test(a)) {
      failures.push(`lp/${s}: card link lacks target="_blank" rel="noopener": ${a}`);
    }
  }
  const thanksFile = join(DIST, 'lp', s, 'thanks', 'index.html');
  if (!existsSync(thanksFile)) {
    failures.push(`lp/${s}/thanks: not built (${thanksFile} missing)`);
    continue;
  }
  const t = readFileSync(thanksFile, 'utf8');
  if (!t.includes('<meta name="robots" content="noindex,nofollow">')) failures.push(`lp/${s}/thanks: missing <meta name="robots" content="noindex,nofollow">`);
  if (t.includes(EM_DASH) || t.includes(EN_DASH)) failures.push(`lp/${s}/thanks: em or en dash present`);
  if (t.includes('id="quoteForm"')) failures.push(`lp/${s}/thanks: carries a quote form, it must not`);
  if (!t.includes(`href="/lp/${s}"`)) failures.push(`lp/${s}/thanks: no link back to /lp/${s}`);
}
for (const f of indexFiles) {
  if (readFileSync(join(DIST, f), 'utf8').includes('/thanks')) failures.push(`${f}: lists a /thanks page, it must stay out`);
}
if (lpSlugs.length) console.log(`thanks pages and form masking: ${lpSlugs.length} landing pages checked`);

if (failures.length) {
  console.error('\ncheck-lp: FAILED');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log('check-lp: all checks passed');
