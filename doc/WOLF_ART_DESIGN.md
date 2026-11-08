# Wolf art — implemented

The approved lean wolf has pointed ears, a long muzzle, a pale chest ruff, a bushy tail, a bent foreleg and matching leg/paw shading. Bite, lunge, snarl and howl keep the corrected hinged jaw. The revised `death_back` slot rests with its legs folded beside the body; it does not point its paws upward. Three death variants remain available: side, folded-leg and forward slump.

All 116 approved frames are retained in `engine/art/wolf/`: 108 combat frames and eight dedicated map frames. `build.py` generates lossless indexed data for synchronous offline rendering. `engine/wolf.js` caches and selects the art, through the existing `PX.beast` and `PX.beastMap` APIs. The game, wiki and engine gallery load it after the tiger renderer. Other beasts retain their existing renderer. Wolf and warg mounts now adapt the same approved wolf frames.

Combat uses eight-frame idle, walk, run, stalking, bite, lunge, howl and snarl sequences, four hurt frames, and eight frames for each death. Sitting and lying-down art is exposed to tools without adding new gameplay states. Combat is rendered at half master scale with nearest-neighbor pixels; transparent padding keeps extended limbs inside one cell. Native 16 × 16 map drawings are never resampled from the combat art.

`corpseOf` supplies the default side-fall; `deathOf` keeps the existing deterministic three-way selection and attaches the appropriate keyframes. The existing corpse renderer plays them and holds the final pose. No standing sprite is squashed or spun to simulate the wolf dying.

The `wolf` test covers assets, actual game-scale pixel integrity, timing, all death variants and the production corpse draw path. `beasts` checks the larger transparent cell and extended eight-frame pose IDs. `tiger`, `structure`, `deaths`, `beastai` and `actorrules` check compatibility. No simulation fingerprints are re-recorded.

## Mounted wolf — implemented

`PX.mountArt` routes wolves and wargs to `PX.wolf.mount`. The approved idle, walk and run frames are centered inside the mount cell, recolored through the mount palettes, and given a saddle seat that follows the actual back. The normal rider drawing supplies the saddle, side cloth, barding, seated legs, bow and weapons. Mutable grids are cloned per draw so gear colors cannot leak between riders. Wargs retain their darker coat. Loose mounts, dismounted wolves and fallen mounts use the same art; the side and belly fallbacks use the authored folded-leg death and lying-down frame. No mount item, movement rule or stat changes.

The `wolfmount` and `figurepieces` suites check rider anchors, walking/running variants, saddle contact, grid isolation and connected composition. `dismount`, `sprites`, `deaths` and `actorrules` check behavior and compatibility.

Rider alignment: wolf and warg riders, seated legs, saddles, cloth, barding and stirrups share a forward offset toward the center of the back. Saddle height is sampled at that new location. Other mount types keep their previous placement.


## Alpha wolves — implemented

An `alpha_wolf` is 25% larger than the regular wolf, using every approved animation and all three death sequences with nearest-neighbor pixels. Its base health is 52 and damage 10, versus 26 and 6 for a regular wolf. It uses wolf pack tactics, frost/fire resistances and a heavier body mass.

At birth, about 25% of wild wolf packs receive one alpha in place of an ordinary wolf. The alpha occupies the leader position in the map formation. Pack counts, encounter strength, survivor lists, wolf pelts and XP include its actual unit type. The saved `alpha` flag preserves a living leader and clears when it dies; loading or adding ordinary wolves cannot bring it back. Existing packs stay as saved. Alpha selection is derived from the seeded lair location without advancing either RNG stream.

Wolf Riders, Wolf Archers and Warg Raiders now ride alpha-sized bodies. Their mount frame is 40 × 36 pixels, with a six-pixel rider/tack offset in that expanded frame and a saddle sampled from the actual back. Loose and fallen mounts use the same body size. Other mounts retain their existing dimensions and placement.

Tests: `alphawolf` covers spawning, mixed rosters, persistence, map leadership, encounter rewards, combat stats and mount size. `wolfmount` checks the expanded frame and saddle contact. No fingerprint values are re-recorded.

Reference restoration (2026-11-08): the combat master and indexed runtime data are restored byte-for-byte from `7ce306d`, as requested. This locks the approved muzzle, ears, fur, legs and death poses. The later detail/redesign experiments are not the game artwork. Alpha combat frames now render once from that same 96 × 64 master into their 60 × 40 canvas; they no longer enlarge the already reduced 48 × 32 regular wolf. Both paths retain nearest-neighbor sampling. Alpha leader stats, pack spawning and persistence, larger rider mounts and centered saddles remain implemented. `alphawolf` checks pixel integrity across all 108 directly rendered alpha frames.

The alpha renderer projects the reference master’s tiny black nose and amber eye onto nearby occupied pixels when reduction would skip those marks. This preserves the facial features without changing the silhouette.
