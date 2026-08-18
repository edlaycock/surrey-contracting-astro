// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://surreycontracting.co.uk',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/training-manual') &&
        !page.includes('/lp/') &&
        // Temporary noindex review copy of /groundworks — remove this exclusion
        // when src/pages/groundworks-review.astro is deleted after approval.
        !page.includes('/groundworks-review'),
    }),
  ],
  // Static by default; only routes that opt out (api/contact) run server-side.
  adapter: node({ mode: 'standalone' }),
  security: { checkOrigin: false },
  redirects: {
    // Surfacing removed from the business (Deployment 1) — permanent redirects.
    '/surfacing': '/groundworks',
    '/lp/surfacing': '/groundworks',
    '/projects/tarmac-driveway': '/projects',
    '/projects/tarmac-driveway-fetcham': '/projects',
    '/projects/tarmac-repairs-sutton': '/projects',
    // Canonical sitemap entry point (the generated files keep their names).
    '/sitemap.xml': '/sitemap-index.xml',
    // Legacy pre-rebuild URLs. Former surfacing project URLs go straight to
    // /projects (avoids a 301 chain through the removed case-study pages).
    '/project-tarmac-driveway': '/projects',
    '/project-tarmac-driveway-fetcham': '/projects',
    '/project-tarmac-repairs-sutton': '/projects',
    '/project-southbank-centre': '/projects/southbank-centre',
    '/project-site-clearance-earthworks': '/projects/site-clearance-earthworks',
    '/project-domestic-earthworks': '/projects/domestic-earthworks',
    '/project-drainage-ascot': '/projects/drainage-ascot',
    '/project-landscape-guildford': '/projects/landscape-guildford',
    '/project-concrete-base-cobham': '/projects/concrete-base-cobham',
    '/project-complete-landscape': '/projects/complete-landscape',
  },
});
