# R014 PCX durable-replay experiment

This experiment tests whether the promoted R013 synthetic conserved state can
survive abrupt store-process termination and deterministic restart on one local
host.

It is intentionally not a wallet, token service, network ledger or live-value
system.

## Prototype contract

- store exact canonical signed R013 RETURN bytes;
- use SQLite rollback journaling with `DELETE`, `EXTRA` synchronization and
  trusted schema disabled;
- serialize writers with `BEGIN IMMEDIATE`;
- append at most `256` hash-chained records;
- replay the complete history from the frozen R013 genesis on every operation;
- acknowledge acceptance only after commit;
- make exact retry idempotent;
- validate an optional independently retained caller anchor;
- stop on corruption or divergence without silent repair.

## Expected operator flow

```bash
./nexus pcx-store-init <database>
./nexus pcx-store-apply <database> <canonical-return-file>
./nexus pcx-store-audit <database>
./nexus pcx-store-export-anchor <database> --output <anchor.json>
```

An apply interrupted after commit but before acknowledgement has an
indeterminate caller outcome. Retry the exact same canonical RETURN. The store
must return the prior accepted receipt without appending another record.

## Test campaign

```bash
python3 -m unittest -v tests.test_r014_durable_replay
./nexus doctor
./nexus verify
```

The campaign covers injected termination at transaction boundaries, restart,
exact retry, repeated two-process sibling races, the fixed history bound and a
reduced-cap boundary test, caller anchors, database and schema tampering, and
required SQLite configuration.

The test harness uses public synthetic R013 fixture keys and signed objects
only. No operator command accepts or creates a private key.

## Honest interpretation

A full pass can demonstrate crash-consistent local recovery of synthetic
conserved state under the declared process, runtime and local-filesystem fault
model. It cannot demonstrate money, economic value, backing, redemption,
custody, wallet or key safety, network consensus, global finality, malicious
rollback resistance without an independent anchor, physical power-loss safety
or production readiness.

The R001 canonical snapshot remains unchanged, and every R014 result remains
`status_authority: NONE`. Only a separate user-authorized promotion receipt may
change the repository disposition; it cannot give authority to an evidence
object.
