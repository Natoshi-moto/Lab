# Remaining audit adjudication start — R007

## Mission

The R002 blind audit of `baseline-001` is complete and preserved. The following remediations have been implemented and retested:

- `AUDOBS-0003` — audit snapshot payload bound to immutable Git tree at `target_commit`;
- `AUDOBS-0011` — secret-scan filename coverage;
- `AUDOBS-0012` — explicit reporting of size-limit exclusions.

The current mission is to resolve only the four remaining material observations:

- `AUDOBS-0010` — cross-toolchain snapshot byte determinism;
- `AUDOBS-0014` — GitHub bootstrap visibility ordering;
- `AUDOBS-0015` — GitHub bootstrap failure surfacing;
- `AUDOBS-0016` — process-gate contradiction.

## Start

1. Confirm current `main` and a clean worktree.
2. Read `operations/tasks/TSK-R007-REMAINING-AUDIT-ADJUDICATION.json`.
3. Read the original R002 evidence, the R005 retest report, the Codex documentary review, and the R006 original-auditor retest evidence.
4. Run every required verification command.
5. Resolve the four observations in the declared order without broadening into a new audit.
6. Produce one bounded `.evidence` report under the task's declared path or on a review branch.

Do not invoke `/nexus-audit`; that broad pass is complete.

## Constraints

- Do not edit `baseline-001`, canonical snapshots, R001/R002 target bytes, audit ledgers, or preserved evidence.
- Do not reopen the three confirmed remediations without contradictory evidence.
- Do not create real external repositories or push test data when testing GitHub bootstrap behaviour.
- A passing test establishes only its exercised property.
- Use `UNABLE_TO_VERIFY` where execution is unavailable.
- Report files seen and files not seen.
- Output has `status_authority: NONE`.

## Return path

```text
operations/audits/AUD-R002-CLAUDE-BLIND/results/r007-remaining-adjudication/R007_ADJUDICATION_REPORT.evidence
```
