# PREFLIGHT.MD

### FINAL OUTPUT (apply this)

## This file is a boot ritual, not reference material

Before any edit in any future Maintainer session, the Maintainer must read this file in full and answer the Boot Questions in chat. Do not skim. Do not answer from memory. Do not answer from this file alone when the question says to read source.

Runtime behavior from Sweep 56-R was `RUNTIME-ATTESTED [OWNER]` for the Nexus Panel default-open correction. Sweep 57 DB migration/runtime checks remain `RUNTIME PENDING` until the new artifact is launched over real data. Sweep 58 Nexus relational-spine work is source/build verified here and runtime pending. The diagnostic exporter is v1.1 validation-grade as of Sweep 51 (`src/diagnosticExporter.ts`, frozen).

Current app identity: **Noted v0.01**. Pre-transition lineage: Nexus Verse Studio v0.07 and Nexus Notes v0.01. Storage prefixes intentionally remain `verse-studio:*`.

---

# SECTION 1 — ARCHIVE AWARENESS

Expanded archive files exist outside the lean active docs. The Orchestrator decides which archives are required for a sweep by comparing the sweep scope against `ARCHIVE_INDEX.MD`. The Maintainer must not invent an archive waiver.

Available archives from the v1.1 Auditor migration pass:

| Archive file | One-line description |
|---|---|
| `PERSISTENCE_SCHEMA_AND_STORAGE_HISTORY.MD` | IndexedDB schema, migrations, import/export, workspace context persistence, and localStorage stored-key history. |
| `UI_LAYOUT_AND_EDITOR_HISTORY.MD` | Shell layout, routes, editor layouts, focus mode, ScratchDrawer, and UI laws. |
| `CANVAS_PROJECTS_AND_SCRAPS_HISTORY.MD` | Canvas positions/layers, Projects rows, Scraps data/UI, and Quick Capture save-as-scrap behavior. |
| `PROMPT_STUDIO_HISTORY.MD` | Prompt compose drafts, prompt/pipeline/block separation, Prompt Studio side-state, and prompt route behavior. |
| `BOOTSTRAP_PACKAGING_AND_VERIFICATION_HISTORY.MD` | Bootstrap/recovery, diagnostic exporter absence, build/pack contract, installer scripts, and verification limits. |
| `CROSS_STUDIO_SIGNALS_AND_SELECTORS_HISTORY.MD` | Permanent selectors, event-like signals, navigation, recent views, project context, and cross-studio linking. |
| `GOVERNANCE_AND_LANDMINES_HISTORY.MD` | Governance transition, landmine reclassification, evidence classes, and unresolved flags. |

Archive handling rule:

1. Declare the files, routes, functions, stores, keys, and selector families you will touch.
2. Read `ARCHIVE_INDEX.MD`.
3. Confirm which archives the Orchestrator named in the sweep prompt.
4. If the prompt says no archive is needed, state that explicitly.
5. If the prompt names archives, confirm each filename/hash if hashes are available; otherwise state `HASH-NOT-CHECKED`.
6. Only then begin edits.

---

# SECTION 2 — BOOT QUESTIONS

You must answer these in chat before the first edit. Use the exact answer block below. Do not collapse the answers into prose.

Required source-read rule:
- For DB/export versions and IDB stores, read `src/db.ts` directly.
- For route inventory, read `src/App.tsx` directly.
- For selector changes, search source for `data-test` and `data-testid` directly.
- For localStorage changes, search source for `verse-studio:` and check this file's stored-key/signals split.
- For diagnostic exporter status, search source for diagnostic/export bundle terminology and compare to this file's status.

Answer block required:

```text
BOOT-SEQUENCE-ACTIVE v1

1. DB_VERSION from src/db.ts: [number]
2. SCHEMA_VERSION from src/db.ts: [number]
3. IDB store count from src/db.ts STORES: [number]
4. IDB stores read from source: [comma-separated list]
5. Frozen-four files confirmed present/intact: [src/db.ts, src/types.ts, src/context.tsx, src/seed.ts]
6. Diagnostic exporter status: [ABSENT / PRESENT]
7. Runtime evidence class for this session: [RUNTIME-UNVERIFIED unless a validated diagnostic bundle is supplied]
8. Active stored localStorage keys/prefixes touched this session: [list each with value type]
9. Event-like strings/signals touched this session: [list or NONE]
10. Routes touched this session: [list or NONE]
11. Selector families touched this session: [list or NONE]
12. Archives named by Orchestrator: [list or "no archive needed"]
13. Archive hash check: [filename/hash matched, HASH-NOT-CHECKED, or not applicable]
14. Domains declared for this session: [storage / UI / Canvas / Projects / Scraps / Prompts / Bootstrap / Packaging / Signals / Selectors / Governance / other]
15. App identity from source/docs: [Noted v0.01 unless source has changed]
16. Installer/ZIP delivery files present if emitting full ZIP: [YES/NO/not applicable]
17. Staleness ownership accepted: [YES — I will update PREFLIGHT.MD in the same delivery if I add/remove/rename/semantically change any Section 3 contract]
```

Hard stops:
- If you cannot answer items 1–17, stop.
- If `DB_VERSION`, `SCHEMA_VERSION`, store count, or route inventory differs from this file, treat this file as stale and update it in the same delivery if your sweep touches the stale contract.
- If a stored localStorage key and event-like string are confused, stop and reconcile before editing.
- If you are about to claim runtime behavior, provide a validated diagnostic bundle; otherwise keep `RUNTIME-UNVERIFIED`.

---

# SECTION 3 — ACTIVE CONTRACTS

## 3.1 Active stored localStorage keys and prefixes

These are stored values. Preserve the key names and value types unless the active sweep explicitly changes them and updates this file in the same delivery.

| Stored key / prefix | Value type | Owner / notes |
|---|---|---|
| `verse-studio:theme` | JSON `ThemeSettings` `{ preset: 'matrix' \| 'paper' \| 'midnight', overrides?: token→RGB triplet }`; legacy raw `'dark'`/`'light'` accepted | Theme UI. Sweep 55 maps legacy `dark`→`midnight`, `light`→`paper`; missing/invalid→`matrix`. |
| `verse-studio:focus` | `'true' \| 'false'` | Focus mode state. |
| `verse-studio:sidebar:collapsed` | `'true' \| 'false'` | Sidebar collapsed state. |
| `verse-studio:nexus-panel:open` | `'true' \| 'false'` | Nexus Panel persisted user preference; missing/invalid now defaults open. |
| `verse-studio:nexus-panel:default-open-applied` | `'true'` marker | Sweep 56-R one-time migration marker; when absent, the app opens Nexus Panel once and sets the normal preference key to `'true'`. |
| `verse-studio:scratch-drawer:open` | `'true' \| 'false'` | ScratchDrawer open state; also mirrored by an event-like signal. |
| `verse-studio:scratch-drawer:tab` | drawer tab id string | ScratchDrawer selected tab; `clip` renders as the visible Copied tab. |
| `verse-studio:scratch-drawer:height` | number (integer px, default 180) | ScratchDrawer resize — persisted drawer open height. |
| `verse-studio:docker:collapsed` | `'true' \| 'false'` | Legacy Docker collapsed state; source files may remain inactive. |
| `verse-studio:docker:state` | JSON Docker state object | Legacy Docker state. |
| `verse-studio:docker:scratchpad:activeId` | record id string | Docker scratchpad active id. |
| `verse-studio:clipboard:hidden` | JSON array of hidden clipboard ids | Clipboard soft-hide/bin state. |
| `verse-studio:projectContext` | JSON project context object | Current project context side state. |
| `verse-studio:recent-views` | JSON recent-view array | Recent records, dedupe newest-first. |
| `verse-studio:writing:lastDoc` | record id string | Writing selected document. |
| `verse-studio:writing:listWidth` | number string | Writing list width. |
| `verse-studio:poetry:lastPoem` | record id string | Poetry selected poem. |
| `verse-studio:poetry:listWidth` | number string | Poetry list width. |
| `verse-studio:notes:lastSelected` | record id string | Notes selected note. |
| `verse-studio:notes:listWidth` | number string | Notes list width. |
| `verse-studio:longform:lastDoc` | record id string | Longform selected document. |
| `verse-studio:longform:lastSection` | record id string | Longform selected section. |
| `verse-studio:longform:listWidth` | number string | Longform list width. |
| `verse-studio:longform:sectionList:collapsed` | `'true' \| 'false'` | Longform section list collapsed state. |
| `verse-studio:longform:sectionList:alwaysVisible` | `'true' \| 'false'` | Overrides section-list collapsed state. |
| `verse-studio:compile:author` | string | Compile Panel author field for Markdown export. |
| `verse-studio:appdesign:lastBuild` | record id string | App Design selected build. |
| `verse-studio:appdesign:lastTab` | tab id string | App Design selected tab. |
| `verse-studio:projects:lastProject` | record id string | Projects selected project. |
| `verse-studio:projects:lastActive` | record id string | Last active project; used by Quick Capture defaulting. |
| `verse-studio:projects:sidePanel` | side-panel id string | Projects side panel state. |
| `verse-studio:projects:notesOpen` | `'true' \| 'false'` | Projects notes panel state. |
| `verse-studio:projects:qcKind` | quick-capture kind string | Projects quick-capture kind. |
| `verse-studio:projects:{projectId}:lastType` | record/row type string pattern | Projects row recency; poems intentionally sort last after recency. |
| `verse-studio:prompts:view` | RETIRED view id string | RETIRED — no longer read or written; retired Sweep 34. Existing stored values are ignored. |
| `verse-studio:prompts:blockLibrary:collapsed` | `'true' \| 'false'` | Prompt block-library collapse state. |
| `verse-studio:prompts:lastPipeline` | record id string | Prompt Studio selected pipeline. |
| `verse-studio:prompts:blockMeta` | JSON block metadata object | Prompt block metadata side-state. |
| `verse-studio:prompts:pipelineSteps:{pipelineId}` | JSON pipeline step array | Prompt pipeline helper state. |
| `verse-studio:prompts:pipelineVars:{pipelineId}` | JSON variable object | Prompt pipeline variable side-state. |
| `verse-studio:prompts:pgPos:{focusId}` | JSON graph position map | Prompt graph positions. |
| `verse-studio:prompts:pipelinePreview` | `'true' \| 'false'` | Prompt preview toggle. |
| `verse-studio:canvas:lastProject` | project id string | Canvas selected project; first Meridian seed writes `seed:project:meridian`. Sweep 61: one-time `maybeDefaultCanvasToNexus` migration repoints this to the canonical Nexus project when the stored value is the Meridian seed id or absent (never clobbers a deliberate user navigation). Canvas's mount initializer applies the same preference for cold loads. |
| `verse-studio:canvas:default-nexus-applied` | `'true'` marker | Sweep 61 — one-time marker for the default-to-Nexus repoint. Mirrors the Sweep 56-R Nexus-Panel `default-open-applied` pattern. Set only after the Nexus project is resolved and the migration completes; left unset if Nexus cannot yet be resolved so a later boot retries. |
| `verse-studio:canvas:canonicalProject` | project id string | Sweep 61 — stable id of the canonical Nexus project, written at canonical-canvas seed time and cached by the default-to-Nexus migration. Lets Canvas + the migration resolve Nexus without a name lookup; installs seeded before this key existed fall back to a name/description match. |
| `verse-studio:canvas:positions:{projectId}` | JSON map `nodeId -> {x,y,width?,height?}` | Canvas placement storage; first Meridian seed writes hand positions for `seed:project:meridian`. This is not the `nodePositions` IDB store. |
| `verse-studio:canvas:hidden:{projectId}` | JSON array of hidden node ids | Canvas placement hide/delete-from-canvas state. |
| `verse-studio:canvas:layers:{projectId}` | JSON `LayerVisibility` booleans | Canvas layer visibility state. |
| `verse-studio:canvas:layerPanel:collapsed` | `'true' \| 'false'` | Canvas layer panel collapsed state; first-run default is collapsed/minimized. |
| `verse-studio:canvas:minimap:collapsed` | `'true' \| 'false'` | Canvas minimap panel collapsed state; first-run default is collapsed/minimized. |
| `verse-studio:canvas:editor-drafts:{kind}:{id}` | JSON array of local tile draft objects | Canvas tile-editor local drafts. |
| `verse-studio:exchange:extra:{id}` | JSON exchange stash data | Canvas/exchange extra side-state. |
| `verse-studio:inbox:lastItem` | record id string | Inbox selected item. |
| `verse-studio:inbox:listWidth` | number string | Inbox list width. |
| `verse-studio:library:lastPattern` | record id string | Library selected pattern. |
| `verse-studio:dev-mode` | `'true' \| 'false'` | Sweep 60 — Developer/Experimental Mode toggle; default `'false'`; re-exposes hidden studios (Inbox, Longform, App Design, Library) in the sidebar without affecting URL routability. |
| `verse-studio:canonical-canvas:seeded` | `'true'` marker | Sweep 60 — one-shot marker for the first-run canonical Nexus Mobile project seed. Presence prevents re-seeding. Set on first attempt regardless of empty-workspace outcome so non-empty workspaces are not re-checked on every reload. |

## 3.2 Event-like strings/signals that are not stored keys

These strings are signals/events. Do not list them as stored localStorage keys.

| Signal string | Kind / notes |
|---|---|
| `verse-studio:projectContext:change` | Custom event/signal for project-context change. |
| `verse-studio:select` | Cross-studio select/navigation event. |
| `verse-studio:recent-view` | Recent-view event/signal. |
| `verse-studio:scratch-drawer:open-change` | ScratchDrawer open-state change event/signal. |
| `verse:open-pattern-playground` | Pattern/prompt playground event. |

## 3.3 IndexedDB stores and key paths

Current source truth from `src/db.ts` after Sweep 57:

- `DB_NAME = 'verse-studio'`
- `DB_VERSION = 11`
- `SCHEMA_VERSION = 10`
- Store count: 28 (unchanged)
- `meta` key path: `key`
- All other stores key path: `id`
- Explicit indexes: DB v9 / Sweep 36 plus DB v10 / Sweep 45; see Section 3.3a. DB v11 / Sweep 57 adds no store or index.

| Store | Key path | Notes |
|---|---|---|
| `meta` | `key` | Metadata including schema version. |
| `writingDocs` | `id` | Writing records. |
| `poems` | `id` | Poetry records. |
| `longformProjects` | `id` | Frozen legacy store name; stores `LongformDoc` records. |
| `longformSections` | `id` | Longform section records; `projectId` points to `LongformDoc.id`; optional `status` defaults to draft when undefined. |
| `appDesignBuilds` | `id` | App Design builds. |
| `appDesignConstraints` | `id` | App Design constraints. |
| `appDesignFeatures` | `id` | App Design features. |
| `appDesignScreens` | `id` | App Design screens. |
| `appDesignDataShapes` | `id` | App Design data shapes. |
| `appDesignPhases` | `id` | App Design phases. |
| `appDesignReviews` | `id` | App Design reviews. |
| `shelf` | `id` | Shelf items; v1 `type === 'project'` meant longform and migrates to `longform`. |
| `projects` | `id` | Universal Project containers. |
| `links` | `id` | Record-to-record/project links. |
| `tags` | `id` | Global tag definitions. |
| `tagLinks` | `id` | Tag-target junctions. |
| `dockerScratch` | `id` | Legacy Docker scratchpad tabs. |
| `dockerClipboard` | `id` | Clipboard/Copied history; app-level DOM copy capture writes copied text here. |
| `snapshots` | `id` | Manual record snapshots. |
| `patterns` | `id` | Feature Library patterns. |
| `promptPipelines` | `id` | Prompt Studio pipelines. |
| `promptBlocks` | `id` | Prompt Studio pipeline blocks. |
| `inboxItems` | `id` | Inbox capture surface. |
| `nodePositions` | `id` | Atlas persisted positions; not Canvas positions. |
| `notes` | `id` | Notes records. |
| `scraps` | `id` | Project-linked quick captures/scraps. |
| `prompts` | `id` | Prompt Studio compose drafts. |

## 3.3a IDB indexes (added DB v9 / Sweep 36 and DB v10 / Sweep 45)

| Store | Index name | Key path | Notes |
|---|---|---|---|
| writingDocs, poems, notes, scraps, longformProjects, appDesignBuilds, patterns, promptPipelines, prompts | by_projectId | projectId | Project membership queries |
| writingDocs, poems, notes, scraps, longformProjects, longformSections, appDesignBuilds, patterns, promptPipelines, inboxItems, links, snapshots, prompts | by_createdAt | createdAt | Chronological sort |
| writingDocs, poems, notes, scraps, longformProjects, longformSections, appDesignBuilds, patterns, promptPipelines, inboxItems, prompts | by_updatedAt | updatedAt | Recency queries |
| writingDocs, poems, notes, scraps, longformProjects, appDesignBuilds, patterns, promptPipelines, inboxItems, prompts | by_deletedAt | deletedAt | Soft-delete queries |
| links | by_sourceId, by_targetId | sourceId, targetId | Backlink queries |
| snapshots | by_recordId | recordId | Per-record snapshot queries |
| longformSections | by_status | status | Compile Panel status controls; additive DB v10 index |

Migration rules that must not be lost:
- `importWorkspace` accepts files with `schemaVersion <= SCHEMA_VERSION` and migrates on import.
- v1 shelf rows with `type === 'project'` meant longform and migrate to `type === 'longform'`.
- v2→v3 migrates `Pattern.tags` chip strings into relational `tags` and `tagLinks`, then empties/deprecates `Pattern.tags`.
- v4 added `inboxItems` and `nodePositions`.
- v5 added `notes`.
- v6 was a recovery bump only.
- v7 added `scraps`.
- v8 added `prompts`.
- v9 added high-frequency IDB indexes; no new stores and no row rewrites.
- v10 added optional `LongformSection.status` and `longformSections.by_status`; no row rewrites and no export/import schema bump.
- v11 / Sweep 57 formalized canonical lineage/AI/export fields and bumped workspace export schema to 10; no stores or indexes were added and no bulk row rewrite/content hashing occurs.

## 3.4 Frozen-four files

The frozen-four files are:

1. `src/db.ts`
2. `src/types.ts`
3. `src/context.tsx`
4. `src/seed.ts`

Touching any frozen-four file requires explicit sweep scope and the relevant archives. Schema/state/API edits must update active docs in the same delivery when they change Section 3 contracts.

## 3.5 Diagnostic exporter status

Current status: **PRESENT — v1.1 validation-grade** (installed Sweep 51).

Canonical source: `src/diagnosticExporter.ts` (frozen on creation — changes require explicit
UNFREEZE in the sweep prompt plus posting a fresh `exporter_self_hash` value in the delivery).

The `vite.config.ts` VERIFICATION-INFRASTRUCTURE region (delimited by
`// BEGIN VERIFICATION-INFRASTRUCTURE` / `// END VERIFICATION-INFRASTRUCTURE`) is co-protected
with the same freeze rules.

**Build-time injected constants** (declared in `src/build-constants.d.ts`):
- `__BUILD_COMMIT__` — SHA-256 of the `src/` tree, computed by Algorithm 1 in `vite.config.ts`.
  See `HANDY_CODE_SNIPPETS.MD` for the exact algorithm.
- `__EXPORTER_SELF_HASH__` — SHA-256 of `src/diagnosticExporter.ts` bytes, computed by
  Algorithm 2 in `vite.config.ts`. The Orchestrator independently recomputes this value;
  a bundle whose `exporter_self_hash` does not match the reference will be rejected.

**Bundle schema version**: 1 (field `schema_version` in the bundle). Bumping this integer
requires explicit Orchestrator approval.

**New "Export validation bundle" button**: added to Settings → Diagnostic tab below the
existing "Copy Diagnostic Summary" button. Selectors: `data-test="diagnostic-bundle-export"`,
`data-test="diagnostic-bundle-status"`.

Runtime evidence class is **RUNTIME-UNVERIFIED** until the Orchestrator validates a real
bundle produced by this build. Do not claim RUNTIME-ATTESTED without Orchestrator validation.

## 3.6 Permanent selector contract

The current canonical selector inventory after Sweep 58 is 645 unique `data-test` values from `grep -roh 'data-test="[^"]*"' src/ | sort -u | wc -l`. Separate source scan found 1 unique `data-testid` value. These are verification contracts. Do not rename/remove casually.

Selector examples and families that should trigger archive review:

| Selector/family | Operational area |
|---|---|
| `bootstrap-*` | Bootstrap blocked/error/reset recovery. |
| `canvas-*`, `canvas-node-*`, `canvas-layer-*`, `canvas-tile-*`, `canvas-context-*`, `canvas-scrap-*` | Canvas placement, layers, tile editor, context menu, inline scraps. |
| `project-*`, `projects-*` | Projects rows, project selection, side panels. |
| `prompt-*`, `pipeline-*`, `block-*` | Prompt Studio compose/pipeline/block UI. |
| `doc-*`, `poem-*`, `note-*`, `longform-*` | Writing, Poetry, Notes, Longform editor/list surfaces. |
| `clipboard-*`, `clip-entry-*`, `scratch-*` | Clipboard and ScratchDrawer/Quick Capture. |
| `sidebar-*`, `topbar-*`, `focus-*` | Shell chrome and focus mode. |
| `command-*`, `search-*`, `recent-*` | Command palette, global search, recent views. |
| `tag-*`, `pattern-*`, `library-*` | Tags and Feature Library/pattern surfaces. |
| `atlas-*` | Atlas graph/filter controls. |
| `nexus-panel-*` | Nexus Panel relational inspector and lineage chain. |
| `signal-console-*` | Signal Console read-only overlay. |
| `compile-panel-*` | Longform Compile Panel Markdown export overlay. |

---

# SECTION 4 — STALENESS OWNERSHIP

If an active sweep adds, removes, renames, or semantically changes any Section 3 item, the executing Maintainer must update `PREFLIGHT.MD` in the same delivery.

Semantic changes include:
- value type changes;
- owner changes;
- serialization/shape changes;
- route/path meaning changes;
- IDB keyPath/index changes;
- `DB_VERSION` or `SCHEMA_VERSION` changes;
- store additions/removals/renames;
- selector rename/removal;
- diagnostic exporter status change;
- app name/version or installer command change;
- evidence-class change caused by a validated diagnostic bundle.

A same-name contract change still counts. If this file drifts, it becomes dangerous.

---

# SECTION 5 — TRUE UNRESOLVED FLAGS

These are the true unresolved items carried forward:

1. `bundle ceiling drift` — older docs and later guidance differ; latest active Orchestrator instruction governs future sweeps.
2. `localStorage inventory reconciliation` — this file separates stored keys from event-like strings/signals; future edits must keep the split correct and preserve stored-key value types.
3. `runtime behavior remains RUNTIME-UNVERIFIED` — unresolved until the Orchestrator validates a real diagnostic bundle produced by this build (V1–V6 checks). The Orchestrator will upgrade the evidence class to RUNTIME-ATTESTED once validation succeeds.
4. `installer/ZIP delivery rule` — every full ZIP should include version-matched install/uninstall scripts, icon assets, and `NEXUS_NOTES_INSTALL_COMMANDS.MD`.
5. `Orchestrator V1–V6 validation not yet exercised against a real bundle from this project` — the v1.1 exporter is installed in source; the Orchestrator's validation checks have not yet been run against a bundle produced by this codebase. Resolve by: opening app → Settings → Diagnostic tab → Export validation bundle → relay JSON to Orchestrator.

---

# SECTION 6 — DO NOT DO THESE THINGS

- Do not treat source verification as runtime attestation.
- Do not casually edit `src/diagnosticExporter.ts` or the `vite.config.ts` VERIFICATION-INFRASTRUCTURE region; both are frozen and require explicit UNFREEZE plus a fresh `exporter_self_hash` posted in the delivery.
- Do not convert event-like strings into stored localStorage keys.
- Do not move Canvas positions into `nodePositions`; Canvas positions are localStorage-backed.
- Do not rename `longformProjects` or reinterpret `LongformSection.projectId` without explicit migration scope.
- `LongformSection.status` is optional; valid values are `draft`, `revise`, `final`, `cut`; undefined is treated as `draft`.
- Do not revive localStorage prompt compose drafts; Prompt compose drafts are IDB `prompts` records.
- Do not rename or remove permanent selectors without updating tests/docs and preserving the selector contract.
- Do not edit frozen-four files casually.
- Do not skip archives named by the Orchestrator.

## Nexus Notes v0.01 stable Electron packaging hotfix — 2026-05-23

- Electron shell now pins its Chromium profile/userData path to `~/.config/nexus-notes-v0.01` via `electron/main.cjs`. This isolates stable Nexus Notes v0.01 from older Nexus Verse / early wrapper attempts and avoids stale IndexedDB profile conflicts. This is an Electron wrapper profile path only; it does **not** rename the governed app `DB_NAME` (`verse-studio`) or `verse-studio:*` localStorage/storage keys.
- Installer now backs up old Electron profile folders (`~/.config/nexus-notes-v0.01` and legacy `~/.config/Nexus Notes v0.01`) into `~/.config/nexus-notes-v0.01-backups/` before launch so v0.01 boots cleanly. Exported workspace `.json` backups are unaffected.
- Desktop launcher now uses icon name `nexus-notes-v0.01`, installs SVG plus 64/128/256/512 PNG hicolor icons, and launches Electron with `--class=nexus-notes-v0.01` so GNOME app drawer / window matching is more reliable.
- Added `reset-nexus-notes-v0.01-data.sh` and `nexus-notes-v0.01-reset` for user-approved profile reset if the bootstrap screen reports “The workspace could not be loaded.”
- Historical packaging note: at that hotfix point, no IndexedDB schema/store/localStorage contract changed (`DB_VERSION = 8`, `SCHEMA_VERSION = 8`, 28 stores). Current schema truth is DB v9 / schema v9 after Sweep 36. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED` until browser/Electron verification is actually performed.



## Sweep 30 — ScratchDrawer polish + Electron maximize — 2026-05-23

- `electron/main.cjs` now calls `win.maximize()` immediately after hiding the menu bar, so the desktop shell starts maximized. This is packaging/shell behavior only; it does not change IndexedDB schema or storage prefixes.
- `src/components/ScratchDrawer.tsx` now isolates the drawer toggle to the chevron/`Scratchpad` label button. Tab buttons are siblings of that toggle and no longer rely on `MouseEvent.stopPropagation()` to avoid closing the drawer.
- ScratchDrawer height is user-resizable via `data-test="scratch-drawer-resize"` and persists to `verse-studio:scratch-drawer:height` as an integer pixel number with default `180` and minimum `160`.
- No Frozen Four files changed. Diagnostic exporter remains ABSENT. Runtime remains `RUNTIME-UNVERIFIED` until browser/Electron behavior is actually verified.

## Sweep 31 — PromptStudio ghost text + block copy + pipeline UX — 2026-05-23

- `src/index.css` now suppresses Wayland/Electron transparent-text ghosting for the HighlightedEditor by adding `[data-test="prompt-body"]::selection` with transparent selected text and an accent-soft selection background.
- `src/studios/prompts/PromptStudio.tsx` block-library cards now expose a group-hover copy action for each block body with `data-test="prompts-library-card-copy"` and a short copied/failed flash state; the click stops propagation so it does not insert the card.
- Prompt pipeline empty state now shows a clearer `No steps yet` prompt plus `data-test="pipeline-empty-add"`; the existing add button is always visible as `＋ Add block` under `data-test="pipeline-add-step"`.
- Pipeline steps container is now a block-library drop target via `data-test="pipeline-drop-zone"`; dropped block text creates a NOTE step through the existing localStorage-backed pipeline step path.
- New permanent selectors: `prompts-library-card-copy`, `pipeline-empty-add`, `pipeline-drop-zone`. Current source scan after Sweep 31 found 517 unique `data-test` / `data-testid` selector values.
- No Frozen Four files changed. No IndexedDB schema/store contract changed. Existing `verse-studio:prompts:pipelineSteps:{pipelineId}` keeps the same JSON pipeline step array contract. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 32 — AppMark subtlety + Linux alt-tab icon fix — 2026-05-23

- `src/components/AppMark.tsx` now renders the sidebar mark as a quiet flush SVG rather than a bordered/shadowed badge: no `border-line`, no `shadow-sm`, no `bg-surface-3`; compact size is `w-6 h-6`, normal size is `w-8 h-8`, and the SVG mark opacity is `0.55`.
- `electron/main.cjs` now appends the Linux `WaylandWindowDecorations` feature flag before `app.whenReady()` and explicitly calls both `app.setIcon(icon)` and `win.setIcon(icon)` inside `createWindow()` for GNOME/Wayland alt-tab/window-switcher icon reliability. Existing `app.setDesktopName(`${APP_ID}.desktop`)` remains unchanged.
- No localStorage keys, IDB stores, routes, schema versions, or permanent selectors changed. Selector inventory remains 517 unique `data-test` / `data-testid` values. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 33 — Canvas placement fix + scrap Save button — 2026-05-24

- `src/studios/canvas/Canvas.tsx` now preserves right-click Canvas placement for newly-created notes and scraps. Notes save the `note:{id}` Canvas position before the project-scoping update exposes the record to the records sync effect. Scraps use a post-create correction pass that moves an already-created `scrap:{id}` node to the requested position and writes the same position to `verse-studio:canvas:positions:{projectId}`.
- `CanvasScrapInputCard` now includes a visible `Save` button. Ctrl/Cmd+Enter remains supported.
- New permanent selector: `canvas-scrap-save`. Current source scan after Sweep 33 found 518 unique `data-test` / `data-testid` selector values.
- No Frozen Four files changed. No localStorage key names, localStorage value types, IndexedDB stores, DB_VERSION, or SCHEMA_VERSION changed. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 34 — Prompt Studio unified pipeline editor — 2026-05-24

- `src/studios/prompts/PromptStudio.tsx` now renders `PipelinesView` directly. The retired `verse-studio:prompts:view` key is no longer read or written; existing stored values are ignored.
- ComposeView and its IDB draft-tab editor surface were removed. Pipeline editing is now centered on the first block step, which renders as a full inline autosaving Pattern editor. Empty pipelines can create their first block from the inline draft editor on blur or Ctrl/Cmd+Enter.
- New permanent selectors: `pipeline-first-block-editor`, `pipeline-first-block-name`, `pipeline-steps-divider`, `pipeline-compose-empty`, `pipeline-save-as-prompt`, `pipeline-copy-assembled`. Source scan after Sweep 34 found 502 unique `data-test` / `data-testid` selector values.
- No Frozen Four files changed. No IndexedDB stores, DB_VERSION, SCHEMA_VERSION, localStorage key names, or localStorage value types changed except marking the old view key retired. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 35 — The Stash global save browser + save UX rename — 2026-05-24

- `src/components/Snapshots.tsx` now presents snapshot capture as save UX: the button reads `Save` when empty and `Saved (N)` when versions exist; the menu action reads `Save version`. Existing snapshot selectors are unchanged.
- `/shelf` still routes to `src/studios/shelf/Shelf.tsx` and exports `Shelf`, but the visible heading is now `Stash`. The page browses saved snapshot records first, then preserves the existing shelf bookmark behavior under `Pinned`.
- New permanent selectors: `stash-search`, `stash-filter`, `stash-filter-doc`, `stash-filter-poem`, `stash-filter-note`, `stash-filter-longform`, `stash-filter-build`, `stash-filter-pipeline`, `stash-filter-project`, `stash-item`, `stash-open`, `stash-restore`, `stash-delete`, `stash-empty`. Source scan after Sweep 35 found 516 unique `data-test` / `data-testid` selector values.
- No Frozen Four files changed. No localStorage keys, localStorage value types, IndexedDB stores, DB_VERSION, or SCHEMA_VERSION changed. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 37 — Convert Anything MVP

- No localStorage keys, IDB stores, routes, DB_VERSION, or SCHEMA_VERSION changed.
- New permanent selectors: `convert-modal`, `convert-modal-title`, `convert-modal-preview-source`, `convert-modal-preview-target`, `convert-modal-doc-picker`, `convert-modal-confirm`, `convert-modal-cancel`, `scrap-convert-to-note`, `scrap-convert-to-block`, `note-convert-to-section`, `route-to-scrap`.
- Selector inventory after Sweep 37 is 527 unique `data-test` / `data-testid` values.
- Runtime conversion behavior remains `RUNTIME-UNVERIFIED` until manually tested in browser/Electron.



## Sweep 38 — Nexus Panel MVP

- New stored localStorage key: `verse-studio:nexus-panel:open` with value type `'true' | 'false'`. SUPERSEDED by Sweep 56-R: first-run/default/upgrade behavior now biases open, while the same key remains the persisted user preference.
- New permanent selectors: `nexus-panel`, `nexus-panel-toggle`, `nexus-panel-empty`, `nexus-panel-identity`, `nexus-panel-orphan`, `nexus-panel-project`, `nexus-panel-links-out`, `nexus-panel-link-out-item`, `nexus-panel-links-in`, `nexus-panel-link-in-item`, `nexus-panel-tags`, `nexus-panel-snapshots`, `nexus-panel-lineage`.
- Selector inventory after Sweep 38 is 540 unique `data-test` / `data-testid` values.

## Sweep 39 — UX Trust-Breaker Polish

- No localStorage keys, IDB stores, DB_VERSION, SCHEMA_VERSION, or routes changed. Routes `/atlas` and `/scraps` remain in App.tsx; only sidebar visibility changed.
- Sidebar no longer renders Scraps links after Sweep 39. Sweep 46 restored the Atlas Sidebar link and Sweep 49 restored the Scraps Sidebar link with `sidebar-link-scraps`.
- ScrapsStudio preserves `route-stub-scraps` and adds `scraps-go-to-projects` for the redirect button to Projects.
- Selector inventory after Sweep 39 is 539 unique `data-test` / `data-testid` values.
- Runtime behavior remains `RUNTIME-UNVERIFIED` until manually tested in browser/Electron.


## Sweep 42 — Signal Console overlay — 2026-05-24

- `src/components/SignalConsole.tsx` is a read-only top portal overlay mounted from `src/App.tsx` and toggled by native `document.addEventListener('keydown', ...)` for Cmd/Ctrl+Shift+`.`.
- Signal Console tabs: Schema, Storage, Health. Schema reads `DB_VERSION`, `SCHEMA_VERSION`, and `STORES` from `src/db.ts`, then displays source-verified workspace-array counts without live-querying IndexedDB. `meta` remains source-verified as not loaded into workspace context.
- Storage tab dynamically enumerates `Object.keys(localStorage).filter(k => k.startsWith('verse-studio:'))`; it does not hardcode keys. The only mutating action is clipboard copy via `Copy all as JSON`.
- Health tab and `WorkspaceHealthPanel` share computation through `src/util/healthSignals.ts`; no health repair or navigation controls were added to Signal Console.
- New selector family: `signal-console-*`. Sweep 47 updates the Schema tab with hardcoded `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`; this is a build-time/source constant, not a live DOM query.
- No Frozen Four files, IDB stores, DB_VERSION, SCHEMA_VERSION, migrations, routes, or localStorage key/value contracts changed. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 43 — Nexus Panel lineage chain — 2026-05-24

- `src/components/NexusPanel.tsx` now resolves conversion lineage as a bounded 5-hop ancestry chain with `visited` cycle detection.
- `convertedFromType` is handled as a `StoreName` through an explicit source-verified mapping: `writingDocs`, `notes`, `scraps`, `longformProjects`, `longformSections`, `poems`, `patterns`, `promptPipelines`, `promptBlocks`, `inboxItems`, and `prompts`.
- Lineage renders below link/tag context and above snapshots. Current-record `AI-assisted: yes/no` is always visible; ancestor `[AI]` markers are inline text metadata; soft-deleted ancestors remain visible as `(deleted)`, opacity-50, and non-clickable.
- No DB_VERSION, SCHEMA_VERSION, IDB store, migration, route, installer packaging, or localStorage contract changed. Selector recount remains deferred to Sweep 47. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 44 — Compile Panel basic — 2026-05-24

- Added `src/components/CompilePanel.tsx` and replaced the Longform user-facing download trigger with a `Compile…` trigger that opens a right-edge overlay inside the Longform section editor area.
- Compile Panel snapshots the current ordered Longform sections and word counts when the panel opens. It supports structured Markdown (`## section title` headings) or prose mode (`---` separators), optional front matter, editable date, and Markdown download via the existing `downloadText()` / `safeFilename()` helpers from `src/util/download.ts`.
- New stored localStorage key: `verse-studio:compile:author` with value type string, owner Compile Panel. The panel writes only this key and triggers file download; it does not mutate sections, document titles, DB records, status fields, schemas, or migrations.
- Selector family added: `compile-panel-*`. The existing `longform-download` selector is preserved on the Compile trigger for permanent-selector compatibility; `compile-panel-trigger` is added via `data-testid`.
- No Frozen Four files, DB_VERSION, SCHEMA_VERSION, IDB stores, migrations, routes, section status fields, section filtering, or installer packaging stack changed. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 45 — Longform section status and Compile Panel controls — 2026-05-24

- `src/types.ts` adds `LongformSectionStatus = 'draft' | 'revise' | 'final' | 'cut'` and optional `LongformSection.status`; undefined status is treated as `draft` everywhere and is not a migration failure.
- `src/db.ts` bumps `DB_VERSION` to 10 while `SCHEMA_VERSION` remains 9. The v9→v10 branch is additive-only and creates `longformSections.by_status`; no stores are added, no rows are rewritten, and export/import compatibility is unchanged.
- Compile Panel rows now show status metadata, local include/exclude state, and an inline status picker that persists only `status` through `updateSection`. Sections default included except `cut`, which defaults excluded; compile output and included word totals use included sections only.
- Stored localStorage contracts are unchanged from Sweep 44: Compile Panel still writes only `verse-studio:compile:author`. No routes, seed data, installer packaging, or export/import schema changed. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 46 — Atlas Upgrade — 2026-05-25

- Atlas is visible in Sidebar navigation again at `/atlas`; the existing App route was already mounted and unchanged. Scraps remained hidden from Sidebar until Sweep 49 restored it.
- Atlas node/input-node data now includes `aiLineage: boolean`, sourced from the backing record and defaulted to `false` when missing. AI-lineage record nodes render with a second neutral accent ring.
- Atlas edge/input-edge data now includes optional `color` and `weight`. Link edges read `semanticColorId` and `weight`; because no SemanticColor store exists, color currently resolves to undefined and falls back to `var(--line)`. Edge stroke width is derived from weight and capped at 3.
- No DB_VERSION, SCHEMA_VERSION, IDB store, migration, localStorage key, route, ReactFlow migration, graph-engine replacement, SemanticColor store, SemanticColor UI, or installer packaging change was made. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 47 — Release QA for Signal Layer v0.02 — 2026-05-25

- Release QA verified the self-contained app artifact after build: `grep -c '<script src=' verse-studio.html` returned 0 and `grep -c '/assets/' verse-studio.html` returned 0.
- Canonical selector recount now records 619 unique `data-test` values from the mandated grep command. Separate `data-testid` scan found 1 value; the counts are reported separately and not silently mixed.
- Signal Console Schema tab now displays the hardcoded `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`; it does not query the live DOM.
- Boot gate remains `DB_VERSION = 10` and `SCHEMA_VERSION = 9`; no DB/schema/migration/product-feature changes were introduced. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 48 — ScratchDrawer visibility and Scratchpad overlay fix — 2026-05-25

- `src/App.tsx` now keeps the route content and `ScratchDrawer` in a real flex column: main content is `flex-1 min-h-0` and ScratchDrawer is a normal bottom flex child rather than an absolute overlay sibling.
- `src/components/ScratchDrawer.tsx` outer shell is `flex-none w-full` with the existing height transition and `style={{ height: open ? drawerHeight : 28 }}` preserved; the collapsed 28px bar should be visible on fresh load without a resize.
- `src/components/docker/Scratchpad.tsx` keeps the existing `pb-12` textarea bottom clearance and changes the Save-as-scrap bar to opaque `bg-surface-2` so text does not bleed through under the fixed bottom bar.
- No localStorage keys or value types changed, including `verse-studio:theme`; no Frozen Four files, DB_VERSION, SCHEMA_VERSION, migrations, selector families, routes, or installer packaging changed. Runtime remains `RUNTIME-UNVERIFIED` until browser/Electron verification.

## Sweep 49 — App identity, Focus key, Scraps sidebar — 2026-05-25

- User-facing app identity changes from Nexus Notes to **Noted** via `src/appMeta.ts`; `APP_TAGLINE` is now `Private by default. Relational by design. Portable by right.` and the Sidebar surfaces that tagline in expanded mode. `APP_VERSION`, `APP_TITLE`, and `APP_STORAGE_PREFIX` are unchanged; `verse-studio:*` remains the compatibility storage contract.
- Diagnostic summary app string is now `Noted v0.01-3`, and AppMark aria-label derives from `APP_NAME`. Installer script names, ZIP names, Electron package identifiers, DB name, and storage prefixes were not renamed.
- Global Search no longer captures `/`; its placeholder is `Search… (> for commands)`. Focus Mode now treats `/` as an additional non-input single-key toggle while preserving Cmd/Ctrl+`.`.
- Scraps is visible in Sidebar navigation again with permanent selector `sidebar-link-scraps`; `/scraps` route and ScrapsStudio behavior remain unchanged. Canonical selector count was 614 unique `data-test` values after Sweep 49; Sweep 50 moves current count to 619. Separate `data-testid` count remains 1.
- No localStorage keys or value types, IDB stores, DB_VERSION, SCHEMA_VERSION, migrations, Frozen Four files, or installer packaging stack changed. Runtime remains `RUNTIME-UNVERIFIED`.



## Sweep 50 — Prompts Studio UX overhaul — 2026-05-25

- Prompt Studio keeps existing prompt/pipeline persistence and selector names but shifts visible copy from Pipeline to Prompt where user-facing. No IDB stores, localStorage keys, DB_VERSION, SCHEMA_VERSION, migrations, or Frozen Four files changed.
- Description and Variables controls in `src/studios/prompts/PromptStudio.tsx` are collapsed by default using component `useState`; no new stored keys were added.
- Block library card click feedback is local UI state only. The Prompt header removes the duplicate Materialize action and moves export/save-as-block actions into a `⋯` menu.
- New permanent selectors: `pipeline-desc-toggle`, `pipeline-vars-toggle`, `pipeline-export-menu`, `pipeline-export-dropdown`, `pipeline-save-as-block-menu`, `pipeline-first-block-copy`. Existing `pipeline-export-txt` and `pipeline-export-json` selectors were preserved in the new menu. Removed selector: `pipeline-materialize`. Current canonical selector count is 619 unique `data-test` values; separate `data-testid` count remains 1.
- Signal Console Schema tab now displays hardcoded `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`; it remains a source/build constant and not a live DOM query.


## Sweep 51 — Install v1.1 diagnostic bundle exporter — 2026-05-25

- **CREATED** `src/diagnosticExporter.ts` — frozen validation-grade bundle exporter. Exports `exportValidationBundle(ws)` which produces a `ValidationBundle` conforming to the v1.1 schema. Build-time constants `__BUILD_COMMIT__` (SHA-256 of `src/` tree) and `__EXPORTER_SELF_HASH__` (SHA-256 of this file) are injected via Vite define and embedded in every bundle.
- **CREATED** `src/build-constants.d.ts` — ambient TypeScript declarations for `__BUILD_COMMIT__` and `__EXPORTER_SELF_HASH__`.
- **MODIFIED** `vite.config.ts` — added VERIFICATION-INFRASTRUCTURE region (delimited by `// BEGIN VERIFICATION-INFRASTRUCTURE` / `// END VERIFICATION-INFRASTRUCTURE`) that computes both hashes at build time using Algorithms 1 and 2 (canonical reference in `HANDY_CODE_SNIPPETS.MD`); added `define` block with both constants.
- **MODIFIED** `src/components/DiagnosticPanel.tsx` — added "Export validation bundle" button (`data-test="diagnostic-bundle-export"`) and status element (`data-test="diagnostic-bundle-status"`) below existing "Copy Diagnostic Summary" button. Action calls `exportValidationBundle(ws)` and downloads `noted-diagnostic-bundle-<stamp>.json`.
- **MODIFIED** `src/components/SignalConsole.tsx` — `CANONICAL_DATA_TEST_SELECTOR_COUNT` updated from 619 to 621.
- **RETIRED** `CONTROL_ROOM_STATE.MD` — replaced with retirement notice pointing to Orchestrator's `ORCHESTRATION_STATE.MD`.
- New permanent selectors: `diagnostic-bundle-export`, `diagnostic-bundle-status`. Canonical selector count is now 621. Separate `data-testid` count remains 1.
- No Frozen Four files, IDB stores, DB_VERSION, SCHEMA_VERSION, localStorage keys, routes, or migrations changed.
- `exporter_self_hash` for this build: `ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`
- `build_commit` for this build: `d6e269b97f142d9ad3c9392286d27465c1a30e036723025ab16c7bca12b7a94b`
- Runtime remains `RUNTIME-UNVERIFIED` until the Orchestrator validates a bundle from this build.


## Sweep 52 — Full rebrand to Noted + canonical logo + installer standardisation — 2026-05-25

- `electron/main.cjs`: `APP_NAME` → `'Noted v0.01'`; `APP_ID` → `'noted-v0.01'`; icon path → `noted-v0.01-512.png`.
- `package.json`: `"name"` → `"noted"`.
- `index.html`: `<title>` → `Noted v0.01`.
- `pack.js`: output branded HTML renamed to `noted-v0.01.html` (both `brandedOutPath` and `console.log`).
- `src/components/DiagnosticPanel.tsx`: workspace backup filename → `noted-workspace-backup-*.json`; matching status text updated.
- **CREATED** `icons/noted-v0.01.svg` — canonical logo SVG.
- **CREATED** `icons/noted-v0.01-64/128/256/512.png` — rasterised via cairosvg (all four sizes confirmed).
- **CREATED** `install-noted-v0.01-fedora.sh` — new canonical Fedora 43 installer. Legacy `install-nexus-notes-v0.01-3-fedora.sh` preserved untouched.
- **CREATED** `Quick Install Command Fedora 43.txt`.
- **CREATED** `NOTED_V0.01_INSTALL_COMMANDS.MD`.
- **UPDATED** `ZIP_DELIVERY_RULE.MD` — references updated to `noted-v0.01` artifacts.
- **UPDATED** `NEXUS_NOTES_V0.01-3_INSTALL.MD` — title line only; body preserved.
- No Frozen Four files, IDB stores, DB_VERSION, SCHEMA_VERSION, localStorage keys, routes, selectors, or migrations changed. Selector count remains 621. Diagnostic exporter unchanged (frozen). Runtime remains `RUNTIME-UNVERIFIED`.
- PNG icons: RASTERISED via cairosvg (64×64 = 3 419 B, 128×128 = 7 885 B, 256×256 = 18 804 B, 512×512 = 42 218 B).


## Sweep 53 — Critical bug fixes — 2026-05-25

- **Bug 1 (Scratchpad scroll):** `src/components/docker/Scratchpad.tsx` — added `overflow-y-auto` to textarea className; added `textareaRef` and `useEffect` that calls `ta.scrollTop = ta.scrollHeight` only when `selectionStart === value.length` (cursor at end), so mid-text edits are not disrupted.
- **Bug 2 (Canvas connections):** `src/studios/canvas/Canvas.tsx` — `handleConnect` now splits on first colon only using `indexOf(':')` + `slice()`, preserving multi-segment IDs correctly. Prevents misparse of any node ID containing multiple colons.
- **Bug 3 (Canvas fitView regression):** `src/studios/canvas/Canvas.tsx` — removed `fitView` boolean prop from `<ReactFlow>` (which re-triggered fitView on every re-render including background autosave edge updates). Added `FitViewOnMount` component rendered as a child of `<ReactFlow>` (gets ReactFlow context via provider), calling `fitView({ padding: 0.2 })` once with 50ms delay when `selectedProjectId` changes. Added `useReactFlow` to imports.
- **Bug 4 (Double-click maximize):** Created `electron/preload.cjs` (contextBridge exposes `window.electronAPI.toggleMaximize`). Updated `electron/main.cjs`: added `ipcMain`, module-level `win` reference, `ipcMain.handle('toggle-maximize', ...)`, `preload` in `webPreferences`, `win.on('closed', ...)` cleanup. Updated `src/components/TopBar.tsx`: added `onDoubleClick` → `window.electronAPI?.toggleMaximize?.()` (no-op in browser).
- **Bug 5 (ScratchDrawer not visible on maximize):** `src/components/ScratchDrawer.tsx` — added `resize` event listener that clamps `drawerHeight` to `window.innerHeight * 0.7` on window resize/maximize. Added `min-h-[28px]` and `relative` to ScratchDrawer root div.
- **CREATED** `electron/preload.cjs` (not frozen; document in handoff).
- No Frozen Four files, IDB stores, DB_VERSION, SCHEMA_VERSION, localStorage keys, routes, or migrations changed. Selector count remains 621. Diagnostic exporter unchanged (frozen). Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 53-R — targeted bug revision — 2026-05-25

- **Bug 5-R (ScratchDrawer persisted height):** `src/components/ScratchDrawer.tsx` now clamps the stored `verse-studio:scratch-drawer:height` value on initial read to `Math.floor(window.innerHeight * 0.65)`, preserving the `MIN_HEIGHT` floor and preventing oversized prior values from filling the viewport on startup. The root drawer element also carries an open-state `maxHeight` guard of 70% of the current viewport height.
- **Bug 5-R (first-boot drawer visibility):** ScratchDrawer now defaults open when `verse-studio:scratch-drawer:open` is absent, while preserving explicit stored `true` / `false` user preference values through the existing key contract.
- **Bug 5-R (startup resize ordering):** `src/main.tsx` now skips `window.moveTo` / `window.resizeTo` when `window.electronAPI` is present, avoiding pre-React Electron resize side effects while keeping the browser-context resize attempt guarded.
- **Bug 4-R (TopBar maximize):** `src/components/TopBar.tsx` now uses a dedicated `data-test="topbar-drag-region"` with `WebkitAppRegion: 'drag'`; interactive TopBar regions/buttons are marked `WebkitAppRegion: 'no-drag'`. The previous root-level double-click handler was removed.
- **Bug 4-R (preload visibility):** `electron/main.cjs` keeps `preload: path.join(__dirname, 'preload.cjs')` and now logs `[preload check]` with `typeof window.electronAPI` on `did-finish-load`. `electron/preload.cjs` exists unchanged from Sweep 53 and continues exposing `window.electronAPI.toggleMaximize`.
- No Frozen Four files, diagnostic exporter files, IDB stores, DB_VERSION, SCHEMA_VERSION, routes, migrations, or localStorage key names/value types changed. New permanent selector: `topbar-drag-region`. `src/components/SignalConsole.tsx` now reports `CANONICAL_DATA_TEST_SELECTOR_COUNT = 622`. Runtime remains `RUNTIME-UNVERIFIED` until browser/Electron behavior is verified by the Orchestrator.

## Sweep 54 — Make Noted feel like Noted — 2026-05-25

- Sidebar primary order is now Projects, Inbox, Writing, Notes, Canvas, Longform, App Design, Prompts, then Library, Stash, Settings. Atlas, Scraps, and Poetry routes remain mounted in `src/App.tsx` but are hidden from primary navigation. Default and fallback routes now go to `/projects`.
- `src/seed.ts` now plants canonical Meridian seed records with stable `seed:*` IDs, skips seeding when `seed:project:meridian` already exists, and writes first-seed Canvas defaults to `verse-studio:canvas:lastProject` and `verse-studio:canvas:positions:seed:project:meridian`. DB_VERSION remains 10, SCHEMA_VERSION remains 9, and store count remains 28.
- App-level DOM copy capture now listens on `document` in capture phase and stores selected copied text in `dockerClipboard` through the workspace API. It truncates captured text to 500 characters, dedupes against the newest entry, and enforces a 200-item ring buffer. The ScratchDrawer `clip` tab is visibly labeled Copied. No `navigator.clipboard.readText()` remains.
- Prompt Studio keeps its existing persistence model; copy was lightly aligned to the private knowledge foundry / Meridian demo loop. Diagnostic exporter unchanged. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 55 — Theme System with Matrix default — 2026-05-25

- `verse-studio:theme` semantic contract changed from raw `'light' | 'dark'` to JSON `ThemeSettings` with `preset` (`matrix`, `paper`, `midnight`) and optional RGB-triplet token `overrides`. Legacy raw `dark` and `light` remain accepted and map to `midnight` and `paper`; missing/invalid maps to `matrix`.
- Theme selection is now driven by `document.documentElement.dataset.theme`; `.dark` is no longer the canonical switch. `index.html` mirrors the small boot parser from `src/theme.ts` so preset + overrides apply before React loads.
- CSS theme tokens are RGB triplets and Tailwind colors use `rgb(var(--token) / <alpha-value>)` for opacity utilities. Matrix is the default preset.
- ARCHIVE WAIVER USED for Sweep 55 only: `PERSISTENCE_SCHEMA_AND_STORAGE_HISTORY.MD`, `UI_LAYOUT_AND_EDITOR_HISTORY.MD`, and `BOOTSTRAP_PACKAGING_AND_VERIFICATION_HISTORY.MD` were referenced by `ARCHIVE_INDEX.MD` but unavailable due to midstream port.
- No Frozen Four files, DB_VERSION, SCHEMA_VERSION, IDB stores, package manifests, diagnostic exporter, or Vite verification infrastructure changed.

## Sweep 55-R — Canvas / Prompt Studio / ScratchDrawer trust polish — 2026-05-25

- New stored localStorage key: `verse-studio:canvas:minimap:collapsed` with value type `'true' | 'false'`; missing key defaults to collapsed/minimized.
- `verse-studio:canvas:layerPanel:collapsed` now defaults to collapsed/minimized when the key is absent while preserving stored preferences.
- `verse-studio:scratch-drawer:height` first-run default is now `180` px, still clamped by `MIN_HEIGHT = 160` and viewport limits.
- OWNER-CANON [DIRECT]: minimized/collapsed canvas and drawer controls should use the clean Layers-style compact button/panel treatment unless explicitly superseded. Runtime remains `RUNTIME-UNVERIFIED` until live checks run.

## Sweep 55-G — GitHub readiness gate — 2026-05-25

- OWNER-CANON [DIRECT]: The project has reached a quality threshold where the owner is considering GitHub publication. This is a direction of travel, not publish authorization.
- DRAFTED / GATED: GitHub publication still requires license choice, owner review of public/private doc boundaries, generated artifact policy, installer policy, security/private-content review, runtime attestation status, and owner go/no-go.
- TECH-CANON: Keep `package.json` `private: true` unless explicitly authorized otherwise; GitHub source visibility is separate from npm package publication.
- TECH-CANON: `README.md` and `NOOB_GUIDE.MD` are public-facing docs and must not become AI relay/governance dumps.
- No app behavior, DB/schema/migration, storage prefix, route, selector, build identity, package manifest, or dependency changes were authorized or made. Runtime claims from Sweep 55-R remain pending/manual.

## Sweep 56 — AI Brief Export + FocusContext foundation + branding — 2026-05-25

- OWNER-CANON: Sweep 55-G remains a GitHub candidate only. Sweep 56 continues product work on top of that candidate; it is not a release, publication, license, or GitHub go/no-go authorization.
- TECH-CANON: AI Brief Export is export-only. It generates a local JSON `NEXUS TOPOLOGY EXPORT` with `nexus_topology_version: "1.0.0"`, `workspace_schema_version` from the current `SCHEMA_VERSION`, `content_depth: "titles_summaries"`, nodes, edges, allowed node/edge vocabularies, and the canonical AI enrichment system prompt. No import/writeback/network/AI execution path is authorized.
- TECH-CANON: `src/focus/FocusContext.tsx` is now the intended cross-studio ephemeral UI focus source. Existing `ws.activeRecord` / `ws.setActiveRecord` remains transitional compatibility for command/link behavior.
- BRANDING: `APP_TAGLINE` is now `Private by default. Relational by design. Portable by right.` User-facing positioning may say private knowledge foundry, local-first creative workspace, and AI-assisted by choice. Internal app/storage identity remains `noted-v0.01` and `verse-studio:*`.
- RISK: AI Brief Export downloads local snippets/summaries from user content. The UI/docs must state that it does not send data anywhere, while the resulting JSON may contain private content if the user shares it.
- DEFERRED: AI import, round-trip/writeback, Ollama/API bridges, DB v11, semantic color store, Noted Packet import/export, publication finalization, and dependency/audit remediation.
- Runtime status remains pending/manual unless separately attested. Sweep 55-R runtime checks are still not promoted by this source/build sweep.


## Sweep 56-R — Nexus Panel default-open UX correction — 2026-05-25

- OWNER-CANON [DIRECT]: Nexus Panel should be open by default because it completes the visible product model. The previous Nexus Panel collapsed-by-default canon is SUPERSEDED.
- TECH-CANON: `verse-studio:nexus-panel:open` remains the persisted user preference key with value type `'true' | 'false'`; missing/invalid values now default open.
- New UI-only localStorage marker: `verse-studio:nexus-panel:default-open-applied` (`'true'`). When absent, the app opens the panel once after this sweep and writes `verse-studio:nexus-panel:open = 'true'`; after the marker exists, explicit user close/open choices are respected.
- FocusContext-first / Workspace `activeRecord` fallback behavior from Sweep 56 remains intact. Focus mode still hides the panel through `data-focus-hide="nexus-panel"`.
- Runtime remains pending/manual until browser/Electron checks confirm first-run open state, collapse/reopen persistence, focus updates, and focus-mode hiding.


## Sweep 57 — DB v11 / workspace schema v10 alignment — 2026-05-25

- OWNER/RUNTIME-CANON: Sweep 56-R is runtime-attested by owner; Nexus Panel opens by default. Sweep 57 runtime/migration verification is pending until launched over existing data.
- TECH-CANON: Current accepted source moves to `DB_VERSION = 11` and `SCHEMA_VERSION = 10` if Sweep 57 is accepted. Store count remains 28; `DB_NAME = 'verse-studio'`; app identity remains `noted-v0.01`; `verse-studio:*` prefixes remain protected.
- TECH-CANON: v11 canonical fields are normalized at read/write/import boundaries: `isSeedData`, `convertedFromId`, `convertedFromType`, `convertedAt`, `aiLineage`, and `contentHash` on primary records; `relationshipType`, `semanticColorId`, `weight`, and `aiLineage` on links; `outputTarget` on prompt pipelines.
- TECH-CANON: `relationshipType` is canonical storage. `label` remains the workspace/AI export alias and a backcompat fallback; new link writes temporarily persist both for compatibility.
- IMPORT/EXPORT: Workspace export now emits `schemaVersion: 10`; import accepts `schemaVersion <= 10` and normalizes older rows without destructive rewrites.
- DEFERRED: `aiMeta`, AI import/writeback/round-trip, Ollama/API bridges, Semantic Color Engine/store, Noted Packet import/export, and automated smoke tests.
- PUBLICATION-CANON: Sweep 55-G remains a GitHub candidate only; no license/release/publication decision is made by this schema sweep.


## Sweep 58 — Nexus Panel relational spine — 2026-05-26

- TECH-CANON: `src/nexus/useNexusIndex.ts` is the read-only memoized Nexus query layer over workspace context and recent views. It owns focused-record derived context: project membership, links/backlinks, tags, snapshots, conversion/AI lineage, canvas placements, orphan status, and suggested connections.
- TECH-CANON: `FocusContext` remains ephemeral UI state and should not be persisted. Existing `ws.activeRecord` remains compatibility state for commands/navigation.
- Product state: Nexus Panel is now a compact relational instrument with focus origin/time, actionable open/focus controls, link/backlink buttons, lineage, canvas placement display, and display-only suggested connections.
- Add-only selector update: `nexus-panel-focus-title`, `nexus-panel-focus-origin`, `nexus-panel-related-item`, `nexus-panel-suggested-link-item`, `nexus-panel-canvas-placement-item`, `nexus-panel-action-open`, `nexus-panel-action-convert` are protected smoke selectors. Current source scan: 645 unique `data-test` values plus 1 `data-testid`.
- Archive waiver: Orchestrator waived the missing UI/cross-studio/canvas/prompt/governance archive files for this named sweep only. This waiver is documented in `LANDMINES.MD` and `reports/SWEEP58_DELIVERY_REPORT.md`.
- Protected constants unchanged: `DB_NAME = 'verse-studio'`, `DB_VERSION = 11`, `SCHEMA_VERSION = 10`, IDB store count = 28. `src/diagnosticExporter.ts` remains unchanged; `exporter_self_hash = ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`.
- Build source hash for this delivery: `be1b5454700d2cead3e2e6c1f0089dc7051d2d408e22046df002694a958d7afc`. Runtime remains `RUNTIME-UNVERIFIED` until owner smoke/bundle evidence is accepted.
