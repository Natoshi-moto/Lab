import { useMemo, useState } from 'react'
import { useWorkspace } from '../context'
import { DB_VERSION, SCHEMA_VERSION, STORES, type StoreName } from '../db'
import { computeWorkspaceHealthSignals } from '../util/healthSignals'

type SignalConsoleTab = 'schema' | 'storage' | 'health'
type CopyStatus = 'idle' | 'copied' | 'err'
type WorkspaceState = ReturnType<typeof useWorkspace>
type WorkspaceArrayKey = {
  [K in keyof WorkspaceState]: WorkspaceState[K] extends unknown[] ? K : never
}[keyof WorkspaceState]

type StoreMapping =
  | { store: StoreName; stateKey: WorkspaceArrayKey; note?: undefined }
  | { store: StoreName; stateKey: null; note: string }

const CANONICAL_DATA_TEST_SELECTOR_COUNT = 622

const STORE_MAPPINGS: StoreMapping[] = [
  { store: 'meta', stateKey: null, note: 'not loaded into workspace context' },
  { store: 'writingDocs', stateKey: 'documents' },
  { store: 'poems', stateKey: 'poems' },
  { store: 'longformProjects', stateKey: 'longformDocs' },
  { store: 'longformSections', stateKey: 'sections' },
  { store: 'appDesignBuilds', stateKey: 'builds' },
  { store: 'appDesignConstraints', stateKey: 'constraints' },
  { store: 'appDesignFeatures', stateKey: 'features' },
  { store: 'appDesignScreens', stateKey: 'screens' },
  { store: 'appDesignDataShapes', stateKey: 'dataShapes' },
  { store: 'appDesignPhases', stateKey: 'phases' },
  { store: 'appDesignReviews', stateKey: 'reviews' },
  { store: 'shelf', stateKey: 'shelfItems' },
  { store: 'projects', stateKey: 'projects' },
  { store: 'links', stateKey: 'links' },
  { store: 'tags', stateKey: 'tags' },
  { store: 'tagLinks', stateKey: 'tagLinks' },
  { store: 'dockerScratch', stateKey: 'dockerScratch' },
  { store: 'dockerClipboard', stateKey: 'dockerClipboard' },
  { store: 'snapshots', stateKey: 'snapshots' },
  { store: 'patterns', stateKey: 'patterns' },
  { store: 'promptPipelines', stateKey: 'pipelines' },
  { store: 'promptBlocks', stateKey: 'blocks' },
  { store: 'inboxItems', stateKey: 'inboxItems' },
  { store: 'nodePositions', stateKey: 'nodePositions' },
  { store: 'notes', stateKey: 'notes' },
  { store: 'scraps', stateKey: 'scraps' },
  { store: 'prompts', stateKey: 'prompts' },
]

interface StorageRow {
  key: string
  value: string
}

interface SignalConsoleProps {
  open: boolean
}

function readVerseStorage(): StorageRow[] {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('verse-studio:'))
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({ key, value: localStorage.getItem(key) ?? '' }))
  } catch {
    return []
  }
}

function truncateValue(value: string): string {
  return value.length > 60 ? value.slice(0, 60) + '…' : value
}

export function SignalConsole({ open }: SignalConsoleProps): JSX.Element {
  const ws = useWorkspace()
  const [activeTab, setActiveTab] = useState<SignalConsoleTab>('schema')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  const storageRows = useMemo(() => readVerseStorage(), [open, activeTab])
  const healthSignals = useMemo(() => computeWorkspaceHealthSignals(ws), [ws])
  const activeHealthSignals = healthSignals.filter(sig => sig.count > 0)

  const storeRows = STORES.map((store) => {
    const mapping = STORE_MAPPINGS.find(m => m.store === store)
    if (!mapping) {
      return { store, stateKey: 'MISSING', count: null, note: 'missing source-verified mapping' }
    }
    if (mapping.stateKey === null) {
      return { store, stateKey: '—', count: null, note: mapping.note }
    }
    return {
      store,
      stateKey: mapping.stateKey,
      count: (ws[mapping.stateKey] as unknown[]).length,
      note: null,
    }
  })

  async function copyStorageAsJson() {
    const map: Record<string, string> = {}
    for (const row of readVerseStorage()) map[row.key] = row.value
    try {
      await navigator.clipboard.writeText(JSON.stringify(map, null, 2))
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2500)
    } catch {
      setCopyStatus('err')
      setTimeout(() => setCopyStatus('idle'), 2500)
    }
  }

  function tabClass(tab: SignalConsoleTab): string {
    return activeTab === tab
      ? 'border-accent text-ink bg-surface-3'
      : 'border-line text-ink-soft hover:text-ink hover:bg-surface-2'
  }

  return (
    <div
      data-test="signal-console"
      data-open={open ? 'true' : 'false'}
      className={`fixed left-0 right-0 top-0 z-50 h-[360px] bg-surface border-b border-line shadow-xl transition-transform duration-200 ease-out ${open ? 'translate-y-0' : '-translate-y-full pointer-events-none'}`}
      aria-hidden={open ? 'false' : 'true'}
    >
      <div className="h-full flex flex-col">
        <header className="h-12 shrink-0 flex items-center justify-between gap-4 border-b border-line px-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink" data-test="signal-console-title">Signal Console</div>
            <div className="text-[11px] text-ink-faint" data-test="signal-console-shortcut">Cmd/Ctrl+Shift+. · read-only signals</div>
          </div>
          <div className="flex items-center gap-2" data-test="signal-console-tabs">
            <button type="button" className={`px-3 py-1.5 rounded border text-xs transition-colors ${tabClass('schema')}`} onClick={() => setActiveTab('schema')} data-test="signal-console-tab-schema">Schema</button>
            <button type="button" className={`px-3 py-1.5 rounded border text-xs transition-colors ${tabClass('storage')}`} onClick={() => setActiveTab('storage')} data-test="signal-console-tab-storage">Storage</button>
            <button type="button" className={`px-3 py-1.5 rounded border text-xs transition-colors ${tabClass('health')}`} onClick={() => setActiveTab('health')} data-test="signal-console-tab-health">Health</button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-4" data-test="signal-console-body">
          {activeTab === 'schema' && (
            <section className="space-y-4" data-test="signal-console-panel-schema">
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded border border-line bg-surface-2 p-3" data-test="signal-console-db-version">
                  <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">DB_VERSION</div>
                  <div className="font-mono text-lg text-ink">{DB_VERSION}</div>
                </div>
                <div className="rounded border border-line bg-surface-2 p-3" data-test="signal-console-schema-version">
                  <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">SCHEMA_VERSION</div>
                  <div className="font-mono text-lg text-ink">{SCHEMA_VERSION}</div>
                </div>
                <div className="rounded border border-line bg-surface-2 p-3" data-test="signal-console-store-total">
                  <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">STORES.length</div>
                  <div className="font-mono text-lg text-ink">{STORES.length}</div>
                </div>
                <div className="rounded border border-line bg-surface-2 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-1">data-test selectors</div>
                  <div className="font-mono text-lg text-ink">{CANONICAL_DATA_TEST_SELECTOR_COUNT}</div>
                </div>
              </div>
              <div className="rounded border border-line bg-surface-2 divide-y divide-line" data-test="signal-console-store-counts">
                {storeRows.map(row => (
                  <div key={row.store} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 px-3 py-1.5 text-xs" data-test="signal-console-store-row">
                    <span className="font-mono text-ink-soft truncate">{row.store}</span>
                    <span className="font-mono text-ink-faint truncate">{row.stateKey}</span>
                    <span className="font-mono text-ink text-right" data-test="signal-console-store-count">
                      {row.count === null ? row.note : row.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'storage' && (
            <section className="space-y-4" data-test="signal-console-panel-storage">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-ink-faint" data-test="signal-console-storage-summary">
                  Dynamically discovered `verse-studio:` keys. Values shown here are read-only.
                </p>
                <button
                  type="button"
                  className="shrink-0 text-xs px-3 py-1.5 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
                  onClick={copyStorageAsJson}
                  data-test="signal-console-copy-storage"
                >
                  {copyStatus === 'idle' && 'Copy all as JSON'}
                  {copyStatus === 'copied' && 'Copied ✓'}
                  {copyStatus === 'err' && 'Copy failed'}
                </button>
              </div>
              <div className="rounded border border-line bg-surface-2 divide-y divide-line" data-test="signal-console-storage-rows">
                {storageRows.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-ink-faint" data-test="signal-console-storage-empty">No `verse-studio:` keys found.</div>
                ) : storageRows.map(row => (
                  <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 px-3 py-1.5 text-xs" data-test="signal-console-storage-row">
                    <span className="font-mono text-ink-soft truncate">{row.key}</span>
                    <span className="font-mono text-ink-faint truncate" title={row.value}>{truncateValue(row.value)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'health' && (
            <section className="space-y-4" data-test="signal-console-panel-health">
              <p className="text-xs text-ink-faint" data-test="signal-console-health-summary">
                Shared workspace health signals, displayed without navigation or repair controls.
              </p>
              {activeHealthSignals.length === 0 ? (
                <div className="rounded border border-line bg-surface-2 px-4 py-6 text-center text-sm text-ink-faint" data-test="signal-console-health-empty">
                  No issues found.
                </div>
              ) : (
                <div className="rounded border border-line bg-surface-2 divide-y divide-line" data-test="signal-console-health-rows">
                  {activeHealthSignals.map(sig => (
                    <div key={sig.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2.5" data-test="signal-console-health-row">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-ink font-medium">{sig.label}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-3 text-ink-soft" data-test="signal-console-health-count">{sig.count}</span>
                        </div>
                        <div className="text-[11px] text-ink-faint">{sig.description}</div>
                        {sig.example && <div className="text-[11px] text-ink-soft mt-0.5 truncate italic">{sig.example}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
