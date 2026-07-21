# SANDBOX

What the iframe sandbox in Nexus OS actually does and doesn't protect against. Read this before reasoning about block trust, before designing the community-blocks story, and before believing any sentence in this codebase about isolation.

This document is descriptive, not aspirational. If the implementation changes, change this file in the same sweep.

---

## The current model

Every block is loaded into an `<iframe>` with the `sandbox` attribute set, and communicates with the kernel through a `MessageChannel` port that the kernel transfers via the BOOT message. The protocol layer (DECLARE / MOUNT_CHALLENGE / MOUNT_ACK / MOUNTED / SUB / EMIT / PING / PONG) is enforced by the kernel router and is genuinely isolating: a block that misbehaves on the protocol gets evicted, and a block can only emit on channels in its declared `manifest.emits` and only receive on channels in `manifest.consumes` for which it has explicitly subscribed.

That part is real protection.

What follows is the part that is not.

---

## The sandbox flags in use

Defined in `Nexus_OS.html`, function `spawnBlock`:

- **Legacy blocks**: `allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock allow-presentation`
- **Protocol-aware ("managed") blocks**: `allow-scripts allow-same-origin`

Both modes include `allow-same-origin`. The justification is in the spawn function: localStorage, the Web Crypto API, and dynamic `import()` from CDNs all require a non-opaque origin to function. Removing `allow-same-origin` would break all three.

---

## What `allow-same-origin` actually means here

When the OS is served from `file://` or any single origin, every block's iframe shares that origin with the kernel page. Browsers treat them as same-origin. That gives a block:

- Access to `window.parent` and the kernel document's DOM.
- Access to `window.parent.localStorage` — the same storage the kernel uses.
- The ability to enumerate every key in localStorage via `localStorage.key(i)`.
- The ability to dispatch synthetic events into the kernel page, scroll it, or rewrite its UI.

The `MessageChannel` protocol does not prevent any of this, because the protocol is opt-in cooperation. A block that wants to break the rules just doesn't talk on the port and instead reaches across the origin boundary directly.

---

## What `KERNEL_SECRET` does and does not do

`Nexus_OS.html` namespaces kernel localStorage keys with a per-session UUID prefix called `KERNEL_SECRET`. The comment in the file says, accurately:

> non-cryptographic but raises the bar significantly

The bar it raises is against accidental key collision between blocks. A legacy block that writes to `nx-pinned` won't clobber the kernel's pinned-app list, because the kernel's key is `nx-pinned-${KERNEL_SECRET}`.

The bar it does not raise: against malicious blocks. The secret is itself stored in localStorage at the well-known key `nx-kernel-secret-v1`. Any block can read it:

```js
const s = localStorage.getItem('nx-kernel-secret-v1');
// s is now the kernel's namespace prefix
```

So a hostile block can read every kernel key, write to every kernel key, and impersonate the kernel's persisted state. `KERNEL_SECRET` is a fence between roommates, not a lock.

---

## What this means for the threat model

The current sandbox is **safe against buggy blocks** and **unsafe against hostile blocks**.

Concretely:

- **Buggy block tries to write outside its lane**: contained. The protocol layer rejects undeclared emits and untrusted control messages, the rate limiter throttles flooders, the watchdog kills blocks that go silent, the manifest forces blocks to declare what they do.
- **Hostile block tries to exfiltrate kernel state**: succeeds. It reads `KERNEL_SECRET` from localStorage, walks the kernel's keys, posts whatever it finds to a remote server using `fetch` (which is allowed; CSP is not set).
- **Hostile block tries to impersonate another block**: partial. It cannot forge `src` on a delivered MSG (the kernel sets that, not the block). But it can write to another block's localStorage keys if it can guess them, and it can read another block's localStorage keys outright.
- **Hostile block tries to take over the kernel UI**: succeeds. `window.parent.document` is reachable. The block can rewrite the desktop, inject phishing prompts, redirect the launcher.

This is a deliberate tradeoff for a single-user system where the user trusts every block they install. It is not a tradeoff that survives community blocks.

---

## What would be required for community-block safety

Three options, in increasing order of effort:

**Option A — Drop `allow-same-origin`.**
Remove the flag from the sandbox. The iframe gets an opaque origin, and same-origin attacks become impossible. Cost: every block that uses `localStorage`, `crypto.subtle`, or dynamic `import()` from a CDN breaks. The kernel must replace these with kernel-mediated channels:

- A `kernel.storage` channel that gives each block a namespaced KV store the kernel persists for it.
- A `kernel.crypto` channel that exposes the operations blocks need (sign, verify, hash, randomBytes) — the kernel holds the keys, blocks request operations.
- Bundle CDN libraries inside the kernel and expose them via `import` from the kernel origin (defeats the point of CDN imports for some libraries).

This is a significant rewrite of every existing block, but it is the correct architecture for hostile blocks.

**Option B — Move the kernel to a different origin.**
Serve `Nexus_OS.html` from `https://kernel.example.com` and load blocks from `https://blocks.example.com`. The browser treats them as cross-origin, `window.parent.localStorage` access fails, the kernel's storage is genuinely isolated. Cost: requires a server (defeats the file:// double-click property), or two `file://` origins which browsers do not provide.

**Option C — Status quo with explicit trust labels.**
Keep the current sandbox. Mark every block as "trusted" or "untrusted" in the catalog. Untrusted blocks get a different sandbox profile (no `allow-same-origin`) and a kernel-mediated storage/crypto API that only they have access to. Trusted blocks (the user's own) keep the current capabilities. Cost: two parallel block environments to maintain. Benefit: the user's existing blocks keep working without rewrite.

Option C is probably the right path for this codebase's growth. None of it is decided yet.

---

## Things that are protections and feel like they aren't

The protocol layer's `manifest.emits` allowlist is a real protection against blocks emitting on channels they didn't declare. The rate limiters are real protection against flooding. The payload sanitizer's depth/breadth/byte caps and prototype-pollution rejection are real. The watchdog reaping unresponsive blocks is real. None of those depend on the sandbox; they're enforced by the kernel router.

The kernel-mediated FS syscall layer (`fs.list`, `fs.read`, `fs.write`) is a real protection — blocks cannot reach the user's filesystem directly because the File System Access API handle is held by the kernel, not the iframe. A hostile block can spam `fs.write` requests but can only write where the kernel allows it to. This is the architectural shape that the storage and crypto APIs would need to take under Option A.

---

## What to do if you find a sandbox-bypass

If a block is found doing something the sandbox flags should have prevented, it is either a browser bug or a flag we should not have set. Capture:

- The exact `iframe.sandbox` attribute used.
- The block code that performed the bypass.
- The browser, version, and origin (`file://` or `http://`).
- Whether any listed flag, if dropped, would close the bypass without breaking other blocks.

File it under a new round in `CRITICIAL AI INSTRUCTIONS README.md` with the writeup. Do not silently change the sandbox flags.

---

## Final note

The reason this document exists: across the codebase, the sandbox is sometimes referenced as if it were stricter than it is. The comment on `KERNEL_SECRET` is the only place that admits the truth, and it admits it in passing. Future readers (human and AI) deserve a single page that says what's protected and what isn't, so design decisions about community blocks, vibe attestation, and shared identity can be made on the actual security boundary instead of an imagined one.
