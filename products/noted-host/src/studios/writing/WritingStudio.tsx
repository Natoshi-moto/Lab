import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import type { Document } from '../../types'
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
import { formatCompactRelativeTime, stripMarkdownPreview, useResizableListWidth } from '../../util/listPane'

const LAST_KEY = 'verse-studio:writing:lastDoc'
const LIST_WIDTH_KEY = 'verse-studio:writing:listWidth'

export function WritingStudio() {
  const ws = useWorkspace()
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_KEY) } catch { return null }
  })

  useEffect(() => {
    if (selectedId && !ws.documents.find((d) => d.id === selectedId)) {
      setSelectedId(null)
    }
  }, [selectedId, ws.documents])

  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<SelectIntent>).detail
      if (detail?.kind === 'document' && detail.id) {
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

  // Filter soft-deleted at render time only — ws.documents still contains them for Sweep 10
  const docs = [...ws.documents]
    .filter((d) => d.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const selected = docs.find((d) => d.id === selectedId) ?? null

  const handleNew = useCallback(async () => {
    const doc = await ws.createDocument('Untitled')
    setSelectedId(doc.id)
    pushRecentView({ kind: 'document', id: doc.id, title: doc.title || 'Untitled' })
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
    await ws.softDeleteDocument(id)
  }

  function handleSelect(id: string) {
    setSelectedId(id)
    const doc = ws.documents.find(d => d.id === id)
    if (doc) pushRecentView({ kind: 'document', id: doc.id, title: doc.title || 'Untitled' })
  }

  return (
    <div className="h-full flex bg-surface">
      <DocList
        docs={docs}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <div className="flex-1 min-w-0">
        {selected ? (
          <DocEditor key={selected.id} doc={selected} onDelete={() => handleDelete(selected.id)} />
        ) : (
          <EmptyEditor onNew={handleNew} />
        )}
      </div>
    </div>
  )
}

function DocList({
  docs, selectedId, onSelect, onNew, onDelete
}: {
  docs: Document[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  const [ctxMenu, setCtxMenu] = useState<{ docId: string; x: number; y: number } | null>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const { width, startResize, isResizing } = useResizableListWidth(LIST_WIDTH_KEY)
  const filteredDocs = filterQuery.trim()
    ? docs.filter((d) => (d.title || 'Untitled').toLowerCase().includes(filterQuery.toLowerCase()))
    : docs

  function handleContextMenu(e: React.MouseEvent, docId: string) {
    e.preventDefault()
    setCtxMenu({ docId, x: e.clientX, y: e.clientY })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    if (filteredDocs.length === 0) return

    e.preventDefault()
    const currentIndex = selectedId ? filteredDocs.findIndex((d) => d.id === selectedId) : -1
    const direction = e.key === 'ArrowDown' ? 1 : -1
    let nextIndex = currentIndex === -1 ? 0 : currentIndex + direction
    nextIndex = Math.max(0, Math.min(filteredDocs.length - 1, nextIndex))
    onSelect(filteredDocs[nextIndex].id)
  }

  return (
    <aside
      className={`relative shrink-0 border-r border-line bg-surface flex flex-col ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Writing note list"
      data-focus-hide="record-list"
    >
      <div className="h-9 shrink-0 border-b border-line bg-surface-2 px-3 flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Writing</div>
        <button
          onClick={onNew}
          className="w-7 h-7 flex items-center justify-center rounded text-base leading-none text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          data-test="new-doc"
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
            data-test="writing-list-filter"
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

      {docs.length === 0 ? (
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
          {filteredDocs.length === 0 && filterQuery.trim() ? (
            <div className="text-sm text-ink-faint text-center py-8">No matches</div>
          ) : filteredDocs.map((d) => {
            const preview = stripMarkdownPreview(d.body) || 'No preview'
            return (
              <div key={d.id} className="group relative">
                <button
                  onClick={() => onSelect(d.id)}
                  onContextMenu={(e) => handleContextMenu(e, d.id)}
                  className={`w-full min-h-[40px] rounded px-3 py-2 text-left flex items-start gap-2 transition-colors ${
                    selectedId === d.id ? 'bg-surface-3' : 'hover:bg-surface-2'
                  }`}
                  data-test="doc-item"
                  data-doc-id={d.id}
                >
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-sm text-ink truncate">{d.title || 'Untitled'}</span>
                    <span className="block text-xs text-ink-faint truncate mt-0.5">{preview}</span>
                  </span>
                  <time className="shrink-0 text-[11px] text-ink-faint leading-tight pt-0.5" dateTime={new Date(d.updatedAt).toISOString()}>
                    {formatCompactRelativeTime(d.updatedAt)}
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
        aria-label="Resize writing list"
      />

      {ctxMenu && (() => {
        const doc = docs.find(d => d.id === ctxMenu.docId)
        if (!doc) { setCtxMenu(null); return null }
        return (
          <ListItemMenu
            recordId={doc.id}
            recordType="document"
            title={doc.title || 'Untitled'}
            x={ctxMenu.x}
            y={ctxMenu.y}
            onOpen={() => onSelect(doc.id)}
            onDelete={() => onDelete(doc.id)}
            onClose={() => setCtxMenu(null)}
          />
        )
      })()}
    </aside>
  )
}

function EmptyEditor({ onNew }: { onNew: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-ink-faint text-sm">
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

function DocEditor({ doc, onDelete }: { doc: Document, onDelete: () => void }) {
  const ws = useWorkspace()
  const setFocus = useSetFocus()
  const [draft, setDraft] = useState({ title: doc.title, body: doc.body })
  const savedRef = useRef({ title: doc.title, body: doc.body })

  // Sweep 23: keep activeRecord pointed at this doc while mounted.
  useEffect(() => {
    ws.setActiveRecord({ id: doc.id, type: 'document' })
    setFocus({ id: doc.id, type: 'document', origin: 'writing' })
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [doc.id, ws, setFocus])

  // Sync draft when doc is updated externally (e.g. snapshot restore)
  useEffect(() => {
    if (doc.title !== savedRef.current.title || doc.body !== savedRef.current.body) {
      savedRef.current = { title: doc.title, body: doc.body }
      setDraft({ title: doc.title, body: doc.body })
    }
  }, [doc.title, doc.body])

  const isDirty = draft.title !== doc.title || draft.body !== doc.body
  const signature = draft.title + '\u0000' + draft.body
  const { lastSavedAt } = useDebouncedAutosave(signature, isDirty, () => {
    savedRef.current = { title: draft.title, body: draft.body }
    ws.updateDocument(doc.id, draft)
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
          data-test="doc-title"
          data-doc-id={doc.id}
        />
        <button
          onClick={handleDownload}
          className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2"
          data-test="doc-download"
        >
          ↓ .md
        </button>
        <ProjectPicker
          value={doc.projectId}
          onChange={(next) => ws.updateDocument(doc.id, { projectId: next })}
        />
        <ShelfButton
          type="document"
          refId={doc.id}
          title={draft.title || 'Untitled'}
        />
        <Snapshots
          recordId={doc.id}
          recordType="document"
          buildSnapshotData={() => JSON.stringify({ title: draft.title, body: draft.body })}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="Delete"
          confirmLabel="Confirm?"
          className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface-2"
        />
      </header>
      <TagsBar recordId={doc.id} recordType="document" />
      <LinksPanel recordId={doc.id} recordType="document" />
      <RelatedStrip recordId={doc.id} recordType="document" />
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">
        <div className="w-full py-6 editor-body-pad flex-1 min-h-0 flex flex-col">
          <textarea
            className="editor-surface flex-1 min-h-[32rem] w-full text-ink resize-none"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Begin writing…"
            data-test="doc-body"
          />
        </div>
      </div>
      <EditorStatusBar body={draft.body} lastSavedAt={lastSavedAt} />
    </div>
  )
}
