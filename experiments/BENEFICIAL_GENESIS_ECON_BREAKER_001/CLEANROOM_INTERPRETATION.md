# Clean-room interpretation — BENEFICIAL_GENESIS_ECON_BREAKER_001

**Status authority:** NONE  
**Phase:** clean-room (pre-freeze)  
**Subject commit:** `b5887791338b146daad8f5233ce0e25bf24fe357`  
**Subject PR:** #35 (`claude/bgen-econ-redteam-001`)  
**Seat:** fresh xAI Grok different-family economics Breaker  
**Branch:** `grok/bgen-econ-breaker-001`  
**GitHub issue:** #36  

## Sources used before freeze

Inspected (contents opened):

- GitHub issue #36 (task charter)
- GitHub issue #34 (BGEN-ECON-REDTEAM-001 requirements and failure conditions)
- GitHub issue #33 (program tracks A–F; economic gate ordering)
- Controlling adjudication review on PR #35 (items `BGEN-ECON-REV-001` … `BGEN-ECON-REV-007` and gate disposition text only)
- PR #35 metadata: title, base/head refs, subject commit OID, draft state (not changed-file contents)
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/README.md`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/TECHNICAL_DESIGN.md`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/THREAT_MODEL_AND_NONCLAIMS.md`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/protocol/allocation.py` (normative design allocation rule)
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/schemas/protocol_constants.json`
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/fixtures/EXPECTED.json` (allocation invariant / residual catalog)
- `experiments/BENEFICIAL_GENESIS_DESIGN_001/fixtures/genesis/CONTEXT.json` (pool size)
- Prior breaker house-style samples: `experiments/BENEFICIAL_GENESIS_RETEST_002/results/CLEANROOM_FREEZE.json`, `CLEANROOM_INTERPRETATION.md`, `operations/receipts/BENEFICIAL_GENESIS_DIFF_RETEST_002/RECEIPT.json` (format only)

**Not content-opened before freeze** (byte-hash inventoried only):

- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`
- `operations/audits/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`
- `operations/receipts/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`

## Mechanism reconstruction (from design + issues)

Beneficial Genesis v1 (Bitcoin-only, synthetic) is an **initial allocation / migration admission** mechanism:

1. Donor shows cryptographic control of a source asset and pays exact genesis charity script bytes in one source-chain structure, binding a PQ destination claim.
2. After epoch close, a **fixed integer pool** is allocated:

```text
allocation_i = floor(pool * eligible_sats_i / total_eligible_sats)
remainder_unissued = pool - sum(allocation_i)   # never issued
```

3. There is **no** fixed BTC↔token redemption rate. Eligible sats are weights only.
4. Residual risks explicitly out of protocol: charity rebate/collusion, stolen keys ≠ legal ownership, whale/Sybil concentration, real Bitcoin consensus, real PQ crypto.

Default design pool in fixtures: `fixed_bitcoin_genesis_pool = 1_000_000_000`.

## Independent economic model (this seat)

| Module | Role |
|--------|------|
| `model/allocation.py` | pro-rata, capped, concave sqrt/log, time-weighted, lottery w/o replacement, no-token; fail-closed duplicate IDs |
| `model/metrics.py` | Gini, HHI, top-n with **both** `share_of_pool` and `share_of_issued` |
| `model/laundering.py` | Separates `legal_cost_basis`, `source_asset_opportunity_value`, `gross_token_output`, `net_laundering_profit` |
| `model/rebate.py` | Conditional incidence vs expected outcome under access/enforcement/detection frictions |
| `model/governance.py` | none / equal / proportional / token-weighted / continuously capped (**renormalized**) / delegated |
| `model/scenario.py` | Composes scenarios; FC flags are conditional, not automatic legal or gate verdicts |

## Responses to controlling review items (independent)

### BGEN-ECON-REV-001 — stolen-asset opportunity cost

Independent model **does not** set attacker economic cost to zero.  
`legal_cost_basis` may be 0 while `source_asset_opportunity_value > 0`. Net profit is:

```text
net = PV(risk-adjusted token liquidation)
    - source_asset_opportunity_value
    - transaction_risk_cost
```

Pathway existence (crypto control admitted) is reported separately from profitable laundering.

### BGEN-ECON-REV-002 — rebate is conditional arithmetic

Rate sweeps prove one-for-one incidence **conditional on collusion**.  
Expected damage requires `access_probability`, arrangement cost, enforcement, detection.  
Immutable genesis set ⇒ creating/admitting a colluding charity is not a free donor action.  
This seat does **not** claim rational donors “predictably destroy” aggregate charity benefit without those assumptions.

### BGEN-ECON-REV-003 — governance capture is integration-conditional

FC-3 is flagged only when scenario sets `governance_rule_under_test` to a proportional/token-weighted rule **and** a single actor exceeds the threshold.  
Allocation mechanism alone is compared under `none`, equal nontransferable, capped, etc.

### BGEN-ECON-REV-004 — ledger functions before necessity

See `MECHANISM_NECESSITY.md`. Necessity of transferability is not decidable from charitable-receipt functions alone; payment, staking/security, fee, capital allocation, ownership distribution, and bootstrapping must be stated. This seat treats ledger function as **unspecified** in the design pack and therefore keeps token-necessity **open** (failure-condition surface, not automatic reject solely on that axis without redesign scope).

### BGEN-ECON-REV-005 — metric / implementation semantics

- Dual denominators on every concentration report.  
- Duplicate donor IDs fail closed.  
- Lottery is **without replacement**.  
- Capped governance **renormalizes**.  
- Key Sybil/pro-rata claims have dual pure-math checks in tests.

### BGEN-ECON-REV-006 — neutral wording

Uses **fixed-pool floating implied exchange ratio** (`T/pool` eligible-sats weight per unit face). No sale / investment-contract legal characterization.

### BGEN-ECON-REV-007 — preserved narrower findings

Independently re-derived (see tests + scenarios):

1. Linear pro-rata is split-mass invariant (floor residuals aside) and preserves contribution concentration.  
2. Per-identity caps and concave weights are Sybil-exploitable without an identity layer.  
3. Fixed pool yields denominator uncertainty; undersubscription can mint nearly the whole pool to tiny eligible mass.  
4. Conditional rebates reduce charity retention one-for-one.  
5. Cryptographic control ≠ legal ownership.  
6. Transferability (if issued as transferable units) adds resale / post-genesis re-concentration surfaces (qualitative; secondary-market dynamics not fully simulated).

## Non-claims

No merge authority, no `STATUS.json` change, no R-round, no live funds, no legal conclusions, no market-price prediction, no claim that clean-room hash inventory equals content review of PR #35 (that is post-freeze only).
