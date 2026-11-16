#!/usr/bin/env node
/**
 * Tests for the YourTradeQuotes case-study kit (src/lib/caseStudies).
 * Run: npm run test:case-studies
 *
 * The feed is a stub (scripts/lib/case-study-fixtures.mjs) passed in as
 * fetchImpl, answering as YTQ's caseStudyFeed does. Global fetch is wrapped so
 * any request to a host other than 127.0.0.1 throws: nothing here can reach
 * YourTradeQuotes or the live site. The key is a dummy.
 *
 * Imports the .ts files directly under Node's type stripping (Node 22.18+).
 */
import { mkdtempSync, rmSync, readdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ACCOUNT, DUMMY_KEY, ROOT, core, createFeedStub, fullRecord, minimalRecord, invalidRecord, tombstoneFor, sha256,
} from './lib/case-study-fixtures.mjs';

const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname !== '127.0.0.1') throw new Error(`blocked non-loopback fetch to ${url.hostname}`);
  return realFetch(input, init);
};

const signal = await import('../src/lib/caseStudies/signal.ts');
const { readConfig } = await import('../src/lib/caseStudies/config.ts');
const sync = await import('../src/lib/caseStudies/sync.ts');
const store = await import('../src/lib/caseStudies/store.ts');
const render = await import('../src/lib/caseStudies/render.ts');
const { siteContext, BUSINESS } = await import('../src/lib/caseStudies/siteContext.ts');
const { sharpResizer } = await import('../src/lib/caseStudies/poller.ts');

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (err) {
    failures.push(name);
    console.error(`FAIL ${name}\n     ${err && err.stack ? err.stack.split('\n').slice(0, 3).join('\n     ') : err}`);
  }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const eq = (actual, expected, msg) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}: expected ${e}, got ${a}`);
};

// ---------- signature ----------

const HOST = 'surreycontracting.co.uk';
const PATH = '/api/ytq-refresh';
const NOW = 1763200000;
const NONCE = '0123456789abcdef0123456789abcdef';
const signed = (over = {}) => {
  const b = { account: ACCOUNT, timestamp: NOW, nonce: NONCE, ...over.body };
  const sig = signal.signRefresh({ secretKey: DUMMY_KEY, host: over.signHost ?? HOST, path: over.signPath ?? PATH, timestamp: b.timestamp, nonce: b.nonce, account: b.account });
  return { body: JSON.stringify(b), headers: { 'x-ytq-signature': over.sig ?? sig } };
};
const verify = (s, over = {}) => signal.verifyRefreshSignal({
  secretKey: DUMMY_KEY, host: HOST, path: PATH, headers: s.headers, body: s.body,
  nowSeconds: over.now ?? NOW, seenNonces: over.nonces ?? new Map(), expectedAccount: over.account,
});

await test('signature: matches YTQ signRefresh byte for byte (golden vector from functions/caseStudySignal.js @ d98b030)', () => {
  eq(signal.signRefresh({ secretKey: DUMMY_KEY, host: HOST, path: PATH, timestamp: NOW, nonce: NONCE, account: ACCOUNT }),
    '5a331394a359c78142189b28d761b032b9a92bdbba9704d887231f5e1b3376b9', 'signature');
  eq(signal.signingString({ host: 'SurreyContracting.co.uk', path: PATH, timestamp: NOW, nonce: NONCE, account: ACCOUNT }),
    `POST|surreycontracting.co.uk|${PATH}|${NOW}|${NONCE}|${ACCOUNT}`, 'signing string lower-cases the host');
});

await test('signature: a good signal verifies', () => {
  eq(verify(signed()), { ok: true }, 'good');
});

await test('signature: a replayed nonce is refused', () => {
  const nonces = new Map();
  const s = signed();
  eq(verify(s, { nonces }), { ok: true }, 'first');
  eq(verify(s, { nonces, now: NOW + 10 }), { ok: false, reason: 'replay' }, 'replay');
});

await test('signature: stale or future by more than 300 s is refused; 300 s is accepted', () => {
  eq(verify(signed(), { now: NOW + 301 }), { ok: false, reason: 'stale' }, 'old');
  eq(verify(signed(), { now: NOW - 301 }), { ok: false, reason: 'stale' }, 'future');
  eq(verify(signed(), { now: NOW + 300 }), { ok: true }, 'edge');
  eq(verify(signed({ body: { timestamp: String(NOW) } })).ok, false, 'string timestamp');
});

await test('signature: a signal for another host or path is refused', () => {
  eq(verify(signed({ signHost: 'www.surreycontracting.co.uk' })), { ok: false, reason: 'signature' }, 'host');
  eq(verify(signed({ signHost: 'other-site.co.uk' })), { ok: false, reason: 'signature' }, 'other site');
  eq(verify(signed({ signPath: '/wp-json/ytq/v1/refresh' })), { ok: false, reason: 'signature' }, 'path');
});

await test('signature: wrong key, bad formats, wrong account', () => {
  const s = signed();
  eq(signal.verifyRefreshSignal({ secretKey: 'another-dummy', host: HOST, path: PATH, headers: s.headers, body: s.body, nowSeconds: NOW, seenNonces: new Map() }).ok, false, 'wrong key');
  eq(verify(signed({ sig: 'A'.repeat(64) })), { ok: false, reason: 'signature_format' }, 'upper-case hex');
  eq(verify({ headers: {}, body: s.body }), { ok: false, reason: 'signature_format' }, 'no header');
  eq(verify(signed({ body: { nonce: 'ABCDEF0123456789abcdef0123456789' } })), { ok: false, reason: 'nonce_format' }, 'nonce');
  eq(verify({ headers: s.headers, body: '{not json' }), { ok: false, reason: 'body' }, 'body');
  eq(verify(s, { account: 'uid_someone_else' }), { ok: false, reason: 'account' }, 'account');
  eq(verify(s, { account: ACCOUNT }), { ok: true }, 'expected account');
  eq(signal.verifyRefreshSignal({ secretKey: '', host: HOST, path: PATH, headers: s.headers, body: s.body, nowSeconds: NOW, seenNonces: new Map() }).ok, false, 'no key configured');
});

await test('signature: nonces expire after the 300 s window (store stays bounded)', () => {
  const nonces = new Map();
  eq(verify(signed(), { nonces }), { ok: true }, 'first');
  const later = signed({ body: { timestamp: NOW + 301, nonce: 'f'.repeat(32) } });
  eq(verify(later, { nonces, now: NOW + 301 }), { ok: true }, 'later');
  assert(!nonces.has(NONCE), 'old nonce dropped');
  eq(nonces.size, 1, 'one nonce kept');
});

// ---------- config ----------

await test('config: off unless YTQ_CASE_STUDIES=on; refresh URL binds host and path; feed must be https', () => {
  const off = readConfig({ YTQ_SECRET_KEY: DUMMY_KEY });
  eq(off.enabled, false, 'off by default');
  const on = readConfig({ YTQ_CASE_STUDIES: 'on', YTQ_SECRET_KEY: DUMMY_KEY, YTQ_CASE_STUDY_DIR: '/tmp/x' });
  eq([on.enabled, on.refreshHost, on.refreshPath, on.feedEndpoint], [true, HOST, PATH, sync.siteBlock(on, core) && 'https://europe-west2-yourtradequotes.cloudfunctions.net/caseStudyFeed'], 'on');
  eq(readConfig({ YTQ_CASE_STUDIES: 'on', YTQ_FEED_ENDPOINT: 'http://example.com/feed' }).enabled, false, 'plain http off loopback refused');
  eq(readConfig({ YTQ_CASE_STUDIES: 'on', YTQ_FEED_ENDPOINT: 'http://127.0.0.1:9/feed' }).enabled, true, 'loopback stub allowed');
});

// ---------- sync ----------

const tmpDirs = [];
function setup(over = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ytq-cs-'));
  tmpDirs.push(dir);
  const config = readConfig({ YTQ_CASE_STUDIES: 'on', YTQ_SECRET_KEY: DUMMY_KEY, YTQ_CASE_STUDY_DIR: dir, YTQ_FEED_ENDPOINT: 'https://feed.invalid/caseStudyFeed', ...over.env });
  const feed = createFeedStub(over.feed);
  const logs = [];
  const logger = { log: (m) => logs.push(m), error: (m) => logs.push(m) };
  // A clock the tests can move, so backoff is tested without waiting.
  const clock = { ms: Date.now() };
  const advance = (minutes) => { clock.ms += minutes * 60 * 1000; };
  const run = (extra = {}) => sync.runSync({ config, core, fetchImpl: feed.fetch, logger, resize: null, now: () => new Date(clock.ms), ...extra });
  const state = () => store.loadState(dir);
  const media = () => (existsSync(join(dir, 'media')) ? readdirSync(join(dir, 'media')).sort() : []);
  return { dir, config, feed, logs, run, state, media, advance };
}
const lists = (feed) => feed.requests.filter((r) => r.method === 'GET' && !new URL(r.url).searchParams.has('photo'));
const photosFetched = (feed) => feed.requests.filter((r) => new URL(r.url).searchParams.has('photo'));

await test('sync: off or without a key it makes no request', async () => {
  const t = setup({ env: { YTQ_CASE_STUDIES: '' } });
  const r = await t.run();
  eq([r.outcome, t.feed.requests.length], ['disabled', 0], 'nothing sent');
});

await test('sync: stores a valid record, its photos verified, and acknowledges it live with its URL', async () => {
  const t = setup();
  const { record, photos } = await fullRecord();
  t.feed.addRecord(record, photos);
  const r = await t.run();
  eq(r.outcome, 'ok', 'outcome');
  const list = new URL(lists(t.feed)[0].url);
  eq([list.searchParams.get('core'), list.searchParams.has('since')], ['1.0', false], 'first sync: core=1.0, no since');
  assert(t.feed.requests.every((q) => q.key === DUMMY_KEY && !q.url.includes(DUMMY_KEY)), 'key in the header on every call, never in a URL');
  eq(photosFetched(t.feed).map((q) => new URL(q.url).searchParams.get('id')), Array(6).fill(record.id), 'six photos fetched by ref and id');
  const entry = t.state().entries[record.id];
  eq([entry.kind, entry.version, entry.slug], ['live', 2, record.slug], 'stored live');
  eq(t.media().length, 6, 'six files');
  for (const photo of record.photos) {
    const file = entry.photos[photo.ref].file;
    eq(sha256(readFileSync(join(t.dir, 'media', file))), photo.sha256, `bytes of ${photo.ref}`);
    assert(!file.includes(photo.sha256), 'file name does not carry the whole hash');
  }
  eq(t.feed.acks, [{
    id: record.id, version: 2, state: 'live', url: `https://surreycontracting.co.uk/case-studies/${record.slug}`,
    site: { type: 'server', site_url: 'https://surreycontracting.co.uk/', refresh_url: 'https://surreycontracting.co.uk/api/ytq-refresh', plugin_version: '1.0.0', core_version: '1.0.0' },
  }], 'acknowledgement payload');
  eq(t.state().account, ACCOUNT, 'account recorded from the feed');
  assert(!t.logs.join('\n').includes(DUMMY_KEY), 'key never logged');
});

await test('sync: a re-served version fetches nothing and costs no acknowledgement once settled; an unsettled one is acknowledged again (M6, F1)', async () => {
  const t = setup();
  const { record, photos } = await fullRecord();
  t.feed.addRecord(record, photos);
  await t.run();
  const before = t.feed.requests.length;
  // A replay of the same page, as after a lost cursor.
  const s = t.state(); s.cursor = null; store.saveState(t.dir, s);
  await t.run();
  eq(photosFetched(t.feed).length, 6, 'no photo fetched again');
  eq(t.feed.acks.length, 1, 'settled: no second acknowledgement');
  eq(t.feed.requests.filter((q) => q.method === 'GET').length - (before - 1), 1, 'one list request');
  // An acknowledgement that was never settled (state from before this field) is owed again.
  const u = t.state(); u.cursor = null; delete u.ackSettled[record.id]; store.saveState(t.dir, u);
  await t.run();
  eq(t.feed.acks.length, 2, 'unsettled: acknowledged live again');
  eq(t.feed.acks[1], t.feed.acks[0], 'the same acknowledgement');
});

await test('sync: pages through has_more, sending the stored cursor', async () => {
  const t = setup({ feed: { pageSize: 1 } });
  const a = await minimalRecord({ id: 'cs_pageOne0001', slug: 'page-one-driveway' });
  const b = await minimalRecord({ id: 'cs_pageTwo0002', slug: 'page-two-driveway' });
  const c = await minimalRecord({ id: 'cs_pageThree03', slug: 'page-three-driveway' });
  t.feed.addRecord(a.record, a.photos);
  t.feed.addRecord(b.record, b.photos);
  t.feed.addRecord(c.record, c.photos);
  const r = await t.run();
  eq([r.outcome, r.pages], ['ok', 3], 'three pages');
  const sinces = lists(t.feed).map((q) => new URL(q.url).searchParams.get('since'));
  eq(sinces[0], null, 'first without since');
  assert(sinces[1] && sinces[2] && sinces[1] !== sinces[2], 'each page sends the cursor the last one returned');
  eq(Object.keys(t.state().entries).sort(), ['cs_pageOne0001', 'cs_pageThree03', 'cs_pageTwo0002'], 'all stored');
  // Next run starts from the stored cursor and finds nothing new.
  await t.run();
  eq(new URL(lists(t.feed).at(-1).url).searchParams.get('since'), t.state().cursor, 'stored cursor sent');
});

await test('sync: a held-back cursor (has_more false, cursor not past the held record) is kept and resent; a non-moving cursor never loops', async () => {
  const t = setup();
  const a = await minimalRecord({ id: 'cs_heldOne0001', slug: 'held-one-driveway' });
  const b = await minimalRecord({ id: 'cs_heldTwo0002', slug: 'held-two-driveway' });
  t.feed.addRecord(a.record, a.photos);
  t.feed.addRecord(b.record, b.photos);
  t.feed.addTombstone(tombstoneFor({ id: 'cs_goneElse0003', version: 1 }));
  t.feed.holdBackFrom = 2; // YTQ stops serving records from change 2 (account lapsed)
  const r = await t.run();
  eq([r.outcome, lists(t.feed).length], ['ok', 1], 'one request, no loop');
  const s = t.state();
  eq(Object.keys(s.entries).sort(), ['cs_goneElse0003', 'cs_heldOne0001'], 'first record and the later tombstone applied');
  const held = JSON.parse(Buffer.from(s.cursor, 'base64url').toString()).s;
  eq(held, 1, 'cursor held at the record before the one held back');
  t.feed.holdBackFrom = null; // serving resumes
  await t.run();
  eq(new URL(lists(t.feed).at(-1).url).searchParams.get('since'), s.cursor, 'held cursor resent');
  eq(t.state().entries.cs_heldTwo0002.kind, 'live', 'held record arrives once serving resumes');
  // A misbehaving feed that says has_more but never moves the cursor.
  const loop = setup();
  const fetchLoop = async () => new Response(JSON.stringify({ schema_version: 1, account: ACCOUNT, cursor: 'eyJ2IjoxLCJzIjowfQ', has_more: true, items: [] }), { status: 200 });
  loop.config.feedEndpoint = 'https://feed.invalid/caseStudyFeed';
  let calls = 0;
  await sync.runSync({ config: loop.config, core, fetchImpl: async (...a) => { calls++; return fetchLoop(...a); }, logger: { log() {}, error() {} } });
  assert(calls <= 2, `stopped after ${calls} list calls`);
});

await test('sync: a tombstone deletes the page entry, its photos and resized copies, keeps a marker and acknowledges removed', async () => {
  const t = setup();
  const { record, photos } = await fullRecord();
  t.feed.addRecord(record, photos);
  await t.run({ resize: sharpResizer });
  const entry = t.state().entries[record.id];
  assert(Object.values(entry.photos).some((p) => p.variants.length > 0), 'resized copies were made');
  assert(t.media().length > 6, 'photos and copies on disk');
  t.feed.addTombstone(tombstoneFor(record));
  await t.run();
  eq(t.state().entries[record.id], { kind: 'removed', id: record.id, version: 2, removed_at: '2026-11-12T08:30:00Z', slugs: [record.slug] }, 'marker');
  eq(t.media(), [], 'every photo and copy deleted');
  eq(t.feed.acks.at(-1), { id: record.id, version: 2, state: 'removed', site: sync.siteBlock(t.config, core) }, 'removed ack, no url');
  eq(render.lookupSlug(Object.values(t.state().entries), record.slug), { kind: 'gone' }, 'URL answers 410');
  eq(store.referencedFiles(t.state()).size, 0, 'nothing servable');
});

await test('sync: a replayed record after its tombstone does not bring the page back; a newer version does', async () => {
  const t = setup();
  const { record, photos } = await fullRecord();
  t.feed.addRecord(record, photos);
  t.feed.addTombstone(tombstoneFor(record));
  t.feed.addRecord(record, photos); // replay of version 2
  await t.run();
  eq(t.state().entries[record.id].kind, 'removed', 'still removed');
  eq(t.media(), [], 'no photos');
  const again = { ...record, version: 3, modified_at: '2026-11-13T10:00:00Z' };
  t.feed.addRecord(again, photos);
  await t.run();
  eq([t.state().entries[record.id].kind, t.state().entries[record.id].version], ['live', 3], 'republished as the next version');
});

await test('sync: a tombstone older than the live page does nothing', async () => {
  const t = setup();
  const { record, photos } = await fullRecord({ version: 3 });
  t.feed.addRecord(record, photos);
  t.feed.addTombstone(tombstoneFor({ id: record.id, version: 2 }));
  await t.run();
  eq(t.state().entries[record.id].kind, 'live', 'live');
  eq(t.feed.acks.map((a) => a.state), ['live'], 'no removed ack');
});

await test('sync: a record that fails validation is not stored, fetches no photo, and is acknowledged failed with the first code', async () => {
  const t = setup();
  const { record, photos } = await invalidRecord();
  const expected = core.assertPublishable(record);
  assert(!expected.valid, 'fixture is invalid');
  t.feed.addRecord(record, photos);
  const r = await t.run();
  eq(r.outcome, 'ok', 'feed moves on');
  eq(t.state().entries[record.id], undefined, 'not stored');
  eq(photosFetched(t.feed).length, 0, 'no photo fetched');
  eq(t.media(), [], 'no file');
  eq([t.feed.acks[0].state, t.feed.acks[0].error, t.feed.acks[0].url], ['failed', expected.errors[0].code, undefined], 'failed ack');
  assert(/^[a-z0-9_.]{1,64}$/.test(t.feed.acks[0].error), 'code in the shape YTQ accepts');
});

await test('sync: a record with a field the core does not know (strict records) is refused', async () => {
  const t = setup();
  const { record, photos } = await minimalRecord({ customer_name: 'Somebody' });
  t.feed.addRecord(record, photos);
  await t.run();
  eq(t.state().entries[record.id], undefined, 'not stored');
  eq(t.feed.acks[0].error, 'schema.additional_property', 'code');
});

await test('sync: a photo answering 410 (consent re-check) fails the record; nothing stored', async () => {
  const t = setup();
  const { record, photos } = await fullRecord();
  t.feed.addRecord(record, photos);
  t.feed.gone.add(`${record.id}/${record.photos[2].ref}`);
  await t.run();
  eq(t.state().entries[record.id], undefined, 'not stored');
  eq(t.media(), [], 'no photo left behind');
  eq([t.feed.acks[0].state, t.feed.acks[0].error], ['failed', 'photo.gone'], 'failed ack');
});

await test('sync: partial failure keeps the cursor; the next run finishes without refetching what is stored', async () => {
  const t = setup();
  const a = await minimalRecord({ id: 'cs_partialA001', slug: 'partial-a-driveway' });
  const b = await fullRecord();
  t.feed.addRecord(a.record, a.photos);
  t.feed.addRecord(b.record, b.photos);
  let broken = true;
  t.feed.fail = (kind, url) => (broken && kind === 'photo' && url.searchParams.get('id') === b.record.id && url.searchParams.get('photo') === b.record.photos[3].ref ? 503 : null);
  const first = await t.run();
  eq(first.outcome, 'partial', 'partial');
  eq(t.state().cursor, null, 'cursor not moved');
  eq(Object.keys(t.state().entries), ['cs_partialA001'], 'first record stored');
  eq(t.media().length, 1, 'only the first record\'s photo is public; staged photos of the second are not');
  eq(t.feed.acks.map((x) => `${x.id} ${x.state}`), ['cs_partialA001 live'], 'first acknowledged');
  broken = false;
  t.advance(1);
  const aPhotoFetches = photosFetched(t.feed).filter((q) => new URL(q.url).searchParams.get('id') === a.record.id).length;
  const second = await t.run();
  eq(second.outcome, 'ok', 'ok');
  eq(photosFetched(t.feed).filter((q) => new URL(q.url).searchParams.get('id') === a.record.id).length, aPhotoFetches, 'first record not refetched');
  eq(t.state().entries[b.record.id].kind, 'live', 'second stored');
  eq(t.feed.acks.filter((x) => x.id === b.record.id).map((x) => x.state), ['live'], 'second acknowledged live once');
  eq(t.feed.acks.filter((x) => x.state === 'failed'), [], 'no failed ack for a transient fault');
});

await test('sync: photo bytes that fail the sha256 are discarded; refused only after 3 mismatches in a row (M2)', async () => {
  const t = setup();
  const { record, photos } = await minimalRecord();
  t.feed.addRecord(record, photos);
  t.feed.fail = (kind) => (kind === 'photo' ? 'corrupt' : null);
  for (let i = 1; i < sync.MAX_HASH_MISMATCHES; i++) {
    const r = await t.run();
    eq(r.outcome, 'partial', `attempt ${i} partial`);
    eq(t.media(), [], 'mismatched bytes never public');
    eq(t.feed.acks, [], 'no ack yet');
    t.advance(120);
  }
  const last = await t.run();
  eq(last.outcome, 'ok', 'feed moves on');
  eq([t.feed.acks[0].state, t.feed.acks[0].error], ['failed', 'photo.hash_mismatch'], 'refused on evidence about the item');
});

for (const [label, fault] of [['E1: 503 (YTQ outage)', 503], ['E1b: 403 account_inactive', 403], ['404', 404], ['429', 429], ['network error', 'throw']]) {
  await test(`sync: ${label} on photos for many runs never refuses the item; it goes live when YTQ recovers (M2)`, async () => {
    const t = setup();
    const { record, photos } = await fullRecord();
    t.feed.addRecord(record, photos);
    const original = t.feed.fetch;
    let down = true;
    t.feed.fetch = async (input, init) => {
      const url = new URL(String(input));
      if (down && url.searchParams.has('photo')) {
        if (fault === 'throw') throw new TypeError('fetch failed');
        return new Response('{"error":"x"}', { status: fault });
      }
      return original(input, init);
    };
    for (let i = 0; i < 12; i++) {
      eq((await t.run({ fetchImpl: t.feed.fetch })).outcome, 'partial', `run ${i + 1} partial`);
      t.advance(61);
    }
    eq(t.state().failed[record.id], undefined, 'never written as failed');
    eq(t.feed.acks.filter((a) => a.state === 'failed'), [], 'no failed ack sent to YTQ');
    eq(t.state().cursor, null, 'cursor held');
    down = false;
    const r = await t.run({ fetchImpl: t.feed.fetch });
    eq(r.outcome, 'ok', 'recovered');
    eq([t.state().entries[record.id]?.kind, t.feed.acks.at(-1).state], ['live', 'live'], 'live and acknowledged');
  });
}

await test('sync: backoff after a transient fault is capped at 30 minutes and respected; no photo is fetched while it runs (M2, F7)', async () => {
  eq([1, 2, 3, 6, 7, 30].map((n) => sync.retryDelayMs(n) / 60000), [1, 2, 4, 30, 30, 30], 'delays in minutes');
  const t = setup();
  const { record, photos } = await minimalRecord();
  t.feed.addRecord(record, photos);
  t.feed.fail = (kind) => (kind === 'photo' ? 503 : null);
  await t.run();
  const fetched = photosFetched(t.feed).length;
  t.feed.fail = null;
  t.advance(0.5);
  eq((await t.run()).outcome, 'partial', 'still waiting');
  eq(photosFetched(t.feed).length, fetched, 'nothing fetched inside the backoff');
  t.advance(1);
  eq((await t.run()).outcome, 'ok', 'retried once the backoff passed');
});

await test('sync: an acknowledgement that cannot be delivered is kept and sent on the next run', async () => {
  const t = setup();
  const { record, photos } = await minimalRecord();
  t.feed.addRecord(record, photos);
  let down = true;
  t.feed.fail = (kind) => (kind === 'ack' && down ? 503 : null);
  await t.run();
  eq(t.feed.acks.length, 0, 'not delivered');
  eq(t.state().pendingAcks.map((a) => a.state), ['live'], 'kept');
  down = false;
  await t.run();
  eq(t.feed.acks.map((a) => a.state), ['live'], 'delivered');
  eq(t.state().pendingAcks, [], 'cleared');
});

for (const status of [401, 403]) {
  await test(`sync: an acknowledgement answered ${status} (key rotated, not yet on the server) is kept and sent later (M6)`, async () => {
    const t = setup();
    const { record, photos } = await minimalRecord();
    t.feed.addRecord(record, photos);
    let refusing = true;
    t.feed.fail = (kind) => (kind === 'ack' && refusing ? status : null);
    await t.run();
    eq(t.state().pendingAcks.map((a) => a.state), ['live'], 'kept');
    refusing = false;
    await t.run();
    eq(t.feed.acks.map((a) => [a.id, a.state]), [[record.id, 'live']], 'delivered');
    eq(t.state().pendingAcks, [], 'cleared');
  });
}

await test('sync: X2: an acknowledgement answered 422 is kept, and delivered once YTQ accepts it (F2)', async () => {
  const t = setup();
  const { record, photos } = await minimalRecord({ id: 'cs_ackLost00001', slug: 'ack-lost' });
  t.feed.addRecord(record, photos);
  t.feed.fail = (kind) => (kind === 'ack' ? 422 : null);
  await t.run();
  eq(t.state().pendingAcks.map((a) => a.state), ['live'], 'kept after 422');
  assert(t.logs.some((l) => l.includes('status 422, kept')), 'logged');
  t.feed.fail = null;
  for (let i = 0; i < 5; i++) { t.advance(60); await t.run(); }
  eq(t.feed.acks.map((a) => [a.id, a.state]), [[record.id, 'live']], 'YTQ received the live ack once');
  eq(t.state().pendingAcks, [], 'cleared');
});

await test('sync: a 422 acknowledgement is dropped with a log line after seven days (F2)', async () => {
  const t = setup();
  const { record, photos } = await minimalRecord();
  t.feed.addRecord(record, photos);
  t.feed.fail = (kind) => (kind === 'ack' ? 422 : null);
  await t.run();
  t.advance(6 * 24 * 60);
  await t.run();
  eq(t.state().pendingAcks.length, 1, 'still kept after six days');
  t.advance(24 * 60 + 1);
  await t.run();
  eq(t.state().pendingAcks, [], 'dropped after seven');
  assert(t.logs.some((l) => l.includes('dropped after 7 days of 422')), 'logged');
});

for (const status of [400, 404, 409]) {
  await test(`sync: an acknowledgement answered ${status} is dropped, not retried`, async () => {
    const t = setup();
    const { record, photos } = await minimalRecord();
    t.feed.addRecord(record, photos);
    t.feed.fail = (kind) => (kind === 'ack' ? status : null);
    await t.run();
    eq(t.state().pendingAcks, [], 'dropped');
    assert(t.logs.some((l) => l.includes(`status ${status}, not retried`)), 'logged');
    t.feed.fail = null;
    const s = t.state(); s.cursor = null; store.saveState(t.dir, s);
    await t.run();
    eq(t.feed.acks.length, 0, 'not resent when the record is served again');
  });
}

await test('sync: a newer version replaces the page at the same URL and deletes the replaced photo', async () => {
  const t = setup();
  const { record, photos } = await fullRecord();
  t.feed.addRecord(record, photos);
  await t.run();
  const oldFile = t.state().entries[record.id].photos[record.photos[5].ref].file;
  const next = await fullRecord({ version: 3, modified_at: '2026-11-14T09:00:00Z' });
  // Keep five photos' bytes, replace the sixth.
  next.record.photos = next.record.photos.map((p, i) => (i < 5 ? record.photos[i] : p));
  const nextPhotos = new Map(photos);
  nextPhotos.set(record.photos[5].ref, next.photos.get(record.photos[5].ref));
  t.feed.addRecord(next.record, nextPhotos);
  const before = photosFetched(t.feed).length;
  await t.run();
  eq(photosFetched(t.feed).length - before, 1, 'only the replaced photo fetched');
  const entry = t.state().entries[record.id];
  eq([entry.version, entry.slug], [3, record.slug], 'same URL');
  assert(!t.media().includes(oldFile), 'replaced file deleted');
  eq(t.media().length, 6, 'six files');
  eq(t.feed.acks.at(-1).url, `https://surreycontracting.co.uk/case-studies/${record.slug}`, 'acked at the same URL');
});

await test('sync: a slug change keeps the old URL as a redirect; a slug another case study holds is refused', async () => {
  const t = setup();
  const { record, photos } = await minimalRecord();
  t.feed.addRecord(record, photos);
  await t.run();
  const renamed = { ...record, version: record.version + 1, slug: 'block-paving-driveway-relaid-again', modified_at: '2026-10-30T16:25:00Z' };
  t.feed.addRecord(renamed, photos);
  await t.run();
  eq(render.lookupSlug(Object.values(t.state().entries), record.slug), { kind: 'moved', slug: renamed.slug }, 'old slug redirects');
  const other = await minimalRecord({ id: 'cs_otherCase001', slug: renamed.slug });
  t.feed.addRecord(other.record, other.photos);
  await t.run();
  eq(t.feed.acks.at(-1).error, 'site.slug_taken', 'refused');
});

await test('sync: a feed for a different account than the one stored applies nothing', async () => {
  const t = setup({ env: { YTQ_ACCOUNT_ID: 'uid_expected_other' } });
  const { record, photos } = await minimalRecord();
  t.feed.addRecord(record, photos);
  const r = await t.run();
  eq([r.outcome, Object.keys(t.state().entries).length], ['account_mismatch', 0], 'nothing applied');
});

await test('sync: a 401 from the feed is reported and changes nothing', async () => {
  const t = setup({ env: { YTQ_SECRET_KEY: 'wrong-dummy-key' } });
  const r = await t.run();
  eq([r.outcome, r.status], ['unauthorized', 401], 'unauthorized');
});

await test('store: the lock stops a second run at the same time', async () => {
  const t = setup();
  const release = store.acquireLock(t.dir);
  assert(release, 'locked');
  eq((await t.run()).outcome, 'busy', 'busy');
  release();
});

// ---------- rendering ----------

const entryFor = async (rec) => {
  const t = setup();
  t.feed.addRecord(rec.record, rec.photos);
  await t.run();
  return { entry: t.state().entries[rec.record.id], t };
};

await test('render: month in words, paragraphs from LF, CR LF and CR', () => {
  eq(render.monthInWords('2026-10'), 'October 2026', 'month');
  eq(render.paragraphs('One.\r\nTwo.\rThree.\n\n\tFour.'), ['One.', 'Two.', 'Three.', 'Four.'], 'paragraphs');
});

await test('render: the first pair takes the top slot, the hero moves to the gallery, further pairs follow', async () => {
  const { entry } = await entryFor(await fullRecord());
  const layout = render.pageLayout(entry);
  eq(layout.top.kind, 'pair', 'pair on top');
  eq([layout.top.pair.before.alt, layout.top.pair.after.alt], ['Old fence panels leaning after the storm', 'The same boundary with new closeboard bays'], 'pair 1, before first');
  eq(layout.pairs.map((p) => p.number), [2], 'pair 2 below');
  eq(layout.gallery.map((g) => g.role), ['hero', 'other'], 'hero and other in the gallery, by order');
  eq(render.metaLine(entry.record), { service: 'Garden fencing', town: 'Hersham', month: 'October 2026' }, 'meta line');
});

await test('render: with no pair the hero takes the top slot; a hidden town is not shown', async () => {
  const { entry } = await entryFor(await minimalRecord());
  const layout = render.pageLayout(entry);
  eq([layout.top.kind, layout.gallery.length, layout.pairs.length], ['hero', 0, 0], 'hero on top');
  eq(render.metaLine(entry.record).town, null, 'town hidden');
});

await test('render: srcset offers the resized widths and never upscales', async () => {
  const t = setup();
  const rec = await fullRecord();
  t.feed.addRecord(rec.record, rec.photos);
  await t.run({ resize: sharpResizer });
  const entry = t.state().entries[rec.record.id];
  const hero = render.imageView(rec.record.photos[0], entry.photos[rec.record.photos[0].ref]);
  eq(hero.srcset.split(', ').map((s) => s.split(' ')[1]), ['480w', '800w', '1200w', '1600w'], 'hero 1600 wide: 480, 800, 1200 and itself');
  const tall = render.imageView(rec.record.photos[3], entry.photos[rec.record.photos[3].ref]);
  eq(tall.srcset.split(', ').map((s) => s.split(' ')[1]), ['480w', '800w', '1200w'], '1200 wide: no upscale');
  eq([hero.width, hero.height], [1600, 1200], 'dimensions from the record');
});

await test('render: listing is newest first, with a service filter only above six case studies', async () => {
  const base = (await entryFor(await minimalRecord())).entry;
  const make = (i, service) => ({
    ...base, id: `cs_list${i}xxxxx`, slug: `listing-${i}`,
    record: { ...base.record, id: `cs_list${i}xxxxx`, slug: `listing-${i}`, service_category: service, published_at: `2026-10-0${i}T10:00:00Z` },
  });
  const six = [1, 2, 3, 4, 5, 6].map((i) => make(i, i % 2 ? 'Driveways' : 'Drainage'));
  const v6 = render.listingView(six, 'Drainage');
  eq([v6.filters, v6.cards.length, v6.cards[0].slug], [null, 6, 'listing-6'], 'six: no filter, newest first');
  const seven = [...six, make(7, 'Groundworks')];
  const v7 = render.listingView(seven, 'Drainage');
  eq(v7.filters.map((f) => [f.service, f.current]), [['Drainage', true], ['Driveways', false], ['Groundworks', false]], 'seven: filter');
  eq(v7.cards.map((c) => c.slug), ['listing-6', 'listing-4', 'listing-2'], 'filtered');
  eq(render.listingView(seven, 'Nonsense').cards.length, 7, 'unknown filter shows all');
});

await test('render: JSON-LD from the vendored builder with the site context; nothing private in it', async () => {
  const full = await fullRecord();
  const { entry, t } = await entryFor(full);
  const tag = entry.jsonLd;
  eq(tag, core.buildJsonLdScriptTag(full.record, siteContext(entry.slug, entry.photos, t.config)), 'stored JSON-LD is exactly the builder output for the full record');
  assert(tag.startsWith('<script type="application/ld+json">'), 'script tag');
  const graph = JSON.parse(tag.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
  const business = graph['@graph'][1];
  eq([business['@id'], business['@type'], business.address.postalCode], ['https://surreycontracting.co.uk/#business', 'HomeAndConstructionBusiness', 'GU23 7EF'], 'the business is Surrey Contracting, the same @id as BaseLayout');
  eq(graph['@graph'][0].url, `https://surreycontracting.co.uk/case-studies/${entry.slug}`, 'page url');
  for (const bad of ['withheld', 'consent', entry.record.id, 'confirmed', ...full.record.photos.map((p) => p.sha256)]) {
    assert(!tag.includes(bad), `JSON-LD must not contain ${bad.slice(0, 20)}`);
  }
});

await test('render: the business details match the LocalBusiness block BaseLayout already publishes', () => {
  const layout = readFileSync(join(ROOT, 'src', 'layouts', 'BaseLayout.astro'), 'utf8');
  for (const value of [BUSINESS.name, BUSINESS.type, BUSINESS.address.street_address, BUSINESS.address.locality, BUSINESS.address.region, BUSINESS.address.postal_code]) {
    assert(layout.includes(`'${value}'`), `BaseLayout carries ${value}`);
  }
  assert(layout.includes(`logo: \`\${SITE}${BUSINESS.logoPath}\``), 'same logo');
  assert(layout.includes("'@id': `${SITE}/#business`"), 'same @id');
});

// ---------- review round: M5, data minimisation, ids, start-up tidy ----------

await test('sync: no call carrying the key follows a redirect to another origin (M5)', async () => {
  const http = await import('node:http');
  const seen = [];
  const other = http.createServer((req, res) => { seen.push(req.headers['x-ytq-api-key'] || '(none)'); res.end('{}'); });
  await new Promise((r) => other.listen(0, '127.0.0.1', r));
  const target = `http://127.0.0.1:${other.address().port}/elsewhere`;
  const feedSrv = http.createServer((req, res) => { res.writeHead(302, { location: target }); res.end(); });
  await new Promise((r) => feedSrv.listen(0, '127.0.0.1', r));
  try {
    const dir = mkdtempSync(join(tmpdir(), 'ytq-cs-'));
    tmpDirs.push(dir);
    const config = readConfig({ YTQ_CASE_STUDIES: 'on', YTQ_SECRET_KEY: DUMMY_KEY, YTQ_CASE_STUDY_DIR: dir, YTQ_FEED_ENDPOINT: `http://127.0.0.1:${feedSrv.address().port}/caseStudyFeed` });
    const s = store.emptyState();
    s.pendingAcks.push({ id: 'cs_redirect0001', version: 1, state: 'removed' });
    store.saveState(dir, s);
    const r = await sync.runSync({ config, core, logger: { log() {}, error() {} } });
    eq(r.outcome, 'feed_error', 'list refused');
    eq(seen, [], 'the other origin received nothing (list and ack)');
    eq(store.loadState(dir).pendingAcks.length, 1, 'ack kept for later');
  } finally {
    other.close();
    feedSrv.close();
  }
});

await test('store: state.json keeps only what a page shows: no consent, ticks, hashes, social or hidden town', async () => {
  const t = setup();
  const full = await fullRecord();
  const minimal = await minimalRecord();
  t.feed.addRecord(full.record, full.photos);
  t.feed.addRecord(minimal.record, minimal.photos);
  await t.run();
  const text = readFileSync(join(t.dir, 'state.json'), 'utf8');
  const entriesText = JSON.stringify(t.state().entries, (k, v) => (k === 'jsonLd' ? undefined : v));
  for (const bad of ['consent', 'withheld', 'confirmed', 'wording_version', 'customer_permission', 'social', 'caption":"A storm', 'source', ...full.record.photos.map((p) => p.sha256)]) {
    assert(!text.includes(bad), `state.json contains ${bad.slice(0, 24)}`);
  }
  assert(!entriesText.includes(minimal.record.location.town), 'a hidden town is not stored');
  eq(t.state().entries[minimal.record.id].record.location, { show_town: false }, 'location without the town');
});

await test('store: id-keyed maps have no prototype, so ids like "constructor" are ordinary keys (E2)', async () => {
  const t = setup();
  const s = t.state();
  for (const map of [s.entries, s.failed, s.retries]) eq(Object.getPrototypeOf(map), null, 'null prototype');
  eq('constructor' in s.entries, false, 'nothing inherited');
  eq(sync.recordDecision(s, 'constructor', 1), 'store', 'decision');
  const { record, photos } = await minimalRecord({ id: 'constructor' });
  t.feed.addRecord(record, photos);
  t.feed.addTombstone(tombstoneFor({ id: 'toString', version: 1 }));
  await t.run();
  eq(Object.keys(t.state().entries).sort(), ['constructor', 'toString'], 'both stored as plain ids');
  eq(Object.getPrototypeOf(t.state().entries), null, 'still null after a reload');
});

await test('store: at start a stale lock and stale temporary files are removed', async () => {
  const t = setup();
  const { writeFileSync } = await import('node:fs');
  store.saveState(t.dir, store.emptyState());
  writeFileSync(join(t.dir, 'sync.lock'), '1');
  writeFileSync(join(t.dir, 'state.json.1.1700000000000.tmp'), '{');
  eq((await t.run()).outcome, 'busy', 'a stale lock blocks a run');
  eq(store.cleanUpAtStart(t.dir), { lock: true, tmp: 1 }, 'cleaned');
  eq(readdirSync(t.dir).sort(), ['state.json'], 'only the state left');
  eq((await t.run()).outcome, 'ok', 'runs again');
});

await test('pages read nothing while the kit is switched off; the store is kept (M3)', async () => {
  const t = setup();
  const { record, photos } = await minimalRecord();
  t.feed.addRecord(record, photos);
  await t.run();
  eq(store.liveEntries(store.readPublishedState(t.config)).length, 1, 'on: published');
  for (const env of [{ YTQ_CASE_STUDIES: '' }, { YTQ_SECRET_KEY: '' }]) {
    const off = readConfig({ YTQ_CASE_STUDIES: 'on', YTQ_SECRET_KEY: DUMMY_KEY, YTQ_CASE_STUDY_DIR: t.dir, ...env });
    eq(store.liveEntries(store.readPublishedState(off)).length, 0, 'off: nothing published');
  }
  eq(store.liveEntries(t.state()).length, 1, 'store kept on disk');
});

// ---------- second review round (Fable): F1 to F9 ----------

for (const pageSize of [25, 1]) {
  await test(`sync: X1 (page size ${pageSize}): a tombstone behind a record that cannot be stored is applied at once; the stuck record is retried and later stored (F1)`, async () => {
    const t = setup({ feed: { pageSize } });
    const b = await minimalRecord({ id: 'cs_withdrawn0001', slug: 'withdrawn-job' });
    t.feed.addRecord(b.record, b.photos);
    await t.run();
    const cursorBefore = t.state().cursor;
    const a = await minimalRecord({ id: 'cs_stuckRec0002', slug: 'stuck-job' });
    const c = await minimalRecord({ id: 'cs_afterRec0003', slug: 'after-job' });
    t.feed.addRecord(a.record, a.photos);
    t.feed.addTombstone(tombstoneFor({ id: b.record.id, version: 1 }));
    t.feed.addRecord(c.record, c.photos);
    let stuck = true;
    t.feed.fail = (kind, url) => (stuck && kind === 'photo' && url.searchParams.get('id') === a.record.id ? 503 : null);
    const first = await t.run();
    eq(first.outcome, 'partial', 'partial');
    const s1 = t.state();
    eq([s1.entries[b.record.id].kind, s1.entries[c.record.id]?.kind, s1.entries[a.record.id]], ['removed', 'live', undefined], 'tombstone and the later record applied on the first run');
    eq(s1.cursor, cursorBefore, 'cursor held just before the page with the stuck record');
    eq(t.feed.acks.filter((x) => x.state === 'removed').length, 1, 'removed acknowledged');
    for (let i = 0; i < 10; i++) { t.advance(60); await t.run(); }
    eq(t.feed.acks.filter((x) => x.state === 'removed').length, 1, 'no repeated removed ack (F6)');
    eq(t.feed.acks.filter((x) => x.id === c.record.id).length, 1, 'no repeated live ack for the later record');
    eq(t.feed.acks.filter((x) => x.state === 'failed'), [], 'no failed ack');
    stuck = false;
    t.advance(60);
    eq((await t.run()).outcome, 'ok', 'ok once the photo arrives');
    const s2 = t.state();
    eq(s2.entries[a.record.id].kind, 'live', 'stuck record stored');
    assert(s2.cursor !== cursorBefore, 'cursor moves on');
    eq(s2.retries, {}, 'retry entry cleared');
    eq(t.feed.acks.map((x) => `${x.id} ${x.state}`).sort(), [`${a.record.id} live`, `${b.record.id} live`, `${b.record.id} removed`, `${c.record.id} live`].sort(), 'each acknowledged once');
  });
}

await test('sync: X3: a photo over the 16 MB cap is refused as photo.too_large; the record after it is stored (F1)', async () => {
  const t = setup();
  const a = await minimalRecord({ id: 'cs_bigPhoto0001', slug: 'big-photo' });
  const c = await minimalRecord({ id: 'cs_afterBig0002', slug: 'after-big' });
  t.feed.addRecord(a.record, a.photos);
  t.feed.addRecord(c.record, c.photos);
  const inner = t.feed.fetch;
  const fetchImpl = async (u, i) => {
    const url = new URL(String(u));
    if (url.searchParams.has('photo') && url.searchParams.get('id') === a.record.id) {
      return new Response('x', { status: 200, headers: { 'content-type': 'image/jpeg', 'content-length': String(17 * 1024 * 1024) } });
    }
    return inner(u, i);
  };
  eq((await t.run({ fetchImpl })).outcome, 'ok', 'ok');
  eq([t.state().failed[a.record.id]?.error, t.state().entries[c.record.id]?.kind], ['photo.too_large', 'live'], 'refused, next stored');
  eq(t.feed.acks.filter((x) => x.state === 'failed').map((x) => x.error), ['photo.too_large'], 'failed ack with the code');
  // Without a content-length, the bytes themselves are measured.
  const t2 = setup();
  const d = await minimalRecord({ id: 'cs_bigPhoto0003', slug: 'big-photo-two' });
  t2.feed.addRecord(d.record, d.photos);
  const big = Buffer.alloc(16 * 1024 * 1024 + 1);
  const fetch2 = async (u, i) => (new URL(String(u)).searchParams.has('photo')
    ? new Response(new ReadableStream({ start(cn) { cn.enqueue(big); cn.close(); } }), { status: 200, headers: { 'content-type': 'image/jpeg' } })
    : t2.feed.fetch(u, i));
  await t2.run({ fetchImpl: fetch2 });
  eq(t2.state().failed[d.record.id]?.error, 'photo.too_large', 'measured');
});

await test('sync: a full disk while staging a record does not hold up the tombstone behind it; the record is stored once space returns (F1)', async () => {
  const t = setup();
  const b = await minimalRecord({ id: 'cs_withdrawn0009', slug: 'withdrawn-nine' });
  t.feed.addRecord(b.record, b.photos);
  await t.run();
  const a = await minimalRecord({ id: 'cs_diskFull00001', slug: 'disk-full' });
  t.feed.addRecord(a.record, a.photos);
  t.feed.addTombstone(tombstoneFor(b.record));
  let full = true;
  const { writeFileSync } = await import('node:fs');
  const writeFile = (path, bytes) => {
    if (full) { const e = new Error('no space left on device'); e.code = 'ENOSPC'; throw e; }
    writeFileSync(path, bytes);
  };
  eq((await t.run({ writeFile })).outcome, 'partial', 'partial');
  eq(t.state().entries[b.record.id].kind, 'removed', 'tombstone applied');
  eq(t.media().length, 0, 'the removed page\'s photo is deleted');
  assert(t.logs.some((l) => l.includes('(ENOSPC)')), 'the reason is logged');
  eq(t.feed.acks.filter((x) => x.state === 'failed'), [], 'no failed ack for a full disk');
  full = false;
  t.advance(2);
  eq((await t.run({ writeFile })).outcome, 'ok', 'ok');
  eq(t.state().entries[a.record.id].kind, 'live', 'stored');
});

await test('store: X6: a retry entry superseded by a newer version or a tombstone is dropped (F5)', async () => {
  const t = setup();
  const a = await minimalRecord({ id: 'cs_superSed0001', slug: 'superseded' });
  t.feed.addRecord(a.record, a.photos);
  t.feed.fail = (kind) => (kind === 'photo' ? 503 : null);
  await t.run();
  eq(Object.keys(t.state().retries), [`${a.record.id}@1`], 'backing off');
  t.feed.fail = null;
  t.feed.addRecord({ ...a.record, version: 2, modified_at: '2026-10-01T10:00:00Z' }, a.photos);
  await t.run();
  eq([t.state().entries[a.record.id].version, Object.keys(t.state().retries)], [2, []], 'superseded by version 2');
  const t2 = setup();
  const b = await minimalRecord({ id: 'cs_superSed0002', slug: 'superseded-two' });
  t2.feed.addRecord(b.record, b.photos);
  t2.feed.fail = (kind) => (kind === 'photo' ? 503 : null);
  t2.feed.addTombstone(tombstoneFor(b.record));
  await t2.run();
  eq(Object.keys(t2.state().retries), [], 'superseded by the tombstone');
});

await test('sync: X5: a tombstone the feed keeps serving is acknowledged once (F6)', async () => {
  const t = setup();
  const a = await minimalRecord({ id: 'cs_liveFirst001', slug: 'live-first' });
  t.feed.addRecord(a.record, a.photos);
  await t.run();
  t.feed.addRecord(await (async () => (await minimalRecord({ id: 'cs_heldBack0002', slug: 'held-back' })).record)(), new Map());
  t.feed.addTombstone(tombstoneFor({ id: a.record.id, version: 1 }));
  t.feed.holdBackFrom = 2;
  for (let i = 0; i < 24; i++) { await t.run(); t.advance(60); }
  eq(t.state().entries[a.record.id].kind, 'removed', 'removed');
  eq(t.feed.acks.filter((x) => x.state === 'removed').length, 1, 'one removed ack in 24 polls');
});

await test('sync: an unwritable store is reported with its reason, never thrown (F9)', async () => {
  const { writeFileSync } = await import('node:fs');
  const parent = mkdtempSync(join(tmpdir(), 'ytq-cs-'));
  tmpDirs.push(parent);
  const asFile = join(parent, 'not-a-dir');
  writeFileSync(asFile, 'x');
  const config = readConfig({ YTQ_CASE_STUDIES: 'on', YTQ_SECRET_KEY: DUMMY_KEY, YTQ_CASE_STUDY_DIR: join(asFile, 'store'), YTQ_FEED_ENDPOINT: 'https://feed.invalid/caseStudyFeed' });
  const logs = [];
  const r = await sync.runSync({ config, core, fetchImpl: createFeedStub().fetch, logger: { log: (m) => logs.push(m), error: (m) => logs.push(m) } });
  eq(r.outcome, 'storage_error', 'outcome');
  assert(logs.some((l) => /could not take its lock .*: (ENOTDIR|EEXIST)/.test(l)), `reason logged: ${logs.join(' | ')}`);
});

await test('pages are held until a sync has read the feed within the last three poll intervals (F3)', async () => {
  const t = setup();
  const { record, photos } = await minimalRecord();
  t.feed.addRecord(record, photos);
  const s0 = store.emptyState(); store.saveState(t.dir, s0);
  eq(store.liveEntries(store.readPublishedState(t.config)).length, 0, 'no successful sync yet: held');
  await t.run();
  const okAt = Date.parse(t.state().lastOkAt);
  eq(store.liveEntries(store.readPublishedState(t.config, okAt + 1000)).length, 1, 'just synced: published');
  eq(store.liveEntries(store.readPublishedState(t.config, okAt + 3 * 60 * 60 * 1000)).length, 1, 'three intervals: still published');
  eq(store.liveEntries(store.readPublishedState(t.config, okAt + 3 * 60 * 60 * 1000 + 1)).length, 0, 'past three intervals: held');
  // A failing sync (401) does not renew it.
  const bad = readConfig({ YTQ_CASE_STUDIES: 'on', YTQ_SECRET_KEY: 'wrong-dummy-key', YTQ_CASE_STUDY_DIR: t.dir, YTQ_FEED_ENDPOINT: 'https://feed.invalid/caseStudyFeed' });
  t.advance(120);
  eq((await sync.runSync({ config: bad, core, fetchImpl: t.feed.fetch, logger: { log() {}, error() {} }, now: () => new Date(okAt + 120 * 60000) })).outcome, 'unauthorized', '401');
  eq(Date.parse(t.state().lastOkAt), okAt, 'lastOkAt unchanged by a failed sync');
});

await test('package.json requires Node 22.18 or later (type stripping, F4)', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  eq(pkg.engines.node, '>=22.18.0', 'engines');
  const server = readFileSync(join(ROOT, 'server.mjs'), 'utf8');
  assert(/poller did not start: \$\{/.test(server), 'server.mjs logs why the poller did not start');
});

for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
