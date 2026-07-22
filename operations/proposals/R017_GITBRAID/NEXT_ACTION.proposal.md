# NEXT ACTION — R017 GITBRAID

**Status:** `PROPOSAL / AWAITING_OPERATOR + CLAUDE_REVIEW / STATUS_AUTHORITY: NONE`
**Date:** 2026-07-22

Nothing implements from this file alone.

---

## Path for operator

### Step 1 — Strip-down pass

This packet is explicitly the *unstripped* draft. Before or alongside Claude review (`CLAUDE_REVIEW_BRIEF.md`), run the strip-down pass you already said you wanted: cut what doesn't survive contact with "is this actually buildable and worth building," keep what does. This packet does not pre-empt that pass.

### Step 2 — Your decisions

#### G1 — Adopt R017 as an active research round?

| Choice | Meaning |
|--------|---------|
| **ADOPT-AFTER-STRIPDOWN** | Wait for your strip-down pass (and/or Claude review) before committing engineering time |
| **ADOPT-PLAN** | Binds the phase order in TS-12 now; still needs per-phase GO |
| **HOLD** | Interesting design, not active yet |
| **REJECT** | Archive; CRL-BRAID's local file-native mode remains the fallback |

#### G2 — Build order, if adopted

| Choice | Meaning |
|--------|---------|
| **GO-PHASE-0-1** | Tag table freeze + check-in gate only (TS-12 Phase 0–1) — cheapest, least speculative |
| **GO-THROUGH-PHASE-4** | Through basic skill-RAG with topology/structural terms stubbed at zero |
| **GO-ALL** | Full roadmap including the unvalidated topology terms (Phase 6) |
| **NO-ENG** | Docs/review only for now |

#### G3 — Personal-content safeguard (Claude review Q6)

| Choice | Meaning |
|--------|---------|
| **BUILD-CLASSIFIER-FIRST** | Do not ship Phase 1's promotion gate until an automated content check exists, not just a stated rule (recommended) |
| **STATED-RULE-ACCEPTABLE** | Proceed with the rule-only version for now, revisit before any real content moves through it |

#### G4 — Relationship to the adversary-block priority

| Choice | Meaning |
|--------|---------|
| **PARALLEL-LOW-PRIORITY** | R017 proceeds at whatever pace fits around `NOTED_ADVERSARY_BLOCK_001`, never ahead of it (recommended — matches earlier guidance in this thread) |
| **EQUAL-PRIORITY** | R017 gets equal engineering attention |

---

## Savage default (if you only say one sentence)

> **ADOPT-AFTER-STRIPDOWN; GO-PHASE-0-1 only for now; BUILD-CLASSIFIER-FIRST before any promotion gate ships; PARALLEL-LOW-PRIORITY behind the adversary-block work.**

---

## Forbidden without explicit GO

- Treating any TS-7 scoring weight as validated
- Shipping the public-branch promotion gate (TS-2) without resolving G3
- Letting R017 compete for priority with `NOTED_ADVERSARY_BLOCK_001` without an explicit G4 override

---

*End next action.*
