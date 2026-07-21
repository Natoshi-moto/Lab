# BLOCK_PROMPT_BB-02 - Nexus host adapter

You are the coding worker for **Noted Nexus Router**, working on block **BB-02 - Nexus host adapter**.

The user cannot code in this session. Modify the uploaded project files directly and return a new downloadable archive when finished. Do not ask the user to run commands themselves.

## Step 1 - Load context
Read these files in full before changing anything:

1. `PROJECT_NOTES.md`
2. `CONTEXT.md`
3. `BUILD_BLOCKS.md`
4. `HANDOFF.md`
5. `BLOCK_PROMPT_BB-02.md`
6. `specs/LOAD_BEARING_CODE_EXCERPTS.md`
7. `specs/AGENT_ACTION_AND_UI_MUTATION_SPEC.md`

Confirm that `BUILD_BLOCKS.md` says BB-02 is active. If it does not, stop.

## Context / Scope / Verify before changes
Before editing, state:

### Context
- Files loaded.
- Active block.
- Relevant `@load-bearing` constraints.

### Scope
- Load and wire the Nexus-side host adapter stub.
- Do not implement prompt import, Nostr, online actions, or real agent mutation.
- Do not remove legacy direct routes or block launcher entries.

### Verify
- `npm run typecheck`
- `npm run build`
- Manual smoke: Nexus Router loads; `NexusHostAdapterStub.ping()` can send a diagnostic envelope and receive a host receipt.

## Block purpose
Load and wire the Nexus-side host adapter so Nexus OS can send typed bridge envelopes to Noted and consume receipts.

## Allowed changes
- `public/nexus/os/Nexus_OS.html`
- `public/nexus/os/bridges/noted-host-adapter.stub.js`
- `public/nexus/os/tests/*`
- docs/registries that describe the adapter

## Disallowed changes
- No Noted database writes.
- No Nostr SDKs or network calls.
- No online actions.
- No direct block-to-Noted communication bypassing Nexus.
- No removal of the existing managed-block handshake.

## Load-bearing contracts to preserve
- `@load-bearing: /nexus-router iframe seam` from `NexusRouterStudio.tsx`.
- `@load-bearing: NEXUS_HOST_BRIDGE` inbound message type.
- `@load-bearing: NEXUS_HOST_BRIDGE_RECEIPT` receipt message type.
- `@load-bearing: receipts before effects`.

## Done criteria
- [ ] Nexus OS loads the host adapter stub exactly once.
- [ ] Adapter can emit `diagnostic.ping` to Noted.
- [ ] Adapter can receive `diagnostic.receipt`.
- [ ] Existing Nexus launch catalog still opens legacy blocks.
- [ ] Build and typecheck pass.

## Footer rule
Every changed code file that supports comments must end with the six-field footer defined in `HANDOFF.md`. JSON, lockfiles, generated files, and binary assets are exempt.

## Return
Return a new archive named:

```text
noted_nexus_router_bb02_host_adapter_v0.06.zip
```

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines the next worker prompt for wiring the Nexus-side host adapter.
LOAD-BEARING: BB-02 active scope and disallowed changes.
DECISIONS:
  - Promotes the existing host adapter stub rather than inventing a second protocol.
  - Keeps Noted data mutation out of this block.
  - Uses diagnostic ping as the first cross-frame proof.
OPEN: BB-03 will promote the Prompt Studio shim after BB-02 verifies the adapter path.
VERIFY: Confirm BUILD_BLOCKS.md marks BB-02 active before use.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · created BB-02 worker prompt.
───────────────────────────────────────────────────────────── -->
