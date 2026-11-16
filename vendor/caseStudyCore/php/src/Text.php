<?php

namespace CumulusDigital\CaseStudyCore;

/**
 * Text handling shared by the validator and the forbidden content checks:
 * normalising, folding (core/schema/text-folding.v1.json), ordering and the
 * portable pattern rule. core/js/lib/text.js is the Node twin: change one,
 * change both. Needs no mbstring and no intl.
 */
final class Text
{
    /** @var array<string, mixed>|null */
    private static $compiled = null;

    private static function classOf($ranges)
    {
        $out = '';
        foreach ($ranges as $range) {
            $out .= '\x{' . $range[0] . '}-\x{' . $range[1] . '}';
        }
        return $out;
    }

    private static function compiled()
    {
        if (self::$compiled === null) {
            $folding = Files::schema('text-folding.v1.json');
            $offsets = array();
            foreach ($folding->offset as $entry) {
                $offsets[] = array(hexdec($entry[0]), hexdec($entry[1]), hexdec($entry[2]));
            }
            self::$compiled = array(
                // Categories Mn and Cf come from the table, not from the platform, so Node
                // and PHP strip exactly the same characters whatever Unicode version each ships.
                'strip' => '/[' . self::classOf($folding->marks_and_format) . self::classOf($folding->strip) . ']/u',
                'spaces' => '/[' . self::classOf($folding->spaces) . ']/u',
                'reject' => '/[' . self::classOf($folding->reject) . ']/u',
                'map' => get_object_vars($folding->map),
                'offsets' => $offsets,
            );
        }
        return self::$compiled;
    }

    /** preg_match that never mistakes an engine failure for "no match". */
    public static function matches($regex, $text)
    {
        $result = preg_match($regex, $text);
        if ($result === false) {
            throw new \RuntimeException('pattern could not be run (PCRE error ' . preg_last_error() . ')');
        }
        return $result === 1;
    }

    /** Wraps a portable pattern for PCRE: ~ as delimiter, UTF-8, $ at the very end only. */
    public static function delimit($pattern, $caseInsensitive = false)
    {
        return '~' . str_replace('~', '\\~', $pattern) . '~uD' . ($caseInsensitive ? 'i' : '');
    }

    public static function replace($regex, $replacement, $text)
    {
        $result = is_string($replacement) ? preg_replace($regex, $replacement, $text) : preg_replace_callback($regex, $replacement, $text);
        if ($result === null) {
            throw new \RuntimeException('pattern could not be run (PCRE error ' . preg_last_error() . ')');
        }
        return $result;
    }

    private static function codePoint($character)
    {
        $first = ord($character[0]);
        if ($first < 0x80) {
            return $first;
        }
        if ($first < 0xE0) {
            return (($first & 0x1F) << 6) | (ord($character[1]) & 0x3F);
        }
        if ($first < 0xF0) {
            return (($first & 0x0F) << 12) | ((ord($character[1]) & 0x3F) << 6) | (ord($character[2]) & 0x3F);
        }
        return (($first & 0x07) << 18) | ((ord($character[1]) & 0x3F) << 12) | ((ord($character[2]) & 0x3F) << 6) | (ord($character[3]) & 0x3F);
    }

    public static function mapCharacter($match)
    {
        $compiled = self::compiled();
        $character = $match[0];
        $point = self::codePoint($character);
        $key = str_pad(strtoupper(dechex($point)), 4, '0', STR_PAD_LEFT);
        if (isset($compiled['map'][$key])) {
            return $compiled['map'][$key];
        }
        foreach ($compiled['offsets'] as $entry) {
            if ($point >= $entry[0] && $point <= $entry[1]) {
                return chr($entry[2] + $point - $entry[0]);
            }
        }
        return $character;
    }

    public static function tidySpaces($text)
    {
        return self::replace('/^ | $/D', '', self::replace('/ {2,}/', ' ', $text));
    }

    /**
     * Invisible characters and combining marks removed, every kind of space
     * made a plain space, runs collapsed, ends trimmed. Line breaks become spaces.
     */
    public static function normaliseText($text)
    {
        $compiled = self::compiled();
        return self::tidySpaces(self::replace($compiled['spaces'], ' ', self::replace($compiled['strip'], '', $text)));
    }

    /** normaliseText, then every listed character replaced by its plain form. */
    public static function foldText($text)
    {
        $compiled = self::compiled();
        $text = self::replace($compiled['spaces'], ' ', self::replace($compiled['strip'], '', $text));
        $text = self::replace('/[^\x00-\x7F]/u', array(__CLASS__, 'mapCharacter'), $text);
        return self::tidySpaces($text);
    }

    /**
     * For comparing names and places: folded, with hyphens, underscores, full
     * stops, commas and slashes read as spaces. Apostrophes are kept, because
     * "Raman's" and "can't" need telling apart.
     */
    public static function skeleton($text)
    {
        return self::tidySpaces(self::replace('~[-_.,/]~', ' ', self::foldText($text)));
    }

    public static function hasControlCharacter($text)
    {
        return self::matches('/[\x{00}-\x{08}\x{0B}\x{0C}\x{0E}-\x{1F}\x{7F}-\x{9F}]/u', $text); // tab, LF and CR are allowed
    }

    public static function hasLineBreak($text)
    {
        return strpbrk($text, "\n\r") !== false;
    }

    public static function hasUnsupportedCharacter($text)
    {
        $compiled = self::compiled();
        return self::matches($compiled['reject'], self::foldText($text));
    }

    /** True unless the string is not valid UTF-8. */
    public static function isWellFormed($text)
    {
        return preg_match('//u', $text) === 1;
    }

    public static function codePointLength($text)
    {
        $count = preg_match_all('/./su', $text);
        if ($count === false) {
            throw new \RuntimeException('text is not valid UTF-8');
        }
        return $count;
    }

    /** Unicode code point order, which is UTF-8 byte order. */
    public static function compareText($a, $b)
    {
        $result = strcmp($a, $b);
        return $result < 0 ? -1 : ($result > 0 ? 1 : 0);
    }

    /**
     * The two regex engines agree only on a common subset. A pattern outside
     * it is refused when it is loaded, not discovered on a customer's site.
     */
    public static function assertPortablePattern($pattern)
    {
        if (!is_string($pattern)) {
            throw new \InvalidArgumentException('pattern must be a string');
        }
        $inClass = false;
        $length = strlen($pattern);
        for ($i = 0; $i < $length; $i += 1) {
            $c = $pattern[$i];
            if ($c === '\\') {
                $next = $i + 1 < $length ? $pattern[$i + 1] : '';
                if ($next === '' || strpos('\\^$.*+?()[]{}|/', $next) === false) {
                    throw new \InvalidArgumentException('pattern is not portable (escape \\' . $next . '): ' . $pattern);
                }
                $i += 1;
            } elseif ($inClass) {
                if ($c === ']') {
                    $inClass = false;
                }
            } elseif ($c === '[') {
                $inClass = true;
            } elseif ($c === '.') {
                throw new \InvalidArgumentException('pattern is not portable (dot outside a class): ' . $pattern);
            } elseif ($c === '(' && $i + 1 < $length && $pattern[$i + 1] === '?') {
                $group = substr($pattern, $i, 4);
                $ok = strpos($group, '(?:') === 0 || strpos($group, '(?=') === 0 || strpos($group, '(?!') === 0
                    || $group === '(?<=' || $group === '(?<!';
                if (!$ok) {
                    throw new \InvalidArgumentException('pattern is not portable (group ' . $group . '): ' . $pattern);
                }
            } elseif ($c === '+' && $i > 0 && strpos('+*?}', $pattern[$i - 1]) !== false && ($i < 2 || $pattern[$i - 2] !== '\\')) {
                throw new \InvalidArgumentException('pattern is not portable (possessive quantifier): ' . $pattern);
            }
        }
    }
}
