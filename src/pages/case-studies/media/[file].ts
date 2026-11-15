import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readConfig } from '../../../lib/caseStudies/config.ts';
import { mediaDir, readStateForPages, referencedFiles } from '../../../lib/caseStudies/store.ts';

// Photos of live YTQ case studies, from the site's own store. A file is served
// only while a live case study references it: once a tombstone arrives it is
// gone from here at once, whether or not the file has been deleted yet.
export const prerender = false;

const NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{7,63}-[0-9a-f]{12}(-w\d{3,4})?\.(jpg|png)$/;
const notFound = () => new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });

export const GET: APIRoute = async ({ params }) => {
  const name = String(params.file || '');
  if (!NAME.test(name)) return notFound();
  const config = readConfig();
  if (!referencedFiles(readStateForPages(config.dataDir)).has(name)) return notFound();
  try {
    const bytes = await readFile(join(mediaDir(config.dataDir), name));
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': name.endsWith('.png') ? 'image/png' : 'image/jpeg',
        'cache-control': 'public, max-age=300',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return notFound();
  }
};
