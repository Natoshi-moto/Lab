# NEXT ACTION

From the existing Claude Code session in this repository, first fast-forward to current `main`, then read `operations/tasks/TSK-R005-CLAUDE-RETEST-ADJUDICATION.json` and execute only that bounded retest/adjudication task.

The three required remediation retests are `AUDOBS-0011`, `AUDOBS-0003`, and `AUDOBS-0012`. Adjudicate only the still-open `AUDOBS-0010`, `AUDOBS-0014`, `AUDOBS-0015`, and `AUDOBS-0016`; do not broaden this into a new audit.

Do not modify `baseline-001`, canonical snapshots, R001/R002 target bytes, audit ledgers, or the original preserved evidence. Return one `.evidence` report under the task's declared write path or on a review branch. The report has `status_authority: NONE`.
