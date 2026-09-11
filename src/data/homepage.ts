/**
 * Homepage content: single source of truth.
 *
 * Every string here is rendered once in the page markup and, where relevant,
 * once in the JSON-LD, so visible text and structured data cannot drift.
 *
 * Any value wrapped in {{ }} is unconfirmed. scripts/check-homepage.mjs fails
 * the build while any remain in the output, so nothing half-filled can
 * deploy. None remain at the time of writing.
 */

const SITE = 'https://surreycontracting.co.uk';

/* ── Published service promise ────────────────────────────────────────────── */
// Already stated on the homepage quote section, the contact page and
// llms-full.txt. No other figures (durations, turnaround times, prices) are
// published on the homepage (Ed, 11 Sep 2026).
export const QUOTE_LEAD_TIME = '5 working days';

// No author, reviewer or published/updated dates on the page, and no
// dateModified in the business schema (Ed, 11 Sep 2026).

/* ── Head ─────────────────────────────────────────────────────────────────── */
export const META = {
  title: 'Surrey Contracting Limited | Groundworks, Earthworks & Demolition, Send, Surrey',
  // The brief's wording ran to 161 characters against its own 155 limit;
  // "south west London" is shortened to "SW London" to bring it under.
  description:
    'Groundworks, earthworks and demolition contractor in Send, near Woking. Self-delivered across Surrey and SW London. CHAS and Constructionline registered.',
};

/* ── Direct answer (first <p> after the <h1>) ─────────────────────────────── */
export const DIRECT_ANSWER =
  `Surrey Contracting Limited is a groundworks, earthworks and demolition contractor based in Send, near Woking, working across Surrey and south west London. We self-deliver excavation, foundations, drainage, site clearance and demolition with our own plant and operators, and we typically visit a site to quote within ${QUOTE_LEAD_TIME}.`;

export const AREAS_RESPONSE =
  `Site visits within ${QUOTE_LEAD_TIME} for Guildford, Woking, Leatherhead, Epsom, Kingston and the surrounding Surrey and south west London area.`;

/* ── FAQ ──────────────────────────────────────────────────────────────────────
   Rendered as <details> in the page and as FAQPage mainEntity in the schema,
   both from this array. Answers may contain <a> links; the schema receives the
   same text with the tags removed, which is exactly what a reader sees. */
export interface Faq {
  q: string;
  /** HTML string, links allowed. */
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'What does a groundworks contractor do?',
    a: 'A groundworks contractor prepares the ground so building can start: strips topsoil, digs and pours <a href="/groundworks">foundations</a>, lays drainage and ducting, builds retaining walls and slabs, and gets the site to damp proof course level. Surrey Contracting does all of this in house, including <a href="/earthworks">bulk earthworks and muck away</a>.',
  },
  {
    q: 'What are enabling works, and how are they different from groundworks?',
    a: 'Enabling works are everything that has to happen before the main build can start: <a href="/demolition">demolition</a>, site clearance, asbestos removal coordination, service diversions, temporary access and hoarding. Groundworks then follows on the cleared site. We deliver both, which removes the handover gap between a demolition subcontractor finishing and a groundworks team arriving.',
  },
  {
    q: 'Do you do demolition and groundworks as one contract?',
    a: 'Yes, this is most of our work. Demolition, site clearance and groundworks run as one contract with one site team, so there is no handover between a demolition subcontractor finishing and a groundworks crew arriving, and no gap in the programme while the cleared site sits idle.',
  },
  {
    q: 'What do you need before a demolition can start?',
    a: 'Three things before we can start a <a href="/demolition">demolition</a> in Surrey: a Section 80 demolition notice served on the local authority at least six weeks before work begins, a refurbishment and demolition asbestos survey of the building, and CDM 2015 roles in place (client, principal designer, principal contractor). We handle the notice and the CDM paperwork and work with the client\'s asbestos surveyor on the survey.',
  },
  {
    q: 'Who serves the Section 80 demolition notice?',
    a: 'The person carrying out the demolition serves it. Surrey Contracting serves the Section 80 notice as principal contractor, and the six week period runs from the date the local authority receives it, not the date it is posted. The council may reply with a Section 81 counter notice setting conditions for the work.',
  },
  {
    q: 'How long does a groundworks job take on a typical house extension?',
    a: 'It depends on the ground more than the floor area. Clay, a high water table or roots near protected trees can mean deeper foundations or piling, which adds time, and tight access slows the muck away. We confirm the programme in the written quote after the site visit, once we have seen the ground, the access and the drawings.',
  },
  {
    q: 'What are the common ground problems on Surrey sites?',
    a: 'London clay that shrinks and heaves with the seasons, high water tables near the Wey and the Mole, tree roots near protected trees, and tight access on infill plots. Each one changes the foundation depth or method, which is why we visit before quoting rather than price from a plan.',
  },
  {
    // Published cost ranges are held back until /groundworks-cost exists.
    q: 'What does groundworks cost in Surrey?',
    a: 'Every job is priced after a free measured site visit because ground conditions, access and muck away volumes move the price more than floor area. The written quote is itemised, so you can see what each part of the job costs.',
  },
  {
    q: 'How do you check a groundworks or demolition contractor is legitimate?',
    a: 'Check four things: SSIP accreditation (CHAS or SafeContractor) against the public register, current public liability insurance, an Environment Agency waste carrier registration for muck away, and an active Companies House record. Surrey Contracting Limited is company number 15454300 and holds SSIP and Constructionline accreditation, shown in the <a href="#accreditations">accreditations strip</a> on this page.',
  },
  {
    q: 'Are you accredited?',
    a: 'Yes. Surrey Contracting holds CHAS, SafeContractor, SSIP, SMAS Worksafe and Constructionline registrations, and our operatives carry CITB, CSCS, NPORS and IPAF cards. Each scheme is shown in the <a href="#accreditations">accreditations strip</a> on this page, and the SSIP and Constructionline registers can be searched by company name.',
  },
  {
    q: 'How do I get a quote?',
    a: `Call <a href="tel:01483323568">01483 323568</a> or use the <a href="#quote">form on this page</a>. We respond within one working day and visit the site within ${QUOTE_LEAD_TIME} to check levels, access and services, and the written fixed price quote follows the visit. A postcode and a short description of the job are enough to start.`,
  },
];

/** Plain text of an answer, as a reader sees it and as the schema carries it. */
export const plainText = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/* ── Accreditations: the logo strip only ──────────────────────────────────── */
// The strip stands alone. No registration numbers, no supporting list beneath
// it, and no links to external registers anywhere on the page (Ed, 11 Sep 2026).
export const ACCREDITATION_LOGOS = [
  { logo: '/assets/acc/chas.webp', alt: 'CHAS Accredited Contractor' },
  { logo: '/assets/acc/safe-contractor.webp', alt: 'SafeContractor by Alcumus' },
  { logo: '/assets/acc/ssip.webp', alt: 'SSIP, Safety Schemes in Procurement' },
  { logo: '/assets/acc/smas.webp', alt: 'SMAS Worksafe' },
  { logo: '/assets/acc/citb.webp', alt: 'CITB Registered' },
  { logo: '/assets/acc/cscs.webp', alt: 'CSCS, Construction Skills Certification Scheme' },
  { logo: '/assets/acc/npors.webp', alt: 'NPORS Registered' },
  { logo: '/assets/acc/ipaf.webp', alt: 'IPAF' },
];

/* ── Schema fragments shared with BaseLayout ──────────────────────────────── */
export const KNOWS_ABOUT = ['Groundworks', 'Earthworks', 'Demolition', 'Site clearance', 'Enabling works', 'Foundations', 'Drainage'];

export const FAQ_SCHEMA = {
  '@type': 'FAQPage',
  '@id': `${SITE}/#faq`,
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: plainText(a) },
  })),
};
