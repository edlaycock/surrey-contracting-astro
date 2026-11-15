// Runs the sync: on a verified signal from YTQ, and on the site's own timer
// (hourly by default, YTQ_POLL_MINUTES) in case a signal is missed. One run at
// a time in this process (and a lock file across processes); a signal that
// arrives during a run asks for one more run afterwards, so signals coalesce
// and a burst of them costs one extra fetch at most.

import { readConfig } from './config.ts';
import type { CaseStudyConfig } from './config.ts';
import { loadCore } from './core.ts';
import { runSync } from './sync.ts';
import { cleanUpAtStart } from './store.ts';
import type { Resizer, SyncResult } from './sync.ts';

interface PollerState {
  timer: ReturnType<typeof setInterval> | null;
  running: Promise<SyncResult | null> | null;
  again: boolean;
  nonces: Map<string, number>;
}

const KEY = Symbol.for('surrey-contracting.ytq-case-studies');
const g = globalThis as unknown as Record<symbol, PollerState | undefined>;

export function pollerState(): PollerState {
  if (!g[KEY]) g[KEY] = { timer: null, running: null, again: false, nonces: new Map() };
  return g[KEY] as PollerState;
}

/** Resized copies with sharp (already installed with Astro); without it, the derivative only. */
export const sharpResizer: Resizer = async (bytes, ext, widths) => {
  const mod = (await import('sharp')) as unknown as { default: (input: Buffer) => any };
  const sharp = mod.default;
  const out: { width: number; bytes: Buffer }[] = [];
  for (const width of widths) {
    // sharp writes no metadata unless asked to, so the copies carry none either.
    const pipeline = sharp(bytes).rotate().resize({ width, withoutEnlargement: true });
    const data: Buffer = ext === 'png' ? await pipeline.png().toBuffer() : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    out.push({ width, bytes: data });
  }
  return out;
};

export function requestSync(reason: string, config: CaseStudyConfig = readConfig()): Promise<SyncResult | null> {
  const s = pollerState();
  if (!config.enabled || !config.secretKey) return Promise.resolve(null);
  if (s.running) {
    s.again = true;
    return s.running;
  }
  s.running = (async () => {
    let last: SyncResult | null = null;
    do {
      s.again = false;
      try {
        last = await runSync({ config, core: loadCore(), resize: sharpResizer });
        console.log(`[case-studies] sync (${reason}): ${last.outcome}, ${last.pages} page(s), ${last.applied} change(s), ${last.acksSent} ack(s)`);
      } catch {
        console.error('[case-studies] sync threw');
      }
    } while (s.again);
    return last;
  })().finally(() => {
    s.running = null;
  });
  return s.running;
}

/**
 * Starts the safety poll once per process. Called by server.mjs at process
 * start; the build never calls it.
 */
export function ensurePoller(config: CaseStudyConfig = readConfig()): void {
  const s = pollerState();
  if (s.timer || !config.enabled || !config.secretKey) return;
  try {
    const cleaned = cleanUpAtStart(config.dataDir);
    if (cleaned.lock || cleaned.tmp) console.log(`[case-studies] start: removed ${cleaned.lock ? 'a stale lock' : 'no lock'} and ${cleaned.tmp} stale temporary file(s)`);
  } catch {
    console.error('[case-studies] start: could not tidy the store');
  }
  const minutes = config.pollMinutes;
  s.timer = setInterval(() => void requestSync('poll'), minutes * 60 * 1000);
  s.timer.unref?.();
  // A first run shortly after start, so a restart picks up anything missed.
  setTimeout(() => void requestSync('startup'), config.startDelaySeconds * 1000).unref?.();
}
