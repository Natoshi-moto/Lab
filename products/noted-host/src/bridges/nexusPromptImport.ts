import type { Prompt } from '../types'
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
  snapshotId?: string
  createdAt: string
}

export type PromptImportResult = {
  prompt: Prompt
  receipt: ActionReceipt
}

export type CreatePrompt = (data: Pick<Prompt, 'title'> & Partial<Pick<Prompt, 'body'>>) => Promise<Prompt>

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function coercePromptImportDraft(envelope: NexusEventEnvelope<PromptSnapshotPayload>): PromptImportDraft {
  const payload = envelope.payload ?? {}
  const body = (payload.body ?? payload.prompt ?? '').trim()
  return {
    title: payload.title?.trim() || 'Imported Nexus Prompt Snapshot',
    body,
    format: payload.format?.trim() || 'RAW',
    sourceEnvelopeId: envelope.id,
    sourceBlock: payload.sourceBlock?.trim() || envelope.source.id,
    snapshotId: payload.snapshotId?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
}

export function validatePromptImportRequest(envelope: NexusEventEnvelope<PromptSnapshotPayload>): string | undefined {
  if (envelope.channel !== 'prompt.snapshot.import.requested') return 'UNSUPPORTED_CHANNEL'
  if (envelope.capability !== 'noted.write') return 'UNSUPPORTED_CAPABILITY'
  if (!envelope.policy.requiresApproval) return 'APPROVAL_POLICY_REQUIRED'
  if (!coercePromptImportDraft(envelope).body) return 'EMPTY_PROMPT'
  return undefined
}

export async function importPromptSnapshot(
  envelope: NexusEventEnvelope<PromptSnapshotPayload>,
  createPrompt: CreatePrompt,
): Promise<PromptImportResult> {
  const error = validatePromptImportRequest(envelope)
  if (error) throw new Error(error)
  const draft = coercePromptImportDraft(envelope)
  const prompt = await createPrompt({ title: draft.title, body: draft.body })
  const createdAt = new Date().toISOString()
  return {
    prompt,
    receipt: {
      id: makeId('prompt-import-receipt'),
      actionId: envelope.id,
      ok: true,
      actor: { kind: 'noted-host', id: 'noted-host', label: 'Noted Host' },
      capability: 'noted.write',
      target: { type: 'prompt', id: prompt.id, href: '#/prompts' },
      summary: `Imported prompt "${prompt.title}" after operator approval.`,
      createdAt,
      reversible: true,
      refs: [
        ...envelope.refs,
        { type: 'source-envelope', id: draft.sourceEnvelopeId },
        ...(draft.snapshotId ? [{ type: 'prompt-snapshot', id: draft.snapshotId }] : []),
      ],
    },
  }
}
