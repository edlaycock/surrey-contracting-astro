'use strict';

// Writes what this implementation produces for every fixture into a directory.
// core/run-tests.sh runs this and the PHP twin, then compares the two
// directories byte for byte.
//   node tools/emit.js <output directory>

const fs = require('fs');
const path = require('path');
const core = require('..');
const { runProbe, fixtureNames, readJson } = require('./shared');

const outDir = process.argv[2];
if (!outDir) {
  console.error('usage: node tools/emit.js <output directory>');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });
const write = (file, text) => fs.writeFileSync(path.join(outDir, file), text);

const names = fixtureNames();
for (const name of names) {
  const fixture = readJson(name + '.json');
  const result = core.validateRecord(fixture.record, { forbiddenTerms: fixture.forbidden_terms });
  write(name + '.validation.json', core.canonicalJson(result) + '\n');
  if (fixture.jsonld && fixture.jsonld.file) {
    const context = readJson(fixture.jsonld.context);
    write(name + '.jsonld.json', core.buildJsonLdString(fixture.record, context) + '\n');
    write(name + '.script.html', core.buildJsonLdScriptTag(fixture.record, context) + '\n');
  }
  if (fixture.tombstone) write(name + '.tombstone.json', core.canonicalJson(core.feedTombstone(fixture.record)) + '\n');
  if (fixture.feed) write(name + '.feed.json', core.canonicalJson(core.feedProjection(fixture.record)) + '\n');
}

const transitions = readJson('transitions.json');
const results = {};
for (const item of transitions.cases) results[item.name] = core.checkTransition(item.previous, item.next);
write('transitions.results.json', core.canonicalJson(results) + '\n');

const samples = readJson('privacy-samples.json');
const scanned = samples.samples.map((sample) => ({
  text: sample.text,
  codes: Array.from(new Set(core.scanRecord({ title: sample.text }, []).map((error) => error.code))).sort(),
}));
write('privacy-samples.results.json', core.canonicalJson(scanned) + '\n');

const probes = readJson('probes.json');
const outcomes = {};
for (const probe of probes.probes) outcomes[probe.name] = runProbe(probe);
write('probes.results.json', core.canonicalJson(outcomes) + '\n');

console.log('js: wrote results for ' + names.length + ' fixtures, ' + transitions.cases.length + ' transitions, '
  + samples.samples.length + ' privacy samples, ' + probes.probes.length + ' probes');
