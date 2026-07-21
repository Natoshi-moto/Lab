import { useEffect, useMemo, useState } from 'react'
import type { ActionReceipt, NexusActorRef, NexusEventEnvelope, NexusHostBridgeMessage } from './nexusBridgeTypes'
import { isNexusHostBridgeMessage } from './nexusBridgeTypes'
import { findNexusCapability, findNexusChannel, NEXUS_BRIDGE_PROTOCOL } from './nexusBridgeRegistry'

export type NexusBridgeLogEntry = {
  id: string
  createdAt: string
  direction: 'inbound' | 'outbound' | 'ignored' | 'rejected'
  summary: string
  channel?: string
  ok?: boolean
}

export type NexusHostBridgeState = {
  ready: boolean
  accepted: number
  rejected: number
  ignored: number
  lastReceipt?: ActionReceipt
  log: NexusBridgeLogEntry[]
}

export type NexusHostBridgeOptions = {
  getTargetWindow: () => Window | null
  maxLogEntries?: number
}

const NOTED_HOST_ACTOR: NexusActorRef = Object.freeze({
  kind: 'noted-host',
  id: 'noted-host',
  label: 'Noted Host',
})

function nowIso(): string {
  return new Date().toISOString()
}

function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

function appendLog(state: NexusHostBridgeState, entry: NexusBridgeLogEntry, maxLogEntries: number): NexusHostBridgeState {
  const log = [entry, ...state.log].slice(0, maxLogEntries)
  return { ...state, log }
}

function makeReceipt(params: {
  inbound?: NexusEventEnvelope
  ok: boolean
  summary: string
  error?: string
  capability?: string
  reversible?: boolean
}): ActionReceipt {
  return {
    id: makeId('receipt'),
    actionId: params.inbound?.id,
    ok: params.ok,
    actor: NOTED_HOST_ACTOR,
    capability: params.capability ?? params.inbound?.capability,
    target: params.inbound?.refs[0],
    summary: params.summary,
    createdAt: nowIso(),
    reversible: params.reversible ?? false,
    error: params.error,
    refs: params.inbound?.refs,
  }
}

export function createHostReceiptEnvelope(inbound: NexusEventEnvelope | undefined, receipt: ActionReceipt): NexusEventEnvelope<ActionReceipt> {
  return {
    id: makeId('host-receipt'),
    createdAt: nowIso(),
    source: NOTED_HOST_ACTOR,
    target: inbound?.source,
    kind: 'diagnostic.receipt',
    intent: receipt.ok ? 'host.bridge.receipt.ok' : 'host.bridge.receipt.failed',
    capability: receipt.capability,
    channel: 'diagnostic.receipt',
    tags: inbound ? [{ type: 'in-reply-to', value: inbound.id }] : [],
    refs: inbound?.refs ?? [],
    payload: receipt,
    policy: {
      requiresApproval: false,
      reversible: false,
      risk: receipt.ok ? 'low' : 'medium',
      capability: receipt.capability,
    },
    receipt,
  }
}

export function handleNexusEnvelopeStub(envelope: NexusEventEnvelope): ActionReceipt {
  const channel = findNexusChannel(envelope.channel)
  const capability = envelope.capability ? findNexusCapability(envelope.capability) : undefined

  if (!channel) {
    return makeReceipt({
      inbound: envelope,
      ok: false,
      summary: `Rejected unknown channel: ${envelope.channel}`,
      error: 'UNKNOWN_CHANNEL',
    })
  }

  if (envelope.capability && !capability) {
    return makeReceipt({
      inbound: envelope,
      ok: false,
      summary: `Rejected unknown capability: ${envelope.capability}`,
      error: 'UNKNOWN_CAPABILITY',
      capability: envelope.capability,
    })
  }

  if (envelope.channel === 'diagnostic.ping') {
    return makeReceipt({
      inbound: envelope,
      ok: true,
      summary: 'Host bridge diagnostic ping received. No mutation performed.',
      capability: envelope.capability ?? 'nexus.emit',
    })
  }

  return makeReceipt({
    inbound: envelope,
    ok: false,
    summary: `${envelope.channel} is registered but intentionally stubbed in this base archive.`,
    error: 'STUB_NOT_IMPLEMENTED',
    capability: envelope.capability,
  })
}

export function postReceiptToNexus(targetWindow: Window | null, inbound: NexusEventEnvelope | undefined, receipt: ActionReceipt): boolean {
  if (!targetWindow) return false
  const envelope = createHostReceiptEnvelope(inbound, receipt)
  targetWindow.postMessage(
    {
      type: NEXUS_BRIDGE_PROTOCOL.receiptMessageType,
      envelope,
    },
    '*',
  )
  return true
}

export function useNexusHostBridge(options: NexusHostBridgeOptions): NexusHostBridgeState {
  const maxLogEntries = options.maxLogEntries ?? 8
  const [state, setState] = useState<NexusHostBridgeState>({
    ready: false,
    accepted: 0,
    rejected: 0,
    ignored: 0,
    log: [],
  })

  useEffect(() => {
    setState((current) => ({
      ...current,
      ready: true,
      log: [
        {
          id: makeId('bridge-ready'),
          createdAt: nowIso(),
          direction: 'ignored' as const,
          summary: 'Host bridge listener attached; waiting for Nexus messages.',
        },
        ...current.log,
      ].slice(0, maxLogEntries),
    }))

    function onMessage(event: MessageEvent<unknown>) {
      const targetWindow = options.getTargetWindow()
      if (targetWindow && event.source !== targetWindow) {
        setState((current) =>
          appendLog(
            { ...current, ignored: current.ignored + 1 },
            {
              id: makeId('ignored'),
              createdAt: nowIso(),
              direction: 'ignored',
              summary: 'Ignored postMessage from outside the Nexus iframe.',
            },
            maxLogEntries,
          ),
        )
        return
      }

      if (!isNexusHostBridgeMessage(event.data)) {
        setState((current) => ({ ...current, ignored: current.ignored + 1 }))
        return
      }

      const message = event.data as NexusHostBridgeMessage
      const receipt = handleNexusEnvelopeStub(message.envelope)
      const sent = postReceiptToNexus(targetWindow, message.envelope, receipt)

      setState((current) => {
        const next = {
          ...current,
          accepted: receipt.ok ? current.accepted + 1 : current.accepted,
          rejected: receipt.ok ? current.rejected : current.rejected + 1,
          lastReceipt: receipt,
        }
        return appendLog(
          next,
          {
            id: makeId(receipt.ok ? 'accepted' : 'rejected'),
            createdAt: receipt.createdAt,
            direction: receipt.ok ? 'inbound' : 'rejected',
            channel: message.envelope.channel,
            ok: receipt.ok,
            summary: sent ? receipt.summary : `${receipt.summary} Receipt could not be posted back.`,
          },
          maxLogEntries,
        )
      })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [maxLogEntries, options])

  return useMemo(() => state, [state])
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Implements the host-side Nexus postMessage listener with typed validation and stub receipts.
// LOAD-BEARING: NEXUS_HOST_BRIDGE message type, receipt-before-effect behavior, iframe-source guard.
// DECISIONS:
//   - The bridge only accepts messages from the Nexus iframe contentWindow.
//   - Diagnostic ping succeeds while registered future channels return explicit stub failure receipts.
//   - Receipts are posted back to Nexus before any host data mutation exists.
// OPEN: BB-04 will route prompt import requests to Noted state after approval and schema validation.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added BB-01 host bridge listener stub.
// ─────────────────────────────────────────────────────────────
