<?php

namespace CumulusDigital\CaseStudyCore;

/**
 * Forbidden content checks. core/spec/privacy.md is the specification and
 * core/js/lib/privacy.js the Node twin: change one, change both.
 */
final class Privacy
{
    /** @var array<int, array<string, mixed>>|null */
    private static $compiled = null;

    private static function config()
    {
        return Files::schema('privacy-patterns.v1.json');
    }

    private static function compiled()
    {
        if (self::$compiled === null) {
            self::$compiled = array();
            foreach (self::config()->patterns as $entry) {
                Text::assertPortablePattern($entry->pattern);
                self::$compiled[] = array(
                    'code' => $entry->code,
                    'scope' => $entry->scope,
                    'identifiers' => $entry->identifiers, // true, false or 'separated'
                    'regex' => Text::delimit($entry->pattern, $entry->ci === true),
                );
            }
        }
        return self::$compiled;
    }

    private static function digitsOf($text)
    {
        return Text::replace('/[^0-9]/', '', $text);
    }

    /**
     * True when term appears in text as a whole word or phrase. Case, accents,
     * kinds of apostrophe and dash, and hyphens against spaces do not matter.
     * A term with seven or more digits is also matched as a phone number:
     * digits only, without the leading 0, 44 or 0044, inside any one run of digits.
     */
    public static function containsTerm($text, $term)
    {
        $base = Text::skeleton($term);
        $haystack = Text::skeleton($text);
        // The term is tried in two forms: apostrophes dropped ("OBrien") and
        // apostrophes as breaks ("O Brien", which also matches "O'Brien"). In
        // the text an apostrophe is never dropped, so "can't" is not "cant";
        // but a possessive ending, 's or s', may follow the term.
        $needles = array(Text::tidySpaces(str_replace("'", '', $base)), Text::tidySpaces(str_replace("'", ' ', $base)));
        // Words are counted with apostrophes dropped, so "O'Briens" is one word.
        $multiWord = count(explode(' ', $needles[0])) >= 2;
        foreach ($needles as $needle) {
            if (Text::codePointLength($needle) < 2) {
                continue;
            }
            $parts = array();
            foreach (explode(' ', $needle) as $part) {
                // In a term of two or more words, a word ending in s also matches
                // the text's possessive of it: the term "St Johns Road" catches
                // "St John's Road". A one-word term does not: "Wells" is not "the
                // well's cover", nor "Williams" "William's van".
                $parts[] = $multiWord && Text::matches("/[^s']s$/D", $part) ? preg_quote(substr($part, 0, -1), '~') . "'?s" : preg_quote($part, '~');
            }
            $regex = '~(?<![\p{L}\p{N}])' . implode("[ ']+", $parts) . "(?:'s|s')?(?![\p{L}\p{N}]|'[\p{L}\p{N}])~iu";
            if (Text::matches($regex, $haystack)) {
                return true;
            }
        }
        $digits = self::digitsOf($base);
        if (strlen($digits) >= 7) {
            $core = Text::replace('/^(?:0044|44|0)/', '', $digits);
            if (strlen($core) >= 7) {
                $runs = array();
                if (preg_match_all('~[0-9](?:[ ()._/-]{0,3}[0-9])*~', Text::foldText($text), $runs) === false) {
                    throw new \RuntimeException('pattern could not be run');
                }
                foreach ($runs[0] as $run) {
                    if (strpos(self::digitsOf($run), $core) !== false) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Throws unless $terms is a list of label and value pairs (objects or
     * arrays). A check that is silently skipped is worse than one that fails
     * loudly. Returns the values.
     */
    public static function assertForbiddenTerms($terms)
    {
        if (!is_array($terms) || ($terms !== array() && array_keys($terms) !== range(0, count($terms) - 1))) {
            throw new \InvalidArgumentException('forbiddenTerms must be a list of { label, value }');
        }
        $values = array();
        foreach ($terms as $i => $term) {
            $term = is_object($term) ? get_object_vars($term) : $term;
            $ok = is_array($term) && count($term) === 2 && isset($term['label'], $term['value'])
                && is_string($term['label']) && is_string($term['value']);
            if (!$ok) {
                throw new \InvalidArgumentException('forbiddenTerms[' . $i . '] must be exactly { label: string, value: string }');
            }
            $values[] = $term['value'];
        }
        return $values;
    }

    /**
     * True when a newly generated id or photo ref is safe to use: the right
     * shape and nothing in it that the content checks would refuse. An id
     * cannot be reworded later, so the software checks it when it makes it and
     * makes another if this returns false.
     */
    public static function isSafeIdentifier($value)
    {
        if (!is_string($value) || !Text::matches('/^[A-Za-z0-9][A-Za-z0-9_-]{7,63}$/D', $value)) {
            return false;
        }
        $record = new \stdClass();
        $record->id = $value;
        return count(self::scanRecord($record, array())) === 0;
    }

    /** Calls $visit($value, $path, $key) for every string in the record. */
    private static function walkStrings($value, $path, $key, $visit)
    {
        if (is_string($value)) {
            $visit($value, $path, $key);
            return;
        }
        if (is_array($value)) {
            foreach ($value as $i => $item) {
                self::walkStrings($item, SchemaEngine::pointer($path, $i), $key, $visit);
            }
            return;
        }
        if (is_object($value)) {
            foreach (SchemaEngine::keys($value) as $name) {
                self::walkStrings(SchemaEngine::get($value, $name), SchemaEngine::pointer($path, $name), $name, $visit);
            }
        }
    }

    /**
     * $forbiddenTerms: list of label and value pairs supplied by the caller,
     * for example the customer's name, email, phone and street line in Track 2.
     */
    public static function scanRecord($record, $forbiddenTerms = array())
    {
        $terms = self::assertForbiddenTerms($forbiddenTerms);
        $errors = array();
        $hiddenTown = null;
        if (SchemaEngine::has($record, 'location') && is_object($record->location)
            && SchemaEngine::has($record->location, 'show_town') && $record->location->show_town === false
            && SchemaEngine::has($record->location, 'town') && is_string($record->location->town)) {
            $hiddenTown = $record->location->town;
        }
        $config = self::config();
        $compiled = self::compiled();
        $visit = function ($value, $path, $key) use (&$errors, $terms, $hiddenTown, $config, $compiled) {
            if (!Text::isWellFormed($value)) {
                $errors[] = array('code' => 'text.invalid_unicode', 'path' => $path);
                return;
            }
            if (Text::hasControlCharacter($value)) {
                $errors[] = array('code' => 'text.control_character', 'path' => $path);
            }
            // A line break is a paragraph break, and only an answer has paragraphs.
            if ($key !== 'answer' && Text::hasLineBreak($value)) {
                $errors[] = array('code' => 'text.line_break', 'path' => $path);
            }
            if (in_array($key, $config->skip_keys, true)) {
                return;
            }
            if (Text::hasUnsupportedCharacter($value)) {
                $errors[] = array('code' => 'text.unsupported_character', 'path' => $path);
            }
            $isIdentifier = in_array($key, $config->identifier_keys, true);
            $isPrivate = in_array($key, $config->private_keys, true);
            $text = Text::foldText(in_array($key, $config->hyphenated_keys, true) ? str_replace(array('-', '_'), ' ', $value) : $value);
            // Folding turns a line break into a space, so a string with line
            // breaks is also checked one line at a time: a line break ends a
            // clause ("It cost 4500" at the end of a paragraph is a price).
            // Terms are checked on the whole text only.
            $pieces = array($text);
            if (Text::hasLineBreak($value)) {
                $lines = preg_split('~\r\n|\r|\n~', $value);
                if ($lines === false) {
                    throw new \RuntimeException('pattern could not be run');
                }
                foreach ($lines as $line) {
                    $pieces[] = Text::foldText($line);
                }
            }
            foreach ($compiled as $entry) {
                if ($isIdentifier && $entry['identifiers'] === false) {
                    continue;
                }
                if ($isIdentifier && $entry['identifiers'] === 'separated' && strpbrk($value, '-_') === false) {
                    continue;
                }
                if ($isPrivate && $entry['scope'] !== 'everywhere') {
                    continue;
                }
                foreach ($pieces as $piece) {
                    if (Text::matches($entry['regex'], $piece)) {
                        $errors[] = array('code' => 'privacy.' . $entry['code'], 'path' => $path);
                        break;
                    }
                }
            }
            foreach ($terms as $term) {
                if (self::containsTerm($text, $term)) {
                    $errors[] = array('code' => 'privacy.forbidden_term', 'path' => $path);
                }
            }
            if ($hiddenTown !== null && !$isPrivate && $path !== '/location/town' && self::containsTerm($text, $hiddenTown)) {
                $errors[] = array('code' => 'privacy.hidden_town', 'path' => $path);
            }
        };
        self::walkStrings($record, '', '', $visit);
        return $errors;
    }
}
