'use strict';

// Runs every golden fixture through the Node implementation.
//   node --test test/run.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const core = require('..');
const { readText, readJson, fixtureNames, runProbe } = require('../tools/shared');

const coreDir = path.join(__dirname, '..', '..');
const brief = (errors) => errors.map((error) => error.code + ' ' + error.path);
const names = fixtureNames();

test('there are at least six fixtures, valid and invalid', () => {
  assert.ok(names.length >= 6);
  assert.ok(names.some((name) => name.startsWith('valid-')));
  assert.ok(names.some((name) => name.startsWith('invalid-')));
});

for (const name of names) {
  const fixture = readJson(name + '.json');
  const options = { forbiddenTerms: fixture.forbidden_terms };

  test('fixture ' + name + ': validation result', () => {
    const result = core.validateRecord(fixture.record, options);
    assert.deepEqual(brief(result.errors), brief(fixture.expected.errors));
    assert.deepEqual(brief(result.warnings), brief(fixture.expected.warnings));
    assert.equal(result.valid, fixture.expected.valid);
    assert.equal(name.startsWith('valid-'), fixture.expected.valid);
    for (const item of result.errors.concat(result.warnings)) assert.equal(typeof item.message, 'string');
  });

  test('fixture ' + name + ': JSON-LD', () => {
    if (fixture.jsonld && fixture.jsonld.file) {
      const context = readJson(fixture.jsonld.context);
      assert.equal(core.buildJsonLdString(fixture.record, context) + '\n', readText(fixture.jsonld.file));
      assert.equal(core.buildJsonLdScriptTag(fixture.record, context) + '\n', readText(fixture.jsonld.script_file));
      return;
    }
    // Everything else must be refused unless it is valid and published.
    const publishable = fixture.expected.valid && fixture.record.status === 'published';
    const context = readJson(publishable ? 'site-context-no-address.json' : 'site-context.json');
    if (publishable) {
      context.images = Object.fromEntries(fixture.record.photos.map((photo) => [photo.ref, 'https://www.example-paving.co.uk/media/' + photo.ref + '.jpg']));
      assert.doesNotThrow(() => core.buildJsonLd(fixture.record, context));
      return;
    }
    const expected = fixture.jsonld ? fixture.jsonld.error : (fixture.record.status === 'published' ? 'jsonld.record_invalid' : 'jsonld.not_published');
    assert.throws(() => core.buildJsonLd(fixture.record, context), (error) => error.code === expected);
  });

  test('fixture ' + name + ': publish gate', () => {
    const gate = core.assertPublishable(fixture.record, options);
    assert.equal(gate.valid, fixture.expected.valid && fixture.record.status === 'published');
  });

  if (fixture.tombstone) {
    test('fixture ' + name + ': tombstone is the golden file and carries no text', () => {
      const tombstone = core.feedTombstone(fixture.record);
      assert.equal(core.canonicalJson(tombstone) + '\n', readText(fixture.tombstone));
      assert.deepEqual(Object.keys(tombstone).sort(), ['id', 'removed', 'removed_at', 'version']);
    });
  }

  test('fixture ' + name + ': the feed sends it only if it is publishable', () => {
    const publishable = fixture.expected.valid && fixture.record.status === 'published';
    if (publishable) assert.doesNotThrow(() => core.feedProjection(fixture.record));
    else assert.throws(() => core.feedProjection(fixture.record), (error) => error.code === 'feed.record_not_publishable');
  });

  if (fixture.feed) {
    test('fixture ' + name + ': feed projection is the golden file and still a valid record', () => {
      const projected = core.feedProjection(fixture.record);
      assert.equal(core.canonicalJson(projected) + '\n', readText(fixture.feed));
      assert.equal(core.validateRecord(projected).valid, true);
      const text = JSON.stringify(projected);
      assert.equal(text.includes(fixture.record.consent.confirmed_by), false);
      assert.equal(text.includes('"note"'), false);
    });
  }
}

test('transitions', () => {
  for (const item of readJson('transitions.json').cases) {
    const result = core.checkTransition(item.previous, item.next);
    assert.deepEqual(brief(result.errors), brief(item.expected.errors), item.name);
    assert.equal(result.valid, item.expected.valid, item.name);
    if (item.records_not_valid) continue;
    if (item.previous !== null) assert.deepEqual(brief(core.validateRecord(item.previous).errors), [], item.name + ' previous');
    assert.deepEqual(brief(core.validateRecord(item.next).errors), [], item.name + ' next');
  }
});

test('privacy samples: must catch, must pass, and the known limits', () => {
  const samples = readJson('privacy-samples.json').samples;
  assert.ok(samples.filter((sample) => sample.codes.length === 0 && !sample.known_limit).length >= 50);
  for (const sample of samples) {
    const codes = Array.from(new Set(core.scanRecord({ title: sample.text }, []).map((error) => error.code.replace('privacy.', '')))).sort();
    assert.deepEqual(codes, sample.codes.slice().sort(), sample.text);
  }
});

test('folding table lists the marks and format characters itself', () => {
  const folding = JSON.parse(fs.readFileSync(path.join(coreDir, 'schema', 'text-folding.v1.json'), 'utf8'));
  assert.ok(folding.marks_and_format.length > 300);
  for (const file of ['js/lib/text.js', 'php/src/Text.php']) {
    const source = fs.readFileSync(path.join(coreDir, file), 'utf8');
    assert.equal(/p\{(Mn|Cf)\}/.test(source), false, file + ' must not use the platform categories');
  }
});

test('probes (review reproductions and edge cases)', () => {
  for (const probe of readJson('probes.json').probes) assert.equal(runProbe(probe), probe.expected, probe.name);
});

test('folding table agrees with Unicode normalisation where it claims to', () => {
  const folding = JSON.parse(fs.readFileSync(path.join(coreDir, 'schema', 'text-folding.v1.json'), 'utf8'));
  for (let point = 0xff01; point <= 0xff5e; point += 1) {
    const character = String.fromCodePoint(point);
    const expected = character.normalize('NFKC');
    if (expected === '`' || expected === ' ') continue; // the grave accent is folded on to an apostrophe by the map
    assert.equal(core.foldText('a' + character + 'a'), 'a' + expected + 'a', point.toString(16));
  }
  for (const key of Object.keys(folding.map)) {
    const point = parseInt(key, 16);
    if (point < 0xc0 || (point > 0x24f && point < 0x1e00) || point > 0x1eff) continue;
    const base = String.fromCodePoint(point).normalize('NFD').replace(/\p{Mn}/gu, '');
    if (base.length === 1 && base.charCodeAt(0) < 128) assert.equal(folding.map[key], base, key);
  }
});

test('JSON-LD: the town is left out when it is switched off', () => {
  const fixture = readJson('valid-minimal.json');
  const text = core.buildJsonLdString(fixture.record, readJson(fixture.jsonld.context));
  for (const hidden of ['Guildford', 'contentLocation', 'areaServed']) assert.equal(text.includes(hidden), false, hidden);
});

test('JSON-LD: nothing private from the record is in the output', () => {
  const fixture = readJson('valid-full.json');
  const text = core.buildJsonLdString(fixture.record, readJson('site-context.json'));
  for (const hidden of ['Sam Carter', 'Agreed by text', 'yes_written', 'sha256', fixture.record.id]) {
    assert.equal(text.includes(hidden), false, hidden);
  }
});

test('JSON-LD: a script tag cannot be closed by record text', () => {
  const fixture = readJson('valid-full.json');
  fixture.record.faqs[0].answer = 'Typically fifteen years. </script><script>alert(1)</script> & more.';
  const tag = core.buildJsonLdScriptTag(fixture.record, readJson('site-context.json'));
  assert.equal(tag.split('</script>').length, 2);
  const body = tag.slice(tag.indexOf('\n') + 1, tag.lastIndexOf('\n'));
  assert.equal(body.includes('<'), false);
  assert.equal(JSON.parse(body)['@graph'][2].mainEntity[0].acceptedAnswer.text, fixture.record.faqs[0].answer);
});

test('JSON-LD: a missing image URL is refused', () => {
  const fixture = readJson('valid-full.json');
  const context = readJson('site-context.json');
  delete context.images[fixture.record.photos[0].ref];
  assert.throws(() => core.buildJsonLd(fixture.record, context), (error) => error.code === 'jsonld.image_url_missing');
});

test('the consent wording file and the schema agree, and the wording is still pending review', () => {
  const wording = JSON.parse(fs.readFileSync(path.join(coreDir, 'schema', 'consent-wording.v1.json'), 'utf8'));
  const schema = JSON.parse(fs.readFileSync(path.join(coreDir, 'schema', 'case-study.v1.schema.json'), 'utf8'));
  assert.deepEqual(schema.$defs.consent.properties.wording_version.enum, [wording.wording_version]);
  assert.deepEqual(Object.keys(wording.options).sort(), schema.$defs.consent.properties.customer_permission.enum.slice().sort());
  assert.equal(core.consentWordingStatus('v1'), 'pending_legal_review');
  assert.throws(() => core.consentWordingStatus('v9'));
});

test('spec/jsonld.md shows the golden output of the minimal fixture', () => {
  const spec = fs.readFileSync(path.join(coreDir, 'spec', 'jsonld.md'), 'utf8');
  assert.ok(spec.includes(readText('valid-minimal.script.html')));
});

test('spec/privacy.md names every known limit in the samples', () => {
  const spec = fs.readFileSync(path.join(coreDir, 'spec', 'privacy.md'), 'utf8');
  for (const sample of readJson('privacy-samples.json').samples) {
    if (sample.known_limit) assert.ok(spec.includes('`' + sample.text + '`'), sample.text);
  }
});

test('no en dash or em dash in the specifications, code or documents', () => {
  const DASHES = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');
  const offenders = [];
  const scan = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'fixtures') scan(full); // fixtures hold dashes on purpose, as test input
      } else if (DASHES.test(fs.readFileSync(full, 'utf8'))) {
        offenders.push(full);
      }
    }
  };
  scan(coreDir);
  if (fs.existsSync(path.join(coreDir, '..', 'docs'))) scan(path.join(coreDir, '..', 'docs'));
  assert.deepEqual(offenders, []);
});

test('manifest.json matches the files (run "node js/tools/update-manifest.js" after any change)', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(coreDir, 'manifest.json'), 'utf8'));
  const { listManifestFiles, hashFile, treeHash } = require('../tools/update-manifest');
  const files = listManifestFiles();
  assert.deepEqual(Object.keys(manifest.files).sort(), files);
  for (const file of files) assert.equal(manifest.files[file], hashFile(file), file);
  assert.equal(manifest.tree_sha256, treeHash(manifest.files));
  assert.equal(manifest.core_version, core.CORE_VERSION);
  assert.equal(manifest.schema_version, core.SCHEMA_VERSION);
});
