# README.MD

## Current state overlay — 2026-05-17

- Source archive for this continuation: `Nexus_Current_calibration_round_1_docs.zip`, derived from uploaded `Nexus Current.zip` → working root `Nexus Current/Nexus_Gold_sweep26_final(1) OPUS (2)/sweep26_working/`.
- Apparent latest authored sweep in existing logs remains **Sweep 26 — Distributed compute substrate · worker pool · stream router · render demo**.
- This round performed one surgical functional repair plus documentation updates.
- Functional repair: `blocks/nexus-lattice(1).html` and root duplicate `nexus-lattice(1).html` changed the hand-rolled Lattice bridge emit envelope from block-side `type:"MSG"` to kernel-accepted `type:"EMIT"`.
- Rationale: `MSG` is kernel-to-block delivery; block-origin publish traffic must use `EMIT` after `MOUNTED` and only on declared manifest channels.
- `node tools/channel-atlas.js --check` passes; `docs/CHANNEL_ATLAS.md` remains current at **80 channels across 49 blocks**.
- `bash tests/run.sh` now passes: **674 passes / 0 fails across 35 summary groups**. Contract suite is **141 / 0**.
- No new `.MD` file was created.

Exact-case boot-contract document for AI instances/scripts that check the operator-required filenames literally.

**Canonical file:** [`README.md`](./README.md)  
**Role:** Human entry point and boot instructions.

## Boot-calibrated snapshot — 2026-05-09 (post Sweep 16)

- Source archive: `Nexus_Moot_v1_4_post_sweep_16_first_hour_onboarding_1_.zip`.
- Latest sweep: **Sweep 16 — First Hour UX** (UX/UI only; no wallet/economy/battle math changed).
- Verified harness: `bash tests/run.sh` = **544 passes / 0 fails**.
- Generated channel atlas check: `node tools/channel-atlas.js --check` = up to date.
- Channel atlas stats: **67 channels across 36 blocks**.
- Local script references: **62** resolving local `<script src>` imports.
- Economy canon: player-facing wallet starts at **0 NEX**; no onboarding/task/genesis auto-grant.
- UX canon: First Contact → Multiforge → accept → animated desktop world + companion bottom-left. Home Notes handoff visible. Wallet explains zero-start. Web Viewer has empty/blocked/disabled states. Player Thread v2 first-hour guidance sequence active.

## Editing rule

Keep the detailed, canonical content in the linked `.md` file above. This exact-case file is now a calibrated boot index, not an independent fork of the full document. If material facts change, update both the canonical file and this snapshot line set in the same sweep.

## Eidolon forge preservation addendum — 2026-05-09

Four recovered original Eidolon forge files have been restored under `legacy/eidolon-forges/` and documented in `docs/EIDOLON_FORGE_CANON.md`:

- `eidolon-forge.html`
- `eidolon-environment-forge.html`
- `eidolon-multiforge.html`
- `eidolon-battleforge.html`

They are preserved UX canon, not active launcher integrations yet. Future AI instances must read `docs/EIDOLON_FORGE_CANON.md` before editing First Contact, Companion, Environment Forge, Compose Stage, The Room, Atlas, Library, or battle creation UX.

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
