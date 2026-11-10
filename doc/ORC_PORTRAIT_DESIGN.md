# Orc portraits — implemented

The shared portrait engine now uses the approved reference study: a rounded lower jaw, angular cheekbones, heavier brow ridge, narrow readable eyes, broad flattened nose and inward-curving lower tusks. War crest hair is a taller spiked mohawk with shaved sides. Head scale remains 75% for `orc-heavy` infantry and 87.5% for other orc faces; shoulders stay broad. The rejected dark chin patch is absent. Existing subtle short-bristle facial hair remains available.

Healthy orc part silhouettes and feature patterns mirror about the canvas center, with directional shading retained. Scars, a selected broken brow and a crooked nose retain deliberate injury asymmetry. Exported eye/brow anchors follow the mirrored placement. Nose, eye, brow, mouth, tusk, hair and facial-hair choices remain distinct and editable.

Eight new leather and harness outfits appear in selectors and eight editable presets; first made for orcs, every race may wear them (the owner, 2026-11-10: "leather or harness can be wore by everyone"; the torso skin takes each race's tint). Laced vest, studded leather, crossed harness over leather, ring harness over leather, layered hide armor and leather with shoulder guards cover the chest and shoulders. Bare crossed and ring harnesses are separate choices. Harness straps meet the shoulder tops rather than ending on the upper chest. Rings, buckles and studs remain attached to leather.

A Torso source layer adds skin beneath the outfits using the existing skin tint. Clothing carries leather and Armor carries metal. Body, cloth and hardware share an origin and body envelope; the torso bridges the smaller neck cleanly and contact shadows seat straps and buckles. The 19-layer atlas is 2432 by 128 pixels. Existing outfits have an empty torso layer. Existing version-7 recipes and editable colors remain valid.

The game already consumes the shared renderer. Worn-gear classification recognizes the eight new kits, and compatible NPC role pools include appropriate outfits. Workshop layer exports and both generated offline tools include the same art. No separate sprite PNGs are required.

Validation: engine layer/catalog tests, character generation, `pixel-tests.html`, `orc-tests.html`, game faces/structure, live/offline selectors and exports, and visual review of the final production renderer. Dedicated orc checks cover all eight outfits, 128 fit/coverage cases, 32 shoulder attachments, 48 eye-size cases and injury exceptions. No simulation fingerprint re-records are part of this change.
