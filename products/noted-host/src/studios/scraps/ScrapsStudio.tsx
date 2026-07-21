import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function ScrapsStudio() {
  const navigate = useNavigate()

  // Auto-redirect after a brief pause so users understand what happened.
  useEffect(() => {
    const id = window.setTimeout(() => navigate('/projects'), 1500)
    return () => window.clearTimeout(id)
  }, [navigate])

  return (
    <div
      className="h-full flex items-center justify-center bg-surface px-6"
      data-test="route-stub-scraps"
    >
      <div className="max-w-md rounded border border-line bg-surface-2 px-6 py-5 text-center shadow-sm">
        <h1 className="text-lg font-medium text-ink">Scraps</h1>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          Scraps live inside Projects — quick captures attached directly to a project.
          Taking you there now…
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-xs px-3 py-1.5 rounded border border-line hover:bg-surface-3 text-ink-soft transition-colors"
          data-test="scraps-go-to-projects"
        >
          Go to Projects
        </button>
      </div>
    </div>
  )
}
