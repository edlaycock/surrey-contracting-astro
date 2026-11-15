# Social post specification

Case Study Core, `schema_version: 1`.

One short post per network, made from the record, only after the page is live, and never sent twice. A manual share ships first in both tracks. Direct posting through an API comes later and follows the same rules.

## 1. The text

`social` on the record is `{caption, link_label}`. It is optional: a case study with no social text can still be published, it just cannot be shared from the software.

| Rule | Detail |
|---|---|
| Length | **Two or three sentences.** 20 to 500 characters |
| Content | What was done and how it turned out. The town only when `show_town` is true. No customer details. It goes through the same forbidden content checks as every other text field |
| Link | **Never typed into the caption.** The composer adds it (section 2). A caption containing `http://`, `https://`, `www.` or a bare web address such as `example.co.uk/fence` or `bit.ly/abc` is refused (`social.contains_link`) |
| `link_label` | 3 to 60 characters, for example "See the full case study" |
| Image | The hero photo, from the site's published derivative |

How sentences are counted, so both tracks agree: after normalising whitespace, each run of `.`, `!` or `?` that is followed by a space, by a capital letter or by the end of the text closes one sentence; text that does not end in one of those has one more. The count must be 2 or 3. An abbreviation written with a full stop and a space ("approx. 3 days") counts as a sentence end, so the author writes "about 3 days".

## 2. The link

The page URL with UTM tags, in this order:

```
{page_url}?utm_source={source}&utm_medium=social&utm_campaign=case_study&utm_content={slug}
```

| Parameter | Value |
|---|---|
| `utm_source` | `facebook` or `instagram` for a post made on that network; `share` when the phone's share sheet is used and the destination is unknown |
| `utm_medium` | `social` |
| `utm_campaign` | `case_study` |
| `utm_content` | The record's `slug` |

Worked example for the `valid-full` fixture, shared to Facebook:

```
https://www.example-fencing.co.uk/case-studies/closeboard-garden-fencing-hersham-october-2026/?utm_source=facebook&utm_medium=social&utm_campaign=case_study&utm_content=closeboard-garden-fencing-hersham-october-2026
```

## 3. What is posted where

**Facebook.** The caption, a blank line, then the link label, a colon and the link:

```
A storm took down this back garden fence in Hersham. We replaced it with closeboard on concrete posts, stepped neatly down the slope. Three days from start to finish.

See the full case study: https://www.example-fencing.co.uk/case-studies/…/?utm_source=facebook&utm_medium=social&utm_campaign=case_study&utm_content=…
```

Either a link post or a photo post (the hero) with the link in the text.

**Instagram.** A photo post with the hero. **A link in an Instagram caption is not clickable**, so no URL is put there. The caption, a blank line, then the link label and where to find the link:

```
A storm took down this back garden fence in Hersham. We replaced it with closeboard on concrete posts, stepped neatly down the slope. Three days from start to finish.

See the full case study: link in our bio (example-fencing.co.uk)
```

The site name in brackets is the host of the page URL without `www.`. Keeping the bio link pointed at the site or its case studies page is the business's own job; the share screen says so.

## 4. Only after the page is live

A share or post is offered only when all of these are true:

1. The record has status `published`.
2. The publication to the website is confirmed live with a URL (in Track 2, the site's acknowledgement; in Track 1, the post is published and public).
3. The page answers 200 at that URL when checked from the server.

On a site set to hold arriving case studies as drafts (`feed.md`), nothing is shared until someone publishes the page there and the site reports it live.

## 5. Never sent twice

- One post per case study per network. The claim key is `id` plus network.
- The claim is written before the network is called, and it is checked first on every attempt. A second attempt finds the claim and does nothing.
- Publishing version n+1 of a case study does not post again. A new post for an edited case study is a deliberate action by a person, with its own confirmation, and is recorded as such.
- A call that times out leaves the post `uncertain`. Nothing is sent again in that state. The software looks for a post carrying the link before anything else happens, and a person resolves it if it cannot tell.

This was confirmed on 14 November 2026: one post per case study per network, and an edit never posts again unless a person asks.

Each post is recorded beside the case study (not inside the record) as:

```json
{ "network": "facebook", "state": "live", "post_id": "…", "permalink": "…", "claimed_at": "2026-11-02T14:10:00Z", "version": 2 }
```

States: `queued`, `uncertain`, `live`, `failed`, `removed`.

## 6. Manual share first

Available in both tracks from their first feature release, with no network account connected:

- **Share** on a phone opens the system share sheet with the text and the link (`utm_source=share`).
- **Share on Facebook** opens Facebook's own share dialog for the link (`utm_source=facebook`).
- **Instagram**: copy the caption with one tap, save the hero image, and a line explaining that the link goes in the bio.

A manual share cannot be confirmed by the software, so it is recorded only as "share opened" with a time, and it does not create a claim.

## 7. Unpublish

When a case study is unpublished, posts made through an API that allows deletion are deleted. For any other post, and for every manual share, the person is shown what was shared and asked to remove it. The link in an old post then leads to a 410 page.
