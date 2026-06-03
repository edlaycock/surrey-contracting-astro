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
