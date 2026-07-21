# ARCHIVE_INDEX.MD

### FINAL OUTPUT (apply this)

## Purpose

This index tells the next Maintainer exactly which expanded archive file to request when a sweep touches an operational surface. The triggers below are concrete: source paths, route paths, function names, localStorage keys/prefixes, IDB store names, and selector families. They are not broad domain labels.

Runtime behavior remains `RUNTIME-UNVERIFIED` unless a future validated diagnostic bundle changes that evidence class. Diagnostic exporter status is currently **absent**.

## Archive request rule

At session boot, the Maintainer declares the domains and files/functions/routes/keys/stores/selectors they will touch. The Orchestrator compares that declaration against this index and names the required archive files in the sweep prompt. The Maintainer does not originate archive waivers.

---

### PERSISTENCE_SCHEMA_AND_STORAGE_HISTORY.MD

Domain: IndexedDB schema, export/import schema, store inventory, migrations, workspace context persistence, active localStorage stored keys, and storage-related evidence-class cautions.

Archive metadata:
- Created by: Auditor session Pass 2.
- Source ZIP filename: `Nexus_Verse_Studio_v0.07_migration_prep(1)(1).zip`.
- Source commit/version if available: `Nexus Verse Studio v0.07`; package version `0.1.0`.
- Supersedes: persistence/schema/storage history distributed across old governance docs and sweep prompts.
- Superseded-by: none at Pass 3 creation.
- Archive metadata SHA status: archive file says `HASH-PENDING`.
- External SHA-256 of emitted Pass 2 archive file: `9501dfa5384aab5d64e14d85b5bf378deb95ec951d1dda022a22ad3f708d8b30`.

Triggers:
- Source paths: `src/db.ts`, `src/context.tsx`, `src/types.ts`, `src/seed.ts`, `src/util/projectContext.ts`, `src/util/recentViews.ts`, `src/util/navigate.ts`.
- Constants/functions: `DB_NAME`, `DB_VERSION`, `SCHEMA_VERSION`, `STORES`, `StoreName`, `openWorkspaceDB()`, `probeIndexedDB()`, `dbGetAll()`, `dbPut()`, `dbDelete()`, `exportWorkspace()`, `importWorkspace()`, `migrateShelfV1ToV2()`, `migratePatternTagsV2ToV3()`.
- IDB stores: `meta`, `writingDocs`, `poems`, `longformProjects`, `longformSections`, `appDesignBuilds`, `appDesignConstraints`, `appDesignFeatures`, `appDesignScreens`, `appDesignDataShapes`, `appDesignPhases`, `appDesignReviews`, `shelf`, `projects`, `links`, `tags`, `tagLinks`, `dockerScratch`, `dockerClipboard`, `snapshots`, `patterns`, `promptPipelines`, `promptBlocks`, `inboxItems`, `nodePositions`, `notes`, `scraps`, `prompts`.
- localStorage keys/prefixes: any key beginning `verse-studio:`; especially `verse-studio:projectContext`, `verse-studio:recent-views`, `verse-studio:canvas:positions:`, `verse-studio:canvas:hidden:`, `verse-studio:canvas:layers:`, `verse-studio:prompts:pipelineSteps:`, `verse-studio:prompts:pipelineVars:`, `verse-studio:prompts:pgPos:`, `verse-studio:projects:`, and `verse-studio:exchange:extra:`.
- Value-type-sensitive changes: any same-name change to a stored key's value type, owner, meaning, or serialization format.

Request when:
- Editing `src/db.ts`, `src/context.tsx`, `src/types.ts`, or `src/seed.ts`.
- Adding/removing/renaming an IDB store, changing `DB_VERSION`, changing `SCHEMA_VERSION`, changing import/export shape, changing migrations, or changing active localStorage key semantics.
- Touching any persistence helper used by multiple studios.
- Reconciling stored localStorage keys versus event-like strings/signals.

Contains:
- Current schema/storage history, DB/export version rules, store inventory, migration rules, context CRUD rules, and the split between record persistence and UI side-state. It preserves the rule that source-verified schema facts do not certify runtime behavior.

UNRESOLVED flags:
- `localStorage inventory reconciliation`: stored keys and event-like signals must remain separated precisely.
- `runtime behavior remains RUNTIME-UNVERIFIED` until a validated diagnostic bundle exists.

---

### UI_LAYOUT_AND_EDITOR_HISTORY.MD

Domain: app shell, routes, editor/list layouts, focus mode, ScratchDrawer/Quick Capture layout, collapsible panels, and user-facing layout decisions.

Archive metadata:
- Created by: Auditor session Pass 2.
- Source ZIP filename: `Nexus_Verse_Studio_v0.07_migration_prep(1)(1).zip`.
- Source commit/version if available: `Nexus Verse Studio v0.07`; package version `0.1.0`.
- Supersedes: shell/editor/UI history distributed across old governance docs and sweep prompts.
- Superseded-by: none at Pass 3 creation.
- Archive metadata SHA status: archive file says `HASH-PENDING`.
- External SHA-256 of emitted Pass 2 archive file: `c3c19848be862e774bc3961aa067e0ff0f2daaf453bf18bda5ba4733fb43f9ee`.

Triggers:
- Source paths: `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/TopBar.tsx`, `src/components/FocusMode.tsx`, `src/components/ScratchDrawer.tsx`, `src/components/scratchDrawerState.ts`, `src/components/Docker.tsx`, `src/components/DockerContext.tsx`, `src/studios/writing/WritingStudio.tsx`, `src/studios/notes/NotesStudio.tsx`, `src/studios/poetry/PoetryStudio.tsx`, `src/studios/longform/LongformStudio.tsx`, editor component files under `src/studios/*`.
- Routes: `/`, `/writing/*`, `/notes/*`, `/poetry/*`, `/longform/*`, `/app-design/*`, `/projects`, `/prompts`, `/canvas`, `/atlas`, `/library`, `/shelf/*`, `/scraps`, `/settings`, fallback `*`.
- localStorage keys: `verse-studio:theme`, `verse-studio:focus`, `verse-studio:sidebar:collapsed`, `verse-studio:scratch-drawer:open`, `verse-studio:scratch-drawer:tab`, `verse-studio:writing:lastDoc`, `verse-studio:writing:listWidth`, `verse-studio:poetry:lastPoem`, `verse-studio:poetry:listWidth`, `verse-studio:notes:lastSelected`, `verse-studio:notes:listWidth`, `verse-studio:longform:lastDoc`, `verse-studio:longform:lastSection`, `verse-studio:longform:listWidth`, `verse-studio:longform:sectionList:collapsed`, `verse-studio:longform:sectionList:alwaysVisible`.
- Selectors/families: `doc-*`, `poem-*`, `note-*`, `longform-*`, `focus-*`, `scratch-*`, `sidebar-*`, `topbar-*`, editor body selectors including `doc-body`, `poem-body`, and layout classes such as `.editor-body-pad`.
- CSS/layout law: `[data-focus-mode="true"]`, `.editor-body-pad`, split-pane/list-width behavior.

Request when:
- Editing shell chrome, route wiring, focus mode, ScratchDrawer behavior, editor body/list layout, panel collapse behavior, or any route/fallback behavior.
- Reintroducing Docker UI or moving Quick Capture/ScratchDrawer out of the bottom-overlay shell pattern.
- Changing editor width, editor body padding, or split-pane/list width persistence.

Contains:
- Current UI laws and the historical reasons not to revert to older centered editor wrappers, old Docker layout, or conditional unmount focus-mode behavior.

UNRESOLVED flags:
- `runtime behavior remains RUNTIME-UNVERIFIED` until a validated diagnostic bundle exists.

---

### CANVAS_PROJECTS_AND_SCRAPS_HISTORY.MD

Domain: Canvas placement/layers/tile behavior, Projects rows/recency, Scraps data and UI integration, Quick Capture save-as-scrap behavior, and project-linked node behavior.

Archive metadata:
- Created by: Auditor session Pass 2.
- Source ZIP filename: `Nexus_Verse_Studio_v0.07_migration_prep(1)(1).zip`.
- Source commit/version if available: `Nexus Verse Studio v0.07`; package version `0.1.0`.
- Supersedes: Canvas/Projects/Scraps history distributed across old governance docs and sweep prompts.
- Superseded-by: none at Pass 3 creation.
- Archive metadata SHA status: archive file says `HASH-PENDING`.
- External SHA-256 of emitted Pass 2 archive file: `98fc99f4f0f9a21058473c128794c426315c276f1506d6f84ace303134b5c9e6`.

Triggers:
- Source paths: `src/studios/canvas/Canvas.tsx`, `src/studios/canvas/LayerPanel.tsx`, `src/studios/projects/Projects.tsx`, `src/studios/scraps/ScrapsStudio.tsx`, `src/components/ClipboardPanel.tsx`, `src/components/docker/Scratchpad.tsx`, `src/util/navigate.ts`, `src/context.tsx`, `src/types.ts`.
- Routes: `/canvas`, `/projects`, `/scraps`.
- IDB stores: `projects`, `links`, `scraps`, `notes`, `writingDocs`, `poems`, `longformProjects`, `longformSections`, `appDesignBuilds`, `patterns`, `promptPipelines`, `promptBlocks`, `prompts`, `nodePositions`.
- Workspace APIs/functions: `createScrap`, `updateScrap`, `softDeleteScrap`, `purgeScrap`, `createProject`, `updateProject`, `linkRecord`, `createNote`, `createWritingDoc`, `createPoem`.
- localStorage keys/prefixes: `verse-studio:canvas:lastProject`, `verse-studio:canvas:positions:{projectId}`, `verse-studio:canvas:hidden:{projectId}`, `verse-studio:canvas:layers:{projectId}`, `verse-studio:canvas:layerPanel:collapsed`, `verse-studio:canvas:editor-drafts:{kind}:{id}`, `verse-studio:exchange:extra:{id}`, `verse-studio:projects:lastProject`, `verse-studio:projects:lastActive`, `verse-studio:projects:sidePanel`, `verse-studio:projects:notesOpen`, `verse-studio:projects:qcKind`, `verse-studio:projects:{projectId}:lastType`, `verse-studio:clipboard:hidden`.
- Selector families: `canvas-*`, `canvas-node-*`, `canvas-layer-*`, `canvas-tile-*`, `canvas-context-*`, `canvas-scrap-*`, `project-*`, `projects-*`, `scrap-*`, `clip-entry-save-as-scrap`, `clipboard-*`.
- Canvas operational strings: node ids such as `scrap:{id}`, layer visibility, hidden placement sets, and position map shapes `{x,y,width?,height?}`.

Request when:
- Editing Canvas placement, layer visibility, delete-from-canvas behavior, inline Canvas scrap creation, Canvas tile editing, Projects row ordering, Projects inline Scraps editing, or Quick Capture save-as-scrap.
- Touching the `scraps` store, any `Scrap` type, project-linked row rendering, or Canvas localStorage position/hidden/layer formats.
- Changing `/scraps` route behavior or attempting to equate `/scraps` with Projects Scraps UI.

Contains:
- Current Canvas/Projects/Scraps operational laws, including localStorage-backed Canvas positions, hidden-placement behavior, render-time content type derivation, layer-order rules, Projects row recency, and Scraps soft-delete behavior.

UNRESOLVED flags:
- `localStorage inventory reconciliation`: Canvas prefixes must stay distinguished from stored scalar keys and event-like signals.
- `runtime behavior remains RUNTIME-UNVERIFIED` until a validated diagnostic bundle exists.

---

### PROMPT_STUDIO_HISTORY.MD

Domain: Prompt Studio compose drafts, prompt/pipeline/block separation, prompt localStorage side-state, Prompt Studio route and selectors, and prompt-pattern cross-studio behavior.

Archive metadata:
- Created by: Auditor session Pass 2.
- Source ZIP filename: `Nexus_Verse_Studio_v0.07_migration_prep(1)(1).zip`.
- Source commit/version if available: `Nexus Verse Studio v0.07`; package version `0.1.0`.
- Supersedes: prompt-related history distributed across old governance docs and sweep prompts.
- Superseded-by: none at Pass 3 creation.
- Archive metadata SHA status: archive file says `HASH-PENDING`.
- External SHA-256 of emitted Pass 2 archive file: `fb6d739dd3745e01f559563c020b0f5c7e23dedbd732bc2b0a8852f7fe30b8e5`.

Triggers:
- Source paths: `src/studios/prompts/PromptStudio.tsx`, `src/context.tsx`, `src/types.ts`, `src/util/navigate.ts`, any Prompt Studio components/helpers.
- Route: `/prompts`.
- IDB stores: `prompts`, `promptPipelines`, `promptBlocks`, `patterns`, `tags`, `tagLinks`.
- Workspace APIs/functions: `createPrompt`, `updatePrompt`, `softDeletePrompt`, prompt pipeline/block CRUD methods, pipeline step/draft/autosave helpers.
- localStorage keys/prefixes: `verse-studio:prompts:view`, `verse-studio:prompts:blockLibrary:collapsed`, `verse-studio:prompts:lastPipeline`, `verse-studio:prompts:blockMeta`, `verse-studio:prompts:pipelineSteps:{pipelineId}`, `verse-studio:prompts:pipelineVars:{pipelineId}`, `verse-studio:prompts:pgPos:{focusId}`, `verse-studio:prompts:pipelinePreview`.
- Event-like strings: `verse:open-pattern-playground`.
- Selector families: `prompt-*`, `pipeline-*`, `block-*`, `pattern-*`, `library-*`, `tag-*` where they affect Prompt Studio linkage.

Request when:
- Editing Prompt Studio compose drafts, prompt CRUD, prompt autosave, pipeline side-state, block library behavior, graph positions, preview state, or pattern playground interactions.
- Moving prompt compose content between `prompts`, `promptPipelines`, `promptBlocks`, or localStorage.
- Changing `Prompt`, `PromptPipeline`, or `PromptBlock` types or store semantics.

Contains:
- Prompt Studio persistence split: compose drafts are IDB `Prompt` records; pipeline helper state remains localStorage side-state; prompt/pipeline/block stores are distinct.

UNRESOLVED flags:
- `localStorage inventory reconciliation`: prompt localStorage side-state must stay listed as stored keys/prefixes, while `verse:open-pattern-playground` remains an event-like signal.
- `runtime behavior remains RUNTIME-UNVERIFIED` until a validated diagnostic bundle exists.

---

### BOOTSTRAP_PACKAGING_AND_VERIFICATION_HISTORY.MD

Domain: IndexedDB bootstrap and recovery screens, diagnostic exporter absence, build/pack pipeline, installer scripts, dependency extraction hazards, and browser verification limits.

Archive metadata:
- Created by: Auditor session Pass 2.
- Source ZIP filename: `Nexus_Verse_Studio_v0.07_migration_prep(1)(1).zip`.
- Source commit/version if available: `Nexus Verse Studio v0.07`; package version `0.1.0`.
- Supersedes: bootstrap/build/installer/verification history distributed across old governance docs and sweep prompts.
- Superseded-by: none at Pass 3 creation.
- Archive metadata SHA status: archive file says `HASH-PENDING`.
- External SHA-256 of emitted Pass 2 archive file: `8715c9ca73512e2819cbaa6874414b8d2f60bb71a38432833a7fc53039f687f5`.

Triggers:
- Source paths: `src/db.ts`, `src/context.tsx`, `src/App.tsx`, bootstrap/recovery screen components, `package.json`, `pack.js`, `vite.config.ts`, `index.html`, `verify-sweep*.mjs`, `smoke-prompts.mjs`, `install.sh`, `verse-fix.sh`, `verse-storage-v6-fix.sh`, `verse-force-current-v6.sh`, `install-nexus-icon-current-folder.sh`, `install-nexus-verse-studio-*.sh`, `README.md`, `NOOB_GUIDE.MD`, **`src/diagnosticExporter.ts`**, **`vite.config.ts` VERIFICATION-INFRASTRUCTURE region**.
- Constants/functions: `openWorkspaceDB()`, `probeIndexedDB()`, `DB_NAME`, `DB_VERSION`, `SCHEMA_VERSION`, `bootstrapStatus`, `bootstrapError`, `BootstrapBlockedScreen`, `BootstrapErrorScreen`, reset/backup/export/import helpers, **`__BUILD_COMMIT__`**, **`__EXPORTER_SELF_HASH__`** (build-time injected constants), **`exportValidationBundle()`**.
- Commands: `npm run build`, `vite build`, `node pack.js`, `node --check verify-sweep29.mjs`, `node verify-sweep29.mjs`, Chromium-dependent verification using `CHROMIUM_PATH`.
- Generated artifact: `verse-studio.html`.
- Selector families: `bootstrap-*`, `reset-*`, `export-*`, `import-*`, verification selectors used by `verify-sweep*.mjs`, **`diagnostic-bundle-export`**, **`diagnostic-bundle-status`**.
- Diagnostic status: **v1.1 validation-grade exporter installed** (`src/diagnosticExporter.ts`, frozen, Sweep 51). Bundle schema version 1. Invariants A-19, A-20, A-21.

Request when:
- Editing build scripts, packer behavior, installer scripts, verification scripts, bootstrap/error/blocked screens, IndexedDB recovery flow, noob recovery docs, or anything that might be described as diagnostics.
- Claiming runtime verification, browser verification, build verification, or diagnostic bundle status.
- Changing bundle-size/bundle-ceiling claims.
- **Editing `src/diagnosticExporter.ts`, the `vite.config.ts` VERIFICATION-INFRASTRUCTURE region, the bundle schema (`schema_version`), or either hash algorithm (Algorithms 1 or 2 in `HANDY_CODE_SNIPPETS.MD`).**

Contains:
- The single-file pack contract, bootstrap blocked/error recovery history, diagnostic-exporter absence, browser verification dependency, ZIP extraction warnings, and installer/noob guidance.

UNRESOLVED flags:
- `bundle ceiling drift`: older docs and later user guidance differ; latest active Orchestrator instruction governs future sweeps.
- `runtime behavior remains RUNTIME-UNVERIFIED` until a validated diagnostic bundle exists.

---

### CROSS_STUDIO_SIGNALS_AND_SELECTORS_HISTORY.MD

Domain: permanent selector contracts, custom events/signals, navigation/recent-view/project-context coordination, command/search surfaces, and cross-studio linking.

Archive metadata:
- Created by: Auditor session Pass 2.
- Source ZIP filename: `Nexus_Verse_Studio_v0.07_migration_prep(1)(1).zip`.
- Source commit/version if available: `Nexus Verse Studio v0.07`; package version `0.1.0`.
- Supersedes: selector/event/navigation history distributed across old governance docs and sweep prompts.
- Superseded-by: none at Pass 3 creation.
- Archive metadata SHA status: archive file says `HASH-PENDING`.
- External SHA-256 of emitted Pass 2 archive file: `0b309fc2b7a4d059da5d420933b1948a0e1b6208a135cdbba149238e3c453932`.

Triggers:
- Source paths: `src/util/navigate.ts`, `src/util/recentViews.ts`, `src/util/projectContext.ts`, `src/components/CommandPalette.tsx`, `src/components/GlobalSearchBar.tsx`, `src/components/RecentViewsMenu.tsx`, `src/components/NotificationToast.tsx`, `src/components/scratchDrawerState.ts`, route/studio files containing `data-test` or `data-testid` attributes.
- Event-like strings/signals: `verse-studio:select`, `verse-studio:recent-view`, `verse-studio:projectContext:change`, `verse-studio:scratch-drawer:open-change`, `verse:open-pattern-playground`.
- Stored coordination keys: `verse-studio:projectContext`, `verse-studio:recent-views`, studio `last*` keys, and route-selection keys.
- Selector contract: any `data-test` or `data-testid`; selector families include `bootstrap-*`, `canvas-*`, `project-*`, `prompt-*`, `doc-*`, `poem-*`, `note-*`, `longform-*`, `clipboard-*`, `scratch-*`, `sidebar-*`, `command-*`, `search-*`, `recent-*`, `tag-*`, `pattern-*`, `atlas-*`.
- Routes: any route path in `src/App.tsx` because route changes affect navigation/search/recent-view signals.

Request when:
- Renaming/removing `data-test` or `data-testid` attributes.
- Editing navigation dispatch, recent views, project context, custom events, command palette, global search, notification routing, or cross-studio linking.
- Changing event-like strings or confusing them with localStorage stored keys.

Contains:
- The selector contract and signal/localStorage split needed to avoid breaking verification scripts, routing helpers, recent views, project context, and cross-studio open/select behavior.

UNRESOLVED flags:
- `localStorage inventory reconciliation`: event-like strings must not be promoted to stored localStorage keys.
- `runtime behavior remains RUNTIME-UNVERIFIED` until a validated diagnostic bundle exists.

---

### GOVERNANCE_AND_LANDMINES_HISTORY.MD

Domain: migration governance, old Maintainer-to-Auditor transition, landmine reclassification, evidence-class discipline, unresolved flags, and future documentation-maintenance rules.

Archive metadata:
- Created by: Auditor session Pass 2.
- Source ZIP filename: `Nexus_Verse_Studio_v0.07_migration_prep(1)(1).zip`.
- Source commit/version if available: `Nexus Verse Studio v0.07`; package version `0.1.0`.
- Supersedes: migration/governance/landmine history distributed across old governance docs and sweep prompts.
- Superseded-by: none at Pass 3 creation.
- Archive metadata SHA status: archive file says `HASH-PENDING`.
- External SHA-256 of emitted Pass 2 archive file: `43e6c99a829bae81649b0402490dfb9af290047aa1f8242d20b2353d55b51ceb`.

Triggers:
- Governance files: `AUDITOR_SIGNOFF.MD`, `TRANSITION_READINESS_REPORT.MD`, `AI_README.MD`, `AI_CODEBASE_HANDOFF.MD`, `LANDMINES.MD`, `HANDY_LESSONS.MD`, `HANDY_CODE_SNIPPETS.MD`, `CODEBASE_ORIENTATION.MD`, `NOOB_GUIDE.MD`, `FREEDOM_REASONING_LOG.MD`, `DRIFT_NOTES.md`, `FOR_NEXT_OPUS*.md`, `HANDOFF.md`, `PREFLIGHT.MD`, `ARCHIVE_INDEX.MD`, archive `*_HISTORY.MD` files, and future governance docs.
- Evidence-class terms: `SOURCE-VERIFIED`, `RUNTIME-ATTESTED`, `RUNTIME-UNVERIFIED`.
- Migration-pass terms: `Frozen Four`, `diagnostic exporter`, `diagnostic bundle`, `bundle ceiling`, `localStorage inventory`, `READ COMPLETENESS LEDGER`, `UNRESOLVED`.
- Any rewrite/compression of active docs or archive files.
- Any claim that source/static evidence proves runtime behavior.

Request when:
- Editing governance docs, archive files, `PREFLIGHT.MD`, `ARCHIVE_INDEX.MD`, evidence-class language, landmine classifications, or unresolved flags.
- Running a future Auditor/Consolidator pass.
- Attempting to close or downgrade an unresolved item.

Contains:
- The migration history, governance-doc transition state, landmine reclassification, approved true unresolved flags, and permanent evidence-class rule that source evidence and runtime evidence cannot impersonate each other.

UNRESOLVED flags:
- `bundle ceiling drift`.
- `localStorage inventory reconciliation`.
- `missing PREFLIGHT.MD` until this Pass 3 `PREFLIGHT.MD` is accepted and installed.
- `missing ARCHIVE_INDEX.MD` until this Pass 3 `ARCHIVE_INDEX.MD` is accepted and installed.
- `runtime behavior remains RUNTIME-UNVERIFIED` until a validated diagnostic bundle exists.

---

## Index-level unresolved flags

These are the only true unresolved flags carried into Pass 3:

1. `bundle ceiling drift` — older docs and later guidance differ; latest active Orchestrator instruction governs future sweeps.
2. `localStorage inventory reconciliation` — stored keys must remain separated from event-like strings/signals while preserving value types for stored keys.
3. `missing PREFLIGHT.MD` — resolved only when this Pass 3 `PREFLIGHT.MD` is accepted and installed into the codebase.
4. `missing ARCHIVE_INDEX.MD` — resolved only when this Pass 3 `ARCHIVE_INDEX.MD` is accepted and installed into the codebase.
5. `runtime behavior remains RUNTIME-UNVERIFIED` — unresolved until a validated diagnostic bundle proves runtime behavior.

## Nexus Notes v0.01 stable Electron packaging hotfix — 2026-05-23

- Electron shell now pins its Chromium profile/userData path to `~/.config/nexus-notes-v0.01` via `electron/main.cjs`. This isolates stable Nexus Notes v0.01 from older Nexus Verse / early wrapper attempts and avoids stale IndexedDB profile conflicts. This is an Electron wrapper profile path only; it does **not** rename the governed app `DB_NAME` (`verse-studio`) or `verse-studio:*` localStorage/storage keys.
- Installer now backs up old Electron profile folders (`~/.config/nexus-notes-v0.01` and legacy `~/.config/Nexus Notes v0.01`) into `~/.config/nexus-notes-v0.01-backups/` before launch so v0.01 boots cleanly. Exported workspace `.json` backups are unaffected.
- Desktop launcher now uses icon name `nexus-notes-v0.01`, installs SVG plus 64/128/256/512 PNG hicolor icons, and launches Electron with `--class=nexus-notes-v0.01` so GNOME app drawer / window matching is more reliable.
- Added `reset-nexus-notes-v0.01-data.sh` and `nexus-notes-v0.01-reset` for user-approved profile reset if the bootstrap screen reports “The workspace could not be loaded.”
- No IndexedDB schema/store/localStorage contract changed: `DB_VERSION = 8`, `SCHEMA_VERSION = 8`, 28 stores, diagnostic exporter remains ABSENT, runtime remains `RUNTIME-UNVERIFIED` until browser/Electron verification is actually performed.

