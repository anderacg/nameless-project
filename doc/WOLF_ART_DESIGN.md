# Wolf art — implemented

The approved lean wolf has pointed ears, a long muzzle, a pale chest ruff, a bushy tail, a bent foreleg and matching leg/paw shading. Bite, lunge, snarl and howl keep the corrected hinged jaw. The revised `death_back` slot rests with its legs folded beside the body; it does not point its paws upward. Three death variants remain available: side, folded-leg and forward slump.

All 116 approved frames are retained in `engine/art/wolf/`: 108 combat frames and eight dedicated map frames. `build.py` generates lossless indexed data for synchronous offline rendering. `engine/wolf.js` caches and selects the art, through the existing `PX.beast` and `PX.beastMap` APIs. The game, wiki and engine gallery load it after the tiger renderer. Other beasts retain their existing renderer. Wolf and warg mounts now adapt the same approved wolf frames.

Combat uses eight-frame idle, walk, run, stalking, bite, lunge, howl and snarl sequences, four hurt frames, and eight frames for each death. Sitting and lying-down art is exposed to tools without adding new gameplay states. Combat is rendered at half master scale with nearest-neighbor pixels; transparent padding keeps extended limbs inside one cell. Native 16 × 16 map drawings are never resampled from the combat art.

`corpseOf` supplies the default side-fall; `deathOf` keeps the existing deterministic three-way selection and attaches the appropriate keyframes. The existing corpse renderer plays them and holds the final pose. No standing sprite is squashed or spun to simulate the wolf dying.

The `wolf` test covers assets, actual game-scale pixel integrity, timing, all death variants and the production corpse draw path. `beasts` checks the larger transparent cell and extended eight-frame pose IDs. `tiger`, `structure`, `deaths`, `beastai` and `actorrules` check compatibility. No simulation fingerprints are re-recorded.

## Mounted wolf — implemented

`PX.mountArt` routes wolves and wargs to `PX.wolf.mount`. The approved idle, walk and run frames are centered inside the existing 32-pixel mount cell, recolored through the mount palettes, and given a saddle seat that follows the actual back. The normal rider drawing supplies the saddle, side cloth, barding, seated legs, bow and weapons. Mutable grids are cloned per draw so gear colors cannot leak between riders. Wargs retain their darker coat. Loose mounts, dismounted wolves and fallen mounts use the same art; the side and belly fallbacks use the authored folded-leg death and lying-down frame. No mount item, movement rule or stat changes.

The `wolfmount` and `figurepieces` suites check rider anchors, walking/running variants, saddle contact, grid isolation and connected composition. `dismount`, `sprites`, `deaths` and `actorrules` check behavior and compatibility.

Rider alignment: wolf and warg riders, seated legs, saddles, cloth, barding and stirrups share a two-pixel forward offset toward the center of the back. Saddle height is sampled at that new location. Other mount types keep their previous placement.
