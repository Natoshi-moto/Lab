import type * as React from 'react'
import { GlobalSearchBar } from './GlobalSearchBar'
import { FromProjectBreadcrumb } from './FromProjectBreadcrumb'
import { RecentViewsMenu } from './RecentViewsMenu'

const DRAG_REGION_STYLE = { WebkitAppRegion: 'drag' } as React.CSSProperties
const NO_DRAG_STYLE = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

function isMac() {
  return typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
}

export function TopBar() {
  function openPalette() {
    const ev = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: isMac(),
      ctrlKey: !isMac(),
      bubbles: true
    })
    window.dispatchEvent(ev)
  }

  function handleDoubleClick() {
    ;(window as any).electronAPI?.toggleMaximize?.()
  }

  return (
    <div
      className="h-10 border-b border-line/80 bg-surface/90 backdrop-blur flex items-center px-3 gap-2"
      data-focus-hide="topbar"
    >
      <div className="min-w-0" style={NO_DRAG_STYLE}>
        <GlobalSearchBar />
      </div>

      <div
        data-test="topbar-drag-region"
        onDoubleClick={handleDoubleClick}
        className="flex-1 h-full min-w-6"
        style={DRAG_REGION_STYLE}
      />

      <div style={NO_DRAG_STYLE}>
        <FromProjectBreadcrumb />
      </div>

      <div style={NO_DRAG_STYLE}>
        <RecentViewsMenu />
      </div>

      <button
        onClick={openPalette}
        className="h-7 text-xs text-ink-soft hover:text-ink rounded-lg px-2 hover:bg-surface-2 flex items-center shrink-0 transition-colors"
        title="Open command palette"
        data-test="open-palette"
        aria-label="Open command palette"
        style={NO_DRAG_STYLE}
      >
        <kbd className="text-[10px] border border-line rounded-md px-1.5 py-0.5 bg-surface-2 text-ink-faint">
          {isMac() ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </button>
    </div>
  )
}
