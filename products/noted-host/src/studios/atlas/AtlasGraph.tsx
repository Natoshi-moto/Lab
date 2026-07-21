// Sweep 23 — SVG force-directed graph. Hand-rolled, no d3-force.
//
// Visual encoding:
//   - Records: <circle r=6>, fill rgb(var(--accent))
//   - Tags:    <rect 14x14 rx=3>, fill rgb(var(--ink-soft))
//   - Projects: 16px hexagon polygon, fill rgb(var(--ink-faint)),
//                stroke rgb(var(--accent))
// Edges: <line> stroke rgb(var(--line)) opacity 0.4
//
// Sweep 24 — fixed two regressions:
//   1) Tokens were referenced as var(--color-accent) etc; the CSS variables
//      defined in index.css are unprefixed (--accent, --ink, --line, ...).
//      Every reference now uses the correct names AND uses inline `style`
//      rather than XML presentation attributes — `style="fill: var(...)"`
//      is robust across Chrome/Firefox/Safari, the bare attribute form is
//      historically fragile.
//   2) Drag-and-release used to navigate (the synthesized click after
//      mouseup fired against onNodeClick because dragRef had been cleared
//      already). A `suppressNextClickRef` flag set on movement now blocks
//      the click only when an actual drag occurred.
//
// Animation:
//   - requestAnimationFrame loop calls stepSimulation
//   - Settle: max velocity < 0.1 for 30 consecutive frames pauses the loop
//   - Drag re-starts the loop
//
// Drag:
//   - mousedown sets pinned=true on the node
//   - mousemove updates xy
//   - mouseup persists via ws.setNodePosition(id, x, y, true)
//   - right-click toggles pinned to false (persists)
//
// Click navigates to the record. Hover shows an SVG <text> tooltip.

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../../context'
import { stepSimulation, type SimNode } from '../../util/atlas-sim'
import type { LinkableType } from '../../types'
import { jumpToSelection, ROUTE_FOR_TYPE, type JumpableKind } from '../../util/navigate'

interface InputNode {
  id: string  // synthetic: `${type}:${recordId}` (or `tag:...`, `project:...`)
  type: 'record' | 'tag' | 'project'
  kind: string  // record: document/poem/longform/build/pattern/pipeline/longform-section
  name: string
  aiLineage: boolean
}
interface InputEdge { source: string, target: string, color?: string, weight?: number }

export interface AtlasGraphProps {
  nodes: InputNode[]
  edges: InputEdge[]
  // Bug 2.3 (Sweep 26): fired once per seedNodes generation when the
  // simulation reaches its settle threshold. Used by Atlas.tsx to
  // auto-fit the viewport so a cold load doesn't show a tiny clump in
  // a big void.
  onSettled?: () => void
}

/**
 * Imperative handle exposed to Atlas.tsx so AtlasFilters' viewport
 * controls can drive viewBox state without prop-drilling. Sweep 23.1.
 */
export interface AtlasGraphHandle {
  fitToView: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

// Sweep 23.1: viewBox bounds. Below 50px width the user can't navigate
// out; above 10000px the cluster vanishes into the void.
const MIN_VIEWBOX_W = 50
const MAX_VIEWBOX_W = 10000
const ZOOM_FACTOR_IN = 0.9
const ZOOM_FACTOR_OUT = 1.1

const KIND_OPACITY: Record<string, number> = {
  document: 1.0,
  note:     0.92,  // Sweep 27 — slightly less prominent than docs, more than poems
  poem:     0.85,
  longform: 0.7,
  build:    0.55,
  pattern:  0.45,
  pipeline: 0.35,
  'longform-section': 0.25
}

function recordKindToJumpable(kind: string): JumpableKind | null {
  switch (kind) {
    case 'document': return 'document'
    case 'note':     return 'note'  // Sweep 27
    case 'poem':     return 'poem'
    case 'longform': return 'longform'
    case 'build':    return 'build'
    case 'pattern':  return 'pattern'
    case 'pipeline': return 'pipeline'
    case 'project':  return 'project'
    default: return null
  }
}

export const AtlasGraph = forwardRef<AtlasGraphHandle, AtlasGraphProps>(function AtlasGraph(
  { nodes, edges, onSettled },
  ref
): JSX.Element {
  const ws = useWorkspace()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })

  // Bug 2.3 (Sweep 26): hold the latest onSettled in a ref so tick() —
  // which is a stable function reference inside the loop — always invokes
  // the most recent callback. settledFiredRef gates "fire at most once
  // per seedNodes generation" and is reset whenever seedNodes regenerates.
  const onSettledRef = useRef(onSettled)
  useEffect(() => { onSettledRef.current = onSettled }, [onSettled])
  const settledFiredRef = useRef(false)

  // Sweep 23.1: viewBox state for pan/zoom. Per-session — not persisted.
  // Initial viewBox matches the container size, so the default view is
  // pixel-aligned with the SVG element (1:1 sim coords ↔ screen pixels).
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 600 })
  const viewBoxRef = useRef(viewBox)
  useEffect(() => { viewBoxRef.current = viewBox }, [viewBox])

  // Sweep 23.1: pan state. Captures (mouse-px, viewBox-coords) at mousedown.
  const panStartRef = useRef<{ mx: number, my: number, vx: number, vy: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [shiftHeld, setShiftHeld] = useState(false)

  // Re-measure on mount and on resize.
  useLayoutEffect(() => {
    if (!containerRef.current) return
    function update() {
      const rect = containerRef.current!.getBoundingClientRect()
      const w = Math.max(200, rect.width)
      const h = Math.max(200, rect.height)
      setSize({ w, h })
      // Sweep 23.1: set the initial viewBox to match the measured size on
      // first measurement only. After that, user pan/zoom owns the viewBox.
      setViewBox((prev) => (prev.w === 800 && prev.h === 600 && prev.x === 0 && prev.y === 0
        ? { x: 0, y: 0, w, h }
        : prev))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Build seed positions. Use persisted positions when available, else random.
  const seedNodes = useMemo<SimNode[]>(() => {
    return nodes.map((n, i) => {
      const persisted = ws.getNodePosition(n.id)
      if (persisted) {
        return {
          id: n.id,
          x: persisted.x,
          y: persisted.y,
          vx: 0, vy: 0,
          pinned: !!persisted.pinned
        }
      }
      // Random within current viewport (stable per-id via simple hash so the
      // same node lands in the same spot across re-mounts when no persisted
      // position exists).
      //
      // Bug 2.7 (Sweep 26): mix the array index `i` into the hash. Pre-26,
      // nodes with similar IDs (e.g. longform-section IDs that share a long
      // common prefix) produced identical hashes, so they spawned at the
      // exact same point and the simulation had to spend dozens of frames
      // just untangling them. The index tiebreaker guarantees uniqueness.
      let h = 0
      for (let c = 0; c < n.id.length; c++) h = (h * 31 + n.id.charCodeAt(c)) | 0
      h = (h * 31 + i) | 0
      const r = (n: number) => ((Math.sin(n) + 1) / 2)
      return {
        id: n.id,
        x: 50 + r(h) * (size.w - 100),
        y: 50 + r(h * 1.31) * (size.h - 100),
        vx: 0, vy: 0,
        pinned: false
      }
    })
    // We deliberately do NOT depend on ws.nodePositions here — drag persists
    // via setNodePosition but we don't want to restart-from-seed on every
    // persist call. We DO want fresh seeds when the visible node set changes
    // (entry/exit) or container resizes meaningfully.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.map((n) => n.id).join('|'), size.w, size.h])

  const simNodesRef = useRef<SimNode[]>(seedNodes)
  // Reset sim nodes whenever the seed regenerates.
  useEffect(() => {
    simNodesRef.current = seedNodes
    settleCounterRef.current = 0
    // Bug 2.3 (Sweep 26): reset the settled-fired guard so the next sim
    // run earns a fresh onSettled call. This is what subsumes Bug 2.6:
    // when the user changes the project/kind filter, seedNodes regenerates,
    // settledFiredRef resets to false, the post-filter sim re-stabilizes,
    // onSettled fires, and Atlas re-fits to the new node set.
    settledFiredRef.current = false
  }, [seedNodes])

  const [_, forceRender] = useState(0)
  const rafRef = useRef<number | null>(null)
  const settleCounterRef = useRef(0)

  function tick() {
    // Bug 2.2 (Sweep 26): force constants re-tuned. The pre-26 values
    // (charge -30, linkDistance 80, damping 0.85, centering 0.01) made
    // every project graph look like a tight clump near the upper-left
    // corner because centering at 0.01 is ~10x stronger than typical
    // force-directed defaults. The new values match the report's
    // recommendation with one push: centering at 0.001 (vs 0.003) keeps
    // small graphs from clumping.
    const next = stepSimulation(simNodesRef.current, edges, {
      width: size.w, height: size.h,
      charge: -120, linkDistance: 120, damping: 0.88, centering: 0.001
    })
    simNodesRef.current = next

    let maxV = 0
    for (const n of next) {
      const v = Math.abs(n.vx) + Math.abs(n.vy)
      if (v > maxV) maxV = v
    }
    if (maxV < 0.1) settleCounterRef.current++
    else settleCounterRef.current = 0

    forceRender((c) => (c + 1) % 1000)

    if (settleCounterRef.current >= 30) {
      // Bug 2.3 (Sweep 26): fire onSettled exactly once per seedNodes
      // generation. settledFiredRef is reset whenever seedNodes regenerates
      // (initial mount, node-set changes via filter/project switch, etc.),
      // so a fresh sim run earns a fresh fitToView. Subsumes Bug 2.6.
      if (!settledFiredRef.current) {
        settledFiredRef.current = true
        onSettledRef.current?.()
      }
      // Pause.
      rafRef.current = null
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function startLoop() {
    if (rafRef.current != null) return
    settleCounterRef.current = 0
    rafRef.current = requestAnimationFrame(tick)
  }

  // Start on mount + when edges/nodes change shape.
  useEffect(() => {
    startLoop()
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedNodes, edges])

  // Drag state.
  const dragRef = useRef<{ id: string, offsetX: number, offsetY: number } | null>(null)
  // Sweep 24: suppression flag set when a real drag happened, consumed by
  // the next click. Prevents drag-release from navigating to the dragged
  // record's studio. Without this, releasing a node always fired onClick
  // because dragRef is already cleared by the time `click` is synthesized.
  const suppressNextClickRef = useRef(false)
  const [hoverId, setHoverId] = useState<string | null>(null)

  function svgPoint(e: React.MouseEvent | MouseEvent): { x: number, y: number } {
    if (!svgRef.current) return { x: 0, y: 0 }
    // Sweep 23.1: convert client px → SVG-coord using the live viewBox.
    // Pre-23.1 returned client px directly (which was correct only when
    // viewBox = container rect). Using viewBox makes drag work under any
    // pan/zoom state.
    const rect = svgRef.current.getBoundingClientRect()
    const vb = viewBoxRef.current
    const px = (e as MouseEvent).clientX - rect.left
    const py = (e as MouseEvent).clientY - rect.top
    return {
      x: vb.x + (px / rect.width)  * vb.w,
      y: vb.y + (py / rect.height) * vb.h
    }
  }

  function onNodeMouseDown(e: React.MouseEvent, id: string) {
    if (e.button !== 0) return
    const p = svgPoint(e)
    const node = simNodesRef.current.find((n) => n.id === id)
    if (!node) return
    node.pinned = true
    dragRef.current = { id, offsetX: p.x - node.x, offsetY: p.y - node.y }
    e.preventDefault()
    e.stopPropagation()

    // Sweep 24: track whether a real movement happened during the drag.
    // Only then do we suppress the synthesized click that fires after
    // mouseup. Mousedown-mouseup with no movement still navigates.
    let didMove = false

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return
      const node = simNodesRef.current.find((n) => n.id === dragRef.current!.id)
      if (!node) return
      const pp = svgPoint(ev)
      node.x = pp.x - dragRef.current.offsetX
      node.y = pp.y - dragRef.current.offsetY
      node.vx = 0
      node.vy = 0
      didMove = true
      forceRender((c) => (c + 1) % 1000)
      // Keep the simulation alive while dragging.
      startLoop()
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const id = dragRef.current?.id
      dragRef.current = null
      if (didMove) suppressNextClickRef.current = true
      if (!id) return
      const n = simNodesRef.current.find((nn) => nn.id === id)
      if (n) {
        ws.setNodePosition(id, n.x, n.y, true)
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onNodeContextMenu(e: React.MouseEvent, id: string) {
    e.preventDefault()
    const n = simNodesRef.current.find((nn) => nn.id === id)
    if (!n) return
    n.pinned = false
    ws.setNodePosition(id, n.x, n.y, false)
    forceRender((c) => (c + 1) % 1000)
    startLoop()
  }

  function onNodeClick(e: React.MouseEvent, syntheticId: string, n: InputNode) {
    // Sweep 24: consume the drag-suppression flag if it was set by onUp.
    // This is the real fix for "drag-and-release navigates"; the prior
    // `dragRef.current` check was always null by the time click fires
    // (mouseup runs first, clearing the ref).
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }
    if (dragRef.current) return  // belt-and-suspenders: in-flight drag
    if (e.button !== 0) return
    if (n.type === 'tag') return  // tags are not navigable
    const [, recordId] = syntheticId.split(/:(.+)/)  // first colon split
    const jumpKind = recordKindToJumpable(n.kind)
    if (!jumpKind) return
    // Special-case: longform-section navigates to its parent longform doc.
    if (n.kind === 'longform-section') {
      const sec = ws.sections.find((s) => s.id === recordId)
      if (!sec) return
      jumpToSelection({ kind: 'longform', id: sec.projectId })
      navigate(ROUTE_FOR_TYPE['longform'])
      return
    }
    jumpToSelection({ kind: jumpKind, id: recordId })
    navigate(ROUTE_FOR_TYPE[jumpKind])
  }

  // ─────────────────────────────────────────────────────────────────────
  // Sweep 23.1: pan/zoom logic.
  // ─────────────────────────────────────────────────────────────────────

  // Wheel zoom — anchored to the cursor. Attached via addEventListener with
  // `passive: false` so preventDefault works (React's synthetic onWheel is
  // passive by default and would let the page scroll).
  //
  // Bug 2.5 (Sweep 26): include svgRef.current in deps. In Strict Mode the
  // effect runs twice and the ref may point at a different SVG element on
  // the second run; without the dep, the cleanup ran against the original
  // element and the new element kept the listener attached forever. The
  // eslint-disable below acknowledges that ref mutations aren't reactive —
  // we're relying on React re-running the effect on re-render to catch
  // the swap, not on a ref-mutation watcher.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const vb = viewBoxRef.current
      const factor = e.deltaY < 0 ? ZOOM_FACTOR_IN : ZOOM_FACTOR_OUT
      const newW = vb.w * factor
      const newH = vb.h * factor
      if (newW < MIN_VIEWBOX_W || newW > MAX_VIEWBOX_W) return
      const rect = svg!.getBoundingClientRect()
      const cursorSvgX = vb.x + (e.clientX - rect.left) / rect.width  * vb.w
      const cursorSvgY = vb.y + (e.clientY - rect.top)  / rect.height * vb.h
      setViewBox({
        x: cursorSvgX - (cursorSvgX - vb.x) * factor,
        y: cursorSvgY - (cursorSvgY - vb.y) * factor,
        w: newW,
        h: newH
      })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgRef.current])

  // Track shift for cursor styling.
  useEffect(() => {
    function down(e: KeyboardEvent) { if (e.key === 'Shift') setShiftHeld(true) }
    function up(e: KeyboardEvent) { if (e.key === 'Shift') setShiftHeld(false) }
    // Bug 2.4 (Sweep 26): reset shift state on window blur. Pre-26, alt-
    // tabbing with shift held meant the keyup fired in the other window,
    // leaving our `shiftHeld` stuck at true until the user pressed-and-
    // released shift again in our window. The cursor would stay in 'grab'
    // state, which made the canvas feel haunted on return-from-task-switch.
    function onBlur() { setShiftHeld(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  // Pan starts on shift+drag-on-empty-canvas OR middle-mouse-drag.
  function onSvgMouseDown(e: React.MouseEvent) {
    // If the click landed on a node, the node's own onMouseDown already
    // ran (deeper in the tree) and called stopPropagation. So if we're
    // here, the click is on empty canvas or an edge.
    const isMiddle = e.button === 1
    const isShiftLeft = e.button === 0 && e.shiftKey
    if (!isMiddle && !isShiftLeft) return
    e.preventDefault()
    const vb = viewBoxRef.current
    panStartRef.current = { mx: e.clientX, my: e.clientY, vx: vb.x, vy: vb.y }
    setIsPanning(true)

    const svg = svgRef.current
    const rect = svg?.getBoundingClientRect()
    function onMove(ev: MouseEvent) {
      const start = panStartRef.current
      if (!start || !rect) return
      // Convert px delta to SVG-coord delta using viewBox/rect ratio.
      const vbCur = viewBoxRef.current
      const dx = (ev.clientX - start.mx) * (vbCur.w / rect.width)
      const dy = (ev.clientY - start.my) * (vbCur.h / rect.height)
      setViewBox({ x: start.vx - dx, y: start.vy - dy, w: vbCur.w, h: vbCur.h })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      panStartRef.current = null
      setIsPanning(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Imperative handle for AtlasFilters' viewport buttons.
  useImperativeHandle(ref, () => ({
    fitToView() {
      const sims = simNodesRef.current
      if (sims.length === 0) {
        setViewBox({ x: 0, y: 0, w: size.w, h: size.h })
        return
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const n of sims) {
        if (n.x < minX) minX = n.x
        if (n.y < minY) minY = n.y
        if (n.x > maxX) maxX = n.x
        if (n.y > maxY) maxY = n.y
      }
      // Pad 10% on each side, with a floor so a single node still shows
      // some context around it instead of zooming to a point.
      let w = Math.max(maxX - minX, 1)
      let h = Math.max(maxY - minY, 1)
      const padX = Math.max(w * 0.1, 40)
      const padY = Math.max(h * 0.1, 40)
      let nx = minX - padX
      let ny = minY - padY
      let nw = w + padX * 2
      let nh = h + padY * 2
      // Clamp to allowed range.
      if (nw < MIN_VIEWBOX_W) { const c = nx + nw / 2; nw = MIN_VIEWBOX_W; nx = c - nw / 2 }
      if (nw > MAX_VIEWBOX_W) { const c = nx + nw / 2; nw = MAX_VIEWBOX_W; nx = c - nw / 2 }
      // Keep aspect roughly tied to the container so circles don't oval.
      const aspect = size.w / size.h
      if (nw / nh > aspect) { nh = nw / aspect } else { nw = nh * aspect }
      setViewBox({ x: nx, y: ny, w: nw, h: nh })
    },
    zoomIn() {
      const vb = viewBoxRef.current
      const newW = vb.w * ZOOM_FACTOR_IN
      const newH = vb.h * ZOOM_FACTOR_IN
      if (newW < MIN_VIEWBOX_W) return
      // Anchor at center.
      const cx = vb.x + vb.w / 2
      const cy = vb.y + vb.h / 2
      setViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH })
    },
    zoomOut() {
      const vb = viewBoxRef.current
      const newW = vb.w * ZOOM_FACTOR_OUT
      const newH = vb.h * ZOOM_FACTOR_OUT
      if (newW > MAX_VIEWBOX_W) return
      const cx = vb.x + vb.w / 2
      const cy = vb.y + vb.h / 2
      setViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH })
    },
    resetView() {
      setViewBox({ x: 0, y: 0, w: size.w, h: size.h })
    }
  }), [size.w, size.h])

  // Index for rendering.
  const simById: Record<string, SimNode> = {}
  for (const sn of simNodesRef.current) simById[sn.id] = sn

  // Cursor: 'grabbing' while panning, 'grab' if shift held, default otherwise.
  const svgCursor = isPanning ? 'grabbing' : (shiftHeld ? 'grab' : 'default')

  return (
    <div ref={containerRef} className="absolute inset-0">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={onSvgMouseDown}
        style={{ cursor: svgCursor }}
        data-test="atlas-graph"
      >
        {edges.map((e, i) => {
          const a = simById[e.source]
          const b = simById[e.target]
          if (!a || !b) return null
          const weight = typeof e.weight === 'number' && Number.isFinite(e.weight) ? Math.max(1, e.weight) : 1
          const strokeWidth = Math.min(3, 1 + (weight - 1) * 0.5)
          return (
            <line
              key={i}
              data-test="atlas-edge"
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              style={{ stroke: e.color || 'rgb(var(--line))', strokeOpacity: 0.4, strokeWidth }}
            />
          )
        })}

        {nodes.map((n) => {
          const sn = simById[n.id]
          if (!sn) return null
          const recordId = n.id.split(/:(.+)/)[1] ?? ''
          const linkableType: LinkableType | undefined =
            n.type === 'record' ? (n.kind as LinkableType) : undefined

          if (n.type === 'tag') {
            return (
              <g
                key={n.id}
                data-test="atlas-node"
                data-node-id={n.id}
                data-node-type="tag"
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId((cur) => (cur === n.id ? null : cur))}
                onMouseDown={(e) => onNodeMouseDown(e, n.id)}
                onContextMenu={(e) => onNodeContextMenu(e, n.id)}
                style={{ cursor: 'grab' }}
              >
                <rect
                  x={sn.x - 7}
                  y={sn.y - 7}
                  width={14}
                  height={14}
                  rx={3}
                  style={{ fill: 'rgb(var(--ink-soft))', fillOpacity: 0.9 }}
                />
                {hoverId === n.id && (
                  <text
                    x={sn.x + 12}
                    y={sn.y + 4}
                    fontSize="11"
                    style={{ fill: 'rgb(var(--ink))' }}
                  >
                    {n.name}
                  </text>
                )}
              </g>
            )
          }

          if (n.type === 'project') {
            // 16px hexagon, vertical (point up). Center at (sn.x, sn.y).
            const r = 8
            const points: string[] = []
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i - Math.PI / 2
              points.push(`${sn.x + r * Math.cos(a)},${sn.y + r * Math.sin(a)}`)
            }
            return (
              <g
                key={n.id}
                data-test="atlas-node"
                data-node-id={n.id}
                data-node-type="project"
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId((cur) => (cur === n.id ? null : cur))}
                onMouseDown={(e) => onNodeMouseDown(e, n.id)}
                onContextMenu={(e) => onNodeContextMenu(e, n.id)}
                onClick={(e) => onNodeClick(e, n.id, n)}
                style={{ cursor: 'grab' }}
              >
                <polygon
                  points={points.join(' ')}
                  style={{
                    fill: 'rgb(var(--ink-faint))',
                    stroke: 'rgb(var(--accent))',
                    strokeWidth: 1
                  }}
                />
                {hoverId === n.id && (
                  <text
                    x={sn.x + 12}
                    y={sn.y + 4}
                    fontSize="11"
                    style={{ fill: 'rgb(var(--ink))' }}
                  >
                    {n.name}
                  </text>
                )}
              </g>
            )
          }

          // Record.
          const opacity = KIND_OPACITY[n.kind] ?? 0.6
          return (
            <g
              key={n.id}
              data-test="atlas-node"
              data-node-id={n.id}
              data-node-type={linkableType ?? 'record'}
              onMouseEnter={() => setHoverId(n.id)}
              onMouseLeave={() => setHoverId((cur) => (cur === n.id ? null : cur))}
              onMouseDown={(e) => onNodeMouseDown(e, n.id)}
              onContextMenu={(e) => onNodeContextMenu(e, n.id)}
              onClick={(e) => onNodeClick(e, n.id, n)}
              style={{ cursor: 'pointer' }}
            >
              {n.aiLineage && (
                <circle
                  cx={sn.x}
                  cy={sn.y}
                  r={10}
                  style={{ stroke: 'rgb(var(--accent))', fill: 'none', opacity: 0.5 }}
                />
              )}
              <circle
                cx={sn.x}
                cy={sn.y}
                r={6}
                style={{ fill: 'rgb(var(--accent))', fillOpacity: opacity }}
              />
              {hoverId === n.id && (
                <text
                  x={sn.x + 10}
                  y={sn.y + 4}
                  fontSize="11"
                  style={{ fill: 'rgb(var(--ink))' }}
                >
                  {n.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
})
