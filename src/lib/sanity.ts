import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'mhqgpyb9';
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';

export const sanity: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-01',
  // Use the CDN endpoint (apicdn.sanity.io) for build-time reads. The Sanity
  // publish webhook triggers the rebuild, by which point the CDN is current.
  useCdn: true,
});

const builder = imageUrlBuilder(sanity);
export const urlFor = (source: unknown) => builder.image(source as never);

export type Project = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  location?: string;
  client?: string;
  summary?: string;
  heroImage?: unknown;
  gallery?: unknown[];
  body?: unknown;
  featured?: boolean;
};

const PROJECT_FIELDS = `
  _id, title, "slug": slug.current, category, location, client, summary,
  heroImage, featured
`;

// Fail-fast timeout so a hanging/blocked network never stalls the build.
const FETCH_TIMEOUT_MS = 8000;

// Defensive: if Sanity is unreachable or the dataset is empty, return safe
// defaults so the static build never fails.
export async function getProjects(): Promise<Project[]> {
  if (process.env.SANITY_DISABLE === '1') return [];
  try {
    return await sanity.fetch(
      `*[_type == "project" && !(_id in path("drafts.**"))]
        | order(coalesce(order, 999) asc, _createdAt desc){${PROJECT_FIELDS}}`,
      {},
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );
  } catch (err) {
    console.warn('[sanity] getProjects failed — rendering fallback:', (err as Error)?.message);
    return [];
  }
}

export async function getProject(slug: string): Promise<Project | null> {
  if (process.env.SANITY_DISABLE === '1') return null;
  try {
    return await sanity.fetch(
      `*[_type == "project" && slug.current == $slug][0]{${PROJECT_FIELDS}, gallery, body}`,
      { slug },
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );
  } catch (err) {
    console.warn('[sanity] getProject failed:', (err as Error)?.message);
    return null;
  }
}
