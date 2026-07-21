// Sweep 27 — Notes studio.
//
// Pattern-clone of WritingStudio.tsx with Document → Note throughout. Same
// useDebouncedAutosave, same project picker, tags bar, links panel,
// related strip, shelf button, snapshots — Notes are a first-class record
// type, not a lite version of one.
//
// Body field is a plain <textarea> with font-mono class (markdown
// affordance — no rendered preview, no markdown library, per Sweep 27
// hard constraint). The pisstake at Obsidian lands harder when the focus
// is narrow.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import type { Note } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { downloadText, safeFilename } from '../../util/download'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { ShelfButton } from '../../components/ShelfButton'
import { ProjectPicker } from '../../components/ProjectPicker'
import { SELECT_EVENT, type SelectIntent } from '../../util/navigate'
import { TagsBar } from '../../components/TagsBar'
import { LinksPanel } from '../../components/LinksPanel'
import { RelatedStrip } from '../../components/RelatedStrip'
import { Snapshots } from '../../components/Snapshots'
import { pushRecentView } from '../../util/recentViews'
import { ListItemMenu } from '../../components/ListItemMenu'
import { EditorStatusBar } from '../../components/EditorStatusBar'
import { ConvertModal, type ConversionKind } from '../../components/ConvertModal'
import { formatCompactRelativeTime, stripMarkdownPreview, useResizableListWidth } from '../../util/listPane'

const LAST_KEY = 'verse-studio:notes:lastSelected'
const LIST_WIDTH_KEY = 'verse-studio:notes:listWidth'

export function NotesStudio() {
  const ws = useWorkspace()
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_KEY) } catch { return null }
  })

  useEffect(() => {
    if (selectedId && !ws.notes.find((n) => n.id === selectedId)) {
      setSelectedId(null)
    }
  }, [selectedId, ws.notes])

  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<SelectIntent>).detail
      if (detail?.kind === 'note' && detail.id) {
        setSelectedId(detail.id)
      }
    }
    window.addEventListener(SELECT_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_EVENT, onSelect)
  }, [])

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(LAST_KEY, selectedId)
      else localStorage.removeItem(LAST_KEY)
    } catch {}
  }, [selectedId])

  // Filter soft-deleted at render time only — ws.notes still contains them.
  const notes = [...ws.notes]
    .filter((n) => n.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const selected = notes.find((n) => n.id === selectedId) ?? null

  const handleNew = useCallback(async () => {
    const note = await ws.createNote('Untitled')
    setSelectedId(note.id)
    pushRecentView({ kind: 'note', id: note.id, title: note.title || 'Untitled' })
  }, [ws])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        void handleNew()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleNew])

  async function handleDelete(id: string) {
    if (selectedId === id) setSelectedId(null)
    await ws.softDeleteNote(id)
  }

  function handleSelect(id: string) {
    setSelectedId(id)
    const note = ws.notes.find(n => n.id === id)
    if (note) pushRecentView({ kind: 'note', id: note.id, title: note.title || 'Untitled' })
  }

  return (
    <div className="h-full flex bg-surface" data-test="route-stub-notes">
      <NoteList
        notes={notes}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <div className="flex-1 min-w-0">
        {selected ? (
          <NoteEditor key={selected.id} note={selected} onDelete={() => handleDelete(selected.id)} />
        ) : (
          <EmptyEditor onNew={handleNew} />
        )}
      </div>
    </div>
  )
}

function NoteList({
  notes, selectedId, onSelect, onNew, onDelete
}: {
  notes: Note[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  const ws = useWorkspace()
  const [ctxMenu, setCtxMenu] = useState<{ noteId: string; x: number; y: number } | null>(null)
  const [convertModal, setConvertModal] = useState<{ kind: ConversionKind; sourceId: string } | null>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const { width, startResize, isResizing } = useResizableListWidth(LIST_WIDTH_KEY)
  const filteredNotes = filterQuery.trim()
    ? notes.filter((n) => (n.title || 'Untitled').toLowerCase().includes(filterQuery.toLowerCase()))
    : notes

  function handleContextMenu(e: React.MouseEvent, noteId: string) {
    e.preventDefault()
    setCtxMenu({ noteId, x: e.clientX, y: e.clientY })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    if (filteredNotes.length === 0) return

    e.preventDefault()
    const currentIndex = selectedId ? filteredNotes.findIndex((n) => n.id === selectedId) : -1
    const direction = e.key === 'ArrowDown' ? 1 : -1
    let nextIndex = currentIndex === -1 ? 0 : currentIndex + direction
    nextIndex = Math.max(0, Math.min(filteredNotes.length - 1, nextIndex))
    onSelect(filteredNotes[nextIndex].id)
  }

  return (
    <aside
      className={`relative shrink-0 border-r border-line bg-surface flex flex-col ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Notes list"
      data-test="notes-list"
      data-focus-hide="record-list"
    >
      <div className="h-9 shrink-0 border-b border-line bg-surface-2 px-3 flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Notes</div>
        <button
          onClick={onNew}
          className="w-7 h-7 flex items-center justify-center rounded text-base leading-none text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          data-test="notes-new"
          title="New note"
          aria-label="New note"
        >
          +
        </button>
      </div>

      <div className="px-2 py-1 border-b border-line shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter…"
            className="w-full text-xs text-ink bg-transparent px-2 py-1 pr-6 placeholder:text-ink-faint focus:outline-none border border-transparent focus:border-line rounded"
            data-test="notes-list-filter"
            aria-label="Filter list"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-1.5 text-ink-faint hover:text-ink text-[11px] leading-none"
              aria-label="Clear filter"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <div className="text-sm text-ink-faint">No notes yet</div>
          <button
            onClick={onNew}
            className="w-8 h-8 flex items-center justify-center rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
            title="New note"
            aria-label="New note"
          >
            +
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
          {filteredNotes.length === 0 && filterQuery.trim() ? (
            <div className="text-sm text-ink-faint text-center py-8">No matches</div>
          ) : filteredNotes.map((n) => {
            const preview = stripMarkdownPreview(n.body) || 'No preview'
            return (
              <div key={n.id} className="group relative">
                <button
                  onClick={() => onSelect(n.id)}
                  onContextMenu={(e) => handleContextMenu(e, n.id)}
                  className={`w-full min-h-[40px] rounded px-3 py-2 text-left flex items-start gap-2 transition-colors ${
                    selectedId === n.id ? 'bg-surface-3' : 'hover:bg-surface-2'
                  }`}
                  data-test="notes-list-item"
                  data-note-id={n.id}
                >
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-sm text-ink truncate">{n.title || 'Untitled'}</span>
                    <span className="block text-xs text-ink-faint truncate mt-0.5">{preview}</span>
                  </span>
                  <time className="shrink-0 text-[11px] text-ink-faint leading-tight pt-0.5" dateTime={new Date(n.updatedAt).toISOString()}>
                    {formatCompactRelativeTime(n.updatedAt)}
                  </time>
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div
        className="absolute inset-y-0 right-0 w-1 cursor-col-resize z-20"
        onMouseDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize notes list"
      />

      {ctxMenu && (() => {
        const note = notes.find(n => n.id === ctxMenu.noteId)
        if (!note) { setCtxMenu(null); return null }
        return (
          <ListItemMenu
            recordId={note.id}
            recordType="note"
            title={note.title || 'Untitled'}
            x={ctxMenu.x}
            y={ctxMenu.y}
            onOpen={() => onSelect(note.id)}
            onDelete={() => onDelete(note.id)}
            onClose={() => setCtxMenu(null)}
            extraActions={[
              {
                label: 'Convert → Section',
                testId: 'note-convert-to-section',
                onClick: () => setConvertModal({ kind: 'note-to-section', sourceId: note.id }),
              },
            ]}
          />
        )
      })()}

      {convertModal && (
        <ConvertModal
          kind={convertModal.kind}
          sourceId={convertModal.sourceId}
          onConfirm={async (targetDocId) => {
            await ws.convertRecord({
              kind: convertModal.kind,
              sourceId: convertModal.sourceId,
              targetDocId,
            })
            setConvertModal(null)
          }}
          onCancel={() => setConvertModal(null)}
        />
      )}
    </aside>
  )
}

function EmptyEditor({ onNew }: { onNew: () => void }) {
  return (
    <div
      className="h-full flex flex-col items-center justify-center gap-3 text-ink-faint text-sm"
      data-test="notes-empty"
    >
      <span>Select a note or create one</span>
      <button
        onClick={onNew}
        className="text-xs text-ink-soft hover:text-ink rounded px-3 py-1.5 border border-line hover:bg-surface-2"
      >
        + New Note
      </button>
    </div>
  )
}

function NoteEditor({ note, onDelete }: { note: Note, onDelete: () => void }) {
  const ws = useWorkspace()
  const setFocus = useSetFocus()
  const [draft, setDraft] = useState({ title: note.title, body: note.body })
  const savedRef = useRef({ title: note.title, body: note.body })

  // Sweep 23 pattern: keep activeRecord pointed at this note while mounted.
  useEffect(() => {
    ws.setActiveRecord({ id: note.id, type: 'note' })
    setFocus({ id: note.id, type: 'note', origin: 'notes' })
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [note.id, ws, setFocus])

  // Sync draft when note is updated externally (e.g. snapshot restore)
  useEffect(() => {
    if (note.title !== savedRef.current.title || note.body !== savedRef.current.body) {
      savedRef.current = { title: note.title, body: note.body }
      setDraft({ title: note.title, body: note.body })
    }
  }, [note.title, note.body])

  const isDirty = draft.title !== note.title || draft.body !== note.body
  const signature = draft.title + '\u0000' + draft.body
  const { lastSavedAt } = useDebouncedAutosave(signature, isDirty, () => {
    savedRef.current = { title: draft.title, body: draft.body }
    ws.updateNote(note.id, draft)
  })

  function handleDownload() {
    const content = `# ${draft.title || 'Untitled'}\n\n${draft.body}`
    downloadText(safeFilename(draft.title || 'untitled') + '.md', content, 'text/markdown')
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-line px-6 py-3 flex items-center gap-3">
        <input
          className="title-input flex-1 text-lg text-ink"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Title"
          data-test="notes-title-input"
          data-note-id={note.id}
        />
        <button
          onClick={handleDownload}
          className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2"
          data-test="notes-download"
        >
          ↓ .md
        </button>
        <ProjectPicker
          value={note.projectId}
          onChange={(next) => ws.updateNote(note.id, { projectId: next })}
        />
        <ShelfButton
          type="note"
          refId={note.id}
          title={draft.title || 'Untitled'}
        />
        <Snapshots
          recordId={note.id}
          recordType="note"
          buildSnapshotData={() => JSON.stringify({ title: draft.title, body: draft.body })}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="Delete"
          confirmLabel="Confirm?"
          className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface-2"
          data-test="notes-delete"
        />
      </header>
      <TagsBar recordId={note.id} recordType="note" />
      <LinksPanel recordId={note.id} recordType="note" />
      <RelatedStrip recordId={note.id} recordType="note" />
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">
        <div className="w-full py-6 editor-body-pad flex-1 min-h-0 flex flex-col">
          <textarea
            className="editor-surface flex-1 min-h-[32rem] w-full text-ink font-mono resize-none"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Begin writing…"
            data-test="notes-body-input"
          />
        </div>
      </div>
      <EditorStatusBar body={draft.body} lastSavedAt={lastSavedAt} />
    </div>
  )
}
