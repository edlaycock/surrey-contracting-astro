// The vendored Case Study Core (vendor/caseStudyCore, pinned by hash in
// vendor/caseStudyCore.pin.json and checked by scripts/check-case-study-core.mjs).
// It is CommonJS with no dependencies, so it is loaded with require at run time
// rather than bundled: the same files the drift test hashes are the ones that
// run. The runtime image copies vendor/caseStudyCore (Dockerfile).

import { createRequire } from 'node:module';
import { join } from 'node:path';

export interface CoreIssue { code: string; path: string; message: string }
export interface CoreResult { valid: boolean; errors: CoreIssue[]; warnings: CoreIssue[] }

export interface CasePhoto {
  ref: string;
  role: 'hero' | 'before' | 'after' | 'other';
  alt: string;
  caption?: string;
  order: number;
  pair?: number;
  width: number;
  height: number;
  sha256: string;
}
export interface CaseSection { key: string; question: string; answer: string }
export interface CaseFaq { question: string; answer: string }
export interface CaseRecord {
  schema_version: number;
  id: string;
  version: number;
  status: string;
  title: string;
  slug: string;
  excerpt: string;
  service_category: string;
  location: { town: string; show_town: boolean };
  completed_month: string;
  sections: CaseSection[];
  faqs?: CaseFaq[];
  photos: CasePhoto[];
  published_at: string;
  modified_at: string;
  [key: string]: unknown;
}

export interface Core {
  SCHEMA_VERSION: number;
  CORE_VERSION: string;
  decode(json: string): unknown;
  assertPublishable(record: unknown, options?: unknown): CoreResult;
  validateRecord(record: unknown, options?: unknown): CoreResult;
  buildJsonLdScriptTag(record: unknown, context: unknown): string;
  photosInDisplayOrder(photos: CasePhoto[]): CasePhoto[];
}

export function coreDir(): string {
  return process.env.YTQ_CORE_DIR || join(process.cwd(), 'vendor', 'caseStudyCore');
}

let loaded: Core | null = null;

export function loadCore(): Core {
  if (!loaded) {
    const require = createRequire(import.meta.url);
    loaded = require(join(coreDir(), 'js', 'index.js')) as Core;
  }
  return loaded;
}
