# Claude review brief — NOTED-ADVERSARY-BLOCK-001

**Status:** `PROPOSAL / AWAITING_CLAUDE_DESIGN_REVIEW / STATUS_AUTHORITY: NONE`
**Date:** 2026-07-22
**Author seat:** Claude-design (this same packet — flag if a fresh review seat is preferred instead of self-review)
**Reviewer seat:** Claude-design (parallel or fresh session; not auto-close; not implement)

---

## Mission

Review this packet for correctness, completeness, and overclaim relative to:

- `../NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md` and `ODS_SECURITY_CASES.md`
- `../NOTED_MEMBRANE_HARDENING_001/` (this packet is the human-facing proof layer for its H2 stage)
- Live code under `products/noted-host/` — the T-01/T-02/T-03/T-06 claims in `ATTACK_ROSTER.md` were checked against `NexusAgentStudio.tsx`, `nexus-agent-v0.14-scrubbed.html`, and `block-registry.json` at `main` @ `7026b66` — re-verify before acting, code may have moved.

**Do not implement.** Produce a written review: accept / amend / reject sections with reasons.

---

## Questions Claude must answer

### Q1 — Fixture safety
Is the "synthetic-only, structurally distinct from real data" design in `CLAIMS_AND_NONCLAIMS.md` actually enforceable, or does it need a stronger mechanism (e.g. a build-time check that fails if a fixture value matches a real-data shape)?

### Q2 — Attack #4 (custody fixture)
This is the highest-stakes attack in the roster — it exists specifically to connect T-01 to the R016 custody line. Does associating a security demo with not-yet-built custody work overclaim in the *other* direction (implying R016 is further along than it is)? Should the fixture instead be generic "high-value secret" rather than custody-shaped?

### Q3 — Registry honesty
Is `kind: "security-block"` sufficient to prevent this from reading as "just another block" in the UI, or does the registry/router need a distinct visual treatment (e.g. a launcher-level warning) beyond what a `kind` string alone provides?

### Q4 — Snooper coupling
`RECEIPT_SCHEMA.md` requires a live Snooper panel during interactive runs. Confirm this doesn't require building more of Snooper than `NOTED_MEMBRANE_HARDENING_001`'s `SPEC-ONLY` recommendation allows — should the receipt's Snooper contrast ship with a minimal read-only event counter only, deferring the full S0–S4 warning-law UI to Snooper's own build track?

### Q5 — Scope creep
Does anything in `ATTACK_ROSTER.md` imply new T-IDs should be appended (never renumbered) to `THREAT_MODEL.md`, or does it stay within the existing T-01/T-02/T-03/T-06/T-14 spine?

### Q6 — Adjacent freeze
`NEXT_ACTION.proposal.md` recommends freezing implementation (not design) work on R012/R013/R016 until this block ships. Confirm that recommendation's reasoning holds, or amend it.

---

## Required review output shape

```text
CLAUDE_REVIEW.md
- Verdict: ACCEPT | ACCEPT-WITH-AMENDMENTS | REJECT
- Blockers (must fix before operator ADOPT)
- Amendments (optional improvements)
- Confirmed non-claims
- Re-verified code notes (commit hash + file paths checked)
- Explicit: does NOT authorize implementation
```

---

## Forbidden reviewer moves

- Softening the "DO NOT USE FOR REAL MONEY" banner language for UX
- Closing any T-ID
- Registering the `block-registry.json` diff before the block file exists
- Claiming this block's existence is itself a security improvement
- Endorsing real-world economic value for anything it touches

---

## Grounding tip hash at handoff

- Docs tip: `7026b66` (PR #59) / hardening plan: PR #60
- Product through Phase 2: `c2bbfb8` (PR #58)
- T-01/T-03 confirmed live in code at `NexusAgentStudio.tsx:125` and `nexus-agent-v0.14-scrubbed.html:2215` as of this packet's authoring — re-verify, do not trust this line if time has passed.

---

*End Claude review brief.*
