# Noted Nexus Router - Project Notes

## One-line description
A local-first Noted workspace that hosts Nexus OS as an inner Gameboy-style router where agents, prompt tools, Nostr bridges, Pokémon/Eidolon engines, and future block apps speak one event language.

## North star
What it should feel like:
- a Gameboy cartridge shell for serious personal tools,
- a local archive that remembers everything important,
- a playful operating system for prompts, agents, and world objects,
- a disciplined AI-assisted codebase that future models can safely continue.

What it should never become:
- a junk drawer of unrelated iframes,
- an agent with hidden god-mode permissions,
- a Nostr implementation copied separately into every block,
- a self-mutating app without diffs, receipts, tests, and rollback.

## Primary user
A solo builder/operator who uses AI heavily, wants local ownership, and needs one workspace where notes, prompts, agents, experimental apps, and online actions can be organized without losing continuity.

## Final deliverable
A Fedora-friendly Electron/Vite local application archive that runs as Noted, opens `/nexus-router` by default, and contains Nexus OS as the inner router for block applications.

Done is recognized when: a clean install opens Noted, lands on Nexus Router, launches inner blocks, and completes the Prompt Studio snapshot-to-Noted receipt loop through Nexus.

## Stack (locked) @load-bearing
- Language/runtime: TypeScript, React 18, Vite 5, browser/Electron shell.
- Build tool: Vite plus existing `pack.js`.
- Test/checks: `npm run typecheck`, `npm run build`, existing Nexus OS tests where applicable.
- Storage: Noted IndexedDB for canonical workspace; block-local storage remains legacy until bridge migration.
- Allowed deps: current dependencies unless a block explicitly authorizes additions.
- Forbidden deps: new Nostr SDKs, provider SDKs, auth SDKs, telemetry SDKs, background workers, or online adapters until their block explicitly introduces them.

## Architecture direction

Folder layout:

```text
src/bridges/                    # host-side bridge types and future action broker
src/studios/nexusRouter/         # Noted-to-Nexus host route
public/nexus/os/                 # Nexus OS router/kernel and blocks
public/nexus/registry/           # machine-readable registries
public/nexus/bridges/            # JSON schemas for event/action/UI/Nostr contracts
specs/                           # whitepaper/spec/AI development doctrine
```

Core primitives:
- Noted Host Route - stable outer route into Nexus.
- Nexus Router - managed block kernel and Gameboy shell.
- Nexus Event Envelope - shared language between blocks.
- Action Broker - permissioned path from agent intent to effect.
- Receipt - durable proof of effect, error, approval, and rollback.
- Nostr Bridge - external relay translator, not per-block network code.

## Source-of-truth order @load-bearing
1. CONTEXT.md - constitution and hard constraints.
2. PROJECT_NOTES.md - product and scope decisions.
3. BUILD_BLOCKS.md - sequencing and done criteria.
4. Active block prompt - current worker instructions.
5. Existing code - observed implementation reality.
6. Specs - detailed interpretation; update if code or context supersedes them.

## Build block sequence
| ID | Name | Status |
|----|------|--------|
| BB-00 | Spec-bearing scaffold | complete |
| BB-01 | Noted bridge listener | complete |
| BB-02 | Nexus host adapter | complete |
| BB-03 | Prompt Studio managed shim | active |
| BB-04 | Prompt snapshot import | pending |
| BB-05 | Action broker dry run | pending |
| BB-06 | UI patch preview | pending |
| BB-07 | Agent action proposal | pending |
| BB-08 | Nostr identity and signer config | pending |
| BB-09 | Nostr read bridge | pending |
| BB-10 | Nostr write bridge | pending |
| BB-11 | Online action adapters | pending |
| BB-12 | Self-evolution lab | pending |
| BB-13 | Gameboy UX integration | pending |
| BB-14 | Package and audit | pending |

## Open decisions
- Encryption model for private Nostr app data - revisit at BB-08.
- Exact Noted Prompt object shape for imported snapshots - revisit at BB-04.
- Whether direct fallback routes remain in public builds - revisit at BB-14.
- Which online actions are allowed in MVP - revisit at BB-11.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines the product, scope, stack, architecture direction, and build sequence.
LOAD-BEARING: stack, source-of-truth order, Nexus-router architecture.
DECISIONS:
  - Keeps Noted as host and Nexus as router.
  - Makes the local prompt snapshot loop the first proof target.
  - Defers Nostr and online execution until local bridge contracts are proven.
OPEN: Base code stubs are present; promote them block-by-block rather than adding new parallel seams.
VERIFY: Compare against BUILD_BLOCKS.md and CONTEXT.md before each block.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · marked BB-02 complete and BB-03 active.
───────────────────────────────────────────────────────────── -->
