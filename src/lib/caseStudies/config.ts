// Configuration for the YourTradeQuotes case-study kit, from the environment
// only (server side; see README "YourTradeQuotes case studies"). No value is
// ever logged.
//
// Erasable TypeScript only, extension-explicit imports: the tests import this
// file directly under Node's type stripping (scripts/check-ytq-case-studies.mjs).

import { join } from 'node:path';

export const SITE_URL = 'https://surreycontracting.co.uk';
export const YTQ_FEED_DEFAULT_ENDPOINT =
  'https://europe-west2-yourtradequotes.cloudfunctions.net/caseStudyFeed';
export const REFRESH_PATH = '/api/ytq-refresh';
/** The kit's own version, reported to YTQ in the acknowledgement's site block. */
export const KIT_VERSION = '1.0.0';

export type Env = Record<string, string | undefined>;

export interface CaseStudyConfig {
  /** YTQ_CASE_STUDIES=on. Off: no feed call, no poll, the refresh route answers 401. */
  enabled: boolean;
  /** YTQ_SECRET_KEY, the same server-only key the enquiry relay uses. */
  secretKey: string;
  feedEndpoint: string;
  dataDir: string;
  siteUrl: string;
  /** The refresh URL registered in YTQ; its host and path bind the signature. */
  refreshUrl: string;
  refreshHost: string;
  refreshPath: string;
  pollMinutes: number;
  /** Optional YTQ_ACCOUNT_ID; otherwise the account the feed reported. */
  accountId: string;
}

/** Same lookup as /api/contact: process.env first, then Astro's import.meta.env. */
export function processEnv(): Env {
  const meta = ((import.meta as unknown as { env?: Env }).env ?? {}) as Env;
  return { ...meta, ...process.env };
}

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);

/** https, or http to loopback (local tests against a stub only). */
export function endpointAllowed(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.username || url.password || url.search || url.hash) return false;
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && LOOPBACK.has(url.hostname);
  } catch {
    return false;
  }
}

export function readConfig(env: Env = processEnv()): CaseStudyConfig {
  const feedEndpoint = (env.YTQ_FEED_ENDPOINT || '').trim() || YTQ_FEED_DEFAULT_ENDPOINT;
  const refreshUrl = (env.YTQ_REFRESH_URL || '').trim() || `${SITE_URL}${REFRESH_PATH}`;
  let refreshHost = '';
  let refreshPath = '';
  try {
    const url = new URL(refreshUrl);
    refreshHost = url.hostname.toLowerCase();
    refreshPath = url.pathname;
  } catch {
    // An unparseable refresh URL leaves host and path empty: no signature can match.
  }
  const minutes = Number(env.YTQ_POLL_MINUTES);
  const dataDir =
    (env.YTQ_CASE_STUDY_DIR || '').trim() ||
    (env.NODE_ENV === 'production' ? '/data/ytq-case-studies' : join(process.cwd(), '.ytq-case-studies'));
  return {
    enabled: (env.YTQ_CASE_STUDIES || '').trim().toLowerCase() === 'on' && endpointAllowed(feedEndpoint),
    secretKey: (env.YTQ_SECRET_KEY || '').trim(),
    feedEndpoint,
    dataDir,
    siteUrl: SITE_URL,
    refreshUrl,
    refreshHost,
    refreshPath,
    pollMinutes: Number.isFinite(minutes) && minutes >= 5 ? Math.floor(minutes) : 60,
    accountId: (env.YTQ_ACCOUNT_ID || '').trim(),
  };
}
