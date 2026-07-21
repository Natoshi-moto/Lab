// Sweep 23 — Atlas. Hand-rolled SVG force-directed graph of records,
// tags, and projects. Two-column: filters left (200px), graph fills.

import { useMemo, useRef, useState } from 'react'
import { useWorkspace } from '../../context'
import { AtlasFilters, type AtlasKindKey, type EdgeKindKey, ALL_KINDS, ALL_EDGE_KINDS } from './AtlasFilters'
import { AtlasGraph, type AtlasGraphHandle } from './AtlasGraph'
import type { LinkableType } from '../../types'

interface SimEdge { source: string, target: string, color?: string, weight?: number }

interface AtlasNodeInput {
  id: string
  type: 'record' | 'tag' | 'project'
  kind: string
  name: string
  aiLineage: boolean
}

const KIND_TO_LINKABLE: Record<AtlasKindKey, LinkableType | null> = {
  document: 'document',
  note:     'note',  // Sweep 27
  poem:     'poem',
  longform: 'longform',
  build:    'build',
  pattern:  'pattern',
  pipeline: 'pipeline',
  section:  'longform-section',
  project:  null  // projects are handled outside the LinkableType-only set
}

export function Atlas() {
  const ws = useWorkspace()
  const [enabledKinds, setEnabledKinds] = useState<Record<AtlasKindKey, boolean>>(
    () => Object.fromEntries(ALL_KINDS.map((k) => [k, true])) as Record<AtlasKindKey, boolean>
  )
  const [enabledEdges, setEnabledEdges] = useState<Record<EdgeKindKey, boolean>>(
    () => Object.fromEntries(ALL_EDGE_KINDS.map((k) => [k, true])) as Record<EdgeKindKey, boolean>
  )
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set())
  const [projectFilter, setProjectFilter] = useState<string | 'all'>('all')

  function resolveSemanticColor(_semanticColorId: string | null | undefined): string | undefined {
    // Sweep 46: SemanticColor records do not exist yet. Keep the field
    // plumbed through the Atlas data shape so future color resolution can
    // drop in without touching the graph renderer again.
    return undefined
  }

  function resolveLinkWeight(weight: number | null | undefined): number | undefined {
    if (typeof weight !== 'number' || !Number.isFinite(weight)) return undefined
    return Math.max(1, weight)
  }

  const { nodes, edges } = useMemo(() => {
    const nodes: AtlasNodeInput[] = []

    function pushIfKind(kind: AtlasKindKey, fn: () => void) {
      if (enabledKinds[kind]) fn()
    }

    pushIfKind('document', () => {
      for (const d of ws.documents) {
        if (d.deletedAt != null) continue
        if (projectFilter !== 'all' && d.projectId !== projectFilter) continue
        nodes.push({ id: `document:${d.id}`, type: 'record', kind: 'document', name: d.title || 'Untitled', aiLineage: d.aiLineage === true })
      }
    })
    pushIfKind('note', () => {  // Sweep 27 — same pattern as document/poem
      for (const n of ws.notes) {
        if (n.deletedAt != null) continue
        if (projectFilter !== 'all' && n.projectId !== projectFilter) continue
        nodes.push({ id: `note:${n.id}`, type: 'record', kind: 'note', name: n.title || 'Untitled', aiLineage: n.aiLineage === true })
      }
    })
    pushIfKind('poem', () => {
      for (const p of ws.poems) {
        if (p.deletedAt != null) continue
        if (projectFilter !== 'all' && p.projectId !== projectFilter) continue
        nodes.push({ id: `poem:${p.id}`, type: 'record', kind: 'poem', name: p.title || 'Untitled', aiLineage: p.aiLineage === true })
      }
    })
    pushIfKind('longform', () => {
      for (const lf of ws.longformDocs) {
        if (lf.deletedAt != null) continue
        if (projectFilter !== 'all' && lf.projectId !== projectFilter) continue
        nodes.push({ id: `longform:${lf.id}`, type: 'record', kind: 'longform', name: lf.title || 'Untitled', aiLineage: lf.aiLineage === true })
      }
    })
    pushIfKind('build', () => {
      for (const b of ws.builds) {
        if (b.deletedAt != null) continue
        if (projectFilter !== 'all' && b.projectId !== projectFilter) continue
        nodes.push({ id: `build:${b.id}`, type: 'record', kind: 'build', name: b.name || 'Untitled', aiLineage: b.aiLineage === true })
      }
    })
    pushIfKind('pattern', () => {
      for (const pat of ws.patterns) {
        if (pat.deletedAt != null) continue
        if (projectFilter !== 'all' && pat.projectId !== projectFilter) continue
        nodes.push({ id: `pattern:${pat.id}`, type: 'record', kind: 'pattern', name: pat.name || 'Untitled', aiLineage: pat.aiLineage === true })
      }
    })
    pushIfKind('pipeline', () => {
      for (const pip of ws.pipelines) {
        if (pip.deletedAt != null) continue
        if (projectFilter !== 'all' && pip.projectId !== projectFilter) continue
        nodes.push({ id: `pipeline:${pip.id}`, type: 'record', kind: 'pipeline', name: pip.name || 'Untitled', aiLineage: pip.aiLineage === true })
      }
    })
    pushIfKind('section', () => {
      // Bug 2.10 (Sweep 26) — P0 silent-lie fix.
      //
      // Pre-26 this loop pushed every longform section regardless of the
      // selected project filter. Atlas would render a graph that looked
      // scoped to Project A but was actually polluted with sections from
      // Project B, C, ... — silently. The user saw a wrong picture and
      // trusted it.
      //
      // Fix: section.projectId points at the parent LongformDoc.id (NOT a
      // universal Project.id — see types.ts header comment for the rename
      // history). So we look up the parent doc and check ITS projectId
      // against the filter.
      for (const sec of ws.sections) {
        if (projectFilter !== 'all') {
          const parentDoc = ws.longformDocs.find((d) => d.id === sec.projectId)
          if (!parentDoc || parentDoc.projectId !== projectFilter) continue
        }
        nodes.push({ id: `longform-section:${sec.id}`, type: 'record', kind: 'longform-section', name: sec.title || 'Untitled', aiLineage: sec.aiLineage === true })
      }
    })

    if (enabledKinds.project) {
      for (const proj of ws.projects) {
        if (projectFilter !== 'all' && proj.id !== projectFilter) continue
        nodes.push({ id: `project:${proj.id}`, type: 'project', kind: 'project', name: proj.name || 'Untitled', aiLineage: false })
      }
    }

    // Tags: include all tags whose target nodes appear in the node set, when
    // the 'tag' edge kind is enabled. Tag kind toggle: tags don't have their
    // own kind toggle in the filter list (per spec — 8 record kinds) so we
    // gate on the tagLink edge filter.
    if (enabledEdges.tagLinks) {
      const inUseTagIds = new Set<string>()
      const nodeKeys = new Set(nodes.map((n) => n.id))
      for (const tl of ws.tagLinks) {
        const candidateKey = `${tl.targetType}:${tl.targetId}`
        if (nodeKeys.has(candidateKey)) inUseTagIds.add(tl.tagId)
      }
      for (const t of ws.tags) {
        if (!inUseTagIds.has(t.id)) continue
        nodes.push({ id: `tag:${t.id}`, type: 'tag', kind: 'tag', name: t.name, aiLineage: false })
      }
    }

    // Tag AND-filter: when any tags selected, restrict to nodes connected to
    // ALL of them (record nodes; tag nodes themselves stay).
    let visibleNodes = nodes
    if (tagFilter.size > 0) {
      const tagsByCandidate: Map<string, Set<string>> = new Map()
      for (const tl of ws.tagLinks) {
        const key = `${tl.targetType}:${tl.targetId}`
        let set = tagsByCandidate.get(key)
        if (!set) { set = new Set(); tagsByCandidate.set(key, set) }
        set.add(tl.tagId)
      }
      visibleNodes = nodes.filter((n) => {
        if (n.type === 'tag') return tagFilter.has(n.id.replace(/^tag:/, ''))
        const tags = tagsByCandidate.get(n.id)
        if (!tags) return false
        for (const tid of tagFilter) if (!tags.has(tid)) return false
        return true
      })
    }

    const visibleKeys = new Set(visibleNodes.map((n) => n.id))

    const edges: SimEdge[] = []

    if (enabledEdges.tagLinks) {
      for (const tl of ws.tagLinks) {
        const sKey = `tag:${tl.tagId}`
        const tKey = `${tl.targetType}:${tl.targetId}`
        if (!visibleKeys.has(sKey) || !visibleKeys.has(tKey)) continue
        edges.push({ source: sKey, target: tKey })
      }
    }
    if (enabledEdges.links) {
      for (const l of ws.links) {
        const sKey = `${l.sourceType}:${l.sourceId}`
        const tKey = `${l.targetType}:${l.targetId}`
        if (!visibleKeys.has(sKey) || !visibleKeys.has(tKey)) continue
        edges.push({
          source: sKey,
          target: tKey,
          color: resolveSemanticColor(l.semanticColorId),
          weight: resolveLinkWeight(l.weight)
        })
      }
    }
    if (enabledEdges['project-membership']) {
      function pushProjectEdge(recordKey: string, projectId: string | undefined) {
        if (!projectId) return
        const pKey = `project:${projectId}`
        if (!visibleKeys.has(recordKey) || !visibleKeys.has(pKey)) return
        edges.push({ source: pKey, target: recordKey })
      }
      for (const d of ws.documents)    pushProjectEdge(`document:${d.id}`, d.projectId)
      for (const n of ws.notes)        pushProjectEdge(`note:${n.id}`, n.projectId)  // Sweep 27
      for (const p of ws.poems)        pushProjectEdge(`poem:${p.id}`, p.projectId)
      for (const lf of ws.longformDocs) pushProjectEdge(`longform:${lf.id}`, lf.projectId)
      for (const b of ws.builds)       pushProjectEdge(`build:${b.id}`, b.projectId)
      for (const pat of ws.patterns)   pushProjectEdge(`pattern:${pat.id}`, pat.projectId)
      for (const pip of ws.pipelines)  pushProjectEdge(`pipeline:${pip.id}`, pip.projectId)
    }

    return { nodes: visibleNodes, edges }
  }, [
    ws.documents, ws.poems, ws.longformDocs, ws.builds, ws.patterns, ws.pipelines,
    ws.sections, ws.projects, ws.tags, ws.tagLinks, ws.links,
    enabledKinds, enabledEdges, tagFilter, projectFilter
  ])

  // Sweep 23.1: imperative handle to the AtlasGraph SVG so the filter
  // sidebar's viewport buttons (Fit to view, Zoom in, Zoom out) can drive
  // viewBox state without prop-drilling.
  const graphRef = useRef<AtlasGraphHandle>(null)

  return (
    <div className="h-full flex">
      <AtlasFilters
        enabledKinds={enabledKinds}
        onKindToggle={(k, v) => setEnabledKinds((s) => ({ ...s, [k]: v }))}
        enabledEdges={enabledEdges}
        onEdgeToggle={(k, v) => setEnabledEdges((s) => ({ ...s, [k]: v }))}
        allTags={ws.tags.map((t) => ({ id: t.id, name: t.name }))}
        tagFilter={tagFilter}
        onTagFilterToggle={(id) =>
          setTagFilter((cur) => {
            const next = new Set(cur)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })
        }
        allProjects={ws.projects.map((p) => ({ id: p.id, name: p.name }))}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        onResetLayout={() => { ws.clearNodePositions(); graphRef.current?.resetView() }}
        onFitToView={() => graphRef.current?.fitToView()}
        onZoomIn={() => graphRef.current?.zoomIn()}
        onZoomOut={() => graphRef.current?.zoomOut()}
      />
      <div className="flex-1 min-w-0 relative">
        <AtlasGraph
          ref={graphRef}
          nodes={nodes}
          edges={edges}
          // Bug 2.3 (Sweep 26): auto-fit on settle. AtlasGraph fires this
          // when the simulation settles (settle counter ≥ 30) AND the
          // settledFiredRef hasn't fired since the last seedNodes regen.
          // This subsumes Bug 2.6 — filter changes trigger seedNodes to
          // recompute, which resets settledFiredRef, which causes the
          // post-filter sim to fire onSettled again on its first settle.
          onSettled={() => graphRef.current?.fitToView()}
        />
      </div>
    </div>
  )
}
