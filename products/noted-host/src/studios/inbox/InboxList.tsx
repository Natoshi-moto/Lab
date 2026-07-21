// Sweep 23 — Inbox list (left column).

import { useState } from 'react'
import { useWorkspace } from '../../context'
import type { InboxItem } from '../../types'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { useResizableListWidth } from '../../util/listPane'

type Filter = 'all' | 'active' | 'with-timer' | 'done' | 'dismissed'

const LIST_WIDTH_KEY = 'verse-studio:inbox:listWidth'

const FILTER_LABELS: Record<Filter, string> = {
  all:          'All',
  active:       'Active',
  'with-timer': 'With Timer',
  done:         'Done',
  dismissed:    'Dismissed'
}

function relativeDue(ts: number): string {
  const diff = ts - Date.now()
  const abs  = Math.abs(diff)
  const mins  = Math.floor(abs / 60_000)
  const hours = Math.floor(abs / 3_600_000)
  const days  = Math.floor(abs / 86_400_000)
  if (diff > 0) {
    if (mins < 1)   return 'fires now'
    if (mins < 60)  return `fires in ${mins}m`
    if (hours < 24) return `fires in ${hours}h`
    return `fires in ${days}d`
  } else {
    if (mins < 1)   return 'just now'
    if (mins < 60)  return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 2)   return 'yesterday'
    return `${days}d ago`
  }
}

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function InboxList({ selectedId, onSelect }: Props): JSX.Element {
  const ws = useWorkspace()
  const [filter, setFilter] = useState<Filter>('all')
  const { width, startResize, isResizing } = useResizableListWidth(LIST_WIDTH_KEY)

  function passesFilter(it: InboxItem): boolean {
    if (it.deletedAt != null) return false
    switch (filter) {
      case 'all':       return true
      case 'active':    return !it.doneAt && !it.dismissedAt
      case 'with-timer':return it.dueAt != null && !it.doneAt && !it.dismissedAt
      case 'done':      return !!it.doneAt
      case 'dismissed': return !!it.dismissedAt
    }
  }

  const items = [...ws.inboxItems]
    .filter(passesFilter)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  async function handleNew() {
    const created = await ws.createInboxItem({ title: '' })
    onSelect(created.id)
  }

  async function handleDelete(id: string) {
    if (selectedId === id) onSelect('')
    await ws.softDeleteInboxItem(id)
  }

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
        aria-label="Resize inbox list"
      />
      <div className="p-3 border-b border-line">
        <button
          onClick={handleNew}
          className="w-full px-3 py-1.5 text-sm rounded border border-line hover:bg-surface-3 text-ink"
          data-test="inbox-new"
        >
          + New
        </button>
      </div>

      <div className="px-2 pt-2 flex flex-wrap gap-1">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
              filter === f
                ? 'bg-surface-3 text-ink'
                : 'text-ink-faint hover:text-ink-soft hover:bg-surface-3/60'
            }`}
            data-test="inbox-filter-chip"
            data-inbox-filter={f}
            data-active={filter === f ? 'true' : 'false'}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div
        className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5"
        data-test="inbox-list"
      >
        {items.length === 0 && (
          <div className="text-xs text-ink-faint px-2 py-3">
            No items.
          </div>
        )}
        {items.map((it) => {
          const recurrence = (it.recurrence ?? 'none')
          const recGlyph = recurrence === 'none' ? '' :
                          recurrence === 'daily' ? '↻d' :
                          recurrence === 'weekly' ? '↻w' :
                          '↻m'
          return (
            <div
              key={it.id}
              className={`group rounded px-2 py-2 transition-colors ${
                selectedId === it.id ? 'bg-surface-3' : 'hover:bg-surface-3'
              }`}
              data-test="inbox-list-item"
              data-inbox-id={it.id}
            >
              <button
                onClick={() => onSelect(it.id)}
                className="w-full text-left text-sm text-ink truncate"
              >
                {it.title || <span className="text-ink-faint italic">Untitled</span>}
              </button>
              <div className="flex items-center justify-between mt-0.5 gap-2">
                <span className="text-[10px] text-ink-faint truncate">
                  {it.dueAt != null ? relativeDue(it.dueAt) : ''}
                  {it.doneAt ? ' · done' : ''}
                  {it.dismissedAt ? ' · dismissed' : ''}
                  {recGlyph ? ` · ${recGlyph}` : ''}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <InlineConfirmButton
                    onConfirm={() => handleDelete(it.id)}
                    label="del"
                    confirmLabel="confirm?"
                    className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
