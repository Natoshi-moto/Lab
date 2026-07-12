# R001 build and Claude audit handoff

## Disposition

`AUDIT_READY_LOCAL` — the complete Git repository, Git history, deterministic target, route pack, blind-audit pack and CI definition are present. Remote GitHub creation/push is not claimed because this build environment had no authenticated GitHub session.

## Exact identities

| Object | Identity |
|---|---|
| Active target tag | `baseline-001` |
| Active target commit | `7a8068fc6088b81cc9a7c94b49dc77e0abe592d8` |
| Deterministic target ZIP | `snapshots/canonical/NEXUS_LAB_R001_BASELINE_001.zip` |
| Target ZIP SHA-256 | `33d3fb549d49e1ad02ac2b2880b5ab4336a6dc29a7142d3e33e4ec2694ad8603` |
| Payload manifest SHA-256 | `34e4337b94685c725e316db95b1c8caa3aac4e6cf1595a6bb8005728f16bfb24` |
| Route task SHA-256 | `6cf847616e8c956af660ca0d61063d6f2d7d2cf623bf7f81024f8ef712df81e7` |
| Claude route ZIP SHA-256 | `8cd04352ebe3a0ca8844628e4ea5b5124d4aeb87d5b2907d620ab3db88642e06` |
| Claude blind-audit ZIP SHA-256 | `345fd9f2ffad72bb12335ee5bc126723445493e31449b92dcdcf1a6482bb65bc` |

## Executed evidence

- Nexus doctor: **PASS**.
- Python standard-library unit/adversarial suite: **27/27 PASS**.
- Same tag and snapshot profile rebuilt twice: **byte-identical**.
- Snapshot external digest and internal payload/package manifests: **PASS**.
- Route task hash, tagged-baseline output schema, manifest and included-context bindings: **PASS**.
- Audit-pack manifest and embedded route binding: **PASS**.
- Audit target binding and empty append-only ledger: **PASS**.
- Secret-pattern scan: **0 findings in covered patterns**.
- Worktree symlink policy: **0 findings**.

## Deliberate attacks covered

Path traversal and control characters, traversal through audit/observation IDs, tracked and worktree symlinks, snapshot member tampering, external digest substitution, route inclusion outside scope, output-schema worktree drift, route/audit in-place overwrite, `SECRET` routing, mismatched audit targets, audit self-promotion, duplicate IDs and audit-chain mutation.

## Claude entry

A second Claude account begins at `AUDIT_START_HERE.md`. Claude Code may invoke `/nexus-audit`. The route pack declares 38 included baseline files, exact task bytes, exclusions, the exact baseline commit and output schema. Audit observations bind to the target hash and retain `status_authority: NONE`.

## Remaining assurance blocks

1. `REMOTE_GITHUB_PUSH_NOT_YET_RECORDED` — run the authenticated bootstrap command.
2. `CLAUDE_EXTERNAL_AUDIT_NOT_YET_INGESTED` — the second account must return observations.

## Non-claims

This build does not claim complete security, provider confidentiality, semantic correctness, production readiness, branch-rule enforcement or external audit. A green CI run proves only the checks it executes.
