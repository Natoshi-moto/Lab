# Nexus Moot

A browser-native creature/world/battle platform. Sovereign single-file HTML "blocks" running inside a custom microkernel OS. No build step, no npm, no server. Vanilla JS, IndexedDB, optional Nostr for gossip.

This archive is `Nexus Moot v1.4`.

---

## Current state — 2026-05-17

This continuation started from `Nexus_Current_calibration_round_1_docs.zip`, derived from the uploaded `Nexus Current.zip`, and works inside `Nexus Current/Nexus_Gold_sweep26_final(1) OPUS (2)/sweep26_working/`. The newest authored sweep visible in the existing logs is still **Sweep 26 — Distributed compute substrate · worker pool · stream router · render demo**.

Current result for this handoff round:

- One surgical functional fix was made in the Nexus Lattice bridge.
- `blocks/nexus-lattice(1).html` changed its hand-rolled MessagePort emit envelope from `type:"MSG"` to `type:"EMIT"`.
- The root duplicate `nexus-lattice(1).html` received the same one-token protocol repair so the reference copy does not drift from the block copy.
- Required maintenance docs were updated after the fix.
- `node tools/channel-atlas.js --check` passes; `docs/CHANNEL_ATLAS.md` remains current at **80 channels across 49 blocks**.
- `bash tests/run.sh` now passes: **674 passes / 0 fails across 35 summary groups**.

The archive is green at this point.

---

## What this is

Nexus Moot is the platform stack the user is building toward "a new Game Boy" — not a specific game, but the substrate that hosts one. The metaphor:

- **Browser** = hardware
- **Nexus OS** = firmware
- **Sovereign single-file HTML blocks** = cartridges
- **Eidolon Vibes Engine** = the killer-app stack that runs on top
- **Atlas** = the cartridge press

The architecture is built around **determinism**. Creatures are 16 bytes of DNA + 3 hue floats fed through a seeded PRNG; same input always produces the same visual, forever. Worlds are 32-bit seeds plus a generator function; any tile of any planet can be regenerated locally by anyone who knows the seed. Battles resolve byte-identically across machines given the same inputs. This is what makes peer-to-peer multiplayer possible without a server.

---

## How to boot it

### Easiest

Double-click `Nexus_OS.html` in your file browser. The OS boots in your default browser. From the launcher, open any block.

### Recommended (for `MessageChannel` reliability)

Some browsers silently drop `MessagePort` transfers across `file://` + sandboxed iframes. If a block stays in `LOADING` forever, run a local web server from the archive root:

```bash
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080/Nexus_OS.html`.

### Optional: the LLM proxy

Some blocks call out to LLM APIs through a local Python gateway:

```bash
python3 proxy/nexus_proxy.py
```

The proxy listens on port 8787 by default. It's not required for the core platform.

---

## What's in the archive

For a complete file inventory, see [`docs/CODEBASE_ORIENTATION.md`](./docs/CODEBASE_ORIENTATION.md).

The high-level shape:

- **`Nexus_OS.html`** — the kernel. Hosts every other block.
- **`blocks/vibes/`** — the Vibes Engine: asset library, battle composer, battle runner, breeding console.
- **`blocks/world/`** — Atlas (world creator) and the witness prototype.
- **`blocks/eidolon/`** — Eidolon-side OS and router.
- **`blocks/system/`** — wallet, NexusDB, Mission Control, genesis verifier.
- **`blocks/apps/`** — small utility apps (terminal, files, notepad, reader, about, web viewer).
- **`blocks/social/`** — Nostr-based social, channels, forums.
- **`blocks/forges/`** — legacy and template forges.
- **`engines/`** — shared deterministic engines (`substrate.js`, `battle-engine.js`, `battle-protocol.js`, `breed-engine.js`, `witness-selection.js`, `eidolon-generator.js`) and IPC adapters (`nexus-block-client.js`, `vibe-adapter.js`).
- **`tests/`** — Node-based test harness.
- **`realms/realm_genesis_0.json`** — reference copy of the genesis realm charter (the runtime data is inlined in `vibes-library.html`).
- **`proxy/nexus_proxy.py`** — the local LLM API proxy.

---

## Documentation

The archive carries seven living docs (updated every sweep) and several reference docs.

### Living

| File | Read it for |
|---|---|
| `README.md` (this file) | What this is and how to boot it. |
| `AI_CODEBASE_HANDOFF.md` | If you are an AI instance opening this archive. |
| `docs/CODEBASE_ORIENTATION.md` | Inventory: what file does what. |
| `docs/LANDMINES.md` | Things that will silently break the system. |
| `docs/HANDY_LESSONS.md` | Patterns that have paid off. |
| `docs/HANDY_CODE_SNIPPETS.md` | Canonical reusable code. |
| `docs/FREEDOM_REASONING_LOG.md` | Reasoning for any deviation from instructions. |


### Exact-case boot-contract aliases

This archive also includes root-level `.MD` aliases for the seven required maintenance documents: `CODEBASE_ORIENTATION.MD`, `README.MD`, `FREEDOM_REASONING_LOG.MD`, `HANDY_CODE_SNIPPETS.MD`, `HANDY_LESSONS.MD`, `LANDMINES.MD`, and `AI_CODEBASE_HANDOFF.MD`. They are stable pointers only; edit the canonical files listed above.

### Reference

| File | Role |
|---|---|
| `CRITICIAL AI INSTRUCTIONS README.md` | Operating contract + per-round changelog. The misspelling is canonical. |
| `docs/SANDBOX.md` | Honest sandbox model — what `allow-same-origin` actually does, what `KERNEL_SECRET` does and doesn't protect. |
| `docs/COMMUNITY_BLOCKS_DESIGN.md` | The architectural design for hosting blocks the operator didn't write. Three options compared, Option C recommended. Read SANDBOX.md first. |
| `docs/legacy/EIDOLON-HANDOFF.md` | Original architectural handoff (~395 lines). Deep reference. |
| `docs/legacy/ATLAS-HANDOFF.md` | World layer + witness architecture (~342 lines). |
| `docs/VIBES-RUNBOOK.md` | Day-one guide for using the Vibes Engine. |
| `docs/OPERATOR_SMOKE.md` | Manual-test checklist. |
| `docs/REALMS.md` | Realm charter schema, ruleset versioning. |
| `docs/PHANTIVEX_DIFF.md` | Battle-engine reconciliation against the canonical donor. |
| `docs/TOOLS.md` | CLI tooling guide for block inspection, channel atlas generation, and spec audits. |
| `docs/CHANNEL_ATLAS.md` | Generated IPC channel registry. Regenerate with `node tools/channel-atlas.js`. |
| `docs/nexus-os-patch.md` | Path-normalization patch documentation. |

---

## Verifying the archive

```bash
bash tests/run.sh
```

The current passing baseline is **674 passes / 0 fails across 35 summary groups**. If you see fewer, something regressed unless the sweep explicitly changed test expectations.

For things the harness can't cover (browser UI, live Nostr relay behavior, cross-window multiplayer), see [`docs/OPERATOR_SMOKE.md`](./docs/OPERATOR_SMOKE.md) for manual checks.

---

## Status

The archive is under active multi-round AI-collaborated maintenance. Each round delivers a fresh zip with a round log entry in `CRITICIAL AI INSTRUCTIONS README.md`. Current verified state on **2026-05-17** is **674 passes / 0 fails** after the Nexus Lattice bridge contract repair. The latest tooling sweep added the `tools/` layer, `docs/TOOLS.md`, generated `docs/CHANNEL_ATLAS.md`, and `tests/tools-tests.js`; no npm or build step was introduced.

Recent code-changing rounds:

- Sweep H communication layer made the shell visibly consume live OS events: notification center/history, pending publish pip, bell badge, witness/epoch/realm/NEX taskbar indicators, motion tokens, and empty-state polish. It adds `docs/MOTION.md`, `engines/nexus-tokens.css`, and `tests/notification-center-tests.js`.
- Sweep 9 tooling added three standard-library-only Node utilities: `tools/block-inspect.js`, `tools/channel-atlas.js`, and `tools/spec-audit.js`. `channel-atlas --check` is wired into the full harness so manifest-channel changes must keep `docs/CHANNEL_ATLAS.md` current.
- Sweep 8 hardened startup stability: valid declared subscription bursts no longer trigger control-rate eviction, and Wallet v4 installs its managed BOOT listener before async hydration.
- Sweep 7 fixed browser/Fedora smoke issues: managed iframes allow downloads, `NexusBlockClient` queues emits until `MOUNTED`, and the root `package.json` pins CommonJS without dependencies.
- Earlier Phase 3 rounds migrated multiple blocks onto `engines/nexus-block-client.js`, added the contract analyzer, added community-block design docs, and shipped `blocks/system/block-hash.html`.

Upcoming rounds (proposed, not yet executed):

Current protocol-surface map: **exact counts should be regenerated with `node tools/block-inspect.js` before a handshake sweep; the full harness is currently 674/0.** See `docs/CODEBASE_ORIENTATION.md` for the file-by-file tracker. The harness also guards local script refs, startup readiness races, declared SUB bursts, Wallet managed boot timing, generated tooling docs, and the Sweep H notification shell service.

- Round 020: Handshake unification, Phase 3b — `Nexus Forums v0.02.html` (1591 lines) and `Nexus Social v0.02.html` (2366 lines). The two big social blocks; both should be straightforward applications of the recipe in `HANDY_LESSONS.md` #14/#14a.
- Round 021: Handshake unification, Phase 3c — `eidolon-os.html` (nested kernel; migrate only the outer Nexus handshake), `the-room.html`, plus smaller hand-rolled managed utilities such as `drift.html` / `block-doctor.html` if the user wants the easy cleanup before Wallet.
- Round 022: `Wallet_v4_nexus.html` — the most complex remaining block, with custom WALLET_RESPONSE protocol extensions. Migration plan needs design before code.
- Round 023: Catalog graveyard cleanup — decide each `disabled:true reason:"file missing"` entry: resurrect, move to a `PLANNED.md`, or delete.
- Round 024 and beyond: act on `COMMUNITY_BLOCKS_DESIGN.md` recommendations, starting with the kernel-side syscall surfaces required by Option C.

---

## Constraints

If you're contributing or asking an AI to contribute:

- No build step. No npm. No frameworks. Vanilla JS only.
- Single-file HTML blocks. Keep them sovereign.
- Determinism is load-bearing. See `docs/LANDMINES.md` #1, #2, #4.
- Never break standalone mode. See `docs/LANDMINES.md` #6.
- Never use copyrighted IP. See `docs/LANDMINES.md` #7.

The full list lives in `docs/LANDMINES.md`.


## 2026-05-09 — Sweep I/J: Player Thread + Wallet/Genesis beauty pass

Historical Sweep I/J baseline was **415 passes / 0 fails**. The current boot-calibrated baseline is **473 passes / 0 fails**. That sweep added the OS-local Player Thread guidance service and a wallet/genesis presentation upgrade without changing backend behavior, deterministic engines, wallet math, battle math, witness math, realm charters, or npm/build requirements.

New/updated surfaces:

- `Nexus_OS.html`: `nx-player-thread` service, taskbar `Thread` chip, desktop nudge, palette aliases (`next`, `thread`, `continue`, `what now`, `current thread`), shell milestone tracking, and fallback launch routing.
- `blocks/system/Wallet_v4_nexus.html`: richer balance dashboard, action-oriented empty states, and a Genesis trust-anchor hero/status grid.
- `blocks/system/nexus-genesis-verifier.html`: hero trust grid, input/results cards, and stronger local-verification presentation.
- `docs/PLAYER_THREAD.md`: canonical description of the state model, resolver priority, fallbacks, and non-goals.
- `tests/player-thread-tests.js`: resolver/storage/fallback/UI sentinel coverage.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

Historical Sweep 13 baseline: **459 passes / 0 fails** plus `node tools/channel-atlas.js --check` green. The current boot-calibrated baseline is **473 passes / 0 fails**.

Player-facing corrective sweep shipped:
- Repaired missing launch targets reported by Chromium console: `blocks/world/first-contact.html`, `blocks/system/welcome.html`, `blocks/forges/lattice-shell.html`, `blocks/forges/compose-stage.html`, and `blocks/forges/environment-forge.html` now exist and are active where intended.
- Added live First Contact companion/world randomizer. Accepted world is stored at `nexus:selected-environment:v1` and drives the OS desktop background; accepted companion is stored at `nexus:selected-companion:v1` and feeds Companion/Library flows.
- Wallet v4 is now the canonical player wallet surface: **one NEX balance**, zero-start by default, no automatic embedded genesis claim on boot. Developer genesis remains explicitly labeled advanced.
- Atlas now degrades to local world storage if `vibe.list` times out instead of feeling broken when Vibes Library is not mounted.
- Vibes Library text contrast improved; launcher/file search inputs shield Delete/Backspace from global/browser shortcut handling.

## Sweep 14 — Control, persistence, and one-wallet clarity

- Baseline after implementation: `bash tests/run.sh` reports 473 passes / 0 fails.
- First Contact now writes real `vibe.save` envelopes for the accepted companion/world when Vibes Library is awake, while also mirroring the world into Atlas local fallback storage.
- Environment Forge now has human presets, Library save, Atlas fallback mirroring, and desktop background preview/finalization.
- Compose Stage is now a three-step ingredient flow: Companion → World → The Room. It routes to existing legacy forge tools only.
- Desktop Home Notes stores local notes under `nexus:home-notes:v1` and sends a one-shot inbox item to Companion at `nexus:home-note-inbox:v1`. Companion imports that as a movable note and clears the inbox.
- Wallet copy now emphasizes one wallet / one visible NEX balance. UTXOs are labeled as proof outputs, not separate balances.
- Delete/Backspace shielding was broadened for focused text inputs to reduce Chromium shortcut prompts during searches/typing.


## 2026-05-09 — Boot calibration documentation sweep

This archive was re-opened as `Nexus_Moot_v1_4_boot_calibrated.zip` for a documentation-only calibration pass. No runtime/code files were intentionally edited. The goal was to make the living docs match the real shipped state after Sweeps H, I/J, 13, and 14.

Verified current baseline:

```text
NODE-MODE SUMMARY pass=2 fail=0
SYNTAX SUMMARY pass=81 fail=0
CATALOG SUMMARY pass=43 fail=0
SCRIPT-REF SUMMARY pass=39 fail=0
SANDBOX SUMMARY pass=3 fail=0
SUB-BURST SUMMARY pass=3 fail=0
WALLET SUMMARY pass=3 fail=0
CONTRACT SUMMARY pass=102 fail=0
COMPANION SUMMARY pass=2 fail=0
VERSE SUMMARY pass=2 fail=0
BREED SUMMARY pass=5 fail=0
BATTLE-ENGINE SUMMARY pass=12 fail=0
ROUTER-BATTLE SUMMARY pass=3 fail=0
OS-BATTLE SUMMARY pass=3 fail=0
CROSS-BLOCK SUMMARY pass=2 fail=0
PALETTE SUMMARY pass=3 fail=0
EVENTLOG SUMMARY pass=2 fail=0
SYSTEM-HEALTH SUMMARY pass=2 fail=0
NOTIFICATIONS SUMMARY pass=5 fail=0
PLAYER-THREAD SUMMARY pass=15 fail=0
SWEEP13 SUMMARY pass=14 fail=0
SWEEP14 SUMMARY pass=13 fail=0
UNDO SUMMARY pass=4 fail=0
DEADLETTER SUMMARY pass=3 fail=0
ROADMAP SUMMARY pass=4 fail=0
BATTLE-PROTOCOL SUMMARY pass=7 fail=0
SLOT SUMMARY pass=4 fail=0
BATTLE-STAKES SUMMARY pass=4 fail=0
WITNESS SUMMARY pass=5 fail=0
IMPRINT SUMMARY pass=7 fail=0
TOOLS SUMMARY pass=15 fail=0
SUMMARY pass=61 fail=0
```

Additional verification:

```bash
node tools/channel-atlas.js --check
# channel-atlas --check: docs/CHANNEL_ATLAS.md is up to date.
```

Current surface snapshot:

- 35 block HTML files.
- 26 client-backed blocks using `engines/nexus-block-client.js`.
- 8 hand-rolled blocks.
- 1 kernel-host (`blocks/eidolon/eidolon-os.html`).
- 39 local script references guarded by the harness.
- 65 manifest channels across 35 blocks in `docs/CHANNEL_ATLAS.md`.
- Root-level exact-case `.MD` boot documents exist as calibrated indexes pointing at the canonical lowercase/mixed-case living docs.

## Eidolon forge UX canon reintroduced

The recovered legacy forge files are now preserved under [`legacy/eidolon-forges/`](./legacy/eidolon-forges/). They are not active launcher/runtime integrations in this pass; they are canonical source material for the next UX/debug sweep.

| File | UX canon |
|---|---|
| `legacy/eidolon-forges/eidolon-forge.html` | Live creature canvas, user-renamable axes, sweep, locks, randomize/save/load. |
| `legacy/eidolon-forges/eidolon-environment-forge.html` | Live 16:9 world canvas, layered environment axes, test creature silhouettes. |
| `legacy/eidolon-forges/eidolon-multiforge.html` | 3x3 creature/environment randomizer grid, selection, templates, jitter. |
| `legacy/eidolon-forges/eidolon-battleforge.html` | Attack animation grid, phase playback/scrubber, templates, replay speeds. |

Read [`docs/EIDOLON_FORGE_CANON.md`](./docs/EIDOLON_FORGE_CANON.md) before changing First Contact, Companion, Environment Forge, Compose Stage, The Room, Atlas, or battle creation UX.

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

## Eidolin Maker/Player Diagnostic (2026-05-17)

A planning diagnostic for Pokémon-style game-maker/player work is available at `docs/EIDOLIN_GAME_MAKER_DIAGNOSTIC.md`. Summary: Eidolin is currently a Canvas 2D procedural side-scroller, not a tile-map engine; Vibes Library is the strongest current home for authored game-data envelopes; Nostr and wallet flows are already available for attestations/battles/locks but should not be confused with local authoring storage.


---

## Sweep 4 calibration note — Pokémon maker diagnostic pass 2 (2026-05-17)

Created `docs/POKEMON_MAKER_SECOND_DIAGNOSTIC.md` because the second diagnostic pass is load-bearing for future architecture. Findings: managed blocks require BOOT → DECLARE → MOUNT_CHALLENGE → MOUNT_ACK → MOUNTED; peer traffic normally routes through the kernel except router-brokered BroadcastChannel streams; NexusDB schema can be extended only through a DB_VERSION bump in `blocks/system/nexus-db.html`; large maps should use IndexedDB chunks, not bus-sized blobs; asset manifest loading is only a seam; Nostr 304xx kinds are informal; standalone Canvas + IndexedDB blocks are feasible without wallet/Nostr.
