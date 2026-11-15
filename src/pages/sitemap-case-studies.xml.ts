import type { APIRoute } from 'astro';
import { readConfig } from '../lib/caseStudies/config.ts';
import { liveEntries, readPublishedState } from '../lib/caseStudies/store.ts';
import { pageUrl } from '../lib/caseStudies/sync.ts';

// Published YTQ case studies, read from the store at request time, so a
// publish appears and a tombstone disappears without a rebuild. Not named in
// the static sitemap-index.xml (astro.config.mjs): submitted in Search Console
// when the kit is switched on. With no case studies, or the kit switched off,
// it is a valid, empty urlset.
export const prerender = false;

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = () => {
  const config = readConfig();
  const live = liveEntries(readPublishedState(config));
  const urls: string[] = [];
  if (live.length) {
    const newest = live.map((e) => e.record.modified_at).sort().at(-1) as string;
    urls.push(`<url><loc>${xml(`${config.siteUrl}/case-studies`)}</loc><lastmod>${xml(newest)}</lastmod></url>`);
    for (const e of [...live].sort((a, b) => a.slug.localeCompare(b.slug))) {
      urls.push(`<url><loc>${xml(pageUrl(config, e.slug))}</loc><lastmod>${xml(e.record.modified_at)}</lastmod></url>`);
    }
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
  return new Response(body, { status: 200, headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'no-cache' } });
};
