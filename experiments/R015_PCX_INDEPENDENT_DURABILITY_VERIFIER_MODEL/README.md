# R015 independent durability verifier and model

R015 narrows two explicit R014 assurance gaps without changing R014: it checks
a closed durable transcript in a separately built Node/Noble implementation, and it
exhausts a finite abstract commit/crash/acknowledgement/retry state space.

## Reproduce

```bash
node experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/independent_transcript_verifier.mjs \
  experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/CLOSED_TRANSCRIPT.json \
  experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/EXTERNAL_ANCHOR.json

node experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/independent_transcript_verifier.mjs \
  experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/CLOSED_TRANSCRIPT.json

python3 experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/crash_lifecycle_model.py
python3 experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/crash_lifecycle_model.py --self-test
python3 experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/verify_evidence.py
python3 -m unittest -v tests.test_r015_independent_durability_verifier tests.test_r015_crash_lifecycle_model
```

The anchor file is a separate input but a repository fixture, not proof of a
real independent storage domain. A pass is synthetic bounded evidence only;
it is not money, a safe store of value, custody, consensus, physical durability,
external audit, or production security.
