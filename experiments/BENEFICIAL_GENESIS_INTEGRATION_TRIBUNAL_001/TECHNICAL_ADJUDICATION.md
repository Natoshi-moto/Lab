# Technical adjudication — BGEN-INTEGRATION-TRIBUNAL-001

Subject: `8349de7a5978be6a9984aa33fd59ba3725ebaaca`.
Adjudicates the disagreement between PR #42 (`TECHNICAL_EVIDENCE_HOLD_FOR_REPAIR`)
and PR #43 (`PASS_WITH_STATED_LIMITS`) from raw evidence. One valid executable
counterexample controls; no votes were counted.

## A. Lottery supply counterexample — ADJUDICATED FOR PR #42

Independently re-implemented (not rerun) with pool=100,
`lottery_share_bps=-1000`, a well-formed sole donor, `random.Random(1)`:

- issuance becomes **110** — confirmed (probe T-001);
- scenario `unissued_remainder` becomes **−10** — confirmed at the real
  scenario-runner surface with a well-formed manifest (probe T-010);
- it violates a documented invariant — yes: `model/allocation.py` lines 1–14
  state allocation "never exceeds `pool`"; the falsified claim is the
  package's own, unqualified;
- scope — **confined to the economics alternative** (REDTEAM package). The
  normative design allocation (`protocol/allocation.py`) has no bps
  parameter, enforces `assert_supply_invariant`, passed 200 fresh random
  conservation probes and rejects a negative pool (T-011). The Breaker
  package's lottery rule bounds its parameters via `_require_int`
  (T-012 fail-closed). The Beneficial Genesis normative allocation/protocol
  is **not reached**.

Adjacent fail-open parameter surfaces (tribunal search, Phase 2A):

| Surface | Result | Probe |
|---|---|---|
| `lottery_share_bps = -1000` | FAIL-OPEN, invariant breach | T-001/T-010 |
| `lottery_share_bps = 20000` | fail-closed **accidentally** (derived sub-pool rejected downstream, not the parameter) | T-002 |
| `lottery_share_bps = True` | FAIL-OPEN, silently 1 bps (contradicts the package's own bool-exclusion doctrine) | T-003 |
| `lottery_share_bps = 250.5` | fail-closed accidentally (float sub-pool) | T-004 |
| `lottery_share_bps = "10"` | raw `TypeError`, not a domain rejection | T-05 |
| `time_weighted early_bonus_bps = -5000` | FAIL-OPEN, inverts documented early-donor semantics (supply invariant held) | T-006 |
| `epoch_close_block < epoch_open_block` | FAIL-OPEN, corrupt bonus math | T-007 |
| `rng` = arbitrary object with `randrange` | FAIL-OPEN, winner attacker-chosen | T-008 |
| `winners = True` | fail-closed by validator (the one validated scheme parameter) | T-009 |

Conclusion: this is a **systematic boundary-validation gap on scheme
parameters**, not a single missing check. `validate_participants` (the
E-005 micro-repair) covers pool, cap_bps, winners, and participant entries
rigorously — the repair simply never extended to the remaining scheme
parameters, and the lottery lives outside the `SCHEMES` registry where the
pattern would have been visible (PR #43 F-004).

## B. Design evidence counts — DOCUMENTATION DRIFT, NOTHING STRONGER

Exact reproduced state: gate exit 0 with `executed=34, documentary=1,
residual=8`; `EXPECTED.json` has 35 `invalid_expected_codes` (34 executable
+ 1 documentary) and 8 residual risks; `fixtures/invalid/` holds 36 files —
the 36th, `duplicate_raw_claim.json`, is exercised by a separate raw-parser
check (`verify_evidence.py:142–148`) and legitimately sits outside the
catalog count. The README's "29 executable / 6 documentary" is stale
(pre-repair numbers). All machine-checked layers agree with each other;
only prose drifted. Classification: DOCUMENTATION_DRIFT (TRIB-F-003).
Audit summaries in PRs #42/#43/#44 all report the gate's numbers correctly.

## C. Reproducibility environment — ENVIRONMENT/DOCUMENTATION DEFECT

From this clean worktree: full lab suite 185 run, 9 failures + 2 errors;
`./nexus verify` exit nonzero — every failure at missing `@noble/ed25519`
in R013/R015/R016 Node verifiers (outside the BGEN packages). `npm ci`
resolves completely: 185/185 OK, verify PASS, doctor PASS. The dependency
is correctly pinned in `package.json` and `package-lock.json`. No root
README, AGENTS.md, AUDIT_START_HERE.md, or receipt states the prerequisite.
Verdict: environment/documentation defect, **not** a product defect
(TRIB-F-004). All four seats that touched this agree on the facts; the
"disagreement" was only in categorization emphasis. Related: RETEST_002's
Node tests pass 19/19 only under the README-prescribed root-level
invocation; `node --test tests/` from inside the package directory fails —
prescribed commands need explicit working directories.

## D. Verdict vocabulary — SUBSTANTIVELY ACCURATE, VOCABULARY-NONCONFORMING

PR #42's machine-readable receipt carries a single
`decision: TECHNICAL_EVIDENCE_HOLD_FOR_REPAIR` plus separate
`economic_gate_pass: false` and
`underlying_mechanism_disposition: NOT_ADJUDICATED_BY_THIS_TECHNICAL_SEAT`.
Its task (issue #41) prescribed no vocabulary, so nothing was violated.
Mapped onto the three-category vocabulary PR #43 used:

- TECHNICAL_PACKAGE → **REPAIR_REQUIRED** (all committed suites reproduce,
  but the package's own documented invariant is falsified on its public
  surface by an executable counterexample; NOT_REPRODUCIBLE would be false);
- CLAIM_EVIDENCE → **OVERSTATED** narrowly, for the unqualified
  supply-invariant claim and the retest's blanket `REPAIRED_PACKAGE_PASS`;
  the five bounded retest axes can remain true on their tested inputs;
- REAL_WORLD_READINESS → RESEARCH_ONLY (consistent).

The handoff label accurately conveys the operative consequence (hold,
bounded repair, fresh retest). TRIB-F-005.

## E. Other technical findings

- **Rejection-code taxonomy vs fixture naming:** confirmed as label
  looseness (TRIB-F-007); everything fails closed; low severity.
- **Parser/type/domain boundaries:** the design pack's boundaries are
  strict where tested (duplicate raw JSON keys rejected; hex case/prefix
  rejected; bool-as-int rejected in `allocate_proportional`); the REDTEAM
  package's boundary is strict on participants and porous on scheme
  parameters (section A).
- **Cross-model input-domain divergence (PR #40 AUD-SEM-02) and
  sensitivity-grid semantics (AUD-SEM-01):** read but **not independently
  re-verified** by this tribunal; recorded as PR #40-supported at its
  stated confidence, no tribunal disposition.
- **Receipt and subject binding:** every receipt commit SHA referenced by
  the five audits resolves in this clone; PR heads match the GitHub API;
  PR #43's two-commit binding pattern (receipt does not contain the SHA of
  the commit finalizing its own bytes) is sound practice.
- **Test assumptions vs tested properties:** PR #44's receipt discloses
  repairing one of its own test assertions mid-audit (expected {−1,+1},
  grid correctly contained a zero boundary) — the honest direction; no
  load-bearing assumption-asserting test found by PR #40 post-repair, and
  the tribunal found none in the suites it reran.
- **Subject mutation after generators/simulators:** none observed —
  `git status` clean after all tribunal runs (design gate regenerates
  fixtures in a temp dir; simulators byte-stable), consistent with
  PR #43's tracked-path check.
- **43/0/0 differential:** reproduced exactly; proves fixture-corpus
  parity between two implementations, nothing about unfixtured inputs
  (TRIB-F-001 is the live demonstration) and nothing about real-chain
  semantics (TRIB-F-009).

## Adjudicated dispositions

**Confirmed blockers (for evidence-package integration only):**

1. TRIB-F-001 negative-bps supply-invariant breach (with TRIB-F-002 as the
   same repair unit).

**Non-blocking repairs:** TRIB-F-003 README counts; TRIB-F-004 prerequisite
documentation; TRIB-F-007 rejection-code specificity; TRIB-F-008 registry
entry.

**False positives:** none — every claim examined from all five audits was
either confirmed, confirmed-with-limits, or (in PR #43's case) a
non-finding overclaim rather than a false finding.

**Scope boundaries:** the counterexample and all adjacent gaps live in
`BENEFICIAL_GENESIS_ECON_REDTEAM_001` (analysis model). Design pack and
Breaker pack fail closed on the analogous surfaces. No live-ledger
implication exists because no live ledger exists.

**Patch and retest plan:** see `REPAIR_ACCEPTANCE_PLAN.md` R1–R4; repairs
are not implemented by this tribunal.
