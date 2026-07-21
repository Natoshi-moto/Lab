import { useWorkspace } from '../../context'
import { InlineConfirmButton } from '../InlineConfirmButton'

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

type DeletedRecord = {
  id: string
  kind: 'document' | 'poem' | 'longform' | 'build' | 'pattern' | 'pipeline' | 'inbox'
  title: string
  deletedAt: number
}

export function RecentlyDeleted() {
  const ws = useWorkspace()

  const records: DeletedRecord[] = [
    ...ws.documents.filter((r) => r.deletedAt !== undefined).map((r) => ({
      id: r.id, kind: 'document' as const, title: r.title, deletedAt: r.deletedAt!
    })),
    ...ws.poems.filter((r) => r.deletedAt !== undefined).map((r) => ({
      id: r.id, kind: 'poem' as const, title: r.title, deletedAt: r.deletedAt!
    })),
    ...ws.longformDocs.filter((r) => r.deletedAt !== undefined).map((r) => ({
      id: r.id, kind: 'longform' as const, title: r.title, deletedAt: r.deletedAt!
    })),
    ...ws.builds.filter((r) => r.deletedAt !== undefined).map((r) => ({
      id: r.id, kind: 'build' as const, title: r.name, deletedAt: r.deletedAt!
    })),
    ...ws.patterns.filter((r) => r.deletedAt !== undefined).map((r) => ({
      id: r.id, kind: 'pattern' as const, title: r.name, deletedAt: r.deletedAt!
    })),
    ...ws.pipelines.filter((r) => r.deletedAt !== undefined).map((r) => ({
      id: r.id, kind: 'pipeline' as const, title: r.name, deletedAt: r.deletedAt!
    })),
    ...ws.inboxItems.filter((r) => r.deletedAt !== undefined).map((r) => ({
      id: r.id, kind: 'inbox' as const, title: r.title, deletedAt: r.deletedAt!
    })),
  ].sort((a, b) => b.deletedAt - a.deletedAt)

  function handleRestore(rec: DeletedRecord) {
    switch (rec.kind) {
      case 'document': return ws.restoreDocument(rec.id)
      case 'poem':     return ws.restorePoem(rec.id)
      case 'longform': return ws.restoreLongformDoc(rec.id)
      case 'build':    return ws.restoreBuild(rec.id)
      case 'pattern':  return ws.restorePattern(rec.id)
      case 'pipeline': return ws.restorePipeline(rec.id)
      case 'inbox':    return ws.restoreInboxItem(rec.id)
    }
  }

  function handlePurge(rec: DeletedRecord) {
    switch (rec.kind) {
      case 'document': return ws.deleteDocument(rec.id)
      case 'poem':     return ws.deletePoem(rec.id)
      case 'longform': return ws.deleteLongformDoc(rec.id)
      case 'build':    return ws.deleteBuild(rec.id)
      case 'pattern':  return ws.deletePattern(rec.id)
      case 'pipeline': return ws.deletePipeline(rec.id)
      case 'inbox':    return ws.deleteInboxItem(rec.id)
    }
  }

  if (records.length === 0) {
    return (
      <div
        data-test="recently-deleted-empty"
        className="h-full flex items-center justify-center text-xs text-ink-faint"
      >
        Nothing in the trash.
      </div>
    )
  }

  return (
    <div data-test="recently-deleted-list" className="overflow-y-auto h-full">
      {records.map((rec) => (
        <div
          key={`${rec.kind}-${rec.id}`}
          data-test="recently-deleted-row"
          data-record-kind={rec.kind}
          data-record-id={rec.id}
          className="flex items-center gap-2 px-3 py-2 border-b border-line hover:bg-surface-3/40"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-widest text-ink-faint shrink-0">
                {rec.kind}
              </span>
              <span className="text-xs text-ink truncate">{rec.title || 'Untitled'}</span>
            </div>
            <div className="text-[10px] text-ink-faint">{relativeTime(rec.deletedAt)}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              data-test="recently-deleted-restore"
              onClick={() => handleRestore(rec)}
              className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-surface-3 text-ink-soft hover:text-ink transition-colors"
            >
              Restore
            </button>
            <InlineConfirmButton
              onConfirm={() => handlePurge(rec)}
              label="purge"
              confirmLabel="confirm?"
              data-test="recently-deleted-purge"
              className="text-[10px] text-ink-faint hover:text-bad px-1"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
