(function () {
  'use strict'

  function requestPublish(envelope) {
    if (!window.NexusHostAdapterStub) {
      console.warn('[NostrLinkCableStub] NexusHostAdapterStub is not loaded yet.')
      return false
    }
    return window.NexusHostAdapterStub.send('nostr.publish.requested', {
      envelope,
      translationKind: 'app-data',
      nostrKind: 30078,
      note: 'Stub only. No signing or relay publication occurs.',
    })
  }

  window.NostrLinkCableStub = Object.freeze({ requestPublish })
})()

/* ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Provides a Nostr Link Cable placeholder without signing, relays, or network calls.
LOAD-BEARING: nostr.publish.requested channel, Nexus-owned Nostr boundary.
DECISIONS:
  - Nostr requests route through Nexus/Noted bridge rather than individual blocks.
  - The default future app-data kind is 30078.
  - No external calls, keys, or relay URLs are present in the stub.
OPEN: Add relay policy and remote signer configuration in BB-08 through BB-10.
VERIFY: grep this file for fetch/XMLHttpRequest/WebSocket and confirm none are present.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added Nostr Link Cable stub.
───────────────────────────────────────────────────────────── */
