# Pixel portraits — implemented

Reference art pass (2026-11-12): the original `prototype/art/portrait/hum_sword.png` guides lighting, pixel detail and material color. Composition stays front-facing: the same rig, framing, head proportions, editable layers and version-7 recipes. Native skin, hair and garment contours preserve finer detail; facial planes have deeper sockets and clear cheek highlights. Helmet silhouettes keep their established two-pixel grid, blended contour and open vision slits. Material tints use warm highlights for skin/cloth and cool reflections for steel, with cool shadows and monotonic brightness for extreme colors. This replaces the earlier coarse skin/hair treatment described below. No reference image is loaded at runtime. Both offline workshop bundles are rebuilt from the shared engine.


The approved portrait style replaces the previous generated appearance in the shared engine, game face maker and world portraits. It uses simpler skin and hair shading, sharp facial contours, and equipment texture at the same two-pixel scale. Portrait canvases remain 128 × 128 with independent grayscale layers and runtime tinting. The original part selections and version-7 recipes remain valid.

Skin follows the existing light direction and face volumes. One intermediate skin shade is merged without changing highlights or the deepest shadow. Ear separation comes from a small contact shadow inside the ear root; the rejected cheek outline is absent. Age lines and short facial hair retain their subtle coverage. Mouth and moustache silhouettes stay readable.

Armor and headwear use two-pixel highlights and shadows. Mail is rebuilt in spaced clusters rather than shrinking fine ring texture. Dwarf rune crests retain distinct motif silhouettes, and the eight engraving options remain available. Hair retains characteristic silhouettes and a visible side part where applicable.

Orc heads and helmets are reduced together to 87.5%, anchored near the collar, while shoulders and body armor keep their original size. The widest `orc-heavy` skull used by war infantry has a stronger 75% scale: its original broad skull and enclosed cheek guards still appeared too large at 87.5%. Other orc faces retain the approved 87.5% scale. Facial features are redrawn from their paths before pixel quantization, with native mouth seams and nostril pixels. Iris masks are clipped to openings below the lids; paired features are checked after the fractional reduction. Exported integer feature anchors, `geometry()` and headwear hair-fit masks use the same placement. Humans, dwarves and elves keep their current head proportions.

Implementation: `engine/face arts/grayscale/portrait-engine.js`. Both generated offline tools are rebuilt with `python "engine/face arts/build.py"`. The game already consumes the shared engine, so no separate portrait image assets or game adapter changes are required.

Validation: existing engine and character-generation checks, new `pixel-tests.html` checks for smaller-head detail and pixel artifacts, game `faces` integration and `structure`, and live/offline workshop checks. Review images and detailed results are exported beside the task report. No simulation fingerprint changes are required.


Orc facial anatomy: every compatible orc face now keeps a broader chin and a rounded lower jaw, a heavier low brow ridge, a flattened broad nose tip with paired nostrils, a weightier lower lip and taller lower tusks. Changes apply to the race rather than only named presets. Eye styles, nose variants, mouth choices and proportion sliders remain distinct and editable. Head/helmet scales and shoulder proportions stay at their approved values. Non-orc drawing paths remain unchanged.


Approved orc reference study: the jaw now uses a curved lower contour, with angular cheekbone planes, narrower eyes, a spiked War crest mohawk and shaved sides. All healthy orc part silhouettes mirror across the canvas center; directional shading stays. Configured scars, a broken brow and a crooked nose remain asymmetric. Facial options stay distinct and editable. The rejected solid chin patch is absent; existing short-bristle coverage remains subtle.

The renderer now exports 19 layers, adding independently tinted torso skin beneath eight new leather/harness options. Six outfits have a full leather underlayer; bare crossed/ring harnesses are separate choices. Harness straps reach both shoulder crests, and clothing/hardware follow the body envelope. New `orc-tests.html` checks all kits, 128 fit/coverage combinations, 32 bare-harness shoulder attachments, 48 eye-size combinations and injury exceptions. See `doc/ORC_PORTRAIT_DESIGN.md`.


Shared hairstyles: every race can select all 38 hairstyles. Race-specific hairstyle associations are preferences in seeded random generation, not compatibility restrictions. The shared generator exposes the preference lists, preserves manual choices and retains the existing random draw count for non-hair features. Game appearance rules no longer force dwarf female hair into a small braid pool, and the face maker preserves a chosen cut on race changes. `hair-tests.html` covers availability, rendering, preferences, random reachability and preservation.
