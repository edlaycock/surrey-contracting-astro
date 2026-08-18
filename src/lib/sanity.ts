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

export type GalleryImage = {
  asset: unknown;
  alt?: string;
  caption?: string;
};

export type Project = {
  _id: string;
  title: string;
  slug: string;
  categories?: string[];
  sector?: string;
  client?: string;
  location?: string;
  services?: string;
  year?: string;
  duration?: string;
  status?: string;
  summary?: string;
  heroImage?: unknown;
  gallery?: GalleryImage[];
  body?: unknown;
  featured?: boolean;
};

const PROJECT_FIELDS = `
  _id, title, "slug": slug.current, categories, sector, client, location,
  services, year, duration, status, summary, heroImage, featured
`;

// Surfacing has been removed from the business (Deployment 1). These case
// studies are unpublished in Sanity by hand; the query filter is the code-side
// safety net so they can never resurface if the documents are restored.
const SURFACING_SLUGS = ['tarmac-driveway', 'tarmac-driveway-fetcham', 'tarmac-repairs-sutton'];
const SURFACING_CATEGORIES = ['Surfacing', 'Driveways'];
const SURFACING_TERMS = /surfacing|tarmac|resin/i;

// Mixed projects (e.g. Southbank Centre) are retained but must not display
// surfacing categories or service labels.
function stripSurfacing(p: Project): Project {
  return {
    ...p,
    categories: p.categories?.filter((c) => !SURFACING_CATEGORIES.includes(c)),
    services: p.services
      ?.split('·')
      .map((sv) => sv.trim())
      .filter((sv) => sv && !SURFACING_TERMS.test(sv))
      .join(' · '),
  };
}

// Fail-fast timeout so a hanging/blocked network never stalls the build.
const FETCH_TIMEOUT_MS = 8000;

// Defensive: if Sanity is unreachable or the dataset is empty, return safe
// defaults so the static build never fails.
export async function getProjects(): Promise<Project[]> {
  if (process.env.SANITY_DISABLE === '1') return [];
  try {
    const projects: Project[] = await sanity.fetch(
      `*[_type == "project" && !(_id in path("drafts.**"))
          && !(slug.current in $surfacingSlugs)]
        | order(coalesce(order, 999) asc, _createdAt desc){${PROJECT_FIELDS}}`,
      { surfacingSlugs: SURFACING_SLUGS },
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );
    return projects.map(stripSurfacing);
  } catch (err) {
    console.warn('[sanity] getProjects failed — rendering fallback:', (err as Error)?.message);
    return [];
  }
}

export async function getProject(slug: string): Promise<Project | null> {
  if (process.env.SANITY_DISABLE === '1') return null;
  if (SURFACING_SLUGS.includes(slug)) return null;
  try {
    const project: Project | null = await sanity.fetch(
      `*[_type == "project" && slug.current == $slug][0]{${PROJECT_FIELDS}, gallery, body}`,
      { slug },
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );
    return project ? stripSurfacing(project) : null;
  } catch (err) {
    console.warn('[sanity] getProject failed:', (err as Error)?.message);
    return null;
  }
}
