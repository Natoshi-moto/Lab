import { useEffect, useMemo, useState } from 'react'
import type { LongformDoc, LongformSection, LongformSectionStatus } from '../types'
import { downloadText, safeFilename } from '../util/download'

const AUTHOR_KEY = 'verse-studio:compile:author'

const STATUSES: LongformSectionStatus[] = ['draft', 'revise', 'final', 'cut']

const STATUS_META: Record<LongformSectionStatus, { label: string; dotClass: string }> = {
  draft:  { label: 'draft',  dotClass: 'bg-ink-faint' },
  revise: { label: 'revise', dotClass: 'bg-warn' },
  final:  { label: 'final',  dotClass: 'bg-good' },
  cut:    { label: 'cut',    dotClass: 'bg-bad' },
}

type OutputMode = 'structured' | 'prose'

type SectionSnapshot = {
  id: string
  title: string
  body: string
  wordCount: number
  status: LongformSectionStatus
  included: boolean
}

function todayIsoDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length
}

function normalizedStatus(status: LongformSection['status']): LongformSectionStatus {
  return status || 'draft'
}

function snapshotSections(sections: LongformSection[]): SectionSnapshot[] {
  return sections.map((section) => {
    const status = normalizedStatus(section.status)
    return {
      id: section.id,
      title: section.title || 'Untitled section',
      body: section.body || '',
      wordCount: countWords(section.body || ''),
      status,
      included: status !== 'cut',
    }
  })
}

function buildMarkdown({
  doc,
  sections,
  author,
  date,
  outputMode,
  includeFrontMatter,
}: {
  doc: LongformDoc
  sections: SectionSnapshot[]
  author: string
  date: string
  outputMode: OutputMode
  includeFrontMatter: boolean
}): string {
  const chunks: string[] = []

  if (includeFrontMatter) {
    chunks.push([
      '---',
      `title: ${doc.title || 'Untitled'}`,
      `author: ${author}`,
      `date: ${date}`,
      '---',
    ].join('\n'))
  }

  if (outputMode === 'structured') {
    chunks.push(sections.map((section) => `## ${section.title}\n\n${section.body}`.trimEnd()).join('\n\n'))
  } else {
    chunks.push(sections.map((section) => section.body.trim()).join('\n\n---\n\n'))
  }

  return chunks.filter(Boolean).join('\n\n').replace(/\n+$/, '\n')
}

export function CompilePanel({
  open,
  doc,
  sections,
  onClose,
  onUpdateSectionStatus,
}: {
  open: boolean
  doc: LongformDoc
  sections: LongformSection[]
  onClose: () => void
  onUpdateSectionStatus: (id: string, status: LongformSectionStatus) => Promise<void>
}) {
  const [author, setAuthor] = useState(() => {
    try { return localStorage.getItem(AUTHOR_KEY) || '' } catch { return '' }
  })
  const [date, setDate] = useState(todayIsoDate)
  const [sectionSnapshot, setSectionSnapshot] = useState<SectionSnapshot[]>([])
  const [outputMode, setOutputMode] = useState<OutputMode>('structured')
  const [includeFrontMatter, setIncludeFrontMatter] = useState(true)

  useEffect(() => {
    if (!open) return
    try { setAuthor(localStorage.getItem(AUTHOR_KEY) || '') } catch { setAuthor('') }
    setDate(todayIsoDate())
    setSectionSnapshot(snapshotSections(sections))
    // Intentional: section rows and word counts snapshot when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleAuthorChange(next: string) {
    setAuthor(next)
    try { localStorage.setItem(AUTHOR_KEY, next) } catch {}
  }

  function handleIncludeChange(id: string, included: boolean) {
    setSectionSnapshot((current) => current.map((section) => (
      section.id === id ? { ...section, included } : section
    )))
  }

  async function handleStatusChange(id: string, status: LongformSectionStatus) {
    setSectionSnapshot((current) => current.map((section) => (
      section.id === id ? { ...section, status, included: status !== 'cut' } : section
    )))
    await onUpdateSectionStatus(id, status)
  }

  const includedSections = useMemo(
    () => sectionSnapshot.filter((section) => section.included),
    [sectionSnapshot]
  )

  const includedTotalWords = useMemo(
    () => includedSections.reduce((sum, section) => sum + section.wordCount, 0),
    [includedSections]
  )

  function handleDownload() {
    const content = buildMarkdown({
      doc,
      sections: includedSections,
      author,
      date,
      outputMode,
      includeFrontMatter,
    })
    downloadText(safeFilename(doc.title || 'untitled') + '.md', content, 'text/markdown')
  }

  return (
    <aside
      className={`absolute inset-y-0 right-0 z-30 w-80 max-w-full border-l border-line bg-surface shadow-lg transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
      aria-hidden={!open}
      data-test="compile-panel"
      data-open={open ? 'true' : 'false'}
    >
      <div className="h-full flex flex-col min-h-0">
        <div className="shrink-0 border-b border-line p-3 space-y-2" data-test="compile-panel-title-row">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-ink-faint">Compile</div>
              <h2 className="text-sm font-medium text-ink truncate" title={doc.title || 'Untitled'} data-test="compile-panel-doc-title">
                {doc.title || 'Untitled'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded border border-line px-2 py-1 text-xs text-ink-soft hover:bg-surface-2 hover:text-ink"
              data-test="compile-panel-close"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
          <label className="block space-y-1 text-xs text-ink-soft" data-test="compile-panel-author-field">
            <span className="text-ink-faint">Author</span>
            <input
              value={author}
              onChange={(e) => handleAuthorChange(e.target.value)}
              className="w-full rounded border border-line bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus:border-ink-faint"
              placeholder="Author name"
              data-test="compile-panel-author-input"
            />
          </label>

          <label className="block space-y-1 text-xs text-ink-soft" data-test="compile-panel-date-field">
            <span className="text-ink-faint">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-line bg-surface-2 px-2 py-1.5 text-sm text-ink outline-none focus:border-ink-faint"
              data-test="compile-panel-date-input"
            />
          </label>

          <div className="space-y-2" data-test="compile-panel-mode-toggle">
            <div className="text-xs text-ink-faint">Output mode</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutputMode('structured')}
                className={`rounded border border-line px-2 py-1.5 text-xs ${outputMode === 'structured' ? 'bg-surface-3 text-ink' : 'bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink'}`}
                data-test="compile-panel-mode-structured"
                aria-pressed={outputMode === 'structured'}
              >
                Structured
              </button>
              <button
                type="button"
                onClick={() => setOutputMode('prose')}
                className={`rounded border border-line px-2 py-1.5 text-xs ${outputMode === 'prose' ? 'bg-surface-3 text-ink' : 'bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink'}`}
                data-test="compile-panel-mode-prose"
                aria-pressed={outputMode === 'prose'}
              >
                Prose
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 rounded border border-line bg-surface-2 px-3 py-2 text-xs text-ink-soft" data-test="compile-panel-front-matter-toggle">
            <span>Front matter</span>
            <input
              type="checkbox"
              checked={includeFrontMatter}
              onChange={(e) => setIncludeFrontMatter(e.target.checked)}
              data-test="compile-panel-front-matter-input"
            />
          </label>

          <div className="space-y-2" data-test="compile-panel-section-list">
            <div className="flex items-center justify-between text-xs text-ink-faint">
              <span>Sections</span>
              <span>{sectionSnapshot.length}</span>
            </div>
            <div className="rounded border border-line overflow-hidden">
              {sectionSnapshot.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-ink-faint" data-test="compile-panel-section-empty">
                  No sections to compile.
                </div>
              ) : (
                sectionSnapshot.map((section) => {
                  const meta = STATUS_META[section.status]
                  return (
                    <div
                      key={section.id}
                      className={`border-b border-line last:border-b-0 px-3 py-2 text-xs space-y-2 ${section.included ? 'bg-surface' : 'bg-surface-2'}`}
                      data-test="compile-panel-section-row"
                      data-section-status={section.status}
                      data-section-included={section.included ? 'true' : 'false'}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-ink-soft" title={section.title}>{section.title}</span>
                        <span className="shrink-0 text-ink-faint">{section.wordCount} words</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-ink-faint" data-test="compile-panel-section-status-pill">
                          <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} aria-hidden="true" />
                          <span>{meta.label}</span>
                        </span>
                        <select
                          value={section.status}
                          onChange={(e) => void handleStatusChange(section.id, e.target.value as LongformSectionStatus)}
                          className="min-w-0 flex-1 rounded border border-line bg-surface-2 px-2 py-1 text-xs text-ink outline-none focus:border-ink-faint"
                          data-test="compile-panel-section-status-picker"
                          aria-label={`Status for ${section.title}`}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <label className="shrink-0 inline-flex items-center gap-1 text-ink-faint" data-test="compile-panel-section-include-toggle">
                          <input
                            type="checkbox"
                            checked={section.included}
                            onChange={(e) => handleIncludeChange(section.id, e.target.checked)}
                            data-test="compile-panel-section-include-input"
                          />
                          <span>{section.included ? 'Include' : 'Exclude'}</span>
                        </label>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-line p-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-faint" data-test="compile-panel-total-word-count">
            <span>Included words</span>
            <span>{includedTotalWords}</span>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="w-full rounded border border-line bg-surface-2 px-3 py-2 text-sm text-ink hover:bg-surface-3"
            data-test="compile-panel-download"
          >
            Download Markdown
          </button>
        </div>
      </div>
    </aside>
  )
}
