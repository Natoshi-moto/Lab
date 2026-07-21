# CODEBASE_ORIENTATION.MD

### FINAL OUTPUT (apply this)

## One-screen mental model

Noted v0.01 is a local-first browser SPA, renamed from the pre-transition Nexus Verse Studio v0.07 line. React route studios read/write through workspace context; context owns in-memory state and writes through to IndexedDB. localStorage holds UI/side state and must not be confused with IDB record persistence. Runtime status: Sweep 56-R Nexus Panel default-open is **RUNTIME-ATTESTED [OWNER]**; Sweep 57 DB/schema migration checks are **RUNTIME PENDING** until verified against existing app data; Sweep 58 Nexus relational-spine work is source/build verified and runtime pending. (source: Sweep 57 governance update; invariants A-01, A-02, D-06, D-07)

## Source topology

- App shell/routes: `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/TopBar.tsx`.
- **Verification infrastructure (frozen, Sweep 51):** `src/diagnosticExporter.ts`, `vite.config.ts` VERIFICATION-INFRASTRUCTURE region, `src/build-constants.d.ts`.
- Frozen-four data/state/API: `src/db.ts`, `src/types.ts`, `src/context.tsx`, `src/seed.ts`.
- Prompt Studio: `src/studios/prompts/PromptStudio.tsx` and prompt helpers/components.
- Canvas: `src/studios/canvas/Canvas.tsx` and Canvas components.
- Projects/Scraps: Projects/Scraps studios plus context CRUD.
- Nexus relational spine: `src/components/NexusPanel.tsx`, `src/focus/FocusContext.tsx`, and `src/nexus/useNexusIndex.ts`.
- Packaging: `pack.js`, `vite.config.ts`, `package.json` scripts, versioned installer scripts.

High-risk source paths: `src/db.ts`, `src/types.ts`, `src/context.tsx`, `src/seed.ts`, `src/App.tsx`, `src/components/Sidebar.tsx`, `src/studios/prompts/PromptStudio.tsx`, `src/studios/canvas/Canvas.tsx`, `src/diagnosticExporter.ts` (frozen verification infrastructure), `vite.config.ts` VERIFICATION-INFRASTRUCTURE region. (source: `CODEBASE_ORIENTATION.MD`, Load-bearing files; invariant E-01)


## Nexus / Focus mental model — Sweep 58

`FocusContext` is the current UI focus pointer: `{ id, type, origin, focusedAt }`. It is not persistence and is intentionally mirrored only where legacy command/link flows still expect `ws.activeRecord`. The Nexus Panel consumes focus first, falls back to activeRecord, then resolves surrounding graph context through `useNexusIndex(ws, recentViews)`.

`useNexusIndex` is the single local query layer for Nexus-facing lookups. It builds id/type maps, project membership, link/backlink summaries, tag names, snapshots, conversion lineage, AI markers, canvas placement reads from existing canvas position localStorage, orphan status, and display-only suggested links. It performs no IDB writes, no schema normalization, and no AI/network inference.

## Routing map

`/inbox`, `/writing/*`, `/notes/*`, `/poetry/*`, `/longform/*`, `/app-design/*`, `/projects`, `/prompts`, `/canvas`, `/atlas`, `/library`, `/shelf/*`, `/scraps`, `/settings`; default/fallback routing goes to Projects. (source: `AI_CODEBASE_HANDOFF.MD`, Current route inventory; invariant C-01)

## Persistence map

`DB_VERSION = 11`; `SCHEMA_VERSION = 10`. Current IDB stores (DB v9/v10 indexes and DB v11 canonical field alignment are documented in `PREFLIGHT.MD` Section 3.3a): (source: `AUDITOR_SIGNOFF.MD`, CURRENT TECHNICAL STATE; invariants A-04, A-05)

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

Persistence rules: import accepts `schemaVersion <= SCHEMA_VERSION` and migrates; legacy shelf `project` rows meant longform; `Pattern.tags` migrated to relational tags/tagLinks; v4/v5/v6/v7/v8 bumps are additive/recovery as documented; DB v9/v10 add explicit indexes and DB v11 formalizes canonical lineage/export relationship defaults, as documented in `PREFLIGHT.MD` Section 3.3a. (invariants D-01, D-02, D-03, D-04, D-05)

## localStorage map

Stored localStorage values below must remain separate from event-like strings. (invariants A-08, A-09)

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

## Event-like signals

| Signal string | Kind / notes |
|---|---|
| `verse-studio:projectContext:change` | Custom event/signal for project-context change. |
| `verse-studio:select` | Cross-studio select/navigation event. |
| `verse-studio:recent-view` | Recent-view event/signal. |
| `verse-studio:scratch-drawer:open-change` | ScratchDrawer open-state event/signal. |
| `verse:open-pattern-playground` | Pattern playground event-like string used by Prompt/Library workflow. |

Cross-studio signals and selectors are contracts, not decoration. `data-test` / `data-testid` literals are permanent verification selectors; current source scan after Sweep 34 found 502 unique selectors. (source: `AUDITOR_SIGNOFF.MD`, CURRENT TECHNICAL STATE; invariants A-10, E-06, E-07)

## UI architecture

- Writing, Notes, Poetry, and Longform use split-list/editor patterns. (C-02)
- TopBar is slim; theme/focus controls live in Sidebar footer; focus toggle is `Cmd/Ctrl+.`. (C-03)
- Quick Capture/ScratchDrawer is bottom overlay shell chrome. (C-04)
- Docker files may remain on disk while inactive. (C-05)
- Projects tabs jump to rows; row recency uses localStorage and poems sort last. (C-06, C-07)
- Scraps participate in Projects rows and inline editing. (C-08)
- `.editor-body-pad` is canonical editor body spacing. (C-09)
- Longform `alwaysVisible` overrides section-list collapse. (C-10)
- Focus mode uses `[data-focus-mode="true"]`. (C-11)
- Canvas layer order is hidden suppression -> content type -> layer count -> visibility. (C-12)
- Inline Canvas scraps create record and placement atomically enough for visible placement. (C-13)
- Installer guidance uses current-folder installer from inside extracted folder. (C-14)

## Data integrity rules

- Prompt compose drafts are `Prompt` records in `prompts`; `Prompt`, `PromptPipeline`, and `PromptBlock` are distinct. (A-12, D-10, D-11)
- Prompt pipeline helper state stays in localStorage side-state. (A-13)
- Canvas positions are localStorage-backed and compatible with old/new shapes; `contentType` is render-time state. (A-14, A-15, D-17)
- Scraps are live IDB records using `deletedAt`; soft delete and purge are distinct. (A-16, D-08, D-09)
- `/scraps` route is not equal to Projects Scraps UI. (A-17)
- Longform body editing maps to `LongformSection`. (D-12)
- Recent views track opened records, not project IDs. (D-13)
- Quick Capture default project uses `verse-studio:projects:lastActive`; saving Scratch/Clip to Scraps is non-destructive. (D-14, D-15)
- Canvas placement deletion hides/removes placement, not workspace record; inline scrap partial failures leave the created Scrap record intact. (D-16, D-18)

## Bootstrap, packaging, and verification orientation

- `openWorkspaceDB()`, `probeIndexedDB()`, `DB_NAME`, `DB_VERSION`, `SCHEMA_VERSION`, bootstrap statuses/errors, and recovery screens are the bootstrap operational signals. (E-02)
- Workspace API signals include prompt and scrap CRUD methods. (E-03)
- Canvas operational prefixes: `verse-studio:canvas:positions:`, `verse-studio:canvas:hidden:`, `verse-studio:canvas:layers:`, `verse-studio:canvas:editor-drafts:`. (E-04)
- Prompt operational prefixes: `verse-studio:prompts:blockMeta`, `verse-studio:prompts:pipelineSteps:`, `verse-studio:prompts:pipelineVars:`, `verse-studio:prompts:pgPos:`, `verse-studio:prompts:pipelinePreview`. (E-05)
- Verification commands include `npm run build`, `node --check verify-sweep29.mjs`, `node verify-sweep29.mjs`, and `CHROMIUM_PATH` when Chromium-dependent. (E-08)
- Installer file signals include `install-nexus-icon-current-folder.sh` and versioned installer scripts. (E-09)

## True unresolved items

- **Bundle ceiling drift.** Historical prompts/docs conflict on bundle-size limits; latest active Orchestrator instruction controls until a new explicit limit is installed.
- **localStorage inventory reconciliation.** Stored localStorage keys/prefixes must remain separated from event-like strings/signals; value types must stay attached to stored keys.
- **Runtime behavior remains `RUNTIME-UNVERIFIED`.** Source/governance evidence does not attest live runtime behavior.
- **Diagnostic exporter v1.1 installed.** `src/diagnosticExporter.ts` (frozen, Sweep 51). Settings → Diagnostic tab has "Export validation bundle". See Verification infrastructure section below.
- **Migration install status.** `PREFLIGHT.MD` and `ARCHIVE_INDEX.MD` were absent in the source ZIP and become active only after the Pass 3 outputs are accepted/installed.

## Invariant coverage in this staged orientation doc

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
| A-10 | SOURCE-VERIFIED / tests RUNTIME-UNVERIFIED | data-test/data-testid literals are permanent verification contracts; current source scan after Sweep 34 found 502 unique selectors. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; LANDMINES.MD — data-test selectors |
| A-11 | SOURCE-VERIFIED | Diagnostic exporter v1.1 installed as frozen `src/diagnosticExporter.ts` (Sweep 51). `build_commit` and `exporter_self_hash` injected at build time by VERIFICATION-INFRASTRUCTURE region in `vite.config.ts`. Runtime upgrades to RUNTIME-ATTESTED after Orchestrator validation. | PREFLIGHT.MD Section 3.5; LANDMINES.MD Sweep 51 entry |
| A-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt compose drafts are IDB-backed Prompt records in prompts store via workspace prompt APIs; old localStorage prompt draft arrays must not be revived. | AI_README.MD — v0.02 Prompt Studio IDB migration; LANDMINES.MD — v0.02 Prompt Studio IDB migration landmines |
| A-13 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt pipeline helper state remains localStorage-backed side-state. | AI_README.MD — v0.02 Prompt Studio IDB migration; FOR_NEXT_OPUS_5.md — Data layer |
| A-14 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas positions are localStorage-backed, not IDB-backed; nodePositions is Atlas-style persisted positions, not Canvas placement storage. | LANDMINES.MD — Calibration Sweep 1 / Sweep 32 canvas landmines; CODEBASE_ORIENTATION.MD — Data model checkpoints |
| A-15 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas contentType is derived at render time and must not be persisted into the position map. | LANDMINES.MD — Sweep 41 / v0.06 Canvas layer-order landmine; HANDY_LESSONS.MD — Sweep 41 / v0.06 lesson |
| A-16 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | scraps is a live IndexedDB store; Scrap.deletedAt is the soft-delete marker; active scraps exclude deleted records. | LANDMINES.MD — Sweep 37 scraps data-layer landmines; HANDY_CODE_SNIPPETS.MD — Scraps data-layer CRUD |
| A-17 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | /scraps route is not equivalent to full Scraps workflow; Projects Scraps UI is live inside Projects rows while /scraps remains limited/placeholder per source docs. | LANDMINES.MD — Sweep 38 Projects Scraps UI landmines; AI_CODEBASE_HANDOFF.MD — Sweep 38 handoff update |
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



## Nexus Notes v0.01 Prompt Studio block-creation orientation — 2026-05-23

Prompt Studio blocks are stored in the existing `patterns` IDB store as `Pattern` records with `type === 'block'`. The v0.01 block hotfix only changes UI/guard behavior in `src/studios/prompts/PromptStudio.tsx`: create failures are surfaced, pipeline empty state can create a blank block, and the internal block type is read-only. No persistence contract changed.


## Sweep 30 — ScratchDrawer polish + Electron maximize — 2026-05-23

- Electron now starts maximized: `electron/main.cjs` calls `win.maximize()` after `win.setMenuBarVisibility(false)` inside `createWindow()`.
- ScratchDrawer header behavior changed: the chevron/`Scratchpad` label is the only toggle button; tab buttons are siblings, so tab clicks no longer depend on `stopPropagation()` and should not collapse the drawer.
- ScratchDrawer open height is now user-resizable and persisted in localStorage at `verse-studio:scratch-drawer:height` as an integer pixel value; default `360`, minimum `160`.
- New permanent selector: `data-test="scratch-drawer-resize"`. Current source scan after Sweep 34 found 502 unique `data-test` / `data-testid` selector values.
- Implementation verified in source; runtime remains `RUNTIME-UNVERIFIED` because no diagnostic exporter/bundle exists.

## Sweep 31 — PromptStudio ghost text + block copy + pipeline UX — 2026-05-23

- `src/index.css` now suppresses Wayland/Electron transparent-text ghosting for the HighlightedEditor by adding `[data-test="prompt-body"]::selection` with transparent selected text and an accent-soft selection background.
- `src/studios/prompts/PromptStudio.tsx` block-library cards now expose a group-hover copy action for each block body with `data-test="prompts-library-card-copy"` and a short copied/failed flash state; the click stops propagation so it does not insert the card.
- Prompt pipeline empty state now shows a clearer `No steps yet` prompt plus `data-test="pipeline-empty-add"`; the existing add button is always visible as `＋ Add block` under `data-test="pipeline-add-step"`.
- Pipeline steps container is now a block-library drop target via `data-test="pipeline-drop-zone"`; dropped block text creates a NOTE step through the existing localStorage-backed pipeline step path.
- New permanent selectors: `prompts-library-card-copy`, `pipeline-empty-add`, `pipeline-drop-zone`. Current source scan after Sweep 34 found 502 unique `data-test` / `data-testid` selector values.
- No Frozen Four files changed. No IndexedDB schema/store contract changed. Existing `verse-studio:prompts:pipelineSteps:{pipelineId}` keeps the same JSON pipeline step array contract. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 32 — AppMark subtlety + Linux alt-tab icon fix — 2026-05-23

- `src/components/AppMark.tsx` now renders the sidebar mark as a quiet flush SVG rather than a bordered/shadowed badge: no `border-line`, no `shadow-sm`, no `bg-surface-3`; compact size is `w-6 h-6`, normal size is `w-8 h-8`, and the SVG mark opacity is `0.55`.
- `electron/main.cjs` now appends the Linux `WaylandWindowDecorations` feature flag before `app.whenReady()` and explicitly calls both `app.setIcon(icon)` and `win.setIcon(icon)` inside `createWindow()` for GNOME/Wayland alt-tab/window-switcher icon reliability. Existing `app.setDesktopName(`${APP_ID}.desktop`)` remains unchanged.
- No localStorage keys, IDB stores, routes, schema versions, or permanent selectors changed. Selector inventory is now 502 unique `data-test` / `data-testid` values after Sweep 34. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 33 — Canvas placement fix + scrap Save button — 2026-05-24

- `src/studios/canvas/Canvas.tsx` fixes the Canvas placement race for right-click-created notes and inline scraps without changing persistence contracts. Notes save `note:{id}` to `verse-studio:canvas:positions:{projectId}` before the project-scoping update; scraps use a source-level post-placement correction to force the new/existing node to the requested position after `createScrap` resolves.
- `CanvasScrapInputCard` now has a visible `Save` button with permanent selector `data-test="canvas-scrap-save"`; Ctrl/Cmd+Enter still saves and Esc still cancels.
- Selector inventory is now 502 unique `data-test` / `data-testid` values. No localStorage key names/value types, IDB stores, DB_VERSION, SCHEMA_VERSION, routes, or Frozen Four files changed. Runtime scope remains `RUNTIME-UNVERIFIED`.

## Sweep 34 — Prompt Studio unified pipeline editor — 2026-05-24

- `/prompts` is now pipeline-first. `PromptStudio` renders `PipelinesView` directly; the old compose/pipelines tab switch is removed.
- The first block step in a pipeline is a full inline prompt editor backed by the Pattern record. Remaining steps keep the compact pipeline-row UX.
- `verse-studio:prompts:view` is a retired localStorage key: existing values may exist in user browsers, but source no longer reads or writes the key.
- Current selector inventory after Sweep 34 is 502 unique `data-test` / `data-testid` values.

## Sweep 37 — Convert Anything MVP

- Convert Anything MVP is source-level implemented: Scrap→Note, Scrap→Prompt Block, InboxItem→Note, InboxItem→Scrap, and Note→LongformSection.
- `convertRecord` in `src/context.tsx` is the only conversion write path; components do not write directly to IDB.
- New selectors raise the selector inventory to 527. Runtime behavior remains `RUNTIME-UNVERIFIED` until browser/Electron verification.



## Sweep 38 orientation — Nexus Panel

`src/components/NexusPanel.tsx` is mounted in the shell as the right-edge relational inspector. It should remain studio-agnostic: studios continue to set `ws.activeRecord`; the panel derives its display from context state. Do not add studio-specific wiring unless a later sweep explicitly asks for it.

Sweep 38 verification: typecheck/build passed; `verse-studio.html` size 798676 bytes; runtime remains RUNTIME-UNVERIFIED.

## Sweep 39 orientation — UX Trust-Breaker Polish

Sweep 39 hides Atlas and Scraps from Sidebar navigation while leaving routes mounted; replaces the `/scraps` placeholder with a Projects redirect notice; auto-enters ProjectInfoPanel edit mode after new project creation; and hardens ScratchDrawer tab/content event behavior. No IDB stores, routes, localStorage keys, DB_VERSION, or SCHEMA_VERSION changed. Selector inventory is now 539. Runtime remains RUNTIME-UNVERIFIED until browser/Electron checks run.

Sweep 39 verification: typecheck/build passed; `verse-studio.html` size 799559 bytes; runtime remains RUNTIME-UNVERIFIED.


## Sweep 42 orientation note — Signal Console

- Signal Console is global shell chrome, not a route. It is mounted from `App.tsx` into a body portal and toggled with Cmd/Ctrl+Shift+`.`.
- Treat it as read-only inspection UI. Schema counts come from workspace context arrays, Storage reads dynamic `verse-studio:` localStorage keys, and Health reads shared `computeWorkspaceHealthSignals()` output.
- Do not add repair/reset/import/export/migration controls to Signal Console without a new explicit sweep. Clipboard copy in the Storage tab is the only mutating action.


## Sweep 43 orientation note — Nexus Panel lineage chain

- Nexus Panel lineage reads only in-memory workspace arrays; it does not query IndexedDB.
- `convertedFromType` must be handled as a `StoreName`. Do not route it through `LinkableType` labels without an explicit mapping.
- The chain depth is capped at 5 hops and must keep cycle detection. Soft-deleted ancestors stay visible but non-clickable.
- Current-record `AI-assisted: yes/no` is part of the Lineage section header area and should remain visible while the section is collapsed.

## Sweep 44 orientation note — Longform Compile Panel

- Longform Markdown export is now routed through `CompilePanel`, a right-side overlay mounted inside the section editor area.
- The Compile Panel snapshots section titles/bodies/word counts when opened; do not make its section list reactive unless a future sweep changes the contract.
- The only persisted value owned by the panel is `verse-studio:compile:author` (string). Output mode, front matter, date, and section snapshot remain local UI state.
- Sweep 45 adds section status, include/exclude controls, status pills, and status pickers inside Compile Panel only. Do not add main-editor status controls unless a future sweep says so.


## Sweep 45 orientation note — Longform status-aware compile

- `LongformSection.status` is optional. Treat missing status as `draft`; do not run row rewrites just to populate it.
- Compile Panel status controls are the only status UI surface in this sweep. Included word totals and Markdown output use included sections only; `cut` defaults excluded but can be manually included.
- DB v10 adds only `longformSections.by_status`; export/import schema stays v9.


## Sweep 46 orientation note — Atlas Signal Layer plumbing

- `/atlas` is again reachable from Sidebar navigation; the route itself remained mounted in `App.tsx`.
- Atlas is still the existing SVG force graph. Do not assume ReactFlow or another graph engine exists.
- AI lineage is visual metadata only: source records with `aiLineage === true` render with a second accent ring, not warning/alert styling.
- Edge color/weight plumbing exists, but SemanticColor persistence/UI does not. Link `weight` affects stroke width; unresolved colors fall back to `var(--line)`.

## Sweep 47 orientation note — Release QA for Signal Layer v0.02

Release QA is a governance/build gate, not a product feature surface. Historical Sweep 47 release-QA truth was DB_VERSION 10 / SCHEMA_VERSION 9. Current source truth after Sweep 57 is DB_VERSION 11, SCHEMA_VERSION 10, 28 stores, Atlas visible, Signal Console present, Compile Panel present, optional LongformSection.status defaults to draft. Signal Console's Schema selector count is a hardcoded source constant matching the mandated `data-test` grep count (619); do not replace it with a DOM query. The built `verse-studio.html` remains self-contained when both external-script and `/assets/` greps return 0.

## Sweep 48 orientation — ScratchDrawer layout boundary

- The shell content below TopBar is now a flex column: routed `<main>` scrolls as `flex-1 min-h-0`, and `ScratchDrawer` sits below it as a normal flex child. Future ScratchDrawer work should preserve this layout unless explicitly re-scoped.
- Scratchpad's Save-as-scrap control is still an absolute bottom bar within the editor, but the textarea has bottom padding and the bar is opaque to avoid overlay bleed-through.

## Sweep 49 — App identity, Focus key, Scraps sidebar — 2026-05-25

User-facing app identity is now **Noted v0.01**: `APP_NAME = 'Noted'`, `APP_TAGLINE = ''`, and diagnostic copy reports `Noted v0.01-3`. `APP_VERSION`, `APP_TITLE`, `APP_STORAGE_PREFIX`, installer script names, Electron identifiers, DB name, and `verse-studio:*` compatibility storage contracts remain unchanged. Global Search no longer captures `/`; Focus Mode uses `/` as an additional non-input shortcut while preserving Cmd/Ctrl+`.`. Scraps is visible in Sidebar again with `sidebar-link-scraps`; `/scraps` routing and ScrapsStudio behavior remain unchanged. Canonical `data-test` selector count is 619, separate `data-testid` count remains 1. No DB/schema/migration/Frozen Four/installer-stack changes. Runtime remains `RUNTIME-UNVERIFIED`.



## Sweep 50 — Prompts Studio UX overhaul

Prompt Studio received a focused UX pass in `src/studios/prompts/PromptStudio.tsx`: user-facing Pipeline copy now reads Prompt where appropriate, the left rail has a Prompts heading, description and variables are collapsed by default via local `useState`, block-library inserts flash the clicked card, the duplicate Materialize action is removed, export/save-as-block actions live in a `⋯` menu, and the first-block write area has a hover copy button. No new localStorage keys, DB/schema/migration changes, Frozen Four touches, or installer-stack changes. Current canonical `data-test` selector count is 619; separate `data-testid` count remains 1. Signal Console selector count constant is `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 51 — Install v1.1 diagnostic bundle exporter

**New files:**
- `src/diagnosticExporter.ts` — frozen validation-grade bundle exporter. Role: exports `exportValidationBundle(ws: WorkspaceContext): Promise<ValidationBundle>`. Called by `DiagnosticPanel.tsx` when user clicks "Export validation bundle". Reads runtime `db.version` via `openWorkspaceDB()`. Embeds `__BUILD_COMMIT__` and `__EXPORTER_SELF_HASH__` (build-time injected). Frozen on creation.
- `src/build-constants.d.ts` — ambient TypeScript declarations for `__BUILD_COMMIT__` and `__EXPORTER_SELF_HASH__` global constants. Covered by existing `"include": ["src"]` in `tsconfig.json`.

**Verification infrastructure subsection:**

The two protected artifacts for this project's validation system are:

1. `src/diagnosticExporter.ts` — born frozen (Sweep 51). Implements the v1.1 bundle schema. Build-time hash injection makes every bundle cryptographically traceable to the exact source tree that produced it. Invariants: A-19, A-20, A-21.
2. `vite.config.ts` VERIFICATION-INFRASTRUCTURE region — co-protected. Computes `build_commit` (Algorithm 1: SHA-256 rolling hash over sorted `src/` tree) and `exporter_self_hash` (Algorithm 2: SHA-256 of `src/diagnosticExporter.ts` bytes). Injects both via Vite `define`. See `HANDY_CODE_SNIPPETS.MD` for canonical algorithm reference.

No DB/schema/migration/localStorage/route/Frozen Four changes. Selector count: 621. Runtime remains `RUNTIME-UNVERIFIED` pending Orchestrator validation.


## Sweep 52 — Full rebrand to Noted + canonical logo + installer standardisation

Completed rebrand in `electron/main.cjs`, `package.json`, `index.html`, `pack.js`, `DiagnosticPanel.tsx`. Created canonical `icons/noted-v0.01.svg` and PNGs. Created `install-noted-v0.01-fedora.sh` (new canonical installer; legacy `install-nexus-notes-v0.01-3-fedora.sh` preserved), `Quick Install Command Fedora 43.txt`, `NOTED_V0.01_INSTALL_COMMANDS.MD`. Quick install command: `chmod +x ./install-noted-v0.01-fedora.sh && ./install-noted-v0.01-fedora.sh`. No code-contract changes.


## Sweep 53 — Critical bug fixes

New file: `electron/preload.cjs` — contextBridge script that exposes `window.electronAPI.toggleMaximize()` to the renderer. Referenced in `webPreferences.preload` in `electron/main.cjs`. Not frozen. The `electron/main.cjs` now has a module-level `win` reference (instead of local-only) and registers `ipcMain.handle('toggle-maximize', ...)` once at module level. Canvas: `handleConnect` uses first-colon split; `fitView` boolean prop replaced with `FitViewOnMount` child component. ScratchDrawer: resize listener + min-h. Scratchpad: overflow-y-auto + cursor-aware scroll effect.

## Sweep 54 orientation — Noted Phase 0.1 surfacing

The app now opens/falls back to Projects and the Sidebar reflects the locked Phase 0.1 order: Projects, Inbox, Writing, Notes, Canvas, Longform, App Design, Prompts, then Library, Stash, Settings. Atlas, Scraps, and Poetry are deep-linkable legacy/secondary routes, not primary nav. Meridian is the canonical onboarding/demo project; first successful seed also positions Meridian on Canvas via existing `verse-studio:canvas:*` keys. Copied-history capture is app-level DOM `copy` capture into `dockerClipboard`; system clipboard reads are disabled.

## Theme system orientation — Sweep 55

Themes are preset token blocks in `src/index.css` selected by `document.documentElement.dataset.theme`. Tailwind colors reference RGB-triplet CSS variables through `rgb(var(--token) / <alpha-value>)`. Settings owns preset selection, hex-facing custom inputs, reset-to-preset, and constrained randomization; storage remains the single key `verse-studio:theme`.
