# Formal model — BGEN-ECON-BREAKER-001

**Evidence class:** mathematical + deterministic synthetic simulation  
**Status authority:** NONE  

## 1. Primitives

- Fixed pool \(P \in \mathbb{Z}_{>0}\) (design default \(P = 10^9\)).
- Eligible contributions \(e_i \in \mathbb{Z}_{>0}\) for agents \(i \in I\).
- Total eligible \(T = \sum_i e_i\).
- Allocation units (if issued) \(a_i \in \mathbb{Z}_{\geq 0}\).

## 2. Normative pro-rata rule

\[
a_i = \left\lfloor \frac{P \cdot e_i}{T} \right\rfloor, \quad
R = P - \sum_i a_i \geq 0 \text{ unissued.}
\]

**Properties:**

- Supply: \(\sum a_i + R = P\), \(\sum a_i \leq P\).
- Split-mass: if one agent’s \(e\) is partitioned across labels without changing \(\sum e\), total units to that mass differ by at most floor residuals \(O(|I|)\); linear weights are not Sybil-increasing in expectation of weight sum.
- Concentration: \(a_i / \sum a_j \approx e_i / T\) when \(R\) is small relative to \(P\).

## 3. Denominators

\[
\text{share\_of\_pool}_i = \frac{a_i}{P}, \qquad
\text{share\_of\_issued}_i = \frac{a_i}{\sum_j a_j}\ ({\text{if }}\sum a_j>0).
\]

Under caps or large floor remainders these diverge. Metrics must label the denominator.

## 4. Fixed-pool floating implied exchange ratio

Define

\[
\rho = \frac{T}{P}
\]

as the **floating implied eligible-sats weight per unit face** under the approximation \(\sum a_i \approx P\).  
This is a mathematical identity of fixed-pool pro-rata weights. It is **not** a promised redemption rate, market price, or legal classification of the mechanism.

## 5. Alternative weight maps

| Rule | Weight \(w_i\) | Sybil note |
|------|----------------|------------|
| pro_rata | \(e_i\) | split-invariant (mass) |
| capped_pro_rata | \(\min(e_{\mathrm{id}}, C)\) attributed to claims | free identities defeat cap |
| concave_sqrt | \(\lfloor\sqrt{e_i}\rfloor\) | \(\sum\sqrt{}\) increases under split |
| concave_log | \(\lfloor\log_2(e_i+1)\rfloor\) | same |
| time_weighted | \(e_i \cdot \tau_i\) | early \(\tau\) advantage |
| lottery_wo_repl | discrete slots | without replacement of donors |
| no_token | — | \(a_i=0\), charity retains \(e\) |

## 6. Governance (conditional integration)

Let issued shares \(s_i = a_i / \sum a\). Integration rule \(G\):

| \(G\) | Weight |
|-------|--------|
| none | \(0\) |
| nontransferable_equal | \(1/\|I\|\) |
| nontransferable_proportional / token_weighted | \(s_i\) |
| continuously_capped | renormalize \(\min(s_i, c)\) to sum 1 |
| delegated_capped | aggregate after cap |

**Capture** at threshold \(\theta\) (default \(0.5\)): \(\exists i: g_i > \theta\).  
This is **not** a defect of allocation alone unless \(G\) is adopted.

## 7. Conditional rebate

Exogenous rate \(r \in [0,1]\) conditional on collusion:

\[
\text{rebate} = r \cdot D, \quad \text{charity retained} = (1-r)D.
\]

Expected rebate with frictions:

\[
\mathbb{E}[\text{rebate}] = r \cdot D \cdot p_{\mathrm{access}} \cdot p_{\mathrm{enforce}}.
\]

Donor expected net from rebate path subtracts arrangement cost and detection loss.  
Immutable genesis set constrains \(p_{\mathrm{access}}\) (cannot freely mint a colluding charity post-genesis).

## 8. Stolen-asset economics

| Symbol | Meaning |
|--------|---------|
| \(B_{\mathrm{legal}}\) | legal cost basis (often 0 if stolen) |
| \(V_{\mathrm{opp}}\) | opportunity value of alternative disposition of source asset |
| \(G_{\mathrm{tok}}\) | gross token face value |
| \(V_{\mathrm{tok}}\) | risk-adjusted PV after haircut, seizure, lockup |
| \(\pi\) | \(V_{\mathrm{tok}} - V_{\mathrm{opp}} - c_{\mathrm{tx}}\) |

**Pathway theorem (design residual):** verifier admits cryptographic control; does not check legal title.  
**Profit theorem:** \(\pi > 0\) is **assumption-conditional**, not implied by \(B_{\mathrm{legal}}=0\).

Illustrative opportunity:

\[
V_{\mathrm{opp}} = D \cdot f_{\mathrm{alt}} \cdot (1 - p_{\mathrm{seize,source}}).
\]

## 9. Welfare / concentration metrics

- Gini on \(\{a_i\}\) and on \(\{e_i\}\).  
- HHI on normalized shares.  
- Top-1 / top-10 with explicit denominator.  
- Charity net retained under rebate models.  
- Attack profitability thresholds via sensitivity grids.  
- Unissued remainder \(R\).

No metric is an empirical forecast.

## 10. Failure-condition mapping (issue #34)

| ID | Independent treatment |
|----|----------------------|
| FC1 | Token necessity open until ledger functions specified (REV-004) |
| FC2 | Conditional rebate incidence proven; behavioral destruction not unconditional |
| FC3 | Only under explicit proportional/token governance integration |
| FC4 | Pathway yes; profitable laundering conditional on \(\pi\) |
| FC5 | Cutoff deterministic given tip; miner/reorg residual remains |
| FC6 | Caps/concavity without identity layer flag Sybil dependency |
| FC7 | Qualitative alternatives comparison; not auto-decided by simulator |

## 11. Determinism

All scenarios use fixed integer inputs. Lottery uses `random.Random(seed)` without replacement. Scenario re-runs must byte-compare equal JSON results (sorted keys).
