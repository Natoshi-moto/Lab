// Sweep 23 — heuristic "you might also want this" chip strip.
//
// Mounted directly below LinksPanel in the same seven editor surfaces.
// Empty → renders nothing. Click → navigates to the related record.

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context'
import type { LinkableType } from '../types'
import { jumpToSelection, ROUTE_FOR_TYPE, type JumpableKind } from '../util/navigate'
import { relatedTo, type RelatedWorkspace } from '../util/related'

interface RelatedStripProps {
  recordId:   string
  recordType: LinkableType
}

const KIND_ICON: Record<LinkableType, string> = {
  document:        'Doc',
  poem:            'Poem',
  longform:        'LF',
  'longform-section': 'Sec',
  build:           'Bld',
  project:         'Prj',
  pattern:         'Pat',
  pipeline:        'Pip',
  note:            'Note',  // Sweep 27
  scrap:           'Scrap',
  'inbox-item':    'Inbox',
  prompt:          'Prompt'
}

function truncate(s: string, n: number): string {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function jumpableForLinkable(t: LinkableType): JumpableKind | null {
  switch (t) {
    case 'document': return 'document'
    case 'poem':     return 'poem'
    case 'longform': return 'longform'
    case 'build':    return 'build'
    case 'project':  return 'project'
    case 'pattern':  return 'pattern'
    case 'pipeline': return 'pipeline'
    case 'note':     return 'note'  // Sweep 27
    case 'longform-section':
    case 'scrap':
    case 'inbox-item':
    case 'prompt':
      return null
  }
}

export function RelatedStrip({ recordId, recordType }: RelatedStripProps): JSX.Element | null {
  const ws = useWorkspace()
  const navigate = useNavigate()

  const related = useMemo(() => {
    const w: RelatedWorkspace = {
      documents:    ws.documents,
      poems:        ws.poems,
      longformDocs: ws.longformDocs,
      builds:       ws.builds,
      patterns:     ws.patterns,
      pipelines:    ws.pipelines,
      links:        ws.links,
      tagLinks:     ws.tagLinks
    }
    return relatedTo(recordId, recordType, w)
  }, [
    recordId, recordType,
    ws.documents, ws.poems, ws.longformDocs, ws.builds,
    ws.patterns, ws.pipelines, ws.links, ws.tagLinks
  ])

  if (related.length === 0) return null

  function nameFor(targetId: string, targetType: LinkableType): string {
    switch (targetType) {
      case 'document': return ws.documents.find((d) => d.id === targetId)?.title ?? '(missing)'
      case 'poem':     return ws.poems.find((p) => p.id === targetId)?.title ?? '(missing)'
      case 'longform': return ws.longformDocs.find((p) => p.id === targetId)?.title ?? '(missing)'
      case 'build':    return ws.builds.find((b) => b.id === targetId)?.name ?? '(missing)'
      case 'pattern':  return ws.patterns.find((p) => p.id === targetId)?.name ?? '(missing)'
      case 'pipeline': return ws.pipelines.find((p) => p.id === targetId)?.name ?? '(missing)'
      default: return '(missing)'
    }
  }

  function onChipClick(targetId: string, targetType: LinkableType) {
    const kind = jumpableForLinkable(targetType)
    if (!kind) return
    jumpToSelection({ kind, id: targetId })
    navigate(ROUTE_FOR_TYPE[kind])
  }

  return (
    <div
      className="border-b border-line bg-surface px-6 py-2 flex flex-wrap items-center gap-1.5"
      data-test="related-strip"
      data-record-id={recordId}
      data-record-type={recordType}
    >
      <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mr-1">Related</span>
      {related.map((r) => (
        <button
          key={`${r.targetType}:${r.targetId}`}
          onClick={() => onChipClick(r.targetId, r.targetType)}
          className="text-[11px] px-2 py-0.5 rounded bg-surface-2 text-ink-soft hover:text-ink hover:bg-surface-3 inline-flex items-center gap-1.5"
          data-test="related-chip"
          data-related-target-id={r.targetId}
          data-related-target-type={r.targetType}
          title={r.reasons.join(' · ')}
        >
          <span className="text-[9px] uppercase tracking-widest text-ink-faint">
            {KIND_ICON[r.targetType] ?? '?'}
          </span>
          <span className="truncate max-w-[160px]">
            {truncate(nameFor(r.targetId, r.targetType), 30) || '(untitled)'}
          </span>
        </button>
      ))}
    </div>
  )
}
