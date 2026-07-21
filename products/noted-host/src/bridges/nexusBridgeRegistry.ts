import type { NexusEventKind } from './nexusBridgeTypes'
import type { AgentActionApproval, AgentActionRisk } from './nexusActionTypes'

export type NexusChannelDirection =
  | 'nexus-to-noted'
  | 'noted-to-nexus'
  | 'block-to-nexus'
  | 'nexus-to-nostr-bridge'

export type NexusChannelDefinition = {
  channel: NexusEventKind | string
  owner: string
  direction: NexusChannelDirection
  implementedIn: string
  mutation: 'none' | 'stub-only' | 'effectful'
}

export type NexusCapabilityDefinition = {
  id: string
  defaultApproval: AgentActionApproval
  risk: AgentActionRisk
  implementedIn: string
  effectful: boolean
}

export const NEXUS_BRIDGE_PROTOCOL = Object.freeze({
  inboundMessageType: 'NEXUS_HOST_BRIDGE',
  receiptMessageType: 'NEXUS_HOST_BRIDGE_RECEIPT',
  protocolVersion: '0.05-stub',
})

export const NEXUS_CHANNELS: readonly NexusChannelDefinition[] = Object.freeze([
  {
    channel: 'diagnostic.ping',
    owner: 'noted-host',
    direction: 'nexus-to-noted',
    implementedIn: 'BB-01',
    mutation: 'none',
  },
  {
    channel: 'diagnostic.receipt',
    owner: 'noted-host',
    direction: 'noted-to-nexus',
    implementedIn: 'BB-01',
    mutation: 'none',
  },
  {
    channel: 'prompt.snapshot.import.requested',
    owner: 'noted-host',
    direction: 'nexus-to-noted',
    implementedIn: 'BB-04',
    mutation: 'stub-only',
  },
  {
    channel: 'agent.action.proposed',
    owner: 'nexus-agent',
    direction: 'block-to-nexus',
    implementedIn: 'BB-05',
    mutation: 'stub-only',
  },
  {
    channel: 'ui.patch.proposed',
    owner: 'nexus-agent',
    direction: 'block-to-nexus',
    implementedIn: 'BB-06',
    mutation: 'stub-only',
  },
  {
    channel: 'nostr.publish.requested',
    owner: 'nexus-router',
    direction: 'nexus-to-nostr-bridge',
    implementedIn: 'BB-10',
    mutation: 'stub-only',
  },
])

export const NEXUS_CAPABILITIES: readonly NexusCapabilityDefinition[] = Object.freeze([
  { id: 'nexus.emit', defaultApproval: 'none', risk: 'low', implementedIn: 'BB-01', effectful: false },
  { id: 'noted.read', defaultApproval: 'ask-once', risk: 'medium', implementedIn: 'BB-04', effectful: false },
  { id: 'noted.write', defaultApproval: 'always', risk: 'medium', implementedIn: 'BB-04', effectful: true },
  { id: 'ui.patch', defaultApproval: 'always', risk: 'medium', implementedIn: 'BB-06', effectful: true },
  { id: 'nostr.read', defaultApproval: 'ask-once', risk: 'medium', implementedIn: 'BB-09', effectful: false },
  { id: 'nostr.sign', defaultApproval: 'human-only', risk: 'high', implementedIn: 'BB-08', effectful: true },
  { id: 'nostr.publish', defaultApproval: 'always', risk: 'high', implementedIn: 'BB-10', effectful: true },
  { id: 'online.fetch', defaultApproval: 'always', risk: 'high', implementedIn: 'BB-11', effectful: true },
  { id: 'online.send', defaultApproval: 'human-only', risk: 'critical', implementedIn: 'BB-11', effectful: true },
  { id: 'agent.evolve', defaultApproval: 'human-only', risk: 'critical', implementedIn: 'BB-12', effectful: true },
])

export function findNexusChannel(channel: string): NexusChannelDefinition | undefined {
  return NEXUS_CHANNELS.find((entry) => entry.channel === channel)
}

export function findNexusCapability(capability: string): NexusCapabilityDefinition | undefined {
  return NEXUS_CAPABILITIES.find((entry) => entry.id === capability)
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Provides in-code registry stubs for bridge channels, protocol names, and capabilities.
// LOAD-BEARING: NEXUS_BRIDGE_PROTOCOL, NEXUS_CHANNELS, NEXUS_CAPABILITIES.
// DECISIONS:
//   - Registry constants mirror public JSON registries so TypeScript code has one typed source.
//   - Future blocks change implementedIn and mutation state instead of inventing ad hoc channels.
//   - Capabilities declare approval defaults before any effectful adapter exists.
// OPEN: Generate these constants from JSON once the archive builder exists.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added bridge registry stubs.
// ─────────────────────────────────────────────────────────────
