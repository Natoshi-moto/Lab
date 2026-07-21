// Sweep 23 — Inbox item editor (right column).
//
// Title and body use the savedRef pattern (canonical: WritingStudio.tsx).
// Timer fields write through immediately on change; touch:true bumps
// updatedAt so the list re-sorts.

import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import type { InboxItem, InboxRecurrence } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { msToLocalDatetimeInputValue, localDatetimeInputValueToMs } from '../../util/datetime'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { RouteToButton } from './RouteToButton'

export function InboxItemEditor({ item }: { item: InboxItem }): JSX.Element {
  const ws = useWorkspace()
  const setFocus = useSetFocus()

  useEffect(() => {
    ws.setActiveRecord({ id: item.id, type: 'inbox-item' })
    setFocus({ id: item.id, type: 'inbox-item', origin: 'inbox' })
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [item.id, ws, setFocus])

  const [draft, setDraft] = useState({ title: item.title, body: item.body })
  const savedRef = useRef({ title: item.title, body: item.body })

  // Sync draft when item is updated externally (e.g. timer fire / restore).
  useEffect(() => {
    if (item.title !== savedRef.current.title || item.body !== savedRef.current.body) {
      savedRef.current = { title: item.title, body: item.body }
      setDraft({ title: item.title, body: item.body })
    }
  }, [item.title, item.body])

  const isDirty = draft.title !== item.title || draft.body !== item.body
  const signature = draft.title + '\u0000' + draft.body
  useDebouncedAutosave(signature, isDirty, () => {
    savedRef.current = { title: draft.title, body: draft.body }
    ws.updateInboxItem(item.id, draft, { touch: true })
  })

  function onDueAtChange(value: string) {
    const ms = localDatetimeInputValueToMs(value)
    // When dueAt changes, clear lastFiredAt so the engine re-evaluates.
    // This is load-bearing: without it, editing a time forward could leave
    // lastFiredAt >= old-dueAt and the new dueAt would never fire.
    ws.updateInboxItem(
      item.id,
      { dueAt: Number.isFinite(ms) ? ms : undefined, lastFiredAt: undefined },
      { touch: true }
    )
  }

  function onRecurrenceChange(value: InboxRecurrence) {
    ws.updateInboxItem(item.id, { recurrence: value }, { touch: true })
  }

  function onSnoozeOneHour() {
    ws.updateInboxItem(
      item.id,
      { dueAt: Date.now() + 3_600_000, lastFiredAt: undefined },
      { touch: true }
    )
  }

  function onMarkDone() {
    ws.markInboxItemDone(item.id)
  }

  function onDismiss() {
    ws.dismissInboxItem(item.id)
  }

  function onRestore() {
    ws.updateInboxItem(item.id, { doneAt: undefined, dismissedAt: undefined })
  }

  const isDone = !!item.doneAt
  const isDismissed = !!item.dismissedAt
  const recurrence = item.recurrence ?? 'none'

  return (
    <div className="h-full flex flex-col" data-test="inbox-editor" data-inbox-id={item.id}>
      <header className="border-b border-line px-6 py-3 flex items-center gap-3">
        <input
          className="title-input flex-1 text-lg text-ink"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Title"
          data-test="inbox-title-input"
        />

        <RouteToButton item={item} />

        {isDone || isDismissed ? (
          <button
            onClick={onRestore}
            className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2"
            data-test="inbox-restore"
          >
            Restore
          </button>
        ) : (
          <>
            <button
              onClick={onMarkDone}
              className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2"
              data-test="inbox-done"
            >
              Done
            </button>
            <InlineConfirmButton
              onConfirm={onDismiss}
              label="Dismiss"
              confirmLabel="Confirm?"
              className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface-2"
              data-test="inbox-dismiss"
            />
          </>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3 px-6 py-2 border-b border-line bg-surface">
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">Timer</span>
        <input
          type="datetime-local"
          value={msToLocalDatetimeInputValue(item.dueAt)}
          onChange={(e) => onDueAtChange(e.target.value)}
          className="text-xs text-ink bg-surface-2 border border-line rounded px-2 py-1"
          data-test="inbox-due-input"
        />
        <select
          value={recurrence}
          onChange={(e) => onRecurrenceChange(e.target.value as InboxRecurrence)}
          className="text-xs text-ink bg-surface-2 border border-line rounded px-2 py-1"
          data-test="inbox-recurrence-select"
        >
          <option value="none">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button
          onClick={onSnoozeOneHour}
          className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2"
          data-test="inbox-snooze"
        >
          Snooze 1h
        </button>
      </div>

      <textarea
        className="editor-surface flex-1 px-8 py-6 text-ink"
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Drop the thought…"
        data-test="inbox-body-input"
      />
    </div>
  )
}
