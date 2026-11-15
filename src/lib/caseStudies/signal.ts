// The "fetch now" signal from YourTradeQuotes, verified exactly as YTQ's
// reference receiver verifyRefreshSignal does (functions/caseStudySignal.js,
// PR #295 at d98b030, which follows Case Study Core spec/feed.md section 4):
//
//   POST <refresh URL>, header x-ytq-signature: <64 lower-case hex>
//   body {"account":"<uid>","timestamp":<unix seconds>,"nonce":"<32 lower-case hex>"}
//   signing_key = HMAC-SHA256(secret_key, "ytq-refresh-v1")
//   signature   = HMAC-SHA256(signing_key,
//                   "POST|" + host + "|" + path + "|" + timestamp + "|" + nonce + "|" + account)
//
// host and path are this site's own refresh URL (config), never the request's
// Host header, so a signal made for another site on the same account fails.
// 300-second window, nonce format and replay, constant-time comparison. The
// body carries no content: a good signal only makes the site do what its timer
// would have done.

import { createHmac, timingSafeEqual } from 'node:crypto';

export const SIGNING_CONTEXT = 'ytq-refresh-v1';
export const SIGNATURE_HEADER = 'x-ytq-signature';
export const WINDOW_SECONDS = 300;
export const NONCE_PATTERN = /^[0-9a-f]{32}$/;
/** Beyond YTQ's reference: a ceiling so a flood of good signals cannot grow memory. */
export const MAX_NONCES = 10000;

export function deriveSigningKey(secretKey: string): Buffer {
  return createHmac('sha256', String(secretKey)).update(SIGNING_CONTEXT).digest();
}

export interface SignInput {
  secretKey: string;
  host: string;
  path: string;
  timestamp: number;
  nonce: string;
  account: string;
}

export function signingString(input: Omit<SignInput, 'secretKey'>): string {
  return `POST|${String(input.host).toLowerCase()}|${input.path}|${input.timestamp}|${input.nonce}|${input.account}`;
}

export function signRefresh(input: SignInput): string {
  return createHmac('sha256', deriveSigningKey(input.secretKey)).update(signingString(input)).digest('hex');
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export interface VerifyInput {
  secretKey: string;
  host: string;
  path: string;
  headers: Record<string, string | null | undefined>;
  body: unknown;
  nowSeconds: number;
  /** nonce -> the timestamp it arrived with. */
  seenNonces: Map<string, number>;
  expectedAccount?: string;
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export function verifyRefreshSignal(input: VerifyInput): VerifyResult {
  const { secretKey, host, path, headers, body, nowSeconds, seenNonces, expectedAccount } = input;
  if (!secretKey || !host || !path) return { ok: false, reason: 'not_configured' };
  const signature = String(headers[SIGNATURE_HEADER] || '');
  if (!/^[0-9a-f]{64}$/.test(signature)) return { ok: false, reason: 'signature_format' };
  let parsed: unknown = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch {
      return { ok: false, reason: 'body' };
    }
  }
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'body' };
  const { account, timestamp, nonce } = parsed as { account?: unknown; timestamp?: unknown; nonce?: unknown };
  if (typeof account !== 'string' || !account || (expectedAccount && account !== expectedAccount)) {
    return { ok: false, reason: 'account' };
  }
  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - (timestamp as number)) > WINDOW_SECONDS) {
    return { ok: false, reason: 'stale' };
  }
  if (typeof nonce !== 'string' || !NONCE_PATTERN.test(nonce)) return { ok: false, reason: 'nonce_format' };
  const expected = signRefresh({ secretKey, host, path, timestamp: timestamp as number, nonce, account });
  if (!timingSafeHexEqual(expected, signature)) return { ok: false, reason: 'signature' };
  for (const [seen, at] of seenNonces) if (nowSeconds - at > WINDOW_SECONDS) seenNonces.delete(seen);
  if (seenNonces.has(nonce)) return { ok: false, reason: 'replay' };
  if (seenNonces.size >= MAX_NONCES) return { ok: false, reason: 'busy' };
  seenNonces.set(nonce, timestamp as number);
  return { ok: true };
}
