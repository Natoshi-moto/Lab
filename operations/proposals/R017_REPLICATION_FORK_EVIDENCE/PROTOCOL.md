# R017 replication and explicit fork-evidence protocol

## Purpose

R017 tests whether isolated logical hosts can replay the exact R016 synthetic
genesis and signed event bytes, authenticate checkpoints, and preserve sibling
histories as deterministic conflict evidence. It adds observation and exchange
semantics only; it adds no branch authority.

## Objects

- `COMPOUND_CAMPAIGN.json` binds the exact R016 genesis, one common event, two
  individually valid sibling events, three host keys, checkpoints, closed
  branch transcripts, and a deterministic delivery schedule.
- A checkpoint binds its host, Ed25519 public key, session, protocol domain,
  genesis digest, height, state root, and payload digest.
- Fork evidence binds the shared predecessor and both exact sibling event IDs
  and byte digests. Children are sorted by raw digest solely for encoding.
- The report binds all derived roots, checkpoint observations, conflict
  evidence, and the number of scheduled deliveries.

## Verification

The Python producer replays both siblings from exact genesis with the R016
kernel and verifies checkpoints with OpenSSL. The Node/Noble verifier verifies
the R017 checkpoint and evidence layers independently. Each closed branch is
also replayed through the existing independent R016 Node/Noble state machine.

## Conflict rule

When two valid children bind the same predecessor, both remain exact evidence.
The classification is `SIBLING_FORK_OBSERVED`, `branch_selection` is `NONE`, and
no field may identify a winner, preference, canonical branch, or final branch.

## Bounds

The evidence fixture has three logical hosts, one exact genesis, one common
event, two siblings, three checkpoints, and ten scheduled actions. Hosts are
logical processes in one test environment, not independent physical machines.
There is no live network, unbounded scheduler, or availability claim.
