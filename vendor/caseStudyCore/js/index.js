'use strict';

// Case Study Core v1, Node reference implementation (CommonJS, no dependencies).

const { validateRecord, assertPublishable, countSentences, consentWordingStatus } = require('./lib/validate');
const { scanRecord, containsTerm, isSafeIdentifier } = require('./lib/privacy');
const { normaliseText, foldText } = require('./lib/text');
const { buildJsonLd, buildJsonLdString, buildJsonLdScriptTag, photosInDisplayOrder, JsonLdError } = require('./lib/jsonld');
const { checkTransition } = require('./lib/transitions');
const { canonicalJson } = require('./lib/canonical-json');
const { decode, feedProjection, feedTombstone, FeedError } = require('./lib/wire');

module.exports = {
  SCHEMA_VERSION: 1,
  CORE_VERSION: '1.0.0',
  decode,
  validateRecord,
  assertPublishable,
  consentWordingStatus,
  checkTransition,
  feedProjection,
  feedTombstone,
  FeedError,
  isSafeIdentifier,
  scanRecord,
  normaliseText,
  foldText,
  containsTerm,
  countSentences,
  buildJsonLd,
  buildJsonLdString,
  buildJsonLdScriptTag,
  photosInDisplayOrder,
  JsonLdError,
  canonicalJson,
};
