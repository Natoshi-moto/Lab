# R014 acceptance and kill criteria

R014 may be described only as
`DEMONSTRATED_CRASH_CONSISTENT_LOCAL_RECOVERY_OF_SYNTHETIC_CONSERVED_STATE`
when every gate below passes on the exact proposal head and the resulting
evidence report records the declared runtime, filesystem and fault model.

## Required gates

1. Initialization and every reopen read back `journal_mode=DELETE`,
   `synchronous=EXTRA` and `trusted_schema=OFF`; an unadmitted or unavailable
   mode fails closed.
2. The database has the exact versioned `STRICT` schema, no unrecognized schema
   objects and no supported application path for update, delete, replace,
   import, repair or fork selection.
   Initialization reserves a new path atomically; racing initializers cannot
   delete or replace the winning database.
3. A write attempt acquires `BEGIN IMMEDIATE` before replay and candidate
   validation. Busy or I/O failure emits no acceptance acknowledgement.
4. `PRAGMA integrity_check` returns only `ok` before application data is
   consumed. Truncation, byte mutation, schema mutation and row mutation are
   rejected without editing or replacing the database.
5. The store admits only exact canonical R013 RETURN bytes. Invalid, malformed,
   unknown-field, foreign-genesis and non-canonical objects append nothing.
6. Every open, audit and apply reconstructs state from the frozen R013 genesis
   and all consecutive stored records. Stored roots, counts and receipts are
   recomputed and cannot affect state transitions.
7. The record sequence begins at one, is gap-free, links every exact record
   hash and has a fixed application bound of `256`. The same boundary guard is
   exercised at a reduced one-record test cap: a second distinct append fails
   without mutation while exact retry remains available.
8. Supply is exactly `1000` after every replayed prefix and every accepted
   state respects R013's `64`-live-output bound.
9. An acceptance acknowledgement is observable only after successful commit.
   Every acknowledged transfer survives process termination and restart.
10. Fault injection before and after every application phase recovers either
    the complete prior prefix or the complete newly committed prefix—never a
    partial record or hybrid state.
11. A process killed after commit but before acknowledgement can submit the
    exact RETURN again and receive the original receipt and anchor without an
    additional row. A different envelope under an accepted transaction ID
    rejects.
12. Repeated two-process races over the same signed sibling pair, including
    reversed start order, commit at most one sibling. The losing process either
    rejects against the replayed prefix or fails busy.
13. A supplied current or earlier matching anchor validates as an exact prefix;
    a database shorter than the supplied anchor and a divergent value at its
    sequence both fail explicitly.
14. An audit without an independently supplied anchor reports `UNANCHORED` and
    makes no malicious-rollback-resistance claim.
15. Error paths do not silently truncate, rebuild, reinitialize, repair or
    choose a history. The original failing file remains available for diagnosis.
    Anchor export atomically creates a new path and racing exports cannot
    replace the winner or any earlier retained anchor.
16. All R012, R013 and repository regression tests pass. `./nexus verify` fails
    closed on missing or mismatched R014 evidence.
17. Every database record, anchor, acknowledgement, checkpoint and report uses
    `status_authority: NONE`; no promotion command exists.
18. The R001 canonical snapshot path, manifest, hash, commit and tag remain
    unchanged.

## Immediate kill criteria

R014 V0 is falsified by any of the following:

- an acknowledged transfer is absent after restart;
- an acknowledgement is published before commit success;
- recovery observes a half-applied row or hybrid pre/post state;
- supply differs from `1000` at any accepted prefix;
- an exact retry appends twice or returns a different accepted receipt;
- both signed sibling spends commit to the same local database history;
- an invalid or non-canonical R013 object changes persistent state;
- a stored state root, balance, count or receipt is trusted instead of replayed;
- a chain gap, hash mismatch, integrity error or schema drift is tolerated;
- a supplied anchor mismatch is downgraded, ignored or repaired;
- WAL, lowered synchronization or trusted schema is silently accepted;
- history is truncated, repaired, reinitialized or selected without an explicit
  versioned protocol and separate evidence round;
- more than `256` records are committed;
- real funds, undisclosed keys, wallet secrets or external settlement enter the
  experiment;
- any object claims promoted or canonical authority without explicit user
  action.

## Explicitly deferred

Passing does not demonstrate money, economic value, backing, redemption,
custody, wallet safety, key management, network consensus, global finality,
malicious rollback resistance, physical power-loss safety, production
availability or production security.

It also does not authorize a live pilot. Offline signing and recovery, network
ordering, economic backing and external audit remain separate future gates.
