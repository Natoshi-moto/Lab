# Cross-model comparison — repaired Claude model vs. frozen Grok Breaker model

**Task:** E-009 of BGEN-ECON-REPAIR-002 (issue #38). Compares this repaired package (`experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`) against the independent, frozen second-family reconstruction (`experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/**`, merged PR #37 at `d8523b29ca7a1e0433ab5afdb494ed8452450dde`). The Grok package is **not modified** by this repair; both `simulate.py` scripts were re-run read-only to produce the figures below (see the receipt for exact commands and exit codes).

Both models were built to answer the same controlling review (BGEN-ECON-REV-001…007) independently, so structural similarity in what each model *decomposes* (opportunity cost, access frictions, named governance rules) is expected and is not evidence that either copied the other — the Grok package's clean-room freeze predates this repair, and this repair was written without reference to Grok's implementation source, only to its published English findings in the controlling review and `DIFFERENTIAL_REVIEW.md`/`DECISION.json`.

## 1. Directional agreement on preserved findings (E-008 / REV-007)

| Finding | Claude (repaired) | Grok (frozen) | Agreement |
|---|---|---|---|
| Linear pro-rata is split-mass invariant | `06_sybil_split_control_pro_rata`: split gain ≈ **-0.000%** (400-way split) | `06_sybil_split_control_pro_rata`: `split_invariant: true` (exact-equality helper) | **AGREE** — both find zero (or negligible floor-residual) gain from splitting under linear weighting |
| Concave weighting is Sybil-exploitable | `05_sybil_split_concave`: single 3.849% → split 44.448% (N=400), gain **+40.6pp** | `05_sybil_split_concave`: single 50.0% → split 75.6% (N=10, different population/peer construction), gain **+25.6pp** | **AGREE** on direction and mechanism (`sybil_strictly_better`/`sybil_split_is_profitable` both true); magnitude differs because of different population sizes and split counts (see §2) |
| Fixed pool creates denominator uncertainty / extreme (under)subscription | `19_undersubscribed_pool`: single 1,000-sat donor gets **100%** of pool | `19_undersubscribed_pool`: `top1_issued=1.0000` | **AGREE**, numerically identical qualitative outcome |
| Conditional rebate is exactly one-for-one | `07_rebate_sweep`: `conditional.rebate_sats == rebate_rate * donated_sats` for every rate tested | `07_rebate_sweep`: `conditional.total_rebate_sats == total_charity_retained` complement, same identity | **AGREE**, identical arithmetic result under the shared "arrangement already exists, zero friction" assumption |
| Low access probability collapses expected rebate | `27_rebate_access_frictions`: expected rebate falls to **under 1/20th** of conditional (100,000 vs 2,500,000) at 5% access | `28_rebate_low_access_genesis_set`: expected rebate materially below conditional at 1% access, 50% enforcement | **AGREE** on direction (expected ≪ conditional under low access); exact ratio differs because the two scenarios use different access/enforcement/detection parameter values (declared assumptions, not calibrated — neither is "the" right number) |
| Stolen-fund migration pathway exists; profitability is conditional | `10_stolen_key_donation`: `pathway_exists: true`, `zero_cost_unconditionally_profitable_laundering_proven: false`; sensitivity grid has both profitable and unprofitable cells | `10_stolen_key_donation`: `pathway_exists: true`, `zero_cost_note` states net profit is conditional on the same assumption classes | **AGREE**, near-identical interpretation language derived independently from the same controlling-review requirement |
| Governance capture is conditional on the integration rule | `13_governance_rules_comparison`: `none`/`nontransferable_equal` → 0%/0.2% max share, no capture; `token_weighted` → 52.5%, crosses majority; `continuously_capped` (500bps) → ~9.8%, no capture | `13_governance_proportional`/`14_governance_capped`: `none` → 0% max weight; `continuously_capped` (5%) → 25% max weight in their 4-actor demo fixture, does not cross majority | **AGREE** on direction (capped rule prevents majority capture; `none`/nontransferable rules grant no capture); absolute magnitudes differ because Grok's governance demo uses a small illustrative 4-actor fixture where the whale's own share is already comparable to the cap fraction, while Claude's uses a 501-donor whale-heavy population — see §2 |
| Governance renormalization is explicit and disclosed | `model/governance.py`: `continuously_capped` renormalizes to sum 1, with an explicit note that renormalization can push an individual capped holder's final weight above the nominal cap when several holders are simultaneously truncated | `model/governance.py` (Grok): same renormalization behaviour, same disclosure pattern | **AGREE** on both the mechanism and the need to disclose the renormalization-can-exceed-cap edge case |

## 2. Legitimate implementation differences (not disagreements)

These are declared, documented modelling choices on each side, not contradictions:

1. **Population construction.** Claude generates a 500–10,000-donor synthetic population per scenario via seeded `random.Random`; Grok's governance/Sybil demonstrations mostly use small, hand-constructed fixtures (2–10 actors). Both are valid for their purpose — Claude's larger populations make aggregate concentration metrics (Gini, HHI) meaningful; Grok's small fixtures make individual-actor arithmetic easy to hand-verify. Neither claims to model a real donor population.
2. **Arithmetic representation.** Claude uses `fractions.Fraction` throughout for bit-exact, base-independent results; Grok uses IEEE-754 `float`. Both are internally deterministic (verified by each package's own reproducibility tests); Claude's choice trades a small readability cost (long numerator/denominator strings) for exactness, while Grok's trades exactness for readability. Governance/rebate/tainted-fund percentages agree to within floating-point precision where directly comparable.
3. **Default assumption values.** Claude's default `alternative_realization_fraction` is 0.7 with a 0.3 alternative-path seizure probability; Grok's `10_stolen_key_donation` also defaults to 0.7/0.3 (same numbers, independently chosen — likely because both seats picked "70% realizable, 30% seizure risk" as a plausible round-number illustrative default), while Grok's `27_laundering_opportunity_grid` uses 0.9. Neither value is calibrated to any real data; both packages label them as assumptions explicitly.
4. **Lottery/lockup/time-weighting scenario sizing.** Different pool sizes (Claude: 100,000,000 units; Grok: 1,000,000,000 units) and different donor counts make absolute unit figures incomparable directly; all comparisons above use normalized shares/percentages for this reason.
5. **Field naming.** Claude: `tainted_fund_migration`, `rebate_and_collusion`, `share_of_pool`/`share_of_issued`. Grok: `laundering`, `rebate`, `top1_issued`/similar. Both distinguish the same underlying concepts (E-005's "denominator must be explicit" repair) using independently chosen but semantically equivalent names.

## 3. Where the repair changed Claude's own prior numbers

For transparency, three numbers from the original (pre-repair) Claude submission changed in this repair, and why:

1. **Governance capture figure for the 5%-cap scenario** moved from an inconsistently-computed ~9.768% (mixing a pool-denominated concentration sub-block with an issued-denominated majority check) to a single, consistently renormalized ~9.767–9.8% depending on cap level — numerically almost unchanged, but now internally consistent (E-005).
2. **Stolen-key "laundering_gain"** is no longer reported as an unconditional, cost-free profit; it is replaced by a `net_migration_profit` sensitivity grid that is sometimes positive and sometimes negative depending on declared assumptions (E-001).
3. **Rebate "predictable aggregate destruction" claim** is retracted; the exact one-for-one conditional arithmetic is preserved unchanged (E-002).

No previously reported number that was *load-bearing for a preserved finding* (§1) changed in direction; only the overclaimed interpretive layer around some numbers changed.

## 4. Commands used to produce this comparison

```bash
python3 experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py
python3 experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/simulate.py
```

Both were run read-only against the frozen Grok package (no files under `experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/**` or `operations/{audits,receipts}/BENEFICIAL_GENESIS_ECON_BREAKER_001/**` changed as a result — confirmed by `git status --short` showing no diff in those paths after running Grok's own regeneration script).
