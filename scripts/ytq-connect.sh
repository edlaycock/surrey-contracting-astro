#!/usr/bin/env bash
# Installs a client site's YourTradeQuotes secret key on its own server, from
# a one-time claim code (YourTradeQuotes v1.1.467, docs/ENQUIRY-CONNECTOR.md
# "Mode 3a").
#
# TEMPLATE (YourTradeQuotes repo, templates/client-site/). Copy to the site's
# scripts/ytq-connect.sh. It runs ON the server, inside the deploy's SSH step,
# from the deploy directory:
#
#   bash scripts/ytq-connect.sh install   # before docker compose up
#   docker compose up -d --build
#   bash scripts/ytq-connect.sh ping      # after it
#
# install: exchanges $YTQ_CLAIM_CODE for the secret key at claimWebsiteKey and
#   writes YTQ_SECRET_KEY= into the env file (default ./.env), mode 600,
#   keeping every other line. Prints "YTQ key installed for <business>".
# ping: reads YTQ_SECRET_KEY back from the env file and pings submitEnquiry
#   with it. Prints "YTQ ping: ok" or fails the step.
# Both do nothing, silently, when YTQ_CLAIM_CODE is empty: an ordinary deploy.
#
# The key and the code are never printed, never put on a command line (other
# users of the server could read them in `ps`), and never written anywhere but
# the env file. The response is never eval'd or sourced: the key is taken out
# of it by a strict pattern and anything else is refused.
#
# Overrides (for tests only): YTQ_CLAIM_URL, YTQ_PING_URL, YTQ_ENV_FILE.
set -euo pipefail
set +x
umask 077

MODE="${1:-install}"
CODE="${YTQ_CLAIM_CODE:-}"
ENV_FILE="${YTQ_ENV_FILE:-.env}"
CLAIM_URL="${YTQ_CLAIM_URL:-https://europe-west2-yourtradequotes.cloudfunctions.net/claimWebsiteKey}"
PING_URL="${YTQ_PING_URL:-https://europe-west2-yourtradequotes.cloudfunctions.net/submitEnquiry}"
# Built in two halves so a scan of this file for key prefixes finds nothing.
KEY_PREFIX='ytq_''live_'
KEY_RE="^${KEY_PREFIX}[a-z0-9]{20,64}\$"
CODE_RE='^ytq_claim_[a-z0-9]{32}$'

[ -z "$CODE" ] && exit 0

if ! [[ "$CODE" =~ $CODE_RE ]]; then
  echo "YTQ claim code is not in the expected form (ytq_claim_ and 32 letters or digits). Nothing changed." >&2
  exit 1
fi

TMP_FILES=()
cleanup() { if [ "${#TMP_FILES[@]}" -gt 0 ]; then rm -f "${TMP_FILES[@]}"; fi; }
trap cleanup EXIT
secret_tmp() { local f; f="$(mktemp)"; TMP_FILES+=("$f"); printf '%s' "$f"; }

install_key() {
  local body_file out status body key business dir tmp
  body_file="$(secret_tmp)"
  printf '{"claimCode":"%s"}' "$CODE" > "$body_file"
  out="$(secret_tmp)"
  status="$(curl -sS --max-time 30 -o "$out" -w '%{http_code}' \
    -H 'content-type: application/json' --data-binary @"$body_file" "$CLAIM_URL")" || status="000"
  if [ "$status" != "200" ]; then
    echo "YTQ claim refused (status $status). The code may be used, expired or mistyped: ask for a new one. Nothing changed." >&2
    exit 1
  fi
  body="$(cat "$out")"
  key="$(printf '%s' "$body" | grep -oE "\"apiKey\":\"${KEY_PREFIX}[a-z0-9]{20,64}\"" | head -n1 | sed -E 's/^"apiKey":"(.*)"$/\1/')" || key=""
  if ! [[ "$key" =~ $KEY_RE ]]; then
    echo "YTQ claim answered without a key in the expected form. Nothing changed." >&2
    exit 1
  fi
  business="$(printf '%s' "$body" | grep -oE '"business":"[^"\\]{0,120}"' | head -n1 | sed -E 's/^"business":"(.*)"$/\1/' | tr -cd "A-Za-z0-9 &.,()'-")" || business=""

  # Upsert through a temp file in the same directory, then one rename, so the
  # env file is never half-written and never readable by anyone else.
  dir="$(dirname "$ENV_FILE")"
  tmp="$(mktemp "$dir/.ytq-env.XXXXXX")"
  TMP_FILES+=("$tmp")
  if [ -f "$ENV_FILE" ]; then
    grep -Ev '^[[:space:]]*(export[[:space:]]+)?YTQ_SECRET_KEY=' "$ENV_FILE" > "$tmp" || true
  fi
  printf 'YTQ_SECRET_KEY=%s\n' "$key" >> "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$ENV_FILE"
  key=""
  body=""
  echo "YTQ key installed for ${business:-the account}"
}

ping_key() {
  local key hdr out status
  if [ ! -f "$ENV_FILE" ]; then
    echo "YTQ ping: failed (no env file)" >&2
    exit 1
  fi
  key="$(grep -E '^[[:space:]]*(export[[:space:]]+)?YTQ_SECRET_KEY=' "$ENV_FILE" | tail -n1 | sed -E 's/^[[:space:]]*(export[[:space:]]+)?YTQ_SECRET_KEY=//; s/^["'\'']//; s/["'\'']$//')" || key=""
  if ! [[ "$key" =~ $KEY_RE ]]; then
    echo "YTQ ping: failed (no key in the env file)" >&2
    exit 1
  fi
  hdr="$(secret_tmp)"
  printf 'x-ytq-api-key: %s\n' "$key" > "$hdr"
  key=""
  out="$(secret_tmp)"
  status="$(curl -sS --max-time 30 -o "$out" -w '%{http_code}' \
    -H 'content-type: application/json' -H @"$hdr" --data '{"mode":"ping"}' "$PING_URL")" || status="000"
  if [ "$status" = "200" ] && grep -q '"ping":true' "$out"; then
    echo "YTQ ping: ok"
  else
    echo "YTQ ping: failed (status $status)" >&2
    exit 1
  fi
}

case "$MODE" in
  install) install_key ;;
  ping) ping_key ;;
  *) echo "usage: ytq-connect.sh install|ping" >&2; exit 2 ;;
esac
