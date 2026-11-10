# Grayscale procedural portrait workshop v7

Open **portrait-workshop-grayscale.html** directly in a browser. It is entirely offline: no server, installation or PNG assets required. The same drawing engine is shared by the in-game face maker. The parent v3 image kit is unchanged.

All artwork is drawn by JavaScript into separate transparent **128 × 128** canvases. The source drawings use 32 neutral grayscale values before the pixel treatment reduces shading by part. Final facial and equipment contours use binary alpha; Mature skin lines and short beards retain subtle edge coverage. Color is applied at runtime without altering source layers. Classic drawing detail has been removed; old v4/v5/v6 recipes import into the current drawing style.

## Pixel style and head proportions

The shared renderer now applies the approved pixel treatment to every race. Skin, hair and equipment use two-pixel clusters on the 128-pixel canvas. Skin retains the source lighting with one intermediate tone merged; equipment keeps its silhouette, broad highlights and legible engravings. Eyes, brows, nose, mouth and teeth retain native-pixel contours. Ear separation is a small contact shadow inside the ear root, without a cheek outline. Subtle age lines and short beards keep their coverage rather than disappearing in the simplification.

Orc heads and headwear are 87.5% of their original size; the widest `orc-heavy` skull used by war infantry is 75%. Shoulders and armor retain their size. Eyes, brows, noses, mouths and teeth are redrawn from their paths at the smaller size; mouth seams and nostrils keep a minimum readable pixel. Paired eye masks are checked after reduction, and exported integer feature anchors match `geometry()`. Hair-fit masks use the same head placement. Every existing part remains selectable; recipes, tint channels and the version-7 format are unchanged.

Orc facial anatomy has a rounded lower jaw, angular cheekbones, heavier brow relief, a flatter broad nose, stronger lower lip and inward-curving lower tusks. Narrow eye openings retain readable pupils; the War crest style has taller spikes and shaved sides. Healthy part shapes mirror about the canvas center while directional shading remains. Selected scars, broken brows and crooked noses preserve injury asymmetry. The smaller skull sizes remain.

Run `pixel-tests.html` for smaller-head facial detail, helmet clearance, tusks, uniform pixel scale and detached-pixel checks. `orc-tests.html` covers the approved anatomy, mirrored parts, injuries, new armor, coverage and shoulder attachments. `tests.html` and `character-tests.html` continue to cover part independence, all options and saved recipes. See `../../../doc/PIXEL_PORTRAIT_DESIGN.md`.

## Choices

| Part | Variants |
|---|---:|
| Race starting profile | 4 |
| Face shape | 21 |
| Ear shape (including none) | 10 |
| Hairstyle (including bald) | 38 |
| Eye shape | 21 |
| Eyebrows | 16 |
| Nose | 17 |
| Mouth / expression | 18 |
| Facial hair (including none) | 20 |
| Age | 5 |
| Skin marks (including none) | 9 |
| Clothing | 45 |
| Headwear (including none) | 37 |

New hairstyles include curls, tousled hair, side parts, ponytails, high and low buns, half-up hair, a single braid, an undercut, a topknot and swept-back hair. Mouths include reserved, broad, asymmetric and thin smiles, parted lips and a pout. Additional headwear includes a beret, wrapped hood, headband, veil and fur cap. Each drawable-part option produces distinct source artwork. `gallery.html` shows 92 curated characters.

## Facial shape and symmetry

Eye openings and irises use shared reflected geometry and matched raster coverage across the face. Eyebrow templates reflect from outer to inner on both sides; the broken eyebrow deliberately retains a one-sided gap. Highlights follow one upper-left light source, so shading need not be mirrored. Curved lips, nose tips, eyebrows and softened silhouette corners replace hard polygon points. The scalp follows an elliptical crown instead of a flat top. Hair uses curved outer volumes, curved fringe boundaries and rounded hanging locks; curly and tousled styles retain their own clumps. The neck and clothing share one rounded neckline.

## Reference-inspired parts in the existing style

The reference images inform shapes and garment details; no photographs, generated concept art or external PNGs are loaded by the renderer. Source resolution, pixel shading, grayscale ramp, shared rig, independent layers and tinting stay the same. The established rendering style is retained.

New choices include youthful, soft-heart and strong-jaw faces; softly lidded, naturally wide and deep almond eyes; natural tapered and fuller soft brows; soft and defined nose tips; soft full and relaxed bow lips; and close or scruffy beards. Foreground eyelids keep their explicit occlusion of the iris.

Four compatible hairstyles are loose side braid, loose center part, curly shag and tied-back waves. The swept styles use a rounded forehead opening and grouped highlights rather than a sharp central wedge; natural tapered brows have a gentler arch. New garments are linen chemise, velvet bodice, embroidered doublet and ruffled mail, with metal kept separate from cloth. Draped veil, pearl hood and leaf circlet use the same scalp and pupil anchors.

Seven presets demonstrate the parts: Braided shieldmaiden, Veiled village daughter, Curly young traveler, Cropped household knight, Pearl hood noblewoman, Leaf circlet envoy and Tied back retainer. They remain editable combinations, not flattened reference pictures.

## Hair length and scalp attachment

The hairstyle selector uses **Short**, **Medium**, **Long** and **No hair** groups. Length refers to untied hair, so buns and ponytails belong to Long. `PortraitEngine.hairGroups` exposes the same classification to consumers. All 38 hairstyles are available to every race and profile, including knight crop, forge braids, mohawk / war crest, braided crown and tonsure. Switching race and importing recipes preserve the chosen hairstyle.

Additional men’s cuts include buzz cut, crew cut, Caesar, textured crop, short quiff, brushed-up hair, curtains, shag, slick side and shoulder-length hair. Race generation uses the shared style catalog with weighted preferences. Tonsure, receding hair and buzz cuts are clipped to the actual scalp; the tonsure opening clears the crown without leaving a detached hair rim.

Eye folds and lower edges no longer use thin separate strokes that can quantize into stray flecks or pale corner dots. Eye whites use a softer shaded range, and iris reflections are smaller and dimmer. Upper eyelids have a separate skin-tinted foreground layer after the iris. The iris mask explicitly excludes lid pixels, so tinting cannot draw it over the upper edge. Eye and iris layers are checked for two connected silhouettes, symmetry, iris containment and correct lid occlusion.

New outfits include doublet, jerkin, tabard, scale armor, lamellar armor, plate, traveler’s coat and embroidered robe. Armor artwork stays on the separate metal layer. New headwear includes arming cap, chaperon, straw hat, feathered cap, coronet, round helm, turban and linen wrap.

## Race-specific parts and generation

Race now controls compatibility across the engine, selectors and recipe import. The table above describes the complete catalog; each race sees its own subset of anatomy and equipment. Hair is shared in full. Switching races retains compatible choices and replaces incompatible ones with racial or safe defaults. No hidden unsupported combination is retained in the renderer.

| Race | New distinctive parts | Restrictions and generation |
|---|---|---|
| Human | Steady eyes, knight crop, guild doublet, heraldic cap | Human faces and ears; no tusks or fantasy ears. Wide shared feature selection. |
| Dwarf | Square dwarf face, bulbous nose, forge braids, bound beard, rune mail, forge helm | Compact/broad faces and rounded ears; male generation favors full and bound beards. |
| Orc | Heavy orc jaw, broad flat nose, two tusk sizes, war crest, chin bristle, hide harness, warband | Orc/pointed ears and broad noses; short/sparse facial hair, no dwarf braid beards. Random generation favors tusks. |
| Elf | High cheekbones, swept pointed ears, slanted eyes, braided crown, leaf mantle, vine diadem | Pointed ears, slender facial features, no facial hair. |

Every hairstyle remains shared. Generic clothing and headwear remain shared. New racial gear and distinctive anatomy stay with their intended race. Female generation starts without facial hair; gender does not restrict allowed manual parts within a race. Race does not force a skin color: the green Orc preview uses a runtime tint.

The compatibility tables are `EXCLUSIVE_PARTS` and `RACE_LIMITS` in `portrait-engine.js`. They are used to derive `PortraitEngine.raceParts`; `partsFor(race, feature)` exposes the available choices. To change the lore (for example, allow bearded elves), edit these tables. Random generation draws compatible anatomy and equipment from each race's pool and remains deterministic. Hair always comes from the shared catalog; `PortraitEngine.hairPreferences` exposes the favored styles. Preferred styles have four times the baseline weight. Female random generation adds a two-times preference for its usual long/tied styles, without excluding any other cut. The random stream still consumes the same number of draws, so non-hair choices retain their seeded sequence.

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

Version 7 recipes include the selected race and its compatible feature choices. Import accepts v4/v5/v6 recipes, supplies Human/normal ear defaults when race/ears are missing, and normalizes incompatible racial combinations.

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

Drawing order is back hair, back headwear, torso skin, clothing, armor, **ears**, face/neck, age, skin marks, nose, eye whites, irises, **upper eyelids**, brows, mouth, **teeth / tusks**, front hair, front headwear and facial hair: **19 layers** in total.

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
- `portrait-generation.js`: player-face reservations, seeded generation, preset pools, persistent rosters and diagnostic checks.
- `workshop.js`, `studio.js`, `index.html`, `style.css`: editable controls and presentation.
- `character-tests.html`: focused character-generation and save/restore checks.
- `build.py`: embeds those files into the standalone HTML; run `python build.py` after edits.
- `tests.html`: focused checks for symmetry, alignment, distinct artwork, equipment clearance, independent layers, grayscale/alpha, tinting and deterministic generation.
- `examples/`: optional current baseline PNGs and manifest; `examples/medieval/`: 63 earlier preset PNGs and recipes, plus `examples/soldiers/` with the 12 soldier portraits. Historical comparison images elsewhere in this folder are not loaded by the engine.

Exports include the assembled portrait, selected source layer, a **2432 × 128** grayscale atlas, and a v7 JSON recipe with colors, visibility, rig and layer order. Import accepts v4, v5, v6 and v7 recipes; absent fields use current defaults. These are portrait recipes, not game saves.


## Character Studio controls

Eight bounded integer adjustments tune face width, jaw width, eye spacing/size, nose width, mouth width, ear size and hair volume on the shared rig. Zero preserves the approved v6 drawings exactly. Older recipes receive zero adjustments. These are deliberately small changes to keep assembled parts aligned.

Lock complete parts or individual adjustments before generating 12 variations. Race and starting profile stay fixed; proportion randomization is optional. Locks apply to player variations, not independent NPC generation. Pin a before snapshot, inspect individual source layers and use **Check parts** for detached-pixel, facial-anchor, iris/lid and overlay checks. These checks are diagnostics, not comprehensive artistic judgments.

Save named favorites with an optional role tag. The collection contains the current recipe, player reservation, favorites, NPCs, variations, locks, comparison snapshot and generation settings. Browser storage restores it when available; export a JSON collection for a portable backup. NPC recipes and contact-sheet PNGs can also be exported separately. Hiding layers is for inspection; restore every layer before reserving a player or saving a favorite.

## Game-facing character API

Load `portrait-engine.js`, then `portrait-generation.js`. No workshop code or PNG files are needed at runtime. The runnable [integration example](examples/game-integration.html) imports a player recipe, creates eight lords, and exports/restores their world portrait data.

```js
const C = PortraitCharacters;
// playerRecipe is the studio's exported player JSON.
const roster = new C.Roster({seed: worldSeed, player: playerRecipe});
const lord = roster.create({
  id: 'lord-001', race: 'dwarf', profile: 'male', role: 'lord',
  mode: 'mixed', presets: savedPresets
});
// Existing IDs return the saved recipe; drawing never rerolls the face.
context.drawImage(roster.portrait(lord.id), x, y);
const worldPortraitData = roster.export(); // Include this in the game save.
const restored = C.Roster.restore(worldPortraitData);
```

Use stable game IDs for named lords, heroes, bandits and companions. Create the roster after player creation, then store its full export with the world save. Cache the roster rather than constructing it during draw calls. `get(id)` and `player` return copies; `portrait(id)` returns the cached canvas, which callers should treat as read-only. Seeds and the same creation order reproduce results. Collision rejection depends on the existing roster, so a seed alone is not a substitute for saved recipes. Keep IDs and recipes when loading a game or changing generation pools.

`generateNPCs({player, existing, count, seed, race, profile, role, mode, presets})` is the batch interface (1–128 per call). Supported roles are lord, guard, villager, wanderer, bandit, companion, soldier, infantry, archer and cavalry. Random mode combines race-compatible features with bounded proportions and role-based equipment. Preset mode uses exact eligible faces; built-in presets are filtered by race, profile and role clothing, while user favorites can specify `roles: ['lord']` or `roles: []` for any role. Mixed mode combines both. All modes compare against the player and existing roster.

The core identity uses actual face geometry, eye family/spacing/size and nose type/width. Player exclusion requires two differing core groups and at least one different major part; changing only sliders, seed, hair, beard, expression, skin marks, age, colors or equipment cannot bypass it. Exact core identities are unique within a roster; visual resemblance between different identities is still possible. A character creator that changes the player after world creation must revalidate the roster or regenerate conflicting NPCs. The studio refuses a conflicting new player reservation.

Generation has finite retries and never silently falls back to a clone. Handle `GenerationError.code`, notably `PRESET_POOL_EXHAUSTED`, `FACE_POOL_EXHAUSTED`, `PLAYER_REQUIRED`, `DUPLICATE_ID` and `SAVED_FACE_CONFLICT`. Add more eligible presets or use Mixed/Random when a strict preset pool is too small. Imported v7 rosters are revalidated; v4–v6 individual portrait recipes remain accepted with zero adjustments. Studio collection format version 1 is separate from engine recipe/roster version 7.

Source artwork remains 19 independent grayscale canvases with runtime tinting. Race palettes are editable defaults, not forced skin colors. The game consumes this shared renderer through `prototype/js/ui/faces.js`; workshop PNG exports remain optional.


## Soldier presets and equipment

The preset selector has a **Soldiers · infantry, archers & cavalry** group: three editable soldier recipes for each race (12 total). They include Vale foot soldier/bow guard/mounted knight, Dwarf shield guard/crossbow guard/mounted retainer, Orc war infantry/bow scout/mounted reaver, and Elf spear guard/longbow sentinel/mounted warden. These are portrait equipment archetypes; they do not add combat units or change game stats.

Seven new armor choices are padded jack, leather with mail sleeves, coat of plates, steel cuirass, Dwarf iron guard, Orc lamellar and Elf leaf mail. Cloth/leather stays on the Clothing layer; metal stays on the Armor layer and its metal tint. The padded jack intentionally has no metal pixels. Cuirass and Dwarf iron guard include articulated shoulder plates; coat-of-plates rivets remain over a fabric covering. The racial sets are restricted to their intended race; shared armor works with every race.

Six new face-revealing helmets are open bascinet, sallet, ridge helm, Dwarf guard helm, Orc war helm and Elf guard helm. Enclosing fit conceals hair and ears while preserving the chosen hairstyle in the recipe and raw exports. The face and facial features remain separate; these helmets leave eye anchors visible. Headwear retains its existing independent tint; choose a steel headwear tint to match armor, or another material color.

`PortraitEngine.soldierPresets` exposes the 12 recipes and their role tags; `soldierEquipment.armor` and `.helmets` expose the new part names. `PortraitCharacters` accepts `role: 'soldier'`, `'infantry'`, `'archer'` or `'cavalry'` for random, preset and mixed generation. Preset pools respect those role tags, race compatibility and the player reservation. Random soldiers use the corresponding equipment pool while retaining independent facial generation. As with other presets, a sufficiently similar player face may exclude some choices; preset pools remain finite.

```js
const infantry = roster.create({id: 'guard-042', race: 'human', role: 'infantry'});
const elfArcher = roster.create({id: 'archer-017', race: 'elf', role: 'archer'});
```

Open `soldier-tests.html` for focused checks of the added presets, eye clearance, layer independence, grayscale artwork, race rules and soldier NPC generation. `examples/soldiers/` contains current tinted PNG previews and editable recipes; runtime generation does not load them.


## Dwarf face redesign

Dwarf race recipes now use a compact skull, wider square jaw, broad chin and stout neck, including shared face options and unbearded portraits. The shorter nose-to-mouth spacing, low heavy brow ridge, smaller eye openings and broader nose distinguish the anatomy without requiring facial hair. Width and feature sliders still work on top of the racial proportions.

Full dwarf beards have broader lower masses and textured side growth; rounded, full, forked, braided and bound options remain distinct and preserve the lip opening. Male random generation favors the full beard families. Female random generation keeps no beard, and all compatible manual beard choices remain available. Existing recipes keep their choices and seed; the revised geometry is applied when drawing them. Other races retain their renderer.

`tests.html` covers dwarf proportions for both profiles, all compatible face options, beard mouth clearance and unbearded female generation. `character-tests.html` covers deterministic generation and roster persistence. No external artwork or new recipe fields are required.

Dwarf heads sit lower toward the shoulders to keep the visible neck short. The head, hair, beard and headwear move together by eight native pixels; the neck remains joined to the original collar. Exported geometry/anchors and cap hair masks match the new position. Clothing, armor and other races retain their placement.


## Horned helmets and cultural armor

Eight new selectable parts add four helmets and four armor sets:

- Horned helm for humans, dwarves and orcs; dwarf horned helm and rune helm for dwarves; winged helm for elves.
- Dwarf runic plate and forge plate: broad segmented pauldrons, thick plates, studs and engraved runes.
- Elven silver scale and leaf cuirass: overlapping fine scales, swept leaf plates and curved veins.

The armor stays on the tintable metal layer, with cloth beneath it. Headwear keeps its independent tint; the source remains grayscale. Helmet fit groups control hair and ear concealment, leave the pupils visible and respect the lowered dwarf head placement. Female and male profiles can use the same compatible equipment.

Five editable presets demonstrate the new gear. Military and lord generation pools include the new parts, filtered by race; dwarf and elf cultural weighting includes their own sets. Saved recipes retain their part IDs and remain version 7. The game’s worn-gear portrait rules recognize the new armor and helmets without adding inventory items or changing combat stats.


## Engraving variations

Dwarf armor and helmets use eight emblem families: Diamond, Mountain, Anvil, Sun, Knot, Hammer, Chevrons and Gate. Their primary and secondary motifs match across a suit, replacing the repeated numeral-like strokes. The styles apply to rune/forge plate, rune mail, iron guard armor and the dwarf guard, forge, horned and rune helms.

Choose **Armor engraving** in the workshop after selecting Dwarf. The control stays synchronized with the texture seed; changing it preserves the face proportions and equipment choices. The motif is carried by the existing seed, so it survives recipe export/import and NPC saves without new recipe fields. Seeds 0–7 display the eight families in order. Both standalone offline HTML entry points are rebuilt from the current source.


## Dwarf facial feature options

Ten dwarf-only choices add more individual character:

- Brows: Bushy (thick tufts), Straight (heavy low brow) and Weathered (uneven notched brow).
- Eyes: Dwarf deep-set and Dwarf squint, with visible irises beneath the heavy brow.
- Noses: Broad bridge and Broken, retaining the race’s wide nose proportions.
- Facial hair: Fan beard, Twin braids and Heavy moustache.

These appear in the compatible feature selectors, four new editable presets and seeded dwarf generation. Brows grow upward to preserve pupil visibility; all facial-hair styles keep the mouth opening clear. The short neck, 128-pixel rendering and existing recipe schema remain. Female generation stays unbearded, with manual facial hair still available. Both offline tools are rebuilt with the new choices.


## Orc leather and harness armor

Eight new orc-only clothing options are available in the workshop, game face maker, curated presets and compatible NPC role pools: laced leather vest, studded leather, crossed harness over a leather vest, ring harness over a leather vest, layered hide armor, leather with shoulder guards, bare crossed harness and bare ring harness. The six covered kits cover the chest and shoulders; the two bare options deliberately expose skin. Harness straps meet the shoulder tops and continue down the chest. Buckles and rings stay attached to leather.

The optional Torso layer sits below Clothing and Armor and uses the existing Skin tint. Leather remains on Cloth; hardware remains on Metal. All layers keep the same 128-pixel origin. The body surface joins the smaller orc neck without moving the broad shoulders. Existing outfits leave the torso layer empty, preserving their rendering. Saved recipes remain version 7; the atlas grows to 19 cells. Both offline tools are rebuilt with the same source.


Shared hair checks: `hair-tests.html` verifies every hairstyle on every race, normalization and race-switch preservation, distinct artwork, deterministic weighted sampling with every style reachable, and helmet concealment. The game’s face maker also preserves a selected cut when switching race; dwarf appearance rules keep anatomical preferences without replacing chosen hair. Existing bald-frequency and hair-color preferences for generated characters remain.
