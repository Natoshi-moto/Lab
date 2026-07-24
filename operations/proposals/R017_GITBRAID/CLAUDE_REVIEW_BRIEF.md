# Claude review brief — R017 GITBRAID

**Status:** `PROPOSAL / AWAITING_CLAUDE_DESIGN_REVIEW / STATUS_AUTHORITY: NONE`
**Date:** 2026-07-22
**Author seat:** Claude-design (this same packet — flag if a fresh review seat is preferred instead of self-review, per the same caveat R017's own `CLAIMS_AND_NONCLAIMS.md` raises about role isolation)
**Reviewer seat:** Claude-design (parallel or fresh session; not auto-close; not implement)

---

## Mission

This is a bold, deliberately unstripped draft. The instruction that produced it was explicit: build on what has potential, not only what's defensible; do not nerf the design; the strip-down happens as a separate, later pass. Review accordingly — **do not use this brief to quietly pre-strip the design.** Flag what's unvalidated (there's a lot, and `WHITEPAPER_AND_TECHSPEC.md` Section 10/TS-11 already says so), but the job here is accept/amend/reject with reasons, not soften ambition into safety.

---

## Questions Claude must answer

### Q1 — Is the container choice actually sound?

Section 6 of the whitepaper argues GitHub's own primitives (commit history, branches, Markdown rendering, Issues/PRs, Actions) already provide CPL-BRAID's temporal/privacy/format spines for free, and that CRL-BRAID's local file-native container is redundant infrastructure on top of that. Stress-test this: is there a real capability CRL-BRAID's bespoke container has that git/GitHub genuinely lacks, that this packet is glossing over?

### Q2 — Does the topology reframing hold up?

Section 3 reframes the operator's bracket notation as a genuine coordinate system (time × project × space × direction-of-thought) rather than a flat tag set. Is this a real distinction with retrieval consequences, or is it dressing up an ordinary tag vocabulary in coordinate-system language without a mechanism that actually behaves differently? TS-7's `topological_proximity` term is a stub — does the whitepaper's argument for *why* it should help survive without that term being implemented yet?

### Q3 — Skill-RAG's honesty about itself

Section 8 is flagged as "the piece of GITBRAID with the least prior art behind it and the most upside if it works." Confirm that framing is accurate rather than generous — is skill-RAG meaningfully different from CRL-BRAID's `reusable_bricks`, or is capturing successful (not just failed) moves a smaller delta than the packet presents it as?

### Q4 — Check-in gate enforceability

TS-4 makes check-in a hard PR gate via `checkin-gate.yml`. `CLAIMS_AND_NONCLAIMS.md` already admits a careless or adversarial session can skip it. Is there a stronger enforcement mechanism worth proposing, or is "visible, grep-able gap" genuinely the practical ceiling — same as CRL-BRAID's own dead-end gate admits for itself?

### Q5 — Collision and drift risk across three evidence dialects

TS-11 notes CRL-BRAID, CPL-BRAID, and GITBRAID now have three evidence-vocabulary dialects that map to each other (per TS-5) but aren't automatically kept in sync. Is this an acceptable, bounded amount of drift, or does it need a single canonical vocabulary before implementation starts?

### Q6 — Personal-content exclusion (TS-2)

The branch-privacy model states personal/financial/health-adjacent content is never auto-promoted to a public branch, as a hard exclusion. TS-11 admits this is currently a stated rule, not an automated classifier. Given some of the source material this packet was synthesized from (Pulse RAG's business-direction notes) contains exactly this kind of content, is a stated-rule-only protection sufficient for a bold draft, or is this the one place where "don't nerf it" should still yield to a concrete safeguard before Phase 1 (TS-12) ships?

### Q7 — Scope relative to the rest of the lab

Confirm R017 does not quietly expand into product/security scope. It should not touch `products/noted-host/`, should not interact with T-01…T-14, and should not be positioned as competing for priority with `NOTED_ADVERSARY_BLOCK_001`.

---

## Required review output shape

```text
CLAUDE_REVIEW.md
- Verdict: ACCEPT | ACCEPT-WITH-AMENDMENTS | REJECT
- Blockers (must fix before operator ADOPT)
- Amendments (optional improvements)
- Confirmed non-claims
- Explicit: does NOT authorize implementation
```

---

## Forbidden reviewer moves

- Quietly stripping ambition from the design under the guise of "review" — that pass comes later, explicitly, not folded into this one.
- Claiming any part of TS-7's scoring formula is validated when it is a stub.
- Treating four AI-authored source documents converging on similar ideas as independent verification of any of them.
- Approving Phase 1 (TS-12) without addressing Q6.

---

*End Claude review brief.*
