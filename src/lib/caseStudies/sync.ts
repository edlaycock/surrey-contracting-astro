// Pulls the YTQ case-study feed into the site's store (Case Study Core
// spec/feed.md, matched to YTQ's caseStudyFeed in functions/caseStudyPublishing.js
// and functions/index.js, PR #295, checked at d98b030 and 934fbf3; since
// 934fbf3 YTQ sends a tombstone for a stored record its core now refuses,
// which this kit applies like any other):
//
//   GET  <feed>?core=1.0[&since=<cursor>]   x-ytq-api-key   records + tombstones
//   GET  <feed>?photo=<ref>&id=<id>         x-ytq-api-key   one photo, consent re-checked
//   POST <feed> {id, version, state, url?, error?, site}    the acknowledgement
//
// Every record is validated with the vendored core before it is stored, its
// photos are verified against the record's sha256 in a staging directory and
// moved into the media directory only once all of them passed, and only then
// is the state committed. Tombstones delete the page, its photos and resized
// copies. Idempotent by id and version, so any part can be re-run. An item
// that cannot be stored yet is skipped and retried later; it never holds up
// the items after it, but the stored cursor stays just before the page that
// held it, so the feed serves it again, and the items already applied are
// no-ops.
//
// Logs carry ids, versions, statuses and error codes only: never the key,
// never record text.

import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CaseStudyConfig } from './config.ts';
import { KIT_VERSION } from './config.ts';
import type { CaseRecord, Core } from './core.ts';
import {
  acquireLock, clearStaging, collectGarbage, loadState, mediaDir, saveState, stagingDir,
} from './store.ts';
import type { Ack, LiveEntry, State, StoredPhoto, StoredRecord } from './store.ts';
import { siteContext } from './siteContext.ts';

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;
type Logger = { log: (msg: string) => void; error: (msg: string) => void };
export type Resizer = (bytes: Buffer, ext: 'jpg' | 'png', widths: number[]) => Promise<{ width: number; bytes: Buffer }[]>;

export interface SyncDeps {
  config: CaseStudyConfig;
  core: Core;
  fetchImpl?: FetchLike;
  logger?: Logger;
  now?: () => Date;
  /** Makes the resized copies; absent or failing, only the derivative is offered. */
  resize?: Resizer | null;
  timeoutMs?: number;
  maxPages?: number;
  /** Writes a staged file; a test can make it fail as a full disk would. */
  writeFile?: (path: string, bytes: Buffer) => void;
}

export interface SyncResult {
  outcome: 'ok' | 'partial' | 'disabled' | 'busy' | 'feed_error' | 'unauthorized' | 'account_mismatch' | 'storage_error';
  pages: number;
  applied: number;
  acksSent: number;
  status?: number;
}

export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{7,63}$/;
/** YTQ's planAck accepts an error code only in this shape. */
const ERROR_CODE_PATTERN = /^[a-z0-9_.]{1,64}$/;
/** Widths offered in srcset (spec/rendering.md section 4), never upscaled. */
export const VARIANT_WIDTHS = [480, 800, 1200, 1600];
const MAX_PHOTO_BYTES = 16 * 1024 * 1024;
const MAX_FEED_BYTES = 8 * 1024 * 1024;
/**
 * An item is refused only on evidence about the item itself: a photo YTQ says
 * is gone (410), a type the site cannot serve, or bytes that fail the
 * record's sha256 this many times in a row. Anything that is YTQ's or the
 * network's trouble (403 account_inactive, 404, 429, 5xx, a timeout, a full
 * disk) is retried for as long as it takes, with a capped backoff, and is
 * never acknowledged as failed.
 */
export const MAX_HASH_MISMATCHES = 3;
/** Backoff before retrying an item: 1, 2, 4 ... minutes, capped at 30 (half the poll interval, so a retry is never just missed by a tick). */
export const RETRY_BASE_MS = 60 * 1000;
export const RETRY_CAP_MS = 30 * 60 * 1000;
export const retryDelayMs = (attempts: number) => Math.min(RETRY_CAP_MS, RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1));

class Transient extends Error {
  status?: number;
  mismatch: boolean;
  constructor(message: string, status?: number, mismatch = false) {
    super(message);
    this.status = status;
    this.mismatch = mismatch;
  }
}
class Refused extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export const pageUrl = (config: CaseStudyConfig, slug: string) => `${config.siteUrl}/case-studies/${slug}`;
export const mediaUrlPath = (file: string) => `/case-studies/media/${file}`;

/** File name from the ref and the start of the hash; the full sha256 never appears on a page. */
export const mediaFileName = (ref: string, sha256: string, ext: string, width?: number) =>
  `${ref}-${sha256.slice(0, 12)}${width ? `-w${width}` : ''}.${ext}`;

export function variantWidths(width: number): number[] {
  return VARIANT_WIDTHS.filter((w) => w < width);
}

export function siteBlock(config: CaseStudyConfig, core: Core) {
  return {
    type: 'server',
    site_url: `${config.siteUrl}/`,
    refresh_url: config.refreshUrl,
    plugin_version: KIT_VERSION,
    core_version: core.CORE_VERSION,
  };
}

/** The acknowledgement body exactly as YTQ's feedAck reads it. */
export function ackBody(ack: Ack, config: CaseStudyConfig, core: Core) {
  return {
    id: ack.id,
    version: ack.version,
    state: ack.state,
    ...(ack.state === 'live' && ack.url ? { url: ack.url } : {}),
    ...(ack.state === 'failed' ? { error: ERROR_CODE_PATTERN.test(ack.error || '') ? ack.error : 'site.unknown' } : {}),
    site: siteBlock(config, core),
  };
}

function queueAck(state: State, ack: Ack): void {
  // One pending acknowledgement per case study: a newer fact replaces an older one.
  state.pendingAcks = state.pendingAcks.filter((a) => a.id !== ack.id || a.version > ack.version);
  if (!state.pendingAcks.some((a) => a.id === ack.id && a.version > ack.version)) state.pendingAcks.push(ack);
}

async function timedFetch(fetchImpl: FetchLike, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Every call carries the secret key in a header, and fetch forwards custom
    // headers across a redirect to another origin. YTQ's feed never redirects,
    // so a redirect is refused rather than followed.
    return await fetchImpl(url, { ...init, redirect: 'error', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readCapped(res: Response, max: number): Promise<Buffer> {
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > max) throw new Transient('response too large');
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > max) throw new Transient('response too large');
  return bytes;
}

export function feedListUrl(endpoint: string, cursor: string | null): string {
  const url = new URL(endpoint);
  url.searchParams.set('core', '1.0');
  if (cursor) url.searchParams.set('since', cursor);
  return url.toString();
}

export function feedPhotoUrl(endpoint: string, ref: string, id: string): string {
  const url = new URL(endpoint);
  url.searchParams.set('photo', ref);
  url.searchParams.set('id', id);
  return url.toString();
}

/** F2: an acknowledgement answered 422 (the page's site not on the account's allowed websites yet) is kept this long. */
export const ACK_422_KEEP_MS = 7 * 24 * 60 * 60 * 1000;

export async function sendAcks(state: State, deps: SyncDeps): Promise<number> {
  const { config, core } = deps;
  const fetchImpl = deps.fetchImpl ?? ((u, i) => fetch(u, i));
  const logger = deps.logger ?? console;
  const now = deps.now ?? (() => new Date());
  let sent = 0;
  const settle = (ack: Ack) => {
    state.pendingAcks = state.pendingAcks.filter((a) => a !== ack);
    state.ackSettled[ack.id] = `${ack.state}@${ack.version}`;
  };
  for (const ack of [...state.pendingAcks]) {
    let status: number | undefined;
    try {
      const res = await timedFetch(fetchImpl, config.feedEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ytq-api-key': config.secretKey, accept: 'application/json' },
        body: JSON.stringify(ackBody(ack, config, core)),
      }, deps.timeoutMs ?? 15000);
      status = res.status;
      await res.arrayBuffer().catch(() => undefined);
    } catch {
      logger.error(`[case-studies] acknowledgement not delivered (${ack.id} v${ack.version} ${ack.state}): network, kept for the next sync`);
      break;
    }
    // 401 and 403 too: a key just rotated in YTQ and not yet on this server
    // is fixed by the owner, after which these must still arrive.
    if (status === 429 || status >= 500 || status === 401 || status === 403) {
      logger.error(`[case-studies] acknowledgement not delivered (${ack.id} v${ack.version} ${ack.state}): status ${status}, kept for the next sync`);
      break;
    }
    if (status >= 200 && status < 300) {
      settle(ack);
      sent++;
      logger.log(`[case-studies] acknowledged ${ack.id} v${ack.version} ${ack.state}`);
      continue;
    }
    if (status === 422) {
      // The page URL is not on the account's allowed websites in YTQ: the
      // owner can fix that, and the feed will never serve this record again
      // once the cursor has passed it, so the acknowledgement is kept.
      const first = ack.firstRefusedAt ?? now().toISOString();
      if (now().getTime() - Date.parse(first) > ACK_422_KEEP_MS) {
        settle(ack);
        logger.error(`[case-studies] acknowledgement dropped after 7 days of 422 (${ack.id} v${ack.version} ${ack.state}): add the site to the account's allowed websites in YTQ`);
      } else {
        ack.firstRefusedAt = first;
        logger.error(`[case-studies] acknowledgement refused (${ack.id} v${ack.version} ${ack.state}): status 422, kept; add the site to the account's allowed websites in YTQ`);
      }
      continue;
    }
    // 400, 404, 409: the same every time.
    settle(ack);
    logger.error(`[case-studies] acknowledgement refused (${ack.id} v${ack.version} ${ack.state}): status ${status}, not retried`);
  }
  return sent;
}

interface Tombstone { id: string; removed: true; version: number; removed_at: string }

function isTombstone(item: unknown): item is Tombstone {
  const t = item as Tombstone;
  return Boolean(t) && typeof t === 'object' && t.removed === true && typeof t.id === 'string' && ID_PATTERN.test(t.id)
    && Number.isSafeInteger(t.version) && t.version >= 1 && typeof t.removed_at === 'string';
}

/** feed.md section 2, the table: what a tombstone does. Pure on the state. */
export function applyTombstone(state: State, t: Tombstone): 'removed' | 'stale' | 'already' {
  const entry = state.entries[t.id];
  if (entry?.kind === 'live' && entry.version > t.version) return 'stale';
  dropRetries(state, t.id, t.version);
  if (state.failed[t.id] && state.failed[t.id].version <= t.version) delete state.failed[t.id];
  // F6: already removed at this version or later, and that removal was
  // acknowledged (or settled): a re-served tombstone changes nothing and
  // costs no acknowledgement.
  const settled = /^removed@(\d+)$/.exec(state.ackSettled[t.id] || '');
  if (entry?.kind === 'removed' && entry.version >= t.version && settled && Number(settled[1]) >= t.version) return 'already';
  const slugs = entry?.kind === 'live' ? [entry.slug, ...entry.priorSlugs] : entry?.kind === 'removed' ? entry.slugs : [];
  const version = entry?.kind === 'removed' ? Math.max(entry.version, t.version) : t.version;
  const already = entry?.kind === 'removed' && entry.version >= t.version;
  state.entries[t.id] = { kind: 'removed', id: t.id, version, removed_at: already ? entry.removed_at : t.removed_at, slugs: [...new Set(slugs)] };
  queueAck(state, { id: t.id, version: t.version, state: 'removed' });
  return already ? 'already' : 'removed';
}

/** feed.md section 2, the table: whether a record should be stored at all. */
export function recordDecision(state: State, id: string, version: number): 'store' | 'skip' {
  const entry = state.entries[id];
  if (entry && entry.version >= version) return 'skip';
  const failed = state.failed[id];
  if (failed && failed.version >= version) return 'skip';
  return 'store';
}

function contentTypeExt(contentType: string | null): 'jpg' | 'png' | null {
  const type = String(contentType || '').split(';')[0].trim().toLowerCase();
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/png') return 'png';
  return null;
}

async function fetchPhoto(record: CaseRecord, photo: CaseRecord['photos'][number], deps: SyncDeps): Promise<{ bytes: Buffer; ext: 'jpg' | 'png'; contentType: string }> {
  const fetchImpl = deps.fetchImpl ?? ((u, i) => fetch(u, i));
  let res: Response;
  try {
    res = await timedFetch(fetchImpl, feedPhotoUrl(deps.config.feedEndpoint, photo.ref, record.id), {
      method: 'GET',
      headers: { 'x-ytq-api-key': deps.config.secretKey },
    }, deps.timeoutMs ?? 15000);
  } catch {
    throw new Transient('photo fetch failed');
  }
  if (res.status === 410) {
    await res.arrayBuffer().catch(() => undefined);
    throw new Refused('photo.gone');
  }
  if (res.status !== 200) {
    await res.arrayBuffer().catch(() => undefined);
    // 403 is a lapsed account (YTQ: keep what you have, take nothing new);
    // 404, 429 and 5xx may pass. All retried on the next sync.
    throw new Transient('photo status', res.status);
  }
  const ext = contentTypeExt(res.headers.get('content-type'));
  if (!ext) {
    await res.arrayBuffer().catch(() => undefined);
    throw new Refused('photo.unsupported_type');
  }
  // Over the cap is evidence about the item (a derivative is at most 2,560
  // pixels on its longest edge), not a fault that clears by itself.
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > MAX_PHOTO_BYTES) {
    await res.body?.cancel().catch(() => undefined);
    throw new Refused('photo.too_large');
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_PHOTO_BYTES) throw new Refused('photo.too_large');
  if (createHash('sha256').update(bytes).digest('hex') !== photo.sha256) throw new Transient('photo hash mismatch', undefined, true);
  return { bytes, ext, contentType: ext === 'png' ? 'image/png' : 'image/jpeg' };
}

async function storeRecord(state: State, record: CaseRecord, deps: SyncDeps, staging: string): Promise<LiveEntry> {
  const { config } = deps;
  const logger = deps.logger ?? console;
  const now = (deps.now ?? (() => new Date()))();
  const previous = state.entries[record.id];
  const previousLive = previous?.kind === 'live' ? previous : null;
  // One slug, one page: a slug held by another live case study is refused.
  for (const other of Object.values(state.entries)) {
    if (other.kind === 'live' && other.id !== record.id && (other.slug === record.slug || other.priorSlugs.includes(record.slug))) {
      throw new Refused('site.slug_taken');
    }
  }
  const write = deps.writeFile ?? ((path: string, bytes: Buffer) => writeFileSync(path, bytes));
  const media = mediaDir(config.dataDir);
  mkdirSync(media, { recursive: true });
  mkdirSync(staging, { recursive: true });
  const staged: { from: string; name: string }[] = [];
  const photos: Record<string, StoredPhoto> = {};
  for (const photo of record.photos) {
    const reuse = previousLive?.photos[photo.ref];
    const reusePrefix = `${photo.ref}-${photo.sha256.slice(0, 12)}.`;
    if (reuse && reuse.file.startsWith(reusePrefix) && existsSync(join(media, reuse.file))) {
      // The same file as the live version: nothing to fetch.
      photos[photo.ref] = { ...reuse, width: photo.width, height: photo.height };
      continue;
    }
    const { bytes, ext, contentType } = await fetchPhoto(record, photo, deps);
    const file = mediaFileName(photo.ref, photo.sha256, ext);
    write(join(staging, file), bytes);
    staged.push({ from: join(staging, file), name: file });
    const variants: { width: number; file: string }[] = [];
    const widths = variantWidths(photo.width);
    if (deps.resize && widths.length) {
      try {
        for (const copy of await deps.resize(bytes, ext, widths)) {
          const name = mediaFileName(photo.ref, photo.sha256, ext, copy.width);
          write(join(staging, name), copy.bytes);
          staged.push({ from: join(staging, name), name });
          variants.push({ width: copy.width, file: name });
        }
      } catch {
        logger.error(`[case-studies] resized copies failed for ${record.id}; serving the derivative only`);
        variants.length = 0;
      }
    }
    photos[photo.ref] = { ref: photo.ref, file, contentType, width: photo.width, height: photo.height, variants };
  }
  // The JSON-LD is built now, from the full record, and kept as the string to
  // output; the stored record itself keeps only what the page shows.
  let jsonLd: string;
  try {
    jsonLd = deps.core.buildJsonLdScriptTag(record, siteContext(record.slug, photos, config));
  } catch (err) {
    const code = String((err as { code?: unknown })?.code || '');
    throw new Refused(/^[a-z0-9_.]{1,64}$/.test(code) ? code : 'jsonld.refused');
  }
  // Every photo verified: only now do any of them move under the public media
  // directory, and they are served only once the state below is committed.
  for (const item of staged) renameSync(item.from, join(media, item.name));
  const priorSlugs = previousLive
    ? [...new Set([previousLive.slug, ...previousLive.priorSlugs])].filter((s) => s !== record.slug)
    : [];
  return { kind: 'live', id: record.id, version: record.version, slug: record.slug, priorSlugs, record: toStoredRecord(record), photos, jsonLd, storedAt: now.toISOString() };
}

/** The part of a validated record a page shows; see StoredRecord. */
export function toStoredRecord(record: CaseRecord): StoredRecord {
  const showTown = record.location?.show_town === true;
  return {
    id: record.id,
    version: record.version,
    title: record.title,
    slug: record.slug,
    excerpt: record.excerpt,
    service_category: record.service_category,
    location: showTown ? { show_town: true, town: record.location.town } : { show_town: false },
    completed_month: record.completed_month,
    sections: record.sections.map(({ key, question, answer }) => ({ key, question, answer })),
    faqs: (record.faqs ?? []).map(({ question, answer }) => ({ question, answer })),
    photos: record.photos.map((p) => ({
      ref: p.ref, role: p.role, alt: p.alt, ...(p.caption !== undefined ? { caption: p.caption } : {}),
      order: p.order, ...(p.pair !== undefined ? { pair: p.pair } : {}), width: p.width, height: p.height,
    })),
    published_at: record.published_at,
    modified_at: record.modified_at,
  };
}

/** F5: a retry entry for this id at or below `version` is superseded. */
export function dropRetries(state: State, id: string, version: number): void {
  for (const key of Object.keys(state.retries)) {
    const at = key.lastIndexOf('@');
    if (key.slice(0, at) === id && Number(key.slice(at + 1)) <= version) delete state.retries[key];
  }
}

function refuse(state: State, id: string, version: number, code: string, now: Date, logger: Logger): void {
  state.failed[id] = { version, error: code, at: now.toISOString() };
  dropRetries(state, id, version);
  queueAck(state, { id, version, state: 'failed', error: code });
  logger.error(`[case-studies] ${id} v${version} not stored: ${code}`);
}

/** One sync: acknowledgements still owed, then every feed page. Never throws. */
export async function runSync(deps: SyncDeps): Promise<SyncResult> {
  const { config, core } = deps;
  const logger = deps.logger ?? console;
  const now = deps.now ?? (() => new Date());
  const fetchImpl = deps.fetchImpl ?? ((u, i) => fetch(u, i));
  const result: SyncResult = { outcome: 'ok', pages: 0, applied: 0, acksSent: 0 };
  if (!config.enabled || !config.secretKey) return { ...result, outcome: 'disabled' };
  let release: (() => void) | null = null;
  try {
    release = acquireLock(config.dataDir, now().getTime());
  } catch (err) {
    // An unwritable or missing volume: say why, every time.
    logger.error(`[case-studies] sync could not take its lock in ${config.dataDir}: ${(err as NodeJS.ErrnoException)?.code || 'error'}`);
    return { ...result, outcome: 'storage_error' };
  }
  if (!release) return { ...result, outcome: 'busy' };
  let state: State | null = null;
  try {
    state = loadState(config.dataDir);
    clearStaging(config.dataDir);
    collectGarbage(config.dataDir, state);
    result.acksSent += await sendAcks(state, deps);
    saveState(config.dataDir, state);

    // The cursor to store. Every item in every page fetched is applied, but
    // once an item has to be skipped for now (its photos cannot be fetched or
    // written yet), the stored cursor stays at the start of the page that held
    // it, so the next run is served it again. Items after it, tombstones above
    // all, are never held up by it (YTQ's buildFeedPage holds its own cursor
    // the same way). Re-served items are no-ops by id and version.
    const maxPages = deps.maxPages ?? 50;
    let pageCursor = state.cursor;
    let heldCursor: string | null | undefined;
    let feedRead = false;
    while (result.pages < maxPages) {
      const sentCursor = pageCursor;
      let res: Response;
      try {
        res = await timedFetch(fetchImpl, feedListUrl(config.feedEndpoint, sentCursor), {
          method: 'GET',
          headers: { 'x-ytq-api-key': config.secretKey, accept: 'application/json' },
        }, deps.timeoutMs ?? 15000);
      } catch {
        logger.error('[case-studies] feed unreachable');
        result.outcome = 'feed_error';
        break;
      }
      if (res.status !== 200) {
        await res.arrayBuffer().catch(() => undefined);
        result.status = res.status;
        result.outcome = res.status === 401 ? 'unauthorized' : 'feed_error';
        logger.error(`[case-studies] feed answered ${res.status}`);
        break;
      }
      let body: { schema_version?: unknown; account?: unknown; cursor?: unknown; has_more?: unknown; items?: unknown };
      try {
        body = core.decode((await readCapped(res, MAX_FEED_BYTES)).toString('utf8')) as typeof body;
      } catch {
        logger.error('[case-studies] feed body unreadable');
        result.outcome = 'feed_error';
        break;
      }
      if (!body || body.schema_version !== 1 || typeof body.cursor !== 'string' || !Array.isArray(body.items)) {
        logger.error('[case-studies] feed body not in the expected shape');
        result.outcome = 'feed_error';
        break;
      }
      if (typeof body.account === 'string' && body.account) {
        const expected = config.accountId || state.account;
        if (expected && expected !== body.account) {
          logger.error('[case-studies] feed is for a different account than this site stored; nothing applied');
          result.outcome = 'account_mismatch';
          break;
        }
        state.account = body.account;
      }
      result.pages++;
      feedRead = true;

      let skippedHere = false;
      for (const item of body.items as unknown[]) {
        if (isTombstone(item)) {
          const outcome = applyTombstone(state, item);
          if (outcome === 'removed') {
            result.applied++;
            logger.log(`[case-studies] ${item.id} removed (v${item.version})`);
            // A removal is committed at once: a withdrawn permission must not
            // wait for the rest of the page.
            saveState(config.dataDir, state);
            collectGarbage(config.dataDir, state);
          }
          continue;
        }
        const record = (item as { record?: CaseRecord } | null)?.record;
        if (!record || typeof record !== 'object' || typeof record.id !== 'string' || !ID_PATTERN.test(record.id)
          || !Number.isSafeInteger(record.version) || record.version < 1) {
          logger.error('[case-studies] feed item without a usable id and version skipped');
          continue;
        }
        if (recordDecision(state, record.id, record.version) === 'skip') {
          // Already live at this version: if its live acknowledgement was
          // never settled (delivered, or refused for good) and none is
          // waiting, owe it again. Otherwise nothing: a re-served page costs
          // no acknowledgement.
          const held = state.entries[record.id];
          if (held?.kind === 'live' && held.version === record.version
            && state.ackSettled[record.id] !== `live@${record.version}`
            && !state.pendingAcks.some((a) => a.id === record.id)) {
            queueAck(state, { id: record.id, version: record.version, state: 'live', url: pageUrl(config, held.slug) });
          }
          continue;
        }
        const attemptKey = `${record.id}@${record.version}`;
        const retry = state.retries[attemptKey];
        if (retry && now().getTime() < Date.parse(retry.nextAt)) {
          // Backing off: skipped for now, nothing fetched, the rest goes on.
          logger.log(`[case-studies] ${record.id} v${record.version} waiting to retry; later items go ahead`);
          skippedHere = true;
          continue;
        }
        let gate;
        try {
          gate = core.assertPublishable(record);
        } catch {
          gate = { valid: false, errors: [{ code: 'record.unreadable', path: '', message: '' }], warnings: [] };
        }
        if (!gate.valid) {
          refuse(state, record.id, record.version, gate.errors[0]?.code || 'record.invalid', now(), logger);
          continue;
        }
        try {
          const entry = await storeRecord(state, record, deps, join(stagingDir(config.dataDir), randomUUID()));
          state.entries[record.id] = entry;
          delete state.failed[record.id];
          dropRetries(state, record.id, record.version);
          queueAck(state, { id: record.id, version: record.version, state: 'live', url: pageUrl(config, record.slug) });
          result.applied++;
          logger.log(`[case-studies] ${record.id} v${record.version} live`);
        } catch (err) {
          if (err instanceof Refused) {
            refuse(state, record.id, record.version, err.code, now(), logger);
            continue;
          }
          const previous = state.retries[attemptKey];
          const mismatch = err instanceof Transient && err.mismatch;
          const attempts = (previous?.attempts || 0) + 1;
          const mismatches = mismatch ? (previous?.mismatches || 0) + 1 : 0;
          if (mismatches >= MAX_HASH_MISMATCHES) {
            refuse(state, record.id, record.version, 'photo.hash_mismatch', now(), logger);
            continue;
          }
          const nextAt = new Date(now().getTime() + retryDelayMs(attempts)).toISOString();
          state.retries[attemptKey] = { attempts, mismatches, nextAt };
          const status = err instanceof Transient && err.status ? ` (status ${err.status})`
            : (err as NodeJS.ErrnoException)?.code ? ` (${(err as NodeJS.ErrnoException).code})` : '';
          logger.error(`[case-studies] ${record.id} v${record.version} not stored yet${status}, attempt ${attempts}, retry after ${nextAt}; later items go ahead`);
          skippedHere = true;
        }
      }
      if (skippedHere && heldCursor === undefined) heldCursor = sentCursor;
      pageCursor = body.cursor;
      state.cursor = heldCursor !== undefined ? heldCursor : pageCursor;
      saveState(config.dataDir, state);
      collectGarbage(config.dataDir, state);
      // has_more false while YTQ holds a record back: its cursor does not move
      // past it, so the site asks again from there next time. A cursor that did
      // not move also ends the run, so a misbehaving feed cannot loop.
      if (body.has_more !== true || body.cursor === sentCursor) break;
    }
    if (heldCursor !== undefined && result.outcome === 'ok') result.outcome = 'partial';
    // A sync that read the feed through counts as a success for the page
    // hold (readPublishedState), even if some item is still waiting.
    if (feedRead && (result.outcome === 'ok' || result.outcome === 'partial')) state.lastOkAt = now().toISOString();
    state.lastSync = { at: now().toISOString(), outcome: result.outcome };
    saveState(config.dataDir, state);
    collectGarbage(config.dataDir, state);
    result.acksSent += await sendAcks(state, deps);
    saveState(config.dataDir, state);
  } catch (err) {
    logger.error(`[case-studies] sync failed: ${(err as NodeJS.ErrnoException)?.code || (err as Error)?.name || 'error'}`);
    result.outcome = 'partial';
    if (state) {
      try {
        saveState(config.dataDir, state);
      } catch {
        // The previous state file is intact.
      }
    }
  } finally {
    try {
      clearStaging(config.dataDir);
    } catch {
      // Emptied at the next sync.
    }
    release?.();
  }
  return result;
}
