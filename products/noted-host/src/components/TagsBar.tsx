import { useState, useRef } from 'react'
import { useWorkspace } from '../context'
import type { LinkableType } from '../types'

interface TagsBarProps {
  recordId:   string
  recordType: LinkableType
}

export function TagsBar({ recordId, recordType }: TagsBarProps): JSX.Element {
  const ws = useWorkspace()
  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Compute attached tags for this record
  const attachedLinks = ws.tagLinks.filter(
    (tl) => tl.targetId === recordId && tl.targetType === recordType
  )
  const attached = attachedLinks
    .map((tl) => ({ link: tl, tag: ws.tags.find((t) => t.id === tl.tagId) }))
    .filter((x): x is { link: typeof x.link; tag: NonNullable<typeof x.tag> } => !!x.tag)

  // Compute suggestions: matching tags not already attached, sorted, capped at 6
  const q = query.trim().toLowerCase()
  const suggestions = ws.tags
    .filter((t) => {
      if (!q) return false
      if (!t.name.toLowerCase().includes(q)) return false
      return !attachedLinks.some((tl) => tl.tagId === t.id)
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 6)

  // Whether to show "create new" hint
  const hasExactMatch = ws.tags.some((t) => t.name.toLowerCase() === q)
  const showCreateNew = q !== '' && suggestions.length === 0 && !hasExactMatch

  async function attach(tagId: string) {
    await ws.tagItem({ tagId, targetId: recordId, targetType: recordType })
  }

  async function commitQuery() {
    const trimmed = query.trim()
    if (!trimmed) return

    // If active suggestion and we have suggestions, use that
    if (suggestions.length > 0 && activeIdx < suggestions.length) {
      await attach(suggestions[activeIdx].id)
      setQuery('')
      setOpen(false)
      setActiveIdx(0)
      return
    }

    // Check for exact match (case-insensitive) in ALL tags (not just suggestions)
    const exact = ws.tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase())
    if (exact) {
      // Only attach if not already attached
      if (!attachedLinks.some((tl) => tl.tagId === exact.id)) {
        await attach(exact.id)
      }
    } else {
      // Create new tag and attach
      const newTag = await ws.createTag(trimmed)
      await attach(newTag.id)
    }
    setQuery('')
    setOpen(false)
    setActiveIdx(0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitQuery()
    } else if (e.key === ',') {
      e.preventDefault()
      commitQuery()
    } else if (e.key === 'Backspace' && query === '' && attached.length > 0) {
      e.preventDefault()
      // Remove last attached tag by finding the most-recently-created link (highest id lexicographically)
      const sorted = [...attachedLinks].sort((a, b) => b.id.localeCompare(a.id))
      ws.untagItem(sorted[0].id)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(suggestions.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setQuery('')
      setOpen(false)
      setActiveIdx(0)
    }
  }

  function handleFocus() {
    if (query) setOpen(true)
  }

  function handleBlur() {
    setTimeout(() => {
      setOpen(false)
    }, 120)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setActiveIdx(0)
    setOpen(val.trim().length > 0)
  }

  async function handleSuggestionClick(tagId: string) {
    await attach(tagId)
    setQuery('')
    setOpen(false)
    setActiveIdx(0)
    inputRef.current?.focus()
  }

  const showDropdown = open && query.trim() !== '' && (suggestions.length > 0 || showCreateNew)

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 px-6 py-2 border-b border-line bg-surface relative"
      data-test="tags-bar"
      data-record-type={recordType}
      data-record-id={recordId}
    >
      {attached.map(({ link, tag }) => (
        <span
          key={link.id}
          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-3 text-ink-soft inline-flex items-center gap-1"
          data-test="tags-bar-chip"
          data-tag-id={tag.id}
          data-tag-name={tag.name}
        >
          {tag.name}
          <button
            onClick={() => ws.untagItem(link.id)}
            className="text-ink-faint hover:text-bad text-[10px] cursor-pointer"
            data-test="tags-bar-chip-remove"
            aria-label={`Remove tag ${tag.name}`}
          >
            ×
          </button>
        </span>
      ))}

      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="add tag…"
          className="text-xs text-ink bg-transparent border-none outline-none w-32 placeholder:text-ink-faint"
          data-test="tags-bar-input"
        />

        {showDropdown && (
          <div
            className="absolute top-full left-0 mt-1 z-10 bg-surface border border-line rounded shadow-md min-w-[180px] overflow-hidden"
          >
            {showCreateNew ? (
              <span
                className="block w-full text-left text-[10px] text-ink-faint italic px-3 py-1.5"
                data-test="tags-bar-empty"
              >
                (create new)
              </span>
            ) : (
              suggestions.map((tag, i) => (
                <button
                  key={tag.id}
                  onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(tag.id) }}
                  className={`w-full text-left text-xs px-3 py-1.5 ${
                    i === activeIdx
                      ? 'bg-surface-3 text-ink'
                      : 'text-ink-soft hover:text-ink hover:bg-surface-2'
                  }`}
                  data-test="tags-bar-suggestion"
                  data-tag-id={tag.id}
                  data-tag-name={tag.name}
                  data-active={i === activeIdx ? 'true' : 'false'}
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
