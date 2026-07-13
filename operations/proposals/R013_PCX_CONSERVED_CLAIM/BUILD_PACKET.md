# R013 build packet

## Objective

Demonstrate a fixed-supply, signed, creating-transaction-bound synthetic
quantity transition with byte-identical results from two separate
implementations.

## Exact dependency

R013 is a stacked proposal based on unpromoted R012 head:

```text
f28dc07bf1433bb22e4d992a7f523503387ea445
```

It must target the R012 proposal branch and must not merge into `main` without
the user's separate promotion decision.

## Implementations

- primary state machine: `system/nexus_lab/value_kernel.py`
- independent verifier: `experiments/R013_PCX_CONSERVED_CLAIM/independent_verifier.mjs`
- independent native-crypto vector generator:
  `experiments/R013_PCX_CONSERVED_CLAIM/generate_vectors.mjs`
- exhaustive bounded model:
  `experiments/R013_PCX_CONSERVED_CLAIM/exhaustive_model.py`
- frozen suite and expected report: `fixtures/`
- operator commands: `pcx-value-check`, `pcx-convergence-check`
- repository integration: `./nexus verify`

## Reproduce

```bash
npm ci --ignore-scripts
python3 -m unittest -v tests.test_r013_pcx_convergence tests.test_r013_small_model
./nexus pcx-value-check experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json
./nexus pcx-convergence-check experiments/R013_PCX_CONSERVED_CLAIM/fixtures/SUITE.json
./nexus doctor
./nexus verify
```

The verifier never signs and no operator command accepts a private key.

## Expected frozen evidence

- genesis ID: `974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de`
- suite SHA-256: `a6ab4fde497b64395767edd1c8e652994e1bfeff0ca258fc661913918329c27b`
- converged report SHA-256: `77c97a72d6845341785ae8cf33dde8cfb319b12c9f083bf83ce654466f76fbd1`
- independent verifier SHA-256: `fd547ec4e5aa4961ec8b238ad1cd3688bd02d47273a56a4d3cb5cabe1163c52c`
- bounded-model report SHA-256: `44f344d671e30f76ef4643a08b4b8045ad2b967fc606bfca8ef858db78554326`
- histories: `6`
- new accepted transfers: `19`
- rejected attack candidates: `49`
- fixed supply after every accepted prefix: `1000`
- maximum demonstrated live outputs: `64`
- bounded model: `5,881` states and `115,266` conserved transitions through
  depth `4`

## Stop condition

Any test, generator drift, dependency failure, implementation disagreement or
authority escalation leaves R013 unpromoted. Do not weaken a kill criterion or
rewrite expected vectors to make the branch pass.
