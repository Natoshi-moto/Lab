import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  NodeResizer,
  ConnectionMode,
  type NodeProps,
  type EdgeProps,
  type Connection,
  type NodeChange,
  getStraightPath,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import { ProjectPicker } from '../../components/ProjectPicker'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { Snapshots } from '../../components/Snapshots'
import { useDebouncedAutosave } from '../../util/autosave'
import { jumpToSelection, ROUTE_FOR_TYPE } from '../../util/navigate'
import type { LinkableType } from '../../types'
import {
  CONTENT_TYPE_ORDER,
  LayerPanel,
  createDefaultLayerVisibility,
  createEmptyLayerCounts,
  type CanvasContentType,
  type LayerCounts,
  type LayerVisibility,
} from './LayerPanel'

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeKind = 'document' | 'note' | 'poem' | 'longform' | 'build' | 'pattern' | 'pipeline' | 'scrap'

const KIND_LABELS: Record<NodeKind, string> = {
  document: 'Doc',
  note:     'Note',  // Sweep 27
  poem:     'Poem',
  longform: 'Longform',
  build:    'Build',
  pattern:  'Pattern',
  pipeline: 'Pipeline',
  scrap:    'Scrap',
}

const NO_STUDIO = new Set<NodeKind>(['pattern', 'pipeline'])
const SCRAP_NODE_DEFAULT_WIDTH = 180
const SCRAP_NODE_DEFAULT_HEIGHT = 120

interface NodeData {
  kind: NodeKind
  recordId: string
  contentType: CanvasContentType
  title: string
  preview?: string
  hasStudio: boolean
  width?: number
  height?: number
  [key: string]: unknown
}

// ─── Module-level setter so ItemNode can open the Canvas's tile menu ─────────
//
// Same pattern as the canvas drawer (Sweep 29). ItemNode is rendered by
// xyflow and can't easily receive callbacks via props. Canvas registers a
// setter on mount; ItemNode reads it on click.

let tileMenuSetter:
  | ((nd: NodeData, x: number, y: number) => void)
  | null = null

// And a second setter so a double-click can jump straight into the
// expand-and-edit overlay without opening the menu first.
let tileEditorSetter:
  | ((nd: NodeData) => void)
  | null = null

let canvasNodeResizeSetter:
  | ((nodeId: string, x: number, y: number, width: number, height: number) => void)
  | null = null

// ─── Custom node ─────────────────────────────────────────────────────────────

const HANDLE_STYLE: React.CSSProperties = {
  width: 14,
  height: 14,
  background: 'rgb(var(--accent))',
  border: '2px solid rgb(var(--surface))',
  cursor: 'crosshair',
}

function ItemNode({ id, data, selected }: NodeProps) {
  const nd = data as NodeData
  const [hovered, setHovered] = useState(false)
  const [resizing, setResizing] = useState(false)
  const isScrap = nd.contentType === 'scrap'

  // Single-click on the tile body → straight to the editor. This is the
  // most common action; the menu is moved to a small ⋯ button below.
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (tileEditorSetter) tileEditorSetter(nd)
  }
  // Double-click also opens the editor — kept for muscle memory, harmless
  // since single-click already gets you there.
  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (tileEditorSetter) tileEditorSetter(nd)
  }
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (tileMenuSetter) tileMenuSetter(nd, e.clientX, e.clientY)
  }
  // The ⋯ menu button opens the same tile context menu as right-click.
  function handleMenuButton(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (tileMenuSetter) tileMenuSetter(nd, e.clientX, e.clientY)
  }
  function stopResizePropagation(e: React.MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div
      className={`group rounded border border-line px-3 py-2 min-w-[180px] min-h-[60px] hover:border-accent transition-colors overflow-hidden ${isScrap ? 'bg-surface-3' : 'bg-surface'}`}
      style={{ cursor: 'pointer', width: nd.width, height: nd.height }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!resizing) setHovered(false) }}
      data-test={isScrap ? 'canvas-node-scrap' : 'canvas-node'}
      data-node-kind={nd.kind}
      data-node-type={nd.kind}
      data-node-content-type={nd.contentType}
      data-node-record-id={nd.recordId}
    >
      <div onMouseDown={stopResizePropagation} onClick={stopResizePropagation}>
        <NodeResizer
          minWidth={140}
          minHeight={60}
          isVisible={!!selected || hovered || resizing}
          lineStyle={{ borderColor: 'rgb(var(--accent))', borderWidth: 1 }}
          handleStyle={{ width: 8, height: 8, background: 'rgb(var(--accent))', border: '1px solid rgb(var(--surface))', borderRadius: 2 }}
          onResizeStart={() => setResizing(true)}
          onResize={(_, params) => canvasNodeResizeSetter?.(id, params.x, params.y, params.width, params.height)}
          onResizeEnd={(_, params) => {
            canvasNodeResizeSetter?.(id, params.x, params.y, params.width, params.height)
            setResizing(false)
            setHovered(false)
          }}
        />
      </div>
      {/* Top handle — source AND target via loose connectionMode below.
          Bigger and accent-coloured so it's actually clickable. */}
      <Handle type="source" position={Position.Top} style={HANDLE_STYLE} />
      {isScrap ? (
        <div className="flex items-start gap-2 h-full">
          <div className="flex-1 text-sm text-ink-soft leading-relaxed overflow-hidden whitespace-pre-wrap">
            {nd.preview || 'Empty scrap'}
          </div>
          <button
            onClick={handleMenuButton}
            onDoubleClick={(e) => e.stopPropagation()}
            className="text-[15px] leading-none text-ink-faint hover:text-ink px-1 opacity-40 group-hover:opacity-90 hover:!opacity-100 transition-opacity"
            data-test="canvas-node-menu-btn"
            title="More actions"
          >⋯</button>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-ink-faint flex-1 truncate">
              {KIND_LABELS[nd.kind]}
            </span>
            <button
              onClick={handleMenuButton}
              onDoubleClick={(e) => e.stopPropagation()}
              className="text-[15px] leading-none text-ink-faint hover:text-ink px-1 opacity-40 group-hover:opacity-90 hover:!opacity-100 transition-opacity"
              data-test="canvas-node-menu-btn"
              title="More actions"
            >⋯</button>
          </div>
          <div className="text-sm text-ink font-medium truncate">{nd.title || 'Untitled'}</div>
          {nd.preview && (
            <div className="text-xs text-ink-faint italic truncate mt-0.5">{nd.preview}</div>
          )}
          {!nd.hasStudio && (
            <div className="text-[10px] italic text-ink-faint mt-1">(no studio yet)</div>
          )}
        </>
      )}
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
    </div>
  )
}

const nodeTypes = { item: ItemNode }

// ─── Custom edge with delete overlay ─────────────────────────────────────────

function DeletableEdge(props: EdgeProps) {
  const {
    id, sourceX, sourceY, targetX, targetY,
    data,
  } = props
  const ws = useWorkspace()
  const [active, setActive] = useState(false)

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const midX = (sourceX + targetX) / 2
  const midY = (sourceY + targetY) / 2

  const linkId = (data as { linkId?: string })?.linkId ?? id

  return (
    <>
      <path
        d={edgePath}
        stroke="rgb(var(--line))"
        strokeWidth={2}
        fill="none"
        data-test="canvas-edge"
        data-link-id={linkId}
        style={{ cursor: 'pointer' }}
        onClick={() => setActive((v) => !v)}
      />
      {active && (
        <foreignObject
          x={midX - 60}
          y={midY - 16}
          width={120}
          height={32}
          style={{ overflow: 'visible' }}
        >
          <div className="flex justify-center">
            <InlineConfirmButton
              onConfirm={() => { ws.deleteLink(linkId); setActive(false) }}
              label="Delete link"
              confirmLabel="Confirm?"
              className="text-[10px] uppercase tracking-wider bg-surface border border-line rounded px-2 py-1 text-ink-soft hover:text-bad shadow"
              data-test="canvas-edge-delete"
            />
          </div>
        </foreignObject>
      )}
    </>
  )
}

const edgeTypes = { deletable: DeletableEdge }

// ─── Position persistence ─────────────────────────────────────────────────────

const POS_PREFIX = 'verse-studio:canvas:positions:'
const HIDDEN_PREFIX = 'verse-studio:canvas:hidden:'
const LAYERS_PREFIX = 'verse-studio:canvas:layers:'
const MINIMAP_COLLAPSED_KEY = 'verse-studio:canvas:minimap:collapsed'


interface CanvasPosition {
  x: number
  y: number
  width?: number
  height?: number
}

function loadPositions(projectId: string): Record<string, CanvasPosition> {
  try {
    const raw = localStorage.getItem(POS_PREFIX + projectId)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function savePositions(projectId: string, positions: Record<string, CanvasPosition>) {
  try {
    localStorage.setItem(POS_PREFIX + projectId, JSON.stringify(positions))
  } catch {}
}

function saveCanvasNodePosition(projectId: string, nodeId: string, position: CanvasPosition) {
  const positions = loadPositions(projectId)
  positions[nodeId] = position
  savePositions(projectId, positions)
}

function loadHiddenNodes(projectId: string): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_PREFIX + projectId)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

function saveHiddenNodes(projectId: string, hidden: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_PREFIX + projectId, JSON.stringify([...hidden]))
  } catch {}
}

function loadLayerVisibility(projectId: string): LayerVisibility {
  try {
    const raw = localStorage.getItem(LAYERS_PREFIX + projectId)
    if (!raw) return createDefaultLayerVisibility()
    const parsed = JSON.parse(raw) as Partial<LayerVisibility>
    const next = createDefaultLayerVisibility()
    for (const type of CONTENT_TYPE_ORDER) {
      if (typeof parsed[type] === 'boolean') next[type] = parsed[type]
    }
    return next
  } catch {
    return createDefaultLayerVisibility()
  }
}

function saveLayerVisibility(projectId: string, visibility: LayerVisibility) {
  try {
    localStorage.setItem(LAYERS_PREFIX + projectId, JSON.stringify(visibility))
  } catch {}
}

function deriveCanvasContentType(
  ws: ReturnType<typeof useWorkspace>,
  recordId: string,
): CanvasContentType {
  if (ws.notes.some((n) => n.id === recordId)) return 'note'
  if (ws.documents.some((d) => d.id === recordId)) return 'document'
  if (ws.poems.some((p) => p.id === recordId)) return 'poem'
  if (ws.longformDocs.some((d) => d.id === recordId)) return 'longform'
  if (ws.scraps.some((s) => s.id === recordId)) return 'scrap'
  return 'unknown'
}

function hideCanvasNode(projectId: string, nodeId: string) {
  const hidden = loadHiddenNodes(projectId)
  hidden.add(nodeId)
  saveHiddenNodes(projectId, hidden)
  const positions = loadPositions(projectId)
  delete positions[nodeId]
  savePositions(projectId, positions)
}

function gridPosition(index: number): { x: number; y: number } {
  const cols = 6
  const col = index % cols
  const row = Math.floor(index / cols)
  return { x: 40 + col * 220, y: 40 + row * 140 }
}

function canvasNodeSize(kind: NodeKind, pos: CanvasPosition): { width?: number; height?: number } {
  if (kind === 'scrap') {
    return {
      width: pos.width ?? SCRAP_NODE_DEFAULT_WIDTH,
      height: pos.height ?? SCRAP_NODE_DEFAULT_HEIGHT,
    }
  }
  return { width: pos.width, height: pos.height }
}

interface CanvasViewport {
  x: number
  y: number
  zoom: number
}

function readCanvasViewport(root: HTMLElement): CanvasViewport {
  const viewport = root.querySelector('.react-flow__viewport') as HTMLElement | null
  const transform = viewport?.style.transform ?? ''
  const translate = transform.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/)
  const scale = transform.match(/scale\((-?[\d.]+)\)/)
  const matrix = transform.match(/matrix\((-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\)/)

  if (translate || scale) {
    return {
      x: translate ? Number(translate[1]) : 0,
      y: translate ? Number(translate[2]) : 0,
      zoom: scale ? Number(scale[1]) : 1,
    }
  }
  if (matrix) {
    return { x: Number(matrix[5]), y: Number(matrix[6]), zoom: Number(matrix[1]) || 1 }
  }
  return { x: 0, y: 0, zoom: 1 }
}

function clientToFlowPoint(clientX: number, clientY: number, rect: DOMRect, viewport: CanvasViewport): { x: number; y: number } {
  const zoom = viewport.zoom || 1
  return {
    x: (clientX - rect.left - viewport.x) / zoom,
    y: (clientY - rect.top - viewport.y) / zoom,
  }
}

// ─── Bug 1.7 — duplicate-link guard (Sweep 26) ───────────────────────────────
// Links are bidirectional in Atlas's edge rendering, so A→B and B→A would
// produce two visually-overlapping edges with distinct IDs — the kind of
// "ghost" bug that makes deletion feel haunted (delete one, the other
// remains). This helper is the dedup contract Sweep 28's right-click
// connector flow will inherit: any new connection path MUST go through it.
function isAlreadyLinked(
  links: ReadonlyArray<{ sourceType: string; sourceId: string; targetType: string; targetId: string }>,
  srcKind: string, srcId: string,
  tgtKind: string, tgtId: string,
): boolean {
  return links.some((l) =>
    (l.sourceType === srcKind && l.sourceId === srcId &&
     l.targetType === tgtKind && l.targetId === tgtId) ||
    (l.sourceType === tgtKind && l.sourceId === tgtId &&
     l.targetType === srcKind && l.targetId === srcId)
  )
}

// ─── canvas-exchange/1 import ────────────────────────────────────────────────
//
// Additive feature: import a JSON file in the canvas-exchange/1 format and
// reconstruct tiles + edges in the currently selected project. Does NOT
// touch the frozen four (types/db/context/seed); creates records via the
// existing context CRUD methods, persists positions through the same
// localStorage channel Canvas already uses.
//
// Position-timing note: the `[records]` sync effect above re-saves
// localStorage to ONLY positions of currently-in-scope nodes after every
// records-set change. If we wrote all positions to localStorage once and
// then awaited updates serially, the first sync pass would prune
// localStorage down to one position and the rest would be lost. Workaround:
// re-write the full new-position map to localStorage BEFORE each updateXxx
// call so the sync effect reads it just-in-time.

const VALID_TILE_TYPES = new Set<NodeKind>([
  'note', 'document', 'pattern', 'pipeline', 'poem', 'longform',
])

const TILE_TYPE_TO_LINKABLE: Partial<Record<NodeKind, LinkableType>> = {
  document: 'document',
  note:     'note',
  poem:     'poem',
  longform: 'longform',
  build:    'build',
  pattern:  'pattern',
  pipeline: 'pipeline',
}

const EXCHANGE_VERSION = 'canvas-exchange/1'
const EXTRA_STASH_PREFIX = 'verse-studio:exchange:extra:'

interface ExchangeRecord {
  id?: unknown
  tileType?: unknown
  title?: unknown
  body?: unknown
  bodyHtml?: unknown
  extra?: unknown
}

interface ExchangeLink {
  id?: unknown
  sourceId?: unknown
  targetId?: unknown
  label?: unknown
}

interface ExchangePosition {
  id?: unknown
  x?: unknown
  y?: unknown
}

type ImportResult =
  | { ok: true; recordCount: number; linkCount: number }
  | { ok: false; message: string }

async function importCanvasExchange(
  file: File,
  ws: ReturnType<typeof useWorkspace>,
  projectId: string,
): Promise<ImportResult> {
  // 1. Read + parse + validate ----------------------------------------------
  let text: string
  try { text = await file.text() }
  catch { return { ok: false, message: 'Could not read the selected file.' } }

  let parsed: unknown
  try { parsed = JSON.parse(text) }
  catch { return { ok: false, message: 'Selected file is not valid JSON.' } }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, message: 'Import file is not a JSON object.' }
  }
  const data = parsed as { version?: unknown; records?: unknown; links?: unknown; positions?: unknown }
  const LEGACY_VERSION = 'companion/1'
  if (data.version !== EXCHANGE_VERSION && data.version !== LEGACY_VERSION) {
    return {
      ok: false,
      message: `Unsupported format. Got "${String(data.version ?? '(missing)')}".`,
    }
  }
  if (!Array.isArray(data.records) || !Array.isArray(data.links) || !Array.isArray(data.positions)) {
    return { ok: false, message: 'Import file is missing required arrays (records, links, positions).' }
  }

  const records   = data.records   as ExchangeRecord[]
  const links     = data.links     as ExchangeLink[]
  const positions = data.positions as ExchangePosition[]

  // Index positions by plain record id.
  // companion/1 uses "note:<id>" prefixed keys; canvas-exchange/1 uses plain ids.
  // Strip any "<type>:" prefix so both formats resolve correctly.
  const posByOrigId = new Map<string, { x: number; y: number }>()
  for (const p of positions) {
    if (p && typeof p.id === 'string' &&
        typeof p.x === 'number' && typeof p.y === 'number') {
      const plainId = p.id.includes(':') ? p.id.split(':').slice(1).join(':') : p.id
      posByOrigId.set(plainId, { x: p.x, y: p.y })
      posByOrigId.set(p.id,    { x: p.x, y: p.y }) // also keep original for exact matches
    }
  }

  // 2. Create records --------------------------------------------------------
  // ID remap: original-id → { newId, kind }. Used by step 3 (links).
  const remap = new Map<string, { newId: string; kind: NodeKind }>()
  // New positions to write to localStorage, keyed by `${kind}:${newId}`.
  const newPositions: Record<string, CanvasPosition> = {}
  // Pending updates that bring records into project scope. We defer these so
  // we can pre-save positions before each one (see position-timing note).
  const pendingUpdates: Array<() => Promise<void>> = []

  let placedIndex = 0
  for (const rec of records) {
    if (!rec || typeof rec.id !== 'string') continue
    const rawType = typeof rec.tileType === 'string' ? rec.tileType : 'note'
    const kind: NodeKind = VALID_TILE_TYPES.has(rawType as NodeKind)
      ? (rawType as NodeKind)
      : 'note'
    const title = typeof rec.title === 'string' ? rec.title : 'Untitled'
    const body  = typeof rec.body  === 'string' ? rec.body  : ''
    const extra = (rec.extra && typeof rec.extra === 'object') ? rec.extra : null
    const bodyHtml = typeof rec.bodyHtml === 'string' ? rec.bodyHtml : null

    let newId: string
    try {
      switch (kind) {
        case 'document': {
          const d = await ws.createDocument(title)
          newId = d.id
          pendingUpdates.push(() => ws.updateDocument(newId, { body, projectId }))
          break
        }
        case 'note': {
          const n = await ws.createNote(title)
          newId = n.id
          pendingUpdates.push(() => ws.updateNote(newId, { body, projectId }))
          break
        }
        case 'poem': {
          const p = await ws.createPoem(title)
          newId = p.id
          pendingUpdates.push(() => ws.updatePoem(newId, { body, projectId }))
          break
        }
        case 'pattern': {
          // Pattern's create method accepts an init object — use it for body
          // up-front. The follow-up update only needs to set projectId so the
          // tile appears in the canvas's project scope.
          const p = await ws.createPattern({ name: title, body })
          newId = p.id
          pendingUpdates.push(() => ws.updatePattern(newId, { projectId }))
          break
        }
        case 'pipeline': {
          // PromptPipeline has no `body` field; description is the closest
          // user-visible match. The original body is preserved in the extras
          // stash too if it was non-empty (covered below).
          const p = await ws.createPipeline(title)
          newId = p.id
          pendingUpdates.push(() => ws.updatePipeline(newId, { description: body, projectId }))
          break
        }
        case 'longform': {
          // LongformDoc has no body field at all (body lives in sections). We
          // create the doc with title only and stash the body so it isn't
          // silently dropped.
          const d = await ws.createLongformDoc(title)
          newId = d.id
          pendingUpdates.push(() => ws.updateLongformDoc(newId, { projectId }))
          break
        }
        default:
          // Unreachable thanks to the VALID_TILE_TYPES default-to-'note', but
          // narrow the type for completeness.
          continue
      }
    } catch {
      // Skip records we couldn't create; don't abort the whole import.
      continue
    }

    remap.set(rec.id, { newId, kind })

    // Pick a position for this tile. Use the import file's value if present,
    // else stagger a default near the origin so multiple imports don't pile
    // up at exactly the same coords.
    const pos = posByOrigId.get(rec.id) ?? {
      x: 100 + placedIndex * 20,
      y: 100 + placedIndex * 20,
    }
    newPositions[`${kind}:${newId}`] = pos
    placedIndex++

    // Stash overflow data (extras + content that doesn't fit a native field)
    // under verse-studio:exchange:extra:<newId>. Only write a stash record if
    // there's actually something to preserve.
    const stash: Record<string, unknown> = {}
    if (extra) stash.extra = extra
    if (bodyHtml) stash.bodyHtml = bodyHtml
    // Body that has nowhere to go on the native record:
    if (kind === 'longform' && body) stash.body = body
    if (kind === 'pipeline' && body) stash.body = body  // also kept since we mapped to description
    if (Object.keys(stash).length > 0) {
      try {
        localStorage.setItem(EXTRA_STASH_PREFIX + newId, JSON.stringify(stash))
      } catch {
        // Quota / serialization failure — best-effort only.
      }
    }
  }

  // 3. Apply pending updates, re-saving the full new-position map before
  //    each one so the records-sync effect inside Canvas reads it correctly
  //    (it prunes localStorage to in-scope nodes between iterations).
  for (const update of pendingUpdates) {
    try {
      const existing = loadPositions(projectId)
      savePositions(projectId, { ...existing, ...newPositions })
      await update()
    } catch {
      // Ignore individual update failures.
    }
  }
  // Final safety save in case the last sync-effect pruned a position we
  // hadn't yet repaired.
  try {
    const existing = loadPositions(projectId)
    savePositions(projectId, { ...existing, ...newPositions })
  } catch { /* ignore */ }

  // 4. Create edges -----------------------------------------------------------
  let linkCount = 0
  for (const link of links) {
    if (!link || typeof link.sourceId !== 'string' || typeof link.targetId !== 'string') continue
    const src = remap.get(link.sourceId)
    const tgt = remap.get(link.targetId)
    if (!src || !tgt) continue                        // skip if either side failed to import
    if (src.newId === tgt.newId && src.kind === tgt.kind) continue  // no self-links
    if (!TILE_TYPE_TO_LINKABLE[src.kind] || !TILE_TYPE_TO_LINKABLE[tgt.kind]) continue
    try {
      const label = typeof link.label === 'string' ? link.label : undefined
      await ws.createLink({
        sourceId:   src.newId,
        sourceType: TILE_TYPE_TO_LINKABLE[src.kind]!,
        targetId:   tgt.newId,
        targetType: TILE_TYPE_TO_LINKABLE[tgt.kind]!,
        label,
      })
      linkCount++
    } catch {
      // Skip individual link failures.
    }
  }

  return { ok: true, recordCount: remap.size, linkCount }
}

// ─── canvas-exchange/1 export ─────────────────────────────────────────────────
//
// Serialises the current project's tiles + edges to canvas-exchange/1 JSON and
// triggers a file download. Reads positions from the same localStorage channel
// the import uses. Typed tiles get a human-readable body summary; any stashed
// extra data (from a prior Companion import) is passed through untouched.

function bodyForRecord(
  ws: ReturnType<typeof useWorkspace>,
  kind: NodeKind,
  id: string,
): string {
  const r = getRecord(ws, kind, id)
  if (!r) return ''
  switch (kind) {
    case 'document':
    case 'note':
    case 'poem':
    case 'scrap':
      return (r as { body?: string }).body ?? ''
    case 'pattern':
      return (r as { body?: string }).body ?? ''
    case 'pipeline':
      return (r as { description?: string }).description ?? ''
    case 'longform':
      // No body field — surface whatever we stashed on prior import, if any
      try {
        const stash = localStorage.getItem(EXTRA_STASH_PREFIX + id)
        if (stash) {
          const parsed = JSON.parse(stash) as { body?: string }
          return parsed.body ?? ''
        }
      } catch {}
      return ''
    case 'build':
      return ''
    default:
      return ''
  }
}

function exportCanvasExchange(
  records: { kind: NodeKind; id: string; title: string }[],
  ws: ReturnType<typeof useWorkspace>,
  projectId: string,
): void {
  const positions = loadPositions(projectId)
  const nodeIdSet = new Set(records.map((r) => `${r.kind}:${r.id}`))

  // Links where BOTH endpoints are in the current project scope
  const scopedLinks = ws.links.filter((l) => {
    const src = `${l.sourceType}:${l.sourceId}`
    const tgt = `${l.targetType}:${l.targetId}`
    return nodeIdSet.has(src) && nodeIdSet.has(tgt)
  })

  const payload = {
    version:    EXCHANGE_VERSION,
    exportedAt: new Date().toISOString(),
    records: records.map((r) => {
      // Recover any stashed extra/bodyHtml from a prior Companion import
      let extra: Record<string, unknown> = {}
      let bodyHtml: string | null = null
      try {
        const stash = localStorage.getItem(EXTRA_STASH_PREFIX + r.id)
        if (stash) {
          const parsed = JSON.parse(stash) as {
            extra?: Record<string, unknown>
            bodyHtml?: string
          }
          if (parsed.extra) extra = parsed.extra
          if (parsed.bodyHtml) bodyHtml = parsed.bodyHtml
        }
      } catch {}

      return {
        id:       r.id,
        tileType: r.kind,
        title:    r.title,
        body:     bodyForRecord(ws, r.kind, r.id),
        bodyHtml,
        extra,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }),
    links: scopedLinks.map((l) => ({
      id:       l.id,
      sourceId: l.sourceId,
      targetId: l.targetId,
      label:    l.label ?? null,
    })),
    // Strip the `${kind}:` prefix — exchange format uses plain record IDs
    positions: records.map((r) => {
      const pos = positions[`${r.kind}:${r.id}`] ?? { x: 0, y: 0 }
      return { id: r.id, x: Math.round(pos.x), y: Math.round(pos.y) }
    }),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `verse-canvas-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── exportBrief — tileType-aware graph analysis → Markdown ──────────────────
//
// Analyses the tile graph for the current project and generates structured
// Markdown designed to prime an AI conversation. Tiles are categorised as
// hubs (≥3 connections), connected (1–2), or orphans (0). BFS finds isolated
// clusters. tileType labels are included so a Pipeline hub reads differently
// from a Note hub in the brief.

function exportBriefMarkdown(
  records: { kind: NodeKind; id: string; title: string }[],
  ws: ReturnType<typeof useWorkspace>,
  projectId: string,
): string {
  const nodeIdSet = new Set(records.map((r) => `${r.kind}:${r.id}`))
  const scopedLinks = ws.links.filter((l) => {
    const src = `${l.sourceType}:${l.sourceId}`
    const tgt = `${l.targetType}:${l.targetId}`
    return nodeIdSet.has(src) && nodeIdSet.has(tgt)
  })

  // Adjacency map: plain record id → Set of connected plain record ids
  const adj = new Map<string, Set<string>>()
  for (const r of records) adj.set(r.id, new Set())
  for (const l of scopedLinks) {
    adj.get(l.sourceId)?.add(l.targetId)
    adj.get(l.targetId)?.add(l.sourceId)
  }

  // Record lookup by id
  const byId = new Map(records.map((r) => [r.id, r]))

  // Degree map
  const degree = new Map(records.map((r) => [r.id, adj.get(r.id)?.size ?? 0]))

  // BFS connected components
  const visited = new Set<string>()
  const components: string[][] = []
  for (const r of records) {
    if (visited.has(r.id)) continue
    const component: string[] = []
    const queue = [r.id]
    visited.add(r.id)
    while (queue.length) {
      const cur = queue.shift()!
      component.push(cur)
      for (const nb of adj.get(cur) ?? []) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
      }
    }
    components.push(component)
  }

  // Sort records by degree desc
  const sorted = [...records].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
  const hubs      = sorted.filter((r) => (degree.get(r.id) ?? 0) >= 3)
  const connected = sorted.filter((r) => { const d = degree.get(r.id) ?? 0; return d >= 1 && d < 3 })
  const orphans   = sorted.filter((r) => (degree.get(r.id) ?? 0) === 0)

  const kindLabel = (kind: NodeKind) => KIND_LABELS[kind] ?? kind

  const tileRef = (r: { kind: NodeKind; title: string }) =>
    `**${kindLabel(r.kind)}: ${r.title}**`

  const neighbourList = (id: string) => {
    const nbs = [...(adj.get(id) ?? [])].map((nid) => byId.get(nid)).filter(Boolean) as typeof records
    return nbs.map((n) => `  - ${kindLabel(n.kind)}: ${n.title}`).join('\n')
  }

  const lines: string[] = []

  lines.push(`# Canvas Brief — ${ws.projects.find((p) => p.id === projectId)?.name ?? 'Project'}`)
  lines.push('')
  lines.push(`*${records.length} tile${records.length !== 1 ? 's' : ''}, ${scopedLinks.length} connection${scopedLinks.length !== 1 ? 's' : ''}. Connections represent perceived relationships — the author linked these things together intentionally, even if the reasoning isn\'t fully articulated yet. Ask the author to clarify any connections that seem unclear.*`)
  lines.push('')

  if (hubs.length) {
    lines.push('## Central ideas')
    lines.push('')
    for (const r of hubs) {
      lines.push(`### ${tileRef(r)}`)
      lines.push(`Connected to ${degree.get(r.id)} other tiles:`)
      lines.push(neighbourList(r.id))
      lines.push('')
    }
  }

  if (connected.length) {
    lines.push('## Supporting ideas')
    lines.push('')
    for (const r of connected) {
      const nbs = neighbourList(r.id)
      lines.push(`- ${tileRef(r)}${nbs ? `\n${nbs}` : ''}`)
    }
    lines.push('')
  }

  if (orphans.length) {
    lines.push('## Loose ends (unconnected)')
    lines.push('')
    for (const r of orphans) lines.push(`- ${tileRef(r)}`)
    lines.push('')
  }

  if (components.length > 1 && components.filter((c) => c.length > 1).length > 1) {
    lines.push('## Cluster analysis')
    lines.push('')
    lines.push('These tiles form separate clusters with no connections between them:')
    lines.push('')
    let ci = 1
    for (const comp of components) {
      if (comp.length < 2) continue
      const members = comp.map((id) => byId.get(id)).filter(Boolean) as typeof records
      lines.push(`**Cluster ${ci++}:** ${members.map((r) => `${kindLabel(r.kind)}: ${r.title}`).join(' · ')}`)
    }
    lines.push('')
  }

  if (scopedLinks.length) {
    lines.push('## All connections')
    lines.push('')
    for (const l of scopedLinks) {
      const src = byId.get(l.sourceId)
      const tgt = byId.get(l.targetId)
      if (!src || !tgt) continue
      const label = l.label ? ` *(${l.label})*` : ''
      lines.push(`- ${kindLabel(src.kind)}: ${src.title} → ${kindLabel(tgt.kind)}: ${tgt.title}${label}`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('*Ask the author to clarify any connections that seem unclear — the links between ideas are intentional even when not explained.*')

  return lines.join('\n')
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Canvas() {
  const ws = useWorkspace()
  const navigate = useNavigate()
  const setFocus = useSetFocus()
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(() => {
    // Sweep 61 — open on the canonical Nexus project by default. When the
    // stored value is the seed-written Meridian id (or absent) and a canonical
    // project id is known, resolve to Nexus on this first mount too, so a cold
    // load straight onto /canvas does not flash Meridian before the boot-level
    // maybeDefaultCanvasToNexus migration writes the corrected value. A
    // deliberate navigation to any other project is preserved untouched.
    try {
      const last = localStorage.getItem('verse-studio:canvas:lastProject') || undefined
      if (last && last !== 'seed:project:meridian') return last
      const canonical = localStorage.getItem('verse-studio:canvas:canonicalProject') || undefined
      return canonical || last
    } catch { return undefined }
  })

  // Sweep 28: right-click-on-empty-canvas context menu state
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null)
  const [scrapInput, setScrapInput] = useState<{ x: number; y: number } | null>(null)
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>(() => ({ x: 0, y: 0, zoom: 1 }))
  const flowRef = useRef<HTMLDivElement>(null)
  const ctxMenuRef = useRef<HTMLDivElement>(null)
  const closeCtxMenu = useCallback(() => setCtxMenu(null), [])
  const focusCanvasNode = useCallback((nd: NodeData) => {
    const type = nd.kind as LinkableType
    ws.setActiveRecord({ id: nd.recordId, type })
    setFocus({ id: nd.recordId, type, origin: 'canvas' })
  }, [ws, setFocus])

  // Tile menu — opens on left-click on any node, replaces the old auto-navigate.
  const [tileMenu, setTileMenu] = useState<
    | { nd: NodeData; x: number; y: number }
    | null
  >(null)
  useEffect(() => {
    tileMenuSetter = (nd, x, y) => {
      focusCanvasNode(nd)
      // Toggle: if already open for this node, close instead of reopening.
      setTileMenu((prev) =>
        prev && prev.nd.recordId === nd.recordId && prev.nd.kind === nd.kind
          ? null
          : { nd, x, y }
      )
    }
    return () => { tileMenuSetter = null }
  }, [focusCanvasNode])

  // Tile editor — full overlay editor on the canvas itself. Opens on
  // double-click on any node OR via the "Expand & edit" verb in the menu.
  const [tileEditor, setTileEditor] = useState<NodeData | null>(null)
  useEffect(() => {
    tileEditorSetter = (nd) => {
      focusCanvasNode(nd)
      setTileEditor(nd)
    }
    return () => { tileEditorSetter = null }
  }, [focusCanvasNode])
  useEffect(() => {
    if (!tileEditor) return
    function onKey(e: KeyboardEvent) {
      // Esc closes — but only when no other modal-ish thing has focus.
      if (e.key === 'Escape') {
        const active = document.activeElement as HTMLElement | null
        // If the user is mid-edit in the editor, Esc shouldn't kick them out
        // unless they explicitly hit it twice. For now, always close.
        // (If you blur first, Esc closes; if you're typing, Esc closes too.)
        setTileEditor(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tileEditor])
  useEffect(() => {
    if (!ctxMenu) return
    function onDown(e: MouseEvent) {
      const node = ctxMenuRef.current
      if (node && e.target instanceof Node && !node.contains(e.target)) closeCtxMenu()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [ctxMenu, closeCtxMenu])
  // Dismiss the tile menu on any unrelated mousedown / Escape. The ⋯ button
  // is excluded so the click that fires after mousedown can run our toggle
  // logic instead of finding an already-cleared state and re-opening.
  useEffect(() => {
    if (!tileMenu) return
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest('[data-test="canvas-context-menu"]')) return
      if (t.closest('[data-test="canvas-node-menu-btn"]')) return
      setTileMenu(null)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setTileMenu(null) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [tileMenu])

  // Persist canvas project selection
  useEffect(() => {
    try {
      if (selectedProjectId) localStorage.setItem('verse-studio:canvas:lastProject', selectedProjectId)
      else localStorage.removeItem('verse-studio:canvas:lastProject')
    } catch {}
  }, [selectedProjectId])

  // Self-correct a stale `selectedProjectId` from localStorage that points
  // at a project no longer in the workspace (deleted, never imported, etc.).
  // Pattern-matches Projects.tsx — without this guard, Canvas renders an
  // empty graph silently while still considering itself "in a project".
  useEffect(() => {
    if (selectedProjectId && !ws.projects.find((p) => p.id === selectedProjectId)) {
      setSelectedProjectId(undefined)
    }
  }, [selectedProjectId, ws.projects])

  const selectedProject = ws.projects.find((p) => p.id === selectedProjectId)

  useEffect(() => {
    if (!selectedProject || tileEditor || tileMenu) return
    ws.setActiveRecord({ id: selectedProject.id, type: 'project' })
    setFocus({ id: selectedProject.id, type: 'project', origin: 'canvas' })
  }, [selectedProject?.id, tileEditor, tileMenu, ws, setFocus])

  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(() =>
    selectedProjectId ? loadLayerVisibility(selectedProjectId) : createDefaultLayerVisibility()
  )

  useEffect(() => {
    setLayerVisibility(selectedProjectId ? loadLayerVisibility(selectedProjectId) : createDefaultLayerVisibility())
  }, [selectedProjectId])

  const updateLayerVisibility = useCallback((
    next: LayerVisibility | ((current: LayerVisibility) => LayerVisibility),
  ) => {
    setLayerVisibility((current) => {
      const resolved = typeof next === 'function' ? next(current) : next
      if (selectedProjectId) saveLayerVisibility(selectedProjectId, resolved)
      return resolved
    })
  }, [selectedProjectId])

  // Build record list for the selected project
  const records = useMemo(() => {
    if (!selectedProjectId) return []
    const out: { kind: NodeKind; id: string; title: string; preview?: string }[] = []
    for (const d of ws.documents)
      if (d.projectId === selectedProjectId && d.deletedAt === undefined)
        out.push({ kind: 'document', id: d.id, title: d.title, preview: d.body?.slice(0, 60) })
    for (const n of ws.notes)  // Sweep 27
      if (n.projectId === selectedProjectId && n.deletedAt === undefined)
        out.push({ kind: 'note', id: n.id, title: n.title, preview: n.body?.slice(0, 60) })
    for (const p of ws.poems)
      if (p.projectId === selectedProjectId && p.deletedAt === undefined)
        out.push({ kind: 'poem', id: p.id, title: p.title, preview: p.body?.slice(0, 60) })
    for (const d of ws.longformDocs)
      if (d.projectId === selectedProjectId && d.deletedAt === undefined)
        out.push({ kind: 'longform', id: d.id, title: d.title })
    for (const b of ws.builds)
      if (b.projectId === selectedProjectId && b.deletedAt === undefined)
        out.push({ kind: 'build', id: b.id, title: b.name })
    for (const p of ws.patterns)
      if (p.projectId === selectedProjectId && p.deletedAt === undefined)
        out.push({ kind: 'pattern', id: p.id, title: p.name })
    for (const p of ws.pipelines)
      if (p.projectId === selectedProjectId && p.deletedAt === undefined)
        out.push({ kind: 'pipeline', id: p.id, title: p.name })
    for (const s of ws.scraps)
      if (s.projectId === selectedProjectId && s.deletedAt === undefined)
        out.push({ kind: 'scrap', id: s.id, title: '', preview: s.body?.slice(0, 120) })
    return out
  }, [selectedProjectId, ws.documents, ws.notes, ws.poems, ws.longformDocs, ws.builds, ws.patterns, ws.pipelines, ws.scraps])

  // Build xyflow nodes
  const initialNodes = useMemo(() => {
    if (!selectedProjectId) return []
    const stored = loadPositions(selectedProjectId)
    const hidden = loadHiddenNodes(selectedProjectId)
    // Bug 1.4 (Sweep 26): gridIdx starts at 0, not at the historical-count
    // of stored positions. Combined with `stored[nodeId] ?? gridPosition(...)`,
    // only positionless nodes consume grid slots — they pack from the top-
    // left instead of being thrown to row N where N=churn-count. Without
    // this, a project that has churned through 30 records placed its next
    // attach at row 5+, often offscreen.
    let gridIdx = 0
    return records.flatMap((r) => {
      const nodeId = `${r.kind}:${r.id}`
      if (hidden.has(nodeId)) return []
      const pos = stored[nodeId] ?? gridPosition(gridIdx++)
      const size = canvasNodeSize(r.kind, pos)
      return [{
        id: nodeId,
        type: 'item',
        position: pos,
        data: {
          kind: r.kind,
          recordId: r.id,
          contentType: deriveCanvasContentType(ws, r.id),
          title: r.title,
          preview: r.preview,
          hasStudio: !NO_STUDIO.has(r.kind),
          width: size.width,
          height: size.height,
        } as NodeData,
        style: { width: size.width, height: size.height },
      }]
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, records.length])

  // Build xyflow edges from ws.links
  const nodeIdSet = useMemo(
    () => new Set(records.map((r) => `${r.kind}:${r.id}`)),
    [records]
  )

  const initialEdges = useMemo(() => {
    if (!selectedProjectId) return []
    return ws.links
      .filter((l) => {
        const src = `${l.sourceType}:${l.sourceId}`
        const tgt = `${l.targetType}:${l.targetId}`
        return nodeIdSet.has(src) && nodeIdSet.has(tgt)
      })
      .map((l) => ({
        id: l.id,
        source: `${l.sourceType}:${l.sourceId}`,
        target: `${l.targetType}:${l.targetId}`,
        type: 'deletable',
        data: { linkId: l.id },
      }))
  }, [selectedProjectId, ws.links, nodeIdSet])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    canvasNodeResizeSetter = (nodeId, x, y, width, height) => {
      setNodes((prev) => prev.map((n) => {
        if (n.id !== nodeId) return n
        const nd = n.data as NodeData
        return {
          ...n,
          position: { x, y },
          data: { ...nd, width, height },
          style: { ...(n.style ?? {}), width, height },
        }
      }))
      if (selectedProjectId) {
        const positions = loadPositions(selectedProjectId)
        positions[nodeId] = { x, y, width, height }
        savePositions(selectedProjectId, positions)
      }
    }
    return () => { canvasNodeResizeSetter = null }
  }, [selectedProjectId, setNodes])

  // Re-init when project changes
  const prevProjectId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (selectedProjectId !== prevProjectId.current) {
      prevProjectId.current = selectedProjectId
      setNodes(initialNodes)
      setEdges(initialEdges)
      // Persist initial positions immediately so localStorage is populated
      if (selectedProjectId && initialNodes.length > 0) {
        const posMap: Record<string, CanvasPosition> = {}
        for (const n of initialNodes) {
          const nd = n.data as NodeData
          posMap[n.id] = { ...n.position, width: nd.width, height: nd.height }
        }
        savePositions(selectedProjectId, posMap)
      }
    }
  }, [selectedProjectId, initialNodes, initialEdges, setNodes, setEdges])

  // Sync edges when scoped edge set changes (Bug 1.5, Sweep 26).
  // Pre-26 this depended on the global `ws.links`, so any link created or
  // deleted in any project re-rendered the canvas. `initialEdges` is
  // already memoized on [selectedProjectId, ws.links, nodeIdSet], so this
  // dep transitively re-evaluates only when project-scoped edges change.
  useEffect(() => {
    if (selectedProjectId !== prevProjectId.current) return
    setEdges(initialEdges)
  }, [initialEdges, selectedProjectId, setEdges])

  // Sync nodes when records change (item attached/detached)
  useEffect(() => {
    if (selectedProjectId === prevProjectId.current) {
      setNodes((prev) => {
        const stored = loadPositions(selectedProjectId ?? '')
        const hidden = selectedProjectId ? loadHiddenNodes(selectedProjectId) : new Set<string>()
        // Bug 1.4 (Sweep 26): gridIdx starts at 0 and only increments when a
        // node is actually placed via gridPosition (no stored entry).
        // Previously `gridIdx = prev.length` placed each new node at row N
        // where N = total node count, which compounds with churn — every
        // attach progressively further offscreen.
        let gridIdx = 0
        const existingIds = new Set(prev.map((n) => n.id))
        const newNodes = [...prev]
        for (const r of records) {
          const nodeId = `${r.kind}:${r.id}`
          if (hidden.has(nodeId)) continue
          if (!existingIds.has(nodeId)) {
            const pos = stored[nodeId] ?? gridPosition(gridIdx++)
            newNodes.push({
              id: nodeId,
              type: 'item',
              position: pos,
              data: {
                kind: r.kind,
                recordId: r.id,
                contentType: deriveCanvasContentType(ws, r.id),
                title: r.title,
                preview: r.preview,
                hasStudio: !NO_STUDIO.has(r.kind),
                width: pos.width,
                height: pos.height,
              } as NodeData,
              style: { width: pos.width, height: pos.height },
            })
          }
        }
        // Remove nodes no longer in project
        const recordIds = new Set(records.map((r) => `${r.kind}:${r.id}`))
        const finalNodes = newNodes.filter((n) => recordIds.has(n.id) && !hidden.has(n.id))
        // Bug 1.3 (Sweep 26): prune localStorage writes after filter.
        // Detached nodes don't generate position-change events (handleNodes-
        // Change only fires on `position` changes, not `remove`), so dead
        // entries used to accumulate forever in the localStorage map.
        // Writing the post-filter set fully replaces the stored object,
        // which removes orphan keys naturally.
        if (selectedProjectId) {
          const pruned: Record<string, CanvasPosition> = {}
          for (const n of finalNodes) {
            const nd = n.data as NodeData
            pruned[n.id] = { ...n.position, width: nd.width, height: nd.height }
          }
          savePositions(selectedProjectId, pruned)
        }
        return finalNodes
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records])

  // Bug 1.2 (Sweep 26): live-derive node `data` from current records.
  //
  // Architectural note for Sweep 28: this effect establishes the contract
  // that node `data` is a live derivation of the source record, while
  // `position` is persisted explicitly via handleNodesChange. The two
  // concerns are separate and that separation is load-bearing — without
  // it, every Canvas-side feature inherits a snapshot bug where renames
  // in any studio fail to propagate to the canvas card until the project
  // is switched.
  //
  // The map returns identical references when nothing changed so xyflow's
  // render economy is preserved. Position is intentionally not touched.
  useEffect(() => {
    if (selectedProjectId !== prevProjectId.current) return
    setNodes((prev) => prev.map((n) => {
      const r = records.find((rec) => `${rec.kind}:${rec.id}` === n.id)
      if (!r) return n
      const nd = n.data as NodeData
      const contentType = deriveCanvasContentType(ws, nd.recordId)
      if (r.title === nd.title && r.preview === nd.preview && contentType === nd.contentType) return n
      return { ...n, data: { ...nd, contentType, title: r.title, preview: r.preview } }
    }))
  }, [records, selectedProjectId, setNodes, ws])

  // Debounced position persistence
  const savePosTimer = useRef<number | null>(null)
  const handleNodesChange = useCallback((changes: NodeChange<any>[]) => {
    onNodesChange(changes)
    const hasPosition = changes.some((c) => c.type === 'position')
    if (hasPosition && selectedProjectId) {
      if (savePosTimer.current) clearTimeout(savePosTimer.current)
      savePosTimer.current = window.setTimeout(() => {
        setNodes((current) => {
          const posMap: Record<string, CanvasPosition> = {}
          for (const n of current) {
            const nd = n.data as NodeData
            posMap[n.id] = { ...n.position, width: nd.width, height: nd.height }
          }
          savePositions(selectedProjectId, posMap)
          return current
        })
      }, 200)
    }
  }, [onNodesChange, selectedProjectId, setNodes])

  // Edge creation via onConnect
  const handleConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return
    const srcColon = connection.source.indexOf(':')
    const tgtColon = connection.target.indexOf(':')
    if (srcColon < 0 || tgtColon < 0) return
    const srcKind = connection.source.slice(0, srcColon)
    const srcId   = connection.source.slice(srcColon + 1)
    const tgtKind = connection.target.slice(0, tgtColon)
    const tgtId   = connection.target.slice(tgtColon + 1)
    if (srcId === tgtId && srcKind === tgtKind) return // reject self-links
    // Bug 1.7 (Sweep 26): reject duplicate AND reverse-direction-duplicate
    // links via the shared dedup contract.
    if (isAlreadyLinked(ws.links, srcKind, srcId, tgtKind, tgtId)) return
    await ws.createLink({
      sourceId: srcId,
      sourceType: srcKind as LinkableType,
      targetId: tgtId,
      targetType: tgtKind as LinkableType,
    })
    // Edge will appear via ws.links sync effect
  }, [ws])

  // Sweep 28: right-click empty canvas → create Note in project (legacy entry)
  const handlePaneContextMenu = useCallback((e: MouseEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    const rect = flowRef.current?.getBoundingClientRect()
    if (!rect || !flowRef.current) return
    const viewport = readCanvasViewport(flowRef.current)
    const flowPoint = clientToFlowPoint(e.clientX, e.clientY, rect, viewport)
    setCanvasViewport(viewport)
    setScrapInput(null)
    setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, flowX: flowPoint.x, flowY: flowPoint.y })
  }, [selectedProjectId])

  // Create a note in the current project AND open the tile editor for it
  // immediately — stays on the canvas. Used by the right-click menu, the
  // pane double-click, and any future entry points. If a target position is
  // known, save it before the project-scoping update makes the note visible
  // to the records sync effect.
  const createNoteOnCanvas = useCallback(async (targetPosition?: { x: number; y: number }) => {
    if (!selectedProjectId) return
    const note = await ws.createNote('Untitled')
    const nodeId = `note:${note.id}`
    if (targetPosition) {
      saveCanvasNodePosition(selectedProjectId, nodeId, {
        x: targetPosition.x,
        y: targetPosition.y,
      })
    }
    await ws.updateNote(note.id, { projectId: selectedProjectId })
    if (targetPosition) {
      setNodes((current) => {
        const existing = current.find((n) => n.id === nodeId)
        if (existing) {
          return current.map((n) => (
            n.id === nodeId
              ? { ...n, position: { x: targetPosition.x, y: targetPosition.y } }
              : n
          ))
        }
        return [
          ...current,
          {
            id: nodeId,
            type: 'item',
            position: { x: targetPosition.x, y: targetPosition.y },
            data: {
              kind: 'note',
              recordId: note.id,
              contentType: 'note',
              title: 'Untitled',
              hasStudio: true,
            } as NodeData,
            style: { width: undefined, height: undefined },
          },
        ]
      })
    }
    setTileEditor({
      kind: 'note',
      recordId: note.id,
      contentType: 'note',
      title: 'Untitled',
      hasStudio: true,
    })
  }, [selectedProjectId, setNodes, ws])

  const handleCreateNoteHere = useCallback(() => {
    const targetPosition = ctxMenu
      ? { x: ctxMenu.flowX, y: ctxMenu.flowY }
      : undefined
    closeCtxMenu()
    createNoteOnCanvas(targetPosition)
  }, [closeCtxMenu, createNoteOnCanvas, ctxMenu])

  const handleAddScrapHere = useCallback(() => {
    if (!ctxMenu) return
    setScrapInput({ x: ctxMenu.flowX, y: ctxMenu.flowY })
    closeCtxMenu()
  }, [closeCtxMenu, ctxMenu])

  const handleSaveScrapInput = useCallback(async (body: string, position: { x: number; y: number }) => {
    const trimmed = body.trim()
    setScrapInput(null)
    if (!selectedProjectId || !trimmed) return

    const scrap = await ws.createScrap({ body: trimmed, projectId: selectedProjectId })
    const nodeId = `scrap:${scrap.id}`
    const savedPosition: CanvasPosition = {
      x: position.x,
      y: position.y,
      width: SCRAP_NODE_DEFAULT_WIDTH,
      height: SCRAP_NODE_DEFAULT_HEIGHT,
    }
    saveCanvasNodePosition(selectedProjectId, nodeId, savedPosition)

    setNodes((current) => {
      if (current.some((n) => n.id === nodeId)) {
        return current.map((n) => (
          n.id === nodeId
            ? {
                ...n,
                position: { x: savedPosition.x, y: savedPosition.y },
                data: {
                  ...(n.data as NodeData),
                  width: savedPosition.width,
                  height: savedPosition.height,
                } as NodeData,
                style: { ...(n.style ?? {}), width: savedPosition.width, height: savedPosition.height },
              }
            : n
        ))
      }
      return [
        ...current,
        {
          id: nodeId,
          type: 'item',
          position: { x: savedPosition.x, y: savedPosition.y },
          data: {
            kind: 'scrap',
            recordId: scrap.id,
            contentType: 'scrap',
            title: '',
            preview: trimmed.slice(0, 120),
            hasStudio: true,
            width: SCRAP_NODE_DEFAULT_WIDTH,
            height: SCRAP_NODE_DEFAULT_HEIGHT,
          } as NodeData,
          style: { width: SCRAP_NODE_DEFAULT_WIDTH, height: SCRAP_NODE_DEFAULT_HEIGHT },
        },
      ]
    })
  }, [selectedProjectId, setNodes, ws])

  // Double-click on the empty pane → create + open. We detect double-click
  // ourselves because xyflow's onPaneClick fires once per click (no native
  // double variant) and we want to keep deselect-on-single-click intact.
  const lastPaneClickRef = useRef<number>(0)
  const handlePaneClick = useCallback(() => {
    const now = Date.now()
    if (now - lastPaneClickRef.current < 320) {
      const rect = flowRef.current?.getBoundingClientRect()
      const zoom = canvasViewport.zoom || 1
      const center = rect
        ? {
            x: -canvasViewport.x / zoom + rect.width / 2 / zoom,
            y: -canvasViewport.y / zoom + rect.height / 2 / zoom,
          }
        : undefined
      createNoteOnCanvas(center)
      lastPaneClickRef.current = 0
    } else {
      lastPaneClickRef.current = now
    }
  }, [canvasViewport, createNoteOnCanvas])

  // ─── canvas-exchange/1 import: button + hidden file input + status ──────────
  const importInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<
    | { kind: 'ok' | 'err'; message: string }
    | null
  >(null)
  const [importing, setImporting] = useState(false)

  // Auto-clear status after 5s.
  useEffect(() => {
    if (!importStatus) return
    const t = window.setTimeout(() => setImportStatus(null), 5000)
    return () => window.clearTimeout(t)
  }, [importStatus])

  const handleImportClick = useCallback(() => {
    if (!selectedProjectId) {
      setImportStatus({ kind: 'err', message: 'Select a project first.' })
      return
    }
    importInputRef.current?.click()
  }, [selectedProjectId])

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset value so the same file can be re-imported later.
    e.target.value = ''
    if (!file) return
    setImporting(true)
    setImportStatus(null)
    try {
      // Always create a fresh project for the import so it doesn't land in
      // whatever the user had open. Project name comes from the filename.
      const projectName = file.name.replace(/\.json$/i, '').replace(/[-_]+/g, ' ').trim() || 'Imported canvas'
      const newProject  = await ws.createProject(projectName)
      setSelectedProjectId(newProject.id)
      const result = await importCanvasExchange(file, ws, newProject.id)
      if (!result.ok) {
        setImportStatus({ kind: 'err', message: result.message })
      } else {
        const { recordCount, linkCount } = result
        setImportStatus({
          kind: 'ok',
          message: `Imported ${recordCount} tile${recordCount === 1 ? '' : 's'} and ${linkCount} connection${linkCount === 1 ? '' : 's'} into "${projectName}"`,
        })
      }
    } catch (err) {
      setImportStatus({
        kind: 'err',
        message: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      })
    } finally {
      setImporting(false)
    }
  }, [ws, setSelectedProjectId])

  // ─── Export ────────────────────────────────────────────────────────────────
  const handleExportClick = useCallback(() => {
    if (!selectedProjectId) {
      setImportStatus({ kind: 'err', message: 'Select a project first.' })
      return
    }
    exportCanvasExchange(records, ws, selectedProjectId)
  }, [selectedProjectId, records, ws])

  // ─── Brief ─────────────────────────────────────────────────────────────────
  const [briefStatus, setBriefStatus] = useState<
    | { kind: 'ok' | 'err'; message: string }
    | null
  >(null)

  useEffect(() => {
    if (!briefStatus) return
    const t = window.setTimeout(() => setBriefStatus(null), 5000)
    return () => window.clearTimeout(t)
  }, [briefStatus])

  const handleBriefClick = useCallback(() => {
    if (!selectedProjectId) {
      setBriefStatus({ kind: 'err', message: 'Select a project first.' })
      return
    }
    if (records.length === 0) {
      setBriefStatus({ kind: 'err', message: 'No tiles to brief.' })
      return
    }
    const md = exportBriefMarkdown(records, ws, selectedProjectId)
    navigator.clipboard.writeText(md).then(
      () => setBriefStatus({ kind: 'ok', message: `Brief copied — ${records.length} tiles` }),
      () => setBriefStatus({ kind: 'err', message: 'Clipboard write failed.' }),
    )
  }, [selectedProjectId, records, ws])

  const handleDeleteCanvasNode = useCallback((nd: NodeData) => {
    if (!selectedProjectId) return
    const nodeId = `${nd.kind}:${nd.recordId}`
    hideCanvasNode(selectedProjectId, nodeId)
    setNodes((current) => current.filter((n) => n.id !== nodeId))
    setTileMenu(null)
    setTileEditor((current) => {
      if (current && current.kind === nd.kind && current.recordId === nd.recordId) return null
      return current
    })
  }, [selectedProjectId, setNodes])

  const nodesWithContentType = useMemo(() => {
    // Hidden-placement nodes are already excluded before this point. Content
    // type is deliberately re-derived from live workspace arrays instead of
    // persisted into the canvas position map.
    return nodes.map((n) => {
      const nd = n.data as NodeData
      const contentType = deriveCanvasContentType(ws, nd.recordId)
      if (nd.contentType === contentType) return n
      return { ...n, data: { ...nd, contentType } }
    })
  }, [nodes, ws])

  const layerCounts = useMemo<LayerCounts>(() => {
    const counts = createEmptyLayerCounts()
    for (const n of nodesWithContentType) {
      const nd = n.data as NodeData
      counts[nd.contentType] += 1
    }
    return counts
  }, [nodesWithContentType])

  const visibleNodes = useMemo(
    () => nodesWithContentType.filter((n) => layerVisibility[(n.data as NodeData).contentType]),
    [layerVisibility, nodesWithContentType]
  )

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes])
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)),
    [edges, visibleNodeIds]
  )

  return (
    <div className="h-full flex flex-col" data-test="route-stub-canvas" onClick={() => ctxMenu && setCtxMenu(null)}>
      {/* Top bar */}
      <div className="border-b border-line bg-surface-2 px-4 flex items-center gap-3" style={{ height: 48, flexShrink: 0 }}>
        <h1 className="text-sm text-ink-faint font-medium">Canvas</h1>
        <div data-test="canvas-project-picker">
          <ProjectPicker
            value={selectedProjectId}
            onChange={(id) => setSelectedProjectId(id)}
          />
        </div>
        {selectedProject && (
          <span className="text-xs text-ink-faint">
            {records.length} item{records.length !== 1 ? 's' : ''}
          </span>
        )}
        <span className="flex-1" />
        {briefStatus && (
          <span
            className={`text-xs ${briefStatus.kind === 'err' ? 'text-bad' : 'text-accent'}`}
            data-test="canvas-brief-status"
          >
            {briefStatus.message}
          </span>
        )}
        {importStatus && (
          <span
            className={`text-xs ${importStatus.kind === 'err' ? 'text-bad' : 'text-accent'}`}
            data-test="canvas-import-status"
            data-status-kind={importStatus.kind}
          >
            {importStatus.message}
          </span>
        )}
        <button
          onClick={handleBriefClick}
          className="text-xs text-ink-faint hover:text-ink px-2 py-1"
          data-test="canvas-brief-btn"
          title="Copy a structured AI-ready brief of this canvas to clipboard"
        >✦ Brief</button>
        <button
          onClick={handleExportClick}
          className="text-xs text-ink-faint hover:text-ink px-2 py-1"
          data-test="canvas-export-btn"
          title="Export this canvas as canvas-exchange/1 JSON"
        >↓ Export</button>
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="text-xs text-ink-faint hover:text-ink px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          data-test="canvas-import-btn"
          title={selectedProjectId
            ? 'Import a canvas-exchange/1 JSON file into this project'
            : 'Select a project first to import'}
        >{importing ? '… importing' : '↑ Import'}</button>
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          className="hidden"
          data-test="canvas-import-input"
        />
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative">
        {!selectedProjectId ? (
          <div
            className="h-full flex items-center justify-center text-ink-faint text-sm"
            data-test="canvas-empty"
          >
            Select a project to see its items as a graph.
          </div>
        ) : (
          <div ref={flowRef} className="relative w-full h-full">
            <ReactFlow
              nodes={visibleNodes}
              edges={visibleEdges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onPaneClick={handlePaneClick}
              onPaneContextMenu={handlePaneContextMenu}
              onMove={(_, viewport) => setCanvasViewport(viewport)}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              style={{ width: '100%', height: '100%' }}
              proOptions={{ hideAttribution: true }}
            >
              <FitViewOnMount projectId={selectedProjectId} />
              <Background />
              <CanvasZoomPanel />
              <CanvasMiniMapPanel />
            </ReactFlow>
            <LayerPanel
              visibility={layerVisibility}
              counts={layerCounts}
              onVisibilityChange={updateLayerVisibility}
            />
            {/* Right-click context menu */}
            {ctxMenu && (
              <div
                ref={ctxMenuRef}
                className="absolute z-50 bg-surface border border-line rounded shadow-md py-1 min-w-[160px]"
                style={{ left: ctxMenu.x, top: ctxMenu.y }}
                onClick={(e) => e.stopPropagation()}
                data-test="canvas-context-menu"
              >
                <button
                  onClick={handleCreateNoteHere}
                  className="w-full text-left px-3 py-1.5 text-sm text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
                  data-test="canvas-ctx-create-note"
                >
                  + Create note in project
                </button>
                <button
                  onClick={handleAddScrapHere}
                  className="w-full text-left px-3 py-1.5 text-sm text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors border-t border-line"
                  data-test="canvas-context-add-scrap"
                >
                  Add scrap here
                </button>
              </div>
            )}
            {scrapInput && (
              <CanvasScrapInputCard
                position={scrapInput}
                viewport={canvasViewport}
                onSave={handleSaveScrapInput}
                onCancel={() => setScrapInput(null)}
              />
            )}
          </div>
        )}

        {tileMenu && (
          <CanvasTileMenu
            nd={tileMenu.nd}
            x={tileMenu.x}
            y={tileMenu.y}
            onExpand={() => { setTileEditor(tileMenu.nd); setTileMenu(null) }}
            onDelete={() => handleDeleteCanvasNode(tileMenu.nd)}
            onClose={() => setTileMenu(null)}
            navigate={navigate}
          />
        )}
        {tileEditor && (
          <CanvasTileEditor
            nd={tileEditor}
            onClose={() => setTileEditor(null)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Inline scrap input ─────────────────────────────────────────────────────

// ─── FitViewOnMount ──────────────────────────────────────────────────────────
// Rendered as a child of <ReactFlow> so it has access to the ReactFlow context.
// Calls fitView once when the project changes, not on every edge/node update.
// This replaces the `fitView` boolean prop which re-triggered on every render.
function FitViewOnMount({ projectId }: { projectId: string | undefined }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    if (!projectId) return
    const t = window.setTimeout(() => { fitView({ padding: 0.2 }) }, 50)
    return () => window.clearTimeout(t)
  }, [projectId, fitView])
  return null
}

function CanvasZoomPanel() {
  const { zoomIn, zoomOut } = useReactFlow()

  return (
    <Panel position="bottom-center" className="pointer-events-auto">
      <div
        className="flex items-center overflow-hidden rounded border border-line bg-surface-2 text-ink shadow-lg"
        data-test="canvas-zoom-controls"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomOut({ duration: 180 })}
          className="h-8 w-9 border-r border-line text-base leading-none hover:bg-surface-3 transition-colors"
          data-test="canvas-zoom-out"
          aria-label="Zoom out"
        >−</button>
        <button
          type="button"
          onClick={() => zoomIn({ duration: 180 })}
          className="h-8 w-9 text-base leading-none hover:bg-surface-3 transition-colors"
          data-test="canvas-zoom-in"
          aria-label="Zoom in"
        >+</button>
      </div>
    </Panel>
  )
}

function CanvasMiniMapPanel() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(MINIMAP_COLLAPSED_KEY)
      return raw === null ? true : raw === 'true'
    } catch { return true }
  })

  useEffect(() => {
    try { localStorage.setItem(MINIMAP_COLLAPSED_KEY, collapsed ? 'true' : 'false') } catch {}
  }, [collapsed])

  return (
    <Panel position="bottom-right" className="pointer-events-auto">
      <div
        className="rounded border border-line bg-surface-2 text-ink shadow-lg overflow-hidden"
        data-test="canvas-minimap-panel"
        data-collapsed={collapsed ? 'true' : 'false'}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="px-3 py-2 text-xs font-medium text-ink hover:bg-surface transition-colors"
            data-test="canvas-minimap-toggle"
          >
            Map
          </button>
        ) : (
          <div className="w-48 p-2 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="text-xs font-medium text-ink hover:text-accent transition-colors"
                data-test="canvas-minimap-toggle"
              >
                Map
              </button>
              <span className="flex-1" />
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">Minimap</span>
            </div>
            <MiniMap
              nodeColor="rgb(var(--accent))"
              nodeStrokeColor="rgb(var(--line))"
              nodeStrokeWidth={1}
              maskColor="rgba(0,0,0,0.05)"
              pannable
              zoomable
              className="!static !m-0 !w-full !h-28 rounded border border-line overflow-hidden"
              style={{ background: 'rgb(var(--surface-2))' }}
            />
          </div>
        )}
      </div>
    </Panel>
  )
}

function CanvasScrapInputCard({
  position, viewport, onSave, onCancel,
}: {
  position: { x: number; y: number }
  viewport: CanvasViewport
  onSave: (body: string, position: { x: number; y: number }) => Promise<void>
  onCancel: () => void
}) {
  const [body, setBody] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const node = cardRef.current
      if (node && e.target instanceof Node && !node.contains(e.target)) onCancel()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onCancel])

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
      return
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onSave(body, position)
    }
  }

  const zoom = viewport.zoom || 1
  const left = viewport.x + position.x * zoom
  const top = viewport.y + position.y * zoom

  return (
    <div
      ref={cardRef}
      className="absolute z-50 w-56 rounded border border-line bg-surface-2 p-2 text-ink shadow-lg"
      style={{ left, top, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      onMouseDown={(e) => e.stopPropagation()}
      data-test="canvas-scrap-input"
    >
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Jot a scrap…"
        className="h-24 w-full resize-none rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint"
        data-test="canvas-scrap-textarea"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-ink-faint">Esc to cancel</span>
        <button
          onClick={() => onSave(body, position)}
          disabled={!body.trim()}
          className="text-xs px-2.5 py-1 rounded border border-line bg-surface hover:bg-surface-3 text-ink disabled:opacity-40"
          data-test="canvas-scrap-save"
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ─── Tile menu ───────────────────────────────────────────────────────────────
//
// Pops up on left-click on any canvas tile. Replaces the previous behaviour
// that auto-navigated into the underlying record's studio. Verbs depend on
// the tile's kind: every kind gets "Open in <studio>", and pattern/pipeline
// kinds also get "Open playground" (routed to Prompts where the playground
// surface lives — implemented via a custom event in a follow-up round).

const STUDIO_ROUTE: Record<NodeKind, string> = {
  document: '/writing',
  note:     '/notes',
  poem:     '/poetry',
  longform: '/longform',
  build:    '/appdesign',
  pattern:  '/library',
  pipeline: '/prompts',
  scrap:    '/scraps',
}
const STUDIO_LABEL: Record<NodeKind, string> = {
  document: 'Open in Writing',
  note:     'Open in Notes',
  poem:     'Open in Poetry',
  longform: 'Open in Longform',
  build:    'Open in App-Design',
  pattern:  'Open in Library',
  pipeline: 'Open in Prompts',
  scrap:    'Open in Scraps',
}

function CanvasTileMenu({
  nd, x, y, onExpand, onDelete, onClose, navigate,
}: {
  nd: NodeData
  x: number
  y: number
  onExpand: () => void
  onDelete: () => void
  onClose: () => void
  navigate: (to: string) => void
}) {
  const W = 220
  const H = 170
  const left = (x + W > window.innerWidth)  ? window.innerWidth - W - 8  : x
  const top  = (y + H > window.innerHeight) ? window.innerHeight - H - 8 : y
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const node = menuRef.current
      if (node && e.target instanceof Node && !node.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  function openStudio() {
    const kind = nd.kind
    // jumpToSelection works for the five record kinds with their own studios.
    onClose()
    if (kind === 'scrap') {
      navigate(STUDIO_ROUTE[kind])
      return
    }
    if (kind !== 'pattern' && kind !== 'pipeline') {
      jumpToSelection({ kind, id: nd.recordId })
    }
    navigate(STUDIO_ROUTE[kind])
  }
  function openPlayground() {
    // Patterns own real playgrounds (Prompts > Compose > library > playground
    // drawer). Pipelines do not yet have a per-record playground; route to
    // /prompts which will surface the pipeline in its detail view.
    onClose()
    if (nd.kind === 'pattern') {
      window.dispatchEvent(new CustomEvent('verse:open-pattern-playground', {
        detail: { patternId: nd.recordId },
      }))
      navigate('/prompts')
    } else if (nd.kind === 'pipeline') {
      navigate('/prompts')
    }
  }

  const showPlayground = nd.kind === 'pattern' || nd.kind === 'pipeline'

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', left, top, zIndex: 70 }}
      className="rounded border border-line bg-surface-2 shadow-lg overflow-hidden min-w-[200px]"
      data-test="canvas-context-menu"
      data-menu-kind="canvas-tile-menu"
      data-node-kind={nd.kind}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 border-b border-line flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          {KIND_LABELS[nd.kind]}
        </span>
        <span className="text-xs text-ink truncate">{nd.title || 'Untitled'}</span>
      </div>
      <button
        onClick={onExpand}
        className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-surface-3"
        data-test="canvas-tile-expand"
        title="Open the editor as an overlay — stays on canvas"
      >Expand &amp; edit here</button>
      <button
        onClick={openStudio}
        className="w-full text-left px-3 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-surface-3 border-t border-line"
        data-test="canvas-tile-open-studio"
      >{STUDIO_LABEL[nd.kind]}</button>
      <button
        onClick={() => { onClose(); onDelete() }}
        className="w-full text-left px-3 py-1.5 text-xs text-bad hover:bg-surface-3 border-t border-line"
        data-test="canvas-delete-node"
      >Delete from canvas</button>
      {showPlayground && (
        <button
          onClick={openPlayground}
          className="w-full text-left px-3 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-surface-3 border-t border-line"
          data-test="canvas-tile-open-playground"
        >Open playground</button>
      )}
    </div>
  )
}

// ─── CanvasTileEditor ────────────────────────────────────────────────────────
//
// Full overlay editor for any canvas tile. Pops up centered on the canvas,
// dims the rest, gives you a dedicated text editor with the same caliber
// experience as the studios — but without ever leaving the canvas. Has a
// per-record draft tab strip backed by localStorage: Main is the live
// record (autosaves), drafts are local working copies you can A/B between
// and Promote into Main when you like one.

interface FieldSpec {
  key: string
  label: string
  multiline: boolean
}

const KIND_FIELDS: Record<NodeKind, FieldSpec[]> = {
  document: [
    { key: 'title', label: 'Title',       multiline: false },
    { key: 'body',  label: 'Body',        multiline: true  },
  ],
  note: [
    { key: 'title', label: 'Title',       multiline: false },
    { key: 'body',  label: 'Body',        multiline: true  },
  ],
  poem: [
    { key: 'title', label: 'Title',       multiline: false },
    { key: 'body',  label: 'Body',        multiline: true  },
  ],
  longform: [
    { key: 'title', label: 'Title',       multiline: false },
  ],
  build: [
    { key: 'name',        label: 'Name',        multiline: false },
    { key: 'description', label: 'Description', multiline: true  },
  ],
  pattern: [
    { key: 'name', label: 'Name',         multiline: false },
    { key: 'body', label: 'Body',         multiline: true  },
  ],
  pipeline: [
    { key: 'name',        label: 'Name',        multiline: false },
    { key: 'description', label: 'Description', multiline: true  },
  ],
  scrap: [
    { key: 'body', label: 'Body', multiline: true },
  ],
}

// Snapshot uses LinkableType. The Snapshots component restores
// document/poem/note/longform/build/pipeline only — patterns aren't wired
// through that restore path yet, so we don't surface the button for them.
const SNAPSHOT_KINDS = new Set<NodeKind>([
  'document', 'poem', 'longform', 'build', 'pipeline',
])

interface TileDraft {
  id:        string
  name:      string
  fields:    Record<string, string>
  updatedAt: number
}

function tileDraftsKey(kind: NodeKind, id: string) {
  return `verse-studio:canvas:editor-drafts:${kind}:${id}`
}
function loadTileDrafts(kind: NodeKind, id: string): TileDraft[] {
  try {
    const raw = localStorage.getItem(tileDraftsKey(kind, id))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (d): d is TileDraft =>
        d && typeof d.id === 'string' && d.fields && typeof d.fields === 'object'
    )
  } catch { return [] }
}
function saveTileDrafts(kind: NodeKind, id: string, drafts: TileDraft[]) {
  try {
    localStorage.setItem(tileDraftsKey(kind, id), JSON.stringify(drafts))
  } catch {}
}

function tileUid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function getRecord(ws: ReturnType<typeof useWorkspace>, kind: NodeKind, id: string) {
  switch (kind) {
    case 'document': return ws.documents.find((d) => d.id === id)
    case 'note':     return ws.notes.find((n) => n.id === id)
    case 'poem':     return ws.poems.find((p) => p.id === id)
    case 'longform': return ws.longformDocs.find((l) => l.id === id)
    case 'build':    return ws.builds.find((b) => b.id === id)
    case 'pattern':  return ws.patterns.find((p) => p.id === id)
    case 'pipeline': return ws.pipelines.find((p) => p.id === id)
    case 'scrap':    return ws.scraps.find((s) => s.id === id)
  }
}

function getUpdater(ws: ReturnType<typeof useWorkspace>, kind: NodeKind):
  (id: string, patch: Record<string, string>) => Promise<void>
{
  switch (kind) {
    case 'document': return (id, patch) => ws.updateDocument(id, patch as any)
    case 'note':     return (id, patch) => ws.updateNote(id, patch as any)
    case 'poem':     return (id, patch) => ws.updatePoem(id, patch as any)
    case 'longform': return (id, patch) => ws.updateLongformDoc(id, patch as any)
    case 'build':    return (id, patch) => ws.updateBuild(id, patch as any)
    case 'pattern':  return (id, patch) => ws.updatePattern(id, patch as any)
    case 'pipeline': return (id, patch) => ws.updatePipeline(id, patch as any)
    case 'scrap':    return (id, patch) => ws.updateScrap(id, patch as any)
  }
}

function CanvasTileEditor({
  nd, onClose,
}: {
  nd: NodeData
  onClose: () => void
}) {
  const ws = useWorkspace()
  const fields = KIND_FIELDS[nd.kind]
  const record = getRecord(ws, nd.kind, nd.recordId) as
    | (Record<string, unknown> & { id: string }) | undefined
  const update = getUpdater(ws, nd.kind)

  // ── drafts (per record, localStorage-backed) ──
  const [drafts, setDrafts] = useState<TileDraft[]>(() => loadTileDrafts(nd.kind, nd.recordId))
  useEffect(() => { saveTileDrafts(nd.kind, nd.recordId, drafts) }, [nd.kind, nd.recordId, drafts])

  // 'main' means: edit the live record. A draft id means: edit that draft.
  const [activeTab, setActiveTab] = useState<'main' | string>('main')
  const isMain = activeTab === 'main'
  const activeDraft = isMain ? null : drafts.find((d) => d.id === activeTab) ?? null

  // ── Main field state (mirrors the canonical record + autosaves) ──
  const initialMain = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    if (!record) {
      for (const f of fields) out[f.key] = ''
      return out
    }
    for (const f of fields) out[f.key] = String((record as any)[f.key] ?? '')
    return out
  }, [record, fields])
  const [mainDraft, setMainDraft] = useState<Record<string, string>>(initialMain)
  const savedRef = useRef<Record<string, string>>(initialMain)

  // External-update sync (snapshot restore, edits in another tab, etc.)
  useEffect(() => {
    if (!record) return
    let changed = false
    for (const f of fields) {
      const cur = String((record as any)[f.key] ?? '')
      if (cur !== savedRef.current[f.key]) { savedRef.current[f.key] = cur; changed = true }
    }
    if (changed) setMainDraft({ ...savedRef.current })
  }, [record, fields])

  const mainDirty =
    !!record &&
    fields.some((f) => mainDraft[f.key] !== String((record as any)[f.key] ?? ''))
  const mainSig = fields.map((f) => mainDraft[f.key] ?? '').join('\u0000')

  useDebouncedAutosave(mainSig, mainDirty, () => {
    if (!record) return
    const patch: Record<string, string> = {}
    for (const f of fields) patch[f.key] = mainDraft[f.key] ?? ''
    savedRef.current = { ...patch }
    update(record.id, patch)
  })

  // ── Draft field state ──
  function patchActiveDraft(key: string, value: string) {
    if (!activeDraft) return
    setDrafts((cur) =>
      cur.map((d) =>
        d.id === activeDraft.id
          ? { ...d, fields: { ...d.fields, [key]: value }, updatedAt: Date.now() }
          : d
      )
    )
  }
  function patchMain(key: string, value: string) {
    setMainDraft((cur) => ({ ...cur, [key]: value }))
  }

  // ── Draft CRUD ──
  function addDraft() {
    const fresh: TileDraft = {
      id: tileUid(),
      name: `Draft ${drafts.length + 1}`,
      fields: { ...mainDraft },
      updatedAt: Date.now(),
    }
    setDrafts((cur) => [...cur, fresh])
    setActiveTab(fresh.id)
  }
  function discardActiveDraft() {
    if (!activeDraft) return
    if (!window.confirm(`Discard draft "${activeDraft.name}"?`)) return
    setDrafts((cur) => cur.filter((d) => d.id !== activeDraft.id))
    setActiveTab('main')
  }
  function renameActiveDraft() {
    if (!activeDraft) return
    const name = window.prompt('Rename draft', activeDraft.name)
    if (name === null) return
    setDrafts((cur) =>
      cur.map((d) =>
        d.id === activeDraft.id ? { ...d, name: name.trim() || d.name } : d
      )
    )
  }
  function promoteActiveDraft() {
    if (!activeDraft || !record) return
    if (!window.confirm(`Promote "${activeDraft.name}" → overwrite Main?`)) return
    const patch: Record<string, string> = {}
    for (const f of fields) patch[f.key] = activeDraft.fields[f.key] ?? ''
    update(record.id, patch)
    // Reflect new main locally so the tab strip updates.
    setMainDraft({ ...patch })
    savedRef.current = { ...patch }
    setActiveTab('main')
  }

  // ── Backdrop click to close (but only when click started on backdrop) ──
  const backdropMouseDownRef = useRef(false)
  function onBackdropMouseDown(e: React.MouseEvent) {
    backdropMouseDownRef.current = e.target === e.currentTarget
  }
  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && backdropMouseDownRef.current) onClose()
    backdropMouseDownRef.current = false
  }

  // ── Stats from the multiline body field if present ──
  const bodyField = fields.find((f) => f.multiline)
  const bodyValue = bodyField
    ? (isMain ? mainDraft[bodyField.key] : activeDraft?.fields[bodyField.key]) ?? ''
    : ''
  const charCount = bodyValue.length
  const wordCount = bodyValue.split(/\s+/).filter(Boolean).length
  const tokenEst  = Math.max(0, Math.ceil(charCount / 4))

  if (!record) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={onClose}
      >
        <div className="bg-surface-2 border border-line rounded p-6 text-sm text-ink-faint">
          Record not found. It may have been deleted.
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={onBackdropMouseDown}
      onClick={onBackdropClick}
      data-test="canvas-tile-editor-backdrop"
    >
      <div
        className="w-[min(960px,92vw)] h-[min(820px,88vh)] bg-surface border border-line rounded shadow-2xl flex flex-col overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
        data-test="canvas-tile-editor"
        data-node-kind={nd.kind}
        data-record-id={record.id}
      >
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-2 border-b border-line shrink-0">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            {KIND_LABELS[nd.kind]}
          </span>
          <span className="flex-1" />
          {SNAPSHOT_KINDS.has(nd.kind) && (
            <Snapshots
              recordId={record.id}
              recordType={nd.kind as 'document' | 'poem' | 'longform' | 'build' | 'note' | 'pipeline'}
              buildSnapshotData={() => JSON.stringify(mainDraft)}
            />
          )}
          <button
            onClick={onClose}
            className="text-xs text-ink-faint hover:text-ink px-2 py-0.5"
            data-test="canvas-tile-editor-close"
            title="Close (Esc)"
          >×</button>
        </header>

        {/* Tab strip */}
        <div
          className="flex items-stretch border-b border-line bg-surface-2 shrink-0 overflow-x-auto"
          data-test="canvas-tile-editor-tabs"
        >
          <button
            onClick={() => setActiveTab('main')}
            className={`group flex items-center gap-1 pl-3 pr-3 py-1.5 border-r border-line cursor-pointer transition-colors shrink-0 ${
              isMain ? 'bg-surface text-ink' : 'text-ink-soft hover:bg-surface'
            }`}
            data-test="canvas-tile-editor-tab"
            data-tab-id="main"
          >
            <span className="text-xs">Main</span>
            <span className={`text-[10px] ml-1 ${mainDirty ? 'text-accent' : 'text-ink-faint'}`}>
              {mainDirty ? 'saving…' : 'saved'}
            </span>
          </button>
          {drafts.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveTab(d.id)}
              onDoubleClick={() => { setActiveTab(d.id); renameActiveDraft() }}
              className={`group flex items-center gap-1 pl-3 pr-3 py-1.5 border-r border-line cursor-pointer transition-colors shrink-0 ${
                activeTab === d.id ? 'bg-surface text-ink' : 'text-ink-soft hover:bg-surface'
              }`}
              data-test="canvas-tile-editor-tab"
              data-tab-id={d.id}
              title="Click to switch · Double-click to rename"
            >
              <span className="text-xs max-w-[18ch] truncate">{d.name}</span>
            </button>
          ))}
          <button
            onClick={addDraft}
            className="px-3 py-1.5 text-xs text-ink-faint hover:text-ink hover:bg-surface transition-colors shrink-0"
            data-test="canvas-tile-editor-draft-new"
            title="New draft (clones Main)"
          >+ Draft</button>
          {!isMain && activeDraft && (
            <>
              <span className="flex-1" />
              <button
                onClick={promoteActiveDraft}
                className="px-3 py-1.5 text-xs text-ink rounded-none border-l border-line hover:bg-accent/10"
                data-test="canvas-tile-editor-promote"
                title="Overwrite Main with this draft"
              >Promote →</button>
              <button
                onClick={discardActiveDraft}
                className="px-3 py-1.5 text-xs text-ink-faint hover:text-bad border-l border-line"
                data-test="canvas-tile-editor-discard"
              >Discard</button>
            </>
          )}
        </div>

        {/* Editor body */}
        <div className="flex-1 flex flex-col min-h-0">
          {fields.map((f, i) => {
            const value = isMain
              ? mainDraft[f.key] ?? ''
              : activeDraft?.fields[f.key] ?? ''
            const onChange = (v: string) =>
              isMain ? patchMain(f.key, v) : patchActiveDraft(f.key, v)
            if (!f.multiline) {
              return (
                <div
                  key={f.key}
                  className="px-8 py-2 border-b border-line shrink-0"
                  data-test="canvas-tile-editor-field"
                  data-field-key={f.key}
                >
                  <div className="text-[9px] uppercase tracking-[0.18em] text-ink-faint mb-0.5">
                    {f.label}
                  </div>
                  <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={f.label}
                    className="title-input w-full text-lg text-ink"
                    data-test="canvas-tile-editor-input"
                  />
                </div>
              )
            }
            return (
              <div
                key={f.key}
                className="flex-1 min-h-0 relative editor-surface"
                data-test="canvas-tile-editor-field"
                data-field-key={f.key}
              >
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={`${f.label}…`}
                  spellCheck={false}
                  className="absolute inset-0 w-full h-full resize-none px-12 py-8 font-mono text-[13.5px] leading-[1.7] text-ink bg-transparent outline-none"
                  data-test="canvas-tile-editor-body"
                />
              </div>
            )
          })}

          {/* Longform — note that body lives in sections, edited elsewhere */}
          {nd.kind === 'longform' && (
            <div className="flex-1 flex items-center justify-center text-ink-faint text-sm italic px-8">
              Longform sections are edited in the Longform Studio. The title
              autosaves here; sections stay where they are.
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          className="border-t border-line px-6 py-1.5 shrink-0 flex items-center gap-4 text-[10px] uppercase tracking-[0.14em] text-ink-faint"
          data-test="canvas-tile-editor-status"
        >
          {bodyField ? (
            <>
              <span>{charCount} chars</span>
              <span>·</span>
              <span>{wordCount} words</span>
              <span>·</span>
              <span>~{tokenEst} tokens</span>
            </>
          ) : (
            <span>no body field for this kind</span>
          )}
          <span className="flex-1" />
          {isMain
            ? <span>{mainDirty ? 'saving…' : 'saved'}</span>
            : <span>working draft (local) · changes don't touch Main until you Promote</span>}
        </footer>
      </div>
    </div>
  )
}
