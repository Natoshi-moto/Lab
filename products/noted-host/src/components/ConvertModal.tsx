import { useMemo, useState } from 'react'
import { useWorkspace } from '../context'
import { scrapToNote, scrapToBlock, inboxToNote, inboxToScrap, noteToSection } from '../utils/convert'

export type ConversionKind =
  | 'scrap-to-note'
  | 'scrap-to-block'
  | 'inbox-to-note'
  | 'inbox-to-scrap'
  | 'note-to-section'

export interface ConvertModalProps {
  kind: ConversionKind
  sourceId: string
  /** Called with targetDocId (only for 'note-to-section'; undefined otherwise). */
  onConfirm: (targetDocId?: string) => Promise<void>
  onCancel: () => void
}

const LABELS: Record<ConversionKind, string> = {
  'scrap-to-note': 'Convert Scrap → Note',
  'scrap-to-block': 'Convert Scrap → Prompt Block',
  'inbox-to-note': 'Convert Item → Note',
  'inbox-to-scrap': 'Convert Item → Scrap',
  'note-to-section': 'Convert Note → Longform Section',
}

const TARGET_LABELS: Record<ConversionKind, string> = {
  'scrap-to-note': 'Note',
  'scrap-to-block': 'Prompt Block',
  'inbox-to-note': 'Note',
  'inbox-to-scrap': 'Scrap',
  'note-to-section': 'Longform Section',
}

function compactPreview(text: string): string {
  const clean = (text || '').split('\n').map((line) => line.trim()).filter(Boolean).join(' / ')
  if (!clean) return 'No content preview'
  return clean.length > 180 ? `${clean.slice(0, 179)}…` : clean
}

export function ConvertModal({ kind, sourceId, onConfirm, onCancel }: ConvertModalProps) {
  const ws = useWorkspace()
  const [targetDocId, setTargetDocId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const docs = useMemo(() => {
    return [...ws.longformDocs]
      .filter((doc) => doc.deletedAt === undefined)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [ws.longformDocs])

  const source = useMemo(() => {
    if (kind === 'scrap-to-note' || kind === 'scrap-to-block') {
      const scrap = ws.scraps.find((item) => item.id === sourceId)
      return scrap ? { title: 'Scrap', body: scrap.body } : null
    }
    if (kind === 'inbox-to-note' || kind === 'inbox-to-scrap') {
      const item = ws.inboxItems.find((entry) => entry.id === sourceId)
      return item ? { title: item.title || 'Untitled item', body: item.body } : null
    }
    const note = ws.notes.find((item) => item.id === sourceId)
    return note ? { title: note.title || 'Untitled note', body: note.body } : null
  }, [kind, sourceId, ws.inboxItems, ws.notes, ws.scraps])

  const targetPreview = useMemo(() => {
    if (kind === 'scrap-to-note' || kind === 'scrap-to-block') {
      const scrap = ws.scraps.find((item) => item.id === sourceId)
      if (!scrap) return null
      const target = kind === 'scrap-to-note' ? scrapToNote(scrap) : scrapToBlock(scrap)
      return 'title' in target ? target.title : target.name
    }
    if (kind === 'inbox-to-note' || kind === 'inbox-to-scrap') {
      const item = ws.inboxItems.find((entry) => entry.id === sourceId)
      if (!item) return null
      const target = kind === 'inbox-to-note' ? inboxToNote(item) : inboxToScrap(item)
      return 'title' in target ? target.title : compactPreview(target.body)
    }
    const note = ws.notes.find((item) => item.id === sourceId)
    if (!note) return null
    return noteToSection(note, targetDocId || 'pending', 0).title
  }, [kind, sourceId, targetDocId, ws.inboxItems, ws.notes, ws.scraps])

  async function handleConfirm() {
    if (submitting) return
    if (kind === 'note-to-section' && !targetDocId) return
    setSubmitting(true)
    try {
      await onConfirm(kind === 'note-to-section' ? targetDocId : undefined)
    } finally {
      setSubmitting(false)
    }
  }

  const isConfirmDisabled = submitting || !source || (kind === 'note-to-section' && !targetDocId)

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4"
      data-test="convert-modal"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-line bg-surface shadow-xl">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink" data-test="convert-modal-title">
            {LABELS[kind]}
          </h2>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="rounded border border-line bg-surface-2 p-3" data-test="convert-modal-preview-source">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">Source</div>
            <div className="mt-1 text-sm font-medium text-ink">{source?.title ?? 'Missing source'}</div>
            <p className="mt-1 line-clamp-3 text-sm text-ink-soft">
              {compactPreview(source?.body ?? '')}
            </p>
          </div>

          <div className="rounded border border-line bg-surface-2 p-3" data-test="convert-modal-preview-target">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">Target</div>
            <div className="mt-1 text-sm font-medium text-ink">{TARGET_LABELS[kind]}</div>
            <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
              {targetPreview ?? 'Target preview unavailable'}
            </p>
          </div>

          {kind === 'note-to-section' && (
            <label className="block text-xs text-ink-soft">
              Longform document
              <select
                value={targetDocId}
                onChange={(e) => setTargetDocId(e.target.value)}
                className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                data-test="convert-modal-doc-picker"
              >
                <option value="">Select a longform document…</option>
                {docs.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.title || 'Untitled longform'}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            className="rounded border border-line px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-2 hover:text-ink"
            data-test="convert-modal-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded border border-accent px-3 py-1.5 text-sm text-accent hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-test="convert-modal-confirm"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  )
}
