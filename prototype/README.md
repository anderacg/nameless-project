# Ashmark prototype

Open `Ashmark.html` in a browser. There is no build step and nothing to install.

`wiki.html` is the game reference: world map, biomes, races, realms, holdings, the economy, battle, troops, gear, monsters and life on the map. It loads the game's own data and sprite scripts, so it updates itself whenever the data changes.

## Layout

```
Ashmark.html          page markup; loads style.css and the scripts below, in this order
style.css
js/core/              core.js (DOM, canvas, constants, helpers, the action registry), state.js (G, P, derived stats), save.js
js/data/              tables only, no game logic: races, factions, units, monsters (incl. mythic ones like the dragon), critters,
                      matchups, gear, progression (pasts, skills, perks, companions), tree, places (goods, holdings, camps),
                      economy (estates, walls, production, needs, taxes, caravans), conduct (what deeds cost)
js/world/             the campaign map and everything on it
  map.js territory.js   terrain, climate, pathfinding; each holding's land
  realms.js siege.js    factions, diplomacy and lords; sieges, raids, captures and fiefs
  economy.js estates.js stock, production, prices, treasuries; estates and walls
  folk.js caravans.js   workers in the fields; caravans (realms' and yours)
  refugees.js           people leaving ruined holdings
  conduct.js            charging deeds against a holding (CONDUCT), and the small map dialogs
  monsters.js critters.js events.js sites.js quests.js reputation.js
  world.js              bandits, travel, the daily tick, the world update
js/battle/            encounters.js (dialogs, outcomes by kind: ON_WIN), parley.js (cornered parties), battle.js, combat.js
js/gfx/               worldart.js (the painted map), sprites.js (generated sprites), render.js (world and battle drawing, HUD)
js/ui/                ui.js (panels, title, Esc menu), character, talents, inventory, town, input.js (actions, mouse, keys)
js/main.js            game loop and boot
graphics/             the pixel-art pack (free for personal and commercial use); not used for now
archive/              the single-file version from before the split, and art.js (the sprite-sheet mapping, set aside)
```

The scripts are plain `<script>` files, not modules, so the page still works from `file://`. Their top-level `const` and `function` names are shared across files. The rules that follow (checked by `tests/structure.js`):

- **One name, one place.** Every top-level name is global; a second `function` with the same name would silently replace the first.
- **Load order.** `core/core.js` first, then all of `data/`, then the systems. Code that runs at load time (data tables, event listeners, `onAct` registrations) goes after everything it uses. `wiki.html` loads the same list (minus `ui/input.js` and `main.js`); keep the two in step.
- **Data, not special cases.** Tunable numbers and kinds of things live in `js/data/`. A new monster is a `MONSTERS` entry; one that roams the whole map, like the dragon, adds a `mythic` block. The cost of a deed is a `CONDUCT` entry.
- **Actions.** Every button names an action `prefix-name` (`data-act="cv-buy"`). A system claims its prefix once with `onAct('cv-', caravanAct)`; a second claim throws. Town and encounter actions without a registered prefix are handled in `ui/input.js`.
- **Encounters.** A new kind of fight adds its entry to `ON_WIN` in `battle/encounters.js`: what winning it pays and changes.

## Tests

```
bash tests/run-tests.sh            # every suite
bash tests/run-tests.sh races      # one suite
bash tests/run-tests.sh structure  # the layout rules above
```

Each suite runs headless in Chrome or Edge by opening `Ashmark.html?test=<suite>`. The runner exits non-zero if any line starts with `FAIL`, `EXC` or `ERR`. `mapview` also draws the whole map over the page, so `Ashmark.html?test=mapview` is a quick way to look at it. `worldsim` only reports how five 120-day campaigns played out; it never fails on balance. `Ashmark.html?test=visual/perf` prints rough timings of the hot paths (world frame, simulation, battle, daily tick, save).

## Art

Everything is drawn by code (`js/gfx/sprites.js`, `js/gfx/worldart.js`); nothing is loaded from `graphics/`. The old sprite-sheet mapping is kept in `archive/art.js` for when the pack comes back.

To look at the result, take a screenshot of a prepared scene (`scene` is `world` or `battle`; `town`, `mount` and `zoom` are optional):

```
chrome --headless --allow-file-access-from-files --window-size=1400,880 --screenshot=shot.png "file:///.../Ashmark.html?test=visual/shot&scene=world&town=Skullrock&mount=1&zoom=1"
```
