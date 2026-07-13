# NEXT ACTION

Review R012, R013 and the stacked R014 proposal separately, then decide whether
any should be promoted into `main`.

R012 demonstrates one non-financial bounded work return. R013 separately
demonstrates signed conservation on frozen synthetic histories. R014 reuses
those exact signed transfers and demonstrates a single-host durable journal:
file and directory fsync before acknowledgement, atomic record rename, full
restart replay, idempotent retry, serialization of competing local writers and
independent JavaScript reconstruction of every receipt and checkpoint.

R014 also freezes the remaining rollback boundary. A local valid hash chain
cannot prove that its newest suffix was never deleted. When a previously seen
record head is genuinely retained outside the ledger and supplied later, R014
detects rollback below that head and blocks further commit. The repository's
anchor file is only a format specimen, not an independent anchor.

Promotion of R014 would accept only
`DEMONSTRATED_DURABLE_SINGLE_HOST_SYNTHETIC_SETTLEMENT` as project history. It
would not create money, backing, redemption, price stability, safe custody,
network consensus, global finality, production readiness or a new canonical
snapshot.

Do not merge or promote R012, R013 or R014 without explicit, separate user
approval. If any kill criterion or implementation disagreement appears,
preserve the evidence and keep that round unpromoted.
