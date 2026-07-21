(function () {
  'use strict'

  const PROTOCOL = Object.freeze({
    inboundMessageType: 'NEXUS_HOST_BRIDGE',
    receiptMessageType: 'NEXUS_HOST_BRIDGE_RECEIPT',
    protocolVersion: '0.05-stub',
  })

  function nowIso() {
    return new Date().toISOString()
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }

  function makeEnvelope(channel, payload) {
    return {
      id: makeId('nexus-host-request'),
      createdAt: nowIso(),
      source: { kind: 'nexus-router', id: 'nexus-os', label: 'Nexus OS' },
      target: { kind: 'noted-host', id: 'noted-host', label: 'Noted Host' },
      kind: channel,
      intent: 'nexus.host.stub.request',
      capability: 'nexus.emit',
      channel,
      tags: [{ type: 'protocol', value: PROTOCOL.protocolVersion }],
      refs: [],
      payload: payload || {},
      policy: { requiresApproval: false, reversible: false, risk: 'low', capability: 'nexus.emit' },
    }
  }

  const listeners = new Set()
  const diagnostics = { sent: 0, receipts: 0, lastSent: null, lastReceipt: null }

  function send(channel, payload) {
    if (!window.parent || window.parent === window) return false
    const envelope = makeEnvelope(channel, payload)
    diagnostics.sent += 1
    diagnostics.lastSent = envelope
    window.parent.postMessage(
      {
        type: PROTOCOL.inboundMessageType,
        envelope,
      },
      '*',
    )
    return true
  }

  function ping() {
    return send('diagnostic.ping', { note: 'Nexus host adapter stub ping.' })
  }

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== PROTOCOL.receiptMessageType) return
    diagnostics.receipts += 1
    diagnostics.lastReceipt = event.data.envelope
    listeners.forEach(function (listener) {
      try {
        listener(event.data.envelope)
      } catch (err) {
        console.warn('[NexusHostAdapterStub] receipt listener failed', err)
      }
    })
  })

  window.NexusHostAdapterStub = Object.freeze({
    protocol: PROTOCOL,
    send,
    ping,
    onReceipt(listener) {
      listeners.add(listener)
      return function unsubscribe() {
        listeners.delete(listener)
      }
    },
    getDiagnostics() {
      return { ...diagnostics }
    },
  })
})()

/* ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Provides a Nexus-side host adapter stub that pings the Noted iframe host and tracks diagnostic receipts.
LOAD-BEARING: window.NexusHostAdapterStub, NEXUS_HOST_BRIDGE, NEXUS_HOST_BRIDGE_RECEIPT.
DECISIONS:
  - The adapter remains a stub, but BB-02 now auto-loads it from Nexus_OS.html.
  - Messages use the same envelope shape as the Noted TypeScript bridge.
  - Receipts are observable through listeners without mutating Nexus state.
OPEN: Promote this stub to a managed Nexus service only after the host receipt loop remains stable.
VERIFY: Open /nexus-router and confirm Host bridge ok increments after automatic diagnostic.ping.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added diagnostics and made the adapter ready for BB-02 auto-boot.
───────────────────────────────────────────────────────────── */
