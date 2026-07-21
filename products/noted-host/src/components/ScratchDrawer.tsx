import type * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Scratchpad } from './docker/Scratchpad'
import { ClipboardPanel } from './ClipboardPanel'
import { RecentlyDeleted } from './docker/RecentlyDeleted'
import { RecentItems }     from './docker/RecentItems'
import { Files }           from './docker/Files'
import { QuickAdd }        from './docker/QuickAdd'
import { SCRATCH_DRAWER_OPEN_EVENT, persistScratchDrawerOpen } from './scratchDrawerState'

const TAB_KEY  = 'verse-studio:scratch-drawer:tab'
const HEIGHT_KEY = 'verse-studio:scratch-drawer:height'
const DEFAULT_HEIGHT = 180
const MIN_HEIGHT = 160
type DrawerTab = 'scratch' | 'clip' | 'recently-deleted' | 'recent-items' | 'files' | 'quick-add'

const VALID_TABS: readonly DrawerTab[] = [
  'scratch',
  'clip',
  'recently-deleted',
  'recent-items',
  'files',
  'quick-add'
]

export function ScratchDrawer() {
  // Every app mount starts with the middle stage clear. User changes still persist
  // and broadcast during the session, but an earlier session cannot reopen it.
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<DrawerTab>(() => {
    try {
      const v = localStorage.getItem(TAB_KEY)
      return VALID_TABS.includes(v as DrawerTab) ? v as DrawerTab : 'scratch'
    } catch { return 'scratch' }
  })
  const [drawerHeight, setDrawerHeight] = useState<number>(() => {
    try {
      const v = localStorage.getItem(HEIGHT_KEY)
      if (v) {
        const n = parseInt(v, 10)
        if (!isNaN(n) && n >= MIN_HEIGHT) {
          return Math.min(n, Math.floor(window.innerHeight * 0.65))
        }
      }
    } catch {}
    const maxSafe = Math.floor(window.innerHeight * 0.4)
    return Math.max(MIN_HEIGHT, Math.min(DEFAULT_HEIGHT, maxSafe))
  })
  const dragState = useRef<{ startY: number; startH: number } | null>(null)

  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab) } catch {}
  }, [tab])

  useEffect(() => {
    try { localStorage.setItem(HEIGHT_KEY, String(drawerHeight)) } catch {}
  }, [drawerHeight])

  useEffect(() => {
    function onOpenChange(e: Event) {
      setOpen(Boolean((e as CustomEvent<boolean>).detail))
    }

    window.addEventListener(SCRATCH_DRAWER_OPEN_EVENT, onOpenChange)
    return () => window.removeEventListener(SCRATCH_DRAWER_OPEN_EVENT, onOpenChange)
  }, [])

  // Recalculate max allowed height when window is resized or maximized after mount.
  useEffect(() => {
    function handleResize() {
      setDrawerHeight((prev) => Math.min(prev, Math.floor(window.innerHeight * 0.7)))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function updateOpen(next: boolean | ((prev: boolean) => boolean)) {
    setOpen((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      persistScratchDrawerOpen(value)
      return value
    })
  }

  function handleTabClick(t: DrawerTab) {
    if (!open) updateOpen(true)
    setTab(t)
  }

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault()
    dragState.current = { startY: e.clientY, startH: drawerHeight }
    function onMove(ev: MouseEvent) {
      if (!dragState.current) return
      const delta = dragState.current.startY - ev.clientY
      const maxH = Math.floor(window.innerHeight * 0.7)
      const next = Math.max(MIN_HEIGHT, Math.min(maxH, dragState.current.startH + delta))
      setDrawerHeight(next)
    }
    function onUp() {
      dragState.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      data-test="scratch-drawer"
      data-open={open ? 'true' : 'false'}
      data-tab={tab}
      className="relative flex-none w-full z-20 bg-surface-2 border-t border-line flex flex-col transition-[height] duration-200 ease-in-out overflow-hidden min-h-[28px]"
      style={{
        height: open ? drawerHeight : 28,
        maxHeight: open ? `${Math.floor(window.innerHeight * 0.7)}px` : undefined
      }}
    >
      <div
        data-test="scratch-drawer-resize"
        className={`absolute top-0 left-0 right-0 h-1.5 z-10 hover:bg-accent/20 transition-colors ${
          open ? 'cursor-ns-resize' : 'pointer-events-none'
        }`}
        onMouseDown={open ? handleResizeStart : undefined}
      />

      <div
        className="h-7 shrink-0 flex items-center px-3 gap-3 relative cursor-pointer select-none"
        onClick={() => updateOpen((o) => !o)}
        data-test="scratch-drawer-banner"
      >
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer select-none bg-transparent border-none p-0 min-w-0 text-left"
          onClick={(e) => { e.stopPropagation(); updateOpen((o) => !o) }}
          data-test="scratch-drawer-handle"
          aria-expanded={open}
          aria-label={open ? 'Collapse drawer' : 'Expand drawer'}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className={`shrink-0 text-ink-faint transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path
              d="M1 3L5 7L9 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Scratchpad
          </span>
        </button>

        <div
          className="flex flex-wrap items-center gap-1"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleTabClick('scratch') }}
            data-test="scratch-drawer-tab-scratch"
            className={`text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded transition-colors ${
              tab === 'scratch' && open ? 'bg-surface-3 text-ink' : 'text-ink-faint hover:text-ink'
            }`}
          >
            Write
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleTabClick('clip') }}
            data-test="scratch-drawer-tab-clip"
            aria-label="Copied"
            className={`text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded transition-colors ${
              tab === 'clip' && open ? 'bg-surface-3 text-ink' : 'text-ink-faint hover:text-ink'
            }`}
          >
            Copied
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleTabClick('recently-deleted') }}
            data-test="scratch-drawer-tab-recently-deleted"
            className={`text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded transition-colors ${
              tab === 'recently-deleted' && open ? 'bg-surface-3 text-ink' : 'text-ink-faint hover:text-ink'
            }`}
          >
            Trash
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleTabClick('recent-items') }}
            data-test="scratch-drawer-tab-recent-items"
            className={`text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded transition-colors ${
              tab === 'recent-items' && open ? 'bg-surface-3 text-ink' : 'text-ink-faint hover:text-ink'
            }`}
          >
            Recent
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleTabClick('files') }}
            data-test="scratch-drawer-tab-files"
            className={`text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded transition-colors ${
              tab === 'files' && open ? 'bg-surface-3 text-ink' : 'text-ink-faint hover:text-ink'
            }`}
          >
            Files
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleTabClick('quick-add') }}
            data-test="scratch-drawer-tab-quick-add"
            className={`text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded transition-colors ${
              tab === 'quick-add' && open ? 'bg-surface-3 text-ink' : 'text-ink-faint hover:text-ink'
            }`}
          >
            Add
          </button>
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 10 10"
          fill="none"
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-ink-faint transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          data-test="scratch-drawer-banner-arrow"
          aria-hidden="true"
        >
          <path
            d="M1 6L5 2L9 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        className={`flex-1 min-h-0 border-t border-line overflow-hidden transition-opacity duration-150 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={tab === 'scratch' ? 'h-full' : 'hidden'}><Scratchpad /></div>
        <div className={tab === 'clip' ? 'h-full' : 'hidden'}><ClipboardPanel /></div>
        <div className={tab === 'recently-deleted' ? 'h-full' : 'hidden'}><RecentlyDeleted /></div>
        <div className={tab === 'recent-items'     ? 'h-full' : 'hidden'}><RecentItems /></div>
        <div className={tab === 'files'            ? 'h-full' : 'hidden'}><Files /></div>
        <div className={tab === 'quick-add'        ? 'h-full' : 'hidden'}><QuickAdd /></div>
      </div>
    </div>
  )
}
