(function () {
  'use strict'

  function value(id) {
    var element = document.getElementById(id)
    return element && typeof element.value === 'string' ? element.value.trim() : ''
  }

  function currentPrompt() {
    var overlayId = window.NEXUS && NEXUS.state && NEXUS.state.currentOverlay
    var overlay = overlayId && NEXUS.state.overlays && NEXUS.state.overlays[overlayId]
    if (overlay && overlay.content) return { title: overlay.name || 'Nexus Agent overlay', body: String(overlay.content) }
    var composer = value('nx-input') || value('nx-message-input') || value('nx-chat-input')
    return { title: 'Nexus Agent prompt snapshot', body: composer }
  }

  function sendPromptSnapshot() {
    var prompt = currentPrompt()
    if (!prompt.body) {
      if (typeof window.nxToast === 'function') window.nxToast('Write a prompt or select an overlay before importing.', 3000, 'warn')
      return
    }
    var id = 'agent-prompt-' + Date.now().toString(36)
    window.parent.postMessage({
      type: 'NEXUS_HOST_BRIDGE',
      envelope: {
        id: id,
        createdAt: new Date().toISOString(),
        source: { kind: 'agent', id: 'nexus-agent-v0.14-scrubbed', label: 'Nexus Agent v0.14' },
        target: { kind: 'noted-host', id: 'noted-host' },
        kind: 'prompt.snapshot.import.requested',
        intent: 'noted.prompt.import.requested',
        capability: 'noted.write',
        channel: 'prompt.snapshot.import.requested',
        tags: [{ type: 'source', value: 'nexus-agent' }],
        refs: [],
        payload: { title: prompt.title, body: prompt.body, format: 'RAW', sourceBlock: 'nexus-agent-v0.14-scrubbed', snapshotId: id },
        policy: { requiresApproval: true, reversible: true, risk: 'medium', capability: 'noted.write' }
      }
    }, '*')
    if (typeof window.nxToast === 'function') window.nxToast('Prompt import sent to Noted for approval.', 3000, 'ok')
  }

  function install() {
    if (window.parent === window || document.getElementById('nx-import-prompt-noted')) return
    var toolbar = document.getElementById('nx-toolbar')
    if (!toolbar) return window.setTimeout(install, 250)
    var button = document.createElement('button')
    button.id = 'nx-import-prompt-noted'
    button.type = 'button'
    button.className = 'nx-btn nx-btn-ghost'
    button.textContent = 'Import prompt to Noted'
    button.title = 'Send the current prompt to Noted for explicit operator approval'
    button.addEventListener('click', sendPromptSnapshot)
    toolbar.appendChild(button)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install)
  else install()
})()
