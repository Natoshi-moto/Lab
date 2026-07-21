import type { ActionReceipt, NexusActorRef, NexusRef } from './nexusBridgeTypes'

export type AgentActionRisk = 'low' | 'medium' | 'high' | 'critical'

export type AgentActionApproval = 'none' | 'ask-once' | 'always' | 'human-only'

export type AgentActionState =
  | 'proposed'
  | 'previewed'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'succeeded'
  | 'failed'
  | 'expired'

export type ActionPreview = {
  title: string
  summary: string
  diff?: unknown
  warnings: string[]
}

export type AgentAction<TInput = unknown> = {
  id: string
  proposedBy: NexusActorRef
  actionType: string
  capability: string
  target?: NexusRef
  input: TInput
  risk: AgentActionRisk
  approval: AgentActionApproval
  state: AgentActionState
  preview: ActionPreview
  createdAt: string
  updatedAt: string
}

export type NexusUiPatch = {
  id: string
  target: 'gameboy-shell' | 'nexus-router' | 'noted-host' | string
  scope: 'session' | 'workspace' | 'profile'
  operation: 'layout' | 'theme' | 'widget' | 'menu' | 'route' | 'macro'
  rationale: string
  preview: string
  diff?: unknown
  reversible: true
  requiresApproval: boolean
}

export type AgentActionResult = {
  action: AgentAction
  receipt: ActionReceipt
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Defines agent action and UI patch data contracts for the future action broker.
// LOAD-BEARING: AgentAction, NexusUiPatch, proposal-before-execution model.
// DECISIONS:
//   - Agent actions carry risk and approval mode as data.
//   - UI mutation is represented as reversible patches.
//   - Execution results always include receipts.
// OPEN: Implement broker state machine in BB-05.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added action and UI patch type scaffold.
// ─────────────────────────────────────────────────────────────
