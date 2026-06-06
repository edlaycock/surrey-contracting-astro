# Surrey Contracting Astro Rebuild - Project Resume

## Project Overview
Rebuild of the Surrey Contracting website (23 hand-coded HTML pages) as a modern headless site.
- **Stack:** Astro 6 + Sanity CMS + SMTP2GO (HTTP API) + Docker on Hostinger VPS
- **Repo:** https://github.com/edlaycock/surrey-contracting-astro (private)
- **Staging:** https://surreycontracting.cumulusdigital.co.uk
- **Sanity Studio:** https://surreycontracting.sanity.studio
- **VPS:** cumulus@187.77.180.148 (Ubuntu 24.04, Docker, nginx)

## Completed

### Phase 1-3: Core Build
- All 23 pages ported to Astro
- Shared Nav/Footer components
- XML sitemap
- Service/Breadcrumb/LocalBusiness JSON-LD structured data

### Phase 4: Contact Form
- SMTP2GO HTTP API integration (`src/pages/api/contact.ts`)
- Honeypot spam protection (`_honeypot` field)
- Astro CSRF origin check enabled
- Verified working (sender: website@surreycontracting.co.uk -> info@)

### Phase 5: Sanity CMS
- Sanity project ID: mhqgpyb9, dataset: production
- Studio deployed and live
- Schema for projects/case studies
- Sample project seeded (`sample-cobham-cut-fill`)
- `/projects` page fetches from Sanity at build time

### Deployment
- Docker container on VPS (port 4321), nginx reverse proxy
- Staging site live with valid TLS (certbot, expires 2026-09-01)
- Cloudflare DNS for staging subdomain (A record, DNS-only)
- GitHub Actions CI builds successfully (deploy step skipped pending secrets)

## Remaining

### 1. Production Domain Setup
- Point `surreycontracting.co.uk` A record -> 187.77.180.148
- Remove old Hostinger AAAA record
- Run certbot for production domain TLS
- Update nginx vhost `surreycontracting.conf` with real domain
- **Needs:** DNS provider access

### 2. Real Content
- Replace sample Sanity project with real case studies
- Client adds content via Sanity Studio
- Delete `sample-cobham-cut-fill` when real content is in
- **Needs:** Client to provide project photos/descriptions

### 3. CI Auto-Deploy (Optional)
- Add GitHub repo secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `DEPLOY_PATH`
- Generate deploy key on VPS or use existing
- Workflow in `.github/workflows/deploy.yml` ready
- Sanity webhook -> `repository_dispatch` for content-triggered rebuilds
- **Needs:** SSH deploy key setup

### 4. Cleanup (Optional)
- Remove `nodemailer` from package.json (no longer used)
- Remove Sanity `SANITY_DISABLE=1` escape hatch if no longer needed

## Manual Deploy Command
Until CI is wired:
```bash
git archive HEAD | ssh cumulus@187.77.180.148 "cd /home/cumulus/surrey-contracting && tar -xf -" && \
ssh cumulus@187.77.180.148 "cd /home/cumulus/surrey-contracting && docker compose up -d --build"
```

## Local Dev Notes
- Use `nvm use 22` before running Astro/npm
- Local builds may hang (Mac sandbox/iCloud issue) - CI builds fine
- `.env` contains `SMTP2GO_API_KEY` (gitignored)
