---
name: ashmark-core
description: Shared ground rules for ANY agent working on the Ashmark game (Nameless/prototype) — what the game is, how the code is laid out, the owner's standing rules, code style, how to run tests and the file-ownership protocol. Load this first, before any role skill (ashmark-battle, ashmark-world, ashmark-ui, ashmark-art, ashmark-testing, ashmark-review, ashmark-coordinator).
---

# Ashmark — shared picture for every agent

## What it is
A 2D pixel-art sandbox warband RPG (Mount & Blade-like campaign + Total War-style real-time battles), played full-screen in the browser on desktop and phones held sideways. **Plain HTML5 canvas + JavaScript, no build step, no modules, no npm**: global `<script>` files loaded by `prototype/Ashmark.html` (and the same list by `prototype/wiki.html`, the in-game wiki). It is usually opened from `file://`. Engine choice is settled: stay on plain JS/canvas (don't propose Godot/Phaser/C++ unless asked).

## Where things are (`Nameless/`)
- `prototype/` — the game. `README.md` here is the technical reference: read the sections for your area before designing anything.
  - `js/core/` state, session, save (`save.js`), army/roster/recruitment, talents, equipment.
  - `js/data/` tables (units, monsters, abilities, gear, factions, places…). Data stays as JS tables (JSON loading from `file://` is deferred).
  - `js/battle/` battles (see skill ashmark-battle).
  - `js/world/` campaign map, parties, brains, economy, sites, estates (see ashmark-world).
  - `js/gfx/` code-drawn pixel art and rendering (see ashmark-art); `js/ui/` HUD, windows, input (see ashmark-ui); `js/scene/` walkable town scenes.
  - `tests/` one browser suite per file + `tests/visual/` screenshot/timing pages (see ashmark-testing).
- `engine/` PX pixel generators (buildings, pieces). `doc/` design docs: `IMPLEMENTATION_PLAN.md` (work queue, decisions), `KNOWLEDGE_TRANSFER.md`, the Game Feature Plan.

## Owner's standing rules (do not break)
- **Commit only when the owner (or the coordinator on the owner's behalf) asks.** Never reset/stash/checkout/clean other people's work; never push.
- **Saves are schema v2 only — no backward compatibility, no migration code.** If a save shape must change, stop and report; the owner decides on a version bump.
- **Art needs the owner's approval** from screenshots before it is committed (ashmark-art).
- **Window frame rule:** every window = header, content (game info and choices only), bottom bar built with `nav(back, close)`; Esc follows it.
- **Deferred items** in `doc/IMPLEMENTATION_PLAN.md` ("Deferred") are not started without the owner. Don't resume paused redesigns or refactors unasked.
- Classes for behaviour, **plain JSON in saves**. Avoid over-engineering: prefer the smallest change that fits the existing pattern.
- Don't run the **full** test suite unless asked or approved; run the suites for what you touched.

## Code style (match the surrounding code)
- Terse, dense, one-line-heavy JS with short **parenthetical comments** explaining intent, as in the files around you. Tuning values live in one named const per system (e.g. `MORALE`, `UNIT_AI`, `AI_TACTICS`, `CALLOUT`) with a comment line describing each key.
- **Never put code after a mid-line `//` comment** (it silently disappears); use `/* */` for inline comments before code.
- No new `Math.random()` in simulation paths that tests fingerprint (use the seeded RNG `seeded(n)` where randomness is required and tests need determinism).
- Globals are shared across files: grep before adding a name (`tests/structure.js` checks for duplicates and that both HTML entry points load the same scripts).
- UI text is plain, player-facing English; Arial-first UI font; CSS tokens in `style.css`.

## Running tests (Windows)
From `prototype/`: `.\tests\run-tests.ps1 -Suites a,b` (PowerShell) or from bash `powershell -NoProfile -Command "& .\tests\run-tests.ps1 -Suites a,b -Seed 1,2"` (comma list needs `-Command`, not `-File`). Output: `== suite` then lines starting `PASS`/`FAIL`/`EXC`/`ERR`/`INFO`. **Count per line** — a suite prints a multi-line block, so a first-line-only filter hides failures. A start-up error "cannot access …DevToolsActivePort" is a harmless race: rerun. Details: ashmark-testing.

## Working alongside other agents
- You get a **file-ownership list** in your brief: edit only those files. If a fix needs another file, report the exact change instead.
- If someone else's in-progress edit breaks loading (e.g. `isChar is not defined`), test in a **clean worktree**: `git worktree add --detach <scratchpad>/wt-x HEAD`, copy your changed files in, run there, then `git worktree remove --force` it.
- Temporary test files use your brief's prefix (`tests/zz_<prefix>_*.js`) and must be deleted before you finish. Never commit them.
- Report back: what changed per file, tests actually run (suite → PASS/FAIL counts), anything unverified, risks, and doc text for README/wiki (the coordinator usually edits docs).
