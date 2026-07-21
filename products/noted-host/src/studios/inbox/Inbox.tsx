// Sweep 23 — Inbox studio shell. Two-column: list left, editor right.

import { useEffect, useState } from 'react'
import { useWorkspace } from '../../context'
import { InboxList } from './InboxList'
import { InboxItemEditor } from './InboxItemEditor'

const LAST_KEY = 'verse-studio:inbox:lastItem'

export function Inbox() {
  const ws = useWorkspace()
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_KEY) } catch { return null }
  })

  // Drop selection if the item is gone.
  useEffect(() => {
    if (selectedId && !ws.inboxItems.find((i) => i.id === selectedId)) {
      setSelectedId(null)
    }
  }, [selectedId, ws.inboxItems])

  // Persist selection.
  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(LAST_KEY, selectedId)
      else localStorage.removeItem(LAST_KEY)
    } catch {}
  }, [selectedId])

  const selected = selectedId ? ws.inboxItems.find((i) => i.id === selectedId) ?? null : null

  return (
    <div className="h-full flex">
      <InboxList
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div className="flex-1 min-w-0">
        {selected ? (
          <InboxItemEditor key={selected.id} item={selected} />
        ) : (
          <div className="h-full flex items-center justify-center text-ink-faint text-sm">
            Select an item or create a new one.
          </div>
        )}
      </div>
    </div>
  )
}
