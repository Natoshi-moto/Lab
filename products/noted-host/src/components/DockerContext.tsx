import React, { createContext, useContext, useEffect, useState } from 'react'

/**
 * Sweep 7 — Docker UI state.
 *
 * Lives in its own provider above WorkspaceProvider's children so the chrome
 * has a place to keep "which tab is active" / "is the panel expanded" without
 * tangling those into workspace data. Persists to localStorage on every change
 * so reloads land where the user left off.
 *
 * The tab BODIES are intentionally placeholders this sweep — Sweep 10 wires
 * each tab to its workspace store (recently deleted, recent items, files,
 * quick add).
 */

export type DockerTab =
  | 'recently-deleted'
  | 'recent-items'
  | 'files'
  | 'quick-add'

const TAB_SLUGS: readonly DockerTab[] = [
  'recently-deleted', 'recent-items', 'files', 'quick-add'
]

const STORAGE_KEY = 'verse-studio:docker:state'

interface DockerState {
  activeTab: DockerTab
  expanded: boolean
}

interface DockerAPI extends DockerState {
  setActiveTab: (tab: DockerTab) => void
  toggleExpanded: () => void
  setExpanded: (next: boolean) => void
}

const DEFAULT_STATE: DockerState = { activeTab: 'recently-deleted', expanded: false }

function readInitial(): DockerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      const tab: DockerTab =
        (TAB_SLUGS as readonly string[]).includes(parsed.activeTab)
          ? (parsed.activeTab as DockerTab)
          : DEFAULT_STATE.activeTab
      const expanded =
        typeof parsed.expanded === 'boolean' ? parsed.expanded : DEFAULT_STATE.expanded
      return { activeTab: tab, expanded }
    }
  } catch {}
  return DEFAULT_STATE
}

const Ctx = createContext<DockerAPI | null>(null)

export function useDocker(): DockerAPI {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDocker must be used inside DockerProvider')
  return ctx
}

export function DockerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DockerState>(readInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  const setActiveTab = (tab: DockerTab) => setState((s) => ({ ...s, activeTab: tab }))
  const toggleExpanded = () => setState((s) => ({ ...s, expanded: !s.expanded }))
  const setExpanded = (next: boolean) => setState((s) => ({ ...s, expanded: next }))

  const api: DockerAPI = { ...state, setActiveTab, toggleExpanded, setExpanded }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
