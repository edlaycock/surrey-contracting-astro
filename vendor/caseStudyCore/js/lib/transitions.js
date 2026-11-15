'use strict';

// The status machine between two stored states of one case study.
// core/spec/record.md section 5 is the specification and
// core/php/src/Transitions.php the PHP twin. Both records must already have
// passed validateRecord. previous is null when the case study is new.

const { has, isObject, tidyErrors } = require('./schema-engine');
const { canonicalJson } = require('./canonical-json');

const ALLOWED = {
  draft: ['draft', 'published'],
  published: ['published', 'unpublished'],
  unpublished: ['unpublished', 'published'],
};

const MESSAGES = {
  'transition.invalid_record': 'One of the two records is not a case study record.',
  'transition.new_record': 'A new case study starts as a draft or as version 1.',
  'transition.identity_changed': 'id, source and schema_version never change.',
  'transition.status_not_allowed': 'That change of status is not allowed.',
  'transition.version': 'The version is wrong for this change: it rises by exactly one on each publish after the first and never otherwise.',
  'transition.same_version_changed': 'The content changed but the version did not. A published version never changes; publish the change as the next version.',
  'transition.content_changed': 'Unpublishing changes only the status, the unpublish time and the withdrawal on the consent record.',
  'transition.unpublished_frozen': 'An unpublished record does not change. Publishing again is the next version.',
  'transition.published_at_changed': 'published_at is the first publish time and never changes.',
  'transition.modified_at_not_later': 'modified_at must move forward on each publish, and be later than any unpublish.',
  'transition.consent_not_fresh': 'A new permission record is needed: a photo was added or changed, the location or the kind of permission changed, or the case study had been unpublished.',
  'transition.consent_changed': 'The permission record was altered without being confirmed again. Keep the existing record or record a new confirmation.',
  'transition.photo_tick_not_fresh': 'A photo that was added or changed needs its own new tick.',
  'transition.photo_tick_changed': 'The tick on a photo that did not change was altered. Keep it as it was or tick the photo again.',
};

// Enough structure for the checks below to read without failing. It is not
// validation: both records are meant to have passed validateRecord already.
function looksLikeRecord(record) {
  if (!isObject(record) || typeof record.status !== 'string' || !has(ALLOWED, record.status)
      || !Number.isInteger(record.version) || !Array.isArray(record.photos) || !isObject(record.location)) {
    return false;
  }
  const live = record.status !== 'draft';
  if (has(record, 'consent') || live) {
    if (!isObject(record.consent) || typeof record.consent.confirmed_at !== 'string') return false;
  }
  if (live && typeof record.modified_at !== 'string') return false;
  if (record.status === 'unpublished' && typeof record.unpublished_at !== 'string') return false;
  for (const photo of record.photos) {
    if (!isObject(photo) || typeof photo.ref !== 'string' || typeof photo.sha256 !== 'string') return false;
    if (has(photo, 'checked') || live) {
      if (!isObject(photo.checked) || typeof photo.checked.confirmed_at !== 'string') return false;
    }
  }
  return true;
}

function same(a, b) {
  return canonicalJson(a) === canonicalJson(b);
}

function without(record, names) {
  const copy = {};
  for (const key of Object.keys(record)) {
    if (!names.includes(key)) copy[key] = record[key];
  }
  return copy;
}

// Photos in next that were not in previous with the same file.
function newOrChangedPhotos(previous, next) {
  const known = previous.photos.map((photo) => photo.ref + ' ' + photo.sha256);
  const found = [];
  next.photos.forEach((photo, i) => {
    if (!known.includes(photo.ref + ' ' + photo.sha256)) found.push(i);
  });
  return found;
}

// A new or changed photo needs a tick made after the last time it could have
// been looked at: after the previous version went live, or, on a draft, after
// the tick the same ref carried before its file changed.
function staleTickErrors(previous, next) {
  const errors = [];
  for (const i of newOrChangedPhotos(previous, next)) {
    const photo = next.photos[i];
    if (!has(photo, 'checked')) continue; // a draft photo not ticked yet
    let floor = null;
    if (has(previous, 'modified_at')) {
      floor = previous.modified_at;
    } else {
      const before = previous.photos.find((old) => old.ref === photo.ref);
      if (before !== undefined && has(before, 'checked')) floor = before.checked.confirmed_at;
    }
    if (floor !== null && !(photo.checked.confirmed_at > floor)) {
      errors.push({ code: 'transition.photo_tick_not_fresh', path: '/photos/' + i + '/checked/confirmed_at' });
    }
  }
  return errors;
}

// The three changes that need permission to be confirmed again.
function needsFreshConsent(previous, next) {
  if (newOrChangedPhotos(previous, next).length > 0) return true;
  if (!same(previous.location, next.location)) return true;
  return has(previous, 'consent') && has(next, 'consent')
    && previous.consent.customer_permission !== next.consent.customer_permission;
}

function checkTransition(previous, next) {
  const errors = [];
  if (!looksLikeRecord(next) || (previous !== null && !looksLikeRecord(previous))) {
    return finish([{ code: 'transition.invalid_record', path: '' }]);
  }
  if (previous === null) {
    if (next.status === 'unpublished' || next.version !== 1) {
      errors.push({ code: 'transition.new_record', path: '/status' });
    }
    return finish(errors);
  }
  if (previous.id !== next.id || previous.source !== next.source || previous.schema_version !== next.schema_version) {
    errors.push({ code: 'transition.identity_changed', path: '/id' });
  }
  if (!ALLOWED[previous.status].includes(next.status)) {
    errors.push({ code: 'transition.status_not_allowed', path: '/status' });
    return finish(errors);
  }
  if (has(previous, 'published_at') && has(next, 'published_at') && previous.published_at !== next.published_at) {
    errors.push({ code: 'transition.published_at_changed', path: '/published_at' });
  }
  const route = previous.status + ' ' + next.status;

  if (route === 'draft draft' || route === 'draft published') {
    if (next.version !== previous.version) errors.push({ code: 'transition.version', path: '/version' });
    // Permission recorded on a draft does not survive a change it did not cover.
    if (has(previous, 'consent') && has(next, 'consent') && needsFreshConsent(previous, next)
        && !(next.consent.confirmed_at > previous.consent.confirmed_at)) {
      errors.push({ code: 'transition.consent_not_fresh', path: '/consent/confirmed_at' });
    }
    errors.push(...staleTickErrors(previous, next));
  }

  if (route === 'published published') {
    if (next.version === previous.version) {
      if (!same(previous, next)) errors.push({ code: 'transition.same_version_changed', path: '/version' });
    } else {
      if (next.version !== previous.version + 1) errors.push({ code: 'transition.version', path: '/version' });
      if (!(next.modified_at > previous.modified_at)) {
        errors.push({ code: 'transition.modified_at_not_later', path: '/modified_at' });
      }
      const fresh = next.consent.confirmed_at > previous.modified_at;
      if (needsFreshConsent(previous, next)) {
        if (!fresh) errors.push({ code: 'transition.consent_not_fresh', path: '/consent/confirmed_at' });
      } else if (!fresh && !same(previous.consent, next.consent)) {
        errors.push({ code: 'transition.consent_changed', path: '/consent' });
      }
      errors.push(...staleTickErrors(previous, next));
      // A photo that did not change keeps its tick exactly, or is ticked again.
      const changed = newOrChangedPhotos(previous, next);
      next.photos.forEach((photo, i) => {
        if (changed.includes(i)) return;
        const before = previous.photos.find((old) => old.ref === photo.ref && old.sha256 === photo.sha256);
        if (!same(before.checked, photo.checked) && !(photo.checked.confirmed_at > previous.modified_at)) {
          errors.push({ code: 'transition.photo_tick_changed', path: '/photos/' + i + '/checked' });
        }
      });
    }
  }

  if (route === 'published unpublished') {
    if (next.version !== previous.version) errors.push({ code: 'transition.version', path: '/version' });
    const before = without(previous, ['status']);
    const after = without(next, ['status', 'unpublished_at']);
    after.consent = without(next.consent, ['withdrawn_at', 'withdrawn_reason']);
    if (!same(before, after)) errors.push({ code: 'transition.content_changed', path: '' });
  }

  if (route === 'unpublished unpublished') {
    if (!same(previous, next)) errors.push({ code: 'transition.unpublished_frozen', path: '' });
  }

  if (route === 'unpublished published') {
    if (next.version !== previous.version + 1) errors.push({ code: 'transition.version', path: '/version' });
    if (!(next.modified_at > previous.unpublished_at)) {
      errors.push({ code: 'transition.modified_at_not_later', path: '/modified_at' });
    }
    if (!(next.consent.confirmed_at > previous.unpublished_at)) {
      errors.push({ code: 'transition.consent_not_fresh', path: '/consent/confirmed_at' });
    }
    errors.push(...staleTickErrors(previous, next));
  }
  return finish(errors);
}

function finish(errors) {
  const tidy = tidyErrors(errors).map((error) => ({ code: error.code, path: error.path, message: MESSAGES[error.code] }));
  return { valid: tidy.length === 0, errors: tidy };
}

module.exports = { checkTransition };
