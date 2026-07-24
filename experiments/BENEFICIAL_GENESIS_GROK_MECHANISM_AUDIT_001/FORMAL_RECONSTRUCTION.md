# Formal reconstruction — independent

**Evidence class:** mathematical deduction + deterministic integer probes under declared rules.  
**Authority:** none.  
**Imports of subject economics modules:** none during independent phase.

## 1. Objects

- Fixed genesis pool \(P \in \mathbb{Z}_{>0}\) (abstract quanta; not a BTC price).
- Eligible weights \(e_i \in \mathbb{Z}_{>0}\) from admitted donation claims (satoshis as weights).
- Total \(T = \sum_i e_i\).
- Allocation \(a_i = \left\lfloor P \cdot e_i / T \right\rfloor\).
- Remainder \(R = P - \sum_i a_i\) **unissued** (`UNISSUED_FLOOR_REMAINDER`).

## 2. Supply conservation

**Claim.** \(\sum_i a_i \le P\) and \(\sum_i a_i + R = P\).

**Proof sketch.** For non-negative integers, \(\sum_i \lfloor P e_i / T \rfloor \le \lfloor P \sum_i e_i / T \rfloor = \lfloor P \rfloor = P\) when \(\sum e_i = T\). Remainder definition forces exact partition of \(P\).

**Probe:** `results/14_supply_stress.json` — all cases `ok: true`.

## 3. Split invariance (linear)

Fix \(T\) and one actor's total eligible \(e\). Compare one claim \(e\) vs parts \(e_1+\cdots+e_k=e\).

\[
\sum_{j=1}^k \left\lfloor P e_j / T \right\rfloor \le \left\lfloor P e / T \right\rfloor
\]

with possible **strict decrease** from extra floor residuals. Linear pro-rata therefore does **not** reward address splitting for allocation quantity (governance aggregation is a separate issue).

**Probe:** `results/02_split_invariance_linear.json` — `split_never_increases_issued_to_splitter: true`.

## 4. Concave alternatives and Sybil

Let \(w_i = f(e_i)\) with \(f\) strictly concave and increasing (e.g. \(\sqrt{\cdot}\), \(\lfloor\log_2(1+e)\rfloor\)), then allocate \(\lfloor P w_i / \sum w \rfloor\).

Against a fixed competitor, splitting \(e\) into \(k\) equal parts typically **increases** \(\sum f(e/k)\) relative to \(f(e)\), raising the splitter's share.

**Countermodel to “concave fixes whales without identity”:** Sybil gain probes:

| Rule | e | parts | competitor | sybil_gain (pool \(10^9\)) |
|------|---|-------|------------|---------------------------|
| sqrt | \(10^7\) | 100 | \(10^7\) | \(+409{,}038{,}600\) |
| log2 | \(10^7\) | 100 | \(10^7\) | \(+485{,}828{,}700\) |

Source: `results/03_concave_sybil.json`.

**Boundary:** alone in the pool, concave Sybil cannot steal share (already ~100%). The failure mode is competitive share theft, not solo remainder gaming.

## 5. Per-identity caps and cap-then-renormalize

Cap share \(\gamma \in (0,1]\), cap amount \(\lfloor \gamma P \rfloor\). Cap-then-renormalize: clip identities over cap; redistribute residual pool among free identities by weight; iterate.

**Without durable identity,** a whale splits into \(m\) identities each under cap.

**Probe (pool \(10^9\), \(\gamma=1/10\), whale 80M + rest 20M):**

| Structure | Whale allocation |
|-----------|------------------|
| one identity | \(100{,}000{,}000\) (hard cap) |
| 20 identities × 4M | \(900{,}000{,}000\) |

`sybil_evades_cap: true` — `results/04_cap_sybil_evasion.json`.

## 6. Denominator uncertainty

Share of actor with fixed \(e\) is \(e/T\). If late inflow raises \(T \to T'\), allocation falls ~proportionally (floor effects aside).

**Probe:** early \(T=10^7\) alloc \(10^8\); after double \(T=2\cdot10^7\) alloc \(5\cdot10^7\); dilution ratio \(1/2\) — `results/05_denominator_uncertainty.json`.

Miner/cutoff influence on late inclusion is a **structural pathway** on real Bitcoin; not simulated as consensus here.

## 7. Undersubscription / oversubscription

Fixed \(P\) implies allocation **per sat** \(\approx P/T\):

- Small \(T\): each sat extremely valuable in quanta (speculative coordination pathway).
- Large \(T\): quanta per sat → 0 (mercenary flow only if EV of other channels remains).

`results/06_under_over_subscription.json`.

## 8. Rebate incidence with access friction

Out-of-protocol. Let access share \(\alpha\), rebate rate \(r\):

\[
\text{rebate} = \left\lfloor \lfloor D\alpha \rfloor \cdot r \right\rfloor,\quad
\text{charity\_net} = D - \text{rebate}.
\]

Net is monotone decreasing in \(\alpha r\). At \(\alpha=r=1\), net \(=0\). At low access, most donated value can remain.

**Secret whale access:** donations \([50M,1M,1M,1M]\), \(r=1/2\), only whale accesses → charity net \(28M\) of \(53M\) — `results/08_secret_rebate_whale.json`.

## 9. Tainted opportunity-cost sensitivity

Attacker compares retain value of tainted sats vs allocation value under assumed \(v\). Pathway (crypto admits control ≠ title) is **design residual**. Profitability is **region-conditional** — `results/10_tainted_sensitivity.json`.

## 10. Governance

- Proportional to economic units: whale with 80% units → 80% gov (`results/11_governance.json`).
- Cap-then-renormalize with weak identity: whale 80 vs rest 20 as one id → gov share \(1/2\); as 10×8 Sybil → gov share \(9/10\).

Transferability of units + token-weighted gov ⇒ durable post-genesis re-concentration even if genesis caps held.

## 11. Transfer regimes (F1–F4 held)

| Regime | F1 charity | F2 bind | F3 finite pool | F4 claim | Transferable unit |
|--------|------------|---------|----------------|----------|-------------------|
| No token | yes | no | no | no | n/a |
| Non-transferable receipt | yes | yes | yes | yes | no |
| Delayed transfer | yes | yes | yes | yes | after delay |
| Transferable allocation | yes | yes | yes | yes | yes |
| Burn migration | no | yes | yes | yes | optional |
| Snapshot no donation | no | weak | yes | yes | typical |

**Structural necessity of transferability for F1–F4:** **false** (`results/12_transfer_regimes.json`).

Open: unspecified future ledger functions (payments, staking, fees, bootstrap) may require a transferable unit — that is a **product decision**, not demonstrated by the design pack.
