# Claude review brief — NOTED-MEMBRANE-HARDENING-001

**Status:** `PROPOSAL / AWAITING_CLAUDE_DESIGN_REVIEW / STATUS_AUTHORITY: NONE`  
**Date:** 2026-07-22  
**Author seat:** SEAT-GROK-DRIVE  
**Reviewer seat:** Claude-design (parallel design; not auto-close; not implement)

---

## Mission

Review this hardening proposal for **correctness, completeness, and overclaim** relative to:

- `../NOTED_SOVEREIGNTY_ASSAULT_001/` (especially `THREAT_MODEL.md`, `TENSION_MAP.md`, `SNOOPER_IA.md`, `ODS_SECURITY_CASES.md`, `CHARTER.md`)
- `../NOTED_STOP_THE_LINE_001/` (especially `HARD_GATES.md`, `PRODUCTIVITY_TAX.md`, `WAIVER_PROTOCOL.md`, `LIES_BY_OMISSION.md`)
- Live code under `products/noted-host/` if re-verification is needed (T-IDs say re-verify before acting)

**Do not implement.** Produce a written review: accept / amend / reject sections with reasons.

---

## Questions Claude must answer

### Q1 — Thesis

Does **mutual distrust** (host ↛ trust Agent; Agent may refuse unsafe embed; browser is real cop) improve or confuse the assault packet?  
Is “Nexus does not secure the browser” load-bearing enough, or still too soft?

### Q2 — Sequence

Is **H1 (T-06) before H2 (measurement) before H3 (tension fixes)** sound?  
Should measurement **always** precede T-06? Should H4a (export) jump the queue?

### Q3 — Tension recommendation

Is **DEFER until harness FAIL, then B-then-C** the right default recommendation?  
Name concrete failure modes of C (Agent storage, keys, sessions) this packet underweights.

### Q4 — Coverage gaps

What high-severity issues in `THREAT_MODEL.md` does this packet under-serve (T-07, T-10, T-13, …)?  
Should any new T-ID be **appended** (never renumber)?

### Q5 — Snooper placement

Confirm: SPEC-ONLY until after H2 is correct, and warning law must not be softened.  
Any additional in-product sentences required?

### Q6 — Stop-the-line interaction

Does this packet accidentally **weaken** HARD_GATES or PRODUCTIVITY_TAX?  
If yes, quote the weakening line and propose a rewrite.

### Q7 — Operator burden

Operator is non-technical (approve/reject only). Is `NEXT_ACTION.proposal.md` decision block simple enough?  
Propose a one-sentence “savage default” if clearer than Grok’s.

### Q8 — Independence

Call out any place this packet implies multi-seat agreement is proof.

---

## Required review output shape

Write under `operations/proposals/NOTED_MEMBRANE_HARDENING_001/` (or attach in PR review):

```text
CLAUDE_REVIEW.md
- Verdict: ACCEPT | ACCEPT-WITH-AMENDMENTS | REJECT
- Blockers (must fix before operator ADOPT of this plan)
- Amendments (optional improvements)
- Confirmed non-claims
- Re-verified code notes (commit hash + file paths if checked)
- Explicit: does NOT authorize implementation
```

---

## Forbidden reviewer moves

- Softening Snooper warnings for UX  
- Closing any T-ID  
- Recommending Phase 3 as natural next without HARD_GATES matrix  
- Claiming certification / production / audit complete  
- Endorsing real-world economic value  
- “I agree with Grok” without file-grounded dissent opportunities  

---

## Grounding tip hash at handoff

- Docs tip: `7026b66` (PR #59)  
- Product through Phase 2: `c2bbfb8` (PR #58)  
- Local checkout for seats: `/home/anon/Downloads/Lab` (not a partial clone missing `products/`)

---

*End Claude review brief.*
