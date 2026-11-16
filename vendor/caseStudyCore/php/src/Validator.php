<?php

namespace CumulusDigital\CaseStudyCore;

/**
 * validateRecord: schema, then the rules a schema cannot state, then the
 * forbidden content checks. core/js/lib/validate.js is the Node twin.
 */
final class Validator
{
    const SECTION_ORDER = array('need', 'challenge', 'solution', 'work', 'result');
    const HERO_RECOMMENDED_WIDTH = 1200;

    const MESSAGES = array(
        'schema.type' => 'Wrong type of value.',
        'schema.const' => 'Not the one value allowed here.',
        'schema.enum' => 'Not one of the allowed values.',
        'schema.required' => 'Required and missing.',
        'schema.additional_property' => 'This field is not part of a case study and cannot be stored.',
        'schema.not_allowed' => 'Not allowed here for a case study in this state.',
        'schema.min_length' => 'Too short.',
        'schema.max_length' => 'Too long.',
        'schema.pattern' => 'Not in the required format.',
        'schema.minimum' => 'Too small.',
        'schema.maximum' => 'Too large.',
        'schema.min_items' => 'Too few items.',
        'schema.max_items' => 'Too many items.',
        'schema.contains' => 'The wrong number of matching items (photos need exactly one hero; sections need the work section once).',
        'schema.number_out_of_range' => 'The number is too large to be handled exactly.',
        'sections.order' => 'Sections must be in the order need, challenge, solution, work, result, each at most once.',
        'photos.order_duplicate' => 'Two photos share the same order number.',
        'photos.ref_duplicate' => 'Two photos share the same ref.',
        'photos.pair_role' => 'Only a before or an after photo can belong to a pair.',
        'photos.pair_incomplete' => 'A pair needs exactly one before photo and one after photo.',
        'photos.checked_after_publish' => 'A photo was ticked after this version was published.',
        'photos.hero_narrow' => 'The hero photo is under 1200 pixels wide. It can be published, but a wider photo will look better when shared and in search.',
        'dates.invalid_calendar_date' => 'That date does not exist.',
        'dates.modified_before_published' => 'modified_at is earlier than published_at.',
        'dates.completed_after_published' => 'The completed month is later than the publish date.',
        'dates.unpublished_before_modified' => 'unpublished_at is earlier than modified_at.',
        'consent.withdrawn_before_confirmed' => 'Permission was withdrawn before it was confirmed.',
        'consent.confirmed_after_publish' => 'Permission was recorded after this version was published.',
        'consent.confirmed_before_photo_tick' => 'Permission was recorded before a photo was ticked. Permission is the last step: record it after every photo has been checked.',
        'social.sentence_count' => 'The social caption must be two or three sentences.',
        'social.contains_link' => 'The social caption must not contain a link or web address. The link is added when it is shared.',
        'text.invalid_unicode' => 'The text is not valid Unicode.',
        'text.control_character' => 'The text contains a control character.',
        'text.line_break' => 'Line breaks are allowed only in section and FAQ answers.',
        'text.unsupported_character' => 'The text contains styled or enclosed letters or digits. Use ordinary ones.',
        'privacy.postcode' => 'Contains what looks like a full postcode.',
        'privacy.email' => 'Contains an email address.',
        'privacy.phone' => 'Contains what looks like a phone number.',
        'privacy.street_address' => 'Contains what looks like a house number and street.',
        'privacy.price' => 'Contains a price.',
        'privacy.exact_date' => 'Contains an exact date. Use the month only.',
        'privacy.reference' => 'Contains what looks like a job, quote or invoice reference.',
        'privacy.forbidden_term' => 'Contains a detail of the customer that must not be published.',
        'privacy.hidden_town' => 'Names the town although the town is switched off for this case study.',
    );

    /**
     * Sentences end in . ! or ? followed by a space, a capital letter or the
     * end of the text. Text that does not end in one of those has one more,
     * unfinished, sentence.
     */
    public static function countSentences($text)
    {
        $clean = Text::normaliseText($text);
        if ($clean === '') {
            return 0;
        }
        $count = preg_match_all('/[.!?]+(?= |[A-Z]|$)/uD', $clean);
        if ($count === false) {
            throw new \RuntimeException('pattern could not be run');
        }
        return Text::matches('/[.!?]$/uD', $clean) ? $count : $count + 1;
    }

    const LINK = '~(?:https?://|www[.]|(?<![A-Za-z0-9@])[A-Za-z0-9-]+[.](?:co[.]uk|org[.]uk|com|uk|org|net|io|ly|me|info|biz|app|site|online)(?![A-Za-z0-9]))~iu';

    /** The schema's timestamp pattern allows the 31st of any month. */
    private static function isRealDate($timestamp)
    {
        $year = (int) substr($timestamp, 0, 4);
        $month = (int) substr($timestamp, 5, 2);
        $day = (int) substr($timestamp, 8, 2);
        $leap = ($year % 4 === 0 && $year % 100 !== 0) || $year % 400 === 0;
        $days = array(31, $leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
        return $day <= $days[$month - 1];
    }

    private static function timestampsOf($record)
    {
        $found = array();
        foreach (array('published_at', 'modified_at', 'unpublished_at') as $name) {
            if (SchemaEngine::has($record, $name)) {
                $found[] = array($record->{$name}, '/' . $name);
            }
        }
        if (SchemaEngine::has($record, 'consent')) {
            foreach (array('confirmed_at', 'withdrawn_at') as $name) {
                if (SchemaEngine::has($record->consent, $name)) {
                    $found[] = array($record->consent->{$name}, '/consent/' . $name);
                }
            }
            if (SchemaEngine::has($record->consent, 'not_identifiable_statement')) {
                $found[] = array($record->consent->not_identifiable_statement->ticked_at, '/consent/not_identifiable_statement/ticked_at');
            }
        }
        foreach ($record->photos as $i => $photo) {
            if (SchemaEngine::has($photo, 'checked')) {
                $found[] = array($photo->checked->confirmed_at, '/photos/' . $i . '/checked/confirmed_at');
            }
        }
        return $found;
    }

    private static function semanticErrors($record)
    {
        $errors = array();

        $last = -1;
        foreach ($record->sections as $i => $section) {
            $position = array_search($section->key, self::SECTION_ORDER, true);
            if ($position <= $last) {
                $errors[] = array('code' => 'sections.order', 'path' => '/sections/' . $i . '/key');
            }
            $last = max($last, $position);
        }

        $orders = array();
        $refs = array();
        $pairs = array();
        foreach ($record->photos as $i => $photo) {
            $path = SchemaEngine::pointer('/photos', $i);
            if (isset($orders[$photo->order])) {
                $errors[] = array('code' => 'photos.order_duplicate', 'path' => $path . '/order');
            }
            $orders[$photo->order] = true;
            if (isset($refs[$photo->ref])) {
                $errors[] = array('code' => 'photos.ref_duplicate', 'path' => $path . '/ref');
            }
            $refs[$photo->ref] = true;
            if (SchemaEngine::has($photo, 'pair')) {
                if ($photo->role !== 'before' && $photo->role !== 'after') {
                    $errors[] = array('code' => 'photos.pair_role', 'path' => $path . '/pair');
                } else {
                    if (!isset($pairs[$photo->pair])) {
                        $pairs[$photo->pair] = array('before' => 0, 'after' => 0, 'first' => $path . '/pair');
                    }
                    $pairs[$photo->pair][$photo->role] += 1;
                }
            }
        }
        foreach ($pairs as $pair) {
            if ($pair['before'] !== 1 || $pair['after'] !== 1) {
                $errors[] = array('code' => 'photos.pair_incomplete', 'path' => $pair['first']);
            }
        }

        foreach (self::timestampsOf($record) as $entry) {
            if (!self::isRealDate($entry[0])) {
                $errors[] = array('code' => 'dates.invalid_calendar_date', 'path' => $entry[1]);
            }
        }

        if (SchemaEngine::has($record, 'published_at') && SchemaEngine::has($record, 'modified_at')) {
            if (strcmp($record->modified_at, $record->published_at) < 0) {
                $errors[] = array('code' => 'dates.modified_before_published', 'path' => '/modified_at');
            }
            if (strcmp($record->completed_month, substr($record->published_at, 0, 7)) > 0) {
                $errors[] = array('code' => 'dates.completed_after_published', 'path' => '/completed_month');
            }
            if (SchemaEngine::has($record, 'unpublished_at') && strcmp($record->unpublished_at, $record->modified_at) < 0) {
                $errors[] = array('code' => 'dates.unpublished_before_modified', 'path' => '/unpublished_at');
            }
            // Permission and ticks come before the publish they allow.
            if (SchemaEngine::has($record, 'consent')) {
                if (strcmp($record->consent->confirmed_at, $record->modified_at) > 0) {
                    $errors[] = array('code' => 'consent.confirmed_after_publish', 'path' => '/consent/confirmed_at');
                }
                if (SchemaEngine::has($record->consent, 'not_identifiable_statement')
                    && strcmp($record->consent->not_identifiable_statement->ticked_at, $record->modified_at) > 0) {
                    $errors[] = array('code' => 'consent.confirmed_after_publish', 'path' => '/consent/not_identifiable_statement/ticked_at');
                }
            }
            foreach ($record->photos as $i => $photo) {
                if (SchemaEngine::has($photo, 'checked') && strcmp($photo->checked->confirmed_at, $record->modified_at) > 0) {
                    $errors[] = array('code' => 'photos.checked_after_publish', 'path' => '/photos/' . $i . '/checked/confirmed_at');
                }
            }
        }
        // Permission is the last step: it covers the photos as they were ticked.
        if (SchemaEngine::has($record, 'consent')) {
            foreach ($record->photos as $i => $photo) {
                if (SchemaEngine::has($photo, 'checked') && strcmp($photo->checked->confirmed_at, $record->consent->confirmed_at) > 0) {
                    $errors[] = array('code' => 'consent.confirmed_before_photo_tick', 'path' => '/photos/' . $i . '/checked/confirmed_at');
                }
            }
        }
        if (SchemaEngine::has($record, 'consent') && SchemaEngine::has($record->consent, 'withdrawn_at')
            && strcmp($record->consent->withdrawn_at, $record->consent->confirmed_at) < 0) {
            $errors[] = array('code' => 'consent.withdrawn_before_confirmed', 'path' => '/consent/withdrawn_at');
        }

        if (SchemaEngine::has($record, 'social')) {
            $sentences = self::countSentences($record->social->caption);
            if ($sentences < 2 || $sentences > 3) {
                $errors[] = array('code' => 'social.sentence_count', 'path' => '/social/caption');
            }
            if (Text::matches(self::LINK, $record->social->caption)) {
                $errors[] = array('code' => 'social.contains_link', 'path' => '/social/caption');
            }
        }
        return $errors;
    }

    /** Things the author is told about but that do not stop a publish. */
    private static function warningsFor($record)
    {
        $warnings = array();
        foreach ($record->photos as $i => $photo) {
            if ($photo->role === 'hero' && $photo->width < self::HERO_RECOMMENDED_WIDTH) {
                $warnings[] = array('code' => 'photos.hero_narrow', 'path' => '/photos/' . $i . '/width');
            }
        }
        return $warnings;
    }

    private static function withMessages(array $list)
    {
        $out = array();
        foreach (SchemaEngine::tidyErrors($list) as $item) {
            $out[] = array('code' => $item['code'], 'path' => $item['path'], 'message' => self::MESSAGES[$item['code']]);
        }
        return $out;
    }

    /**
     * $record: json_decode() output without the associative flag.
     * $options: array('forbiddenTerms' => list of label and value pairs),
     * optional. Any other option key, or a malformed term, throws: a check
     * that is silently skipped is worse than one that fails loudly.
     * Returns array('valid' => bool, 'errors' => list, 'warnings' => list),
     * each entry code, path, message, sorted by path then code. Warnings never
     * affect valid.
     */
    public static function validateRecord($record, array $options = array())
    {
        $forbiddenTerms = array();
        foreach ($options as $key => $value) {
            if ($key !== 'forbiddenTerms') {
                throw new \InvalidArgumentException('unknown option "' . $key . '" (did you mean forbiddenTerms?)');
            }
            $forbiddenTerms = $value;
        }
        Privacy::assertForbiddenTerms($forbiddenTerms);

        $errors = SchemaEngine::validateAgainst(Files::schema('case-study.v1.schema.json'), $record);
        $warnings = array();
        if (count($errors) === 0) {
            $errors = array_merge($errors, self::semanticErrors($record));
            $warnings = self::warningsFor($record);
        }
        $errors = self::withMessages(array_merge($errors, Privacy::scanRecord($record, $forbiddenTerms)));
        return array('valid' => count($errors) === 0, 'errors' => $errors, 'warnings' => self::withMessages($warnings));
    }

    /**
     * The gate both tracks call before anything goes live: the record must be
     * valid AND published. A valid draft is not publishable output.
     */
    public static function assertPublishable($record, array $options = array())
    {
        $result = self::validateRecord($record, $options);
        if ($result['valid'] && $record->status !== 'published') {
            return array(
                'valid' => false,
                'errors' => array(array(
                    'code' => 'publish.not_published',
                    'path' => '/status',
                    'message' => 'Only a record with status published can go live.',
                )),
                'warnings' => $result['warnings'],
            );
        }
        return $result;
    }

    /**
     * 'pending_legal_review' or 'approved'. The validators do not refuse a
     * pending wording; each track decides who may publish under one
     * (core/spec/consent.md).
     */
    public static function consentWordingStatus($version)
    {
        $wording = Files::schema('consent-wording.v1.json');
        if ($version !== $wording->wording_version) {
            throw new \InvalidArgumentException('unknown wording version ' . $version);
        }
        return $wording->status;
    }
}
