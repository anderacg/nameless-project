# A bigger, seeded world: design

**Status:** **Approved by the owner 2026-10-18 (D1–D39 as recommended).** Final design, revision 3. Phase 0 waves 1 and 2 are built (2026-10-18, §2.2; R15–R17 to come). Written against the working tree of `battle-rts-and-world` (with its uncommitted changes). Phase 0 is ready to launch (§15.1).
**Plan item:** IMPLEMENTATION_PLAN "Deferred: Procedural world (a seeded map)", made active by the owner on 2026-10-18. It also prepares world cliffs, which battles will take their cliffs from (TERRAIN_DESIGN §8).
**Readers:** the owner, whose decisions are recorded in §16, and the developer agents who will build it.

**The owner's decisions so far** (2026-10-18):
- **Scale:** a bigger world at the same 16-px tiles. World-map figures shrink: a person about 10 px tall in a 16 box.
- **Seeded:** a seeded procedural world with a **classic seed** that resembles today's layout.
- **The new space holds:** wild regions, sacred places and natural villages. **No new kingdoms.**
- **No visible shapes:** no circles or blobs; biomes and territories blend.
- **Separate and earlier:** world-map depth sorting and see-through trees and structures.
- **Saves:** v2 only, with no migration code.
- **Cliffs:** the world data is ready for cliffs.
- **Refactor first:** keep clean code and OOP without over-engineering, so nothing is redone.

**Revised in this version:**
- **World size is a new-game option** with three presets (Normal, Large, Huge). Everything is built for Huge from Phase 0. A new §3 covers the technical limits in the browser.
- **Rivers:**
  - big river systems;
  - strategic crossings, toll bridges and ferries;
  - river travel and trade;
  - **seasonal rivers, only for certain small rivers or certain climates.** Big rivers outside frost lands never change.
  - a minimal season calendar;
  - the battle link for river width, crossings and season.
- **Slower, realistic movement:** the party moves visibly slower on screen, a day lasts longer, and walk cycles follow ground speed. This can go in early, in Phase 1, on today's map.
- **A world settings screen at New game** (§4): size, seed, holdings, hamlets, sacred places, wild land, water, rivers, mountains, climate, danger, bandits and economy. It has presets, an Advanced fold-out, a quick preview, validated ranges and a shareable world code.
- **Founding your own holding** (§7): founding sites and free founding; one tier model for every holding (camp → hamlet → village → town → city or castle); your realm from the first camp; an optional settler start; Phase 4b.
- **Loading screens** (§5): one shared overlay (`ui/loading.js`), shown only for waits over 300 ms: generating the world, loading a save, the first paint and big battles. Long tasks become steps that yield, with no change to the simulation (R14, R15 in Phase 0).

---

## 1. What exists today, and what is missing

### 1.1 Today, in numbers

All figures are measured on this tree (`tests/run-tests.ps1 -Suites visual/perf,worldnature,mapview,territory`, headless Chrome) or read from the code.

| What | Today | Where |
|---|---|---|
| Map | **224 × 160 tiles** of 16 px = 35,840 tiles, 3,584 × 2,560 px | `core.js` (`TILE=16, MW=224, MH=160`) |
| Land and water | 32,042 land tiles (89%), 3,798 water. A ring of water at the edge. **No rivers**: water is fbm lakes and seas, crossed by road bridges of at most 3 tiles | `map.js` `genMap` (`MAX_BRIDGE=3`) |
| Terrain | 7,427 forest tiles, 3,871 hill, 552 mountain (5 ranges) | `worldnature` suite |
| Climate share of land | grass 51%, frost 25%, desert 15%, swamp 8% | `mapview` suite |
| How it is made | Value-noise fbm with **fixed seeds** (7, 19, 31), at **script load**. Then patches: each holding **stamps a disc of its climate** (r = 12 tiles); port bays as ellipses; a cleared disc under every holding and camp; necks of land to islands; roads | `map.js` `genMap` (an IIFE) |
| Holdings | **37** hand-placed: 5 cities, 5 towns, 9 castles, 18 villages. Nearest neighbour 20–32 tiles (median 24) | `data/places.js` `TOWNS` |
| Realms | 5 (Vale 8, Karn 7, Sylvan 7, Horde 7, Salt League 8), 20 lords. Owners from a name map (`HOME`) | `data/factions.js`, `places.js` |
| Territory | 22,040 tiles ruled (69% of land), 10,002 wild. Each holding claims land within a travel-cost reach (village 10, castle 18, plus growth) | `territory.js` `computeLand` |
| Wild things | Bandits 30, camps 12 (fixed `CAMP_SPOTS`), monsters 48 at start and 60 at most, critters 96/120, caravans ≤ 72, refugees ≤ 42, ships ≤ 30. Sites: 30 caves, 21 travellers, 24 hideouts, 21 ruins, 18 shrines. All scale with `MAP_DENS = .75 × area/(112×80) = 3` | `core.js`, `sites.js` `SITE_TYPES` |
| Travel | A band of 20 on foot: **about 19–21 px/s on screen** at 1× on open ground (≈ 150 tiles a day); ≈ 27 px/s on a road (≈ 200 tiles a day); all-mounted about 1.5×. A day is **120 real seconds**. Time controls 1×, 2×, 3×. Ashford → Sunreach (162 tiles straight) ≈ 1.1 days | `world.js` `partySpeed`, `travelMul`; `core.js` `DAY_SECONDS`, `WORLD_PACE=.6`; `Ashmark.html` `data-speed` |
| Walk cycle | Map figures switch between 2 frames on a **clock** (`performance.now()/150`), whatever their speed, so feet slide | `render.js` `drawHost`, `drawWorld` |
| Fleeing | Odds come from a **ratio** of your speed to the chaser's (`mySpeed`/`chaserSpeed`) | `encounters.js` `fleeOdds` |
| Seasons | **None.** Only a day counter (`G.day`) | — |
| Ships | Fishing boats and trade cogs on water connected to ports (frozen frost water excluded). **Not saved**: the boats put out again after a load | `ships.js` (`isWater`, `waterIds`, `dockOf`) |
| Sight | `vis()` = 110 px + 8 per Scouting level, × terrain ≈ 7 tiles | `state.js` `vis`, `map.js` `visMulAt` |
| Painting | One full-map canvas, **1.72 s** median paint headless (nature 0.55 s); **35 MB** canvas, plus 35 MB of `ImageData` and a 9 MB `CLEAR` mask while painting | `worldart.js` `paintWorld` |
| Frame | `drawWorld` 3.5–4.0 ms (map blit 0.2 ms, `drawLand` 0.54 ms). `updateWorld` 0.89 ms | `visual/perf` |
| Day | `dayTick` 11 ms (economy 0.9 ms, save 1.4 ms) | `visual/perf` |
| Save | 198 KB per slot, 7 slots in `localStorage`. The map is not saved: it is the same every game | `save.js` |
| Figures | A person is 10 × 15 in a 16 box, **as in battle**. A lord rides a 32-box horse; caravan 64 cell; ships 32 and 64; beasts use battle sprites | `people.js`, `engine/beasts.js` |

### 1.2 What is missing

- **One world, one size.** The map is generated at load with fixed seeds. `MW`/`MH` are constants, and arrays are sized once.
- **Circles you can see.** The climate disc round every holding, the round clearings, the elliptical bays, and territory reach that spreads evenly in all directions.
- **No rivers, no height, no seasons.** Nothing flows, there is nothing to hang cliffs on, and there is no calendar.
- **A full map.** Kingdoms touch; the land between them is leftover, not wild by design. There are no independent villages, and no sacred places worth a journey.
- **Figures as big as houses**, gliding at 1.3 body heights a second with sliding feet.
- **Nothing scales on purpose** (before Phase 0; now `DENSITY` in `data/world.js`). Densities followed area (`MAP_DENS`), so at 4× the area there would be 120 bandits and 288 caravans. About 40 distances are literals.
- **Nothing streams.** One full-map canvas, flow fields per holding as 8 bytes a tile, and every party ticking every frame: none of this survives 8× or 22× the area (§3).

---

## 2. Phase 0: refactors first

The owner's rule: clean code and OOP without over-engineering, so the world work is never redone. **Everything here is built for the largest preset (Huge, 1024 × 768) from the start**, and every step **preserves behaviour**: same tiles, holdings, pictures, saves and fingerprints, byte for byte, in small verifiable steps.

**House constraints** (REFACTOR_PLAN): plain JS, global scripts, no build step, plain-JSON saves, the terse style. Its "Don't do" list applies: no ECS, no state-machine frameworks, no modules, no JSON data files. Global names used hundreds of times (`MW`, `tAt`, `TOWNS`) stay as the stable API; only what sits behind them changes.

### 2.0 The safety net first: world fingerprints

**Step 0.0** adds `tests/worldprint.js` (effort S). It records hashes of:
1. `tiles` and `climate`;
2. `DEPOSITS`;
3. `TOWNS` as JSON after `initWorld` (lots included);
4. `LAND`;
5. the painted world, pixel for pixel;
6. `drawWorld()` at three fixed spots, by day and by night;
7. the save string of a seeded `begin('soldier')` after 3 simulated days;
8. the positions of every party after 600 frames of `updateWorld`.

It runs under `-Seed 1`. Every Phase 0 step must reproduce all eight.

### 2.1 The audit

| # | What would cause rework | Where (file:function) |
|---|---|---|
| a | **The world is built at script load**, with fixed sizes. `genMap` and the deposits are IIFEs. Arrays sized `MW*MH` are made at load (`tiles`, `climate`, `LAND`, `OCC`, `DEP_AT`), and so is the minimap (`const miniCv=mkc(...)`). `MW`/`MH` are constants. | `map.js` `genMap`; `resources.js`; `territory.js`; `lots.js`; `sprites.js` `miniCv`; `core.js` |
| b | **Tile data is two bare globals** (`tiles`, `climate`), read directly in 11 files (85 sites) beside the accessors (`tAt` 65 uses, `terrAt` 23, `climAt` 34). There is no home for new layers (elevation, rivers, flow, cliff edges, regions). | `map.js` and 10 readers |
| c | **Holdings are created by `places.js` at load**: the literal, `holdingOf`, load-time price loops, `x`/`y`. Owners come from `HOME`, the start from `START_TOWN`. `TOWNS[0]` is the default start (`main.js`) and the reach origin (`map.js`, `sites.js` `siteSpot`, `quests.js`). Companions name towns (`progression.js` `COMPS.town`). | `places.js`; `realms.js` `initWorld`; `session.js` `begin`; `main.js` |
| d | **Caches with no reset.** `FLOW`, `WATER_ID`, `landSig`/`landMini`, `mapCv`, `CLEAR`, `NATURE`, `fogMini`, holdings' `_res`/`_spots`/`_can`. | `map.js`, `ships.js`, `territory.js`, `sprites.js`, `worldart.js`, `fog.js`, `resources.js` |
| e | **Painting is one full-map canvas**, with one full `ImageData` and a byte-per-pixel `CLEAR` mask, and `PX.worldNature` paints the whole map at once. At Huge that canvas would be 805 MB. | `worldart.js` `paintWorld`; `engine/worldnature.js`; `sprites.js` `worldCv`; `render.js` `drawWorld` |
| f | **Routing is a flow field per holding**: Float64, every tile, all kept (`FLOW`), plus `findPath` boxes. Reachability is tested with `flowTo(TOWNS[0])`. At Huge one field is 6.3 MB and takes about 0.3 s. | `map.js` `flowTo`, `travelTo`, `routeTo`, `findPath`; `sites.js`; `quests.js` |
| g | **Every party ticks every frame**, wherever it is. Cost would scale with everything in the world. | `world.js` `updateWorld`; `brains.js` `updateParties`; `monsters.js`; `critters.js`; `ships.js` |
| h | **Territory is computed and drawn in one file**, recomputed in full, with an Int8 owner per tile (at most 127 holdings; Huge has about 200). It draws with a per-frame loop over every tile in view. | `territory.js` |
| i | **Distances, densities and speeds are literals.** About 40 radii (lord dread 70 px, band camp 220 px, monster lair 60/140/200 px, caravan range 10–90 tiles, friendly cap 50 tiles, pacify 35, war front 60, reputation 15, siege 20, shelter 48 px, `RES_RANGE`, `HOME_RANGE`, elven woods 10 tiles…). Step sizes are written as `26*mul*d`, `16*d`, `12*d`, `10*d`, `CARAVAN_SPD`, `REFUGEE_SPD`, `SHIP_SPD`… across 10 files. There is no single lever for on-screen speed. | `brains.js`, `caravans.js`, `monsters.js`, `critters.js`, `refugees.js`, `patrols.js`, `ships.js`, `folk.js`, `world.js`, `territory.js`, `estates.js`, `reputation.js`, `events.js`, `siege.js`, `data/economy.js`, `battle/terrain.js`; `core.js` `MAP_DENS` |
| j | **`WorldObject` leftovers** (REFACTOR_PLAN item 9). Fights are drawn by `drawFights`. The minimap walks five lists by hand. | `fights.js`; `render.js` |
| k | **The save** builds the world part as an inline literal, with holdings as a positional array. The map is not identified. | `save.js` |
| l | **Walk cycles run on the clock**, not on distance, in at least six draw paths. | `render.js` `drawHost`/`drawWorld`; `parties.js` `draw`; `critters.js`; `caravans.js`; `folk.js`; `refugees.js` |
| m | **Long work runs inside one frame**, freezing the page: the full world paint at the first `drawWorld`, the battle ground painted lazily in the first `drawBattle` (up to 640 ms), `begin` and `loadGame` in one go. There is no loading overlay (§5). | `sprites.js` `worldCv`; `render.js` `drawBattle`; `setup.js` `BattleSetup.start`; `engine/ground.js` `PX.battleGround`; `session.js` `begin`; `save.js` `loadGame` |
| n | **Battle layers are full-field canvases.** A field keeps up to five canvases the field's full size: the climate arena (`paintArena`, cached by `arenaFor`), the painted ground, the canopy layer for big woods zoomed out, blood (`goreLayer`) and shooter reach (`rangeLayer`). A huge field (3200 × 1800) is 23 MB a canvas: about 88 MB for ground, canopy, blood and reach, plus the arena. The ground is painted in one go (up to about 640 ms). | `gfx/worldart.js` `paintArena`; `gfx/sprites.js` `arenaFor`; `engine/ground.js` `PX.battleGround`, `PX.battleCanopy`; `gfx/vfx.js` `goreLayer`; `ui/battlehud.js` `rangeLayer`; `gfx/render.js` `drawBattle`, `drawInView`, `lodStep` |
| o | **The battle reads world globals directly.** `battleEnv` and `terrainAt`/`terrainEdges` read `tAt`, `climAt`, water, road bridges, neighbours and elven towns. `coverAt` and `bridgeNear` do the same, and `fieldSize` reads `regionAt`. Every new world feature (rivers, seasons, elevation, cliffs, regions, the salt) would mean editing the battle generator in several places. | `battle/setup.js` `battleEnv`, `groundSpec`, `fieldSize`; `battle/terrain.js` `terrainAt`, `terrainEdges`, `TERRAIN_DENSE.elfR`; `battle/encounters.js` `bridgeNear`, `coverAt` |

### 2.2 The refactors

**S** is about one agent session, **M** two or three, **L** four or more.

| # | Refactor | Problem | Change | Effort | Proof it changes nothing |
|---|---|---|---|---|---|
| **R1** | **`WorldMap` holds the layers, at any size** | (a), (b) | New `world/worldmap.js`: `class WorldMap{constructor(w,h,seed)}` owns `kind` and `clim` (later `temp`, `moist`, `elev`, `feat`, `edge`, `region`, `flow`, `river`) and small accessors. `useWorld(map)` installs it: it sets `MW`/`MH` (now `let`) and allocates every per-tile array **there**, never at load. `tiles`/`climate` stay as read-only aliases for the hot loops. `tAt`/`terrAt`/`climAt`/`passable` keep their names. `LAND` becomes Int16. | M | Hashes 1–8; the full sweep |
| **R2** | **Generators are functions** | (a) | `genMap` becomes `genClassic(map, places, camps)`; the deposits become `genDeposits(map, holdings)`. `installClassic()` runs them at load, as today, so the wiki and tests see a map. | S | Hashes 1, 2, 5 |
| **R3** | **One world-reset hook** | (d) | `onWorld(fn)` beside `onAct`: each module registers its reset; `useWorld` calls them. | S | `begin` twice in one page equals a fresh page |
| **R4** | **A holdings factory** | (c) | `places.js` keeps data only: `CLASSIC_PLACES` (with `realm`), `CLASSIC_CAMPS`. `makeHolding(data)` does `holdingOf`, prices and `x`/`y`. `setHoldings(list)` fills `TOWNS` in place. `capitalOf(race)` replaces `START_TOWN`; `startHolding()` replaces `TOWNS[0]`; `compTown(id)` falls back to the people's capital. **Ready for founding and tiers (§7):** `addHolding(data)` appends a holding made at runtime (`makeHolding`, unique name, `onWorld`-style notice to territory and lots). Holdings are never spliced out: a lost camp is marked `gone`, so indices into `TOWNS` (`LAND`) stay stable. Every `HOLDING_TYPES` entry gains `tier` (0–4) and `next` (all values for today's four kinds; no behaviour reads them yet). | M | Hash 3; `holdings`, `economy`, `factions`, `companions`, `session` |
| **R5** | **One scale table, one movement lever** | (i) | New `data/world.js`: `WORLD_SCALE` (named distances in groups: `sight`, `ai`, `econ`, `law`, `land`, `battle`) and `DENSITY` (explicit caps **per preset**: the classic entry holds today's numbers; `MAP_DENS` retired). **Movement:** one helper `moveStep(px, d)` (= `px*d*WORLD_SCALE.move`, with `move` = 1 now) replaces every step expression (`26*mul*d`, `partySpeed(...)*d`, `16*d`, `12*d`, `10*d`, the caravan, refugee, ship, patrol and critter speeds, and the player's step in `updateWorld`), about 25 sites. **Flee odds and chase decisions keep reading the unscaled paces**, so a change of on-screen speed never changes who outruns whom. Arrival and touch radii (8–14 px) stay where they are: they follow the figure, not the world. | M | Hashes 7, 8; `pace`, `flee`, `caravanparty`, `brains`, `monsters`, `territory`, `patrols`, `events` |
| **R6** | **A streaming painter in chunks** | (e) | **Engine:** `PX.worldNature` splits into `PX.worldNaturePlan(spec)` (global data: trees, rises, range height fields, decor, wood masses; all fit at Huge) and `PX.worldNaturePaint(plan, rect, D)`, which draws one rectangle with an apron (64 px up, 32 to the sides). **Game:** `worldArtPlan()` (data, and `CLEAR` as tile flags plus rectangles); `paintChunk(cx, cy)` makes a 512 × 512 canvas; `WorldArt` keeps an **LRU** of chunks, paints the ones in view, **prefetches** in the direction of travel, and paints in **time slices** (≤ 4 ms a frame). Its `draw(ctx, cam)` blits the chunks in view. **The minimap is built from tile data at low resolution** (1 px per k tiles), never from the painting. Today's map: all 35 chunks painted at load, as now. | L | Hash 5 (stitched chunks equal today's canvas pixel for pixel; streamed equals eager); `worldnature`; `visual/perf` |
| **R7** | **Territory: model, state, art; incremental** | (h) | `landCost(i)` is the only cost model (Phase 3 swaps it). `computeLand` fills `LAND` and border bits `LAND_EDGE`. **Incremental:** when one holding's owner or reach changes, only the holdings whose reach box touches it are recomputed. `drawLand` reads the border bits. | M | Hash 4 and the draw hash; a test that incremental equals full after 200 random changes; `territory` |
| **R8** | **Finish `WorldObject`** (item 9) | (j) | `Fight` is a `WorldObject`. The minimap draws `worldObjects()` by a `mapLayer` getter (today's order). | S–M | Draw hash; `clicks`, `fights`, `worldobject`, `worldobjects2` |
| **R9** | **Holdings save themselves** | (k) | `Holding.saveRec()` and `loadRec(x)` produce today's tuple. `worldSave()`/`worldLoad()` gather the world part. **No change to the save's shape in Phase 0.** Shaped for v3 (§9.3): a holding that is not in the generated list (`founded`) will save its base record too (name, races, kind, tile, seed, style, prices), and every holding its current kind, so `loadRec` remakes founded holdings with `makeHolding` and puts tier changes back with `holdingOf` | S | Hash 7 |
| **R10** | **Sites' counts from the table** | — | `genSites` reads `DENSITY` and the world's camps. Sacred places will be `Site` subclasses in `SITE_CLASS`. | S | `sites`, `campbands` |
| **R11** | **One router** | (f) | `world/router.js`: `Router.travel(o, goal, step)`, `Router.reach(a, b)`, `Router.days(a, b)`. In Phase 0 it wraps today's code exactly (`flowTo` fields, `findPath`, `clearLine`). Reachability uses a **component label per tile** (one flood fill), not a flow field. Phase 2 swaps in the two-level router (§3.6) behind the same three calls. | M | Hash 8; `routes`, `mapview`, `sites`, `quests`, `brains` |
| **R12** | **Level-of-detail hooks** | (g) | `WorldObject.tier` (`near`/`mid`/`far`) is set every 0.5 s from the distance to you. `updateParties`/`updateMonsters`/`updateCritters`/`updateShips` call `think` by tier: near every frame, mid every 4th frame with 4× `d`, far through `farStep(d)` (by default the same as `think`). Daily jobs (`econDay`, `caravanDay`, `landDay`) gain a slice option (1/8 of holdings a frame). In Phase 0 the tier radius is infinite, so everything is near and nothing changes. | S–M | Hash 8; `visual/perf` |
| **R13** | **Walk cycles by distance** | (l) | `walk()` adds the distance moved to `o.wd` (not saved). Each figure's frame comes from `frameOf(o, stride)` (= `floor(o.wd/stride) % n`, 0 standing). In Phase 0 a stride equal to today's clock rate at today's speed is too fiddly to match; instead this step **adds the helper and the field only** and switches the draw paths in Phase 1 with the new figures. | S | Hash 8 (positions unchanged); draw hash unchanged (not yet used) |
| **R14** | **A loading overlay and a step driver** (§5) | (m) | `ui/loading.js` (`loadingShow`, `loadingStep`, `loadingHide`, `runSteps`), `LOADING.sync` for tests, `G.mode='loading'` (no simulation, no random-drawing effects while it runs), `begin`/`loadGame` shaped as steps | S | Hashes 1–8 with sync on; sync equals async (`tests/loading.js`) |
| **R15** | **Battle setup and ground painting as steps** (§5.3) | (m) | `PX.battleGroundSteps` (`PX.battleGround` runs it to the end); `BattleSetup.start` as steps; the ground painted at setup, not in the first frame. By the battle agent, after REFACTOR items 11 and 13 | M | Every battle fingerprint; the ground pixel hash on 24 fields; `Math.random` count before the first frame |
| **R16** | **A chunked battle ground** | (n) | The ground is painted **in 512-px tiles** from the plan R15 makes. **Engine:** `PX.battleGroundPaint(plan, rect)` paints one tile with an apron, and the arena's noise is painted per tile, so there is no full arena canvas. **Game:** `BattleGround` keeps the visible tiles plus a one-tile margin in an **LRU** (≤ 16 tiles, 16 MB), as the world map will (R6). Below zoom ×0.5 it draws a **half-resolution overview** (5.8 MB on a huge field) built once from the tiles. **Blood** goes in per-tile canvases made only where blood falls. **Shooter reach** is drawn into a view-sized canvas. **The canopy layer** (zoom < ×0.9) is kept at **half resolution**. Works with R15 (setup as steps: the first tiles are painted inside the steps) and R14 (the overlay shows only if setup passes 300 ms). By the battle agent, after R15 | M–L | On normal fields (today's 1100 × 600 and the sized fields under 2,000 trees, which never use the canopy) at zoom 1: **pixel hashes identical** on the 24-field set, blood and reach included. **Battle fingerprints byte-identical.** `visual/fieldperf` reports memory and time: **25–35 MB on a huge field** (about 88 MB today), and a first frame needing only the tiles in view or the overview (about ¼ of today's 640 ms on the largest field). Zoomed-out pixels on huge forests change (half-resolution canopy and overview): recorded with the reason |
| **R17** | **A `BattleSite` hand-off** | (o) | `WorldMap.battleSite(tx, ty)` (R1) builds one small plain object: the tile and its 8 neighbours (kinds, climates), the environment (`t`, `c`), water near, the road and any road bridge within reach, elven towns near, and the world's salt. It has room, set to null in Phase 0, for what later phases add: elevation and terraces, rivers (width, flow, crossings, the bridge), season state, cliff and escarpment edges, deep forest and region bias. `battleEnv`, `terrainAt`, `terrainEdges`, `coverAt`, `bridgeNear` and `fieldSize` read **only** the `BattleSite`. The lab builds one from its own spec (`labSite`). `TERRAIN_DENSE.elfR` is read from `WORLD_SCALE.battle`. By agent A, after R1 and R15 | S–M | New `tests/battlesite.js`: for **every tile of the classic world**, the recipe, code, river, edges, road and cover computed through the `BattleSite` equal today's direct reads. **Battle fingerprints byte-identical**; `fieldvariety`, `terrain`, `battletypes`, `aiterrain`, `routing`, `roads`, `battlesetup` pass |

**Not proposed** (over-engineering for this work):
- an entity system;
- a plugin system for generator stages (they are plain functions in one file);
- typed config objects;
- rewriting the 200+ `tAt`/`MW` call sites;
- a worker thread (Chrome blocks workers loaded from `file://`);
- streaming tile data (all tile data fits in memory even at Huge, §3.2; only pixels stream).

**Order and split** (5 agents at most, by file; full launch plan with file lists and checks in §15.1):
- **Wave 0:** `tests/worldprint.js` and its baseline, alone and first.
- **Wave 1:** R1+R2+R3 (A); R4 (B); R6 (C); R5 except `core.js`, `ships.js` and `territory.js` (D); the battle agent on REFACTOR items 11 and 13. **Done 2026-10-18:** R1–R6 and battle items 11 and 13, merged with their seams (`capitalOf`/`startHolding` at the call sites, `installClassic` making the classic holdings, `compTown` everywhere, the companion radii in `WORLD_SCALE.ai`, `FIEF0` on `onWorld`, `WorldArt.invalidate` on `onWorld`). W5 and W6 were re-recorded on purpose: begin now repaints the world and the minimap for its own lots (they were the title screen's). **Left for wave 2:** D's `core.js` `MAP_DENS`/`BANDITS`/`MONSTER_CAP` from `density()`, `ships.js` `SHIP_CAP` and `moveStep`, `territory.js` `land.friendly`/`pacify`; C's `render.js` switch to `WorldArt.draw` and `WorldArt.mini` (E); `sites.js` and `quests.js` `TOWNS[0]` to `startHolding()` (A).
- **Wave 2**, once wave 1 has landed: R10+R11+R12+R13 (A); R9+R14 (B); R7+R8 and R5's territory constants (E); R5's `core.js` and `ships.js` lines (D); R15 (the battle agent). **Done 2026-10-18:** R7–R14, merged with their seams. A: the sites' counts and `SHIP_CAP` from `density()` (R10); `world/router.js` (R11), the workers and refugees walking by `Router.travel` too; the tiers (`WORLD_LOD`, `lodTick`, `lodEach`), inert while their reach is infinite (R12); `WALKED` and `frameOf`, not yet drawn (R13). B: `saveRec`/`loadRec`/`fromRec`, `worldSave`/`worldLoad` and founded holdings (R9); `ui/loading.js` with `runSteps`, `begin` and `loadGame` as steps (R14; C's `runSteps` in `worldart.js` is now `runGen`). E: `landCost`, `LAND_EDGE`, incremental territory (R7); `Fight` a `WorldObject`, listed last in `worldObjects()` (it has no pick and no dot, so clicks and the minimap are as before), the minimap's dots from `worldObjects()` by `MAP_LAYER` (R8); `territory.js` `land.friendly`/`pacify`; `render.js` drawing the map by `WorldArt.draw` and the minimap by `WorldArt.mini` (the `miniCv` getter is gone). D's `core.js` step also done (2026-10-18): `BANDITS`, `MONSTER_START`, `MONSTER_CAP` are read from `density()` in `data/world.js`; `MAP_AREA`/`MAP_DENS` and `SITE_TYPES.count` are retired (the wiki and tests read `density().sites`). **Left:** R12's daily-job slicing (`econDay`, `caravanDay`, `landDay`); R15–R17.
- **Wave 3**, once wave 2 has landed: R17 (A, needs R1 and R15); R16 (the battle agent, after R15).
- **Phase 0 total: L**, about 18–21 agent sessions, mostly in parallel.

### 2.3 The battle side

The queued battle refactors touch only `js/battle/*` and `ui/battlehud.js`:
- item 11, the battle event hook;
- item 13, a readable battle tick;
- item 18, retiring the per-soldier morale mirrors.

The world work touches battle code only in `terrain.js` (`terrainAt`, `terrainEdges`: new optional reads, §13) and `encounters.js` (`bridgeNear`, `coverAt`).
- **Items 11 and 13:** run **alongside** Phase 0, with their own agent. Their proof is the battle fingerprints, which Phase 0 never moves.
- **Item 18** re-records fingerprints on purpose: run it **before or after** Phase 0, never during, so each fingerprint change has one cause.

---

## 3. World size: presets and technical limits in the browser

### 3.1 The presets

The owner asked how big the HTML/JS can go. The answer: about **1024 × 768 tiles** is the practical ceiling (§3.9). Size becomes a new-game option on the world settings screen (§4), along with a custom size within the same limits:

| Preset | Tiles | Area vs today | Pixels | Default for |
|---|---|---|---|---|
| **Normal** | 448 × 320 = 143,360 | 4× | 7,168 × 5,120 (36.7 Mpx) | Phones; **the classic seed** |
| **Large** | 640 × 448 = 286,720 | 8× | 10,240 × 7,168 (73.4 Mpx) | Desktop |
| **Huge** | 1024 × 768 = 786,432 | 21.9× | 16,384 × 12,288 (201 Mpx) | Desktop only, by choice (D24) |

**The classic seed is fixed at Normal.** It keeps exactly today's 37 holdings and realm sizes, which is what the realm counts at Normal are designed for (§6.1). Large and Huge would need 18–53 extra generated holdings that the tests don't know. Normal is also the cheapest preset to generate and paint in every test suite (about 2 s), and it is the phone default, so classic plays everywhere.

**Every system is built for Huge** (Phase 0 and §3.2–3.8), so no preset needs its own code path. Presets differ only in their numbers (`WORLD_PRESETS`: size, counts, densities).

### 3.2 Tile memory

All tile data stays in memory, as typed arrays. About **24 bytes a tile** in all:
- 10 byte layers (`kind`, `clim`, `temp`, `moist`, `elev`, `feat`, `edge`, `region`, `flow`, `river`): 10 B;
- `LAND` Int16 (2), `LAND_EDGE` (1), `OCC` Int32 (4), `DEP_AT` Int16 (2), `W.seen` (1), water-body id Uint16 (2), reach component Uint16 (2): 14 B.

| | Normal | Large | Huge |
|---|---|---|---|
| Tile data | 3.4 MB | 6.9 MB | **18.9 MB** |
| Plan data for painting (trees, rises, decor lists) | ≈ 3 MB | ≈ 6 MB | ≈ 16 MB |
| The way graph (§3.6) | 0.3 MB | 0.6 MB | 1.8 MB |

Typed arrays of a few million entries are routine in browsers. Memory is not the limit here.

### 3.3 Painting: chunks with an LRU, never a full-map canvas

A full-map canvas is impossible beyond today's size:

| | Normal | Large | Huge |
|---|---|---|---|
| Full canvas would be | 147 MB | 294 MB | 805 MB |
| iOS Safari limit | **16.7 Mpx per canvas** (4096 × 4096), and about **384 MB of canvas memory in total** | | |
| Verdict | over the per-canvas limit at every preset | | |

The streaming painter (R6):

| | Value (all presets) |
|---|---|
| Chunk | 512 × 512 px = 32 × 32 tiles = **1 MB** |
| Chunks in the world | Normal 140, Large 280, Huge 768 (never all painted) |
| In view | The game view is at most about 700 × 400 game px at every window size (`fitScreen`), so ≤ 2 × 2 chunks, or 3 × 2 straddling |
| LRU cache | **32 chunks on a desktop (32 MB), 20 on a phone (20 MB)**, plus border overlays for the chunks in view (≤ 9 MB) |
| Paint time per chunk | ≈ 50 ms headless (today's 1.72 s ÷ 35 chunks), ≈ 30 ms desktop Chrome, ≈ 100 ms on a mid phone. **Sliced at ≤ 4 ms a frame**, so a chunk takes 8–25 frames |
| Prefetch | The ring of chunks ahead in the direction of travel. At the new walking pace (§10.2) a chunk is crossed in about 60 s at 1× or 7 s at 8×, so the next ring (2–3 chunks, ≤ 0.3 s of work) is always ready |
| Jumps (load, a dev teleport, passage arrival) | The chunks in view are painted at once behind a short veil (≤ 0.4 s on a desktop) |
| Seasons | Never repainted: frozen, flooded and dry rivers are a cheap overlay drawn each frame on the river tiles in view (§12.1) |

### 3.4 Minimap, full map and fog

| | Normal | Large | Huge |
|---|---|---|---|
| Minimap (built from tile data, not pixels) | 224 × 160 (1 px per 2 tiles) | 214 × 150 (1 per 3) | 256 × 192 (1 per 4) |
| Build time | ≤ 10 ms | ≤ 15 ms | ≤ 25 ms; rebuilt only when land, fog or a season's rivers change, ≤ 2 a second |
| Full-map window | 448 × 320 at 1 px a tile | 640 × 448, scrolls | 512 × 384 at 1 px per 2 tiles, zoom to 1:1 by region |
| Fog in memory | 0.14 MB | 0.29 MB | 0.79 MB |
| Fog in the save (bits, then run lengths, base64) | ≈ 5 KB typical, 25 KB at worst | ≈ 8 / 45 KB | ≈ 15 / 100 KB |

Explored land is contiguous, so run lengths shrink it about 5× compared with today's plain bits.

### 3.5 Simulation: cost follows entities, not area

Cost follows the number of things in the world, and the counts are capped per preset (§10.6). They grow about 3.5× from Normal to Huge, not 5.5×.

**Level of detail (R12):**

| Tier | Who | How often | How they move |
|---|---|---|---|
| **Near** | Within 1.5 views (≈ 600 px) of you | Every frame | As today: tile by tile, chases, meetings |
| **Mid** | Within 2,048 px (4 chunks) | Every 4th frame, with 4× `d` | As today, coarser |
| **Far** | Beyond | `farStep` once per game hour (1/12 day) | Parties follow their route by time. No tile walking or collisions: they jump along the route by speed × time. Two far parties that meet on a graph node or edge are resolved by `fights.js`' auto-resolve. Monsters and critters stay at home (they only wander near you). Folk are not spawned (as now). Ships and barges follow their routes by time |

**Daily jobs** are sliced over the first frames of the day (`econDay` for 1/8 of the holdings a frame), so a 200-holding Huge world never hitches.

**Targets:**

| | Normal | Large | Huge |
|---|---|---|---|
| Entities (parties, beasts, herds, ships) | ≈ 700 | ≈ 1,150 | ≈ 2,400 |
| `updateWorld` per frame | ≤ 2 ms | ≤ 2 ms | ≤ 2.5 ms |
| Daily jobs (summed, sliced) | ≤ 25 ms | ≤ 35 ms | ≤ 60 ms (≤ 6 ms in any frame) |
| `computeLand` (incremental, R7) | ≤ 20 ms per change | ≤ 25 ms | ≤ 40 ms |

Only near and mid entities cost per frame: at Huge about 150 near and 250 mid at ¼ make about 210 entity-ticks a frame, against about 300 today.

### 3.6 Pathfinding at Huge: two levels and a cache

Today's flow field per holding is Float64 over every tile: 6.3 MB each at Huge, about 0.3 s to build, for about 200 holdings. Phase 2 swaps it, behind R11's `Router`, for a router that works the same at every preset:

1. **The way graph**, built at generation:
   - **Nodes:** holdings' gates, hamlets, road junctions, both ends of every bridge, ford and ferry, river landings and ports, sacred places, camps, and **chunk portals** (the middle of each passable run along every chunk border).
   - **Edges:** road and track runs (cost = travel time); river legs for boats (one cost downstream, another upstream); portal-to-portal costs inside each chunk, from a bounded Dijkstra over its 32 × 32 tiles, computed lazily and cached per chunk.
   - **Size:** about 1.5k nodes at Normal, 3k at Large, 8k at Huge, with about 3 edges per node.
2. **A\*** on the graph for long trips: ≤ 2 ms at Huge, cached by node pair (LRU of 1,024 pairs).
3. **Local A\*** (today's `findPath` with its box) from the start to the first node, along each leg (within 2 chunks: ≤ 0.3 ms), and from the last node to the goal.
4. **Seasons and events toggle edges:** a ford closed by a flood, a dry riverbed open, a burnt bridge. Local A\* also reads each tile's seasonal passability (frozen water is walkable), so the player can cross the ice. AI routes keep to the graph: lords don't plan over ice, but a band near you may chase you across it.
5. **Travel days** between any two places (`Router.days`) come from graph costs. AI targets (§11) and the caravan range use them.

### 3.7 Generation time and memory

Generation runs on the main thread in stages, behind a **"Forging the world…" screen** with a bar and the stage's name ("Raising mountains", "Carving rivers", "Founding holdings", "Laying roads"). It yields every ≤ 50 ms so the page never freezes.

| | Normal | Large | Huge |
|---|---|---|---|
| Desktop | ≤ 2 s | ≤ 4.5 s | ≤ 12 s |
| Mid phone | ≤ 5 s | ≤ 11 s | ≤ 30 s (not offered on phones by default, D24) |
| Peak memory while generating (Float32 working fields: elevation, warps, moisture, temperature, flow, distances; the flood queue) | ≈ 12 MB | ≈ 25 MB | ≈ 65 MB |

**Stage costs at Normal on a desktop (estimates):**

| Land | Elevation | Climate | Drainage and rivers | Forests | Regions | Holdings | Roads | Territory | Way graph |
|---|---|---|---|---|---|---|---|---|---|
| 80 ms | 200 | 150 | 250 | 80 | 150 | 250 | 500 | 150 | 150 |

Larger presets scale roughly with tiles × log(tiles).

### 3.8 Save size per preset

A save is the seed plus the changes, not the map (§9.3).

| | Normal | Large | Huge |
|---|---|---|---|
| Holdings (with lots), sites, parties, fog | ≈ 320 KB | ≈ 480 KB | ≈ 950 KB |
| 7 slots, plain JSON (`localStorage` ≈ 5 MB, shared by every `file://` page) | 2.2 MB: fits | 3.4 MB: tight | 6.7 MB: **over** |
| Gzipped (`CompressionStream`, built into Chrome, Edge, Firefox and Safari 16.4+), base64 | ≈ 60 KB | ≈ 90 KB | ≈ 180 KB |

**Recommendation (D8):** store every save gzipped, falling back to plain JSON where the browser lacks `CompressionStream`. Without that API, Huge is not offered.

### 3.9 The practical ceiling

| Limit | At Huge (1024 × 768) | At 2048 × 1536 (4× Huge) |
|---|---|---|
| Generation | 12 s desktop, 30 s phone | ≈ 50 s desktop; phones time out or are killed |
| Generation memory peak | 65 MB | ≈ 260 MB: phones crash |
| Tile data | 19 MB | 75 MB |
| Save (gzip) | 180 KB | ≈ 700 KB, 7 slots near the quota |
| Travel across by road | ≈ 10 days (§10.2) | ≈ 20 days: no longer fun |
| Content needed (holdings, hamlets, sacred places, sites) | ≈ 1,000 places | ≈ 4,000: names and variety thin out |

Neither canvas size (painting is chunked), typed arrays nor pixel coordinates is the limit. **Generation time and memory on phones, the save quota, and fun all point to about 1024 × 768 as the ceiling.**

---

## 4. New game: world settings

The owner: "during new game can we set a parameter so we can select how big the map is, how many holdings we want to generate, provide map seed info, and other parameters that you require to generate the world."

### 4.1 The settings

The list is kept to knobs that change the world in ways you would notice. Every value is validated, and the ranges are listed below.

| Setting | Choices (default in bold) | What it changes in the generator | Range and clamp |
|---|---|---|---|
| **Size** | **Normal** (phones), **Large** (desktop), Huge (desktop), Custom | `w × h` (§3.1) | Custom: width 320–1024 and height 224–768, in steps of 32 (one chunk); width ÷ height between 1.2 and 1.6; at most 286,720 tiles on phones (Large) and 786,432 on desktops (Huge) |
| **Seed** | Typed text, **Random**, or pasted from a **world code** | Every stage's stream (§8.1) | Up to 24 characters, hashed to 32 bits; empty means random |
| **Realm holdings** | A number. **37** at Normal, **55** at Large, **90** at Huge | Holdings placed per realm (§8.8). Shared among the five realms in today's ratio (8/7/7/7/8); lords follow (about 1 per 1.85 holdings) | At least 25 (5 per realm: a city, a town, a castle, 2 villages). At most 60 at Normal, 110 at Large and 200 at Huge, ×0.75 with Vast wild, ×0.85 with More sea. The slider's top moves with them and says why ("up to 51 for this land") |
| **Realms** | **5**: not a setting | — | Fixed. The five factions are written content (peoples, colours, troops, lords), so changing their number would need new factions, not a slider |
| **Hamlets** | None, Few, **Normal**, Many (0, 0.5×, 1×, 1.6× the size's base: 24 / 45 / 100) | Natural villages (§8.9) | Capped by fringe land: at most 1 per 900 fringe tiles |
| **Sacred places** | Rare, **Normal**, Common (0.5×, 1×, 1.5×) | Stones, groves, monasteries, altars, shrines (§8.10) | Capped by quiet spots (their spacing rules) |
| **Wild land** | Few (10% of land), **Normal** (25%), Vast (40%) | Wild regions' count and size (§8.7) | Realms keep at least 35% of the land: if they would not, wild land is cut first, then holdings |
| **Land and water** | Continent (78% land), **Coasts** (73–76%), More sea (62–66%: more bays and inland seas), Lakes (75%, twice the lakes) | Land threshold, inland seas, lakes (§8.2) | Land share 60–80% |
| **Rivers** | Dry, **Normal**, Wet (rivers ×0.6, ×1, ×1.5; moisture −0.08, 0, +0.08) | River thresholds and the moisture field (§8.5), so more forest and swamp when wet | Each climate keeps ≥ 6% of land (§8.14) |
| **Mountains** | Flat, **Normal**, Rugged (ranges and highlands ×0.6, ×1, ×1.5) | Elevation (§8.3), cliffs later (Phase 7) | Passes every 60 tiles of range, whatever the setting |
| **Climate** | Cold, **Temperate**, Warm (temperature −0.08, 0, +0.08) | More frost or more desert (§8.4) | Each climate keeps ≥ 6% of land, because every people needs its home |
| **Seasonal rivers** | **On**, Off | Whether rivers are flagged seasonal (§6.6.4) | — |
| **Monsters** | Calm, **Normal**, Deadly (caps ×0.6, ×1, ×1.5; wild levels −1, 0, +1) | Monster density and strength (§10.6) | — |
| **Bandits** | Few, **Normal**, Many (×0.6, ×1, ×1.5) | Bands, river bands, camps (§10.6) | — |
| **Economy** | Poor, **Normal**, Rich (ore and fish deposits ×0.75, ×1, ×1.3; starting stocks ×0.85, ×1, ×1.2) | Deposits (§8.12), holdings' first stocks | — |

**Two settings for founding (§7):**

| Setting | Choices (default in bold) | What it changes | Range and clamp |
|---|---|---|---|
| **Founding sites** | Few, **Normal**, Many (0.5×, 1×, 1.6× of 14 / 24 / 52 by size) | Unclaimed sites placed by the generator (§7.2) | Capped by spots passing the site rules |
| **Start** | **Wanderer** (today's), Settler | Where and how you begin (§7.5) | Settler needs a fair site near your people (§8.14); if none passes, the generator relaxes the distance to your capital |

**Not settings**, because they would not change the world meaningfully or are chosen elsewhere: your race and start city (character creation), the number of realms (above), the starting war (as today, a random pair), the season length (D17).

### 4.2 Presets

Presets are chips across the top. Choosing one fills every setting; touching a setting afterwards shows "Custom".

| Preset | Size | Holdings | Hamlets | Sacred | Wild | Water | Rivers | Mountains | Climate | Monsters | Bandits | Economy |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Classic** | Normal (fixed) | today's 37 (fixed) | Normal | Normal | Normal | Coasts | Normal | Normal | Temperate | free | free | Normal |
| **Normal** | Normal | 37 | Normal | Normal | Normal | Coasts | Normal | Normal | Temperate | Normal | Normal | Normal |
| **Large** | Large | 55 | Normal | Normal | Normal | Coasts | Normal | Normal | Temperate | Normal | Normal | Normal |
| **Huge** | Huge | 90 | Normal | Normal | Normal | Coasts | Normal | Normal | Temperate | Normal | Normal | Normal |
| **Wild Frontier** | Large | 38 (0.7×) | Few | Common | Vast | Continent | Wet | Rugged | Cold | Deadly | Many | Rich |
| **Crowded Realms** | Normal | 55 (1.5×) | Many | Normal | Few | Coasts | Normal | Normal | Temperate | Calm | Normal | Normal |

Founding sites are Normal in every preset except **Wild Frontier** (Many) and **Crowded Realms** (Few). Start is Wanderer in every preset; any preset may switch it to Settler, Classic included.

**Classic** uses seed `CLASSIC`, today's holdings as anchors (§8.15), and only the settings that don't change the map: monsters and bandits. Everything else is locked and greyed out. **Tests** use Classic with every setting at its default.

**The Advanced fold-out** holds everything below Seed and Size: holdings, hamlets, sacred places, wild land, water, rivers, mountains, climate, seasonal rivers, monsters, bandits and economy. It is closed by default. On touch, choices are segmented buttons (3–4 steps, ≥ 36 CSS px tall) rather than fiddly sliders; only holdings and custom size use a number with − and + buttons.

### 4.3 The preview

The preview is a low-resolution map beside the settings, so you see the world before you start.

- **A quick sketch, ≤ 150 ms at any size**, redrawn 200 ms after any change.
  - **How:** the generator's own noise fields (land, elevation, temperature, moisture, warps) are **sampled at a coarse grid** of 256 points across. They are the same continuous functions of world position, so coast, mountains and climates in the sketch are the real ones at those points.
  - **What is approximate:** rivers, wild regions and holdings come from a cheap pass on that coarse grid (drainage on coarse elevation; capitals and holdings by coarse suitability). They are marked "sketch: rivers and holdings approximate".
- **Buttons:** **Reroll seed** (a new random seed) and **Regenerate** (redraw after typing a seed).
- **Line:** expected counts ("37 holdings · 24 hamlets · 11 rivers · 74% land") and the generation time for this size on this device ("about 2 s"; measured once and remembered in `localStorage` as a convenience).
- **Full preview (optional):** a button runs the real generator with progress (2 / 4.5 / 12 s by size) and replaces the sketch with the real map at 1 px per 2–4 tiles. **Start reuses that world** instead of generating again.
- **On Start without a full preview:** the "Forging the world…" screen (§3.7) runs the real generator and shows the real map when it is done.

### 4.4 Saved and reproducible

- **The settings object:** `WM.settings = {v:1, preset, w, h, seed, holdings, hamlets, sacred, wild, land, rivers, mountains, climate, seasonal, monsters, bandits, economy, sites, start}`.
- **Normalized first:** settings are clamped before use (§4.5), and the clamped values are what is stored and hashed. **The same seed plus the same settings give the same world**, byte for byte, in every browser (§8.1).
- **The world and its starting population come from the seed:** the map, holdings, hamlets, sacred places, camps and the lair, and also the first sites, bands, monsters and herds, which today use `Math.random` at `begin`. Two players with one code start in the same world. **What happens in play stays random**, as today.
- **A world code** packs the version, size, every setting and the seed into one short text, for example `ASH1-L-4F2KQ9-redwater`. Paste it into the Seed field to get the same world and settings.
- **In the save:** `world.map = {gen, settings, sum}` in save v3 (§9.3). A loaded save regenerates from these.
- **In the game:** the Esc menu gains a **World** page (in the window frame) with the seed, the world code with a Copy button, every setting, and the final counts. The save list line shows "Large · redwater".

### 4.5 Clamps, fairness and sanity

**Three layers make sure every allowed combination gives a fair, playable world:**

1. **The screen prevents** impossible requests. Each setting's range is computed live from the others (holdings' maximum from size, water and wild land; hamlets' from fringe land), the value is clamped when another setting shrinks its room, and a short note says why.
2. **The generator re-clamps** everything it is given, because a pasted world code may be hand-edited. Out-of-range values snap to the nearest allowed one.
3. **The generator's checks** (§8.14: reachability, suitable land per people, balanced capitals, fair start, ports, rivers, seasonal reachability, climates ≥ 6%, no emptiness, no circles) run on every world.
   - A failure retries its stage up to 8 times.
   - If it still fails, the generator relaxes in a fixed order: hamlets, then sacred places, then wild share, then holdings (one per realm at a time).
   - It never fails to produce a world. The World page shows the final counts, so a relaxed world is honest about it.

**Rules that hold at every setting:**
- each people has home land (≥ 6% per climate);
- each race's start city has 3 holdings within a day and no wild region within 25 tiles, even in Wild Frontier;
- no holding sits inside a wild region;
- every holding is reachable with every seasonal crossing closed.

### 4.6 The screen

It follows the window frame rule and fits a phone in landscape (844 × 390 CSS px):

| Part | Content |
|---|---|
| **Header** | "New world" |
| **Left column** (scrolls) | Preset chips; Seed field with Random and Copy; Size; the **Advanced** fold-out |
| **Right column** (fixed) | The preview (about 240 × 170 CSS px on a phone, larger on desktop), Reroll and Regenerate, the counts line, the time estimate, "Full preview" |
| **Bottom bar** (`nav()`) | **Back** on the left (to character creation), **Forge the world** on the right |
| **Esc** | Back |

**Order of New game** (D30):
1. Race and background, as today.
2. **World settings.** The preview marks your start city.
3. "Forging the world…", then the game.

---

## 5. Loading screens

The owner: "add loading screen where necessary." A bigger world means longer waits. Today they are hidden: the 1.7 s world paint and up to 0.64 s of battle ground painting happen inside a frame, so the page freezes. The plan has three parts: **one shared overlay**, shown **only when the work takes more than about 300 ms**; long tasks split into **steps that yield**; and **nothing in the simulation changes**.

### 5.1 One shared overlay

**`js/ui/loading.js`** (about 100 lines, plain JS, no framework) with its own section in `style.css`.

| Call | Does |
|---|---|
| `loadingShow(title, steps)` | Opens the overlay with a title and a list of steps `[{id, label, w}]`, where `w` is each step's share of the bar. The overlay **appears only after 300 ms**. If `loadingHide` comes first, nothing ever shows, so quick loads don't flash. Once it appears it stays at least 400 ms, so it doesn't flicker |
| `loadingStep(id, frac)` | Marks the current step and how far through it is (0–1). The bar is the finished steps' shares plus this step's share × `frac`. It **never goes backwards** (it keeps the highest value shown) |
| `loadingHide()` | Closes it, always in a `finally` |
| `runSteps(title, steps)` | The driver. It runs a step list or a generator function (`function*`) that `yield`s at safe points, in **slices of ≤ 12 ms a frame** (`requestAnimationFrame`), calling `loadingStep` as it goes. It returns a Promise |

**The look** is the game's window style, with the Arial UI font, and it fits a phone in landscape (≤ 90% of the width, centred):
- the **title** ("Forging the world…", "Marching to battle…");
- a **pixel progress bar** with a 2-px border;
- the **current step's words** ("Carving rivers");
- a **tip or flavour line** that changes every 4 s from a `TIPS` list of about 40 lines ("Fords flood in spring. Bridges never do." "A monastery heals all your wounded, for a price.") (D31);
- one small animated element: the game's own **flag** sprite (`drawFlag`) fluttering beside the title. It costs nothing, needs no new art and reads as "the band is getting ready".

**It never traps the player:**
- **On an error:** a step that throws shows the error's message, with **Copy error** and a way back (to the title after a failed new game; to the save list after a failed load; to the map after a failed battle setup, with the encounter still open). The overlay closes and input returns.
- **On a stall:** if no `loadingStep` arrives for 20 s, it says "This is taking longer than expected" and offers **Keep waiting** or the same way back.
- **Esc** follows the bottom bar of the error and stall views. While the overlay is open, `G.modal` is set, so map clicks and hotkeys are ignored. It is always cleared on hide.
- **Nothing half-applied:** a new game or a load builds the world into fresh objects and **installs them only in the last step** (`useWorld` and the session reset), so a failure leaves the old state untouched.

### 5.2 Where it is needed

The times below are today's (headless, `visual/perf`, `worldnature`, TERRAIN_DESIGN's `fieldperf`) or the targets of §3.7. **Phase 0 adds a report, `tests/visual/loadtimes.js`**, which measures each case at each size, so the 300 ms rule decides from data, not guesses.

| When | Work | Today | At the new sizes | Steps shown |
|---|---|---|---|---|
| **New game: generating the world** | `genWorld`, the start's population, the first chunks | Map built at page load; the full paint (1.7 s) at the first frame | 2 s Normal, 4.5 s Large, 12 s Huge (desktop) | **"Forging the world…"**: Raising the land · Mountains · Climates · Carving rivers · Forests · Wild lands · Founding holdings · Laying roads · Drawing borders · Painting the first lands |
| **Loading a save** | Read and unzip, regenerate from seed and settings, apply the save, paint the view | Quick, then the full paint at the first frame | The generation above plus ≤ 0.2 s | **"Returning to {world}…"**: Reading the save · (the generation steps) · Restoring holdings and parties · Painting the land |
| **First world paint** | Today `worldCv()` paints the whole map on first use (`drawWorld`; `initCritters` also calls it) | ≈ 1.7 s, frozen | The chunks in view: ≈ 0.3–0.5 s, inside the steps above | Part of the new game and load steps; never on its own |
| **Battle start** | Field size, `buildTerrain` (plan, routes), units, groups, state, **ground painting** (today done lazily in the first `drawBattle`), the canopy layer on big woods, sprite warm-up | Terrain 2–13 ms; ground paint 85 ms (today's field) to 640 ms (3200 × 1800); canopy 3–19 ms; warm-up already queued over frames (`warmBattle`) | Unchanged by world size; big fields and forests pass 300 ms | **"Marching to battle…"**: Surveying the ground · Raising the hills · Painting the field · Mustering the troops. Small battles (most) finish under 300 ms and show nothing |
| **Siege and storming** | As battle start, plus walls and garrison setup | To be measured | Same | Same as battle |
| **Town streets** (walkable scene) | The place painted once (`gfx/scene.js`) | To be measured | Unchanged | "Entering {town}…" if over 300 ms |
| **Full preview** on the settings screen (§4.3) | The real generator | — | 2–12 s | Inline in the preview pane (the same bar, no overlay), with Cancel |

### 5.3 Structure: long tasks that yield

Long tasks become **step lists or generator functions** (`function*`, plain ES6) that `yield` between pieces of work. The work between two yields stays synchronous and in the same order as today.

**Nothing in the simulation may change.** Yielding must not reorder random draws:
- **The generator** uses only its own seeded streams (§8.1), never `Math.random`.
- **Battle setup and `begin`** do draw `Math.random` (spawns, armies). While the overlay runs, the main loop runs **no simulation and no drawing that draws randoms**. `G.mode` is `'loading'`, and `frame()` draws only the overlay over the last frame, so no visual effects or flickering torches. The draws therefore happen in exactly the order they would synchronously.
- **Tests run synchronously:** `LOADING.sync = true` in `tests/harness.js` makes `runSteps` run every step at once, in order, with no overlay. Every existing suite and fingerprint stays byte-identical. A dedicated test runs the same task both ways and compares (§5.4).

**Code that must be split:**

| Code | Today | Split into | When |
|---|---|---|---|
| `paintWorld` | One call over the whole map | `paintChunk`, sliced (R6) | Phase 0 (R6) |
| `PX.battleGround` (engine) | One call, up to 640 ms, run lazily inside the first `drawBattle` | `PX.battleGroundSteps(spec)`, a generator: base copy, terraces and cliffs, water, woods' floor, standing trees (props), ways, details. `PX.battleGround(spec)` runs it to the end, so the output is unchanged | Phase 0 (R15) |
| `BattleSetup.start` (`setup.js`) | Synchronous; the ground is painted later, in the first frame (`render.js`: `B.ground ||= PX.battleGround(...)`) | Steps: field size, environment and ground spec, `buildTerrain` (and its routes), units, type, groups, state, `initialize`, **the ground painted here** (moved from the first frame: same pixels), the canopy when the field is over `LOD.trees`, `present`. `startBattle` stays the synchronous entry point for tests and the lab | Phase 0 (R15) |
| `begin` (`session.js`) | Synchronous | Steps: reset, generate or install the world, sites, critters, spawns | Phase 0 (R14) for the shape; Phase 2 fills in generation |
| `loadGame` (`save.js`) | Synchronous | Steps: read (gunzip is async), generate, apply, paint the view | Phase 0 (R14) shape; Phase 2 (gzip, generation) |
| `initCritters` | Calls `worldCv()`, forcing a full paint | Reads tile data instead | Phase 0 (R6) |
| `genWorld` (new) | — | A generator from day one, one `yield` per stage and inside the long ones (drainage, roads) every ~10 ms of work | Phase 2 |
| Siege setup, town scenes | Measure first (`loadtimes`) | Split only if over 300 ms | The phase that touches them |

**The two refactors**, added to Phase 0 (§2.2):
- **R14, the loading overlay and step driver.** `ui/loading.js`, `runSteps`, `LOADING.sync`, `G.mode='loading'` in `frame()`, and `begin`/`loadGame` shaped as steps (each step's body unchanged). Effort S. **Proof:** fingerprints and `worldprint` hashes unchanged with sync on; a sync-versus-async test.
- **R15, battle setup and ground painting as steps.** `PX.battleGroundSteps`, `BattleSetup.start` as steps, and the ground painted at setup instead of in the first frame. Effort M. **Proof:**
  - every battle fingerprint unchanged (`battlesetup`, `battleperf`, `rts`, `battlecommands` and the others);
  - the ground's pixel hash equal for 24 fields (TERRAIN_DESIGN's set);
  - the count of `Math.random` calls before the first battle frame unchanged.
  - It is done by the battle agent after REFACTOR items 11 and 13, because they share battle files.

### 5.4 Tests

`tests/loading.js`:
- **Shows and hides:** a 600-ms task shows the overlay, and it is gone after; a 100-ms task never shows it; once shown it stays at least 400 ms.
- **Progress is monotonic:** every `loadingStep` value recorded through a new game, a load and a big battle never decreases and ends at 1.
- **Nothing changes in the simulation:** a new game, a load and a big-field battle run with `LOADING.sync` on and off give the same `worldprint` hashes, the same battle fingerprints and the same count of `Math.random` calls.
- **Error path:** a step that throws shows the error view; Esc and the way back work; the old state is untouched; `G.modal` is cleared.
- **Stall path:** a step that never reports shows the stall view after the timeout (shortened in the test).
- **The frame:** the title, bar, step words and tip are drawn, and it fits 844 × 390.

---

## 6. What the new world holds

### 6.1 Contents per preset

| | Today | Normal | Large | Huge |
|---|---|---|---|---|
| Land | 89% | 73–78%: one continent with a ragged coast, bays, an inland sea or big lakes (D1) | same | same, with 2–3 inland seas |
| Realms | 5 | 5 (no new kingdoms) | 5 | 5 |
| Realm holdings | 37 | **37** (8/7/7/7/8; classic: today's) | ≈ 55 (11–12 each) | ≈ 90 (17–19 each) |
| Lords | 20 | 20 (4 a realm) | 30 (6) | 45 (9); names beyond each realm's listed four are generated per people |
| Hamlets | 0 | 20–28 | 40–50 | 90–110 |
| Sacred places | 18 small shrines | 18–24 | 30–36 | 60–70 |
| Founding sites (§7.2) | — | 12–16 | 20–28 | 45–60 |
| Wild regions | — | 4–7 | 6–9 | 10–14 |
| River systems (rivers ≥ 30 tiles) | none | 8–14, of which 1–2 great rivers | 14–22, 2–3 great | 30–45, 3–5 great |
| Land use (share of land) | 69% ruled | ≈ 40–45% realms, 3–4% hamlets, 20–30% wild, the rest fringe | same | same |

**Scale convention.** Figures and buildings are realistic to **each other**: a person is smaller than a house, a house smaller than a keep. **Distance** reads as **1 tile ≈ 250 m of land** for travel, so Normal is about 110 × 80 km, Large 160 × 110 km and Huge 256 × 192 km. With §10.2's travel model a band on foot covers about 25 km a day, as medieval armies did. A building stands for its settlement's look; the map is not a survey.

### 6.2 Wild regions

Deliberate empty places: few or no people, monsters and ruins, hard travel. Each region is a set of tiles (`WM.region`) with a kind and a generated name ("the Greywood", "Hollow Moors", "the Ashen Waste").

| Kind | Where it forms | Travel | Sight | What lives there | What you find |
|---|---|---|---|---|---|
| **Deep forest** | Large wet forest masses (≥ 300 tiles) | Forest ×0.75 more (×0.45 in all; elves ×0.9) | ×0.6; you are hidden | Spiders, tigers, bears (×3) | Ruins, caves, holy groves at the edge |
| **Highlands and moors** | High terraced plateaus, often ringed by escarpments (Phase 7) | Hills as now; moor ×0.85 | ×1.3 from tops | Trolls, griffins, wolves | Standing stones, a monastery at the edge, the dragon's lair |
| **Wastes** | Frost barrens, desert erg and salt flats, ash heath | ×0.85 | ×1.2 | Scorpions, wyrms, wolves | Ruins of old kingdoms; survival ×1.5 (no water) |
| **Great fen** | Low wet flats by lakes and deltas, in swamp climate | ×0.8 more | ×0.8 | Slimes, bog raiders | Bog idols, sunken ruins; fever ×1.5 |

**Rules** are a `WILD` table read through `regionAt`:
- travel and sight factors;
- spawn weights;
- survival costs;
- no bandits, holdings or hamlets inside;
- roads go round. A region crossed by roads gets at most one "old road" track (50%).

Entering logs a line; the HUD names the region.

### 6.3 Natural villages (hamlets)

A new holding kind, `hamlet` (a `HOLDING_TYPES` entry, `class Hamlet extends Village`), reusing lots, estates, economy and the window.

| Field | Value |
|---|---|
| People | 30 at start, 70 at most; race from the land; mixed allowed |
| Trade | `fish` (coast, lake or river), `timber`, `herd`, `ore`, `reed`; starts with that one estate |
| Defence | Militia of 3, no walls, no patrol: raidable, never besieged |
| Window | Trade (small), Recruit (a few), Jobs (hamlet-flavoured), Tavern |
| Land | Reach 6, growth up to 3, a neutral colour |
| Owner | `null` ("Free folk") |

**Politics** (D5):
- **Trade, recruit, jobs:** as at any village.
- **Bands raid them:** a stronger band within 6 tiles, 1 in 10 a day.
- **Realms annex them:** at most 1 claim per realm per 20 days, by a lord riding there.
- **You win one** with "Offer protection": reputation 25, 15 men, 150 gold and a defend job.
- **Raiding one yourself** costs −3 honour with every realm and −40 reputation with the hamlet. It starts no war.
- **Target:** 20–40% annexed by day 120 in `worldsim`.

### 6.4 Sacred places

`Site` subclasses in `SITE_CLASS`, like today's `Shrine`.

| Kind | Where | Normal count | Does |
|---|---|---|---|
| **Roadside shrine** (today's) | Roads and crossings | 8–10 | Pray weekly: recover, gain insight |
| **Standing stones** | Moors and hilltops | 4–5 | +15% sight for 3 days; at night they point to the nearest undiscovered ruin |
| **Holy grove** | Deep wood edges | 3–4 | +10 morale and wounded heal ×1.5 for 3 days; elves +5 reputation; **sanctuary** within 4 tiles |
| **Monastery** | Remote hills or lake shores | 3–4 | Heal all wounded (gold per man), buy ale, cheese and medicine, rest safely, lore (the lair's region), pilgrim jobs, **sanctuary** within 8 tiles; a later interior |
| **Regional altar** (Sun Obelisk, Frost Altar, Bog Idol) | Deep in its climate | 1–2 each | Ignore that climate's survival cost for 5 days |

**Rules:**
- **One blessing** is active at a time.
- **Each place** gives its blessing once per 7 days.
- **Quiet:** no bandits spawn within 10 tiles, and monsters keep 6 tiles off.
- **Pilgrims:** today's *Pilgrims* travellers camp between sacred places.
- **No desecration** in v1 (D6).

### 6.5 The dragon's lair

There is one per world.
- **Where:** the most remote mountain tile of the largest highland region, at least 60 tiles from any holding and 25 from any road.
- **Hidden:** a `Lair` site (a `Cave` subclass) seen **only from 2 tiles away**, and off the minimap until found.
- **Clues:**
  - monasteries and taverns give its region and the compass bearing;
  - standing stones point toward it once you have the rumour;
  - the dragon flies home at dawn, and it can be seen from far off.
- **Later:** its interior is milestone 6 of the interiors roadmap.

### 6.6 Rivers

The owner chose all four strands: big river systems, strategic crossings, river travel and trade, and seasonal rivers, with seasons **only for certain small rivers or certain climates**.

#### 6.6.1 Big river systems

- **Drainage basins** (§8.5): water falls on the land by moisture and flows downhill. Flow gathers into tributaries, then rivers, then great rivers, which run from the mountains to the sea or a lake. Lakes fill basins and spill into an outflow river. Great rivers end in **deltas** on flat coasts.
- **Width follows flow:**

| Class | Flow | Width on the map | Moving across it | Boats |
|---|---|---|---|---|
| **Brook** | Small | **Painted only**: a 1–3 px line in the ground art, no tile | Walk over it | No |
| **Stream** | Medium | 1 tile | Only at fords and bridges (unless seasonal, §6.6.4) | No |
| **River** | Large | 2 tiles | Only at fords and bridges | **Yes** (barges), except at rapids |
| **Great river** (lower reaches) | Largest | 3 tiles | Only at bridges and ferries | **Yes** |
| **Delta channel** | Split from a great river at the coast | 1–2 tiles, fanning over 8–16 tiles, fen between | Fords and bridges | Small boats |

- **Rapids:** steep stretches of a navigable river (a fall of more than 1 terrace level within 6 tiles) are rapids. Boats stop at a landing on each side; the stretch between is a portage.
- **Towns favour rivers:**
  - river adjacency raises suitability (humans +0.25, Salt League +0.3, +0.4 at a mouth);
  - towns go at crossings of great roads and rivers;
  - **river ports** (`style:'riverport'`) have their pier on a bank;
  - holdings on a river get a **watermill** drawn with their farm, and farm output +15% (`econ.mill`).

#### 6.6.2 Strategic crossings

Rivers are barriers. **They are crossed only at crossings**, and crossings are choke points that armies route through:

| Crossing | Where | Rules |
|---|---|---|
| **Bridge** | Where a road meets a river (water run ≤ 3 tiles, as today's `MAX_BRIDGE`); one every 30–60 tiles on rivers and great rivers | Always open. A **toll bridge** when it lies in a holding's land (below). The battle's *Hold the bridge* |
| **Ford** | Shallow, flat spots on streams and rivers (never great rivers); one every 20–35 tiles on streams | Open, slow (foot ×0.5, riders ×0.4). Tracks cross here |
| **Ferry** | At towns and river ports on great rivers | Costs 2 gold per 5 people and 0.05 day. A landing on each bank |
| **Seasonal crossing** | Only on seasonal rivers (§6.6.4) | Low-water fords, dry beds and ice: open only in their season |

- **Toll bridges** (D21): a bridge in a holding's land charges its owner's toll.
  - **Caravans of another realm** pay 2% of their cargo's worth to the owner, on top of today's arrival toll.
  - **You** pay 1 gold per 5 people, or refuse. Refusing is a crime with that holding, handled like today's patrol fines.
  - **Your fiefs' bridges** pay you, and the takings show in the weekly fief line.
  - A small toll house stands at one end (`PX.prop`).
- **War at the crossings:** a lord defending his realm may hold the bridge or ford on his border nearest an enemy army (`hold` state, §11). Fights there use the existing *Hold the bridge* battle type, which already triggers on and beside road bridges (`encounters.js` `bridgeNear`).

#### 6.6.3 River travel and trade

| | Speed (tiles a day) | What |
|---|---|---|
| Barge downstream | 260 (≈ 65 km): 2× a band on a road | Realm trade, passage, river bandits' prey |
| Barge upstream | 90 (≈ 22 km) | |
| Sea cog | 300 | Today's trade ships |
| Fishing boat | as now | On sea, lakes and rivers |

- **Realm river trade:** when two holdings are ports on one water network and the boat route takes ≤ 0.8 of the road time, the realm sends a **barge** instead of a cart caravan. A barge is a `CaravanParty` that moves on water (`BargeParty extends CaravanParty`), so it is saved, met, traded with, tolled, robbed and seized exactly like a caravan, and drawn as a barge. Fishing boats and sea cogs stay decorative `Ship`s, not saved, as today.
- **`ships.js` extended:**
  - `isWater` includes navigable river tiles, except rivers frozen in their season;
  - `waterIds` joins rivers to the lakes and seas they meet;
  - `dockOf` finds river ports' piers;
  - boat speed follows each river tile's downstream direction (`WM.flow`).
- **The player (D20):** at any port, **Take passage** lists the ports on the same water network, with days and price (1 gold per 4 people per 10 tiles). Your band goes aboard: you move along the water at boat speed, time runs at 4× while aboard, and river bandits or pirates may strike. **Owning a barge** (your own transport, 3× a cart's cargo, home at a river port) is left for later.
- **River bandits:** a band kind `river`, at 4 / 8 / 16 per preset. They spawn near crossings and navigable rivers in fringe land. They prey on barges passing within 6 tiles (like bandits on caravans; you can intercept), and they lie in wait at fords (an *Ambush* field with a river).

#### 6.6.4 Seasonal rivers: certain small rivers, or certain climates

**Big rivers outside frost lands never change. Great rivers never change anywhere.** Seasonal behaviour comes from two sources, both written by the generator into each river's data:

1. **A per-climate season profile** (`SEASON_PROFILE`, data). In some climates, whole regions behave seasonally for every river small enough to be affected.
2. **A per-river `seasonal` flag** with a mode (`freeze`, `flood`, `dry`, `flash`). The generator sets it from size and climate, plus a few chosen small rivers in temperate land.

| Climate | Which rivers are seasonal | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|
| **Frost** | **Everything but great rivers** (streams and rivers) | Thaw: fords closed, days 1–5 | Normal | Normal | **Frozen**: crossed anywhere (ice: foot ×0.7, riders ×0.6); boats stop on frozen rivers |
| **Desert** | **Wadis**: every stream in desert not fed by a permanent source (a lake, or mountains in another climate) | **Flash flood** for 2–3 days (the day is set per wadi): impassable; anyone crossing nearby is caught (an event) | **Dry**: the bed is walkable anywhere (×0.85) | Dry | Dry |
| **Swamp** | Streams and delta channels | **Wet season**: high water, fords closed, floodplain tiles beside rivers slow (×0.5): the marsh spreads | Wet until day 7, then falling | **Dry season**: extra low-water fords open | Normal |
| **Grass** (temperate) | **Only flagged small rivers**, about 30% of streams: cold or high ground → `freeze`; mountain-fed → `flood`; dry land (low moisture) → `dry` | `flood`: fords closed, days 1–8 | `dry`: low water (extra fords) or a dry bed in the driest | Normal | `freeze`: frozen days 4–12 |

**Every other river stays the same all year:** crossed only at its bridges, fords and ferries, with boats running.

**Shown on the map, so the player learns them:**
- **All year:** a seasonal river has its own look (a pale gravel edge along its banks, a dotted bank line). Its tooltip says when it changes: "Stream · freezes in winter", "Wadi · dry, floods in spring".
- **This season:** an overlay shows the state now: ice, high brown water, a dry bed with stones, or sandbars.
- **The full-map window** has a legend.
- **When a season changes,** a log line names what changed near you: "The Coldwater has frozen: you can cross it anywhere."

**Thin ice** (D19): on the first and last 2 days of a freeze, crossing has a 10% chance of an event (lose 1–3 men or some goods; Survival ≥ 4 avoids it). The ice never breaks into a new tile state.

#### 6.6.5 The season calendar: minimal

Seasons exist only as far as these rivers and a few small things need.

- **Where:** `world/calendar.js`, about 30 lines.
  - `SEASON = {len: 15, names: ['Spring','Summer','Autumn','Winter'], start: 1}`: the season length and the season the game starts in (Summer).
  - `season()` and `seasonDay()`, derived from `G.day`, so **nothing is saved**.
  - `SEASON_PROFILE` (the table above, as data).
  - `riverState(i)`: normal, frozen, flooded, low, dry or flash, from the tile's mode bits and the season.
- **When it changes:** in `dayTick`, a season change refreshes the crossing states (way-graph edges, §3.6), invalidates the minimap and logs the changes.
- **Uses in v1:**
  - the seasonal rivers above;
  - the HUD date ("Day 17 · Summer");
  - battle water (§13);
  - three events: the flash flood, thin ice, and a ferryman stranded by high water.
- **Is it worth adding just for this?** Yes, because it costs almost nothing: one small file, no save state, no repainting. It is also the natural hook for later systems the owner may want, none built now: a harvest that cheapens grain after autumn, harsher frost survival in winter, campaign seasons for lords. Without it, seasonal rivers would need their own clock anyway.

### 6.7 Ready for cliffs

The world stores elevation in 4 terrace levels and cliff-edge bits (`WM.edge`: E 1, S 2, W 4, N 8). These are the same bits as the battle's `B.terrain.wall` and `PX.worldHill(opts.edge)`. Escarpments come in Phase 7.

**Desert mesas** (decided by the owner, 2026-10-18). Desert regions get mesas and escarpments on the world map, in sandstone, matching the world map's buttes. A battle fought there gets a mesa on that side: a flat-topped butte, sheer layered sandstone cliffs, and 1–2 natural sand ramps, in the purely natural ramp style. Until Phase 7, desert battlefields keep dunes, spires and oases only, with no cliffs or ramps (the owner's "world first" rule).

---

## 7. Founding your own holding

The owner: "there should be a blank holding where the player can start, starting from a camp to village to etc." This makes the queued roadmap item **Growth tiers (village → town → city) on top of `HOLDING_TYPES`** (IMPLEMENTATION_PLAN §6, with the note "`holdingOf(t, kind)` already switches a holding's class") part of the world plan. **One tier model is shared by every holding:** yours, the realms' and the hamlets'.

### 7.1 What exists to build on

| System | Today | Where |
|---|---|---|
| Kinds of holding | `HOLDING_TYPES` (village, town, city, castle): people, store, garrison, patrol, `wall0`/`wallMax`, `estMax`, `reach`/`growMax`, `ring`, needs, jobs, `income`, tabs, hires, mounts. One class per kind; `holdingOf(t, kind)` changes a holding's kind and class in place | `data/holdings.js` |
| Estates | `t.bld` levels of 11 estates (farm, pasture, lumber, mine, quarry, port, workshop, smithy, brewery, granary, market), each up to `estMax`, with `ESTATE_NEEDS`. Built as projects (`t.work`, `buildDays`, gold and materials) | `data/economy.js` `ESTATES`; `world/estates.js` |
| Walls | `t.wall` 0–3 (`WALL_N`: none, palisade, stone, great), the **fortification of the centre building**, raised by Fortify; no wall pieces | `estates.js` `wallOf`; settlement rules memory |
| Placed structures | Every holding is lots on the tile grid, each a power-of-two cell (1, 2 or 4 tiles). The centre (village hall 32, citadel 64, keep 64) stands on the holding's tile; houses for its people within `ring`; estates' buildings and fields (`plots`) outside; built behind scaffolding | `world/lots.js` `initLots`, `lotSpot`, `lotAdd`; `PX.building` |
| People and economy | `t.pop` up to `popCap` and the houses it has; stock, prosperity, taxes, volunteers | `world/economy.js` |
| Your fiefs | Owner `'player'`, the **Free Banner** faction (`FACS.player`), already at war with whoever is hostile to you. Fief tab, garrison (`fiefCap`), daily income (`fiefIncome`, `fiefDay`), building | `realms.js`; `siege.js` |
| Staying | Rest inside a holding that takes guests (`Holding.takesGuests`; castles only for those they know) | `world/stay.js` |
| Territory | Reach grows in peace, shrinks under siege, and a captured holding brings its land | `world/territory.js` |
| Camps' art | Bandit and siege camps (`PX.camp`, `campSprite`): tents, fire, flag | `engine/pieces.js`, `render.js` |
| Refugees | People leaving a ruined holding walk to a better one, and you can "settle" them | `world/refugees.js` |

### 7.2 Founding sites, and free founding

**Founding sites** are unclaimed good spots placed by the generator: a `FoundingSite` class in `SITE_CLASS`, seeded, saved like any site.

| Kind | Where | Its gift |
|---|---|---|
| **River ford** | Beside a ford or bridge on a stream or river | A watermill (farm +15%), fish; caravans pass |
| **Fertile valley** | Open land with high moisture, away from roads | Farm fields ×1.25 |
| **Crossroads** | Where two roads or tracks meet, outside realms | Market dues +50%; caravans call |
| **Defensible hill** | A hill tile with open ground round it | Walls cost −30%; defenders +1 level |
| **Sheltered cove** | Coast or lake shore with connected water | Port at level 1 from the start |
| **Wild edge** | Within 10 tiles of a wild region, never inside | Rich deposits (×1.5), monsters near |

| | Normal | Large | Huge |
|---|---|---|---|
| Founding sites | 12–16 | 20–28 | 45–60 |

The **Founding sites** setting (§4.1: Few 0.5×, Normal 1×, Many 1.6×) scales them.

**Placement rules:**
- a clear 6 × 6 block of open land, so the centre can grow to 64 px in place;
- room for at least 3 estates (`canHave`);
- ≥ 24 tiles from any holding, ≥ 14 from a hamlet;
- outside every realm's starting land;
- reachable by land in every season.

**On the map**, once explored: a wooden stake with a pale pennant on bare ground (`PX.site({type:'stake'})`), labelled "Unclaimed land · river ford".

**Free founding (D33): yes, with stricter rules.** Marked sites are the easy path. You may also found on any land that passes:
- the same clear 6 × 6 block and estate room;
- ≥ 30 tiles from any holding and ≥ 18 from a hamlet;
- **not on land a realm rules** (`LAND`) and not within 12 tiles of a realm's holding;
- not inside a wild region;
- reachable.

Free founding costs 50% more (a surveyor's work) and has no site gift. The Found button explains any rule that fails ("Too close to Millbrook: 22 of 30 tiles").

### 7.3 The tier model, shared by every holding

**Tiers:** **camp → hamlet → village → town → city** (the trade path) **or castle** (the war path, from town). Each tier is a `HOLDING_TYPES` kind with a new `tier` number (0–4) and a `next` list, so `holdingOf(t, next)` does the change. **One new kind:** `camp` (`class Camp extends Holding`). `hamlet` comes from §6.3.

| Tier | Kind | Centre (lots, engine) | People (start / cap) | Unlocks | Walls | Estates (max level) | Reach | Income a day |
|---|---|---|---|---|---|---|---|---|
| 0 | **Camp** | Settlers' camp, 2×2: tents, a cart, a fire, a stake fence (`PX.camp({style:'settler'})`) | 8 / 25 | Stores, Build (farm, lumber, quarry only), rest inside (free) | 0 | 1 | 4 | 0 |
| 1 | **Hamlet** | Hamlet centre, 2×2 (`PX.site({type:'hamlet'})`, §12.3) | 20 / 70 | Small trade, 2 recruits a week, jobs, tavern | 0 | 1 | 6 | 3 |
| 2 | **Village** | Village hall, 32 (today's `village`) | 60 / 140 | Market tab, recruits as a village, patrol 3, herds | Palisade (1) | 2 | 10 → 14 | 8 |
| 3 | **Town** | Citadel, 64 (today's) | 200 / 420 | Smith, training, tourneys, broker, contracts, patrol 6 | Stone (up to 3) | 3 | 15 → 21 | 25 |
| 4 | **City** | Citadel, 64, a grander variant (today's open art question) | 320 / 700 | As town, more store and income; **one per realm** (yours too: your capital) | Up to 3 | 3 | 17 → 24 | 40 |
| 4 | **Castle** (from town) | Keep, 64 (today's) | 80 / 170 | Mounted troops, bigger garrison, stockpile (`fort`) | Up to 3 | 2 | 18 → 25 | 15 |

Village to castle use today's `HOLDING_TYPES` values. Camp and hamlet are new entries, and reach is shown with the ×1.4 of §8.13.

**Footprint.** Every site keeps a clear 6 × 6 block, so the centre grows **in place** through power-of-two cells (2×2 → 2×2 → 2×2 → 4×4 → 4×4), as the settlement rules require. An upgrade replaces the centre lot behind scaffolding (`lotAdd` with `st:'building'`, as houses are built today). Houses come as people grow (`housing`), estates as they are built.

**Reaching the next tier** is a project in the Fief tab, like an estate (`t.work`). It needs all of the following; every number is in `TIERS` (`data/holdings.js`), a tuning table:

| To | People | Days at the tier | Gold | Materials | Built first | Renown | Build days |
|---|---|---|---|---|---|---|---|
| Camp (found) | 6 settlers from your band | — | 200 | 10 timber, 5 tools, 20 food | — | — | 1 |
| Hamlet | 20 | 3 | 150 | 20 timber | farm or lumber 1 | — | 3 |
| Village | 50 | 10 | 400 | 40 timber, 20 stone | 2 estates; granary 1 | 30 | 5 |
| Town | 150 | 20 | 1,200 | 40 timber, 80 stone, 20 tools | 3 estates, market 1, palisade; prosperity ≥ 50 | 100 | 9 |
| City | 300 | 30 | 3,000 | 200 stone, 60 tools | market 2, stone walls; your realm has no city | 250 (Lord) | 15 |
| Castle | 80 | 20 at town | 1,500 | 150 stone, 30 iron | stone walls, smithy 1 | 100 | 12 |

**People grow** by today's economy: food, prosperity and houses. **Refugees** may be directed to your holdings ("Settle them at {holding}", using today's "settle" choice), and hamlets you protect send young people. **Settlers:** founding takes 6 of your soldiers (never companions) as its first people. They leave your band; they are not lost.

**Tier down.** A holding drops one tier when either:
- its people stay below the tier's floor (the previous tier's people requirement) for 20 days;
- or it is sacked twice within 30 days.

The centre lot reverts to the lower tier's building, and the extra lots fall into ruin (today's `ruined` art) until they are rebuilt. A camp that drops is gone: its site becomes unclaimed again, and stocks are lost.

**Realm holdings grow and shrink too (D35): yes, slowly.**
- **Grow:** an AI holding grows one tier when its people have stood above the next tier's requirement for 30 days and its realm can pay.
- **Shrink:** it falls one tier by the same rules as yours.
- **Floors:** a realm's capital never falls below town, and a castle never changes path.
- **Caps:** at most 1 city per realm (the rule already noted in memory), and at most one AI tier change per realm per 20 days.
- **Hamlets** (§6.3) can grow into villages, which pushes them toward annexation.
- **Off in tests:** `TIERS.ai` is off in `tests/harness.js`, so the classic world's kinds never change under the suites.

### 7.4 Your own realm

**Your realm exists from the first camp (D37).** It is today's `'player'` owner, the **Free Banner** (`FACS.player`). Founding needs no new faction code, because everything that handles your captured fiefs (`playerFiefs`, `fiefDay`, `fiefBody`, `atWar`/`hostileTo`, land colour) already works for it.

| Part | v1 | Deferred (roadmap "founding your own kingdom") |
|---|---|---|
| Territory | Grows from each holding by its tier's reach, with §8.13's natural borders | Claims beyond reach |
| Relations | **Tension:** founding within 40 tiles of a realm's holding costs −10 honour with that realm, once. Your land taking tiles that realm would rule costs −1 honour a week while it lasts. Hostile realms treat your holdings like any enemy's: lords besiege your towns and castles and raid your villages, camps and hamlets (`siege.js`, `realms.js`) | Treaties, borders by agreement |
| Hamlets | D5's **Offer protection** brings a hamlet into your realm | Vassal hamlets paying tribute |
| Governors | A **companion** can govern one holding: they stay there (their party's `stay` order), add their Stewardship to income and build speed, and command its defence | Lords as vassals; your own lords; laws |
| Sworn to a realm | You may still found. The holding is yours (Free Banner), and your liege does not object while it lies outside his land | Granting your holdings to your liege |
| Kingdom | — | Titles, laws, vassals, diplomacy, declaring war (IMPLEMENTATION_PLAN §9, design backlog, Politics) |

### 7.5 Starting as a settler

A new **Start** setting (§4.1): **Wanderer** (today's start, the default) or **Settler** (D36).

As a settler you begin at a founding site **with a camp already founded**:
- 10 people, your band of 5, 150 gold, 30 food, 20 timber, 10 tools;
- the site is within 1–2 days of your people's capital but outside its land, and suits your people (§8.8's suitability);
- reputation with your people's realm is neutral.

**Fairness for the settler start** (added to §8.14):
- no wild region within 15 tiles;
- a holding or hamlet within 1 day;
- no bandit camp within 25 tiles;
- **10 days of grace**, in which bands don't raid your camp.

The Classic preset allows the settler start too: it has founding sites like any seed.

### 7.6 Risks and upkeep

Every number below sits in `FOUNDING` (`data/world.js`) for Phase 6's retune.

| Risk | Rule |
|---|---|
| **Bandit raids** | Camps, hamlets and villages are favourite targets: a stronger band within 8 tiles raids with a 1-in-12 chance a day (after the grace). A raid steals 30% of the stock and kills 10% of the people. The militia (people ÷ 6) defends. You are told ("Raiders at {camp}!") and can ride back; a band that has just raided lingers 1 day, so you can catch it |
| **AI realms** | Tension (above); at war, sieges and raids as on any holding. Lords never besiege camps or hamlets (no walls); they **burn** them: a camp is lost, a hamlet drops a tier |
| **Upkeep** | The garrison is paid as fief garrisons are today. Each tier costs a daily upkeep in tools and food from its stock (camp 1 food per 4 people; from village, 0.2 tools per level of estates). Hunger shrinks people, and 20 days below the floor drops a tier |
| **Neglect** | A holding with no governor and no visit from you for 30 days loses 5 prosperity a week |

### 7.7 How it fits

| Change | Where |
|---|---|
| New kind `camp`, a `tier` and `next` on every kind, the `TIERS` table | `data/holdings.js` |
| `FoundingSite` (site), placement in the generator | `world/sites.js`, `world/worldplace.js` |
| Found, upgrade and tier-down projects, free-founding rules, upkeep, raids on your holdings | new `world/founding.js`; `world/estates.js` (`t.work` of kind `tier`) |
| The centre growing in place | `world/lots.js` (reserved block, centre replacement) |
| AI tier changes, tension | `world/realms.js`; `world/brains.js` (raids, burning) |
| Adding a holding at runtime | `addHolding` (R4), incremental territory (R7) |
| Fief tab: "Upgrade to {tier}" with a checklist (✓/✗, like `needsText`) | `world/siege.js` `fiefBody`, `ui/town.js` |
| Tier art for each people | `engine/pieces.js` (settler camp, stake), `engine/buildings.js` (hamlet centre, the city's grander citadel), `gallery.html?view=tiers` |
| Settings and the settler start | `world/worldsettings.js`, `core/session.js` |

---

## 8. Generation

### 8.1 Rules that hold for every stage

- **Seeded and isolated:** each stage has its own stream (`seeded(hashInt(seed, STAGE))`) and noise salt. `Math.random` is never called.
- **The same in every browser:** integer hashing, `+ − × ÷` and `Math.sqrt` only. No `Math.hypot`, `sin`, `cos`, `exp`, `pow`, `log` or `atan2`, whose last digit may differ between Chrome and Safari. A static check in `tests/structure.js` bans them in `world/worldgen.js` and `world/worldplace.js`.
- **Pure stages** in plain functions. `genWorld(settings)` (the clamped settings of §4, seed included) returns a `WorldMap` plus `{holdings, hamlets, sacred, camps, lair, regions, rivers, crossings, graph}`.
- **Retry:** a failed check (§8.14) retries its stage with a sub-seed, up to 8 times, then relaxes the target.
- **Staged across frames**, behind "Forging the world…" (§3.7).
- **No visible shapes:** every boundary comes from **domain-warped** noise, and every stamp is replaced by a field with noisy falloff.

### 8.2 Land shape (continent)

| Step | How |
|---|---|
| Base | Warped fbm (4 octaves; wavelength ≈ 27% of the map's width) minus a smooth edge falloff whose threshold is itself warped, so the coast never follows the frame |
| Threshold | Chosen per seed for 73–78% land |
| Seas and lakes | Normal and Large: one inland sea or 2–3 big lakes; Huge: 2–3 inland seas. Smaller lakes come from drainage (§8.5) |
| Clean-up | Land under 40 tiles becomes sea; sea pockets under 12 tiles become lakes or land. No holding on an island unless it is bridged or reached by a ford |

### 8.3 Elevation: ranges, highlands, escarpments

- **Ranges:** 3–5 mountain spines at Normal (5–7 at Large, 8–12 at Huge). Each is a smoothed random walk with a ridge profile `max(0, 1 − d/width)²` times ridged noise, giving peaks, saddles and passes.
- **Highlands:** 2–4 broad plateaus (more at larger presets), terraced into 4 levels.
- **Lowlands:** gentle fbm.
- **Kinds:**

| Kind | Rule |
|---|---|
| `T_MOUNT` | elevation ≥ 200, or ridge strength ≥ 0.7 |
| `T_HILL` | elevation ≥ 150, or local relief ≥ 25 |
| `T_WATER` | sea, lakes and river tiles |

- **Passes:** every 60 tiles of range keeps a saddle under 200.
- **Escarpments:** steps of ≥ 1 terrace level running ≥ 4 tiles are cliff candidates (`WM.cliffs`), used in Phase 7.

### 8.4 Temperature, moisture, climate and blends

| Field | How |
|---|---|
| Temperature | Latitude (north cold), minus elevation × 0.35, plus warped noise ±0.12 |
| Moisture | Blown from the west: gained over water, lost over land and up slopes. Land east of a range lies in a **rain shadow**. Plus warped noise ±0.15 |
| Climate (for rules) | A lookup on (temperature, moisture) into today's four `CLIMS`, so every rule, race home and battle recipe keeps working |
| Blend weights (for art) | From `WM.temp`/`WM.moist`, piecewise linear over an **ecotone 3–6 tiles wide** |
| Sub-biomes (art, flavour) | Moor, steppe, taiga, oasis, mangrove and fen, from the same fields |

### 8.5 Drainage basins and rivers

1. **Fill the pits** (priority flood from the sea, O(n log n)). Basins deeper than 3 levels after filling become **lakes**, with an outflow at the spill point. Shallower pits are flattened with a slight slope so water always drains.
2. **Flow directions:** each land tile drains to its lowest of 8 neighbours. Stored as 3 bits in `WM.flow`.
3. **Flow:** rain (moisture) is accumulated downstream. Each tile gets its **basin** (the outlet it drains to) and **Strahler order** (tributaries meeting raise the order).
4. **Classes by flow** (§6.6.1). Thresholds are chosen per seed for the counts in §6.1. Meanders come from flowing over warped elevation, so rivers don't run straight. Brooks are kept as art lines only.
5. **Widths:** a stream is 1 tile, a river 2, a great river 3 on its lower reaches (order ≥ 4 and flow ≥ the top threshold). Widening follows the downstream side.
6. **Deltas:** a great river reaching the sea over flat lowland (within 8 elevation of sea level for ≥ 8 tiles) splits into 2–4 channels fanning over 8–16 tiles. The land between gets `feat` FLOODPLAIN and a swamp bias (reeds, fen).
7. **Navigable:** rivers and great rivers that connect to a sea or lake, except at rapids.
8. **Floodplain:** low tiles within 2 of a river of width ≥ 2, or of any swamp stream (`feat` FLOODPLAIN).
9. **Seasonal flags** (§6.6.4), written into the tile's `river` byte:
   - **frost:** every non-great river gets `freeze`, and streams also get `flood` (thaw);
   - **desert:** streams not fed by a permanent source get `flash` and `dry`;
   - **swamp:** streams and delta channels get `flood` and `dry` (wet and dry seasons);
   - **grass:** about 30% of streams, chosen by cold or high ground (`freeze`), mountain sources (`flood`) or low moisture (`dry`).

### 8.6 Forests and deep forests

Forest density per tile = biome base (grass 0.45, frost 0.35, swamp 0.5, desert 0) × moisture × warped patch noise.
- **Forest:** over 0.55 is `T_FOREST`.
- **Deep:** pieces ≥ 300 tiles with a core over 0.75 get `feat` DEEP.
- **Sparse edges:** 0.4–0.55 is `feat` SPARSE, painted as copses and lone trees.
- **Rivers:** banks are 15% more wooded (gallery forests), including through grassland and desert, where palms line oasis rivers.

### 8.7 Wild regions, chosen on purpose

- **Habitability:** climate comfort × flatness × water within 6 tiles × closeness to a coast or river.
- **Cores:** pick cores where habitability is low (counts per preset), at least 50 tiles apart, one of each kind the land allows.
- **Growth:** each core grows by a noise-warped flood to 1,500–6,000 tiles, stopping at great rivers and coasts and keeping 25 tiles from the best capital sites.

### 8.8 Holdings, by rules

**Suitability per people:**

| People | Likes | Avoids |
|---|---|---|
| Human | Grass, flat, **rivers**, fertile | Mountains, deep forest |
| Dwarf | Near mountains, hills, frost or cool grass; mountain streams | Swamp, desert |
| Elf | Forest edges, grass, river woods | Desert, frost |
| Orc | Desert and swamp, near water (wells, oases, wadis) | Frost |
| Salt League | Coasts, lake shores, **river mouths and navigable rivers** | Inland away from water |

**Order:**
1. **Capitals** (one city per realm): the best site for each people, at least 0.3 × the map's diagonal apart.
2. **Each realm grows from its capital** by Poisson-disc candidates. Each new holding lies within 40 tiles of its realm's own.
   - Castles go on high ground facing other realms, and **at crossings on the border**.
   - Towns go at river crossings, junctions and coasts.
   - Villages go on fertile land, often on rivers.
   - Ports go on connected water; **river ports** on navigable rivers.
   - One bridge town (`style:'bridge'`) per realm at most; stilt villages in swamp.
3. **Counts per realm** follow the preset (§6.1). Normal keeps today's mix.

**Minimum spacing (tiles)** is the same at every preset; larger presets have more holdings, not sparser ones:

| | City | Town | Castle | Village | Hamlet | Sacred |
|---|---|---|---|---|---|---|
| **City** | 0.3 × diagonal (capitals) | 30 | 30 | 24 | 20 | 18 |
| **Town** | | 26 | 24 | 20 | 16 | 18 |
| **Castle** | | | 24 | 18 | 16 | 18 |
| **Village** | | | | 16 | 14 | 18 |
| **Hamlet** | | | | | 18 | 14 |

**Names** come from syllable tables per people, unique per world:

| People | Starts | Ends |
|---|---|---|
| Human | Ash, Brook, Mill, Oak, Thorn, Ward, Cold, High, Bram, Ald | ford, wick, hollow, brook, hurst, march, moor, ley, stead |
| Dwarf | Karn, Dun, Iron, Coal, Granite, Deep, Grim, Thra | hold, rak, vein, forge, gate, delve, heim |
| Elf | Elder, Silver, Willow, Moss, Moon, Fern, Lin, Ael | glen, bough, mere, dell, well, down |
| Orc | Grey, Sun, Skull, Bone, Dust, Red, Scorch, Gor | well, reach, rock, pit, fang, spire, maw |

Rivers, regions and lords are named the same way ("the Coldwater", "the Greywood"). **Prices** come from kind, climate, resources and rivers (a mill: cheaper grain), with today's ammo and food rules. **Notes** come from templates.

### 8.9 Natural villages

Hamlets are placed after the realms, in fringe land by their trade's ground. Fishing hamlets go on coasts, lakes **and rivers**. 60% are within 12 tiles of a road or river; the rest are linked by a track.

### 8.10 Sacred places

They go in quiet spots:
- ≥ 18 tiles from holdings and ≥ 14 from hamlets;
- ≥ 6 from roads, except roadside shrines, which sit on crossings;
- ≥ 30 from each other.

Standing stones go on high moor; groves 3–6 tiles inside deep woods; monasteries on hills or lake shores ≥ 20 tiles from a road; altars deep in their climate. A monastery may stand on an island in a lake, linked by a ford.

### 8.11 Roads, crossings and the way graph

- **Pairs:** a spanning tree plus each holding's two nearest, over holdings and hamlets.
- **Great roads** (capitals, towns, castles) and **tracks** (villages, hamlets, monasteries). Road ×1.3, track ×1.15.
- **Least-cost search** with reused buffers and a bounding box (≤ 15 ms a road):

| Ground | Cost |
|---|---|
| Open | 1 |
| Forest | 1.8 |
| Hill | 2.2 |
| Slope | +1.5 a level |
| Wild region | ×4 |
| An existing road | 0.5 |
| Water | only by a bridge (water run ≤ 3), a ford (tracks; streams and rivers) or a ferry (great rivers, at towns) |
| Mountains and cliff edges | closed |

- **Crossing spacing:** if a river runs more than 60 tiles between crossings, add a ford (on a stream or river) or a ferry (on a great river) at the best spot.
- **Crossings** are listed in `WM.crossings` with their kind, river, season rule and toll holding.
- **The way graph** (§3.6) is built last, from the roads, crossings, river legs and chunk portals.

### 8.12 Sites, camps, deposits, ruins, lairs

| What | Rule |
|---|---|
| Bandit camps | Per preset (18–20 / 30 / 60), in fringe land 6–16 tiles from roads, off roads, outside realm cores and wild regions |
| River bandit camps | 1 per 2 river bands, on a bank near a ford or a navigable bend |
| Caves | In hills and mountains, ×2 weight in wild regions |
| Ruins | 60% in wild regions, the rest on old roads and in the fringe |
| Deposits | Today's rule (ore on hills and mountains, fish by shores), now also **fish in rivers and lakes** |
| Lair | §6.5 |

### 8.13 Territories: natural borders

Today's model stays: a tile goes to the holding with more of its travel-cost reach left there. Four changes:

1. **Barrier costs** in `landCost(i)`:

| Barrier | Cost |
|---|---|
| Crossing a stream or river | +6 |
| Crossing a great river | +12 |
| A mountain tile | 4 |
| A deep-forest edge | +3 |
| A wild region | ×3 |
| A cliff edge (Phase 7) | closed |

   Borders **snap to rivers**, ridges and forest edges.
2. **Grain:** a static warped-noise factor of 0.8–1.25 per tile.
3. **Smoothing:** two passes of a majority filter on near-ties. Exclaves under 12 tiles go to their neighbour.
4. **Contiguity:** holdings' land is connected; cut-off realm pieces under 40 tiles become wild.

Reach scales ×1.4 (village 10 → 14, castle 18 → 25), the same at every preset (realms get more holdings, not wider reach).

### 8.14 Sanity and fairness checks

These hold for **every allowed combination of settings** (§4.5). Counts scale with the settings; the rules don't.

| Check | Rule | Retries |
|---|---|---|
| Reachable | Every holding, hamlet, camp and sacred place is reachable by land from every capital, **in every season** | Roads, crossings, then land |
| Suitable land | Each capital scores ≥ 0.6; each realm has ≥ 2,000 suitable tiles within 90 tiles of its capital (Normal; ×1.5 at Large, ×2.4 at Huge) | Holdings |
| Balanced | Capital-to-rival distances within ±25% of the mean; realm land within ±30% of the mean | Holdings |
| A fair start | Each race's start city has ≥ 3 holdings within one day's travel and no wild region within 25 tiles | Holdings |
| Ports | Every port and river port on water connected to another port or the sea | Holdings |
| Wild | No holding inside; regions don't split a realm; each ≥ 1,500 tiles | Regions |
| Rivers | Never uphill (elevation never rises downstream); each ends in water; crossings at most 60 tiles apart; great rivers only in non-frost climates at their mouths, or allowed to stay unfrozen | Rivers |
| Seasonal | Seasonal rivers are never the only way to a holding: every holding is reachable when every seasonal crossing is closed | Crossings |
| Climates | Each ≥ 6% of land | Climate |
| Lair | ≥ 60 tiles from holdings, ≥ 25 from roads | Lair |
| No emptiness | Outside wild cores, the 95th percentile distance to the nearest place of interest (holding, hamlet, sacred place, site, camp, crossing) is ≤ 25 tiles at every preset | Sites, hamlets |
| No circles | The shape metrics of §14.2 | Climate, territory |

### 8.15 The classic seed (at Normal)

**The choice: the generator, anchored.** Seed `CLASSIC` at the **Normal** preset, with today's 37 holdings as anchors: names, races, kinds, realms, styles, prices and notes.

| Option | Pros | Cons |
|---|---|---|
| **A. Generator plus anchors (recommended)** | One code path, tested like any seed. Names, kinds, realms and `TOWNS` order stay | Coordinates change (about ×1.8), so a few tests adapt |
| B. A hand-tuned map | Exact control | 143k tiles of data; doesn't exercise the generator |
| C. Today's 224 × 160 as classic | No test churn | Not the bigger world; two code paths |

**How the anchors work:**
1. **Positions:** each realm's centroid is doubled, and each holding's offset from it is scaled ×1.4. The result is snapped to a suitable tile within 4: Ashford (36, 40) goes to about (83, 85), Karn Hold (172, 44) to about (338, 78).
2. **Terrain hints** in `places.js`:
   - a south coast with the League's ports on one sea;
   - frost north, desert south-east;
   - Karn Hold below peaks;
   - Willowmere an island village with bridges (the `routes` suite);
   - Stonebridge on a great river at a bridge;
   - Mirefen and Tidewatch in fen;
   - a great river from the northern peaks to the south coast past Stonebridge.
3. **Soft nudges, not stamps:** warped-falloff bumps of temperature, moisture or elevation over 12–30 tiles. The "no disc" metric runs on the classic world too.
4. **Generated around them:** rivers, regions, hamlets, sacred places, camps, roads.

---

## 9. Data model and saves

### 9.1 The world map

```js
WM = {                         // world/worldmap.js (R1)
  w, h, seed, gen: 'ashmark-1', classic, salt,
  settings: {v:1, preset, w, h, seed, holdings, hamlets, sacred, wild, land, rivers, mountains, climate, seasonal, monsters, bandits, economy, sites, start},  // §4.4, clamped
  kind:   Uint8Array(w*h),     // T_OPEN 0, T_FOREST 1, T_HILL 2, T_WATER 3, T_ROAD 4, T_MOUNT 5, T_FORD 6
  clim:   Uint8Array(w*h),     // dominant climate 0-3 (rules)
  temp, moist: Uint8Array,     // 0-255 (art blends, sub-biomes)
  elev:   Uint8Array,          // 0-255, sea ≈ 64; terrace = clamp((elev-64)>>5, 0, 3)
  feat:   Uint8Array,          // bits: 1 floodplain, 2 lake, 4 coast, 8 deep wood, 16 sparse edge, 32 bridge, 64 great road, 128 track
  edge:   Uint8Array,          // cliff edges E1 S2 W4 N8 (= battle wall bits); 0 until Phase 7
  region: Uint8Array,          // 0 settled or fringe, 1..n wild region
  flow:   Uint8Array,          // bits 0-4: log2 of flow; bits 5-7: downstream direction (8 ways)
  river:  Uint8Array,          // bits 0-1: width 0-3 (0 not a river tile); 2 navigable; 3 seasonal;
                               //      4 freeze; 5 flood; 6 dry (with flood in desert: flash); 7 delta channel
  rivers:    [{id, name, path:[i…], order, width, basin, mouth, seasonal: null|{freeze, flood, dry, flash, day}}],
  crossings: [{i, kind: 'bridge'|'ford'|'ferry'|'lowford'|'bed'|'ice', river, toll: holdingName|null, when: null|'summer'|…}],
  regions:   [{id, kind, name, tiles, box, core}],
  cliffs:    [{a, b, side}],   // escarpment candidates (Phase 7)
  graph,                       // the way graph (§3.6): nodes, edges, chunk portal cache
  sum                          // checksum of every byte layer
};
```

The **seasonal state is never stored**: `riverState(i)` reads the tile's mode bits and `season()` (§6.6.5).

**Holdings** keep `places.js`'s schema plus `realm`; hamlets add `kind:'hamlet', trade`; river ports `style:'riverport'`. **Sacred places** and the **lair** are sites. **Barges** are caravans with `water:true`.

### 9.2 What changes in today's tile codes

- **`T_FORD` = 6** is new: passable at ×0.5.
- **Every table indexed by kind** gains an entry: `SPEEDMUL`, `LAND_COST`, `roadCost`, `REGION_NAMES`, `PX.WN_KIND`, `terrainRecipeOf`.
- **River tiles** are `T_WATER` with a width in `river`. **Lakes** are `T_WATER` with `feat` LAKE. **Sea** is `T_WATER` with neither.
- **`passable(t)` becomes `passableAt(i)`**, which also reads the season: frozen tiles and dry beds are walkable.

### 9.3 What is saved

**The seed plus the changes (D8):**

```js
save = {v: 3, …today's P, day, clock…,
  world: {v: 3,
    map: {gen: 'ashmark-1', settings, sum},     // the seed and every setting (§4.4)
    edits: [],                              // tile changes in play (later: a burnt bridge, a felled wood)
    own: […Holding.saveRec()…],             // hamlets included; founded holdings with their base record, every holding with its tier (§7)
    sites, lords, caravans (barges included), …, seen (run lengths)
  }}
```

**On load:**
1. `genWorld(settings)` runs behind "Forging the world…".
2. If the checksum differs, the save is refused: "made in another world version; start a new game". There is no migration (the owner's rule).
3. `edits` are applied, then today's loading runs.

The season comes from `G.day`, so it needs nothing extra.

**Sizes:** §3.8. **Storage:** gzipped. **Version:** v3 lands with the generator; v2 is refused (D7). `tests/armygroups.js` checks that v2 is rejected.

---

## 10. Scale, travel and density

### 10.1 Figures against buildings and trees

One building per 16-px tile; **a person is clearly smaller than a house.** The map gets **its own small templates**; battle figures stay 15 px.

| Thing | Today (box, drawn) | Proposed (box, drawn) |
|---|---|---|
| House | 16, 14–16 tall | unchanged |
| World tree | 16, 10–14 tall | unchanged |
| Keep, citadel | 64 | unchanged |
| **Person on foot** (leader, follower, worker, drover, refugee, bandit) | 16, **10 × 15** | 16, **6 × 10** (a 3-px head; dwarves 6 × 9). `PEOPLE_MAP_T` uses the same colour letters, so every look maps one to one |
| **Rider** | 32, about 22 long, 26 tall with banner | 16: horse about 13 × 8, rider to about 13, banner ≤ 16 |
| **Host** (`drawHost`) | 16-px followers, rows 6 px apart | 6 × 10 followers, rows 4 px apart, at most 9 shown; a banner-bearer from 30 men |
| Cow | 32 | 16, about 11 × 7 |
| Sheep, pig, goat | 16 | 8, about 6 × 5 |
| Hen, rabbit, hare, fowl | 8, about 6 × 6 | 8, about 3 × 3 |
| Deer, stag, reindeer, gazelle, ibex | battle scale | 16, about 9 × 8 |
| Wolf, boar, bear, tiger, spider, scorpion, slime, griffin | battle sprites, 32 | 16: wolf 9 × 6, bear 11 × 8, griffin 12 × 9, slime 6 × 4 |
| Troll, wyrm | 32 | 16: troll 9 × 13, wyrm 15 × 7 |
| Dragon (flying) | its drake | 32 (it should look huge) |
| Caravan (ox, cart, drover) | 64 cell | 32 cell, about 30 × 12 |
| Barge | — | 32, about 24 × 10, a steersman and cargo |
| Ships: cog, boat | 64, 32 | 32 (about 26 × 20), 16 (about 12 × 8) |

**Click targets stay large for touch:** pick rings (`add(o,11,6)`, `REACH` 14) keep their size; `opaqueBox` shrinks with the sprites.

### 10.2 Slower, realistic movement

The owner: "player movement should be slower to make it realistic." The party should move like a band on foot, not a gliding token.

**On screen at 1× (game px a second; a 16-px tile; 1 tile ≈ 250 m):**

| Who, where | Today | Proposed | km a day |
|---|---|---|---|
| Band on foot, open ground | 19–21 | **8.9** (0.9 body heights a second, against 1.3) | 25 |
| Band on foot, road | ≈ 27 | **11.6** | 32 |
| Band on foot, track | — | 10.2 | 29 |
| Band on foot, forest | ≈ 12 | 5.3 | 15 |
| Band on foot, deep forest (wild) | — | 4.0 | 11 |
| Band on foot, swamp or fen | ≈ 10 | 3.6 | 10 |
| All-mounted band, open | ≈ 30 | **13.3** | 37 |
| All-mounted band, road | ≈ 40 | 17.3 | 49 |
| Barge downstream (passage) | — | 23 | 65 |
| Barge upstream | — | 8.0 | 22 |

**How (one change in three numbers):**
- **The day lasts longer:** `DAY_SECONDS` 120 → **180**.
- **`WORLD_PACE` 0.6 → 0.4.** The world's time units per game day stay the same (180 × 0.4 = 120 × 0.6 = 72), so every cool-down, regeneration, stay, raid and map-fight length measured per game day is **unchanged**.
- **`WORLD_SCALE.move` = 0.68** (R5's lever): 146 → 100 tiles a day on open ground.

Together these give on screen 19.4 × (0.4/0.6) × 0.68 ≈ 8.8 px/s, and about 25 km a day.

**Journeys stay sane:**

| | Normal | Large | Huge |
|---|---|---|---|
| Neighbouring holdings (≈ 40 tiles by road) | 0.3 day: 55 s at 1×, 14 s at 4× | same | same |
| Across a realm | ≈ 0.85 day | ≈ 1.0 | ≈ 1.3 |
| Across the world by road (×1.25 for winding) | 4.3 days | 6.2 days | 9.8 days |
| … real time at 1× / 2× / 4× / **Travel fast 8×** | 13 / 6.5 / 3.2 / **1.6 min** | 18.5 / 9 / 4.6 / **2.3** | 29 / 15 / 7.4 / **3.7** |
| … by barge downstream where a great river runs your way | about 2× faster than by road | | |
| Classic: Ashford → Sunreach by road | 2.8 days (8 min at 1×, 2 at 4×) | — | — |

**Time controls** (D23): **1×, 2×, 4×** (keys 1–3, as today's buttons), plus a **Travel fast** toggle (8×, key 4 or a button). It drops back to 1× at once when anything hostile comes into sight, an event or window opens, or you arrive. Long trips are quick when nothing is happening, and nothing is missed when something is. Passage aboard a boat runs at 4×.

**Animation: feet that don't slide (R13):**
- **Frames by distance**, not the clock.
- **Map people:** 4 walking frames, one per 2.5 px moved, so a full stride cycle covers 10 px, about one body height per two steps.
- **Riders:** 4 frames, one per 4 px.
- **Animals:** one per half body length.
- **Wheels:** turned by distance (a 6-px wheel turns once per 19 px).
- **Standing:** frame 0.
- **At 4× and 8×** the frames run faster with the ground speed, so the walk always matches.

**The AI moves on the same scale.** Every mover's step goes through `moveStep` (R5): lords, bands, patrols, companions' parties, caravans, barges, refugees, monsters, critters, ships and folk. The world stays consistent.
- **Who outruns whom:** flee odds (`encounters.js` `fleeOdds`: `mySpeed`/`chaserSpeed`) and chase choices (`stanceMove`) compare **unscaled** paces, so who outruns whom is exactly as today. Chases take about 2.2× longer in real seconds.
- **Durations meant to let you get away** do need retuning: the grace after a fight (`G.encCool`, `GRACE_GAP` 24 px) gives 0.68× the distance it used to. `ai.grace` × 1.47 keeps the gap you open the same. The `flee`, `pace`, `campbands` and `fights` suites check it.

**Interim (D25): yes, apply it to today's map in Phase 1, with the smaller figures.** It needs only R5's lever, R13's cycles and the day length, not the procedural world. Slower movement and smaller figures belong together (a 10-px figure at today's 20 px/s looks hurried), and it lets the owner judge the pace before the world grows. On today's 224 × 160 map it gives Ashford → Sunreach ≈ 1.5 days (4.6 min at 1×, 1.1 at 4×), against 1.1 days today.

### 10.3 Sight

`vis()` stays in pixels: figures shrink, tiles don't. Wild regions modify it (§6.2).

### 10.4 Gameplay at scale: no empty travel

| Lever | How |
|---|---|
| **Places every ~0.2 day** | The "no emptiness" check (§8.14): outside wild cores, 95% of land lies within 25 tiles of a place of interest at **every preset**. Places scale with area (hamlets, sacred places, sites, crossings) |
| **Wild regions on purpose** | Empty of people but full of beasts, ruins and lairs; named, so crossing one is a decision |
| **Fast lanes** | Roads ×1.3, tracks ×1.15, barges 2× a road downstream, passage at 4× time, Travel fast 8× |
| **Rivers give the map shape** | Crossings are destinations: tolls, ferries, bridge fights, river bandits |
| **Events** | Road events stay 0.32 a day (journeys now get more of them); `WILD_EVENTS` in wild regions; `RIVER_EVENTS` near rivers (ferryman, flooded ford, toll dispute, flash flood, thin ice) |
| **Hamlets and sacred places** | Services and quests between realms: work, rest, blessings, recruits |

### 10.5 AI ranges, caravans, patrols, economy

All in `WORLD_SCALE` (R5, today's values first), then set in Phase 6 with `worldsim`:

| Entry | Today | Proposed |
|---|---|---|
| `ai.lordSight`, `bandSight`, `monsterSight` | 90, 95, 70 px | unchanged |
| `ai.dread` | 70 px | unchanged |
| `ai.grace` (after a fight) | today's `encCool` | ×1.47 (§10.2) |
| `ai.lordTarget` | nearest by straight line | nearest by **travel days** (`Router.days`), ≤ 3 days unless it is the last enemy holding |
| `econ.caravanRange` | 10–90 tiles, cost /150 | ≤ 1.5 travel days (barge or road) |
| `econ.resRange`, `homeRange` | 10, 24 | 10, 30 |
| `econ.mill` | — | farm +15% on a river |
| `land.reach` | village 10 … castle 18 | ×1.4 |
| `land.friendly`, `land.pacify` | 50, 35 tiles | 80, 50 |
| `law.repNear`, `law.eventNear` | 15 tiles | 20 |
| `law.siegeOutrage` | 20 tiles | 30 |
| `war.front` | 60 tiles | 90 |
| `battle.elfWoods` | 10 tiles | 14 |
| `river.toll` | — | 2% of cargo; 1 gold per 5 people |
| `river.ferry` | — | 2 gold per 5 people, 0.05 day |

### 10.6 Population density per preset

The settled land and its roads stay as busy as today at every preset; the wild is emptier of people and fuller of beasts. `DENSITY` (R5) holds these:

| Thing | Today | Normal | Large | Huge | Where |
|---|---|---|---|---|---|
| Bandit bands | 30 | 48 | 80 | 170 | Fringe, 60% within 12 tiles of a road |
| River bands | — | 4 | 8 | 16 | Near crossings and navigable rivers |
| Bandit camps | 12 | 18–20 | 30 | 60 | Fringe |
| Monsters (start / cap) | 48 / 60 | 80 / 110 | 130 / 180 | 280 / 380 | 60% in wild regions |
| Critters | 96 / 120 | 170 / 220 | 290 / 380 | 620 / 800 | By habitat |
| Caravans and barges (cap) | 72 | 90 | 140 | 300 | Roads and rivers |
| Refugees | 42 | 50 | 80 | 160 | Roads |
| Ships | 30 | 36 | 60 | 120 | Seas, lakes, rivers |
| Caves / ruins / hideouts / travellers | 30 / 21 / 24 / 21 | 48 / 40 / 32 / 30 | 80 / 70 / 52 / 48 | 170 / 150 / 110 / 100 | Ruins and caves weighted to wild |

Bandits per 1,000 tiles of settled land and fringe stay about 0.9 at every preset, roughly today's.

---

## 11. AI on the bigger map

- **Lords:**
  - choose targets and rest places by travel days;
  - avoid wild regions (cost ×4);
  - new states: `claim` (annex a hamlet) and `hold` (a defending lord holds the crossing on his border nearest an enemy army, so *Hold the bridge* battles arise naturally).
- **Bands:**
  - spawn from a precomputed fringe mask weighted to roads;
  - roost in camps (`ai.camp` 220 px, unchanged);
  - raid hamlets;
  - river bands prey on barges and wait at fords.
- **Monsters:** home ranges as today; wild ones 1–2 levels above `monLevel()`.
- **Caravans and barges:** a realm picks the faster of road and river. Caravans keep to great roads (×0.9 cost); barges follow navigable water. Both pay tolls at foreign bridges (caravans) or at river tolls by a holding's landing (barges).
- **Patrols:** unchanged; their beat is their holding's land.
- **Pathing:** through `Router` (R11; the two-level router at every preset from Phase 2). Seasons toggle crossing edges. AI never plans over ice.
- **Far parties** run at the far tier (§3.5), and they resolve meetings by auto-resolve.

---

## 12. Art and UI

### 12.1 Biomes, rivers and seasons

- **Ground:** per-pixel climate weights from `WM.temp`/`WM.moist` (bilinear, warped), with a **4 × 4 ordered dither** between the top two palettes across the ecotone.
- **Intrusions** of the neighbour biome's small things, by weight.
- **Mixed tree species** in transition zones, with snow load by temperature.
- **Edges:** sparse forest edges; darker deep forest.
- **Height:** elevation lighting; a snow line on high peaks.
- **Rivers:**
  - **brooks** as 1–3 px lines that follow `flow` (painted only);
  - **streams, rivers and great rivers** as water tiles, shaded by width, with banks of reeds and stones;
  - current glints that drift **downstream** (`drawEnv` layer 0, reading `flow`'s direction);
  - **deltas** as fanned channels through reeds;
  - **fords** lighter, with stepping stones;
  - **ferries** with a landing and a raft;
  - **toll bridges** with a toll house;
  - **rapids** in white water;
  - **seasonal rivers**, all year: a pale gravel edge and a dotted bank line, so the player can learn them.
- **Season overlays** each frame, on the river tiles in view only (never a repaint): ice and snow on frozen rivers; brown high water and spread marsh on flooded ones; a dry stony bed and sandbars on dry ones.
- **Engine:** through `PX.worldNaturePaint` with new spec fields (`temp`, `moist`, `elev`, `feat`, `flow`, `river`); the overlays are `PX.riverSeason(state, w, dir)`. Gallery: `?view=nature&blend=1`, `?view=rivers` (every width, delta, ford, ferry, toll bridge, rapids, and each seasonal state). The owner approves before integration.

### 12.2 Soft territory borders

- **The line:** borders traced at tile corners from the smoothed `LAND`, smoothed (Chaikin, twice), drawn as a **1-px dotted line** at 60%.
- **The tint:** fades inward over 2 tiles.
- **Between one realm's holdings:** a faint line, on hover or in the Fief tab.
- **Cost:** cached per chunk as an overlay, rebuilt when `LAND` changes.

### 12.3 New places, through the engine

All new places are `PX` generators, previewed in `gallery.html`, and approved by the owner before they go into the game:

| Place | Generator |
|---|---|
| Hamlet centre (fish racks, sawpit, sheepfold, pithead, reed stacks) | `PX.site({type:'hamlet', trade})` |
| Standing stones | `PX.site({type:'stones'})` |
| Holy grove | `PX.site({type:'grove'})` |
| Monastery (64 box) | `PX.building('monastery')` |
| Altars | `PX.site({type:'obelisk' / 'altar' / 'idol'})` |
| River port pier, ferry landing, toll house, watermill | `PX.pier`, `PX.prop` (new kinds) |
| Barge | `PX.boat({kind:'barge'})` |
| Wild ruins | `PX.site({type:'ruins'})`, new variants |
| Dragon's lair (drawn once found) | `PX.site({type:'lair'})` |

### 12.4 UI

- **New game:** the world settings screen (§4): presets, seed, size, the Advanced fold-out and a preview. Then the "Forging the world…" screen with progress.
- **Esc menu:** a **World** page with the seed, the world code (Copy), the settings and the final counts.
- **Full map:** M, or a tap on the minimap. It shows realms, regions, rivers (seasonal ones marked) and crossings, with a legend.
- **Minimap:** about 128 × 91 on screen, drawn from the low-resolution build (§3.4).
- **HUD:** date and season ("Day 17 · Summer"), region name, the Travel fast toggle.
- **Ports:** a Take passage panel listing destinations, days and price.

### 12.5 Depth sorting and see-through (built separately, earlier)

- **Trees and buildings stay painted** in the chunk.
- **Overdraw what stands in front:** for each figure in view, the sprites in front of it (their box overlaps the figure, their foot is lower on screen) are drawn again over it: in full over others, at 0.4 alpha over your own party (`PROPFADE`, as in battle). That is about 2–6 sprites per figure.
- **What the world art must provide:** an index per chunk of its standing sprites (`{x, y, s, box}`, from the nature plan and the lots), sorted by foot y. Ranges keep column-cut faces.
- **Later:** toll houses, mills, ferry landings and Phase 7 cliff faces join the index.

---

## 13. The battle link

`terrainAt(x,y,env)` keeps its contract (tile, 8 neighbours, climate, water, bridges, roads, elven towns). New reads are optional and null-safe:

| World data | Battle use | Phase |
|---|---|---|
| River width | The field's deep water: width 1 → 3 cells (48 px, today's), 2 → 5 cells, 3 → 8 cells | 2 |
| World bridge on or by the tile | **The world's bridge is the battle's bridge**: one bridge where the road crosses (the *Hold the bridge* field), 2 cells wide, stone or wood as on the world map | 2 |
| `T_FORD` | A river with fords only, where the world's ford lies | 2 |
| Ferry | A river with one ford at the landing (shallows), so the field stays fair | 2 |
| Delta or floodplain | Marsh patches and channels | 2 |
| **Season state of the tile's river** | **Frozen:** the river is all ice, crossed anywhere (today's frost rule). **Flooded:** no fords; deep water 2 cells wider; marshy banks. If no bridge remains, the river runs along the north or south edge instead of between the armies. **Dry bed:** no water; a sunken gravel channel (×0.9 speed, no cover). **Low water:** one extra ford | 5 |
| `feat` DEEP | The deepwood layout always | 4 |
| Region kind | Recipe bias (highlands: cliffs ×2; wastes: spires and erg; fen: fen and mere) | 4 |
| Elevation, `edge` cliffs | Hills along the rising side; a plateau edge with a ramp at the world's pass (both ends alike, TERRAIN D5) | 7 |

**The field seed** becomes `hash(tx, ty, code + WM.salt)`, with salt 0 for classic. The **season changes only the water**, never the layout, so the same place in the same world is always the same field (TERRAIN D4). Terrain tests use the lab and fixtures and don't move. World-tile tests scan for a tile of a kind.

**Frequency check:** rivers make *Hold the bridge* more common. `btypebalance` and the `battletypes` trigger counts are re-run in Phase 2. Phase 5 adds river ambushes at fords.

---

## 14. Tests and balance

### 14.1 Suites that assume today's map

| Suite | Assumes | Plan |
|---|---|---|
| `territory` | "224 × 160 tiles with 37 holdings"; tile counts | Size from `WM`; shares; "37 realm holdings + hamlets" |
| `mapview` | Reach from Ashford; climates > 6%; holdings in their climate | Classic must pass; also over 10 seeds per preset |
| `routes` | Willowmere island; bridges ≤ 3 | Kept by the classic hints |
| `worldnature` | Counts; paint < 6,000 ms | Per-chunk time; shares |
| `ships` | Ports share seas | Classic hint; rivers now join waters |
| `pace`, `flee`, `campbands`, `fights` | Today's speeds and grace | Ratios unchanged; distances after grace checked (§10.2) |
| 46 files naming holdings ("Ashford" 109 times), 15 indexing `TOWNS[0..2]` | Names, kinds, races, realms, order | **The classic world keeps them**; a few literal coordinates adapt (`captives`, `battletypes`, `controlaudit`, `visual/shot`) |
| `armygroups` | v1 rejected | v2 rejected |
| `visual/perf`, `visual/worldsim` | Timings, report | Re-baselined (§14.4) |
| Battle suites | Lab fields, terrain off | Unchanged |

**Harness:** `tests/harness.js` installs the classic world (Normal), as it sets `TERRAIN.on=false`.

### 14.2 New suites

| Suite | Checks |
|---|---|
| `tests/worldprint.js` (Phase 0) | The eight world hashes |
| `tests/worldgen.js` | Determinism per preset (Normal and Large in the sweep; Huge in `visual/worldscale`); different seeds differ; no `Math.random`; the banned-function check; time per stage |
| `tests/worldsanity.js` | §8.14 over 30 seeds at Normal and 10 at Large |
| `tests/worldshape.js` | No-circle metrics (next table) |
| `tests/rivers.js` | Never uphill; ends in water; width follows flow; deltas fan; navigable continuity and rapids; crossing spacing; every holding reachable with all seasonal crossings closed; per-climate flags (frost: all but great rivers; desert wadis; swamp streams; grass about 30% of streams); `riverState` by season; fords closed in flood; ice walkable; dry beds walkable; tolls paid and refused; ferry; passage times up- and downstream; barges saved and robbed like caravans |
| `tests/router.js` | Two-level paths equal or within 5% of a full A* on 200 random pairs; the cache; season edge toggles; time per query by preset |
| `tests/worldscale.js` | Map person ≤ 10 px tall, rider ≤ 14, all shorter than a house; on-screen speeds of §10.2 within ±5%; frames by distance; the grace gap |
| `tests/worldchunks.js` | Stitched equals eager; LRU cap; slice budget; jumps |
| `tests/lod.js` | A far party reaches the same holding on the same day (±0.1 day) as a near one; far meetings resolve |
| `tests/worldsettings.js` (Phase 2b) | **Determinism:** the same settings and seed give the same checksum and starting population. Changing any map setting changes the map. Monsters and bandits change only populations. **World code** round trip, including a hand-edited code. **Clamps:** too many holdings for the size, custom sizes snapped to 32, aspect, phone area, Vast wild with Crowded holdings. **Every preset** generates and passes `worldsanity` (Huge in the visual report). **Corner combinations** (each setting at its minimum and maximum, plus the worst pairs: Huge with maximum holdings, More sea and Vast wild; Normal with Many hamlets and Few wild) over 3 seeds each. **The preview matches the real map:** land and water agree on ≥ 95% of sketch points, climate on ≥ 90%, capitals within 2 sketch pixels. **The screen:** header, `nav()` bar, Esc, and fit at 844 × 390 |
| `tests/hamlets.js`, `tests/sacred.js` | Phase 4 rules |
| `tests/founding.js` (Phase 4b) | **Sites:** counts per preset and setting; placement rules; reachable in every season. **Free founding:** each rule refuses with its reason. **Founding** a camp takes 6 soldiers, the gold and the materials; the camp is yours, on the map, in `TOWNS` and with land. **Tiers:** every upgrade's requirements; the centre grows in place; houses and estates follow; tier-down by hunger and by sacks; a lost camp frees its site; never more than one city per realm. **Saves:** a founded, upgraded holding survives a reload byte for byte. **Raids:** grace days, then raids; you are told. **Tension:** honour changes. **A companion governor** adds Stewardship. **The settler start** passes its fairness rules on 30 seeds per preset |
| `tests/tiers.js` (Phase 4b) | AI holdings grow and shrink by the rules (with `TIERS.ai` on); floors and caps; off in the harness, so classic kinds never change under the other suites |
| `tests/visual/worldscale.js` (report) | Per preset: generation time and peak memory, chunk paint, router, `updateWorld`, daily jobs, save size plain and gzipped |

**No-circle metrics:**

| Metric | Pass |
|---|---|
| Climate disc: share of a holding's climate in rings at 9–11, 11–13, 13–15 tiles | No ring-to-ring drop > 35 points |
| Border radius variation (64 angles, coefficient of variation) | ≥ 0.20 (a disc gives about 0.03) |
| Border length ÷ convex-hull perimeter | ≥ 1.2 |
| Realm-border tiles within 1 of a river, ridge, cliff or forest edge | ≥ 35% (≥ 20% on rivers alone) |
| Biome boundary in straight axis-aligned runs > 6 tiles | ≤ 5% |
| Median ecotone width | 2–6 tiles |

### 14.3 Balance targets

| Measurement | Target |
|---|---|
| Hamlets annexed by day 120 | 20–40% |
| A realm wiped out by day 120 | In ≤ 1 of 5 runs |
| Sieges per 120 days | Within ±30% of today's baseline |
| Caravan and barge arrivals per holding per day | Within ±25% of today's |
| Encounters per game day of travel in settled land | Within ±20% of today's |
| Encounters per day in a wild region | 1.5–2× settled land, mostly beasts |
| *Hold the bridge* share of world battles | ≤ 25% |
| River trade share | 20–40% of shipments where two ports share water |

### 14.4 Re-baselining `worldsim`

`worldsim` advances lords by 12 units of `d` a day, while play gives 72, so the report runs lords 6× slow.
1. **Before Phase 1:** fix it to `DAY_SECONDS × WORLD_PACE` and record a baseline on today's map.
2. **After Phase 1's pace change:** record again (d per day is unchanged, but movement per day is 0.68×).
3. **Later:** run on the classic world and 5 seeds per preset.

New rows: hamlets annexed, sieges, days per march, caravan and barge trips, crossings held, seasonal closures met.

---

## 15. Phased plan

Agents are split by files that don't overlap (5 at most). **The `WM` shape (§9.1) is the contract.** The game stays playable after every phase.

| Phase | Scope | Agents and files | Effort |
|---|---|---|---|
| **0. Refactors first** (§2) | R1–R17, behaviour-preserving, built for Huge; the loading overlay (§5); the chunked battle ground; the `BattleSite` hand-off | Four waves (0–3); every agent, file list, dependency and check is in **§15.1** below | **L** (18–21 sessions) |
| **1. Figures shrink, travel slows** (depth sorting is separate and may go first) | Map templates (people, riders, beasts, critters, carts, ships); host layout; frames by distance; `DAY_SECONDS` 180, `WORLD_PACE` 0.4, `move` 0.68; time controls 1/2/4× and Travel fast 8×; the grace retune; `worldsim` fix and baselines. **On today's map** | **A:** `gfx/people.js`. **B:** `world/critters.js`, `engine/beasts.js`, gallery. **C:** `world/caravans.js` (art), `world/ships.js` (`shipSprite`). **D:** `gfx/render.js` (host, frames), `core/core.js` (day, pace), `data/world.js` (`move`, grace), `ui/input.js` and `Ashmark.html` (speeds), `tests/worldscale.js`, `tests/visual/worldsim.js` | **M** |
| **2. The generator, presets, river systems, the classic seed** | `genWorld` stages; presets; drainage basins, widths, deltas, rapids, navigable flags, permanent crossings (bridges, fords, ferries), river towns and mills; holdings, names, roads, camps; the way graph and the two-level router; streaming at every preset; save v3, gzip, map identity; **the settings object (§4.4) as the generator's one input, with every setting and clamp working in code** (the contract for 2b); a plain New game choice (Classic or Random at a size) until 2b; "Forging the world…" and "Returning to…" through the loading overlay (`genWorld` yields per stage; load and new game as steps), the full map, the minimap; battle river width and world bridges. `WORLD.gen` flag until accepted | **A:** `world/worldgen.js` (new: terrain, drainage, rivers). **B:** `world/worldplace.js` (new: holdings, names, roads, crossings, camps, classic anchors), `data/places.js` (hints). **C:** `core/save.js`, `ui/menu.js`, `ui/map.js` (new), `tests/harness.js`, `tests/armygroups.js`. **D:** `world/router.js` (graph, A\*), `gfx/worldart.js` (rivers, prefetch), `gfx/render.js` (minimap). **E:** `battle/terrain.js` and `battle/encounters.js` (width, bridges, fords), `tests/worldgen.js`, `tests/worldsanity.js`, `tests/router.js`, suite adaptations | **L** (≈ 15 sessions) |
| **2b. World settings screen** (§4) | The New game screen: presets (Classic, Normal, Large, Huge, Wild Frontier, Crowded Realms), seed and world code, size and custom size, the Advanced fold-out, live clamps with notes, the quick sketch preview and the optional full preview, the World page in the Esc menu, the save list line; seeded starting population | **A:** `ui/worldsetup.js` (new), its section of `style.css`, `ui/menu.js` (the New game order). **B:** `world/worldgen.js` (the sketch pass: coarse sampling, coarse drainage and holdings). **C:** `world/worldsettings.js` (new: defaults, presets, clamps, world code), `core/save.js` and `ui/ui.js` (save line), the Esc menu's World page. **D:** `core/session.js` (seeded `begin` spawns), `tests/worldsettings.js` | **M** |
| **3. Biomes and borders blend** | Climate blends, ecotones, mixed trees, sparse edges; territory barrier costs, grain, smoothing; soft borders | **A:** `world/territory.js`. **B:** `engine/worldnature.js`, gallery. **C:** `gfx/worldart.js`. **D:** `tests/worldshape.js` | **M** |
| **4. New places** | Wild regions; hamlets; sacred places; the dragon's lair and clues; the art | **A:** `world/worldgen.js` (regions), `world/map.js` (`regionAt`), `world/world.js` (survive, spawns), `data/world.js` (`WILD`). **B:** `data/holdings.js`, `world/realms.js`, `world/brains.js` (`claim`), `ui/town.js`. **C:** `world/sites.js`, `world/quests.js`, `world/events.js`. **D:** `engine/buildings.js`, `engine/pieces.js`, `engine/gallery.html`. **E:** `world/monsters.js`, `tests/hamlets.js`, `tests/sacred.js` | **L** |
| **4b. Founding your own holding** (§7) | Founding sites and free founding; the shared tier model (camp, hamlet, village, town, city or castle) with `TIERS`; upgrade and tier-down projects; the centre growing in place; your realm from the first camp (tension, governors, protection of hamlets); AI tier changes; raids and upkeep; the settler start and the two settings; tier art per people | **A:** `data/holdings.js` (`camp`, `tier`/`next` in use, `TIERS`), `world/lots.js` (reserved block, centre replacement). **B:** `world/founding.js` (new), `world/estates.js` (tier projects), `world/siege.js` (`fiefBody` upgrade row), `ui/town.js`. **C:** `world/sites.js` (`FoundingSite`), `world/worldplace.js` (sites), `world/worldsettings.js`, `core/session.js` (settler start). **D:** `engine/pieces.js` (settler camp, stake), `engine/buildings.js` (hamlet centre, city citadel variant), `engine/gallery.html` (`?view=tiers`). **E:** `world/realms.js` (tension, AI tiers), `world/brains.js` (raids, burning), `world/companions.js` (governors), `tests/founding.js`, `tests/tiers.js` | **L** |
| **5. Living rivers** | The calendar and `SEASON_PROFILE`; seasonal rivers (freeze, flood, dry, flash) by flag and climate; season overlays and the all-year look; crossing toggles; toll bridges and ferries' fees; barges (`BargeParty`), passage, river trade; river bandits; lords holding crossings; battle water by season; `RIVER_EVENTS` | **A:** `world/calendar.js` (new), `world/map.js` (`passableAt`, `riverState`), `world/world.js` (`dayTick` hook, HUD date). **B:** `world/ships.js` (river water, passage), `world/caravans.js` (`BargeParty`, tolls), `world/economy.js` (toll income). **C:** `battle/terrain.js`, `battle/encounters.js` (season water, ford ambush). **D:** `engine/worldnature.js` (`PX.riverSeason`), `engine/pieces.js` (barge, toll house, ferry), `gfx/worldart.js` (overlays). **E:** `world/brains.js` (river bands, `hold`), `world/events.js`, `tests/rivers.js` | **L** |
| **6. Retune per preset** | `WORLD_SCALE` and `DENSITY` values; AI by travel days; `worldsim` per preset; `visual/worldscale`; wiki tables | **A:** `data/world.js`. **B:** `tests/visual/worldsim.js`, `tests/visual/worldscale.js`, `tests/visual/perf.js`. **C:** `world/brains.js`, `world/realms.js`. **D:** `wiki.html`, `README.md` | **M** |
| **7. World cliffs** | Escarpments into `WM.edge` with passes, and desert mesas (§6.7); edge-aware movement, roads, territory and router; faces in the art and depth index; battles take their cliffs from the world (in the desert, a mesa with 1–2 natural sand ramps) | **A:** `world/worldgen.js`, `world/map.js`, `world/router.js`. **B:** `engine/worldnature.js`, `gfx/worldart.js`. **C:** `battle/terrain.js`, `battle/encounters.js`. **D:** `tests/worldcliffs.js`, `tests/fieldvariety.js` | **M–L** |

**Order and playability:**
- **0:** the same game, better structure.
- **1:** the same map, smaller figures and a realistic pace.
- **2:** the new world at three sizes, with big rivers; densities are still today's numbers until Phase 6.
- **2b:** you choose your world on the settings screen.
- **3:** looks natural.
- **4:** worth exploring.
- **4b:** found your own holding and grow it.
- **5:** the rivers come alive.
- **6:** balanced.
- **7:** cliffs.

Phases 2b, 3, 4 and 5 can overlap on different files (2b needs only Phase 2's settings contract). Phase 4b follows Phase 4 (it needs the hamlet kind and its art) and can overlap Phase 5. Phase 1 may start once Phase 0's wave 2 has landed (it needs R5 and R13), except its `gfx/render.js` work, which waits for R16 (wave 3) to land. Settings that touch Phase 4, 4b and 5 content (hamlets, sacred places, wild land, founding sites, the settler start, seasonal rivers, river bands) work in code from Phase 2 and show their effect as that content lands.

**Effort:** 0 L, 1 M, 2 L, 2b M, 3 M, 4 L, 4b L, 5 L, 6 M, 7 M–L: roughly 58–68 agent sessions, with up to 5 in parallel.

### 15.1 Phase 0 launch plan

**Rules for every agent:**
- **Files:** edit **only** the files in your "may edit" list. Every other file is off limits; if you need a line in one, ask its owner through the coordinator. **The script lists** (`Ashmark.html`, `wiki.html`, and the load order in `tests/structure.js`) belong to agent A for all of Phase 0: send A the line for any new file.
- **Behaviour:** every refactor preserves behaviour. Nothing may change a hash, fingerprint or test result, except where a row below says so (R16's zoomed-out huge forests).
- **Done means:**
  1. the full sweep `.\tests\run-tests.ps1 -Parallel 4` has no failure that the baseline did not have (known before Phase 0: `lots` "its realm builds it another house" at `-Seed 1` and `-Seed 2`; `monsters` "spiders web your fighters" unseeded);
  2. `.\tests\run-tests.ps1 -Suites worldprint -Seed 1` shows all eight world hashes equal to the baseline;
  3. **the battle fingerprints** are byte-identical: `-Suites battlesetup,battlecommands,actorrules,attackrules,battleresolution`, `-Suites rts -Seed 1,2,44`, and `visual/battleperf` (`fp`) and `visual/moraleaudit` run by name;
  4. the refactor's own checks in the table at the end.
- **Merging:** each agent's diff is reviewed and merged on its own. A wave starts only when the previous one is merged and green.
- **Baseline:** the coordinator commits the current working tree before wave 0, so the baseline is a known commit.

**Wave 0: the safety net (alone, first)**

| Agent | Refactor | May edit | Then |
|---|---|---|---|
| **W** | Step 0.0, world fingerprints (§2.0) | `tests/worldprint.js` (new) | Records the eight hashes as constants in the suite (as `battlesetup` keeps its fingerprints) from the baseline commit, at `-Seed 1`. Runs green twice in a row. Nothing else starts until it is merged |

**Wave 1** (5 agents in parallel, after wave 0)

| Agent | Refactors | May edit | Must not edit (closest neighbours) | Depends on |
|---|---|---|---|---|
| **A** | **R1, R2, R3** | `world/worldmap.js` (new), `world/map.js`, `world/resources.js`, `world/lots.js` (allocation of `OCC`/`LOT` only), `world/fog.js`, `world/ships.js` (`WATER_ID` reset only), `world/territory.js` (`LAND` allocation and Int16 only), `core/core.js` (`MW`/`MH` as `let`), `core/session.js` (`useWorld`; the `capitalOf`/`startHolding` call from B), `main.js` (the same), the script lists, `tests/worldprint.js` (R3's "begin twice" check) | `data/*`, `gfx/*`, `engine/*`, `battle/*`, all other `world/*` | Wave 0 |
| **B** | **R4** (and R5's companion radii, from D's table) | `data/places.js`, `data/holdings.js`, `world/realms.js`, `data/progression.js`, `world/companions.js` | `core/*`, `main.js` (send A the two call sites), `world/sites.js`, `world/quests.js` (A, wave 2) | Wave 0 |
| **C** | **R6** | `engine/worldnature.js`, `engine/gallery.html` (its nature view), `gfx/worldart.js`, `gfx/sprites.js` (`worldCv` kept as a stitched compatibility canvas; `miniCv` lazy, built from tile data), `tests/worldnature.js`, `tests/worldchunks.js` (new) | `gfx/render.js` (E switches the blit in wave 2), `world/critters.js` (D removes `initCritters`' `worldCv()` call) | Wave 0 |
| **D** | **R5**, except `core.js`, `ships.js` and `territory.js` | `data/world.js` (new), `world/brains.js`, `world/caravans.js`, `world/monsters.js`, `data/critters.js`, `world/critters.js` (also dropping the `worldCv()` call), `world/refugees.js`, `world/patrols.js`, `world/folk.js`, `world/estates.js`, `world/reputation.js`, `world/events.js`, `world/siege.js`, `world/world.js` (the player's step, `survive`, spawns), `data/economy.js` | `core/core.js`, `world/ships.js`, `world/territory.js`, `battle/*` (flee odds stay as they are) | Wave 0 |
| **Battle** | REFACTOR **items 11 and 13** | `js/battle/*`, `ui/battlehud.js`, `ui/moraleicons.js`, their tests | `engine/*`, `gfx/*`, `world/*`, `data/*` | Wave 0 |

**Wave 2** (after wave 1 is merged)

| Agent | Refactors | May edit | Must not edit | Depends on |
|---|---|---|---|---|
| **A** | **R10, R11, R12, R13**, and R5's `SHIP_CAP` | `world/router.js` (new), `world/map.js`, `world/world.js` (tiers in the update loops, `walk`'s `o.wd`, fights in `worldObjects()` for E), `world/parties.js` (`tier`, `frameOf`), `world/brains.js`, `world/monsters.js`, `world/critters.js`, `world/ships.js` (tiers, `SHIP_CAP` from `DENSITY`), `world/sites.js`, `world/quests.js`, `tests/lod.js` (new), the script lists | `gfx/*`, `core/save.js`, `world/territory.js`, `world/fights.js` | R1–R3, R4, R5 |
| **B** | **R9, R14** | `core/save.js`, `data/holdings.js` (`saveRec`/`loadRec`), `core/session.js` (`begin` as steps), `ui/loading.js` (new), its section of `style.css`, `tests/loading.js` (new), `tests/visual/loadtimes.js` (new), `tests/harness.js` (the `LOADING.sync` line) | `gfx/render.js` (E adds the `frame()` loading mode), `world/*` | R4, R1–R3 |
| **E** | **R7, R8**, R5's territory constants, the world drawing switch | `world/territory.js`, `world/fights.js`, `gfx/render.js`: **world parts only** (`drawWorld`: `WorldArt.draw` in place of the `worldCv()` blit, the low-resolution minimap, a `MAP_LAYER` table by `mapKind` for the minimap's order) and `frame()` (R14's loading mode); `tests/territory.js` (the incremental-equals-full check) | The battle drawing in `render.js` (`drawBattle` and what it calls: R16, wave 3), `world/world.js` (A adds fights to `worldObjects()`) | R1, R6, R14's API (from B) |
| **D** | R5's `core.js` part | `core/core.js` (`MAP_DENS` and the caps it makes, now from `DENSITY`) | everything else | R1 (A has left `core.js`) |
| **Battle** | **R15** | `battle/setup.js`, `engine/ground.js` (`PX.battleGroundSteps`), `tests/groundhash.js` (new: the 24-field pixel hashes), `tests/visual/fieldperf.js` | `gfx/render.js`: the lazy `B.ground ||= …` there becomes a no-op once setup paints the ground, so it needs no edit; `world/*` | Items 11 and 13; R14's API |

**Wave 3** (after wave 2 is merged)

| Agent | Refactors | May edit | Must not edit | Depends on |
|---|---|---|---|---|
| **A** | **R17** | `world/worldmap.js` (`battleSite`), `battle/terrain.js`, `battle/setup.js` (`battleEnv`, `groundSpec`, `fieldSize`), `battle/encounters.js`, `battle/lab.js` (`labSite`), `data/world.js` (`WORLD_SCALE.battle`), `tests/battlesite.js` (new) | `engine/*`, `gfx/*` | R1, R15 |
| **Battle** | **R16** | `engine/ground.js` (`PX.battleGroundPaint`), `gfx/render.js`: **battle parts only** (`drawBattle`, `drawInView`, `lodStep`, `battleEnts`), `gfx/vfx.js` (`goreLayer`), `ui/battlehud.js` (`rangeLayer`), `gfx/worldart.js` (`paintArena`), `gfx/sprites.js` (`arenaFor`), `battle/camera.js` (`drawMiniField`), `tests/groundhash.js`, `tests/visual/fieldperf.js` | `battle/setup.js`, `battle/terrain.js` (A) | R15 |

**Verification per refactor**, on top of the "done" checks above (W1–W8 are the world hashes of §2.0; "battle fp" means the fingerprint suites):

| Refactor | Suites that must pass | World hashes | Battle fp |
|---|---|---|---|
| Step 0.0 | `worldprint` green twice | records W1–W8 | — |
| R1 | `mapview`, `territory`, `routes`, `worldnature`, `fog`, `ships`, `lots`, `estates`, `structure` | W1–W8 | unchanged |
| R2 | `mapview`, `routes`, `resources` | W1, W2, W5 | unchanged |
| R3 | `worldprint` "begin twice equals a fresh page" | W1–W8 | unchanged |
| R4 | `holdings`, `economy`, `factions`, `companions`, `session`, `reputation`, `quests`, `estates` | W3, W7 | unchanged |
| R5 | `pace`, `flee`, `caravanparty`, `brains`, `monsters`, `critters`, `refugees`, `patrols`, `events`, `campbands`, `ships`, `fights` | W7, W8 | unchanged |
| R6 | `worldnature`, `worldchunks` (stitched equals today's canvas; streamed equals eager), `visual/perf` (map blit no slower) | W5, W6 | unchanged |
| R7 | `territory` (incremental equals full after 200 random changes) | W4, W6 | unchanged |
| R8 | `clicks`, `fights`, `worldobject`, `worldobjects2`, `mappolish` | W6 | unchanged |
| R9 | `armygroups`, `session`, `captives`, `stay` | W7 | unchanged |
| R10 | `sites`, `campbands` | W7 | unchanged |
| R11 | `routes`, `mapview`, `sites`, `quests`, `brains`, `patrols`, `caravanparty` | W8 | unchanged |
| R12 | `lod` (infinite radius: identical), `visual/perf` | W8 | unchanged |
| R13 | `mappolish` | W6, W8 | unchanged |
| R14 | `loading` (shows and hides, threshold, monotonic, error, stall, sync equals async), `session`, `armygroups` | W1–W8 with sync on | unchanged, sync and async |
| R15 | `groundhash` (24 fields), `terrain`, `routing`, `fieldvariety`, `roads`, `battletypes`, `battlesetup`; `Math.random` count before the first frame | — | unchanged |
| R16 | `groundhash` at zoom 1 (blood and reach included), `fieldvariety`, `terrain`, `battleui`, `concealment`, `battlefog`; `visual/fieldperf` reports 25–35 MB on a huge field | — | unchanged |
| R17 | `battlesite` (every classic tile: same recipe, code, river, edges, road, cover), `fieldvariety`, `terrain`, `battletypes`, `aiterrain`, `routing`, `roads`, `battlesetup` | — | unchanged |

---

## 16. Owner decisions

**All 39 decisions were approved by the owner on 2026-10-18, as recommended**; D40 was decided by the owner the same day. Each row gives the decision and what was decided.

| # | Decision | Decided (as recommended, 2026-10-18) |
|---|---|---|
| D1 | Continent or archipelago? | **One continent** with a ragged coast, inland seas or big lakes, a few small isles. |
| D2 | World size? | **A new-game option with presets:** **Normal** 448 × 320 (phones' default), **Large** 640 × 448 (desktop default), **Huge** 1024 × 768. Everything is built for Huge from Phase 0. The practical ceiling is about 1024 × 768 (§3.9). |
| D3 | The classic seed? | **The generator with today's 37 holdings as anchors, fixed at Normal**: Normal is designed for 37 realm holdings, is the phone default and is the fastest for tests. |
| D4 | What does New game offer? | **A world settings screen** (§4) after race and background. Presets: Classic, Normal, Large, Huge, Wild Frontier, Crowded Realms. Seed and world code, and size (or custom within limits). An **Advanced** fold-out with the other settings. A quick preview. Then "Forging the world…". Classic is a preset locked at Normal with today's holdings. |
| D5 | Hamlets' politics? | **Independent and slowly absorbed**: trade, recruit and jobs; bands raid them; realms annex slowly; you win them by protection; raiding one costs honour, not war. |
| D6 | Sacred places' effects? | **Modest weekly blessings, monastery services, sanctuary**; no desecration in v1. |
| D7 | Old saves? | **v3 with the generator**; v2 refused (no migration). |
| D8 | What is saved, and how? | **The seed plus changes** with a checksum, **gzipped** (`CompressionStream`, falling back to plain JSON). Huge is not offered without gzip. |
| D9 | Travel and time? | **Slower and realistic:** a band on foot 8.9 px/s on screen (today 19–21), 25 km a day; road 32 km; mounted 37–49 km; barge 65 km downstream. **The day lasts 180 s** (was 120), with `WORLD_PACE` 0.4, so timers per game day are unchanged. Walk cycles follow distance. Long trips use 4× and **Travel fast 8×** (D23), roads, and passage by boat. |
| D10 | Realm holdings? | **Per preset:** Normal and classic 37 (today's); Large about 55; Huge about 90, with lords 20 / 30 / 45 (generated names past each realm's four). Still five realms. |
| D11 | Wild regions' harshness? | **Moderate:** slower travel, sight changes, survival ×1.5 in wastes, beasts ×3 and stronger, no bandits, roads go round. |
| D12 | The dragon's lair? | **Seen only from 2 tiles**, off the minimap until found; clues from monasteries, taverns and stones; the dragon flies home at dawn. |
| D13 | Rivers? | **Crossed only at bridges, fords and ferries**; crossings are choke points. **Big rivers outside frost lands never change, and great rivers never change anywhere.** Seasons affect only rivers flagged by the generator from size and climate: in frost lands everything but great rivers (freezes in winter, thaw floods in spring); desert wadis (dry, with 2–3-day flash floods); swamp streams (wet and dry seasons); about 30% of temperate streams. Seasonal rivers have their own look all year. |
| D14 | Cliffs on the world map? | **Sheer escarpments with passes**, none one-way. Battles on cliff tiles get a plateau edge. |
| D15 | Battle fields between worlds? | **The field seed adds the world's salt** (0 for classic). The season changes only the water. |
| D16 | Order of refactors? | **Phase 0 first: R1–R17 in waves 0–3** (§15.1). Battle items 11 and 13 run alongside wave 1; the same battle agent then does R15 (wave 2) and R16 (wave 3). R17 goes in wave 3 (it needs R1 and R15). Item 18 goes before or after Phase 0, never during. |
| D17 | Seasons? | **A minimal calendar** (`world/calendar.js`, derived from `G.day`, nothing saved, no repainting). **15 days a season** (a 60-day year; 45 min of real time per season at 1×); the game **starts in summer**. In v1 it drives only seasonal rivers, the HUD date, battle water and three events. Later systems may use it (harvest prices, winter survival). |
| D18 | Per-climate season profiles? | As in §6.6.4. **Frost:** all but great rivers freeze in winter; streams flood at the thaw (days 1–5 of spring). **Desert:** wadis dry, flash floods 2–3 days in spring. **Swamp:** wet season (spring into early summer: fords closed, marsh spreads); dry season (autumn: extra fords). **Grass:** only flagged streams (about 30%). |
| D19 | Thin ice? | **An event only** (first and last 2 days of a freeze: 10% to lose 1–3 men or goods; Survival 4 avoids). The ice never breaks into a tile state. |
| D20 | River boats for the player? | **Passage in v1** (any port to any port on the same water; pay per person and distance; 4× time aboard; river bandit or pirate events). **Owning a barge later.** |
| D21 | Toll bridges? | **Yes:** bridges in a holding's land charge its owner's toll (foreign caravans 2% of cargo; you 1 gold per 5 people, or refuse as a crime). Your fiefs' bridges pay you. Fixed rates in v1. |
| D22 | Ferries? | **Yes, on great rivers at towns and river ports** (2 gold per 5 people, 0.05 day), so great rivers don't need a bridge every 30 tiles. |
| D23 | Time controls? | **1×, 2×, 4×** (keys 1–3) and a **Travel fast 8×** toggle that drops to 1× when anything hostile is seen, an event or window opens, or you arrive. |
| D24 | Huge on phones? | **Hidden on phones** (coarse pointer and a short screen side under 900 px); Normal and Large are offered there. |
| D25 | Slower travel before the new world? | **Yes: in Phase 1, on today's map**, together with the smaller figures, so the pace can be judged early. |
| D26 | Which world settings? | **The focused list of §4.1:** size, seed, realm holdings, hamlets, sacred places, wild land, land and water, rivers, mountains, climate, seasonal rivers, monsters, bandits, economy, **founding sites and start** (§7). **Realms stay 5** (written content, not a setting). No settings for start city (character creation), the starting war or season length. |
| D27 | The two themed presets? | **Wild Frontier:** Large; 0.7× holdings; few hamlets; common sacred places; vast wild; wet, rugged and cold; deadly monsters; many bandits; rich. **Crowded Realms:** Normal; 1.5× holdings; many hamlets; few wild regions; calm monsters. |
| D28 | The preview? | **A quick sketch (≤ 150 ms)**: the real noise fields sampled coarsely, with rivers and holdings approximate. It redraws on every change. An optional **Full preview** runs the real generator, and Start reuses it. |
| D29 | Custom size? | **Yes, within limits**: width 320–1024 and height 224–768 in steps of 32, width ÷ height 1.2–1.6, at most Large on phones and Huge on desktops. |
| D30 | The order of New game, and how far a code reproduces? | **Race and background first, then world settings** (the preview marks your start city), then forging. **A world code reproduces the world and its starting population**; what happens in play stays random. |
| D31 | Tips on the loading screen? | **Yes:** a short tip or flavour line, changing every 4 s, from about 40 lines (game hints and lore), with the flag fluttering beside the title. There is no setting for it; the overlay only appears for waits over 300 ms. |
| D32 | A loading screen for battles? | **Only when a battle's setup passes 300 ms** (big fields, deep forests, sieges). Its ground is painted at setup instead of in the first frame, so the battle opens smoothly. Most battles show nothing. |
| D33 | Found only at marked sites, or anywhere? | **Both.** Marked **founding sites** are the easy path, with a gift each. **Free founding** is allowed on valid open land with stricter rules: ≥ 30 tiles from holdings, ≥ 18 from hamlets, not on any realm's land or within 12 tiles of its holdings, not in the wild; it costs 50% more, with no gift. |
| D34 | The tier list? | **Camp → hamlet → village → town → city or castle** (castle as the war path from town). One shared model for every holding (`HOLDING_TYPES` with `tier`/`next`, `TIERS` costs). **One city per realm**, yours included. |
| D35 | Do realm holdings grow and shrink by tier? | **Yes, slowly:** grow after 30 days above the next tier's people if the realm can pay; shrink by hunger or two sacks; capitals never below town; castles keep their path; one AI change per realm per 20 days. Hamlets may grow into villages. Off in tests. |
| D36 | A settler start? | **Yes, optional:** the Start setting (Wanderer or Settler). As a settler you begin with a camp at a fair founding site near your people's lands, 10 people, a band of 5, and 10 days of grace from raids. |
| D37 | Is your realm there from the first camp? | **Yes:** it is today's Free Banner (`'player'`), which already holds captured fiefs. Territory from each holding's reach; tension with realms you crowd; hamlets join by protection; **companions as governors** in v1; lords, vassals, laws and kingdom titles deferred (roadmap "founding your own kingdom"). |
| D38 | Names and settlers? | **You name each founded holding** (a generated name suggested). Founding takes **6 of your soldiers** as its first people (never companions), plus 200 gold, 10 timber, 5 tools and 20 food (in `TIERS`). |
| D39 | Risks for new holdings? | **Moderate:** bands raid camps, hamlets and villages (1 in 12 a day when a stronger band is within 8 tiles; you are told and can ride back); hostile lords burn camps and hamlets and besiege towns; daily upkeep in food and tools; 30 days of neglect costs prosperity. All in `FOUNDING`. |
| D40 | Cliffs in the desert? (decided by the owner, 2026-10-18) | **Desert mesas** (§6.7): mesas and escarpments in sandstone on the world map; battles there get a mesa on that side (a flat-topped butte, sheer layered sandstone cliffs, 1–2 natural sand ramps). Until Phase 7, desert fields keep dunes, spires and oases only, with no cliffs or ramps. |
| D41 | Kinds of high ground (decided by the owner, 2026-10-18) | **Three edge kinds**, chosen by the world's elevation and roughness in the **Phase 2 generator** and passed to battles through `BattleSite` (R17):<br>• **rise:** a gentle slope band, climbable anywhere, small height bonus;<br>• **steep hill:** a steep grass, scree or rock bank, climbable anywhere but very slow and tiring; ranks break on the way up, no charge momentum uphill, cavalry crawls; downhill charges hit hard; strong height bonus;<br>• **cliffed hill:** sheer cliffs, natural ramps only (as built in phase 4).<br>Extras: scree slopes (no cavalry charge across them; shooters downhill reach farther), and mixed edges (a steep hill with a gentler shoulder on one side, which becomes the natural line of attack). Each edge kind has its own look (soft grass / darker stony bank / grey rock face). Routing treats steep edges as costly ground, so groups prefer a shoulder or ramp when one is near, and the AI holds steep crests and attacks by the shoulder or ramp. Lowlands give rises, highlands steep hills, escarpments cliffed hills. Until Phase 2, battlefields keep today's rises and cliffed hills. |
