#!/usr/bin/env node
/**
 * Drift test for the vendored Case Study Core (vendor/caseStudyCore).
 * Run: npm run test:case-study-core. Also runs in postbuild, so the Docker
 * image is never built from a copy that differs from the pin.
 *
 * The copy is taken whole from YTQ's functions/caseStudyCore (itself a copy of
 * the core repository's core/ at a tag) and must match its manifest file for
 * file, and the manifest's tree hash must match vendor/caseStudyCore.pin.json.
 * Same check as YTQ's functions/caseStudyCore.test.ts (core spec/versioning.md
 * section 5). Nobody can edit, add or drop a vendored file, or swap the core
 * version, without this failing or the pin file changing in the same diff.
 *
 * It then runs every core fixture through the vendored Node code, so a Node
 * runtime difference shows up here and not on the live site.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', 'vendor', 'caseStudyCore');
const pin = JSON.parse(readFileSync(join(here, '..', 'vendor', 'caseStudyCore.pin.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const sha = (data) => createHash('sha256').update(data).digest('hex');

const failures = [];
const fail = (msg) => failures.push(msg);

const walk = (dir, out = []) => {
  for (const name of readdirSync(join(root, dir))) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const rel = `${dir}/${name}`;
    if (statSync(join(root, rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
};
// Byte order of path, as LC_ALL=C sort gives (spec/versioning.md section 3).
const byteOrder = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));

const files = ['schema', 'fixtures', 'spec', 'js', 'php'].flatMap((dir) => walk(dir)).sort(byteOrder);
const listed = Object.keys(manifest.files).sort(byteOrder);
const missing = listed.filter((f) => !files.includes(f));
const extra = files.filter((f) => !listed.includes(f));
if (missing.length) fail(`missing from the copy: ${missing.join(', ')}`);
if (extra.length) fail(`not in the manifest: ${extra.join(', ')}`);
for (const file of files) {
  if (!(file in manifest.files)) continue;
  if (sha(readFileSync(join(root, file))) !== manifest.files[file]) fail(`changed: ${file}`);
}
const lines = listed.map((file) => `${manifest.files[file]}  ${file}\n`).join('');
if (sha(lines) !== manifest.tree_sha256) fail('manifest tree_sha256 does not match its file list');
if (manifest.tree_sha256 !== pin.tree_sha256) fail('manifest tree_sha256 is not the pinned one');
if (manifest.core_version !== pin.core_version) fail('manifest core_version is not the pinned one');
if (manifest.schema_version !== pin.schema_version) fail('manifest schema_version is not the pinned one');

// Every fixture through the vendored Node code.
const require = createRequire(import.meta.url);
const core = require(join(root, 'js', 'index.js'));
if (core.CORE_VERSION !== pin.core_version) fail(`core reports ${core.CORE_VERSION}, pin says ${pin.core_version}`);
const fixtures = join(root, 'fixtures');
const read = (name) => readFileSync(join(fixtures, name), 'utf8');
let checked = 0;
let jsonld = 0;
for (const name of readdirSync(fixtures).filter((n) => /^(valid|invalid)-.*\.json$/.test(n) && !/\.(feed|jsonld|tombstone)\.json$/.test(n))) {
  const fixture = JSON.parse(read(name));
  if (!fixture || !fixture.record || !fixture.expected) continue;
  const options = Array.isArray(fixture.forbidden_terms) ? { forbiddenTerms: fixture.forbidden_terms } : {};
  const result = core.validateRecord(fixture.record, options);
  const codes = (list) => JSON.stringify((list || []).map((e) => `${e.code} ${e.path}`));
  if (result.valid !== fixture.expected.valid) fail(`${name}: valid ${result.valid}, expected ${fixture.expected.valid}`);
  if (codes(result.errors) !== codes(fixture.expected.errors)) fail(`${name}: errors differ from the fixture`);
  if (codes(result.warnings) !== codes(fixture.expected.warnings)) fail(`${name}: warnings differ from the fixture`);
  if (fixture.jsonld && fixture.jsonld.context && fixture.jsonld.script_file) {
    const context = JSON.parse(read(fixture.jsonld.context));
    const tag = core.buildJsonLdScriptTag(fixture.record, context);
    if (tag + '\n' !== read(fixture.jsonld.script_file)) fail(`${name}: script tag differs from ${fixture.jsonld.script_file}`);
    jsonld++;
  }
  checked++;
}
// The feed projection golden file is what this site receives.
{
  const full = JSON.parse(read('valid-full.json'));
  const projected = core.canonicalJson(core.feedProjection(full.record));
  if (projected + '\n' !== read('valid-full.feed.json')) fail('feed projection differs from valid-full.feed.json');
}

if (failures.length) {
  console.error('\ncheck-case-study-core: FAILED');
  for (const f of failures) console.error(' - ' + f);
  process.exit(1);
}
console.log(`check-case-study-core: ${files.length} files match manifest ${manifest.tree_sha256.slice(0, 12)}… (core ${manifest.core_version}), ${checked} fixtures validated, ${jsonld} JSON-LD script tags byte for byte`);
