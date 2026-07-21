// Sweep 29 — ListItemMenu
//
// Right-click context menu for studio list items (notes, docs, poems).
// Provides: Open, Link to… (via Cmd+L palette), Add to Shelf, Delete.
//
// "Link to…" reuses the existing CommandPalette link-pick mode — no new
// picker needed. It sets activeRecord on the workspace and dispatches the
// Cmd/Ctrl+L keystroke that the palette's global listener handles.

import { useEffect, useRef } from 'react'
import { useWorkspace } from '../context'
import { useSetFocus } from '../focus/FocusContext'
import type { LinkableType, ShelfRefType } from '../types'

export interface ListItemMenuProps {
  /** The record being right-clicked */
  recordId:   string
  recordType: LinkableType & ShelfRefType
  title:      string
  /** Position of the menu in viewport coords */
  x: number
  y: number
  onOpen:   () => void
  onDelete: () => void
  onClose:  () => void
  /** Optional additional action buttons rendered above the Delete divider. */
  extraActions?: Array<{
    label: string
    testId: string
    onClick: () => void
  }>
}

function isMac() {
  return typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
}

export function ListItemMenu({
  recordId, recordType, title,
  x, y,
  onOpen, onDelete, onClose, extraActions,
}: ListItemMenuProps) {
  const ws  = useWorkspace()
  const setFocus = useSetFocus()
  const ref = useRef<HTMLDivElement>(null)

  // Outside click/Escape dismiss
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Flip menu so it doesn't escape the viewport
  const MENU_W = 180
  const MENU_H = 130
  const left = (x + MENU_W > window.innerWidth)  ? x - MENU_W : x
  const top  = (y + MENU_H > window.innerHeight) ? y - MENU_H : y

  function handleLinkTo() {
    onClose()
    // Point the active record at this item, then trigger Cmd/Ctrl+L so the
    // CommandPalette opens in link-pick mode — reusing all existing UI.
    ws.setActiveRecord({ id: recordId, type: recordType })
    setFocus({ id: recordId, type: recordType, origin: 'list-item-menu' })
    const ev = new KeyboardEvent('keydown', {
      key: 'l',
      metaKey: isMac(),
      ctrlKey: !isMac(),
      bubbles: true,
    })
    window.dispatchEvent(ev)
  }

  async function handleShelf() {
    onClose()
    const alreadyOn = ws.isOnShelf(recordType as ShelfRefType, recordId)
    if (alreadyOn) {
      const shelfItem = ws.shelfItems.find(
        s => s.type === recordType && s.refId === recordId
      )
      if (shelfItem) await ws.removeFromShelf(shelfItem.id)
    } else {
      await ws.addToShelf({ type: recordType as ShelfRefType, refId: recordId, title: title || 'Untitled' })
    }
  }

  const onShelf = ws.isOnShelf(recordType as ShelfRefType, recordId)

  return (
    <div
      ref={ref}
      className="fixed z-[999] bg-surface border border-line rounded shadow-lg py-1 min-w-[180px] text-sm"
      style={{ left, top }}
      data-test="list-item-menu"
      onContextMenu={e => e.preventDefault()}
    >
      <button
        onClick={() => { onClose(); onOpen() }}
        className="w-full text-left px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
        data-test="list-item-menu-open"
      >
        Open
      </button>
      <button
        onClick={handleLinkTo}
        className="w-full text-left px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors flex items-center justify-between"
        data-test="list-item-menu-link"
      >
        <span>Link to…</span>
        <kbd className="text-[10px] border border-line rounded px-1 bg-surface-2 text-ink-faint">
          {isMac() ? '⌘L' : 'Ctrl+L'}
        </kbd>
      </button>
      <button
        onClick={handleShelf}
        className="w-full text-left px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
        data-test="list-item-menu-shelf"
      >
        {onShelf ? 'Remove from Shelf' : 'Add to Shelf'}
      </button>
      {extraActions && extraActions.length > 0 && (
        <>
          {extraActions.map((action) => (
            <button
              key={action.testId}
              onClick={() => { onClose(); action.onClick() }}
              className="w-full text-left px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
              data-test={action.testId}
            >
              {action.label}
            </button>
          ))}
        </>
      )}
      <div className="border-t border-line my-1" />
      <button
        onClick={() => { onClose(); onDelete() }}
        className="w-full text-left px-3 py-1.5 text-ink-soft hover:text-bad transition-colors"
        data-test="list-item-menu-delete"
      >
        Delete
      </button>
    </div>
  )
}
