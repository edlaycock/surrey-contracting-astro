'use strict';

// Text handling shared by the validator and the forbidden content checks:
// normalising, folding (core/schema/text-folding.v1.json), ordering and the
// portable pattern rule. core/php/src/Text.php is the PHP twin: change one,
// change both.

const folding = require('../../schema/text-folding.v1.json');

const hex = (value) => parseInt(value, 16);
const classOf = (ranges) => ranges.map(([from, to]) => '\\u{' + from + '}-\\u{' + to + '}').join('');

// Categories Mn and Cf come from the table, not from the platform, so Node and
// PHP strip exactly the same characters whatever Unicode version each ships.
const STRIP = new RegExp('[' + classOf(folding.marks_and_format) + classOf(folding.strip) + ']', 'gu');
const SPACES = new RegExp('[' + classOf(folding.spaces) + ']', 'gu');
const REJECT = new RegExp('[' + classOf(folding.reject) + ']', 'u');
const CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/u; // tab, LF and CR are allowed
const LINE_BREAK = /[\n\r]/u;
const NON_ASCII = /[^\x00-\x7F]/gu;
const OFFSETS = folding.offset.map(([from, to, target]) => [hex(from), hex(to), hex(target)]);

function mapCharacter(character) {
  const point = character.codePointAt(0);
  const key = point.toString(16).toUpperCase().padStart(4, '0');
  if (Object.prototype.hasOwnProperty.call(folding.map, key)) return folding.map[key];
  for (const [from, to, target] of OFFSETS) {
    if (point >= from && point <= to) return String.fromCodePoint(target + point - from);
  }
  return character;
}

function tidySpaces(text) {
  return text.replace(/ {2,}/gu, ' ').replace(/^ | $/gu, '');
}

// Invisible characters and combining marks removed, every kind of space made a
// plain space, runs collapsed, ends trimmed. Line breaks become spaces.
function normaliseText(text) {
  return tidySpaces(text.replace(STRIP, '').replace(SPACES, ' '));
}

// normaliseText, then every listed character replaced by its plain form.
function foldText(text) {
  return tidySpaces(text.replace(STRIP, '').replace(SPACES, ' ').replace(NON_ASCII, mapCharacter));
}

// For comparing names and places: folded, with hyphens, underscores, full
// stops, commas and slashes read as spaces. Apostrophes are kept, because
// "Raman's" and "can't" need telling apart.
function skeleton(text) {
  return tidySpaces(foldText(text).replace(/[-_.,\/]/gu, ' '));
}

function hasControlCharacter(text) {
  return CONTROL.test(text);
}

function hasLineBreak(text) {
  return LINE_BREAK.test(text);
}

function hasUnsupportedCharacter(text) {
  return REJECT.test(foldText(text));
}

// True unless the string holds a lone surrogate (JSON.parse lets them through;
// PHP's json_decode does not).
function isWellFormed(text) {
  for (let i = 0; i < text.length; i += 1) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
      if (next < 0xdc00 || next > 0xdfff) return false;
      i += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function codePointLength(text) {
  return Array.from(text).length;
}

// Unicode code point order, which is also UTF-8 byte order: what PHP's strcmp
// gives. JavaScript's own < compares UTF-16 units and disagrees above U+FFFF.
function compareText(a, b) {
  const pointsA = Array.from(a);
  const pointsB = Array.from(b);
  const length = Math.min(pointsA.length, pointsB.length);
  for (let i = 0; i < length; i += 1) {
    const difference = pointsA[i].codePointAt(0) - pointsB[i].codePointAt(0);
    if (difference !== 0) return difference < 0 ? -1 : 1;
  }
  if (pointsA.length === pointsB.length) return 0;
  return pointsA.length < pointsB.length ? -1 : 1;
}

// The two regex engines agree only on a common subset. A pattern outside it is
// refused when it is loaded, not discovered on a customer's site.
function assertPortablePattern(pattern) {
  if (typeof pattern !== 'string') throw new Error('pattern must be a string');
  let inClass = false;
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '\\') {
      const next = pattern[i + 1];
      if (next === undefined || !'\\^$.*+?()[]{}|/'.includes(next)) {
        throw new Error('pattern is not portable (escape \\' + next + '): ' + pattern);
      }
      i += 1;
    } else if (inClass) {
      if (c === ']') inClass = false;
    } else if (c === '[') {
      inClass = true;
    } else if (c === '.') {
      throw new Error('pattern is not portable (dot outside a class): ' + pattern);
    } else if (c === '(' && pattern[i + 1] === '?') {
      const group = pattern.slice(i, i + 4);
      const ok = group.startsWith('(?:') || group.startsWith('(?=') || group.startsWith('(?!')
        || group === '(?<=' || group === '(?<!';
      if (!ok) throw new Error('pattern is not portable (group ' + group + '): ' + pattern);
    } else if (c === '+' && i > 0 && '+*?}'.includes(pattern[i - 1]) && pattern[i - 2] !== '\\') {
      throw new Error('pattern is not portable (possessive quantifier): ' + pattern);
    }
  }
}

module.exports = {
  normaliseText, foldText, skeleton, hasControlCharacter, hasLineBreak, hasUnsupportedCharacter, tidySpaces,
  isWellFormed, codePointLength, compareText, assertPortablePattern,
};
