#!/usr/bin/env python3
"""Collect the static game's dependencies into dist/site and dist/ashmark-web.zip."""
import json
import re
import shutil
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
SITE = DIST / "site"


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        # Preconnects and remote fonts are optional network resources.
        if tag == "script" and attrs.get("src"):
            self.paths.append(attrs["src"])
        if tag == "link" and attrs.get("rel") in {"stylesheet", "icon", "apple-touch-icon", "manifest"}:
            self.paths.append(attrs["href"])


def dependencies():
    pending = ["index.html", ".nojekyll", "prototype/Ashmark.html",
               "prototype/wiki.html", "prototype/manifest.webmanifest"]
    files = set()
    while pending:
        name = pending.pop()
        if name in files:
            continue
        source = (ROOT / name).resolve()
        source.relative_to(ROOT)
        if not source.is_file():
            raise SystemExit(f"Missing deployment dependency: {name}")
        files.add(name)
        paths = []
        if source.suffix == ".html":
            parser = Links()
            parser.feed(source.read_text(encoding="utf-8"))
            paths = parser.paths
        elif source.suffix == ".webmanifest":
            paths = [icon["src"] for icon in json.loads(source.read_text())["icons"]]
        elif source.suffix == ".css":
            paths = re.findall(r"url\(\s*['\"]?([^'\"\s)]+)", source.read_text())
        for path in paths:
            url = urlsplit(path)
            if url.scheme or url.netloc or not url.path:
                continue
            target = (source.parent / unquote(url.path)).resolve()
            pending.append(target.relative_to(ROOT).as_posix())
    return sorted(files)


def main():
    files = dependencies()  # Validate every required file before replacing output.
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)
    for name in files:
        target = SITE / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)
    with ZipFile(DIST / "ashmark-web.zip", "w", ZIP_DEFLATED) as archive:
        for name in files:
            archive.write(SITE / name, name)
    print(f"Ready: {len(files)} files in dist/site; archive: dist/ashmark-web.zip")


if __name__ == "__main__":
    main()
