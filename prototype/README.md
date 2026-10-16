# Ashmark prototype

Open `Ashmark.html` in a browser. There is no build step and nothing to install.

`wiki.html` is the game reference: world map, biomes, races, realms, holdings, the economy, battle, troops, gear, monsters and life on the map. It loads the game's own data and sprite scripts, so it updates itself whenever the data changes.

## Layout

```
Ashmark.html          page markup; loads style.css, the PX engine (../engine: pixel, buildings, pieces), then the scripts below, in this order
style.css
js/core/              core.js (DOM, canvas, constants, helpers, the action registry), state.js (state factories, G, P, derived stats),
                      roster.js (TroopRoster, count/list helpers), garrison.js (GarrisonService),
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
                      battle.js (combat simulation), battlecontrol.js (group mechanics), commands.js (player selection and orders),
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

Before removing a global, check both HTML entry points, registered action callbacks, save migration and tests—not only direct function calls in gameplay. `FORM_ORDER` and `LCAP`, for example, are still read by the wiki. Talent, equipment, site and party compatibility helpers with live consumers remain supported. Unused legacy controls and rendering helpers were removed in cleanup step 4; manual hero control and archived/reference assets were not removed. `tests/helpers.js` checks the shared helper contracts and grouped displays; `tests/wiki.js` loads the actual wiki and checks completion, sprites and search, rather than only checking its script list.

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

The existing helper names (`takeNodeOf`, `refundNodeOf`, `canTakeOf`, `abilOf`, `hireCost`, `txpGain`, etc.) delegate to the services. The talent command helpers handle messages and hero vital refresh outside the service. Character AI, new-game setup and old-save migration can use those core helpers without depending on the Skills screen. The services hold record references rather than snapshots, so the session reset and save schema from step 1 continue to work.

## Troop operations

`TroopRoster` is the count-based component behind the existing `Party` classes, not a replacement for `Troop` (a unit definition) or another inheritance tree. `partyRoster(party)` follows that record's current `tc` field; the player still stores counts in `P.troops`. Adds, removals, casualty sampling/application and transfers share this implementation. Quantities must be positive safe integers, empty kinds are deleted, and transfers return the number actually moved. `partyTransfer`, `partyTransferAll` and `partyTransferAny` operate on plain or initialized parties, invalidate cached lists/power, and cannot move a roster into itself.

Transfer callers supply the receiving room: player capacity includes companions and wounded, companion parties use their own cap. Automatic companion disband/return intentionally retains the existing policy of bringing everyone back even over the player cap; it drains the old source so it cannot be replayed. Giving soldiers to an already distant companion remains allowed, as before; taking them back still requires proximity. XP stays in the hero's pooled-per-kind system, not a companion/garrison XP pool. Every player roster mutation clamps unusable XP, so stationing, donations, desertion and casualties follow the same rule; load also clamps stale saved XP.

`GarrisonService` owns stationing, local-guard call-ups and paid guard drafting. A holding still saves `gar` as a number: stationing intentionally turns any soldier into one generic defender, and calling one up gives its local melee unit. It does not preserve the stationed unit's type or XP. The last defender remains on the walls, normal capacity checks apply, and partial volunteer drafts are charged only for those actually hired. UI commands only dispatch and describe the result.

## Battle setup

`startBattle(opts)` remains the entry point. It creates a short-lived `BattleSetup` coordinator in `battle/setup.js`: spawn units and leaders, assemble command groups, create fresh battle state, initialize formations/morale/stamina/camera/deployment, then present the HUD. Unit definitions and character stats still belong to `Unit`/`Character`; group commands still belong to `BattleControl`. The coordinator does not enter saved state or introduce another unit inheritance tree.

Construction order matters. Spawning consumes the existing random sequence; a chief already among the enemies is promoted in place; field bounds are measured before obstacles are placed; formations precede deployment. The old global `B` is replaced only once the new state is fully constructed. Simulation remains in `battle.js`, player command routing in `commands.js`, and interactive deployment in `deploy.js`. Both HTML entry points load commands after `battlecontrol.js`, then setup and resolution; calls run only after all scripts have loaded.

`tests/battlesetup.js` compares nine fixed-seed snapshots captured before this extraction, including random-call counts and the subsequent random values. It covers ordinary fights, allied/enemy reinforcements, chief reuse, siege penalties, monsters, tournaments, deployment settings and field-width limits. Fixed geometry isolates structural parity; a separate check uses the actual HUD measurement.

## Battle resolution

`battle/resolution.js` owns the short-lived `BattleResolution` coordinator. `finishBattle()` carries the finished field into campaign state: survivor troop XP, recovered ammunition, hero condition, morale context, tournament results and release of `B`. `concludeEncounter(win, lost, kills, auto, slain, retreat, txp)` remains the compatibility entry point for campaign settlement, including auto-resolve callers. A field result hands off to the same settlement implementation.

Settlement preserves its ordering: start collecting loot, synchronize reinforcements, apply medicine and roster losses, settle victory/retreat/defeat, then apply troop XP and show the summary. `heal`, `takePrisoners`, `battleMood`, `BATTLE_MOOD` and `MOOD` live with resolution. Encounter-specific victory rules remain in `encounters.js`'s `ON_WIN` registry and their existing world-system handlers; auto-resolve still computes its result there. Shared XP and loss/text helpers remain available. The coordinator is not saved and does not replace the existing roster, character or encounter models.

`tests/battleresolution.js` captures 15 pre-extraction outcomes: field victory/defeat, escaped/caught/carried retreats, both tournament outcomes, siege and lord victory/defeat, monster loot, direct automatic settlement and the actual auto-resolve entry point. Snapshots cover campaign records, captures, loot and summary HTML, world consequences, messages, random-call counts and subsequent random values. Explicit field fixtures isolate settlement from combat simulation; existing combat and integration suites exercise that connection.

## Player battle commands

`battle/commands.js` owns the existing player-facing selection and command entry points: `rtsUnitAt`, `rtsSelect`, `rtsOrder`, `selectGroup`, `cycleGroup`, `ctrlGroup`, `setOrder`, `toggleFlag`, `setForm` and `formDragTo`, plus their selection helpers and flag labels. These are stateless functions over the active battle, not a second group class. `BattleControl` still implements movement, attacks, queues, pace, flags and formation changes for both players and AI.

The command layer forwards formation eligibility/layout to `formations.js` and zone placement to `deploy.js`. It keeps existing HUD refresh and log calls. The renderer retains `setOrderUI`, drawing, speed and pause controls; `ui/input.js` retains pointer/keyboard events, coordinate conversion, double-click detection, touch routing and camera interaction. No control binding, click threshold, formation rule, AI takeover policy or save field changed during extraction.

`tests/battlecommands.js` captures 19 pre-extraction scenarios with explicit field fixtures: unit/icon picking, Shift selection, boxes, control groups, relative movement, queues, attack targets, pace/hold/withdraw, shooter flags, formations, dragged lines, deployment and empty selections. It also dispatches real browser pointer/touch/keyboard events through the unchanged input listeners. Snapshots include selection, group state, target identities, unit positions, HUD button state, messages and calls to the existing BattleControl methods. Fixed geometry and seeded input isolate commands from combat timing and generated world actors.

## Tests

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
