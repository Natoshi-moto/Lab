// Sweep 23 — Atlas filter panel.

import { useEffect, useRef, useState } from 'react'

export type AtlasKindKey =
  | 'document' | 'note' | 'poem' | 'longform' | 'build'
  | 'pattern'  | 'pipeline' | 'section' | 'project'

export type EdgeKindKey = 'links' | 'tagLinks' | 'project-membership'

export const ALL_KINDS: AtlasKindKey[] = [
  'document', 'note', 'poem', 'longform', 'build',
  'pattern', 'pipeline', 'section', 'project'
]

export const ALL_EDGE_KINDS: EdgeKindKey[] = ['links', 'tagLinks', 'project-membership']

const KIND_LABEL: Record<AtlasKindKey, string> = {
  document: 'Documents',
  note:     'Notes',  // Sweep 27
  poem:     'Poems',
  longform: 'Longform',
  build:    'Builds',
  pattern:  'Patterns',
  pipeline: 'Pipelines',
  section:  'Sections',
  project:  'Projects'
}

const EDGE_LABEL: Record<EdgeKindKey, string> = {
  links:               'Links',
  tagLinks:            'Tag links',
  'project-membership':'Project members'
}

interface Props {
  enabledKinds: Record<AtlasKindKey, boolean>
  onKindToggle: (k: AtlasKindKey, v: boolean) => void
  enabledEdges: Record<EdgeKindKey, boolean>
  onEdgeToggle: (k: EdgeKindKey, v: boolean) => void
  allTags: { id: string, name: string }[]
  tagFilter: Set<string>
  onTagFilterToggle: (id: string) => void
  allProjects: { id: string, name: string }[]
  projectFilter: string | 'all'
  onProjectFilterChange: (v: string | 'all') => void
  onResetLayout: () => void
  // Sweep 23.1: viewport buttons.
  onFitToView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export function AtlasFilters(props: Props): JSX.Element {
  const [tagOpen, setTagOpen] = useState(false)
  const tagBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tagOpen) return
    function onMouseDown(e: MouseEvent) {
      if (tagBoxRef.current && !tagBoxRef.current.contains(e.target as Node)) {
        setTagOpen(false)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [tagOpen])

  return (
    <aside
      className="w-50 shrink-0 border-r border-line bg-surface-2 overflow-y-auto p-3 text-sm space-y-4"
      style={{ width: '200px' }}
      data-test="atlas-filters"
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-1.5">
          Record kinds
        </div>
        <div className="space-y-1">
          {ALL_KINDS.map((k) => (
            <label
              key={k}
              className="flex items-center gap-2 text-xs text-ink-soft hover:text-ink cursor-pointer"
            >
              <input
                type="checkbox"
                checked={props.enabledKinds[k]}
                onChange={(e) => props.onKindToggle(k, e.target.checked)}
                data-test={`atlas-filter-kind-${k}`}
              />
              <span>{KIND_LABEL[k]}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-1.5">
          Edge kinds
        </div>
        <div className="space-y-1">
          {ALL_EDGE_KINDS.map((k) => (
            <label
              key={k}
              className="flex items-center gap-2 text-xs text-ink-soft hover:text-ink cursor-pointer"
            >
              <input
                type="checkbox"
                checked={props.enabledEdges[k]}
                onChange={(e) => props.onEdgeToggle(k, e.target.checked)}
                data-test={`atlas-filter-edge-${k}`}
              />
              <span>{EDGE_LABEL[k]}</span>
            </label>
          ))}
        </div>
      </div>

      <div ref={tagBoxRef}>
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-1.5">
          Tags (AND)
        </div>
        <button
          onClick={() => setTagOpen((o) => !o)}
          className="w-full text-left text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-3"
          data-test="atlas-filter-tags-toggle"
        >
          {props.tagFilter.size === 0 ? 'All tags' : `${props.tagFilter.size} selected`}
        </button>
        {tagOpen && (
          <div className="mt-1 max-h-40 overflow-y-auto bg-surface border border-line rounded">
            {props.allTags.length === 0 && (
              <div className="text-xs text-ink-faint italic px-2 py-1.5">No tags yet</div>
            )}
            {props.allTags.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2 text-xs text-ink-soft hover:text-ink hover:bg-surface-2 px-2 py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={props.tagFilter.has(t.id)}
                  onChange={() => props.onTagFilterToggle(t.id)}
                  data-test="atlas-filter-tag"
                  data-tag-id={t.id}
                />
                <span>{t.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-1.5">
          Project
        </div>
        <select
          value={props.projectFilter}
          onChange={(e) => props.onProjectFilterChange(e.target.value === 'all' ? 'all' : e.target.value)}
          className="w-full text-xs text-ink bg-surface border border-line rounded px-2 py-1"
          data-test="atlas-filter-project"
        >
          <option value="all">All projects</option>
          {props.allProjects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Sweep 23.1: viewport controls. Wheel-zoom and shift+drag pan
          live in AtlasGraph; these buttons are the keyboard-free affordance. */}
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-1.5">
          View
        </div>
        <button
          onClick={props.onFitToView}
          className="w-full text-xs text-ink-soft hover:text-ink rounded px-2 py-1.5 border border-line hover:bg-surface-3"
          data-test="atlas-fit-to-view"
        >
          Fit to view
        </button>
        <div className="flex gap-1">
          <button
            onClick={props.onZoomIn}
            className="flex-1 text-xs text-ink-soft hover:text-ink rounded px-2 py-1.5 border border-line hover:bg-surface-3"
            data-test="atlas-zoom-in"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={props.onZoomOut}
            className="flex-1 text-xs text-ink-soft hover:text-ink rounded px-2 py-1.5 border border-line hover:bg-surface-3"
            data-test="atlas-zoom-out"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      </div>

      <button
        onClick={props.onResetLayout}
        className="w-full text-xs text-ink-soft hover:text-ink rounded px-2 py-1.5 border border-line hover:bg-surface-3"
        data-test="atlas-filter-reset"
      >
        Reset layout
      </button>
    </aside>
  )
}
