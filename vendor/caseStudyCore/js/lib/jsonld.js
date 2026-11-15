'use strict';

// JSON-LD for a published case study: one Article, the business and, when
// there are FAQs, one FAQPage. core/spec/jsonld.md is the specification and
// core/php/src/JsonLd.php the PHP twin: change one, change both.

const { validateAgainst, has } = require('./schema-engine');
const { canonicalJson } = require('./canonical-json');
const { validateRecord } = require('./validate');
const contextSchema = require('../../schema/site-context.v1.schema.json');

class JsonLdError extends Error {
  constructor(code, detail) {
    super(detail === undefined ? code : code + ': ' + detail);
    this.name = 'JsonLdError';
    this.code = code;
  }
}

// Hero first, then the rest in order.
function photosInDisplayOrder(photos) {
  return photos.slice().sort((a, b) => {
    const heroA = a.role === 'hero' ? 0 : 1;
    const heroB = b.role === 'hero' ? 0 : 1;
    if (heroA !== heroB) return heroA - heroB;
    if (a.order !== b.order) return a.order - b.order;
    return a.ref < b.ref ? -1 : (a.ref > b.ref ? 1 : 0);
  });
}

// The builder validates the record itself (without forbidden terms, which only
// the publishing track knows) and refuses anything invalid or not published,
// so it cannot be used to put unchecked text on a page. context is the site
// context (core/schema/site-context.v1.schema.json).
function buildJsonLd(record, context) {
  if (record === null || typeof record !== 'object' || record.status !== 'published') {
    throw new JsonLdError('jsonld.not_published');
  }
  const checked = validateRecord(record);
  if (!checked.valid) {
    throw new JsonLdError('jsonld.record_invalid', checked.errors[0].code + ' ' + checked.errors[0].path);
  }
  const contextErrors = validateAgainst(contextSchema, context);
  if (contextErrors.length > 0) {
    throw new JsonLdError('jsonld.context_invalid', contextErrors[0].code + ' ' + contextErrors[0].path);
  }

  const pageUrl = context.page_url;
  const language = has(context, 'language') ? context.language : 'en-GB';
  const businessId = context.business.url + '#business';
  const showTown = record.location.show_town === true;

  const images = photosInDisplayOrder(record.photos).map((photo) => {
    if (!has(context.images, photo.ref)) throw new JsonLdError('jsonld.image_url_missing', photo.ref);
    return {
      '@type': 'ImageObject',
      url: context.images[photo.ref],
      width: photo.width,
      height: photo.height,
      caption: photo.alt,
    };
  });

  const about = { '@type': 'Service', name: record.service_category, provider: { '@id': businessId } };
  if (showTown) about.areaServed = { '@type': 'Place', name: record.location.town };

  const article = {
    '@type': 'Article',
    '@id': pageUrl + '#article',
    url: pageUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    headline: record.title,
    description: record.excerpt,
    inLanguage: language,
    datePublished: record.published_at,
    dateModified: record.modified_at,
    articleSection: record.service_category,
    about,
    image: images,
    author: { '@id': businessId },
    publisher: { '@id': businessId },
  };
  if (showTown) article.contentLocation = { '@type': 'Place', name: record.location.town };

  // LocalBusiness needs an address to be valid markup, so without one the
  // business is an Organization. A site may name a more specific type.
  const hasAddress = has(context.business, 'address');
  let businessType = hasAddress ? 'LocalBusiness' : 'Organization';
  if (has(context.business, 'type')) businessType = context.business.type;
  const business = {
    '@type': businessType,
    '@id': businessId,
    name: context.business.name,
    url: context.business.url,
  };
  if (hasAddress) {
    const given = context.business.address;
    const address = { '@type': 'PostalAddress', addressLocality: given.locality, postalCode: given.postal_code, addressCountry: given.country };
    if (has(given, 'street_address')) address.streetAddress = given.street_address;
    if (has(given, 'region')) address.addressRegion = given.region;
    business.address = address;
  }
  if (has(context.business, 'logo_url')) {
    business.logo = { '@type': 'ImageObject', url: context.business.logo_url };
  }

  const graph = [article, business];
  if (record.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': pageUrl + '#faq',
      inLanguage: language,
      isPartOf: { '@id': pageUrl },
      mainEntity: record.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

function buildJsonLdString(record, context) {
  return canonicalJson(buildJsonLd(record, context));
}

// The one way to put it in a page. <, > and & are written as \u escapes so no
// text in a record can close the script element.
function buildJsonLdScriptTag(record, context) {
  const json = buildJsonLdString(record, context)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return '<script type="application/ld+json">\n' + json + '\n</script>';
}

module.exports = { buildJsonLd, buildJsonLdString, buildJsonLdScriptTag, photosInDisplayOrder, JsonLdError };
