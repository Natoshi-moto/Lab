// Sweep 12 — Feature Library studio.
//
// Mirrors WritingStudio's list-aside + detail-pane shape. Patterns are
// soft-deleted (so they appear in Recently Deleted) and have a curated
// type select, a relational TagsBar (Sweep 18, replaces the old chip
// input), and a Markdown export with YAML frontmatter. ShelfRefType
// doesn't include 'pattern' yet, so there is no ShelfButton; the
// SELECT_EVENT listener uses the same `as any` cast trick that
// PromptStudio uses for kind === 'pipeline'.

import { useEffect, useState } from 'react'
import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import type { Pattern } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { downloadText, safeFilename } from '../../util/download'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { ProjectPicker } from '../../components/ProjectPicker'
import { TagsBar } from '../../components/TagsBar'
import { LinksPanel } from '../../components/LinksPanel'
import { RelatedStrip } from '../../components/RelatedStrip'
import { SELECT_EVENT } from '../../util/navigate'

const LAST_KEY = 'verse-studio:library:lastPattern'

// Curated type list. Order matters — this is what the dropdown shows.
const PATTERN_TYPES = [
  'snippet',
  'app-feature',
  'ui-pattern',
  'prompt-block',
  'prompt-pipeline',
  'build-workflow',
  'data-model',
  'export-pattern',
  'testing-checklist',
  'claude-code-prompt',
  'canvas-structure',
  'custom',
] as const

const PATTERN_TYPE_LABELS: Record<string, string> = {
  'snippet':            'Snippet',
  'app-feature':        'App feature',
  'ui-pattern':         'UI pattern',
  'prompt-block':       'Prompt block',
  'prompt-pipeline':    'Prompt pipeline',
  'build-workflow':     'Build workflow',
  'data-model':         'Data model',
  'export-pattern':     'Export pattern',
  'testing-checklist':  'Testing checklist',
  'claude-code-prompt': 'Claude Code prompt',
  'canvas-structure':   'Canvas structure',
  'custom':             'Custom',
}

// ── Markdown export ──────────────────────────────────────────────────────────
// Sweep 18: tagNames are sourced from TagLinks (sorted alphabetically),
// not from the deprecated Pattern.tags chip-string field.

function buildMdExport(p: Pattern, tagNames: string[]): string {
  const lines: string[] = []
  lines.push('---')
  lines.push(`name: ${p.name}`)
  lines.push(`type: ${p.type}`)
  lines.push(`tags: [${tagNames.join(', ')}]`)
  lines.push(`createdAt: ${new Date(p.createdAt).toISOString()}`)
  lines.push(`updatedAt: ${new Date(p.updatedAt).toISOString()}`)
  lines.push('---')
  lines.push('')
  lines.push(`# ${p.name}`)
  lines.push('')
  if (p.description) {
    lines.push(p.description)
    lines.push('')
  }
  lines.push('---')
  lines.push('')
  lines.push(p.body)
  return lines.join('\n')
}

// ── Library ──────────────────────────────────────────────────────────────────

export function Library() {
  const ws = useWorkspace()
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_KEY) } catch { return null }
  })

  // Drop selection if the pattern is missing OR has been soft-deleted.
  useEffect(() => {
    if (!selectedId) return
    const p = ws.patterns.find((p) => p.id === selectedId)
    if (!p || p.deletedAt !== undefined) {
      setSelectedId(null)
    }
  }, [selectedId, ws.patterns])

  // Listen for SELECT_EVENT for kind === 'pattern'.
  // 'pattern' is in LinkableType but not ShelfRefType, so cast to any
  // (same trick as PromptStudio for kind === 'pipeline').
  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<any>).detail
      if (detail?.kind === ('pattern' as any) && detail.id) {
        setSelectedId(detail.id)
      }
    }
    window.addEventListener(SELECT_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_EVENT, onSelect)
  }, [])

  // Persist selection.
  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(LAST_KEY, selectedId)
      else localStorage.removeItem(LAST_KEY)
    } catch {}
  }, [selectedId])

  const patterns = [...ws.patterns]
    .filter((p) => p.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const selected = patterns.find((p) => p.id === selectedId) ?? null

  async function handleNew() {
    const p = await ws.createPattern()
    setSelectedId(p.id)
  }

  async function handleDeleteHeader() {
    if (!selected) return
    const id = selected.id
    setSelectedId(null)
    await ws.softDeletePattern(id)
  }

  async function handleDeleteRow(id: string) {
    if (selectedId === id) setSelectedId(null)
    await ws.softDeletePattern(id)
  }

  return (
    <div className="h-full flex" data-test="route-stub-library">
      {/* Screenreader heading — verify-sweep7 back-compat */}
      <h1 className="sr-only">Feature Library</h1>

      <PatternList
        patterns={patterns}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNew={handleNew}
        onDelete={handleDeleteRow}
      />

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {selected ? (
          <PatternDetail
            key={selected.id}
            pattern={selected}
            onDelete={handleDeleteHeader}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-ink-faint text-sm">
            {patterns.length === 0 ? 'Click + New to start.' : 'Select a pattern.'}
          </div>
        )}
      </div>
    </div>
  )
}

// ── PatternList ──────────────────────────────────────────────────────────────

function PatternList({
  patterns,
  selectedId,
  onSelect,
  onNew,
  onDelete,
}: {
  patterns:   Pattern[]
  selectedId: string | null
  onSelect:   (id: string) => void
  onNew:      () => void
  onDelete:   (id: string) => void
}) {
  return (
    <aside className="w-64 shrink-0 border-r border-line bg-surface-2 flex flex-col">
      <div className="p-3 border-b border-line">
        <button
          onClick={onNew}
          className="w-full px-3 py-1.5 text-sm rounded border border-line hover:bg-surface-3 text-ink"
          data-test="new-pattern"
        >
          + New
        </button>
      </div>

      {patterns.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <p className="text-sm text-ink-faint text-center">No patterns yet.</p>
          <button
            onClick={onNew}
            className="text-sm px-3 py-1.5 rounded border border-line hover:bg-surface-3 text-ink"
          >
            + New
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {patterns.map((p) => (
            <div
              key={p.id}
              className={`group rounded px-2 py-2 cursor-pointer transition-colors ${
                selectedId === p.id ? 'bg-surface-3' : 'hover:bg-surface-3'
              }`}
              onClick={() => onSelect(p.id)}
              data-test="pattern-item"
              data-pattern-id={p.id}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink truncate">
                    {p.name || 'Untitled pattern'}
                  </div>
                  <div className="text-xs text-ink-faint mt-0.5 truncate">
                    {p.type}
                  </div>
                </div>
                <InlineConfirmButton
                  onConfirm={() => onDelete(p.id)}
                  label="del"
                  confirmLabel="confirm?"
                  className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  data-test="pattern-delete-row"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

// ── PatternDetail ────────────────────────────────────────────────────────────

function PatternDetail({
  pattern,
  onDelete,
}: {
  pattern:  Pattern
  onDelete: () => void
}) {
  const ws = useWorkspace()
  const setFocus = useSetFocus()
  const [draft, setDraft] = useState({
    name:        pattern.name,
    description: pattern.description,
    body:        pattern.body,
  })

  // Sweep 23: track activeRecord for Cmd+L.
  useEffect(() => {
    ws.setActiveRecord({ id: pattern.id, type: 'pattern' })
    setFocus({ id: pattern.id, type: 'pattern', origin: 'library' })
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [pattern.id, ws, setFocus])

  const isDirty =
    draft.name !== pattern.name ||
    draft.description !== pattern.description ||
    draft.body !== pattern.body
  const signature = draft.name + '\u0000' + draft.description + '\u0000' + draft.body
  useDebouncedAutosave(signature, isDirty, () => {
    ws.updatePattern(pattern.id, draft)
  })

  function handleExportMd() {
    // Resolve tag names from TagLinks, sorted alphabetically.
    // Pattern.tags is deprecated (empty after Sweep 18 migration).
    const tagNames = ws.tagLinks
      .filter((tl) => tl.targetId === pattern.id && tl.targetType === 'pattern')
      .map((tl) => ws.tags.find((t) => t.id === tl.tagId)?.name ?? '')
      .filter(Boolean)
      .sort()
    // Use the live draft so unsaved edits also export correctly.
    const merged: Pattern = {
      ...pattern,
      name:        draft.name,
      description: draft.description,
      body:        draft.body,
    }
    downloadText(
      safeFilename(merged.name || 'untitled') + '.md',
      buildMdExport(merged, tagNames),
      'text/markdown'
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <header className="border-b border-line px-6 py-3 flex items-center gap-3 shrink-0">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Pattern name"
          className="title-input flex-1 text-lg text-ink"
          data-test="pattern-name"
          data-pattern-id={pattern.id}
        />
        <button
          onClick={handleExportMd}
          className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface shrink-0"
          data-test="pattern-export-md"
        >
          ↓ .md
        </button>
        <ProjectPicker
          value={pattern.projectId}
          onChange={(next) => ws.updatePattern(pattern.id, { projectId: next })}
        />
        {/* No ShelfButton — ShelfRefType doesn't include 'pattern' this sweep */}
        <InlineConfirmButton
          onConfirm={onDelete}
          label="Delete"
          confirmLabel="Confirm?"
          className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface shrink-0"
          data-test="pattern-delete"
        />
      </header>

      {/* Type row */}
      <div className="border-b border-line px-6 py-2 flex items-center gap-3 shrink-0">
        <TypeSelect pattern={pattern} />
      </div>

      {/* Tags row — relational TagsBar (Sweep 18, replaces inline chip input) */}
      <TagsBar recordId={pattern.id} recordType="pattern" />
      <LinksPanel recordId={pattern.id} recordType="pattern" />
      <RelatedStrip recordId={pattern.id} recordType="pattern" />

      {/* Description */}
      <div className="border-b border-line px-6 py-2 shrink-0">
        <input
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          placeholder="Short description…"
          className="title-input text-sm text-ink-soft"
          data-test="pattern-description"
        />
      </div>

      {/* Body */}
      <textarea
        value={draft.body}
        onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        placeholder="Pattern body — markdown, code, prose, whatever's useful…"
        className="editor-surface flex-1 px-8 py-6 text-ink"
        data-test="pattern-body"
      />
    </div>
  )
}

// ── TypeSelect ───────────────────────────────────────────────────────────────

function TypeSelect({ pattern }: { pattern: Pattern }) {
  const ws = useWorkspace()
  const isInList = (PATTERN_TYPES as readonly string[]).includes(pattern.type)

  return (
    <select
      value={pattern.type}
      onChange={(e) => ws.updatePattern(pattern.id, { type: e.target.value })}
      className="text-xs text-ink-soft bg-transparent border border-line rounded px-2 py-1 cursor-pointer shrink-0"
      data-test="pattern-type"
    >
      {/* Foreign type imported from outside the curated list — render as a
          one-off option so the value round-trips without losing data. */}
      {!isInList && (
        <option value={pattern.type}>{pattern.type} (other)</option>
      )}
      {PATTERN_TYPES.map((t) => (
        <option key={t} value={t}>{PATTERN_TYPE_LABELS[t]}</option>
      ))}
    </select>
  )
}

// TagsInput removed in Sweep 18 — Library now uses the shared relational
// TagsBar component (recordType="pattern"). Tag attachments live in TagLinks.
