// One-off migration: imports the 10 existing hardcoded project pages into
// Sanity as `project` documents, so they can be edited/added to from Studio.
//
// Usage:
//   SANITY_API_TOKEN=sk... node scripts/seed-projects.mjs
//
// Get a write token from https://www.sanity.io/manage -> project -> API ->
// Tokens -> Add API token (Editor permission is enough).
//
// Safe to re-run: existing documents are matched by a stable `_id` derived
// from the slug, so re-running updates rather than duplicates them.

import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG_DIR = path.join(__dirname, '..', 'public', 'assets', 'img', 'projects');

const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error('Missing SANITY_API_TOKEN. Get a write token from sanity.io/manage and re-run:\n  SANITY_API_TOKEN=sk... node scripts/seed-projects.mjs');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'mhqgpyb9',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  token,
  useCdn: false,
});

let keyCounter = 0;
const nextKey = () => `k${(keyCounter++).toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const block = (text) => ({
  _type: 'block',
  _key: nextKey(),
  style: 'normal',
  children: [{ _type: 'span', _key: nextKey(), text, marks: [] }],
});
const heading = (text) => ({
  _type: 'block',
  _key: nextKey(),
  style: 'h2',
  children: [{ _type: 'span', _key: nextKey(), text, marks: [] }],
});
const bulletList = (items) =>
  items.map((text) => ({
    _type: 'block',
    _key: nextKey(),
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', _key: nextKey(), text, marks: [] }],
  }));

const projects = [
  {
    slug: 'tarmac-driveway',
    title: 'Tarmac Driveway',
    categories: ['Driveways', 'Surfacing'],
    sector: 'Residential',
    client: 'Private residential',
    location: 'West Humble, Dorking',
    services: 'Tarmac · Drainage',
    year: '2023',
    summary: 'New tarmac driveway with brick retaining wall and drainage for a residential client in West Humble, Dorking.',
    heroImage: 'tarmac-driveway.jpg',
    body: [
      heading('The project'),
      block('We installed a new tarmac driveway for a residential client in West Humble, Dorking as well as new brick retaining wall and drainage including a soakaway. The driveway was edged with silver grey granite setts and the tarmac was installed and finished with a white spar speckle stone.'),
    ],
    gallery: [
      { file: 'tarmac-driveway-2.jpg' },
      { file: 'tarmac-driveway-3.jpg' },
      { file: 'tarmac-driveway-4.jpg' },
    ],
  },
  {
    slug: 'tarmac-driveway-fetcham',
    title: 'Tarmac Driveway, Fetcham, Surrey',
    categories: ['Driveways', 'Surfacing'],
    sector: 'Residential',
    client: 'Private residential',
    location: 'Fetcham, Surrey',
    services: 'Surfacing',
    year: '2023',
    summary: '100sqm tarmac driveway installation with base course and SMA wearing course in Fetcham, Surrey.',
    heroImage: 'tarmac-driveway-fetcham.jpg',
    body: [
      heading('The project'),
      block('100sqm area, supply and lay 50mm of 20mm base course macadam to an area prepared by us. Supply and lay 30mm of 6mm SMA wearing course macadam.'),
    ],
    gallery: [
      { file: 'tarmac-driveway-fetcham-2.jpg' },
      { file: 'tarmac-driveway-fetcham-3.jpg' },
      { file: 'tarmac-driveway-fetcham-4.jpg' },
    ],
  },
  {
    slug: 'tarmac-repairs-sutton',
    title: 'Tarmac Repairs, Sutton High School',
    categories: ['Surfacing'],
    sector: 'Education',
    client: 'Sutton High School',
    location: 'Sutton, London',
    services: 'Surfacing',
    year: '2023',
    summary: 'Emergency tarmac footpath repairs at Sutton High School, completed over a weekend to minimise disruption.',
    heroImage: 'tarmac-repairs-sutton.jpg',
    body: [
      heading('The project'),
      block('Surrey Contracting carried out emergency repairs at Sutton High School after extensive building works. We were called in at very short notice to carry out and complete minor repairs to the footpaths throughout the school prior to the students starting the following week. All repairs were carried out over the weekend to minimise disruption to the school. 6mm SMA and Buff ULTI Colour were used on this project to match the existing surfaces.'),
    ],
    gallery: [
      { file: 'tarmac-repairs-sutton-2.jpg' },
      { file: 'tarmac-repairs-sutton-3.jpg' },
      { file: 'tarmac-repairs-sutton-4.jpg' },
    ],
  },
  {
    slug: 'southbank-centre',
    title: 'Southbank Centre',
    categories: ['Surfacing', 'Groundworks', 'Drainage'],
    sector: 'Commercial / Public Realm',
    client: 'Southbank Centre',
    location: 'London SE1',
    services: 'Surfacing · Groundworks · Drainage',
    duration: '14 weeks',
    summary: "External works and surfacing programme delivered around live cultural-venue operations on London's Southbank.",
    heroImage: 'southbank-centre.jpg',
    body: [
      heading('The brief'),
      block("Surrey Contracting was engaged to deliver a phased external works programme at the Southbank Centre, one of the UK's busiest cultural venues, without disruption to public access or live programming."),
      block('Works included surface-water drainage upgrades, full-depth surfacing reconstruction in two adjacent service yards, and the reinstatement of pedestrian footways and crossings. Logistics were planned around evening performances and weekend public access, with night-shift surfacing pours used to keep the site open through the day.'),
      heading('The delivery'),
      block('Excavation and base reconstruction were completed in 50-metre bays over a 6-week programme, with binder and surface courses laid on phased weekends. Pedestrian routes were maintained throughout with temporary tactile crossings and signed diversions.'),
      ...bulletList([
        '2,400m² of full-depth reconstruction',
        '180lm of precast kerbing and channel',
        '320m of new surface-water drainage and gullies',
        'Phased delivery around live venue operations',
        'Full traffic-management and pedestrian-route maintenance',
        'Independent core sampling and compliance testing on completion',
      ]),
      heading('The outcome'),
      block("Handover was achieved on programme with zero impact on ticketed performances. The new surfaces and drainage have improved both accessibility and run-off capacity, and the Southbank Centre's facilities team have since commissioned us for follow-on works."),
    ],
    gallery: [
      { file: 'southbank-centre-2.jpg', caption: 'Surfacing, base course' },
      { file: 'southbank-centre-3.jpg', caption: 'Reduced level dig' },
      { file: 'southbank-centre-4.jpg', caption: 'Reinstated footway' },
      { file: 'southbank-centre-5.jpg', caption: 'Drainage chambers' },
    ],
  },
  {
    slug: 'site-clearance-earthworks',
    title: 'Site Clearance and Earthworks',
    categories: ['Earthworks', 'Groundworks'],
    sector: 'Residential',
    client: 'Private residential',
    location: 'Farnham, Surrey',
    services: 'Groundworks · Earthworks',
    year: '2023',
    summary: 'Large-scale site clearance and earthworks for a domestic client in Farnham, Surrey, 80 tonnes of green waste removed and 100 tonnes of new topsoil brought in.',
    heroImage: 'site-clearance-earthworks.jpg',
    body: [
      heading('The project'),
      block("The team carried out a project for a domestic client in Farnham, Surrey. We were asked to clear a sizeable section of overgrown land after building works were completed. After our initial site visit, we were more than happy to carry this work out and completely understood our client's vision."),
      block('We now have a section of usable land and garden that the client can enjoy, with a phase 2 planned involving planting, turfing, and some hard landscape works. We removed around 80 tonnes of green waste and reused the soil on site, as well as bringing in around 100 tonnes of new topsoil which we levelled and created new slopes and gradients throughout.'),
    ],
    gallery: [
      { file: 'site-clearance-earthworks-2.jpg' },
      { file: 'site-clearance-earthworks-3.jpg' },
      { file: 'site-clearance-earthworks-4.jpg' },
    ],
  },
  {
    slug: 'domestic-earthworks',
    title: 'Domestic Earthworks Project',
    categories: ['Earthworks', 'Groundworks'],
    sector: 'Residential',
    client: 'Private residential',
    location: 'Horsell, Woking',
    services: 'Groundworks · Earthworks',
    year: '2023',
    summary: 'Swimming pool removal and garden preparation earthworks in Horsell, Woking, 220 tonnes of material moved.',
    heroImage: 'domestic-earthworks.jpg',
    body: [
      heading('The project'),
      block('Surrey Contracting carried out earthworks for a client in Horsell. The client was looking to fill in the existing swimming pool and carry out preparation for further landscaping works. We brought in a 3-tonne excavator and a 3-tonne dumper, broke out the existing swimming pool and reused the material for infill.'),
      block('We also brought in an extra 120 tonnes of crushed concrete as well as a further 100 tonnes of fine-graded topsoil to complete the works and put finished levels on the garden in readiness for turfing.'),
    ],
    gallery: [
      { file: 'domestic-earthworks-2.jpg' },
      { file: 'domestic-earthworks-3.jpg' },
    ],
  },
  {
    slug: 'drainage-ascot',
    title: 'Drainage Installation, Ascot',
    categories: ['Drainage', 'Groundworks'],
    sector: 'Residential',
    client: 'Private residential',
    location: 'Ascot, Surrey',
    services: 'Groundworks · Drainage',
    year: '2023',
    summary: 'New foul drainage installation and connection for a residential property in Ascot, preparing for a new downstairs bathroom.',
    heroImage: 'drainage-ascot.jpg',
    body: [
      heading('The project'),
      block('Surrey Contracting connected and installed new foul drainage for our client in Ascot in preparation for a new downstairs bathroom to be fitted by their builder. We connected to the existing foul drainage and core drilled into the building so all connections could be made, sealed all entry points and made good of all work areas.'),
    ],
    gallery: [
      { file: 'drainage-ascot-2.jpg' },
      { file: 'drainage-ascot-3.jpg' },
      { file: 'drainage-ascot-4.jpg' },
    ],
  },
  {
    slug: 'landscape-guildford',
    title: 'Residential Re-landscape, Guildford, Surrey',
    categories: ['Hard Landscaping'],
    sector: 'Residential',
    client: 'Private residential',
    location: 'Guildford, Surrey',
    services: 'Hard Landscaping',
    year: '2023',
    summary: '30sqm porcelain patio and new sleeper borders for a residential client in Guildford.',
    heroImage: 'landscape-guildford.jpg',
    body: [
      heading('The project'),
      block('Surrey Contracting carried out a 30sqm porcelain patio area and new sleeper borders for a residential client in Guildford.'),
    ],
    gallery: [
      { file: 'landscape-guildford-2.jpg' },
    ],
  },
  {
    slug: 'concrete-base-cobham',
    title: 'Concrete Base Installation, Premier Inn Cobham',
    categories: ['Groundworks'],
    sector: 'Commercial',
    client: 'Premier Inn',
    location: 'Cobham, Surrey',
    services: 'Groundworks',
    year: '2023',
    summary: 'Emergency concrete base installation for the Premier Inn in Cobham, completed within 3 days of initial site visit.',
    heroImage: 'concrete-base-cobham.jpg',
    body: [
      heading('The project'),
      block('Surrey Contracting carried out a concrete base installation for a new water tank at the Premier Inn, Cobham. We excavated the area and installed new base works and 150mm of reinforced concrete.'),
      block('This was carried out as a matter of urgency as their contractor let them down last minute. We carried out and completed the works within 3 days of the initial site visit.'),
    ],
    gallery: [
      { file: 'concrete-base-cobham-2.jpg' },
      { file: 'concrete-base-cobham-3.jpg' },
      { file: 'concrete-base-cobham-4.jpg' },
    ],
  },
  {
    slug: 'complete-landscape',
    title: 'Complete Re-landscape',
    categories: ['Hard Landscaping'],
    sector: 'Residential',
    client: 'Private residential',
    location: 'Virginia Water, Surrey',
    services: 'Hard Landscaping',
    year: '2023',
    summary: 'Full garden design and installation for a client in Virginia Water, contemporary planting, porcelain paving and water feature.',
    heroImage: 'complete-landscape.jpg',
    body: [
      heading('The project'),
      block("Surrey Contracting carried out a design and installation for our client in Virginia Water. The client wanted a very small garden to feel spacious but contemporary. We used a wide array of products and the planting scheme was discussed and thought about in depth as this area doesn't receive a large amount of sun throughout the day."),
      block('Our client leads a busy lifestyle so we integrated a lovely water feature for when they are at home relaxing and enjoying some time on the new patio area. This area of the property was being unused and now we have created a usable and relaxing space to sit and enjoy some time in the garden throughout the year.'),
    ],
    gallery: [
      { file: 'complete-landscape-2.jpg' },
      { file: 'complete-landscape-3.jpg' },
      { file: 'complete-landscape-4.jpg' },
    ],
  },
];

const assetCache = new Map();

async function uploadImage(filename) {
  if (assetCache.has(filename)) return assetCache.get(filename);
  const filePath = path.join(IMG_DIR, filename);
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload('image', buffer, { filename });
  assetCache.set(filename, asset);
  return asset;
}

async function run() {
  for (const [i, p] of projects.entries()) {
    console.log(`Importing: ${p.title}`);
    const heroAsset = await uploadImage(p.heroImage);
    const gallery = [];
    for (const g of p.gallery ?? []) {
      const asset = await uploadImage(g.file);
      gallery.push({
        _type: 'image',
        _key: asset._id,
        asset: { _type: 'reference', _ref: asset._id },
        caption: g.caption,
      });
    }

    const doc = {
      _id: `project-${p.slug}`,
      _type: 'project',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      categories: p.categories,
      sector: p.sector,
      client: p.client,
      location: p.location,
      services: p.services,
      year: p.year,
      duration: p.duration,
      status: 'Completed',
      summary: p.summary,
      heroImage: { _type: 'image', asset: { _type: 'reference', _ref: heroAsset._id } },
      body: p.body,
      gallery,
      order: i + 1,
    };

    await client.createOrReplace(doc);
  }
  console.log(`\nDone — imported ${projects.length} projects into Sanity.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
