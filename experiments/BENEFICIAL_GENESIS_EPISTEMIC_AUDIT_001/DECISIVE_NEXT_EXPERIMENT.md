# Decisive next experiment

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Authority:** none (recommendation only)

## The bottleneck

Every remaining load-bearing dispute — mechanism necessity (FC1), dominance
by simpler alternatives (FC7), and the sign of the mechanism's net social
effect — reduces to two currently-unmodelled quantities:

1. **participation elasticity**: how much donation volume does a
   transferable reward induce vs a non-transferable receipt vs nothing;
2. **flow composition**: what fraction of induced volume is honest,
   mercenary, rebate-seeking, or tainted, as a function of charity-set
   curation and claim design.

No further synthetic simulation of allocation arithmetic will move these.
The arithmetic layer is finished: it is deductively settled, twice
implemented, and now independently reproduced a third time by this audit.

## Recommended single next step (bounded, no live funds, no solicitation)

**BGEN-LEDGER-FUNCTION-SPEC-001 followed immediately by a
mechanism-comparison decision model — a specification task, not a
simulation task.**

Concretely:

1. The operator specifies, in one normative document, which target ledger
   functions the allocation unit must serve (payment / staking / fees /
   bootstrap / none), each marked REQUIRED / EXCLUDED / DEFERRED. This is
   pure decision-making, costs nothing, and is the stated blocker for FC1
   and FC7 in every package. Until it exists, further economics work has no
   defined objective function.
2. Conditional on that spec, run **one** new bounded analysis:
   a necessity decision-matrix that maps each REQUIRED function to the
   minimal claim design that serves it (transferable / delayed-transfer /
   non-transferable / no token), with the already-proven constraints
   (C-05 Sybil, C-07 full-issuance, C-11 pathway, C-13 governance
   conditionality) applied as hard filters. Output: either (a) a specific
   minimal design that survives all filters, or (b) a demonstration that no
   design serves the REQUIRED set without violating a filter — a genuine
   REJECT trigger of a kind the current record cannot produce.

## Why this beats the alternatives considered

- *More economics simulations*: the models are already adequate for their
  deductive claims and inadequate (irreparably, in-silico) for the empirical
  ones; more scenarios add precision to answered questions.
- *Track B (real Bitcoin) or Track C (real PQ) work now*: valuable but
  premature as the *next* step — engineering a receipt layer for a mechanism
  whose unit design (transferable or not) is undecided risks building the
  wrong artifact; the spec task is strictly upstream and nearly free.
- *Empirical participation study*: the genuinely decisive data, but any
  real-participant experiment (even testnet with real users) approaches
  solicitation/regulatory surfaces this program has correctly gated behind
  Track F review. The spec task carries no such risk and is a prerequisite
  for designing that study well.

## Falsification value

Outcome (b) above would be the first evidence-grade REJECT trigger in the
program. Outcome (a) would, for the first time, give Tracks B–F a concrete
design to evaluate instead of a family of designs. Either outcome strictly
reduces uncertainty; the current CONTINUE_WITH_CONDITIONS state cannot be
meaningfully re-tested until one of them exists.
