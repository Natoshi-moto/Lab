# NEXT ACTION

Review the R014 `PCX_DURABLE_REPLAY` proposal and its exact-head audit, then
decide whether to record a user-authorized promotion disposition for the
bounded demonstration as project history.

R014 stores only exact, already-signed R013 synthetic transfers in a local
SQLite rollback journal. It rebuilds state from the frozen genesis on every
open, obtains the writer lock before validation, acknowledges only after
commit, makes retry idempotent, rejects WAL and corruption without repair, and
can prove a retained caller anchor as an exact prefix.

The injected-failure campaign covers six pre-commit hard exits, one
post-commit/pre-ack exit, eight fresh two-process sibling-spend races, rollback
and same-height fork copies, schema and record mutation, truncation, header
corruption, and WAL-profile rejection. All recovered accepted prefixes retain
the frozen synthetic supply of 1000.

Promotion may accept only
`DEMONSTRATED_CRASH_CONSISTENT_LOCAL_RECOVERY_OF_SYNTHETIC_CONSERVED_STATE`
under the declared process, runtime and honest-local-filesystem model. It does
not establish money, economic value, backing, redemption, custody, wallet or
key safety, network consensus, global finality, physical power-loss safety,
malicious rollback resistance without an external anchor, or production
security. The R001 canonical snapshot remains unchanged.
