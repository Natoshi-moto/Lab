# Audit report — BGEN-R1-RETEST

## Disposition

`REPAIRED_PACKAGE_PASS`, scoped only to the tested R1 domains. `ECONOMIC_GATE_PASS: false`.

`status_authority: NONE`. This is a report-only proposal from OpenAI Codex (`GPT-5`), a different provider family from the Grok repair seat. The review was explicitly not blind to the repair diff.

## Exact target and staleness

The tested baseline was current worktree HEAD `a591167a4046ef73762c78080a27898450b0f1e4` on `codex/bgen-r1-retest-001`. It contains repair logic commit `3c83a13497be94f1cb5a05bec37f10ba81d8903b` followed by a receipt-binding-only commit. GitHub reported draft PR #50 at the same head during capture. No staleness was observed; no silent rebase was performed.

## Evidence

The allocation module from `3c83a13^` was loaded without changing the worktree. For `[('a', 100)]`, pool 100, `lottery_share_bps=-1000`, and one winner, it returned `{'a': 110}`. This independently reproduces the stated pre-repair failure class.

At the repaired HEAD, that input raises `ParticipantValidationError`. Both bps fields reject bool, float, string, negative, and values above 10,000. Winners rejects bool, float, string, zero, and negative inputs; an oversized positive integer is intentionally bounded by the donor population and remains supply-conserving. Pool rejects bool, float, string, and negative inputs; a very large non-negative integer remains supply-conserving. The public invariant gate also rejects over-issued, negative, bool, and float allocation values.

The subject suite ran 78 tests successfully. The independent retest suite ran 8 tests successfully. The simulator ran 27 scenarios. SHA-256 comparison of every file in the committed results directory showed 29 of 29 unchanged before and after regeneration, corroborated by an empty Git diff for the results path.

The first repository-wide 185-test run exposed 11 failures caused solely by the absent pinned Node dependency `@noble/ed25519`. After running the repository/CI-declared `npm ci --ignore-scripts --no-audit --no-fund`, all 185 tests passed. `./nexus doctor` passed with the expected dirty-worktree warning, and `./nexus verify` passed.

`git diff 3c83a13^..3c83a13 -- STATUS.json` and `git diff 8349de7..HEAD -- STATUS.json` were empty. Therefore no `STATUS.json` change was found in repair PR scope.

## Files actually inspected

- `README_START_HERE.md`
- `STATUS.json`, `STATUS.md`, `NEXT_ACTION.md`, `AUDIT_START_HERE.md`
- `constitution/AUDIT.md`, `AUTHORITY.md`, `CANONICALITY.md`, `EVIDENCE.md`, `MUTATION.md`, `PRIVACY.md`, `ROUTING.md`
- repair diff for `3c83a13497be94f1cb5a05bec37f10ba81d8903b`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/allocation.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/scenario.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests/test_allocation.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py`
- all filenames and bytes under `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/results/` for hashing; result contents were not all semantically read line by line
- prior package convention under `experiments/`, `operations/audits/`, and `operations/receipts/BENEFICIAL_GENESIS_ECON_RETEST_003`
- repair receipt and audit under `operations/receipts/` and `operations/audits/BENEFICIAL_GENESIS_R1_SUPPLY_INVARIANT_REPAIR`
- GitHub metadata and text for PR #50 and issue #51

Repository existence or hash traversal is not claimed as semantic inspection beyond the list above.

## Limitations and nonclaims

The tests cover the commissioned adversarial classes, not every Python object or future caller. Large positive winners and pool values are accepted safely rather than rejected by a configured resource ceiling; this retest does not assess denial-of-service bounds. The pass does not establish economic soundness, Sybil resistance, legal status, transferability necessity, privacy, production readiness, or authorization for live activity. It grants no merge or status authority and does not rewrite historical audits.
