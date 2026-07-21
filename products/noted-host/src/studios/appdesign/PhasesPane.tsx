import { useState } from 'react'
import { useWorkspace } from '../../context'
import type { AppDesignPhase, PassCriterion } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function PhasesPane({ buildId }: { buildId: string }) {
  const ws = useWorkspace()
  const phases = ws.phases
    .filter((p) => p.buildId === buildId)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="p-6 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">Phases</div>
      <p className="text-sm text-ink-faint mb-4">
        The shape of the build's progress. Mark a phase active to flag where you are; pass criteria say what "done" means.
      </p>

      {phases.length === 0 && (
        <div className="text-sm text-ink-faint italic mb-4">No phases yet.</div>
      )}

      <div className="space-y-3">
        {phases.map((p, i) => (
          <PhaseRow
            key={p.id}
            phase={p}
            isFirst={i === 0}
            isLast={i === phases.length - 1}
            onUp={() => ws.reorderPhase(p.id, -1)}
            onDown={() => ws.reorderPhase(p.id, 1)}
            onDelete={() => ws.deletePhase(p.id)}
            onMakeActive={() => ws.setActivePhase(buildId, p.id)}
          />
        ))}
      </div>

      <button
        onClick={() => ws.createPhase(buildId)}
        className="mt-4 px-3 py-1.5 text-sm rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
        data-test="new-phase"
      >
        + Add phase
      </button>
    </div>
  )
}

function PhaseRow({
  phase, isFirst, isLast, onUp, onDown, onDelete, onMakeActive
}: {
  phase: AppDesignPhase
  isFirst: boolean
  isLast: boolean
  onUp: () => void
  onDown: () => void
  onDelete: () => void
  onMakeActive: () => void
}) {
  const ws = useWorkspace()
  const [name, setName] = useState(phase.name)
  const isDirty = name !== phase.name
  useDebouncedAutosave(name, isDirty, () => {
    ws.updatePhase(phase.id, { name })
  })

  function setCriteria(next: PassCriterion[]) {
    ws.updatePhase(phase.id, { criteria: next })
  }
  function addCriterion() {
    setCriteria([...phase.criteria, { id: uid(), text: '', met: false }])
  }
  function updateCriterion(id: string, patch: Partial<PassCriterion>) {
    setCriteria(phase.criteria.map((c) => c.id === id ? { ...c, ...patch } : c))
  }
  function deleteCriterion(id: string) {
    setCriteria(phase.criteria.filter((c) => c.id !== id))
  }

  return (
    <div
      className={`group rounded border p-3 ${
        phase.active
          ? 'border-accent bg-surface-2'
          : 'border-line bg-surface-2'
      }`}
      data-test="phase-row"
      data-phase-id={phase.id}
      data-active={phase.active ? 'true' : 'false'}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onUp} disabled={isFirst}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="phase-up" title="Move up"
          >↑</button>
          <button
            onClick={onDown} disabled={isLast}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="phase-down" title="Move down"
          >↓</button>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-ink-soft cursor-pointer select-none">
          <input
            type="radio"
            name="active-phase"
            checked={phase.active}
            onChange={() => onMakeActive()}
            data-test="phase-active"
          />
          active
        </label>
        <input
          className="title-input flex-1 text-sm text-ink"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Phase name (e.g. Discovery)"
          data-test="phase-name"
          data-phase-edit-id={phase.id}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      <div className="mt-3 ml-1">
        <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">Pass criteria</div>
        {phase.criteria.length === 0 && (
          <div className="text-xs text-ink-faint italic mb-1">None yet.</div>
        )}
        <div className="space-y-1">
          {phase.criteria.map((c) => (
            <PhaseCriterionRow
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
          data-test="new-phase-criterion"
        >
          + criterion
        </button>
      </div>
    </div>
  )
}

function PhaseCriterionRow({
  criterion, onChange, onDelete
}: {
  criterion: PassCriterion
  onChange: (patch: Partial<PassCriterion>) => void
  onDelete: () => void
}) {
  const [text, setText] = useState(criterion.text)
  const isDirty = text !== criterion.text
  useDebouncedAutosave(text, isDirty, () => onChange({ text }))

  return (
    <div
      className="flex items-center gap-2 group/pcrit"
      data-test="phase-criterion-row"
      data-phase-criterion-id={criterion.id}
    >
      <input
        type="checkbox"
        checked={criterion.met}
        onChange={(e) => onChange({ met: e.target.checked })}
        data-test="phase-criterion-met"
      />
      <input
        className={`title-input flex-1 text-xs ${criterion.met ? 'text-ink-faint line-through' : 'text-ink'}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="A specific outcome that proves the phase is done."
        data-test="phase-criterion-text"
      />
      <button
        onClick={onDelete}
        className="text-[10px] text-ink-faint hover:text-bad px-1 opacity-0 group-hover/pcrit:opacity-100 transition-opacity"
        data-test="phase-criterion-delete"
      >×</button>
    </div>
  )
}
