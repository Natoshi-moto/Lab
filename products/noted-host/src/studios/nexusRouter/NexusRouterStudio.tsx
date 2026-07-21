import { useCallback, useRef } from 'react'
import { useNexusHostBridge } from '../../bridges/nexusHostBridge'

const NEXUS_ROUTER_SRC = './nexus/os/Nexus_OS.html'

export function NexusRouterStudio(): JSX.Element {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const getTargetWindow = useCallback(() => iframeRef.current?.contentWindow ?? null, [])
  const bridge = useNexusHostBridge({ getTargetWindow })

  function openStandalone() {
    window.open(NEXUS_ROUTER_SRC, '_blank', 'noopener,noreferrer')
  }

  const lastBridgeLine = bridge.log[0]?.summary ?? 'Waiting for Nexus bridge traffic.'

  return (
    <section className="h-full min-h-0 flex flex-col bg-bg" data-test="nexus-router-studio">
      <header className="shrink-0 border-b border-line bg-surface/80 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">Kernel router</div>
          <h1 className="text-sm font-semibold text-ink mt-0.5">Nexus Router</h1>
          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
            Noted is the host. Nexus OS is the router/kernel. Nexus Agent, Prompt Studio v3, Pokémon/Eidolon engines, and other HTML blocks launch inside the Nexus desktop.
          </p>
          <div className="mt-2 rounded border border-line bg-surface-2/70 px-2.5 py-1.5 text-[10px] text-ink-soft" data-test="nexus-host-bridge-status">
            <span className="font-semibold text-ink">Host bridge:</span>{' '}
            <span className={bridge.ready ? 'text-green-300' : 'text-ink-faint'}>{bridge.ready ? 'listening' : 'starting'}</span>
            <span className="mx-2 text-ink-faint">·</span>
            <span>ok {bridge.accepted}</span>
            <span className="mx-1 text-ink-faint">/</span>
            <span>rejected {bridge.rejected}</span>
            <span className="mx-1 text-ink-faint">/</span>
            <span>ignored {bridge.ignored}</span>
            <span className="mx-2 text-ink-faint">·</span>
            <span>{lastBridgeLine}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <a
            href={NEXUS_ROUTER_SRC}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-line px-3 py-1.5 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          >
            Open tab
          </a>
          <button
            type="button"
            onClick={openStandalone}
            className="rounded border border-line bg-surface-2 px-3 py-1.5 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          >
            Pop out
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 bg-black">
        <iframe
          title="Nexus Router"
          src={NEXUS_ROUTER_SRC}
          ref={iframeRef}
          className="block h-full w-full border-0 bg-black"
          data-test="nexus-router-iframe"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-same-origin"
        />
      </div>
    </section>
  )
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Hosts the Nexus OS iframe and attaches the BB-01 Noted-side bridge listener.
// LOAD-BEARING: /nexus-router iframe seam, Nexus Router source path, host bridge source guard.
// DECISIONS:
//   - Keeps Nexus iframe-mounted while adding a visible bridge status line.
//   - Uses iframe.contentWindow as the only trusted postMessage source for BB-01.
//   - Leaves standalone/pop-out links intact for debugging legacy block behavior.
// OPEN: BB-02 should add the Nexus-side host adapter so the iframe can send diagnostic pings natively.
// VERIFY: npm run typecheck && npm run build
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · wired host bridge listener into Nexus Router studio.
// ─────────────────────────────────────────────────────────────
