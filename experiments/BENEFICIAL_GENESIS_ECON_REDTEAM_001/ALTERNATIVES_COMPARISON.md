# Allocation alternatives comparison (Track 3)

This document is the Track 3 companion to `MECHANISM_NECESSITY.md` §5 (mechanism-level alternatives). Where that document asks *whether a transferable token is needed at all*, this one holds "a token exists" fixed and compares **how it is allocated**, using the same simulator (`model/allocation.py`, `results/*.json`).

All figures are from the checked-in `results/*.json`, reproducible via `python3 experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py`.

## 1. Allocation-rule comparison

| Rule | Whale concentration (honest, no attack) | Sybil-split exploitable? | Small-donor outcome |
|---|---|---|---|
| Exact pro-rata | Scales linearly with contribution; reaches 99.000% for a 99%-of-eligible whale (`03_whale_99`) | No (`06_sybil_split_control_pro_rata`: gain ≈ 0) | Proportional only; no windfall |
| Capped pro-rata (10% cap) | Bounded at the cap *per identity* (`22_capped_pro_rata_whale`) | **Yes, severely** — 10.000% → 80.496% by splitting into 20 identities (`26_sybil_split_capped_pro_rata`) | Unaffected unless whale evades cap |
| Concave (sqrt) | Reduced relative to linear for an honest single identity | **Yes, severely** — 3.849% → 44.448% by splitting into 400 identities (`05_sybil_split_concave`) | Windfall relative to sats contributed, but only if *other* participants stay single-identity |
| Concave (log) | Whale share compressed enough that the whale itself is the only unprofitable participant at breakeven pricing (`25_concave_log_whale`: 500/501 donors profitable, whale unprofitable) | Not separately probed, but shares the same weight-concavity property as sqrt and is expected to be similarly split-exploitable | Same caveat as sqrt |
| Time-weighted | Rewards contribution timing, not size, as such | Not probed (orthogonal axis — splitting does not change contribution timing) | Early donor utility (~100,000,899) far exceeds late donor utility (~-1.0 normalized units) for equal sats in `23_time_weighted_late_donor_disadvantage`, i.e. this rule substitutes a **timing** advantage for a **size** advantage; it does not address whale concentration |
| Random lottery component (10% of pool) | Adds variance without changing the expected-value concentration profile of the 90% pro-rata remainder | Sybil-neutral for the pro-rata portion; the lottery portion could in principle be gamed by acquiring more distinct lottery tickets (not separately probed here since ticket weighting mirrors the pro-rata weight) | Only 8/501 donors profitable overall (`24_random_lottery_component`) — a lottery component concentrates *which* small donors benefit without reducing the mean concentration problem |
| No token | N/A (no allocation) | N/A | No windfall, no attack surface, no coordination claim either |

**Reading:** every rule that visibly reduces whale concentration for an *honest, single-identity* population is the rule most exploitable once identities can be split for free — see `MECHANISM_NECESSITY.md` §4 for why this is fatal to recommending concave or capped weighting as-is for a permissionless Bitcoin-only design.

## 2. Sealed commitment / known vs. unknown denominator

Not implemented as a distinct allocation formula (sealed commitment changes *when donors learn the total*, not the allocation arithmetic). Its effect is measured instead through the denominator-shock probe:

- `09_denominator_doubles_final_block`: an early donor's share falls from 4.802% to 0.828% (dilution 3.975 percentage points) when a late donor group more than quintuples the eligible total in the final block.
- `11_quantum_cutoff_freeze`: the same mechanism, reframed as donors who would have donated after a declared classical-key-compromise cutoff being locked out (dilution 2.011 percentage points in the modelled sizes).

A sealed-commitment design (donors commit to an amount before seeing the running total) would remove the *informational* asymmetry that lets a well-positioned late actor (a miner, or anyone with better mempool visibility) target a share; it would not change the fact that exact pro-rata's allocation math itself is timing-fair (no privileged marginal rate — see `FORMAL_MODEL.md` §6). We record this as a genuine, low-cost improvement candidate rather than a rejection trigger on its own.

## 3. Governance weighting alternatives

> **Repair note (E-003, BGEN-ECON-REV-003):** governance analysis is now computed only for scenarios that explicitly opt in via `governance_rules`, under named, explicitly transferable-or-not rules (`model/governance.py`) — it is never assumed as a default property of the allocation mechanism.
>
> **Micro-repair note:** the fifth rule below is named `cap_then_renormalize`, not "continuously capped" or any wording implying a hard final per-holder ceiling. It clips each holder's raw proportional weight at the nominal fraction, then renormalizes the clipped weights to sum to 1 again — and that renormalization can push a holder's *final* share back above the nominal clip, which is exactly what the "Max single-owner governance share" column shows below (9.768% and 17.797% both exceed their respective 5%/10% nominal clips). This is disclosed, not a bug. See `tests/test_governance.py::TestCapThenRenormalize` for 1/2/3-holder proofs.

| Rule | Max single-owner governance share | Nominal clip fraction | Final share exceeds nominal clip? | Crosses simple majority | Crosses blocking third |
|---|---|---|---|---|---|
| No governance rights (`none`, `13_governance_rules_comparison`) | 0% | n/a | n/a | False | False |
| One equal vote per recipient (`nontransferable_equal`, `13_governance_rules_comparison`) | 0.2% | n/a | n/a | False | False |
| Proportional, frozen at genesis (`nontransferable_proportional`, `13_governance_rules_comparison`) | 52.488% | n/a | n/a | **True** | True |
| Proportional, transferable with the token (`token_weighted`, `13_governance_rules_comparison`) | 52.488% (numerically identical to the row above; differs only in durability once tokens transfer) | n/a | n/a | **True** | True |
| Cap-then-renormalize at 5% (`cap_then_renormalize`, `14_governance_cap_then_renormalize`) | 9.768% | 5% | **Yes** | False | False |
| Cap-then-renormalize at 10% (`cap_then_renormalize`, `14_governance_cap_then_renormalize`) | 17.797% | 10% | **Yes** | False | False |

Cap-then-renormalize reduced concentration below the majority/blocking-third thresholds **in this tested 501-donor population** — that is a scenario-specific result, not a per-holder guarantee, since the whale's own final share already exceeds the nominal clip fraction in both rows above. Decoupling governance weight from economic allocation and applying this rule is the most effective mitigation identified in this study for the governance-capture failure condition against majority/blocking-third capture specifically — **provided it is enforced on an ongoing basis by the ledger's own consensus rules (Track E), not only computed once at genesis; durable, hard-capped governance enforcement remains open Track E work.** This model does not simulate secondary-market vote-buying after genesis; it only shows that a cap-then-renormalize rule, if it exists and holds, reduces (but does not eliminate) concentration at the point of allocation. Whether the current design defaults to any of these rules is unspecified by the design pack — see `FAILURE_CONDITIONS.md` FC3.

## 4. Vesting / non-transferability window

| Lock-up | Mean speculator utility at 1.5x breakeven value |
|---|---|
| 0 months (`15_lockup_0_months`) | +73.5 (normalized units) |
| 3 months (`16_lockup_3_months`) | reduced, still positive at this discount schedule |
| 12 months (`17_lockup_12_months`) | -80.8 |

Under the assumed 7%/month, 70%-cap illiquidity discount (`FORMAL_MODEL.md` §3 — an assumed parameter, not an empirical estimate), a 12-month lock-up is sufficient to flip a speculative position from profitable to unprofitable at a 1.5x breakeven token value. Longer lock-ups reduce but do not eliminate the stolen-fund laundering incentive from §3 of `MECHANISM_NECESSITY.md`, since a thief holding stolen funds has, by construction, no legitimate opportunity cost for the locked period and may simply wait it out — the discount model applies to a donor with real alternative uses for their capital, which a thief is not assumed to have.

## 5. Recommendation on allocation alternatives

If the program proceeds past the necessity question in `MECHANISM_NECESSITY.md` with some form of token retained, the least-bad combination identified here is: **linear (uncapped) pro-rata economic allocation** (Sybil-split-invariant, §1) + **independently capped, continuously-enforced governance weight** (§3) + **a meaningful non-transferability window** (§4) + **sealed/precommitted donation to remove denominator gaming** (§2). This combination does not address rebate/circularity (see `FAILURE_CONDITIONS.md`) or eliminate whale concentration itself (linear pro-rata still lets a 99%-of-eligible whale claim 99% of the pool) — it only avoids the specific Sybil-exploitability and governance-capture failure modes documented above.
