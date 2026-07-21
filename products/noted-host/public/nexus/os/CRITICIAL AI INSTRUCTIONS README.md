# CRITICIAL AI INSTRUCTIONS README

## Purpose

This codebase is maintained round-by-round from the uploaded archive. The active task is to keep the files current, apply scoped edits only, and deliver the latest complete archive after each round.

## Operating Rules

- Work only inside this codebase.
- Perform surgical code edits, file renames/reorganization, scoped debugging, minor coding tasks, and precise technical documentation only.
- Do not expand scope beyond the user's current task.
- Do not ask for clarification when a best-effort scoped change can be made.
- Treat missing context as non-blocking unless it prevents safe file modification.
- Preserve existing structure unless the requested task requires reorganization.
- Deliver an updated `.zip` every round.

## Round Log

### Round 001 — Ingestion / Bootstrap

**What changed**

- Created this `CRITICIAL AI INSTRUCTIONS README.md` at the codebase root.
- No application code was modified.

**How it was changed**

- Extracted the uploaded `Nexus_Moot.zip` archive.
- Inspected the top-level file tree for an existing critical instructions README.
- Added this README because no matching file was present.
- Repacked the complete codebase into a fresh delivery archive.

**Why it was changed**

- The project requires a persistent AI-maintenance instruction file and a round-by-round work log.
- This bootstrap entry establishes the maintenance contract without changing runtime behavior.

### Round 002 — Codebase Knowledge Report

**What changed**

- Added this Round 002 log entry.
- No runtime/application code was modified.
- Generated a codebase ground-truth and architecture-analysis report for the orchestrator.

**How it was changed**

- Inspected the complete repository tree from the latest working archive.
- Checked catalog paths against files present in the archive.
- Ran `python3 -m py_compile nexus_proxy.py` successfully.
- Extracted inline JavaScript from HTML files and ran `node --check` on extracted scripts plus `substrate.js` and `vibe-adapter.js` successfully.
- Removed generated `__pycache__` before repacking.

**Why it was changed**

- The orchestrator requested a high-signal codebase state and risk assessment.
- The persistent maintenance log must record each round's activity and delivery status.

### Round 003 — Witness Patch Plan / Vibe Protocol Contract

**What changed**

- Added this Round 003 log entry.
- No runtime/application code was modified.
- Produced an exact minimum patch plan for `nexus-witness.html` DNA verification and dedupe.
- Produced the observed canonical contract for the `vibe.*` protocol implemented by `vibes-library.html`.

**How it was changed**

- Re-inspected `nexus-witness.html`, `substrate.js`, `vibes-library.html`, and all current callers of `vibe.*` channels.
- Verified that `generateAt()` returns `Uint8Array` DNA and that existing witness verification compares DNA by object identity.
- Verified that `vibes-library.html` returns summary envelopes from `vibe.list` / `vibe.search` and full envelopes only from `vibe.load`, `vibe.save`, and `vibe.tag`.
- Repacked the complete codebase into a fresh delivery archive.

**Why it was changed**

- The orchestrator requested narrow follow-up guidance, not implementation.
- The persistent maintenance log must record each round's inspection and delivery status.

### Round 004 — Final Grounding Pass

**What changed**

- Added this Round 004 log entry.
- No runtime/application code was modified.
- Produced grounded answers on witness rings, Wallet v4 UTXO semantics, Nostr block status, realm/season/ruleset hooks, and Vibes Library multi-parent lineage behavior.

**How it was changed**

- Searched all code and markdown for ring/ruleset/realm/season terms and witness verification comments.
- Inspected `nexus-witness.html`, `blocks/Wallet_v4_nexus.html`, `blocks/Nexus Social v0.02.html`, `blocks/Nexus Channels v0.02.html`, `blocks/Nexus Forums v0.02.html`, `atlas.html`, `vibes-library.html`, and handoff/runbook markdown.
- Confirmed lineage traversal walks all parent edges in memory and resolves descendants by scanning all cached envelopes whose `parents[]` includes the queried id.
- Repacked the complete codebase into a fresh delivery archive.

**Why it was changed**

- The orchestrator requested a final narrow grounding pass before further implementation prompting.
- The persistent maintenance log must record each round's inspection and delivery status.

### Round 005 — Refactor Sweep / Contract Fixes

**What changed**

- Applied deterministic DNA canonicalization in `nexus-witness.html`.
- Fixed `vibe.*` caller contract violations in `atlas.html` and `eidolon-router.html`.
- Audited `Nexus_OS.html` launcher catalog: repointed present moved files and disabled missing entries with reasons.
- Added portable wallet fork-proof recording/export channels in `blocks/Wallet_v4_nexus.html`.
- Added shared `nexus-block-client.js` and ported Atlas, Crucible, Arena, Mission Control, and NexusDB to it.
- Renamed project references from the legacy typo state to canonical Moot naming for this delivery.

**How it was changed**

- Added `dnaId()` and changed witness storage/comparison/dedupe to canonical DNA hex strings.
- Changed Atlas row click to lazy-load full world envelopes via `vibe.load` before `openWorld()`.
- Changed Router creature hydration to call `vibe.load` per `vibe.list` summary and removed unused `vibe.notify` consume declaration.
- Repointed Social and Channels catalog entries into `blocks/`; marked missing Sim, Messages, external studios, legacy forges, Console, and Phantivex disabled.
- Added `fork_proofs` IndexedDB/localStorage persistence, proof summaries, proof export, and wallet kernel channels.
- Extracted managed-block handshake, request, emit, and subscription handling into a classic-script shared client for file:// compatibility.
- Ran inline JavaScript syntax checks for every modified HTML block, `node --check` for modified/shared JS, and `python3 -m py_compile nexus_proxy.py`.

**Why it was changed**

- The orchestrator authorized a real implementation sweep to fix correctness bugs, reduce protocol drift, make the catalog self-contained, and prepare multiplayer/equivocation plumbing.
- The persistent maintenance log must record each implementation round and the latest delivery state.


## Round 006 Log

### What changed
- Added `tests/protocol-harness.js` and `tests/run.sh` for Node-based managed-block protocol verification.
- Extended `nexus-block-client.js` with `handle(channel, handler, {resultChannel})` for service-side request handling.
- Ported `vibes-library.html` to the shared client while preserving `vibe.result` response semantics.
- Added `REALMS.md` and built-in `realms/realm_genesis_0.json`.
- Added realm-aware Vibe metadata and channels: `vibe.realm.current`, `vibe.realm.set`, `vibe.realm.list`.
- Added creature import normalization, content-addressing, deferred/published birth attestation metadata, and `vibe.attest`.
- Fixed Atlas standalone fallback sentinel introduced by the shared-client port.
- Added `OPERATOR_SMOKE.md` for manual browser checks that cannot run in this environment.

### How
- Used a no-external-dependency Node VM harness with a mocked kernel/MessageChannel equivalent.
- Added IndexedDB schema version 2 stores for `world`, `realm-charter`, and `vibes_meta`.
- Kept creature artifacts sovereign: no creature HTML files were modified.

### Why
- Browser smoke is unavailable in this environment, so protocol verification now runs headlessly every sweep.
- Library was the remaining central hand-rolled IPC service.
- Realms provide local usage context without making realm intrinsic to the creature artifact.

### Verification
- `python3 -m py_compile nexus_proxy.py` passed.
- `node --check` passed for `nexus-block-client.js`, modified inline block JS, and `tests/protocol-harness.js`.
- `bash tests/run.sh` passed with `SUMMARY pass=14 fail=0`.
- Browser UI smoke not claimed; see `OPERATOR_SMOKE.md`.


## Round 007 Log

### What changed
- Added Nostr receive path for kind `30420` birth attestations in `vibes-library.html`.
- Added `creature-stub/1` Vibe family for foreign attested creatures without local artifacts.
- Added parent-ref resolution and forward-resolution from `external:<nonce>` to newly discovered stubs.
- Extended Mission Control lineage SVG with generation/realm/source labels, foreign-stub styling, clickable edges, and attestation counts.
- Added `tests/syntax-check.js` and wired it into `tests/run.sh` to syntax-check classic and module inline scripts.
- Updated `REALMS.md` and `OPERATOR_SMOKE.md` for cross-user lineage and manual browser checks.

### How
- Bumped Vibes Library IndexedDB schema to version 3 and added the `vibes_creature-stub` store.
- Subscribed to configured Nostr relays with kind `30420` and active-realm filtering; verified event ids/signatures before import.
- Stored attestation evidence on full creatures and foreign stubs as `{pubkey,event_id,ts}`.
- Kept full creature artifacts untouched and realm-agnostic.
- Used no new build tooling or external runtime dependencies beyond the existing Nostr crypto/CDN pattern.

### Why
- Sweep 2 shipped attestation publishing but not cross-user receipt/merge.
- Cross-user lineage requires foreign attestations to materialize as local queryable lineage nodes.
- Inline module scripts were previously outside automated syntax coverage.

### Verification
- `python3 -m py_compile nexus_proxy.py` passed.
- `node tests/syntax-check.js` passed with `SYNTAX SUMMARY pass=25 fail=0`.
- `bash tests/run.sh` passed with protocol harness `SUMMARY pass=14 fail=0`.
- Browser/Nostr relay UI behavior was not claimed; manual checks are documented in `OPERATOR_SMOKE.md`.

## Round 008 Log

### What changed
- Added `breed-engine.js` with deterministic `sexualBreed({dnaA,dnaB,huesA,huesB,jointSeed})`.
- Extended `nexus-block-client.js` with `commitReveal(...)` for abstract joint-randomness commit/reveal.
- Added Nostr breed event handling in `vibes-library.html` for kinds `30421` offer, `30422` commit, `30423` reveal, and `30424` receipt.
- Added Library breed channels: `vibe.breed.offer`, `vibe.breed.inbox`, `vibe.breed.accept`, and `vibe.breed.receipts`.
- Replaced `kin-forge.html` with a focused managed breeding console while preserving the catalog path/id.
- Added `tests/breed-engine-tests.js` and expanded `tests/protocol-harness.js` with commit-reveal, Sweep 3 backfill, and breed receipt tests.
- Extended `OPERATOR_SMOKE.md` with manual sexual-breeding, receipt, twin import, and Mission Control lineage checks.

### How
- Kept breeding in the platform: no Eidolon creature artifact files were modified.
- Used a classic-script UMD-style engine for file:// compatibility and Node tests.
- Kept Nostr transport best-effort and injected commit-reveal broadcast/await primitives so tests can run without relays.
- Receipt handling recomputes twins when both parent DNAs are local; otherwise it saves twin stubs.

### Why
- Sexual breeding is the first multiparty deterministic protocol and establishes primitives reused by battle locking/receipts.
- The harness now covers prior relay/lineage merge behavior plus commit-reveal failure modes.

### Verification
- `python3 -m py_compile nexus_proxy.py` passed through `bash tests/run.sh`.
- `node tests/syntax-check.js` passed with `SYNTAX SUMMARY pass=32 fail=0`.
- `node tests/breed-engine-tests.js` passed with `BREED SUMMARY pass=5 fail=0`.
- `node tests/protocol-harness.js` passed with `SUMMARY pass=27 fail=0`.
- Browser UI / live Nostr relay behavior was not claimed; manual checks are documented in `OPERATOR_SMOKE.md`.

## Round 009 Log

### What changed
- Added `battle-engine.js` with deterministic PHANTIVEX-family stat/move/type derivation, type matrix, turn resolution, replay, and engine constants.
- Added `battle-protocol.js` for platform multiplayer battle sessions using commit-reveal for battle seed and per-turn move reveals.
- Updated `realms/realm_genesis_0.json` to ruleset `eidolon-core` v1.1 with populated `engine_hash` and recomputed `ruleset_hash`.
- Added Vibes Library migration from genesis charter v1.0/null-engine to v1.1 in place while preserving the stable charter id.
- Added Vibes Library battle handlers for Nostr kinds `30431` intent, `30432` commit, `30433` reveal, and `30434` result.
- Added Library channels: `vibe.battle.intent`, `vibe.battle.inbox`, `vibe.battle.accept`, and `vibe.battle.results`.
- Added `battle-result/1` Vibe family for co-signed battle history records.
- Added minimal Multiplayer mode controls to `vibes-arena.html`; Solo mode remains present and its existing code path is not removed.
- Added `tests/battle-engine-tests.js` and `tests/battle-protocol-tests.js`; expanded `tests/protocol-harness.js` with battle event, result, and charter migration coverage.
- Updated `REALMS.md` and `OPERATOR_SMOKE.md` for battle engine binding, charter migration, and two-window battle smoke.

### How
- Extracted the engine surface from the PHANTIVEX-family code already present in `eidolon-os.html` / `eidolon-router.html` because the explicit donor artifact was not present in the archive.
- Kept battle as a platform feature over Library entries; no sovereign Eidolon HTML artifact was modified.
- Used deterministic seeded PRNG in `battle-engine.js`; no `Math.random` in engine resolution.
- Kept multiplayer Nostr transport best-effort and testable via injected broadcast/await primitives.

### Why
- Battle needs byte-identical platform resolution before ranked/staked multiplayer can safely exist.
- Realm charters must bind to engine hashes so multiple deterministic battle engines can coexist.
- Sweep 5 establishes reusable battle intent/result storage without creating lineage edges yet.

### Verification
- `bash tests/run.sh` passed.
- `SYNTAX SUMMARY pass=36 fail=0`.
- `BREED SUMMARY pass=5 fail=0`.
- `BATTLE-ENGINE SUMMARY pass=7 fail=0`.
- `BATTLE-PROTOCOL SUMMARY pass=7 fail=0`.
- Protocol harness `SUMMARY pass=35 fail=0`.
- Browser UI / live Nostr relay behavior was not claimed; manual checks are documented in `OPERATOR_SMOKE.md`.

## Round 010 Log

### What changed
- Added `PHANTIVEX_DIFF.md` documenting that the donor artifact was not accessible in the execution filesystem.
- No runtime code changed.

### How
- Searched the extracted archive and execution filesystem for `eidolon-battle-PHANTIVEX-enhanced_1_.html`.
- Preserved the existing Sweep 5 engine because donor verification could not be performed.

### Why
- Avoided false confidence and avoided modifying the canonical battle engine without the actual donor surface.

### Verification
- `bash tests/run.sh` passed with the previous Sweep 5 counts.

## Round 011 Log

### What changed
- Reconciled `battle-engine.js` against the embedded canonical PHANTIVEX engine surfaces.
- Removed platform-only move `type` fields and now derives offensive type from `attacker.types[0]` at resolution.
- Corrected `PHANTOM CLAW` to donor `effect:null` and removed platform phantom anti-dodge bypass.
- Changed `multi` from repeated damage to a donor-style hit-again indicator.
- Corrected end-of-turn poison damage to 10% max HP and burn damage to 6% max HP.
- Removed non-donor stat aliases from `deriveStats()`; kept donor names `maxHp`, `atk`, `def`, `spAtk`, `spDef`, `spd`.
- Recomputed `battle-engine.js` `ENGINE_HASH`.
- Updated `realms/realm_genesis_0.json` to ruleset `eidolon-core` v1.2 with new `engine_hash` and `ruleset_hash`.
- Updated Vibes Library built-in charter/migration target to v1.2.
- Expanded `tests/battle-engine-tests.js` with PHANTIVEX exact-surface assertions.
- Replaced `PHANTIVEX_DIFF.md` with concrete surface-by-surface results.
- Updated `REALMS.md` and `OPERATOR_SMOKE.md` for v1.2 charter migration.

### How
- Used the operator-supplied embedded PHANTIVEX surfaces as canonical donor authority.
- Preserved only required deterministic/platform normalizations: seeded PRNG, JSON-only state, stateA speed-tie rule, stable tie fallback, engine hash exports, and UMD wrapper.
- Left sovereign Eidolon artifact files untouched.

### Why
- Staked/ranked battle mechanics must bind to the actual canonical engine before later economics layers are added.
- Donor divergence in move typing, phantom behavior, multi-hit, status ticks, and stat aliases would have made future multiplayer outcomes incompatible with PHANTIVEX semantics.

### Verification
- `bash tests/run.sh` passed.
- `SYNTAX SUMMARY pass=36 fail=0`.
- `BREED SUMMARY pass=5 fail=0`.
- `BATTLE-ENGINE SUMMARY pass=12 fail=0`.
- `BATTLE-PROTOCOL SUMMARY pass=7 fail=0`.
- Protocol harness `SUMMARY pass=35 fail=0`.

## Round 012 Log

### What changed
- Added slot economy to Library-managed creature envelopes: `payload.slots = { total:3, consumed:[] }`.
- Added Library slot query channels: `vibe.creature.slots` and `vibe.creature.spent`.
- Extended `battle-protocol.js` with ranked-battle parameters, wallet LOCK callbacks, ranked transcript metadata, and result-cert fields.
- Added Wallet v4 request channels for `wallet.lock.create`, `wallet.lock.resolve`, and `wallet.lock.verify`, returning `wallet.lock.result`.
- Extended Library battle result handling to the Milestone C result-cert shape: ranked flag, locks, witness signatures, hashes, and slot application.
- Added `witness-selection.js` for deterministic witness selection, kind `30450` advertisement shape, and 3-of-5 quorum verification.
- Added Library witness pool ingestion from kind `30450` relay events.
- Added `eidolon-generator.js` for generating new descendant Eidolon HTML files with deterministic scar rendering.
- Added `vibe.imprint.create` and a minimal Arena **Imprint** button.
- Added tests: `slot-economy-tests.js`, `battle-stakes-tests.js`, `witness-tests.js`, `imprint-tests.js`; expanded protocol harness to 50 passes.
- Updated `OPERATOR_SMOKE.md` for casual/ranked/witness/imprint/manual checks.

### How
- Kept all Eidolon HTML artifacts read-only; imprint creates a new generated descendant HTML scaffold instead of mutating originals.
- Stored slot state in Library envelopes, not creature artifacts.
- Reused existing Wallet v4 LOCK/RESOLVE primitives through new kernel channels.
- Preserved optional witness infrastructure without shipping a daemon.

### Why
- Milestone C needs bounded ranked participation, portable result evidence, and a visible post-victory evolution path while preserving sovereign artifacts.

### Verification
- `bash tests/run.sh` passed.
- `SYNTAX SUMMARY pass=42 fail=0`.
- `BREED SUMMARY pass=5 fail=0`.
- `BATTLE-ENGINE SUMMARY pass=12 fail=0`.
- `BATTLE-PROTOCOL SUMMARY pass=7 fail=0`.
- `SLOT SUMMARY pass=4 fail=0`.
- `BATTLE-STAKES SUMMARY pass=4 fail=0`.
- `WITNESS SUMMARY pass=5 fail=0`.
- `IMPRINT SUMMARY pass=4 fail=0`.
- Protocol harness `SUMMARY pass=50 fail=0`.
- Browser UI and live Nostr/wallet cross-window behavior were not claimed; manual checks are documented in `OPERATOR_SMOKE.md`.

## Round 013 Log — Documentation Foundation (Cleanup Sweep 1 of N)

### What changed
- Added seven new living-documentation files at the archive root: `README.md`, `AI_CODEBASE_HANDOFF.md`, `CODEBASE_ORIENTATION.md`, `LANDMINES.md`, `HANDY_LESSONS.md`, `HANDY_CODE_SNIPPETS.md`, `FREEDOM_REASONING_LOG.md`.
- Removed `__pycache__/` (a stray Python build artifact that Round 002 specified should be removed before repacking and was not).
- No application code was modified. No file was renamed, moved, or deleted besides `__pycache__/`.

### How
- Read the full archive and the existing eight markdown docs to identify what was load-bearing, what was historical, and what was missing.
- Wrote each new doc in a register matching the existing handoffs (dense prose with structural emphasis; not bullet-soup).
- `README.md` is human-facing and short. `AI_CODEBASE_HANDOFF.md` synthesizes orientation + working-with-the-user notes from the two existing handoffs without duplicating their depth (those remain in the archive as reference). `CODEBASE_ORIENTATION.md` is the file inventory mapped to conceptual layers. `LANDMINES.md` enumerates 14 invariants with rationale. `HANDY_LESSONS.md` enumerates 12 patterns that have paid off. `HANDY_CODE_SNIPPETS.md` collects 10 canonical reusable patterns already in the codebase. `FREEDOM_REASONING_LOG.md` defines the deviation-log format and carries the first entry (this sweep being a phase deviation from surgical-edit mode).
- Test baseline captured before any change: 133 passes across nine suites.
- Tests re-run after the additions: identical 133 passes, 0 fails.

### Why
- This sweep is the first of a multi-round cleanup the user explicitly authorized in advance of installing a new AI-maintainer prompt. The cleanup is invasive scaffolding work that prepares the archive to be maintained surgically going forward.
- The seven new docs are the scaffolding the future surgical-mode prompt depends on. Without them, the prompt's "before/after each sweep" doc-check loop has nothing to check.
- Existing handoffs (`EIDOLON-HANDOFF.md`, `ATLAS-HANDOFF.md`) remain authoritative reference material. They will be moved into a `docs/legacy/` folder in a later sweep, not in this one — Round 013 does not move or rename any file.

### Verification
- Pre-sweep `bash tests/run.sh`:
  - `SYNTAX SUMMARY pass=42 fail=0`
  - `BREED SUMMARY pass=5 fail=0`
  - `BATTLE-ENGINE SUMMARY pass=12 fail=0`
  - `BATTLE-PROTOCOL SUMMARY pass=7 fail=0`
  - `SLOT SUMMARY pass=4 fail=0`
  - `BATTLE-STAKES SUMMARY pass=4 fail=0`
  - `WITNESS SUMMARY pass=5 fail=0`
  - `IMPRINT SUMMARY pass=4 fail=0`
  - Protocol harness `SUMMARY pass=50 fail=0`
- Post-sweep `bash tests/run.sh`: identical to baseline (no regression).
- No browser UI or live Nostr behavior claimed; this sweep was documentation-only.

## Round 014 Log — Folder Restructure Plan (Cleanup Sweep 2 of N)

### What changed
- Appended a new "Planned restructure — Round 015 will execute this" section to `CODEBASE_ORIENTATION.md` describing the target tree, the per-file move map, and the references that Round 015 will need to update atomically with the moves.
- Added this Round 014 log entry to `CRITICIAL AI INSTRUCTIONS README.md`.
- No file was moved, renamed, deleted, or had its content changed beyond the two doc edits above.

### How
- Inspected `Nexus_OS.html` lines 1721–1761 (`BUILTIN_CATALOG`, `LEGACY_CATALOG`) to enumerate every catalog path that will need to track the move.
- Grepped every HTML file at root for `<script src>` imports of local `.js` files; counted 18 imports across 10 root-level HTMLs.
- Verified that no HTML file inside the existing `blocks/` folder imports any local `.js` (they're all self-contained).
- Verified that the genesis realm charter is inlined as a JS constant in `vibes-library.html` and not loaded from `realms/realm_genesis_0.json`, so the realms folder is reference-only.
- Inspected `tests/protocol-harness.js` for hardcoded HTML paths; found the array at line 342 and the explicit call at line 435.
- Confirmed `tests/syntax-check.js` walks recursively from ROOT and will discover moved files automatically.
- Confirmed `tests/run.sh` baseline 133/0 unchanged before and after the doc edits.

### Why
- Round 015 is invasive — file moves plus catalog edits plus 18 import-path updates plus 6 test-harness path updates land in the same sweep so nothing breaks mid-flight. Doing this without a written plan invites silent drift.
- The plan is captured in `CODEBASE_ORIENTATION.md` so a future AI replaying the sweep, auditing it, or rolling it back has a single canonical reference.
- The structure proposed in the plan reflects the conceptual layering EIDOLON-HANDOFF and ATLAS-HANDOFF already describe but the flat directory currently does not.

### Verification
- `bash tests/run.sh`:
  - `SYNTAX SUMMARY pass=42 fail=0`
  - `BREED SUMMARY pass=5 fail=0`
  - `BATTLE-ENGINE SUMMARY pass=12 fail=0`
  - `BATTLE-PROTOCOL SUMMARY pass=7 fail=0`
  - `SLOT SUMMARY pass=4 fail=0`
  - `BATTLE-STAKES SUMMARY pass=4 fail=0`
  - `WITNESS SUMMARY pass=5 fail=0`
  - `IMPRINT SUMMARY pass=4 fail=0`
  - Protocol harness `SUMMARY pass=50 fail=0`
- Total: 133 passes, 0 fails. Identical to Round 013 baseline. No code touched, no regression possible.

## Round 015 Log — Restructure Applied (Cleanup Sweep 3 of N)

### What changed
- Physically reorganized the archive from flat-root into the layered structure planned in Round 014. New directories: `docs/`, `docs/legacy/`, `engines/`, `blocks/{vibes,world,eidolon,system,apps,social,forges}/`, `proxy/`. Existing `tests/` and `realms/` unchanged.
- Moved 12 markdown files into `docs/` (with the two big handoffs going to `docs/legacy/`).
- Moved 8 shared `.js` engines into `engines/`.
- Moved 10 root-level HTML blocks into `blocks/<category>/` and redistributed the 15 existing `blocks/` files into the seven category folders.
- Moved `nexus_proxy.py` into `proxy/`.
- Updated 18 `<script src="…">` imports in the 10 moved HTML files to point at `../../engines/<name>.js`.
- Updated 22 active path entries in `Nexus_OS.html`'s `BUILTIN_CATALOG` and `LEGACY_CATALOG` (lines 1721–1761) to reflect the new locations. The 10 disabled placeholder entries (`disabled:true reason:"file missing from archive"`) were left untouched.
- Updated `tests/run.sh` to call `python3 -m py_compile proxy/nexus_proxy.py`.
- Updated 24 reference points in eight test files (requires + readFileSyncs + an equality check at `tests/protocol-harness.js` line 347) to point at `engines/`. The line-347 fix and the test-file inventory beyond protocol-harness were not in the Round 014 plan and were caught mid-execution; full reasoning logged in `docs/FREEDOM_REASONING_LOG.md`.
- Updated the seven living docs (`README.md`, `AI_CODEBASE_HANDOFF.md`, `docs/CODEBASE_ORIENTATION.md`, etc.) to reflect the new paths.
- Removed regenerated `__pycache__/` before zipping.

### How
- Created all target directories with a single `mkdir -p`.
- Moved files using `mv`, with quotes around the three filenames containing spaces in `blocks/social/`.
- Used a single multi-pattern `sed -i -E` pass with `#` as delimiter (avoiding the `|` alternation conflict with the default `s|` form) for the 18 HTML script-import rewrites.
- Used a single `sed -i` pass with 22 `-e` clauses for the catalog path substitutions; verified by viewing lines 1721–1761 of `Nexus_OS.html` after the edit.
- Used `str_replace` for the protocol-harness updates (line 342 array, line 347 equality, line 435 explicit call) since each was a unique single-occurrence change.
- Used a second `sed -i -E` pass for the 24 test-file engine references (`require('../X.js')` → `require('../engines/X.js')` and `path.join(ROOT, 'X.js')` → `path.join(ROOT, 'engines/X.js')`).
- Re-ran `bash tests/run.sh` after each substantial change; first run after engine moves failed only because `tests/run.sh` itself referenced `nexus_proxy.py` at root; fix was a single-line edit to the run script.

### Why
- The conceptual layering described in `EIDOLON-HANDOFF.md` and `ATLAS-HANDOFF.md` now matches the directory structure. New AI instances and human readers see the architecture from the file system before reading a single doc.
- The atomic-sweep approach (move + path updates + catalog updates in one round) prevents the catalog-vs-filesystem drift that previously required a Round 005 audit.
- The uniform `../../engines/<file>.js` import pattern across all blocks at depth 2 makes future moves cheap — only catalog entries need updating, never block-internal imports.

### Verification
- `bash tests/run.sh` post-sweep:
  - `SYNTAX SUMMARY pass=42 fail=0`
  - `BREED SUMMARY pass=5 fail=0`
  - `BATTLE-ENGINE SUMMARY pass=12 fail=0`
  - `BATTLE-PROTOCOL SUMMARY pass=7 fail=0`
  - `SLOT SUMMARY pass=4 fail=0`
  - `BATTLE-STAKES SUMMARY pass=4 fail=0`
  - `WITNESS SUMMARY pass=5 fail=0`
  - `IMPRINT SUMMARY pass=4 fail=0`
  - Protocol harness `SUMMARY pass=50 fail=0`
- Total: 133 passes, 0 fails. Identical to baseline; no regression.
- Browser UI verification (per `docs/OPERATOR_SMOKE.md`) is the operator's responsibility — not claimed by this round.
- The Round 014 plan's "Risks and what to verify after the move" checklist:
  1. ✓ `tests/run.sh` returns 133/0.
  2. — Open `Nexus_OS.html` in a browser, click each catalog entry. **Manual check, deferred to operator.**
  3. — Atlas's live dot turns green. **Manual check, deferred to operator.**
  4. — Standalone mode still works. **Manual check, deferred to operator.**
  5. — Vibes Library boots and imports the genesis realm. **Manual check, deferred to operator.**

If any of items 2–5 fail in browser, Round 015 should be reverted from this archive and the issue logged. The headless test pass means at minimum the syntax and Node-side protocol simulation are clean.

## Round 016 Log — Seam-mending sweep + new blocks

### What changed
- Added `tests/catalog-paths-tests.js` and wired into `tests/run.sh`. Static check: every catalog entry in `Nexus_OS.html` either points at a real file or is explicitly `disabled:true`. Closes the open todo in LANDMINES #11 ("a future sweep should add an automated check").
- XSS hardening pass on the two highest-risk blocks (Nostr-published and session-import surfaces):
  - `blocks/forges/i-was-wrong.html` — added `safe`...`` tagged-template helper. Replaced raw-interpolation `innerHTML` in `renderCard()`, `renderLeaderboard()`, and `updateIdentityUI()`. Removed inline `onclick="copyToClip('...')"` handlers (previously injectable via `nostrEventId`); replaced with `data-action` delegated event handlers.
  - `blocks/forges/the-room.html` — added the same `safe`...`` helper. Replaced four `innerHTML` calls in `renderRichScorecard()` and `renderMinimalScorecard()` that interpolated `session.topic` and `m.note`.
- New file `docs/SANDBOX.md` — honest documentation of what the iframe sandbox actually protects against. Spells out that `allow-same-origin` makes the system safe-against-bugs but unsafe-against-hostile-blocks, that `KERNEL_SECRET` is namespacing not security, and lays out the three architectural options for the eventual community-blocks story.
- Updated `docs/LANDMINES.md`: added entry #15 pointing at SANDBOX.md; refreshed entry #11 to reflect the new automated test; refreshed entry #14 with the new baseline (166 passes pre-new-blocks, 170 post).
- New block `blocks/system/block-doctor.html` (managed, ~340 lines). Consumes `nexus.kernel.log`, parses kernel feed entries against known patterns to reconstruct per-block state machines, surfaces failure diagnoses ("Stuck in LOADING — BOOT may not have reached this block, see file:// + sandbox issue"), copies a markdown report to clipboard. Built specifically to answer "why isn't this app opening?" without the user having to read raw kernel logs.
- New block `blocks/apps/drift.html` (managed, ~300 lines). Pure deterministic generative art: seed string → FNV1a → mulberry32 → composition (palette, body count, motion field, pulse). Uses the same PRNG as `engines/substrate.js` so the determinism contract matches. Standalone-friendly: works inside Nexus and double-clicked. Seed is in the URL hash for share-by-link.
- Both new blocks added to `BUILTIN_CATALOG` in `Nexus_OS.html`. Both are managed (tight sandbox).

### How
- Catalog test: regex-extracts every `{ id:"..." path:"..." }` literal from `Nexus_OS.html`, classifies each as (active+exists, active+missing, disabled+exists, disabled+missing, external), fails on the two error states.
- XSS helper: classic 6-character escape (`&<>"'`), tagged template that escapes interpolated values by default and accepts pre-trusted fragments via a `trusted(html)` wrapper. Confined to the affected files so other blocks remain untouched.
- New blocks: modeled on `blocks/apps/app-terminal.html` for the handshake; rendering uses DOM API + `textContent` exclusively (no innerHTML), so the new blocks set the right precedent rather than continuing the old pattern.

### Why
- "Apps not opening in the OS browser" was reported as the active complaint. The catalog audit showed zero drift (good), so the cause is almost certainly the documented `file://` + sandboxed-iframe `MessagePort` drop. Block Doctor surfaces this directly with a one-line diagnosis instead of requiring the user to read the kernel log themselves.
- LANDMINE #11 promised an automated catalog check "in a future sweep." This is that sweep. Catalog drift is now impossible to ship without a test failure.
- SANDBOX.md exists because the codebase was gesturing at "community blocks" while leaving the actual sandbox limitations only half-acknowledged. The doc closes that loop honestly.
- XSS hardening focused on the two surfaces where untrusted data is most plausible: Nostr-published convictions and imported session JSON. Other blocks' `innerHTML` usages are mostly own-constants and lower priority.
- Drift is the platform's deterministic philosophy as a toy. The whole composition is recoverable from the seed string. It's also the smallest possible canonical example of the BOOT/MOUNT_ACK/PING handshake with a working standalone fallback — useful as a reference for future blocks.

### Verification
- `bash tests/run.sh` post-sweep:
  - `SYNTAX SUMMARY pass=44 fail=0` (was 42 — added the two new blocks)
  - `CATALOG SUMMARY pass=33 fail=0` (new suite)
  - `BREED SUMMARY pass=5 fail=0`
  - `BATTLE-ENGINE SUMMARY pass=12 fail=0`
  - `BATTLE-PROTOCOL SUMMARY pass=7 fail=0`
  - `SLOT SUMMARY pass=4 fail=0`
  - `BATTLE-STAKES SUMMARY pass=4 fail=0`
  - `WITNESS SUMMARY pass=5 fail=0`
  - `IMPRINT SUMMARY pass=4 fail=0`
  - Protocol harness `SUMMARY pass=50 fail=0`
- Total: 170 passes, 0 fails (previous baseline 133; +33 from catalog suite, +2 from new-block syntax checks, +2 from new catalog entries = +37; the new 166→170 step accounts for the 2 new catalog entries and 2 new syntax entries).
- Browser UI verification (per `docs/OPERATOR_SMOKE.md`) is the operator's responsibility — not claimed by this round. Specifically untested in headless: that Block Doctor's diagnoses display correctly mid-failure, that Drift's canvas refits on resize, that the seed-via-URL-hash works under the OS's preCreateWindow flow.

## Round 017 Log — Handshake unification, Phase 1 + LANDMINE #8 honesty fix

### What changed
- Migrated six blocks from inline hand-rolled kernel handshakes onto the shared `engines/nexus-block-client.js`:
  - `blocks/apps/app-about.html` (193 → 150 lines)
  - `blocks/apps/app-terminal.html` (219 → 173 lines)
  - `blocks/apps/app-notepad.html` (208 → 161 lines)
  - `blocks/apps/app-reader.html` (241 → 194 lines)
  - `blocks/apps/app-files.html` (254 → 208 lines)
  - `blocks/apps/nexus-webviewer.html` (426 → 412 lines)
- Net: -243 lines, -6 parallel implementations of the BOOT/DECLARE/MOUNT_CHALLENGE/MOUNT_ACK/MOUNTED/SUB/PING handshake.
- Updated `docs/LANDMINES.md` #8 ("never silently catch errors") to admit the cleanup-path exception explicitly. The kernel currently has 8 silent `catch (_) {}` sites in cleanup helpers (`cleanupBlock`, `evictBlock`, kernel broadcast, fs.result reply, fs stat). All are best-effort operations on resources that may have already been disposed — port closed, blob URL revoked, file moved, iframe removed. The rule as previously written ("forbidden, period") didn't match the kernel itself; the new rule names the four legitimate patterns and says anything else is still a bug. No kernel code changed; the rule was the dishonest part.
- Appended a migration recipe to `docs/HANDY_LESSONS.md` (entry #14) that captures the exact pattern and the gotchas, so the remaining ~12 hand-rolled blocks can be migrated in future rounds without re-deriving the pattern.

### How
- Each block migration was a single `str_replace` of the 60-line handshake block (`APP` constant + `_port`/`_mounted` state + `_setState` helper + window message handler + `_handleKernel` switch + local `emit`/`subscribe` helpers + `_onMounted` + `_onMessage`) replaced with a single `bootBlock({manifest, onMessage})` call plus `nx.ready.then(() => { ... })` for post-mount setup.
- `<script src="../../engines/nexus-block-client.js"></script>` added as a separate tag before the existing inline `<script>` in each migrated block.
- `emit(channel, payload)` calls inside business logic were updated to `if (nx) nx.emit(...)` to preserve graceful standalone behavior (the client returns `undefined` if `window.NexusBlockClient` isn't available).
- `subscribe(channel)` calls inside `_onMounted` became `nx.subscribe(channel)` calls inside the `nx.ready.then` block.
- The `_setState("DECLARED")` / `_setState("MOUNT_ACK")` boot-screen narration is gone — the boot screen now just shows "BOOTING" and is hidden when `nx.ready` resolves and `body.nx-mounted` is set. The intermediate states were aesthetic; the user sees the same end result.
- Syntax-checked each block individually after migration, full test run after all six.

### Why
- Every kernel protocol bump previously required edits across 18+ blocks because each one hand-rolled the handshake. The shared client was added in Round 005 and adoption stalled at ~7 blocks. This round resumes adoption by tackling the easiest cohort (the small, similar `app-*` blocks plus `nexus-webviewer`) and proving the migration pattern. The bigger blocks (Wallet with its custom WALLET_RESPONSE protocol, the 4000-line mission-control, the 2400-line the-room, the social trio with their own quirks) are explicitly out of scope for this round and queued for per-file scoped sweeps.
- LANDMINE #8 as previously written was a rule the kernel itself didn't follow. Round 016 set the precedent of fixing the documentation when the implementation revealed the rule was wrong (SANDBOX.md). This continues that pattern: don't silently accept the gap between rule and reality, name the exception and move on.
- HANDY_LESSONS #14 captures the migration recipe specifically because Round 017 only got 6 of ~18 blocks. The next time someone (human or AI) picks this up, the pattern shouldn't have to be re-derived from scratch.

### Verification
- `bash tests/run.sh` post-sweep: 170 passes, 0 fails. Identical to the Round 016 baseline. No regression.
- The catalog test (`tests/catalog-paths-tests.js`) confirms all six migrated blocks are still findable on disk at the paths referenced in `Nexus_OS.html`.
- Syntax check confirms each migrated block parses cleanly with the new shape.
- Browser UI verification (per `docs/OPERATOR_SMOKE.md`) is the operator's responsibility and not claimed by this round. Specifically untested in headless: that the migrated blocks complete the handshake under the actual OS, that they receive subscribed messages correctly, that their boot screens hide on `nx.ready`, that the standalone-when-`nx`-is-undefined fallback works for blocks that may be opened outside Nexus (notepad and reader can; the others assume kernel context).

## Round 018 Log — Handshake unification, Phase 2 + vibe-adapter rebuild

### What changed
- Migrated four more blocks from inline hand-rolled kernel handshakes onto `engines/nexus-block-client.js`:
  - `blocks/forges/i-was-wrong.html` — also a bug fix; see below.
  - `blocks/forges/forge-nexus-template.html` — clean migration, the manifest's existing `db.query` emit declaration already matched the actual emit calls.
  - `blocks/world/nexus-witness.html` — also a bug fix; see below.
  - `blocks/social/Nexus Channels v0.02.html` — uses `<script type="module">`; the classic-script `nexus-block-client.js` include is placed *before* the module so `window.NexusBlockClient` is populated when the module evaluates. Standalone fallback timer (800ms) preserved.
- Rebuilt `engines/vibe-adapter.js` on top of `engines/nexus-block-client.js`. Public API is byte-identical to v1 (`Vibe.save`, `Vibe.load`, `Vibe.list`, `Vibe.search`, `Vibe.delete`, `Vibe.tag`, `Vibe.lineage`, `Vibe.subscribe`, `Vibe.importFolder`, `Vibe.exportFolder`, `Vibe.ready`, `Vibe.isHosted`, `Vibe.isStandalone`). Internals collapsed: the previously duplicated handshake state machine, port management, and `_reqId → Promise` pending-call map are all gone — `nx.request()` does that work. File length 304 → 281 lines, but more importantly the third parallel implementation of the kernel handshake in the codebase is eliminated.
- Two latent bugs found while migrating, both fixed as a side effect:
  1. **i-was-wrong.html — `dbQuery` was sending the wrong message type.** The hand-rolled implementation emitted via `kernelPort.postMessage({type:'MSG', channel:'db.query', payload:...})`. The kernel router's switch only handles `DECLARE / SUB / MOUNT_ACK / PONG / EMIT` from blocks; anything else falls into `default: violation(block, "unknown type: ...")`. So every NexusDB query from this block had been silently dropped and counted as a protocol violation since the code was written. The migration replaces this with `nx.request("db.query", ...)`, which uses `EMIT` internally. Also added `db.query` to the manifest's `emits` (previously missing — a separate violation that would have shown up the moment the type was corrected).
  2. **nexus-witness.html — `PONG` was missing the nonce.** The hand-rolled handshake responded to PING with `port.postMessage({ type: 'PONG' })` — no nonce. The kernel's `handlePong` validates `typeof msg.nonce !== "string"` and counts that as a violation. Witness has been silently triggering protocol violations on every kernel ping (every ~5s once mounted). The shared client always sends the nonce correctly, so the migration fixes this.
- Updated `docs/CODEBASE_ORIENTATION.md` to note that `vibe-adapter.js` is now the v2 rebuild.

### How
- Each block migration followed the recipe in `docs/HANDY_LESSONS.md` #14, with three special cases worth noting for the next round:
  - **Standalone-mode fallback timer**: blocks that need to work outside Nexus (Channels, the social blocks generally) keep a `setTimeout(..., 800)` that runs the post-mount setup if `nx.ready` never resolves. The pattern: `nx.ready.then(_bootOnce); setTimeout(_bootOnce, 800); }` where `_bootOnce` is idempotent (uses an `_once` flag).
  - **`<script type="module">` blocks**: the classic-script `nexus-block-client.js` include must come *before* the module script. Modules can read `window.NexusBlockClient`; that's the bridge.
  - **`IN_NEXUS` guards**: where a block already detects "am I hosted?" via `window.parent !== window`, the cleanest migration is `const nx = IN_NEXUS ? window.NexusBlockClient?.bootBlock({...}) : null;`. Then every emit/subscribe/request call is gated on `if (nx)` and the block falls through to its existing standalone code paths (localStorage, file pickers) when null. This is i-was-wrong's pattern.
- vibe-adapter rebuild: kept the file as a single IIFE with no exported globals other than `window.Vibe` and the `vibe-ready` window event. Rebuilt the inside to use `Client.bootBlock({manifest, onMessage})` for the handshake and `nx.request(channel, payload, {timeout})` for every request/response operation. Standalone fallbacks (file picker, blob download) carried across unchanged. Added a degraded-mode warning if `window.NexusBlockClient` isn't loaded, which v1 used to silently swallow.
- Verified the migration recipe + special cases in `HANDY_LESSONS.md` #14 covers everything we actually hit, then ran the full suite after each migration.

### Why
- Eleven blocks still hand-rolled the handshake at the start of this round; Phase 2 takes that down to seven. The remaining seven are the heavyweights (Wallet, mission-control, eidolon-os, eidolon-router, the-room, Forums, Social) — each gets its own scoped sweep in subsequent rounds. Headless tests cannot verify these visually-driven blocks, and they have custom protocol extensions or are 2000+ lines, so per-file rounds are correct here.
- The vibe-adapter rebuild eliminates the third parallel handshake implementation in the codebase. Before this round there were three: the inline-per-block pattern (most blocks), `nexus-block-client.js` (newer adoptees), and `vibe-adapter.js`'s own copy. Now there are two — the rapidly shrinking inline-per-block pattern and the canonical client. Future kernel protocol bumps only need to update one place.
- The two bug fixes are not minor. i-was-wrong's `dbQuery` failure means its NexusDB-backed Round-of-Confessions shared feed has never worked end-to-end inside Nexus; this is the kind of bug that would be discovered the moment someone tried to use the feature, then take an hour to diagnose. Catching it during a mechanical migration validates the whole "consolidate to one implementation" thesis: parallel implementations drift, and the drift hides bugs that look like working code.

### Verification
- `bash tests/run.sh` post-sweep: 170 passes, 0 fails. Identical pass count to Round 017.
- Suite breakdown:
  - `SYNTAX SUMMARY pass=45 fail=0` (5 of the migrated blocks pass; the 6th — Channels — uses `<script type="module">` which the harness already counts as separate)
  - `CATALOG SUMMARY pass=34 fail=0`
  - All other suites unchanged from Round 017.
- `node --check engines/vibe-adapter.js` passes after rewrite.
- The two bug-fixed channels (`db.query` emit from i-was-wrong, PONG nonce from witness) cannot be verified headlessly — they only manifest as kernel violations counted in the live OS. Operator smoke-test items added implicitly: "open i-was-wrong, save an entry, confirm it survives a kernel restart" and "open witness, leave it running 5 minutes, check Block Doctor for accumulated violations."
- Browser UI verification (per `docs/OPERATOR_SMOKE.md`) is the operator's responsibility — not claimed by this round. Specifically untested in headless: that all four migrated blocks complete the handshake under the real OS, that Channels' standalone fallback timer fires correctly when run outside Nexus, that the rebuilt vibe-adapter resolves `Vibe.ready` correctly in both hosted and standalone modes (no consumers exist yet, so the only way to verify is to write a test forge or wire it into an existing one).

## Round 019 Log — Phase 3 begins + contract analyzer + community-blocks design + block-hash verifier

### What changed
- Migrated `blocks/eidolon/eidolon-router.html` (1071 → 1047 lines) from inline hand-rolled handshake onto `engines/nexus-block-client.js`. First of the seven heavyweight blocks; six remain (Wallet, mission-control, eidolon-os, the-room, Forums, Social). Migration replaced the local `pending` Map and bespoke `call()` reqId-tracking with `nx.request()` — same contract, less code.
- Added `tests/block-contract-tests.js` — a static analyzer that scans every block's inline JS for the bug patterns Round 018 found by inspection. Three rules:
  - **Rule A**: blocks must not send `type:"MSG"` in postMessage (kernel-→-block direction only). Caught the i-was-wrong bug pre-fix; would catch any future regression of the same shape.
  - **Rule B**: PONG messages must include the nonce field. Caught the witness bug pre-fix.
  - **Rule C**: every channel emitted via `nx.emit` / hand-rolled EMIT must appear in the manifest's `emits[]` declaration. Static-string-literal coverage; dynamic channels pass through silently.
  - Rule A has a kernel-host exemption (detected by `function deliverMessage` or `kernelBroadcast` defined in the file): `eidolon-os.html` is itself a kernel and routes MSGs to its own hosted blocks, so type:"MSG" is correct there. The exemption is data-driven, not a hardcoded filename.
  - Rule B has a client-based exemption: blocks using `nexus-block-client.js` always include the nonce (the client's PING handler does so unconditionally), so PONG-related bugs cannot be present in client-using blocks.
- Wired the contract suite into `tests/run.sh`. Adds 81 passes covering all 27 inline-script blocks against the three rules.
- Added `docs/COMMUNITY_BLOCKS_DESIGN.md` — the architectural design doc the codebase has been gesturing at for ~10 rounds. Spells out the five questions (identity / trust grant / storage / crypto / network), the three sandbox options (drop allow-same-origin / split origins / two-tier system), and recommends Option C (two-tier) with reasoning. Also names the minimal first step that's shared across all options (content-addressing) and ships that step in this same round (see next item).
- Added `blocks/system/block-hash.html` (~430 lines) — a new managed block that hashes any local file or pasted content with SHA-256 in the browser, displays the hash, lets the operator paste an advertised hash for comparison with a clear MATCH/MISMATCH verdict, and best-effort extracts the manifest from the bytes (so the operator can see what channels the block declares before deciding to install it). The companion runtime tool to `COMMUNITY_BLOCKS_DESIGN.md`. Boots both inside Nexus and standalone.
- Added `block-hash` to `BUILTIN_CATALOG` in `Nexus_OS.html`.

### How
- eidolon-router migration followed the recipe in `docs/HANDY_LESSONS.md` #14, plus #14a's standalone-mode-fallback note for the `mounted` flag (eidolon-router needs `mounted = true` to gate emits, set in `nx.ready.then`).
- `tests/block-contract-tests.js` uses regex-extraction over inline `<script>` blocks. The kernel-host detection (`function deliverMessage` / `function kernelBroadcast`) was added after the initial run flagged eidolon-os.html as a false positive — the test caught a legitimate code-shape distinction (kernel-direction MSGs) and the rule had to learn it. The exemption is structural, not by filename, so any future block that implements its own kernel inside it (a hypothetical Nexus-inside-Nexus) would also be exempt automatically.
- `block-hash.html` uses `crypto.subtle.digest('SHA-256', ...)` for hashing — same primitive the kernel and engines/nexus-block-client.js use for content addressing. Manifest extraction is a best-effort regex pattern over the file contents; it handles both `bootBlock({manifest: {emits, consumes, app}})` (client-using blocks) and hand-rolled `type:'DECLARE'` patterns (legacy blocks). For non-block files (random JSON, markdown, etc.) it just shows the hash without the manifest section.
- `COMMUNITY_BLOCKS_DESIGN.md` was written to be the answer-document to `SANDBOX.md`'s problem-document. Read SANDBOX.md first, then this. Each of the three sandbox options gets the five questions answered explicitly so the costs of each are concretely comparable.

### Why
- The contract test exists so that the next time someone (human or AI) hand-rolls a handshake instead of using the client, the test fails on the run — the bug doesn't survive into a delivery. Round 018's two bugs were found by inspection; that's not a process that scales. This makes it scale.
- The community-blocks design exists because the codebase keeps making decisions whose justifications partly rest on "we'll need this when community blocks ship" (the kernel-mediated FS syscalls, the `KERNEL_SECRET` localStorage namespacing, vibe-adapter's "graduating forges" framing). None of those decisions are wrong, but they were being made against an unwritten contract. Now the contract is written and Option C is the recommendation with reasoning.
- Block Hash is the smallest-possible-useful-thing that's required by all three sandbox options. Content-addressing is non-negotiable for community blocks regardless of which sandbox option ships, so building the hash tool now is forward-compatible work that also has immediate user-facing value: if a friend sends you an .html and says "hash should be sha256:abc123…", you can verify before you double-click.
- The eidolon-router migration is part of the ongoing handshake unification, not a special move for this round. It's the smallest of the heavyweights so it goes first; each subsequent heavyweight gets its own scoped round.

### Verification
- `bash tests/run.sh` post-sweep: 254 passes, 0 fails. Up from 170 (+84, all from the new contract suite plus the 2 syntax checks for block-hash + contract-tests file plus the 1 new catalog entry for block-hash).
- Suite breakdown:
  - `SYNTAX SUMMARY pass=48 fail=0` (was 45)
  - `CATALOG SUMMARY pass=35 fail=0` (was 34)
  - `CONTRACT SUMMARY pass=81 fail=0` (new suite)
  - All other suites unchanged.
- Browser UI verification (per `docs/OPERATOR_SMOKE.md`) is the operator's responsibility — not claimed by this round. Specifically untested in headless: that block-hash's file picker actually reads bytes correctly under the OS's preCreateWindow flow, that the manifest extraction regexes display correctly for every shape of block in the codebase, that the eidolon-router block's `nx.request("vibe.list", ...)` etc. round-trips correctly through Vibes Library (it should — the contract is identical to the previous hand-rolled `call()`).

## 2026-05-07 Calibration Intake — Uploaded archive baseline + living-doc refresh

### What changed
- Performed an initial intake sweep on the uploaded `Nexus Moot v1.4` archive.
- Refreshed stale living-doc facts: archive version, current harness baseline, catalog-drift automation status, and remaining roadmap notes.
- Added a Freedom log entry explaining why the existing canonical `.md` document paths were kept instead of creating case-only `.MD` duplicate filenames.
- Added a handy test-summary extraction snippet and calibration lessons for future AI instances.
- No application code was modified.

### How
- Unpacked the archive, inventoried root/docs/blocks/engines/tests/proxy/realms, and checked the seven required living docs.
- Ran the full test harness before doc edits and again after doc edits.
- Updated docs only where the live archive contradicted stale prose.

### Why
- The uploaded archive is internally healthy, but several docs still carried old Round 015/016 baselines and outdated notes about catalog automation. Those stale facts would mislead the next sweep.
- Creating exact uppercase `.MD` aliases would risk case-insensitive zip extraction collisions, so the canonical existing `.md` files remain the source of truth.

### Verification
- `bash tests/run.sh` before doc edits: 254 passes, 0 fails.
- `bash tests/run.sh` after doc edits: 254 passes, 0 fails.
- Browser UI verification remains unclaimed in this headless intake.

## 2026-05-07 Calibration Sweep 2 — Architecture audit + protocol-surface tracker

### What changed
- Performed a second calibration pass after the user said `Go`.
- Added a file-by-file handshake/migration tracker to `docs/CODEBASE_ORIENTATION.md`.
- Updated `AI_CODEBASE_HANDOFF.md` and `README.md` with the current protocol-surface map.
- Added a lesson about generating a protocol-surface map before touching hand-rolled blocks.
- Added a landmine clarifying that the static contract analyzer is a guardrail, not a proof of full protocol correctness.
- Added a reusable audit snippet for future sweeps.
- Fixed a nondeterministic readiness race in `tests/protocol-harness.js` by waiting for Vibes Library `system.block_ready` and mocking `fs.status`.
- No application runtime code was modified.

### How
- Re-unpacked the refreshed calibration archive and ran `bash tests/run.sh` before edits.
- Counted archive file types, largest files, and block handshake style from the actual file contents.
- Classified block HTML files into shared-client, hand-rolled-handshake, and pure-guide buckets.
- Updated living docs with calibration knowledge and the test-harness readiness fix.

### Why
- The next useful edit is likely handshake unification. That work is safer if future AI instances know exactly which blocks still own custom BOOT/DECLARE/MOUNT/PING/SUB/EMIT code.
- The static analyzer is valuable but easy to over-trust; its limits need to be visible before a maintainer starts deleting or migrating protocol code.
- Repeated protocol-harness runs exposed a real race: the Vibes Library helper used a fixed sleep while the block initializer could still clear/reload cache. The safe move was a targeted harness fix, not a production-code change.

### Verification
- `bash tests/run.sh` before doc edits: 254 passes, 0 fails.
- `node tests/protocol-harness.js` repeated 5 consecutive times after the harness patch: 50 passes, 0 fails each run.
- `bash tests/run.sh` after all edits: 254 passes, 0 fails.
- Browser UI verification remains unclaimed in this headless calibration sweep.


## 2026-05-07 Calibration Sweep 3 — Runtime dependency audit + script-reference guard

### What changed
- Performed a third calibration pass after the user said `Go`.
- Added `tests/local-script-refs-tests.js` and wired it into `tests/run.sh`. The new suite validates every local `<script src>` in `Nexus_OS.html` and `blocks/**/*.html` resolves inside the archive.
- Audited the runtime/dependency surface: no package manifest, no npm tree, 30 local script refs, intentional CDN/font/social/webviewer/LLM-proxy surfaces.
- Corrected `docs/VIBES-RUNBOOK.md` where old flat-folder instructions still said to load `vibe-adapter.js` from the same directory. Current guidance now points to `../../engines/nexus-block-client.js` and `../../engines/vibe-adapter.js` for blocks under `blocks/<category>/`.
- Updated the seven living docs with the new harness baseline and dependency-surface guardrail.
- No application runtime code was modified.

### How
- Re-unpacked the sweep 2 archive and ran `bash tests/run.sh` before edits.
- Wrote a small Node static checker that walks `Nexus_OS.html` plus `blocks/**/*.html`, skips external/data/blob/about script URLs, strips query/hash suffixes, rejects root escapes, and fails on missing local script targets.
- Ran the new checker standalone before wiring it into the full harness.
- Refreshed README/handoff/orientation/landmine/lesson/snippet/freedom docs so future AI instances know the expected pass count is now 285/0, not 254/0.

### Why
- Syntax checks and inline-script extraction do not prove the browser can load shared external scripts. A block can have valid JavaScript and still stall at boot if `../../engines/nexus-block-client.js` or another local import drifts during a file move.
- The next likely work includes block migrations and social filename cleanup; both are path-sensitive. Adding the guard now turns a silent browser/runtime failure into a harness failure.
- The stale Vibes runbook path guidance would mislead a future forge-adapter migration by pointing at a root-level `vibe-adapter.js` that no longer exists.

### Verification
- `bash tests/run.sh` before edits: 254 passes, 0 fails.
- `node tests/local-script-refs-tests.js` after adding it: `SCRIPT-REF SUMMARY pass=30 fail=0`.
- `bash tests/run.sh` after all edits: 285 passes, 0 fails.
- Browser UI verification remains unclaimed in this headless calibration sweep.

## 2026-05-07 Phase A — Battle engine parity + metadata identity audit

### What changed
- Added `docs/BATTLE_ENGINE_PARITY.md` as the requested Phase A audit document.
- Compared the three battle-resolution implementations: canonical `engines/battle-engine.js`, local `blocks/eidolon/eidolon-os.html`, and headless `blocks/eidolon/eidolon-router.html`.
- Audited metadata/identity non-determinism in `blocks/vibes/vibes-library.html`, `engines/battle-protocol.js`, `engines/eidolon-generator.js`, and `engines/nexus-block-client.js`.
- Verified by source trace that generated imprint HTML currently embeds `#creature-dna` JSON but the emitted renderer reads an unassigned `GENE_DATA` global.
- Updated `docs/LANDMINES.md` with two new invariants: generated imprint artifacts must wire embedded JSON to the renderer, and wall-clock values must not accidentally enter content-addressed identity.
- No application code or test code was modified.

### How
- Reused the latest calibration sweep 3 archive as the working baseline.
- Ran `bash tests/run.sh` before edits to confirm the expected 285/0 baseline.
- Inspected source line references directly with `nl -ba` / `rg`, comparing formulas, catalogs, random sources, turn flow, persisted metadata, and generated HTML strings.
- Applied only documentation changes: one new audit doc plus the required round log and landmine additions.

### Why
- Phase A is a gate before any consolidation work. The audit verifies whether canonical `battle-engine.js` is a safe consolidation target rather than assuming it.
- The duplicate OS/router engines contain outcome-affecting drift and unseeded randomness, while canonical already contains the donor-reconciled behavior. That supports consolidation toward canonical calls.
- Metadata identity drift is separable from battle math. IDs, slot records, lineage edges, signed event content, and generated imprint payloads can become non-reproducible even when battle resolution itself is deterministic.

### Verification
- `bash tests/run.sh` before documentation edits: 285 passes, 0 fails.
- `bash tests/run.sh` after documentation edits: 285 passes, 0 fails.
- Browser UI verification remains unclaimed in this headless audit.

## 2026-05-07 Phase A.5 — Metadata identity fix sweep

### What changed
- Applied the Phase A.5 metadata-identity conventions to the Phase A audit inventory.
- Replaced wall-clock-derived identity inputs for battle intents, breed offers, slot consumption, lineage edges, and imprint generation with deterministic canonical derivations or required caller-provided values.
- Removed weak `Math.random()` salt fallbacks from commit-reveal salt generation in `engines/nexus-block-client.js` and `engines/battle-protocol.js`; affected paths now require WebCrypto/Node crypto or explicit deterministic test providers.
- Updated imported/foreign attestation handling so source event `created_at` is required and used instead of local `Date.now()` fallbacks.
- Marked approved display/session timestamps inline as metadata-only so future audits do not treat them as content-addressed identity drift.
- Added targeted protocol/imprint tests for deterministic IDs, byte-identical imprint generation, salt-fallback failure, and missing-attestation-timestamp rejection.
- Updated `docs/BATTLE_ENGINE_PARITY.md` Section 2 statuses and strengthened `docs/LANDMINES.md` wall-clock-in-content guidance.

### How
- Started from the Phase A audited archive and confirmed the pre-edit 285/0 harness baseline.
- Patched only the inventory surfaces named in the Phase A.5 brief, preserving the explicit deferral for protocol message wrapper `ts` fields in `engines/battle-protocol.js`.
- Used existing canonical primitives (`canonical(...)` plus SHA-256 hex) rather than introducing new dependencies or hashing utilities.
- Added deterministic test hooks through existing exported APIs and block test hooks instead of changing production protocol semantics for unrelated callers.

### Why
- `Date.now()` is acceptable for display metadata but unsafe when it contributes to IDs, lineage records, slot records, generated artifact bytes, or content-addressed envelopes.
- Identity-determining values must be reproducible from canonical inputs plus explicit nonces/counters; silent wall-clock fallbacks make witnesses and replay comparisons brittle.
- Weak salt fallbacks are worse than hard failure because they silently downgrade cryptographic commit-reveal assumptions.

### Verification
- `bash tests/run.sh` before edits: 285 passes, 0 fails.
- `bash tests/run.sh` after edits and doc updates: 295 passes, 0 fails.
- New coverage includes deterministic battle/breed/imprint identity checks, deterministic imprint HTML output, salt-fallback hard failure, and rejection of imported attestations missing source `created_at`.
- Browser UI verification remains unclaimed in this headless fix sweep.

### Noticed in passing
- `engines/battle-protocol.js` protocol wrapper `ts` fields remain deliberately deferred for a later event-identity vs canonical-identity pass.
- The Phase A `GENE_DATA` generated-imprint renderer defect remains known and intentionally unmodified in this metadata-identity sweep.
- `ENGINE_HASH` was not bumped: this round did not alter `engines/battle-engine.js` battle resolution surfaces.


## 2026-05-07 Phase B — Router consolidation onto canonical battle engine

### What changed
- Consolidated `blocks/eidolon/eidolon-router.html` battle-resolution math onto `window.NexusBattleEngine`.
- Added a relative `<script src="../../engines/battle-engine.js"></script>` before the router's block-client script.
- Removed router-local battle catalogs and duplicate stat/move/type/damage/effect/status/turn/victory logic.
- Preserved router world orchestration: population, movement, challenge routing, evolution, 80-turn cap fallback, and post-battle bookkeeping.
- Added `tests/router-battle-tests.js` and wired it into `tests/run.sh`.
- Updated `docs/BATTLE_ENGINE_PARITY.md` Section 1 router rows to mark the consolidated surfaces as `CONSOLIDATED`.
- Added `docs/LANDMINES.md` entry 23: router must not redefine canonical battle math.

### How
- Started from the Phase A.5 archive and confirmed the pre-edit harness baseline at 295 passes / 0 fails.
- Confirmed `engines/battle-engine.js` exports the required canonical APIs for this round: `deriveStats`, `deriveMoves`, `deriveTypes`, `initBattle`, `resolveTurn`, `isOver`, `ENGINE_HASH`, and `CONSTANTS`.
- Noted that `expressedTraits` exists internally but is not exported; router consolidation did not require it, so canonical was not edited.
- Replaced router stat/move/type touch points with small adapters that fail clearly if `window.NexusBattleEngine` is unavailable.
- Replaced headless battle simulation with canonical `initBattle()` / `resolveTurn()` / `isOver()` calls.
- Added deterministic per-turn seeds as `sha256:` + `sha256Hex(canonical({world_seed, battle_index, turn}))`.
- Added a monotonic per-world battle index and reset it on `spawnWorld()`.
- Used highest-power available move as the router AI policy; ties keep the first move in canonical move order.

### Why
- Phase A found the router's local battle logic was duplicate drift, not canonical-missing architecture.
- The intended behavior changes are consolidation wins, not regressions: multi-hit now uses canonical single damage plus indicator, burn ticks at 6% max HP, poison ticks at 10% max HP, Ancient Power includes `defSt`, speed ties resolve canonically through `resolveTurn()`, and all per-turn variance comes from deterministic turn seeds.
- Router remains responsible for local world dynamics, but witnessed battle math now lives on the deterministic canonical side.

### Verification
- `bash tests/run.sh` before edits: 295 passes, 0 fails.
- `node tests/router-battle-tests.js`: 3 passes, 0 fails.
- `bash tests/run.sh` after edits and doc updates: 300 passes, 0 fails.
- `sha256sum engines/battle-engine.js` matched the Phase A.5 archive exactly; `ENGINE_HASH` was not bumped.
- Browser UI verification remains unclaimed in this headless code sweep.

### Noticed in passing
- World-population `Math.random()` sites remain deliberately deferred to the future world-simulation determinism sweep.
- Router Library import still carries the known `payload.axes` vs `payload.dna` schema split; untouched per Phase B scope.
- Protocol message wrapper `ts` and generated-imprint `GENE_DATA` remain queued/deferred from prior phases.

## 2026-05-07 Phase C — Eidolon-OS consolidation onto canonical battle engine

### What changed
- Consolidated `blocks/eidolon/eidolon-os.html` battle-resolution math onto `window.NexusBattleEngine`.
- Added a relative `<script src="../../engines/battle-engine.js"></script>` adjacent to the substrate engine script.
- Removed OS-local battle catalogs and duplicate stat/move/type/damage/effect/status/accuracy/victory logic.
- Rewrote `executeTurn()` to call canonical `resolveTurn()` once per player turn and animate/log from the returned event objects.
- Preserved OS presentation responsibilities: player input, local enemy move selection, HUD updates, log pacing, canvas animations, player-rolled DNA, and boot instrumentation.
- Added `tests/os-battle-tests.js` and wired it into `tests/run.sh`.
- Updated `docs/BATTLE_ENGINE_PARITY.md` Section 1 OS rows to mark the consolidated surfaces as `CONSOLIDATED`.
- Strengthened LANDMINE #23 so neither router nor OS may redefine canonical battle math.

### How
- Started from the Phase B archive and confirmed the pre-edit harness baseline at 300 passes / 0 fails.
- Mirrored the Phase B adapter pattern locally in OS with `requireBattleEngine()` and no fallback or shim path.
- Replaced OS board construction with canonical `initBattle()`-derived fighter state plus OS-only decoration for hues, names, generation, and UI hooks.
- Added deterministic OS turn seeds as `sha256:` + `sha256Hex(canonical({battle_id, turn}))`.
- Used a monotonic local `os-battle-N` counter for default OS `battle_id`; tests can inject fixed `battleId` values.
- Kept enemy move selection as presentation-layer randomness and marked it inline; tests inject fixed enemy picks by mocking `Math.random`.
- Verified `engines/battle-engine.js` remained byte-identical to the Phase B archive.

### Why
- Phase A found OS battle logic was duplicate drift, not canonical-missing architecture.
- Intended behavior changes are consolidation wins, not regressions: poison now ticks at canonical 10% max HP, burn at canonical 6%, all damage/effect variance comes from deterministic turn seeds, and canonical `isOver()` owns faint resolution.
- OS remains an interactive local cartridge, but the battle-outcome layer now matches canonical results when given the same inputs, moves, and turn seed.

### Verification
- `bash tests/run.sh` before edits: 300 passes, 0 fails.
- `node tests/os-battle-tests.js`: 3 passes, 0 fails.
- `bash tests/run.sh` after edits and doc updates: 305 passes, 0 fails.
- `sha256sum engines/battle-engine.js` matched the Phase B archive exactly; `ENGINE_HASH` was not bumped.
- Browser UI verification remains unclaimed in this headless code sweep.

### Noticed in passing
- OS enemy AI move selection remains intentionally presentation-layer random and is only reproducible in tests when the enemy move sequence is fixed.
- Boot/metrics `Date.now`, player-roll `crypto.getRandomValues`, animation timing, schema split, protocol-wrapper `ts`, and generated-imprint `GENE_DATA` remain deferred or intentional per prior phase scopes.

## 2026-05-07 Phase D — Charter + verification closer

### What changed
- Fixed generated standalone imprint HTML by bridging the embedded `#creature-dna` JSON into the renderer's `GENE_DATA` binding.
- Added `tests/cross-block-tests.js` and wired it into `tests/run.sh` to assert router and OS battle shells produce identical final outcomes under the same scripted moves and shared turn seeds.
- Extended `tests/imprint-tests.js` with a regression guard for the `GENE_DATA` bridge.
- Extended `tests/protocol-harness.js` with Genesis Realm charter/`ENGINE_HASH` equality checks, a battle protocol resolution smoke-check under the Genesis charter, and a mismatched-charter rejection check.
- Updated `docs/BATTLE_ENGINE_PARITY.md` Section 3 from `VERIFIED-BROKEN` to `FIXED`.
- Updated LANDMINE #21 to reflect the landed imprint bridge and its regression test.
- Confirmed the Phase A → A.5 → B → C → D consolidation arc is complete.

### How
- Started from the Phase C archive and confirmed the pre-edit harness baseline at 305 passes / 0 fails.
- Changed only `scarSvgScript()` in `engines/eidolon-generator.js` for the imprint renderer fix; the JSON tag writer stays unchanged.
- Used the parse-at-top form: `const GENE_DATA=JSON.parse(document.getElementById('creature-dna').textContent);`. The JSON script tag is emitted before the renderer script, so this is source-order safe for the generated HTML.
- For the cross-block consistency test, loaded router and OS in the existing VM-style harness pattern, patched their global move/turn-seed hooks in test context only, and drove two scripted battles to completion.
- The cross-block test uses a shared test turn seed to isolate shell consistency. Runtime router and OS still keep their own phase-specific seed provenance from Phases B and C.
- Added charter tripwires without modifying `engines/battle-engine.js` or built-in charter bytes.

### Why
- Standalone imprint artifacts previously embedded correct DNA JSON but failed to connect it to the draw script; Phase D closes LANDMINE #21.
- Router and OS already delegated battle math to canonical; the cross-block test proves both shells now converge when given identical battle inputs, move sequence, and turn randomness.
- Phases A.5 → C did not modify `engines/battle-engine.js` resolution surfaces. `ENGINE_HASH` is unchanged. Ruleset `eidolon-core@1.2` continues to bind. No charter migration needed.

### Verification
- `bash tests/run.sh` before edits: 305 passes, 0 fails.
- `node tests/imprint-tests.js`: 7 passes, 0 fails.
- `node tests/cross-block-tests.js`: 1 pass, 0 fails.
- `node tests/protocol-harness.js`: 61 passes, 0 fails.
- `bash tests/run.sh` after edits and doc updates: 311 passes, 0 fails.
- `sha256sum engines/battle-engine.js`: `4122a41ff2323e42288c49c82eed0f5cf50ef3fb8445b51f49b44955b1b35d04`, unchanged from the Phase C archive.
- `window.NexusBattleEngine.ENGINE_HASH` and Genesis Realm charter `payload.engine_hash` both remain `sha256:79cd0f7ce56120d4aee1aa6616e94c1adbda58d164ffd444e4201e2215ef65a9`.
- Browser UI verification remains unclaimed in this headless code sweep.

### Noticed in passing
- Deferred items still stand: world-population randomness, `payload.axes` vs `payload.dna`, protocol-wrapper `ts`, hue cardinality drift, Eidolon/Moot rename, witness/sybil mechanics, sandbox ordering, and export/backup.

## 2026-05-08 Integration Sweep 6 — Roadmap + stub audit

### What changed
- Added `docs/ROADMAP_STATUS.md` as the canonical triage board for visible stubs, deferred work, disabled catalog entries, and future implementation sweeps.
- Added `tests/roadmap-status-tests.js` and wired it into `tests/run.sh` after dead-letter tests.
- Updated `docs/CODEBASE_ORIENTATION.md` so the roadmap doc and its guard test appear in the archive map.
- Added `docs/HANDY_LESSONS.md` entry #26: audit before autonomy.
- Logged the autonomy boundary in `docs/FREEDOM_REASONING_LOG.md`.

### How
- Started from the Sweep 5 archive and confirmed the pre-edit baseline at 354 passes / 0 fails.
- Scanned source and docs for `TODO`, `FIXME`, `stub`, `placeholder`, `future`, `deferred`, `not implemented`, disabled catalog entries, and recent protocol scaffolding.
- Filtered false positives: HTML input placeholder text, shipped `creature-stub/1` domain objects, historical round-log context, and the opaque Verse bundle body.
- Ranked actionable work into R-001 through R-013, with R-001 system dashboard / block inspector recommended as the next implementation sweep.
- Changed no runtime application behavior.

### Why
- The user authorized broad autonomous continuation. The safest aligned move was to make the backlog explicit before continuing to add features.
- The archive contains many old handoff notes and future markers. Without a single triage board, autonomous sweeps risk chasing stale comments rather than current architecture.

### Verification
- `bash tests/run.sh` before edits: 354 passes, 0 fails.
- `node tests/roadmap-status-tests.js`: 4 passes, 0 fails.
- `bash tests/run.sh` after edits and doc updates: 359 passes, 0 fails.
- No application runtime files changed.

### Noticed in passing
- The next lowest-risk/highest-leverage code sweep is R-001: system dashboard / block inspector.
- Atlas placeholders remain real visible stubs, but starting there before a dashboard would reduce operator visibility while the OS is gaining protocol surface.

---

## 2026-05-08 — Sweep 7 Hotfix: Fedora/browser smoke fixes

**Trigger:** User reported that clicking Companion's `⬇ canvas` appeared to do nothing. Browser console showed Chromium blocking downloads from sandboxed iframes without `allow-downloads`. Block Doctor also showed Verse's first emit racing MOUNT_ACK. Fedora test runs also revealed parent-folder `package.json` poisoning (`type: module`) when unzipped under `~/Downloads`.

**Changes:**
- Managed iframe sandbox now includes `allow-downloads`.
- `engines/nexus-block-client.js` queues emits after BOOT and before MOUNTED, then flushes once mounted.
- Added a minimal root `package.json` sentinel with `type: commonjs`, no scripts, and no dependencies. This is not an npm/build step.
- Added `tests/node-mode-tests.js` and `tests/sandbox-policy-tests.js`; wired both into `tests/run.sh`.

**Verification:**
- `bash tests/run.sh` after edits: 366 passes, 0 fails.

## 2026-05-08 — Sweep 8 Stability Hardening

### What changed
- Added kernel grace for valid declared startup `SUB` bursts so large service blocks like Vibes Library no longer trip control-rate eviction while subscribing to their manifest-declared channels.
- Preserved abuse enforcement for undeclared/malformed SUB messages and the max-subscriptions cap.
- Re-enabled Wallet v4 as a managed block and installed its kernel BOOT listener before async wallet hydration.
- Added `tests/subscription-burst-tests.js` and `tests/wallet-handshake-tests.js`.

### Verification
- `bash tests/run.sh`: 374 passes, 0 fails.

### Notes
- No deterministic engines or realm charter bytes changed.
- Wallet standalone mode remains intact; `initKernelIPC()` exits when opened outside an iframe.


## 2026-05-09 — Sweep 10 Intake Calibration: tooling archive normalization + doc baseline refresh

### What changed
- Treated the uploaded outer wrapper (`files(14).zip`) as an intake artifact and used the nested `Nexus_Moot_v1_4_post_sweep_9_tooling.zip` project as the canonical source of truth.
- Confirmed the new tooling layer is present inside the project at canonical paths: `tools/block-inspect.js`, `tools/channel-atlas.js`, `tools/spec-audit.js`, `docs/TOOLS.md`, generated `docs/CHANNEL_ATLAS.md`, and `tests/tools-tests.js`.
- Updated living docs to reflect the current full-harness baseline of 393 passes / 0 fails and the current dependency/protocol surface.
- Added a lesson and freedom-log entry explaining why wrapped uploads should not be flattened into the project root.
- Removed generated Python bytecode before packaging.

### How
- Ran `bash tests/run.sh` before doc edits and counted every `SUMMARY pass=N fail=0` group.
- Ran `node tools/channel-atlas.js --check`; `docs/CHANNEL_ATLAS.md` was up to date.
- Spot-checked `node tools/block-inspect.js 'blocks/social/Nexus Forums v0.02.html'`; it correctly classified the block as hand-rolled and showed expected manifest drift signals for that not-yet-migrated social block.
- Spot-checked `node tools/spec-audit.js docs/TOOLS.md`; it surfaced the intentional example/future path `engines/lattice-runtime.js` as a candidate missing path.

### Why
- The project itself was healthy, but several required living docs still pointed at older 285/0 or 374/0 baselines.
- Capturing the wrapper-vs-nested-source choice avoids a future AI accidentally shipping duplicate sidecars or treating the wrapper as the runnable root.

### Verification
- `bash tests/run.sh` before doc edits: 393 passes, 0 fails.
- `node tools/channel-atlas.js --check`: up to date.
- `bash tests/run.sh` after doc edits: 393 passes, 0 fails.
- No deterministic engines, realm charters, kernel runtime behavior, block runtime behavior, or tests were modified.


## 2026-05-09 — Sweep H: OS Communication Layer

### What changed
- Added the kernel-shell-resident `nx-notifications` service in `Nexus_OS.html` with stacked toasts, persistent right-rail notification history, unread badge, mark-read, clear, and palette command `notifications clear`.
- Added live taskbar chrome: pending publish pip, notification bell, witness chip, epoch progress indicator, realm activity indicator, and animated NEX chip.
- Added notification class taxonomy: `commit`, `reward`, `info`, `witness`, `pending`, `warn`, `error`.
- Added pending publish lifecycle: `economy.notify.publish_pending` persists until `economy.notify.publish_succeeded(_after_retry)` or `economy.notify.publish_abandoned` resolves the same pending id.
- Added shell-side channel consumption for curated UI event channels so recognized OS attention events do not become false dead letters when no block subscribes.
- Added semantic motion tokens/keyframes in the shell, documented them in `docs/MOTION.md`, and created reference seed `engines/nexus-tokens.css`.
- Polished first-pass empty-state copy in Wallet, Vibes Library, Atlas, Witness, and notification history.
- Added `tests/notification-center-tests.js`.

### How
- Kept the notification center in `Nexus_OS.html` instead of making a block, so it has no app lifecycle dependency.
- Preserved existing block delivery semantics for unknown channels.
- Used the actual uploaded Sweep 10 codebase as source of truth; did not invent missing later-Sweep-G blocks.

### Verification
- `bash tests/run.sh`: **399 passes, 0 fails**.
- `node tools/channel-atlas.js --check`: up to date.

### Notes
- No deterministic engines, realm charters, wallet math, battle math, or backend/proxy behavior changed.
- New `engines/nexus-tokens.css` is a reference seed only, not an active runtime dependency.

## 2026-05-09 — Sweep I/J: Player Thread + Wallet/Genesis Beauty Pass

### What changed
- Added `nx-player-thread` in `Nexus_OS.html`: local milestone memory, current-thread resolver, taskbar Thread chip, dismissible desktop nudge, and action routing through existing launcher targets.
- Added palette commands `next`, `thread`, `continue`, `what now`, and `current thread`.
- Added fallback routing for missing future/narrative targets; notably `first-contact` falls back to existing `guide`, then `library`, then launcher in this uploaded archive.
- Made notification-history empty state actionable with a Return to Desktop control.
- Upgraded Wallet v4 presentation: richer balance dashboard, wallet intent card, action-oriented empty states, and a Genesis trust-anchor hero/status grid.
- Upgraded standalone Genesis Verifier presentation: hero trust grid, input/results cards, stronger verdict styling, and reduced-motion-aware polish.
- Added `docs/PLAYER_THREAD.md` and `tests/player-thread-tests.js`.

### How
- Kept Player Thread as an OS-shell service, not a new block.
- Kept the resolver pure and tested priority/fallback behavior through chrome harness hooks.
- Routed shell-consumed thread channels through the same narrow dead-letter exemption pattern as notifications.
- Left all deterministic engines, realm charters, wallet math, authority verification, conservation rules, witness math, battle math, and backend/proxy code unchanged.

### Verification
- `bash tests/run.sh`: **415 passes, 0 fails**.
- `node tools/channel-atlas.js --check`: up to date.

### Notes
- This is intentionally a guidance/beauty sweep, not an economy or backend sweep.
- Player Thread state is local UX memory at `nx-player-thread-${KERNEL_SECRET}` and must not be treated as protocol state.

## 2026-05-09 — Sweep 13 corrective playability/economy/forge repair

Operator correction accepted as canon:
- Broken launch paths are bugs, not roadmap items. Catalog entries must either point to real archive files or be disabled with reason.
- Player wallets start at **0 NEX**. Never ship automatic login/task/genesis money to player state.
- Use Wallet v4 as the one wallet UX; advanced UTXO/source views may exist but must support one visible NEX balance.
- First Contact must be live and rerollable: companion + world. The accepted world becomes the desktop atmosphere; the accepted companion feeds the notes/companion layer.
- Compose-stage should route humans to the working battle forge generator (`the-room`) rather than a confusing placeholder.

## Sweep 14 — Control, persistence, and one-wallet clarity

- Baseline after implementation: `bash tests/run.sh` reports 473 passes / 0 fails.
- First Contact now writes real `vibe.save` envelopes for the accepted companion/world when Vibes Library is awake, while also mirroring the world into Atlas local fallback storage.
- Environment Forge now has human presets, Library save, Atlas fallback mirroring, and desktop background preview/finalization.
- Compose Stage is now a three-step ingredient flow: Companion → World → The Room. It routes to existing legacy forge tools only.
- Desktop Home Notes stores local notes under `nexus:home-notes:v1` and sends a one-shot inbox item to Companion at `nexus:home-note-inbox:v1`. Companion imports that as a movable note and clears the inbox.
- Wallet copy now emphasizes one wallet / one visible NEX balance. UTXOs are labeled as proof outputs, not separate balances.
- Delete/Backspace shielding was broadened for focused text inputs to reduce Chromium shortcut prompts during searches/typing.

## 2026-05-09 — Boot calibration: exact-case living-doc aliases

### What changed
- Added root-level exact-case alias files for the seven operator-required maintenance docs.
- Updated README/handoff/orientation/lessons/freedom log to record the alias policy and current 473/0 harness baseline.

### Why
- The canonical docs already existed and were populated, but most lived under `docs/` with lowercase `.md` casing.
- Aliases avoid doc drift while satisfying literal hard-constraint filenames.

### Verification
- `bash tests/run.sh` before doc edits: **473 passes, 0 fails**.
- `bash tests/run.sh` after doc edits: **473 passes, 0 fails**.
- `node tools/channel-atlas.js --check`: up to date.

### Notes
- Runtime code was not modified.
- The new root `.MD` files are pointers, not canonical content.



## 2026-05-09 — Boot calibration documentation sweep

### Operator request

The operator uploaded `Nexus_Moot_v1_4_boot_calibrated.zip` and requested a full calibration pass over the updated codebase and prior work, explicitly without changing code.

### Work performed

- Ran `bash tests/run.sh` before documentation edits: **473 passes, 0 fails**.
- Ran `node tools/channel-atlas.js --check`: `docs/CHANNEL_ATLAS.md is up to date`.
- Inspected representative high-risk blocks with `tools/block-inspect.js`.
- Updated the exact-case boot-contract docs (`README.MD`, `CODEBASE_ORIENTATION.MD`, `FREEDOM_REASONING_LOG.MD`, `HANDY_CODE_SNIPPETS.MD`, `HANDY_LESSONS.MD`, `LANDMINES.MD`, `AI_CODEBASE_HANDOFF.MD`) from pointer-only stubs into calibrated boot indexes.
- Refreshed canonical living docs with the current 473/0 baseline, 65-channel atlas, 35-block surface, 26 client-backed / 8 hand-rolled / 1 kernel-host classification, zero-start wallet canon, and current First Contact / Environment / Companion / Compose Stage state.

### Runtime/code status

No runtime/code files were intentionally modified in this sweep. Documentation and generated artifact cleanup only.

### Verification after documentation edits

- `bash tests/run.sh`: **473 passes, 0 fails**.
- `node tools/channel-atlas.js --check`: up to date.

## Eidolon forge preservation pass — 2026-05-09

Operator supplied four recovered Eidolon forge files as foundational UX material. Added them to `legacy/eidolon-forges/` and wrote `docs/EIDOLON_FORGE_CANON.md`. No active runtime wiring was performed in this pass; this was preservation + calibration/reporting work.

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

## Sweep 17 — Wallet tab bug · Accept Contact one-time · Green dot label · First Contact layout

### What changed
- **FIX 1 — Wallet tab highlight offset**: Inserted `'stake'` between `'resolve'` and `'settlement'` in the `names` array inside `sw()` in `blocks/system/Wallet_v4_nexus.html` (line 2427). The 10-entry array was missing stake while the DOM had 11 tabs, causing every tab from settlement onward to highlight one position off.
- **FIX 2 — Accept Contact one-time state**: Added `let _accepted = false` flag to `blocks/world/first-contact.html`. `save()` now returns early if `_accepted` is true. After a successful save, the Accept button becomes disabled/ghosted with "Accepted ✓" text, and an "Update Contact →" link appears that resets UI state only (no re-emission) until the player presses Accept again.
- **FIX 3 — Green dot label**: Wrapped `#hdot` in `blocks/system/Wallet_v4_nexus.html` in a `.hdot-wrap` div with a `<span class="hdot-label">` companion. Added CSS for the wrapper and label. Updated the three JS sites that set `hdot.className` to also update `hdot-label.textContent` → "Connected" / "—".
- **FIX 4 — First Contact layout compression**: In `blocks/world/first-contact.html` — `.card` min-height 430px → 200px with `aspect-ratio:16/9`; `.stage` padding 18→14px, gap 16→12px, `align-content:stretch` → `start`; `.copy` font-size 11px, line-height 1.5; intro copy text shortened (removes redundancy with "What happens next" panel); mobile breakpoint `.card` min-height 310px → 160px with `aspect-ratio:16/9`.

### How
- All four fixes are targeted string replacements. No logic was moved or rewritten.
- No canvas rendering, no JS engine logic, no economy/wallet math, no deterministic engines touched.

### Verification
- `bash tests/run.sh` → **544 passes / 0 fails** (unchanged — no new test vectors needed for these UI/UX fixes; syntax coverage picks up inline JS changes).

### Invariants preserved
- `save()` core logic unchanged; only guarded with early return and post-completion state.
- "Update Contact →" resets UI only — no events re-emitted until player presses Accept again.
- Gold/amber palette usage in wallet untouched; only the unlabeled dot was the problem.
- No tab DOM order changed; only the JS names array corrected.

## Sweep 18 — Eidolon OS reads companion from OS state

### What changed
- **CHANGE 1** — Added `dnaFromSeed(seed)` to `blocks/eidolon/eidolon-os.html` immediately after `randomDna()`. Derives a deterministic 16-byte DNA array from a numeric seed using `mulberry32`, matching the platform's existing PRNG convention.
- **CHANGE 2** — Added `loadCompanionFromOS()` after `dnaFromSeed()`. Reads `nexus:selected-companion:v1` from `localStorage`, validates `spec.seed`, derives DNA via `dnaFromSeed`, derives hues and name, returns `{ dna, hues, name, gen:1 }` or `null` on failure/absence.
- **CHANGE 3** — Boot sequence (boot async function): replaced `const pDna = randomDna()` trio with `_companion = loadCompanionFromOS()` and conditional fallback to `randomDna()`. Preserves identical variable names used downstream.
- **CHANGE 4** — Added feed message after `startBattle(...)` in boot sequence: `pushFeed('OK', 'Companion loaded: …')` if found, `pushFeed('INFO', 'No companion selected …')` if not.
- **CHANGE 5** — Boot overlay subtitle changed from `"sovereign cartridge os"` to `"battle"`.
- **CHANGE 6** — `onChallengerArrival`: `!player` branch now calls `loadCompanionFromOS()` before `randomDna()`, same pattern as boot sequence.

### How
- Targeted `str_replace` on `blocks/eidolon/eidolon-os.html` only.
- No other files modified.
- `startBattle()` signature unchanged. `randomDna()` unchanged. Router/renderer/engine untouched.
- `loadCompanionFromOS` is wrapped in try/catch; any parse error or missing key returns null → standalone mode still boots with random DNA.

### Verification
- `bash tests/run.sh` → **544 passes / 0 fails** (unchanged).

### Invariants preserved
- Standalone boot (no kernel, no localStorage companion): falls back to `randomDna()`, no errors.
- `startBattle(pDna, pHues, pName, pGen, eDna, eHues, eName, eGen)` signature unchanged.
- Deterministic battle math untouched.

## Sweep 19 — OS Chrome: titlebar flip · 8-point resize · launcher dismiss · First Contact auto-open

### What changed
- **CHANGE 1 — Titlebar layout (controls RIGHT, status LEFT):** Both `createWindow` and `preCreateWindow` paths now wrap `min, max, close` in a `.nx-titlebar-controls` div (margin-left:auto, flexed right). `dot` (state) is placed first (left). Order: `[●status] [Title ···] [conviction] [– □ ✕]`. CSS added: `.nx-titlebar-controls`, `.nx-titlebar-title` margin overrides.
- **CHANGE 2 — 8-point resize handles:** Replaced single SE-corner `.nx-resize-handle` with 8 directional `[class^="nx-resize-"]` divs per window. `setupResize(win)` now creates and appends all 8 handles internally; old `(handle, win)` signature removed. `_resizeState` now carries `{ win, dir, origW, origH, origLeft, origTop, startX, startY }`. mousemove handler uses `dir.includes('n/s/e/w')` branches to support resize from all edges and corners. Global cursor override removed — each handle has its own directional cursor.
- **CHANGE 3 — Launcher dismisses on outside click:** Added `document.addEventListener('mousedown', ...)` that removes `.open` from `#nx-launcher` when click is outside launcher and not on `#nx-launcher-btn`. Natural propagation continues — window behind launcher gets focus normally.
- **CHANGE 4 — First Contact auto-opens maximized on first boot:** `checkFirstRun()` IIFE at end of shell boot reads `nexus:selected-companion:v1`; if absent, spawns `first-contact` block after 1200ms and calls `toggleMaximize('first-contact')` 400ms later. Once companion is accepted and key is written, this never fires again. Wrapped in try/catch for localStorage access safety.

### How
- All changes in `Nexus_OS.html` only. No block files touched.
- `setupResize` call sites in both window creation paths updated: resizeHandle div creation removed, `win.append(..., resizeHandle)` replaced with `win.append(titlebar, content)`, calls changed to `setupResize(win)`.

### Verification
- `bash tests/run.sh` → **544 passes / 0 fails** (unchanged).

## Sweep 20 — Eidolon Forge 2 integration

### What changed
- **STEP 1** — Copied `eidolon-forge_2_.html` (pre-wired managed block) to `blocks/forges/eidolon-forge.html`. Self-contained: no local `<script src>` dependencies. `node tests/syntax-check.js` passed immediately (SYNTAX 94/0 then 95/0 after atlas regen).
- **STEP 2** — Added `{ id:"eidolon-forge", path:"blocks/forges/eidolon-forge.html", icon:"⚒", title:"Eidolon Forge", desc:"Creature axis forge — 36 axes, sweep, lock, save" }` to `BUILTIN_CATALOG` in `Nexus_OS.html`, after the `multiforge` entry.
- **STEP 3** — Script-ref check: forge has no local `<script src>` tags (all JS inline). `SCRIPT-REF SUMMARY pass=62 fail=0` unchanged.
- **STEP 4** — Created `tests/sweep20-eidolon-forge-tests.js` (6 assertions: file exists, nexus-block managed, DECLARE/vibe.save, ≥30 group: refs, sweep/lock controls, catalog entry). Wired into `tests/run.sh` before `protocol-harness.js`. `SWEEP20 SUMMARY pass=6 fail=0`.

### Freedom note
Channel atlas was stale after the new managed block was added (it declares `vibe.save`, `vibe.load`, `vibe.list`, `vibe.delete` in its manifest). `TOOLS SUMMARY` failed on first run. Regenerated `docs/CHANNEL_ATLAS.md` via `node tools/channel-atlas.js` → 67 channels across 37 blocks. Re-ran suite: all clean.

### Verification
- `bash tests/run.sh` → **556 passes / 0 fails** (up from 544; SWEEP20 +6, CATALOG +1, CONTRACT +3, SYNTAX +2, TOOLS corrected).
- `node tools/channel-atlas.js --check` → up to date.

### Invariants preserved
- Legacy forge files under `legacy/eidolon-forges/` untouched.
- No engine files modified.
- Forge is fully self-contained (no external script src).

## Sweep 22 — Focus overlay removal · PHANTIVEX battle block · First Contact self-close · Companion drag

### What changed (applied)
- **FIX 1 — Focus overlay removed:** Deleted `.nx-focus-overlay` and `.nx-window:not(.active) .nx-focus-overlay` CSS rules. Deleted `focusOverlay` element creation in both `createWindow` (legacy path) and `preCreateWindow`. The `win.addEventListener("mousedown", () => focusWindow(block.id))` already present on the window div handles focus correctly. Iframes are now always pointer-interactive — no two-click lag.
- **FIX 3 — First Contact self-close:** Inserted a `setTimeout(() => evictBlock('first-contact', ...), 800)` directly inside the existing `system.companion.selected` kernel handler in `Nexus_OS.html`. Matches the pattern of environment.selected and companion.selected handling already in the router. 800ms delay lets the card.accepted CSS animation (680ms) complete before the window is removed.
- **FIX 4 — Companion drag-to-reposition:** CSS: `cursor:pointer` → `cursor:grab` on `#nx-live-companion`; added `.nx-companion-dragging{cursor:grabbing}`. JS: `loadCompanionPos()` reads `nexus:companion-position:v1` on boot. `mousedown` on companion starts `_compDrag`. `mousemove` updates `left/bottom` when `moved` threshold (4px) crossed. `mouseup` saves position to localStorage and calls `e.stopPropagation()` if moved (prevents click from firing on drag-end). All wrapped in `if (liveCompanionButton)` guard.

### What was NOT applied (FIX 2 blocked)
- **FIX 2 — PHANTIVEX battle block:** Source file `eidolon-battle-PHANTIVEX-gen01.html` was absent from uploads. `eidolon-os.html` catalog entry left unchanged. No `blocks/eidolon/nexus-battle.html` created. Awaiting re-upload of source file.

### Verification
- `bash tests/run.sh` → **556 passes / 0 fails** (unchanged — no regression).

### FIX 2 brainstorm prompt (for multi-AI if needed)
> The file `eidolon-battle-PHANTIVEX-gen01.html` needs to be adapted into a Nexus managed block at `blocks/eidolon/nexus-battle.html`. The file should: (1) read `nexus:selected-companion:v1` from localStorage to load player DNA via mulberry32 seed derivation, falling back to embedded `#creature-dna` JSON; (2) declare a minimal DECLARE/MOUNT_CHALLENGE/MOUNT_ACK/MOUNTED/PING/PONG handshake; (3) emit `eidolon.battle.result` on battle end. The source file needs to be re-uploaded for the adaptation to proceed correctly.

## Sweep 22b — FIX 2 complete: PHANTIVEX battle block

### What changed
- **FIX 2 — nexus-battle.html created:** Copied `eidolon-battle-PHANTIVEX-gen01.html` to `blocks/eidolon/nexus-battle.html`. Applied 5 surgical mods:
  - MOD 1: Replaced `const GENE_DATA = JSON.parse(...)` with `loadGeneData()` that reads `nexus:selected-companion:v1` from localStorage, derives DNA via `mulberry32(seed)`, falls back to embedded `#creature-dna` specimen.
  - MOD 2: Added full Nexus DECLARE/MOUNT_CHALLENGE/MOUNT_ACK/MOUNTED/PING/PONG adapter after `GENE_DATA`. Emits `eidolon.battle.result`. Standalone-safe (no-ops if no kernel).
  - MOD 3: Title → `NEXUS · BATTLE`.
  - MOD 4: `endBattle()` emits `{ result, playerName, oppName, ts }` to kernel when `nexusMounted`.
  - MOD 5: Replaced `eidolon-os` `LEGACY_CATALOG` entry with `{ id:"nexus-battle", path:"blocks/eidolon/nexus-battle.html", icon:"⚔", title:"Battle", desc:"PHANTIVEX creature battle" }` in BUILTIN_CATALOG (not legacy).
- Channel atlas regenerated: 67 channels across 38 blocks.

### Verification
- `bash tests/run.sh` → **559 passes / 0 fails**.
- `node tools/channel-atlas.js --check` → up to date.

## Sweep 23 — First Contact: 3-column layout · embedded forge axes · left panel compact

### What changed
- **CHANGE 1 — CSS:** `.wrap` updated to `grid-template-columns:200px 1fr 1fr`. `.stage` → `display:contents` (dissolves wrapper, cards become direct grid items). `h1` → `font-size:22px`. `.copy` → `display:none`. Added `.creature-col`, `.fc-axes`, `.fc-axis`, `.fc-axis-label`, `.fc-axis-slider`, `.fc-axis-val` CSS. Updated mobile breakpoint to stack all 3 columns.
- **CHANGE 2 — HTML:** Removed `<section class="panel stage">` wrapper. First card is now inside `<div class="creature-col">` followed by `<div class="fc-axes" id="fc-axes-panel">`. World card is a direct sibling. Removed `.copy` paragraph (text preserved in `.next` panel — see below). Added `id="creature-card"` and `id="world-card"` to articles.
- **CHANGE 3 — JS:** Added `FC_AXES` array (8 axes: body_radius, body_stretch_x, body_lumpiness, hue_primary, hue_accent, arm_count, eye_count, particle_count). Added `buildAxesPanel()`, `onAxisInput(id, rawVal)`, `syncAxesPanel()`. `buildAxesPanel()` called after `loop()` at init. `syncAxesPanel()` called at end of `rerollCompanion()`.
- **CHANGE 4 — Buttons removed:** `#fine` (Fine tune forges), `#open-companion`, `#open-library`, `#open-atlas` elements and their `onclick` handlers removed.

### Freedom note (snag caught and fixed)
`tests/sweep14-polish-tests.js` checks for `"No NEX is granted"` in `first-contact.html`. The `.copy` paragraph that contained this text was removed per spec. Freedom fix: appended "No NEX is granted." to the `.next` panel text, which already stated the 0 NEX rule. This keeps the canon text visible and satisfies the test invariant without restoring the hidden paragraph.

### Verification
- `bash tests/run.sh` → **559 passes / 0 fails** (unchanged).

## Sweep 24 — First Contact left panel overflow hotfix

### What changed
- **CHANGE 1 — Deck removed:** `<div class="deck" id="choice-deck"></div>` deleted from HTML. `renderDeck()` function definition deleted. `renderDeck()` call removed from `renderText()`. Root cause: `repeat(3,1fr)` in 200px panel → ~44px columns, overflowing into creature card.
- **CHANGE 2 — Control-grid stacked:** Added `.left .control-grid{grid-template-columns:1fr}` rule. All 4 buttons (↺ companion, ↺ world, lock companion, lock world) now stack vertically at full panel width (~168px). Root cause: `1fr 1fr` gave ~70px columns; "lock companion" needs ~116px.
- **CHANGE 3 — Left padding reduced + note removed:** `.left` padding 26px → 16px (content width now 200-32=168px). Redundant `.note` paragraph deleted.

### Freedom note (recurring invariant)
`tests/sweep14-polish-tests.js` asserts both `"Wallet balance starts at 0 NEX"` and `"No NEX is granted"` are present. The `.note` paragraph carried `"Wallet balance starts at 0 NEX"` exactly. Updated `.next` panel text to include both phrases explicitly. The sweep14 test will continue to pass as long as both strings appear anywhere in the file.

### Verification
- `bash tests/run.sh` → **559 passes / 0 fails** (unchanged).

## Sweep 25 — First Contact stats strip · Player Thread nudge guard

### What changed
- **FIX 1 — Stats removed from card-copy:** Deleted `<div id="creature-stats" class="stats"></div>` and `<div id="world-stats" class="stats"></div>` from both card HTML elements. Removed `getElementById('creature-stats').innerHTML=statHTML(creature)` and `getElementById('world-stats').innerHTML=statHTML(world)` from `renderText()`. `statHTML()` function left intact. Card-copy now shows label chip + name only. Overlay height drops from ~140px to ~60px, uncovering creature limbs and world horizon.
- **FIX 2 — Nudge suppressed during onboarding:** Added `localStorage.getItem('nexus:selected-companion:v1')` guard at the top of `shouldShowNudge()` in `Nexus_OS.html`. If no companion has been accepted, `shouldShowNudge` returns false immediately. Guard wrapped in try/catch. Thread service initializes normally; only nudge display is gated.

### Verification
- `bash tests/run.sh` → **559 passes / 0 fails** (unchanged).

## Sweep 26 — Distributed compute substrate · worker pool · stream router · render demo

### What changed

- **ADD 1 — `blocks/system/nexus-compute.html` (946 lines):** New service block. Owns a pool of dedicated Web Workers (`navigator.hardwareConcurrency - 1`, clamped to `[1, 8]`). Three off-main-thread handlers, all bit-exact to `engines/deterministic.ts` math: `noise.sample` (terrain heights), `hash.batch` (FNV-1a + Murmur3 finalizer), `terrain.strip` (heights + biome dominant). Bounded queue (1000), FIFO, transferable typed arrays for zero-copy results. Soft cancellation, worker-crash respawn with cap of 5 per slot, per-handler metrics with rolling 10-second jobs/sec window. Always-on test panel with preset payloads, burst×1000 stress test, and a "Verify vs main thread" button that compares worker math against an in-file reference implementation across 144 sample points (4 seeds × 4 layers × 9 X-positions).

- **ADD 2 — `blocks/system/nexus-router.html` (424 lines):** New service block. Producer registry indexed by kind. Channels: `router.register` (returns sessionId + BroadcastChannel name), `router.connect` (look up producer by kind), `router.heartbeat` (lifecycle), `router.deregister` (explicit teardown), `router.list` (enumerate). Producers stale after 15s without heartbeat are evicted; eviction emits `router.debug`. The router never sees stream traffic — it does discovery and lifecycle only; producers and consumers talk on BroadcastChannel directly.

- **ADD 3 — `blocks/system/nexus-render-demo.html` (575 lines):** New visible-app block. Proves the compute + router architecture end-to-end. Full-window canvas, `transferControlToOffscreen()` to an internal render worker. Asks router for `compute.stream.terrain-strip`, opens BroadcastChannel, pulls chunks at scroll-rate, forwards them with zero-copy transfer to the render worker. Render worker maintains a chunk buffer indexed by world X and scroll-renders biome-colored terrain to the OffscreenCanvas. Overlay reports main-thread ms/frame (should stay under 1 ms), worker draw ms/frame, kernel msg/sec (should drop to ~0 after handshake — proof that stream traffic bypasses the kernel), strips received, buffer chunks, plus live compute queue depth and jobs/sec via `compute.metrics` subscription. Pause and Reseed buttons.

- **ADD 4 — Cross-block streaming pattern.** `nexus-compute` registers `compute.stream.terrain-strip` with `nexus-router` on boot; if the router isn't up yet, it retries 5× at 1s intervals, then subscribes to `system.block_ready` so it re-attempts whenever a `nexus_router` block comes online. The producer/consumer broadcast channel is named `nexus-stream-${kind}-${sessionId}`. Consumers filter incoming frames by their own `requesterId` so multiple render-demos can share one producer.

- **ADD 5 — New docs:**
  - `docs/STREAMING_PATTERN.md` — captures the compute/router/render-demo architecture as a reusable template (when to use BroadcastChannel vs kernel IPC, the registration-with-retry pattern, transferables semantics, multi-consumer filtering).
  - `docs/CAPABILITY_BOUNDARIES.md` — captures the strategic analysis of the proxy's role today (LLM-only CORS bypass) and the two architectural paths forward (narrow-proxy / cartridge-pure vs general-capability-bridge).

- **REGEN — `docs/CHANNEL_ATLAS.md`:** 79 channels across 48 blocks (up from 65/35). New channels: `compute.job`, `compute.cancel`, `compute.result`, `compute.metrics`, `router.register`, `router.connect`, `router.deregister`, `router.list`, `router.heartbeat`, `router.result`, `router.debug`, `render-demo.metrics`. No namespace collisions with existing channels.

### Verification
- All three new blocks: `node --check` clean on extracted inline JS.
- `bash tests/run.sh` test harness deltas vs. blocks-removed baseline:
  - SYNTAX: 169 → 172 (+3)
  - SCRIPT-REF: 64 → 67 (+3)
  - CONTRACT: 128 → 137 (+9, three rules × three blocks)
- `node tools/channel-atlas.js --check` → up to date.
- One pre-existing fail in `blocks/nexus-lattice(1).html` rule A (line ~5 sends `type:"MSG"`) was present in the blocks-removed baseline; **not introduced by this sweep**.

### Operating notes for future sweeps

- **Boot order matters.** Open `nexus-compute.html` first, then `nexus-router.html`, then `nexus-render-demo.html`. The compute block tolerates the router booting later (it subscribes to `system.block_ready` and re-registers), but the render-demo's overlay will show "router offline" until both upstream blocks are present.
- **`nx.emit` does not carry transferables.** Confirmed by reading `engines/nexus-block-client.js`: the kernel-side post is single-argument. This is why streaming uses BroadcastChannel instead of routing typed-array payloads through the kernel. See `docs/STREAMING_PATTERN.md` for the full architecture.
- **The "Verify vs main thread" test panel button in compute is the canonical drift check** for the deterministic math. Whenever `engines/deterministic.ts` changes (or any of the inlined Lattice math), run it. Failure means the worker has diverged from the published math.

## 2026-05-17 Calibration Round 1 — uploaded Nexus Current orientation

### What changed
- Documentation only. No functional code, tests, generated runtime bundles, or source assets were intentionally modified.
- Added current calibration overlays to the seven required exact-case root `.MD` boot documents.
- Updated canonical living docs with the current archive path, Sweep 26 status, harness baseline, and known contract failure.

### What was inspected
- Archive layout under `Nexus Current/Nexus_Gold_sweep26_final(1) OPUS (2)/sweep26_working/`.
- Root boot docs, canonical docs under `docs/`, `README.md`, `AI_CODEBASE_HANDOFF.md`, `package.json`, `tests/run.sh`, `docs/CHANNEL_ATLAS.md`, and the failing `blocks/nexus-lattice(1).html` surface.

### Verification
- `node tools/channel-atlas.js --check` → pass; `docs/CHANNEL_ATLAS.md` is up to date.
- `bash tests/run.sh` → fails at `tests/block-contract-tests.js`; **CONTRACT SUMMARY pass=140 fail=1**.
- Manual continuation of the harness order → aggregate **673 passes / 1 fail**.

### Known blocker
- `blocks/nexus-lattice(1).html` fails contract Rule A: block-side code emits `type:"MSG"`. Current protocol reserves `MSG` for kernel-to-block messages; block outbound channel traffic should use `EMIT`.

### Why no code fix was applied
- This was a boot/calibration round. Functional code changes are deferred until explicitly requested by the user.

---

## 2026-05-17 — Lattice bridge contract repair

### What changed
- Repaired `blocks/nexus-lattice(1).html` hand-rolled bridge emit envelope: block-origin publishes now use `type:"EMIT"` instead of `type:"MSG"`.
- Mirrored the same one-token protocol repair into root `nexus-lattice(1).html` so the duplicate reference copy does not preserve the old violation.
- Updated required maintenance docs and handoff notes to mark the archive green.

### Why
- The previous calibration round found the only non-green suite: `tests/block-contract-tests.js` Rule A.
- Kernel contract accepts `MSG` only as kernel-to-block delivery; block-origin traffic must use `EMIT`.

### Verification
- `node tests/block-contract-tests.js` → `CONTRACT SUMMARY pass=141 fail=0`.
- `node tools/channel-atlas.js --check` → generated atlas up to date.
- `bash tests/run.sh` → **674 passes / 0 fails across 35 summary groups**.

## Diagnostic Sweep — Eidolin Pokémon-style Maker/Player Planning (2026-05-17)

No functional code was changed in this sweep. A dedicated diagnostic note was created at `docs/EIDOLIN_GAME_MAKER_DIAGNOSTIC.md` because the findings are load-bearing for future game-maker architecture.

Key findings:

- Eidolin currently renders via Canvas 2D. Main loop: `blocks/Eidolin/src/runtime.ts`; main world draw helpers: `blocks/Eidolin/src/world-renderer.ts`.
- Current world is continuous/procedural over `worldX`, not a Pokémon-style 2D tile map.
- Current assets are mostly procedural plus an empty asset-manifest seam. Vibes Library stores game-data envelopes in IndexedDB; Asset Bay stores local asset packs in localStorage.
- NexusDB is a small IndexedDB-backed quasi-SQL service with `social_events` and `config`; row bodies can be arbitrary objects, but dynamic table creation is not implemented in the query path.
- Sandboxing is iframe-based with private MessageChannel ports for managed blocks. Web Workers exist in compute services, not as the main block sandbox.
- There is no general declarative trigger system; current trigger-like gameplay is the manifestation proximity state machine plus Nexus channel events.
- Nostr is direct WebSocket relay I/O with hand-written NIP-01-style signing/verification using Schnorr; game events use custom 304xx kinds with JSON content and custom tags.
- Wallet integration is more than identity: local cryptographic SPEND/LOCK/RESOLVE flows support social stake and ranked-battle locks.
- Main OS/tab communication is bespoke per-iframe MessageChannel IPC; BroadcastChannel is used for router/compute streams and wallet fallback/outbox behavior.

Planning implication: a Pokémon-style maker/player should add a new tile-map/project schema, asset pipeline, tile renderer, collision/passability, event trigger layer, NPC/dialogue layer, and versioned authored-world packaging rather than trying to stretch the existing continuous manifestation world directly.


---

## Sweep 4 calibration note — Pokémon maker diagnostic pass 2 (2026-05-17)

Created `docs/POKEMON_MAKER_SECOND_DIAGNOSTIC.md` because the second diagnostic pass is load-bearing for future architecture. Findings: managed blocks require BOOT → DECLARE → MOUNT_CHALLENGE → MOUNT_ACK → MOUNTED; peer traffic normally routes through the kernel except router-brokered BroadcastChannel streams; NexusDB schema can be extended only through a DB_VERSION bump in `blocks/system/nexus-db.html`; large maps should use IndexedDB chunks, not bus-sized blobs; asset manifest loading is only a seam; Nostr 304xx kinds are informal; standalone Canvas + IndexedDB blocks are feasible without wallet/Nostr.

---

## Round: Pokemon Engine Build — 2026-05-17

**What:** Built the foundational engine library for the Pokémon-style game maker/player.

**How:**
1. Read the full codebase (all source files, not just diagnostic summaries)
2. Discovered DB namespace guard (tables must start with appId) — corrected table names in spec
3. Confirmed `battle-engine.js` is clean (zero crypto/Nostr imports, UMD IIFE only)
4. Built `engines/pokemon-engine.js` — 1139 lines, pure JS IIFE, zero dependencies
5. Built `pokemon-engine-test.html` — standalone test harness, all assets generated procedurally
6. Built `tests/pokemon-engine-tests.js` — 43 headless Node.js tests
7. Added pokemon tests to `tests/run.sh`
8. Updated all seven living docs (handoff, snippets, lessons, landmines, orientation)
9. Copied architecture spec v3 and session guide into `docs/`

**Why:** Engine-first before blocks. The engine has zero Nexus dependency so it can be tested immediately, proves the architecture is sound before any OS integration work, and forms the foundation every subsequent block depends on.

**Verification:**
- `bash tests/run.sh` → SUMMARY pass=61 fail=0 (all existing tests passing)
- `node tests/pokemon-engine-tests.js` → POKEMON-ENGINE SUMMARY pass=43 fail=0
- `node tools/channel-atlas.js --check` → passes (no new channels declared yet)
- `tests/syntax-check.js` → PASS for all three new files (engine, test harness, test file)

**Next round:**
1. DB migration (nexus-db.html, DB_VERSION 1→2, 4 pokemon_* stores)
2. BUILTIN_CATALOG entries in Nexus_OS.html
3. `blocks/pokemon-player.html` — full Nexus Host wiring
4. `blocks/pokemon-maker.html` — map editor + DNA genome editor

All prompts are in `docs/POKEMON_MAKER_SESSION_GUIDE.md`.

