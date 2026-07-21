// Sweep 23 — pure-functional force-directed simulation step.
// Hand-rolled, no d3-force. Constants are fixed by spec.

export interface SimNode {
  id: string  // synthetic: `${type}:${recordId}`
  x: number
  y: number
  vx: number
  vy: number
  pinned: boolean
}

export interface SimEdge {
  source: string
  target: string
}

export interface SimParams {
  width: number
  height: number
  charge: number       // node-node repulsion strength (use -30)
  linkDistance: number // ideal edge length in px (use 80)
  damping: number      // velocity damping per step (use 0.85)
  centering: number    // pull toward (width/2, height/2) (use 0.01)
}

const SPRING_K = 0.05

/**
 * Run one simulation step.
 *
 * Forces:
 *   1. Coulomb-like repulsion between every node pair (O(n^2)).
 *   2. Hooke-like spring along each edge (k = SPRING_K).
 *   3. Centering pull toward the canvas center (params.centering).
 *   4. Damping applied to velocity each step (params.damping).
 *   5. Pinned nodes have velocity zeroed and position preserved
 *      (callers update pinned positions via drag, not via the sim).
 */
export function stepSimulation(
  nodes: SimNode[],
  edges: SimEdge[],
  params: SimParams
): SimNode[] {
  // Work on a shallow copy so callers can keep their previous frame.
  const out = nodes.map((n) => ({ ...n }))
  const byId: Record<string, SimNode> = {}
  for (const n of out) byId[n.id] = n

  // 1. Coulomb-like repulsion. params.charge is negative (-30 by spec)
  //    meaning repulsion. Force ~ charge / r^2.
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const a = out[i]
      const b = out[j]
      let dx = b.x - a.x
      let dy = b.y - a.y
      let dsq = dx * dx + dy * dy
      if (dsq < 0.01) {
        // Avoid divide-by-zero: nudge apart deterministically.
        dx = 0.1; dy = 0.1; dsq = 0.02
      }
      const dist = Math.sqrt(dsq)
      // F = charge / dsq, applied along the line. charge < 0 so this pushes apart.
      const f = params.charge / dsq
      const fx = f * (dx / dist)
      const fy = f * (dy / dist)
      // Newton's third law.
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }
  }

  // 2. Spring along edges. Pull toward linkDistance.
  for (const e of edges) {
    const a = byId[e.source]
    const b = byId[e.target]
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
    const delta = dist - params.linkDistance
    const f = SPRING_K * delta
    const fx = f * (dx / dist)
    const fy = f * (dy / dist)
    a.vx += fx
    a.vy += fy
    b.vx -= fx
    b.vy -= fy
  }

  // 3. Centering pull.
  const cx = params.width / 2
  const cy = params.height / 2
  for (const n of out) {
    n.vx += (cx - n.x) * params.centering
    n.vy += (cy - n.y) * params.centering
  }

  // 4. Damping + 5. Pinned handling + integrate position.
  for (const n of out) {
    if (n.pinned) {
      n.vx = 0
      n.vy = 0
      continue
    }
    n.vx *= params.damping
    n.vy *= params.damping
    n.x += n.vx
    n.y += n.vy
  }

  return out
}
