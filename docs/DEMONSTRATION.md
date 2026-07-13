# R001 demonstration map

R001 distinguishes **implemented mechanism**, **test**, **demonstrated property**, and **non-claim**.

| Claim ID | Mechanism | Test or inspection path | Demonstrated property | Explicit non-claim |
|---|---|---|---|---|
| DEMO-001 | `./nexus doctor` | `tests/test_doctor.py` and CI | Selected repository invariants, parse checks, secret-pattern checks and Git state are inspectable in one command | No exhaustive security audit |
| DEMO-002 | deterministic snapshot builder | `tests/test_snapshot.py`; `./nexus verify` | Within one declared Python `zipfile`/zlib toolchain, the same committed tree and profile produce byte-identical ZIPs. Across toolchains, payload-manifest and immutable Git-tree identity are the authoritative rebuild invariant; exact frozen archive bytes remain verifiable by their recorded digest | No universal compressed-byte identity across zlib implementations; no claim that content is correct |
| DEMO-003 | task-to-route compiler | `tests/test_route.py`; generated R001 route pack | Included files, exclusions, task hash, tagged-baseline output schema, baseline and output contract are explicit; unsafe paths and identifier traversal are rejected | No proof that selected context is sufficient |
| DEMO-004 | audit observation validator and ledger | `tests/test_audit.py`; `./nexus audit-check` | Observations bind to one target and append through a hash chain with `status_authority: NONE` | No observation becomes a defect automatically |
| DEMO-005 | private GitHub bootstrap guard | `tests/test_github.py`; source inspection | A new remote is created without pushing, GitHub must report `PRIVATE`, and the required Actions permission request must succeed before content is pushed. Optional label or issue failures return an explicit `PARTIAL` receipt | No live remote was created by the tests; no provider-side confidentiality attestation |
| DEMO-006 | GitHub Actions workflow | `.github/workflows/nexus-audit.yml` | CI runs the same doctor, unit and verification commands with read-only repository permission | A green check is not truth or complete assurance |
| DEMO-007 | Claude project entry and skill | `CLAUDE.md`, `.claude/skills/nexus-audit/SKILL.md` | A second account receives exact commands, target binding, return schema and mutation limits | Provider instructions are context, not a cryptographic sandbox |
| DEMO-008 | one-object/many-memberships corpus | corpus records plus `domains/*/MAP.json` | One durable object can participate in several fields without duplicated copies | The initial ontology is not final |
| DEMO-009 | typed assurance gates | `system/nexus_lab/status.py`, `system/nexus_lab/cli.py`, `tests/test_status.py` | Structured assurance blocks can block or warn on named CLI commands while diagnostic commands remain available | Direct shell commands and external tools can bypass the Nexus CLI gate |

## Snapshot identity model

Nexus separates two properties that ZIP archives often blur together:

1. **Frozen artifact identity:** a checked-in historical ZIP is one exact byte sequence identified by its recorded SHA-256.
2. **Rebuild payload identity:** a rebuilt archive is bound to the immutable Git tree through its payload manifest and source commit.

The outer compressed bytes are expected to repeat only under the same declared Python `zipfile` and zlib runtime. Different compression implementations may encode identical payloads differently. That difference does not weaken the R006 Git-tree binding, but it does mean Nexus must not claim universal outer-ZIP byte reproducibility.

## Reproduce locally

```bash
./nexus doctor
python3 -m unittest discover -s tests -v
./nexus verify
./nexus audit-check --audit-id AUD-R002-CLAUDE-BLIND
```

## Audit from another Claude account

Read `AUDIT_START_HERE.md`, inspect the frozen target named in `TARGET.json`, run the commands above where terminal access exists, and return one JSON observation per claim. The blind auditor should challenge this table rather than inherit it.
