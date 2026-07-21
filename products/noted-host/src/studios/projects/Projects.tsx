// Sweep 25 — Projects Studio: Workspace edition.
//
// ──────────────────────────────────────────────────────────────────────────
// THESIS
// ──────────────────────────────────────────────────────────────────────────
//
// Pre-Sweep-24 the Projects route was a record-editor masquerading as a
// workspace. Sweep 24 made it a six-column board. The Builder's response
// was correct: "still doesn't feel like... no way back to easily handle
// the project... the way it is designed is weak." The board solved
// "how do I add things to a project" but exposed two deeper issues:
//
//   (i)  CONTEXT DESTRUCTION — clicking a card navigates to the record's
//        studio and severs the project as the user's frame of reference.
//        Returning takes a sidebar click and a project re-selection.
//   (ii) IDENTITY THINNESS — a project surfaced as kanban-only has no
//        sense of *what it is*: no momentum, no recent activity, no
//        narrative space, no rich identity beyond a name.
//
// Sweep 25 attacks both. The contributions:
//
//   1. PROJECT HUB — A rich header that gives the project a face: color
//      band, name, breakdown stats, tags/links/related, snapshots, and
//      a collapsible narrative panel (formerly the description textarea,
//      now framed as the project's notes / brief).
//
//   2. IN-PLACE CARD DRAWER — Clicking a card opens a side drawer with a
//      mini editor (title + body, autosaving via existing CRUD). The user
//      can edit without leaving the project. An "Open in studio" escape
//      hatch is always one click away — and uses (3) below to preserve
//      the project as the return point.
//
//   3. CROSS-STUDIO PROJECT BREADCRUMB — When the user DOES leave to a
//      studio, a `← Project Name` pill renders globally in the TopBar
//      until they return. Backed by a localStorage-driven channel
//      (`util/projectContext.ts`) so it works without unfreezing
//      WorkspaceProvider.
//
//   4. ACTIVITY STREAM — A side panel that synthesises a live timeline
//      from the attached items' updatedAt/createdAt timestamps. Gives
//      projects momentum: "you added a poem 3 hours ago, edited the
//      design doc yesterday."
//
//   5. QUICK CAPTURE — A single one-line input above the board: type a
//      title, pick a kind, hit Enter. Faster than per-column "+ New".
//
//   6. CARD DENSITY UPGRADE — Cards now show a body preview, the
//      relative updated time, kind glyph, and a hover-revealed action
//      bar (open / detach). They're 3× more informative than v1.
//
// Decisions deliberately NOT taken (and why)
// ──────────────────────────────────────────
//   • DRAG-TO-REORDER cards across columns: requires either a per-record
//     `projectOrder` field or a new IDB store. Both touch the frozen
//     four. Phase 2 if the Builder asks.
//   • PROJECT STATUS / PHASES as a typed enum: same problem. The Hub
//     surfaces existing tags prominently; the user can use tags as
//     status (e.g. #active, #shipped) without a schema change.
//   • A SECOND BOARD AXIS (group-by tag, group-by recency, etc.): adds
//     UI complexity for marginal value vs. the kanban-by-kind. Phase 2.
//   • RENDERING DESCRIPTION AS MARKDOWN: would require a markdown
//     dependency. The constraint is "no new deps". Plain text with
//     newlines preserved is the fallback. URLs auto-link (one regex).
//
// All CRUD goes through the existing context API. Frozen four untouched.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import type {
  Project,
  Document,
  Poem,
  LongformDoc,
  AppDesignBuild,
  Pattern,
  PromptPipeline,
  Note,  // Sweep 27
  Scrap, // Sweep 37
} from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { Snapshots } from '../../components/Snapshots'
import { ShelfButton } from '../../components/ShelfButton'
import { TagsBar } from '../../components/TagsBar'
import { LinksPanel } from '../../components/LinksPanel'
import { RelatedStrip } from '../../components/RelatedStrip'
import {
  SELECT_EVENT,
  type SelectIntent,
  type JumpableKind,
  jumpToSelection,
  ROUTE_FOR_TYPE,
} from '../../util/navigate'
import { setProjectContext } from '../../util/projectContext'
import { useRecentViews } from '../../util/recentViews'
import { downloadText, safeFilename } from '../../util/download'
import { ConvertModal, type ConversionKind } from '../../components/ConvertModal'

type WS = ReturnType<typeof useWorkspace>

// ── Storage keys ────────────────────────────────────────────────────────────

const LAST_KEY        = 'verse-studio:projects:lastProject'
const LAST_ACTIVE_KEY = 'verse-studio:projects:lastActive'
const SIDE_PANEL_KEY  = 'verse-studio:projects:sidePanel'   // 'stream' | 'links' | 'hidden'
const NOTES_OPEN_KEY  = 'verse-studio:projects:notesOpen'
const QC_KIND_KEY     = 'verse-studio:projects:qcKind'
const LAST_TYPE_PREFIX = 'verse-studio:projects:'
const LAST_TYPE_SUFFIX = ':lastType'

// ── Taxonomy ────────────────────────────────────────────────────────────────

const COLOURS: { name: string; hex: string }[] = [
  { name: 'tan',   hex: '#c8b395' },
  { name: 'sage',  hex: '#9aa888' },
  { name: 'mauve', hex: '#a89aac' },
  { name: 'slate', hex: '#8896a0' },
]

// Sweep 27: 'note' added between 'document' and 'poem'. KIND_ORDER also
// drives column ordering on the kanban board, so this position is the
// rendered position.
const KIND_ORDER = ['document', 'note', 'poem', 'longform', 'build', 'pattern', 'pipeline'] as const
type AttachedKind = typeof KIND_ORDER[number]

const KIND_LABELS: Record<AttachedKind, string> = {
  document: 'Documents',
  note:     'Notes',
  poem:     'Poems',
  longform: 'Longform',
  build:    'Builds',
  pattern:  'Patterns',
  pipeline: 'Pipelines',
}

const KIND_LABELS_SINGULAR: Record<AttachedKind, string> = {
  document: 'document',
  note:     'note',
  poem:     'poem',
  longform: 'longform doc',
  build:    'build',
  pattern:  'pattern',
  pipeline: 'pipeline',
}

const KIND_GLYPH: Record<AttachedKind, string> = {
  document: 'Doc',
  note:     'Note',
  poem:     'Poem',
  longform: 'LF',
  build:    'Build',
  pattern:  'Pattern',
  pipeline: 'Pipeline',
}

const KIND_TO_JUMPABLE: Record<AttachedKind, JumpableKind> = {
  document: 'document',
  note:     'note',
  poem:     'poem',
  longform: 'longform',
  build:    'build',
  pattern:  'pattern',
  pipeline: 'pipeline',
}


type ContentRowType = 'documents' | 'notes' | 'scraps' | 'longform' | 'appdesign' | 'poems'

const DEFAULT_ROW_ORDER: ContentRowType[] = ['documents', 'notes', 'scraps', 'longform', 'appdesign', 'poems']

const ROW_LABELS: Record<ContentRowType, string> = {
  documents: 'Documents',
  notes: 'Notes',
  scraps: 'Scraps',
  longform: 'Longform',
  appdesign: 'App Design items',
  poems: 'Poems',
}

const ROW_GLYPH: Record<ContentRowType, string> = {
  documents: 'Doc',
  notes: 'Note',
  scraps: 'Scrap',
  longform: 'LF',
  appdesign: 'App',
  poems: 'Poem',
}


const ROW_ADD_TEST_IDS: Record<ContentRowType, string> = {
  documents: 'project-row-add-documents',
  notes: 'project-row-add-notes',
  scraps: 'project-row-add-scraps',
  longform: 'project-row-add-longform',
  appdesign: 'project-row-add-appdesign',
  poems: 'project-row-add-poems',
}


// ── Top-level shell ─────────────────────────────────────────────────────────

export function Projects() {
  const ws = useWorkspace()
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_KEY) } catch { return null }
  })
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null)

  // Drawer state — the in-place card editor.
  const [drawerTarget, setDrawerTarget] = useState<{ kind: AttachedKind; recordId: string } | null>(null)

  // Self-correct stale localStorage id.
  useEffect(() => {
    if (selectedId && !ws.projects.find((p) => p.id === selectedId)) {
      setSelectedId(null)
      setJustCreatedId(null)
    }
  }, [selectedId, ws.projects])

  // Listen for select events from the palette / shelf.
  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<SelectIntent>).detail
      if (detail?.kind === 'project' && detail.id) {
        setSelectedId(detail.id)
        setJustCreatedId(null)
        setDrawerTarget(null)
      }
    }
    window.addEventListener(SELECT_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_EVENT, onSelect)
  }, [])

  // Persist selection.
  useEffect(() => {
    try {
      if (selectedId) {
        localStorage.setItem(LAST_KEY, selectedId)
        localStorage.setItem(LAST_ACTIVE_KEY, selectedId)
      } else {
        localStorage.removeItem(LAST_KEY)
      }
    } catch {}
  }, [selectedId])

  // Close drawer if the project changes (we're now in a different context).
  useEffect(() => {
    setDrawerTarget(null)
  }, [selectedId])

  const projects = [...ws.projects].sort((a, b) => b.updatedAt - a.updatedAt)
  const selected = projects.find((p) => p.id === selectedId) ?? null

  async function handleNewProject() {
    const p = await ws.createProject('Untitled')
    setSelectedId(p.id)
    setJustCreatedId(p.id)
  }

  function handleSelectProject(id: string) {
    setSelectedId(id)
    setJustCreatedId(null)
  }

  async function handleDeleteProject(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
      setJustCreatedId(null)
    }
    await ws.deleteProject(id)
  }

  function attachedCount(projectId: string): number {
    return (
      ws.documents.filter((d) => d.projectId === projectId && !d.deletedAt).length +
      ws.notes.filter((n) => n.projectId === projectId && !n.deletedAt).length +
      ws.poems.filter((p) => p.projectId === projectId && !p.deletedAt).length +
      ws.longformDocs.filter((d) => d.projectId === projectId && !d.deletedAt).length +
      ws.builds.filter((b) => b.projectId === projectId && !b.deletedAt).length +
      ws.patterns.filter((p) => p.projectId === projectId && !p.deletedAt).length +
      ws.pipelines.filter((p) => p.projectId === projectId && !p.deletedAt).length +
      ws.scraps.filter((s) => s.projectId === projectId).length
    )
  }

  return (
    <div className="h-full flex" data-test="route-stub-projects">
      <h1 className="sr-only">Projects</h1>

      {/* ── Sidebar: project list ── */}
      <aside className="w-60 shrink-0 border-r border-line bg-surface-2 flex flex-col">
        <div className="p-3 border-b border-line">
          <button
            onClick={handleNewProject}
            className="w-full px-3 py-1.5 text-sm rounded border border-line hover:bg-surface-3 text-ink"
            data-test="new-project-button"
          >
            + New project
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {projects.length === 0 && (
            <div className="text-xs text-ink-faint px-2 py-3">No projects yet.</div>
          )}
          {projects.map((p) => {
            const count = attachedCount(p.id)
            const dot = p.colour ? COLOURS.find((c) => c.name === p.colour)?.hex : undefined
            return (
              <div
                key={p.id}
                className={`group rounded px-2 py-2 transition-colors ${
                  selectedId === p.id ? 'bg-surface-3' : 'hover:bg-surface-3'
                }`}
                data-test="project-item"
                data-project-id={p.id}
              >
                <button
                  onClick={() => handleSelectProject(p.id)}
                  className="w-full text-left flex items-start gap-2"
                >
                  {dot ? (
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: dot }}
                    />
                  ) : (
                    <span className="inline-block w-2 h-2 shrink-0 mt-1.5" />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-ink truncate">{p.name || 'Untitled'}</span>
                    <span className="block text-xs text-ink-faint mt-0.5">
                      {count} item{count !== 1 ? 's' : ''}
                    </span>
                  </span>
                </button>
                <div className="flex items-center justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <InlineConfirmButton
                    onConfirm={() => handleDeleteProject(p.id)}
                    label="del"
                    confirmLabel="confirm?"
                    className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Right pane: workspace ── */}
      <div className="flex-1 min-w-0 relative">
        {selected ? (
          <ProjectWorkspace
            key={selected.id}
            project={selected}
            ws={ws}
            navigate={navigate}
            onDelete={() => handleDeleteProject(selected.id)}
            drawerTarget={drawerTarget}
            onOpenDrawer={(t) => setDrawerTarget(t)}
            onCloseDrawer={() => setDrawerTarget(null)}
            defaultEditing={justCreatedId === selected.id}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-ink-faint text-sm">
            {projects.length > 0 ? 'Select a project.' : 'Click + New project to start.'}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ProjectWorkspace ────────────────────────────────────────────────────────

type DrawerTarget = { kind: AttachedKind; recordId: string }
type ContinueTarget =
  | { type: 'attached'; id: string; label: string; timestamp: number; item: AttachedItem }
  | { type: 'scrap'; id: string; label: string; timestamp: number; scrap: Scrap }
type SidePanelMode = 'stream' | 'links' | 'hidden'

function ProjectWorkspace({
  project, ws, navigate, onDelete, drawerTarget, onOpenDrawer, onCloseDrawer, defaultEditing,
}: {
  project: Project
  ws: WS
  navigate: ReturnType<typeof useNavigate>
  onDelete: () => void
  drawerTarget: DrawerTarget | null
  onOpenDrawer: (t: DrawerTarget) => void
  onCloseDrawer: () => void
  defaultEditing: boolean
}) {
  const setFocus = useSetFocus()

  // Track activeRecord for Cmd+L.
  useEffect(() => {
    ws.setActiveRecord({ id: project.id, type: 'project' })
    setFocus({ id: project.id, type: 'project', origin: 'projects' })
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [project.id, ws, setFocus])

  const { views, addView } = useRecentViews()

  const [rowTouch, setRowTouch] = useState<Record<string, number>>(() => loadLastTypeMap(project.id))
  useEffect(() => {
    setRowTouch(loadLastTypeMap(project.id))
  }, [project.id])

  const allAttached = useMemo(() => collectAllAttached(ws, project.id), [
    ws.documents, ws.notes, ws.poems, ws.longformDocs, ws.sections, ws.builds, ws.patterns, ws.pipelines,
    project.id,
  ])

  function markRowTouched(rowType: ContentRowType) {
    const ts = Date.now()
    setRowTouch((prev) => {
      const next = { ...prev, [rowType]: ts }
      saveLastTypeMap(project.id, next)
      return next
    })
  }

  function openItemInPanel(rowType: ContentRowType, item: AttachedItem) {
    markRowTouched(rowType)
    ws.setActiveRecord({ id: item.id, type: item.kind })
    setFocus({ id: item.id, type: item.kind, origin: 'projects' })
    addView({
      kind: KIND_TO_JUMPABLE[item.kind],
      id: item.id,
      title: item.title || 'Untitled',
    })
    onOpenDrawer({ kind: item.kind, recordId: item.id })
  }

  async function createInRow(rowType: ContentRowType) {
    const kind = primaryKindForRow(rowType)
    if (!kind) return
    markRowTouched(rowType)
    const id = await createForKind(ws, kind)
    if (!id) return
    await attachToProject(ws, kind, id, project.id)
    ws.setActiveRecord({ id, type: kind })
    setFocus({ id, type: kind, origin: 'projects' })
    const record = resolveRecord(ws, kind, id)
    addView({
      kind: KIND_TO_JUMPABLE[kind],
      id,
      title: getRecordTitle(record, kind) || 'Untitled',
    })
    onOpenDrawer({ kind, recordId: id })
  }

  return (
    <div className="h-full min-h-0 flex relative" data-test="project-workspace" data-project-id={project.id}>
      <ProjectInfoPanel
        key={project.id}
        project={project}
        ws={ws}
        attached={allAttached}
        onDelete={onDelete}
        defaultEditing={defaultEditing}
      />

      <ProjectRows
        project={project}
        ws={ws}
        navigate={navigate}
        rowTouch={rowTouch}
        recentViews={views}
        onCreateInRow={createInRow}
        onOpenItem={openItemInPanel}
        onTouchRow={markRowTouched}
      />

      {drawerTarget && (
        <CardDrawer
          target={drawerTarget}
          ws={ws}
          project={project}
          navigate={navigate}
          onClose={onCloseDrawer}
        />
      )}
    </div>
  )
}

// ── ProjectInfoPanel — fixed left project identity rail ─────────────────────

function ProjectInfoPanel({
  project, ws, attached, onDelete, defaultEditing = false,
}: {
  project: Project
  ws: WS
  attached: AttachedItem[]
  onDelete: () => void
  defaultEditing?: boolean
}) {
  const [editing, setEditing] = useState(defaultEditing)
  const [draftName, setDraftName] = useState(project.name)
  const [draftDescription, setDraftDescription] = useState(project.description)
  const savedRef = useRef({ name: project.name, description: project.description })

  useEffect(() => {
    if (project.name !== savedRef.current.name || project.description !== savedRef.current.description) {
      savedRef.current = { name: project.name, description: project.description }
      setDraftName(project.name)
      setDraftDescription(project.description)
    }
  }, [project.name, project.description])

  const isDirty = draftName !== project.name || draftDescription !== project.description
  const signature = draftName + '\u0000' + draftDescription
  useDebouncedAutosave(signature, isDirty, () => {
    savedRef.current = { name: draftName, description: draftDescription }
    ws.updateProject(project.id, { name: draftName, description: draftDescription })
  })

  function handleExport() {
    const payload = {
      project,
      exportedAt: new Date().toISOString(),
      items: attached.map((it) => ({
        kind: it.kind,
        id: it.id,
        title: it.title,
        preview: it.preview,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
      })),
    }
    downloadText(
      `${safeFilename(project.name || 'project')}.project.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    )
  }

  return (
    <aside
      className="w-60 shrink-0 border-r border-line bg-surface-2 p-4 overflow-y-auto"
      data-test="project-info-panel"
    >
      {editing ? (
        <div className="space-y-3">
          <input
            autoFocus={editing}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Project name"
            className="title-input w-full text-xl text-ink"
            data-test="project-name"
            data-project-id={project.id}
          />
          <textarea
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            placeholder="Project description"
            className="editor-surface w-full px-3 py-2 text-sm text-ink"
            style={{ minHeight: '120px', resize: 'vertical', display: 'block' }}
            data-test="project-description"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-ink leading-tight break-words" data-test="project-name-heading">
            {project.name || 'Untitled'}
          </h2>
          <p className="text-sm text-ink-soft whitespace-pre-wrap break-words" data-test="project-description-text">
            {project.description.trim() || 'No description yet.'}
          </p>
        </div>
      )}

      <div className="mt-4" data-test="project-tags-panel">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">Tags</div>
        <TagsBar recordId={project.id} recordType="project" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs" data-test="project-info-actions">
        <button
          onClick={() => setEditing((v) => !v)}
          className="rounded border border-line px-2 py-1.5 text-ink-soft hover:text-ink hover:bg-surface-3"
          data-test="project-info-edit"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
        <button
          onClick={handleExport}
          className="rounded border border-line px-2 py-1.5 text-ink-soft hover:text-ink hover:bg-surface-3"
          data-test="project-info-export"
        >
          Export
        </button>
        <div className="col-span-2">
          <InlineConfirmButton
            onConfirm={onDelete}
            label="Delete"
            confirmLabel="Confirm?"
            className="w-full text-xs text-ink-soft hover:text-bad rounded px-2 py-1.5 border border-line hover:bg-surface-3"
            data-test="project-delete"
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-line text-xs text-ink-faint space-y-1" data-test="project-info-stats">
        <div><span className="text-ink-soft">{attached.length}</span> total item{attached.length === 1 ? '' : 's'}</div>
        {attached.length > 0 && <div>Last activity {relativeTime(Math.max(...attached.map((it) => it.updatedAt)))}</div>}
      </div>
    </aside>
  )
}

// ── ProjectRows — vertical stack of horizontal content shelves ──────────────

function ProjectRows({
  project, ws, navigate, rowTouch, recentViews, onCreateInRow, onOpenItem, onTouchRow,
}: {
  project: Project
  ws: WS
  navigate: ReturnType<typeof useNavigate>
  rowTouch: Record<string, number>
  recentViews: ReturnType<typeof useRecentViews>['views']
  onCreateInRow: (rowType: ContentRowType) => void
  onOpenItem: (rowType: ContentRowType, item: AttachedItem) => void
  onTouchRow: (rowType: ContentRowType) => void
}) {
  const setFocus = useSetFocus()
  const rows = useMemo(() => sortRowsByTouch(rowTouch), [rowTouch])
  const [activeRow, setActiveRow] = useState<ContentRowType>(rows[0] ?? 'documents')
  const [addingScrap, setAddingScrap] = useState(false)
  const [editingScrapId, setEditingScrapId] = useState<string | null>(null)
  const [scrapMenuId, setScrapMenuId] = useState<string | null>(null)
  const [deletePromptScrapId, setDeletePromptScrapId] = useState<string | null>(null)
  const [convertModal, setConvertModal] = useState<{ kind: ConversionKind; sourceId: string } | null>(null)
  const rowRefs = useRef<Partial<Record<ContentRowType, HTMLDivElement | null>>>({})
  const projectScraps = useMemo(() => {
    return ws.scraps
      .filter((s) => s.projectId === project.id)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [ws.scraps, project.id])
  const continueTarget = useMemo(() => findContinueTarget(ws, project.id, recentViews), [
    ws.documents, ws.notes, ws.poems, ws.longformDocs, ws.sections, ws.builds, ws.patterns, ws.pipelines, ws.scraps,
    project.id, recentViews,
  ])
  const rowCounts = useMemo(() => {
    const counts = {} as Record<ContentRowType, number>
    for (const rowType of rows) {
      counts[rowType] = rowType === 'scraps'
        ? projectScraps.length
        : collectItemsForRow(ws, project.id, rowType).length
    }
    return counts
  }, [
    rows, projectScraps.length, ws.documents, ws.notes, ws.poems, ws.longformDocs, ws.sections, ws.builds, ws.patterns, ws.pipelines, project.id,
  ])

  useEffect(() => {
    if (!rows.includes(activeRow)) setActiveRow(rows[0] ?? 'documents')
  }, [rows, activeRow])

  useEffect(() => {
    setAddingScrap(false)
    setEditingScrapId(null)
    setScrapMenuId(null)
    setDeletePromptScrapId(null)
    setConvertModal(null)
  }, [project.id])

  function jumpToRow(rowType: ContentRowType) {
    setActiveRow(rowType)
    rowRefs.current[rowType]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  function openInStudio(e: React.MouseEvent, item: AttachedItem) {
    e.stopPropagation()
    ws.setActiveRecord({ id: item.id, type: item.kind })
    setFocus({ id: item.id, type: item.kind, origin: 'projects' })
    setProjectContext(project.id)
    const target = KIND_TO_JUMPABLE[item.kind]
    jumpToSelection({ kind: target, id: item.id })
    navigate(ROUTE_FOR_TYPE[target])
  }

  function openScrapForEdit(scrapId: string) {
    ws.setActiveRecord({ id: scrapId, type: 'scrap' })
    setFocus({ id: scrapId, type: 'scrap', origin: 'projects' })
    setActiveRow('scraps')
    onTouchRow('scraps')
    setEditingScrapId(scrapId)
    setScrapMenuId(null)
    setDeletePromptScrapId(null)
    rowRefs.current.scraps?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  async function saveInlineScrap(body: string) {
    const text = body.trim()
    if (!text) {
      setAddingScrap(false)
      return
    }
    await ws.createScrap({ body: text, projectId: project.id, sourceLabel: 'manual' })
    onTouchRow('scraps')
    setAddingScrap(false)
  }

  async function saveScrapEdit(scrapId: string, body: string) {
    await ws.updateScrap(scrapId, { body: body.trim() })
    onTouchRow('scraps')
    setEditingScrapId(null)
  }

  async function confirmDeleteScrap(scrapId: string) {
    await ws.softDeleteScrap(scrapId)
    onTouchRow('scraps')
    setDeletePromptScrapId(null)
    setScrapMenuId(null)
    if (editingScrapId === scrapId) setEditingScrapId(null)
  }

  function openConvertModal(kind: ConversionKind, sourceId: string) {
    setConvertModal({ kind, sourceId })
    setScrapMenuId(null)
    setDeletePromptScrapId(null)
  }

  async function confirmConvertScrap(targetDocId?: string) {
    if (!convertModal) return
    const { kind, sourceId } = convertModal
    await ws.convertRecord({ kind, sourceId, targetDocId })
    setConvertModal(null)
    onTouchRow('scraps')
    const shouldDelete = window.confirm('Conversion successful. Delete the original scrap?')
    if (shouldDelete) {
      await ws.softDeleteScrap(sourceId)
      if (editingScrapId === sourceId) setEditingScrapId(null)
    }
  }

  function handleContinueClick(target: ContinueTarget) {
    if (target.type === 'scrap') {
      openScrapForEdit(target.scrap.id)
      return
    }
    onOpenItem(rowTypeForKind(target.item.kind), target.item)
  }

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-surface" data-test="project-content-area">
      <div className="px-5 py-4 space-y-5">
        <ProjectTypeTabs
          rows={rows}
          activeRow={activeRow}
          rowCounts={rowCounts}
          onSelect={jumpToRow}
        />

        {continueTarget && (
          <button
            onClick={() => handleContinueClick(continueTarget)}
            className="w-full flex items-center gap-3 rounded border border-line bg-surface-2 px-3 py-2 text-left hover:border-accent transition-colors"
            data-test="project-continue-strip"
            data-record-id={continueTarget.id}
            data-record-type={continueTarget.type}
          >
            <span className="text-sm">▶</span>
            <span className="text-sm text-ink-soft">Continue:</span>
            <span className="flex-1 min-w-0 truncate text-sm text-ink">
              {continueTarget.label}
            </span>
            <span className="text-ink-faint">→</span>
          </button>
        )}

        {rows.map((rowType) => (
          <div
            key={rowType}
            ref={(node) => { rowRefs.current[rowType] = node }}
          >
            {rowType === 'scraps' ? (
              <ProjectScrapsRow
                scraps={projectScraps}
                adding={addingScrap}
                editingScrapId={editingScrapId}
                menuScrapId={scrapMenuId}
                deletePromptScrapId={deletePromptScrapId}
                onAdd={() => {
                  setActiveRow('scraps')
                  onTouchRow('scraps')
                  setAddingScrap(true)
                  setEditingScrapId(null)
                  setScrapMenuId(null)
                  setDeletePromptScrapId(null)
                }}
                onSaveNew={saveInlineScrap}
                onCancelNew={() => setAddingScrap(false)}
                onOpenScrap={openScrapForEdit}
                onSaveEdit={saveScrapEdit}
                onCancelEdit={() => setEditingScrapId(null)}
                onOpenMenu={(scrapId) => {
                  setScrapMenuId((cur) => cur === scrapId ? null : scrapId)
                  setDeletePromptScrapId(null)
                }}
                onCloseMenu={() => setScrapMenuId(null)}
                onRequestDelete={(scrapId) => {
                  setDeletePromptScrapId(scrapId)
                  setScrapMenuId(null)
                }}
                onCancelDelete={() => setDeletePromptScrapId(null)}
                onConfirmDelete={confirmDeleteScrap}
                onConvert={(kind, scrapId) => openConvertModal(kind, scrapId)}
              />
            ) : (
              <ProjectContentRow
                rowType={rowType}
                items={collectItemsForRow(ws, project.id, rowType)}
                onAdd={() => {
                  setActiveRow(rowType)
                  onCreateInRow(rowType)
                }}
                onOpenItem={(item) => {
                  setActiveRow(rowType)
                  onOpenItem(rowType, item)
                }}
                onOpenInStudio={openInStudio}
              />
            )}
          </div>
        ))}

        {convertModal && (
          <ConvertModal
            kind={convertModal.kind}
            sourceId={convertModal.sourceId}
            onConfirm={confirmConvertScrap}
            onCancel={() => setConvertModal(null)}
          />
        )}
      </div>
    </main>
  )
}

function ProjectTypeTabs({
  rows, activeRow, rowCounts, onSelect,
}: {
  rows: ContentRowType[]
  activeRow: ContentRowType
  rowCounts: Record<ContentRowType, number>
  onSelect: (rowType: ContentRowType) => void
}) {
  return (
    <div
      className="sticky top-0 z-10 -mx-5 border-b border-line bg-surface px-5 pb-2 pt-1 backdrop-blur"
      data-test="project-type-tabs"
    >
      <div className="scrollbar-hide flex gap-2 overflow-x-auto">
        {rows.map((rowType) => {
          const active = rowType === activeRow
          return (
            <button
              key={rowType}
              onClick={() => onSelect(rowType)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? 'border-accent bg-surface-3 text-ink'
                  : 'border-line bg-surface-2 text-ink-faint hover:text-ink hover:border-accent'
              }`}
              data-test={`project-type-tab-${rowType}`}
              data-active={active ? 'true' : 'false'}
            >
              <span className="font-medium">{ROW_LABELS[rowType]}</span>
              <span className="ml-1 text-ink-faint">({rowCounts[rowType] ?? 0})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProjectContentRow({
  rowType, items, onAdd, onOpenItem, onOpenInStudio,
}: {
  rowType: ContentRowType
  items: AttachedItem[]
  onAdd: () => void
  onOpenItem: (item: AttachedItem) => void
  onOpenInStudio: (e: React.MouseEvent, item: AttachedItem) => void
}) {
  return (
    <section className="space-y-2" data-test="project-content-row" data-row-type={rowType}>
      <header className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint shrink-0">{ROW_GLYPH[rowType]}</span>
        <h3 className="text-sm font-medium text-ink">{ROW_LABELS[rowType]}</h3>
        <span className="text-xs text-ink-faint">({items.length})</span>
        <span className="flex-1" />
        <button
          onClick={onAdd}
          className="text-xs rounded border border-line px-2.5 py-1 text-ink-soft hover:text-ink hover:bg-surface-2"
          data-test={ROW_ADD_TEST_IDS[rowType]}
          title={`Create ${ROW_LABELS[rowType].toLowerCase()}`}
        >
          + Add
        </button>
      </header>

      <div className="overflow-x-auto pb-2" data-test="project-content-row-scroll" data-row-type={rowType}>
        <div className="flex gap-3 min-w-max pr-4">
          {items.length === 0 ? (
            <div className="w-72 rounded border border-dashed border-line bg-surface-2 px-4 py-3 text-sm text-ink-faint italic">
              No {ROW_LABELS[rowType].toLowerCase()} yet. Use + Add to create one.
            </div>
          ) : (
            items.map((item) => (
              <ProjectContentCard
                key={`${item.kind}:${item.id}`}
                item={item}
                onOpen={() => onOpenItem(item)}
                onOpenInStudio={(e) => onOpenInStudio(e, item)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  )
}


function ProjectScrapsRow({
  scraps, adding, editingScrapId, menuScrapId, deletePromptScrapId,
  onAdd, onSaveNew, onCancelNew, onOpenScrap, onSaveEdit, onCancelEdit,
  onOpenMenu, onCloseMenu, onRequestDelete, onCancelDelete, onConfirmDelete, onConvert,
}: {
  scraps: Scrap[]
  adding: boolean
  editingScrapId: string | null
  menuScrapId: string | null
  deletePromptScrapId: string | null
  onAdd: () => void
  onSaveNew: (body: string) => Promise<void>
  onCancelNew: () => void
  onOpenScrap: (scrapId: string) => void
  onSaveEdit: (scrapId: string, body: string) => Promise<void>
  onCancelEdit: () => void
  onOpenMenu: (scrapId: string) => void
  onCloseMenu: () => void
  onRequestDelete: (scrapId: string) => void
  onCancelDelete: () => void
  onConfirmDelete: (scrapId: string) => Promise<void>
  onConvert: (kind: ConversionKind, scrapId: string) => void
}) {
  return (
    <section className="space-y-2" data-test="project-content-row" data-row-type="scraps">
      <header className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint shrink-0">{ROW_GLYPH.scraps}</span>
        <h3 className="text-sm font-medium text-ink">{ROW_LABELS.scraps}</h3>
        <span className="text-xs text-ink-faint">({scraps.length})</span>
        <span className="flex-1" />
        <button
          onClick={onAdd}
          className="text-xs rounded border border-line px-2.5 py-1 text-ink-soft hover:text-ink hover:bg-surface-2"
          data-test={ROW_ADD_TEST_IDS.scraps}
          title="Create scrap"
        >
          + Add
        </button>
      </header>

      <div className="overflow-x-auto pb-2" data-test="project-content-row-scroll" data-row-type="scraps">
        <div className="flex gap-3 min-w-max pr-4 items-start">
          {scraps.length === 0 && !adding && (
            <div className="w-72 rounded border border-dashed border-line bg-surface-2 px-4 py-3 text-sm text-ink-faint italic">
              No scraps yet. Use [+ Add] to jot something down.
            </div>
          )}
          {scraps.map((scrap) => (
            <ProjectScrapCard
              key={scrap.id}
              scrap={scrap}
              isEditing={editingScrapId === scrap.id}
              menuOpen={menuScrapId === scrap.id}
              confirmingDelete={deletePromptScrapId === scrap.id}
              onOpen={() => onOpenScrap(scrap.id)}
              onSaveEdit={(body) => onSaveEdit(scrap.id, body)}
              onCancelEdit={onCancelEdit}
              onOpenMenu={() => onOpenMenu(scrap.id)}
              onCloseMenu={onCloseMenu}
              onRequestDelete={() => onRequestDelete(scrap.id)}
              onCancelDelete={onCancelDelete}
              onConfirmDelete={() => onConfirmDelete(scrap.id)}
              onConvert={(kind) => onConvert(kind, scrap.id)}
            />
          ))}
          {adding && (
            <ProjectScrapInlineAdd
              onSave={onSaveNew}
              onCancel={onCancelNew}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function ProjectScrapInlineAdd({
  onSave, onCancel,
}: {
  onSave: (body: string) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState('')
  const committedRef = useRef(false)

  async function commit() {
    if (committedRef.current) return
    committedRef.current = true
    await onSave(draft)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      committedRef.current = true
      onCancel()
      return
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      commit()
    }
  }

  return (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      placeholder="Jot something down…"
      className="editor-surface w-72 min-h-[7rem] shrink-0 px-3 py-2 text-sm text-ink resize-none"
      data-test="project-scrap-inline-add"
    />
  )
}

function ProjectScrapCard({
  scrap, isEditing, menuOpen, confirmingDelete,
  onOpen, onSaveEdit, onCancelEdit, onOpenMenu, onCloseMenu, onRequestDelete, onCancelDelete, onConfirmDelete, onConvert,
}: {
  scrap: Scrap
  isEditing: boolean
  menuOpen: boolean
  confirmingDelete: boolean
  onOpen: () => void
  onSaveEdit: (body: string) => Promise<void>
  onCancelEdit: () => void
  onOpenMenu: () => void
  onCloseMenu: () => void
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => Promise<void>
  onConvert: (kind: ConversionKind) => void
}) {
  if (isEditing) {
    return (
      <ProjectScrapEditArea
        scrap={scrap}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
      />
    )
  }

  return (
    <div className="relative w-64 shrink-0">
      <button
        onClick={onOpen}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onOpenMenu()
        }}
        className="group w-full rounded border border-line bg-surface-2 px-3 py-2 text-left hover:border-accent hover:bg-surface-3 transition-colors"
        data-test="project-scrap-card"
        data-record-id={scrap.id}
      >
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-ink-faint shrink-0 mt-0.5">Sc</span>
          <span className="text-sm text-ink overflow-hidden whitespace-normal line-clamp-2">
            {truncateText(scrap.body || 'Empty scrap', 60)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-ink-faint">
          {scrap.sourceLabel && <span>{scrap.sourceLabel}</span>}
          {scrap.sourceLabel && <span>·</span>}
          <span>{relativeTime(scrap.updatedAt)}</span>
        </div>
      </button>

      {menuOpen && (
        <div className="absolute left-2 top-2 z-20 min-w-32 rounded border border-line bg-surface shadow-lg p-1 text-xs">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCloseMenu()
              onOpen()
            }}
            className="block w-full rounded px-2 py-1.5 text-left text-ink-soft hover:bg-surface-2 hover:text-ink"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCloseMenu()
              onConvert('scrap-to-note')
            }}
            className="block w-full rounded px-2 py-1.5 text-left text-ink-soft hover:bg-surface-2 hover:text-ink"
            data-test="scrap-convert-to-note"
          >
            Convert → Note
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCloseMenu()
              onConvert('scrap-to-block')
            }}
            className="block w-full rounded px-2 py-1.5 text-left text-ink-soft hover:bg-surface-2 hover:text-ink"
            data-test="scrap-convert-to-block"
          >
            Convert → Prompt Block
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRequestDelete()
            }}
            className="block w-full rounded px-2 py-1.5 text-left text-ink-soft hover:bg-surface-2 hover:text-bad"
            data-test="project-scrap-delete"
          >
            Delete
          </button>
        </div>
      )}

      {confirmingDelete && (
        <div className="mt-2 rounded border border-line bg-surface-2 px-3 py-2 text-xs text-ink-soft">
          <div>Delete this scrap?</div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onConfirmDelete()
              }}
              className="rounded border border-line px-2 py-1 text-bad hover:bg-surface-3"
            >
              Yes
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancelDelete()
              }}
              className="rounded border border-line px-2 py-1 text-ink-soft hover:text-ink hover:bg-surface-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectScrapEditArea({
  scrap, onSave, onCancel,
}: {
  scrap: Scrap
  onSave: (body: string) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(scrap.body)
  const committedRef = useRef(false)

  useEffect(() => {
    setDraft(scrap.body)
    committedRef.current = false
  }, [scrap.id, scrap.body])

  async function commit() {
    if (committedRef.current) return
    committedRef.current = true
    await onSave(draft)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      committedRef.current = true
      onCancel()
      return
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      commit()
    }
  }

  return (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className="editor-surface w-64 min-h-[7rem] shrink-0 px-3 py-2 text-sm text-ink resize-none"
      data-test="project-scrap-edit-area"
    />
  )
}

function ProjectContentCard({
  item, onOpen, onOpenInStudio,
}: {
  item: AttachedItem
  onOpen: () => void
  onOpenInStudio: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onOpen}
      className="group w-64 shrink-0 rounded border border-line bg-surface-2 px-3 py-2 text-left hover:border-accent hover:bg-surface-3 transition-colors"
      data-test="project-content-card"
      data-board-kind={item.kind}
      data-record-id={item.id}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-ink-faint shrink-0">{KIND_GLYPH[item.kind]}</span>
        <span className="text-sm text-ink truncate">
          {item.title || <span className="italic text-ink-faint">Untitled</span>}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-faint h-8 overflow-hidden whitespace-normal">
        {truncateText(item.preview || 'No preview yet.', 60)}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-ink-faint">
        <span>{relativeTime(item.updatedAt)}</span>
        <span className="flex-1" />
        <span
          onClick={onOpenInStudio}
          className="opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider hover:text-ink"
          data-test="project-content-card-open-in-studio"
        >
          studio →
        </span>
      </div>
    </button>
  )
}

// ── ProjectHub — the rich header ────────────────────────────────────────────

function ProjectHub({
  project, ws, attached, onDelete,
}: {
  project: Project
  ws: WS
  attached: AttachedItem[]
  onDelete: () => void
}) {
  const [draftName, setDraftName] = useState(project.name)
  const savedNameRef = useRef(project.name)

  // Keep local name in sync when the project record updates externally
  // (snapshot restore, palette navigation, another tab).
  useEffect(() => {
    if (project.name !== savedNameRef.current) {
      savedNameRef.current = project.name
      setDraftName(project.name)
    }
  }, [project.name])

  const isDirty = draftName !== project.name
  useDebouncedAutosave(draftName, isDirty, () => {
    savedNameRef.current = draftName
    ws.updateProject(project.id, { name: draftName })
  })

  const [notesOpen, setNotesOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(NOTES_OPEN_KEY)
      if (v === 'true') return true
      if (v === 'false') return false
    } catch {}
    return !!project.description.trim()
  })
  useEffect(() => {
    try { localStorage.setItem(NOTES_OPEN_KEY, notesOpen ? 'true' : 'false') } catch {}
  }, [notesOpen])

  const colourHex = project.colour ? COLOURS.find((c) => c.name === project.colour)?.hex : null

  // Stats: total + per-kind.
  const breakdown = useMemo(() => {
    const out: Record<AttachedKind, number> = {
      document: 0, note: 0, poem: 0, longform: 0, build: 0, pattern: 0, pipeline: 0,
    }
    for (const it of attached) out[it.kind]++
    return out
  }, [attached])

  const lastActivity = useMemo(() => {
    if (attached.length === 0) return null
    return Math.max(...attached.map((a) => a.updatedAt))
  }, [attached])

  function handleColour(colour: string) {
    const next = project.colour === colour ? undefined : colour
    ws.updateProject(project.id, { colour: next })
  }

  return (
    <header className="border-b border-line shrink-0" data-test="project-hub" data-project-id={project.id}>
      {/* Colour band along the top — narrow but expressive */}
      <div
        className="h-1.5"
        style={{
          backgroundColor: colourHex ?? 'rgb(var(--line))',
        }}
      />

      <div className="px-6 pt-4 pb-3">
        <div className="flex items-start gap-4 mb-3">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Project name"
            className="title-input flex-1 text-2xl text-ink"
            data-test="project-name"
            data-project-id={project.id}
          />
          <div className="flex items-center gap-1.5 mt-2">
            {COLOURS.map(({ name, hex }) => (
              <button
                key={name}
                onClick={() => handleColour(name)}
                className={`w-4 h-4 rounded-full transition-all ${
                  project.colour === name
                    ? 'ring-2 ring-offset-1 ring-accent'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: hex }}
                title={name}
                data-test="project-colour"
                data-colour={name}
              />
            ))}
          </div>
          <ShelfButton type="project" refId={project.id} title={project.name || 'Untitled'} />
          <Snapshots
            recordId={project.id}
            recordType="project"
            buildSnapshotData={() => JSON.stringify({
              name: draftName,
              description: project.description,
            })}
          />
          <InlineConfirmButton
            onConfirm={onDelete}
            label="Delete"
            confirmLabel="Confirm?"
            className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface-2 mt-1"
            data-test="project-delete"
          />
        </div>

        {/* Stat strip — at-a-glance project shape */}
        <div className="flex items-center gap-4 text-xs text-ink-soft mb-3" data-test="project-stat-strip">
          <span className="text-ink font-medium">{attached.length} {attached.length === 1 ? 'item' : 'items'}</span>
          {KIND_ORDER.filter((k) => breakdown[k] > 0).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-ink-faint">{KIND_GLYPH[k]}</span>
              <span>{breakdown[k]}</span>
            </span>
          ))}
          {lastActivity && (
            <span className="ml-auto text-ink-faint">
              last activity {relativeTime(lastActivity)}
            </span>
          )}
        </div>

        {/* Tags inline (no separate strip — tags ARE the project's status taxonomy) */}
        <TagsBar recordId={project.id} recordType="project" />

        {/* Collapsible notes */}
        <div className="mt-2" data-test="project-notes-panel">
          <button
            onClick={() => setNotesOpen((o) => !o)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink-soft transition-colors"
            data-test="project-notes-toggle"
            data-open={notesOpen ? 'true' : 'false'}
          >
            <span className="inline-block w-3">{notesOpen ? '▼' : '▶'}</span>
            <span>Notes</span>
            {!notesOpen && project.description.trim() && (
              <span className="ml-2 normal-case tracking-normal text-xs text-ink-faint truncate max-w-xl">
                — {project.description.trim().slice(0, 100)}{project.description.trim().length > 100 ? '…' : ''}
              </span>
            )}
          </button>
          {notesOpen && (
            <ProjectNotes project={project} ws={ws} />
          )}
        </div>
      </div>
    </header>
  )
}

// ── ProjectNotes — the project's narrative space ───────────────────────────

function ProjectNotes({ project, ws }: { project: Project; ws: WS }) {
  const [draft, setDraft] = useState(project.description)
  const savedRef = useRef(project.description)

  useEffect(() => {
    if (project.description !== savedRef.current) {
      savedRef.current = project.description
      setDraft(project.description)
    }
  }, [project.description])

  const isDirty = draft !== project.description
  useDebouncedAutosave(draft, isDirty, () => {
    savedRef.current = draft
    ws.updateProject(project.id, { description: draft })
  })

  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder="What is this project about? Sketch the shape, the goals, the pieces. This is the project's brief."
      className="editor-surface w-full mt-2 px-3 py-2 text-sm text-ink"
      style={{ minHeight: '80px', maxHeight: '240px', resize: 'vertical', display: 'block' }}
      data-test="project-description"
    />
  )
}

// ── QuickCapture — single-line "add anything" input ────────────────────────

function QuickCapture({
  project, ws, onOpenDrawer,
}: {
  project: Project
  ws: WS
  onOpenDrawer: (t: DrawerTarget) => void
}) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<AttachedKind>(() => {
    try {
      const v = localStorage.getItem(QC_KIND_KEY)
      if (v && KIND_ORDER.includes(v as AttachedKind)) return v as AttachedKind
    } catch {}
    return 'document'
  })
  useEffect(() => {
    try { localStorage.setItem(QC_KIND_KEY, kind) } catch {}
  }, [kind])

  async function handleCommit() {
    const t = title.trim()
    if (!t) return
    const id = await createForKindWithTitle(ws, kind, t)
    if (!id) return
    await attachToProject(ws, kind, id, project.id)
    setTitle('')
    // Open the new card in the drawer so the user can keep typing into it.
    onOpenDrawer({ kind, recordId: id })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    }
  }

  return (
    <div
      className="border-b border-line bg-surface-2 px-6 py-2 flex items-center gap-2 shrink-0"
      data-test="project-quick-capture"
    >
      <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">Quick add</span>
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as AttachedKind)}
        className="text-xs px-2 py-1 rounded border border-line bg-surface text-ink"
        data-test="quick-capture-kind"
      >
        {KIND_ORDER.map((k) => (
          <option key={k} value={k}>{KIND_LABELS_SINGULAR[k]}</option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Title for new ${KIND_LABELS_SINGULAR[kind]}, then Enter…`}
        className="title-input flex-1 text-sm text-ink"
        data-test="quick-capture-input"
      />
      <button
        onClick={handleCommit}
        disabled={!title.trim()}
        className="text-xs text-ink-soft hover:text-ink rounded px-2.5 py-1 border border-line hover:bg-surface-3 disabled:opacity-40"
        data-test="quick-capture-commit"
      >
        Add
      </button>
    </div>
  )
}

// ── ProjectBoard — the kanban surface ───────────────────────────────────────

function ProjectBoard({
  project, ws, navigate, onOpenDrawer,
}: {
  project: Project
  ws: WS
  navigate: ReturnType<typeof useNavigate>
  onOpenDrawer: (t: DrawerTarget) => void
}) {
  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-hidden"
      data-test="project-board"
      data-project-id={project.id}
    >
      <div className="h-full flex gap-3 px-6 py-4 min-w-max">
        {KIND_ORDER.map((kind) => (
          <BoardColumn
            key={kind}
            kind={kind}
            project={project}
            ws={ws}
            navigate={navigate}
            onOpenDrawer={onOpenDrawer}
          />
        ))}
      </div>
    </div>
  )
}

function BoardColumn({
  kind, project, ws, navigate, onOpenDrawer,
}: {
  kind: AttachedKind
  project: Project
  ws: WS
  navigate: ReturnType<typeof useNavigate>
  onOpenDrawer: (t: DrawerTarget) => void
}) {
  const items = collectItemsInProject(ws, project.id, kind)

  async function handleNewInProject() {
    const newId = await createForKind(ws, kind)
    if (!newId) return
    await attachToProject(ws, kind, newId, project.id)
    // Open the fresh card immediately — user wanted to add it, they want
    // to fill it in.
    onOpenDrawer({ kind, recordId: newId })
  }

  return (
    <section
      className="w-[280px] shrink-0 flex flex-col bg-surface-2 rounded border border-line overflow-hidden"
      data-test="board-column"
      data-board-kind={kind}
    >
      <header className="px-3 py-2 border-b border-line flex items-center gap-2 shrink-0">
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint flex-1">
          {KIND_LABELS[kind]}
        </span>
        <span
          className="text-[10px] text-ink-faint"
          data-test="board-column-count"
        >
          {items.length}
        </span>
      </header>

      <div className="px-2 pt-2 pb-1 flex items-center gap-1 shrink-0">
        <button
          onClick={handleNewInProject}
          className="flex-1 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 rounded px-2 py-1 border border-line"
          data-test="board-new-in-project"
          data-board-kind={kind}
          title={`Create a new ${KIND_LABELS_SINGULAR[kind]} in this project`}
        >
          + New
        </button>
        <AddExistingPicker kind={kind} projectId={project.id} ws={ws} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1 space-y-1.5" data-test="board-cards">
        {items.length === 0 && (
          <div className="text-[11px] text-ink-faint px-1 py-3 italic">
            No {KIND_LABELS[kind].toLowerCase()} yet.
          </div>
        )}
        {items.map((it) => (
          <BoardCard
            key={it.id}
            kind={kind}
            item={it}
            ws={ws}
            navigate={navigate}
            onOpenDrawer={onOpenDrawer}
            project={project}
          />
        ))}
      </div>
    </section>
  )
}

// ── BoardCard — denser, more informative ────────────────────────────────────

function BoardCard({
  kind, item, ws, navigate, onOpenDrawer, project,
}: {
  kind: AttachedKind
  item: AttachedItem
  ws: WS
  navigate: ReturnType<typeof useNavigate>
  onOpenDrawer: (t: DrawerTarget) => void
  project: Project
}) {
  function handleOpenDrawer() {
    onOpenDrawer({ kind, recordId: item.id })
  }

  function handleOpenInStudio(e: React.MouseEvent) {
    e.stopPropagation()
    // Set project context so the breadcrumb shows in the destination studio.
    setProjectContext(project.id)
    const target = KIND_TO_JUMPABLE[kind]
    jumpToSelection({ kind: target, id: item.id })
    navigate(ROUTE_FOR_TYPE[target])
  }

  function handleDetach() {
    detachFromProject(ws, kind, item.id)
  }

  return (
    <div
      onClick={handleOpenDrawer}
      className="group bg-surface border border-line rounded px-3 py-2 hover:border-accent transition-colors cursor-pointer"
      data-test="board-card"
      data-board-kind={kind}
      data-record-id={item.id}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-ink truncate flex-1">
          {item.title || <span className="italic text-ink-faint">Untitled</span>}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-ink-faint shrink-0">
          {KIND_GLYPH[kind]}
        </span>
      </div>
      {item.preview && (
        <div className="text-[11px] text-ink-faint mt-1 line-clamp-2 whitespace-pre-wrap">
          {item.preview}
        </div>
      )}
      <div className="flex items-center mt-1.5 text-[10px] text-ink-faint">
        <span>{relativeTime(item.updatedAt)}</span>
        <span className="flex-1" />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleOpenInStudio}
            className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-ink px-1.5 py-0.5 rounded hover:bg-surface-2"
            data-test="board-card-open-in-studio"
            title={`Open ${KIND_LABELS_SINGULAR[kind]} in its studio`}
          >
            studio →
          </button>
          <span onClick={(e) => e.stopPropagation()}>
            <InlineConfirmButton
              onConfirm={handleDetach}
              label="detach"
              confirmLabel="confirm?"
              className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded"
            />
          </span>
        </div>
      </div>
    </div>
  )
}

// ── AddExistingPicker — popover for attaching existing records ─────────────

function AddExistingPicker({
  kind, projectId, ws,
}: {
  kind: AttachedKind
  projectId: string
  ws: WS
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => inputRef.current?.focus(), 10)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const candidates = collectAllOfKind(ws, kind).filter((c) => c.projectId !== projectId)
  const filtered = query.trim()
    ? candidates.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    : candidates

  const grouped: { label: string; items: AttachedItem[] }[] = (() => {
    const byProject = new Map<string | undefined, AttachedItem[]>()
    for (const c of filtered) {
      const k = c.projectId
      if (!byProject.has(k)) byProject.set(k, [])
      byProject.get(k)!.push(c)
    }
    const out: { label: string; items: AttachedItem[] }[] = []
    if (byProject.has(undefined)) {
      out.push({ label: '(no project)', items: byProject.get(undefined)! })
    }
    for (const [pid, list] of byProject) {
      if (pid === undefined) continue
      const proj = ws.projects.find((p) => p.id === pid)
      out.push({ label: proj?.name || 'Untitled project', items: list })
    }
    return out
  })()

  function handleAttach(recordId: string) {
    attachToProject(ws, kind, recordId, projectId)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 rounded px-2 py-1 border border-line"
        data-test="board-add-existing"
        data-board-kind={kind}
        title={`Attach an existing ${KIND_LABELS_SINGULAR[kind]} to this project`}
      >
        + Existing
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 right-0 z-20 bg-surface border border-line rounded shadow-md w-64 max-h-[320px] flex flex-col"
          data-test="board-add-existing-menu"
          data-board-kind={kind}
        >
          <div className="px-2 py-1.5 border-b border-line shrink-0">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${KIND_LABELS[kind].toLowerCase()}…`}
              className="title-input w-full text-xs text-ink"
              data-test="board-add-existing-search"
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {grouped.length === 0 && (
              <div className="px-3 py-2 text-xs text-ink-faint italic">
                {candidates.length === 0
                  ? `No other ${KIND_LABELS[kind].toLowerCase()} to attach.`
                  : 'No matches.'}
              </div>
            )}
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <div className="px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {label}
                </div>
                {items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleAttach(c.id)}
                    className="w-full text-left px-3 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-surface-2 truncate"
                    data-test="board-add-existing-option"
                    data-record-id={c.id}
                  >
                    {c.title || <span className="italic">Untitled</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── CardDrawer — in-place mini editor ───────────────────────────────────────

function CardDrawer({
  target, ws, project, navigate, onClose,
}: {
  target: DrawerTarget
  ws: WS
  project: Project
  navigate: ReturnType<typeof useNavigate>
  onClose: () => void
}) {
  const setFocus = useSetFocus()

  // Resolve the live record from ws so updates reflect immediately.
  const record = useMemo(
    () => resolveRecord(ws, target.kind, target.recordId),
    [ws, target.kind, target.recordId]
  )

  useEffect(() => {
    ws.setActiveRecord({ id: target.recordId, type: target.kind })
    setFocus({ id: target.recordId, type: target.kind, origin: 'projects' })
  }, [target.recordId, target.kind, ws, setFocus])

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!record) {
    // Record was deleted while drawer was open. Close gracefully.
    return null
  }

  function handleOpenInStudio() {
    ws.setActiveRecord({ id: target.recordId, type: target.kind })
    setFocus({ id: target.recordId, type: target.kind, origin: 'projects' })
    setProjectContext(project.id)
    const j = KIND_TO_JUMPABLE[target.kind]
    jumpToSelection({ kind: j, id: target.recordId })
    navigate(ROUTE_FOR_TYPE[j])
  }

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div
        className="absolute inset-0 z-30 bg-black/20"
        onClick={onClose}
        data-test="card-drawer-backdrop"
      />
      {/* Drawer panel */}
      <div
        className="absolute top-0 right-0 bottom-0 z-40 w-[min(560px,60vw)] bg-surface border-l border-line flex flex-col shadow-2xl"
        data-test="card-drawer"
        data-board-kind={target.kind}
        data-record-id={target.recordId}
      >
        <header className="border-b border-line px-4 py-2.5 flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            {KIND_LABELS_SINGULAR[target.kind]}
          </span>
          <span className="flex-1" />
          <button
            onClick={handleOpenInStudio}
            className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2"
            data-test="card-drawer-open-in-studio"
            title="Open in studio (a back-to-project pill will appear in the top bar)"
          >
            Open in studio →
          </button>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink rounded px-2 py-1 hover:bg-surface-2 text-base leading-none"
            data-test="card-drawer-close"
            title="Close drawer (Esc)"
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          <DrawerEditor key={`${target.kind}:${target.recordId}`} target={target} record={record} ws={ws} />
        </div>
      </div>
    </>
  )
}

// Polymorphic mini-editor. For each kind it edits the most-edited fields:
// title-equivalent + body-equivalent. Autosaves through the existing CRUD.
function DrawerEditor({
  target, record, ws,
}: {
  target: DrawerTarget
  record: AnyRecord
  ws: WS
}) {
  // We split the editor into per-kind components so each can have the
  // right placeholder / shape, but they share the same autosave pattern.
  switch (target.kind) {
    case 'document':
      return <TitleBodyEditor
        kindLabel="Document"
        titleField="title"
        bodyField="body"
        record={record as Document}
        save={(patch) => ws.updateDocument(record.id, patch as any)}
        bodyPlaceholder="Start writing…"
      />
    case 'note':
      return <TitleBodyEditor
        kindLabel="Note"
        titleField="title"
        bodyField="body"
        record={record as Note}
        save={(patch) => ws.updateNote(record.id, patch as any)}
        bodyPlaceholder="Note body…"
      />
    case 'poem':
      return <TitleBodyEditor
        kindLabel="Poem"
        titleField="title"
        bodyField="body"
        record={record as Poem}
        save={(patch) => ws.updatePoem(record.id, patch as any)}
        bodyPlaceholder="Verse…"
        bodyMonospace={false}
      />
    case 'longform':
      return <LongformDrawerEditor doc={record as LongformDoc} ws={ws} />
    case 'build':
      return <TitleBodyEditor
        kindLabel="Build"
        titleField="name"
        bodyField="description"
        record={record as AppDesignBuild}
        save={(patch) => ws.updateBuild(record.id, patch as any)}
        bodyPlaceholder="What is this build?"
      />
    case 'pattern':
      return <TitleBodyEditor
        kindLabel="Pattern"
        titleField="name"
        bodyField="body"
        record={record as Pattern}
        save={(patch) => ws.updatePattern(record.id, patch as any)}
        bodyPlaceholder="Pattern body…"
        bodyMonospace
      />
    case 'pipeline':
      return <TitleBodyEditor
        kindLabel="Pipeline"
        titleField="name"
        bodyField="description"
        record={record as PromptPipeline}
        save={(patch) => ws.updatePipeline(record.id, patch as any)}
        bodyPlaceholder="What does this pipeline do?"
        belowMessage="Block editing lives in the Prompt studio."
      />
  }
}

function LongformDrawerEditor({ doc, ws }: { doc: LongformDoc; ws: WS }) {
  const firstSection = useMemo(
    () => ws.sections
      .filter((s) => s.projectId === doc.id)
      .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)[0] ?? null,
    [ws.sections, doc.id]
  )

  const [draftTitle, setDraftTitle] = useState(doc.title)
  const [draftBody, setDraftBody] = useState(firstSection?.body ?? '')
  const sectionIdRef = useRef<string | null>(firstSection?.id ?? null)
  const savedRef = useRef({ title: doc.title, body: firstSection?.body ?? '' })

  useEffect(() => {
    const title = doc.title
    const body = firstSection?.body ?? ''
    if (firstSection?.id) sectionIdRef.current = firstSection.id
    if (title !== savedRef.current.title || body !== savedRef.current.body) {
      savedRef.current = { title, body }
      setDraftTitle(title)
      setDraftBody(body)
    }
  }, [doc.title, firstSection?.id, firstSection?.body])

  const currentBody = firstSection?.body ?? ''
  const isDirty = draftTitle !== doc.title || draftBody !== currentBody
  const signature = draftTitle + '\u0000' + draftBody

  useDebouncedAutosave(signature, isDirty, async () => {
    savedRef.current = { title: draftTitle, body: draftBody }
    if (draftTitle !== doc.title) {
      await ws.updateLongformDoc(doc.id, { title: draftTitle })
    }
    if (draftBody !== currentBody) {
      let sectionId = firstSection?.id ?? sectionIdRef.current
      if (!sectionId) {
        const section = await ws.createSection(doc.id, 'Draft')
        sectionId = section.id
        sectionIdRef.current = section.id
      }
      await ws.updateSection(sectionId, { body: draftBody })
    }
  })

  return (
    <div className="px-6 py-4 flex flex-col gap-3">
      <input
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        placeholder="Longform title"
        className="title-input text-xl text-ink"
        data-test="drawer-title"
        autoFocus
      />
      <textarea
        value={draftBody}
        onChange={(e) => setDraftBody(e.target.value)}
        placeholder="First section body…"
        className="editor-surface px-3 py-2 text-ink"
        style={{ minHeight: '320px', resize: 'vertical', display: 'block' }}
        data-test="drawer-body"
      />
      <p className="text-xs text-ink-faint italic">
        This edits the first longform section inline. Use the Longform studio for section structure and ordering.
      </p>
    </div>
  )
}

// Generic title+body editor with autosave. Handles the field-name
// variation across kinds (title vs name, body vs description) without
// re-implementing the autosave loop six times.
function TitleBodyEditor<T extends { id: string }>({
  kindLabel, titleField, bodyField, record, save,
  bodyPlaceholder, bodyMonospace, belowMessage,
}: {
  kindLabel: string
  titleField: keyof T
  bodyField: keyof T | null
  record: T
  save: (patch: Partial<T>) => Promise<void>
  bodyPlaceholder?: string
  bodyMonospace?: boolean
  belowMessage?: string
}) {
  const [draftTitle, setDraftTitle] = useState((record[titleField] as unknown as string) ?? '')
  const [draftBody, setDraftBody] = useState(
    bodyField ? ((record[bodyField] as unknown as string) ?? '') : ''
  )
  const savedRef = useRef({
    title: (record[titleField] as unknown as string) ?? '',
    body: bodyField ? ((record[bodyField] as unknown as string) ?? '') : '',
  })

  // Sync if the underlying record changes externally.
  useEffect(() => {
    const t = (record[titleField] as unknown as string) ?? ''
    const b = bodyField ? ((record[bodyField] as unknown as string) ?? '') : ''
    if (t !== savedRef.current.title || b !== savedRef.current.body) {
      savedRef.current = { title: t, body: b }
      setDraftTitle(t)
      setDraftBody(b)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id, record[titleField], bodyField ? record[bodyField] : null])

  const isDirty =
    draftTitle !== ((record[titleField] as unknown as string) ?? '') ||
    (bodyField !== null && draftBody !== ((record[bodyField] as unknown as string) ?? ''))

  const signature = draftTitle + '\u0000' + draftBody
  useDebouncedAutosave(signature, isDirty, async () => {
    savedRef.current = { title: draftTitle, body: draftBody }
    const patch: Record<string, string> = { [titleField as string]: draftTitle }
    if (bodyField !== null) patch[bodyField as string] = draftBody
    await save(patch as Partial<T>)
  })

  return (
    <div className="px-6 py-4 flex flex-col gap-3">
      <input
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        placeholder={`${kindLabel} title`}
        className="title-input text-xl text-ink"
        data-test="drawer-title"
        autoFocus
      />
      {bodyField !== null && (
        <textarea
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          placeholder={bodyPlaceholder ?? 'Body…'}
          className={`editor-surface px-3 py-2 text-ink ${bodyMonospace ? 'font-mono text-sm' : ''}`}
          style={{ minHeight: '320px', resize: 'vertical', display: 'block' }}
          data-test="drawer-body"
        />
      )}
      {belowMessage && (
        <p className="text-xs text-ink-faint italic">{belowMessage}</p>
      )}
    </div>
  )
}

// ── ProjectStream — recent activity timeline ────────────────────────────────

function ProjectStream({ attached, project }: { attached: AttachedItem[]; project: Project }) {
  // Synthesise an event log from updatedAt / createdAt. Two events per
  // record: created, last-updated (only if updated > created + 1s).
  const events = useMemo(() => {
    const out: { id: string; ts: number; kind: AttachedKind; verb: 'created' | 'updated'; title: string; recordId: string }[] = []
    for (const it of attached) {
      out.push({
        id: `${it.id}:create`,
        ts: it.createdAt,
        kind: it.kind,
        verb: 'created',
        title: it.title,
        recordId: it.id,
      })
      // Only emit an "updated" event if the gap is meaningful — otherwise
      // creation autosave pings would each register as both events.
      if (it.updatedAt > it.createdAt + 60_000) {
        out.push({
          id: `${it.id}:update`,
          ts: it.updatedAt,
          kind: it.kind,
          verb: 'updated',
          title: it.title,
          recordId: it.id,
        })
      }
    }
    out.sort((a, b) => b.ts - a.ts)
    return out
  }, [attached])

  // Group events by day for readability.
  const groups = useMemo(() => {
    const byDay = new Map<string, typeof events>()
    for (const ev of events) {
      const d = new Date(ev.ts)
      const key = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key)!.push(ev)
    }
    return Array.from(byDay.entries())
  }, [events])

  if (events.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 text-xs text-ink-faint italic" data-test="project-stream">
        Nothing yet. Add an item from the board or quick-capture to start a stream.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4" data-test="project-stream">
      {groups.map(([day, dayEvents]) => (
        <div key={day}>
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-1.5 px-1">
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-baseline gap-2 px-2 py-1 rounded text-xs"
                data-test="stream-event"
                data-kind={ev.kind}
                data-verb={ev.verb}
              >
                <span className="text-ink-faint shrink-0 w-12">{relativeTimeShort(ev.ts)}</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-faint shrink-0 w-12">
                  {KIND_GLYPH[ev.kind]}
                </span>
                <span className={ev.verb === 'created' ? 'text-ink' : 'text-ink-soft'}>
                  {ev.verb === 'created' ? 'created' : 'edited'}
                </span>
                <span className="text-ink-soft truncate">
                  {ev.title || <span className="italic">untitled</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Side panel tabs ─────────────────────────────────────────────────────────

function SidePanelTabs({ mode, onChange }: { mode: SidePanelMode; onChange: (m: SidePanelMode) => void }) {
  return (
    <div className="border-b border-line shrink-0 flex items-center" data-test="project-side-panel-tabs">
      <TabButton active={mode === 'stream'} onClick={() => onChange('stream')} label="Stream" testId="project-tab-stream" />
      <TabButton active={mode === 'links'}  onClick={() => onChange('links')}  label="Links"  testId="project-tab-links" />
      <span className="flex-1" />
      <button
        onClick={() => onChange('hidden')}
        className="text-ink-faint hover:text-ink-soft text-xs px-3 py-2"
        data-test="project-side-panel-hide"
        title="Hide side panel"
      >
        ›
      </button>
    </div>
  )
}

function TabButton({ active, onClick, label, testId }: {
  active: boolean; onClick: () => void; label: string; testId: string
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] uppercase tracking-[0.14em] px-3 py-2 transition-colors ${
        active ? 'text-ink border-b-2 border-accent -mb-px' : 'text-ink-faint hover:text-ink-soft'
      }`}
      data-test={testId}
      data-active={active ? 'true' : 'false'}
    >
      {label}
    </button>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

interface AttachedItem {
  kind: AttachedKind
  id: string
  title: string
  createdAt: number
  updatedAt: number
  projectId?: string
  preview?: string
}

type AnyRecord = Document | Poem | LongformDoc | AppDesignBuild | Pattern | PromptPipeline | Note  // Sweep 27

function resolveRecord(ws: WS, kind: AttachedKind, id: string): AnyRecord | null {
  switch (kind) {
    case 'document': return ws.documents.find((d) => d.id === id) ?? null
    case 'note':     return ws.notes.find((n) => n.id === id) ?? null  // Sweep 27
    case 'poem':     return ws.poems.find((p) => p.id === id) ?? null
    case 'longform': return ws.longformDocs.find((d) => d.id === id) ?? null
    case 'build':    return ws.builds.find((b) => b.id === id) ?? null
    case 'pattern':  return ws.patterns.find((p) => p.id === id) ?? null
    case 'pipeline': return ws.pipelines.find((p) => p.id === id) ?? null
  }
}

function collectItemsInProject(ws: WS, projectId: string, kind: AttachedKind): AttachedItem[] {
  return collectAllOfKind(ws, kind)
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

function collectAllAttached(ws: WS, projectId: string): AttachedItem[] {
  const out: AttachedItem[] = []
  for (const k of KIND_ORDER) {
    for (const it of collectAllOfKind(ws, k)) {
      if (it.projectId === projectId) out.push(it)
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt)
}

function collectAllOfKind(ws: WS, kind: AttachedKind): AttachedItem[] {
  const map = (
    title: string, body: string, id: string, createdAt: number, updatedAt: number, projectId?: string,
  ): AttachedItem => ({
    kind, id, title, createdAt, updatedAt, projectId,
    preview: previewOf(body),
  })
  switch (kind) {
    case 'document':
      return ws.documents.filter((d) => !d.deletedAt).map((d) =>
        map(d.title, d.body, d.id, d.createdAt, d.updatedAt, d.projectId))
    case 'note':  // Sweep 27 — same shape as poem
      return ws.notes.filter((n) => !n.deletedAt).map((n) =>
        map(n.title, n.body, n.id, n.createdAt, n.updatedAt, n.projectId))
    case 'poem':
      return ws.poems.filter((p) => !p.deletedAt).map((p) =>
        map(p.title, p.body, p.id, p.createdAt, p.updatedAt, p.projectId))
    case 'longform':
      return ws.longformDocs.filter((d) => !d.deletedAt).map((d) => {
        const firstSection = ws.sections
          .filter((sec) => sec.projectId === d.id)
          .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt)[0]
        return map(d.title, firstSection?.body ?? '', d.id, d.createdAt, Math.max(d.updatedAt, firstSection?.updatedAt ?? d.updatedAt), d.projectId)
      })
    case 'build':
      return ws.builds.filter((b) => !b.deletedAt).map((b) =>
        map(b.name, b.description, b.id, b.createdAt, b.updatedAt, b.projectId))
    case 'pattern':
      return ws.patterns.filter((p) => !p.deletedAt).map((p) =>
        map(p.name, p.body, p.id, p.createdAt, p.updatedAt, p.projectId))
    case 'pipeline':
      return ws.pipelines.filter((p) => !p.deletedAt).map((p) =>
        map(p.name, p.description, p.id, p.createdAt, p.updatedAt, p.projectId))
  }
}

function previewOf(body: string): string | undefined {
  const trimmed = (body ?? '').trim()
  if (!trimmed) return undefined
  return trimmed.length > 140 ? trimmed.slice(0, 140) + '…' : trimmed
}

async function createForKind(ws: WS, kind: AttachedKind): Promise<string | null> {
  switch (kind) {
    case 'document': return (await ws.createDocument()).id
    case 'note':     return (await ws.createNote()).id  // Sweep 27
    case 'poem':     return (await ws.createPoem()).id
    case 'longform': return (await ws.createLongformDoc()).id
    case 'build':    return (await ws.createBuild()).id
    case 'pattern':  return (await ws.createPattern()).id
    case 'pipeline': return (await ws.createPipeline()).id
  }
}

async function createForKindWithTitle(ws: WS, kind: AttachedKind, title: string): Promise<string | null> {
  // Most CRUD signatures accept a title/name positional arg — except
  // createPattern, which takes Partial<Pattern>. Branch accordingly.
  switch (kind) {
    case 'document': return (await ws.createDocument(title)).id
    case 'note':     return (await ws.createNote(title)).id  // Sweep 27
    case 'poem':     return (await ws.createPoem(title)).id
    case 'longform': return (await ws.createLongformDoc(title)).id
    case 'build':    return (await ws.createBuild(title)).id
    case 'pattern':  return (await ws.createPattern({ name: title })).id
    case 'pipeline': return (await ws.createPipeline(title)).id
  }
}

async function attachToProject(ws: WS, kind: AttachedKind, id: string, projectId: string) {
  switch (kind) {
    case 'document': return ws.updateDocument(id, { projectId })
    case 'note':     return ws.updateNote(id, { projectId })  // Sweep 27
    case 'poem':     return ws.updatePoem(id, { projectId })
    case 'longform': return ws.updateLongformDoc(id, { projectId })
    case 'build':    return ws.updateBuild(id, { projectId })
    case 'pattern':  return ws.updatePattern(id, { projectId })
    case 'pipeline': return ws.updatePipeline(id, { projectId })
  }
}

async function detachFromProject(ws: WS, kind: AttachedKind, id: string) {
  switch (kind) {
    case 'document': return ws.updateDocument(id, { projectId: undefined })
    case 'note':     return ws.updateNote(id, { projectId: undefined })  // Sweep 27
    case 'poem':     return ws.updatePoem(id, { projectId: undefined })
    case 'longform': return ws.updateLongformDoc(id, { projectId: undefined })
    case 'build':    return ws.updateBuild(id, { projectId: undefined })
    case 'pattern':  return ws.updatePattern(id, { projectId: undefined })
    case 'pipeline': return ws.updatePipeline(id, { projectId: undefined })
  }
}

function lastTypeKey(projectId: string): string {
  return `${LAST_TYPE_PREFIX}${projectId}${LAST_TYPE_SUFFIX}`
}

function loadLastTypeMap(projectId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(lastTypeKey(projectId))
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {}
  return {}
}

function saveLastTypeMap(projectId: string, map: Record<string, number>) {
  try { localStorage.setItem(lastTypeKey(projectId), JSON.stringify(map)) } catch {}
}

function sortRowsByTouch(touch: Record<string, number>): ContentRowType[] {
  const poem: ContentRowType = 'poems'
  const nonPoemRows: ContentRowType[] = DEFAULT_ROW_ORDER.filter((r) => r !== poem)
  return [
    ...nonPoemRows.sort((a, b) => {
      const ta = touch[a] ?? 0
      const tb = touch[b] ?? 0
      if (ta !== tb) return tb - ta
      return DEFAULT_ROW_ORDER.indexOf(a) - DEFAULT_ROW_ORDER.indexOf(b)
    }),
    poem,
  ]
}

function rowTypeForKind(kind: AttachedKind): ContentRowType {
  switch (kind) {
    case 'document': return 'documents'
    case 'note': return 'notes'
    case 'poem': return 'poems'
    case 'longform': return 'longform'
    case 'build':
    case 'pattern':
    case 'pipeline':
      return 'appdesign'
  }
}

function primaryKindForRow(rowType: ContentRowType): AttachedKind | null {
  switch (rowType) {
    case 'documents': return 'document'
    case 'notes': return 'note'
    case 'poems': return 'poem'
    case 'longform': return 'longform'
    case 'appdesign': return 'build'
    case 'scraps': return null
  }
}

function attachedKindForJumpable(kind: JumpableKind): AttachedKind | null {
  switch (kind) {
    case 'document': return 'document'
    case 'note': return 'note'
    case 'poem': return 'poem'
    case 'longform': return 'longform'
    case 'build': return 'build'
    case 'pattern': return 'pattern'
    case 'pipeline': return 'pipeline'
    case 'project': return null
  }
}

function collectItemsForRow(ws: WS, projectId: string, rowType: ContentRowType): AttachedItem[] {
  switch (rowType) {
    case 'documents': return collectItemsInProject(ws, projectId, 'document')
    case 'notes': return collectItemsInProject(ws, projectId, 'note')
    case 'poems': return collectItemsInProject(ws, projectId, 'poem')
    case 'longform': return collectItemsInProject(ws, projectId, 'longform')
    case 'appdesign':
      return [
        ...collectItemsInProject(ws, projectId, 'build'),
        ...collectItemsInProject(ws, projectId, 'pattern'),
        ...collectItemsInProject(ws, projectId, 'pipeline'),
      ].sort((a, b) => b.updatedAt - a.updatedAt)
    case 'scraps': return []
  }
}

function findAttachedItem(ws: WS, kind: AttachedKind, id: string): AttachedItem | null {
  return collectAllOfKind(ws, kind).find((it) => it.id === id) ?? null
}

function findContinueTarget(ws: WS, projectId: string, views: ReturnType<typeof useRecentViews>['views']): ContinueTarget | null {
  let recentAttached: ContinueTarget | null = null
  for (const view of views) {
    const kind = attachedKindForJumpable(view.kind)
    if (!kind) continue
    const item = findAttachedItem(ws, kind, view.id)
    if (item?.projectId === projectId) {
      recentAttached = {
        type: 'attached',
        id: item.id,
        label: item.title || 'Untitled',
        timestamp: view.visitedAt,
        item,
      }
      break
    }
  }

  const scrap = ws.scraps
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]
  const recentScrap: ContinueTarget | null = scrap ? {
    type: 'scrap',
    id: scrap.id,
    label: truncateText(scrap.body || 'Empty scrap', 40),
    timestamp: scrap.updatedAt,
    scrap,
  } : null

  if (recentAttached && recentScrap) {
    return recentScrap.timestamp > recentAttached.timestamp ? recentScrap : recentAttached
  }
  return recentAttached ?? recentScrap
}

function getRecordTitle(record: AnyRecord | null, kind: AttachedKind): string {
  if (!record) return ''
  if (kind === 'build' || kind === 'pattern' || kind === 'pipeline') {
    return ('name' in record ? record.name : '') || ''
  }
  return ('title' in record ? record.title : '') || ''
}

function truncateText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, Math.max(0, max - 1)).trimEnd() + '…'
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000)         return 'just now'
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`
  const d = new Date(ts)
  return d.toLocaleDateString()
}

function relativeTimeShort(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000)         return 'now'
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m`
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
