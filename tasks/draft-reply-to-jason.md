# Draft reply to Jason, 22 September 2026 (revised after reading the brief)

DRAFT FOR ED. Three things need your input before this goes:
  1. The chargeable question. Placeholder left in. Your call.
  2. Your availability next week.
  3. Whether you want the line asking which tool produced the brief. I think
     you do, and it is written to be curious rather than pointed.
Everything factual in here has been verified against the live site today.
The full change-by-change register is in jason-brief-register-2026-09-22.md
and is written so it can be attached as-is.

---

Subject: Re: Surrey Contracting, website audit and next steps

Hi Jason,

Good to hear from you, and no need to apologise for the length. Thanks for
sending the full brief through as well. That was much more useful than the
email on its own, and I have been through all 35 pages of it today, page by
page, against the live site.

Congratulations on the move out of Paul's yard. Good that Send is settled for
the foreseeable, because a stable address that matches everywhere is one of the
things Google weighs most heavily for local search. Shout when the new yard is
confirmed and I will check nothing needs changing.

## The short version

The brief got two things right that I had missed, and I want to lead with
those. It also got one big thing wrong, and I can show you exactly why. And
about half of it is a decision about what kind of business Surrey Contracting
wants to be, which is a conversation for the meeting, not a developer ticket.

## What the brief got right

**1. The asbestos claim. This is the important one.** The demolition page says
Surrey Contracting "carries out fully licensed and fully insured asbestos
removal". The homepage says we coordinate it. The demolition cost guide says a
licensed specialist does it. Three different stories on one site, and the
demolition page version is the risky one. Licensed asbestos work can only be
done by an HSE-licensed contractor, and if we do not hold that licence the page
is advertising something we cannot lawfully do.

So one question, and I need a straight answer: **does Surrey Contracting hold
a current HSE asbestos licence?** If yes, send me the licence number and I will
make the site consistent around it. If no, I change the demolition page and the
homepage card this week to say we coordinate licensed removal through a
specialist. I have the wording ready. Nothing else in the audit matters as much
as this.

**2. "Private approved inspector" is out of date.** Approved Inspectors were
replaced by Registered Building Control Approvers in England, and the four town
pages and the planning guide used the old term. That one is on us. It is
already fixed and goes out with the next deploy.

The brief also caught some genuine copy defects on the demolition and
earthworks pages, missing spaces and a spelling error, on the two pages that
have not been rewritten yet. Also fixed.

## What the brief got wrong

The brief's headline finding is that two project pages, Domestic Earthworks and
the Guildford landscaping job, are "still on the old template" showing the old
01932 number, the Leatherhead address, the old company number and Commercial
Surfacing in the navigation. It calls this critical and says those two pages
"prove" the new header and footer have not propagated.

They are not. I fetched both pages fresh today. Both carry 01483 323568, the
Send address and company number 15877451, and not one of the old details
appears on either. Every page on the site is built from a single shared header
and footer, so there is no old template for a page to be stuck on. I crawled
all 26 pages in the sitemap and searched for the old number, the old postcode,
the old company number and "Commercial Surfacing". Zero hits, on any page.

Here is how I know where that part came from. The brief lists two tarmac project
pages among the URLs it reviewed and describes what is "in their page
template". Those two URLs have been redirects since 19 August. A redirect has
no page template; there is nothing there to describe. So whatever produced the
brief was reading a cached copy of the old site for those pages, not the live
one. The old details it quotes are real, they were our details until June, so
it had genuine historical data. It just was not current.

I am genuinely curious which tool produced the brief, if you are happy to say.
Not to knock it, it did good work on the two points above, but if it is mixing
live pages with an old cache I would like to know what it is picking up so we
are not chasing ghosts next time.

The full page-by-page register is attached, every change ID marked confirmed,
false, already done, or a positioning decision, with the evidence.

## The half that is a business decision

Most of the rest of the brief rewrites the site toward developers, main
contractors and commercial packages, and away from residential work. New
service page copy, new sector copy, "commercial groundworks for developers and
main contractors", removing the pools and ponds section, changing the enquiry
form to ask for drawings and programme.

Some of that is good. The demolition and earthworks pages are the oldest copy
on the site and they deserve a rewrite. But the direction is a decision about
who you want ringing the phone. Right now a fair chunk of your enquiries are
residential, the ads are built around that, and the homepage promises a site
visit within five working days. If you want to move upmarket, I am for it, but
it needs to be a decision you make on purpose, with the numbers in front of us,
not something I implement because a document said so. That is the first thing
I want to talk through next week.

**On cost:** [ED TO COMPLETE. Suggested: the audit review and the three fixes
above are covered. The demolition and earthworks rewrites and the case study
work are a piece of work in their own right and I will cost them once we have
agreed the positioning at the meeting.]

## What you are actually getting, and a change from me

Reading your email back, the line that stood out was "I just want to understand
spend, processes and future alignment". Fair. You should not have to ask. So
here is what has gone live in the last fortnight, and from next month you get
this as a one-page report without asking:

- Homepage rebuilt around answering the questions people actually search for,
  which is what gets you picked up by AI search as well as Google
- Four town pages: Guildford, Woking, Weybridge, Epsom
- An Areas We Cover page with the coverage map and every town
- Two reference guides, one on what drives demolition cost, one on planning
  groundworks. The brief calls the planning guide "the standard the weaker
  service pages should move toward", which I will take
- Company number corrected everywhere
- Structured data across the site verified error free by Google's validator

For what it is worth, the brief also says to keep every H1 on the site as it
is, keep the town pages as they are, and keep the honest "no local case study
yet" wording on Weybridge and Epsom. So the foundations are not the problem.

## What I need from you

| Item | What |
|---|---|
| Asbestos licence | Yes or no. Blocking. |
| Esher demolition case study | Client type, scope, what was hard, outcome, rough dates. Bullets are fine. Waiting since 20 August, and the site has no demolition evidence at all until this lands. |
| A Guildford groundworks job | So the patio can come off the Guildford page without leaving it empty |
| 3 or 4 more projects | I will send a Word template this week |
| New yard address | When confirmed |

## What I am doing

| Item | When |
|---|---|
| Building control wording, copy defects | Next deploy, this week |
| Asbestos wording | On your answer |
| Project template to you | This week |
| Search Console re-indexing for everything changed this month | This week |
| Demolition case study | Within days of your notes |
| Positioning decision, then demolition and earthworks rewrites | After the meeting |
| Monthly one-page report | From October |

## Surrey Hills Surfacing

Happy to talk SHS properly, but as its own conversation. Two businesses, two
positions, and the one thing we must not do is let them cross over publicly.
Aligning the look is fine. Linking the sites or sharing company details in the
background is not, because Google will treat them as one business and you lose
both. I will bring SHS as a separate item with its own notes.

## The meeting

Yes to next week. [ED: availability.] Suggested order, about an hour and a
half:

1. Surrey Contracting: what went live, what the brief found, the asbestos
   question (15 min)
2. Positioning: commercial, residential, or both, with the enquiry numbers in
   front of us (30 min)
3. SEO and backlinks: the plan, the cost, the realistic timeline (20 min)
4. Ads: current spend, what it returns, and the path to leaning on it less
   (15 min)
5. Surrey Hills Surfacing (separate session or the back end of this one)

On the ads point, SEO reduces reliance on paid over months rather than weeks,
and the two run alongside each other for a while. Worth doing properly rather
than by email.

And the feeling is mutual. You are not hard work. You ask direct questions,
which is a good deal easier to work with than the alternative.

Speak next week.

Best,
Ed
