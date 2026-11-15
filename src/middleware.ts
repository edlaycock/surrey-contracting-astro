import { defineMiddleware } from 'astro:middleware';
import { ensurePoller } from './lib/caseStudies/poller.ts';

// Starts the YourTradeQuotes case-study safety poll on the first request the
// running server handles (src/lib/caseStudies/poller.ts). Never during the
// build: prerendered pages skip it. Inert unless YTQ_CASE_STUDIES=on and
// YTQ_SECRET_KEY are set. Changes nothing about any response.
export const onRequest = defineMiddleware((context, next) => {
  if (!context.isPrerendered) {
    try {
      ensurePoller();
    } catch {
      console.error('[case-studies] poller did not start');
    }
  }
  return next();
});
