# R012 build packet

## Reversible two-stage bootstrap

1. On `agent/r012-bounded-work-exchange`, commit only the V0 schemas, protocol, acceptance criteria and frozen fixture as bootstrap commit A. This branch is the rollback boundary; `main`, canonical snapshots and historical rounds remain untouched.
2. Replace `R012_BOOTSTRAP_COMMIT_SHA` in `TASK.template.json` with A's full commit SHA and save the result as `operations/tasks/TSK-R012-BOUNDED-WORK-EXCHANGE.json`. The task baseline is A, whose parent is the observed live `main` commit. This makes the output schema and fixture available at the same immutable baseline without adding a second schema-ref mechanism.
3. Validate the task against `constitution/schemas/task.schema.json`, then generate the route using `./nexus route TSK-R012-BOUNDED-WORK-EXCHANGE`. Never hand-author generated route files.
4. Run the frozen cognition adapter against only the three routed `included/` files. `EXPECTED.json` and `excluded/` remain verifier-side and must not enter the route or return.
5. Package, verify and settle the return with the exchange CLI. Preserve the accepted receipt, exact replay result and adversarial test report under `operations/receipts/R012_BOUNDED_WORK_EXCHANGE/`.
6. Run `./nexus doctor`, the full unit suite and `./nexus verify`. Open a draft PR for review; do not merge, promote or modify the canonical target.

## Operator sequence

```text
nexus exchange-template --route-zip ROUTE.zip --created-at TIME --expires-at TIME --output RETURN.json
nexus shadow-build --corpus-root FIXTURE --exchange-id ID --source-prefix REPO_PATH --output artifacts/SHADOW.json
nexus shadow-verify artifacts/SHADOW.json --corpus-root FIXTURE --exchange-id ID --source-prefix REPO_PATH
nexus exchange-pack RETURN.json --artifact-root . --route-zip ROUTE.zip --output RETURN.zip
nexus exchange-verify RETURN.zip --route-zip ROUTE.zip
nexus exchange-accept RETURN.zip --route-zip ROUTE.zip --ledger SETTLEMENTS.jsonl
nexus exchange-ledger-check SETTLEMENTS.jsonl
```

Exact replay returns the original receipt without appending. Invalid input never manufactures an accepted receipt. All operations are local, standard-library-only and status-neutral.
