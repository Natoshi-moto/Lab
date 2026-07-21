# Provenance and receipt audit — BGEN-GROK-TECH-AUDIT-001

## Subject binding

| Item | Value | Verified |
|------|-------|----------|
| Frozen subject commit | `8349de7a5978be6a9984aa33fd59ba3725ebaaca` | `git rev-parse HEAD` at binding |
| Subject message | Merge Beneficial Genesis economics research and independent retests | yes |
| Parents | `838f7b9…` + `de5dcd7…` (retest merge) | yes |
| PR #35 mergeCommit | `8349de7…` | `gh pr view 35` |
| PR #37 mergeCommit | `d8523b29ca7a1e0433ab5afdb494ed8452450dde` | yes |
| PR #39 mergeCommit | `de5dcd728b9f99966a0fb5b9f37340bf1b830188` | yes |

## Chronology (observed from git log / PR metadata)

```text
b588779  Bind draft PR #35 (original econ redteam submission)
fa6ed33  Breaker package
d8523b2  Merge PR #37 (Breaker) into claude/bgen-econ-redteam-001 stack
00402a1  BGEN-ECON-REPAIR-002
… micro-repair …
0cb2ec3  Bind micro-repair receipt hashes
fa2e1f0  Retest-003 package
… bind PR #39 …
de5dcd7  Merge retest into economics proposal
8349de7  Merge into main (frozen subject)
```

This matches the research narrative: original red-team → independent Breaker HOLD_FOR_REPAIR → repair → fresh retest REPAIRED_PACKAGE_PASS with **mechanism still CONTINUE_WITH_CONDITIONS / ECONOMIC_GATE_PASS false**.

## Receipt commit existence

All SHA-shaped commit fields in receipts resolve via `git cat-file` **except** descriptive prose fields mis-detected by naive scanners (`subject_commit_description`, semantics notes) — not defects.

| Receipt | Key bindings | Status |
|---------|--------------|--------|
| DESIGN_001 | `final_commit` `a637df5…` exists | OK |
| ECON_REDTEAM_001 | `repair_logic_commit` = `receipt_binding_parent_commit` = `69b27a3…`; two-commit anti-self-ref pattern documented | OK |
| ECON_BREAKER_001 | `subject_commit` `b588779…` (pre-repair); `breaker_commit` `fa6ed33…` | OK |
| ECON_RETEST_003 | `subject_commit` `0cb2ec3…`; `retest_logic_commit` `fa2e1f0…` | OK |
| DIFF_RETEST_002 | `subject_commit` `46a7de6…`; `retest_commit` `b9de462…`; short `branch_tip` `fee86dc` resolves | OK |

## Write-scope integrity

- Economics packages claim no modification of design `protocol/**` — consistent with separate trees and no cross-imports observed in allocation modules.
- Retest-003 authorized paths only retest/audit/receipt dirs; DECISION claims zero post-run subject diff — consistent with this seat’s clean re-runs.
- This audit writes only under authorized Grok Technical paths.

## Clean-room / independence claims

| Claim | Assessment |
|-------|------------|
| Breaker clean-room freeze before PR #35 content | Claimed in Breaker README/CLEANROOM; **not re-derived** this session (package frozen on subject). Independence is **labeled different-family (xAI)** — useful differential, not cryptographic proof of isolation. |
| Retest-003 fresh session, not resume of Breaker | Claimed in receipt; cannot verify conversation state; treat as **declared**, not proven. |
| Same-provider accounts not automatic independence | AGENTS.md rule honored: do not promote Grok Breaker + Grok retest as multi-provider consensus. |
| Design pack `independent_review_claimed: false` on DESIGN receipt | Honest. |
| DIFF retest `independent_review_claimed: false` | Honest despite different-family label. |

## Chronology honesty (failed / superseded / final)

| State | Evidence |
|-------|----------|
| Original red-team overclaims | Documented in repaired README E-001…E-009; Breaker HOLD_FOR_REPAIR on pre-repair subject |
| Repaired package | CONTINUE_WITH_CONDITIONS; ECONOMIC_GATE_PASS false |
| Retest decision | REPAIRED_PACKAGE_PASS for **package honesty**, not economic gate pass |
| Issue #33 lineage text “43 agreements / 0 disagreements” | Matches reproduced RETEST_002 verify.mjs output |

## STATUS.json

Observed read-only: R016 mode; Beneficial Genesis not promoted; this audit did not modify STATUS.

## Gaps

1. Issue #33 program body still summarizes historical design lineage; economics disposition must be read from econ packages, not only issue #33.
2. Lab-level Node crypto dependency not pinned/installed in this clone — affects provenance of full-repo verify, not BGEN package receipts.
