#!/usr/bin/env bash
# Runs the headless test suites in Chrome or Edge and prints each suite's results.
# Usage: tests/run-tests.sh [suite ...]   (default: every suite in tests/ except the harness)
# Exits non-zero if any line reads FAIL, EXC or ERR.
cd "$(dirname "$0")/.." || exit 1
browser=""
for b in "/c/Program Files/Google/Chrome/Application/chrome.exe" "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
         "$(command -v google-chrome 2>/dev/null)" "$(command -v chromium 2>/dev/null)"; do
  [ -n "$b" ] && [ -x "$b" ] && browser="$b" && break
done
[ -z "$browser" ] && { echo "No Chrome or Edge found."; exit 1; }
page="$(pwd)/Ashmark.html"; command -v cygpath >/dev/null && page="$(cygpath -m "$page")"
profile="$(mktemp -d)"; trap 'rm -rf "$profile"' EXIT
suites=("$@"); [ ${#suites[@]} -eq 0 ] && for f in tests/*.js; do n=$(basename "$f" .js); [ "$n" != harness ] && suites+=("$n"); done
bad=0
for s in "${suites[@]}"; do
  echo "== $s"
  out=$("$browser" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files --user-data-dir="$profile" \
        --virtual-time-budget=15000 --dump-dom "file:///$page?test=$s" 2>/dev/null \
        | sed -n '/<pre id="OUT">/,/<\/pre>/p' | sed 's/.*<pre id="OUT">//;s#</pre>.*##;s/&gt;/>/g;s/&lt;/</g;s/&amp;/\&/g')
  [ -z "$out" ] && out="FAIL no output (the page or suite did not load)"
  echo "$out"
  echo "$out" | grep -qE '^(FAIL|EXC|ERR)' && bad=1
done
exit $bad
