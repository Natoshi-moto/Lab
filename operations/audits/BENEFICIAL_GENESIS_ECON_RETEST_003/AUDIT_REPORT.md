# Audit report — BGEN-ECON-RETEST-003

## Authority

`status_authority: NONE`

Does not promote, merge, assign R-rounds, alter `STATUS.json`, authorize live funds, select real charities, make legal conclusions, or claim `ECONOMIC_GATE_PASS`.

## Subject binding

| Item | Value |
|------|-------|
| Repository | Natoshi-moto/Lab |
| PR | #35 |
| Exact subject commit | `0cb2ec36c098750316059fd3ccfa05e65eb8d67b` |
| Subject branch | `claude/bgen-econ-redteam-001` |
| Retest branch | `grok/bgen-econ-retest-003` |
| Stacked base | `claude/bgen-econ-redteam-001` |
| Staleness check at capture | `claude/bgen-econ-redteam-001` tip equals exact subject commit `0cb2ec3` |
| Prior Breaker package | `experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001` (frozen; PR #37 merged) |
| Prior Breaker decision on pre-repair head `b588779` | `HOLD_FOR_REPAIR` for Claude package; `CONTINUE_WITH_CONDITIONS` for mechanism |

## Seat identity

| Field | Value |
|-------|-------|
| Seat | Fresh different-family economics retest |
| Provider / model | xAI Grok interactive CLI (grok-4.5 class) |
| Session posture | Fresh session; **not** a resume of the prior Economics Breaker session |
| Network | available |
| Python | 3.14.6 |
| Capture UTC | 2026-07-21T11:51:37Z |

## Method

1. Bound work to exact subject commit `0cb2ec36c098750316059fd3ccfa05e65eb8d67b` on branch `grok/bgen-econ-retest-003` (equal to `claude/bgen-econ-redteam-001` tip at start).
2. Read repaired Claude package sources, tests, FAILURE_CONDITIONS, receipt, and audit report; read frozen Breaker DECISION/receipt/audit for prior disposition context.
3. Independently inspected and probed the five mandated axes (validator surface, `cap_then_renormalize`, receipt binding, E-001…E-009, preserved mechanism disposition).
4. Re-ran Claude economics simulator and unit tests; re-ran frozen Grok Breaker simulator and unit tests read-only; re-ran full lab unit suite; ran `./nexus doctor` and `git diff --check`.
5. Wrote only under the three authorized retest paths. Did not edit subject Claude package paths or frozen Breaker package paths.

## Files actually inspected

**Claude repaired package (subject):**

- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/allocation.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/governance.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/metrics.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/tainted_funds.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/collusion.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests/test_allocation.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests/test_governance.py`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/FAILURE_CONDITIONS.md`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/README.md`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/CROSS_MODEL_COMPARISON.md`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/MECHANISM_NECESSITY.md`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/NONCLAIMS_AND_OPEN_QUESTIONS.md`
- `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/results/14_governance_cap_then_renormalize.json`
- `operations/audits/BENEFICIAL_GENESIS_ECON_REDTEAM_001/AUDIT_REPORT.md`
- `operations/receipts/BENEFICIAL_GENESIS_ECON_REDTEAM_001/RECEIPT.json`

**Frozen Breaker package (read-only reference):**

- `operations/audits/BENEFICIAL_GENESIS_ECON_BREAKER_001/AUDIT_REPORT.md`
- `operations/receipts/BENEFICIAL_GENESIS_ECON_BREAKER_001/RECEIPT.json`
- `experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/results/DECISION.json`

**Not claimed:** line-by-line reading of every scenario JSON blob under either package.

## Verification results

### 1. Public allocation validation — PASS

Every public function in `model/allocation.py` (`exact_pro_rata`, `capped_pro_rata`, `concave_sqrt`, `concave_log`, `time_weighted`, `random_lottery_component`) calls `validate_participants` directly.

Independent probes rejected:

- duplicate participant IDs
- empty / non-string IDs
- boolean, non-integer, and negative contribution weights
- negative / non-int / boolean pools
- invalid `cap_bps` (0, negative, >10000, bool, float)
- invalid `winners` (0, negative, bool, float)

Package suite: `TestSharedParticipantValidator` OK.

### 2. `cap_then_renormalize` — PASS

- Reports `raw_proportional_weights`, `pre_normalization_clipped_weights`, and final `weights` (scenario output aliases final as `final_normalized_weights`).
- Notes disclose “not a hard final per-holder cap.”
- Independent arithmetic:
  - 1 holder, 50% clip → final `1` (exceeds)
  - 2 holders, 50% clip → final `a = 5/8` (exceeds)
  - 3 holders, 40% clip → final `a = 4/9` (exceeds)
- Package tests at 1/2/3-holder scale OK; scenario 14 JSON contains all three stages.

### 3. Receipt two-commit binding — PASS

| Field | Observed value | Check |
|-------|----------------|-------|
| `repair_logic_commit` | `69b27a3725d50f1913ac12268cffede2bddca1d8` | Exists; is the micro-repair code/doc commit |
| `receipt_binding_parent_commit` | `69b27a3725d50f1913ac12268cffede2bddca1d8` | Equals parent of tip `0cb2ec3` |
| `branch_tip` | absent | Good — removed |
| Tip SHA inside receipt body | absent | Non-self-referential |
| `receipt_self_binding_note` | present | Documents the constraint |

Tip commit `0cb2ec3` only rewrites receipt hash fields after the logic commit — the intended two-commit pattern.

### 4. E-001 through E-009 still hold — PASS

| Repair | Independent finding |
|--------|---------------------|
| E-001 tainted-fund profit | Assumption-conditional decomposition; probe produced both profitable and unprofitable nets |
| E-002 rebate | Conditional arithmetic preserved; expected path depends on access/enforcement/detection; package refuses unconditional “predictable destruction” claim |
| E-003 governance | Five named rules; findings opt-in / rule-conditional; active name is `cap_then_renormalize` |
| E-004 necessity scope | FC1/FC7 remain partial/open pending ledger-function specification |
| E-005 metrics + lottery + IDs | Explicit `*_of_issued` / `*_of_pool`; lottery draws without replacement; duplicates fail-closed |
| E-006 language | No affirmative “token sale” / “investment contract” classification; only repair/non-claim mentions |
| E-007 FC map | FC1–FC7 all mapped with evidence classes |
| E-008 preserved findings | Section retained in FAILURE_CONDITIONS.md |
| E-009 cross-model + commands | CROSS_MODEL_COMPARISON.md present; this retest re-ran required command set |

### 5. Preserved mechanism disposition — PASS (unchanged)

```text
UNDERLYING_MECHANISM: CONTINUE_WITH_CONDITIONS
ECONOMIC_GATE_PASS: false
```

This retest **does not** elevate the mechanism to an economic gate pass. Residual risks that remain controlling for any future gate decision include:

- FC4 pathway (stolen/tainted-fund migration is structurally available regardless of profitability assumptions)
- FC6 (concave / per-identity caps are Sybil-exploitable without an identity layer)

## Commands and results

| Command | Exit | Summary |
|---------|------|---------|
| `python3 experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py` | 0 | 27 scenarios OK |
| `python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests -v` | 0 | 72 tests OK |
| `python3 experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/simulate.py` | 0 | 28 scenarios OK; zero Breaker-path diff afterward |
| `python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/tests -v` | 0 | 25 tests OK |
| `python3 -m unittest discover -s tests -v` | 0 | 185 tests OK |
| `./nexus doctor` | 0 | PASS |
| `git diff --check` | 0 | clean |

### Commands deliberately not run

| Command | Reason |
|---------|--------|
| `./nexus verify` | R-round custody/exchange kernel scope; no R-round assigned |
| `./nexus audit-check --audit-id AUD-R001-CLAUDE-BLIND` | Out of scope; must not reopen R001 ledger |
| `./nexus audit-check --audit-id AUD-R002-CLAUDE-BLIND` | Out of scope; must not reopen R002 ledger |

## Independence qualification

- Different provider family from the Claude economics seat.
- Fresh session for this retest; not a resume of the prior Breaker conversation.
- Subject and Breaker package contents were opened for verification (this is a **retest of a repaired package**, not a second clean-room reconstruction).
- Independent executable probes were run against the public surfaces rather than relying only on the package’s own narrative claims.

## Package decision

```text
REPAIRED_PACKAGE_PASS
```

The repaired Claude economics package at `0cb2ec36c098750316059fd3ccfa05e65eb8d67b` satisfies the mandated verification axes. No new repair blockers requiring `REPAIR_AGAIN` were found.

Preserved (not escalated):

```text
UNDERLYING_MECHANISM: CONTINUE_WITH_CONDITIONS
ECONOMIC_GATE_PASS: false
```

## Limitations

- Same-repo different-provider seat; not a multi-human economic panel.
- Does not re-derive the Breaker package clean-room; Breaker paths were re-run read-only only.
- Does not claim cross-toolchain bit-identity for IEEE-754 `CONCAVE_LOG` weights.
- Does not simulate post-genesis secondary-market governance durability.
- Does not adjudicate Track F legal questions.

## Non-claims

No merge authority, no R-round assignment, no `STATUS.json` change, no live activity, no legal conclusions, no market-price prediction, no `ECONOMIC_GATE_PASS` claim, no modification of the Claude subject package or frozen Breaker evidence by this retest.
