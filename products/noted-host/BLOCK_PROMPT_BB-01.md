# BLOCK_PROMPT_BB-01 - Noted Bridge Listener

You are the coding worker for **Noted Nexus Router**, working on block **BB-01 - Noted bridge listener**.

The user cannot code in this session. You must modify the uploaded project files directly and return a new downloadable archive when finished. Do not ask the user to run commands themselves.

## STEP 1 - LOAD CONTEXT

Inspect the uploaded archive. Read these files in full before changing anything:

1. `PROJECT_NOTES.md`
2. `CONTEXT.md`
3. `BUILD_BLOCKS.md`
4. `HANDOFF.md`
5. `BLOCK_PROMPT_BB-01.md`
6. `specs/NOTED_NEXUS_AI_ASSISTED_TECHNICAL_SPEC_v0.04.md`
7. `specs/LOAD_BEARING_CODE_EXCERPTS.md`

Confirm that the active block in `BUILD_BLOCKS.md` matches **BB-01**. If it does not, stop.

## STEP 2 - STATE CONTEXT / SCOPE / VERIFY

Before changing files, write:

### Context
- Files loaded.
- Active block.
- Relevant load-bearing constraints.

### Scope
- What changes.
- What does not change.
- Any unrelated files touched with justification.

### Verify planned
- Commands to run.
- Manual smoke checks.
- How forbidden features are confirmed absent.

Proceed after stating this.

## STEP 3 - IMPLEMENT THIS BLOCK

**Block purpose:** Add a host-side typed `postMessage` listener around the Nexus Router iframe so Nexus can request host actions and receive receipts.

**Allowed changes:**
- `src/studios/nexusRouter/NexusRouterStudio.tsx`
- `src/bridges/*`
- optional `src/bridges/useNexusHostBridge.ts`
- docs under `specs/` only if the implementation changes the documented bridge contract

**Disallowed changes:**
- No Noted database writes yet.
- No Prompt Studio changes.
- No Nexus OS handshake changes.
- No Nostr SDKs or network implementation.
- No online action execution.
- No UI mutation application.

**Load-bearing contracts to introduce:**
- `@load-bearing: host bridge validates envelope before acting`.
- `@load-bearing: host bridge returns receipts for all accepted/rejected host requests`.

**Done criteria:**
- [ ] Host listener is attached to the Nexus iframe seam.
- [ ] Incoming messages are minimally validated.
- [ ] Unsupported actions return rejected receipts.
- [ ] A harmless ping/diagnostic request returns success.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] No new persistence, network calls, SDKs, auth, telemetry, or online execution are added.

## STEP 4 - APPLY FOOTERS
Every new or modified comment-compatible code file must end with the six-field footer from `CONTEXT.md` and `HANDOFF.md`.

## STEP 5 - RUN VERIFICATION

Run:

```bash
npm run typecheck
npm run build
```

Manual smoke:

- Launch locally.
- Confirm `/` redirects to `/nexus-router`.
- Confirm Nexus Router iframe still loads.
- Confirm a valid diagnostic request can be answered without mutating data.

## STEP 6 - UPDATE PLANNING DOCS

Mark BB-01 complete and BB-02 active only after the implementation passes verification.

## STEP 7 - RETURN ARCHIVE

Return a new archive named:

```text
noted-nexus-router-bb-01-complete.zip
```

Do not start BB-02.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Defines the BB-01 worker instructions for adding the Noted host bridge listener.
LOAD-BEARING: one block only; no database writes, no Nostr, no online execution.
DECISIONS:
  - Starts with diagnostic host bridge behavior only.
  - Keeps Prompt Studio and Nexus OS unchanged in this block.
  - Requires receipts even for rejected requests.
OPEN: Implement in the next coding session.
VERIFY: Read with BUILD_BLOCKS.md and confirm BB-01 is active.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · created BB-01 worker prompt.
───────────────────────────────────────────────────────────── -->
