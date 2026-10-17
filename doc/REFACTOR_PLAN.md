# Ashmark — Refactor Plan (code-structure review, 2026-10-17)

From a read-only review of the prototype at commit 4d24715 (99 scripts, ~11.5k dense lines, 1.18 MB). The OOP direction is sound — `BattleControl` is the single order API for player and AI, `BattleResolve` owns group morale, `Party`/`Brain` subclasses, holdings and sites rebuilt from plain JSON — so this plan fixes concentrated debt only. **No over-engineering:** plain JS, global scripts, no build step, plain-JSON v2 saves, terse house style are deliberate constraints.

## Owner decisions (2026-10-17)
- **Wave 1 approved:** items 1–8 below, after the test-suite cleanup lands.
- **Fall-back ending:** every player order to a group ends a character's fall-back — moves, attacks, Hold, pace (including the R key), formations and flags — **but not using a unit ability**.

## A. Do now (wave 1) — **done 2026-10-17** (commits 3859184, 9ed0d7d, f8045a1 and the captain/charmind split)
| # | Refactor | Problem | Change | Effort |
|---|---|---|---|---|
| 1 | Split `commander.js` | Character mind (lines ~1–173: `CHAR_AI`, `charAuto`, `charBasics`, `CHAR_FALL`, `commandCharacters`) and army captains (~175–520) in one 59 KB file | Pure move of the character mind to a new `js/battle/characters.js` (loaded before commander.js in both HTML files) | S |
| 2 | Break up `captain()` | 23 KB / 184-line closure; captain memory spread over `B.post/plan/idle/vol/commit/rmode` (reset list duplicated in deploy.js); `assess`/`captainGroups` computed twice per think | One memory object per captain `B.captains[ck]`; shared context built once; per-arm steps `captainInf/Shooters/Cav/Hero` in the same call order; fold in geometry helpers (#14) | M |
| 3 | Simulation must not refresh the HUD | `moraleTick` calls `setOrderUI()`; `abilityStep` calls `bhudAbilities()` | Refresh on the HUD clock (main loop / `drawBattle`); tests that read cards right after `step()` call `setOrderUI()` explicitly | S |
| 4 | One morale-state helper | `refreshState` (waver + literal 60) and `grpMorale` mixed path (literals .3/.6) can disagree | `MORALE.shaken:60` + `moraleStateOf(mor)` used by both | S |
| 5 | Morale presentation out of morale.js | ~12 KB of badges/icons/drawing/picking inside the simulation file | Pure move to `js/ui/moraleicons.js` (loaded after morale.js) | S |
| 6 | One path for player orders | `toggleFlag`/`setForm`/`groupAbility` don't count orders; R-key pace doesn't end a fall-back while Advance/Charge do | `playerOrder(gs, fn, {counts})` helper; counts per the owner decision above; remove unused `SHOOT_FLAGS` | S |
| 7 | Dead code | Unused `VAR_TINT`, `POSES`, `QUEST_KINDS`, `SHOOT_FLAGS`; `troopsOf` branches identical; unreachable `cull` branch; error-swallowing `try{partyRemove…}catch{}` in resolution.js | Remove; replace the catch with an explicit guard | S |
| 8 | Guard `AI_NOTES` drift | A per-group AI note missing from `AI_NOTES` leaks across Auto hand-over | Static check in `tests/structure.js` comparing `g.<name>=` writes in commander.js with `AI_NOTES` | S |

Parallel split (no file overlap): **A** items 1+2 (commander.js, new characters.js, deploy.js, both HTML script lists — B reports its script line to A); **B** items 3–5 (morale.js, unitabilities.js, new moraleicons.js, HUD clock in main.js/render.js); **C** item 6 (commands.js, input.js if needed); **D** item 7 (sprites.js, quests.js, fights.js, realms.js, resolution.js); item 8 by whoever owns tests/structure.js.

## B. Do when touching the area
9. **`WorldObject` base** (plan 5.2) — **step 1 (parties, caravans) done 2026-10-17**; next: holdings/estates/sites/movers, then `tipFor` → `tip()` methods: five parallel per-kind switch sites (`drawWorld`, `pickAt`, `objKind`→`interact`/`tipFor`/chase, `partyKind`, visibility rule ×3, `estatePick` stand-in) → base with `kind`, `inView`, `pick`, `tip`, `meet`, `draw`, `mapDot` and a `worldObjects()` iterator; incremental (parties → sites → estates → movers); saves stay plain JSON.
10. **Party polymorphism** (`kind` getter, `power()` replacing `rating/bandPower/cpPower` — note `bandPower` silently generates troops — `label()`, faction), then remove compatibility wrappers (`partyAdd/Remove/Transfer*`, `canEnter/lordEnter/lordLeave`, `caravanMeet/caravanLoot/seizeCaravan`, `siteKnown/siteClear/stockTravelers`, `BandParty.list`, `champSkill`, `brainOf`, defensive `asParty` at use sites) with the test agent. `partyClassOf` infers class from field shape; an explicit saved kind would change the save shape (owner's call).
11. **Battle event hook** with battle-fun "juice": `battleEvent(type,data)` + listeners (HUD callouts, lab telemetry) instead of direct `callout*`/`BattleLab.event` calls in simulation code and HUD polling of `B.fallBack`.
12. **(Done 2026-10-17)** **Town actions** out of `input.js` `act()` into `town.js` `townAct` (keep action names).
13. **Readable battle tick:** extract `pushApart`, `keepOffObstacles`, `checkBattleOver` from `updateBattle` (same order).
14. **Geometry helpers** `centroid`, `edgeGap`, `reachOf` (≈15/10/7 inline copies) — same arithmetic order so fingerprints hold.
15. **(Done 2026-10-17)** Drop ~45 defensive `W.x||[]` guards (all lists exist after `makeWorldState`).
16. **(Done 2026-10-17)** One `PREFS` settings table (8 copy-pasted localStorage IIFEs + act lines).
17. **(Done 2026-10-17)** `G.youAttack` set/cleared with `setTimeout` → `try/finally` around `interact`.
18. Later, with the test agent: retire per-soldier morale mirrors (`sync()` writes 12 fields/tick; only resolution.js reads them in game code), re-recording fingerprints with a stated reason.

## C. Don't do
ECS/component split for soldiers; an AI state-machine framework (at most a `setPhase` helper); command objects/undo; a `G.mode` state machine (fold only with the "two Esc mechanisms" debt item); moving world windows into `js/ui/`; renaming vocabularies; splitting `aiUnit`; an explicit saved party kind (save shape — owner's call); a mid-line `//` structure test (no live cases); reformatting, modules, a build step or JSON data.
