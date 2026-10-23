# Rules for every agent working on Ashmark (the owner's, all strict)

For every coding agent (Claude Code's sub-agents, Codex or any other): read this before you start. The coordinator (Claude Code's main session) merges, runs the one full test sweep and pushes.

Project: Ashmark, a medieval Mount & Blade-like game in plain JS/canvas (no bundler; every file is a `<script>` tag, in order). The repo is `F:/Game Project/Nameless`; the game is in `prototype/`.

## Where you work
- Work **only** in your own git worktree or branch (its path or name is in your brief). Never change the main working tree `F:/Game Project/Nameless` directly, and never touch another agent's worktree.
- **Never push, and never commit to `battle-rts-and-world`** (the main branch). Claude Code's sub-agents don't commit at all.
- When done, export your work from the worktree root: `git add -N . && git diff HEAD > ../<name>.patch` (`diff HEAD`, so deleted files are included). Then report.
- **Never touch any `demos/` folder** (the owner's own, untracked): not in diffs, stashes (`-u`), `add -A` or patches.
- **Never commit `doc/references/` or `doc/assets/`** (the owner's own references; gitignored), nor any file the owner has staged.

### For agents outside Claude Code's worktrees (Codex and others)
- Start from the latest `battle-rts-and-world`, in your own worktree or a branch named `codex/<task>` (or `<agent>/<task>`).
- You may commit on your own branch. Never push to `battle-rts-and-world`, never rebase or force-push it.
- Before starting, check which files other agents are working on (ask the owner or the coordinator), and keep to your brief's files.
- Hand back the branch name (or a patch made as above) with the report below; the coordinator merges it, re-measures fingerprints if main moved, and runs the full sweep.

## Files
- Edit only your brief's "may edit" list. If you truly need a line in a file you don't own, don't edit it: say so in your report.
- You may add `<script>` tags in `prototype/Ashmark.html` **and** `prototype/wiki.html` for your own new files only. Use the same position in both files, which `tests/structure.js` checks. Respect its load-order rules: core first, then all `data/`, then the rest; the generator's world files stay consecutive.
- **Line endings:** files are CRLF in the working tree; keep them so.
  - Don't use `sed -i` in Git Bash (it strips CRs).
  - Edit with an edit tool that keeps line endings, or with Python scripts written to a temp folder outside the repo (never an unquoted shell heredoc: backticks run as commands). Open files with `newline=''` and write `\r\n`.
  - Test files may be LF; match each file's own endings.

## Code style
- Match the surrounding code: its terse style, comment density and naming (short "what it is" header comments).
- **Clean OOP, no over-engineering.**
  - Use classes where they give state an owner or remove branching.
  - Tables stay plain data in one tunables table, so numbers are easy to change.
  - Pure helpers stay functions.
- **Refactor first:** if your feature needs a refactor, do it first, behaviour-preserving (fingerprints unchanged), then build on it.
- Never put a `//` comment in the middle of a one-line function.
- Canvas transforms go inside `save()`/`restore()`.
- **No `Math.random` in the generator** (`world/worldsettings.js`, `worldgen.js`, `worldplace.js`): seeded streams only. `structure` checks this.
- Story and content code draws from the named streams (`rngOf(name)`, `core/rng.js`); the simulation, AI and battles use `Math.random`.
- **Saves:** no migration of old saves. New fields get defaults on load (`core/saves.js` `Saves.add` with `defaults`, or the envelope in `core/save.js`).

## UI
- Every window follows the frame rule:
  - a header;
  - content made only of game choices;
  - a bottom bar built with `nav()`, Back on the left and the way out on the right;
  - Esc follows the bottom bar.
- Arial UI font; the target is a phone in landscape (844×390) as well as desktop; organized `style.css` sections.
- Additional suggestions can be provided if need a diffrent UI structure.

## The shared parts (use them, don't re-invent)
- **Systems registry** (`core/systems.js` `Systems.add({name, order:{day|hour|frame}, ...})`): frame, hour and day work. `tests/structure.js` pins the order; add your system's name there if you own that file, else report it.
- **Saves registry** (`core/saves.js` `Saves.add({key, order, save, load, defaults})`).
- **Time:** `Clock` (`core/clock.js`), which calls `Systems.hour(h)` each new hour.
- **Timed states:** `Timed`.
- **Events:** the world bus, `worldOn`/`worldEmit` (`core/bus.js`).
- **Nearest holding and distances:** `Spatial`.
- **Tests:** the test kit (`tests/kit.js`).
- **Story choices and pages:** `Choice`/`ChoicePage` (`story/choice.js`), and outcomes (`story/outcome.js`).

## Where things live now
`doc/WORLD_DESIGN.md` §15.2's "Where things live today" table is older than these changes:
- **Holdings:** `makeHolding`, `setHoldings`, `setCamps`, `TOWNS`, `HOME`, `MADE_HOLDINGS`, `Holding.saveRec`/`loadRec`/`fromRec` and `HoldingObject` are in `world/holding.js`. `data/holdings.js` keeps only `HOLDING_TYPES`. `Buildings` is in `world/buildings.js`; the estate's window is in `ui/estate.js`.
- **Encounters:**
  - `battle/engage.js` (was `battle/encounters.js`): going into a fight. Power and stance, `startEncounter`, `fleeOdds`, `autoResolve`, `ON_WIN`, `bridgeNear`, `coverAt`.
  - `world/road.js`: the road's encounters, when and where.
  - `world/encounters.js`: the encounter kinds.
  - `data/encounters.js`: their numbers.
  - `gfx/encounterscene.js`: their drawing.
  - `story/encounter.js`: the `Encounter` shape.
- **Newer parts (2026-10-22/23):**
  - **One world:** the generated world (`world/worldgen.js`, `worldplace.js`); today's hand-made map was deleted (D49).
  - **Buildings:** models in `engine/buildmodels.js` (the core) and one style file per culture: `engine/build-vale.js` (Vale and Salt League), `build-karn.js`, `build-ashgor.js`, `build-sylvan.js` (`PX.registerBuildStyle`; "A culture's buildings" in `engine/README.md`). Drawn on the map by `gfx/structures.js` and `world/lots.js`. `engine/buildings.js` is gone.
  - **Roads:** `world/roadband.js` (`RoadBand`, `ROAD_BAND`): speed by distance to the drawn road.
  - **Story:** `Encounter#finish(how)` is every encounter's one ending; `world/escort.js` (`EscortQuest`, the `passenger` outcome).
  - **Battle:** `battle/movesets.js` (`MOVESETS`: hard attacks and charges are the only knockdowns).
  - **Sites:** hideouts deep in the wilds (`world/sites.js` `HIDEOUT_PLACE`, `HIDEOUT_BAND`).
  - **Designs not built yet:** `doc/CAMPS_DESIGN.md` (mobile camps and beast dens), `doc/CONTINENTS_DESIGN.md` (held).
- **Other moves:** `gfx/scene.js` is now `gfx/scenedraw.js`. `WorldObject` is in `world/worldobject.js`. `StoryPlace` is in `story/storyplace.js`.
- **Battle code is classes now** (waves E1–E3):
  - **Terrain:** `BattleTerrain` (that is `B.terrain`), `TerrainRoutes`, `BattleSight`, `FieldPlan`, `BattleRiver`, `FieldWays` (`battle/terrain.js`; doc/TERRAIN_DESIGN.md §8 "Classes as built", including **World Phase 2's slots**: `BattleTerrain.riverOf`, `BattleRiver.half`, `BattleRiver.kinds`, `FieldPlan#planFeatures`, `BattleTerrain#slopeMul`, `routeGridOf` under `TerrainRoutes#build`).
  - **Commanders and minds:** `Commander`/`EnemyCommander` (`commander.js`), `CharacterMind` (`charmind.js`), `PackMind` (`beastmind.js`).
  - **Combat:** `HeroHands` (`combat.js`), `Actor`/`CharActor`/`HeroActor` (`actors.js`), `Fighter` (`attacks.js`), `Missile` (`projectiles.js`).
  - Old names stay as one-line aliases.
  - Some names are called by their global name on purpose, because tests replace them: `command`, `posture`, `beatenArmy`, `captainBeasts`. Keep calling them that way.
- **Replacing a global in a test:** the test kit's `T` proxy only reads globals. To replace a global function in a test, assign `window.name = …` and restore it in a `finally`.

## Tests (the owner's PC: be gentle)
- Run from `prototype/`: `powershell -NoProfile -Command "& .\tests\run-tests.ps1 -Suites a,b -Parallel 2 -TimeoutSeconds 240"`.
  - **Always `-Parallel 2`** (the owner, 2026-10-22; was 1). There is one world now (the generated one; today's hand-made map was deleted 2026-10-22, D49): no `-Gen` or `-Classic` needed. Use `-Seed n` / `-Repeat n` as needed.
- **Targeted suites only. Never the full sweep** (the owner: one full sweep per batch, run by the coordinator after merging).
- **The runner closes its own browsers.** Never kill Chrome processes yourself.
- **Fingerprints must hold unless your brief says otherwise:**
  - `worldprint -Seed 1` (W1–W8);
  - the battle suites `actorrules,attackrules,battlecommands,battleresolution,battlesetup` plus `aishare`;
  - `rts -Seed 1,2,44`.
  - A re-record needs a written reason for each value, and only where your brief allows one.
- Add tests for what you build, as new suites or in the matching suite, in the existing style.

## Docs
- Update the status in your design doc's section, and `prototype/README.md` (the file map and the section about your part), in the house style: plain, short, specific.

## Report
- **Patch:** its path.
- **Changes:** what you built and the files changed.
- **Tests:** what you ran and the pass/fail numbers.
- **Fingerprints:** whether they held. Any re-record, with its reason.
- **Line requests:** anything you need in files you don't own.
- **Choices:** decisions you made that the owner should know about.
- **Left:** what's still to do.
