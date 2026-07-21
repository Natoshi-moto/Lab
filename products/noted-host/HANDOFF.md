# Noted Nexus Router - Handoff

## What this project is
Noted Nexus Router is a local-first Noted workspace that embeds Nexus OS as an inner Gameboy-style router for block apps, agents, prompt tools, Nostr bridges, Pokémon/Eidolon engines, and future online actions. It is also a demonstration of AI-assisted development where the archive carries the code, specification, planning packet, registries, schemas, and verification rules.

## What this project is not
It is not a cloud SaaS, not an agent with hidden permissions, not a pile of iframes mounted directly in Noted, and not a system where each block invents its own network, storage, identity, or signing model.

## Final deliverable
A Fedora-friendly local app archive that installs and launches Noted, lands on `/nexus-router`, opens Nexus OS inside the Noted host, and routes block apps through Nexus.

Done is recognized when the Prompt Studio snapshot-to-Noted prompt receipt loop works through Nexus and the build passes the verification gate.

## Status
- **Last block completed:** BB-02 - Nexus host adapter · 2026-06-28
- **Active block:** BB-03 - Prompt Studio managed shim
- **Next block:** BB-04 - Prompt snapshot import
- **Total blocks:** 15
- **Blocks complete:** 3 of 15

## The planning files (read in this order)
1. `PROJECT_NOTES.md`
2. `CONTEXT.md`
3. `BUILD_BLOCKS.md`
4. `BLOCK_PROMPT_BB-03.md`
5. `specs/NOTED_NEXUS_AI_ASSISTED_TECHNICAL_SPEC_v0.04.md`

## How to run the project

```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

## Session protocol
Before changing files, state Context, Scope, Verify. After changing files, run checks, update planning docs, confirm footers, and return a new archive. Do not start the next block.

## If something breaks
If verification fails, do not return the archive. Fix first. If a load-bearing contract must change, stop and surface the required change before proceeding.

<!-- ─── FILE FOOTER ─────────────────────────────────────────────
SCOPE: Gives future AI or human workers the current archive status and entry protocol.
LOAD-BEARING: active block, source order, session protocol.
DECISIONS:
  - Points workers to specs after planning docs.
  - Treats BB-03 as the next executable unit.
  - Keeps the run commands minimal and current.
OPEN: Wire Prompt Studio shim in BB-03; prompt import remains stubbed until BB-04.
VERIFY: Compare status against BUILD_BLOCKS.md and CONTEXT.md.
LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · updated handoff for BB-02 completion and BB-03 activation.
───────────────────────────────────────────────────────────── -->
