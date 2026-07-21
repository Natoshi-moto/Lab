import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import type { Poem } from '../../types'
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

const LAST_KEY = 'verse-studio:poetry:lastPoem'
const LIST_WIDTH_KEY = 'verse-studio:poetry:listWidth'

export function PoetryStudio() {
  const ws = useWorkspace()
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_KEY) } catch { return null }
  })

  useEffect(() => {
    if (selectedId && !ws.poems.find((p) => p.id === selectedId)) {
      setSelectedId(null)
    }
  }, [selectedId, ws.poems])

  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<SelectIntent>).detail
      if (detail?.kind === 'poem' && detail.id) {
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

  const poems = [...ws.poems]
    .filter((p) => p.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const selected = poems.find((p) => p.id === selectedId) ?? null

  const handleNew = useCallback(async () => {
    const poem = await ws.createPoem('Untitled')
    setSelectedId(poem.id)
    pushRecentView({ kind: 'poem', id: poem.id, title: poem.title || 'Untitled' })
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
    await ws.softDeletePoem(id)
  }

  function handleSelect(id: string) {
    setSelectedId(id)
    const poem = ws.poems.find(p => p.id === id)
    if (poem) pushRecentView({ kind: 'poem', id: poem.id, title: poem.title || 'Untitled' })
  }

  return (
    <div className="h-full flex bg-surface">
      <PoemList
        poems={poems}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <div className="flex-1 min-w-0">
        {selected ? (
          <PoemEditor key={selected.id} poem={selected} onDelete={() => handleDelete(selected.id)} />
        ) : (
          <EmptyEditor onNew={handleNew} />
        )}
      </div>
    </div>
  )
}

function PoemList({
  poems, selectedId, onSelect, onNew, onDelete
}: {
  poems: Poem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  const [ctxMenu, setCtxMenu] = useState<{ poemId: string; x: number; y: number } | null>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const { width, startResize, isResizing } = useResizableListWidth(LIST_WIDTH_KEY)
  const filteredPoems = filterQuery.trim()
    ? poems.filter((p) => (p.title || 'Untitled').toLowerCase().includes(filterQuery.toLowerCase()))
    : poems

  function handleContextMenu(e: ReactMouseEvent, poemId: string) {
    e.preventDefault()
    setCtxMenu({ poemId, x: e.clientX, y: e.clientY })
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    if (filteredPoems.length === 0) return

    e.preventDefault()
    const currentIndex = selectedId ? filteredPoems.findIndex((p) => p.id === selectedId) : -1
    const direction = e.key === 'ArrowDown' ? 1 : -1
    let nextIndex = currentIndex === -1 ? 0 : currentIndex + direction
    nextIndex = Math.max(0, Math.min(filteredPoems.length - 1, nextIndex))
    onSelect(filteredPoems[nextIndex].id)
  }

  return (
    <aside
      className={`relative shrink-0 border-r border-line bg-surface flex flex-col ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Poetry list"
      data-focus-hide="record-list"
    >
      <div className="h-9 shrink-0 border-b border-line bg-surface-2 px-3 flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Poetry</div>
        <button
          onClick={onNew}
          className="w-7 h-7 flex items-center justify-center rounded text-base leading-none text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          data-test="new-poem"
          title="New poem"
          aria-label="New poem"
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
            data-test="poetry-list-filter"
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

      {poems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <div className="text-sm text-ink-faint">No poems yet</div>
          <button
            onClick={onNew}
            className="w-8 h-8 flex items-center justify-center rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
            title="New poem"
            aria-label="New poem"
          >
            +
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
          {filteredPoems.length === 0 && filterQuery.trim() ? (
            <div className="text-sm text-ink-faint text-center py-8">No matches</div>
          ) : filteredPoems.map((p) => {
            const preview = stripMarkdownPreview(p.body, 50) || 'No preview'
            return (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => onSelect(p.id)}
                  onContextMenu={(e) => handleContextMenu(e, p.id)}
                  className={`w-full min-h-[40px] rounded px-3 py-2 text-left flex items-start gap-2 transition-colors ${
                    selectedId === p.id ? 'bg-surface-3' : 'hover:bg-surface-2'
                  }`}
                  data-test="poem-item"
                  data-poem-id={p.id}
                >
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-sm text-ink truncate">{p.title || 'Untitled'}</span>
                    <span className="block text-xs text-ink-faint truncate mt-0.5">{preview}</span>
                  </span>
                  <time className="shrink-0 text-[11px] text-ink-faint leading-tight pt-0.5" dateTime={new Date(p.updatedAt).toISOString()}>
                    {formatCompactRelativeTime(p.updatedAt)}
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
        aria-label="Resize poetry list"
      />

      {ctxMenu && (() => {
        const poem = poems.find(p => p.id === ctxMenu.poemId)
        if (!poem) { setCtxMenu(null); return null }
        return (
          <ListItemMenu
            recordId={poem.id}
            recordType="poem"
            title={poem.title || 'Untitled'}
            x={ctxMenu.x}
            y={ctxMenu.y}
            onOpen={() => onSelect(poem.id)}
            onDelete={() => onDelete(poem.id)}
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
      <span>Select a poem or create one</span>
      <button
        onClick={onNew}
        className="text-xs text-ink-soft hover:text-ink rounded px-3 py-1.5 border border-line hover:bg-surface-2"
      >
        + New Poem
      </button>
    </div>
  )
}

function PoemEditor({ poem, onDelete }: { poem: Poem, onDelete: () => void }) {
  const ws = useWorkspace()
  const setFocus = useSetFocus()
  const [draft, setDraft] = useState({ title: poem.title, body: poem.body })
  const savedRef = useRef({ title: poem.title, body: poem.body })

  // Sweep 23: track activeRecord for Cmd+L.
  useEffect(() => {
    ws.setActiveRecord({ id: poem.id, type: 'poem' })
    setFocus({ id: poem.id, type: 'poem', origin: 'poetry' })
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [poem.id, ws, setFocus])

  // Sync draft when poem is updated externally (e.g. snapshot restore)
  useEffect(() => {
    if (poem.title !== savedRef.current.title || poem.body !== savedRef.current.body) {
      savedRef.current = { title: poem.title, body: poem.body }
      setDraft({ title: poem.title, body: poem.body })
    }
  }, [poem.title, poem.body])

  const isDirty = draft.title !== poem.title || draft.body !== poem.body
  const signature = draft.title + '\u0000' + draft.body
  const { lastSavedAt } = useDebouncedAutosave(signature, isDirty, () => {
    savedRef.current = { title: draft.title, body: draft.body }
    ws.updatePoem(poem.id, draft)
  })

  function handleDownload() {
    const content = `${draft.title || 'Untitled'}\n\n${draft.body}`
    downloadText(safeFilename(draft.title || 'untitled') + '.txt', content, 'text/plain')
  }

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-line px-6 py-3 flex items-center gap-3">
        <input
          className="title-input flex-1 text-lg text-ink"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Title"
          data-test="poem-title"
          data-poem-id={poem.id}
        />
        <button
          onClick={handleDownload}
          className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2"
          data-test="poem-download"
        >
          ↓ .txt
        </button>
        <ProjectPicker
          value={poem.projectId}
          onChange={(next) => ws.updatePoem(poem.id, { projectId: next })}
        />
        <ShelfButton
          type="poem"
          refId={poem.id}
          title={draft.title || 'Untitled'}
        />
        <Snapshots
          recordId={poem.id}
          recordType="poem"
          buildSnapshotData={() => JSON.stringify({ title: draft.title, body: draft.body })}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="Delete"
          confirmLabel="Confirm?"
          className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface-2"
        />
      </header>
      <TagsBar recordId={poem.id} recordType="poem" />
      <LinksPanel recordId={poem.id} recordType="poem" />
      <RelatedStrip recordId={poem.id} recordType="poem" />
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">
        <div className="w-full py-6 editor-body-pad flex-1 min-h-0 flex flex-col">
          <textarea
            className="editor-surface h-full min-h-[24rem] text-ink whitespace-pre"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Begin writing…"
            data-test="poem-body"
          />
        </div>
      </div>
      <EditorStatusBar body={draft.body} lastSavedAt={lastSavedAt} />
    </div>
  )
}
