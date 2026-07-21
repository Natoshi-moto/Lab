import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../../context'
import type { DockerScratch, Project } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../InlineConfirmButton'

const LAST_KEY = 'verse-studio:docker:scratchpad:activeId'
const LAST_ACTIVE_PROJECT_KEY = 'verse-studio:projects:lastActive'

export function Scratchpad() {
  const ws = useWorkspace()

  const [activeId, setActiveId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_KEY) } catch { return null }
  })

  // Drop stale selection
  useEffect(() => {
    if (activeId && !ws.dockerScratch.find((s) => s.id === activeId)) {
      setActiveId(null)
    }
  }, [activeId, ws.dockerScratch])

  // Persist active id
  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(LAST_KEY, activeId)
      else localStorage.removeItem(LAST_KEY)
    } catch {}
  }, [activeId])

  const scratches = [...ws.dockerScratch].sort((a, b) => a.tabIndex - b.tabIndex)
  const active = scratches.find((s) => s.id === activeId) ?? null

  async function handleNew() {
    const s = await ws.createScratch('Untitled')
    setActiveId(s.id)
  }

  async function handleDelete(id: string) {
    if (activeId === id) {
      const idx = scratches.findIndex((s) => s.id === id)
      const next = scratches[idx + 1] ?? scratches[idx - 1] ?? null
      setActiveId(next?.id ?? null)
    }
    await ws.deleteScratch(id)
  }

  if (scratches.length === 0) {
    return (
      <div
        data-test="scratch-empty"
        className="h-full flex flex-col items-center justify-center gap-3 text-ink-faint"
      >
        <span className="text-xs">No scratchpads yet.</span>
        <button
          data-test="scratch-new"
          onClick={handleNew}
          className="text-xs px-3 py-1 rounded bg-surface-3 text-ink hover:bg-surface-3/80 transition-colors"
        >
          + New scratchpad
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left rail */}
      <div
        data-test="scratch-list"
        className="w-32 shrink-0 border-r border-line flex flex-col overflow-y-auto"
      >
        <button
          data-test="scratch-new"
          onClick={handleNew}
          className="text-[10px] uppercase tracking-widest text-ink-faint hover:text-ink px-2 py-1.5 border-b border-line hover:bg-surface-3/60 transition-colors text-left shrink-0"
        >
          + New
        </button>
        {scratches.map((s) => (
          <ScratchRow
            key={s.id}
            scratch={s}
            isActive={s.id === activeId}
            onClick={() => setActiveId(s.id)}
            onDelete={() => handleDelete(s.id)}
            onUp={() => ws.reorderScratch(s.id, -1)}
            onDown={() => ws.reorderScratch(s.id, 1)}
          />
        ))}
      </div>

      {/* Right editor */}
      <div className="flex-1 min-w-0 flex flex-col">
        {active ? (
          <ScratchEditor key={active.id} scratch={active} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-ink-faint">
            Select a scratchpad
          </div>
        )}
      </div>
    </div>
  )
}

function ScratchRow({
  scratch, isActive, onClick, onDelete, onUp, onDown
}: {
  scratch: DockerScratch
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onUp: () => void
  onDown: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      data-test="scratch-item"
      data-scratch-id={scratch.id}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative px-2 py-1.5 cursor-pointer flex items-center gap-1 min-h-[28px] ${
        isActive ? 'bg-surface-3' : 'hover:bg-surface-3/60'
      }`}
    >
      <span className="flex-1 min-w-0 text-xs text-ink truncate">
        {scratch.title || 'Untitled'}
      </span>
      {hovered && (
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            data-test="scratch-up"
            onClick={onUp}
            className="text-[9px] text-ink-faint hover:text-ink px-0.5"
            title="Move up"
          >▲</button>
          <button
            data-test="scratch-down"
            onClick={onDown}
            className="text-[9px] text-ink-faint hover:text-ink px-0.5"
            title="Move down"
          >▼</button>
          <InlineConfirmButton
            onConfirm={onDelete}
            label="del"
            confirmLabel="confirm?"
            data-test="scratch-delete"
            className="text-[9px] text-ink-faint hover:text-bad px-0.5"
          />
        </div>
      )}
    </div>
  )
}


function defaultProjectId(projects: Project[]): string {
  try {
    const lastActive = localStorage.getItem(LAST_ACTIVE_PROJECT_KEY)
    if (lastActive && projects.some((project) => project.id === lastActive)) return lastActive
  } catch {}
  return projects[0]?.id ?? ''
}

function ScratchEditor({ scratch }: { scratch: DockerScratch }) {
  const ws = useWorkspace()
  const projects = ws.projects
  const [draft, setDraft] = useState({ title: scratch.title, body: scratch.body })
  const [selectedProjectId, setSelectedProjectId] = useState(() => defaultProjectId(projects))
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const confirmationTimer = useRef<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll textarea to keep cursor visible when content grows, but only when
  // cursor is at the end (don't disrupt mid-text editing).
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    if (ta.selectionStart === ta.value.length) {
      ta.scrollTop = ta.scrollHeight
    }
  }, [draft.body])

  useEffect(() => {
    setSelectedProjectId((current) => {
      if (current && projects.some((project) => project.id === current)) return current
      return defaultProjectId(projects)
    })
  }, [projects])

  useEffect(() => {
    return () => {
      if (confirmationTimer.current) window.clearTimeout(confirmationTimer.current)
    }
  }, [])

  const isDirty = draft.title !== scratch.title || draft.body !== scratch.body
  const signature = draft.title + '\u0000' + draft.body
  useDebouncedAutosave(signature, isDirty, () => {
    ws.updateScratch(scratch.id, draft)
  })

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null
  const canSaveScrap = Boolean(selectedProject && draft.body.trim())

  async function handleSaveScrap() {
    if (!selectedProject || !draft.body.trim()) return
    await ws.createScrap({
      body: draft.body.trim(),
      projectId: selectedProject.id,
      sourceLabel: 'from scratchpad'
    })
    setConfirmation(`Saved to ${selectedProject.name} ✓`)
    if (confirmationTimer.current) window.clearTimeout(confirmationTimer.current)
    confirmationTimer.current = window.setTimeout(() => setConfirmation(null), 2000)
  }

  return (
    <div className="relative flex flex-col h-full">
      <input
        data-test="scratch-title"
        data-scratch-id={scratch.id}
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Title"
        className="title-input text-xs font-medium text-ink px-3 py-2 border-b border-line shrink-0"
      />
      <textarea
        ref={textareaRef}
        data-test="scratch-body"
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Write something…"
        className="editor-surface flex-1 text-xs text-ink px-3 pt-2 pb-12 resize-none overflow-y-auto"
      />
      {projects.length > 0 && (
        <div className="absolute left-0 right-0 bottom-0 h-10 border-t border-line bg-surface-2 px-3 flex items-center gap-2 text-[10px] text-ink-faint">
          <span className="shrink-0 uppercase tracking-[0.12em]">Save as scrap in:</span>
          <select
            data-test="scratch-to-project-picker"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="min-w-0 max-w-[12rem] flex-1 bg-surface-3 border border-line rounded px-2 py-1 text-ink focus:outline-none"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name || 'Untitled project'}</option>
            ))}
          </select>
          <button
            data-test="scratch-to-project-save"
            onClick={handleSaveScrap}
            disabled={!canSaveScrap}
            className="shrink-0 rounded border border-line px-2 py-1 text-ink-soft hover:text-ink hover:bg-surface-3 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-soft"
          >
            {confirmation ?? 'Save Scrap'}
          </button>
        </div>
      )}
    </div>
  )
}
