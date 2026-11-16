// What a case study page and the listing show, worked out from a stored live
// entry (Case Study Core spec/rendering.md, default layout of section 9):
// the first before-and-after pair side by side under the title (else the
// hero), the story in one reading column, further pairs, then the gallery
// with the hero when a pair took the top slot. Pure, so it is tested without
// a server. The .astro pages only lay this out with the site's own styles.

import type { Entry, LiveEntry, StoredPhoto, StoredPhotoMeta as CasePhoto, StoredRecord } from './store.ts';
import { mediaUrlPath } from './sync.ts';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-10" -> "October 2026". */
export function monthInWords(month: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month || '');
  if (!m) return '';
  const index = Number(m[2]) - 1;
  return MONTHS[index] ? `${MONTHS[index]} ${m[1]}` : '';
}

/** A line break (LF, CR LF or CR) starts a new paragraph; a tab reads as a space. */
export function paragraphs(text: string): string[] {
  return String(text || '')
    .split(/\r\n|\r|\n/)
    .map((p) => p.replace(/\t/g, ' ').trim())
    .filter(Boolean);
}

export interface MetaLine { service: string; town: string | null; month: string }

export function metaLine(record: StoredRecord): MetaLine {
  return {
    service: record.service_category,
    town: record.location?.show_town && record.location.town ? record.location.town : null,
    month: monthInWords(record.completed_month),
  };
}

export interface ImageView {
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
  caption: string | null;
  role: CasePhoto['role'];
}

export function imageView(photo: CasePhoto, stored: StoredPhoto): ImageView {
  const sources = [...stored.variants]
    .sort((a, b) => a.width - b.width)
    .map((v) => ({ url: mediaUrlPath(v.file), width: v.width }));
  // The derivative itself is offered at its own width when it is no wider
  // than 1600, and as the src (the largest) in every case.
  if (stored.width <= 1600 || sources.length === 0) sources.push({ url: mediaUrlPath(stored.file), width: stored.width });
  return {
    src: mediaUrlPath(stored.file),
    srcset: sources.map((s) => `${s.url} ${s.width}w`).join(', '),
    width: photo.width,
    height: photo.height,
    alt: photo.alt,
    caption: photo.caption ?? null,
    role: photo.role,
  };
}

export interface PairView { before: ImageView; after: ImageView; number: number }

export interface PageLayout {
  top: { kind: 'pair'; pair: PairView } | { kind: 'hero'; image: ImageView };
  pairs: PairView[];
  gallery: ImageView[];
  hero: ImageView;
}

export function pageLayout(entry: LiveEntry): PageLayout {
  const record = entry.record;
  const view = (photo: CasePhoto) => imageView(photo, entry.photos[photo.ref]);
  const byOrder = [...record.photos].sort((a, b) => a.order - b.order);
  const hero = record.photos.find((p) => p.role === 'hero') as CasePhoto;
  const numbers = [...new Set(byOrder.filter((p) => typeof p.pair === 'number').map((p) => p.pair as number))].sort((a, b) => a - b);
  const pairs: PairView[] = [];
  const paired = new Set<string>();
  for (const number of numbers) {
    const before = byOrder.find((p) => p.pair === number && p.role === 'before');
    const after = byOrder.find((p) => p.pair === number && p.role === 'after');
    if (!before || !after) continue;
    paired.add(before.ref);
    paired.add(after.ref);
    pairs.push({ before: view(before), after: view(after), number });
  }
  const top = pairs.length ? { kind: 'pair' as const, pair: pairs[0] } : { kind: 'hero' as const, image: view(hero) };
  const gallery = byOrder
    .filter((p) => !paired.has(p.ref))
    .filter((p) => p.role !== 'hero' || pairs.length > 0)
    .map(view);
  return { top, pairs: pairs.slice(1), gallery, hero: view(hero) };
}

/** The hero's copy nearest 1200 wide, for og:image. */
export function socialImage(entry: LiveEntry): { url: string; width: number; height: number; alt: string } {
  const hero = entry.record.photos.find((p) => p.role === 'hero') as CasePhoto;
  const stored = entry.photos[hero.ref];
  const options = [...stored.variants, { width: stored.width, file: stored.file }];
  const best = options.reduce((a, b) => (Math.abs(b.width - 1200) < Math.abs(a.width - 1200) ? b : a));
  return {
    url: mediaUrlPath(best.file),
    width: best.width,
    height: Math.round((hero.height * best.width) / hero.width),
    alt: hero.alt,
  };
}

export interface CardView {
  slug: string;
  title: string;
  excerpt: string;
  meta: MetaLine;
  service: string;
  image: ImageView;
  publishedAt: string;
}

export function cardView(entry: LiveEntry): CardView {
  const hero = entry.record.photos.find((p) => p.role === 'hero') as CasePhoto;
  return {
    slug: entry.slug,
    title: entry.record.title,
    excerpt: entry.record.excerpt,
    meta: metaLine(entry.record),
    service: entry.record.service_category,
    image: imageView(hero, entry.photos[hero.ref]),
    publishedAt: entry.record.published_at,
  };
}

/** spec/rendering.md section 7: a filter by service once there are more than six. */
export const FILTER_THRESHOLD = 6;

export interface ListingView {
  cards: CardView[];
  filters: { service: string; href: string; current: boolean }[] | null;
  allHref: string;
  selected: string | null;
}

export function listingView(entries: LiveEntry[], selected: string | null): ListingView {
  const all = entries.map(cardView).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : a.slug.localeCompare(b.slug)));
  const services = [...new Set(all.map((c) => c.service))].sort((a, b) => a.localeCompare(b));
  if (all.length <= FILTER_THRESHOLD) return { cards: all, filters: null, allHref: '/case-studies', selected: null };
  const chosen = selected && services.includes(selected) ? selected : null;
  return {
    cards: chosen ? all.filter((c) => c.service === chosen) : all,
    filters: services.map((service) => ({
      service,
      href: `/case-studies?service=${encodeURIComponent(service)}`,
      current: service === chosen,
    })),
    allHref: '/case-studies',
    selected: chosen,
  };
}

export type SlugLookup =
  | { kind: 'live'; entry: LiveEntry }
  | { kind: 'moved'; slug: string }
  | { kind: 'gone' }
  | { kind: 'none' };

/** What a /case-studies/<slug> request answers: the page, a 301, 410 Gone, or 404. */
export function lookupSlug(entries: Iterable<Entry>, slug: string): SlugLookup {
  const list = [...entries];
  const live = list.filter((e): e is LiveEntry => e.kind === 'live');
  const current = live.find((e) => e.slug === slug);
  if (current) return { kind: 'live', entry: current };
  const moved = live.find((e) => e.priorSlugs.includes(slug));
  if (moved) return { kind: 'moved', slug: moved.slug };
  if (list.some((e) => e.kind === 'removed' && e.slugs.includes(slug))) return { kind: 'gone' };
  return { kind: 'none' };
}
