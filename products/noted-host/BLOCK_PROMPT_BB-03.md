# BLOCK_PROMPT_BB-03 - Prompt Studio managed shim

You are the coding worker for **Noted Nexus Router**, working on block **BB-03 - Prompt Studio managed shim**.

The user cannot code in this session. Modify the uploaded project files directly and return a new downloadable archive when finished. Do not ask the user to run commands themselves.

## Step 1 - Load context
Read these files in full before changing anything:

1. `PROJECT_NOTES.md`
2. `CONTEXT.md`
3. `BUILD_BLOCKS.md`
4. `HANDOFF.md`
5. `BLOCK_PROMPT_BB-03.md`
6. `BASE_STUB_CODE_MAP_v0.05.md`
7. `specs/EVENT_LANGUAGE_DRAFT.md`
8. `public/nexus/bridges/nexus-event-envelope.schema.json`

Confirm that `BUILD_BLOCKS.md` says BB-03 is active. If it does not, stop.

## Context / Scope / Verify before changes
Before editing, state:

### Context
- Files loaded.
- Active block.
- Relevant `@load-bearing` constraints.

### Scope
- Wire the Prompt Studio managed shim so Prompt Studio can emit a stub `prompt.snapshot.created` event into Nexus.
- Do not create Noted prompt records yet.
- Do not add Nostr, online actions, self-evolution, or real consensus state.

### Verify
- `npm run typecheck`
- `npm run build`
- Manual smoke: Prompt Studio launches inside Nexus and can emit a stub snapshot event without breaking legacy standalone behavior.

## Block purpose
Make Prompt Studio v3 speak the Nexus event language through a managed shim while keeping persistence and Noted import stubbed.

## Allowed changes
- `public/nexus/os/blocks/apps/prompt-studio-v3.html`
- `public/nexus/os/blocks/apps/stubs/prompt-studio-managed-shim.stub.js`
- `public/nexus/os/Nexus_OS.html` only if required for loading the shim
- registry/spec docs describing the channel

## Disallowed changes
- No Noted database writes.
- No host-side prompt import implementation.
- No Nostr SDKs or relay calls.
- No changes to the managed block handshake.
- No API-key handling changes in Prompt Studio.

## Load-bearing contracts to preserve
- `@load-bearing: NEXUS_HOST_BRIDGE` inbound message type.
- `@load-bearing: NEXUS_HOST_BRIDGE_RECEIPT` receipt message type.
- `@load-bearing: Prompt Studio remains usable as a standalone HTML app`.
- `@load-bearing: prompt.snapshot.created is a proposal/event, not a Noted write`.

## Done criteria
- [ ] Prompt Studio shim loads without breaking standalone Prompt Studio.
- [ ] A stub `prompt.snapshot.created` envelope can be emitted.
- [ ] Nexus receives or logs the event through an explicit channel.
- [ ] No Noted prompt record is written yet.
- [ ] Build and typecheck pass.

## Footer rule
Every changed code file that supports comments must end with the six-field footer defined in `HANDOFF.md`. JSON, lockfiles, generated files, and binary assets are exempt.

## Return
Return a new archive named:

```text
noted_nexus_router_bb03_prompt_studio_shim_v0.07.zip
```

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines the next worker prompt for routing Prompt Studio snapshots into Nexus as events.
LOAD-BEARING: BB-03 active scope and no-host-write boundary.
DECISIONS:
  - Keeps prompt import as an event proposal until BB-04.
  - Preserves standalone Prompt Studio behavior.
  - Uses the existing shim rather than inserting direct Noted host calls.
OPEN: BB-04 will convert accepted prompt snapshot events into Noted prompt records.
VERIFY: Confirm BUILD_BLOCKS.md marks BB-03 active before use.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · created BB-03 worker prompt after BB-02 completion.
───────────────────────────────────────────────────────────── -->
