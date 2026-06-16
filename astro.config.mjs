// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://surreycontracting.co.uk',
  integrations: [sitemap()],
  // Static by default; only routes that opt out (api/contact) run server-side.
  adapter: node({ mode: 'standalone' }),
  redirects: {
    '/project-tarmac-driveway': '/projects/tarmac-driveway',
    '/project-tarmac-driveway-fetcham': '/projects/tarmac-driveway-fetcham',
    '/project-tarmac-repairs-sutton': '/projects/tarmac-repairs-sutton',
    '/project-southbank-centre': '/projects/southbank-centre',
    '/project-site-clearance-earthworks': '/projects/site-clearance-earthworks',
    '/project-domestic-earthworks': '/projects/domestic-earthworks',
    '/project-drainage-ascot': '/projects/drainage-ascot',
    '/project-landscape-guildford': '/projects/landscape-guildford',
    '/project-concrete-base-cobham': '/projects/concrete-base-cobham',
    '/project-complete-landscape': '/projects/complete-landscape',
  },
});
