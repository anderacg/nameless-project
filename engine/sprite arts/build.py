"""Bundle the live sprite and game art scripts into one offline workshop."""
from pathlib import Path
import re
root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (root / 'style.css').read_text() + '</style>')
def inline(match):
    file = (root / match.group(1)).resolve()
    source = file.read_text().replace('</script', '<\\/script')
    return '<script>\n' + source + '\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
(root / 'sprite-workshop.html').write_text(html)
print('Built sprite-workshop.html from the current shared art scripts')
