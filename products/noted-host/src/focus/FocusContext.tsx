import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { LinkableType } from '../types'

export type FocusRecord = {
  id: string | null
  type: LinkableType | null
  origin?: string
  focusedAt?: number
}

type FocusContextValue = {
  focus: FocusRecord
  setFocus: (next: FocusRecord | null) => void
}

const EMPTY_FOCUS: FocusRecord = { id: null, type: null }
const FocusContext = createContext<FocusContextValue | null>(null)

export function FocusProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [focus, setFocusState] = useState<FocusRecord>(EMPTY_FOCUS)

  const setFocus = useCallback((next: FocusRecord | null) => {
    if (!next || !next.id || !next.type) {
      setFocusState(EMPTY_FOCUS)
      return
    }
    setFocusState({
      id: next.id,
      type: next.type,
      origin: next.origin,
      focusedAt: next.focusedAt ?? Date.now(),
    })
  }, [])

  const value = useMemo(() => ({ focus, setFocus }), [focus, setFocus])

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  )
}

export function useFocus(): FocusRecord {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useFocus must be used within FocusProvider')
  return ctx.focus
}

export function useSetFocus(): FocusContextValue['setFocus'] {
  const ctx = useContext(FocusContext)
  if (!ctx) throw new Error('useSetFocus must be used within FocusProvider')
  return ctx.setFocus
}
