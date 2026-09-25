"""Local web server for this site, with a restart endpoint.

Serves the project folder (the parent of scripts/) at
http://localhost:8000/ (this computer only).
POST /restart makes the server restart itself in a fresh process.
"""
import os
import socket
import sys
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOWED_ORIGINS = {
    f"http://localhost:{PORT}",
    f"http://127.0.0.1:{PORT}",
    f"http://[::1]:{PORT}",
}
restart_requested = threading.Event()
# Changes on every start, so the page can tell when a restart has finished.
SERVER_ID = f"{os.getpid()}-{time.time_ns()}"


class Server(ThreadingHTTPServer):
    # On Windows, address reuse lets a second server bind a port that's
    # already in use, so claim the port exclusively and fail if it's taken.
    allow_reuse_address = False

    def server_bind(self):
        if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


class Server6(Server):
    address_family = socket.AF_INET6


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("X-Server-Id", SERVER_ID)
        super().end_headers()

    def do_POST(self):
        if self.path != "/restart":
            self.send_error(404)
            return
        # Only accept requests from this site's own pages, so other
        # websites open in the browser can't trigger a restart.
        if self.headers.get("Origin") not in ALLOWED_ORIGINS:
            self.send_error(403)
            return
        self.send_response(202)
        self.send_header("Content-Length", "0")
        self.end_headers()
        restart_requested.set()


def bind(server_class, host, handler):
    # Right after a restart the old process may still hold the port for a
    # moment, so retry briefly before giving up.
    for attempt in range(20):
        try:
            return server_class((host, PORT), handler)
        except OSError:
            if attempt == 19:
                raise
            time.sleep(0.25)


def main():
    handler = partial(Handler, directory=ROOT)
    try:
        servers = [bind(Server, "127.0.0.1", handler)]
    except OSError:
        sys.exit(f"Port {PORT} is already in use. Is another server running?")
    # Also listen on IPv6 loopback. "localhost" tries ::1 first on Windows,
    # and without this every request waits about 2 seconds before falling
    # back to 127.0.0.1.
    try:
        servers.append(bind(Server6, "::1", handler))
    except OSError:
        print(f"Note: couldn't listen on [::1]:{PORT}; localhost may be slow.", flush=True)

    for server in servers:
        threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"Serving {ROOT} at http://localhost:{PORT}/", flush=True)

    # Wait in short steps so Ctrl+C still works on Windows.
    while not restart_requested.wait(0.5):
        pass
    for server in servers:
        server.shutdown()
        server.server_close()
    print("Restarting server...", flush=True)
    os.execv(sys.executable, [sys.executable, os.path.abspath(__file__)])


if __name__ == "__main__":
    main()
