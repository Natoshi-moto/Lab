# R014 claim matrix

| Claim | State | Required evidence | Boundary |
|---|---|---|---|
| The store enforces the frozen SQLite profile | GATED CANDIDATE | exact PRAGMA readbacks, schema checks and negative mode tests | supported runtime on one local filesystem |
| Committed records are append-only and bounded | GATED CANDIDATE | consecutive hash-chain replay, fixed 256 constant and reduced-cap boundary test | application API; a privileged file owner can replace bytes |
| Persistent state derives only from canonical R013 RETURN bytes | GATED CANDIDATE | full replay, malformed-object tests and stored-metadata mutation tests | frozen R013 V0 language and genesis only |
| Acknowledged transfers survive injected process failure | GATED CANDIDATE | kill-point campaign and restart audit | declared process-level fault model, not physical power loss |
| Recovery exposes only a complete committed prefix | GATED CANDIDATE | termination before/after each write phase | one database on one host |
| Exact retry after lost acknowledgement is idempotent | GATED CANDIDATE | post-commit/pre-ack kill followed by repeated exact submissions | same canonical RETURN bytes |
| Two local writers cannot commit sibling spends | GATED CANDIDATE | repeated two-process races in both start orders | SQLite serialization, not global double-spend prevention |
| The race campaign exhausts possible process schedules | FALSE / NOT CLAIMED | eight bounded races only | not an exhaustive concurrency proof |
| A supplied caller anchor detects an older or divergent prefix | GATED CANDIDATE | current, matching-prefix, too-new and divergent-anchor tests | only where the independent anchor is retained and supplied |
| Corruption and schema drift fail without silent repair | GATED CANDIDATE | truncation, bit/row mutation, schema and PRAGMA attacks | detection, not data reconstruction |
| R013 synthetic supply remains exactly 1000 after durable replay | GATED CANDIDATE | invariant after every recovered prefix | synthetic local history only |
| R014 is resistant to malicious rollback without an external anchor | UNVERIFIED / NOT CLAIMED | none | a valid old database copy can satisfy its internal hash chain |
| R014 proves whole-machine crash or physical power-loss durability | UNVERIFIED / NOT CLAIMED | none | OS, drive, controller and dishonest-sync faults are excluded |
| R014 has an independent durability-envelope implementation or exhaustive crash-lifecycle model | FALSE / NOT CLAIMED | none | the R013 transition kernel is cross-verified; the R014 wrapper is one bounded implementation with adversarial tests |
| R014 creates money or an economically valuable unit | FALSE / NOT CLAIMED | none | no backing, redemption, market or purchasing-power evidence |
| R014 is a safe store of value | UNVERIFIED / NOT CLAIMED | none | custody, economics, consensus and law remain absent |
| R014 provides a wallet, key custody or account recovery | FALSE / NOT CLAIMED | none | no private keys or signing enter the store |
| R014 provides network consensus or global finality | FALSE / NOT CLAIMED | none | one local SQLite database only |
| R014 is production-ready or production-secure | UNVERIFIED / NOT CLAIMED | none | bounded prototype without external audit |
| R014 changes the R001 canonical snapshot | FALSE | root status and exact snapshot bindings | R001 remains canonical as-is |
| R014 is canonically promoted | FALSE UNTIL USER ACTION | no automatic authority path | only an explicit user-authorized promotion can change disposition |

If every acceptance gate passes, the first ten candidate rows may jointly
support only this bounded statement:

```text
DEMONSTRATED_CRASH_CONSISTENT_LOCAL_RECOVERY_OF_SYNTHETIC_CONSERVED_STATE
```

No shorter label such as “durable money,” “tamper-proof ledger” or “safe store
of value” is an allowed paraphrase.
