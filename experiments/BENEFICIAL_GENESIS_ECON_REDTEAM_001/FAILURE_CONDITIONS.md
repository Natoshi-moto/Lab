# Failure conditions disposition — BGEN-ECON-REDTEAM-001

**Repaired under BGEN-ECON-REPAIR-002 (issue #38, E-001 through E-009).** Per issue #34, the task must recommend `REJECT_OR_REDESIGN` if any of the seven listed failure conditions remains without a defensible mitigation. This version maps all **seven** conditions (the original submission mapped only six and folded the identity-dependent condition into narrative — a repaired gap, E-007) and classifies each with an explicit evidence class rather than a bare trigger/no-trigger call:

- **mathematically proven** — follows deductively from the allocation rule itself; no assumption sweep changes the conclusion;
- **conditional simulation result** — true given a stated set of modelling assumptions; a different assumption set can change the sign or magnitude;
- **structural risk** — a real, verified pathway (e.g. the verifier not checking legal ownership) whose *magnitude* is not, and cannot be, established by this simulator;
- **empirical unknown** — depends on real-world facts (donor behavior, market prices, adoption) this package does not and cannot observe;
- **policy/legal question** — requires qualified counsel or an operator decision outside this seat's authority.

---

### FC1. "The transferable token has no necessary function beyond rewarding donation."

**Evidence class: conditional simulation result / policy question (narrowed from the original absolute claim, E-004).**

Not necessary for the charity-receipt and migration-claim-binding functions the design pack specifies (`MECHANISM_NECESSITY.md` §1–§3: a non-transferable claim satisfies both). Necessity for unspecified future ledger functions (payment, staking, fees, capital allocation, bootstrap distribution) is an **open question** the design pack does not resolve (§3a) — this seat cannot prove transferability is unnecessary for functions that have not been specified, and does not claim to.

**Disposition:** partially triggered — requires the program to specify target ledger functions before transferability can be defended or ruled out; not a closed mathematical disproof.

---

### FC2. "Rational donor behavior predictably destroys charity net benefit through rebates."

**Evidence class: conditional simulation result (narrowed from an over-generalized behavioral prediction, E-002).**

`27_rebate_access_frictions` and the `07_rebate_sweep`/`08_secret_rebate_whale`/`18_charity_set_single_vs_multi` scenarios together show two distinct results that must not be merged:

1. **Conditional arithmetic (mathematically proven given an arrangement exists):** rebate reduces charity retention by exactly the rebate amount, for any rate tested 0–100%, with **zero** additional cost — this holds regardless of assumptions and is preserved from the original finding (E-008).
2. **Expected, friction-adjusted outcome (conditional simulation result):** for a donor who does **not** already have a colluding arrangement, expected rebate collapses to a small fraction of the conditional figure once access is rare and costly (`27_rebate_access_frictions`: expected rebate 100,000 vs. conditional 2,500,000 — under 1/20th — at a modelled 5% access probability, 80% enforcement, 30% detection risk).

Beneficial Genesis's charity set is fixed at genesis (an immutable registry); "find or create a colluding charity" is not a free donor action, so the *predictable aggregate destruction* claim from the original submission is **not supported** without supplying access/enforcement/detection assumptions this package does not observe empirically.

**Disposition:** not triggered as an unconditional prediction; the conditional arithmetic remains a real, always-available residual risk that no protocol-level or cryptographic mechanism prevents.

---

### FC3. "One actor can obtain practical governance control by donation alone."

**Evidence class: conditional simulation result (narrowed from treating proportional governance as a default, E-003).**

Beneficial Genesis, as specified, is an *allocation* mechanism; it does not itself specify how (or whether) economic allocation becomes governance weight on a new ledger. `13_governance_rules_comparison` evaluates five explicit rules on the same whale-heavy population:

| Rule | Max single-holder governance share | Crosses majority |
|---|---|---|
| `none` | 0% | No |
| `nontransferable_equal` (one vote per recipient) | 0.2% | No |
| `nontransferable_proportional` / `token_weighted` | 52.488% | **Yes** |
| `cap_then_renormalize` (5% nominal clip, `14_governance_cap_then_renormalize`) | ~9.8% (exceeds the 5% nominal clip after renormalization — see note below) | No |

Governance capture by donation size alone is **true if and only if** a proportional or token-weighted rule is the adopted integration choice — it is not a property of the allocation mechanism by itself. `cap_then_renormalize` reduced concentration below the majority/blocking-third thresholds **in this tested many-holder scenario only**; it is not a hard final per-holder cap — clipping a holder's raw weight and then renormalizing the clipped weights back up to sum to 1 can, and in this scenario does, push that holder's *final* weight above the nominal clip fraction (proven at 1/2/3-holder scale in `tests/test_governance.py::TestCapThenRenormalize`). Whether such a rule, hard-capped or otherwise, survives once tokens are transferable and lock-ups expire is a Track E question this seat cannot verify (see `NONCLAIMS_AND_OPEN_QUESTIONS.md`).

**Disposition:** conditional on the integration rule adopted; not a default defect of the current allocation subject.

---

### FC4. "The mechanism materially incentivizes stolen/tainted-fund laundering into a new asset."

**Evidence class: structural risk (pathway) + conditional simulation result (profitability), narrowed from an unconditional zero-cost-profit claim, E-001.**

`10_stolen_key_donation` and `11_quantum_cutoff_freeze` confirm the **pathway** is real: the verifier validates cryptographic control of source funds, not legal ownership (a pre-existing, explicit residual risk in the design pack's own `THREAT_MODEL_AND_NONCLAIMS.md`). This is **mathematically/structurally proven** and unaffected by any assumption.

Whether migrating stolen funds is **net profitable** is a separate, assumption-conditional question. `model/tainted_funds.py` decomposes legal cost basis, forgone alternative-disposition value, migration-path seizure/detection risk, liquidation haircut, and lock-up, and the sensitivity grid attached to `10_stolen_key_donation` shows both profitable and unprofitable outcomes depending on the assumed token value and alternative-realization fraction. The original submission's claim of unconditional "zero-cost, fully profitable laundering" is **not supported**; "legal cost basis = 0" does not imply "opportunity cost = 0."

**Disposition:** the pathway is a proven, serious residual risk requiring a redesign or policy gate regardless of profitability assumptions; the specific "automatically profitable at zero cost" framing is retracted.

---

### FC5. "Timing/cutoff games produce non-deterministic or privileged allocation."

**Evidence class: structural risk / empirical unknown — real but bounded, unchanged in substance by this repair.**

`09_denominator_doubles_final_block` shows a concrete dilution effect (4.802% → 0.828% share) from a late donor surge. This is **not** a privileged allocation in the sense of an unfair marginal rate — exact pro-rata gives every marginal sat the same rate regardless of timing — but it is a real source of ex-ante non-determinism disadvantaging early, uninformed donors relative to anyone with better visibility into the final denominator (a miner, an exchange, or a mempool-watcher). A low-cost mitigation exists (sealed/precommitted donation amounts) that does not require abandoning the transferable-pool structure; its compatibility with real Bitcoin transaction semantics is a Track B question outside this seat's scope.

**Disposition:** partially triggered; real but bounded, and separately addressable without a full mechanism redesign.

---

### FC6. "Mitigation depends on unverifiable identity while claiming permissionless operation."

**Evidence class: mathematically proven.**

`05_sybil_split_concave` and `26_sybil_split_capped_pro_rata` demonstrate that concave weighting and per-identity caps — the only two allocation rules tested that meaningfully reduce whale concentration for honest single identities — are severely exploitable by free, unlinkable identity splitting (share gains of +40.6 and +70.5 percentage points respectively). Bitcoin-only Beneficial Genesis v1 has no identity or Sybil-resistance layer, by explicit design (`THREAT_MODEL_AND_NONCLAIMS.md` residual risk item 7). Linear pro-rata (`06_sybil_split_control_pro_rata`) is the only scheme tested that is *not* exploitable this way, and it does nothing to prevent whale concentration by size alone (`03_whale_99`). This condition is not merely a residual risk sensitive to assumptions — it follows deductively from the mathematical properties of concave and capped weighting under free identity creation, which the design pack itself concedes it does not have.

**Disposition:** triggered, with no defensible mitigation for concave/capped schemes absent an identity layer that would contradict the stated permissionless design. Linear pro-rata avoids this specific trap at the cost of not addressing whale concentration at all.

---

### FC7. "The social benefit is dominated by a simpler non-token mechanism."

**Evidence class: conditional simulation result, scoped to the specified functions (narrowed, E-004/E-006).**

For the charity-receipt and migration-claim-binding functions the design pack specifies, `MECHANISM_NECESSITY.md` §5 shows a non-transferable recognition receipt (or plain direct donation) preserves those functions while eliminating the migration-pathway monetization surface (FC4) and the post-genesis governance re-concentration surface (FC3's durability problem), at the cost only of investor liquidity. For a fuller new-ledger product whose payment/staking/fee/bootstrap functions are unspecified (§3a), this comparison is **incomplete** — a simpler mechanism cannot be shown to dominate functions that have not been defined.

**Disposition:** partially triggered for the specified functions; open for the unspecified ones. Depends on the program's product-scope decision, not a fixed property of the mechanism.

---

## Aggregate mechanism disposition (repaired)

```text
UNDERLYING_MECHANISM: CONTINUE_WITH_CONDITIONS
ECONOMIC_GATE_PASS: false
```

The charity-bound migration-receipt concept is **not shown to be economically incoherent**. The transferable fixed-pool token *as currently underspecified* should not be defended by default and should not be treated as economically gate-passed. Two of seven conditions (FC4's pathway component, FC6) are mathematically/structurally proven residual risks requiring redesign or policy gates regardless of further modelling; the remaining five are conditional on integration choices, product-scope decisions, or assumptions this seat cannot close alone.

### Conditions for continuation

1. Specify target ledger functions (§3a) before defending or ruling out transferability (FC1, FC7).
2. Prefer a non-transferable or delayed-transfer claim if the specified functions do not require float (FC1, FC4, FC7).
3. Do not default governance weight to proportional/token-weighted; if governance is linked to allocation at all, use a continuously-enforced cap or nontransferable rule, and verify durability past genesis (FC3).
4. Do not present concave or per-identity-capped allocation as a whale-concentration fix without an identity/Sybil-resistance layer; linear pro-rata avoids the Sybil trap but does not solve concentration (FC6).
5. Treat stolen/tainted-fund migration and charity rebate/circularity as residual social/legal/AML surfaces requiring policy-level mitigation (KYC-adjacent charity vetting, legal review, monitoring) — cryptography alone does not solve either (FC2, FC4).
6. Consider sealed/precommitted donation windows to remove denominator-timing advantages for informed late actors (FC5).
7. Keep legal/regulatory classification of the fixed-pool floating implied allocation ratio out of this seat's conclusions; route it to Track F (FC7, E-006).

**Not** `ECONOMIC_GATE_PASS`. Not a legal conclusion. Not live-funds authorization. Not an R-round assignment.

## Preserved findings (E-008 / BGEN-ECON-REV-007)

The following findings, independently re-derived by the second-family (Grok) reconstruction, are unchanged by this repair and remain the load-bearing evidence base:

1. Linear pro-rata is approximately split-mass invariant (aside from integer-floor residuals) but preserves contribution-proportional concentration.
2. Concave and per-identity-capped allocation rules are Sybil-sensitive without an identity layer.
3. A fixed pool creates denominator uncertainty and extreme undersubscription/oversubscription outcomes (issuing the entire pool to a trivial donation, or diluting a large donation to a rounding error).
4. Conditional rebate incidence reduces charity retention exactly one-for-one, given an arrangement exists at zero additional cost.
5. Cryptographic control does not establish legal ownership — the migration pathway for stolen/tainted funds is real regardless of profitability assumptions.
6. Transferability adds resale and post-genesis re-concentration surfaces beyond what a non-transferable claim would carry.

See `CROSS_MODEL_COMPARISON.md` for the side-by-side numeric comparison against the independent Grok model.
