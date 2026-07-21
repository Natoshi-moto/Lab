# Handy Code Snippets

## Build and pack

```bash
npm run build
```

Runs Vite and then `pack.js`. Expected result: root-level `verse-studio.html` with no external script/style asset references.

## Syntax-check a verification script

```bash
node --check verify-sweep29.mjs
```

## Run latest browser verification

```bash
CHROMIUM_PATH=/path/to/chromium node verify-sweep29.mjs
```

Omit `CHROMIUM_PATH` if Playwright already finds Chromium.

## Add a new IndexedDB store safely

```ts
// src/db.ts
export const DB_VERSION = 8

export const STORES = [
  // existing stores...
  'prompts',
  'newStoreName'
] as const

// In upgrade(): additive stores are created by the shared loop.
// Only add row rewrite logic if existing records need migration.
```

Also update `src/types.ts`, `src/context.tsx`, export/import paths, seed/test assumptions, and docs. Treat this as a frozen-four change.

## Use context CRUD instead of direct DB access

```tsx
const ws = useWorkspace()
await ws.updateDocument(id, { title: nextTitle })
```

Components should not call `idb` directly. Route through context methods.

## Debounced editor autosave shape

```tsx
useDebouncedAutosave(draft, async (next) => {
  await ws.updateDocument(doc.id, next)
})
```

Keep draft state local to the editor; let context persist.

## Rail collapse pattern

```tsx
import { useRailCollapse } from '../../util/rail'

const RAIL_KEY = 'verse-studio:example:rail-collapsed'
const rail = useRailCollapse(RAIL_KEY)
```

Clone the Writing/Notes/Poetry implementation rather than inventing a new rail contract.

## Recent views hook/push pattern

```tsx
import { pushRecentView } from '../../util/recentViews'

pushRecentView({ kind: 'document', id: doc.id, title: doc.title })
```

Use only when the user actually opens/views a record, not merely when lists reorder.

## Right-click list menu pattern

```tsx
<ListItemMenu
  x={menu.x}
  y={menu.y}
  title={record.title}
  shelved={isShelved}
  onOpen={openRecord}
  onLink={startLinkFlow}
  onToggleShelf={toggleShelf}
  onDelete={deleteRecord}
  onClose={() => setMenu(null)}
/>
```

`ListItemMenu` is shared; avoid per-studio duplicate context menus.

## Resizable native list pane hook

`src/util/listPane.ts` now contains the reusable implementation used by Writing and Notes. Use this pattern for Poetry or future list+editor studios.

```tsx
import { useResizableListWidth } from '../../util/listPane'

const LIST_WIDTH_KEY = 'verse-studio:example:listWidth'

function ExampleListPane() {
  const { width, startResize, isResizing } = useResizableListWidth(LIST_WIDTH_KEY)

  return (
    <aside
      className={`relative shrink-0 border-r border-line bg-surface flex flex-col ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
    >
      {/* list content */}
      <div
        className="absolute inset-y-0 right-0 w-1 cursor-col-resize z-20"
        onMouseDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize list"
      />
    </aside>
  )
}
```

Contract:

- Default width: `240px`.
- Clamp: `160px` to `480px`.
- Persist on mouseup only.
- Use token classes (`bg-surface`, `border-line`, `text-ink-faint`) rather than raw Tailwind palette colours.

## EditorStatusBar snippet — Sweep 2

```tsx
interface EditorStatusBarProps {
  body: string
}

export function EditorStatusBar({ body }: EditorStatusBarProps) {
  const trimmed = body.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const chars = body.length

  return (
    <div className="shrink-0 border-t border-line px-6 py-1.5 flex items-center gap-4 text-[11px] text-ink-faint select-none">
      <span data-test="editor-word-count">{words} {words === 1 ? 'word' : 'words'}</span>
      <span data-test="editor-char-count">{chars} {chars === 1 ? 'char' : 'chars'}</span>
    </div>
  )
}
```

Use `draft.body`, not the persisted record body, so counts update live while the user types.

## Right-sidebar Docker shell snippet — Sweep 2

```tsx
<div className="h-full flex" data-test="shell">
  {!focus && <Sidebar />}
  <div className="flex-1 flex min-w-0">
    <div className="flex-1 flex flex-col min-w-0">
      <TopBar />
      <main className="flex-1 overflow-auto">{/* routes */}</main>
    </div>
    {!focus && <Docker />}
  </div>
  <CommandPalette />
  <NotificationToast />
</div>
```

This makes Docker a right-side inspector. Do not put Docker back below `main` unless the product explicitly returns to bottom-panel behavior.

## Editor prose-width wrapper snippet — Sweep 2

```tsx
<div className="flex-1 overflow-auto">
  <div className="max-w-[72ch] mx-auto px-6 py-6 min-h-full">
    <textarea className="editor-surface min-h-full text-ink" />
  </div>
</div>
```

For Poetry, preserve `whitespace-pre` on the textarea.

## Sweep 3 — autosave status and Longform list snippets

### `useDebouncedAutosave` return-value pattern

```tsx
const { lastSavedAt } = useDebouncedAutosave(signature, isDirty, () => {
  savedRef.current = { title: draft.title, body: draft.body }
  ws.updateDocument(doc.id, draft)
})

<EditorStatusBar body={draft.body} lastSavedAt={lastSavedAt} />
```

Callers that do not need the timestamp can still call the hook as a statement:

```tsx
useDebouncedAutosave(signature, isDirty, () => saveDraft())
```

### `EditorStatusBar` saved-flash pattern

```tsx
const [savedFlash, setSavedFlash] = useState(false)
const prevSavedAt = useRef<number | null>(null)

useEffect(() => {
  if (lastSavedAt !== null && lastSavedAt !== prevSavedAt.current) {
    prevSavedAt.current = lastSavedAt
    setSavedFlash(true)
    const t = window.setTimeout(() => setSavedFlash(false), 2000)
    return () => window.clearTimeout(t)
  }
  return undefined
}, [lastSavedAt])
```

### Longform doc list row pattern

```tsx
<button
  onClick={() => onSelect(doc.id)}
  onContextMenu={(e) => handleContextMenu(e, doc.id)}
  className={`w-full min-h-[40px] rounded px-3 py-2 text-left flex items-start gap-2 transition-colors ${
    selectedId === doc.id ? 'bg-surface-3' : 'hover:bg-surface-2'
  }`}
  data-test="longform-doc-item"
  data-doc-id={doc.id}
>
  <span className="min-w-0 flex-1 leading-tight">
    <span className="block text-sm text-ink truncate">{doc.title || 'Untitled'}</span>
    <span className="block text-xs text-ink-faint truncate mt-0.5">{preview}</span>
  </span>
  <time className="shrink-0 text-[11px] text-ink-faint leading-tight pt-0.5">
    {formatCompactRelativeTime(doc.updatedAt)}
  </time>
</button>
```


## ScratchDrawer overlay pattern — Sweep 4

Use this pattern for bottom overlays that should sit on top of route content without pushing the app layout upward.

```tsx
// App shell
<div className="flex-1 relative min-h-0 overflow-hidden">
  <main className="h-full overflow-auto">
    {/* routes */}
  </main>
  {!focus && <ScratchDrawer />}
</div>
```

```tsx
// Overlay component
export function ScratchDrawer() {
  const [open, setOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(OPEN_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem(OPEN_KEY, open ? 'true' : 'false') } catch {}
  }, [open])

  return (
    <div
      data-test="scratch-drawer"
      data-open={open ? 'true' : 'false'}
      className="absolute bottom-0 left-0 right-0 z-20 bg-surface-2 border-t border-line flex flex-col"
      style={{ height: open ? drawerHeight : 28 }}
    >
      <div
        className="h-7 shrink-0 flex items-center px-3 gap-2 cursor-pointer select-none group"
        onClick={() => setOpen((o) => !o)}
        data-test="scratch-drawer-handle"
        role="button"
        aria-expanded={open}
      >
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint flex-1">
          Scratchpad
        </span>
      </div>
      {open && <div className="flex-1 min-h-0 border-t border-line overflow-hidden">{/* content */}</div>}
    </div>
  )
}
```

## Resizable Inbox list pattern — Sweep 4

```tsx
const LIST_WIDTH_KEY = 'verse-studio:inbox:listWidth'
const { width, startResize, isResizing } = useResizableListWidth(LIST_WIDTH_KEY)

return (
  <aside
    className={`relative shrink-0 border-r border-line bg-surface-2 flex flex-col ${isResizing ? 'select-none' : ''}`}
    style={{ width }}
  >
    <div
      className="absolute inset-y-0 right-0 w-1 cursor-col-resize z-20"
      onMouseDown={startResize}
      role="separator"
      aria-orientation="vertical"
    />
    {/* list */}
  </aside>
)
```


## Sweep 5 — tabbed Quick Capture drawer

```tsx
const OPEN_KEY = 'verse-studio:scratch-drawer:open'
const TAB_KEY = 'verse-studio:scratch-drawer:tab'
const HEIGHT_KEY = 'verse-studio:scratch-drawer:height'
const DEFAULT_HEIGHT = 360
const MIN_HEIGHT = 160
type DrawerTab = 'scratch' | 'clip'

<div
  data-test="scratch-drawer"
  data-open={open ? 'true' : 'false'}
  data-tab={tab}
  className="absolute bottom-0 left-0 right-0 z-20 bg-surface-2 border-t border-line flex flex-col transition-[height] duration-200 ease-in-out overflow-hidden"
  style={{ height: open ? drawerHeight : 28 }}
>
  {open && <div data-test="scratch-drawer-resize" onMouseDown={handleResizeStart} />}
  <div className="h-7 shrink-0 flex items-center px-3 gap-3">
    <button data-test="scratch-drawer-handle" onClick={() => setOpen((o) => !o)}>Scratchpad</button>
    <button onClick={() => handleTabClick('scratch')}>Scratch</button>
    <button onClick={() => handleTabClick('clip')}>Clip</button>
  </div>
  <div className={tab === 'scratch' ? 'h-full' : 'hidden'}>{/* Scratchpad */}</div>
  <div className={tab === 'clip' ? 'h-full' : 'hidden'}>{/* ClipboardPanel */}</div>
</div>
```

## Sweep 5 — ClipboardPanel soft-delete pattern

```tsx
const HIDDEN_KEY = 'verse-studio:clipboard:hidden'

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveHidden(ids: Set<string>) {
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids])) } catch {}
}

const active = entries.filter((entry) => !hidden.has(entry.id))
const binEntries = entries.filter((entry) => hidden.has(entry.id))
```

## Sweep 5 — Clipboard image capture pattern

```tsx
const clipboardApi = navigator.clipboard as Clipboard & {
  read?: () => Promise<Array<{ types: string[]; getType: (type: string) => Promise<Blob> }>>
}

if (typeof clipboardApi.read === 'function') {
  const items = await clipboardApi.read()
  for (const item of items) {
    const imageType = item.types.find((type) => type.startsWith('image/'))
    if (imageType) {
      const blob = await item.getType(imageType)
      const dataUrl = await blobToDataUrl(blob)
      await ws.captureClipboard({ text: dataUrl, sourceLabel: 'image' })
      return
    }
  }
}
```

## Sweep 5 — list filter pattern

```tsx
const [filterQuery, setFilterQuery] = useState('')
const filtered = filterQuery.trim()
  ? items.filter((item) => (item.title || 'Untitled').toLowerCase().includes(filterQuery.toLowerCase()))
  : items
```

## Calibration Sweep 1 — extracted dependency execute-bit repair

Use this only when an uploaded archive includes `node_modules/` but build launchers extract without execute permissions. Prefer `npm install` from `package-lock.json` when dependency refresh is acceptable.

```bash
chmod +x node_modules/.bin/vite \
  node_modules/vite/bin/vite.js \
  node_modules/@esbuild/linux-x64/bin/esbuild
npm run build
```


## Sweep 30 — Six-tab ScratchDrawer validation pattern

```tsx
type DrawerTab = 'scratch' | 'clip' | 'recently-deleted' | 'recent-items' | 'files' | 'quick-add'

const VALID_TABS: readonly DrawerTab[] = [
  'scratch',
  'clip',
  'recently-deleted',
  'recent-items',
  'files',
  'quick-add'
]

const [tab, setTab] = useState<DrawerTab>(() => {
  try {
    const v = localStorage.getItem(TAB_KEY)
    return VALID_TABS.includes(v as DrawerTab) ? v as DrawerTab : 'scratch'
  } catch { return 'scratch' }
})
```

Use this pattern when extending localStorage-backed tab enums: validate stale stored strings and fall back to a safe default without changing the storage key.

## Linux Activities icon installer — current-folder version

Use this for noob-facing Linux/Fedora handoffs when the app has already been unzipped:

```bash
cd ~/Documents/Nexus_Verse_Studio_sweep30\(2\)/VERSE\ REAL
bash ~/Downloads/install-nexus-icon-current-folder.sh
```

Generic form:

```bash
cd "/path/to/unzipped/VERSE REAL"
bash ~/Downloads/install-nexus-icon-current-folder.sh
```

The script must find `package.json` in the current working directory. If it does not, it exits with a clear error instead of guessing.


## Sweep 31 — Full-height editor textarea pattern

Use this pattern for main prose fields that should occupy the available editor space:

```tsx
<div className="flex-1 min-h-0 overflow-auto">
  <div className="max-w-[72ch] mx-auto px-6 py-6 h-full min-h-[24rem]">
    <textarea className="editor-surface h-full min-h-[24rem] text-ink" />
  </div>
</div>
```

Keep compact fields like titles, list filters, and short search boxes out of this pattern.

## Calibration Sweep 2 — Build permission recovery snippet

If a freshly extracted archive fails with `sh: 1: vite: Permission denied`, check executable bits before touching app source:

```bash
ls -l node_modules/.bin/vite node_modules/vite/bin/vite.js node_modules/@esbuild/linux-x64/bin/esbuild
chmod +x node_modules/.bin/vite node_modules/vite/bin/vite.js node_modules/@esbuild/linux-x64/bin/esbuild
npm run build
```

Use this only as an extraction/dependency permission repair. It is not an app-code fix.

## Calibration Sweep 2 — Packed HTML static check

After `npm run build`, verify the single-file output did not leak external asset references:

```bash
python3 - <<'PY'
from pathlib import Path
import re, sys
html = Path('verse-studio.html').read_text('utf-8')
checks = [
    (r'<script[^>]+src=', 'external script src'),
    (r"<link[^>]+rel=[\"']stylesheet", 'external stylesheet'),
    (r'/assets/', 'asset path'),
]
for pattern, msg in checks:
    if re.search(pattern, html, re.I):
        print('FAIL', msg)
        sys.exit(1)
print('packed html has no external script/style/assets refs')
PY
```

## Sweep 33 Projects selectors and localStorage checks

Confirm the Projects row selectors are present in source:

```bash
grep -n "project-content-card\|project-continue-strip\|project-row-add-documents\|project-row-add-notes\|project-row-add-scraps\|project-row-add-longform\|project-row-add-appdesign\|project-row-add-poems" src/studios/projects/Projects.tsx
```

Inspect the per-project row-recency key in DevTools:

```js
localStorage.getItem(`verse-studio:projects:${projectId}:lastType`)
```

Expected value shape:

```json
{"documents":1716400000000,"notes":1716399000000}
```

Scraps now has a live data layer from Sweep 37; UI rows may still be placeholder-only until a later UI sweep wires them to `ws.scraps`.

## Sweep 33b verification snippets

Verify sidebar order source arrays and Scraps route:

```bash
grep -n "ROUTES_MAKE\|ROUTES_KEEP\|ROUTES_SYSTEM\|/scraps" src/components/Sidebar.tsx src/App.tsx
```

Verify Projects horizontal tabs/selectors:

```bash
grep -n "project-type-tabs\|project-type-tab-" src/studios/projects/Projects.tsx
```

Verify body textarea full-height pattern remains present in the writing surfaces:

```bash
grep -R "flex-1 min-h-0 overflow-auto\|editor-surface h-full min-h-\[24rem\]" \
  src/studios/writing src/studios/notes src/studios/poetry src/studios/longform
```

If `npx tsc --noEmit` fails with `../typescript/bin/tsc: not found` after extracting a ZIP that includes `node_modules`, inspect `node_modules/.bin/tsc`. Some unzip paths materialise package-manager shims as plain text. Repairing the dependency shim is acceptable as extraction repair; do not treat it as an app source change.


## Canvas node resize persistence pattern — Sweep 32

Canvas placement state is localStorage-backed and currently lives in `src/studios/canvas/Canvas.tsx`. Keep old `{ x, y }` entries compatible when adding dimensions:

```tsx
interface CanvasPosition {
  x: number
  y: number
  width?: number
  height?: number
}

positions[nodeId] = { x, y, width, height }
savePositions(projectId, positions)
```

When using `NodeResizer`, update both React Flow state and localStorage. The custom node should also render from persisted dimensions:

```tsx
<NodeResizer
  isVisible={selected || hovered || resizing}
  onResize={(_, params) => resizeNode(id, params.x, params.y, params.width, params.height)}
/>

<div style={{ width: data.width, height: data.height }} />
```

Keep resize-handle events separate from node body navigation with propagation guards on the resizer wrapper.


## Scraps data-layer CRUD

```tsx
const ws = useWorkspace()

const scrap = await ws.createScrap({
  body: 'Captured thought',
  projectId: project.id,
  sourceLabel: 'manual'
})

await ws.updateScrap(scrap.id, { body: 'Updated captured thought' })
await ws.softDeleteScrap(scrap.id) // hides from ws.scraps, keeps IDB row with deletedAt
await ws.purgeScrap(scrap.id)      // hard delete
```

`ws.scraps` contains active scraps only, sorted by `updatedAt` descending.


## Projects Scraps row helpers — Sweep 38

```ts
const projectScraps = ws.scraps
  .filter((s) => s.projectId === project.id)
  .sort((a, b) => b.updatedAt - a.updatedAt)

await ws.createScrap({
  body: text.trim(),
  projectId: project.id,
  sourceLabel: 'manual',
})

await ws.updateScrap(scrap.id, { body: draft.trim() })
await ws.softDeleteScrap(scrap.id)
```

```ts
function touchProjectRow(projectId: string, rowType: string) {
  const key = `verse-studio:projects:${projectId}:lastType`
  const prev = JSON.parse(localStorage.getItem(key) || '{}')
  localStorage.setItem(key, JSON.stringify({ ...prev, [rowType]: Date.now() }))
}
```


## Bootstrap status gate pattern — Sweep 38b

```tsx
const ws = useWorkspace()
if (ws.bootstrapStatus === 'loading') return <LoadingScreen />
if (ws.bootstrapStatus === 'blocked') return <BootstrapBlockedScreen />
if (ws.bootstrapStatus === 'error') return <BootstrapErrorScreen message={ws.bootstrapError} />
if (!ws.ready) return <LoadingScreen />
```

Do not render studio routes before the bootstrap status is `ready`.

## Safe store hydration pattern — Sweep 38b

```ts
async function hydrateStore<T>(store: StoreName): Promise<T[]> {
  try {
    return await dbGetAll<T>(store)
  } catch (error) {
    console.warn(`[Verse Studio] Store hydration failed for: ${store}`, error)
    return []
  }
}
```

Use this for startup hydration only. CRUD paths should still surface write failures.


## Quick Capture default project helper

Use this pattern when a Quick Capture feature needs to default to the currently active project:

```ts
const LAST_ACTIVE_PROJECT_KEY = 'verse-studio:projects:lastActive'

function defaultProjectId(projects: Project[]): string {
  try {
    const lastActive = localStorage.getItem(LAST_ACTIVE_PROJECT_KEY)
    if (lastActive && projects.some((project) => project.id === lastActive)) return lastActive
  } catch {}
  return projects[0]?.id ?? ''
}
```

Do not create a parallel last-project key for Quick Capture; use `verse-studio:projects:lastActive`.


## Focus mode keyboard shortcut pattern — superseded by Sweep 34

```ts
if (e.key === 'Escape' && focus) {
  e.preventDefault()
  if (isScratchDrawerOpen()) {
    setScratchDrawerOpen(false)
    return
  }
  setFocus(false)
}
```

Escape is now two-stage in focus mode: close an open ScratchDrawer first, then exit focus only when the drawer is already closed. Keep `Cmd/Ctrl+.` as the independent focus toggle.

## v0.01 release installer contract

```bash
chmod +x ./install-nexus-verse-studio-v0.01.sh
./install-nexus-verse-studio-v0.01.sh
```

Future versioned release installers should keep the same launcher/icon/install logic and update only version identity unless a sweep explicitly changes the installer contract.


## Prompt compose autosave pattern — v0.02

Use local draft state keyed by selected `Prompt.id`, compare against the source record, then debounce to context:

```tsx
const [draft, setDraft] = useState({ title: prompt.title, body: prompt.body })
const dirty = draft.title !== prompt.title || draft.body !== prompt.body
useDebouncedAutosave(draft.title + '\u0000' + draft.body, dirty, () => {
  ws.updatePrompt(prompt.id, { title: draft.title, body: draft.body })
})
```

Do not write prompt compose body/title to localStorage.

## Sweep 34 / v0.03 snippet — focus-mode drawer bridge

Use the shared helper instead of reading/writing the ScratchDrawer localStorage key directly from new UI surfaces:

```ts
import { isScratchDrawerOpen, setScratchDrawerOpen } from './scratchDrawerState'

if (isScratchDrawerOpen()) {
  setScratchDrawerOpen(false)
} else {
  setScratchDrawerOpen(true)
}
```

Inside `ScratchDrawer.tsx`, local handle clicks persist directly with `persistScratchDrawerOpen(value)` so the component does not dispatch an event back to itself while its own state update is in flight. External callers should use `setScratchDrawerOpen(value)` so mounted drawer instances receive the custom event.

## Sweep 36 / v0.04 snippet — editor body padding

```css
.editor-body-pad {
  padding-left: clamp(1.5rem, 5vw, 6rem);
  padding-right: clamp(1.5rem, 5vw, 6rem);
}
```

Use this utility on the direct wrapper around large body textareas:

```tsx
<div className="w-full py-6 editor-body-pad flex-1 min-h-0 flex flex-col">
  <textarea className="editor-surface flex-1 min-h-[32rem] w-full text-ink resize-none" />
</div>
```

Keep title fields, record lists, controls, and status bars outside this wrapper-level utility.


## Sweep 35 / v0.05 snippet — secondary panel rail collapse

```tsx
const rail = useRailCollapse('verse-studio:feature:panel:collapsed')

if (rail.collapsed) {
  return (
    <aside className="w-8 shrink-0 border-r border-line bg-surface-2 flex flex-col items-center">
      <button onClick={rail.toggle}>›</button>
    </aside>
  )
}

return (
  <aside className="w-60 shrink-0 border-r border-line bg-surface-2 flex flex-col">
    <button onClick={rail.toggle}>‹</button>
    {/* panel content */}
  </aside>
)
```

For first-visit hints, check whether the collapse key is absent before rendering the hint. Dismiss by writing the same collapse key so the hint does not need a second storage key.

## Sweep 41 / v0.06 snippets — Canvas layer state

```ts
const LAYERS_PREFIX = 'verse-studio:canvas:layers:'
const PANEL_COLLAPSED_KEY = 'verse-studio:canvas:layerPanel:collapsed'
```

```ts
function deriveCanvasContentType(ws: ReturnType<typeof useWorkspace>, recordId: string) {
  if (ws.notes.some((n) => n.id === recordId)) return 'note'
  if (ws.documents.some((d) => d.id === recordId)) return 'document'
  if (ws.poems.some((p) => p.id === recordId)) return 'poem'
  if (ws.longformDocs.some((d) => d.id === recordId)) return 'longform'
  if (ws.scraps.some((s) => s.id === recordId)) return 'scrap'
  return 'unknown'
}
```

Layer counts should be based on nodes after `verse-studio:canvas:hidden:{projectId}` suppression and before applying `verse-studio:canvas:layers:{projectId}` visibility.

## Sweep 42 snippet — inline Canvas Scrap creation path

```ts
const scrap = await ws.createScrap({ body: trimmed, projectId })
const nodeId = `scrap:${scrap.id}`
const positions = loadPositions(projectId)
positions[nodeId] = { x, y, width: 180, height: 120 }
savePositions(projectId, positions)
```

Use this order for inline Canvas creation: create the IDB record first, save a position keyed to the new id immediately, then close the temporary input/render the node.

## Nexus Notes v0.01 stable Electron packaging hotfix — 2026-05-23

- Electron shell now pins its Chromium profile/userData path to `~/.config/nexus-notes-v0.01` via `electron/main.cjs`. This isolates stable Nexus Notes v0.01 from older Nexus Verse / early wrapper attempts and avoids stale IndexedDB profile conflicts. This is an Electron wrapper profile path only; it does **not** rename the governed app `DB_NAME` (`verse-studio`) or `verse-studio:*` localStorage/storage keys.
- Installer now backs up old Electron profile folders (`~/.config/nexus-notes-v0.01` and legacy `~/.config/Nexus Notes v0.01`) into `~/.config/nexus-notes-v0.01-backups/` before launch so v0.01 boots cleanly. Exported workspace `.json` backups are unaffected.
- Desktop launcher now uses icon name `nexus-notes-v0.01`, installs SVG plus 64/128/256/512 PNG hicolor icons, and launches Electron with `--class=nexus-notes-v0.01` so GNOME app drawer / window matching is more reliable.
- Added `reset-nexus-notes-v0.01-data.sh` and `nexus-notes-v0.01-reset` for user-approved profile reset if the bootstrap screen reports “The workspace could not be loaded.”
- No IndexedDB schema/store/localStorage contract changed: `DB_VERSION = 8`, `SCHEMA_VERSION = 8`, 28 stores, diagnostic exporter remains ABSENT, runtime remains `RUNTIME-UNVERIFIED` until browser/Electron verification is actually performed.



## Sweep 30 — ScratchDrawer resize + isolated header toggle

```tsx
const HEIGHT_KEY = 'verse-studio:scratch-drawer:height'
const DEFAULT_HEIGHT = 360
const MIN_HEIGHT = 160

const [drawerHeight, setDrawerHeight] = useState<number>(() => {
  try {
    const v = localStorage.getItem(HEIGHT_KEY)
    if (v) { const n = parseInt(v, 10); if (!isNaN(n) && n >= MIN_HEIGHT) return n }
  } catch {}
  return DEFAULT_HEIGHT
})

function handleTabClick(t: DrawerTab) {
  if (!open) updateOpen(true)
  setTab(t)
}

<div
  data-test="scratch-drawer"
  style={{ height: open ? drawerHeight : 28 }}
>
  {open && <div data-test="scratch-drawer-resize" onMouseDown={handleResizeStart} />}
  <div className="h-7 shrink-0 flex items-center px-3 gap-3">
    <button data-test="scratch-drawer-handle" onClick={() => updateOpen((o) => !o)}>
      Scratchpad
    </button>
    <button onClick={() => handleTabClick('scratch')}>Write</button>
  </div>
</div>
```

Keep the handle/toggle button and tab buttons as siblings. Do not reintroduce a full-row header `onClick` wrapper that requires tab buttons to call `stopPropagation()`.

Electron shell note: `electron/main.cjs` should call `win.maximize()` immediately after `win.setMenuBarVisibility(false)` so Nexus Notes v0.01 starts maximized.

## Sweep 31 — PromptStudio block copy + drop-to-pipeline pattern

```tsx
async function copyCardBody(e: React.MouseEvent, p: Pattern) {
  e.stopPropagation()
  try {
    await navigator.clipboard.writeText(p.body)
    setCopyFlash({ id: p.id, label: 'copied' })
  } catch {
    setCopyFlash({ id: p.id, label: 'failed' })
  }
}

function handlePipelineDrop(e: React.DragEvent<HTMLDivElement>) {
  e.preventDefault()
  const text = e.dataTransfer.getData('text/plain')
  if (text.trim()) addNote(text)
}

<div data-test="pipeline-drop-zone" onDragOver={(e) => e.preventDefault()} onDrop={handlePipelineDrop} />
<button data-test="prompts-library-card-copy" onClick={(e) => copyCardBody(e, p)}>copy</button>
<button data-test="pipeline-empty-add" onClick={openPicker}>+ Add a block</button>
```

Keep dropped block bodies as NOTE steps unless a future sweep explicitly changes pipeline-step semantics. Do not create a new storage key for this path; it uses the existing `verse-studio:prompts:pipelineSteps:{pipelineId}` JSON step array.

## Sweep 32 — quiet AppMark + GNOME/Wayland icon pattern

```tsx
const sizeClass = compact ? 'w-6 h-6' : 'w-8 h-8'

<div className="flex flex-col items-center gap-0.5 shrink-0">
  <div className={`${sizeClass} text-ink-faint flex items-center justify-center`}>
    <svg className="opacity-[0.55]" viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
      {/* Nexus Notes mark */}
    </svg>
  </div>
  {showVersion && <div className="text-[8px] leading-none tracking-wide text-ink-faint">{APP_VERSION}</div>}
</div>
```

```js
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-features', 'WaylandWindowDecorations')
}

const win = new BrowserWindow({ icon, /* ... */ })
// Linux: explicitly set both app and window icon for GNOME alt-tab
try { app.setIcon(icon) } catch (_) {}
win.setIcon(icon)
```

Keep `win.maximize()` immediately after `win.setMenuBarVisibility(false)` unless a future sweep changes startup window behavior.

## Sweep 34 snippet — first pipeline block inline editor pattern — 2026-05-24

- Prompt Studio no longer uses `verse-studio:prompts:view`; do not read/write that key in new Prompt Studio code.
- The unified editor path is: find the lowest-order `PipelineStep` where `note === undefined`, resolve its `Pattern`, render it through the full inline first-block editor, and render remaining steps with `PipelineStepRow`.
- Empty pipelines should create one `Pattern` with `type: 'block'` and then one step `{ id: uid(), patternId: created.id, bindings: {}, order: 0 }`; do not introduce another draft localStorage key.
- Slash-summon reuse pattern: keep slash state local to the editor (`pos`, `queryStart`, `query`, `selected`), rank block patterns with `fuzzyScore`, insert selected `Pattern.body` at the slash span, then move caret to the first inserted `{{var}}` if present.


## Sweep 42 snippet — native global shortcut + portal overlay

```tsx
useEffect(() => {
  function handleShortcut(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '.') {
      e.preventDefault()
      setOpen(open => !open)
    }
  }

  document.addEventListener('keydown', handleShortcut)
  return () => document.removeEventListener('keydown', handleShortcut)
}, [])

{createPortal(<SignalConsole open={open} />, document.body)}
```

## Sweep 42 snippet — dynamic `verse-studio:` localStorage inventory

```ts
const rows = Object.keys(localStorage)
  .filter(k => k.startsWith('verse-studio:'))
  .sort((a, b) => a.localeCompare(b))
  .map((key) => ({ key, value: localStorage.getItem(key) ?? '' }))
```


## Sweep 43 snippet — Nexus lineage store walk

```ts
const STORE_TO_ARRAY: Partial<Record<StoreName, (ws: Workspace) => LineageRecord[]>> = {
  writingDocs: ws => ws.documents as LineageRecord[],
  notes: ws => ws.notes as LineageRecord[],
  scraps: ws => ws.scraps as LineageRecord[],
  longformProjects: ws => ws.longformDocs as LineageRecord[],
  longformSections: ws => ws.sections as LineageRecord[],
  poems: ws => ws.poems as LineageRecord[],
  patterns: ws => ws.patterns as LineageRecord[],
  promptPipelines: ws => ws.pipelines as LineageRecord[],
  promptBlocks: ws => ws.blocks as LineageRecord[],
  inboxItems: ws => ws.inboxItems as LineageRecord[],
  prompts: ws => ws.prompts as LineageRecord[],
}

const visited = new Set<string>()
visited.add(id)
for (let depth = 0; depth < 5 && nextId && nextStore; depth += 1) {
  if (visited.has(nextId)) break
  visited.add(nextId)
  // resolve from STORE_TO_ARRAY[nextStore], then advance from convertedFrom*
}
```

## Sweep 44 snippet — Compile Panel section snapshot and Markdown export

```ts
const AUTHOR_KEY = 'verse-studio:compile:author'

function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length
}

function snapshotSections(sections: LongformSection[]) {
  return sections.map((section) => ({
    id: section.id,
    title: section.title || 'Untitled section',
    body: section.body || '',
    wordCount: countWords(section.body || ''),
  }))
}

// Structured mode:
// ## Title
//
// body
//
// Prose mode joins section bodies with 

---

 and no headings.
downloadText(safeFilename(doc.title || 'untitled') + '.md', content, 'text/markdown')
```


## Sweep 45 snippet — Longform section status defaults

```ts
export type LongformSectionStatus = 'draft' | 'revise' | 'final' | 'cut'

function normalizedStatus(status: LongformSection['status']): LongformSectionStatus {
  return status || 'draft'
}

function snapshotSections(sections: LongformSection[]) {
  return sections.map((section) => {
    const status = normalizedStatus(section.status)
    return {
      id: section.id,
      status,
      included: status !== 'cut',
    }
  })
}
```


## Sweep 46 snippet — Atlas AI lineage rings and weighted edges

```tsx
interface InputNode {
  id: string
  type: 'record' | 'tag' | 'project'
  kind: string
  name: string
  aiLineage: boolean
}

interface InputEdge { source: string, target: string, color?: string, weight?: number }

const weight = typeof e.weight === 'number' && Number.isFinite(e.weight) ? Math.max(1, e.weight) : 1
const strokeWidth = Math.min(3, 1 + (weight - 1) * 0.5)

{n.aiLineage && (
  <circle
    cx={sn.x}
    cy={sn.y}
    r={10}
    style={{ stroke: 'var(--accent)', fill: 'none', opacity: 0.5 }}
  />
)}
```

## Sweep 47 snippet — selector count constant and release QA commands

```tsx
const CANONICAL_DATA_TEST_SELECTOR_COUNT = 619

// Release QA commands:
// npx tsc --noEmit
// NO_COLOR=1 npm run build
// grep -c '<script src=' verse-studio.html
// grep -c '/assets/' verse-studio.html
// grep -roh 'data-test="[^"]*"' src/ | sort -u | wc -l
// grep -roh 'data-testid="[^"]*"' src/ | sort -u | wc -l // report separately if needed
```

## Sweep 48 snippet — ScratchDrawer flex-child layout

```tsx
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
  <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
    <Routes>{/* routes */}</Routes>
  </main>
  <ScratchDrawer />
  <FocusHoverMenu />
</div>

<div
  data-test="scratch-drawer"
  className="flex-none w-full z-20 bg-surface-2 border-t border-line flex flex-col transition-[height] duration-200 ease-in-out overflow-hidden"
  style={{ height: open ? drawerHeight : 28 }}
/>
```

## Sweep 49 — App identity, Focus key, Scraps sidebar — 2026-05-25

User-facing app identity is now **Noted v0.01**: `APP_NAME = 'Noted'`, `APP_TAGLINE = ''`, and diagnostic copy reports `Noted v0.01-3`. `APP_VERSION`, `APP_TITLE`, `APP_STORAGE_PREFIX`, installer script names, Electron identifiers, DB name, and `verse-studio:*` compatibility storage contracts remain unchanged. Global Search no longer captures `/`; Focus Mode uses `/` as an additional non-input shortcut while preserving Cmd/Ctrl+`.`. Scraps is visible in Sidebar again with `sidebar-link-scraps`; `/scraps` routing and ScrapsStudio behavior remain unchanged. Canonical `data-test` selector count is 619, separate `data-testid` count remains 1. No DB/schema/migration/Frozen Four/installer-stack changes. Runtime remains `RUNTIME-UNVERIFIED`.



## Sweep 50 — Prompts Studio UX overhaul

Prompt Studio received a focused UX pass in `src/studios/prompts/PromptStudio.tsx`: user-facing Pipeline copy now reads Prompt where appropriate, the left rail has a Prompts heading, description and variables are collapsed by default via local `useState`, block-library inserts flash the clicked card, the duplicate Materialize action is removed, export/save-as-block actions live in a `⋯` menu, and the first-block write area has a hover copy button. No new localStorage keys, DB/schema/migration changes, Frozen Four touches, or installer-stack changes. Current canonical `data-test` selector count is 619; separate `data-testid` count remains 1. Signal Console selector count constant is `CANONICAL_DATA_TEST_SELECTOR_COUNT = 619`. Runtime remains `RUNTIME-UNVERIFIED`.


## Build-time hash algorithms (Sweep 51)

These are the EXACT algorithms used in the `vite.config.ts` VERIFICATION-INFRASTRUCTURE region. The Orchestrator's independent verification code is expected to match these verbatim. Any change to either algorithm requires an explicit UNFREEZE and a same-sweep update to this file.

### Algorithm 1 — build_commit (SHA-256 of src/ tree)

```javascript
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

function viWalkSync(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let files = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      files = files.concat(viWalkSync(full))
    } else if (e.isFile()) {
      files.push(full)
    }
  }
  return files
}

// srcDir = absolute path to src/
const allFiles = viWalkSync(srcDir)
const relFiles = allFiles.map(f => {
  const rel = path.relative(srcDir, f)
  return rel.split(path.sep).join('/')      // forward slashes, POSIX
})
relFiles.sort()                              // lexicographic, default JS string compare

const running = createHash('sha256')
for (const rel of relFiles) {
  const bytes = fs.readFileSync(path.join(srcDir, ...rel.split('/')))
  const fileHash = createHash('sha256').update(bytes).digest('hex')
  running.update(Buffer.from(rel, 'utf8'))
  running.update(Buffer.from([0x00]))        // NUL separator
  running.update(Buffer.from(fileHash, 'utf8'))
  running.update(Buffer.from([0x00]))        // NUL separator
}
const buildCommit = running.digest('hex')   // 64 lowercase hex chars
```

Rules:
- Walk src/ recursively. Collect regular files only (no directories, no symlinks). Skip nothing.
- Relative paths use forward slashes regardless of OS.
- Sort lexicographically (default `Array.sort()` string compare).
- For each file: SHA-256 its bytes → lowercase hex; feed `rel\0fileHash\0` into running hasher.
- Final running digest is `build_commit`.

### Algorithm 2 — exporter_self_hash (SHA-256 of src/diagnosticExporter.ts)

```javascript
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

// exporterPath = absolute path to src/diagnosticExporter.ts
const exporterBytes = fs.readFileSync(exporterPath)
const exporterSelfHash = createHash('sha256').update(exporterBytes).digest('hex')
// 64 lowercase hex chars
```

Rules:
- Read the file as raw bytes (no encoding argument to readFileSync).
- SHA-256 the bytes.
- Result is 64 lowercase hex chars.

### Algorithm 3 — nonce (runtime, browser)

```javascript
const bytes = new Uint8Array(32)
crypto.getRandomValues(bytes)
const nonce = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
// 64 lowercase hex chars, fresh per export
```

### Reference values for this build (Sweep 51 delivery)

- `build_commit`:       `d6e269b97f142d9ad3c9392286d27465c1a30e036723025ab16c7bca12b7a94b`
- `exporter_self_hash`: `ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb`


## DOM copy capture pattern — Sweep 54

```tsx
document.addEventListener('copy', handleCopy, { capture: true })
return () => document.removeEventListener('copy', handleCopy, true)
```

Use `document.getSelection()?.toString()` inside the handler. Store captured text through `ws.captureClipboard({ text, sourceLabel: 'copied' })`, truncate display text before write, dedupe against the newest `dockerClipboard` entry, and prune overflow with `ws.removeClipboard()`. Do not use `navigator.clipboard.readText()` or clipboard polling.

## ThemeSettings storage/read pattern — Sweep 55

```ts
import { useTheme } from './theme'

const [preset, setPreset, toggleTheme, theme] = useTheme()
setPreset('matrix')
theme.setOverride('--accent', '65 216 128')
theme.resetOverrides()
```

`verse-studio:theme` stores JSON `{ preset, overrides? }`. Overrides are CSS token names mapped to RGB triplets. Legacy raw `dark` and `light` are read but should not be newly written.


## Sweep 58 snippet — Nexus index consumption pattern

```tsx
const ws = useWorkspace()
const { views } = useRecentViews()
const nexus = useNexusIndex(ws, views)
const context = nexus.contextFor(focus ?? activeRecord)
```

Use this pattern for Nexus-facing derived graph data. The helper should stay read-only: it may resolve records, links, backlinks, tags, snapshots, lineage, canvas placements, and suggestions from existing workspace/localStorage side-state, but it should not write IDB rows or mutate link storage.
