# R014 build packet

## Exact dependency

- R013 proposal head: `33da36ae22457986c69d3aacdcdecd1a71335793`
- R012 proposal head: `f28dc07bf1433bb22e4d992a7f523503387ea445`
- authority: `PROPOSE_ONLY`
- canonical status: none

## Implementation

- Python durable writer/recovery: `system/nexus_lab/durable_value.py`
- independent journal verifier:
  `experiments/R014_PCX_DURABLE_SETTLEMENT/independent_journal_verifier.mjs`
- deterministic evidence builder: `experiments/R014_PCX_DURABLE_SETTLEMENT/build_demo.py`
- adversarial tests: `tests/test_r014_durable_settlement.py`
- hash-bound record/anchor schemas plus referenced R013 receipt/checkpoint
  schemas: `constitution/schemas/pcx-*.schema.json`
- operator commands: `pcx-durable-commit`, `pcx-durable-check`

## Demonstration

`operations/receipts/R014_PCX_DURABLE_SETTLEMENT` contains an exact four-record
demo ledger, local recovery report, independent replay report, external-head
anchor specimen and claim-bounded demo report.

## Verify

```bash
python3 -m unittest -v
python3 -m experiments.R014_PCX_DURABLE_SETTLEMENT.build_demo --check
./nexus verify
```

No command creates real value, generates a key, edits a balance, promotes a
checkpoint or merges a proposal.
