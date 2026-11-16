'use strict';

// A small JSON Schema 2020-12 interpreter covering exactly the keywords the
// core schemas use. It throws on any keyword it does not know, so the schema
// cannot grow a rule this validator silently ignores. core/php/src/SchemaEngine.php
// is the same code line for line: change one, change both.

const ANNOTATIONS = ['$schema', '$id', 'title', 'description', '$defs', '$comment'];
const KEYWORDS = [
  'type', 'const', 'enum', 'properties', 'required', 'additionalProperties',
  'items', 'prefixItems', 'minItems', 'maxItems', 'minLength', 'maxLength',
  'pattern', 'minimum', 'maximum', 'contains', 'minContains', 'maxContains',
  '$ref', 'allOf', 'if', 'then', 'else', 'dependentRequired',
];

const { normaliseText, codePointLength, compareText, assertPortablePattern } = require('./text');

const MAX_SAFE = 9007199254740991;

function has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value; // string, boolean, object
}

function pointer(path, key) {
  return path + '/' + String(key).replace(/~/g, '~0').replace(/\//g, '~1');
}

function isScalar(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function assertKnownKeywords(schema, where) {
  if (typeof schema === 'boolean') return;
  if (!isObject(schema)) throw new Error('schema at ' + where + ' is not an object or boolean');
  for (const key of Object.keys(schema)) {
    if (!KEYWORDS.includes(key) && !ANNOTATIONS.includes(key)) {
      throw new Error('unsupported schema keyword "' + key + '" at ' + where);
    }
  }
  const one = ['additionalProperties', 'items', 'contains', 'if', 'then', 'else'];
  for (const key of one) {
    if (has(schema, key)) assertKnownKeywords(schema[key], where + '/' + key);
  }
  for (const key of ['properties', '$defs']) {
    if (has(schema, key)) {
      for (const name of Object.keys(schema[key])) {
        assertKnownKeywords(schema[key][name], where + '/' + key + '/' + name);
      }
    }
  }
  for (const key of ['prefixItems', 'allOf']) {
    if (has(schema, key)) {
      schema[key].forEach((sub, i) => assertKnownKeywords(sub, where + '/' + key + '/' + i));
    }
  }
  if (has(schema, 'type') && typeof schema.type !== 'string') throw new Error('type must be one string at ' + where);
  if (has(schema, 'pattern')) assertPortablePattern(schema.pattern);
  if (has(schema, 'const') && !isScalar(schema.const)) throw new Error('const must be a scalar at ' + where);
  if (has(schema, 'enum') && !schema.enum.every(isScalar)) throw new Error('enum must hold scalars at ' + where);
}

// A $defs entry that is only a chain of $ref back to itself would never end.
function assertNoRefCycles(root) {
  if (!has(root, '$defs')) return;
  for (const start of Object.keys(root.$defs)) {
    const seen = [start];
    let current = root.$defs[start];
    while (isObject(current) && has(current, '$ref')) {
      const name = String(current.$ref).slice('#/$defs/'.length);
      if (seen.includes(name)) throw new Error('$ref cycle at #/$defs/' + start);
      seen.push(name);
      current = resolveRef(root, current.$ref);
    }
  }
}

function resolveRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/$defs/')) throw new Error('unsupported $ref ' + ref);
  const name = ref.slice('#/$defs/'.length);
  if (!has(root, '$defs') || !has(root.$defs, name)) throw new Error('unresolved $ref ' + ref);
  return root.$defs[name];
}

function check(root, schema, value, path, errors) {
  if (schema === true) return;
  if (schema === false) {
    errors.push({ code: 'schema.not_allowed', path });
    return;
  }
  if (has(schema, '$ref')) check(root, resolveRef(root, schema.$ref), value, path, errors);

  const actual = typeOf(value);
  if ((actual === 'integer' || actual === 'number') && !(Math.abs(value) <= MAX_SAFE)) {
    errors.push({ code: 'schema.number_out_of_range', path });
    return; // beyond what both languages hold exactly
  }
  if (has(schema, 'type')) {
    const ok = schema.type === actual || (schema.type === 'number' && actual === 'integer');
    if (!ok) {
      errors.push({ code: 'schema.type', path });
      return; // nothing else about this value is worth reporting
    }
  }
  if (has(schema, 'const') && value !== schema.const) errors.push({ code: 'schema.const', path });
  if (has(schema, 'enum') && !schema.enum.some((option) => option === value)) {
    errors.push({ code: 'schema.enum', path });
  }

  if (actual === 'string') {
    // minLength counts what a reader would see: spaces and line breaks at the
    // ends, repeated spaces and invisible characters do not count.
    const length = codePointLength(value);
    const visible = codePointLength(normaliseText(value));
    if (has(schema, 'minLength') && visible < schema.minLength) errors.push({ code: 'schema.min_length', path });
    if (has(schema, 'maxLength') && length > schema.maxLength) errors.push({ code: 'schema.max_length', path });
    if (has(schema, 'pattern') && !new RegExp(schema.pattern, 'u').test(value)) {
      errors.push({ code: 'schema.pattern', path });
    }
  }

  if (actual === 'integer' || actual === 'number') {
    if (has(schema, 'minimum') && value < schema.minimum) errors.push({ code: 'schema.minimum', path });
    if (has(schema, 'maximum') && value > schema.maximum) errors.push({ code: 'schema.maximum', path });
  }

  if (actual === 'object') {
    const properties = has(schema, 'properties') ? schema.properties : {};
    if (has(schema, 'required')) {
      for (const name of schema.required) {
        if (!has(value, name)) errors.push({ code: 'schema.required', path: pointer(path, name) });
      }
    }
    if (has(schema, 'dependentRequired')) {
      for (const trigger of Object.keys(schema.dependentRequired)) {
        if (!has(value, trigger)) continue;
        for (const name of schema.dependentRequired[trigger]) {
          if (!has(value, name)) errors.push({ code: 'schema.required', path: pointer(path, name) });
        }
      }
    }
    for (const name of Object.keys(value)) {
      if (has(properties, name)) {
        check(root, properties[name], value[name], pointer(path, name), errors);
      } else if (has(schema, 'additionalProperties')) {
        if (schema.additionalProperties === false) {
          errors.push({ code: 'schema.additional_property', path: pointer(path, name) });
        } else {
          check(root, schema.additionalProperties, value[name], pointer(path, name), errors);
        }
      }
    }
  }

  if (actual === 'array') {
    if (has(schema, 'minItems') && value.length < schema.minItems) errors.push({ code: 'schema.min_items', path });
    if (has(schema, 'maxItems') && value.length > schema.maxItems) errors.push({ code: 'schema.max_items', path });
    const prefix = has(schema, 'prefixItems') ? schema.prefixItems : [];
    for (let i = 0; i < value.length; i += 1) {
      if (i < prefix.length) {
        check(root, prefix[i], value[i], pointer(path, i), errors);
      } else if (has(schema, 'items')) {
        check(root, schema.items, value[i], pointer(path, i), errors);
      }
    }
    if (has(schema, 'contains')) {
      let matches = 0;
      for (let i = 0; i < value.length; i += 1) {
        const scratch = [];
        check(root, schema.contains, value[i], pointer(path, i), scratch);
        if (scratch.length === 0) matches += 1;
      }
      const min = has(schema, 'minContains') ? schema.minContains : 1;
      const tooMany = has(schema, 'maxContains') && matches > schema.maxContains;
      if (matches < min || tooMany) errors.push({ code: 'schema.contains', path });
    }
  }

  if (has(schema, 'allOf')) {
    for (const sub of schema.allOf) check(root, sub, value, path, errors);
  }
  if (has(schema, 'if')) {
    const scratch = [];
    check(root, schema.if, value, path, scratch);
    if (scratch.length === 0) {
      if (has(schema, 'then')) check(root, schema.then, value, path, errors);
    } else if (has(schema, 'else')) {
      check(root, schema.else, value, path, errors);
    }
  }
}

function compareErrors(a, b) {
  if (a.path !== b.path) return compareText(a.path, b.path);
  return compareText(a.code, b.code);
}

// Sorted by path then code, duplicates removed.
function tidyErrors(errors) {
  const seen = new Set();
  const out = [];
  for (const error of errors.slice().sort(compareErrors)) {
    const key = error.code + ' ' + error.path;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(error);
  }
  return out;
}

function validateAgainst(schema, value) {
  assertKnownKeywords(schema, '#');
  assertNoRefCycles(schema);
  const errors = [];
  check(schema, schema, value, '', errors);
  return tidyErrors(errors);
}

module.exports = { validateAgainst, tidyErrors, pointer, has, isObject, codePointLength, MAX_SAFE };
