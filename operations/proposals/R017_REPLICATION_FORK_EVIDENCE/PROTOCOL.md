# R017 replication-evidence protocol

## State carried between hosts

Each replica checkpoint commits to:

- one immutable genesis digest;
- replica identity;
- exact local height;
- R016 state root;
- R016 durable record head;
- R016 receipt head;
- the prior checkpoint identifier;
- `status_authority: NONE`.

The checkpoint identifier is a domain-separated SHA-256 digest of the exact unsigned canonical statement. Authentication is verified externally and must bind the replica identity to those exact bytes.

## Observation rules

A verifier preserves every accepted observation and classifies it without assigning authority:

1. Exact identifier already observed: `DUPLICATE`.
2. Height zero with empty predecessor heads: `GENESIS`.
3. Unknown parent: `GAP`.
4. Known parent at exactly height minus one: `EXTENDS_KNOWN_PREFIX`.
5. Two different children of one parent: `FORK_OBSERVED` plus deterministic fork proof.
6. Same replica and height with different statements: `EQUIVOCATION`, preserved before fail-closed error.
7. Different genesis: reject.
8. Invalid canonical encoding, identifier, schema, authority, bounds, or authentication: reject.

## Fork proof

A fork proof contains both checkpoint identifiers, both exact-wire SHA-256 digests, one reason code, the shared genesis digest, and a deterministic proof identifier. Checkpoints are sorted by identifier before hashing so arrival order cannot alter the proof.

## Prohibited semantics

The protocol contains no branch weight, stake, work, score, timestamp preference, longest-chain rule, quorum certificate, leader, validator set, rollback command, merge rule, winner, or canonical designation.

## Acceptance target for the full round

The full R017 round should demonstrate that independently reconstructed R016 stores can exchange pinned-key authenticated checkpoints and produce identical observations and fork proofs under bounded delivery schedules, while never silently reconciling incompatible histories.

## Nonclaims

This is evidence transport and disagreement detection only. It is not consensus, finality, replication availability, economic security, production networking, or a store-of-value guarantee.
