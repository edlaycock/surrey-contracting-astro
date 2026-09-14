/**
 * Location page content: one entry per town, single source of truth.
 *
 * Every entry is rendered once as visible copy and once inside the FAQPage
 * JSON-LD, so the two cannot drift. scripts/check-locations.mjs enforces that
 * after each build.
 *
 * HARD RULE (tasks/todo.md): a town only gets a page when a real, published
 * case study in that town backs it up. `projectSlug` must match a project in
 * Sanity, and `projectNote` may only restate what that case study actually
 * says. No invented quantities, durations, clients or outcomes.
 *
 * Towns deliberately NOT built, and why:
 *   Guildford demolition, Woking demolition: there is no demolition case study
 *   in Sanity for any town. Building them would mean a town-name swap with no
 *   local proof, which the brief forbids.
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
  /** Slug of the published Sanity case study that backs this page up. */
  projectSlug: string;
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
    projectSlug: 'landscape-guildford',
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
    projectSlug: 'domestic-earthworks',
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
];

export const getLocation = (slug: string) => LOCATIONS.find((l) => l.slug === slug)!;

/** Towns that have a live location page, for the homepage areas list. */
export const LOCATION_LINKS: Record<string, string> = Object.fromEntries(
  LOCATIONS.map((l) => [l.town, `/${l.slug}`]),
);
