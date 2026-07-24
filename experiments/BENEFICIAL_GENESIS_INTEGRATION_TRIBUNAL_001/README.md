# BGEN-INTEGRATION-TRIBUNAL-001

Fresh adversarial integration tribunal and evidence adjudicator over the
frozen Beneficial Genesis subject `8349de7a5978be6a9984aa33fd59ba3725ebaaca`
and its five audit PRs (#40, #42, #43, #44, #45). Status authority: NONE.

## Mixed-model provenance (read this first)

This tribunal was produced across **two model phases in one continuous
conversation and worktree**. The model displayed as **Fable 5** performed
the initial analysis and stopped mid-task on a monthly spend limit. The
model displayed as **Sonnet 5** continued from the exact checkpoint,
independently re-verified every decisive check, found no correction
required, and completed the remaining outputs. See
`MODEL_HANDOFF_BOUNDARY.json` (the frozen pre-handoff file inventory and
hashes) and `MODEL_HANDOFF_CHANGELOG.md` (what the continuation model
checked and changed — nothing pre-handoff was edited). No independence is
claimed between the two phases, nor between this tribunal and any of the
five audited PRs; one GitHub account performed every action across all
seven audit sessions now on record.

## Headline results

- **One confirmed executable counterexample** (TRIB-F-001): a negative
  `lottery_share_bps` over-issues the pool in the REDTEAM economics
  package, confirming PR #42's finding and extending it to a broader
  unvalidated scheme-parameter surface (TRIB-F-002) that PR #43's
  technical pass did not reach.
- **The technical disagreement between PR #42 and PR #43 is resolved**:
  PR #42's finding controls; PR #43's package-level pass is superseded,
  not falsified as a set of specific findings (its F-001–F-004 are all
  confirmed).
- **The mechanism-audit "disagreement" (PR #44 vs PR #45 EVIDENCE_STATE)
  is resolved as compatible**, not contradictory — the two audits answer
  different questions (final mechanism choice vs. bounded research
  decision).
- **Six final verdicts** are re-adjudicated in `FINAL_VERDICT.md` /
  `.json`: TECHNICAL_EVIDENCE_STATE=REPAIR_REQUIRED,
  MECHANISM_RESEARCH_DIRECTION=CONTINUE_WITH_CONDITIONS,
  TRANSFERABILITY_DEFAULT=NONTRANSFERABLE_OR_DELAYED_DEFAULT,
  EVIDENCE_FOR_FINAL_MECHANISM_CHOICE=UNDERDETERMINED,
  REAL_WORLD_READINESS=RESEARCH_ONLY,
  NEXT_PHASE=GO_TO_BOUNDED_REPAIR.
- **Single controlling next action:** execute the bounded repair (R1),
  obtain a fresh independent retest, then proceed to product/ledger
  function specification (S1). See `DECISIVE_NEXT_STEP.md`.

## File index

| File | Contents |
|---|---|
| `SOURCE_INVENTORY.json` | Binding: frozen subject, audit PR heads, runtime, session disclosure, commands run, files inspected/not inspected |
| `FINDINGS_LEDGER.md` / `.json` | 18 findings (TRIB-F-001…018), neutral ledger with evidence class, reproduction status, disposition, severity, repair, blocking scope |
| `TECHNICAL_ADJUDICATION.md` | Adjudicates PR #42 vs PR #43 from raw evidence: lottery counterexample, adjacent parameter surfaces, evidence counts, environment, verdict vocabulary |
| `MECHANISM_ADJUDICATION.md` | Adjudicates PR #44 vs PR #45: the four mechanism verdict categories, ledger-function analysis, identity/Sybil/governance/attack analysis |
| `PROCESS_ADJUDICATION.md` | Audit-process assessment: blind vs directed findings, session freshness, identity evidence vs self-declaration, shared premises, omitted search dimensions |
| `REPAIR_ACCEPTANCE_PLAN.md` / `.json` | R1–R5 evidence-hygiene repairs and S1–S6 mechanism-specification work, not implemented here |
| `STRONGEST_CASES.md` | Steelmanned continue vs stop/redesign cases; discriminating experiments |
| `DECISIVE_NEXT_STEP.md` | Single controlling first action and sequencing |
| `FINAL_VERDICT.md` / `.json` | Six re-adjudicated final verdicts with evidence, confidence, falsifiers, next actions |
| `MODEL_HANDOFF_BOUNDARY.json` | Pre-handoff file inventory and SHA-256 hashes, frozen before continuation |
| `MODEL_HANDOFF_CHANGELOG.md` | What the continuation model independently re-verified; confirms no correction to pre-handoff work was needed |
| `probes/tribunal_probes.py` | 14 independent adversarial probes against the frozen subject, rerun identically by both model phases |
| `results/TRIBUNAL_PROBE_RESULTS.json` | Machine-readable probe outputs |
| `../../operations/audits/BENEFICIAL_GENESIS_INTEGRATION_TRIBUNAL_001/AUDIT_REPORT.md` | Sanitized audit report |
| `../../operations/receipts/BENEFICIAL_GENESIS_INTEGRATION_TRIBUNAL_001/RECEIPT.json` | Sanitized receipt |

## Reproduce

```bash
python3 experiments/BENEFICIAL_GENESIS_INTEGRATION_TRIBUNAL_001/probes/tribunal_probes.py
(cd experiments/BENEFICIAL_GENESIS_DESIGN_001 && python3 verify_evidence.py)
python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests
python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_BREAKER_001/tests
(cd experiments/BENEFICIAL_GENESIS_RETEST_002 && node verify.mjs)
node --test experiments/BENEFICIAL_GENESIS_RETEST_002/tests/*.test.mjs
npm ci && python3 -m unittest discover -s tests && ./nexus verify && ./nexus doctor
```

## Nonclaims

No status promotion, R-round assignment, merge, live funds, charity
selection, token issuance, deployment, or legal conclusion. No majority
voting. Model-family or provider labels — within this tribunal's two
phases and across all five audited PRs — are not treated as proof of
independence. Passing tests, merge state, and repeated prose are not
treated as proof of truth.
