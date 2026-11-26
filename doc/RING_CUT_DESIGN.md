# A fight drawn as a cut of the map

The owner, 2026-11-26: "How about make it into a small battle map square based on what we already have but we use a place as actual place like x * y tiles, like create a copy version of the area and battle in a separate map?", then "I want style 2" (a separate field copying the area), then, seeing a field repainted in the battle art: "I mean the separated should remain the same map detail just a cut version in the battle ring right? Keep all element the same and draw only ring's picture".

**Status:** built 2026-11-26, on by default. Switch: `PREFS.separate` (the developer console's Ring only, `separate on|off`). Code: `gfx/render.js` `RING_CUT`, `RingCut`. Tests: `tests/ringcut.js`, `tests/fightsnap.js`.

## 1. What it is

- **The fight:** a fight on the map as before: the same rules, its men at their map size, its ring, its arrivals, the world running round it (armies riding in, the clock).
- **What is drawn:** the map's picture inside the ring only, every element and every feature as the map draws it (the owner, 2026-11-26: "Can you also include all feature in separated battle?"): the ground, woods, water, roads, buildings, banners and labels, its fires, flags, water and leaping fish live, the fog of what your men do not see; whoever moves inside it, its men and its fallen.
- **What is not:** whoever moves outside the ring (other parties, herds, folk, critters, other fights). Past the ring's edge the dark (`RING_CUT.col`), soft over `RING_CUT.feather` px from `RING_CUT.pad` px past the ring.
- **The still ground** (`FIGHT_SNAP`, `FightSnap`: the ring's ground drawn once and kept) is off since every feature came back: it froze the fires, flags and fish, and saved little. The developer console's Still ground turns it on.

## 2. Measured

30 a side, 844 x 390, headless Chrome, a fight in a village with the map revealed: 15.6 ms a frame ring only against 17.1 the whole map (the drawing 12.3 against 13.8), measured with the fog left out and the ground kept still; with every feature back, about the whole map's less the movers outside the ring. Most of a fight's drawing in a village is each man's depth: what stands in front of him drawn again over him (`depth.js` `worldOverdraw`, about half the frame).

## 3. Tried first (2026-11-26, taken out)

A separate field in the field battle's own art, its grid copied from the map (`CopyBattleSetup`): the battle's update a quarter of the map's, but it looked like a field, not the map. Kept from it: `worldbattle.js` `worldGrid`, the map read into a field's grid (moved out of `WorldBattleArea#terrain`, its behaviour kept).
