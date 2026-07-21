# Noted Nexus Router - Build Blocks

## Purpose
Ordered, single-session work units. Each block is implemented by a coding AI in one session, verified, and handed forward as a new archive. The active block is the only one being worked on.

## Global rules (apply to every block) @load-bearing
- Implement only the active block. Do not start the next.
- Before any file change: state Context, Scope, Verify.
- Every changed code file ends with the six-field footer where comment-compatible.
- Do not casually change anything marked `@load-bearing`.
- Run verify commands before returning the archive.
- Update BUILD_BLOCKS.md and CONTEXT.md before returning.

## Block index
| ID | Name | Status | One-line purpose |
|----|------|--------|------------------|
| BB-00 | Spec-bearing scaffold | complete | Add docs, schemas, registries, bridge types, and planning packet. |
| BB-01 | Noted bridge listener | complete | Add a host-side typed message listener and receipt channel. |
| BB-02 | Nexus host adapter | complete | Add a Nexus-side adapter for communicating with Noted host. |
| BB-03 | Prompt Studio managed shim | active | Make Prompt Studio emit managed Nexus prompt events. |
| BB-04 | Prompt snapshot import | pending | Convert prompt snapshot events into Noted prompt records. |
| BB-05 | Action broker dry run | pending | Add proposed-action queue, preview, approval, and receipt model. |
| BB-06 | UI patch preview | pending | Add reversible UI patch preview without applying source mutations. |
| BB-07 | Agent action proposal | pending | Let the agent propose local organization actions. |
| BB-08 | Nostr identity and signer config | pending | Add Nostr relay and remote signer configuration model. |
| BB-09 | Nostr read bridge | pending | Read selected Nostr app-data events into Nexus. |
| BB-10 | Nostr write bridge | pending | Publish approved app-data events and receipts. |
| BB-11 | Online action adapters | pending | Add approval-gated online action adapters, mocks first. |
| BB-12 | Self-evolution lab | pending | Add patch proposal, diff, verify, approval, rollback receipts. |
| BB-13 | Gameboy UX integration | pending | Present actions/inventory/link/evolution flows inside shell. |
| BB-14 | Package and audit | pending | Produce final verified archive and release notes. |

---

## BB-00 - Spec-bearing scaffold

**Status:** complete

**Purpose:** Add the technical spec, planning packet, bridge types, schemas, and registries without changing runtime behavior.

**Done criteria:**
- [x] Spec exists in `specs/`.
- [x] Planning packet exists at archive root.
- [x] Bridge types exist under `src/bridges/`.
- [x] Registries and schemas exist under `public/nexus/`.
- [x] Typecheck and build pass.

---

## BB-01 - Noted bridge listener

**Status:** complete

**Purpose:** Add a host-side typed `postMessage` listener around the Nexus Router iframe so Nexus can request host actions and receive receipts.

**Allowed changes:**
- `src/studios/nexusRouter/NexusRouterStudio.tsx`
- `src/bridges/*`
- a small host bridge hook/module if needed
- tests or smoke docs for the bridge

**Disallowed changes:**
- No Nostr SDKs.
- No online execution.
- No Noted database writes yet.
- No Prompt Studio changes yet.
- No changes to Nexus managed-block handshake.

**Load-bearing contracts introduced:**
- `@load-bearing: host bridge accepts typed envelopes only`.
- `@load-bearing: host bridge returns receipts for accepted or rejected requests`.

**Verify steps:**
- `npm run typecheck`
- `npm run build`
- manual browser smoke: Nexus iframe still loads.
- console smoke: invalid message is rejected, valid ping gets receipt.

**Done criteria:**
- [x] Host listener exists.
- [x] Listener validates minimum envelope shape.
- [x] Listener returns success/failure receipt.
- [x] No host data mutation is implemented yet.
- [x] Build and typecheck pass.

---

## BB-02 - Nexus host adapter

**Status:** complete

**Purpose:** Load and wire the Nexus-side host adapter so Nexus OS can send typed bridge envelopes to Noted and consume receipts.

**Allowed changes:**
- `public/nexus/os/Nexus_OS.html`
- `public/nexus/os/bridges/noted-host-adapter.stub.js`
- `public/nexus/os/tests/*`
- docs and registries that describe the adapter

**Disallowed changes:**
- No Noted database writes.
- No Nostr network calls.
- No direct block-to-Noted communication bypassing Nexus.
- No removal of the existing managed-block handshake.

**Load-bearing contracts introduced:**
- `@load-bearing: Nexus sends host messages through NexusHostAdapterStub` until promoted.
- `@load-bearing: host receipts are consumed as data, not as direct authority to mutate`.

**Verify steps:**
- `npm run typecheck`
- `npm run build`
- manual browser smoke: Nexus iframe loads and `NexusHostAdapterStub.ping()` gets a receipt.

**Done criteria:**
- [x] Nexus OS loads the host adapter stub exactly once.
- [x] Adapter can emit `diagnostic.ping` to Noted.
- [x] Adapter can receive `diagnostic.receipt`.
- [x] Existing Nexus launch catalog still opens legacy blocks.
- [x] Build and typecheck pass.

---

## BB-03 - Prompt Studio managed shim

**Status:** active

**Purpose:** Make Prompt Studio emit managed Nexus prompt events while keeping host-side prompt import stubbed.

**Allowed changes:**
- `public/nexus/os/blocks/apps/prompt-studio-v3.html`
- `public/nexus/os/blocks/apps/stubs/prompt-studio-managed-shim.stub.js`
- registries/spec docs describing `prompt.snapshot.created`

**Disallowed changes:**
- No Noted database writes.
- No Nostr network calls.
- No real agent mutation.
- No changes to Prompt Studio API-key behavior.

**Load-bearing contracts introduced:**
- `@load-bearing: prompt.snapshot.created is an event proposal, not a Noted write`.
- `@load-bearing: Prompt Studio remains standalone-compatible`.

**Verify steps:**
- `npm run typecheck`
- `npm run build`
- manual browser smoke: Prompt Studio launches and can emit a stub snapshot event.

**Done criteria:**
- [ ] Prompt Studio shim loads without breaking standalone behavior.
- [ ] Stub snapshot event is emitted through Nexus language.
- [ ] No Noted prompt record is written yet.
- [ ] Build and typecheck pass.

---

## Deferred items
- Private Nostr encryption - revisit at BB-08.
- Real prompt import - revisit at BB-04.
- Real online adapters - revisit at BB-11.
- Agent source mutation - revisit at BB-12.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines ordered, verifiable build blocks for the router bridge and agent/Nostr roadmap.
LOAD-BEARING: one active block, sequencing, done criteria.
DECISIONS:
  - Starts with local bridge proof before Nostr.
  - Keeps online action adapters mocked before real execution.
  - Separates action broker, UI patching, and self-evolution into different blocks.
OPEN: Complete BB-03 next; Prompt Studio snapshot import remains inert until BB-04.
VERIFY: Confirm exactly one block is active and it matches CONTEXT.md.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · marked BB-02 complete and BB-03 active for v0.06.
───────────────────────────────────────────────────────────── -->
