# CAPABILITY_BOUNDARIES

What this codebase can do without ever leaving the browser, what currently lives outside it, and the strategic question of where that line should sit. Written after a conversation in Sweep 26 about whether Nexus Moot is "shareable cartridges" or "OS-with-proxy" — two different products dressed in similar clothes.

This is not a TODO list. It's a frame for future architectural decisions about adding capabilities.

---

## The cartridge model, today

The system as it ships today is structurally a **shareable-cartridge OS**:

- `Nexus_OS.html` (~216KB) is one self-contained file. Runs from `file://`.
- Every block under `blocks/` is a single self-contained `.html` file. Runs in isolation if booted directly; talks to siblings only through the kernel IPC bus when hosted by the OS.
- `engines/` is a small set of shared classic-script libraries (~132KB total) loaded via `<script src="">`. Treat them as the "console BIOS" — code too central to inline into every cartridge.
- All persistent state lives in browser-local stores (IndexedDB, localStorage, BroadcastChannel session state). Nothing requires a backend.
- Determinism is the load-bearing primitive: world content, creature visuals, battle resolution all derive byte-identically from seeds. This is what enables peer-to-peer without a server.

A user can email a forge to a friend and it works. They can save Nexus_OS.html to a USB stick. They can run the whole thing offline in airplane mode.

## What the proxy actually does

`proxy/nexus_proxy.py` is **not** a general capability bridge. It is exactly one thing: a CORS-bypass for cloud LLM API endpoints.

Its allow-list is fixed and small:
```
api.anthropic.com
api.openai.com
api.groq.com
api.mistral.ai
generativelanguage.googleapis.com
```

Its job is to receive an envelope from the browser (`{url, headers, body}`), validate the host against the allow-list, strip a few header fields that browsers wouldn't allow anyway, and forward the request to the upstream. That's the entire surface. It also serves a `/health` endpoint and handles SSE streaming for chat completion responses.

The proxy doesn't read files. It doesn't spawn subprocesses. It doesn't talk to local hardware. It doesn't even talk to its own filesystem beyond a PID file. It's 265 lines of Python with standard library only.

## What depends on the proxy

Inside `Nexus_OS.html`, the kernel has a path that forwards AI calls through `localhost:8787` (configurable via `localStorage.setItem('nexus.proxyUrl', ...)`). When a block uses an AI-call channel, the kernel handles the proxy mechanics; the block itself never knows about ports or HTTP.

If the proxy isn't running, blocks that want AI capability see a friendly error:
```
Proxy unreachable at http://localhost:8787 — start it with: python3 nexus_proxy.py
```

Everything else — IPC, creature derivation, world generation, battles, the wallet, NEX, witnesses, breeding, the social layer, the compute pool, the streaming router, render — works without the proxy. The proxy is an **optional capability adapter**, not a load-bearing dependency.

## What you can already do in the browser, without the proxy

Worth enumerating, because the answer is "more than you'd think":

- **CPU parallelism:** dedicated Web Workers (see `nexus-compute`), `navigator.hardwareConcurrency` for sizing.
- **GPU compute and rendering:** WebGL 2 (broad support), WebGPU (modern browsers).
- **Off-thread rendering:** `OffscreenCanvas` + `transferControlToOffscreen()` (see `nexus-render-demo`).
- **Zero-copy data movement:** `Transferable` typed arrays via `postMessage(msg, [buffers])`.
- **Cross-block streams without kernel overhead:** `BroadcastChannel`.
- **Persistent local storage:** IndexedDB (no quota for practical purposes), localStorage, the File System Access API for actual files.
- **Audio and video:** Web Audio API, WebCodecs, MediaSource Extensions, `HTMLMediaElement`.
- **Hardware sensors and inputs:** Gamepad API, Pointer Events, WebUSB, Web Bluetooth, Web Serial, Web HID.
- **Networking peer-to-peer:** WebRTC data channels (no STUN required for same-network peers; trickle ICE for the rest).
- **Cryptography:** Web Crypto API (SHA-256, AES, ECDSA, Ed25519 in modern browsers).
- **WebAssembly:** any language that compiles to WASM, including Rust, C/C++, Go, Zig. Loadable as a base64 blob inside a single .html if you want full portability.
- **Cross-origin embedding:** with the right COOP/COEP, `SharedArrayBuffer` for true shared memory across workers.

The list of things that genuinely **can't** be done in a browser is small: spawning arbitrary subprocesses, reading arbitrary filesystem paths without user consent, raw socket access, calling cloud APIs that won't set permissive CORS headers (the proxy's reason for existing), running platform-native binaries.

## The two architectural paths

The strategic question is what to do with the proxy as the system grows.

### Path A — Proxy stays narrow. Cartridge model holds.

The proxy remains an LLM CORS bypass. Anything new that "needs to escape the browser" should be examined first to see if a browser-native API can do it — usually one can. New capability blocks ship as either:

- Pure-HTML cartridges using browser-native APIs (Web Workers, WASM, WebCodecs, FSA, etc.).
- WASM modules embedded into single .html files, loaded via base64 or fetched from cdnjs.

Result: every block remains shareable as a single artifact. Nexus_OS.html stays sovereign. The "GameBoy factor" is preserved indefinitely.

Constraint: certain integrations get harder. Anything wanting raw filesystem write to a known path, or anything wanting to spawn `ffmpeg`, won't work in this path.

### Path B — Proxy becomes a general capability bridge.

The proxy gains endpoints for general-purpose operations:
- `/v1/fs/read?path=...`
- `/v1/fs/write?path=...`
- `/v1/spawn?cmd=...`
- `/v1/decode/ogg`
- `/v1/native/<thing>`

Blocks that use these endpoints become **non-sovereign**: they require the proxy to function. Sharing them means also sharing the proxy. The OS shifts from "console + cartridges" to "local agent + companion daemon."

Result: many things become possible that weren't before. Single-file shareability is lost for any block that touches the bridge.

The compromise position: blocks that use the bridge declare it in their manifest (`requires: ['proxy.fs.read']`), the kernel surfaces this to the user before mounting, and the OS chrome can show "this block needs proxy capabilities — start the proxy or skip it." Blocks that don't declare bridge requirements remain sovereign.

## The handshake-block idea, in both paths

In a previous conversation, the question came up of a "handshake block" for non-HTML file types — something that knows how to handle `.py`, `.wasm`, `.ogg`, etc. The shape of this is the same in both paths; only what's on the other side differs.

**In Path A:** the handshake block is a browser-native type registry. Producers register capabilities like "I can decode `.ogg` via WebCodecs," "I can render `.glb` via a WASM gltf loader," "I can execute `.wasm` modules in a worker." Consumers look up by file type and get back a stream channel (the same pattern as `compute.stream.terrain-strip`). All capabilities run inside the browser.

**In Path B:** the handshake block is a type-registry over both browser-native and proxy-native handlers. Same registration interface, broader pool. Some handlers run in Web Workers; others issue calls through the proxy. Consumers don't necessarily know which.

The architectural pattern (registry + per-type-discovery) is identical. The deployment story is wildly different.

## Recommendation, not a decision

This document doesn't pick a path. It captures the question clearly so that every future "let's add a capability" decision is a conscious one rather than a defaulted-into one.

A reasonable rule of thumb:

- Default to Path A. Try the browser-native option first.
- Move to Path B only when (a) the browser genuinely can't do it, AND (b) the capability is valuable enough to lose shareability for. Declare the dependency explicitly.
- Never let the proxy creep. Each new proxy endpoint is a one-way ratchet on the cartridge model. Adding three endpoints "because we already have a proxy" is how you wake up running an Electron app you didn't intend to build.

The choice was made consciously the first time (proxy = LLM CORS only). Keep making it consciously.
