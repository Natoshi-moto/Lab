import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../../context'
import type { LinkableType, ShelfItem, ShelfRefType, Snapshot } from '../../types'
import { jumpToSelection, ROUTE_FOR_TYPE, type JumpableKind } from '../../util/navigate'
import { relativeTime } from '../../util/recentViews'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'

const TYPE_LABEL: Record<ShelfRefType, string> = {
  document: 'doc',
  poem:     'poem',
  longform: 'longform',
  build:    'build',
  project:  'project',  // Sweep 6: now means a universal Project container.
  note:     'note'      // Sweep 27
}

type StashFilter = 'all' | 'document' | 'poem' | 'note' | 'longform' | 'build' | 'pipeline' | 'project'

type StashMeta = {
  title: string
  preview: string
}

const SNAPSHOT_TYPE_LABEL: Partial<Record<LinkableType, string>> = {
  document: 'doc',
  poem: 'poem',
  note: 'note',
  longform: 'longform',
  build: 'build',
  pipeline: 'pipeline',
  project: 'project',
}

function parseSnapshotMeta(item: Snapshot): StashMeta {
  try {
    const parsed = JSON.parse(item.data) as Record<string, unknown>
    const titleSource = item.recordType === 'build' || item.recordType === 'pipeline' || item.recordType === 'project'
      ? parsed.name
      : parsed.title
    const body = typeof parsed.body === 'string' ? parsed.body : ''
    const description = typeof parsed.description === 'string' ? parsed.description : ''
    const preview = (body || description).replace(/\s+/g, ' ').trim().slice(0, 80)
    return {
      title: typeof titleSource === 'string' && titleSource.trim() ? titleSource : 'Untitled',
      preview,
    }
  } catch {
    return { title: 'Untitled', preview: '' }
  }
}

function canRestore(type: LinkableType): boolean {
  return type === 'document'
    || type === 'poem'
    || type === 'note'
    || type === 'longform'
    || type === 'build'
    || type === 'pipeline'
    || type === 'project'
}

function isJumpableKind(type: LinkableType): type is JumpableKind {
  return Object.prototype.hasOwnProperty.call(ROUTE_FOR_TYPE, type)
}

export function Shelf() {
  const ws = useWorkspace()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<StashFilter>('all')

  const active   = ws.shelfItems.filter((s) => !s.archived).sort((a, b) => b.addedAt - a.addedAt)
  const archived = ws.shelfItems.filter((s) =>  s.archived).sort((a, b) => b.addedAt - a.addedAt)

  const savedItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...ws.snapshots]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((item) => ({ item, meta: parseSnapshotMeta(item) }))
      .filter(({ item, meta }) => {
        if (typeFilter !== 'all' && item.recordType !== typeFilter) return false
        if (q && !meta.title.toLowerCase().includes(q)) return false
        return true
      })
  }, [query, typeFilter, ws.snapshots])

  function open(item: ShelfItem) {
    jumpToSelection({ kind: item.type, id: item.refId })
    navigate(ROUTE_FOR_TYPE[item.type])
  }

  function openSnapshot(item: Snapshot) {
    if (!isJumpableKind(item.recordType)) return
    jumpToSelection({ kind: item.recordType, id: item.recordId })
    navigate(ROUTE_FOR_TYPE[item.recordType])
  }

  async function restoreSnapshot(item: Snapshot) {
    if (!canRestore(item.recordType)) return
    const parsed = JSON.parse(item.data)
    if (item.recordType === 'document')      await ws.updateDocument(item.recordId, parsed)
    else if (item.recordType === 'poem')     await ws.updatePoem(item.recordId, parsed)
    else if (item.recordType === 'note')     await ws.updateNote(item.recordId, parsed)
    else if (item.recordType === 'longform') await ws.updateLongformDoc(item.recordId, parsed)
    else if (item.recordType === 'build')    await ws.updateBuild(item.recordId, parsed)
    else if (item.recordType === 'pipeline') await ws.updatePipeline(item.recordId, parsed)
    else if (item.recordType === 'project')  await ws.updateProject(item.recordId, parsed)
  }

  function liveTitle(item: ShelfItem): string {
    switch (item.type) {
      case 'document': return ws.documents.find((d) => d.id === item.refId)?.title    ?? item.title
      case 'poem':     return ws.poems.find((p) => p.id === item.refId)?.title        ?? item.title
      case 'longform': return ws.longformDocs.find((p) => p.id === item.refId)?.title ?? item.title
      case 'build':    return ws.builds.find((b) => b.id === item.refId)?.name        ?? item.title
      case 'project':  return ws.projects.find((p) => p.id === item.refId)?.name      ?? item.title
      case 'note':     return ws.notes.find((n) => n.id === item.refId)?.title        ?? item.title  // Sweep 27
    }
  }

  function isStale(item: ShelfItem): boolean {
    switch (item.type) {
      case 'document': { const d = ws.documents.find((x) => x.id === item.refId);    return !d || d.deletedAt !== undefined }
      case 'poem':     { const p = ws.poems.find((x) => x.id === item.refId);        return !p || p.deletedAt !== undefined }
      case 'longform': { const p = ws.longformDocs.find((x) => x.id === item.refId); return !p || p.deletedAt !== undefined }
      case 'build':    { const b = ws.builds.find((x) => x.id === item.refId);       return !b || b.deletedAt !== undefined }
      case 'project':  return !ws.projects.find((p) => p.id === item.refId)
      case 'note':     { const n = ws.notes.find((x) => x.id === item.refId);        return !n || n.deletedAt !== undefined }  // Sweep 27
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-xl text-ink mb-2">Stash</h1>
      <p className="text-sm text-ink-faint mb-6">
        Things you've saved. Hit Save in any studio to add here.
      </p>

      <div className="mb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setQuery('')
          }}
          placeholder="Search saved items…"
          className="w-full rounded border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40"
          data-test="stash-search"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-8" data-test="stash-filter">
        <FilterPill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All</FilterPill>
        <FilterPill active={typeFilter === 'document'} onClick={() => setTypeFilter('document')} data-test="stash-filter-doc">doc</FilterPill>
        <FilterPill active={typeFilter === 'poem'} onClick={() => setTypeFilter('poem')} data-test="stash-filter-poem">poem</FilterPill>
        <FilterPill active={typeFilter === 'note'} onClick={() => setTypeFilter('note')} data-test="stash-filter-note">note</FilterPill>
        <FilterPill active={typeFilter === 'longform'} onClick={() => setTypeFilter('longform')} data-test="stash-filter-longform">longform</FilterPill>
        <FilterPill active={typeFilter === 'build'} onClick={() => setTypeFilter('build')} data-test="stash-filter-build">build</FilterPill>
        <FilterPill active={typeFilter === 'pipeline'} onClick={() => setTypeFilter('pipeline')} data-test="stash-filter-pipeline">pipeline</FilterPill>
        <FilterPill active={typeFilter === 'project'} onClick={() => setTypeFilter('project')} data-test="stash-filter-project">project</FilterPill>
      </div>

      <Section title={`Saved (${savedItems.length})`}>
        {savedItems.length === 0 ? (
          <div className="text-sm text-ink-faint italic" data-test="stash-empty">
            Nothing saved yet. Open any document, note, poem, or pipeline and click Save.
          </div>
        ) : (
          <div className="space-y-1">
            {savedItems.map(({ item, meta }) => (
              <SavedRow
                key={item.id}
                item={item}
                meta={meta}
                hasRoute={isJumpableKind(item.recordType)}
                canRestore={canRestore(item.recordType)}
                onOpen={() => openSnapshot(item)}
                onRestore={() => void restoreSnapshot(item)}
                onDelete={() => void ws.deleteSnapshot(item.id)}
              />
            ))}
          </div>
        )}
      </Section>

      <div className="mt-10">
        <Section title={`Pinned (${active.length} of 12)`}>
          {active.length === 0 ? (
            <div className="text-sm text-ink-faint italic">Nothing pinned yet.</div>
          ) : (
            <div className="space-y-1">
              {active.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  liveTitle={liveTitle(item)}
                  stale={isStale(item)}
                  onOpen={() => open(item)}
                  onRemove={() => ws.removeFromShelf(item.id)}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      {archived.length > 0 && (
        <details className="mt-8 group/archived" data-test="archived-details">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2 hover:text-ink">
            Archived ({archived.length})
          </summary>
          <div className="space-y-1 mt-2">
            {archived.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                liveTitle={liveTitle(item)}
                stale={isStale(item)}
                muted
                onOpen={() => open(item)}
                onRemove={() => ws.removeFromShelf(item.id)}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function FilterPill({ active, onClick, children, 'data-test': dataTest }: {
  active: boolean
  onClick: () => void
  children: ReactNode
  'data-test'?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs rounded-full border px-2.5 py-1 ${
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-line bg-surface-2 text-ink-soft hover:text-ink hover:bg-surface-3'
      }`}
      data-test={dataTest}
    >
      {children}
    </button>
  )
}

function Section({ title, children }: { title: string, children: ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-2">{title}</div>
      {children}
    </section>
  )
}

function SavedRow({
  item, meta, hasRoute, canRestore, onOpen, onRestore, onDelete
}: {
  item: Snapshot
  meta: StashMeta
  hasRoute: boolean
  canRestore: boolean
  onOpen: () => void
  onRestore: () => void
  onDelete: () => void
}) {
  const label = SNAPSHOT_TYPE_LABEL[item.recordType] ?? item.recordType
  return (
    <div
      className="group rounded border border-line px-3 py-2 flex items-center gap-3 bg-surface-2 hover:bg-surface-3"
      data-test="stash-item"
      data-snapshot-id={item.id}
      data-snapshot-type={item.recordType}
    >
      <span className="text-[10px] uppercase tracking-widest text-ink-faint w-20 shrink-0">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink truncate">{meta.title}</div>
        {meta.preview && (
          <div className="text-xs text-ink-faint truncate mt-0.5">{meta.preview}</div>
        )}
      </div>
      <span className="text-[10px] text-ink-faint shrink-0">{relativeTime(item.createdAt)}</span>
      {hasRoute ? (
        <button
          onClick={onOpen}
          className="text-xs text-ink-soft hover:text-ink px-1.5 py-0.5 rounded border border-line hover:bg-surface-2 shrink-0"
          data-test="stash-open"
        >
          Open
        </button>
      ) : (
        <>
          <button
            disabled
            className="text-xs text-ink-faint px-1.5 py-0.5 rounded border border-line shrink-0 cursor-not-allowed"
            data-test="stash-open"
          >
            Open
          </button>
          <span className="text-[10px] text-ink-faint italic shrink-0">no route</span>
        </>
      )}
      {canRestore && (
        <button
          onClick={onRestore}
          className="text-xs text-ink-soft hover:text-ink px-1.5 py-0.5 rounded border border-line hover:bg-surface-2 shrink-0"
          data-test="stash-restore"
        >
          Restore
        </button>
      )}
      <InlineConfirmButton
        onConfirm={onDelete}
        label="×"
        confirmLabel="confirm?"
        className="text-xs text-ink-soft hover:text-bad px-1.5 py-0.5 rounded border border-line hover:bg-surface-2 shrink-0"
        data-test="stash-delete"
      />
    </div>
  )
}

function ItemRow({
  item, liveTitle, stale, muted, onOpen, onRemove
}: {
  item: ShelfItem
  liveTitle: string
  stale: boolean
  muted?: boolean
  onOpen: () => void
  onRemove: () => void
}) {
  return (
    <div
      className={`group rounded border border-line px-3 py-2 flex items-center gap-3 ${
        muted ? 'bg-surface-2/40' : 'bg-surface-2 hover:bg-surface-3'
      }`}
      data-test="shelf-item"
      data-shelf-type={item.type}
      data-shelf-ref-id={item.refId}
    >
      <span className="text-[10px] uppercase tracking-widest text-ink-faint w-14 shrink-0">
        {TYPE_LABEL[item.type]}
      </span>
      <button
        onClick={onOpen}
        disabled={stale}
        className={`flex-1 text-left text-sm truncate ${
          stale ? 'text-ink-faint italic line-through cursor-not-allowed' : 'text-ink'
        }`}
        data-test="shelf-open"
        title={stale ? 'Original deleted' : 'Open'}
      >
        {liveTitle || 'Untitled'}
      </button>
      {stale && (
        <span className="text-[10px] text-ink-faint italic shrink-0">deleted</span>
      )}
      <InlineConfirmButton
        onConfirm={onRemove}
        label="remove"
        confirmLabel="confirm?"
        className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  )
}
