---
name: ashmark-review
description: Role skill for read-only reviewers/auditors of Ashmark code — how to look for layering conflicts, redundant or contradictory rules, state leaks and stacking effects, how to prove findings with temporary tests, and how to report them ranked and actionable without editing game code. Load after ashmark-core (and the domain skill, e.g. ashmark-battle) when asked to review, audit or find bugs.
---

# Reviewing and auditing

## Stance
Read-only: **don't edit game code or existing tests, don't commit**. You may write temporary `tests/zz_<prefix>_*.js` to *prove* a suspicion; delete them before finishing.

## What to look for (in this codebase, these are where bugs come from)
- **Several layers steering the same thing in one tick** (player orders, AI captains, unit-level AI, abilities, character fall-back, morale route/rally): a later layer silently undoing an earlier one; oscillation (orders flipping every think — look for missing hysteresis); player orders overridden.
- **Duplicate rules that disagree** (two "brace" rules, several "shaken" thresholds, run/walk decided in many places); effects that **stack or double-count** (multipliers in the damage pipeline).
- **State leaks**: notes not cleared on hand-over (Auto on/off), per-battle state surviving restarts, fields that never expire, stale targets (dead/left/routing).
- **Hidden coupling**: UI/layout affecting simulation; fingerprint fields; `Math.random` in fixture paths.
- Design-vs-code drift: README/wiki saying one thing, code doing another.

## Method
Read the README section and the code paths end to end; write down the tick order or call graph before judging; then reproduce each suspicion with the smallest lab test (see ashmark-testing). "Could be" is not a finding.

## Report format
Ranked list: severity (**bug the player can hit** / latent bug / redundancy-cleanup), `file:line`, scenario, evidence (test output or exact code reasoning), minimal suggested fix. Then a short "checked and fine" list. Keep fixes minimal and in the existing style; flag design choices for the owner instead of deciding them.
