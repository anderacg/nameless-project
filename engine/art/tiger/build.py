"""Rebuild synchronous, lossless tiger data from the approved master PNG (Pillow)."""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).parent
sheet = Image.open(root / 'tiger.png').convert('RGBA')
metadata = json.loads((root / 'manifest.json').read_text())
palette = [(0, 0, 0, 0)]
frames, clips = [], {}
for name, clip in metadata['animations'].items():
    clips[name] = [len(frames), clip['count'], clip['frameDurationMs']]
    for frame in clip['frames']:
        x, y, w, h = (frame[k] for k in ('x', 'y', 'w', 'h'))
        image = sheet.crop((x, y, x + w, y + h))
        bounds = image.getbbox()
        tile = image.crop(bounds)
        runs, previous, length = [], None, 0
        for color in tile.getdata():
            if color[3] == 0:
                color = (0, 0, 0, 0)
            if color not in palette:
                palette.append(color)
            index = palette.index(color)
            if index == previous:
                length += 1
            else:
                if previous is not None:
                    runs.extend([length, previous])
                previous, length = index, 1
        runs.extend([length, previous])
        frames.append([*bounds, runs])
data = json.dumps(dict(palette=palette, clips=clips, frames=frames), separators=(',', ':'))
source = "'use strict';\n// Approved tiger master frames, losslessly indexed from art/tiger/tiger.png.\n(function(PX){PX.TIGER_ART=" + data + ";})(window.PX=window.PX||{});\n"
target = root.parent.parent / 'tiger-data.js'
ending = '\r\n' if b'\r\n' in target.read_bytes() else '\n'
target.write_bytes(source.replace('\n', ending).encode())
print(f'{len(frames)} frames, {len(clips)} clips, {len(palette)} colors')
