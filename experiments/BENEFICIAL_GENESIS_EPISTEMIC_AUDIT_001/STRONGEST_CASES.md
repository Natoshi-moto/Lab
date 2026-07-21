# Strongest cases — continue vs stop

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Phase 6** · **Authority:** none

Both cases below use only ledger-verified evidence (claim IDs reference
CLAIM_LEDGER.md). Neither is this audit's verdict; see FINAL_VERDICT.md.

## A. Strongest evidence-bound case for continuing

1. **The core arithmetic is finished and sound.** Supply conservation is a
   theorem, executably enforced, twice implemented, and independently
   reproduced by a hostile third pass (C-01…C-04). Nothing at the
   allocation layer is broken.
2. **The design's honesty infrastructure is unusually strong.** Explicit
   non-claims, synthetic labelling, fail-closed validation, deterministic
   fixtures, receipts that survive re-execution (C-21). The record retracts
   its own overclaims when caught — twice, verifiably.
3. **Every alleged economic incoherence dissolved under scrutiny into
   either a conditional result or a policy choice.** The one attempted
   REJECT verdict rested on claims that were genuinely overclaimed
   (C-10, C-12's precursor) and did not survive review. After repair,
   no failure condition is triggered unconditionally against the concept;
   the two proven triggers (Sybil-vulnerability of anti-concentration rules
   C-05; stolen-fund pathway C-11) constrain the *design space*, not the
   concept — linear pro-rata avoids the first, and the second is shared by
   every permissionless value system and is mitigable at the policy layer.
4. **A real-world precedent exists.** Counterparty's 2014 burn (E-1) shows
   thousands of BTC voluntarily committed to a bounded-epoch,
   denominator-uncertain genesis mechanism. A charity-destination variant
   redirects that demonstrated willingness from provable destruction to
   charitable transfer — plausibly a strict welfare improvement over burn.
5. **The remaining blockers are cheap.** The decisive next steps are a
   specification decision and a filtered design matrix
   (DECISIVE_NEXT_EXPERIMENT.md) — not expensive engineering or risky
   empirical work. Stopping now would discard a clean, reproducible
   research base just before its cheapest decision point.

## B. Strongest evidence-bound case for stopping or radically redesigning

1. **The mechanism's purpose is unevidenced at its core.** The single
   justification for a transferable reward — that it induces additional
   charitable giving — is modelled nowhere, evidenced nowhere, and is the
   one variable every comparison silently holds constant (C-16). Three
   seats and two reviews never noticed. A research program whose central
   causal premise is unexamined after this much work should redesign around
   that premise or stop.
2. **The proven properties mostly cut against the design.** What *is*
   deductively established: whales get proportional power (C-06); every
   tested anti-whale correction is Sybil-broken without identity (C-05);
   the pool issues fully even to a 1,000-sat epoch (C-07); stolen-fund
   claims validate (C-11); and the more the ledger succeeds, the more
   profitable tainted-fund migration becomes (C-12 reversal region). The
   theorems are fine; what they describe is a mechanism whose failure
   surfaces grow with its success.
3. **The favorable-looking verdict is process-directed.** The only seat
   that reached an autonomous overall verdict said REJECT_OR_REDESIGN; the
   surviving CONTINUE_WITH_CONDITIONS was prescribed by the operator's
   controlling review before repair and retest (C-18, AUD-PROC-04), and the
   "independent" confirmations were anchored (C-19) with unverifiable
   provider identity (C-20). The record contains no *independent* judgment
   that the mechanism should continue.
4. **Simpler alternatives lose only what is unproven.** A non-transferable
   receipt preserves every *specified* function and deletes the laundering
   monetization and re-concentration surfaces (C-15). The only thing lost
   is the hypothesized participation boost — the exact thing never
   evidenced. Under the evidence actually in hand, the simpler design
   weakly dominates.
5. **Residual surfaces are irreducibly social/legal.** Rebate incidence is
   controlled by charity-set curation, not cryptography (C-09); ownership
   vs control is unresolvable in-protocol (C-11); classification/tax/AML
   exposure (OPEN_QUESTIONS 10–15) attaches to the transferable variant
   specifically. The program would spend its complexity budget defending
   surfaces a redesign could delete.

## Adjudication of the disagreement

- **Genuine factual disagreement:** almost none. Both cases accept the same
  theorems and the same conditional results — a notable and real
  achievement of the record.
- **Different objectives:** Case A optimizes for preserving a validated
  research asset and cheap option value; Case B optimizes for not investing
  further in a mechanism whose core premise is untested. These are risk
  postures, not evidence disputes.
- **Where evidence cannot adjudicate:** participation elasticity and flow
  composition (empirical); ledger-function scope (a decision); every legal
  surface (counsel).
- **Which conclusion follows only after a policy choice:** both.
  CONTINUE_WITH_CONDITIONS vs STOP is not evidence-determined today. What
  the evidence *does* determine: (i) the current transferable design must
  not be defended by default (both cases agree); (ii) the next action is
  the same under either posture — specify ledger functions and run the
  filtered design matrix, since it either produces a REJECT trigger
  (satisfying Case B) or a minimal surviving design (satisfying Case A).
- **Most uncertainty-reducing observation:** a credible participation-
  elasticity estimate (see DECISIVE_NEXT_EXPERIMENT.md for why the spec
  task must precede it).

This is not false balance: on *software and claim discipline* the record is
strong (Case A's ground); on *mechanism justification* the record is empty
where it matters most (Case B's ground). Both statements are true at once
because they are about different layers.
