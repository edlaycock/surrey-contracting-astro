# Privacy: what a case study must never contain

Case Study Core, `schema_version: 1`.

A case study is anonymous by default: town only (with a switch to hide even that), month only, and never the customer's name, contact details, address, postcode, job reference, exact dates or prices.

Three controls enforce it. The first two are in the core and are identical in both tracks. The third is each track's own job.

## 1. Structure: no place to put it

The schema has no field for any forbidden item and rejects every unknown field (`record.md` section 3). The town accepts no digits. The month has no day. A photo is an opaque ref, never a file name.

## 2. Content: the checks both tracks must run before publish

`validateRecord` runs these on every record, whatever its status. A track must not publish a record that fails any of them.

**There is no override. The author rewords.** That rule holds on one condition, and the condition is tested: ordinary trade wording must pass. Standards ("BS 1722", "BS 5837:2012"), sizes ("2.4m", "6ft", "6ft x 6ft panels", "C24 8ft lengths", "4/10/20 mm aggregate"), "10 year guarantee", "24 hour", colour and product codes ("RAL 7016", "IP65", "part number 0123456789") are in `core/fixtures/privacy-samples.json` as text that must not be flagged, about sixty pieces in all. A pattern change that blocks any of them fails the tests in both languages. If honest wording is still blocked in use, the fix is a new sample and a pattern change in the core, never a bypass in one track.

### 2.1 Which text is scanned

Every string in the record, wherever it sits, except values that are fixed choices or timestamps: `schema_version`, `version`, `source`, `status`, `completed_month`, the `_at` times, `role`, `sha256`, section `key`, `wording_version`, `customer_permission`.

| Kind | Fields | What applies |
|---|---|---|
| Public text | Title, slug, excerpt, service category, town, section questions and answers, FAQs, alt text, captions, the social caption and link label | Every pattern, forbidden terms, hidden town |
| Private text | `consent.note`, `consent.withdrawn_reason`, `confirmed_by`, `ticked_by` | Never rendered, but it is stored and may travel, so the contact patterns (scope `everywhere`) and forbidden terms still apply. Prices, dates and references are allowed: "Agreed by text on 3 November" is a reasonable note |
| Identifiers | `id`, photo `ref` | They reach public file names and URLs. Scanned with hyphens and underscores read as spaces, for postcodes, emails, forbidden terms and the hidden town, and for references when the value has a hyphen or underscore in it. The phone, price, date and street patterns are not run on them, and the reference patterns are not run on an unbroken id: a random id is a run of letters and digits, and measured on 200,000 of each, the phone pattern misfires on about one random UUID in 150 and the reference patterns on about one unbroken 20-character id in 6,500. An id cannot be reworded, so a check that can misfire on a generated one is not run |

The slug is public text scanned with its hyphens read as spaces, so `fencing-kt12-4rg` is caught.

Fields that are not part of the schema are scanned too. They are refused anyway, but the report then says both that the field is not allowed and what was in it.

### 2.2 Folding, before any pattern runs

Text is folded so that the same thing written in a different way is still the same thing. The table is `core/schema/text-folding.v1.json`, loaded by both implementations.

1. **Remove invisible characters and combining marks:** every character in Unicode categories Cf (format) and Mn (non-spacing mark), plus the soft hyphen, the Mongolian vowel separator, the zero-width and directional marks and the variation selectors. A postcode with a zero-width space or a left-to-right mark in the middle is still a postcode. **The list of those characters is in the table itself** (`marks_and_format`, 379 ranges, taken from Unicode 17.0); neither language asks its own Unicode library, because Node and PHP ship different Unicode versions and an older PHP knows fewer of these characters.
2. **Every kind of space becomes a plain space:** tab, line breaks (LF, CR LF and CR alike), no-break space, the en and em spaces and the rest. This is for checking only: the stored text keeps its line breaks. A string with line breaks (only an answer may have them) is also checked one line at a time by the patterns in 2.3, so a line break, and a blank line between paragraphs, ends a clause there. Forbidden terms and the hidden town are compared on the whole text.
3. **Lookalike characters become the plain ones:** fullwidth letters, digits and punctuation; superscript and subscript digits; accented Latin letters lose the accent (`ö` to `o`, `á` to `a`), across Latin-1, Latin Extended-A and B and Latin Extended Additional, so Romanian `Ș` and Vietnamese `ễ` are covered; every kind of apostrophe and quotation mark becomes the straight one; every kind of dash and hyphen becomes `-`; the lira sign and the fullwidth pound become `£`; the ohm sign becomes the Greek letter and the angstrom sign becomes `A`.
4. Runs of spaces collapse to one and the ends are trimmed.

This does the part of Unicode NFKC normalisation that matters here, **from a table instead of from the platform**. PHP's own normaliser needs the `intl` extension, which a WordPress host may not have, and two platforms' normalisers are not guaranteed to agree; a table gives the same answer in Node and PHP on any host. A test checks the table against real NFKC for the fullwidth block and against Unicode decomposition for the accented letters.

**What the table does not fold, it refuses.** Blocks of styled or enclosed letters and digits that NFKC would turn into ordinary ones (mathematical bold and italic alphabets, circled and parenthesised numbers, letterlike symbols, Roman numeral characters, the rest of the halfwidth and fullwidth block) are rejected outright with `text.unsupported_character`. So a phone number written in mathematical bold digits does not get through; it cannot be published at all. Ordinary symbols (`™`, `°`, `²`, `½`, `×`) and emoji are not affected.

Nothing in folding depends on the Unicode version of the host. An earlier draft used each language's own tables for categories Cf and Mn; a full comparison found 118 characters on which Node and this PHP disagreed, so the lists moved into the table.

### 2.3 The patterns

The patterns live in `core/schema/privacy-patterns.v1.json` and both implementations load them from that file. They are written in the syntax common to ECMAScript (`u` flag) and PCRE: explicit character classes only. Both loaders **refuse** a pattern that uses `\d`, `\w`, `\s`, `\b`, a dot outside a class, an inline flag or a possessive quantifier, because the two engines disagree on all of those. The table below is a reading aid. The file is the rule.

| Code | Scope | Catches |
|---|---|---|
| `privacy.postcode` | everywhere, identifiers | A full UK postcode, any case, with up to three of space, `.`, `,`, `/`, `_` or `-` between the two halves: `KT12 4RG`, `kt124rg`, `KT12-4RG`, `KT12, 4RG`, `GIR 0AA` |
| `privacy.email` | everywhere, identifiers | An email address, with or without spaces round the `@`: `jo.bloggs@example.com`, `jo @ example.com` |
| `privacy.phone` | everywhere | A UK phone number: starts `0`, `+44`, `0044` or `44 7`; 10 or 11 digits in national form; with up to three spaces, dots, hyphens, slashes, underscores or brackets between digits: `07700 900123`, `(01632) 960-123`, `0 7700 900123`, `447700900123`, `07700 - 900 - 123` |
| `privacy.street_address` | everywhere | A house number (optionally with a letter or a comma), one to three capitalised words, then Road, Street, Avenue, Lane, Crescent, Grove, Mews, Rd, St or Ave; or the same all in capitals: `14 Orchard Road`, `2b Upper High Street`, `14, Acacia Road`, `14 ACACIA ROAD` |
| `privacy.price` | public | `£`, `€` or `$` before a digit; a number before pound, pounds, quid, pence, GBP, euro, dollars; GBP before a digit; a number before "grand"; a money word (cost, paid, price, quoted, total and similar) followed by a number ending in `k`; a price word (cost, price, paid, charged, quoted, budget, bill, worth, not "total") followed by a number of three or more digits that ends the clause (a full stop or other closing punctuation, the end of the text or of a line, or a comma not followed by a list of sizes) or is followed by `+`, "inc", "plus" or "all in": `cost 4500`, `cost: 4500 + VAT`, `priced 1200 inc VAT`, `charged 850`, `quoted 100.` |
| `privacy.exact_date` | public | Day and month name; month name and ordinal day; month name, day and year; month name and day at the end of a phrase; numeric dates with a four-digit year and `/`, `.` or `-`; two-digit-year dates where the day or month has a leading zero; ISO dates with `-` or `/` |
| `privacy.reference` | public, identifiers that contain a hyphen or underscore | "ref" or "reference", optionally then "no", "number", "num" or `#`, followed by something with a digit in it (`ref 12345`, `reference number 12345`, `ref no. 12345`); job, quote, quotation, invoice, enquiry, order, PO, INV, ENQ or QUO followed by three or more digits, or by "no", "number", "ref" or `#` and any number |

A month and year ("November 2026") is allowed. So is a month alone.

How the patterns stay out of the way of trade wording:

- **Postcode.** A size is not a postcode: the second half is not matched when it is a digit followed by `ft`, `st`, `nd`, `rd`, `th`, `yd`, `lb`, `ah`, `hz` or `db` in lower case, which is how "C24 8ft lengths", "M8 1st fix" and "Part L1 2nd edition" pass. A real postcode in capitals ending in those letters (`KT12 4ST`) is still caught.
- **Date.** "may" and "march" count as months only with a capital letter, so "12 may be required" passes. A two-digit year needs a leading zero somewhere, so "4/10/20 mm aggregate" and "10-12-14 mm" pass. A month followed by a number and then more words ("In March 12 metres of fencing blew down") is not a date.
- **Phone.** A number introduced as a part number, model number, serial number, product code, item code, barcode or SKU is not a phone number.
- **Price.** "weighs 20 pounds" and "a 4 pound lump hammer" are weights. A number after a price word is a price only when it ends the clause: "total of 4500 blocks", "cost 200 hours of labour", "paid 120 per metre" and "budget of 5000 was tight" pass. A comma ends the clause unless what follows is a list of sizes: more numbers, joined by commas, "and", "or", "to", a hyphen, `x` or `/`, the last of them followed by a unit (mm, cm, m, ft, kg, metre or metres, inch or inches; `in` and `t` only written against the number, as in "6in" and "20t"; `x` before another number) or a size word (size, sizes, wide, high, long, deep, thick, tall, gauge, diameter, dia). So "price 150, 200 and 250mm sizes" and "priced 900, 1200 or 1800mm wide" pass, while "It cost 4500, which was fair", "cost 4500, 2 days work", "cost 4500, 50% up front", "priced 4500, 5200 with gravel boards" and "paid 300, 400 and 500." are caught. `%` is not a unit here, because "cost 4500, 50% up front" is a price and a deposit. A year from 2015 to 2039 that ends the clause is not a price ("costs 2026.", "price 2025: held"); the same number followed by `+`, "inc", "plus" or "all in", or with pence ("costs 2026.50"), still is, and any number outside that band is a price ("The job cost 2000", "paid 1950.", "cost: 2000."). Any other number of three or more digits that ends the clause is caught, however small: "quoted 100." is a price.
- **Street.** Close, Drive, Way, Gardens and Terrace are not in the list, because "6 Foot Close Board", "A new 40 Metre Drive", "2 Raised Gardens" are ordinary wording.
- **Email.** The part after the `@` must end in a dot and letters, so "posts@1.8m centres" passes.

### 2.4 Forbidden terms supplied by the track

The patterns cannot know the customer's name. A track that knows the customer's details must pass them:

```js
validateRecord(record, { forbiddenTerms: [
  { label: 'customer name', value: 'Priya Raman' },
  { label: 'customer surname', value: 'Raman' },
  { label: 'customer phone', value: '07700 900123' },
  { label: 'customer street', value: '14 Orchard Road' },
] });
```

- Each term is exactly `{label, value}`, both strings. Anything else throws, and so does an option name the validator does not know. The check is never skipped quietly.
- A term matches as a whole word or phrase. Before comparing, both sides are folded as in 2.2 and hyphens, underscores, full stops, commas and slashes are read as spaces. So `Smith-Jones` matches "Smith Jones", `Zoë` matches "Zoe" and "ZOË", and `Raman` does not match inside another word.
- **Possessives are caught.** A term followed by `'s` or `s'` still matches: `Raman` catches "Mrs Raman's garden", `Smith` catches "the Smiths' drive", `O'Brien` catches "O’Brien's wall", `Wells` catches "Mr Wells's van".
- **Plain plurals are not caught.** `Rose` does not catch "roses", and `Smith` does not catch "the Smiths were pleased", nor `Jones` "the Joneses". Matching plurals in general would make `Bath` catch "baths". A family name in the plural is still a name in print, so **Track 2 passes the plural of each surname as its own term**: `Smiths` for Smith, `Joneses` for Jones, `Ramans` for Raman.
- **The misplaced apostrophe of a surname ending in `s`.** "Mr Jone's driveway" and "Mrs William's patio" are common misspellings of "Jones's" and "Williams's". `Jones` does not catch them, because a one-word term does not take the possessive rule below. **Track 2 passes that form as its own term**: `Jone's` for Jones, `William's` for Williams. `Jone's` catches "Mr Jone's driveway".
- **Apostrophes.** A term is tried with its apostrophes dropped and with them read as breaks, so `O'Brien` matches "O’Brien", "O Brien" and "OBrien". The reverse does not hold: `OBrien` does not catch "O’Brien", nor `Darcy` "D’Arcy’s", so the track passes a name as the customer record spells it, apostrophe included. An apostrophe in the text is never dropped, so the surname `Cant` does not catch "we can't", nor `Hell` "he'll".
- **A term of two or more words** also matches the possessive spelling of any of its words that ends in `s`, so `St Johns Road` catches "St John's Road" and the hidden town `St Albans` catches "St Alban's". A one-word term does not: `Wells` does not catch "the well's cover", nor `Banks` "the bank's edge", `Gates` "the gate's hinges", `Waters` "the water's edge", `Woods` "the wood's grain", `Williams` "William's van" or `Its` "it's". Words are counted with apostrophes dropped, so `O'Briens` is one word.
- A term with seven or more digits is also compared as a phone number: digits only, with a leading `0`, `44` or `0044` removed, against each run of digits in the text. So `07700 900123` also catches `+44 7700 900123` and `07700-900 123`, and is not assembled from unrelated numbers in the same sentence.
- Terms shorter than two characters are ignored.
- **The core does not split a name.** `Sam Carter` does not catch "Mr Carter". The track passes each part it wants caught.
- A hit is `privacy.forbidden_term` on the field. The label is for the track's own message to the author; the validator's result never repeats the value.

Track 2 passes at least: the full name, each part of the name of three letters or more, the plural of each surname, the misplaced-apostrophe form of each surname ending in `s`, email, phone, and the first line of the site address. Track 1 collects none of these and passes nothing. The forbidden terms are never stored in or beside the record.

### 2.5 Hidden town

When `location.show_town` is `false`, any public text or identifier that names the town is `privacy.hidden_town`. The comparison is the same as for a forbidden term, so `St. Albans` catches "St Albans" and "St Alban’s", and `King's Lynn` catches "King’s Lynn" and "Kings-Lynn". A one-word town ending in `s` catches its own possessive but not a possessive of the word without the `s`: with Wells hidden, "Wells’ market" is refused and "the old well’s brick cap" passes. Renderers and the JSON-LD builder also leave the town out.

A town whose name is an ordinary word is caught as that word too: with Bath hidden, "Bath and shower room refit" is refused. The author rewords ("bathroom and shower room") or shows the town.

### 2.6 Text hygiene

Reported on any string in the record:

| Code | Meaning |
|---|---|
| `text.invalid_unicode` | The string is not valid Unicode (half of a surrogate pair in Node, bytes that are not UTF-8 in PHP). Nothing else is checked on it, because nothing else could be trusted |
| `text.control_character` | A control character other than a tab or a line break (LF, CR) |
| `text.line_break` | A line break outside a section or FAQ answer |
| `text.unsupported_character` | A styled or enclosed letter or digit (2.2) |

In PHP, a pattern that fails to run raises an exception. A failure is never read as "nothing found".

### 2.7 What these checks do not catch

These get through. Each is in `core/fixtures/privacy-samples.json` marked `known_limit`, so the list is tested: if one starts being caught, or a new gap is found, this section changes with it.

| Form | Example | Why it is left |
|---|---|---|
| A space inside the second half of a postcode | `KT12 4 RG` | Matching it also matches "C24 4 by 2" |
| A postcode run on to a word | `xKT12 4RG` | Matching inside words misfires on product codes |
| A lower-case postcode ending in a unit | `kt12 4st` | The price of letting "M8 1st fix" pass |
| A partial postcode | `our office is at KT12` | "M25", "A3" and "C24" look the same |
| A letter in place of a digit | `o7700 900123` | Not a pattern a table can settle |
| A phone number introduced as a part number | `part no 01632960123` | The price of letting part numbers pass |
| A phone number or email in words | `seven seven double zero`, `jo at example dot com` | Free text |
| A bare "k" with no price word | `5k`, `1.2k` | "a 5k resistor" and "4k cameras" look the same. After a price word it is caught ("cost 5k") |
| A bare amount after "total", or mid-clause | "total 4500", "cost 4500 and worth it" | "total of 4500 blocks" looks the same |
| A bare amount from 2015 to 2039 that ends the clause, whether by a full stop, other closing punctuation, a comma, the end of a line or the end of the text | `It was charged 2030.` | "costs 2026." and "price 2025: held" look the same |
| A bare amount followed by a comma and a size | `cost 4500, 600x600 slabs` | "price 150, 200 and 250mm sizes" looks the same |
| A street in lower case | `14 acacia road` | "a 3 metre access road" looks the same |
| Street types left out on purpose | `14 Acacia Dr`, `14 Acacia Close` | See 2.3 |
| A month and day followed by more words | `October 3 we started` | "In March 12 metres of fencing" looks the same |
| A short date with no leading zero | `Finished 3-11-26` | "4/10/20 mm" looks the same |

Accent folding and whole-word matching have a cost the other way: with `Rose` as a forbidden term "rosé" is refused, and with Mold as a hidden town so is "black mold". The author rewords.

Also not caught: a name the track did not supply, or a part of a name it did not pass; lookalike letters from other scripts, such as a Cyrillic "о"; a phone number or price in an `id` or `ref` unless it was passed as a forbidden term; anything in a photo, which is what the per-photo tick is for.

In Track 2 the real control for the customer's own details is the forbidden terms, built from the customer record. The patterns are a net under the author for everything else. Neither replaces the author reading the page, which is why the permission step comes last.

### 2.8 Where the two implementations could differ

Nothing in the fixtures, samples or probes differs, nor in about 380 further cases written by an independent reviewer and run through both. One thing is outside what those can prove:

- Whole-word and case-insensitive matching of a forbidden term or hidden town uses each regular expression engine's own idea of what a letter is and how case folds. They agree for the Latin letters the table folds to. For text in other scripts they may not.

## 3. Photos: each track's own job

- Every photo is re-encoded before it is stored for publication: all metadata removed (EXIF, GPS, XMP, IPTC, embedded thumbnails), longest edge at most 2,560 pixels, and the SHA-256 of the result recorded in the record.
- The original upload is deleted once the derivative exists. No file with metadata sits beside a published one.
- Published file names are derived from the ref or the hash, never from the uploaded file name. The ref itself is generated, never typed.
- Unpublish deletes the derivative and every resized copy.
- No photo is sent to an AI service in the first release. Role suggestions in YTQ come from metadata and timing only (`record.md` section 4).

## 4. AI drafting

The prompt is not a control. The checks above are. All the same, both tracks give the model only the job's own description and notes, tell it to leave out names, addresses, prices and dates, and tell it never to invent a fact or pad a section it cannot answer. Whatever comes back goes through the same validator as hand-written text, and a model's output never includes `consent`, `not_identifiable_statement` or `checked`.
