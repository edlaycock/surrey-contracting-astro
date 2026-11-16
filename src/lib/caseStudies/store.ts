// The site's own store of YTQ case studies: one JSON state file and a media
// directory, under the data directory (YTQ_CASE_STUDY_DIR, a Docker volume on
// the VPS, outside the web root). Written only by the sync; read by the pages.
//
//   <dataDir>/state.json   cursor, account, one entry per case study id:
//                          the live record, or a tombstone marker
//   <dataDir>/media/       photo files, served by /case-studies/media/<file>
//                          only while a live entry references them
//   <dataDir>/staging/     downloads in progress; emptied at every sync
//
// state.json is replaced atomically (write a temporary file, then rename), so
// a reader never sees half a file and a crash leaves the previous state.

import {
  closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync,
  rmSync, statSync, unlinkSync, writeSync,
} from 'node:fs';
import { join } from 'node:path';
import type { CaseStudyConfig } from './config.ts';

/**
 * What the site keeps of a record: only what a page shows. The consent block,
 * the photo ticks and hashes, the social text and the source never reach
 * state.json, and a hidden town is not kept at all. The JSON-LD is built from
 * the full record at sync time and kept as the exact string to output.
 */
export interface StoredPhotoMeta {
  ref: string;
  role: 'hero' | 'before' | 'after' | 'other';
  alt: string;
  caption?: string;
  order: number;
  pair?: number;
  width: number;
  height: number;
}
export interface StoredRecord {
  id: string;
  version: number;
  title: string;
  slug: string;
  excerpt: string;
  service_category: string;
  location: { show_town: boolean; town?: string };
  completed_month: string;
  sections: { key: string; question: string; answer: string }[];
  faqs: { question: string; answer: string }[];
  photos: StoredPhotoMeta[];
  published_at: string;
  modified_at: string;
}

export interface PhotoVariant { width: number; file: string }
export interface StoredPhoto {
  ref: string;
  file: string;
  contentType: string;
  width: number;
  height: number;
  variants: PhotoVariant[];
}
export interface LiveEntry {
  kind: 'live';
  id: string;
  version: number;
  slug: string;
  /** Earlier slugs of this case study, redirected to the current one. */
  priorSlugs: string[];
  record: StoredRecord;
  photos: Record<string, StoredPhoto>;
  /** The <script type="application/ld+json"> element, exactly as the core builder returned it. */
  jsonLd: string;
  storedAt: string;
}
/** feed.md section 2: kept while connected, so a stale record cannot bring a page back. */
export interface RemovedEntry {
  kind: 'removed';
  id: string;
  version: number;
  removed_at: string;
  /** The URLs that answer 410 Gone. */
  slugs: string[];
}
export type Entry = LiveEntry | RemovedEntry;

export interface Ack {
  id: string;
  version: number;
  state: 'live' | 'removed' | 'failed';
  url?: string;
  error?: string;
  /** When YTQ first answered 422 to it (kept for seven days from then). */
  firstRefusedAt?: string;
}

export interface State {
  format: 1;
  cursor: string | null;
  account: string | null;
  entries: Record<string, Entry>;
  /** A version this site refused; the same or a lower version is not tried again. */
  failed: Record<string, { version: number; error: string; at: string }>;
  /** Transient failures per id@version: when to try again. Never turns into a refusal on its own. */
  retries: Record<string, { attempts: number; mismatches: number; nextAt: string }>;
  pendingAcks: Ack[];
  /** id -> "state@version" of the last acknowledgement YTQ accepted or refused for good. */
  ackSettled: Record<string, string>;
  lastSync: { at: string; outcome: string } | null;
  /** When a sync last read the feed through. The pages are held until this is recent (readPublishedState). */
  lastOkAt: string | null;
}

/**
 * Id-keyed maps have no prototype, so an id such as "constructor" or
 * "toString" (both allowed by the id pattern) is an ordinary key, never an
 * inherited function.
 */
export function dict<T>(from?: Record<string, T> | null): Record<string, T> {
  const out = Object.create(null) as Record<string, T>;
  if (from && typeof from === 'object') for (const key of Object.keys(from)) out[key] = from[key];
  return out;
}

export const emptyState = (): State => ({
  format: 1,
  cursor: null,
  account: null,
  entries: dict(),
  failed: dict(),
  retries: dict(),
  pendingAcks: [],
  ackSettled: dict(),
  lastSync: null,
  lastOkAt: null,
});

export const statePath = (dataDir: string) => join(dataDir, 'state.json');
export const mediaDir = (dataDir: string) => join(dataDir, 'media');
export const stagingDir = (dataDir: string) => join(dataDir, 'staging');

export function loadState(dataDir: string): State {
  const file = statePath(dataDir);
  if (!existsSync(file)) return emptyState();
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<State>;
  if (!parsed || parsed.format !== 1) throw new Error('case study state has an unknown format');
  const state = { ...emptyState(), ...parsed } as State;
  state.entries = dict(parsed.entries);
  state.failed = dict(parsed.failed);
  state.retries = dict(parsed.retries);
  state.ackSettled = dict(parsed.ackSettled);
  return state;
}

// Readers (the pages) cache by inode, modification time and size, so a page
// view does not parse the file each time and always sees the latest committed
// state (every save is a rename, so the inode changes on every save).
let readCache: { dir: string; ino: number; mtimeMs: number; size: number; state: State } | null = null;

export function readStateForPages(dataDir: string): State {
  const file = statePath(dataDir);
  try {
    const st = statSync(file);
    if (readCache && readCache.dir === dataDir && readCache.ino === st.ino && readCache.mtimeMs === st.mtimeMs && readCache.size === st.size) {
      return readCache.state;
    }
    const state = loadState(dataDir);
    readCache = { dir: dataDir, ino: st.ino, mtimeMs: st.mtimeMs, size: st.size, state };
    return state;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') console.error('[case-studies] state unreadable, serving none');
    return emptyState();
  }
}

/**
 * What the public pages, the media route and the case-study sitemap read.
 * Held (empty) until a recent sync succeeded; see below. With the kit switched off (YTQ_CASE_STUDIES not on, or no key) the site
 * answers as if nothing were published: switching off takes the pages down
 * at once, without waiting for a sync that can no longer run. The store on
 * disk is kept, so switching back on restores the pages and the next sync
 * applies any tombstones that arrived meanwhile.
 */
export function readPublishedState(config: CaseStudyConfig, nowMs: number = Date.now()): State {
  if (!config.enabled || !config.secretKey) return emptyState();
  const state = readStateForPages(config.dataDir);
  // F3: the pages are held until a sync has read the feed within the last
  // three poll intervals. After switching back on, or a restart after a long
  // stop, nothing stored is shown until the first sync has applied whatever
  // was unpublished meanwhile; and if syncs keep failing (a rotated key, YTQ
  // down) for three intervals, the pages come down rather than go stale.
  const okAt = state.lastOkAt ? Date.parse(state.lastOkAt) : NaN;
  if (!Number.isFinite(okAt) || nowMs - okAt > 3 * config.pollMinutes * 60 * 1000) return emptyState();
  return state;
}

export function saveState(dataDir: string, state: State): void {
  mkdirSync(dataDir, { recursive: true });
  const file = statePath(dataDir);
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  const fd = openSync(tmp, 'w', 0o600);
  try {
    writeSync(fd, JSON.stringify(state, null, 1));
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmp, file);
}

export const liveEntries = (state: State): LiveEntry[] =>
  Object.values(state.entries).filter((e): e is LiveEntry => e.kind === 'live');

/** Every media file a live entry references: the only files the media route serves. */
export function referencedFiles(state: State): Set<string> {
  const files = new Set<string>();
  for (const entry of liveEntries(state)) {
    for (const photo of Object.values(entry.photos)) {
      files.add(photo.file);
      for (const v of photo.variants) files.add(v.file);
    }
  }
  return files;
}

/**
 * Deletes every media file no live entry references: the photos and resized
 * copies of a removed or replaced version, and anything a crash left behind.
 * Runs after every committed change, so a tombstone that failed half way is
 * finished by the next sync.
 */
export function collectGarbage(dataDir: string, state: State): number {
  const dir = mediaDir(dataDir);
  if (!existsSync(dir)) return 0;
  const keep = referencedFiles(state);
  let removed = 0;
  for (const name of readdirSync(dir)) {
    if (keep.has(name)) continue;
    try {
      unlinkSync(join(dir, name));
      removed++;
    } catch {
      // Left for the next sync.
    }
  }
  return removed;
}

export function clearStaging(dataDir: string): void {
  rmSync(stagingDir(dataDir), { recursive: true, force: true });
  removeStaleTempFiles(dataDir);
}

/** state.json.<pid>.<time>.tmp left by a crash between write and rename. Only saveState writes them, under the lock. */
export function removeStaleTempFiles(dataDir: string): number {
  if (!existsSync(dataDir)) return 0;
  let removed = 0;
  for (const name of readdirSync(dataDir)) {
    if (!/^state\.json\..+\.tmp$/.test(name)) continue;
    rmSync(join(dataDir, name), { force: true });
    removed++;
  }
  return removed;
}

/**
 * At server start nothing in this process is syncing, and only one server
 * process uses the store, so a lock left behind is a container killed
 * mid-sync: remove it rather than report busy for ten minutes.
 */
export function cleanUpAtStart(dataDir: string): { lock: boolean; tmp: number } {
  if (!existsSync(dataDir)) return { lock: false, tmp: 0 };
  const lockFile = join(dataDir, 'sync.lock');
  const lock = existsSync(lockFile);
  rmSync(lockFile, { force: true });
  return { lock, tmp: removeStaleTempFiles(dataDir) };
}

/** A lock file, so two processes (or a stuck run) never sync at once. Stale after 10 minutes. */
export function acquireLock(dataDir: string, now = Date.now()): (() => void) | null {
  mkdirSync(dataDir, { recursive: true });
  const file = join(dataDir, 'sync.lock');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = openSync(file, 'wx', 0o600);
      writeSync(fd, String(process.pid));
      closeSync(fd);
      return () => rmSync(file, { force: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException)?.code !== 'EEXIST') throw err;
      try {
        if (now - statSync(file).mtimeMs > 10 * 60 * 1000) {
          rmSync(file, { force: true });
          continue;
        }
      } catch {
        continue;
      }
      return null;
    }
  }
  return null;
}
