import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import type { LongformDoc, LongformSection } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { ShelfButton } from '../../components/ShelfButton'
import { ProjectPicker } from '../../components/ProjectPicker'
import { SELECT_EVENT, type SelectIntent } from '../../util/navigate'
import { TagsBar } from '../../components/TagsBar'
import { LinksPanel } from '../../components/LinksPanel'
import { RelatedStrip } from '../../components/RelatedStrip'
import { Snapshots } from '../../components/Snapshots'
import { ListItemMenu } from '../../components/ListItemMenu'
import { EditorStatusBar } from '../../components/EditorStatusBar'
import { CompilePanel } from '../../components/CompilePanel'
import { formatCompactRelativeTime, stripMarkdownPreview, useResizableListWidth } from '../../util/listPane'
import { useRailCollapse } from '../../util/rail'

// Sweep 6: this constant moved from `…lastProject` to `…lastDoc` to match
// SELECTION_KEYS.longform in util/navigate.ts. Existing users lose one bit
// of UI state (last-selected longform draft); no record data is affected.
const LAST_DOC_KEY = 'verse-studio:longform:lastDoc'
const SECTION_KEY  = 'verse-studio:longform:lastSection'
const LIST_WIDTH_KEY = 'verse-studio:longform:listWidth'
const SECTION_LIST_COLLAPSED_KEY = 'verse-studio:longform:sectionList:collapsed'
const SECTION_LIST_ALWAYS_VISIBLE_KEY = 'verse-studio:longform:sectionList:alwaysVisible'

export function LongformStudio() {
  const ws = useWorkspace()
  const setFocus = useSetFocus()
  const [selectedDocId, setSelectedDocId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_DOC_KEY) } catch { return null }
  })
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(() => {
    try { return localStorage.getItem(SECTION_KEY) } catch { return null }
  })
  const [compileOpen, setCompileOpen] = useState(false)

  // Drop stale doc selection.
  useEffect(() => {
    if (selectedDocId && !ws.longformDocs.find((d) => d.id === selectedDocId)) {
      setSelectedDocId(null)
      setSelectedSectionId(null)
    }
  }, [selectedDocId, ws.longformDocs])

  // Sweep 23 / 58: keep activeRecord on the longform doc for Cmd+L, while
  // FocusContext may point at a selected section for the Nexus Panel.
  useEffect(() => {
    if (selectedDocId && ws.longformDocs.find((d) => d.id === selectedDocId)) {
      ws.setActiveRecord({ id: selectedDocId, type: 'longform' })
      if (!selectedSectionId) setFocus({ id: selectedDocId, type: 'longform', origin: 'longform' })
    } else {
      ws.setActiveRecord(null)
      setFocus(null)
    }
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [selectedDocId, selectedSectionId, ws, setFocus])

  // Drop stale or cross-doc section selection.
  useEffect(() => {
    if (!selectedSectionId) return
    const sec = ws.sections.find((s) => s.id === selectedSectionId)
    // sec.projectId is the FK → LongformDoc.id (field name preserved per types.ts).
    if (!sec || sec.projectId !== selectedDocId) {
      setSelectedSectionId(null)
    }
  }, [selectedSectionId, selectedDocId, ws.sections])

  // Listen for "open this thing" events from Shelf / Cmd+K.
  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<SelectIntent>).detail
      if (detail?.kind === 'longform' && detail.id) {
        setSelectedDocId(detail.id)
        setSelectedSectionId(null)
      }
    }
    window.addEventListener(SELECT_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_EVENT, onSelect)
  }, [])

  // Persist selections.
  useEffect(() => {
    try {
      if (selectedDocId) localStorage.setItem(LAST_DOC_KEY, selectedDocId)
      else localStorage.removeItem(LAST_DOC_KEY)
    } catch {}
  }, [selectedDocId])
  useEffect(() => {
    try {
      if (selectedSectionId) localStorage.setItem(SECTION_KEY, selectedSectionId)
      else localStorage.removeItem(SECTION_KEY)
    } catch {}
  }, [selectedSectionId])

  const longformDocs = [...ws.longformDocs]
    .filter((d) => d.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const doc = longformDocs.find((d) => d.id === selectedDocId) ?? null

  const sections = ws.sections
    .filter((s) => s.projectId === selectedDocId)
    .sort((a, b) => a.order - b.order)
  const section = sections.find((s) => s.id === selectedSectionId) ?? null

  useEffect(() => {
    if (section) {
      setFocus({ id: section.id, type: 'longform-section', origin: 'longform' })
    } else if (doc) {
      setFocus({ id: doc.id, type: 'longform', origin: 'longform' })
    }
  }, [section?.id, doc?.id, setFocus])

  const handleNewDoc = useCallback(async () => {
    const d = await ws.createLongformDoc('Untitled')
    setSelectedDocId(d.id)
    setSelectedSectionId(null)
  }, [ws])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        void handleNewDoc()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleNewDoc])

  async function handleDeleteDoc(id: string) {
    if (selectedDocId === id) {
      setSelectedDocId(null)
      setSelectedSectionId(null)
    }
    await ws.softDeleteLongformDoc(id)
  }

  async function handleNewSection() {
    if (!selectedDocId) return
    const s = await ws.createSection(selectedDocId, 'Untitled section')
    setSelectedSectionId(s.id)
  }

  async function handleDeleteSection(id: string) {
    if (selectedSectionId === id) setSelectedSectionId(null)
    await ws.deleteSection(id)
  }

  return (
    <div className="h-full flex bg-surface">
      <LongformDocList
        docs={longformDocs}
        selectedId={selectedDocId}
        onSelect={(id) => { setSelectedDocId(id); setSelectedSectionId(null) }}
        onNew={handleNewDoc}
        onDelete={handleDeleteDoc}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {doc ? (
          <>
            <div className="h-10 shrink-0 border-b border-line bg-surface px-3 flex items-center gap-3">
              <DocTitleInput key={doc.id} doc={doc} />
              <button
                onClick={() => setCompileOpen(true)}
                className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2 shrink-0"
                data-test="longform-download"
                data-testid="compile-panel-trigger"
              >
                Compile…
              </button>
              <ProjectPicker
                value={doc.projectId}
                onChange={(next) => ws.updateLongformDoc(doc.id, { projectId: next })}
              />
              <ShelfButton
                type="longform"
                refId={doc.id}
                title={doc.title || 'Untitled'}
              />
              <Snapshots
                recordId={doc.id}
                recordType="longform"
                buildSnapshotData={() => JSON.stringify({ title: doc.title })}
              />
              <InlineConfirmButton
                onConfirm={() => handleDeleteDoc(doc.id)}
                label="Delete longform"
                confirmLabel="Confirm?"
                className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface-2 shrink-0"
              />
            </div>
            <TagsBar recordId={doc.id} recordType="longform" />
            <LinksPanel recordId={doc.id} recordType="longform" />
            <RelatedStrip recordId={doc.id} recordType="longform" />
            <div className="flex-1 flex min-h-0">
              <SectionList
                sections={sections}
                selectedId={selectedSectionId}
                onSelect={setSelectedSectionId}
                onNew={handleNewSection}
                onDelete={handleDeleteSection}
                onReorder={(id, dir) => ws.reorderSection(id, dir)}
              />
              <div className="flex-1 min-w-0 relative overflow-hidden">
                {section ? (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    onDelete={() => handleDeleteSection(section.id)}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-ink-faint text-sm">
                    {sections.length === 0 ? 'Click + Section to start.' : 'Select a section.'}
                  </div>
                )}
                <CompilePanel
                  open={compileOpen}
                  doc={doc}
                  sections={sections}
                  onClose={() => setCompileOpen(false)}
                  onUpdateSectionStatus={(id, status) => ws.updateSection(id, { status })}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-faint text-sm">
            {longformDocs.length === 0 ? 'No longform docs yet.' : 'Select a doc.'}
          </div>
        )}
      </div>
    </div>
  )
}

function LongformDocList({
  docs, selectedId, onSelect, onNew, onDelete
}: {
  docs: LongformDoc[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  const ws = useWorkspace()
  const [ctxMenu, setCtxMenu] = useState<{ docId: string; x: number; y: number } | null>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const { width, startResize, isResizing } = useResizableListWidth(LIST_WIDTH_KEY, 220)
  const filteredDocs = filterQuery.trim()
    ? docs.filter((d) => (d.title || 'Untitled').toLowerCase().includes(filterQuery.toLowerCase()))
    : docs

  function handleContextMenu(e: ReactMouseEvent, docId: string) {
    e.preventDefault()
    setCtxMenu({ docId, x: e.clientX, y: e.clientY })
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    if (filteredDocs.length === 0) return

    e.preventDefault()
    const currentIndex = selectedId ? filteredDocs.findIndex((d) => d.id === selectedId) : -1
    const direction = e.key === 'ArrowDown' ? 1 : -1
    let nextIndex = currentIndex === -1 ? 0 : currentIndex + direction
    nextIndex = Math.max(0, Math.min(filteredDocs.length - 1, nextIndex))
    onSelect(filteredDocs[nextIndex].id)
  }

  function firstSectionPreview(doc: LongformDoc): string {
    const firstSection = ws.sections
      .filter((s) => s.projectId === doc.id)
      .sort((a, b) => a.order - b.order)[0]
    if (!firstSection) return 'No sections'
    return stripMarkdownPreview(firstSection.body, 55) || 'No preview'
  }

  return (
    <aside
      className={`relative shrink-0 border-r border-line bg-surface flex flex-col ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Longform document list"
      data-focus-hide="record-list"
    >
      <div className="h-9 shrink-0 border-b border-line bg-surface-2 px-3 flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">Longform</div>
        <button
          onClick={onNew}
          className="w-7 h-7 flex items-center justify-center rounded text-base leading-none text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          data-test="new-longform"
          title="New longform"
          aria-label="New longform"
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
            data-test="longform-list-filter"
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
          <div className="text-sm text-ink-faint">No longform docs yet</div>
          <button
            onClick={onNew}
            className="w-8 h-8 flex items-center justify-center rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-2"
            title="New longform"
            aria-label="New longform"
          >
            +
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
          {filteredDocs.length === 0 && filterQuery.trim() ? (
            <div className="text-sm text-ink-faint text-center py-8">No matches</div>
          ) : filteredDocs.map((d) => {
            const preview = firstSectionPreview(d)
            return (
              <div key={d.id} className="group relative">
                <button
                  onClick={() => onSelect(d.id)}
                  onContextMenu={(e) => handleContextMenu(e, d.id)}
                  className={`w-full min-h-[40px] rounded px-3 py-2 text-left flex items-start gap-2 transition-colors ${
                    selectedId === d.id ? 'bg-surface-3' : 'hover:bg-surface-2'
                  }`}
                  data-test="longform-doc-item"
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
        aria-label="Resize longform list"
      />

      {ctxMenu && (() => {
        const doc = docs.find(d => d.id === ctxMenu.docId)
        if (!doc) { setCtxMenu(null); return null }
        return (
          <ListItemMenu
            recordId={doc.id}
            recordType="longform"
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

function DocTitleInput({ doc }: { doc: LongformDoc }) {
  const ws = useWorkspace()
  const [title, setTitle] = useState(doc.title)
  const savedRef = useRef(doc.title)

  // Sync draft when title is updated externally (e.g. snapshot restore).
  // Without this, the local `title` state holds the user's last edit and
  // autosave clobbers the restored value back ~400ms later.
  useEffect(() => {
    if (doc.title !== savedRef.current) {
      savedRef.current = doc.title
      setTitle(doc.title)
    }
  }, [doc.title])

  useDebouncedAutosave(
    title,
    title !== doc.title,
    () => {
      savedRef.current = title
      ws.updateLongformDoc(doc.id, { title })
    }
  )

  return (
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="Longform title"
      className="title-input flex-1 text-sm text-ink"
      data-test="longform-title"
    />
  )
}

function SectionList({
  sections, selectedId, onSelect, onNew, onDelete, onReorder
}: {
  sections: LongformSection[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onReorder: (id: string, direction: -1 | 1) => void
}) {
  const sectionRail = useRailCollapse(SECTION_LIST_COLLAPSED_KEY)
  const [alwaysVisible] = useState<boolean>(() => {
    try { return localStorage.getItem(SECTION_LIST_ALWAYS_VISIBLE_KEY) === 'true' } catch { return false }
  })
  const [showHint, setShowHint] = useState<boolean>(() => {
    try { return localStorage.getItem(SECTION_LIST_COLLAPSED_KEY) === null } catch { return false }
  })
  const collapsed = sectionRail.collapsed && !alwaysVisible

  function collapseSectionList() {
    setShowHint(false)
    if (!sectionRail.collapsed) sectionRail.toggle()
  }

  function expandSectionList() {
    if (sectionRail.collapsed) sectionRail.toggle()
  }

  function dismissHint() {
    setShowHint(false)
    try { localStorage.setItem(SECTION_LIST_COLLAPSED_KEY, sectionRail.collapsed ? 'true' : 'false') } catch {}
  }

  if (collapsed) {
    return (
      <aside
        className="w-8 shrink-0 border-r border-line bg-surface-2 flex flex-col items-center"
        data-test="longform-section-list"
        data-collapsed="true"
        data-focus-hide="record-list"
      >
        <button
          onClick={expandSectionList}
          className="w-7 h-9 mt-0.5 flex items-center justify-center rounded text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors"
          data-test="longform-section-list-expand"
          title="Expand section list"
          aria-label="Expand section list"
        >
          ›
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="w-60 shrink-0 border-r border-line bg-surface-2 flex flex-col"
      data-test="longform-section-list"
      data-collapsed="false"
      data-focus-hide="record-list"
    >
      <div className="p-3 border-b border-line space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onNew}
            className="flex-1 px-3 py-1.5 text-sm rounded border border-line hover:bg-surface-3 text-ink"
            data-test="new-section"
          >
            + Section
          </button>
          <button
            onClick={collapseSectionList}
            className="w-7 h-7 flex items-center justify-center rounded text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0"
            data-test="longform-section-list-collapse"
            title="Collapse section list"
            aria-label="Collapse section list"
          >
            ‹
          </button>
        </div>
        {showHint && (
          <div
            className="flex items-start gap-2 rounded border border-line bg-surface px-2 py-1.5 text-[11px] text-ink-faint"
            data-test="longform-section-list-hint"
          >
            <span className="flex-1">Tip: click ‹ to collapse this panel</span>
            <button
              onClick={dismissHint}
              className="text-ink-faint hover:text-ink leading-none"
              title="Dismiss tip"
              aria-label="Dismiss tip"
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {sections.length === 0 && (
          <div className="text-xs text-ink-faint px-2 py-3">No sections yet.</div>
        )}
        {sections.map((s, i) => (
          <div
            key={s.id}
            className={`group rounded px-2 py-2 transition-colors ${
              selectedId === s.id ? 'bg-surface-3' : 'hover:bg-surface-3'
            }`}
            data-test="section-row"
            data-section-id={s.id}
            data-section-order={i}
          >
            <button
              onClick={() => onSelect(s.id)}
              className="w-full text-left text-sm text-ink truncate"
              data-test="section-item"
            >
              {s.title || 'Untitled section'}
            </button>
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onReorder(s.id, -1) }}
                disabled={i === 0}
                className="text-[11px] px-1.5 py-0.5 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
                data-test="section-up"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReorder(s.id, 1) }}
                disabled={i === sections.length - 1}
                className="text-[11px] px-1.5 py-0.5 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
                data-test="section-down"
                title="Move down"
              >
                ↓
              </button>
              <div className="flex-1" />
              <InlineConfirmButton
                onConfirm={() => onDelete(s.id)}
                label="del"
                confirmLabel="confirm?"
                className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function SectionEditor({
  section, onDelete
}: {
  section: LongformSection
  onDelete: () => void
}) {
  const ws = useWorkspace()
  const [draft, setDraft] = useState({ title: section.title, body: section.body })

  const isDirty = draft.title !== section.title || draft.body !== section.body
  const signature = draft.title + '\u0000' + draft.body
  const { lastSavedAt } = useDebouncedAutosave(signature, isDirty, () => {
    ws.updateSection(section.id, draft)
  })

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-line px-6 py-3 flex items-center gap-3">
        <input
          className="title-input flex-1 text-lg text-ink"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Section title"
          data-test="section-title"
          data-section-edit-id={section.id}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="Delete section"
          confirmLabel="Confirm?"
          className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface-2"
        />
      </header>
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">
        <div className="w-full py-6 editor-body-pad flex-1 min-h-0 flex flex-col">
          <textarea
            className="editor-surface flex-1 min-h-[32rem] w-full text-ink resize-none"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Begin writing…"
            data-test="section-body"
          />
        </div>
      </div>
      <EditorStatusBar body={draft.body} lastSavedAt={lastSavedAt} />
    </div>
  )
}
