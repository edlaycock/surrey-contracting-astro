# Customer permission

Case Study Core, `schema_version: 1`, wording `v1`.

**The wording in this file is pending legal review (the review item already listed as OD-12).** The file `core/schema/consent-wording.v1.json` carries `"status": "pending_legal_review"`, `consentWordingStatus('v1')` returns it, and a test in each language fails if the marker changes without the tests changing.

**What that blocks, stated plainly.** The review does not block the build. It blocks the first publication for any client other than the pilot. **The core does not enforce this.** `validateRecord` and `assertPublishable` accept a record under a pending wording, because the core cannot know which site or account is the pilot. Each track enforces it: before a first publication it calls `consentWordingStatus`, and while the answer is `pending_legal_review` it publishes only for an account or site on its own list of pilots. For the pilot itself this is a process control: the owner knows the wording is unreviewed and has chosen to run the pilot on it.

## 1. The decision this implements

At launch, the trade's or client's own recorded confirmation that the customer agreed is enough to publish. The customer is not asked by the software. A later release adds a link the customer can confirm through (`yes_link`); the value exists now so that release needs no schema change.

Publish is refused without a consent record. There is no default answer, no pre-selected option and no skip.

## 2. The record

```json
"consent": {
  "customer_permission": "yes_written",
  "confirmed_by": "Sam Carter",
  "confirmed_at": "2026-11-02T14:03:40Z",
  "wording_version": "v1",
  "note": "Agreed by text message."
}
```

| Field | Rule |
|---|---|
| `customer_permission` | `yes_verbal`, `yes_written`, `yes_link` or `not_identifiable` |
| `confirmed_by` | The name of the trade's or client's staff member who confirmed. Set by the server from the signed-in person. Never the customer's name |
| `confirmed_at` | Server time, UTC. Never later than the publish it allows (`consent.confirmed_after_publish`) and never earlier than the tick on any photo it covers (`consent.confirmed_before_photo_tick`) |
| `wording_version` | The version of the wording the person was shown. `v1` |
| `not_identifiable_statement` | `{ticked_by, ticked_at}`. Required with `not_identifiable`, not allowed with any other value. Section 3 |
| `note` | Optional, up to 300 characters, for example "Agreed by text message". Private: never rendered, and left out of the feed. Still scanned for contact details |
| `withdrawn_at`, `withdrawn_reason` | Present, both, on every unpublished record and on no published one. Section 5 |

What the values mean:

| Value | Meaning |
|---|---|
| `yes_verbal` | The customer said yes in person or on the phone |
| `yes_written` | The customer said yes in a text, an email or a signed note, which the trade keeps |
| `yes_link` | The customer confirmed through a link sent to them. Not offered in any interface until that feature ships |
| `not_identifiable` | The customer was not asked, because no photo shows a house number, a number plate, a person or the front of the property, and nothing in the words identifies them. Allowed only with the ticked statement below |

## 3. Wording v1 (pending legal review)

The exact strings are in `core/schema/consent-wording.v1.json`. Both tracks display them from that file and neither rewrites them.

The question:

> Has the customer agreed to this work being shown?

The four answers, one of which must be chosen:

> Yes, they told me in person or on the phone.
>
> Yes, they agreed in writing (text, email or a signed note).
>
> Yes, they confirmed through the link we sent them.
>
> Permission was not asked: no photo shows a house number, a number plate, a person or the front of the property, and nothing in the words identifies the customer.

The statement the person confirms, for the three "yes" answers:

> I confirm that the answer above is true. The customer knows that a description and photos of this work will appear on our website and may be shared on our social media, that their name, address and contact details will not be shown, and that they can ask us to take it down at any time.

**The statement for "not identifiable".** It has its own tick box, never ticked in advance and never ticked by AI. The tick is stored as `not_identifiable_statement: {ticked_by, ticked_at}`, set by the server, and the validator refuses `not_identifiable` without it:

> I confirm that I have checked every photo and none shows a house number, a number plate, a person or the front of the property, and that nothing in the words identifies the customer or their home. If the customer asks us to take this down, we will.

The per-photo tick (see `record.md` section 4):

> I have looked at this photo. It shows no faces, number plates, house numbers or documents.

## 4. Rules for both tracks

- The permission step is the last step before publish, after the person has seen the final words and photos. The validator holds a record to that: permission dated before any photo's tick is refused, so ticking or replacing a photo afterwards means recording permission again.
- Nothing is selected when the step opens. The publish button stays disabled until an answer is chosen and the statement is confirmed.
- The record is written by the server at that moment. A client cannot write or edit `consent`.
- AI never fills in, suggests or pre-selects any part of this step.
- `confirmed_by` is the name of a member of the trade's or client's staff. It is never output on a page, in JSON-LD or in a social post, and it does not travel in the feed (`feed.md` section 2 replaces it with a fixed word).
- While the wording is `pending_legal_review`, the track publishes only for its pilot (top of this file).

**When permission is asked for again.** Not on every edit. Only when an edit:

1. adds a photo or changes a photo's file,
2. changes the location (the town, or whether it is shown), or
3. changes the kind of permission.

Any other edit to a published case study, including all of its text, is published as the next version on the existing consent record, carried over unchanged. The same rule applies before first publication: permission recorded on a draft survives text edits and does not survive those three changes. The status machine enforces it (`record.md` section 5, `transition.consent_not_fresh`, `transition.consent_changed`). A person may always choose to confirm again.

After an unpublish, publishing again always needs a new consent record.

## 5. Unpublish and withdrawal

The customer can change their mind at any time, and so can the trade. **Unpublish is the one way a publication ends, and it always records when and why on the consent record**, whether the customer withdrew, the trade changed its mind or the page was a mistake. The reason says which.

1. Someone presses **Unpublish** and gives a reason.
2. The server sets `status: "unpublished"`, `unpublished_at`, and on the consent record `withdrawn_at` and `withdrawn_reason`. Nothing else changes, including the version. The schema refuses an unpublished record without both fields.
3. Every place the case study was published removes it: the page returns 410 Gone, the image files and every resized copy are deleted, it leaves listings, sitemaps and feeds, and a tombstone goes out to receiving sites (`feed.md`).
4. Social posts: a post made through an API that allows deletion is deleted. Where it is not possible, the person is shown the post link and asked to delete it by hand, and that request is recorded.
5. The record is then frozen. The withdrawn consent record is kept exactly as it was, so there is a history of who confirmed what and when and why it ended. It cannot be edited and it is never reused.

A record with `withdrawn_at` set cannot have status `published`; the schema refuses it. Publishing again needs a new consent record confirmed after the unpublish, and is version n+1.

## 6. Open questions for the legal review

1. Is the trade's own recorded confirmation a sufficient basis, and under which lawful basis is it recorded?
2. Is `not_identifiable`, with its ticked statement, acceptable as a route that does not ask the customer, given that a photo of a back garden may still be recognisable to neighbours?
3. Does the statement need to name social media networks, or a retention period?
4. How long may a withdrawn consent record be kept, and what must it then contain?
5. For YTQ: the trade is the controller and YTQ the processor. Does the wording need a controller name inserted?
