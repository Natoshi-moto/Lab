# NEXT ACTION

Review and verify `TSK-R008-R010-FOUNDATION-CLOSEOUT` on branch `chatgpt/r008-r010-foundation-closeout`.

Acceptance sequence:

1. inspect the source and test diff for `AUDOBS-0010`, `AUDOBS-0014`, `AUDOBS-0015` and `AUDOBS-0016`;
2. run the full Nexus Audit workflow on the pull-request head;
3. if it passes, add the bounded closeout receipt and clear only the corresponding typed assurance blocks;
4. rerun the workflow against the final closeout state;
5. merge only after the final workflow succeeds.

Until that acceptance occurs, the Nexus CLI programmatically blocks `freeze` and `github-bootstrap` through `STATUS.json`. Diagnostic commands remain available. Do not modify `baseline-001`, canonical snapshots, R001/R002 target bytes, audit ledgers or preserved evidence.
