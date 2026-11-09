# Dwarf portraits — implemented

The portrait generator draws dwarves with a compact, broad skull, square jaw and chin, short midface, low heavy brows, smaller deep-set eyes, a broad nose and stout neck. The racial geometry applies to every compatible face option and both profiles, so a dwarf reads as a dwarf without a beard. Proportion sliders remain active.

Dwarf facial hair has fuller lower silhouettes and broader cheek growth. Full, rounded, forked, braided and bound beards remain visually distinct; their mouth opening remains clear. Male random generation favors these families. Female generation remains unbearded, while manual facial-hair controls stay available.

The change is in the shared `engine/face arts/grayscale/portrait-engine.js`, used by the workshop, character generator and game face maker. Existing seeded recipes are drawn with the revised anatomy without changing their saved choices. The layer order, tint channels, 128-pixel resolution and version-7 recipe format remain unchanged. Human, elf and orc rendering is retained.

Validation: engine layer/compatibility tests, character-generation tests and game `faces` integration. Dwarf tests cover both profiles, every face option, beard mouth clearance and unbearded anatomy. Representative human/elf/orc before/after images are pixel-identical. No simulation fingerprints are re-recorded.
