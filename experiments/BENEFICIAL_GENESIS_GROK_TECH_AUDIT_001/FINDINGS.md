# Findings — BGEN-GROK-TECH-AUDIT-001

Severity scale: **CRITICAL** / **HIGH** / **MEDIUM** / **LOW** / **INFO**.

---

## F-001 — Design README fixture catalog counts are stale

| Field | Value |
|-------|--------|
| Severity | MEDIUM |
| Type | documentation / claim-evidence drift |
| Locator | `experiments/BENEFICIAL_GENESIS_DESIGN_001/README.md:77-78` |
| Counter-evidence | `fixtures/EXPECTED.json` `documentary_only` has 1 entry; evidence gate JSON `executable_invalid_cases=34`, `documentary_only_cases=1`, `residual_risks=8`; invalid fixture files = 36 |
| Evidence | Clean reproduction of `verify_evidence.py` exit 0 with counts above; probe P-DOC-001 FAIL |
| Confidence | **High** |
| Falsifier | README updated to match EXPECTED + gate, or EXPECTED reduced to 29/6 with gate agreement |
| Repair | Update README lines 77–80 (and any mirrors) to: 34 executable invalid, 1 documentary-only, 8 residual risks — or regenerate wording from EXPECTED programmatically in evidence gate |

---

## F-002 — Rejection-code taxonomy is looser than fixture attack names

| Field | Value |
|-------|--------|
| Severity | LOW |
| Type | spec/code correspondence (labels) |
| Locator | `fixtures/EXPECTED.json` keys `wrong_output_index`, `unsupported_script_form`, `nullifier_domain_omission`, `inclusion_after_cutoff`; codes defined in `protocol/constants.py:44-96` |
| Evidence | Catalog maps wrong_output_index→`AMOUNT_MISMATCH`; nullifier_domain_omission→`NULLIFIER_INVALID` despite `NULLIFIER_DOMAIN_OMISSION` existing; inclusion_after_cutoff→`HEADER_ANCESTRY_INVALID` while sibling fixture uses `INCLUSION_AFTER_CUTOFF` |
| Counter-evidence | All executable invalid fixtures still fail closed under evidence gate; behavior not “accept bad claim” |
| Confidence | **High** |
| Falsifier | Each fixture returns a code whose name matches the attack class without overloading |
| Repair | Prefer specific codes where defined; add regression tests that preferred codes are stable; document intentional overloads |

---

## F-003 — Full lab tests and `./nexus verify` fail without `@noble/ed25519`

| Field | Value |
|-------|--------|
| Severity | MEDIUM (lab environment / missing prerequisite docs); **not** a BGEN package logic defect |
| Type | environmental / documentation of prerequisites |
| Locator | `experiments/R013_PCX_CONSERVED_CLAIM/independent_verifier.mjs` import; R015/R016 independent verifiers; `tests/test_r016_independent_verifier.py` etc. |
| Evidence | `python3 -m unittest discover -s tests -v` → 9 fails + 2 errors, all Noble missing; `./nexus verify` exit 2 same error |
| Counter-evidence | All BGEN design/econ/breaker/retest_002 prescribed suites pass with Python stdlib + bare Node |
| Confidence | **High** |
| Falsifier | Clean clone with documented `npm i @noble/ed25519` (or vendored dep) makes full suite and nexus verify green |
| Repair | Document and pin Node dependency install for R013/R015/R016 verifiers in root or experiment READMEs; optionally vendor |

---

## F-004 — Economics `SCHEMES` registry omits lottery scheme

| Field | Value |
|-------|--------|
| Severity | LOW / INFO |
| Type | composition / API surface |
| Locator | `experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/model/allocation.py:217-223` |
| Evidence | `SCHEMES` keys EXACT_PRO_RATA, CAPPED_PRO_RATA, CONCAVE_*, TIME_WEIGHTED only; `random_lottery_component` is public but not registered (requires `rng`) |
| Counter-evidence | Scenario runner special-cases lottery; tests cover lottery directly |
| Confidence | **High** |
| Falsifier | Registry includes lottery with explicit rng factory contract |
| Repair | Document required special-case or add registry entry with rng parameter protocol |

---

## F-005 — Residual research risks correctly disclosed; not closed by tests

| Field | Value |
|-------|--------|
| Severity | INFO (scope boundary) |
| Type | claim boundary |
| Evidence | Design THREAT_MODEL residual list; economics FC4 pathway + FC6 Sybil without identity; retest preserves ECONOMIC_GATE_PASS false |
| Confidence | **High** |
| Note | Not a defect in execution — prevents over-promotion |

---

## Non-findings (checked, no defect)

| Check | Result |
|-------|--------|
| Design allocation supply conservation | Holds (tests + 50 random probes) |
| Bool-as-int rejection design + econ | Holds |
| Duplicate JSON keys | Rejected at raw parser |
| Claude vs design pro-rata composition | Numeric match |
| Lottery without replacement | Holds |
| Metrics issued vs pool denominators | Distinct and correct |
| cap_then_renormalize not hard final cap | Disclosed + demonstrated |
| Subject path mutation after simulate | None (tracked) |
| Receipt commit SHAs | Resolve in git |
| STATUS.json mutation by subject packages | None observed |
| Forbidden sibling audits | Not opened; no BLINDING_BREACH |

## Strongest confirmed claims

1. Design reference verifier + evidence gate are **reproducible** and fail-closed on the executable fixture corpus (34 invalid + valid set).
2. Fixed-pool floor allocation with unissued remainder is **correctly implemented** in design and mirrored by Claude `exact_pro_rata`.
3. Differential Node verifier agrees **43/0/0** with design fixtures.
4. Repaired economics package’s executable claims (validator, lottery, denominators, conditional tainted/rebate framing, governance stages) **reproduce**; mechanism disposition remains **CONTINUE_WITH_CONDITIONS**, **ECONOMIC_GATE_PASS false**.

## Strongest defects / unresolved

1. **F-001** README catalog drift (repair now).
2. **F-003** lab Node dependency gap (blocks full-repo verify on bare hosts).
3. Residual economic risks FC4/FC6 and synthetic crypto/Bitcoin non-claims remain **unresolved by design** (research only).
