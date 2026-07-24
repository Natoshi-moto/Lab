# Process adjudication — BGEN-INTEGRATION-TRIBUNAL-001

Assesses the audit process across PRs #40/#42/#43/#44/#45. Precise-language
rule applied throughout: this record contains **five separately-run audit
sessions with self-declared seat labels operating through one GitHub
account** — it does not evidence "five independent AIs".

## Blind rediscovery vs directed verification

- **Blind rediscoveries (strongest class):** PR #42's CODEX-TECH-001
  (no prior artifact describes it; PR #43, searching the same package
  blind, missed it — which is itself evidence #42 did not copy it);
  PR #44/#45's participation-elasticity and transferability findings
  relative to PR #40 (declared blindness; artifact-level support;
  prompt-seeding not excludable). PR #43's F-001 README drift and F-004
  registry omission are also blind finds within its session.
- **Directed verification:** every rerun of committed suites (all seats);
  the historical Breaker package's confirmations of the review's defect
  catalogue (established by PR #40's AUD-PROC-01, outside the five PRs
  under adjudication but inside the record they audit).
- **Conclusions prescribed by task wording:** REAL_WORLD_READINESS was a
  forced single-value category in at least PR #43/#45 (`allowed:
  ["RESEARCH_ONLY"]`) and in this tribunal's own instructions — it should
  be cited as "forced and independently supported", never as a finding.
  The historical record's pre-audit `CONTINUE_WITH_CONDITIONS` was
  operator-prescribed before repair (PR #40 AUD-PROC-04); the five audit
  PRs are the first artifacts to *arrive* at it from fresh sessions.

## Session freshness and provenance

- PR #40: fresh session declared; pre-audit freeze committed; Claude-family
  seat auditing partly Claude-attributed work (self-disclosed).
- PR #42: **two abandoned prior attempts disclosed** (one SUBJECT_DRIFT,
  one BLINDING_BREACH after PR #40 metadata appeared); the shipped audit is
  the third, fresh session; transcripts of abandoned attempts not in the
  repository — their existence is operator-reported provenance only.
- PR #43: fresh session declared; `blinding_breach: false`;
  `forbidden_materials_opened: false`.
- PR #44: blind-first protocol with staged source inventory
  (pre-freeze/post-freeze/permanently-excluded classes); disclosed
  repairing one of its own test assertions mid-audit — an honest-direction
  disclosure that raises confidence in the rest of its receipt.
- PR #45: `fresh_session: true`, `prior_session_inherited: false`.
- This tribunal: fresh session, no prior Beneficial Genesis context, no
  resumed Fable audit session (see SOURCE_INVENTORY.json).

All freshness and blindness properties are **self-declared and
structurally consistent** (nothing in any package contradicts them);
none is cryptographically evidenced.

## Identity: evidenced vs self-declared

Evidenced: one GitHub account (`Nexus Bootstrap`) authored every commit in
every audit branch. Self-declared only: provider/model labels ("OpenAI
Codex", "xAI Grok grok-4.5 class", "Claude Fable 5"). Weak circumstantial
support for distinct generating processes: materially different code
styles, APIs, result schemas, and — most tellingly — **divergent
findings** (PR #42 found what PR #43 missed in the same package; the
reverse for F-001/F-004). Divergence under a shared operator would be
strange if a single process generated both. This remains far short of
independence proof (TRIB-F-018).

## Independently implemented vs merely rerun

- Independently implemented: PR #40's repro/probes; PR #42's adversarial
  probe; PR #43's 30+ probes and hash inventories; PR #44's
  `independent_model.py` (imports no subject module); PR #45's `model/`
  package; this tribunal's 14 probes (written from subject source, then
  compared to audit claims).
- Merely rerun: all committed suite executions (72/25/37/19/185), the
  evidence gate, `verify.mjs`. Reruns establish reproducibility, not
  correctness — TRIB-F-001 passed every committed suite while violating
  the documented invariant.

## Shared premises that survived every seat

1. The synthetic-population / assumed-`v` modeling frame itself.
2. Retained sats as the operationalization of "social benefit".
3. The seven issue #34 failure conditions as the right question set.
4. Charity curation treated as exogenous.
5. Single-variable attack grids (combined attacks under-searched — the
   one search dimension every seat thinned).
6. All seats consumed the same repository prose and operator task wording;
   agreement under shared inputs is consistency evidence, not
   corroboration.

## Omitted search dimensions per audit

- PR #43: scheme-parameter domain (the decisive omission; TRIB-F-006).
- PR #42: mechanism space (correctly out of its seat's scope, and it said
  so); did not search adjacent parameter surfaces beyond its single
  counterexample (this tribunal's T-002…T-008 extend it).
- PR #44/#45: combined multi-variable attacks beyond limited grids;
  post-transfer governance dynamics.
- PR #40: did not execute new adversarial parameter searches on the
  economics package (its seat was epistemic; it flagged the semantic
  divergences AUD-SEM-01/02 instead).

## Did PR #40 identify a gap later independently reproduced by #44/#45?

Yes at artifact level: participation elasticity (AUD-MODEL-03,
audit-original in PR #40) appears independently in PR #44's
sign-controlling unmeasured variables and PR #45's
`key_unresolved_empirical`, both blind to PR #40 by declaration. Caveat as
in TRIB-F-010: shared operator prompts are not in the repository.

## What does the agreement actually increase confidence in?

- **Arithmetic** (supply conservation, split-invariance, cap
  renormalization): genuinely strengthened — three-plus structurally
  different implementations, tribunal-reproduced, elementary deductions.
- **Implementation** (committed suites reproduce byte-stably):
  strengthened — five seats plus tribunal, zero reproduction failures.
- **Mechanism desirability/welfare**: **not strengthened** — every seat's
  welfare statements are conditional on the same exogenous variables;
  agreement here is consistency under shared assumptions.
- **Independence of judgment**: partially strengthened by divergence
  (PR #42 vs #43) and by fresh-session arrivals at the prescribed
  disposition; bounded by TRIB-F-017/018.

## Process defects carried forward

1. Controlling adjudications without receipts (TRIB-F-017) — the highest-
   authority documents in the historical record are held to the weakest
   evidentiary standard. The five audit PRs and this tribunal each carry
   receipts; the asymmetry should not recur.
2. Verdict vocabularies not prescribed per task (TRIB-F-005), forcing
   integration-layer translation.
3. Environment prerequisites absent from receipts (TRIB-F-004).
4. No seat-identity attestation stronger than a self-declared string
   (TRIB-F-018).
