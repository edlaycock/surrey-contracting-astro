<?php

namespace CumulusDigital\CaseStudyCore;

/**
 * Where the schema files live, and how records are read.
 *
 * Every function in this library takes records as json_decode() gives them
 * WITHOUT the associative flag: JSON objects are stdClass, JSON arrays are PHP
 * lists. That is the only way PHP can tell {} from []. A record held as a PHP
 * array goes through Files::toJsonValue() first.
 */
final class Files
{
    const SCHEMA_VERSION = 1;
    const CORE_VERSION = '1.0.0';

    /** @var string|null */
    private static $schemaDir = null;

    /** @var array<string, mixed> */
    private static $cache = array();

    /** Point the library at a schema directory when it is not ../../schema. */
    public static function setSchemaDir($dir)
    {
        self::$schemaDir = rtrim($dir, '/');
        self::$cache = array();
    }

    public static function schemaDir()
    {
        return self::$schemaDir === null ? dirname(__DIR__, 2) . '/schema' : self::$schemaDir;
    }

    public static function schema($name)
    {
        if (!isset(self::$cache[$name])) {
            self::$cache[$name] = self::decode(file_get_contents(self::schemaDir() . '/' . $name));
        }
        return self::$cache[$name];
    }

    /** Strict decode: throws on anything that is not valid JSON. */
    public static function decode($json)
    {
        $value = json_decode($json, false, 64);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException('not valid JSON: ' . json_last_error_msg());
        }
        return $value;
    }

    /** Turns a PHP array (for example post meta) into the stdClass form. */
    public static function toJsonValue($value)
    {
        $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION;
        return self::decode(json_encode($value, $flags));
    }
}
