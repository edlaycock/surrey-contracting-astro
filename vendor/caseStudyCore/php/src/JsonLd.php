<?php

namespace CumulusDigital\CaseStudyCore;

final class JsonLdException extends \RuntimeException
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
 * JSON-LD for a published case study: one Article, the business and, when
 * there are FAQs, one FAQPage. core/spec/jsonld.md is the specification and
 * core/js/lib/jsonld.js the Node twin: change one, change both.
 */
final class JsonLd
{
    /** Hero first, then the rest in order. */
    public static function photosInDisplayOrder(array $photos)
    {
        usort($photos, function ($a, $b) {
            $heroA = $a->role === 'hero' ? 0 : 1;
            $heroB = $b->role === 'hero' ? 0 : 1;
            if ($heroA !== $heroB) {
                return $heroA - $heroB;
            }
            if ($a->order !== $b->order) {
                return $a->order < $b->order ? -1 : 1;
            }
            $byRef = strcmp($a->ref, $b->ref);
            return $byRef < 0 ? -1 : ($byRef > 0 ? 1 : 0);
        });
        return $photos;
    }

    /**
     * The builder validates the record itself (without forbidden terms, which
     * only the publishing track knows) and refuses anything invalid or not
     * published, so it cannot be used to put unchecked text on a page.
     * $context is the site context (core/schema/site-context.v1.schema.json).
     * Both are json_decode() output without the associative flag.
     */
    public static function build($record, $context)
    {
        if (!is_object($record) || !SchemaEngine::has($record, 'status') || $record->status !== 'published') {
            throw new JsonLdException('jsonld.not_published');
        }
        $checked = Validator::validateRecord($record);
        if (!$checked['valid']) {
            throw new JsonLdException('jsonld.record_invalid', $checked['errors'][0]['code'] . ' ' . $checked['errors'][0]['path']);
        }
        $contextErrors = SchemaEngine::validateAgainst(Files::schema('site-context.v1.schema.json'), $context);
        if (count($contextErrors) > 0) {
            throw new JsonLdException('jsonld.context_invalid', $contextErrors[0]['code'] . ' ' . $contextErrors[0]['path']);
        }

        $pageUrl = $context->page_url;
        $language = SchemaEngine::has($context, 'language') ? $context->language : 'en-GB';
        $businessId = $context->business->url . '#business';
        $showTown = $record->location->show_town === true;

        $images = array();
        foreach (self::photosInDisplayOrder($record->photos) as $photo) {
            if (!SchemaEngine::has($context->images, $photo->ref)) {
                throw new JsonLdException('jsonld.image_url_missing', $photo->ref);
            }
            $images[] = array(
                '@type' => 'ImageObject',
                'url' => SchemaEngine::get($context->images, $photo->ref),
                'width' => $photo->width,
                'height' => $photo->height,
                'caption' => $photo->alt,
            );
        }

        $about = array('@type' => 'Service', 'name' => $record->service_category, 'provider' => array('@id' => $businessId));
        if ($showTown) {
            $about['areaServed'] = array('@type' => 'Place', 'name' => $record->location->town);
        }

        $article = array(
            '@type' => 'Article',
            '@id' => $pageUrl . '#article',
            'url' => $pageUrl,
            'mainEntityOfPage' => array('@type' => 'WebPage', '@id' => $pageUrl),
            'headline' => $record->title,
            'description' => $record->excerpt,
            'inLanguage' => $language,
            'datePublished' => $record->published_at,
            'dateModified' => $record->modified_at,
            'articleSection' => $record->service_category,
            'about' => $about,
            'image' => $images,
            'author' => array('@id' => $businessId),
            'publisher' => array('@id' => $businessId),
        );
        if ($showTown) {
            $article['contentLocation'] = array('@type' => 'Place', 'name' => $record->location->town);
        }

        // LocalBusiness needs an address to be valid markup, so without one the
        // business is an Organization. A site may name a more specific type.
        $hasAddress = SchemaEngine::has($context->business, 'address');
        $businessType = $hasAddress ? 'LocalBusiness' : 'Organization';
        if (SchemaEngine::has($context->business, 'type')) {
            $businessType = $context->business->type;
        }
        $business = array(
            '@type' => $businessType,
            '@id' => $businessId,
            'name' => $context->business->name,
            'url' => $context->business->url,
        );
        if ($hasAddress) {
            $given = $context->business->address;
            $address = array(
                '@type' => 'PostalAddress',
                'addressLocality' => $given->locality,
                'postalCode' => $given->postal_code,
                'addressCountry' => $given->country,
            );
            if (SchemaEngine::has($given, 'street_address')) {
                $address['streetAddress'] = $given->street_address;
            }
            if (SchemaEngine::has($given, 'region')) {
                $address['addressRegion'] = $given->region;
            }
            $business['address'] = $address;
        }
        if (SchemaEngine::has($context->business, 'logo_url')) {
            $business['logo'] = array('@type' => 'ImageObject', 'url' => $context->business->logo_url);
        }

        $graph = array($article, $business);
        if (count($record->faqs) > 0) {
            $questions = array();
            foreach ($record->faqs as $faq) {
                $questions[] = array(
                    '@type' => 'Question',
                    'name' => $faq->question,
                    'acceptedAnswer' => array('@type' => 'Answer', 'text' => $faq->answer),
                );
            }
            $graph[] = array(
                '@type' => 'FAQPage',
                '@id' => $pageUrl . '#faq',
                'inLanguage' => $language,
                'isPartOf' => array('@id' => $pageUrl),
                'mainEntity' => $questions,
            );
        }
        return array('@context' => 'https://schema.org', '@graph' => $graph);
    }

    public static function buildString($record, $context)
    {
        return CanonicalJson::encode(self::build($record, $context));
    }

    /**
     * The one way to put it in a page. <, > and & are written as \u escapes so
     * no text in a record can close the script element.
     */
    public static function buildScriptTag($record, $context)
    {
        $json = str_replace(
            array('<', '>', '&'),
            array('\\u003c', '\\u003e', '\\u0026'),
            self::buildString($record, $context)
        );
        return '<script type="application/ld+json">' . "\n" . $json . "\n" . '</script>';
    }
}
