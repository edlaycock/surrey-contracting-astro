#!/usr/bin/env node
/**
 * One-off content cleanup in Sanity for the surfacing removal (Deployment 1).
 *
 *   1. Unpublishes the three surfacing case studies. Content is preserved as a
 *      Studio draft, so nothing is lost and the job can be undone by hand.
 *   2. Rewrites the Southbank Centre project, which is retained: it drops the
 *      Surfacing category and service label, and rewords the summary, one
 *      gallery caption and three body paragraphs so no surfacing wording is
 *      left on the live page.
 *
 * Usage:
 *   SANITY_API_TOKEN=sk... node scripts/sanity-surfacing-cleanup.mjs          # dry run
 *   SANITY_API_TOKEN=sk... node scripts/sanity-surfacing-cleanup.mjs --apply  # writes
 *
 * The token needs Editor permissions and comes from
 * sanity.io/manage → the project → API → Tokens.
 */

const PROJECT = 'mhqgpyb9';
const DATASET = 'production';
const API = '2024-10-01';
const TOKEN = process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN;
const APPLY = process.argv.includes('--apply');

if (!TOKEN) {
  console.error('SANITY_API_TOKEN is not set. See the usage note at the top of this file.');
  process.exit(1);
}

const UNPUBLISH = [
  'project-tarmac-driveway',
  'project-tarmac-driveway-fetcham',
  'project-tarmac-repairs-sutton',
];

// Body paragraphs to reword on the retained Southbank Centre project, keyed by
// the Portable Text block _key so nothing else in the document is touched.
const SOUTHBANK_BODY = {
  kgii7owp:
    "Works included surface-water drainage upgrades, full-depth reconstruction of two adjacent service yards, and the reinstatement of pedestrian footways and crossings. Logistics were planned around evening performances and weekend public access, with night-shift pours used to keep the site open through the day.",
  kkiygrlu:
    "Excavation and base reconstruction were completed in 50-metre bays over a 6-week programme, with reinstatement completed on phased weekends. Pedestrian routes were maintained throughout with temporary tactile crossings and signed diversions.",
  k10dcb5h9:
    "Handover was achieved on programme with zero impact on ticketed performances. The new hardstanding and drainage have improved both accessibility and run-off capacity, and the Southbank Centre's facilities team have since commissioned us for follow-on works.",
};

const query = async (q) => {
  const res = await fetch(
    `https://${PROJECT}.api.sanity.io/v${API}/data/query/${DATASET}?query=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${TOKEN}` } },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.result;
};

const mutate = async (mutations) => {
  if (!APPLY) {
    console.log('  [dry run] would send:', JSON.stringify(mutations, null, 2).slice(0, 400), '…');
    return;
  }
  const res = await fetch(
    `https://${PROJECT}.api.sanity.io/v${API}/data/mutate/${DATASET}?returnIds=true`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ mutations }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  console.log('  ✓ applied:', json.results?.map((r) => `${r.operation} ${r.id}`).join(', '));
};

console.log(APPLY ? 'APPLYING CHANGES\n' : 'DRY RUN — pass --apply to write\n');

// ---- 1. Unpublish the three surfacing case studies (kept as drafts) ----
for (const id of UNPUBLISH) {
  const doc = await query(`*[_id == "${id}"][0]`);
  if (!doc) { console.log(`- ${id}: already gone, skipping`); continue; }
  console.log(`- ${id}: "${doc.title}" → unpublish (draft kept)`);
  await mutate([
    { createIfNotExists: { ...doc, _id: `drafts.${id}` } },
    { delete: { id } },
  ]);
}

// ---- 2. Reword the retained Southbank Centre project ----
const sb = await query('*[_id == "project-southbank-centre"][0]');
if (!sb) {
  console.log('- project-southbank-centre: not found, skipping');
} else {
  console.log('\n- project-southbank-centre: strip surfacing wording');
  const body = (sb.body ?? []).map((block) => {
    const replacement = SOUTHBANK_BODY[block._key];
    if (!replacement || !block.children?.length) return block;
    // Single-span paragraphs: replace the text, keep every other property.
    return { ...block, children: [{ ...block.children[0], text: replacement }] };
  });
  const gallery = (sb.gallery ?? []).map((img) =>
    img.caption === 'Surfacing, base course' ? { ...img, caption: 'Base course preparation' } : img,
  );
  await mutate([
    {
      patch: {
        id: 'project-southbank-centre',
        set: {
          categories: (sb.categories ?? []).filter((c) => c !== 'Surfacing'),
          services: 'Groundworks · Drainage',
          summary:
            "External works and drainage programme delivered around live cultural-venue operations on London's Southbank.",
          body,
          gallery,
        },
      },
    },
  ]);
}

console.log('\nDone.', APPLY ? 'Sanity publishes trigger a site rebuild automatically.' : 'No changes written.');
