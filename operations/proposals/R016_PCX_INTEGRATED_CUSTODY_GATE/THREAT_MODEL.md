# R016 threat model

## In scope

- direct bypass of a sidecar recovery policy by the raw owner key;
- stale active keys after rotation or recovery;
- locked controllers and retired-key reactivation;
- one-guardian, duplicate-guardian, foreign-guardian, role-substitution, and
  missing-proof recovery attacks;
- cross-kind, cross-controller, cross-epoch, cross-root, input-index and outpoint
  signature replay;
- signed sibling spends and transfer-versus-lifecycle races;
- lifecycle events that mutate quantity and transfers that mutate policy;
- exact-retry duplication and event-ID collisions;
- crash boundaries, lost acknowledgement, competing local writers, store
  corruption, stale whole-store replacement with a supplied newer anchor, and
  caller-anchor ambiguity;
- duplicate keys, unknown fields, duplicate JSON keys, noncanonical encodings,
  numeric ambiguity, hostile Unicode, deep nesting, and oversized inputs.

## Trust and failure boundary

The local kernel trusts the ordered byte prefix it is asked to replay only after
validating every prefix from frozen R016 genesis. The durability claim assumes
an honest reviewed SQLite/runtime/filesystem profile. Injected process exits are
not physical power-loss evidence.

Guardian possession, primary-key loss, compromise, user intent, device display,
physical custody, and human identity are outside the machine-observable state.
Two compromised guardians can authorize recovery by design. A compromised
primary transfer that commits before recovery is not reversed.

The three guardian keys are immutable in V0. Guardian rotation, replacement,
policy migration, social-recovery operations, and checkpoint state import are
not implemented. The local durability evidence also assumes filesystem path
components are not adversarially swapped during an open.

An internal counter or hash cannot detect replacement by an older valid whole
history. Detection requires a genuinely newer anchor retained outside that
failure domain. The repository fixture does not establish that such retention
exists.

## Deliberate nonclaims

R016 is not money, economic value, legal property, backing, redemption, a
purchasing-power store, a wallet, secret storage, safe custody, secure entropy,
secure erase, hardware signing, guardian independence, network consensus,
global finality, physical power-loss proof, production security, an external
audit, formal verification, regulatory approval, or authorization for a live
pilot.
