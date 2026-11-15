# Versioning and vendoring

Case Study Core, `schema_version: 1`, core version `1.0.0`.

The core is a specification with reference code and fixtures. It lives in this repository under `core/`. It is not published as a package. Each consumer keeps its own copy and proves the copy is unchanged.

## 1. Two version numbers

| Number | Where | Changes when |
|---|---|---|
| `schema_version` | In every record. `1` | The record changes in a way that breaks a reader |
| Core version | `core/manifest.json` and the code constants. `1.0.0` | Anything under `core/` changes |

Core version is `major.minor.patch`. Major always equals `schema_version`.

- **Patch** (1.0.0 to 1.0.1): wording, documentation, a fixed bug in a validator, a new fixture for existing behaviour. No record that was valid becomes invalid unless it was a privacy leak.
- **Minor** (1.0 to 1.1): something added. Two kinds, and they roll out differently (section 2):
  - **Leave-outable:** a new optional field. An older reader never has to see it.
  - **Not leave-outable:** a new value in a required field, such as a new `customer_permission` value or a new `wording_version`. An older reader rejects any record that uses it, and nothing can be left out to help.
  - A new privacy pattern or folding rule is also minor. It changes what passes, not the shape of the record.
- **Major** (1 to 2): a breaking change to the record. A new schema file `case-study.v2.schema.json` beside v1. The YTQ feed serves the version a site asks for, and the plugin states the versions it reads.

## 2. Compatibility rules

1. **Records are strict** (confirmed 14 November 2026). A reader rejects a record with a field or a value it does not know, because "accept anything extra" is exactly how a customer's name would travel.
2. **So readers upgrade first.** The core and every reader (the plugin, the site kit, YTQ's vendored copy) take the new minor version; only then does any producer write the new field or value.
3. **The feed protects older readers, in one of two ways.** A site states the core version it reads (`feed.md`).
   - For a leave-outable change, the feed leaves the new optional field out for a site that does not know it. That is always safe.
   - For a change that is not leave-outable, there is nothing to leave out. The feed **does not send** that site a record using the new value: the case study waits, shown to the trade as "Your website needs an update before this can appear", until the site reports a core version that reads it. Producers do not start using a new permission value or wording version until every connected reader has been upgraded, so in practice this is a safety net and not the normal path.
4. **Privacy patterns may tighten in a minor version.** A record that passed last month can fail today. That is intended. Already-published pages are not unpublished by a pattern change; they are re-checked the next time they are edited.
5. **The consent wording is versioned on its own** (`wording_version`). Changing the text a person agrees to is always a new wording version, never an edit to `v1`. Records keep the version their confirmer saw.
6. **No silent drift.** Neither track ships a change to the record, a template, the JSON-LD or a post format without the fixtures changing in the same pull request.
7. **The two reference implementations are one piece of work.** A change to `core/js` without the matching change to `core/php`, or the other way round, fails `core/run-tests.sh`, which compares their output for every fixture byte for byte.

## 3. The manifest

`core/manifest.json` lists the SHA-256 of every file under `schema/`, `fixtures/`, `spec/`, `js/` and `php/`, and one `tree_sha256` over the whole list. Dotfiles, `node_modules` and package manager lock files are not part of the core and are skipped, so a stray `.DS_Store` does not change the hash.

```json
{
  "core_version": "1.0.0",
  "schema_version": 1,
  "tree_sha256": "…",
  "files": { "schema/case-study.v1.schema.json": "…" }
}
```

`tree_sha256` is the SHA-256 of the lines `<file hash><two spaces><path><newline>` for every file, in byte order of path (what `LC_ALL=C sort` gives). It is the same format `sha256sum` prints, so it can be checked by hand.

After any change under `core/`:

```sh
cd core && node js/tools/update-manifest.js && ./run-tests.sh
```

The tests in both languages fail if the manifest and the files disagree: a changed file, a missing file, an extra file or a wrong tree hash. So a change cannot merge with a stale manifest. All files are stored with LF line endings (`core/.gitattributes`); a checkout that converts line endings would change the hashes.

## 4. How the plugin uses it (Track 1 and the WordPress side of Track 2)

The plugin lives in this repository, so it does not vendor a copy. Its release build copies `core/php/src`, `core/schema` and `core/manifest.json` into the plugin zip, and the plugin loads `core/php/src/autoload.php`. If the layout inside the zip differs, `Files::setSchemaDir()` points the library at the schema directory. The plugin's own tests run `core/php/tests/run.php`.

## 5. How YourTradeQuotes vendors it (Track 2)

YTQ runs Node in Firebase Functions (CommonJS). It takes a copy of the whole `core/` directory:

```
functions/caseStudyCore/        <- a copy of core/ from a tagged commit of this repository
  manifest.json
  schema/  fixtures/  spec/  js/  php/
functions/caseStudyCore.pin.json  <- { "core_version": "1.0.0", "tree_sha256": "…", "source_commit": "…" }
```

The copy is taken whole, PHP included, so the tree hash can be checked without exceptions. It is a few hundred kilobytes. `core/js` has no dependencies and uses `require`, so it loads inside the functions bundle as it is:

```js
const core = require('./caseStudyCore/js');
const result = core.assertPublishable(record, { forbiddenTerms });
```

**The hash-pinning test.** YTQ already pins mirrored files with tests that fail on drift. The same pattern here, in `functions/caseStudyCore.test.ts` (run by the existing Vitest suite):

```ts
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import pin from './caseStudyCore.pin.json';
import manifest from './caseStudyCore/manifest.json';

const root = join(__dirname, 'caseStudyCore');
const sha = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');
const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(join(root, dir))) {
    if (name.startsWith('.')) continue;
    const rel = `${dir}/${name}`;
    if (statSync(join(root, rel)).isDirectory()) walk(rel, out); else out.push(rel);
  }
  return out;
};

it('the vendored Case Study Core is the pinned one, file for file', () => {
  const files = ['schema', 'fixtures', 'spec', 'js', 'php'].flatMap((dir) => walk(dir)).sort(); // skip dotfiles in walk()
  expect(files).toEqual(Object.keys(manifest.files).sort());
  for (const file of files) expect(sha(readFileSync(join(root, file)))).toBe(manifest.files[file]);
  const lines = files.map((file) => `${manifest.files[file]}  ${file}\n`).join('');
  expect(sha(lines)).toBe(manifest.tree_sha256);
  expect(manifest.tree_sha256).toBe(pin.tree_sha256);
  expect(manifest.core_version).toBe(pin.core_version);
});
```

What that buys: nobody can edit a vendored file, drop one, or add one without the test failing; and nobody can swap the whole copy for a different core version without also changing the pin file, which is a one-line diff a reviewer cannot miss.

YTQ also runs the fixtures through its vendored copy in the same suite (`validateRecord` on every `core/fixtures/*.json`, and the JSON-LD against the golden files), so a Node runtime difference shows up there and not on a customer's site. The core's own test file is named `js/test/run.js` so Vitest does not pick it up as one of YTQ's tests; it is written for `node --test`.

**Line endings in the copy.** `core/.gitattributes` is a dotfile, and a plain `cp core/*` leaves it behind. YTQ adds its own line to its own `.gitattributes`, `functions/caseStudyCore/** text eol=lf`, so a Windows checkout cannot change the hashes.

**Updating the copy.** One pull request in YTQ: replace `functions/caseStudyCore/` with the new tagged copy, update the pin file with the new `tree_sha256`, core version and source commit, and note the core change in the changelog. Nothing else in that pull request.

## 6. Releases of the core

A core release is a tag on this repository, `core-v1.0.0`, on a commit where `core/run-tests.sh` passes. Consumers copy from tags only, never from a branch.
