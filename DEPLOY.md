# Deploying to the Hostinger VPS

Static pages are served by nginx; one Node process (PM2) handles `/api/contact`.
Pushing to `main` (or a Sanity publish) triggers GitHub Actions → build → rsync →
PM2 reload.

## One-time VPS setup

```bash
# 1. Node 22 (via nvm or NodeSource), PM2, nginx, certbot
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pm2

# 2. Directories (app user, not root)
sudo mkdir -p /var/www/surrey-contracting/{releases,shared}
sudo chown -R $USER:$USER /var/www/surrey-contracting

# 3. Server-only secrets (NOT in git) — chmod 600
cat > /var/www/surrey-contracting/shared/.env <<'EOF'
SMTP2GO_API_KEY=api-XXXXXXXXXXXXXXXX
CONTACT_TO=info@surreycontracting.co.uk
CONTACT_FROM=Surrey Contracting Website <website@surreycontracting.co.uk>
EOF
chmod 600 /var/www/surrey-contracting/shared/.env

# 4. nginx site (see deploy/nginx.conf) + TLS
sudo cp deploy/nginx.conf /etc/nginx/sites-available/surreycontracting
sudo ln -sf /etc/nginx/sites-available/surreycontracting /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d surreycontracting.co.uk -d www.surreycontracting.co.uk

# 5. Hardening
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
# SSH keys only (disable password auth), install fail2ban.
```

## GitHub Actions secrets (repo → Settings → Secrets → Actions)

| Secret | Value |
|---|---|
| `SSH_HOST` | VPS IP |
| `SSH_USER` | deploy user |
| `SSH_KEY`  | private key for that user |
| `DEPLOY_PATH` | `/var/www/surrey-contracting` |

## Auto-rebuild when the client publishes a project

Sanity → API → Webhooks → add:
`https://api.github.com/repos/<owner>/<repo>/dispatches`
POST, header `Authorization: Bearer <GitHub PAT with repo scope>`,
body `{"event_type":"sanity-publish"}`.

## First deploy

Push to `main`. The workflow builds, rsyncs to `releases/<sha>`, runs
`npm ci --omit=dev`, points `current` at it, and `pm2 reload`s. PM2 boot
persistence: `pm2 startup && pm2 save`.

## Retiring contact.surreycontracting.co.uk (Ed, manual)

`contact.surreycontracting.co.uk` hosted the previous agency's landing pages on
another server (157.53.227.1). `deploy/nginx-contact-redirect.conf` 301s its
paths to the new pages on this VPS, keeping the query string (gclid, UTMs):
`/groundworks`, `/demolition`, `/earthworks`, `/drainage`, `/agricultural`
(with or without a trailing slash) go to the matching `/lp/` page; the root and
any other path go to the homepage. Nothing happens until DNS points here.

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
