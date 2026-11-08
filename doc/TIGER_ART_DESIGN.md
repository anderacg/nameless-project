# Tiger art — implemented

The approved tiger uses a broad feline head, white cheek ruff, muscular shoulders, tapered dark stripes, big paws and a ringed tail. The final death falls onto its side, with folded legs and a sideways head. The earlier belly-up and rigid-rotation studies are excluded from gameplay.

The approved 92-frame master and clip timings are in `engine/art/tiger/`. `build.py` generates the lossless synchronous pixel data; `engine/tiger.js` selects and caches frames through the existing `PX.beast` API. Rendering uses nearest-neighbor pixels at half the master's size, alongside the game's 16-pixel people. Combat uses idle, walk, run, stalking, bite, swipe, pounce, roar, hurt and the eight-frame side-fall. The map uses the same art at its smaller scale. Corpses hold the final side-resting frame. The other creatures retain their original renderer.

Pounce timestamps live in a WeakMap owned by the renderer. They add no saved actor fields, random draws, combat-stat changes or fingerprint updates. The existing ability still controls pounce movement and damage.

The focused `tiger` suite covers the assets, animation selection, ability trigger and production corpse drawing. `beasts`, `beastai`, `deaths`, `structure` and `actorrules` check compatibility. The death suite intentionally expects one approved tiger death rather than three random alternatives.
