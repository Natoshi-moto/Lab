# Repair acceptance plan — BGEN-INTEGRATION-TRIBUNAL-001

No repair is implemented by this tribunal. Historical artifacts remain
immutable and are **superseded, never rewritten**: every repair below lands
in a new commit/package revision with its own receipt; prior results stay
in place as the record of what was true at their commit.

## A. Immediate evidence-hygiene repairs

### R1 — Scheme-parameter validation and supply-invariant gate (TRIB-F-001/002/008)

- **Target:** `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/allocation.py`
  (all scheme parameters: `lottery_share_bps`, `early_bonus_bps`,
  `epoch_open_block`/`epoch_close_block` ordering, `scale`, rng contract),
  `model/scenario.py` (invariant gate before result emission), `SCHEMES`
  registry or documented special-case.
- **Prohibited scope creep:** no change to any scheme's arithmetic on valid
  inputs; no change to committed scenario manifests or results; no touch of
  the design pack, Breaker pack, or RETEST packages; no new schemes.
- **Acceptance tests:** for each parameter: −1000, 0, boundary, boundary+1,
  `True`/`False`, float, string → `ParticipantValidationError` (never raw
  `TypeError`, never silent acceptance); scenario runner refuses any
  manifest whose emitted `total_issued` would leave `[0, pool]` (regression:
  the T-010 manifest); `time_weighted` ordering test (early ≥ late at equal
  weights when `early_bonus_bps > 0`); all 72 existing tests still pass;
  27 committed scenarios regenerate byte-identically.
- **Independent retest:** required, fresh different-session seat, exact
  repaired commit bound in receipt (pattern of PR #39).
- **Changes prior results?** No committed result changes; the *claims*
  change: the retest verdict must scope `REPAIRED_PACKAGE_PASS`-style
  language to tested input domains.

### R2 — Design README evidence counts (TRIB-F-003)

- **Target:** `experiments/BENEFICIAL_GENESIS_DESIGN_001/README.md`
  evidence-count paragraph only: 34 executable / 1 documentary / 8
  residual, plus one sentence noting `duplicate_raw_claim.json` is
  exercised by the separate raw-parser gate check.
- **Prohibited scope creep:** no fixture, EXPECTED.json, or gate changes.
- **Acceptance test:** a gate assertion that README counts equal
  EXPECTED.json-derived counts (making the drift class impossible), or at
  minimum a grep-based check in `verify_evidence.py`.
- **Independent retest:** gate rerun suffices; no fresh seat needed.
- **Changes prior results?** No.

### R3 — Environment prerequisite documentation (TRIB-F-004)

- **Target:** root `README.md`/`AUDIT_START_HERE.md` (one "prerequisites:
  `npm ci`" section); receipt schema/template gains an
  `environment_prerequisites` field; RETEST_002 README already prescribes
  the correct cwd — add cwd notes wherever commands are prescribed
  elsewhere.
- **Prohibited scope creep:** no dependency version changes; no vendoring
  decision inside this repair (that is a separate proposal if wanted).
- **Acceptance test:** clean-clone script: `npm ci && python3 -m unittest
  discover -s tests && ./nexus verify` exits 0; fresh-clone-without-npm-ci
  failure signature documented verbatim.
- **Independent retest:** optional; any seat's next clean-clone receipt
  demonstrates it.
- **Changes prior results?** No.

### R4 — Rejection-code specificity (TRIB-F-007)

- **Target:** `fixtures/EXPECTED.json` mappings and/or
  `protocol/verifier.py` code selection for `wrong_output_index`,
  `nullifier_domain_omission`, `inclusion_after_cutoff`; document any
  intentional overload in `schemas/rejection_codes.json`.
- **Prohibited scope creep:** no new rejection codes without a schema
  entry; no fixture semantics changes.
- **Acceptance test:** per-fixture expected-code stability tests; gate
  still PASS with updated expectations.
- **Independent retest:** gate rerun suffices.
- **Changes prior results?** EXPECTED.json bytes change ⇒ new fixture
  freeze hash; supersede, do not rewrite, the old EXPECTED.

### R5 — Verdict-vocabulary and receipt-field conventions (TRIB-F-005/017/018)

- **Target:** future audit task templates (operations-level doc): prescribe
  the exact verdict vocabulary, require receipts for controlling
  adjudications, require `environment_prerequisites` and working-directory
  fields, and (if independence claims are wanted) per-seat attestations.
- **Prohibited scope creep:** do not retro-edit any existing audit package.
- **Acceptance test:** next audit round's receipts validate against the
  template.

## B. Mechanism-specification work (research, not code repair)

### S1 — Product/ledger function specification (controlling item)

Enumerate required vs optional functions (payment, fees, staking, security
bonding, governance, bootstrap ownership, recognition, store of value,
other) with an executable acceptance test per required function.
Prohibited: treating any unspecified function as required by implication.
Acceptance: the table exists, each required function has a test, and each
candidate regime (transferable / delayed / non-transferable / no-token) is
scored against it. This is PR #44's DECISIVE_NEXT_EXPERIMENT, PR #45's
BGEN-PRODUCT-FUNCTION-AND-TRANSFER-REGIME-LOCK-001, and PR #40's
BGEN-LEDGER-FUNCTION-SPEC-001 — the same experiment three times.

### S2 — Transfer-regime default

Adopt non-transferable-or-delayed as the working default pending S1;
reversal requires a required function that only transferable allocation
passes (executable falsifier, not prose).

### S3 — Fixed-pool vs flow-linked issuance decision

Resolve the sole-donor full-capture and dust-floor boundaries
(TRIB-F-014) as explicit policy: minimum-participation threshold, reserve
fraction, or flow-linked issuance. Must be decided in specification, not
discovered at launch.

### S4 — Identity stance

State it: either identity exists (then caps/concavity become meaningful
and need an identity mechanism) or it does not (then linear pro-rata is
the only non-Sybil-rewarding scheme in the record and concentration is
accepted and disclosed). TRIB-F-012 makes "identity-free fairness
weighting" unavailable.

### S5 — Governance separation

Specify that governance is not derived from raw allocation, or specify the
durable constraints that survive transfer (TRIB-F-015).

### S6 — Empirical participation/flow-composition research design

Preregistered design for participation elasticity, additional-vs-displaced
giving, and donor composition (TRIB-F-010/016). No synthetic substitute is
accepted. This gates any EVIDENCE_FOR_FINAL_MECHANISM_CHOICE upgrade, and
is deliberately sequenced **after** S1 so the measured quantity matches the
specified product.

## Ordering

R1 → (R2, R3, R4 in any order, parallel) → independent retest of the
repaired economics package → S1 → S2/S3/S4/S5 (decisions recorded in the
spec) → S6. R5 applies to whatever audit round comes next.
