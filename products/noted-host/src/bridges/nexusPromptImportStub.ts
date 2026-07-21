import type { ActionReceipt, NexusEventEnvelope } from './nexusBridgeTypes'

export type PromptSnapshotPayload = {
  title?: string
  body?: string
  prompt?: string
  format?: string
  sourceBlock?: string
  snapshotId?: string
}

export type PromptImportDraft = {
  title: string
  body: string
  format: string
  sourceEnvelopeId: string
  sourceBlock: string
  createdAt: string
}

export function coercePromptImportDraft(envelope: NexusEventEnvelope<PromptSnapshotPayload>): PromptImportDraft {
  const payload = envelope.payload ?? {}
  const body = payload.body ?? payload.prompt ?? ''
  return {
    title: payload.title?.trim() || 'Imported Nexus Prompt Snapshot',
    body,
    format: payload.format ?? 'RAW',
    sourceEnvelopeId: envelope.id,
    sourceBlock: payload.sourceBlock ?? envelope.source.id,
    createdAt: new Date().toISOString(),
  }
}

export function makePromptImportStubReceipt(envelope: NexusEventEnvelope<PromptSnapshotPayload>): ActionReceipt {
  const draft = coercePromptImportDraft(envelope)
  return {
    id: `prompt-import-stub-${Date.now().toString(36)}`,
    actionId: envelope.id,
    ok: false,
    actor: { kind: 'noted-host', id: 'noted-host', label: 'Noted Host' },
    capability: 'noted.write',
    summary: `Prompt import draft prepared for "${draft.title}" but not written in this stub archive.`,
    createdAt: new Date().toISOString(),
    reversible: false,
    error: 'PROMPT_IMPORT_STUB',
    refs: envelope.refs,
  }
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Defines the future Prompt Studio snapshot-to-Noted prompt import seam without writing data.
// LOAD-BEARING: coercePromptImportDraft, no-write stub receipt.
// DECISIONS:
//   - The importer accepts both body and prompt to tolerate legacy block payloads.
//   - The source envelope id is preserved for receipt and audit threading.
//   - No Noted IndexedDB mutation exists until BB-04.
// OPEN: Connect PromptImportDraft to the real Prompt record shape in BB-04.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added prompt import code stub.
// ─────────────────────────────────────────────────────────────
