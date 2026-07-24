# Model adequacy — are the models adequate for the conclusions drawn?

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca` · **Authority:** none

Assessed models: the Claude economics simulator (repaired,
`ECON_REDTEAM_001/model/**`), the Grok breaker simulator
(`ECON_BREAKER_001/model/**`), and the design-pack allocation reference.

## 1. Variable structure

**Endogenous (computed):** allocation units, shares, Gini/HHI/top-N,
governance weights, conditional/expected rebate flows, net migration profit,
unissued remainder.

**Exogenous (assumed):** donor populations (seeded synthetic), donation
amounts, rebate rates, access/enforcement/detection probabilities, token
value multipliers, alternative-realization fractions, seizure probabilities,
haircuts, lock-up discounts (7%/month cap 70%), governance rule choice,
cap levels, epoch timing events.

**Assumed but unmeasured probabilities:** every probability in the rebate
and laundering models. None has an empirical anchor; post-repair labelling
says so explicitly, which is the correct posture. The lock-up discount
schedule is likewise invented.

**Objective functions / welfare definitions:** donor utility = token value
received − net donation cost; "charity net retained" = donated sats − rebates.
There is **no social welfare function**: charity retention is used as the
de facto benefit proxy. Whether retained sats convert to social benefit
(charity effectiveness), and whether donations are additional or displaced,
is outside every model.

## 2. Omitted actors, markets, and feedback loops

1. **Secondary market** — asserted (re-concentration via buy-up, price
   discovery) but never simulated. Both packages disclose this. All
   transferability-risk conclusions are structural arguments, not model
   results.
2. **Participation elasticity (audit finding AUD-MODEL-03)** — no model
   makes donation volume respond to the mechanism's incentives. Scenario 21
   ("no_token_baseline") compares mechanisms at *fixed* donation volume,
   which assumes away the design's entire purpose (inducing donations) and
   equally assumes away its critics' key worry (that induced flow is
   mercenary/tainted). FC7's "simpler mechanism dominates" disposition and
   the necessity analysis both inherit this gap. Neither package nor any
   reviewer flagged it. This is the single largest adequacy gap.
3. **Charity-set formation (Track D interaction)** — rebate access
   probability is *the* control variable for FC2, and it is a function of
   how the genesis charity set is curated; no model links them.
4. **Miners/exchanges as strategic actors** — present as scenario labels
   (omnibus claim, final-block surge) but with no strategic behavior model.
5. **Joint adversaries** — combinations (whale + Sybil + rebate + timing)
   are disclosed as unsimulated.

## 3. Structural pathway vs predicted incidence

Post-repair, the packages maintain this distinction well: stolen-fund
*pathway* (proven, executable) vs *incidence* (assumption-conditional);
rebate *arithmetic* (identity) vs *incidence* (friction model). The original
submission collapsed these (retracted claims C-10/C-12 in the ledger); the
current record does not. The remaining soft spot is rhetorical: sensitivity
grids invite the reader to treat swept ranges as covering reality, and no
document states the sharpest reading of the laundering grid — **the more
valuable the new ledger's unit, the more profitable tainted-fund migration
becomes**; success of the project is itself the risk multiplier.

## 4. Accounting basis vs economic opportunity cost

The repaired tainted-fund model separates legal cost basis from
opportunity value explicitly — this was the substance of REV-001 and is now
handled correctly. External evidence (documented laundering discounts, e.g.
stolen-coin sales below market) supports the *direction* of the
opportunity-cost parameters without calibrating them.

## 5. Sensitivity and sign-reversal search

- Laundering: the packages' own grid contains both signs (audit-reproduced
  exactly). Sign flips occur inside plausible ranges → only direction-level
  conclusions are warranted, and only direction-level conclusions are drawn
  post-repair.
- Rebate: expected incidence scales multiplicatively with access ×
  enforcement; any access ≪ 1 collapses it, access → 1 restores the
  conditional figure. The conclusion "not predictably destructive" is
  parameter-dependent in exactly the way the repaired text says.
- Concentration: no parameter region reverses C-04/C-05/C-06/C-07; these
  are deductive.
- Governance: rule choice flips the capture conclusion by construction;
  correctly reported as conditional.
- **Audit sign-search result:** no case was found where a package presents
  a sign-stable claim that actually reverses within its own swept ranges.
  The overclaim risk sits in *unswept* dimensions (participation elasticity,
  charity-set curation, secondary market), not in the swept ones.

## 6. Direction / magnitude / threshold / possibility / inevitability

| Conclusion family | What the models can legitimately deliver |
|---|---|
| Supply conservation | Inevitability (theorem) |
| Split invariance / Sybil exploitability | Inevitability (theorem); magnitudes scenario-bound |
| Whale concentration under pro-rata | Inevitability given contribution shares |
| Fixed-pool full issuance | Inevitability of the specified rule |
| Rebate arithmetic | Inevitability conditional on arrangement |
| Rebate incidence | Possibility + direction only |
| Laundering profitability | Possibility + direction only; threshold surfaces exist but are assumption-relative |
| Governance capture | Conditional inevitability per rule |
| Timing dilution | Direction; magnitude scenario-bound |
| Mechanism necessity / dominance | **Not deliverable by these models** — requires specified ledger functions and participation-elasticity evidence |

## 7. Adequacy verdicts per model

- **Design-pack allocation reference:** adequate for its claims (which are
  narrow and executable). No adequacy gap found.
- **Claude economics simulator (repaired):** adequate for the *labelled*
  conditional/deductive claims it now makes; not adequate — and post-repair
  does not claim to be — for behavioral prediction, welfare comparison
  across mechanisms, or necessity resolution. Two minor semantic defects
  found by this audit (AUD-SEM-01 grid semantics; AUD-SEM-02 domain
  divergence), neither affecting a load-bearing conclusion.
- **Grok breaker simulator:** same adequacy class; float arithmetic is a
  disclosed representation choice; small hand-fixtures trade aggregate
  realism for hand-verifiability, appropriate for a checking seat.

**Overall:** after repair, the record's stated conclusions are within the
models' adequacy envelope, with one exception: FC7's "partially triggered"
dominance disposition presents as a model result what is actually
underdetermined without participation-elasticity evidence (ledger C-16).
