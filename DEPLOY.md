# Deploy Ashmark

Ashmark runs on a static host with no backend, Node dependencies or build tools.
The repository root now has an `index.html` that opens the game. All paths are
relative, so repository subpaths such as GitHub Pages work too.

## Upload only the game

Run from the repository root with Python 3:

```sh
python3 scripts/build-web.py
```

Upload the **contents** of `dist/site/` to your host's publishing directory, or
extract `dist/ashmark-web.zip` there. `index.html` must be at that directory's
top level. Keep the `prototype/` and `engine/` folders together; uploading only
`prototype/` will leave out the renderer. The package includes the current
working code, styles, icons, home-screen manifest and wiki. Tests, design docs,
reference art and development tools are excluded.

For Netlify manual deployment, drag the `dist/site` folder into its deploy UI.
For Cloudflare Pages, use Direct Upload with the site folder or ZIP.

## GitHub Pages from the repository

Push the desired version, then select that branch and `/ (root)` under
Settings → Pages → Deploy from a branch. No build command is needed. Open
the resulting site URL; the root index opens Ashmark automatically.

## Preview the exact package locally

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory dist/site
```

On a phone using the same Wi-Fi, visit `http://YOUR-PC-IP:8000/` and use landscape
mode. Allow port 8000 through your computer's firewall if needed.

Use HTTPS for the hosted version and home-screen installation. The game stores
saves in that browser on that site's origin; changing domains or switching
browsers does not transfer saves. Google Fonts is optional and falls back to
local fonts. This package does not add offline caching.
