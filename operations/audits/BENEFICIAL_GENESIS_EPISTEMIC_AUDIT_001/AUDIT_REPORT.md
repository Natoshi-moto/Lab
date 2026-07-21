# Audit report — BGEN-EPISTEMIC-AUDIT-001 (sanitized)

## Authority

`status_authority: NONE`. No promotion, merge, R-round, STATUS.json change,
live-funds/solicitation/issuance/deployment authorization, or legal
conclusion. Cross-model agreement is not treated as proof of truth.

## Subject binding

| Item | Value |
|---|---|
| Repository | Natoshi-moto/Lab (PUBLIC) |
| Exact subject | `8349de7a5978be6a9984aa33fd59ba3725ebaaca` (= origin/main at audit start) |
| Audit branch | `fable/bgen-epistemic-audit-001` |
| Seat | Independent epistemic auditor (Claude Fable 5) |
| Isolation | dedicated git worktree; user's checkout untouched |
| Environment | Python 3.14.6, Node 24.14.0, network available |
| STATUS.json | read, unmodified (R016; contains no Beneficial Genesis fields) |

## Method (phases executed)

0. Subject binding and environment record.
1. **Pre-audit freeze** committed at `c9f2abc` before opening any economics
   package content: independent mechanism reconstruction, expected
   load-bearing claims, failure modes, falsifiers, audit plan, and a
   168-file SHA-256 inventory of the then-unread packages. The freeze's own
   honesty statement records why it cannot prove full independence (task
   prompt leakage; issue #33's lineage summary; shared-model priors).
2. Chronology and provenance from commits, issues #33/#34/#36/#38, PRs
   #35/#37/#39, and receipts. All commit bindings verified; all 72 Breaker
   clean-room hashes verified against `b588779`.
3. Claim ledger: 22 claims, each classed
   (MATHEMATICAL_DEDUCTION / EXECUTABLE_PROPERTY / MODEL_CONDITIONAL_RESULT /
   EMPIRICAL_HYPOTHESIS / POLICY_CHOICE / LEGAL_QUESTION mapped as
   applicable), with claim-specific confidence and disposition.
4. Independent reproduction: subject suites re-executed (design 37 OK +
   evidence gate PASS; econ 72 + 25 OK; lab 185 OK after `npm ci`; 43/0/0
   differential exact), then 35 fresh-code reproductions (exact rational
   arithmetic; populations regenerated from published seeds; subject models
   not imported) and 33 adversarial probes (duplicates, bools, negatives,
   2^200 ints, ordering, lottery determinism/uniqueness, denominators,
   governance normalization, record tampering) — all passing. Zero subject
   path changed at any point (verified after every run).
5. Model adequacy assessment.
6. Steelmanned continue/stop cases.
7. External evidence register (3 primary-source anchors; no parameter
   calibration claimed; no legal conclusions).
8. Process/provenance audit distinguishing provenance quality, software
   correctness, model validity, and real-world validity.
9. Final outputs and three separate verdicts.

## Findings summary

**Confirmed strong:** supply conservation (theorem + executable); pro-rata
split invariance; Sybil-exploitability of concave/capped rules; fixed-pool
full-issuance behavior; stolen-fund pathway; governance-rule
conditionality; cap-then-renormalize disclosure; receipt/commit binding
integrity; byte-deterministic simulators; all pre-repair defect claims
verified against actual pre-repair bytes.

**Audit-original findings:**

- AUD-MODEL-03 — participation elasticity (the mechanism's core causal
  premise) is unmodelled everywhere; FC7's dominance disposition is
  therefore UNDERDETERMINED, not "partially triggered".
- AUD-PROC-01 — the Breaker seat read the controlling defect catalogue
  before its clean-room freeze (as instructed by issue #36): directed
  verification, not blind rediscovery.
- AUD-PROC-04 — the final mechanism disposition was prescribed in the
  controlling repair contract before repair and retest.
- AUD-SEM-01 — tainted-fund sensitivity grid uses "token_value_per_unit"
  with different semantics than the headline cell.
- AUD-SEM-02 — Claude/Grok econ models have different input domains;
  agreement claims are intersection-scoped (inside it, agreement is exact).
- Receipts omit the `npm ci` prerequisite (fresh clone: 11 environmental
  lab-test failures).
- Controlling adjudications — the record's pivot documents — carry no
  receipts, seat identity, or method statement; provider-family
  independence is asserted (branch names, receipt strings), not evidenced.

## Verdicts

1. Evidence package: **TRUSTWORTHY_WITH_STATED_LIMITS**
2. Underlying mechanism: **CONTINUE_WITH_CONDITIONS** (moderate confidence;
   UNDERDETERMINED vs STOP acknowledged as defensible; conditions listed in
   FINAL_VERDICT.md are binding on this concurrence)
3. Real-world readiness: **RESEARCH_ONLY**

## Commands and exit codes

All commands and results are recorded in
`experiments/BENEFICIAL_GENESIS_EPISTEMIC_AUDIT_001/SOURCE_INVENTORY.json`;
every listed command exited 0 in the final state (lab suite required
`npm ci` first; failure mode before install is documented, environmental).

## Limitations and non-claims

- The freeze reduces, but cannot eliminate, anchoring from the task prompt
  and issue #33's lineage summary.
- The auditor is a Claude-family model reviewing work partly attributed to
  Claude-family models; shared training priors are an irreducible residual
  for judgment-level (not executable) conclusions.
- Reproduction validates computation, not real-world transfer.
- Provider identity of prior seats is not auditable from repository
  evidence; nothing here asserts the labels are false.
- No fixture-by-fixture byte review of the design pack was performed
  (executed via its evidence gate instead).
