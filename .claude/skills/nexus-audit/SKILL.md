---
name: nexus-audit
description: Run the read-only R002 external-witness audit against baseline-001 and return hash-bound observations.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(./nexus *) Bash(python3 *) Bash(git status *) Bash(git diff *) Bash(git rev-parse *) Bash(git show *) Bash(sha256sum *)
---

# Nexus R002 blind audit

1. Read `AGENTS.md`, `AUDIT_START_HERE.md`, `constitution/AUDIT.md`, `operations/audits/AUD-R002-CLAUDE-BLIND/EXTERNAL_WITNESS_ARCHITECTURE.md`, and `operations/audits/AUD-R002-CLAUDE-BLIND/TARGET.json`.
2. Confirm `git status --short`. Do not modify the target tag or snapshot.
3. Run:

```bash
./nexus doctor
python3 -m unittest discover -s tests -v
./nexus verify
./nexus audit-check --audit-id AUD-R002-CLAUDE-BLIND
```

4. Attack the apparatus according to `CLAUDE_TEST_PLAN.md`. Distinguish what you inspected from what merely exists.
5. Copy `OBSERVATION_TEMPLATE.json` once per claim. Populate all required fields. Keep `record_hash` empty; ingestion computes it.
6. Validate each proposed observation without changing the ledger:

```bash
./nexus audit-ingest --audit-id AUD-R002-CLAUDE-BLIND --check-only path/to/observation.json
```

7. Place returned files only under `operations/audits/AUD-R002-CLAUDE-BLIND/inbox/claude/` or a branch named `claude/audit-r002-*`.
8. Never claim independent corroboration merely because this is a different Anthropic account. Use `UNABLE_TO_VERIFY` or `NO_FINDING_WITH_SCOPE` where appropriate.
