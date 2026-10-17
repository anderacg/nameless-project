# PX engine

Reusable procedural pixel-art generators. They are plain scripts with no build step, so they work when the page is opened straight from disk. Everything lives on `window.PX`.

| File | What it gives |
|---|---|
| `pixel.js` | `PX.rng`, `PX.dice`, `PX.hash` (seeded randomness); `PX.shade`, `PX.mix` (colour); `PX.canvas`, `PX.paint` (rect, px, poly, line); `PX.outline` (the dark rim characters and buildings share); `PX.MAT` (the medieval palette, by material) |
| `buildings.js` | `PX.building({type, style, seed, banner, facing, deep})` returns `{img, shadow, w, h, ax, ay, tiles, facing, deep}` for a 16 px tile map; `PX.BUILDING_TYPES` lists the types |
| `pieces.js` | `PX.prop({type})`: 8×8 yard props. `PX.pier` (`PX.boat` is legacy: the game moors the sailing ships' sprites, `ships.js` `shipSprite({moored:true})`), and `PX.camp({kind, seed})`: a bandit camp is one or two tents and a fire on 2×2 tiles; a hideout is the same ringed by barricades of spiked logs (4×4); travellers have two tents, a fire and their wagon (3×2). It returns `flag` (the foot of a flag pole, for the game's own flag) and `fire` (the foot of the flame). `PX.flame(frame)`: the flame, frames 0–3, for the game to animate. There are no wall pieces: a holding's walls are its centre's fortification (`spec.fort`) |
| `gallery.html` | a preview of every building type for each people across seeds; it takes the URL options `?z=4&n=8&only=keep`; `?view=props` shows the props and camps; `?only=sites` the sites; `?view=castles` the keeps, citadels, villages and halls |

## Building conventions
- **Cells (the sizing rule):**
  - Every building fills a square cell of 16, 32 or 64 px: 1×1, 2×2 or 4×4 tiles. Houses, halls, trades and work places are 16; the treehouse, spire, watchtower, gatehouse and village 32; the keep and citadel 64. Props are 8.
  - The whole picture, roof, chimney and banner included, fits inside its cell, and its footprint on the map is the same square. So placed buildings never overlap.
  - `img` is `cell×cell` with `ax` 0 and `ay` = cell. Draw it at `tileX*16`, `(tileY+1)*16 - cell`, where (tileX, tileY) is the cell's bottom-left tile.
  - The fit step leaves things off or makes the building smaller until it fits. The game lays its holdings out from these pieces (see the game's `js/world/lots.js`).
- **Camera:** one camera for everything. A box seen from the front, one side receding back at half depth.
- **Top-down castles:**
  - The keep (castle centre, 64), the citadel (town centre, 64) and the gatehouse (32) are drawn straight on and symmetric, but seen from above, as in a top-down game.
  - The `village` (village centre, 32) is seen from above too: its people's hall (`spec.style`: longhouse, stonehall, elfhall or hidehall; `PX.VILLAGE_HALL`) at the back, a path down a green with a stone well and the village's goods, and with `spec.fort` 1+ a palisade round it all, its gate at the front. The hall flies the flag.
  - A ground point (x, g) at height z shows at (x, g − z). So the plan reads as a plan: the courtyard, the walls' walkways and merlons, the towers' round tops and cones, and the roofs. Only the faces turned toward the viewer show, short, below their tops.
  - The gate sits on the cell's middle column (`gateX` = cell/2), so a road meets it.
  - `gallery.html?view=castles` shows them.
- **Views:** most buildings come in two views, and the seed picks one (about 2 in 5 come out top-down).
  - **Angled:** a side wall shows on the right, or mirrored on the left.
  - **Top-down:** straight on and seen from above, like the castles, with the door on the cell's middle column.

  `spec.view` (`'top'` or `'angled'`) or `spec.facing` (`'front'`, `'left'` or `'right'`) pins the view. The result's `view` says which was drawn, and a top-down one gives `gateX`. Keeps, citadels, mines, caves, cranes and lumber sheds have only the top-down view. `gallery.html?view=top` (or `angled`) shows one view.
- **Facing:** a building may face either way. `spec.facing` is `'right'` (side wall on the right) or `'left'` (side wall on the left).
- **End-on:** long buildings may stand end-on, their gable to the camera and their long side running back over 1×2 tiles. Set it with `spec.deep`; this applies to longhouses, barns, warehouses and halls.
- **Seed:** without these options, the seed picks the orientation.
- **Light:** always comes from the upper left. Each surface is shaded by its role (`LIGHT` in `buildings.js`), so turned buildings stay correctly lit. A left-facing building is drawn facing right, with the light swapped to where each surface ends up, then flipped.
- **Roofs:** carry their details:
  - a thick eave lip that shades the wall below
  - ridge caps, or a bound straw ridge for thatch
  - gable boards and a finial
  - a king post and vent in timbered gables
  - moss and worn patches
  - dormers on long roofs
- **Wings:** some houses grow a lean-to annex against the side, a porch over the door, or a gabled cross-wing at the front (the main hall then stands back). Walls of timber, daub, plank or hide stand on a stone footing.
- **Footprint:** one building fills one tile; some fill 2×1 or 2×2. Draw `shadow`, then `img`, at `tileX*16 - ax`, `(tileY+1)*16 - ay`.
- **Fit, no clipping:** a building is drawn on a roomy canvas and measured. While it is wider than its tiles, it leaves things off (barrels, annex, cart, sign…), pulls in canopies, jibs and sails, then narrows. It is then cropped to exactly its footprint: `img.width` is `tiles[0]*16` and `ax` is 0, so neighbours never overlap. It may still rise into the tile behind. `clipped` is true if anything was cut off; the game's `tests/pixels.js` checks that it never is.
- **True pixels:** every pixel is opaque or empty (the outline is one solid colour), and every anchor is a whole pixel. Draw pictures at whole-pixel positions and never scale them.
- **Variety:** comes from structure. The seed picks footprint, roof form (side gable, front gable, hip, shed, cone, battlements), storeys, wall and roof materials, and add-ons. Treehouses vary in trunk, canopy (green, evergreen or autumn), house position, ladder or steps and a second platform. Market stalls vary in canopy (sloped or peaked), stripes, goods on the counter and what stands beside them.
- **Peoples:** `style` is `human`, `dwarf`, `elf` or `orc`. It changes materials, and each people also has its own types:
  - **Elves:** treehouse, elf hall, spire.
  - **Orcs:** yurt, hide hall, watchtower.
  - **Dwarves:** stone hall, forge.

## Flags
Buildings carry no flags in their pictures; the game draws its own (animated) flag sprite. A building that flies one (keep, citadel, some towers) returns `flag: [x, y]`, the foot of its flag pole in the cell's own pixels, on a ridge or tower top. Otherwise `flag` is null. The flag takes no room in the cell (it flies above the picture), so a hall given `spec.fort` always has one. The gallery draws a stand-in flag there.

## Work places and sites
`well`, `minehead`, `lumbershed`, `crane` (a treadwheel crane for quarries), `tent` and `wagon` are building types too.

**Sites** are places on the map nobody builds, and `PX.site({type, env, seed, mat, snow, glow, banner})` draws every one. `PX.SITE_TYPES` lists them under the game's own names:
- `cave`, `ruins` and `shrine`: one tile (16×16), the same result as `PX.building`. `spec.glow` colours a shrine.
- `hideout` and `travelers`: camps, the result of `PX.camp` with `camp: true`. `spec.banner` is the travellers' flag colour.

None of them is in `PX.BUILDING_TYPES`, and `PX.building` refuses them.
- **Top-down only:** the mine, cave, lumber shed and crane.
- **Natural rock:** the cave and mine are clusters of natural boulders, not masonry, shaped by `spec.env`:
  - `grass`: grey rock with grass and moss;
  - `frost`: rock under snow, with icicles over the cave mouth;
  - `desert`: banded sandstone;
  - `swamp`: dark mossy rock, vines and a puddle. `spec.mat` sets their rock (sandstone in the desert), `spec.snow` caps them in the frost, and `spec.stilts` raises any house on posts over a bog.

## Fortification
`spec.fort` (0–3) sets the walls of a keep or citadel: 0 none, 1 a palisade with wooden towers, 2 stone walls, 3 great walls (taller, a tower halfway along each side). On a hall (any building with a roof) a fortification of 1 or more puts a palisade fence round it, its gate on the middle. A hall given `spec.fort` also flies the holding's flag.

## Levels
`spec.lv` (2 or 3) draws a better version of the same building in the same cell: a richer roof, a chimney, more windows and a porch, then a second storey, dormers and lanterns. Work places gain their gear.

## Docks
A pier is drawn without water, to be laid over real water tiles.

## Loading
In a page: `<script src="../engine/pixel.js"></script>`, then `buildings.js`, then `pieces.js`.
