import { useState } from 'react'
import { useWorkspace } from '../../context'
import type { AppDesignFeature, FeatureStatus, PassCriterion } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'

const STATUSES: FeatureStatus[] = ['spec', 'building', 'working', 'broken', 'cut']

const STATUS_COLORS: Record<FeatureStatus, string> = {
  spec:     'text-ink-soft',
  building: 'text-warn',
  working:  'text-good',
  broken:   'text-bad',
  cut:      'text-ink-faint line-through'
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function FeaturesPane({ buildId }: { buildId: string }) {
  const ws = useWorkspace()
  const features = ws.features
    .filter((f) => f.buildId === buildId)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="p-6 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">Features</div>
      <p className="text-sm text-ink-faint mb-4">
        Each feature is a working sentence about what the user can do. Pass criteria are how you'll know it's done.
      </p>

      {features.length === 0 && (
        <div className="text-sm text-ink-faint italic mb-4">No features yet.</div>
      )}

      <div className="space-y-3">
        {features.map((f, i) => (
          <FeatureRow
            key={f.id}
            feature={f}
            isFirst={i === 0}
            isLast={i === features.length - 1}
            onUp={() => ws.reorderFeature(f.id, -1)}
            onDown={() => ws.reorderFeature(f.id, 1)}
            onDelete={() => ws.deleteFeature(f.id)}
          />
        ))}
      </div>

      <button
        onClick={() => ws.createFeature(buildId)}
        className="mt-4 px-3 py-1.5 text-sm rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
        data-test="new-feature"
      >
        + Add feature
      </button>
    </div>
  )
}

function FeatureRow({
  feature, isFirst, isLast, onUp, onDown, onDelete
}: {
  feature: AppDesignFeature
  isFirst: boolean
  isLast: boolean
  onUp: () => void
  onDown: () => void
  onDelete: () => void
}) {
  const ws = useWorkspace()
  const [draft, setDraft] = useState({
    statement: feature.statement,
    notes: feature.notes
  })

  const isDirty =
    draft.statement !== feature.statement || draft.notes !== feature.notes
  const signature = draft.statement + '\u0000' + draft.notes
  useDebouncedAutosave(signature, isDirty, () => {
    ws.updateFeature(feature.id, draft)
  })

  function setCriteria(next: PassCriterion[]) {
    ws.updateFeature(feature.id, { criteria: next })
  }
  function addCriterion() {
    setCriteria([...feature.criteria, { id: uid(), text: '', met: false }])
  }
  function updateCriterion(id: string, patch: Partial<PassCriterion>) {
    setCriteria(feature.criteria.map((c) => c.id === id ? { ...c, ...patch } : c))
  }
  function deleteCriterion(id: string) {
    setCriteria(feature.criteria.filter((c) => c.id !== id))
  }

  return (
    <div
      className="group rounded border border-line bg-surface-2 p-3"
      data-test="feature-row"
      data-feature-id={feature.id}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            onClick={onUp} disabled={isFirst}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="feature-up" title="Move up"
          >↑</button>
          <button
            onClick={onDown} disabled={isLast}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="feature-down" title="Move down"
          >↓</button>
        </div>
        <input
          className={`title-input flex-1 text-sm ${STATUS_COLORS[feature.status]}`}
          value={draft.statement}
          onChange={(e) => setDraft({ ...draft, statement: e.target.value })}
          placeholder="The user can …"
          data-test="feature-statement"
        />
        <select
          value={feature.status}
          onChange={(e) => ws.updateFeature(feature.id, { status: e.target.value as FeatureStatus })}
          className="text-xs text-ink-soft bg-surface border border-line rounded px-2 py-1 hover:text-ink"
          data-test="feature-status"
        >
          {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <InlineConfirmButton
          onConfirm={onDelete}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      <textarea
        className="editor-surface mt-2 w-full text-sm text-ink min-h-[50px]"
        value={draft.notes}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        placeholder="Notes — design choices, edge cases…"
        data-test="feature-notes"
      />

      {/* Pass criteria */}
      <div className="mt-3 ml-1">
        <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">Pass criteria</div>
        {feature.criteria.length === 0 && (
          <div className="text-xs text-ink-faint italic mb-1">None yet.</div>
        )}
        <div className="space-y-1">
          {feature.criteria.map((c) => (
            <CriterionRow
              key={c.id}
              criterion={c}
              onChange={(patch) => updateCriterion(c.id, patch)}
              onDelete={() => deleteCriterion(c.id)}
            />
          ))}
        </div>
        <button
          onClick={addCriterion}
          className="mt-2 text-xs text-ink-soft hover:text-ink rounded px-1.5 py-0.5"
          data-test="new-criterion"
        >
          + criterion
        </button>
      </div>
    </div>
  )
}

function CriterionRow({
  criterion, onChange, onDelete
}: {
  criterion: PassCriterion
  onChange: (patch: Partial<PassCriterion>) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(criterion.text)
  const isDirty = draft !== criterion.text
  useDebouncedAutosave(draft, isDirty, () => onChange({ text: draft }))

  return (
    <div className="flex items-center gap-2 group/criterion" data-test="criterion-row" data-criterion-id={criterion.id}>
      <input
        type="checkbox"
        checked={criterion.met}
        onChange={(e) => onChange({ met: e.target.checked })}
        data-test="criterion-met"
      />
      <input
        className={`title-input flex-1 text-xs ${criterion.met ? 'text-ink-faint line-through' : 'text-ink'}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="A specific, observable outcome."
        data-test="criterion-text"
      />
      <button
        onClick={onDelete}
        className="text-[10px] text-ink-faint hover:text-bad px-1 opacity-0 group-hover/criterion:opacity-100 transition-opacity"
        data-test="criterion-delete"
      >
        ×
      </button>
    </div>
  )
}
