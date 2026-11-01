# Matched portrait layers — one-face proof

Packaged in `engine/face arts/` on 2026-11-01. This is a standalone art tool; it does not replace the game's current portraits.

2026-10-30. This replaces the independently generated feature approach used in the previous prototype.

Open `portrait-workshop.html` directly in a browser. It embeds every image and script, needs no server or network, and shows the rebuilt portrait beside its original master. The smaller `preview.html` loads the PNG files separately and can be served over HTTP.

One coherent finished face was created first in the approved `hum_sword.png` portrait style. The eyes, brows, nose, mouth, beard and hair are copied from that exact master at their original coordinates. They are never independently resized, mirrored or repositioned. The lip and moustache fit therefore comes from the finished artwork itself.

## Contents

- `sources/master.png`: original generated finished portrait, preserved unchanged.
- `sources/blank-reference.png`: matching featureless head used for the clean blank base.
- `layers/base.png`: featureless base, with head, ears, neck and charcoal tunic.
- `layers/planes.png`: shared skin shading and other common master pixels outside the feature regions. This support layer is necessary to reproduce the master exactly; it is not an additional face option.
- `layers/eyes.png`, `brows.png`, `nose.png`, `mouth.png`, `beard.png`, `hair.png`: six transparent feature layers.
- `layers/master.png`: the comparison reference after alpha cleanup.
- `manifest.json`: canvas size and drawing order.
- `regions.json`: exact feature partitions in master canvas coordinates.
- `extract.html`: local Canvas extraction/check tool, served over HTTP when rebuilding.
- `reconstruction-check.json`: measured reconstruction result.
- `build.py`: standard-library packager; run `python build.py` after changing the PNGs or template.
- `workshop.template.html`: source for the preview. The self-contained version embeds its art data.

Every PNG uses the same **1254 × 1254 canvas** and draws at **(0, 0)**. Order: base, planes, nose, eyes, brows, mouth, beard, hair. Disable image smoothing. The original images contain faint near-transparent pixels and near-opaque alpha; extraction normalizes alpha >=128 to255 and lower alpha to0. The source files themselves are retained unchanged.

The finished stack is **pixel-identical to the normalized master**, including the mouth/beard placement. The blank-base button hides the support shading and all features, showing a clean featureless head. Layer visibility controls inspect the extraction; hiding a feature is not a finished replacement design.

This is **one matched face**, not a random portrait library. There are no independently generated replacement variants yet. The next step is to design alternatives against these same facial regions and shared lighting, then check combinations. Do not mix the old prototype's independent parts into this set.

Validation: zero differing pixels in the complete reconstruction, each feature is a separate layer, blank/full controls and PNG download work, and a390px phone viewport has no horizontal overflow. No game behavior, saves or production portraits are changed. Nothing is pushed.

The build script writes only to this kit folder, so moving it does not create or overwrite files in the parent engine directory.
