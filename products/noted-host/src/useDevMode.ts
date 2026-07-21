// Sweep 60 — Developer/Experimental Mode toggle.
//
// Single boolean stored at `verse-studio:dev-mode`. When true, the Sidebar
// re-exposes routes marked `defaultHidden` (Inbox, Longform, App Design,
// Library). Hidden studios remain URL-reachable regardless of this flag —
// dev mode only affects sidebar visibility.
//
// Cross-component sync: the native `storage` event fires only in other
// windows, so setDevMode also dispatches a same-window StorageEvent so any
// component using this hook re-renders immediately. This is a UI sync
// mechanism, not a stored signal contract.

import { useCallback, useEffect, useState } from 'react'

const KEY = 'verse-studio:dev-mode'

function readDevMode(): boolean {
  try { return localStorage.getItem(KEY) === 'true' }
  catch { return false }
}

export function useDevMode(): { devMode: boolean; setDevMode: (v: boolean) => void } {
  const [devMode, setDevModeState] = useState<boolean>(readDevMode)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setDevModeState(readDevMode())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setDevMode = useCallback((v: boolean) => {
    try { localStorage.setItem(KEY, v ? 'true' : 'false') } catch { /* ignore */ }
    setDevModeState(v)
    // Native StorageEvent does not fire in the originating window; dispatch
    // a synthetic one so peer Sidebar/Settings subscribers re-render.
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })) } catch { /* ignore */ }
  }, [])

  return { devMode, setDevMode }
}
