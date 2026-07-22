# Claims and non-claims — R017 GITBRAID

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22

---

## Permanent non-claims (never expire)

1. Research proposal; `status_authority: NONE`.
2. Not a claim that GITBRAID makes any AI model smarter, more capable, or more truthful — it is external memory and retrieval scaffolding, not a weights change.
3. Not empirically validated. No baseline comparison, no ablation, no measured token savings or retrieval-quality lift has been run.
4. Not a guarantee of truth. Per `WHITEPAPER_AND_TECHSPEC.md` Section 5/10, it separates *integrity* (was a record handled honestly) from *veracity* (is the claim true) and cannot resolve veracity from inside itself. A perfectly-tagged, honestly-evidence-classed `DRAFT` claim can still be wrong.
5. Not tamper-proof — git history is tamper-*evident*, not tamper-*proof*. Force-push and history rewrite remain possible for anyone with repo access.
6. Not a cure for same-model review weakness. Role isolation (TS-9) depends on the operator actually using distinct seats; nothing structurally prevents one model reviewing itself under a different label.
7. Multi-AI agreement is not independent audit. This packet's own lineage (CPL-BRAID, CRL-BRAID, Nexus Control Plane, Pulse RAG) is four AI-drafted designs converging, not four independent verifications.
8. Proposal ≠ permission to implement.

---

## Conditional claims (only after evidence)

| Claim you might want to make later | Minimum bar |
|---|---|
| "The check-in gate actually prevents silent session-end" | `checkin-gate.yml` running in CI on a real repo for a measured period, with a logged rate of caught missing check-ins |
| "Skill-RAG retrieval improves reuse over lexical/embedding search alone" | TS-10 evaluation protocol run, `skill_reuse_success_rate` and `topological_retrieval_lift` metrics reported against the stated baselines |
| "The topology coordinate system helps retrieval" | `topological_proximity` term implemented (currently a stub, per TS-11) and A/B'd against the formula with that term zeroed out |
| "The tag notation prevents ambiguity a fresh AI would otherwise hit" | The no-collision validator (TS-3.4) has caught at least one real collision attempt in practice, not just the one fixed at design time |
| "This is faster/cheaper than re-reading the raw archive" | `active_context_tokens_per_correct_answer` measured against the naive-transcript baseline, per TS-10 |

Until these are met: describe GITBRAID as *designed to*, not *does*.

---

## Overclaim hall of shame (reject in review)

- "GITBRAID gives the AI memory" — it gives a fresh session a *retrievable external record*; the model itself remains stateless between sessions.
- "The check-in trail is tamper-proof" — see non-claim 5.
- "Skill-RAG lets the AI learn skills" — it lets an AI *retrieve a written description of a move that worked before*; nothing here is learning in the weights-update sense.
- "Four AI systems agreeing on this architecture validates it" — see non-claim 7.
- "This replaces CRL-BRAID" — it re-hosts CRL-BRAID's architecture on a different substrate; CRL-BRAID's local/offline mode remains the correct choice when no GitHub access exists.

Claude review should flag any of the above if it appears in this packet, in implementation PR descriptions, or in any status update describing R017's progress.

---

*End claims and non-claims.*
