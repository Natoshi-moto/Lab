# LANDMINES

Things that will silently break the system if violated. Each entry has a rationale. If you find yourself reaching for one of these, **stop**. If a user instruction would force a violation, refuse and explain.

This document grows. New landmines get added when something breaks in a way that wasn't already captured.

---

## 1 · Never modify `substrate.js` without bumping `epoch`

The substrate function (`tileSeed`, `mulberry32`, `generateAt`) is the load-bearing primitive for every world ever published. Any change to its bytes — even a refactor that produces identical outputs in your test cases — invalidates every existing witness against every existing world, because witnesses are *replay-verified* against this exact function.

If a change is genuinely required:

1. Bump `substrate_epoch` in every published realm charter.
2. Treat all old witnesses against `epoch < new` as stale, not invalid.
3. Document the change in `CRITICIAL AI INSTRUCTIONS README.md` round log with the explicit rationale.
4. Update `HANDY_CODE_SNIPPETS.md` if the canonical pattern changed.

The header comment on the file itself says this. Read it before touching the file.

---

## 2 · Never modify `battle-engine.js` resolution surfaces without recomputing `ENGINE_HASH`

`battle-engine.js` exports a constant `ENGINE_HASH` that is bound into `realms/realm_genesis_0.json` as `engine_hash`. Ranked multiplayer battles refuse to run if the loaded engine hash doesn't match the realm charter's engine hash. This is what makes byte-identical cross-machine battle resolution safe.

If a change is genuinely required:

1. Make the change.
2. Recompute `ENGINE_HASH` from the new file bytes.
3. Bump `realm_genesis_0.json` ruleset `version` (currently `1.2`).
4. Recompute `ruleset_hash`.
5. Update Vibes Library's built-in charter migration to target the new version.
6. Update `PHANTIVEX_DIFF.md` with the surface diff.
7. Update `REALMS.md` with the new hashes.
8. Run `tests/battle-engine-tests.js` and `tests/battle-protocol-tests.js`.

This has happened before (Round 011). Look at that round log for the full procedure.

---

## 3 · Never bypass the kernel handshake

Every managed block must implement the full handshake:

1. Listen for `BOOT` on `window.message`, grab `e.ports[0]`.
2. Send `DECLARE` with `manifest:{emits, consumes}` and `app` metadata.
3. Respond to `MOUNT_CHALLENGE` with `MOUNT_ACK` echoing the nonce.
4. After receiving `MOUNTED`, send **explicit `SUB` messages** for every channel in `consumes`. Declaring in `consumes` is an allowlist, not a subscription. **This is the single most common bug when writing new blocks.**
5. Respond to `PING` with `PONG`.

Skip any of these and your block silently fails to receive messages. The watchdog will eventually kill it. There is no error message that points at the missing step — the symptom is just "the block never gets messages."

The canonical handshake snippet is in `HANDY_CODE_SNIPPETS.md`.

---

## 4 · Never store rendered images

Creatures, environments, attacks, worlds — all are deterministic functions of small seeds. A 16-byte DNA + 3 hue floats fed through `mulberry32` produces every visual feature: body shape, plate count, eye position, gradients, animations.

If you are reaching to save a rendered image, a particle config snapshot, or anything bigger than the seed: **stop**. Save the seed. Render on demand.

This rule is what makes a library of 10,000 creatures fit in a couple of MB. Violating it inflates storage by orders of magnitude and breaks the "anyone can regenerate any creature anywhere" property.

---

## 5 · Never introduce a build step

No npm. No webpack. No vite. No transpilation. No TypeScript. No React. No Vue. No bundlers. No CSS preprocessors. No source maps.

The entire appeal of this stack is that it's small — twenty thousand lines of original code, no dependencies — and runs from `file://` with a double-click. Adding a build step destroys this property and is not reversible without backing out the change.

External CDN imports for fonts and a few crypto libraries are allowed (they are already in use). Local node-only test scripts are allowed (the harness uses them). Anything that introduces a `node_modules/` folder or a `dist/` folder is forbidden.

---

## 6 · Never break standalone mode

Every forge must keep working when opened directly outside Nexus, without the kernel. The `vibe-adapter.js` shim provides this fallback (file picker / Blob download instead of channel I/O). Do not undo it.

The user uses standalone mode regularly. Forges are sovereign single-file HTMLs that double as Nexus blocks; that's the architecture's defining property.

---

## 7 · Never use copyrighted IP

The user's creatures, names, and universe content are original. Keep them that way. No Pokémon names. No Disney references. No reproduction of song lyrics, sheet music, or substantial copyrighted text in any block.

This is both a legal constraint and an aesthetic one — the project's identity depends on its originality.

---

## 8 · Never silently catch errors — except during cleanup

Logging is non-negotiable. The Terminal block (`blocks/apps/app-terminal.html`) is the user's primary debugging surface and it shows the kernel feed. Errors that get caught and dropped become invisible bugs that take hours to debug.

`try { ... } catch (e) {}` is forbidden in normal code paths. `try { ... } catch (e) { console.warn(...) }` is acceptable. `try { ... } catch (e) { logger.error(...) }` is preferred.

**The one explicit exception**: silent `catch (_) {}` is permitted in cleanup / teardown paths where the inner operation is best-effort and the failure is *expected* — specifically:

- `port.close()` when the port may already have been closed by the other side.
- `URL.revokeObjectURL()` when the blob URL may have already been revoked.
- `port.postMessage()` to a port that may have been closed since the call was scheduled.
- `getFile()` on a `FileSystemFileHandle` for stat-only purposes when the underlying file may have been moved or deleted.

The kernel currently uses this exception at 8 sites in `Nexus_OS.html`, all in the cleanup helpers (`cleanupBlock`, `evictBlock`, kernel broadcast, fs.result reply, fs stat). Each is a place where an error genuinely means "the thing is already gone" and logging it would be noise.

If a silent catch appears outside these patterns, it's a bug. Wrap it in a `console.warn` with context.

---

## 9 · Never reach for big-name packages

The codebase has zero npm dependencies. Crypto comes from `crypto.subtle` (browser) and `require('crypto')` (Node tests). Storage comes from IndexedDB. Networking comes from `fetch` and WebSockets. Hashing is hand-rolled `mulberry32` and SHA-256 via `crypto.subtle.digest`. The single external runtime dep is the Nostr secp256k1 library loaded from CDN at the point of use.

If you are tempted to `npm install` something to solve a problem, the answer is to write the ~50 lines you need by hand. The codebase is full of examples.

---

## 10 · Never put broken code in the delivered zip

If a sweep hits an impasse — a snag you cannot work around without compromising correctness — the canonical archive does not get updated with broken work.

Procedure:

1. Calmly explain the impasse to the user.
2. Log the impasse in `FREEDOM_REASONING_LOG.md` with format compliance.
3. Generate a brainstorming prompt the user can take to multiple AI instances for an outside view.
4. Wait for new instructions.
5. Deliver the **previous** sweep's archive, unchanged, if a delivery is needed in the meantime.

The archive is the source of truth. Polluting it with half-finished work poisons every downstream session.

---

## 11 · Catalog paths must match filesystem paths

`Nexus_OS.html`'s `BUILTIN_CATALOG` and `LEGACY_CATALOG` register every block by its file path. These have drifted at least twice (Rounds 005 and the path-normalization patch in `nexus-os-patch.md`).

When you add, rename, or move any block file:

1. Find its catalog entry in `Nexus_OS.html`.
2. Update the path in the same sweep.
3. Run `tests/run.sh` — `tests/catalog-paths-tests.js` will fail if a path is drifted.
4. Manually verify the block launches.

The automated check was added in Round 016. It checks that every catalog entry either points at a real file or is explicitly `disabled:true`.

---

## 12 · Never paraphrase the operating contract typo

The file `CRITICIAL AI INSTRUCTIONS README.md` has a misspelling of "CRITICAL" in its name. The misspelling has been preserved across at least 12 rounds and is now the canonical filename. Do not "fix" it without explicit user instruction. Tools and scripts may reference the file by exact name.

If the user asks for it to be renamed, fix it in one sweep that also updates every reference. Don't fix it as a side effect of another sweep.

---

## 13 · Filenames with spaces are fragile

Three blocks in `blocks/` currently use spaces and dotted version numbers in their filenames:

- `blocks/Nexus Social v0.02.html`
- `blocks/Nexus Channels v0.02.html`
- `blocks/Nexus Forums v0.02.html`

Spaces break naive shell scripts, naive URL handling, and naive `fetch()` calls. They have not yet broken anything in this codebase only because every reference to them happens to be quoted correctly. **Do not add new files with spaces.** A future sweep will rename these to kebab-case.

---

## 14 · Test pass count must not regress

Before any sweep modifies code, run `bash tests/run.sh` and record the baseline pass count. After the sweep, run it again. If passes decreased and the sweep wasn't explicitly changing test expectations, the sweep is not done.

The baseline as of the 2026-05-09 boot calibration is **473 passes across thirty-two summary groups**. Any sweep that ships with fewer needs to either (a) explicitly justify the reduction in the round log or (b) be reverted.

---

## 15 · Don't reason about block isolation without reading SANDBOX.md

The iframe sandbox is not as strict as some comments in the codebase imply. `allow-same-origin` is set on every block — managed and legacy — for localStorage, crypto.subtle, and dynamic CDN import. This means the sandbox protects against buggy blocks, not hostile ones. `KERNEL_SECRET` is a fence between roommates, not a lock.

Read `docs/SANDBOX.md` before designing anything that depends on block-to-block or block-to-kernel isolation, especially anything labeled "community blocks." The three real options are documented there.

---

## 16 · Community-block identity is the SHA-256 of the bytes

The canonical identity of a community block is `sha256(html_bytes)`. Filenames, titles, and authors are all metadata the block can lie about. The hash is the only thing that doesn't lie.

Operations that change the bytes change the identity. A block at `sha256:abc…` and a block at `sha256:def…` are different blocks even if both files are named `cool-thing.html`. The kernel must treat them as different — different storage namespace (under Option C of `COMMUNITY_BLOCKS_DESIGN.md`), different trust grant, different catalog entry.

Two consequences worth naming:

- A "version bump" of a community block produces a new identity. The operator must re-grant trust, just like installing a fresh block. There's no in-place upgrade for community blocks. (Self-tier blocks, which the operator wrote, can update freely — the trust is in the operator, not the bytes.)
- The `block-hash.html` block is the operator's tool for verifying identity before installation. Use it. If a friend says "the block I sent you should hash to sha256:abc…", paste it into block-hash and confirm before double-clicking.

Implementation note: when the kernel-side install flow ships (Round 024+), the catalog will need a `hash:` field for community-tier blocks, computed at install time. Until then, the installation surface is the operator's eyeballs and `block-hash.html`.

This landmine is forward-compatible with all three options in `docs/COMMUNITY_BLOCKS_DESIGN.md` — content-addressing is required by every option, so committing to it now is safe regardless of which sandbox option ultimately ships.
---

## 17 · Never add case-only duplicate filenames

Do not add files that differ from existing files only by case, such as `README.MD` beside `README.md` or `LANDMINES.MD` beside `docs/LANDMINES.md`. The archive may be unpacked on case-insensitive filesystems where those names collide.

If a prompt names a document with different casing, treat the existing canonical path as the document unless the user explicitly requests a casing/rename sweep. If such a sweep is requested, update every link and reference atomically and test the zip on a case-insensitive extraction target if possible.
---

## 18 · Static contract checks are guardrails, not a proof of protocol correctness

`tests/block-contract-tests.js` catches the historical handshake failures that cost time in Rounds 017–019: block-side `type:'MSG'`, PONG without nonce, and static emits that are missing from `manifest.emits`. It is valuable, but it is not a formal verifier.

Known limits:

- Client-backed blocks are exempt from rules A/B because `nexus-block-client.js` owns those envelopes. That does **not** prove every higher-level channel handler is correct.
- Rule C only sees static string-literal channels. Computed channel names can still drift.
- `eidolon-os.html` is a nested kernel-host; kernel→block `type:'MSG'` is legitimate inside it. Do not blindly delete those sends because a grep found them.
- A passing harness does not claim browser UI, live Nostr relay behavior, cross-window multiplayer, or local filesystem behavior through the File System Access API. Use `docs/OPERATOR_SMOKE.md` for those.

For protocol edits, pass the harness **and** manually reason through the handshake lifecycle for the touched block.
---

## 19 · Do not use fixed sleeps as initialization barriers in tests

A fixed delay is not a readiness signal. Calibration sweep 2 exposed this in `tests/protocol-harness.js`: a 50ms sleep after Vibes Library hooks appeared sometimes let tests mutate `cache` before the block's async initializer finished its final `loadAllToCache()`. The resulting failures looked like logic bugs in attestation, charter migration, slot consumption, and imprinting.

For test helpers that boot managed blocks:

- Provide mocks for startup syscalls such as `fs.status` if the block expects them.
- Wait for the block's explicit readiness emit (`system.block_ready` for Vibes Library) or another stable observable state.
- Do not patch flakes by increasing sleeps from 50ms to 100ms or 500ms. That only hides the race until a slower run.


---

## 20 · Local script paths are runtime dependencies

A block can have valid inline JavaScript and still fail at runtime if its local `<script src>` import points at the wrong relative path. This is easy to cause during folder moves because every current block lives two levels below root and therefore loads shared engines with `../../engines/<file>.js`.

`tests/local-script-refs-tests.js` now guards this surface. Do not remove it as “just a path check.” It protects the browser boot path that `node --check` cannot see.

When adding a shared script to a block:

- For current `blocks/<category>/<file>.html` files, use `../../engines/<file>.js`.
- Keep `nexus-block-client.js` before any script that expects `window.NexusBlockClient`.
- Re-run `bash tests/run.sh` and require `SCRIPT-REF SUMMARY pass=31 fail=0` or an intentionally updated count.

---

## 21 · Generated imprint HTML must wire its embedded DNA to its renderer

`engines/eidolon-generator.js` emits descendant artifacts with JSON in `#creature-dna`, and the embedded scar renderer must parse that exact JSON before drawing. Phase D fixed the prior `GENE_DATA` gap by emitting `const GENE_DATA=JSON.parse(document.getElementById('creature-dna').textContent);` before `draw()` reads the data.

`tests/imprint-tests.js` now guards this bridge: generated HTML must contain the `#creature-dna` JSON tag and the explicit parse into `GENE_DATA`, with the bridge appearing after the JSON writer. Do not replace this with a looser canvas/string check; the invariant is writer-to-renderer linkage, not mere artifact decoration.

---

## 22 · Wall-clock values must not enter content-addressed identity by accident

`Date.now()` / `new Date()` are acceptable for local UI metadata and live network query windows. They are not acceptable as hidden inputs to content hashes, deterministic IDs, lineage edges, slot consumption records, battle result payloads, or generated artifact payloads unless the timestamp is an explicit protocol input.

Phase A found wall-clock values in battle/breed IDs, slot records, lineage edges, result payloads, and imprint payloads. Before editing those systems, classify each timestamp as either event metadata or identity content. If it is identity content, derive it from canonical inputs, require a caller-provided protocol timestamp, or keep it out of the content-addressed body.

Phase A.5 encoded the current convention:

- Deterministic IDs use `sha256Hex(canonical(...))` over stable inputs plus a required caller nonce/counter.
- Slot consumption, battle result payloads, lineage edges, and imprint records must receive or derive deterministic `ts` values; silent wall-clock fallback is a bug.
- Imported Nostr-shaped evidence must use the source event `created_at`; missing/non-numeric `created_at` rejects the import instead of substituting local time.
- Commit-reveal salts require WebCrypto / Node crypto or an explicit deterministic test provider. `Math.random()` fallback is forbidden.
- UI/request/session timestamps may stay nondeterministic only when marked as `METADATA: display only, not content-addressed`.

The battle-protocol wrapper timestamp question remains deliberately deferred: see `docs/BATTLE_ENGINE_PARITY.md` Section 2 rows marked `DEFERRED — protocol message ts`.
---

## 23 · Router and OS must not redefine canonical battle math

`blocks/eidolon/eidolon-router.html` is allowed to own world orchestration: population, walking, challenge routing, evolution, local persistence calls, 80-turn cap policy, and AI move selection. `blocks/eidolon/eidolon-os.html` is allowed to own interactive presentation: player input, local enemy move selection, log pacing, canvas animation, HUD updates, and boot instrumentation. Neither block may own battle-resolution math.

After Phases B and C, both blocks consolidate battle resolution through `window.NexusBattleEngine` loaded from `../../engines/battle-engine.js`. Do not reintroduce local definitions for:

- `BASE_MOVES` / `TRAIT_MOVES` / `BEATS`
- `computeStats()` / `deriveMoves()` / `deriveTypes()`
- `simCalcDmg()` / `calcDmg()` or local damage/effect/status/accuracy gates
- `statusTick()` as a local source of battle outcome truth

`tests/router-battle-tests.js` and `tests/os-battle-tests.js` statically check those symbols and compare block-driven battles/turns against canonical-direct results. If a future router or OS change needs different behavior, it is an orchestration/presentation policy question first; canonical math changes require the usual battle-engine review and `ENGINE_HASH` discipline.



---

## 24 · Shell notification consumption must stay narrow

`Nexus_OS.html` now lets the shell notification service consume a curated set of channels before dead-letter accounting. This is intentional for OS-level attention events such as `economy.notify.*`, `witness.notify.*`, `lattice.imprint`, `lattice.library.changed`, `vibe.notify`, and `system.health`.

Do not broaden this into a generic "kernel ate my event" path. Unknown channels must still dead-letter when no mounted block subscribes. Otherwise the dead-letter panel stops being a trustworthy protocol diagnostic.

---

## 25 · `engines/nexus-tokens.css` is not yet a boot dependency

Sweep H created `engines/nexus-tokens.css` as a reference seed for future shared CSS extraction. The active shell tokens remain inline in `Nexus_OS.html` to preserve the single-file OS entry and avoid creating a new stylesheet load requirement for every boot path.

If a future sweep makes this CSS a runtime dependency, audit local file serving, archive layout, `file://` behavior, and every block path first. Then add tests that prove the stylesheet resolves.


## 26 · Player Thread is guidance, not progression

`nx-player-thread` is local UX memory only. Do not use it as proof of protocol completion, economy state, battle state, witness reputation, or rewards. Its storage key is `nx-player-thread-${KERNEL_SECRET}` and its history is bounded for convenience, not audit.

Do not add language like "quest", "objective complete", "daily", "reward unlocked", or "claim" unless a real existing protocol state supports it. The player must be able to ignore the thread forever.

## 27 · Wallet / Genesis visual polish must not touch money rules

The Sweep I/J wallet and genesis upgrades are presentation-only. Before editing near them, separate copy/CSS/layout from:

- `verifyGenesis`,
- `verifyOutputExistence`,
- genesis authority pinning,
- consumed source registry,
- conservation checks,
- lock/resolve/stake acceptance rules.

Changing any of those is a protocol/economy sweep, not a beauty sweep.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

### Zero-start economy canon

Do **not** reintroduce automatic wallet funding on boot, task completion, login, or first contact. Player-facing Wallet v4 starts at `0 NEX` until a real receive/earn/economy path changes it.

### Missing path regression

The following paths were reported as Chromium 404s and are now real files. Future sweeps must keep them present or disable their catalog entries:
- `blocks/world/first-contact.html`
- `blocks/system/welcome.html`
- `blocks/forges/lattice-shell.html`
- `blocks/forges/compose-stage.html`
- `blocks/forges/environment-forge.html`

### Atlas/Vibes Library dependency

Atlas must not hard-fail if `vibe.list` times out because Vibes Library is closed. Keep the local fallback and/or improve the responder lifecycle.

### Search/Delete browser shortcut

Launcher and file-browser search inputs must stop Delete/Backspace propagation. Chromium may otherwise surface shortcut-deletion UX over the app.

## Sweep 14 landmines

- Do not reintroduce automatic wallet grants for onboarding, first-contact, task completion, or genesis. Player-facing wallets must start at 0 NEX unless a real accepted transition exists.
- Do not label unspent / locked / consumed output counts as separate balances. They are proof-output statuses behind one visible NEX balance.
- Do not make First Contact depend on Vibes Library already being open. It must mirror locally and degrade cleanly if `vibe.save` times out.
- Do not make Compose Stage a second battle engine. It is a guided launcher to existing forge surfaces, especially `blocks/forges/the-room.html`.
- Do not import desktop home notes repeatedly. Companion must clear `nexus:home-note-inbox:v1` after creating the note.



## 28 · Exact-case boot docs are calibrated indexes, not divergent manuals

The root-level files `README.MD`, `CODEBASE_ORIENTATION.MD`, `FREEDOM_REASONING_LOG.MD`, `HANDY_CODE_SNIPPETS.MD`, `HANDY_LESSONS.MD`, `LANDMINES.MD`, and `AI_CODEBASE_HANDOFF.MD` exist to satisfy the operator's literal boot-contract filenames. They are useful entry indexes, but the detailed canonical content remains in `README.md`, `AI_CODEBASE_HANDOFF.md`, and `docs/*.md`.

Do not let the exact-case files drift into a second, conflicting documentation system. If a material baseline, invariant, or path changes, update the canonical doc and the corresponding exact-case snapshot together.

## Recovered Eidolon forge canon must not be lost again

`legacy/eidolon-forges/` contains restored source material the operator explicitly called foundational. Do not delete, rename away, minify, or “clean up” these files as unused legacy. They are the reference implementation for the intended creation UX.

Specific landmines:

- Do not replace forge axes with vague presets.
- Do not make creature/world/battle creation static.
- Do not break plain JSON save/load round-tripping.
- Do not make First Contact grant NEX while adopting these tools.
- Do not integrate them by bypassing the Nexus block protocol; adapt them carefully when made active.
- Do not let future docs imply the current simplified First Contact / Environment Forge / Compose Stage is the final intended UX.

---

## Sweep 15 — Living Forge OS integration (2026-05-09)

Calibration baseline after this sweep: **526 passes / 0 fails** via `bash tests/run.sh`; `node tools/channel-atlas.js --check` passes with **67 channels across 35 blocks**.

Material user-facing changes:
- Added shared Eidolon UX/runtime adapters: `engines/eidolon-schema.js`, `engines/eidolon-creature-renderer.js`, `engines/eidolon-environment-renderer.js`, `engines/eidolon-battle-renderer.js`, `engines/eidolon-storage.js`.
- First Contact now uses the shared live creature/world forge renderers and emits both `system.companion.selected` and `system.environment.selected` on acceptance.
- The OS shell now renders the selected environment as an animated desktop canvas and the selected companion as an animated bottom-left inhabitant.
- Lattice Shell is now a real axis-level creature forge with editable labels, locks, sweeps, group randomize, and selected-companion persistence.
- Environment Forge is now a full axis-level world forge with presets, 16:9 live canvas, sweep controls, creature silhouette preview, Library save, and Atlas fallback.
- Compose Stage is now a Battleforge-style scrub/playback attack authoring surface with 3x3 candidates, phase bar, templates, and `system.attack.selected`.
- Web Viewer now has a persistent history stack, repaired back/forward routing, search fallback, and Delete/Backspace shielding in the URL bar.
- Companion imports canonical Eidolon `axes` specs and polls the Home Notes inbox for same-tab iframe writes.

Preserved invariants:
- Wallet remains zero-start and one visible NEX balance.
- No economy, witness, ranked-battle, or deterministic battle math was changed.
- Legacy Eidolon files remain preserved under `legacy/eidolon-forges/` as canon/source material.

## Sweep 16 calibration — First Hour UX

Sweep 16 adds the first-hour onboarding layer over Living Forge OS: active Nexus-native Multiforge, clearer First Contact outcome copy, companion first-time callout, visible Home Notes → Companion handoff, Wallet zero-start explanation, Web Viewer empty/blocked/disabled states, and Player Thread v2 guidance. Runtime scope remains UX/UI only; wallet canon remains one visible NEX balance starting at 0.

## Sweep 18 — Eidolon OS companion bridge

**Eidolon OS player DNA now derives from `nexus:selected-companion:v1` seed via `dnaFromSeed()`.** Do not change this derivation without also updating `loadCompanionFromOS()`. The bridge between the schema's `seed` field and the OS battle renderer is intentional and must remain consistent.

Specifically:
- `dnaFromSeed(seed)` uses `mulberry32(Number(seed) >>> 0)` — the same PRNG used throughout the engine. If the PRNG changes, this must change with it.
- `loadCompanionFromOS()` validates that `spec.seed` is a finite number before proceeding. Do not relax this check without understanding the impact on battle-engine determinism.
- Standalone mode (no localStorage, no OS) must always fall back to `randomDna()`. Do not make the OS hard-depend on companion state.

## Sweep 19 — Window titlebar controls are RIGHT-side canon

**Window titlebar controls (–, □, ✕) are on the RIGHT. The status dot is on the LEFT. Both positions are intentional UX canon (Windows-style, not macOS-style).**

Do not move the controls back to the left without an explicit operator-approved UX sweep. The `.nx-titlebar-controls` wrapper holds `min, max, close` in that order and is always the last child of the titlebar. The state dot is always the first child.

Concretely: `[●] [Title] [conviction] [– □ ✕]` is the canonical titlebar order.

## Sweep 19 — setupResize signature changed

`setupResize(win)` now creates 8 handles internally. The old `setupResize(handle, win)` signature no longer exists. Do not pass a handle element as the first argument — it will be silently treated as the window and the actual window argument will be ignored.

If you are creating a new window-creation path and need resize handles, call `setupResize(win)` with the window element. It will append 8 `[class^="nx-resize-"]` divs directly to the window.

## Sweep 22 — Do NOT re-add nx-focus-overlay

**Do NOT re-add `.nx-focus-overlay`.** The bug it created (2-click lag, cursor never changing over iframes in non-active windows) was worse than the problem it solved. Focus-on-click is handled entirely by `win.addEventListener("mousedown", () => focusWindow(block.id))` which is present on every window div. The overlay is gone and must stay gone.

If you find yourself wanting to re-add it to "fix" window focus ordering — stop. Reason through the actual focus bug first. The window mousedown listener is always-on and always fires.

## Sweep 25 — First Contact card-copy intentionally omits stats

**Do NOT re-add the stats grid (`#creature-stats`, `#world-stats`) to First Contact's card-copy overlays.** The `statHTML()` function still exists but its call sites in `renderText()` were deliberately removed. The stats grid (`seed hex / hue° / axis count / "live canvas"`) doubled the overlay height (~140px) and covered the creature's limbs and the world's landscape — the primary visual content the player is evaluating. `statHTML()` may be used elsewhere; leave it defined.

## Sweep 26 — `nx.emit` cannot carry transferables; do not route hot-path streams through the kernel

**Read this before designing any new cross-block streaming feature.**

`engines/nexus-block-client.js` exposes `nx.emit(channel, payload)` for kernel-routed messages. Internally, `emit` calls `port.postMessage(msg)` — single argument, no transferables list. The kernel cannot route MessagePorts or transferable buffers between blocks even if both endpoints could handle them.

What this means in practice:

1. **You cannot pass a `MessageChannel` port from block A to block B through `nx.emit`.** Any attempt will either fail or silently structured-clone the port reference into garbage. Direct block-to-block port handoff is not a supported pattern via the kernel.

2. **Typed-array payloads going through `nx.emit` are always structured-cloned.** For low-rate, small payloads (control messages, occasional results) this is fine. For continuous streams of typed arrays at high rate, this becomes a hot path through the kernel that should be avoided.

3. **The correct pattern for streaming is BroadcastChannel.** `nexus-router.html` exists to broker discovery: producers register a `kind`, get back a BroadcastChannel name, and the router gives consumers the same name when they ask for that kind. The actual stream traffic flows directly via BroadcastChannel — never through the kernel. See `docs/STREAMING_PATTERN.md` for the full pattern.

4. **BroadcastChannel itself does not accept transferables either** — `bc.postMessage(msg)` is also single-argument. But unlike kernel IPC, BroadcastChannel is one structured-clone hop from producer to consumer, after which the consumer holds fresh typed arrays whose buffers it can then transfer to its own internal workers with zero copy.

5. **Do not "fix" this by adding transferables support to `NexusBlockClient`.** The single-argument `port.postMessage` is intentional: the kernel routes messages by reading their `channel`/`payload` shape, and supporting transferables would either (a) require the kernel to handle port lifecycle, which it isn't designed for, or (b) bypass the kernel's routing entirely, which is what BroadcastChannel is already for. The split is correct as-is.

If you find yourself reaching for "let me add a transferables arg to `nx.emit`" — stop. The thing you actually want is the streaming pattern above.


## 2026-05-17 — Do not let legacy/copy block surfaces emit block-side `MSG`

The contract harness scans `.html` block surfaces beyond the polished launcher path. A copied or stitched block can break the repo even if it is not the first surface humans open.

Current known case: `blocks/nexus-lattice(1).html` fails Rule A because it sends block-origin `type:"MSG"`. In the current kernel contract, `MSG` is reserved for kernel-to-block delivery. Blocks should send `DECLARE`, `MOUNT_ACK`, `SUB`, `PONG`, and channel traffic via `EMIT`.

Repair rule: fix the narrow bridge protocol or quarantine the duplicate intentionally. Do not broad-rename or bulk-rewrite Lattice/Eidolon bundles while addressing this.

---

## 18 · `MSG` is kernel-to-block; block-origin traffic must use `EMIT`

The kernel router accepts block-origin messages with these types only: `DECLARE`, `SUB`, `MOUNT_ACK`, `PONG`, and `EMIT`. `MSG` is the kernel-to-block delivery envelope used by `deliverMessage()` and API replies.

A hand-rolled block bridge that publishes with:

```js
port.postMessage({ type: "MSG", channel, payload })
```

will fail the contract analyzer and will hit the kernel's `unknown type: MSG` violation path at runtime. The correct block-origin publish envelope is:

```js
port.postMessage({ type: "EMIT", channel, payload })
```

The 2026-05-17 Lattice bridge repair fixed this exact issue in `blocks/nexus-lattice(1).html` and the root duplicate `nexus-lattice(1).html`. Do not reintroduce `MSG` on the block side unless the file is itself a kernel-host routing messages to child blocks.

## Landmine — Pokémon-style Maker/Player Assumptions (2026-05-17)

Do not assume Eidolin already has Pokémon-style infrastructure:

- No tile-map/grid engine exists yet.
- No runtime-consumed sprite/tile/background asset pipeline exists yet.
- No general `onEnterZone -> action` trigger editor exists yet.
- NexusDB does not dynamically create arbitrary tables during query handling.
- The wallet is browser-local cryptographic accounting, not external blockchain settlement.
- Nostr game events are custom 304xx JSON events; compatibility with third-party Nostr clients should not be assumed.


---

## Landmine — treating IndexedDB capacity as Nexus bus capacity

Do not pass whole map/project JSON through `nx.emit`/`vibe.save` once maps grow. The kernel validates every EMIT payload and rejects overly large/deep/wide/array-heavy structures. A 10,000-tile flat array fails the max array length of 512; per-tile objects will fail the node cap. Use chunked IndexedDB records or router-brokered streams for bulk data.

## Landmine — assuming asset-manifest.json is a runtime sprite loader

`asset-manifest.json` is loaded only as a seam/status signal in the current Eidolin Explore/Lattice runtime. No active code path was found that resolves manifest sprite paths and draws them in the game world. A real loader/sprite atlas system must be built.

## Landmine — adding Nostr 304xx kinds without a registry

Current custom kinds are constants in `blocks/vibes/vibes-library.html`, not a project-wide registry. Adding 30460/30461 mechanically works, but collision and migration risk increases unless a formal kind registry and tags are added first.

---

## 29 · Pokemon tables must use the `pokemon_` prefix — DB namespace guard

The nexus-db.html block enforces that every table name must begin with the querying block's `appId` string (or be `social_events`, or begin with `public_`). The pokemon blocks pass `appId: 'pokemon'`.

Therefore the four pokemon stores MUST be named:
- `pokemon_drafts`
- `pokemon_projects`
- `pokemon_assets`
- `pokemon_saves`

Any other name (e.g. `game_drafts`, `tile_maps`, `asset_blobs`) will result in a silent `PERMISSION_DENIED` from the DB block and all storage operations will fail with no visible error in the block's UI. There is no error message that points at the naming — the symptom is just "saves never work."

---

## 30 · Never send full map data through the Nexus message bus

The kernel sanitizer caps: strings at 131072 bytes total, arrays at 512 elements, object depth at 10, nodes at 1024, object keys at 256.

A 20×20 map ground layer is 400 elements — just under the array cap, but only for that one layer. A 100×100 map ground layer is 10,000 elements — 20× over the array cap. It will be silently dropped.

**Only project IDs, manifestHash values, and small deltas go over the Nexus bus. All project/map data lives in IndexedDB (pokemon_drafts / pokemon_projects) and is passed by reference only.**

BroadcastChannel is the correct transport for live preview streaming between maker and player. It does not go through the kernel sanitizer.

---

## 31 · Never modify `battle-engine.js` for the pokemon maker

The pokemon BattleEngine is a thin adapter OVER `NexusBattleEngine`. It implements zero combat rules. All combat logic comes from the frozen engine.

Adding rules to the adapter that duplicate or shadow the engine's output breaks deterministic verification. The `ENGINE_HASH` certifies the engine is unchanged; any new "rules" in the adapter are uncertified and will cause silent divergence in verified battles.

If new combat behaviour is genuinely needed, it requires:
1. A new primitive in `battle-engine.js`
2. A recomputed `ENGINE_HASH`
3. A realm charter version bump
4. The full procedure in LANDMINES.md #2

Not an adapter-side addition.

---

## 32 · Never put authored stats, moves, or typeChart in the pokemon project format

The creature model is genome-driven. A creature is a 16-byte DNA array. Stats, moves, and types are **pure functions of DNA** computed by `NexusBattleEngine.deriveStats/deriveMoves/deriveTypes`. The engine silently ignores any `stats`, `moves`, or `type` fields you pass.

A top-level `moves` array or `typeChart` in the project JSON is a validator error. The ProjectValidator explicitly rejects these fields with a named error message.

The maker's creature editor is a DNA/genome editor with live derived-stat preview. It is not a traditional stat-block editor.

---

## 33 · DB migration must be strictly additive

When bumping `DB_VERSION` in `blocks/system/nexus-db.html`:
- ONLY create new stores
- NEVER alter or delete existing stores (`social_events`, `config`)
- Use `if (!db.objectStoreNames.contains('pokemon_drafts'))` guards
- Use `if (oldVersion < 2)` guards for version-conditional creation

A non-additive migration will break every existing block that uses IndexedDB. The canonical migration pattern is in `docs/HANDY_CODE_SNIPPETS.md`.

---

## 34 · Every new block must be registered in BUILTIN_CATALOG

New blocks added to `blocks/` do not automatically appear in the OS launcher. They must be added to `BUILTIN_CATALOG` in `Nexus_OS.html`. `tests/catalog-paths-tests.js` will catch entries whose paths don't resolve to real files, but it will NOT catch missing entries. If a block exists but has no catalog entry, the user cannot open it from the launcher.

After adding catalog entries, run `bash tests/run.sh` and confirm `CATALOG SUMMARY pass=N fail=0`.

---

## 35 · `pokemon-engine.js` must remain dependency-free

`engines/pokemon-engine.js` is an IIFE that exposes `window.PokemonEngine`. It must have:
- Zero `import` statements
- Zero `require()` calls (except `module.exports` at the bottom for Node test compatibility)
- Zero references to `NexusBlockClient`, `NexusBattleEngine`, `IndexedDB`, or any Nexus-specific global
- Zero cross-origin URL fetches

The engine runs identically in a standalone HTML double-click and inside a Nexus block. This property is what makes standalone export (session H) possible. Breaking it means the export path is broken.

`tests/pokemon-engine-tests.js` runs the engine headless in Node. If the engine gains a browser dependency, these tests will fail — which is the intended early-warning signal.

