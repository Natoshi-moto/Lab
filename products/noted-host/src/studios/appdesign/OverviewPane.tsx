import { useWorkspace } from '../../context'
import type { AppDesignBuild, FeatureStatus } from '../../types'

export function OverviewPane({ build }: { build: AppDesignBuild }) {
  const ws = useWorkspace()
  const constraints = ws.constraints.filter((c) => c.buildId === build.id)
  const features = ws.features.filter((f) => f.buildId === build.id)
  const screens = ws.screens.filter((s) => s.buildId === build.id)

  const featureBy: Record<FeatureStatus, number> = {
    spec: 0, building: 0, working: 0, broken: 0, cut: 0
  }
  for (const f of features) featureBy[f.status] = (featureBy[f.status] ?? 0) + 1

  const challenged = constraints.filter((c) => c.challenged).length

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <Section title="Status">
        <div className="text-sm text-ink-soft">
          <span className="text-ink">{build.status}</span>
          <span className="mx-2 text-ink-faint">·</span>
          updated {formatWhen(build.updatedAt)}
          <span className="mx-2 text-ink-faint">·</span>
          created {formatWhen(build.createdAt)}
        </div>
      </Section>

      <Section title="At a glance">
        <div className="grid grid-cols-3 gap-3">
          <Tile label="Constraints" value={constraints.length} hint={challenged ? `${challenged} challenged` : undefined} />
          <Tile label="Features"    value={features.length} />
          <Tile label="Screens"     value={screens.length} />
        </div>
      </Section>

      {features.length > 0 && (
        <Section title="Feature status">
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(featureBy) as FeatureStatus[]).map((k) => (
              <div key={k} className="rounded border border-line bg-surface-2 px-3 py-2">
                <div className="text-xs text-ink-faint uppercase tracking-wider">{k}</div>
                <div className="text-lg text-ink mt-0.5" data-test={`overview-features-${k}`}>{featureBy[k]}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Phases">
        <PhasesGlance buildId={build.id} />
      </Section>

      <Section title="Reviews">
        <ReviewsGlance buildId={build.id} />
      </Section>
    </div>
  )
}

function PhasesGlance({ buildId }: { buildId: string }) {
  const ws = useWorkspace()
  const phases = ws.phases
    .filter((p) => p.buildId === buildId)
    .sort((a, b) => a.order - b.order)

  if (phases.length === 0) {
    return <div className="text-sm text-ink-faint italic">No phases yet.</div>
  }

  const active = phases.find((p) => p.active)
  return (
    <div>
      {active && (
        <div className="text-sm mb-2">
          <span className="text-ink-faint mr-1.5">Active:</span>
          <span className="text-ink" data-test="overview-active-phase">{active.name || '(unnamed)'}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {phases.map((p) => (
          <div
            key={p.id}
            className={`text-xs px-2 py-1 rounded border ${
              p.active
                ? 'border-accent text-ink bg-surface-2'
                : 'border-line text-ink-soft bg-surface'
            }`}
            data-test="overview-phase-pill"
          >
            {p.name || '(unnamed)'}
            {p.criteria.length > 0 && (
              <span className="text-ink-faint ml-1">
                ({p.criteria.filter((c) => c.met).length}/{p.criteria.length})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewsGlance({ buildId }: { buildId: string }) {
  const ws = useWorkspace()
  const reviews = ws.reviews
    .filter((r) => r.buildId === buildId)
    .sort((a, b) => b.createdAt - a.createdAt)

  if (reviews.length === 0) {
    return <div className="text-sm text-ink-faint italic">No reviews yet.</div>
  }

  const latest = reviews[0]
  const greens = latest.results.filter((r) => r.status === 'green').length
  const reds   = latest.results.filter((r) => r.status === 'red').length
  return (
    <div className="text-sm">
      <span className="text-ink">{reviews.length}</span>
      <span className="text-ink-faint mx-1.5">·</span>
      <span className="text-ink-faint">latest:</span>
      <span className="text-ink ml-1.5" data-test="overview-latest-review-phase">
        {latest.phaseName || '(unnamed)'}
      </span>
      <span className="text-ink-faint mx-1.5">·</span>
      <span className="text-good">{greens} pass</span>
      <span className="text-ink-faint mx-1">·</span>
      <span className="text-bad">{reds} fail</span>
    </div>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">{title}</div>
      {children}
    </section>
  )
}

function Tile({ label, value, hint }: { label: string, value: number, hint?: string }) {
  return (
    <div className="rounded border border-line bg-surface-2 px-3 py-3">
      <div className="text-xs text-ink-faint uppercase tracking-wider">{label}</div>
      <div className="text-2xl text-ink mt-0.5" data-test={`overview-${label.toLowerCase()}`}>{value}</div>
      {hint && <div className="text-[11px] text-ink-faint mt-0.5">{hint}</div>}
    </div>
  )
}

function formatWhen(t: number) {
  const d = new Date(t)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}
