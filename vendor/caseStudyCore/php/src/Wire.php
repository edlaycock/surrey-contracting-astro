<?php

namespace CumulusDigital\CaseStudyCore;

final class WireException extends \RuntimeException
{
    /** @var string */
    public $errorCode;

    public function __construct($errorCode, $detail = null)
    {
        parent::__construct($detail === null ? $errorCode : $errorCode . ': ' . $detail);
        $this->errorCode = $errorCode;
    }
}

/**
 * The projection of a record that is sent to another system.
 * core/js/lib/wire.js is the Node twin.
 */
final class Wire
{
    const WITHHELD_NAME = 'withheld';

    /**
     * What travels in a feed for a live case study: the record without the
     * private consent note, and with every staff name replaced by a fixed
     * word. The result is still a valid record. Only a record that passes
     * assertPublishable is projected; a draft, an unpublished record or
     * anything invalid is refused, so nothing unchecked can leave this way.
     * See core/spec/feed.md section 2.
     */
    public static function feedProjection($record)
    {
        $gate = is_object($record) ? Validator::assertPublishable($record) : array('valid' => false, 'errors' => array(array('code' => 'schema.type', 'path' => '')));
        if (!$gate['valid']) {
            throw new WireException('feed.record_not_publishable', $gate['errors'][0]['code'] . ' ' . $gate['errors'][0]['path']);
        }
        $copy = Files::toJsonValue($record);
        if (SchemaEngine::has($copy, 'consent') && is_object($copy->consent)) {
            unset($copy->consent->note);
            $copy->consent->confirmed_by = self::WITHHELD_NAME;
            if (SchemaEngine::has($copy->consent, 'not_identifiable_statement')) {
                $copy->consent->not_identifiable_statement->ticked_by = self::WITHHELD_NAME;
            }
        }
        foreach ($copy->photos as $photo) {
            if (SchemaEngine::has($photo, 'checked')) {
                $photo->checked->confirmed_by = self::WITHHELD_NAME;
            }
        }
        return $copy;
    }

    /**
     * What travels in a feed when a case study is unpublished: its id, the
     * version that was removed and when. No reason and no other text. Only a
     * valid unpublished record gives a tombstone.
     */
    public static function feedTombstone($record)
    {
        $checked = Validator::validateRecord($record);
        if (!$checked['valid'] || $record->status !== 'unpublished') {
            $detail = $checked['valid'] ? 'status ' . $record->status : $checked['errors'][0]['code'] . ' ' . $checked['errors'][0]['path'];
            throw new WireException('feed.record_not_unpublished', $detail);
        }
        return array('id' => $record->id, 'removed' => true, 'version' => $record->version, 'removed_at' => $record->unpublished_at);
    }
}
