// The site context the core's JSON-LD builder needs (Case Study Core
// spec/jsonld.md section 1). The business details are the ones the site
// already publishes in BaseLayout.astro's LocalBusiness block; a test checks
// the two agree. @id becomes https://surreycontracting.co.uk/#business, the
// same node BaseLayout emits, so the page carries one business, not two.

import type { CaseStudyConfig } from './config.ts';
import type { LiveEntry } from './store.ts';
import { mediaUrlPath, pageUrl } from './sync.ts';

export const BUSINESS = {
  name: 'Surrey Contracting Limited',
  type: 'HomeAndConstructionBusiness',
  logoPath: '/assets/logo-color.png',
  address: {
    street_address: 'Unit 3, Tannery House, Tannery Lane, Send',
    locality: 'Woking',
    region: 'Surrey',
    postal_code: 'GU23 7EF',
    country: 'GB',
  },
} as const;

export function siteContext(entry: LiveEntry, config: CaseStudyConfig) {
  const images: Record<string, string> = {};
  for (const photo of entry.record.photos) {
    images[photo.ref] = `${config.siteUrl}${mediaUrlPath(entry.photos[photo.ref].file)}`;
  }
  return {
    page_url: pageUrl(config, entry.slug),
    language: 'en-GB',
    business: {
      name: BUSINESS.name,
      url: `${config.siteUrl}/`,
      logo_url: `${config.siteUrl}${BUSINESS.logoPath}`,
      type: BUSINESS.type,
      address: { ...BUSINESS.address },
    },
    images,
  };
}
