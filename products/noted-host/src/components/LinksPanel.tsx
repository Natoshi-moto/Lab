// Sweep 23 — relational links UI.
//
// Mounted in seven editor surfaces (Writing, Poetry, Longform, App-Design,
// Prompt, Projects, Library) directly below TagsBar. Lists outgoing and
// incoming Links separately. Cmd+L opens the palette in link-pick mode
// targeting the active record (set by each editor on mount).

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context'
import { useSetFocus } from '../focus/FocusContext'
import type { LinkableType, Link } from '../types'
import { jumpToSelection, ROUTE_FOR_TYPE, type JumpableKind } from '../util/navigate'

interface LinksPanelProps {
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

// Mapping LinkableType → JumpableKind for navigation. longform-section has
// no jumpable kind (it's not a top-level record); we navigate to its parent
// longform doc instead, by resolving via section.projectId.
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

function truncate(s: string, n: number): string {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export function LinksPanel({ recordId, recordType }: LinksPanelProps): JSX.Element {
  const ws = useWorkspace()
  const setFocus = useSetFocus()
  const navigate = useNavigate()
  const [labelEditingId, setLabelEditingId] = useState<string | null>(null)

  // Outgoing/incoming as defined in the spec.
  const outgoing = ws.links.filter(
    (l) => l.sourceId === recordId && l.sourceType === recordType
  )
  const incoming = ws.links.filter(
    (l) => l.targetId === recordId && l.targetType === recordType
  )

  function resolveOther(link: Link, direction: 'outgoing' | 'incoming') {
    const id   = direction === 'outgoing' ? link.targetId   : link.sourceId
    const type = direction === 'outgoing' ? link.targetType : link.sourceType
    let name = '(missing)'
    switch (type) {
      case 'document': {
        const r = ws.documents.find((d) => d.id === id)
        if (r) name = r.title || 'Untitled'
        break
      }
      case 'poem': {
        const r = ws.poems.find((p) => p.id === id)
        if (r) name = r.title || 'Untitled'
        break
      }
      case 'longform': {
        const r = ws.longformDocs.find((p) => p.id === id)
        if (r) name = r.title || 'Untitled'
        break
      }
      case 'longform-section': {
        const r = ws.sections.find((s) => s.id === id)
        if (r) name = r.title || 'Untitled section'
        break
      }
      case 'build': {
        const r = ws.builds.find((b) => b.id === id)
        if (r) name = r.name || 'Untitled'
        break
      }
      case 'project': {
        const r = ws.projects.find((p) => p.id === id)
        if (r) name = r.name || 'Untitled'
        break
      }
      case 'pattern': {
        const r = ws.patterns.find((p) => p.id === id)
        if (r) name = r.name || 'Untitled'
        break
      }
      case 'pipeline': {
        const r = ws.pipelines.find((p) => p.id === id)
        if (r) name = r.name || 'Untitled'
        break
      }
      case 'note': {
        const r = ws.notes.find((n) => n.id === id)
        if (r) name = r.title || 'Untitled'
        break
      }
      case 'scrap': {
        const r = ws.scraps.find((x) => x.id === id)
        if (r) name = r.sourceLabel || r.body.slice(0, 40) || 'Untitled scrap'
        break
      }
      case 'inbox-item': {
        const r = ws.inboxItems.find((x) => x.id === id)
        if (r) name = r.title || 'Untitled inbox item'
        break
      }
      case 'prompt': {
        const r = ws.prompts.find((x) => x.id === id)
        if (r) name = r.title || 'Untitled prompt'
        break
      }
    }
    return { id, type, name }
  }

  function navigateToLinkTarget(otherId: string, otherType: LinkableType) {
    if (otherType === 'longform-section') {
      // Resolve the parent longform doc and navigate there.
      const sec = ws.sections.find((s) => s.id === otherId)
      if (!sec) return
      jumpToSelection({ kind: 'longform', id: sec.projectId })
      navigate(ROUTE_FOR_TYPE['longform'])
      return
    }
    const kind = jumpableForLinkable(otherType)
    if (!kind) return
    jumpToSelection({ kind, id: otherId })
    navigate(ROUTE_FOR_TYPE[kind])
  }

  function openPaletteInLinkPickMode() {
    // Ensure the active record is set to this record before opening.
    ws.setActiveRecord({ id: recordId, type: recordType })
    setFocus({ id: recordId, type: recordType, origin: 'links-panel' })
    // Synthesize a Cmd/Ctrl+L; the global listener (see CommandPalette) opens
    // the palette in link-pick mode bound to the current activeRecord.
    const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
    const ev = new KeyboardEvent('keydown', {
      key: 'l',
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true
    })
    window.dispatchEvent(ev)
  }

  function commitLabel(linkId: string, value: string) {
    ws.updateLink(linkId, { label: value.trim() || undefined })
    setLabelEditingId(null)
  }

  return (
    <div
      className="border-b border-line bg-surface px-6 py-2.5"
      data-test="links-panel"
      data-record-id={recordId}
      data-record-type={recordType}
    >
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">Links</span>
        <button
          onClick={openPaletteInLinkPickMode}
          className="text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink rounded px-1.5 py-0.5 hover:bg-surface-2"
          data-test="link-add"
          title="Add a link (Cmd+L)"
        >
          + Add link
        </button>
      </div>

      {outgoing.length === 0 && incoming.length === 0 && (
        <div className="text-xs text-ink-faint italic">
          No links yet. Cmd+L to add one.
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="space-y-0.5 mb-1">
          {outgoing.map((link) => {
            const other = resolveOther(link, 'outgoing')
            const isEditing = labelEditingId === link.id
            return (
              <div
                key={link.id}
                className="flex items-center gap-2 group"
                data-test="link-row"
                data-link-row-direction="outgoing"
              >
                <span
                  className="text-[10px] uppercase tracking-widest text-ink-faint w-10 shrink-0"
                  data-test="link-row-outgoing"
                >
                  {KIND_ICON[other.type as LinkableType] ?? '?'}
                </span>
                <button
                  onClick={() => navigateToLinkTarget(other.id, other.type as LinkableType)}
                  className="text-xs text-ink-soft hover:text-ink truncate text-left flex-1 min-w-0"
                  data-test="link-row-target"
                  data-link-target-id={other.id}
                  data-link-target-type={other.type}
                >
                  {truncate(other.name, 40)}
                </button>
                {isEditing ? (
                  <input
                    autoFocus
                    defaultValue={link.label ?? ''}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitLabel(link.id, (e.target as HTMLInputElement).value) }
                      else if (e.key === 'Escape') { e.preventDefault(); setLabelEditingId(null) }
                    }}
                    onBlur={(e) => commitLabel(link.id, e.target.value)}
                    className="text-[11px] italic text-ink-soft bg-surface-2 border border-line rounded px-1 py-0.5 w-32"
                    data-test="link-label-input"
                  />
                ) : (
                  <button
                    onClick={() => setLabelEditingId(link.id)}
                    className="text-[11px] italic text-ink-faint hover:text-ink-soft truncate min-w-0 max-w-[140px]"
                    title="Edit label"
                  >
                    {link.label || <span className="text-ink-faint">(label)</span>}
                  </button>
                )}
                <button
                  onClick={() => ws.deleteLink(link.id)}
                  className="text-[10px] text-ink-faint hover:text-bad opacity-0 group-hover:opacity-100 transition-opacity px-1 shrink-0"
                  data-test="link-remove"
                  aria-label="Remove link"
                  title="Remove link"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {incoming.length > 0 && (
        <div className="space-y-0.5 mt-1.5 pt-1.5 border-t border-line/60">
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-0.5">
            Incoming
          </div>
          {incoming.map((link) => {
            const other = resolveOther(link, 'incoming')
            return (
              <div
                key={link.id}
                className="flex items-center gap-2"
                data-test="link-row"
                data-link-row-direction="incoming"
              >
                <span
                  className="text-[10px] uppercase tracking-widest text-ink-faint w-10 shrink-0"
                  data-test="link-row-incoming"
                >
                  {KIND_ICON[other.type as LinkableType] ?? '?'}
                </span>
                <button
                  onClick={() => navigateToLinkTarget(other.id, other.type as LinkableType)}
                  className="text-xs text-ink-soft hover:text-ink truncate text-left flex-1 min-w-0"
                  data-test="link-row-target"
                  data-link-target-id={other.id}
                  data-link-target-type={other.type}
                >
                  {truncate(other.name, 40)}
                </button>
                {link.label && (
                  <span className="text-[11px] italic text-ink-faint truncate max-w-[140px]">
                    {link.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
