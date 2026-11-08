# Approved wolf artwork

`wolf.png` retains the approved combat master: 108 frames across 14 clips, in 96 × 64 cells. `manifest.json` records clip rows and timings. `wolf-map.png` is a separately painted 16 × 16 walk cycle with eight frames; its metadata is in `map-manifest.json`.

The corrected bite, lunge, snarl and howl use a thin lower jaw hinged at the cheek. The `death_back` slot ends with the legs folded alongside the body and the head sideways, as requested; the name is retained for compatibility. Side-fall and forward-slump variants remain distinct.

Run `python engine/art/wolf/build.py` from the repository root with Pillow installed to rebuild `engine/wolf-data.js`. Rendering needs no Python, image downloads, network access or asynchronous decoding. `engine/wolf.js` supplies cached frames through `PX.beast` and the map art through `PX.beastMap`.

The game renders combat frames at half the master scale with nearest-neighbor pixels. A 64-pixel cell leaves transparent room around animated limbs; the wolf itself stays at the scale of the other animals and 16-pixel people. Three grey coats, allied collars and existing facing rules are preserved. Sit and lie-down clips remain available through `PX.wolf.pose` for tools; the game does not invent new rest mechanics.

Only wild/combat wolves change. Wolf and warg mounts retain their own art. No combat statistics, AI rules, random draws or saved actor fields change.
