# R013 test notes

`test_r013_pcx_convergence.py` exercises the frozen conservation gate.

Coverage includes:

- pinned genesis and exact fixed supply;
- RFC 8032 verification and mutation rejection;
- split, merge, multi-owner and creating-transaction ancestry;
- exact replay and transaction-ID collision;
- the exact same two signed sibling spends in both arrival orders;
- duplicate JSON keys, BOMs and non-canonical bytes;
- every JSON numeric form, booleans/nulls, oversized decimal strings, hostile
  Unicode and excessive nesting;
- foreign domain and alternate genesis;
- stale roots, duplicate/missing/mismatched inputs and input ordering;
- wrong owners, inflation and amount aliases;
- signature mutation, truncation, high-S malleability, semantic mutation and
  domain substitution;
- authority escalation and invalid transport encoding;
- reproducible native-crypto vector generation;
- byte-identical Python/OpenSSL and JavaScript/Noble reports;
- frozen expected-report reproduction.
- deterministic 128-case raw-byte mutation differential fuzzing across both
  parsers and state machines.
- growth beyond eight live outputs, the 64-output state cap and checkpoint
  schema alignment;
- fail-closed evidence deletion/mutation paths and verifier path/hash pinning;
- a bounded abstract model covering 5,881 states, 115,266 transfers and the
  same number of rejected spent-selection replay attempts.

The suite does not cover networking, global consensus, custody, recovery,
privacy, markets, redemption, legal status or all possible transaction
histories. Checkpoint import, persistence, crash recovery, concurrency and
atomic external settlement also remain explicit non-claims.
