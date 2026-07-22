# R017 GITBRAID — GitHub-native topological continuity & skill-RAG architecture

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22
**Seat:** Claude-design (author of this packet; does not implement; does not authorize)
**Round:** R017 (research track — see `operations/proposals/R012`–`R016` for prior rounds in this numbering line; this is not a NOTED_/Nexus product-feature proposal)
**Grounded against:** `main` @ `7026b66` (Lab repo tip at authoring time)

---

## What this is

R017 is a bold-draft research proposal for a **check-in and continuity system for AI research sessions**, hosted directly on GitHub rather than a bespoke local container. It answers the original brief in one sentence:

> An agent must check into a shared, tagged, private-by-default record after finishing any job, so a fresh AI session can pick up the trail without re-reading everything that came before it.

It is not original from a blank page. It is a synthesis of four architectures the operator already has drafted on this machine, none of which currently talk to each other or live where the work already happens:

| Source | Solved | Where it lives today |
|---|---|---|
| CPL-BRAID v1.0 | Certainty conservation across stateless sessions | `nexus_consolidated/` |
| CRL-BRAID v0.1 | Dead-end discipline, evidence classes, role-isolated review | `~/Downloads/CRL_BRAID_Technical_Spec_v0_1.md` |
| Nexus Control Plane | Job/Receipt accountability, permission model | `~/Downloads/NEXUS_CONTROL_PLANE_MASTER_PLAN.md` |
| Pulse RAG 24k | Retrieval economy — pull small, absorb, stop | `NEXUS_ORGANIZED/02_whitepapers_and_design/` |

R017 adds two pieces none of the four have: the operator's own **topological tag notation** (time × project × space × direction-of-thought, formalized with its `[bE]` collision fixed and a real compound-tag grammar), and a **skill-RAG** layer that extends CRL-BRAID's failure-only "reusable bricks" into a retrievable library of reasoning moves that worked, ranked the same way CRL-BRAID ranks route bundles.

---

## Read order

| # | File | Job |
|---|------|-----|
| 0 | **This README** | Orientation |
| 1 | `WHITEPAPER_AND_TECHSPEC.md` | Full design — Part I whitepaper, Part II technical specification |
| 2 | `CLAIMS_AND_NONCLAIMS.md` | What R017 is and isn't allowed to claim about itself |
| 3 | `CLAUDE_REVIEW_BRIEF.md` | What a review seat should accept/reject/amend before build |
| 4 | `NEXT_ACTION.proposal.md` | Operator decisions |
| 5 | `STATUS.proposal.json` | Proposal-only status block |

---

## Posture

This is deliberately the **unstripped** version. Per the operator's explicit instruction, it builds on what has potential rather than only what's immediately defensible, and does not pre-nerf the design to look safer than it is. The strip-down pass is a separate, later step — this packet is what gets stripped, not the result of stripping.

That said, it is not silent about its own gaps. `WHITEPAPER_AND_TECHSPEC.md` Section 10 ("Honest ceilings") and TS-11 ("Known open issues") name the unvalidated parts directly — the topology and skill-RAG scoring terms in particular are flagged as hypotheses, not proven mechanisms, in the same document that argues for building them anyway.

---

## Relationship to the rest of the lab

R017 is tooling/process, not a security finding and not a Noted/Nexus product feature. It does not touch `products/noted-host/`, does not interact with the T-01…T-14 threat spine, and does not compete for the same engineering attention as `NOTED_ADVERSARY_BLOCK_001` (PR #61) — that packet remains the priority. R017 is meant to run in parallel, at whatever pace the operator sets after review, and its main practical payoff — if it works — is making every *other* round in this lab (including the adversary-block work) easier for a fresh AI session to pick up cold.

---

## Non-claims (tattoo)

- Not empirically validated. This is a bold draft, not a measured result.
- Not a claim that any model becomes smarter by using it — it is external memory, not a capability upgrade.
- Not a replacement for CRL-BRAID's local, non-networked mode where no GitHub access exists.
- Proposal ≠ permission to implement.
- Multi-AI agreement (this packet cites four prior AI-authored designs) is not independent audit.

---

*If the topology terms in the skill-RAG formula never get past "hypothesis," that is an honest outcome, not a failure of this packet.*
