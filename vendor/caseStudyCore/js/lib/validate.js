'use strict';

// validateRecord: schema, then the rules a schema cannot state, then the
// forbidden content checks. core/php/src/Validator.php is the PHP twin.

const { validateAgainst, tidyErrors, pointer, has, isObject } = require('./schema-engine');
const { scanRecord, assertForbiddenTerms } = require('./privacy');
const { normaliseText } = require('./text');
const recordSchema = require('../../schema/case-study.v1.schema.json');
const wording = require('../../schema/consent-wording.v1.json');

const SECTION_ORDER = ['need', 'challenge', 'solution', 'work', 'result'];
const HERO_RECOMMENDED_WIDTH = 1200;

const MESSAGES = {
  'schema.type': 'Wrong type of value.',
  'schema.const': 'Not the one value allowed here.',
  'schema.enum': 'Not one of the allowed values.',
  'schema.required': 'Required and missing.',
  'schema.additional_property': 'This field is not part of a case study and cannot be stored.',
  'schema.not_allowed': 'Not allowed here for a case study in this state.',
  'schema.min_length': 'Too short.',
  'schema.max_length': 'Too long.',
  'schema.pattern': 'Not in the required format.',
  'schema.minimum': 'Too small.',
  'schema.maximum': 'Too large.',
  'schema.min_items': 'Too few items.',
  'schema.max_items': 'Too many items.',
  'schema.contains': 'The wrong number of matching items (photos need exactly one hero; sections need the work section once).',
  'schema.number_out_of_range': 'The number is too large to be handled exactly.',
  'sections.order': 'Sections must be in the order need, challenge, solution, work, result, each at most once.',
  'photos.order_duplicate': 'Two photos share the same order number.',
  'photos.ref_duplicate': 'Two photos share the same ref.',
  'photos.pair_role': 'Only a before or an after photo can belong to a pair.',
  'photos.pair_incomplete': 'A pair needs exactly one before photo and one after photo.',
  'photos.checked_after_publish': 'A photo was ticked after this version was published.',
  'photos.hero_narrow': 'The hero photo is under 1200 pixels wide. It can be published, but a wider photo will look better when shared and in search.',
  'dates.invalid_calendar_date': 'That date does not exist.',
  'dates.modified_before_published': 'modified_at is earlier than published_at.',
  'dates.completed_after_published': 'The completed month is later than the publish date.',
  'dates.unpublished_before_modified': 'unpublished_at is earlier than modified_at.',
  'consent.withdrawn_before_confirmed': 'Permission was withdrawn before it was confirmed.',
  'consent.confirmed_after_publish': 'Permission was recorded after this version was published.',
  'consent.confirmed_before_photo_tick': 'Permission was recorded before a photo was ticked. Permission is the last step: record it after every photo has been checked.',
  'social.sentence_count': 'The social caption must be two or three sentences.',
  'social.contains_link': 'The social caption must not contain a link or web address. The link is added when it is shared.',
  'text.invalid_unicode': 'The text is not valid Unicode.',
  'text.control_character': 'The text contains a control character.',
  'text.line_break': 'Line breaks are allowed only in section and FAQ answers.',
  'text.unsupported_character': 'The text contains styled or enclosed letters or digits. Use ordinary ones.',
  'privacy.postcode': 'Contains what looks like a full postcode.',
  'privacy.email': 'Contains an email address.',
  'privacy.phone': 'Contains what looks like a phone number.',
  'privacy.street_address': 'Contains what looks like a house number and street.',
  'privacy.price': 'Contains a price.',
  'privacy.exact_date': 'Contains an exact date. Use the month only.',
  'privacy.reference': 'Contains what looks like a job, quote or invoice reference.',
  'privacy.forbidden_term': 'Contains a detail of the customer that must not be published.',
  'privacy.hidden_town': 'Names the town although the town is switched off for this case study.',
};

// Sentences end in . ! or ? followed by a space, a capital letter or the end
// of the text. Text that does not end in one of those has one more,
// unfinished, sentence.
function countSentences(text) {
  const clean = normaliseText(text);
  if (clean === '') return 0;
  const ends = clean.match(/[.!?]+(?= |[A-Z]|$)/gu);
  const count = ends === null ? 0 : ends.length;
  return /[.!?]$/u.test(clean) ? count : count + 1;
}

const LINK = /(?:https?:\/\/|www[.]|(?<![A-Za-z0-9@])[A-Za-z0-9-]+[.](?:co[.]uk|org[.]uk|com|uk|org|net|io|ly|me|info|biz|app|site|online)(?![A-Za-z0-9]))/iu;

// The schema's timestamp pattern allows the 31st of any month.
function isRealDate(timestamp) {
  const year = Number(timestamp.slice(0, 4));
  const month = Number(timestamp.slice(5, 7));
  const day = Number(timestamp.slice(8, 10));
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

function timestampsOf(record) {
  const found = [];
  for (const name of ['published_at', 'modified_at', 'unpublished_at']) {
    if (has(record, name)) found.push([record[name], '/' + name]);
  }
  if (has(record, 'consent')) {
    for (const name of ['confirmed_at', 'withdrawn_at']) {
      if (has(record.consent, name)) found.push([record.consent[name], '/consent/' + name]);
    }
    if (has(record.consent, 'not_identifiable_statement')) {
      found.push([record.consent.not_identifiable_statement.ticked_at, '/consent/not_identifiable_statement/ticked_at']);
    }
  }
  record.photos.forEach((photo, i) => {
    if (has(photo, 'checked')) found.push([photo.checked.confirmed_at, '/photos/' + i + '/checked/confirmed_at']);
  });
  return found;
}

function semanticErrors(record) {
  const errors = [];

  let last = -1;
  record.sections.forEach((section, i) => {
    const position = SECTION_ORDER.indexOf(section.key);
    if (position <= last) errors.push({ code: 'sections.order', path: '/sections/' + i + '/key' });
    last = Math.max(last, position);
  });

  const orders = {};
  const refs = {};
  const pairs = {};
  record.photos.forEach((photo, i) => {
    const path = pointer('/photos', i);
    if (has(orders, photo.order)) errors.push({ code: 'photos.order_duplicate', path: path + '/order' });
    orders[photo.order] = true;
    if (has(refs, photo.ref)) errors.push({ code: 'photos.ref_duplicate', path: path + '/ref' });
    refs[photo.ref] = true;
    if (has(photo, 'pair')) {
      if (photo.role !== 'before' && photo.role !== 'after') {
        errors.push({ code: 'photos.pair_role', path: path + '/pair' });
      } else {
        if (!has(pairs, photo.pair)) pairs[photo.pair] = { before: 0, after: 0, first: path + '/pair' };
        pairs[photo.pair][photo.role] += 1;
      }
    }
  });
  for (const number of Object.keys(pairs)) {
    const pair = pairs[number];
    if (pair.before !== 1 || pair.after !== 1) errors.push({ code: 'photos.pair_incomplete', path: pair.first });
  }

  for (const [timestamp, path] of timestampsOf(record)) {
    if (!isRealDate(timestamp)) errors.push({ code: 'dates.invalid_calendar_date', path });
  }

  if (has(record, 'published_at') && has(record, 'modified_at')) {
    if (record.modified_at < record.published_at) {
      errors.push({ code: 'dates.modified_before_published', path: '/modified_at' });
    }
    if (record.completed_month > record.published_at.slice(0, 7)) {
      errors.push({ code: 'dates.completed_after_published', path: '/completed_month' });
    }
    if (has(record, 'unpublished_at') && record.unpublished_at < record.modified_at) {
      errors.push({ code: 'dates.unpublished_before_modified', path: '/unpublished_at' });
    }
    // Permission and ticks come before the publish they allow.
    if (has(record, 'consent')) {
      if (record.consent.confirmed_at > record.modified_at) {
        errors.push({ code: 'consent.confirmed_after_publish', path: '/consent/confirmed_at' });
      }
      if (has(record.consent, 'not_identifiable_statement')
          && record.consent.not_identifiable_statement.ticked_at > record.modified_at) {
        errors.push({ code: 'consent.confirmed_after_publish', path: '/consent/not_identifiable_statement/ticked_at' });
      }
    }
    record.photos.forEach((photo, i) => {
      if (has(photo, 'checked') && photo.checked.confirmed_at > record.modified_at) {
        errors.push({ code: 'photos.checked_after_publish', path: '/photos/' + i + '/checked/confirmed_at' });
      }
    });
  }
  // Permission is the last step: it covers the photos as they were ticked.
  if (has(record, 'consent')) {
    record.photos.forEach((photo, i) => {
      if (has(photo, 'checked') && photo.checked.confirmed_at > record.consent.confirmed_at) {
        errors.push({ code: 'consent.confirmed_before_photo_tick', path: '/photos/' + i + '/checked/confirmed_at' });
      }
    });
  }
  if (has(record, 'consent') && has(record.consent, 'withdrawn_at')
      && record.consent.withdrawn_at < record.consent.confirmed_at) {
    errors.push({ code: 'consent.withdrawn_before_confirmed', path: '/consent/withdrawn_at' });
  }

  if (has(record, 'social')) {
    const sentences = countSentences(record.social.caption);
    if (sentences < 2 || sentences > 3) errors.push({ code: 'social.sentence_count', path: '/social/caption' });
    if (LINK.test(record.social.caption)) {
      errors.push({ code: 'social.contains_link', path: '/social/caption' });
    }
  }
  return errors;
}

// Things the author is told about but that do not stop a publish.
function warningsFor(record) {
  const warnings = [];
  record.photos.forEach((photo, i) => {
    if (photo.role === 'hero' && photo.width < HERO_RECOMMENDED_WIDTH) {
      warnings.push({ code: 'photos.hero_narrow', path: '/photos/' + i + '/width' });
    }
  });
  return warnings;
}

function withMessages(list) {
  return tidyErrors(list).map((item) => ({ code: item.code, path: item.path, message: MESSAGES[item.code] }));
}

// options: { forbiddenTerms: [{ label, value }] }, optional. Any other option
// key, or a malformed term, throws: a check that is silently skipped is worse
// than one that fails loudly.
// Returns { valid, errors, warnings }, each entry { code, path, message },
// sorted by path then code. Warnings never affect valid.
function validateRecord(record, options) {
  let forbiddenTerms = [];
  if (options !== undefined) {
    if (!isObject(options)) throw new TypeError('options must be an object');
    for (const key of Object.keys(options)) {
      if (key !== 'forbiddenTerms') throw new TypeError('unknown option "' + key + '" (did you mean forbiddenTerms?)');
    }
    if (options.forbiddenTerms !== undefined) forbiddenTerms = options.forbiddenTerms;
  }
  assertForbiddenTerms(forbiddenTerms);

  let errors = validateAgainst(recordSchema, record);
  let warnings = [];
  if (errors.length === 0) {
    errors = errors.concat(semanticErrors(record));
    warnings = warningsFor(record);
  }
  errors = withMessages(errors.concat(scanRecord(record, forbiddenTerms)));
  return { valid: errors.length === 0, errors, warnings: withMessages(warnings) };
}

// The gate both tracks call before anything goes live: the record must be
// valid AND published. A valid draft is not publishable output.
function assertPublishable(record, options) {
  const result = validateRecord(record, options);
  if (result.valid && record.status !== 'published') {
    return {
      valid: false,
      errors: [{ code: 'publish.not_published', path: '/status', message: 'Only a record with status published can go live.' }],
      warnings: result.warnings,
    };
  }
  return result;
}

// 'pending_legal_review' or 'approved'. The validators do not refuse a pending
// wording; each track decides who may publish under one (core/spec/consent.md).
function consentWordingStatus(version) {
  if (version !== wording.wording_version) throw new Error('unknown wording version ' + version);
  return wording.status;
}

module.exports = { validateRecord, assertPublishable, countSentences, consentWordingStatus, MESSAGES, SECTION_ORDER };
