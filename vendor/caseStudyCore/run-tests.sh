#!/usr/bin/env bash
# Case Study Core: run everything. Exit code 0 only if all of it passes.
#
#   1. Node tests   (every fixture through core/js)
#   2. PHP tests    (every fixture through core/php)
#   3. Cross-check  (both implementations write their results for every
#                    fixture; the two sets must be identical byte for byte)
#
# Needs node >= 18 and php >= 7.4 on PATH. No install step, no network.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "== versions =="
node --version
php --version | head -n 1

echo
echo "== 1. Node tests =="
(cd "$here/js" && node --test test/run.js)

echo
echo "== 2. PHP tests =="
for file in "$here"/php/src/*.php "$here"/php/tests/*.php "$here"/php/tools/*.php; do
  php -l "$file" > /dev/null
done
php "$here/php/tests/run.php"

echo
echo "== 3. Cross-check: Node and PHP output, byte for byte =="
node "$here/js/tools/emit.js" "$work/js"
php "$here/php/tools/emit.php" "$work/php"
if diff -r "$work/js" "$work/php"; then
  echo "identical: $(ls "$work/js" | wc -l | tr -d ' ') files"
else
  echo "FAILED: the two implementations disagree (differences above)"
  exit 1
fi

echo
echo "All Case Study Core checks passed."
