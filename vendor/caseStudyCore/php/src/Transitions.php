<?php

namespace CumulusDigital\CaseStudyCore;

/**
 * The status machine between two stored states of one case study.
 * core/spec/record.md section 5 is the specification and
 * core/js/lib/transitions.js the Node twin. Both records must already have
 * passed Validator::validateRecord. $previous is null when the case study is new.
 */
final class Transitions
{
    const ALLOWED = array(
        'draft' => array('draft', 'published'),
        'published' => array('published', 'unpublished'),
        'unpublished' => array('unpublished', 'published'),
    );

    const MESSAGES = array(
        'transition.invalid_record' => 'One of the two records is not a case study record.',
        'transition.new_record' => 'A new case study starts as a draft or as version 1.',
        'transition.identity_changed' => 'id, source and schema_version never change.',
        'transition.status_not_allowed' => 'That change of status is not allowed.',
        'transition.version' => 'The version is wrong for this change: it rises by exactly one on each publish after the first and never otherwise.',
        'transition.same_version_changed' => 'The content changed but the version did not. A published version never changes; publish the change as the next version.',
        'transition.content_changed' => 'Unpublishing changes only the status, the unpublish time and the withdrawal on the consent record.',
        'transition.unpublished_frozen' => 'An unpublished record does not change. Publishing again is the next version.',
        'transition.published_at_changed' => 'published_at is the first publish time and never changes.',
        'transition.modified_at_not_later' => 'modified_at must move forward on each publish, and be later than any unpublish.',
        'transition.consent_not_fresh' => 'A new permission record is needed: a photo was added or changed, the location or the kind of permission changed, or the case study had been unpublished.',
        'transition.consent_changed' => 'The permission record was altered without being confirmed again. Keep the existing record or record a new confirmation.',
        'transition.photo_tick_not_fresh' => 'A photo that was added or changed needs its own new tick.',
        'transition.photo_tick_changed' => 'The tick on a photo that did not change was altered. Keep it as it was or tick the photo again.',
    );

    private static function hasString($object, $name)
    {
        return SchemaEngine::has($object, $name) && is_string($object->{$name});
    }

    /**
     * Enough structure for the checks below to read without failing. It is not
     * validation: both records are meant to have passed validateRecord already.
     */
    private static function looksLikeRecord($record)
    {
        if (!is_object($record) || !self::hasString($record, 'status') || !isset(self::ALLOWED[$record->status])
            || !SchemaEngine::has($record, 'version') || SchemaEngine::typeOf($record->version) !== 'integer'
            || !SchemaEngine::has($record, 'photos') || !is_array($record->photos)
            || !SchemaEngine::has($record, 'location') || !is_object($record->location)) {
            return false;
        }
        $live = $record->status !== 'draft';
        if (SchemaEngine::has($record, 'consent') || $live) {
            if (!SchemaEngine::has($record, 'consent') || !is_object($record->consent) || !self::hasString($record->consent, 'confirmed_at')) {
                return false;
            }
        }
        if ($live && !self::hasString($record, 'modified_at')) {
            return false;
        }
        if ($record->status === 'unpublished' && !self::hasString($record, 'unpublished_at')) {
            return false;
        }
        foreach ($record->photos as $photo) {
            if (!is_object($photo) || !self::hasString($photo, 'ref') || !self::hasString($photo, 'sha256')) {
                return false;
            }
            if (SchemaEngine::has($photo, 'checked') || $live) {
                if (!SchemaEngine::has($photo, 'checked') || !is_object($photo->checked) || !self::hasString($photo->checked, 'confirmed_at')) {
                    return false;
                }
            }
        }
        return true;
    }

    private static function same($a, $b)
    {
        return CanonicalJson::encode($a) === CanonicalJson::encode($b);
    }

    private static function without($record, array $names)
    {
        $copy = new \stdClass();
        foreach (SchemaEngine::keys($record) as $key) {
            if (!in_array($key, $names, true)) {
                $copy->{$key} = SchemaEngine::get($record, $key);
            }
        }
        return $copy;
    }

    /** Photos in next that were not in previous with the same file. */
    private static function newOrChangedPhotos($previous, $next)
    {
        $known = array();
        foreach ($previous->photos as $photo) {
            $known[] = $photo->ref . ' ' . $photo->sha256;
        }
        $found = array();
        foreach ($next->photos as $i => $photo) {
            if (!in_array($photo->ref . ' ' . $photo->sha256, $known, true)) {
                $found[] = $i;
            }
        }
        return $found;
    }

    private static function photoByRef($record, $ref, $sha256 = null)
    {
        foreach ($record->photos as $photo) {
            if ($photo->ref === $ref && ($sha256 === null || $photo->sha256 === $sha256)) {
                return $photo;
            }
        }
        return null;
    }

    /**
     * A new or changed photo needs a tick made after the last time it could
     * have been looked at: after the previous version went live, or, on a
     * draft, after the tick the same ref carried before its file changed.
     */
    private static function staleTickErrors($previous, $next)
    {
        $errors = array();
        foreach (self::newOrChangedPhotos($previous, $next) as $i) {
            $photo = $next->photos[$i];
            if (!SchemaEngine::has($photo, 'checked')) {
                continue; // a draft photo not ticked yet
            }
            $floor = null;
            if (SchemaEngine::has($previous, 'modified_at')) {
                $floor = $previous->modified_at;
            } else {
                $before = self::photoByRef($previous, $photo->ref);
                if ($before !== null && SchemaEngine::has($before, 'checked')) {
                    $floor = $before->checked->confirmed_at;
                }
            }
            if ($floor !== null && !(strcmp($photo->checked->confirmed_at, $floor) > 0)) {
                $errors[] = array('code' => 'transition.photo_tick_not_fresh', 'path' => '/photos/' . $i . '/checked/confirmed_at');
            }
        }
        return $errors;
    }

    /** The three changes that need permission to be confirmed again. */
    private static function needsFreshConsent($previous, $next)
    {
        if (count(self::newOrChangedPhotos($previous, $next)) > 0) {
            return true;
        }
        if (!self::same($previous->location, $next->location)) {
            return true;
        }
        return SchemaEngine::has($previous, 'consent') && SchemaEngine::has($next, 'consent')
            && $previous->consent->customer_permission !== $next->consent->customer_permission;
    }

    public static function check($previous, $next)
    {
        $errors = array();
        if (!self::looksLikeRecord($next) || ($previous !== null && !self::looksLikeRecord($previous))) {
            return self::finish(array(array('code' => 'transition.invalid_record', 'path' => '')));
        }
        if ($previous === null) {
            if ($next->status === 'unpublished' || $next->version != 1) {
                $errors[] = array('code' => 'transition.new_record', 'path' => '/status');
            }
            return self::finish($errors);
        }
        if ($previous->id !== $next->id || $previous->source !== $next->source || $previous->schema_version != $next->schema_version) {
            $errors[] = array('code' => 'transition.identity_changed', 'path' => '/id');
        }
        if (!in_array($next->status, self::ALLOWED[$previous->status], true)) {
            $errors[] = array('code' => 'transition.status_not_allowed', 'path' => '/status');
            return self::finish($errors);
        }
        if (SchemaEngine::has($previous, 'published_at') && SchemaEngine::has($next, 'published_at')
            && $previous->published_at !== $next->published_at) {
            $errors[] = array('code' => 'transition.published_at_changed', 'path' => '/published_at');
        }
        $route = $previous->status . ' ' . $next->status;

        if ($route === 'draft draft' || $route === 'draft published') {
            if ($next->version != $previous->version) {
                $errors[] = array('code' => 'transition.version', 'path' => '/version');
            }
            // Permission recorded on a draft does not survive a change it did not cover.
            if (SchemaEngine::has($previous, 'consent') && SchemaEngine::has($next, 'consent') && self::needsFreshConsent($previous, $next)
                && !(strcmp($next->consent->confirmed_at, $previous->consent->confirmed_at) > 0)) {
                $errors[] = array('code' => 'transition.consent_not_fresh', 'path' => '/consent/confirmed_at');
            }
            $errors = array_merge($errors, self::staleTickErrors($previous, $next));
        }

        if ($route === 'published published') {
            if ($next->version == $previous->version) {
                if (!self::same($previous, $next)) {
                    $errors[] = array('code' => 'transition.same_version_changed', 'path' => '/version');
                }
            } else {
                if ($next->version != $previous->version + 1) {
                    $errors[] = array('code' => 'transition.version', 'path' => '/version');
                }
                if (!(strcmp($next->modified_at, $previous->modified_at) > 0)) {
                    $errors[] = array('code' => 'transition.modified_at_not_later', 'path' => '/modified_at');
                }
                $fresh = strcmp($next->consent->confirmed_at, $previous->modified_at) > 0;
                if (self::needsFreshConsent($previous, $next)) {
                    if (!$fresh) {
                        $errors[] = array('code' => 'transition.consent_not_fresh', 'path' => '/consent/confirmed_at');
                    }
                } elseif (!$fresh && !self::same($previous->consent, $next->consent)) {
                    $errors[] = array('code' => 'transition.consent_changed', 'path' => '/consent');
                }
                $errors = array_merge($errors, self::staleTickErrors($previous, $next));
                // A photo that did not change keeps its tick exactly, or is ticked again.
                $changed = self::newOrChangedPhotos($previous, $next);
                foreach ($next->photos as $i => $photo) {
                    if (in_array($i, $changed, true)) {
                        continue;
                    }
                    $before = self::photoByRef($previous, $photo->ref, $photo->sha256);
                    if (!self::same($before->checked, $photo->checked) && !(strcmp($photo->checked->confirmed_at, $previous->modified_at) > 0)) {
                        $errors[] = array('code' => 'transition.photo_tick_changed', 'path' => '/photos/' . $i . '/checked');
                    }
                }
            }
        }

        if ($route === 'published unpublished') {
            if ($next->version != $previous->version) {
                $errors[] = array('code' => 'transition.version', 'path' => '/version');
            }
            $before = self::without($previous, array('status'));
            $after = self::without($next, array('status', 'unpublished_at'));
            $after->consent = self::without($next->consent, array('withdrawn_at', 'withdrawn_reason'));
            if (!self::same($before, $after)) {
                $errors[] = array('code' => 'transition.content_changed', 'path' => '');
            }
        }

        if ($route === 'unpublished unpublished') {
            if (!self::same($previous, $next)) {
                $errors[] = array('code' => 'transition.unpublished_frozen', 'path' => '');
            }
        }

        if ($route === 'unpublished published') {
            if ($next->version != $previous->version + 1) {
                $errors[] = array('code' => 'transition.version', 'path' => '/version');
            }
            if (!(strcmp($next->modified_at, $previous->unpublished_at) > 0)) {
                $errors[] = array('code' => 'transition.modified_at_not_later', 'path' => '/modified_at');
            }
            if (!(strcmp($next->consent->confirmed_at, $previous->unpublished_at) > 0)) {
                $errors[] = array('code' => 'transition.consent_not_fresh', 'path' => '/consent/confirmed_at');
            }
            $errors = array_merge($errors, self::staleTickErrors($previous, $next));
        }
        return self::finish($errors);
    }

    private static function finish(array $errors)
    {
        $out = array();
        foreach (SchemaEngine::tidyErrors($errors) as $error) {
            $out[] = array('code' => $error['code'], 'path' => $error['path'], 'message' => self::MESSAGES[$error['code']]);
        }
        return array('valid' => count($out) === 0, 'errors' => $out);
    }
}
