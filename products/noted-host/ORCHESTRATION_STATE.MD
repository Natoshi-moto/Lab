# ORCHESTRATION_STATE.MD

## Project identity

Noted v0.01 is the current user-facing app identity. Pre-transition lineage: Nexus Verse Studio v0.07 / Nexus Notes v0.01. Storage identity remains `DB_NAME = 'verse-studio'` and `verse-studio:*` localStorage prefixes for compatibility.

## Last accepted sweep / evidence class

- Last source artifact produced for this build: `noted-v0.01-sweep60_3.zip` (Sweep 60.3: Package Consistency + Runtime Validation Prep).
- Sweep 60.3 delivery status from Builder: SOURCE-VERIFIED + TEST-VERIFIED by `npm ci`, `npm run typecheck`, `npm run build`, source-hash recomputation, artifact-hash grep, selector-count verification, canonical Canvas count verification, and source inspection.
- Runtime status: RUNTIME-UNVERIFIED until owner smoke and/or diagnostic bundle validation is accepted by Orchestrator.

## Current constants after Sweep 60.3 build

- `DB_NAME = 'verse-studio'`
- `DB_VERSION = 11`
- `SCHEMA_VERSION = 10`
- IDB store count = 28
- `build_commit = 83ebad57f9220ac57112f6bbc2ef3818c3a489015b141d4832e842587aded191`
- `exporter_self_hash = ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb` (unchanged — exporter byte-identical to Sweep 59-R)
- Selector inventory: 646 unique `data-test` + 1 unique `data-testid` (delta +1 from Sweep 59-R: `settings-toggle-dev-mode`)

## Accepted owner canon

- Nexus Panel should default open and remain visible relational workspace tissue unless Focus Mode hides it.
- `FocusContext` is the intended current-record UI focus source. It is ephemeral and not persisted.
- Workspace `activeRecord` remains a compatibility bridge for command/link flows during the transition.
- Noted tagline remains `Private by default.`


## Sweep 60.3 implemented state

- Packaging/governance consistency pass only. No product behavior, source behavior, DB/schema/store, dependency, diagnostic exporter, Vite verification-infrastructure, selector, localStorage contract, or migration changes were made.
- Incoming uploaded source/artifact mismatch was confirmed: source recomputed to `83ebad57f9220ac57112f6bbc2ef3818c3a489015b141d4832e842587aded191`, while the uploaded root HTML artifacts still contained stale build commit `1822f8eada333ffd742953bd8d6e11c90da1e6e4956c1558396ec85d004e830b`.
- Rebuilt `dist/*`, `verse-studio.html`, and `noted-v0.01.html` from current source. The rebuilt root HTML artifacts contain `build_commit = 83ebad57f9220ac57112f6bbc2ef3818c3a489015b141d4832e842587aded191` and `exporter_self_hash = ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`; the stale `1822...830b` value is absent from both root HTML artifacts.
- `src/diagnosticExporter.ts` SHA-256 remains `ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`. Frozen Four files are present and were inspected/hash-recorded.
- `src/data/canonicalCanvas.json` remains 42 records / 67 links / 42 positions. Selector inventory remains 646 unique `data-test` and 1 unique `data-testid`.
- `npm ci`, `npm run typecheck`, and `npm run build` passed. `npm ci` left `package.json` and `package-lock.json` byte-identical; audit still reports 2 moderate vulnerabilities, with no dependency update authorized in Sweep 60.3.
- Runtime remains pending. Uploaded JSON exports before this pass are not validation-grade diagnostic bundles because they lack the required build/exporter hash, nonce, environment, and payload schema.
- Next allowed work: Gate 59.5 validation first; Sweep 63 only after Orchestrator accepts the gate or owner explicitly accepts the risk of proceeding with runtime claims still unproven.

## Sweep 59 implemented state

- Presentation-only polish now gives Noted a calmer private-workspace shell with refined sidebar identity, active navigation, command palette, reminder toast, and loading/error surfaces.
- Sweep 59 did not change persistence, diagnostics, schema, migrations, import/export, conversion, Nexus derivation logic, package manifests, or app/storage identity.
- `npm ci`, `npm run typecheck`, and `npm run build` passed.
- Selector inventory remains 645 unique `data-test` values and 1 unique `data-testid` value.

## Sweep 59-R implemented state

- Extension pass over Sweep 59 covering the remaining named surfaces from the Sweep 59 packet (boot moment, route transition, Nexus Panel transition, focus-visible/caret, favicon palette correction).
- Files touched: `index.html`, `src/main.tsx`, `src/index.css`, `src/App.tsx`, `src/components/NexusPanel.tsx`.
- New mechanics: inline boot splash in `index.html` paints on first frame and is detached by `src/main.tsx` before React mount; `.n-route-transition` keyframe wraps `<Routes>` keyed by top-level pathname segment; `.n-panel-shift` width transition class on the Nexus Panel shell; global `caret-color` and `:focus-visible` ring tokens with editor surface opt-out.
- All new motion is covered by the existing `prefers-reduced-motion` global guard; the boot splash also has its own scoped reduced-motion rule.
- No persistence, diagnostics, schema, migrations, import/export, conversion, Nexus derivation logic, package manifests, lockfiles, frozen-four files, or app/storage identity changes were made.
- Selector inventory remains 645 unique `data-test` values and 1 unique `data-testid` value (no add/remove/rename).
- `npm ci`, `npm run typecheck`, and `npm run build` passed.

## Sweep 60 implemented state

- Surface Reduction + Canvas Default + Brand Sharpening + First-Run Canvas Seed. Six tasks shipped together because they share the routing / sidebar / branding context.
- **Surface reduction:** Sidebar now hides Inbox, Longform, App Design, Library by default via a new `RouteSpec.defaultHidden` field. Routes remain mounted; direct URLs (`/inbox`, `/longform`, `/app-design`, `/library`) continue to work. Filter applies in both expanded and rail-collapsed Sidebar shapes.
- **Canvas default:** Canvas is now first in `ROUTES_MAKE` and the destination of both `path="/"` and the catch-all `path="*"` Navigate routes.
- **Brand sharpening:** `AppMark` SVG now renders the launcher icon's hub-and-spoke geometry (center hub + three outer nodes + spokes), scaled from the 512-px source to the existing 64-px viewBox; `currentColor` lets the existing `text-accent` wrapper drive theme color. The inline boot splash glyph in `index.html` and the inline SVG favicon were updated to match for visual consistency.
- **Tagline:** `APP_TAGLINE` reduced to `'Private by default.'`
- **Developer mode:** new `src/useDevMode.ts` hook with `useDevMode(): { devMode, setDevMode }` backed by the new stored key `verse-studio:dev-mode` (`'true' | 'false'`, default `'false'`). Settings General tab gains an "Experimental" section with one toggle (`data-test="settings-toggle-dev-mode"`). When on, all `defaultHidden` sidebar entries re-appear without reload via a same-window dispatched `StorageEvent`.
- **First-run canvas seed:** new `src/firstRunCanvas.ts` module with `maybeSeedCanonicalCanvas(ws)`. Fires from `App.tsx` once on `ws.ready`. Idempotent via the new marker `verse-studio:canonical-canvas:seeded` (`'true'`). Empty-workspace gated (projects + documents + notes + scraps all zero). On empty workspace, creates the `Nexus Mobile` project, then 9 records (1 document, 6 notes, 2 scraps), then 9 cross-record links, then writes canvas positions to `verse-studio:canvas:positions:{projectId}` using node-id shape `${kind}:${newId}` so Canvas.tsx's nodeIdSet binds correctly. On non-empty workspace, sets the marker without writing.
- **Selector contract:** 645 → 646 unique `data-test` values (delta +1: `settings-toggle-dev-mode`); `data-testid` unchanged at 1. Within the packet-permitted 645 ± 4 envelope.
- **Hard-stop checks passed:** no DB / schema / store / migration changes; `src/diagnosticExporter.ts` and the `vite.config.ts` VERIFICATION-INFRASTRUCTURE region byte-identical; Frozen Four (`db.ts`, `types.ts`, `context.tsx`, `seed.ts`) byte-identical; `Canvas.tsx` byte-identical; `package.json` + `package-lock.json` byte-identical; hidden studio internal code paths (Inbox, Longform, App Design, Library) untouched; no new workspace methods; no direct component-level IDB writes.
- `npm ci`, `npm run typecheck`, and `npm run build` passed. Self-contained artifact: 889.3 KB.

## Sweep 58 implemented state

- `src/nexus/useNexusIndex.ts` is the read-only memoized Nexus query/index layer over workspace context and recent views.
- Nexus Panel now resolves focused-record identity, project membership, links/backlinks, tags, snapshots, conversion lineage, AI lineage markers, canvas placements, orphan status, and display-only suggested connections.
- Focus wiring covers feasible major record surfaces: Writing, Notes, Poetry, Longform documents/sections, Projects project/card/drawer/scrap edits, Canvas project/tile focus, App Design build, Prompt pipeline/block drawers/playground, Inbox editor, and Library pattern selection.
- Scraps route remains a redirect shell; app-design subrecords remain unfocused unless they have stable `LinkableType` identity in a future authorized sweep.

## Open runtime claims

- Sweep 57 DB v11/schema v10 migration behavior over real existing data remains runtime pending.
- Sweep 58 Nexus relational-spine behavior remains runtime pending until owner smoke or a valid diagnostic bundle is relayed.
- Sweep 59 + 59-R visual behavior remains runtime pending until owner smoke/browser or Electron observation.
- Sweep 60 / 60.1 / 60.2 first-run canonical Canvas behavior remains runtime pending until owner smoke and/or a validated diagnostic bundle is supplied.
- Default-to-Nexus correction over populated workspaces remains runtime pending.
- Uploaded pre-60.3 JSON exports are not validation-grade diagnostic bundles because they do not include required `build_commit`, `exporter_self_hash`, nonce, environment, and payload schema.
- `npm audit --audit-level=moderate` still reports 2 moderate vulnerabilities after `npm ci`; no dependency fix is authorized in Sweep 60.3.

## Missing archive gap

Sweep 58 uses a named Orchestrator archive waiver only for this sweep. Missing files:

- `UI_LAYOUT_AND_EDITOR_HISTORY.MD`
- `CROSS_STUDIO_SIGNALS_AND_SELECTORS_HISTORY.MD`
- `CANVAS_PROJECTS_AND_SCRAPS_HISTORY.MD`
- `PROMPT_STUDIO_HISTORY.MD`
- `GOVERNANCE_AND_LANDMINES_HISTORY.MD`

Future sweeps must not reuse this waiver unless a fresh packet explicitly grants it.

## Watch items

- Legacy link `label` vs canonical `relationshipType` remains a source/runtime watch item. Sweep 58 displays `relationshipType || label || 'relates to'` and does not normalize persisted storage.
- `noted-v0.02.html` remains an older root artifact; Sweep 58 did not delete it.
- Suggested connections are display-only. Do not treat them as persisted graph edges without an explicitly authorized write-path sweep.
- Runtime evidence must not be upgraded without owner smoke/bundle validation.

## Next planned sweep

Next allowed work: Gate 59.5 runtime/migration/Nexus/default-to-Nexus trust validation. Sweep 63 must not start until Orchestrator accepts that gate or the owner explicitly accepts the risk of proceeding with runtime claims still unproven. No schema/store/import/export/package changes are pre-authorized here.

## Compaction / consolidation status

Sweep 59 is a UI-only polish sweep, not a schema bump. A consolidation pass is optional; runtime trust work is more important before lineage-writing features proceed.

---

## Sweep 60.1 — Implemented State (2026-05-27)

**Diagnosis:** `src/seed.ts` (Frozen Four) pre-populates a Meridian demo project on every fresh install with records whose IDs are prefixed `seed:`. The previous `maybeSeedCanonicalCanvas()` gate checked for strict emptiness, so it always bailed when Meridian records were present, meaning the canonical Nexus Mobile canvas never landed on a real fresh install.

**Fix:** Replaced the strict emptiness gate in `src/firstRunCanvas.ts` with a "fresh-or-seed-only" gate. The helper `onlySeedOrEmpty()` returns `true` if an array is empty or all its records have `seed:`-prefixed IDs. Added a `verse-studio:canvas:lastProject` write (guarded by absence check) after successful seeding so Canvas defaults to the canonical project, not Meridian.

**build_commit (updated):** `14c3d18978e9a52366741a49badeccdac3c0d34c0df4954f8c7d93df370ff943`

**exporter_self_hash (unchanged):** `ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`

**Files modified:** `src/firstRunCanvas.ts`, `ORCHESTRATION_STATE.MD`, `AI_CODEBASE_HANDOFF.MD`  
**Files new:** `reports/SWEEP60_1_DELIVERY_REPORT.md`

## Open runtime claims (awaiting owner smoke)

- Sweep 57 DB v11/schema v10 migration behavior over real existing data remains runtime pending.
- Sweep 58 Nexus relational-spine behavior remains runtime pending.
- Sweep 59/59-R visual behavior remains runtime pending.
- Sweep 60/60.1/60.2 first-run canonical Canvas behavior remains runtime pending, including Nexus Mobile visibility and lastProject defaulting.
- Default-to-Nexus correction over populated workspaces remains runtime pending.

## Next planned sweep

Gate 59.5 runtime/migration/Nexus/default-to-Nexus trust validation. Sweep 63 only after Orchestrator accepts the gate or owner explicitly accepts the risk of proceeding with runtime claims still unproven.

---

## Sweep 60.2 — Implemented State (2026-05-27)

**Diagnosis:** Two issues combined in one Sonnet sweep per the §9 single-domain literal-patch framework.

(1) `src/data/canonicalCanvas.json` was the placeholder 9-record demo (9 records / 9 links / 9 positions) shipped with Sweep 60. The owner provided the canonical 42-record Nexus Mobile graph (`05_nexus-mobile-canonical-canvas.json`, 42 records / 67 links / 42 positions, schema `canvas-exchange/1`). A file swap was all that was needed — no code changes.

(2) The `verse-studio:canvas:lastProject` write in `src/firstRunCanvas.ts` (added Sweep 60.1) was guarded by `=== null`, which always no-ops because `src/seed.ts:writeMeridianCanvasDefaults()` (Frozen Four, runs at context bootstrap before `maybeSeedCanonicalCanvas`) writes `verse-studio:canvas:lastProject = 'seed:project:meridian'`. The result: Canvas defaulted to Meridian on a real fresh install, never showing Nexus Mobile. The upstream eligibility gate (`onlySeedOrEmpty`) already guarantees no real user data is present when this code path runs, so an unconditional write is correct.

**Fix:** (Task 1) Replaced `src/data/canonicalCanvas.json` byte-for-byte with the canonical 42-record file. (Task 2) Removed the `if (localStorage.getItem(...) === null)` wrapper at lines 197–207 of `src/firstRunCanvas.ts`; the write is now unconditional inside the gate.

**Expected source-level outcome on fully cleared workspace + reload (runtime pending):** Both Meridian and Nexus Mobile should appear in the project switcher; Canvas should open to Nexus Mobile (the canonical relational example) by default once owner smoke or a validated diagnostic bundle confirms it.

**build_commit (historical Sweep 60.2 value; stale for current package after Sweep 60.3 rebuild):** `1822f8eada333ffd742953bd8d6e11c90da1e6e4956c1558396ec85d004e830b`

**exporter_self_hash (unchanged):** `ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`

**Files modified:** `src/firstRunCanvas.ts`, `src/data/canonicalCanvas.json`, `ORCHESTRATION_STATE.MD`, `AI_CODEBASE_HANDOFF.MD`, `dist/*`, `noted-v0.01.html`
**Files new:** `reports/SWEEP60_2_DELIVERY_REPORT.md`

**Spec-conflict flags for Orchestrator:** The §8 "exact replacement block" for Task 2 contains the text `` `=== null` `` and `'verse-studio:canvas:lastProject'` inside comment lines. These cause §11's grep checks ("must return zero matches" / "must return exactly 1 match") to technically fail with comment-only hits (2 matches for the key name; 1 match for `=== null` in comment). The code changes are correct and contain zero `=== null` comparisons and exactly 1 `setItem` call. Orchestrator adjudication requested.
