"""Package the unchanged authored atlases as local data, and build the offline workshop."""
from pathlib import Path
import base64
import json

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'parts-manifest.json').read_text())
assets = [{**m, 'src': 'data:image/png;base64,' + base64.b64encode((root / m['file']).read_bytes()).decode()} for m in manifest]
(root / 'painted-data.js').write_text('/* Generated from the authored part atlases; no remote image requests. */\nwindow.PAINTED_PORTRAIT_ASSETS=' + json.dumps(assets, separators=(',', ':')) + ';\n')
if (root / 'index.html').exists():
    html = (root / 'index.html').read_text()
    html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (root / 'style.css').read_text() + '</style>')
    for name in ['../grayscale/portrait-engine.js', 'painted-data.js', 'painted-engine.js', 'workshop.js']:
        source = (root / name).read_text().replace('</script', '<\\/script')
        html = html.replace('<script src="' + name + '"></script>', '<script>' + source + '</script>')
    (root / 'portrait-workshop-painted.html').write_text(html)
print('Built local painted portrait artwork package')
