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
      - Broadleaves (crown of leafy lumps, two limbs up into it, holes showing the branches): oak (wide, dark, thick trunk), beech (smooth grey trunk), ash (airy), maple (autumn red or gold), alder (dark, narrow), apple (small, with fruit or blossom).
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
