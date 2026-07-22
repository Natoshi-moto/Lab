# NOTED-MEMBRANE-HARDENING-001 — updated security hardening proposal

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`  
**Date:** 2026-07-22  
**Seat:** SEAT-GROK-DRIVE (design refinement; does not implement; does not authorize)  
**Parent programme:** `experiments/NOTED_PROJECT_OS_001/`  
**Grounded against:** `main` @ `7026b66` (docs tip) / product through PR #58 (`c2bbfb8`)  
**Does not:** implement code, merge itself, authorize tokens, certify security, grant `status_authority`, or endorse real-world economic value

---

## What this is

An **updated hardening plan** that sits **on top of** the two packets already on `main`:

| Sister (load-bearing; do not replace) | Job |
|---------------------------------------|-----|
| `../NOTED_SOVEREIGNTY_ASSAULT_001/` | Threat spine T-01…T-14, waves A–E, Snooper IA, cold-drop bar, ODS-SEC stubs |
| `../NOTED_STOP_THE_LINE_001/` | Hard gates G-01…G-07, productivity tax, waiver protocol, language lockdown |
| Lab root `WHY_NOT_TO_TRUST_THIS_PROJECT.md` | Permanent distrust register (does not close when gates go green) |

This packet adds what the sisters do **not** fully state as product doctrine:

1. **Mutual distrust** between Noted host and Nexus Agent (not “Nexus secures the browser”).  
2. A **hardening sequence** that prefers measurement and small quarantine before architecture surgery.  
3. Explicit **claims / non-claims** so seats cannot market isolation as browser security.  
4. A **Claude review brief** so design review has a single entrypoint.

Nothing here closes a T-ID. Closing still requires the assault **evidence bar** (probe → fix → re-probe → receipt) or a signed waiver.

---

## Read order

| # | File | Job |
|---|------|-----|
| 0 | `../../WHY_NOT_TO_TRUST_THIS_PROJECT.md` | Permanent distrust |
| 1 | `../NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md` | T-ID spine (do not renumber) |
| 2 | `../NOTED_STOP_THE_LINE_001/HARD_GATES.md` | G-01…G-07 matrix |
| 3 | **This README** | Orientation |
| 4 | `MUTUAL_DISTRUST.md` | Thesis: host ↔ Agent as mutual adversaries |
| 5 | `HARDENING_SEQUENCE.md` | Ordered work packages H0–H5 |
| 6 | `CLAIMS_AND_NONCLAIMS.md` | Allowed language after each phase |
| 7 | `CLAUDE_REVIEW_BRIEF.md` | What Claude-design should accept/reject/amend |
| 8 | `NEXT_ACTION.proposal.md` | Operator + review decisions |
| 9 | `STATUS.proposal.json` | Proposal-only status block |

---

## One-line thesis

```text
Do not claim Nexus makes the browser more secure.
Build host and Nexus as mutual adversaries under one roof;
use the browser's real locks honestly; measure before surgery;
refuse silent kitchen access, unpinned brains, and default key middlemen.
```

---

## Relationship to operator D1–D5

Stop-the-line `NEXT_ACTION.stop.md` still owns formal D1–D5.  
This packet **recommends** (does not assume operator already chose):

| Decision | Recommended default (if silent) |
|----------|----------------------------------|
| D1 stop-the-line | **ADOPT** (drive policy already treats matrix as in force) |
| D2 first eng | **GO-T06-FIRST**, then Wave A **measurement harnesses only** |
| D3 tension | **DEFER** until harnesses FAIL loudly; prefer **B-then-C** when fixes start |
| D4 Snooper | **SPEC-ONLY** until after Wave A measurement |
| D5 docs on main | **Already YES** via PR #59 @ `7026b66` |

---

## Seats

| Seat | Role on this packet |
|------|---------------------|
| **Grok-drive** | Author; must keep gates red-visible; no status authority |
| **Claude-design** | Review this proposal for holes, contradictions, overclaim, missing T-IDs |
| **Claude-debug** | Later: minimal reproduce/fix only after operator GO |
| **Codex** | Later: implement only after operator GO + cites HARD_GATES / H-IDs |
| **Operator** | Only go/no-go; approve/reject; may waive |

Multi-AI agreement is **not** independence.

---

## Non-claims (tattoo)

- Not a security certification or penetration test.  
- Not permission to attack third-party systems.  
- Not a token / investment story.  
- Proposal ≠ permission to implement.  
- Passing future ODS-SEC cases ≠ production readiness.  
- Snooper (if ever built) does **not** see T-01/T-02/T-03 style exfil.

---

*If this folder feels heavy: that is the membrane debt talking.*
