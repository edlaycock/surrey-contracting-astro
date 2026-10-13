/**
 * Case-study cards for the Google Ads landing pages (plan: tasks/todo.md,
 * "LP case-study cards", 13 Oct 2026). One entry per published project in
 * Sanity; each landing page picks its cards by slug with projectCards().
 *
 * Text is taken from the project's own published summary, so every card says
 * only what the case study says. No client names beyond those already on the
 * published project pages. Images are local 640x480 webp crops of the Sanity
 * hero (check-lp fails a v2 page that loads an image from another host).
 */
export type ProjectCard = {
  slug: string;
  tag: string;
  title: string;
  img: string;
  alt: string;
  text: string;
};

const CARDS: Record<string, ProjectCard> = {
  'house-demolition-esher': {
    slug: 'house-demolition-esher',
    tag: 'Demolition',
    title: 'House Demolition and Soft Strip, Esher',
    img: '/assets/img/projects/house-demolition-esher-640.webp',
    alt: 'Aerial view of a house demolition in Esher with the roof removed and an excavator working at the rear of the plot',
    text: 'Soft strip and complete demolition of a two-storey house, clearing the plot for redevelopment within a seven-day programme.',
  },
  'soft-strip-demolition-chiswick': {
    slug: 'soft-strip-demolition-chiswick',
    tag: 'Demolition',
    title: 'Soft Strip and Demolition Works, Chiswick',
    img: '/assets/img/projects/soft-strip-demolition-chiswick-640.webp',
    alt: 'Roof removed and upper floor stripped inside a sheeted scaffold during demolition works in Chiswick',
    text: 'Three-week soft strip and demolition package, removing internal walls, floors, ceilings, staircases and the existing roof.',
  },
  'steel-outbuilding-demolition-byfleet': {
    slug: 'steel-outbuilding-demolition-byfleet',
    tag: 'Demolition',
    title: 'Steel Outbuilding Demolition, Byfleet',
    img: '/assets/img/projects/steel-outbuilding-demolition-byfleet-640.webp',
    alt: 'Tracked excavator beside the flattened steel sheeting of a demolished outbuilding in Byfleet, Surrey',
    text: 'Steel outbuilding taken down at a live industrial site, completed ahead of programme with minimal disruption to operations.',
  },
  'drainage-concrete-works-redhill': {
    slug: 'drainage-concrete-works-redhill',
    tag: 'Drainage',
    title: 'Surface Water Drainage and Concrete Works, Redhill',
    img: '/assets/img/projects/drainage-concrete-works-redhill-640.webp',
    alt: 'Freshly placed concrete slab with a mini excavator and spoil heap during drainage and concrete works in Redhill',
    text: 'Commercial car park groundworks with surface water attenuation, drainage runs, base preparation and concrete works.',
  },
  'excavation-foundations-hampshire': {
    slug: 'excavation-foundations-hampshire',
    tag: 'Groundworks',
    title: 'Excavation and Concrete Foundation Works, Hampshire',
    img: '/assets/img/projects/excavation-foundations-hampshire-640.webp',
    alt: 'Concrete base edged with the first courses of blockwork after excavation and foundation works in Hampshire',
    text: 'Excavation to approximately 900mm through clay and concrete foundation works, preparing the ground for new blockwork.',
  },
  'enabling-works-car-park-sutton': {
    slug: 'enabling-works-car-park-sutton',
    tag: 'Enabling works',
    title: 'Site Enabling Works and Car Park Preparation, Sutton',
    img: '/assets/img/projects/enabling-works-car-park-sutton-640.webp',
    alt: 'New baseworks and a tracked excavator beside a commercial building during car park enabling works in Sutton',
    text: 'Four weeks of enabling works on a live commercial site: the existing car park stripped and new baseworks completed for the follow-on contractor.',
  },
  'site-levelling-earthworks-hampshire': {
    slug: 'site-levelling-earthworks-hampshire',
    tag: 'Earthworks',
    title: 'Site Levelling and Earthworks, Hampshire',
    img: '/assets/img/projects/site-levelling-earthworks-hampshire-640.webp',
    alt: 'Tracked excavator and site dumper on stripped, levelled ground beside a grass field during earthworks in Hampshire',
    text: 'Site clearance, ground stripping, imported material and levelling across approximately two acres.',
  },
  'site-clearance-crushing-portsmouth': {
    slug: 'site-clearance-crushing-portsmouth',
    tag: 'Site clearance',
    title: 'Site Clearance, Crushing and Enabling Works, Portsmouth',
    img: '/assets/img/projects/site-clearance-crushing-portsmouth-640.webp',
    alt: 'Tracked excavator working a mound of brick rubble and soil during site clearance in Portsmouth',
    text: 'Eight-week enabling project with site clearance, light demolition and on-site crushing so the material could be reused.',
  },
  'site-clearance-earthworks': {
    slug: 'site-clearance-earthworks',
    tag: 'Earthworks',
    title: 'Site Clearance and Earthworks, Farnham',
    img: '/assets/img/projects/site-clearance-earthworks-2-640.webp',
    alt: 'Cleared and levelled land at a residential site in Farnham',
    text: 'Overgrown land cleared after building works, with around 80 tonnes of green waste removed and 100 tonnes of topsoil brought in.',
  },
  'foul-drainage-guildford': {
    slug: 'foul-drainage-guildford',
    tag: 'Drainage',
    title: 'Foul Drainage Installation and Connections, Guildford',
    img: '/assets/img/projects/foul-drainage-guildford-640.webp',
    alt: 'New foul drainage pipework and couplings in an open trench at a residential property in Guildford',
    text: 'Collapsed underground pipework replaced with new foul drainage, new connections made and the affected areas reinstated.',
  },
  'drainage-ascot': {
    slug: 'drainage-ascot',
    tag: 'Drainage',
    title: 'Drainage Installation, Ascot',
    img: '/assets/img/projects/drainage-ascot-4-640.webp',
    alt: 'New foul drainage connection at a house in Ascot',
    text: 'New foul drainage installed and connected for a residential property, ready for a new downstairs bathroom.',
  },
};

/** Cards for the given slugs, in that order. An unknown slug fails the build. */
export function projectCards(slugs: string[]): ProjectCard[] {
  return slugs.map((s) => {
    const card = CARDS[s];
    if (!card) throw new Error(`projectCards: no card defined for "${s}"`);
    return card;
  });
}
