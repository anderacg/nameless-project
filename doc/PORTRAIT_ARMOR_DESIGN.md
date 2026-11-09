# Portrait armor expansion — implemented

The generator has four new helmet choices: `horned-helm`, `dwarf-horned-helm`, `dwarf-rune-helm` and `elf-winged-helm`. Horned war helms support humans, dwarves and orcs. The dwarf and elven designs stay in their racial pools. Horns curve outward above the temples; rune helms have a forged crown and engraved brow; elven helms have swept leaf crests.

New armor choices are `dwarf-runic-plate`, `dwarf-forge-plate`, `elf-silver-scale` and `elf-leaf-cuirass`. Dwarf sets use angular, stacked shoulder plates, studs and runes. Elven sets use fine scales, curved leaf plates and veins. Cloth and metal remain separate grayscale/tint layers.

The headgear follows the existing fitting groups and dwarf head offset, keeping pupil anchors visible. Face recipes, gender profiles and proportions remain editable. Five presets demonstrate the new equipment; military and lord role pools include it with racial filtering. The existing game gear-dressing rules register the new part IDs so portrait armor is handled consistently with worn gear. No inventory items or combat stats are added.

Validation covers new metal layers, both horn silhouettes, eye clearance at face-width extremes, racial option pools, distinct artwork, seeded military generation, saved rosters, live workshop selectors and game integration. The recipe schema remains version 7. No simulation fingerprints are re-recorded.
