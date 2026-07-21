import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../context'
import { InlineConfirmButton } from './InlineConfirmButton'

export function TagManager() {
  const ws = useWorkspace()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue]  = useState('')
  const [mergingId, setMergingId] = useState<string | null>(null)
  const inputRef        = useRef<HTMLInputElement>(null)
  const mergePopoverRef = useRef<HTMLDivElement>(null)

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  // Outside-click + Escape to close merge popover
  useEffect(() => {
    if (!mergingId) return
    function onMouseDown(e: MouseEvent) {
      if (mergePopoverRef.current && !mergePopoverRef.current.contains(e.target as Node)) {
        setMergingId(null)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMergingId(null)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [mergingId])

  const tags = [...ws.tags].sort((a, b) => a.name.localeCompare(b.name))

  function usageCount(tagId: string) {
    return ws.tagLinks.filter((tl) => tl.tagId === tagId).length
  }

  function startEdit(id: string, currentName: string) {
    setMergingId(null)
    setEditingId(id)
    setEditValue(currentName)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function commitEdit() {
    if (!editingId) return
    const trimmed = editValue.trim()
    if (trimmed === '') {
      return
    }
    const current = ws.tags.find((t) => t.id === editingId)
    if (current && trimmed !== current.name) {
      await ws.updateTag(editingId, { name: trimmed })
    }
    setEditingId(null)
    setEditValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  function openMerge(id: string) {
    setEditingId(null)
    setEditValue('')
    setMergingId(id)
  }

  async function performMerge(fromId: string, toId: string) {
    if (fromId === toId) return
    const sourceLinks = ws.tagLinks.filter((tl) => tl.tagId === fromId)
    for (const tl of sourceLinks) {
      await ws.tagItem({ tagId: toId, targetId: tl.targetId, targetType: tl.targetType })
    }
    await ws.deleteTag(fromId)
    setMergingId(null)
  }

  return (
    <div data-test="tag-manager">
      <div className="text-xs uppercase tracking-widest text-ink-faint mb-2">Tags</div>

      {tags.length === 0 ? (
        <span
          data-test="tag-manager-empty"
          className="text-xs text-ink-faint italic"
        >
          No tags yet. Tags appear here as soon as you attach one to any record.
        </span>
      ) : (
        <div className="flex flex-col gap-1">
          {tags.map((tag) => {
            const count    = usageCount(tag.id)
            const editing  = editingId === tag.id
            const merging  = mergingId === tag.id
            const otherTags = tags.filter((t) => t.id !== tag.id)

            return (
              <div
                key={tag.id}
                data-test="tag-row"
                data-tag-id={tag.id}
                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-surface-2 group relative"
              >
                {/* Name or edit input */}
                {editing ? (
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-sm text-ink bg-surface-3 border border-line rounded px-2 py-0.5 outline-none focus:border-accent flex-1 min-w-0"
                    data-test="tag-row-edit-input"
                  />
                ) : (
                  <span className="text-sm text-ink flex-1 min-w-0 truncate">
                    {tag.name}
                  </span>
                )}

                {/* Usage count */}
                <span
                  className="text-xs text-ink-faint tabular-nums"
                  data-test="tag-row-usage"
                  data-usage-count={count}
                >
                  ({count})
                </span>

                {/* Rename / Save */}
                <button
                  onClick={editing ? commitEdit : () => startEdit(tag.id, tag.name)}
                  className="text-xs text-ink-soft hover:text-ink px-2 py-0.5 rounded border border-transparent hover:border-line"
                  data-test="tag-row-rename"
                >
                  {editing ? 'Save' : 'Rename'}
                </button>

                {/* Cancel — only during edit */}
                {editing && (
                  <button
                    onClick={cancelEdit}
                    className="text-xs text-ink-soft hover:text-ink px-2 py-0.5 rounded border border-transparent hover:border-line"
                    data-test="tag-row-cancel"
                  >
                    Cancel
                  </button>
                )}

                {/* Merge — hidden during edit */}
                {!editing && (
                  <div ref={merging ? mergePopoverRef : undefined} className="relative">
                    <button
                      onClick={() => openMerge(tag.id)}
                      className="text-xs text-ink-soft hover:text-ink px-2 py-0.5 rounded border border-transparent hover:border-line"
                      data-test="tag-row-merge"
                    >
                      Merge
                    </button>

                    {merging && (
                      <div
                        data-test="tag-row-merge-popover"
                        className="absolute top-full mt-1 right-0 z-10 bg-surface border border-line rounded shadow-md min-w-[180px]"
                      >
                        {otherTags.length === 0 ? (
                          <span
                            data-test="tag-row-merge-empty"
                            className="block text-xs text-ink-faint italic px-3 py-2"
                          >
                            No other tags to merge into.
                          </span>
                        ) : (
                          otherTags.map((other) => (
                            <button
                              key={other.id}
                              onClick={() => performMerge(tag.id, other.id)}
                              className="w-full text-left text-xs px-3 py-2 text-ink-soft hover:text-ink hover:bg-surface-2"
                              data-test="tag-row-merge-target"
                              data-target-tag-id={other.id}
                              data-target-tag-name={other.name}
                            >
                              {other.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Delete */}
                <InlineConfirmButton
                  onConfirm={() => ws.deleteTag(tag.id)}
                  label="Delete"
                  confirmLabel="Confirm?"
                  className="text-xs text-ink-soft hover:text-bad px-2 py-0.5 rounded border border-transparent hover:border-bad"
                  data-test="tag-row-delete"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
