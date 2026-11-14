# Painted Portrait Character Studio

Open **[portrait-workshop.html](portrait-workshop.html)** directly in a browser. It works offline and includes the full generator. `index.html` opens the same workshop when this folder is served.

The default renderer fits **53 active painted components, including eight newly redrawn skin bases** into the existing **19 independent layers**. It keeps the frontal composition, version-7 recipes, proportions, tint channels and Human, Dwarf, Orc and Elf controls. All face selectors remain available across 64 race/profile/shape combinations. The game renders at 256 × 256; the full character/NPC studio retains its 128 × 128 editing rig. Race compatibility and fitted hair, ears and headwear remain. [Painted artwork sources and API](painted/README.md).

## Character creation and world generation

Create a player, then choose **Use current as player** to reserve the face. Use bounded facial sliders, part locks and the 12-face variation grid to refine it. Pin a before snapshot and run the part checks to inspect alignment. Named favorites can be tagged for a character role; collections preserve the editor session locally and through JSON export/import.

NPC previews support Human, Dwarf, Orc and Elf, 12 soldier presets (infantry, archer and cavalry), role-based clothing, and Random, Preset or Mixed generation. NPCs must differ from the player in at least two core groups (face geometry, eyes, nose), including one actual part difference. Hair, beard, age, colors and equipment do not count. Exact structural duplicates within a roster are also rejected. This is a structural safeguard, not a guarantee that every pair will appear unrelated. Preset-only generation reports when its eligible pool is exhausted rather than duplicating faces.

Load `grayscale/portrait-engine.js` followed by `grayscale/portrait-generation.js` in the future game character creator. `PortraitCharacters.Roster` creates characters once by stable game IDs, caches rendered portraits and saves their full recipes. See the runnable [game integration example](grayscale/examples/game-integration.html) and [API guide](grayscale/README.md#game-facing-character-api). The production game face maker and character portraits use the painted renderer. To enable the same appearance in an integration, load `painted/painted-data.js` and `painted/painted-engine.js` after the geometry engine, await `PortraitArtwork.ready`, and render with `PortraitArtwork.render(config, {colors})`.

[View the soldier lineup](grayscale/examples/soldiers/index.html) for all 12 presets and their equipment.

## Editable sources

- [grayscale/README.md](grayscale/README.md): features, compatibility rules, runtime API and export format.
- `painted/`: unchanged authored atlases, local embedded data, painted renderer and a focused 256-pixel artwork editor.
- `grayscale/portrait-engine.js`: procedural geometry, fit masks, race rules and fallback rendering.
- `grayscale/portrait-generation.js`: player reservations, seeded NPC generation and persistent rosters.
- `grayscale/workshop.js`, `studio.js`, `index.html`, `style.css`: controls and layout.
- `grayscale/soldier-tests.html`: soldier equipment checks; `grayscale/character-tests.html`: character-generation checks; `grayscale/tests.html`: portrait checks; `grayscale/gallery.html`: generated character examples.
- `grayscale/examples/`: exported source layers, atlas, manifests and preset images. Runtime generation does not load these PNGs.

Run `python build.py` here after editing the sources. It rebuilds the offline workshop and updates the main `portrait-workshop.html` entry. The workshop exposes `PortraitEngine`; it is a standalone engine tool.

## Archived v3 study

The old matched-image workshop is retained as **[portrait-workshop-v3-archive.html](portrait-workshop-v3-archive.html)**. Its PNGs, template, extraction tools and reconstruction data remain available. See [README-v3-archive.md](README-v3-archive.md); `python build-v3-archive.py` rebuilds only that archived entry.
