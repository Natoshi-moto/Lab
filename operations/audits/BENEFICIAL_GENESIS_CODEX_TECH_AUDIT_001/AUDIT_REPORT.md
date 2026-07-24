# BGEN-CODEX-TECH-AUDIT-001 — technical and evidence audit

## Binding and decision

- Exact subject: `8349de7a5978be6a9984aa33fd59ba3725ebaaca`
- Historical research base: `22ce8c11297ad4c08606277ee83dc845797ba220`
- Pre-audit freeze commit: `6b74f63fd01484088589b2beebf94f62db20db69`
- Seat: OpenAI Codex technical/evidence auditor
- Authority: `REPORT_ONLY`; `status_authority: NONE`
- Decision: `TECHNICAL_EVIDENCE_HOLD_FOR_REPAIR`
- Underlying mechanism disposition: not adjudicated by this technical seat
- Economic gate pass: not granted

The repaired economics package and its Breaker package reproduce their
declared committed test suites, but a new adversarial input falsifies their
unqualified supply-invariant claim. The appropriate package-level decision is
hold for a bounded repair and fresh retest. This does not establish that the
underlying mechanism is economically incoherent.

## Observation CODEX-TECH-001 — negative lottery share over-issues the pool

**Severity:** HIGH for the simulator's claimed supply invariant; bounded to an
analysis model, not a live ledger implementation.

**Evidence class:** TEST + SOURCE.

**Claim:** `random_lottery_component` does not validate
`lottery_share_bps`. A negative value makes `lottery_pool` negative and
`pro_rata_pool` larger than `pool`. Because the negative lottery branch is not
distributed, the function returns the oversized pro-rata allocation. The
scenario layer accepts it and computes a negative unissued remainder.

**Source spans:** `model/allocation.py` lines 1-14 claim every scheme is
integer, floor-based, and never exceeds the pool; lines 166-214 validate only
participants, pool, and winners before using unchecked `lottery_share_bps`.
`model/scenario.py` lines 183-203 forwards arbitrary `scheme_params` and then
computes the remainder without an invariant gate. The repaired tests at
`tests/test_allocation.py` lines 55-75 and 164-168 cover valid lottery shares
and invalid winner counts, but no lottery-share type/range boundary. The
manifest-wide invariant test covers only the committed scenario corpus.

**Reproduction:**

```bash
python3 experiments/BENEFICIAL_GENESIS_CODEX_TECH_AUDIT_001/adversarial_probe.py
```

**Expected:** reject `lottery_share_bps=-1000` as outside `[0, 10000]`.

**Actual:** pool `100` produces `{"only_donor": 110}` and the scenario reports
`unissued_remainder=-10`.

**Impact:** the executable model does not uphold its documented invariant for
its public input surface. Scenario manifests are evidence inputs; accepting an
out-of-domain manifest and emitting internally impossible results weakens both
the technical model and the repaired-package/retest claims around E-005. The
committed scenario results remain reproducible because none uses this input.

**Required repair:** type/range-check `lottery_share_bps` with exact-integer,
non-boolean semantics and `0 <= value <= 10000`; validate all scheme-specific
parameters at the public function boundary; assert `0 <= total_issued <= pool`
before returning and before a scenario result is emitted; add direct and
scenario-level regression tests for negative, above-10000, boolean, float, and
string values; then perform a fresh retest of the repaired exact commit.

## Passing and limited evidence

- Repaired economics suite: 72/72 passed.
- Frozen Breaker suite: 25/25 passed.
- Full lab suite: 185/185 passed after `npm ci` restored the lockfile-pinned
  `@noble/ed25519` dependency. The first run had 11 environment-caused
  failures/errors and is not represented as a subject failure.
- `./nexus doctor`: PASS.
- `./nexus verify`: PASS after dependency restoration.
- The committed REDTEAM, BREAKER, and RETEST paths had no tracked changes.
- Passing tests establish only the exercised inputs. They do not override
  CODEX-TECH-001.

## Evidence review

The repaired reports correctly narrow the earlier economic overclaims,
separate share-of-pool from share-of-issued, distinguish governance integration
rules, disclose that cap-then-renormalize is not a hard cap, and preserve
`ECONOMIC_GATE_PASS: false`. Receipt lineage for PRs #35, #37, and #39 is
consistent with the inspected Git metadata. The fresh retest's
`REPAIRED_PACKAGE_PASS` is too broad in light of CODEX-TECH-001, though its five
declared retest axes can still be true on their bounded tested inputs.

## Limitations and nonclaims

- This is a technical/evidence audit of synthetic models, not an empirical
  economics study, security proof, legal review, or live-funds authorization.
- No exhaustive search over all simulator parameter combinations was proven.
- The audit did not modify the frozen subject or inspect permanently forbidden
  Fable/sibling-audit material.
- Silence on an untested property is `UNABLE_TO_VERIFY`, not a pass.

## Files actually inspected

Repository operating files: `AGENTS.md`, `README_START_HERE.md`, `STATUS.json`,
`STATUS.md`, `NEXT_ACTION.md`, `AUDIT_START_HERE.md`, and the seven top-level
constitution Markdown files. Subject files: the design package's README,
technical design, threat model/nonclaims, protocol Python modules, schemas,
tests and fixture metadata; all REDTEAM and BREAKER model/test Python modules;
their principal reports, result summaries/tables, scenario manifests, audit
reports and receipts; all RETEST_003 files. GitHub objects actually inspected:
exact issues #33, #34, #41 and exact PRs #35, #37, #39.

Individual large JSON result/scenario bodies not needed for the observation
were indexed and hashed but not all manually read field-by-field. No
`corpus/raw/**` content was inspected.

## Provenance

The operator reported two abandoned prior attempts: one stopped on
`SUBJECT_DRIFT`, and one stopped on `BLINDING_BREACH` after PR #40 metadata/body
appeared. This session did not inspect their transcripts or inherit their
conclusions. Their existence is recorded here only as operator-reported
provenance.

