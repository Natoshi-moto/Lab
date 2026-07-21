# CODEBASE_ORIENTATION

The map of the archive. What every file is, what conceptual layer it sits in, whether it is active, legacy, or scaffolding. Update this file whenever files are added, removed, or change role.

The directory layout reflects the conceptual layering described below. Round 015 (Cleanup Sweep 3) physically reorganized the archive from flat-root into the structure documented here.

---

## Current state overlay — 2026-05-17

This continuation started from `Nexus_Current_calibration_round_1_docs.zip`, derived from uploaded `Nexus Current.zip`. The active working root is:

```
Nexus Current/Nexus_Gold_sweep26_final(1) OPUS (2)/sweep26_working/
```

Observed surface after the Lattice bridge repair:

- **449 files**, **59 directories** under the working root before packaging cleanup.
- Top-level runtime entry: `Nexus_OS.html`.
- Major active areas: `blocks/`, `engines/`, `tests/`, `tools/`, `docs/`, `proxy/`, `realms/`.
- Additional bundled/reference surfaces: `Eidolin Explore/`, `Eidolin World/`, `blocks/Eidolin/`, `nexus-lattice-gold-stitch/`, `Edolin Creator/`, `legacy/eidolon-forges/`.
- `docs/CHANNEL_ATLAS.md` is generated and current: **80 channels across 49 blocks**.
- Local script-reference harness reports **67** resolving local `<script src>` imports.

Functional change in this round:

- `blocks/nexus-lattice(1).html`: `this.port.postMessage({type:"MSG",channel:t,payload:n})` → `this.port.postMessage({type:"EMIT",channel:t,payload:n})`.
- `nexus-lattice(1).html`: same one-token protocol repair to keep the root duplicate in sync.

Verification status:

- `node tools/channel-atlas.js --check` → pass.
- `node tests/block-contract-tests.js` → **CONTRACT SUMMARY pass=141 fail=0**.
- `bash tests/run.sh` → **674 passes / 0 fails across 35 summary groups**.

This overlay supersedes the earlier same-day calibration note that recorded the pre-existing Lattice `MSG` failure. Historical sections below remain useful for how the archive evolved.

---

## Current boot-calibrated snapshot — 2026-05-09

Source archive: `Nexus_Moot_v1_4_boot_calibrated.zip`. This calibration pass intentionally changed documentation only. Runtime/code surfaces were inspected, not edited.

Verification:

- `bash tests/run.sh` → **473 passes / 0 fails**.
- `node tools/channel-atlas.js --check` → up to date.
- `docs/CHANNEL_ATLAS.md` → **65 channels across 35 blocks**.
- `tools/block-inspect.js` classification sweep → **26 client-backed blocks**, **8 hand-rolled blocks**, **1 kernel-host**.
- Local script-ref harness → **39** resolving local `<script src>` references.

High-level shipped UX state:

- Sweep H: OS notification center, history drawer, live taskbar chrome, motion tokens.
- Sweep I/J: Player Thread taskbar guidance, desktop nudge, palette `next` / `what now`, wallet/genesis presentation pass.
- Sweep 13: repaired missing launch paths, live First Contact randomizer, selected companion/world storage, zero-start wallet canon, Atlas fallback, Vibes Library readability, Delete/Backspace shielding.
- Sweep 14: lockable First Contact rerolls, real `vibe.save` attempts plus fallback mirrors, Environment Forge presets, clearer Compose Stage, Desktop Home Notes → Companion inbox bridge, one-wallet wording.

## Tree

```
/                                    (archive root)
  README.md                          (human entry point)
  README.MD                          (exact-case boot-contract index)
  Nexus_OS.html                      (kernel — double-click to boot)
  CRITICIAL AI INSTRUCTIONS README.md (operating contract + per-round changelog)
  AI_CODEBASE_HANDOFF.md             (next-AI entry point)
  AI_CODEBASE_HANDOFF.MD             (exact-case boot-contract index)
  CODEBASE_ORIENTATION.MD            (exact-case boot-contract index)
  FREEDOM_REASONING_LOG.MD           (exact-case boot-contract index)
  HANDY_CODE_SNIPPETS.MD             (exact-case boot-contract index)
  HANDY_LESSONS.MD                   (exact-case boot-contract index)
  LANDMINES.MD                       (exact-case boot-contract index)
  package.json                       (CommonJS/no-deps sentinel)

  docs/
    CODEBASE_ORIENTATION.md          (this file)
    LANDMINES.md
    SANDBOX.md
    COMMUNITY_BLOCKS_DESIGN.md
    HANDY_LESSONS.md
    HANDY_CODE_SNIPPETS.md
    FREEDOM_REASONING_LOG.md
    VIBES-RUNBOOK.md
    OPERATOR_SMOKE.md
    ROADMAP_STATUS.md
    MOTION.md
    PLAYER_THREAD.md
    REALMS.md
    PHANTIVEX_DIFF.md
    TOOLS.md
    CHANNEL_ATLAS.md
    nexus-os-patch.md
    legacy/
      EIDOLON-HANDOFF.md
      ATLAS-HANDOFF.md

  engines/                           (shared .js, classic-script UMD)
    substrate.js
    battle-engine.js
    battle-protocol.js
    breed-engine.js
    witness-selection.js
    eidolon-generator.js
    nexus-block-client.js
    vibe-adapter.js

  blocks/
    vibes/                           (the Vibes Engine asset stack)
      vibes-library.html
      vibes-crucible.html
      vibes-arena.html
      kin-forge.html
    world/                           (the world layer)
      atlas.html
      first-contact.html
      nexus-witness.html
    eidolon/                         (the Eidolon creature stack)
      eidolon-os.html
      eidolon-router.html
    system/                          (system-level blocks)
      nexus-db.html
      mission-control.html
      Wallet_v4_nexus.html
      nexus-genesis-verifier.html
      block-doctor.html
      block-hash.html
      welcome.html
    apps/                            (utility apps)
      app-about.html
      app-files.html
      app-notepad.html
      companion.html
      verse-studio.html
      app-reader.html
      app-terminal.html
      nexus-webviewer.html
      drift.html
    social/                          (Nostr social stack — filenames still fragile)
      Nexus Social v0.02.html
      Nexus Channels v0.02.html
      Nexus Forums v0.02.html
    forges/                          (legacy / template forges)
      forge-nexus-template.html
      the-room.html
      i-was-wrong.html
      iww-nexus-guide.html
      environment-forge.html
      lattice-shell.html
      compose-stage.html

  tests/                             (Node-based test harness)
    run.sh
    syntax-check.js
    catalog-paths-tests.js
    local-script-refs-tests.js
    block-contract-tests.js
    os-chrome-harness.js
    palette-tests.js
    eventlog-tests.js
    system-health-tests.js
    undo-tests.js
    deadletter-tests.js
    breed-engine-tests.js
    battle-engine-tests.js
    battle-protocol-tests.js
    slot-economy-tests.js
    battle-stakes-tests.js
    witness-tests.js
    imprint-tests.js
    protocol-harness.js
    tools-tests.js
    companion-block-tests.js
    verse-block-tests.js
    router-battle-tests.js
    os-battle-tests.js
    cross-block-tests.js

  tools/                             (standard-library Node inspection utilities)
    block-inspect.js
    channel-atlas.js
    spec-audit.js

  realms/                            (reference data — JSON charter)
    realm_genesis_0.json

  proxy/                             (local LLM API gateway)
    nexus_proxy.py
```

---

## Conventions

**Path patterns.** Every block at `blocks/<category>/<file>.html` references shared engines as `../../engines/<file>.js` — uniform across all blocks. This is what makes future moves cheap: only the catalog in `Nexus_OS.html` and the four root-level files care about depth.

**What stays at root.** The kernel (`Nexus_OS.html`), human/AI entry docs (`README.md`, `AI_CODEBASE_HANDOFF.md`, `CRITICIAL AI INSTRUCTIONS README.md`), the tiny `package.json` CommonJS sentinel, and the exact-case boot-contract `.MD` index files. Detailed living-doc content remains in the canonical lowercase/mixed-case files; the exact-case files are boot indexes, not forks. **Do not move these without an explicit sweep.** A new non-index root file requires a justification entry in `FREEDOM_REASONING_LOG.md`.

**What never moves without an explicit sweep.** The `engines/` folder structure (flat, no subdirectories), the `blocks/<category>/` layout (one level deep), the `tests/` layout (flat). If you find yourself wanting to add a subfolder under `blocks/<category>/` or to nest engines, propose it as its own sweep first.

---

## Inventory by layer

### 1 · Documentation

#### Living docs (updated every sweep where their content materially changes)

| Path | Role |
|---|---|
| `README.md` | Human-facing entry point. |
| `AI_CODEBASE_HANDOFF.md` | Warm letter to the next AI instance. Read this first if you are an AI. |
| `docs/CODEBASE_ORIENTATION.md` | This file. Inventory. |
| `docs/LANDMINES.md` | Invariants that silently break the system if violated. |
| `docs/HANDY_LESSONS.md` | Patterns that paid off. |
| `docs/HANDY_CODE_SNIPPETS.md` | Canonical reusable code. |
| `docs/FREEDOM_REASONING_LOG.md` | Where deviations from instructions get logged. |
| `README.MD`, `AI_CODEBASE_HANDOFF.MD`, `CODEBASE_ORIENTATION.MD`, `FREEDOM_REASONING_LOG.MD`, `HANDY_CODE_SNIPPETS.MD`, `HANDY_LESSONS.MD`, `LANDMINES.MD` | Exact-case boot-contract index files. Keep synchronized with current calibration facts; do not turn them into divergent full-doc forks. |

#### Operating docs (also living — different change cadence)

| Path | Role |
|---|---|
| `CRITICIAL AI INSTRUCTIONS README.md` | Operating contract + 16+ round changelog. Misspelling is canonical. Updated every sweep. |

#### Reference docs (frozen snapshots, change rarely)

| Path | Role |
|---|---|
| `docs/VIBES-RUNBOOK.md` | User-facing runbook for booting and using the Vibes Engine. |
| `docs/OPERATOR_SMOKE.md` | Manual-test checklist beyond what the harness covers. |
| `docs/ROADMAP_STATUS.md` | Sweep 6 triage board for visible stubs, deferred work, disabled catalog entries, and future implementation sweeps. |
| `docs/REALMS.md` | Realm charter schema, ruleset versioning, Nostr event kinds. |
| `docs/PHANTIVEX_DIFF.md` | Battle-engine reconciliation against the canonical PHANTIVEX donor. |
| `docs/BATTLE_ENGINE_PARITY.md` | Phase A-D battle-shell parity audit and closure notes. |
| `docs/SANDBOX.md` | Honest model of iframe sandbox limits and community-block isolation options. |
| `docs/TOOLS.md` | Guide for the standard-library Node tools in `tools/`. |
| `docs/CHANNEL_ATLAS.md` | Generated IPC channel registry from block manifests. Do not hand-edit. |
| `docs/nexus-os-patch.md` | Path-normalization patch documentation. Patch is shipped; doc kept for forward-compat reasoning. Line numbers reference a historical state of `Nexus_OS.html` and are not retargeted on subsequent edits. |

#### Historical handoffs (full-depth architectural reasoning)

| Path | Role |
|---|---|
| `docs/legacy/EIDOLON-HANDOFF.md` | Original architectural handoff. ~395 lines. Deep reference. |
| `docs/legacy/ATLAS-HANDOFF.md` | World layer + witness architecture (~342 lines). |

### 2 · Kernel + shell

| Path | Role | Notes |
|---|---|---|
| `Nexus_OS.html` | Microkernel + launcher + shell. | The most load-bearing file in the archive. Hosts `BUILTIN_CATALOG` and `LEGACY_CATALOG`; Sweep 4 adds sibling chrome surfaces: Cmd/Ctrl-K command palette, Cmd/Ctrl-E cross-block event log overlay, and `system.health` kernel ticks. Sweep 5 adds kernel dead-letter capture plus an eventlog undo affordance for declared-undoable emits. Existing taskbar, Space launcher, and backtick console remain intact. |

The kernel implements: iframe sandboxing, `MessageChannel` IPC, the DECLARE/MOUNT/SUB/PING handshake, watchdog timeouts, rate limiters, declared-SUB burst grace for large service blocks, channel allowlist enforcement, `fs.*` syscall handlers, an LLM-API gateway (`api.call`), persistent state via IndexedDB, optional manifest `undoable` declarations, and a 200-entry `DEAD_LETTERS` buffer for envelopes with no mounted subscribers.

### 3 · Managed blocks

These speak the full kernel protocol. Each declares its `emits` and `consumes` either via `BUILTIN_CATALOG` in `Nexus_OS.html` or via `<meta name="nexus-block" content="managed">` in its own `<head>`.

#### Vibes Engine

| Path | Role |
|---|---|
| `blocks/vibes/vibes-library.html` | Asset broker. Owns IndexedDB store `VibesLibrary`. Handles Library persistence for worlds/companions/battle assets and wallet-lock integration. |
| `blocks/vibes/vibes-crucible.html` | Composer. Picks creature + environment + attacks → battle vibe. |
| `blocks/vibes/vibes-arena.html` | Battle runner. Solo + Multiplayer. Standalone export. |
| `blocks/vibes/kin-forge.html` | Platform breeding console. Replaces the legacy `kin-forge_1_.html`. |

#### World layer

| Path | Role |
|---|---|
| `blocks/world/atlas.html` | World creator. Authors `world` vibes with `subFormat: 'atlas-world/1'`; has local fallback storage when Vibes Library is not mounted. |
| `blocks/world/first-contact.html` | Live companion + home-world randomizer. Stores selected companion/environment, attempts `vibe.save`, emits environment/imprint/library notifications. |
| `blocks/world/nexus-witness.html` | Round-1 prototype of the deterministic-witness provenance architecture. Reference implementation. Catalog-launched as a legacy block. |

#### Eidolon stack

| Path | Role |
|---|---|
| `blocks/eidolon/eidolon-os.html` | Battle home. Reads `nexus:selected-companion:v1` OS state at boot and on challenger arrival; falls back to `randomDna()` in standalone mode. |
| `blocks/eidolon/nexus-battle.html` | Active battle block. PHANTIVEX creature battle adapted for Nexus OS. Reads companion from `nexus:selected-companion:v1`, falls back to embedded specimen. Emits `eidolon.battle.result`. |
| `blocks/eidolon/eidolon-router.html` | Routing + creature hydration. |

#### System / orchestration

| Path | Role |
|---|---|
| `blocks/system/nexus-db.html` | Quasi-SQL layer over IndexedDB for Nostr/social data. **Not used by Vibes Library.** |
| `blocks/system/mission-control.html` | System dashboard. Inventory, lineage SVG, kernel feed. |
| `blocks/system/Wallet_v4_nexus.html` | NX4 wallet. UTXO semantics, fork-proof recording, lock primitives for ranked battles. Managed-mode BOOT listener is installed before async key/DB hydration. |
| `blocks/system/nexus-genesis-verifier.html` | Genesis-block crypto verification. |
| `blocks/system/block-doctor.html` | Kernel diagnostics. Parses kernel feed and diagnoses stuck/violating blocks. |
| `blocks/system/block-hash.html` | SHA-256 content-addressing tool for verifying block bytes before install. |
| `blocks/system/welcome.html` | Lightweight managed welcome/boot surface. |

### 4 · Legacy + standalone blocks

The distinction between managed and legacy is by whether a block's catalog entry is in `BUILTIN_CATALOG` (managed) or `LEGACY_CATALOG` (legacy). All blocks below are accessed through `Nexus_OS.html`'s launcher.

#### Apps and utilities

| Path | Role |
|---|---|
| `blocks/apps/app-about.html` | System info. |
| `blocks/apps/app-files.html` | File browser using `fs.*` syscalls. |
| `blocks/apps/app-notepad.html` | Text editor. |
| `blocks/apps/companion.html` | Managed Companion block for pre-articulate thought capture; remains standalone-safe. Declares `companion.canvas.export` as `undoable`. |
| `blocks/apps/verse-studio.html` | Managed Verse Studio block; pre-built local-first creative workspace, with `__verseStudio` as its integration surface; consumes `companion.canvas.export` and `companion.canvas.export.undo`, queues canvas imports until Verse is ready, and acknowledges undo envelopes without reversing the React-side import yet. |
| `blocks/apps/app-reader.html` | Markdown viewer. |
| `blocks/apps/app-terminal.html` | Kernel feed viewer. **Best debugging surface in the system.** |
| `blocks/apps/nexus-webviewer.html` | Web view. |
| `blocks/apps/drift.html` | Deterministic generative art toy; seed string -> repeatable canvas composition. |

**Root OS chrome surfaces.** Sweep 4 adds `#nx-palette` (Cmd/Ctrl-K), `#nx-eventlog` (Cmd/Ctrl-E), and `system.health` publishes every 5 seconds from the kernel. Sweep 5 extends the palette with `deadletter` / `deadletter clear`, mounts `#nx-deadletter-panel`, and lets eventlog entries for declared-undoable emits show a 30-second `[undo Xs]` compensation button. These mount as siblings beside existing chrome and are additive to the taskbar, Space-bar launcher, and backtick console.

**Manifest schema extension.** Managed-block manifests are now `{ emits, consumes, undoable?, app }`. `undoable` is optional and each listed channel must also be in `emits`; the kernel records it in `UNDOABLE_CHANNELS` during `DECLARE`.

**Dead-letter panel.** `deliverMessage()` captures envelopes with no subscribers or no mounted subscribers into a 200-entry `DEAD_LETTERS` FIFO and mirrors them to `#nx-eventlog` with `ok:false` / `✗`. The `deadletter` palette command opens a panel for manual requeue or discard; there is no automatic retry.

#### Social stack (Nostr-based)

| Path | Role |
|---|---|
| `blocks/social/Nexus Social v0.02.html` | Nostr feed. **Filename has spaces — fragile.** |
| `blocks/social/Nexus Channels v0.02.html` | NIP-28 channels. **Same naming issue.** |
| `blocks/social/Nexus Forums v0.02.html` | Forum view. **Same naming issue.** |

#### Legacy / template forges

| Path | Role |
|---|---|
| `blocks/forges/eidolon-forge.html` | **Canonical creature authoring surface.** 36-axis Eidolon forge — sweep, lock, group-shuffle, vibe.save to Library or file. Managed block. Added Sweep 20. |
| `blocks/forges/forge-nexus-template.html` | Template for new managed forges. |
| `blocks/forges/the-room.html` | The Crucible (legacy/parallel name). |
| `blocks/forges/i-was-wrong.html` | "I Was Wrong" reflection block. |
| `blocks/forges/iww-nexus-guide.html` | Guide companion to `i-was-wrong.html`. |
| `blocks/forges/environment-forge.html` | World picker/preview surface. Saves through Vibes Library when available and mirrors Atlas fallback state. |
| `blocks/forges/lattice-shell.html` | Companion/creature imprint bridge. |
| `blocks/forges/compose-stage.html` | Human-readable battle forge router: Companion → World → The Room. |

### 5 · Shared engines and adapters

These are classic-script `.js` files (no ES modules — the codebase runs from `file://` and modules need CORS headers). Each exposes a UMD-style export so it works in browser and Node. **Loaded by every block at depth 2 as `../../engines/<file>.js`.** Loaded by Node tests as `require('../engines/<file>.js')`.

| Path | Role | Load-bearing? |
|---|---|---|
| `engines/substrate.js` | Deterministic world substrate: `tileSeed`, `mulberry32`, `generateAt`. | **YES — see `LANDMINES.md` #1.** |
| `engines/battle-engine.js` | Deterministic battle resolution. Exports `ENGINE_HASH` bound to realm charter. | **YES — see `LANDMINES.md` #2.** |
| `engines/battle-protocol.js` | Commit-reveal multiplayer battle session. Nostr kinds 30431–30434. | YES |
| `engines/breed-engine.js` | Deterministic sexual recombination. | YES |
| `engines/witness-selection.js` | Deterministic witness selection + 3-of-5 quorum verification. | YES |
| `engines/eidolon-generator.js` | Generates sovereign descendant Eidolon HTML files for the Imprint flow. | YES |
| `engines/nexus-block-client.js` | Shared managed-block IPC adapter. Used by most migrated managed blocks and the rebuilt `vibe-adapter.js`. | YES |
| `engines/vibe-adapter.js` | Drop-in shim for graduating legacy forges to managed mode. v2 (Round 018) is rebuilt on top of `nexus-block-client.js` — public API unchanged. Used by individual forges, not the kernel. | YES (graduation path) |

### 6 · Tests, data, runtime support

#### Tests

| Path | Role |
|---|---|
| `tests/run.sh` | Top-level test runner. Runs all suites and `python3 -m py_compile proxy/nexus_proxy.py`. |
| `tests/node-mode-tests.js` | Verifies the root CommonJS sentinel has no dependencies/scripts so parent `type:module` package files cannot poison Fedora/local test runs. |
| `tests/syntax-check.js` | Walks the tree from archive root recursively; checks all classic and module inline scripts in HTML and shared JS files. |
| `tests/catalog-paths-tests.js` | Static check that every catalog entry is either present or explicitly disabled. |
| `tests/local-script-refs-tests.js` | Static check that every local `<script src>` in `Nexus_OS.html` and `blocks/**/*.html` resolves inside the archive. |
| `tests/sandbox-policy-tests.js` | Guards managed iframe downloads and NexusBlockClient mount-safe emit queuing. |
| `tests/subscription-burst-tests.js` | Guards the Sweep 8 kernel policy: valid declared SUB bursts from large service blocks do not count as control-rate abuse, but undeclared SUBs still violate. |
| `tests/wallet-handshake-tests.js` | Guards Wallet v4 managed-mode catalog status and early BOOT-listener installation before async wallet hydration. |
| `tests/block-contract-tests.js` | Static analyzer for kernel-contract bugs: block-side `MSG`, missing PONG nonce, undeclared emits. |
| `tests/companion-block-tests.js` | Companion block managed-mode and canvas-export contract checks. |
| `tests/verse-block-tests.js` | Verse Studio bootstrap/bridge contract checks around the opaque module bundle. |
| `tests/breed-engine-tests.js` | Breed engine unit tests. |
| `tests/battle-engine-tests.js` | Battle engine unit tests with PHANTIVEX-exact assertions. |
| `tests/router-battle-tests.js` | Router battle shell canonical-engine checks. |
| `tests/os-battle-tests.js` | OS local battle shell canonical-engine checks. |
| `tests/cross-block-tests.js` | Router-vs-OS battle outcome consistency checks. |
| `tests/palette-tests.js` | Cmd/Ctrl-K command palette tests. |
| `tests/eventlog-tests.js` | Cmd/Ctrl-E cross-block event log overlay tests. |
| `tests/system-health-tests.js` | `system.health` kernel tick tests. |
| `tests/undo-tests.js` | Manifest `undoable`, kernel undo-affordance, and compensation-envelope tests. |
| `tests/deadletter-tests.js` | Kernel dead-letter capture, requeue, and discard tests. |
| `tests/roadmap-status-tests.js` | Guards the Sweep 6 roadmap/stub audit document so future sweeps do not lose the triage board. |
| `tests/battle-protocol-tests.js` | Battle protocol commit-reveal tests. |
| `tests/slot-economy-tests.js` | Slot consumption tests. |
| `tests/battle-stakes-tests.js` | Ranked battle staking tests. |
| `tests/witness-tests.js` | Witness selection + quorum tests. |
| `tests/imprint-tests.js` | Imprint descendant generation tests. |
| `tests/tools-tests.js` | Guards the standard-library tools and `docs/CHANNEL_ATLAS.md` freshness. |
| `tests/protocol-harness.js` | Node VM harness simulating the kernel. Largest test surface. Loads HTML blocks by full path. Vibes Library helper waits for `system.block_ready` and mocks `fs.status`; do not replace that with a fixed sleep. |

Current passing baseline after boot calibration (2026-05-09): **473 passes, 0 fails** across thirty-two summary groups:

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

Older baselines were 285/0 during the 2026-05-07 calibration sweeps, 374/0 after Sweep 8 stability hardening, 393/0 after Sweep 10 intake, 399/0 after Sweep H, 415/0 after Sweep I/J, and 459/0 after Sweep 13. Treat those as historical only; rely on the latest `tests/run.sh` output for current pass counts.


#### Tools

| Path | Role |
|---|---|
| `tools/block-inspect.js` | Per-block analyzer for manifest, static emit/subscribe call sites, classification, line count, and drift signals. Useful before hand-rolled → shared-client migrations. |
| `tools/channel-atlas.js` | Generates `docs/CHANNEL_ATLAS.md` from block manifests; `--check` is guarded by `tests/tools-tests.js`. |
| `tools/spec-audit.js` | Scans markdown specs for referenced paths that do not exist and for LANDMINE numbers beyond the current doc. Candidate surfacer, not proof. |

#### Data

| Path | Role |
|---|---|
| `realms/realm_genesis_0.json` | Reference copy of the genesis realm charter. **The actual data is inlined as `BUILTIN_REALM_GENESIS_0` in `blocks/vibes/vibes-library.html`.** This file is not loaded at runtime; it exists for human inspection and as a future-feature hook for filesystem-loaded charters. |

#### Runtime support

| Path | Role |
|---|---|
| `proxy/nexus_proxy.py` | Local HTTP API gateway for LLM provider calls. Standalone Python, no deps. Port 8787 default with fallback to 8788–8802. |

---


## Current protocol-surface map (2026-05-09 boot calibration)

This map was refreshed from `tools/block-inspect.js` during the documentation-only boot calibration. It exists because handshake bugs are still the fastest way to create a block that boots to `LOADING` forever.

| Bucket | Count | Files | Notes |
|---|---:|---|---|
| Client-backed | 26 | `blocks/apps/app-about.html`, `blocks/apps/app-files.html`, `blocks/apps/app-notepad.html`, `blocks/apps/app-reader.html`, `blocks/apps/app-terminal.html`, `blocks/apps/companion.html`, `blocks/apps/nexus-webviewer.html`, `blocks/apps/verse-studio.html`, `blocks/eidolon/eidolon-router.html`, `blocks/forges/compose-stage.html`, `blocks/forges/environment-forge.html`, `blocks/forges/forge-nexus-template.html`, `blocks/forges/i-was-wrong.html`, `blocks/forges/lattice-shell.html`, `blocks/social/Nexus Channels v0.02.html`, `blocks/system/block-hash.html`, `blocks/system/mission-control.html`, `blocks/system/nexus-db.html`, `blocks/system/welcome.html`, `blocks/vibes/kin-forge.html`, `blocks/vibes/vibes-arena.html`, `blocks/vibes/vibes-crucible.html`, `blocks/vibes/vibes-library.html`, `blocks/world/atlas.html`, `blocks/world/first-contact.html`, `blocks/world/nexus-witness.html` | These use `engines/nexus-block-client.js`. |
| Hand-rolled | 8 | `blocks/apps/drift.html`, `blocks/forges/iww-nexus-guide.html`, `blocks/forges/the-room.html`, `blocks/social/Nexus Forums v0.02.html`, `blocks/social/Nexus Social v0.02.html`, `blocks/system/Wallet_v4_nexus.html`, `blocks/system/block-doctor.html`, `blocks/system/nexus-genesis-verifier.html` | Highest-risk protocol-edit surfaces. Wallet remains hand-rolled because wallet-specific response semantics are not a generic shared-client fit yet. |
| Kernel-host | 1 | `blocks/eidolon/eidolon-os.html` | Nested kernel/special case; do not treat its internal message traffic as ordinary block IPC drift. |

Practical migration order after boot calibration: easy utilities (`drift`, `block-doctor`, `nexus-genesis-verifier`) first, then social big blocks (`Nexus Forums`, `Nexus Social`), then special surfaces (`the-room`, `Wallet_v4_nexus.html`, `eidolon-os.html`).

## Runtime dependency surface (2026-05-09 boot calibration)

The archive has a tiny root `package.json` sentinel (`type: commonjs`, no scripts, no dependencies) so parent folders cannot poison Node test mode. There is still no npm dependency tree and no build step. Runtime dependencies are plain browser primitives plus a few explicit CDN/import surfaces:

| Surface | Current state | Risk notes |
|---|---|---|
| Local script refs | 39 local `<script src>` references across block HTML files, all resolving inside the archive. | Guarded by `tests/local-script-refs-tests.js`. Syntax checks alone do **not** prove these paths resolve. |
| Shared client imports | 26 block files load `../../engines/nexus-block-client.js`. | Keep depth uniform; every current block is at `blocks/<category>/<file>.html`. |
| Deterministic engines | `substrate`, `battle`, `battle-protocol`, `breed`, `witness-selection`, `eidolon-generator`. | Engine changes may require epoch / engine-hash / realm updates. See `LANDMINES.md`. |
| CDN crypto/Nostr modules | `esm.sh` imports for noble secp256k1 and scure BIP32/BIP39 in social/genesis/vibes surfaces. | These are intentional browser-time imports, not npm deps. Avoid expanding them incidentally. |
| Fonts / embedded web URLs | Google Fonts and webviewer presets. | UI convenience only; should not become core boot dependencies. |
| Optional local proxy | `proxy/nexus_proxy.py`, port 8787 with fallback. | Only needed for blocks that call LLM APIs; core platform must boot without it. |
| Tooling layer | `tools/block-inspect.js`, `tools/channel-atlas.js`, `tools/spec-audit.js`. | Standard-library Node only; they inspect/generate docs but do not become runtime dependencies. |

Practical rule: when moving any HTML block or engine file, run `bash tests/run.sh` and confirm the `SCRIPT-REF SUMMARY` stays green before packaging.

## Naming inconsistencies (still open after Round 019)

Three files still use Title Case With Spaces and dotted version numbers:

- `blocks/social/Nexus Social v0.02.html`
- `blocks/social/Nexus Channels v0.02.html`
- `blocks/social/Nexus Forums v0.02.html`

They have not broken the harness because every current reference is correctly quoted and `tests/catalog-paths-tests.js` covers catalog drift. They are still fragile for shells, URLs, and future tools. Rename only in an explicit atomic sweep that updates `Nexus_OS.html`, tests, docs, and any cross-block launch payloads.

Other inconsistencies to defer unless explicitly scoped:
- `Wallet_v4_nexus.html` — Mixed_snake_versioned, lives in `blocks/system/`.
- `Nexus_OS.html` at root — user-facing kernel entry; renaming could surprise muscle memory.
- `CRITICIAL AI INSTRUCTIONS README.md` — misspelling is canonical; see `LANDMINES.md` #12.

## Catalog drift automation

`Nexus_OS.html` contains `BUILTIN_CATALOG` and `LEGACY_CATALOG` arrays registering every launcher entry. `tests/catalog-paths-tests.js` is now wired into `tests/run.sh` and fails if an active catalog path is missing or if a disabled entry unexpectedly points at a present file.

Current placeholder entries with `disabled:true reason:"file missing from archive"` or external-file reasons are intentional future-feature graveyard items. Do not resurrect, delete, or rename them incidentally; handle them in a dedicated catalog-cleanup sweep. Sweep 6 records the ranked triage in `docs/ROADMAP_STATUS.md`, with catalog cleanup as R-003.


## Sweep H OS communication layer (2026-05-09)

`Nexus_OS.html` now includes an OS-shell-resident notification center called `nx-notifications`. It is not a block and it does not participate in the managed-block lifecycle. It sits beside the kernel shell and consumes selected cross-block channels before ordinary dead-letter accounting.

### New shell surfaces

- Fixed stacked toast host: `#nx-notifications`.
- Right-rail history drawer: `#nx-notification-drawer`.
- Taskbar live chrome additions, ordered after open windows: pending pip, notification bell, witness chip, epoch indicator, realm indicator, NEX chip, folder chip, console, clock. The folder chip remains for existing mount-folder UX, so the exact H order is preserved for the new communication elements while retaining the older filesystem affordance.

### Channel consumption behavior

`deliverMessage()` now calls `Notifications.consumeChannel(channel, payload, srcId)` before checking block subscribers. If the shell handles a notification channel and no mounted block subscribes, no dead letter is recorded. Unknown channels retain the old dead-letter behavior.

### New/updated files

- `docs/MOTION.md` — canonical motion-language reference.
- `engines/nexus-tokens.css` — reference seed for future shared token extraction; not yet a runtime dependency.
- `tests/notification-center-tests.js` — focused VM coverage for storage key, balance notifications, pending transitions, shell-consumed dead-letter avoidance, and palette clear command.

### Test baseline

Current full harness after Sweep H: **399 passes / 0 fails**.


## Sweep I/J orientation addendum — Player Thread + Wallet/Genesis beauty

`Nexus_OS.html` now owns two OS-resident always-on services: `nx-notifications` and `nx-player-thread`. The Player Thread service is not a block. It records local UX milestones, resolves one current recommendation, renders `#nx-thread-chip`, optionally renders `#nx-thread-nudge`, and routes through existing catalog targets with fallbacks.

New doc: `docs/PLAYER_THREAD.md`. New test: `tests/player-thread-tests.js`. Current full harness: **415 passes / 0 fails**. `node tools/channel-atlas.js --check` remains clean because the thread service consumes existing channel names from the shell instead of introducing new block manifests.

Presentation upgrades landed in `blocks/system/Wallet_v4_nexus.html` and `blocks/system/nexus-genesis-verifier.html`. Treat those as UI polish only; protocol rules are unchanged.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

### New active surfaces

- `blocks/world/first-contact.html` — managed live companion/world chooser. Emits `system.environment.selected`, `lattice.imprint`, `lattice.library.changed`, `nexus.notify`, `nexus.launch`.
- `blocks/forges/environment-forge.html` — managed world randomizer / desktop background setter.
- `blocks/forges/lattice-shell.html` — managed creature randomizer / imprint bridge.
- `blocks/forges/compose-stage.html` — managed battle forge router to the existing `the-room` generator and related surfaces.
- `blocks/system/welcome.html` — managed repair shim for the old welcome path.

### Runtime orientation

The OS shell now stores and applies the selected world via `nexus:selected-environment:v1`. Companion also reads `nexus:selected-companion:v1`. Atlas has an `atlas:worlds:fallback:v1` local store when `vibe.list` is unavailable.

### Verification

- `bash tests/run.sh` → **459 passes / 0 fails**
- `node tools/channel-atlas.js --check` → green

## Sweep 14 — Control, persistence, and one-wallet clarity

- Baseline after implementation: `bash tests/run.sh` reports 473 passes / 0 fails.
- First Contact now writes real `vibe.save` envelopes for the accepted companion/world when Vibes Library is awake, while also mirroring the world into Atlas local fallback storage.
- Environment Forge now has human presets, Library save, Atlas fallback mirroring, and desktop background preview/finalization.
- Compose Stage is now a three-step ingredient flow: Companion → World → The Room. It routes to existing legacy forge tools only.
- Desktop Home Notes stores local notes under `nexus:home-notes:v1` and sends a one-shot inbox item to Companion at `nexus:home-note-inbox:v1`. Companion imports that as a movable note and clears the inbox.
- Wallet copy now emphasizes one wallet / one visible NEX balance. UTXOs are labeled as proof outputs, not separate balances.
- Delete/Backspace shielding was broadened for focused text inputs to reduce Chromium shortcut prompts during searches/typing.
---

## 2026-05-09 boot calibration note: exact-case maintenance aliases

The uploaded archive already carried the required living docs, but most canonical docs live under `docs/` and use lowercase `.md`. This boot round added root-level exact-case aliases so future AI instances or scripts that check the user contract literally can find:

- `CODEBASE_ORIENTATION.MD` → `docs/CODEBASE_ORIENTATION.md`
- `README.MD` → `README.md`
- `FREEDOM_REASONING_LOG.MD` → `docs/FREEDOM_REASONING_LOG.md`
- `HANDY_CODE_SNIPPETS.MD` → `docs/HANDY_CODE_SNIPPETS.md`
- `HANDY_LESSONS.MD` → `docs/HANDY_LESSONS.md`
- `LANDMINES.MD` → `docs/LANDMINES.md`
- `AI_CODEBASE_HANDOFF.MD` → `AI_CODEBASE_HANDOFF.md`

Treat these as pointers, not forks. Canonical content remains in the pre-existing files above.

## Eidolon forge preservation addendum — 2026-05-09

The operator supplied four recovered original Eidolon forge files and identified them as the intended feel for creature/world/battle creation. They were added back to the archive without wiring them into runtime catalog entries:

```
legacy/
  eidolon-forges/
    README.md
    eidolon-forge.html
    eidolon-environment-forge.html
    eidolon-multiforge.html
    eidolon-battleforge.html
```

Status: **preserved reference / UX canon**, not active Nexus blocks. Their scripts are still covered by the recursive syntax harness because they are `.html` files inside the repo. Do not remove or “simplify” them. Use `docs/EIDOLON_FORGE_CANON.md` as the integration brief for future UX sweeps.

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

## Sweep 17 — Wallet tab · Accept one-time · Green dot label · FC layout (current)

Sweep 16 adds the first-hour onboarding layer over Living Forge OS: active Nexus-native Multiforge, clearer First Contact outcome copy, companion first-time callout, visible Home Notes → Companion handoff, Wallet zero-start explanation, Web Viewer empty/blocked/disabled states, and Player Thread v2 guidance. Runtime scope remains UX/UI only; wallet canon remains one visible NEX balance starting at 0.

## Orientation Update — Eidolin Maker/Player Diagnostic (2026-05-17)

For Pokémon-style maker/player planning, current Eidolin should be understood as a Canvas 2D procedural side-scrolling runtime with deterministic world/creature generation and manifestation encounters. Authorable tile maps, tile assets, NPCs, dialogue, collision, and declarative triggers are not present as first-class systems. Full diagnostic: `docs/EIDOLIN_GAME_MAKER_DIAGNOSTIC.md`.


---

## Sweep 4 calibration note — Pokémon maker diagnostic pass 2 (2026-05-17)

Created `docs/POKEMON_MAKER_SECOND_DIAGNOSTIC.md` because the second diagnostic pass is load-bearing for future architecture. Findings: managed blocks require BOOT → DECLARE → MOUNT_CHALLENGE → MOUNT_ACK → MOUNTED; peer traffic normally routes through the kernel except router-brokered BroadcastChannel streams; NexusDB schema can be extended only through a DB_VERSION bump in `blocks/system/nexus-db.html`; large maps should use IndexedDB chunks, not bus-sized blobs; asset manifest loading is only a seam; Nostr 304xx kinds are informal; standalone Canvas + IndexedDB blocks are feasible without wallet/Nostr.

---

## Pokémon Game Maker/Player — added 2026-05-17

### New engine files

| File | Status | Notes |
|---|---|---|
| `engines/pokemon-engine.js` | Active | Pure JS RPG engine library. TileCamera, TileRenderer, SpriteAtlas, CollisionMap, InputManager, AudioEngine, DialogueEngine, EventExecutor, ProjectValidator, ProjectFormat. Zero Nexus/Nostr/wallet dependency. |

### New test files

| File | Status | Notes |
|---|---|---|
| `tests/pokemon-engine-tests.js` | Active | 43 headless Node.js tests. All passing. Added to tests/run.sh. |

### New HTML files

| File | Status | Notes |
|---|---|---|
| `pokemon-engine-test.html` | Active test harness | Standalone tile game demo. Open by double-click. Generates all assets procedurally. |

### New doc files

| File | Status | Notes |
|---|---|---|
| `docs/POKEMON_MAKER_ARCHITECTURE_SPEC_v3.md` | Active | Final architecture spec. Five rounds of adversarial review. Build against this. |
| `docs/POKEMON_MAKER_SESSION_GUIDE.md` | Active | All session prompts for continuing the build. |
| `docs/POKEMON_MAKER_SECOND_DIAGNOSTIC.md` | Active | Second codebase diagnostic results. |
| `docs/EIDOLIN_GAME_MAKER_DIAGNOSTIC.md` | Active | First codebase diagnostic results. |

### Blocks to be built (not yet created)

| File | Purpose |
|---|---|
| `blocks/pokemon-player.html` | Nexus managed block — plays games loaded from IndexedDB |
| `blocks/pokemon-maker.html` | Nexus managed block — map editor, DNA creature editor, event placer |
| `blocks/pokemon-publish.html` | Nexus managed block — Nostr publishing and discovery (optional, built last) |

### DB schema changes pending

`blocks/system/nexus-db.html` needs DB_VERSION bumped 1→2 with four new stores:
- `pokemon_drafts` (keyPath: id)
- `pokemon_projects` (keyPath: manifestHash)
- `pokemon_assets` (keyPath: assetHash)
- `pokemon_saves` (keyPath: id)

Migration must be strictly additive. Pattern in `docs/HANDY_CODE_SNIPPETS.md`.

