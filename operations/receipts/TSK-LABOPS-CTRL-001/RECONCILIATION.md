# TSK-LABOPS-CTRL-001 control-plane reconciliation

Status authority: `NONE`. Baseline: `52bfb27cef4212a82226f9f9281e540e8abb7173`.

## Accepted state demonstrated by main

- The accepted working round is R016, its exact proposal head and merge are
  recorded, and there is no active task. Sources: `STATUS.json`, `STATUS.md`,
  `operations/receipts/R016_PCX_INTEGRATED_CUSTODY_GATE/PROMOTION.json`.
- The R007 audit adjudication was consumed by the later foundation closeout; it is
  not current work. Sources:
  `operations/tasks/TSK-R008-R010-FOUNDATION-CLOSEOUT.json`,
  `operations/receipts/R008_R010_FOUNDATION_CLOSEOUT/RECEIPT.json`,
  `AUDIT_START_HERE.md`.
- Git branches and pull requests are proposal spaces; main is accepted working
  state and neither state alone establishes truth. Sources: `README.md`,
  `constitution/AUTHORITY.md`, `constitution/MUTATION.md`.
- GitHub's repository page visibly labels `Natoshi-moto/Lab` Public. The local
  entrypoint sources are `README.md`, `README_START_HERE.md`, `CLAUDE.md`, and
  `NEXUS.json`; the remote observation source and timestamp are preserved in
  `operations/receipts/TSK-LABOPS-CTRL-001/OPEN_PULL_REQUESTS.json`.

## Proposed state existing only in open pull requests

- PR #14 is a stacked draft R014 durable-settlement implementation against an
  R013 proposal branch, not an accepted-main change. Its implementation paths
  include `system/nexus_lab/durable_value.py` and
  `tests/test_r014_durable_settlement.py` on its proposal head.
- PR #22 is the draft R017 implementation: replication authentication and evidence,
  a partition demo, proposal/task documents, and focused tests. Exact proposal
  paths and head are listed in
  `operations/receipts/TSK-LABOPS-CTRL-001/OPEN_PULL_REQUESTS.json`.
- PR #23 is a stacked draft R018 ML-DSA-65 admission proposal based on PR #22's
  branch. Its principal paths include `system/nexus_lab/pq_admission.mjs` and
  `tests/test_r018_pq_hybrid_admission.py` on its proposal head.
- PR #24 is an open documentation proposal against main, but its current diff also
  carries R017 experiment and implementation paths. It does not alter accepted
  round state. Exact head, count, summary, and representative source paths are in
  `operations/receipts/TSK-LABOPS-CTRL-001/OPEN_PULL_REQUESTS.json`.

## Verified stale or contradictory active instructions

- `CLAUDE.md` ordered R007 while `STATUS.json` had no active task and R016 as the
  current round. `PROJECT_INDEX.json` and
  `programmes/research-lab-bootstrap/STATE.json` repeated the stale R007 task.
- `NEXT_ACTION.md` ordered R017 design although PR #22 already contains an R017
  implementation proposal. The next step is review/adjudication, not re-performing
  design as though the proposal did not exist.
- `README.md` called the repository public while `README_START_HERE.md`,
  `CLAUDE.md`, `NEXUS.json`, and `constitution/PRIVACY.md` described it as private.
  The observed visibility and the constitutional design requirement are distinct
  facts and are now named explicitly.

## Unresolved human decisions

- `HUMAN_DECISION_REQUIRED`: adjudicate PR #22 as accept, revise, replace, or close.
  Sources: `NEXT_ACTION.md` and the PR #22 record in `OPEN_PULL_REQUESTS.json`.
- `HUMAN_DECISION_REQUIRED`: decide whether to restore private GitHub visibility or
  revise `NEXUS.json`, `constitution/PRIVACY.md`, associated classifications, and
  private-bootstrap assumptions for public operation. This proposal does not alter
  GitHub administration or silently rewrite the constitution. Sources:
  `NEXUS.json`, `constitution/PRIVACY.md`, `system/nexus_lab/github.py`,
  `docs/GITHUB_BOOTSTRAP.md`.
- PRs #14, #22, #23, and #24 remain proposals and require their own human review;
  this report gives none of them promotion authority. Source:
  `operations/receipts/TSK-LABOPS-CTRL-001/OPEN_PULL_REQUESTS.json`.
