# AUD-R002 Claude result ingestion

This directory preserves the completed `AUD-R002-CLAUDE-BLIND` audit as external auditor evidence.

## Identity

- Auditor: Claude / Anthropic
- Session label: `second-account`
- Review class: `SAME_FAMILY_DIFFERENTIAL`
- Audit execution HEAD: `084b3b9ee6a1434e38a5bf23eee8266c43b3522d`
- Target commit: `7a8068fc6088b81cc9a7c94b49dc77e0abe592d8`
- Target archive SHA-256: `33d3fb549d49e1ad02ac2b2880b5ab4336a6dc29a7142d3e33e4ec2694ad8603`

## Files

- `CLAUDE_AUDIT_REPORT.evidence` is the exact human-readable report from the uploaded result package.
- `CLAUDE_RESULTS_SHA256SUMS.txt` is the exact checksum manifest from that package and records the exact hashes of the report plus the original 18 per-observation JSON files.
- `CLAUDE_RESULTS_ORIGINAL.zip.sha256` records the SHA-256 of the uploaded source package.
- `CLAUDE_OBSERVATIONS_0001_0005.evidence`, `CLAUDE_OBSERVATIONS_0006_0010.evidence`, `CLAUDE_OBSERVATIONS_0011_0014.evidence`, and `CLAUDE_OBSERVATIONS_0015_0018.evidence` are deterministic canonical-JSONL projections of the 18 validated observations, one object per line, split only for transport convenience.

The `.evidence` suffix is intentional. The audit report and observations contain synthetic credential-shaped test fixtures used to demonstrate scanner behaviour. Storing this evidence under an ordinary scanned text suffix would cause the repository's own pattern scanner to classify those deliberately fake fixtures as potential live secrets. The suffix prevents that false positive while the ingestion note, source checksums, and audit schema preserve the evidence boundary.

Before this branch was created:

- all 19 source files passed the uploaded `SHA256SUMS.txt` manifest;
- all 18 observations validated against `constitution/schemas/audit-observation.schema.json`;
- every observation used audit ID `AUD-R002-CLAUDE-BLIND`;
- every observation bound to the declared target commit and archive digest;
- all observation IDs were unique;
- every observation declared `status_authority: NONE`.

## Authority and disposition

This ingestion does **not** promote any observation to a confirmed defect, accepted project state, or canonical truth. The files remain non-authoritative audit evidence. Reproduction, adjudication, repair, and disposition must occur in a separate review step.
