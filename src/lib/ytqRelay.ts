// Server-only relay of website enquiries to YourTradeQuotes (YTQ).
//
// /api/contact calls forwardToYtq after its own validation and honeypot check,
// without awaiting it, so the visitor's response is never delayed or changed by
// YTQ. The secret key comes from the YTQ_SECRET_KEY environment variable on the
// server (never page code, never the repo). Contract: YTQ's
// docs/ENQUIRY-CONNECTOR.md, "Mode 3: server to server".
//
// Never log the key or the payload: log the outcome and status only.
//
// This file is imported directly by scripts/check-ytq-relay.mjs under Node's
// type stripping, so keep it to erasable TypeScript (no enums, namespaces or
// parameter properties) and keep imports extension-explicit.

export const YTQ_DEFAULT_ENDPOINT =
  'https://europe-west2-yourtradequotes.cloudfunctions.net/submitEnquiry';

export interface ContactFields {
  name?: string;
  email?: string;
  phone?: string;
  postcode?: string;
  message?: string;
  company?: string;
  /** The svc checkboxes, already read from the form. */
  svc?: string[] | string;
  /** "Where did you hear about us?" (the form's `source` select). */
  source?: string;
  /** pathname + query from app.js, or the Referer as a fallback. */
  page?: string;
  /** The form's data-lead-source, appended by app.js when present. */
  leadSource?: string;
}

export type YtqPayload = Record<string, string>;

/** Campaign label when the form carries no data-lead-source. */
export function campaignFromPage(page: string | undefined): string {
  let path = '';
  try {
    path = new URL(page || '/', 'https://surreycontracting.co.uk').pathname;
  } catch {
    path = '/';
  }
  path = path.replace(/\/+$/, '');
  if (path === '') return 'homepage';
  if (path === '/contact') return 'contact';
  const slug = path.replace(/^\/+/, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  return slug || 'homepage';
}

export function buildYtqPayload(fields: ContactFields): YtqPayload {
  const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const svc = Array.isArray(fields.svc) ? fields.svc : fields.svc ? [fields.svc] : [];
  const services = svc.map(clean).filter(Boolean).join(', ');

  const out: YtqPayload = { source: 'Website' };
  const put = (key: string, value: string) => {
    if (value) out[key] = value;
  };
  put('name', clean(fields.name));
  put('email', clean(fields.email));
  put('phone', clean(fields.phone));
  put('postcode', clean(fields.postcode));
  put('message', clean(fields.message));
  put('services', services);
  put('company', clean(fields.company));
  // Sent as heardVia, not source: YTQ reads `source` as the channel ("Website").
  put('heardVia', clean(fields.source));
  put('sourcePage', clean(fields.page));
  put('sourceCampaign', clean(fields.leadSource) || campaignFromPage(clean(fields.page)));
  return out;
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;
type Logger = { log: (msg: string) => void; error: (msg: string) => void };

export interface ForwardOptions {
  key?: string;
  endpoint?: string;
  fetchImpl?: FetchLike;
  logger?: Logger;
  /** Per-attempt timeout. */
  timeoutMs?: number;
  /** Waits before retries 1, 2 and 3; the length sets the retry count. */
  backoffMs?: number[];
  /** Upper bound on any wait, including one asked for by Retry-After. */
  maxWaitMs?: number;
}

export interface ForwardResult {
  delivered: boolean;
  skipped?: boolean;
  status?: number;
  attempts: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function retryAfterMs(res: Response): number | null {
  const h = res.headers.get('retry-after');
  if (!h) return null;
  const secs = Number(h);
  if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  const at = Date.parse(h);
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now());
}

export async function forwardToYtq(payload: YtqPayload, opts: ForwardOptions = {}): Promise<ForwardResult> {
  const logger = opts.logger ?? console;
  const key = opts.key;
  if (!key) {
    logger.log('YTQ relay skipped: YTQ_SECRET_KEY not set');
    return { delivered: false, skipped: true, attempts: 0 };
  }
  const endpoint = opts.endpoint || YTQ_DEFAULT_ENDPOINT;
  const doFetch: FetchLike = opts.fetchImpl ?? ((url, init) => fetch(url, init));
  const timeoutMs = opts.timeoutMs ?? 5000;
  const backoff = opts.backoffMs ?? [1000, 3000, 9000];
  const maxWaitMs = opts.maxWaitMs ?? 30000;
  // One key per submission, reused on every retry, so a retry after a timeout
  // that YTQ did process returns the first enquiry instead of writing a second.
  const idempotencyKey = globalThis.crypto.randomUUID();
  const body = JSON.stringify(payload);
  const maxAttempts = backoff.length + 1;

  let lastStatus: number | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let waitMs = backoff[attempt - 1] ?? 0;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ytq-api-key': key,
          'idempotency-key': idempotencyKey,
        },
        body,
        signal: controller.signal,
      });
      lastStatus = res.status;
      // Drain the body so the connection is released; its content is not logged.
      await res.arrayBuffer().catch(() => undefined);
      if (res.ok) {
        logger.log(`YTQ relay delivered: status ${res.status}, attempt ${attempt}`);
        return { delivered: true, status: res.status, attempts: attempt };
      }
      // Only 429 and 5xx are worth another attempt. 400, 401, 403 and 413 (and
      // any other 4xx) fail the same way every time.
      if (!(res.status === 429 || res.status >= 500)) {
        logger.error(`YTQ relay refused: status ${res.status}, not retried`);
        return { delivered: false, status: res.status, attempts: attempt };
      }
      const asked = retryAfterMs(res);
      if (asked !== null) waitMs = Math.max(waitMs, asked);
      if (attempt < maxAttempts) logger.log(`YTQ relay retrying: status ${res.status}, attempt ${attempt}`);
    } catch {
      lastStatus = undefined;
      const reason = controller.signal.aborted ? 'timeout' : 'network error';
      if (attempt < maxAttempts) logger.log(`YTQ relay retrying: ${reason}, attempt ${attempt}`);
      else logger.error(`YTQ relay failed: ${reason} on attempt ${attempt}`);
    } finally {
      clearTimeout(timer);
    }
    if (attempt < maxAttempts) await sleep(Math.min(waitMs, maxWaitMs));
  }
  if (lastStatus !== undefined) logger.error(`YTQ relay failed: status ${lastStatus} after ${maxAttempts} attempts`);
  return { delivered: false, status: lastStatus, attempts: maxAttempts };
}
