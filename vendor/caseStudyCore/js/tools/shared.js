'use strict';

// Helpers shared by the Node tests and the emit tool.

const fs = require('fs');
const path = require('path');
const core = require('..');
const { validateAgainst } = require('../lib/schema-engine');

const fixturesDir = path.join(__dirname, '..', '..', 'fixtures');
const readText = (file) => fs.readFileSync(path.join(fixturesDir, file), 'utf8');
const readJson = (file) => JSON.parse(readText(file));

function fixtureNames() {
  return fs.readdirSync(fixturesDir)
    .filter((file) => /^(valid|invalid)-[a-z0-9-]+[.]json$/.test(file))
    .map((file) => file.slice(0, -'.json'.length))
    .sort();
}

// Sets (or, with null, removes) a value at a path of keys.
function setAt(target, keys, value) {
  let node = target;
  for (let i = 0; i < keys.length - 1; i += 1) node = node[keys[i]];
  if (value === null) delete node[keys[keys.length - 1]];
  else node[keys[keys.length - 1]] = value;
}

// One probe from fixtures/probes.json, returning its outcome as a string.
function runProbe(probe) {
  try {
    if (probe.mode === 'term') return String(core.containsTerm(probe.text, probe.term));
    if (probe.mode === 'sentences') return String(core.countSentences(probe.text));
    if (probe.mode === 'decode') {
      core.decode(probe.raw);
      return 'ok';
    }
    if (probe.mode === 'canon') return core.canonicalJson(core.decode(probe.raw));
    if (probe.mode === 'schema') {
      const errors = validateAgainst(core.decode(probe.schema), core.decode(probe.raw));
      return errors.length === 0 ? 'ok' : errors.map((error) => error.code).join(',');
    }
    if (probe.mode === 'options') {
      core.validateRecord(readJson('valid-minimal.json').record, core.decode(probe.options));
      return 'ok';
    }
    if (probe.mode === 'identifier') return String(core.isSafeIdentifier(probe.value));
    if (probe.mode === 'validate' || probe.mode === 'feed' || probe.mode === 'tombstone') {
      const record = readJson(probe.fixture + '.json').record;
      for (const [keys, value] of probe.set_record) setAt(record, keys, value);
      if (probe.mode === 'validate') {
        const result = core.validateRecord(record);
        return result.valid ? 'VALID' : result.errors.map((error) => error.code + ' ' + error.path).join(' | ');
      }
      try {
        if (probe.mode === 'feed') core.feedProjection(record);
        else core.feedTombstone(record);
        return 'ok';
      } catch (error) {
        if (error instanceof core.FeedError) return error.code;
        throw error;
      }
    }
    if (probe.mode === 'jsonld') {
      const record = readJson(probe.fixture + '.json').record;
      const context = readJson(probe.context);
      for (const [keys, value] of probe.set_record) setAt(record, keys, value);
      for (const [keys, value] of probe.set_context) setAt(context, keys, value);
      try {
        return core.buildJsonLd(record, context)['@graph'][1]['@type'];
      } catch (error) {
        if (error instanceof core.JsonLdError) return error.code;
        throw error;
      }
    }
    return 'unknown mode';
  } catch (error) {
    return 'throw';
  }
}

module.exports = { fixturesDir, readText, readJson, fixtureNames, runProbe };
