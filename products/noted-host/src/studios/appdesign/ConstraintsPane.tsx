import { useState } from 'react'
import { useWorkspace } from '../../context'
import type { AppDesignConstraint } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'

export function ConstraintsPane({ buildId }: { buildId: string }) {
  const ws = useWorkspace()
  const constraints = ws.constraints
    .filter((c) => c.buildId === buildId)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="p-6 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">Constraints</div>
      <p className="text-sm text-ink-faint mb-4">
        Hard limits the build accepts on purpose. Mark one challenged when you've started to push back on it.
      </p>

      {constraints.length === 0 && (
        <div className="text-sm text-ink-faint italic mb-4">No constraints yet.</div>
      )}

      <div className="space-y-2">
        {constraints.map((c, i) => (
          <ConstraintRow
            key={c.id}
            constraint={c}
            isFirst={i === 0}
            isLast={i === constraints.length - 1}
            onUp={() => ws.reorderConstraint(c.id, -1)}
            onDown={() => ws.reorderConstraint(c.id, 1)}
            onDelete={() => ws.deleteConstraint(c.id)}
          />
        ))}
      </div>

      <button
        onClick={() => ws.createConstraint(buildId)}
        className="mt-4 px-3 py-1.5 text-sm rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
        data-test="new-constraint"
      >
        + Add constraint
      </button>
    </div>
  )
}

function ConstraintRow({
  constraint, isFirst, isLast, onUp, onDown, onDelete
}: {
  constraint: AppDesignConstraint
  isFirst: boolean
  isLast: boolean
  onUp: () => void
  onDown: () => void
  onDelete: () => void
}) {
  const ws = useWorkspace()
  const [draft, setDraft] = useState({
    text: constraint.text,
    why: constraint.why
  })

  const isDirty =
    draft.text !== constraint.text || draft.why !== constraint.why
  const signature = draft.text + '\u0000' + draft.why
  useDebouncedAutosave(signature, isDirty, () => {
    ws.updateConstraint(constraint.id, draft)
  })

  return (
    <div
      className="group rounded border border-line bg-surface-2 p-3"
      data-test="constraint-row"
      data-constraint-id={constraint.id}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            onClick={onUp}
            disabled={isFirst}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="constraint-up"
            title="Move up"
          >↑</button>
          <button
            onClick={onDown}
            disabled={isLast}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="constraint-down"
            title="Move down"
          >↓</button>
        </div>
        <input
          className="title-input flex-1 text-sm text-ink"
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          placeholder="A constraint the build accepts."
          data-test="constraint-text"
        />
        <label className="flex items-center gap-1.5 text-xs text-ink-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={constraint.challenged}
            onChange={(e) => ws.updateConstraint(constraint.id, { challenged: e.target.checked })}
            data-test="constraint-challenged"
          />
          challenged
        </label>
        <InlineConfirmButton
          onConfirm={onDelete}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      {constraint.challenged && (
        <textarea
          className="editor-surface mt-2 w-full text-sm text-ink min-h-[60px]"
          value={draft.why}
          onChange={(e) => setDraft({ ...draft, why: e.target.value })}
          placeholder="Why are you pushing back on this constraint?"
          data-test="constraint-why"
        />
      )}
    </div>
  )
}
