import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../context'
import { InlineConfirmButton } from './InlineConfirmButton'

interface SnapshotsProps {
  recordId:          string
  // Sweep 27: 'note' added to enable Notes snapshots.
  recordType:        'document' | 'poem' | 'longform' | 'build' | 'pipeline' | 'project' | 'note'
  buildSnapshotData: () => string
}

function relativeTime(ts: number): string {
  const diff  = Date.now() - ts
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function Snapshots({ recordId, recordType, buildSnapshotData }: SnapshotsProps): JSX.Element {
  const ws = useWorkspace()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const snapshots = [...ws.snapshots]
    .filter((s) => s.recordId === recordId && s.recordType === recordType)
    .sort((a, b) => b.createdAt - a.createdAt)
  const count = snapshots.length

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function handleTake() {
    const label = new Date().toLocaleString()
    ws.createSnapshot({ recordId, recordType, label, data: buildSnapshotData() })
  }

  function handleRestore(data: string) {
    const parsed = JSON.parse(data)
    if (recordType === 'document')      ws.updateDocument(recordId, parsed)
    else if (recordType === 'poem')     ws.updatePoem(recordId, parsed)
    else if (recordType === 'note')     ws.updateNote(recordId, parsed)  // Sweep 27
    else if (recordType === 'longform') ws.updateLongformDoc(recordId, parsed)
    else if (recordType === 'build')    ws.updateBuild(recordId, parsed)
    else if (recordType === 'pipeline') ws.updatePipeline(recordId, parsed)
    else if (recordType === 'project')  ws.updateProject(recordId, parsed)
  }

  function handleDelete(id: string) {
    ws.deleteSnapshot(id)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface-2 shrink-0"
        data-test="snapshots-button"
        data-record-id={recordId}
        data-record-type={recordType}
        data-snapshot-count={count}
      >
        {count === 0 ? 'Save' : `Saved (${count})`}
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 right-0 z-10 bg-surface border border-line rounded shadow-md min-w-[260px] max-h-[300px] overflow-y-auto"
          data-test="snapshots-menu"
        >
          <button
            onClick={handleTake}
            className="w-full text-xs text-ink-soft hover:text-ink px-3 py-2 border-b border-line hover:bg-surface-2 text-left"
            data-test="snapshot-take"
          >
            Save version
          </button>

          {count === 0 ? (
            <span
              className="block text-xs text-ink-faint italic px-3 py-3"
              data-test="snapshots-empty"
            >
              No snapshots yet.
            </span>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                className="flex items-center gap-2 px-3 py-2 border-b border-line last:border-b-0"
                data-test="snapshot-row"
                data-snapshot-id={snap.id}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-ink truncate">{snap.label}</div>
                  <div className="text-[10px] text-ink-faint">{relativeTime(snap.createdAt)}</div>
                </div>
                <button
                  onClick={() => handleRestore(snap.data)}
                  className="text-xs text-ink-soft hover:text-ink px-1.5 py-0.5 rounded border border-line hover:bg-surface-2 shrink-0"
                  data-test="snapshot-restore"
                >
                  Restore
                </button>
                <InlineConfirmButton
                  onConfirm={() => handleDelete(snap.id)}
                  label="×"
                  confirmLabel="confirm?"
                  className="text-xs text-ink-soft hover:text-bad px-1.5 py-0.5 rounded border border-line hover:bg-surface-2 shrink-0"
                  data-test="snapshot-delete"
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
