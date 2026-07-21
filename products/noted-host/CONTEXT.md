# Noted Nexus Router - Context

## What this project is
Noted Nexus Router is a local-first host application that embeds Nexus OS as a router/kernel for managed blocks, AI agents, prompt tools, social/Nostr bridges, Gameboy-style UX, and experimental engines. It is also an AI-assisted development demonstration where the archive carries its own planning packet and load-bearing contract memory.

## What this project is not
It is not a cloud SaaS, not a telemetry app, not a hidden automation agent, not a pile of unrelated iframes, and not a system where every block invents its own persistence, network, signing, or action model.

## Current phase
Active block: **BB-03 - Prompt Studio managed shim**

## Constitution (non-negotiable) @load-bearing

### 1. Nexus is the router
Blocks belong inside Nexus unless a host-level reason is explicitly documented.
*Why:* Direct Noted routes for every tool turn the host into a junk drawer.

### 2. Agent acts through broker
The AI agent may propose and request actions, but effectful actions pass through the router action broker and receipts.
*Why:* Silent agent mutation destroys user trust and auditability.

### 3. Nostr is a bridge, not a block habit
Nostr integration is centralized through the Nexus bridge and signer policy.
*Why:* Per-block Nostr SDKs create fragmented identity, relay, and signing behavior.

### 4. Archive is the unit of trust
The zip must contain code, specs, planning docs, registries, schemas, and handoff state.
*Why:* Future AI workers cannot rely on previous conversation memory.

### 5. Rings govern mutation
Ring 0 and Ring 1 surfaces require explicit classification and review before mutation.
*Why:* Event, boot, trust, schema, and storage mistakes are more expensive than local UI mistakes.

### 6. Receipts for effects
Every effectful action produces a receipt or an explicit failure receipt.
*Why:* The user and future agents need durable evidence of what happened.

### 7. Reversible UI mutation
Agent-driven UI changes must be previewable, reversible, and documented.
*Why:* Adaptive UX without rollback becomes invisible state corruption.

## Resolved technical decisions @load-bearing
- `/nexus-router` is the default Noted landing route.
- Nexus OS remains iframe-mounted until a bridge contract is implemented and verified.
- Prompt Studio v3 and Nexus Agent are sovereign blocks before they are deeply merged.
- Nostr is introduced after local bridge receipts work.
- Self-evolution is implemented as patch proposal flow, not direct source rewrite.


## Active code stubs @load-bearing
- `src/bridges/nexusHostBridge.ts` — host-side postMessage listener and stub receipt channel.
- `src/bridges/nexusActionBroker.ts` — preview/refusal action broker stub.
- `src/bridges/nexusPromptImportStub.ts` — prompt import draft coercion without Noted writes.
- `src/bridges/nexusUiPatchStub.ts` — reversible UI patch preview/refusal stub.
- `src/bridges/nexusNostrBridgeStub.ts` — Nostr translation plan stub without signing or relay calls.
- `public/nexus/os/bridges/noted-host-adapter.stub.js` — Nexus-side host adapter loaded by Nexus_OS.html and auto-pings the Noted host bridge.
- `public/nexus/os/blocks/apps/stubs/prompt-studio-managed-shim.stub.js` — Prompt Studio snapshot emission shim pending BB-03 insertion.

## AI coding session protocol @load-bearing
Before file changes: state Context, Scope, Verify.
After changes: run verification, confirm footers, update planning docs, return archive.
One block per session. Do not start the next block.

## File footer format @load-bearing
Every new or modified code file that supports comments ends with the six-field footer described in HANDOFF.md. JSON, lockfiles, generated artifacts, binary files, and package manager outputs are exempt and must be listed in summaries.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines non-negotiable rules and source context for future workers.
LOAD-BEARING: constitution, current phase, session protocol, footer rule.
DECISIONS:
  - Separates router authority from host authority.
  - Requires receipts for effectful actions.
  - Freezes one-block-per-session as a continuation rule.
OPEN: Promote Prompt Studio shim in BB-03; host adapter is wired and still intentionally stubbed.
VERIFY: Ensure BUILD_BLOCKS.md has exactly one active block matching this file.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · updated current phase for BB-03 after BB-02 host adapter wiring.
───────────────────────────────────────────────────────────── -->
