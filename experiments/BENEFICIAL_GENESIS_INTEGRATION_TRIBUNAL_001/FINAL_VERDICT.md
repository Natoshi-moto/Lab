# Final verdict — BGEN-INTEGRATION-TRIBUNAL-001

**Frozen subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca`
**Status authority:** NONE
**Provenance:** mixed-model tribunal. Initial analysis (source inventory,
findings ledger, technical/mechanism/process adjudications, repair plan,
strongest cases, decisive next step, independent probes) produced by the
model displayed as **Fable 5**, which stopped on a monthly spend limit.
The model displayed as **Sonnet 5** continued in the same conversation and
worktree, independently re-verified every decisive check (see
`MODEL_HANDOFF_CHANGELOG.md`), found no correction needed, and completed
the remaining required outputs. Provider/account identity across both
phases is self-declared only, not cryptographically proven, and no
independence is claimed between the two phases or between any of the five
audited PRs.

These six verdicts are re-adjudicated from the record now in evidence —
not inherited automatically from either phase.

---

## 1. TECHNICAL_EVIDENCE_STATE — REPAIR_REQUIRED

- **Strongest supporting evidence:** an executable counterexample
  (TRIB-F-001, independently reproduced twice in this tribunal — once by
  each model phase) falsifies the REDTEAM economics package's own
  documented supply invariant on its public surface: pool=100,
  `lottery_share_bps=-1000`, well-formed sole donor → issuance 110,
  `unissued_remainder=-10`. Adjacent scheme-parameter surfaces
  (TRIB-F-002) fail open or fail closed only by accident.
- **Strongest counterevidence:** every committed test suite reproduces
  (design 37, REDTEAM 72, Breaker 25, RETEST_002 19/19, differential
  43/0/0, full lab 185/185 post-`npm ci`); the normative design allocation
  and the Breaker's lottery surface are unaffected and fail closed
  (TRIB-F-001 scope note, T-011/T-012); the defect is confined to one
  economics alternative, not the normative protocol.
- **Unresolved assumptions:** none for this verdict — the counterexample
  is deterministic and was reproduced independently by two separately-run
  model phases in this session plus PR #42's own probe.
- **Confidence:** HIGH.
- **Falsifiers:** the counterexample fails to reproduce on the exact
  frozen commit (it did not); the invariant claim is shown to have always
  been scoped to valid inputs only (it is not — the docstring is
  unqualified).
- **Precise next action:** execute REPAIR_ACCEPTANCE_PLAN R1 (bounded
  scheme-parameter validation + invariant gate) then obtain a fresh
  independent retest of the exact repaired commit before any citation of
  `REPAIRED_PACKAGE_PASS`-style language.

## 2. MECHANISM_RESEARCH_DIRECTION — CONTINUE_WITH_CONDITIONS

- **Strongest supporting evidence:** no executable counterexample to the
  arithmetic core exists anywhere in the record after seven adversarial
  packages (design, REDTEAM, Breaker, RETEST_002, three mechanism/tech
  audits, this tribunal) tried; every alleged unconditional economic
  failure reduces to a conditional or a policy choice (TRIB-F-012,
  TRIB-F-014, TRIB-F-015, TRIB-F-016); all three mechanism-facing audit
  sessions (PR #40, #44, #45) independently arrived at
  CONTINUE_WITH_CONDITIONS from fresh sessions.
- **Strongest counterevidence:** the causal premise for the whole
  program — that a transferable reward induces *additional* charitable
  giving rather than merely redistributing or displacing it — is
  unmodelled and unmeasured everywhere in the record (TRIB-F-010); every
  proven risk (rebate capture, taint laundering, collusion, governance
  capture) scales with success (TRIB-F-016); the record's own only fully
  autonomous full-seat verdict pre-dating this tribunal was
  REJECT_OR_REDESIGN (PR #40's counterevidence disclosure).
- **Unresolved assumptions:** that the attached conditions (S1–S6 in the
  repair plan) are cheap and decisive relative to their information
  value; that continuing analysis work carries negligible cost compared
  to the option value of the discriminating experiments.
- **Confidence:** MODERATE. STOP_CURRENT_DIRECTION is a defensible
  alternative reading of the same record; CONTINUE is chosen because the
  attached conditions are falsifying and cheap, not because the mechanism
  is affirmatively justified — it currently is not.
- **Falsifiers:** the S1 product-function specification shows no design
  serves the required function set within proven constraints; S6-grade
  empirical evidence shows near-zero or adverse induced giving. Either
  fires the record's own stop condition.
- **Precise next action:** S1 (product/ledger function specification with
  an executable acceptance table), the same experiment three separate
  audit sessions converged on.

## 3. TRANSFERABILITY_DEFAULT — NONTRANSFERABLE_OR_DELAYED_DEFAULT

- **Strongest supporting evidence:** every ledger function actually
  specified in the record (receipt binding, charitable transfer binding,
  finite allocation, permissionless claim) is implementable without
  alienable units (TRIB-F-011); two structurally independent mechanism
  models reach this by construction; the non-transferable regime removes
  the float that powers every proven attack pathway (rebate capture,
  taint-title laundering value, collusion, governance migration).
- **Strongest counterevidence:** unspecified future ledger functions
  (payment, fees, staking, security bonding, store of value) are
  untested and might require transferability; refusing transfer forecloses
  secondary-market mechanisms that could matter to an unspecified future
  design.
- **Unresolved assumptions:** that only currently-specified functions
  should be held as requirements; a broader function set has not been
  ruled out, only left unspecified.
- **Confidence:** HIGH within the specified function set; LOW for any
  future unspecified ledger.
- **Falsifiers:** an executable required-function acceptance test that
  only a transferable design passes.
- **Precise next action:** adopt this as the working default now;
  reverse only via S1's acceptance table with an attached falsifier, not
  by prose argument.

## 4. EVIDENCE_FOR_FINAL_MECHANISM_CHOICE — UNDERDETERMINED

- **Strongest supporting evidence:** PR #44's own framing — evidence is
  sufficient for the bounded research decisions taken (continue,
  specify, refuse a transferable default) but not for a final mechanism
  choice or welfare claim, because participation elasticity,
  displacement, rebate-access distribution, token value, and liquidity
  remain unmeasured (TRIB-F-010, TRIB-F-016). PR #45's
  SUFFICIENT_FOR_BOUNDED_DECISION is compatible, not contradictory,
  once read as answering the bounded-decision question rather than the
  final-choice question (TRIB-F-013) — both audits agree the empirical
  variables are open and not required for the bounded decision.
- **Strongest counterevidence:** the arithmetic, structural, and
  countermodel layers are unusually thorough and mutually reproduced
  across three-plus independent implementations — if "final choice" is
  read narrowly as "which of the four already-modeled regimes to run
  research on next," the evidence may already be SUFFICIENT.
- **Unresolved assumptions:** what "final mechanism choice" is taken to
  mean; this verdict adopts the stricter reading (a launchable design
  decision) rather than the narrower bounded-research reading.
- **Confidence:** HIGH that the sign-controlling empirical variables are
  unresolved; MODERATE on which reading of "final choice" governs.
- **Falsifiers:** a preregistered empirical study (S6) that closes
  participation elasticity and flow composition would upgrade this to
  SUFFICIENT for the mechanism choice it was designed to inform.
- **Precise next action:** sequence S6 after S1, as both mechanism audits
  and the repair plan specify — measuring elasticity for an
  unspecified product wastes the measurement.

## 5. REAL_WORLD_READINESS — RESEARCH_ONLY

- **Strongest supporting evidence:** all cryptography and the Bitcoin
  interface are synthetic by explicit design; no real charity, donor,
  key, or transaction exists anywhere in the record; the economic gate
  is explicitly not passed (`ECONOMIC_GATE_PASS: false` throughout);
  every one of the five audited PRs and both tribunal phases independently
  arrive at RESEARCH_ONLY; STATUS.json remains untouched at R016
  throughout this entire tribunal.
- **Strongest counterevidence:** none found in the record.
- **Unresolved assumptions:** none — this category is forced by design
  (`allowed_values: ["RESEARCH_ONLY"]` in multiple receipts) and
  independently supported regardless.
- **Confidence:** HIGH.
- **Falsifiers:** a separately-governed operator promotion completing
  real Bitcoin, real post-quantum, charity ceremony, legal review, and
  economic-gate-pass tracks — none of which are present or attempted
  here.
- **Precise next action:** none from this tribunal; continue Tracks
  B–F per the program roadmap (issue #33) at operator discretion, fully
  outside this tribunal's authority.

## 6. NEXT_PHASE — GO_TO_BOUNDED_REPAIR

- **Strongest supporting evidence:** exactly one confirmed blocker exists
  (TRIB-F-001/002, evidence-package integration only), it is small and
  fully specified (REPAIR_ACCEPTANCE_PLAN R1), and completing it does not
  foreclose or prejudge the larger specification question (S1) — it only
  removes a false claim from the record before the specification round
  builds on it.
- **Strongest counterevidence:** RETURN_TO_SPECIFICATION (S1 directly)
  is arguably more research-decisive than the bounded repair, since S1 is
  what actually discriminates between continuing and stopping the
  program; the repair is comparatively low-stakes.
- **Unresolved assumptions:** that sequencing the mechanical repair
  before the judgment-heavy specification work is worth the delay: this
  tribunal judges it is, because R1 is hours of fully-specified work
  against a program that has already taken years, and specification
  should start from a clean evidence base rather than a known-falsified
  one.
- **Confidence:** MODERATE-HIGH.
- **Falsifiers:** if R1 is shown to be far more involved than scoped (it
  is not, per the acceptance tests already written), or if S1 is judged
  urgent enough that the repair should run in parallel rather than first
  — a defensible operator call.
- **Precise next action:** DECISIVE_NEXT_STEP.md's controlling first
  action stands: execute R1, obtain a fresh independent retest, then
  proceed to S1.

---

## Confirmed findings (this tribunal, both phases)

TRIB-F-001 through TRIB-F-018 in `FINDINGS_LEDGER.md` /
`FINDINGS_LEDGER.json`, all independently reproduced or evidence-graded as
documented per finding; see that ledger for exact dispositions
(CONFIRMED / CONFIRMED_WITH_LIMITS / OVERCLAIMED, no NOT_REPRODUCED or
DISPUTED items in the final set).

## Disputed findings

None remain disputed between the two audited technical seats after
adjudication: PR #42's counterexample controls over PR #43's package pass
(TRIB-F-006, OVERCLAIMED disposition on PR #43's package-wide claim, not a
false finding — its four explicit findings F-001–F-004 are all confirmed).
The Codex/Grok EVIDENCE_STATE difference is resolved as compatible, not
contradictory (TRIB-F-013).

## Ordered repair plan

See `REPAIR_ACCEPTANCE_PLAN.md` / `.json`: R1 → (R2, R3, R4 parallel) →
independent retest → S1 → (S2, S3, S4, S5) → S6.

## Single controlling next action

**Execute REPAIR_ACCEPTANCE_PLAN R1** (bounded scheme-parameter
validation and supply-invariant gate in the REDTEAM economics package),
obtain a fresh independent retest of the exact repaired commit, then
proceed to S1 (product/ledger function specification). Full reasoning in
`DECISIVE_NEXT_STEP.md`.
