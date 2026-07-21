import type { NexusEventEnvelope } from './nexusBridgeTypes'
import type { NostrBridgeRequest, NostrTranslationPlan } from './nostrBridgeTypes'

export function planNostrAppDataStub(envelope: NexusEventEnvelope): NostrTranslationPlan {
  return {
    id: `nostr-plan-${Date.now().toString(36)}`,
    sourceEnvelopeId: envelope.id,
    translationKind: 'app-data',
    nostrKind: 30078,
    tags: [
      ['d', `noted-nexus:${envelope.channel}:${envelope.id}`],
      ['client', 'noted-nexus-router'],
      ['channel', envelope.channel],
    ],
    content: JSON.stringify({ envelope }, null, 2),
    requiresSigning: true,
    requiresApproval: true,
  }
}

export function createNostrBridgeRequestStub(envelope: NexusEventEnvelope): NostrBridgeRequest {
  return {
    envelope,
    plan: planNostrAppDataStub(envelope),
  }
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Defines a non-publishing Nostr translation stub for future relay integration.
// LOAD-BEARING: Nexus-to-Nostr translation plan, no direct per-block Nostr publishing.
// DECISIONS:
//   - The stub uses kind 30078 as the default app-data carrier.
//   - Signing and approval are represented as required but not executed.
//   - The original Nexus envelope remains embedded for future round-trip tests.
// OPEN: Add signer policy, relay selection, encryption, and publish receipts in BB-08 through BB-10.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added Nostr bridge code stub.
// ─────────────────────────────────────────────────────────────
