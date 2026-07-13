# R014 PCX durable-replay protocol V0

## Purpose

R014 adds one missing property to the promoted R013 experiment: bounded,
crash-consistent recovery of its synthetic conserved state on a single local
host. It does not change the R013 transfer language, authorization rules,
genesis, supply or candidate authority.

The durable store is an evidence-preserving replay log. Exact canonical R013
RETURN bytes are primary. UTXOs, balances, checkpoints, roots and receipts are
derived by running the unchanged R013 state machine from its frozen genesis;
none may be asserted from a database snapshot.

## Frozen relationship to R013

R014 inherits, without extending:

- network `NEXUS-R013-SYNTHETIC`;
- genesis ID
  `974cd4da89feb9f7ae8e14d7b4359f4b76d8697f55e5793219c52e38b627b7de`;
- fixed supply `1000` of the test-only label `R013-SYNTHETIC-CLAIM`;
- exact R013 canonical-byte, hash, authorization and transition rules;
- transfer-only semantics and `status_authority: NONE`;
- the `64`-live-output state bound.

R014 introduces no new transaction kind. In particular, it has no mint, burn,
fee, reward, redemption, reversal, recovery override or administrative spend.

## SQLite profile

Every database connection used to initialize, open, audit or apply a record
must establish and verify this profile before consuming application data:

```text
PRAGMA journal_mode=DELETE
PRAGMA synchronous=EXTRA
PRAGMA trusted_schema=OFF
```

The implementation must reject a database when a required setting cannot be
established or read back exactly. WAL and WAL-derived journal modes are not
admitted. The schema must use SQLite `STRICT` tables and a fixed schema version;
unknown tables, columns, indexes, triggers, views or version values fail
closed.

Before SQLite opens an existing file, R014 reads the fixed database header and
requires rollback-journal read/write format bytes (`1`, `1`) and no `-wal` or
`-shm` sidecar. This keeps a persistent WAL database outside SQLite recovery
code in the reviewed runtime. The PRAGMA readback remains a second check after
open.

This choice is version-conscious, not stylistic. The reviewed Python runtime
links SQLite `3.50.4`. SQLite documents a rare multi-connection WAL-reset
corruption race through `3.51.2`, fixed in `3.51.3` with a `3.50.7` backport:
<https://sqlite.org/wal.html#walreset>. That is the same concurrent-writer class
R014 exercises, so V0 excludes WAL rather than assuming the rare race away.
SQLite also documents that `synchronous=EXTRA` adds a directory sync after the
DELETE-mode rollback journal is unlinked and is the rollback-journal setting
to use when power-loss durability is desired:
<https://sqlite.org/pragma.html#pragma_synchronous>. R014 selects that safer
profile but still does not claim physical power-loss proof; its injected fault
campaign terminates the application process, not the host or storage device.

Every open and apply runs `PRAGMA integrity_check` and requires the single
result `ok`. The bounded `256`-record limit makes full replay and full integrity
checking deliberate V0 costs, not optional optimizations.

Every append uses:

```text
BEGIN IMMEDIATE
  verify configuration and schema
  run integrity_check
  read the complete ordered record chain
  replay from frozen genesis
  validate optional caller anchor
  validate the candidate R013 RETURN
  append exactly one record, or recognize an exact retry
COMMIT
publish acknowledgement
```

Initialization first verifies the frozen genesis and then reserves the new
database pathname with create-exclusive semantics. A racing initializer can
fail, but it cannot clean up or replace the winning initializer's inode.

An error before successful commit rolls the transaction back and emits no
acceptance acknowledgement. Busy, I/O, full-disk, integrity, schema and
configuration errors fail closed.

## Logical record

Each committed row represents one newly accepted R013 transfer and commits to:

```text
schema
network_id
genesis_id
sequence
previous_record_hash
tx_id
tx_sha256
previous_state_root
next_state_root
receipt_hash
receipt_raw_sha256
status_authority
record_hash
```

`sequence` starts at `1`, increases by exactly one and never exceeds `256`.
`status_authority` is exactly `NONE`. `previous_record_hash` is the preceding
record hash or the empty string for sequence `1`.

The record hash uses the existing tagged-hash construction with the new fixed
domain `NEXUS/PCX/DURABLE-RECORD/V0`. Its input is a canonical, closed record
descriptor that commits to every logical field, the SHA-256 of the exact
RETURN bytes and the SHA-256 of the recomputed exact receipt bytes. Unknown
fields, non-canonical encodings and alternate hash domains fail.

Stored roots and receipt hashes are integrity witnesses, never state inputs.
Replay recomputes them and compares exact bytes. A mismatch is corruption or
divergence and stops the operation.

The database stores no private key, seed, password, wallet secret or real-world
identity. It never signs. Only already-signed public synthetic R013 fixtures are
admitted.

## Append-only rule

The supported API has no update, delete, replace, truncate, vacuum-as-repair,
snapshot import, checkpoint import, conflict override or administrative edit.
Application code may append one accepted record or leave the database
unchanged.

Database owner access can always mutate or replace a local file outside this
API. R014 detects inconsistent content during replay; it does not claim that a
local hash chain makes a malicious host or an older valid file snapshot
impossible.

## Full replay

On every open, audit and apply:

1. construct the frozen R013 genesis from version-controlled constants;
2. require consecutive sequences and exact previous-hash linkage;
3. parse each stored RETURN from its exact bytes using the R013 strict parser;
4. apply it through the unchanged R013 transition rules;
5. recompute and compare its pre-root, post-root, receipt hash and record hash;
6. require total supply `1000` after every accepted prefix;
7. expose the final candidate checkpoint only after the complete replay passes.

There is no trusted cached balance, UTXO snapshot, state root, receipt head or
row count. Cached or indexed values, if ever introduced in a later version,
cannot affect V0 decisions.

## Exact retry and acknowledgement

The transaction ID identifies the intended R013 transition. If the exact same
canonical RETURN was already committed at the corresponding accepted point,
an apply is an idempotent retry: it returns the original receipt and anchor and
does not append. Reuse of an accepted transaction ID with different bytes
rejects.

The implementation may publish an acceptance acknowledgement only after
SQLite reports `COMMIT` success. A process killed after commit and before that
publication leaves an indeterminate caller outcome. The safe caller behavior
is to retry the exact same bytes; the store must then return the existing result
without creating a second row.

The retry response carries the original accepted receipt and the anchor at that
transaction's sequence. It also carries `store_anchor`, the independently
checkable current database tip, so a retry of an older transaction neither
rewrites its original result nor conceals later accepted records.

An unacknowledged transition is not necessarily uncommitted. R014 promises
recoverable exact status through replay and retry, not exactly-once message
delivery.

## Concurrent writers

`BEGIN IMMEDIATE` establishes one SQLite writer before candidate validation.
Two processes racing signed sibling spends must serialize against the same
committed prefix. At most the first valid sibling can append; the second must
replay the new prefix and reject as already spent or stale. Busy failure is
acceptable; accepting both siblings is not.

This is single-database serialization on one local host. It is not distributed
ordering, network consensus, fork choice or global finality.

## Caller-held anchors

The store can export a caller-held anchor containing:

```json
{
  "schema": "nexus.pcx-durable-anchor/v0",
  "network_id": "NEXUS-R013-SYNTHETIC",
  "genesis_id": "<64hex>",
  "sequence": "<canonical decimal>",
  "record_hash": "<64hex>",
  "state_root": "<64hex>",
  "receipt_head": "<64hex>",
  "status_authority": "NONE",
  "anchor_id": "<64hex>"
}
```

When a caller supplies an anchor, replay must prove that exact anchor at its
claimed sequence. A local history shorter than the anchor is a detected
rollback. A history with different values at that sequence is a detected fork
or replacement. A matching prefix may have newer records and remains valid.

The anchor must live independently of the database to add evidence. Storing it
only beside or inside the same replaceable database adds no rollback
resistance. Without a supplied independent anchor, the result must be reported
as `UNANCHORED`; no malicious-rollback-resistance claim is allowed.

Anchor export creates a new path and never overwrites an existing anchor. This
preserves prior observations for diagnosis and prevents a later export from
silently erasing the only retained evidence of an older trusted prefix.

Anchors are evidence of one observed prefix. They are not signatures,
notarizations, consensus certificates or canonical promotion decisions.

## Failure and recovery semantics

The demonstrated fault class is abrupt termination of the store process at
instrumented boundaries. After restart, a database must replay to exactly one
complete committed prefix. It may contain the candidate record only if its
commit completed. It must never expose a half-record, a hybrid pre/post state,
an acknowledged-but-absent record or a duplicated retry.

Corruption, truncation, malformed schema, altered row content or a supplied
anchor mismatch stops recovery. V0 has no repair algorithm and never chooses
between histories. Recovery means deterministic validation of an intact
committed prefix, not reconstruction of missing or damaged data.

## Status and authority

Every R014 record, anchor, acknowledgement and report is candidate evidence
with `status_authority: NONE`. Repository promotion remains an explicit user
decision and cannot turn a failed replay into a valid one.

The R001 canonical snapshot remains byte-for-byte unchanged.
