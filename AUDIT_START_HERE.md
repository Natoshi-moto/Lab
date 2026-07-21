# Audit entrypoint — foundation cycle closed

**Before any trust-shaped conclusion:** read root [`WHY_NOT_TO_TRUST_THIS_PROJECT.md`](WHY_NOT_TO_TRUST_THIS_PROJECT.md). Multi-AI agreement, green CI, and receipts do not create a liable author or certified product.

There is no active broad audit task.

The R001 foundation was frozen at `baseline-001`. R002 produced preserved, non-authoritative observations against that immutable target. Follow-up rounds implemented and boundedly retested the material remediations:

- `AUDOBS-0003` — audit snapshot payload bound to the immutable Git tree at `target_commit`;
- `AUDOBS-0011` — secret-scan filename coverage includes `.env`, `.env.*` and extensionless candidates;
- `AUDOBS-0012` — size-limit exclusions are explicitly reported;
- `AUDOBS-0010` — snapshot claims now distinguish exact frozen artifact bytes, same-toolchain ZIP reproducibility, and cross-toolchain Git-tree/payload identity;
- `AUDOBS-0014` — GitHub bootstrap verifies private visibility and mandatory permission configuration before pushing content;
- `AUDOBS-0015` — mandatory bootstrap failure is fatal and optional failures are explicit `PARTIAL` warnings;
- `AUDOBS-0016` — typed command-scoped assurance gates are enforced by the Nexus CLI.

The closeout implementation and evidence are recorded under:

```text
operations/tasks/TSK-R008-R010-FOUNDATION-CLOSEOUT.json
operations/receipts/R008_R010_FOUNDATION_CLOSEOUT/RECEIPT.json
operations/audits/AUD-R002-CLAUDE-BLIND/results/r007-remaining-adjudication/
```

## Current operating direction

Read `STATUS.md` and `NEXT_ACTION.md`. The next phase is a real bounded vertical slice, not another automatic re-audit of the same machinery.

## Starting a future audit

A future audit must be separately commissioned. Before invoking `/nexus-audit` or another audit seat:

1. create a new task with explicit authority and write scope;
2. identify an immutable target commit and snapshot or Git-tree binding;
3. state whether the work is broad audit, bounded retest or documentary review;
4. preserve `status_authority: NONE` for auditor reports;
5. do not modify historical targets, ledgers or evidence;
6. treat passing tests as evidence only for the exercised property.

New contradictory evidence may reopen a disposition. The absence of an active audit is not a claim of complete correctness, security, privacy or scientific validity.
