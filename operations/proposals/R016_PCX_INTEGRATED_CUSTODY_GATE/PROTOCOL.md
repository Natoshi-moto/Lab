# R016 integrated synthetic custody protocol

## Purpose

R016 closes one specific bypass in the research path: R013 outputs bind raw
public keys, so an external rotation or recovery registry cannot revoke those
keys. R016 therefore defines a new synthetic network and genesis. It is a
versioned successor experiment, not an upgrade, bridge, conversion, or claim on
any R013 quantity.

## State

Each unspent output names a stable `controller_id`, never a rotating key.
One combined root commits the height, last accepted event ID, every sorted UTXO,
and every sorted controller record. A controller record commits:

- `ACTIVE` or `LOCKED` status;
- the current epoch and active public key;
- exactly three fixed guardian public keys and threshold `2`;
- the fixed recovery-policy hash;
- the lifecycle-event head; and
- every retired active key in sorted order.

All admitted public keys are globally unique across controllers and roles.
Retirement is monotonic. Guardian policy cannot change in V0.

## Event order

`TRANSFER`, `ROTATE`, `RECOVER`, and `REVOKE` are exact canonical event
envelopes. Every event binds the same kind of predecessor combined-state root,
the R016 network/profile/version, its controller epoch and lifecycle head, and
a content-addressed unsigned event ID. A single local writer serializes accepted
envelopes and replays the exact prefix from frozen genesis before every
decision.

An accepted controller-only event changes the combined root while leaving all
UTXOs and total supply unchanged. An accepted transfer changes UTXOs while
leaving every controller record unchanged. A rejected envelope changes neither
state nor receipt history.

## Authorization

- `TRANSFER` requires one current active-key authorization per input. Each
  signature binds event ID, event kind, predecessor root, controller ID,
  controller epoch and lifecycle head, input index, and exact outpoint.
- `ROTATE` requires the current active key, exactly one current guardian, and
  proof of possession by a globally fresh new key.
- `RECOVER` requires exactly two distinct current guardians and proof of
  possession by a globally fresh new key. The old active key, if present, is
  retired atomically.
- `REVOKE` requires exactly two distinct current guardians and atomically
  retires the active key and locks the controller.

Each signature has a kind-and-role-specific domain. Proof bytes are excluded
from the unsigned event ID to avoid a hash cycle, but the full accepted envelope,
receipt, durable record, and next state bind them.

`LOCKED` is terminal in V0. Recovery from a declared loss is therefore performed
before emergency revocation; revocation is the fail-closed terminal action when
no later on-ledger use should be possible. A loss or compromise label grants no
authority and is not cryptographically detected.

## Exact replay and conflicts

An exact accepted envelope replay returns its original receipt without another
append. Reuse of an accepted event ID with different bytes or authorization
fails. Two non-identical envelopes from one predecessor are siblings: the first
committed event advances the root and the second becomes stale. It is never
silently rebased because rebasing would change the signed intent.

This resolves spend-versus-recovery only inside one trusted ordered history. Two
cloned histories may accept different first events; R016 supplies no network,
fork choice, consensus, or global finality.

## Persistence and checkpoints

The additive R016 store contains only frozen genesis bytes plus exact event and
receipt bytes. It uses SQLite rollback journaling, `synchronous=EXTRA`,
`trusted_schema=OFF`, a strict schema, `BEGIN IMMEDIATE`, full replay, a
256-record cap, and acknowledgement only after commit returns.

A public state checkpoint contains no secret material. The checkpoint gate
classifies it as restorable only when its complete state and root exactly match
the live machine and a separately supplied current caller anchor. Older,
divergent, ahead-of-anchor, and unanchored checkpoints are non-restorable; R016
does not implement state import. A durable-store anchor can confirm an exact
historical prefix, but any later suffix remains merely locally replayed unless
the retained anchor is the tip. Caller anchors are unauthenticated inputs and
do not prove independent retention, freshness, rollback, fork, or tampering.

## Synthetic key material

Fixture signing keys are deterministically derived from plainly labeled public
test-vector strings into permission-restricted, process-scoped temporary files
that are deleted when generation ends. Only public keys, signatures, event
bytes, hashes, and reports are retained as artifacts. These vectors deliberately
provide no secrecy, secure-erasure, or entropy evidence and must never be used
operationally.
