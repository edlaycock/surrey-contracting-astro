#!/usr/bin/env node
/**
 * Tests for the server-side YourTradeQuotes relay (src/lib/ytqRelay.ts) and
 * its use in /api/contact (src/pages/api/contact.ts). Run: npm run test:ytq-relay
 *
 * Everything runs against local node:http stubs on 127.0.0.1. Global fetch is
 * wrapped so any request to a host other than 127.0.0.1 throws: no request can
 * reach YourTradeQuotes, SMTP2GO or the live site. The keys used here are
 * dummies and never look like real ones.
 *
 * Imports the .ts files directly, using Node's built-in type stripping
 * (Node 22.18 or later; .nvmrc and the Dockerfile pin 22).
 */
import http from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// ---------- loopback-only network guard ----------
const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname !== '127.0.0.1') throw new Error(`blocked non-loopback fetch to ${url.hostname}`);
  return realFetch(input, init);
};

const { buildYtqPayload, campaignFromPage, forwardToYtq, YTQ_DEFAULT_ENDPOINT } = await import('../src/lib/ytqRelay.ts');

const DUMMY_KEY = 'dummy-secret-for-tests-only';
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
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}: expected ${e}, got ${a}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- stub server ----------
// handler(req, res, n) answers the n-th request (1-based); every request is recorded.
function startStub() {
  const stub = { requests: [], handler: (req, res) => res.end('{}'), sockets: new Set() };
  stub.server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      stub.requests.push({ method: req.method, url: req.url, headers: req.headers, body });
      stub.handler(req, res, stub.requests.length);
    });
  });
  stub.server.on('connection', (s) => {
    stub.sockets.add(s);
    s.on('close', () => stub.sockets.delete(s));
  });
  return new Promise((resolve) =>
    stub.server.listen(0, '127.0.0.1', () => {
      stub.url = `http://127.0.0.1:${stub.server.address().port}/submitEnquiry`;
      stub.reset = (handler) => {
        stub.requests = [];
        stub.handler = handler;
      };
      stub.close = () => {
        for (const s of stub.sockets) s.destroy();
        return new Promise((r) => stub.server.close(r));
      };
      resolve(stub);
    }),
  );
}
const reply = (status, body = {}, headers = {}) => (req, res) => {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
};
function captureLogger() {
  const lines = [];
  return { lines, log: (m) => lines.push(String(m)), error: (m) => lines.push(String(m)) };
}
const fast = { backoffMs: [10, 10, 10], timeoutMs: 1000 };

const ytq = await startStub();

// ---------- payload mapping ----------
await test('buildYtqPayload maps every field and never carries _honeypot', () => {
  const p = buildYtqPayload({
    name: ' Jane Smith ', email: 'jane@example.com', phone: '07700 900123', postcode: 'KT12 1AA',
    message: 'Strip out and demolition', company: 'Acme Ltd', svc: ['Demolition', 'Groundworks'],
    source: 'Google', page: '/lp/demolition?gclid=abc', leadSource: 'lp_demolition', _honeypot: 'bot',
  });
  eq(p, {
    source: 'Website', name: 'Jane Smith', email: 'jane@example.com', phone: '07700 900123',
    postcode: 'KT12 1AA', message: 'Strip out and demolition', services: 'Demolition, Groundworks',
    company: 'Acme Ltd', heardVia: 'Google', sourcePage: '/lp/demolition?gclid=abc', sourceCampaign: 'lp_demolition',
  }, 'payload');
  assert(!('_honeypot' in p), '_honeypot must never be sent');
});

await test('buildYtqPayload omits empty fields and keeps source as Website', () => {
  const p = buildYtqPayload({ name: 'A', email: 'a@b.co', phone: '', company: '  ', svc: [], source: '', page: '/' });
  eq(p, { source: 'Website', name: 'A', email: 'a@b.co', sourcePage: '/', sourceCampaign: 'homepage' }, 'payload');
});

await test('campaign falls back to homepage, contact or a path-derived label', () => {
  eq(campaignFromPage('/'), 'homepage', '/');
  eq(campaignFromPage(''), 'homepage', 'empty');
  eq(campaignFromPage('/?utm_source=google'), 'homepage', '/ with query');
  eq(campaignFromPage('/contact'), 'contact', '/contact');
  eq(campaignFromPage('https://surreycontracting.co.uk/contact/'), 'contact', 'referer form');
  eq(campaignFromPage('/lp/groundworks-2?gclid=x'), 'lp_groundworks_2', 'lp path');
  eq(campaignFromPage('/services/demolition'), 'services_demolition', 'other path');
});

// ---------- forwardToYtq ----------
await test('no key: one log line and no request', async () => {
  ytq.reset(reply(200, { success: true, id: 'x' }));
  const logger = captureLogger();
  const r = await forwardToYtq({ source: 'Website', name: 'A' }, { endpoint: ytq.url, logger });
  await sleep(50);
  eq(ytq.requests.length, 0, 'requests');
  eq(r, { delivered: false, skipped: true, attempts: 0 }, 'result');
  eq(logger.lines, ['YTQ relay skipped: YTQ_SECRET_KEY not set'], 'log');
});

await test('posts JSON with x-ytq-api-key and an Idempotency-Key, and no Origin or Referer', async () => {
  ytq.reset(reply(200, { success: true, id: 'enq1' }));
  const logger = captureLogger();
  const payload = buildYtqPayload({ name: 'Jane', email: 'j@example.com', page: '/contact' });
  const r = await forwardToYtq(payload, { key: DUMMY_KEY, endpoint: ytq.url, logger, ...fast });
  eq(r, { delivered: true, status: 200, attempts: 1 }, 'result');
  eq(ytq.requests.length, 1, 'requests');
  const q = ytq.requests[0];
  eq(q.method, 'POST', 'method');
  eq(q.headers['content-type'], 'application/json', 'content-type');
  eq(q.headers['x-ytq-api-key'], DUMMY_KEY, 'key header');
  // A secret key arriving with a website Origin is how YTQ spots a leaked key;
  // this is a server call and must never forward the visitor's headers.
  assert(!('origin' in q.headers), 'an Origin header must never be sent');
  assert(!('referer' in q.headers), 'a Referer header must never be sent');
  assert(/^[\x21-\x7e]{1,255}$/.test(q.headers['idempotency-key'] || ''), 'Idempotency-Key must be 1-255 visible ASCII');
  eq(JSON.parse(q.body), payload, 'body');
  assert(!q.url.includes(DUMMY_KEY), 'key must not be in the URL');
  assert(logger.lines.every((l) => !l.includes(DUMMY_KEY) && !l.includes('j@example.com')), 'logs carry no key or payload');
});

await test('each submission gets its own Idempotency-Key', async () => {
  ytq.reset(reply(200, { success: true, id: 'x' }));
  const logger = captureLogger();
  await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: ytq.url, logger, ...fast });
  await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: ytq.url, logger, ...fast });
  assert(ytq.requests[0].headers['idempotency-key'] !== ytq.requests[1].headers['idempotency-key'], 'keys differ');
});

await test('429 then 200: retried once with the same Idempotency-Key', async () => {
  ytq.reset((req, res, n) => (n === 1 ? reply(429, { error: 'Too many' }, { 'retry-after': '0' }) : reply(200, { success: true, id: 'e' }))(req, res));
  const logger = captureLogger();
  const r = await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: ytq.url, logger, ...fast });
  eq(r, { delivered: true, status: 200, attempts: 2 }, 'result');
  eq(ytq.requests.length, 2, 'requests');
  eq(ytq.requests[0].headers['idempotency-key'], ytq.requests[1].headers['idempotency-key'], 'same key across retries');
  eq(ytq.requests[0].body, ytq.requests[1].body, 'same body across retries');
});

await test('Retry-After on a 429 is honoured', async () => {
  ytq.reset((req, res, n) => (n === 1 ? reply(429, {}, { 'retry-after': '1' }) : reply(200, { success: true }))(req, res));
  const t0 = Date.now();
  const r = await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: ytq.url, logger: captureLogger(), ...fast });
  const waited = Date.now() - t0;
  eq(r.delivered, true, 'delivered');
  assert(waited >= 950, `waited ${waited}ms, expected about 1000ms`);
});

await test('503 then 503 then 200: retried with the same Idempotency-Key', async () => {
  ytq.reset((req, res, n) => (n < 3 ? reply(503, { error: 'busy' }) : reply(200, { success: true }))(req, res));
  const r = await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: ytq.url, logger: captureLogger(), ...fast });
  eq(r, { delivered: true, status: 200, attempts: 3 }, 'result');
  eq(new Set(ytq.requests.map((q) => q.headers['idempotency-key'])).size, 1, 'one key');
});

await test('persistent 500: gives up after 3 retries (4 attempts)', async () => {
  ytq.reset(reply(500, { error: 'boom' }));
  const logger = captureLogger();
  const r = await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: ytq.url, logger, ...fast });
  eq(r, { delivered: false, status: 500, attempts: 4 }, 'result');
  eq(ytq.requests.length, 4, 'requests');
  assert(logger.lines.at(-1).includes('failed: status 500 after 4 attempts'), 'final log line');
});

for (const status of [400, 401, 403, 413]) {
  await test(`${status} is never retried`, async () => {
    ytq.reset(reply(status, { error: 'no' }));
    const logger = captureLogger();
    const r = await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: ytq.url, logger, ...fast });
    eq(r, { delivered: false, status, attempts: 1 }, 'result');
    eq(ytq.requests.length, 1, 'requests');
    eq(logger.lines, [`YTQ relay refused: status ${status}, not retried`], 'log');
  });
}

await test('a hung endpoint times out per attempt and is retried, same Idempotency-Key', async () => {
  ytq.reset(() => {}); // never answers
  const t0 = Date.now();
  const logger = captureLogger();
  const r = await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: ytq.url, logger, timeoutMs: 200, backoffMs: [10, 10, 10] });
  const took = Date.now() - t0;
  eq(r, { delivered: false, status: undefined, attempts: 4 }, 'result');
  eq(ytq.requests.length, 4, 'requests');
  eq(new Set(ytq.requests.map((q) => q.headers['idempotency-key'])).size, 1, 'one key');
  assert(took >= 800 && took < 3000, `took ${took}ms, expected about 4 x 200ms`);
  assert(logger.lines.at(-1) === 'YTQ relay failed: timeout on attempt 4', `final log: ${logger.lines.at(-1)}`);
});

await test('a network error is retried', async () => {
  const dead = await startStub();
  const url = dead.url;
  await dead.close(); // nothing listens on this port now
  const logger = captureLogger();
  const r = await forwardToYtq({ source: 'Website', name: 'A' }, { key: DUMMY_KEY, endpoint: url, logger, ...fast });
  eq(r.delivered, false, 'delivered');
  eq(r.attempts, 4, 'attempts');
  assert(logger.lines.filter((l) => l.includes('network error')).length === 4, 'four network error lines');
});

await test('the default endpoint is the documented submitEnquiry URL', () => {
  eq(YTQ_DEFAULT_ENDPOINT, 'https://europe-west2-yourtradequotes.cloudfunctions.net/submitEnquiry', 'endpoint');
});

// ---------- /api/contact handler ----------
const smtp = await startStub();
const smtpOk = (req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ data: { succeeded: 1 } })); };
const smtpFail = (req, res) => { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ data: { succeeded: 0 } })); };

process.env.SMTP2GO_API_KEY = 'dummy-smtp-key-for-tests';
process.env.SMTP2GO_ENDPOINT = smtp.url;
process.env.YTQ_ENDPOINT = ytq.url;
process.env.YTQ_SECRET_KEY = DUMMY_KEY;
const { POST } = await import('../src/pages/api/contact.ts');

function contactRequest(fields) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    for (const one of [].concat(v)) fd.append(k, one);
  }
  return new Request('http://127.0.0.1/api/contact', { method: 'POST', body: fd });
}
const visitor = {
  name: 'Jane Smith', email: 'jane@example.com', phone: '07700 900123', company: 'Acme Ltd',
  postcode: 'GU1 1AA', svc: ['Groundworks', 'Other'], source: 'Google', message: 'New slab',
  page: '/lp/groundworks-2?gclid=abc', leadSource: 'lp_groundworks_2', _honeypot: '',
};
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) return false;
    await sleep(20);
  }
  return true;
}
// Silence and capture the handler's console output.
const consoleLines = [];
const origLog = console.log;
const origErr = console.error;
const quiet = () => {
  console.log = (...a) => consoleLines.push(a.map(String).join(' '));
  console.error = (...a) => consoleLines.push(a.map(String).join(' '));
};
const loud = () => { console.log = origLog; console.error = origErr; };

await test('contact: email succeeds -> {ok:true}, one YTQ call, not delayed by YTQ', async () => {
  smtp.reset(smtpOk);
  ytq.reset((req, res) => setTimeout(() => reply(200, { success: true, id: 'e' })(req, res), 1500));
  quiet();
  const t0 = Date.now();
  const res = await POST({ request: contactRequest(visitor) });
  const took = Date.now() - t0;
  const data = await res.json();
  const arrived = await waitFor(() => ytq.requests.length === 1);
  await sleep(1700);
  loud();
  eq(res.status, 200, 'status');
  eq(data, { ok: true }, 'body');
  assert(took < 1000, `visitor response took ${took}ms; YTQ must not delay it`);
  assert(arrived, 'YTQ request did not arrive');
  eq(ytq.requests.length, 1, 'one YTQ call');
  eq(smtp.requests.length, 1, 'one email');
  eq(JSON.parse(ytq.requests[0].body), {
    source: 'Website', name: 'Jane Smith', email: 'jane@example.com', phone: '07700 900123', postcode: 'GU1 1AA',
    message: 'New slab', services: 'Groundworks, Other', company: 'Acme Ltd', heardVia: 'Google',
    sourcePage: '/lp/groundworks-2?gclid=abc', sourceCampaign: 'lp_groundworks_2',
  }, 'YTQ body');
  eq(ytq.requests[0].headers['x-ytq-api-key'], DUMMY_KEY, 'key header');
});

await test('contact: email fails -> 502 unchanged, and the lead still goes to YTQ once', async () => {
  smtp.reset(smtpFail);
  ytq.reset(reply(200, { success: true, id: 'e' }));
  quiet();
  const res = await POST({ request: contactRequest(visitor) });
  const data = await res.json();
  const arrived = await waitFor(() => ytq.requests.length === 1);
  await sleep(200);
  loud();
  eq(res.status, 502, 'status');
  eq(data, { ok: false, error: 'Could not send your enquiry. Please call us.' }, 'body');
  assert(arrived, 'YTQ request did not arrive');
  eq(ytq.requests.length, 1, 'one YTQ call');
});

await test('contact: honeypot -> {ok:true}, no email, no YTQ call', async () => {
  smtp.reset(smtpOk);
  ytq.reset(reply(200, { success: true }));
  quiet();
  const res = await POST({ request: contactRequest({ ...visitor, _honeypot: 'http://spam.example' }) });
  const data = await res.json();
  await sleep(300);
  loud();
  eq(res.status, 200, 'status');
  eq(data, { ok: true }, 'body');
  eq(smtp.requests.length, 0, 'no email');
  eq(ytq.requests.length, 0, 'no YTQ call');
});

await test('contact: invalid submission -> 400, no email, no YTQ call', async () => {
  smtp.reset(smtpOk);
  ytq.reset(reply(200, { success: true }));
  quiet();
  const res = await POST({ request: contactRequest({ ...visitor, email: 'not-an-email' }) });
  await sleep(300);
  loud();
  eq(res.status, 400, 'status');
  eq(smtp.requests.length, 0, 'no email');
  eq(ytq.requests.length, 0, 'no YTQ call');
});

await test('contact: homepage form (no leadSource) is labelled homepage', async () => {
  smtp.reset(smtpOk);
  ytq.reset(reply(200, { success: true }));
  quiet();
  const { leadSource, ...rest } = visitor;
  void leadSource;
  await POST({ request: contactRequest({ ...rest, page: '/' }) });
  const arrived = await waitFor(() => ytq.requests.length === 1);
  loud();
  assert(arrived, 'YTQ request did not arrive');
  eq(JSON.parse(ytq.requests[0].body).sourceCampaign, 'homepage', 'sourceCampaign');
});

await test('contact: no YTQ_SECRET_KEY -> response unchanged, no YTQ call', async () => {
  delete process.env.YTQ_SECRET_KEY;
  smtp.reset(smtpOk);
  ytq.reset(reply(200, { success: true }));
  quiet();
  const res = await POST({ request: contactRequest(visitor) });
  await sleep(300);
  loud();
  process.env.YTQ_SECRET_KEY = DUMMY_KEY;
  eq(res.status, 200, 'status');
  eq(ytq.requests.length, 0, 'no YTQ call');
  assert(consoleLines.includes('YTQ relay skipped: YTQ_SECRET_KEY not set'), 'skip line logged');
});

await test('contact: nothing logged carries the YTQ key', () => {
  assert(consoleLines.length > 0, 'expected some log lines');
  assert(consoleLines.every((l) => !l.includes(DUMMY_KEY)), 'a log line carried the key');
});

// ---------- build guard ----------
await test('check-no-keys fails on a planted key prefix and passes on a clean tree', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ytq-guard-'));
  try {
    mkdirSync(join(dir, 'lp'));
    writeFileSync(join(dir, 'index.html'), '<html><body>clean</body></html>');
    const clean = spawnSync(process.execPath, ['scripts/check-no-keys.mjs', dir], { encoding: 'utf8' });
    eq(clean.status, 0, `clean tree exit (${clean.stderr.trim()})`);
    writeFileSync(join(dir, 'lp', 'app.js'), `var k = '${'ytq' + '_live_'}x';`);
    const dirty = spawnSync(process.execPath, ['scripts/check-no-keys.mjs', dir], { encoding: 'utf8' });
    eq(dirty.status, 1, 'dirty tree exit');
    assert(dirty.stderr.includes('lp/app.js'), 'names the file');
    assert(!dirty.stderr.includes("_live_x'"), 'does not print the matched text');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

await ytq.close();
await smtp.close();

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.error('check-ytq-relay: FAILED');
  process.exit(1);
}
console.log('check-ytq-relay: all checks passed');
