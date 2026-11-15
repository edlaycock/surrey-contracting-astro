<?php

namespace CumulusDigital\CaseStudyCore;

/**
 * A small JSON Schema 2020-12 interpreter covering exactly the keywords the
 * core schemas use. It throws on any keyword it does not know, so the schema
 * cannot grow a rule this validator silently ignores. core/js/lib/schema-engine.js
 * is the same code line for line: change one, change both.
 */
final class SchemaEngine
{
    const ANNOTATIONS = array('$schema', '$id', 'title', 'description', '$defs', '$comment');
    const KEYWORDS = array(
        'type', 'const', 'enum', 'properties', 'required', 'additionalProperties',
        'items', 'prefixItems', 'minItems', 'maxItems', 'minLength', 'maxLength',
        'pattern', 'minimum', 'maximum', 'contains', 'minContains', 'maxContains',
        '$ref', 'allOf', 'if', 'then', 'else', 'dependentRequired',
    );

    const MAX_SAFE = 9007199254740991;

    public static function has($object, $key)
    {
        return is_object($object) && property_exists($object, (string) $key);
    }

    public static function get($object, $key)
    {
        return $object->{(string) $key};
    }

    /** Property names as strings, in no promised order. */
    public static function keys($object)
    {
        return array_map('strval', array_keys(get_object_vars($object)));
    }

    public static function typeOf($value)
    {
        if ($value === null) {
            return 'null';
        }
        if (is_array($value)) {
            return 'array';
        }
        if (is_object($value)) {
            return 'object';
        }
        if (is_string($value)) {
            return 'string';
        }
        if (is_bool($value)) {
            return 'boolean';
        }
        if (is_int($value)) {
            return 'integer';
        }
        if (is_float($value)) {
            return (is_finite($value) && floor($value) === $value) ? 'integer' : 'number';
        }
        throw new \InvalidArgumentException('value is not JSON');
    }

    public static function codePointLength($text)
    {
        return Text::codePointLength($text);
    }

    public static function pointer($path, $key)
    {
        return $path . '/' . str_replace(array('~', '/'), array('~0', '~1'), (string) $key);
    }

    private static function isScalar($value)
    {
        return $value === null || is_string($value) || is_int($value) || is_float($value) || is_bool($value);
    }

    /** JSON equality for scalars: 1 and 1.0 are the same number. */
    private static function same($a, $b)
    {
        $numberA = is_int($a) || is_float($a);
        $numberB = is_int($b) || is_float($b);
        if ($numberA && $numberB) {
            return $a == $b;
        }
        return $a === $b;
    }

    private static function assertKnownKeywords($schema, $where)
    {
        if (is_bool($schema)) {
            return;
        }
        if (!is_object($schema)) {
            throw new \InvalidArgumentException('schema at ' . $where . ' is not an object or boolean');
        }
        foreach (self::keys($schema) as $key) {
            if (!in_array($key, self::KEYWORDS, true) && !in_array($key, self::ANNOTATIONS, true)) {
                throw new \InvalidArgumentException('unsupported schema keyword "' . $key . '" at ' . $where);
            }
        }
        foreach (array('additionalProperties', 'items', 'contains', 'if', 'then', 'else') as $key) {
            if (self::has($schema, $key)) {
                self::assertKnownKeywords(self::get($schema, $key), $where . '/' . $key);
            }
        }
        foreach (array('properties', '$defs') as $key) {
            if (self::has($schema, $key)) {
                foreach (self::keys(self::get($schema, $key)) as $name) {
                    self::assertKnownKeywords(self::get(self::get($schema, $key), $name), $where . '/' . $key . '/' . $name);
                }
            }
        }
        foreach (array('prefixItems', 'allOf') as $key) {
            if (self::has($schema, $key)) {
                foreach (self::get($schema, $key) as $i => $sub) {
                    self::assertKnownKeywords($sub, $where . '/' . $key . '/' . $i);
                }
            }
        }
        if (self::has($schema, 'type') && !is_string($schema->type)) {
            throw new \InvalidArgumentException('type must be one string at ' . $where);
        }
        if (self::has($schema, 'pattern')) {
            Text::assertPortablePattern($schema->pattern);
        }
        if (self::has($schema, 'const') && !self::isScalar($schema->const)) {
            throw new \InvalidArgumentException('const must be a scalar at ' . $where);
        }
        if (self::has($schema, 'enum')) {
            foreach ($schema->enum as $option) {
                if (!self::isScalar($option)) {
                    throw new \InvalidArgumentException('enum must hold scalars at ' . $where);
                }
            }
        }
    }

    /** A $defs entry that is only a chain of $ref back to itself would never end. */
    private static function assertNoRefCycles($root)
    {
        if (!self::has($root, '$defs')) {
            return;
        }
        foreach (self::keys(self::get($root, '$defs')) as $start) {
            $seen = array($start);
            $current = self::get(self::get($root, '$defs'), $start);
            while (is_object($current) && self::has($current, '$ref')) {
                $name = substr((string) self::get($current, '$ref'), strlen('#/$defs/'));
                if (in_array($name, $seen, true)) {
                    throw new \InvalidArgumentException('$ref cycle at #/$defs/' . $start);
                }
                $seen[] = $name;
                $current = self::resolveRef($root, self::get($current, '$ref'));
            }
        }
    }

    private static function resolveRef($root, $ref)
    {
        $prefix = '#/$defs/';
        if (!is_string($ref) || strpos($ref, $prefix) !== 0) {
            throw new \InvalidArgumentException('unsupported $ref');
        }
        $name = substr($ref, strlen($prefix));
        if (!self::has($root, '$defs') || !self::has(self::get($root, '$defs'), $name)) {
            throw new \InvalidArgumentException('unresolved $ref ' . $ref);
        }
        return self::get(self::get($root, '$defs'), $name);
    }

    public static function matchesPattern($pattern, $text)
    {
        return Text::matches(Text::delimit($pattern), $text);
    }

    private static function check($root, $schema, $value, $path, array &$errors)
    {
        if ($schema === true) {
            return;
        }
        if ($schema === false) {
            $errors[] = array('code' => 'schema.not_allowed', 'path' => $path);
            return;
        }
        if (self::has($schema, '$ref')) {
            self::check($root, self::resolveRef($root, self::get($schema, '$ref')), $value, $path, $errors);
        }

        $actual = self::typeOf($value);
        if (($actual === 'integer' || $actual === 'number') && !(abs($value) <= self::MAX_SAFE)) {
            $errors[] = array('code' => 'schema.number_out_of_range', 'path' => $path);
            return; // beyond what both languages hold exactly
        }
        if (self::has($schema, 'type')) {
            $ok = $schema->type === $actual || ($schema->type === 'number' && $actual === 'integer');
            if (!$ok) {
                $errors[] = array('code' => 'schema.type', 'path' => $path);
                return; // nothing else about this value is worth reporting
            }
        }
        if (self::has($schema, 'const') && !self::same($value, $schema->const)) {
            $errors[] = array('code' => 'schema.const', 'path' => $path);
        }
        if (self::has($schema, 'enum')) {
            $found = false;
            foreach ($schema->enum as $option) {
                if (self::same($value, $option)) {
                    $found = true;
                }
            }
            if (!$found) {
                $errors[] = array('code' => 'schema.enum', 'path' => $path);
            }
        }

        if ($actual === 'string') {
            // minLength counts what a reader would see: spaces and line breaks at
            // the ends, repeated spaces and invisible characters do not count.
            $length = self::codePointLength($value);
            $visible = self::codePointLength(Text::normaliseText($value));
            if (self::has($schema, 'minLength') && $visible < $schema->minLength) {
                $errors[] = array('code' => 'schema.min_length', 'path' => $path);
            }
            if (self::has($schema, 'maxLength') && $length > $schema->maxLength) {
                $errors[] = array('code' => 'schema.max_length', 'path' => $path);
            }
            if (self::has($schema, 'pattern') && !self::matchesPattern($schema->pattern, $value)) {
                $errors[] = array('code' => 'schema.pattern', 'path' => $path);
            }
        }

        if ($actual === 'integer' || $actual === 'number') {
            if (self::has($schema, 'minimum') && $value < $schema->minimum) {
                $errors[] = array('code' => 'schema.minimum', 'path' => $path);
            }
            if (self::has($schema, 'maximum') && $value > $schema->maximum) {
                $errors[] = array('code' => 'schema.maximum', 'path' => $path);
            }
        }

        if ($actual === 'object') {
            $properties = self::has($schema, 'properties') ? $schema->properties : new \stdClass();
            if (self::has($schema, 'required')) {
                foreach ($schema->required as $name) {
                    if (!self::has($value, $name)) {
                        $errors[] = array('code' => 'schema.required', 'path' => self::pointer($path, $name));
                    }
                }
            }
            if (self::has($schema, 'dependentRequired')) {
                foreach (self::keys($schema->dependentRequired) as $trigger) {
                    if (!self::has($value, $trigger)) {
                        continue;
                    }
                    foreach (self::get($schema->dependentRequired, $trigger) as $name) {
                        if (!self::has($value, $name)) {
                            $errors[] = array('code' => 'schema.required', 'path' => self::pointer($path, $name));
                        }
                    }
                }
            }
            foreach (self::keys($value) as $name) {
                if (self::has($properties, $name)) {
                    self::check($root, self::get($properties, $name), self::get($value, $name), self::pointer($path, $name), $errors);
                } elseif (self::has($schema, 'additionalProperties')) {
                    if ($schema->additionalProperties === false) {
                        $errors[] = array('code' => 'schema.additional_property', 'path' => self::pointer($path, $name));
                    } else {
                        self::check($root, $schema->additionalProperties, self::get($value, $name), self::pointer($path, $name), $errors);
                    }
                }
            }
        }

        if ($actual === 'array') {
            $count = count($value);
            if (self::has($schema, 'minItems') && $count < $schema->minItems) {
                $errors[] = array('code' => 'schema.min_items', 'path' => $path);
            }
            if (self::has($schema, 'maxItems') && $count > $schema->maxItems) {
                $errors[] = array('code' => 'schema.max_items', 'path' => $path);
            }
            $prefix = self::has($schema, 'prefixItems') ? $schema->prefixItems : array();
            for ($i = 0; $i < $count; $i += 1) {
                if ($i < count($prefix)) {
                    self::check($root, $prefix[$i], $value[$i], self::pointer($path, $i), $errors);
                } elseif (self::has($schema, 'items')) {
                    self::check($root, $schema->items, $value[$i], self::pointer($path, $i), $errors);
                }
            }
            if (self::has($schema, 'contains')) {
                $matches = 0;
                for ($i = 0; $i < $count; $i += 1) {
                    $scratch = array();
                    self::check($root, $schema->contains, $value[$i], self::pointer($path, $i), $scratch);
                    if (count($scratch) === 0) {
                        $matches += 1;
                    }
                }
                $min = self::has($schema, 'minContains') ? $schema->minContains : 1;
                $tooMany = self::has($schema, 'maxContains') && $matches > $schema->maxContains;
                if ($matches < $min || $tooMany) {
                    $errors[] = array('code' => 'schema.contains', 'path' => $path);
                }
            }
        }

        if (self::has($schema, 'allOf')) {
            foreach ($schema->allOf as $sub) {
                self::check($root, $sub, $value, $path, $errors);
            }
        }
        if (self::has($schema, 'if')) {
            $scratch = array();
            self::check($root, self::get($schema, 'if'), $value, $path, $scratch);
            if (count($scratch) === 0) {
                if (self::has($schema, 'then')) {
                    self::check($root, self::get($schema, 'then'), $value, $path, $errors);
                }
            } elseif (self::has($schema, 'else')) {
                self::check($root, self::get($schema, 'else'), $value, $path, $errors);
            }
        }
    }

    /** Sorted by path then code, duplicates removed. */
    public static function tidyErrors(array $errors)
    {
        usort($errors, function ($a, $b) {
            if ($a['path'] !== $b['path']) {
                return strcmp($a['path'], $b['path']) < 0 ? -1 : 1;
            }
            if ($a['code'] !== $b['code']) {
                return strcmp($a['code'], $b['code']) < 0 ? -1 : 1;
            }
            return 0;
        });
        $seen = array();
        $out = array();
        foreach ($errors as $error) {
            $key = $error['code'] . ' ' . $error['path'];
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $out[] = $error;
        }
        return $out;
    }

    public static function validateAgainst($schema, $value)
    {
        self::assertKnownKeywords($schema, '#');
        self::assertNoRefCycles($schema);
        $errors = array();
        self::check($schema, $schema, $value, '', $errors);
        return self::tidyErrors($errors);
    }
}
