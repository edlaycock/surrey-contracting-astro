# Rendering contract

Case Study Core, `schema_version: 1`.

**This is a contract, not a finished design.** It fixes what a case study page is made of: the semantic structure, the elements that must be there, image handling, accessibility and schema markup. Section 9 records the **default layout direction** decided on 14 November 2026, which the first templates follow. It is a starting point: the owner sees it on the pilot site before any other client does, and it can change without touching the record. Colours, fonts and spacing are not set here at all; they come from each site. Nobody should treat any earlier template as the approved look.

The contract applies to anything that renders a case study: the WordPress plugin's templates, the Astro kit for server sites, a hosted page, and whatever comes later. A renderer takes two inputs and nothing else: a published record that passed `assertPublishable`, and the site context (`jsonld.md`).

## 1. When a page may exist

- Only for a record with status `published`.
- An unpublished case study returns **410 Gone**, with no body content from the record. Its images and every resized copy are deleted, and it leaves listings, sitemaps and feeds.
- A draft is never reachable at a public URL, including by guessing a preview link without being signed in.

## 2. Page structure

In this order, which is the default layout of section 9. The heading levels and the required content do not change whatever the look.

| # | Element | Content | Required |
|---|---|---|---|
| 1 | `<article>` | Wraps everything below. One per page | Yes |
| 2 | `<h1>` | `title`. The only `h1` on the page | Yes |
| 3 | Meta line | Service category, town (only when `show_town` is true), month and year as "October 2026". Text, not an image | Yes |
| 4 | Top slot | **When the record has a before and after pair:** the pair with the lowest `pair` number, as one `<figure>` holding both images side by side, before first, each labelled in text. **Otherwise:** the hero image | Yes |
| 5 | Sections | The sections the record has (three to five), each a `<section>` with the `question` as an `<h2>` and the `answer` as paragraphs, in record order, in one reading column. A section the record does not have is simply absent: no empty heading, no placeholder | Yes, each one present |
| 6 | Further pairs | Any other before and after pairs, each as a side by side `<figure>` | When more pairs exist |
| 7 | Gallery | Photos with role `other`; any unpaired before or after photo with its label; **and the hero, when a pair took the top slot**. In `order` | When such photos exist |
| 8 | FAQs | One `<h2>` for the block, then each `question` as an `<h3>` with its `answer` | When `faqs` is not empty |
| 9 | Call to action | Supplied by the site: how to get in touch. Not from the record | Yes |
| 10 | JSON-LD | One `<script type="application/ld+json">`, exactly as `buildJsonLdScriptTag` returns it (`jsonld.md`) | Yes |

**The hero keeps its other jobs wherever it sits on the page.** It is always the featured image (the WordPress post thumbnail), the image on listing cards, the Open Graph and social image, and the first image in the JSON-LD.

Rules:

- All record text is plain text and is HTML-escaped on output. A line break in an answer starts a new `<p>`.
- Nothing from `consent`, no `checked` data, no `id`, `version` or `sha256` is ever output in visible markup or in attributes.
- The page shows no customer name, address, postcode, exact date, price or job reference. The validator has already refused them; a renderer does not add them from anywhere else (for example from WordPress post meta left over from an earlier plugin version).
- The month is written in words with the year. The record's publish timestamps may appear only inside JSON-LD and Open Graph tags.
- Heading levels never skip: `h1`, then `h2`, then `h3`.

## 3. Stable hooks

So that one stylesheet or theme can serve every renderer, these class names are part of the contract. They carry no styling of their own.

```html
<article class="cs">
  <header class="cs-header">
    <h1 class="cs-title">…</h1>
    <p class="cs-meta">
      <span class="cs-meta-service">Garden fencing</span>
      <span class="cs-meta-town">Hersham</span>
      <span class="cs-meta-month">October 2026</span>
    </p>
  </header>
  <!-- top slot: the first pair when there is one, otherwise the hero -->
  <figure class="cs-top cs-pair">
    <div class="cs-pair-before"><img …><span class="cs-pair-label">Before</span></div>
    <div class="cs-pair-after"><img …><span class="cs-pair-label">After</span></div>
    <figcaption>…</figcaption>
  </figure>
  <!-- or: <figure class="cs-top cs-hero"><img …></figure> -->
  <div class="cs-story">
    <section class="cs-section cs-section-need"><h2>…</h2><p>…</p></section>
    <section class="cs-section cs-section-work"><h2>…</h2><p>…</p></section>
    <section class="cs-section cs-section-result"><h2>…</h2><p>…</p></section>
  </div>
  <section class="cs-pairs"><figure class="cs-pair">…</figure></section>
  <section class="cs-gallery"><figure><img …><figcaption>…</figcaption></figure></section>
  <section class="cs-faqs"><h2>…</h2><h3>…</h3><p>…</p></section>
  <aside class="cs-cta">…</aside>
</article>
```

Each section carries the class `cs-section-` plus its key. Only the sections the record has are output.

## 4. Images

| Rule | Detail |
|---|---|
| Source | Only the published derivative: metadata stripped, re-encoded, longest edge at most 2,560 pixels. The original upload does not exist on the site |
| Sizes offered | Up to four widths per image, never upscaled: 480, 800, 1200 and 1600 pixels wide, plus the derivative itself if it is smaller than 1600. Offered with `srcset` and a `sizes` attribute that matches the layout |
| Hero | At least 1,200 pixels wide is recommended. A narrower hero is allowed: the validator returns the warning `photos.hero_narrow`, the authoring screen shows it, and the image is never stretched |
| Format | JPEG always available. A renderer may also offer WebP or AVIF through `<picture>` |
| Dimensions | Every `<img>` has `width` and `height` attributes from the record, so the page does not jump as images load |
| Loading | The hero is not lazy-loaded and may be given high fetch priority. Every other image has `loading="lazy"` and `decoding="async"` |
| Alt text | Always the record's `alt`. Never empty, never the file name |
| Captions | The record's `caption` in a `<figcaption>` when present |
| File names | Derived from the ref or hash. Never the uploaded file name |
| Resized copies | Made from the derivative, so they carry no metadata either. Deleted with it on unpublish |
| Cropping | **Photos are shown whole in the body of the page**, in their own proportions: top slot, pairs and gallery. A listing card may crop its thumbnail to keep the grid even |

## 5. Accessibility

Target: WCAG 2.2 level AA. These hold whichever look is chosen, and a look that cannot meet them is not eligible.

- One `h1`, headings in order, the page reachable and readable with a screen reader in source order.
- Text contrast at least 4.5 to 1 (3 to 1 for large text) against its background, including text over images.
- Before and after are told apart by a text label, not by position or colour alone. On a narrow screen the pair stacks, before above after. There is no comparison slider in version 1.
- Any lightbox or carousel: keyboard operable, focus visible and kept inside while open, closes on Escape, returns focus to where it was.
- Links and buttons have text that makes sense on its own. Targets at least 24 by 24 CSS pixels.
- No information only in an image. No text baked into images.
- Motion is not essential, and respects the reduced-motion setting.
- `lang="en-GB"` on the page or the article.
- FAQs shown as an accordion use real buttons with `aria-expanded`, and all answers are in the page source.

## 6. Head and schema markup

| Tag | Value |
|---|---|
| `<title>` | `title`, then the site name |
| Meta description | `excerpt` |
| Canonical link | The page URL, the same value passed to the JSON-LD builder as `page_url` |
| Open Graph | `og:type=article`, `og:title`, `og:description`, `og:url`, `og:image` (the hero at 1200 wide or its nearest size), `og:image:alt` (the hero's alt), `og:locale=en_GB`, `article:published_time`, `article:modified_time` |
| Twitter card | `summary_large_image` with the same title, description and image |
| JSON-LD | Section 2 row 10. One block, built by the core builder, never hand-written and never also emitted by an SEO plugin for the same page |

If the site runs an SEO plugin that emits its own `Article` markup, the renderer switches that off for case study pages or feeds the plugin the core's graph. Two competing `Article` blocks on one page is a fault.

## 7. Listing pages and cards

The listing (an archive or "Our work" page) is **a grid of cards**. A card shows: the hero (alt text included), the title as a link, the meta line and the excerpt. Cards are ordered by `published_at`, newest first, unless the site chooses otherwise. **Once a site has more than six case studies, a filter by service category appears above the grid**; with six or fewer there is none. The filter is a list of links or buttons that works without JavaScript. Unpublished and draft case studies never appear.

## 8. What a renderer must not do

- Add any field of its own to the page from outside the record and the site context.
- Fetch images from a URL in the record. There are none. Images come from the site's own stored derivatives, by ref.
- Cache a page past an unpublish. Unpublish clears page and CDN caches for the URL.
- Show a YTQ-sourced case study as editable on a WordPress site. It is read-only there and edited in YTQ.

## 9. The default layout direction, and what is still open

Decided on 14 November 2026 as the default. It is rendering only: it can change without touching the record, the schema or the fixtures.

| Question | Default |
|---|---|
| What comes first under the title | **Before and after first.** When the record has a pair, the first pair takes the top slot, side by side. The hero then moves to the gallery, and still feeds the featured image, listing cards, social and JSON-LD. With no pair, the hero takes the top slot |
| Before and after | **Side by side.** No comparison slider in version 1 |
| The story | **One reading column**, the sections in order, each question a heading |
| Whose styling | **The site's own fonts and colours, with our layout.** The stable hooks in section 3 carry the layout; the theme supplies type and colour |
| Photo shape | **Whole photos, not cropped,** in the body of the page |
| Listing page | **A grid,** with a service filter once a site has more than six case studies |

Sections 2, 3, 4 and 7 above are written to this default.

Still open:

- **The owner's look at it on the pilot site.** No other client gets the templates before that.
- **Design tokens for the layout itself:** column width, spacing scale, the gap between a pair, card proportions, how many cards per row at each width. These are set when the first templates are built and recorded here, versioned with the core, so both renderers are built from the same numbers.
- **Whether a site may opt out of "the site's own fonts and colours"** for a Cumulus-styled look. Not offered in version 1.
