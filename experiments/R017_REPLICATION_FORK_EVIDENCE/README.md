# R017 — Replication and explicit fork evidence

## Purpose

R017 is a bounded proposal layered over the canonically promoted R016 custody kernel. It asks whether independent hosts can exchange exact authenticated checkpoint statements and preserve objective evidence when their observed histories disagree.

It deliberately does **not** choose a branch, declare finality, or call the result consensus.

## Implemented slice

`system/nexus_lab/replication_evidence.py` provides:

- exact canonical ASCII JSON checkpoint statements;
- domain-separated checkpoint identifiers;
- a caller-supplied authentication verifier, keeping transport identity separate from protocol evidence;
- fixed genesis binding;
- bounded replica and observation counts;
- classifications for genesis, duplicate, known-prefix extension, missing-parent gap, invalid parent height, sibling fork, and same-replica equivocation;
- order-independent fork proof identifiers containing both exact checkpoint byte hashes;
- append-only observation identifiers;
- no winner, canonical-branch, score, weight, quorum, or finality field.

## Threats exercised by focused tests

- duplicate delivery;
- delayed or reordered delivery;
- missing predecessor delivery;
- two replicas extending one parent differently;
- one replica signing two checkpoints at the same height;
- checkpoint-id corruption;
- signature corruption;
- noncanonical wire encoding;
- wrong-genesis import;
- malformed height-zero statements;
- accidental fork-choice introduction.

## Security boundary

Authentication is supplied as a verifier callback. The test verifier is deterministic synthetic evidence and is not an operational signature system. A later R017 increment must bind this interface to pinned public keys using the repository's reviewed Ed25519/OpenSSL profile and add exact cross-implementation vectors.

A checkpoint is an observation statement, not authority. A fork proof demonstrates incompatible signed statements under one genesis; it does not identify the honest party, reverse a transfer, prevent double spending, ensure availability, or resolve the fork.

## Nonclaims

This experiment does not establish:

- network consensus or fork choice;
- global double-spend prevention;
- global finality;
- Byzantine fault tolerance;
- Sybil resistance;
- economic security;
- availability or liveness;
- secure networking or peer discovery;
- operational identity-key security;
- money, backing, redemption, liquidity, or stable value;
- production readiness or authorization for live funds.

## Focused verification

```bash
python3 -m unittest tests.test_r017_replication_evidence -v
```

## Proposed next increment

Bind authenticated checkpoints to pinned Ed25519 replica identities, export exact R016 durable-store anchors, construct deterministic multi-process fixtures, and test omission, duplication, reordering, corruption, partition, healing, and competing sibling histories across independently reconstructed stores.
