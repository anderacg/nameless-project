# The map's drawing layers

The owner, 2026-11-28: "Can you make the drawing layer more streamlined and more structured?", then "Define each layer carefully so it easier to maintain and develop further".

**Status:** built 2026-11-28. Code: `prototype/js/gfx/render.js` `WORLD_LAYERS` (the order), `WorldFrame` (a method a layer, its definition above it), `WORLD_ENT` (the fields of a list entry). Tests: `tests/worldlayers.js`. The battle screen's own drawing (`drawBattle`) is not layered this way yet (§7).

## 1. The frame in one picture

A frame of the map is one `WorldFrame` drawn. It runs the layers of `WORLD_LAYERS` in order, bottom to top. A layer is drawn only while its `when` holds, and each is drawn on its own: one that throws is left out, its error told once, the canvas put back, and the rest still drawn.

| Pass | Drawn into | Its layers, bottom to top |
|---|---|---|
| scene | the kept scene | ground, flat, nature, everyone, standing |
| movers | the screen | splashes, figures, flyers, squares |
| sky | the screen | weather, veil |
| light | the screen | grid, night |
| over | the screen | ways, labels, marks |
| mini | the screen | minimap |

Three rules follow from the passes and decide where anything goes.

1. **The scene is remembered.** The fog puts the kept scene back wherever you no longer see. So only what stays where it is belongs in the scene pass: land, buildings, trees, camps. Nothing that moves.
2. **Movers show only in your sight.** They are drawn over the scene, and the veil then covers everything outside your sight with the remembered scene.
3. **The interface is last and untouched.** Everything in `over` is drawn after the fog and the night, at the screen's own pixels, never dimmed.

## 2. The passes

**scene.** Into the kept scene (`memCv`): game pixels on the camera's whole pixels, at the scene's fine pixels. In a fight on the map the scene is kept from a frame before while it holds (`FightSnap`); then `ground` and `flat` are not drawn (their `when`) and `standing` only restores its queues.

**movers.** Onto the screen, over the scene. From here on everything is shifted by the camera's fraction of a pixel, so the map glides.

**sky.** What drifts over the land and what hides it. After this pass nothing of the world shows outside your sight.

**light.** The dark, what lights it, and what you are placing.

**over.** The interface on the map.

**mini.** The minimap, on the screen itself, not shifted.

## 3. Each layer

For each: what it draws, where that comes from, what belongs there, and what does not.

### scene

**ground** (not in a kept fight frame)
- Draws: the painted land by chunks in view (`WorldArt.draw`), then the ground's own life under everything (`drawEnv` layer 0: the water's glints, fish; none in a fight).
- Belongs: anything painted once and kept: land, water, roads, shores. Add it to the chunk's painting (`gfx/worldart.js`, `gfx/worldterrain.js`).
- Does not belong: anything drawn afresh each frame that could be painted once.

**flat** (not in a kept fight frame)
- Draws, in this order: the holdings' land tint (`territory.js` `drawLand` tint), the tracks of who passed (`gfx/tracks.js`), the estates' fields, yards and paths (`structures.js` `drawEstates`).
- Belongs: what lies on the ground with no height, so nothing can stand behind it. Never sorted.
- Does not belong: anything with a height. That goes on the list (`everyone`, with `st`).

**nature**
- Draws: the grass, flat and in the wind, laid at once from one buffer (`worldterrain.js` `terrainEnts`).
- Also puts every tree, rock, bush and log of the chunks in view on the list as standing entries (`propEnt`), to be drawn later by their feet.
- Belongs: the finer land's living part. A new plant with a height is a prop; one with none is grass.

**everyone**
- Draws nothing. Each thing on the map says how it is drawn by pushing an entry onto the frame's list (§4), from its own `draw(ents, cam, V)`.
- Order of the calls: sites, remains, the fallen, parties, beasts, herds, your raid, siege camp and camp, you, armies at gates, workers, townsfolk, hunters, caravans, ships, refugees, road encounters, fights, ambient life on the ground. Two entries as deep keep this order.
- Belongs: a new kind of thing on the map is one more line here plus its own `draw`.
- Does not belong: drawing at once. It would lie under the buildings and over the fog.

**standing**
- First begins the frame's queues (§5) and adds the estates' buildings and the pens' animals to the list (`structures.js` `estateEnts`).
- Draws every entry that stands (`st`): all their shadows in one pass (`drawShadows`), then each by its feet (`y`), up by its ground's lift (`worldterrain.js` `liftDraw`). Then the borders over them (`drawLand` line).
- As each draws, it gives its picture to the depth (`depth.js` `depthPic`), so a figure behind it can be covered later.
- In a kept fight frame nothing is drawn: the queues are restored as they were kept.

### movers

**splashes**
- Draws: ripples and the flyers' shadows, flat under everyone (`ambient.js` `ambientFlat`).
- Belongs: marks on the ground made by movers that everyone walks over.

**figures**
- Draws every list entry that does not stand. In a fight drawn as its ring alone, only those inside it.
- Order: what lies on the ground first (`lay` 0 blood, 1 the fallen), then each by its feet (`y`), then those in flight (`top`).
- Each is drawn (`drawMover`: on a bridge's deck, up by its ground's lift), then what stands in front of it is put back over it (`depth.js` `worldOverdraw`). A tree in front of a man covers him. Over one of yours it fades, and he shows through as a ghost.
- Does not belong: anything that should be remembered under the fog.

**flyers**
- Draws: the birds in the air (`ambient.js` `ambientAir`), a blessing's motes (`gfx/blessing.js`).
- Belongs: what is above every figure and covered by nothing, and is not an entry (an entry that flies uses `top`).

**squares** (not in a fight on the map: the battle draws its own)
- Draws: your men's health squares (`ui/individualhealth.js`), the map's flags (`WorldFlags`).
- Belongs: small marks that ride on a figure and must stay with it.

### sky

**weather**
- Draws: the clouds' shadows, smoke, snow, fireflies (`drawEnv` layer 1), at the scene's fine pixels.
- Before the veil, so it shows only where you see.

**veil**
- Draws, in this order: the remembered scene over all but your sight (`fog.js` `fogMem`), the sky (`WeatherArt.drawMap`, at the screen's own pixels; not in a fight on the map), the climate's air (frost's flakes, the swamp's mist), the fog and the dark of land never seen (`drawWorldFog`; off with the console's no-fog).
- At a finer screen all but the sky go into one picture the scene's size (`overCv`) and are laid once.
- Does not belong: anything that must show on land you do not see. That is `grid` or the `over` pass.

### light

**grid** (only while the grid is on or a building is being placed)
- Draws: the tile grid, the building being placed. Over the fog, so they show on land you do not see.

**night**
- Draws: the dark over everything so far, then every fire's glow (`fire.js` `fireLights`, from `LIGHTQ`), then the fireflies' light (`ambient.js` `ambientGlow`).
- Belongs: a new light is a push into `LIGHTQ` from its entry's drawing, not a new layer.

### over

**ways**
- Draws: the way you walk, your goal's ring, a click's ripple, the ring round what you chase (`worldui.js` `wuiUnder`); then how you travel (concealment, pace, who has seen you).
- Under every label.

**labels**
- Draws: the parties' tags (`BANNERQ`), the holdings' bars (`PLAQUEQ`), the icons of the camps', holdings' and hideouts' places, then every queued text (`TXTQ`).
- Sight rule for texts: a place's shows where you know the land; anyone else's only in your sight.
- Belongs: every name and number on the map. Call `txt` from an entry's drawing; it is queued and drawn here, sharp.

**marks**
- Draws: the quests' and rumours' marks, a foe's strength, the dark past a fight's ring, then the pointer: your goal's arrow, the arrow over what you chase, the brackets round what the pointer is on (`worldui.js` `wuiOver`).

### mini

**minimap** (not in a fight on the map)
- Draws: the land from the tile data and who is on it (`drawWorldMini`).

## 4. An entry of the frame's list

Everything that stands or moves is one entry: a plain object pushed from a `draw(ents, cam, V)`. Its fields are defined once, in `WORLD_ENT`; the test fails if an entry carries any other.

| Field | Meaning |
|---|---|
| `y` | Its feet on the map, px. Required. The order it is drawn in and what covers it. |
| `f` | Its drawing. Required. |
| `x` | Its place across, px. Without it: no lift and no bridge, and it is left out of a fight drawn as its ring alone. |
| `st` | It stands: drawn into the kept scene by `standing`. Otherwise it moves: drawn by `figures`. |
| `sh` | `[picture, x, y]`: its shadow, laid in one pass under all that stands. |
| `fl` | `fl(lift)`: its drawing at its ground's lift with no context saved round it (a prop). |
| `r` | The scene's fine px a prop's kept entry was made at. |
| `lx`, `ly` | The point whose ground lifts it, where that is not its feet. |
| `lay` | It lies on the ground under everyone standing: 0 blood, 1 the fallen. |
| `top` | It flies: drawn after every figure, covered by nothing. |
| `own` | Yours: what covers it fades and it shows through as a ghost. |
| `nf` | It fades nothing that covers it. |
| `loot` | Something to take: its outline shown where it is hidden. |
| `id` | Who it is, for a test or a pick to find its entry. |

## 5. The queues

An entry's drawing does not draw labels, lights, tags or bars itself. It queues them, and a later layer draws them all at once, in the right place in the order.

| Queue | Filled by | Drawn by |
|---|---|---|
| `TXTQ` | `txt` called while an entry draws | labels |
| `LIGHTQ` | an entry that burns | night |
| `BANNERQ` | a party's entry | labels |
| `PLAQUEQ` | a holding's entry | labels |
| `WDEPTH.pics` | `depthPic`, from each standing entry | figures |

## 6. Where a new thing goes

| The new thing | Where |
|---|---|
| Never changes (a kind of ground, a shore) | Paint it into the chunk; `ground` draws it. |
| Lies flat, changes (a field, a trail) | `flat`. |
| Stands still, has a height (a building, a tent, a tree) | An entry with `st`, from its own `draw`, called in `everyone`. |
| Moves (a party, an animal, a cart) | An entry without `st`. |
| Lies on the ground and may be walked over (a body, blood) | An entry with `lay`. |
| Flies | An entry with `top`. |
| A name or a number | `txt` from the entry's drawing. |
| A light | A push into `LIGHTQ` from the entry's drawing. |
| Weather, smoke | `drawEnv` layer 1 (`weather`). |
| Must show on land you do not see | `grid`, or the `over` pass. |
| A button or a pointer mark on the map | `ways`, `labels` or `marks`. |

A new layer is rarely needed. If one is: add a row to `WORLD_LAYERS` at its place in the order, a method of the same name to `WorldFrame` with its definition above it, and a section here. The test checks that the table and the frame agree.

## 7. Left

- The battle screen's drawing (`drawBattle`) is still one function in its own order.
- `tests/worlddepth.js`, the older suite for what covers a figure, throws at its second check on the code before this work too; it is not repaired here.
