# Formal model — BGEN-ECON-REDTEAM-001

**Task:** GitHub issue [#34](https://github.com/Natoshi-moto/Lab/issues/34), parent program [#33](https://github.com/Natoshi-moto/Lab/issues/33).
**Status authority:** NONE. This document proposes analysis only; it does not change `STATUS.json`, assign an R-round, or authorize live funds.
**Subject:** Beneficial Genesis fixed-pool proportional allocation as specified by `experiments/BENEFICIAL_GENESIS_DESIGN_001` at merged base `22ce8c11297ad4c08606277ee83dc845797ba220`.

All quantities below are abstract integer or rational "units," never priced BTC, fiat, or any market forecast. Executable evidence lives in `model/` and `results/`; this document states the assumptions and equations those modules implement.

---

## 1. Primitives

- **Donor** `i`: a synthetic identity with eligible contribution `e_i` (non-negative integer "sats").
- **Pool** `P`: a fixed positive integer issued once, at epoch close. `P` does not depend on how much was donated (see §6).
- **Allocation** `a_i`: integer units granted to donor `i`, `0 <= a_i`, `sum(a_i) <= P`. The shortfall `P - sum(a_i)` is `unissued_remainder` and is never later issued (matches the subject design's own rule).
- **Group** `g(i)`: a label representing the *beneficial owner* behind donor identity `i`. In an honest run `g(i) = i`; under an identity-split probe several donor ids share one `g`.

## 2. Baseline allocation rule (subject's own rule)

The subject design (`experiments/BENEFICIAL_GENESIS_DESIGN_001/protocol/allocation.py`) allocates

```text
a_i = floor(P * e_i / sum_j(e_j))
```

with the remainder left unissued. This model implements that rule as `EXACT_PRO_RATA` (`model/allocation.py`) and treats it as the reference scheme against which every alternative is compared.

## 3. Allocation alternatives modelled

| Scheme | Rule | File |
|---|---|---|
| `EXACT_PRO_RATA` | `floor(P * e_i / total)` | `allocation.exact_pro_rata` |
| `CAPPED_PRO_RATA` | pro rata, then `min(a_i, cap_bps/10000 * P)` per identity; capped-off amount unissued | `allocation.capped_pro_rata` |
| `CONCAVE_SQRT` | weight `w_i = isqrt(e_i)`, then pro rata on `w_i` | `allocation.concave_sqrt` |
| `CONCAVE_LOG` | weight `w_i = round(scale * ln(1+e_i))`, then pro rata on `w_i` | `allocation.concave_log` |
| `TIME_WEIGHTED` | linear early-donation bonus up to `early_bonus_bps`, decaying to 0 at epoch close, then pro rata | `allocation.time_weighted` |
| `RANDOM_LOTTERY_COMPONENT` | a `lottery_share_bps` slice of `P` is drawn via seeded weighted lottery; remainder is pro rata | `allocation.random_lottery_component` |
| `NO_TOKEN` | `a_i = 0` for all `i`; `P` is entirely unissued | scenario runner special case |

Governance weight (`model/governance.py`, repaired under E-003) is modelled as a function *of* economic allocation under one of five explicitly named rules — `none`, `nontransferable_equal`, `nontransferable_proportional`, `token_weighted`, `continuously_capped` — computed **only** for scenarios that opt in via a `governance_rules` manifest field, never assumed by default. `nontransferable_proportional` and `token_weighted` are numerically identical at computation time; they differ only in the *durability* label (frozen at genesis vs. moves with the token on a secondary market). `continuously_capped` truncates each holder's raw proportional weight at `cap_bps` of the pre-cap total, then **renormalizes** so weights sum to exactly 1 — with the disclosed caveat that renormalization can push an individual holder's post-cap weight above the nominal cap fraction when several holders are simultaneously truncated. This lets Track 1's "governance rights proportional to allocation versus independently capped" be tested as an orthogonal axis rather than a seventh allocation scheme.

Non-transferability / vesting is modelled as a **liquidity discount** on gross token value, not a new allocation rule (allocation math is unaffected by lock-up):

```text
discount(months) = (100 - min(7 * months, 70)) / 100
liquid_value_i   = discount(months) * token_value_per_unit * a_i
```

7%/month up to a 70% cap is an assumed parameter for illustrating direction and rough magnitude, not an empirical estimate of any real market's illiquidity discount (see `NONCLAIMS_AND_OPEN_QUESTIONS.md`).

## 4. Token value (never a price prediction)

No module predicts a market price. Token value is expressed as a multiplier `m` on a *reference breakeven price*

```text
p0 = total_eligible_units / P
```

`p0` is the price at which a single honest, fully-rebate-free, fully-subscribed pro-rata donor exactly breaks even. Required scenarios sweep `m in {0.5, 1.0, 1.5}` ("below, equal to, above donated value") as a declared modelling assumption, per `donor_economics` in `model/scenario.py`.

Donor utility:

```text
net_cost_i   = e_i - rebate_rate_i * e_i
gross_value_i = m * p0 * a_i
liquid_value_i = discount(lockup_months) * gross_value_i
utility_i    = liquid_value_i - net_cost_i
```

## 5. Concentration and welfare metrics (`model/metrics.py`)

> **Repair note (E-005, BGEN-ECON-REV-005):** the original version of this module divided `top_n_share` by the fixed pool while `hhi` implicitly divided by the issued total, silently mixing two denominators in one "concentration" report. Every metric below now states its denominator explicitly and the two are never merged into a single unlabeled field.

- **Gini coefficient** over the *issued* distribution, computed with exact `fractions.Fraction` arithmetic (bit-reproducible, no floating-point rounding). Also accepts `Fraction`-valued governance-weight shares directly.
- **HHI**: `sum((a_i/total_issued)^2)`, scale 0..1 — always defined over the issued distribution (a "share of pool" HHI has no clean interpretation when much of the pool is unissued; that information is already captured by `unissued_remainder`).
- **top-n share of issued**: largest `n` holders' combined share of the actually issued total.
- **top-n share of pool**: largest `n` holders' combined share of the fixed pool (reflects unissued remainder).
- All are computed twice per scenario: **by_account** (raw donor identity) and **by_beneficial_owner** (identities grouped by `g(i)`), so identity-splitting and custodial-aggregation effects are visible as a divergence between the two views, with both `_of_pool` and `_of_issued` variants reported explicitly and a `denominator_note` field spelling out which is which.

## 6. Denominator behaviour (a structural property, not an attack)

Because `EXACT_PRO_RATA` (and every alternative above) allocates the *entire* fixed pool `P` regardless of `total_eligible_units`, subscription level has no effect on how much of `P` is issued — only on each unit's implied claim on `P`. Scenarios 19 and 20 (`19_undersubscribed_pool`, `20_oversubscribed_pool`) demonstrate the two extremes quantitatively; see `MECHANISM_NECESSITY.md` §2 for why this is a necessity-relevant finding rather than only an economic curiosity.

## 7. Adversarial probes implemented

| Probe | What it computes | Manifest field |
|---|---|---|
| Sybil identity split | share of pool under one identity vs. `k` split identities holding the same total, same background population | `split_identity_probes` |
| Rebate / circularity | conditional (arrangement-exists, zero-friction) rebate incidence **and** an expected, access/enforcement/detection-friction-adjusted incidence, side by side (`model/collusion.py`) | any donor with `rebate_rate > 0`; friction parameters via `rebate_friction_assumptions` and per-donor `colluding_arrangement_exists` |
| Stolen/tainted-fund migration | decomposed legal cost basis, source-asset opportunity value, gross/risk-adjusted/realizable token value, and net migration profit, plus an optional sensitivity grid over token-value and realization-fraction assumptions (`model/tainted_funds.py`) | any donor with `stolen: true`; assumption overrides via `tainted_fund_assumptions`; grid via `tainted_fund_sensitivity_grid` |
| Denominator shock | an early donor's share of pool before vs. after a late-arriving donor group | `denominator_shock` |
| Governance capture | whether any beneficial owner's governance weight crosses 1/2 or 1/3 of total, under one or more explicitly named rules (`model/governance.py`) | `governance_rules` (opt-in only; no scenario defaults to any governance assumption) |
| Charity selection / circularity | per-charity totals donated, rebated (conditional), and net retained | `track_charity_breakdown` + `charity_id` |

Every probe is a pure function of the manifest and the published integer `seed`; re-running `simulate.py` reproduces `results/*.json` byte-for-byte (enforced by `tests/test_scenarios.py::TestScenarioDeterminism`). Duplicate donor identifiers are rejected with a `ValueError` rather than silently colliding (E-005).

## 8. What this model does not do

See `NONCLAIMS_AND_OPEN_QUESTIONS.md` for the complete list. In summary: no market-price prediction, no real donor/charity data, no change to the cryptographic verifier, no claim that modelled attacker behaviour is empirically observed rather than a worst-case rational-actor upper bound.
