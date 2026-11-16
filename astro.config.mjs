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
      // /case-studies is left out: YourTradeQuotes case studies are rendered at
      // request time and listed by their own sitemap,
      // /sitemap-case-studies.xml (src/pages/sitemap-case-studies.xml.ts), so a
      // publish appears and a removal disappears without a rebuild. That
      // sitemap is not named in sitemap-index.xml either: the static sitemap
      // files stay exactly as they were, and the owner submits it in Search
      // Console when the kit is switched on (DEPLOY.md).
      filter: (page) => !page.includes('/training-manual') && !page.includes('/lp/') && !page.includes('/case-studies'),
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
    // Hard Landscaping retired: former case studies go to /projects.
    '/projects/landscape-guildford': '/projects',
    '/projects/complete-landscape': '/projects',
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
    '/project-landscape-guildford': '/projects',
    '/project-concrete-base-cobham': '/projects/concrete-base-cobham',
    '/project-complete-landscape': '/projects',
  },
});
