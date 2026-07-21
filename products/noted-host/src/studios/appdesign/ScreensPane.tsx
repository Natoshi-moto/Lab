import { useState } from 'react'
import { useWorkspace } from '../../context'
import type {
  AppDesignScreen, ScreenZone, ScreenElement, ElementType, AppDesignFeature
} from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'

const ELEMENT_TYPES: ElementType[] = [
  'button', 'field', 'textarea', 'list', 'panel', 'label', 'image', 'link', 'other'
]

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function ScreensPane({ buildId }: { buildId: string }) {
  const ws = useWorkspace()
  const screens = ws.screens
    .filter((s) => s.buildId === buildId)
    .sort((a, b) => a.order - b.order)
  const features = ws.features
    .filter((f) => f.buildId === buildId)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="p-6 max-w-3xl">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">Screens</div>
      <p className="text-sm text-ink-faint mb-4">
        Each screen is a place in the app. Zones group elements that travel together. Link the features the screen serves.
      </p>

      {screens.length === 0 && (
        <div className="text-sm text-ink-faint italic mb-4">No screens yet.</div>
      )}

      <div className="space-y-4">
        {screens.map((s, i) => (
          <ScreenRow
            key={s.id}
            screen={s}
            features={features}
            isFirst={i === 0}
            isLast={i === screens.length - 1}
            onUp={() => ws.reorderScreen(s.id, -1)}
            onDown={() => ws.reorderScreen(s.id, 1)}
            onDelete={() => ws.deleteScreen(s.id)}
          />
        ))}
      </div>

      <button
        onClick={() => ws.createScreen(buildId)}
        className="mt-4 px-3 py-1.5 text-sm rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
        data-test="new-screen"
      >
        + Add screen
      </button>
    </div>
  )
}

function ScreenRow({
  screen, features, isFirst, isLast, onUp, onDown, onDelete
}: {
  screen: AppDesignScreen
  features: AppDesignFeature[]
  isFirst: boolean
  isLast: boolean
  onUp: () => void
  onDown: () => void
  onDelete: () => void
}) {
  const ws = useWorkspace()
  const [name, setName] = useState(screen.name)
  const isDirty = name !== screen.name
  useDebouncedAutosave(name, isDirty, () => {
    ws.updateScreen(screen.id, { name })
  })

  function setZones(next: ScreenZone[]) {
    ws.updateScreen(screen.id, { zones: next })
  }
  function addZone() {
    setZones([...screen.zones, { id: uid(), name: 'New zone', elements: [] }])
  }
  function updateZone(zoneId: string, patch: Partial<ScreenZone>) {
    setZones(screen.zones.map((z) => z.id === zoneId ? { ...z, ...patch } : z))
  }
  function deleteZone(zoneId: string) {
    setZones(screen.zones.filter((z) => z.id !== zoneId))
  }
  function moveZone(zoneId: string, direction: -1 | 1) {
    const idx = screen.zones.findIndex((z) => z.id === zoneId)
    if (idx < 0) return
    const target = idx + direction
    if (target < 0 || target >= screen.zones.length) return
    const copy = [...screen.zones]
    ;[copy[idx], copy[target]] = [copy[target], copy[idx]]
    setZones(copy)
  }
  function setElements(zoneId: string, next: ScreenElement[]) {
    updateZone(zoneId, { elements: next })
  }

  function toggleFeatureLink(fid: string) {
    const has = screen.featureLinks.includes(fid)
    const next = has
      ? screen.featureLinks.filter((x) => x !== fid)
      : [...screen.featureLinks, fid]
    ws.updateScreen(screen.id, { featureLinks: next })
  }

  return (
    <div
      className="group rounded border border-line bg-surface-2 p-4"
      data-test="screen-row"
      data-screen-id={screen.id}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            onClick={onUp} disabled={isFirst}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="screen-up" title="Move up"
          >↑</button>
          <button
            onClick={onDown} disabled={isLast}
            className="text-[11px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="screen-down" title="Move down"
          >↓</button>
        </div>
        <input
          className="title-input flex-1 text-base text-ink font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Screen name"
          data-test="screen-name"
          data-screen-edit-id={screen.id}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Feature links */}
      {features.length > 0 && (
        <div className="mt-3 ml-1">
          <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">Features served</div>
          <div className="flex flex-wrap gap-1.5">
            {features.map((f) => {
              const linked = screen.featureLinks.includes(f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFeatureLink(f.id)}
                  className={`text-xs px-2 py-1 rounded border ${
                    linked
                      ? 'border-accent bg-surface text-ink'
                      : 'border-line text-ink-faint hover:text-ink hover:bg-surface'
                  }`}
                  data-test="feature-link"
                  data-linked={linked ? 'true' : 'false'}
                  data-feature-id={f.id}
                >
                  {f.statement || '(unnamed feature)'}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Zones */}
      <div className="mt-3 ml-1">
        <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">Zones</div>
        {screen.zones.length === 0 && (
          <div className="text-xs text-ink-faint italic mb-1">No zones yet.</div>
        )}
        <div className="space-y-2">
          {screen.zones.map((z, i) => (
            <ZoneRow
              key={z.id}
              zone={z}
              isFirst={i === 0}
              isLast={i === screen.zones.length - 1}
              onUp={() => moveZone(z.id, -1)}
              onDown={() => moveZone(z.id, 1)}
              onRename={(name) => updateZone(z.id, { name })}
              onDelete={() => deleteZone(z.id)}
              onElementsChange={(next) => setElements(z.id, next)}
            />
          ))}
        </div>
        <button
          onClick={addZone}
          className="mt-2 text-xs text-ink-soft hover:text-ink rounded px-1.5 py-0.5"
          data-test="new-zone"
        >
          + zone
        </button>
      </div>
    </div>
  )
}

function ZoneRow({
  zone, isFirst, isLast, onUp, onDown, onRename, onDelete, onElementsChange
}: {
  zone: ScreenZone
  isFirst: boolean
  isLast: boolean
  onUp: () => void
  onDown: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onElementsChange: (next: ScreenElement[]) => void
}) {
  const [name, setName] = useState(zone.name)
  const isDirty = name !== zone.name
  useDebouncedAutosave(name, isDirty, () => onRename(name))

  function addElement() {
    onElementsChange([...zone.elements, { id: uid(), type: 'button', label: '' }])
  }
  function updateElement(id: string, patch: Partial<ScreenElement>) {
    onElementsChange(zone.elements.map((e) => e.id === id ? { ...e, ...patch } : e))
  }
  function deleteElement(id: string) {
    onElementsChange(zone.elements.filter((e) => e.id !== id))
  }

  return (
    <div className="rounded border border-line bg-surface px-3 py-2 group/zone" data-test="zone-row" data-zone-id={zone.id}>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          <button
            onClick={onUp} disabled={isFirst}
            className="text-[10px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="zone-up"
          >↑</button>
          <button
            onClick={onDown} disabled={isLast}
            className="text-[10px] px-1 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="zone-down"
          >↓</button>
        </div>
        <input
          className="title-input flex-1 text-sm text-ink"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Zone name"
          data-test="zone-name"
        />
        <button
          onClick={onDelete}
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover/zone:opacity-100 transition-opacity"
          data-test="zone-delete"
        >
          del
        </button>
      </div>

      {zone.elements.length > 0 && (
        <div className="mt-2 space-y-1">
          {zone.elements.map((el) => (
            <ElementRow
              key={el.id}
              element={el}
              onChange={(patch) => updateElement(el.id, patch)}
              onDelete={() => deleteElement(el.id)}
            />
          ))}
        </div>
      )}
      <button
        onClick={addElement}
        className="mt-1 text-xs text-ink-faint hover:text-ink rounded px-1.5 py-0.5"
        data-test="new-element"
      >
        + element
      </button>
    </div>
  )
}

function ElementRow({
  element, onChange, onDelete
}: {
  element: ScreenElement
  onChange: (patch: Partial<ScreenElement>) => void
  onDelete: () => void
}) {
  const [label, setLabel] = useState(element.label)
  const isDirty = label !== element.label
  useDebouncedAutosave(label, isDirty, () => onChange({ label }))

  return (
    <div className="flex items-center gap-2 group/element" data-test="element-row" data-element-id={element.id}>
      <select
        value={element.type}
        onChange={(e) => onChange({ type: e.target.value as ElementType })}
        className="text-xs text-ink-soft bg-surface-2 border border-line rounded px-1.5 py-0.5 hover:text-ink"
        data-test="element-type"
      >
        {ELEMENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
      </select>
      <input
        className="title-input flex-1 text-xs text-ink"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Element label"
        data-test="element-label"
      />
      <button
        onClick={onDelete}
        className="text-[10px] text-ink-faint hover:text-bad px-1 opacity-0 group-hover/element:opacity-100 transition-opacity"
        data-test="element-delete"
      >
        ×
      </button>
    </div>
  )
}
