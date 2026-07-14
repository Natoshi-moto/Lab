# R016 build packet

## Exact baseline

Build only from `8e23e76ea2808131f1683a50abccb48078afff35`.
The stale open PR #14 is excluded.

## Deliverables

- additive custody kernel, durable store, and standalone CLI;
- closed schemas for genesis, events, receipts, anchors, and transcript;
- deterministic public fixture generator;
- Python/OpenSSL and separate Node/Noble replay;
- crash/acknowledgement/concurrency store tests;
- bounded lifecycle/conflict model and deliberate mutants;
- exact-byte evidence gate and frozen non-authoritative reports;
- task, proposal, claim, threat, acceptance, status, and next-action records.

## Commands

```bash
npm ci --ignore-scripts --no-audit --no-fund
python3 experiments/R016_PCX_INTEGRATED_CUSTODY_GATE/verify_evidence.py
python3 -m unittest -v \
  tests.test_r016_custody_kernel \
  tests.test_r016_custody_store \
  tests.test_r016_custody_model \
  tests.test_r016_independent_verifier
./nexus doctor
python3 -m unittest discover -s tests -v
./nexus verify
```

## Stop conditions

Stop on baseline drift, any predecessor hash mismatch, missing dependency,
private material in an artifact, non-deterministic evidence, a surviving mutant,
or a kill-criterion breach. Record `UNABLE_TO_VERIFY` rather than weakening the
gate.
