import { useState } from 'react'
import { useWorkspace } from '../../context'
import type { AppDesignReview, ReviewCriterionResult } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'

const STATUSES: ReviewCriterionResult['status'][] = ['unset', 'green', 'red']
const STATUS_LABEL: Record<ReviewCriterionResult['status'], string> = {
  unset: '—',
  green: 'pass',
  red: 'fail'
}

export function ReviewsPane({ buildId }: { buildId: string }) {
  const ws = useWorkspace()
  const phases = ws.phases
    .filter((p) => p.buildId === buildId)
    .sort((a, b) => a.order - b.order)
  const reviews = ws.reviews
    .filter((r) => r.buildId === buildId)
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="p-6 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">Reviews</div>
      <p className="text-sm text-ink-faint mb-4">
        A review is a moment where you measure a delivered artifact against a phase's criteria.
      </p>

      <StartReview phases={phases} buildId={buildId} />

      <div className="mt-8">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">
          Past reviews ({reviews.length})
        </div>
        {reviews.length === 0 && (
          <div className="text-sm text-ink-faint italic">No reviews yet.</div>
        )}
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              onDelete={() => ws.deleteReview(r.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StartReview({
  phases, buildId
}: {
  phases: { id: string, name: string }[]
  buildId: string
}) {
  const ws = useWorkspace()
  const [phaseId, setPhaseId] = useState<string>(phases[0]?.id ?? '')
  const [artifact, setArtifact] = useState('')

  if (phases.length === 0) {
    return (
      <div className="rounded border border-line bg-surface-2 p-3 text-sm text-ink-faint italic">
        Add a phase first to start a review.
      </div>
    )
  }

  // If the previously-chosen phase was removed, reset to first.
  if (phaseId && !phases.find((p) => p.id === phaseId)) {
    setPhaseId(phases[0].id)
  }

  async function handleStart() {
    if (!phaseId) return
    await ws.createReview(buildId, phaseId, artifact)
    setArtifact('')
  }

  return (
    <div className="rounded border border-line bg-surface-2 p-3">
      <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-2">Start a review</div>
      <div className="flex items-center gap-2">
        <select
          value={phaseId}
          onChange={(e) => setPhaseId(e.target.value)}
          className="text-sm text-ink bg-surface border border-line rounded px-2 py-1.5"
          data-test="review-phase"
        >
          {phases.map((p) => (
            <option key={p.id} value={p.id}>{p.name || '(untitled phase)'}</option>
          ))}
        </select>
        <input
          className="title-input flex-1 text-sm text-ink"
          value={artifact}
          onChange={(e) => setArtifact(e.target.value)}
          placeholder="Delivered artifact (a doc, a build, a demo…)"
          data-test="review-artifact"
        />
        <button
          onClick={handleStart}
          className="text-xs text-ink-soft hover:text-ink rounded px-3 py-1.5 border border-line hover:bg-surface"
          data-test="start-review"
        >
          Start
        </button>
      </div>
    </div>
  )
}

function ReviewCard({
  review, onDelete
}: {
  review: AppDesignReview
  onDelete: () => void
}) {
  const ws = useWorkspace()

  function setResults(next: ReviewCriterionResult[]) {
    ws.updateReview(review.id, { results: next })
  }
  function setResult(id: string, patch: Partial<ReviewCriterionResult>) {
    setResults(review.results.map((r) => r.id === id ? { ...r, ...patch } : r))
  }

  const greens = review.results.filter((r) => r.status === 'green').length
  const reds   = review.results.filter((r) => r.status === 'red').length

  return (
    <div
      className="group rounded border border-line bg-surface-2 p-3"
      data-test="review-card"
      data-review-id={review.id}
    >
      <div className="flex items-baseline gap-2 mb-1">
        <div className="text-sm text-ink font-medium">{review.phaseName || '(unnamed phase)'}</div>
        <div className="text-xs text-ink-faint">{formatWhen(review.createdAt)}</div>
        <div className="flex-1" />
        <div className="text-xs">
          <span className="text-good" data-test="review-greens">{greens} pass</span>
          <span className="text-ink-faint mx-1">·</span>
          <span className="text-bad" data-test="review-reds">{reds} fail</span>
        </div>
        <InlineConfirmButton
          onConfirm={onDelete}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      {review.deliveredArtifact && (
        <div className="text-xs text-ink-soft mb-2">
          <span className="text-ink-faint mr-1.5">delivered:</span>
          {review.deliveredArtifact}
        </div>
      )}

      <div className="space-y-1.5 mt-2">
        {review.results.length === 0 && (
          <div className="text-xs text-ink-faint italic">
            (Phase had no criteria when this review was started.)
          </div>
        )}
        {review.results.map((r) => (
          <ResultRow
            key={r.id}
            result={r}
            onChange={(patch) => setResult(r.id, patch)}
          />
        ))}
      </div>
    </div>
  )
}

function ResultRow({
  result, onChange
}: {
  result: ReviewCriterionResult
  onChange: (patch: Partial<ReviewCriterionResult>) => void
}) {
  const [note, setNote] = useState(result.note)
  const isDirty = note !== result.note
  useDebouncedAutosave(note, isDirty, () => onChange({ note }))

  return (
    <div className="rounded border border-line bg-surface px-2 py-1.5" data-test="result-row" data-result-id={result.id}>
      <div className="flex items-center gap-2">
        <select
          value={result.status}
          onChange={(e) => onChange({ status: e.target.value as ReviewCriterionResult['status'] })}
          className={`text-xs bg-surface-2 border border-line rounded px-1.5 py-0.5 ${
            result.status === 'green' ? 'text-good'
              : result.status === 'red' ? 'text-bad'
              : 'text-ink-soft'
          }`}
          data-test="result-status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <div className="flex-1 text-xs text-ink">{result.text || '(empty criterion)'}</div>
      </div>
      <input
        className="title-input mt-1 w-full text-xs text-ink-faint"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="note (optional)"
        data-test="result-note"
      />
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
