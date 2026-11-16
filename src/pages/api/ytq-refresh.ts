import type { APIRoute } from 'astro';
import { readConfig } from '../../lib/caseStudies/config.ts';
import { SIGNATURE_HEADER, verifyRefreshSignal } from '../../lib/caseStudies/signal.ts';
import { pollerState, requestSync } from '../../lib/caseStudies/poller.ts';
import { readStateForPages } from '../../lib/caseStudies/store.ts';

// YourTradeQuotes' signed "fetch now" signal (Case Study Core spec/feed.md
// section 4). The URL to register in YTQ Settings, Integrations, is
// https://surreycontracting.co.uk/api/ytq-refresh (YTQ_REFRESH_URL).
// 202 to a good signal, then the feed is pulled; a plain 401 to anything
// else, with no detail. The body carries no content, so a good signal only
// makes the site do what its hourly timer would have done.
export const prerender = false;

const MAX_BODY = 2048;
const unauthorized = () => new Response(null, { status: 401, headers: { 'cache-control': 'no-store' } });

async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY || !request.body) return null;
  // Read at most MAX_BODY bytes, whatever the headers say (a chunked body has none).
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  return Buffer.concat(chunks).toString('utf8');
}

export const POST: APIRoute = async ({ request }) => {
  const config = readConfig();
  if (!config.enabled || !config.secretKey) return unauthorized();
  const body = await readBody(request);
  if (body === null) return unauthorized();
  const result = verifyRefreshSignal({
    secretKey: config.secretKey,
    host: config.refreshHost,
    path: config.refreshPath,
    headers: { [SIGNATURE_HEADER]: request.headers.get(SIGNATURE_HEADER) },
    body,
    nowSeconds: Math.floor(Date.now() / 1000),
    seenNonces: pollerState().nonces,
    expectedAccount: config.accountId || readStateForPages(config.dataDir).account || undefined,
  });
  if (!result.ok) return unauthorized();
  void requestSync('signal', config);
  return new Response(null, { status: 202, headers: { 'cache-control': 'no-store' } });
};

export const ALL: APIRoute = () => unauthorized();
