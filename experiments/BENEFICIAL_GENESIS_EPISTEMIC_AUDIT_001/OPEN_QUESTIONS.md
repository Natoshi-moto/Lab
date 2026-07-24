# Open questions

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca`

## Empirical (no synthetic model can close these)

1. **Participation elasticity (decisive; audit-original AUD-MODEL-03).**
   Does a transferable allocation reward increase charitable donation volume
   relative to a no-token or non-transferable baseline — and what fraction
   of induced flow is mercenary, tainted, or rebate-seeking? Every
   necessity/dominance comparison in the record silently holds volume
   constant. See DECISIVE_NEXT_EXPERIMENT.md.
2. What fraction of realistic donors could access a colluding destination
   under a specific, concrete Track D curation design?
3. Real alternative-realization values and seizure risks for tainted BTC in
   donation-sized denominations.
4. Real secondary-market re-concentration dynamics for small-cap genesis
   allocations (buy-up speed, floor prices, lockup-expiry cliffs).

## Design/program decisions (policy, not evidence)

5. Which target ledger functions (payment, staking, fees, bootstrap) is the
   allocation unit supposed to serve? FC1/FC7 cannot close without this.
6. Transferable vs non-transferable vs delayed-conversion claim — a choice,
   informed by (1) and (5).
7. Whether any governance rights attach to allocation at all, and if so,
   under which durable enforcement (Track E).
8. Minimum-subscription floor or flow-scaled pool vs the current
   full-issuance-regardless rule (C-07).
9. Sealed/precommitted donation windows vs open observation (Track B
   feasibility on real Bitcoin unknown).

## Legal — scoped for qualified counsel (no conclusions here)

10. Classification of a fixed-pool, floating-implied-ratio allocation
    received in exchange for charitable donation, per relevant securities /
    collective-investment frameworks in target jurisdictions.
11. Charitable-donation tax treatment where the donor receives a
    potentially valuable allocation in return; effect on deductibility and
    on the charity's receipting obligations.
12. AML/sanctions exposure of charities accepting pseudonymous BTC where
    the protocol provably cannot distinguish stolen/sanctioned sources
    (C-11), and of any party operating claim infrastructure.
13. Financial-promotion rules for any public description of the mechanism.
14. Charity-law constraints on participating in a scheme that confers
    private benefit (the allocation) contingent on donations.
15. Liability allocation for the immutable charity set (who is responsible
    when an included charity turns out complicit or compromised).

## Process questions for the lab

16. Should controlling adjudications be subject to the same
    receipt/seat/freeze discipline as other seats? (This audit: yes —
    AUD-PROC finding.)
17. Should provider identity for "different-family" claims be evidenced
    (distinct accounts, signed commits, session artifacts) rather than
    asserted in branch names and receipt strings?
18. Should receipts record environment prerequisites (`npm ci`) so a fresh
    clone reproduces command results without diagnosis?
