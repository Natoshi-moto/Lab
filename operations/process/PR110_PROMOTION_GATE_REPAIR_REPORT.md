# PR #110 — promotion gate repair report

**status_authority:** `NONE`

## Operation identity

- Repository: `Natoshi-moto/Lab`
- Starting Lab `main`: `187f6bf61de8a46a7f41e41d62c3bd23eed9d9ed`
- Starting PR #110 head: `11a18175537da067bf693d0ea9d777beaf1b0158`
- PR base before repair: `57f520a89b45896f6b06e251e03741ac006e884d`
- Repair branch was brought forward by an additive merge of current `main`.
- Final PR head: recorded in the final remote handoff after the last report commit; this report is documentation-only and does not authorize a merge.

The original PR was a Lab-internal proposal. Its old seven-field prose and
grep-based workflow were retained as evidence of intent but replaced by one
structured contract, one standard-library validator, and deterministic tests.

## Contract field matrix

| Contract area | Required fields | Enforced by |
|---|---|---|
| Identity | `schema`, `change_origin`, `status_authority` | JSON shape and exact values |
| Provenance | `sandbox_repository`, `sandbox_commit`, `sandbox_tag`, `sandbox_record_url`, `sandbox_context` | Origin-specific semantics and remote tag metadata |
| Lab binding | `task_or_route_id`, `baseline_lab_commit`, `authority_used` | Full non-empty values and full baseline SHA |
| Scope | `allowed_write_scope`, `files_proposed_for_lab` | Safe relative paths, dispositions, exact PR diff equality |
| Claims | `claim`, `falsifier`, `evidence_class` | Non-empty values and canonical-authority smuggling rejection |
| Test evidence | `tests_run`, `test_results`, `known_failures`, `known_unknowns` | Detailed command/result records and explicit limitations |
| Review | `adversarial_review` | Performed flag, summary, findings, limitations |
| Rights | `rights_and_licences` | Source, licence, modification, rights, MIT-compatibility, exceptions declarations |
| Impact | `security_and_privacy_impact`, `known_lab_red_impact` | Secrets, personal data, external systems, and risk declarations |
| Decision | `operator_decision_requested` | Reversible action and stop conditions; merge/accept actions rejected |

## Workflow enforcement matrix

| Requirement | Result |
|---|---|
| PR lifecycle triggers | `opened`, `edited`, `synchronize`, `reopened`, `ready_for_review` |
| Read-only boundary | `contents: read`; checkout credentials disabled; no Sandbox checkout or execution |
| Structured parsing | Exactly one JSON fence; duplicate keys rejected |
| Lab internal mode | Sandbox fields must be exactly `NOT_APPLICABLE` |
| Sandbox mode | Exact repository, full SHA, tag, record URL, context, rights, impact, review, scope, and operator fields |
| Tag handling | Lightweight tags and peeled annotated tags are distinguished; missing, mismatched, or ambiguous tags fail closed |
| URL handling | Exact commit/tag URLs accepted; branch, `main`, `HEAD`, and `latest` URLs rejected |
| Scope handling | Declared proposed files must exactly equal the PR changed-file set and stay inside allowed scope |
| Automatic action | No copy, write, approval, merge, truth promotion, or credential path exists |
| Limits | The result explicitly says passing the gate is not proof of safety, security, correctness, rights, or deployment suitability |

## Positive tests

- `valid_lab_internal.json` accepted.
- `valid_sandbox_promotion.json` accepted with an exact commit and lightweight tag resolver.
- `valid_annotated_sandbox_promotion.json` accepted with a peeled annotated tag resolver.
- Punctuation and multiline values accepted through structured JSON parsing.
- YAML syntax, JSON syntax, and Python compilation passed.

## Negative and bypass tests

The deterministic suite ran 34 rejection cases. Each raised `ContractError`
and therefore failed closed: missing/unknown origin; missing, abbreviated, or
non-hex SHA; missing/mismatched/missing-resolution tag; branch or mutable URL;
wrong repository; contradictory `NOT_APPLICABLE` fields; missing proposed
files; empty claim; missing falsifier or evidence class; vague test result;
missing failures, unknowns, non-claims, adversarial review, rights, security
impact, or operator decision; incorrect status authority; changed cited commit;
network failure; ambiguous tag; and an undeclared changed file.

Additional parser and bypass tests rejected duplicate keys, malformed JSON,
missing JSON blocks, canonical-authority smuggling, and bot/actor bypass logic.
Whitespace, Markdown punctuation, backticks, multiline values, URL tricks,
tag tricks, and structured duplicate-field attempts were exercised. No test
checks or executes Sandbox content.

## Checks and limitations

- `python3 -m unittest operations.process.test_validate_promotion -v`: PASS, 10 tests.
- `python3 -m py_compile operations/process/validate_promotion.py operations/process/test_validate_promotion.py`: PASS.
- JSON fixtures and schema via `jq empty`: PASS.
- Workflow YAML via installed PyYAML: PASS.
- `./nexus doctor`: pending final branch run; prior accepted Lab result PASS.
- `./nexus verify`: `BLOCKED_BY_MISSING_DEPENDENCY` for `@noble/ed25519`; not installed.
- Full Lab unit suite: `BLOCKED_BY_MISSING_DEPENDENCY`; not repaired.
- A real Sandbox tag was not available from the remote tag listing, so tag behavior was tested with deterministic local resolver fixtures.
- Legal ownership, licence compatibility, semantic correctness, security, and future tag immutability remain declarations or unknowns; the gate does not certify them.
- Branch-protection settings are not inferred from prose and remain `UNABLE_TO_VERIFY` unless separately queried.

## Files changed by this PR

- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/workflows/promotion-origin.yml`
- `AGENTS.md`
- `lab/README.md`
- `operations/process/EXPERIMENTAL_SANDBOX_PROMOTION.md`
- `operations/process/PR110_PROMOTION_GATE_REPAIR_REPORT.md`
- `operations/process/experimental-sandbox-promotion.schema.json`
- `operations/process/promotion_fixtures/valid_annotated_sandbox_promotion.json`
- `operations/process/promotion_fixtures/valid_lab_internal.json`
- `operations/process/promotion_fixtures/valid_sandbox_promotion.json`
- `operations/process/test_validate_promotion.py`
- `operations/process/validate_promotion.py`

No status, constitution, licence, frozen snapshot, historical receipt, product
code, or Experimental-Sandbox file is part of the repaired diff.

## Mutations

Performed: isolated PR-branch commits, one additive synchronization merge with
current Lab `main`, repaired gate files, tests, fixtures, and this report. The
only intended remote write is a push of this repaired PR branch; no merge is
authorized by this report.

Not performed: merge of PR #110, merge authorization, Sandbox modification,
settings changes, branch-protection changes, dependency installation, Hermes
execution, branch deletion, force-push, history rewrite, or automatic copy into
Lab.
