import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../../context'
import { jumpToSelection, ROUTE_FOR_TYPE, type JumpableKind } from '../../util/navigate'

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

// Sweep 21 widened the jump surface to include patterns and pipelines (see
// JumpableKind in util/navigate.ts). RecentItems surfaces those kinds alongside
// the original five so docker activity reflects all jumpable work.
type RecentRecord = {
  id: string
  kind: JumpableKind
  title: string
  updatedAt: number
}

export function RecentItems() {
  const ws = useWorkspace()
  const navigate = useNavigate()

  const records: RecentRecord[] = [
    ...ws.documents.filter((r) => r.deletedAt === undefined).map((r) => ({
      id: r.id, kind: 'document' as const, title: r.title, updatedAt: r.updatedAt
    })),
    ...ws.poems.filter((r) => r.deletedAt === undefined).map((r) => ({
      id: r.id, kind: 'poem' as const, title: r.title, updatedAt: r.updatedAt
    })),
    ...ws.longformDocs.filter((r) => r.deletedAt === undefined).map((r) => ({
      id: r.id, kind: 'longform' as const, title: r.title, updatedAt: r.updatedAt
    })),
    ...ws.builds.filter((r) => r.deletedAt === undefined).map((r) => ({
      id: r.id, kind: 'build' as const, title: r.name, updatedAt: r.updatedAt
    })),
    ...ws.patterns.filter((r) => r.deletedAt === undefined).map((r) => ({
      id: r.id, kind: 'pattern' as const, title: r.name, updatedAt: r.updatedAt
    })),
    ...ws.pipelines.filter((r) => r.deletedAt === undefined).map((r) => ({
      id: r.id, kind: 'pipeline' as const, title: r.name, updatedAt: r.updatedAt
    })),
    ...ws.projects.map((r) => ({
      id: r.id, kind: 'project' as const, title: r.name, updatedAt: r.updatedAt
    })),
  ]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 12)

  function handleClick(rec: RecentRecord) {
    jumpToSelection({ kind: rec.kind, id: rec.id })
    navigate(ROUTE_FOR_TYPE[rec.kind])
  }

  if (records.length === 0) {
    return (
      <div
        data-test="recent-items-empty"
        className="h-full flex items-center justify-center text-xs text-ink-faint"
      >
        No recent items.
      </div>
    )
  }

  return (
    <div data-test="recent-items-list" className="overflow-y-auto h-full">
      {records.map((rec) => (
        <button
          key={`${rec.kind}-${rec.id}`}
          data-test="recent-items-row"
          data-record-kind={rec.kind}
          data-record-id={rec.id}
          onClick={() => handleClick(rec)}
          className="w-full flex items-center gap-2 px-3 py-2 border-b border-line hover:bg-surface-3/40 text-left transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-widest text-ink-faint shrink-0">
                {rec.kind}
              </span>
              <span className="text-xs text-ink truncate">{rec.title || 'Untitled'}</span>
            </div>
            <div className="text-[10px] text-ink-faint">{relativeTime(rec.updatedAt)}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
