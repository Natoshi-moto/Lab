// Sweep 29 — Recent Views
//
// Tracks which records the user has actually opened/selected, as opposed
// to "recently updated" (which is what RecentItems shows). Persisted to
// localStorage. Max 20 entries, deduplicated by id, newest-first.
//
// Intentionally separate from the workspace context — this is a UI concern,
// not a data concern. No IDB write, no schema bump.

import { useCallback, useEffect, useState } from 'react'
import type { JumpableKind } from './navigate'

export interface RecentView {
  kind:      JumpableKind
  id:        string
  title:     string
  visitedAt: number
}

const KEY    = 'verse-studio:recent-views'
const MAX    = 20

function load(): RecentView[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as RecentView[]
  } catch {}
  return []
}

function save(views: RecentView[]) {
  try { localStorage.setItem(KEY, JSON.stringify(views)) } catch {}
}

export function useRecentViews() {
  const [views, setViews] = useState<RecentView[]>(load)

  // Re-sync if another tab writes (unlikely in local-first but tidy)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setViews(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addView = useCallback((entry: Omit<RecentView, 'visitedAt'>) => {
    setViews(prev => {
      const next = [
        { ...entry, visitedAt: Date.now() },
        ...prev.filter(v => v.id !== entry.id),
      ].slice(0, MAX)
      save(next)
      return next
    })
  }, [])

  const clearViews = useCallback(() => {
    save([])
    setViews([])
  }, [])

  return { views, addView, clearViews }
}

// Singleton so studios don't each manage their own state —
// addView is called from any studio; the TopBar reads from localStorage.
// We expose a module-level push so studios can call it without the hook.
export function pushRecentView(entry: Omit<RecentView, 'visitedAt'>) {
  try {
    const prev = load()
    const next = [
      { ...entry, visitedAt: Date.now() },
      ...prev.filter(v => v.id !== entry.id),
    ].slice(0, MAX)
    save(next)
    // Fire a custom event so any mounted useRecentViews() re-reads
    window.dispatchEvent(new CustomEvent('verse-studio:recent-view', { detail: next }))
  } catch {}
}

export function subscribeRecentViews(cb: (views: RecentView[]) => void): () => void {
  function handler(e: Event) { cb((e as CustomEvent<RecentView[]>).detail) }
  window.addEventListener('verse-studio:recent-view', handler)
  return () => window.removeEventListener('verse-studio:recent-view', handler)
}

// Human-readable relative time
export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'yesterday'
  return `${d}d ago`
}

// Kind → short label for the badge
export const KIND_BADGE: Record<JumpableKind, string> = {
  document: 'Doc',
  poem:     'Poem',
  note:     'Note',
  longform: 'LF',
  build:    'Build',
  project:  'Proj',
  pattern:  'Pat',
  pipeline: 'Pipe',
}
