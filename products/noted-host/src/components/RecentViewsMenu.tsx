// Sweep 29 — Recent Views dropdown in the TopBar.
//
// A small history button that shows the last 20 visited records as a
// dropdown. Each entry navigates to the record in its studio. Clicking
// outside dismisses. Clear button wipes the history.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  relativeTime,
  KIND_BADGE,
  subscribeRecentViews,
  type RecentView,
} from '../util/recentViews'
import { jumpToSelection, ROUTE_FOR_TYPE, type JumpableKind } from '../util/navigate'

function load_() {
  try {
    const raw = localStorage.getItem('verse-studio:recent-views')
    if (raw) return JSON.parse(raw) as RecentView[]
  } catch {}
  return []
}

export function RecentViewsMenu() {
  const navigate = useNavigate()
  const [open, setOpen]   = useState(false)
  const [views, setViews] = useState<RecentView[]>(load_)
  const ref = useRef<HTMLDivElement>(null)

  // Re-sync when any studio pushes a new view
  useEffect(() => {
    return subscribeRecentViews(setViews)
  }, [])

  // Outside click dismiss
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  function handleSelect(view: RecentView) {
    setOpen(false)
    jumpToSelection({ kind: view.kind as JumpableKind, id: view.id })
    navigate(ROUTE_FOR_TYPE[view.kind as JumpableKind])
  }

  function handleClear() {
    try { localStorage.removeItem('verse-studio:recent-views') } catch {}
    setViews([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative" data-test="recent-views-menu">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-xs rounded px-2 py-1 flex items-center gap-1.5 transition-colors ${
          open
            ? 'bg-surface-3 text-ink'
            : 'text-ink-soft hover:text-ink hover:bg-surface-2'
        }`}
        title="Recent views"
        data-test="recent-views-btn"
      >
        {/* Clock / history icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4.5V7L8.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="hidden sm:inline">Recent</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 bg-surface border border-line rounded shadow-lg w-72 max-h-80 flex flex-col"
          data-test="recent-views-panel"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-line">
            <span className="text-xs text-ink-faint uppercase tracking-wider">Recent</span>
            {views.length > 0 && (
              <button
                onClick={handleClear}
                className="text-[10px] text-ink-faint hover:text-bad transition-colors"
                data-test="recent-views-clear"
              >
                Clear
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {views.length === 0 ? (
              <div className="px-3 py-4 text-xs text-ink-faint text-center">
                Nothing yet — open a record to start tracking.
              </div>
            ) : (
              views.map(view => (
                <button
                  key={view.id}
                  onClick={() => handleSelect(view)}
                  className="w-full text-left px-3 py-2 flex items-baseline gap-2 hover:bg-surface-2 transition-colors group"
                  data-test="recent-view-item"
                  data-record-id={view.id}
                >
                  <span className="text-[9px] uppercase tracking-widest text-ink-faint font-mono w-8 shrink-0">
                    {KIND_BADGE[view.kind as JumpableKind] ?? view.kind}
                  </span>
                  <span className="flex-1 text-xs text-ink truncate">
                    {view.title || 'Untitled'}
                  </span>
                  <span className="text-[10px] text-ink-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {relativeTime(view.visitedAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
