# HANDY_LESSONS.MD

### FINAL OUTPUT (apply this)

## Purpose

This file keeps reusable lessons and WHYs. It is not a chronology and not runtime attestation. Runtime behavior remains **`RUNTIME-UNVERIFIED`**. (source: `AUDITOR_SIGNOFF.MD`, evidence-class discipline; invariant A-18)

## Persistence lessons

- Treat `src/db.ts`, `src/types.ts`, `src/context.tsx`, and `src/seed.ts` as the frozen four. Read them before schema/state/type/seed edits and update `PREFLIGHT.MD` if active contracts change. (invariants A-06, D-06, D-07)
- Preserve old persisted names unless a migration explicitly changes them. `longformProjects` and `LongformSection.projectId` are legacy contracts, not naming mistakes. (invariant A-07)
- Keep stored localStorage keys, localStorage prefixes, and event-like strings separated. Value type is part of the contract. (invariants A-08, A-09)
- Source-verified schema facts do not attest runtime. Browser verification still requires a valid browser diagnostic/verification run. (invariants B-01, E-08)

## Runtime workaround lessons

- If Playwright/Chromium is missing, state that browser verification is unavailable; do not upgrade static checks into runtime certainty. (invariant B-01)
- If `vite` or another bin fails after ZIP extraction, suspect broken `node_modules/.bin` shims before blaming app code. (invariant B-02)
- `DB_BLOCKED` is usually a tab/session problem; close old tabs and reload before destructive reset. (invariant B-03)
- Route rendering must wait for bootstrap readiness. Loading/blocked/error recovery screens are part of the app's safety behavior. (invariant B-04)
- Tolerating one failed read slice is different from hiding a failed write; keep that distinction. (invariant B-05)
- Canvas hidden placement exists because Canvas nodes are derived from project records. Deleting a placement must not delete a workspace record. (invariants B-06, D-16)
- Clipboard hidden state exists so soft-hide/bin behavior does not hard-delete IDB rows prematurely. (invariant B-07)
- Escape behavior in focus mode is staged: close ScratchDrawer first, then exit focus. (invariant B-08)
- First-visit hint state depends on absent localStorage keys; do not write collapse keys on initial mount. (invariant B-09)
- Prompt right-click linking uses capture-phase contextmenu suppression because bubble phase is too late on macOS Chrome. (invariant B-10)
- Canvas xyflow module-level setters are a bridge pattern, not accidental global state. (invariant B-11)

## UI lessons

- Split-pane editor surfaces are the current native pattern. Preserve persistent list widths/selections. (invariant C-02)
- Quick Capture/ScratchDrawer is bottom overlay shell chrome. Do not resurrect the old active right-side Docker model casually. (invariant C-04)
- `.editor-body-pad` is the editor spacing law. Reintroducing centered max-width wrappers is a product change, not cleanup. (invariant C-09)
- Longform section-list `alwaysVisible` overrides collapsed state; the document list has no collapse control by design. (invariant C-10)
- Focus mode chrome hiding is centralized with `[data-focus-mode="true"]`; conditional unmounting invites drift. (invariant C-11)
- Canvas layer filtering must happen in order: hidden placement suppression, derive content type, count layers, layer visibility. (invariant C-12)
- Inline Canvas scrap creation must save both data and placement before closing the inline input. (invariant C-13)

## Data lessons

- Soft delete means `deletedAt`; active arrays should exclude deleted records where specified. (invariant D-08)
- Scrap `softDelete` and `purge` are different operations. (invariant D-09)
- Longform body content lives in sections, not the document record. (invariant D-12)
- Recent views track opened records, not project membership. (invariant D-13)
- Quick Capture's default project source is `verse-studio:projects:lastActive`. (invariant D-14)
- Saving a Scratch/Clip as Scrap is non-destructive to the source. (invariant D-15)
- Canvas placement deletion and workspace record deletion are distinct. (invariant D-16)
- Canvas placement shape compatibility is required for old `{x,y}` and newer `{x,y,width?,height?}` values. (invariant D-17)
- Partial failure after Canvas Scrap record creation should not erase the fact that the record exists. (invariant D-18)

## Signal lessons

- Bootstrap signals, workspace APIs, localStorage prefixes, routes, and selectors are operational triggers for archive requests. (invariants E-02, E-03, E-04, E-05, E-06, E-07)
- Use `ARCHIVE_INDEX.MD` rather than memory when a sweep touches these triggers. (invariant A-18)

## Invariant coverage in this staged lessons doc

| ID | Evidence class | Current invariant | Source trace |
|---|---|---|---|
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
| C-02 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Writing, Notes, Poetry, and Longform use native split-list/editor patterns with persistent lists and width/selection keys. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-04 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Quick Capture/ScratchDrawer is global bottom overlay in shell chrome; do not revert to right-side Docker panel without explicit reversal. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-09 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | .editor-body-pad is canonical body-writing spacing; do not restore centered max-width wrappers casually. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-10 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Longform alwaysVisible overrides sectionList collapsed; Longform document list intentionally has no collapse control. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-11 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Focus-mode chrome hiding is centralized behind [data-focus-mode="true"]; do not reintroduce conditional unmounting casually. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas layer order: hidden suppression first, derive content type, count layers, then apply layer visibility. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| C-13 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Inline canvas-created scraps create the Scrap, save scrap:{id} position, then close input/render node. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-06 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Components should call workspace context methods instead of idb directly. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-07 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Workspace context is central state/API layer; CRUD updates React state and writes through to IDB. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-08 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Soft-deletable records use deletedAt; active arrays exclude soft-deleted records where specified. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-12 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Longform body editing maps to LongformSection; do not add LongformDoc.body for inline editing. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-13 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Recent views track actual record opens, max 20, dedupe newest-first, and do not include projectId. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-14 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Quick Capture default project uses verse-studio:projects:lastActive; do not create a parallel last-project key. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-15 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Saving Scratch/Clip to Scraps must not clear scratchpad body or mutate/delete source clipboard row. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-16 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Delete from canvas removes placement/position and records hidden node id, not linked workspace record. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-17 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Canvas position values may be old {x,y} or newer {x,y,width?,height?}; loaders must accept old entries. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| D-18 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | If Canvas inline scrap position save fails after record creation, Scrap still exists and may later appear unpositioned/default-grid. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-02 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Bootstrap signals include openWorkspaceDB, probeIndexedDB, versions, bootstrap status/errors and recovery screens. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |
| E-06 | SOURCE-VERIFIED / runtime RUNTIME-UNVERIFIED | Cross-studio event signals include select, recent-view, projectContext:change, scratch-drawer open-change, open-pattern-playground. | Pass 1 Invariant Manifest source citations; legacy governance docs named in Pass 1 |

## Post-Pass-5 branding/package sweep — Nexus Notes v0.01

This delivery renamed the user-facing app surface to **Nexus Notes v0.01** and added a desktop Electron installer package without changing IndexedDB schema, store names, key paths, or localStorage storage-prefix contracts. The app still uses `verse-studio:*` localStorage keys for backward compatibility. The new desktop install path is documented in `NEXUS_NOTES_INSTALL_COMMANDS.MD`; the repeatable ZIP delivery rule is documented in `ZIP_DELIVERY_RULE.MD`. Runtime behavior remains **`RUNTIME-UNVERIFIED`** until validated by an accepted runtime bundle or equivalent Orchestrator-approved runtime proof.

## Nexus Notes v0.01 stable Electron packaging hotfix — 2026-05-23

- Electron shell now pins its Chromium profile/userData path to `~/.config/nexus-notes-v0.01` via `electron/main.cjs`. This isolates stable Nexus Notes v0.01 from older Nexus Verse / early wrapper attempts and avoids stale IndexedDB profile conflicts. This is an Electron wrapper profile path only; it does **not** rename the governed app `DB_NAME` (`verse-studio`) or `verse-studio:*` localStorage/storage keys.
- Installer now backs up old Electron profile folders (`~/.config/nexus-notes-v0.01` and legacy `~/.config/Nexus Notes v0.01`) into `~/.config/nexus-notes-v0.01-backups/` before launch so v0.01 boots cleanly. Exported workspace `.json` backups are unaffected.
- Desktop launcher now uses icon name `nexus-notes-v0.01`, installs SVG plus 64/128/256/512 PNG hicolor icons, and launches Electron with `--class=nexus-notes-v0.01` so GNOME app drawer / window matching is more reliable.
- Added `reset-nexus-notes-v0.01-data.sh` and `nexus-notes-v0.01-reset` for user-approved profile reset if the bootstrap screen reports “The workspace could not be loaded.”
- No IndexedDB schema/store/localStorage contract changed: `DB_VERSION = 8`, `SCHEMA_VERSION = 8`, 28 stores, diagnostic exporter remains ABSENT, runtime remains `RUNTIME-UNVERIFIED` until browser/Electron verification is actually performed.



## Nexus Notes v0.01 lesson — block creation needs an obvious empty-state path

When a user opens the pipeline block picker with no saved blocks, the UI must offer an explicit create path without requiring the user to infer that typing a query enables creation. The v0.01 hotfix adds a visible blank-block creation action and opens the editor immediately after creation. Also keep `Pattern.type === 'block'` locked for summonable blocks; categories belong elsewhere.


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

## Sweep 32 — subtle branding and Linux icon reliability

- For persistent chrome branding, prefer low-contrast SVG treatment over bordered/shadowed badges; the mark should support orientation without competing with editor content.
- On Linux/GNOME/Wayland, a BrowserWindow constructor `icon` alone may not be enough for alt-tab. Keep app-level and window-level icon calls near BrowserWindow creation so future packaging edits do not accidentally split the contract.


## Sweep 33 lesson — Canvas placement must beat records sync — 2026-05-24

- Chosen approach for inline scraps: Option C, post-placement correction. `createScrap` generates the id and publishes the project-scoped record immediately, so the cleanest minimal fix is to save `scrap:{id}` after creation and then force the xyflow node to the intended `{x,y,width,height}` whether it already exists or must be added.
- Notes have a safer pre-save window because `createNote` initially creates an unscoped note. Save `note:{id}` before `updateNote` attaches the note to the selected project, so Canvas records sync finds the right position the first time.
- Visible action affordances matter on inline inputs: the new Canvas scrap `Save` button supplements, rather than replaces, the Ctrl/Cmd+Enter shortcut.

## Sweep 34 lesson — slash summon can move without reviving ComposeView — 2026-05-24

- When retiring a large view, extract only the shared interaction pattern, not the whole screen. Sweep 34 moved the slash-summon state shape, fuzzy ranking, `/` detection, arrow/Enter/Escape handling, variable Tab cycling, and block-body insertion into the first-block pipeline editor.
- Keep the storage boundary explicit: first-block editing autosaves the underlying `Pattern` record; empty-pipeline draft mode creates one Pattern and one pipeline step, then normal pipeline storage (`verse-studio:prompts:pipelineSteps:{pipelineId}`) takes over.
- Do not reuse the retired `verse-studio:prompts:view` key for future Prompt Studio state. It is ignored for backward compatibility and should remain retired unless an explicit migration un-retires it.


## Sweep 35 lesson — save UX can wrap snapshots without changing storage — 2026-05-24

- A user-facing rename from snapshots to saves does not require persistence changes. Keep `Snapshot` records and `Snapshots` selectors stable; change copy and route-level browsing separately.
- For global saved-item browsers, parse snapshot data defensively and keep restore/open capability type-gated. `LinkableType` can be broader than the set of records a UI can safely restore.
- Preserve old shelf bookmarks below new snapshot browsing when repurposing `/shelf`; route/file/export compatibility prevents unnecessary downstream navigation churn.


## Sweep 42 lesson — inspection surfaces should share calculations

- When adding a second readout for existing health signals, extract the signal calculation once and let each UI decide how interactive it should be. Signal Console displays Health read-only; `WorkspaceHealthPanel` still maps shared `openTarget` data back to its existing Open buttons.
- For storage inventory UI, prefer live `Object.keys(localStorage).filter(k => k.startsWith('verse-studio:'))` enumeration over a stale hand-maintained key list.
- A source-verified absence is better than a fabricated count: `meta` is an IDB store, but it is not loaded into the workspace context arrays used for Signal Console Schema counts.


## Sweep 43 lesson — lineage is a bounded source walk

- Conversion ancestry should follow persisted `convertedFromId` + `convertedFromType` pointers through source arrays, not UI link types.
- A lineage panel should degrade safely: cap depth, track visited IDs, include soft-deleted records, and stop on missing/unmapped ancestors instead of guessing.

## Sweep 44 lesson — compile/export panels need narrow write boundaries

- A compile/export surface can have rich local UI state without becoming an editor. Persist only explicit side-state (`verse-studio:compile:author`) and route file output through existing download helpers.
- Preserve permanent selectors while adding new selector families: the Longform trigger keeps `longform-download` and adds `compile-panel-trigger` via `data-testid`.


## Sweep 45 lesson — optional statuses avoid migration churn

- Additive optional fields can be UI-defaulted at read time. `LongformSection.status` treats undefined as `draft`, avoiding row rewrites and preserving import/export compatibility.
- A Compile Panel can persist a narrow record patch (`status`) while keeping include/exclude as local-only UI state. Keep those mutation boundaries explicit in selectors and docs.


## Sweep 46 lesson — visual signal plumbing can precede persistence

- When a future semantic-color model is not yet persisted, plumb optional fields through the graph data shape without adding speculative stores or UI. Use safe fallback rendering until resolution exists.
- AI lineage is provenance metadata, not a risk flag. Mark it with quiet structural treatment rather than warning copy or alert colors.

## Sweep 47 lesson — release gates need exact commands

- When a release gate names exact commands, run those exact commands and report stdout literally. Do not estimate selector counts or silently combine `data-test` with `data-testid`.
- Hardcoded build-time readouts, such as Signal Console's selector count, should be updated from the canonical source scan and must not query the live DOM.
- Self-contained HTML is an artifact property: verify it after `npm run build` using greps against `verse-studio.html`.

## Sweep 48 lesson — prefer flex flow for persistent chrome

- Persistent bottom chrome inside a constrained route shell is safer as a real flex child than as an absolutely positioned overlay. Absolute positioning can race initial height settlement and make the control appear only after resize.
- If an absolute bottom action bar remains, pair it with explicit editor bottom padding and an opaque background.

## Sweep 49 — App identity, Focus key, Scraps sidebar — 2026-05-25

User-facing app identity is now **Noted v0.01**: `APP_NAME = 'Noted'`, `APP_TAGLINE = 'Private by default. Relational by design. Portable by right.'`, and diagnostic copy reports `Noted v0.01-3`. `APP_VERSION`, `APP_TITLE`, `APP_STORAGE_PREFIX`, installer script names, Electron identifiers, DB name, and `verse-studio:*` compatibility storage contracts remain unchanged. Global Search no longer captures `/`; Focus Mode uses `/` as an additional non-input shortcut while preserving Cmd/Ctrl+`.`. Scraps is visible in Sidebar again with `sidebar-link-scraps`; `/scraps` routing and ScrapsStudio behavior remain unchanged. Canonical `data-test` selector count is 619, separate `data-testid` count remains 1. No DB/schema/migration/Frozen Four/installer-stack changes. Runtime remains `RUNTIME-UNVERIFIED`.



## Sweep 50 — Prompts Studio UX overhaul

Prompt Studio received a focused UX pass in `src/studios/prompts/PromptStudio.tsx`: user-facing Pipeline copy now reads Prompt where appropriate, the left rail has a Prompts heading, description and variables are collapsed by default via local `useState`, block-library inserts flash the clicked card, the duplicate Materialize action is removed, export/save-as-block actions live in a `⋯` menu, and the first-block write area has a hover copy button. No new localStorage keys, DB/schema/migration changes, Frozen Four touches, or installer-stack changes. Current canonical `data-test` selector count is 619; separate `data-testid` count remains 1. Signal Console selector count constant is `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`. Runtime remains `RUNTIME-UNVERIFIED`.


## Sweep 51 — Verification infrastructure as code

**Principle:** An instrument you can quietly rewire is not an instrument.

The v1.1 diagnostic bundle system is built on a simple chain of trust: the Orchestrator knows the SHA-256 of the exporter file (exporter_self_hash) and independently recomputes the SHA-256 of the src/ tree (build_commit). Every exported bundle embeds both values. If a future Maintainer edits the exporter without going through the UNFREEZE ceremony and posting a new hash, the Orchestrator's reference value will not match and the bundle will be rejected — even if everything else looks plausible.

This is why the exporter is frozen and why the verification region in vite.config.ts is co-protected. The freeze is not bureaucracy. It is the mechanism that makes the instrument trustworthy.

**Practical lesson for future sweeps:** when you modify src/diagnosticExporter.ts under UNFREEZE, the new exporter_self_hash computed by vite.config.ts will differ from the Orchestrator's stored reference. You must: (1) build after the edit, (2) recompute the hash by running the Algorithm 2 independently, (3) post the new hash value in the delivery report. The Orchestrator installs it as the new reference. Only then is the chain of trust restored.


## Sweep 54 lesson — surface coherence without schema churn

A broad product-feel pass can stay safe when it reorders navigation, seeds canonical demo content, and adds app-level event capture without changing DB_VERSION, SCHEMA_VERSION, stores, or storage identity. For clipboard capture, prefer DOM copy events plus selected text over clipboard read APIs; it preserves user intent and avoids permission surfaces.

## Sweep 55 lesson — RGB triplet tokens require full color-call hygiene

When CSS tokens become RGB triplets, Tailwind opacity utilities work only if config colors use `rgb(var(--token) / <alpha-value>)`. Any runtime inline style or SVG attribute that previously used bare `var(--accent)` must become `rgb(var(--accent))`; otherwise it becomes an invalid color. Keep first-paint parsing standalone in `index.html` and canonical logic in `src/theme.ts`.


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

## Sweep 56 lessons — AI brief / focus / branding

- Export-only AI features still need privacy copy: local download is not network transmission, but the resulting file may contain private user snippets.
- FocusContext should be introduced as a thin ephemeral provider first, while old `activeRecord` remains as a compatibility bridge for command/link flows.
- Branding polish must not imply identity migration. User-facing Noted copy can improve while `noted-v0.01` and `verse-studio:*` stay protected.


## Sweep 57 lessons — schema formalization without destructive migration

- A schema bump can formalize fields that already existed partially; do the source audit first and avoid duplicate aliases.
- Prefer read/write/import boundary normalization for optional boolean/null fields over bulk-rewriting user rows.
- Keep `relationshipType` canonical in storage while exporting `label` for compatibility with AI/workspace consumers.
- Conversion-created records must stamp `convertedAt`; missing `contentHash` can remain `null` until a dedicated hashing/health sweep.


## Sweep 58 lessons — Nexus as index, FocusContext as UI state

- Nexus should use a memoized query/index layer over workspace context instead of repeated local scans inside panel sections. Keep relationship derivation in `src/nexus/useNexusIndex.ts` so the UI stays readable and future graph features have one source of derived truth.
- `FocusContext` is ephemeral UI focus, not persistence. Mirror to `ws.activeRecord` only for compatibility with existing command/link flows; do not add localStorage focus persistence or DB fields for current focus.
- Suggested links are relationship affordances, not automatic writes. Avoid implying AI inference when suggestions come from shared project/tags/recent adjacency.
- Canvas placement can be read from existing position side-state for display, but Nexus should not create or rewrite canvas/localStorage records.
