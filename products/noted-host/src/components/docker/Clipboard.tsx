import { useState } from 'react'
import { useWorkspace } from '../../context'
import type { DockerClipboard } from '../../types'
import { InlineConfirmButton } from '../InlineConfirmButton'

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

export function Clipboard() {
  const ws = useWorkspace()
  const [inputVal, setInputVal] = useState('')

  const entries = [...ws.dockerClipboard].sort((a, b) => b.capturedAt - a.capturedAt)

  async function handleCapture() {
    const text = inputVal.trim()
    if (!text) return
    await ws.captureClipboard({ text, sourceLabel: 'manual' })
    setInputVal('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Input bar */}
      <div className="border-b border-line p-2 shrink-0 flex flex-col gap-1.5">
        <textarea
          data-test="clipboard-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Paste or type something to capture…"
          rows={2}
          className="editor-surface text-xs text-ink resize-none border border-line rounded px-2 py-1"
        />
        <div className="flex gap-1.5">
          <button
            data-test="clipboard-capture"
            onClick={handleCapture}
            className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-surface-3 text-ink hover:bg-surface-3/80 transition-colors"
          >
            Capture
          </button>
          <button
            data-test="clipboard-from-system"
            type="button"
            disabled
            title="System clipboard reads are disabled; copy inside Noted to capture automatically."
            className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-surface-3 text-ink-faint opacity-70 cursor-default"
          >
            Auto
          </button>
        </div>
        <span className="text-[10px] text-ink-faint">Text copied inside Noted is captured automatically.</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div
            data-test="clipboard-empty"
            className="h-full flex items-center justify-center text-xs text-ink-faint"
          >
            No copied text yet.
          </div>
        ) : (
          entries.map((entry) => (
            <ClipboardRow
              key={entry.id}
              entry={entry}
              onDelete={() => ws.removeClipboard(entry.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ClipboardRow({
  entry, onDelete
}: {
  entry: DockerClipboard
  onDelete: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(entry.text)
    } catch {}
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      data-test="clipboard-row"
      data-clipboard-id={entry.id}
      className="flex items-center gap-2 px-3 py-2 border-b border-line hover:bg-surface-3/40 group"
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs text-ink truncate">{entry.text}</div>
        <div className="text-[10px] text-ink-faint">{relativeTime(entry.capturedAt)}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          data-test="clipboard-copy"
          onClick={handleCopy}
          className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-surface-3 text-ink-soft hover:text-ink transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <InlineConfirmButton
          onConfirm={onDelete}
          label="del"
          confirmLabel="confirm?"
          data-test="clipboard-delete"
          className="text-[10px] text-ink-faint hover:text-bad px-1"
        />
      </div>
    </div>
  )
}
