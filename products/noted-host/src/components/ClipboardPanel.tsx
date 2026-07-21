import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../context'
import type { DockerClipboard, Project } from '../types'
import { InlineConfirmButton } from './InlineConfirmButton'

const HIDDEN_KEY = 'verse-studio:clipboard:hidden'
const LAST_ACTIVE_PROJECT_KEY = 'verse-studio:projects:lastActive'

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch { return new Set() }
}

function saveHidden(ids: Set<string>) {
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids])) } catch {}
}

function isImageEntry(text: string) {
  return text.startsWith('data:image/')
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}


function defaultProjectId(projects: Project[]): string {
  try {
    const lastActive = localStorage.getItem(LAST_ACTIVE_PROJECT_KEY)
    if (lastActive && projects.some((project) => project.id === lastActive)) return lastActive
  } catch {}
  return projects[0]?.id ?? ''
}

export function ClipboardPanel() {
  const ws = useWorkspace()
  const [inputVal, setInputVal] = useState('')
  const [showBin, setShowBin] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(loadHidden)
  const [openScrapPickerId, setOpenScrapPickerId] = useState<string | null>(null)

  const updateHidden = useCallback((next: Set<string>) => {
    setHidden(next)
    saveHidden(next)
  }, [])

  function softDelete(id: string) {
    const next = new Set(hidden)
    next.add(id)
    updateHidden(next)
  }

  function restore(id: string) {
    const next = new Set(hidden)
    next.delete(id)
    updateHidden(next)
  }

  function purge(id: string) {
    restore(id)
    void ws.removeClipboard(id)
  }

  const allEntries = [...ws.dockerClipboard].sort((a, b) => b.capturedAt - a.capturedAt)
  const active = allEntries.filter((entry) => !hidden.has(entry.id))
  const binEntries = allEntries.filter((entry) => hidden.has(entry.id))

  async function handleCaptureText() {
    const text = inputVal.trim()
    if (!text) return
    await ws.captureClipboard({ text, sourceLabel: 'manual' })
    setInputVal('')
  }

  return (
    <div className="flex flex-col h-full text-xs">
      <div className="border-b border-line p-2 shrink-0 flex gap-1.5">
        <textarea
          data-test="clipboard-manual-add-input"
          data-legacy-test="clipboard-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void handleCaptureText() }}
          placeholder="Type to capture…"
          rows={1}
          className="flex-1 min-w-0 max-h-16 bg-surface-3/60 rounded px-2 py-1 text-ink placeholder:text-ink-faint focus:outline-none resize-none"
        />
        <button
          data-test="clipboard-manual-add-save"
          data-legacy-test="clipboard-capture"
          onClick={handleCaptureText}
          className="shrink-0 text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-surface-3 text-ink hover:bg-surface-3/80"
        >
          Add
        </button>
        <button
          data-test="clipboard-from-system"
          type="button"
          disabled
          title="System clipboard reads are disabled; copy inside Noted to capture automatically."
          className="shrink-0 text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-surface-3 text-ink-faint opacity-70 cursor-default"
        >
          Auto
        </button>
      </div>
      <div className="border-b border-line px-3 py-1 text-[10px] text-ink-faint shrink-0">
        Text copied inside Noted is captured here automatically.
      </div>

      <div className="flex-1 overflow-y-auto">
        {active.length === 0 ? (
          <div
            data-test="clipboard-empty"
            className="h-full flex items-center justify-center text-ink-faint"
          >
            No copied text yet.
          </div>
        ) : (
          active.map((entry) => (
            <ClipRow
              key={entry.id}
              entry={entry}
              onDelete={() => softDelete(entry.id)}
              isPickerOpen={openScrapPickerId === entry.id}
              onOpenPicker={() => setOpenScrapPickerId(entry.id)}
              onClosePicker={() => setOpenScrapPickerId((id) => id === entry.id ? null : id)}
            />
          ))
        )}
      </div>

      {binEntries.length > 0 && (
        <div className="shrink-0 border-t border-line">
          <button
            onClick={() => setShowBin((shown) => !shown)}
            data-test="clipboard-bin-toggle"
            className="w-full h-7 flex items-center gap-2 px-3 text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink"
          >
            <span>Bin ({binEntries.length})</span>
            <span>{showBin ? '▾' : '▸'}</span>
          </button>
          {showBin && (
            <div className="max-h-32 overflow-y-auto border-t border-line">
              {binEntries.map((entry) => (
                <div
                  key={entry.id}
                  data-test="clipboard-bin-row"
                  className="flex items-center gap-2 px-3 py-1.5 border-b border-line opacity-60 hover:opacity-100"
                >
                  <span className="flex-1 min-w-0 text-[10px] text-ink-faint truncate">
                    {isImageEntry(entry.text) ? '[image]' : entry.text}
                  </span>
                  <button
                    onClick={() => restore(entry.id)}
                    data-test="clipboard-restore"
                    className="text-[10px] text-ink-soft hover:text-ink px-1.5 py-0.5 rounded hover:bg-surface-3"
                  >
                    Restore
                  </button>
                  <InlineConfirmButton
                    onConfirm={() => purge(entry.id)}
                    label="Purge"
                    confirmLabel="Sure?"
                    className="text-[10px] text-ink-faint hover:text-bad px-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ClipRow({
  entry, onDelete, isPickerOpen, onOpenPicker, onClosePicker
}: {
  entry: DockerClipboard
  onDelete: () => void
  isPickerOpen: boolean
  onOpenPicker: () => void
  onClosePicker: () => void
}) {
  const ws = useWorkspace()
  const projects = ws.projects
  const [copied, setCopied] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(() => defaultProjectId(projects))
  const [saved, setSaved] = useState(false)
  const rowRef = useRef<HTMLDivElement | null>(null)
  const savedTimer = useRef<number | null>(null)
  const isImg = isImageEntry(entry.text)

  useEffect(() => {
    if (!isPickerOpen) return
    setSelectedProjectId(defaultProjectId(projects))
    function onMouseDown(e: MouseEvent) {
      const node = rowRef.current
      if (node && e.target instanceof Node && !node.contains(e.target)) onClosePicker()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClosePicker()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isPickerOpen, onClosePicker, projects])

  useEffect(() => {
    setSelectedProjectId((current) => {
      if (current && projects.some((project) => project.id === current)) return current
      return defaultProjectId(projects)
    })
  }, [projects])

  useEffect(() => {
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current)
    }
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(entry.text)
    } catch {}
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  async function handleSaveScrap() {
    const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0]
    if (!selectedProject) return
    await ws.createScrap({
      body: entry.text,
      projectId: selectedProject.id,
      sourceLabel: 'from clipboard'
    })
    setSaved(true)
    if (savedTimer.current) window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => {
      setSaved(false)
      onClosePicker()
    }, 2000)
  }

  return (
    <div ref={rowRef} data-test="clipboard-row" data-clipboard-id={entry.id} className="border-b border-line hover:bg-surface-3/40 group">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          {isImg ? (
            <img
              src={entry.text}
              alt="clipboard capture"
              className="max-h-14 max-w-[120px] object-contain rounded border border-line"
            />
          ) : (
            <div className="text-xs text-ink truncate">{entry.text}</div>
          )}
          <div className="text-[10px] text-ink-faint mt-0.5">{relativeTime(entry.capturedAt)}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            data-test="clip-entry-save-as-scrap"
            onClick={onOpenPicker}
            disabled={projects.length === 0}
            className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-ink-soft hover:text-ink disabled:opacity-40 disabled:hover:text-ink-soft"
          >
            → Save as scrap
          </button>
          <button
            data-test="clipboard-entry-copy"
            data-legacy-test="clipboard-copy"
            onClick={handleCopy}
            className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-3 text-ink-soft hover:text-ink"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <InlineConfirmButton
            onConfirm={onDelete}
            label="del"
            confirmLabel="sure?"
            data-test="clipboard-delete"
            className="text-[10px] text-ink-faint hover:text-bad px-1"
          />
        </div>
      </div>
      {isPickerOpen && projects.length > 0 && (
        <div className="px-3 pb-2 flex items-center gap-2 text-[10px] text-ink-faint">
          {saved ? (
            <span className="rounded border border-line bg-surface-2 px-2 py-1 text-ink-soft">Saved ✓</span>
          ) : (
            <>
              <span className="uppercase tracking-[0.12em]">Project:</span>
              <select
                data-test="clip-entry-project-picker"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="min-w-0 max-w-[12rem] bg-surface-3 border border-line rounded px-2 py-1 text-ink focus:outline-none"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name || 'Untitled project'}</option>
                ))}
              </select>
              <button
                onClick={handleSaveScrap}
                className="rounded border border-line px-2 py-1 text-ink-soft hover:text-ink hover:bg-surface-3"
              >
                Save
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
