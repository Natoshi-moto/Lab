# Return instructions

Place one JSON file per observation under `inbox/claude/`. Validate with `./nexus audit-ingest --audit-id AUD-R002-CLAUDE-BLIND --check-only <file>`. Keep `record_hash` empty for ingestion to compute. Do not edit the target, ledger, archive, tag, route pack, or implementation during the blind pass. Use isolated temporary copies for destructive attack cases and report `UNABLE_TO_VERIFY` when execution is unavailable.
