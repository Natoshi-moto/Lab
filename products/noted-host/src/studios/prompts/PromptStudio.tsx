import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useWorkspace } from '../../context'
import { useFocus, useSetFocus } from '../../focus/FocusContext'
import { buildAiBriefExport } from '../../topology/aiBriefExport'
import type { PromptPipeline, PromptBlock, PromptBlockType, Pattern } from '../../types'
import { useDebouncedAutosave } from '../../util/autosave'
import { downloadText, safeFilename } from '../../util/download'
import { InlineConfirmButton } from '../../components/InlineConfirmButton'
import { Snapshots } from '../../components/Snapshots'
import { ProjectPicker } from '../../components/ProjectPicker'
import { TagsBar } from '../../components/TagsBar'
import { LinksPanel } from '../../components/LinksPanel'
import { RelatedStrip } from '../../components/RelatedStrip'
import { SELECT_EVENT } from '../../util/navigate'
import { useRailCollapse } from '../../util/rail'

// ── localStorage keys ───────────────────────────────────────────────────────
const BLOCK_LIBRARY_COLLAPSED_KEY = 'verse-studio:prompts:blockLibrary:collapsed'
const LAST_PIPELINE_KEY = 'verse-studio:prompts:lastPipeline'
const BLOCK_META_KEY    = 'verse-studio:prompts:blockMeta'  // local-only side index


// First-class summonable blocks are Patterns whose `type === 'block'`.
// Anything else still appears in the library when no blocks exist yet.
const BLOCK_TYPE = 'block'
const DEFAULT_PIPELINE_NAME = 'Untitled prompt/pipeline'
const LEGACY_DEFAULT_PIPELINE_NAME = 'Untitled ' + 'pipeline'

function cleanTitle(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function pipelineDisplayName(value: string | null | undefined): string {
  return cleanTitle(value) || DEFAULT_PIPELINE_NAME
}

function isDefaultPipelineName(value: string | null | undefined): boolean {
  const title = cleanTitle(value)
  return !title || title === DEFAULT_PIPELINE_NAME || title === LEGACY_DEFAULT_PIPELINE_NAME
}

// Existing pipelines view still uses the legacy 7-type taxonomy; the
// in-app dropdown now styles its <option> backgrounds explicitly to fix
// the OS-dark inheritance bug.
const BLOCK_TYPES: PromptBlockType[] = [
  'system', 'context', 'task', 'review', 'output', 'constraint', 'custom',
]
const BLOCK_TYPE_LABELS: Record<PromptBlockType, string> = {
  system: 'System', context: 'Context', task: 'Task', review: 'Review',
  output: 'Output', constraint: 'Constraint', custom: 'Custom',
}

// ── utilities ───────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (!q) return 1
  if (t.startsWith(q)) return 1000 - (t.length - q.length)
  let qi = 0
  let score = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      const wordStart = i === 0 || /[\s\-_./]/.test(t[i - 1])
      score += wordStart ? 5 : 1
      qi++
    }
  }
  return qi < q.length ? -1 : score
}

// Indices of chars in `target` that match `query` in order. Returns null
// when no subsequence match exists. Used by the slash menu to underline
// matched chars in result names.
function fuzzyMatchPositions(query: string, target: string): number[] | null {
  if (!query) return []
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  const out: number[] = []
  let qi = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { out.push(i); qi++ }
  }
  return qi < q.length ? null : out
}

// ── Local block metadata (pin / use count / last used) ──────────────────────
//
// Lives in localStorage, keyed by Pattern.id. Side index — never written to
// IDB, never exported. Surviving across reloads is enough; if a user wipes
// browser data they lose pin/use state but the blocks themselves persist.

interface BlockMeta {
  pinned?:   boolean
  useCount?: number
  lastUsed?: number
}

function loadBlockMeta(): Record<string, BlockMeta> {
  try {
    const raw = localStorage.getItem(BLOCK_META_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

function saveBlockMeta(meta: Record<string, BlockMeta>) {
  try { localStorage.setItem(BLOCK_META_KEY, JSON.stringify(meta)) } catch {}
}

// ── Pipeline step model (v2) ────────────────────────────────────────────────
//
// A pipeline step is either a REFERENCE to a saved block (Pattern) with
// optional variable bindings, or a free-text NOTE addressed to the human
// substrate. Steps live in localStorage under
// `verse-studio:prompts:pipelineSteps:<pipelineId>`. Pipeline-level
// variables under `verse-studio:prompts:pipelineVars:<pipelineId>`.
//
// We deliberately stay out of IDB here — the legacy `promptBlocks` store
// and the `PromptBlock` type are untouched. Old data remains queryable
// elsewhere; this view simply doesn't surface it.

interface PipelineStep {
  id:        string
  patternId: string             // empty if `note` is set
  bindings:  Record<string, string>
  note?:     string
  order:     number
}

function pipelineStepsKey(pipelineId: string) {
  return 'verse-studio:prompts:pipelineSteps:' + pipelineId
}
function pipelineVarsKey(pipelineId: string) {
  return 'verse-studio:prompts:pipelineVars:' + pipelineId
}

function loadPipelineSteps(pipelineId: string): PipelineStep[] {
  try {
    const raw = localStorage.getItem(pipelineStepsKey(pipelineId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s): s is PipelineStep =>
        s && typeof s.id === 'string' && typeof s.order === 'number'
      )
      .sort((a, b) => a.order - b.order)
  } catch { return [] }
}
function savePipelineSteps(pipelineId: string, steps: PipelineStep[]) {
  try {
    localStorage.setItem(pipelineStepsKey(pipelineId), JSON.stringify(steps))
  } catch {}
}
function loadPipelineVars(pipelineId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(pipelineVarsKey(pipelineId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}
function savePipelineVars(pipelineId: string, vars: Record<string, string>) {
  try {
    localStorage.setItem(pipelineVarsKey(pipelineId), JSON.stringify(vars))
  } catch {}
}

// Find unique {{var}} names in a text body, preserving first-seen order.
function extractVariables(body: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  body.replace(/\{\{([^}]+)\}\}/g, (_, name: string) => {
    const v = name.trim()
    if (v && !seen.has(v)) { seen.add(v); out.push(v) }
    return ''
  })
  return out
}

// Substitute {{var}} with provided values. Unknown vars are left in place
// (so the human filling the prompt can see what's still missing).
function substituteVars(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{([^}]+)\}\}/g, (match, name: string) => {
    const v = name.trim()
    return vars[v] !== undefined ? vars[v] : match
  })
}

// Walk pipeline steps, fill vars, concatenate. Step bindings override
// pipeline-level vars. Notes render as commented lines.
function materializePipeline(
  pipeline: PromptPipeline,
  steps:    PipelineStep[],
  patterns: Pattern[],
  pipelineVars: Record<string, string>,
): string {
  const ordered = [...steps].sort((a, b) => a.order - b.order)
  const parts: string[] = []
  if (pipeline.name)        parts.push(`# ${pipeline.name}`)
  if (pipeline.description) parts.push(pipeline.description)
  if (parts.length) parts.push('---')
  for (const step of ordered) {
    if (step.note !== undefined) {
      // Render a note as instructional text the human reads — not a prompt.
      parts.push(`>>> ${step.note}`)
      continue
    }
    const pattern = patterns.find((p) => p.id === step.patternId)
    if (!pattern) {
      parts.push(`[missing block: ${step.patternId}]`)
      continue
    }
    const merged = { ...pipelineVars, ...step.bindings }
    const filled = substituteVars(pattern.body, merged)
    parts.push(filled)
  }
  return parts.join('\n\n')
}

const VAR_RE = /\{\{([^}]+)\}\}/g

function findNextVar(text: string, fromPos: number): { start: number; end: number } | null {
  VAR_RE.lastIndex = 0
  const slice = text.slice(fromPos)
  const m = VAR_RE.exec(slice)
  if (!m) return null
  return { start: fromPos + m.index, end: fromPos + m.index + m[0].length }
}

// Caret pixel position via mirrored hidden div. Robust enough for monospace.
function getCaretCoords(ta: HTMLTextAreaElement): { left: number; top: number } | null {
  const div = document.createElement('div')
  const style = window.getComputedStyle(ta)
  const props = [
    'boxSizing', 'width', 'height',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
    'letterSpacing', 'lineHeight', 'textTransform', 'textAlign',
    'whiteSpace', 'wordWrap', 'wordSpacing', 'tabSize',
  ] as const
  props.forEach((p) => { (div.style as any)[p] = (style as any)[p] })
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.overflow = 'hidden'
  div.style.whiteSpace = 'pre-wrap'
  div.style.wordWrap = 'break-word'
  div.style.top = '0'
  div.style.left = '-9999px'

  div.textContent = ta.value.substring(0, ta.selectionStart)
  const span = document.createElement('span')
  span.textContent = ta.value.substring(ta.selectionStart) || '.'
  div.appendChild(span)
  document.body.appendChild(div)

  const rect = ta.getBoundingClientRect()
  const lh = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4
  const left = rect.left - ta.scrollLeft + span.offsetLeft
  const top  = rect.top  - ta.scrollTop  + span.offsetTop + lh

  document.body.removeChild(div)
  if (!isFinite(left) || !isFinite(top)) return null
  return { left, top }
}

// ════════════════════════════════════════════════════════════════════════════
// PromptStudio root
// ════════════════════════════════════════════════════════════════════════════

export function PromptStudio() {
  return (
    <div
      className="flex-1 flex flex-col min-h-0 bg-surface"
      data-test="route-stub-prompts"
    >
      <header className="flex items-center gap-3 px-6 py-2 border-b border-line shrink-0">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          Prompts
        </span>
        <div className="flex-1" />
        <span className="text-[10px] text-ink-faint hidden md:inline">
Prompts · blocks and pipelines for your private knowledge foundry
        </span>
      </header>

      <PipelinesView />
    </div>
  )
}

function HighlightedEditor({
  taRef,
  value,
  onChange,
  onKeyDown,
  onSelect,
  onClick,
  onContextMenu,
  placeholder,
}: {
  taRef:         React.RefObject<HTMLTextAreaElement>
  value:         string
  onChange:      (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown:     (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSelect:      (e: React.SyntheticEvent<HTMLTextAreaElement>) => void
  onClick:       () => void
  onContextMenu: (e: React.MouseEvent<HTMLTextAreaElement>) => void
  placeholder:   string
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Sync scroll on every input/scroll event.
  function syncScroll() {
    const ta = taRef.current
    const ov = overlayRef.current
    if (!ta || !ov) return
    ov.scrollTop = ta.scrollTop
    ov.scrollLeft = ta.scrollLeft
  }
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.addEventListener('scroll', syncScroll)
    return () => ta.removeEventListener('scroll', syncScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taRef])
  // Keep overlay in sync after value updates that change scroll.
  useLayoutEffect(() => { syncScroll() })

  // Build the overlay markup: walk the body, emit text nodes and var spans.
  const overlayChildren = useMemo(() => {
    const parts: Array<{ kind: 'text' | 'var'; text: string }> = []
    let last = 0
    VAR_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = VAR_RE.exec(value)) !== null) {
      if (m.index > last) parts.push({ kind: 'text', text: value.slice(last, m.index) })
      parts.push({ kind: 'var', text: m[0] })
      last = m.index + m[0].length
    }
    if (last < value.length) parts.push({ kind: 'text', text: value.slice(last) })
    // Trailing newline trick: textarea renders an extra blank line after a
    // final "\n" but the div doesn't, causing an off-by-one on bottom scroll.
    // Append a zero-width sentinel so the overlay matches.
    parts.push({ kind: 'text', text: '\u200b' })
    return parts
  }, [value])

  return (
    <div className="flex-1 min-h-0 min-h-[24rem] relative editor-surface" data-test="prompts-editor-wrap">
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="absolute inset-0 px-12 py-8 font-mono text-[13.5px] leading-[1.7] text-ink overflow-hidden whitespace-pre-wrap break-words pointer-events-none"
        data-test="prompts-editor-overlay"
      >
        {overlayChildren.map((p, i) =>
          p.kind === 'var' ? (
            <span
              key={i}
              className="rounded px-0.5 -mx-0.5 text-accent"
              style={{ background: 'rgb(var(--accent) / 0.18)' }}
            >{p.text}</span>
          ) : (
            <span key={i}>{p.text}</span>
          )
        )}
      </div>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => { onChange(e); syncScroll() }}
        onKeyDown={onKeyDown}
        onSelect={onSelect}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="editor-surface flex-1 min-h-[24rem] w-full text-ink resize-none absolute inset-0 px-12 py-8 font-mono text-[13.5px] leading-[1.7] bg-transparent outline-none"
        style={{ color: 'transparent', caretColor: 'rgb(var(--ink))' }}
        data-test="prompt-body"
        data-legacy-test="prompts-editor"
      />
    </div>
  )
}



// Render a string with selected character indices wrapped in an emphasis
// span. Used by the slash menu and library to underline match chars.
function renderWithMatches(text: string, positions: number[]) {
  if (!positions.length) return text
  const set = new Set(positions)
  const out: React.ReactNode[] = []
  let buf = ''
  for (let i = 0; i < text.length; i++) {
    if (set.has(i)) {
      if (buf) { out.push(buf); buf = '' }
      out.push(<u key={i} className="text-accent decoration-accent">{text[i]}</u>)
    } else {
      buf += text[i]
    }
  }
  if (buf) out.push(buf)
  return <>{out}</>
}

function SlashPopover({
  wrapperRef,
  anchor,
  query,
  results,
  selected,
  onPick,
  onHover,
  onClose,
}: {
  wrapperRef: React.RefObject<HTMLDivElement>
  anchor:    { left: number; top: number }
  query:     string
  results:   Pattern[]
  selected:  number
  onPick:    (p: Pattern) => void
  onHover:   (i: number) => void
  onClose:   () => void
}) {
  const popRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number; top: number }>(anchor)

  useLayoutEffect(() => {
    const wrap = wrapperRef.current
    const pop  = popRef.current
    if (!wrap || !pop) { setPosition(anchor); return }
    const wrapRect = wrap.getBoundingClientRect()
    const popRect  = pop.getBoundingClientRect()
    let left = anchor.left
    let top  = anchor.top + 4
    if (left + popRect.width > wrapRect.right - 8) {
      left = wrapRect.right - popRect.width - 8
    }
    if (top + popRect.height > wrapRect.bottom - 8) {
      top = anchor.top - popRect.height - 18
    }
    if (left < wrapRect.left + 8) left = wrapRect.left + 8
    setPosition({ left, top })
  }, [anchor, results.length, wrapperRef])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!popRef.current) return
      if (popRef.current.contains(e.target as Node)) return
      const t = e.target as HTMLElement
      if (t && t.tagName === 'TEXTAREA') return
      onClose()
    }
    window.addEventListener('mousedown', onDoc)
    return () => window.removeEventListener('mousedown', onDoc)
  }, [onClose])

  return (
    <div
      ref={popRef}
      style={{ position: 'fixed', left: position.left, top: position.top, zIndex: 50 }}
      className="w-[300px] rounded border border-line bg-surface-2 shadow-lg overflow-hidden"
      data-test="prompts-slash"
    >
      <div className="px-3 py-1.5 border-b border-line flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">Summon</span>
        <span className="text-xs text-ink font-mono">/{query}</span>
        <span className="flex-1" />
        <span className="text-[10px] text-ink-faint">↑↓ ↵ esc</span>
      </div>
      {results.length === 0 ? (
        <div className="px-3 py-3 text-xs text-ink-faint italic">
          {query ? 'No matching blocks.' : 'No blocks saved yet — write one and Cmd/Ctrl+S to save.'}
        </div>
      ) : (
        <ul className="max-h-72 overflow-y-auto py-1" data-test="prompts-slash-list">
          {results.map((p, i) => {
            const preview = p.body.slice(0, 80).replace(/\n/g, ' ⏎ ')
            const hasVars = VAR_RE.test(p.body)
            VAR_RE.lastIndex = 0
            const matchPositions = fuzzyMatchPositions(query, p.name) ?? []
            return (
              <li
                key={p.id}
                onMouseDown={(e) => { e.preventDefault(); onPick(p) }}
                onMouseEnter={() => onHover(i)}
                className={`px-3 py-1.5 cursor-pointer ${
                  i === selected ? 'bg-surface-3' : 'hover:bg-surface-3'
                }`}
                data-test="prompts-slash-item"
                data-pattern-id={p.id}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-ink truncate">
                    {p.name
                      ? renderWithMatches(p.name, matchPositions)
                      : <span className="italic text-ink-faint">Untitled</span>}
                  </span>
                  {hasVars && (
                    <span className="text-[9px] uppercase tracking-wider text-accent shrink-0">
                      vars
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-ink-faint truncate">{preview}</div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// BlockLibrary — right rail
// ════════════════════════════════════════════════════════════════════════════

function BlockLibrary({
  blocks,
  allPatterns,
  blockMeta,
  links,
  onTogglePin,
  onInsert,
  onEdit,
  onOpenPlayground,
  onStartLink,
  linking,
  onClose,
}: {
  blocks:           Pattern[]
  allPatterns:      Pattern[]
  blockMeta:        Record<string, BlockMeta>
  links:            { id: string; sourceId: string; targetId: string; sourceType: string; targetType: string }[]
  onTogglePin:      (id: string) => void
  onInsert:         (p: Pattern) => void
  onEdit:           (id: string) => void
  onOpenPlayground: (id: string) => void
  onStartLink:      (sourceId: string, fromX: number, fromY: number) => void
  linking:          { sourceId: string } | null
  onClose:          () => void
}) {
  const ws = useWorkspace()
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [copyFlash, setCopyFlash] = useState<{ id: string; label: 'copied' | 'failed' } | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)

  useEffect(() => {
    if (!copyFlash) return
    const t = window.setTimeout(() => setCopyFlash(null), 1500)
    return () => window.clearTimeout(t)
  }, [copyFlash])
  useEffect(() => {
    if (!flashId) return
    const t = window.setTimeout(() => setFlashId(null), 900)
    return () => window.clearTimeout(t)
  }, [flashId])

  async function copyCardBody(e: React.MouseEvent, p: Pattern) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(p.body)
      setCopyFlash({ id: p.id, label: 'copied' })
    } catch {
      setCopyFlash({ id: p.id, label: 'failed' })
    }
  }

  // Map of patternId → count of links that touch it.
  const linkCounts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const l of links) {
      if (l.sourceType === 'pattern') out[l.sourceId] = (out[l.sourceId] ?? 0) + 1
      if (l.targetType === 'pattern') out[l.targetId] = (out[l.targetId] ?? 0) + 1
    }
    return out
  }, [links])

  const source = showAll ? allPatterns : blocks

  // Group: pinned first, others by use-count then lastUsed then updatedAt.
  // When the user is searching, pinning ordering is suppressed and pure
  // fuzzy score takes over (matches what people expect from typeahead).
  const { pinned, others, searching } = useMemo(() => {
    const q = query.trim()
    if (q) {
      const ranked = source
        .map((p) => ({ p, score: fuzzyScore(q, p.name) }))
        .filter((x) => x.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p)
      return { pinned: [] as Pattern[], others: ranked, searching: true }
    }
    const pin: Pattern[] = []
    const oth: Pattern[] = []
    for (const p of source) {
      const m = blockMeta[p.id]
      if (m?.pinned) pin.push(p); else oth.push(p)
    }
    const sortByMeta = (a: Pattern, b: Pattern) => {
      const ma = blockMeta[a.id] ?? {}
      const mb = blockMeta[b.id] ?? {}
      const uc = (mb.useCount ?? 0) - (ma.useCount ?? 0)
      if (uc !== 0) return uc
      const lu = (mb.lastUsed ?? 0) - (ma.lastUsed ?? 0)
      if (lu !== 0) return lu
      return b.updatedAt - a.updatedAt
    }
    pin.sort(sortByMeta)
    oth.sort(sortByMeta)
    return { pinned: pin, others: oth, searching: false }
  }, [source, query, blockMeta])

  async function createEmptyBlock() {
    const name = window.prompt('New block — name?', '')
    if (name === null) return
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      const created = await ws.createPattern({
        name: trimmed,
        body: '',
        type: BLOCK_TYPE,
      })
      onEdit(created.id)
    } catch (error) {
      console.error('Failed to create block', error)
      window.alert('Block could not be created. See developer console for details.')
    }
  }

  function renderCard(p: Pattern) {
    const preview = p.body.slice(0, 90).replace(/\n/g, ' ⏎ ')
    const hasVars = VAR_RE.test(p.body)
    VAR_RE.lastIndex = 0
    const meta = blockMeta[p.id] ?? {}
    const matchPositions = searching ? (fuzzyMatchPositions(query, p.name) ?? []) : []
    const useCount = meta.useCount ?? 0
    const linkCount = linkCounts[p.id] ?? 0
    const isLinkSource = linking?.sourceId === p.id
    const isLinkable   = !!linking && linking.sourceId !== p.id

    function onCardMouseDown(e: React.MouseEvent) {
      // Right-click + drag = start a linking gesture from this card.
      if (e.button === 2) {
        e.preventDefault()
        e.stopPropagation()
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        onStartLink(p.id, rect.right - 12, rect.top + rect.height / 2)
      }
    }

    return (
      <div
        key={p.id}
        className={`group bg-surface border rounded px-2 py-1.5 cursor-pointer transition-all ${
          flashId === p.id
            ? 'border-accent bg-accent/10 scale-[0.99]'
            : isLinkSource    ? 'border-accent ring-1 ring-accent'
            : isLinkable      ? 'border-accent/50 hover:border-accent'
            :                   'border-line hover:border-accent'
        }`}
        onClick={() => {
          if (!linking) {
            onInsert(p)
            setFlashId(p.id)
          }
        }}
        onDoubleClick={() => onEdit(p.id)}
        onMouseDown={onCardMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        draggable={!linking}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', p.body)
          e.dataTransfer.effectAllowed = 'copy'
        }}
        data-test="prompts-library-card"
        data-pattern-id={p.id}
        data-link-target={p.id}
        title="Click to summon · Right-click+drag to link · Double-click to edit"
      >
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm text-ink truncate">
            {p.name
              ? (matchPositions.length
                  ? renderWithMatches(p.name, matchPositions)
                  : p.name)
              : <span className="italic text-ink-faint">Untitled</span>}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {hasVars && (
              <span className="text-[9px] uppercase tracking-wider text-accent">
                vars
              </span>
            )}
            {useCount > 0 && (
              <span
                className="text-[9px] text-ink-faint"
                title={`Used ${useCount} ${useCount === 1 ? 'time' : 'times'}`}
                data-test="prompts-library-usecount"
              >×{useCount}</span>
            )}
            {linkCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenPlayground(p.id) }}
                className="text-[10px] text-accent hover:underline"
                title={`${linkCount} ${linkCount === 1 ? 'link' : 'links'} — open playground`}
                data-test="prompts-library-linkcount"
              >↔{linkCount}</button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(p.id) }}
              className={`text-[11px] px-1 transition-opacity ${
                meta.pinned
                  ? 'text-accent opacity-100'
                  : 'text-ink-faint hover:text-ink opacity-0 group-hover:opacity-100'
              }`}
              data-test="prompts-library-pin"
              title={meta.pinned ? 'Unpin' : 'Pin'}
            >{meta.pinned ? '★' : '☆'}</button>
            <button
              onClick={(e) => copyCardBody(e, p)}
              className={`text-[10px] text-ink-faint hover:text-ink px-1 transition-opacity ${
                copyFlash?.id === p.id ? 'opacity-100 text-accent' : 'opacity-0 group-hover:opacity-100'
              }`}
              data-test="prompts-library-card-copy"
              title="Copy block body"
            >{copyFlash?.id === p.id ? copyFlash.label : 'copy'}</button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenPlayground(p.id) }}
              className="text-[10px] text-ink-faint hover:text-ink px-1 opacity-0 group-hover:opacity-100 transition-opacity"
              data-test="prompts-library-playground"
              title="Open playground"
            >▦</button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(p.id) }}
              className="text-[10px] text-ink-faint hover:text-ink px-1 opacity-0 group-hover:opacity-100 transition-opacity"
              data-test="prompts-library-edit"
              title="Edit"
            >edit</button>
          </div>
        </div>
        <div className="text-[11px] text-ink-faint truncate mt-0.5">
          {preview || <span className="italic">empty</span>}
        </div>
      </div>
    )
  }

  const isEmpty = pinned.length === 0 && others.length === 0

  return (
    <div className="w-72 shrink-0 flex" data-test="prompts-block-library">
      <aside
        className="w-full border-l border-line bg-surface-2 flex flex-col"
        data-test="prompts-library"
      >
      <div className="p-2 border-b border-line flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint pl-1">
          Blocks
        </span>
        <span className="text-[10px] text-ink-faint">({blocks.length})</span>
        <span className="flex-1" />
        <button
          onClick={createEmptyBlock}
          className="text-xs text-ink-soft hover:text-ink rounded px-2 py-0.5 border border-line hover:bg-surface"
          data-test="prompts-library-new"
          title="New block"
        >+</button>
        <span className="sr-only" data-test="prompts-library-close" />
        <button
          onClick={onClose}
          className="text-xs text-ink-faint hover:text-ink px-1.5 py-0.5"
          data-test="prompts-block-library-collapse"
          title="Collapse block library"
          aria-label="Collapse block library"
        ><span className="sr-only" data-test="prompts-library-toggle" />‹</button>
      </div>
      <div className="p-2 border-b border-line space-y-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="title-input w-full text-xs text-ink"
          data-test="prompts-library-search"
        />
        <label className="flex items-center gap-1.5 text-[10px] text-ink-faint">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            data-test="prompts-library-show-all"
          />
          Show all patterns
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1" data-test="prompts-library-list">
        {isEmpty ? (
          <div className="text-[11px] text-ink-faint italic px-2 py-3">
            {blocks.length === 0 && !showAll
              ? 'No blocks yet. Highlight text and Cmd/Ctrl+S, or hit + to start one.'
              : 'No matches.'}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <div
                  className="text-[9px] uppercase tracking-[0.18em] text-ink-faint px-1 pt-1 pb-0.5"
                  data-test="prompts-library-pinned-header"
                >Pinned</div>
                {pinned.map(renderCard)}
                {others.length > 0 && (
                  <div className="border-t border-line my-2" />
                )}
              </>
            )}
            {others.map(renderCard)}
          </>
        )}
      </div>
      </aside>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PlaygroundDrawer — a per-block mini-canvas
// ════════════════════════════════════════════════════════════════════════════
//
// Each block is a node. The focused block sits at the canvas center; the
// blocks linked to it orbit around. Edges drawn between linked pairs.
// Right-click + drag a node to start the same linking gesture used in the
// rail; click a neighbor to refocus the playground on it. Per-focus
// positions persist in localStorage (key: `verse-studio:prompts:pgPos:<focusId>`)
// so layouts you arrange survive reloads.

interface PgPos { x: number; y: number }
type PgPosMap = Record<string, PgPos>

function loadPlaygroundPositions(focusId: string): PgPosMap {
  try {
    const raw = localStorage.getItem('verse-studio:prompts:pgPos:' + focusId)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}
function savePlaygroundPositions(focusId: string, map: PgPosMap) {
  try {
    localStorage.setItem('verse-studio:prompts:pgPos:' + focusId, JSON.stringify(map))
  } catch {}
}

function PlaygroundDrawer({
  block,
  allPatterns,
  links,
  linking,
  onStartLink,
  onFocusBlock,
  onInsert,
  onClose,
}: {
  block:        Pattern
  allPatterns:  Pattern[]
  links:        { id: string; sourceId: string; targetId: string; sourceType: string; targetType: string }[]
  linking:      { sourceId: string } | null
  onStartLink:  (sourceId: string, fromX: number, fromY: number) => void
  onFocusBlock: (id: string) => void
  onInsert:     (p: Pattern) => void
  onClose:      () => void
}) {
  // Find every pattern linked to this block (either direction).
  const neighborIds = useMemo(() => {
    const set = new Set<string>()
    for (const l of links) {
      if (l.sourceType !== 'pattern' || l.targetType !== 'pattern') continue
      if (l.sourceId === block.id) set.add(l.targetId)
      if (l.targetId === block.id) set.add(l.sourceId)
    }
    return Array.from(set)
  }, [links, block.id])

  const neighbors = useMemo(
    () =>
      neighborIds
        .map((id) => allPatterns.find((p) => p.id === id))
        .filter((p): p is Pattern => !!p && p.deletedAt === undefined),
    [neighborIds, allPatterns]
  )

  // Canvas size — fixed ratio relative to the drawer width.
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 460, h: 480 })

  useLayoutEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const r = c.getBoundingClientRect()
    setCanvasSize({ w: r.width, h: r.height })
  }, [])

  // Positions — loaded fresh per focus block. Auto-laid in a circle when
  // a neighbor has no saved position yet.
  const [positions, setPositions] = useState<PgPosMap>(() => loadPlaygroundPositions(block.id))
  useEffect(() => {
    setPositions(loadPlaygroundPositions(block.id))
  }, [block.id])
  useEffect(() => {
    savePlaygroundPositions(block.id, positions)
  }, [block.id, positions])

  const cx = canvasSize.w / 2
  const cy = canvasSize.h / 2

  // Compute any missing positions in a circle around center.
  useEffect(() => {
    setPositions((prev) => {
      const out = { ...prev }
      let changed = false
      // Focus block always at center.
      if (!out[block.id] || out[block.id].x !== cx || out[block.id].y !== cy) {
        out[block.id] = { x: cx, y: cy }
        changed = true
      }
      const radius = Math.min(canvasSize.w, canvasSize.h) / 2 - 70
      neighbors.forEach((n, i) => {
        if (!out[n.id]) {
          const angle = (i / Math.max(1, neighbors.length)) * Math.PI * 2 - Math.PI / 2
          out[n.id] = {
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
          }
          changed = true
        }
      })
      return changed ? out : prev
    })
  }, [block.id, neighbors, cx, cy, canvasSize.w, canvasSize.h])

  // Drag-to-reposition (left-click + drag on a node body).
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)
  function onNodeMouseDown(e: React.MouseEvent, id: string) {
    if (e.button === 2) {
      // Right-click + drag = start a linking gesture from this node.
      e.preventDefault()
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onStartLink(id, rect.left + rect.width / 2, rect.top + rect.height / 2)
      return
    }
    if (e.button !== 0) return
    e.stopPropagation()
    const c = canvasRef.current
    if (!c) return
    const cRect = c.getBoundingClientRect()
    const pos = positions[id]
    dragRef.current = {
      id,
      offsetX: e.clientX - cRect.left - (pos?.x ?? cx),
      offsetY: e.clientY - cRect.top  - (pos?.y ?? cy),
    }
    function onMove(ev: MouseEvent) {
      const cur = dragRef.current
      if (!cur || !c) return
      const cR = c.getBoundingClientRect()
      const x = ev.clientX - cR.left - cur.offsetX
      const y = ev.clientY - cR.top  - cur.offsetY
      setPositions((p) => ({ ...p, [cur.id]: { x, y } }))
    }
    function onUp() {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Esc closes (same shape as other slide-overs).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't close while a linking gesture is using Escape to abort.
      if (e.key === 'Escape' && !linking) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, linking])

  function renderNode(p: Pattern, isFocus: boolean) {
    const pos = positions[p.id] ?? { x: cx, y: cy }
    const isLinkable = !!linking && linking.sourceId !== p.id
    const isLinkSource = linking?.sourceId === p.id
    return (
      <div
        key={p.id}
        className={`absolute select-none rounded px-2 py-1 text-xs cursor-pointer transition-colors ${
          isFocus
            ? 'bg-accent/15 text-ink border border-accent shadow-sm'
            : 'bg-surface text-ink border ' + (
              isLinkSource ? 'border-accent ring-1 ring-accent' :
              isLinkable   ? 'border-accent/60'                  :
                             'border-line hover:border-accent'
            )
        }`}
        style={{
          left: pos.x, top: pos.y,
          transform: 'translate(-50%, -50%)',
          maxWidth: 140,
          zIndex: isFocus ? 5 : 4,
        }}
        onMouseDown={(e) => onNodeMouseDown(e, p.id)}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation()
          if (linking) return
          if (!isFocus) onFocusBlock(p.id)
        }}
        onDoubleClick={(e) => { e.stopPropagation(); onInsert(p) }}
        data-test="prompts-pg-node"
        data-pattern-id={p.id}
        data-link-target={p.id}
        title={
          isFocus
            ? p.name
            : 'Click to focus · Double-click to summon · Right-click+drag to link'
        }
      >
        <span className="truncate block">
          {p.name || <span className="italic text-ink-faint">Untitled</span>}
        </span>
      </div>
    )
  }

  // Edges: draw between any pair of patterns whose link is in `links` and
  // both ends are present on the playground (focus + neighbors).
  const visibleIds = new Set([block.id, ...neighborIds])
  const edges = links.filter(
    (l) =>
      l.sourceType === 'pattern' && l.targetType === 'pattern' &&
      visibleIds.has(l.sourceId) && visibleIds.has(l.targetId)
  )

  return (
    <aside
      className="w-[480px] shrink-0 border-l border-line bg-surface-2 flex flex-col"
      data-test="prompts-playground"
      data-pattern-id={block.id}
    >
      <header className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          Playground
        </span>
        <span className="text-sm text-ink truncate">{block.name || 'Untitled'}</span>
        <span className="flex-1" />
        <span className="text-[10px] text-ink-faint">
          {neighbors.length} {neighbors.length === 1 ? 'link' : 'links'}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-ink-faint hover:text-ink px-2 py-0.5"
          data-test="prompts-playground-close"
          title="Close"
        >×</button>
      </header>

      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-surface"
        onContextMenu={(e) => e.preventDefault()}
        data-test="prompts-playground-canvas"
      >
        {/* Edges */}
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
          {edges.map((l) => {
            const a = positions[l.sourceId]
            const b = positions[l.targetId]
            if (!a || !b) return null
            return (
              <line
                key={l.id}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="rgb(var(--accent))"
                strokeOpacity="0.5"
                strokeWidth="1.5"
                data-test="prompts-pg-edge"
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {renderNode(block, true)}
        {neighbors.map((n) => renderNode(n, false))}

        {/* Empty-state hint */}
        {neighbors.length === 0 && (
          <div
            className="absolute left-1/2 -translate-x-1/2 text-[10px] text-ink-faint italic"
            style={{ top: cy + 30 }}
          >
            Right-click+drag from this block to a card in the rail to link.
          </div>
        )}
      </div>

      <footer className="border-t border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        Drag to arrange · Right-click+drag to link · Click to refocus
      </footer>
    </aside>
  )
}
// ════════════════════════════════════════════════════════════════════════════
// BlockEditDrawer — slide-over for inline block editing
// ════════════════════════════════════════════════════════════════════════════

function BlockEditDrawer({
  block,
  onClose,
}: {
  block:   Pattern
  onClose: () => void
}) {
  const ws = useWorkspace()
  const [draft, setDraft] = useState({ name: block.name, body: block.body, type: block.type })
  const savedRef = useRef({ name: block.name, body: block.body, type: block.type })

  useEffect(() => {
    if (
      block.name !== savedRef.current.name ||
      block.body !== savedRef.current.body ||
      block.type !== savedRef.current.type
    ) {
      savedRef.current = { name: block.name, body: block.body, type: block.type }
      setDraft(savedRef.current)
    }
  }, [block.name, block.body, block.type])

  const isDirty =
    draft.name !== block.name ||
    draft.body !== block.body ||
    draft.type !== block.type
  const signature = draft.name + '\u0000' + draft.body + '\u0000' + draft.type

  useDebouncedAutosave(signature, isDirty, () => {
    savedRef.current = { ...draft }
    ws.updatePattern(block.id, {
      name: draft.name,
      body: draft.body,
      type: draft.type,
    })
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const variableCount = (draft.body.match(VAR_RE) || []).length

  return (
    <aside
      className="w-96 shrink-0 border-l border-line bg-surface-2 flex flex-col"
      data-test="prompts-block-drawer"
    >
      <header className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          Edit block
        </span>
        <span className="flex-1" />
        <InlineConfirmButton
          onConfirm={async () => {
            await ws.softDeletePattern(block.id)
            onClose()
          }}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded"
          data-test="prompts-block-delete"
        />
        <button
          onClick={onClose}
          className="text-xs text-ink-faint hover:text-ink px-2 py-0.5"
          data-test="prompts-block-close"
          title="Close"
        >×</button>
      </header>

      <div className="px-3 py-2 border-b border-line space-y-2">
        <input
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Block name"
          className="title-input w-full text-sm text-ink"
          data-test="prompts-block-name"
        />
        <input
          value={draft.type}
          readOnly
          aria-readonly="true"
          title="Internal block type is locked to keep this record in the Blocks rail."
          placeholder="Block type"
          className="title-input w-full text-[11px] text-ink-faint cursor-not-allowed"
          data-test="prompts-block-type"
        />
        <div className="text-[10px] text-ink-faint italic">
          Internal type is locked as <code>block</code> so the record stays summonable.
        </div>
      </div>

      <div className="flex-1 min-h-0 relative editor-surface">
        <textarea
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          placeholder="Block body. Use {{placeholders}} for fields you'll fill on summon."
          spellCheck={false}
          className="absolute inset-0 w-full h-full resize-none px-4 py-3 font-mono text-[12.5px] leading-[1.65] text-ink bg-transparent outline-none"
          data-test="prompts-block-body"
        />
      </div>

      <footer className="border-t border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint flex items-center gap-3">
        <span>{draft.body.length} chars</span>
        {variableCount > 0 && (
          <span className="text-accent normal-case tracking-normal">
            {variableCount} {variableCount === 1 ? 'variable' : 'variables'}
          </span>
        )}
        <span className="flex-1" />
        {isDirty ? <span>saving…</span> : <span>saved</span>}
      </footer>

      <div className="border-t border-line">
        <TagsBar recordId={block.id} recordType="pattern" />
      </div>
    </aside>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PIPELINES VIEW — kept for power users, with the dropdown bg bug fixed
// ════════════════════════════════════════════════════════════════════════════

function PipelinesView() {
  const ws = useWorkspace()
  const setFocus = useSetFocus()
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try { return localStorage.getItem(LAST_PIPELINE_KEY) } catch { return null }
  })

  useEffect(() => {
    if (!selectedId) return
    const p = ws.pipelines.find((p) => p.id === selectedId)
    if (!p || p.deletedAt !== undefined) setSelectedId(null)
  }, [selectedId, ws.pipelines])

  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<any>).detail
      if (detail?.kind === ('pipeline' as any) && detail.id) setSelectedId(detail.id)
    }
    window.addEventListener(SELECT_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_EVENT, onSelect)
  }, [])

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(LAST_PIPELINE_KEY, selectedId)
      else            localStorage.removeItem(LAST_PIPELINE_KEY)
    } catch {}
  }, [selectedId])

  const pipelines = ws.pipelines
    .filter((p) => p.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const pipeline = pipelines.find((p) => p.id === selectedId) ?? null
  const pipelineBlocks = pipeline
    ? ws.blocks.filter((b) => b.pipelineId === pipeline.id)
    : []

  const allPatterns = useMemo(
    () => ws.patterns.filter((p) => p.deletedAt === undefined),
    [ws.patterns]
  )
  const libraryBlocks = useMemo(
    () =>
      allPatterns
        .filter((p) => p.type === BLOCK_TYPE)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [allPatterns]
  )

  const blockLibraryRail = useRailCollapse(BLOCK_LIBRARY_COLLAPSED_KEY)
  const [blockMeta, setBlockMeta] = useState<Record<string, BlockMeta>>(() => loadBlockMeta())
  useEffect(() => { saveBlockMeta(blockMeta) }, [blockMeta])

  function togglePin(id: string) {
    setBlockMeta((m) => {
      const cur = m[id] ?? {}
      return { ...m, [id]: { ...cur, pinned: !cur.pinned } }
    })
  }
  function trackSummon(id: string) {
    setBlockMeta((m) => {
      const cur = m[id] ?? {}
      return {
        ...m,
        [id]: {
          ...cur,
          useCount: (cur.useCount ?? 0) + 1,
          lastUsed: Date.now(),
        },
      }
    })
  }

  const [libraryFlash, setLibraryFlash] = useState<string | null>(null)
  useEffect(() => {
    if (!libraryFlash) return
    const t = window.setTimeout(() => setLibraryFlash(null), 1500)
    return () => window.clearTimeout(t)
  }, [libraryFlash])

  const [libraryInsertRequest, setLibraryInsertRequest] = useState<{ patternId: string; nonce: number } | null>(null)
  function insertLibraryBlock(p: Pattern) {
    trackSummon(p.id)
    if (!pipeline) {
      setLibraryFlash('select a prompt first')
      return
    }
    setLibraryInsertRequest({ patternId: p.id, nonce: Date.now() })
    setLibraryFlash(`added ${p.name || 'untitled'}`)
  }

  async function handleNew() {
    const created = await ws.createPipeline()
    setSelectedId(created.id)
  }
  async function handleDelete() {
    if (!pipeline) return
    const id = pipeline.id
    setSelectedId(null)
    await ws.softDeletePipeline(id)
  }

  // Block edit drawer / playground state shared by the block library rail.
  const [editBlockId, setEditBlockId] = useState<string | null>(null)
  const editBlock = editBlockId ? allPatterns.find((p) => p.id === editBlockId) : null
  useEffect(() => {
    if (editBlockId && !editBlock) setEditBlockId(null)
  }, [editBlockId, editBlock])
  useEffect(() => {
    if (!editBlock) return
    ws.setActiveRecord({ id: editBlock.id, type: 'pattern' })
    setFocus({ id: editBlock.id, type: 'pattern', origin: 'prompts' })
  }, [editBlock?.id, ws, setFocus])

  const [playgroundId, setPlaygroundId] = useState<string | null>(null)
  const playgroundBlock = playgroundId ? allPatterns.find((p) => p.id === playgroundId) : null
  useEffect(() => {
    if (playgroundId && !playgroundBlock) setPlaygroundId(null)
  }, [playgroundId, playgroundBlock])
  useEffect(() => {
    if (!playgroundBlock) return
    ws.setActiveRecord({ id: playgroundBlock.id, type: 'pattern' })
    setFocus({ id: playgroundBlock.id, type: 'pattern', origin: 'prompts' })
  }, [playgroundBlock?.id, ws, setFocus])

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ patternId?: string }>).detail
      if (detail?.patternId) setPlaygroundId(detail.patternId)
    }
    window.addEventListener('verse:open-pattern-playground', onOpen as EventListener)
    return () => window.removeEventListener('verse:open-pattern-playground', onOpen as EventListener)
  }, [])

  const [linking, setLinking] = useState<{
    sourceId: string
    fromX:    number
    fromY:    number
    toX:      number
    toY:      number
  } | null>(null)
  const linkingRef = useRef(linking)
  linkingRef.current = linking

  useEffect(() => {
    if (!linking) return
    function onMove(e: MouseEvent) {
      const cur = linkingRef.current
      if (!cur) return
      setLinking({ ...cur, toX: e.clientX, toY: e.clientY })
    }
    function findTargetId(e: MouseEvent): string | null {
      const els = document.elementsFromPoint(e.clientX, e.clientY)
      for (const el of els) {
        const id = (el as HTMLElement).getAttribute?.('data-link-target')
        if (id) return id
      }
      return null
    }
    function onUp(e: MouseEvent) {
      const cur = linkingRef.current
      if (!cur) return
      const targetId = findTargetId(e)
      if (targetId && targetId !== cur.sourceId) {
        ws.createLink({
          sourceId: cur.sourceId, sourceType: 'pattern',
          targetId,                targetType: 'pattern',
        }).then(() => setLibraryFlash('linked'))
      }
      setLinking(null)
    }
    function onCtx(e: MouseEvent) { e.preventDefault() }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLinking(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('contextmenu', onCtx, true)
    window.addEventListener('keydown',   onKey)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('contextmenu', onCtx, true)
      window.removeEventListener('keydown',   onKey)
    }
  }, [linking, ws])

  function startLinking(sourceId: string, fromX: number, fromY: number) {
    setLinking({ sourceId, fromX, fromY, toX: fromX, toY: fromY })
  }

  useEffect(() => {
    function onCtx(e: MouseEvent) {
      const t = e.target as HTMLElement | null
      if (t && t.closest('[data-link-target]')) e.preventDefault()
    }
    window.addEventListener('contextmenu', onCtx, true)
    return () => window.removeEventListener('contextmenu', onCtx, true)
  }, [])

  return (
    <div className="flex-1 flex min-h-0 relative">
      <aside className="w-64 shrink-0 border-r border-line bg-surface-2 flex flex-col">
        <div className="p-3 border-b border-line">
          <button
            onClick={handleNew}
            className="w-full px-3 py-1.5 text-sm rounded border border-line hover:bg-surface-3 text-ink"
            data-test="new-pipeline"
          >+ New</button>
        </div>
        <div className="px-3 pt-2 pb-1">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">Prompts</span>
        </div>
        {pipelines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
            <p className="text-sm text-ink-faint text-center">No prompt pipelines yet. Meridian seeds Story World Expander here on fresh installs.</p>
            <button onClick={handleNew}
              className="text-sm px-3 py-1.5 rounded border border-line hover:bg-surface-3 text-ink"
            >+ New</button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {pipelines.map((p) => {
              const cnt = ws.blocks.filter((b) => b.pipelineId === p.id).length
              return (
                <div
                  key={p.id}
                  className={`group rounded px-2 py-2 cursor-pointer transition-colors ${
                    selectedId === p.id ? 'bg-surface-3' : 'hover:bg-surface-3'
                  }`}
                  onClick={() => setSelectedId(p.id)}
                  data-test="pipeline-item"
                  data-pipeline-id={p.id}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ink truncate">{pipelineDisplayName(p.name)}</div>
                      <div className="text-xs text-ink-faint mt-0.5">
                        {cnt} {cnt === 1 ? 'step' : 'steps'}
                      </div>
                    </div>
                    <InlineConfirmButton
                      onConfirm={async () => {
                        if (selectedId === p.id) setSelectedId(null)
                        await ws.softDeletePipeline(p.id)
                      }}
                      label="del"
                      confirmLabel="confirm?"
                      className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      data-test="pipeline-delete-row"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {libraryFlash && (
          <div className="border-t border-line px-3 py-1.5 text-[11px] text-ink-faint italic">
            {libraryFlash}
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {pipeline ? (
          <PipelineDetail
            key={pipeline.id}
            pipeline={pipeline}
            blocks={pipelineBlocks}
            blockMeta={blockMeta}
            onTrackSummon={trackSummon}
            libraryInsertRequest={libraryInsertRequest}
            onLibraryInsertConsumed={() => setLibraryInsertRequest(null)}
            onDelete={handleDelete}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-ink-faint text-sm">
            {pipelines.length === 0 ? 'Click + New to start a private prompt/pipeline.' : 'Select a prompt pipeline.'}
          </div>
        )}
      </div>

      {blockLibraryRail.collapsed ? (
        <aside
          className="w-8 shrink-0 border-l border-line bg-surface-2 flex flex-col items-center"
          data-test="prompts-block-library-strip"
          data-collapsed="true"
        >
          <button
            onClick={blockLibraryRail.toggle}
            className="w-7 h-9 mt-0.5 flex items-center justify-center rounded text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors"
            data-test="prompts-block-library-expand"
            title="Expand block library"
            aria-label="Expand block library"
          >
            <span className="sr-only" data-test="prompts-library-toggle" />
            ›
          </button>
        </aside>
      ) : (
        <BlockLibrary
          blocks={libraryBlocks}
          allPatterns={allPatterns}
          blockMeta={blockMeta}
          links={ws.links}
          onTogglePin={togglePin}
          onInsert={insertLibraryBlock}
          onEdit={(id) => setEditBlockId(id)}
          onOpenPlayground={(id) => setPlaygroundId(id)}
          onStartLink={startLinking}
          linking={linking}
          onClose={blockLibraryRail.toggle}
        />
      )}

      {editBlock && (
        <BlockEditDrawer
          block={editBlock}
          onClose={() => setEditBlockId(null)}
        />
      )}

      {playgroundBlock && (
        <PlaygroundDrawer
          block={playgroundBlock}
          allPatterns={allPatterns}
          links={ws.links}
          linking={linking}
          onStartLink={startLinking}
          onFocusBlock={(id) => setPlaygroundId(id)}
          onInsert={insertLibraryBlock}
          onClose={() => setPlaygroundId(null)}
        />
      )}

      {linking && (
        <svg
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 70 }}
          data-test="prompts-link-line"
        >
          <defs>
            <marker
              id="link-arrow"
              markerWidth="10" markerHeight="10"
              refX="8" refY="5" orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="rgb(var(--accent))" />
            </marker>
          </defs>
          <path
            d={`M ${linking.fromX} ${linking.fromY} ` +
               `C ${linking.fromX + 60} ${linking.fromY}, ` +
               `${linking.toX - 60} ${linking.toY}, ` +
               `${linking.toX} ${linking.toY}`}
            stroke="rgb(var(--accent))"
            strokeWidth="2"
            strokeDasharray="6 4"
            fill="none"
            markerEnd="url(#link-arrow)"
          />
        </svg>
      )}
    </div>
  )
}

function PipelineDetail({
  pipeline,
  blocks,
  blockMeta,
  onTrackSummon,
  libraryInsertRequest,
  onLibraryInsertConsumed,
  onDelete,
}: {
  pipeline: PromptPipeline
  blocks:   PromptBlock[]   // legacy; unused in v2 but kept for prop stability
  blockMeta: Record<string, BlockMeta>
  onTrackSummon: (id: string) => void
  libraryInsertRequest: { patternId: string; nonce: number } | null
  onLibraryInsertConsumed: () => void
  onDelete: () => void
}) {
  const ws = useWorkspace()
  const focus = useFocus()
  const setFocus = useSetFocus()
  void blocks

  useEffect(() => {
    ws.setActiveRecord({ id: pipeline.id, type: 'pipeline' })
    setFocus({ id: pipeline.id, type: 'pipeline', origin: 'prompts' })
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [pipeline.id, ws, setFocus])

  // ── steps + pipeline-level vars (localStorage) ──
  const [steps, setSteps] = useState<PipelineStep[]>(() => loadPipelineSteps(pipeline.id))
  const [pVars, setPVars] = useState<Record<string, string>>(() => loadPipelineVars(pipeline.id))
  const [descOpen, setDescOpen] = useState(false)
  const [varsOpen, setVarsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => { setSteps(loadPipelineSteps(pipeline.id)) }, [pipeline.id])
  useEffect(() => { setPVars(loadPipelineVars(pipeline.id)) }, [pipeline.id])
  useEffect(() => { savePipelineSteps(pipeline.id, steps) }, [pipeline.id, steps])
  useEffect(() => { savePipelineVars(pipeline.id, pVars) }, [pipeline.id, pVars])

  // Patterns available as block sources.
  const allPatterns = useMemo(
    () => ws.patterns.filter((p) => p.deletedAt === undefined),
    [ws.patterns]
  )
  const blockPatterns = useMemo(
    () => allPatterns.filter((p) => p.type === BLOCK_TYPE),
    [allPatterns]
  )

  const orderedSteps = useMemo(
    () => [...steps].sort((a, b) => a.order - b.order),
    [steps]
  )
  const composeStep = useMemo(
    () => orderedSteps.find((s) => s.note === undefined) ?? null,
    [orderedSteps]
  )
  const composePattern = composeStep
    ? allPatterns.find((p) => p.id === composeStep.patternId) ?? null
    : null
  const rowsAfterCompose = composeStep && composePattern
    ? orderedSteps.filter((s) => s.id !== composeStep.id)
    : orderedSteps
  const hasBlockSteps = orderedSteps.some((s) => s.note === undefined)

  // Set of unique vars referenced anywhere in this pipeline (for the
  // pipeline-level vars editor).
  const allVars = useMemo(() => {
    const seen = new Set<string>()
    for (const s of steps) {
      if (s.note !== undefined) continue
      const p = allPatterns.find((p) => p.id === s.patternId)
      if (!p) continue
      for (const v of extractVariables(p.body)) seen.add(v)
    }
    return Array.from(seen)
  }, [steps, allPatterns])

  // ── step CRUD ──
  function patchStep(id: string, patch: Partial<PipelineStep>) {
    setSteps((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  function deleteStep(id: string) {
    setSteps((cur) =>
      cur
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i }))
    )
  }
  function moveStep(id: string, delta: -1 | 1) {
    setSteps((cur) => {
      const sorted = [...cur].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex((s) => s.id === id)
      if (idx < 0) return cur
      const target = idx + delta
      if (target < 0 || target >= sorted.length) return cur
      ;[sorted[idx], sorted[target]] = [sorted[target], sorted[idx]]
      return sorted.map((s, i) => ({ ...s, order: i }))
    })
  }
  function addStep(patternId: string) {
    setSteps((cur) => [
      ...cur,
      {
        id: uid(),
        patternId,
        bindings: {},
        order: cur.length,
      },
    ])
  }
  useEffect(() => {
    if (!libraryInsertRequest) return
    addStep(libraryInsertRequest.patternId)
    onLibraryInsertConsumed()
  }, [libraryInsertRequest, onLibraryInsertConsumed])

  function duplicateStep(id: string) {
    setSteps((cur) => {
      const idx = cur.findIndex((s) => s.id === id)
      if (idx < 0) return cur
      const src = cur[idx]
      const clone: PipelineStep = {
        ...src,
        id: uid(),
        bindings: { ...src.bindings },
        order: src.order + 1,
      }
      // Insert right after the source, then renumber.
      const next = [...cur]
      next.splice(idx + 1, 0, clone)
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }

  async function createDraftComposeStep(name: string, body: string) {
    const trimmedBody = body.trim()
    if (!trimmedBody || steps.length > 0) return
    const blockName = cleanTitle(name) || 'Untitled block'
    try {
      const created = await ws.createPattern({
        name: blockName,
        body,
        type: BLOCK_TYPE,
      })
      setSteps((cur) => cur.length === 0
        ? [{ id: uid(), patternId: created.id, bindings: {}, order: 0 }]
        : cur
      )
      if (isDefaultPipelineName(pipeline.name)) {
        await ws.updatePipeline(pipeline.id, { name: blockName })
      }
      onTrackSummon(created.id)
    } catch (error) {
      console.error('Failed to create first pipeline block', error)
      setFlash('first block create failed — see console')
    }
  }

  // Edit-block drawer state — available for non-first block steps.
  const [editBlockId, setEditBlockId] = useState<string | null>(null)
  const editBlock = editBlockId ? allPatterns.find((p) => p.id === editBlockId) : null
  useEffect(() => {
    if (editBlockId && !editBlock) setEditBlockId(null)
  }, [editBlockId, editBlock])
  useEffect(() => {
    if (editBlock) {
      ws.setActiveRecord({ id: editBlock.id, type: 'pattern' })
      setFocus({ id: editBlock.id, type: 'pattern', origin: 'prompts' })
      return
    }
    ws.setActiveRecord({ id: pipeline.id, type: 'pipeline' })
    setFocus({ id: pipeline.id, type: 'pipeline', origin: 'prompts' })
  }, [editBlock?.id, pipeline.id, ws, setFocus])

  // Preview panel toggle, persisted across visits.
  const [previewOpen, setPreviewOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('verse-studio:prompts:pipelinePreview') !== 'false' }
    catch { return true }
  })
  useEffect(() => {
    try {
      localStorage.setItem(
        'verse-studio:prompts:pipelinePreview',
        previewOpen ? 'true' : 'false'
      )
    } catch {}
  }, [previewOpen])
  function addNote(text: string) {
    setSteps((cur) => [
      ...cur,
      {
        id: uid(),
        patternId: '',
        bindings: {},
        note: text,
        order: cur.length,
      },
    ])
  }

  function handlePipelineDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const text = e.dataTransfer.getData('text/plain')
    if (text.trim()) addNote(text)
  }

  // ── pipeline vars CRUD ──
  function setVar(name: string, value: string) {
    setPVars((cur) => ({ ...cur, [name]: value }))
  }
  function deleteVar(name: string) {
    setPVars((cur) => {
      const next = { ...cur }
      delete next[name]
      return next
    })
  }

  // ── add-step popover (block picker) ──
  const [picker, setPicker] = useState<{ x: number; y: number } | null>(null)
  const [pickerQuery, setPickerQuery] = useState('')
  function openPicker(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPicker({ x: rect.left, y: rect.bottom + 4 })
    setPickerQuery('')
  }
  function closePicker() { setPicker(null); setPickerQuery('') }

  function firstBlockTitle(): string {
    return cleanTitle(composePattern?.name)
  }

  function pipelineActionTitle(fallback = DEFAULT_PIPELINE_NAME): string {
    return firstBlockTitle() || cleanTitle(pipeline.name) || fallback
  }

  async function updateFirstBlockName(name: string) {
    const previousName = cleanTitle(composePattern?.name)
    if (!composePattern) return
    await ws.updatePattern(composePattern.id, { name })
    if (isDefaultPipelineName(pipeline.name) || cleanTitle(pipeline.name) === previousName) {
      const nextPipelineName = cleanTitle(name) || DEFAULT_PIPELINE_NAME
      await ws.updatePipeline(pipeline.id, { name: nextPipelineName })
    }
  }

  // ── exports / publish actions ──
  function buildTxtExport(): string {
    return materializePipeline(pipeline, steps, allPatterns, pVars)
  }
  function buildJsonExport(): string {
    return JSON.stringify({
      schemaVersion: 3,
      exportedAt: Date.now(),
      kind: 'promptPipeline',
      pipeline: {
        id: pipeline.id, name: pipelineDisplayName(pipeline.name), description: pipeline.description,
        createdAt: pipeline.createdAt, updatedAt: pipeline.updatedAt,
      },
      pipelineVars: pVars,
      steps: orderedSteps.map((s) => {
        const p = s.patternId ? allPatterns.find((p) => p.id === s.patternId) : null
        return {
          id: s.id,
          order: s.order,
          note: s.note,
          patternId: s.patternId || undefined,
          patternName: p?.name,
          patternBody: p?.body,
          bindings: s.bindings,
        }
      }),
    }, null, 2)
  }
  function handleExportTxt() {
    downloadText(safeFilename(pipelineActionTitle('untitled')) + '.txt', buildTxtExport(), 'text/plain')
  }
  function handleExportJson() {
    downloadText(safeFilename(pipelineActionTitle('untitled')) + '.pipeline.json', buildJsonExport(), 'application/json')
  }
  function handleExportAiBrief() {
    try {
      const brief = buildAiBriefExport({ workspace: ws, focus, contentDepth: 'titles_summaries' })
      const json = JSON.stringify(brief, null, 2)
      JSON.parse(json)
      const stamp = brief.exported_at.replace(/[:.]/g, '-').replace('Z', 'Z')
      downloadText(`noted-ai-brief-${stamp}.json`, json, 'application/json')
      setAiBriefFlash('Downloaded')
      setFlash('AI brief exported locally')
    } catch (error) {
      console.error('Failed to export AI brief', error)
      setAiBriefFlash('Failed')
      setFlash('AI brief export failed — see console')
    }
  }
  async function handleSaveAsPrompt() {
    if (!hasBlockSteps) return
    const text = buildTxtExport()
    if (!text.trim()) return
    try {
      await ws.createPrompt({ title: pipelineActionTitle(), body: text })
      setSavePromptFlash('Saved')
      setFlash('saved as prompt')
    } catch (error) {
      console.error('Failed to save pipeline as prompt', error)
      setFlash('prompt save failed — see console')
    }
  }
  async function handleSaveAsBlock() {
    if (!hasBlockSteps) return
    const text = buildTxtExport()
    if (!text.trim()) return
    try {
      const created = await ws.createPattern({
        name: pipelineActionTitle('Untitled block'),
        body: text,
        type: BLOCK_TYPE,
      })
      onTrackSummon(created.id)
      setSaveBlockFlash('Saved')
      setFlash('saved as block')
    } catch (error) {
      console.error('Failed to save pipeline as block', error)
      setFlash('block save failed — see console')
    }
  }
  function handleCopyAssembled() {
    const text = buildTxtExport()
    if (!text.trim()) return
    try {
      navigator.clipboard.writeText(text)
      setCopyFlash('Copied')
      setFlash('copied assembled text')
    } catch {
      setFlash('copy failed')
    }
  }

  const [flash, setFlash] = useState<string | null>(null)
  const [savePromptFlash, setSavePromptFlash] = useState<'Saved' | null>(null)
  const [saveBlockFlash, setSaveBlockFlash] = useState<'Saved' | null>(null)
  const [copyFlash, setCopyFlash] = useState<'Copied' | null>(null)
  const [aiBriefFlash, setAiBriefFlash] = useState<'Downloaded' | 'Failed' | null>(null)
  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 1800)
    return () => window.clearTimeout(t)
  }, [flash])
  useEffect(() => {
    if (!savePromptFlash) return
    const t = window.setTimeout(() => setSavePromptFlash(null), 1500)
    return () => window.clearTimeout(t)
  }, [savePromptFlash])
  useEffect(() => {
    if (!saveBlockFlash) return
    const t = window.setTimeout(() => setSaveBlockFlash(null), 1500)
    return () => window.clearTimeout(t)
  }, [saveBlockFlash])
  useEffect(() => {
    if (!copyFlash) return
    const t = window.setTimeout(() => setCopyFlash(null), 1500)
    return () => window.clearTimeout(t)
  }, [copyFlash])
  useEffect(() => {
    if (!aiBriefFlash) return
    const t = window.setTimeout(() => setAiBriefFlash(null), 1800)
    return () => window.clearTimeout(t)
  }, [aiBriefFlash])
  useEffect(() => {
    if (!exportOpen) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node | null
      if (target && exportMenuRef.current?.contains(target)) return
      setExportOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [exportOpen])

  // Paste & split drawer state
  const [pasteSplitOpen, setPasteSplitOpen] = useState(false)

  function renderStepRow(step: PipelineStep) {
    return (
      <PipelineStepRow
        key={step.id}
        step={step}
        pattern={step.patternId ? allPatterns.find((p) => p.id === step.patternId) ?? null : null}
        pipelineVars={pVars}
        isFirst={orderedSteps[0]?.id === step.id}
        isLast={orderedSteps[orderedSteps.length - 1]?.id === step.id}
        onPatch={(patch) => patchStep(step.id, patch)}
        onDelete={() => deleteStep(step.id)}
        onMove={(delta) => moveStep(step.id, delta)}
        onDuplicate={() => duplicateStep(step.id)}
        onEditBlock={() => step.patternId && setEditBlockId(step.patternId)}
      />
    )
  }

  return (
    <div className="flex-1 flex min-h-0 relative">
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <header className="border-b border-line px-6 py-3 flex items-center gap-3 shrink-0">
        <PipelineNameInput pipeline={pipeline} />
        <button
          onClick={handleSaveAsPrompt}
          disabled={!hasBlockSteps}
          className="text-xs text-ink rounded px-3 py-1 border border-accent hover:bg-accent/10 shrink-0 disabled:opacity-40"
          data-test="pipeline-save-as-prompt"
          title="Save assembled prompt output as a Prompt record"
        >{savePromptFlash ?? 'Save as prompt'}</button>
        <button
          onClick={handleCopyAssembled}
          disabled={!hasBlockSteps}
          className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface shrink-0 disabled:opacity-40"
          data-test="pipeline-copy-assembled"
          title="Copy assembled prompt output"
        >{copyFlash ?? 'Copy'}</button>
        <button
          onClick={handleExportAiBrief}
          className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface shrink-0"
          data-test="ai-brief-export"
          title="Exports a local JSON topology brief for AI review. This does not send data anywhere."
        >{aiBriefFlash ?? 'Export AI brief'}</button>
        <span className="sr-only" data-test="ai-brief-export-status">{aiBriefFlash ?? 'ready'}</span>
        <div className="relative shrink-0" ref={exportMenuRef}>
          <button
            onClick={() => setExportOpen(v => !v)}
            className="text-xs text-ink-soft hover:text-ink rounded px-2 py-1 border border-line hover:bg-surface"
            data-test="pipeline-export-menu"
          >⋯</button>
          {exportOpen && (
            <div
              className="absolute right-0 top-full mt-1 bg-surface-2 border border-line rounded shadow-lg z-10 py-1 min-w-[120px]"
              data-test="pipeline-export-dropdown"
            >
              <button onClick={() => { handleExportTxt(); setExportOpen(false) }}
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-surface-3 text-ink-soft hover:text-ink"
                data-test="pipeline-export-txt">↓ Export .txt</button>
              <button onClick={() => { handleExportJson(); setExportOpen(false) }}
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-surface-3 text-ink-soft hover:text-ink"
                data-test="pipeline-export-json">↓ Export .json</button>
              <button onClick={() => { handleSaveAsBlock(); setExportOpen(false) }}
                disabled={!hasBlockSteps}
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-surface-3 text-ink-soft hover:text-ink disabled:opacity-40"
                data-test="pipeline-save-as-block-menu">{saveBlockFlash ?? 'Save as block'}</button>
            </div>
          )}
        </div>
        <ProjectPicker
          value={pipeline.projectId}
          onChange={(next) => ws.updatePipeline(pipeline.id, { projectId: next })}
        />
        <Snapshots
          recordId={pipeline.id}
          recordType="pipeline"
          buildSnapshotData={() => JSON.stringify({
            name: pipeline.name,
            description: pipeline.description,
            steps,
            pVars,
          })}
        />
        <InlineConfirmButton
          onConfirm={onDelete}
          label="Delete"
          confirmLabel="Confirm?"
          className="text-xs text-ink-soft hover:text-bad rounded px-2 py-1 border border-line hover:bg-surface shrink-0"
          data-test="pipeline-delete"
        />
      </header>

      <div className="px-6 py-1.5 text-[10px] text-ink-faint border-b border-line bg-surface-2/40" data-test="ai-brief-export-explainer">
        AI Brief Export downloads a local JSON topology brief for AI review. This does not send data anywhere.
      </div>

      <TagsBar recordId={pipeline.id} recordType="pipeline" />
      <LinksPanel recordId={pipeline.id} recordType="pipeline" />
      <RelatedStrip recordId={pipeline.id} recordType="pipeline" />

      <div className="border-b border-line">
        <button
          onClick={() => setDescOpen(v => !v)}
          className="w-full text-left px-6 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink hover:bg-surface-3/40 transition-colors flex items-center gap-1"
          data-test="pipeline-desc-toggle"
        >
          <span>{descOpen ? '▾' : '▸'}</span>
          <span>Description</span>
          {pipeline.description && !descOpen && (
            <span className="text-[10px] text-ink-faint italic truncate ml-2 normal-case tracking-normal">
              {pipeline.description.slice(0, 60)}{pipeline.description.length > 60 ? '…' : ''}
            </span>
          )}
        </button>
        {descOpen && <PipelineDescriptionInput pipeline={pipeline} />}
      </div>

      {flash && (
        <div
          className="px-6 py-1.5 text-[11px] text-ink-faint italic border-b border-line"
          data-test="pipeline-flash"
        >{flash}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Variables editor */}
        {allVars.length > 0 && (
          <div className="border-b border-line">
            <button
              onClick={() => setVarsOpen(v => !v)}
              className="w-full text-left px-6 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink hover:bg-surface-3/40 transition-colors flex items-center gap-1"
              data-test="pipeline-vars-toggle"
            >
              <span>{varsOpen ? '▾' : '▸'}</span>
              <span>Variables</span>
              <span className="text-[10px] text-ink-faint ml-1">({allVars.length})</span>
            </button>
            {varsOpen && (
              <PipelineVarsEditor
                allVars={allVars}
                values={pVars}
                onSet={setVar}
                onDelete={deleteVar}
              />
            )}
          </div>
        )}

        {/* Steps */}
        <div
          className="px-8 py-4"
          data-test="pipeline-drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handlePipelineDrop}
        >
          {steps.length === 0 ? (
            <>
              <div data-test="pipeline-compose-empty">
                <FirstBlockEditor
                  step={null}
                  pattern={null}
                  pipelineVars={pVars}
                  blockPatterns={blockPatterns}
                  allPatterns={allPatterns}
                  blockMeta={blockMeta}
                  draftMode
                  onPatch={() => {}}
                  onEditName={() => {}}
                  onEditBody={() => {}}
                  onTrackSummon={onTrackSummon}
                  onCreateDraftBlock={createDraftComposeStep}
                />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={openPicker}
                  className="text-sm text-ink rounded px-4 py-2 border border-accent/60 bg-surface hover:bg-accent/10"
                  data-test="pipeline-empty-add"
                >+ Add a block</button>
              </div>
            </>
          ) : composeStep && composePattern ? (
            <div className="space-y-2">
              <FirstBlockEditor
                step={composeStep}
                pattern={composePattern}
                pipelineVars={pVars}
                blockPatterns={blockPatterns}
                allPatterns={allPatterns}
                blockMeta={blockMeta}
                onPatch={(patch) => patchStep(composeStep.id, patch)}
                onEditName={updateFirstBlockName}
                onEditBody={(body) => ws.updatePattern(composePattern.id, { body })}
                onTrackSummon={onTrackSummon}
              />
              {rowsAfterCompose.length > 0 && (
                <>
                  <div className="border-t border-line my-3 flex items-center gap-2 px-1" data-test="pipeline-steps-divider">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                      Chain
                    </span>
                  </div>
                  <div className="space-y-2">
                    {rowsAfterCompose.map(renderStepRow)}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {rowsAfterCompose.map(renderStepRow)}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={openPicker}
              className="text-sm text-ink px-3 py-1.5 rounded border border-accent/60 bg-surface hover:bg-accent/10 shadow-sm"
              data-test="pipeline-add-step"
            >＋ Add block</button>
            <button
              onClick={() => addNote('')}
              className="text-sm text-ink-soft hover:text-ink px-3 py-1.5 rounded border border-line hover:bg-surface"
              data-test="pipeline-add-note"
              title="Free-text note addressed to the human substrate"
            >+ Add note</button>
            <button
              onClick={() => setPasteSplitOpen(true)}
              className="text-sm text-ink-soft hover:text-ink px-3 py-1.5 rounded border border-line hover:bg-surface"
              data-test="pipeline-paste-split"
              title="Paste a long prompt; split into named blocks at separator lines"
            >+ Paste &amp; split</button>
            <span className="text-[10px] text-ink-faint italic">
              Notes render as <code>&gt;&gt;&gt; …</code> instructions in the materialized output.
            </span>
          </div>
        </div>
      </div>

      {previewOpen && (
        <PipelinePreviewPanel
          text={materializePipeline(pipeline, steps, allPatterns, pVars)}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {!previewOpen && (
        <button
          onClick={() => setPreviewOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-1.5 py-3 text-[10px] text-ink-faint hover:text-ink bg-surface-2 border border-line rounded-l"
          data-test="pipeline-preview-open"
          title="Show preview"
        >‹</button>
      )}

      {picker && (
        <PipelineBlockPicker
          x={picker.x}
          y={picker.y}
          query={pickerQuery}
          onQuery={setPickerQuery}
          patterns={blockPatterns}
          allPatterns={allPatterns}
          onPick={(p) => { addStep(p.id); closePicker() }}
          onCreateBlock={async (name) => {
            try {
              const created = await ws.createPattern({
                name: name.trim() || 'Untitled block',
                body: '',
                type: BLOCK_TYPE,
              })
              addStep(created.id)
              closePicker()
              // Auto-open the editor so the user can write the body without
              // having to round-trip to Compose. This prevents create-with-name
              // from becoming a dead end.
              setEditBlockId(created.id)
            } catch (error) {
              console.error('Failed to create pipeline block', error)
              setFlash('block create failed — see console')
            }
          }}
          onClose={closePicker}
        />
      )}
      </div>

      {editBlock && (
        <BlockEditDrawer
          block={editBlock}
          onClose={() => setEditBlockId(null)}
        />
      )}

      {pasteSplitOpen && (
        <PasteSplitDrawer
          onClose={() => setPasteSplitOpen(false)}
          onCommit={async (parts) => {
            // Bulk-create blocks then append a step for each, in order.
            for (const part of parts) {
              if (!part.body.trim()) continue
              const created = await ws.createPattern({
                name: part.name.trim() || 'Untitled block',
                body: part.body,
                type: BLOCK_TYPE,
              })
              setSteps((cur) => [
                ...cur,
                {
                  id: uid(),
                  patternId: created.id,
                  bindings: {},
                  order: cur.length,
                },
              ])
            }
            setPasteSplitOpen(false)
            setFlash(`split into ${parts.length} blocks · added as steps`)
          }}
        />
      )}
    </div>
  )
}

// ── First block inline compose editor ────────────────────────────────────────

function FirstBlockEditor({
  step,
  pattern,
  pipelineVars,
  blockPatterns,
  allPatterns,
  blockMeta,
  draftMode = false,
  onPatch,
  onEditName,
  onEditBody,
  onTrackSummon,
  onCreateDraftBlock,
}: {
  step: PipelineStep | null
  pattern: Pattern | null
  pipelineVars: Record<string, string>
  blockPatterns: Pattern[]
  allPatterns: Pattern[]
  blockMeta: Record<string, BlockMeta>
  draftMode?: boolean
  onPatch: (patch: Partial<PipelineStep>) => void
  onEditName: (name: string) => void
  onEditBody: (body: string) => void
  onTrackSummon: (id: string) => void
  onCreateDraftBlock?: (name: string, body: string) => Promise<void>
}) {
  void step
  void onPatch
  const taRef = useRef<HTMLTextAreaElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const creatingRef = useRef(false)
  const [name, setName] = useState(pattern?.name ?? '')
  const [body, setBody] = useState(pattern?.body ?? '')
  const [bodyCopyFlash, setBodyCopyFlash] = useState<'Copied' | null>(null)
  const patternId = pattern?.id ?? 'draft'

  useEffect(() => {
    setName(pattern?.name ?? '')
    setBody(pattern?.body ?? '')
  }, [patternId])
  useEffect(() => {
    if (!bodyCopyFlash) return
    const t = window.setTimeout(() => setBodyCopyFlash(null), 1200)
    return () => window.clearTimeout(t)
  }, [bodyCopyFlash])

  const nameDirty = !draftMode && !!pattern && name !== pattern.name
  const bodyDirty = !draftMode && !!pattern && body !== pattern.body
  useDebouncedAutosave('first-block-name:' + patternId + ':' + name, nameDirty, () => {
    onEditName(name)
  })
  useDebouncedAutosave('first-block-body:' + patternId + ':' + body, bodyDirty, () => {
    onEditBody(body)
  })

  type SlashState = {
    pos: { left: number; top: number }
    queryStart: number
    query: string
    selected: number
  }
  const [slash, setSlash] = useState<SlashState | null>(null)

  const summonable = blockPatterns.length > 0 ? blockPatterns : allPatterns
  const rankedBlocks = useCallback((query: string): Pattern[] => {
    const q = query.trim()
    if (q) {
      return summonable
        .map((p) => ({ p, score: fuzzyScore(q, p.name) }))
        .filter((x) => x.score >= 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p)
    }
    return [...summonable].sort((a, b) => {
      const ma = blockMeta[a.id] ?? {}
      const mb = blockMeta[b.id] ?? {}
      if (!!mb.pinned !== !!ma.pinned) return mb.pinned ? 1 : -1
      const uc = (mb.useCount ?? 0) - (ma.useCount ?? 0)
      if (uc !== 0) return uc
      const lu = (mb.lastUsed ?? 0) - (ma.lastUsed ?? 0)
      if (lu !== 0) return lu
      return b.updatedAt - a.updatedAt
    })
  }, [summonable, blockMeta])

  const slashResults = useMemo(
    () => slash ? rankedBlocks(slash.query).slice(0, 8) : [],
    [slash, rankedBlocks]
  )

  function closeSlash() { setSlash(null) }

  function maybeUpdateSlash(value: string, caret: number) {
    if (!slash) return
    if (caret < slash.queryStart + 1) { closeSlash(); return }
    const query = value.slice(slash.queryStart + 1, caret)
    if (/\s/.test(query) || query.includes('/')) { closeSlash(); return }
    setSlash({ ...slash, query, selected: 0 })
  }

  function openSlashAtCursor() {
    const ta = taRef.current
    if (!ta) return
    const coords = getCaretCoords(ta)
    if (!coords) return
    const pos = ta.selectionStart
    setSlash({ pos: coords, queryStart: Math.max(0, pos - 1), query: '', selected: 0 })
  }

  function insertBlock(p: Pattern) {
    const ta = taRef.current
    const from = slash ? slash.queryStart : (ta?.selectionStart ?? body.length)
    const to = slash ? (ta?.selectionStart ?? slash.queryStart + slash.query.length + 1) : (ta?.selectionEnd ?? body.length)
    const before = body.slice(0, from)
    const after = body.slice(to)
    const text = p.body
    const next = before + text + after
    const insertedAt = before.length

    setBody(next)
    if (!draftMode) onEditBody(next)
    closeSlash()
    onTrackSummon(p.id)

    requestAnimationFrame(() => {
      const tA = taRef.current
      if (!tA) return
      tA.focus()
      const v = findNextVar(next, insertedAt)
      if (v && v.end <= insertedAt + text.length) {
        tA.setSelectionRange(v.start, v.end)
      } else {
        const caret = insertedAt + text.length
        tA.setSelectionRange(caret, caret)
      }
    })
  }

  async function commitDraftIfNeeded() {
    if (!draftMode || creatingRef.current || !onCreateDraftBlock) return
    if (!body.trim()) return
    creatingRef.current = true
    try {
      await onCreateDraftBlock(name, body)
    } finally {
      creatingRef.current = false
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slash) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlash({ ...slash, selected: Math.min(slash.selected + 1, slashResults.length - 1) })
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlash({ ...slash, selected: Math.max(slash.selected - 1, 0) })
        return
      }
      if (e.key === 'Enter') {
        if (slashResults.length > 0) {
          e.preventDefault()
          insertBlock(slashResults[slash.selected])
          return
        }
        closeSlash(); return
      }
      if (e.key === 'Escape') { e.preventDefault(); closeSlash(); return }
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      const ta = e.currentTarget
      const v = findNextVar(ta.value, ta.selectionEnd)
      if (v) {
        e.preventDefault()
        ta.setSelectionRange(v.start, v.end)
        return
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault()
      const ta = e.currentTarget
      const pos = ta.selectionStart
      const next = body.slice(0, pos) + '/' + body.slice(ta.selectionEnd)
      setBody(next)
      if (!draftMode) onEditBody(next)
      requestAnimationFrame(() => {
        const tA = taRef.current
        if (!tA) return
        tA.setSelectionRange(pos + 1, pos + 1)
        openSlashAtCursor()
      })
      return
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (draftMode) {
        commitDraftIfNeeded()
      } else {
        onEditName(name)
        onEditBody(body)
      }
      return
    }
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    const caret = e.target.selectionStart
    const prev = body

    setBody(value)

    if (value.length === prev.length + 1) {
      const lastTyped = value[caret - 1]
      const before = caret >= 2 ? value[caret - 2] : ''
      if (lastTyped === '/' && (caret === 1 || /\s/.test(before))) {
        const ta = taRef.current
        if (ta) {
          const coords = getCaretCoords(ta)
          if (coords) {
            setSlash({
              pos: coords,
              queryStart: caret - 1,
              query: '',
              selected: 0,
            })
          }
        }
        return
      }
    }
    maybeUpdateSlash(value, caret)
  }

  function onSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    if (slash) maybeUpdateSlash(e.currentTarget.value, e.currentTarget.selectionStart)
  }

  const vars = extractVariables(body)

  return (
    <div
      ref={wrapperRef}
      className="group relative rounded border border-line bg-surface overflow-hidden shadow-sm"
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commitDraftIfNeeded()
      }}
    >
      <div className="px-5 pt-4 pb-2 border-b border-line bg-surface-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { if (!draftMode) onEditName(name); else commitDraftIfNeeded() }}
          placeholder="Untitled block"
          className="title-input w-full text-xl font-semibold text-ink bg-transparent border-0 px-0 py-0 focus:ring-0"
          data-test="pipeline-first-block-name"
        />
      </div>
      <div className="relative" data-test="pipeline-first-block-editor">
        <HighlightedEditor
          taRef={taRef}
          value={body}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onSelect={onSelect}
          onClick={() => slash && closeSlash()}
          onContextMenu={(e) => e.preventDefault()}
          placeholder="Write your prompt…"
        />
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(body)
              setBodyCopyFlash('Copied')
            } catch {}
          }}
          className={`absolute top-2 right-2 z-10 text-[10px] px-1.5 py-0.5 rounded border transition-all ${
            bodyCopyFlash ? 'border-accent text-accent opacity-100' : 'border-line text-ink-faint opacity-0 group-hover:opacity-100'
          }`}
          data-test="pipeline-first-block-copy"
          title="Copy prompt body"
        >{bodyCopyFlash ?? 'copy'}</button>
      </div>
      {slash && (
        <SlashPopover
          wrapperRef={wrapperRef}
          anchor={slash.pos}
          query={slash.query}
          results={slashResults}
          selected={slash.selected}
          onPick={insertBlock}
          onHover={(i) => setSlash({ ...slash, selected: i })}
          onClose={closeSlash}
        />
      )}
      {vars.length > 0 && (
        <div className="px-5 py-2 border-t border-line flex flex-wrap items-center gap-1.5">
          {vars.map((v) => (
            <code
              key={v}
              className={`text-[10px] rounded border px-1.5 py-0.5 ${
                pipelineVars[v] !== undefined
                  ? 'border-accent/40 text-accent bg-accent/10'
                  : 'border-line text-ink-faint bg-surface-2'
              }`}
              title={pipelineVars[v] !== undefined ? `prompt value: ${pipelineVars[v]}` : 'unset'}
            >{`{{${v}}}`}</code>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pipeline variables editor ───────────────────────────────────────────────

function PipelineVarsEditor({
  allVars,
  values,
  onSet,
  onDelete,
}: {
  allVars:  string[]
  values:   Record<string, string>
  onSet:    (name: string, value: string) => void
  onDelete: (name: string) => void
}) {
  // Show every var referenced in any step body PLUS any user-added vars
  // that may not yet be referenced.
  const names = useMemo(() => {
    const set = new Set<string>(allVars)
    for (const k of Object.keys(values)) set.add(k)
    return Array.from(set).sort()
  }, [allVars, values])

  const [newName, setNewName] = useState('')

  function addUserVar() {
    const trimmed = newName.trim()
    if (!trimmed) return
    onSet(trimmed, values[trimmed] ?? '')
    setNewName('')
  }

  return (
    <div
      className="px-8 py-3 border-b border-line bg-surface-2"
      data-test="pipeline-vars"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          Variables
        </span>
        <span className="text-[10px] text-ink-faint">
          {names.length === 0 ? '(none)' : `(${names.length})`}
        </span>
        <span className="flex-1" />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addUserVar() }}
          placeholder="add var…"
          className="title-input text-[11px] text-ink w-28"
          data-test="pipeline-var-add-name"
        />
        <button
          onClick={addUserVar}
          className="text-[11px] text-ink-soft hover:text-ink rounded px-2 py-0.5 border border-line"
          data-test="pipeline-var-add"
        >+</button>
      </div>
      {names.length === 0 ? (
        <div className="text-[11px] text-ink-faint italic">
          Variables you reference as <code>{'{{name}}'}</code> in any step body
          appear here. Set values once; step bindings can override them.
        </div>
      ) : (
        <div className="space-y-1">
          {names.map((n) => (
            <div key={n} className="flex items-baseline gap-2" data-test="pipeline-var-row" data-var-name={n}>
              <code className="text-xs text-accent shrink-0 w-32 truncate" title={n}>
                {`{{${n}}}`}
              </code>
              <input
                value={values[n] ?? ''}
                onChange={(e) => onSet(n, e.target.value)}
                placeholder="(unset)"
                className="title-input flex-1 text-xs text-ink"
                data-test="pipeline-var-value"
              />
              <button
                onClick={() => onDelete(n)}
                className="text-[10px] text-ink-faint hover:text-bad px-1"
                title="Remove value"
                data-test="pipeline-var-delete"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pipeline step row ───────────────────────────────────────────────────────

function PipelineStepRow({
  step,
  pattern,
  pipelineVars,
  isFirst,
  isLast,
  onPatch,
  onDelete,
  onMove,
  onDuplicate,
  onEditBlock,
}: {
  step:         PipelineStep
  pattern:      Pattern | null
  pipelineVars: Record<string, string>
  isFirst:      boolean
  isLast:       boolean
  onPatch:      (patch: Partial<PipelineStep>) => void
  onDelete:     () => void
  onMove:       (delta: -1 | 1) => void
  onDuplicate:  () => void
  onEditBlock:  () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isNote = step.note !== undefined

  if (isNote) {
    return (
      <div
        className="group border border-line rounded bg-surface-2 px-3 py-2"
        data-test="pipeline-step-note"
        data-step-id={step.id}
      >
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => onMove(-1)}
            disabled={isFirst}
            className="text-[11px] px-1.5 py-0.5 text-ink-faint hover:text-ink rounded disabled:opacity-30"
            data-test="pipeline-step-up"
            title="Move up"
          >↑</button>
          <button
            onClick={() => onMove(1)}
            disabled={isLast}
            className="text-[11px] px-1.5 py-0.5 text-ink-faint hover:text-ink rounded disabled:opacity-30"
            data-test="pipeline-step-down"
            title="Move down"
          >↓</button>
          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            Note
          </span>
          <span className="flex-1" />
          <InlineConfirmButton
            onConfirm={onDelete}
            label="del"
            confirmLabel="confirm?"
            className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
            data-test="pipeline-step-delete"
          />
        </div>
        <textarea
          value={step.note ?? ''}
          onChange={(e) => onPatch({ note: e.target.value })}
          placeholder="Instruction for the human substrate (paste this into Window B, etc.)"
          rows={4}
          className="editor-surface w-full min-h-[6rem] px-2 py-1.5 text-xs text-ink-soft resize-none"
          data-test="pipeline-step-note-body"
        />
      </div>
    )
  }

  const vars = pattern ? extractVariables(pattern.body) : []
  const filled = pattern
    ? substituteVars(pattern.body, { ...pipelineVars, ...step.bindings })
    : ''

  return (
    <div
      className="group border border-line rounded bg-surface"
      data-test="pipeline-step"
      data-step-id={step.id}
      data-pattern-id={step.patternId}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <button
          onClick={() => onMove(-1)}
          disabled={isFirst}
          className="text-[11px] px-1.5 py-0.5 text-ink-faint hover:text-ink rounded disabled:opacity-30"
          data-test="pipeline-step-up"
          title="Move up"
        >↑</button>
        <button
          onClick={() => onMove(1)}
          disabled={isLast}
          className="text-[11px] px-1.5 py-0.5 text-ink-faint hover:text-ink rounded disabled:opacity-30"
          data-test="pipeline-step-down"
          title="Move down"
        >↓</button>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-sm text-ink truncate text-left flex-1 min-w-0"
          data-test="pipeline-step-toggle"
        >
          {pattern ? (
            <>
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint mr-2">
                Block
              </span>
              {pattern.name || <span className="italic text-ink-faint">Untitled</span>}
            </>
          ) : (
            <span className="italic text-bad">[missing block]</span>
          )}
        </button>
        {vars.length > 0 && (
          <span
            className="text-[9px] uppercase tracking-wider text-accent"
            title={vars.join(', ')}
          >
            {vars.length} {vars.length === 1 ? 'var' : 'vars'}
          </span>
        )}
        <span className="text-[10px] text-ink-faint">{expanded ? '▾' : '▸'}</span>
        {pattern && (
          <button
            onClick={(e) => { e.stopPropagation(); onEditBlock() }}
            className="text-[10px] text-ink-faint hover:text-ink px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
            data-test="pipeline-step-edit-block"
            title="Edit this block (changes propagate to every prompt using it)"
          >edit</button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="text-[10px] text-ink-faint hover:text-ink px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
          data-test="pipeline-step-duplicate"
          title="Duplicate step (clone with bindings)"
        >dup</button>
        <InlineConfirmButton
          onConfirm={onDelete}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100"
          data-test="pipeline-step-delete"
        />
      </div>

      {!expanded && pattern && (
        <div className="px-3 py-2 text-[11px] text-ink-faint truncate">
          {(pattern.body || '').slice(0, 140).replace(/\n/g, ' ⏎ ') || <em>empty</em>}
        </div>
      )}

      {expanded && pattern && (
        <div className="px-3 py-3 space-y-2">
          {vars.length > 0 && (
            <div data-test="pipeline-step-bindings">
              <div className="text-[9px] uppercase tracking-[0.18em] text-ink-faint mb-1">
                Bindings (override prompt vars)
              </div>
              <div className="space-y-1">
                {vars.map((v) => (
                  <div key={v} className="flex items-baseline gap-2">
                    <code className="text-[11px] text-accent shrink-0 w-32 truncate" title={v}>
                      {`{{${v}}}`}
                    </code>
                    <input
                      value={step.bindings[v] ?? ''}
                      onChange={(e) =>
                        onPatch({ bindings: { ...step.bindings, [v]: e.target.value } })
                      }
                      placeholder={pipelineVars[v] !== undefined
                        ? `prompt: ${pipelineVars[v].slice(0, 40)}`
                        : '(use prompt value or leave for human)'}
                      className="title-input flex-1 text-[11px] text-ink"
                      data-test="pipeline-step-binding"
                      data-var-name={v}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="text-[9px] uppercase tracking-[0.18em] text-ink-faint mb-1">
              Materialized preview
            </div>
            <pre className="text-[11px] text-ink-soft bg-surface-2 border border-line rounded px-2 py-1.5 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto" data-test="pipeline-step-preview">
              {filled || <em className="text-ink-faint not-italic">empty body</em>}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Block picker popover (for adding pipeline steps) ────────────────────────

function PipelineBlockPicker({
  x, y,
  query,
  onQuery,
  patterns,
  allPatterns,
  onPick,
  onCreateBlock,
  onClose,
}: {
  x: number; y: number
  query: string
  onQuery: (q: string) => void
  patterns:    Pattern[]   // type === 'block'
  allPatterns: Pattern[]
  onPick:        (p: Pattern) => void
  onCreateBlock: (name: string) => void
  onClose:       () => void
}) {
  const popRef = useRef<HTMLDivElement>(null)
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState(0)

  const source = showAll ? allPatterns : patterns
  const ranked = useMemo(() => {
    if (!query.trim()) return source.slice(0, 12)
    return source
      .map((p) => ({ p, score: fuzzyScore(query, p.name) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.p)
  }, [source, query])

  // Outside-click close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, ranked.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (ranked[selected]) onPick(ranked[selected])
        else if (query.trim()) onCreateBlock(query)
      }
    }
    window.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, onPick, onCreateBlock, ranked, selected, query])

  return (
    <div
      ref={popRef}
      style={{ position: 'fixed', left: x, top: y, zIndex: 50 }}
      className="w-[320px] rounded border border-line bg-surface-2 shadow-lg overflow-hidden"
      data-test="pipeline-picker"
    >
      <div className="px-3 py-2 border-b border-line">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          autoFocus
          placeholder="Search blocks · or type a name to create new"
          className="title-input w-full text-xs text-ink"
          data-test="pipeline-picker-search"
        />
      </div>
      <div className="px-3 py-1 border-b border-line text-[10px] text-ink-faint">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Show all patterns
        </label>
      </div>
      {ranked.length === 0 ? (
        <div className="px-3 py-3 text-xs text-ink-faint italic">
          {query.trim()
            ? <>No match. <button
                onClick={() => onCreateBlock(query)}
                className="text-accent underline hover:text-ink"
                data-test="pipeline-picker-create"
              >Create &ldquo;{query}&rdquo;</button> as a new block.</>
            : <>No saved blocks yet. <button
                onClick={() => onCreateBlock('Untitled block')}
                className="text-accent underline hover:text-ink"
                data-test="pipeline-picker-create-blank"
              >Create a blank block.</button></>}
        </div>
      ) : (
        <ul className="max-h-72 overflow-y-auto py-1" data-test="pipeline-picker-list">
          {ranked.map((p, i) => (
            <li
              key={p.id}
              onMouseDown={(e) => { e.preventDefault(); onPick(p) }}
              onMouseEnter={() => setSelected(i)}
              className={`px-3 py-1.5 cursor-pointer ${
                i === selected ? 'bg-surface-3' : 'hover:bg-surface-3'
              }`}
              data-test="pipeline-picker-item"
              data-pattern-id={p.id}
            >
              <div className="text-sm text-ink truncate">
                {p.name || <span className="italic text-ink-faint">Untitled</span>}
              </div>
              <div className="text-[10px] text-ink-faint truncate">
                {p.body.slice(0, 80).replace(/\n/g, ' ⏎ ')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Pipeline live preview panel ─────────────────────────────────────────────

function PipelinePreviewPanel({
  text,
  onClose,
}: {
  text:    string
  onClose: () => void
}) {
  const charCount = text.length
  const wordCount = text.split(/\s+/).filter(Boolean).length
  const tokenEst  = Math.max(0, Math.ceil(charCount / 4))

  function copy() {
    if (!text) return
    try { navigator.clipboard.writeText(text) } catch {}
  }

  return (
    <aside
      className="w-[420px] shrink-0 border-l border-line bg-surface-2 flex flex-col"
      data-test="pipeline-preview"
    >
      <header className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
          Live preview
        </span>
        <span className="flex-1" />
        <button
          onClick={copy}
          className="text-[11px] text-ink-soft hover:text-ink rounded px-2 py-0.5 border border-line hover:bg-surface"
          data-test="pipeline-preview-copy"
          title="Copy to clipboard"
        >Copy</button>
        <button
          onClick={onClose}
          className="text-xs text-ink-faint hover:text-ink px-1.5 py-0.5"
          data-test="pipeline-preview-close"
          title="Hide preview"
        >›</button>
      </header>
      <pre
        className="flex-1 overflow-y-auto px-4 py-3 text-[12px] font-mono leading-[1.6] text-ink whitespace-pre-wrap"
        data-test="pipeline-preview-body"
      >
        {text || (
          <span className="italic text-ink-faint not-italic">
            Add a step to see the materialized output.
          </span>
        )}
      </pre>
      <footer className="border-t border-line px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint flex gap-3">
        <span>{charCount} chars</span>
        <span>·</span>
        <span>{wordCount} words</span>
        <span>·</span>
        <span>~{tokenEst} tokens</span>
      </footer>
    </aside>
  )
}

// ── Paste & split drawer ────────────────────────────────────────────────────
//
// The user pastes a long prompt. We split it on lines composed of three or
// more ═ ━ ─ — = chars (matches the separator style their Cognitive Chain
// and Council prompts use), then auto-derive a name for each section from
// the first non-blank, non-separator line. The user reviews the proposed
// split, can edit each name, and commits — the drawer creates one Pattern
// per section with type='block' and appends a step for each.

interface SplitPart {
  name: string
  body: string
}

const SEPARATOR_RE = /^\s*[═━─—=]{3,}\s*$/

function inferPartName(body: string): string {
  // Look at the first ~5 non-blank lines; pick the first that looks like a
  // header (UPPERCASED or starts with #) — fall back to the first short line.
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 5)
  for (const l of lines) {
    if (/^#+\s+/.test(l)) return l.replace(/^#+\s+/, '').slice(0, 60)
    // Headerish: ALL CAPS, mostly letters/spaces, ≤ 60 chars
    if (l.length <= 60 && /^[A-Z][A-Z0-9 :+/&'-]*$/.test(l)) return l.replace(/^[*]+\s*|\s*[*]+$/g, '').slice(0, 60)
  }
  // Fallback: first short line
  for (const l of lines) {
    if (l.length <= 60) return l.slice(0, 60)
  }
  return (lines[0] || 'Untitled section').slice(0, 60)
}

function splitPaste(input: string): SplitPart[] {
  const lines = input.split('\n')
  const sections: string[][] = [[]]
  for (const line of lines) {
    if (SEPARATOR_RE.test(line)) {
      // close current section if it has any non-empty content
      if (sections[sections.length - 1].some((l) => l.trim())) {
        sections.push([])
      }
    } else {
      sections[sections.length - 1].push(line)
    }
  }
  return sections
    .map((arr) => arr.join('\n').trim())
    .filter((body) => body.length > 0)
    .map((body) => ({ name: inferPartName(body), body }))
}

function PasteSplitDrawer({
  onClose,
  onCommit,
}: {
  onClose:  () => void
  onCommit: (parts: SplitPart[]) => Promise<void> | void
}) {
  const [input, setInput] = useState('')
  const [parts, setParts] = useState<SplitPart[]>([])

  function doSplit() {
    setParts(splitPaste(input))
  }

  function patchPart(i: number, patch: Partial<SplitPart>) {
    setParts((cur) => cur.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  function removePart(i: number) {
    setParts((cur) => cur.filter((_, idx) => idx !== i))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30"
      onMouseDown={onClose}
      data-test="paste-split-backdrop"
    >
      <aside
        className="w-[640px] bg-surface-2 border-l border-line flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
        data-test="paste-split"
      >
        <header className="flex items-center gap-2 px-4 py-2 border-b border-line">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
            Paste &amp; split
          </span>
          <span className="text-xs text-ink-faint">
            Splits on lines of <code>═══</code>, <code>━━━</code>, <code>───</code>, <code>===</code>, or <code>—</code>
          </span>
          <span className="flex-1" />
          <button
            onClick={onClose}
            className="text-xs text-ink-faint hover:text-ink px-2 py-0.5"
            data-test="paste-split-close"
            title="Close"
          >×</button>
        </header>

        {parts.length === 0 ? (
          <>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a long prompt here. We'll split it at separator lines."
              spellCheck={false}
              className="flex-1 px-4 py-3 font-mono text-[12.5px] leading-[1.65] text-ink bg-transparent outline-none resize-none"
              data-test="paste-split-input"
            />
            <footer className="px-4 py-2 border-t border-line flex items-center gap-2">
              <span className="text-[11px] text-ink-faint">
                {input.split('\n').length} lines · {input.length} chars
              </span>
              <span className="flex-1" />
              <button
                onClick={doSplit}
                disabled={!input.trim()}
                className="text-xs text-ink rounded px-3 py-1 border border-accent hover:bg-accent/10 disabled:opacity-40"
                data-test="paste-split-go"
              >Split →</button>
            </footer>
          </>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              data-test="paste-split-parts"
            >
              <div className="text-[11px] text-ink-faint italic">
                {parts.length} sections found. Review names and bodies, then commit.
              </div>
              {parts.map((p, i) => (
                <div
                  key={i}
                  className="border border-line rounded bg-surface"
                  data-test="paste-split-part"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-line">
                    <span className="text-[10px] text-ink-faint w-6 shrink-0">#{i + 1}</span>
                    <input
                      value={p.name}
                      onChange={(e) => patchPart(i, { name: e.target.value })}
                      className="title-input flex-1 text-sm text-ink"
                      data-test="paste-split-name"
                    />
                    <button
                      onClick={() => removePart(i)}
                      className="text-[10px] text-ink-faint hover:text-bad px-1.5 py-0.5"
                      data-test="paste-split-remove"
                      title="Discard this section"
                    >×</button>
                  </div>
                  <textarea
                    value={p.body}
                    onChange={(e) => patchPart(i, { body: e.target.value })}
                    rows={4}
                    spellCheck={false}
                    className="w-full px-3 py-2 font-mono text-[11.5px] leading-[1.55] text-ink-soft bg-transparent outline-none resize-y"
                    data-test="paste-split-body"
                  />
                </div>
              ))}
            </div>
            <footer className="px-4 py-2 border-t border-line flex items-center gap-2">
              <button
                onClick={() => setParts([])}
                className="text-xs text-ink-soft hover:text-ink rounded px-3 py-1 border border-line hover:bg-surface"
                data-test="paste-split-back"
              >← Edit input</button>
              <span className="flex-1" />
              <span className="text-[11px] text-ink-faint">
                {parts.length} blocks · creates {parts.length} steps in this prompt
              </span>
              <button
                onClick={() => onCommit(parts)}
                className="text-xs text-ink rounded px-3 py-1 border border-accent hover:bg-accent/10"
                data-test="paste-split-commit"
              >Commit →</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

function PipelineNameInput({ pipeline }: { pipeline: PromptPipeline }) {
  const ws = useWorkspace()
  const [name, setName] = useState(pipeline.name)
  const savedRef = useRef(pipeline.name)
  useEffect(() => {
    if (pipeline.name !== savedRef.current) {
      savedRef.current = pipeline.name
      setName(pipeline.name)
    }
  }, [pipeline.name])
  useDebouncedAutosave(name, name !== pipeline.name, () => {
    savedRef.current = name
    ws.updatePipeline(pipeline.id, { name })
  })
  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Prompt name"
      className="title-input flex-1 text-base text-ink"
      data-test="pipeline-name"
      data-pipeline-id={pipeline.id}
    />
  )
}

function PipelineDescriptionInput({ pipeline }: { pipeline: PromptPipeline }) {
  const ws = useWorkspace()
  const [description, setDescription] = useState(pipeline.description)
  const savedRef = useRef(pipeline.description)
  useEffect(() => {
    if (pipeline.description !== savedRef.current) {
      savedRef.current = pipeline.description
      setDescription(pipeline.description)
    }
  }, [pipeline.description])
  useDebouncedAutosave(description, description !== pipeline.description, () => {
    savedRef.current = description
    ws.updatePipeline(pipeline.id, { description })
  })
  return (
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Describe this prompt…"
      rows={1}
      className="editor-surface px-6 py-2 text-xs text-ink-faint shrink-0 border-t border-line"
      data-test="pipeline-description"
    />
  )
}

function BlockRow({
  block,
  isFirst,
  isLast,
}: {
  block:   PromptBlock
  isFirst: boolean
  isLast:  boolean
}) {
  const ws = useWorkspace()
  const [draft, setDraft] = useState({ label: block.label, body: block.body })
  const isDirty   = draft.label !== block.label || draft.body !== block.body
  const signature = draft.label + '\u0000' + draft.body
  useDebouncedAutosave(signature, isDirty, () => {
    ws.updateBlock(block.id, { label: draft.label, body: draft.body })
  })

  return (
    <div
      className="group border border-line rounded bg-surface"
      data-test="block-row"
      data-block-id={block.id}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <div className="flex gap-0.5">
          <button
            onClick={() => ws.reorderBlock(block.id, -1)}
            disabled={isFirst}
            className="text-[11px] px-1.5 py-0.5 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="block-up"
            title="Move up"
          >↑</button>
          <button
            onClick={() => ws.reorderBlock(block.id, 1)}
            disabled={isLast}
            className="text-[11px] px-1.5 py-0.5 text-ink-faint hover:text-ink rounded disabled:opacity-30 disabled:cursor-not-allowed"
            data-test="block-down"
            title="Move down"
          >↓</button>
        </div>
        <select
          value={block.type}
          onChange={(e) => ws.updateBlock(block.id, { type: e.target.value as PromptBlockType })}
          className="text-xs text-ink-soft bg-surface border border-line rounded px-2 py-0.5 cursor-pointer"
          data-test="block-type"
        >
          {BLOCK_TYPES.map((t) => (
            // bg-surface + text-ink on <option> overrides the OS-dark
            // dropdown background that was hiding option text until hover.
            <option
              key={t}
              value={t}
              className="bg-surface text-ink"
              style={{ background: 'rgb(var(--surface))', color: 'rgb(var(--ink))' }}
            >{BLOCK_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <div className="flex-1" />
        <InlineConfirmButton
          onConfirm={() => ws.deleteBlock(block.id)}
          label="del"
          confirmLabel="confirm?"
          className="text-[10px] uppercase tracking-wider text-ink-faint hover:text-bad px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          data-test="block-delete"
        />
      </div>

      <div className="px-3 py-2 border-b border-line">
        <input
          value={draft.label}
          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          placeholder="Block label"
          className="title-input text-sm text-ink"
          data-test="block-label"
        />
      </div>

      <textarea
        value={draft.body}
        onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
        placeholder="Block content…"
        rows={8}
        className="editor-surface min-h-[12rem] px-3 py-2 text-sm text-ink"
        data-test="block-body"
      />
    </div>
  )
}
