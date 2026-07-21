import { useWorkspace } from '../context'
import type { ShelfRefType } from '../types'

interface Props {
  type: ShelfRefType
  refId: string
  title: string
  className?: string
}

export function ShelfButton({ type, refId, title, className }: Props) {
  const ws = useWorkspace()
  const existing = ws.shelfItems.find(
    (s) => s.type === type && s.refId === refId && !s.archived
  )
  const onShelf = !!existing

  function handleClick() {
    if (onShelf && existing) {
      ws.removeFromShelf(existing.id)
    } else {
      ws.addToShelf({ type, refId, title })
    }
  }

  return (
    <button
      onClick={handleClick}
      className={
        className ??
        `text-xs rounded px-2 py-1 border transition-colors ${
          onShelf
            ? 'border-accent text-ink bg-surface-2'
            : 'border-line text-ink-soft hover:text-ink hover:bg-surface-2'
        }`
      }
      data-test="shelf-toggle"
      data-on-shelf={onShelf ? 'true' : 'false'}
      title={onShelf ? 'Remove from shelf' : 'Pin to shelf'}
    >
      {onShelf ? '★ Shelved' : '☆ Shelve'}
    </button>
  )
}
