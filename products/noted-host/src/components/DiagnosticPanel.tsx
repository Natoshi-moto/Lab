import { useState } from 'react'
import { useWorkspace } from '../context'
import { downloadText } from '../util/download'
import { DB_VERSION, SCHEMA_VERSION } from '../db'
import { exportValidationBundle } from '../diagnosticExporter'

const LS_KEYS: Array<{ key: string; label: string }> = [
  { key: 'verse-studio:theme',                              label: 'theme' },
  { key: 'verse-studio:focus',                              label: 'focus mode' },
  { key: 'verse-studio:sidebar:collapsed',                  label: 'sidebar collapsed' },
  { key: 'verse-studio:nexus-panel:open',                   label: 'nexus panel open' },
  { key: 'verse-studio:scratch-drawer:open',                label: 'scratch drawer open' },
  { key: 'verse-studio:scratch-drawer:tab',                 label: 'scratch drawer tab' },
  { key: 'verse-studio:scratch-drawer:height',              label: 'scratch drawer height' },
  { key: 'verse-studio:writing:lastDoc',                    label: 'writing: last doc' },
  { key: 'verse-studio:writing:listWidth',                  label: 'writing: list width' },
  { key: 'verse-studio:poetry:lastPoem',                    label: 'poetry: last poem' },
  { key: 'verse-studio:notes:lastSelected',                 label: 'notes: last selected' },
  { key: 'verse-studio:longform:lastDoc',                   label: 'longform: last doc' },
  { key: 'verse-studio:longform:lastSection',               label: 'longform: last section' },
  { key: 'verse-studio:appdesign:lastBuild',                label: 'appdesign: last build' },
  { key: 'verse-studio:projects:lastProject',               label: 'projects: last project' },
  { key: 'verse-studio:projects:lastActive',                label: 'projects: last active (QC)' },
  { key: 'verse-studio:prompts:lastPipeline',               label: 'prompts: last pipeline' },
  { key: 'verse-studio:prompts:blockLibrary:collapsed',     label: 'prompts: block library collapsed' },
  { key: 'verse-studio:prompts:pipelinePreview',            label: 'prompts: pipeline preview' },
  { key: 'verse-studio:canvas:lastProject',                 label: 'canvas: last project' },
  { key: 'verse-studio:canvas:layerPanel:collapsed',        label: 'canvas: layer panel collapsed' },
  { key: 'verse-studio:inbox:lastItem',                     label: 'inbox: last item' },
  { key: 'verse-studio:library:lastPattern',                label: 'library: last pattern' },
  { key: 'verse-studio:longform:sectionList:alwaysVisible', label: 'longform: section list always visible' },
]

function lsPresent(key: string): boolean {
  try { return localStorage.getItem(key) !== null } catch { return false }
}

type ExportStatus = 'idle' | 'working' | 'done' | 'err'
type CopyStatus = 'idle' | 'copied' | 'err'
type BundleStatus = 'idle' | 'working' | 'done' | 'err'

export function DiagnosticPanel(): JSX.Element {
  const ws = useWorkspace()
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const [bundleStatus, setBundleStatus] = useState<BundleStatus>('idle')

  const stores = [
    { label: 'Writing docs',      active: ws.documents.filter(r => !r.deletedAt).length,    deleted: ws.documents.filter(r => r.deletedAt).length },
    { label: 'Poems',             active: ws.poems.filter(r => !r.deletedAt).length,         deleted: ws.poems.filter(r => r.deletedAt).length },
    { label: 'Notes',             active: ws.notes.filter(r => !r.deletedAt).length,         deleted: ws.notes.filter(r => r.deletedAt).length },
    { label: 'Scraps',            active: ws.scraps.filter(r => !r.deletedAt).length,        deleted: ws.scraps.filter(r => r.deletedAt).length },
    { label: 'Prompts',           active: ws.prompts.filter(r => !r.deletedAt).length,       deleted: ws.prompts.filter(r => r.deletedAt).length },
    { label: 'Longform docs',     active: ws.longformDocs.filter(r => !r.deletedAt).length,  deleted: ws.longformDocs.filter(r => r.deletedAt).length },
    { label: 'Sections',          active: ws.sections.length,                                 deleted: 0 },
    { label: 'App design builds', active: ws.builds.filter(r => !r.deletedAt).length,        deleted: ws.builds.filter(r => r.deletedAt).length },
    { label: 'Patterns',          active: ws.patterns.filter(r => !r.deletedAt).length,      deleted: ws.patterns.filter(r => r.deletedAt).length },
    { label: 'Pipelines',         active: ws.pipelines.filter(r => !r.deletedAt).length,     deleted: ws.pipelines.filter(r => r.deletedAt).length },
    { label: 'Prompt blocks',     active: ws.blocks.length,                                   deleted: 0 },
    { label: 'Inbox items',       active: ws.inboxItems.filter(r => !r.deletedAt).length,    deleted: ws.inboxItems.filter(r => r.deletedAt).length },
    { label: 'Projects',          active: ws.projects.length,                                 deleted: 0 },
    { label: 'Links',             active: ws.links.length,                                    deleted: 0 },
    { label: 'Tags',              active: ws.tags.length,                                     deleted: 0 },
    { label: 'Snapshots',         active: ws.snapshots.length,                                deleted: 0 },
  ]

  async function handleExport() {
    setExportStatus('working')
    try {
      const data = await ws.exportWorkspace()
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      downloadText(`noted-workspace-backup-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json')
      setExportStatus('done')
      setTimeout(() => setExportStatus('idle'), 3000)
    } catch {
      setExportStatus('err')
      setTimeout(() => setExportStatus('idle'), 3000)
    }
  }

  async function handleBundleExport() {
    setBundleStatus('working')
    try {
      const bundle = await exportValidationBundle(ws)
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      downloadText(
        `noted-diagnostic-bundle-${stamp}.json`,
        JSON.stringify(bundle, null, 2),
        'application/json'
      )
      setBundleStatus('done')
      setTimeout(() => setBundleStatus('idle'), 3000)
    } catch {
      setBundleStatus('err')
      setTimeout(() => setBundleStatus('idle'), 2500)
    }
  }

  async function handleCopySummary() {
    const lsAudit: Record<string, boolean> = {}
    for (const { key } of LS_KEYS) lsAudit[key] = lsPresent(key)
    const storeCounts: Record<string, { active: number; deleted: number }> = {}
    for (const s of stores) storeCounts[s.label] = { active: s.active, deleted: s.deleted }
    const summary = {
      app: 'Noted v0.01-3',
      db_version: DB_VERSION,
      schema_version: SCHEMA_VERSION,
      captured_at: new Date().toISOString(),
      store_counts: storeCounts,
      localstorage_key_presence: lsAudit,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2))
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2500)
    } catch {
      setCopyStatus('err')
      setTimeout(() => setCopyStatus('idle'), 2500)
    }
  }

  return (
    <div className="space-y-8" data-test="diagnostic-panel">

      <section>
        <div className="text-xs uppercase tracking-widest text-ink-faint mb-3">Schema</div>
        <div className="rounded border border-line bg-surface-2 divide-y divide-line text-sm" data-test="diagnostic-schema-version">
          <div className="flex justify-between px-3 py-2">
            <span className="text-ink-soft">DB_VERSION</span>
            <span className="font-mono text-ink">{DB_VERSION}</span>
          </div>
          <div className="flex justify-between px-3 py-2">
            <span className="text-ink-soft">SCHEMA_VERSION</span>
            <span className="font-mono text-ink">{SCHEMA_VERSION}</span>
          </div>
          <div className="flex justify-between px-3 py-2">
            <span className="text-ink-soft">IDB stores</span>
            <span className="font-mono text-ink">28</span>
          </div>
        </div>
      </section>

      <section>
        <div className="text-xs uppercase tracking-widest text-ink-faint mb-3">Store counts</div>
        <div className="rounded border border-line bg-surface-2 divide-y divide-line" data-test="diagnostic-store-counts">
          {stores.map((s) => (
            <div key={s.label} className="flex items-center justify-between px-3 py-1.5" data-test="diagnostic-store-row">
              <span className="text-xs text-ink-soft">{s.label}</span>
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-ink">{s.active}</span>
                {s.deleted > 0 && <span className="text-ink-faint">{s.deleted} deleted</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-xs uppercase tracking-widest text-ink-faint mb-1">localStorage keys</div>
        <p className="text-[11px] text-ink-faint mb-3">Presence only — values are never read or shown.</p>
        <div className="rounded border border-line bg-surface-2 divide-y divide-line" data-test="diagnostic-localstorage-audit">
          {LS_KEYS.map(({ key, label }) => {
            const present = lsPresent(key)
            return (
              <div key={key} className="flex items-center gap-2 px-3 py-1.5" data-test="diagnostic-ls-row">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${present ? 'bg-good' : 'bg-surface-3'}`} title={present ? 'present' : 'absent'} />
                <span className="text-xs text-ink-soft flex-1">{label}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <div className="text-xs uppercase tracking-widest text-ink-faint mb-3">Export</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            disabled={exportStatus === 'working'}
            className="text-sm px-3 py-1.5 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2 disabled:opacity-50 transition-colors"
            data-test="diagnostic-export-workspace"
          >
            {exportStatus === 'idle' && 'Export workspace…'}
            {exportStatus === 'working' && 'Exporting…'}
            {exportStatus === 'done' && 'Downloaded ✓'}
            {exportStatus === 'err' && 'Export failed'}
          </button>
          <button
            onClick={handleCopySummary}
            className="text-sm px-3 py-1.5 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2 transition-colors"
            data-test="diagnostic-copy-summary"
          >
            {copyStatus === 'idle' && 'Copy diagnostic summary'}
            {copyStatus === 'copied' && 'Copied ✓'}
            {copyStatus === 'err' && 'Copy failed'}
          </button>
          <button
            onClick={handleBundleExport}
            disabled={bundleStatus === 'working'}
            className="text-sm px-3 py-1.5 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2 disabled:opacity-50 transition-colors"
            data-test="diagnostic-bundle-export"
          >
            {bundleStatus === 'idle' && 'Export validation bundle'}
            {bundleStatus === 'working' && 'Generating…'}
            {bundleStatus === 'done' && 'Downloaded ✓'}
            {bundleStatus === 'err' && 'Failed'}
          </button>
        </div>
        <div data-test="diagnostic-export-status" className="mt-2 text-[11px] text-ink-faint h-4">
          {exportStatus === 'done' && 'noted-workspace-backup-*.json downloaded.'}
          {exportStatus === 'err' && 'Export failed — check console.'}
          {copyStatus === 'copied' && 'Diagnostic JSON copied to clipboard.'}
        </div>
        <div data-test="diagnostic-bundle-status" className="mt-1 text-[11px] text-ink-faint h-4">
          {bundleStatus === 'done' && 'noted-diagnostic-bundle-*.json downloaded.'}
          {bundleStatus === 'err' && 'Bundle export failed — check console.'}
        </div>
      </section>

    </div>
  )
}
