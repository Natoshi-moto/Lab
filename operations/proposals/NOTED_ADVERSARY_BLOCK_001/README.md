# NOTED-ADVERSARY-BLOCK-001 — first Nexus block release: proof-of-unsafety

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`
**Date:** 2026-07-22
**Seat:** Claude-design (author of this packet; does not implement; does not authorize)
**Parent programme:** `experiments/NOTED_PROJECT_OS_001/`
**Grounded against:** `main` @ `7026b66` (docs tip, PR #59) / product through PR #58 (`c2bbfb8`) / hardening plan PR #60
**Does not:** implement code, wire the registry entry live, merge itself, authorize tokens, certify security, or endorse real-world economic value

---

## What this is

A proposal to ship **the first entry in a new Nexus block-release lineage** whose entire purpose is proving — with recorded, human-legible evidence — that Noted + Nexus must not hold real money or real secrets yet. Not a hardened feature. A deliberately adversarial block that attacks its own host from inside the sandbox, on synthetic data only, and shows the damage on screen next to whatever Snooper recorded (nothing, for most of it).

This sits **downstream** of the existing threat/gate spine and does not replace or renumber anything in it:

| Sister (load-bearing; do not replace) | Job |
|---|---|
| `../NOTED_SOVEREIGNTY_ASSAULT_001/` | Threat spine T-01…T-14; this packet implements six of them as live demos |
| `../NOTED_STOP_THE_LINE_001/` | Hard gates G-01…G-07; this packet's release does not turn any of them green |
| `../NOTED_MEMBRANE_HARDENING_001/` | H0–H5 sequencing; this packet is the human-facing proof layer for H2 ("measure, expect FAIL") |
| Lab root `WHY_NOT_TO_TRUST_THIS_PROJECT.md` | Permanent distrust register — this block is evidence *for* that register, not against it |

Nothing here closes a T-ID. Nothing here turns a gate green. This block existing and running successfully means the opposite of "ready" — it means the holes are real and demonstrated.

---

## Why a block, not a document

Nexus already has a real, versioned block catalog (`products/noted-host/public/nexus/block-registry.json`) with `nexus-agent-v0.14-scrubbed`, `prompt-studio-v3`, and the `eidolon-vibes-suite` as precedent. Shipping this as a launchable block — not just another proposal doc — means an operator (or anyone auditing the project) can open it and *watch* the attacks happen, rather than trust a table of PASS/FAIL text. That's the whole point: legible proof over written claims.

---

## Read order

| # | File | Job |
|---|------|-----|
| 0 | `../../WHY_NOT_TO_TRUST_THIS_PROJECT.md` | Permanent distrust |
| 1 | `../NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md` | T-ID spine this block demonstrates against |
| 2 | **This README** | Orientation |
| 3 | `ATTACK_ROSTER.md` | The six attacks, what each proves, synthetic fixtures |
| 4 | `RECEIPT_SCHEMA.md` | What gets recorded per attack run, and the Snooper side-by-side |
| 5 | `CLAIMS_AND_NONCLAIMS.md` | What this release is allowed to say about itself |
| 6 | `REGISTRY_ENTRY_PROPOSAL.md` | Proposed `block-registry.json` diff and new `security/` block category |
| 7 | `CLAUDE_REVIEW_BRIEF.md` | What Claude-design should accept/reject/amend before build |
| 8 | `NEXT_ACTION.proposal.md` | Operator decisions |
| 9 | `STATUS.proposal.json` | Proposal-only status block |

---

## One-line thesis

```text
Build a block whose only job is attacking its own host and recording the damage.
Ship it before any feature that touches real value.
Let the operator watch it happen instead of reading a claim that it can't.
```

---

## Non-negotiables (see CLAIMS_AND_NONCLAIMS.md for the full list)

- Synthetic fixtures only — never a real key, never a real note, never a real network call to a real third party.
- Never labeled or built as a `managed-block` in the registry — it gets its own honest `kind` (see `REGISTRY_ENTRY_PROPOSAL.md`).
- Excluded from any cold-drop bundle by construction, not by promise — same discipline T-06 already failed to get right for `nexus-agent-v0.12.html`.
- Does not soften Snooper's warning law (`SNOOPER_IA.md` S0–S4) to ship faster.
- Manual trigger only, per attack, with confirmation. Never auto-runs.

---

## Seats

| Seat | Role on this packet |
|------|---------------------|
| **Claude-design** | Author; must keep this honest about what it does and doesn't prove |
| **Operator** | Naming, freeze decisions on adjacent value-touching work (see `NEXT_ACTION.proposal.md`), go/no-go |
| **Codex** | Later: implement only after operator GO citing this packet's IDs |

Multi-AI agreement is **not** independence.

---

*If this block ever stops being embarrassing to run, something is wrong with it, not with the app.*
