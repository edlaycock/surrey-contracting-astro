'use strict';

// Reading JSON the way PHP reads it, and the projection of a record that is
// sent to another system. core/php/src/Files.php (decode) and
// core/php/src/Wire.php are the PHP twins.

const { isObject, has } = require('./schema-engine');
const { validateRecord, assertPublishable } = require('./validate');
const { isWellFormed } = require('./text');

const MAX_DEPTH = 64; // as json_decode: 63 containers inside one another is the most accepted
const WITHHELD_NAME = 'withheld';

function assertDecodable(value, depth) {
  if (typeof value === 'string') {
    if (!isWellFormed(value)) throw new Error('not valid JSON: lone surrogate in a string');
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (depth >= MAX_DEPTH) throw new Error('not valid JSON: nested too deeply');
  if (Array.isArray(value)) {
    for (const item of value) assertDecodable(item, depth + 1);
    return;
  }
  for (const key of Object.keys(value)) {
    if (!isWellFormed(key)) throw new Error('not valid JSON: lone surrogate in a key');
    if (key.startsWith('\0')) throw new Error('not valid JSON: key starts with a NUL character');
    assertDecodable(value[key], depth + 1);
  }
}

// JSON.parse with the limits PHP's json_decode has, so both languages accept
// and refuse the same documents: no lone surrogates, at most 64 levels deep,
// no key starting with NUL.
function decode(json) {
  let value;
  try {
    value = JSON.parse(json);
  } catch (error) {
    throw new Error('not valid JSON: ' + error.message);
  }
  assertDecodable(value, 1);
  return value;
}

class FeedError extends Error {
  constructor(code, detail) {
    super(detail === undefined ? code : code + ': ' + detail);
    this.name = 'FeedError';
    this.code = code;
  }
}

// What travels in a feed for a live case study: the record without the private
// consent note, and with every staff name replaced by a fixed word. The result
// is still a valid record. Only a record that passes assertPublishable is
// projected; a draft, an unpublished record or anything invalid is refused, so
// nothing unchecked can leave this way. See core/spec/feed.md section 2.
function feedProjection(record) {
  const gate = assertPublishable(record);
  if (!gate.valid) throw new FeedError('feed.record_not_publishable', gate.errors[0].code + ' ' + gate.errors[0].path);
  const copy = JSON.parse(JSON.stringify(record));
  if (isObject(copy.consent)) {
    delete copy.consent.note;
    copy.consent.confirmed_by = WITHHELD_NAME;
    if (has(copy.consent, 'not_identifiable_statement')) copy.consent.not_identifiable_statement.ticked_by = WITHHELD_NAME;
  }
  for (const photo of copy.photos) {
    if (has(photo, 'checked')) photo.checked.confirmed_by = WITHHELD_NAME;
  }
  return copy;
}

// What travels in a feed when a case study is unpublished: its id, the version
// that was removed and when. No reason and no other text. Only a valid
// unpublished record gives a tombstone.
function feedTombstone(record) {
  const checked = validateRecord(record);
  if (!checked.valid || record.status !== 'unpublished') {
    throw new FeedError('feed.record_not_unpublished', checked.valid ? 'status ' + record.status : checked.errors[0].code + ' ' + checked.errors[0].path);
  }
  return { id: record.id, removed: true, version: record.version, removed_at: record.unpublished_at };
}

module.exports = { decode, feedProjection, feedTombstone, FeedError, MAX_DEPTH, WITHHELD_NAME };
