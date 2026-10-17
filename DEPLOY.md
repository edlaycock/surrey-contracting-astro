# Deploying to the Hostinger VPS

The site runs as a single Docker container (Astro's standalone Node server)
on the VPS. The container listens only on `127.0.0.1:4321`; the system nginx
proxies `surreycontracting.co.uk` to it and handles TLS. Deploys run from
GitHub Actions (`.github/workflows/deploy.yml`, "Build & deploy to VPS").

## What triggers a deploy

- A push to `main`.
- A Sanity publish: a Sanity webhook sends a `repository_dispatch` event of
  type `sanity-publish` (setup below).
- A manual run (`workflow_dispatch`). It takes one optional input,
  `ytq_claim_code`, which also installs the YourTradeQuotes key (see
  "Connecting YourTradeQuotes" below). Left empty, a manual run is an
  ordinary deploy.

Runs share a concurrency group per branch, so a new run cancels one still in
progress.

## What a run does

1. **Build check in Actions.** On a manual run, first reads `ytq_claim_code`
   from the event payload and masks it (nothing happens when it is empty).
   Then checks out the repo, installs Node 22, runs
   `npm ci` and `npm run build` against the Sanity `production` dataset.
   `npm run build` also runs the `postbuild` guards, and any failure stops
   the run before anything reaches the server:
   - `scripts/check-homepage.mjs`: no unfilled `{{PLACEHOLDER}}` on any page,
     no SafeContractor or Alcumus anywhere (pages and llms files), no
     surfacing terms or em dashes on the homepage, the homepage word limit,
     the direct-answer paragraph and FAQ schema matching visible text.
   - `scripts/check-locations.mjs`: every location page is built with a
     unique title and description, one `<h1>`, the direct answer, the case
     study card, matching FAQ and Service schema, and no em dashes.
   - `scripts/check-guides.mjs`: every guide page is built with a unique
     title and description, one `<h1>`, matching FAQ schema, a breadcrumb,
     no em dashes, no prices, and is listed in the sitemap.
   - `scripts/check-lp.mjs`: the v2 landing pages are `noindex,follow`, have
     one `<h1>` and one quote form with the right lead source, contain no em
     or en dashes or forbidden terms, and reference only assets that exist.
   - `scripts/check-no-keys.mjs`: no file under `dist/client` contains
     `ytq_live_`, `ytq_pub_` or `submitEnquiry`. YourTradeQuotes is reached
     from the server only.
2. **Rsync the source to the VPS** into the `DEPLOY_PATH` directory, with
   `--delete`. Excluded: `.git`, `node_modules`, `dist`, `.astro`, `studio`
   and `.env`, so the server's `.env` is never overwritten or deleted.
3. **Rebuild and restart the container** over SSH:
   `cd "$DEPLOY_PATH"`, `bash scripts/ytq-connect.sh install`, export a
   unique `BUILD_ID`, then `docker compose up -d --build`,
   `docker compose ps` and `bash scripts/ytq-connect.sh ping`. Both
   `ytq-connect.sh` calls exit at once and change nothing unless a claim code
   was supplied, so a push or a Sanity publish runs exactly as before. The Docker build
   runs `npm run build` again (guards included), fetching current Sanity
   content. `BUILD_ID` changes on every run so that layer is never served
   from cache; without it, a Sanity publish or manual run with no code
   change would ship the old content.
4. **Smoke checks** against `https://surreycontracting.co.uk`, retried up to
   9 times, 10 seconds apart:
   - `/` and `/lp/demolition`, `/lp/groundworks`, `/lp/earthworks` plus their
     `-2` variants return 200;
   - `/lp/<page>/thanks` returns 200 for every file in `src/pages/lp/`;
   - `/lp/groundworks` and `/lp/groundworks-2` each contain at least 6
     `data-tc-masked` attributes (TruConversion masking on the forms);
   - an unknown path returns 404 with the branded page ("This page took a
     wrong turn").

   If they still fail after the last attempt, the run fails.

Steps 2 to 4 only run when the `SSH_HOST` secret is set; without it a run is
a build check only.

## GitHub Actions secrets

Repo, Settings, Secrets and variables, Actions. Names only; values live in
GitHub, never in the repo.

| Secret | Purpose |
|---|---|
| `SSH_HOST` | VPS address |
| `SSH_USER` | deploy user on the VPS |
| `SSH_KEY` | private SSH key for that user |
| `DEPLOY_PATH` | directory on the VPS holding the source and `docker-compose.yml` |

The Sanity project ID and dataset are public and set in the workflow, not as
secrets.

## One-time VPS setup

The server needs Docker with the Compose plugin, nginx and certbot. Node and
PM2 are not needed on the server: the build runs inside the container.

```bash
# 1. Deploy directory, owned by the deploy user. That user runs
#    `docker compose` over SSH without sudo, so it needs Docker access.
mkdir -p "$DEPLOY_PATH"

# 2. Server-only secrets (NOT in git), read by docker-compose.yml (env_file).
#    Keys as in .env.example.
cat > "$DEPLOY_PATH/.env" <<'ENV'
SMTP2GO_API_KEY=api-XXXXXXXXXXXXXXXX
CONTACT_TO=info@surreycontracting.co.uk
CONTACT_FROM=Surrey Contracting Website <website@surreycontracting.co.uk>
ENV
chmod 600 "$DEPLOY_PATH/.env"
# YTQ_SECRET_KEY is added to this file by the claim-code deploy
# ("Connecting YourTradeQuotes" below), not typed here.

# 3. nginx vhost (deploy/nginx.conf proxies to 127.0.0.1:4321) + TLS
sudo cp deploy/nginx.conf /etc/nginx/conf.d/surreycontracting.conf
sudo nginx -t && sudo nginx -s reload
sudo certbot --nginx -d surreycontracting.co.uk -d www.surreycontracting.co.uk

# 4. Hardening
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
# SSH keys only (disable password auth), install fail2ban.
```

`.env` names (values never in the repo or in page code):

| Name | Purpose |
|---|---|
| `SMTP2GO_API_KEY` | sends the enquiry email |
| `CONTACT_TO`, `CONTACT_FROM` | enquiry email recipient and sender |
| `YTQ_SECRET_KEY` | server-only YourTradeQuotes secret key; `/api/contact` copies every valid enquiry to YTQ with it. Written by `scripts/ytq-connect.sh` from a claim code. Unset, the relay is skipped and logs one line |
| `YTQ_ENDPOINT` | optional, local testing only: overrides the YTQ endpoint |
| `SMTP2GO_ENDPOINT` | optional, local testing only: overrides the SMTP2GO API URL |

After changing `.env`, run `docker compose up -d` in `DEPLOY_PATH` (or the
next deploy) so the container picks it up.

## Enquiries to YourTradeQuotes

`/api/contact` validates the form, checks the honeypot, then hands the
enquiry to `src/lib/ytqRelay.ts` without waiting for it, and sends the email
as before. The relay posts JSON to YTQ's `submitEnquiry` with the secret in
the `x-ytq-api-key` header and one `Idempotency-Key` per submission, retries
429, 5xx, timeouts (5 s) and network errors up to 3 times with the same key,
and never retries 400, 401, 403 or 413. It runs whether the email succeeds
or fails (Ed, 15 Oct 2026: a lead is never lost to an email failure), and it
never changes or delays the visitor's response. Logs carry the outcome and
status only. Tests: `npm run test:ytq-relay` (local stubs only).

## Connecting YourTradeQuotes

The secret key is never typed, pasted, printed or stored as a GitHub secret.
The server fetches it itself with a one-time claim code (YourTradeQuotes
`docs/ENQUIRY-CONNECTOR.md`, "Mode 3a"; checklist in that repo's
`skills/connect-client-website.md`).

**Standard path: a claim code through the deploy.**

1. In YTQ System Admin, Surrey Contracting, Website connection, Connect a
   website: label `surreycontracting.co.uk` (the owner sees it), tick Also
   replace the key only to rotate, type the account's login email, Issue
   claim code. The code starts `ytq_claim_`, works once and lasts 15 minutes.
2. Straight away: Actions, "Build & deploy to VPS", Run workflow on `main`,
   paste the code into `ytq_claim_code`. Or
   `gh workflow run deploy.yml --ref main -f ytq_claim_code=<code>`.
3. On the server, `scripts/ytq-connect.sh install` runs first in the SSH
   step, before the image build: it exchanges the code at YTQ's
   `claimWebsiteKey` and writes `YTQ_SECRET_KEY=` into `$DEPLOY_PATH/.env`
   (mode 600). Every other line is kept; an existing `YTQ_SECRET_KEY` line is
   replaced, and only when a code was supplied. The container then starts
   with the key, and `scripts/ytq-connect.sh ping` checks it against YTQ.
4. The run log must show both `YTQ key installed for <business>` and
   `YTQ ping: ok`. The key itself never appears in the runner or the log.
5. Then one real enquiry through the live form, agreed with Surrey
   Contracting first, named "Website test, please ignore": it must arrive in
   their YTQ Enquiries. A green ping proves the key, not the form.

Rules:
- `YTQ claim refused (status 404)` means the code was used, expired,
  mistyped or superseded. Ask for a new code. Do not loop on the same one:
  five attempts per address per ten minutes, then 429.
- **Never use Re-run on a run that carried a code**: it replays the old
  input. Dispatch a fresh run with a new code.
- Do not merge to `main` while a claim-code run is in progress: the
  concurrency group cancels it. If that happens before the install line,
  the code is unspent and still usable inside its 15 minutes; after it, the
  key is already in `.env` and the next deploy starts the container with it.
- Workflow inputs are readable by anyone who can see this repo's Actions
  runs. That is accepted for a code that dies after one use or 15 minutes,
  is audited, and emails the owner when used. It would not be for the key.
- Rotation is the same flow with Also replace the key ticked; the old key
  keeps working for 7 days.

**Fallback: by hand over SSH.** If the workflow cannot be run (Actions down,
dispatch refused), the same script works on the server from a fresh code:

```bash
cd "$DEPLOY_PATH"
read -rs YTQ_CLAIM_CODE && export YTQ_CLAIM_CODE   # paste the code; not echoed, not in shell history
bash scripts/ytq-connect.sh install
docker compose up -d
bash scripts/ytq-connect.sh ping
unset YTQ_CLAIM_CODE
```

Or, where the key itself is to hand in YTQ System Admin, edit `.env`
directly: one line `YTQ_SECRET_KEY=<key>`, `chmod 600 .env`, then
`docker compose up -d`. A key set this way is left alone by every later
deploy that carries no claim code.

certbot manages the TLS sections of the live nginx config; do not edit them
by hand. The container has `restart: unless-stopped`, so it comes back after
a reboot once Docker starts.

## Rebuild when the client publishes in Sanity

Sanity, API, Webhooks, add:
`https://api.github.com/repos/<owner>/<repo>/dispatches`
POST, header `Authorization: Bearer <GitHub PAT with repo scope>`,
body `{"event_type":"sanity-publish"}`.

## Running and checking a deploy

- **Run manually:** GitHub, Actions, "Build & deploy to VPS", Run workflow
  on `main`. Or `gh workflow run deploy.yml --ref main`.
- **Check a run:** the Actions tab, or `gh run list --workflow=deploy.yml`
  then `gh run watch <run-id>`. The "Verify key pages are live" step prints
  each checked path with its status code.
- **On the server:** in `DEPLOY_PATH`, `docker compose ps` and
  `docker compose logs surrey-contracting`.

## Rollback

There is no release history on the server: each deploy rebuilds from the
source rsynced from `main`. To roll back, revert the commit on `main`
(`git revert <sha>`, then push or merge); the push redeploys. Page content
from Sanity is fetched at build time, so a CMS mistake is fixed in Sanity,
which redeploys through the webhook.

## After a deploy

When routes are added, removed or renamed, resubmit
`https://surreycontracting.co.uk/sitemap-index.xml` in Google Search Console.

## Retiring contact.surreycontracting.co.uk (Ed, manual)

`contact.surreycontracting.co.uk` hosted the previous agency's landing pages on
another server (157.53.227.1). `deploy/nginx-contact-redirect.conf` 301s its
paths to the new pages on this VPS, keeping the query string (gclid, UTMs):
`/groundworks`, `/demolition`, `/earthworks`, `/drainage`, `/agricultural`
(with or without a trailing slash) go to the matching `/lp/` page;
`/surfacing-commercial` goes to `/lp/commercial-surfacing`; the root and any
other path go to the homepage. Nothing happens until DNS points here.

```bash
# 1. DNS: change the A record for `contact` to 187.77.180.148 (remove any AAAA
#    or CNAME for `contact`). Wait until this returns 187.77.180.148:
dig +short contact.surreycontracting.co.uk

# 2. Install the vhost (a separate file, so the live main-site config and its
#    certbot TLS sections are untouched)
sudo cp deploy/nginx-contact-redirect.conf /etc/nginx/conf.d/contact-surreycontracting.conf
sudo nginx -t && sudo systemctl reload nginx

# 3. Certificate. --no-redirect keeps the one-hop redirect on plain HTTP too;
#    certbot adds the 443 listener and cert paths to the same server block.
sudo certbot --nginx --no-redirect -d contact.surreycontracting.co.uk
sudo nginx -t && sudo systemctl reload nginx

# 4. Checks. Each should be a 301 with the Location shown.
curl -sI 'https://contact.surreycontracting.co.uk/groundworks?gclid=test' | grep -iE '^(HTTP|location)'
#   location: https://surreycontracting.co.uk/lp/groundworks?gclid=test
curl -sI 'http://contact.surreycontracting.co.uk/demolition/?utm_source=google' | grep -iE '^(HTTP|location)'
#   location: https://surreycontracting.co.uk/lp/demolition?utm_source=google
curl -sI 'https://contact.surreycontracting.co.uk/anything-else' | grep -iE '^(HTTP|location)'
#   location: https://surreycontracting.co.uk/
sudo certbot renew --dry-run
```

Until step 1 is done, the old subdomain still serves whatever the other server
returns, so do not point any ad or link at it.
