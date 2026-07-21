import { useEffect, useState } from 'react'

export type CanvasContentType = 'note' | 'document' | 'poem' | 'longform' | 'scrap' | 'unknown'

export type LayerVisibility = Record<CanvasContentType, boolean>
export type LayerCounts = Record<CanvasContentType, number>

export const CONTENT_TYPE_ORDER: CanvasContentType[] = [
  'note',
  'document',
  'poem',
  'longform',
  'scrap',
  'unknown',
]

const CONTENT_TYPE_LABELS: Record<CanvasContentType, string> = {
  note: 'Note',
  document: 'Document',
  poem: 'Poem',
  longform: 'Longform',
  scrap: 'Scrap',
  unknown: 'Unknown',
}

const CONTENT_TYPE_TEST_IDS: Record<CanvasContentType, string> = {
  note: 'canvas-layer-row-note',
  document: 'canvas-layer-row-document',
  poem: 'canvas-layer-row-poem',
  longform: 'canvas-layer-row-longform',
  scrap: 'canvas-layer-row-scrap',
  unknown: 'canvas-layer-row-unknown',
}

const PANEL_COLLAPSED_KEY = 'verse-studio:canvas:layerPanel:collapsed'

export function createDefaultLayerVisibility(): LayerVisibility {
  return {
    note: true,
    document: true,
    poem: true,
    longform: true,
    scrap: true,
    unknown: true,
  }
}

export function createEmptyLayerCounts(): LayerCounts {
  return {
    note: 0,
    document: 0,
    poem: 0,
    longform: 0,
    scrap: 0,
    unknown: 0,
  }
}

interface LayerPanelProps {
  visibility: LayerVisibility
  counts: LayerCounts
  onVisibilityChange: (next: LayerVisibility | ((current: LayerVisibility) => LayerVisibility)) => void
}

export function LayerPanel({ visibility, counts, onVisibilityChange }: LayerPanelProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(PANEL_COLLAPSED_KEY)
      return raw === null ? true : raw === 'true'
    } catch { return true }
  })

  useEffect(() => {
    try { localStorage.setItem(PANEL_COLLAPSED_KEY, collapsed ? 'true' : 'false') } catch {}
  }, [collapsed])

  function setAll(value: boolean) {
    const next = createDefaultLayerVisibility()
    for (const type of CONTENT_TYPE_ORDER) next[type] = value
    onVisibilityChange(next)
  }

  return (
    <div
      className="absolute bottom-4 left-4 z-40 rounded border border-line bg-surface-2 text-ink shadow-lg overflow-hidden"
      data-test="canvas-layer-panel"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="px-3 py-2 text-xs font-medium text-ink hover:bg-surface transition-colors"
          data-test="canvas-layer-panel-toggle"
        >
          Layers
        </button>
      ) : (
        <div className="w-56 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-xs font-medium text-ink hover:text-accent transition-colors"
              data-test="canvas-layer-panel-toggle"
            >
              Layers
            </button>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => setAll(true)}
              className="text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink transition-colors"
              data-test="canvas-layer-show-all"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={() => setAll(false)}
              className="text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink transition-colors"
              data-test="canvas-layer-hide-all"
            >
              Hide All
            </button>
          </div>

          <div className="space-y-1">
            {CONTENT_TYPE_ORDER.map((type) => {
              const zeroUnknown = type === 'unknown' && counts.unknown === 0
              return (
                <label
                  key={type}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-surface transition-colors"
                  data-test={CONTENT_TYPE_TEST_IDS[type]}
                >
                  <input
                    type="checkbox"
                    checked={visibility[type]}
                    onChange={(e) => {
                      const checked = e.target.checked
                      onVisibilityChange((current) => ({ ...current, [type]: checked }))
                    }}
                    className="h-3 w-3 accent-accent"
                  />
                  <span className={`flex-1 ${zeroUnknown ? 'text-ink-faint' : 'text-ink'}`}>
                    {CONTENT_TYPE_LABELS[type]}
                  </span>
                  <span className="text-ink-faint tabular-nums">{counts[type]}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
