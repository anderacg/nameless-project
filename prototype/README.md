# Ashmark prototype

Open `Ashmark.html` in a browser. There is no build step and nothing to install.

`wiki.html` is the game reference: world map, biomes, races, realms, holdings, the economy, battle, troops, gear, monsters and life on the map. It loads the game's own data and sprite scripts, so it updates itself whenever the data changes.

## Layout

```
Ashmark.html          page markup; loads style.css, the PX engine (../engine: pixel, buildings, pieces), then the scripts below, in this order
style.css
js/core/              core.js (DOM, canvas, constants, helpers, the action registry), state.js (G, P, derived stats), save.js
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
js/battle/            encounters.js (dialogs, outcomes by kind: ON_WIN), parley.js (cornered parties), battle.js (units, groups and
                      RTS command), combat.js (the hero's manual control: combos, dodge, block, the bow, skills; set aside for now,
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

## What is on the map

Things in the world are plain data (so a save is plain JSON) read through a class for their kind. The class is put back on load.

- **Holdings** (`data/holdings.js`): `HOLDING_TYPES` says what each kind has (people, garrison, patrol, walls, tabs, troops, horses, needs); `Holding` → `Village`, `Town`, `City`, `Castle`. Code asks the holding (`t.T`, `t.label`, `t.has(tab)`, `t.hires(race)`, `t.takesGuests(free)`), never `t.kind==='…'`. A new kind is an entry and, if it behaves differently, a class; `holdingOf(t, kind)` changes a holding's kind.
- **Sites** (`world/sites.js`): every place off the roads. `Site` → `Cave`, `Ruins`, `Shrine`, `TravellersCamp`, and the bandit lairs (`Lair` → `Hideout`, `BanditCamp` on the fixed `CAMP_SPOTS`). Where a kind may stand is static (`ground`, `clear`, `fits`, `point`); what it does is the instance's (`enter`, `panel`, `act`, `day`, `tip`, `box`). A new kind of place is a `SITE_TYPES` entry and a class in `SITE_CLASS`; `siteOf(s)` puts the class back on plain data.
- **Parties** (`world/parties.js`): lords, bandit bands, patrols, your companions' parties and your own band (`P`) keep soldiers as counts (`o.tc`; yours are `P.troops`). `o.troops` (and a band's `list`) is a read-only view; change soldiers with `add`, `remove`, `removeAny`, `cull`, or by setting `troops`. Each kind's class says how it looks (`look`), whether you can see it (`inView`: nearer in cover) and where it may shelter (`shelterWhy`, `enter`, `leave`; `inside` is the holding's name). Plain data becomes its class with `asParty(o)`. `W.parties` lists every party on the map.
- **Brains** (`world/brains.js`): what each kind does each moment (`think`), on the shared steps of `Brain` (cool-down, sight, meeting you). `updateParties(d)` runs them all.
- **Leaders** (`world/leaders.js`): the hero, lords, companions and bandit chieftains grow by one rule (`Leader`: level × 60 experience a level, disciplines by use); `leaderOf(o)` reads any of them. Leaders fight at the head of their men and can be taken captive (`world/captives.js`).

## Tests

```
bash tests/run-tests.sh            # every suite
bash tests/run-tests.sh races      # one suite
bash tests/run-tests.sh structure  # the layout rules above
```

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
