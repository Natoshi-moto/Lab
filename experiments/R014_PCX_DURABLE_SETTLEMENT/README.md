# R014 durable synthetic settlement

R014 takes the already-signed, fixed-supply R013 transfers and tests whether a
single Linux host can commit them exactly once across process failure. It adds
no new unit, issuance path, economic meaning or network authority.

Each accepted transition becomes one canonical, hash-linked record file. The
writer fsyncs the file, atomically renames it into its final sequence name, and
fsyncs the record directory before returning `DURABLY_COMMITTED`. Recovery
ignores only correctly named uncommitted temp files and otherwise fails closed.
The ledger parent must already exist as a real, caller-durably-established
directory; R014 refuses to create missing path ancestry and fsyncs that parent
before adopting a new ledger entry.

Run the evidence gates from the repository root:

```bash
python3 -m unittest -v tests.test_r014_durable_settlement
python3 -m experiments.R014_PCX_DURABLE_SETTLEMENT.build_demo --check
```

The independent journal verifier is a separate JavaScript process. It validates
the journal envelope and invokes the pinned R013 JavaScript/Noble state verifier
on the exact transaction bytes, then reproduces every receipt and checkpoint.

The `EXTERNAL_HEAD_ANCHOR.json` file is only a format specimen. Rollback
detection works only when the observed record head is actually retained outside
the ledger's failure or compromise domain and supplied to later checks/commits.

This remains synthetic, single-host and unsuitable for real value.
