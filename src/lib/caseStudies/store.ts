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
import type { CaseRecord } from './core.ts';

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
  record: CaseRecord;
  photos: Record<string, StoredPhoto>;
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
}

export interface State {
  format: 1;
  cursor: string | null;
  account: string | null;
  entries: Record<string, Entry>;
  /** A version this site refused; the same or a lower version is not tried again. */
  failed: Record<string, { version: number; error: string; at: string }>;
  /** Transient failures per id@version; after a few the item is refused, so one item cannot block the feed. */
  attempts: Record<string, number>;
  pendingAcks: Ack[];
  lastSync: { at: string; outcome: string } | null;
}

export const emptyState = (): State => ({
  format: 1,
  cursor: null,
  account: null,
  entries: {},
  failed: {},
  attempts: {},
  pendingAcks: [],
  lastSync: null,
});

export const statePath = (dataDir: string) => join(dataDir, 'state.json');
export const mediaDir = (dataDir: string) => join(dataDir, 'media');
export const stagingDir = (dataDir: string) => join(dataDir, 'staging');

export function loadState(dataDir: string): State {
  const file = statePath(dataDir);
  if (!existsSync(file)) return emptyState();
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<State>;
  if (!parsed || parsed.format !== 1) throw new Error('case study state has an unknown format');
  return { ...emptyState(), ...parsed } as State;
}

// Readers (the pages) cache by modification time, so a page view does not
// parse the file each time and always sees the latest committed state.
let readCache: { dir: string; mtimeMs: number; size: number; state: State } | null = null;

export function readStateForPages(dataDir: string): State {
  const file = statePath(dataDir);
  try {
    const st = statSync(file);
    if (readCache && readCache.dir === dataDir && readCache.mtimeMs === st.mtimeMs && readCache.size === st.size) {
      return readCache.state;
    }
    const state = loadState(dataDir);
    readCache = { dir: dataDir, mtimeMs: st.mtimeMs, size: st.size, state };
    return state;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') console.error('[case-studies] state unreadable, serving none');
    return emptyState();
  }
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
