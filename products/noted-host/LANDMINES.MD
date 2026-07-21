# LANDMINES.MD

### FINAL OUTPUT (apply this)

## How to read this file

This file is no longer a chronological dump. Entries are classified as active invariant, active operational warning, historical warning, resolved conflict, or true unresolved flag. A landmine section from the legacy docs is **not automatically** a current unresolved conflict. Runtime behavior remains **`RUNTIME-UNVERIFIED`** until the Orchestrator validates a diagnostic bundle from this build. (source: Auditor Pass 4 instruction; `AUDITOR_SIGNOFF.MD`, KNOWN DEBT AND UNRESOLVED FLAGS)

## True unresolved flags

- **Bundle ceiling drift.** Historical prompts/docs conflict on bundle-size limits; latest active Orchestrator instruction controls until a new explicit limit is installed.
- **localStorage inventory reconciliation.** Stored localStorage keys/prefixes must remain separated from event-like strings/signals; value types must stay attached to stored keys.
- **Runtime behavior remains `RUNTIME-UNVERIFIED`.** Source/governance evidence does not attest live runtime behavior.
- **Diagnostic exporter v1.1 installed.** `src/diagnosticExporter.ts` is frozen (born frozen Sweep 51). The VERIFICATION-INFRASTRUCTURE region in `vite.config.ts` is co-protected. See new Sweep 51 landmine entry below.
- **Migration install status.** `PREFLIGHT.MD` and `ARCHIVE_INDEX.MD` were absent in the source ZIP and become active only after the Pass 3 outputs are accepted/installed.

## Active invariants that must not drift

## Sweep 39 — UX Trust-Breaker Polish

- Atlas removed from sidebar navigation. Route /atlas stays in App.tsx.
  sidebar-link-atlas selector no longer rendered. Selector count reduced by 2.
- Scraps removed from sidebar navigation. Route /scraps stays in App.tsx.
  sidebar-link-scraps is rendered again after Sweep 49.
- ScrapsStudio: replaced "coming soon" stub with redirect notice (auto-navigates
  to /projects after 1500ms). New selector: scraps-go-to-projects.
- Projects: new-project auto-enters edit mode via defaultEditing prop +
  justCreatedId state. No schema/localStorage changes.
- ScratchDrawer: tab buttons now call e.stopPropagation() to prevent collapse-
  on-action bug. Content area always mounted (opacity toggle instead of conditional
  render) to prevent clipping flash.
- ScratchDrawer: default height clamped to min(360, 40% of viewport height).
- "Feature Library" label → "Library" in sidebar. "Shelf" → "Stash" in sidebar.
- Selector count after Sweep 39: 539.

## Sweep 38 — Nexus Panel MVP

- New file: src/components/NexusPanel.tsx — right-edge relational inspector.
- Mounted in App.tsx Shell as sibling of main content column (right of it).
- localStorage key: verse-studio:nexus-panel:open — 'true'|'false'. SUPERSEDED by Sweep 56-R: missing/invalid/default-upgrade state opens the panel, then respects the persisted user preference.
- Focus mode: data-focus-hide="nexus-panel" added to src/index.css focus-hide rule.
- Panel reads ws.activeRecord (already set by 8 studios — no studio wiring needed).
- resolveProjectId: LongformSection.projectId points to LongformDoc.id not a Project.
  Panel returns null for project membership on longform-section type — correct behavior.
- KIND_LABEL handles all 12 current LinkableType values including Sweep 36 additions:
  'scrap', 'inbox-item', 'prompt'.
- No new IDB stores. No new routes. No studio changes.
- Selector count after Sweep 38: 540.

## Sweep 37 — Convert Anything MVP

- New file: src/utils/convert.ts — pure field-mapping functions, no IDB access.
- New file: src/components/ConvertModal.tsx — preview modal for all conversion pairs.
- New context function: convertRecord — sole write path for conversions.
- routeInboxItemTo extended with 'scrap' case (soft-deletes InboxItem like other routes).
- RouteToButton OPTIONS array extended with { kind: 'scrap', ... }.
- ListItemMenu gains optional extraActions prop — no existing call sites changed.
- Conversions supported: scrap→note, scrap→block(Pattern), inbox→note,
  inbox→scrap, note→section.
- CRITICAL: scrap→block produces a Pattern with type='block' exactly.
- CRITICAL: note→section writes targetDocId into LongformSection.projectId.
- Original records are NOT auto-deleted. User is offered window.confirm after conversion.
  Exception: InboxItem is soft-deleted after routing (consistent with routeInboxItemTo).
- No new IDB stores. No new localStorage keys. No new routes.
- Selector count after Sweep 37: 527.

## Sweep 36 — DB v9 Schema Spine

- Historical note: Sweep 36 introduced early lineage/export concepts. SUPERSEDED as current truth by Sweep 57: DB_VERSION = 11, SCHEMA_VERSION = 10, 28 IDB stores.
- IDB indexes added in v8→v9 migration block. Index names: by_projectId, by_createdAt,
  by_updatedAt, by_deletedAt, by_sourceId, by_targetId, by_recordId. Use
  `store.indexNames.contains(name)` guard in upgrade so re-running is safe.
- New optional fields on all primary record types: isSeedData, convertedFromId,
  convertedFromType, aiLineage. Legacy records lacking them behave as falsy/null defaults.
- Link type now carries: aiLineage, relationshipType, semanticColorId, weight — all optional.
- PromptPipeline now carries outputTarget?: PipelineOutputTarget | null — optional.
- LinkableType expanded to include 'scrap', 'inbox-item', 'prompt'.
- RouteKind expanded to include 'scrap'.
- SemanticColor type declared (schema-only; no IDB store yet; store added in later sweep).
- PipelineOutputTarget union type declared (schema-only; routing UI in later sweep).
- src/db.ts and src/types.ts RE-FROZEN after this sweep delivery.

- Frozen-four files are `src/db.ts`, `src/types.ts`, `src/context.tsx`, `src/seed.ts`. (active invariant; source: `LANDMINES.MD`, Frozen four; invariant A-06)
- DB/export contract is `DB_VERSION = 11`, `SCHEMA_VERSION = 10`, 28 stores, with DB v9/v10 indexes and DB v11 normalization canon documented in PREFLIGHT.MD Section 3.3a. (active invariant; Sweep 57)
- Legacy names stay frozen: `longformProjects` store and `LongformSection.projectId`. (active invariant; source: `LANDMINES.MD`, IndexedDB legacy names; invariant A-07)
- Stored localStorage keys and event-like strings/signals must remain separated. (active invariant plus unresolved reconciliation risk; source: `TRANSITION_READINESS_REPORT.MD`, Literal localStorage key/prefix inventory; invariants A-08, A-09)
- Permanent selectors are contracts. Do not rename `data-test` / `data-testid` literals casually. (active invariant; source: `LANDMINES.MD`, data-test selectors; invariant A-10)
- **Diagnostic exporter is verification infrastructure — treat as frozen.** `src/diagnosticExporter.ts` is frozen (born Sweep 51); any change requires UNFREEZE in the sweep prompt plus a fresh `exporter_self_hash` posted in the delivery. The `vite.config.ts` VERIFICATION-INFRASTRUCTURE region is co-protected. Do not casually rewire either. (active invariant; source: Sweep 51; invariants A-11, A-19, A-20, A-21)
- The single-file pack contract must remain intact. (active invariant; source: `LANDMINES.MD`, Single-file pack contract; invariant A-03)

## Active operational warnings with WHY

- Browser verification needs Playwright/Chromium. Without it, syntax/static checks do not become runtime attestation. WHY: source inspection cannot certify live browser behavior. (source: `LANDMINES.MD`, Browser verification dependency; invariant B-01)
- ZIP extraction can break `node_modules/.bin`. WHY: vendored shims may extract as non-executable/plain text; `vite: Permission denied` can be extraction damage. (source: `LANDMINES.MD`, Zip extraction can break node_modules/.bin; invariant B-02)
- IndexedDB blocked/timeout recovery must show recovery screens before destructive reset. WHY: `DB_BLOCKED` can mean another tab holds the DB open. (source: `LANDMINES.MD`, Sweep 38b bootstrap hardening landmines; invariants B-03, B-04)
- Hydration may tolerate one failed `getAll()` by logging the store and hydrating that slice as `[]`; write failures should still surface. WHY: read-time corruption recovery must not hide data mutation failures. (source: `HANDY_LESSONS.MD`, Sweep 38b; invariant B-05)
- Canvas delete-from-canvas uses hidden placements, not record deletion. WHY: project-linked records are the real content and may be used elsewhere. (source: `LANDMINES.MD`, Sweep 32 canvas landmines; invariants B-06, D-16)
- Clipboard hidden/bin state uses `verse-studio:clipboard:hidden`. WHY: entries remain in IDB until purge, preserving soft-delete behavior. (source: `LANDMINES.MD`, Sweep 5 selector/data landmines; invariant B-07)
- Focus Mode Escape closes ScratchDrawer first. WHY: the drawer is an overlay interaction that should not be orphaned by focus exit. (source: `LANDMINES.MD`, Sweep 34 / v0.03; invariant B-08)
- First-visit collapse hints depend on absence of localStorage keys. WHY: writing the key on mount self-dismisses the hint. (source: `LANDMINES.MD`, Sweep 35 / v0.05; invariant B-09)
- Prompt right-click linking requires capture-phase contextmenu suppression. WHY: bubble-phase suppression is too late on macOS Chrome. (source: `FOR_NEXT_OPUS_5.md`, Architectural patterns; invariant B-10)
- Canvas xyflow node communication uses module-level setters. WHY: xyflow node components need a controlled bridge back to Canvas state. (source: `FOR_NEXT_OPUS_5.md`, Architectural patterns; invariant B-11)

## UI and data warnings that remain active

- Do not convert Projects tabs into filters; they are jump navigation. (invariant C-06)
- Do not remove poem-last ordering after Projects recency sorting. (invariant C-07)
- Do not force Scraps through `AttachedKind` or the polymorphic drawer casually. (invariant C-08)
- Do not reintroduce centered `max-w-[72ch] mx-auto` body wrappers on core editors without explicit product change. (invariant C-09)
- Do not persist Canvas `contentType`; derive it at render time. (invariant A-15)
- Canvas position loaders must accept old `{x,y}` and newer `{x,y,width?,height?}` shapes. (invariant D-17)
- If Canvas inline scrap position save fails after record creation, the Scrap still exists; do not silently roll it back. (invariant D-18)
- Saving Scratch/Clip to Scraps must not clear the scratchpad or mutate/delete the source clipboard row. (invariant D-15)
- Quick Capture default project uses `verse-studio:projects:lastActive`; do not add a parallel default-project key. (invariant D-14)
- Prompt compose drafts stay in the `prompts` store; do not move them into prompt pipelines/blocks or localStorage arrays. (invariants A-12, D-10, D-11)
- Longform body editing maps to `LongformSection`; do not add `LongformDoc.body` just for inline editing. (invariant D-12)

## Resolved conflict notes

- Version conflict: v0.07 wins over older v0.01/v0.02/v0.06 references. (resolved by recency; invariant A-01)
- DB/store conflict: v8 / 28 stores wins over older v5/v6/26-store references. (resolved by recency; invariants A-04, A-05)
- Prompt compose storage conflict: IDB `prompts` store wins over older localStorage-draft notes. (resolved by recency; invariants A-12, D-10)
- Canvas position storage conflict: localStorage Canvas placement wins; `nodePositions` is not Canvas placement storage. (resolved by recency; invariant A-14)
- Scraps state conflict: `scraps` store and Projects row UI are live source/governance state; `/scraps` route remains limited/placeholder per docs. (resolved by recency; invariants A-16, A-17)

## Historical warnings moved to archives

Historical sweep-by-sweep details remain preserved in the Pass 2 archives. Use `ARCHIVE_INDEX.MD` triggers instead of scanning old chronology. (source: Pass 2 archive outputs; invariant A-18)

## Invariant coverage in this staged landmines doc

| ID | Evidence class | Current invariant | Source trace |
|---|---|---|---|
| A-03 | SOURCE-VERIFIED | Single-file packed artifact: npm run build invokes vite build and pack.js; pack must fail if external refs remain. | TRANSITION_READINESS_REPORT.MD — Build and generated artifact expectations; LANDMINES.MD — Single-file pack contract |
| A-06 | SOURCE-VERIFIED | Frozen-four files are src/db.ts, src/types.ts, src/context.tsx, and src/seed.ts. | LANDMINES.MD — Frozen four; AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE |
| A-07 | SOURCE-VERIFIED | Legacy store/field names stay frozen: longformProjects remains store name and LongformSection.projectId points to LongformDoc.id. | LANDMINES.MD — IndexedDB legacy names; CODEBASE_ORIENTATION.MD — Data model checkpoints |
| A-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Active stored localStorage inventory and value types must be preserved. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — Literal localStorage key/prefix inventory |
| A-09 | SOURCE-VERIFIED | Event-like strings are not stored keys: verse-studio:projectContext:change, verse-studio:select, verse-studio:recent-view, verse-studio:scratch-drawer:open-change. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — Literal localStorage key/prefix inventory |
| A-10 | SOURCE-VERIFIED / tests RUNTIME-UNVERIFIED | data-test/data-testid literals are permanent verification contracts; current source scan after Sweep 39 found 539 unique selectors. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; LANDMINES.MD — data-test selectors |
| A-11 | SOURCE-VERIFIED | Diagnostic exporter v1.1 installed as frozen `src/diagnosticExporter.ts` (Sweep 51). `build_commit` and `exporter_self_hash` injected at build time. Runtime upgrades to RUNTIME-ATTESTED after Orchestrator validation. | PREFLIGHT.MD Section 3.5; Sweep 51 landmine entry |
| A-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt compose drafts are IDB-backed Prompt records in prompts store via workspace prompt APIs; old localStorage prompt draft arrays must not be revived. | AI_README.MD — v0.02 Prompt Studio IDB migration; LANDMINES.MD — v0.02 Prompt Studio IDB migration landmines |
| A-14 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas positions are localStorage-backed, not IDB-backed; nodePositions is Atlas-style persisted positions, not Canvas placement storage. | LANDMINES.MD — Calibration Sweep 1 / Sweep 32 canvas landmines; CODEBASE_ORIENTATION.MD — Data model checkpoints |
| A-15 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas contentType is derived at render time and must not be persisted into the position map. | LANDMINES.MD — Sweep 41 / v0.06 Canvas layer-order landmine; HANDY_LESSONS.MD — Sweep 41 / v0.06 lesson |
| A-16 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | scraps is a live IndexedDB store; Scrap.deletedAt is the soft-delete marker; active scraps exclude deleted records. | LANDMINES.MD — Sweep 37 scraps data-layer landmines; HANDY_CODE_SNIPPETS.MD — Scraps data-layer CRUD |
| A-17 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | /scraps route is not equivalent to full Scraps workflow; Projects Scraps UI is live inside Projects rows while /scraps remains limited/placeholder per source docs. | LANDMINES.MD — Sweep 38 Projects Scraps UI landmines; AI_CODEBASE_HANDOFF.MD — Sweep 38 handoff update |
| B-01 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Playwright/Chromium is required for full browser verification; if missing, do not claim runtime verification. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-02 | SOURCE-VERIFIED | ZIP extraction may break vendored node_modules/.bin wrappers; reinstall from lockfile or restore wrappers/execute bits. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-03 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | IndexedDB blocked/timeout recovery: DB_BLOCKED means close old tabs and reload before destructive reset. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-04 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Studio routes must not render before bootstrap status is ready; recovery screens gate blocked/error/loading states. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-05 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Store hydration may tolerate one failed getAll by logging the store and hydrating that slice as []; CRUD failures should not be hidden. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-06 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas hidden-placement set deletes placements without deleting linked workspace records. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-07 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Clipboard soft-delete/bin state uses verse-studio:clipboard:hidden JSON array. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Focus Mode Escape closes open ScratchDrawer first and exits focus only when drawer is closed. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-09 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Absence of collapsible-panel localStorage key is first-visit signal; do not write key on first mount. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-10 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt right-click linking needs capture-phase contextmenu suppressor on data-link-target elements. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| B-11 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas xyflow node-to-Canvas communication uses module-level setters; treat as established workaround. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-01 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Current top-level routes are fixed route inventory; default/fallback goes to Writing. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-02 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Writing, Notes, Poetry, and Longform use native split-list/editor patterns with persistent lists and width/selection keys. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-03 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | TopBar is slim; theme/focus controls live in Sidebar footer; Cmd/Ctrl+. remains reliable focus toggle. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-04 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Quick Capture/ScratchDrawer is global bottom overlay in shell chrome; do not revert to right-side Docker panel without explicit reversal. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-05 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Docker source files may remain on disk even when inactive; presence on disk does not prove active UI. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-06 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Projects type tabs jump to rows; they must not become filters absent explicit reversal. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-07 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Per-project row recency uses localStorage; poems are intentionally forced last after recency sorting. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Scraps participate in Projects row recency and inline editing; do not force Scraps through AttachedKind/project drawer casually. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-09 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | .editor-body-pad is canonical body-writing spacing; do not restore centered max-width wrappers casually. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-10 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Longform alwaysVisible overrides sectionList collapsed; Longform document list intentionally has no collapse control. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-11 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Focus-mode chrome hiding is centralized behind [data-focus-mode="true"]; do not reintroduce conditional unmounting casually. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas layer order: hidden suppression first, derive content type, count layers, then apply layer visibility. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-13 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Inline canvas-created scraps create the Scrap, save scrap:{id} position, then close input/render node. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-14 | SOURCE-VERIFIED | User-facing installer guidance uses install-nexus-icon-current-folder.sh from inside unzipped folder containing package.json. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Soft-deletable records use deletedAt; active arrays exclude soft-deleted records where specified. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-09 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | softDeleteScrap writes deletedAt; purgeScrap hard-deletes from IDB. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-10 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt.deletedAt is soft-delete marker; prompt compose drafts stay in prompts store, not pipelines/blocks. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Longform body editing maps to LongformSection; do not add LongformDoc.body for inline editing. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-14 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Quick Capture default project uses verse-studio:projects:lastActive; do not create a parallel last-project key. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-15 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Saving Scratch/Clip to Scraps must not clear scratchpad body or mutate/delete source clipboard row. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-16 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Delete from canvas removes placement/position and records hidden node id, not linked workspace record. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-17 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas position values may be old {x,y} or newer {x,y,width?,height?}; loaders must accept old entries. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-18 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | If Canvas inline scrap position save fails after record creation, Scrap still exists and may later appear unpositioned/default-grid. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-02 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Bootstrap signals include openWorkspaceDB, probeIndexedDB, versions, bootstrap status/errors and recovery screens. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-04 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas operational prefixes include positions, hidden, layers, editor-drafts. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-05 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt operational prefixes include blockMeta, pipelineSteps, pipelineVars, pgPos, pipelinePreview. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-06 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Cross-studio event signals include select, recent-view, projectContext:change, scratch-drawer open-change, open-pattern-playground. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-07 | SOURCE-VERIFIED / tests RUNTIME-UNVERIFIED | Selector examples requiring preservation include doc-body, poem-body, prompt-body, canvas-layer-panel, bootstrap screens, and related selectors. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-09 | SOURCE-VERIFIED | Installer file signals include install-nexus-icon-current-folder.sh and versioned installer scripts. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |

## Active packaging warning — Nexus Notes v0.01 installer

- The user-facing app name is now **Noted v0.01**, but persisted localStorage keys intentionally remain `verse-studio:*`; do not rename them without a deliberate migration.
- Every full codebase ZIP delivery should keep the existing Fedora-compatible installer (`install-nexus-notes-v0.01-3-fedora.sh`), `reset-nexus-notes-v0.01-data.sh`, `NEXUS_NOTES_INSTALL_COMMANDS.MD`, `NEXUS_NOTES_V0.01-3_INSTALL.MD`, icon assets, built artifacts, and `ZIP_DELIVERY_RULE.MD` current with the delivered app name/version. Do not invent a new packaging stack unless the Orchestrator explicitly asks for a dedicated packaging sweep.
- The Electron installer installs a runtime into `~/.local/share/nexus-notes-v0.01`; it is packaging infrastructure, not a change to the app's IndexedDB schema.

## Nexus Notes v0.01 stable Electron packaging hotfix — 2026-05-23

- Electron shell now pins its Chromium profile/userData path to `~/.config/nexus-notes-v0.01` via `electron/main.cjs`. This isolates stable Nexus Notes v0.01 from older Nexus Verse / early wrapper attempts and avoids stale IndexedDB profile conflicts. This is an Electron wrapper profile path only; it does **not** rename the governed app `DB_NAME` (`verse-studio`) or `verse-studio:*` localStorage/storage keys.
- Installer now backs up old Electron profile folders (`~/.config/nexus-notes-v0.01` and legacy `~/.config/Nexus Notes v0.01`) into `~/.config/nexus-notes-v0.01-backups/` before launch so v0.01 boots cleanly. Exported workspace `.json` backups are unaffected.
- Desktop launcher now uses icon name `nexus-notes-v0.01`, installs SVG plus 64/128/256/512 PNG hicolor icons, and launches Electron with `--class=nexus-notes-v0.01` so GNOME app drawer / window matching is more reliable.
- Added `reset-nexus-notes-v0.01-data.sh` and `nexus-notes-v0.01-reset` for user-approved profile reset if the bootstrap screen reports “The workspace could not be loaded.”
- Historical packaging note: at that hotfix point, no IndexedDB schema/store/localStorage contract changed (`DB_VERSION = 8`, `SCHEMA_VERSION = 8`, 28 stores). Current schema truth is DB v9 / schema v9 after Sweep 36. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED` until browser/Electron verification is actually performed.



## Nexus Notes v0.01 Prompt Studio block-type landmine — 2026-05-23

Prompt Studio blocks are first-class summonable blocks only when their `Pattern.type` is exactly `block`. Do not treat that field as a user-facing taxonomy/category field. If it is changed away from `block`, the record may stop appearing in the Blocks rail and pipeline picker. The v0.01 block hotfix locks this field read-only in the block drawer and leaves categorization/tagging to existing tags/metadata surfaces. No DB/schema/storage contracts changed.


## Sweep 30 — ScratchDrawer polish + Electron maximize — 2026-05-23

- Electron now starts maximized: `electron/main.cjs` calls `win.maximize()` after `win.setMenuBarVisibility(false)` inside `createWindow()`.
- ScratchDrawer header behavior changed: the chevron/`Scratchpad` label is the only toggle button; tab buttons are siblings, so tab clicks no longer depend on `stopPropagation()` and should not collapse the drawer.
- ScratchDrawer open height is now user-resizable and persisted in localStorage at `verse-studio:scratch-drawer:height` as an integer pixel value; default `360`, minimum `160`.
- New permanent selector: `data-test="scratch-drawer-resize"`. Current source scan after Sweep 35 found 516 unique `data-test` / `data-testid` selector values.
- Implementation verified in source; runtime remains `RUNTIME-UNVERIFIED` because no diagnostic exporter/bundle exists.

## Sweep 31 — PromptStudio ghost text + block copy + pipeline UX — 2026-05-23

- `src/index.css` now suppresses Wayland/Electron transparent-text ghosting for the HighlightedEditor by adding `[data-test="prompt-body"]::selection` with transparent selected text and an accent-soft selection background.
- `src/studios/prompts/PromptStudio.tsx` block-library cards now expose a group-hover copy action for each block body with `data-test="prompts-library-card-copy"` and a short copied/failed flash state; the click stops propagation so it does not insert the card.
- Prompt pipeline empty state now shows a clearer `No steps yet` prompt plus `data-test="pipeline-empty-add"`; the existing add button is always visible as `＋ Add block` under `data-test="pipeline-add-step"`.
- Pipeline steps container is now a block-library drop target via `data-test="pipeline-drop-zone"`; dropped block text creates a NOTE step through the existing localStorage-backed pipeline step path.
- New permanent selectors: `prompts-library-card-copy`, `pipeline-empty-add`, `pipeline-drop-zone`. Current source scan after Sweep 35 found 516 unique `data-test` / `data-testid` selector values.
- No Frozen Four files changed. No IndexedDB schema/store contract changed. Existing `verse-studio:prompts:pipelineSteps:{pipelineId}` keeps the same JSON pipeline step array contract. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 32 — AppMark / Electron icon guardrails — 2026-05-23

- Keep `AppMark` as a subtle watermark-style SVG, not a badge: do not reintroduce `border-line`, `shadow-sm`, or `bg-surface-3` around the mark unless a future sweep explicitly reverses the visual direction.
- Linux/GNOME/Wayland icon matching needs multiple layers in `electron/main.cjs`: keep `app.setDesktopName(`${APP_ID}.desktop`)`, the `WaylandWindowDecorations` feature flag, `app.setIcon(icon)`, and `win.setIcon(icon)` together unless a future Electron packaging sweep replaces the strategy.
- This sweep did not change storage/schema/selectors. Runtime icon behavior is still `RUNTIME-UNVERIFIED` until tested in the installed Electron shell.


## Sweep 33 Canvas placement race landmine — 2026-05-24

- Canvas records-sync can run immediately after workspace state changes. If a Canvas position is not already present, a new project-scoped node may fall back to `gridPosition(...)` before caller-side placement code runs.
- New note creation avoids this by saving `note:{id}` to `verse-studio:canvas:positions:{projectId}` before `updateNote(..., { projectId })` exposes the note to Canvas records sync.
- Inline scrap creation cannot pre-save by final id because `createScrap` owns id generation, so Sweep 33 uses a post-placement correction: write `scrap:{id}` to the Canvas position map, then force the matching node position even if the sync effect already created it at grid position.
- Do not remove this correction unless `createScrap` becomes able to accept a caller-supplied id or Canvas gains a dedicated pending-position mechanism. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 34 Prompt Studio unified-editor landmines — 2026-05-24

- `verse-studio:prompts:view` is retired. Do not reintroduce reads/writes to it when adding Prompt Studio UI state; use a new documented key only with Orchestrator approval.
- The first pipeline block is the compose editor. Editing it mutates the underlying `Pattern` record, so changes propagate anywhere that block is reused. Non-first block editing still uses `BlockEditDrawer`.
- Empty-pipeline draft mode creates the first Pattern/step on blur or Ctrl/Cmd+Enter. Avoid adding another draft persistence layer; that would conflict with the unified editor model.
- Runtime behavior remains `RUNTIME-UNVERIFIED`; source checks prove implementation only.


## Sweep 35 Stash landmines — 2026-05-24

- Stash is a browser for `ws.snapshots`, not a new persistence model. Do not add an IDB store or move shelf bookmark rows to snapshots without an explicit schema sweep.
- The `/shelf` route and `Shelf` export name remain for route compatibility even though the user-facing heading is `Stash`.
- Stash restore support intentionally mirrors `Snapshots.tsx`: document, poem, note, longform, build, pipeline, and project. Other `LinkableType` values must degrade safely instead of assuming a route or restore handler.
- Stash does not support scraps until ScrapsStudio is built and frozen-four adds `scrap` to snapshot recordType.
- Runtime behavior remains `RUNTIME-UNVERIFIED`; source code checks do not prove browser restore/open behavior.

## Sweep 40 — Diagnostic Exporter + Workspace Health MVP

- DiagnosticPanel reads ws.* arrays and DB_VERSION/SCHEMA_VERSION constants.
  It is read-only — no IDB writes, no localStorage writes, no state mutation.
- WorkspaceHealthPanel uses useNavigate() — it requires being inside a Router.
  Settings renders inside App.tsx Routes, so this is safe. Do not render
  WorkspaceHealthPanel outside the Router context.
- Project has no deletedAt field. emptyProjects check does not filter by
  deletedAt — this is correct; projects are not soft-deletable in current schema.
- Scrap has no title field. orphanScraps example uses body preview. This is
  correct per the Scrap type definition.
- 'scrap' is not in JumpableKind/ROUTE_FOR_TYPE. The orphanScraps Open button
  navigates to /projects (where scraps live in project rows) rather than using
  jumpToSelection. Do not add 'scrap' to ROUTE_FOR_TYPE without a deliberate
  navigate.ts sweep.
- Settings tab bar uses border-b-2 with border-accent for active state. The
  General tab gets data-test="settings-tab-general" — this is a new selector
  on an existing UI element. It does not change existing behaviour.
- Diagnostic summary (Copy button) contains no record bodies or titles.
  Only counts, key presence booleans, and schema versions. Privacy preserved.
- Selector count after Sweep 40: 556.

## Sweep 41 — Rich Demo Seed (Meridian)

- src/seed.ts UNFROZEN and replaced. Re-frozen after this sweep.
- Export name `seedPlaceholder` preserved — context.tsx calls it in two places.
- New export: `resetSeedData()` — called from Settings, not from context.
- All seed IDs hardcoded as `S.*` constants. Never use id() / Date.now() for seed records.
- Fixed timestamp T = 1735689600000 (2025-01-01T00:00:00Z). Deterministic for testing.
- isSeedData: true on all records that have the field (primary types).
- AppDesignConstraint and AppDesignFeature do NOT have isSeedData — resetSeedData()
  handles their deletion via known IDs in Pass 2. Same for Tag, TagLink, Snapshot.
- AppDesignConstraint field is `text` (not `statement`). Required fields: text, challenged,
  why, order. No createdAt/updatedAt on this type.
- AppDesignFeature.status must be FeatureStatus: 'spec'|'building'|'working'|'broken'|'cut'.
  Not 'Draft'. Seeded as 'spec'.
- AppDesignBuild requires `status: BuildStatus` ('drafting'|'in-build'|'shipped'|'abandoned')
  and `platform: string`. Both required, not optional.
- Snapshot.data is a JSON string (the record body at capture time), NOT a body field.
  Snapshot has no isSeedData, no updatedAt. recordType is LinkableType.
- Tag has no isSeedData field. TagLink has no isSeedData field.
- LongformSection.projectId = S.longformDoc — points to LongformDoc.id, not Project.id.
  This is correct. See permanent LANDMINES entry.
- Pattern.type = 'block' exactly — required for Prompt Studio block rail. See LANDMINES.
- links carry relationshipType (Sweep 36 field) — 'informs', 'guides', 'relates-to'.
- Settings.tsx: DemoResetSection added to General tab. Calls resetSeedData() directly
  (not via context). Reloads window after success to rehydrate context.
- Selector count after Sweep 41: 560.


## Sweep 42 landmine — Signal Console must stay read-only

- Signal Console is inspection chrome only. Do not add repair, delete, reset, import, export, clear, migrate, or IndexedDB live-query controls to it unless a future Orchestrator prompt explicitly changes scope.
- Storage tab must continue to discover keys dynamically with the `verse-studio:` prefix; do not copy the old hardcoded DiagnosticPanel key list into Signal Console.
- Health-signal computation is shared through `src/util/healthSignals.ts`. Keep `WorkspaceHealthPanel` and Signal Console on that shared path rather than duplicating the logic.
- `meta` has no workspace context array. Do not invent a `meta` row count in Schema tab without changing the context/storage contract under explicit scope.


## Sweep 43 landmine — lineage source type is StoreName

- In Nexus Panel lineage, `convertedFromType` is a `StoreName`, not a `LinkableType`. Keep the explicit `STORE_TO_ARRAY` mapping in `src/components/NexusPanel.tsx`; do not infer stores from link labels or route names.
- Preserve the 5-hop maximum and `visited` cycle guard. A bad imported chain must not be able to hang the panel.
- Soft-deleted ancestors are still lineage evidence. Keep them visible, labeled `(deleted)`, reduced opacity, and non-clickable.

## Sweep 44 landmine — Compile Panel is export-only

- Compile Panel may persist only `verse-studio:compile:author` in localStorage and may trigger a Markdown file download. Sweep 45 additionally authorizes status-only `updateSection` writes from the Compile Panel status picker; include/exclude remains local panel state and must not be persisted.
- Section rows and word counts are intentionally snapshotted when the panel opens, not kept live-reactive while editing.
- Reuse `src/util/download.ts` for `downloadText()` and `safeFilename()`; do not introduce a second filename sanitizer.


## Sweep 45 landmine — status is optional and draft-defaulted

- Do not treat missing `LongformSection.status` as corrupt data. Undefined means `draft`.
- Do not rewrite all section rows to populate status. DB v10 only adds `longformSections.by_status`; export/import schema remains v9.
- Do not move status controls into the main Longform editor without explicit future scope.


## Sweep 46 landmine — Atlas upgrade is plumbing, not a graph migration

- Atlas remains the hand-rolled SVG graph. Do not introduce ReactFlow, a new graph engine, topology export, Nexus Packets, AI import zones, Ollama bridges, or SemanticColor stores/UI without explicit future scope.
- `semanticColorId` on links is read but cannot resolve to a real color until a SemanticColor store exists; unresolved edge color must fall back to `var(--line)`.
- AI lineage nodes are marked with a neutral second accent ring only. Do not convert this into warning badges, alert colors, or suspicion language.

## Sweep 47 landmine — release QA is not a feature sweep

- Release QA must not add product features. Keep rich text, SemanticColor persistence/UI, topology export, Nexus Packets, Ollama bridge, ReactFlow migration, AI import zones, and connected-records-only Atlas defaults out unless a future sweep explicitly scopes them.
- The selector count in Signal Console is a hardcoded source/build constant (`619` after Sweep 50), not a live DOM query. Update it only after running the mandated canonical selector grep.
- Self-contained HTML claims require exact post-build greps on `verse-studio.html`; source/build success alone does not prove the artifact is self-contained.

## Sweep 48 landmine — ScratchDrawer must stay in normal flex flow

- Do not reintroduce outer `absolute bottom-0` positioning on `ScratchDrawer` without a dedicated layout sweep. It caused the collapsed 28px bar to be clipped or misplaced until a resize recalculation.
- Scratchpad's Save-as-scrap bar overlays the editor; keep sufficient textarea bottom clearance and an opaque surface background so typed text cannot bleed through underneath.

## Sweep 49 — App identity, Focus key, Scraps sidebar — 2026-05-25

User-facing app identity is now **Noted v0.01**: `APP_NAME = 'Noted'`, `APP_TAGLINE = 'Private by default. Relational by design. Portable by right.'`, and diagnostic copy reports `Noted v0.01-3`. `APP_VERSION`, `APP_TITLE`, `APP_STORAGE_PREFIX`, installer script names, Electron identifiers, DB name, and `verse-studio:*` compatibility storage contracts remain unchanged. Global Search no longer captures `/`; Focus Mode uses `/` as an additional non-input shortcut while preserving Cmd/Ctrl+`.`. Scraps is visible in Sidebar again with `sidebar-link-scraps`; `/scraps` routing and ScrapsStudio behavior remain unchanged. Canonical `data-test` selector count is 619, separate `data-testid` count remains 1. No DB/schema/migration/Frozen Four/installer-stack changes. Runtime remains `RUNTIME-UNVERIFIED`.



## Sweep 50 — Prompts Studio UX overhaul

Prompt Studio received a focused UX pass in `src/studios/prompts/PromptStudio.tsx`: user-facing Pipeline copy now reads Prompt where appropriate, the left rail has a Prompts heading, description and variables are collapsed by default via local `useState`, block-library inserts flash the clicked card, the duplicate Materialize action is removed, export/save-as-block actions live in a `⋯` menu, and the first-block write area has a hover copy button. No new localStorage keys, DB/schema/migration changes, Frozen Four touches, or installer-stack changes. Current canonical `data-test` selector count is 619; separate `data-testid` count remains 1. Signal Console selector count constant is `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 51 — Diagnostic bundle exporter is verification infrastructure

`src/diagnosticExporter.ts` and the `vite.config.ts` VERIFICATION-INFRASTRUCTURE region are jointly frozen. The following rules apply permanently:

a) `src/diagnosticExporter.ts` is frozen. Any change requires explicit UNFREEZE in the sweep prompt, a code citation showing what changed, a before/after schema comparison, and a fresh `exporter_self_hash` value posted in the delivery.

b) The `vite.config.ts` VERIFICATION-INFRASTRUCTURE region (delimited by `// BEGIN VERIFICATION-INFRASTRUCTURE` / `// END VERIFICATION-INFRASTRUCTURE`) is co-protected with the same freeze rules as `src/diagnosticExporter.ts`.

c) `build_commit` (Algorithm 1) and `exporter_self_hash` (Algorithm 2) algorithms must match exactly between the Maintainer's build and the Orchestrator's independent verification. Algorithm updates require same-sweep updates to `HANDY_CODE_SNIPPETS.MD` reference. The Orchestrator rejects bundles whose hashes do not match its reference values.

d) Bumping `schema_version` (integer `1` in the current bundle) requires explicit Orchestrator approval. It is a breaking change to the validation contract.

e) Do not switch nonce generation to `Math.random()` or any non-cryptographic source. Nonce must use `crypto.getRandomValues()`.

f) An instrument you can quietly rewire is not an instrument. The whole point is that the Orchestrator can independently verify every bundle. Do not compromise that.

Reference hash values for this build:
- `exporter_self_hash`: `ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`
- `build_commit`: `d6e269b97f142d9ad3c9392286d27465c1a30e036723025ab16c7bca12b7a94b`


## Sweep 52 — Noted rebrand: installer and icon naming contracts

The canonical installer is now `install-noted-v0.01-fedora.sh` with `APP_ID=noted-v0.01`. The Electron `userData` path is `~/.config/noted-v0.01`. Do not confuse this with the old `nexus-notes-v0.01-3` userData path or the internal IDB `DB_NAME` (`verse-studio`) and `verse-studio:*` localStorage prefix — those are compatibility contracts that did NOT change. Future sweeps that touch the installer must keep `APP_ID`, icon names, and install paths consistent with `noted-v0.01`. The legacy `install-nexus-notes-v0.01-3-fedora.sh` is retained for reference only.

## Sweep 54 — Noted surfacing landmines

- Atlas, Scraps, and Poetry are hidden from primary Sidebar navigation but their routes remain mounted in `src/App.tsx`. Do not delete those route components when adjusting navigation.
- Meridian seed idempotency is based on `seed:project:meridian`. Boot seeding must skip if that project exists, so deleted demo content is not resurrected by ordinary app startup.
- Canvas defaults for Meridian use existing localStorage keys only: `verse-studio:canvas:lastProject` and `verse-studio:canvas:positions:seed:project:meridian`. Do not move Canvas placement into the `nodePositions` IDB store.
- Copied history is captured from DOM `copy` events in capture phase and stored in `dockerClipboard`. Do not reintroduce `navigator.clipboard.readText()` or polling. One-click re-copy may use `navigator.clipboard.writeText()` because it is user-initiated.

## Sweep 55 landmine — missing archive waiver

ARCHIVE WAIVER USED for Sweep 55 only. `ARCHIVE_INDEX.MD` references `PERSISTENCE_SCHEMA_AND_STORAGE_HISTORY.MD`, `UI_LAYOUT_AND_EDITOR_HISTORY.MD`, and `BOOTSTRAP_PACKAGING_AND_VERIFICATION_HISTORY.MD` for this theme/storage/bootstrap scope, but those archives are unavailable because the project was ported into the current orchestration system midstream. Future archive reconstruction should prioritize theme/localStorage/index.html first-paint history. Compatibility mitigation preserved legacy `verse-studio:theme` raw values (`dark`→`midnight`, `light`→`paper`, invalid/missing→`matrix`).

## Sweep 55-G — publication gate landmines

- Considering GitHub publication is OWNER-CANON [DIRECT], but it is not publish authorization. Do not claim public-release readiness until owner decisions, license choice, security/private-content review, runtime attestation status, and final go/no-go are complete.
- `package.json` must remain `private: true` unless explicitly authorized; GitHub source visibility and npm publication are separate.
- Public-facing `README.md` and `NOOB_GUIDE.MD` must stay beginner/technical-reader oriented and must not absorb AI relay history or governance dumps.
- Legacy `nexus-notes` installer/docs remain naming debt; do not rename/remove them without an explicit installer identity sweep.

## Sweep 56 — AI brief / focus / branding landmines

- AI Brief Export is export-only. Do not add import, writeback, DB mutation, network, external AI calls, API keys, or schema migrations under this feature without a new Orchestrator packet.
- AI Brief JSON may contain private snippets. The UI may say the download does not send data anywhere, but maintainers must not claim exported files are safe to share.
- FocusContext is ephemeral UI focus. Do not store it in localStorage/IDB or turn it into a data ownership layer.
- Nexus Panel remains the feature name. Do not rename it during Noted branding polish.
- `APP_TAGLINE` is user-facing only. Do not change `noted-v0.01`, `verse-studio:*`, DB/schema, package manifests, or installer identity as part of tagline work.


## Sweep 56-R — Nexus Panel default-open landmine

- OWNER-CANON [DIRECT]: Nexus Panel is core UX and should be open by default. The older collapsed-by-default behavior is superseded.
- Preserve `verse-studio:nexus-panel:open` as the user preference key and `verse-studio:nexus-panel:default-open-applied` as the one-time default-open migration marker. Do not rename these keys without explicit authorization.
- The panel remains collapsible and must still hide in Focus Mode via `data-focus-hide="nexus-panel"` / `src/index.css`.


## Sweep 57 — DB v11 schema landmines

- Do not add a new store for semantic colors in DB v11; Semantic Color Engine/store remains deferred.
- Do not add `aiMeta`; it is reserved for a later phase.
- Do not bulk-rewrite existing rows or compute persisted `contentHash` for every user record during upgrade. v11 defaults normalize at read/write/import boundaries.
- `relationshipType` is canonical storage for links. `label` remains export alias/backcompat fallback; removing it abruptly would break old data and UI assumptions.
- `schemaVersion: 10` workspace exports must remain import-compatible with older schemas up to 10. Do not reject v9 backups unless a real incompatibility is proven.


## Sweep 58 — named archive waiver and runtime boundary

- Orchestrator granted a named archive waiver for Sweep 58 only. Missing archive files: `UI_LAYOUT_AND_EDITOR_HISTORY.MD`, `CROSS_STUDIO_SIGNALS_AND_SELECTORS_HISTORY.MD`, `CANVAS_PROJECTS_AND_SCRAPS_HISTORY.MD`, `PROMPT_STUDIO_HISTORY.MD`, `GOVERNANCE_AND_LANDMINES_HISTORY.MD`.
- This waiver does not generalize to later UI/focus/Nexus/Canvas/Prompt/Projects work. Future sweeps must use `ARCHIVE_INDEX.MD` normally unless a fresh packet grants a specific waiver.
- Sweep 58 intentionally made no DB/schema/store/import/export/package/dependency changes and did not edit `src/diagnosticExporter.ts`, `src/db.ts`, migrations, or package manifests.
- Nexus suggested links are display-only relationship hints. They must not be treated as persisted graph edges unless a future authorized sweep writes explicit links through context APIs.
- Runtime remains `RUNTIME-UNVERIFIED`; source/build evidence proves implementation shape only. Owner smoke and/or a validated diagnostic bundle is required before upgrading runtime claims.
- Legacy link `label` vs canonical `relationshipType` remains a watch item. Sweep 58 displays `relationshipType || label || 'relates to'` and does not normalize persisted link storage.
