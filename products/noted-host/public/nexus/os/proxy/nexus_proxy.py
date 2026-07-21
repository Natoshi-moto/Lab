#!/usr/bin/env python3
"""
nexus_proxy.py — local API gateway for Crucible / Nexus OS (v1.1)
==================================================================

This version fixes the "Address already in use" failure mode:
  - SO_REUSEADDR enforced on the listening socket
  - On EADDRINUSE we kill the previous proxy by PID file
  - If that fails, we walk forward through ports 8787 .. 8802
  - The chosen port is written to ./nexus_proxy.port so callers can find it
  - PID file at ./nexus_proxy.pid for the runner script to clean up

Endpoints
---------
POST  /v1/<provider>          → non-streaming
POST  /v1/<provider>/stream   → streaming SSE pass-through
GET   /health                 → liveness {ok, version, port, allow_hosts}
OPTIONS *                     → CORS preflight

Body for both POST endpoints:
    { "url": "<full provider URL>", "headers": {...}, "body": {...} }

Standard library only.
"""

import http.server
import json
import os
import signal
import socket
import socketserver
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urlparse

VERSION = "1.1"
HOST = os.environ.get("NEXUS_PROXY_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.environ.get("NEXUS_PROXY_PORT", "8787"))
PORT_FALLBACK_RANGE = 16
TIMEOUT = float(os.environ.get("NEXUS_PROXY_TIMEOUT", "120"))

SCRIPT_DIR = Path(__file__).resolve().parent
PID_FILE = SCRIPT_DIR / "nexus_proxy.pid"
PORT_FILE = SCRIPT_DIR / "nexus_proxy.port"

HEADER_BLACKLIST = {
    "anthropic-dangerous-direct-browser-calls",
    "host", "content-length", "connection",
}

DEFAULT_ALLOW = {
    "api.anthropic.com",
    "api.openai.com",
    "api.groq.com",
    "api.mistral.ai",
    "generativelanguage.googleapis.com",
}
EXTRA_ALLOW = {h.strip() for h in os.environ.get("NEXUS_PROXY_ALLOW", "").split(",") if h.strip()}
ALLOW_HOSTS = DEFAULT_ALLOW | EXTRA_ALLOW

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Api-Key, anthropic-version",
    "Access-Control-Max-Age": "3600",
}


def log(*a):
    print("[nexus_proxy]", *a, file=sys.stderr, flush=True)


def kill_previous():
    if not PID_FILE.exists(): return False
    try: pid = int(PID_FILE.read_text().strip())
    except Exception:
        try: PID_FILE.unlink()
        except Exception: pass
        return False
    if pid == os.getpid(): return False
    try: os.kill(pid, 0)
    except (ProcessLookupError, PermissionError):
        try: PID_FILE.unlink()
        except Exception: pass
        return False
    try:
        cmdline = Path(f"/proc/{pid}/cmdline").read_text()
        if "nexus_proxy" not in cmdline and "python" not in cmdline:
            log(f"PID {pid} doesn't look like our proxy, leaving it alone")
            try: PID_FILE.unlink()
            except Exception: pass
            return False
    except Exception:
        pass
    log(f"killing stale proxy PID {pid}")
    try:
        os.kill(pid, signal.SIGTERM); time.sleep(0.3)
        try: os.kill(pid, 0); os.kill(pid, signal.SIGKILL); time.sleep(0.2)
        except ProcessLookupError: pass
    except Exception as e:
        log(f"could not kill: {e}"); return False
    try: PID_FILE.unlink()
    except Exception: pass
    return True


def find_open_port():
    last_err = None
    for offset in range(PORT_FALLBACK_RANGE):
        port = DEFAULT_PORT + offset
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind((HOST, port))
            sock.listen(64)
            return port, sock
        except OSError as e:
            last_err = e
            try: sock.close()
            except Exception: pass
            if offset == 0 and kill_previous():
                try:
                    time.sleep(0.3)
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                    sock.bind((HOST, port))
                    sock.listen(64)
                    return port, sock
                except OSError as e2:
                    last_err = e2
                    try: sock.close()
                    except Exception: pass
            log(f"port {port} unavailable ({e}), trying next")
    raise RuntimeError(f"No port in {DEFAULT_PORT}..{DEFAULT_PORT+PORT_FALLBACK_RANGE-1}: {last_err}")


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): return

    def do_OPTIONS(self):
        self.send_response(204)
        for k, v in CORS_HEADERS.items(): self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._json(200, {
                "ok": True, "version": VERSION,
                "port": self.server.server_address[1],
                "allow_hosts": sorted(ALLOW_HOSTS),
            })
            return
        self._json(404, {"error": "Not found"})

    def do_POST(self):
        parts = [p for p in self.path.split("/") if p]
        if len(parts) < 2 or parts[0] != "v1":
            self._json(404, {"error": "Bad path"}); return
        streaming = (len(parts) >= 3 and parts[2] == "stream")
        provider = parts[1]
        try:
            n = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(n) if n > 0 else b""
            env = json.loads(raw.decode("utf-8")) if raw else {}
            url = env.get("url"); headers = env.get("headers") or {}; body = env.get("body")
            if not url or not isinstance(headers, dict) or body is None:
                self._json(400, {"error": "Envelope must be {url, headers, body}"}); return
        except Exception as e:
            self._json(400, {"error": f"Bad envelope: {e}"}); return
        try: host = urlparse(url).hostname or ""
        except Exception: host = ""
        if host not in ALLOW_HOSTS:
            self._json(403, {"error": f"Host not allowed: {host}"}); return
        upstream_h = {k: v for k, v in headers.items() if k.lower() not in HEADER_BLACKLIST}
        upstream_h["User-Agent"] = f"nexus-proxy/{VERSION}"
        body_b = json.dumps(body).encode("utf-8") if not isinstance(body, (bytes, bytearray)) else body
        log(f"→ {provider} {'(stream)' if streaming else ''} {host}")
        try:
            req = urllib.request.Request(url, data=body_b, headers=upstream_h, method="POST")
            resp = urllib.request.urlopen(req, timeout=TIMEOUT)
        except urllib.error.HTTPError as e:
            try: err = json.loads(e.read().decode("utf-8", errors="replace"))
            except Exception: err = {"error": f"HTTP {e.code}"}
            log(f"  ← {e.code}")
            self._json(e.code, err); return
        except Exception as e:
            log(f"  ← FAIL {e}")
            self._json(502, {"error": f"Upstream failure: {e}"}); return
        if streaming:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            for k, v in CORS_HEADERS.items(): self.send_header(k, v)
            self.end_headers()
            try:
                while True:
                    chunk = resp.read(4096)
                    if not chunk: break
                    try: self.wfile.write(chunk); self.wfile.flush()
                    except (BrokenPipeError, ConnectionResetError): return
            finally:
                resp.close()
            log("  ← stream done")
        else:
            data = resp.read()
            try: payload = json.loads(data.decode("utf-8"))
            except Exception: payload = {"raw": data.decode("utf-8", errors="replace")}
            self._json(getattr(resp, "status", 200), payload)
            log(f"  ← {getattr(resp, 'status', 200)}")

    def _json(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for k, v in CORS_HEADERS.items(): self.send_header(k, v)
        self.end_headers()
        try: self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError): pass


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    def __init__(self, server_address, RequestHandlerClass, sock):
        # Skip the bind: we already bound the socket in find_open_port()
        socketserver.BaseServer.__init__(self, server_address, RequestHandlerClass)
        self.socket = sock
        self.server_address = sock.getsockname()


def cleanup(*_):
    log("shutting down")
    try: PID_FILE.unlink()
    except Exception: pass
    try: PORT_FILE.unlink()
    except Exception: pass
    sys.exit(0)


def main():
    port, sock = find_open_port()
    PID_FILE.write_text(str(os.getpid()))
    PORT_FILE.write_text(str(port))
    signal.signal(signal.SIGTERM, cleanup)
    signal.signal(signal.SIGINT, cleanup)

    log(f"v{VERSION} listening on http://{HOST}:{port}")
    if port != DEFAULT_PORT:
        log(f"NOTE: {DEFAULT_PORT} was busy, using {port} instead")
    log(f"Allowed: {sorted(ALLOW_HOSTS)}")
    log(f"In Crucible: Settings → Connection → Proxy URL = http://{HOST}:{port}")
    log(f"Health: curl http://{HOST}:{port}/health")
    try:
        ThreadedServer((HOST, port), Handler, sock).serve_forever()
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
