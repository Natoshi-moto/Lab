# R014 PCX durable settlement protocol V0

## Purpose and dependency

R014 is a persistence profile for R013, not a new asset protocol. It accepts
only exact R013 signed transfer bytes under the frozen synthetic genesis. R013
continues to decide signature validity, ancestry, conservation and candidate
state. R014 decides whether one such accepted transition has been durably
recorded and can be reconstructed after restart.

R014 is stacked on unpromoted R013 head
`33da36ae22457986c69d3aacdcdecd1a71335793`, which is itself stacked on
unpromoted R012. All three decisions remain separate.

## Durable layout

The caller must supply a real, pre-existing ledger parent directory and is
responsible for that parent's own prior durability. R014 never recursively
creates missing path ancestry. Before an exclusive writer proceeds, it fsyncs
the existing parent to durably adopt the `LEDGER/` entry. The durability claim
starts at this documented parent-directory boundary.

```text
LEDGER/
  GENESIS.pcx
  LOCK
  records/
    00000001-<record-hash>.pcx
    00000002-<record-hash>.pcx
```

`GENESIS.pcx` must equal the exact pinned R013 genesis bytes. The lock and
record directories must be real local filesystem objects, not symlinks. Record
names are gap-free eight-digit sequence numbers plus the record self-hash.
Unknown, linked, special, missing, oversized, misnamed or non-canonical members
fail closed. Correctly named `.pending-<pid>-<nonce>` files are never canonical
and may be removed by the next exclusive writer.

This V0 profile is bounded to 256 committed records, 32 pending record files,
256 KiB per closed record and 6 MiB across the record directory. A projected
append that would cross either committed bound fails before any durable write.

## Commit protocol

Under an exclusive POSIX `flock`, the writer:

1. replays every committed record from exact genesis bytes;
2. optionally requires a previously retained external record head to occur in
   the chain;
3. applies the exact signed transfer with the R013 kernel;
4. returns a rejection without changing the committed prefix, or re-fsyncs the
   record directory and returns the original durable receipt for an exact
   replay;
5. creates a closed R014 record containing the exact transfer bytes, byte hash,
   R013 receipt, candidate checkpoint, state roots and previous record hash;
6. writes the complete canonical record to an exclusive temporary file;
7. fsyncs that file;
8. atomically renames it to its final sequence/hash name;
9. fsyncs the record directory; and only then
10. returns `DURABLY_COMMITTED`.

There is no in-place balance file, authoritative snapshot, rollback, rewrite or
manual recovery operation. Full replay is authority within this local profile.

## Crash semantics

- Before rename: the prior committed prefix remains authoritative. A pending
  temp file is ignored and later removed.
- After rename but before directory fsync: no success was acknowledged. On
  retry, the filesystem may expose the old prefix or the complete new record;
  either outcome is replayed and handled exactly once. A visible complete
  record is not labelled durable on retry until the record directory is
  successfully re-fsynced.
- After directory fsync but before reply: the complete record is durable and a
  client retry returns the original record/receipt without appending.
- A corrupted committed record, sequence gap, broken hash/root/receipt chain or
  non-reproducible transition halts recovery. The verifier does not guess or
  silently truncate a committed record.

These are bounded POSIX/Linux semantics. They are not proof against a lying
filesystem, defective drive, kernel/firmware compromise or operator deletion.
They also do not prove the prior durability of caller-created path ancestry
above the required pre-existing ledger parent.

## Independent replay

The Python writer/recovery path uses OpenSSL-backed R013 verification. The R014
JavaScript verifier independently parses and hashes every journal envelope,
then supplies the exact transfer bytes to the pinned R013 JavaScript/Noble
state machine. It reconstructs each receipt, UTXO-count evolution and candidate
checkpoint. The final record head, state root, receipt head, checkpoint and
supply must agree byte-for-byte.

The saved demo also validates every record and anchor through a bounded local
evaluator for the four hash-bound R013/R014 JSON Schemas. The runtime replay
checks remain stricter than those documentary interchange schemas.

## Rollback boundary

A self-contained append-only directory cannot prove that its newest valid
suffix was not deleted. R014 therefore emits a portable head-anchor specimen
and accepts `expected_record_head` on verification and commit. If the caller
genuinely retains an observed head outside the ledger's failure domain, absence
of that head later halts the system. A copy stored beside the ledger or in the
same repository is not independent and does not provide that property.

## Explicit exclusions

No mint, burn, fee, reward, redemption, reserve, bridge, market, wallet, key
generation, key recovery, network, consensus, fork choice, trusted time,
canonical promotion or external-value operation exists in R014.
