// Sweep 25 — Cross-studio "back to project" breadcrumb.
//
// Mounted globally in TopBar. Reads project context (set when the user
// clicks a card on the Project board and chooses "Open in studio") and
// renders a return pill if context is set AND the user is not currently
// on /projects.
//
// Auto-clears when the user lands on /projects — they've completed the
// round trip; the pill would be redundant.

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context'
import {
  type ProjectContext,
  getProjectContext,
  clearProjectContext,
  subscribeProjectContext,
} from '../util/projectContext'

const COLOUR_MAP: Record<string, string> = {
  tan:   '#c8b395',
  sage:  '#9aa888',
  mauve: '#a89aac',
  slate: '#8896a0',
}

export function FromProjectBreadcrumb(): JSX.Element | null {
  const ws = useWorkspace()
  const location = useLocation()
  const navigate = useNavigate()
  const [ctx, setCtx] = useState<ProjectContext | null>(() => getProjectContext())

  // Subscribe to context changes (same-tab + cross-tab).
  useEffect(() => {
    return subscribeProjectContext(() => setCtx(getProjectContext()))
  }, [])

  // Auto-clear when the user is already on /projects.
  useEffect(() => {
    if (ctx && location.pathname.startsWith('/projects')) {
      clearProjectContext()
    }
  }, [ctx, location.pathname])

  if (!ctx) return null
  if (location.pathname.startsWith('/projects')) return null

  const project = ws.projects.find((p) => p.id === ctx.projectId)
  if (!project) {
    // Project was deleted. Drop context silently.
    clearProjectContext()
    return null
  }

  const dot = project.colour ? COLOUR_MAP[project.colour] : null

  function handleReturn() {
    navigate('/projects')
    // Don't clear here — the auto-clear effect on /projects handles it.
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    clearProjectContext()
  }

  return (
    <button
      onClick={handleReturn}
      className="group flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border border-line bg-surface-2 hover:bg-surface-3 hover:border-accent transition-colors"
      data-test="from-project-breadcrumb"
      data-project-id={project.id}
      title={`Return to "${project.name || 'Untitled'}" project board`}
    >
      <span className="text-ink-faint">←</span>
      {dot && (
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: dot }}
        />
      )}
      <span className="text-ink-soft group-hover:text-ink truncate max-w-[160px]">
        {project.name || 'Untitled'}
      </span>
      <span
        onClick={handleDismiss}
        className="text-ink-faint hover:text-bad text-[14px] leading-none -mr-1 px-1 cursor-pointer"
        data-test="from-project-breadcrumb-dismiss"
        title="Dismiss"
      >
        ×
      </span>
    </button>
  )
}
