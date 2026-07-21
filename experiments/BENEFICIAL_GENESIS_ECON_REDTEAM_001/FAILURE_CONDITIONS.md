# Failure conditions disposition — BGEN-ECON-REDTEAM-001

Per issue #34, the task must recommend `REJECT_OR_REDESIGN` if **any** of the six listed failure conditions remains without a defensible mitigation. Each is evaluated below against the executable evidence in `results/*.json`. Negative findings are stated plainly, per the task's explicit instruction not to soften them.

---

### FC-1. "The transferable token has no necessary function beyond rewarding donation."

**Status: TRIGGERED — no defensible mitigation identified.**

`MECHANISM_NECESSITY.md` finds no modelled or documented function that requires *transferability* specifically, as opposed to a non-transferable or delayed-transfer claim right. The migration/coordination function needs only a cryptographically bound claim; the charitable function needs only the donation step. Transferability's only identified unique effect is donor liquidity / secondary-market price discovery, which is an investor convenience rather than a public benefit, coordination function, or security property in the program's own terms (issue #33). Its measured costs (laundering, post-genesis re-concentration, speculative flipping) are larger and better evidenced than its measured benefit.

---

### FC-2. "Rational donor behavior predictably destroys charity net benefit through rebates."

**Status: TRIGGERED — no defensible mitigation identified.**

`07_rebate_sweep` and `08_secret_rebate_whale` show the rebate-attack gain equals the rebate amount **exactly**, for every rebate rate tested (0% to 100%), and is strictly positive for any nonzero rate. `18_charity_set_single_vs_multi` shows a donor routing through a donor-controlled charity retains only 20% of nominal donated value for the charity (net retained 3,000,000 of 15,000,000 donated) while the cryptographic claim verifies identically to an honest donation (`claim_charity_rebate_collusion_crypto_ok` in the existing design pack's own fixture set already documents this as crypto-valid). Track D's genesis ceremony authenticates charity **identity**, not charity **behavior after receipt**, and no protocol-level, cryptographic, or statistical detection mechanism is specified. Since the attack is unconditionally profitable and requires no special capability beyond finding or creating one colluding charity destination among however many are in the genesis charity set, rational profit-seeking donor behavior is predicted — not merely possible — to erode aggregate charity benefit in proportion to how much of the donor base can access such a destination.

---

### FC-3. "One actor can obtain practical governance control by donation alone."

**Status: TRIGGERED for the design as currently specified; PARTIALLY MITIGABLE.**

`13_governance_proportional` shows a single **honest** whale (no attack) reaching 52.488% of governance weight — a simple majority — purely through the size of an honest donation, when governance weight is proportional to economic allocation (the default assumption absent an explicit design decision otherwise). `14_governance_capped` shows an independent 5%-of-pool governance cap holds that same whale to 9.768%, well under both the 1/2 and 1/3 thresholds. A mitigation therefore exists (decoupled, capped governance weight), but it is not present in the subject design pack as merged, and even if adopted, this study did not model whether a genesis-time cap remains enforced once tokens are transferable and lock-ups expire — a cap computed only once at genesis is a snapshot, not a durable guarantee, unless enforced continuously by the new ledger's own consensus rules (Track E, out of scope here). Absent that continuous-enforcement guarantee, we do not treat this as a defensible mitigation of the underlying risk, only of the risk *at the moment of allocation*.

---

### FC-4. "The mechanism materially incentivizes stolen/tainted-fund laundering into a new asset."

**Status: TRIGGERED — no defensible mitigation identified.**

`10_stolen_key_donation` and `11_quantum_cutoff_freeze` show an attacker donating stolen source-chain funds receives the **full gross token value** of their allocation (~10,000,000 and ~5,000,000 abstract units respectively in the modelled scenarios) at **zero** legitimate cost basis, because the verifier (by explicit, pre-existing design, documented in the subject's own `THREAT_MODEL_AND_NONCLAIMS.md` residual risk #2) validates cryptographic control of source funds, not legal ownership. Transferability is what converts this into a completed laundering event: the thief receives a liquid, saleable asset in exchange for stolen value, rather than (as under a non-transferable receipt or no-token design) nothing of resale value. `11_quantum_cutoff_freeze` additionally shows this risk concentrates in the specific, foreseeable window between a declared classical-key compromise and epoch close, where a rational attacker holding compromised keys has maximal urgency to donate before the window closes. Non-transferability windows (`ALTERNATIVES_COMPARISON.md` §4) reduce but do not eliminate this, since a thief has no legitimate opportunity cost for locked capital and can simply wait out a lock-up.

---

### FC-5. "Timing/cutoff games produce non-deterministic or privileged allocation."

**Status: PARTIALLY TRIGGERED — real but bounded; not on its own dispositive.**

`09_denominator_doubles_final_block` shows a concrete, non-trivial dilution effect (4.802% → 0.828% share, a 3.975-percentage-point swing) from a late-arriving donor surge in the final block. This is **not** a "privileged" allocation in the sense of an unfair marginal rate — exact pro-rata gives every marginal sat the same rate regardless of when it arrives — but it **is** a source of ex-ante non-determinism that specifically disadvantages early, uninformed donors relative to anyone with better visibility into the final denominator (a miner, an exchange, or anyone monitoring the mempool near close). We do not treat this alone as requiring `REJECT_OR_REDESIGN`, since a low-cost mitigation exists (sealed/precommitted donation amounts, `ALTERNATIVES_COMPARISON.md` §2) that does not require abandoning the transferable-pool structure. It is folded into the overall recommendation as a required condition rather than an independent rejection trigger.

---

### FC-6. "The social benefit is dominated by a simpler non-token mechanism."

**Status: TRIGGERED — supported, not merely plausible.**

`MECHANISM_NECESSITY.md` §5 shows a non-transferable recognition/reputation receipt (or, more simply, direct donation with no token at all) preserves the charitable and migration-coordination functions while **eliminating** the laundering incentive (FC-4, since a non-transferable receipt has no resale value) and **eliminating** post-genesis governance re-concentration via secondary markets (FC-3's durability problem), at the cost only of investor liquidity — which issue #33's own definition of success does not list as a required property. Where a simpler mechanism dominates on the majority of the enumerated attack surfaces and concedes only an investor convenience, the social benefit of the more complex, transferable design is dominated within the terms of this analysis.

---

## Aggregate disposition

Four of six failure conditions (FC-1, FC-2, FC-4, FC-6) are triggered without a defensible mitigation; a fifth (FC-3) is mitigable only with an out-of-scope continuous-enforcement guarantee this study cannot verify; the sixth (FC-5) is real but bounded and separately addressable. Per the task's own rule, this requires a recommendation of:

```text
REJECT_OR_REDESIGN
```

for the transferable fixed-pool token as currently specified. See `operations/audits/BENEFICIAL_GENESIS_ECON_REDTEAM_001/AUDIT_REPORT.md` for the full disposition and redesign directions, and `NONCLAIMS_AND_OPEN_QUESTIONS.md` for the limits of what this analysis can and cannot support.
