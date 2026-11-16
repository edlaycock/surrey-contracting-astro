#!/usr/bin/env node
/**
 * End-to-end test of the YourTradeQuotes case-study kit against the BUILT
 * site (run `npm run build` first). Run: npm run test:case-study-pages
 *
 * Starts server.mjs (the container's entry: the built Astro server plus the
 * case-study poll) on 127.0.0.1 with a temporary store, and a
 * stub of YTQ's caseStudyFeed on 127.0.0.1 (scripts/lib/case-study-fixtures.mjs).
 * Then, as YTQ would: a signed "fetch now" signal to /api/ytq-refresh, the
 * site pulls the feed and photos and acknowledges; the pages, photos and
 * sitemap are checked; tombstones take them down again. Nothing leaves the
 * machine: both servers are on loopback and the feed endpoint is the stub.
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, symlinkSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import {
  ACCOUNT, DUMMY_KEY, ROOT, core, createFeedStub, fullRecord, minimalRecord, tombstoneFor,
} from './lib/case-study-fixtures.mjs';

const { signRefresh } = await import('../src/lib/caseStudies/signal.ts');
const { readConfig } = await import('../src/lib/caseStudies/config.ts');
const store = await import('../src/lib/caseStudies/store.ts');
const { siteContext } = await import('../src/lib/caseStudies/siteContext.ts');

// CASE_STUDY_APP_DIR runs the server from another directory holding only what
// the Docker runtime stage copies (node_modules, dist, package.json,
// vendor/caseStudyCore), to prove that set is enough.
const APP = process.env.CASE_STUDY_APP_DIR || ROOT;
const entry = join(APP, 'server.mjs');
if (!existsSync(join(APP, 'dist', 'server', 'entry.mjs'))) {
  console.error('check-case-study-pages: dist/server/entry.mjs not found (run npm run build first)');
  process.exit(1);
}

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (err) {
    failures.push(name);
    console.error(`FAIL ${name}\n     ${err && err.message}`);
  }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (a, e, msg) => { if (JSON.stringify(a) !== JSON.stringify(e)) throw new Error(`${msg}: expected ${JSON.stringify(e)}, got ${JSON.stringify(a)}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// ---------- the stub feed on loopback ----------
const feed = createFeedStub();
const feedServer = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString('utf8');
  const out = await feed.fetch(`http://127.0.0.1${req.url}`, { method: req.method, headers: req.headers, body: body || undefined });
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
});
await new Promise((r) => feedServer.listen(0, '127.0.0.1', r));
const feedPort = feedServer.address().port;

// ---------- the built site ----------
const dataDir = mkdtempSync(join(tmpdir(), 'ytq-cs-pages-'));
const port = 20000 + Math.floor(Math.random() * 20000);
const env = {
  PATH: process.env.PATH,
  HOST: '127.0.0.1',
  PORT: String(port),
  NODE_ENV: 'production',
  YTQ_CASE_STUDIES: 'on',
  YTQ_SECRET_KEY: DUMMY_KEY,
  YTQ_FEED_ENDPOINT: `http://127.0.0.1:${feedPort}/caseStudyFeed`,
  YTQ_CASE_STUDY_DIR: dataDir,
};
/** Starts server.mjs and waits for its "listening" line, without sending it any request. */
async function startSite(extraEnv = {}) {
  const proc = spawn(process.execPath, [entry], { cwd: APP, env: { ...env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'] });
  const site = { proc, log: '' };
  proc.stdout.on('data', (d) => { site.log += d; });
  proc.stderr.on('data', (d) => { site.log += d; });
  for (let i = 0; i < 200 && !/Server listening/.test(site.log); i++) await sleep(50);
  if (!/Server listening/.test(site.log)) throw new Error(`server did not start: ${site.log.slice(-500)}`);
  return site;
}

// ---------- M4: the poll starts at server start, with no request at all ----------
{
  const pollFeed = createFeedStub();
  const pollServer = http.createServer(async (req, res) => {
    const out = await pollFeed.fetch(`http://127.0.0.1${req.url}`, { method: req.method, headers: req.headers });
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
  });
  await new Promise((r) => pollServer.listen(0, '127.0.0.1', r));
  const pollDir = mkdtempSync(join(tmpdir(), 'ytq-cs-poll-'));
  const common = { PORT: String(port + 2), YTQ_CASE_STUDY_DIR: pollDir, YTQ_FEED_ENDPOINT: `http://127.0.0.1:${pollServer.address().port}/caseStudyFeed`, YTQ_POLL_START_SECONDS: '1' };
  await test('M4: switched on, the server calls the feed by itself after start, without any page request', async () => {
    const site = await startSite(common);
    try {
      for (let i = 0; i < 100 && pollFeed.requests.length === 0; i++) await sleep(50);
      assert(pollFeed.requests.length > 0, 'the stub feed was called');
      for (let i = 0; i < 100 && !/sync \(startup\)/.test(site.log); i++) await sleep(50);
      assert(/sync \(startup\): ok/.test(site.log), 'the startup sync ran and finished');
    } finally {
      site.proc.kill();
    }
  });
  await test('M4: switched off, the server never calls the feed', async () => {
    const before = pollFeed.requests.length;
    const site = await startSite({ ...common, PORT: String(port + 3), YTQ_CASE_STUDIES: '' });
    try {
      await sleep(2500);
      eq(pollFeed.requests.length, before, 'no feed call');
    } finally {
      site.proc.kill();
    }
  });
  await test('F4: if the poll cannot load, the site still serves and the log says why', async () => {
    const bare = mkdtempSync(join(tmpdir(), 'ytq-cs-bare-'));
    try {
      // server.mjs copied, not linked (Node would resolve a link back to this
      // repository and find src/); no src/lib/caseStudies beside it.
      for (const name of ['dist', 'package.json', 'vendor', 'node_modules']) symlinkSync(join(APP, name), join(bare, name));
      copyFileSync(join(APP, 'server.mjs'), join(bare, 'server.mjs'));
      const proc = spawn(process.execPath, [join(bare, 'server.mjs')], { cwd: bare, env: { ...env, ...common, PORT: String(port + 4) }, stdio: ['ignore', 'pipe', 'pipe'] });
      let log = '';
      proc.stdout.on('data', (d) => { log += d; });
      proc.stderr.on('data', (d) => { log += d; });
      try {
        for (let i = 0; i < 200 && !/poller did not start/.test(log); i++) await sleep(50);
        assert(/poller did not start: ERR_MODULE_NOT_FOUND/.test(log), `logged with its code: ${log.slice(-300)}`);
        eq((await fetch(`http://127.0.0.1:${port + 4}/`)).status, 200, 'site serves');
      } finally {
        proc.kill();
      }
    } finally {
      rmSync(bare, { recursive: true, force: true });
    }
  });
  pollServer.close();
  rmSync(pollDir, { recursive: true, force: true });
}

// The main site's own startup sync is pushed out of the test's way.
const mainSite = await startSite({ YTQ_POLL_START_SECONDS: '600' });
const server = mainSite.proc;
let serverLog = '';
const BASE = `http://127.0.0.1:${port}`;
const get = async (path, init) => {
  const res = await fetch(BASE + path, { redirect: 'manual', ...init });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, headers: res.headers, buf, text: buf.toString('utf8') };
};
const config = readConfig(env);

const signal = (over = {}) => {
  const body = { account: ACCOUNT, timestamp: Math.floor(Date.now() / 1000), nonce: randomBytes(16).toString('hex'), ...over };
  const sig = signRefresh({ secretKey: DUMMY_KEY, host: 'surreycontracting.co.uk', path: '/api/ytq-refresh', ...body });
  return { method: 'POST', headers: { 'content-type': 'application/json', 'x-ytq-signature': sig }, body: JSON.stringify(body) };
};
async function waitFor(cond, what) {
  for (let i = 0; i < 200; i++) {
    if (cond()) return;
    await sleep(50);
  }
  throw new Error(`timed out waiting for ${what}`);
}

const imgTags = (html) => html.match(/<img\b[^>]*>/g) || [];
const attr = (tag, name) => (new RegExp(`\\s${name}="([^"]*)"`).exec(tag) || [])[1];
const article = (html) => html.slice(html.indexOf('<article'), html.indexOf('</article>') + 10);

try {
  // ---------- nothing published ----------
  await test('no case studies: listing and any slug are the branded 404, sitemap is an empty urlset', async () => {
    const list = await get('/case-studies');
    eq(list.status, 404, 'listing');
    assert(list.text.includes('This page took a wrong turn'), 'branded 404');
    eq((await get('/case-studies/anything-here')).status, 404, 'slug');
    const sm = await get('/sitemap-case-studies.xml');
    eq(sm.status, 200, 'sitemap');
    assert(!sm.text.includes('<url>'), 'no urls');
    // M1: the static sitemaps are as they were; the case-study sitemap is submitted in Search Console.
    const index = readFileSync(join(APP, 'dist', 'client', 'sitemap-index.xml'), 'utf8');
    assert(!index.includes('case-studies') && !readFileSync(join(APP, 'dist', 'client', 'sitemap-0.xml'), 'utf8').includes('case-studies'), 'static sitemaps name no case-study URL');
  });

  await test('refresh route: unsigned, malformed or GET answers a plain 401', async () => {
    const r1 = await get('/api/ytq-refresh', { method: 'POST', body: '{}' });
    eq([r1.status, r1.text], [401, ''], 'unsigned');
    eq((await get('/api/ytq-refresh')).status, 401, 'GET');
    const bad = signal();
    bad.headers['x-ytq-signature'] = '0'.repeat(64);
    eq((await get('/api/ytq-refresh', bad)).status, 401, 'bad signature');
    const stale = signal({ timestamp: Math.floor(Date.now() / 1000) - 400 });
    eq((await get('/api/ytq-refresh', stale)).status, 401, 'stale');
    const big = signal();
    big.body = big.body.replace('}', `,"pad":"${'x'.repeat(4096)}"}`);
    eq((await get('/api/ytq-refresh', big)).status, 401, 'oversized body');
    eq(feed.requests.length, 0, 'none of them reached the feed');
  });

  // ---------- publish ----------
  const full = await fullRecord();
  const minimal = await minimalRecord();
  feed.addRecord(full.record, full.photos);
  feed.addRecord(minimal.record, minimal.photos);

  await test('a signed signal answers 202, the site pulls the feed and acknowledges both live; a replay is 401', async () => {
    const s = signal();
    const r = await get('/api/ytq-refresh', s);
    eq(r.status, 202, 'accepted');
    await waitFor(() => feed.acks.length >= 2, 'two acknowledgements');
    eq(feed.acks.map((a) => [a.id, a.state, a.url]).sort(), [
      [full.record.id, 'live', `https://surreycontracting.co.uk/case-studies/${full.record.slug}`],
      [minimal.record.id, 'live', `https://surreycontracting.co.uk/case-studies/${minimal.record.slug}`],
    ].sort(), 'acks');
    eq((await get('/api/ytq-refresh', s)).status, 401, 'replay refused');
  });

  const state = store.loadState(dataDir);
  const fullEntry = state.entries[full.record.id];

  await test('detail page: structure, top pair, story, FAQs, head tags, exact JSON-LD', async () => {
    const page = await get(`/case-studies/${full.record.slug}`);
    eq(page.status, 200, 'status');
    const html = page.text;
    eq((html.match(/<h1\b/g) || []).length, 1, 'one h1');
    assert(html.includes('<article class="cs" lang="en-GB">'), 'article with lang');
    const a = article(html);
    const top = a.indexOf('cs-top cs-pair');
    assert(top > a.indexOf('cs-title') && top < a.indexOf('cs-story'), 'pair between title and story');
    assert(a.indexOf('cs-pair-before') < a.indexOf('cs-pair-after'), 'before first');
    eq((a.match(/<section class="cs-section cs-section-/g) || []).length, 5, 'five sections');
    eq((a.match(/class="cs-section cs-section-(\w+)"/g) || []).map((m) => m.split('cs-section-')[1].slice(0, -1)), ['need', 'challenge', 'solution', 'work', 'result'], 'in order');
    eq((a.slice(a.indexOf('cs-faqs')).match(/<h3>/g) || []).length, 3, 'three FAQ h3');
    assert(a.includes('posts &amp; gravel boards') && a.includes('&lt;2m'), 'FAQ text escaped');
    assert(a.includes('<span class="cs-meta-town">Hersham</span>') && a.includes('October 2026'), 'meta line');
    const expectedTag = core.buildJsonLdScriptTag(full.record, siteContext(fullEntry.slug, fullEntry.photos, config));
    assert(html.includes(expectedTag), 'JSON-LD exactly as the core builder returns it');
    eq((html.match(/"@type": "Article"/g) || []).length, 1, 'one Article');
    assert(html.includes('<meta property="og:type" content="article">'), 'og:type article');
    assert(html.includes(`<meta property="article:published_time" content="${full.record.published_at}">`), 'published time');
    assert(html.includes(`<link rel="canonical" href="https://surreycontracting.co.uk/case-studies/${full.record.slug}">`), 'canonical');
    assert(html.includes('og:image:alt'), 'og:image:alt');
    assert(!/noindex/i.test(html), 'not noindexed');
    eq(page.headers.get('cache-control'), 'no-cache', 'not cached past a removal');
  });

  await test('detail page: no customer details, consent, ids, versions or hashes anywhere in the output', async () => {
    const html = (await get(`/case-studies/${full.record.slug}`)).text;
    const fixture = JSON.parse(readFileSync(join(ROOT, 'vendor', 'caseStudyCore', 'fixtures', 'valid-full.json'), 'utf8'));
    const banned = [
      ...fixture.forbidden_terms.map((t) => t.value),
      'withheld', 'confirmed_by', 'confirmed_at', 'customer_permission', 'wording_version', 'yes_written',
      full.record.id, ...full.record.photos.map((p) => p.sha256), DUMMY_KEY, 'caseStudyFeed', 'ytq_live_',
    ];
    for (const b of banned) assert(!html.includes(b), `page contains ${b.slice(0, 24)}`);
    // The site's own cookie-consent scripts sit in the layout; the case study
    // (the article, which holds the JSON-LD too) must not mention consent at all.
    assert(!/consent/i.test(article(html)), 'no consent data in the case study');
  });

  await test('detail page images: whole photos with width, height and alt; the top pair eager, the rest lazy; bytes match the record', async () => {
    const html = (await get(`/case-studies/${full.record.slug}`)).text;
    const imgs = imgTags(article(html));
    eq(imgs.length, 6, 'six photos');
    for (const tag of imgs) {
      assert(attr(tag, 'width') && attr(tag, 'height') && attr(tag, 'alt'), 'width, height, alt');
      assert(attr(tag, 'srcset'), 'srcset');
    }
    eq(imgs.slice(0, 2).map((t) => attr(t, 'loading')), ['eager', 'eager'], 'top pair eager');
    assert(imgs.slice(2).every((t) => attr(t, 'loading') === 'lazy' && attr(t, 'decoding') === 'async'), 'rest lazy');
    for (const photo of full.record.photos) {
      const tag = imgs.find((t) => attr(t, 'alt') === photo.alt);
      const res = await get(attr(tag, 'src'));
      eq([res.status, res.headers.get('content-type')], [200, 'image/jpeg'], `photo ${photo.ref}`);
      eq(sha256(res.buf), photo.sha256, `bytes of ${photo.ref}`);
      for (const part of attr(tag, 'srcset').split(', ')) eq((await get(part.split(' ')[0])).status, 200, 'srcset copy');
    }
    const first = await get(attr(imgs[0], 'src'));
    const etag = first.headers.get('etag');
    assert(etag && etag.startsWith('"'), 'ETag sent');
    const again = await get(attr(imgs[0], 'src'), { headers: { 'if-none-match': etag } });
    eq([again.status, again.buf.length], [304, 0], 'If-None-Match answers 304');
    eq((await get('/case-studies/media/ph_nothere_01-aaaaaaaaaaaa.jpg')).status, 404, 'an unknown file');
    eq((await get('/case-studies/media/..%2Fstate.json')).status, 404, 'no path tricks');
  });

  await test('minimal record: hero on top, hidden town never shown', async () => {
    const page = await get(`/case-studies/${minimal.record.slug}`);
    eq(page.status, 200, 'status');
    const a = article(page.text);
    assert(a.includes('cs-top cs-hero') && !a.includes('cs-pair'), 'hero on top');
    // The site's own footer and its LocalBusiness areaServed name Guildford;
    // the case study, its title and its meta tags must not.
    const tags = [...(page.text.match(/<title>[^<]*<\/title>/g) || []), ...(page.text.match(/<meta\b[^>]*>/g) || [])].join('\n');
    assert(!a.includes(minimal.record.location.town) && !tags.includes(minimal.record.location.town), 'town hidden in the case study and its head tags');
    assert(!a.includes('cs-faqs'), 'no FAQ block');
  });

  await test('listing and sitemap list both published case studies', async () => {
    const list = await get('/case-studies');
    eq(list.status, 200, 'listing');
    eq((list.text.match(/class="gallery-card cs-card"/g) || []).length, 2, 'two cards');
    assert(!list.text.includes('cs-filter'), 'no filter with two');
    const sm = (await get('/sitemap-case-studies.xml')).text;
    for (const slug of [full.record.slug, minimal.record.slug]) assert(sm.includes(`https://surreycontracting.co.uk/case-studies/${slug}</loc>`), `sitemap has ${slug}`);
    assert(sm.includes('https://surreycontracting.co.uk/case-studies</loc>'), 'sitemap has the listing');
  });

  await test('M3: switched off with case studies stored: every case-study URL answers as if nothing were published; the store is kept; on again restores them', async () => {
    const img = attr(imgTags(article((await get(`/case-studies/${full.record.slug}`)).text))[0], 'src');
    const before = feed.requests.length;
    const off = await startSite({ PORT: String(port + 1), YTQ_CASE_STUDIES: '' });
    const OFF = `http://127.0.0.1:${port + 1}`;
    try {
      eq((await fetch(`${OFF}/case-studies/${full.record.slug}`, { redirect: 'manual' })).status, 404, 'detail 404');
      eq((await fetch(`${OFF}/case-studies`)).status, 404, 'listing 404');
      eq((await fetch(OFF + img)).status, 404, 'photo 404');
      assert(!(await (await fetch(`${OFF}/sitemap-case-studies.xml`)).text()).includes('<url>'), 'sitemap empty');
      eq((await fetch(`${OFF}/api/ytq-refresh`, signal())).status, 401, 'a good signal is 401');
      await sleep(300);
      eq(feed.requests.length, before, 'no feed call');
    } finally {
      off.proc.kill();
    }
    eq(Object.keys(store.loadState(dataDir).entries).length, 2, 'store kept');
    eq((await get(`/case-studies/${full.record.slug}`)).status, 200, 'switched on again: served');
  });

  await test('F3: with no successful sync in the last three poll intervals the stored pages are held (404)', async () => {
    const s = store.loadState(dataDir);
    const okAt = s.lastOkAt;
    assert(okAt, 'the signal sync recorded a success');
    s.lastOkAt = new Date(Date.now() - 3 * 60 * 60 * 1000 - 60 * 1000).toISOString();
    store.saveState(dataDir, s);
    eq((await get(`/case-studies/${full.record.slug}`)).status, 404, 'held');
    eq((await get('/case-studies')).status, 404, 'listing held');
    // A good signal: the sync succeeds and the pages come back.
    eq((await get('/api/ytq-refresh', signal())).status, 202, 'signal');
    await waitFor(() => Date.parse(store.loadState(dataDir).lastOkAt) > Date.now() - 60 * 1000, 'a fresh sync');
    eq((await get(`/case-studies/${full.record.slug}`)).status, 200, 'served again');
  });

  // ---------- remove ----------
  await test('a tombstone: the page answers 410 with nothing from the record, photos 404, sitemap and listing drop it', async () => {
    const src = attr(imgTags(article((await get(`/case-studies/${full.record.slug}`)).text))[0], 'src');
    feed.addTombstone(tombstoneFor(full.record));
    eq((await get('/api/ytq-refresh', signal())).status, 202, 'signal');
    await waitFor(() => feed.acks.some((a) => a.id === full.record.id && a.state === 'removed'), 'removed ack');
    const gone = await get(`/case-studies/${full.record.slug}`);
    eq(gone.status, 410, '410 Gone');
    assert(!gone.text.includes(full.record.title) && !gone.text.includes(full.record.excerpt) && !gone.text.includes('ld+json"\n'), 'nothing from the record');
    eq((await get(src)).status, 404, 'photo gone');
    const sm = (await get('/sitemap-case-studies.xml')).text;
    assert(!sm.includes(full.record.slug), 'sitemap drops it');
    eq((( await get('/case-studies')).text.match(/class="gallery-card cs-card"/g) || []).length, 1, 'one card left');
    const left = store.loadState(dataDir);
    const minimalPhoto = Object.values(left.entries[minimal.record.id].photos)[0];
    eq([...store.referencedFiles(left)].sort(), [minimalPhoto.file, ...minimalPhoto.variants.map((v) => v.file)].sort(), 'only the other case study\'s photo and copies left');
    eq(readdirSync(join(dataDir, 'media')).length, 1 + minimalPhoto.variants.length, 'removed files deleted from disk');
  });

  await test('the last tombstone: listing is 404 again', async () => {
    feed.addTombstone(tombstoneFor(minimal.record));
    eq((await get('/api/ytq-refresh', signal())).status, 202, 'signal');
    await waitFor(() => feed.acks.some((a) => a.id === minimal.record.id && a.state === 'removed'), 'removed ack');
    eq((await get('/case-studies')).status, 404, 'listing 404');
    assert(!(await get('/sitemap-case-studies.xml')).text.includes('<url>'), 'sitemap empty');
  });

  await test('server log carries no key and no record text', async () => {
    serverLog = mainSite.log;
    assert(!serverLog.includes(DUMMY_KEY), 'no key');
    assert(!serverLog.includes(full.record.sections[0].answer.slice(0, 30)), 'no record text');
    assert(serverLog.includes('[case-studies]'), 'sync logged its outcome');
  });
} finally {
  server.kill();
  feedServer.close();
  rmSync(dataDir, { recursive: true, force: true });
}
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('--- server log ---\n' + mainSite.log.split('\n').slice(-30).join('\n'));
  process.exit(1);
}
