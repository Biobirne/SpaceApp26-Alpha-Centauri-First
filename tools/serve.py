# SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
"""Local dev server for the game: like `python -m http.server`, but tells the browser not to
cache anything, so every reload picks up the latest JS modules.

Usage (from the repo root):  python tools/serve.py [port]
"""
import http.server
import socketserver
import sys
from pathlib import Path


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).resolve().parent.parent), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", port), NoCacheHandler) as httpd:
        print(f"Serving on http://localhost:{port}/")
        httpd.serve_forever()
