# Dwarf portraits — implemented

The portrait generator draws dwarves with a compact, broad skull, square jaw and chin, short midface, low heavy brows, smaller deep-set eyes, a broad nose and stout neck. The racial geometry applies to every compatible face option and both profiles, so a dwarf reads as a dwarf without a beard. Proportion sliders remain active.

Dwarf facial hair has fuller lower silhouettes and broader cheek growth. Full, rounded, forked, braided and bound beards remain visually distinct; their mouth opening remains clear. Male random generation favors these families. Female generation remains unbearded, while manual facial-hair controls stay available.

The change is in the shared `engine/face arts/grayscale/portrait-engine.js`, used by the workshop, character generator and game face maker. Existing seeded recipes are drawn with the revised anatomy without changing their saved choices. The layer order, tint channels, 128-pixel resolution and version-7 recipe format remain unchanged. Human, elf and orc rendering is retained.

Validation: engine layer/compatibility tests, character-generation tests and game `faces` integration. Dwarf tests cover both profiles, every face option, beard mouth clearance and unbearded anatomy. Representative human/elf/orc before/after images are pixel-identical. No simulation fingerprints are re-recorded.

Short-neck refinement: dwarf heads sit eight native pixels closer to the shoulders. All head layers move together by an integer translation; the neck ends at the existing collar. Geometry exports, feature anchors and cap hair-fit masks use the same offset. This reduces exposed neck and overall portrait height without scaling facial features or moving clothing/armor. Both profiles retain a connected neck beneath an unbearded jaw.

Additional facial features: three thicker eyebrow choices (Bushy, Straight, Weathered), Deep-set and Squint eyes, Broad-bridge and Broken noses, and Fan beard, Twin braids and Heavy moustache. All ten stay in the dwarf catalog and are manually selectable. Four presets show the features. Dwarf random generation and the game’s named-character racial pools include them. The heavy moustache maps to a moustache rather than a full beard on battle figures. Tests cover thicker brow coverage with clear pupils, visible irises at eye-size extremes, mouth clearance, race compatibility and live/offline selectors.


Shared hairstyle refinement: all 38 styles are now available to dwarves and every other race. Random dwarf hair favors forge braids and other cultural choices through weights, while non-preferred styles remain possible. Female dwarf hair is no longer forcibly replaced with braids by the game’s appearance rules. Explicitly chosen hairstyles survive normalization, recipe import and race changes. Anatomy and beard preferences remain.
