# Surrey Contracting — Sanity Studio

The content editor for **case studies / projects**. Connected to Sanity project
`mhqgpyb9`, dataset `production` (public).

## First-time setup

```bash
cd studio
npm install
npx sanity login        # opens a browser to log in (one-time)
npm run dev             # local Studio at http://localhost:3333
```

## Deploy a hosted Studio for the client

```bash
npm run deploy          # publishes to https://<your-name>.sanity.studio
```

Give the client that URL + invite them in https://sanity.io/manage. They add a
**Project / Case study**, hit Publish, and it appears on the website
(after the next site build — see the deploy webhook in Phase 6).

## Schema

- `project` — title, slug, category, client, location, summary, hero image,
  gallery, body (rich text), featured, sort order.

## Importing the existing case studies (optional)

The 10 legacy case studies currently live as static pages on the site. To move
them into Sanity, either re-enter them here, or prepare an `.ndjson` and run:

```bash
npx sanity dataset import projects.ndjson production
```
