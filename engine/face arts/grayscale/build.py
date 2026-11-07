"""Package the procedural workshop into one offline HTML. No third-party dependencies."""
from pathlib import Path
p = Path(__file__).resolve().parent
html = (p / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (p / 'style.css').read_text() + '</style>')
for name in ['portrait-engine.js', 'portrait-generation.js', 'workshop.js', 'studio.js']:
    source = (p / name).read_text().replace('</script', '<\\/script')
    html = html.replace('<script src="' + name + '"></script>', '<script>' + source + '</script>')
(p / 'portrait-workshop-grayscale.html').write_text(html)
print('Built portrait-workshop-grayscale.html')
