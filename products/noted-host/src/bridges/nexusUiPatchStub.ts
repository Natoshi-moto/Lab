import type { NexusUiPatch } from './nexusActionTypes'
import type { ActionReceipt } from './nexusBridgeTypes'

export type UiPatchPreview = {
  acceptedForPreview: boolean
  patchId: string
  summary: string
  warnings: string[]
}

export function previewUiPatchStub(patch: NexusUiPatch): UiPatchPreview {
  return {
    acceptedForPreview: patch.reversible === true,
    patchId: patch.id,
    summary: `UI patch preview stub for ${patch.target}:${patch.operation}. No layout or source mutation performed.`,
    warnings: patch.requiresApproval ? ['Patch requires explicit approval before future application.'] : [],
  }
}

export function refuseUiPatchApplicationStub(patch: NexusUiPatch): ActionReceipt {
  return {
    id: `ui-patch-stub-${Date.now().toString(36)}`,
    actionId: patch.id,
    ok: false,
    actor: { kind: 'noted-host', id: 'noted-host', label: 'Noted Host' },
    capability: 'ui.patch',
    summary: `UI patch ${patch.id} was previewed only; application is not implemented in this base archive.`,
    createdAt: new Date().toISOString(),
    reversible: true,
    error: 'UI_PATCH_STUB',
  }
}

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Provides reversible UI patch preview stubs without mutating UI state or source files.
// LOAD-BEARING: preview-only UI mutation model.
// DECISIONS:
//   - Reversibility is checked even before actual patch application exists.
//   - Stub receipts make refusal visible to agents and logs.
//   - Runtime layout mutation is intentionally deferred to a separate block.
// OPEN: Add actual preview surface and rollback state in BB-06.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added UI patch code stub.
// ─────────────────────────────────────────────────────────────
