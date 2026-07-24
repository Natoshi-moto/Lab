# Process and provenance audit

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca` · **Authority:** none

Four different qualities must not be collapsed:

| Layer | Verdict |
|---|---|
| **Provenance quality** (are artifacts bound to commits, scoped, reproducible?) | **Strong**, with noted gaps |
| **Software correctness** (does committed code compute what it claims?) | **Strong** — independently reproduced |
| **Model validity** (do the models license the conclusions?) | **Adequate post-repair, with one underdetermined disposition (FC7) and unmodelled dimensions** |
| **Real-world validity** (does any of this predict reality?) | **Not established, and post-repair the record mostly does not claim it** |

## 1. Did the staged Claude → review → Grok → repair → retest process improve reliability?

**Yes, measurably, at the software and claim-discipline layers.** The
process caught and fixed real, audit-verified defects:

- with-replacement lottery despite "winners" semantics;
- documented-but-absent renormalization in the capped governance helper;
- mixed pool/issued denominators in concentration metrics;
- silent duplicate-ID overwrites;
- hard-coded zero attacker cost contradicting the same scenario's own
  donor-economics block;
- a behavioral "prediction" with no behavioral model;
- a 6-of-7 failure-condition mapping;
- legal-classification language outside the seat's authority;
- a self-referential receipt field (branch_tip), replaced with a sound
  two-commit binding pattern.

Each fix is real and each retracted claim deserved retraction. The
post-repair package's evidence-class labelling (mathematically proven /
conditional / structural / empirical unknown / policy) is unusually good
practice.

## 2. What could the process not challenge?

Shared premises across every seat: the synthetic-population approach itself;
donation volume as exogenous (the participation-elasticity gap, found by no
seat); charity-set curation as exogenous to rebate access; the meaning of
"social benefit" as retained sats; the framing that the seven issue #34
failure conditions are the right questions. Every seat consumed the same
issues, the same design pack, and (critically) the later seats consumed the
same controlling review. Agreement produced under shared inputs is
consistency evidence, not independent corroboration.

## 3. Was "different-family" review materially independent?

Three separate components, with different answers:

1. **File-level clean room: real and verified.** All 72 SHA-256 hashes in
   the Breaker's freeze match the unread package bytes at `b588779`. The
   Breaker demonstrably built its model without reading the Claude
   implementation.
2. **Conclusion-level independence: absent by design.** Issue #36 required
   the Breaker to first read the controlling review's detailed defect
   catalogue (REV-001…007) and gate disposition, and the Breaker's
   pre-differential mechanism verdict already matched that review's
   direction. Its "CONFIRMED" verdicts on code-checkable defects are still
   meaningful (those facts are objective and this audit re-verified them),
   but its concurrence on judgment items (necessity scope, governance
   default, verdict direction) is anchored agreement.
3. **Provider identity: not auditable.** One GitHub account performed every
   action; family labels are branch names and self-declared receipt strings.
   Distinct house styles (Fraction vs float, different APIs and scenario
   grids) weakly suggest distinct generating processes but prove nothing.
   Per the task instruction, different company/model labels alone were not
   treated as independence — and nothing stronger than labels exists in the
   record.

## 4. Were tests sometimes written to assert assumptions?

Pre-repair: yes, verifiably (a test asserted the disputed zero-cost value
as its expected output). Post-repair: the replaced tests exercise
decomposition, boundaries, and sensitivity, and the audit's independent
probes found no remaining assumption-asserting test among the load-bearing
ones. Two arithmetic identities (rebate one-for-one; supply conservation)
are necessarily "encoded" by any test of them; that is the nature of
identities, not a defect.

## 5. Are receipts and bindings sufficient for later reproduction?

Yes, with two gaps: (a) receipts omit the `npm ci` prerequisite — a fresh
clone fails 11 lab tests environmentally before dependency install;
(b) command summaries record counts, not full transcripts. Everything else
reproduced: byte-stable simulators, exact test counts, the 43/0/0
differential, doctor PASS, and every commit binding.

## 6. Were merge decisions separated from truth claims?

Formally yes: PR bodies state "merge does not prove factual correctness",
STATUS.json was never touched, no R-round was assigned, and the economic
gate is explicitly not passed. Substantively, one structural inversion
matters: **the controlling repair contract prescribed the final disposition
(`CONTINUE_WITH_CONDITIONS` / gate false) before the repair and retest
occurred** (AUD-PROC-04). The retest's role was verification of repair
compliance — competently done — not independent re-adjudication of the
verdict. The record's final disposition is therefore an operator-mediated
decision *supported by* evidence, not a conclusion three seats converged on
independently. Citations of this record should say so.

A second structural issue: the two controlling adjudications are the
highest-authority documents in the record and the only load-bearing
artifacts with **no** receipt, seat identity, freeze, or method statement —
a detailed line-referencing review of a large package appeared 4m58s after
the PR opened. Their content held up under this audit's re-verification,
but the process holds its strongest instrument to its weakest standard.

## 7. What still requires independent human expertise?

- Qualified counsel for every Track F surface (the record correctly refuses
  legal conclusions; see OPEN_QUESTIONS.md for the scoped list).
- A human economist/mechanism-designer for the participation-elasticity and
  market-microstructure questions no synthetic model can settle.
- Real charity-sector expertise for Track D curation design (the actual
  control on rebate risk).
- Human decision authority for every policy choice the ledger marks
  POLICY_CHOICE.

## 8. Does the process justify the confidence currently placed in the research?

The confidence *stated inside the record* (post-repair) is mostly
calibrated: strong claims are labelled deductive and were verified; weak
claims are labelled conditional. Two things would be over-trusted by a
reader taking the record at face value: the independence of the
review chain (labels, not evidence; anchored, not blind), and the FC7
dominance disposition (underdetermined). One thing would be *under*-trusted:
the software itself, which survived a more adversarial independent
reproduction than its own receipts demonstrate.
