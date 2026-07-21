// Sweep 28 — Shared hook for collapsible studio list rails.
//
// Each studio that has a left-rail list (Writing, Poetry, Notes, etc.)
// uses this hook to persist collapse state and derive the rail width.
// The rail collapses to 0 with a CSS transition; the toggle button stays
// mounted (as a slim strip on the left edge) so the user can reopen it.

import { useEffect, useRef, useState } from 'react'

const RAIL_W = 256   // expanded width in px — matches w-64

export interface RailState {
  collapsed: boolean
  toggle: () => void
  railWidth: number
}

export function useRailCollapse(storageKey: string): RailState {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(storageKey) === 'true' } catch { return false }
  })

  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    try { localStorage.setItem(storageKey, collapsed ? 'true' : 'false') } catch {}
  }, [collapsed, storageKey])

  return {
    collapsed,
    toggle: () => setCollapsed((c) => !c),
    railWidth: collapsed ? 0 : RAIL_W,
  }
}
