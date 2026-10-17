---
name: ashmark-testing
description: Role skill for writing, running and maintaining Ashmark's browser test suites (prototype/tests/*) — the harness, runners, seeds, BattleLab fixtures, fingerprint (snapshot) suites and how to treat them, flaky-test hygiene, clean-worktree testing, and how to report results honestly. Load after ashmark-core whenever you write tests, run suites, or judge test results.
---

# Tests

## How suites work
- One file per suite: `prototype/tests/<name>.js` defines `window.RUN=()=>{...}` and finally appends `<pre id="OUT">` with lines `PASS <msg>`, `FAIL <msg>`, `EXC <error>`, `INFO …`, `SNAP …`. The page is `Ashmark.html?test=<name>` (`tests/harness.js` loads it; `?seed=N` seeds `Math.random`). Game globals are reached through the proxy `T` (`const t=T`; `t.B`, `t.G`, `t.P`, `t.<function>`).
- Battle fixtures: `T.BattleLab.start({leftGroups:[{type,count}],rightGroups:[…],morale:true,deploy:false,paused:true,ai:false,seed:42})`, then `L.step(n)` (n frames of 1/60 s), `t.command(1)` (run captains once), `t.moraleTick(dt)`; always `L.exit()` in `finally`.
- Determinism: seed randomness inside the test around the random part (`const r0=Math.random;Math.random=t.seeded(1234);try{…}finally{Math.random=r0}`) rather than widening thresholds.

## Running
- `prototype/tests/run-tests.ps1 -Suites a,b [-Seed 1,2,3] [-TimeoutSeconds 90]` (one headless Chrome/Edge, a tab per suite); `run-tests.sh` is the bash twin. From bash: `powershell -NoProfile -Command "& .\tests\run-tests.ps1 -Suites a,b"`.
- **Count results per line** (awk over `^PASS` / `^(FAIL|EXC|ERR)` keyed by the `== suite` header); never trust a filter that looks only at each suite's first line. Start-up race "cannot access …DevToolsActivePort" → rerun.
- Full suite (~110 suites, minutes): only when asked/approved, usually in the background.
- Someone else mid-edit? Run in a clean worktree with only your files copied in (ashmark-core).

## Fingerprint (snapshot) suites
`battlecommands`, `actorrules`, `battlesetup`, `battleresolution` hash whole states. A change there means behaviour (or a hashed field) changed. **Find out why first** (dump and diff the snapshot JSON between commits; bisect with worktrees). Re-record a hash only for a legitimate, explained change, with a comment saying why, and with the coordinator's OK. Real bugs found this way: field size depending on leftover HUD buttons.

## Writing good tests
- One focused check per behaviour; a regression test must FAIL on the old code and PASS on the new (verify by reverting or reasoning explicitly).
- Test through public behaviour (group orders, resolves, BattleControl methods), not mirrors (`u.mor`) or private timing.
- If a fixture pumps HP after spawn, keep morale out of the way (unbreakable resolve or `B.noMorale`) unless morale is the subject.
- Keep suites fast: avoid long `L.step` loops when a direct call shows the behaviour; share fixture helpers within a file.
- Temporary files `tests/zz_<prefix>_*.js`: delete before finishing; never commit.

## Reporting
Report suites as run with PASS/FAIL counts, seeds used, anything skipped or unverified, and pre-existing failures proven pre-existing (run the same suite at HEAD without your change).
