# Portrait Character Studio v7

Open **[portrait-workshop.html](portrait-workshop.html)** directly in a browser. It works offline and includes the full generator. `index.html` opens the same workshop when this folder is served.

The current generator draws independent grayscale **128 × 128** parts, assembles 18 layers, and supports runtime tinting, editable recipes, and Human, Dwarf, Orc and Elf generation. Race compatibility controls the selectors, random generation and recipe import. Headwear fits the selected hair and ears.

## Character creation and world generation

Create a player, then choose **Use current as player** to reserve the face. Use bounded facial sliders, part locks and the 12-face variation grid to refine it. Pin a before snapshot and run the part checks to inspect alignment. Named favorites can be tagged for a character role; collections preserve the editor session locally and through JSON export/import.

NPC previews support Human, Dwarf, Orc and Elf, 12 soldier presets (infantry, archer and cavalry), role-based clothing, and Random, Preset or Mixed generation. NPCs must differ from the player in at least two core groups (face geometry, eyes, nose), including one actual part difference. Hair, beard, age, colors and equipment do not count. Exact structural duplicates within a roster are also rejected. This is a structural safeguard, not a guarantee that every pair will appear unrelated. Preset-only generation reports when its eligible pool is exhausted rather than duplicating faces.

Load `grayscale/portrait-engine.js` followed by `grayscale/portrait-generation.js` in the future game character creator. `PortraitCharacters.Roster` creates characters once by stable game IDs, caches rendered portraits and saves their full recipes. See the runnable [game integration example](grayscale/examples/game-integration.html) and [API guide](grayscale/README.md#game-facing-character-api). The production game is not wired to this tool yet.

[View the soldier lineup](grayscale/examples/soldiers/index.html) for all 12 presets and their equipment.

## Editable sources

- [grayscale/README.md](grayscale/README.md): features, compatibility rules, runtime API and export format.
- `grayscale/portrait-engine.js`: procedural part drawings and race rules.
- `grayscale/portrait-generation.js`: player reservations, seeded NPC generation and persistent rosters.
- `grayscale/workshop.js`, `studio.js`, `index.html`, `style.css`: controls and layout.
- `grayscale/soldier-tests.html`: soldier equipment checks; `grayscale/character-tests.html`: character-generation checks; `grayscale/tests.html`: portrait checks; `grayscale/gallery.html`: generated character examples.
- `grayscale/examples/`: exported source layers, atlas, manifests and preset images. Runtime generation does not load these PNGs.

Run `python build.py` here after editing the sources. It rebuilds the offline workshop and updates the main `portrait-workshop.html` entry. The workshop exposes `PortraitEngine`; it is a standalone engine tool.

## Archived v3 study

The old matched-image workshop is retained as **[portrait-workshop-v3-archive.html](portrait-workshop-v3-archive.html)**. Its PNGs, template, extraction tools and reconstruction data remain available. See [README-v3-archive.md](README-v3-archive.md); `python build-v3-archive.py` rebuilds only that archived entry.
