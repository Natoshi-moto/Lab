# R017 — Replica-independent history attestations and explicit fork evidence

## Purpose

R017 is a bounded proposal layered over the canonically promoted R016 custody kernel. It asks whether independent processes can authenticate exact local histories, distinguish multiple witnesses to one history from incompatible histories, and preserve objective fork evidence without selecting a branch.

It deliberately does **not** choose a branch, declare finality, or call the result consensus.

## Implemented

- replica-independent `history_id` values committing genesis, height, parent history, R016 state root, durable record head, and receipt head;
- replica-specific signed checkpoint attestations with separate `checkpoint_id` values;
- pinned replica ID to raw Ed25519 public-key registries;
- OpenSSL Ed25519 verification with no production signing or private-key storage path;
- exact validation and adaptation of complete R016 durable anchors;
- agreement, duplicate-attestation, gap, known-history extension, sibling fork, invalid-parent, and equivocation classification;
- deterministic arrival-order-independent fork proofs;
- a process-separated partition/healing demonstration using two real R016 SQLite stores.

## Process-separated demonstration

`run_partition_demo.py` performs the following deterministic sequence:

1. creates one exact R016 genesis using public test-vector derivations;
2. initializes two SQLite custody stores through separate `custody_cli` process invocations;
3. audits both height-zero stores and confirms they produce one shared history ID;
4. isolates the stores;
5. constructs two different valid Ed25519-signed spends of the same Alice genesis outpoint;
6. applies one spend to each isolated store through separate processes;
7. audits each store and produces pinned-key signed R017 attestations;
8. gives the attestations to two observers in opposite orders;
9. requires both observers to derive one byte-identical `CONFLICTING_SIBLING_HISTORIES` proof;
10. reopens both stores and confirms evidence exchange rewrote neither history.

The complete report is required to be identical across two independent full runs.

## Verification

```bash
python3 -m unittest \
  tests.test_r017_replication_evidence \
  tests.test_r017_replication_auth \
  tests.test_r017_partition_demo -v

python3 experiments/R017_REPLICATION_FORK_EVIDENCE/run_partition_demo.py
```

Nexus Audit run 83 passed on exact implementation head `d2e447a25a034e09e0045b000ac5304736b98fb7`. The proposal-task recording commit passed Nexus Audit run 84.

## Demonstrated boundary

The evidence demonstrates process-separated valid sibling histories and deterministic authenticated fork evidence. It also demonstrates that multiple replica attestations of one history are agreement rather than a fork.

## Nonclaims

This is not:

- network transport or peer discovery;
- consensus or fork choice;
- global double-spend prevention;
- finality;
- Byzantine fault tolerance;
- availability or liveness;
- Sybil resistance;
- operational key security;
- economic security;
- money or stable value;
- production readiness or authorization for live funds.

The fork is detected and preserved but not resolved.

## Next research boundary

The next round should compare explicit consensus/deployment options before selecting one. The primary alternatives are sovereign fixed-validator BFT, proof-of-stake, proof-of-work, externally anchored settlement, or using an existing base layer. The decision must be based on safety, liveness, state-sync, economic-security, and operational assumptions rather than implementation momentum.
