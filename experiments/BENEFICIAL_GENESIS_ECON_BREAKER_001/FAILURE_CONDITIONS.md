# Failure conditions — BGEN-ECON-BREAKER-001

Mapped from issue #34. Independent adjudication after clean-room modelling.

| ID | Condition (issue #34) | Independent finding | Triggers REJECT_OR_REDESIGN for mechanism? |
|----|----------------------|---------------------|--------------------------------------------|
| FC1 | Transferable token has no necessary function beyond rewarding donation | Not necessary for charity receipt; may still be needed for unspecified ledger functions (REV-004). Necessity **unproven**, not fully disproven. | **Partial** — continuation requires explicit ledger-function decision or non-transferable redesign |
| FC2 | Rational donors predictably destroy charity net benefit via rebates | Conditional one-for-one reduction proven; **unconditional behavioral prediction not supported** without access/enforcement/detection model (REV-002). | **No** as unconditional; **Yes** under high-access zero-friction collusion assumptions |
| FC3 | One actor obtains practical governance by donation alone | True **iff** proportional/token-weighted governance is the integration rule. Not a subject defect of allocation alone (REV-003). | **Conditional** on integration choice |
| FC4 | Material incentive to donate stolen/tainted funds | Pathway exists (crypto ≠ legal ownership). **Profitable** laundering is assumption-conditional once opportunity cost is modeled (REV-001). Still a serious residual risk surface. | **Yes as residual risk requiring redesign/policy gates**; not as proven zero-cost arb |
| FC5 | Timing/cutoff games produce non-deterministic or privileged allocation | Allocation is deterministic given accepted tip and eligible set. Miner influence on inclusion near cutoff and reorg residuals remain (design threat model). Denominator uncertainty is real. | **Partial** — needs sealed commitment / clearer miner nonclaim; not random nondeterminism in the math |
| FC6 | Mitigation depends on unverifiable identity while claiming permissionless | Caps and concave weights without identity layer are Sybil-broken (proven). Linear pro-rata does not need identity but preserves concentration. | **Yes** for cap/concave “fixes” without identity; pro-rata avoids this trap |
| FC7 | Social benefit dominated by simpler non-token mechanism | For pure charity+receipt goals, direct donation / non-transferable receipt dominate complexity. For full ledger bootstrap, comparison incomplete. | **Partial** — depends on product goal |

## Aggregate mechanism disposition

**`CONTINUE_WITH_CONDITIONS`** for the **underlying Beneficial Genesis charitable-migration concept**, not a blanket endorsement of transferable fixed-pool units as currently underspecified.

Conditions (non-exhaustive):

1. Specify target ledger functions before defending transferability.  
2. Prefer non-transferable or delayed-transfer claim if functions do not require float.  
3. Do not attach majority governance to raw allocation without continuous caps / nontransferable gov.  
4. Treat rebate and stolen-fund paths as residual social/legal/AML surfaces; do not claim crypto solves them.  
5. Avoid concave/cap allocation “fairness” patches without an identity layer.  
6. Use sealed/precommitment windows if timing privilege is in scope to mitigate.  
7. Keep legal classification of floating ratios out of economic seats (Track F).

**Not** `ECONOMIC_GATE_PASS`: second-family review is this seat, but gate pass would require operator acceptance of conditions and still forbids live funds.

## Claude package disposition

Deferred to post-freeze differential review (`results/DIFFERENTIAL_REVIEW.md` and `results/DECISION.json`). Pre-freeze: controlling review’s `INDEPENDENT_RECONSTRUCTION_REQUIRED` is the last accepted gate state for PR #35.
