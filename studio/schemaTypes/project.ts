import { defineType, defineField, defineArrayMember } from 'sanity';

const CATEGORY_OPTIONS = ['Drainage', 'Driveways', 'Earthworks', 'Groundworks', 'Hard Landscaping', 'Surfacing'];

export default defineType({
  name: 'project',
  title: 'Project / Case study',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories (for filtering)',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: CATEGORY_OPTIONS },
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'sector',
      title: 'Sector',
      type: 'string',
      description: 'Shown as the small tag on the hero, e.g. "Residential", "Commercial", "Education".',
      options: {
        list: ['Residential', 'Commercial', 'Education', 'Commercial / Public Realm', 'Public Sector'],
      },
    }),
    defineField({ name: 'client', title: 'Client', type: 'string' }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({
      name: 'services',
      title: 'Services (short label for meta card)',
      type: 'string',
      description: 'e.g. "Tarmac · Drainage"',
    }),
    defineField({ name: 'year', title: 'Year', type: 'string' }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'Used instead of Year on the meta card when set, e.g. "14 weeks".',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'Completed',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'Short description used on cards, the hero lede, and search/AI snippets.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      description: 'Use H2 headings for sections like "The brief", "The delivery", "The outcome", and bullet lists for feature lists.',
    }),
    defineField({
      name: 'gallery',
      title: 'On-site gallery',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'alt', type: 'string', title: 'Alt text' },
            { name: 'caption', type: 'string', title: 'Caption', description: 'Optional small label shown on the photo, e.g. "Surfacing, base course".' },
          ],
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured on homepage',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      description: 'Lower numbers appear first.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'sector', media: 'heroImage' },
  },
});
