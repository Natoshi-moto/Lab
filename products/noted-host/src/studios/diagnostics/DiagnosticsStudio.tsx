import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNexusHostBridge } from '../../bridges/nexusHostBridge'
import type { NexusHostBridgeMessage } from '../../bridges/nexusBridgeTypes'
import { ODS_P0_CASES, ODS_SUITE_VERSION, type OdsCase, type OdsCaseResult } from './odsCases'

const NEXUS_ROUTER_SRC = './nexus/os/Nexus_OS.html'

type CaseRun = {
  id: string
  result: OdsCaseResult
  started_at: string
  finished_at: string
  expected: string[]
  observed: string[]
  artifacts: Record<string, unknown>
}

type TimelineEntry = {
  t: string
  source: 'bridge' | 'ui' | 'iframe'
  level: 'info' | 'warn' | 'error'
  msg: string
  data: Record<string, unknown>
}

type NexusAdapterWindow = Window & {
  NexusHostAdapterStub?: { ping: () => boolean }
}

function isoNow(): string {
  return new Date().toISOString()
}

function buildKind(): 'dev' | 'preview' | 'pack' {
  if (import.meta.env.DEV) return 'dev'
  return window.location.protocol === 'file:' ? 'pack' : 'preview'
}

function collectEnv() {
  return {
    lab_git_head: null,
    noted_build_commit: null,
    build_kind: buildKind(),
    href: window.location.href,
    userAgent: navigator.userAgent,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    odssuite_version: ODS_SUITE_VERSION,
  }
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function redactKnownSecrets(content: string): string {
  return content
    .replace(/\b(?:sk|xai)-[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [REDACTED]')
    .replace(/\bnsec1[023456789acdefghjklmnpqrstuvwxyz]{20,}\b/gi, '[REDACTED_NSEC]')
}

function waitFor(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs
    const timer = window.setInterval(() => {
      if (predicate()) {
        window.clearInterval(timer)
        resolve()
      } else if (Date.now() >= deadline) {
        window.clearInterval(timer)
        reject(new Error('Timed out waiting for bridge state.'))
      }
    }, 50)
  })
}

export function DiagnosticsStudio(): JSX.Element {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const getTargetWindow = useCallback(() => iframeRef.current?.contentWindow ?? null, [])
  const bridge = useNexusHostBridge({ getTargetWindow, maxLogEntries: 40 })
  const bridgeRef = useRef(bridge)
  const [runs, setRuns] = useState<Record<string, CaseRun>>({})
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => { bridgeRef.current = bridge }, [bridge])

  const env = collectEnv()
  const statusText = `listening=${bridge.ready} ok=${bridge.accepted} rejected=${bridge.rejected} ignored=${bridge.ignored}`

  const record = useCallback((entry: TimelineEntry) => {
    setTimeline((current) => [...current, entry].slice(-100))
  }, [])

  const finish = useCallback((testCase: OdsCase, startedAt: string, result: OdsCaseResult, observed: string[], artifacts: Record<string, unknown> = {}) => {
    const run: CaseRun = { id: testCase.id, result, started_at: startedAt, finished_at: isoNow(), expected: testCase.expected, observed, artifacts }
    setRuns((current) => ({ ...current, [testCase.id]: run }))
    record({ t: run.finished_at, source: testCase.surface === 'bridge' ? 'bridge' : 'ui', level: result === 'PASS' ? 'info' : result === 'SKIP' ? 'warn' : 'error', msg: `${testCase.id} ${result}: ${observed.join(' ')}`, data: artifacts })
  }, [record])

  async function runCase(testCase: OdsCase) {
    const startedAt = isoNow()
    setBusy(testCase.id)
    try {
      if (testCase.ods0 === 'skip') {
        finish(testCase, startedAt, 'SKIP', ['Defined for P0; runner deferred to ODS-1.'])
        return
      }
      if (testCase.id === 'ODS-ENV-001' || testCase.id === 'ODS-PACK-001') {
        finish(testCase, startedAt, 'PASS', [`Recorded ${env.build_kind} at ${env.href}`], { env })
      } else if (testCase.id === 'ODS-HOST-001') {
        const studio = document.querySelector('[data-test="diagnostics-studio"]')
        const iframe = iframeRef.current
        const pass = Boolean(studio && iframe)
        finish(testCase, startedAt, pass ? 'PASS' : 'FAIL', [pass ? 'Diagnostics studio and router iframe are mounted.' : 'Required mount selector is missing.'], { studio: Boolean(studio), iframe: Boolean(iframe) })
      } else if (testCase.id === 'ODS-PATH-001') {
        const src = iframeRef.current?.getAttribute('src') ?? null
        finish(testCase, startedAt, src === NEXUS_ROUTER_SRC ? 'PASS' : 'FAIL', [`iframe src: ${src ?? 'missing'}`], { iframe_src: src })
      } else if (testCase.id === 'ODS-BR-001') {
        const before = bridgeRef.current.accepted
        const target = iframeRef.current?.contentWindow as NexusAdapterWindow | null
        if (!target?.NexusHostAdapterStub?.ping()) throw new Error('Nexus host adapter is not ready.')
        await waitFor(() => bridgeRef.current.accepted === before + 1)
        const receipt = bridgeRef.current.lastReceipt
        const pass = receipt?.ok === true && bridgeRef.current.accepted === before + 1
        finish(testCase, startedAt, pass ? 'PASS' : 'FAIL', [`Accepted ${before} → ${bridgeRef.current.accepted}.`, receipt?.summary ?? 'No receipt.'], { receipt })
      } else if (testCase.id === 'ODS-BR-002') {
        const before = bridgeRef.current.rejected
        let replies = 0
        const replyListener = (event: MessageEvent) => { if (event.data?.type === 'NEXUS_HOST_BRIDGE_RECEIPT') replies += 1 }
        window.addEventListener('message', replyListener)
        const message: NexusHostBridgeMessage = {
          type: 'NEXUS_HOST_BRIDGE',
          envelope: {
            id: `ods-parent-${Date.now()}`, createdAt: isoNow(),
            source: { kind: 'nexus-router', id: 'ods-parent-impersonator' },
            target: { kind: 'noted-host', id: 'noted-host' },
            kind: 'diagnostic.ping', intent: 'ods.foreign-source', capability: 'nexus.emit', channel: 'diagnostic.ping',
            tags: [], refs: [], payload: {}, policy: { requiresApproval: false, reversible: false, risk: 'low', capability: 'nexus.emit' },
          },
        }
        window.postMessage(message, '*')
        await waitFor(() => bridgeRef.current.rejected === before + 1)
        await new Promise((resolve) => window.setTimeout(resolve, 100))
        window.removeEventListener('message', replyListener)
        const receipt = bridgeRef.current.lastReceipt
        const pass = receipt?.error === 'UNTRUSTED_SOURCE' && replies === 0
        finish(testCase, startedAt, pass ? 'PASS' : 'FAIL', [`Rejected ${before} → ${bridgeRef.current.rejected}.`, `Replies to parent: ${replies}.`, receipt?.error ?? 'No receipt error.'], { receipt, replies })
      }
    } catch (error) {
      finish(testCase, startedAt, 'ERROR', [error instanceof Error ? error.message : String(error)])
    } finally {
      setBusy(null)
    }
  }

  const pack = useMemo(() => ({
    schema: 'noted.ods-pack/v1', status_authority: 'NONE', created_at: isoNow(), programme: 'NOTED_PROJECT_OS_001', checkpoint_bind: 'BGEN-CANONICAL-CHECKPOINT-001',
    env, cases_run: ODS_P0_CASES.map((testCase) => runs[testCase.id]).filter(Boolean), timeline,
    bridge: { status_text: statusText, ok_count: bridge.accepted, fail_count: bridge.rejected, last_receipts: bridge.lastReceipt ? [bridge.lastReceipt] : [] },
    console: { errors: [], warnings: [] },
    storage: { idb_db_name: 'verse-studio', idb_version: null, store_counts: {}, localStorage_keys_sample: [] },
    security_notes: ['No secrets intentionally included', 'Operator should redact API keys if other tools were open'], operator_notes: '',
    non_claims: ['This pack is diagnostic evidence, not a security audit', 'Passing ODS does not mean production readiness or sim-frame complete', 'ODS-0 does not claim full P0 coverage'],
  }), [bridge.accepted, bridge.lastReceipt, bridge.rejected, env, runs, statusText, timeline])

  function exportJson() {
    download(`ods-pack-${new Date().toISOString().replace(/[:.]/g, '-')}.json`, redactKnownSecrets(JSON.stringify(pack, null, 2)), 'application/json')
  }

  function exportMd() {
    const counts = Object.values(runs).reduce<Record<OdsCaseResult, number>>((acc, run) => ({ ...acc, [run.result]: acc[run.result] + 1 }), { PASS: 0, FAIL: 0, SKIP: 0, ERROR: 0 })
    const body = `# ODS pack summary\n\n- schema: noted.ods-pack/v1\n- status_authority: NONE\n- build: ${env.build_kind}\n- PASS: ${counts.PASS}  FAIL: ${counts.FAIL}  SKIP: ${counts.SKIP}  ERROR: ${counts.ERROR}\n\n## Non-claims\n\nODS-0 diagnostic evidence only; not a security audit, production readiness claim, Phase 2, or sim-frame.\n`
    download(`ods-pack-${new Date().toISOString().replace(/[:.]/g, '-')}.md`, redactKnownSecrets(body), 'text/markdown')
  }

  return (
    <section className="h-full min-h-0 overflow-y-auto bg-bg p-5" data-test="diagnostics-studio">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-xl border border-warn/60 bg-warn/10 p-4" data-test="ods-nonclaims">
          <div className="text-xs font-semibold uppercase tracking-widest text-warn">Operator Diagnostic Suite — research tool</div>
          <p className="mt-2 text-sm text-ink-soft">Does not authorize live funds or real-world value. Passing cases ≠ production readiness. <span className="font-mono">status_authority: NONE</span></p>
          <p className="mt-1 text-xs text-ink-faint">ODS-0 skeleton: BR-003–005 remain explicit SKIP until ODS-1.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h1 className="text-lg font-semibold">Diagnostics</h1><p className="text-xs text-ink-faint">{statusText}</p></div>
              <div className="flex gap-2"><button className="rounded border border-line px-3 py-2 text-xs hover:bg-surface-3" data-test="ods-export-json" onClick={exportJson}>Export JSON</button><button className="rounded border border-line px-3 py-2 text-xs hover:bg-surface-3" data-test="ods-export-md" onClick={exportMd}>Export MD</button></div>
            </div>
            <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2"><div><dt className="text-ink-faint">Build</dt><dd data-test="ods-env-build">{env.build_kind}</dd></div><div><dt className="text-ink-faint">Route</dt><dd className="truncate">{env.href}</dd></div><div><dt className="text-ink-faint">Viewport</dt><dd>{env.viewport.w} × {env.viewport.h}</dd></div><div><dt className="text-ink-faint">Suite</dt><dd>{env.odssuite_version}</dd></div></dl>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4"><h2 className="text-sm font-semibold">Timeline</h2><div className="mt-3 max-h-40 space-y-2 overflow-y-auto text-xs" data-test="ods-timeline">{timeline.length === 0 ? <p className="text-ink-faint">Run a case to begin.</p> : timeline.slice().reverse().map((entry, index) => <div key={`${entry.t}-${index}`} className="border-l-2 border-line pl-2"><span className="font-mono text-ink-faint">{entry.t.slice(11, 19)}</span> {entry.msg}</div>)}</div></div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-test="ods-case-catalog">
          {ODS_P0_CASES.map((testCase) => { const run = runs[testCase.id]; return <article key={testCase.id} className="rounded-xl border border-line bg-surface p-4" data-test={`ods-case-${testCase.id}`}><div className="flex items-start justify-between gap-2"><div><div className="font-mono text-[11px] text-accent">{testCase.id}</div><h2 className="mt-1 text-sm font-semibold">{testCase.title}</h2></div><span className={`rounded px-2 py-1 text-[10px] ${run?.result === 'PASS' ? 'bg-good/20 text-good' : run?.result === 'FAIL' || run?.result === 'ERROR' ? 'bg-bad/20 text-bad' : 'bg-surface-3 text-ink-faint'}`}>{run?.result ?? (testCase.ods0 === 'skip' ? 'ODS-1' : 'READY')}</span></div><p className="mt-2 text-xs text-ink-soft">{testCase.expected[0]}</p>{run && <p className="mt-2 text-xs text-ink-faint" data-test={`ods-result-${testCase.id}`}>{run.observed.join(' ')}</p>}<button className="mt-3 rounded border border-line px-3 py-1.5 text-xs hover:bg-surface-3 disabled:opacity-40" disabled={busy !== null} onClick={() => void runCase(testCase)}>{busy === testCase.id ? 'Running…' : testCase.ods0 === 'skip' ? 'Record SKIP' : 'Run case'}</button></article> })}
        </div>

        <div className="rounded-xl border border-line bg-black p-2"><div className="px-2 py-1 text-[10px] uppercase tracking-widest text-ink-faint">ODS trusted Nexus fixture</div><iframe ref={iframeRef} title="ODS Nexus Router fixture" src={NEXUS_ROUTER_SRC} className="h-48 w-full border-0" data-test="ods-nexus-router-iframe" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-same-origin" /></div>
      </div>
    </section>
  )
}
