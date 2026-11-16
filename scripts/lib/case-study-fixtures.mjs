/**
 * Shared fixtures for the YourTradeQuotes case-study tests: feed records built
 * from Case Study Core's own golden feed projection (vendor/caseStudyCore/
 * fixtures/valid-full.feed.json and valid-minimal.json), with real JPEG bytes
 * so the sha256 and the resizing are exercised for real, and a stub of YTQ's
 * caseStudyFeed that answers as functions/caseStudyPublishing.js does
 * (list pages, photo bytes with 410 when withdrawn, acknowledgements).
 *
 * No network: the stub is a function passed as fetchImpl, or a node:http
 * server on 127.0.0.1 for the end-to-end test.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..');
const require = createRequire(import.meta.url);
export const core = require(join(ROOT, 'vendor', 'caseStudyCore', 'js', 'index.js'));
const fixtureDir = join(ROOT, 'vendor', 'caseStudyCore', 'fixtures');
const readJson = (name) => JSON.parse(readFileSync(join(fixtureDir, name), 'utf8'));

/** A dummy key: never a real one, never shaped like ytq_live_. */
export const DUMMY_KEY = 'dummy-secret-for-tests-only';
export const ACCOUNT = 'uid_test_account';
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const colours = ['#8a6408', '#545454', '#e6a91a', '#2e2e2e', '#7a7a7a', '#b5b5b5', '#3f3f3f', '#d0d0d0'];
let colourIndex = 0;
export async function jpeg(width, height) {
  const background = colours[colourIndex++ % colours.length];
  return sharp({ create: { width, height, channels: 3, background } }).jpeg({ quality: 70 }).toBuffer();
}

/** Gives every photo of a record real bytes; returns { record, photos: Map(ref -> bytes) }. */
export async function withRealPhotos(record) {
  const copy = JSON.parse(JSON.stringify(record));
  const photos = new Map();
  for (const photo of copy.photos) {
    const bytes = await jpeg(photo.width, photo.height);
    photo.sha256 = sha256(bytes);
    photos.set(photo.ref, bytes);
  }
  return { record: copy, photos };
}

/** The golden feed projection of valid-full (two pairs, hero, other, FAQs, town shown). */
export async function fullRecord(overrides = {}) {
  const base = { ...readJson('valid-full.feed.json'), ...overrides };
  return withRealPhotos(base);
}

/** valid-minimal projected (one hero, town hidden, no FAQs). */
export async function minimalRecord(overrides = {}) {
  const projected = core.feedProjection(readJson('valid-minimal.json').record);
  return withRealPhotos({ ...projected, ...overrides });
}

/** A record the core refuses: a postcode in the text (privacy.postcode). */
export async function invalidRecord() {
  const { record, photos } = await fullRecord({ id: 'cs_badRecord01x', slug: 'bad-record-test-page' });
  record.sections[0].answer = 'A storm brought the fence down at the house in KT12 4AB and the customer wanted it replaced.';
  return { record, photos };
}

export const tombstoneFor = (record, removedAt = '2026-11-12T08:30:00Z') => ({
  id: record.id, removed: true, version: record.version, removed_at: removedAt,
});

const cursorFor = (seq) => Buffer.from(JSON.stringify({ v: 1, s: seq })).toString('base64url');

/**
 * A stub of YTQ's caseStudyFeed. `changes` is the account's change log, in
 * order: { item } where item is a record or a tombstone. Pages of `pageSize`,
 * cursor and has_more as buildFeedPage computes them. `photos` maps
 * `${id}/${ref}` to bytes; `gone` is a set of `${id}/${ref}` answering 410.
 */
export function createFeedStub({ pageSize = 25 } = {}) {
  const stub = {
    changes: [],
    photos: new Map(),
    gone: new Set(),
    requests: [],
    acks: [],
    /** null, or a function(kind, url, n) returning a status to force. */
    fail: null,
    holdBackFrom: null,
    pageSize,
    addRecord(record, photos) {
      stub.changes.push({ item: { record } });
      for (const [ref, bytes] of photos) stub.photos.set(`${record.id}/${ref}`, bytes);
    },
    addTombstone(t) {
      stub.changes.push({ item: t });
    },
  };
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  stub.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method || 'GET';
    const headers = new Headers(init.headers || {});
    const body = typeof init.body === 'string' ? init.body : undefined;
    stub.requests.push({ method, url: url.toString(), key: headers.get('x-ytq-api-key'), body });
    const n = stub.requests.length;
    if (headers.get('x-ytq-api-key') !== DUMMY_KEY) return json(401, { error: 'unauthorized' });
    for (const name of ['apiKey', 'api_key', 'key', 'x-ytq-api-key']) if (url.searchParams.has(name)) return json(400, { error: 'key_in_url' });
    if (method === 'POST') {
      const forced = stub.fail && stub.fail('ack', url, n);
      if (forced) return json(forced, { error: 'forced' });
      stub.acks.push(JSON.parse(body));
      return json(200, { ok: true });
    }
    if (url.searchParams.has('photo')) {
      const key = `${url.searchParams.get('id')}/${url.searchParams.get('photo')}`;
      const forced = stub.fail && stub.fail('photo', url, n);
      if (forced === 'corrupt') return new Response(Buffer.from('not the photo'), { status: 200, headers: { 'content-type': 'image/jpeg' } });
      if (forced) return json(forced, { error: 'forced' });
      if (stub.gone.has(key)) return json(410, { error: 'gone' });
      const bytes = stub.photos.get(key);
      if (!bytes) return json(404, { error: 'not_found' });
      return new Response(bytes, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    }
    const forced = stub.fail && stub.fail('list', url, n);
    if (forced) return json(forced, { error: 'forced' });
    const since = url.searchParams.get('since');
    const seq = since ? JSON.parse(Buffer.from(since, 'base64url').toString('utf8')).s : 0;
    const items = [];
    let last = seq;
    let heldBack = null;
    for (let i = seq; i < stub.changes.length && items.length < stub.pageSize; i++) {
      last = i + 1;
      if (stub.holdBackFrom !== null && i + 1 >= stub.holdBackFrom && stub.changes[i].item.record) {
        if (heldBack === null) heldBack = i + 1;
        continue;
      }
      items.push(stub.changes[i].item);
    }
    const cursorSeq = heldBack === null ? last : Math.min(last, heldBack - 1);
    const hasMore = heldBack === null && stub.changes.length > last;
    return json(200, { schema_version: 1, core_version: '1.0.0', account: ACCOUNT, cursor: cursorFor(cursorSeq), has_more: hasMore, items });
  };
  return stub;
}
