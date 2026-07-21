import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'

const MIN_LIST_WIDTH = 160
const MAX_LIST_WIDTH = 480
const DEFAULT_LIST_WIDTH = 240

function clampWidth(value: number): number {
  return Math.min(MAX_LIST_WIDTH, Math.max(MIN_LIST_WIDTH, Math.round(value)))
}

function readStoredWidth(storageKey: string, fallback = DEFAULT_LIST_WIDTH): number {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return fallback
    const parsed = Number(stored)
    return Number.isFinite(parsed) ? clampWidth(parsed) : fallback
  } catch {
    return fallback
  }
}

export function useResizableListWidth(storageKey: string, fallback = DEFAULT_LIST_WIDTH) {
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, fallback))
  const [dragState, setDragState] = useState<{ startX: number; startWidth: number } | null>(null)
  const widthRef = useRef(width)

  useEffect(() => {
    widthRef.current = width
  }, [width])

  const startResize = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragState({ startX: event.clientX, startWidth: widthRef.current })
  }, [])

  useEffect(() => {
    if (!dragState) return

    const activeDragState = dragState
    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'

    function handleMouseMove(event: MouseEvent) {
      const nextWidth = clampWidth(activeDragState.startWidth + event.clientX - activeDragState.startX)
      widthRef.current = nextWidth
      setWidth(nextWidth)
    }

    function handleMouseUp() {
      try { localStorage.setItem(storageKey, String(widthRef.current)) } catch {}
      setDragState(null)
      document.body.style.userSelect = previousUserSelect
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = previousUserSelect
    }
  }, [dragState, storageKey])

  return { width, startResize, isResizing: dragState !== null }
}

export function stripMarkdownPreview(body: string, maxLength = 60): string {
  const preview = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[*_~>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (preview.length <= maxLength) return preview
  return preview.slice(0, maxLength - 1).trimEnd() + '…'
}

export function formatCompactRelativeTime(timestamp: number, now = Date.now()): string {
  const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (diffSeconds < 60) return 'now'

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) return `${diffWeeks}w`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${Math.max(1, diffMonths)}mo`

  return `${Math.floor(diffDays / 365)}y`
}
