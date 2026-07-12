# R001 demonstration map

R001 distinguishes **implemented mechanism**, **test**, **demonstrated property**, and **non-claim**.

| Claim ID | Mechanism | Test or inspection path | Demonstrated property | Explicit non-claim |
|---|---|---|---|---|
| DEMO-001 | `./nexus doctor` | `tests/test_doctor.py` and CI | Selected repository invariants, parse checks, secret-pattern checks and Git state are inspectable in one command | No exhaustive security audit |
| DEMO-002 | deterministic snapshot builder | `tests/test_snapshot.py`; `./nexus verify` | Same committed tree and profile produce byte-identical ZIPs; internal and external digests can be verified | No claim that content is correct |
| DEMO-003 | task-to-route compiler | `tests/test_route.py`; generated R001 route pack | Included files, exclusions, task hash, tagged-baseline output schema, baseline and output contract are explicit; unsafe paths and identifier traversal are rejected | No proof that selected context is sufficient |
| DEMO-004 | audit observation validator and ledger | `tests/test_audit.py`; `./nexus audit-check` | Observations bind to one target and append through a hash chain with `status_authority: NONE` | No observation becomes a defect automatically |
| DEMO-005 | private GitHub bootstrap guard | `tests/test_github.py`; source inspection | Bootstrap refuses an existing public remote and requests private creation | No remote was created without authenticated operator credentials |
| DEMO-006 | GitHub Actions workflow | `.github/workflows/nexus-audit.yml` | CI runs the same doctor, unit and verification commands with read-only repository permission | A green check is not truth or complete assurance |
| DEMO-007 | Claude project entry and skill | `CLAUDE.md`, `.claude/skills/nexus-audit/SKILL.md` | A second account receives exact commands, target binding, return schema and mutation limits | Provider instructions are context, not a cryptographic sandbox |
| DEMO-008 | one-object/many-memberships corpus | corpus records plus `domains/*/MAP.json` | One durable object can participate in several fields without duplicated copies | The initial ontology is not final |

## Reproduce locally

```bash
./nexus doctor
python3 -m unittest discover -s tests -v
./nexus verify
./nexus audit-check --audit-id AUD-R002-CLAUDE-BLIND
```

## Audit from another Claude account

Read `AUDIT_START_HERE.md`, inspect the frozen target named in `TARGET.json`, run the commands above where terminal access exists, and return one JSON observation per claim. The blind auditor should challenge this table rather than inherit it.
