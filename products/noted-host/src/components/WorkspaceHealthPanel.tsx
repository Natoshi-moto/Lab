import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context'
import { jumpToSelection, ROUTE_FOR_TYPE } from '../util/navigate'
import { computeWorkspaceHealthSignals, type HealthSignal } from '../util/healthSignals'

export function WorkspaceHealthPanel(): JSX.Element {
  const ws = useWorkspace()
  const navigate = useNavigate()

  function openSignal(sig: HealthSignal) {
    const target = sig.openTarget
    if (!target) return
    if (target.type === 'jump') {
      jumpToSelection({ kind: target.kind, id: target.id })
      navigate(ROUTE_FOR_TYPE[target.kind])
      return
    }
    navigate(target.route)
  }

  const signals = useMemo<HealthSignal[]>(() => computeWorkspaceHealthSignals(ws), [ws])

  const active = signals.filter(s => s.count > 0)

  return (
    <div className="space-y-6" data-test="health-panel">
      <p className="text-xs text-ink-faint leading-relaxed">
        Signals about the shape of your workspace. No score. Just facts.
      </p>
      {active.length === 0 ? (
        <div className="rounded border border-line bg-surface-2 px-4 py-6 text-center text-sm text-ink-faint" data-test="health-empty">
          No issues found.
        </div>
      ) : (
        <div className="rounded border border-line bg-surface-2 divide-y divide-line">
          {active.map((sig) => (
            <div key={sig.id} className="flex items-start gap-3 px-3 py-2.5" data-test="health-signal-row">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-ink font-medium">{sig.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-3 text-ink-soft" data-test="health-signal-count">
                    {sig.count}
                  </span>
                </div>
                <div className="text-[11px] text-ink-faint">{sig.description}</div>
                {sig.example && <div className="text-[11px] text-ink-soft mt-0.5 truncate italic">{sig.example}</div>}
              </div>
              {sig.openTarget && (
                <button
                  onClick={() => openSignal(sig)}
                  className="shrink-0 text-[11px] px-2 py-1 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
                  data-test="health-signal-open"
                >
                  Open
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
