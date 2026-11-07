# Grayscale procedural portrait workshop v6

Open **portrait-workshop-grayscale.html** directly in a browser. It is entirely offline: no server, installation or PNG assets required. This standalone study is not installed in the game. The parent v3 image kit is unchanged.

All artwork is drawn by JavaScript into separate transparent **128 × 128** canvases. Sources use 32 neutral grayscale values. Most layers use binary alpha; brows, lips, Mature skin lines, short beards and tusks retain eight edge-coverage levels so curved features do not become solid rectangular bars. Color is applied at runtime without altering source layers. Classic drawing detail has been removed; old v4/v5 recipes import into the current drawing style.

## Choices

| Part | Variants |
|---|---:|
| Race starting profile | 4 |
| Face shape | 21 |
| Ear shape (including none) | 10 |
| Hairstyle (including bald) | 38 |
| Eye shape | 19 |
| Eyebrows | 13 |
| Nose | 15 |
| Mouth / expression | 18 |
| Facial hair (including none) | 17 |
| Age | 5 |
| Skin marks (including none) | 9 |
| Clothing | 26 |
| Headwear (including none) | 27 |

New hairstyles include curls, tousled hair, side parts, ponytails, high and low buns, half-up hair, a single braid, an undercut, a topknot and swept-back hair. Mouths include reserved, broad, asymmetric and thin smiles, parted lips and a pout. Additional headwear includes a beret, wrapped hood, headband, veil and fur cap. Each drawable-part option produces distinct source artwork. `gallery.html` shows 63 curated characters.

## Facial shape and symmetry

Eye openings and irises use shared reflected geometry and matched raster coverage across the face. Eyebrow templates reflect from outer to inner on both sides; the broken eyebrow deliberately retains a one-sided gap. Highlights follow one upper-left light source, so shading need not be mirrored. Curved lips, nose tips, eyebrows and softened silhouette corners replace hard polygon points. The scalp follows an elliptical crown instead of a flat top. Hair uses curved outer volumes, curved fringe boundaries and rounded hanging locks; curly and tousled styles retain their own clumps. The neck and clothing share one rounded neckline.

## Reference-inspired parts in the existing style

The reference images inform shapes and garment details; no photographs, generated concept art or external PNGs are loaded by the renderer. Source resolution, pixel shading, grayscale ramp, shared rig, independent layers and tinting stay the same. The established rendering style is retained.

New choices include youthful, soft-heart and strong-jaw faces; softly lidded, naturally wide and deep almond eyes; natural tapered and fuller soft brows; soft and defined nose tips; soft full and relaxed bow lips; and close or scruffy beards. Foreground eyelids keep their explicit occlusion of the iris.

Four compatible hairstyles are loose side braid, loose center part, curly shag and tied-back waves. The swept styles use a rounded forehead opening and grouped highlights rather than a sharp central wedge; natural tapered brows have a gentler arch. New garments are linen chemise, velvet bodice, embroidered doublet and ruffled mail, with metal kept separate from cloth. Draped veil, pearl hood and leaf circlet use the same scalp and pupil anchors.

Seven presets demonstrate the parts: Braided shieldmaiden, Veiled village daughter, Curly young traveler, Cropped household knight, Pearl hood noblewoman, Leaf circlet envoy and Tied back retainer. They remain editable combinations, not flattened reference pictures.

## Hair length and scalp attachment

The hairstyle selector uses **Short**, **Medium**, **Long** and **No hair** groups. Length refers to untied hair, so buns and ponytails belong to Long. `PortraitEngine.hairGroups` exposes the same classification to consumers. The selector shows the styles compatible with the chosen race.

Additional men’s cuts include buzz cut, crew cut, Caesar, textured crop, short quiff, brushed-up hair, curtains, shag, slick side and shoulder-length hair. Race generation uses its own compatible style pool. Tonsure, receding hair and buzz cuts are clipped to the actual scalp; the tonsure opening clears the crown without leaving a detached hair rim.

Eye folds and lower edges no longer use thin separate strokes that can quantize into stray flecks or pale corner dots. Eye whites use a softer shaded range, and iris reflections are smaller and dimmer. Upper eyelids have a separate skin-tinted foreground layer after the iris. The iris mask explicitly excludes lid pixels, so tinting cannot draw it over the upper edge. Eye and iris layers are checked for two connected silhouettes, symmetry, iris containment and correct lid occlusion.

New outfits include doublet, jerkin, tabard, scale armor, lamellar armor, plate, traveler’s coat and embroidered robe. Armor artwork stays on the separate metal layer. New headwear includes arming cap, chaperon, straw hat, feathered cap, coronet, round helm, turban and linen wrap.

## Race-specific parts and generation

Race now controls compatibility across the engine, selectors and recipe import. The table above describes the complete catalog; each race sees its own subset. Switching races retains compatible choices and replaces incompatible ones with racial or safe defaults. No hidden unsupported combination is retained in the renderer.

| Race | New distinctive parts | Restrictions and generation |
|---|---|---|
| Human | Steady eyes, knight crop, guild doublet, heraldic cap | Human faces and ears; no tusks or fantasy ears. Wide shared feature selection. |
| Dwarf | Square dwarf face, bulbous nose, forge braids, bound beard, rune mail, forge helm | Compact/broad faces and rounded ears; male generation favors full and bound beards. |
| Orc | Heavy orc jaw, broad flat nose, two tusk sizes, war crest, chin bristle, hide harness, warband | Orc/pointed ears and broad noses; short/sparse facial hair, no dwarf braid beards. Random generation favors tusks. |
| Elf | High cheekbones, swept pointed ears, slanted eyes, braided crown, leaf mantle, vine diadem | Pointed ears, slender facial features, no facial hair. |

Generic clothing and headwear remain shared. New racial gear and distinctive anatomy stay with their intended race. Female generation starts without facial hair; gender does not restrict allowed manual parts within a race. Race does not force a skin color: the green Orc preview uses a runtime tint.

The compatibility tables are `EXCLUSIVE_PARTS` and `RACE_LIMITS` in `portrait-engine.js`. They are used to derive `PortraitEngine.raceParts`; `partsFor(race, feature)` exposes the available choices. To change the lore (for example, allow bearded elves), edit these tables. Random generation draws directly from each race's pool, with additional racial and gender preferences, and remains deterministic.

```js
const elf = PortraitEngine.startRace('elf', currentConfig);
const allowedEars = PortraitEngine.partsFor('elf', 'ears');
const portrait = PortraitEngine.build({...elf, ears:'elf-swept'});
const orc = PortraitEngine.build({race:'orc', mouth:'heavy-tusks'});
const randomDwarf = PortraitEngine.random(42, 'male', 'dwarf');
// Unsupported input is replaced consistently in build(), normalize() and imports.
const noElfBeard = PortraitEngine.normalize({race:'elf', beard:'full'}).beard; // none
```

Ears remain independent skin-tinted parts behind the face. Closed headwear and draped veils conceal them. Tusks use the neutral teeth layer, curve into tapered tips with soft edge coverage, and are protected from facial-hair overlap. All raw source parts remain grayscale and tintable.

Version 6 recipes include the selected race and its compatible feature choices. Import accepts v4/v5 recipes, supplies Human/normal ear defaults when race/ears are missing, and normalizes incompatible racial combinations.

## Headwear fit types

The headwear selector groups equipment by how it fits the hair:

- **Open:** circlets, crowns and headbands leave hair visible.
- **Caps and helmets:** the crown is tucked beneath the headwear rim; long side and back hair can remain visible.
- **Enclosing:** hoods, mail coifs, wrapped hoods, enclosing veils, linen wraps and pearl hoods conceal both hair layers.
- **Draped:** the draped veil preserves the visible hairline and long front hair, clips it to the face/veil silhouette, and tucks back hair away. It does not apply a horizontal cut to the forehead.

`PortraitEngine.headwearGroups` and `PortraitEngine.headwearRules` expose the same types and fit rules. Saved recipes include the selected `headwearFit` metadata; existing recipes derive it from their headwear choice. Removing headwear, or hiding both headwear layers in the inspector, restores the selected hairstyle. The fitting never modifies raw hair exports.

Mouth corners fade gradually into the skin rather than ending with a hard dark pixel. All mouth variants are checked for a single connected lip shape across every face.

## Profiles

Male and Female provide starting feature combinations on the shared facial rig; Custom preserves the current portrait. Compatible options remain manually editable. Switching profiles preserves seed, age, marks, equipment and colors. Random face follows the selected profile. Female random recipes default to no beard; manual facial hair remains available where the race permits it.

## Independent layers

Drawing order is back hair, back headwear, clothing, armor, **ears**, face/neck, age, skin marks, nose, eye whites, irises, **upper eyelids**, brows, mouth, **teeth / tusks**, front hair, front headwear and facial hair: **18 layers** in total.

Teeth remain neutral when lips are tinted. Mail/metal, cloth and headwear have separate tint channels. Headwear face openings preserve pupil visibility. Headwear uses explicit hair-fit rules in the assembled portrait; individual hair source layers remain complete and exportable. Some hairstyles and features are naturally hidden by equipment or beards.

Each layer uses the same origin `(0, 0)` and facial rig. The inspector, visibility switches and PNG export expose individual parts. Skin marks and age are separate overlays. Mature uses lighter, translucent under-eye and outer-eye curves plus a faint forehead crease. Skin marks render beneath facial features. Both overlays exclude the eye opening and upper lid with a one-pixel safety margin, so scars or spots cannot cover the eyes. Equipment does not redraw the face.

Brow strands and lip shading stay inside their base silhouettes. Lip seams stop short of the corners, and brow tips taper into their curves. The final hair, mouth and brow layers discard detached single-pixel islands; intentional freckles, scars, stubble and equipment details are preserved.

```js
const E = PortraitEngine;
const config = E.startProfile('female', {hair:'single-braid', clothing:'cloak'});
const portrait = E.build({...config, eyes:'upturned', mouth:'reserved-smile'});
const grayscale = E.composite(portrait);
const colored = E.composite(portrait, {
  colors: {...E.colors, skin:'#b88b69', hair:'#45372e', iris:'#687f83'}
});
context.drawImage(colored, x, y);
```

Cache completed portraits rather than rebuilding each animation frame. Seeded generation is reproducible. PNG export is optional; the runtime engine does not load images.

## Short facial hair

Stubble uses a light continuous beard shadow with fine tonal grain; close beard uses denser coverage that follows the cheek line, sideburns and jaw. Both replace scattered dark dots with a coherent facial-hair region, retain skin shading beneath the hair tint, and keep the actual lip pixels clear. Their raw sources stay inside the face silhouette and preserve soft transparency when recolored. Orc chin bristle uses a rounded fading region that follows the chin instead of a rectangular clip; the dwarf bound beard has paired woven sections.

## Editing and export

- `portrait-engine.js`: part drawings, rig, variants, profiles, presets and tinting.
- `workshop.js`, `index.html`, `style.css`: editable controls and presentation.
- `build.py`: embeds those files into the standalone HTML; run `python build.py` after edits.
- `tests.html`: focused checks for symmetry, alignment, distinct artwork, equipment clearance, independent layers, grayscale/alpha, tinting and deterministic generation.
- `examples/`: optional current baseline PNGs and manifest; `examples/medieval/`: 63 preset PNGs and recipes. Historical comparison images elsewhere in this folder are not loaded by the engine.

Exports include the assembled portrait, selected source layer, a **2304 × 128** grayscale atlas, and a v6 JSON recipe with colors, visibility, rig and layer order. Import accepts v4, v5 and v6 recipes; absent fields use current defaults. These are portrait recipes, not game saves.
