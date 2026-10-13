# Archive

Reference copies of retired source files. Nothing in this folder is built,
served, routed, linked or listed in the sitemap: it sits outside `src/`, and
`tsconfig.json` excludes it, so Astro and `astro check` never read it.

## pages/2026-10 (archived 13 Oct 2026)

Replaced by the new service page designs (design handoff "service pages").
The routes stay the same, so no redirects were added.

| File | Original route |
|---|---|
| `pages/2026-10/demolition.astro` | `/demolition` |
| `pages/2026-10/sectors.astro` | `/sectors` |
| `pages/2026-10/health-safety.astro` | `/health-safety` |

These files are kept for reference only. Their relative imports
(`../layouts/BaseLayout.astro` and so on) no longer resolve from this folder.
That is expected: they are not compiled. To compare with the old pages, use
the files here or `git log --follow` on them.
