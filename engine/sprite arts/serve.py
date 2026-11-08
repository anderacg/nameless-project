"""Serve the repository's live Sprite Studio with fresh responses."""
import argparse
import functools
import http.server
from pathlib import Path
import webbrowser

class StudioHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/engine/sprite%20arts/index.html')
            self.end_headers()
            return
        super().do_GET()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', default=8000, type=int)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    handler = functools.partial(StudioHandler, directory=str(repo))
    with http.server.ThreadingHTTPServer((args.host, args.port), handler) as server:
        url = f'http://127.0.0.1:{server.server_port}/engine/sprite%20arts/index.html'
        print('Live Sprite Studio: ' + url, flush=True)
        if not args.no_browser:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
