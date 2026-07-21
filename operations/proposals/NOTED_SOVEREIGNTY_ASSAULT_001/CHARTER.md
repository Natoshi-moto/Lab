# Campaign charter — NOTED-SOVEREIGNTY-ASSAULT-001

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22

**Goal:** find out, with evidence, whether Noted's sovereignty/privacy claims survive contact with an adversarial pass — and fix what fails.

**Non-goals:** whole-OS network capture, keylogging, real-world value claims, softening the Snooper warning law (`SNOOPER_IA.md`), treating passing checks as `status_authority` promotion, marketing this as a certified audit.

## Waves

Each wave cites T-IDs from `THREAT_MODEL.md` — nothing here re-derives findings, only sequences work against them.

- **Wave A — Agent trust boundary** (T-01, T-02, T-03): one connected story, not three unrelated bugs — same-origin iframe + unpinned CDN + default public proxy. Highest severity, goes first.
- **Wave B — Export hygiene** (T-04, T-05, T-12): confirm what today's exports actually contain vs. what they're supposed to contain; T-12 is the baseline "clean" control to defend going forward.
- **Wave C — Cold-drop bar** (T-06, T-10): gates "strangers can unpack this without shame" — see `COLD_DROP_BAR.md`.
- **Wave D — Slow/deep** (T-07, T-13): crypto recovery-path review and the Electron shell's external-URL handling — deliberately paced, not part of the initial sprint, and T-13 is gated on first confirming the shell actually ships.
- **Wave E — Architecture hygiene** (T-08, T-09, T-14): approval-policy enforcement review, ahead of Phase 3's action broker landing.

## Seats

- **Codex** implements fixes and harnesses.
- **Claude-debugger** (`SEAT-CLAUDE-DEBUG` per `AI_ROUTING.md`, a different role from the one that wrote this charter) reproduces and ships minimal patches.
- **Grok** (`SEAT-GROK-DRIVE`) drives merge order with the operator.
- This proposal's author is a parallel design seat — proposes attack cases, reviews evidence, does not touch code, and does not sign off on closing a T-ID.

**Open question:** should `AI_ROUTING.md`'s seat map gain a fourth entry for this "parallel design / adversarial-case-proposal" role, or does it stay ad hoc per task? Not decided here — flagging for the operator.

## Evidence bar

A T-ID is not "closed" on a code-read alone. Closing requires:
1. a reproducible probe or script demonstrating the behavior (see `ODS_SECURITY_CASES.md` for the initial set),
2. the fix,
3. a re-run of the same probe showing it no longer reproduces,
4. a receipt recorded under `operations/receipts/` once authorized.

"I read it and it looks fine" is not evidence. **Sign-off on closing a T-ID belongs to the operator (or Grok-drive, with the operator) — not to whichever seat proposed or implemented the fix.**

## Win conditions

- **W1 (cold-drop shame-free):** `COLD_DROP_BAR.md` all-pass or explicitly disclosed, no silent gaps.
- **W2 (Agent gate holds):** Wave A probes run against the current build, results recorded pass/fail either way.
- **W3 (ODS security suite exists):** `ODS_SECURITY_CASES.md` cases implemented as real `odsCases.ts` / harness entries, runnable the same way as existing ODS suites.
- **W4 (Snooper v1 ships correctly scoped):** `SNOOPER_IA.md` implemented with the warning law intact and its coverage gap (doesn't see T-01/T-02/T-03-style non-bridge exfiltration) documented in-product, not just in this folder.
- **W5 (no silent regression):** every T-ID closed via an ODS-SEC case is re-run automatically whenever the Agent HTML is regenerated/re-scrubbed or the bridge registry changes — a closed finding that quietly reopens on the next rebuild is worse than one that was never tested.

## Non-claim

Multi-model adversarial review is not a penetration test, not a security audit, not a certification. `status_authority: NONE`, permanently attached to this charter and everything it produces.
