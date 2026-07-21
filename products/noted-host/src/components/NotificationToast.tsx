// Sweep 23 — bottom-right notification toast for fired inbox reminders.
//
// Mounted once in App.tsx shell (visible regardless of focus mode — focus
// mode can't suppress real reminders). Reads from the workspace context's
// notificationQueue + notificationTick.
//
// Up to 3 visible at once. Each auto-dismisses after 12s.

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context'
import { playDing } from '../util/sound'

const VISIBLE_LIMIT = 3
const AUTO_DISMISS_MS = 12_000

export function NotificationToast(): JSX.Element | null {
  const ws = useWorkspace()
  const navigate = useNavigate()

  // Play ding when a new fire arrives. Track previous queue length;
  // if it grew, ding once.
  const lastSeenCountRef = useRef(0)
  useEffect(() => {
    const cur = ws.notificationQueue.length
    if (cur > lastSeenCountRef.current) {
      playDing()
    }
    lastSeenCountRef.current = cur
    // Tick is the React-side change signal; queue is a ref so we read
    // through it on each tick change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.notificationTick])

  // Auto-dismiss after 12s. Schedule when notifications change.
  useEffect(() => {
    const visible = ws.notificationQueue.slice(-VISIBLE_LIMIT)
    const handles: number[] = []
    for (const n of visible) {
      const remaining = AUTO_DISMISS_MS - (Date.now() - n.firedAt)
      if (remaining <= 0) {
        ws.dismissNotification(n.id)
        continue
      }
      const h = window.setTimeout(() => ws.dismissNotification(n.id), remaining)
      handles.push(h)
    }
    return () => {
      for (const h of handles) window.clearTimeout(h)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.notificationTick])

  const visible = ws.notificationQueue.slice(-VISIBLE_LIMIT)
  if (visible.length === 0) return null

  function onSnooze(inboxId: string, notifId: string) {
    ws.updateInboxItem(inboxId, {
      dueAt: Date.now() + 3_600_000,
      lastFiredAt: undefined
    })
    ws.dismissNotification(notifId)
  }
  function onDone(inboxId: string, notifId: string) {
    ws.markInboxItemDone(inboxId)
    ws.dismissNotification(notifId)
  }
  function onOpen(inboxId: string, notifId: string) {
    try { localStorage.setItem('verse-studio:inbox:lastItem', inboxId) } catch {}
    navigate('/inbox')
    ws.dismissNotification(notifId)
  }

  function truncate(s: string, n: number): string {
    if (!s) return ''
    return s.length > n ? s.slice(0, n - 1) + '…' : s
  }

  return (
    <div
      className="fixed bottom-10 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {visible.map((n) => (
        <div
          key={n.id}
          data-test="notification-toast"
          data-inbox-id={n.inboxId}
          className="pointer-events-auto w-[320px] n-private-glass border border-line rounded-2xl p-3 n-soft-motion"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Private reminder
              </div>
              <div className="text-sm text-ink truncate" title={n.title}>
                {truncate(n.title, 50) || 'Untitled'}
              </div>
            </div>
            <button
              onClick={() => ws.dismissNotification(n.id)}
              className="text-xs text-ink-faint hover:text-bad px-1 leading-none shrink-0"
              data-test="notification-toast-dismiss"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={() => onSnooze(n.inboxId, n.id)}
              className="text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink rounded-lg px-2 py-1 border border-line hover:bg-surface-2 transition-colors"
              data-test="notification-toast-snooze"
            >
              Snooze 1h
            </button>
            <button
              onClick={() => onDone(n.inboxId, n.id)}
              className="text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink rounded-lg px-2 py-1 border border-line hover:bg-surface-2 transition-colors"
              data-test="notification-toast-done"
            >
              Done
            </button>
            <button
              onClick={() => onOpen(n.inboxId, n.id)}
              className="text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink rounded-lg px-2 py-1 border border-line hover:bg-surface-2 transition-colors"
              data-test="notification-toast-open"
            >
              Open
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
