import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../theme'
import { useFocusMode } from './FocusMode'
import { setScratchDrawerOpen } from './scratchDrawerState'

export function FocusHoverMenu(): JSX.Element | null {
  const { focus, setFocus } = useFocusMode()
  const [, , toggleTheme] = useTheme()
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!focus) {
      setVisible(false)
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
      return
    }

    function revealForMouseMove() {
      setVisible(true)
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => {
        setVisible(false)
        hideTimer.current = null
      }, 2000)
    }

    document.addEventListener('mousemove', revealForMouseMove)
    return () => {
      document.removeEventListener('mousemove', revealForMouseMove)
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
    }
  }, [focus])

  if (!focus) return null

  const buttonClass = 'rounded border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft hover:bg-surface-3 hover:text-ink transition-colors'

  return (
    <div
      className={`fixed top-0 left-1/2 z-50 -translate-x-1/2 pt-3 transition-opacity duration-300 ease-in-out ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      data-test="focus-hover-menu"
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-2 py-2 text-ink shadow">
        <button
          type="button"
          className={buttonClass}
          onClick={() => setFocus(false)}
          data-test="focus-hover-exit"
          tabIndex={visible ? 0 : -1}
        >
          Exit Focus
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => setScratchDrawerOpen(true)}
          data-test="focus-hover-capture"
          tabIndex={visible ? 0 : -1}
        >
          Quick Capture
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={toggleTheme}
          data-test="focus-hover-theme"
          tabIndex={visible ? 0 : -1}
        >
          Theme
        </button>
      </div>
    </div>
  )
}
