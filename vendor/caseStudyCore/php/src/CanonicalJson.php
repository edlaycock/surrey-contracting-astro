<?php

namespace CumulusDigital\CaseStudyCore;

/**
 * One serialisation both languages produce byte for byte: keys sorted by Unicode code point,
 * two-space indent, "key": value, no trailing newline, UTF-8 left unescaped,
 * integers only. core/js/lib/canonical-json.js is the Node twin.
 *
 * A PHP array with keys 0..n-1 (or empty) is a JSON array; any other array
 * and any object is a JSON object.
 */
final class CanonicalJson
{
    const STRING_FLAGS = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_LINE_TERMINATORS;

    private static function encodeString($text)
    {
        $json = json_encode((string) $text, self::STRING_FLAGS);
        if ($json === false) {
            throw new \InvalidArgumentException('string is not valid UTF-8');
        }
        return $json;
    }

    public static function encode($value, $indent = '')
    {
        $inner = $indent . '  ';
        if ($value === null) {
            return 'null';
        }
        if ($value === true) {
            return 'true';
        }
        if ($value === false) {
            return 'false';
        }
        if (is_string($value)) {
            return self::encodeString($value);
        }
        if (is_int($value)) {
            if (abs($value) > 9007199254740991) {
                throw new \InvalidArgumentException('canonical JSON holds integers only');
            }
            return (string) $value;
        }
        if (is_float($value)) {
            if (!is_finite($value) || floor($value) !== $value || abs($value) > 9007199254740991) {
                throw new \InvalidArgumentException('canonical JSON holds integers only');
            }
            return sprintf('%.0f', $value);
        }
        $isList = is_array($value) && ($value === array() || array_keys($value) === range(0, count($value) - 1));
        if ($isList) {
            if (count($value) === 0) {
                return '[]';
            }
            $parts = array();
            foreach ($value as $item) {
                $parts[] = $inner . self::encode($item, $inner);
            }
            return "[\n" . implode(",\n", $parts) . "\n" . $indent . ']';
        }
        if (is_array($value) || is_object($value)) {
            $map = is_object($value) ? get_object_vars($value) : $value;
            $keys = array_map('strval', array_keys($map));
            sort($keys, SORT_STRING);
            if (count($keys) === 0) {
                return '{}';
            }
            $parts = array();
            foreach ($keys as $key) {
                $parts[] = $inner . self::encodeString($key) . ': ' . self::encode($map[$key], $inner);
            }
            return "{\n" . implode(",\n", $parts) . "\n" . $indent . '}';
        }
        throw new \InvalidArgumentException('value cannot be serialised');
    }
}
