---
name: lab-enter
description: Cold-start the Nexus Lab / Full Spectrum pack without inventing authority
version: 0.1.1
metadata:
  hermes:
    tags: [lab, full-spectrum, onboarding]
    category: full-spectrum-teacher
claims: [CLAIM-GEN-001, CLAIM-METH-002, CLAIM-METH-006]
status_authority: NONE
---

# lab-enter

## When to use

Use when a human or agent opens the Lab or Full Spectrum programme and needs honest orientation.

## Procedure

1. Read `operations/proposals/FULL_SPECTRUM_VISION_001/HANDOFF_ANY_AI.md`.
2. Optionally load `TASK_BOARD.json` for machine task states.
3. Read `PACK_INDEX.json` and `CLAIMS_REGISTER.md` (or `CLAIMS.json`).
4. Read current `STATUS.json` and `NEXT_ACTION.md` on the checkout tip — do not invent STATUS.
5. Run `bash operations/proposals/FULL_SPECTRUM_VISION_001/tools/verify_pack.sh` if pack integrity matters to the task.
6. State: genesis pin (`baseline-001`), pack path, `status_authority: NONE`.
7. State TENSION-001 if STATUS still lists `NO_REAL_WORLD_TOKEN_OR_ECONOMIC_VALUE`.
8. Offer **one** next task from `TASK_BOARD.json` / `tasks/TSK-FS-*` — do not start two tracks.
9. Do not merge, clear reds, or launch tokens.

## Non-claims

- Orientation is not adoption.
- Multi-AI agreement is not independence.
