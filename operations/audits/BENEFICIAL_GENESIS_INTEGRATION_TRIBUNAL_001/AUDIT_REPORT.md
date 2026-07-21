# BGEN-INTEGRATION-TRIBUNAL-001 — sanitized audit report

**Subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca` (immutable, unmodified)
**Role:** fresh adversarial integration tribunal and evidence adjudicator
**Status authority:** NONE
**Repository:** Natoshi-moto/Lab (PUBLIC)
**Working branch:** `fable/bgen-integration-tribunal-001`

## Provenance disclosure (mandatory, read first)

This is a **mixed-model artifact**. The tribunal's initial phase — source
inventory, findings ledger, technical/mechanism/process adjudications,
repair acceptance plan, strongest cases, decisive next step, and the
independent probe suite — was produced by the model displayed as
**Fable 5**, which stopped mid-task upon reaching a monthly spend limit.
The model displayed as **Sonnet 5** continued in the same conversation and
the same git worktree, froze the handoff boundary at commit
`7b29b449f5add87d8a2c220da635196fbc6621e2`
(`MODEL_HANDOFF_BOUNDARY.json`), independently re-ran every decisive check
named in the continuation instructions, found no correction required
(`MODEL_HANDOFF_CHANGELOG.md`), and completed the remaining required
outputs (this report, the receipt, `README.md`, `FINAL_VERDICT.md/.json`).

**No independence is claimed** between the two model phases, nor between
this tribunal and the five audit PRs it adjudicates. Provider/account
identity throughout the record — across all seven audit sessions now on
record (five PRs plus two tribunal phases) — is self-declared only; one
GitHub account performed every action. Cross-family or cross-phase
agreement in this record is consistency evidence, not corroboration
evidence.

## What this tribunal did

Read raw commits, files, and receipts (not operator summaries) from PR #40
(Fable epistemic audit), PR #42 (Codex technical/evidence audit), PR #43
(Grok technical/evidence audit), PR #44 (Codex mechanism/economics audit),
and PR #45 (Grok mechanism/economics audit), fetched read-only, never
merged or modified. Wrote a neutral findings ledger of 18 findings
(TRIB-F-001…018) classified by evidence type, independently re-ran 14
adversarial probes against the frozen subject (`probes/tribunal_probes.py`,
`results/TRIBUNAL_PROBE_RESULTS.json`), reran every committed test suite
and gate, and adjudicated the technical and mechanism disagreements
between the audit seats from that evidence.

## Headline technical finding

PR #42's counterexample is CONFIRMED and independently reproduced twice in
this tribunal (once per model phase): `random_lottery_component` in the
REDTEAM economics package accepts `lottery_share_bps=-1000`; with pool=100
and a well-formed sole donor it issues 110 units and reports
`unissued_remainder=-10`, violating the package's own documented supply
invariant. The tribunal additionally found this is one instance of a
broader unvalidated scheme-parameter surface (boolean bps silently
accepted as 1 bps; inverted epoch bounds accepted; unvalidated rng
interface), which PR #43's technical pass did not reach because its probes
never searched that parameter domain. The normative Beneficial Genesis
design allocation and the Breaker package's analogous surface are
unaffected and fail closed. See `TECHNICAL_ADJUDICATION.md`,
`FINDINGS_LEDGER.md` TRIB-F-001/002/006.

## Headline mechanism finding

PR #44's EVIDENCE_STATE=UNDERDETERMINED and PR #45's
EVIDENCE_STATE=SUFFICIENT_FOR_BOUNDED_DECISION are **compatible, not
contradictory** — they answer different questions (final mechanism choice
vs. the bounded research decision to specify functions and refuse a
transferable default). Both mechanism audits and PR #40 independently
converge on CONTINUE_WITH_CONDITIONS and
TRANSFERABILITY_NECESSITY=NOT_DEMONSTRATED. Participation elasticity
(whether the mechanism induces additional giving or merely displaces it)
remains unmodelled in every artifact in the record and is the controlling
unresolved variable. See `MECHANISM_ADJUDICATION.md`, `FINDINGS_LEDGER.md`
TRIB-F-010/011/013.

## Verification performed (both phases combined)

- Design evidence gate: PASS (37 tests OK; 34 executable / 1 documentary /
  8 residual — matching `EXPECTED.json`, not the README's stale 29/6).
- REDTEAM economics suite: 72/72 OK. Breaker suite: 25/25 OK.
- RETEST_002 differential: 43/0/0 agreements (Node/Python); RETEST_002
  Node test suite: 19/19 OK under the README-prescribed root-level
  invocation.
- Full lab suite: 185/185 OK, and `./nexus verify` / `./nexus doctor`
  PASS — all only after `npm ci` restored the lockfile-pinned
  `@noble/ed25519` dependency; the pre-install failure (9 failures + 2
  errors, all `ERR_MODULE_NOT_FOUND`) was independently reproduced once,
  in the initial phase, and is receipted with exact counts.
- 14 independent tribunal probes (`tribunal_probes.py`), rerun identically
  by both model phases: confirm the lottery counterexample, the adjacent
  parameter-validation gaps, normative design-pack supply conservation
  over 200 fresh random cases, sole-donor pool capture, and
  oversubscription dust-flooring.
- `git diff` between the frozen subject and the current tribunal HEAD,
  excluding only the tribunal's own authorized paths: **empty**.
  `git diff --check`: clean. `STATUS.json`: unchanged (`R016`).

## Scope and limits

Report-only; `status_authority: NONE`. No merge, no STATUS.json change, no
R-round assignment, no live funds, no charity selection, no token
issuance, no deployment, no legal conclusions, no majority voting. Full
findings, adjudications, repair plan, and six final verdicts are in the
companion files under this directory's parent experiment path; see
`README.md` for the complete file index.
