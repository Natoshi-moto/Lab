# Nexus Agent v0.14 scrubbed block

**Status authority:** `NONE`
**Purpose:** local research and prompt-authoring tool embedded by Noted
**Runtime mirror:** `products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html`

This asset was derived from the operator-provided
`Nexus_Agent_v0_14_patched.html`. Its embedded quine export was replaced with a
factory-empty export: no sessions, agents, overlays, provider selection, or API
keys ship in the default block. New browser-local data belongs to the operator.

The companion bridge adds an **Import prompt to Noted** control. It only sends a
proposal to the trusted parent; Noted does not write until the operator approves
the preview. The resulting prompt is written to Noted's IndexedDB `prompts`
store and a receipt is returned to the iframe.

## Network and offline limits

The HTML still loads Tailwind, Marked, Highlight.js, and KaTeX from public CDNs.
Without network access the core document may open, but styling/render helpers
can be incomplete. Model-provider requests are optional and occur only after a
user supplies their own provider configuration. This phase does not claim a
fully offline Agent bundle or a security audit of those providers/CDNs.

## Non-claims

This is not production-ready, not a wallet or value product, and does not
endorse real-world value. Research/tool outputs are not verified facts. The
Phase 2 scrub is not a full Agent security audit.
