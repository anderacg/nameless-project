# Portrait generator v6

Open **[portrait-workshop.html](portrait-workshop.html)** directly in a browser. It works offline and includes the full generator. `index.html` opens the same workshop when this folder is served.

The current generator draws independent grayscale **128 × 128** parts, assembles 18 layers, and supports runtime tinting, editable recipes, and Human, Dwarf, Orc and Elf generation. Race compatibility controls the selectors, random generation and recipe import. Headwear fits the selected hair and ears.

## Editable sources

- [grayscale/README.md](grayscale/README.md): features, compatibility rules, runtime API and export format.
- `grayscale/portrait-engine.js`: procedural part drawings and race rules.
- `grayscale/workshop.js`, `index.html`, `style.css`: controls and layout.
- `grayscale/tests.html`: portrait checks; `grayscale/gallery.html`: generated character examples.
- `grayscale/examples/`: exported source layers, atlas, manifests and preset images. Runtime generation does not load these PNGs.

Run `python build.py` here after editing the sources. It rebuilds the offline workshop and updates the main `portrait-workshop.html` entry. The workshop exposes `PortraitEngine`; it is a standalone engine tool.

## Archived v3 study

The old matched-image workshop is retained as **[portrait-workshop-v3-archive.html](portrait-workshop-v3-archive.html)**. Its PNGs, template, extraction tools and reconstruction data remain available. See [README-v3-archive.md](README-v3-archive.md); `python build-v3-archive.py` rebuilds only that archived entry.
