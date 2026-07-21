# Findings ledger — BGEN-INTEGRATION-TRIBUNAL-001

Subject: `8349de7a5978be6a9984aa33fd59ba3725ebaaca`. Status authority: NONE.
Machine-readable twin: `FINDINGS_LEDGER.json`. No votes were counted; each
finding stands or falls on its evidence class. "Reproduced by tribunal"
means re-executed or re-derived in this session from the frozen subject,
not rerun of an auditor's committed script.

Blocking key: **EPI** = blocks evidence-package integration; **MRC** =
blocks mechanism research continuation; **RWP** = blocks real-world
progression (all findings inherit the record-wide RESEARCH_ONLY bar, so
RWP is marked only where a finding adds a *new* bar).

---

## TRIB-F-001 — Negative `lottery_share_bps` over-issues the fixed pool

- **Proposition:** `random_lottery_component` in
  `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/allocation.py`
  (lines 166–214) accepts `lottery_share_bps=-1000`; with pool=100 and a
  well-formed sole donor it returns issuance 110 and the scenario layer
  emits `unissued_remainder=-10`, contradicting the module docstring
  ("Allocation is always integer, floor-based and never exceeds `pool`",
  lines 1–14).
- **Originating auditor:** PR #42 (CODEX-TECH-001). Not found by PR #43.
- **Evidence class:** EXECUTABLE_COUNTEREXAMPLE.
- **Reproduced by tribunal:** yes — independently re-implemented (probes
  T-001 function level, T-010 scenario level; both CONFIRMED). Not merely
  a rerun of Codex's `adversarial_probe.py`.
- **Reproduced by another seat:** no (PR #43's probes only used
  `lottery_share_bps` ∈ {1000, 5000, 10000}; verified in its
  `probes/run_probes.py`).
- **Counterevidence:** none. All committed scenario manifests use valid
  values, so committed results remain reproducible (confirmed: 72/72,
  25/25 suites pass).
- **Scope:** economics alternative (REDTEAM package only). The normative
  design allocation (`protocol/allocation.py`) has no bps parameter and
  passed 200 random supply-conservation probes plus negative-pool
  rejection (T-011). The Breaker's lottery surface validates its
  parameters (T-012). **The Beneficial Genesis normative
  allocation/protocol is not reached.**
- **Severity:** HIGH (for the package's documented invariant and the
  unqualified `REPAIRED_PACKAGE_PASS` claim). **Confidence:** HIGH.
- **Disposition:** CONFIRMED.
- **Repair:** validate `lottery_share_bps` (exact int, non-bool,
  0 ≤ v ≤ 10 000) at the public boundary; assert
  `0 ≤ total_issued ≤ pool` before return and before scenario emission.
- **Regression test:** direct + scenario-level tests for −1000, 0, 10 000,
  10 001, `True`, `250.5`, `"10"`; assert `ParticipantValidationError`
  (not `TypeError`) and assert the invariant gate fires.
- **Blocks:** EPI yes (until repaired and freshly retested); MRC no;
  RWP no new bar.

## TRIB-F-002 — Adjacent scheme-parameter surfaces fail open (tribunal-original)

- **Proposition:** the validation gap is not a single missing check; the
  scheme-parameter domain is systematically unvalidated in the REDTEAM
  package: (a) `lottery_share_bps=True` silently accepted as 1 bps
  (T-003) — falsifying PR #43's "bool-as-int rejection … holds"
  non-finding for this surface; (b) values >10 000, floats, and strings
  are rejected only *accidentally* by downstream sub-pool checks or raw
  `TypeError`, not by domain validation (T-002/T-004/T-005); (c)
  `time_weighted` accepts negative `early_bonus_bps`, silently inverting
  its documented early-donor-reward semantics (T-006, supply invariant
  held); (d) inverted epoch bounds (`close < open`) are accepted and
  corrupt the bonus computation (T-007); (e) the `rng` interface is
  unvalidated duck typing — any object with `randrange` fully determines
  lottery winners (T-008). `winners` is the only validated scheme
  parameter (T-009).
- **Originating auditor:** tribunal (Phase 2A adjacent-surface search);
  superset of PR #42's required repair, which already demanded
  boundary validation of "all scheme-specific parameters".
- **Evidence class:** EXECUTABLE_COUNTEREXAMPLE (a, c, d, e);
  STRUCTURAL_RISK (b — fails closed but for the wrong reason).
- **Reproduced by tribunal:** yes (probes T-002…T-009).
  **By another seat:** no.
- **Scope:** economics alternative. **Severity:** MEDIUM.
  **Confidence:** HIGH. **Disposition:** CONFIRMED.
- **Repair:** one shared scheme-parameter validator (exact-int/non-bool
  range checks for every bps/bound parameter; epoch bound ordering;
  explicit rng type or protocol check), same acceptance tests as
  TRIB-F-001 plus semantic tests for `time_weighted` ordering.
- **Blocks:** EPI yes (same repair unit as TRIB-F-001); MRC no; RWP no.

## TRIB-F-003 — Design README evidence counts are stale

- **Proposition:** `experiments/BENEFICIAL_GENESIS_DESIGN_001/README.md`
  states "29 executable invalid vectors, 6 documentary-only scenarios, and
  8 residual risks"; the gate and `EXPECTED.json` yield 34 executable + 1
  documentary + 8 residual. Tribunal census: 36 files in
  `fixtures/invalid/`; 35 in `invalid_expected_codes` (34 executable + 1
  documentary); the 36th (`duplicate_raw_claim.json`) is exercised by a
  separate raw-parser gate check (`verify_evidence.py` lines 142–148) and
  is legitimately outside the catalog count.
- **Originating auditor:** PR #43 (F-001); count implications also touched
  by PR #40/#44 summaries, which report the *gate's* numbers correctly.
- **Evidence class:** DOCUMENTATION_DRIFT.
- **Reproduced by tribunal:** yes (gate run: exit 0,
  `executed=34, documentary=1, residual=8`; file/catalog set-difference
  computed). **By another seat:** yes — PR #42 and PR #44 receipts record
  the same gate output.
- **Scope:** documentation (design reference). **Severity:** MEDIUM
  (evidence-consistency, not correctness). **Confidence:** HIGH.
- **Disposition:** CONFIRMED — drift only; nothing stronger. The gate,
  not the README, is the machine-checked source of truth, and the gate is
  internally consistent.
- **Repair:** update README to 34/1/8 and note the separately-exercised
  raw-parse fixture; or generate the README counts from `EXPECTED.json`.
- **Regression test:** gate check that README counts match EXPECTED.
- **Blocks:** EPI yes (citation hygiene); MRC no; RWP no.

## TRIB-F-004 — Full-repo verification requires an undocumented `npm ci`

- **Proposition:** on a clean tree, `python3 -m unittest discover -s tests`
  fails 9+2 and `./nexus verify` exits nonzero, all at missing
  `@noble/ed25519` imports in R013/R015/R016 Node verifiers; after
  `npm ci` both are green (185/185, verify PASS). The dependency is
  correctly pinned in `package.json`/`package-lock.json`; no root README,
  AGENTS.md, AUDIT_START_HERE.md, or receipt states the prerequisite.
- **Originating auditors:** PR #40 (receipts-omit-prerequisite),
  PR #42 (PASS_AFTER_NPM_CI), PR #43 (F-003), PR #44 (reproduced failure;
  installation not authorized in its session). All four agree on facts.
- **Evidence class:** ENVIRONMENT_PREREQUISITE.
- **Reproduced by tribunal:** yes (before/after runs this session).
- **Scope:** environment + documentation. Not a product defect: the
  lockfile is correct and installation fully resolves it. The failing
  tests are outside the Beneficial Genesis packages.
- **Severity:** MEDIUM. **Confidence:** HIGH. **Disposition:** CONFIRMED
  (environment/documentation defect, not product defect).
- **Repair:** state `npm ci` as a prerequisite in the root README /
  AUDIT_START_HERE and in receipt environment fields.
  Related tribunal observation: `node --test tests/` fails from inside
  `BENEFICIAL_GENESIS_RETEST_002/` while the README-prescribed root-level
  invocation passes 19/19 — prescribed commands should always be given
  with working directory.
- **Blocks:** EPI yes (receipt completeness); MRC no; RWP no.

## TRIB-F-005 — PR #42's handoff label is not aligned to the category vocabulary

- **Proposition:** PR #42 emits a single package decision
  `TECHNICAL_EVIDENCE_HOLD_FOR_REPAIR` (receipt `decision` field) rather
  than the three-category machine vocabulary used by PR #43
  (TECHNICAL_PACKAGE / CLAIM_EVIDENCE / REAL_WORLD_READINESS with
  `allowed_values`). Its task (issue #41) did not prescribe a vocabulary,
  so this is a consistency gap, not a violation. Mapped onto the
  three-category vocabulary its evidence yields: TECHNICAL_PACKAGE =
  REPAIR_REQUIRED (a documented invariant is falsified on the public
  surface even though all committed suites reproduce), CLAIM_EVIDENCE =
  OVERSTATED for the unqualified supply-invariant and
  `REPAIRED_PACKAGE_PASS` claims (bounded axes may stand), and
  REAL_WORLD_READINESS = RESEARCH_ONLY. The handoff label accurately
  conveys the operative consequence (hold + bounded repair + fresh
  retest) and the receipt does separately record
  `economic_gate_pass: false` and mechanism non-adjudication.
- **Evidence class:** PROCESS_PROVENANCE_LIMIT.
- **Reproduced by tribunal:** yes (receipt/report/issue text compared).
- **Severity:** LOW. **Confidence:** HIGH.
- **Disposition:** CONFIRMED_WITH_LIMITS — accurate in substance,
  non-conforming in vocabulary.
- **Repair:** future audit tasks should prescribe the exact verdict
  vocabulary; integration layers (this tribunal) translate.
- **Blocks:** nothing.

## TRIB-F-006 — PR #43's package pass rests on an incomplete search

- **Proposition:** PR #43's TECHNICAL_PACKAGE = PASS_WITH_STATED_LIMITS
  and its non-finding rows "type strictness holds" / "bool-as-int
  rejection design + econ holds" were true only over the searched domain
  (participant lists and a handful of valid scheme parameters). The
  parameter-domain counterexample (TRIB-F-001) and the bool-bps case
  (TRIB-F-002a) fall inside the package's public surface and outside
  PR #43's search. Its own F-004 (SCHEMES registry omits the lottery
  scheme) located the exact unregistered surface where the defect lives,
  but the probe did not push on it.
- **Evidence class:** PROCESS_PROVENANCE_LIMIT (search-scope limit), with
  the falsifying instances under TRIB-F-001/002.
- **Reproduced by tribunal:** yes (read PR #43 probe source; enumerated
  its tested values).
- **Severity:** MEDIUM (for how much weight a "pass" can carry).
  **Confidence:** HIGH.
- **Disposition:** PR #43's package verdict is SUPERSEDED by the
  counterexample; its specific bool-as-int non-finding row is OVERCLAIMED
  as stated (correct for the surfaces it tested, wrong as a package-wide
  claim). Its F-001/F-002/F-003/F-004 findings are all CONFIRMED.
- **Blocks:** nothing by itself; it recalibrates confidence in
  single-seat passes.

## TRIB-F-007 — Rejection-code taxonomy looser than fixture naming

- **Proposition:** several invalid fixtures map to broader codes than
  their names imply (`wrong_output_index`→`AMOUNT_MISMATCH`;
  `nullifier_domain_omission`→`NULLIFIER_INVALID` although
  `NULLIFIER_DOMAIN_OMISSION` exists; `inclusion_after_cutoff`→
  `HEADER_ANCESTRY_INVALID` while a sibling uses `INCLUSION_AFTER_CUTOFF`).
  All still fail closed.
- **Originating auditor:** PR #43 (F-002).
- **Evidence class:** DOCUMENTATION_DRIFT / STRUCTURAL_RISK (labels only).
- **Reproduced by tribunal:** partially — EXPECTED.json mappings
  inspected; per-fixture execution not re-traced beyond the gate run.
- **Severity:** LOW. **Confidence:** HIGH. **Disposition:** CONFIRMED.
- **Repair:** prefer specific codes where defined; test code stability;
  document intentional overloads.
- **Blocks:** nothing.

## TRIB-F-008 — Unregistered lottery scheme in `SCHEMES` registry

- **Proposition:** `SCHEMES` registers five schemes; the lottery is
  public but unregistered and special-cased by the scenario runner
  (needs `rng`). Unregistered special-case surfaces are where the
  validation gap survived review three times (author, Breaker, retest).
- **Originating auditor:** PR #43 (F-004); causal reading is tribunal's.
- **Evidence class:** STRUCTURAL_RISK.
- **Reproduced by tribunal:** yes (source read; scenario.py special-case
  confirmed at lines 195–199).
- **Severity:** LOW. **Confidence:** HIGH. **Disposition:** CONFIRMED.
- **Repair:** registry entry with an explicit rng-factory contract, or a
  documented special-case with the same boundary validation as registered
  schemes.
- **Blocks:** nothing alone; fold into TRIB-F-001 repair unit.

## TRIB-F-009 — The 43/0/0 differential proves fixture-corpus parity only

- **Proposition:** the Node/Python differential verifier agrees 43/0/0 on
  the committed fixture corpus (tribunal rerun: exact match), and the
  RETEST_002 suite passes 19/19 under its prescribed invocation. This
  establishes cross-implementation agreement **on the fixtures**, not
  input-domain completeness (TRIB-F-001 lies outside any fixture corpus)
  and not real-chain semantics (crypto and Bitcoin are synthetic).
- **Evidence class:** REPRODUCED_TEST_RESULT with a stated scope limit.
- **Reproduced by tribunal:** yes. **By other seats:** yes (PR #40 and
  PR #43 re-executed it; PR #42 reran suites).
- **Severity:** INFORMATIONAL. **Confidence:** HIGH.
- **Disposition:** CONFIRMED_WITH_LIMITS.
- **Blocks:** nothing; constrains citation language.

## TRIB-F-010 — Participation elasticity is unmodelled everywhere

- **Proposition:** no artifact in the record models whether the mechanism
  induces *additional* giving versus displacing it; donation volume is
  exogenous in every simulator. This is the sign-controlling variable for
  any welfare claim.
- **Originating auditors:** PR #40 (AUD-MODEL-03, audit-original); then
  PR #44 ("participation, displacement, access, taint, liquidity …
  unmeasured and produce sign reversals") and PR #45
  (`key_unresolved_empirical` includes "participation elasticity" and
  "displaced vs additional giving"), both under declared permanent
  blindness to PR #40 (their source inventories/receipts record no
  sibling-audit access). Rediscovery is therefore evidenced at the
  artifact level; the shared operator task wording is not in the
  repository, so prompt-seeded convergence cannot be fully excluded.
- **Evidence class:** EMPIRICAL_UNKNOWN.
- **Reproduced by tribunal:** yes at the source level — the REDTEAM/
  Breaker/mechanism models all take donor populations as fixed inputs;
  no participation-response module exists anywhere in the subject.
- **Severity:** HIGH for any final mechanism choice; not blocking for
  bounded research. **Confidence:** HIGH. **Disposition:** CONFIRMED.
- **Repair:** not code — a preregistered empirical design (Phase 5 B).
- **Blocks:** EPI no; MRC no (it *shapes* the next step); RWP yes — it is
  the controlling reason EVIDENCE_FOR_FINAL_MECHANISM_CHOICE stays
  UNDERDETERMINED.

## TRIB-F-011 — Transferability necessity is NOT_DEMONSTRATED for specified functions

- **Proposition:** the ledger functions actually specified by the record
  (receipt binding, charitable transfer binding, finite allocation,
  permissionless claim — F1–F4 in PR #45's naming; "donation receipt,
  migration binding, recognition" in PR #44's) are all implementable
  without transferable units; payment/fees/staking/security-bonding/
  store-of-value functions that could require transferability are
  unspecified and untested. Two structurally different independent
  models (PR #44 `independent_model.py`, no subject import; PR #45
  `model/` package) reach this by construction, and PR #40 concurs.
- **Evidence class:** MATHEMATICAL_DEDUCTION (over the specified function
  set) + CONDITIONAL_MODEL_RESULT (for regimes comparison).
- **Reproduced by tribunal:** at the specification level, yes: the design
  pack's verifier/claim objects nowhere require alienability; transfer
  appears only in economics alternatives. Model reruns: no.
- **Severity:** HIGH (it controls the default). **Confidence:** HIGH
  within specified functions; LOW for any unspecified future ledger.
- **Disposition:** CONFIRMED.
- **Falsifier:** an executable required-function acceptance test that
  only a transferable design passes.
- **Blocks:** MRC no — it *redirects*: specification before
  transferability-dependent work.

## TRIB-F-012 — Identity-free anti-concentration mechanisms fail or invert

- **Proposition:** under permissionless (identity-free) participation:
  linear pro-rata is split-invariant (floors weakly penalize splitting);
  concave weighting (sqrt/log) strictly rewards Sybil splitting; fixed
  per-identity caps are evaded by splitting; cap-then-renormalize is not
  a hard cap (a holder can end above the nominal cap, in the limit at
  100%). Verified in subject packages (REDTEAM/Breaker results), and
  independently re-derived by both mechanism audits (Grok
  `cap_sybil_evasion`: whale 1e8 → 9e8 via Sybils; Codex C3/C4).
- **Evidence class:** MATHEMATICAL_DEDUCTION + EXECUTABLE results.
- **Reproduced by tribunal:** not rerun; the deduction is elementary and
  three independent implementations agree with committed numbers.
- **Severity:** HIGH for any fairness claim. **Confidence:** HIGH.
- **Disposition:** CONFIRMED. **Falsifier:** an enforceable permissionless
  actor boundary (none known without identity).
- **Blocks:** MRC no; it forbids advertising concave/cap schemes as
  Sybil-resistant fairness without identity.

## TRIB-F-013 — The EVIDENCE_STATE "disagreement" is compatible, not contradictory

- **Proposition:** PR #44's UNDERDETERMINED answers "is the evidence
  sufficient for a *final mechanism choice* / welfare claim?" (its next
  action: obtain empirical data after product scope is fixed). PR #45's
  SUFFICIENT_FOR_BOUNDED_DECISION answers "is the evidence sufficient for
  the *bounded research decision* — specify product functions, refuse a
  transferable default, continue?" (its stated assumption: "Bounded
  decision is research disposition not launch"; its counterevidence row
  concedes "empirical alpha/v/participation open (not required for
  bounded research decision)"). Each seat, read on the other's question,
  agrees with the other's answer.
- **Evidence class:** MATHEMATICAL_DEDUCTION over the verdict objects.
- **Reproduced by tribunal:** yes (exact verdict JSON texts compared).
- **Severity:** INFORMATIONAL. **Confidence:** HIGH.
- **Disposition:** CONFIRMED — compatible; recorded verdicts: evidence is
  SUFFICIENT for the bounded decisions and UNDERDETERMINED for the final
  mechanism choice.
- **Blocks:** nothing.

## TRIB-F-014 — Sole-donor undersubscription and oversubscription boundaries

- **Proposition:** under the normative floor pro-rata rule a sole donor
  contributing the minimum positive amount (1 sat) receives the entire
  fixed pool (tribunal T-013: confirmed in both the REDTEAM model and the
  design pack, 10^9 units for 1 sat); in extreme oversubscription,
  1-sat donors floor to zero while supply conservation holds (T-014).
  Fixed-pool issuance therefore has unbounded per-unit payout at the
  undersubscribed extreme — a speculative-coordination and optics
  pathway (both mechanism audits) — and dust exclusion at the other.
- **Evidence class:** MATHEMATICAL_DEDUCTION + EXECUTABLE (tribunal
  probes). **Reproduced by tribunal:** yes. **By other seats:** yes
  (PR #45 `under_over`, PR #44 narrative).
- **Severity:** MEDIUM (design consequence, not a bug — the rule does
  what it says). **Confidence:** HIGH.
- **Disposition:** CONFIRMED — structural property, POLICY_CHOICE on
  whether to add floors/minimums or flow-linked issuance.
- **Blocks:** MRC no; must be resolved in specification (fixed-pool vs
  flow-linked, minimum participation).

## TRIB-F-015 — Governance coupling and post-transfer durability

- **Proposition:** attaching majority governance to raw allocation is
  unsafe under every examined weighting (proportional top-share 4/5;
  capped one-identity 1/2; capped with Sybils 9/10 — PR #45
  `governance`); coalition splitting increases power; and any
  governance-from-allocation guarantee degrades after transfer because
  holdings migrate (transferable float). Both mechanism audits condition
  continuation on separating governance from allocation or adding durable
  constraints; no seat modeled governance durability empirically.
- **Evidence class:** CONDITIONAL_MODEL_RESULT + STRUCTURAL_RISK.
- **Reproduced by tribunal:** not rerun; numbers consistent across
  independent implementations.
- **Severity:** HIGH if governance were coupled; currently a
  POLICY_CHOICE explicitly deferred. **Confidence:** HIGH for the
  modeled results. **Disposition:** CONFIRMED_WITH_LIMITS.
- **Blocks:** MRC no; specification must state the governance separation.

## TRIB-F-016 — Combined attacks and conditional-profit pathways

- **Proposition:** rebate capture, tainted-flow laundering, and whale
  collusion are *pathway-existent* and *conditionally profitable* —
  profitability flips sign with assumed token value, rebate access, and
  retention (PR #45 `collusion_conditional`: unprofitable at v∈{0,1/100},
  profitable at v∈{1/10,1}; `tainted`: 26/60 grid rows profitable;
  PR #44 C7 "sign reverses with access/cost/value"). Incidence,
  magnitude, and inevitability are NOT established in either direction;
  combined (multi-variable) attacks were modeled by the mechanism seats
  only in limited grids.
- **Evidence class:** CONDITIONAL_MODEL_RESULT + EMPIRICAL_UNKNOWN.
- **Reproduced by tribunal:** not rerun; grids read from committed
  results. **Severity:** HIGH at scale (risk scales with success).
  **Confidence:** HIGH that the pathways exist; UNRESOLVED on magnitude.
- **Disposition:** CONFIRMED_WITH_LIMITS.
- **Blocks:** RWP yes (already covered by RESEARCH_ONLY); shapes the
  empirical research design.

## TRIB-F-017 — Controlling adjudications lack receipts; disposition pre-prescribed

- **Proposition:** per PR #40's process audit (verified against the
  record's structure, not independently re-derived from transcripts): the
  two controlling review adjudications carry no receipt, seat identity,
  freeze, or method statement; the repair contract prescribed
  `CONTINUE_WITH_CONDITIONS`/gate-false before repair and retest
  (AUD-PROC-04); the Breaker consumed the review defect catalogue before
  its verdict (AUD-PROC-01). Consequence: the record's pre-audit
  disposition is operator-mediated and evidence-supported, not
  independently converged. The five audit PRs adjudicated here partially
  remedy this: PR #40/#44/#45 each *arrived* at CONTINUE_WITH_CONDITIONS
  from fresh sessions under declared blindness.
- **Evidence class:** PROCESS_PROVENANCE_LIMIT.
- **Reproduced by tribunal:** structurally yes (absence of receipts for
  adjudications is checkable; PR #40's timing claims not re-derived).
- **Severity:** MEDIUM. **Confidence:** HIGH for the structural facts.
- **Disposition:** CONFIRMED_WITH_LIMITS.
- **Blocks:** EPI no; it constrains what the record may be cited as.

## TRIB-F-018 — Provider/model independence is declared, not evidenced

- **Proposition:** every audit action in the record was performed by one
  GitHub account (`Nexus Bootstrap`); provider/model identities
  ("Codex", "Grok", "Fable") exist as branch names and self-declared
  receipt strings only. Distinct code styles and divergent findings
  (e.g., PR #42 finding what PR #43 missed) are weak evidence of distinct
  generating processes; they prove nothing about provider identity or
  organizational independence. The record must not be described as
  "five independent AIs agreed".
- **Evidence class:** PROCESS_PROVENANCE_LIMIT.
- **Reproduced by tribunal:** yes (git author fields, receipt strings,
  absence of any cryptographic or platform attestation).
- **Severity:** MEDIUM. **Confidence:** HIGH.
- **Disposition:** CONFIRMED.
- **Repair:** if independence claims matter later, use per-seat signed
  attestations or separately controlled accounts; until then, cite as
  "five separately-run audit sessions with self-declared seat labels".
- **Blocks:** any claim that relies on cross-family independence.
