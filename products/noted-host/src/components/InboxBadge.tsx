// Sweep 23 — Inbox sidebar entry badge.
//
// Two contributors:
//   1. Inbox items past their dueAt that haven't been fired since (i.e. the
//      reminder engine should have fired them but the user hasn't seen the
//      toast yet — this includes the silent catch-up pass on boot).
//   2. Live notification queue size.
//
// Hidden when count is 0 (returns null so the test can assert
// `count() === 0`).

import { useEffect, useMemo } from 'react'
import { useWorkspace } from '../context'
import { APP_TITLE } from '../appMeta'

export function useInboxBadgeCount(): number {
  const ws = useWorkspace()
  return useMemo(() => {
    let due = 0
    const now = Date.now()
    for (const it of ws.inboxItems) {
      if (it.dueAt == null) continue
      if (it.dueAt > now) continue
      if (it.lastFiredAt != null && it.lastFiredAt >= it.dueAt) continue
      if (it.dismissedAt != null) continue
      if (it.doneAt != null) continue
      if (it.deletedAt != null) continue
      due++
    }
    return due + ws.notificationQueue.length
    // notificationTick covers queue mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.inboxItems, ws.notificationTick])
}

interface InboxBadgeProps {
  /** Compact rendering for the rail-collapsed sidebar. */
  compact?: boolean
}

export function InboxBadge({ compact }: InboxBadgeProps): JSX.Element | null {
  const count = useInboxBadgeCount()

  // Co-located document.title side-effect — the spec's badge-and-tab-title
  // pair lives here per the prompt.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const baseTitle = APP_TITLE
    if (count > 0) document.title = `(${count}) ${baseTitle}`
    else document.title = baseTitle
  }, [count])

  if (count === 0) return null

  if (compact) {
    return (
      <span
        className="absolute -top-1 -right-1 text-[9px] leading-none px-1 py-0.5 rounded-full bg-accent text-ink min-w-[14px] text-center"
        data-test="inbox-badge"
      >
        {count}
      </span>
    )
  }
  return (
    <span
      className="text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-accent text-ink min-w-[16px] text-center"
      data-test="inbox-badge"
    >
      {count}
    </span>
  )
}
