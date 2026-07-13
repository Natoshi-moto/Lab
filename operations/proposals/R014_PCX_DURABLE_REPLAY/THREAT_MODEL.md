# R014 threat model

## Assets protected in this round

- exact continuity of one local committed R013 history;
- the promoted R013 fixed-supply invariant after restart;
- survival of every acknowledged accepted transfer;
- absence of duplicate effects after an indeterminate acknowledgement;
- deterministic rejection of competing local spends;
- detection of corruption, schema drift and supplied-anchor divergence;
- separation between candidate evidence and user-controlled promotion.

No economic asset is protected. Every key and quantity remains a conspicuously
synthetic test fixture.

## Declared fault model

The normative campaign injects abrupt process termination at controlled
boundaries before, during and after a SQLite write transaction. It covers:

- exit or `SIGKILL` before `BEGIN IMMEDIATE`;
- termination after replay and candidate validation;
- termination after the row append but before commit;
- termination immediately after commit and before acknowledgement;
- restart and full replay after each termination;
- two local processes contending to append sibling spends;
- exact retry after the caller receives no acknowledgement;
- visible database truncation, byte mutation, row mutation and schema drift;
- stale or divergent local history when a separate caller anchor is supplied.

The only valid recovered result is one complete committed prefix. The campaign
does not claim to reproduce every possible machine or storage failure.

## Trust and environment assumptions

The bounded claim assumes:

- a supported CPython and SQLite runtime whose rollback-journal, locking and
  synchronization behavior conforms to its documented contract;
- one host and a local filesystem that honors SQLite locks, atomic file
  operations and requested synchronization;
- honest operating-system and storage layers once SQLite reports commit;
- an uncompromised R013 parser, transition kernel and frozen genesis;
- callers retry the exact canonical RETURN after an indeterminate result;
- any anchor used for rollback evidence is retained independently of the
  database and supplied exactly by the caller.

Runtime and SQLite versions, path class and required PRAGMA readbacks belong in
the evidence report.

## Adversaries exercised

- a malformed or non-canonical R013 producer;
- a producer replaying, substituting or mutating an accepted transaction;
- two processes submitting signed competing spends;
- a crash scheduler targeting transaction and acknowledgement boundaries;
- an offline mutator changing records, roots, hashes or schema objects;
- a stale database snapshot presented with a newer caller-held anchor;
- configuration drift toward an unadmitted journal or synchronization mode;
- metadata attempting to supply a trusted state root, balance or authority.

## Required fail-closed behavior

- invalid R013 bytes append nothing;
- a pre-commit failure emits no acceptance acknowledgement;
- a successful commit survives restart even if acknowledgement was lost;
- exact retry returns the original result without another append;
- competing writers serialize or fail busy; they never commit both siblings;
- any hash-chain, replay, conservation, schema or integrity mismatch stops;
- a supplied anchor must match the replayed prefix exactly;
- no error launches repair, truncation, history selection or reinitialization;
- stored roots and receipt hashes are checked outputs, never state inputs;
- every emitted object retains `status_authority: NONE`.

## Out of scope and still dangerous

- OS or kernel crash and whole-machine restart;
- physical power loss, torn drive writes, volatile controller caches and
  storage devices that falsely report synchronization;
- network, distributed or unsupported filesystems;
- privileged host compromise, database-file replacement and runtime patching;
- malicious rollback when no independent caller anchor is supplied;
- theft, deletion or rollback of both the database and its only anchor copy;
- SQLite, Python, OpenSSL or dependency implementation defects;
- software-distribution, build and supply-chain compromise;
- key generation, signing-device integrity, backup, recovery and custody;
- network ordering, consensus, data availability and global finality;
- economic backing, solvency, redemption, liquidity and purchasing power;
- legal ownership, consumer protection and financial regulation.

The test harness may use temporary files for deterministic fault injection, but
such runs demonstrate process recovery logic, not physical-media durability or
power-loss safety.

## Rollback boundary

An internally hash-chained database can detect inconsistent edits but cannot
distinguish an older, internally valid copy from the former live file. A
caller-held anchor makes rollback or divergence testable only at and before the
anchored prefix. It does not prevent rollback, identify a canonical fork or
provide consensus.

Without an independently retained and supplied anchor, audits must state
`UNANCHORED`. Marketing the local hash chain alone as tamper-proof, immutable or
rollback-resistant kills the R014 claim.

## Why no repair path exists

Automatic repair would require policy for data loss, fork selection and
authority. Those mechanisms are not demonstrated here. R014 stops on damage so
that the operator sees an evidence failure rather than a plausibly reconstructed
history. A later recovery design must be versioned and tested separately.
