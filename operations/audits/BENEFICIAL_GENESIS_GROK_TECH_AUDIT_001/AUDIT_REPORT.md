# Sanitized audit report — BGEN-GROK-TECH-AUDIT-001

## Identity

| Field | Value |
|-------|--------|
| Audit ID | BGEN-GROK-TECH-AUDIT-001 |
| Seat | Independent Grok Technical |
| Repository | Natoshi-moto/Lab |
| Exact subject | `8349de7a5978be6a9984aa33fd59ba3725ebaaca` |
| Branch | `grok/bgen-technical-audit-001` |
| Status authority | NONE |
| Blinding | Sibling 2x2 epistemic/codex audits (PR #40/#42 and paths) not opened |

## Binding check

| Check | Result |
|-------|--------|
| HEAD == subject | PASS |
| Branch | PASS |
| Clean status at start | PASS |
| Drift | none |

## Method

1. Pre-audit freeze from design docs + issues #33/#34 only; SHA inventory of unread packages.
2. Clean worktree reproduction of design, economics, breaker, differential retest, lab tests, nexus doctor/verify.
3. Independent hostile probes under authorized write paths only.
4. Spec/code, test quality, and provenance review.
5. Exact three-category verdicts.

## Results (summary)

| Suite | Exit | Notes |
|-------|------|-------|
| Design tests | 0 | 37 OK |
| Design evidence gate | 0 | PASS 34/1/8 |
| Claude econ tests | 0 | 72 OK |
| Claude econ simulate | 0 | 27 scenarios; no tracked mutation |
| Breaker tests | 0 | 25 OK |
| Breaker simulate | 0 | 28 OK |
| Node retest_002 | 0 | 19 OK; 43/0/0 |
| Full lab tests | 1 | env: missing @noble/ed25519 |
| nexus doctor | 0 | PASS (dirty warn after writes) |
| nexus verify | 2 | env: missing @noble/ed25519 |
| git diff --check | 0 | clean |

## Verdicts

- TECHNICAL_PACKAGE: **PASS_WITH_STATED_LIMITS**
- CLAIM_EVIDENCE: **SUPPORTED_WITH_STATED_LIMITS**
- REAL_WORLD_READINESS: **RESEARCH_ONLY**

## Material findings

1. **F-001** Design README stale fixture counts (29/6 vs 34/1) — MEDIUM docs.
2. **F-002** Rejection code taxonomy looseness — LOW.
3. **F-003** Lab Node Noble dependency missing — MEDIUM environmental.
4. **F-004** Lottery omitted from SCHEMES registry — LOW.
5. **F-005** Residual research risks disclosed — INFO.

## Non-claims

No merge, promotion, legal advice, live funds, R-round, or sibling-audit use. Passing synthetic suites ≠ production readiness.

## Artifacts

Primary package: `experiments/BENEFICIAL_GENESIS_GROK_TECH_AUDIT_001/**`  
Receipt: `operations/receipts/BENEFICIAL_GENESIS_GROK_TECH_AUDIT_001/RECEIPT.json`
