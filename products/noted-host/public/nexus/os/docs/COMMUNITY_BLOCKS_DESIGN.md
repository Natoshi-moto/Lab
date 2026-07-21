# COMMUNITY_BLOCKS_DESIGN

The architectural decisions required before Nexus can host blocks the user did not personally write or audit. Reads as a design proposal, not yet a contract — when one of the options is committed, this file becomes the contract.

This document supersedes nothing. It complements `SANDBOX.md` (which describes the *current* threat model honestly) and answers the question SANDBOX.md raises but doesn't answer: **what would the system actually look like if someone could install a stranger's block from the internet without the kernel betraying them?**

---

## 0 · Scope

A "community block" is any HTML file the operator did not write themselves and has not personally audited. The sources we expect:

- A friend sends a block over an encrypted chat. The operator double-clicks it.
- A block is published to a Nostr relay with a content-addressed identifier. The operator pastes that identifier into Nexus.
- A block is fetched from a URL the operator types in.
- A block is loaded from a peer's WebTorrent feed via a sidecar protocol.

Across all four, the operator's mental model is the same: "I trust the *substrate* (Nexus) to keep the block from doing something I didn't agree to. I don't trust the block."

The current system does not earn that trust. SANDBOX.md spells out why: every block runs `allow-same-origin` with the kernel, every block can read every other block's `localStorage`, every block can rewrite the kernel's DOM. We're safe against bugs, not against intent.

---

## 1 · The five questions

Anything we ship has to answer these. Everything else is implementation detail.

1. **Identity** — what *is* a block? The same .html bytes? A hash of those bytes? A signed manifest? A nostr-style pubkey + filter?
2. **Trust grant** — when the operator says "yes, install this," what exactly are they consenting to? The kernel's role is to refuse to do anything beyond that consent, even if the block asks.
3. **Storage** — where does a community block put its data? It cannot share localStorage with the kernel or other blocks; that's the whole problem.
4. **Crypto** — the existing blocks need `crypto.subtle` for signing and content addressing. If we drop `allow-same-origin`, that breaks. What's the replacement?
5. **Network** — can a community block reach the open internet via `fetch`? The current sandbox says yes (no CSP is set). Do we want that?

The rest of this doc walks each of the three sandbox options (already named in `SANDBOX.md`) and answers all five questions for that option.

---

## 2 · Option A — drop `allow-same-origin`, mediate everything through channels

**One-line summary:** the kernel becomes the operating system in earnest; blocks become syscall consumers. The same way a Linux process can't read another process's memory and asks the kernel for files, a Nexus block can't reach localStorage or `crypto.subtle` directly and asks the kernel via the existing message-channel protocol.

### What changes

- Iframe sandbox attribute drops `allow-same-origin`. Iframes are opaque-origin.
- `localStorage`, `IndexedDB`, `crypto.subtle`, dynamic `import()` all become unavailable inside the iframe. **This breaks every existing block.**
- The kernel exposes new syscall channels:
  - `kernel.storage.get(key)` / `kernel.storage.set(key, value)` / `kernel.storage.delete(key)` — namespaced per block. The block sees its own key-value store; the kernel persists it (probably to its own IndexedDB).
  - `kernel.crypto.sign(data, keyId)` / `kernel.crypto.verify(...)` / `kernel.crypto.hash(data)` / `kernel.crypto.randomBytes(n)`. Keys live in the kernel; blocks request operations against named keys they were granted access to.
  - `kernel.fetch(url, init)` — gated by allowlist or per-block consent prompt. Returns a body or a stream.
  - `kernel.import(spec)` — loads a CDN library on the block's behalf (CSP allowlist enforced kernel-side).
- Existing blocks all need rewrites. Wallet's UTXO chain, Vibes Library's IndexedDB, Atlas's witness substrate — all reach for `crypto.subtle` and IndexedDB directly today.

### Answers to the five questions

1. **Identity** — content-addressed: SHA-256 of the .html bytes. The kernel computes this on install, the operator sees and confirms. Optional layer on top: a Nostr-signed advertisement saying "the block at hash H has manifest M and was published by pubkey P," which the operator can verify before installing.
2. **Trust grant** — at install time, the operator sees: declared `emits[]`, declared `consumes[]`, requested syscalls (storage / crypto / fetch / import), and any storage namespace requested. They click confirm or cancel. The kernel records the grant. The block cannot escalate at runtime — every syscall checks the install-time grant.
3. **Storage** — `kernel.storage.*` channel. Each block has a private namespace, accessible only to that exact content hash. (Same hash, same namespace; new hash, new block, fresh namespace — operator chooses whether to migrate at install time.)
4. **Crypto** — `kernel.crypto.*` channel. Operations only. The kernel holds keys. Blocks request signing or hashing against named keys they were granted access to. For content-addressing, `kernel.crypto.hash` returns SHA-256 of arbitrary bytes — no key required, available to all blocks.
5. **Network** — `kernel.fetch(url, init)` with a per-block allowlist set at install time. The kernel can also choose to mediate fetch results — strip cookies, cap response size, redact headers. The local-LLM proxy (`proxy/nexus_proxy.py`) becomes the canonical example of how this works in practice.

### Cost

Highest. Every existing block needs a rewrite. Rounds 017–019's handshake unification is a precondition (we just finished the easy half) — without `nexus-block-client.js` adoption, you'd be rewriting 18 hand-rolled handshakes plus migrating their direct-API usages simultaneously. The unification work was, in part, an investment toward this option.

Estimated work after handshake unification is complete: 4–6 rounds for kernel syscall surfaces, 2–3 rounds per existing block to migrate off direct API usage, ~10 rounds total. Realistically a quarter of focused work.

### When to choose this

If the platform is intended to host blocks from arbitrary strangers and the operator is expected to install them casually — like installing browser extensions today. The threat model is "any block I install might be malicious."

---

## 3 · Option B — split origins (kernel and blocks on different origins)

**One-line summary:** keep `allow-same-origin` so existing blocks work, but make sure that origin is *different* from the kernel's origin. Cross-origin browser policy enforces the isolation the sandbox flags don't.

### What changes

- Nexus is no longer servable from `file://`. `file://` doesn't give us controllable origins.
- The kernel page is served from one origin (e.g. `https://nexus.example.com`).
- Blocks are loaded from a different origin (e.g. `https://blocks.example.com`, or per-block subdomains like `https://${hash}.blocks.example.com`).
- `window.parent.localStorage` access fails with a SecurityError. The kernel's storage is genuinely isolated.
- Existing blocks keep working unchanged. Their `crypto.subtle`, `localStorage`, and dynamic imports all still function — they're just isolated to the blocks origin.
- The `MessageChannel` IPC continues to work because `MessageChannel` is origin-agnostic by design.

### Answers to the five questions

1. **Identity** — same as Option A: content-addressed by SHA-256. Per-block subdomains (`<hash>.blocks.example.com`) can give every block its *own* origin, isolated from other community blocks too — paranoia level depending on the deployment.
2. **Trust grant** — install-time prompt similar to Option A, but the consent is shorter because the sandbox is doing more work. The operator confirms emits/consumes; storage and crypto don't require explicit grants because they're already isolated.
3. **Storage** — each block uses its own origin's `localStorage` and IndexedDB. The kernel never sees them. Cross-block sharing happens through kernel-mediated channels (vibe.* etc.).
4. **Crypto** — `crypto.subtle` works inside the block. Keys generated in the block stay in the block.
5. **Network** — `fetch` works as today, subject to the block origin's CORS rules. Tighter control would require a CSP set at the blocks origin via response headers.

### Cost

Medium. Existing blocks don't need rewrites. The cost is operational: the system stops being a "double-click the .html" thing. You need an HTTP server that serves kernel and blocks from different origins. The "sovereign single-file HTML, no server required" property — load-bearing in the project's identity — is broken.

Possible compromises: ship a tiny Python server alongside the kernel that does the origin split locally (`localhost:8000` for kernel, `127.0.0.1:8001` for blocks — different ports, browsers treat as different origins). The server runs locally, no internet involved, but the user has to start it. This is what `proxy/nexus_proxy.py` already does for the LLM gateway; extending it to serve the kernel + blocks is straightforward.

Estimated work: 2 rounds. One to design and ship the dual-origin local server. One to update install/launch flows in the kernel to route block URLs through the blocks origin.

### When to choose this

If preserving the existing blocks' direct API access is more important than the file:// double-click property. This is the pragmatic option for someone who has a working codebase they don't want to rewrite.

### Trade-off worth naming

Per-block subdomains require wildcard DNS (`*.blocks.example.com`), which means the deployment has to be on the public internet or behind a proper local DNS. For purely-local use, all blocks share one origin — meaning blocks can attack *each other's* localStorage even though they can't attack the kernel's. This is a meaningful weakening of the threat model and should be called out at deploy time.

---

## 4 · Option C — split the world: trusted blocks keep current sandbox, untrusted blocks get Option A

**One-line summary:** the existing blocks (Wallet, Vibes Library, Atlas — the operator's own work) keep the current `allow-same-origin` sandbox because they're trusted. New blocks installed from elsewhere get the kernel-mediated syscall sandbox from Option A. Two tiers, marked explicitly in the catalog.

### What changes

- Catalog entries gain a `trust: 'self' | 'community'` field. Default is `'self'` for the existing blocks; install flow always sets `'community'`.
- The kernel's `spawnBlock` reads this field and chooses sandbox flags:
  - `trust: 'self'` → current sandbox (`allow-scripts allow-same-origin`).
  - `trust: 'community'` → tighter sandbox (`allow-scripts` only) plus the syscall channels from Option A.
- Two parallel block environments exist. Existing blocks don't need rewrites. New blocks get the safety properties.
- The kernel must implement and maintain the Option-A syscall channels even though only community blocks use them.

### Answers to the five questions

Identical to Option A — but only for the community-tier blocks. The self-tier blocks keep today's answers (which is to say: the same ones SANDBOX.md describes, with the same caveats).

### Cost

Highest implementation cost in absolute terms (you build all of Option A *plus* the dual-tier dispatch logic in the kernel) — but spread out, because you don't need to migrate any existing block. New community-block work is purely additive.

Estimated work: 6 rounds for the syscall surfaces and dispatch (similar to Option A's first half), 1 round for catalog `trust` field and install flow. Existing blocks untouched. ~7 rounds total.

### When to choose this

If the operator's existing blocks are the platform's value and rewriting them is unacceptable, **and** community blocks are wanted. This is the option that actually matches the project's stated trajectory (the user's own work matters; community contribution is a future direction).

### Trade-off worth naming

The two-tier sandbox is conceptually heavier. Future maintainers (human or AI) need to understand which tier a block is in to reason about its behavior. The kernel is more complex. Mistakes — like accidentally promoting a community block to `trust: 'self'` — silently re-open the trust hole. A future LANDMINE entry would say "never promote a block's trust tier without a fresh content-hash audit."

---

## 5 · The recommendation

Pick **Option C**. Reasoning:

- The user's existing blocks are real software with real architectural commitments (Wallet's UTXO model, Vibes Library's IndexedDB schema, Atlas's witness binding). Rewriting them via Option A is a quarter of work for a benefit that doesn't accrue to the existing system at all.
- Option B sacrifices the file:// double-click property, which is load-bearing in the project's identity (LANDMINE #5, README's first paragraph). The local-server compromise gets it back, but at the cost of "you must start a server first" — same friction the user already cited as a complaint about file:// being unreliable on Chrome. Trading one friction for another isn't an improvement.
- Option C delivers the actual goal — safe community blocks — without disturbing what works.

The cost is that the kernel becomes a two-tier system, conceptually heavier. Worth it.

---

## 6 · The minimal first step regardless of option

Whatever option is eventually chosen, **content-addressing must come first**. Every block, today, is identified by file path. Community blocks need to be identified by hash — because two files with the same name might have different bytes, and you need to know what you actually have.

The minimum surface that's useful immediately:

- A function `hashBlock(htmlBytes) -> sha256:hex` that lives in `engines/` and is shared between the kernel and any verifier block.
- A new block, `blocks/system/block-hash.html`, that lets the operator hash any local .html file or paste contents and see the hash. **This block ships in Round 019 alongside this design doc.** It's the ground floor for whichever sandbox option ships next.
- A `LANDMINE` entry: "the canonical identity of a community block is the SHA-256 of its HTML bytes. Catalog entries should record this hash. Operations that change the bytes change the identity; the kernel should treat them as different blocks."

This step costs nothing in terms of architectural commitment — content-addressing is required by all three options — and it gives the operator a tool they don't have today: the ability to verify that two copies of a "block" actually contain the same code.

---

## 7 · What this document is not

It's not a roadmap. The work to implement any of these options is several rounds of careful sweep, and the user has not committed to community blocks as a priority. The reason this document exists is that the codebase keeps gesturing at community blocks — in catalog comments, in `KERNEL_SECRET`'s justification, in vibe-adapter's "graduating forges" story — without ever specifying what would actually be required. That ambiguity makes it impossible to know whether a given architectural choice is helping or hurting the eventual community-blocks story.

Now the choice is at least named.

---

## 8 · References

- `docs/SANDBOX.md` — the current sandbox model, honestly described. Read this before the design doc; it's the problem statement.
- `Nexus_OS.html` line ~1186 (`spawnBlock`) — the function that would dispatch on `trust:` if Option C ships.
- `engines/nexus-block-client.js` — the client most blocks now use; the syscall surfaces in Option A would be added here as `nx.kernel.storage.get(...)`, etc.
- `proxy/nexus_proxy.py` — already a kernel-mediated network surface (LLM gateway). Provides the precedent for `kernel.fetch` in Option A.
- Round 018 changelog — captured the bug pattern that motivated `tests/block-contract-tests.js`. Community blocks make this pattern more important: a hand-rolled-handshake bug in your own block is a footgun; a hand-rolled-handshake bug in a community block could be deliberate.
