# A separate field copied from the map

The owner, 2026-11-26: "How about make it into a small battle map square based on what we already have but we use a place as actual place like x * y tiles, like create a copy version of the area and battle in a separate map?" Offered three ways (a still copy in place, a separate field that copies the area exactly, the old separate field in the style of the place), the owner chose the second: "I want style 2".

Why: a fight on the map costs some 6.6 ms a frame (30 a side, phone-sized screen, headless Chrome), a separate field some 3.6 to 4.1. The battle's update is about four times cheaper off the map (its own small grid, no world round it); the drawing a little cheaper.

**Status:** first cut built 2026-11-26, behind its switch (off by default). Switch: the developer console's Separate field (`separate on|off`, kept in `PREFS.copyfield`). Code: `battle/copyfield.js`; the grid: `battle/worldbattle.js` `worldGrid`. Test: `tests/copyfield.js`.

## 1. What it is

- **Which fights:** a fight met on the map with an army or a beast: `COPY_FIELD.kinds` (party, lord, patrol, caravan, monster). Camps, ruins, outposts, estates, villagers and fights you join stay on the map; sieges, raids, caves and tournaments keep their own.
- **The window:** the map round the fight's middle (`fightArea`), the field's size by its soldiers (`FIELD_SIZES`: small 960 x 544 px is 160 x 91 world px, 10 x 6 tiles; huge 3200 x 1792 is 33 x 19 tiles).
- **The scale:** `COPY_FIELD.scale` 6 field px a world px, as a fight on the map (`WORLD_BATTLE.scale`): a tile is 96 px, 6 x 6 cells.
- **The ground:** `worldGrid`, the same reading of the map a fight on the map uses: water by its drawn depth (shallows wadeable, deep water not), fords, woods, marsh, rock, roads, the height and its steps as walls, the climate, the buildings' footprints. The height counts from the window's lowest ground.
- **What is drawn:** the field's own art (`engine/ground.js`) from that grid; the map's roads as its ways (`worldways.js` `waysOf` segments); the holdings' buildings where they stand, each model drawn `COPY_FIELD.hs` (6) times its size.
- **The fight:** a field battle's. The world waits; your band forms up left, theirs right; a man set down on rock or deep water moves to the nearest open ground; it ends as a field battle does (its result window), back on the map.

## 2. Not yet

- Armies riding in mid-fight, and those near it at its start (a fight on the map takes them in: 82 men against the copy's 61 in the measured fight).
- The armies formed up where they stand on the map (now left and right).
- The fallen left on the map after it.
- The map's climate patches (dirt, sand) and its cliffs drawn; a stream's shallows painted as water, not gravel.
- Its fingerprints: none yet (it is off by default, so none of the old ones move).
