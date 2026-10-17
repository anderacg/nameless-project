---
name: ashmark-battle
description: Role skill for agents changing Ashmark's real-time battles (prototype/js/battle/*) — the layered architecture (orders, AI captains, group morale, actors, effects), tick order, group-level morale/targeting, abilities, AI tactics, the lab, fingerprint tests and known pitfalls. Load after ashmark-core whenever a task touches battle code, battle balance or battle AI.
---

# Battles — how they work and how not to break them

Read `prototype/README.md` battle sections first (Group morale…, Unit-level AI morale, AI tactics, Unit abilities, Battle feedback, Touch controls, Withdrawal).

## Model: Total War-style, group-first
- A **group** (`B.groups[id]`, class `BattleControl` in `battlecontrol.js`) is the unit you command. Soldiers (`B.units`) only *act*: pick an opponent, move to a slot, strike, shoot, flee. Player and AI give orders through the **same BattleControl methods** (`moveTo, attack, hold, charge, advance, withdraw, standAt, setForm, setFlag, setRun, useAbility`); all return early when the group is routed.
- **Group-owned state:** facing (`currentFacing`), the attack target (a *formation*, `targetGroupId`; soldiers choose opponents inside it, `orderedTarget`), and **morale** (`BattleResolve` at `g.resolve`, `morale.js`). Soldier fields `u.mor`, `u.rout`, `u.confidence`… are **mirrors** written by `sync()` — writing them does nothing. Use `resolveOf(u)` / `r.mor`, `r.routed`, `r.state`.
- Heroes, companions, lords, chieftains and beasts are `steady` (no resolve, never rout). Characters (`isChar`) use the character mind in `commander.js` (`charAuto`, `charBasics`, `chooseAbility`).
- Per-soldier stays per-soldier: HP, armour, shields, ammo, stamina.

## One tick (`updateBattle`, battle.js)
1. hero (`charAuto` incl. fall-back) → 2. every `BattleControl.step` (calls `abilityStep` first) → 3. `command(dt)` every 0.5 s: `captain(1)`+`captainFinish(1)`, allies, your army only if `B.auto` → 4. `commandCharacters` (fall-back look, duels, skills) → 5. actors `aiUnit` → 6. projectiles → 7. `moraleTick` (route/rally, neighbour shocks applied after all decisions).
Know this order before adding logic: a later layer can undo an earlier one in the same tick.

## Layers and who may touch what
- **Orders/control:** `commands.js` (player entry points; they must `takeCommand()` and bump `orderSeq` via `ordered()`), `deploy.js` (`setAuto`), `battlecontrol.js` (`aiReset` clears all `AI_NOTES`).
- **AI captains:** `commander.js` — army fall-back (`beatenArmy`), unit-level morale AI (`UNIT_AI`: pull-back of *unengaged* wavering infantry, plug, shaken cavalry gate `into()`), tactics (`AI_TACTICS`: ranged posture `rangedMode`, stamina-gated runs `runFor`, ability use), character fall-back (`CHAR_FALL`), posture with hysteresis (`FOE_CMD.hold`, per-captain `B.post[ck]`). Withdrawing groups are skipped by captains.
- **Actors/effects:** `actors.js` (targeting, movement, shooting), `attacks.js` (damage pipeline), `morale.js` (resolve, flank/charge/brace, rout/withdraw), `formations.js` (shield wall, wedge, depth, line ghost), `fatigue.js`, `projectiles.js`, `unitabilities.js` (Brace/Fire/Spur/Rally registry + hooks that multiply by exactly 1 when inactive), `abilities.js` (character skills; `abilityFoes` restricts aimed/moving skills to the ordered formation for your characters).
- **Lab:** `lab.js` (`BattleLab.start({leftGroups,rightGroups,morale,deploy,paused,ai,seed})`, `step(n)` = n frames of 1/60 s) for experiments and tests; `developer.js` dev console.

## Rules that bite
- **Fingerprint tests** (`battlecommands`, `actorrules`, `battlesetup`, `battleresolution`) hash whole states. Don't add enumerable fields to groups/units casually (use non-enumerable props or delete-not-null for AI notes), don't add `Math.random()` calls to fixture paths, and never "fix" a hash by re-recording without explaining *why* the behaviour legitimately changed (and get the coordinator's OK).
- Layout leaks into simulation: `measureField` sizes the field from the HUD (ability buttons are excluded). Don't let UI state change battle setup.
- Balance is measured, not guessed: use `tests/moraleaudit.js` INFO lines and lab runs over several seeds. Current reference (2026-10-17): equal infantry routs ~46–49% losses ~8 s; knights ~61–68% ~19–23 s; Footmen v Berserkers ~3.3 s.
- Player control is sacred: with `B.auto` off no AI path may order the player's groups; your characters under an attack order keep it (no self-defence retarget, skills aim at the ordered formation).
- Tests that pump enemy HP after spawn should also make their morale unbreakable (group wounds are measured against starting HP), or use `B.noMorale` when morale isn't under test.

## Must-run suites for battle changes
`rts` (also `-Seed 1,2`), `groupmorale`, `unitmorale`, `moraleaudit`, `moralebalance`, `aitactics`, `charfallback`, `controlaudit`, `effectaudit`, `unitabilities`, `battlejuice`, `grouptargeting`, `withdrawal`, `battlecommands`, `actorrules`, `battlesetup`, `battleresolution`, `monsters`, `structure` — plus anything your change touches.
