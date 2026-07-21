import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../context'
import { useFocus, useSetFocus } from '../focus/FocusContext'
import { ConvertModal, type ConversionKind } from './ConvertModal'
import { useNexusIndex, type NexusLinkInfo, type NexusRecordInfo } from '../nexus/useNexusIndex'
import type { LinkableType } from '../types'
import { jumpToSelection, ROUTE_FOR_TYPE, type JumpableKind } from '../util/navigate'
import { useRecentViews } from '../util/recentViews'

const STORAGE_KEY = 'verse-studio:nexus-panel:open'
const DEFAULT_OPEN_APPLIED_KEY = 'verse-studio:nexus-panel:default-open-applied'
const PANEL_WIDTH = 320
const STRIP_WIDTH = 28

const KIND_LABEL: Record<LinkableType, string> = {
  document: 'Doc',
  poem: 'Poem',
  longform: 'Longform',
  'longform-section': 'Section',
  build: 'Build',
  project: 'Project',
  pattern: 'Pattern',
  pipeline: 'Pipeline',
  note: 'Note',
  scrap: 'Scrap',
  'inbox-item': 'Inbox',
  prompt: 'Prompt',
}

const NAVIGABLE_TYPES = new Set<LinkableType>([
  'document', 'poem', 'longform', 'build', 'project', 'pattern', 'pipeline', 'note',
])

const CONVERSION_OPTIONS: Partial<Record<LinkableType, Array<{ kind: ConversionKind; label: string }>>> = {
  scrap: [
    { kind: 'scrap-to-note', label: 'Convert → Note' },
    { kind: 'scrap-to-block', label: 'Convert → Block' },
  ],
  'inbox-item': [
    { kind: 'inbox-to-note', label: 'Convert → Note' },
    { kind: 'inbox-to-scrap', label: 'Convert → Scrap' },
  ],
  note: [
    { kind: 'note-to-section', label: 'Convert → Section' },
  ],
}

const CONVERSION_TARGET_TYPE: Record<ConversionKind, LinkableType> = {
  'scrap-to-note': 'note',
  'scrap-to-block': 'pattern',
  'inbox-to-note': 'note',
  'inbox-to-scrap': 'scrap',
  'note-to-section': 'longform-section',
}

function isJumpable(type: LinkableType): type is JumpableKind {
  return NAVIGABLE_TYPES.has(type)
}

function formatTime(value: number | null | undefined): string {
  if (!value) return 'unknown'
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'unknown'
  }
}

function formatDateTime(value: number | null | undefined): string {
  if (!value) return 'unknown'
  try {
    return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'unknown'
  }
}

function shortCoordinate(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value).toString() : '—'
}

function sectionTitle(label: string, count?: number): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.14em] text-ink-faint mb-1.5">
      <span>{label}</span>
      {typeof count === 'number' && <span className="text-[10px] text-ink-faint">{count}</span>}
    </div>
  )
}

export function NexusPanel(): JSX.Element {
  const ws = useWorkspace()
  const focus = useFocus()
  const setFocus = useSetFocus()
  const navigate = useNavigate()
  const { views: recentViews } = useRecentViews()
  const nexus = useNexusIndex(ws, recentViews)
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const defaultOpenApplied = localStorage.getItem(DEFAULT_OPEN_APPLIED_KEY) === 'true'
      if (!defaultOpenApplied) {
        localStorage.setItem(STORAGE_KEY, 'true')
        localStorage.setItem(DEFAULT_OPEN_APPLIED_KEY, 'true')
        return true
      }

      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'false') return false
      return true
    } catch {
      return true
    }
  })
  const [lineageOpen, setLineageOpen] = useState(false)
  const [convertKind, setConvertKind] = useState<ConversionKind | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? 'true' : 'false')
    } catch {
      // Ignore storage failures; the panel still works for this session.
    }
  }, [open])

  const activeRef = focus.id && focus.type ? { id: focus.id, type: focus.type } : ws.activeRecord
  const context = useMemo(() => nexus.contextFor(activeRef), [nexus, activeRef])

  useEffect(() => {
    if (open) setLineageOpen(false)
  }, [open, context?.focus.id, context?.focus.type])

  useEffect(() => {
    setConvertKind(null)
  }, [context?.focus.id, context?.focus.type])

  const focusOrigin = focus.id && focus.type && context?.focus.id === focus.id && context.focus.type === focus.type
    ? focus.origin || 'focus'
    : context
      ? 'active record fallback'
      : null
  const focusTime = focus.id && focus.type && context?.focus.id === focus.id && context.focus.type === focus.type
    ? formatTime(focus.focusedAt)
    : null

  function focusRecord(record: { id: string; type: LinkableType }, origin = 'nexus-panel') {
    ws.setActiveRecord({ id: record.id, type: record.type })
    setFocus({ id: record.id, type: record.type, origin })
  }

  function openRecord(record: { id: string; type: LinkableType }, origin = 'nexus-panel') {
    focusRecord(record, origin)
    if (isJumpable(record.type)) {
      jumpToSelection({ kind: record.type, id: record.id })
      navigate(ROUTE_FOR_TYPE[record.type])
    }
  }

  async function confirmConvert(targetDocId?: string) {
    if (!convertKind || !context) return
    const { newId } = await ws.convertRecord({
      kind: convertKind,
      sourceId: context.focus.id,
      targetDocId,
    })
    const nextType = CONVERSION_TARGET_TYPE[convertKind]
    setConvertKind(null)
    focusRecord({ id: newId, type: nextType }, 'nexus-panel-convert')
  }

  function renderRelation(linkInfo: NexusLinkInfo): JSX.Element {
    const target = linkInfo.target
    return (
      <button
        key={linkInfo.link.id}
        type="button"
        className="w-full rounded border border-transparent px-1.5 py-1 text-left hover:border-line hover:bg-surface-3 transition-colors"
        data-test="nexus-panel-related-item"
        data-nexus-record-id={target.id}
        data-nexus-record-type={target.type}
        onClick={() => openRecord(target, 'nexus-panel-related')}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] uppercase tracking-widest text-ink-faint w-12 shrink-0">
            {KIND_LABEL[target.type] ?? '?'}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] text-ink-soft">
            {target.title}
          </span>
          {linkInfo.aiLineage && <span className="text-[9px] text-ink-faint shrink-0">AI</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2 pl-14 text-[10px] text-ink-faint">
          <span className="truncate">{linkInfo.relationship}</span>
          {linkInfo.weight !== null && <span className="shrink-0">w:{linkInfo.weight}</span>}
        </div>
      </button>
    )
  }

  const convertOptions = context ? CONVERSION_OPTIONS[context.focus.type] ?? [] : []

  return (
    <div
      className="shrink-0 flex border-l border-line bg-surface-2 n-panel-shift"
      style={{ width: open ? PANEL_WIDTH : STRIP_WIDTH }}
      data-test="nexus-panel"
      data-nexus-panel-open={open ? 'true' : 'false'}
      data-focus-hide="nexus-panel"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 shrink-0 flex flex-col items-center justify-center gap-1 text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors border-r border-line"
        data-test="nexus-panel-toggle"
        title={open ? 'Close Nexus Panel' : 'Open Nexus Panel (record context)'}
        aria-label={open ? 'Close Nexus Panel' : 'Open Nexus Panel'}
      >
        <span
          className="text-[9px] uppercase tracking-widest font-semibold"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Nexus
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="transition-transform"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }}
        >
          <path
            d="M2 4L5 7L8 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="px-3 pt-3 pb-2 border-b border-line">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Nexus
            </div>
            <div className="mt-0.5 text-[11px] text-ink-soft">
              Relational context
            </div>
          </div>

          {!context && (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-8 text-center"
              data-test="nexus-panel-empty"
            >
              <div className="text-[11px] text-ink-faint leading-relaxed">
                Select a record to expose its project, connections, tags, snapshots, canvas placements, lineage, and suggested graph moves.
              </div>
            </div>
          )}

          {context && (
            <div className="flex-1 flex flex-col divide-y divide-line">
              <div className="px-3 py-2.5" data-test="nexus-panel-identity">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-3 text-ink-faint font-medium">
                    {KIND_LABEL[context.focus.type]}
                  </span>
                  {context.focus.aiLineage && (
                    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-3 text-ink-faint">
                      AI
                    </span>
                  )}
                  {context.isOrphan && (
                    <span
                      className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-3 text-ink-faint italic"
                      data-test="nexus-panel-orphan"
                      title="No project, links, tags, or canvas placement"
                    >
                      orphan
                    </span>
                  )}
                </div>
                <div
                  className="text-sm text-ink font-medium leading-snug mt-1 line-clamp-2"
                  data-test="nexus-panel-focus-title"
                >
                  {context.focus.title || '(untitled)'}
                </div>
                {context.focus.summary && (
                  <div className="mt-1 text-[11px] text-ink-faint line-clamp-2">
                    {context.focus.summary}
                  </div>
                )}
                <div
                  className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-ink-faint"
                  data-test="nexus-panel-focus-origin"
                >
                  <span>origin: {focusOrigin}</span>
                  {focusTime && <span>focused: {focusTime}</span>}
                  {context.focus.updatedAt && <span>updated: {formatDateTime(context.focus.updatedAt)}</span>}
                </div>
              </div>

              <div className="px-3 py-2" data-test="nexus-panel-actions">
                {sectionTitle('Actions')}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className="rounded border border-line px-2 py-1 text-[11px] text-ink-soft hover:bg-surface-3 hover:text-ink"
                    data-test="nexus-panel-action-open"
                    onClick={() => openRecord(context.focus, 'nexus-panel-action-open')}
                    title={isJumpable(context.focus.type) ? 'Open in owning studio' : 'Focus this record; no direct route helper exists yet'}
                  >
                    {isJumpable(context.focus.type) ? 'Open in studio' : 'Focus record'}
                  </button>
                  {convertOptions.map((option) => (
                    <button
                      key={option.kind}
                      type="button"
                      className="rounded border border-line px-2 py-1 text-[11px] text-ink-soft hover:bg-surface-3 hover:text-ink"
                      data-test="nexus-panel-action-convert"
                      onClick={() => setConvertKind(option.kind)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {(context.project || context.focus.parentLongformId) && (
                <div className="px-3 py-2" data-test="nexus-panel-project">
                  {sectionTitle('Membership')}
                  {context.project && (
                    <button
                      type="button"
                      className="block w-full truncate rounded border border-transparent px-1.5 py-1 text-left text-xs text-ink-soft hover:border-line hover:bg-surface-3"
                      onClick={() => openRecord({ id: context.project!.id, type: 'project' }, 'nexus-panel-project')}
                    >
                      {context.project.name || '(untitled project)'}
                    </button>
                  )}
                  {context.focus.parentLongformId && (
                    <button
                      type="button"
                      className="mt-1 block w-full truncate rounded border border-transparent px-1.5 py-1 text-left text-[11px] text-ink-faint hover:border-line hover:bg-surface-3"
                      onClick={() => openRecord({ id: context.focus.parentLongformId!, type: 'longform' }, 'nexus-panel-parent-longform')}
                    >
                      inside: {context.focus.parentLongformTitle || 'Untitled longform'}
                    </button>
                  )}
                </div>
              )}

              <div className="px-3 py-2" data-test="nexus-panel-links-out">
                {sectionTitle('Connections', context.outgoing.length)}
                {context.outgoing.length === 0 ? (
                  <div className="text-[11px] text-ink-faint italic">No outgoing edges yet.</div>
                ) : (
                  <div className="space-y-1">
                    {context.outgoing.map(renderRelation)}
                  </div>
                )}
              </div>

              <div className="px-3 py-2" data-test="nexus-panel-links-in">
                {sectionTitle('Backlinks', context.incoming.length)}
                {context.incoming.length === 0 ? (
                  <div className="text-[11px] text-ink-faint italic">No inbound edges yet.</div>
                ) : (
                  <div className="space-y-1">
                    {context.incoming.map(renderRelation)}
                  </div>
                )}
              </div>

              <div className="px-3 py-2" data-test="nexus-panel-tags">
                {sectionTitle('Tags', context.tags.length)}
                {context.tags.length === 0 ? (
                  <div className="text-[11px] text-ink-faint italic">No tags attached.</div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {context.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-ink-soft"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-3 py-2" data-test="nexus-panel-canvas-placements">
                {sectionTitle('Canvas placements', context.canvasPlacements.length)}
                {context.canvasPlacements.length === 0 ? (
                  <div className="text-[11px] text-ink-faint italic">No explicit canvas tile placement found.</div>
                ) : (
                  <div className="space-y-1">
                    {context.canvasPlacements.map((placement) => (
                      <button
                        key={`${placement.projectId}:${placement.nodeId}`}
                        type="button"
                        className="w-full rounded border border-transparent px-1.5 py-1 text-left hover:border-line hover:bg-surface-3"
                        data-test="nexus-panel-canvas-placement-item"
                        onClick={() => openRecord({ id: placement.projectId, type: 'project' }, 'nexus-panel-canvas-placement')}
                      >
                        <div className="truncate text-[11px] text-ink-soft">{placement.projectName}</div>
                        <div className="text-[10px] text-ink-faint">
                          x:{shortCoordinate(placement.x)} y:{shortCoordinate(placement.y)} · {placement.nodeId}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-3 py-2" data-test="nexus-panel-lineage">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-2 text-left text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink transition-colors"
                  data-test="nexus-panel-lineage-toggle"
                  aria-expanded={lineageOpen}
                  onClick={() => setLineageOpen(value => !value)}
                >
                  <span>Lineage ({context.lineage.chain.length})</span>
                  <span className="text-[11px]" aria-hidden="true">{lineageOpen ? '−' : '+'}</span>
                </button>
                <div
                  className="mt-1 text-[11px] text-ink-faint"
                  data-test="nexus-panel-lineage-ai-assisted"
                >
                  AI-assisted: {context.lineage.currentAiLineage ? 'yes' : 'no'}
                </div>
                {context.lineage.chain.length === 0 && (
                  <div className="mt-1 text-[11px] text-ink-faint italic" data-test="nexus-panel-lineage-empty">
                    No conversion history.
                  </div>
                )}
                {lineageOpen && context.lineage.chain.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {context.lineage.chain.map((node, index) => {
                      const canFocus = Boolean(node.type && !node.deleted && !node.unresolved)
                      const body = (
                        <>
                          <span className="text-[9px] uppercase tracking-widest text-ink-faint w-24 shrink-0">
                            {node.store}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {node.title}
                            {node.deleted && <span className="text-ink-faint"> {' '}(deleted)</span>}
                            {node.aiLineage && <span className="text-ink-faint text-xs"> {' '}[AI]</span>}
                          </span>
                        </>
                      )

                      return canFocus && node.type ? (
                        <button
                          key={`${node.store}:${node.id}:${index}`}
                          type="button"
                          className="w-full flex items-center gap-2 text-left text-[11px] text-ink-soft hover:text-ink transition-colors"
                          data-test="nexus-panel-lineage-item"
                          onClick={() => openRecord({ id: node.id, type: node.type! }, 'nexus-panel-lineage')}
                        >
                          {body}
                        </button>
                      ) : (
                        <div
                          key={`${node.store}:${node.id}:${index}`}
                          className={`flex items-center gap-2 text-[11px] text-ink-soft ${node.deleted ? 'opacity-50' : ''}`}
                          data-test="nexus-panel-lineage-item"
                        >
                          {body}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="px-3 py-2" data-test="nexus-panel-snapshots">
                {sectionTitle('Snapshots', context.snapshots.length)}
                {context.snapshots.length === 0 ? (
                  <div className="text-[11px] text-ink-faint italic">No snapshots yet.</div>
                ) : (
                  <div className="space-y-1">
                    {context.snapshots.slice(0, 5).map(snap => (
                      <div key={snap.id} className="text-[11px] text-ink-soft truncate">
                        {snap.label?.trim() || '(unnamed snapshot)'}
                        <span className="ml-1 text-[10px] text-ink-faint">{formatDateTime(snap.createdAt)}</span>
                      </div>
                    ))}
                    {context.snapshots.length > 5 && (
                      <div className="text-[10px] text-ink-faint">
                        + {context.snapshots.length - 5} more in Stash
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-3 py-2" data-test="nexus-panel-suggested-links">
                {sectionTitle('Suggested connections', context.suggestions.length)}
                {context.suggestions.length === 0 ? (
                  <div className="text-[11px] text-ink-faint italic">No low-risk suggestions from shared project, tags, or recent adjacency.</div>
                ) : (
                  <div className="space-y-1">
                    {context.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="w-full rounded border border-transparent px-1.5 py-1 text-left hover:border-line hover:bg-surface-3"
                        data-test="nexus-panel-suggested-link-item"
                        data-nexus-record-id={suggestion.target.id}
                        data-nexus-record-type={suggestion.target.type}
                        onClick={() => openRecord(suggestion.target, 'nexus-panel-suggested')}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[9px] uppercase tracking-widest text-ink-faint w-12 shrink-0">
                            {KIND_LABEL[suggestion.target.type]}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11px] text-ink-soft">
                            {suggestion.target.title}
                          </span>
                        </div>
                        <div className="pl-14 text-[10px] text-ink-faint line-clamp-2">
                          {suggestion.reasons.join(' · ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {context && convertKind && (
        <ConvertModal
          kind={convertKind}
          sourceId={context.focus.id}
          onConfirm={confirmConvert}
          onCancel={() => setConvertKind(null)}
        />
      )}
    </div>
  )
}
