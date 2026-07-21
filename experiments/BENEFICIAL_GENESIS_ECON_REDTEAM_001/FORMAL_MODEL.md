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

Governance weight is modelled as a function *of* economic allocation, either exactly proportional (`governance_cap_bps = "PROPORTIONAL"`) or capped per identity (`governance_cap_bps = <bps>`), per `allocation.governance_weight`. This lets Track 1's "governance rights proportional to allocation versus independently capped" be tested as an orthogonal axis rather than a seventh allocation scheme.

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

- **Gini coefficient** over allocated units, computed with exact `fractions.Fraction` arithmetic (bit-reproducible, no floating-point rounding).
- **HHI**: `sum((a_i/total)^2)`, scale 0..1.
- **top-1 / top-10 share**: largest 1 or 10 holders' combined share of `P`.
- All four are computed twice per scenario: **by_account** (raw donor identity) and **by_beneficial_owner** (identities grouped by `g(i)`), so identity-splitting and custodial-aggregation effects are visible as a divergence between the two views.

## 6. Denominator behaviour (a structural property, not an attack)

Because `EXACT_PRO_RATA` (and every alternative above) allocates the *entire* fixed pool `P` regardless of `total_eligible_units`, subscription level has no effect on how much of `P` is issued — only on each unit's implied claim on `P`. Scenarios 19 and 20 (`19_undersubscribed_pool`, `20_oversubscribed_pool`) demonstrate the two extremes quantitatively; see `MECHANISM_NECESSITY.md` §2 for why this is a necessity-relevant finding rather than only an economic curiosity.

## 7. Adversarial probes implemented

| Probe | What it computes | Manifest field |
|---|---|---|
| Sybil identity split | share under one identity vs. `k` split identities holding the same total, same background population | `split_identity_probes` |
| Rebate / circularity | utility delta from a declared `rebate_rate`, and resulting charity loss | any donor with `rebate_rate > 0` |
| Stolen-key laundering | gross token value received with **zero** legitimate cost basis | any donor with `stolen: true` |
| Denominator shock | an early donor's share before vs. after a late-arriving donor group | `denominator_shock` |
| Governance capture | whether any beneficial owner's governance weight crosses 1/2 or 1/3 of total | `governance_cap_bps` |
| Charity selection / circularity | per-charity totals donated, rebated, and net retained | `track_charity_breakdown` + `charity_id` |

Every probe is a pure function of the manifest and the published integer `seed`; re-running `simulate.py` reproduces `results/*.json` byte-for-byte (enforced by `tests/test_scenarios.py::TestScenarioDeterminism`).

## 8. What this model does not do

See `NONCLAIMS_AND_OPEN_QUESTIONS.md` for the complete list. In summary: no market-price prediction, no real donor/charity data, no change to the cryptographic verifier, no claim that modelled attacker behaviour is empirically observed rather than a worst-case rational-actor upper bound.
