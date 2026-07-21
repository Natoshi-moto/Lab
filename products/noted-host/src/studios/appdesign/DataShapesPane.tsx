import { useState } from 'react'
import { useWorkspace } from '../../context'
import type { AppDesignDataShape, DataShapeField } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function DataShapesPane({ buildId }: { buildId: string }) {
  const ws = useWorkspace()
  const shapes = ws.dataShapes
    .filter((s) => s.buildId === buildId)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="p-6 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">Data shapes</div>
      <p className="text-sm text-ink-faint mb-4">
        The records the build stores. Each shape is a name and a list of fields.
      </p>

      {shapes.length === 0 && (
        <div className="text-sm text-ink-faint italic mb-4">No data shapes yet.</div>
      )}

      <div className="space-y-3">
        {shapes.map((s, i) => (
          <DataShapeRow
            key={s.id}
            shape={s}
            isFirst={i === 0}
            isLast={i === shapes.length - 1}
            onUp={() => ws.reorderDataShape(s.id, -1)}
            onDown={() => ws.reorderDataShape(s.id, 1)}
            onDelete={() => ws.deleteDataShape(s.id)}
          />
        ))}
      </div>

      <button
        onClick={() => ws.createDataShape(buildId)}
        className="mt-4 px-3 py-1.5 text-sm rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
        data-test="new-shape"
      >
        + Add shape
      </button>
    </div>
  )
}

function DataShapeRow({
  shape, isFirst, isLast, onUp, onDown, onDelete
}: {
  shape: AppDesignDataShape
  isFirst: boolean
  isLast: boolean
  onUp: () => void
  onDown: () => void
  onDelete: () => void
}) {
  const ws = useWorkspace()
  const [name, setName] = useState(shape.name)
  const isDirty = name !== shape.name
  useDebouncedAutosave(name, isDirty, () => {
    ws.updateDataShape(shape.id, { name })
  })

  function setFields(next: DataShapeField[]) {
    ws.updateDataShape(shape.id, { fields: next })
  }
  function addField() {
    setFields([...shape.fields, { id: uid(), name: '', type: 'string', description: '' }])
  }
  function updateField(id: string, patch: Partial<DataShapeField>) {
    setFields(shape.fields.map((f) => f.id === id ? { ...f, ...patch } : f))
  }
  function deleteField(id: string) {
    setFields(shape.fields.filter((f) => f.id !== id))
  }
  function moveField(id: string, direction: -1 | 1) {
    const idx = shape.fields.findIndex((f) => f.id === id)
    if (idx < 0) return
    const target = idx + direction
    if (target < 0 || target >= shape.fields.length) return
    const copy = [...shape.fields]
    ;[copy[idx], copy[target]] = [copy[target], copy[idx]]
    setFields(copy)
  }

  return (
    <div
      className="group rounded border border-line bg-surface-2 p-4"
      data-test="shape-row"
      data-shape-id={shape.id}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            onClick={onUp} disabled={isFirst}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="shape-up" title="Move up"
          >↑</button>
          <button
            onClick={onDown} disabled={isLast}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="shape-down" title="Move down"
          >↓</button>
        </div>
        <input
          className="title-input flex-1 text-base text-ink font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Shape name (e.g. Document)"
          data-test="shape-name"
          data-shape-edit-id={shape.id}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      <div className="mt-3 ml-1">
        <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">Fields</div>
        {shape.fields.length === 0 && (
          <div className="text-xs text-ink-faint italic mb-1">No fields yet.</div>
        )}
        <div className="space-y-1.5">
          {shape.fields.map((f, i) => (
            <FieldRow
              key={f.id}
              field={f}
              isFirst={i === 0}
              isLast={i === shape.fields.length - 1}
              onUp={() => moveField(f.id, -1)}
              onDown={() => moveField(f.id, 1)}
              onChange={(patch) => updateField(f.id, patch)}
              onDelete={() => deleteField(f.id)}
            />
          ))}
        </div>
        <button
          onClick={addField}
          className="mt-2 text-xs text-ink-soft hover:text-ink rounded px-1.5 py-0.5"
          data-test="new-field"
        >
          + field
        </button>
      </div>
    </div>
  )
}

function FieldRow({
  field, isFirst, isLast, onUp, onDown, onChange, onDelete
}: {
  field: DataShapeField
  isFirst: boolean
  isLast: boolean
  onUp: () => void
  onDown: () => void
  onChange: (patch: Partial<DataShapeField>) => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState({
    name: field.name,
    type: field.type,
    description: field.description
  })
  const isDirty =
    draft.name !== field.name ||
    draft.type !== field.type ||
    draft.description !== field.description
  const signature = draft.name + '\u0000' + draft.type + '\u0000' + draft.description
  useDebouncedAutosave(signature, isDirty, () => onChange(draft))

  return (
    <div
      className="rounded border border-line bg-surface px-2 py-1.5 group/field"
      data-test="field-row"
      data-field-id={field.id}
    >
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          <button
            onClick={onUp} disabled={isFirst}
            className="text-[10px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="field-up"
          >↑</button>
          <button
            onClick={onDown} disabled={isLast}
            className="text-[10px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="field-down"
          >↓</button>
        </div>
        <input
          className="title-input flex-[2] text-xs text-ink"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="field name"
          data-test="field-name"
        />
        <input
          className="title-input flex-1 text-xs text-ink-soft font-mono"
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          placeholder="type"
          data-test="field-type"
        />
        <button
          onClick={onDelete}
          className="text-[10px] text-ink-faint hover:text-bad px-1 opacity-0 group-hover/field:opacity-100 transition-opacity"
          data-test="field-delete"
        >×</button>
      </div>
      <input
        className="title-input mt-1 w-full text-xs text-ink-faint"
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        placeholder="description (what this field represents)"
        data-test="field-description"
      />
    </div>
  )
}
