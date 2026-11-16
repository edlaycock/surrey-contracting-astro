import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readConfig } from '../../../lib/caseStudies/config.ts';
import { mediaDir, readPublishedState, referencedFiles } from '../../../lib/caseStudies/store.ts';

// Photos of live YTQ case studies, from the site's own store. A file is served
// only while a live case study references it and the kit is switched on: once
// a tombstone arrives, or the kit is switched off, it is gone from here at once.
export const prerender = false;

const NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{7,63}-[0-9a-f]{12}(-w\d{3,4})?\.(jpg|png)$/;
const notFound = () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });

export const GET: APIRoute = async ({ params, request }) => {
  const name = String(params.file || '');
  if (!NAME.test(name)) return notFound();
  const config = readConfig();
  if (!referencedFiles(readPublishedState(config)).has(name)) return notFound();
  // The name carries the ref, the start of the photo's hash and the width, so
  // it changes whenever the bytes do: it is the validator.
  const etag = `"${name}"`;
  const cacheHeaders = { etag, 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' };
  const match = request.headers.get('if-none-match');
  if (match && match.split(',').map((t) => t.trim().replace(/^W\//, '')).includes(etag)) {
    return new Response(null, { status: 304, headers: cacheHeaders });
  }
  try {
    const bytes = await readFile(join(mediaDir(config.dataDir), name));
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': name.endsWith('.png') ? 'image/png' : 'image/jpeg',
        ...cacheHeaders,
      },
    });
  } catch {
    return notFound();
  }
};
