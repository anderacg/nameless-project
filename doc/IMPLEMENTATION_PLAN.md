# Ashmark — Implementation Plan

This is the work queue as of **2026-10-19** (HEAD 7324310), checked item by item against the code, the tests and the git history. It opens with where things stand and **one ordered list of everything open, across all the design docs**; sections 0–10 below are the detail behind it, each item with its status. For how the code works and the owner's rules, read [KNOWLEDGE_TRANSFER.md](KNOWLEDGE_TRANSFER.md) first.

**How to use this plan**
- Take items in the order of **Priorities** unless the owner picks another.
- Agree a numbered set of steps with the owner before building a big item.
- After each step, show screenshots (1600×900 and 844×390) and test results, then check in.
- Items under **Deferred** are not to be started until the owner asks; items marked *waits for the owner* need a decision, an approval or a go first.
- **Who owns an item:** where a design doc tracks an item in detail, the doc is its owner and this plan points to it (world phases → [WORLD_DESIGN.md](WORLD_DESIGN.md) §15; terrain → [TERRAIN_DESIGN.md](TERRAIN_DESIGN.md) §8; encounters → [ENCOUNTERS_DESIGN.md](ENCOUNTERS_DESIGN.md) §5; supplies → [SUPPLY_DESIGN.md](SUPPLY_DESIGN.md); refactors → [REFACTOR_PLAN.md](REFACTOR_PLAN.md)). Everything else is owned here.

---

## Where things stand (2026-10-19)

**Built since 2026-10-14** (the details are in each section and design doc):
- **2026-10-14 to 10-16:** 16-px template people for battle, map and townsfolk; damage types and armour classes; the full-screen UI and window frame; the estate workers' routine (all in 3fb204d).
- **2026-10-17:** group-based battles (7ea6fc0); unit abilities (b81c21f); battle juice (f432976); unit-level AI morale (4a20c89); touch controls and mobile polish (39c4785, 8f01013); AI tactics and race temperaments (26cbea5, 11e16af); refactor wave 1 (3859184, 9ed0d7d, f8045a1, da077f5); caravans as a Party and the `WorldObject` base (4d24715, 3c12197, a45e60b); party polymorphism (963628d); the battle spatial grid (c41d982); terrain phases 1–2 and the route library (0b6cde6, d208962, d3e9234); the flaky tests steadied (10b925e, 460c917, 79d8770, 58b6526).
- **2026-10-18:** terrain AI, phases 3–4 and battle types (9038878, e527d86); synthesised sound and generative music (4796112; the recorded soundscape was reverted, 9b5503d); fog of war in battle, field sizes and variety, commander powers, world nature art (3f24f1d); beast pack tactics (45ccdb3); the world design approved (0a42712); **world Phase 0** complete (b94cbe2 → 328f892) and **Phase 1** (f08c720); world-map depth sorting (08f93f6); **building redesign stage 1** (889b0c5); **Phase 2 wave 0** (855ca1a).
- **2026-10-19:** smooth map movement (9304b06); **Phase 2 wave 1** behind `WORLD.gen` (2ed6578); battle physics (da78db0); hand groups to the AI and attack-move (c6985e6), the AI button in the COMMAND panel (6e5c7fd); place rails, the people drawer and single-page sites, scout and parley (adfcf2d, b6d4bb1, 8ecb177, adb14da); robbing villagers, ruins occupants and Insight (980033f); field work and estate guards (a3458b4, 18a4926); two watches (d24621e); **map encounters** phases 1 and 2 and part of 4 (17224a0, 8f1c621, 937ca04), with stat checks (8f072a3), strayed sheep (19c0cae), the gamblers' cap (da995ab), the healed traveller (51841e8), nothing ending in sight (7c895f0) and the sound-wave highlights (3baad24, aed29cd, b3560c5); **the land defended** (e5bca02, 7638472); the Woodcraft skill (6b911d6, c8d8ea9); the forest fade on the map (1f4f2dd, 0.3 in 5fa658b); wild game in its woods (a1c79a2, be9cb52, 6b2dde9, 56f7e97); the speed button relabelled "8×" (608b9f2); fixes for holding walls after a load (46b2fd9) and battle tile seams (37c31ad). The travel supplies design is written (a674aab), not started.

**Half-done:**
- **The world, Phase 2:** waves 0–1 built behind `WORLD.gen`; waves 2–4 wait for the owner's go; R12's daily-job slicing, left over from Phase 0, rides with wave 2.
- **Encounters:** phases 1–2 built, phase 4 in part (the letter, the lure, real shrines); phase 3's props and the rest of phase 4 open; 1 of the 8 small encounters built.
- **Terrain phases 3–4:** built, and the AI is bound by sight; the owner's art approval is not recorded.
- **Building redesign:** stage 1 of 4 built.
- **World OOP:** estates are classes; lots (placed buildings) and deposits are still plain records.
- **Mobile:** playable by touch; never checked on a real phone.

---

## Priorities (everything open, in order)

Sizes: **S** a session or less, **M** a few sessions, **L** a phase of its own. *Owner* means it waits for the owner (a decision, an approval or a go).

**1. Fix what is broken or half-done**

| # | Item | Size | Depends on | Owner? | Detail |
|---|---|---|---|---|---|
| 1 | **A failed save says "Game saved."** The pause menu's save (`ui.js` `esc-save`) shows success whatever `saveGame` did; still so at HEAD. *Moved up: a player can lose a game believing it saved.* | S | — | — | [UX_UI_REVIEW.md](UX_UI_REVIEW.md) UX-01 |
| 2 | **Flaky tests:** `monsters` "spiders web your fighters" (unseeded); the encounters' chance-based phase-2 checks (steadied in 937ca04 and 8f072a3: confirm); `mappolish` (reran clean, 5949c93). Seed or fix what the assertions hang on | S | the coordinator's next full sweep, to know which still flake | — | Technical debt |
| 3 | **Terrain phases 3–4: the art approval** (standing trees, cliff faces, mountains, spires, ramps). The AI sight filter is **built** (e527d86, 3f24f1d: `commander.js` `seenBy`, `charmind.js` `liveFoes`); only the approval is open | S | screenshots | **Owner** (approval) | [TERRAIN_DESIGN.md](TERRAIN_DESIGN.md) §8 |
| 4 | **Woods see-through in battle** | S | — | — | §3.5 |
| 5 | **An outline on your selected groups** | S | — | — | §3.6 |
| 6 | **Quick wins:** the shrine's label over kneeling pilgrims; save a holding's remembered look in the fog | S | — | go | §10.1 |
| 7 | **Scouting in battle** (offered, not agreed) | S | — | **Owner** (decision) | §10.1 |
| 8 | **Check the rest of the UX review** (UX-02 to UX-11): mark what later work fixed, fix what is left | S | — | — | [UX_UI_REVIEW.md](UX_UI_REVIEW.md) |
| 9 | **Test on a real phone** (Android Chrome, iOS Safari) | S | a device | **Owner** | §1.5 |

**2. Small, fun, cheap gameplay**

| # | Item | Size | Depends on | Owner? | Detail |
|---|---|---|---|---|---|
| 10 | **The small encounters:** fortune teller, toll on the road, a warm campfire, herbalist, runaway serf, flotsam, snowed-in travellers / sandstorm survivors | S each | the stat-odds helper (built, 8f072a3) | go | §10.3 |
| 11 | **The world feels alive:** tavern rumours of real events; enemies who remember you; night with character; monster trophies and a first-kill line | S–M each | — | go | §10.5 |
| 12 | **New jobs:** a named outlaw, guard the harvest, intercept a rider, scout the land, the white stag, collect a debt | S–M each | intercept a rider: the letters (built, 937ca04) | go | §10.4 |
| 13 | **A bigger morale hit when a whole group is lost.** *Kept small and late in this band: a breaking group already shocks its neighbours (`MORALE.cascade`).* | S | — | **Owner** (still wanted?) | §3.2 |

**3. Medium gameplay features**

| # | Item | Size | Depends on | Owner? | Detail |
|---|---|---|---|---|---|
| 14 | **Bandit raids** on workers, estates, caravans and villages | M | nothing else touching `brains.js`/patrols; the land defence (built, e5bca02) | go | §10.6 |
| 15 | **The healed traveller, escort and Ander The Fallen** (batch B) | M | the healed traveller (built, 51841e8) | go | §10.7 |
| 16 | **Chain quests** (batch C): "The Wounded Traveller" | M | #15 | go | §10.8 |
| 17 | **Encounters, phase 3: the new props** | M | — | **Owner** (art approval) | §10.2, [ENCOUNTERS_DESIGN.md](ENCOUNTERS_DESIGN.md) §4 |
| 18 | **Encounters, phase 4 remainder:** prisoner wagon, execution, duel | M | #17 (cage cart, gallows); the duel needs a one-on-one hero fight | **Owner** (RTS-style or manual hero duel) | §10.9 |
| 19 | **Battle types:** defend a caravan, run down a fleeing enemy. *Placed here: medium, fun, and built on the battle types already there.* | M | `BTYPE` (built, e527d86) | pick with the owner | §4.5 |
| 20 | **Reinforcements that arrive mid-battle** | M | — | pick with the owner | §4.7 |

**4. Large features**

| # | Item | Size | Depends on | Owner? | Detail |
|---|---|---|---|---|---|
| 21 | **Travel supplies** (planned next by the owner): band stamina, hourly food and drink, furs, desert water, Make camp, the action ring, the status card | L (4 steps) | the stat checks (built) | **Owner** (go) | §10.10, [SUPPLY_DESIGN.md](SUPPLY_DESIGN.md) |
| 22 | **The world, Phase 2 waves 2–4:** the full map, the router, river/road/coast art, the battle link and D41's steep hills, R12's daily-job slicing; then the classic seed (wave 3) and the flip (wave 4) | L | waves 0–1 (built); the flip needs the owner to play `?gen=1` | **Owner** (go; acceptance before the flip) | §10.11, [WORLD_DESIGN.md](WORLD_DESIGN.md) §15.2 |
| 23 | **Building redesign, stage 2** (every building type as a model), then stage 3 (in the game) and 4 (life effects) | L | stage 1 (built, 889b0c5) | **Owner** (go) | §10.12 |
| 24 | **The world after Phase 2:** 2b settings screen, 3 blends and borders, 4 new places, 4b founding and **holding growth tiers**, 5 living rivers, 6 retune, 7 world cliffs | L each | Phase 2 (2b needs only its settings contract) | **Owner** (go per phase) | [WORLD_DESIGN.md](WORLD_DESIGN.md) §15; §6 |

**5. Held for design**
- **Band auras** (§4.8): needs more design and balancing (owner, 2026-10-19).

**6. Later, when the area is touched or the owner asks** (no order): lots and deposits as classes (§5.3); interiors (§7); character parity (§8); the design backlog (§9); REFACTOR items 14 (the rest) and 18; the technical-debt items (perf hot scans, the two Esc mechanisms, the interior painter).

**7. Deferred:** as listed under **Deferred** below.

---

## 0. Housekeeping

| # | Task | Status |
|---|---|---|
| 0.1 | ~~**Commit the uncommitted work**~~ | **Done 2026-10-16** (3fb204d, d234c57); everything since is committed as it lands. |
| 0.2 | ~~**Refresh `prototype/README.md`**~~ | **Done**: kept up feature by feature; the file list (layout) checked against `Ashmark.html`'s script order 2026-10-19. |
| 0.3 | ~~**Update `wiki.html` text**~~ | **Done**: the wiki is updated with each feature (104f3ae, then each feature commit through 8f072a3). "Buy livestock" is gone from the game (adb14da: no livestock sales; the pasture's Pens are information only). |
| 0.4 | ~~**Steady the flaky tests**~~ (siege raid, biomes arrows, patrols grace) | **Done 2026-10-17** (10b925e; also 460c917 for rts, attacks, caravanparty; 79d8770 and 58b6526 for lots). Flakes seen since are under Technical debt (Priority 2). |

---

## 1. Finish mobile play

**Goal:** the game is fully playable by touch on a phone held sideways (844×390 CSS px).

1. ~~**Battle camera by touch**~~ **Built 2026-10-17** (39c4785: `camPinch`, pinch to zoom, two fingers to pan).
2. ~~**Orders without a right-click**~~ **Built 2026-10-17** (39c4785: a long press moves or attacks, hold then drag lays out the line; taps act on lift).
3. ~~**The world map's "what is this" card**~~ **Built 2026-10-17** (39c4785: hold on a holding, party or site).
4. ~~**Install-to-home-screen polish**~~ **Built 2026-10-17** (8f01013: manifest, icons, safe areas, no page zoom).
5. **Test on a real phone** (Android Chrome and iOS Safari), including safe areas (notch) and rotation mid-battle. **Open, waits for the owner** (a device). What to check is listed in the README's "Touch controls".

**Done when** a full loop works by touch only: start a game, travel, trade, fight a battle with formations, and save.

---

## 2. Remaining sprite upgrades (follow the box and proportion rules)

| # | Task | Notes |
|---|---|---|
| 2.1 | ~~**The lord's map horse**~~ **Done 2026-10-17** (89cb0fa) | The battle horse (`drawMount`) in a 32×32 cell, rider seated with his banner (`people.js` `mapFigure`). Redrawn small in world Phase 1 (f08c720). |
| 2.2 | ~~**The caravan**~~ **Done 2026-10-17** (89cb0fa) | A covered two-wheeled cart, an ox with a yoke and a drover, in a 64×64 cell; the cover takes the faction colour (`caravans.js` `caravanSprite`). Redrawn small in Phase 1. |
| 2.3 | ~~**Village herds without a pasture**~~ **Superseded 2026-10-19** (adb14da) | Livestock lives only in its pasture's pens; a holding with no pasture keeps its animals out of sight (`world/critters.js`). |
| 2.4 | ~~**Ships and refugees' carts**~~ **Done 2026-10-17** (a493d18, c814cbf) | Fishing boats are rowing boats with a fisherman (32×32); trade ships are cogs with castles, a square sail striped in the owner's colour and crew (64×64, `ships.js` `shipSprite`). Refugees walk as 16-px people (no carts). Moored dock boats match too (`gfx/structures.js` `estateBoats` draws `shipSprite({moored:true})`: empty rowing boats, and a cog with its sail furled at level-3 ports, tied to the pier and wholly afloat); the engine's `PX.boat` is unused. |

Check each one in a sprite lineup at 6–8× and on the map, then get the owner's approval.

---

## 3. Battle follow-ups (small, already discussed)

1. ~~**The AI withdraws a beaten army**~~ **Built 2026-10-17** (7ea6fc0: `beatenArmy` in `commander.js`; "The enemy falls back", every group `withdraw()`s).
2. **Bigger morale hits when a whole group is lost** (a group wiped out or routed), in `morale.js`. **Open (S); ask the owner if still wanted:** a group that breaks already shocks the groups near it (`MORALE.cascade` 8, within `crowd`, since b141f8a); an army-wide hit for a whole group lost is not built.
3. ~~**Re-check the battle tests**~~ **Done**: `tests/rts.js` passes and was hardened (460c917).
4. ~~**AI tactics**~~ (owner's request, 2026-10-17) — **built 2026-10-17** (26cbea5; `AI_TACTICS`, `CHAR_FALL` in `commander.js` and `charmind.js`; per-army temperament built as race styles, 11e16af):
   - **Ranged units lead:** the AI opens with its shooters to scout and fire first when its range or numbers pay (pushing ahead of its infantry and pulling back when your melee closes in), but plays **safe** (shooters behind the infantry screen) when your cavalry or fast troops threaten them, when it is outnumbered or defending a holding, or when its archers are worn (ammunition, morale). Leave room for per-army temperament (see "Race fighting styles" below).
   - **Charges from further away:** cavalry and shock infantry start their run earlier so they hit at full momentum more often, but **stamina gates each charge** (no long charge when tired: walk closer or wait; a charge already under way drops to a walk if they tire).
   - **Ability use:** captains call `g.useAbility(id)` (Brace against charging cavalry, Rally when wavering, Spur on attack, Fire arrows against armour or beasts).
   - **Characters fall back and reassess** (owner's request): after a defensive roll (badly hurt and surrounded), a character moves away toward its own troops, watches, and goes back in only when it's OK (stamina recovered, the target area no longer a trap or friendly troops already fighting there); your hero resumes your order then. Health isn't a hard gate (it doesn't regenerate in battle).

5. **Woods see-through in battle** (*agreed 2026-10-19*; **open, S**): as on the world map, trees in front of any soldier you can see fade, to the same level as the map's (`WDEPTH.fade` in `gfx/depth.js`, 0.3 since 5fa658b; battle's `PROPFADE.a` in `gfx/render.js` is still 0.4, over your and your allies' men only). Hidden soldiers stay hidden.
6. **An outline on your selected groups** (*agreed 2026-10-19*; **open, S**): a glowing 1 px outline round each soldier of your **selected** groups (not hover; touch screens get it too), drawn above the trees so you follow them through woods; in their colour (gold for yours).

---

## 4. Battle fun pipeline (pick with the owner)

Recommended order, with what already exists to build on:

1. ~~**Unit-type abilities with cooldowns**~~ **Built 2026-10-17** (b81c21f: Brace, Fire arrows, Spur, Rally on the order bar; `battle/unitabilities.js`, `UNIT_ABILITIES`; the AI uses them, 26cbea5).
2. ~~**Commander powers for the player**~~ **Built 2026-10-18** (3f24f1d) on the fog-of-war snapshot (`battle/commandpowers.js`, `COMMAND_POWERS`): **Rally the Line** (Z), **Stand Fast!** (S; "Hold" is an order already), pre-battle **Scout** (O, with fog of war) for your hero and the enemy's lord or chieftain, within a command radius scaled by Leadership; the AI uses them (theirs, yours under Auto); a commander bar on the HUD; lab `powers` and `commander` keys; `tests/commandpowers.js`, `tests/visual/powerbalance.js`. Distinct from the hero's own skills. Pre-battle Ambush is left to the battle types (built). The AI button sits in the COMMAND panel under the powers (6e5c7fd).
3. ~~**Terrain that matters**~~ **Built 2026-10-17/18**: phases 1–4 of [TERRAIN_DESIGN.md](TERRAIN_DESIGN.md) (0b6cde6, d208962, 9038878, e527d86), fog of war and field variety (3f24f1d). **Open there:** the owner's approval of the phase 3–4 art (Priority 3); world-first features (rivers' width, steep hills, cliffs) come from the world map in Phase 2 wave 2 and Phase 7.
4. ~~**Juice**~~ **Built** (slow motion on a charge's impact since 3fb204d; callouts, the charge shake and "unit of the battle", f432976; the battle event hook, REFACTOR item 11, 097ec15).
5. **Battle types:** ~~ambush (surrounded, no deploy)~~, defend a caravan, ~~hold the bridge~~, run down a fleeing enemy. — **Hold the bridge** and **Ambush** built 2026-10-18 (e527d86) on the terrain phase 3+4 snapshot (`BTYPE` in `battle/setup.js`, triggers and the panel's *Spring an ambush* in `battle/encounters.js`, an ambush road event, AI in `commander.js`, lab `type` key; [TERRAIN_DESIGN.md](TERRAIN_DESIGN.md) §8, "Battle types as built"). **Open (M):** defend a caravan and run down a fleeing enemy (a "defend the caravan" road event exists, fought on an open field).
6. ~~**Race fighting styles**~~ **Built 2026-10-17** (11e16af; `TEMPERAMENT` in `commander.js`: dwarves hold, elves skirmish, orcs frenzy, mixed hunts the wavering; human = base). Beasts fight by kind instead (45ccdb3, `battle/beastmind.js`).
7. **Reinforcements that arrive mid-battle** from the field's edge. **Open (M).** Reinforcements exist today (`tests/reinforce.js`) but are present from the start.
8. **Band auras: the band learns from its leader** (*agreed 2026-10-19, held: needs more design and balancing*): one `BAND_AURA` table, a leader's skill giving troops about **30%** of its own bonus (the best in the band counts); in battle only troops **within the commander's radius** (`commandRadius`), on the map always; **companions lead too**, their auras reaching the troops near them. Candidates: Woodcraft (woods), Athletics (stamina), Archery (archers' damage), Blocking (shield troops), One-/Two-Handed (that grip), Riding (cavalry turning), Hunting (meat). Don't double count what is already band-wide (Scouting sight, Survival, Medicine, Leadership, Tactics, companion roles). A "led" mark on unit cards; aura lines in the unit info. (Woodcraft is built as a skill of its own: on the map it speeds your band through woods, in battle the character who has it; 6b911d6, c8d8ea9.)

Also built outside this list: battle unit physics (da78db0, `PHYSICS.on`), hand chosen groups to the AI and attack-move (c6985e6).

On hold by the owner's call: a battle scale of one unit ≈ 100 men.

---

## 5. World OOP refactor (continue the agreed order)

Already built: holdings as classes, sites as classes, parties, brains, leaders, captives, and Unit/Troop/Character.

1. ~~**Caravans as a Party**~~ **Done 2026-10-17** (4d24715, `CaravanParty`; save shape unchanged).
2. ~~**A `WorldObject` base**~~ **Done 2026-10-17/18** (3c12197, a45e60b; fights as world objects and the minimap from `worldObjects()`, 5e9453d): shared pick, tooltip, meet, draw and minimap dot; saves stay plain JSON.
3. **Estates, buildings and deposits as classes.** **Partly built:** estates are `Estate` world objects (a45e60b); placed buildings (`lots.js`) and deposits (`resources.js`) are still plain records. Do the rest when the area is touched (building redesign stage 3 touches `lots.js`).
4. ~~**The other movers as classes**~~ **Done 2026-10-17** (a45e60b): `Monster`, `Herd` (critters), `Refugees`, `EstateWorker` (folk), `Ship`; encounters are `RoadEncounter`s (17224a0).
5. ~~**Clean-up: remove the compatibility views**~~ **Done 2026-10-17/18** (963628d and the last shims: REFACTOR item 10). The read-only `o.troops` views stay by design.

Rules: classes for behaviour, plain JSON in saves, check in after each step.

---

**Refactor plan:** see [REFACTOR_PLAN.md](REFACTOR_PLAN.md) (code-structure review 2026-10-17): wave 1 and items 9–13, 15–17 done; item 14 in part; item 18 open.

## 6. Holdings growth and new types

**Owned by [WORLD_DESIGN.md](WORLD_DESIGN.md) Phase 4 and 4b** (§7.3 the tier model, D34–D35); kept here as a pointer.

1. **Growth tiers** (camp → hamlet → village → town → city or castle) on top of `HOLDING_TYPES`. **Data in place** (`tier`/`next` per kind, 097ec15; `holdingOf(t, kind)` switches a holding's class); the growth itself is **open**: world Phase 4b. Mind the name: Phase 4b's planned `TIERS` costs table clashes with `TIERS` (the LOD tiers' `WeakMap`) in `world/parties.js`.
2. **New holding types:** the owner will add more; the hamlet and the camp come with world Phase 4 and 4b. Each should be one registry entry plus a class if it behaves differently.
3. **Open art question:** cities still reuse the town's citadel sprite (`centre:{_:'citadel'}`); Phase 4b's art agent draws a city citadel variant.

---

## 7. Interiors (walkable scenes, added gradually)

**Open; not started beyond towns.** The proposed milestone order:
1. The engine and towns (partly done: towns have streets, `js/scene/`).
2. Castle.
3. Cave and hideout.
4. Ruins.
5. Mine.
6. **Dragon lair**, which must be very hard to find (its place on the map: [WORLD_DESIGN.md](WORLD_DESIGN.md) §6.5, Phase 4).

Each place keeps its text panel, plus an "Enter" choice once its scene exists. Entering hostile holdings (sneaking in, disguise) is **deferred**, but don't design scenes that assume you're always welcome.

---

## 8. Character parity (technical)

**Both open, the owner's call.**
- **Hero stats:** the hero still uses `heroStats` (`core/state.js`), while companions, lords and chieftains use `charStats`. Merge them if the owner wants one formula.
- **Hero's bow:** the hero's bow is a drawn shot (`B.draw`, `combat.js`), while champions shoot as troops. Unify them if needed.

---

## 9. Design backlog (from the Feature Plan, not started)

These are in the [Game Feature Plan](Game%20Feature%20Plan%202D%20Pixel-Art%20Sandbox%20Warband%20RPG.md) but not built. Agree a design with the owner before building any of them. Where another doc now owns part of one, it is named.

| Area | Feature |
|---|---|
| Overworld | Seasons (effects on travel, food, prices). The calendar itself is world Phase 5 (WORLD_DESIGN D17); the effects stay here |
| Party | Desertion when you're broke or keep losing |
| Companions | Personal story quests and conflicts between companions; companions as caravan leaders (governors: world Phase 4b, D37) |
| Combat | Directional melee (swing angles, blocking by matching direction), if manual control returns |
| Economy | Production chains (grain → flour, ore → weapons); gear crafting and smithing |
| Politics | Lord traits and grudges ("enemies who remember you" is §10.5); **founding your own kingdom** (laws, vassals, diplomacy; your first holding and realm: world Phase 4b) |
| Quests | Rescue and defend contracts (escort: §10.7; defend a caravan battle: §4.5); faction story chains (chain quests: §10.8); a late-game threat (invasion or civil war). ~~Ambush road events~~ built (e527d86; the map encounters' ambush, 17224a0) |
| Presentation | ~~Music in the game~~ built (4796112: generative music, `core/music.js`, and synthesised effects, `core/audio.js`); more walkable interiors (see section 7) |

---

## 10. The road, the world and quests (*agreed 2026-10-19*; each waits for the owner's go)

In the order the owner last saw them, smallest first; the **Priorities** above give the working order. All open at 7324310 unless marked. Designs: [ENCOUNTERS_DESIGN.md](ENCOUNTERS_DESIGN.md), [SUPPLY_DESIGN.md](SUPPLY_DESIGN.md).

1. **Small quick wins:** the shrine's name label over kneeling pilgrims (lift or fade it); save a holding's remembered look in the fog (`l._mem`, `t._memCol` are not saved today); Scouting in battle (offered, not agreed).
2. **Encounters, phase 3: the new props** (cage cart, gallows, roadside shrine, mine mouth, dice on a cloth, bier, broken cart), replacing the stand-ins. The roadside shrine may not be needed: the pilgrims now use the map's real shrines (937ca04).
3. **The small-encounters backlog** (on the shared stat-odds helper, 8f072a3; strayed sheep built 2026-10-19, 19c0cae): fortune teller, toll on the road (Scouting 3 sees through false "lord's men"), a warm campfire (read the tracks), herbalist, runaway serf, flotsam on the shore, snowed-in travellers / sandstorm survivors.
4. **New jobs** (`world/quests.js`): Wanted: a named outlaw (a bounty that grows, he comes back with a grudge), Guard the harvest, Intercept a rider (sealed letters: `world/letters.js`, built), Scout the land, the white stag, Collect a debt.
5. **The world feels alive:** tavern rumours that point at real events; enemies who remember you; night with character (howls, more ambushes and wisps); monster trophies and a first-kill line.
6. **Bandit raids:** bands rob workers, plunder and sometimes burn estates, attack caravans, and rarely raid an unwalled village (big bands only); shown as "Raiding: X" with progress; successful raiders grow (more men, a promoted chief); the land's defence (built 2026-10-19, e5bca02) answers. Build after nothing else touches `brains.js`/patrols.
7. **The healed traveller, escort and Ander The Fallen** (batch B): any encounter choice can lead to a next page; healed (bandaged, built 51841e8), he joins (99%: a first-tier troop of his people) or asks to be escorted home (a house or estate); the escortee rides **inside your party** as a passenger (eats, no fighting, no slot, not targeted), lost if too slow or a battle is lost; the lost child and refugees move onto the same escort. **Ander The Fallen**: a unique companion, chance 1% × `HIDDEN_RATE` (default 1, never twice a game), a veteran sellsword (high Strength and Agility, good Leadership, a scar, a dark cloak); escort him **and** destroy the bandit camps, then he joins. *This plan owns escort; the Feature Plan points here.*
8. **Chain quests** (batch C, after 7): a small framework of steps (escort, go to, clear a camp, deliver); "The Wounded Traveller": heal, escort home, his family asks you to clear the bandits' camp, an heirloom and reputation.
9. **Encounters, phase 4 remainder:** prisoner wagon and execution (need the phase 3 cage cart and gallows); **duel challenge** needs a one-on-one hero fight first (RTS-style or manual hero: the owner decides).
10. **Travel supplies** ([SUPPLY_DESIGN.md](SUPPLY_DESIGN.md), planned next, large; nothing built): band stamina as fuel (Tired under 20, Exhausted under 5), food and drink by the hour (ale and liquor slow the drain and lift morale, water does neither), furs in the frost, water in the desert, band health; the hero tires with the band; stamina carried into battle; **Make camp** and the **action ring** (left-click and hold; its *Look* replaces today's touch hold card); the band's status card. Steps 1-4 as in its doc; step 1 after the stat checks (built, 8f072a3) because the cart's push spends the hero's stamina today.
11. **The world, Phase 2 wave 2** ([WORLD_DESIGN.md](WORLD_DESIGN.md) §15.2.2, waits for the owner's go): the full map on M, the router, river, road and coast art with 8-direction roads painted as curves, R12's daily-job slicing (`econDay`, `caravanDay`, `landDay`: left over from Phase 0), battle rivers, D41 steep hills. Then wave 3 (the classic seed) and wave 4 (the flip, after the owner has played `?gen=1`).
12. **Building redesign, stage 2** (waits for the owner's go; stage 1, the shared kit and model renderer, is built: 889b0c5): 3/4 top-down buildings in the people style, natural facings (4), town ground, life effects. Stages as the owner agreed them on 2026-10-18: **2** every building type as a model (engine only); **3** in the game (`lots.js`, `structures.js`; house plots as clusters); **4** life effects (smoke, lit windows, mill sails, forge sparks). Known weak spots from stage 1: tall narrow side views, spotty snow roofs at 16 px, busy clusters. The design is recorded only in the assistant's memory so far; no doc in `doc/` yet.

---

## Deferred (do not start without the owner)

| Item | Notes when it comes back |
|---|---|
| ~~**Procedural world** (a seeded map)~~ | **Active since 2026-10-18:** [WORLD_DESIGN.md](WORLD_DESIGN.md) (Phases 0–1 built, Phase 2 waves 0–1 built behind `WORLD.gen`). The classic seed keeps the 37 named holdings, as asked here. |
| **Game data as JSON** | Browsers block reading `.json` from `file://`. Ask how to load it first: a Python-built bundle (recommended), a local server, or `.js` files shaped like JSON. |
| **Art derived from the `graphics/` pack** | Order: recolour → kit-bash (dwarves, elves, mounted hero) → missing animals. Bake offline to `graphics/generated/`. (The pack is not in the repository.) |
| **Entering hostile holdings** | See section 7. |
| **Manual hero control** | Kept behind `MANUAL_HERO`. Don't delete it; ask before changing it. |
| **World lighting** | A time-of-day grade, a pixel light map, lit windows, night battles; proposed 2026-10-18, the owner will discuss it later. |
| **HD-2D demo** | A WebGL pixelated-3D prototype; reconsider only after the current world plan is finished. |
| **Place pictures** | Immersion pictures for places, areas, sites and encounters (an engine scene composer was proposed); shelved 2026-10-19. |
| **Realm rulers** | Kings and queens over the lords; later, by the owner's call. |
| **A calmer label-overlap fix** | The party label layout was reverted (1d9f5c3: it re-laid labels every frame and the map looked like it shook); a fade for overlapping labels is the gentler way, when the owner wants it. |

---

## Technical debt and watch-outs

- ~~**Seeded failure:** `lots` "its realm builds it another house" at `-Seed 1` and `-Seed 2`~~ **Fixed 2026-10-17** (79d8770, 58b6526: seeded with a 200-day window, the realm's other holdings kept busy; passes seeds 1–12).
- **Unseeded flake:** `monsters` "spiders web your fighters" sometimes fails unseeded (spiders now shoot; fight outcome varies). **Open** (Priority 2): the check is unchanged since 186c290.
- **Encounters' chance-based checks** (the hidden ambush in sight, a weary thief chase) flaked in b3560c5 and aed29cd; made steady in 937ca04 and 8f072a3. Confirm on the next full sweep.
- **`mappolish`** flaked in full sweeps and reran clean (5949c93, f9bacb4). Confirm on the next full sweep.
- **Lab warm-up:** the first BattleLab battle after a page load plays slightly differently from the same battle run again (visible in `visual/battleperf` fingerprints). Open.
- **Remaining hot scans (perf, later):** `commander.js` members×foes `busy` checks (~2 ms/frame at 1200), `BattleResolve.live()/members()` filters (2–4 ms at 800–1200; a per-frame member cache), `setOrderUI` on every death (batch per frame), `targetMembers`/`tgt` getter O(n) per access, `FORM_SWAP` pairwise pass.
- ~~**Timing-sensitive test:** `rts` "fights in bursts"~~ **Fixed 2026-10-17** (460c917: seeded, the foe pinned, measured on the battle clock `B.t`).
- **The mid-line `//` trap:** a comment followed by code on the same line hides that code. Use `/* */` (see the knowledge transfer).
- **Frame cost:** the world frame rose from about 1.2 to 3 ms with placed buildings; since then the map is drawn from chunks (R6) and LOD hooks exist (R12, inert). Profile with `Ashmark.html?test=visual/perf` before adding more map entities.
- **Interior painter:** interior scenes still use their own painter rather than the PX engine.
- **Two Esc mechanisms:** `ESC_CLOSE` in `ui.js` still maps modes to close actions for screens with no open window (walking the streets). Fold it into the window frame if possible.
- **A save failure reported as success** (UX-01): see Priority 1.
- **Comment drift:** `gfx/worldui.js`'s header still says encounters show "an arrow at the screen's edge"; the arrow became waves in b3560c5.
- **Temporary files:** `tests/zz_*.js` must never be committed.

---

## Definition of done (every item)

1. Tests: the affected suites pass, with any known flaky tests named in the report. Agents run targeted suites only; the coordinator runs the full sweep once after each merge (owner, 2026-10-19).
2. Screenshots at 1600×900 and 844×390 for anything visible.
3. The window frame rule is followed: actions in the content, `nav()` last.
4. Sprite box and proportion rules are followed for anything drawn.
5. No duplicate global names (`tests/structure.js`), and no code hidden after a `//` comment.
6. README and wiki updated if behaviour changed.
7. The owner has seen it before moving on.
