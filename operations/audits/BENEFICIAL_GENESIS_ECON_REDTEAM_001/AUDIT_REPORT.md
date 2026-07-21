# Audit report — TSK-BGEN-ECON-REDTEAM-001 (repaired under BGEN-ECON-REPAIR-002, plus micro-repair)

## Authority

`status_authority: NONE`
Does not promote, merge, assign R-rounds, alter `STATUS.json`, authorize live funds, select real charities, or make legal conclusions.

## Subject and repair binding

| Item | Value |
|---|---|
| Repository | Natoshi-moto/Lab |
| Parent program issue | #33 (`BENEFICIAL-GENESIS-PROGRAM-001`) |
| Original task issue | #34 (`BGEN-ECON-REDTEAM-001`) |
| Repair task issue | #38 (`BGEN-ECON-REPAIR-002`) |
| Merged Beneficial Genesis research base (exact subject) | `22ce8c11297ad4c08606277ee83dc845797ba220` |
| Branch | `claude/bgen-econ-redteam-001` |
| Original submission commit (subject of the controlling review) | `b5887791338b146daad8f5233ce0e25bf24fe357` |
| Original submission receipt binding | `b588779...` (see prior receipt state) |
| Independent Grok Breaker review evidence merge (PR #37) | `d8523b29ca7a1e0433ab5afdb494ed8452450dde` |
| Repair task exact head at start of this work | `d8523b29ca7a1e0433ab5afdb494ed8452450dde` |
| Controlling documents | PR #35 review `#pullrequestreview-4743521321` ("CONTROLLING ADJUDICATION — HOLD FOR INDEPENDENT ECONOMICS BREAKER") and `#pullrequestreview-4743694588` ("Controlling repair contract — BGEN-ECON-REPAIR-002") |

## Seat identity

| Field | Value |
|---|---|
| Seat | Economics Designer / Red-Team (repair pass) |
| Role scope | issue #38 only — repair the Claude economics package (`experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/**`, its audit, receipt, README, and PR body) to implement E-001 through E-009 exactly. Do not touch the Grok Breaker paths (`experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/**`, `operations/{audits,receipts}/BENEFICIAL_GENESIS_ECON_BREAKER_001/**`). Keep PR #35 draft. No merge, no `STATUS.json` change, no R-round, no live activity, no legal conclusions. |

## Method

1. Read issue #38 and the two controlling reviews on PR #35 in full before editing any file.
2. Read the frozen Grok Breaker package (`experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/**`) read-only, to understand what a second-family reconstruction independently found and required, without modifying it.
3. Implemented E-001 (`model/tainted_funds.py`: decomposed legal cost basis / opportunity value / risk-adjusted realizable value / net migration profit, plus a sensitivity grid), E-002 (`model/collusion.py`: conditional-vs-expected rebate incidence with access/enforcement/detection frictions), E-003 (`model/governance.py`: five named, explicitly transferable-or-not governance rules, opt-in per scenario), E-004 (narrowed `MECHANISM_NECESSITY.md` conclusion plus an explicit target-ledger-function matrix), E-005 (fixed `model/metrics.py` denominator mixing, fixed the with-replacement lottery bug in `model/allocation.py`, added duplicate-donor-ID rejection, replaced assumption-asserting tests), E-006 (removed "token sale"/"investment contract" wording in favor of "fixed-pool floating implied allocation ratio"), E-007 (mapped and classified all seven of issue #34's failure conditions in `FAILURE_CONDITIONS.md`, previously only six were mapped), E-008 (explicit "Preserved findings" section cross-linked to the independent model), E-009 (`CROSS_MODEL_COMPARISON.md` plus running every required command).
4. Regenerated `results/*.json` and `results/TABLES.md`; rewrote and extended the `unittest` suite (added `test_governance.py`, `test_tainted_funds.py`, `test_collusion.py`; updated `test_allocation.py`, `test_metrics.py`, `test_scenarios.py`) to assert decomposition/boundary/sensitivity behavior instead of the disputed assumptions themselves.
5. Ran every command listed in the controlling repair contract (§ below) and confirmed the Grok Breaker paths show zero diff after being re-run read-only.
6. Updated this audit report, the sanitized receipt, the package README, and the PR #35 body to record the repair.

## What changed and why (E-001 through E-009 summary)

See `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/README.md` "What changed in the repair" and `FAILURE_CONDITIONS.md` for full detail. In brief:

- Stolen/tainted-fund "laundering_gain at zero cost" → decomposed `net_migration_profit`, assumption-conditional, with both profitable and unprofitable cells in the sensitivity grid (E-001).
- Rebate "predictably destroys charity benefit" → retracted; exact one-for-one conditional arithmetic preserved, expected-with-frictions view added showing the magnitude collapses under low access (E-002).
- Governance analysis is now opt-in per scenario under five named rules instead of defaulting every scenario to proportional governance (E-003).
- Mechanism-necessity conclusion narrowed to what the design pack specifies, with an explicit open-question matrix for unspecified ledger functions (E-004).
- Concentration-metric denominator mixing and the with-replacement lottery bug fixed; duplicate donor IDs now rejected; assumption-asserting tests replaced (E-005).
- "Token sale"/"investment contract" wording replaced with "fixed-pool floating implied allocation ratio" throughout (E-006).
- All seven of issue #34's failure conditions mapped and classified by evidence type (E-007).
- Six independently-confirmed findings preserved and explicitly labelled (E-008).
- Cross-model comparison against the frozen Grok package added; every required command run (E-009).

## Micro-repair addendum (bounded follow-up on PR #35, exact prior head `a0358909c158d3599104b3634447d1320b49881d`)

Three bounded corrections, made without reopening the E-001…E-009 scope:

1. **Shared participant-input validator.** `model/allocation.py` now has one `validate_participants` function that every public allocation function (`exact_pro_rata`, `capped_pro_rata`, `concave_sqrt`, `concave_log`, `time_weighted`, `random_lottery_component`) calls directly. It rejects duplicate participant IDs; empty or non-string IDs; boolean, non-integer, or negative contribution weights; and invalid pool, cap, or winner-count values (`bool` is explicitly excluded from the integer checks since it is a subclass of `int` in Python). Direct tests (`tests/test_allocation.py::TestSharedParticipantValidator`) call the public functions themselves rather than relying only on `model/scenario.py`'s own duplicate-ID check.
2. **Governance rule renamed `cap_then_renormalize`** (was `continuously_capped`). The old name could be read as describing a hard, final per-holder ceiling; it is not one. The rule clips each holder's raw proportional weight at the nominal fraction, then renormalizes the clipped weights to sum to 1 — and that renormalization can push an individual holder's *final* weight back above the nominal clip when several holders are clipped at once. `model/governance.py` and `model/scenario.py` now report all three stages explicitly (`raw_proportional_weights`, `pre_normalization_clipped_weights`, `weights`/`final_normalized_weights`), and `tests/test_governance.py::TestCapThenRenormalize` proves the exceeds-nominal-clip property at 1, 2, and 3 holders. Every document in this package now states only that this rule **reduced concentration in the tested many-holder scenario** (`14_governance_cap_then_renormalize`, renamed from `14_governance_continuously_capped`) — never that it is a durable or hard per-holder cap. Durable, continuously-enforced hard-capped governance remains open Track E work.
3. **Receipt `branch_tip` field replaced.** A committed receipt cannot contain the SHA of the commit that includes it without becoming self-referential (the commit that adds/updates the receipt necessarily postdates whatever SHA the receipt names). The receipt now uses `repair_logic_commit` (the commit containing this micro-repair's actual code/doc changes), `receipt_binding_parent_commit` (the parent commit the receipt-binding commit is built on), and an explicit `receipt_self_binding_note` stating this constraint, instead of a single misleading `branch_tip`.

`UNDERLYING_MECHANISM: CONTINUE_WITH_CONDITIONS` and `ECONOMIC_GATE_PASS: false` are unchanged by this micro-repair.

## Failure-condition disposition (repaired)

See `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/FAILURE_CONDITIONS.md` for full per-condition evidence and classification. Summary:

| FC | Condition (issue #34) | Evidence class | Disposition |
|---|---|---|---|
| FC1 | Transferable token has no necessary function beyond rewarding donation | Conditional / policy question | Partially triggered — open pending target-ledger-function specification |
| FC2 | Rational donors predictably destroy charity benefit via rebates | Conditional simulation result | Not triggered as an unconditional prediction; conditional arithmetic remains a real residual risk |
| FC3 | One actor obtains practical governance control by donation alone | Conditional simulation result | Conditional on the integration rule adopted; not a default defect. The `cap_then_renormalize` rule reduced concentration below majority/blocking-third thresholds **in the tested many-holder scenario only** — it is not a hard per-holder cap and the whale's own final share still exceeds the nominal clip fraction after renormalization |
| FC4 | Mechanism materially incentivizes stolen/tainted-fund laundering | Structural risk (pathway) + conditional (profitability) | Pathway proven and serious; profitability retracted as unconditional |
| FC5 | Timing/cutoff games produce non-deterministic or privileged allocation | Structural risk / empirical unknown | Partially triggered; real but bounded |
| FC6 | Mitigation depends on unverifiable identity while claiming permissionless | Mathematically proven | Triggered, no defensible mitigation for concave/capped schemes absent an identity layer |
| FC7 | Social benefit dominated by a simpler non-token mechanism | Conditional, scoped | Partially triggered for specified functions; open for unspecified ones |

## Aggregate disposition

```text
UNDERLYING_MECHANISM: CONTINUE_WITH_CONDITIONS
ECONOMIC_GATE_PASS: false
```

Two conditions (FC4's pathway component, FC6) are proven residual risks requiring redesign or policy gates regardless of further modelling; the remaining five are conditional on integration choices, product-scope decisions, or assumptions this seat cannot close alone. See `FAILURE_CONDITIONS.md` "Conditions for continuation" for the seven concrete conditions attached to this disposition.

## Commands and results

| Command | Result |
|---|---|
| `python3 experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py` | 27 scenarios executed; `results/*.json` + `results/TABLES.md` regenerated |
| `python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests -v` | 72 tests OK (54 prior + 18 new: shared-validator and cap-then-renormalize tests) |
| `python3 experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/simulate.py` | ran read-only; 28 scenarios OK; **zero diff** in Grok Breaker paths afterward |
| `python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/tests -v` | 25 tests OK (frozen Grok suite, run read-only) |
| `python3 -m unittest discover -s tests -v` | 185 tests OK (existing lab suite; unaffected) |
| `./nexus doctor` | PASS (`WORKTREE_DIRTY` warning while uncommitted, expected) |
| `git diff --check` | clean |
| `git status --short` (pre-commit) | only paths under the three Claude-authorized directories; zero diff under Grok Breaker paths |

`./nexus verify` and `./nexus audit-check` were not run: `./nexus verify` is scoped to the R-round custody/exchange kernels and this task assigns no R-round; `audit-check --audit-id` targets the R001/R002 blind-audit ledgers, out of scope and must not be reopened. Same disposition as the original submission.

## Independence qualification

This repair is a single-seat (Economics Designer/Red-Team) correction responding to an independent second-family (Grok) review that has already occurred (`BENEFICIAL_GENESIS_ECON_BREAKER_001`, merged PR #37). The repair itself has not been re-reviewed by a second family. Because the recommendation is `CONTINUE_WITH_CONDITIONS` with `ECONOMIC_GATE_PASS: false`, not a gate pass, issue #34's "second-family review before any gate pass" condition is not itself triggered by this submission, but a fresh independent look at the repaired package should precede any future gate-pass decision.

## Gate recommendation

```text
CONTINUE_WITH_CONDITIONS
ECONOMIC_GATE_PASS: false
```

The charity-bound migration-receipt concept is not shown to be economically incoherent. The transferable fixed-pool token as currently underspecified should not be defended by default and is not economically gate-passed. See `FAILURE_CONDITIONS.md` "Conditions for continuation" for the redesign/policy conditions attached, and `MECHANISM_NECESSITY.md` §3a for the open target-ledger-function question that FC1/FC7 depend on. PR #35 remains draft; no merge, no status change, no R-round.

## Non-claims

No merge authority, no R-round assignment, no status promotion, no market-price prediction, no live funds or real charity claims, no legal conclusions, no claim of cross-family independent review of the *repaired* package specifically, no claim that this analysis exhaustively enumerates every possible strategic behavior against the mechanism.
