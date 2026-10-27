# Retiring contact.surreycontracting.co.uk

The old landing-page subdomain `contact.surreycontracting.co.uk` is being moved
off the old builder host (157.53.227.1) onto the VPS (187.77.180.148), where
nginx 301s every path to the main site. Query strings (gclid, utm_*) are kept so
Google Ads attribution survives the redirect.

Config file: `deploy/nginx-contact.conf`. Nothing here is deployed
automatically: the deploy workflow does not touch nginx, so every step below is
done by hand.

## Redirect mapping

Matching is case-insensitive and a trailing slash is optional.

| Old path on contact.               | Redirects to (301)                                   |
| ---------------------------------- | ---------------------------------------------------- |
| `/demolition`                      | `https://surreycontracting.co.uk/lp/demolition-2`   |
| `/groundworks`                     | `https://surreycontracting.co.uk/lp/groundworks-2`  |
| `/earthworks`                      | `https://surreycontracting.co.uk/lp/earthworks-2`   |
| `/surfacing-commercial`            | `https://surreycontracting.co.uk/` (homepage)        |
| anything else, including `/`       | `https://surreycontracting.co.uk/` (homepage)        |

Any query string is appended, for example
`/earthworks?gclid=abc` goes to `/lp/earthworks-2?gclid=abc`.

`/surfacing-commercial` currently points at the homepage. To send it somewhere
else later, edit that one line of the `map` block in `deploy/nginx-contact.conf`,
copy the file to the VPS again and run `sudo nginx -t && sudo nginx -s reload`.

## Steps (in this order)

### 1. Lower the DNS TTL (Hostinger)

In Hostinger DNS for surreycontracting.co.uk, edit the `contact` A record
(currently 157.53.227.1) and set its TTL to 300. Leave the IP alone for now.

Wait at least 4 hours before step 4, because resolvers may have cached the old
TTL of 14400 seconds.

### 2. Install the nginx config on the VPS

First confirm how nginx is laid out on the VPS:

```sh
sudo nginx -T | grep -nE 'server_name|include'
ls /etc/nginx/conf.d /etc/nginx/sites-enabled
sudo certbot certificates
```

If the main site lives in `/etc/nginx/conf.d/` (the layout `deploy/nginx.conf`
assumes), install the new file alongside it:

```sh
sudo cp deploy/nginx-contact.conf /etc/nginx/conf.d/contact.surreycontracting.conf
```

If instead the main site lives in `sites-available` with a symlink in
`sites-enabled`, follow that layout:

```sh
sudo cp deploy/nginx-contact.conf /etc/nginx/sites-available/contact.surreycontracting.conf
sudo ln -s /etc/nginx/sites-available/contact.surreycontracting.conf /etc/nginx/sites-enabled/
```

Both directories are included inside the `http {}` block of the stock Ubuntu
`nginx.conf`, which the `map` directive needs. Then test and reload:

```sh
sudo nginx -t && sudo nginx -s reload
```

**Warning:** never copy `deploy/nginx.conf` over the live main vhost. The repo
copy holds only the port 80 blocks; the port 443 blocks on the VPS were written
by certbot and would be lost, taking HTTPS down for the main site.

### 3. Test before the DNS change

This sends the request straight to the VPS without waiting for DNS:

```sh
curl -sI --resolve contact.surreycontracting.co.uk:80:187.77.180.148 \
  'http://contact.surreycontracting.co.uk/demolition?gclid=1'
```

Expect `HTTP/1.1 301` and
`Location: https://surreycontracting.co.uk/lp/demolition-2?gclid=1`.

### 4. Point DNS at the VPS (Hostinger)

Change the `contact` A record to `187.77.180.148` (keep TTL 300). Confirm it has
propagated:

```sh
curl -s 'https://dns.google/resolve?name=contact.surreycontracting.co.uk&type=A'
```

The `Answer` section should show 187.77.180.148.

### 5. Issue the TLS certificate (immediately after step 4)

Until this is done, HTTPS visits to contact. will fail, and old ads links are
HTTPS, so do this straight away:

```sh
sudo certbot --nginx -d contact.surreycontracting.co.uk --no-redirect
sudo nginx -t && sudo nginx -s reload
sudo certbot renew --dry-run
```

Why `--no-redirect`: without it certbot adds its own http to https redirect for
contact., so an http visitor would go http contact, then https contact, then the
main site (two hops). With `--no-redirect`, the port 80 block keeps sending
visitors straight to the main site in one hop, and certbot copies the same
`location /` redirect into the new 443 block.

The redirect sits inside `location /` rather than at server level so that
certbot's temporary ACME challenge location still works for issue and renewal.

### 6. Verify after the cutover

```sh
for p in / /demolition /demolition/ /Groundworks '/earthworks?gclid=abc&utm_source=g' /surfacing-commercial /random; do
  printf '%-40s ' "$p"
  curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "https://contact.surreycontracting.co.uk$p"
done
```

Every line should be `301` with the target from the mapping table and the query
string intact. Then check plain http goes straight to the main site in one hop:

```sh
curl -sI 'http://contact.surreycontracting.co.uk/demolition?gclid=1' | grep -iE '^(HTTP|location)'
```

Expect `Location: https://surreycontracting.co.uk/lp/demolition-2?gclid=1`
(not `https://contact.surreycontracting.co.uk/...`).

### 7. Tidy up

- Once everything checks out, raise the `contact` A record TTL back up (for
  example 14400) in Hostinger.
- Update the Google Ads final URLs to point directly at
  `https://surreycontracting.co.uk/lp/demolition-2`, `/lp/groundworks-2` and
  `/lp/earthworks-2`. The redirect is a safety net for old links, not something
  live ads should depend on.
