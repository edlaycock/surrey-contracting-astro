'use strict';

// Forbidden content checks. core/spec/privacy.md is the specification and
// core/php/src/Privacy.php the PHP twin: change one, change both.

const { isObject, pointer } = require('./schema-engine');
const { foldText, skeleton, tidySpaces, hasControlCharacter, hasLineBreak, hasUnsupportedCharacter, isWellFormed, codePointLength, assertPortablePattern } = require('./text');
const config = require('../../schema/privacy-patterns.v1.json');

const compiled = config.patterns.map((entry) => {
  assertPortablePattern(entry.pattern);
  return {
    code: entry.code,
    scope: entry.scope,
    identifiers: entry.identifiers, // true, false or 'separated'
    regex: new RegExp(entry.pattern, entry.ci ? 'iu' : 'u'),
  };
});

function digitsOf(text) {
  return text.replace(/[^0-9]/gu, '');
}

function escapeForRegex(text) {
  return text.replace(/[\\^$.*+?()[\]{}|\/]/gu, '\\$&');
}

// True when term appears in text as a whole word or phrase, possessive or not.
// Case, accents, kinds of apostrophe and dash, and hyphens against spaces do
// not matter.
// A term with seven or more digits is also matched as a phone number: digits
// only, without the leading 0, 44 or 0044, inside any one run of digits.
function containsTerm(text, term) {
  const base = skeleton(term);
  const haystack = skeleton(text);
  // The term is tried in two forms: apostrophes dropped ("OBrien") and
  // apostrophes as breaks ("O Brien", which also matches "O'Brien"). In the
  // text an apostrophe is never dropped, so "can't" is not "cant"; but a
  // possessive ending, 's or s', may follow the term: "Raman's", "the Smiths'".
  const needles = [tidySpaces(base.replace(/'/gu, '')), tidySpaces(base.replace(/'/gu, ' '))];
  // Words are counted with apostrophes dropped, so "O'Briens" is one word.
  const multiWord = needles[0].split(' ').length >= 2;
  for (const needle of needles) {
    if (codePointLength(needle) < 2) continue;
    // In a term of two or more words, a word ending in s also matches the
    // text's possessive of it: the term "St Johns Road" catches "St John's
    // Road". A one-word term does not: "Wells" is not "the well's cover", nor
    // "Williams" "William's van".
    const body = needle.split(' ')
      .map((part) => (multiWord && /[^s']s$/u.test(part) ? escapeForRegex(part.slice(0, -1)) + "'?s" : escapeForRegex(part)))
      .join("[ ']+");
    const regex = new RegExp('(?<![\\p{L}\\p{N}])' + body + "(?:'s|s')?(?![\\p{L}\\p{N}]|'[\\p{L}\\p{N}])", 'iu');
    if (regex.test(haystack)) return true;
  }
  const digits = digitsOf(base);
  if (digits.length >= 7) {
    const core = digits.replace(/^(?:0044|44|0)/u, '');
    if (core.length >= 7) {
      const runs = foldText(text).match(/[0-9](?:[ ()._\/-]{0,3}[0-9])*/gu) || [];
      if (runs.some((run) => digitsOf(run).includes(core))) return true;
    }
  }
  return false;
}

// Throws unless terms is a list of { label: string, value: string }. A check
// that is silently skipped is worse than one that fails loudly.
function assertForbiddenTerms(terms) {
  if (!Array.isArray(terms)) throw new TypeError('forbiddenTerms must be a list of { label, value }');
  terms.forEach((term, i) => {
    const ok = isObject(term) && typeof term.label === 'string' && typeof term.value === 'string'
      && Object.keys(term).length === 2;
    if (!ok) throw new TypeError('forbiddenTerms[' + i + '] must be exactly { label: string, value: string }');
  });
}

// Calls visit(value, path, key) for every string in the record.
function walkStrings(value, path, key, visit) {
  if (typeof value === 'string') {
    visit(value, path, key);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => walkStrings(item, pointer(path, i), key, visit));
    return;
  }
  if (isObject(value)) {
    for (const name of Object.keys(value)) {
      walkStrings(value[name], pointer(path, name), name, visit);
    }
  }
}

// forbiddenTerms: [{ label, value }] supplied by the caller, for example the
// customer's name, email, phone and street line in Track 2.
function scanRecord(record, forbiddenTerms) {
  const terms = forbiddenTerms === undefined ? [] : forbiddenTerms;
  assertForbiddenTerms(terms);
  const errors = [];
  let hiddenTown = null;
  if (isObject(record) && isObject(record.location) && record.location.show_town === false
      && typeof record.location.town === 'string') {
    hiddenTown = record.location.town;
  }
  walkStrings(record, '', '', (value, path, key) => {
    if (!isWellFormed(value)) {
      errors.push({ code: 'text.invalid_unicode', path });
      return;
    }
    if (hasControlCharacter(value)) errors.push({ code: 'text.control_character', path });
    // A line break is a paragraph break, and only an answer has paragraphs.
    if (key !== 'answer' && hasLineBreak(value)) errors.push({ code: 'text.line_break', path });
    if (config.skip_keys.includes(key)) return;
    if (hasUnsupportedCharacter(value)) errors.push({ code: 'text.unsupported_character', path });
    const isIdentifier = config.identifier_keys.includes(key);
    const isPrivate = config.private_keys.includes(key);
    const text = foldText(config.hyphenated_keys.includes(key) ? value.replace(/[-_]/gu, ' ') : value);
    // Folding turns a line break into a space, so a string with line breaks is
    // also checked one line at a time: a line break ends a clause ("It cost
    // 4500" at the end of a paragraph is a price). Terms are checked on the
    // whole text only.
    const pieces = hasLineBreak(value) ? [text].concat(value.split(/\r\n|\r|\n/u).map(foldText)) : [text];
    for (const entry of compiled) {
      if (isIdentifier && entry.identifiers === false) continue;
      if (isIdentifier && entry.identifiers === 'separated' && !/[-_]/u.test(value)) continue;
      if (isPrivate && entry.scope !== 'everywhere') continue;
      if (pieces.some((piece) => entry.regex.test(piece))) errors.push({ code: 'privacy.' + entry.code, path });
    }
    for (const term of terms) {
      if (containsTerm(text, term.value)) errors.push({ code: 'privacy.forbidden_term', path });
    }
    if (hiddenTown !== null && !isPrivate && path !== '/location/town' && containsTerm(text, hiddenTown)) {
      errors.push({ code: 'privacy.hidden_town', path });
    }
  });
  return errors;
}

// True when a newly generated id or photo ref is safe to use: the right shape
// and nothing in it that the content checks would refuse. An id cannot be
// reworded later, so the software checks it when it makes it and makes another
// if this returns false.
function isSafeIdentifier(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{7,63}$/u.test(value)) return false;
  return scanRecord({ id: value }, []).length === 0;
}

module.exports = { scanRecord, containsTerm, assertForbiddenTerms, isSafeIdentifier };
