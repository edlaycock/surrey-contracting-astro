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
});
