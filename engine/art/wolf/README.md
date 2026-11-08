# Approved wolf artwork

`wolf.png` retains the approved combat master: 108 frames across 14 clips, in 96 × 64 cells. `manifest.json` records clip rows and timings. `wolf-map.png` is a separately painted 16 × 16 walk cycle with eight frames; its metadata is in `map-manifest.json`.

The corrected bite, lunge, snarl and howl use a thin lower jaw hinged at the cheek. The `death_back` slot ends with the legs folded alongside the body and the head sideways, as requested; the name is retained for compatibility. Side-fall and forward-slump variants remain distinct.

Run `python engine/art/wolf/build.py` from the repository root with Pillow installed to rebuild `engine/wolf-data.js`. Rendering needs no Python, image downloads, network access or asynchronous decoding. `engine/wolf.js` supplies cached frames through `PX.beast` and the map art through `PX.beastMap`.

The game renders combat frames at half the master scale with nearest-neighbor pixels. A 64-pixel cell leaves transparent room around animated limbs; the wolf itself stays at the scale of the other animals and 16-pixel people. Three grey coats, allied collars and existing facing rules are preserved. Sit and lie-down clips remain available through `PX.wolf.pose` for tools; the game does not invent new rest mechanics.

Wild/combat wolves and the existing wolf/warg mounts now share the approved wolf artwork. Riders, wolf archers, and darker wargs keep their existing gear and coat palettes. Saddles follow the actual back height; fallen mounts use the authored folded-leg and lying-down poses. The approved source PNGs and timing data remain unchanged.

The alpha variant renders directly from the master into a 60 × 40 canvas, 125% of the regular combat frame size, with nearest-neighbor sampling. It does not enlarge a previously reduced frame. Wild alphas use the `alpha_wolf` kind; wolf/warg mounts use the same enlarged body in a 40 × 36 frame. Alpha pack spawning and statistics belong to the game data and world model, not the art generator.

The approved combat master and runtime pixel data match commit `7ce306d` exactly. Later facial-detail experiments were removed; every wolf and alpha uses this reference.

The alpha renderer projects the reference master’s tiny black nose and amber eye onto nearby occupied pixels when reduction would skip those marks. This preserves the facial features without changing the silhouette.
