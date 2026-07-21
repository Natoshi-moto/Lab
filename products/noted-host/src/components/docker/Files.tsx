import { useRef, useState } from 'react'
import { useWorkspace } from '../../context'
import { downloadText } from '../../util/download'

export function Files() {
  const ws = useWorkspace()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [statusMsg, setStatusMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  function flash(kind: 'ok' | 'err', text: string) {
    setStatusMsg({ kind, text })
    window.setTimeout(
      () => setStatusMsg((cur) => (cur?.text === text ? null : cur)),
      4000
    )
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

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      let data: any
      try { data = JSON.parse(text) } catch { return flash('err', 'Could not parse file as JSON.') }
      const result = await ws.importWorkspace(data, 'merge')
      if (result.ok) flash('ok', 'Imported.')
      else flash('err', result.message ?? 'Import failed.')
    } catch (e: any) {
      flash('err', `Import failed: ${e?.message || e}`)
    }
    // reset so same file can be re-imported
    e.target.value = ''
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="text-xs text-ink-faint leading-relaxed">
        Export your workspace as JSON, or import a previously exported file.
      </p>

      <div className="flex gap-2 flex-wrap">
        <button
          data-test="files-export"
          onClick={handleExport}
          className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-surface-3 text-ink hover:bg-surface-3/80 transition-colors"
        >
          Export workspace…
        </button>
        <button
          data-test="files-import"
          onClick={handleImportClick}
          className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-surface-3 text-ink-soft hover:text-ink hover:bg-surface-3/80 transition-colors"
        >
          Import workspace…
        </button>
      </div>

      <input
        ref={fileInputRef}
        data-test="files-import-file"
        type="file"
        accept=".json,application/json"
        onChange={handleImportFile}
        className="hidden"
      />

      {statusMsg && (
        <div
          data-test="files-status"
          data-status-kind={statusMsg.kind}
          className={`text-xs ${statusMsg.kind === 'ok' ? 'text-good' : 'text-bad'}`}
        >
          {statusMsg.text}
        </div>
      )}
    </div>
  )
}
