import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../../context'
import {
  coercePromptImportDraft,
  importPromptSnapshot,
  isNexusHostBridgeMessage,
  type ActionReceipt,
  type NexusEventEnvelope,
  type PromptSnapshotPayload,
} from '../../bridges'

const NEXUS_AGENT_SRC = './nexus/nexus-agent-v0.14-scrubbed.html'
const AGENT_SCALE = 0.8
const AGENT_INVERSE_SCALE = `${100 / AGENT_SCALE}%`

type PendingImport = {
  envelope: NexusEventEnvelope<PromptSnapshotPayload>
  title: string
  body: string
}

export function NexusAgentStudio(): JSX.Element {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const ws = useWorkspace()
  const navigate = useNavigate()
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [receipt, setReceipt] = useState<ActionReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onMessage(event: MessageEvent<unknown>) {
      if (event.source !== iframeRef.current?.contentWindow || !isNexusHostBridgeMessage(event.data)) return
      const envelope = event.data.envelope as NexusEventEnvelope<PromptSnapshotPayload>
      if (envelope.channel !== 'prompt.snapshot.import.requested') return
      const draft = coercePromptImportDraft(envelope)
      setError(null)
      setReceipt(null)
      setPending({ envelope, title: draft.title, body: draft.body })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function openStandalone() {
    window.open(NEXUS_AGENT_SRC, '_blank', 'noopener,noreferrer')
  }

  async function approveImport() {
    if (!pending) return
    try {
      const result = await importPromptSnapshot(pending.envelope, ws.createPrompt)
      setReceipt(result.receipt)
      setPending(null)
      iframeRef.current?.contentWindow?.postMessage({
        type: 'NEXUS_HOST_BRIDGE_RECEIPT',
        envelope: {
          id: result.receipt.id,
          createdAt: result.receipt.createdAt,
          source: result.receipt.actor,
          target: pending.envelope.source,
          kind: 'prompt.snapshot.imported',
          intent: 'noted.prompt.import.succeeded',
          capability: 'noted.write',
          channel: 'diagnostic.receipt',
          tags: [{ type: 'in-reply-to', value: pending.envelope.id }],
          refs: result.receipt.refs ?? [],
          payload: result.receipt,
          policy: { requiresApproval: false, reversible: true, risk: 'low', capability: 'noted.write' },
          receipt: result.receipt,
        },
      }, '*')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <section className="h-full min-h-0 flex flex-col bg-bg" data-test="nexus-agent-studio">
      <header className="shrink-0 border-b border-line bg-surface/80 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">Scrubbed research tool</div>
          <h1 className="text-sm font-semibold text-ink mt-0.5">Nexus Agent v0.14</h1>
          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
            Factory-empty block. Provider keys and new sessions stay in Nexus browser storage; prompt imports require approval below.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <a href={NEXUS_AGENT_SRC} target="_blank" rel="noreferrer" className="rounded border border-line px-3 py-1.5 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors">Open tab</a>
          <button type="button" onClick={openStandalone} className="rounded border border-line bg-surface-2 px-3 py-1.5 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors">Pop out</button>
        </div>
      </header>
      {pending && (
        <aside className="shrink-0 border-b border-line bg-surface-2 px-4 py-3" data-test="prompt-import-approval">
          <div className="text-xs font-semibold text-ink">Approve prompt import?</div>
          <div className="text-xs text-ink-soft mt-1"><span className="font-medium">{pending.title}</span> · {pending.body.slice(0, 160)}{pending.body.length > 160 ? '…' : ''}</div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => void approveImport()} data-test="prompt-import-approve" className="rounded border border-accent px-3 py-1 text-xs text-accent">Approve and import</button>
            <button type="button" onClick={() => setPending(null)} data-test="prompt-import-reject" className="rounded border border-line px-3 py-1 text-xs text-ink-soft">Reject</button>
          </div>
        </aside>
      )}
      {receipt && (
        <aside className="shrink-0 border-b border-line bg-surface-2 px-4 py-2 flex items-center justify-between gap-3" data-test="prompt-import-success">
          <span className="text-xs text-good">{receipt.summary}</span>
          <button type="button" onClick={() => navigate('/prompts')} data-test="prompt-import-open-prompts" className="rounded border border-line px-3 py-1 text-xs text-ink">Open Prompts</button>
        </aside>
      )}
      {error && <div className="shrink-0 border-b border-bad px-4 py-2 text-xs text-bad" data-test="prompt-import-error">Import failed: {error}</div>}
      <div className="flex-1 min-h-0 overflow-hidden bg-black">
        <iframe
          ref={iframeRef}
          title="Nexus Agent v0.14 scrubbed"
          src={NEXUS_AGENT_SRC}
          className="block border-0 bg-black"
          style={{
            width: AGENT_INVERSE_SCALE,
            height: AGENT_INVERSE_SCALE,
            transform: `scale(${AGENT_SCALE})`,
            transformOrigin: 'top left',
          }}
          data-test="nexus-agent-iframe"
          data-agent-scale={AGENT_SCALE}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
        />
      </div>
    </section>
  )
}
