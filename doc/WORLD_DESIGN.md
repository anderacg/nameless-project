# A bigger, seeded world: design

**Status:** **Approved by the owner 2026-10-18 (D1–D39 as recommended; D40–D45 the same day).** Final design, revision 3. Written against the working tree of `battle-rts-and-world` (with its uncommitted changes).
**Progress (checked 2026-10-19 at 7324310):** **Phase 0 complete** (2026-10-18: b94cbe2, 097ec15, 5e9453d, 02c8f50, 7fa4680, 65b50ca, 328f892), but for R12's daily-job slicing, which rides with Phase 2 wave 2. **Phase 1 built** (2026-10-18, f08c720; 8× relabelled 608b9f2). **Phase 2:** wave 0 built (2026-10-18, 855ca1a), wave 1 built behind `WORLD.gen` (2026-10-19, 2ed6578; the classic climates and anchors and the suites that assume today's map under `-Gen` deferred to wave 3); waves 2–3 built (2026-10-22), and **wave 4, the flip, built 2026-10-22: the generated world is the default**; the same day, on the owner's word, **the only world: today's hand-made map deleted** with `WORLD.gen`, `?gen=0`, `-Classic`, `genClassic` and Phase 0's router wrapper (D49, agent RM). §11.1 (the land defended) built 2026-10-19 (e5bca02, 7638472); §12.5 (depth sorting) built 2026-10-18 (08f93f6), the fade since changed (see there). Phases 3–7 not started. The queue across all docs is IMPLEMENTATION_PLAN "Priorities"; this doc owns the phases. **Phase 2b built** (2026-10-22, behind `WORLD.gen`): the New world screen, the World page, the save line, a seeded start, and fewer holdings by default (§4 status).
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
| Fleeing | Odds come from a **ratio** of your speed to the chaser's (`mySpeed`/`chaserSpeed`) | `engage.js` `fleeOdds` |
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
| o | **The battle reads world globals directly.** `battleEnv` and `terrainAt`/`terrainEdges` read `tAt`, `climAt`, water, road bridges, neighbours and elven towns. `coverAt` and `bridgeNear` do the same, and `fieldSize` reads `regionAt`. Every new world feature (rivers, seasons, elevation, cliffs, regions, the salt) would mean editing the battle generator in several places. | `battle/setup.js` `battleEnv`, `groundSpec`, `fieldSize`; `battle/terrain.js` `terrainAt`, `terrainEdges`, `TERRAIN_DENSE.elfR`; `battle/engage.js` `bridgeNear`, `coverAt` |

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
| **R12** | **Level-of-detail hooks** | (g) | `WorldObject.tier` (`near`/`mid`/`far`) is set every 0.5 s from the distance to you. `updateParties`/`updateMonsters`/`updateCritters`/`updateShips` call `think` by tier: near every frame, mid every 4th frame with 4× `d`, far through `farStep(d)` (by default the same as `think`). Daily jobs (`econDay`, `caravanDay`, `landDay`) gain a slice option (1/8 of holdings a frame). In Phase 0 the tier radius is infinite, so everything is near and nothing changes. **Daily-job slicing built 2026-10-21:** `Systems.sliced(list, each, after)` (`core/systems.js`), used by `econDay`, `caravanDay` and `landDay`; off by default (`Systems.sliceDay` 0: all at once, as before; fingerprints unchanged); on (n), 1/n of the holdings a frame, the rest finished first by the next day or a save (`Systems.drain`). Phase 6 sets it per preset (8 at Huge). Checked in `tests/coreparts.js`. | S–M | Hash 8; `visual/perf` |
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
- **Wave 3**, once wave 2 has landed: R17 (A, needs R1 and R15); R16 (the battle agent, after R15). **Done 2026-10-18:** R15 (battle setup and ground painting as steps under the loading overlay; `tests/groundhash.js`); R16 (battle ground and arena in 512-px tiles with an LRU, half-resolution overview and canopy, blood in tiles; huge-field memory ~88-110 MB -> ~25 MB); R17 (`WorldMap.battleSite(tx,ty)` with `battleSiteAt`/`battleSiteOf` and the lab's `labSite` is the one hand-off: `battleEnv`, `terrainOf`/`terrainAt`, `terrainEdges`, `groundSpecFor`, `bridgeNear`, `coverAt`, `battleTypeFor` and `fieldSize` read only the site; `elfR` and the bridge reach in `WORLD_SCALE.battle`; `WorldMap.salt` (0) in the field seed, D15; the river, season, region, deep, elev, terrace and cliff slots stay null until Phases 2, 4, 5 and 7; `tests/battlesite.js` checks all 35,840 classic tiles). **Phase 0 is complete (R1-R17).** Left: R12's daily-job slicing (`econDay`, `caravanDay`, `landDay`).
- **Phase 0 total: L**, about 18–21 agent sessions, mostly in parallel.

### 2.3 The battle side

The queued battle refactors touch only `js/battle/*` and `ui/battlehud.js`:
- item 11, the battle event hook;
- item 13, a readable battle tick;
- item 18, retiring the per-soldier morale mirrors.

The world work touches battle code only in `terrain.js` (`terrainAt`, `terrainEdges`: new optional reads, §13) and `engage.js` (`bridgeNear`, `coverAt`).
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

**As built (wave 2, D; behind `WORLD.gen`, today's map kept Phase 0's wrapper until D49 deleted both):**
- **Nodes:** the holdings' tiles (where their roads start), road junctions (where a shared stretch begins or ends), both ends of every crossing, a landing by each port, the camps, and the chunk portals. A border's open run is cut into pieces of at most 10 tiles (`WAY.run`), a portal pair in the middle of each, because one portal per long run kept trips 10–20% over the best. Crossing tiles never hold a portal: their crossing's edge joins the two ends. The classic seed: 1,751 nodes and 1,876 static edges; Large seed 1: 3,531 and 3,742.
- **Edges:** roads and tracks between nodes on them, at their own tiles' costs each way; crossings (a ferry 0.05 day); a portal's step; river legs between landings on navigable rivers, over no rapids (no seed made one yet: ports are few on rivers). Costs are days at `WAY.pace` (= `MAP_BASE`, which loads after the generator first runs at load; `tests/router.js` checks they agree). Inside a chunk, the costs between its nodes come from a search over its tiles from each node, made when first needed (an LRU of 512 chunks).
- **Trips:** within 40 tiles (`WAY.near`) the tiles alone (`findPath`), as today. Longer: a search in the start's chunk to its nodes (or the node it stands on, or a gate beside it), A\* over the graph to the goal chunk's nodes (or a holding's gate), then each leg walked when it is reached: a road's own tiles, a bridge's or ford's tiles, a ferry sailed straight across, a search between two nodes of a chunk, the last stretch. The pair cache (1,024) answers gate-to-gate trips. A holding with no way is walked to straight, as today's field does.
- **Measured** (`tests/router.js`, 200 random trips over 40 tiles against a full A\* over the tiles): 3.5% dearer on average at Normal, 2.9% at Large; a trip planned in 0.4–0.5 ms (median, every chunk's table made).
- **`Router.close(xi, shut)`** shuts a crossing's edges and tiles (local searches keep off them, its chunks' tables are made again, walkers find their ways again). **`Router.reach`** treats a ferry's two landings as one piece of land.

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

**Measured (wave 3, A; headless Chrome on the owner's PC, 2026-10-22):** generation Classic 0.52–0.58 s, Normal 0.47 s, Large 0.73 s, Huge 2.7–2.8 s (Huge's mountains stage ran 3 times on seed s1: its pass check). Peak JS heap while generating (`performance.memory`, typed arrays included): Normal +11–15 MB, Large +11 MB, Huge +65 MB. Typed arrays made in the busiest stage (an upper bound on its working set): Normal 11.4 MB (rivers), Large 22.7 MB (rivers), Huge 112.5 MB (mountains, over its 3 tries; about 38 MB a try), plus the map's layers (1.9, 3.8 and 10.5 MB). All within §3.7's times; memory at Huge at the 65 MB target. Classic by stage (ms): land 104, mountains 133, climates 87, rivers 95, forests 27, holdings 21, roads 58, camps 11, ways 18.

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

**UI theme updated 2026-10-23:** New world uses the shared brown-and-gold interface (`style.css`), with framed settings and preview panes, cream text and warm gold selected controls. Presets, seed entry, preview generation and forging behave as before. Portrait stacks the full settings and preview in one scrolling column, clear of the fixed navigation bar.

**Status: built 2026-10-22 (Phase 2b, behind `WORLD.gen`):** `ui/worldsetup.js` (the screen, §4.6; its section 5b of `style.css`), `world/worldsettings.js` (`HOLDING_DENSITY`, `densityHoldings`, `worldCode`, `parseWorldCode`), `world/worldgen.js` `genSketch` (§4.3), `core/session.js` (a past's card leads here; `seededStart`: a generated world but Classic starts as its seed says; Start reuses a full preview), the Esc menu's World page and the save line (`ui/ui.js`), `tests/worldsettings.js`. **The owner, 2026-10-22: "the holdings seem a bit too much":** a holdings density (Fewer, Normal, More: 0.8×, 1×, 1.37× the area's default) and lower defaults, **27 / 40 / 66** at Normal / Large / Huge (about 27% fewer; More gives the 37 / 55 / 90 first planned); Classic keeps its 37. With them two clamps of stage 7 (`world/worldplace.js`): a port only on the open sea (`placeOpen`), each realm's land within 24% as placed (`PLACE.even`). As built, a few things differ from below: the sketch is about 70 ms; its mountains come from stage 2's rules on its cells, not its draws, so they are approximate too; the counts line shows holdings, rivers (of 30 tiles and more) and land, as hamlets and sacred places come with Phase 4; the preview shows the real map wherever it is made (the classic world the page forged, the world in, a full preview).

The owner: "during new game can we set a parameter so we can select how big the map is, how many holdings we want to generate, provide map seed info, and other parameters that you require to generate the world."

### 4.1 The settings

The list is kept to knobs that change the world in ways you would notice. Every value is validated, and the ranges are listed below.

| Setting | Choices (default in bold) | What it changes in the generator | Range and clamp |
|---|---|---|---|
| **Size** | **Normal** (phones), **Large** (desktop), Huge (every device; slow on phones, D44), Custom | `w × h` (§3.1) | Custom: width 320–1024 and height 224–768, in steps of 32 (one chunk); width ÷ height between 1.2 and 1.6; at most 786,432 tiles (Huge) on every device (D44) |
| **Seed** | Typed text, **Random**, or pasted from a **world code** | Every stage's stream (§8.1) | Up to 24 characters, hashed to 32 bits; empty means random |
| **Realm holdings** | A number. **27** at Normal, **40** at Large, **66** at Huge (the owner, 2026-10-22; were 37 / 55 / 90), set by a density (Fewer 0.8×, **Normal**, More 1.37×) or by hand | Holdings placed per realm (§8.8). Shared among the five realms in today's ratio (8/7/7/7/8); lords follow (about 1 per 1.85 holdings) | At least 25 (5 per realm: a city, a town, a castle, 2 villages). At most 60 at Normal, 110 at Large and 200 at Huge, ×0.75 with Vast wild, ×0.85 with More sea. The slider's top moves with them and says why ("up to 51 for this land") |
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
| **Normal** | Normal | 27 | Normal | Normal | Normal | Coasts | Normal | Normal | Temperate | Normal | Normal | Normal |
| **Large** | Large | 40 | Normal | Normal | Normal | Coasts | Normal | Normal | Temperate | Normal | Normal | Normal |
| **Huge** | Huge | 66 | Normal | Normal | Normal | Coasts | Normal | Normal | Temperate | Normal | Normal | Normal |
| **Wild Frontier** | Large | 28 (0.7×) | Few | Common | Vast | Continent | Wet | Rugged | Cold | Deadly | Many | Rich |
| **Crowded Realms** | Normal | 40 (1.5×) | Many | Normal | Few | Coasts | Normal | Normal | Temperate | Calm | Normal | Normal |

Founding sites are Normal in every preset except **Wild Frontier** (Many) and **Crowded Realms** (Few). Start is Wanderer in every preset; any preset may switch it to Settler, Classic included.

**Classic** uses seed `CLASSIC`, today's holdings as anchors (§8.15), and only the settings that don't change the map: monsters and bandits. Everything else is locked and greyed out. **Tests** use Classic with every setting at its default.

**The Advanced fold-out** holds everything below Seed and Size: holdings, hamlets, sacred places, wild land, water, rivers, mountains, climate, seasonal rivers, monsters, bandits and economy. It is closed by default. On touch, choices are segmented buttons (3–4 steps, ≥ 36 CSS px tall) rather than fiddly sliders; only holdings and custom size use a number with − and + buttons.

### 4.3 The preview

The preview is a low-resolution map beside the settings, so you see the world before you start.

- **A quick sketch, ≤ 150 ms at any size**, redrawn 200 ms after any change.
  - **How:** the generator's own noise fields (land, elevation, temperature, moisture, warps) are **sampled at a coarse grid** of 256 points across. They are the same continuous functions of world position, so coast, mountains and climates in the sketch are the real ones at those points.
  - **What is approximate:** rivers, wild regions and holdings come from a cheap pass on that coarse grid (drainage on coarse elevation; capitals and holdings by coarse suitability). They are marked "sketch: rivers and holdings approximate".
- **Buttons:** ~~Reroll seed, Regenerate, Full preview~~: **removed (owner, 2026-10-22)**: Random beside the seed does what Reroll did; the sketch redraws by itself after every change (Enter in the seed redraws at once); the full preview drew behind the window, where it could not be seen.
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
| **Town streets** (walkable scene) | The place painted once (`gfx/scenedraw.js`) | To be measured | Unchanged | "Entering {town}…" if over 300 ms |
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
- **War at the crossings:** a lord defending his realm may hold the bridge or ford on his border nearest an enemy army (`hold` state, §11). Fights there use the existing *Hold the bridge* battle type, which already triggers on and beside road bridges (`engage.js` `bridgeNear`).

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
| New kind `camp`, a `tier` and `next` on every kind, the `TIERS` table | `data/holdings.js` (`tier`/`next` built in Phase 0, R4, 097ec15. Note 2026-10-19: the name `TIERS` is already taken, by the LOD tiers' `WeakMap` in `world/parties.js` (R12); one of the two needs another name before Phase 4b) |
| `FoundingSite` (site), placement in the generator | `world/sites.js`, `world/worldplace.js` |
| Found, upgrade and tier-down projects, free-founding rules, upkeep, raids on your holdings | new `world/founding.js`; `world/estates.js` (`t.work` of kind `tier`) |
| The centre growing in place | `world/lots.js` (reserved block, centre replacement) |
| AI tier changes, tension | `world/realms.js`; `world/brains.js` (raids, burning) |
| Adding a holding at runtime | `addHolding` (R4), incremental territory (R7) |
| Fief tab: "Upgrade to {tier}" with a checklist (✓/✗, like `needsText`) | `world/siege.js` `fiefBody`, `ui/town.js` |
| Tier art for each people | the models (`engine/buildmodels.js` `PX.centreModel` by tier: a camp, a hamlet's yard, the village, the town's citadel, the city's at 128, the keep; each culture's in its style file), `gallery.html?view=peoples` |
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
- **Eight directions (owner, 2026-10-18):** the search moves in 8 directions (diagonal steps cost ×1.4142, a constant), never cutting a corner past a closed tile. Each road is then smoothed by string-pulling and gentle bends, so it runs at any angle, not in right-angle stairs. Road tiles stay on the grid (8-connected) for movement and `OCC`. The art follows the smooth line (D, §12.1).
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
  - **As built (wave 1):** on a great river the spot takes a bridge where its water is 3 tiles or less, else a ferry by a town or port. A crossing's place along a river is its last tile on the river's path (else the path's nearest within 2). No crossing end is a notch (water on both its sides across the way: it would read as one more tile of bridge).
  - **Bare stretches:** where no spot within 60 tiles can take a crossing by these rules (a bank of peaks or of land no road joins; a great river far from towns where it is wider than a bridge, as on its diagonal reaches, 4–9 tiles of water across), the next crossing goes at the first spot past them, and the stretch stays bare. They are no failure and cost no retry; `tests/worldplace.js` lists them (INFO; e.g. Normal `redwater`: Otterlode 16–92; Large `redwater`: Ironbeck 392–508 and 532–630, both great rivers).
- **Crossings** are listed in `WM.crossings` with their kind, river, season rule and toll holding.
- **The way graph** (§3.6) is built last, from the roads, crossings, river legs and chunk portals.
- **Ways walked straight (owner, 2026-10-23; built, `world/router.js` `WAY_SMOOTH`):** a walker's way (the router's, for every party) was a staircase, tile middle to tile middle, as the roads were before their smoothing. Each leg's tiles are now pulled straight once found (`waySmooth`, string-pulling): on to the farthest tile the straight line reaches with every tile it crosses open and 2 px clear of any closed one (no corner cut), costing by the same tile costs (off the roads × the keeper's) no more than the stretch it skips (3% tolerance); a road keeper never skips road by a line leaving it. Legs over the land, a road's and the last stretch run on together (`wayStraight`, 96 tiles at most); crossings and ferries are kept. Roads kept to and woods gone round stay so; only the staircase goes. About 0.1 ms a leg. `tests/straightways.js`: over classic and Normal s1-s4, turns 5490 → 1716 in 200 trips, at most 2.3% dearer, lords and caravans there as before.

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

- **As built (wave 3, A: terrain):** the hints are `CLASSIC_HINTS` (`data/places.js`), read only when the world is classic, so other seeds are untouched. Land (`genLandHints`): the League's bay at its ports' middle, as wide as the holdings round it allow, open to the south by a strait aimed between the holdings, with an inlet to beside each port; land at least a little high round every anchor and a neck of land from each (ports aside) toward its realm's heart, so none stands on an isle; Willowmere's ring lake; no big lake on an anchor. Mountains: the hinted ranges (the northern peaks, Karn Hold's), no other range within 20 tiles of an anchor (no peak within 6) and no highland near one. The great river (`genValleyHint`): a trough from the highest ground of the north to the south coast, 5 tiles east of Stonebridge and straight there, winding elsewhere, its bed never rising, the land within 90 tiles tilted toward it, so the valley gathers a great river. Climates: frost along the north and at Coldmarch and Granitegate; the desert and the fens each at **home** in their hint's reach (their score up there, down elsewhere: `GEN_CLIMATE.home`), so they appear nowhere else; the Sylvan woods and the south coast a little drier, not fen. The 37 anchors all stand in their own climate. Checked by `tests/worldgen.js` (at the anchors), `tests/rivers.js` (the great river) and B's `tests/classicseed.js`.

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
- **As built (wave 3, B: placement):** stage 7 puts each of the 37 on a free tile within 4 of its anchor, choosing first one that keeps its hint (a League port: water of the sea within 2; Stonebridge: a span of the great river of 3 tiles or less within 3; Willowmere: land ringed by water, off the main land), then one in its own climate (`mapview`'s rule), then the nearest; past 4 tiles, the nearest free tile within 40. Stage 8 lays Stonebridge's bridge first: the great river's narrowest span within 4 tiles, and a road from the town over it to the nearest holding beyond. The classic world never takes a bridge town's style from the rules (its holdings keep their own). `tests/classicseed.js` checks every hint; on a made-up land (sea, canals, a great river, a ring lake) the placement keeps them all. On the terrain of ebf29b8 these wait for A: Ashford's anchor in peaks (6 tiles off), Willowmere and Mossdell on an island of 1,011 tiles cut off by 5–15 tiles of sea (21 and 24 off), Saltmere, Brinewatch and Tidewatch with no sea within 6, the great river 13–16 tiles east of Stonebridge and rising just north of it, 9 holdings in another climate than their own, and climate discs round Mirefen and Tidewatch.

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
- **Who outruns whom:** flee odds (`engage.js` `fleeOdds`: `mySpeed`/`chaserSpeed`) and chase choices (`stanceMove`) compare **unscaled** paces, so who outruns whom is exactly as today. Chases take about 2.2× longer in real seconds.
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

**Status: built 2026-10-22 (play-test 5: "monsters and wildlife feel too few in the larger worlds"):** `DENSITY.grow` (`data/world.js`) grows each count of `DENSITY.classic` (today's) with the world: × (its measure ÷ today's map's)^pow. By **land** (tiles not water: today's 32,042): bands (pow .8, fewer to a holding than the land alone would give), camps, beasts and game (start and cap, pow 1), sites by kind, and the tries a day to bring each back (as its count); by **realm holdings** (today's 37): caravans and refugees; by **ports** (holdings with one as the world first stands: today's 9): trade ships. So beasts and game keep today's per tile of land (1.50 and 3.00 per 1,000), bands 0.64 at Large. Since the play-test of 2026-10-22 (GP) the sites have a rule a kind: caves, ruins and shrines by the land ^.35, hideouts ^.8, the travellers' camps by the world's road (`roads`: a great road's tile 1, a track's .5; one camp to 80 tiles), 30 tiles apart (`sites.js` `SITE_GAP`). Today's map is the measure, so it keeps today's numbers; the generated classic seed (3.19× its land) grows as any world: 76 bands, 153 / 191 beasts, 306 / 382 game. Seed s1: Normal 77, 156 / 195, 312 / 391; Large 132, 307 / 383, 613 / 767; Huge 296, 838 / 1,048, 1,676 / 2,095. `density(WM)` is the world in's, `density()` today's (the generator never reads the last world's); the camps wait on stage 9 reading `density(g.map)`. Spawning stays anywhere on the map in a thing's own ground. For Huge's frame (§3.5's 2.5 ms): beasts meet bands from a grid and weigh you only in sight, the watches find their prey from a grid of the threats (`defence.js`), both exactly as before; and the LOD tiers (R12) are bounded on a map bigger than Normal (near within a quarter of its longer side, the rest mid): 1.4–1.6 ms a frame at Huge with its 3,000 movers, today's map and Normal unbounded as ever. For its save (§3.8's 180 KB): a generated world packs its beasts' and herds' records (`worldobject.js` `packRec`: values in order, numbers to a tenth, their strength and wandering made again) and saves its bands without their strength, numbers to a tenth: 312 → 157 KB gzipped at Huge's start. Today's map saves as before (W7).

**Hideouts deep in the wilds: built 2026-10-23** (the owner: "bandit and raider hideouts should spawn far away from holdings, mostly found in wilderness areas"): a hideout stands on the **wild land** (`sites.js` `wildLand`, `HIDEOUT_PLACE`: 22 tiles or more from every holding, 8 from every road, track and ford), 20 tiles from another and 16 from the bandit camps and travellers (`SITE_GAP`), drawn first in a clearing among woods, hills or peaks or deep in the swamp or the desert (`wildGround`), its raiders by the climate as before. Counted by the wild land (`DENSITY.grow` wild, `worldWild`: the base 37,400), not all the land: the classic seed's 46,773 tiles make 30 (was 61), most of them (26) in the wilds. A bigger garrison (7–9 + 1 every 15 days, seen as 8), a chieftain level 2–5 (was 1–3) and plunder 1.5× (gold, and 40% a second piece of gear past a camp's 4 in 5: `HIDEOUT_BAND`); bandits in searched ruins as before; respawn 10 days as before. The bandit camps and roving bands are unchanged.

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
  - new states: `claim` (annex a hamlet) and `hold` (a defending lord holds the crossing on his border nearest an enemy army, so *Hold the bridge* battles arise naturally);
  - at or near home (resting, going home or riding his lands), rides out against a band or beast on his realm's land that comes near one of its holdings or estates, when he can beat it, and goes back to what he was doing; never from a campaign or siege (built: §11.1).
- **Bands:**
  - spawn from a precomputed fringe mask weighted to roads, never within `WORLD_SCALE.spawn.away` of a holding or estate (built: §11.1);
  - roost in camps (`ai.camp` 220 px, unchanged);
  - raid hamlets;
  - river bands prey on barges and wait at fords.
- **Monsters:** home ranges as today, their lairs in the wilds (§11.1); wild ones 1–2 levels above `monLevel()`.
- **Caravans and barges:** a realm picks the faster of road and river. Caravans keep to great roads (×0.9 cost); barges follow navigable water. Both pay tolls at foreign bridges (caravans) or at river tolls by a holding's landing (barges).
- **Patrols:** their beat is their holding's land; they ride out at bands and beasts on it (§11.1).
- **Pathing:** through `Router` (R11; the two-level router at every preset from Phase 2). Seasons toggle crossing edges. AI never plans over ice.
- **Far parties** run at the far tier (§3.5), and they resolve meetings by auto-resolve.

### 11.1 The wilds are dangerous, the lands are defended (built)

The owner decided this on 2026-10-19. Numbers: `WORLD_SCALE.spawn` (`away`, `rim`) and `DEFEND` (`data/factions.js`); code: `world/defence.js`, `monsters.js`, `world.js` `spawnBandit`, `fights.js`; tests: `tests/landdefence.js`.

- **Monsters spawn in the wilds only:** never on a holding's land (`landHold` null). If a kind's habitat is not found in the wilds in 200 tries, it may spawn within `rim` tiles of a land's edge, at least `away` from every holding and estate. Habitats and the other rules stand. Mythic beasts' lairs follow the same rule; a quest's beast is placed by its quest.
- **Bandits spawn away from living areas:** at least `away` (120 px) from any holding and any of its estates; they may still lurk on a land's outer reaches. Bandit camps stand on the map's fixed spots and are not spawned.
- **Bandits and monsters fight:** a beast that meets a band (`DEFEND.meet`) falls on it, and the band fights back: a map fight (`fights.js`). Every fighter there shows one face: `mapKind`, `troops`, `power()`, `fightPower()`, `label()`, `faction`, `takeLoss()`. A beast fights at its level; a blow wounds it, and it loses one of its pack when its wounds reach one beast's strength. Beaten, `DEFEND.rout` of its pack (a lone beast) falls as it flees. You may join against the beast (your battle with it, the side you joined beside you); a beast's side cannot be joined. Fights with beasts save and load.
- **Holdings protect their land:** a band or beast on a holding's land that its watch sees, or within `DEFEND.see` of the holding or one of its estates, brings the watch on duty out after it (`sendWatch`), if the watch is `DEFEND.edge` times as strong. A lord at or near home rides out against one near his realm's holdings or estates (`near`, `ride`, `leash`, `cool`). Estate guards are unchanged. Wild game is not a threat. Mythic beasts and quest targets stay out of map fights.

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
- **As built (wave 2, D), waiting for the owner's approval** (`tests/visual/rivers.js`, not the gallery, which the building redesign owns): on the generated world only (`gfx/worldart.js`; today's map is painted as before, pixel for pixel). Water by the pixel: each water tile's corners rounded and its edges wobbling a pixel or two, so a river's stairs read as bends; rivers shaded by width; a muddy bank with reeds and stones; a seasonal river's pale gravel edge and dotted line; fords lighter, with stepping stones; stone and wooden bridges; a ferry's two landings, its raft and the rope; white water on rapids. Brooks: 1–3 px lines along `flow`, bending through each tile, painted by `PX.worldNatureSteps` from the spec's new `flow`, `river` and `water`. Coasts: a sand rim, a pale shallow halo with cloudy edges, wave strokes and foam, in today's palette. Roads: painted along their lines (Chaikin-softened twice), each pixel by how deep it lies in the nearest band: a worn verge, a dark edge, the middle with ruts (a track grassed between them), a great road wider than a track and a little wider or narrower along the way; forks and gates join where the bands meet. Not built: current glints that drift downstream, toll houses, deltas as fanned reeds, the season overlays (Phase 5).

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
- **Full map:** M, or a tap on the minimap. It shows realms, regions, rivers (seasonal ones marked) and crossings, with a legend. **Built in Phase 2 wave 2 (C, `ui/map.js`)**: realms, rivers by width, crossings, holdings, you and the fog; regions and seasonal marks wait for Phases 4 and 5.
- **Minimap:** about 128 × 91 on screen, drawn from the low-resolution build (§3.4).
- **HUD:** date and season ("Day 17 · Summer"), region name, the Travel fast toggle.
- **Ports:** a Take passage panel listing destinations, days and price.

### 12.5 Depth sorting and see-through (built separately, earlier)

- **Trees and buildings stay painted** in the chunk.
- **Overdraw what stands in front:** for each figure in view, the sprites in front of it (their box overlaps the figure, their foot is lower on screen) are drawn again over it: in full over others, at 0.4 alpha over your own party (`PROPFADE`, as in battle). That is about 2–6 sprites per figure. **Changed 2026-10-19:** trees and buildings in front of **any** figure in your sight fade (1f4f2dd), to `WDEPTH.fade` 0.3 (`gfx/depth.js`; the owner set 0.3 in 5fa658b). Battle keeps 0.4 over yours only until IMPLEMENTATION_PLAN §3.5.
- **What the world art must provide:** an index per chunk of its standing sprites (`{x, y, s, box}`, from the nature plan and the lots), sorted by foot y. Ranges keep column-cut faces.
- **Later:** toll houses, mills, ferry landings and Phase 7 cliff faces join the index.

### 12.6 Buildings at the owner's scale (the building redesign's stage 3, built 2026-10-23)

**Status: built.** The world map draws every building, site and camp as a model (`engine/buildmodels.js`, the owner's scale: 16 px objects, 32 the smallest building, 64 the big ones, groups and centres, 128 a city's citadel); the old hand-drawn `engine/buildings.js` is retired (no `PX.building`, `PX.site`, `PX.camp` or `PX.prop`; `pieces.js` keeps the pier and the flame).
- **Layout** (`world/lots.js`): a lot is its model's cell; the centre by tier (`PX.centreModel`: village, town and castle 64, a city 128); houses of 32 px, fewer and bigger, each holding 2-4 households of 10 people, so a holding's room counts as before (`HOUSING`, `lotHouseholds`; at the classic seed 140 houses of 380 households for 299 houses before, 5,300 people's room for 5,000); estates as their 32 or 64 px building or cluster (`ESTATE_LOT`). The inner estates are laid by the centre first, then the houses round them, side by side with each other and the workshops (`gap:'row'`), ringed round the centre's middle; the outer works from the gate as before. Every rule holds: the roads and their painted lines kept clear, the estates' tracks (none from beside or behind a centre), no lot by a brook, every lot walked to from the gate, ports on harbour water (a pier from any tile of its building beside it), the clearings (a village's 110 tiles, was 80). Towns are about a third wider than before; a village with its 64 px centre about half again.
- **Culture:** the realm a holding was founded under (`HOME`; vale, karn, sylvan, the Horde's ashgor, the Salt League's league), kept when it is captured; the owner flies the banners (the owner's colour on banners and accents is not in the models yet). The Vale's landscapes by the holding's surroundings (`holdingEnv`: coast, highland, forest).
- **Facing:** each lot to its nearest road or track (S, W, N, E), an outer estate to the track laid to it, the centre straight on; a mine or a quarry with rock to one side its back to the rock (2026-10-23, EW: `lots.js` `rockYaw`).
- **Drawing:** the models' ragged yards painted into the land under them, the land showing through by material (`gfx/worldart.js` `townGround`), so no square patch; the shadows in the one pass at `PX.MODEL_SHADE`; snow in the frost (by its cover toward it, the seasons' hook). Battles pass the holding's culture to `engine/ground.js` `houseOf` once the battle site carries it (a line in `world/worldmap.js` and `battle/terrain.js`, not yet).
- **Tests:** `tests/townmodels.js`; pictures: `tests/visual/townshots.js`.

### 12.7 Tracks (the owner's decision of 2026-10-23, built 2026-10-23)

**Status: built** (and 2026-10-23, agent TR2: prints on roads too; the prints that turned with their walker fixed). Every band that moves on the map leaves tracks, saved, and read by Scouting (`world/tracks.js` `Track`, `Tracks`; drawn by `gfx/tracks.js` `drawTracks`; every number in `data/tracks.js` `TRACKS`).
- **Who leaves them:** your band, the lords' armies, bandit bands, patrols, your companions' parties, caravans (a wagon's ruts), refugees, beasts and the wild game. Not the workers about their estates (to and fro on the same roads and tracks all day, they would bury every other trail there), ships, livestock in their pens or a mythic beast in flight.
- **A trail:** a point every 24 px walked, its prints drawn every 3-7 px between them by style (foot, hoof, paw, rut, drag), turned 8 ways, a band's size class spreading them wider; ended where the ground keeps nothing (water, a ford, a bridge's deck) and begun again past it; a jump (into a holding) starts a new one. **Drawn from its kept points only** (the owner's bug of 2026-10-23: the prints already laid turned as the band changed its way; the stretch from the last point on to the walker was drawn with the walker's heading, so its prints swung round with every turn): each print's place and heading come from its own stretch's two points, laid from the older, so a print laid never moves or turns; a trail still walked shows up to its last point, at most 24 px behind its walker. Its record: kind, how many, mounted, its name as it was, a bounty's quest, its points with their hours.
- **The ground:** clear on sand and snow (1), mud (0.9), fainter on grass (0.55) and hills (× 0.6), very faint in woods (× 0.3). **On roads** (the owner, 2026-10-23; `road`): dust prints on a dirt road (a track between places, or an estate's track) 0.5, faint on a great road's paving 0.3, in the road's dust colour; which road from `RoadBand.on` and the tile's `feat` (a great road's tile, or one next to the band there). **Age:** a print lasts its climate's hours (grass 36, swamp and frost 30, desert 14: the wind; a dirt road 10, a great road 5: the traffic and the carts tread them out), cut by the weather there (`ambWeather`'s: the frost's snow fills them 3 times as fast, rain and storms ready for when the map has them); a stretch is as old as its newer end, so a band that stood a day and walked on leaves fresh prints.
- **Kept:** at most 4,000 points, roads' prints within them (the oldest dropped first, cut back once 400 over) and never past 48 hours or their ground's life; in a save under `tracks` (each trail's points as steps from the last), no key while there are none; no save before them needs anything (no migration, D7).
- **Seen:** your own, always while they last, in your sight; others' by Scouting (`see`): no older than 3 + 3 × level hours, no farther than your sight × (0.25 + 0.075 × level), and only in your sight (0: 3 h within a quarter of it; 3: 12 h, about half; 6: 21 h, 70%; 10: 33 h, all of it).
- **Read** (hover, or the action ring's Look): below Scouting 2 "Tracks"; from 2 how many, how and which way; from 5 who (bandits, an army, a wolf pack…) and roughly how old; from 8 their name, the exact number and the hour. Each trail read the first time trains Scouting (2); a bounty's band's trails, once one is read at Scouting 5 or more, show faintly gold.
- **Following them:** no action; walk along them. This is how a roving band or its hideout is found.
- **Cost:** sampling 0.05 ms a frame on the classic world (some 600 movers checked); drawing about 0.3 ms for 100-200 prints, at most 700 a frame (about 2.4 ms headless at the cap); the save about 15 chars a point (some 63 KB at the cap).
- **Tests:** `tests/tracks.js`; pictures and the cost: `tests/visual/tracks.js`.


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
| `tests/worldsettings.js` (Phase 2b) | **Determinism:** the same settings and seed give the same checksum and starting population. Changing any map setting changes the map. Monsters and bandits change only populations. **World code** round trip, including a hand-edited code. **Clamps:** too many holdings for the size, custom sizes snapped to 32, aspect, the slow-device note on phones, Vast wild with Crowded holdings. **Every preset** generates and passes `worldsanity` (Huge in the visual report). **Corner combinations** (each setting at its minimum and maximum, plus the worst pairs: Huge with maximum holdings, More sea and Vast wild; Normal with Many hamlets and Few wild) over 3 seeds each. **The preview matches the real map:** land and water agree on ≥ 95% of sketch points, climate on ≥ 90%, capitals within 2 sketch pixels. **The screen:** header, `nav()` bar, Esc, and fit at 844 × 390 |
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

**Status (2026-10-19):** 0 built (328f892; R12's daily-job slicing left, with Phase 2 wave 2) · 1 built (f08c720) · 2 waves 0–3 built behind `WORLD.gen` (855ca1a, 2ed6578; 2–3 2026-10-22), wave 4 (the flip) built 2026-10-22: the generated world is the default; the old hand-made map deleted the same day (D49) · 2b built (2026-10-22, behind `WORLD.gen`: §4) · 3, 4, 4b, 5, 6, 7 not started. Holding growth tiers (IMPLEMENTATION_PLAN §6) are owned here, Phase 4b.

| Phase | Scope | Agents and files | Effort |
|---|---|---|---|
| **0. Refactors first** (§2) | R1–R17, behaviour-preserving, built for Huge; the loading overlay (§5); the chunked battle ground; the `BattleSite` hand-off | Four waves (0–3); every agent, file list, dependency and check is in **§15.1** below | **L** (18–21 sessions) |
| **1. Figures shrink, travel slows** (depth sorting is separate and may go first) | Map templates (people, riders, beasts, critters, carts, ships); host layout; frames by distance; `DAY_SECONDS` 180, `WORLD_PACE` 0.4, `move` 0.68; time controls 1/2/4× and Travel fast 8×; the grace retune; `worldsim` fix and baselines. **On today's map** | **A:** `gfx/people.js`. **B:** `world/critters.js`, `engine/beasts.js`, gallery. **C:** `world/caravans.js` (art), `world/ships.js` (`shipSprite`). **D:** `gfx/render.js` (host, frames), `core/core.js` (day, pace), `data/world.js` (`move`, grace), `ui/input.js` and `Ashmark.html` (speeds), `tests/worldscale.js`, `tests/visual/worldsim.js` | **M** |
| **2. The generator, presets, river systems, the classic seed** | `genWorld` stages; presets; drainage basins, widths, deltas, rapids, navigable flags, permanent crossings (bridges, fords, ferries), river towns and mills; holdings, names, roads, camps; the way graph and the two-level router; streaming at every preset; save v3, gzip, map identity; **the settings object (§4.4) as the generator's one input, with every setting and clamp working in code** (the contract for 2b); a plain New game choice (Classic or Random at a size) until 2b; "Forging the world…" and "Returning to…" through the loading overlay (`genWorld` yields per stage; load and new game as steps), the full map, the minimap; battle river width and world bridges. `WORLD.gen` flag until accepted | Five waves (0–4); every agent, file list, dependency and check is in **§15.2**. **A:** the contracts (wave 0: `world/worldmap.js` layers, `world/worldsettings.js` (new), stubs, the script lists); `world/worldgen.js` (new: terrain, drainage, rivers, D41's high ground), `data/places.js` (`CLASSIC_HINTS`), `tests/worldgen.js`, `tests/rivers.js`. **B:** `world/worldplace.js` (new: holdings, names, roads, crossings, camps, classic anchors), `world/resources.js` (river fish), `world/realms.js` (lords, stocks), `tests/worldplace.js`, `tests/classicseed.js`. **C:** `core/save.js`, `world/fog.js`, `core/session.js`, `main.js`, `ui/loading.js`, `ui/ui.js` (New game; there is no `ui/menu.js`), `ui/map.js` (new), `ui/input.js`, `tests/harness.js`, `tests/armygroups.js`, `tests/worldsave.js`. **D:** `world/router.js` (graph, A\*), `world/ships.js`, `gfx/worldart.js` and `engine/worldnature.js` (rivers, prefetch), `gfx/render.js` (minimap), `tests/router.js`. **E:** `world/worldmap.js` (`battleSite`), `battle/terrain.js`, `battle/engage.js`, `battle/route.js`, `battle/commander.js`, `engine/ground.js` (width, bridges, fords, D41's steep hills), `tests/battlesite.js`, `tests/worldsanity.js`, suite adaptations, G1–G8, the flip | **L** (≈ 18–20 sessions) |
| **2b. World settings screen** (§4) | The New game screen: presets (Classic, Normal, Large, Huge, Wild Frontier, Crowded Realms), seed and world code, size and custom size, the Advanced fold-out, live clamps with notes, the quick sketch preview and the optional full preview, the World page in the Esc menu, the save list line; seeded starting population | **A:** `ui/worldsetup.js` (new), its section of `style.css`, `ui/menu.js` (the New game order). **B:** `world/worldgen.js` (the sketch pass: coarse sampling, coarse drainage and holdings). **C:** `world/worldsettings.js` (new: defaults, presets, clamps, world code), `core/save.js` and `ui/ui.js` (save line), the Esc menu's World page. **D:** `core/session.js` (seeded `begin` spawns), `tests/worldsettings.js` | **M** |
| **3. Biomes and borders blend** | Climate blends, ecotones, mixed trees, sparse edges; territory barrier costs, grain, smoothing; soft borders; high ground read as outlined plates with a dark lip (D41 kinds; the owner's reference look, a light touch on today's art) | **A:** `world/territory.js`. **B:** `engine/worldnature.js`, gallery. **C:** `gfx/worldart.js`. **D:** `tests/worldshape.js` | **M** |
| **4. New places** | Wild regions; hamlets; sacred places; the dragon's lair and clues; the art | **A:** `world/worldgen.js` (regions), `world/map.js` (`regionAt`), `world/world.js` (survive, spawns), `data/world.js` (`WILD`). **B:** `data/holdings.js`, `world/realms.js`, `world/brains.js` (`claim`), `ui/town.js`. **C:** `world/sites.js`, `world/quests.js`, `world/events.js`. **D:** `engine/buildings.js`, `engine/pieces.js`, `engine/gallery.html`. **E:** `world/monsters.js`, `tests/hamlets.js`, `tests/sacred.js` | **L** |
| **4b. Founding your own holding** (§7) | Founding sites and free founding; the shared tier model (camp, hamlet, village, town, city or castle) with `TIERS`; upgrade and tier-down projects; the centre growing in place; your realm from the first camp (tension, governors, protection of hamlets); AI tier changes; raids and upkeep; the settler start and the two settings; tier art per people | **A:** `data/holdings.js` (`camp`, `tier`/`next` in use, `TIERS`), `world/lots.js` (reserved block, centre replacement). **B:** `world/founding.js` (new), `world/estates.js` (tier projects), `world/siege.js` (`fiefBody` upgrade row), `ui/town.js`. **C:** `world/sites.js` (`FoundingSite`), `world/worldplace.js` (sites), `world/worldsettings.js`, `core/session.js` (settler start). **D:** `engine/pieces.js` (settler camp, stake), `engine/buildings.js` (hamlet centre, city citadel variant), `engine/gallery.html` (`?view=tiers`). **E:** `world/realms.js` (tension, AI tiers), `world/brains.js` (raids, burning), `world/companions.js` (governors), `tests/founding.js`, `tests/tiers.js` | **L** |
| **5. Living rivers** | The calendar and `SEASON_PROFILE`; seasonal rivers (freeze, flood, dry, flash) by flag and climate; season overlays and the all-year look; crossing toggles; toll bridges and ferries' fees; barges (`BargeParty`), passage, river trade; river bandits; lords holding crossings; battle water by season; `RIVER_EVENTS` | **A:** `world/calendar.js` (new), `world/map.js` (`passableAt`, `riverState`), `world/world.js` (`dayTick` hook, HUD date). **B:** `world/ships.js` (river water, passage), `world/caravans.js` (`BargeParty`, tolls), `world/economy.js` (toll income). **C:** `battle/terrain.js`, `battle/engage.js` (season water, ford ambush). **D:** `engine/worldnature.js` (`PX.riverSeason`), `engine/pieces.js` (barge, toll house, ferry), `gfx/worldart.js` (overlays). **E:** `world/brains.js` (river bands, `hold`), `world/events.js`, `tests/rivers.js` | **L** |
| **6. Retune per preset** | `WORLD_SCALE` and `DENSITY` values; AI by travel days; `worldsim` per preset; `visual/worldscale`; wiki tables | **A:** `data/world.js`. **B:** `tests/visual/worldsim.js`, `tests/visual/worldscale.js`, `tests/visual/perf.js`. **C:** `world/brains.js`, `world/realms.js`. **D:** `wiki.html`, `README.md` | **M** |
| **7. World cliffs** | Escarpments into `WM.edge` with passes, and desert mesas (§6.7); edge-aware movement, roads, territory and router; faces in the art and depth index; battles take their cliffs from the world (in the desert, a mesa with 1–2 natural sand ramps) | **A:** `world/worldgen.js`, `world/map.js`, `world/router.js`. **B:** `engine/worldnature.js`, `gfx/worldart.js`. **C:** `battle/terrain.js`, `battle/engage.js`. **D:** `tests/worldcliffs.js`, `tests/fieldvariety.js` | **M–L** |

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

**Effort:** 0 L, 1 M, 2 L, 2b M, 3 M, 4 L, 4b L, 5 L, 6 M, 7 M–L: roughly 61–73 agent sessions, with up to 5 in parallel (Phase 2 runs at most 3 at a time, §15.2).

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
| **A** | **R17** | `world/worldmap.js` (`battleSite`), `battle/terrain.js`, `battle/setup.js` (`battleEnv`, `groundSpec`, `fieldSize`), `battle/engage.js`, `battle/lab.js` (`labSite`), `data/world.js` (`WORLD_SCALE.battle`), `tests/battlesite.js` (new) | `engine/*`, `gfx/*` | R1, R15 |
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

### 15.2 Phase 2 launch plan

Written against f08c720 (Phase 1 merged). Phase 2 builds the generator **behind `WORLD.gen`**: with the flag off the game is today's, byte for byte; with it on, the generated world. Five agents (A–E), **at most 3 at a time** (two other agents already run), in five waves: contracts first, then terrain, placement and saves, then what needs real rivers and roads, then the classic seed, then the flip.

**Where things live today** (checked on f08c720; agents start here):

| What | Where |
|---|---|
| `T_*` codes, `SPEEDMUL`, `passable`, `REGION_NAMES`, `hash`/`noise`/`fbm` (`genClassic`, today's 224 × 160 map, deleted with it: D49) | `world/map.js` |
| `WorldMap`, `useWorld`, `installClassic` (run at script load), `worldKeep`, `battleSite`/`battleSiteOf`/`battleSiteAt` | `world/worldmap.js` |
| `Router` (`travel`, `reach`, `days`) over the way graph, `findPath`, `clearLine`, `landPieces` (`flowTo` and Phase 0's wrapper deleted: D49) | `world/router.js` |
| `WorldArt` (chunks, LRU, `draw`, `mini`), `worldArtPlan`, `paintSteps`, `runGen` | `gfx/worldart.js`; the load-time `WorldArt.mini()` in `gfx/sprites.js` |
| `saveRec`/`loadRec`/`fromRec`, `makeHolding`, `setHoldings`, `setCamps`, `MADE_HOLDINGS` | `data/holdings.js` |
| `saveGame`, `readSlot`, `worldSave`, `worldFits`, `worldLoad`, `loadGame`, `applySave` (v2) | `core/save.js` |
| `loadingShow`, `loadingStep`, `loadingHide`, `runSteps`, `LOADING.sync` | `ui/loading.js` |
| `begin`, `startGame`, `paintView` | `core/session.js` |
| The New game panel (`showTitle('new')`), `saveLine`, the Esc menu. **There is no `ui/menu.js`** | `ui/ui.js` |
| `initWorld`, `initHolding`, `addMissingLords`, `addHolding` | `world/realms.js` |
| `WORLD_SCALE`, `moveStep`, `DENSITY`, `density()` | `data/world.js` |
| `LAND_COST`, `landCost`, `computeLand` | `world/territory.js` |
| `genDeposits` | `world/resources.js` |
| `seeded` (an LCG), `onWorld` | `core/core.js` |
| `CLASSIC_PLACES`, `CLASSIC_CAMPS` | `data/places.js` |

**Rules for every agent:**
- **Files:** edit **only** your "may edit" list. Every other file is off limits; if you need a line in one, ask its owner through the coordinator.
  - **The script lists** (`Ashmark.html`, `wiki.html`, the load order and static checks in `tests/structure.js`) and the runners (`tests/run-tests.ps1`, `tests/run-tests.sh`) belong to **A** for all of Phase 2. Wave 0 adds every planned new file, so no one else should need them; send A the line for any other.
  - **The building redesign runs alongside.** `engine/buildings.js`, `engine/model.js`, `engine/buildkit.js`, `engine/gallery.html` and `tests/visual/buildpreview.js` are off limits to every Phase 2 agent. Art the owner must approve (rivers, steep hills) is shown through a `tests/visual/` scene, not the gallery.
  - **Never touch a `demos/` folder**: not in diffs, stashes (`-u`), `add -A` or patches.
- **Tests:** always `.\tests\run-tests.ps1 -Parallel 1 -TimeoutSeconds 240` (the owner's PC), never a higher `-Parallel`. Add `-Gen` for the flag-on world. A suite must finish within 240 s at `-Parallel 1`: long seed sweeps and timings go into `tests/visual/` reports, run by name. **Since 2026-10-19 (owner):** agents run only their targeted suites; the coordinator runs the full sweep once after each merge, so "the full sweep" in the done list below is the coordinator's.
- **Done means:**
  1. the full sweep has no failure the baseline did not have (the coordinator records f08c720's known failures before wave 0);
  2. `-Suites worldprint -Seed 1` shows W1–W8 equal to their constants (the one allowed change is in the hash table below);
  3. **the battle fingerprints** are byte-identical: `-Suites battlesetup,battlecommands,actorrules,attackrules,battleresolution`, `-Suites rts -Seed 1,2,44`, `visual/battleperf` (`fp`) and `visual/moraleaudit` by name, and `groundhash` (the 24 lab fields);
  4. from wave 2 on, the sweep with `-Gen` has no failure that the last merge did not have (the coordinator keeps that list; it only shrinks, and is empty after wave 3 except for lines the coordinator accepts);
  5. `structure` passes, including the generator bans below;
  6. the agent's own checks (§15.2.3).
- **Never `Math.random`.** The generator files (`world/worldsettings.js`, `world/worldgen.js`, `world/worldplace.js`) use only seeded streams (`genRng`, §15.2.1). They also never call `rnd`, `rint` or `pick` (which draw `Math.random`), nor `Math.hypot`, `sin`, `cos`, `exp`, `pow`, `log` or `atan2` (§8.1). `structure` checks these three files' text. `buildWayGraph` in `world/router.js` keeps the same rules by review, since the walking code beside it uses `Math.hypot`. `performance.now` may decide **when** a stage yields, never **what** it makes. With the flag off, the count of `Math.random` calls in `begin` and in a load is unchanged. A random seed for New game comes from `crypto.getRandomValues`, so it never shifts the tests' streams.
- **Behind `WORLD.gen`:** `WORLD.gen` (in `data/world.js`) was false unless the page's address had `gen=1` (the `-Gen` runner switch). **Since the flip (wave 4) it is true unless the address has `gen=0`**: the game and a plain test run are the generated world; `Ashmark.html?gen=0` and the runner's `-Classic` were today's map. `-Gen` is kept and adds nothing. **Since D49 (2026-10-22) the flag, `gen=0`, `-Classic` and the "Off" world below are deleted:** only "On" is left.
  - **Off:** `installClassic` makes today's 224 × 160 map with `genClassic`, `Router` is Phase 0's wrapper, `BattleSite`'s new fields are null, and New game is today's.
  - **On:** `installClassic` makes the generated classic world (Normal, seed `CLASSIC`, §8.15). It brings the two-level router, the battle link and the plain world choice at New game.
  - **Which hashes may change, and when:**

| Hashes | May change |
|---|---|
| W1–W6, W8 (flag off) | Never, until the flip |
| W7 (flag off) | **Once**, in C's wave-1 merge (save v3: `v:3`, `world.map`, fog as run lengths), re-recorded with the reason. `tests/loading.js` reads the new constant |
| **G1–G8**: the same eight measures (§2.0) on the generated classic world, flag on | INFO lines only until wave 3. E records them as constants in the **last merge of wave 3**. From then on they hold, and are re-recorded only with a reason in the commit **Recorded 2026-10-22** (E, on 70970ed): G1 94e87250, G2 6bc88128, G3 0240c3fb, G4 ceb55e1f, G5 ab5e5d34, G6 fd29ebee, G7 dccc7da8, G8 dfad1cf1, and B2's twin GB2 bc14e9a8 |
| `WM.sum` of the classic world and of seeds 1–3 at Normal and seed 1 at Large (`worldgen`) | INFO until wave 3; recorded with G1–G8. **Recorded 2026-10-22** in `tests/worldprint.js` (seeds s1–s3, Large s1): classic 7333836c, Normal s1 128cfb7e, s2 2b581da4, s3 c38ac906, Large s1 5af09941 |
| Battle fingerprints, `groundhash`, `battlesite` with the flag off | Never |
| **At the flip** (wave 4) | W1–W8 take G1–G8's values: one cause, the new world |
| **At D49** (2026-10-22, RM) | Today's map's W1–W8 and B2 (`EXPECT`) deleted with it; `GEXPECT` is `EXPECT` now, every value unchanged, its entries named W1–W8 and B2 again (G1–G8 and GB2 in older notes) |

- **Merging:** the coordinator reviews and merges each agent's diff on its own, in the order a wave's table lists them. A wave starts only when the previous one is merged and green (rule 1 with the flag off, rule 4 with it on).
- **Contracts:** the shapes in §15.2.1 are fixed by wave 0. An agent that needs one changed asks the coordinator. The change is written here first, then coded by the file's owner.

#### 15.2.1 The contracts

**The world map** (§9.1, extended; `+` marks what Phase 2 adds; all on `WorldMap`, `world/worldmap.js`):

```js
WM = {
  w, h, seed, salt, classic,     // classic: today's map (flag off) or the generated classic seed
  gen,                           // + 'classic-0' (today's map, flag off) | 'ashmark-1' (the generator)
  seedNum,                       // + settings.seed hashed to 32 bits (seedNum below); 0 for 'classic-0'
  settings,                      // + the clamped settings (normSettings); null for 'classic-0'
  kind, clim: Uint8Array(w*h),   // as today; kind gains T_FORD = 6 (passable, SPEEDMUL .5, LAND_COST 1.5)
  temp, moist: Uint8Array,       // + 0-255 (written now; Phase 3's blends read them)
  elev:  Uint8Array,             // + 0-255, sea 64; terrace = clamp((elev-64)>>5, 0, 3)
  rough: Uint8Array,             // + local relief 0-255: the largest elevation step to the 8 neighbours x4, smoothed once (D41)
  high:  Uint8Array,             // + D41's high ground. Bits 0-1: kind (0 none, 1 rise, 2 steep hill, 3 cliffed hill);
                                 //   2-4: the way the ground rises (0 E, 1 SE, 2 S, 3 SW, 4 W, 5 NW, 6 N, 7 NE: terrain.js TDX order);
                                 //   5: scree; 6: mixed (a steep hill with a gentler shoulder); 7: free
  feat:  Uint8Array,             // + 1 floodplain, 2 lake, 4 coast, 8 deep wood, 16 sparse edge, 32 bridge, 64 great road, 128 track
  edge:  Uint8Array,             // + cliff edges E1 S2 W4 N8; all 0 until Phase 7
  region: Uint8Array,            // + all 0 until Phase 4
  flow:  Uint8Array,             // + bits 0-4 log2 of flow; 5-7 downstream direction (as high's)
  river: Uint8Array,             // + bits 0-1 width 0-3 (0: not a river tile); 2 navigable; 3 seasonal; 4 freeze; 5 flood;
                                 //   6 dry (flood and dry in desert: flash); 7 delta channel
  basin: Uint16Array,            // + 1 + index into basins; 0 for sea and lake water
  rivers:    [{id, name, path:[i…], order, width, basin, mouth:i, nav, rapids:[[a,b]…] /*path index ranges*/,
               seasonal: null|{freeze, flood, dry, flash, day}}],
  basins:    [{id, outlet:i, area, river:id|null}],
  crossings: [{i, j, kind:'bridge'|'ford'|'ferry', river, tiles:[i…], stone, toll:holdingName|null, when:null}],
                                 // Phase 2 makes the permanent kinds only ('lowford', 'bed', 'ice': Phase 5)
  roads:     [{a, b, kind:'road'|'track', path:[i…]}],   // + a, b: the names of the places it joins
  regions:   [],                 // Phase 4
  cliffs:    [{a, b, side}],     // escarpment candidates (§8.3): the source of cliffed hills now, of edges in Phase 7
  graph:     null | WayGraph,    // + the way graph (below); null for 'classic-0'
  lords:     null | {fac:[name…]},  // + lords per realm when the world needs more than FACS lists (D10)
  first,                         // as today (worldKeep)
  sum                            // + FNV-1a 32 over gen, settingsKey(settings), every byte layer above in order,
};                               //   then the holdings' names and tiles; for 'classic-0': gen, kind and clim
```

- Every layer is allocated by the `WorldMap` constructor, at any size, for today's map too (all zero). Nothing on today's map reads them, so no hash moves.
- **As built (wave 0):** `MAP_LAYERS` (`worldmap.js`) lists the byte layers in `sum`'s order (`kind clim temp moist elev rough high feat edge region flow river basin`; `basin` hashed as its bytes), and `WM.checksum(holdings)` computes `sum`: by the generator's last stage, and by `installClassic` for `'classic-0'`. Defaults: `gen` `'classic-0'`, `seedNum` 0, `settings`, `graph`, `lords` null, every list `[]`.
- **Since D49 (2026-10-22):** `gen` is always `'ashmark-1'` (the `WorldMap` default); the `'classic-0'` world, its checksum (gen, kind and clim) and `classic` meaning today's map are gone (`classic` is the classic seed). A save naming `'classic-0'` is refused as another world version (`session.js` `forgeSteps`), cleanly, the game untouched (`tests/worldsave.js`).
- Tile memory grows from §3.2's 24 to about **30 bytes a tile** (`rough`, `high`, `basin`): 23.6 MB at Huge.
- `seasonal` and its bits are **data only** in Phase 2: nothing reads them until Phase 5, except the generator's own reachability check.

**The settings object** (§4.4): the generator's one input. `world/worldsettings.js` holds `WORLD_PRESETS` (§4.2), `SETTING_CHOICES`, `WORLD_LIMITS`, `defaultSettings(preset)`, `normSettings(s)`, `settingsKey(s)`, `classicSettings()` and `seedNum(text)`. Phase 2b adds the world code and the screen. **As built (wave 0):** also `SETTING_KEYS` (the keys in `settingsKey`'s order, §4.4's), `SETTING_DEFAULT`, `maxHoldings(s)` (the holdings cap above) and `areaTable`; `WORLD_LIMITS.holdings` holds the cap's and the default's `[tiles, holdings]` points; `classicSettings(o)` takes the free `monsters`, `bandits` and `start`. `CLASSIC_HINTS` (`places.js`) is a list of `{id, kind: sea, temp, moist, elev, island or river, at (a holding's name or map shares), side, r, d, …, note}`; `classicAnchors()` lives in `worldplace.js`.

| Key | Values | Default (Normal) | Clamp in `normSettings` |
|---|---|---|---|
| `v` | 1 | 1 | Always 1 |
| `preset` | `classic`, `normal`, `large`, `huge`, `frontier`, `crowded`, `custom` | `normal` | Unknown: `custom` |
| `w`, `h` | tiles | 448, 320 (Large 640 × 448, Huge 1024 × 768) | `w` 320–1024 and `h` 224–768, rounded to 32; then `h` moved so `w ÷ h` is 1.2–1.6; at most 786,432 tiles |
| `seed` | text | none: New game draws one | Trimmed, cut to 24 characters. `seedNum` = FNV-1a 32 of the text |
| `holdings` | integer | 37 (Large 55, Huge 90) | 25 to the size's maximum (60 up to 143,360 tiles, 110 at 286,720, 200 at 786,432, linear in area between), ×0.75 with `wild:'vast'`, ×0.85 with `land:'sea'`, floored |
| `hamlets` | `none`, `few`, `normal`, `many` | `normal` | Unknown: the default (as for every choice below) |
| `sacred` | `rare`, `normal`, `common` | `normal` | |
| `wild` | `few`, `normal`, `vast` | `normal` | |
| `land` | `continent`, `coasts`, `sea`, `lakes` | `coasts` | |
| `rivers` | `dry`, `normal`, `wet` | `normal` | |
| `mountains` | `flat`, `normal`, `rugged` | `normal` | |
| `climate` | `cold`, `temperate`, `warm` | `temperate` | |
| `seasonal` | true, false | true | Anything else: true |
| `monsters`, `bandits` | `calm`/`few`, `normal`, `deadly`/`many` | `normal` | |
| `economy` | `poor`, `normal`, `rich` | `normal` | |
| `sites` | `few`, `normal`, `many` | `normal` | |
| `start` | `wanderer`, `settler` | `wanderer` | |

- **Classic** forces `w` 448, `h` 320, `seed` `'CLASSIC'`, `holdings` 37 and every map setting to its default. Only `monsters`, `bandits` and `start` stay free.
- Unknown keys are dropped. `normSettings(normSettings(s))` equals `normSettings(s)`.
- **The phone limit is not a clamp.** Huge hidden on phones (D24) and Huge only with `CompressionStream` (D8) are rules of the New game screen. `normSettings` never reads the device, so one code makes the same world everywhere; a phone refuses a Huge code with a note.
- Settings that only later phases show (`hamlets`, `sacred`, `wild`, `sites`, `start`) are stored, clamped and hashed now, and read by nothing yet. `monsters` and `bandits` scale `begin`'s spawns and caps (×0.6, ×1, ×1.5). `economy` scales deposits and first stocks.

**`genWorld`: the stages and their yields** (`world/worldgen.js`):

```js
genWorldSteps(settings) → [{id, label, w, run}]  // for runSteps; each run is a function* that yields 0-1;
                                                 // the last step's value is the result
genWorld(settings) → result      // the same steps run at once (tests, the wiki, LOADING.sync): each step's iterator run to its end
                                 // (runGen's way: runGen itself, gfx/worldart.js, loads after worldmap.js, whose load line calls it)
result = {map, holdings:[place data: CLASSIC_PLACES' schema plus realm], camps:[{tx,ty}], lords,
          hamlets:[], sacred:[], lair:null, regions:[], rivers, crossings, graph, tries:{stage:n}, relaxed:[…]}
installWorld(result) → map       // worldmap.js: setHoldings, setCamps, WM.lords, genDeposits, useWorld (as installClassic)
```

- **The stage context** `g`: `{s` (clamped settings), `map`, `rng(stage, attempt)` (= `genRng(seedNum, stage, attempt)`: `seeded(genHash(seedNum, STAGE_SALT[stage] × 64 + attempt))`), `work` (Float32 working fields, dropped at the end), `hints` (`CLASSIC_HINTS` when classic), `tick()` (true once about 10 ms of work have passed since the last yield)`}`. **As built (wave 0):** also `attempt` (this run's: stages call `g.rng(id, g.attempt)`) and what the stages hand on: `holdings` and `lords` (7), `camps` (9), `tries`, `relaxed`. A stage in `GEN_STAGES` is `{id, label, w, run(g) → function*, check(g) → null or a reason, relax(g) → null or the relaxation's name}`; before a retry the driver puts back `kind` and `feat` (shared by several stages), and each stage rewrites its own layers whole.
- **Yields:** a stage yields its fraction whenever `tick()` says so: per band of rows in field passes, and inside the flood fill and every road search. The work between two yields is the same whatever the timing, so the output never depends on the frame rate.
- **Retries:** each stage's check (§8.14) retries **that stage** with `attempt + 1`, up to 8 times; then the relax order of §4.5 (hamlets, sacred places, wild share, then holdings one per realm at a time). Each retry and relaxation is recorded in `tries` and `relaxed`. A stage with no relaxation left keeps its last attempt and says so in `relaxed` (`'climate: swamp 4.1%, kept after 8 tries'`): the generator never fails to make a world.

| # | id | Loading label (§5.2) | w | Owner | Writes | Its check (§8.14), retried here |
|---|---|---|---|---|---|---|
| 1 | `land` | Raising the land | 80 | A | `kind` water and land; `feat` lake, coast | Land share 60–80%; no land under 40 tiles |
| 2 | `elev` | Mountains | 200 | A | `elev`, `rough`, `high`, `kind` hill and mountain, `cliffs` | Passes every 60 tiles of range |
| 3 | `climate` | Climates | 150 | A | `temp`, `moist`, `clim` | Each climate ≥ 6% of land |
| 4 | `rivers` | Carving rivers | 250 | A | `flow`, `basin`, `river`, `kind` water on river tiles, `feat` floodplain, `rivers`, `basins` | Never uphill; ends in water; width follows flow; deltas |
| 5 | `forest` | Forests | 80 | A | `kind` forest; `feat` deep, sparse | — |
| 6 | `regions` | Wild lands | 150 (1 until Phase 4) | A (Phase 4) | `region`, `regions`: a stub, all 0 | — |
| 7 | `holdings` | Founding holdings | 250 | B | `holdings`, `lords`; classic anchors | Suitable land; balanced capitals; fair start; ports |
| 8 | `roads` | Laying roads | 500 | B | `kind` road and ford; `feat` bridge, great road, track; `roads`, `crossings` | Reachable from every capital, also with every ford on a `flood` or `flash` river closed; crossings ≤ 60 tiles apart |
| 9 | `sites` | Placing camps | 50 | B | `camps` | Camps in the fringe, reachable |
| 10 | `graph` | Charting the ways | 150 | D | `graph` (`buildWayGraph`, `world/router.js`), then `sum` | Every holding a node; the graph connected like the land |

After `genWorld`, `begin` and the load add their own steps (C): install (`installWorld`), "Drawing borders" (`initWorld`: territory as today, natural borders in Phase 3), the start's population and "Painting the first lands" (`paintView`).

**The way graph** (`WayGraph`, built by `buildWayGraph(g)` in `world/router.js`, §3.6):

```js
{n, tile:Int32Array(n), nk:Uint8Array(n),     // nk: 0 gate, 1 junction, 2 crossing end, 3 landing or port, 4 camp, 5 chunk portal
 off:Int32Array(n+1), to:Int32Array(m), cost:Float32Array(m),  // cost: days at MAP_BASE pace
 ek:Uint8Array(m),                            // 0 road, 1 track, 2 crossing, 3 river down, 4 river up, 5 inside a chunk
 xing:Int16Array(m),                          // the crossing an edge uses, or -1
 chunk:Map, closed:Uint8Array(crossings.length)}  // chunk: portal-to-portal costs, made lazily, an LRU; closed: Router.close
```

River legs (`ek` 3 and 4) are built now and used by nobody until Phase 5 (passage and barges). Land routes never take them.

**As built (wave 2, D):** `cost` is in days at `WAY.pace` (`router.js`, kept equal to `MAP_BASE`). The router's own fields beside the contract's: `w`, `h`, `cs` (32: a chunk's tiles a side), `cols`, `coff` and `cnode` (the nodes by chunk), `leg` (a road edge's road in `WM.roads` and the places on its path it runs from and to). `ek` 5 is a portal pair's step across its border; the costs inside a chunk live in `chunk`, not in `to`.

**The router** (`world/router.js`): **the three calls stay exactly as they are** (§2.2 R11). Callers never read the graph.

(Since D49 only the right-hand column is left: the flag and Phase 0's wrapper are deleted.)

| Call | Flag off | Flag on |
|---|---|---|
| `Router.travel(o, goal, step)` → bool | Phase 0's wrapper (`flowTo`, `findPath`, `clearLine`), unchanged | Local A\* to the first node, graph A\* (cached by node pair, an LRU of 1,024), local A\* along each leg and to the goal. `goal.tw` (a holding) ends at its gate |
| `Router.reach(a, b)` → bool | `landPieces` labels, unchanged | The same labels, made from the generated land |
| `Router.days(a, b, pace)` → days | Unchanged | From graph costs, at `pace` |
| `Router.close(xi, shut)` (new) | — | Opens or shuts crossing `xi`: its edges in `closed`, the pair cache cleared. Phase 2's checks use it; Phase 5's seasons call it |
| `Router.stats()` (new, for tests) | — | `{queries, hits, graphMs, localMs}` |

**What `BattleSite` gains** (`WorldMap.battleSite`, §13, D41). Every field is null with the flag off and in the lab unless its spec asks, so every battle fingerprint and `groundhash` field is unchanged. **As built (wave 0):** `battleSiteOf` carries `crossing`, `rough` and `high` (null, beside today's null `river`, `elev`, `terrace`); `tests/battlesite.js`'s shape check counts the keys, so its key list gained them (a test line, by A).

| Field | Shape | Read from | The battle's use (E, wave 2) |
|---|---|---|---|
| `river` | `{w:1\|2\|3, dir:0-7, nav, delta, flood, name, seasonal}` | The tile's river, or the widest within 1 tile | Deep water `TERRAIN_RIVER.half` 24 / 40 / 64 px (3, 5, 8 cells, §13); delta or floodplain: marsh patches and channels. `seasonal` is carried, unused until Phase 5 |
| `crossing` | `{kind:'bridge'\|'ford'\|'ferry', d, stone, toll}` | The nearest crossing within `WORLD_SCALE.battle.bridge` tiles | **Bridge:** the world's bridge is the field's one bridge, 2 cells wide, stone or wood. **Ford** (or a `T_FORD` tile): a river with fords only, where the ford lies. **Ferry:** one ford at the landing |
| `bridge` | as today (tiles to the nearest road bridge) | `crossings` (flag on), `roadBridge` (flag off) | *Hold the bridge*, unchanged (`bridgeNear`) |
| `elev`, `terrace`, `rough` | 0–255, 0–3, 0–255 | `elev`, `rough` | Hills' heights; the layout's bias |
| `high` | `{kind:'rise'\|'steep'\|'cliffed', up:0-7, scree, mixed, shoulder:0-7\|null}` | `high`; `shoulder` is the neighbour with the least `rough` | **Rise:** today's climbable hills, no cliffs. **Steep:** the new steep hill (D41). **Cliffed:** a cliff-ringed hill with natural ramps (today's cliff, its chance taken from the world, not the recipe). Null: today's recipe chances |
| `region`, `deep`, `season`, `cliff` | null | — | Phases 4, 5 and 7, as R17 left them |

**D41's kinds from the world** (A, stage 2): lowlands give rises, highlands steep hills, escarpment candidates cliffed hills. The thresholds sit in a `GEN_HIGH` table in `worldgen.js`. Starting targets for the owner's review: of `T_HILL` tiles, rises 50–70%, steep 25–40%, cliffed 5–12%.

**Install and session** (C): `begin(k, settings)` runs `genWorldSteps(settings)`, then install, then today's start, under "Forging the world…". If the settings' `settingsKey` and the installed world's are equal, the world is reused (`WM.first`), as today's `useWorld(WM)` does. The save (§9.3):

```js
save = {v:3, at, …today's fields…, world:{v:3,
  map: {gen, settings, sum},     // 'classic-0' with settings null when the flag is off
  edits: [], own, …today's lists…, seen /*run lengths, base64*/}}
```

- On load, a `gen` other than the installed world's (or other settings) regenerates first. A `sum` that differs refuses the save: "made in another world version; start a new game".
- **v2 is refused. There is no migration**, by the owner's rule (D7).
- **Each slot keeps a small plain header** (`v`, `at`, the save line) beside its body, which is gzipped (`CompressionStream`, base64), so the save list stays synchronous.
- **Bodies are plain JSON** under `LOADING.sync` and where the API is missing. W7 hashes the JSON before compression.

#### 15.2.2 The waves

**Wave 0: the contracts in code** (alone, first; effort S) — **built 2026-10-18** (855ca1a)

| Agent | Scope | May edit | Must not edit | Depends on |
|---|---|---|---|---|
| **A** | Every contract above as code, with stubs that make a crude but valid world: the `WorldMap` layers, `gen`, `sum`, `installWorld` and `battleSiteOf`'s new null fields; `worldsettings.js` complete; `GEN_STAGES`, `genWorldSteps`, `genWorld`, `genRng` and stub stages (warped land, plain fbm elevation, climate by latitude, one or two steepest-descent rivers, the 37 classic holdings at `classicAnchors` with straight roads and a bridge or ford where a road meets a river); `classicAnchors()` real (§8.15 step 1); `CLASSIC_HINTS` data (§8.15 step 2); a stub `buildWayGraph` (returns null); `WORLD.gen`; `T_FORD` in every kind-indexed table; the script lists; the `-Gen` switch; the generator bans in `structure` | `world/worldmap.js`, `world/worldsettings.js` (new), `world/worldgen.js` (new), `world/worldplace.js` (new), `world/router.js` (the `buildWayGraph` stub only), `data/world.js` (`WORLD`), `data/places.js` (`CLASSIC_HINTS` only), `world/map.js` (`T_FORD`, `SPEEDMUL`, `REGION_NAMES`), `world/territory.js` (`LAND_COST` only), `gfx/sprites.js` (the minimap colour for `T_FORD` only), `engine/worldnature.js` (`PX.WN_KIND.ford`, painted as open ground until D), `battle/terrain.js` (`terrainRecipeOf` reads `T_FORD` as open only; as built, no edit was needed: a ford falls through as open ground), `Ashmark.html`, `wiki.html`, `ui/map.js` (new: an empty placeholder for C, so the load order is set), `tests/structure.js`, `tests/run-tests.ps1`, `tests/run-tests.sh`, `tests/worldgen.js` (new: the contract checks); as built also `tests/battlesite.js` (the shape check's key list) and `tests/loading.js` (with `-Gen`, the W1–W8 baseline compare is an INFO line: G1–G8 come in wave 3) | `core/*`, `ui/*`, `gfx/render.js`, `gfx/worldart.js`, every other `battle/*` and `world/*` file | f08c720 |

The load order wave 0 sets: `world/map.js`, `world/router.js`, `world/fog.js`, `world/resources.js`, `world/worldsettings.js`, `world/worldgen.js`, `world/worldplace.js`, `world/worldmap.js` (whose load line calls `installClassic`); `ui/map.js` (new, C's) after `ui/ui.js`.

**Wave 1** (3 agents in parallel, after wave 0; merged in this order) — **built 2026-10-19** (2ed6578, integrated; deferred to wave 3: the classic climates and anchors, and the suites that assume today's map under `-Gen`)

| Agent | Scope | May edit | Must not edit (closest neighbours) | Depends on |
|---|---|---|---|---|
| **A** | **Terrain, stages 1–6** (§8.2–8.6): land and inland seas by the `land` setting; ranges, highlands, passes, `rough`, D41's `high`, escarpment candidates by `mountains`; temperature, moisture with the rain shadow, climate lookup by `climate`; drainage (priority flood, lakes and outflows, flow, basins, Strahler order), river classes and widths by `rivers`, meanders, deltas, rapids, navigable, floodplain, seasonal flags by climate and `seasonal`; forests, deep and sparse. The classic nudges from `CLASSIC_HINTS` (soft warped bumps, never stamps). `regions` stays a stub | `world/worldgen.js` (stages 1–6 and their checks), `data/places.js` (`CLASSIC_HINTS` only), `tests/worldgen.js`, `tests/rivers.js` (new: the Phase 2 rows of §14.2) | `world/worldplace.js` (B), `world/worldmap.js` (contract), `core/*` (C) | Wave 0 |
| **B** | **Placement, stages 7–9** (§8.8, 8.11, 8.12), coded against wave 0's stub terrain: suitability per people, capitals, realms grown by Poisson disc, kinds by rules, ports and river ports, the bridge town, the spacing table; names from syllable tables (unique), prices and notes; lords' names past each realm's four (D10); roads and tracks by 8-direction least-cost search, smoothed (§8.11), with bridges (water run ≤ 3), fords (streams and rivers), ferries (great rivers at towns and river ports) and crossing spacing; bandit camps (`density().camps`); deposits with fish in rivers and lakes, scaled by `economy`; the checks of stages 7–9. Classic: the 37 holdings keep their names, races, kinds, realms, styles, prices, notes and `TOWNS` order, at the anchors snapped to a suitable tile within 4 | `world/worldplace.js`, `world/resources.js` (`genDeposits`), `world/realms.js` (`addMissingLords` reads `WM.lords`; first stocks × `economy`), `tests/worldplace.js` (new) | `world/worldgen.js` and `data/places.js` (A), `world/lots.js`, `world/territory.js` (Phase 3) | Wave 0 |
| **C** | **Saves and sessions.** Save v3 (above): `world.map`, gzip with a plain header, v2 refused, the checksum check, regeneration on load; fog in run lengths; `begin(k, settings)` with the generation steps and world reuse; `monsters` and `bandits` on the spawns; `runSteps` waiting on a step that returns a Promise (gunzip); **page open with the flag on**: the classic world forged behind the overlay (`main.js`, `worldmap.js`'s load line, the load-time minimap in `sprites.js`), while the wiki and tests stay synchronous; the plain New game choice (a World row: Classic · Normal · Large · Huge with a fresh seed shown, only with the flag; Huge on every device, with a slow-on-this-device note on phones (D44); hidden only without `CompressionStream`); the save line ("Large · redwater") | `core/save.js`, `world/fog.js` (`seenSave`, `seenLoad`), `core/session.js`, `main.js`, `world/worldmap.js` (the load line only), `gfx/sprites.js` (the load-time `WorldArt.mini()` line only), `ui/loading.js`, `ui/ui.js` (New game, `saveLine`), `tests/harness.js` (plain saves under sync), `tests/armygroups.js` (v2 refused), `tests/worldsave.js` (new), `tests/loading.js`, `tests/worldprint.js` (W7 only) | `world/worldgen.js`, `world/worldplace.js`, `world/router.js`, `gfx/render.js`, `gfx/worldart.js` | Wave 0 (codes against the stub world) |

**Wave 2** (3 agents in parallel, after wave 1 is merged) — **waits for the owner's go**; it also takes R12's daily-job slicing (`econDay`, `caravanDay`, `landDay`: §2.2, left from Phase 0)

| Agent | Scope | May edit | Must not edit | Depends on |
|---|---|---|---|---|
| **C** | **The full map** (§3.4, §12.4): a window in the frame rule, opened by **M** (mute moves to **Shift+M**, D45) and by a tap on the minimap. It shows realms, rivers by width, crossings, holdings, you and the fog, with a legend: 1 px a tile at Normal, scrolling at Large, 1 px per 2 tiles with zoom by region at Huge. The real stage labels in "Forging the world…" and "Returning to…" | `ui/map.js` (new), its section of `style.css`, `ui/input.js` (M for the map, Shift+M for mute, the minimap tap; the key list in the help), `ui/ui.js` (Esc and the window's place), `core/session.js`, `tests/fullmap.js` (new) | `gfx/render.js` (D; the minimap is D's), `world/*` | A, B (real stages) |
| **D** | **The way graph and the two-level router** (§3.6) behind the unchanged calls (flag on); `Router.close`, `Router.stats`; `buildWayGraph` from roads, crossings, landings and chunk portals. **Ships** keep off rivers that are not navigable; rivers join waters only where navigable. **River art:** water tiles shaded by width, banks of reeds and stones, fords lighter with stepping stones, bridges stone or wood, ferry landings, rapids in white water, brooks as 1–3 px lines along `flow`, through `PX.worldNaturePaint`'s spec. **Roads at any angle (owner, 2026-10-18):** each road is painted as a smooth curve through its smoothed line (§8.11), not square stamps per tile. It has worn verges, ruts and a width that varies, from great road to track, and joins cleanly at forks and gates. Today's map is unchanged with the flag off (W5 and W6 hold). **Coasts (owner's reference look, 2026-10-18, a light touch):** a sand rim, a pale shallow-water halo with soft cloudy edges and a few wave strokes, in today's palette. **The minimap** at 1 px per k tiles, k = ⌈w ÷ 256⌉ (today's map: 1, so W6 holds). Prefetch checked at Large and Huge. LOD tiers stay infinite (counts are today's until Phase 6) | `world/router.js`, `world/ships.js`, `gfx/worldart.js`, `engine/worldnature.js`, `gfx/render.js` (the minimap only), `tests/router.js` (new), `tests/worldchunks.js`, `tests/visual/rivers.js` (new: every river piece, for the owner's approval) | `world/worldmap.js` (E), `battle/*` (E), `ui/*` (C) | A (rivers), B (roads, crossings) |
| **E** | **The battle link and D41** (§13): `battleSite`'s new fields (§15.2.1); river width, the world's bridge, ford-only rivers, the ferry's ford, delta and floodplain marsh; the high-ground kinds as layouts. **The steep hill:** climbable anywhere but very slow and tiring; ranks break on the climb; no charge momentum uphill; cavalry crawls; downhill charges hit hard; a strong height bonus; scree (no cavalry charge across it, shooters reach farther downhill); mixed edges with a gentler shoulder. Routing prices steep edges, so groups take a shoulder or ramp when one is near; the AI holds steep crests and attacks by the shoulder or ramp. Its own look (a darker stony bank) | `world/worldmap.js` (`battleSite` only), `battle/terrain.js`, `battle/engage.js` (`bridgeNear` from crossings), `battle/route.js` (steep costs), `battle/commander.js` (crests, shoulders), `battle/morale.js` (cohesion on a steep climb only), `battle/lab.js` (`labSite` takes river width, crossing and high ground), `engine/ground.js` (the steep bank and scree), `tests/battlesite.js`, `tests/steephills.js` (new), `tests/visual/terrainbalance.js` (a steep-hill row) | `battle/setup.js`, `gfx/*`, `world/router.js` (D) | A (`river`, `high`), B (`crossings`) |

**C (wave 2), built 2026-10-21:** the full map (`ui/map.js`, style.css 8c, `tests/fullmap.js`): M and a click or tap on the minimap open it, Shift+M mutes (D45; Help, Settings and the controls line say so); 1 px a tile at Normal, scrolling at Large, 1 px per 2 tiles at Huge with zoom (+ −, a click: 1:1 by region); it fits 844 × 390; the Huge picture builds in about 11 ms headless (1:1 in about 25). The loading steps: the generator's stage labels in "Forging the world…" and "Returning to…" (already wave 1's), and "Peopling the land" for the start's step whether the world is new or reused (it was "Founding holdings", the generator's stage name, when reused).

**The owner approved wave 2's art (2026-10-22):** the river, road and coast pieces (`tests/visual/rivers.js`) and the steep hill's look (TERRAIN_DESIGN.md). One change asked: swamp water was too close to the swamp ground; four palettes compared in `tests/visual/swampwater.js`; the owner picked **C**, a lighter peat blue (`WATER_RGB.swamp`), on today's map too (W5 re-recorded with the reason).

**The owner's play-test of the generated world (2026-10-22): art fixes (G), built, waiting for the owner's approval** (`tests/visual/worldart.js`: before and after in the game's own view). Roads (`gfx/worldart.js` `artGenPlan`): a road's end at a holding is cut where it comes into the yard round the centre (`GENART.yard`), led round it the nearer way and up into the gate, the centre's foot notched for it (`GENART.notch`), over worn ground (`GENART.worn`) (`gateLead`, as `lots.js` leads the road tiles); a line ending on a crossing's water is moved to the crossing's end (`offDeck`); a crossing is met straight on its axis (`straightOn`, `GENART.lead`, less where the way turns off at once) and a bridge's deck by a ramp of road as wide as its deck inside, narrowing to the road (`segW`); a fork's end is carried onto the way it joins as softened (`joinEnds`, `GENART.join`). Fords: rippled shallows along the crossing's line, fading from the river's colour over some 7 px with a wobbling edge, rounded into gravel on each bank (`fordAt`, `GENART.ford`), the stepping stones scattered along it. Frost (Phase 3's frost part, on today's map too): the snow's cover a tile (`snowCover`, `FROST`): the frost's tiles counted 3 each way, on the generated world raised or lowered by how cold or warm it is against the frost line (`WM.temp`), and the height near the frost (`WM.elev`; today's map: hills and mountains); a pixel's ground dulled toward tundra with the cover and snow laid where the cover beats its own noise, so it lies whole a few tiles in and thins out in patches over the grass beside it (`landRGB`); drifts only where the snow lies whole. Swamp: low, dark mangroves on stilt roots (`PX.worldTree('swamp', 'mangrove')`) on its open ground, by groves, some 0.5 a tile (`FEN`; a wood has about 5). Tests: `worldchunks` (with `-Gen`: gates, ramps, forks, fords), `worldnature` (the frost's blend, the fen's trees). W5, W6, G5, G6 re-recorded with the reasons (`tests/worldprint.js`).

**The owner's play-test 3 (2026-10-22): estates across a river (M), built.** Brookwick's estates and pens stood across a river from it with no crossing, so its workers could not reach them; the owner then asked for bridges near holdings to any estate across water, every worker home and back on time, and the roads always joined to the bridges. Stage 8 (`worldplace.js`), after a river's crossings 60 tiles apart: **each holding's water crossed near it** (`placeHoldXing`, `PLACE_HOLD`): while water of a river (or a lake's, or the sea's) lies within 8 tiles of a holding and land beside it within 10 is not walked to from its gate, or only far round (`placeWalk`: 4 ways over walkable ground, fords, bridges and ferries, within 16 tiles; far round: more steps than 1.4 x the straight way's, 4 ways, and 4), one crossing of it there: the run of water from land walked to near to land not, both ends within 10 tiles, off every centre and the ground in front of its gate, no notch; a bridge (3 tiles at most), else a ferry on a great or navigable river; where none can be made (a pocket of land in a bend) it is left (`PLACE_STATS.holdBare`). **Every bridge on the roads**: from each end of a bridge no road joined to the holdings takes, a track (a lead of 2 tiles straight on, on the bridge's axis, then the least-cost way to the nearest such road on its bank within 60 tiles, never onto another crossing's end); an end with none is a road itself (`PLACE_STATS.stubs`: the way off the bridge onto land no road reaches, a holding's bridge to its fields); a bridge neither end of which reaches a road is taken up (`PLACE_STATS.dropped`: the 60-tile rule counts that stretch bare). The tracks are roads with no holdings (`a`, `b` empty), their path from the bridge's end. **The lots** (`lots.js` `lotWalk`, `lotWalks`): every house, estate and field on ground walked to from its holding's gate within 28 tiles, a building's door not far round (as above, and twice the straight line and 2), never on or beside a crossing's end, its own bank first (across a crossing a spot counts 4 tiles farther); on today's map an outer estate with no spot near falls back on one its people still walk to (no estate lost there: Fernhollow keeps its farm and pasture across its lake, as before, so the battle fingerprints, which read what begin draws, hold; on the generated world such an estate is not built); on the generated world a port town's harbour is laid before its houses (a League port's docks on its sea). `folk.js` `DELIVER.grace`: a worker whose hour fell at the very end of the delivery window still sets out (one stayed in with his load). `router.js`: two landings at one place of a river a tile apart, not none. Tests: `worldplace` (each holding's water crossed, the tracks to bridges; a made-up map with two bridges and a ferry), `worldsanity` (Rivers by holdings, Estates on foot), `estates` (every lot walked to), `fieldwork` (each worker reaches his estate's door and back), `workerways` (the owner's KPI: 2 days at every holding, every trip home and back with none stranded, all in by 22.8 h, the land's way to each door at most twice the straight way and 3 tiles; today's map's Fernhollow INFO), `bridgeroads` (both ends of every bridge on a road joined to the holdings: classic, Normal s1-s3, Large s1, saltwell; and every bridge tile of the world in use). With O's spread (play-test 4), M's rules held to it: a holding's ferry only on a river boats sail; the 60-tile crossings and the holdings' own keep off every holding's centre and the ring round it, and every crossing's end at least `PLACE.apart` (3) tiles from another's (the roads' new crossings too: no ford right by a bridge's end); the holdings' walk for their crossings does not pass through a centre (no track can), and the crossings laid since the roads are priced for the tracks (a track over a 60-tile ford); a track's lead off its bridge kept straight in its line (laid, then the way on from its end, away from it), never longer than the way over its own bridge and on, `PLACE_HOLD.loop` (3) tiles more (no loop round the river to its own other end), and no lead left unbuilt for want of ground (the track then starts at the end); stage 7's realm balance reckons the holdings' own bridges in (`placeHoldBridged`: narrow water within 8 tiles of a holding taken as bridged; they carried a realm's land over its rivers, Normal s7 at 36%); an estate with no near spot is built far round only on today's map.

**The owner's play-test 2 (2026-10-22): world layout and AI (K), built.** Roads into the river: a road came into a holding's own tile from any side, and the art led it round the centre's yard the nearer way to the gate, over whatever lay beside the centre (Thornbrook, on `ASH1-X-2V40O9HH-saltwell`: round its north-east corner over the river, which reads as a road running into the water); and a line's first and last legs, from a gate's corner or a point on the road it joins, were never checked for water (a coast road grazed the sea). Now stage 8 (`worldplace.js`) searches each road from gate to gate (the tile below the holding's), each holding's centre (`placeBox`: as `lots.js` lays it, 2 x 2 a village, else 4 x 4) and the ring beside and behind it shut, so a road always comes in from in front; a road's path still runs from the holding's tile (the way graph's node) to the other's; and a line's end legs as drawn must be dry (`dry`: water only a crossing's). Buildings on the road: no lot nor field stands where a road is painted (`lots.js` `roadPaint`: the tiles within 2 px of a road's middle as the art draws it: on the generated world along its lines, `artGenPlan`'s points; on today's map its tiles and the gate's half-tile shift, `roadStamps`), and a holding still short of room for its people after the open ground clears plots in the woods (a second pass; today's lots unchanged). Caravans keep to the roads: `Router.travel` with `road` (the caravans' goal, `brains.js` `CaravanBrain`) costs a tile off the roads `WAY.keep` (4) times as much, in today's flow fields (their own field), the tile searches and the way graph (its chunk ways and portal steps); off the road only when it runs from you, or where no road goes. Encounters beside the road: `ENC_ON.byroad` (a walkable tile off the road, none within 1, one within `ENC_BY`, 3) for the camps and scenes (the gamblers, the wounded traveller and so the lure; the hunters' wood and the deserters' wild ground no longer by a road); the walkers (the peddler, the messenger, the bard, the beggar, the processions) stay on it. Tests: `worldplace` (each road from a holding's gate, none past a centre's sides or back, no line into water but at a crossing, on the four seeds and the saltwell world; no road in the world in use stops at the water), `lots` (nothing built where a road is painted), `caravanparty` (a caravan 85% or more of its frames on the road), `encounters` (byroad). G1-G8, GB2, the sums and W7 re-recorded with the reasons (`tests/worldprint.js`). Found, not fixed: on the saltwell world (Huge, 53 holdings) stage 7 gave up on the capitals' spacing after 8 tries and kept a world whose 53 holdings all stand in its north-east quarter (`relaxed: capitals Thornbrook and Deepdelve too near, kept after 8 tries`).
- **Phase 3, the climates' edges (L, play-test 3, 2026-10-22), built, approved by the owner 2026-10-22, on both maps:** each climate's cover a tile (`worldart.js` `coverOf`, `COVER`, `landRGB`), as the frost's: the grass under it darker and wetter by the swamp, yellowing by the desert, the swamp's and the desert's ground laid over it in patches thinning out over some 3 tiles; the 3-px jittered blocks are gone. Small things mix across the edge (`PX.worldNatureMix`, `PX.WN_MIX`) and a wood has a ragged fringe (`PX.WN_FRINGE`). Fords are natural (`GENART.ford`, `fordAt`, `fordTrack`): a wandering shallow bar, gravel, sand, mud or slush banks, a worn track down each bank, scattered rocks by climate. Forks carried onto the way they join (`GENART.join`); `lots.js` reads the painted roads (`artRoadMarks`). `tests/visual/worldart.js` `&part=4`. W5, W6, G5, G6 re-recorded for the look; G3, G7, G8, GB2 because `lots.js` now reads the painted roads (proven: the three road fixes off, the old values back). **Still to do:** the trees' species still switch at a climate border (only the fringe and the small things mix); the frost's hills and forest floor take the frost's colours by tile, not by the snow's cover.
- **Phase 3, play-test 4 (N, 2026-10-22), built, approved by the owner 2026-10-22:** what read as swamp on the grass was a hill's shade, so grass hills shade lighter (`PX.WORLD_NATURE.grass.hill`); a hill runs on under a road or yard (kept-clear ground no longer stops a rise); brooks cross roads as splash fords over tracks and stone culverts under great roads (`PX.WN_XING`); the roads' colours blend across climates by the same covers (`roadPal`, `GENART.rblend`); trees by ecotone, each tree's species from the climates' covers leaned by the generator's own scores (`PX.WN_ECO`, `ecoLean`), frosted and thawed kinds by the snow; frost hills and forest floors mixed by the covers (`PX.WN_BLEND`); a bridge's foot a deck-wide abutment on land, nothing on the water beside it (`abut`); a track's end at a bridge's end kept there, a track turning back off a bridge running `GENART.back` out first. `tests/visual/worldart.js` `&part=5`. **Still to do:** the fog of war's soft edge can read as dark ground (`world/fog.js`).
- **Play-test 4, the generator (O, 2026-10-22), built:** §8.4 the climates smoothed before their cuts (temperature box radius 4 twice, low ground radius 2 once: `GEN_CLIMATE.blur`) and tidied after (`genClimTidy`): no strip or 1-tile neck (`strip`), no climate piece under `minArea` 400 tiles × √(area / Normal's), but isles and the classic holdings' homes; a moved tile's temperature and moisture refilled from its new climate's. §8.5 the rivers' check adds every brook ending in water (`GEN_RIVER.brook` 6; the data already held it, the dry ends seen in play were the art clearing brooks under roads' margins, drawn across now by N). §8.8 the capitals' gap shrinks a tenth at a time toward `PLACE.capMin` .6 instead of falling back to each people's best site (saltwell's corner bunch); reach and room scale with √(land / holdings) (`PLACE.space` 54), more liking for room (`PLACE.room`), less pull to the capital (`PLACE.pull` .05), a port at least. **Left:** Huge's dwarves relax their suitable land (with more factions, bigger maps and several continents, later: the owner).
- **The sweep after play-test 4 (Q, 2026-10-22):** a line ending on a bridge's deck no longer keeps a zero-length leg (`offDeck`), which had left ~11 segments by 14 bridges unpainted and not kept clear; the world paints about 29% faster with the same pixels (`litSpk`, `coverTiles`, `wpx`'s 3 x 3 read once a tile, `wdist` only by edges, no ground in a chunk's margin; in `engine/worldnature.js` `fits` on clean tiles and the hills' loops). **Left for the layout batch:** Redspire's lumber camp is not built on Normal s1 (no spot its people reach but the long way round).
- **Play-test 5, the generator's water (R, 2026-10-22), built:** §8.5 no rain on the desert's land (what runs onto it sinks but a stream), so no stream rises there; the drainage rises into it (`GEN_RIVER.desert` rise 2.5 a tile, to 40), so rivers go round; one that still enters ends, by the chance `lake` .75, in a terminal lake (its own basins); no brook on desert land. New stage 5b "Springs and oases" (`genPonds`): every brook's head has a source (wood, hill, peak, lake or pond, or fed by water), else carried up its feeder (20 tiles), else a spring pond, else cut back (`genSourced`, `genCutBrook`, `genRiverCheck(m,true)`; heads lost to stages 7-9 cut at stage 10); ponds (`GEN_POND`: hollows, swamp pools, tarns in the pits, oxbows in bends), none in the desert; oases (`GEN_OASIS`): no desert tile more than 40 tiles from water, one each 4000 desert tiles at least, on low ground and old riverbeds, 1-2 tiles (3 big); all compact lake water, listed in `m.ponds`/`m.oases` {i, r, kind or big, tiles}. Fixed: a narrower river's rapids no longer clear a wider one's navigable bit. Merged with S and U (2026-10-22): port piers prefer the sea (`LOT_SEA`), the camps grow with the land (`density(map)`).
- **Play-test 5, the art (T, 2026-10-22), built, waiting for the owner's approval:** a road through a wood is a lane (`P.lane`, `GENART.wood`: narrower, wandering; the forest floor, trees and overhanging crowns up to it, `PX.WN_LANE`), and a ford's track in a wood the same; ford shallows an S-bent ragged bar (`GENART.ford`); hills rise over road tiles with 3 hill neighbours and cast soft shadows (`PX.WN_HILL` road, soft): no straight cut along a road; mountain kinds (`PX.WORLD_MOUNTS`, `PX.worldMountKind`, `PX.WN_MOUNT`): desert sandstone buttes, pale granite, rare dark basalt, snow-capped alpine, low forested, mossy swamp knolls, one kind a range, colours blended across a climate border; oasis and pond rings from `WM.oases`/`WM.ponds` (`ringOf`, `PX.WN_RING`: palms and greening; reeds, scree, ice, lily pads by kind; soft seeded blobs, banks by the blended climate); brooks drawn over kept-clear ground, starting and ending in the drawn water, moved off roads they run along; the fog's edge a cool haze (`gfx/mist.js` `haze`). Shots `tests/visual/worldart.js` `&part=6`. **Left:** forested mountains read flat; no salt rim on desert terminal lakes; no sandy or rocky hill variants.
- **Mountains, the owner's notes on T's kinds (Y, 2026-10-22), built, waiting for the owner's approval:** forested ranges carry the world's own trees (`PX.worldTree`, lifted by the range's height, lit by its slopes, species by `PX.WN_ECO`), bare rock on steep faces, crests and above a ragged tree line; the original look kept as the kind `classic`, first in every climate's variety pool (`PX.WN_MOUNT.pool`, `PX.worldMountPool`, `PX.worldMountKind`: grass classic 4, granite 3, forested 3 wet, alpine 2 cold, basalt .35; frost classic 4, alpine 4, granite 1, forested 1.5 low; desert classic 4, sandstone 4, basalt .35; swamp classic 4, knoll 4, forested 2 high); every range has a kind for all four climates and blends toward a neighbouring climate's by the ground's covers (`PX.WN_MOUNT.blend`), its foot leaning to the ground under it (`foot`). Today's map keeps the original look only. Shots `tests/visual/worldart.js` `&part=7`.
- **The owner's art notes (AR, 2026-10-23), built, waiting for the owner's approval:** a group of hill tiles is one broad rise, swelling into a few knolls when big (`PX.WN_HILL`; the spotted grass of the owner's shot was the per-tile hill lattice); every wood tile a full stand of at least 4 trees, the fringe thinning only outside it (`PX.WN_WOOD`); farm plots grow crops in rows by climate and realm (wheat, barley, rye, vegetables, turnips, potatoes, vines, flax, herbs, orchards, hay, fallow; the desert's irrigated plots with palms; snow in the frost's furrows; Karn terraced: `PX.worldCrop`, `PX.WORLD_CROPS`, `gfx/worldart.js` `farmPlot`, drawn by `gfx/structures.js` `estateGround`); `FARM.ripe` waits for seasons. Shots `tests/visual/worldart.js` parts 8-9.
- **Pond and oasis banks (PB, 2026-10-23), built:** a pond's mud or gravel and an oasis's sand take the ground's own light, grain and a dapple (`gfx/worldart.js` `pgr`, `GENART.pgrain`), and the ring's green lean has a soft cap so it stays mottled at the water (`PX.WN_RING.soft`): no straight run of one colour along a tile's edge round any pond or oasis (`tests/worldchunks.js`).
- **Workplaces where they make sense (EW, the owner's play-test of 2026-10-23), built:** a mine stood in a forest clearing with no ore near (the owner: "I don't want mine or any other buildings to spawn or build in the area that is not relevant to them"). One table, `data/economy.js` `ESTATE_LAND`, for whether a holding has each place of work (`Buildings#canHave`; no spot, no estate, never offered; the Fief greys it with the reason) and where it stands (`lots.js` `landFits`): a mine with 3 of its 4 tiles at the rock and an ore vein of its land within 3 tiles, a quarry at the rock, both their backs to it (`rockYaw`); a lumber camp with 40% of the tiles in and round it wooded; a farm and its fields on fertile ground (`FERTILE`: not the desert's dry sand); pastures and ports as before. No ore from nothing (`resOut`). A pasture's herd by its land (`data/critters.js` `PASTURE_HERD`): new camels, water buffalo and kept reindeer with their own produce (`CRITTERS` `make`). On the classic world 15 mines became 6, 36 farms 35; on s1-s4 mines 55 to 46, lumber camps 46 to 38. Tests: `tests/workplaces.js`; pictures `tests/visual/workplaceshots.js`. W1, W3-W8, B2 re-recorded (their rules off: as before).
- **The play-test of 2026-10-22, the generator and placement (GP), built:** **no tiny patch** (the owner: "there shouldn't be a 1-tile spawn of forest or any terrain"): `worldgen.js` `genPatchTidy` (`GEN_PATCH.min` 4): a piece (4 ways) of open ground, wood, hills or peaks under 4 tiles taken by the kind of open ground, wood or hills bordering it most (from larger pieces, as `genClimTidy`), never into peaks (a pass stays open) but a pocket ringed by peaks alone, never into water (ponds keep their 1-4 tiles); its marks follow (deep and sparse wood, D41's high ground, a peak's flow under a brook's). Run in stage 5b after the ponds and oxbows (the springs, roads and holdings see it) and after the oases (a head left with no source cut back), and in stage 10 on what stages 7-9 cut small (a clearing's ragged edge, a road, a camp), open ground by a road kept (its verge). Moved at 5b 304 / 249 / 297 / 226 tiles (classic, Normal s1-s3), at the end 66 / 38 / 38 / 28; pieces under 4 tiles at the generator's end 251 / 245 / 260 to 67 / 78 / 79 on s1-s3, all isles, pockets among peaks and road verges. **No brook through a holding** ("small streams should not cross a holding or an estate"): stage 7's centres on dry ground (`worldplace.js` `placeDry`: no water, river or brook in the centre's box; the classic seed's anchors as they were); stage 10 cuts every brook within a holding's ring and a tile more back up to its springs (`genHoldBrooks`, `GEN_HOLD_BROOK.margin` 1; what ran on below rises past the town where it has a source, else is cut back to a confluence): 580 / 303 / 314 / 359 brook tiles, the brooks' 3,954 / 2,769 / 3,131 / 3,421 tiles to 3,342 / 2,433 / 2,726 / 2,979; no building on or beside a brook, no field on one (`lots.js` `brookAt`, `LOT_BROOK` 1). Brook tiles by the centres, in the rings and on lots were 46 / 222 / 51 on the classic seed: none now. **Ports** ("port should spawn only at a huge river; cannot spawn by a small pond, small lake or oasis"): harbour water (`worldplace.js` `portWater`, `PLACE_PORT`: standing water in a body of 400 tiles or more, or a navigable or great river) within 2 tiles of a port town (`placePort`; it was the open sea's or a navigable river's, which let a small lake on a river in, and a non-League port any lake within 2); a fishing pier on a lake or a river 2 wide or more, never a pond, an oasis or a stream (`lots.js` `pierWater`, `pierOk`, as `structures.js` `pierOf` lays it); a dock on its pier's own water (`ships.js` `dockOf`); the League likes harbour water (`dH`), and stage 7 regrows up to 5 times (`PLACE.regrow`: Large s2 balanced at its fourth). Ports on Normal s1-s8, Large s1-s2: League 16 to 13, others' 6 to 0 (theirs took any lake within 2); port estates on a pond or a stream: classic 5 of 13, s1 3 of 6, s2 5 of 11, s3 5 of 9, now none. **Sites**: `DENSITY.grow.by.sites` a rule a kind: caves, ruins and shrines by the land ^.35 (the classic seed's 3.19 x the base's land gives 1.5 x: 95 / 67 / 57 to 45 / 31 / 27; "ok 1.5"), hideouts ^.8 as the bands they shelter (76 to 61), the travellers' camps ("too many pilgrim and wanderer camps") by the world's road (`worldRoads`: the roads between the holdings, a great road's tile 1, a track's .5, an estate's track none: they are the workers' own and laid later; the base 1,680, one camp to 80 tiles): 67 / 63 / 62 / 65 to 21 / 16 / 15 / 15, 30 tiles apart at the least and 16 from the outlaws' camps and hideouts (`sites.js` `SITE_GAP`, never relaxed; the hideouts keep it too), drawn beside a road (`TravellersCamp.pick`); a Large world's 20. Also: an estate's track keeps its painted line, corners rounded as the art rounds them, off every field (`lots.js` `lotClear`, `softClear`: a sharp corner by Ironvein's quarry field). Tests: `worldgen` (no small patch after 5b and at the end; with the tidying off 160 and 176 on Normal s1), `worldplace` (ports on harbour water, no brook in a ring, dry centres, the oasis's holding by the first of 3 spots), `worldsanity` (ports and piers), `lots` (no lot by a brook), `sites` (the travellers' count and spacing), `worldscale` (the per-kind rules, the road), `wilddensity`, `ships`. W1-W8, B2, the five sums, battleresolution's three and aishare's generated value re-recorded (all back with the rules off). **Left:** estate tracks (laid at a holding's layout) can still leave a wood of 1-3 tiles between them and a road (in play only); a 1-tile isle in a lake or river stays (water keeps its rules); the art for a forest tile is agent AR's.
- **Play-tests 4 and 5, the layout (S, 2026-10-22), built, on the generated world only (today's map as it was, its fingerprints held):** **Country tracks to the estates** (the owner: "a country road or non-main road to cross between forest as well when there is an estate near by"; `lots.js` `estTrack`, `LOT_TRACK`): to each outer estate no road or track comes within 2 tiles of, a track (a road of no width, as M's bridge tracks) from before its door (or beside it or its fields) over free ground its people walk to (woods 1.8, hills 2.2), ending on the way from which the roads bring them to the gate soonest (an earlier estate's track counts: estates chained); straightened, laid on its tiles and in `WM.roads` (`est`: its holding), the painted roads marked as it goes. Laid as each holding is laid out (and for an estate built later), taken up when the world goes in again (every new game lays them alike) and laid again from a save's lots; then the way graph is charted again with every road's ends as nodes (`router.js` `wayRechart`) and the land reckoned over them (`computeLand`). Workers keep to the roads and tracks where they go (`WAY.folk` 1.05: never straight through the woods past them; 72-80% of their steps out and back on a way). 39-64 tracks a Normal world (246-474 tiles laid; the classic seed 64, 443), 72 on Large s1 (434), 84 on saltwell (669); one pasture (classic seed, Stonebridge) hemmed in by its holding's houses and the water gets none. **Clearings** (`worldplace.js` `placeClear`, `PLACE_CLEAR`): where fewer than 80/90/170/240 tiles of open ground and hills (village/castle/town/city) lie within a holding's ring, the woods nearest it opened (ragged, by a noise) until that many lie within its ring and 3 tiles more; as stage 8 begins, once stage 7 has chosen the holdings. Forest villages had their houses (3 each: lots.js builds in the woods when the open ground is short), 3 of 15 of them among the trees; now 3-4 each, none among the trees, with their farms beside them (Thornwick and Brookhollow had none); forest towns and cities had theirs scattered through the woods, leaving their estates no room past them (Eldermere s1: 18 houses, 11 in the woods, 1 estate of 8 wanted; now 21, none, 6 of 8; Moonwell Large s1: 20, 17, 2 of 8; now 22, none, 6 of 8). **Farther estates** (`LOT_FAR` [18, 22]): an outer estate with no spot within 12 tiles looks out to 18, its door at most 22 steps from the gate (its workers home on time): Redspire s1 has its lumber camp. Estates a holding wants (`Buildings init`) but has none of though its land has their ground within 18 tiles: classic seed 32 to 2 (Sunreach mine and quarry), Normal s1 17 to 4 (Aelglen mine, Bramhollow mine and quarry, Aelmere mine: hills across a lake), s2 25 to 3 (Linwell quarry, Linbough lumber, Aelwell mine), s3 26 to 3 (Eldermere mine and quarry, Karnhold lumber), s4 13 to 3 (another s4: it now passes stage 7 on its second try; Mossbough lumber, Dustwell lumber and quarry), Large s1 25 to 6 (Greyrock mine and quarry, Ashwick quarry, Elderdown mine and quarry, Wardmarch lumber); the rest (8-19 a world) have no forest, rock or shore near. **Oases**: a big one (`m.oases`, agent R) draws desert peoples (`PLACE_OASIS`: orcs +.35, the League +.2 within its radius and 4 tiles); ponds and oases are never bridged nor crossed (`F.pond`). **Stage 7 robustness**: a capital's liking is the one it was chosen by (`g.work.like`: the ground opened under a dwarf capital on a hill took its .2 and failed the check, "Granitehold liked 0.45"), and the realms are grown again from their capitals up to 3 times a try while too few fit or their land is unbalanced as the check finds it (`PLACE.regrow`, `placeEven`): tries at Normal s1-s10 from 1/1/2/7/1/2/8/3/8/6 to 1/1/2/2/1/2/1/3/2/3 (the worlds that passed on their first growth unchanged). Tests: `lots` (every outer estate's door on a way, every track joined to the roads, the same after a load and a second begin), `workerways` (the tracks, the workers on them, Redspire's camp), `worldplace` (the clearings, a pond never bridged, a big oasis drawing a holding), `worldsanity` (the capitals' liking as chosen). G1-G8, GB2, the five sums, battleresolution's five and aishare's generated values re-recorded (all back with the rules off). **Left:** Normal s6's roads still fail (no road Aelglen to Brookwick, kept after 8 tries); the estate tracks are not in the art's own check for loose ends (`tests/worldchunks.js` sees each door's end joined only by its short last leg). **At the merge with R** (ponds, oases, terminal lakes): a road's corner tile near a holding never in its centre's ring (`genRoads` lay: once a road was led past Deeprak's side); a lone tile of land in a river is no bank for a holding's crossing (`PLACE_HOLD.pocket` 4: a bridge to such a tile had no road to reach and was taken up, the island left); `tests/encounters.js` finds its test spot with ponds about it and no wood where it sets its encounters; `workerways` checks every holding that wants a lumber camp and has a spot for one (lots.js's own rules) has one, the rest INFO (Redspire's camp by name moved with the world).

**E (wave 2), as built 2026-10-21** (merged 2026-10-21; TERRAIN_DESIGN §8, "World Phase 2 as built"): `WorldMap#battleSite` fills `river`, `crossing`, `elev`, `terrace`, `rough` and `high` in a generated world (its river and crossing tiles indexed once, `WM._site`); `bridge` from the world's bridges. `terrain.js`: `riverOf` (the crossing's kind), `worldOf` (`wr`: width, the bridge's make, delta, flood; `high`), `TERRAIN_RIVER.widths`, `BattleRiver.kinds` (the ferry's one ford), `FieldPlan#planWet` (`TERRAIN_WET`), `planFeatures` and `planSteep` (the kinds as layouts), the steep hill (`STEEP`, `B.terrain.steep`) with its rules, its price on the route grids (`route.js`) and its look (`engine/ground.js`); `commander.js` `steepHold`, `onSteep`; `morale.js` `steepRanks`; `lab.js` `site` and a hill's `steep`. Measured with the flag on: *Hold the bridge* on 25 of 2,253 road tiles (1.1%); steep hills in the lab: a centred one splits 4/6 (a rise 4/6), battles 66 s (52); one in a side's half wins it 17 of 20 (a rise 16). `tests/worldgen.js`'s "new fields all empty" check (A's file) fails with `-Gen` by design: its line is the coordinator's to change. The steep look awaits the owner.

**A (wave 3), as built 2026-10-22:** the classic terrain (§8.15 "As built (wave 3, A)"): `CLASSIC_HINTS` now 10 hints (`frostMarches`, `greenWest` and `northPeaks` added; the desert's and the League's places named); `worldgen.js`: `GEN_HINT_LAND` and `genLandHints` (the bay, inlets, the anchors' land and necks), ranges and highlands kept off the anchors (`GEN_ELEV.held`), `GEN_VALLEY` and `genValleyHint` rewritten, a climate's home (`GEN_CLIMATE.home`), the hint bumps worked within their boxes, and a river cut shorter than a brook by the 4-way join dropped (it left a 3-tile river on the classic map). Seeds other than Classic make the same worlds as before (their sums held). §3.7 measured (there).

**Wave 3: the classic seed and the proof** (3 agents in parallel, after wave 2; **E merges last**) — built 2026-10-22 (A, B, then E)

| Agent | Scope | May edit | Must not edit | Depends on |
|---|---|---|---|---|
| **A** | **The classic terrain** (§8.15 hints): frost north, desert south-east, Karn Hold below peaks, Mirefen and Tidewatch in fen, the League's ports on one southern sea, a great river from the northern peaks to the south coast past Stonebridge. Generation time and peak memory per preset (§3.7). Fixes for `worldsanity` failures in stages 1–6 | `world/worldgen.js`, `data/places.js` (`CLASSIC_HINTS`), `tests/worldgen.js`, `tests/rivers.js` | `world/worldplace.js` (B), `tests/classicseed.js` (B) | Wave 2 |
| **B** | **The classic anchors** proven: positions by §8.15's formula, snapped within 4; Willowmere an island village with bridges (`routes`); Stonebridge at a bridge on the great river; the League's ports on one sea (`ships`). Fixes for `worldsanity` failures in stages 7–9, and the relax order | `world/worldplace.js`, `world/resources.js`, `world/realms.js` (lords, stocks), `tests/worldplace.js`, `tests/classicseed.js` (new: every §8.15 hint as a check) | `world/worldgen.js`, `data/places.js` (A) | Wave 2 |
| **E** | **The proof.** `tests/worldsanity.js`: §8.14's Phase 2 rows on 8 seeds at Normal and 2 at Large, within 240 s; `tests/visual/worldsanity.js`: 30 and 10, by name. Suites adapted to pass **with the flag on and off**, reading places, never literal coordinates: `mapview`, `territory`, `routes`, `worldnature`, `ships`, `captives`, `battletypes`, `controlaudit`, `visual/shot`. *Hold the bridge*'s share (`visual/btypebalance`, `battletypes` trigger counts) with the flag on: ≤ 25%. `tests/visual/worldscale.js` (new: per preset, generation time and peak memory, chunk paint, router, `updateWorld`, save size plain and gzipped); `visual/loadtimes` per size. Then **records G1–G8 and the sums** | The suites named, `tests/worldsanity.js` (new), `tests/visual/worldsanity.js` (new), `tests/visual/worldscale.js` (new), `tests/visual/loadtimes.js`, `tests/worldprint.js` (G1–G8, flag on) | Game code (send failures to A or B), `tests/worldgen.js`, `tests/rivers.js` (A), `tests/worldplace.js`, `tests/classicseed.js` (B) | A's and B's wave-3 merges (for the hashes) |

**B (wave 3), as built 2026-10-22:** the classic anchors (§8.15 "As built"); `tests/classicseed.js` (new: the anchors by their formula, the 37 whole in `TOWNS` order within 4 tiles, free ground, their own climates, each terrain hint, the climate disc, placement alone on a made-up land; with the flag on, `TOWNS` and the League's docks on one sea). Stage 7's check takes §8.14's realm-land row: each realm's land within 30% of their mean (`PLACE.spread`), reckoned as `territory.js` claims it at the start (`placeRealmLand`, its costs and first growth in `PLACE_CLAIM`, since `territory.js` loads after the generator runs); it matched `landsOf` tile for tile on 13 worlds, and Large seed 1 (40% before) now takes 3 tries. The relax order stays §4.5's, with the one rung Phase 2 has: holdings one fewer a realm (twice at most), only where fewer can help (too few fit, no fair start); other stage-7 failures take their 8 tries and keep the last. The road search's box-then-whole-map call is one helper (`find`; worlds byte-identical).

**E (wave 3), as built 2026-10-22** (on A's and B's merges, 70970ed): `tests/worldsanity.js` (new): §8.14's Phase 2 rows on Normal s1-s8 and Large s1-s2, each world made as a new game makes it (`begin` with its settings), in about 15 s: every holding and camp reachable from every capital by land and ferry, and again with every seasonal crossing shut (the fords on flooding rivers); each capital's liking and land (`placeSuit`, `placeLand` on stage 7's fields and ground); capitals' nearest rivals within 25% of their mean and realms' land (`landsOf`) within 30%; each race's start city with 3 holdings within a day (`Router.days`) and no wild land within 25 tiles; ports on water joined to the sea or another port; rivers never uphill, ending in water, no great river freezing, crossings at most 60 tiles apart wherever one can be made (else a bare stretch, INFO); each climate 6% of the land. No emptiness (it counts Phase 4's hamlets and sacred places), wild land, the lair and the shape metrics are INFO. All 80 rows pass (before B's realm-land check, Large s2's realms were 39% apart). No emptiness's 95th percentile, measured: 22-28 tiles at Normal, 34-36 at Large (sites and camps are not scaled by preset until Phase 6). `tests/visual/worldsanity.js` runs the same over 30 and 10 seeds: 318 of 320 rows pass; Normal s16 keeps a capital liked 0.45 after 8 tries (stage 7's relaxation), and Normal s19's realms are 31% apart by `landsOf` where stage 7's reckoning passed them (B's). Reports: `tests/visual/worldscale.js` (new; per preset, s1: generation by stage with the typed arrays each makes, putting in, a chunk painted, 200 router trips, `updateWorld`, the day's jobs, the save plain and gzipped), measured headless at Normal / Large / Huge: generated in 0.9 / 1.0 / 2.5 s, put in and started 0.6 / 0.6 / 0.9 s, a chunk 61 / 37 / 26 ms, `updateWorld` 0.9 / 0.8 / 2.1 ms a frame (95th percentile 1.8 / 1.1 / 3.7), the day's jobs 12 / 10 / 62 ms, saves 188 / 247 / 349 KB plain and 47 / 58 / 78 KB gzipped; the router's trips 0.2 / 0.2 / 7.4 ms (median), but at Huge the graph's searches took 11.7 s over 200 trips (slowest 680 ms; D's to look at); `visual/loadtimes` per size, `visual/btypebalance`'s world share (*Hold the bridge* 1.5% of the classic world's fights on its roads, none off them) and `battletypes`' trigger count (at most 25% of the road tiles; 25 of 2,253 at wave 2). Suites adapted to pass with the flag on and off, reading places: `mapview`, `territory`, `routes` (a generated world's bridges are its crossings: `bridgeAt` reads a road between two waters as a deck), `battletypes`, and the `-Gen` failures: `encounters`, `estates`, `fights`, `economy`, `fear`, `holdingfactory`, `fog`, `kinds`, `holdings`, `fieldwork`, `companions`, `clicks`, `worlddepth`, `worldobjects2`, and the battle fingerprints' fixtures (`actorrules`, `attackrules`, `battlesetup`: on a generated world you stand at today's point on today's ground, so the snapshots hold; `battleresolution`'s outcomes and `aishare`'s world battle read the world round them, so the generated classic world has its own constants, recorded with G1-G8). `captives`, `controlaudit`, `ships`, `worldnature` and `visual/shot` needed nothing. **G1-G8 and the sums recorded** (`tests/worldprint.js`, below the hash table). Left with `-Gen`: `fieldwork`'s herders at Stonebridge (a herder steps inside his pens there: the game's, `folk.js` or the layout).

**H (after wave 3), 2026-10-22: the last `-Gen` failures** (on 8377ad6). One was the game's: at Stonebridge the barn's two pens lie below its door and beside it, and his round keeps to their far sides (the near ones are no ground to walk), so no stop of the herder's round was clear of them in a straight line from the door and he walked through a pen. `folk.js` `penWay`: when the pens hem the door in, his way out to the nearest stop and back in goes round their fences (a 2-px grid within 2 tiles, never in a pen, nor in the building above its front row, within his reach), cut to its corners; `fieldStep` keeps every herder's step out of the pens; with no way at all he works at the door. Today's map never takes it (W1-W8 and G1-G8 unchanged); `fieldwork` checks it on four pens round a barn. The rest assumed today's map: `guards` (an estate near the walls has some of the garrison standing with its own, and as many more stand there after), `lots` (Brookhollow is a village deep in the woods with no open ground for a house: the first holding with room), `mapshake` (water lies above Ashford: its glints slide by design, left out of the picture), `routes` (Willowmere's one bridge, east, can take the day watch round the lake for a minute or more: watched till 3 stops, up to 400 s), `terrain` (the first desert tile is an oasis by a brook, marsh by design: a tile in the desert's heart).

**Wave 4: the flip** (alone, after the owner has played Classic and a few random seeds with `?gen=1` and accepted them; effort S) — built 2026-10-22 (E4; the owner chose it as the next step that day)

| Agent | Scope | May edit | Must not edit | Depends on |
|---|---|---|---|---|
| **E** | `WORLD.gen` on by default (`gen=0` turns it off; see the open questions); W1–W8 take G1–G8's values; the full sweep green without `-Gen`; New game's World row offers the classic world first | `data/world.js` (`WORLD`), `tests/worldprint.js` | Everything else | Wave 3; the owner's acceptance |

**E (wave 4), as built 2026-10-22** (on 5f77be1): `data/world.js` `WORLD.gen` is on unless the address has `gen=0`. The runner: no switch is the generated world, `-Classic` adds `&gen=0` (`run-tests.sh -c`), `-Gen` stays and adds nothing (both at once refused); the summary line says `gen=0` under `-Classic`. The fingerprints keep both tables, keyed on the world (`WM.gen`): `worldprint` checks G1–G8 and GB2 against `GEXPECT` on the generated world, the default, so the default world's fingerprints are G1–G8's values (W1–W8 took them, one cause, the new world), and W1–W8 and B2 against `EXPECT` under `-Classic`, both checked until today's map goes; `loading`'s new game in steps now checks the same table by the world (it was an INFO line with the flag on). The battle suites already keyed their two sets on `WM.gen` (`battleresolution` `expected` / `expectedGen`, `aishare` `REC`; `actorrules`, `attackrules`, `battlesetup` stand on today's point and ground on either world), so a plain run reads the generated set and `-Classic` the classic one; `rts -Seed 1,2,44` and `groundhash` hold on both (they read no world). The New world screen already offered Classic first and chosen (`WORLD_PRESETS` order, `newWorldSettings`); `worldsettings` checks it now. New game starts on the generated world; a save holds its world (`world.map`: gen, settings, sum), so either page loads either world's save, making that world again first (`classicWorld` for `classic-0`); a save whose sum no longer matches is refused ("another world version"). `tests/wiki.js` opens the wiki on the page's world (`?gen=0` under `-Classic`). Nothing of today's map is deleted.

**RM (D49), as built 2026-10-22** (on efc5330; the owner: "stop using old map, delete old map completely"): today's hand-made map is deleted and the generated world is the only one. Gone: `genClassic` (`world/map.js`), `classicWorld` and the `'classic-0'` branch of `forgeSteps` (`core/session.js`), `CLASSIC_CAMPS` (`data/places.js`), `WORLD` and `WORLD.gen` (`data/world.js`), `installClassic`'s classic path (it makes the Classic preset's world, as the tests and the wiki asked of it), `WorldMap`'s `'classic-0'` default, checksum and `roadBridge` and `battleSite`'s classic branch (`worldmap.js`), Phase 0's router wrapper (`flowTo`, `routeTo`, `travelTo`: `Router.travel` and `Router.days` are the graph's alone), the classic art (`worldart.js`: the tile-stamped roads `roadStamps`, `onBridge`, the classic ground and its four overlay passes; `OVER_GEN` is `OVER`, `coverOf` lost its flag), the classic branches of `lots.js` (the far-round estate, the harbour order, `tracksDone`'s skip), `ui.js`, `worldsetup.js` (the World page's today's-map line) and `worldobject.js`; the runner's `-Classic` (`run-tests.sh -c`) and every `?gen=0` (`-Gen` kept, adds nothing). Kept: the Classic preset (`classicSettings`, seed `CLASSIC`, `CLASSIC_HINTS`) and `CLASSIC_PLACES` whole (its points are what `classicAnchors` draws the anchors from), `DENSITY.classic` and `DENSITY.grow`'s measures (the base every world grows from), `REGION_NAMES`, `hash`/`noise`/`fbm`, `findPath`, `clearLine`, `landPieces`, and the lab's sites. Fingerprints: today's map's `EXPECT` (W1–W8, B2), `battleresolution`'s `expected` and `aishare`'s `b739f365` deleted; `GEXPECT` is `EXPECT` (the G names back to W1–W8 and B2, one world), `battleresolution`'s and `aishare`'s generated sets are their only `REC`; every value held: `worldprint -Seed 1` 16 pass, `rts -Seed 1,2,44` 1,269 pass, the battle suites, `groundhash`, `battlesite`. Tests ported to the generated world: `lod`'s reach check (against a flood, not `flowTo`), `mapview` and `sites` (reach by `Router.reach`), `routes` (walkers by `Router.travel`), `worldsave` (a save of the old map is refused, "another world version", the game untouched), the battle suites' fixed point (always set). Deleted as the old map's only: `lod`'s and `router`'s wrapper-equals-the-old-code checks, `worldgen`'s flag-off world, `battleworld`'s and `battlesite`'s today's-map branches, `worldchunks`' classic one-window hash (`c439323a`), `lots`' "no estate tracks", `fullmap`'s no-great-river legend, `workerways`' Fernhollow exception. About 18.7 KB (206 lines net) of game code and 22.7 KB (183 lines) of tests fewer.

**Hand-off to Phase 2b:** `world/worldsettings.js` exists with presets and clamps (2b adds the world code), `genWorldSteps` runs with progress, and 2b's screen replaces C's World row. The sketch pass (2b agent B) reads `worldgen.js`'s noise fields, not its stages.

#### 15.2.3 Verification per agent

These run on top of the "done" checks. W1–W8 are §2.0's hashes with the flag off; G1–G8 the same eight measures with the flag on; "battle fp" means the fingerprint suites and `groundhash`.

| Agent (wave) | Suites that must pass | World hashes | Battle fp |
|---|---|---|---|
| A (0) | `structure` (bans, one name one place, the wiki's order); `worldgen` (contract: clamps of every key, `normSettings` idempotent, Classic's locks, every layer at `w × h`, `genWorld` returns the shape, `installWorld` then `begin` works, `battleSite` new fields null with the flag off, the three Router calls answer); `battlesite`, `mapview`, `routes`, `territory`, `worldnature`; `worldgen`, `session` and `loading` with `-Gen` | W1–W8 unchanged | unchanged |
| A (1) | `worldgen` (same seed and settings give the same `sum` twice in a page, at Normal and Large; different seeds differ; the bans; time per stage reported; Normal ≤ 4 s headless); `rivers` (never uphill; each ends in water; width follows flow; deltas fan over 8–16 tiles; navigable runs unbroken except at rapids; floodplain; seasonal flags by climate: frost all but great rivers, desert wadis, swamp streams and deltas, about 30% of grassland streams, none when `seasonal` is off); D41 shares within targets; each climate ≥ 6% on 8 seeds; `mapview`, `worldnature` flag off | W1–W8 unchanged; sums INFO | unchanged |
| B (1) | `worldplace` (counts follow `holdings` in the 8/7/7/7/8 ratio; the spacing table; unique names; capitals ≥ 0.3 × the diagonal apart; every holding and camp reachable from every capital, also with every ford on a `flood` or `flash` river shut; a fair start for each race; ports on connected water; bridges over ≤ 3 tiles of water; no ford on a great river; ferries only on great rivers at towns and river ports; crossings ≤ 60 tiles apart; no road over mountains; deterministic); `resources`, `holdings`, `holdingfactory`, `factions`, `leaders`, `economy` flag off | W1–W8 unchanged (with the flag off, lords come from `FACS` as today) | unchanged |
| C (1) | `worldsave` (v3 round trip flag off and flag on; a changed `sum` refused with its message; v2 refused; gzip round trip, async; the header line; fog run lengths equal the bits); `armygroups`, `loading` (sync equals async with a generated world; monotonic; error and stall paths), `session`, `menu`, `captives`, `stay`, `mobile` | **W7 re-recorded once** (save v3); the rest unchanged | unchanged |
| C (2) | `fullmap` (opens by M and by the minimap tap; Shift+M mutes, M alone no longer does; header, `nav()` bar and Esc; fits 844 × 390; builds in ≤ 25 ms at Huge, in the report); `input`, `menu`, `mobile`, `touch` | W1–W8 unchanged | unchanged |
| D (2) | `router` (two-level paths within 5% of a full A\* on 200 random pairs at Normal and Large; cache hits; `Router.close` reroutes and opens again; with the flag off the wrapper answers as before); `routes`, `lod`, `brains`, `patrols`, `caravanparty`, `sites`, `quests`, `ships` (no ship on a river that is not navigable), each flag off and with `-Gen`; `worldchunks` (stitched equals eager at Normal, flag on), `worldnature`, `mappolish`, `visual/perf`; `visual/rivers` shown to the owner | W1–W8 unchanged (wrapper with the flag off; no river tile on today's map) | unchanged |
| E (2) | `battlesite` (flag off: every classic tile as before; flag on: width to 24 / 40 / 64 px, the bridge from crossings, ford-only and ferry fields, delta marsh, high kind to layout); `steephills` (a steep climb slower and more tiring than a rise; no uphill charge momentum; the downhill charge bonus; routes take a shoulder or ramp; the AI holds the crest; the same tile gives the same field); `groundhash`, `fieldvariety`, `terrain`, `roads`, `routing`, `aiterrain`, `battletypes`, `concealment`, `battlesetup`; `visual/terrainbalance`'s steep row reported | W1–W8 unchanged | **unchanged** (terrain off); `groundhash` 24 fields unchanged |
| A (3) | `classicseed`'s terrain hints (with B's suite), `worldgen`, `rivers`; generation rows of `visual/worldscale` near §3.7's targets | W1–W8 unchanged | unchanged |
| B (3) | `classicseed` (37 holdings in `TOWNS` order with their data; within 4 tiles of the anchors; every §8.15 hint); `worldplace`; `routes` and `ships` with `-Gen` | W1–W8 unchanged | unchanged |
| E (3) | `worldsanity`; the whole `-Gen` sweep with no failure but those the coordinator accepts; `visual/worldsanity`, `visual/worldscale`, `visual/btypebalance`, `visual/loadtimes` reported; `worldprint` with `-Gen` | W1–W8 unchanged; **G1–G8 and the sums recorded** | unchanged |
| E (4) | The full sweep, flag on by default; `worldprint` | **W1–W8 re-recorded** (= G1–G8); as built: the default world checks G1–G8 (`GEXPECT`), `-Classic` W1–W8 (`EXPECT`) | unchanged |

#### 15.2.4 Risks and open questions

**The owner's answers (2026-10-18; D42–D45):**
1. **`WORLD.gen` ships on at the end of Phase 2:** yes, in wave 4, once you have played Classic and a few random seeds with `?gen=1`. Today's 224 × 160 map stays behind `?gen=0` until Phase 3 lands, then `genClassic` and Phase 0's router wrapper are deleted. (Built 2026-10-22: on by default; deleted the same day on the owner's confirmation, D49.)
2. **Save v3 in wave 1, with the flag off too:** yes. Current saves stop loading at C's merge, with "start a new game" (no migration, D7). One save format, one W7 re-record.
3. **Huge in Phase 2, on every device, phones included.** The targets are §3.7's: 12 s to generate on a desktop, 65 MB at peak, ≤ 2 ms a router query, measured in a report, not a failing test. On a phone Huge is offered with a note ("slow to forge on this device, about 30 s"), and the custom-size cap is Huge everywhere. Phones must not crash: the phone LRU (20 chunks), gzip saves and the sliced generator keep the peak near 65 MB; C's report includes a throttled mobile run. Densities stay today's until Phase 6, so a Huge world is labelled "sparse until later".
4. **The full map's key is M.** Mute moves to Shift+M (and the HUD's sound button). C owns the change, its help text and its tests.

**Risks:**
- **Page open with the flag on.** The classic world is generated at load (about 2 s on a desktop). C forges it behind the overlay. Tests and the wiki stay synchronous, so every suite run with `-Gen` takes about 2 s longer.
- **The same world in every browser.** The sums are recorded in headless Chrome only. Before the flip, the owner opens the classic seed in one other browser and compares `WM.sum` in the console.
- **The classic hints may fight the land** (Willowmere's island, Stonebridge's great river). B and A move a hint, never a holding's data or its `TOWNS` order.
- **Steep hills move battle balance** on world fields with terrain on. The fingerprints never see it; E reports it from the lab, as the rises were measured.

---

## 16. Owner decisions

**All 39 decisions were approved by the owner on 2026-10-18, as recommended**; D40 was decided by the owner the same day. Each row gives the decision and what was decided.

| # | Decision | Decided (as recommended, 2026-10-18) |
|---|---|---|
| D1 | Continent or archipelago? (changed by the owner, 2026-10-22; was: one continent) | **A Land setting:** Continent, **Coasts** (default), More sea, Lakes, **Continents** (2–3 landmasses) and **Archipelago** (many big islands). Peoples settle where the land suits them, so a continent may hold several realms, and a realm may hold land on two through its ports (doc/CONTINENTS_DESIGN.md). |
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
| D24 | Huge on phones? | ~~Hidden on phones~~ **Replaced by D44 (2026-10-18): offered on phones too**, with a slow-on-this-device note (coarse pointer and a short screen side under 900 px). |
| D25 | Slower travel before the new world? | **Yes: in Phase 1, on today's map**, together with the smaller figures, so the pace can be judged early. |
| D26 | Which world settings? | **The focused list of §4.1:** size, seed, realm holdings, hamlets, sacred places, wild land, land and water, rivers, mountains, climate, seasonal rivers, monsters, bandits, economy, **founding sites and start** (§7). **Realms stay 5** (written content, not a setting). No settings for start city (character creation), the starting war or season length. |
| D27 | The two themed presets? | **Wild Frontier:** Large; 0.7× holdings; few hamlets; common sacred places; vast wild; wet, rugged and cold; deadly monsters; many bandits; rich. **Crowded Realms:** Normal; 1.5× holdings; many hamlets; few wild regions; calm monsters. |
| D28 | The preview? | **A quick sketch (≤ 150 ms)**: the real noise fields sampled coarsely, with rivers and holdings approximate. It redraws on every change. An optional **Full preview** runs the real generator, and Start reuses it. |
| D29 | Custom size? | **Yes, within limits**: width 320–1024 and height 224–768 in steps of 32, width ÷ height 1.2–1.6, at most Huge on every device (D44 replaces the phone cap of Large). |
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
| D42 | `WORLD.gen` at the end of Phase 2? (decided by the owner, 2026-10-18) | **On by default** since wave 4 (built 2026-10-22); since D49 (the same day) the flag is gone and the generated world is the only one. |
| D43 | Save v3 timing? (decided by the owner, 2026-10-18) | **Early, in wave 1**, flag off too; old saves stop loading (no migration, D7). |
| D44 | Huge in Phase 2? (decided by the owner, 2026-10-18; the cap replaced 2026-10-22) | **Offered on every device, phones included**, with a slow-on-this-device note on phones. **2026-10-22:** two more sizes, **Vast** (1536 × 1152) and **Immense** (2048 × 1536), on every device, phones included; at most 3,145,728 tiles (doc/CONTINENTS_DESIGN.md §4). |
| D45 | The full map's key? (decided by the owner, 2026-10-18) | **M** opens the full map (and a tap on the minimap); **mute moves to Shift+M**. |
| D46 | Crossing the sea? (decided by the owner, 2026-10-22) | **Passage at ports:** pay by distance and band size; the voyage takes days; your band comes ashore at the other port; a small chance of storms or pirates. Lords' armies and caravans use the same sea lanes. Owning ships later, as a hook. |
| D47 | Realms across continents? (decided by the owner, 2026-10-22) | **Mixed by suitability:** a realm may hold land on two continents through its ports; wars cross the sea. |
| D48 | More peoples and realms? (the owner, 2026-10-22) | **Later.** Everything stays open to any number of peoples and realms. |
| D49 | Today's hand-made map? (the owner, 2026-10-22) | **Deleted** (the owner confirmed it the same day: "stop using old map, delete old map completely so we don't have to waste resource on that"; built by agent RM, §15.2 "RM, as built"): `genClassic`, `classicWorld`, `CLASSIC_CAMPS`, `WORLD.gen`, `?gen=0`, the runner's `-Classic`, Phase 0's router wrapper and today's map's fingerprints are gone; a save of it is refused as another world version. |

**World-map label clarity (2026-10-24, built):** army counts, holding names and nearby building labels are queued as before, but `drawWorld` flushes them through `mapTxt` (`gfx/sprites.js`). Semibold Arial matches the interface. The glyph and dark outline are rasterized at their final device size and copied 1:1, with integer device-pixel anchors derived from the current camera transform; no 8px bitmap is enlarged. Labels keep their world-size scale with an 11 CSS-pixel floor for phones. Shared label caching stays bounded and varies by size, color and alignment. Colors, fog/visibility rules, label positions, pixel-art scaling and simulation are unchanged. Battle/street canvas text retains its existing path. Tests cover fractional camera positions, whole and fractional DPR, zoom/cache changes, outline/glyph bounds and a real map frame; screenshots compare old/new holding, building and army labels on desktop, landscape and high-DPI portrait phones.

**World-map combat (2026-10-24, first playable version):** Road fights now use a fixed circle enclosing the two initial army formation radii, on the actual world map artwork and sampled terrain. The hero anchors travel; Army → March formation saves group offsets and keeps the interaction band clear. Nearby eligible armies approach and join with source identities preserved. Routing soldiers can leave, regroup and return; explicit withdrawal stays withdrawn. The campaign clock remains paused during tactical combat. Tournaments and settlement assaults retain their existing setup. Full rules, tuning, file ownership and remaining simulation work: [WORLD_BATTLE_DESIGN.md](WORLD_BATTLE_DESIGN.md).
