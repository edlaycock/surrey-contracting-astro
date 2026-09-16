/**
 * Location page content: one entry per town, single source of truth.
 *
 * Every entry is rendered once as visible copy and once inside the FAQPage
 * JSON-LD, so the two cannot drift. scripts/check-locations.mjs enforces that
 * after each build.
 *
 * PROOF RULE. `projectSlug` must match a real published project in Sanity and
 * `projectNote` may only restate what that case study actually says. No
 * invented quantities, durations, clients or outcomes, ever.
 *
 * Where `proofLocal` is false the case study is NOT in that town, and the page
 * says so in plain words on the page itself rather than implying local work we
 * have not published. Ed asked for Weybridge and Epsom on 15 Sep knowing there
 * is no case study in either town; this is how they were built without the
 * page making a claim that is not true. When a genuine case study lands for
 * one of those towns, set proofLocal to true and rewrite proofLead.
 *
 * Towns still NOT built, and why:
 *   Guildford demolition, Woking demolition: there is no demolition case study
 *   in Sanity for any town, so a demolition location page would be a town-name
 *   swap with nothing behind it at all. Blocked on the Esher demolition facts.
 */

export interface LocationPage {
  slug: string;
  town: string;
  service: 'Groundworks';
  title: string;
  description: string;
  h1: string;
  lede: string;
  /** Direct answer, first <p> after the <h1>. */
  answer: string;
  /** Distance and travel from the Send yard. */
  travel: string;
  /** What the ground is typically like locally, and what that changes. */
  ground: string;
  /** Access and property types found locally. */
  access: string;
  /** Approximate road distance from the Send yard, for the areas table. */
  milesFromYard: number;
  /** Slug of the published Sanity case study shown on this page. */
  projectSlug: string;
  /** True when that case study is in this town. False when it is the nearest
   *  published work rather than local work, which the page then states. */
  proofLocal: boolean;
  /** Section heading and the sentence introducing the case study card. When
   *  proofLocal is false this MUST say the work is not in this town. */
  proofHeading: string;
  proofLead: string;
  /** One line about that project, taken only from its own case study. */
  projectNote: string;
  faqs: { q: string; a: string }[];
}

export const LOCATIONS: LocationPage[] = [
  {
    slug: 'groundworks-guildford',
    town: 'Guildford',
    service: 'Groundworks',
    title: 'Groundworks Contractor Guildford | Surrey Contracting',
    description:
      'Groundworks contractor working in Guildford from our yard at Send, six miles away. Foundations, drainage, excavation and site preparation, self-delivered.',
    h1: 'Groundworks Contractor in Guildford',
    lede: 'Foundations, drainage, excavation and site preparation across Guildford and the surrounding villages.',
    answer:
      'Surrey Contracting is a groundworks contractor working in Guildford from a yard at Send, about six miles north of the town. We dig and pour foundations, lay foul and surface water drainage, run service trenches and take sites to damp proof course, using our own plant and operators rather than subcontracting the work out.',
    travel:
      'Our yard is at Send, on the Woking side of Guildford, and it carries a GU23 postcode. By road it is roughly six miles into the town centre, twenty minutes on a normal morning and longer when the A3 is busy. That matters more than it sounds. A plant breakdown or a late delivery is a short run back to the yard rather than a lost day.',
    ground:
      'Guildford sits where the River Wey cuts through the North Downs, so the ground changes quickly across short distances. There is chalk on the higher ground towards the Hog\'s Back, sand and gravel on the valley sides, and softer alluvial material near the river. On the same street one plot can need a deeper dig than its neighbour. We price after a site visit for that reason, not from a drawing.',
    access:
      'Much of the older housing near the town centre has no side access, so plant and spoil go through the property or not at all. The streets running up from the High Street are steep and narrow, and several are in conservation areas with restrictions on what can be parked and when. We check access on the visit and size the machine to the entrance, not the dig.',
    milesFromYard: 6,
    projectSlug: 'landscape-guildford',
    proofLocal: true,
    proofHeading: 'Work we have completed in Guildford',
    proofLead: 'A published case study from a job in the town.',
    projectNote:
      'A residential re-landscape in Guildford: a 30 square metre porcelain patio and new sleeper borders, with the base preparation and levels underneath it done by the same team.',
    faqs: [
      {
        q: 'How far is Guildford from your yard?',
        a: 'About six miles. Our yard is at Send, between Woking and Guildford, and a run into the town centre takes roughly twenty minutes outside of rush hour. Guildford is the closest large town to us, so it is one of the areas we work in most often.',
      },
      {
        q: 'What ground conditions do you find on Guildford sites?',
        a: 'It varies more than most of Surrey because the town sits in a gap in the North Downs. Expect chalk on the higher ground, sand and gravel on the valley sides, and softer ground near the Wey. Foundation depth follows the ground rather than the floor area, which is why we visit before quoting.',
      },
      {
        q: 'Who handles building control for groundworks in Guildford?',
        a: 'Either Guildford Borough Council building control or a private approved inspector, whichever the project uses. Below ground work is inspected before it is covered up, so the dig, the reinforcement and the drainage all need to be signed off at the right stage. We work to the approved drawings and book inspections around them.',
      },
    ],
  },
  {
    slug: 'groundworks-woking',
    town: 'Woking',
    service: 'Groundworks',
    title: 'Groundworks Contractor Woking | Surrey Contracting',
    description:
      'Groundworks contractor based in Woking borough at Send. Foundations, drainage, excavation and site preparation across Woking, Horsell and Byfleet.',
    h1: 'Groundworks Contractor in Woking',
    lede: 'Foundations, drainage, excavation and site preparation across Woking, Horsell, Byfleet and the surrounding villages.',
    answer:
      'Surrey Contracting is a groundworks contractor based in Woking borough. Our yard is at Send, about four miles from the town centre, and we dig and pour foundations, lay foul and surface water drainage, run service trenches and take sites to damp proof course with our own plant and operators.',
    travel:
      'We are not a contractor who covers Woking from somewhere else. The yard is at Send, inside the borough, four miles or so from the station and closer than that to Horsell, Byfleet and Old Woking. Most of the town is inside a fifteen minute drive. For a domestic job that usually means we can get someone out to look at a problem the same week rather than the following one.',
    ground:
      'Much of Woking borough is sand. Horsell Common is heathland sitting on it, and the sandy ground carries on under a lot of the housing around the town. Sand digs easily and drains well, which helps with soakaways, but the sides of a deep trench will not stand on their own and need support. Closer to the Basingstoke Canal and the Wey the water table comes up, and a foundation dig can fill overnight.',
    access:
      'A lot of the housing stock is interwar and post-war with long rear gardens, which usually means a side gate wide enough for a small machine and a proper run for the dumper. The newer infill plots are the tighter ones, often a single narrow entrance shared with the neighbouring house. We size the machine to the entrance and work out where the spoil goes before the first dig, not on the day.',
    milesFromYard: 4,
    projectSlug: 'domestic-earthworks',
    proofLocal: true,
    proofHeading: 'Work we have completed in Woking',
    proofLead: 'A published case study from a job in the borough.',
    projectNote:
      'A domestic earthworks job at Horsell, three miles from the yard: a swimming pool removed and the garden prepared afterwards, with around 220 tonnes of material moved.',
    faqs: [
      {
        q: 'Are you actually based in Woking?',
        a: 'Yes. Our yard is at Send, which is inside Woking borough, about four miles from the town centre and nearer still to Horsell and Old Woking. We are not covering the area from a depot somewhere else, which is why we can usually get out to look at a job quickly.',
      },
      {
        q: 'What ground conditions do you find on Woking sites?',
        a: 'Mostly sand. It digs easily and drains well, which suits soakaways, but deep trench sides need supporting because sand will not stand on its own. Near the Basingstoke Canal and the River Wey the water table is high enough that an open foundation dig can fill overnight, so those sites need planning around.',
      },
      {
        q: 'Who handles building control for groundworks in Woking?',
        a: 'Either Woking Borough Council building control or a private approved inspector, depending on what the project uses. Below ground work has to be inspected before it is covered over, so the excavation, any reinforcement and the drainage each need signing off at the right point. We work from the approved drawings and book the inspections in around them.',
      },
    ],
  },
  {
    slug: 'groundworks-weybridge',
    town: 'Weybridge',
    service: 'Groundworks',
    title: 'Groundworks Contractor Weybridge | Surrey Contracting',
    description:
      'Groundworks contractor covering Weybridge from our yard at Send, about eight miles away. Foundations, drainage, excavation and site preparation, self-delivered.',
    h1: 'Groundworks Contractor in Weybridge',
    lede: 'Foundations, drainage, excavation and site preparation across Weybridge, Oatlands and the private estates.',
    answer:
      'Surrey Contracting is a groundworks contractor covering Weybridge from a yard at Send, about eight miles away. We dig and pour foundations, lay foul and surface water drainage, run service trenches and take sites to damp proof course, using our own plant and operators rather than subcontracting the work out.',
    travel:
      'The yard is at Send, and the run into Weybridge is roughly eight miles up through Byfleet, or along the A3 and off at Painshill depending on traffic. Half an hour on a bad morning. We already work regularly in Cobham and Esher, which sit either side of that route, so the area is well inside the range we cover day to day rather than a job we would travel for.',
    ground:
      'Weybridge sits where the Wey meets the Thames, and the ground reflects it. Much of the town is sand and river terrace gravel, with alluvial material closer to the rivers and the Wey Navigation. St George\'s Hill and the higher ground to the south are sand and gravel again. Sand digs easily and takes a soakaway well, but it will not stand unsupported in a deep trench, and near the water the table can come up fast enough to fill a foundation dig overnight.',
    access:
      'Weybridge splits into two very different jobs. The private estates have long driveways, gated entrances and heavy tree cover, much of it protected, so the constraints are usually turning circles, overhead branches and what a machine is allowed to disturb near roots. The interwar and post-war housing closer to the station is the tighter end: narrow side gates, shared entrances and nowhere to stand a lorry. We size the machine to the entrance and agree where the spoil goes before the first dig.',
    milesFromYard: 8,
    projectSlug: 'concrete-base-cobham',
    proofLocal: false,
    proofHeading: 'Our nearest published project to Weybridge',
    proofLead:
      'We have not published a Weybridge case study yet. The nearest completed work we can show is at Cobham, about four miles away in the same borough.',
    projectNote:
      'Excavation and installation of new base works with 150mm of reinforced concrete for a new water tank, carried out at short notice after the client\'s original contractor withdrew.',
    faqs: [
      {
        q: 'How far is Weybridge from your yard?',
        a: 'About eight miles. Our yard is at Send, between Woking and Guildford, and the run into Weybridge goes up through Byfleet or along the A3, depending on traffic. We work regularly in Cobham and Esher on the same side of the borough.',
      },
      {
        q: 'What ground conditions do you find on Weybridge sites?',
        a: 'Mostly sand and river terrace gravel, with softer alluvial ground near the Wey, the Navigation and the Thames. It digs and drains well, which suits soakaways, but deep trench sides need supporting and the water table near the rivers is high enough that an open dig can fill overnight.',
      },
      {
        q: 'Who handles building control for groundworks in Weybridge?',
        a: 'Either Elmbridge Borough Council building control or a private approved inspector, depending on what the project uses. Below ground work is inspected before it is covered over, so the excavation, any reinforcement and the drainage each need signing off at the right point. Protected trees are worth checking early, because consent is needed before roots are disturbed.',
      },
    ],
  },
  {
    slug: 'groundworks-epsom',
    town: 'Epsom',
    service: 'Groundworks',
    title: 'Groundworks Contractor Epsom | Surrey Contracting',
    description:
      'Groundworks contractor covering Epsom and Ewell. Foundations, drainage, excavation and site preparation on clay ground, self-delivered by our own teams.',
    h1: 'Groundworks Contractor in Epsom',
    lede: 'Foundations, drainage, excavation and site preparation across Epsom, Ewell and the surrounding villages.',
    answer:
      'Surrey Contracting is a groundworks contractor covering Epsom from a yard at Send, about fifteen miles west. We dig and pour foundations, lay foul and surface water drainage, run service trenches and take sites to damp proof course with our own plant and operators.',
    travel:
      'Epsom is the far side of our patch rather than the near side. It is around fifteen miles from the yard, usually across through Leatherhead. That is worth saying plainly: for a half day repair it is a long run, and for a foundation package or a drainage job with a proper programme it makes no practical difference, because the plant goes out and stays out.',
    ground:
      'Epsom sits at the foot of the North Downs, and the ground changes as you move up the slope. The town and the ground north towards Ewell are largely London Clay, which shrinks and swells with the seasons and does not drain. South and up onto the Downs the chalk comes through. Clay matters for two reasons: foundation depth has to allow for seasonal movement, particularly near mature trees, and surface water rarely soaks away, so drainage usually has to go somewhere rather than into a soakaway.',
    access:
      'Close to the town centre the stock is Victorian and Edwardian terraces with no side access, so plant and spoil go through the house or not at all. The interwar semis further out usually have a side gate and a proper run for a dumper. Around the Downs and the conservation areas there are restrictions on what can be parked and when, which is worth establishing before a delivery is booked rather than on the morning.',
    milesFromYard: 15,
    projectSlug: 'concrete-base-cobham',
    proofLocal: false,
    proofHeading: 'Our nearest published project to Epsom',
    proofLead:
      'We have not published an Epsom case study yet. The nearest completed work we can show is at Cobham, roughly eight miles away.',
    projectNote:
      'Excavation and installation of new base works with 150mm of reinforced concrete for a new water tank, carried out at short notice after the client\'s original contractor withdrew.',
    faqs: [
      {
        q: 'Do you cover Epsom from Send?',
        a: 'Yes, though it is the far side of our area rather than the near side. Epsom is around fifteen miles from the yard, usually across through Leatherhead. For a foundation or drainage package that makes no practical difference, because the plant goes out and stays out. For a half hour call-out it is a long run and we will say so.',
      },
      {
        q: 'What ground conditions do you find on Epsom sites?',
        a: 'Largely London Clay through the town and north towards Ewell, with chalk coming through as the ground rises south onto the Downs. Clay shrinks and swells with the seasons, so foundation depth has to allow for it, particularly near mature trees. It also does not drain, so surface water usually needs somewhere to go rather than a soakaway.',
      },
      {
        q: 'Who handles building control for groundworks in Epsom?',
        a: 'Either Epsom and Ewell Borough Council building control or a private approved inspector, depending on what the project uses. Below ground work has to be inspected before it is covered over, so the excavation, any reinforcement and the drainage each need signing off at the right stage. We work from the approved drawings and book the inspections around them.',
      },
    ],
  },
];

export const getLocation = (slug: string) => LOCATIONS.find((l) => l.slug === slug)!;

/**
 * Every town listed under "Areas we cover", with an approximate road distance
 * from the Send yard. Towns with a location page link to it; the rest are
 * plain text. Distances are approximate and are labelled as such on the page.
 */
export const AREAS_COVERED: { town: string; miles: number; slug?: string }[] = [
  { town: 'Woking', miles: 4, slug: 'groundworks-woking' },
  { town: 'Guildford', miles: 6, slug: 'groundworks-guildford' },
  { town: 'Cobham', miles: 7 },
  { town: 'Weybridge', miles: 8, slug: 'groundworks-weybridge' },
  { town: 'Leatherhead', miles: 11 },
  { town: 'Esher', miles: 11 },
  { town: 'Dorking', miles: 12 },
  { town: 'Epsom', miles: 15, slug: 'groundworks-epsom' },
  { town: 'Surbiton', miles: 15 },
  { town: 'Kingston upon Thames', miles: 16 },
  { town: 'Reigate', miles: 19 },
  { town: 'Redhill', miles: 21 },
];

/** Towns that have a live location page, for the homepage areas list. */
export const LOCATION_LINKS: Record<string, string> = Object.fromEntries(
  LOCATIONS.map((l) => [l.town, `/${l.slug}`]),
);
