# One scale, a living world: design proposal

**Status (2026-11-15): decided (§11); phase 0, the lab, built: `engine/worldlab.html` (open it from disk). Nothing in the game changed yet.**

The owner, 2026-11-15:
- "Add beach area and hill (like in the battle map) and others you can suggest. I want to transition all those features in the battle map to actual world as much as possible."
- "The mountain right now it seems we cannot walk in the rocky or mountain area, I want to have a new world scale so that it actually a living world, not a overworld concept. Like you can climb a mountains, and clearly see the different layers or slope."
- "Use one true pixel scale, not character 20% and world 100%."
- "The road, the trees or the bridge may actually expand like in the battle map, but should not be too big, and relatable to the building sprites, which are fine for now."
- "We should think about the optimization as well. Or do you suggest to move to Godot?"

---

## 1. Today, measured (seed 1, 1280×720 window)

| What | Today |
|---|---|
| The world | 448×320 tiles of 16 px = 7168×5120 px. One tile stands for 250 m (100 tiles a day's march). |
| Tile kinds | 7: open, forest, hill, water, road, mountain, ford (`world/map.js`). Water 29% of tiles, hills 11%, mountains 2%. |
| Mountains and water | Not walkable at all (`passable`, `SPEEDMUL` 0). Hills are walkable at ×0.75. |
| Height | Already stored: `WM.elev` 0-255 a tile (sea 64), `terrace` 0-3, `rough`. It colours the ground; nothing stands on it. |
| A soldier | His sprite is 17 px tall. On the map he is drawn at ×0.5 (`WORLD_BATTLE.sprite/scale` = 3/6): **8.5 px**. In the battle screen he is drawn ×1. |
| A house | A 2-tile lot, 32 px: about 4 men tall at today's map size. The owner is happy with this ratio. |
| Building models | `engine/model.js` draws each model from its geometry into a cell of `cell` px. A bigger cell gives more real detail, not bigger pixels. |
| Distances | Neighbouring holdings: median 487 px apart (min 292, max 830). Walking: about **14 seconds**. |
| Speeds | On foot: 34 px a second on the map. In battle: 38 battle px a second. A world battle maps 1 world px to 6 battle px (`WORLD_BATTLE.scale`), so the same man walks about 5 times slower in a fight than when travelling. |
| The day | 180 real seconds (`DAY_SECONDS`). |
| Painting | The map is painted in 512 px chunks, kept in an LRU near you and painted a few ms a frame (`gfx/worldart.js` `WorldArt`). |
| The battle map | Terraces (levels 0-2) with slope cells, cliffs (sheer and one-way) with ramps, rock outcrops, scree, woods as ground patches (slow, hide, break formations), marsh, deep water with fords and bridges, dunes, scattered trees that block (`battle/terrain.js`, `doc/TERRAIN_DESIGN.md`). A world battle builds its field from the world under it (World Phase 2b). |

**So today there are three scales:** the world's pixel, the figure's pixel (half a world pixel) and the battle's pixel (a sixth of a world pixel). That's why the map reads as an overworld: a man is half a tile, a tile is 250 m, and a town is a 14-second walk away.

---

## 2. The proposal in one paragraph

One pixel scale for everything: **1 world px = 1 figure px = 1 battle px**. The figures are drawn at their own size (17 px). The world art and the buildings are drawn at twice today's detail, so the house-to-man ratio the owner likes stays the same. The world becomes a height field you can walk on: levels you can see, slopes you climb, cliffs you go around, passes over mountains. The battle map's ground features become the world's ground. Battles are then fought on the world itself, with no separate field. The world's size (how far apart towns are) is a separate choice (§4).

---

## 3. One pixel scale

| | Today | Proposed |
|---|---|---|
| A man | 8.5 px (his 17 px sprite ×0.5) | **17 px**, his sprite ×1, the same as the battle screen |
| A tile | 16 px, 250 m | 16 px stays the **ground cell** (the battle's cell is 16 px too), but a cell is now about 2 m: a man is about one cell tall |
| A house | 32 px | **64 px**, drawn by the model at a 2× cell: twice the detail, the same size next to a man |
| Roads | about 1 tile | 2-3 cells (32-48 px): a cart and two men side by side, as in the battle map |
| Trees | canopy blobs inside forest tiles | single trees about 2-3 men tall, as the battle's; woods are patches of them |
| Bridges and ferries | 1-2 tiles | to the road's width, length set by the river |
| On screen (1280×720) | 640×360 world px: about 40 men tall | the same 640×360 px, now about 20 men tall. Closer and more personal. Zoom out stays for travel. |

**Painting cost per screen does not change.** The screen still shows 640×360 px; each of them is just more detailed. What costs more is world *extent* (§4, §8).

**Speeds become one.** A man walks about 35 px a second everywhere: travelling, in a camp or in a fight. `WORLD_BATTLE.scale` and `sprite` go to 1, and every px-tuned number (sight radii, arrival radii, AI distances, `WORLD_SCALE`) is re-measured once.

---

## 4. How big the world is (the owner's choice)

The pixel scale fixes how things look. The extent fixes how far apart they are. With one pixel scale and today's map stretched to match, towns would be twice as far apart in px. The rest is the choice:

| Size | World px | Ground cells (16 px) | Neighbouring holdings | Crossing the map on foot |
|---|---|---|---|---|
| **S**: today's map at the new scale | 14k × 10k | 0.9k × 0.6k | about 30 s walk | about 7 min |
| **M**: twice that | 29k × 20k | 1.8k × 1.3k | about 1 min | about 14 min |
| **L**: three times | 43k × 31k | 2.7k × 1.9k | about 1.5 min | about 20 min |

**Recommendation: M.** A village a minute's walk away feels like a place, and the land between holds the camps, ruins, caves, hunters and wildlife already built. M needs more content between holdings (more hamlets, sites and dens) or it will feel empty. The day (180 s) may need to be longer, so a day's march still means something. Suggestion: 6-8 minutes.

---

## 5. A world with height

**Levels.** Height comes from `WM.elev`, cut into levels: `level = (elev − 64) / 16`, about 0-12. A level is drawn **8 px** higher on the screen (half a man). A 12-level peak rises about 96 px.

**How it looks** (the battle's terrace look, built out to many levels):
- Each level's ground is drawn raised by its height.
- Where a level drops to a lower one, its south face shows: a grassy bank for a slope, a rock face for a cliff, loose scree below a steep one. The contour line is lit on top and dark at the foot, as in the battle map.
- Things behind a ridge are hidden by its faces. The faces are y-sorted pieces, as the battle's cliff faces already are (`ground.props`).
- Snow lies above a snow line (by level and climate). Mist sits in valleys at dawn.

**Walking.**

| Ground | Who passes | Speed (battle's `HILL` and `TERRAIN_GROUND` values, as built) |
|---|---|---|
| Flat, a level | everyone | ×1 |
| Slope (one level over a cell or two) | everyone | uphill ×0.5 on foot, ×0.4 riders, carts and big ones; downhill ×1.15. Stamina drains ×1.5 going up. |
| Steep slope, scree | on foot only | ×0.3, with a chance to slip (a stagger) |
| Cliff (two or more levels at once) | no one, except by a ramp, path or ladder | blocks, as the battle's wall bits (`route.js`) |
| Pass (a road over a mountain) | everyone | the road's speed, with switchbacks laid by the generator |
| Peaks above the snow line | on foot, slowly | ×0.4, cold, and no camp |

Later, possibly: the hero climbs a short cliff with a skill (Athletics) or a rope, slowly and at a stamina cost.

**What height gives you.**
- **Sight:** you see farther from high ground (sight radius + a share a level). Woods hide you unless the watcher is higher, as the battle's `SIGHT`.
- **Battle:** the battle's rules as they are: range by level, +10% melee downhill, charge bonus by Δlevel.
- **Routes:** armies keep to passes and roads; a band on foot may take a goat path a lord's army can't.

---

## 6. The battle map's ground, brought to the world, and new ground

**From the battle map:** terraces and slopes, cliffs with ramps, rock outcrops, scree, woods as patches of single trees (slow, hiding, no formations), marsh patches, deep water with fords and bridges, dunes, and scattered trees and rocks that block.

**New ground (suggestions):**

| Ground | Where | What it does |
|---|---|---|
| **Beaches** | along the sea and big lakes | A sand band (2-6 cells) with dunes and marram grass behind, foam at the tide line, driftwood and shells, beached fishing boats near villages. Sand: ×0.85. |
| **Sea cliffs and coves** | where high land meets the sea | Rock faces down to the water, with a cove or stair down here and there |
| **River banks** | every river | Reeds, sandbars, a muddy bank; the ford a shallow, wider stretch |
| **Waterfalls and rapids** | where a river drops a level or more | A white fall over the face; rapids can't be forded |
| **Ravines** | where a river cuts a hill | A narrow cut with cliffs on both sides: a chokepoint, an ambush spot |
| **Lakes** | basins | Shallows (wadeable at ×0.35, as the battle's water), reeds, an island now and then |
| **Meadows** | open grass | Flower patches and tall grass; cosmetic, and hare and deer graze there |
| **Boulder fields** | below cliffs and at a mountain's foot | Single rocks that block, as the battle's `B.obs` |
| **Clearings and fallen logs** | in woods | Open spots for camps and hunters; a log blocks riders |
| **Snowfields and glaciers** | high frost | Very slow, cold; crevasses (a short cliff) |
| **Cave mouths** | in cliff faces | Doors into the cave interiors already built |
| **Lookout rocks** | hilltops | Stand on one to see far; good for outposts |

---

## 7. Battles on the world itself

With one scale, a battle's field **is** the world around the fight, at 1:1. `BattleTerrain` reads the world's ground cells (levels, slopes, cliffs, woods, water) instead of planning a field of its own. A fight in a ravine is in that ravine. The routing grid (`route.js`) runs on the same cells. The world keeps running around it, as open fights already do. Sieges are fought at the real walls.

---

## 8. How it's built, and what keeps it fast

**Two grids.**
- **Macro:** today's generator grid (448×320, or bigger for M or L), kept as it is: regions, elevation, rivers, roads, holdings, realms. The simulation, far parties, the economy and the full map use only this. It is small, saved, and the same as today.
- **Ground:** 16 px cells, made **on demand, chunk by chunk**, from the macro grid and the seed: level, slope or cliff, ground kind, woods, rocks. The same way a world battle's field is made from the world today, but for every chunk near you. Never saved. Only a few chunks are alive at once.

**Painting.**
- Chunks are painted as today (LRU, a few ms a frame), now with the raised levels and their faces. The pixels painted per screen stay the same (§3).
- Chunk canvases are about 4 MB each at 1024 px; 12-16 kept is 50-60 MB.

**Moving and routing.**
- **Near:** cell A*, as the battle's `route.js`, inside the live chunks.
- **Far:** a graph over the macro grid (roads, passes, fords, bridges, ferries).
- Parties far from you travel on the macro graph only (`FAR_PARTIES_DESIGN.md`). They get real ground when they come into the live chunks.

**Figures.** As many as today near you. Far ones are only data.

**Saves.** The macro world plus what changed. The ground cells are remade from the seed.

**Budget to hold:**
- 60 fps on a mid laptop.
- A chunk painted in 8 ms or less, spread over frames.
- A new world made in 10 s or less (M).

The lab in phase 0 measures these before anything else is built.

---

## 9. Godot?

**Recommendation: stay in JS/canvas for now.**

**Why not now:**
- The game is over 330 JS files, with 475 test suites and fingerprints.
- The art is drawn by our own code: figures, faces, buildings, ground and nature are all procedural canvas code.
- Moving would mean rewriting all of it in GDScript or C#, plus the test harness: many months with no new game.

**What Godot would give:**
- Tile maps and autotiling.
- GPU drawing and lights.
- Navigation and physics.
- An editor.
- Native builds for desktop and mobile.

**How we get those here instead:**
- **Drawing on the GPU:** move the drawing to WebGL (a small sprite batcher, or PixiJS), only if the lab shows Canvas2D can't hold 60 fps. The painting code stays; its canvases become textures.
- **Routing:** we already have our own (`route.js`, `router.js`).
- **Native builds:** wrap the game (Electron or Tauri for desktop, Capacitor for phones).

**When Godot would make sense:**
- A console release.
- Real-time lights and shaders as a core look.
- A team that wants an editor-driven workflow.

That is a separate decision, best made after this world exists.

---

## 10. Phases

| Phase | What | Notes |
|---|---|---|
| **0. The lab** | A test page: one 2000×1200 px stretch at the new scale, with levels and faces, a slope, a cliff with a ramp, a beach, woods, a road over a pass, the hero walking and climbing, fps and paint times shown. | The owner judges the look and the numbers (level height, road width, tree size) before the game changes. |
| **1. One pixel scale** | Figures ×1, world art and building models at 2× detail, one speed, `WORLD_BATTLE.scale`/`sprite` 1, every px number re-measured. The world's size stays S. | Every fingerprint is re-recorded once, with this reason. |
| **2. Height** | Levels drawn raised with faces; slopes, cliffs, ramps, passes; walkable mountains; picking a raised point; sight from high ground. | The generator lays passes and switchbacks. |
| **3. Ground** | The battle's features on the world (§6), then the new ones: beaches first, then rivers' banks, waterfalls, ravines, meadows, boulders, snowfields, caves. | |
| **4. Size** | The macro/ground split (§8), the world to M, more hamlets, sites and dens between holdings, the day longer. | |
| **5. Battles on the world** | `BattleTerrain` reads the world's cells; no field of its own. | |

**Phase 1 as it is built (the owner, 2026-11-15: "apply this to the game", phase by phase):**
- **The simulation keeps its units.** A game px stays what it is today (a tile 16 px, every speed, radius and distance as tuned). The world is instead *drawn* at a finer resolution: `WORLD_VIEW.fine` screen-art px a game px (2). So a soldier (his 17 px sprite at ×0.5 a game px) shows at his own 17 px, a house's lot (32 game px) at 64 px, a tile at 32. Those are §3's numbers, without re-tuning some 900 uses of `TILE` and every px number in the data. The generator, the save and the parties' paths do not change, so W1-W4, W7 and W8 hold.
- **Steps**, each shipped, tested and shown before the next:
  1. **The fine scene:** the world's scene (ground, what lies flat, buildings, the remembered scene under the fog, what stands in front of a figure) is drawn at `fine` px a game px wherever the screen has that many (`min(fine, VS)`). Building models twice as fine. The camera starts twice as close (a view of about 20 men tall); zooming out stays for travel.
     - **Built (1a, 2026-11-15):** the scene canvas at `WORLD_VIEW.fine` (`render.js` `sceneRes`, `memCv`); the fog's remembered scene (`fog.js` `fogMem`), the depth overdraw (`depth.js` `overdrawBox`, through `WDEPTH.fcv`) and a ship's underside (`ships.js` `shipUnder`) read it at its resolution. `fine` stays 1 until there is art made for it: at 1 every suite gives what it gave before (worldprint, worlddepth, worldchunks, render); at 2 the game draws as before (today's art is in game px).
     - **Found:** a model's `cell` is only its canvas: a bigger cell gives the same building in more room, not more detail (the fit only shrinks a plan).
     - **Built (1b, 2026-11-15; the owner: "continue with the buildings"):** `detail` on `PX.buildingModel`, `clusterModel` and `centreModel` (`model.js`: the fit found at the plan's own cell, then the plan drawn at the fit's scale times `detail` on a cell that many times its px; decals' pixel art enlarged). The game makes each lot's and each site's (camps, ruins, caves, shrines, lairs) fine picture ahead, a few ms a frame with the lots, and draws it in the scene once made. A model at detail 2 takes 16-84 ms to make (so never mid-frame). `fine` is now 2; a desktop's map starts twice as close (`WORLD_VIEW.start`); a phone's starts close as before.
     - **Cost:** the world's frame about 2 ms more on a desktop (11.3 to 13.4 ms, 1280x720 at 2x), under half a ms on a phone-sized screen.
     - **Still coarse:** the ground and its painted woods and hills (steps 2 and 3), outposts' towers, encounter sites, town walls, the mills' sails; the doors' and windows' pixel art is enlarged, not redrawn finer.
  2. **The fine ground:** the chunks are painted at `fine` px a game px by the lab's ground painter, driven by the world's tiles and climates (flat for now): the lab's climate grounds, blends, roads, shores and water.
     - **Built (2a, 2026-11-15; the owner: "Go"):** not the lab's painter itself yet but the game's own ground made finer, so its colours, climates' blends, shores, fords and water depths stay what they are. A chunk is painted as ever; then (`worldart.js` `fineChunk`, the ground alone kept from `artGenGround`) every px that is still the ground's own (not a road, yard, trampled patch, the painted woods and hills, a pass over it) gets `fine` x `fine` px: its colour smoothed among the like px round it (never across a shore or an edge, `FINE_GROUND.like`), taken between them at each fine px, and a grain of its own at the fine px: the land's, the grass's blades, the desert's ripples, the frost's glitter, the swamp's wet, the water's shimmer (`FINE_GROUND`). What lies over the ground stays its game px, 2 x 2, until steps 2b and 3.
     - **Cost:** a chunk about 13% more to paint (median 363 to 410 ms, in slices as ever); the LRU keeps half as many fine chunks (`WorldArt.capNow`: 16 on a desktop, 10 on a phone; a fine chunk is 4 MB).
     - **Next (2b):** the roads (the lab's worn tracks, crown and verges) and the shores (the lab's beach, wet sand, foam line) at the fine px; then step 3, the nature.
     - **Replaced (2026-11-15; the owner: "go with all ... adding height, sea level that labs can do, and migrate them into the world generator", the tests run once at the end):** steps 2, 3 and phase 2's look built together:
       - **The lab's ground** (`gfx/worldterrain.js` `terrainChunk`, `WORLD_TERRAIN`): a chunk painted fine is the lab's grounds by the world's tiles and climates (blended across a climate's edge by the tiles round each px): grass, meadow, woods floor, the shore's wet sand, beach and dunes, a river's muddy bank, scree, rock and snow up the heights; each climate's grain (ripples, cracked clay, snow in patches, the bog's shine). The sea by its depth under the sea's level (the plan's tile depth, shallower toward the shore), its bed showing in the shallows; a river's murkier, its pebbles; the frost's shallow sea frozen. What the game paints over the ground (roads, yards, fords, trampled patches, bridges) is kept, its px 2 x 2.
       - **Height, as the lab draws it, in place:** the world stays where the map says (nothing is lifted, so every building, figure, click and fog stays as it was); each px shows its own place's ground; the land's levels (below) are stepped where it is steep (`WORLD_TERRAIN.steps`), and where a step drops half a level or more, its face (earth, or rock with a ledge every level; a fall where water steps; snow on a lip above the snow line) hangs over the strip south of the edge, `lh` fine px a level. Gentle ground is shaded by its slope. Never stepped near a road, a lot or a ford. Mountains stay unwalkable as before (now terraced massifs with cliffs and snow); hills walkable (slopes, with a terrace where steep).
       - **The relief in the world generator** (`worldgen.js` `reliefOf`, `GEN_RELIEF`, the stage 'relief' before 'graph'): each tile's level: the sea 0, land per 11 of elevation over the sea's 64, a mountain 3 levels more and roughened by its ridges (a hash of the seed, no Math.random), roads and fords smoothed into their land. Kept as the map's `lv`; a map without it (a saved one) has it made when first painted.
       - **The lab's nature** (`engine/worldflora.js`, shared by the lab and the game: its trees, boulders, stones, logs, stumps, bushes, ferns, mushrooms, flowers, cattails, agaves, bones, the grass's atlas; keyed by the climate's look): placed on the chunk when it is painted (`terrainProps`, `WORLD_FLORA`): trees in the woods by where they stand (lowland, waterside, hills, mountain, a village's) and climate, bushes, logs, stumps, ferns and mushrooms under them, a few on open ground, boulders and stones up the mountains, cattails on the banks; none on water, a road, a lot, a ford, the game's painting or a face. They stand in the scene among the buildings by their feet (remembered under the fog), each that stands covering a man behind it (the depth overdraw). The old 16 px trees and painted hills are left out of a fine chunk.
       - **The lab's grass** (`terrainEnts`, `TGRASS`): every clump in view swaying with the wind and bent away from you as you pass, written into one buffer at the scene's resolution each frame.
       - **Cost:** a chunk paints as fast as before (median 430 ms, the old nature no longer painted); the world's frame about 17 ms against 10 (desktop, 2x, software canvas here), most of it the grass and the nature.
       - **The lab's grass rules (2026-11-16):** no clump just south of a prop's foot (a strip as deep as a clump is tall, as wide as the prop's lowest rows and 4 px more: trodden bare, `terrainProps` `BARE`); none whose foot a ridge hides (`vis`); a man stands in it: the clumps just south of his feet, within a clump's height, drawn again over him as they lean that frame (`grassOver`, from `drawMarcherAt`; not in water).
       - **The swamp's pools (2026-11-16):** lily pads on them, reeds round their edges (`WORLD_FLORA.chance.swamp.pool`: lily, reeds); nothing else stands or grows on them.
       - **Footprints, the lab's (2026-11-16):** every man walking leaves a print every 2 px, left and right of his way, on snow, sand, the marsh and wet ground by the water, fading over 18 s (`WORLD_TERRAIN.prints`; `worldterrain.js` `stepPrint`, `printGround`, `FOOTPRINTS`; drawn under the grass). The bands' trails (tracks) stay the game's own, and so do snowfall and mist (weather).
     - **The world made from its height (2026-11-15; the owner: "make the world generation based on the new concept"):**
       - **One height field first** (`worldgen.js` `reliefLevels`, `GEN_RELIEF`): right after the mountains (the new stage 'heights', "Cliffs and passes"), every tile's level: the sea 0, land per 11 of elevation over the sea's 64, smoothed once among its neighbours, high ground (from 6 levels) roughened by a smooth ridge noise on the seed.
       - **Its slopes** (`reliefClass`, the map's `slope`): each tile by its steepest drop to a neighbour: flat (84% of the land on seed 1), a slope (0.45 levels or more: 11%), steep (0.9: 3%), a cliff (1.3: 2%; only in runs, a lone one steep).
       - **The land follows it** (`genReliefKinds`): a cliff is bare rock no one walks (the old mountain kind, `T_MOUNT`); a mountain's tile that is no cliff is high ground anyone climbs (`T_HILL`). So the ranges are no longer walls: they are crossed wherever no band of cliffs runs (their passes), and cliffs stand on every steep flank, hills and coasts too. Every stage after (rivers, forests, holdings, hamlets, roads, camps, glades, the ways) builds on this land.
       - **Walking** (`map.js` `SLOPE`, `slopeMulAt`): flat ×1, a slope ×0.8, steep ×0.55, the cold heights (from 14 levels) ×0.6 more; times the ground's and climate's as before (floor ×0.25). The routes (`router.js` `findPath`, the way graph) cost the same; the generator's roads pay ×1.4, ×2.8, ×4 by slope, so they keep to the gentle ground and the passes.
       - **Sight:** 3% farther a level up (at most half again: `visMulAt`).
       - **Drawn:** the rock and snow lines and the mountains' trees by height (`WORLD_TERRAIN.rock` 11, `snow` 14); cliffs as faces (the painter steps the steep ground).
       - **Changed for the retest:** W1 (the tiles: mountains now cliffs and high ground), and everything that follows from the land (W2-W8, holdings, roads, sites, paths).
     - **One height field, checked (2026-11-15; the owner: "make sure all rivers and hills, steep hills and height map, sea levels are actually correctly generated ... feel free to change the path finding"):**
       - **The audit before** (seed 1): rivers rose downstream in 48 places (up to 1.5 levels: their fords and bridges smoothed into the land), 38 river tiles stood over their banks, 6 lake tiles over their shores, 7% of the brooks' steps ran uphill (they followed the rivers' meander surface, not the land), the slopes and the hills and cliffs were decided before the rivers cut the land (1,331 tiles stale), 28% of the hills were flat, and the great valley lay dead flat at the sea's level.
       - **Baked once** (`genReliefKinds`): the levels (smoothed, the heights roughened) are written into the elevation itself right after the mountains, so the climates, the rivers, the lakes and the painter read the same land; the low ground has a floor (`genFloor`, `GEN_FLOOR`: what a valley's tilt pushed under the sea's level eased just over it, its rolls kept).
       - **After the water** (the new stage 'valleys', `genValleys`): every river's and lake's banks raised to `GEN_RELIEF.bank` over its water; every brook floored at the water it runs into and its bed cut down from its head, never rising; then the slopes and the land's kinds made again from the land as it lies: a cliff is rock (`T_MOUNT`, never on a brook's way), steep ground and slopes from `hill[0]` levels up are hills, flat ground from `hill[1]` levels (a highland) a hill, the rest open (woods stay woods); each hill's make (rise, steep, cliffed, scree) from it.
       - **The levels as they are** (`levelsOf`): `reliefOf` no longer smooths or roughens; it only eases a road into the land, never a river's ford or bridge, and never under the water beside it.
       - **The audit after** (seed 1): no river rises downstream, 1 river tile over a bank (a road beside it), no lake over its shore, 14 of 2,287 brook steps rising (into roads), no stale slope, hills 11% flat (highlands); the sea 0, the coast 0-1 levels, the peaks to 16.
       - **The ways climb** (`map.js` `CLIMB`, `climbCost`): a step costs, over its ground's, 1.1 tiles of open ground a level up and 0.3 a level down (a road a third of that): in `findPath`, the way graph's road, portal and chunk costs (`router.js` `buildWayGraph`, `wayLocal`, `wayCost`). Ways go round a hill, along a valley and over a range by its pass.
     - **Water as the lab has it: wading and swimming (2026-11-15; the owner: "Use the same concept in the lab. Use that as a baseline, we can swim as well right?"):** the lab's numbers (`LAB.depth`) as the world's (`map.js` `WATER`):
       - **Depth** (`waterDepths`, `waterBand`): a river as deep as it is wide (one tile 0.5 levels: waist-deep; two and three tiles 1 and 1.5: swum); the sea and a lake by how far out (1, 2, 3 tiles from land: knee, waist, swum); farther than 3 tiles from any land, open water no one swims (a ship or a ferry crosses it). Bands as the lab's: ankle under 0.12 levels, knee 0.35, waist 0.8, deeper swum.
       - **Moving** (`speedAt`): ×0.85 ankle, ×0.6 knee, ×0.35 waist, ×0.3 swimming (times the weather's). Every walker may be in it (`walkTile`, `walkAt`): the tile searches, the way graph's chunks and portals, the land's pieces (`landPieces`: a river no longer parts the land; 13 pieces left on seed 1, the far islands), the march ground (`march.js`: men stand and route in it, a cell's cost by its depth).
       - **The way's price** (`WATER.cost`, `wayStepAt`): a tile of knee-deep water 1.8 tiles of open ground, waist-deep 3.5, swum 9 (the lab's `swimCost`): a band wades a ford or a narrow river where it is near, goes round to a bridge where it is not, and swims only when the way round is long. A straight line or a straightened way never runs over water (`wayClear`; `clearLine` keeps to dry land).
       - **Tiring:** your band's stamina drains ×1.4 wading waist-deep and ×3 swimming (`supply.js` `staminaRate`).
       - **Drawn:** a man in water is under it from his feet up by its band (`WATER.cut`: 1, 4, 8, 12 figure px), a ripple at its line (`march.js` `drawMarcherAt`).
       - **Drawn as water wraps a man (2026-11-16; the owner: "I can see bandit dug under the land", "the water that wrap around unit looks too flat and not realistic"):**
         - A man is cut only where water is drawn under his feet (`worldterrain.js` `drawnWet`, from each chunk's `rec.wet`: 1 the sea's or a lake's, 2 a river's, 3 a fall's; `drawnWater`), never on a tile counted as water whose bank is painted as land (a wide river's smooth bank).
         - What is under the water shows faint and wavering (`WATER.draw.under`); a darker band of water about him (`shade`); a broken line of foam at the waterline that moves; a ripple ring spreading out from him, faster when he walks (`ripple`, `rippleMove`, `spread`; `march.js` `drawWading`).
         - **As deep as where he stands, the lab's** (2026-11-16): a man sinks by his tile's depth eased in from the drawn bank over `WATER.draw.ramp` (8) px (`worldterrain.js` `drawnDepth`, each chunk's distance to its drawn land `rec.shd`; `map.js` `depthBand`): ankle-deep at the water's edge, knee and waist deep further out, not his tile's whole depth at once. Only the drawing; the walk keeps its tile's band.
         - All of it only over the screen's px where water is drawn (the owner: "the water circle is draw over the land"): the ground each px shows read through the land's lift (`liftGround`), then whether water is drawn there (`drawnWet`); the ring and foam stop at the bank.
       - **The lab's swimmers:** a band where half its men or more are in heavy armour cannot swim, nor one with no stamina left (`map.js` `heroSwims`).
       - **Carts never swim (2026-11-16):** a caravan's ways shut deep water to it and its steps never go into it (`brains.js` `CaravanBrain#think`: `WAY_NOSWIM` while it thinks; `world.js` `walk`).
       - **The desert's heat (2026-11-16, the lab's `sta.heat`):** your band tires × `SUPPLY.heat` (1.25) on the move in the desert by day, but in water or by it (an oasis's green).
       - **The lab's ground speeds (2026-11-16):** open 1, woods 0.85, a hill's ground 1 (its slope slows it), a road 1.1 (was 1.3; a track 1.05), a ford knee-deep 0.6 (`SPEEDMUL`, `ROAD_BAND.speed`); by the climate frost 0.85, desert 0.88, swamp 0.75 (`CLIMMUL`; were 0.7, 0.85, 0.5). The router's road speed reads `ROAD_BAND.speed`. Moves the fingerprints. **Not yet:** the lab's walk class is per px; the map's is per tile.
     - **The lab version, all of it (2026-11-15; the owner: "use the LAB version including the drawing and sprite, units and all scales. USE THAT VERSION. Remove all old concepts that reduce the map scale"; the seven steps agreed):**
       1. **Scale:** the map at the lab's own (`WORLD_VIEW.zoom` 2 CSS px a fine px, `phoneZoom` 1.5 on a window narrower than `phone` 700; `core.js` `fitScreen`), never farther out, closer at most `in` times; the scene always at `fine` px. The old painter is gone: `worldart.js` `paintSteps` paints every chunk with the lab's (`terrainChunk`), at any resolution, the game-px picture taken from it; the old road band (`artGenRoads`), bridge and ford art (`BRIDGE_ART`, `artGenXing`'s), bank reeds and rapids are deleted (a ferry and the ore stay).
       2. **Height drawn as the lab draws it:** each fine px's top lifted up the screen by its height (`LF`: its stepped level times `lh`), column by column north to south, its south face filling down to the next top (a fall, a stone wall under a road, rock with ledges, sand, earth with its lip); a small drop on smooth ground shades from top to top (no stripe). A chunk's picture is its screen rect: the land south of it (`HE` rows, as far as `liftMax` levels lift) seen in it. Each chunk keeps its lift (`rec.lift`) and what ground shows at each screen px (`rec.dep`). Everything that stands is lifted with its ground (`liftDraw`: every entry with its map x; shadows, depth pictures, labels, plaques, banners and lights with it); a ridge nearer is drawn again over a man behind it (`liftFront`); a prop behind one is cut at painting (`cutPic`); clicks read the ground under the pointer (`liftGround`). Steps by bands of `steps.band` levels (the lab's 3) where it is steep; rock and scree by height and slope (`steepG`, `cliffG`), never by tile.
       3. **The lab's water:** foam riding the shore, the river's current in light streaks running down it and white down its falls (`rec.shore`, `rec.flow`, drawn each frame with the grass); a river's surface eased along its curve, stepping only where it falls a step's worth.
          - **Old-scale sprites to the lab's (2026-11-16, four agents, `scratchpad/sprite_brief.md`):** each picture built at 2 fine px a game px and drawn at half, so it keeps its size in the world with twice the detail.
            - Camps: tents and camp pieces from their models at the fine cell (`CampArt.fine`, a few a frame), a fire pit in 4 looks and bedrolls, the camp flame finer, the siege camp in 6 looks by its holding, the planted banner (`bannerFine`).
            - Road encounters: mud, fire rings, embers, bedrolls, baskets, the toll barrier in its realm's colours, the gaming cloth, the props from their models at `detail:2`, the live effects (wisps, blades, dust, sparks, notes, smoke); the fights on the map the same dust, sparks and blades.
            - Towns: the walls, towers, gates, palisades and fences in fine stone courses, stakes and hurdles, 4 looks by tile (`TOWN_WALL.looks`; walls still off); ships' sails, rigging and oars painted fine (`shipRig`), 3 looks each; moored boats, the pier (`pierPic`, `PIER`), the estates' ground (pastures, pens, the quarry), the holdings' and sites' flags (`flagFine`), scaffolding, smoke and sparks.
            - Remains: fallen bodies fresh and rotting at 2x, crisp (`BodyRot`, `BODY_ROT` mottle, mold), bones redrawn (a man's, a beast's, 5 looks), graves of every kind redrawn at 2x (`GraveArt.put`; candles, banners, fireflies fine), ambient life at 2x (birds, hare, squirrel, heron, duck, lizard, bat; `ambPut`), the cloud shadow at 2x; the fish leaping over fishing grounds drawn again (it never ran: it sat after the glints' return).
            - Left: smoke, snow and the old fireflies over the map are on the overlay canvas, a px a game px (`render.js` `overCv`), so not finer yet; the herd beasts and dead beasts (`critterSprite`), the woodpile and barrels models (still checkered at `detail:2`), the fields' crops (`farmPlot`), the market stalls, the torch, arrows and blazes; the flag over a holding's centre does not show (older than this).
          - **Walking behind things (2026-11-16; the owner: "When character walk behind buildings, tree, etc. bring those concept in"):**
            - Trees, tents and graves stand whole at their foot (`depth.js` `depthPic`'s foot): a man behind a tree's trunk is behind its whole crown (each crown column had stood where it ended, above his feet, so he was drawn over the crown). Over your own men it fades and they show through it (`WDEPTH` fade, ghost), as with the buildings.
            - Tents (settled camps, a camp being pitched while in your sight, the siege camp) and graves are drawn with the standing things and stand in front of those behind them (`CampArt.put`, `GraveArt.put`); a camp out of your sight stays hidden in the fog.
          - **Medieval, not modern (2026-11-16; the owner: "Make sure all sprites are medieval theme not modern"):** the toll's barrier a barked log on crossed stakes with the realm's cloth tied round it (was a red-and-white striped boom); the dicers' cloth woven and fringed, small bone dice (it read as a box); the woodpile's logs lengthwise, its log ends and tops no longer a chequer (`engine/model.js` `Logs`, `logend`; `buildmodels.js` woodpile).
          - **Streams run into the wide water (2026-11-16; the owner: "it should be watered or shallow path not like a whole land cross the river or stream"):** a wide river's (or a lake's) smooth bank dried every river px along it, so a stream running into it ended in a strip of bank before the water. Now the bank dries only the wide water's own segments (those starting on its tiles: `WY.SWD`); a stream's water runs on into it, with no bank colour over it.
          - **No straight edges on the water (2026-11-16):** the frost's shelf ice is on a river's own course only, not in open water nor within `shore.ice` (16) px of it, where a river's mouth widens into a lake (its "banks" there drew straight lines of ice across the lake). A fall's white water lies only across its own channel (`falls.wide` of its half-width), fading in from its ends and sides (in a wide river it had spread across the whole water between two straight lines).
          - **Water that runs like water (2026-11-16; the owner: "Right now it is like a dot flowing around not like a water stream"):**
            - A river's current is long streaks in lanes along its line (`WORLD_WAYS.river.flow`): each px knows how far along the river it lies and how far across, measured past each segment's ends, so the current never stands still over a bend. The line is first smoothed over 2.5 half-widths (`worldterrain.js` `riverRun`); a wide river's line wanders inside its water and its streaks would curl.
            - Streaks run only in the main stream (within 0.7 of the half-width) and thin out towards its edge. The painted ripples run along the current too, not along the screen's rows (`wayWater`'s `fa`, `fc`, `fe`).
            - The shore's foam laps in long runs together, not in single twinkling px.
            - The old tile glints (`worldart.js` `drawEnv`) stay off the rivers, and in the fine scene they are fine px (3 by 1 lab px) on the sea's and lakes' water only (`drawnWater` 1).
            - No stone specks in deep water.
       4. **The ground blended:** a wood's floor and its trees by a warped, soft weight of the tiles round it (`terWood`), its floor and the grass shading into each other over the edge.
       5. **Roads graded:** each road's height along it (`waysOf` `RZ`): the land's, held to `road.grade` (the lab's 1 in 34) and smoothed, raised to a bridge's deck within `bridge.ramp` of its ends; the land under it set to it, its shoulders cut or banked (earth showing where steep; a stone wall where it drops); bridges at their deck's height (`bridgeDeck`).
       6. **The lab's walk:** `WORLD_SCALE.move` 1.11 (a man some 19 game px a second, the lab's 38 lab px; 1.63 times before) and a day 1.63 times longer (`DAY_SECONDS` 293), so a day's march is the same ground. The lab's swimmers: heavy armour cannot swim, nor can a band with no stamina (`heroSwims`, `WAY_NOSWIM`).
       - **Fixed (2026-11-15; the owner: "Now i cant even move? And why the road scale not match with the lab?"):** the pointer's ground was named `groundAt`, as the battle's own ground reader is (battle/terrain.js, loaded later), so every click on the map read that one and lost its target; renamed `liftGround`. Roads at the lab's width: one half-width, the lab's 13 lab px (26 wide; the track's 9 was the game's own), wandering 18% along it, a ragged edge of 3, shoulders of 22; their corners rounded as the lab's road bends (`road.bend` more cuts of the line).
       7. **Not done:** climbing cliffs (the lab's climber); bridges still run straight along their tiles (the generator lays them so); the fog still lies by tiles (not lifted); world battles' figures are not lifted.
     - **The world's land from the lab's own formula (2026-11-15; the owner: "I still believe you create the world based on old world generation engine, not the lab one. Look closely how the hill step are being generated. Look at the scale and all ... Use new engine and retire that one"):**
       - **Before:** the land drawn was the tiles' levels (a tile 32 lab px) eased between them, roughened by a noise of the game's own, and stepped a level at a time wherever it was steep; the lab's land is a height at every lab px: a noise of 3.4 levels at 240 lab px, and over its peaks shelves every 3 levels whose rise is sharp (to the 16th power) where a second noise at 110 lab px says, a ramp where it does not.
       - **Now** (`worldgen.js` `landHeight`, `LAB_LAND`): every lab px's height is the lab's: the land's lie (the tiles' levels, as the stages before laid it) rolled by the lab's noise (calm within 4 tiles of water and brooks, so shores and banks keep their water's level), over 4 levels cut into the lab's shelves (band 3, sharp 16, its noise at 110 lab px past .38); never under the river or lake beside it, nor a brook's bed. The tiles read it: each one's level its middle's (`reliefOf`), its slope class the steepest of it within it against the lab's classes (`landClasses`: a slope 0.035, steep 0.11, a cliff 0.22 levels a lab px; on high ground 6 x 6 samples), so the shelves' sharp rises are cliffs (rock, shut) and their ramps the ways up; the hills, kinds and slopes after the rivers (`genValleys`) and on load (`useWorld`) from it. The world map draws exactly it (`terrainChunk`: each game px's height `landHeight` at its middle; stepped a level at a time where steep, as the lab paints), the roads are graded on it, and what stands is lifted by it.
       - **Audit (seed 1):** no river rises downstream, none over its banks, no lake over its shore; 1,681 cliff tiles (the shelves' rises).
     - **The lab's remaining features (2026-11-15; the owner: "Yes go with all eight"):**
       1. **Shore and sea** (`terrainChunk`): the sea's and the lakes' water a field between the tiles' middles roughened by noise (no tile's square); each px's distance to the water (the lab's shore: wet 5, sand 34, dunes 80 lab px) and the water's to the land (its depth and foam), over the window and a margin as wide as the dunes reach.
       2. **The small things on the ground** (the lab's decor, `WORLD_TERRAIN.decor`): tufts, flowers, marram on the dunes, driftwood along the tide line, shells, the woods' leaves and twigs, pebbles on scree and rock, up from their own px.
       3. **Roads that climb in turns** (`worldplace.js` `PLACE_ROAD.grade`): a road's step pays the square of its grade on the lab's land, so roads take hillsides aslant and in turns (switchbacks), their corners rounded; bridges at their deck's height. A bridge at the road's angle: below ("The two left undone, done").
       4. **Rivers:** a tarn at the head of a river rising from 3 levels up (`river.tarn`), a plume into the sea past a mouth (`river.plume`, `P.ways.mouths`), deeper downstream; fords shallow with stones (as before).
       5. **Walking** (`map.js` `LAB_WALK`, `headingMul`; world.js `heroGround`; supply.js `staminaRate`): on a slope your band goes up at 0.5 and down at 1.15, steep ground 0.3 either way; Shift runs 1.6 times as fast; slopes, steep ground and running tire it (1.25, 1.7, 1.8 times the march). Climbing cliffs: below ("The two left undone, done").
       6. **Climate effects:** the desert green by its rivers (`oasis`), the swamp's pools with duckweed (`pools`), the frost's flakes always falling and the swamp's mist drifting (`climateAir`, `CLIMATE_AIR`); footprints and the weather's snow were the game's already (tracks.js, weather).
       7. **Every ground blended** (the lab's `blend`: r 8 lab px, k 0.85, warp 10): each land px's kind recorded as it is painted, their plain colours averaged round it through a warp, its colour moved by the difference.
       8. **The fog and battles lifted:** the fog read at the ground seen at each point of the view (`fog.js`, `liftGround`); a man in a battle on the map up by his ground's lift (`render.js` `drawUnit`).
     - **The two left undone, done (2026-11-15; the owner: "Do not done"):**
       - **Bridges along their road** (`worldways.js` `waysOf` bridges, `bridgePic`, `wayDeck`; `WORLD_WAYS.bridge.over`, `open`): each a true rectangle on its road's own line across the water, its crossing's (the owner, 2026-11-15: "make sure the bridge just align with the road, no need to always diagonal"; it was turned toward the road's way in and out further back, up to 28 degrees), as long as the water plus `over` each side; the road joined to its ends by a short piece each; drawn px by px (deck, beams under its edges, piles or piers and arches under its near edge, rails or parapets along its long sides); a ship's underside reads the same rectangle. Its supports stand only where it is over open space (water, or more than `open` px under its beams, read along its middle), evenly: a pile at each end of that stretch and every `pile` px at most between, braced (a stone one's piers, an arch every `arch` px at most); where its bank carries it, nothing under its deck (the owner: "if the foundation already cover like certain amount of the bridge then we should leave it open like real bridge").
       - **Climbers** (`map.js` `heroClimbs`, `LAB_WALK.climbBand`, the Climber node `athl_climb`, `cliff`, `staCliff`, `climbCost`; `WAY_CLIMB`): a band of `climbBand` men or fewer whose hero has learned Climber (Athletics' second tier, the owner 2026-11-15: "make it unlockable as skill"; it took Second Wind's place, whose stamina went to Marathon), while it has stamina, climbs cliffs: its way may cross them (`findPath`, a cliff `climbCost` tiles; a goal past them reachable), its step may go onto them (world.js `walk`), at `cliff` of its pace (`heroGround`), tiring `staCliff` times the march; its men climb with it (march.js `MarchGround` `climb`). The world's shared ways and caches never take a cliff. On seed 1, 17 of 40 cliff crossings tried went over the rock with climbing, some places reachable only so.
     - **The ways and the buildings at the lab's scale (2026-11-15; the owner: "Please use the scale in lab. Bridges and everything should be changed right?", "Lab scale (~2 men)", "make the lab river several sizes, there can be a big river ... Dont keep the old values, wipe it"):**
       - **Rivers in sizes** (`gfx/worldways.js` `waysOf`, `WORLD_WAYS.river`): every river and brook a curve through its tiles (corners cut three times, wandering off its line as far as its tiles let it), as wide as its size in the lab's px: a brook 5 to 10 (by its flow), a river one tile wide 20, two tiles 44, three tiles (a great river) 76; wider again into the sea or a lake. Its water by its depth (deepest down the middle, deeper the bigger: `depth`), its bed showing in the shallows, ripples along it; a muddy bank (`bank` px), dark grass up it, reeds; the frost's edges frozen. Its surface is its tiles' levels, never rising downstream and stepping where they step: a fall where it drops (the painter's faces). Brooks, painted only before, are drawn now (no tile of water: walked through).
       - **Roads** (`WORLD_WAYS.road`, `wayRoad`): the lab's worn tracks along the plan's lines (`P.segs`): two wheel tracks and their grooves, the crown, loose ground and gravel, puddles where it is flat, the grass creeping in at a ragged verge; a road 26 lab px wide, a track 18; its shoulders never stepped.
       - **Fords:** the river shallow where the road crosses it, stones in it (the road's band over a ford's tiles).
       - **Bridges** (`bridgePic`, `WORLD_WAYS.bridge`): the lab's, standing over the water at the road's width: a wooden deck of planks (a stone one's setts), beams under its edges, piles braced between (a stone one's piers and arches) hanging down to the water, foam at their feet, rails on posts (a stone one's parapets); clear levels over the water, never under its banks. A ship's underside reads its shape (`wayDeck`).
       - **Bridges as their own layer** (2026-11-15, the owner: "Go"; `worldways.js` `bridgePic`, `bridgeEnts`, `bridgeOver`): a bridge is no longer painted into the ground's chunks. Each is its own picture, made once its chunk is painted and kept per scene resolution, and drawn among the map's things in depth order by its south edge, like a building. The ground and water under it stay whole; men on its deck are drawn over it; a swimmer under its deck is drawn under it (the deck's part over him is drawn again).
       - **Natural rivers, natural fords, no ruts, no squares** (2026-11-15, the owner: "fix a big river to avoid having so many s curve one after another, make it like natural river ... Recheck if there's any weird squared look ... the road should not have that cart tracks ... Can we make the ford have a natural version?"):
         - A river's line is simplified before it is smoothed (`worldways.js` `simplify`: Douglas-Peucker within `river.simp` of a tile of its tiles' middles), so its tiles' stairs on a slant no longer make S-bend after S-bend; it wanders in long, uneven bends (`river.meanderL` px, their reach varying, some reaches nearly straight). Brooks keep their short wander.
         - A ford is natural: the stream spread shallow over a gravel bed along the road, pebbles showing, riffles over them, wet gravel on its banks; no laid stones.
         - Roads have no painted wheel ruts (the bands' own tracks are drawn: `world/tracks.js`): a packed crown worn in patches, loose at its sides.
         - Squared looks found and fixed: the climates were blended in straight lines between the tiles' middles and the water, banks and faces took their tile's own climate (a river's colour changed along a tile's edge); now each px's climate is read at a place warped by noise (`WORLD_TERRAIN.climWarp`) and picked from the shares, dithered, and the props (`terClimate`) pick theirs the same way, their hill and mountain trees by the land's height, not the tile's kind. The sea's and lakes' shores were blended straight between tiles (diamonds, straight runs); now a smooth curve over the tiles, read at a warped place (`WORLD_TERRAIN.shore`). Still rectangular on purpose: fields and lots.
         - A wide river (two tiles or more) had a scalloped edge, a round bulge for each point of its curve (the owner: "the wide water has a scalloped edge, a round bulge per tile"). Now its banks are one smooth curve over its tiles, read at a warped place (`worldterrain.js`, `WORLD_TERRAIN.shore.river`); its curve's bulges outside it are dry bank, and its depth runs from that curve inward. Its dirt edge kept (the owner: "keep that dirt edge"): a river's water lies `shore.lip` fine px under its banks, and every such drop gets an earth face (lit lip, earth below) all along the bank, mud and dark grass up from it (`shore.bank`). The water's edge and its bank are worked out at every fine (lab) px, not every game px, so the edge never steps two px at a time (the owner: "Make sure the edge are smooth not square"). The squares the owner still saw came from the river's curves being read only near their line (their band's reach): the smooth bank was cut short along the band's edge. The band now reaches `shore.reach` game px further, no terrace step stands within `shore.unstep` banks' width of a river, the face at river water is earth (never rock), and a map chunk painted coarse while the game loaded is painted again fine in the background (`worldart.js` `draw`: it had stayed coarse for good).
       - **No tile stairs anywhere** (2026-11-16, the owner: "make sure the map generation dont have this kind if flat stair anywhere on every type of edge and layers"): an audit scanned painted chunks round 25 places (every climate's coast, mountains, wood edges, rivers, lakes, climate borders, towns) for long straight colour edges on the tiles' lines, and looked at each kind. Found and fixed: the sea's depth colour stepped along the tiles (its depth class a tile's; now `terDepth`, smooth between the tiles' middles at a warped place); the climates' borders straight where the lab blend, the decor and the land's faces read a tile's climate (now `CLG`, each game px's warped climate, the ground's own); the trampled ground by holdings coloured by its tile's climate (now `terClimate`); narrow rivers running dead straight along a row of tiles (their wander `river.meanderBig` and a shorter bend over the long one) and wide rivers' banks warped more. Grid-aligned straight edges fell from 230 to about 120, the rest lots and fields (square on purpose) and short terrace faces.
       - **Roads round streams, fords, streams that make sense, roads of their land** (2026-11-15, the owner: "Make the road avoid streams so fewer bridges also add a small stony ford ... rework the stream system to make it make more sense ... The road as well, make it blend more naturally with biomes and at the end of the road should blend completely"):
         - Roads go round streams: a brook's tile costs `PLACE_ROAD.brook` more to the road builder (worldplace.js), so a road passes a brook's head or keeps beside it where a short way round does it. On seed 1 the crossings fell from 57 to 36.
         - A track's crossing, or one over a brook narrower than `bridge.brook.ford` px, is a ford (`P.ways.fords`; natural, the owner: "No need to be human made stone ford": the stream spread shallow over a gravel bed along the road, its pebbles showing, riffles over them, wet gravel on its banks); a road's is a small stone bridge.
         - Streams end only in water: once the roads and holdings are laid, a brook whose way down leads to no water and no other brook is cut back to its spring with every brook feeding it (`worldgen.js` `genDeadBrooks`), so none stops at a road or in a field; each rises from a spring, a pool `river.spring` times its width at its head.
         - Roads take their land's look (`WORLD_WAYS.road.biome`): its ground's colour mixed in (`mix` by climate), and the ground over it in patches (`patch`: snow in the frost, sand drifts in the desert, mud in the swamp); at a dead end (`P.ways.ends`: a road's end no other road and no bridge meets) it narrows and fades, dithered, into the land over `road.fade` game px.
       - **No stream across a road without a crossing** (2026-11-15, the owner: "Can we remake the river rule? There should be no river crossing the road like that"; `worldways.js` `waysOf`, `WORLD_WAYS.bridge.brook`): a brook is painted only (no tile of water), so the road builder laid roads over brooks with no crossing and the water ran across the road. Now wherever a road's line crosses a brook's (not on a river's, a lake's or a ford's tile, and not within `brook.apart` px of another bridge) a small bridge stands along the road (`small`: planks on a track, stone on a road), spanning the brook and `brook.span` px of bank each side, its deck at the road's height or `brook.clear` levels over the water, whichever is higher; the road is cut away under it (`bridgeOpen`) and the stream runs beneath. On seed 1, 57 of them.
       - **The new generator: the lab's land** (2026-11-15, the owner: "Why i see a lot of square edge in the game version but not in the lab? Is it generated using a different scales? ... drop the old generator entirely ... Ignore old save ... Make sure the new generator respect the lab one. Keep the old version separately"; `worldgen.js` `LAB_GEN`, `labCoast`, `labTerrain`, `labField`, `genLand`, `genElev`, `landHeight`, `landClasses`; the old one in `world/oldgen/worldgen.js`, not loaded). Two scales differed: the old generator made the land a tile (32 lab px) at a time, and the lab's formula was laid over those tiles' levels; and the painter lifted the land a game px (2 lab px) at a time, so every edge was a stair of two. Now the land is one field at every lab px, made the lab's way (its `elev`): the coast rising inland (`rise`: 4 levels over 26 tiles), the lab's rolling noise (`roll`: 3.4 levels at 240 lab px, calm by the coast), ranges (`ranges`: walks inland, the lab's peak profile across them, its peak noise at 80 lab px, a pass every 44-56 tiles) and uplands (`uplands`, the lab's shelf) stepped in the lab's shelves (`steps`: a rise every 3 levels, sharp to the power 16 where the noise at 110 lab px says), round hills (`hills`, the lab's hill). Its grids (per tile: the coast's rise, the calm, the ranges and uplands, the hills) are B-spline smooth between the tiles' middles, so nothing follows the grid. The tiles read it at their middles (`genElev`: elevation, kinds by the lab's slope classes); the map draws it (`landHeight`: the field, plus what the rivers, lakes and banks made of each tile, smooth). The drainage (rivers, lakes, brooks), climates, forests, springs and the placement stages run on it unchanged; `genValleys` makes the kinds again once the water is laid. The painter lifts each fine px by its own height and step (`LFF`, `WF`, `SF`). No old save loads (the owner: "Ignore old save"). On seed 1: no river rising downstream, 3 river tiles perched, no lake spilling, 1,593 cliff tiles.
       - **The land smooth between tiles, edges on unseen drops** (2026-11-15, the owner: "I still see a weird hill slope or steep hill, or hill level still weird", "make an edge for the south ankle that we cannot see"; `worldgen.js` `landHeight`, `LAB_LAND.warp`, `wsc`, `fr`, `fdrop`; `worldterrain.js` the stepping and the lift paint; `WORLD_TERRAIN.rim`, `flat`): the tiles' levels were blended bilinearly between their middles, so the land was flat facets and every level line, every terrace, ran straight along the tiles' rows and diagonals; the river and lake floor was a value a tile, a square shelf. Now both are a cubic B-spline over the tiles, sampled at a place warped by noise (`warp` tiles at `wsc` lab px), the floor spread `fr` tiles round falling `fdrop` levels a tile: the terraces curve with the land, as the lab's. A lot's ground is eased into the steps round it over `flat` game px, never a square edge. Where the ground falls away north, west or east more than `rim.drop` fine px (a face no one sees from the south), its crest's px is darkened (`rim.north`, `rim.side`), so the step reads.
       - **Rivers stepped down the hills, the lab's** (2026-11-15, the owner: "Look how the river and hill work in the lab"; `worldways.js` `riverSurf`, `WORLD_WAYS.river.step`): the lab's river takes the land's height under it, and its painter steps it at every whole level, so it runs flat, then drops a level over a fall, down the hills. The game's ran smooth between its points (a fall only where two points dropped `steps.min` levels at once, rare). Now its surface is stepped `step` levels at a time (`riverSurf`, read by the painter's `surf` and `fallDist`): a fall at each, its white lip and foaming pool whichever way it runs. A river's banks are earth, never rock, as the lab's.
       - **Falls seen whichever way a river runs** (2026-11-15, the owner: "Do river has water fall like in the lab?"; `worldways.js` `fallDist`, `worldterrain.js` the river's colours and `terrainEnts`; `WORLD_TERRAIN.falls`): the lab's river runs south, so its falls face you; the world's run every way, and a fall facing north or sideways was only the water jumping. Now every step of `steps.min` levels or more in a river's surface has white water: its lip whitening `falls.lip` game px above it, a pool churning foam `falls.pool` below (`WY.FD`, each river point's distance from a fall), its foam flickering (flow code -2), besides the white face of one facing south (-1). On seed 1, 187 such steps.
       - **Bridges like the lab's, no bridge paint in the ground** (2026-11-15, the owner: "make sure that the bridge look like the bridge. Add more detail to it (similar to the one in lab) and make sure the world gen remove those bridge paint that merged with the terrain"; `bridgePic`, `bridgeOpen`, `P.ways.RB`; `WORLD_WAYS.bridge.abut`, `shade`, `shadow`, `road.wall`): its rails on its very edge only (one line, a post every `post` px, a taller post at each corner), its north rail's shade on the deck, its shadow on the water `shade` px to the south-east, piles braced all along its near side (stone only at its very ends), foam and a ripple at their feet; a stone one's parapets capped and coursed, its arches a ring of stone over a dark opening. Under its open span the ground has no road (`bridgeOpen`, the lab's `OPEN`): the river and its banks as they are, the road's fill only `abut` px under each end. A road's face is a stone wall only within `road.wall` px of its edge (the lab's), its shoulders' faces earth, never rock; near a bridge (`RB`, two ramps of its end) its raised sides are an earth fill.
       - **Buildings, camps and sites at the lab's scale** (`WORLD_VIEW.build` 0.5; `structures.js` `lotDrawBox`, `scaledPic`; `sites.js`): a model's px a fine px, so a cottage stands some two men tall on its lot's front middle; their footings (`march.js` `lotFooting`, `siteFooting`), shadows and the depth overdraw scaled with them. A holding's centre stays its own size (its walls are on the world's ways).
       - **Wiped:** painted fine, none of the old ways' art is drawn: no old road band, river tiles, ford rocks, bridge decks, rapids or bank reeds (`worldart.js` `OVER_FINE`: a ferry and the ore only). The old art stays only for a picture made at 1 px a game px (the whole map, the wiki, the tests' fixed view).
       - **The tiles keep the game's rules:** a river's tiles are still its water to the simulation (a river one tile wide drawn 10 game px of its 16), its crossings where they were.
  3. **The fine nature:** the lab's trees, rocks, logs, bushes, small things and the animated grass, moved into a shared engine file (used by the lab and the game), placed by climate on the world's tiles and sorted with the figures; footprints, snowfall and mist by climate.
  4. **One speed:** a man walks about the same on the map and in a fight (§3); `WORLD_BATTLE.scale` and `sprite` re-set; px-tuned numbers re-measured; W7, W8 and the battle suites re-recorded once, with this reason.
- Height (phase 2) comes after: the lab's levels, faces, cliffs and climbing on the fine ground.

---

## 11. Decisions for the owner

**Decided (the owner, 2026-11-15):**
1. **Size M:** neighbouring holdings about a minute's walk apart.
2. **Level height 8 px for now, adjustable:** `LAB.lh`; the lab's slider, 4-16 px.
3. **Cliffs:** some units can climb, or climb with a skill. In the lab: the Climber switch (a cliff at ×0.16, on stamina).
4. **The day:** 6-8 minutes.
5. **The lab first:** built (below).

**The questions as they were put:**

1. **World size:** S, **M** (recommended), or L (§4)?
2. **Height:** levels of 8 px (recommended; a 12-level peak about 96 px high), or flatter (6 px) or taller (12 px)?
3. **Cliffs:** block everyone and you go around by ramps and passes (recommended for now), or the hero can climb them with a skill?
4. **The day:** longer to match M (6-8 min), or keep 3 min?
5. **The view:** the same top-down, slightly oblique view as the battle map (recommended), with the camera zoom kept?
6. **Godot:** stay in JS now (recommended), and judge after the lab?
7. **Start with the lab (phase 0)?** Recommended: nothing else changes until the owner has seen it.

## 12. The lab as built (phase 0, 2026-11-15)

`engine/worldlab.html` and `engine/worldlab.js` (`PX.worldLab`, its numbers in `LAB`): a stretch 2048×1280 px at the one pixel scale, made from a smooth height field in levels.

**What it shows:**
- **The land:** the sea and its shore (wet sand, the beach, marram dunes, driftwood and shells, foam riding the shoreline). The driftwood lies only along the tide line: a few sticks 3-6 px long, some aslant, some forked, bleached on top, dark under, with a faint shadow. It had been a flat dark 5 px dash all over the sand, which read as black lines (the owner: "I mean the black line on the grouns"), meadows and terraces, a hill, oak, birch and fir woods (the battle map's 32 px trees), boulders on scree.
- **The range:** two peaks stepped into shelves with rock bands between them (`LAB.steps`: a sharp rise every 3 levels, a cliff where its noise says, a natural ramp where it does not), bare rock with grass patches above level 9, and snow above 11.5.
- **The village:** on a flat shelf, the game's own building models drawn on a cell twice the game's (a cottage, a townhouse, a fisher's hut, a tavern, a well, a cart). It has three villagers.
- **The road:** from the village up to the saddle in switchbacks, its grade held to 1 level every 34 px, cut into the hill on one side and built up on the other.

**How it's drawn:**
- Each px stands `level × lh` px higher, painted north to south, column by column.
- A terrace's south face shows below it: an earth bank for a gentle step, a rock face with a dark ledge at every level for a steep one.
- A depth buffer (the world y of the ground at every screen px) hides what stands behind a ridge and turns a click into a place on the ground.
- Trees, houses, people and the hero are drawn in order of their feet, each cut by the ground in front of it.

**Walking:**
- By the slope where he steps: flat, slope (uphill ×0.5, downhill ×1.15), steep (×0.3), cliff (only with Climber, ×0.16, on stamina), water no one.
- Ground: the road ×1.1, sand ×0.85, dunes ×0.8, woods ×0.85, snow ×0.55.
- Click to walk: an A* over the 16 px cells. A cell counts as a cliff if 4 of its px are, so a thin rock band still shuts it. The hero steps round a single rock on his way.
- WASD to walk, Shift to run.
- A walk map shows the classes.

**Numbers (1280×720, zoom 2):**
- **Frames:** 60 fps capped (about 300 uncapped), about 1-2 ms of work a frame.
- **Making the land:** about 0.9 s.
- **Painting:** about 0.55 s for the whole stretch, about 55 ms a 512 px chunk. The lab paints the plain way, a new array for every colour. The game's painter must do it in about 8 ms: fixed palettes, typed arrays and a few ms a frame, as `WorldArt` already paints.
- **Walking:** from the village to the snowy summit takes about 50 s on foot by the ramps.

**Water and roads (2026-11-15; the owner: "make those road more realistic and add rivers water and etc"):**
- **The river:** it rises in a tarn high on the range and runs down to the sea, meandering (`LAB.river`).
  - It widens from a stream (5 px) to a river (22 px), in a channel carved into the land with muddy banks and reeds.
  - Its surface never rises downstream and steps by levels, so it falls white wherever it drops a level. Over the rock bands the falls stack into cascades, with foam at their foot.
  - The water moves: streaks run downstream, and the falls pour.
  - Where its surface comes down to sea level it runs on at that level, widening (`widen`), as a channel through the beach into the sea. Its deep channel shows through the shallows, and its water keeps moving (the owner: "What about the river and steams? This one looks weird": it had stopped short of the sea).
  - Past the shore it fans out and fades into the sea (the owner: "the water from river to ocean is not realistic": it had run on as a dark stripe across the flats to the map's edge). Over 60 points (120 px) it widens by 1.6 of itself, shallows, and stops being a channel. Its channel's edges are soft (deepest at its middle). Its muddy plume (a grey-green tint, at most 0.35) fades with it, and so does its current (`fan`, `fanW`, `plume`).
  - A stream (no wider than 3.5 px a side) is waded at ×0.4. The river is crossed only at its ford (shallow, with stepping stones, ×0.4) or by the road's bridge.
  - A watermill stands on its bank.
- **The road:**
  - A curve through its points, so its switchbacks are hairpins.
  - Its edge is ragged into the verge.
  - It has two wheel ruts, with puddles in them where it is flat, a grassy crown between them on the flat, and pebbles.
  - A stone parapet runs along its edge where the ground beyond drops two levels or more; its cuts and embankments are faced with dressed-stone retaining walls.
  - Over the river it is a whole wooden bridge (`LAB.bridge`; the owner: "the bridge should be a full bridge structure"):
    - It is a true rectangle (the owner: "the bridge edge should be equal"). It is as wide as the road less 1 px a side, its sides straight and parallel whatever the road's ragged edge does. Its ends are square across the road, 7 points (14 px) past the water each side, resting on the banks.
    - Its deck is level end to end, 1.4 levels over the water, the road ramped up to it at its grade. Beside it, the span's ground is the river and its banks as they are. A ramp's side above the bank is faced with stone (its abutments).
    - Planks run across the deck, each its own tone with a thin gap between, worn where the wheels go.
    - Under the deck's edge: a heavy side beam, a pile every 12 px standing in the water with foam at its foot, cross-braced between, and the shadowed water seen beneath. Its shadow lies on the water just downstream.
    - Railings stand along both edges: a dark post every 8 px, a sunlit top rail with its shadow under it, and a middle rail. Each railing is painted only over what lies behind it, so the far one shows behind the deck and the near one in front.
    - It stands over the land as a structure of its own (the owner: "the bridge is draw over the terrain hence the bridge base or foundation should be transparent").
      - The land under it stays the land: the river and its banks run on beneath it, in its shade.
      - Only its parts are drawn: the deck, a beam under each edge, the piles reaching down to the real ground or water under them, and the bracing.
      - Its ends rest on the road's own fill (its abutments, `abut`: 4 points, 8 px), faced with stone where the fill stands over the bank. Before this, the road's ramp stopped short under the deck, and its cut face showed in the deck's shade as a black line (the owner: "What is the black line"). Each px is drawn only over what lies behind it, and the land shows between them.
      - A man walks on its deck at its height (`standLift`): the bridge is road to walking and to the way-finder, and a tap on it finds it. Its heights come from the land before the river was carved, so it spans the river instead of dipping into it.
- **Painting** is slower with all this: about 90-100 ms a 512 px chunk. That makes the game painter's rewrite (§8's 8 ms) more pressing.

**Steps only where it is steep (2026-11-15; the owner: "the layer line is unrealistic"):**
- **The problem:** every level's edge had been a sharp 8 px bank, so a meadow's gentle slope was a staircase of dirt lines.
- **Now:** a px's height lies between its smooth height and its terrace's by how steep it is (`LAB.steps.from` 0.08 to `to` 0.16 levels a px).
  - Gentle ground (meadows, rolling hills, the beach behind the dunes, the snowfield) rises smoothly, with no banks. Its slope shows by its light only, and its small steps blend from the px above to the one below with no darkening, so no contour lines.
  - Steep ground (the rock bands, cliffs, the range's shelves) keeps its layers, a ledge at every level.
  - Ground in between blends from one to the other.

**Layers (2026-11-15; the owner: "only terrain without them, those will be draw by separated layer"):**
- **The terrain layer** (`Pn.cv`) is the ground alone: grass, meadow, woods floor, sand, dunes, rock, scree, snow, water, banks, roads, cuttings, the terraces' faces, and the bridge standing over it.
- **The ground's small things are a layer of their own** (`Pn.decor`, transparent): tufts, flowers, marram, reeds, driftwood, shells, leaf litter and loose pebbles. Each is drawn only where its ground is seen (not under the bridge, not behind a ridge).
- The lab shows the terrain alone by default. "Ground details" lays the second layer over it.
- **The things standing on the land are a third layer** (`LAB.nature`; the owner: "another layer to add on boulder trees etc."). The switch "Trees and rocks" is on by default.
  - It holds trees, bushes (in the woods, thick at their edges, a few in the grass), saplings at the woods' edges, and boulders and stones (on the grass, the rock and the scree).
  - Also stones on the river's banks and in its shallows, and fallen logs and stumps in the woods.
  - Each is drawn in order of its foot with the hero and cut by the ground in front of it. None stand on the road, the bridge, the village's shelf or water deeper than shallow.
  - **Their own pictures** (the owner: "improve boulders, tree stumps, logs and other map details"). Each is drawn px by px and cached (`pixPic`): lit from the upper left, with a lit rim up and left and a shaded one down and right (no black outline, as on the world map), and a soft shadow under it.
    - **Boulders** (`boulderPic`, 11 to 23 px): lumps of one height field sunk in the ground: round, heaped, tall or a flat slab. Light on the top, darker toward the foot, dark seams where lumps meet, moss on the tops in the grass (none on the mountain), lichen, a tuft at the foot now and then. They replace the battle map's outlined boulders.
    - **Stones** (`stonePic`): the same, small; now and then two or three together.
    - **Logs** (`logPic`, 10 to 17 px): lying straight or aslant, round (lit on top, dark under), bark streaks along them and cracks across. The east end is a sawn face with rings; the west end is sawn, broken in splinters, or a plate of roots. A branch stub, moss on top, bracket fungi on the side.
    - **Stumps** (`stumpPic`): grooved bark lit on the west, roots flaring along the ground, the top sawn (rings, a crack, the heart) or broken off in splinters; moss, or mushrooms at the foot.
    - **Bushes** (`bushPic`, in place of the engine's): a dome of leafy lumps with a ragged edge, in oak, birch or the woods' dark green; berries or blossom on some.
    - **New:** ferns (in the woods and at their edges), mushrooms (red and spotted, brown or pale), patches of flowers in one colour (mostly in the meadows), and cattails and reeds on the banks. Chances are in `LAB.nature`.
    - **Trees** (`treePic`; the owner: "improve variety of trees"), in place of the battle map's three kinds (11 pictures, one size). 13 kinds, each in three sizes (young, grown, an old giant) and six variants with their tones shifted a little:
      - Broadleaves (crown of leafy lumps, two limbs up into it, gaps in it as ragged pockets of shade on its shaded side, a tone or two under the leaves round them: no hard dark squares, no bark showing as grey dots; the owner, 2026-11-16: "What's the black dot on trees?"): oak (wide, dark, thick trunk), beech (smooth grey trunk), ash (airy), maple (autumn red or gold), alder (dark, narrow), apple (small, with fruit or blossom).
      - Birch (slender white trunk with black marks, leaning a little, a light crown, gold now and then), poplar (tall and narrow, streaked), willow (strands hanging nearly to the ground).
      - Fir and spruce (tiers of drooping boughs, the spruce bluer and narrower; snow on their tops near the bare rock), pine (tall bare red trunk, flat clouds of needles), dead (grey, bare forking limbs, broken top).
      - **Where:** each place has its mix (`LAB.trees`): lowland woods mostly oak, beech, birch and ash, a few maples, poplars and dead trees; by the river willows and alders; in the hills pines and firs; on the mountain firs and spruces; round the village apple trees.
      - **Size:** young trees at the woods' edge (half of them), an old giant now and then deep in them, small and grown ones in the open.
      - Each carries its own soft shadow. Saplings stay the engine's.
  - About 5,400 objects in all; the frame rate holds (about 3 ms a frame at 2×, with the grass).
  - Low things (flowers, ferns, mushrooms) leave the grass in front of them standing; the others leave it bare (see the grass below).
- **The ground details** also got leaf litter (pairs of autumn leaves) and twigs on the woods' floor, and pebbles lit on top on the rock and the scree.
- Buildings and people stay as they were, always shown.
- **Grass is a fourth layer, alive** (`LAB.grass`; the owner: "grasses ... animated like flow with the wind or when character move on"). The switch "Grass" is on by default; "Wind" sets how hard it blows (0 to 3).
  - Clumps of a few blades (11×10 px), dark at the foot and light at the tip, on a jittered 6 px grid, thicker in patches.
  - Kinds: grass, meadow (now and then a flower at a tip), marram on the dunes, and a sparse, dark one in the woods. Banks and cuttings take the grass kind.
  - None on the road, the bridge, water, behind a ridge, or in the strip just in front of a prop's foot (it would stand over the clump, so the ground is bare there). About 14,000 clumps.
  - **Wind:** each clump leans by two waves rolling across the land (a quick sway and a slower gust about 90 px across), so the bending runs over the field in bands.
  - **Walking through:** clumps within 12 px of the hero bend away from him and spring back over about 1.4 s, leaving a trail behind him. The clumps just south of his feet are drawn over him, so he wades through the grass.
  - **How it stays cheap:** each clump is one of 7 leans drawn once on a sheet (`grassAtlas`). A frame writes the pixels of every clump in view into one buffer, laid in one draw under everything standing. Only the few in front of the hero are drawn again after him.
  - **Cost:** about 0.8 ms a frame at 2× zoom, and 2.6 ms at 1× with the whole map in view.

**Depth (2026-11-15; the owner: "Do we have depth if river or ocean?", then "Ok"):**
- **Every water px has a depth** (`LAB.depth`, in levels; a level is about 0.85 m):
  - The sea's is how far the land lies under it.
  - The river's is deepest down its middle and deeper downstream (0.2 to 1.5 levels at its middle). At the ford it is a quarter of that.
  - The tarn's is deepest at its middle (1.6).
- **A river's own water** (`COL.riverwater`, `LAB.depth.riverClear`; the owner: "why river has darker color than ocean?"):
  - Colour had been by depth alone, and the river's middle (about 1.1 m) is deeper than the shallow inlet beside it.
  - Now a river is clear in its shallows, showing its pebbles, then turns a green-grey and murky as it deepens, never the open sea's deep blue.
  - Its bed hides sooner than the sea's (0.55 levels, against 0.9).
  - At its mouth its water gives way to the sea's as it fades. The mountain tarn keeps the clear lake blue.
- **Looks:**
  - The bed shows through shallow water: rippled sand under the sea, pebbles in the river, dark rock in the tarn.
  - Light is caught in the shallows.
  - The water darkens with depth and hides the bed past 0.9 levels, so sandbars and the river's deep channel show.
- **Wading:**
  - Ankle-deep (under 0.12 levels) ×0.85, knee-deep (under 0.35) ×0.6, waist-deep (under 0.8) ×0.35, with stamina spent.
  - Deeper, you swim at ×0.3 on stamina: no swimming with none left, nor in heavy armour (the lab's "Heavy armour" switch).
  - The way-finder swims only when it must (a deep cell costs 9).
- **The hero** is drawn as deep in it as the water is (1, 4, 8 or 12 px of him under it), with ripples round him.

**Blended biomes and a worn road (2026-11-15; the owner: "make the transition between biomes more blend? And make the road more realistic"):**
- **Blended grounds:** each ground's colour is shifted toward its neighbours' over 8 px (`LAB.blend`).
  - How: a normalized blur of each ground's plain colour, sampled through a 10 px warp so the edge is ragged; the px's own grain is kept.
  - Which grounds: grass, meadow, woods floor, beach, dunes, scree, rock, snow and banks. Water, roads and bridges keep their edges.
  - The rock's grass patches fade in.
  - Woods thin out at their edges (`LAB.woods.fringe`): fewer trees toward the edge, a few standing out in the grass.
- **The road** (`roadCol`):
  - Its width wanders (`vary`).
  - Two packed wheel tracks wander a little (`track`, `wander`), each with a dark groove.
  - A crown between them, with grass tufts where the road is flat.
  - Loose ground and gravel outside the tracks.
  - At its edge the grass creeps in, dithered, with a line of trodden soil.
  - Muddy puddles with the sky in them lie in the tracks on the flat.
- **Bends** (the owner: "looks weird for roads when have a sharp turn"):
  - Each corner is a round arc of 30 px (less where its legs are short): `filleted`, `LAB.road.bend`.
  - Climbed at a third of the grade (`turnGrade`), so a hairpin is nearly level.
  - The ground between two legs of a switchback takes both legs' heights, weighted by nearness (`bandOf2`, `legs`), so the inside of a hairpin is one smooth bank: no crease, no stray wall, nothing standing in it.
  - A road's steep shoulders are a cutting (`K.cut`), refined (the owner: "refine the edge cutting, make it more naturally blend"):
    - The shoulders are wider (22 px), so cuttings are gentler banks.
    - Earth shows gradually as the bank steepens (`LAB.cut`: from 0.04 to 0.2 levels a px), in ragged patches.
    - It is warmer and lighter up its sunlit upper part, darker at its foot, and a shade darker where grass meets it.
    - Tufts regrow on it, fewer the steeper.
    - The little faces of smooth ground blend from the px above to the one below, with no vertical streaks.
    - The slope's light is softer, so there is no pale halo round a cutting.
- **Painting** is now about 180 ms a 512 px chunk in the lab.

**Climates (2026-11-15; the owner: "add them to the lab first before implement the map generator"):**
- **The panel's Climate** (Temperate, Desert, Frost, Swamp) makes the same stretch of land again in that climate: the same sea, river, peaks, road and village. It takes about 4 to 5 s.
- **How:** each climate is a patch in `LAB.climates` over the lab's own numbers (its tree mixes, grass kinds and footprint grounds replaced whole, the rest merged), and over the colours (`CLIMATE_COL`, taken from the battle map's `PX.GROUND_PAL` where it has them: its rock, faces and tufts). This is the shape the map generator can take later: one table per climate.
- **Three new grounds:** `K.oasis` (green ground by water in the desert), `K.pool` (standing water, wadeable, its depth from noise), `K.ice` (walkable, slippery: ×0.8).
- **Desert:**
  - Firm sand with wind ripples, cracked clay where the meadows were, sparse scrub where the woods were; sandstone cliffs and faces in warm bands; no snow; a turquoise sea.
  - Green ground (an oasis) along the river and round the tarn, out to about 22 px from the water.
  - Trees: acacias and dead trees in the open, date palms by the water and in the village. Small things: dry thornbushes, agaves (some in flower), bleached bones, sandstone boulders and stones.
  - Dry tufts of grass, sparse; green grass on the oasis.
  - The heat: walking out of the green and the water costs stamina (`sta.heat`).
  - Sun-baked village houses (the buildings' own desert look, `env`).
- **Frost:**
  - Tundra with snow lying in patches, snowfields where the meadows were, snow on the woods' floor; snow on the land from level 6.5 (not on cliffs).
  - Ice: along the sea's edge where it is shallow (with floes beyond), the tarn frozen, shelf ice along the river's sides.
  - Trees: spruces and firs, all snow-laden, winter birches (bare white trunks and twigs), a few dead trees. Snow lies on top of every rock, log, stump and bush.
  - Frosted tufts of grass; snow falling (it drifts with the Wind slider); snowy village roofs.
  - Snow slows you (snowfields ×0.62, the woods ×0.7).
- **Swamp:**
  - Pools of standing water on the low land (below level 4), wadeable, with sky in them, duckweed, a dark mud rim and wet mud round them; bog (soft mud with a wet shine) where the meadows were; marsh grass, tall and dark; mudflats on the shore; murky water.
  - Trees: swamp cypresses (a flared foot, knees in the mud, flat dark crowns, grey moss hanging), alders, willows, dead trees.
  - Small things: lily pads on the pools (some in flower), cattails round them and on the banks, mossy logs and boulders, many mushrooms, ferns.
  - Mist drifting east over the low land.
  - Bog slows you (×0.6); pools are waded.
- **Footprints** in every climate, on the grounds that take them: snow, sand, dunes and wet sand (and the frost's snowfields and woods, the desert's sand, the swamp's mud). One every 4 px walked, fading over about 20 s.
- **Frame time:** at most about 3 ms at 2× zoom in any climate, about 9 ms at 1×.

**What the lab leaves for later:**
- Lakes in the lowland, deltas, and boats on the water.
- Lighting by the time of day.
- Riders and carts on slopes.
- More than one climate.
- Making chunks on demand (§8).

## 13. Risks

- **Phase 1 touches almost everything** that measures in px: AI distances, sight, arrival radii, travel, camps and battle reach. It is one big, careful pass. All fingerprints and many tests change once.
- **Building models at a 2× cell** should gain real detail, but fine details (planks, tiles, windows) may need retuning per culture.
- **Empty land at M or L** unless more is placed between holdings.
- **Height picking and y-sorting** (what's in front on a slope) is the trickiest rendering work; the battle's cliff faces are the starting point.
