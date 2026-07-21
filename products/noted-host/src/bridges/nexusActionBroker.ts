import type { AgentAction, AgentActionResult, ActionPreview } from './nexusActionTypes'
import type { ActionReceipt } from './nexusBridgeTypes'

export type ActionBrokerDecision = 'preview-only' | 'requires-approval' | 'not-implemented'

export type ActionBrokerStubResult = {
  decision: ActionBrokerDecision
  preview: ActionPreview
  result?: AgentActionResult
}

function nowIso(): string {
  return new Date().toISOString()
}

function makeStubReceipt(action: AgentAction, ok: boolean, summary: string, error?: string): ActionReceipt {
  return {
    id: `action-receipt-${Date.now().toString(36)}`,
    actionId: action.id,
    ok,
    actor: { kind: 'noted-host', id: 'noted-host', label: 'Noted Host' },
    capability: action.capability,
    target: action.target,
    summary,
    createdAt: nowIso(),
    reversible: false,
    error,
  }
}

export function previewAgentActionStub(action: AgentAction): ActionBrokerStubResult {
  return {
    decision: action.approval === 'none' ? 'preview-only' : 'requires-approval',
    preview: {
      title: `Preview: ${action.actionType}`,
      summary: 'This is a non-effectful action broker stub. No app state, files, network, or Nostr relays are mutated.',
      warnings: action.risk === 'critical' ? ['Critical-risk actions require a future human approval gate.'] : [],
    },
  }
}

export function executeAgentActionStub(action: AgentAction): AgentActionResult {
  const receipt = makeStubReceipt(
    action,
    false,
    `Action ${action.actionType} was not executed because the action broker is stubbed.`,
    'ACTION_BROKER_STUB',
  )
  return {
    action: { ...action, state: 'failed', updatedAt: receipt.createdAt },
    receipt,
  }
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Provides non-effectful action broker stubs for future agent-controlled actions.
// LOAD-BEARING: preview-before-execute, receipt-on-refusal.
// DECISIONS:
//   - Preview and execution are separate even while execution is stubbed.
//   - Refusal returns a receipt so downstream audit flows can be built now.
//   - The stub explicitly forbids app state, network, file, and Nostr mutation.
// OPEN: Replace executeAgentActionStub with approval-gated adapters in BB-05 and BB-11.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added action broker code stubs.
// ─────────────────────────────────────────────────────────────
