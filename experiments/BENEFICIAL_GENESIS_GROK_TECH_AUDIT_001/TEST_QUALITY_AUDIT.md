# Test quality audit — BGEN-GROK-TECH-AUDIT-001

## Design pack (`experiments/BENEFICIAL_GENESIS_DESIGN_001/tests`)

**Suite:** 37 tests, all OK in clean reproduction.

| Category | Examples | Assessment |
|----------|----------|------------|
| Real properties | supply never exceeds pool; floor remainder; bool/negative rejection; nullifier uniqueness; cutoff ±1; reorg rollback; carrier multiplicity; duplicate raw keys | **Strong** |
| Fixture catalog execution | `test_invalid_fixtures` against EXPECTED codes | **Strong** for executable vectors |
| Diff-repair regression | `test_diff_repair_002.py` D001–D008 | **Strong** (hostile type/domain/checkpoint) |
| Synthetic crypto | HMAC stand-ins, public seeds | **Appropriate** for research pack; **not** production crypto assurance |
| Documentary residual | residual risks listed in EXPECTED, not asserted as verifier passes | **Good discipline** |

### Gaps / false-confidence risks

1. **Single reference implementation** for most vectors (Node second implementation exists in RETEST_002 — good, but still two seats only).
2. **Generated fixtures** (`generate_fixtures.py`) + evidence gate byte-compare — good determinism check; risk that generator and verifier share premises is partially mitigated by independent Node retest.
3. **Rejection-code taxonomy looseness** (wrong_output_index → AMOUNT_MISMATCH) means tests encode actual codes, not always ideal semantic names — property “reject” holds; taxonomy tests weaker.
4. README catalog counts outdated (F-001) — tests do not catch documentation drift.

## Claude economics (`ECON_REDTEAM_001/tests`)

**Suite:** 72 tests OK.

| Category | Assessment |
|----------|------------|
| Shared validator on every public function | **Strong** (direct calls, not only via scenario runner) |
| Lottery without replacement + seed determinism | **Strong** |
| Governance three-stage + exceed-clip proofs | **Strong** (1/2/3-holder) |
| Tainted mixed sensitivity grid | **Strong** against unconditional laundering claims |
| Scenario determinism (re-run) | **Strong** |
| Concave IEEE log platform note | Documented; tests claim same-toolchain determinism only |

### Gaps

1. **Scenario tests** can encode narrative findings as assertions on specific scenario JSON — valuable for regression, but some “findings” are model-assumption outputs (token_value multipliers), not empirical facts.
2. **No property tests** that Claude results match Breaker results byte-for-byte (by design different models; cross-model is qualitative in CROSS_MODEL_COMPARISON).
3. **Lottery remainder** (floor prize) unissued — covered implicitly by pool bounds; not always documented as intentional sub-pool remainder.

## Breaker economics (`ECON_BREAKER_001/tests`)

**Suite:** 25 tests OK.

| Assessment |
|------------|
| Focused on pro-rata supply, Sybil, lottery uniqueness, metrics denominators, laundering decomposition, rebate conditional — **adequate independent core** |
| Smaller suite than Claude — intentional differential reconstruction, not full parity |

## Differential retest (`RETEST_002`)

| Assessment |
|------------|
| 19 Node tests + verify.mjs fixture matrix — **high value** as second implementation |
| Hostile fixtures for F-001…F-005 class issues — **real properties** |
| Synthetic crypto parity with Python seeds — confirms stand-in, not real PQ |

## Lab suite (`tests/`)

| Observation |
|-------------|
| 185 tests; 11 failures/errors on this host due to missing `@noble/ed25519` |
| Failures are **environmental**, not BGEN regressions |
| Tests that require Node Noble packages **do not document install steps** at lab root |

## Independent auditor probes

`probes/run_probes.py` + `PROBE_RESULTS.json`: 26 PASS, 10 OBSERVED, 1 FAIL (docs). Complements package suites with composition and taxonomy observations.
