'use strict';

// One serialisation both languages produce byte for byte: keys sorted by Unicode code point,
// two-space indent, "key": value, no trailing newline, UTF-8 left unescaped,
// integers only. core/php/src/CanonicalJson.php is the PHP twin.

const { compareText } = require('./text');

function canonicalJson(value, indent) {
  const pad = indent === undefined ? '' : indent;
  const inner = pad + '  ';
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error('canonical JSON holds integers only');
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[\n' + value.map((item) => inner + canonicalJson(item, inner)).join(',\n') + '\n' + pad + ']';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort(compareText);
    if (keys.length === 0) return '{}';
    return '{\n' + keys.map((key) => inner + JSON.stringify(key) + ': ' + canonicalJson(value[key], inner)).join(',\n') + '\n' + pad + '}';
  }
  throw new Error('value cannot be serialised');
}

module.exports = { canonicalJson };
