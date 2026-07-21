import { useRef, useState } from 'react'
import { ThemeTokenName, hexToRgbTriplet, rgbTripletToHex, useTheme } from '../../theme'
import { useWorkspace } from '../../context'
import { downloadText } from '../../util/download'
import { TagManager } from '../../components/TagManager'
import { DiagnosticPanel } from '../../components/DiagnosticPanel'
import { WorkspaceHealthPanel } from '../../components/WorkspaceHealthPanel'
import { resetSeedData } from '../../seed'
import { useDevMode } from '../../useDevMode'

const LONGFORM_SECTION_LIST_ALWAYS_VISIBLE_KEY = 'verse-studio:longform:sectionList:alwaysVisible'

type SettingsTab = 'general' | 'diagnostic' | 'health'


const THEME_CUSTOM_TOKENS: Array<{ token: ThemeTokenName, label: string, selector: string }> = [
  { token: '--bg', label: 'Background', selector: 'theme-custom-bg' },
  { token: '--surface', label: 'Surface', selector: 'theme-custom-surface' },
  { token: '--ink', label: 'Ink', selector: 'theme-custom-ink' },
  { token: '--accent', label: 'Accent', selector: 'theme-custom-accent' },
  { token: '--line', label: 'Line', selector: 'theme-custom-line' }
]

function presetButtonClass(active: boolean): string {
  return `px-3 py-1.5 text-sm rounded border transition-colors ${
    active
      ? 'border-accent text-ink bg-accent/10'
      : 'border-line text-ink-soft hover:text-ink hover:bg-surface-2'
  }`
}


function ThemeSection() {
  const [preset, setPreset, , themeTools] = useTheme()
  const overrideCount = Object.keys(themeTools.settings.overrides ?? {}).length

  function setHexOverride(token: ThemeTokenName, value: string) {
    const rgb = hexToRgbTriplet(value)
    if (rgb) themeTools.setOverride(token, rgb)
  }

  return (
    <section className="mb-8">
      <div className="text-xs uppercase tracking-widest text-ink-faint mb-2">Theme</div>
      <div className="rounded-lg border border-line bg-surface-2/60 p-3 space-y-4">
        <div>
          <div className="text-[11px] text-ink-faint mb-2">Preset</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPreset('matrix')} className={presetButtonClass(preset === 'matrix')} data-test="theme-preset-matrix">Matrix</button>
            <button type="button" onClick={() => setPreset('paper')} className={presetButtonClass(preset === 'paper')} data-test="theme-preset-paper"><span data-test="theme-light">Paper</span></button>
            <button type="button" onClick={() => setPreset('midnight')} className={presetButtonClass(preset === 'midnight')} data-test="theme-preset-midnight"><span data-test="theme-dark">Midnight</span></button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <div className="text-[11px] text-ink-faint">Custom color overrides</div>
              <p className="text-[11px] text-ink-faint mt-1">Stored as RGB triplets; shown here as hex for editing.</p>
            </div>
            <div className="text-[11px] text-ink-faint">{overrideCount} active</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {THEME_CUSTOM_TOKENS.map(({ token, label, selector }) => (
              <label key={token} className="flex items-center justify-between gap-2 rounded border border-line bg-surface px-2 py-2 text-xs text-ink-soft">
                <span>{label}</span>
                <input
                  type="text"
                  value={rgbTripletToHex(themeTools.getToken(token))}
                  onChange={(e) => setHexOverride(token, e.target.value)}
                  maxLength={7}
                  pattern="#[0-9a-fA-F]{6}"
                  className="w-24 rounded border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink"
                  data-test={selector}
                  aria-label={`${label} hex color`}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={themeTools.resetOverrides}
            className="text-xs px-3 py-1.5 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface transition-colors"
            data-test="theme-reset-overrides"
          >
            Reset to preset
          </button>
          <button
            type="button"
            onClick={themeTools.randomize}
            className="text-xs px-3 py-1.5 rounded border border-accent/60 text-accent hover:bg-accent/10 transition-colors"
            data-test="theme-randomize"
          >
            Constrained randomize
          </button>
        </div>
      </div>
    </section>
  )
}


function DemoResetSection() {
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleReset() {
    setResetting(true)
    try {
      await resetSeedData()
      setDone(true)
      setConfirming(false)
      window.setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      console.error('Seed reset failed:', e)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="border border-line rounded-lg p-4 mt-6">
      <h3 className="text-sm font-medium text-ink mb-1">Demo project</h3>
      <p className="text-xs text-ink-soft mb-3">
        Reset the Meridian demo project to its original state. Your own records are
        not affected.
      </p>
      {done ? (
        <p className="text-xs text-good" data-test="seed-reset-success">
          Demo project reset. Reloading…
        </p>
      ) : confirming ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="text-xs px-3 py-1.5 rounded border border-line text-bad hover:bg-surface-3 transition-colors disabled:opacity-50"
            data-test="seed-reset-confirm"
          >
            {resetting ? 'Resetting…' : 'Yes, reset demo'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs px-3 py-1.5 rounded border border-line text-ink-soft hover:bg-surface-3 transition-colors"
            data-test="seed-reset-cancel"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs px-3 py-1.5 rounded border border-line text-ink-soft hover:bg-surface-3 transition-colors"
          data-test="seed-reset-button"
        >
          Reset demo project
        </button>
      )}
    </div>
  )
}

export function Settings() {
  const ws = useWorkspace()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { devMode, setDevMode } = useDevMode()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [statusMsg, setStatusMsg] = useState<{ kind: 'ok' | 'err', text: string } | null>(null)
  const [wipeStage, setWipeStage] = useState<'idle' | 'arming' | 'armed'>('idle')
  const [longformSectionListAlwaysVisible, setLongformSectionListAlwaysVisible] = useState<boolean>(() => {
    try { return localStorage.getItem(LONGFORM_SECTION_LIST_ALWAYS_VISIBLE_KEY) === 'true' } catch { return false }
  })

  function flash(kind: 'ok' | 'err', text: string) {
    setStatusMsg({ kind, text })
    window.setTimeout(() => setStatusMsg((cur) => cur?.text === text ? null : cur), 4000)
  }

  function setAlwaysShowLongformSectionList(next: boolean) {
    setLongformSectionListAlwaysVisible(next)
    try { localStorage.setItem(LONGFORM_SECTION_LIST_ALWAYS_VISIBLE_KEY, next ? 'true' : 'false') } catch {}
  }

  async function handleExport() {
    try {
      const data = await ws.exportWorkspace()
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      downloadText(`verse-studio-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json')
      flash('ok', 'Exported.')
    } catch (e: any) {
      flash('err', `Export failed: ${e?.message || e}`)
    }
  }

  function handleImportClick() { fileInputRef.current?.click() }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text()
      let data: any
      try { data = JSON.parse(text) }
      catch { return flash('err', 'Could not parse file as JSON.') }
      const result = await ws.importWorkspace(data, importMode)
      if (result.ok) flash('ok', `Imported (${importMode}).`)
      else flash('err', result.message ?? 'Import failed.')
    } catch (e: any) {
      flash('err', `Import failed: ${e?.message || e}`)
    }
  }

  async function handleWipe() {
    if (wipeStage === 'idle') {
      setWipeStage('arming')
      window.setTimeout(() => setWipeStage((s) => s === 'arming' ? 'idle' : s), 4000)
      return
    }
    if (wipeStage === 'arming') {
      setWipeStage('armed')
      window.setTimeout(() => setWipeStage((s) => s === 'armed' ? 'idle' : s), 4000)
      return
    }
    try {
      await ws.wipeWorkspace()
      flash('ok', 'Workspace wiped and re-seeded.')
    } catch (e: any) {
      flash('err', `Wipe failed: ${e?.message || e}`)
    }
    setWipeStage('idle')
  }

  const wipeLabel =
    wipeStage === 'idle'   ? 'Wipe workspace…' :
    wipeStage === 'arming' ? 'Are you sure?' :
                             'Click once more to wipe'

  const tabClass = (t: SettingsTab) =>
    `px-3 py-1.5 text-sm rounded-t border-b-2 transition-colors ${
      activeTab === t
        ? 'border-accent text-ink bg-surface-2'
        : 'border-transparent text-ink-faint hover:text-ink hover:bg-surface-2'
    }`

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl text-ink mb-5">Settings</h1>

      <div className="flex gap-1 border-b border-line mb-6">
        <button className={tabClass('general')}    onClick={() => setActiveTab('general')}    data-test="settings-tab-general">General</button>
        <button className={tabClass('diagnostic')} onClick={() => setActiveTab('diagnostic')} data-test="settings-tab-diagnostic">Diagnostic</button>
        <button className={tabClass('health')}     onClick={() => setActiveTab('health')}     data-test="settings-tab-health">Health</button>
      </div>

      {activeTab === 'general' && (
        <>
          <ThemeSection />

          <section className="mb-8">
            <div className="text-xs uppercase tracking-widest text-ink-faint mb-2">Longform</div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={longformSectionListAlwaysVisible} onChange={(e) => setAlwaysShowLongformSectionList(e.target.checked)} data-test="settings-longform-section-list-always-visible" />
              Always show Longform section list
            </label>
            <p className="text-[11px] text-ink-faint mt-2">Keeps the section panel visible even if its collapse state is saved as collapsed.</p>
          </section>

          <section className="mb-8">
            <div className="text-xs uppercase tracking-widest text-ink-faint mb-2">Workspace</div>
            <p className="text-xs text-ink-faint mb-3">Your work lives in this browser's IndexedDB. Export saves a JSON snapshot you can keep elsewhere or import later.</p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button onClick={handleExport}      className="text-sm px-3 py-1.5 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2" data-test="export">Export workspace…</button>
              <button onClick={handleImportClick} className="text-sm px-3 py-1.5 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2" data-test="import">Import workspace…</button>
              <select value={importMode} onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')} className="text-xs text-ink-soft bg-surface-2 border border-line rounded px-2 py-1.5" data-test="import-mode" title="How import handles existing records">
                <option value="merge">merge (keep existing)</option>
                <option value="replace">replace (wipe first)</option>
              </select>
              <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" data-test="import-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = '' }} />
            </div>
            {statusMsg && (
              <div className={`mt-3 text-xs rounded px-2 py-1.5 ${statusMsg.kind === 'ok' ? 'bg-surface-2 text-good border border-line' : 'bg-surface-2 text-bad border border-bad'}`} data-test="settings-status" data-status-kind={statusMsg.kind}>
                {statusMsg.text}
              </div>
            )}
          </section>

          <section className="mb-8"><TagManager /></section>

          <section className="mb-8">
            <div className="text-xs uppercase tracking-widest text-ink-faint mb-2">Reset</div>
            <button onClick={handleWipe} className={`text-sm px-3 py-1.5 rounded border ${wipeStage === 'idle' ? 'border-line text-ink-soft hover:text-bad hover:border-bad' : 'border-bad text-bad bg-surface-2'}`} data-test="wipe" data-wipe-stage={wipeStage}>
              {wipeLabel}
            </button>
            <p className="text-[11px] text-ink-faint mt-2">Wipe clears every store and re-seeds the placeholder content. Export first if you want a copy.</p>
          </section>

          <DemoResetSection />

          <section className="mb-8">
            <div className="text-xs uppercase tracking-widest text-ink-faint mb-2">Experimental</div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={devMode}
                onChange={(e) => setDevMode(e.target.checked)}
                data-test="settings-toggle-dev-mode"
              />
              Show experimental studios
            </label>
            <p className="text-[11px] text-ink-faint mt-2">
              Re-exposes Inbox, Longform, App Design, and Library in the sidebar. These surfaces
              are still under development; their direct URLs work regardless of this toggle.
            </p>
          </section>
        </>
      )}

      {activeTab === 'diagnostic' && <DiagnosticPanel />}
      {activeTab === 'health' && <WorkspaceHealthPanel />}
    </div>
  )
}
