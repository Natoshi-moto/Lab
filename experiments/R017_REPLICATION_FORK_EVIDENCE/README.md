# R017 replication and explicit fork-evidence experiment

R017 extends the exact R016 synthetic custody genesis into three isolated
logical hosts. It tests deterministic exact-genesis replay, authenticated
checkpoint exchange, and preservation of two individually valid sibling
events as explicit conflict evidence.

Run:

```bash
python3 experiments/R017_REPLICATION_FORK_EVIDENCE/run_campaign.py \
  experiments/R017_REPLICATION_FORK_EVIDENCE/fixtures/COMPOUND_CAMPAIGN.json
python3 -m unittest -v tests.test_r017_replication
```

The experiment deliberately has no fork choice. Sorting children makes the
evidence bytes deterministic; it does not select a branch. This is bounded
synthetic evidence, not network consensus, global finality, Byzantine fault
tolerance, operational custody, money, economic security, or production
readiness.
