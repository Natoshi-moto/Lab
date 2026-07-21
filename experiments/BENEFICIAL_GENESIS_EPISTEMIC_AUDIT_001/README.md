# BGEN-EPISTEMIC-AUDIT-001

Independent epistemic audit of the complete Beneficial Genesis technical and
economic research record at exact subject
`8349de7a5978be6a9984aa33fd59ba3725ebaaca` (= `main` at audit time).

**Authority:** `status_authority: NONE`. This audit promotes nothing, merges
nothing, assigns no R-round, changes no STATUS.json, authorizes no live
activity, and makes no legal conclusions. Cross-model agreement is nowhere
treated as proof of truth.

## Verdicts (see FINAL_VERDICT.md / FINAL_VERDICT.json)

| Question | Verdict |
|---|---|
| Evidence package | **TRUSTWORTHY_WITH_STATED_LIMITS** |
| Underlying mechanism | **CONTINUE_WITH_CONDITIONS** (moderate confidence; UNDERDETERMINED vs STOP is a defensible alternative) |
| Real-world readiness | **RESEARCH_ONLY** |

## One-paragraph summary

The arithmetic and software layers of Beneficial Genesis are in excellent
shape: every load-bearing number independently reproduced to exact rational
equality (35/35), every adversarial probe failed closed (33/33), receipts
and clean-room hash inventories verify, and the staged review process
demonstrably caught and fixed real defects. The process layer is weaker
than its labels suggest: the "independent" confirmations were anchored by a
directed defect list, provider-family identity is asserted rather than
evidenced, and the record's final disposition was prescribed by the
operator's controlling review before the repair and retest that "preserved"
it. The mechanism layer has one decisive hole no prior seat flagged: the
core causal premise — that a transferable reward induces additional
charitable giving — is unmodelled and unevidenced, and every
necessity/dominance comparison silently holds donation volume constant.
The highest-value next action is a cheap specification decision plus a
filtered design matrix, either producing the program's first evidence-grade
REJECT trigger or its first concrete surviving design.

## Contents

| File | Phase | Role |
|---|---|---|
| PRE_AUDIT_FREEZE.json | 1 | Anchoring-reduction freeze, committed before opening the economics packages; includes 168-file SHA-256 inventory and honesty statement |
| SOURCE_INVENTORY.json | 0/2 | Exactly what was inspected, executed, and not inspected |
| CHRONOLOGY.md | 2 | Minute-level reconstruction + 8 provenance determinations |
| CLAIM_LEDGER.md / .json | 3 | 22 load-bearing claims, each classed, evidenced, bounded, and assigned claim-specific confidence |
| repro/independent_repro.py | 4 | 35 fresh-code reproductions (exact-rational), all passing |
| repro/adversarial_probes.py | 4 | 33 adversarial/differential probes, all passing |
| REPRODUCTION_REPORT.md | 4 | Results incl. verified pre-repair defects and audit-original findings AUD-SEM-01/02 |
| MODEL_ADEQUACY.md | 5 | Variable structure, omissions, sign-search, direction-vs-magnitude discipline |
| STRONGEST_CASES.md | 6 | Steelmanned continue and stop cases + adjudication |
| EXTERNAL_EVIDENCE_REGISTER.md | 7 | Three primary-source anchors (Counterparty 2014; Coincheck laundering discount; FATF NPO-abuse) |
| PROCESS_AND_PROVENANCE_AUDIT.md | 8 | Four-layer trust assessment; AUD-PROC-01…04 |
| OPEN_QUESTIONS.md | 9 | Empirical, design, legal-for-counsel, and lab-process questions |
| DECISIVE_NEXT_EXPERIMENT.md | 9 | The single recommended next action and why |
| FINAL_VERDICT.md / .json | 9 | Three separate verdicts with falsifiers |

Sanitized audit report and receipt:
`operations/audits/BENEFICIAL_GENESIS_EPISTEMIC_AUDIT_001/AUDIT_REPORT.md`,
`operations/receipts/BENEFICIAL_GENESIS_EPISTEMIC_AUDIT_001/RECEIPT.json`.

## Reproduction

```bash
npm ci   # required: lab suite needs @noble/ed25519 (fresh clones fail 11 tests without it)
python3 experiments/BENEFICIAL_GENESIS_EPISTEMIC_AUDIT_001/repro/independent_repro.py
python3 experiments/BENEFICIAL_GENESIS_EPISTEMIC_AUDIT_001/repro/adversarial_probes.py
```

Both scripts exit 0 and write machine-readable results beside themselves.
Neither modifies any subject path (verified by `git status` after every run).
