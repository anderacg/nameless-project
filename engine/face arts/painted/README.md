# Painted portrait parts

The original `prototype/art/portrait/hum_sword.png` guides the painted pixel-art lighting and material detail. Composition stays frontal, with the current head/body rig and editable version-7 recipes.

`parts-faces.png` and `parts-equipment.png` are unchanged generated source atlases, each containing 25 transparent authored components. `parts-manifest.json` records tight source rectangles and source hashes. The renderer ignores near-transparent background specks. These are component families shared across existing choices, rather than a separately authored image for every selector value.

`painted-engine.js` fits their RGB artwork through the existing geometry into 19 transparent layers. Facial expressions retain continuous eye/mouth parameters; style choices keep their existing silhouette and construction detail. Skin, hair, iris, lips, cloth, metal and headwear remain tintable. Hair and helmet concealment, armor fit, dwarf proportions and reduced orc heads reuse the current rig. Short stubble and ordinary teeth retain the underlying procedural detail. Age and facial marks use the current placement masks to build skin-relative relief. Legacy geometry pixels are unchanged.

Load `../grayscale/portrait-engine.js`, `painted-data.js`, then `painted-engine.js`. Await `PortraitArtwork.ready`; call `PortraitArtwork.render(config,{colors})` for a composite or `PortraitArtwork.build(config,{colors,size:256})` for independent RGBA layers. `composite(p,{visible})` supports layer visibility. Default output is 256 pixels; sizes 128 and 512 are also supported. `fromTemplate` accepts an existing geometry build.

The game uses these bundled local images directly, with no generation service or remote image requests. It retains procedural fallback while images decode, then refreshes already displayed portraits. Recipes and saved character identities remain unchanged.

Open `portrait-workshop-painted.html` for the focused 256-pixel editor: part selectors, proportion controls, seven colors, layer toggles, PNG, RGBA parts sheet and recipe exports. The parent `../portrait-workshop.html` retains the full player reservation, NPC generation, favorites and collection tools; its layer exports also use painted art.

Run `python ../build.py` from this folder to regenerate embedded data and both offline editors. `workshop-adapter.js` bridges the full studio to painted rendering without replacing its character-generation API.

Facial fitting uses one consistent envelope per feature, avoiding column-dependent lip and eyelid distortion. Orc lips retain skin-family color, and the two tusk options use separately exported mirrored ivory canines with pointed tips and root shading. Nose-root RGB blends into the forehead without changing its silhouette or nostrils.

Age and skin marks inherit the local painted face RGB and texture. Bounded crease shadows, small reflected edges and under-eye volume replace fixed grayscale line tints. Freckles and sunspots use restrained skin-relative pigment; pockmarks and healed scars use shallow relief. Marks stay off the eyes and outside transparent skin, retain their individual selectors/layer toggles, and update with skin tint. No image blur is used; shading differences are quantized while the portrait pixel edges remain crisp.

Collar sampling aligns each source material column with the fitted body neckline. Transparent neck openings are skipped before sampling the visible chest, removing the repeated flat strips that appeared below the neck. Clothing and armor share one target collar reference; skin, jaw, neckline masks and body proportions remain unchanged.

Skin edge cleanup: face painting now respects the authored source alpha as well as the fitted rig. A separate lower-jaw/neck silhouette removes the padded secondary rim beneath the chin. Cleanup only removes coverage; it adds no skin outside the previous fit. Short stubble follows the cleaned skin mask, while longer beard silhouettes remain independent. Age and complexion details inherit the final skin containment.

Contour follow-up: the earlier cleanup still retained a broad cheek/jaw strip and joined the neck using rectangles. The jaw now tapers inward below the mouth, and curved side paths join a race/profile-sized neck to the collar. Dwarf short-neck and orc scale placement remain. Review uses identical recipes and magnification side by side; connected-pixel tests alone do not establish visual quality.

Shared skin outline (2026-11-13): the final lower-face alpha receives a small pixel-grid cleanup to remove attached protrusions. Upper-neck torso pixels now use the same face mask up to the 94-pixel shoulder line; exposed chest/harness skin below it remains independent. This closes the missed case where torso skin reappeared outside a trimmed face. Age, marks and short stubble use the cleaned face. The new assembled-layer regression checks these layers together, rather than checking the face alone.
