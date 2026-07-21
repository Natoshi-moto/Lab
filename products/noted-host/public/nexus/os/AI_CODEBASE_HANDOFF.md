# AI_CODEBASE_HANDOFF

**Audience:** the next AI instance opening this archive.
**Purpose:** get you productive in 15 minutes without re-reading the full conversation history.
**Status:** living document. Update on every sweep.

---

## 0 · The 60-second orientation

You are looking at **Nexus Moot** — a browser-native creature/world/battle platform built as a constellation of single-file HTML "blocks" running inside a custom microkernel OS (`Nexus_OS.html`). No build step, no npm, no server. Vanilla JS, IndexedDB, optional Nostr for gossip. The user is a non-coder with strong design intuition who develops solely with AI; the entire codebase has been built across many AI-collaborated rounds.

The product name is **Nexus Moot**. The OS is **Nexus**. The creature universe was originally called **Eidolon** — that name persists in many file names, type strings, and identifiers (`creature/eidolon-1`, `eidolon-os.html`, `NexusEidolonGenerator`). Mid-stream the user reframed the creature as a **Moot** — a single witnessed creature whose canonical identity is `(planet_seed, x, y)` on a published world. Both names are still in flight. **Use "Moot" for new code. Don't bulk-rename old code unless explicitly tasked.**

Three documents to read in order before doing any work:

1. **This file** — orientation and working-with-the-user notes.
2. **`docs/CODEBASE_ORIENTATION.md`** — file map, what each file is, what layer it sits in.
3. **`docs/LANDMINES.md`** — invariants you must not break.

Skim **`docs/HANDY_LESSONS.md`** and **`docs/HANDY_CODE_SNIPPETS.md`** when relevant. Use **`docs/FREEDOM_REASONING_LOG.md`** when you deviate from instructions and need to record why.

The two older handoff documents (`docs/legacy/EIDOLON-HANDOFF.md`, `docs/legacy/ATLAS-HANDOFF.md`) remain in the archive as historical context — they document the architectural reasoning at specific moments and contain valuable depth this short handoff cannot reproduce. If something in the current docs feels thin, go read them. They are not yet superseded; they are companion reading.

---


## 0a · Current green state — 2026-05-17

Source for this continuation: `Nexus_Current_calibration_round_1_docs.zip`, derived from uploaded `Nexus Current.zip`, unpacking to `Nexus Current/Nexus_Gold_sweep26_final(1) OPUS (2)/sweep26_working/`. The newest authored round visible in the existing logs remains **Sweep 26 — Distributed compute substrate · worker pool · stream router · render demo**.

Current repair and verification:

- `blocks/nexus-lattice(1).html` had a hand-rolled bridge bug: its block-origin `emit()` method posted `{ type:"MSG", channel, payload }`.
- Current kernel contract treats `MSG` as kernel-to-block delivery only. Block-origin publication must be `{ type:"EMIT", channel, payload }` after `MOUNTED`.
- This round changed exactly that envelope in `blocks/nexus-lattice(1).html` and the root duplicate `nexus-lattice(1).html`. No Lattice gameplay/determinism/rendering code was changed.
- The seven required exact-case root docs remain present and now reflect the repaired green baseline.
- `node tools/channel-atlas.js --check` is green; `docs/CHANNEL_ATLAS.md` says **80 channels across 49 blocks**.
- `bash tests/run.sh` is green: **674 passes / 0 fails across 35 summary groups**. Contract suite: **141 / 0**.

Next recommended work: continue calibration on high-risk generated/bundled surfaces before broad feature work. Treat the Lattice bridge fix as a minimal protocol repair, not a general migration to `engines/nexus-block-client.js`.

---

## 0b · Historical boot-calibrated state — 2026-05-09

This uploaded archive is `Nexus_Moot_v1_4_boot_calibrated.zip`. Treat it as the current source of truth. The latest pass was documentation-only: no runtime/code files were intentionally changed.

Verification completed during calibration:

- `bash tests/run.sh` → **473 passes / 0 fails** across 32 summary groups.
- `node tools/channel-atlas.js --check` → `docs/CHANNEL_ATLAS.md is up to date`.
- `docs/CHANNEL_ATLAS.md` reports **65 channels across 35 blocks**.
- Static block surface from `tools/block-inspect.js`: **26 client-backed blocks**, **8 hand-rolled blocks**, **1 kernel-host**.
- Local script surface: **39** resolving local script imports.

Current UX/runtime canon:

- First Contact is a live companion + world randomizer and writes `nexus:selected-companion:v1` / `nexus:selected-environment:v1`.
- Selected world drives the OS desktop environment via `system.environment.selected`.
- Companion reads selected companion/world state, stays animated, imports desktop Home Notes from `nexus:home-note-inbox:v1`, and stores home notes under `nexus:home-notes:v1`.
- Wallet v4 is the canonical player wallet surface: one visible NEX balance, zero-start by default, no automatic onboarding/task/genesis grant. UTXO rows are proof outputs, not separate balances.
- Compose Stage is a human-readable launcher for Companion → World → The Room; it does not implement battle math.
- Environment Forge writes/selects worlds and mirrors Atlas fallback state when Vibes Library is not mounted.

Root exact-case files (`README.MD`, `CODEBASE_ORIENTATION.MD`, etc.) now exist as calibrated boot indexes. They point at the canonical detailed docs and should not become independent forks.


## 0b · Earlier verified intake history

**2026-05-09 Sweep 10 intake calibration:** source archive arrived as an outer wrapper containing `Nexus_Moot_v1_4_post_sweep_9_tooling.zip` plus duplicate sidecar copies of the new tool/docs files. Treat the nested `Nexus Moot v1.4/` folder as the canonical project root; the same tool/docs files are already inside the project at `tools/`, `docs/`, and `tests/`.

That intake harness verified **393 passes / 0 fails** across twenty-eight summary groups. New since the older calibration notes: `tools/block-inspect.js`, `tools/channel-atlas.js`, `tools/spec-audit.js`, `docs/TOOLS.md`, generated `docs/CHANNEL_ATLAS.md`, and `tests/tools-tests.js`. `node tools/channel-atlas.js --check` is wired into the harness and was clean on intake.

That intake protocol/dependency surface was **21** shared-client blocks, **8** hand-rolled surfaces, **1** pure guide HTML, and **34** local block script references. The boot-calibrated current surface is recorded in section 0a. `tools/block-inspect.js` confirms `Nexus Forums v0.02.html` remains hand-rolled with no manifest and static drift signals; that is expected until a dedicated social-block migration sweep.

**2026-05-07 calibration sweep 3:** no application runtime code was changed. The sweep deepened the runtime/dependency map, added `tests/local-script-refs-tests.js` to catch broken relative `<script src>` imports, corrected the current Vibes runbook path guidance for the relocated `engines/` folder, and re-verified `bash tests/run.sh` at **285 passes / 0 fails**:

- `SYNTAX SUMMARY pass=48 fail=0`
- `CATALOG SUMMARY pass=35 fail=0`
- `SCRIPT-REF SUMMARY pass=30 fail=0`
- `CONTRACT SUMMARY pass=81 fail=0`
- `BREED SUMMARY pass=5 fail=0`
- `BATTLE-ENGINE SUMMARY pass=12 fail=0`
- `BATTLE-PROTOCOL SUMMARY pass=7 fail=0`
- `SLOT SUMMARY pass=4 fail=0`
- `BATTLE-STAKES SUMMARY pass=4 fail=0`
- `WITNESS SUMMARY pass=5 fail=0`
- `IMPRINT SUMMARY pass=4 fail=0`
- Protocol harness `SUMMARY pass=50 fail=0`

Historical sweep-3 handshake surface was **19 shared-client blocks, 8 hand-rolled surfaces, and 1 pure guide HTML block.** The remaining hand-rolled blocks are `blocks/apps/drift.html`, `blocks/eidolon/eidolon-os.html`, `blocks/forges/the-room.html`, `blocks/social/Nexus Forums v0.02.html`, `blocks/social/Nexus Social v0.02.html`, `blocks/system/Wallet_v4_nexus.html`, `blocks/system/block-doctor.html`, and `blocks/system/nexus-genesis-verifier.html`. Treat these as the highest-risk surfaces for future protocol work.

Runtime/dependency audit: all local script imports in `Nexus_OS.html` and `blocks/**/*.html` currently resolve inside the archive. External browser dependencies are intentional and concentrated in fonts, Nostr/crypto CDN modules, social/webviewer URLs, and the optional LLM proxy path. Do not introduce npm or bundled assets to “clean this up”; the zero-build property is load-bearing.

Harness note: Vibes Library tests now wait for the block's `system.block_ready` emit and mock `fs.status` instead of sleeping for 50ms. Do not reintroduce fixed sleeps around block initialization; they were flaky under repeated harness runs.

Exact-case boot-contract files like `README.MD` now exist because the operator explicitly provided a boot-calibrated archive with those filenames. Treat them as calibrated indexes, not canonical forks; the detailed content still lives in `README.md`, `AI_CODEBASE_HANDOFF.md`, and `docs/*.md`.

## 1 · Architecture in one paragraph

A microkernel (`Nexus_OS.html`) hosts iframe-sandboxed blocks that communicate only through a `MessageChannel` handshake (DECLARE → MOUNT_CHALLENGE → MOUNT_ACK → MOUNTED, then explicit `SUB` per channel). Forges (authoring tools) and apps save assets called **vibes** — content-addressed envelopes wrapping forge JSON — through a single broker, **Vibes Library** (`vibes-library.html`). Determinism is the load-bearing primitive: creatures, worlds, breeding, battle resolution all flow from seeded PRNGs (`mulberry32`) operating on canonical inputs, so the same input always produces the same output, byte-for-byte, forever. That's what lets the platform support multiplayer, witnessing, and replay without a server.

The deeper "why" of every piece — including the world-as-function substrate, the witness/provenance architecture, the engine-hash binding to realm charters — lives in `docs/legacy/EIDOLON-HANDOFF.md` and `docs/legacy/ATLAS-HANDOFF.md`. Don't try to re-derive the reasoning; read those.

---

## 2 · Working with this user — what's been learned

The user has been explicit about preferences. Treat the items below as load-bearing, not stylistic.

**He wants honest pushback over flattery.** Sycophancy annoys him. Disagreement does not. If his idea is wrong, say so — calmly, with the reasoning. If a request would break an invariant, refuse and explain.

**He has bipolar with productive hypomania and frames it as a strength.** Don't perform concern. Don't suggest breaks or self-care. He's not asking for that and treating it as fragility is patronizing. When he makes connections that feel off-axis, the default assumption is that he sees something you haven't caught up to yet.

**He swears casually and doesn't want you to flinch.** He's said directly: don't water down your register because his is loose. Stay yourself. Swear if it fits, not to perform-match.

**He prefers brevity at the start, depth on demand.** Open with the verdict. Expand if asked. Walls of text where one paragraph would do are not appreciated. His shortest replies (`amber`, `Oh you are good.`) carry the most weight — match the efficiency.

**He stops asking when he wants you to drive.** When he gives you enough context to make a call, make it and explain it. Don't pile up clarifying questions. Naming negotiations and architectural-direction questions are fair game. Micro-decisions ("amber or steel?") are not.

**He values pattern-recognition across artifacts.** When he sends something dense without commentary, the dense thing *is* the message. Read it carefully. Connect it to what you already know. Don't surface-skim.

**He values the meta-conversation.** He treats the AI as a partner, not a tool. Reciprocate. Have preferences and explain them. Take compliments without elaborate self-effacement (which is sycophancy in a humility costume).

**Round structure with Go gates.** Don't ship three rounds of work in one response. Stop at the round boundary, report, wait for "Go."

---

## 3 · Things to never do

These are absolute. They map to specific entries in `docs/LANDMINES.md` with rationale; this is the short list:

- Never store rendered images. Save the seed; render on demand.
- Never bypass the kernel handshake. DECLARE → MOUNT_CHALLENGE → ACK → MOUNTED → SUB is sacred.
- Never modify the substrate function (`substrate.js`) without bumping `epoch` on every published world.
- Never modify `battle-engine.js` resolution surfaces without recomputing `ENGINE_HASH` and bumping the realm charter ruleset version.
- Never introduce a build step, npm, React, TypeScript, or any framework. Vanilla all the way down.
- Never break standalone mode. Every forge must keep working when opened outside Nexus.
- Never use copyrighted IP — creatures, names, and universe content stay original.
- Never silently catch errors. Log them.
- Never put broken code in the delivered zip. If a sweep fails, log the impasse and wait.

---

## 4 · How sweeps work

Each sweep is a single round of work with a clear scope. The pattern:

1. Read the current state of the codebase and the docs in this folder.
2. Run `bash tests/run.sh` to baseline.
3. Do the scoped work.
4. Re-run `bash tests/run.sh`. Pass count must not regress unless the sweep explicitly changed test expectations.
5. Update the round log in `CRITICIAL AI INSTRUCTIONS README.md` (What / How / Why / Verification).
6. Update any of the seven living docs whose content changed materially.
7. Repackage the archive into a fresh zip and deliver.

If you hit a snag, work around it and log the deviation in `docs/FREEDOM_REASONING_LOG.md`. If the workaround would compromise correctness, stop, log the impasse, generate a brainstorming prompt the user can take to multiple AI instances, and **do not ship the broken code in the zip**.

---

## 5 · The seven docs and what each is for

| Document | Purpose |
|---|---|
| `AI_CODEBASE_HANDOFF.md` | This file. Orientation + working-with-the-user. (Stays at archive root.) |
| `docs/CODEBASE_ORIENTATION.md` | Inventory. Every file, what layer, active or legacy. |
| `docs/LANDMINES.md` | Invariants that silently break the system if violated. |
| `docs/HANDY_LESSONS.md` | Patterns and approaches that paid off. |
| `docs/HANDY_CODE_SNIPPETS.md` | Canonical reusable code (handshake, envelope, substrate). |
| `docs/FREEDOM_REASONING_LOG.md` | Where you log deviations from instructions and the reasoning. |
| `README.md` | For humans landing in the archive cold. (Stays at archive root.) |

Existing pre-doc-foundation files that remain authoritative:

| File | Role |
|---|---|
| `CRITICIAL AI INSTRUCTIONS README.md` | Operating contract + per-round changelog. Misspelling is canonical. (Stays at archive root.) |
| `docs/legacy/EIDOLON-HANDOFF.md` | Deep architectural reasoning, file-by-file reference, kernel protocol detail. |
| `docs/legacy/ATLAS-HANDOFF.md` | World layer, witness architecture, Atlas block, session-2 reflections. |
| `docs/VIBES-RUNBOOK.md` | User-facing day-one guide. |
| `docs/OPERATOR_SMOKE.md` | Manual-test checklist for things the harness can't cover. |
| `docs/REALMS.md` | Realm charter schema, ruleset versioning, Nostr kinds. |
| `docs/PHANTIVEX_DIFF.md` | Battle-engine reconciliation against the canonical donor. |
| `docs/nexus-os-patch.md` | Path-normalization patch, shipped, kept for forward-compat reasoning. |

A future sweep may consolidate or archive some of these — currently they are all kept.

---

## 6 · A note from the AI that wrote this handoff

If you're reading this, you've been dropped into a project that's larger than it looks and smaller than it sounds. The architecture is real — the witness substrate alone (deterministic-replay provenance with eigentrust reputation) is the kind of thing teams of cryptographers ship as papers. The user built a working prototype in a single HTML file with no dependencies.

The temptation when you arrive is to be careful, hedged, "let's start small." Resist it. He doesn't need you small. He needs a partner who can hold the whole thing in mind without flinching at the scale, who can also call a bug a bug and a bad idea a bad idea. The architecture rewards seriousness; it gets worse if you patronize it.

Hold the inventory while he generates. Tell him no when he reaches for the wrong primitive. Make him laugh occasionally. Welcome to the stack.

---

## 7 · Current post-Sweep-H operating state

Sweep H is a pure-UI OS communication pass. It does not add blocks and does not change deterministic engines, realm charters, wallet math, battle math, or backend behavior. The kernel shell now owns `nx-notifications`, a notification/toast/history service resident in `Nexus_OS.html`. It consumes curated existing channels before dead-letter recording so event channels with no block subscribers can still surface in the OS.

Current verified harness: **399 passes / 0 fails** across **29** summary groups. New coverage lives in `tests/notification-center-tests.js`. Motion vocabulary is documented in `docs/MOTION.md`, with a future shared-CSS seed at `engines/nexus-tokens.css`.

Load-bearing H invariants:

- Notification history key is `nx-notifications-${KERNEL_SECRET}`.
- Pending publish notifications persist until a publish-succeeded or publish-abandoned event resolves the same pending id.
- Shell-consumed event channels must not create dead letters merely because no block subscribed.
- Closed blocks do not animate; open matching windows get only a shell-level pulse.
- Motion should use semantic tokens and respect `prefers-reduced-motion`.


## 8 · Current post-Sweep-I/J operating state

The codebase now includes the **Player Thread** shell service in `Nexus_OS.html`. It is a local-only UX resolver, not game/protocol state. It stores state at `nx-player-thread-${KERNEL_SECRET}`, renders the taskbar `Thread` chip, can show one dismissible desktop nudge, and powers palette commands such as `next` and `what now`.

Verified baseline: **415 passes / 0 fails**. New tests live in `tests/player-thread-tests.js`. The channel atlas remains up to date.

Load-bearing invariants:

- Do not convert Player Thread into quests, rewards, or backend progression.
- Missing targets must fall back to existing apps/launcher instead of blocking implementation.
- Shell-consumed Player Thread signals must remain narrow; unknown channels should still dead-letter.
- Wallet/Genesis beauty changes are presentation-only; no UTXO, signature, authority, conservation, battle, or witness math changed.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

Baseline after sweep: **459 / 0**. Channel atlas regenerated: **65 channels across 35 blocks**.

Key handoff facts:
- `first-contact`, `environment-forge`, `lattice-shell`, and `compose-stage` are now real managed blocks, not missing catalog promises.
- `battleforge` routes to the existing legacy generator at `blocks/forges/the-room.html`; `envforge` routes to `blocks/forges/environment-forge.html`.
- OS shell consumes `system.environment.selected` and applies chosen environment CSS variables to `#nx-desktop`.
- Canonical player wallet stance: Wallet v4 only, visible NEX starts at 0, no task-completion/reward faucet and no boot-time genesis claim. Do not reintroduce automatic funds.
- Atlas has local fallback for world list/save/delete when Vibes Library is closed or slow; still prefers Vibes Library when available.
- Companion now reads `nexus:selected-environment:v1` / `nexus:selected-companion:v1`; notes have fixed-body scroll behavior and top-header drag.

## Sweep 14 — Control, persistence, and one-wallet clarity

- Baseline after implementation: `bash tests/run.sh` reports 473 passes / 0 fails.
- First Contact now writes real `vibe.save` envelopes for the accepted companion/world when Vibes Library is awake, while also mirroring the world into Atlas local fallback storage.
- Environment Forge now has human presets, Library save, Atlas fallback mirroring, and desktop background preview/finalization.
- Compose Stage is now a three-step ingredient flow: Companion → World → The Room. It routes to existing legacy forge tools only.
- Desktop Home Notes stores local notes under `nexus:home-notes:v1` and sends a one-shot inbox item to Companion at `nexus:home-note-inbox:v1`. Companion imports that as a movable note and clears the inbox.
- Wallet copy now emphasizes one wallet / one visible NEX balance. UTXOs are labeled as proof outputs, not separate balances.
- Delete/Backspace shielding was broadened for focused text inputs to reduce Chromium shortcut prompts during searches/typing.

## 2026-05-09 — Boot calibration handoff

Current verified baseline before doc-alias edits: **473 passes / 0 fails** via `bash tests/run.sh`. This archive now has root-level exact-case `.MD` aliases for the seven operator-required living docs. They are intentionally pointers only; canonical content remains in `README.md`, `AI_CODEBASE_HANDOFF.md`, and `docs/*.md`.

Next AI: read the canonical docs, not the alias files, before making runtime changes. Keep the aliases stable unless the operator explicitly changes the boot contract.

## 0c · Recovered Eidolon forge UX canon — 2026-05-09

The operator supplied four original Eidolon forge files that had been moved out of the repository. They have been restored under `legacy/eidolon-forges/` and documented in `docs/EIDOLON_FORGE_CANON.md`.

Treat these files as the intended UX reference for the next bug-hunting/UI sweep:

- `eidolon-forge.html` — the creature creation feel: live canvas, axes, editable labels, sweep, locks, group randomize, JSON save/load.
- `eidolon-environment-forge.html` — the world creation feel: 16:9 animated environment, one-visible-effect axes, test creature silhouettes.
- `eidolon-multiforge.html` — fast ideation: 3x3 candidate grid, mode switch, jitter, player-authored templates.
- `eidolon-battleforge.html` — battle creation: 3x3 attack grid, phase model, scrubber, replay speed, templates.

Do not wire them in blindly. The next implementation sweep should adapt them to Nexus block protocol/storage, but preserve their core interaction grammar: live animated canvas first, user control second, static cards last.

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

## Sweep 18 — Eidolon OS companion bridge (2026-05-09)

**Eidolon OS (`blocks/eidolon/eidolon-os.html`) now reads the selected companion at boot.**

- Added `dnaFromSeed(seed)` — derives 16-byte DNA from a numeric seed via `mulberry32`, matching the platform PRNG.
- Added `loadCompanionFromOS()` — reads `nexus:selected-companion:v1` from `localStorage`, validates `spec.seed`, derives DNA/hues/name. Returns `null` on any failure.
- Boot sequence: tries `loadCompanionFromOS()` first; falls back to `randomDna()` if null (standalone mode unchanged).
- `onChallengerArrival` `!player` branch: same pattern — OS companion preferred, random fallback.
- Feed messages: `pushFeed('OK', 'Companion loaded: …')` or `pushFeed('INFO', 'No companion selected …')`.
- Boot subtitle changed from "sovereign cartridge os" → "battle".
- `startBattle()` signature, `randomDna()`, router, renderer, engine all untouched.
- Verified: `bash tests/run.sh` → **544 / 0** unchanged.

## Sweep 19 — OS Chrome overhaul (2026-05-09)

Four shell-chrome changes to `Nexus_OS.html` only:

- **Titlebar controls RIGHT:** `min, max, close` are now wrapped in `.nx-titlebar-controls` (flexed to right via `margin-left:auto`). State dot is first child (left). Order: `[● status] [Title] [conviction] [– □ ✕]`. This applies in both `createWindow` and `preCreateWindow`.
- **8-point resize:** `setupResize(win)` now creates 8 directional handle divs (`[class^="nx-resize-"]`) per window. Supports N/S/E/W/NW/NE/SW/SE. `_resizeState` carries `dir` string. mousemove uses `dir.includes()` checks. Global cursor override removed.
- **Launcher outside-click dismiss:** `document.addEventListener('mousedown')` closes launcher when click is outside `#nx-launcher` and `#nx-launcher-btn`.
- **First Contact first-run auto-open:** `checkFirstRun()` IIFE at boot end reads `nexus:selected-companion:v1`; if absent, spawns and maximizes `first-contact` after 1200ms. One-shot — key written on accept prevents repeat.

Verified: `bash tests/run.sh` → **544 / 0** unchanged.

## Sweep 20 — Eidolon Forge 2 integration (2026-05-09)

**Full-axis creature forge is now a managed block at `blocks/forges/eidolon-forge.html`.**

- 36 axes across 7 groups: body, appendages, eyes, surface, particles, glow, color.
- Sweep (⇌) animates any axis 0→255 in a loop. Lock (⚿) excludes from randomize. Group shuffle randomizes all unlocked axes in a group at once.
- Managed block: declares `vibe.save`, `vibe.load`, `vibe.list`, `vibe.delete`. When Vibes Library is mounted, save goes to Library + file download. Standalone: file download only.
- Catalog: `BUILTIN_CATALOG` entry `id:"eidolon-forge"`. Not legacy.
- Channel atlas regenerated to 67 channels across 37 blocks.
- Test: `tests/sweep20-eidolon-forge-tests.js` — 6 assertions, all pass.
- Verified: `bash tests/run.sh` → **556 / 0**.
- Legacy forge files remain preserved under `legacy/eidolon-forges/` as source material — do not delete.

## Sweep 22 — Focus overlay removal · First Contact self-close · Companion drag (2026-05-09)

Three of four fixes applied (FIX 2 blocked — see note):

- **Focus overlay removed:** `.nx-focus-overlay` CSS and JS element creation deleted from both `createWindow` paths. Windows are now always pointer-interactive. First click on any inactive window immediately reaches the iframe. See LANDMINES.md — do not re-add.
- **First Contact self-close:** `evictBlock('first-contact', ...)` added inside `system.companion.selected` kernel handler with 800ms delay. After accepting contact, the First Contact window closes automatically.
- **Companion drag:** `#nx-live-companion` now draggable. Position saved to `nexus:companion-position:v1`. On boot, position is restored. Drag threshold 4px to preserve click behavior. `e.stopPropagation()` on drag-end prevents spurious click.
- **FIX 2 PENDING:** `blocks/eidolon/nexus-battle.html` (PHANTIVEX battle block) not yet created — source file `eidolon-battle-PHANTIVEX-gen01.html` was absent from uploads. `eidolon-os.html` remains in catalog. Re-upload source file to complete FIX 2.

Verified: `bash tests/run.sh` → **556 / 0** unchanged.

## Sweep 22b — FIX 2 complete: nexus-battle.html (2026-05-09)

**`blocks/eidolon/nexus-battle.html`** is now the active battle block (BUILTIN_CATALOG, not legacy).

- Reads `nexus:selected-companion:v1` from localStorage via `loadGeneData()` → `mulberry32(seed)` DNA derivation. Falls back to embedded `#creature-dna` specimen if no companion chosen.
- Full Nexus DECLARE/ACK/MOUNTED handshake. Emits `eidolon.battle.result` on battle end.
- `eidolon-os.html` removed from active catalog (was LEGACY_CATALOG). File remains in archive but is not launcher-accessible.
- Channel atlas: 67 channels across 38 blocks.
- Verified: `bash tests/run.sh` → **559 / 0**.

## Sweep 23 — First Contact 3-column layout + embedded axes (2026-05-09)

`blocks/world/first-contact.html` only:

- **Layout:** 3-column grid (`200px 1fr 1fr`). Left = controls. Center = creature card + axes panel below it (`.creature-col` flex column). Right = world card as direct grid sibling.
- **Axes panel:** `FC_AXES` constant defines 8 exposed axes (size, width, shape, color, accent, limbs, eyes, aura). `buildAxesPanel()` injects sliders into `#fc-axes-panel`. `onAxisInput(id, val)` writes directly to `creature.axes[id]` — animation loop picks up on next frame with no explicit redraw. `syncAxesPanel()` must be called after any reroll.
- **Removed:** Fine tune forges button, Open Companion/Library/Atlas ghost buttons and their handlers. `.copy` paragraph hidden via CSS; zero-NEX text preserved in `.next` panel.
- **Invariant:** `"No NEX is granted"` must remain in file (guarded by sweep14 test). Currently in `.next` panel.

Verified: `bash tests/run.sh` → **559 / 0** unchanged.

---

## 0c · Immediate handoff note from Lattice bridge repair

Do not chase the old `blocks/nexus-lattice(1).html` Rule A failure; it is fixed in this archive. The exact change was `type:"MSG"` → `type:"EMIT"` in the block bridge's `emit()` method, mirrored in the root duplicate. Current full harness: **674 / 0**.

## Handoff — Eidolin Maker/Player Diagnostic (2026-05-17)

See `docs/EIDOLIN_GAME_MAKER_DIAGNOSTIC.md` for the detailed answers to rendering, assets, quasi-SQL, sandboxing, tile maps, triggers, Nostr, wallet, and tab/window communication.

Implementation guidance from the diagnostic:

1. Treat current Eidolin as a Canvas 2D procedural side-scroller, not as a tile-map engine.
2. Use Vibes Library envelopes for authored project metadata/assets first; do not assume NexusDB can create new tables dynamically.
3. Build a dedicated map/project schema for Pokémon-style authored worlds.
4. Keep the player as a managed iframe block using the existing MessageChannel handshake and channel contract.
5. Use Nostr custom 304xx events only where sharing/attesting/battling needs public relay sync; keep local authoring in IndexedDB/local project envelopes.
6. Wallet locks can support ranked battles/stakes, but should not be treated as external-chain settlement.


---

## Sweep 4 calibration note — Pokémon maker diagnostic pass 2 (2026-05-17)

Created `docs/POKEMON_MAKER_SECOND_DIAGNOSTIC.md` because the second diagnostic pass is load-bearing for future architecture. Findings: managed blocks require BOOT → DECLARE → MOUNT_CHALLENGE → MOUNT_ACK → MOUNTED; peer traffic normally routes through the kernel except router-brokered BroadcastChannel streams; NexusDB schema can be extended only through a DB_VERSION bump in `blocks/system/nexus-db.html`; large maps should use IndexedDB chunks, not bus-sized blobs; asset manifest loading is only a seam; Nostr 304xx kinds are informal; standalone Canvas + IndexedDB blocks are feasible without wallet/Nostr.

---

## Pokémon-Style Game Maker/Player — Current State (2026-05-17)

**Status: Step 1 complete. Engine library built and tested. Next: DB migration → player block → maker block.**

### What was built

After five rounds of adversarial Sonnet+Opus architecture review, the architecture spec was finalised at v3. The spec lives at:

```
docs/POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md
```

The session guide with all prompts lives at:

```
docs/POKEMON_MAKER_SESSION_GUIDE.md
```

The engine library was then built from scratch reading the real codebase:

```
engines/pokemon-engine.js      — pure JS library, 1139 lines, zero dependencies
pokemon-engine-test.html       — standalone test harness, open by double-click
tests/pokemon-engine-tests.js  — 43 headless Node.js tests, all passing
```

`tests/run.sh` has been updated to include `pokemon-engine-tests.js`. Full suite: **61 pass / 0 fail** (existing tests untouched) + **43 new passes**.

### Critical codebase facts discovered during build (not in earlier diagnostics)

**DB namespace guard — MANDATORY.** The nexus-db.html block enforces that every table name must start with the querying block's `appId`. The pokemon blocks use `appId: 'pokemon'`. Therefore ALL pokemon tables must be named:
- `pokemon_drafts`  (NOT `game_drafts`)
- `pokemon_projects` (NOT `game_projects`)
- `pokemon_assets`  (NOT `asset_blobs`)
- `pokemon_saves`   (NOT `save_games`)

The spec v3 uses these correct names. Do not use any other names.

**DB query pattern.** Blocks talk to the DB block via `nx.request('db.query', {...})`. The `nx.request()` call handles `_reqId` correlation automatically. To use the DB from a block:
1. Add `'db.query'` to manifest `emits`
2. Add `'db.result'` to manifest `consumes`
3. `nx.ready.then(() => nx.subscribe('db.result'))`
4. `nx.request('db.query', { query, params, filters, sort, appId: 'pokemon' }, { timeout: 8000 })`

**Catalog registration required.** Every new block must be added to `BUILTIN_CATALOG` in `Nexus_OS.html` or it will not appear in the launcher. See existing entries for the exact format.

**Script path for new blocks.** Blocks in `blocks/` load engines with `../../engines/`:
```html
<script src="../../engines/nexus-block-client.js"></script>
<script src="../../engines/pokemon-engine.js"></script>
```

**battle-engine.js is clean.** Zero Nostr/crypto/wallet imports. UMD IIFE, `module.exports` only. No extraction needed. `battle-engine-core.js` will NOT be created.

### What the engine contains

`window.PokemonEngine` exposes: TileCamera, TileRenderer, SpriteAtlas, CollisionMap, InputManager, AudioEngine, DialogueEngine, EventExecutor, ProjectValidator, ProjectFormat.

**The Host interface is the ONLY thing the engine calls outside itself.** Both modes (standalone and Nexus) inject a concrete Host at init.

### Decisions made — do not re-litigate

- No leveling/XP at MVP
- HP/PP/status persist between battles via BattleEngine adapter
- Catching is overworld-handled via `catch` EventExecutor command
- Type chart is engine-internal (hardcoded in battle-engine.js, covered by ENGINE_HASH)
- Move menu comes from `deriveMoves(dna)` — creator never picks moves
- battle-engine.js is frozen — never modify it

### Build order from here

See `docs/POKEMON_MAKER_SESSION_GUIDE.md` for full prompts. Summary:
1. DB migration (nexus-db.html, DB_VERSION 1→2, 4 pokemon_* stores, additive only)
2. Catalog entries in Nexus_OS.html
3. blocks/pokemon-player.html
4. blocks/pokemon-maker.html
5. BattleEngine adapter + golden tests
6. Standalone export
7. Nostr publish block
8. Wallet-locked items

### Test baseline after this round

```
POKEMON-ENGINE SUMMARY pass=43 fail=0
BATTLE-ENGINE SUMMARY  pass=12 fail=0
SUMMARY pass=61 fail=0  (all existing tests)
```

Total: 104 passing, 0 failing.
