# R014 acceptance and kill criteria

R014 may be described only as
`DEMONSTRATED_DURABLE_SINGLE_HOST_SYNTHETIC_SETTLEMENT` when all gates pass on
the exact proposal head.

## Required gates

1. The exact frozen R013 genesis and signed transfers remain unchanged.
2. The ledger parent is a real, pre-existing, caller-durably-established
   directory; a missing parent is rejected rather than recursively created.
3. Success is returned only after record-file fsync, atomic rename and record-
   directory fsync.
4. Full restart replay reproduces every receipt, checkpoint and final root.
5. Exact retry after a lost reply returns the original durable receipt and
   appends no record.
6. Rejection changes no committed record byte, receipt head or state root.
7. Crash injection at every declared boundary recovers a valid old or complete
   new prefix and never exposes partial candidate state as committed.
8. Two real processes racing the same-parent sibling spends commit at most one.
9. Tamper, gap, misname, unknown member, symlink and genesis replacement halt.
10. Every accepted prefix retains total synthetic supply `1000`.
11. The pinned JavaScript journal verifier plus pinned R013 JavaScript/Noble
    state verifier reproduces all committed receipts and checkpoints.
12. The committed demo ledger, reports, anchor specimen and hash-bound record,
    receipt, checkpoint and anchor schema validations reproduce exactly.
13. Supplying an external observed head detects deletion below that head and
    blocks further commit.
14. Tests explicitly show that a bare local valid prefix cannot detect deletion
    of a later suffix; no stronger rollback claim is made.
15. All R012 and R013 regression gates continue to pass.
16. Every report and checkpoint retains `status_authority: NONE`; no promotion
    path is introduced.

## Immediate kill criteria

- returning durable success before the file and directory entry are fsynced;
- accepting a partial, corrupted, non-canonical or non-reproducible record;
- two competing sibling spends both appearing in one local committed history;
- exact retry causing a second record or debit;
- any restart divergence in decision, root, receipt or checkpoint;
- any supply change, issuance path or unsigned debit;
- a verifier mismatch or silent movement of expected evidence;
- claiming rollback protection without a head retained outside the ledger's
  failure domain;
- claiming global finality, real value, custody safety or canonical promotion.

Passing does not authorize real funds, external users, live keys, redemption,
networking or promotion.
