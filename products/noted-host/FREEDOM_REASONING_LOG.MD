# Freedom Reasoning Log

## Purpose

Record maintainer decisions, safe workarounds, blockers, and deviations from the default plan. This is for future AI/human maintainers to understand *why* a change happened, not just what changed.

## Calibration Sweep 0 — 2026-05-23

### Pre-sweep document check

Required protocol docs were checked case-sensitively:

- `CODEBASE_ORIENTATION.MD` — missing exact-case file; legacy `CODEBASE_ORIENTATION.md` existed.
- `AI_README.MD` — missing exact-case file; conventional `README.md` existed.
- `FREEDOM_REASONING_LOG.MD` — missing.
- `HANDY_CODE_SNIPPETS.MD` — missing.
- `HANDY_LESSONS.MD` — missing.
- `LANDMINES.MD` — missing.
- `AI_CODEBASE_HANDOFF.MD` — missing.

### Actions taken

- Created the missing protocol docs.
- Updated `README.md` to reflect the current Vite/React/IndexedDB app and route/store state.
- Created the exact-case maintainer readme that is now named `AI_README.MD`; later cleanup split it from `README.md` for separate AI-maintainer and user-facing audiences.
- Created `CODEBASE_ORIENTATION.MD` as a compact current-state orientation file.
- Appended a current-state addendum to legacy `CODEBASE_ORIENTATION.md` instead of rewriting the historical orientation wholesale.
- Did not modify functional source code.

### Workaround / judgment call

The user requested exact filenames ending in `.MD`, while the repo already had conventional lowercase `.md` docs. I created exact-case protocol files to satisfy the maintainer contract and kept the lowercase docs for tooling/convention compatibility. This creates a case-sensitivity landmine on case-insensitive filesystems, so it is recorded in `LANDMINES.MD`.

### Post-sweep document check

All required protocol docs now exist in the repo root. `README.md` and `CODEBASE_ORIENTATION.md` also remain present as legacy/conventional docs.

### Verification notes

- Archive was unpacked with a zip-slip path check before extraction.
- Static repo inspection completed.
- Build verification should be run after doc creation; record result below.

### Verification result

Completed:

- Initial `npm run build` failed because the uploaded archive materialized `node_modules/.bin/vite` as a plain text file (`../vite/bin/vite.js`) instead of an executable symlink/wrapper.
- Direct `node node_modules/vite/bin/vite.js build` then failed because the bundled esbuild binary lacked executable permission.
- Safe workaround applied only inside `node_modules`: replaced `node_modules/.bin/vite` with a small shell wrapper and set executable permission on `node_modules/@esbuild/linux-x64/bin/esbuild`.
- After workaround, `npm run build` passed and produced `verse-studio.html` at 723,580 bytes (706.6 KB).
- `node --check verify-sweep29.mjs` passed.
- `node verify-sweep29.mjs` could not run because Playwright Chromium is not installed in this sandbox. This is a tooling limitation, not an observed app failure.

## Joplin-native UX/UI sweep — 2026-05-23

### Pre-sweep document check

Required protocol docs were present before source edits:

- `CODEBASE_ORIENTATION.MD`
- `AI_README.MD`
- `FREEDOM_REASONING_LOG.MD`
- `HANDY_CODE_SNIPPETS.MD`
- `HANDY_LESSONS.MD`
- `LANDMINES.MD`
- `AI_CODEBASE_HANDOFF.MD`

### Source changes made

- Reworked `src/studios/writing/WritingStudio.tsx` into a persistent list+editor split pane.
- Reworked `src/studios/notes/NotesStudio.tsx` into the same persistent split pane.
- Added `src/util/listPane.ts` for shared resizable list width, markdown preview cleanup, and compact relative time formatting.
- Slimmed `src/components/TopBar.tsx` to `h-9`, removed back/focus/theme controls, and reduced the command-palette button to shortcut badge only.
- Added Sidebar footer controls in `src/components/Sidebar.tsx`.
- Extended `FocusToggleButton` in `src/components/FocusMode.tsx` with a compact rail-safe rendering while preserving `data-test="focus-toggle"`.
- Updated dark mode CSS variables in `src/index.css` to cooler neutral values:
  - `--surface: #18191b`
  - `--surface-2: #202124`
  - `--surface-3: #2a2d31`
  - `--ink: #e2e4e8`
  - `--ink-soft: #9ba3af`
  - `--ink-faint: #6b7280`
  - `--line: #333740`
- Added `font-size: 18px` and `font-weight: 500` to `.title-input`.

### Workarounds / judgment calls

- Removed the old Writing/Notes in-studio collapsible rails instead of preserving them, because the sweep brief explicitly required a persistent note list. The removed `data-test` values are logged in `LANDMINES.MD`.
- Kept `DocEditor` and `NoteEditor` internals intact; only their surrounding shell/list layout changed.
- Used inline `width` style for list panes rather than CSS columns because drag-resize needs controlled pixel updates and localStorage persistence.
- Re-applied executable permission to extracted `node_modules/.bin/vite` and the esbuild binary before building. This repeats the archive-extraction repair from Calibration Sweep 0 and does not change app source semantics.

### Frozen-file check

The frozen files were not modified:

- `src/db.ts`
- `src/types.ts`
- `src/context.tsx`
- `src/seed.ts`

### Post-sweep verification

Completed:

- `npx tsc --noEmit` — passed with zero errors.
- `npm run build` — passed and produced `verse-studio.html` at 709.4 KB.
- Static packed-output check — no `<script src=`, `<link rel="stylesheet"`, or `/assets/` references in `verse-studio.html`.
- Raw Tailwind palette grep — no `text-zinc`, `bg-gray`, `text-red-`, `text-blue-`, `bg-zinc`, `text-gray`, `bg-red-`, or `bg-blue-` in `src/`.
- Frozen file hash comparison against the calibration baseline — unchanged.
- `node --check verify-sweep29.mjs` — passed.

Blocked:

- `node verify-sweep29.mjs` could not run because Playwright Chromium is not installed in this sandbox. This is the same tooling limitation observed during Calibration Sweep 0, not an observed app runtime failure.

### Post-sweep document check

Updated protocol docs:

- `CODEBASE_ORIENTATION.MD`
- `AI_README.MD`
- `FREEDOM_REASONING_LOG.MD`
- `HANDY_CODE_SNIPPETS.MD`
- `HANDY_LESSONS.MD`
- `LANDMINES.MD`
- `AI_CODEBASE_HANDOFF.MD`

Also synced useful addenda into conventional lowercase `README.md` and `CODEBASE_ORIENTATION.md`.

## Sweep 2 — Poetry migration, Docker right panel, prose width, status bar — 2026-05-23

### Pre-sweep document check

Required protocol docs were present before source edits:

- `CODEBASE_ORIENTATION.MD`
- `AI_README.MD`
- `FREEDOM_REASONING_LOG.MD`
- `HANDY_CODE_SNIPPETS.MD`
- `HANDY_LESSONS.MD`
- `LANDMINES.MD`
- `AI_CODEBASE_HANDOFF.MD`

### Source changes made

- Migrated `src/studios/poetry/PoetryStudio.tsx` from the old binary `useRailCollapse` pattern to the shared `useResizableListWidth` / `listPane.ts` pattern.
- Added Poetry list previews with `stripMarkdownPreview(p.body, 50)` and compact relative timestamps.
- Added Poetry `Cmd/Ctrl+N` creation and focused-list arrow navigation.
- Reoriented `src/App.tsx` shell so Docker is a right-side sibling of the route content instead of a bottom child.
- Rewrote `src/components/Docker.tsx` as a vertical right inspector with a 32px rail and a 288px open panel.
- Added `src/components/EditorStatusBar.tsx` and mounted it in Writing, Notes, and Poetry editors using `draft.body`.
- Constrained Writing, Notes, and Poetry body editor areas with a scrollable wrapper and centered `max-w-[72ch]` body column.

### Workarounds / judgment calls

- Kept `src/util/rail.ts` even though Poetry no longer imports it. Deleting it is unnecessary risk for a surgical UI sweep.
- Did not modify `DockerContext.tsx`; the exported API remains stable. The UI now treats non-rail state as open and keeps `data-expanded="true"` whenever the right panel is visible.
- Added `min-h-full` to the editor textareas rather than changing `.editor-surface` CSS. This preserves the shared CSS definition while making the constrained editor body fill the scroll area more like the requested native editor surface.
- In collapsed Docker rail state, the rail buttons preserve `data-test="docker-rail-icon-{slug}"`. Expanded vertical tab buttons preserve `data-test="docker-tab"`.

### Frozen-file check

The frozen files were not modified:

- `src/db.ts`
- `src/types.ts`
- `src/context.tsx`
- `src/seed.ts`

### Post-sweep verification

Completed:

- `npx tsc --noEmit` — passed with zero errors.
- `npm run build` — passed after repairing the extracted local `node_modules/.bin/vite` wrapper and esbuild executable bit.
- `node --check verify-sweep29.mjs` — passed.
- Packed `verse-studio.html` check — no `<script src=`, no external stylesheet link, no `/assets/` references.
- Raw palette grep — clean for `text-zinc`, `bg-gray`, `text-red-`, `text-blue-`.
- Frozen four hashes match the pre-sweep baseline.

Blocked:

- `node verify-sweep29.mjs` could not run because Playwright Chromium is not installed in this sandbox. This is the same browser-tooling limitation observed in prior sweeps, not an observed app runtime failure.

## Sweep 3 — Longform 3-column, autosave indicator, Sidebar labels — 2026-05-23

### Pre-sweep document check

Required protocol docs were present before source edits:

- `CODEBASE_ORIENTATION.MD`
- `AI_README.MD`
- `FREEDOM_REASONING_LOG.MD`
- `HANDY_CODE_SNIPPETS.MD`
- `HANDY_LESSONS.MD`
- `LANDMINES.MD`
- `AI_CODEBASE_HANDOFF.MD`

### Source changes made

- Replaced the Longform horizontal `DocBar` with `LongformDocList`, a persistent resizable vertical doc list using `src/util/listPane.ts`.
- Preserved Longform selection keys: `verse-studio:longform:lastDoc` and `verse-studio:longform:lastSection`.
- Added new Longform list width key: `verse-studio:longform:listWidth`.
- Moved Longform delete to `ListItemMenu` on the doc list item.
- Moved Longform download to the selected-doc toolbar and preserved `data-test="longform-download"`.
- Added Longform `Cmd/Ctrl+N` creation and focused-list ArrowUp/ArrowDown navigation.
- Added prose-width wrapper and `EditorStatusBar` to `SectionEditor`.
- Updated `useDebouncedAutosave` to return `{ lastSavedAt }` while keeping callers that ignore the return value valid.
- Updated `EditorStatusBar` to flash `Saved ✓` for about 2 seconds after autosave.
- Wired `lastSavedAt` into Writing, Notes, Poetry, and Longform section editors.
- Cleaned Sidebar display labels without changing route paths or path-derived `data-test` attributes.

### Workarounds / judgment calls

- `node_modules/.bin/vite` and the esbuild binary again extracted without executable permissions. I changed only local extracted install artifact permissions so `npm run build` could execute. No source/dependency version changes were made.
- `useDebouncedAutosave` records the save timestamp only through the returned hook state while mounted. This avoids intentionally relying on post-unmount UI updates; unmount still flushes the save synchronously.
- `longform-pill` was removed with the `DocBar` because the new persistent doc list uses `data-test="longform-doc-item"` instead.

### Frozen-file check

The frozen files were compared against the Sweep-2 ZIP and are unchanged:

- `src/db.ts`
- `src/types.ts`
- `src/context.tsx`
- `src/seed.ts`

### Post-sweep verification

Completed:

- `npx tsc --noEmit` — passed with zero errors.
- `npm run build` — passed after local extracted dependency permission repair.
- Packed-output grep — no `<script src=`, `<link rel="stylesheet"`, or `/assets/` references in `verse-studio.html`.
- Raw Tailwind palette grep — no banned raw palette classes introduced.
- `node --check verify-sweep29.mjs` — passed.

Blocked:

- Runtime Playwright verification remains blocked because Chromium is not installed in this sandbox.

### Post-sweep document check

Updated protocol docs:

- `CODEBASE_ORIENTATION.MD`
- `AI_README.MD`
- `FREEDOM_REASONING_LOG.MD`
- `HANDY_CODE_SNIPPETS.MD`
- `HANDY_LESSONS.MD`
- `LANDMINES.MD`
- `AI_CODEBASE_HANDOFF.MD`

Also synced matching addenda into conventional lowercase `README.md` and `CODEBASE_ORIENTATION.md`.


## Sweep 4 — dark default, ScratchDrawer, Inbox resize — 2026-05-23

### Pre-sweep document check

Required protocol docs were present before source edits:

- `CODEBASE_ORIENTATION.MD`
- `AI_README.MD`
- `FREEDOM_REASONING_LOG.MD`
- `HANDY_CODE_SNIPPETS.MD`
- `HANDY_LESSONS.MD`
- `LANDMINES.MD`
- `AI_CODEBASE_HANDOFF.MD`

### Source changes made

- Changed `src/theme.ts` fallback from `light` to `dark` while preserving stored user preference behavior.
- Added the inline `index.html` theme pre-apply script so the `dark` class is present before React initialization when no stored theme exists.
- Added `src/components/ScratchDrawer.tsx` as a persistent bottom overlay around the existing `Scratchpad` component.
- Changed `src/App.tsx` route area to a `relative overflow-hidden` wrapper so the drawer overlays route content without overlapping Sidebar or Docker.
- Removed Scratchpad from Docker tabs and moved Docker default active tab to `clipboard`.
- Updated `DockerContext` tab type/slug validation to migrate stale `scratchpad` active tabs safely to `clipboard`.
- Added Inbox list resizing with `useResizableListWidth('verse-studio:inbox:listWidth')`.

### Workarounds / judgment calls

- Did not implement the optional `Cmd/Ctrl+Shift+S` ScratchDrawer shortcut. That chord conflicts with common browser Save As behavior, and the explicit handle click/persisted drawer state covers the required behavior without intercepting a browser-level shortcut.
- Left `src/components/docker/Scratchpad.tsx` unchanged and imported it from the new drawer. This preserves all existing Scratchpad internals and selectors.
- Repaired extracted archive permissions for `node_modules/.bin/vite` and the esbuild binary before building. This is the same local extraction artifact observed in earlier sweeps.

### Frozen-file check

The frozen files were not modified:

- `src/db.ts`
- `src/types.ts`
- `src/context.tsx`
- `src/seed.ts`

`src/components/docker/Scratchpad.tsx` was also hash-checked and remained unchanged.

### Post-sweep verification

Completed:

- `npx tsc --noEmit` — passed with zero errors.
- `npm run build` — passed and produced `verse-studio.html`.
- Static packed-output check — no `<script src=`, `<link rel="stylesheet"`, or `/assets/` references in `verse-studio.html`.
- Raw Tailwind palette grep — no `text-zinc`, `bg-gray`, `text-red-`, or `text-blue-` in `src/`.
- Frozen file hash comparison against the Sweep-3 ZIP — unchanged.
- `src/components/docker/Scratchpad.tsx` hash comparison against the Sweep-3 ZIP — unchanged.
- `node --check verify-sweep29.mjs` — passed.

Blocked:

- `node verify-sweep29.mjs` could not run because Playwright Chromium is not installed in this sandbox. This is an environment/browser tooling limitation, not an observed app failure.


## Sweep 5 — Drawer redesign, clipboard history, scrollbar fix — 2026-05-23

### Changes made

- Changed App route scrolling from `overflow-auto` to `overflow-y-auto overflow-x-hidden` so horizontal scrollbars no longer cover the ScratchDrawer handle.
- Rebuilt `ScratchDrawer` into a tabbed Quick Capture drawer with a full-click handle, animated height, persisted tab state, and always-mounted tab bodies.
- Added `src/components/ClipboardPanel.tsx` for clipboard history inside Quick Capture.
- Removed Clipboard from Docker and removed `clipboard` from `DockerContext`; Docker now defaults to `recently-deleted`.
- Added thin global scrollbar CSS.
- Changed CommandPalette backdrop from opaque black to a lighter blurred backdrop.
- Moved NotificationToast from `bottom-4` to `bottom-10` so toasts do not sit on top of the drawer handle.
- Added title filter inputs to Writing, Notes, Poetry, and Longform list columns.

### Workarounds / judgment calls

- Implemented image clipboard support without editing frozen data/types by storing image captures as data URLs in the existing `DockerClipboard.text` field. Rendering checks `text.startsWith('data:image/')`.
- Kept `src/components/docker/Clipboard.tsx` unchanged for compatibility/history even though it is no longer imported by Docker.
- Used localStorage key `verse-studio:clipboard:hidden` for soft-delete IDs rather than changing the IDB schema or frozen types.
- Avoided TypeScript `@ts-expect-error` pragmas by using typed Clipboard API casts, so the code remains clean if DOM lib coverage changes.

### Frozen-file check

The frozen files were not modified:

- `src/db.ts`
- `src/types.ts`
- `src/context.tsx`
- `src/seed.ts`

Additional unchanged-file requirements:

- `src/components/docker/Scratchpad.tsx` unchanged.
- `src/components/docker/Clipboard.tsx` unchanged.


### Sweep 5 post-sweep verification

Completed:

- `npx tsc --noEmit` — passed with zero errors.
- `npm run build` — passed and produced `verse-studio.html`.
- Static packed-output check — no `<script src=`, `<link rel="stylesheet"`, or `/assets/` references in `verse-studio.html`.
- Raw Tailwind palette grep — no `text-zinc`, `bg-gray`, `text-red-`, or `text-blue-` in `src/`.
- Frozen file hash comparison against the Sweep-4 ZIP — unchanged.
- `src/components/docker/Scratchpad.tsx` hash comparison against the Sweep-4 ZIP — unchanged.
- `src/components/docker/Clipboard.tsx` hash comparison against the Sweep-4 ZIP — unchanged.
- `node --check verify-sweep29.mjs` — passed.

Blocked:

- `node verify-sweep29.mjs` could not run because Playwright Chromium is not installed in this sandbox.

## Calibration Sweep 1 — archive intake and doc refresh — 2026-05-23

### Inspected

- Unpacked `Nexus Verse Studio.zip` into a clean work directory.
- Confirmed required exact-case docs already existed: `CODEBASE_ORIENTATION.MD`, `AI_README.MD`, `FREEDOM_REASONING_LOG.MD`, `HANDY_CODE_SNIPPETS.MD`, `HANDY_LESSONS.MD`, `LANDMINES.MD`, `AI_CODEBASE_HANDOFF.MD`.
- Confirmed the then-dual lowercase docs `README.md` and `CODEBASE_ORIENTATION.md` were byte-identical before edits. The README pairing was later intentionally split; the orientation pairing remains synced.
- Inspected `package.json`, `vite.config.ts`, `tsconfig.json`, `src/App.tsx`, `src/main.tsx`, `src/db.ts`, source file inventory, localStorage key inventory, and historical handoff docs.

### Changes made

- Updated maintainer docs to correct current schema values from stale v5 references to `DB_VERSION = 6` / `SCHEMA_VERSION = 6`.
- Appended Calibration Sweep 1 notes to the required maintainer docs.
- Synchronized the then-dual lowercase docs after updating exact-case protocol counterparts. The README pairing was later intentionally split; the orientation pairing remains synced.
- Repaired extracted dependency execute permissions for local verification only: `node_modules/.bin/vite`, `node_modules/vite/bin/vite.js`, and `node_modules/@esbuild/linux-x64/bin/esbuild` were `chmod +x` because the uploaded archive extracted them without executable bits.

### Workarounds / judgment calls

- Did not run `npm install`; the vendored `node_modules/` tree was already present and `npx tsc --noEmit` worked. The minimal safe workaround was restoring execute bits to existing build tools rather than altering dependency versions.
- Did not modify functional source code during calibration.

### Verification performed

Completed:

- `npx tsc --noEmit` — passed.
- `node --check verify-sweep29.mjs` — passed.
- `npm run build` — passed after execute-permission repair and produced `verse-studio.html` at about 723.3 KB.
- Static packed-output grep — no external `<script src=`, stylesheet link, or `/assets/` references in `verse-studio.html`.

Blocked:

- `node verify-sweep29.mjs` could not run because Playwright Chromium is not installed at the expected cache path in this sandbox.

### Frozen/source check

No files under `src/` were edited by this calibration sweep.


## Sweep 30 — Absorb Docker into ScratchDrawer + NOOB_GUIDE — 2026-05-23

### Inspected

- Checked required protocol docs before editing: all seven exact-case docs existed.
- Inspected `src/App.tsx`, `src/components/ScratchDrawer.tsx`, `src/components/Docker.tsx`, `src/components/DockerContext.tsx`, and the four Docker panel components under `src/components/docker/`.
- Confirmed `Docker.tsx` and `DockerContext.tsx` existed before the sweep and were not deleted.

### Changes made

- Removed `Docker` and `DockerProvider` imports/usage from `src/App.tsx`.
- Left a `{/* Docker removed */}` marker where the right-side panel used to render.
- Added the required retirement comment to the top of `src/components/Docker.tsx`.
- Rewrote `src/components/ScratchDrawer.tsx` only to expand tab support from two tabs to six while preserving the existing open/tab localStorage keys, toggle behavior, chevron animation, and `Quick Capture` label.
- Created `NOOB_GUIDE.MD` with non-technical setup, run, build, install script, troubleshooting, and local data/export instructions.
- Updated required maintainer docs and synchronized lowercase doc twins as they existed at that point. The README pairing was later intentionally split; the orientation pairing remains synced.

### Workarounds / judgment calls

- Added a small `VALID_TABS` readonly array in `ScratchDrawer.tsx` to keep six-tab localStorage validation explicit and reversible.
- Did not delete legacy Docker files because the sweep explicitly required keeping them on disk.

### Verification performed

Completed:

- `npx tsc --noEmit` — passed.
- `npm run build` — passed.
- Static source grep confirmed no `Docker`/`DockerProvider` import or `<Docker />` render remains in `src/App.tsx`.
- Static source grep confirmed exactly six `scratch-drawer-tab-*` buttons in `src/components/ScratchDrawer.tsx`.
- Static source grep confirmed `Docker.tsx` and `DockerContext.tsx` still exist.

Blocked / not performed:

- No browser automation pass was run; prior Playwright Chromium availability remains a sandbox limitation unless browsers are installed separately.

## Post-Sweep 30 noob installer correction — 2026-05-23

### Inspected

- User-supplied installer: `install-nexus-icon-current-folder.sh`.
- Existing `NOOB_GUIDE.MD`, required maintainer docs, and root install scripts.

### Changes made

- Added `install-nexus-icon-current-folder.sh` to the project root and marked it executable.
- Rewrote the noob installer section in `NOOB_GUIDE.MD` to prefer the current-folder installer for Linux Activities icon setup.
- Logged the future handoff rule across maintainer docs: noob instructions must point users to the current-folder installer and show `cd` into the extracted app folder before running it.

### Workarounds / judgment calls

- Kept the older `install.sh` script on disk and documented it as legacy/general setup, because the user asked for the corrected installer to be used but did not ask to delete existing scripts.
- Did not change functional `src/` app code; this was an install-doc/package correction.

### Verification performed

- `bash -n install-nexus-icon-current-folder.sh` passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed.


## Sweep 31 — Larger editor input fields — 2026-05-23

### Inspected

- Checked required protocol docs before editing: all exact-case docs existed, plus `NOOB_GUIDE.MD`.
- Inspected `src/index.css` and all textarea/input usages reported by grep across `src/`.
- Focused on body/prompt-entry fields rather than single-line title/search inputs.

### Changes made

- Hardened `.editor-surface` in `src/index.css` with `display: block`, `box-sizing: border-box`, `min-width: 0`, and `overflow: auto`.
- Added specific CSS guards for `textarea.editor-surface.flex-1` and `textarea.editor-surface.min-h-full` to prevent flex/height collapse patterns.
- Updated Writing, Notes, Poetry, and Longform body editor wrappers/textareas to use explicit full-height and `24rem` minimum heights.
- Enlarged small Prompt Studio textareas used for pipeline notes, pipeline descriptions, and reusable block bodies.
- Updated generated build artifacts via `npm run build`.

### Workarounds / judgment calls

- Did not rewrite every textarea in the app. Title, filter, search, and quick one-line capture fields should remain compact.
- Chose explicit height/min-height on the main writing surfaces instead of content-auto-resizing, because the user's complaint was about fields not using available space.

### Verification performed

- `npx tsc --noEmit` passed.
- `npm run build` passed and regenerated `dist/` plus `verse-studio.html`.

## Documentation cleanup sweep — README split + Canvas read pass — 2026-05-23

### Scope

Documentation-only cleanup. No functional source files were edited. `src/studios/canvas/Canvas.tsx` was read for behavior analysis only.

### Actions

- Renamed the previous exact-case maintainer readme path to `AI_README.MD` and added the AI-maintainer HTML comment at the top.
- Rewrote `README.md` as a short GitHub/user-facing readme.
- Updated root markdown references from the old maintainer readme name to `AI_README.MD`.
- Updated `LANDMINES.MD` and `AI_CODEBASE_HANDOFF.MD` to treat the README split as intentional and non-mergeable.
- Updated maintainer doc lists in `AI_README.MD`, `CODEBASE_ORIENTATION.MD`, and synchronized `CODEBASE_ORIENTATION.md`.

### Verification

- Confirmed no files under `src/` changed.
- Confirmed `pack.js`, `vite.config.ts`, and `package.json` were not changed.
- Confirmed no root markdown references to the previous maintainer readme name remain.


## Sweep 36 — DB v9 Schema Spine — 2026-05-24

### Non-obvious decisions

- `PERSISTENCE_SCHEMA_AND_STORAGE_HISTORY.MD` was not present inside the uploaded code ZIP, but the required archive was available through File Library. Proceeded after loading that archive context; archive hash remains `HASH-NOT-CHECKED` because no matching hash artifact was supplied for this exact file instance.
- `CONTROL_ROOM_STATE.MD` was requested by the sweep but absent from the source ZIP. Created it as a new governance file rather than silently skipping the required state update.
- Type expansion of `LinkableType` forced minimal component updates in `LinksPanel.tsx` and `RelatedStrip.tsx`. The fixes add labels and non-navigable handling for new schema-only linkable kinds without adding UI flows or routes.
- Did not add a `SemanticColor` IDB store and did not implement `PromptPipeline.outputTarget` routing because Sweep 36 declares both as schema-only foundations for later sweeps.

### Verification boundary

Typecheck and build verify source implementation only. Runtime migration/index creation remains `RUNTIME-UNVERIFIED` because the diagnostic exporter is absent.

## Sweep 37 — Convert Anything MVP

- Used a type-only import for `ConversionKind` from `ConvertModal` into `context.tsx` to avoid a runtime React/context circular dependency while keeping the public conversion kind colocated with the modal contract.
- Routed InboxItem→Scrap navigation to `/projects` directly instead of calling `jumpToSelection`, because `JumpableKind` has no scrap discriminator and writing a scrap id into the project selection key would corrupt selection state.
- Added `convertRecord` to the test injection surface for parity with existing context helpers; this is a source-level test hook only and not runtime attestation.
- `CONTROL_ROOM_STATE.MD` was carried forward as active after Sweep 36 and updated rather than recreated.



## Sweep 38 — Nexus Panel MVP

- Implemented the panel as a shell-level sibling rather than modifying studios, preserving the sweep rule that existing `setActiveRecord` calls drive panel context.
- Used typed helper functions in `NexusPanel.tsx` instead of direct broad `any` access except for shared optional `projectId`/lineage resolution shapes. This keeps the panel additive and avoids schema writes.
- Filtered tag links and snapshots by both record id and record type to avoid cross-type id collisions while keeping the requested record-context behavior.
- Runtime remains RUNTIME-UNVERIFIED because no diagnostic exporter/bundle is present.

- Reported selector count uses the Sweep 37 counting convention: static source selectors plus declared dynamic/runtime selectors. After Sweep 38: 538 static + 2 declared dynamic = 540.

## Sweep 39 — UX Trust-Breaker Polish

Sweep 39 hides Atlas and Scraps from Sidebar navigation while leaving routes mounted; replaces the `/scraps` placeholder with a Projects redirect notice; auto-enters ProjectInfoPanel edit mode after new project creation; and hardens ScratchDrawer tab/content event behavior. No IDB stores, routes, localStorage keys, DB_VERSION, or SCHEMA_VERSION changed. Selector inventory is now 539. Runtime remains RUNTIME-UNVERIFIED until browser/Electron checks run.

Sweep 39 verification: typecheck/build passed; `verse-studio.html` size 799559 bytes; runtime remains RUNTIME-UNVERIFIED.
