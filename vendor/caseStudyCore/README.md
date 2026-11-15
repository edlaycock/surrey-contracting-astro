# Case Study Core v1

One definition of a case study, shared by both ways of making one:

- **Track 1**: the Job Completion Agent WordPress plugin, working on its own.
- **Track 2**: YourTradeQuotes (YTQ), publishing to WordPress through the same plugin and to other sites through its own adapters.

Both tracks produce the same record. Every page, JSON-LD block, feed entry and social post is made from it. The core is a specification with fixtures and two small reference implementations, because the tracks run in PHP and in Node.

Status: **draft for the owner's approval**. `schema_version: 1`, core version `1.0.0`. Nothing in the plugin or in YTQ uses it yet.

## What is here

| Path | What it is |
|---|---|
| `schema/case-study.v1.schema.json` | The record, JSON Schema 2020-12, strict |
| `schema/site-context.v1.schema.json` | What a rendering site supplies to the JSON-LD builder |
| `schema/privacy-patterns.v1.json` | The forbidden content patterns, loaded by both implementations |
| `schema/text-folding.v1.json` | How text is folded before it is checked (lookalike characters, accents, dashes, invisible characters), loaded by both implementations. It lists the invisible and combining characters itself, so neither language depends on its own Unicode version |
| `schema/consent-wording.v1.json` | The permission wording, **pending legal review** |
| `spec/record.md` | The record, the order of steps, photos, status and version, error codes |
| `spec/privacy.md` | What must never be present and the checks both tracks run before publish |
| `spec/consent.md` | Customer permission, wording v1, withdrawal |
| `spec/rendering.md` | The page contract, and the default layout direction decided on 14 November 2026 |
| `spec/jsonld.md` | Exact `Article` and `FAQPage` output, with a worked example |
| `spec/social.md` | The social post: text, link, when, and never twice |
| `spec/feed.md` | The YTQ pull feed contract. **Planned for Track 2, not built** |
| `spec/versioning.md` | Version rules, the manifest, and how YTQ vendors a hash-pinned copy |
| `fixtures/` | Golden fixtures: records with their expected validation result, expected JSON-LD and feed projection, status machine cases, privacy samples and probes |
| `js/` | Node reference implementation. CommonJS, no dependencies, Node 18 or later. Loads inside Firebase Functions as it is |
| `php/` | PHP reference implementation. No dependencies, PHP 7.4 or later, needs only `json` and `pcre` (no `mbstring`, no `intl`) |
| `manifest.json` | SHA-256 of every file above, for pinning |
| `run-tests.sh` | Runs everything |

## The rules in one screen

- Anonymous by default: town only (and a switch to hide it), month only. Never the customer's name, contact details, address, postcode, job reference, exact dates or prices. The schema has no field for any of them and rejects unknown fields; the text is scanned as well.
- Three to five question-led sections from `need`, `challenge`, `solution`, `work`, `result`, in that order, the question being the heading. `work` is always there. A section the facts cannot answer is left out, never padded. 0 to 4 FAQs.
- 1 to 12 photos with a role: `hero`, `before`, `after`, `other`. Exactly one hero; under 1,200 pixels wide it is a warning, not an error. A person ticks every photo. The tick is never defaulted and never set by AI.
- Publish is refused without a recorded customer permission. "Not identifiable" needs its own ticked statement. Fresh permission is needed only when an edit adds or changes a photo, changes the location or changes the kind of permission, and always after an unpublish.
- The content checks have no override. Ordinary trade wording must pass, and about sixty samples prove it.
- `draft`, `published`, `unpublished`. `id` plus `version` is the idempotency key for publishing and delivery, and a published version never changes.
- Order of steps on both routes: details, AI draft, edit, photos, permission, publish.

## Using it

Node:

```js
const core = require('./core/js');

const gate = core.assertPublishable(record, { forbiddenTerms: [{ label: 'customer name', value: 'Priya Raman' }] });
if (!gate.valid) return refuse(gate.errors); // [{ code, path, message }]
show(gate.warnings);                         // same shape; never stops a publish

const tag = core.buildJsonLdScriptTag(record, siteContext); // output this string exactly
```

PHP:

```php
require_once __DIR__ . '/core/php/src/autoload.php';

use CumulusDigital\CaseStudyCore\Files;
use CumulusDigital\CaseStudyCore\JsonLd;
use CumulusDigital\CaseStudyCore\Validator;

$record = Files::decode($json);               // or Files::toJsonValue($phpArray)
$gate = Validator::assertPublishable($record);
if (!$gate['valid']) { /* refuse: $gate['errors'] */ }

echo JsonLd::buildScriptTag($record, Files::toJsonValue($siteContext));
```

| Node | PHP | Does |
|---|---|---|
| `decode(json)` | `Files::decode($json)` | Reads JSON with the same limits in both languages |
| `validateRecord(record, {forbiddenTerms})` | `Validator::validateRecord($record, ['forbiddenTerms' => …])` | Schema, cross-field rules, text hygiene and forbidden content. Returns `{valid, errors, warnings}`. Throws on an unknown option or a malformed term |
| `assertPublishable(record, options)` | `Validator::assertPublishable($record, $options)` | The same, and the record must have status `published`. The gate to call before anything goes live |
| `checkTransition(previous, next)` | `Transitions::check($previous, $next)` | The status machine between two stored states, including when fresh permission is needed |
| `consentWordingStatus('v1')` | `Validator::consentWordingStatus('v1')` | `pending_legal_review` until the wording is signed off. The validators do not refuse on it; each track does, for everyone but its pilot |
| `feedProjection(record)` | `Wire::feedProjection($record)` | The record as it travels in a feed: no private note, no staff names. Refuses anything that does not pass `assertPublishable` |
| `feedTombstone(record)` | `Wire::feedTombstone($record)` | What travels when a case study is unpublished: id, version and time, no text |
| `isSafeIdentifier(value)` | `Privacy::isSafeIdentifier($value)` | Whether a newly generated id or photo ref is safe to use. Call it when making one, and make another on false |
| `buildJsonLd`, `buildJsonLdString`, `buildJsonLdScriptTag` | `JsonLd::build`, `buildString`, `buildScriptTag` | The JSON-LD graph, its canonical text, and the script element for the page. Validates the record itself and refuses an invalid one |
| `scanRecord`, `containsTerm`, `foldText`, `normaliseText` | `Privacy::scanRecord`, `Privacy::containsTerm`, `Text::foldText`, `Text::normaliseText` | The forbidden content checks on their own |
| `canonicalJson(value)` | `CanonicalJson::encode($value)` | The one serialisation both languages produce byte for byte |

PHP note: records are passed as `json_decode()` gives them without the associative flag (objects as `stdClass`). That is the only way PHP can tell `{}` from `[]`.

Neither implementation uses a JSON Schema library. Each has a small interpreter for exactly the keywords the core schemas use. It throws on a keyword it does not know, on a `type` that is not one string, on a `$ref` that loops, and on a regular expression outside the syntax both languages share, so the schema cannot grow a rule the validators silently skip or read differently. The schema files remain standard JSON Schema 2020-12 and can be checked with any other validator, with two things to know: the reference validators count `minLength` on the text a reader would see, and check section order themselves (`spec/record.md` section 6).

## Tests

```sh
./core/run-tests.sh
```

Needs `node` (18 or later) and `php` (7.4 or later). No install step and no network. It runs:

1. the Node tests: every fixture through `core/js`;
2. the PHP tests: every fixture through `core/php`;
3. a cross-check: both implementations write their validation result, JSON-LD, script tag and feed projection for every fixture, plus the status machine, privacy sample and probe results, and the two sets must be identical byte for byte.

The exit code is 0 only if all three pass. There is no CI workflow in this directory; `.github/` is owned separately and can call this script.

Fixtures:

| Fixture | Shows |
|---|---|
| `valid-minimal` | The smallest publishable record (Track 1, three sections, one photo, town hidden, "not identifiable" with its statement) |
| `valid-full` | Everything in use (Track 2, version 2, five sections, pairs, FAQs, social text). Also the golden feed projection |
| `valid-narrow-hero` | A hero under 1,200 pixels wide: valid, with a warning |
| `valid-hyphenated-town-and-terms` | Hyphenated hidden town and forbidden terms, which used to crash the Node validator |
| `valid-crlf-and-tab-in-answer` | Paragraphs separated by CR LF or CR, and a tab, as a browser form sends them |
| `valid-draft` | A draft needs no consent yet, and can never produce page output |
| `valid-unpublished-withdrawn` | Unpublished, with when and why. Also the golden tombstone |
| `invalid-no-consent` | Published with no permission recorded |
| `invalid-not-identifiable-without-statement`, `invalid-statement-with-other-permission` | The "not identifiable" statement |
| `invalid-unpublished-without-reason` | Unpublished with no record of when and why |
| `invalid-two-heroes`, `invalid-no-hero` | The hero rule |
| `invalid-contains-postcode` | A postcode in text, in the slug, with a hyphen, and in fullwidth letters with invisible characters |
| `invalid-contains-customer-email` | An email address, and the customer's surname supplied as a forbidden term |
| `invalid-phone-price-date-reference` | Phone, price, exact date, job reference, street address |
| `invalid-forbidden-fields` | Every field that must never be present |
| `invalid-identifiers-carry-details` | An id and photo refs built from a postcode, a name, a phone number and an invoice number |
| `invalid-hidden-town-named`, `invalid-hidden-town-and-terms-in-other-spellings`, `invalid-possessives` | The hidden town, names written with other apostrophes, hyphens and accents, and possessives ("Mrs Raman's garden") |
| `invalid-photo-not-ticked` | Photos nobody ticked, including a bare `true` |
| `invalid-withdrawn-still-published` | Withdrawn permission on a live record |
| `invalid-sections-and-faqs`, `invalid-section-order` | Too few sections, no `work`, wrong order, a key twice, too many FAQs |
| `invalid-photo-rules-dates-social`, `invalid-times`, `invalid-consent-before-photo-tick` | Rules the schema cannot state, permission and ticks dated after the publish, permission dated before a tick, a date that does not exist |
| `invalid-text-hygiene` | A title of spaces, a control character, digits in mathematical bold |
| `invalid-enums-and-formats` | Unknown values and bad formats |
| `transitions.json` | 42 status machine cases |
| `privacy-samples.json` | 196 text samples: what must be caught, 68 pieces of trade wording that must pass, and the known limits |
| `probes.json` | 99 small cases run identically through both implementations, mostly reproductions from the independent reviews |

Each record fixture carries its own `expected` result, written by hand. The valid published ones name a site context, a golden JSON-LD file and a golden script tag file.

## Changing anything

1. Change the specification, the schema or patterns, **both** implementations and the fixtures in one pull request.
2. Any new behaviour gets a fixture, a transition case, a privacy sample or a probe, so both languages are held to it.
3. `cd core && node js/tools/update-manifest.js`
4. `./core/run-tests.sh`
5. Bump the core version in `js/index.js`, `js/package.json` and `php/src/Files.php` as `spec/versioning.md` says.

## Open items

Listed with their context in `docs/case-study-core-v1.md`. The legal review of the permission wording does not block the build; it blocks the first publication for any client other than the pilot.
