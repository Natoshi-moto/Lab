# Claim ledger — Beneficial Genesis research record

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca` · **Authority:** none

Machine-readable version: `CLAIM_LEDGER.json`. Confidence is claim-specific;
no package-wide confidence exists. Dispositions: SUPPORTED /
SUPPORTED_WITH_LIMITS / UNDERDETERMINED / OVERCLAIMED / CONTRADICTED /
NOT_AUDITABLE_FROM_AVAILABLE_EVIDENCE.

## C-01 — SUPPORTED (HIGH)

**Claim:** Total genesis issuance never exceeds the fixed pool; issued + unissued remainder == pool (floor-sum inequality).

**Class:** MATHEMATICAL_DEDUCTION + EXECUTABLE_PROPERTY  
**Source:** DESIGN_001 TECHNICAL_DESIGN.md §6; protocol/allocation.py

**Supporting:** Standard floor-sum inequality; assert_supply_invariant recomputes every floor; audit repro R1 (2000 exact-integer randomized trials, 0 violations); tamper probes rejected.

**Opposing/limiting:** None found.

**Assumptions:** Exact integer arithmetic; the deployed implementation matches this reference (only the synthetic reference exists).

**Tests test or encode?** Genuinely tested: the validator recomputes floors from inputs and the audit's independent code re-derives them; tampered records are rejected.

**Holds under:** All integer inputs within validated ranges.  
**Weakens/reverses under:** Only under a divergent reimplementation (the stated Breaker-seat risk); no countermodel exists in-scope.

## C-02 — SUPPORTED_WITH_LIMITS (HIGH)

**Claim:** The synthetic claim verifier is fail-closed: all 34 executable invalid vectors reject with catalogued codes and valid vectors admit.

**Class:** EXECUTABLE_PROPERTY  
**Source:** DESIGN_001 verify_evidence.py; fixtures/EXPECTED.json

**Supporting:** Evidence gate re-run at subject: PASS, 34 executable invalid cases, byte-stable fixture regeneration; 37 unit tests pass.

**Opposing/limiting:** Vectors and verifier share an author; coverage is bounded by the authored fixture set; crypto is explicitly synthetic stand-ins (HMAC), not Bitcoin or PQ.

**Assumptions:** The synthetic model's semantics are the intended spec; fixture catalogue approximates the attack surface.

**Tests test or encode?** Partially self-referential: fixtures were authored by the design seat; the 43-vector second-implementation differential (C-03) mitigates but both consume the same fixture corpus.

**Holds under:** The synthetic model as specified.  
**Weakens/reverses under:** Real Bitcoin script/sighash/SegWit/Taproot semantics, real PQ signatures, real reorg behavior — all explicitly out of scope (Tracks B/C).

## C-03 — SUPPORTED_WITH_LIMITS (HIGH)

**Claim:** An independent second implementation (JS) agrees with the Python reference on all committed fixtures: 43 agreements, 0 disagreements, 0 crashes.

**Class:** EXECUTABLE_PROPERTY  
**Source:** issue #33; experiments/BENEFICIAL_GENESIS_RETEST_002; DIFF_RETEST_002 audit

**Supporting:** Re-executed by this audit: node verify.mjs → {agreements:43, disagreements:0, crashes:0}.

**Opposing/limiting:** Agreement is over the shared authored fixture corpus, not over adversarially generated inputs; shared blind spots possible.

**Assumptions:** Fixture corpus is representative.

**Tests test or encode?** Genuinely tested (cross-implementation), but corpus-bounded.

**Holds under:** The committed 43-vector corpus.  
**Weakens/reverses under:** Inputs outside the corpus; differing raw-parser behaviors not exercised by the corpus.

## C-04 — SUPPORTED (HIGH)

**Claim:** Linear pro-rata allocation is split-mass invariant up to integer-floor residue: address-splitting yields no material gain.

**Class:** MATHEMATICAL_DEDUCTION  
**Source:** ECON_REDTEAM FAILURE_CONDITIONS.md preserved finding 1; scenario 06; Breaker DIFFERENTIAL_REVIEW §2

**Supporting:** floor(P*Σwᵢ/T) vs Σfloor(P*wᵢ/T) differ only by floor residue; audit repro reproduced scenario 06 exactly (gain = -53/25,000,000 for a 400-way split) from fresh code.

**Opposing/limiting:** None.

**Assumptions:** Linear weighting; splitting preserves total contributed mass.

**Tests test or encode?** Genuinely tested; audit re-derived independently.

**Holds under:** Any population, any split count.  
**Weakens/reverses under:** Does not hold for any strictly concave or capped weighting (that is C-05).

## C-05 — SUPPORTED (HIGH)

**Claim:** Concave (sqrt/log) and per-identity-capped allocation rules are severely Sybil-exploitable absent an identity layer (e.g. +40.6pp for sqrt/400-way; +70.5pp for 10%-cap/20-way), so no tested allocation formula both resists whales and resists splitting in a permissionless setting.

**Class:** MATHEMATICAL_DEDUCTION  
**Source:** ECON_REDTEAM MECHANISM_NECESSITY.md §4, FC6; scenarios 05/26; Breaker agreement matrix

**Supporting:** Concavity implies Σf(w/k)·k > f(w); audit repro reproduced both scenario numbers exactly with fresh code; Grok derived the same direction on different populations.

**Opposing/limiting:** Magnitudes are population-specific; the deduction gives direction and mechanism, scenarios give magnitude only for their populations.

**Assumptions:** Identity creation is free and unlinkable (true of Bitcoin addresses); attacker splits optimally.

**Tests test or encode?** Genuinely tested; also proven by pure-math helpers on both sides.

**Holds under:** Any strictly concave weighting or binding per-identity cap without identity verification.  
**Weakens/reverses under:** An effective identity/Sybil-resistance layer (which the design explicitly does not have and which would contradict its permissionless framing).

## C-06 — SUPPORTED (HIGH)

**Claim:** Linear pro-rata preserves contribution concentration one-for-one: an honest whale contributing X% of eligible sats receives ~X% of issued units, up to floors.

**Class:** MATHEMATICAL_DEDUCTION  
**Source:** ECON_REDTEAM scenarios 01-03; preserved finding 1

**Supporting:** Immediate from the allocation identity; scenario 03 (99% whale → 99.000% share) consistent; audit's exact reproductions confirm the identity.

**Opposing/limiting:** None on the math. On interpretation: whether X% concentration is 'unacceptable' is a policy judgment.

**Assumptions:** None beyond linearity.

**Tests test or encode?** Genuinely tested.

**Holds under:** Always, by construction.  
**Weakens/reverses under:** n/a.

## C-07 — SUPPORTED (HIGH)

**Claim:** The fixed pool issues in full regardless of subscription level: a single 1,000-sat donor alone in an epoch receives the entire pool; the denominator is realized total, not a target.

**Class:** EXECUTABLE_PROPERTY + MATHEMATICAL_DEDUCTION  
**Source:** ECON_REDTEAM MECHANISM_NECESSITY.md §2; scenarios 19/20; Breaker 19 (top1_issued=1.0)

**Supporting:** floor(P·T/T)=P for any T>0; audit repro R3 confirms full issuance at T=1 and T=10^15, zero at T=0, and dust-donor floor-to-zero.

**Opposing/limiting:** This is a property of the specified rule, not an inevitability — a minimum-subscription floor or flow-scaled pool would change it; neither is specified.

**Assumptions:** The design pack's stated allocation rule.

**Tests test or encode?** Genuinely tested.

**Holds under:** The specified UNISSUED_FLOOR_REMAINDER rule.  
**Weakens/reverses under:** Any redesign adding an issuance floor/scaling — flagged as open redesign space, not modelled.

## C-08 — SUPPORTED (HIGH)

**Claim:** Conditional rebate arithmetic: given a colluding arrangement at rate r with zero friction, charity retention falls by exactly r·donation and donor net cost falls to (1-r)·donation, for all r in [0,1].

**Class:** MATHEMATICAL_DEDUCTION  
**Source:** ECON_REDTEAM FC2 part 1; model/collusion.py; Breaker rebate.py

**Supporting:** An arithmetic identity; audit repro verified all integer rates 0-100%.

**Opposing/limiting:** It is nearly tautological — its epistemic content is the *framing* (the protocol cannot see or prevent it), which is supported by the design's own residual-risk list.

**Assumptions:** An arrangement exists (the entire question of incidence is assumed away at this level).

**Tests test or encode?** Tests encode the identity (unavoidable for an identity); the meaningful test is the friction decomposition (C-09).

**Holds under:** By definition of the arrangement.  
**Weakens/reverses under:** n/a.

## C-09 — SUPPORTED_WITH_LIMITS (MODERATE)

**Claim:** Expected (friction-adjusted) rebate incidence collapses far below the conditional figure when access to a colluding genesis charity is rare/costly (e.g. 100,000 vs 2,500,000 sats at 5% access × 80% enforcement).

**Class:** MODEL_CONDITIONAL_RESULT  
**Source:** ECON_REDTEAM scenario 27; FC2 part 2; Breaker scenario 28

**Supporting:** Audit repro reproduced the exact figures; the qualitative point (expected ≪ conditional under low access) is robust across any access probability ≪ 1.

**Opposing/limiting:** The 5%/80%/30% parameters are invented; nothing anchors real access probability to a genesis charity set that does not exist yet; FATF literature confirms charity-abuse is a real risk class but supplies no rate.

**Assumptions:** Multiplicative independence of access/enforcement/detection; parameter ranges span reality.

**Tests test or encode?** Genuinely tested as arithmetic; parameters are assumptions, correctly labelled as such post-repair.

**Holds under:** Any parameterization with small access probability.  
**Weakens/reverses under:** If the genesis set were large, permissively curated, or contained even one attacker-friendly charity at scale, effective access → 1 for informed donors and the conditional figure re-emerges. Charity-set curation is the real control variable and is unmodelled (Track D).

## C-10 — OVERCLAIMED (HIGH (that it was an overclaim))

**Claim:** ORIGINAL (retracted): 'rational profit-seeking donor behavior is predicted — not merely possible — to erode aggregate charity benefit.'

**Class:** EMPIRICAL_HYPOTHESIS (was presented as a prediction)  
**Source:** pre-repair FAILURE_CONDITIONS.md at b588779 (git show)

**Supporting:** n/a — the claim was withdrawn.

**Opposing/limiting:** No behavioral, access, or enforcement model backed the prediction; controlling review REV-002 and Breaker concurred; repair retracted it.

**Assumptions:** —

**Tests test or encode?** Pre-repair tests asserted the assumption (verified: the zero-cost test asserted '0' as expected value).

**Holds under:** —  
**Weakens/reverses under:** —

## C-11 — SUPPORTED (HIGH)

**Claim:** The stolen/tainted-fund migration pathway exists: the verifier proves cryptographic control, not legal ownership, so stolen-key donations admit valid claims.

**Class:** EXECUTABLE_PROPERTY (of the spec) + structural deduction  
**Source:** DESIGN_001 THREAT_MODEL residual 2; fixture claim_stolen_source_key_crypto_ok; ECON FC4 pathway component

**Supporting:** The design pack's own fixture demonstrates a crypto-valid stolen-key claim; no ownership oracle exists or is proposed.

**Opposing/limiting:** None. Magnitude of resulting real-world flow is a separate empirical question (C-12).

**Assumptions:** None.

**Tests test or encode?** Genuinely demonstrated by an executable fixture.

**Holds under:** Any deployment without identity/provenance screening.  
**Weakens/reverses under:** Only by adding out-of-protocol screening (policy layer).

## C-12 — SUPPORTED_WITH_LIMITS (MODERATE)

**Claim:** Net profitability of migrating stolen funds is assumption-conditional: the sensitivity grid contains both profitable and unprofitable cells depending on token value and forgone alternative-realization value; the original 'zero-cost fully profitable laundering' claim was wrong.

**Class:** MODEL_CONDITIONAL_RESULT  
**Source:** ECON_REDTEAM model/tainted_funds.py; scenario 10 grid; REV-001; Breaker laundering.py

**Supporting:** Audit repro reproduced the default cell and the full grid exactly and confirmed sign flips; external anchor: documented laundering discounts (e.g. Coincheck hackers offering stolen NEM at 15% below market) support alternative_realization < 1 and haircut > 0 as directionally real.

**Opposing/limiting:** All probability/haircut parameters are illustrative; the grid's 'token_value_per_unit' column silently switches semantics from the headline cell (audit finding AUD-SEM-01: multiplier used as absolute unit value in the grid vs anchor×multiplier in the headline).

**Assumptions:** Attacker rationality; the decomposition's independence structure; parameter ranges bracket reality.

**Tests test or encode?** Post-repair tests test decomposition and boundaries; the audit independently re-derived every cell.

**Holds under:** Within the swept grid.  
**Weakens/reverses under:** Outside the grid (e.g. token value ≫ 1.5× or alternative realization ≈ 0, where migration becomes clearly profitable — i.e. the *more successful the new ledger, the stronger the laundering incentive*; stated nowhere this crisply in the record).

## C-13 — SUPPORTED (HIGH)

**Claim:** Governance capture by donation size alone occurs if and only if a proportional/token-weighted integration rule is adopted; the allocation mechanism itself fixes no governance rule (52.49% majority for the scenario-13 whale under token_weighted; 1/501 under equal; 0 under none).

**Class:** MATHEMATICAL_DEDUCTION (conditional structure) + EXECUTABLE_PROPERTY  
**Source:** ECON_REDTEAM FC3; model/governance.py; scenario 13; REV-003

**Supporting:** Audit repro reproduced all scenario-13 numbers exactly (whale share 13121911/24999936 > 1/2).

**Opposing/limiting:** The design pack indeed specifies no governance mapping — but by the same token nothing prevents a future integration from defaulting to token-weighted; conditionality cuts both ways.

**Assumptions:** The eventual ledger honors whatever rule is declared (Track E enforcement is open).

**Tests test or encode?** Genuinely tested.

**Holds under:** Each named rule, at genesis snapshot time.  
**Weakens/reverses under:** Durability after transfer/lockup-expiry is unmodelled; a 'none' rule can be undone by later governance decisions of the ledger.

## C-14 — SUPPORTED (HIGH)

**Claim:** cap_then_renormalize reduced the tested whale's final governance share (~9.77% at a 500bps nominal clip) but is not a hard per-holder cap: renormalization can push final shares above the nominal clip (degenerate: a lone holder ends at 100% under any clip).

**Class:** MATHEMATICAL_DEDUCTION + EXECUTABLE_PROPERTY  
**Source:** ECON_REDTEAM model/governance.py; scenario 14; micro-repair; RETEST_003 V-002

**Supporting:** Audit repro matched the committed whale weight exactly (99999749/1023769849 ≈ 9.768%) and independently constructed 1- and 2-holder counterexamples (100% and 50%/50% under a 5% clip).

**Opposing/limiting:** None on the math; on usefulness, the reduction is scenario-specific and the rule's durability past genesis is open Track E work — correctly disclosed post-repair.

**Assumptions:** Snapshot-time computation.

**Tests test or encode?** Genuinely tested at 1/2/3 holders post-repair.

**Holds under:** Many-holder populations where unclipped mass is large.  
**Weakens/reverses under:** Few-holder or heavily-clipped populations where renormalization dominates (disclosed).

## C-15 — SUPPORTED_WITH_LIMITS (MODERATE)

**Claim:** Transferability is not necessary for the charity-receipt and migration-claim-binding functions the design pack specifies; its necessity for payment/staking/fee/bootstrap functions of an unspecified future ledger is open.

**Class:** POLICY_CHOICE informed by analysis  
**Source:** ECON_REDTEAM MECHANISM_NECESSITY.md (repaired); REV-004; Breaker concurrence

**Supporting:** The receipt/claim functions demonstrably complete without transfer (a claim right suffices); the target-function matrix makes the open remainder explicit.

**Opposing/limiting:** 'Necessity' is not a theorem over unspecified requirements; the conclusion is a scoping statement, not an empirical result.

**Assumptions:** The design pack's stated v1 scope is the correct baseline.

**Tests test or encode?** Not a testable claim; correctly reclassified as open after repair.

**Holds under:** The specified v1 functions.  
**Weakens/reverses under:** Any program decision that adds ledger functions requiring a transferable unit.

## C-16 — UNDERDETERMINED (LOW)

**Claim:** FC7 ('social benefit is dominated by a simpler non-token mechanism') — partially triggered for specified functions per the packages.

**Class:** MODEL_CONDITIONAL_RESULT presented; actually UNDERDETERMINED  
**Source:** ECON_REDTEAM FC7; ALTERNATIVES_COMPARISON.md; scenario 21

**Supporting:** For fixed donation volume, a non-transferable receipt preserves the specified functions while removing the monetization surfaces — that comparison is fair as far as it goes.

**Opposing/limiting:** AUDIT FINDING (AUD-MODEL-03): every alternative comparison holds donation volume constant across mechanisms, assuming away participation elasticity — but inducing donations is the mechanism's entire purpose. A transferable reward could raise donation volume (favoring the design) or attract only mercenary/tainted flow (opposing it). No package models this, no reviewer flagged it, and no synthetic model can resolve it. The dominance question is therefore empirically open in both directions.

**Assumptions:** Donation volume invariant across compared mechanisms (implicit, unstated, load-bearing).

**Tests test or encode?** Simulations correctly compute what they model; the missing variable is outside all of them.

**Holds under:** Fixed participation.  
**Weakens/reverses under:** Any nonzero participation elasticity in either direction.

## C-17 — SUPPORTED_WITH_LIMITS (MODERATE)

**Claim:** Denominator/timing exposure: late actors with denominator visibility hold an informational advantage; a late surge dilutes early donors (4.802% → 0.828% in scenario 09); marginal allocation rate itself is timing-neutral under pro-rata; sealed precommitment is a candidate mitigation (Track B feasibility open).

**Class:** MODEL_CONDITIONAL_RESULT + structural deduction  
**Source:** ECON_REDTEAM FC5; scenario 09

**Supporting:** Dilution arithmetic is exact; the information asymmetry follows from the fixed-pool structure; Counterparty's 1-month burn (2014) is a real precedent of participants committing under denominator uncertainty.

**Opposing/limiting:** Magnitude is scenario-specific; whether ex-ante uncertainty is 'unacceptable' is policy.

**Assumptions:** Participants care about final share, not just marginal rate.

**Tests test or encode?** Genuinely tested for the dilution arithmetic.

**Holds under:** Fixed-pool, open-observation epochs.  
**Weakens/reverses under:** Sealed/precommitted designs (feasibility on real Bitcoin untested).

## C-18 — SUPPORTED_WITH_LIMITS (MODERATE (as a reasonable reading) / LOW (as an independent multi-seat conclusion))

**Claim:** Final disposition: UNDERLYING_MECHANISM: CONTINUE_WITH_CONDITIONS; ECONOMIC_GATE_PASS: false.

**Class:** POLICY_CHOICE  
**Source:** PR #35 body; FAILURE_CONDITIONS.md aggregate; Breaker DECISION.json; RETEST_003 DECISION

**Supporting:** Consistent with the evidence in the narrow sense: nothing proves the concept incoherent, and the gate correctly did not pass.

**Opposing/limiting:** PROCESS FINDING (AUD-PROC-04): the controlling repair contract *prescribed* this exact disposition before the repair and retest were performed ('Required final disposition: ... CONTINUE_WITH_CONDITIONS ... ECONOMIC_GATE_PASS: false'), and the retest 'preserved (not escalated)' it. The original analysis had concluded REJECT_OR_REDESIGN; its stated reasons were genuinely overclaimed (C-10, C-12), but the replacement verdict was directed by the operator-account reviewer, not independently re-derived. A defensible alternative reading of the same post-repair evidence is 'UNDERDETERMINED pending ledger-function specification and Track D design' — which is close to what CONTINUE_WITH_CONDITIONS means operationally, but the record should not be cited as three seats independently converging on it.

**Assumptions:** That the seven conditions attached to continuation are actually enforced by later gates.

**Tests test or encode?** Not testable; it is a decision.

**Holds under:** —  
**Weakens/reverses under:** —

## C-19 — SUPPORTED_WITH_LIMITS (MODERATE)

**Claim:** The Grok Breaker seat independently confirmed REV-001…006 and re-derived the six narrower findings.

**Class:** PROCESS claim  
**Source:** PR #37; DIFFERENTIAL_REVIEW.md; DECISION.json

**Supporting:** File-content clean room verified (all 72 freeze hashes correct; audit-verified); the code-level defect confirmations (lottery replacement, missing renorm, cost=0) are objectively checkable and this audit re-verified each against b588779; the six findings were re-computed on different populations.

**Opposing/limiting:** The Breaker read REV-001…007 and the controlling gate disposition before freezing (its own disclosure + issue #36's instruction), so confirmation was directed, not blind; the pre-differential mechanism verdict matched the already-read controlling review's direction; provider identity is self-declared (C-20 context).

**Assumptions:** That reading a detailed defect list does not predetermine 'confirmation' of code-checkable facts (defensible for objective code facts; not for judgment calls like REV-004's scope ruling).

**Tests test or encode?** Objective items: genuinely re-verified. Judgment items: anchored.

**Holds under:** Code-checkable REV items.  
**Weakens/reverses under:** Judgment-dependent REV items and the mechanism verdict.

## C-20 — NOT_AUDITABLE_FROM_AVAILABLE_EVIDENCE (UNRESOLVED)

**Claim:** The review chain constitutes different-family (cross-provider) independent review.

**Class:** EMPIRICAL_HYPOTHESIS about process provenance  
**Source:** issue #33 lineage; PR #37/#39 language; retest receipt provider_model_label

**Supporting:** Internally consistent narrative; distinct house styles between packages (Fraction vs float, different APIs, different scenario grids) are weak stylistic evidence of distinct authorship.

**Opposing/limiting:** Single GitHub account performed every action; no signed commits, session transcripts, or third-party attestation; model labels are self-declared strings; AGENTS.md itself warns fluent repetition cannot promote a draft into evidence. Cross-model agreement, even if the labels are true, is agreement between models given the same prompts, same task framing, and the same controlling review — correlated inputs.

**Assumptions:** Operator honesty about which tool produced which artifact.

**Tests test or encode?** Not testable from repository bytes.

**Holds under:** —  
**Weakens/reverses under:** —

## C-21 — SUPPORTED (HIGH)

**Claim:** Receipts and commit bindings are accurate and sufficient to reproduce the record.

**Class:** EXECUTABLE_PROPERTY  
**Source:** all three econ RECEIPT.json files; DESIGN receipt

**Supporting:** Every named commit verified in the graph with claimed contents; binding commits touch only receipts; simulators re-run byte-identically; commands reproduce (185/185 lab tests after npm ci; 43/0/0 differential; PASS doctor).

**Opposing/limiting:** Receipts omit the npm-ci prerequisite; 'nexus doctor PASS with WARN WORKTREE_DIRTY before commit' shows honest recording.

**Assumptions:** A future reader has the same Python/Node major versions.

**Tests test or encode?** Genuinely verified by re-execution.

**Holds under:** Current toolchain.  
**Weakens/reverses under:** CONCAVE_LOG float scheme is disclosed as not bit-identical across builds.

## C-22 — SUPPORTED (HIGH)

**Claim:** AUD-SEM-02 (audit-original): the Claude and Grok economics models have different input domains — Claude accepts zero weights and unbounded ints; Grok rejects zero weights and bounds inputs at 21e6·1e8 sats — so 'cross-model agreement' claims are scoped to the intersection domain.

**Class:** EXECUTABLE_PROPERTY (audit-established)  
**Source:** audit adversarial_probes.py results; both model/allocation.py files

**Supporting:** Probes demonstrate the divergent rejections; 300 shared random vectors inside the intersection agree exactly.

**Opposing/limiting:** Neither package documents the domain difference; CROSS_MODEL_COMPARISON.md discusses representation (Fraction vs float) but not domain.

**Assumptions:** —

**Tests test or encode?** Established by the audit's own probes.

**Holds under:** Intersection domain: exact agreement.  
**Weakens/reverses under:** Boundary inputs (zero-weight donors, >MAX_SATS values) where behavior differs by construction.
