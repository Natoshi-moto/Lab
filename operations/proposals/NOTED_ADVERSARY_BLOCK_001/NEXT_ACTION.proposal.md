# NEXT ACTION — adversary block proposal

**Status:** `PROPOSAL / AWAITING_OPERATOR + CLAUDE_REVIEW / STATUS_AUTHORITY: NONE`
**Date:** 2026-07-22

Nothing implements from this file alone.

---

## Path for operator (non-technical)

You only choose letters. Coding seats wait.

### Step 1 — Claude design review

Hand `CLAUDE_REVIEW_BRIEF.md` + this folder to a review seat. Wait for `CLAUDE_REVIEW.md` verdict.

### Step 2 — Your decisions

#### A1 — Adopt this as the first Nexus block release?

| Choice | Meaning |
|--------|---------|
| **ADOPT-AFTER-CLAUDE** | Wait for review verdict, then confirm |
| **ADOPT-PLAN** | Binds build order now; still needs per-attack GO |
| **HOLD** | Interesting docs only |
| **REJECT** | Archive |

#### A2 — Build order

| Choice | Meaning |
|--------|---------|
| **GO-CHEAP-FIRST** | Attacks #2 and #6 only (no browser automation, fastest review cycle) |
| **GO-ALL-SIX** | Full roster, sequenced per `ATTACK_ROSTER.md` |
| **NO-ENG** | Docs/review only for now |

#### A3 — Adjacent value-touching work (R012 / R013 / R016)

| Choice | Meaning |
|--------|---------|
| **FREEZE-IMPLEMENTATION** | Design/threat-model docs for R012/R013/R016 may continue; anything touching real storage, real keys, or the live Agent runtime pauses until this block ships (recommended — see reasoning below) |
| **FREEZE-ALL** | Pause R012/R013/R016 entirely, including design docs |
| **NO-FREEZE** | R012/R013/R016 continue unaffected |

**Reasoning for the recommended default:** attacks #1 and #4 in `ATTACK_ROSTER.md` exist specifically to show that anything stored the way notes are stored today — including a future custody credential — is readable by the Agent without asking. Custody design work that doesn't yet touch real storage or real keys isn't exposed to that risk; custody work that does is exposed to exactly what this block is about to demonstrate.

#### A4 — Registry wiring

| Choice | Meaning |
|--------|---------|
| **DEFER** | Do not apply `REGISTRY_ENTRY_PROPOSAL.md`'s diff until `adversary-proof-v1.html` exists and is reviewed (recommended) |
| **APPLY-NOW** | Register the route immediately (not recommended — see the proposal's own sequencing note) |

---

## Savage default (if you only say one sentence)

> **ADOPT-AFTER-CLAUDE; then GO-CHEAP-FIRST; FREEZE-IMPLEMENTATION on R012/R013/R016; DEFER registry wiring until the block file exists.**

---

## Forbidden without explicit GO

- Registering the block route before the file exists
- Softening the "DO NOT USE FOR REAL MONEY" banner
- Presenting a successful attack run as anything other than the expected, unfixed result

---

*End next action.*
