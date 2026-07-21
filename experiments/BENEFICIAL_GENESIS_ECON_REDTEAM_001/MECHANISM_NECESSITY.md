# Mechanism necessity — is a transferable fixed-pool token required?

**Task:** BGEN-ECON-REDTEAM-001 (issue #34), repaired under BGEN-ECON-REPAIR-002 (issue #38). **Authority:** propose/analysis only.

This document answers Track 1 of issue #34: does Beneficial Genesis's transferable, fixed-pool allocation token have a unique public benefit, coordination function, or security property that a simpler alternative lacks? Per the task's instruction, a negative answer is treated as a valid outcome and is not softened.

> **Repair note (E-004, BGEN-ECON-REV-004):** the original version of this document concluded, without qualification, that transferability "has no necessary function." The controlling review correctly identified that this overreached: the design pack specifies the charity-receipt and migration-claim-binding functions, but does **not** specify the target new ledger's ongoing economic functions (payment medium, staking/security collateral, fee token, capital allocation, network-bootstrap distribution). Necessity for *those* functions cannot be closed by this analysis until the functions are specified. This version states the narrower, supported conclusion and adds an explicit target-function matrix (§3a) so the open question is visible rather than answered by omission.

**Narrowed bottom line:** transferability is **not necessary** for the charity-receipt or migration-claim-binding functions the design pack actually specifies — those are satisfied by a claim right, transferable or not. Whether transferability is necessary for a fuller set of new-ledger functions (payment, staking, fees, bootstrap distribution) is an **open question**, not something this analysis can close, because the design pack does not specify those functions for v1. Within the functions that *are* specified, transferability's only identified benefit is donor liquidity/secondary-market price discovery, and it is simultaneously implicated in the mechanism's most serious modelled risk surfaces (§3).

---

## 1. What "necessity" has to mean here

The task requires comparing Beneficial Genesis against at least: direct donation with no token, proof-of-burn migration, pro-rata snapshot/airdrop with no donation, charity-directed protocol fees, non-transferable recognition receipts, transferable fixed-pool allocation (the subject design), and hybrid governance/economic splits. "Necessity" is judged against the program's own stated objective (issue #33): *"a technically sound, economically defensible [...] post-quantum migration mechanism in which qualifying source-chain assets are transferred [...] to immutable charity destinations and cryptographically bind a new-ledger allocation claim."*

Two functions are explicitly specified by that sentence and by the design pack (`experiments/BENEFICIAL_GENESIS_DESIGN_001`):

1. **Migration/coordination function** — giving a Bitcoin holder a cryptographically bound path onto a new ledger. This only requires a *claim right*, not a *tradeable* claim right.
2. **Charitable function** — routing value to charity destinations. This only requires the payment step, which every alternative in the comparison table also has.

A third class of functions is **not** specified by the design pack, but is plausible for *some* future new ledger built on top of this migration mechanism: payment medium, staking/security collateral, fee payment, capital allocation, and network-bootstrap ownership distribution. Whether the eventual ledger needs a transferable *economic* unit for any of these is a real question this seat cannot answer without the functions being specified — see §3a.

## 2. The fixed-pool-regardless-of-demand finding (`19_undersubscribed_pool`, `20_oversubscribed_pool`)

`EXACT_PRO_RATA` (and every alternative allocation scheme modelled here) issues the **entire** pool `P` at epoch close regardless of how much was donated:

- `19_undersubscribed_pool`: a single donor of 1,000 sats, alone in the epoch, is allocated the **entire** 100,000,000-unit pool (`unissued_remainder = 0`).
- `20_oversubscribed_pool`: 2,000 large donors totalling ~499 billion sats-units drive that same donor's implied per-sat claim down to a rounding error (top-1 share of pool 0.100%).

> **Repair note (E-006, BGEN-ECON-REV-006):** the original text here called this a "fixed-supply token sale with a floating implied price" and "sale-like or investment-contract behaviour." That is a legal/regulatory classification, which this task explicitly forbids this seat from making. The mathematical property is real and stands on its own without that label.

**Neutral restatement:** this is a **fixed-pool, floating implied allocation ratio** — the size of the pool an epoch issues does not depend on how much value flowed in; only each unit's *implied claim* on that fixed pool depends on subscription level. A charity-directed-fee or proof-of-burn design (§5) ties issuance or benefit to actual flow; a fixed pool does not. Whether this ratio behaviour carries legal or regulatory significance is a question for qualified counsel under Track F of issue #33, not for this seat.

## 3. What transferability specifically adds (within the specified functions)

Holding the fixed-pool allocation rule constant, we compared a transferable token against a non-transferable (or delayed-transfer) claim right for the same allocation, restricted to the charity-receipt and migration-claim-binding functions the design pack actually specifies:

| Effect of transferability | Evidence | Direction |
|---|---|---|
| Lets a donor realize value without waiting for/using the new ledger | `15_lockup_0_months` vs `17_lockup_12_months`: mean speculator utility swings from **+73.5** (immediate) units to **-80.8** units (12-month lock, same 1.5x value multiplier) | Donor convenience, not a coordination/security property |
| Converts a charity donation of **stolen/tainted funds** into a liquid, monetizable asset | `10_stolen_key_donation`, `11_quantum_cutoff_freeze`: the verifier cannot distinguish stolen from owned source keys (an explicit, pre-existing residual risk in `THREAT_MODEL_AND_NONCLAIMS.md` item 2), so a migration pathway for tainted funds exists. Whether it is *net profitable* is assumption-conditional, not automatic — the decomposed model (`model/tainted_funds.py`) separates legal cost basis, forgone alternative-disposition value, and migration-path risk, and the sensitivity grid in `10_stolen_key_donation`'s results shows both profitable and unprofitable cells depending on those assumptions. Transferability is what makes the *profitable* cells reachable at all: a non-transferable receipt gives the thief nothing saleable regardless of assumptions | Net additional risk surface, magnitude conditional |
| Lets primary-allocation anti-concentration work (caps, concave weighting) be undone after the fact by secondary-market buy-up | Not separately simulated (no secondary-market model in scope), but structurally: every anti-concentration allocation rule tested here (§4) is a **genesis-time snapshot**; nothing in the design pack enforces an allocation cap or concavity *after* tokens become transferable. A well-capitalized actor can simply buy diffuse holders' transferable tokens once any lock-up expires | Net harm to every other mitigation's durability |
| Provides governance power proportional to holdings, unless the governance rule is explicitly decoupled and capped | `13_governance_rules_comparison`: under the `token_weighted` rule, a single honest whale reaches **52.488%** of governance weight (crosses simple majority) by donation size alone, with no attack required; under `nontransferable_equal` or `none`, the same whale controls 0.2% or 0%. Governance capture is **conditional on which integration rule a future ledger adopts** — the allocation mechanism alone does not force any particular rule (see `FAILURE_CONDITIONS.md` FC3) | Conditional net harm, avoidable by rule choice |
| Enables a real secondary market that could price-discover the new ledger | Plausible in principle | The only candidate *benefit* within the specified functions; price discovery is a donor/investor convenience, not a "public benefit, coordination function, or security property" in the program's own framing (issue #33 definition-of-success item 3) |

## 3a. Target-ledger-function matrix (open question, not closed by this analysis)

The design pack does not specify whether or how the new ledger uses the allocation unit beyond the migration claim itself. The following functions are **hypotheses about a possible future ledger**, not properties this analysis can prove or disprove:

| Candidate ledger function | Plausibly requires a transferable economic unit? | Satisfied by a non-transferable claim? | Status |
|---|---|---|---|
| Charity payment + migration-claim binding | No | Yes | **Closed**: not necessary (this analysis) |
| Payment medium on the new ledger | Yes, typically | No | **Open**: function unspecified in design pack |
| Staking / economic-security collateral | Yes, typically | Partially (bonded, slow-unlock claims can work) | **Open**: function unspecified |
| Fee payment for ledger resources | Yes, typically | No | **Open**: function unspecified |
| Capital allocation / collateral in markets | Yes, typically | No | **Open**: function unspecified |
| Ownership-distribution network bootstrap | Often, but not always | Delayed-conversion designs exist (§5, alternative H) | **Open**: function unspecified |
| Liquidity / secondary-market price discovery | Yes, by definition | No | **Open, but this is convenience, not a specified requirement** |

**Implication:** claiming transferability is "unnecessary" without stating whether the payment/staking/fee/bootstrap functions are in scope for v1 overreaches, exactly as the controlling review found. Claiming transferability is "required" for the charity-receipt function also overreaches in the other direction — that function completes at the source-chain payment step regardless of what happens to the claim afterward. The correct scope-bounded statement is in the "Bottom line" above.

## 4. Anti-concentration allocation alternatives all fail the same way

Track 3 asks for a comparison of allocation alternatives, including concave/capped weighting intended to reduce whale dominance. We tested whether these survive identity splitting, since Bitcoin-only Beneficial Genesis v1 has **no identity or Sybil-resistance layer** (explicitly disclaimed in `THREAT_MODEL_AND_NONCLAIMS.md`, residual risk item 7). This finding is independently confirmed by a second-family (Grok) reconstruction and is preserved unchanged by this repair (E-008); see `CROSS_MODEL_COMPARISON.md`.

| Scheme | Single-identity share of pool | Share of pool after splitting into N identities | Split gain |
|---|---|---|---|
| `EXACT_PRO_RATA` (linear, `06_sybil_split_control_pro_rata`) | 43.168% | 43.168% (N=400) | **-0.000%** (split-invariant, aside from integer floor residuals) |
| `CONCAVE_SQRT` (`05_sybil_split_concave`) | 3.849% | 44.448% (N=400) | **+40.599%** |
| `CAPPED_PRO_RATA`, 10% cap (`26_sybil_split_capped_pro_rata`) | 10.000% (bound by cap) | 80.496% (N=20) | **+70.496%** |

This is the central, load-bearing finding of the whole necessity question: **the only allocation rules that meaningfully reduce whale/plutocratic concentration (concave weighting, per-identity caps) are the ones most severely broken by identity splitting**, and identity splitting is free and unlinkable in a Bitcoin-only, no-KYC design. Linear pro-rata is the only scheme tested that is *not* exploitable this way, but linear pro-rata does nothing to prevent whale concentration in the first place (`03_whale_99`: a single honest whale reaches 99.000% of the pool by contributing 99% of eligible sats — no attack, just size).

In other words: this design space cannot simultaneously claim (a) permissionless, identity-free operation and (b) resistance to whale/plutocratic concentration through allocation-formula tricks alone. Something has to give, and the current design pack does not say which. This is FC6 in `FAILURE_CONDITIONS.md` and is treated as **mathematically proven**, not conditional.

## 5. Alternatives comparison

| Alternative | Requires a token at all? | Requires transferability? | Whale-concentration exposure | Rebate/circularity exposure | Stolen-fund migration exposure | Governance-capture exposure | Unique benefit over simpler options |
|---|---|---|---|---|---|---|---|
| **Direct charitable donation, no token** (`21_no_token_baseline`) | No | No | None (nothing to concentrate) | Conditional 1:1 rebate risk exists regardless of token (a charity can always secretly kick back cash); attacker gains nothing saleable from the receipt itself | None (no receipt has resale value) | None | Simplest possible; loses the migration-claim coordination function entirely |
| **Proof-of-burn migration** | Only a burn commitment, non-transferable by construction | No | Depends on burn-weighting rule (same math as allocation) | Same rebate exposure as any donation-adjacent design | Burn of stolen funds still destroys them; weaker migration-path incentive (no clean liquid output unless the migration claim itself is transferable) | Only if burn-weight becomes governance weight | Directly ties migration eligibility to provable value destruction rather than trust in a charity intermediary |
| **Pro-rata snapshot/airdrop, no donation** | Yes (recipient token) | Typically yes | Mirrors existing chain's concentration (inherits Bitcoin's own Gini, not analyzed here) | None (no donation, no charity) | None | Same governance-rule-dependent risk as subject design if transferable | Drops the charitable framing entirely; not a fair comparison to Beneficial Genesis's stated purpose |
| **Charity-directed protocol fees** | No token required | N/A | None | Charity still could misuse funds, but no donor-side token profit motive | Weak (thief pays a fee, receives nothing back) | None | Ties charitable benefit to actual protocol usage/value flow instead of a one-time fixed pool |
| **Non-transferable recognition/reputation receipt** | Yes, but non-transferable | No | Bounded to primary allocation rule only (no secondary-market re-concentration) | Same conditional rebate exposure as subject design (rebate does not require transferability) | **Eliminated** — a non-transferable receipt has no resale value, so a thief gains nothing saleable from donating stolen funds | Governance, if granted, cannot be bought after genesis; still capturable at donation time by whale size under a proportional rule (`13_governance_rules_comparison`) | Preserves the migration-claim coordination function while removing the migration-path monetization and secondary re-concentration risk |
| **Nontransferable receipt → later convert under a separate gate (alternative H)** | Yes, delayed | Delayed | Delayed | Delayed | Delayed until conversion; a later gate could apply additional screening | Delayed | Defers the transferability decision to a point where target-ledger functions (§3a) may actually be specified |
| **Transferable fixed-pool token (subject design)** | Yes | Yes | Whale concentration up to 99%+ by honest size alone; anti-concentration mitigations Sybil-exploitable (§4) | Rebate arithmetic conditionally one-for-one; predictable aggregate destruction of charity benefit is **not** supported without access/enforcement/detection assumptions (`FAILURE_CONDITIONS.md` FC2) | Migration pathway exists; net profitability is assumption-conditional (`model/tainted_funds.py` sensitivity grid), not automatic | Majority-crossing by honest whale size under a proportional/token-weighted rule; a decoupled cap works only if enforced continuously (Track E) | Secondary-market liquidity/price-discovery; open question on payment/staking/fee/bootstrap functions (§3a) |
| **Hybrid: transferable economic unit, non-transferable/independently cap-then-renormalize governance** | Yes | Economic: yes; governance: no | Economic concentration unchanged from subject design; governance concentration reduced below 1/3 and 1/2 in the tested many-holder scenario (`14_governance_cap_then_renormalize`, 500bps: max holder share ~9.8% — this already exceeds the 5% nominal clip once renormalized, so it is **not** a hard per-holder cap, only a scenario-specific reduction) | Unchanged | Unchanged (migration pathway targets economic value, not governance) | **Reduced concentration in the tested allocation-time scenario**, provided a rule like this is enforced continuously (Track E), not only at genesis; durable hard-capped governance remains open work | Best of the tested designs for the governance-capture axis specifically; does not by itself fix the migration-pathway or rebate exposure |

## 6. Answer to the Track 1 question

**Not necessary, within the specified functions:** the charity-receipt and migration-claim-binding functions the design pack actually specifies require only a cryptographically bound claim right, not a tradeable one. Within those functions, transferability's only identified benefit is donor liquidity and secondary-market price discovery — an investor convenience, not a public benefit, coordination function, or security property in the program's own terms — while being implicated (via secondary-market buy-up and migration-pathway monetization) in the mechanism's most serious modelled risk surfaces.

**Open, beyond the specified functions:** whether a transferable economic unit is necessary for a fuller new-ledger product (payment medium, staking/security collateral, fee payment, capital allocation, ownership-distribution bootstrap) cannot be closed by this analysis, because the design pack does not specify those functions for v1 (§3a).

This does not mean Beneficial Genesis as a *charitable migration concept* is unsound; it means the **specific choice to make the allocation claim a freely transferable token, without specifying which broader ledger functions require that**, on top of a fixed pool that issues in full regardless of subscription level, is the highest-leverage redesign target identified by this analysis. See `FAILURE_CONDITIONS.md` for the formal disposition against all seven of the task's failure conditions and the resulting `CONTINUE_WITH_CONDITIONS` recommendation.
