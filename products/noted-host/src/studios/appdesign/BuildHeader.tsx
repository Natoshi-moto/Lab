import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../../context'
import type { AppDesignBuild, BuildStatus } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { ShelfButton } from '../../components/ShelfButton'
import { ProjectPicker } from '../../components/ProjectPicker'
import { Snapshots } from '../../components/Snapshots'

const STATUSES: BuildStatus[] = ['drafting', 'in-build', 'shipped', 'abandoned']

export function BuildHeader({
  build, onDelete
}: {
  build: AppDesignBuild
  onDelete: () => void
}) {
  const ws = useWorkspace()
  const [draft, setDraft] = useState({
    name: build.name,
    description: build.description,
    platform: build.platform
  })
  const savedRef = useRef({ name: build.name, description: build.description, platform: build.platform })

  // Sync draft when record is updated externally (e.g. snapshot restore).
  useEffect(() => {
    if (
      build.name !== savedRef.current.name ||
      build.description !== savedRef.current.description ||
      build.platform !== savedRef.current.platform
    ) {
      savedRef.current = { name: build.name, description: build.description, platform: build.platform }
      setDraft({ name: build.name, description: build.description, platform: build.platform })
    }
  }, [build.name, build.description, build.platform])

  const isDirty =
    draft.name !== build.name ||
    draft.description !== build.description ||
    draft.platform !== build.platform
  const signature = draft.name + '\u0000' + draft.description + '\u0000' + draft.platform
  useDebouncedAutosave(signature, isDirty, () => {
    savedRef.current = { name: draft.name, description: draft.description, platform: draft.platform }
    ws.updateBuild(build.id, draft)
  })

  return (
    <div className="border-b border-line px-6 py-4">
      <div className="flex items-start gap-3">
        <input
          className="title-input flex-1 text-xl text-ink font-medium"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Build name"
          data-test="build-name"
          data-build-edit-id={build.id}
        />
        <select
          value={build.status}
          onChange={(e) => ws.updateBuild(build.id, { status: e.target.value as BuildStatus })}
          className="text-xs text-ink-soft bg-surface-2 border border-line rounded px-2 py-1.5 hover:text-ink"
          data-test="build-status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <ProjectPicker
          value={build.projectId}
          onChange={(next) => ws.updateBuild(build.id, { projectId: next })}
        />
        <ShelfButton
          type="build"
          refId={build.id}
          title={draft.name || 'Untitled Build'}
        />
        <Snapshots
          recordId={build.id}
          recordType="build"
          buildSnapshotData={() => JSON.stringify({
            name: draft.name,
            description: draft.description,
            platform: draft.platform
          })}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="Delete build"
          confirmLabel="Confirm?"
          className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1.5 border border-line hover:bg-surface-2"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-widest text-ink-faint">Platform</span>
        <input
          className="title-input flex-1 text-sm text-ink"
          value={draft.platform}
          onChange={(e) => setDraft({ ...draft, platform: e.target.value })}
          placeholder="e.g. Web, iOS, single-file HTML…"
          data-test="build-platform"
        />
      </div>
      <textarea
        className="editor-surface mt-3 w-full text-sm text-ink min-h-[80px]"
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        placeholder="What is this build? What is it for?"
        data-test="build-description"
      />
    </div>
  )
}
