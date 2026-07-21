import { useEffect, useRef, useState } from 'react'

interface EditorStatusBarProps {
  body: string
  lastSavedAt?: number | null
}

export function EditorStatusBar({ body, lastSavedAt = null }: EditorStatusBarProps) {
  const trimmed = body.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const chars = body.length
  const [savedFlash, setSavedFlash] = useState(false)
  const prevSavedAt = useRef<number | null>(null)

  useEffect(() => {
    if (lastSavedAt !== null && lastSavedAt !== prevSavedAt.current) {
      prevSavedAt.current = lastSavedAt
      setSavedFlash(true)
      const t = window.setTimeout(() => setSavedFlash(false), 2000)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [lastSavedAt])

  return (
    <div className="shrink-0 border-t border-line px-6 py-1.5 flex items-center gap-4 text-[11px] text-ink-faint select-none">
      {savedFlash && (
        <span className="text-good" data-test="editor-saved-indicator">Saved ✓</span>
      )}
      <span data-test="editor-word-count">{words} {words === 1 ? 'word' : 'words'}</span>
      <span data-test="editor-char-count">{chars} {chars === 1 ? 'char' : 'chars'}</span>
    </div>
  )
}
