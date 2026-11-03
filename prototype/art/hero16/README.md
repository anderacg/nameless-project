# Hero concept, 16x16, 8 directions (held)

The owner's "Company Captain" as a 16x16 sprite: a red cape on his left, a steel pauldron on his right, a brown coat, a gold buckle and shaded hair. No weapon (it is drawn apart). Held, not in the game yet (2026-11-03).

- `hero16_sheet.png`: 128x16, one standing frame per direction: S, SW, W, NW, N, NE, E, SE.
- `hero16_review.png`: 12x preview, and the sprites at real size on grass.
- `draw2.py`: the frames as text grids (one palette letter a pixel, `PAL` in `draw.py`); run `python3 draw2.py` here to rebuild both PNGs. Facing east his right side is toward you, so the pauldron shows on SE, E, NE and the cape on SW, W, NW. Every fill pixel next to the empty gets an outline pixel (`seal`).
- `outline_check.py`: lists outline gaps and stray outline pixels for each frame.

Not done: walk frames, hand anchors for the weapon, and the choice of how it goes in. The game's figures are side-on (`gfx/people.js`, about 44 poses, gear, races, mounts); the options were to restyle the hero inside that template, give him 8 facings everywhere, or use 8 facings on the map only.
