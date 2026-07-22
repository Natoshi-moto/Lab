# Hardening sequence H0–H5

**Status:** `PROPOSAL / STATUS_AUTHORITY: NONE / RESEARCH_ONLY`  
**Date:** 2026-07-22  
**Does not authorize implementation.** Operator GO + gate citations required per package.

T-IDs → `../NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md`  
Gates → `../NOTED_STOP_THE_LINE_001/HARD_GATES.md`  
ODS stubs → `../NOTED_SOVEREIGNTY_ASSAULT_001/ODS_SECURITY_CASES.md`

---

## Ordering principle

```text
1. Stop lying by omission (policy + language)
2. Remove obvious cold-drop shame (small, reversible)
3. Measure (expect FAIL) so red is executable
4. Choose tension (A / B / C / B-then-C)
5. Fix with re-probe + receipt
6. Only then expand Agent surface / Phase 3 broker / Snooper build / cold-drop marketing
```

Feature velocity that skips 1–3 while G-01…G-03 are RED is **tax evasion** under `PRODUCTIVITY_TAX.md` if stop-the-line is ADOPTed.

---

## H0 — Policy bind (docs/process; may already be partial)

| Field | Content |
|-------|---------|
| **Goal** | Stop-the-line binds drive + Codex planning |
| **Gates** | Policy layer for G-01…G-07 |
| **Work** | Operator D1 **ADOPT** (or explicit REJECT); Grok pastes HARD_GATES matrix on every “what next” that smells like Phase 3 |
| **Evidence** | Operator decision receipt under `operations/receipts/` (optional but preferred) |
| **Blocks if skipped** | Silent return to comfort-first shipping |
| **Codex?** | No |

**Note:** Docs packet already on `main` @ PR #59. ADOPT is still an operator act, not automatic.

---

## H1 — T-06 quarantine first (small kill-task)

| Field | Content |
|-------|---------|
| **Goal** | No zombie Agent in the gift bag |
| **T-IDs** | T-06 |
| **Gate** | G-04 |
| **ODS** | ODS-SEC-006 (implement as part of task or immediately after) |
| **Work** | Remove or move `nexus-agent-v0.12.html` (both paths) to explicitly non-shipped archive; strip `legacyPath` / Nexus_OS launch entries; scrubbed v0.14 path sole entry |
| **Evidence** | File/registry probe green; receipt |
| **Risk** | Low if paths verified; do not touch frozen corpus |
| **Codex?** | Yes — bounded after operator **GO-T06-FIRST** |

---

## H2 — Wave A measurement harnesses only

| Field | Content |
|-------|---------|
| **Goal** | Make T-01/T-02/T-03 failures **runnable and expected FAIL** |
| **T-IDs** | T-01, T-02, T-03 |
| **Gates** | Documents G-01…G-03 as red-with-proof |
| **ODS** | ODS-SEC-001, 002, 003, 004 |
| **Work** | Implement harnesses in existing ODS / Playwright / static-parse idioms; CI or `npm run` entry; **no fix PRs** if tension still DEFER |
| **Evidence** | Logs showing FAIL for the right reason; cases land in tree |
| **Codex?** | Yes after GO-WAVE-A (measurement scope) |

**Savage rule:** a green marketing claim while these FAIL is a G-07 violation.

---

## H3 — Tension decision + fix wave

| Field | Content |
|-------|---------|
| **Goal** | Structural membrane honesty or explicit weak-but-loud product |
| **Prerequisite** | H2 harnesses exist (or operator waiver of measurement) |
| **Operator D3** | **A** / **B** / **C** / **B-then-C** / **DEFER** |

### If A (disclose only)

- Copy audit all README/UI/drop surfaces (G-07).  
- Harnesses may stay FAIL forever with permanent residual register.  
- Cold-drop must scream co-tenancy + CDN + proxy.  
- **Does not** turn G-01…G-03 GREEN without waiver.

### If B (vendor + kill default proxy)

- Bundle Agent runtime JS/CSS under Lab packages **or** SRI + update process (T-02 / G-02).  
- Remove silent `corsproxy.io` default; hard-fail or explicit scary toggle per turn (T-03 / G-03).  
- Re-run ODS-SEC-003/004 → PASS.  
- T-01 remains open until C or waiver.

### If C (split trust)

- Drop `allow-same-origin` and/or serve Agent from origin that cannot touch parent storage (T-01 / G-01).  
- Redesign Agent session/key storage (will break current same-origin assumptions).  
- Optional: Agent **refuse-unsafe-embed** self-check (mutual distrust secondary).  
- Re-run ODS-SEC-001/002 → PASS.

### If B-then-C (recommended when seeking teeth)

1. Land B with green 003/004.  
2. Land C with green 001/002.  
3. Receipt residual risks (crypto escrow T-07 still open, etc.).

---

## H4 — Export + approval hygiene (parallelizable after H2 starts)

| Package | T-IDs | Gate | ODS | Notes |
|---------|-------|------|-----|-------|
| H4a export allowlist | T-04, T-05 | G-05 | ODS-SEC-005 | Respect FROZEN diagnosticExporter UNFREEZE process |
| H4b pending queue | T-14 | G-06 partial | ODS-SEC-007 | No silent clobber; trace dropped requests |
| H4c central approval design | T-08, T-09 | G-06 | design + later probe | **Required before Phase 3 broker is “real”** |

Phase 3 effectful broker remains **stub labeled dangerous** until G-01 + G-06 green/waived (`HARD_GATES` matrix).

---

## H5 — Snooper + cold-drop (late)

| Package | When | Law |
|---------|------|-----|
| H5a Snooper v1 | After H2; preferably after H3 choice | `SNOOPER_IA.md` warning law **unsoftened**; coverage gap in-product |
| H5b cold-drop assembly | After G-01…G-05 + G-07 green/waived | `COLD_DROP_BAR.md`; no shame-hiding |
| H5c Wave D | Slow | T-07 crypto escrow; T-13 Electron only if shell ships |

---

## Explicit non-sequence (forbidden as “natural next”)

- Phase 3 broker as production-shaped feature while G-01/G-06 RED  
- Cold-drop marketing sprint while G-04/G-07 RED  
- New providers / effectful channels without Wave A progress  
- Softening Snooper warnings “for UX”  
- Closing T-IDs from prose or multi-AI agreement alone  

---

## Merge / planning matrix (restated)

| Want to do | Minimum gates GREEN or waived |
|------------|-------------------------------|
| Merge more Agent features | G-01, G-02, G-03 |
| Announce cold drop | G-01, G-02, G-03, G-04, G-05, G-07 |
| Start Phase 3 broker as real | G-01, G-06 |
| Claim “membrane hardening complete” | All G-01…G-07 + residual register + this packet’s non-claims intact |

---

## Suggested first Codex packet shape (only after operator GO)

**Packet 1 — H1 only**

```text
Cite: NOTED_MEMBRANE_HARDENING_001 H1; T-06; G-04; ODS-SEC-006
Scope: quarantine/remove v0.12 Agent paths + registry/launcher references
Out of scope: T-01/T-02/T-03 fixes, Snooper, Phase 3
Acceptance: ODS-SEC-006 style proof or documented probe; receipt draft
```

**Packet 2 — H2 only**

```text
Cite: H2; T-01/T-02/T-03; G-01/G-02/G-03; ODS-SEC-001…004
Scope: harnesses expect FAIL; no silent “fix”
Out of scope: tension implementation
Acceptance: npm script or documented runner; FAIL logs committed or receipt-bound
```

---

*End hardening sequence.*
