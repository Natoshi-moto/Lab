import type { ActionReceipt, NexusEventEnvelope } from './nexusBridgeTypes'

export type NostrRelayMode = 'read' | 'write' | 'read-write'

export type NostrRelayPolicy = {
  url: string
  mode: NostrRelayMode
  enabled: boolean
}

export type NostrTranslationKind =
  | 'app-data'
  | 'public-note'
  | 'receipt'
  | 'profile-policy'

export type NostrTranslationPlan = {
  id: string
  sourceEnvelopeId: string
  translationKind: NostrTranslationKind
  nostrKind: number
  tags: string[][]
  content: string
  requiresSigning: true
  requiresApproval: boolean
}

export type UnsignedNostrEvent = {
  kind: number
  created_at: number
  tags: string[][]
  content: string
  pubkey?: string
}

export type SignedNostrEvent = UnsignedNostrEvent & {
  id: string
  pubkey: string
  sig: string
}

export type NostrPublishReceipt = ActionReceipt & {
  relays: Array<{
    url: string
    ok: boolean
    error?: string
  }>
  event?: SignedNostrEvent
}

export type NostrBridgeRequest = {
  envelope: NexusEventEnvelope
  plan: NostrTranslationPlan
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Defines Nostr translation and publish receipt types for future bridge blocks.
// LOAD-BEARING: Nexus events translate to Nostr through plans, not direct block publishing.
// DECISIONS:
//   - Plans separate event translation from signing and relay publication.
//   - Relay policy is explicit and does not belong to individual blocks.
//   - Publish results are receipts with per-relay status.
// OPEN: Add encryption and signer request types in BB-08.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added Nostr bridge type scaffold.
// ─────────────────────────────────────────────────────────────
