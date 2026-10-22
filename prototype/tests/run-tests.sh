#!/usr/bin/env bash
# Runs the headless test suites in Chrome or Edge and prints each suite's results.
# Usage: tests/run-tests.sh [-j N] [-s SEED] [-r N [-S]] [suite ...]   (default: every suite in tests/ except the harness and the kit)
#   -j N     run N suites at once (a browser and profile each)      -s SEED  seed Math.random (?seed=SEED)
#   -g       kept so old commands still work (adds nothing: the generated world is the only one)
#   -r N     the flake finder: each suite N times unseeded (-S: once with each seed 1..N); checks that fail in some runs, not all
#            (the native Windows runner only: run-tests.ps1 -Repeat N [-Sweep])
# After each suite: "# N pass, N fail, N.N s"; at the end "# summary: ...". Exits non-zero if any line reads FAIL, EXC or ERR.
cd "$(dirname "$0")/.." || exit 1
jobs=1 seed="" rep="" sweep=""
while getopts "j:s:gr:S" opt; do case $opt in j) jobs=$OPTARG;; s) seed=$OPTARG;; g) ;; r) rep=$OPTARG;; S) sweep=1;; *) exit 2;; esac; done; shift $((OPTIND-1))
# On Windows (Git Bash) hand over to the native runner: one DevTools-driven browser per worker with a reused profile, much
# faster than a fresh --dump-dom browser per suite. Same output and exit code. (ASHMARK_DUMP_DOM=1 keeps the path below.)
if [ -z "$ASHMARK_DUMP_DOM" ] && command -v powershell.exe >/dev/null && command -v cygpath >/dev/null; then
  args=(-Parallel "$jobs"); [ -n "$seed" ] && args+=(-Seed "$seed"); [ -n "$rep" ] && args+=(-Repeat "$rep"); [ -n "$sweep" ] && args+=(-Sweep); [ $# -gt 0 ] && args+=(-Suites "$(IFS=,; echo "$*")")
  exec powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '$(cygpath -w "$(pwd)/tests/run-tests.ps1")' ${args[*]}"
fi
[ -n "$rep" ] && { echo "-r (the flake finder) needs the native Windows runner (run-tests.ps1 -Repeat)."; exit 2; }
browser=""
for b in "/c/Program Files/Google/Chrome/Application/chrome.exe" "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
         "$(command -v google-chrome 2>/dev/null)" "$(command -v chromium 2>/dev/null)"; do
  [ -n "$b" ] && [ -x "$b" ] && browser="$b" && break
done
[ -z "$browser" ] && { echo "No Chrome or Edge found."; exit 1; }
page="$(pwd)/Ashmark.html"; command -v cygpath >/dev/null && page="$(cygpath -m "$page")"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
suites=("$@"); [ ${#suites[@]} -eq 0 ] && for f in tests/*.js; do n=$(basename "$f" .js); [ "$n" != harness ] && [ "$n" != kit ] && suites+=("$n"); done
query=""; [ -n "$seed" ] && query="&seed=$seed"
now() { date +%s%3N; }
run_one() { # index suite slot: writes $work/<index>.out, then <index>.ms (a profile per slot, reused: a new one is slow to start)
  local i=$1 s=$2 t0 out; t0=$(now)
  out=$("$browser" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files --user-data-dir="$work/profile$3" \
        --virtual-time-budget=15000 --dump-dom "file:///$page?test=$s$query" 2>/dev/null \
        | sed -n '/<pre id="OUT">/,/<\/pre>/p' | sed 's/.*<pre id="OUT">//;s#</pre>.*##;s/&gt;/>/g;s/&lt;/</g;s/&amp;/\&/g')
  [ -z "$out" ] && out="FAIL no output (the page or suite did not load)"
  printf '%s\n' "$out" > "$work/$i.out"; echo $(( $(now)-t0 )) > "$work/$i.ms"
}
bad=0 pass=0 fail=0 total=0 next=0 failing="" start=$(now)
flush() { # print finished suites in order
  while [ $next -lt ${#suites[@]} ] && [ -f "$work/$next.ms" ]; do
    local out p f ms; out=$(cat "$work/$next.out"); ms=$(cat "$work/$next.ms")
    echo "== ${suites[$next]}"; [ -n "$seed" ] && echo "# seed=$seed"; echo "$out"
    p=$(grep -cE '^PASS( |$)' <<<"$out"); f=$(grep -cE '^(FAIL|EXC|ERR)( |$)' <<<"$out")
    echo "# $p pass, $f fail, $((ms/1000)).$((ms%1000/100)) s"
    pass=$((pass+p)); fail=$((fail+f)); total=$((total+ms)); [ "$f" -gt 0 ] && { bad=1; failing="$failing ${suites[$next]}"; }
    next=$((next+1))
  done
}
declare -A slotOf; free=(); for ((k=0;k<jobs;k++)); do free+=("$k"); done
for i in "${!suites[@]}"; do
  while [ ${#free[@]} -eq 0 ]; do  # wait for a browser to finish and take its profile slot back
    wait -n 2>/dev/null || sleep .2
    for pid in "${!slotOf[@]}"; do kill -0 "$pid" 2>/dev/null || { free+=("${slotOf[$pid]}"); unset "slotOf[$pid]"; }; done
    flush
  done
  slot=${free[0]}; free=("${free[@]:1}")
  run_one "$i" "${suites[$i]}" "$slot" & slotOf[$!]=$slot
done
wait; flush
wall=$(( $(now)-start ))
echo "# summary: ${#suites[@]} suites, $pass pass, $fail fail, suites $((total/1000)) s, wall $((wall/1000)) s, $jobs browser(s)"
[ -n "$failing" ] && echo "# failing:$failing"
exit $bad
