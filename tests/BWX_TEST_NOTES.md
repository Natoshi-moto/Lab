# BWX-v0 adversarial test notes

## Run

```sh
python -m unittest -v tests.test_bwx_adversarial
```

The suite contains 43 explicit fixtures. It deliberately repairs unrelated outer
hashes and manifests for semantic-binding attacks, so each mutation reaches the
validator layer named by the test rather than failing accidentally at the first
digest check.

Current local result: **43/43 PASS**. This establishes only the properties
exercised by these deterministic fixtures; it is not the cold-consumer
demonstration, a security proof, or canonical promotion.

## Required validation layers

1. Bounded ZIP parser: member count, compressed/archive size, uncompressed member
   and total size, canonical names, deterministic order/time, regular-file mode,
   supported compression, no encryption, no duplicate raw or normalized names.
2. Strict JSON parser: UTF-8, duplicate keys at any depth, no NaN/Infinity, exact
   object shapes and lower-case fixed-width hashes.
3. Pack manifest and artifact binding: exact member set, digest and byte-count.
4. Offer/route binding: task, route archive, baseline, producer and recipient.
5. Cognition-shadow binding: exact frozen source set, source root, line-span hashes,
   internal references and shadow self-hash.
6. Policy checks: expiry, predecessor state, exact replay, competing successors,
   declared-but-unverified independence, literal canaries and recomputed falsifiers.
7. Atomic settlement: lock, revalidation under lock, atomic/fsynced ledger replace,
   exact-replay recovery after a post-commit crash and full receipt/state hash-chain
   validation.

## Closed blockers retained as regression tests

- Recipient, producer, epoch and source-root values are checked against the
  task-hash-bound exchange contract rather than inferred from the return.
- Strict parsing rejects duplicate keys and non-standard `NaN`/Infinity values.
- ZIP policy rejects traversal/aliases, symlinks, special-file modes, duplicate
  members, non-DEFLATE compression, non-deterministic metadata and size overruns.
- Expiry produces terminal `EXPIRED / EXPIRED_RETURN`; exact replay after expiry
  still returns the original receipt without appending.
- Secret/PII patterns and the instruction-response marker are rejected from
  returned artifacts, while verifier-only canary values remain out of the
  producer route.
- Cognition shadows are recomputed against the exact frozen HBR-17 source set,
  source-root mapping, byte-exact line spans, internal references and self-hash.
- A claimed falsifier is machine-recomputed from the task-bound invariant; a
  self-declared but unsatisfied falsifier cannot block settlement.
- Settlement serializes read, decision and atomic replacement; concurrent exact
  replay yields one accepting writer and one idempotent result.
- A known consumed predecessor yields `CHALLENGED / COMPETING_RETURN`; an unknown
  predecessor yields `STALE / PREDECESSOR_STATE_MISMATCH`.

## Likely edge bugs worth retaining as regression cases

- `return_hash` and `receipt_hash` must consistently hash the object with the hash
  field blank (or consistently omitted); mixing conventions silently forks IDs.
- `route_sha256` must mean the complete route ZIP digest, not only `ROUTE.json`, or
  context bytes can be substituted while preserving the return binding.
- `a//b`, `a/`, `./a`, backslashes and normalized aliases must be rejected before
  member-set comparison.
- Central-directory sizes are attacker-controlled. Enforce declared limits before
  reading and a bounded streaming read while verifying the actual byte count/CRC.
- Exact replay after expiry must return the original receipt byte-for-byte; it must
  not be reclassified using the later clock value.
- Falsifier expected values cannot be supplied solely by the challenger, or any
  return can be blocked with a fabricated invariant.
- The line locator is 1-based inclusive. Hash exact raw bytes from
  `b''.join(source.splitlines(keepends=True)[start-1:end])`, retaining CRLF and a
  final newline.
- Canary scanning must cover every bounded artifact byte sequence, including
  `.bin` if binary artifacts are later admitted, and distinguish inert instruction
  text from a separately declared execution sentinel.
- Ledger integrity needs both receipt links and accepted-state links. Rehashing a
  forged receipt must not conceal a broken predecessor link.
- The ledger cache/receipt materialization is non-canonical; after a crash it must
  be rebuilt from the committed ledger rather than creating a second receipt.
