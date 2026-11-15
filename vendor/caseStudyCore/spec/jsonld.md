# JSON-LD output

Case Study Core, `schema_version: 1`.

Every case study page carries one JSON-LD block. It is built by the core builder, in PHP on WordPress and in Node everywhere else, and the two builders produce the same bytes for the same input. The golden fixtures hold them to it (`core/fixtures/*.jsonld.json`, `*.script.html`).

Google limits FAQ rich results to a narrow set of sites, so do not expect FAQ snippets in search results. The gain is clear question and answer structure for readers and for AI answer engines.

## 1. Inputs

1. A published record. **The builder checks it itself.** It refuses a record whose status is not `published` (`jsonld.not_published`) and then runs `validateRecord` and refuses anything invalid (`jsonld.record_invalid`), so it cannot be used to put unchecked text on a page. It runs without forbidden terms, which only the publishing track knows; the track's own `assertPublishable` call, with terms, is still the publish gate.
2. The **site context**, which is not part of the record: `core/schema/site-context.v1.schema.json`.

```json
{
  "page_url": "https://www.example-fencing.co.uk/case-studies/closeboard-garden-fencing-hersham-october-2026/",
  "language": "en-GB",
  "business": {
    "name": "Example Fencing Ltd",
    "url": "https://www.example-fencing.co.uk/",
    "logo_url": "https://www.example-fencing.co.uk/assets/logo.png",
    "address": {
      "street_address": "Unit 4, Example Trading Estate",
      "locality": "Walton-on-Thames",
      "region": "Surrey",
      "postal_code": "KT12 9ZZ",
      "country": "GB"
    }
  },
  "images": {
    "ph_after_wide_01": "https://www.example-fencing.co.uk/media/case-studies/ph_after_wide_01.jpg"
  }
}
```

| Field | Rule |
|---|---|
| `page_url` | The canonical `https` URL of the page. No user part (`@`), no query string, no fragment |
| `language` | Optional, default `en-GB` |
| `business.name`, `business.url` | The business whose site this is. Required. The URL has no user part, query string or fragment, because `#business` is added to it |
| `business.logo_url` | Optional |
| `business.address` | Optional: `{street_address?, locality, region?, postal_code, country}`, `country` as two capital letters. **The business's own public address, as shown on its website. Never the customer's** |
| `business.type` | Optional schema.org type, for example `FencingContractor` |
| `images` | One entry per photo ref, giving the public URL of that photo's derivative on this site. A photo with no entry is refused (`jsonld.image_url_missing`) |

A context that does not match its schema is refused (`jsonld.context_invalid`).

## 2. The graph

`{"@context": "https://schema.org", "@graph": [Article, business, FAQPage]}`. The `FAQPage` node is present only when the record has FAQs.

**Article**

| Property | Value |
|---|---|
| `@id` | `page_url` + `#article` |
| `url` | `page_url` |
| `mainEntityOfPage` | `{"@type": "WebPage", "@id": page_url}` |
| `headline` | `title` |
| `description` | `excerpt` |
| `inLanguage` | The context language |
| `datePublished` | `published_at` |
| `dateModified` | `modified_at` |
| `articleSection` | `service_category` |
| `about` | `{"@type": "Service", "name": service_category, "provider": {"@id": business}}`, plus `"areaServed": {"@type": "Place", "name": town}` only when `show_town` is true |
| `contentLocation` | `{"@type": "Place", "name": town}`, only when `show_town` is true |
| `image` | One `ImageObject` per photo: `url` from the context, `width`, `height`, and `caption` set to the photo's `alt`. Hero first, then the rest by `order` |
| `author`, `publisher` | `{"@id": business}` |

**The business**

| Property | Value |
|---|---|
| `@type` | `business.type` when the context gives one. Otherwise **`LocalBusiness` when the context gives an address, and `Organization` when it does not**. `LocalBusiness` without an address is reported by markup validators, so it is never emitted that way |
| `@id` | `business.url` + `#business` |
| `name`, `url` | From the context |
| `address` | `{"@type": "PostalAddress", streetAddress?, addressLocality, addressRegion?, postalCode, addressCountry}`, only when given |
| `logo` | `{"@type": "ImageObject", "url": logo_url}`, only when given |

**FAQPage** (only when `faqs` is not empty)

| Property | Value |
|---|---|
| `@id` | `page_url` + `#faq` |
| `inLanguage` | The context language |
| `isPartOf` | `{"@id": page_url}` |
| `mainEntity` | One `Question` per FAQ, in record order: `name` is the question, `acceptedAnswer` is `{"@type": "Answer", "text": answer}` |

Never in the output: anything from `consent`, the photo ticks, `id`, `version`, `sha256`, the photo captions' authors, or the town when it is switched off. Tests in both languages check this.

The five question-led sections are page content and are not repeated in the JSON-LD. Only `faqs` feed the `FAQPage`.

## 3. Serialisation: how the bytes are fixed

Both builders serialise the same way (`canonicalJson` in Node, `CanonicalJson::encode` in PHP):

- Object keys sorted in ascending Unicode code point order (which is also UTF-8 byte order), at every level. JavaScript's default sort compares UTF-16 units and differs above U+FFFF, so the Node implementation does not use it.
- Two-space indent, one item per line, `"key": value` with one space after the colon. Empty array `[]`, empty object `{}`.
- Strings as UTF-8 with only `"`, `\` and control characters escaped. `/` and non-ASCII characters are written as they are.
- Integers only, no larger than 9,007,199,254,740,991. The graph has no fractional numbers.
- No trailing newline from the function. Files in `core/fixtures` end with one newline.

`buildJsonLdScriptTag` (Node) and `JsonLd::buildScriptTag` (PHP) wrap that text for the page:

```
<script type="application/ld+json">
…canonical JSON, with every <, > and & written as \u003c, \u003e and \u0026…
</script>
```

Those three escapes mean no text in a record can close the script element or open a tag. A renderer outputs the returned string exactly. It does not re-encode it, pass it through a templating filter, or build the block itself.

## 4. Worked example

The `valid-minimal` fixture: three sections, one photo, no FAQs, town switched off and a site that gives no address, so there is no `FAQPage`, no `contentLocation`, no `areaServed`, and the business is an `Organization`. This is the exact text of `core/fixtures/valid-minimal.script.html`, and a test fails if this document and that file ever differ.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": "https://www.example-paving.co.uk/our-work/block-paving-driveway-relaid-september-2026/#article",
      "@type": "Article",
      "about": {
        "@type": "Service",
        "name": "Driveways",
        "provider": {
          "@id": "https://www.example-paving.co.uk/#business"
        }
      },
      "articleSection": "Driveways",
      "author": {
        "@id": "https://www.example-paving.co.uk/#business"
      },
      "dateModified": "2026-09-30T16:25:00Z",
      "datePublished": "2026-09-30T16:25:00Z",
      "description": "A sunken block paving driveway lifted, re-based and relaid with the original blocks.",
      "headline": "Block paving driveway relaid, September 2026",
      "image": [
        {
          "@type": "ImageObject",
          "caption": "Level block paving driveway after relaying",
          "height": 900,
          "url": "https://www.example-paving.co.uk/media/wp-att-000412.jpg",
          "width": 1200
        }
      ],
      "inLanguage": "en-GB",
      "mainEntityOfPage": {
        "@id": "https://www.example-paving.co.uk/our-work/block-paving-driveway-relaid-september-2026/",
        "@type": "WebPage"
      },
      "publisher": {
        "@id": "https://www.example-paving.co.uk/#business"
      },
      "url": "https://www.example-paving.co.uk/our-work/block-paving-driveway-relaid-september-2026/"
    },
    {
      "@id": "https://www.example-paving.co.uk/#business",
      "@type": "Organization",
      "name": "Example Paving",
      "url": "https://www.example-paving.co.uk/"
    }
  ]
}
</script>
```

The full example, with six photos, the town shown, a `LocalBusiness` with its address and three FAQs (one containing `&` and `<`), is `core/fixtures/valid-full.jsonld.json` and `valid-full.script.html`.

## 5. Changing the output

Any change to the graph changes the golden files, and both builders, in the same pull request. `core/run-tests.sh` runs both and compares their output byte for byte, so a change made to one builder alone cannot pass.
