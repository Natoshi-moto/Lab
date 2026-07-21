(function () {
  'use strict'

  function proposeThemePatch(target, rationale) {
    if (!window.NexusHostAdapterStub) {
      console.warn('[UiPatchProposalStub] NexusHostAdapterStub is not loaded yet.')
      return false
    }
    return window.NexusHostAdapterStub.send('ui.patch.proposed', {
      id: `ui-patch-${Date.now().toString(36)}`,
      target: target || 'gameboy-shell',
      scope: 'session',
      operation: 'theme',
      rationale: rationale || 'Stub theme patch proposal.',
      preview: 'No visual mutation in stub mode.',
      reversible: true,
      requiresApproval: true,
    })
  }

  window.UiPatchProposalStub = Object.freeze({ proposeThemePatch })
})()

/* ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Provides a UI patch proposal stub for future adaptive interface work.
LOAD-BEARING: ui.patch.proposed channel, reversible patch requirement.
DECISIONS:
  - UI mutation begins as a proposal, not a direct DOM rewrite.
  - Scope defaults to session so early patches are reversible and low blast-radius.
  - Approval is required even while the adapter is only a stub.
OPEN: Build visible patch preview and rollback controls in BB-06.
VERIFY: After BB-06, propose a patch and confirm preview-only behavior.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added UI patch proposal stub.
───────────────────────────────────────────────────────────── */
