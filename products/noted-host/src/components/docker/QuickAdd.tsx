import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../../context'
import { jumpToSelection, ROUTE_FOR_TYPE } from '../../util/navigate'
import type { ShelfRefType } from '../../types'

// Sweep 27: 'note' is excluded from QuickAdd's Kind because adding it
// would expand QuickAdd's UX surface beyond the prompt's scope (this file
// is not in the Sweep 27 "Files touched" list). Notes can be created via
// the Notes studio's "+ New" button or the Inbox route-to-note. A future
// sweep can add 'note' to KIND_OPTIONS if Quick-Add coverage of all
// record types is desired.
type Kind = Exclude<ShelfRefType, 'note'> | 'pattern' | 'pipeline'

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'document', label: 'Document' },
  { value: 'poem',     label: 'Poem' },
  { value: 'longform', label: 'Longform' },
  { value: 'build',    label: 'App-Design Build' },
  { value: 'pattern',  label: 'Pattern' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'project',  label: 'Project' },
]

const STUDIO_KINDS: Kind[] = ['document', 'poem', 'longform', 'build', 'project']

export function QuickAdd() {
  const ws = useWorkspace()
  const navigate = useNavigate()
  const [kind, setKind] = useState<Kind>('document')
  const [title, setTitle] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  function flashStatus(msg: string) {
    setStatusMsg(msg)
    window.setTimeout(() => setStatusMsg((cur) => (cur === msg ? null : cur)), 2000)
  }

  async function handleCreate() {
    const name = title.trim() || 'Untitled'

    let id: string

    switch (kind) {
      case 'document': { const r = await ws.createDocument(name);          id = r.id; break }
      case 'poem':     { const r = await ws.createPoem(name);              id = r.id; break }
      case 'longform': { const r = await ws.createLongformDoc(name);       id = r.id; break }
      case 'build':    { const r = await ws.createBuild(name);             id = r.id; break }
      case 'pattern':  { const r = await ws.createPattern({ name });       id = r.id; break }
      case 'pipeline': { const r = await ws.createPipeline(name);          id = r.id; break }
      case 'project':  { const r = await ws.createProject(name);           id = r.id; break }
    }

    setTitle('')

    if (STUDIO_KINDS.includes(kind)) {
      jumpToSelection({ kind: kind as ShelfRefType, id })
      navigate(ROUTE_FOR_TYPE[kind as ShelfRefType])
    } else {
      flashStatus(`Created ${name}.`)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <select
          data-test="quick-add-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          className="text-xs text-ink bg-surface-3 border border-line rounded px-2 py-1.5 w-full"
        >
          {KIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <input
          data-test="quick-add-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          placeholder="Title…"
          className="title-input text-xs text-ink border border-line rounded px-2 py-1.5"
        />

        <button
          data-test="quick-add-create"
          onClick={handleCreate}
          className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded bg-surface-3 text-ink hover:bg-surface-3/80 transition-colors"
        >
          Create
        </button>
      </div>

      {statusMsg && (
        <div
          data-test="quick-add-status"
          className="text-xs text-good"
        >
          {statusMsg}
        </div>
      )}
    </div>
  )
}
