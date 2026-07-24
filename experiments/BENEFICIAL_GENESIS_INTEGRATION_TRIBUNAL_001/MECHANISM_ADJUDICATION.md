# Mechanism adjudication — BGEN-INTEGRATION-TRIBUNAL-001

Subject: `8349de7a5978be6a9984aa33fd59ba3725ebaaca`. Adjudicates PR #44
(Codex mechanism) and PR #45 (Grok mechanism) against each other, PR #40,
and the frozen subject.

## 1–4. The four category verdicts

| Category | PR #44 | PR #45 | Tribunal adjudication |
|---|---|---|---|
| UNDERLYING_MECHANISM | CONTINUE_WITH_CONDITIONS | CONTINUE_WITH_CONDITIONS | **Concur.** No executable counterexample to the arithmetic core exists anywhere in the record (tribunal reconfirmed conservation, T-011); every alleged unconditional economic failure reduced to a conditional or policy question. Continuation is justified by cheap, decisive, falsifying next steps — not by affirmative evidence the mechanism works (PR #40's framing, which the tribunal adopts). |
| TRANSFERABILITY_NECESSITY | NOT_DEMONSTRATED | NOT_DEMONSTRATED | **Concur** (TRIB-F-011). Confirmed at specification level: nothing in the design pack's claim/verifier objects requires alienable units. |
| EVIDENCE_STATE | UNDERDETERMINED | SUFFICIENT_FOR_BOUNDED_DECISION | **Compatible, not contradictory** (TRIB-F-013, below). |
| REAL_WORLD_READINESS | RESEARCH_ONLY | RESEARCH_ONLY | **Concur**, forced and independently supported. |

### The EVIDENCE_STATE adjudication (TRIB-F-013)

The two verdicts answer different questions:

- PR #44's UNDERDETERMINED is about **evidence for a final mechanism
  choice / welfare claim**. Its own text: counterevidence is "participation,
  displacement, access, taint, liquidity, charity efficacy, and governance
  behavior are unmeasured and produce sign reversals"; its falsifier is
  "credible empirical calibration…"; its next action is empirical data
  collection *after product scope is fixed*.
- PR #45's SUFFICIENT_FOR_BOUNDED_DECISION is about **the bounded research
  decision** — specify product functions, refuse a transferable default,
  continue under conditions. Its own stated assumption: "Bounded decision
  is research disposition not launch"; its counterevidence row concedes
  "Empirical alpha/v/participation open (not required for bounded research
  decision)".

Cross-reading: PR #44 itself takes the bounded decision (it continues, with
a specified next experiment) — so it treats the evidence as sufficient for
that. PR #45 itself declines every final-choice claim — so it treats the
evidence as underdetermined for that. **No proposition exists that one
audit affirms and the other denies.** Recorded resolution: evidence is
SUFFICIENT for the bounded decisions taken; UNDERDETERMINED for the final
mechanism choice. This feeds final verdicts 2, 3, and 4.

## Mandatory checks

### Ledger functions specified vs unspecified

Specified by the record (and implementable, per both audits, without
transfer): **receipt binding** (claim ↔ donation binding), **charitable
transfer binding** (funds must reach the charity destination),
**finite allocation** (fixed pool, floor pro-rata, unissued remainder),
**permissionless claim** (no allowlist). Unspecified and untested:
**payment, fees, staking, security bonding, store of value, bootstrap
ownership economics**; **recognition** is specified only loosely (a
non-transferable receipt trivially provides it); **governance** is
explicitly deferred as a POLICY_CHOICE. This unspecified set is exactly
where a transferability requirement could hide — hence specification is
the controlling next research act.

### Does any required product function need transferability?

For the four specified functions: no. Receipt binding and permissionless
claim are properties of the claim/verifier layer (tribunal reconfirmed at
the design-pack source level); charitable transfer binding is about the
Bitcoin-side destination, not the new ledger's units; finite allocation is
arithmetic. Both audits' regime comparisons (transferable / delayed /
non-transferable / no-token, product functions held constant) find the
non-transferable or delayed regimes serve F1–F4 while removing the float
that powers rebate capture, taint-title laundering value, collusion
profitability, and governance migration. PR #40 concurs ("non-transferable
variant weakly dominates under evidence in hand"). Confirmed:
TRANSFERABILITY_DEFAULT should be non-transferable-or-delayed **as a
default under uncertainty**, revisable by a specified function that only a
transferable design passes.

### Variables improperly held exogenous

Confirmed list (union of PR #40/#44/#45, tribunal-verified at source
level for the subject models): participation volume (TRIB-F-010, the
sign-controlling one), additional-vs-displaced giving, donor composition,
rebate access distribution, tainted-flow share, charity curation quality,
token value `v` (always an assumed grid, never a model), secondary-market
demand/liquidity. Every "profitable/unprofitable" result in the record is
conditional on assumed values of these.

### Participation elasticity — independently identified?

PR #40 identified it first (AUD-MODEL-03, audit-original). PR #44 and
PR #45 each list it as an unresolved sign-controlling empirical variable,
under declared permanent blindness to PR #40 (their source inventories
record no sibling-audit access). Artifact-level evidence therefore
supports independent rediscovery by both mechanism seats — with the
stated limit that all seats consumed operator task wording that is not in
the repository, so prompt-seeded convergence cannot be excluded
(TRIB-F-010).

### Pathway existence vs profitability vs incidence vs magnitude vs inevitability

The record establishes: **existence** of rebate/taint/collusion pathways
(structural, confirmed); **conditional profitability** (sign flips across
the assumed-parameter grids — PR #45's collusion grid is unprofitable at
v ∈ {0, 1/100} and profitable at v ∈ {1/10, 1}; tainted grid 26/60 rows);
**not** incidence, **not** magnitude, **not** inevitability, in either
direction. Any citation that upgrades a pathway result to a prediction
overclaims (TRIB-F-016).

### Identity-free anti-concentration

Adjudicated CONFIRMED (TRIB-F-012): linear pro-rata is split-invariant
(floors weakly penalize splitting); concave weighting strictly rewards
Sybil splitting; per-identity caps are evaded by splitting
(PR #45: whale 1×10⁸ alone → 9×10⁸ via Sybils); cap-then-renormalize is
not a hard cap and can renormalize a holder above the nominal cap (to
100% in the sole-holder limit). Consequence: with identity unspecified,
**linear pro-rata is the only scheme in the record that does not
actively reward splitting** — and it provides no concentration
protection. "Fairness" claims for concave/cap schemes require an
identity stance; none exists.

### Fixed-pool undersubscription and the sole-donor case

Tribunal-reproduced (T-013): one donor, 1 sat, pool 10⁹ → the donor
receives the entire pool, in both the REDTEAM model and the normative
design pack. Oversubscription (T-014): 1-sat donors floor to zero.
Structural consequence of fixed-pool + pure pro-rata; a POLICY_CHOICE
(minimum participation, reserve fraction, or flow-linked issuance) that
belongs in the specification (TRIB-F-014).

### Governance durability after transfer

Modeled results (PR #45): proportional weighting gives the top holder 4/5;
identity-capped weighting is Sybil-degraded from 1/2 to 9/10; coalition
splitting increases power. Under a transferable regime any
allocation-derived governance guarantee decays as holdings migrate —
no seat modeled post-transfer dynamics empirically, and none needed to:
both audits condition continuation on **not** attaching majority
governance to raw allocation (TRIB-F-015).

### Combined attacks

Only limited multi-variable grids exist (secret-rebate whale, whale+charity
collusion, tainted×retention×v). No seat searched the composed space
(e.g., Sybil-split + rebate access + cutoff timing). Recorded as a shared
search-dimension gap for the next mechanism round; not a blocker for the
bounded decisions.

### What synthetic analysis can and cannot settle

**Can settle:** arithmetic invariants; split-invariance and Sybil
countermodels; regime comparisons under held-constant functions; pathway
existence; internal consistency of claims. **Cannot settle:**
participation elasticity, flow composition, market value, liquidity,
charity-sector behavior, legal characterization, and every incidence or
welfare-sign question — these need preregistered empirical work and
qualified human expertise (both audits, PR #40, and this tribunal agree;
no dissent exists in the record).
