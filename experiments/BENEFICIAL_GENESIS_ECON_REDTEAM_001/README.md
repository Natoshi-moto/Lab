# BENEFICIAL_GENESIS_ECON_REDTEAM_001

Adversarial economics and mechanism-necessity analysis for Beneficial Genesis, for GitHub issue [#34](https://github.com/Natoshi-moto/Lab/issues/34) (`BGEN-ECON-REDTEAM-001`), parent program [#33](https://github.com/Natoshi-moto/Lab/issues/33). **Repaired under BGEN-ECON-REPAIR-002** (issue [#38](https://github.com/Natoshi-moto/Lab/issues/38), E-001 through E-009) following an independent second-family (Grok) Breaker/Reproducer review (`BENEFICIAL_GENESIS_ECON_BREAKER_001`, PR #37).

**Authority:** propose / economic red-team only. Does not alter canonical status, assign an R-round, authorize live funds, select real charities, issue a token, or make legal conclusions. `status_authority: NONE`.

**Repaired final recommendation:**

```text
UNDERLYING_MECHANISM: CONTINUE_WITH_CONDITIONS
ECONOMIC_GATE_PASS: false
```

for the transferable fixed-pool allocation token as currently specified. See `FAILURE_CONDITIONS.md` for the full seven-condition disposition and `CROSS_MODEL_COMPARISON.md` for the comparison against the independent Grok model.

## What changed in the repair

The original submission (PR #35 @ `b5887791338b146daad8f5233ce0e25bf24fe357`) concluded `REJECT_OR_REDESIGN` on the strength of several claims the controlling review found stronger than the executable evidence supported: an unconditional "zero-cost, fully profitable laundering" claim, an unconditional "rebates predictably destroy charity benefit" claim, treating proportional governance as the allocation mechanism's default, an absolute "transferability has no necessary function" claim, mixed concentration denominators, a with-replacement lottery despite "winners" terminology, and forbidden "token sale"/"investment contract" wording. This repair (E-001 through E-009):

- decomposes stolen/tainted-fund economics into legal cost basis, opportunity cost, and risk-adjusted realizable value, reporting profitability as assumption-conditional (`model/tainted_funds.py`);
- adds access/enforcement/detection frictions to the rebate model, preserving the exact one-for-one conditional arithmetic while retracting the unconditional behavioral prediction (`model/collusion.py`);
- makes governance analysis opt-in per scenario under five explicitly named, explicitly transferable-or-not rules (`model/governance.py`), instead of defaulting every scenario to proportional governance;
- fixes the concentration-metric denominator mixing and the with-replacement lottery bug (`model/metrics.py`, `model/allocation.py`);
- rejects duplicate donor identifiers instead of silently colliding;
- narrows the mechanism-necessity conclusion to what the design pack actually specifies, adding an explicit open-question matrix for unspecified ledger functions (`MECHANISM_NECESSITY.md` §3a);
- replaces "token sale"/"investment contract" wording with neutral "fixed-pool floating implied allocation ratio" language;
- maps and classifies all seven of issue #34's failure conditions (the original mapped six);
- adds a cross-model comparison against the frozen, independently-built Grok package.

The result changed from `REJECT_OR_REDESIGN` to `CONTINUE_WITH_CONDITIONS` because most of the original triggers turned out to be conditional on assumptions or integration choices rather than proven unconditionally; two conditions (the stolen-fund pathway's existence, and Sybil-exploitability of concave/capped allocation without an identity layer) remain proven residual risks requiring redesign or policy gates regardless.

## Layout

| Path | Role |
|---|---|
| `MECHANISM_NECESSITY.md` | Track 1 — is a transferable token necessary? Scope-bounded to specified vs. open ledger functions (§3a). |
| `FORMAL_MODEL.md` | Assumptions and equations implemented by the simulator. |
| `ALTERNATIVES_COMPARISON.md` | Track 3 — allocation-rule and governance-rule alternatives comparison. |
| `FAILURE_CONDITIONS.md` | Disposition of all seven of the task's failure conditions, each with an explicit evidence class. |
| `NONCLAIMS_AND_OPEN_QUESTIONS.md` | What this package does not establish, and what remains open. |
| `CROSS_MODEL_COMPARISON.md` | Side-by-side comparison against the frozen, independent Grok Breaker model (E-009). |
| `model/` | Deterministic stdlib-Python simulator: allocation schemes, metrics, population generation, named governance rules, tainted-fund and collusion decomposition, scenario runner. |
| `scenarios/*.json` | 27 scenario manifests covering the required adversarial scenarios. |
| `results/*.json` | Machine-readable per-scenario outputs (regenerable). |
| `results/TABLES.md` | Generated concentration/welfare/attack-profitability/governance tables. |
| `tests/` | `unittest` suite: allocation invariants, metrics properties, governance rules, tainted-fund and collusion decomposition, and scenario-level adversarial findings. |
| `simulate.py` | Entry point: runs every manifest and regenerates `results/`. |

## Reproduction

From the repository root:

```bash
# Regenerate all scenario results
python3 experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py

# Unit tests (allocation, metrics, governance, tainted-fund/collusion decomposition, adversarial findings, determinism)
python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests -v
```

Every scenario is seeded and deterministic: re-running `simulate.py` reproduces `results/*.json` byte-for-byte (enforced by `tests/test_scenarios.py::TestScenarioDeterminism`), with the sole documented exception that the `CONCAVE_LOG` allocation scheme uses IEEE-754 `math.log1p` and is therefore reproducible per-toolchain rather than claimed bit-identical across all Python builds (see `NONCLAIMS_AND_OPEN_QUESTIONS.md`).

## Scope discipline

- Synthetic agents and scenarios only; no live charity addresses, donors, funds, or solicitation.
- No market-price prediction — token value is expressed only as a multiplier on a declared reference breakeven price.
- No change to the Beneficial Genesis cryptographic verifier (`experiments/BENEFICIAL_GENESIS_DESIGN_001/protocol/**`); this package is independent code that does not import or modify it.
- No legal conclusions; legal/economic issue surfaces are flagged for later qualified review (Track F of issue #33), and neutral non-legal wording is used throughout ("fixed-pool floating implied allocation ratio," never "token sale" or "investment contract").
- The frozen Grok Breaker package (`experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/**`, `operations/{audits,receipts}/BENEFICIAL_GENESIS_ECON_BREAKER_001/**`) is read-only to this repair; it was re-run for cross-comparison but never edited (verified: `git status --short` shows no diff in those paths).

## Headline findings (see linked documents for full evidence)

1. The fixed pool is issued in full regardless of subscription level (`19_undersubscribed_pool`, `20_oversubscribed_pool`) — a fixed-pool floating implied allocation ratio, independent of transferability (neutral wording per E-006).
2. Every allocation rule that meaningfully reduces whale concentration for honest single identities (concave weighting, per-identity caps) is severely exploitable by free, unlinkable identity splitting in a permissionless Bitcoin-only design (`05_sybil_split_concave`, `26_sybil_split_capped_pro_rata`); linear pro-rata is split-invariant but does nothing to prevent whale concentration by size alone (`03_whale_99`). **Mathematically proven (FC6).**
3. Charity rebate/circularity: the conditional arithmetic (arrangement exists, zero friction) is exactly one-for-one (`07_rebate_sweep`, `08_secret_rebate_whale`, `18_charity_set_single_vs_multi`); the *expected*, friction-adjusted magnitude collapses once access to a colluding charity is rare and costly (`27_rebate_access_frictions`). **Conditional (FC2).**
4. A stolen-key donation migration pathway exists because cryptographic control is verified, not legal ownership (`10_stolen_key_donation`, `11_quantum_cutoff_freeze`); net migration profit is assumption-conditional, not automatic (sensitivity grid shows both profitable and unprofitable outcomes). **Pathway proven, profitability conditional (FC4.)**
5. Governance capture by donation size alone is conditional on the integration rule: `none`/`nontransferable_equal` grant no capture; `token_weighted`/`nontransferable_proportional` let a single honest whale cross simple majority (52.488%, `13_governance_rules_comparison`); an independently enforced, continuously renormalized cap holds the same whale under 10% (`14_governance_continuously_capped`), but this study cannot verify continuous post-genesis enforcement. **Conditional (FC3).**

## Second-family review

Performed for the pre-repair submission by an independent Grok Breaker/Reproducer seat (`BENEFICIAL_GENESIS_ECON_BREAKER_001`, merged as PR #37 at `d8523b29ca7a1e0433ab5afdb494ed8452450dde`), confirming six overclaim/implementation items and preserving seven narrower findings. This repair implements the required corrections; see `CROSS_MODEL_COMPARISON.md`. The repaired package itself has not yet had its own fresh second-family review — any operator decision to accept it as an `ECONOMIC_GATE_PASS` (as opposed to the `CONTINUE_WITH_CONDITIONS` reported here) should require one, per issue #34.
