# Noted Nexus Router - Base Code Stub Map v0.05

This archive is the base working ZIP after the spec-bearing archive. It keeps the app buildable while placing code stubs at every seam that will become load-bearing during the next implementation blocks.

## Runtime seam now active

| File | Role | Behavior now | Future block |
|---|---|---|---|
| `src/studios/nexusRouter/NexusRouterStudio.tsx` | Noted route for Nexus | Mounts iframe and displays bridge listener status | BB-02+ |
| `src/bridges/nexusHostBridge.ts` | Host bridge listener | Accepts typed messages from the Nexus iframe and returns stub receipts | BB-01 complete |
| `src/bridges/nexusBridgeRegistry.ts` | Typed channel/capability registry | Mirrors public registries for code use | BB-02+ |

## Inert future stubs

| File | Future purpose | Why it exists now |
|---|---|---|
| `src/bridges/nexusActionBroker.ts` | Agent proposal, preview, approval, execution, receipts | Prevents agent code from inventing direct action paths later |
| `src/bridges/nexusPromptImportStub.ts` | Prompt Studio snapshot to Noted Prompt import | Defines payload coercion before Noted writes exist |
| `src/bridges/nexusUiPatchStub.ts` | Reversible UI patch preview/refusal | Pins UI mutation as preview-first and reversible |
| `src/bridges/nexusNostrBridgeStub.ts` | Nexus envelope to Nostr translation plan | Pins Nostr as centralized bridge, not per-block habit |
| `public/nexus/os/bridges/noted-host-adapter.stub.js` | Nexus-side postMessage sender/receipt listener | BB-02 boot insertion target |
| `public/nexus/os/blocks/apps/stubs/prompt-studio-managed-shim.stub.js` | Prompt Studio snapshot emission | BB-03 insertion target |
| `public/nexus/os/blocks/agent/agent-action-proposal.stub.js` | Agent action proposal event helper | BB-07 insertion target |
| `public/nexus/os/blocks/ui/ui-patch-proposal.stub.js` | UI patch proposal helper | BB-06 insertion target |
| `public/nexus/os/blocks/nostr/nostr-link-cable.stub.js` | Nostr publish request helper | BB-08 through BB-10 insertion target |

## Required promotion order

```text
BB-02: Load Nexus host adapter in Nexus_OS.html
BB-03: Load Prompt Studio managed shim and emit prompt snapshots
BB-04: Convert prompt import request into Noted Prompt record
BB-05: Replace action broker refusal with dry-run approval queue
BB-06: Add UI patch preview surface
BB-07: Let Nexus Agent propose organization actions
BB-08-BB-10: Add Nostr identity, read, write through the bridge
BB-11-BB-12: Add online adapters and self-evolution lab under approval
```

## Manual diagnostic payload

After opening `/nexus-router`, BB-01 can be tested from inside the Nexus iframe console with a payload like this:

```js
parent.postMessage({
  type: 'NEXUS_HOST_BRIDGE',
  envelope: {
    id: 'manual-ping-1',
    createdAt: new Date().toISOString(),
    source: { kind: 'nexus-router', id: 'manual-console' },
    target: { kind: 'noted-host', id: 'noted-host' },
    kind: 'diagnostic.ping',
    intent: 'manual.bridge.smoke',
    capability: 'nexus.emit',
    channel: 'diagnostic.ping',
    tags: [],
    refs: [],
    payload: { hello: 'noted' },
    policy: { requiresApproval: false, reversible: false, risk: 'low', capability: 'nexus.emit' }
  }
}, '*')
```

Expected result: the Noted bridge status increments `ok`, and a `NEXUS_HOST_BRIDGE_RECEIPT` message is posted back to the iframe.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Maps every code stub added to the v0.05 base working archive.
LOAD-BEARING: stub promotion order, no direct block-to-Noted bypass.
DECISIONS:
  - Separates active BB-01 runtime seam from inert future stubs.
  - Makes future blocks promote existing stubs instead of inventing new seams.
  - Includes a manual diagnostic payload for immediate bridge smoke testing.
OPEN: Convert this map into generated archive metadata when the archive builder exists.
VERIFY: Confirm each listed file exists and npm run typecheck && npm run build pass.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · documented v0.05 code stubs.
───────────────────────────────────────────────────────────── -->
