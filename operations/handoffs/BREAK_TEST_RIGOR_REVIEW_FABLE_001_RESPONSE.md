# BREAK test rigor review — Fable response

- SEAT_NAME: Claude Fable (Anthropic) — **started as Fable; delivery continuity broken mid-task**
- MODEL_FAMILY: Anthropic
- MODEL_AT_START: Fable (seat label; exact underlying model id not partitioned in original draft)
- MODEL_MID_SESSION_DOWNGRADE: **Opus 4.8** (operator label) — **YES**
- DOWNGRADE_CONTROL: **OUT_OF_OPERATOR_CONTROL** (provider/product routing; operator tried and could not prevent)
- OPERATOR_FLAG: **PARAMOUNT / BREAK GLASS**
- MAIN_SHA_INSPECTED: `85bc9d95eb2454105781a1310cea9e159489e07e` (origin/main)
- BRANCH_TIP_INSPECTED: `8d6937b8df601fc576e6a494b398dd476cd2a720` (this review branch = main + the Grok handoff commit; no product code differs from main)
- DIRTY_TREE: no
- DATE_UTC: 2026-07-22
- status_authority: NONE
- independence_claim: NONE (same GitHub account / same Anthropic family as other Claude seats — this is differential *design* review, not third-party corroboration)

## 0A) 🚨 BREAK GLASS — mid-session model downgrade (MANDATORY — do not omit)

**Emergency record:** `operations/receipts/BREAK_TEST_RIGOR_REVIEW_FABLE_001/BREAK_GLASS_OPUS_4_8_DOWNGRADE.md`

### VERBATIM OPERATOR QUOTE (do not paraphrase)

> Opus 4.8 delivered what started off as Fable but got downgraded mid task due to the security concerns, I tried

**Binding reading:** Work **started as Fable**. **Opus 4.8 delivered** the package after a **mid-task** downgrade attributed to **security concerns**. Operator **tried** to keep control and **could not** — out of operator control. This original response draft shipped **without** this section; Grok amended it onto the PR branch at operator instruction so silence is impossible.

**Partition status:** `UNABLE_TO_PARTITION` — which paragraphs were written before vs after the downgrade cannot be proven from the Lab record. Treat **the whole response body as mixed-seat / post-break continuity risk**. Findings may still be useful as a map; they are **not** single-mind high-assurance Fable output.

**Residual risk:** Anyone citing this file as “Fable’s review” without the quote above is misrepresenting seat continuity on security-sensitive work.

## 0) Mission restatement (one paragraph)

I was asked to attack the BREAK **test design** — the runbook, the hard gates, the cold-drop bar, the evidence labels, the session plan — for rigor holes that would let a launch, a cold drop, or a "secure enough" claim slip through while red gates are still red, and to add every probe, gate, and veto that should block launch until fixed or explicitly waived. I did **not** run the product break probes (CARD-04 live storage reach, etc.), I did **not** implement any security fix, and I did **not** soften any stop-the-line language. Everything below either tightens the test or exposes where it can grade its own homework into a launch. My agreement with any prior Grok/Codex finding closes nothing.

## 1) Files actually inspected

Docs (read in full):
- `operations/handoffs/BREAK_TEST_RIGOR_REVIEW_FABLE_001.md`
- `operations/break-prep/ORCH_001_BREAK_RUNBOOK.md`
- `operations/handoffs/BREAK_SESSION_2_HANDOFF.md`
- `operations/receipts/BREAK_SESSION_20260722/SESSION.md`, `CARD-RESULTS.md`
- `operations/receipts/BREAK_TEST_RIGOR_REVIEW_FABLE_001/RECEIPT.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md`, `ODS_SECURITY_CASES.md`, `COLD_DROP_BAR.md`, `CHARTER.md`
- `operations/proposals/NOTED_STOP_THE_LINE_001/HARD_GATES.md`, `LIES_BY_OMISSION.md`, `WAIVER_PROTOCOL.md`, `PRODUCTIVITY_TAX.md`
- `WHY_NOT_TO_TRUST_THIS_PROJECT.md`, `NEXT_ACTION.md`, `STATUS.json`

Code / tree (grep + read only, no live probe, no exploit, no third-party contact):
- `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx` (sandbox `:125`; incoming source-check `:33`; outgoing `postMessage(...,'*')` `:55–72`)
- `products/noted-host/src/bridges/nexusHostBridge.ts` (`postMessage(...,'*')` `:139`; `fromTarget` `:176`; `makeReceipt` `:49`; `diagnostic.ping` `:118–122`; `UNTRUSTED_SOURCE` `:199,203`)
- `products/noted-host/src/diagnosticExporter.ts` (`FROZEN`/`UNFREEZE` header `:4`; `.startsWith('verse-studio:')` `:163`)
- `products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html` (CDN `:27,6309`; `BROWSER_DIRECT` `:2214`; `DEFAULT_PROXY` `:2215`; proxy fallback `:2253`; `PROXY_REQUIRED` `:14540`)
- `products/noted-host/electron/main.cjs` (`setWindowOpenHandler`/`shell.openExternal` `:50`; `contextIsolation`/`sandbox` true `:33,35`)
- `products/noted-host/public/nexus/block-registry.json`, `public/nexus/os/Nexus_OS.html` (checked for v0.12 references — none)
- `products/noted-host/package.json` (scripts), `products/noted-host/src/studios/diagnostics/odsCases.ts` (checked for ODS-SEC — none implemented)
- `.github/workflows/nexus-audit.yml` (CI step list)

## 2) Coverage matrix

Verdict key: **OK** = adequately carded; **GAP** = no real probe / no achievable evidence path; **STALE** = doc describes a state the tree no longer matches; **WEAK** = carded but the card can't turn the gate green.

### Threats (T-01…T-14)

| ID | Covered by | Evidence class today | Launch-blocking? | Verdict |
|----|------------|----------------------|------------------|---------|
| T-01 | CARD-04 (+05–09 adjacent) | SOURCE_TRACED only; sandbox `allow-same-origin` confirmed at `NexusAgentStudio.tsx:125`. Live reach **never run** (session 1 skipped it) | **Yes (G-01)** | **GAP** — highest severity, only tested by a manual devtools card the non-coder is told to skip; will sit UNKNOWN forever |
| T-02 | CARD-02 | EXECUTED (FOUND, session 1) | Yes (G-02) | OK (but no CSP sub-check — see CARD-13) |
| T-03 | CARD-03 | EXECUTED (FOUND, session 1) | Yes (G-03) | OK |
| T-04 | CARD-10 | EXECUTED clean today + SOURCE_TRACED for "no allowlist" | Yes (G-05) | OK, but allowlist gate unbuilt (ODS-SEC-005 spec-only) |
| T-05 | — none — | none | Yes (G-05 names it) | **GAP** — device fingerprint / consent has zero card |
| T-06 | CARD-01 | EXECUTED PASS; v0.12 absent, no registry/OS refs (verified) | Yes (G-04) | OK on launch path, but **sister docs STALE** (see §5) and evidence is a self-check not in CI (WEAK) |
| T-07 | CARD-11 | Observational only ("looks encrypted"); Wave D deferred | Maybe | **GAP** — no strength bar; card explicitly is not a crypto audit |
| T-08 | — none — | none | Yes (G-06) | **GAP** — approval-is-metadata never probed |
| T-09 | — none — (not built) | n/a | Future | GAP — nothing enforces the "re-check when stub grows teeth" trigger |
| T-10 | — none — | none | Yes (marketing) | **GAP** — public-repo vs private-design never blocks language; HUMAN_DECISION unresolved |
| T-11 | guardrail, not a target | n/a | n/a | OK (boundary, not a probe) |
| T-12 | — none — (regression watch) | none | Watch | GAP — positive control has no card to defend it |
| T-13 | ODS-SEC-008 (spec-only) | SOURCE_TRACED; `main.cjs:50` confirmed, `electron` **not** in package.json | Maybe (conditional) | **GAP** — ship-status question unanswered; no card |
| T-14 | ODS-SEC-007 (spec-only) | Untested | Yes-ish (audit gap) | **GAP** — no card; single `pending` slot unconfirmed live |

### Gates (G-01…G-07)

| ID | What could ever turn it GREEN | Reality today | Verdict |
|----|-------------------------------|---------------|---------|
| G-01 | ODS-SEC-001 **and** 002 PASS on shipped build | Neither case exists (odsCases.ts has no ODS-SEC). CARD-04 is a one-off manual poke, not a re-runnable case | **No achievable green path** |
| G-02 | SRI on every remote tag, or full vendoring | Still unpinned (`:27`) | RED, correctly |
| G-03 | Default proxy removed / hard opt-in | Still silent default (`:2253`) | RED, correctly |
| G-04 | v0.12 gone + refs gone + scrubbed sole entry, **or** waiver | Launch path clean (verified) **but** relies on `t06:quarantine-check` which is **not in CI**, and ODS-SEC-006 unbuilt | **WEAK** — green-eligible on a manual self-check only |
| G-05 | Allowlist + redaction shipped; fingerprint consent | No allowlist; fingerprint unconsented; T-05 uncarded | RED, and partly untestable |
| G-06 | Central enforce / fail-closed broker; pending queue not single-slot | No card, no probe | **RED with no test** |
| G-07 | Copy-audit receipt listing every surface | **Zero card exists** | **RED with no test** |

### ODS-SEC cases (001…008)

| Case | Implemented? | Consequence |
|------|--------------|-------------|
| 001–008 | **None** — `odsCases.ts` contains no ODS-SEC entries; all are spec-only in the proposal | Every gate whose GREEN condition is "ODS-SEC-00X PASS" is currently **impossible to satisfy by evidence** — only by waiver. Win-condition W3 is unmet. |
| 006 (T-06) | Spec-only | "Expected today: FAIL (both present)" is now **STALE** — files/refs are gone; the case, if built, would PASS |

### Cold-drop bar rows

| Row | Doc says | Truth on this `main` | Verdict |
|-----|----------|----------------------|---------|
| 1 — no stale unscrubbed Agent | **FAIL**, two v0.12 copies committed + cross-referenced | v0.12 **absent** from `public/`; no refs in `block-registry.json` or `Nexus_OS.html` | **STALE** — now passes on launch path (git history residual still exists, but the row is about shipped tree) |
| 2 — CDN vendored/disclosed | Partial | Still accurate (`:27` unpinned, disclosed in block README) | OK |
| 3 — export scope drift | Unknown → needs action | Still accurate (exporter frozen, no allowlist) | OK |
| 4 — crypto keys never exported | Pass | Accurate (SOURCE_TRACED via STRIP_FROM_EXPORT + prefix scope) | OK |
| 5 — no `.env`/secrets | Pass | Accurate | OK |
| 6 — no real keys embedded | Pass, needs human eyeball | Human eyeball still valid; the "v0.12's blob is synthetic" rationale is now moot (file gone) | Partly STALE |
| 7 — private-repo mismatch disclosed | Unknown | Still undisclosed to a cold-drop reader | OK (still open) |
| Footer | "W1 blocked on rows 1 and 6" | Row 1 now passes → footer STALE | STALE |

## 3) Top launch-stoppers the current test misses (ordered by how easily a launch could ignore them)

1. **The gates depend on tests that were never built.** Six of seven gates cite "ODS-SEC-00X PASS" as the only evidence path, but zero ODS-SEC cases are implemented (`odsCases.ts` has none). This means a gate can never turn green *by evidence* — only by waiver — and nothing forces the cases to be written. The subtle trap: the proposals repeatedly say "expected today: FAIL," which reads to a non-coder like "known and therefore acceptable." A launch can point at a documented, expected FAIL and treat the red as background noise. **A red you decided to expect is still red.**

2. **The single highest-severity threat (T-01) is only tested by a card the operator is told to skip.** CARD-04 requires browser-devtools fluency and its own text says "if you're not comfortable... skip this one and mark it UNKNOWN." For a non-coder operator that means it is skipped *every* session. There is no automated ODS-SEC-001/002. So the "raccoon with a key to the kitchen" (G-01's own words) is never actually tested, its result stays UNKNOWN, and UNKNOWN quietly reads as "not proven bad." The most dangerous item is the least testable by the person running the test.

3. **CI runs none of the product security self-checks.** `nexus-audit.yml` runs Python durability verifiers, `nexus doctor`, unittest, and `nexus verify` — it never runs `t06:quarantine-check`, `bridge:smoke`, or `ods:p0/p1`. The T-06 quarantine PASS that the entire runbook leans on (CARD-01 is a hard stop-the-line gate for every other card) is only checked when a human remembers to run it during a break session. Between sessions it can silently regress and no automated gate would catch it. This is exactly the "system grading its own homework" the docs warn about — and it's not even wired to run.

4. **Whole gates have no probe at all.** G-06 (approval enforcement, T-08), G-07 (language lockdown), plus threats T-05, T-10, T-13, T-14 have zero cards. G-07 in particular can never turn green because no copy-audit card exists — yet a cold drop needs G-07. A launch could sail past these because there's nothing to fail.

5. **Every live card runs against the Vite dev server, never the built output.** The runbook says "dev server generically" and tells you *not* to `npm run build`. A CSP header, a path rewrite, or an asset-inlining behavior that only differs in `dist/`/`preview` would never be seen. Strangers unpack the built drop, not your dev server.

6. **There is no CSP anywhere** (confirmed: no `Content-Security-Policy` in the Agent HTML or `index.html`). That amplifies T-01 and T-02 and has no card.

7. **The label rules let SOURCE_TRACED relax a gate.** The runbook says "SOURCE_TRACED is not weaker than EXECUTED." That's fine for *confirming a hole*, but it lets a "the code looks safe" read stand in for a re-runnable green case when clearing a gate. Gates should only be *relaxed* by EXECUTED evidence or a passing CI case; a read should only ever be allowed to *confirm* a red.

## 4) Proposed additions (actionable)

These are proposals only — `status_authority: NONE`. Append; do not renumber existing cards/T-IDs/gates.

### 4.1 New cards (CARD-12+)

**CARD-12 · Built-output parity (dev vs `dist`)**
- Goal (layman): confirm the holes we found in the dev server are the same (not worse) in the actual packaged app a stranger would unpack.
- Steps (synthetic): `npm run build` then `npm run preview`; re-run CARD-01 (quarantine), CARD-02 (CDN grep against `dist/`), and confirm the served Agent path in `dist` matches the scrubbed file.
- Expected today: parity — but **unverified**; this is a genuine unknown.
- Label rules: EXECUTED only if you built and inspected `dist`; otherwise UNKNOWN.
- Stop condition: if `dist` serves a *different* Agent file than the scrubbed one, stop and file FAIL.
- Gate links: G-01, G-02, G-04.

**CARD-13 · CSP presence**
- Goal: check whether anything restricts what scripts the Agent window may load/run.
- Steps: `grep -in "content-security-policy" products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html products/noted-host/index.html`.
- Expected today: **none** (confirmed by me) → FOUND, expected. Amplifies T-01/T-02.
- Label: EXECUTED. Gate links: G-01, G-02.

**CARD-14 · T-05 diagnostic fingerprint + consent**
- Goal: confirm what device fingerprint the diagnostic bundle ships and whether any consent/label precedes it.
- Steps: open a diagnostic bundle (as CARD-10) and inspect the `environment` block; grep the exporter for a consent gate.
- Expected today: fingerprint present, no consent label → FOUND. Gate links: G-05.

**CARD-15 · T-13 Electron ship-status + openExternal**
- Goal: answer the open question "does the desktop shell actually ship?" and, only if it does, whether `openExternal` filters schemes.
- Steps: confirm `electron` absence in `package.json` deps (I confirmed: absent); ask the operator/build-orchestrator whether any packaged desktop build exists. Only if yes: EXECUTED test of `window.open('file:///…')` per ODS-SEC-008.
- Expected today: shell appears **dormant** (not in deps) → mark PRESENT_UNREACHABLE unless a build says otherwise. Gate links: new G-08 (below) / T-13.

**CARD-16 · T-14 pending-import double-submit**
- Goal: confirm a second import request silently overwrites the first with no trace.
- Steps (safe): send two `prompt.snapshot.import.requested` envelopes back-to-back from the Agent frame's own console; observe whether the first preview vanishes.
- Expected today: silent clobber (untested). Gate links: G-06.

**CARD-17 · G-07 copy audit (the gate with no card)**
- Goal: list every public-facing "local-first / private / secure / your machine only" claim and map each to the asterisk L-01…L-06 requires.
- Steps: `grep -rin "local-first\|private by\|stays on your\|secure\|sovereign" products/noted-host README* products/nexus-blocks` and record each surface.
- Expected today: multiple unasterisked claims → FAIL until every surface is fixed and receipted. Gate links: G-07 (this is the *only* thing that can turn G-07 green).

**CARD-18 · T-10 public-repo disclosure**
- Goal: confirm whether a cold-drop reader is told the privacy docs describe a *private-repo* design that no longer matches reality.
- Steps: read the drop-root README / cold-drop entry for any note that `constitution/PRIVACY.md` / `NEXUS.json` assume privacy that the public repo breaks.
- Expected today: undisclosed → FAIL. Gate links: G-07, cold-drop row 7.

**CARD-19 · CI security-coverage probe (process card)**
- Goal: confirm whether CI runs the product security self-checks or whether they're manual-only.
- Steps: read `.github/workflows/*.yml`; check for `t06:quarantine-check`, `bridge:smoke`, `ods:p0/p1`.
- Expected today: **absent** (I confirmed) → FAIL. This is a test-of-the-test. Gate links: G-04, new G-08.

**CARD-20 · T-08 approval-enforcement design read**
- Goal: confirm whether any *central* mechanism enforces `defaultApproval`, or whether each channel hand-rolls its own gate.
- Steps: read `nexusBridgeRegistry.ts` `NEXUS_CAPABILITIES` and search for a single enforcement point.
- Expected today: metadata-only, per-feature gates → FOUND. Gate links: G-06.

### 4.2 Gate / GREEN-condition tightenings

- **All gates:** add — *"A GREEN condition that names an ODS-SEC case requires that case to exist and run in CI. A spec-only (unimplemented) case counts as RED, never as 'pending.'"* This closes the "gates depend on unbuilt tests" hole.
- **G-04:** add to GREEN condition — *"`t06:quarantine-check` runs in CI on every push, not only during manual break sessions."* A manual self-check is not a durable green.
- **New G-08 — Security checks actually run (meta-gate):** RED while any product security self-check (`t06:quarantine-check`, `bridge:smoke`, `ods:*`, and any ODS-SEC case) is absent from CI. Blocks any "we test for this" claim and any cold drop. Rationale: without this, every other gate is a one-time manual assertion that can silently rot.
- **G-01:** add — *"A one-off manual devtools poke (CARD-04) does not satisfy G-01. Only re-runnable ODS-SEC-001/002 in CI, or permanent removal of Agent-from-host embedding, can."*

### 4.3 ODS-SEC case additions

- **ODS-SEC-009 (T-05):** exported `environment`/fingerprint block requires a consent flag or is omitted from stranger builds.
- **ODS-SEC-010 (CSP):** shipped Agent HTML carries a `script-src` CSP that excludes un-pinned remote origins.
- **ODS-SEC-011 (build parity):** the file served as the Agent in `dist/` equals the scrubbed file and no other Agent lineage is present.
- **ODS-SEC-012 (CI coverage):** a meta-check asserting the security suite is wired into CI (defends G-08).
- Plus: **implement 001–008 for real** — until then they are IOUs, not tests. Mark each in the spec as `UNIMPLEMENTED = RED` so nobody reads "expected FAIL" as "fine."

### 4.4 Evidence-label rule changes (add to runbook §0)

- **R1 — Direction rule:** SOURCE_TRACED may *confirm a hole* but may **never relax a gate**. Moving a gate toward GREEN requires EXECUTED evidence or a passing re-runnable CI case. (Fixes the "SOURCE_TRACED not weaker" abuse.)
- **R2 — UNKNOWN on a High-severity item = FAIL for launch purposes.** An unrun H-severity card is a red, not a neutral. Silence is not a pass. (The handoff says this; the runbook labels don't.)
- **R3 — "Expected FAIL" is not evidence of acceptability.** A documented expected-FAIL is an *open red*; it may never be cited to justify a launch or a "known-and-fine" downgrade.
- **R4 — Self-report is weak evidence, and must be labelled `SELF_REPORT`.** A green `t06:quarantine-check`, a clean export, or a code comment asserting safety is the app grading its own homework — record it, but it can't clear a gate on its own.

### 4.5 Operator launch-veto checklist (paste-ready, ≤ 20 lines)

```text
LAUNCH / COLD-DROP / "SAFE ENOUGH" VETO CHECKLIST  (status_authority: NONE)
Refuse the drop / the claim / Phase-3-as-real if ANY line is true:

[ ] G-01 not GREEN by a re-runnable CI case  -> T-01 (Agent reads host storage) untested
[ ] G-02 red  -> Agent still loads unpinned CDN code from the internet
[ ] G-03 red  -> keys+prompts still default through corsproxy.io with no opt-in
[ ] G-04 green only via a MANUAL quarantine check (not in CI)
[ ] G-05 red  -> diagnostic export has no allowlist, or fingerprint has no consent
[ ] G-06 red  -> approval is still per-feature metadata, no central fail-closed enforce
[ ] G-07 red  -> README/UI still says "local-first / private / secure" with no asterisk
[ ] Any ODS-SEC case is still spec-only (unbuilt) but cited as a gate's green path
[ ] CI does not run t06:quarantine-check / bridge:smoke / ods checks (G-08)
[ ] The claim rests on SOURCE_TRACED or "expected FAIL", not EXECUTED / green case
[ ] The build (dist/preview), not just the dev server, was never tested
[ ] Any active waiver is expired, or bulk-waives more than one gate
[ ] The drop does not disclose: anonymous non-coder operator + public-repo privacy mismatch
[ ] Anyone is calling multi-AI agreement (Grok+Fable+Codex) "independent" corroboration

If every box is clear AND a signed per-gate waiver covers each remaining red -> a
human may decide. Nothing above sets ACTIVE by itself.
```

## 5) Staleness / contradictions found

- **T-06 across three docs is stale.** `THREAT_MODEL.md` T-06 ("two committed copies … block-registry.json still lists … Nexus_OS.html still lists"), `ODS_SECURITY_CASES.md` ODS-SEC-006 ("Expected today: FAIL (both present)"), and `COLD_DROP_BAR.md` row 1 ("FAIL … two copies still committed, still cross-referenced") all describe a pre-PR-#66 tree. On this `main`: no `nexus-agent-v0.12*` file exists under `public/`, and no v0.12 reference exists in `block-registry.json` or `Nexus_OS.html`. CARD-01 (runbook) already reflects the fix; the sister docs were not updated. **Contradiction:** the same repo simultaneously says T-06 is FAIL (proposals) and PASS (runbook + session-1 receipt). A launch reviewer could cite whichever suits them. *(The git-history residual bytes remain — that non-claim is still true and should stay.)*
- **COLD_DROP_BAR footer** "W1 blocked on rows 1 and 6" is stale now that row 1 passes on the launch path.
- **Line-number drift** (docs say "re-verify before acting" — several have drifted): CARD-05 cites `NexusAgentStudio.tsx:72` and `nexusHostBridge.ts:144` for the `postMessage(...,'*')` sites; actual are `:55–72` and `:139`. THREAT_MODEL T-01 cites the sandbox at a matching `:125` (still correct). None of the drifts change the finding, but they will slowly erode trust in the cards if left.
- **G-04 vs reality:** G-04's GREEN condition is essentially met on the launch path, but the gate table still implies RED and there is no receipt promoting it — and it *should not* be promoted while its only evidence is a manual self-check outside CI (see G-08).

## 6) Explicit VETO list

Things the operator should refuse until the item is green-by-evidence or covered by a signed, unexpired, single-gate waiver:

- **VETO-01:** Any "local-first / private / your notes stay on your machine / secure" language while G-01, G-02, G-03 are red. (L-01, L-02.)
- **VETO-02:** Any cold drop while G-07 has no copy-audit card run (CARD-17) and T-10 disclosure (CARD-18) is missing.
- **VETO-03:** Treating any gate as green because its ODS-SEC case is "expected FAIL / known." Expected-FAIL is an open red (label rule R3).
- **VETO-04:** Treating T-06 as closed beyond the launch path, or citing the stale "expected FAIL" ODS-SEC-006 either direction — reconcile the docs first.
- **VETO-05:** Any "we test for this" or "quarantine holds" claim while CI runs none of the security self-checks (G-08 / CARD-19).
- **VETO-06:** Phase 3 broker as anything but a stub-labelled-dangerous while G-06 (T-08) has no probe.
- **VETO-07:** Relaxing any gate on SOURCE_TRACED or self-report evidence (label rules R1, R4).
- **VETO-08:** Any claim that Fable + Grok + Codex agreement corroborates a finding — same account, same/related model families, not independent.
- **VETO-09:** Launch decisions based on the dev server only; require the built `dist`/`preview` (CARD-12).
- **VETO-10:** Accepting UNKNOWN on T-01 (or any H-severity item) as neutral — it counts as FAIL for launch (R2).

## 7) What Fable deliberately did *not* do

- Did not run CARD-04 or any live storage-reach / bridge / key-storage probe (that is Session 2, a different seat).
- Did not implement any fix — no CDN vendoring, no sandbox change, no allowlist, no CSP, no CI edit, no doc de-staling (only *flagged* the stale docs; edits are the operator's call).
- Did not touch frozen files, receipts, snapshots, or Session-1 evidence bytes.
- Did not contact `cdn.tailwindcss.com`, `corsproxy.io`, or any third party; all checks were local grep/read.
- Did not promote any round, gate, or status; did not set ACTIVE.

## 8) Non-claims

- Not a pen-test, not a security audit, not a certification.
- Not independence — same GitHub account and Anthropic family as other Claude seats; agreement here corroborates nothing.
- Not ACTIVE; `status_authority: NONE` on this whole response.
- Not "tests pass ⇒ launch OK" — the opposite is the point: the tests as written could pass while the product is unsafe.
- Adding cards/gates here does not close any T-ID. Session-1 FOUNDs (T-02, T-03, bridge `*`) remain open. The permanent distrust register still applies after every gate goes green.

## 9) Next for operator (one of)

- **A) Merge this response only** — records the rigor gaps; changes nothing on `main`.
- **B) Open a bounded task** to (b1) de-stale T-06 in THREAT_MODEL / ODS-SEC-006 / COLD_DROP_BAR, (b2) add CARD-12…20 and G-08 to the runbook/gates, (b3) implement ODS-SEC-001…008 for real and wire the security suite into CI. Recommended next step; do it as its own scoped task, not folded into a break session.
- **C) Proceed to Session 2** (CARD-04 etc.) **with the §4.5 VETO checklist in force** so a green session cannot be read as launch clearance.
- **D) Human questions:**
  1. Does any packaged **desktop (Electron) build** actually ship, or is `electron/` dormant scaffolding? (Decides whether T-13 / ODS-SEC-008 is live or PRESENT_UNREACHABLE.)
  2. For the public-repo vs private-design mismatch (T-10, `HUMAN_DECISION_REQUIRED`): update the privacy docs to public reality, or add a loud cold-drop disclosure? Until you decide, VETO-02 stands.

---

*status_authority: NONE. This review is a map of where the test can lie to you, not a certification that anything is safe.*
