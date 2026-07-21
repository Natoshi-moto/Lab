# AI_README.MD

### FINAL OUTPUT (apply this)

## Current truth

Noted is currently **v0.01**. This branding/package sweep follows the v1.1 Auditor consolidation. `package.json` now says `0.0.1`; treat the older Nexus Verse Studio v0.07 identity as the pre-rename source lineage. Storage contracts intentionally retain the legacy `verse-studio:*` prefix. Sweep 56-R Nexus Panel runtime is **`RUNTIME-ATTESTED [OWNER]`**; Sweep 57 DB migration/runtime checks remain **`RUNTIME PENDING`** until launched and verified. Sweep 58 Nexus relational-spine work is **SOURCE-VERIFIED + TEST-VERIFIED; runtime pending** until owner smoke or bundle evidence is relayed. (source: post-Pass-5 branding/package sweep; preserves invariant A-01 evidence limits)

The app is a browser-only Vite + React + TypeScript single-page app. It uses IndexedDB for records, localStorage for UI/side state, HashRouter routes, and no backend/auth/server requirement. (source: `AI_README.MD`, Current shape; invariant A-02)

## What the next Maintainer must read first

1. `PREFLIGHT.MD` — mandatory boot ritual and active contracts.
2. `ARCHIVE_INDEX.MD` — operational trigger map for archive requests.
3. Any archive named by the Orchestrator for the current sweep.
4. The frozen-four source files if the sweep touches schema/state/types/seed: `src/db.ts`, `src/types.ts`, `src/context.tsx`, `src/seed.ts`.

Do not claim runtime behavior has been verified from source inspection. Runtime claims remain `RUNTIME-UNVERIFIED` until the Orchestrator validates a diagnostic bundle. Diagnostic exporter status is **PRESENT — v1.1 validation-grade** (`src/diagnosticExporter.ts`, frozen, Sweep 51). (source: post-Pass-5 branding/package sweep; invariants A-11, A-19, A-20, A-21, E-08)

## Build and artifact contract

`npm run build` runs `vite build && node pack.js`. `pack.js` emits `verse-studio.html` at repo root and must fail if external script/style/asset references remain. Do not bypass this contract by hand-copying assets into a pseudo-single-file build. (source: `TRANSITION_READINESS_REPORT.MD`, Build and generated artifact expectations; invariant A-03)

`README.md` is user-facing and short. Do not expand it into a maintainer handoff unless a future source-backed instruction explicitly requires that. (source: Auditor Pass 4 instruction; invariant A-18)

## Current active contracts

- `DB_VERSION = 11`; `SCHEMA_VERSION = 10` after Sweep 57. Store count remains 28; `DB_NAME = 'verse-studio'` is unchanged. (source: `src/db.ts`; invariant A-04 updated by Sweep 57)
- 28 IndexedDB stores are declared; `meta` uses key path `key`, all other stores use key path `id`, and DB v9 adds explicit indexes documented in `PREFLIGHT.MD` Section 3.3a. (source: `TRANSITION_READINESS_REPORT.MD`, IndexedDB stores; invariant A-05)
- Stored localStorage keys and event-like strings must stay separated. The stored-key/value-type table lives in `PREFLIGHT.MD`, `AI_CODEBASE_HANDOFF.MD`, and `CODEBASE_ORIENTATION.MD`. (source: `TRANSITION_READINESS_REPORT.MD`, Literal localStorage key/prefix inventory; invariants A-08, A-09)
- `data-test` / `data-testid` literals are permanent verification contracts; current source scan after Sweep 37 found 527 unique selectors. (source: `AUDITOR_SIGNOFF.MD`, CURRENT TECHNICAL STATE; invariant A-10)
- Diagnostic exporter status: **PRESENT — v1.1 validation-grade**. `src/diagnosticExporter.ts` is the canonical frozen exporter (Sweep 51). Settings → Diagnostic tab now has an "Export validation bundle" button. `build_commit` and `exporter_self_hash` are injected at build time by the VERIFICATION-INFRASTRUCTURE region in `vite.config.ts`. Runtime evidence upgrades to RUNTIME-ATTESTED after Orchestrator V1–V6 validation of a real bundle. (source: Sweep 51; invariants A-11, A-19, A-20, A-21)

## Routes

Current route inventory: `/inbox`, `/writing/*`, `/notes/*`, `/poetry/*`, `/longform/*`, `/app-design/*`, `/projects`, `/prompts`, `/canvas`, `/atlas`, `/library`, `/shelf/*`, `/scraps`, `/settings`; default/fallback routing goes to Projects. Primary Sidebar order is Projects, Inbox, Writing, Notes, Canvas, Longform, App Design, Prompts, then Library, Stash, Settings. Atlas, Scraps, and Poetry remain routed but hidden from primary navigation. (source: Sweep 54; invariant C-01)

## Feature-state summary

- Prompt compose drafts are IDB-backed `Prompt` records in the `prompts` store. Do not revive old localStorage prompt-draft arrays. Pipeline helper state remains localStorage side-state. (source: `AI_README.MD`, v0.02 Prompt Studio IDB migration; invariants A-12, A-13)
- Canvas positions are localStorage-backed at `verse-studio:canvas:positions:{projectId}`. The `nodePositions` store is not Canvas placement storage. (source: `LANDMINES.MD`, Sweep 32 canvas landmines; invariant A-14)
- Canvas `contentType` is render-time state and is not persisted into position maps. (source: `LANDMINES.MD`, Sweep 41 / v0.06 Canvas layer-order landmine; invariant A-15)
- `scraps` is a live IDB store; `Scrap.deletedAt` is the soft-delete marker. Projects Scraps UI is live inside Projects rows; `/scraps` remains limited/placeholder per legacy docs. (source: `LANDMINES.MD`, Sweep 37 and Sweep 38; invariants A-16, A-17)
- Writing, Notes, Poetry, and Longform use split-list/editor layouts. `.editor-body-pad` is the canonical body-writing spacing pattern. (source: `LANDMINES.MD`, Sweep 36 / v0.04 editor-width landmine; invariants C-02, C-09)

## True unresolved items

- **Bundle ceiling drift.** Historical prompts/docs conflict on bundle-size limits; latest active Orchestrator instruction controls until a new explicit limit is installed.
- **localStorage inventory reconciliation.** Stored localStorage keys/prefixes must remain separated from event-like strings/signals; value types must stay attached to stored keys.
- **Runtime behavior remains `RUNTIME-UNVERIFIED`.** Source/governance evidence does not attest live runtime behavior.
- **Diagnostic exporter v1.1 installed.** `src/diagnosticExporter.ts` (frozen) exports `exportValidationBundle(ws)`. Settings → Diagnostic tab has a new "Export validation bundle" button. `build_commit` (SHA-256 of `src/` tree) and `exporter_self_hash` (SHA-256 of exporter file) are injected at build time. Runtime upgrades to RUNTIME-ATTESTED after Orchestrator validates a bundle from this build.

## Invariant coverage in this staged README

| ID | Evidence class | Current invariant | Source trace |
|---|---|---|---|
| A-01 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | App identity is Noted v0.01; lineage comes from Nexus Verse Studio v0.07; package.json is 0.0.1 for this branded package. | AUDITOR_SIGNOFF.MD — PROJECT IDENTITY; TRANSITION_READINESS_REPORT.MD — App identity and version |
| A-02 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Browser-only Vite + React + TypeScript SPA; IndexedDB records, localStorage UI/side state, HashRouter routes, no backend/auth/server requirement. | AI_README.MD — Current shape; AI_CODEBASE_HANDOFF.MD — Repo summary; CODEBASE_ORIENTATION.MD — One-screen mental model |
| A-03 | SOURCE-VERIFIED | Single-file packed artifact: npm run build invokes vite build and pack.js; pack must fail if external refs remain. | TRANSITION_READINESS_REPORT.MD — Build and generated artifact expectations; LANDMINES.MD — Single-file pack contract |
| A-04 | SOURCE-VERIFIED | Current DB_VERSION = 11 and SCHEMA_VERSION = 10 after Sweep 57. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — Evidence-class summary |
| A-05 | SOURCE-VERIFIED | There are 28 declared IDB stores; meta keyPath key, all other listed stores keyPath id; DB v9 declares explicit indexes documented in PREFLIGHT.MD Section 3.3a. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — IndexedDB stores |
| A-06 | SOURCE-VERIFIED | Frozen-four files are src/db.ts, src/types.ts, src/context.tsx, and src/seed.ts. | LANDMINES.MD — Frozen four; AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE |
| A-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Active stored localStorage inventory and value types must be preserved. | AUDITOR_SIGNOFF.MD — CURRENT TECHNICAL STATE; TRANSITION_READINESS_REPORT.MD — Literal localStorage key/prefix inventory |
| A-10 | SOURCE-VERIFIED / tests RUNTIME-UNVERIFIED | data-test/data-testid literals are permanent verification contracts; current source scan after Sweep 58 found 645 unique `data-test` values (1 `data-testid`). | Sweep 51 delivery; PREFLIGHT.MD Section 3.6 |
| A-11 | SOURCE-VERIFIED | Diagnostic exporter v1.1 installed as frozen `src/diagnosticExporter.ts` (Sweep 51). `build_commit` and `exporter_self_hash` injected at build time. Runtime upgrades to RUNTIME-ATTESTED after Orchestrator validation. | PREFLIGHT.MD Section 3.5; LANDMINES.MD Sweep 51 entry |
| A-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt compose drafts are IDB-backed Prompt records in prompts store via workspace prompt APIs; old localStorage prompt draft arrays must not be revived. | AI_README.MD — v0.02 Prompt Studio IDB migration; LANDMINES.MD — v0.02 Prompt Studio IDB migration landmines |
| A-13 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Prompt pipeline helper state remains localStorage-backed side-state. | AI_README.MD — v0.02 Prompt Studio IDB migration; FOR_NEXT_OPUS_5.md — Data layer |
| A-14 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas positions are localStorage-backed, not IDB-backed; nodePositions is Atlas-style persisted positions, not Canvas placement storage. | LANDMINES.MD — Calibration Sweep 1 / Sweep 32 canvas landmines; CODEBASE_ORIENTATION.MD — Data model checkpoints |
| A-16 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | scraps is a live IndexedDB store; Scrap.deletedAt is the soft-delete marker; active scraps exclude deleted records. | LANDMINES.MD — Sweep 37 scraps data-layer landmines; HANDY_CODE_SNIPPETS.MD — Scraps data-layer CRUD |
| A-17 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | /scraps route is not equivalent to full Scraps workflow; Projects Scraps UI is live inside Projects rows while /scraps remains limited/placeholder per source docs. | LANDMINES.MD — Sweep 38 Projects Scraps UI landmines; AI_CODEBASE_HANDOFF.MD — Sweep 38 handoff update |
| A-18 | SOURCE-VERIFIED | Auditor delivery is docs/archive/index/preflight only; no functional-code modifications and no full codebase ZIP. | AUDITOR_SIGNOFF.MD — AUDITOR INSTRUCTIONS; PROMPT_C_AUDITOR.v1.1 — THE FOUR OUTPUTS YOU PRODUCE |
| A-19 | SOURCE-VERIFIED | `build_commit` is SHA-256 of the `src/` tree computed per Algorithm 1 in `HANDY_CODE_SNIPPETS.MD`. Algorithm change requires same-sweep update in both `vite.config.ts` VERIFICATION-INFRASTRUCTURE region and `HANDY_CODE_SNIPPETS.MD`. | HANDY_CODE_SNIPPETS.MD — Build-time hash algorithms (Sweep 51); LANDMINES.MD — Sweep 51 entry |
| A-20 | SOURCE-VERIFIED | `exporter_self_hash` is SHA-256 of `src/diagnosticExporter.ts` bytes computed at vite build time and injected via `define`, then embedded in every bundle. Orchestrator independently recomputes this to verify bundle authenticity. | HANDY_CODE_SNIPPETS.MD — Build-time hash algorithms (Sweep 51); PREFLIGHT.MD Section 3.5 |
| A-21 | SOURCE-VERIFIED | Bundle schema (shape AND field order) is the contract in `src/diagnosticExporter.ts` and matches Orchestrator V1–V6 checks. Bumping `schema_version` requires explicit Orchestrator approval. | HANDY_CODE_SNIPPETS.MD — Build-time hash algorithms (Sweep 51); LANDMINES.MD — Sweep 51 entry |
| C-01 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Current top-level routes are fixed route inventory; default/fallback goes to Writing. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-02 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Writing, Notes, Poetry, and Longform use native split-list/editor patterns with persistent lists and width/selection keys. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-03 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | TopBar is slim; theme/focus controls live in Sidebar footer; Cmd/Ctrl+. remains reliable focus toggle. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-04 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Quick Capture/ScratchDrawer is global bottom overlay in shell chrome; do not revert to right-side Docker panel without explicit reversal. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-09 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | .editor-body-pad is canonical body-writing spacing; do not restore centered max-width wrappers casually. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas layer order: hidden suppression first, derive content type, count layers, then apply layer visibility. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-01 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | importWorkspace accepts schemaVersion <= SCHEMA_VERSION and migrates on import. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-04 | SOURCE-VERIFIED | Post-v3 schema bumps are additive unless explicit: v4 inboxItems/nodePositions, v5 notes, v6 recovery bump, v7 scraps, v8 prompts. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-06 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Components should call workspace context methods instead of idb directly. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-07 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Workspace context is central state/API layer; CRUD updates React state and writes through to IDB. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-01 | SOURCE-VERIFIED | High-risk source paths include frozen-four plus App, Sidebar, PromptStudio, Canvas. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Verification command signals include npm run build, node --check verify-sweep29.mjs, node verify-sweep29.mjs, CHROMIUM_PATH where needed. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |

## Post-Pass-5 branding/package sweep — Nexus Notes v0.01

This delivery renamed the user-facing app surface to **Nexus Notes v0.01** and added a desktop Electron installer package without changing IndexedDB schema, store names, key paths, or localStorage storage-prefix contracts. The app still uses `verse-studio:*` localStorage keys for backward compatibility. The new desktop install path is documented in `NEXUS_NOTES_INSTALL_COMMANDS.MD`; the repeatable ZIP delivery rule is documented in `ZIP_DELIVERY_RULE.MD`. Runtime behavior remains **`RUNTIME-UNVERIFIED`** until validated by an accepted runtime bundle or equivalent Orchestrator-approved runtime proof.

## Nexus Notes v0.01 stable Electron packaging hotfix — 2026-05-23

- Electron shell now pins its Chromium profile/userData path to `~/.config/nexus-notes-v0.01` via `electron/main.cjs`. This isolates stable Nexus Notes v0.01 from older Nexus Verse / early wrapper attempts and avoids stale IndexedDB profile conflicts. This is an Electron wrapper profile path only; it does **not** rename the governed app `DB_NAME` (`verse-studio`) or `verse-studio:*` localStorage/storage keys.
- Installer now backs up old Electron profile folders (`~/.config/nexus-notes-v0.01` and legacy `~/.config/Nexus Notes v0.01`) into `~/.config/nexus-notes-v0.01-backups/` before launch so v0.01 boots cleanly. Exported workspace `.json` backups are unaffected.
- Desktop launcher now uses icon name `nexus-notes-v0.01`, installs SVG plus 64/128/256/512 PNG hicolor icons, and launches Electron with `--class=nexus-notes-v0.01` so GNOME app drawer / window matching is more reliable.
- Added `reset-nexus-notes-v0.01-data.sh` and `nexus-notes-v0.01-reset` for user-approved profile reset if the bootstrap screen reports “The workspace could not be loaded.”
- Historical packaging note: at that hotfix point, no IndexedDB schema/store/localStorage contract changed (`DB_VERSION = 8`, `SCHEMA_VERSION = 8`, 28 stores). Current schema truth is DB v9 / schema v9 after Sweep 36. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED` until browser/Electron verification is actually performed.



## Nexus Notes v0.01 block-creation stability hotfix — 2026-05-23

Prompt Studio block creation received a minimal UX/stability hotfix in `src/studios/prompts/PromptStudio.tsx`. Blocks remain `Pattern` records with `type === 'block'`; no IndexedDB schema, DB version, store name, localStorage key, or route contract changed. The block edit drawer now keeps the internal block type read-only so users cannot accidentally change a summonable block into another pattern type. The pipeline picker also exposes an explicit blank-block creation path when no saved blocks exist yet. Runtime behavior remains `RUNTIME-UNVERIFIED` until checked on the user's machine. See `HOTFIX_BLOCK_CREATION_REPORT.MD`.


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

- Prompt Studio now renders the pipeline workspace directly; the compose/pipelines view switch and ComposeView draft-tab editor were removed.
- `verse-studio:prompts:view` is retired: it is no longer read or written, and existing stored values are ignored rather than deleted.
- PipelineDetail now treats the lowest-order block step as the inline compose editor, using the existing HighlightedEditor and slash-summon behavior. Empty pipelines can create their first block from the inline draft editor on blur or Ctrl/Cmd+Enter.
- Pipeline header publish actions now include `Save as prompt`, `Save as block`, and assembled-text `Copy`.
- New permanent selectors: `pipeline-first-block-editor`, `pipeline-first-block-name`, `pipeline-steps-divider`, `pipeline-compose-empty`, `pipeline-save-as-prompt`, `pipeline-copy-assembled`. Current source scan after Sweep 37 found 527 unique `data-test` / `data-testid` selector values.
- No Frozen Four files, IndexedDB stores, DB_VERSION, SCHEMA_VERSION, localStorage key names, or localStorage value types changed. Diagnostic exporter remains ABSENT; runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 35 — The Stash global save browser + save UX rename — 2026-05-24

- `/shelf` remains the route and `Shelf` remains the export name, but the visible page title is now `Stash` with a saved-snapshot browser above the existing pinned shelf bookmark list.
- Stash saved rows are sourced from `ws.snapshots`, sorted newest-first, searchable by parsed title, and filterable by doc/poem/note/longform/build/pipeline/project. Open uses `jumpToSelection` + `ROUTE_FOR_TYPE` when a route exists; restore mirrors the existing `Snapshots` restore handlers.
- `src/components/Snapshots.tsx` labels now use save-oriented copy: `Save`, `Saved (N)`, and `Save version`. Snapshot data-test selectors were preserved.
- New permanent selectors: `stash-search`, `stash-filter`, `stash-filter-doc`, `stash-filter-poem`, `stash-filter-note`, `stash-filter-longform`, `stash-filter-build`, `stash-filter-pipeline`, `stash-filter-project`, `stash-item`, `stash-open`, `stash-restore`, `stash-delete`, `stash-empty`. Current source scan after Sweep 37 found 527 unique `data-test` / `data-testid` selector values.
- No storage/schema/localStorage contracts changed. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 37 — Convert Anything MVP

- Convert Anything MVP is source-level implemented: Scrap→Note, Scrap→Prompt Block, InboxItem→Note, InboxItem→Scrap, and Note→LongformSection.
- `convertRecord` in `src/context.tsx` is the only conversion write path; components do not write directly to IDB.
- New selectors raise the selector inventory to 527. Runtime behavior remains `RUNTIME-UNVERIFIED` until browser/Electron verification.



## Sweep 38 — Nexus Panel MVP

- Added `src/components/NexusPanel.tsx`, a right-edge relational inspector mounted in `src/App.tsx`.
- Added stored key `verse-studio:nexus-panel:open` (`'true' | 'false'`) for collapsed/open state. Sweep 56-R supersedes the old collapsed default: missing/invalid/default-upgrade state opens the panel by default.
- Focus mode hides the panel via `data-focus-hide="nexus-panel"` in `src/index.css`.
- No new IDB stores or routes. Runtime remains RUNTIME-UNVERIFIED until browser verification.

Sweep 38 verification: typecheck/build passed; `verse-studio.html` size 798676 bytes; runtime remains RUNTIME-UNVERIFIED.

## Sweep 39 — UX Trust-Breaker Polish

Sweep 39 hides Atlas and Scraps from Sidebar navigation while leaving routes mounted; replaces the `/scraps` placeholder with a Projects redirect notice; auto-enters ProjectInfoPanel edit mode after new project creation; and hardens ScratchDrawer tab/content event behavior. No IDB stores, routes, localStorage keys, DB_VERSION, or SCHEMA_VERSION changed. Selector inventory is now 539. Runtime remains RUNTIME-UNVERIFIED until browser/Electron checks run.

Sweep 39 verification: typecheck/build passed; `verse-studio.html` size 799559 bytes; runtime remains RUNTIME-UNVERIFIED.


## Sweep 42 — Signal Console overlay

- Added `src/components/SignalConsole.tsx`, mounted from `src/App.tsx` as a top portal overlay opened globally with Cmd/Ctrl+Shift+`.` through a native document keydown listener.
- Signal Console is read-only except clipboard copy in the Storage tab. It has Schema, Storage, and Health tabs, uses `signal-console-*` selectors, dynamically enumerates `verse-studio:` localStorage keys, and does not touch IndexedDB directly.
- Health signal computation now lives in `src/util/healthSignals.ts` and is shared by `WorkspaceHealthPanel` and Signal Console.
- No Frozen Four files, DB_VERSION, SCHEMA_VERSION, migrations, routes, or storage contracts changed. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 43 — Nexus Panel lineage chain

- `src/components/NexusPanel.tsx` now resolves conversion lineage as a bounded ancestry chain instead of a one-hop pointer. The walker follows `convertedFromId` + `convertedFromType` for up to 5 hops and uses cycle detection before each hop.
- `convertedFromType` is treated as a `StoreName`, not a `LinkableType`. The explicit lineage source mapping is limited to writing docs, notes, scraps, longform docs/sections, poems, patterns, prompt pipelines, prompt blocks, inbox items, and prompts.
- The Nexus Panel now shows a collapsible `Lineage (N hops)` section below link/tag context and above snapshots. `AI-assisted: yes/no` is always visible; soft-deleted ancestors render with `(deleted)`, opacity-50, and no click navigation.
- No Frozen Four files, DB_VERSION, SCHEMA_VERSION, migrations, routes, installer packaging stack, or localStorage contracts changed. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 44 — Compile Panel basic

- Added `src/components/CompilePanel.tsx` for Longform Markdown export. The former direct-download control is now a `Compile…` trigger that opens a right-edge overlay over the section editor.
- The panel snapshots ordered sections and word counts on open, supports structured/prose output and optional front matter, and reuses `downloadText()` / `safeFilename()` from `src/util/download.ts`.
- New stored localStorage key: `verse-studio:compile:author` (string, owner Compile Panel). The panel must not mutate Longform records, sections, titles, status fields, schema, or migrations.
- Selector family added: `compile-panel-*`; selector recount remains deferred to Sweep 47. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 45 — Longform section status and Compile Panel controls

- `LongformSection.status` is optional with values `draft`, `revise`, `final`, or `cut`; undefined behaves as `draft`, so legacy rows do not require rewrites.
- `DB_VERSION = 10` because IndexedDB gains the additive `longformSections.by_status` index. `SCHEMA_VERSION = 9` because export/import file compatibility and store shape compatibility are unchanged.
- Compile Panel status controls may persist only the section `status` via `updateSection`; include/exclude is local panel state and the panel still writes only `verse-studio:compile:author` in localStorage. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 46 — Atlas Upgrade

- Atlas is unhidden in Sidebar navigation by restoring the `/atlas` item in `src/components/Sidebar.tsx`; `src/App.tsx` already retained the `/atlas` route and was not changed. Scraps remains hidden from Sidebar.
- `src/studios/atlas/Atlas.tsx` now includes `aiLineage: boolean` on Atlas node input, sourced from visible record rows with missing values treated as `false`. `src/studios/atlas/AtlasGraph.tsx` renders AI-lineage record nodes with a second neutral accent ring.
- Atlas edge input now carries optional `color` and `weight`. Link edges read `semanticColorId` and `weight`; because there is still no SemanticColor store, color currently resolves to undefined and falls back to `var(--line)`, while weight controls capped stroke width.
- No DB/schema/migration/localStorage/export/import contracts, installer stack, ReactFlow migration, graph-engine replacement, or SemanticColor store/UI were added. Runtime remains `RUNTIME-UNVERIFIED`.

## Sweep 47 — Release QA for Signal Layer v0.02

Sweep 47 performs release QA for Signal Layer v0.02 without adding product features. DB_VERSION remains 10 and SCHEMA_VERSION remains 9. The self-contained HTML checks pass with zero external script references and zero `/assets/` references in `verse-studio.html`. The current canonical selector recount is 619 unique `data-test` values; one `data-testid` value remains reported separately. Signal Console now exposes a hardcoded Schema-tab selector count constant (`CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`) rather than querying the DOM. Runtime remains `RUNTIME-UNVERIFIED` until a live browser/Electron verification path attests behavior.

## Sweep 48 — ScratchDrawer and Scratchpad rendering fix

- ScratchDrawer is now a bottom flex child of the app content column instead of an absolute bottom overlay inside the route container. The collapsed 28px bar retains its height style and should render immediately on fresh load without relying on a resize.
- Scratchpad keeps its textarea `pb-12` clearance and now renders the Save-as-scrap bar with opaque `bg-surface-2` to prevent text bleed-through.
- No product features, localStorage contracts, DB/schema versions, routes, selectors, migrations, Frozen Four files, or installer packaging changed. Runtime remains `RUNTIME-UNVERIFIED` until browser/Electron checks.

## Sweep 49 — App identity, Focus key, Scraps sidebar — 2026-05-25

User-facing app identity is now **Noted v0.01**: `APP_NAME = 'Noted'`, `APP_TAGLINE = 'Private by default. Relational by design. Portable by right.'`, and diagnostic copy reports `Noted v0.01-3`. `APP_VERSION`, `APP_TITLE`, `APP_STORAGE_PREFIX`, installer script names, Electron identifiers, DB name, and `verse-studio:*` compatibility storage contracts remain unchanged. Global Search no longer captures `/`; Focus Mode uses `/` as an additional non-input shortcut while preserving Cmd/Ctrl+`.`. Scraps is visible in Sidebar again with `sidebar-link-scraps`; `/scraps` routing and ScrapsStudio behavior remain unchanged. Canonical `data-test` selector count is 619, separate `data-testid` count remains 1. No DB/schema/migration/Frozen Four/installer-stack changes. Runtime remains `RUNTIME-UNVERIFIED`.



## Sweep 50 — Prompts Studio UX overhaul

Prompt Studio received a focused UX pass in `src/studios/prompts/PromptStudio.tsx`: user-facing Pipeline copy now reads Prompt where appropriate, the left rail has a Prompts heading, description and variables are collapsed by default via local `useState`, block-library inserts flash the clicked card, the duplicate Materialize action is removed, export/save-as-block actions live in a `⋯` menu, and the first-block write area has a hover copy button. No new localStorage keys, DB/schema/migration changes, Frozen Four touches, or installer-stack changes. Current canonical `data-test` selector count is 619; separate `data-testid` count remains 1. Signal Console selector count constant is `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 52 — Full rebrand to Noted + canonical logo + installer standardisation

`electron/main.cjs` `APP_NAME='Noted v0.01'`; `APP_ID='noted-v0.01'`; icon → `noted-v0.01-512.png`. `package.json` `name="noted"`. `index.html` title `Noted v0.01`. `pack.js` outputs `noted-v0.01.html`. `DiagnosticPanel.tsx` backup name → `noted-workspace-backup-*.json`. New: `icons/noted-v0.01.svg` + 4 PNGs, `install-noted-v0.01-fedora.sh`, `Quick Install Command Fedora 43.txt`, `NOTED_V0.01_INSTALL_COMMANDS.MD`. Updated: `ZIP_DELIVERY_RULE.MD`, `NEXUS_NOTES_V0.01-3_INSTALL.MD` title. No Frozen Four/IDB/schema/localStorage/route/selector changes. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 53 — Critical bug fixes

Five bugs fixed: (1) Scratchpad textarea now scrolls cursor into view when typing at end via `scrollTop = scrollHeight` effect. (2) Canvas `handleConnect` now uses `indexOf(':')` first-colon split — prevents ID misparse for any multi-colon node ID. (3) `fitView` boolean prop removed from `<ReactFlow>` (was re-triggering on every context update); replaced with `FitViewOnMount` child component using `useReactFlow()` that fires once on project change with 50ms delay. (4) `electron/preload.cjs` created (contextBridge `window.electronAPI.toggleMaximize`); `electron/main.cjs` updated with `ipcMain` handler and preload wired up; `TopBar.tsx` double-click triggers toggle. (5) `ScratchDrawer.tsx` now has resize listener to clamp height after maximize, plus `min-h-[28px]` and `relative` on root div. No DB/schema/storage/selector contract changes.

## Sweep 54 current truth

Noted Phase 0.1 surfacing is source-implemented: primary Sidebar order is Projects → Inbox → Writing → Notes → Canvas → Longform → App Design → Prompts, then Library → Stash → Settings. Atlas, Scraps, and Poetry stay routed but hidden from primary navigation. Meridian is the canonical seed project; first successful seed writes Canvas last-project/positions defaults for `seed:project:meridian`. App-level copy capture stores selected copied text in `dockerClipboard` without `navigator.clipboard.readText()`. Runtime remains `RUNTIME-UNVERIFIED` until live evidence is supplied.

## Sweep 55 theme contract

Sweep 55 replaces the old light/dark class switch with the Phase 0.1 theme system. Matrix is the default preset; Paper and Midnight remain named presets. `verse-studio:theme` now stores JSON `ThemeSettings` (`preset` plus optional RGB-triplet token overrides), while legacy raw `dark` and `light` still read as Midnight and Paper. `data-theme` drives selection, and `index.html` applies preset/overrides before React loads.


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

## Sweep 56 — AI Brief Export + FocusContext foundation + branding — 2026-05-25

- OWNER-CANON: Sweep 55-G remains a GitHub candidate only. Sweep 56 is product continuation, not release/publication finalization.
- TECH-CANON: AI Brief Export is local, export-only JSON generation. It must not import, mutate, shorten, delete, write back, call network APIs, or run AI.
- TECH-CANON: FocusContext is the intended cross-studio UI focus source for Nexus Panel architecture. Workspace `activeRecord` remains for command/link compatibility during the transition.
- Branding canon: user-facing Noted tagline is `Private by default. Relational by design. Portable by right.` Preserve `noted-v0.01`, `verse-studio:*`, package identity, installer identity, and Nexus Panel naming.
- Risk: exported AI brief JSON may contain private user snippets. The download itself is local and does not send data anywhere.
- Deferred: AI import/writeback, round-trip ingestion, Ollama/API bridge, DB v11, semantic color persistence, Noted Packet work, license/publication decisions, and dependency upgrades.


## Sweep 56-R — Nexus Panel default-open UX correction

- OWNER-CANON [DIRECT]: Nexus Panel should be open by default because it completes the visible relational workspace model; previous collapsed-by-default canon is SUPERSEDED.
- TECH-CANON: `verse-studio:nexus-panel:open` remains the user preference key. `verse-studio:nexus-panel:default-open-applied` is a one-time UI-only migration marker that opens the panel once after this sweep, then respects the user's explicit close/open choice.
- FocusContext-first / Workspace `activeRecord` fallback remains the accepted transitional behavior. Focus Mode hiding remains required.
- Runtime status remains pending/manual unless separately attested.


## Sweep 57 maintainer note — DB v11 / schema v10

- Sweep 57 is a schema-alignment sweep, not a feature/import sweep. It formalizes v11 lineage/AI/export fields that were partially present earlier.
- Canonical lineage fields: `isSeedData`, `convertedFromId`, `convertedFromType`, `convertedAt`, `aiLineage`, `contentHash`.
- Link canon: `relationshipType` is canonical storage; `label` is export/backcompat alias. AI Brief Export and workspace export serialize the relationship as `label`.
- Workspace exports now use `schemaVersion: 10`; AI Brief Export reports `workspace_schema_version: 10` via `SCHEMA_VERSION`.
- Deferred: `aiMeta`, AI import/writeback, Semantic Color Engine/store, Noted Packet import/export, public release/license decisions, dependency/audit remediation.


## Sweep 58 — Nexus Panel relational spine — 2026-05-26

Sweep 58 turns the Nexus Panel into the Phase 0.1 relational spine without schema/storage/package changes. `src/nexus/useNexusIndex.ts` is the memoized workspace-context index for focused-record identity, project membership, links/backlinks, tags, snapshots, conversion/AI lineage, canvas placements, orphan status, and lightweight suggested connections. `FocusContext` remains ephemeral UI state; `ws.activeRecord` remains the transitional compatibility bridge.

Focus wiring now covers feasible major surfaces: Writing, Notes, Poetry, Longform document/section, Projects project/card/drawer/scrap edits, Canvas project/tile focus, App Design build, Prompt pipeline/block drawers/playground, Inbox editor, and Library pattern selection. Scraps remains a redirect surface; app-design subrecords without `LinkableType` identity are not focused as records. Nexus suggestions are display-only and never write links automatically. Current selector inventory is 645 unique `data-test` values plus 1 `data-testid`; new selectors are add-only Nexus smoke targets. Build source hash for this delivery: `be1b5454700d2cead3e2e6c1f0089dc7051d2d408e22046df002694a958d7afc`. Exporter self-hash remains `ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`. Runtime status remains `RUNTIME-UNVERIFIED` until smoke/bundle evidence is accepted.
