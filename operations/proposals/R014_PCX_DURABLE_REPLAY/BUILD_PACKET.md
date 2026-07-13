# R014 build packet

## Objective

Demonstrate that the promoted R013 synthetic conserved state can be recovered
after injected process failure without loss, duplication, inflation, hybrid
state or silent repair.

R014 is a bounded local durability experiment. It stores only exact canonical
R013 RETURN bytes in a hash-chained, append-only SQLite database, then rebuilds
all authoritative state by replay from the frozen R013 genesis. It does not
create or handle live value.

## Exact dependency

R014 is forked from the post-promotion closeout on `main`:

```text
69bbe07843e0d400d53e696b7516d8f3bcf55e3e
```

The R001 canonical snapshot remains unchanged. R014 is a proposal until a
separate, explicit user promotion decision.

## Required implementation

- local SQLite rollback journal with `journal_mode=DELETE`;
- `synchronous=EXTRA` and `trusted_schema=OFF` on every connection;
- `BEGIN IMMEDIATE` for every attempted append;
- a `STRICT`, append-only schema holding at most `256` records;
- exact canonical R013 RETURN bytes, not a normalized substitute;
- one domain-separated record hash chaining every committed record;
- full R013 replay from frozen genesis on every open and apply;
- acknowledgement only after SQLite reports a successful `COMMIT`;
- exact idempotent retry after an indeterminate acknowledgement;
- optional caller-held anchors proving an exact local-history prefix;
- fail-closed handling of corruption, divergence and configuration drift;
- no update, delete, import, snapshot trust, repair or fork-choice path.

The expected operator surface is:

```text
pcx-store-init
pcx-store-apply
pcx-store-audit
pcx-store-export-anchor
```

These commands must not accept a private key, create a key, sign a transfer or
claim canonical authority.

## Failure campaign

Exercise deterministic process termination around transaction boundaries,
including immediately before the write transaction, after validation, after
the append but before commit, and after commit but before acknowledgement.
Restart from the same database after each fault.

Also exercise:

- exact retry of an indeterminate submission;
- two-process races over the same signed sibling spends;
- supplied current, stale, future and divergent caller anchors;
- database truncation, byte mutation and row-field mutation;
- schema and required-PRAGMA drift;
- malformed, non-canonical and invalid R013 objects;
- the `256`-record boundary and attempted overflow.

For each recovery, the replayed state must be exactly the last committed
prefix. A transfer acknowledged before failure must survive. A transfer killed
after commit but before acknowledgement may survive, but exact retry must
return the existing receipt without appending.

## Declared environment

The demonstration is limited to one host, one local filesystem whose locking
and sync primitives satisfy SQLite's documented assumptions, one supported
CPython/SQLite runtime, and process-level faults injected by the test harness.
The evidence must record the runtime and SQLite versions used.

WAL mode is forbidden in this round. Network filesystems, OS or kernel crash,
physical power loss, dishonest storage firmware, privileged host compromise
and malicious database rollback without an independent caller-held anchor are
outside the claim.

## Reproduce

```bash
python3 -m unittest -v tests.test_r014_durable_replay
./nexus pcx-store-audit <database>
./nexus doctor
./nexus verify
```

The exact test entry points may be narrowed by the implementation, but the
required acceptance and kill criteria may not be weakened.

## Stop condition

Any lost acknowledged transfer, hybrid state, supply change, duplicate append,
dual sibling acceptance, premature acknowledgement, trusted derived state,
silent repair, supplied-anchor bypass, unsupported SQLite mode or authority
escalation kills R014 V0. Do not move expected results to make a failure pass.
