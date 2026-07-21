# Mechanism necessity — is a transferable fixed-pool token required?

**Task:** BGEN-ECON-REDTEAM-001 (issue #34). **Authority:** propose/analysis only.

This document answers Track 1 of issue #34: does Beneficial Genesis's transferable, fixed-pool allocation token have a unique public benefit, coordination function, or security property that a simpler alternative lacks? Per the task's instruction, a negative answer is treated as a valid outcome and is not softened.

**Bottom line: no.** Every candidate benefit we could identify for *transferability specifically* (as opposed to a bounded or non-transferable claim right) is either (a) achievable without transferability, or (b) itself the source of the mechanism's worst modelled failure modes. The evidence is in §§2-4; the comparison table is in §5.

---

## 1. What "necessity" has to mean here

The task requires comparing Beneficial Genesis against at least: direct donation with no token, proof-of-burn migration, pro-rata snapshot/airdrop with no donation, charity-directed protocol fees, non-transferable recognition receipts, transferable fixed-pool allocation (the subject design), and hybrid governance/economic splits. "Necessity" is judged against the program's own stated objective (issue #33): *"a technically sound, economically defensible [...] post-quantum migration mechanism in which qualifying source-chain assets are transferred [...] to immutable charity destinations and cryptographically bind a new-ledger allocation claim."*

Two functions are doing work in that sentence, and they do not require the same design choice:

1. **Migration/coordination function** — giving a Bitcoin holder a cryptographically bound path onto a new ledger. This only requires a *claim right*, not a *tradeable* claim right.
2. **Charitable function** — routing value to charity destinations. This only requires the payment step, which every alternative in the comparison table also has.

Transferability is not required by either function as stated. It is a third, additive design choice, and it is the one this red-team seat is specifically asked to test the necessity of.

## 2. The fixed-pool-regardless-of-demand finding (`19_undersubscribed_pool`, `20_oversubscribed_pool`)

`EXACT_PRO_RATA` (and every alternative allocation scheme modelled here) issues the **entire** pool `P` at epoch close regardless of how much was donated:

- `19_undersubscribed_pool`: a single donor of 1,000 sats, alone in the epoch, is allocated the **entire** 100,000,000-unit pool (`unissued_remainder = 0`).
- `20_oversubscribed_pool`: 2,000 large donors totalling ~499 billion sats-units drive that same donor's implied per-sat claim down to a rounding error (top-1 share 0.100%).

This is the defining behaviour of a **fixed-supply token sale with a floating implied price**, not of a donation-matching or public-good mechanism whose payout should scale with money actually raised. A charity-directed-fee or proof-of-burn design (see §5) ties issuance or benefit to actual flow; a fixed pool does not. This alone means Beneficial Genesis's core issuance rule already resembles "sale-like or investment-contract" behaviour irrespective of transferability, and is the first concrete data point against defending the current design by default.

## 3. What transferability specifically adds

Holding the fixed-pool allocation rule constant, we compared a transferable token against a non-transferable (or delayed-transfer) claim right for the same allocation:

| Effect of transferability | Evidence | Direction |
|---|---|---|
| Lets a donor realize value without waiting for/using the new ledger | `15_lockup_0_months` vs `17_lockup_12_months`: mean speculator utility swings from **+73.5** (immediate) units to **-80.8** units (12-month lock, same 1.5x value multiplier) | Donor convenience, not a coordination/security property |
| Converts a charity donation of **stolen/tainted funds** into a liquid, monetizable asset | `10_stolen_key_donation`, `11_quantum_cutoff_freeze`: attacker's `laundering_gain` = full gross token value (~10,000,000 / ~5,000,000 units respectively) at **zero** legitimate cost basis, because the protocol cannot and does not distinguish stolen from owned source keys (this is an explicit, pre-existing residual risk in `THREAT_MODEL_AND_NONCLAIMS.md` item 2) | Net harm |
| Lets primary-allocation anti-concentration work (caps, concave weighting) be undone after the fact by secondary-market buy-up | Not separately simulated (no secondary-market model in scope), but structurally: every anti-concentration allocation rule tested here (§4) is a **genesis-time snapshot**; nothing in the design pack enforces an allocation cap or concavity *after* tokens become transferable. A well-capitalized actor can simply buy diffuse holders' transferable tokens once any lock-up expires | Net harm to every other mitigation's durability |
| Provides governance power proportional to holdings, unless capped | `13_governance_proportional`: single honest whale reaches **52.488%** of governance weight (crosses simple majority) by donation size alone, with no attack required | Net harm unless capped, and even a cap is a genesis-time snapshot (previous row) |
| Enables a real secondary market that could price-discover the new ledger | Plausible in principle | The only candidate *benefit*; but price discovery is a donor/investor convenience, not a "public benefit, coordination function, or security property" in the program's own framing (issue #33 definition-of-success item 3) |

Every clearly negative row is a **direct consequence of transferability**, not of the fixed-pool rule, the donation step, or the PQ-binding step. The one candidate benefit (secondary-market price discovery) is investor-facing, not migration- or charity-facing, and issue #33 explicitly asks this seat to test whether such benefits are "necessary," not merely convenient.

## 4. Anti-concentration allocation alternatives all fail the same way

Track 3 asks for a comparison of allocation alternatives, including concave/capped weighting intended to reduce whale dominance. We tested whether these survive identity splitting, since Bitcoin-only Beneficial Genesis v1 has **no identity or Sybil-resistance layer** (explicitly disclaimed in `THREAT_MODEL_AND_NONCLAIMS.md`, residual risk item 7).

| Scheme | Single-identity share | Share after splitting into N identities | Split gain |
|---|---|---|---|
| `EXACT_PRO_RATA` (linear, `06_sybil_split_control_pro_rata`) | 43.168% | 43.168% (N=400) | **-0.000%** (split-invariant) |
| `CONCAVE_SQRT` (`05_sybil_split_concave`) | 3.849% | 44.448% (N=400) | **+40.599%** |
| `CAPPED_PRO_RATA`, 10% cap (`26_sybil_split_capped_pro_rata`) | 10.000% (bound by cap) | 80.496% (N=20) | **+70.496%** |

This is the central, load-bearing finding of the whole necessity question: **the only allocation rules that meaningfully reduce whale/plutocratic concentration (concave weighting, per-identity caps) are the ones most severely broken by identity splitting**, and identity splitting is free and unlinkable in a Bitcoin-only, no-KYC design. Linear pro-rata is the only scheme tested that is *not* exploitable this way, but linear pro-rata does nothing to prevent whale concentration in the first place (`03_whale_99`: a single honest whale reaches 99.000% of the pool by contributing 99% of eligible sats — no attack, just size).

In other words: this design space cannot simultaneously claim (a) permissionless, identity-free operation and (b) resistance to whale/plutocratic concentration. Something has to give, and the current design pack does not say which.

## 5. Alternatives comparison

| Alternative | Requires a token at all? | Requires transferability? | Whale-concentration exposure | Rebate/circularity exposure | Stolen-fund laundering exposure | Governance-capture exposure | Unique benefit over simpler options |
|---|---|---|---|---|---|---|---|
| **Direct charitable donation, no token** (`21_no_token_baseline`) | No | No | None (nothing to concentrate) | Same as any donation (charity could still rebate secretly) but attacker gains nothing salable | None (no receipt has resale value) | None | Simplest possible; loses the "migration claim" coordination function entirely |
| **Proof-of-burn migration** | Only a burn commitment, non-transferable by construction | No | Depends on burn-weighting rule (same math as allocation) | Same rebate exposure as any donation-adjacent design | Burn of stolen funds still destroys them; some laundering incentive remains but weaker (no clean liquid output unless the migration claim itself is transferable) | Only if burn-weight becomes governance weight | Directly ties migration eligibility to provable value destruction rather than trust in a charity intermediary |
| **Pro-rata snapshot/airdrop, no donation** | Yes (recipient token) | Typically yes | Mirrors existing chain's concentration (inherits Bitcoin's own Gini, not analyzed here) | None (no donation, no charity) | None | Same proportional-governance risk as subject design if transferable | Drops the charitable framing entirely; not a fair comparison to Beneficial Genesis's stated purpose |
| **Charity-directed protocol fees** | No token required | N/A | None | Charity still could misuse funds, but no donor-side token profit motive | Weak (thief pays a fee, receives nothing back) | None | Ties charitable benefit to actual protocol usage/value flow instead of a one-time fixed pool |
| **Non-transferable recognition/reputation receipt** | Yes, but non-transferable | No | Bounded to primary allocation rule only (no secondary-market re-concentration) | Same rebate exposure as subject design (rebate does not require transferability) | **Eliminated** — a non-transferable receipt has no resale value, so a thief gains nothing salable from donating stolen funds | Governance, if granted, cannot be bought after genesis (still can be captured at donation time by whale size, see `13_governance_proportional`) | Preserves the migration-claim coordination function while removing laundering and secondary re-concentration risk |
| **Transferable fixed-pool token (subject design)** | Yes | Yes | Whale concentration up to 99%+ by honest size alone; anti-concentration mitigations Sybil-exploitable (§4) | Rebate attack unconditionally profitable, undetectable in-protocol (§ below) | Full gross value laundered at zero cost (§3) | Majority-crossing by honest whale size; cap is only a genesis-time snapshot | Secondary-market liquidity/price-discovery only |
| **Hybrid: transferable economic unit, non-transferable/independently-capped governance** | Yes | Economic: yes; governance: no | Economic concentration unchanged from subject design; governance concentration bounded by cap (`14_governance_capped`: max owner share 9.768%, does not cross 1/3 or 1/2) | Unchanged | Unchanged (laundering targets economic value, not governance) | **Mitigated**, provided the cap is enforced continuously (Track E), not only at genesis | Best of the tested designs for the governance-capture axis specifically; does not by itself fix laundering or rebate exposure |

## 6. Answer to the Track 1 question

No modelled or documented function of Beneficial Genesis requires the token to be **transferable**. The migration/coordination function requires only a cryptographically bound claim right (transferable or not). The charitable function requires only the donation-and-verification step (present in every alternative). Transferability's only identified unique effect is enabling donor liquidity and secondary-market price discovery — an investor convenience, not a public benefit, coordination function, or security property in the program's own terms — and it is simultaneously the direct cause of the mechanism's worst laundering and post-genesis re-concentration exposure.

This does not mean Beneficial Genesis as a *charitable migration concept* is unsound; it means the **specific choice to make the allocation claim a freely transferable token**, on top of a fixed pool that issues in full regardless of subscription level, is not supported by this analysis and is the highest-leverage redesign target. See `FAILURE_CONDITIONS.md` for the formal disposition against the task's six failure conditions.
