#!/usr/bin/env python3
"""Local static server for New Ground Australia.

Serves the HTML files, maps extensionless paths onto them, and sends the
301 redirects for retired pages. Apache (.htaccess) and Netlify/Cloudflare
(_redirects) mirror these rules for production.
"""

from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "5500"))

REDIRECTS = {
    "/membership": "/get-involved",
    "/membership.html": "/get-involved",
    "/shop": "/",
    "/shop.html": "/",
    "/contact": "/get-involved",
    "/contact.html": "/get-involved",
    "/refund-policy": "/donations-refunds-policy",
    "/refund-policy.html": "/donations-refunds-policy",
    "/index.html": "/",
}

PAGES = {
    "about",
    "values",
    "get-involved",
    "prayer",
    "donate",
    "privacy-policy",
    "terms-conditions",
    "donations-refunds-policy",
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        self._dispatch(head=False)

    def do_HEAD(self):
        self._dispatch(head=True)

    def _dispatch(self, head: bool) -> None:
        parts = urlsplit(self.path)
        path = parts.path or "/"

        if path != "/" and path.endswith("/"):
            stripped = path[:-1]
            if stripped in REDIRECTS or stripped.lstrip("/") in PAGES:
                self._redirect(self._with_query(REDIRECTS.get(stripped, stripped), parts.query))
                return

        if path in REDIRECTS:
            self._redirect(self._with_query(REDIRECTS[path], parts.query))
            return

        slug = path[1:] if path.startswith("/") else path
        if slug in PAGES:
            rewritten = "/" + slug + ".html"
            if parts.query:
                rewritten += "?" + parts.query
            self.path = rewritten

        if head:
            super().do_HEAD()
        else:
            super().do_GET()

    @staticmethod
    def _with_query(location: str, query: str) -> str:
        if query:
            return location + "?" + query
        return location

    def _redirect(self, location: str) -> None:
        self.send_response(301)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()


if __name__ == "__main__":
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("New Ground Australia site: http://127.0.0.1:%s" % PORT)
    print("Press CTRL+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped")
