# One scale, a living world: design proposal

**Status (2026-11-15): proposal for discussion. Nothing built.**

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

---

## 11. Decisions for the owner

1. **World size:** S, **M** (recommended), or L (§4)?
2. **Height:** levels of 8 px (recommended; a 12-level peak about 96 px high), or flatter (6 px) or taller (12 px)?
3. **Cliffs:** block everyone and you go around by ramps and passes (recommended for now), or the hero can climb them with a skill?
4. **The day:** longer to match M (6-8 min), or keep 3 min?
5. **The view:** the same top-down, slightly oblique view as the battle map (recommended), with the camera zoom kept?
6. **Godot:** stay in JS now (recommended), and judge after the lab?
7. **Start with the lab (phase 0)?** Recommended: nothing else changes until the owner has seen it.

## 12. Risks

- **Phase 1 touches almost everything** that measures in px: AI distances, sight, arrival radii, travel, camps and battle reach. It is one big, careful pass. All fingerprints and many tests change once.
- **Building models at a 2× cell** should gain real detail, but fine details (planks, tiles, windows) may need retuning per culture.
- **Empty land at M or L** unless more is placed between holdings.
- **Height picking and y-sorting** (what's in front on a slope) is the trickiest rendering work; the battle's cliff faces are the starting point.
