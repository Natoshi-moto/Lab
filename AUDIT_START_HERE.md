# Claude audit start — AUD-R002-CLAUDE-BLIND

## Mission

Independently test and attack the immutable R001 subject and R002 external-witness overlay as an **audit apparatus**, not as a coding task. The exact subject is the Git tag `baseline-001`, its target commit, and the archive named in `operations/audits/AUD-R002-CLAUDE-BLIND/TARGET.json`. The later overlay is not part of the subject tree.

## From Claude Code

1. Confirm `git status --short` is clean.
2. Invoke `/nexus-audit`.
3. Run the required commands.
4. Inspect the target, manifests, workflow, route pack, mutation boundaries, privacy rules, and operator friction.
5. Return one JSON observation per claim using the supplied template.

## From Claude with GitHub access but no terminal

1. Read `CLAUDE.md`, this file, `TARGET.json`, and `docs/DEMONSTRATION.md`.
2. Inspect the latest `Nexus Audit` GitHub Actions result.
3. Review the target tag and snapshot manifest.
4. Return observations in the exact JSON schema. Mark anything requiring execution as `UNABLE_TO_VERIFY`.

## Audit constraints

- Do not edit the target.
- Do not inherit conclusions from ChatGPT.
- Do not treat a passing test suite as proof beyond its stated coverage.
- Do not treat absence of a finding as correctness; use `NO_FINDING_WITH_SCOPE`.
- Report files seen and files not seen.
- Bind every observation to the target SHA-256 from `TARGET.json`.

## Return path

```text
operations/audits/AUD-R002-CLAUDE-BLIND/inbox/claude/<observation-id>.json
```

Validate locally with:

```bash
./nexus audit-ingest --audit-id AUD-R002-CLAUDE-BLIND --check-only <file.json>
```
