# Painted portrait parts

The original `prototype/art/portrait/hum_sword.png` guides the painted pixel-art lighting and material detail. Composition stays frontal, with the current head/body rig and editable version-7 recipes.

`parts-faces.png` and `parts-equipment.png` are unchanged generated source atlases, each containing 25 transparent authored components. `parts-manifest.json` records tight source rectangles and source hashes. The renderer ignores near-transparent background specks. These are component families shared across existing choices, rather than a separately authored image for every selector value.

`painted-engine.js` fits their RGB artwork through the existing geometry into 19 transparent layers. Facial expressions retain continuous eye/mouth parameters; style choices keep their existing silhouette and construction detail. Skin, hair, iris, lips, cloth, metal and headwear remain tintable. Hair and helmet concealment, armor fit, dwarf proportions and reduced orc heads reuse the current rig. Short stubble, age, scars and teeth retain the underlying procedural detail. Legacy geometry pixels are unchanged.

Load `../grayscale/portrait-engine.js`, `painted-data.js`, then `painted-engine.js`. Await `PortraitArtwork.ready`; call `PortraitArtwork.render(config,{colors})` for a composite or `PortraitArtwork.build(config,{colors,size:256})` for independent RGBA layers. `composite(p,{visible})` supports layer visibility. Default output is 256 pixels; sizes 128 and 512 are also supported. `fromTemplate` accepts an existing geometry build.

The game uses these bundled local images directly, with no generation service or remote image requests. It retains procedural fallback while images decode, then refreshes already displayed portraits. Recipes and saved character identities remain unchanged.

Open `portrait-workshop-painted.html` for the focused 256-pixel editor: part selectors, proportion controls, seven colors, layer toggles, PNG, RGBA parts sheet and recipe exports. The parent `../portrait-workshop.html` retains the full player reservation, NPC generation, favorites and collection tools; its layer exports also use painted art.

Run `python ../build.py` from this folder to regenerate embedded data and both offline editors. `workshop-adapter.js` bridges the full studio to painted rendering without replacing its character-generation API.
