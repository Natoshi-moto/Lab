// Sweep 23 — "Route to…" dropdown for an Inbox item.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../../context'
import type { InboxItem, RouteKind } from '../../types'
import { jumpToSelection, ROUTE_FOR_TYPE, type JumpableKind } from '../../util/navigate'

const ROUTE_TO_SCRAP_SELECTOR = 'route-to-scrap'

const OPTIONS: { kind: RouteKind, label: string, jumpable?: JumpableKind }[] = [
  { kind: 'document', label: 'Document', jumpable: 'document' },
  { kind: 'poem',     label: 'Poem',     jumpable: 'poem'     },
  { kind: 'note',     label: 'Note',     jumpable: 'note'     },  // Sweep 27
  { kind: 'scrap',    label: 'Scrap'                         },
  { kind: 'longform', label: 'Longform', jumpable: 'longform' },
  { kind: 'pattern',  label: 'Pattern',  jumpable: 'pattern'  },
  { kind: 'pipeline', label: 'Pipeline', jumpable: 'pipeline' },
  { kind: 'build',    label: 'Build',    jumpable: 'build'    }
]

export function RouteToButton({ item }: { item: InboxItem }): JSX.Element {
  const ws = useWorkspace()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [open])

  async function handleSelect(kind: RouteKind, jumpable?: JumpableKind) {
    setOpen(false)
    if (kind === 'longform' && item.body && item.body.trim() !== '') {
      const proceed = window.confirm(
        'Routing to Longform discards the body content (Longform docs hold sections, not free body text). Proceed?'
      )
      if (!proceed) return
    }
    const newId = await ws.routeInboxItemTo(item.id, kind)
    if (!newId) return
    if (kind === 'scrap') {
      navigate('/projects')
      return
    }
    if (!jumpable) return
    jumpToSelection({ kind: jumpable, id: newId })
    navigate(ROUTE_FOR_TYPE[jumpable])
  }

  const disabled = !!item.doneAt || !!item.dismissedAt || !!item.deletedAt

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
        data-test="inbox-route-to"
      >
        Route to…
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 right-0 z-10 bg-surface border border-line rounded shadow-md min-w-[140px]"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.kind}
              onClick={() => handleSelect(opt.kind, opt.jumpable)}
              className="w-full text-left text-xs text-ink-soft hover:text-ink hover:bg-surface-2 px-3 py-1.5"
              data-test={opt.kind === 'scrap' ? ROUTE_TO_SCRAP_SELECTOR : `route-to-${opt.kind}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
