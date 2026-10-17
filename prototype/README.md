# Ashmark prototype

Open `Ashmark.html` in a browser. There is no build step and nothing to install.

## Independent army groups (save schema v2)

Start a **new campaign** for this version. Old saves are not loaded or migrated; old browser storage is left untouched.

- Each army has at most **10 groups**, including its hero/leader and companions. Wounded companions in your band reserve their slot; companions leading another army belong to that army instead.
- Each troop group contains one unit type. Duplicate types have persistent, distinct IDs. The existing total-headcount capacity remains a separate limit; no new per-group soldier cap is imposed.
- Open **Hero → Party → Manage** to name a group (up to 32 characters), split an exact number of fit soldiers, or merge compatible groups. A split starts with its default name and leaves wounded with its original group. **Reinforce** selects a recruitment target.
- Use **↑ / ↓** to reorder the entire army, including hero and companion groups. This persists into battle cards, default number keys and deployment lanes. Wounded companions reserve a slot but have no battle card until recovered. Custom Ctrl+number selections still override the default keys within a battle.
- Each group shows its own wounded count. Groups with no fit soldiers appear under **Recovering groups** and retain their name when soldiers return. They do not take a battle card or an active slot until restored.
- Battles show one card per group. Shift-click adds cards to the selection. **1–9 and 0** select the ten cards; Ctrl+number stores a custom selection. **Home** resets the battle camera (0 is now the tenth card).
- Orders, formation, facing, waypoints and capability-filtered ability toggles are independent for each group. Enemies and allied armies use the same grouping model; reinforcements keep their own army budgets and source identities.
- Fought-battle casualties and wounded returns retain the originating troop-group ID. Merging groups transfers wounded ownership. Wounded whose original group cannot fit wait rather than reinforcing an unrelated duplicate.
- Fought-battle results include a per-group report in battle-card order: starting soldiers, fit survivors, new wounded and killed. Medicine returns count as fit; extra rearguard deaths after a failed escape belong to the actual group that lost them. Destroyed groups retain their name in this report. Earlier wounded are excluded. Hero/companion conditions appear separately and never count as soldier deaths. Auto-resolve and non-field encounters retain their aggregate losses summary rather than inventing a field breakdown.
- **Town → Recruit** lets you choose a destination group (or one new group), enter a soldier quantity, review total gold/headcount/slots, then confirm. Orders are all-or-nothing. Single-soldier quick-hire buttons remain available.
- Click a training-tree row to **upgrade a whole group**: select the source group, review its total gold and pooled XP cost, then confirm. Its ID, soldier count and slot are preserved, even in a full ten-group army; formation resets to Line. Groups with wounded waiting to return must heal first. Individual **Train 1** buttons remain available and may need a free slot for a new type.
- Recruitment, transfers and training reject operations that need an unavailable slot. A changed price or unavailable order is rechecked at confirmation rather than silently charging different terms.
- Open a companion’s details → **Army transfers** to select the exact source formation, quantity and destination (compatible group or a separate new group). Review and confirm the whole order; capacity, proximity, leadership and army slots are rechecked. Only fit soldiers move, leaving wounded with the source army. A whole fit formation moved to a new group keeps its name, formation and frontage; a partial new group uses defaults, and reinforcement keeps the destination’s settings. IDs are local to the receiving army.
- Taking the last soldiers back reserves a slot for the returning companion as well as any new troop group. Automatic **Come back** preserves separate formations and their settings too; if the entire returning army plus its leader cannot fit, no soldiers move. Automatic return retains the prior over-headcount-cap policy; explicit transfers cannot exceed headcount capacity. Giving to a distant companion remains allowed, but taking soldiers back requires being within 60 pixels. Neither direction may change a party currently in a battle. Garrisons still convert stationed soldiers into generic defenders.
- Individual attacks, fatigue, weapon rules and morale remain the existing systems. The proposed shared group-resolve / unanswered-missile-fire morale redesign is **not implemented** by this change. Troop XP is still pooled by unit type.

`core/army.js` owns group identity and mutations. `P.troops` and NPC `tc` remain count views/interchange records for economy and world simulation; `ArmyRoster` updates them together with `army.groups`. Battle controls reference unique IDs rather than fixed Infantry/Archers/Mages/Cavalry buckets. Tactical role is a separate field used by the captain.

Focused regression suites: `armygroups`, `armyedges`, `groups`, `battlesetup`, `battlecommands`, `rts`, plus the existing recruitment, roster, laboratory, combat and morale suites. Test-only `testGroup(role)` resolves role-based execution fixtures to real group IDs; it is not a gameplay or save-compatibility API.

`wiki.html` is the game reference: world map, biomes, races, realms, holdings, the economy, battle, troops, gear, monsters and life on the map. It loads the game's own data and sprite scripts, so it updates itself whenever the data changes.

## Layout

```
Ashmark.html          page markup; loads style.css, the PX engine (../engine: pixel, buildings, pieces), then the scripts below, in this order
style.css
js/core/              core.js (DOM, canvas, constants, helpers, the action registry), state.js (state factories, G, P, derived stats),
                      roster.js (TroopRoster, count/list helpers), army.js (ArmyRoster, persistent groups and slot budget), garrison.js (GarrisonService),
                      inventory.js (Inventory and bag operations), equipment.js (EquipmentService), recruitment.js (RecruitmentService and troop XP),
                      talents.js (TalentService and character talent commands), session.js (GameSession and new game), save.js
js/data/              tables only, no game logic: races, factions, units, monsters (incl. mythic ones like the dragon), critters,
                      matchups, gear, progression (pasts, skills, perks, companions), tree, holdings (the kinds of holding and their
                      classes), places (goods, holdings, camp spots),
                      economy (estates, walls, production, needs, taxes, caravans), conduct (what deeds cost),
                      scenes (who you meet inside a place, buildings, building styles)
js/world/             the campaign map and everything on it
  map.js territory.js   terrain, climate, pathfinding; each holding's land
  realms.js siege.js    factions, diplomacy and lords; sieges, raids, captures and fiefs
  leaders.js            how every leader grows (hero, lords, companions, bandit chieftains); the chieftains
  parties.js            every party's soldiers as counts; its kind's class (look, sight, shelter); W.parties; your band (P)
  brains.js             how each kind of party behaves on the map; updateParties runs them all
  captives.js           leaders in battle; captured, ransomed, let go or escaped
  stay.js               staying in a holding (your band), and the shelter rules for you and your companions
  economy.js estates.js stock, production, prices, treasuries; estates and walls
  lots.js               placed buildings on the grid: layouts, placing, building time, houses
  folk.js caravans.js   workers in the fields; caravans (realms' and yours)
  companions.js         companions who grow as you do (level, gear, disciplines, perks) and lead parties of your soldiers
  ships.js              fishing boats out to the fishing grounds by day; trade ships between ports on the same sea
  resources.js          ore veins and fishing grounds, and what each holding's mines and ports bring up
  refugees.js           people leaving ruined (or full) holdings
  conduct.js            charging deeds against a holding (CONDUCT), and the small map dialogs
  sites.js              caves, ruins, shrines, hideouts, travellers and the bandit camps
  monsters.js critters.js events.js quests.js reputation.js
  world.js              travel, the daily tick, the world update
js/battle/            encounters.js (dialogs, outcomes by kind: ON_WIN), parley.js (cornered parties), setup.js (BattleSetup, field
                      and unit construction), resolution.js (BattleResolution, field results and campaign settlement),
                      battle.js (shared group defaults and frame orchestration), actors.js (actor execution and targeting),
                      battlecontrol.js (group mechanics), commands.js (player selection and orders),
                      attacks.js (damage and attack execution), projectiles.js (launch, flight and impact stepping),
                      combat.js (the hero's manual control: combos, dodge, block, the bow, skills; set aside for now,
                      MANUAL_HERO in battle.js)
js/scene/             walkable maps of the places you enter: scene.js (walking, paths, talking, in and out), town.js (town layouts);
                      a kind of place gets a scene by adding its generator to SCENES; its text panel stays, with a choice to walk in
js/gfx/               worldart.js (the painted map), sprites.js (generated sprites), structures.js (placed buildings, estates' ground, camps, sites, flags), render.js (world and battle drawing, HUD),
                      scene.js (painting and drawing scenes)
js/ui/                ui.js (panels, title, Esc menu), character, talents, inventory, town, input.js (actions, mouse, keys)
js/main.js            game loop and boot
graphics/             the pixel-art pack (free for personal and commercial use); not used for now
archive/              the single-file version from before the split, and art.js (the sprite-sheet mapping, set aside)
```

The scripts are plain `<script>` files, not modules, so the page still works from `file://`. Their top-level `const` and `function` names are shared across files. The rules that follow (checked by `tests/structure.js`):

- **One name, one place.** Every top-level name is global; a second `function` with the same name would silently replace the first.
- **Load order.** `core/core.js` first, then all of `data/`, then the systems (world, battle, scene, gfx, ui). Code that runs at load time (data tables, event listeners, `onAct` registrations) goes after everything it uses. `wiki.html` loads the same list (minus `ui/input.js` and `main.js`); keep the two in step.
- **Data, not special cases.** Tunable numbers and kinds of things live in `js/data/`. A new monster is a `MONSTERS` entry; one that roams the whole map, like the dragon, adds a `mythic` block. The cost of a deed is a `CONDUCT` entry.
- **Actions.** Every button names an action `prefix-name` (`data-act="cv-buy"`). A system claims its prefix once with `onAct('cv-', caravanAct)`; a second claim throws. Town and encounter actions without a registered prefix are handled in `ui/input.js`.
- **Encounters.** A new kind of fight adds its entry to `ON_WIN` in `battle/encounters.js`: what winning it pays and changes.

### Shared helpers and cleanup

`core/core.js` owns the generic numeric helpers (`sum`, `seeded`, `angGap`); the seeded RNG sequence and angle wrapping are shared unchanged by simulation, rendering and combat. `core/state.js` owns `partyRoom` alongside party size/capacity. It deliberately returns a negative value while over capacity. `core/roster.js` owns count/list conversion; companion and garrison displays reuse `countsOf` without modifying saved counts.

Before removing a global, check both HTML entry points, registered action callbacks, the save format and tests—not only direct function calls in gameplay. `FORM_ORDER` and `LCAP`, for example, are still read by the wiki. Talent, equipment, site and party compatibility helpers with live consumers remain supported. Unused legacy controls and rendering helpers were removed in cleanup step 4; manual hero control and archived/reference assets were not removed. `tests/helpers.js` checks the shared helper contracts and grouped displays; `tests/wiki.js` loads the actual wiki and checks completion, sprites and search, rather than only checking its script list.

## What is on the map

Things in the world are plain data (so a save is plain JSON) read through a class for their kind. The class is put back on load.

- **Holdings** (`data/holdings.js`): `HOLDING_TYPES` says what each kind has (people, garrison, patrol, walls, tabs, troops, horses, needs); `Holding` → `Village`, `Town`, `City`, `Castle`. Code asks the holding (`t.T`, `t.label`, `t.has(tab)`, `t.hires(race)`, `t.takesGuests(free)`), never `t.kind==='…'`. A new kind is an entry and, if it behaves differently, a class; `holdingOf(t, kind)` changes a holding's kind.
- **Sites** (`world/sites.js`): every place off the roads. `Site` → `Cave`, `Ruins`, `Shrine`, `TravellersCamp`, and the bandit lairs (`Lair` → `Hideout`, `BanditCamp` on the fixed `CAMP_SPOTS`). Where a kind may stand is static (`ground`, `clear`, `fits`, `point`); what it does is the instance's (`enter`, `panel`, `act`, `day`, `tip`, `box`). A new kind of place is a `SITE_TYPES` entry and a class in `SITE_CLASS`; `siteOf(s)` puts the class back on plain data.
- **Parties** (`world/parties.js`): lords, bandit bands, patrols, your companions' parties and your own band (`P`) keep soldiers as counts (`o.tc`; yours are `P.troops`). `o.troops` (and a band's `list`) is a read-only view; change soldiers with `add`, `remove`, `removeAny`, `cull`, or by setting `troops`. Each kind's class says how it looks (`look`), whether you can see it (`inView`: nearer in cover) and where it may shelter (`shelterWhy`, `enter`, `leave`; `inside` is the holding's name). Plain data becomes its class with `asParty(o)`. `W.parties` lists every party on the map.
- **Brains** (`world/brains.js`): what each kind does each moment (`think`), on the shared steps of `Brain` (cool-down, sight, meeting you). `updateParties(d)` runs them all.
- **Leaders** (`world/leaders.js`): the hero, lords, companions and bandit chieftains grow by one rule (`Leader`: level × 60 experience a level, disciplines by use); `leaderOf(o)` reads any of them. Leaders fight at the head of their men and can be taken captive (`world/captives.js`).

## State and inventory

Inventory and equipment rules live outside the screens. `Inventory` operates on a record's current bag, with capacity and stacking supplied to it. `EquipmentService` operates on a wearer's gear and an `Inventory`, returning `{ok, reason, moved}` without touching the DOM or logging. Hero and companion commands use the same service; companion slot limits remain explicit. A failed transfer restores both records, including when removing a pack or mount would shrink a full bag. Equipment transfers always return existing items to the bag; only rewards use the loot pile.

`GameSession` resets the live `G`, `P`, and `W` records in place from factories. New game and load share this reset, so missing save fields use defaults and transient input, loot and battle state cannot carry over. Record identity and the player's `Party` prototype survive; saves still contain plain JSON. `session.js` loads after `world/realms.js`, which creates `W`; its commands run after boot has loaded every system.

## Recruitment and talents

`RecruitmentService` owns troop hiring, training, tavern companion hiring, prisoner recruitment, prices and pooled troop XP. Its `quoteHire`, `quoteTraining`, `quoteCompanion` and `quotePrisoner` results drive the buttons and the commands. Commands recheck eligibility before spending anything. A recovering holding cannot recruit, training needs a barracks and a valid upgrade, troops must belong to the holding's roster, and a tavern companion must be available there. These checks also apply to direct action calls that bypass a disabled button. Existing price formulas and normal transfers are preserved.

`TalentService` owns tree connectivity, attribute effects, point spending, refunds, skill slots, finishing-style choices and ability modifiers. `talentsOf(record)` caches one service per live character record. The service receives its nodes, skill definitions, wallet, price and effect functions; its methods return outcomes without logging or touching the DOM. Hero and companion trees remain separate, while refunds retain their existing fee from the player's purse (`15 * P.level`). Learning fills the first free skill slot, and refunding an active clears every slot containing it. UI renderers do not initialize saved slot arrays.

The existing helper names (`takeNodeOf`, `refundNodeOf`, `canTakeOf`, `abilOf`, `hireCost`, `txpGain`, etc.) delegate to the services. The talent command helpers handle messages and hero vital refresh outside the service. Character AI and new-game setup can use those core helpers without depending on the Skills screen. The services hold record references rather than snapshots, so the session reset and save schema from step 1 continue to work.

## Troop operations

`TroopRoster` is the count-based component behind the existing `Party` classes, not a replacement for `Troop` (a unit definition) or another inheritance tree. `partyRoster(party)` follows that record's current `tc` field; the player still stores counts in `P.troops`. Adds, removals, casualty sampling/application and transfers share this implementation. Quantities must be positive safe integers, empty kinds are deleted, and transfers return the number actually moved. `partyTransfer`, `partyTransferAll` and `partyTransferAny` operate on plain or initialized parties, invalidate cached lists/power, and cannot move a roster into itself.

Transfer callers supply the receiving room: player capacity includes companions and wounded, companion parties use their own cap. Automatic companion disband/return intentionally retains the existing policy of bringing everyone back even over the player cap; it drains the old source so it cannot be replayed. Giving soldiers to an already distant companion remains allowed, as before; taking them back still requires proximity. XP stays in the hero's pooled-per-kind system, not a companion/garrison XP pool. Every player roster mutation clamps unusable XP, so stationing, donations, desertion and casualties follow the same rule; load also clamps stale saved XP.

`GarrisonService` owns stationing, local-guard call-ups and paid guard drafting. A holding still saves `gar` as a number: stationing intentionally turns any soldier into one generic defender, and calling one up gives its local melee unit. It does not preserve the stationed unit's type or XP. The last defender remains on the walls, normal capacity checks apply, and partial volunteer drafts are charged only for those actually hired. UI commands only dispatch and describe the result.

## Battle setup

`startBattle(opts)` remains the entry point. It creates a short-lived `BattleSetup` coordinator in `battle/setup.js`: spawn units and leaders, assemble command groups, create fresh battle state, initialize formations/morale/stamina/camera/deployment, then present the HUD. Unit definitions and character stats still belong to `Unit`/`Character`; group commands still belong to `BattleControl`. The coordinator does not enter saved state or introduce another unit inheritance tree.

Construction order matters. Spawning consumes the existing random sequence; a chief already among the enemies is promoted in place; field bounds are measured before obstacles are placed; formations precede deployment. The old global `B` is replaced only once the new state is fully constructed. Simulation remains in `battle.js`, player command routing in `commands.js`, and interactive deployment in `deploy.js`. Both HTML entry points load commands after `battlecontrol.js`, then setup and resolution; calls run only after all scripts have loaded.

`tests/battlesetup.js` compares nine fixed-seed snapshots captured before this extraction, including random-call counts and the subsequent random values. It covers ordinary fights, allied/enemy reinforcements, chief reuse, siege penalties, monsters, tournaments, deployment settings and field-width limits. Fixed geometry isolates structural parity; a separate check uses the actual HUD measurement.

Forward ranged groups keep `face` as their ordered heading and `currentFacing` as their simulation-time firing heading. Their at-rest shooter bodies follow `currentFacing`; slot movement does not steer their firing arcs. A hero's explicit ranged attack updates its group's ordered heading, while ordinary soldiers cannot rotate a group toward a rear target. Pausing and deployment freeze turns; deployment placement snaps to the order. The HUD shows one indicative envelope per group at its median inferred slot anchor, widened by ideal formation frontage. It uses the shortest range in a mixed-range group, while all-around groups retain a circle. The envelope is not a promise that every soldier can hit every point: each attack still checks that soldier's position, ammo, range, arc and obstructions, and hover counts use those actual checks. Formation slots and existing melee, shield-wall and wedge facing rules continue to use the ordered `face` in this stage.

`tests/formationfacing.js` covers simulation-time turns, angle wrap, pause/deployment behavior, isolated duplicate-group envelopes, grouped firing/arc agreement, rear-target discipline and mounted all-around coverage. `tests/visual/formationfacing.js` prepares two same-type archer groups at different headings and a scattered formation for visual review.

### Formation attack targets

An explicit attack selects an enemy formation by its battle group ID, not the lifetime of the clicked soldier. Duplicate troop types remain independent. Soldiers choose nearby opponents within the selected formation; ranged soldiers prefer members in their own range and current firing arc. Immediate close-range self-defence remains possible without replacing the group's order, and crowd alternatives stay within the selected formation. Character duels do not override an explicit formation focus.

The group keeps its attack after the originally clicked member dies. Explicit orders pursue routing or withdrawing members while they remain on the field. Once the entire target is dead, off-field or removed, the attackers Hold at their current position instead of automatically charging another formation; normal local defence/free fire still applies, and an AI captain may issue a fresh order. Ground movement, Hold, withdrawal and general Charge cancel explicit focus. Hero/companion formations follow the same identity rules; genuinely ungrouped actors can still be targeted individually.

`BattleControl.targetGroupId` and `targetUnitId` own the transient order identity. `targetMembers()` resolves living on-field enemies, and `tgt` is a derived representative retained for tactical AI callers, not the authoritative soldier target. Order lines and captain/hero aiming use the surviving formation's centre. Per-soldier range, arc, ammo, projectile collision and morale rules remain unchanged. These battle-only fields do not alter campaign saves. Focused coverage: `tests/grouptargeting.js`; `tests/visual/grouptargeting.js` previews an attack after the clicked soldier has fallen.

## Battle resolution

`battle/resolution.js` owns the short-lived `BattleResolution` coordinator. `finishBattle()` carries the finished field into campaign state: survivor troop XP, recovered ammunition, hero condition, morale context, tournament results and release of `B`. `concludeEncounter(win, lost, kills, auto, slain, retreat, txp)` remains the compatibility entry point for campaign settlement, including auto-resolve callers. A field result hands off to the same settlement implementation.

Settlement preserves its ordering: start collecting loot, synchronize reinforcements, apply medicine and roster losses, settle victory/retreat/defeat, then apply troop XP and show the summary. `heal`, `takePrisoners`, `battleMood`, `BATTLE_MOOD` and `MOOD` live with resolution. Encounter-specific victory rules remain in `encounters.js`'s `ON_WIN` registry and their existing world-system handlers; auto-resolve still computes its result there. Shared XP and loss/text helpers remain available. The coordinator is not saved and does not replace the existing roster, character or encounter models.

`tests/battleresolution.js` captures 15 pre-extraction outcomes: field victory/defeat, escaped/caught/carried retreats, both tournament outcomes, siege and lord victory/defeat, monster loot, direct automatic settlement and the actual auto-resolve entry point. Snapshots cover campaign records, captures, loot and summary HTML, world consequences, messages, random-call counts and subsequent random values. Explicit field fixtures isolate settlement from combat simulation; existing combat and integration suites exercise that connection.

## Player battle commands

`battle/commands.js` owns the existing player-facing selection and command entry points: `rtsUnitAt`, `rtsSelect`, `rtsOrder`, `selectGroup`, `cycleGroup`, `ctrlGroup`, `setOrder`, `toggleFlag`, `setForm` and `formDragTo`, plus their selection helpers and flag labels. These are stateless functions over the active battle, not a second group class. `BattleControl` still implements movement, attacks, queues, pace, flags and formation changes for both players and AI.

The command layer forwards formation eligibility/layout to `formations.js` and zone placement to `deploy.js`. It keeps existing HUD refresh and log calls. The renderer retains `setOrderUI`, drawing, speed and pause controls; `ui/input.js` retains pointer/keyboard events, coordinate conversion, double-click detection, touch routing and camera interaction. No control binding, click threshold, formation rule, AI takeover policy or save field changed during extraction.

`tests/battlecommands.js` captures 19 pre-extraction scenarios with explicit field fixtures: unit/icon picking, Shift selection, boxes, control groups, relative movement, queues, attack targets, pace/hold/withdraw, shooter flags, formations, dragged lines, deployment and empty selections. It also dispatches real browser pointer/touch/keyboard events through the unchanged input listeners. Snapshots include selection, group state, target identities, unit positions, HUD button state, messages and calls to the existing BattleControl methods. Fixed geometry and seeded input isolate commands from combat timing and generated world actors.

## Attack and projectile execution

`battle/attacks.js` owns `applyDmg`, `hit`, troop damage/kill XP, attack cooldown/damage execution, melee follow-through, sidearm blows and dragon breath. It also owns ammunition/accuracy helpers and their existing constants (`AMMO`, `AIM`, `BLADE`). All existing function names remain available to actors, character/manual combat, abilities and effects. Damage still invokes the existing morale, fatigue, roster, character, HUD and VFX systems in its original order.

`battle/projectiles.js` owns `fireBolt`, `arcZ`, `arcStep`, launch constants and `updateProjectiles(dt)`. The latter contains the former inline projectile loop unchanged: arc and flat stepping, tree checks, blocking, web effects, hits/splash and final lifetime/bounds filtering. `updateBattle` calls it after unit movement/collision/clamping and before morale/end checks, inside the same pause/deployment/hit-stop gates. Target choice, shooter draw/reload decisions and monster activation now live in `actors.js`; no actor or commander policy was changed. `combat.js` retains manual hero attack/ability mechanics.

Both HTML entry points load attacks and projectiles after resolution and before character/manual combat. These are plain scripts with runtime cross-system calls, not isolated modules or a new unit hierarchy. Save formats and transient field records are unchanged.

`tests/attackrules.js` captures 26 pre-extraction combat snapshots with explicit units, fixed geometry and fixed random streams. It checks damage reduction/invulnerability, casualties/XP, companion and lord losses, melee/follow-through/sidearms, launch physics, ammunition/accuracy, arc and flat impacts, trees/elf arrows, magic splash, webs, expiry/bounds, pause/deployment/hit-stop gates, guarding and shooter-phase handoff. Snapshots include state, effects metadata and random-call sequencing; generated bystanders are excluded. Existing attacks, manual combat, RTS, biome, matchup and XP suites provide broader integration coverage.

## Actor execution and targeting

`battle/actors.js` owns local target queries, firing arcs, shooter draw/reload execution, troop movement/strikes, crowd retargeting, relocation, monster activation, and the retained `updateHero` manual movement driver. Existing names (`nearest`, `aiUnit`, `shotStep`, etc.) remain available to commanders, groups, attacks, effects and tests. This is a function-based responsibility boundary, not another unit or AI hierarchy.

`updateNonHeroActors(dt)` contains the former non-hero unit loop verbatim: decrement cooldown, delegate characters to `charAuto`, otherwise execute the troop, monster ability and breath timer in their existing order. `updateBattle` calls it at the same point after knockback/buffs/slow/regeneration and before collision/projectile/morale processing. The hero still runs earlier on `rt * HERO_PACE`, while non-hero turns use `rt * BATTLE_PACE`; group stepping and commander decisions keep their original ordering. Pause, deployment and hit-stop gates remain in the coordinator.

Commanders and `BattleControl` retain authority over orders, group facing, formation and tactical choices. No targeting priorities, activation thresholds, random sequencing, pacing or saved/transient record formats changed. Both HTML entry points load actors after projectiles and before character/manual combat. Stale comments describing old hotkeys and an obsolete shooter-target heuristic were corrected without changing executable code.

### Battle boundary audit

`battlecontrol.js` owns `moveOrder`: issuing a new relocation increments the group's `mvId`. `actors.js` owns `relocating`: each actor compares its completed generation with the group's current one. The global helper name remains available; moving its declaration does not change the command API or transient state.

The actor cleanup removed only unreachable code: an always-null automatic-sidearm branch and an always-false face-the-foe movement branch. Moving actors still face their travel direction; explicit Melee Mode still executes `bladeBlow`. Small helpers such as `meleeTarget`, `meleeFoe`, `blowsToFell` and `arcZ` stay because they have test, commander or group consumers. The unused `BattleControl.suggest` method was removed: nothing called it or read the `prefer` field it wrote. Commanders still focus fire through `attack`; otherwise actors select by range and arc. No new targeting policy was introduced.

These files still share live `B`, `G` and `P` records and runtime callbacks. This is an ownership split, not an acyclic dependency graph:

| Owner | Main runtime connections |
| --- | --- |
| `commands.js` / `commander.js` | Issue orders through `BattleControl`; commanders also drive character decisions. |
| `battlecontrol.js` | Owns group order state and relocation generations; uses actor target queries and formation helpers. |
| `actors.js` | Reads orders; delegates character turns, attacks, fatigue and rout/withdraw movement. |
| `attacks.js` | Executes damage/strikes, launches projectiles, and calls morale, XP, character and visual helpers. |
| `projectiles.js` | Advances projectiles and calls damage, guarding, XP and visual helpers on impact. |
| `battle.js` | Sequences group/commander turns, actors, collisions, projectiles, morale and resolution on the existing clocks. |

Keep those callbacks inside runtime functions: load-time calls into scripts loaded later would fail. `tests/structure.js` now checks ownership of the main extracted entry points and the supported battle script order, in addition to duplicate globals and wiki parity. Behavior remains covered by the actor/attack/command snapshots and RTS/character integration suites.

`tests/actorrules.js` captures 23 pre-extraction scenarios for local targeting, arcs, shooter phases, stun/rout/withdraw, ordered-target self-defence, firm hold, relocation, fatigue, crowding, melee mode, cease-fire, regeneration/pounce, manual movement, hero-versus-troop clocks and frame gates. It uses explicit units and fixed geometry/random streams; unrelated generated world state is excluded.

## Formations and unit abilities

Positioning formations are Line, Loose and Wedge. Loose changes spacing only: no arrow resistance or melee vulnerability modifier. Shield wall is a separate **B** ability toggle; old `setForm('wall')` command callers forward to the ability rather than assigning a formation.

Group flags request actions, with eligibility checked per soldier. Shield wall requires shield-bearing, non-ranged, non-mounted, non-charge infantry. An active soldier needs a nearby active-requesting eligible ally within 16 pixels, facing within 60 degrees; dead, routing, stunned, withdrawing or running soldiers cannot support it. Supporting shields may belong to another friendly group. Supported soldiers take 35% less frontal damage and move 40% slower; unsupported shields keep their normal personal frontal missile blocking. Charge and running orders lower the toggle. Other group members gain no wall protection or speed penalty. Shield-wall users hold their ground instead of chasing nearby enemies.

Wedge positioning can be selected below six riders, but the charge bonus starts at **6 formed cavalry: +5%**, increases by **2.5 percentage points per additional rider**, and caps at **+30% at 16**. Only living, non-routing, non-stunned cavalry aligned with the wedge and within 28 pixels of their relative slots count or receive it. Inferred median anchors let the formation move without counting distant stragglers. Casualties remove bonus without forcing a formation change. Existing formation-depth charge resistance remains unchanged.

The HUD shows eligible/active shield counts and the current wedge bonus. Tuning lives in `WALL` and `WEDGE` in `battle/formations.js`. Focused coverage: `tests/formationabilities.js`, existing RTS/command/actor/attack regressions and unit-card/wiki checks. This does not introduce dynamic squads or change the existing rank-based depth model.

## Group morale, confidence and routing

Morale is owned by the **formation**, not the soldier. `BattleResolve` (`battle/morale.js`) holds one morale value, confidence, cohesion, recent-loss strain, missile pressure, breaking timer and route/rally/shatter state per group (`g.resolve`). Ungrouped breakable soldiers get a one-man resolve; `resolveOf(u)` finds either. Soldier fields (`u.mor`, `u.rout`, `u.confidence`, …) are **mirrors** written by `sync()`; writing them changes nothing. HP, armour, shields, ammunition and stamina stay per soldier. Heroes, companions, lords, chieftains and beasts (`steady`) have no resolve and never break.

**Inputs.** Wounds (`hurt`), deaths (`death`), flank/rear blows and charges on any member feed the group. Ratios use the group's **starting** headcount and health, so the same share of losses shakes small and large groups equally. Casualties and wounds also lower the recovery `ceiling()`. Deaths in a short window build **recent-loss strain** (up to `GROUP_RESOLVE.strainCap`), which decays with `LOSS_MEMORY.life`; bursts hurt more than spread-out losses. **Unanswered missile fire** (missile damage in the last `window` seconds, while dealing back less than `answer` of it) drains up to `missileRate` a second and blocks confidence. Per-soldier flank and charge shocks are divided by the group's starting size.

**Context.** Every 0.2 combat seconds (sooner after a death) each group samples three members (left, centre, right along its front) and averages their view: visible, distance-weighted strength within `CONFIDENCE.radius` gives **Confident** or **Outmatched**; close strength or threats on opposite sides give **Locally overwhelmed**; aligned, settled neighbours within `COHESION.radius` give **cohesion**, which softens ordinary and routing shock. Trees and rocks block the view. Confidence (1.25:1 to 3:1) adds up to +12 above the starting value and 30% shock resistance; a withdrawal order, missile pressure, a nearby rout or a fallen leader suppress it.

**Breaking and routing.** At 0 or below the group is **Breaking**: it routs after `RESOLVE.breakDelay` (0.6 s), `severeDelay` (0.25 s) at −10 or worse, or `leaderDelay` (0.2 s) during leader panic. Positive morale resets the episode. All break decisions are made before neighbour shocks are applied, so routs cannot domino in one update. On a route the group's order becomes `'rout'`, its target and queue are cleared, and every `BattleControl` order method returns early; each soldier still escapes on its own (`routStep`). A group left quiet for `rallyQuiet` seconds can rally once (back to Hold); a second rout shatters it. A nearby rout shocks other groups within `routeRadius` at most once per second. Leader death shocks every group of that side and suppresses confidence. Nearby enemy deaths reassure by `killGain`, capped at `killCap` per rolling second and at the ceiling.

**Readers.** The HUD (`grpMorale`, unit cards, badges), the battle lab's morale history and the developer panel all read the resolve. The developer panel only allows editing `group.<id>.resolve.mor`. The enemy commander reads it too: once its strength is under `FOE_CMD.beaten` (0.4) of yours and its formations' shared morale, weighted by men, is under `FOE_CMD.broken` (30), the whole enemy army **falls back** (withdraws off its own edge, logged "The enemy falls back.") instead of fighting to the last man. Once begun it does not turn round; withdrawing groups are left alone by `captainFinish`. Escaped enemies are not kills, as with a rout. Your army (even under AI command), allies, beasts and morale-free battles never fall back on their own (`beatenArmy` in `battle/commander.js`, tests in `tests/groupmorale.js`).

**Unit-level AI morale.** Every captain (the enemy, your allies, your army under AI command) also reads each group's own resolve, tuned by `UNIT_AI` in `battle/commander.js`. (1) An infantry group under `pullAt` (25), with another infantry group of the same captain still steady (`backAt`, 45, not routed, not recovering), **pulls back** `pullDist` (90 px) straight away from the foe's middle and stands there (`g.recover`) until its morale is back to `backAt` or `maxRecover` (15 s) pass; a time-capped group cannot pull back again for another `maxRecover` s. A group with no steady sibling fights on. (2) The nearest steady sibling not already fighting **plugs the gap**: it is ordered once onto the foe nearest the recovering group (`g.plug`) and keeps at him while the other recovers. (3) Cavalry under `chargeAt` (40) **start no new charge** (from the flank, the regroup, a rescue or the ranged-duel ride): they stand off as after a charge until they recover, or at most `cavRecover` (4) s (losses lower the ceiling morale recovers to, so worn riders would otherwise stand off for ever); a charge under way goes on. (4) Cavalry target choice adds `prey` (2) and shooters' focus fire `preyShot` (1.5) for a foe whose group is **wavering**. Groups without a resolve (heroes, companions, leaders, beasts) count as steady and are never weak prey; with morale off (`B.noMorale`) none of this applies. Tests: `tests/unitmorale.js`.

Tuning lives in `MORALE`, `CONFIDENCE`, `AWARENESS`, `COHESION`, `LOSS_MEMORY`, `RESOLVE` and `GROUP_RESOLVE`. Coverage: `tests/groupmorale.js` (shared state, normalisation, routing as a group, rally/shatter, HUD/lab agreement), `tests/moralebalance.js` (kill reassurance, breaking timers), `tests/confidence.js`, `tests/moralecontext.js`, `tests/moraleresilience.js`, and the audits `tests/moraleaudit.js` and `tests/confidenceaudit.js`.

## Battle feedback

**Callouts** (`callout*` in `ui/battlehud.js`, tuned by `CALLOUT`): a short side-coloured banner at the top middle of the field for the big moments: a group routs, is shattered, rallies or is flanked; a leader falls; the enemy falls back (read from `B.fallBack`). Each moment is called once (the same key stays quiet for `same` combat seconds; a flank at most once per group every `flankEvery` s; arrows and steady units never trigger it). At most one new banner every `gap` real seconds, at most two on screen; a burst is cut to a short queue, minor callouts first. Your groups' routs and shatters and a leader's fall also go to the battle log; the enemy breaking is logged once at the end. No callouts in tournaments.

**Screen shake** is drawn only (`shakeView` in `gfx/vfx.js`, tuned by `SHAKE`): `frame()` offsets the view by a sine wobble, never moving `B.cam` and never drawing random numbers. A rider or big beast charging home at momentum over `SHAKE.charge` jolts the view (capped at `SHAKE.max` px, fading over `SHAKE.life` s); one of your groups routing gives a lighter jolt. `SHAKE.on=false` or the system's reduced-motion setting turns it off.

**Unit of the battle**: kills are counted per source group (`B.grpKills`, `applyDmg`); the battle report names your troop group with the most kills (ties: `resolve.damageDealt`). Not shown in tournaments, for heroes and companions, or when none of your groups fought. Tests: `tests/battlejuice.js`.

## Unit abilities

Some groups have a special order with a cooldown (`battle/unitabilities.js`, registry `UNIT_ABILITIES`). The selected groups' abilities are shown at the end of the order bar; a press (or its key) uses it for every selected group that can. A group has an ability when at least half its fighting troops qualify. Durations and cooldowns run on combat time (pausing stops them); a lit button shows the seconds left, a shaded one the seconds until ready, and the tooltip says why one is unavailable.

| Ability | Key | Who | Effect | Lasts | Cooldown |
|---|---|---|---|---|---|
| **Brace** | G | spear and pike infantry | stands fast where it is; the first blow of any charge on its front or flank does half damage; pushes barely move it; any move, attack, advance or withdraw order ends it | 8 s | 40 s |
| **Fire arrows** | I | bow and crossbow archers | shots deal fire damage (magical: armour doesn't stop it; wards and resistances apply), 10% more | 12 s | 45 s |
| **Spur** | U | cavalry | full charge momentum at once and 35% more speed, at a run, for 12 stamina per rider | 3 s | 35 s |
| **Rally** | Y | foot units | +15 shared morale (at most 100) and an end to Breaking; not while routing or with morale off | at once | 60 s |

API for captains: `g.abilities()` lists `{id,active,left,cooldown,why}` (`why===''`: usable now) and `g.useAbility(id)` returns false when refused. Per-group state `g.abil` is non-enumerable (out of snapshots and saves). Tests: `tests/unitabilities.js`. The AI does not use abilities yet.

## Withdrawal balance

W still orders selected groups to leave through your edge, without attacking on the way. Withdrawal now uses the existing fatigue rules: running spends stamina, tired/spent units have their normal speed penalties, and units below `FATIGUE.runMin` can only walk. Slowing effects still apply. The hero pays from the existing hero stamina pool.

On first contact with a live, non-routing melee threat during a withdrawal order, a unit spends `WITHDRAW.disengage` (0.8 combat seconds) disengaging at `WITHDRAW.backstep` (35%) of its current fatigue/slow-adjusted movement speed. This also applies near the exit. A shooter in Melee Mode counts as a melee threat; a ranged-only or routing foe does not. The bounded phase occurs once per withdrawal order, so a close pursuer cannot reset it forever. Repeating W does not reset it; canceling withdrawal and ordering it again requires disengagement again.

Disengaging units remain vulnerable and still do not strike. An uncontested exit remains immediate; no automatic casualties or additional escape roll were added. Existing battlefield losses, campaign escape odds, rearguard losses, morale/renown penalties, allied overlap rules and routing behavior are unchanged. `tests/withdrawal.js` covers these mechanics using isolated battle fixtures; RTS, retreat settlement and flee suites cover their connection to campaign rules.

## Developer console and battle laboratory

Click **DEV** (top right), press **F2**, or press the physical backquote key to open developer tools. Escape closes the window; simulation stops while it is open. Up/Down recalls command history. Tools work from the title screen, world map and battle; teleporting requires the unobstructed world map.

Campaign cheats affect live state and can persist in normal saves. Keep a separate save if you want to undo them. These are explicit commands, not arbitrary JavaScript.

| Command | Effect |
| --- | --- |
| `money 1000` / `money -100` | Add/subtract gold without allowing a negative balance. |
| `where` | Show world-pixel and tile coordinates. |
| `tp 1200 800` / `tp tile 50 60` | Teleport to walkable map coordinates; cancel previous travel/chase. |
| `goto Ashford` | Teleport near a holding; names containing spaces need no quoting. |
| `get player` / `get player.attr` | Inspect campaign state and discover fields. |
| `set player.attr.agi 12` | Edit an existing scalar field. Values use JSON syntax, including quotes for strings. |
| `get game.day` / `set game.day 30` | Inspect state; game writes are limited to day, clock, speed and paused. |
| `units bow` | List matching unit definition IDs. |
| `roster` | List current battle unit IDs, sides, health and positions. |
| `get unit.1` / `set unit.1.s.spd 80` | Inspect a live fighter or override its stats; use IDs from `roster`. |
| `battle hum_bow 5 hum_foot 5` | Start a paused isolated matchup; `battle` alone opens the selection form. |
| `pause`, `step 60`, `restart`, `exit` | Control a battle test. Step advances 1–600 frames at 1/60 second per frame and pauses afterward. |
| `help`, `clear` | Show command examples or clear console output. |

Player edits do not rebuild an already-spawned hero's battlefield stats; edit `unit.<id>.s` to change live stats. Writes cannot replace objects, create arbitrary fields, traverse prototypes, change unit identity/group links, or edit linked shared Unit/campaign objects. Stat edits copy the live stats first so they do not alter the shared unit definitions. Extreme but finite developer values can still invalidate gameplay assumptions; these are debugging tools, not validated progression commands.

The **Battle test** tab builds two armies, each with **1–10 independent groups**, including optional characters. Duplicate troop types stay separate. Add/remove/reorder rows, set counts, names, formations and files (0 = auto). Each troop group permits 1–100 fighters, with a performance limit of **200 fighters per army**. Wedge requires at least six cavalry; formations must fit their field/starting zone. The builder rejects unsuitable formations instead of silently changing them.

Your current hero may occupy one left-side group. Companion choices are independent level-1 templates on either side, with one copy of each companion per army; they do not use or injure your campaign recruits. Characters require count 1. Troop-only tests have no extra fighting hero and do not inherit campaign troop talent/perk bonuses. Both sides start from their own unit kind's base morale. Hero tests use your current build/equipment, including its normal effects on the left army.

Choose terrain, climate, seed, player-side AI, initial pause and morale/routing. **Deploy left army before battle** freezes the field and uses the normal right-click/right-drag placement controls, independently of the campaign deployment preference. The right army deploys automatically in its chosen formations. **Begin** ends deployment; if Start paused is checked, the battle remains paused for stepping. Separation applies when deployment is skipped. The existing `battle hum_bow 5 hum_foot 5` command remains a quick one-group matchup without deployment.

Built-in presets include combined arms, duplicate formations, mounted archers vs footmen, and footmen vs berserkers. Save/load up to 20 named user presets in the separate `ashmark.lab.presets.v1` browser-storage key. Save / replace overwrites only the named user preset; built-ins are read-only. Delete affects only the selected user preset. **Use last test** copies the last successful configuration into the draft. Editing the draft or live stats does not change the configuration used by **Restart**.

The persistent test toolbar offers Play/Pause, Step, Restart, Exit, Tools and **Report**. The report compares each configured group on both sides: surviving, remaining-on-field and dead counts, kills, effective damage dealt/taken, morale samples (recent six shown, older samples in JSON), and route/withdrawal/field-exit timestamps. Routed exits and ordered withdrawals have separate counts and timestamps. Effective damage is post-mitigation HP removed, capped to the target's HP remaining; dodges and overkill do not count. Damage without a configured source is explicitly uncredited. The downloadable JSON includes the normalized configuration and seed, bounded event/morale histories with truncation counts, and a plain final unit snapshot. Survivor counts include living units that exited; kills count lethal damage only. Normal selection, move, attack, facing, speed and formation controls remain available. Escape and the HUD menu open the test tools. Starting a test is allowed from the title screen or unobstructed world map, never over a campaign battle or unresolved choice.

The laboratory swaps `P`/`G` contents for private copies while preserving their record identities, and restores the original nested records, screen and random function on exit. World simulation is not advanced. Saving/loading is blocked during a test; completion freezes the field instead of running campaign settlement, so test rewards, casualties, hero training, ammo and gold edits are discarded. Restart restores the campaign then recreates the same configuration. Seed initializes the existing random stream; exact simulation reproducibility still depends on matching frame/input/render activity.

Implementation: `js/ui/developer.js`, `js/battle/lab.js`; the normal setup and simulation remain in use. `tests/developer.js` exercises commands, real form/keyboard/toolbar events, private stat edits, natural battle completion, restart and restoration, and save/load isolation. `tests/armylab.js` covers independent armies, character templates, validation, deployment, maximum-group setups, restart, presets and actual builder controls. `tests/labdiagnostics.js` covers isolated damage attribution, group metrics, route/withdraw events, morale samples, bounded history and JSON serialization. `tests/visual/developer.js` prepares a desktop/narrow preview (`&tab=console` selects the console); `tests/visual/armylab.js` previews a mixed-army preset and its deployed field.

## Running tests

```
bash tests/run-tests.sh            # every suite
bash tests/run-tests.sh races      # one suite
bash tests/run-tests.sh structure  # the layout rules above
bash tests/run-tests.sh equipment session inventory companions menu structure  # equipment and session regressions
bash tests/run-tests.sh recruitment talentrules talents troopxp reputation progression characters structure  # recruitment and talent rules
bash tests/run-tests.sh rosters parties companions garrison troopxp flee people relations  # shared troop operations
bash tests/run-tests.sh helpers wiki structure  # shared helper contracts and the actual wiki entry point
bash tests/run-tests.sh battlesetup rts reinforce groups characters captives besiege siege  # battle setup and integration
bash tests/run-tests.sh battleresolution loot troopxp captives flee siege besiege reinforce  # field outcomes and campaign settlement
bash tests/run-tests.sh battlecommands input groups rts structure wiki  # player command routing and real input integration
bash tests/run-tests.sh attackrules attacks combat charcontrol matchups troopxp rts biomes  # damage, attacks, projectiles and integration
bash tests/run-tests.sh actorrules rts charcontrol attackrules structure wiki  # focused actor/targeting verification
bash tests/run-tests.sh firingcones rangedfacing  # actual canvas cone angles and ranged-hero move/attack facing
bash tests/run-tests.sh shortmoves  # short-move arrival facing, zero-distance orders and explicit facing
bash tests/run-tests.sh developer input menu session battlesetup battleresolution structure wiki  # developer tools and sandbox isolation
bash tests/run-tests.sh withdrawal actorrules rts charcontrol battleresolution flee battlecommands developer structure wiki  # withdrawal stamina/disengagement and settlement
bash tests/run-tests.sh confidence rts actorrules battleresolution withdrawal battlecommands developer structure wiki  # local morale confidence and bounded routing cascades
```

On Windows, the dependency-free native runner reuses one isolated headless browser with a fresh tab per suite, avoiding repeated Chrome startup delays:

```powershell
.\tests\run-tests.ps1                                      # every suite
.\tests\run-tests.ps1 -Suites rosters,parties,garrison       # selected suites
.\tests\run-tests.ps1 -Suites siege -Seed (1..8)             # reproducible random scenarios
```

`-Browser` selects another Chrome/Edge executable, and `-TimeoutSeconds` controls the per-command/test deadline. Seeded runs reset the random stream immediately before `RUN()`; browser tests can also use `?test=siege&seed=1`. The runner never attaches to an existing user browser and keeps its temporary profile for failure diagnostics.

Each suite runs headless in Chrome or Edge by opening `Ashmark.html?test=<suite>`. The runner exits non-zero if any line starts with `FAIL`, `EXC` or `ERR`. `mapview` also draws the whole map over the page, so `Ashmark.html?test=mapview` is a quick way to look at it. `worldsim` only reports how five 120-day campaigns played out; it never fails on balance. `Ashmark.html?test=visual/perf` prints rough timings of the hot paths (world frame, simulation, battle, daily tick, save).

## Art

Everything is drawn by code (`js/gfx/sprites.js`, `js/gfx/worldart.js`); nothing is loaded from `graphics/`. Buildings on the world map come from the PX engine in `../engine` (see its README and `gallery.html`). Every holding is a set of placed buildings, each on its own tiles of the grid (`js/world/lots.js`): its centre (keep, citadel or hall, whose walls are the holding's fortification: Fortify upgrades it), houses for its people, the buildings of its estates, and fields, pastures and pits flat on the tiles they keep. Realms grow their holdings over time; in your fiefs you place what you build, and it goes up behind scaffolding. Flags are their own animated sprite.

To look at the result, take a screenshot of a prepared scene (`scene` is `world` or `battle`; `town`, `mount` and `zoom` are optional):

```
chrome --headless --allow-file-access-from-files --window-size=1400,880 --screenshot=shot.png "file:///.../Ashmark.html?test=visual/shot&scene=world&town=Skullrock&mount=1&zoom=1"
```

## The screen
One screen, filling the window at a whole-number scale (F11 or the corner button for full screen). Everything lies on it: your
party card top left (day, level, health/stamina/mana bars, gold, food, troops, power, morale; what runs short blinks red), the
minimap top right, a short hint top middle, messages bottom left (they fade; L shows the whole log), the dock bottom right
(Hero C, Skills K, Bag I, Log L, Help H, pause and speed, save, full screen, menu), battle orders bottom middle in a battle.
Hover anything on the map for what it is, its strength against you and what a click does. Fog of war (js/world/fog.js) keeps
what you have explored.
