// Sweep 23 — pure reminder evaluation.
//
// Decoupled from the React context so it's trivially unit-testable and the
// fire/no-fire logic is independent of how the patch lands. The context
// thinly wraps this with persistence + notification enqueueing.

import type { InboxItem, InboxRecurrence } from '../types'

/**
 * Pure: given a current InboxItem and `now` in ms, decide whether it
 * should fire and what its post-fire state should be.
 *
 * Returns null if no fire. Returns a patch object plus `fired: true`
 * if it should fire. The patch updates lastFiredAt and (for recurring
 * items) advances dueAt; for non-recurring items, dueAt is cleared.
 */
export function evaluateInboxItem(
  item: InboxItem,
  nowMs: number
): { patch: Partial<InboxItem>; fired: true } | null {
  if (item.deletedAt || item.dismissedAt || item.doneAt) return null
  if (item.dueAt == null) return null
  if (item.dueAt > nowMs) return null
  if (item.lastFiredAt != null && item.lastFiredAt >= item.dueAt) return null

  const recurrence = item.recurrence ?? 'none'
  const nextDueAt = recurrence === 'none' ? undefined : advanceDueAt(item.dueAt, recurrence)

  return {
    fired: true,
    patch: {
      lastFiredAt: nowMs,
      dueAt: nextDueAt,
    },
  }
}

/**
 * Pure helper. Advances a dueAt timestamp by the given recurrence.
 *
 * Monthly uses Date.setMonth, accepting JS's standard month-rollover
 * behaviour (Jan 31 -> Mar 3, etc.).
 */
export function advanceDueAt(currentDueAt: number, recurrence: InboxRecurrence): number | undefined {
  if (recurrence === 'none') return undefined
  if (recurrence === 'daily')  return currentDueAt + 86_400_000
  if (recurrence === 'weekly') return currentDueAt + 7 * 86_400_000
  // monthly
  const d = new Date(currentDueAt)
  d.setMonth(d.getMonth() + 1)
  return d.getTime()
}
