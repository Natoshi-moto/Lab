# R015 cold-verifier build packet

Implement only
`experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/independent_transcript_verifier.mjs`
from the R015 protocol, closed transcript schema/fixture, separate external
anchor fixture, public R013 protocol, and JSON schemas.

Do not read or use any Python implementation, R014 tests, the existing R013
JavaScript verifier, Git history, PR #14, or chat summaries.  Do not add a
dependency, key, signing function, database reader, network call, repair path,
or promotion behavior.

Required invocation:

```bash
node experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/independent_transcript_verifier.mjs \
  experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/CLOSED_TRANSCRIPT.json \
  experiments/R015_PCX_INDEPENDENT_DURABILITY_VERIFIER_MODEL/fixtures/EXTERNAL_ANCHOR.json
```

A pass must emit exactly the canonical report defined by `PROTOCOL.md`; all
errors must be fail-closed and emit no partial report.  This is a proposal with
`status_authority: NONE`.

