# Pixel portraits — implemented

The approved portrait style replaces the previous generated appearance in the shared engine, game face maker and world portraits. It uses simpler skin and hair shading, sharp facial contours, and equipment texture at the same two-pixel scale. Portrait canvases remain 128 × 128 with independent grayscale layers and runtime tinting. The original part selections and version-7 recipes remain valid.

Skin follows the existing light direction and face volumes. One intermediate skin shade is merged without changing highlights or the deepest shadow. Ear separation comes from a small contact shadow inside the ear root; the rejected cheek outline is absent. Age lines and short facial hair retain their subtle coverage. Mouth and moustache silhouettes stay readable.

Armor and headwear use two-pixel highlights and shadows. Mail is rebuilt in spaced clusters rather than shrinking fine ring texture. Dwarf rune crests retain distinct motif silhouettes, and the eight engraving options remain available. Hair retains characteristic silhouettes and a visible side part where applicable.

Orc heads and helmets are reduced together to 87.5%, anchored near the collar, while shoulders and body armor keep their original size. Facial features are redrawn from their paths before pixel quantization, with native mouth seams and nostril pixels. Iris masks are clipped to openings below the lids; paired features are checked after the fractional reduction. Exported integer feature anchors, `geometry()` and headwear hair-fit masks use the same placement. Humans, dwarves and elves keep their current head proportions.

Implementation: `engine/face arts/grayscale/portrait-engine.js`. Both generated offline tools are rebuilt with `python "engine/face arts/build.py"`. The game already consumes the shared engine, so no separate portrait image assets or game adapter changes are required.

Validation: existing engine and character-generation checks, new `pixel-tests.html` checks for smaller-head detail and pixel artifacts, game `faces` integration and `structure`, and live/offline workshop checks. Review images and detailed results are exported beside the task report. No simulation fingerprint changes are required.
