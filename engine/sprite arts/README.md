# Character Sprite Studio

Open **[sprite-workshop.html](sprite-workshop.html)** in a browser. This is the complete offline workshop; it needs no server, packages or PNG assets. Open `index.html` to work directly with the repository's current shared art scripts.

## Create and inspect

Choose a starting preset, then edit Human, Dwarf, Elf or Orc, hairstyle, facial hair, forward-facing eyes, skin/hair/team palettes, equipment slots, weapons and shields. The slots and part names come from `PX.DOLL` in `engine/doll.js`; this tool does not replace the approved drawings. A preset's cloth, armor, headwear and cloak remain editable parts. Gender-specific anatomy is not added: the existing sprite skeleton is shared.

Locks keep selected parts **and their materials** during seeded random generation and the 12-variation grid. Race and color-ramp overrides stay fixed. Variations are deduplicated by their recipe choices without counting the texture seed as a new design. They are not a facial-identity system; faces at this resolution have very few pixels. Named favorites and collections keep complete recipes. The session is stored locally when browser storage is available; export a JSON collection for a portable backup.

Material controls expose four explicit tones: light, mid, shade and edge. `team`, `hair` and `skin` are character channels; named materials are shared wherever used. A channel override takes precedence over the palette it refers to. Source pixels retain their channel number and tone index, so recoloring does not need PNG generation.

## Two preview renderers

- **Game figure:** the actual `sprites.js`, `people.js`, `figures.js`, `dollfigs.js` and `weapons.js` drawing code, loaded without the simulation. Standing, four walking frames, four running frames, and three frames each of swing, thrust and overhead attack. The selected weapon uses the game's own drawing and pose rules. These are art previews; timing/hit effects, targets, equipment stats and battle AI are not simulated.
- **Engine base + gear:** `PX.dollBase` / `PX.dollPaint` plus separate `PX.dollGear` attachments. The unchanged source cell is **17 × 19**. Supported animations are standing, four walking frames and the engine's single strike pose. Gear is laid on a larger transparent frame so pieces that extend outside the body cell are retained.

The engine's club has no corresponding game weapon renderer. Choosing its preset switches the workshop to Engine base; API rendering also identifies that fallback. The extended weapon list is available in Game figure view. Engine base draws only weapons that exist in `PX.DOLL.WEAPONS`; inspect their game view for other weapon types.

The native game view faces right; the other view is a mirror, with reflected attachment anchors. The raw engine base retains its native orientation, before the game's body remapping. This tool does **not** invent eight directional art or resample the drawings to 16 × 16.

The source inspector shows the assembled body without hand-held gear, separate gear and disjoint visible material masks. A mask does not reconstruct hidden garment pixels. PNG layer exports share the displayed base frame. Indexed JSON retains native **17 × 19** body indices, source anchors, the frame origin, and separate mirrored-display metadata. Gear is exported as independent positioned layers, not included in the body index.

## Export and integration

- **Recipe JSON:** `ashmark-sprite`, version 1, containing normalized choices, equipment, seed and four-tone ramp overrides.
- **Frame PNG:** current renderer, pose, frame, facing and grayscale setting; transparent, native pixels. Preview grid/anchor overlays are not exported.
- **Sheet PNG + metadata:** separate download buttons for phone/browser compatibility. Four columns, rows grouped by animation then facing. Game view exports 36 populated cells; Engine base exports 12. Unused cells stay transparent. Frame rectangles, relative anchors, FPS, grayscale flag and the exact recipe are saved in the matching JSON. Every cell shares the maximum required power-of-two frame size; drawings are bottom-aligned, centered and never resized.
- **Collection JSON:** current recipe, locks, 12 variations, named favorites and preview settings.

```js
// Within the workshop, or in a game that already loads its graphics scripts:
const recipe = SpriteStudio.read(savedJSON);
const frame = SpriteStudio.render(recipe, {
  renderer: 'game', pose: 'walk', frame: 2, left: false
});
context.drawImage(frame.image, x, y);
const sheet = SpriteStudio.sheet(recipe, {renderer: 'game', fps: 8});
// Save sheet.image as PNG and sheet.manifest as JSON.
```

`SpriteStudio.spec(recipe)` returns the corresponding low-level `PX.doll` specification with separate gear and no shadow. For colored low-level output, use `PX.dollPaint(PX.dollBase(spec), channel => SpriteStudio.ramp(recipe, channel))`. Cache finished frames in the game; create random recipes once and save them rather than rerolling while drawing.

Game previews temporarily supply the workshop's custom part specification to `dollSpec` during one synchronous draw, restoring it in `finally`. The game art scripts and their part tables are not modified. The independent tool's `runtime.js` only defines an absent world (`WM = null`); **do not load that file into the running game**. The production character creator is not wired to sprite recipes by this change.

## Editable sources

- `sprite-engine.js`: validated recipes, palettes, renderer adapters, variations, masks and sheet metadata.
- `workshop.js`, `index.html`, `style.css`: controls, playback, inspection, browser storage and downloads.
- `runtime.js`: tool-only environment for shared game graphics scripts.
- `build.py`: bundles the repository's current source scripts into `sprite-workshop.html`.
- `tests.html`, `checks.js`: focused pixel parity, material masks, mirrors/anchors, race/preset/pose rendering, locks, deterministic generation, recipe validation and sheet alignment checks.
- `examples/index.html`: a generated four-race lineup using the same shared renderer.

Run `python "engine/sprite arts/build.py"` from the repository root after editing the source or pulling changes to shared graphics files. The standalone HTML intentionally contains a snapshot of the scripts at build time; `index.html` loads live sources. The editable ZIP includes the required shared scripts at their original relative paths. No production game files are changed by this workshop.
