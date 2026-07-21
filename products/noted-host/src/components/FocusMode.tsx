import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { isScratchDrawerOpen, setScratchDrawerOpen } from './scratchDrawerState'

const STORAGE_KEY = 'verse-studio:focus'

interface FocusModeAPI {
  focus: boolean
  setFocus: (next: boolean) => void
  toggleFocus: () => void
}

const Ctx = createContext<FocusModeAPI | null>(null)

export function FocusModeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [focus, setFocusState] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
  })

  const setFocus = useCallback((next: boolean) => {
    setFocusState(next)
    try { localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false') } catch { /* ignore */ }
  }, [])

  const toggleFocus = useCallback(() => {
    setFocusState((prev) => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false') } catch { /* ignore */ }
      return next
    })
  }, [])

  // Keyboard shortcuts: Escape first closes ScratchDrawer in focus mode, then exits focus; Cmd/Ctrl + . toggles.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // '/' toggles focus mode when not typing in an input/textarea.
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null
        const tag = target?.tagName?.toLowerCase()
        if (tag !== 'input' && tag !== 'textarea' && !target?.isContentEditable) {
          e.preventDefault()
          toggleFocus()
          return
        }
      }
      if (e.key === 'Escape' && focus) {
        e.preventDefault()
        if (isScratchDrawerOpen()) {
          setScratchDrawerOpen(false)
          return
        }
        setFocus(false)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        toggleFocus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focus, setFocus, toggleFocus])

  return <Ctx.Provider value={{ focus, setFocus, toggleFocus }}>{children}</Ctx.Provider>
}

export function useFocusMode(): FocusModeAPI {
  const v = useContext(Ctx)
  if (!v) throw new Error('useFocusMode must be used within FocusModeProvider')
  return v
}

export function FocusToggleButton({ compact = false }: { compact?: boolean } = {}): JSX.Element {
  const { focus, toggleFocus } = useFocusMode()

  if (compact) {
    return (
      <button
        onClick={toggleFocus}
        className="relative w-9 h-9 mx-auto flex items-center justify-center rounded text-[11px] font-medium tracking-wide text-ink-soft hover:bg-surface-3 hover:text-ink transition-colors"
        data-test="focus-toggle"
        data-focus-active={focus ? 'true' : 'false'}
        title={focus ? 'Exit focus mode (⌘.)' : 'Enter focus mode (⌘.)'}
        aria-label={focus ? 'Exit focus mode' : 'Enter focus mode'}
      >
        F
      </button>
    )
  }

  return (
    <button
      onClick={toggleFocus}
      className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 hover:bg-surface-2 flex items-center gap-2"
      data-test="focus-toggle"
      data-focus-active={focus ? 'true' : 'false'}
      title={focus ? 'Exit focus mode (⌘.)' : 'Enter focus mode (⌘.)'}
    >
      {focus ? 'Exit focus' : 'Focus'}
      <kbd className="text-[10px] border border-line rounded px-1 py-0.5 bg-surface-2 text-ink-faint">
        ⌘.
      </kbd>
    </button>
  )
}
