# R013 PCX conserved-claim experiment

This directory contains a fixed-supply, local-only synthetic UTXO experiment.
It is intentionally incapable of creating a live token.

## Components

- `generate_vectors.mjs` creates the frozen suite using Node's native Ed25519
  implementation and public test-only seeds.
- `independent_verifier.mjs` separately parses and replays the suite using
  pinned Noble Ed25519; its source hash is pinned by the normative gate.
- `system/nexus_lab/value_kernel.py` is a separate Python state machine using
  OpenSSL Ed25519.
- `fixtures/SUITE.json` carries exact canonical object bytes as base64.
- `fixtures/EXPECTED_REPORT.json` is the byte-exact converged report.
- `exhaustive_model.py` enumerates the bounded supply-4 abstract state space
  through depth four.

## Run

```bash
npm ci --ignore-scripts
python3 -m unittest -v tests.test_r013_pcx_convergence tests.test_r013_small_model
./nexus pcx-convergence-check experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json
```

No verifier or operator command receives a private key. The generator's seeds
are deliberately public and unsafe for real value.

## Honest interpretation

The experiment can demonstrate conservation, signed control transfer, local
double-spend rejection and cross-implementation convergence for the frozen
histories. It cannot demonstrate money, economic value, safe custody, global
consensus, durable settlement, market demand or purchasing-power preservation.
