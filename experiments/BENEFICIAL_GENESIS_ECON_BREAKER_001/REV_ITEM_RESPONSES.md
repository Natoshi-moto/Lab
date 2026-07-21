# Independent responses to BGEN-ECON-REV-001 … 007

Pre-freeze reconstruction. Post-freeze differential notes live in `results/DIFFERENTIAL_REVIEW.md`.

## REV-001 — stolen-asset opportunity cost

**Repair implemented in this model:** `model/laundering.py` separates:

- `legal_cost_basis_sats`
- `source_asset_opportunity_value`
- `gross_token_output`
- `risk_adjusted_token_value`
- `net_laundering_profit`

Scenarios `10`, `15`–`17`, `27` exercise grids and lockups.  
**Conclusion:** pathway exists; zero-cost profitable laundering is **not** proven by legal basis zero.

## REV-002 — rebate conditional arithmetic

**Repair:** `model/rebate.py` labels conditional vs expected-with-frictions; claims block refuses unconditional “predictably destroys.”  
Scenarios `07`, `08`, `18`, `28`.

## REV-003 — governance conditional

**Repair:** multi-rule `governance_weights`; FC-3 only if `governance_rule_under_test` is proportional/token-weighted.  
Scenarios `13`, `14`.

## REV-004 — ledger functions

**Repair:** `MECHANISM_NECESSITY.md` states function list and refuses necessity closure without it.

## REV-005 — metrics / implementation

**Repair:** dual shares; duplicate ID fail-closed; lottery without replacement; capped gov renormalized; dual math tests for Sybil/pro-rata.

## REV-006 — wording

**Repair:** `fixed_pool_floating_implied_exchange_ratio_sats_per_unit`; no investment-contract language.

## REV-007 — preserve accepted findings

All six narrower findings re-derived in tests/scenarios (see `FAILURE_CONDITIONS.md` and unit tests).
