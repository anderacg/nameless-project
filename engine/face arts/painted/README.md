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

Original outline clipping: the original face rig and authored PNG alpha define the boundary. Pixels inside that boundary retain their original RGB and placement; only pixels outside it are discarded. There is no custom jaw/neck silhouette, tapering, erosion or contour smoothing. Upper-neck torso skin shares that boundary above the 94-pixel shoulder line; exposed chest skin remains independent below it. Nose/eyelid skin, age, marks and short stubble also stay inside the face edge, while longer beards retain their own shape. The assembled-layer regression checks these layers together.

Base-component repair (2026-11-13): scalp mapping starts at the actual fitted skin bounds, avoiding the repeated/clamped first-row square above the original crown. Preparation of the five head fields removes embedded ear silhouettes/detail; the separate ear layer supplies ears. The male human field also excludes neck backing outside the existing painted jaw line. Female and male use distinct masters, explaining why the wider male neck backing was more visible. Original source PNGs are retained unchanged; this component preparation runs once per decoded field. Jaw paths/anchors and the lower-jaw material remain original.
