# R018 — fixed hybrid post-quantum admission experiment

## Result under test

This reversible proposal asks one narrow question:

> Can an exact R016-valid state transition be made conditional on a fixed,
> independently checked ML-DSA-65 authorization, with no classical-only
> fallback, while leaving every R016 rule in force?

The implemented decision is an **AND gate**:

```text
native ML-DSA-65 verifier PASS
AND cold Noble ML-DSA-65 verifier PASS
AND unchanged R016 transition gate PASS
= bounded experiment PASS
```

Neither PQ verifier can accept an R016 state transition. They emit only
`PQ_PRECHECK_PASS_R016_STILL_REQUIRED`. The Python R016 kernel remains the only
component in this experiment that evaluates the state transition.

## Fixed cage

- The exact policy commits its controller/epoch/public-key binding in
  `policy_id` `a17b46de0a98dd4462997350c7730006ba4eeb2024130de5cb6d0c0b76a4aa55`.
- `decision` is `ALL_OF_R016_AND_ML_DSA_65`.
- `fallback` is `NONE`.
- missing authorization and unknown policy both mean `REJECT`.
- every policy, event, authorization, key, and signature encoding is bounded,
  exact, canonical, and domain-separated.
- the production-shaped gate imports verification only. It has no signing,
  private-key, key-generation, policy-update, override, or promotion surface.
- changing a rule, binding, algorithm, event byte, or signature changes a
  committed identifier or fails validation; it cannot reuse the frozen passing
  report.

That is the precise meaning of the “cage” in this round: V0 changes are
detectable to a verifier pinned to the exact policy. It is not a claim that a
repository maintainer cannot publish different code or a new policy.

## Two verification paths

1. `system/nexus_lab/pq_admission.mjs` uses Node 24.14.0 native ML-DSA-65.
2. `independent_verifier.mjs` independently implements the envelope and policy
   rules and uses pinned `@noble/post-quantum` 0.6.1 for ML-DSA-65.

The Noble dependency has an experiment-local manifest and lockfile. The root
manifest and lock remain byte-identical to the frozen R015/R016 predecessor
evidence, so adding R018 cannot silently reinterpret those earlier proofs.

`interop_self_test.mjs` signs and verifies in both directions between those
implementations. This is implementation diversity, not proof that either
implementation or ML-DSA is defect-free.

ML-DSA is standardized by
[NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final), which describes it
as *believed* secure against adversaries with a large-scale quantum computer.
R018 deliberately preserves that epistemic wording. It does not claim
“unbreakable,” “quantum-proof,” or complete post-quantum security.

NIST's February 2026 planning note also lists several minor potential FIPS 204
corrections for a future revision. R018 therefore pins exact interoperable
implementations and vectors while treating standards revision as an explicit
future-policy event, never a silent reinterpretation of this policy ID.

## Run the proof

Requires exact Node `24.14.0`, Python 3.12, and the pinned lockfile.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm --prefix experiments/R018_PQ_HYBRID_ADMISSION ci --ignore-scripts --no-audit --no-fund
python3 experiments/R018_PQ_HYBRID_ADMISSION/verify_evidence.py
python3 experiments/R018_PQ_HYBRID_ADMISSION/run_hybrid_demo.py
python3 -m unittest tests.test_r018_pq_hybrid_admission -v
```

The demo intentionally compares two paths:

- naive baseline: unchanged R016 accepts the valid Ed25519-authorized event
  without any PQ envelope;
- R018 profile: the same event is rejected without the pinned ML-DSA-65
  authorization, and admitted to R016 only after both PQ verifiers agree.

The tamper matrix rejects missing PQ authorization, event-byte changes,
signature changes, cross-policy/controller/epoch replay, algorithm downgrade,
unknown override fields, key substitution with recomputed identifiers, and a
self-consistent attempt to change the fixed policy fallback.

## Exact evidence

- `operations/receipts/R018_PQ_HYBRID_ADMISSION/PQ_ADMISSION_REPORT.json`
- `operations/receipts/R018_PQ_HYBRID_ADMISSION/ML_DSA_INTEROP_REPORT.json`
- `operations/receipts/R018_PQ_HYBRID_ADMISSION/DEMO_REPORT.json`
- `operations/receipts/R018_PQ_HYBRID_ADMISSION/EVIDENCE_GATE_REPORT.json`

The recorded hashes are reproducibility identifiers computed by this code.
They are not external attestations and must not be described as independent
proof merely because they are hashes.

## Boundary

This proposal does **not** implement authenticated PQ-key enrollment, PQ-key
rotation or recovery, hardware custody, secure entropy, a wallet, network
consensus, fork choice, global finality, economic security, stable value,
production deployment, or live-fund authorization. The public deterministic
fixture key is intentionally non-secret test material.

It also does not make the R018 wrapper mandatory. A caller can still invoke the
legacy R016 API directly—the naive baseline deliberately proves that fact.
Only a later consensus/deployment profile could require every accepted
transition to traverse R018, and that mechanism does not exist here.

R018 is `PROPOSE_ONLY`, stacked over draft R017 head
`b8dca0e9be40dedd4f1ba6930ad34caec0167076`, with canonical R016 preserved at
main commit `6ad3b470d190eafdde97143c7df0c8334a754764`. It carries
`status_authority: NONE` and changes no accepted state.
