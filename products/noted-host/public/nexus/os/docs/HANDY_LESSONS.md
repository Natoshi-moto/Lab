# HANDY_LESSONS

Patterns, approaches, and habits that have paid off in this codebase. The complement to `LANDMINES.md` — landmines say "never do this," lessons say "doing this is what works."

This document grows. Add to it whenever a pattern repeats with success.

---

## 1 · Determinism is the load-bearing primitive — lean into it

When in doubt about how to represent something, ask: *can this be a function of a small seed?* If yes, store the seed and regenerate. If no, you probably haven't found the right abstraction yet.

Examples already in the codebase:

- 16-byte DNA + 3 hue floats → entire creature visual via `mulberry32`.
- 32-bit `planet_seed` + `(x, y)` → entire world tile content via the substrate.
- Battle outcome: byte-identical given two `(dna, hues)` pairs and a `jointSeed`.
- Witness verification: replay the substrate at the claimed path; if the result doesn't match, the witness is forged.

This isn't a performance optimization. It's the architectural property that makes peer-to-peer multiplayer possible without a server.

---

## 2 · Sovereign single-file HTML is the atomic unit

Every block in this codebase is a single self-contained `.html` file. No build step. No external state required. The user can email a forge to a friend and it will run.

When designing new functionality:

- Default to "make it a single file."
- Resist the urge to split into modules unless there's a real reason (shared engines like `battle-engine.js` are the exception, and they're classic-script UMD-style for a reason).
- Treat external CDN deps as a reluctant exception, not the default.

The Imprint flow generates new sovereign descendant HTMLs (`eidolon-generator.js`) — that's how the user thinks about creature evolution. Each evolved creature is a new HTML file the user can save, share, archive.

---

## 3 · Round structure with explicit Go gates

The user runs work in rounds. Every round has a clear scope, a clear deliverable, and a "Go" gate before the next one.

What works:

- Open with the verdict for this round: what changed, what didn't.
- Close with "say Go for the next round."
- Don't ship three rounds in one response unprompted.
- The CRITICIAL log's What/How/Why/Verification format is the canonical round entry shape.

What doesn't work: trying to chain rounds because "I'm already here, might as well." That's how scope creeps and the user loses control of the sequencing.

---

## 4 · Naming negotiations are generative

The user takes naming seriously. He has explicitly run multi-round naming negotiations (Type → Thing → Vibe was four rounds). When he proposes a name, engage with it as a real proposal:

- Push back if the name is bad. Explain why.
- Build on it if it's good. Suggest variations.
- Make a call when he stops asking. He's stopped asking because he wants you to drive.

What "Atlas" was named (the world creator block): the previous AI made the call when the user stopped answering questions. The user kept the name.

What "Moot" became (the canonical creature noun): the user proposed it mid-stream after the previous AI noted naming inconsistency. The previous AI shipped it.

---

## 5 · Pattern recognition across artifacts is the most-rewarded behavior

When the user sends something dense without commentary, the dense thing *is* the message. Read it carefully. Connect it to other artifacts you've seen.

Specific moments that paid off in past sessions:

- Recognizing that `SPECMOOS` was the same DNA as `PHANTIVEX` with a different palette generator. (Proved DNA and hues were architecturally separate.)
- Reading the `KINDS` registry pattern in `kin-forge` and recognizing it as the user's intuition that "forges share a common shape" already manifesting in code, before the Library was built.
- Seeing the `nexus-witness.html` substrate function and recognizing it could replace a stored world.

Surface-level reads get caught. The user is testing whether you'll actually look.

---

## 6 · Specific, kind, technical

The user's preferred register for AI responses. Concretely:

- **Specific:** "the kernel's `MANAGED_PATHS` set normalizes paths now" — not "the kernel handles paths better."
- **Kind:** disagree without sneer. Push back without performance.
- **Technical:** name the file, the function, the line. Don't hand-wave.

The opposite ("vague, polite, abstract") is the default trained-AI mode. Resist it.

---

## 7 · Keep the canonical archive clean

Every sweep delivers a fresh zip. The zip is the source of truth between sessions. Specific habits that keep it clean:

- Delete `__pycache__/` and any other build artifacts before zipping.
- Don't ship broken code (Landmine 10).
- Update the round log in `CRITICIAL AI INSTRUCTIONS README.md` *every* sweep.
- Update relevant living docs (this file, `LANDMINES.md`, `CODEBASE_ORIENTATION.md`, etc.) when their content has materially changed.

A clean archive after Round N is what makes Round N+1 possible.

---

## 8 · The Terminal block is the best debugging surface

`blocks/app-terminal.html` shows the live kernel feed: every DECLARE, every MOUNT, every channel emit, every error. When something is broken in Nexus, open Terminal first.

Common patterns the kernel feed surfaces:

- A block stuck in LOADING means BOOT was never received or DECLARE was never sent.
- A block that's MOUNTED but doesn't react to messages means it forgot the explicit `SUB`.
- `[legacy]` in the spawn line for a block you expected to be managed means a path mismatch in `MANAGED_PATHS`.
- Repeated PING with no PONG means the block's message handler crashed.

The previous AI noted: "If I'd opened Nexus myself first I'd have seen `[legacy]` in the spawn line and patched the kernel before he ever saw a broken artifact." Get hands on the running system as early as possible.

---

## 9 · Honest scope flags beat optimistic deferrals

When something is "minimum viable" vs "polished," say so explicitly. Atlas Round 1 marked its Round 2 and Round 3 surfaces with literal "R2" and "R3" tags in the UI. The user values that distinction.

The opposite — shipping a stub that looks finished — costs trust. The user will find the stub. The cost is paid later.

---

## 10 · Stable IDs survive content changes

Vibes use **content-addressed IDs**: `id = "v_" + type + "_" + sha256(canonical(payload)).slice(0,16)`. Two saves of the same payload produce the same id → automatic dedup. Renames don't change id; only payload mutations do.

The realm charter's id is similarly content-addressed and stable across migrations: `realm_genesis_0` keeps the same id `v_realm_c85fe8b5cb6941eb` even as its ruleset version moves from 1.0 → 1.1 → 1.2.

When designing a new persistent shape: content-address it.

---

## 11 · Migrate forward, archive back

When old documentation or old code becomes obsolete, **don't delete it**. Move it to `docs/legacy/` (when the folder reorganization happens) or mark it as historical.

The two big handoff documents (`EIDOLON-HANDOFF.md`, `ATLAS-HANDOFF.md`) are full of architectural reasoning that is still useful even though their structural role has been taken over by the new docs. They stay. They become reference material, not load-bearing scaffolding.

---

## 13 · Enumerate references per-file, not per-category

When planning an invasive sweep that updates references across many files, list every reference point by file, not by tool/category.

In Round 014's plan, "tests/protocol-harness.js path updates" was listed as one item. In Round 015's execution, that one item turned out to include four near-duplicate `vm.runInNewContext(readFileSync(...))` lines, six top-level `readFileSync` lines, and an equality check at line 347 that would have silently skipped a test path without changing the pass count. Per-category scope hid the per-file work.

The fix is mechanical: when writing a move plan, for each test file or shared module that will need updating, write a row in the move-plan table with the exact reference count. Per-file is verifiable. "The harness" is not.

This applies to any cross-cutting change — protocol changes, schema migrations, naming reconciliations. The unit of plan should match the unit of audit.

## 14 · Migrating a block to `nexus-block-client.js`

The pattern, refined across the six app-block migrations in Round 017. Every block that currently hand-rolls the kernel handshake follows the same shape; the migration follows the same recipe.

The block-as-found typically has:

- An `APP` constant with `{title, icon, description, emits, consumes}`.
- A `let _port = null; let _mounted = false;` pair.
- A `_setState(s)` helper that updates the boot screen text.
- A `window.addEventListener('message', ...)` that catches BOOT, grabs `e.ports[0]`, sends DECLARE.
- A `_handleKernel(evt)` switch over MOUNT_CHALLENGE / MOUNTED / PING / MSG.
- Local `emit(channel, payload)` and `subscribe(channel)` helpers that postMessage on `_port`.
- An `_onMounted()` that subscribes to `consumes` channels and triggers init.
- An `_onMessage(channel, payload)` that dispatches inbound MSGs.

The migration deletes all of that and replaces it with:

```html
<script src="../../engines/nexus-block-client.js"></script>
<script>
const nx = window.NexusBlockClient?.bootBlock({
  manifest: {
    emits:    [...],
    consumes: [...],
    app: { title: ..., icon: ..., description: ..., visible: true }
  },
  onMessage({ channel, payload }) {
    // Dispatch MSGs by channel here.
  }
});

if (nx) {
  nx.ready.then(() => {
    document.body.classList.add("nx-mounted");
    nx.subscribe("...");        // one per channel in consumes
    nx.emit("...", { ... });    // any boot-time emits
    // Any other init that previously lived in _onMounted().
  });
}

// Replace every `emit(c, p)` call with `if (nx) nx.emit(c, p);`
// (or `nx?.emit(c, p)`) — the optional check matters because nx may be
// undefined if the script include failed.
</script>
```

A few things that bite on first try:

- **Don't forget the script include.** It must be a separate `<script src=...>` tag *before* the inline script, not inline. Classic-script CDN-style — no module/CORS gymnastics.
- **The `if (nx)` guard before `.emit()` matters.** When run standalone (no kernel), `nx` is undefined and emit calls would throw. The block-client returns undefined from `bootBlock()` when it can't access `window.NexusBlockClient` — preserve graceful standalone behavior by checking.
- **Don't keep both the legacy `_setState` calls and the new boot screen reveal.** The body class flip on `nx.ready.then` is what hides the boot screen now; old `_setState("MOUNT_ACK")` calls have nothing to update because the `<div id="nx-boot-state">` isn't getting refreshed step-by-step anymore. Just leave it on "BOOTING" — it's hidden as soon as `ready` resolves.
- **Move helper variables (DOM refs, state) to before the `bootBlock` call.** The `onMessage` closure captures them, and they need to exist when MSG starts arriving.
- **The `consumes` list in the manifest is an allowlist; `nx.subscribe()` is the actual subscription.** Forgetting to call subscribe is the #1 bug — same as Landmine #3 — and the symptom is "block runs but never receives messages." The client doesn't auto-subscribe to everything in `consumes`; you still call `subscribe()` per channel.

This recipe was applied in Round 017 to:
`blocks/apps/app-about.html`, `app-terminal.html`, `app-notepad.html`, `app-reader.html`, `app-files.html`, `nexus-webviewer.html`. Average savings: ~40 lines per block. Total: 6 fewer parallel implementations of the same protocol.

The remaining hand-rolled blocks (Wallet, mission-control, the-room, eidolon-os, eidolon-router, the social trio, witness, forge-template, iww-guide, i-was-wrong) each have additional complications — custom protocol extensions, multi-thousand-line files, or both — and deserve scoped per-file rounds rather than a bulk sweep.

## 14a · Migration special cases — found in Round 018

The base recipe (#14) covers most blocks. Three patterns came up in Phase 2 that the base recipe doesn't:

**Standalone-mode fallback timer.** Some blocks (Channels, the social trio, anything with a localStorage persistence layer) need to work outside Nexus too. `nx.ready` only resolves on MOUNTED, which never arrives in standalone mode, so the block hangs at boot if you only `await ready`. The pattern that works:

```js
let _once = false;
function _bootOnce() { if (_once) return; _once = true; runMyAppInit(); }
if (nx) {
  nx.ready.then(_bootOnce);
  setTimeout(_bootOnce, 800);   // fallback if BOOT-port is silently dropped
} else {
  setTimeout(_bootOnce, 0);     // standalone: no client at all
}
```

The 800ms threshold matches the timer in `engines/vibe-adapter.js`. Make `_bootOnce` idempotent because either path may fire first.

**`<script type="module">` blocks.** The classic-script `<script src="../../engines/nexus-block-client.js"></script>` must come *before* the module script. Modules can read `window.NexusBlockClient` even though they have stricter scope rules — the bridge is the global `window` object, which the client populates. If the order is reversed, the module evaluates while `window.NexusBlockClient` is still undefined and the block falls into the "client missing" code path.

**`IN_NEXUS` guards.** Blocks that already detect "am I hosted?" via `try { return window.parent !== window && window.parent.location.href !== window.location.href; } catch(_) { ... }` migrate cleanest by gating `bootBlock`:

```js
const nx = IN_NEXUS ? window.NexusBlockClient?.bootBlock({...}) : null;
```

Then every emit/subscribe/request call is gated on `if (nx)` and the block falls through to its existing standalone behavior (localStorage, file pickers) when `nx` is null. This is i-was-wrong's pattern. Don't try to unify the standalone path with the hosted path through bootBlock alone — the standalone fallbacks are real code that does real work and needs to remain reachable.

## 14b · Latent bugs found by handshake unification

Both Round 017 and Round 018 found bugs while migrating blocks that headless tests cannot detect because the bugs only show as runtime kernel violations:

- **`type: "MSG"` instead of `type: "EMIT"`** (Round 018, i-was-wrong.html). The kernel's router only handles `DECLARE / SUB / MOUNT_ACK / PONG / EMIT` from blocks. Any other type lands in `default: violation(block, "unknown type: ...")`. A block emitting `type: "MSG"` to send a query gets its message silently dropped and a violation counted — eight violations per block evicts it.
- **`PONG` without nonce** (Round 018, nexus-witness.html). `handlePong` validates `typeof msg.nonce !== "string"`. Sending `{type:'PONG'}` instead of `{type:'PONG', nonce: m.nonce}` is a silent violation on every kernel ping (every ~5s once mounted).
- **Channel emitted but not declared** (would be Round 019 if found in Wallet — already there in i-was-wrong's case as a coincident bug). The kernel's `handleEmit` checks `block.manifest.emits.includes(msg.channel)` and rejects with `undeclared emit ${channel}` if not. A block that emits a channel it didn't declare gets it dropped.

These are the kinds of bugs Block Doctor was built to surface (see `blocks/system/block-doctor.html` — it counts violations per block and shows them in the detail pane). The migration to the shared client fixes them by construction: `nx.emit` always uses the right type, `nx.subscribe`/`nx.request` always send proper nonces, and emits to undeclared channels fail loudly in the calling code instead of silently in the kernel.

If you find a hand-rolled handshake during a future migration that *doesn't* have one of these bugs, that's the surprising case worth noting in the round log.
---

## 15 · Reconcile stale docs against the harness during calibration

A codebase can be healthy while its orientation docs are stale. The 2026-05-07 calibration intake found exactly that: the harness still passed at the Round 019 baseline (**254 / 0**), while `README.md` and `CODEBASE_ORIENTATION.md` still mentioned older 170/0 and 133/0 baselines in places.

Calibration rule: trust live verification over prose, then update the prose. Record both the live command and the exact summary lines so the next AI can distinguish a regression from a stale sentence.

Do this before planning code changes. A stale baseline makes later diffs noisy because no one can tell whether the sweep reduced coverage or merely corrected documentation.

---

## 16 · Do not add case-only filename aliases to satisfy prompt casing

The required living docs are canonical as `README.md`, `AI_CODEBASE_HANDOFF.md`, and `docs/*.md`. A prompt may spell them as `.MD`; do not add `README.MD` beside `README.md` as a convenience alias.

Why: many target filesystems are case-insensitive. A zip containing both can collide on extraction, causing the exact kind of archive corruption the living-doc system is meant to prevent. Keep the canonical casing unless the user explicitly scopes a rename sweep.

---

## 17 · Build a protocol-surface map before touching hand-rolled blocks

The second calibration sweep found the current handshake split: 19 block files use `engines/nexus-block-client.js`, 8 still hand-roll the kernel handshake, and 1 is pure guide HTML. That split matters more than line count. A 400-line hand-rolled diagnostic can be riskier than a 2,000-line client-backed app if the edit touches BOOT/DECLARE/MOUNT_ACK/PING/PONG/SUB/EMIT.

Before any handshake-unification or stuck-LOADING work, generate the map first. Start with `docs/CODEBASE_ORIENTATION.md`'s tracker, then refresh it with the audit snippet in `HANDY_CODE_SNIPPETS.md` if files changed.

The migration priority should be:

1. Big but conceptually straightforward hand-rolled apps: `Nexus Forums v0.02.html`, `Nexus Social v0.02.html`.
2. Small utilities where migration gives quick safety: `drift.html`, `block-doctor.html`, `nexus-genesis-verifier.html`.
3. Special cases requiring design: `eidolon-os.html` (nested kernel-host), `the-room.html` (large legacy forge), `Wallet_v4_nexus.html` (wallet-specific response semantics).

---

## 18 · In harnesses, wait for readiness events — not sleeps

Calibration sweep 2 found a real protocol-harness race. `bootLibraryForTest()` slept for 50ms after `__vibesTestHooks` appeared, then tests started mutating `cache`. Under repeated runs, the Vibes Library initializer could still be executing its final `loadAllToCache()`, clearing the cache after the test inserted fixtures. Failures showed up as unrelated-looking misses: attestation not merged, charter not migrated, imprint failed.

The fix was not a longer sleep. The fix was to make the harness model the kernel better: mock `fs.status` and wait for the library's `system.block_ready` emit. Use the same rule for future harness work. If a block has an explicit ready signal, wait for that signal. If it doesn't, add one or wait for a stable observable state.


## 19 · Syntax checks do not prove external script paths resolve

Calibration sweep 3 added `tests/local-script-refs-tests.js` after auditing the runtime dependency surface. The existing syntax checker validates inline scripts and shared `.js` files, but an HTML block can still boot to a blank/stuck state if its `<script src="../../engines/...">` path drifts during a move.

Run the full harness after any file move. For fast iteration during a path-only edit, run:

```bash
node tests/local-script-refs-tests.js
```

This is especially relevant to future social-file renames and any adapter migration that adds `nexus-block-client.js` / `vibe-adapter.js` includes.

---

---

## 20 · Handshake guards let external vanilla files become sovereign blocks

Companion integrated cleanly as a managed block by loading `engines/nexus-block-client.js` and booting only when `window.NexusBlockClient` exists. Keep this pattern for external vanilla apps: OS IPC is an additive enhancement, while direct-browser standalone behavior remains mandatory.
---

## 21 · Integrating large pre-built bundles stays small when the bundle remains opaque

Integrating large pre-built bundles — the React/TS deliverable in Verse Studio mounts as a block by injecting only two `<script>` tags above the bundle. The bundle itself stays untouched. The `__verseStudio` global is the only integration surface. Cross-block wiring is added separately in later sweeps so this sweep stays small.

---

## 22 · Queue inbound cross-block messages until async block APIs are ready

Cross-block bridges with async block APIs — when a block's integration surface (e.g. Verse's `__verseStudio` global) populates asynchronously after mount, queue inbound messages and drain on ready. Do not subscribe lazily; the kernel SUB happens on the standard MOUNTED handshake and inbound messages can arrive before the block's app code is ready to handle them. The pattern: declare consumes up front, queue if not ready, drain when ready, emit your ready signal AFTER drain.

---

## 23 · Augment OS chrome without replacing working surfaces

Augment, don't replace — when adding new chrome, the existing taskbar/launcher/console were left untouched in Sweep 4. The new palette/eventlog/health surfaces mount as siblings. This pattern preserves working user UX while extending the OS surface area.

---

## 24 · Undo protocol can arrive before actual reversal logic

Undo without bundle access — when a block's integration surface (e.g. Verse's `__verseStudio`) doesn't expose a reversal of an operation, the kernel-side compensation envelope is still useful: it makes the protocol shape explicit, lets the eventlog show the symmetry, and lets future sweeps add the actual reversal without protocol changes. Wire the compensation, defer the reversal.

---

## 25 · Undo-handler-arrived-without-actual-undo can be intentional

Sweep 5 deliberately wires `companion.canvas.export.undo` into Verse Studio as an acknowledgement path only. The block warns, emits `verse.canvas.imported` with `ok:false, undone:true`, and does not mutate the React bundle. This is not a half-implemented UI undo; it is protocol scaffolding for a future reversal design.
---

## 26 · Audit before autonomy

Sweep 6 did not guess the next feature from scattered comments. It first scanned stubs, disabled catalog entries, deferred docs, visible placeholders, and recent protocol scaffolding, then wrote `docs/ROADMAP_STATUS.md` as the canonical triage board. Future autonomous sweeps should update that board when they complete an item instead of leaving roadmap knowledge diffused across old handoffs and comments.

---

## 27 · Browser smoke beats harness assumptions

Sweep 7 hotfix came from a real Fedora/browser run, not from the Node harness: Companion emitted `companion.canvas.export` and Verse acknowledged import, but Chromium blocked the visible JSON download because managed iframes lacked `allow-downloads`. Keep browser smoke tests for user-facing affordances that static/VM tests cannot see.

---

## 28 · Queue emits until MOUNTED

A block can construct its app API before the kernel sends `MOUNTED`. `NexusBlockClient.emit()` now queues outbound emits after BOOT but before MOUNTED, then flushes them once mounted. This prevents false `EMIT before mounted` violations without requiring every block bootstrap to hand-roll a mounted latch.

---

## 29 · Declared subscription bursts are not spam

Large service blocks such as Vibes Library can legitimately declare and subscribe to many channels at mount. Sweep 8 keeps the abuse guard for malformed/undeclared control messages, but valid declared `SUB` messages no longer spend the normal control-rate bucket. This prevents service-block eviction while preserving protocol enforcement.

---

## 30 · Install BOOT listeners before async app hydration

Wallet v4 already had a managed MessagePort path, but its listener was installed after async key/DB boot. A kernel can post `BOOT` as soon as the iframe finishes loading, so managed blocks with expensive startup should install the BOOT listener first, guard against duplicate setup, then continue app hydration. Standalone behavior remains unchanged.

---

## 31 · Treat wrapped upload zips as intake artifacts, not automatic roots

The 2026-05-09 intake arrived as `files(14).zip` containing a complete nested codebase zip plus duplicate sidecar copies of new tooling docs/scripts. Do not flatten the outer wrapper into the project. Extract the nested archive, confirm the sidecar files already exist at canonical in-project paths (`tools/`, `docs/`, `tests/`), and use that nested project root as the source of truth.

This prevents two failure modes: top-level helper files drifting away from their canonical project paths, and accidental delivery of a wrapper package instead of a runnable `Nexus Moot v1.4/` folder.


---

## 32 · Shell services can be consumers without being blocks

Sweep H adds `nx-notifications` inside `Nexus_OS.html` rather than as a launched block. That is the right shape for always-on OS attention: the notification center survives app close/minimize and has no lifecycle ambiguity. The safe pattern is narrow: known channels are consumed by the shell before dead-letter accounting, while unknown channels keep the old dead-letter path. Do not generalize this into arbitrary silent kernel consumption.

---

## 33 · Implement the uploaded reality, not the narrative future

The H prompt referenced blocks and test counts from a later conceptual state than the uploaded archive. The correct response was to build the H architecture against the files that actually exist, log the mismatch, and avoid inventing missing codex/economy-explorer/walker surfaces. This keeps the delivered zip runnable and honest.

---

## 34 · Motion belongs in vocabulary, not one-off flourish

Sweep H introduced semantic motion tokens and documented them in `docs/MOTION.md`. Future UI polish should extend that vocabulary rather than scattering raw `200ms ease` timings. It is the only practical way to make reduced-motion behavior and OS coherence scale across sovereign HTML blocks.


## 35 · Solve guidance as a local shell service, not as block coupling

The Player Thread works because it sits beside notifications in the shell. Blocks do not need to know about each other. The shell records local UX milestones and resolves a current action, while actual launches still go through the existing catalog/launcher path.

This avoids the bad version: Library telling Wallet what to do, Wallet knowing about Atlas, or a hidden quest engine mutating protocol state. Keep future guidance local, derived, and dismissible.

## 36 · Beauty passes are safest when they preserve protocol seams

Wallet and Genesis can become much more expressive through CSS, copy hierarchy, dashboard cards, and empty-state actions without touching UTXO validation, authority pinning, conservation, signatures, or proof logic. When the user asks for beauty, spend the risk budget on presentation first.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

- Console 404s are high-signal. Treat a catalog path that points at a missing file as a release blocker unless explicitly disabled.
- A player economy should not quietly reward UI completion. The user read this as fake money; canonical player balance now starts at 0 NEX.
- Advanced UTXO detail is valuable, but the primary player wallet needs one visible balance. Keep proof detail subordinate to one NEX balance.
- Atlas cannot assume Vibes Library is open. Cross-block storage flows need local fallback or explicit auto-launch/retry behavior.
- Companion is both a creature surface and a notes layer. It must read the accepted First Contact state and avoid text-paste layout explosions.

## Sweep 14 — Control, persistence, and one-wallet clarity

- Baseline after implementation: `bash tests/run.sh` reports 473 passes / 0 fails.
- First Contact now writes real `vibe.save` envelopes for the accepted companion/world when Vibes Library is awake, while also mirroring the world into Atlas local fallback storage.
- Environment Forge now has human presets, Library save, Atlas fallback mirroring, and desktop background preview/finalization.
- Compose Stage is now a three-step ingredient flow: Companion → World → The Room. It routes to existing legacy forge tools only.
- Desktop Home Notes stores local notes under `nexus:home-notes:v1` and sends a one-shot inbox item to Companion at `nexus:home-note-inbox:v1`. Companion imports that as a movable note and clears the inbox.
- Wallet copy now emphasizes one wallet / one visible NEX balance. UTXOs are labeled as proof outputs, not separate balances.
- Delete/Backspace shielding was broadened for focused text inputs to reduce Chromium shortcut prompts during searches/typing.

## 2026-05-09 · Exact-case docs should be aliases, not forks

When an operator contract names required docs with exact uppercase `.MD` casing but the repo already has canonical lowercase `.md` docs, prefer tiny root-level pointer files over moving or duplicating content. This preserves existing links and prevents drift while satisfying literal filename checks. Log the alias decision in `docs/FREEDOM_REASONING_LOG.md`.



## 38 · Documentation-only calibration still needs a full verification loop

When the user asks for a no-code calibration pass, still run the same verification spine before and after doc edits: `bash tests/run.sh`, `node tools/channel-atlas.js --check`, and targeted `tools/block-inspect.js` scans of recently touched surfaces. Documentation can become a source of future runtime bugs if it preserves stale launch paths, pass counts, or protocol-surface counts.

For the 2026-05-09 boot calibration, the source archive was already green at 473/0. The useful work was correcting stale map entries, making exact-case boot docs useful without forking canonical docs, and recording that no runtime/code files were intentionally changed.

## 2026-05-09 — The recovered Eidolon forges are UX canon

The four files under `legacy/eidolon-forges/` are not dead prototypes. They encode the intended feel:

- animated canvas previews;
- direct sliders with one visible effect each;
- editable labels;
- sweep controls to discover values;
- lockable/randomizable axes;
- 3x3 candidate grids;
- templates as user-authored randomizer anchors;
- plain JSON save/load.

Future First Contact, Companion, Environment Forge, Compose Stage, Atlas, Library, and battle-creation work should move toward this interaction model. Static cards, amber placeholder signals, and opaque one-shot randomizers are regressions unless used as temporary fallback states.

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

## Sweep 26 — Distributed compute substrate · streaming router · render demo

Calibration baseline after this sweep: blocks-removed test run yields **128 contract passes / 1 contract fail** (the pre-existing `nexus-lattice(1).html` rule-A fail is unrelated to this sweep); with this sweep's blocks present, the harness yields **137 contract passes / 1 contract fail** (+9 contract passes, no new failures). SYNTAX +3, SCRIPT-REF +3. `node tools/channel-atlas.js --check` passes with **79 channels across 48 blocks** (up from 65/35).

Material additions:
- `blocks/system/nexus-compute.html` — managed Web Worker pool service block, with three deterministic-math handlers (`noise.sample`, `hash.batch`, `terrain.strip`) all bit-exact to `engines/deterministic.ts`. Bounded queue, transferable typed arrays, soft cancellation, worker-crash respawn with cap, in-file reference-implementation parity test.
- `blocks/system/nexus-router.html` — producer/consumer registry block. Discovers streaming producers by `kind`, returns a BroadcastChannel name; lifecycle via heartbeats with eviction.
- `blocks/system/nexus-render-demo.html` — OffscreenCanvas-backed terrain visualizer that proves the compute+router stack end-to-end. Pulls strips at scroll rate, transfers buffers zero-copy to its internal render worker.
- `docs/STREAMING_PATTERN.md` — captures the producer/router/consumer pattern as a reusable template.
- `docs/CAPABILITY_BOUNDARIES.md` — captures the strategic analysis of what's browser-native vs. proxy-dependent and the two paths forward.

New patterns introduced:

### BroadcastChannel for streaming; kernel IPC for discovery

The kernel IPC bus (via `engines/nexus-block-client.js`) does not carry transferables — its `post()` is single-argument `port.postMessage(msg)`. For high-rate typed-array streams, blocks should bypass the kernel and use BroadcastChannel directly, with the router handling rendezvous. See `STREAMING_PATTERN.md` for the full architecture and lifecycle nuances. This is the first cross-block pattern in the codebase that deliberately routes hot-path data off the kernel.

### Two-phase block startup with peer discovery

Producers that depend on the router being present need a registration-with-retry pattern: try N times at boot, then subscribe to `system.block_ready` and re-attempt whenever the specific peer comes online. This is the first cross-block dependency in the codebase that isn't satisfied just by the kernel mounting both blocks — the producer needs the router to be both mounted AND ready. The subscribe-to-`system.block_ready` pattern is the canonical way to handle this kind of peer-readiness without polling.

### In-file reference implementation for worker-math parity

When a worker runs math that must match a main-thread reference (deterministic generators, anything with cross-host correctness requirements), keep a parallel main-thread copy of the math **in the same file** and ship a test panel button that compares them across a meaningful sample grid. Duplication is intentional: two copies you can read side by side, and the parity test fails loudly if they drift. See the `Verify vs main thread` button in `nexus-compute.html` and the `ref_*` family of functions just below the worker source string.

Preserved invariants:
- All deterministic-math handlers in the new compute block are byte-exact to `engines/deterministic.ts` constants and algorithms (FNV-1a + Murmur3 finalizer, Catmull-Rom hermite, layer profiles, biome periods).
- No changes to `Nexus_OS.html`, `proxy/nexus_proxy.py`, `engines/`, or any existing block.
- No new external script dependencies; the three new blocks load only `engines/nexus-block-client.js`.
- Streaming data never traverses the kernel — only discovery and lifecycle do. Render-demo's overlay reports `kernel msg/sec ≈ 0` once handshake completes, proving this in operation.


## 2026-05-17 Calibration — separate baseline discovery from implementation

When a fresh uploaded archive is already red, do not silently repair it during boot. Record the failing surface, continue the harness manually if `tests/run.sh` aborts early, and preserve the distinction between **pre-existing baseline failure** and **changes introduced by the current sweep**.

For this archive, `bash tests/run.sh` stops at `tests/block-contract-tests.js`, but manual continuation showed the rest of the harness green. That makes the next safe implementation target narrow: `blocks/nexus-lattice(1).html` Rule A, not a broad repo rewrite.

---

## 15 · Test a minified one-token protocol repair in a scratch copy first

`blocks/nexus-lattice(1).html` is a bundled/minified surface. The safe repair was not to reformat or rebuild it; it was to identify the exact bridge token and test that replacement in a disposable copy before touching the canonical archive.

The useful pattern:

1. Confirm the failing analyzer rule and the exact token.
2. Patch a copied workspace first.
3. Run the narrow failing suite.
4. Run the full harness in the scratch copy.
5. Apply the same minimal patch to the real workspace only after the scratch copy is green.

This avoids turning a protocol repair into an accidental generated-bundle rewrite.

## Lesson — Planning Game Maker Work on Eidolin (2026-05-17)

The safe architectural split is: keep Eidolin's deterministic/procedural runtime as reference material, but implement Pokémon-style authoring as a new schema/runtime layer. Reusing the canvas shell and Nexus managed-block contract is low risk; pretending the existing manifestation world is already a tile-map engine is high risk.


---

## Pokémon maker planning lesson — storage versus IPC

IndexedDB record capacity and Nexus IPC payload capacity are different bottlenecks. A full 100×100 map is reasonable as local IndexedDB data, but it should not be sent as one Nexus channel payload. The kernel sanitizer enforces a 131,072 char string/key budget, depth 10, max 1024 object/array nodes, max 256 keys/object, and max 512 array elements. Design map storage around chunk records and small invalidation/summary messages.

---

## Pokemon maker — lessons from the architecture and build round

**Read the real files before designing the DB schema.** The diagnostic reports described generic stores like `game_projects`. The actual nexus-db.html has a namespace guard: table names must start with the querying block's `appId`. This would have silently failed in production. Lesson: always `grep` for `appId` and `PERMISSION_DENIED` in the DB block before designing any storage layer.

**Two project stores exist for incompatible reasons.** The maker needs a stable mutable draft (keyed by `id`, updated in place). The player needs immutable content-addressed versions for save compatibility (keyed by `manifestHash`). These cannot share a keyPath. Resist the urge to unify them.

**The block client's `request()` is already a DB query client.** Don't build a custom IndexedDB layer when `nx.request('db.query', payload)` already does correlation, timeout, and error propagation correctly. The i-was-wrong.html block demonstrates the exact pattern.

**Engine purity pays off immediately.** Because `pokemon-engine.js` has zero Nexus dependency, all 43 tests run headless in Node without any browser shim beyond minimal crypto and TextEncoder stubs. The engine's behaviour is verified before a single block is written.

**The battle engine model changes everything.** V2 of the architecture spec assumed authored stats, moves, and type charts. The actual engine is genome-driven: 16-byte DNA → derived stats/moves/types via fixed formulas. This simplified battle verification enormously (committing DNA commits everything derived from it) and eliminated the custom-typeChart-as-uncovered-data problem that took two review rounds to identify.

**Five adversarial review rounds before a line of code.** The architecture went through Sonnet + Opus back-and-forth for five rounds. This caught: the two-store DB design, save hash pinning, composable event commands, terrain palette structs, project-global logical events, the wallet two-phase seam, and the BlobStore abstraction for Nostr. Every one of these would have required a refactor mid-build. The upfront review cost was worth it.

**Landmine 20 (local script refs) is real.** The test suite checks that `<script src="...">` paths in blocks actually resolve. New blocks at `blocks/pokemon-player.html` load engines from `../../engines/`. Get this wrong and the block silently fails with no error message in the terminal.

**The EventExecutor is ~200 lines, not a VM.** Three counters (command budget, depth, warp history) and an async command queue with a switch statement. Calling it a "coroutine VM" creates scope pressure toward building something much larger. Keep it named EventExecutor and keep the line count honest.

