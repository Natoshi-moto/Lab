export type NexusActorKind = 'noted-host' | 'nexus-router' | 'block' | 'agent' | 'user' | 'nostr-bridge'

export type NexusActorRef = {
  kind: NexusActorKind
  id: string
  label?: string
}

export type NexusEventKind =
  | 'prompt.snapshot.created'
  | 'prompt.snapshot.import.requested'
  | 'prompt.snapshot.imported'
  | 'agent.action.proposed'
  | 'agent.action.receipted'
  | 'ui.patch.proposed'
  | 'ui.patch.receipted'
  | 'nostr.publish.requested'
  | 'nostr.publish.receipted'
  | 'diagnostic.ping'
  | 'diagnostic.receipt'

export type NexusRef = {
  type: string
  id: string
  href?: string
  digest?: string
}

export type NexusTag = {
  type: string
  value: string
}

export type NexusPolicy = {
  requiresApproval: boolean
  reversible: boolean
  risk: 'low' | 'medium' | 'high' | 'critical'
  capability?: string
}

export type ActionReceipt = {
  id: string
  actionId?: string
  ok: boolean
  actor: NexusActorRef
  capability?: string
  target?: NexusRef
  summary: string
  createdAt: string
  reversible: boolean
  error?: string
  refs?: NexusRef[]
}

export type NexusEventEnvelope<TPayload = unknown> = {
  id: string
  createdAt: string
  source: NexusActorRef
  target?: NexusActorRef
  kind: NexusEventKind | string
  intent?: string
  capability?: string
  channel: string
  tags: NexusTag[]
  refs: NexusRef[]
  payload: TPayload
  policy: NexusPolicy
  receipt?: ActionReceipt
}

export type NexusHostBridgeMessage<TPayload = unknown> = {
  type: 'NEXUS_HOST_BRIDGE'
  envelope: NexusEventEnvelope<TPayload>
}

export type NexusHostBridgeReceiptMessage<TPayload = ActionReceipt> = {
  type: 'NEXUS_HOST_BRIDGE_RECEIPT'
  envelope: NexusEventEnvelope<TPayload>
}

export function isNexusHostBridgeMessage(value: unknown): value is NexusHostBridgeMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { type?: unknown; envelope?: unknown }
  if (candidate.type !== 'NEXUS_HOST_BRIDGE') return false
  if (!candidate.envelope || typeof candidate.envelope !== 'object') return false
  const envelope = candidate.envelope as Record<string, unknown>
  const source = envelope.source as Record<string, unknown> | null
  const policy = envelope.policy as Record<string, unknown> | null
  return (
    typeof envelope.id === 'string' && envelope.id.length > 0
    && typeof envelope.createdAt === 'string'
    && typeof envelope.channel === 'string' && envelope.channel.length > 0
    && typeof envelope.kind === 'string' && envelope.kind.length > 0
    && !!source && typeof source === 'object'
    && typeof source.kind === 'string' && typeof source.id === 'string'
    && Array.isArray(envelope.tags)
    && Array.isArray(envelope.refs)
    && !!policy && typeof policy === 'object'
    && typeof policy.requiresApproval === 'boolean'
    && typeof policy.reversible === 'boolean'
    && typeof policy.risk === 'string'
  )
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Defines shared TypeScript event types for the Noted-to-Nexus bridge.
// LOAD-BEARING: NexusEventEnvelope, NexusHostBridgeMessage, NexusHostBridgeReceiptMessage, isNexusHostBridgeMessage.
// DECISIONS:
//   - Event typing is permissive enough for legacy blocks but structured enough for validation.
//   - Policy travels with each envelope so approval and reversibility are explicit.
//   - Receipts are first-class and can be archived by Noted later.
// OPEN: Add runtime JSON schema validation after BB-01 smoke proves the message path.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added receipt message type for bridge stubs.
// ─────────────────────────────────────────────────────────────
