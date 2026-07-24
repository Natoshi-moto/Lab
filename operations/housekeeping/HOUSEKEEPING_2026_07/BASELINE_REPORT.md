# Housekeeping baseline report — 2026-07

status_authority: NONE

## Scope and safety posture

This is an evidence report for a conservative housekeeping operation over Natoshi-moto/Lab and Natoshi-moto/Experimental-Sandbox. No accepted state was rewritten. No frozen snapshot, tag, receipt, manifest, hash, STATUS.json, NEXUS.json, constitution file, branch-protection setting, PR state, branch, or tag was changed.

The operator's Lab checkout was dirty before work began with exactly two untracked files: NEXUS_CODEX_HANDOFF__BUILDER__TSK-LABOPS-CTRL-001.md and verify_spine_candidate.sh. I did not reset, stash, clean, overwrite, or execute work against that checkout. A separate worktree was created from the cached origin/main tip for this housekeeping branch.

## Exact baselines

- Lab default branch: main
- Lab starting commit: 50377abe84493a3f2c672c04cc689e5f94546f88
- Experimental-Sandbox default branch: main
- Experimental-Sandbox starting commit: e88520ec6a0bf5bcff09f8d99b961e71afaaebc6
- Housekeeping branch: codex/housekeeping-controller-001, based on Lab starting commit; pushed only as a proposal branch for draft PR #116
- Latest accepted Lab merge at baseline: PR #114, merge commit 50377abe84493a3f2c672c04cc689e5f94546f88
- Prior accepted infrastructure merge: PR #115, merge commit 05223aaa09f0ea89c0e54afc672b2a2452d36335

## Repository and authentication observations

Both repositories are public and default to main according to the connected GitHub app. The app reports administrator access and no auto-merge permission. Local gh authentication is invalid for Natoshi-moto; gh auth status returned an invalid token. A read-only fetch was attempted in both local clones and failed with DNS/network exit 128. GitHub PR, repository, commit and branch facts below therefore come from the connector plus cached refs.

Branch protection and rulesets were not accessible: local gh API calls failed because the host could not be resolved, and the connected app exposes repository metadata but not protection/ruleset details. Those settings are UNABLE_TO_VERIFY and must not be treated as absent or present.

## Open PR inventory

Lab currently has 31 open PRs: #14, #22, #23, #24, #40, #42, #43, #44, #45, #46, #47, #49, #60, #61, #62, #78, #93, #94, #95, #97, #98, #99, #100, #101, #107, #108, #109, #110, #111, #112, and #113. The requested housekeeping set is adjudicated in PR_ADJUDICATION_MATRIX.md; older open work is retained as open proposals in the branch inventory and is not silently closed.

Experimental-Sandbox currently has two open PRs: #2 and #3. PR #1 is merged into Sandbox main and is part of accepted Sandbox state, not Lab state.

## Verification commands and outcomes

Lab isolated worktree:

- ./nexus doctor — exit 0, PASS.
- python3 -m unittest discover -s tests -v — exit 1; 190 tests ran, 9 failures and 2 errors. The failures/errors are caused by missing @noble/ed25519 when R013/R015/R016 independent Node verifiers run.
- ./nexus verify — exit 2; same missing @noble/ed25519 dependency.
- python3 -m unittest tests.test_control_plane -v — exit 0.
- git diff --check — exit 0.

Sandbox origin/main worktree:

- bash scripts/verify.sh — exit 0, router PASS and experimental-sandbox PASS.
- node --check assistant/app/app.js — exit 0.
- jq empty assistant/router/routes.json reports/CHANNELS.json — exit 0.
- git diff --check — exit 0.

These are baseline results, not proof of correctness or safety. No dependency was installed and no failing test was repaired.

## Known warnings and non-claims

- Full Lab verification is blocked by the missing Node dependency; do not call Lab green.
- GitHub checks for inspected PR heads returned an empty status-context list through the connector; CI pass/fail is UNABLE_TO_VERIFY.
- Protection/ruleset differences are UNABLE_TO_VERIFY.
- Public visibility means draft branches and PRs may expose content; drafts are not automatically safe.
- No open PR is accepted state. Merge is not correctness proof.
