# AI_CODEBASE_HANDOFF.MD

### FINAL OUTPUT (apply this)

## Session posture

This file is the lean operational handoff for **Noted v0.01**, renamed from the pre-transition Nexus Verse Studio v0.07 line. It is source/governance truth, not runtime attestation. Sweep 56-R Nexus Panel runtime is **`RUNTIME-ATTESTED [OWNER]`**; Sweep 57 migration/runtime checks remain **`RUNTIME PENDING`** until the new artifact is launched over existing data. Sweep 58 Nexus relational-spine work is source/build verified here and runtime pending. Diagnostic exporter status is **PRESENT — v1.1 validation-grade** (`src/diagnosticExporter.ts`, frozen, Sweep 51). Storage keys intentionally keep the legacy `verse-studio:*` prefix. (source: post-Pass-5 branding/package sweep; invariants A-01, A-08, A-11, A-19, A-20, A-21)

## Required reading order for maintainers

1. `PREFLIGHT.MD` in full.
2. `ARCHIVE_INDEX.MD` to determine archive triggers.
3. Archives named by the Orchestrator.
4. Source files directly touched by the sweep.
5. This handoff for net-state orientation.

## Current route inventory

`/inbox`, `/writing/*`, `/notes/*`, `/poetry/*`, `/longform/*`, `/app-design/*`, `/projects`, `/prompts`, `/canvas`, `/atlas`, `/library`, `/shelf/*`, `/scraps`, `/settings`; default/fallback routing goes to Projects. Primary Sidebar order is Projects, Inbox, Writing, Notes, Canvas, Longform, App Design, Prompts, then Library, Stash, Settings. Atlas, Scraps, and Poetry remain deep-linkable but hidden from primary navigation. (source: Sweep 54; invariant C-01)

## Frozen-four and high-risk files

Frozen-four files: `src/db.ts`, `src/types.ts`, `src/context.tsx`, `src/seed.ts`. Modify only with explicit schema/state/API/seed scope. (source: `LANDMINES.MD`, Frozen four; invariant A-06)

High-risk read targets before relevant edits: `src/db.ts`, `src/types.ts`, `src/context.tsx`, `src/seed.ts`, `src/App.tsx`, `src/components/Sidebar.tsx`, `src/studios/prompts/PromptStudio.tsx`, `src/studios/canvas/Canvas.tsx`. (source: `CODEBASE_ORIENTATION.MD`, Load-bearing files; invariant E-01)


## Sweep 58 current Nexus/focus state

- `src/focus/FocusContext.tsx` remains the ephemeral current-record focus source. Do not persist it or move it into workspace context.
- `src/nexus/useNexusIndex.ts` is the memoized relational query layer over `useWorkspace()` data plus recent views; keep future Nexus sections there rather than re-scanning stores inside JSX.
- Nexus Panel surfaces identity, focus origin/time, project membership, outgoing/incoming links, tags, snapshots, conversion/AI lineage, canvas placements, orphan status, and suggested connections. Suggested connections are display-only; no automatic link writes.
- Feasible focus coverage now includes Writing, Notes, Poetry, Longform doc/section, Projects project/card/drawer/scrap, Canvas project/tile, App Design build, Prompt pipeline/block, Inbox item, and Library pattern. Scraps route is still a redirect shell; app-design subrecords are not linkable records.
- Runtime status for Sweep 58 remains `RUNTIME-UNVERIFIED` until owner smoke/bundle evidence is accepted.

## IndexedDB active contract

`DB_VERSION = 11`; `SCHEMA_VERSION = 10`. Import accepts `schemaVersion <= SCHEMA_VERSION` and migrates/normalizes on import. DB v9 adds explicit indexes for project membership, chronological sort, recency, soft-delete, backlinks, and per-record snapshots; DB v10 adds `longformSections.by_status`; DB v11 formalizes lineage/AI/export relationship defaults without adding stores; see `PREFLIGHT.MD` Section 3.3a. (source: `src/db.ts`; invariants A-04, D-01, D-05 updated by Sweep 57)

| Store | Key path | Notes |
|---|---|---|
| `meta` | `key` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `writingDocs` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `poems` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `longformProjects` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `longformSections` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `appDesignBuilds` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `appDesignConstraints` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `appDesignFeatures` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `appDesignScreens` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `appDesignDataShapes` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `appDesignPhases` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `appDesignReviews` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `shelf` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `projects` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `links` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `tags` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `tagLinks` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `dockerScratch` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `dockerClipboard` | `id` | Clipboard/Copied history; app-level DOM copy capture writes copied text here. DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `snapshots` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `patterns` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `promptPipelines` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `promptBlocks` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `inboxItems` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `nodePositions` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `notes` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `scraps` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |
| `prompts` | `id` | DB v9 indexes apply where listed in `PREFLIGHT.MD` Section 3.3a. |

Historical migration constraints preserved: legacy shelf `type === 'project'` meant longform and migrates to `type === 'longform'`; `Pattern.tags` chip strings backfill into relational `tags` / `tagLinks`; post-v3 schema bumps are additive unless explicitly stated: v4 `inboxItems` / `nodePositions`, v5 `notes`, v6 recovery bump, v7 `scraps`, v8 `prompts`. (source: `CODEBASE_ORIENTATION.MD`, Data model checkpoints; invariants D-02, D-03, D-04)

Legacy names stay frozen: `longformProjects` remains the store name; `LongformSection.projectId` points at `LongformDoc.id`. (source: `LANDMINES.MD`, IndexedDB legacy names; invariant A-07)

## Stored localStorage keys and value types

These are stored values, not events. Keep key names and value types attached. (source: `TRANSITION_READINESS_REPORT.MD`, Literal localStorage key/prefix inventory; invariant A-08)

| Stored key / prefix | Value type | Owner / notes |
|---|---|---|
| `verse-studio:theme` | 'light' | 'dark' | Theme UI. |
| `verse-studio:focus` | 'true' | 'false' | Focus mode state. |
| `verse-studio:sidebar:collapsed` | 'true' | 'false' | Sidebar collapsed state. |
| `verse-studio:scratch-drawer:open` | 'true' | 'false' | ScratchDrawer open state; also mirrored by event-like open-change signal. |
| `verse-studio:scratch-drawer:tab` | drawer tab id string | ScratchDrawer selected tab; `clip` renders as the visible Copied tab. |
| `verse-studio:scratch-drawer:height` | number (integer px, default 360) | ScratchDrawer resize — persisted drawer open height. |
| `verse-studio:docker:collapsed` | 'true' | 'false' | Legacy Docker collapsed state; source files may remain inactive. |
| `verse-studio:docker:state` | JSON Docker state object | Legacy Docker state. |
| `verse-studio:docker:scratchpad:activeId` | record id string | Docker scratchpad active id. |
| `verse-studio:clipboard:hidden` | JSON array of hidden clipboard ids | Clipboard soft-hide/bin state. |
| `verse-studio:projectContext` | JSON project context object | Current project context side state. |
| `verse-studio:recent-views` | JSON recent-view array | Recent records; dedupe newest-first. |
| `verse-studio:writing:lastDoc` | record id string | Writing selected document. |
| `verse-studio:writing:listWidth` | number string | Writing list width. |
| `verse-studio:poetry:lastPoem` | record id string | Poetry selected poem. |
| `verse-studio:poetry:listWidth` | number string | Poetry list width. |
| `verse-studio:notes:lastSelected` | record id string | Notes selected note. |
| `verse-studio:notes:listWidth` | number string | Notes list width. |
| `verse-studio:longform:lastDoc` | record id string | Longform selected document. |
| `verse-studio:longform:lastSection` | record id string | Longform selected section. |
| `verse-studio:longform:listWidth` | number string | Longform list width. |
| `verse-studio:longform:sectionList:collapsed` | 'true' | 'false' | Longform section-list collapsed state. |
| `verse-studio:longform:sectionList:alwaysVisible` | 'true' | 'false' | Overrides Longform section-list collapsed state. |
| `verse-studio:compile:author` | string | Compile Panel author field for Markdown export. |
| `verse-studio:appdesign:lastBuild` | record id string | App Design selected build. |
| `verse-studio:appdesign:lastTab` | tab id string | App Design selected tab. |
| `verse-studio:projects:lastProject` | record id string | Projects selected project. |
| `verse-studio:projects:lastActive` | record id string | Last active project; used by Quick Capture defaulting. |
| `verse-studio:projects:sidePanel` | side-panel id string | Projects side panel state. |
| `verse-studio:projects:notesOpen` | 'true' | 'false' | Projects notes panel state. |
| `verse-studio:projects:qcKind` | quick-capture kind string | Projects quick-capture kind. |
| `verse-studio:projects:{projectId}:lastType` | record/row type string pattern | Projects row recency; poems intentionally sort last after recency. |
| `verse-studio:prompts:view` | RETIRED view id string | RETIRED — no longer read or written; retired Sweep 34. Existing stored values are ignored. |
| `verse-studio:prompts:blockLibrary:collapsed` | 'true' | 'false' | Prompt block-library collapse state. |
| `verse-studio:prompts:lastPipeline` | record id string | Prompt Studio selected pipeline. |
| `verse-studio:prompts:blockMeta` | JSON block metadata object | Prompt block metadata side-state. |
| `verse-studio:prompts:pipelineSteps:{pipelineId}` | JSON pipeline step array | Prompt pipeline helper state. |
| `verse-studio:prompts:pipelineVars:{pipelineId}` | JSON variable object | Prompt pipeline variable side-state. |
| `verse-studio:prompts:pgPos:{focusId}` | JSON graph position map | Prompt graph positions. |
| `verse-studio:prompts:pipelinePreview` | 'true' | 'false' | Prompt preview toggle. |
| `verse-studio:canvas:lastProject` | project id string | Canvas selected project; first Meridian seed writes `seed:project:meridian`. |
| `verse-studio:canvas:positions:{projectId}` | JSON map nodeId -> {x,y,width?,height?} | Canvas placement storage; not the nodePositions IDB store. |
| `verse-studio:canvas:hidden:{projectId}` | JSON array of hidden node ids | Canvas placement hide/delete-from-canvas state. |
| `verse-studio:canvas:layers:{projectId}` | JSON LayerVisibility booleans | Canvas layer visibility state. |
| `verse-studio:canvas:layerPanel:collapsed` | 'true' | 'false' | Canvas layer panel collapsed state. |
| `verse-studio:canvas:editor-drafts:{kind}:{id}` | JSON array of local tile draft objects | Canvas tile-editor local drafts. |
| `verse-studio:exchange:extra:{id}` | JSON exchange stash data | Canvas/exchange extra side-state. |
| `verse-studio:inbox:lastItem` | record id string | Inbox selected item. |
| `verse-studio:inbox:listWidth` | number string | Inbox list width. |
| `verse-studio:library:lastPattern` | record id string | Library selected pattern. |

## Event-like strings/signals that are not stored keys

(source: `AUDITOR_SIGNOFF.MD`, CURRENT TECHNICAL STATE; invariant A-09)

| Signal string | Kind / notes |
|---|---|
| `verse-studio:projectContext:change` | Custom event/signal for project-context change. |
| `verse-studio:select` | Cross-studio select/navigation event. |
| `verse-studio:recent-view` | Recent-view event/signal. |
| `verse-studio:scratch-drawer:open-change` | ScratchDrawer open-state event/signal. |
| `verse:open-pattern-playground` | Pattern playground event-like string used by Prompt/Library workflow. |

## Current feature contracts

- Workspace context is the central state/API layer; components should call context CRUD methods instead of `idb` directly. (source: `HANDY_CODE_SNIPPETS.MD`, Use context CRUD; invariants D-06, D-07)
- Prompt compose drafts are IDB-backed `Prompt` records in `prompts`; `Prompt`, `PromptPipeline`, and `PromptBlock` remain distinct concepts/stores. (source: `AI_README.MD`, v0.02 Prompt Studio IDB migration; invariants A-12, D-10, D-11)
- Prompt pipeline helper state remains localStorage side-state. (source: `FOR_NEXT_OPUS_5.md`, Data layer; invariant A-13)
- Canvas positions are localStorage-backed, `contentType` is render-time state, and Canvas layer application order is hidden suppression -> content type -> layer count -> visibility. (source: `LANDMINES.MD`, Sweep 32 and Sweep 41; invariants A-14, A-15, C-12)
- Scraps are live IDB records with `deletedAt` soft delete; Projects Scraps UI is live inside Projects rows; `/scraps` is not equivalent to that full workflow. (source: `LANDMINES.MD`, Sweep 37 and Sweep 38; invariants A-16, A-17)
- Recent views track actual record opens, max 20, dedupe newest-first, and do not include `projectId`; Projects resolves membership from workspace state. (source: `DRIFT_NOTES.md`, Sweep 29; invariant D-13)

## UI laws

- Writing, Notes, Poetry, and Longform use split-list/editor patterns with persisted list widths/selections. (invariant C-02)
- TopBar remains slim; theme/focus controls live in Sidebar footer; `Cmd/Ctrl+.` remains the reliable focus toggle. (invariant C-03)
- Quick Capture/ScratchDrawer is a global bottom overlay; old active right-side Docker behavior must not be restored without explicit reversal. (invariant C-04)
- Docker files may remain present while inactive; disk presence is not active UI evidence. (invariant C-05)
- Projects type tabs jump to rows, not filters. (invariant C-06)
- Projects row recency is localStorage-only; poems intentionally sort last after recency. (invariant C-07)
- Scraps participate in Projects row recency and inline editing; do not force Scraps through `AttachedKind` or the polymorphic drawer casually. (invariant C-08)
- `.editor-body-pad` is canonical editor body spacing; do not reintroduce centered max-width body wrappers casually. (invariant C-09)
- Longform section-list `alwaysVisible` overrides collapsed state; Longform document list intentionally has no collapse control. (invariant C-10)
- Focus mode chrome hiding is centralized behind `[data-focus-mode="true"]`; do not reintroduce conditional unmounting casually. (invariant C-11)
- Inline Canvas scraps create the IDB Scrap, save `scrap:{id}` position, then close input/render the node. (invariant C-13)
- User-facing installer guidance uses `install-nexus-icon-current-folder.sh` inside the unzipped folder containing `package.json`. (invariant C-14)

## True unresolved items

- **Bundle ceiling drift.** Historical prompts/docs conflict on bundle-size limits; latest active Orchestrator instruction controls until a new explicit limit is installed.
- **localStorage inventory reconciliation.** Stored localStorage keys/prefixes must remain separated from event-like strings/signals; value types must stay attached to stored keys.
- **Runtime behavior remains `RUNTIME-UNVERIFIED`.** Source/governance evidence does not attest live runtime behavior.
- **Diagnostic exporter v1.1 installed.** `src/diagnosticExporter.ts` (frozen, Sweep 51) exports `exportValidationBundle(ws)`. Settings → Diagnostic tab has an "Export validation bundle" button (`data-test="diagnostic-bundle-export"`). `__BUILD_COMMIT__` and `__EXPORTER_SELF_HASH__` are build-time injected constants. Runtime upgrades to RUNTIME-ATTESTED after Orchestrator validates a bundle.
- **Migration install status.** `PREFLIGHT.MD` and `ARCHIVE_INDEX.MD` were absent in the source ZIP and become active only after the Pass 3 outputs are accepted/installed.

## Full invariant coverage ledger in this staged handoff

| ID | Evidence class | Current invariant | Source trace |
|---|---|---|---|
| A-01 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | App identity is Noted v0.01; lineage comes from Nexus Verse Studio v0.07; package.json is 0.0.1 for this branded package. | AUDITOR_SIGNOFF.MD — PROJECT IDENTITY; TRANSITION_READINESS_REPORT.MD — App identity and version |
| A-02 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Browser-only Vite + React + TypeScript SPA; IndexedDB records, localStorage UI/side state, HashRouter routes, no backend/auth/server requirement. | AI_README.MD — Current shape; AI_CODEBASE_HANDOFF.MD — Repo summary; CODEBASE_ORIENTATION.MD — One-screen mental model |
| A-03 | SOURCE-VERIFIED | Single-file packed artifact: npm run build invokes vite build and pack.js; pack must fail if external refs remain. | TRANSITION_READINESS_REPORT.MD — Build and generated artifact expectations; LANDMINES.MD — Single-file pack contract |
| A-04 | SOURCE-VERIFIED | Current DB_VERSION = 11 and SCHEMA_VERSION = 10 after Sweep 57. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — Evidence-class summary |
| A-05 | SOURCE-VERIFIED | There are 28 declared IDB stores; meta keyPath key, all other listed stores keyPath id; DB v9 declares explicit indexes documented in PREFLIGHT.MD Section 3.3a. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — IndexedDB stores |
| A-06 | SOURCE-VERIFIED | Frozen-four files are src/db.ts, src/types.ts, src/context.tsx, and src/seed.ts. | LANDMINES.MD — Frozen four; AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE |
| A-07 | SOURCE-VERIFIED | Legacy store/field names stay frozen: longformProjects remains store name and LongformSection.projectId points to LongformDoc.id. | LANDMINES.MD — IndexedDB legacy names; CODEBASE_ORIENTATION.MD — Data model checkpoints |
| A-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Active stored localStorage inventory and value types must be preserved. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — Literal localStorage key/prefix inventory |
| A-09 | SOURCE-VERIFIED | Event-like strings are not stored keys: verse-studio:projectContext:change, verse-studio:select, verse-studio:recent-view, verse-studio:scratch-drawer:open-change. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — Literal localStorage key/prefix inventory |
| A-10 | SOURCE-VERIFIED / tests RUNTIME-UNVERIFIED | data-test/data-testid literals are permanent verification contracts; current source scan after Sweep 51 found 621 unique `data-test` values (1 `data-testid`). | Sweep 51 delivery; PREFLIGHT.MD Section 3.6 |
| A-11 | SOURCE-VERIFIED | Diagnostic exporter v1.1 installed as frozen `src/diagnosticExporter.ts` (Sweep 51). `build_commit` and `exporter_self_hash` injected at build time by VERIFICATION-INFRASTRUCTURE region in vite.config.ts. Runtime upgrades to RUNTIME-ATTESTED after Orchestrator validation. | PREFLIGHT.MD Section 3.5; HANDY_CODE_SNIPPETS.MD |
| A-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt compose drafts are IDB-backed Prompt records in prompts store via workspace prompt APIs; old localStorage prompt draft arrays must not be revived. | AI_README.MD — v0.02 Prompt Studio IDB migration; LANDMINES.MD — v0.02 Prompt Studio IDB migration landmines |
| A-13 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt pipeline helper state remains localStorage-backed side-state. | AI_README.MD — v0.02 Prompt Studio IDB migration; FOR_NEXT_OPUS_5.md — Data layer |
| A-14 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas positions are localStorage-backed, not IDB-backed; nodePositions is Atlas-style persisted positions, not Canvas placement storage. | LANDMINES.MD — Calibration Sweep 1 / Sweep 32 canvas landmines; CODEBASE_ORIENTATION.MD — Data model checkpoints |
| A-15 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas contentType is derived at render time and must not be persisted into the position map. | LANDMINES.MD — Sweep 41 / v0.06 Canvas layer-order landmine; HANDY_LESSONS.MD — Sweep 41 / v0.06 lesson |
| A-16 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | scraps is a live IndexedDB store; Scrap.deletedAt is the soft-delete marker; active scraps exclude deleted records. | LANDMINES.MD — Sweep 37 scraps data-layer landmines; HANDY_CODE_SNIPPETS.MD — Scraps data-layer CRUD |
| A-17 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | /scraps route is not equivalent to full Scraps workflow; Projects Scraps UI is live inside Projects rows while /scraps remains limited/placeholder per source docs. | LANDMINES.MD — Sweep 38 Projects Scraps UI landmines; AI_CODEBASE_HANDOFF.MD — Sweep 38 handoff update |
| A-18 | SOURCE-VERIFIED | Auditor delivery is docs/archive/index/preflight only; no functional-code modifications and no full codebase ZIP. | AUDITOR_SIGNOFF.MD — AUDITOR INSTRUCTIONS; PROMPT_C_AUDITOR.v1.1 — THE FOUR OUTPUTS YOU PRODUCE |
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
| C-01 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Current top-level routes are fixed route inventory; default/fallback goes to Projects. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
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
| D-01 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | importWorkspace accepts schemaVersion <= SCHEMA_VERSION and migrates on import. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-02 | SOURCE-VERIFIED | Legacy shelf rows with type project meant longform and migrate to type longform. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-03 | SOURCE-VERIFIED | Pattern.tags chip strings backfill to relational tags/tagLinks; Pattern.tags becomes deprecated/emptied. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-04 | SOURCE-VERIFIED | Post-v3 schema bumps are additive unless explicit: v4 inboxItems/nodePositions, v5 notes, v6 recovery bump, v7 scraps, v8 prompts. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-05 | SOURCE-VERIFIED | DB v9 declares explicit indexes for high-frequency store queries; no store count or keyPath changes. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-06 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Components should call workspace context methods instead of idb directly. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-07 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Workspace context is central state/API layer; CRUD updates React state and writes through to IDB. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Soft-deletable records use deletedAt; active arrays exclude soft-deleted records where specified. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-09 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | softDeleteScrap writes deletedAt; purgeScrap hard-deletes from IDB. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-10 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt.deletedAt is soft-delete marker; prompt compose drafts stay in prompts store, not pipelines/blocks. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-11 | SOURCE-VERIFIED | Prompt, PromptPipeline, and PromptBlock are distinct concepts/stores. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Longform body editing maps to LongformSection; do not add LongformDoc.body for inline editing. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-13 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Recent views track actual record opens, max 20, dedupe newest-first, and do not include projectId. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-14 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Quick Capture default project uses verse-studio:projects:lastActive; do not create a parallel last-project key. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-15 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Saving Scratch/Clip to Scraps must not clear scratchpad body or mutate/delete source clipboard row. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-16 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Delete from canvas removes placement/position and records hidden node id, not linked workspace record. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-17 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas position values may be old {x,y} or newer {x,y,width?,height?}; loaders must accept old entries. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-18 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | If Canvas inline scrap position save fails after record creation, Scrap still exists and may later appear unpositioned/default-grid. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-01 | SOURCE-VERIFIED | High-risk source paths include frozen-four plus App, Sidebar, PromptStudio, Canvas. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-02 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Bootstrap signals include openWorkspaceDB, probeIndexedDB, versions, bootstrap status/errors and recovery screens. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-03 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Workspace API signals include prompt and scrap CRUD methods. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-04 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas operational prefixes include positions, hidden, layers, editor-drafts. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-05 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt operational prefixes include blockMeta, pipelineSteps, pipelineVars, pgPos, pipelinePreview. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-06 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Cross-studio event signals include select, recent-view, projectContext:change, scratch-drawer open-change, open-pattern-playground. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-07 | SOURCE-VERIFIED / tests RUNTIME-UNVERIFIED | Selector examples requiring preservation include doc-body, poem-body, prompt-body, canvas-layer-panel, bootstrap screens, and related selectors. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Verification command signals include npm run build, node --check verify-sweep29.mjs, node verify-sweep29.mjs, CHROMIUM_PATH where needed. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-09 | SOURCE-VERIFIED | Installer file signals include install-nexus-icon-current-folder.sh and versioned installer scripts. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |

## Post-Pass-5 branding/package sweep — Nexus Notes v0.01

This delivery renamed the user-facing app surface to **Nexus Notes v0.01** and added a desktop Electron installer package without changing IndexedDB schema, store names, key paths, or localStorage storage-prefix contracts. The app still uses `verse-studio:*` localStorage keys for backward compatibility. The new desktop install path is documented in `NEXUS_NOTES_INSTALL_COMMANDS.MD`; the repeatable ZIP delivery rule is documented in `ZIP_DELIVERY_RULE.MD`. Runtime behavior remains **`RUNTIME-UNVERIFIED`** until validated by an accepted runtime bundle or equivalent Orchestrator-approved runtime proof.

## Nexus Notes v0.01 stable Electron packaging hotfix — 2026-05-23

- Electron shell now pins its Chromium profile/userData path to `~/.config/nexus-notes-v0.01` via `electron/main.cjs`. This isolates stable Nexus Notes v0.01 from older Nexus Verse / early wrapper attempts and avoids stale IndexedDB profile conflicts. This is an Electron wrapper profile path only; it does **not** rename the governed app `DB_NAME` (`verse-studio`) or `verse-studio:*` localStorage/storage keys.
- Installer now backs up old Electron profile folders (`~/.config/nexus-notes-v0.01` and legacy `~/.config/Nexus Notes v0.01`) into `~/.config/nexus-notes-v0.01-backups/` before launch so v0.01 boots cleanly. Exported workspace `.json` backups are unaffected.
- Desktop launcher now uses icon name `nexus-notes-v0.01`, installs SVG plus 64/128/256/512 PNG hicolor icons, and launches Electron with `--class=nexus-notes-v0.01` so GNOME app drawer / window matching is more reliable.
- Added `reset-nexus-notes-v0.01-data.sh` and `nexus-notes-v0.01-reset` for user-approved profile reset if the bootstrap screen reports “The workspace could not be loaded.”
- Historical packaging note: at that hotfix point, no IndexedDB schema/store/localStorage contract changed (`DB_VERSION = 8`, `SCHEMA_VERSION = 8`, 28 stores). Current schema truth is DB v9 / schema v9 after Sweep 36. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED` until browser/Electron verification is actually performed.



## Nexus Notes v0.01 block-creation stability hotfix — 2026-05-23

Current handoff note: a minimal Prompt Studio hotfix was applied after the v0.01 packaging stabilization. `src/studios/prompts/PromptStudio.tsx` now protects block creation paths with error handling, exposes a blank-block action in the pipeline picker empty state, and locks the drawer's internal `type` field to preserve the existing `Pattern.type === 'block'` summonability contract. No DB/schema/storage contracts changed: `DB_VERSION` remains 8, `SCHEMA_VERSION` remains 8, the 28 IDB stores remain unchanged, and `verse-studio:*` localStorage contracts remain unchanged. See `HOTFIX_BLOCK_CREATION_REPORT.MD`.


## Sweep 30 — ScratchDrawer polish + Electron maximize — 2026-05-23

- Electron now starts maximized: `electron/main.cjs` calls `win.maximize()` after `win.setMenuBarVisibility(false)` inside `createWindow()`.
- ScratchDrawer header behavior changed: the chevron/`Scratchpad` label is the only toggle button; tab buttons are siblings, so tab clicks no longer depend on `stopPropagation()` and should not collapse the drawer.
- ScratchDrawer open height is now user-resizable and persisted in localStorage at `verse-studio:scratch-drawer:height` as an integer pixel value; default `360`, minimum `160`.
- New permanent selector: `data-test="scratch-drawer-resize"`. Current source scan after Sweep 37 found 527 unique `data-test` / `data-testid` selector values.
- Implementation verified in source; runtime remains `RUNTIME-UNVERIFIED` because no diagnostic exporter/bundle exists.

## Sweep 31 — PromptStudio ghost text + block copy + pipeline UX — 2026-05-23

- `src/index.css` now suppresses Wayland/Electron transparent-text ghosting for the HighlightedEditor by adding `[data-test="prompt-body"]::selection` with transparent selected text and an accent-soft selection background.
- `src/studios/prompts/PromptStudio.tsx` block-library cards now expose a group-hover copy action for each block body with `data-test="prompts-library-card-copy"` and a short copied/failed flash state; the click stops propagation so it does not insert the card.
- Prompt pipeline empty state now shows a clearer `No steps yet` prompt plus `data-test="pipeline-empty-add"`; the existing add button is always visible as `＋ Add block` under `data-test="pipeline-add-step"`.
- Pipeline steps container is now a block-library drop target via `data-test="pipeline-drop-zone"`; dropped block text creates a NOTE step through the existing localStorage-backed pipeline step path.
- New permanent selectors: `prompts-library-card-copy`, `pipeline-empty-add`, `pipeline-drop-zone`. Current source scan after Sweep 37 found 527 unique `data-test` / `data-testid` selector values.
- No Frozen Four files changed. No IndexedDB schema/store contract changed. Existing `verse-studio:prompts:pipelineSteps:{pipelineId}` keeps the same JSON pipeline step array contract. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 32 — AppMark subtlety + Linux alt-tab icon fix — 2026-05-23

- `src/components/AppMark.tsx` now renders the sidebar mark as a quiet flush SVG rather than a bordered/shadowed badge: no `border-line`, no `shadow-sm`, no `bg-surface-3`; compact size is `w-6 h-6`, normal size is `w-8 h-8`, and the SVG mark opacity is `0.55`.
- `electron/main.cjs` now appends the Linux `WaylandWindowDecorations` feature flag before `app.whenReady()` and explicitly calls both `app.setIcon(icon)` and `win.setIcon(icon)` inside `createWindow()` for GNOME/Wayland alt-tab/window-switcher icon reliability. Existing `app.setDesktopName(`${APP_ID}.desktop`)` remains unchanged.
- No localStorage keys, IDB stores, routes, schema versions, or permanent selectors changed. Selector inventory is now 527 unique `data-test` / `data-testid` values after Sweep 37. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 33 — Canvas placement fix + scrap Save button — 2026-05-24

- `src/studios/canvas/Canvas.tsx` fixes the Canvas placement race for right-click-created notes and inline scraps without changing persistence contracts. Notes save `note:{id}` to `verse-studio:canvas:positions:{projectId}` before the project-scoping update; scraps use a source-level post-placement correction to force the new/existing node to the requested position after `createScrap` resolves.
- `CanvasScrapInputCard` now has a visible `Save` button with permanent selector `data-test="canvas-scrap-save"`; Ctrl/Cmd+Enter still saves and Esc still cancels.
- Selector inventory is now 527 unique `data-test` / `data-testid` values. No localStorage key names/value types, IDB stores, DB_VERSION, SCHEMA_VERSION, routes, or Frozen Four files changed. Runtime scope remains `RUNTIME-UNVERIFIED`.

## Sweep 34 — Prompt Studio unified pipeline editor — 2026-05-24

- `src/studios/prompts/PromptStudio.tsx` now has one top-level Prompt Studio surface: `PipelinesView`. The old compose/pipelines switch and `ComposeView` function are gone.
- The old `verse-studio:prompts:view` localStorage key is RETIRED and no longer read or written; no deletion/migration is performed.
- The first block step in a pipeline is edited inline as the compose surface with autosaved Pattern name/body updates and slash-summon insertion. Additional steps still render as compact pipeline rows; note-only pipelines retain the standard row list.
- Header actions can save assembled output as a Prompt, save assembled output as a reusable block, or copy the assembled output.
- Selector inventory after Sweep 37 is 527 unique `data-test` / `data-testid` values. Runtime behavior remains `RUNTIME-UNVERIFIED`; source typecheck/build is the evidence class for this sweep.


## Sweep 35 — The Stash global save browser + save UX rename — 2026-05-24

- `src/studios/shelf/Shelf.tsx` now renders the `/shelf` route as `Stash`: saved snapshot rows first, existing shelf bookmarks preserved below under `Pinned`, and archived shelf rows still use the preserved `archived-details` selector.
- Saved rows parse snapshot JSON for title/name and short preview, support search/filter, open routed records through the existing selection/navigation helper, restore supported record types through workspace update APIs, and delete snapshots through `ws.deleteSnapshot`.
- `src/components/Snapshots.tsx` changed displayed labels only: `Save`, `Saved (N)`, and `Save version`; selectors and logic remain intact.
- New permanent selectors: `stash-search`, `stash-filter`, `stash-filter-doc`, `stash-filter-poem`, `stash-filter-note`, `stash-filter-longform`, `stash-filter-build`, `stash-filter-pipeline`, `stash-filter-project`, `stash-item`, `stash-open`, `stash-restore`, `stash-delete`, `stash-empty`. Selector inventory after Sweep 37 is 527 unique `data-test` / `data-testid` values.
- No Frozen Four files changed. No DB_VERSION, SCHEMA_VERSION, IDB store, localStorage key, or localStorage value-type changes. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 37 — Convert Anything MVP

- Convert Anything MVP is source-level implemented: Scrap→Note, Scrap→Prompt Block, InboxItem→Note, InboxItem→Scrap, and Note→LongformSection.
- `convertRecord` in `src/context.tsx` is the only conversion write path; components do not write directly to IDB.
- New selectors raise the selector inventory to 527. Runtime behavior remains `RUNTIME-UNVERIFIED` until browser/Electron verification.



## Sweep 38 handoff update

Nexus Panel MVP is now source-implemented. It reads workspace focus/active record state to show identity, project membership, links/backlinks, tags, snapshots, and conversion lineage. Storage key: `verse-studio:nexus-panel:open`; Sweep 56-R supersedes the earlier collapsed-by-default behavior and biases first-run/default-upgrade state open. Selector count after Sweep 39 was 539. Runtime remains RUNTIME-UNVERIFIED.

Sweep 38 verification: typecheck/build passed; `verse-studio.html` size 798676 bytes; runtime remains RUNTIME-UNVERIFIED.

## Sweep 39 handoff update

Sweep 39 hides Atlas and Scraps from Sidebar navigation while leaving routes mounted; replaces the `/scraps` placeholder with a Projects redirect notice; auto-enters ProjectInfoPanel edit mode after new project creation; and hardens ScratchDrawer tab/content event behavior. No IDB stores, routes, localStorage keys, DB_VERSION, or SCHEMA_VERSION changed. Selector inventory is now 539. Runtime remains RUNTIME-UNVERIFIED until browser/Electron checks run.

Sweep 39 verification: typecheck/build passed; `verse-studio.html` size 799559 bytes; runtime remains RUNTIME-UNVERIFIED.


## Sweep 42 — Signal Console overlay

- `src/components/SignalConsole.tsx` is mounted from `src/App.tsx` via `createPortal` at document body level and toggled by a native document `keydown` listener for Cmd/Ctrl+Shift+`.`.
- The overlay is fixed at the top of the viewport, full width, about 360px high, and uses z-50 so it sits above ScratchDrawer.
- Schema tab imports `DB_VERSION`, `SCHEMA_VERSION`, and `STORES` from `src/db.ts`. Counts use source-verified workspace arrays from `useWorkspace()`; `meta` is explicitly shown as not loaded into workspace context.
- Storage tab dynamically enumerates `verse-studio:` localStorage keys and can copy the filtered key/value map to clipboard. It has no delete/import/export/reset controls.
- Health logic was extracted to `src/util/healthSignals.ts`; `WorkspaceHealthPanel` preserves its existing Open-button behaviour by mapping shared `openTarget` data back to navigation.
- New selector family is `signal-console-*`; selector recount is deferred to Sweep 47 per Orchestrator instruction.


## Sweep 43 — Nexus Panel lineage chain

Nexus Panel lineage now walks the full conversion ancestry chain up to 5 hops with cycle detection. The chain treats `convertedFromType` as a `StoreName` and uses an explicit store-to-workspace-array mapping limited to the source-verified lineage stores in the sweep. The panel shows `Lineage (N hops)` collapsed by default, keeps current-record `AI-assisted: yes/no` visible, marks ancestor `[AI]` metadata inline, and renders soft-deleted ancestors as non-clickable `(deleted)` rows with reduced opacity. No schema, migration, route, packaging, or localStorage contract changed; runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 44 — Compile Panel basic

Longform Studio now opens `src/components/CompilePanel.tsx` from a `Compile…` trigger instead of directly downloading the whole document. The panel overlays the section editor from the right without pushing layout, snapshots section rows/word counts when opened, and exports Markdown through the existing `downloadText()` and `safeFilename()` helpers. It adds one stored localStorage contract, `verse-studio:compile:author` (string, owner Compile Panel), and the `compile-panel-*` selector family while preserving the old `longform-download` selector on the trigger. No status fields, section include/exclude, schema/migration, Frozen Four, route, or installer packaging changes were made; runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 45 handoff note — LongformSection.status

`LongformSection.status` is optional (`draft` / `revise` / `final` / `cut`), with undefined treated as `draft`. DB_VERSION is now 10 solely for the additive `longformSections.by_status` index; SCHEMA_VERSION remains 9 because no export/import compatibility change or row rewrite was introduced. Compile Panel include/exclude state is local-only; status changes use the existing `updateSection` path.


## Sweep 46 handoff note — Atlas Upgrade

Atlas is visible in Sidebar again via the restored `/atlas` navigation item. The graph remains the existing hand-rolled SVG implementation. Atlas nodes now carry `aiLineage: boolean`; AI-lineage record nodes are marked with a second accent ring only. Atlas link edges now plumb optional `color` and `weight`, reading `Link.semanticColorId` and `Link.weight`; color currently falls back because no SemanticColor store exists. No DB/schema/migration/localStorage/export/import, installer, ReactFlow, or graph-engine changes were introduced.

## Sweep 47 handoff note — Release QA for Signal Layer v0.02

Signal Layer v0.02 source/build release QA passed. The mandated self-contained HTML greps on `verse-studio.html` both returned 0, the canonical `data-test` selector count is now 619, and the separate `data-testid` count is 1. `src/components/SignalConsole.tsx` displays `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619` in Schema via a hardcoded source constant. No product features, DB/schema/migration changes, SemanticColor store/UI, ReactFlow migration, graph engine replacement, topology export, Nexus Packets, Ollama bridge, AI import zone, or Atlas default-filter change were added. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 48 — Current rendering fix handoff

- Latest change fixes two ScratchDrawer-system rendering defects only. `src/App.tsx` makes the route area a flex column with `ScratchDrawer` as the bottom flex child; `src/components/ScratchDrawer.tsx` removes outer absolute positioning and uses `flex-none w-full`.
- `src/components/docker/Scratchpad.tsx` retains the existing `pb-12` textarea clearance and makes the bottom Save-as-scrap bar opaque.
- Persistence state remains DB_VERSION 10 / SCHEMA_VERSION 9. No storage key contracts changed, including `verse-studio:theme`; no Frozen Four files or migrations changed.

## Sweep 49 — App identity, Focus key, Scraps sidebar — 2026-05-25

User-facing app identity is now **Noted v0.01**: `APP_NAME = 'Noted'`, `APP_TAGLINE = 'Private by default. Relational by design. Portable by right.'`, and diagnostic copy reports `Noted v0.01-3`. `APP_VERSION`, `APP_TITLE`, `APP_STORAGE_PREFIX`, installer script names, Electron identifiers, DB name, and `verse-studio:*` compatibility storage contracts remain unchanged. Global Search no longer captures `/`; Focus Mode uses `/` as an additional non-input shortcut while preserving Cmd/Ctrl+`.`. Scraps is visible in Sidebar again with `sidebar-link-scraps`; `/scraps` routing and ScrapsStudio behavior remain unchanged. Canonical `data-test` selector count is 619, separate `data-testid` count remains 1. No DB/schema/migration/Frozen Four/installer-stack changes. Runtime remains `RUNTIME-UNVERIFIED`.



## Sweep 50 — Prompts Studio UX overhaul

Prompt Studio received a focused UX pass in `src/studios/prompts/PromptStudio.tsx`: user-facing Pipeline copy now reads Prompt where appropriate, the left rail has a Prompts heading, description and variables are collapsed by default via local `useState`, block-library inserts flash the clicked card, the duplicate Materialize action is removed, export/save-as-block actions live in a `⋯` menu, and the first-block write area has a hover copy button. No new localStorage keys, DB/schema/migration changes, Frozen Four touches, or installer-stack changes. Current canonical `data-test` selector count is 619; separate `data-testid` count remains 1. Signal Console selector count constant is `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 51 — Install v1.1 diagnostic bundle exporter

**CREATED** `src/diagnosticExporter.ts` (frozen on creation) and `src/build-constants.d.ts`. **MODIFIED** `vite.config.ts` (added VERIFICATION-INFRASTRUCTURE region computing `build_commit` via Algorithm 1 and `exporter_self_hash` via Algorithm 2, both injected via `define`). **MODIFIED** `src/components/DiagnosticPanel.tsx` (new "Export validation bundle" button and status element). **MODIFIED** `src/components/SignalConsole.tsx` (`CANONICAL_DATA_TEST_SELECTOR_COUNT` updated 619→621). **RETIRED** `CONTROL_ROOM_STATE.MD`. No Frozen Four files, IDB stores, DB_VERSION, SCHEMA_VERSION, localStorage keys, routes, or migrations changed. Current canonical `data-test` selector count is **621**; separate `data-testid` count remains **1**. `build_commit` = `d6e269b97f142d9ad3c9392286d27465c1a30e036723025ab16c7bca12b7a94b`; `exporter_self_hash` = `ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`. Runtime remains `RUNTIME-UNVERIFIED` pending Orchestrator bundle validation.

## Sweep 52 — Full rebrand to Noted + canonical logo + installer standardisation

Completed the Nexus Notes → Noted rebrand across all functional files. `electron/main.cjs` now uses `APP_NAME='Noted v0.01'` and `APP_ID='noted-v0.01'`. `package.json` name is `"noted"`. `index.html` title is `Noted v0.01`. `pack.js` outputs `noted-v0.01.html`. `DiagnosticPanel.tsx` backup filenames changed to `noted-workspace-backup-*.json`. Created canonical `icons/noted-v0.01.svg` and PNG icons at 64/128/256/512 (rasterised via cairosvg). Created `install-noted-v0.01-fedora.sh`, `Quick Install Command Fedora 43.txt`, `NOTED_V0.01_INSTALL_COMMANDS.MD`. Updated `ZIP_DELIVERY_RULE.MD` and `NEXUS_NOTES_V0.01-3_INSTALL.MD` title. No Frozen Four, IDB/schema/localStorage, selector, or route changes. Build verified: `OK verse-studio.html + noted-v0.01.html (833.0 KB)`. TSC clean. Selector count 621 unchanged. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 53 — Critical bug fixes

Five targeted fixes: Scratchpad textarea cursor scroll (overflow-y-auto + end-cursor-only scrollTop effect). Canvas connection parsing hardened to first-colon split. Canvas fitView boolean prop removed; `FitViewOnMount` child component fires once per project change via `useReactFlow()`. TopBar double-click sends `toggle-maximize` via `electron/preload.cjs` contextBridge. ScratchDrawer gets resize listener and `min-h-[28px]`. New file: `electron/preload.cjs` (not frozen). No DB/schema/storage/selector/route changes. TSC clean; build passes; selector count 621 unchanged.

## Sweep 54 handoff update

Phase 0.1 product surfacing is source-implemented without DB/schema/store changes. Sidebar primary order is Projects, Inbox, Writing, Notes, Canvas, Longform, App Design, Prompts, then Library, Stash, Settings; Atlas/Scraps/Poetry routes remain mounted but hidden. Meridian seed IDs are canonical `seed:*` IDs and seeding is guarded by `seed:project:meridian`. First successful seed writes Canvas default project/positions localStorage for Meridian. DOM copy capture lives at app level, listens on `document` in capture phase, writes to `dockerClipboard`, truncates to 500 chars, dedupes newest, and caps at 200 entries. `navigator.clipboard.readText()` is intentionally absent. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 55 theme system handoff

Theme state is centralized in `src/theme.ts`. `verse-studio:theme` is now JSON `ThemeSettings` with `preset: matrix | paper | midnight` and optional CSS token overrides stored as RGB triplets. Legacy raw `dark` and `light` remain backward-compatible. The first-paint parser in `index.html` intentionally mirrors the source parser because it must run before React and without imports.


## Sweep 55-R — Canvas / Prompt Studio / ScratchDrawer trust polish — 2026-05-25

OWNER-CANON [DIRECT]: minimized/collapsed canvas and drawer controls should use the clean Layers-style compact button/panel treatment unless explicitly superseded.

- Prompt Studio now uses `Untitled prompt/pipeline` for pipeline defaults/fallbacks and promotes a fresh/default pipeline name from the typed first-block title when the first saved block is created or renamed.
- Canvas default React Flow controls are replaced by theme-matching bottom-center zoom controls, React Flow attribution is suppressed through `proOptions`, Map is minimized by default behind `verse-studio:canvas:minimap:collapsed`, and Layers remain minimized by default when no stored preference exists.
- ScratchDrawer first-run height is now ~180px, blank banner clicks toggle open/collapsed state, and tab/action clicks continue to stop propagation. Runtime remains `RUNTIME-UNVERIFIED` until browser/Electron checks run.

## Sweep 55-G — GitHub readiness gate — 2026-05-25

- OWNER-CANON [DIRECT]: The project has reached a quality threshold where the owner is considering GitHub publication. This is a direction of travel, not publish authorization.
- DRAFTED / GATED: GitHub publication still requires license choice, owner review of public/private doc boundaries, generated artifact policy, installer policy, security/private-content review, runtime attestation status, and owner go/no-go.
- TECH-CANON: Keep `package.json` `private: true` unless explicitly authorized otherwise; GitHub source visibility is separate from npm package publication.
- TECH-CANON: `README.md` and `NOOB_GUIDE.MD` are public-facing docs and must not become AI relay/governance dumps.
- No app behavior, DB/schema/migration, storage prefix, route, selector, build identity, package manifest, or dependency changes were authorized or made. Runtime claims from Sweep 55-R remain pending/manual.

## Sweep 56 — source/build handoff note — 2026-05-25

- Added `src/focus/FocusContext.tsx` with `FocusRecord`, `FocusProvider`, `useFocus`, and `useSetFocus`. Focus is ephemeral UI state only; do not persist it without explicit authorization.
- Nexus Panel now reads FocusContext first and falls back to Workspace `activeRecord`. Studios that already set `activeRecord` now set both where surgical, preserving Cmd/Ctrl+K and Cmd/Ctrl+L compatibility.
- Added `src/topology/aiBriefExport.ts` for local export-only `NEXUS TOPOLOGY EXPORT` generation. It uses `SCHEMA_VERSION` directly, calculates local short content hashes, exports `titles_summaries`, includes tags/projectIds/aiLineage when available, and does not write back or call network/AI APIs.
- Prompt Studio exposes `data-test="ai-brief-export"` and explains that the AI brief is a local JSON download and does not send data anywhere.
- Prompt records are exported as note-like nodes because the v1.0.0 allowed node vocabulary does not include a dedicated `prompt` type; the node carries `sourceType: "prompt"` for provenance.
- Sweep 55-G remains a GitHub candidate only. Runtime verification is still manual unless a later diagnostic/runtime bundle says otherwise.


## Sweep 56-R handoff update — Nexus Panel default-open

Nexus Panel now initializes open by default. The existing preference key `verse-studio:nexus-panel:open` is preserved, and `verse-studio:nexus-panel:default-open-applied` records the one-time correction so older auto-written `false` defaults do not keep the core relational panel hidden. After the marker exists, user close/open choices persist normally. FocusContext remains primary with Workspace `activeRecord` fallback; Focus Mode hiding through `data-focus-hide="nexus-panel"` remains intact. Runtime verification is pending/manual.


## Sweep 57 handoff update — DB v11 / workspace schema v10

Sweep 57 bumps `DB_VERSION` to 11 and `SCHEMA_VERSION` to 10. It adds no stores, deletes no stores, and performs no destructive row rewrite. `src/db.ts` owns `normalizePersistedRowForStore` and `serializeRowForWorkspaceExport` so old rows missing v11 fields receive defaults at read/write/import/export boundaries. `relationshipType` is canonical for stored links; workspace/AI exports use `label` as the relationship alias. Existing `label` values remain accepted on import and old rows. `src/topology/aiBriefExport.ts` continues to read `SCHEMA_VERSION`, so AI brief exports report workspace schema 10 automatically.

Runtime status: Sweep 56-R is owner runtime-attested; Sweep 57 migration/runtime checks remain pending until launched over existing data. Deferred: `aiMeta`, AI import/writeback/round-trip, Ollama/API, Semantic Color Engine/store, Noted Packet import/export, license/release/publication decisions, dependency/audit remediation.

## Sweep 59 — UX Polish / “Noted Feels Like Noted” — 2026-05-27

Status: SOURCE-VERIFIED + TEST-VERIFIED; RUNTIME-UNVERIFIED until owner smoke or a valid diagnostic bundle is relayed.

Implemented presentation-only polish:

- Root shell atmosphere via `n-noted-shell`.
- Sidebar surface, active-state, app identity, footer, and label refinements.
- AppMark accent/ring treatment.
- TopBar spacing/background/shortcut polish.
- Command palette overlay/card/active-row polish.
- Reminder toast private-glass treatment and copy adjustment.
- Loading surface now presents Noted as a private local workspace entry state.

No persistence, schema, migration, diagnostic exporter, import/export, conversion, Nexus derivation, package manifest, lockfile, app identity, or storage identity changes were made.

Verification:

```text
npm ci: passed; existing moderate dependency advisories remain.
npm run typecheck: passed.
npm run build: passed.
build_commit: 13dd55b3bb064926eaab31e78f39472e06fd576696e85d15e324391b0fb84b53
exporter_self_hash: ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb
selector inventory: 645 unique data-test, 1 unique data-testid
```

## Sweep 59-R — UX Polish extension — 2026-05-27

Status: SOURCE-VERIFIED + TEST-VERIFIED; RUNTIME-UNVERIFIED until owner smoke or a valid diagnostic bundle is relayed.

Surgical extension over Sweep 59 covering the named surfaces from the Sweep 59 packet that the previous Builder did not reach.

Implemented presentation-only polish:

- `index.html` — inline boot splash inside `#root` paints on the first frame; favicon palette aligned to matrix accent (`#0E1411` + `#41D880`).
- `src/main.tsx` — `detachBootSplash()` moves the splash out of `#root` before React mount (React 18 empty-container contract), fades and removes it; respects `prefers-reduced-motion`.
- `src/index.css` — global `caret-color: rgb(var(--accent))` on text inputs; global `:focus-visible` 2px accent outline with `.editor-surface` and `.title-input` opt-out; `.n-route-transition` keyframe (180 ms dissolve); `.n-panel-shift` width transition (200 ms cubic-bezier). All new motion sits above the existing `prefers-reduced-motion` global guard.
- `src/App.tsx` — imported `useLocation`; wrapped `<Routes>` in `<div key={routeKey} className="n-route-transition h-full">` where `routeKey` is the top-level path segment, so navigating between studios animates but intra-studio record selection does not.
- `src/components/NexusPanel.tsx` — added `n-panel-shift` class to the panel shell; inline width style preserved exactly (no data contract change).

No persistence, schema, migration, diagnostic exporter, import/export, conversion, Nexus derivation, package manifest, lockfile, frozen-four file, app identity, or storage identity changes were made. Selector inventory is unchanged.

Verification:

```text
npm ci: passed.
npm run typecheck: passed.
npm run build: passed.
diff package.json / package-lock.json / src/diagnosticExporter.ts (vs uploaded ZIP): no output.
build_commit: 125d552e50f5abd2e2f25c36ffcadae690aea202da31c98d56ab4cc1d9aed8b8
exporter_self_hash: ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb (unchanged)
selector inventory: 645 unique data-test, 1 unique data-testid (unchanged)
DB_VERSION = 11; SCHEMA_VERSION = 10; IDB store count = 28 (all unchanged)
Self-contained artifact size: 880.5 KB.
```

## Sweep 60 — Surface Reduction + Canvas Default + Brand Sharpening + First-Run Canvas Seed — 2026-05-27

Status: SOURCE-VERIFIED + TEST-VERIFIED; RUNTIME-UNVERIFIED until owner smoke or a valid diagnostic bundle is relayed.

Six coordinated tasks shipped in one sweep:

1. **Hidden studios.** `RouteSpec.defaultHidden?: boolean` added in `src/components/Sidebar.tsx`. Inbox, Longform, App Design, and Library marked `defaultHidden: true`. Both expanded and rail-collapsed Sidebar shapes filter via `(!r.defaultHidden || devMode)`. Routes remain mounted in `src/App.tsx` — direct URLs continue to work regardless of toggle state.
2. **Canvas as default.** Canvas moved to position 1 in `ROUTES_MAKE`. Both `<Route path="/">` and `<Route path="*">` now `Navigate` to `/canvas`.
3. **AppMark adopts launcher geometry.** `src/components/AppMark.tsx` SVG replaced with hub-and-spoke (center hub, three outer nodes at top/lower-left/lower-right, three spokes, faint mesh triangle). 512-px launcher coords scaled to 64-px viewBox. All stroke/fill use `currentColor`. `aria-label`, ring/background wrapper, sizing props, and version label preserved.
4. **Tagline.** `APP_TAGLINE` in `src/appMeta.ts` reduced from three sentences to `'Private by default.'` The old string also appears in `src/seed.ts` (Meridian seed project description); per Frozen-Four rule + packet 8.4, that seed string was left intact.
5. **Developer mode.** New `src/useDevMode.ts` hook with `useDevMode(): { devMode, setDevMode }`. Stored at `verse-studio:dev-mode` (`'true' | 'false'`, default `'false'`). Settings General tab gains an "Experimental" section with a single checkbox (`data-test="settings-toggle-dev-mode"`). Same-window cross-component sync via dispatched `StorageEvent` — toggling the flag re-renders Sidebar immediately, no reload required.
6. **First-run canonical canvas seed.** New `src/firstRunCanvas.ts` module exporting `async maybeSeedCanonicalCanvas(ws)`. Fires once on `ws.ready` from `App.tsx`. Idempotent via new marker `verse-studio:canonical-canvas:seeded` (`'true'`). Empty-workspace gated (`ws.projects.length === 0 && ws.documents.length === 0 && ws.notes.length === 0 && ws.scraps.length === 0`). On empty workspace, creates the `Nexus Mobile` project, then 9 records (1 document, 6 notes, 2 scraps) from `src/data/canonicalCanvas.json` (which is a copy of the canonical-canvas.json attached to the packet, unmodified), then 9 cross-record links with both `sourceType` and `targetType` properly populated, then writes canvas positions to `verse-studio:canvas:positions:{projectId}` with node-id shape `${kind}:${newId}` matching Canvas.tsx's nodeIdSet convention (verified at Canvas.tsx line 1116). On non-empty workspace, sets the marker without writing — protects existing user data. Seed never blocks first paint; failures are logged.

Also updated:

- `index.html` — boot splash glyph and inline SVG favicon both adopt the new hub-and-spoke geometry for visual consistency with AppMark. Favicon palette already aligned to matrix accent from Sweep 59-R.
- `PREFLIGHT.MD` §3.1 — two new stored-key rows for `verse-studio:dev-mode` and `verse-studio:canonical-canvas:seeded`.

Verification commands run and observed results:

```text
npm ci: passed.
npm run typecheck: passed (tsc --noEmit, exit 0).
npm run build: passed; vite + pack.js produced verse-studio.html + noted-v0.01.html (889.3 KB).
diff package.json (vs Sweep 59-R): empty.
diff package-lock.json (vs Sweep 59-R): empty.
diff src/diagnosticExporter.ts (vs Sweep 59-R): empty.
diff vite.config.ts (vs Sweep 59-R): empty.
diff src/studios/canvas/Canvas.tsx (vs Sweep 59-R): empty.
diff src/db.ts / src/types.ts / src/context.tsx / src/seed.ts (vs Sweep 59-R): all empty.
Hidden studio code paths (src/studios/inbox, longform, appdesign, library): untouched.
grep -roh 'data-test="[^"]*"' src/ | sort -u | wc -l → 646 (was 645; delta +1: settings-toggle-dev-mode).
grep -roh 'data-testid="[^"]*"' src/ | sort -u | wc -l → 1 (unchanged).
DB_VERSION = 11; SCHEMA_VERSION = 10; DB_NAME = 'verse-studio' (unchanged).
No direct IDB writes in src/components, src/studios, src/firstRunCanvas.ts, or src/useDevMode.ts.

build_commit (extracted from built artifact): 9c83f990265e1eb5e52e4b8b7faae32b70f32fe9b580371e01b099a99a223e21
exporter_self_hash: ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb (unchanged — exporter byte-identical to Sweep 59-R).
```

Two notes on packet pseudocode the Builder adapted during implementation (documented for the next sweep):

1. The packet's `maybeSeedCanonicalCanvas` pseudocode wrote canvas positions keyed by plain `newId`. Canvas.tsx actually keys positions by `${record.kind}:${record.id}`, so the seed module remaps to the prefixed shape on write. Without this fix, positions would have stored but not bound to any visible node.
2. The packet's pseudocode call to `ws.createLink` omitted `sourceType` and `targetType`. The actual context signature requires both as `LinkableType` values. The seed module tracks `{ newId, kind }` per record in the remap and supplies both types on each `createLink` call. The `label` field is omitted (not passed as `null`) when absent, since the type is `string` not `string | null`.

---

## Sweep 60.1 Entry (2026-05-27)

**Scope:** One-function patch to `src/firstRunCanvas.ts`. No schema, exporter, Frozen Four, Canvas.tsx, or selector changes.

**Two lessons for future builders:**

1. **`seed:` prefix = not-yet-real-user-data.** When introducing new first-run logic, account for `src/seed.ts`'s pre-existing Meridian demo. That file is Frozen Four — you cannot change it — but its records are distinguishable: all IDs start with `'seed:'`. Any gate that tests for a "fresh workspace" must treat `seed:`-prefixed-only workspaces as eligible, not as "already used."

2. **Set `verse-studio:canvas:lastProject` for new canonical demos.** Canvas opens to the project stored in this localStorage key. If canonical-demo logic creates a new project but doesn't set this key, Canvas defaults to whichever project was created first (Meridian), and the user never sees the canonical demo without manual navigation. Write the key (guarded by an absence check so user choices aren't overridden) immediately after seeding succeeds.

**Invariant snapshot:**
```
build_commit:        14c3d18978e9a52366741a49badeccdac3c0d34c0df4954f8c7d93df370ff943
exporter_self_hash:  ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb (unchanged)
data-test selectors: 646 (unchanged)
data-testid:         1 (unchanged)
DB_VERSION:          11 (unchanged)
SCHEMA_VERSION:      10 (unchanged)
```

---

## Sweep 60.2 — Canonical Canvas Data Upgrade + lastProject Default Fix (2026-05-27)

**Summary:** Two literal, single-file tasks in one sweep. (1) `src/data/canonicalCanvas.json` replaced with the canonical 42-record Nexus Mobile graph (42 records / 67 links / 42 positions, all `tileType`s in `{document, note, scrap}`, schema `canvas-exchange/1`). (2) `src/firstRunCanvas.ts` lines 197–207 — the `if (localStorage.getItem('verse-studio:canvas:lastProject') === null)` wrapper removed; write is now unconditional inside the `onlySeedOrEmpty` eligibility gate.

**Diff summary:**

- `src/data/canonicalCanvas.json`: full file swap (9 records → 42 records / 9 links → 67 links / 9 positions → 42 positions). SHA-256: `3c073ff21ab4c7c65e1b12161dfcbc44a11d36a2659dbe33a40e8202785f1d74`.
- `src/firstRunCanvas.ts`: comment block at section 6b updated; `if (... === null) { setItem(...) }` → `setItem(...)` unconditionally. No logic changes anywhere else in the file.

**Hashes:**

```
build_commit:        1822f8eada333ffd742953bd8d6e11c90da1e6e4956c1558396ec85d004e830b
exporter_self_hash:  ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb  (unchanged)
```

**Invariants:**

```
data-test selectors: 646 (unchanged)
data-testid:         1 (unchanged)
DB_VERSION:          11 (unchanged)
SCHEMA_VERSION:      10 (unchanged)
Frozen Four:         all byte-identical to Sweep 60.1 baseline
```

**Runtime status:** NOT promoted. Source / build / typecheck verified. Runtime pending owner smoke and Orchestrator bundle validation.


---

## Sweep 60.3 — Package Consistency + Runtime Validation Prep (2026-05-28)

**Status:** SOURCE-VERIFIED + TEST-VERIFIED; RUNTIME-UNVERIFIED until owner smoke or a valid diagnostic bundle is relayed and accepted by Orchestrator.

**Scope:** packaging/governance consistency only. No source behavior, DB/schema/store, dependency, diagnostic exporter, Vite verification-infrastructure, selector, localStorage contract, or migration changes were made.

**Mismatch corrected:** the uploaded source recomputed to `build_commit = 83ebad57f9220ac57112f6bbc2ef3818c3a489015b141d4832e842587aded191`, but the uploaded root HTML artifacts (`noted-v0.01.html`, `verse-studio.html`) still contained stale build commit `1822f8eada333ffd742953bd8d6e11c90da1e6e4956c1558396ec85d004e830b`. Future AI must not trust that incoming HTML artifact; trust the rebuilt Sweep 60.3 artifact instead.

**Rebuilt artifacts:** `npm run build` regenerated `dist/*`, `verse-studio.html`, and `noted-v0.01.html`. The rebuilt root HTML artifacts contain both:

```text
build_commit:        83ebad57f9220ac57112f6bbc2ef3818c3a489015b141d4832e842587aded191
exporter_self_hash:  ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb
```

The stale `1822...830b` build value is absent from both rebuilt root HTML artifacts.

**Verification snapshot:**

```text
npm ci: passed; package.json and package-lock.json unchanged; audit reports 2 moderate vulnerabilities.
npm run typecheck: passed.
npm run build: passed; vite + pack.js produced verse-studio.html + noted-v0.01.html (929.4 KB).
DB_VERSION:          11
SCHEMA_VERSION:      10
IDB store count:     28
selector inventory:  646 unique data-test, 1 unique data-testid
canonicalCanvas:     42 records / 67 links / 42 positions
src/diagnosticExporter.ts SHA-256: ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb
```

**Runtime note:** uploaded JSON exports before this pass are not validation-grade diagnostic bundles because they lack the required `build_commit`, `exporter_self_hash`, nonce, environment, and payload schema. Runtime claims remain pending.

**Next allowed work:** Gate 59.5 validation first; Sweep 63 only after Orchestrator accepts the gate or owner explicitly accepts the risk of proceeding while runtime claims remain unproven.
