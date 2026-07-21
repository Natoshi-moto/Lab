# ROADMAP_STATUS

Sweep 6 audit of visible stubs, deferred work, roadmap markers, and protocol scaffolding. This file is the canonical triage board for autonomous future sweeps: do not treat scattered `future`, `stub`, `placeholder`, or `disabled:true` comments as equally important until this board is updated.

Audit date: 2026-05-08  
Input baseline: Sweep 5 archive, `354 pass / 0 fail`  
Latest verified baseline: boot-calibrated archive, `473 pass / 0 fail`  
Output policy: roadmap/doc/test only in Sweep 6; later sweeps update this board as work lands. Boot calibration refreshed the headline baseline and known shipped states without changing runtime code.

---

## Audit method

The audit scanned the archive for these classes of marker:

- explicit code/doc markers: `TODO`, `FIXME`, `TBD`, `stub`, `placeholder`, `future`, `deferred`, `later sweep`, `not implemented`, `not built`, `out of scope`
- catalog graveyard entries: `disabled:true` plus missing-file or external-file reasons
- protocol scaffolding added by recent sweeps: channels, undo affordances, dead letters, health ticks, and block integration surfaces
- visible UI placeholders that a user can see, not internal domain words like `creature-stub/1`

Intentionally ignored false positives:

- HTML `placeholder="..."` attributes in inputs and textareas
- domain objects named `creature-stub/1`, because those are shipped Vibes data types, not unfinished code
- historical round-log text that describes already-fixed issues
- the opaque Verse Studio React bundle body; Nexus owns only the injected bootstrap contract

---

## 2026-05-09 boot calibration status overlay

- Sweep H notification center and live OS chrome are shipped.
- Player Thread guidance is shipped.
- First Contact, Environment Forge, Lattice Shell, Compose Stage, and Welcome exist as active files; do not keep treating their missing-path issues as open.
- Wallet v4 is the canonical player wallet surface and starts at 0 NEX.
- Atlas has a local fallback when Vibes Library is not mounted.
- Remaining high-value cleanup: disabled catalog graveyard, hand-rolled protocol unification, stronger Atlas live sampling, richer battle forge composition UX, and operator diagnostics.

## Ranked backlog

### R-001 — Add a system dashboard / block inspector

**Status:** Not complete.  
**Source markers:** Sweep 4 published `system.health`; Sweep 5 added dead letters and undo state; no block consumes `system.health` yet.  
**Why it matters:** The OS now has enough kernel telemetry to deserve a first-class operator surface instead of scattered overlays.  
**Suggested next sweep:** Add a small managed system block or OS panel that shows mounted blocks, manifests, emits/consumes/undoable channels, recent dead letters, recent eventlog lines, storage persisted state, uptime, and block count.  
**Blast radius:** Prefer a new block or additive OS panel. Do not replace taskbar, launcher, console, palette, eventlog, or dead-letter panel.  
**Tests to add:** dashboard mounts; receives or reads health payload; lists Companion and Verse manifests; shows dead-letter count.

### R-002 — Make Verse canvas-import undo real or mark it explicitly as protocol-only

**Status:** Protocol scaffold shipped, reversal not complete.  
**Source markers:** `blocks/apps/verse-studio.html` consumes `companion.canvas.export.undo`; `docs/HANDY_LESSONS.md` entries 24–25 say actual reversal is deferred.  
**Why it matters:** The eventlog undo button is honest protocol plumbing, but users will eventually expect the imported canvas to disappear or be rolled back.  
**Suggested sweep:** Decide one of two paths: upstream Verse exposes a reversible import API, or Nexus labels this action as `request undo` rather than real undo until Verse can reverse it.  
**Blast radius:** Do not modify the Verse React bundle unless the source/build artifact is intentionally supplied for a Verse-side release.  
**Tests to add:** undo acknowledgement stays correlated by `_reqId`; UI text distinguishes real undo from request-only undo when no concrete reversal exists.

### R-003 — Catalog graveyard cleanup

**Status:** Not complete.  
**Source markers:** `Nexus_OS.html` contains 7 disabled catalog entries: `sim`, `messages`, `verse`, `nexus`, `gemini`, `multiforge`, `console`, `phantivex`. Sweep 13 resurrected `battleforge` through `blocks/forges/the-room.html` and `envforge` through `blocks/forges/environment-forge.html`. `README.md` names catalog graveyard cleanup as a future round.  
**Why it matters:** Disabled launcher entries are useful memory, but they keep old paths and old product names alive indefinitely.  
**Suggested sweep:** Move the graveyard inventory into a dedicated `docs/PLANNED_BLOCKS.md` or delete/resurrect entries one by one. Verse is now present as `blocks/apps/verse-studio.html`, so the old external `VERSE Studio` disabled entry needs a deliberate decision.  
**Blast radius:** `Nexus_OS.html`, catalog tests, docs only.  
**Tests to add:** active catalog paths still exist; planned block entries in docs match disabled entries if any remain.

### R-004 — Finish handshake unification for remaining hand-rolled blocks

**Status:** In progress. Sweep 8 fixed Wallet v4's managed BOOT timing and removed its legacy catalog flag; other hand-rolled blocks remain.  
**Source markers:** `docs/CODEBASE_ORIENTATION.md` protocol-surface map still lists hand-rolled blocks. Current scan still finds custom handshake code in `drift.html`, `eidolon-os.html`, `the-room.html`, `Nexus Forums v0.02.html`, `Nexus Social v0.02.html`, and `block-doctor.html`; `nexus-genesis-verifier.html` needs a separate classification pass.  
**Why it matters:** Shared-client adoption reduces protocol bugs when the kernel evolves.  
**Suggested order:** easy utility blocks first (`drift`, `block-doctor`, `nexus-genesis-verifier`), then social blocks, then `the-room`, then special cases (`eidolon-os`). Wallet v4 is now managed but still custom because wallet-specific response semantics are not a generic shared-client fit yet.  
**Blast radius:** One or two blocks per sweep. Preserve standalone behavior.  
**Tests to add:** per-block manifest/handshake assertions mirroring Companion/Verse block tests.

### R-005 — Atlas Round 2: live tile sampling and palette generator wiring

**Status:** Visible placeholder in shipped UI.  
**Source markers:** `blocks/world/atlas.html` contains a `Round 2` future block for live tile sampling and notes that palette identifiers are currently saved as strings. `docs/legacy/ATLAS-HANDOFF.md` has a Round 2 brief.  
**Why it matters:** Atlas is the world-authoring surface; live deterministic preview is the shortest path from form fields to visible world meaning.  
**Suggested sweep:** Use `engines/substrate.js` without modifying it. Render a small preview grid inside Atlas from seed/dimensions/density. Treat palette-generator vibes as a later enhancement unless the hardcoded path is trivial.  
**Blast radius:** `blocks/world/atlas.html` plus focused tests. Do not touch `engines/substrate.js` unless explicitly doing an epoch-aware substrate migration.  
**Tests to add:** preview node exists; same seed renders stable sampled tile data; changing seed changes preview.

### R-006 — Atlas Round 3: witnessed moots and bundle-for-release

**Status:** Visible placeholder in shipped UI.  
**Source markers:** Atlas right pane says witnessed moots will collect later; Bundle for release button is disabled; `docs/legacy/ATLAS-HANDOFF.md` has a Round 3 brief and an open season-vs-single-world question.  
**Why it matters:** This turns Atlas from an authoring form into a playable/world-release path.  
**Suggested sweep:** Defer until R-005 ships. Start with single-world release manifest; preserve room for seasons later.  
**Blast radius:** Atlas, Vibes Library import/export, possible witness block interplay.  
**Tests to add:** bundle manifest shape; disabled button becomes enabled only when required world data exists.

### R-007 — Community-block sandbox Option C

**Status:** Designed, not implemented.  
**Source markers:** `docs/COMMUNITY_BLOCKS_DESIGN.md` recommends a two-tier trust model but explicitly says it is not a roadmap. `docs/SANDBOX.md` warns against overstating current isolation.  
**Why it matters:** The current host model is appropriate for self blocks, not hostile community code.  
**Suggested sweep:** Only start after a user-visible install/community-block story is actually needed. Design a syscall-mediated tier rather than promoting arbitrary HTML into the self-trusted catalog.  
**Blast radius:** Kernel spawn policy, catalog schema, docs, tests. High risk.  
**Tests to add:** self-trusted blocks keep current powers; community-tier blocks receive only explicit syscalls.

### R-008 — Battle protocol timestamp deferrals

**Status:** Deliberately deferred.  
**Source markers:** `docs/BATTLE_ENGINE_PARITY.md` marks several `battle-protocol.js` timestamps as `DEFERRED — protocol message ts`; `docs/LANDMINES.md` references this decision.  
**Why it matters:** Some timestamps are message/display metadata, not deterministic battle math. They should remain consciously classified, not accidentally drift into content-addressed material.  
**Suggested sweep:** Do not touch unless ranked battle protocol or Nostr receipt semantics are being redesigned.  
**Blast radius:** `engines/battle-protocol.js`, tests, docs. Avoid unless necessary.

### R-009 — Rename fragile social filenames with spaces

**Status:** Not complete.  
**Source markers:** `docs/LANDMINES.md` #13 and `docs/CODEBASE_ORIENTATION.md` naming-inconsistency section.  
**Why it matters:** The harness currently quotes paths correctly, but filenames with spaces and dotted versions are fragile for shell scripts, URLs, and future tools.  
**Suggested sweep:** Rename the three social files to kebab-case in one atomic sweep and update catalog/docs/tests.  
**Blast radius:** Paths only, but high manual-test importance.  
**Tests to add:** catalog and script-reference summaries should catch most drift.

### R-010 — Vibes polish: Arena export renderer + Library rename UI

**Status:** Future polish.  
**Source markers:** `docs/VIBES-RUNBOOK.md` mentions PHANTIVEX renderer parity for Arena export and lack of rename UI for imported vibes. `docs/legacy/EIDOLON-HANDOFF.md` also calls rename UI a known limitation.  
**Why it matters:** These are user-facing quality improvements, not structural blockers.  
**Suggested sweep:** Do after protocol/kernel tasks stabilize. Keep deterministic storage rules intact: no rendered image storage.  
**Blast radius:** Vibes Library and/or Arena only.

### R-011 — Forges adapter graduation

**Status:** Partly done — `blocks/forges/eidolon-forge.html` graduated in Sweep 20.  
**Sweep 20 note:** The new `eidolon-forge.html` (36-axis creature forge) is a fully managed block with native `vibe.save`/`vibe.load`/`vibe.list`/`vibe.delete` — no adapter needed. It's in `BUILTIN_CATALOG` as `id:"eidolon-forge"`.  
**Remaining:** Other legacy forges (`the-room`, `i-was-wrong`, `iww-nexus-guide`, `forge-nexus-template`) still hand-rolled or standalone. Graduate one at a time as scope allows.  
**Source markers:** `docs/VIBES-RUNBOOK.md` Step 6; `engines/vibe-adapter.js` still the graduation shim for forges that need it.  
**Blast radius:** Individual forge file plus local-script-ref tests.

### R-012 — Meta-tag auto-promotion of managed blocks

**Status:** Seed idea only; security-gated.  
**Source markers:** `docs/nexus-os-patch.md` and `docs/legacy/ATLAS-HANDOFF.md` mention reading `<meta name="nexus-block" content="managed">` to avoid explicit catalog entries.  
**Why it matters:** It is attractive for sovereignty, but unsafe if any arbitrary HTML can self-promote.  
**Suggested sweep:** Do not implement before R-007 community-block trust tier work.  
**Blast radius:** Kernel catalog/install logic and sandbox policy.

### R-013 — Codex / lineage browse view

**Status:** Future concept, not built.  
**Source markers:** `docs/legacy/EIDOLON-HANDOFF.md` names Codex as future; `docs/legacy/ATLAS-HANDOFF.md` asks whether Atlas subsumes it.  
**Why it matters:** Could become the browse/read side of the world/creature lineage system.  
**Suggested sweep:** Decide product shape after Atlas Rounds 2–3 and Mission Control lineage experience.  
**Blast radius:** Likely new block or extension to Atlas/Mission Control.

---

## Current recommendation

Next implementation sweep should be **R-001: system dashboard / block inspector**.

Reason: it consumes telemetry already added in Sweeps 4–5, improves operator trust, and does not require touching deterministic engines, Verse internals, or visible Atlas placeholders. It also gives future sweeps a better place to observe block manifests, dead letters, health, and undoable channels while the platform grows.

---

## False positives / not-work items

These were seen during the scan but should not be treated as unfinished roadmap work:

- `creature-stub/1` and related foreign-stub tests: shipped domain feature, not a missing implementation.
- Form placeholders like `placeholder="Search apps…"`: normal UI hints.
- Historical round-log mentions of already-fixed issues: useful context, not active backlog.
- `docs/COMMUNITY_BLOCKS_DESIGN.md` explicitly says it is not itself a roadmap; it becomes actionable only when community installs become a committed product direction.

---

## Maintenance rule

When a future sweep completes one of the ranked items, update this file in the same sweep:

1. mark the item complete or split remaining work into a smaller item;
2. update any source markers that are no longer true;
3. update or remove tests that intentionally guard this audit document;
4. keep the full harness green before packaging.

---

## Sweep 7 hotfix note — browser/Fedora smoke findings

Status: closed in hotfix archive. Companion canvas export needed managed iframe `allow-downloads`; Verse needed mount-safe emit queuing; Fedora tests needed a local CommonJS sentinel to avoid parent `package.json` drift. These were treated as stability fixes ahead of the next roadmap feature.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

Catalog graveyard count is now **7 disabled catalog entries** after `battleforge` and `envforge` were resurrected through real in-archive surfaces.

## Sweep 14 — Control, persistence, and one-wallet clarity

- Baseline after implementation: `bash tests/run.sh` reports 473 passes / 0 fails.
- First Contact now writes real `vibe.save` envelopes for the accepted companion/world when Vibes Library is awake, while also mirroring the world into Atlas local fallback storage.
- Environment Forge now has human presets, Library save, Atlas fallback mirroring, and desktop background preview/finalization.
- Compose Stage is now a three-step ingredient flow: Companion → World → The Room. It routes to existing legacy forge tools only.
- Desktop Home Notes stores local notes under `nexus:home-notes:v1` and sends a one-shot inbox item to Companion at `nexus:home-note-inbox:v1`. Companion imports that as a movable note and clears the inbox.
- Wallet copy now emphasizes one wallet / one visible NEX balance. UTXOs are labeled as proof outputs, not separate balances.
- Delete/Backspace shielding was broadened for focused text inputs to reduce Chromium shortcut prompts during searches/typing.

## UX canon recovery: Eidolon forges

Recovered source material now lives in `legacy/eidolon-forges/` with an integration brief at `docs/EIDOLON_FORGE_CANON.md`. Next UX/debug sweeps should prioritize adapting this feel into active Nexus surfaces:

1. First Contact = live creature/world randomizer with locks and animated previews.
2. Companion = selected creature rendered and animated on the OS surface.
3. Desktop = selected environment rendered/animated as the world background.
4. Compose Stage = Battleforge-style phase/grid/scrub creator, not a static router.
5. Library/Atlas = template/spec storage around player-authored forge outputs.

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
