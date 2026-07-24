# Adversarial audit — recent cleanup + BREAK work (Codex)

- SEAT_NAME: OpenAI Codex
- MODEL_FAMILY: OpenAI
- MAIN_SHA_INSPECTED: `cd6500bf91d7c4ff5565fb7a440f2ab827d2d7af` (`HEAD` = `origin/main` at inspection start)
- DATE_UTC: `2026-07-22T05:32:09Z`
- status_authority: NONE
- independence_claim: NONE

## 0) Mission restatement (hostile one paragraph)

This audit assumes the recent cleanup and BREAK programme is capable of laundering an unsafe product story through tidy receipts, vivid labels, repeated AI agreement, and a stale dashboard. It attacks the work product, not third parties: whether the evidence proves what it says, whether the seats disclosed their continuity failures, whether merged paperwork was mistaken for repair, whether the proposed gates were actually used, and whether a non-coder operator could still be told “green” while the Agent shares storage with the host, remote code is unpinned, provider traffic defaults through a public proxy, some keys can rest in plaintext, receipts are forgeable, security cases do not exist, and the control plane says there are zero blocks.

## 1) Files actually inspected (paths only — no “the repo”)

- `README_START_HERE.md`
- `STATUS.json`
- `STATUS.md`
- `NEXT_ACTION.md`
- `WHY_NOT_TO_TRUST_THIS_PROJECT.md`
- `constitution/AUDIT.md`
- `constitution/AUTHORITY.md`
- `constitution/CANONICALITY.md`
- `constitution/EVIDENCE.md`
- `constitution/MUTATION.md`
- `constitution/PRIVACY.md`
- `constitution/ROUTING.md`
- `operations/handoffs/CLEANUP_AND_NEXT_LEG_PLAN_001.md`
- `operations/handoffs/BREAK_TEST_RIGOR_REVIEW_FABLE_001.md`
- `operations/handoffs/BREAK_TEST_RIGOR_REVIEW_FABLE_001_RESPONSE.md`
- `operations/handoffs/BREAK_SESSION_2_HANDOFF.md`
- `operations/receipts/BREAK_TEST_RIGOR_REVIEW_FABLE_001/BREAK_GLASS_OPUS_4_8_DOWNGRADE.md`
- `operations/break-prep/ORCH_001_BREAK_RUNBOOK.md`
- `operations/receipts/BREAK_SESSION_20260722/SESSION.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-RESULTS.md`
- `operations/receipts/BREAK_SESSION_20260722/NEXT.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-04.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-06.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-07.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-08.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-09.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-11.md`
- `operations/receipts/BREAK_SESSION_20260722/CARD-13.md`
- `Whoopsie log/README.md`
- `Whoopsie log/INDEX.md`
- `Whoopsie log/TEMPLATE.md`
- `Whoopsie log/entries/WHOOP-20260722-00.md`
- `Whoopsie log/entries/WHOOP-20260722-01.md`
- `Whoopsie log/entries/WHOOP-20260722-02.md`
- `Whoopsie log/entries/WHOOP-20260722-03.md`
- `Whoopsie log/entries/WHOOP-20260722-04.md`
- `Whoopsie log/entries/WHOOP-20260722-05.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/CHARTER.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/COLD_DROP_BAR.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/NEXT_ACTION.proposal.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/ODS_SECURITY_CASES.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/README.md`
- `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md`
- `operations/proposals/NOTED_STOP_THE_LINE_001/HARD_GATES.md`
- `operations/proposals/NOTED_STOP_THE_LINE_001/LIES_BY_OMISSION.md`
- `operations/proposals/NOTED_STOP_THE_LINE_001/PRODUCTIVITY_TAX.md`
- `operations/proposals/NOTED_STOP_THE_LINE_001/WAIVER_PROTOCOL.md`
- `products/noted-host/index.html`
- `products/noted-host/vite.config.ts`
- `products/noted-host/public/nexus/nexus-agent-v0.14-scrubbed.html`
- `products/noted-host/src/bridges/nexusBridgeTypes.ts`
- `products/noted-host/src/bridges/nexusHostBridge.ts`
- `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx`

GitHub PR metadata and file lists were also inspected for PRs #14, #22–#24, #60–#62, #68, and #70–#77. That is remote metadata inspection, not inspection of every file on every parked branch.

## 2) Executive kill-shot (≤10 bullets)

- The dashboard is lying by staleness. It says Phase B is ready to merge and Session 2 is next after both happened; it reports `open_defect_blocks: 0` and `open_assurance_blocks: 0` after an EXECUTED high-severity failure and while G-01 remains RED.
- The programme wrote nine new cards, four label rules, G-08, and a launch-VETO checklist, then did not promote them into the runbook. Session 2 selectively borrowed CARD-13 and some rhetoric; the governing test still cannot force the next seat to use the improvements.
- CARD-04 is the strongest recent evidence and the ugliest fact: synthetic live execution showed the Agent iframe can read and write host storage and read key material without using the bridge. No fix or green re-probe exists.
- CARD-11 proves plaintext storage only through the pre-activation persistence path. It does **not** prove the ordinary UI lets a user save a provider key before activation. Any headline dropping “pre-activation” is scope cheating.
- The danger is fragmented across receipts. Same-origin storage access, unpinned CDN code, absent CSP, default proxying, plaintext pre-activation keys, and forgeable receipts are individually documented, but no accepted control-plane object states their combined operator consequence.
- `CONTRADICTED` on CARD-06/07 corrects two bridge hypotheses; it does not make the bridge safe. A non-coder can easily hear a reassuring word and miss that a compromised genuine iframe passes the window-identity check honestly.
- The security gates cite ODS-SEC-001…008, but those runnable cases still do not exist. “Expected FAIL” remains prose, and G-01 has no evidence-based route to green today except future work or waiver.
- “Baseline green” is not durable. At the inspected SHA, `./nexus doctor` and therefore `./nexus verify` fail on `products/noted-host/node_modules`; the unit suite also contains a failing doctor test. Green depended on workspace state, not merely committed bytes.
- Phase C is comment hygiene, not cleanup completion. Parked PRs remain open and some contain product code and workflow changes; duplicate parking comments add noise while stale control files still claim Phase C is next.
- Fable/Opus/Grok/Codex agreement is not independence. Worse, the Fable review was initially packaged without the required mid-task downgrade disclosure; the later break-glass repair cannot partition which model produced which claims.

## 3) Coverage matrix

| Artifact / claim | Claimed | Evidence class | Verdict | Attack note |
|---|---|---|---|---|
| Cleanup plan baseline | A–G phased path from honesty cleanup to one next leg | DRAFT / SOURCE_TRACED plan | STALE | Useful map, but its “where we are” predates #70–#77 and was never closed out against final state. |
| Phase A / PR #70 | Fable rigor + break-glass landed | GitHub merge/file metadata + inspected files | PASS | Receipt/doc-only except control-plane edits. “Fable” alone is a false shorthand because delivery continuity broke. |
| Phase A / PR #71 | Whoopsie log + cleanup plan landed | GitHub merge/file metadata + inspected files | PASS | Honest artifact landing, not risk reduction. It also edited control files that immediately became stale again. |
| Phase A / PR #68 | Closed as duplicate of #69 | GitHub state, comments, file list | PASS | No unique content identified in the remote metadata inspected. |
| Phase B / PR #72 | T-06 launch-path story de-staled | GitHub merge/file metadata + source/doc reads | PASS | Correctly keeps git-history and no-CI residual. Control plane was edited but now falsely says this already-merged phase is pending. |
| Phase C / #60–#62, #14, #22–#24 | Non-spine work parked | GitHub draft state and parking comments | WEAK | Labels exist, but PRs remain open; duplicate comments create ceremony. Several parked PRs contain product code/CI, so “parked docs” is not an adequate mental model. BGEN #40–#49 dispositions were not individually re-read: `UNABLE_TO_VERIFY`. |
| Whoopsie 00–05 | Fuckups are recorded with ownership and residuals | Inspected self-reports linked to files/PRs | WEAK | Better than silence, but self-authored diary entries are not corroboration. Missing obvious new entries: stale control plane after Session 2; proposed safeguards not promoted; environment-dependent “green”; duplicate Phase-C comments. |
| Break-glass continuity | Fable start, Opus 4.8 delivery, unpartitionable output | Operator self-report + amended files + commit history | PASS | The required quote is present: “Opus 4.8 delivered what started off as Fable but got downgraded mid task due to the security concerns, I tried”. Cause mechanism beyond the operator account is `UNABLE_TO_VERIFY`. |
| Fable test-of-test diagnosis | Unbuilt ODS-SEC cases, missing CI, missing cards, label abuse | SOURCE_TRACED / differential review | PASS | Strong map, not independent review and not itself a gate change. |
| Fable CARD-12…20 proposals | New missing attacks defined | DRAFT | FAIL | Not added to the runbook. Only CARD-13 was opportunistically run from the response; CARD-12, 14–20 remain easy to forget. |
| Fable G-08 proposal | CI absence becomes a blocking meta-gate | DRAFT | FAIL | Mentioned parenthetically in G-04, but no actual G-08 exists in HARD_GATES. A reference to a proposed gate is not adoption. |
| Fable R1–R4 label rules | Prevent SOURCE_TRACED, UNKNOWN, expected FAIL, self-report laundering | DRAFT | FAIL | Not incorporated into the runbook’s label rules. Session-2 receipts cite some rules, but future seats are not bound by them. |
| Fable launch-VETO checklist | Session 2 begins under paste-ready launch vetoes | DRAFT / self-report | WEAK | Receipts cite selected VETOs; no session-level receipt proves the checklist was pasted and applied line by line. |
| Session 1 CARD-01 | T-06 launch-path quarantine PASS | EXECUTED self-check | WEAK | Supports launch-path absence only. Manual, outside CI, and current doctor failure shows workspace-sensitive checks rot. |
| Session 1 CARD-02 | Unpinned Tailwind CDN FOUND | EXECUTED grep + SOURCE_TRACED | PASS | Direct source recheck confirmed the tag. “Expected” does not reduce risk. |
| Session 1 CARD-03 | Default corsproxy path FOUND | EXECUTED grep + SOURCE_TRACED | PASS | Direct source recheck confirmed default and provider list. No third party was probed. |
| Session 1 CARD-05 | Host replies use `postMessage(..., '*')` | EXECUTED grep + SOURCE_TRACED | PASS | Direct source recheck confirmed wildcard target. This alone does not prove arbitrary sender acceptance. |
| Session 1 CARD-10 | Diagnostic sample clean today | EXECUTED operator-local sample | UNDERCLAIM | Narrowly honest, but the cited bundle was outside this checkout and was not available here: sample contents are `UNABLE_TO_VERIFY`. No allowlist remains the load-bearing risk. |
| PR #73 / CARD-04 | Same-origin Agent can read/write host storage and key material | EXECUTED synthetic Playwright + SOURCE_TRACED | PASS | Best evidence in the set. Dev server only, one browser/context, throwaway scripts not committed, built output still UNKNOWN. G-01 remains RED. |
| PR #74 / CARD-13 | No CSP in host/Agent/config | EXECUTED grep + SOURCE_TRACED | PASS | Direct local recheck found no CSP. Built/runtime header parity remains UNKNOWN. Receipt calls CARD-13 “runbook §4.1” although it lives in the Fable response, not the runbook. |
| PR #75 / CARD-06 | “No check at all” hypothesis contradicted by window identity | SOURCE_TRACED static read | PASS | Correct correction. Does not defend against code executing in the genuine iframe; origin string is still unchecked. |
| PR #75 / CARD-07 | Null target fails closed | SOURCE_TRACED static read | PASS | Static hypothesis contradicted; dynamic stale-window/reload race explicitly UNKNOWN. Headline “CONTRADICTED” can hide that unknown. |
| PR #76 / CARD-08 | No replay detection or payload ceiling | SOURCE_TRACED static read | PASS | Finding is credible but was not executed. Any “tested replay” phrasing would overclaim. |
| PR #76 / CARD-09 | Bridge receipts are forgeable plain objects | SOURCE_TRACED static read | PASS | Honest that this is downstream of compromised trusted-frame execution, not necessarily a separate root defect. |
| PR #77 / CARD-11 | Provider key plaintext at rest pre-activation | EXECUTED synthetic API-path probe + SOURCE_TRACED | WEAK | Persistence-layer FAIL is real. Normal pre-activation UI reachability and activated ciphertext behavior were not executed; both remain UNKNOWN/SOURCE_TRACED. |
| Receipt-only merge hygiene #73–#77 | Findings landed without product fixes smuggled in | GitHub PR file lists | PASS | File lists contain only receipt Markdown. This proves merge scope, not receipt truth. |
| Threat spine T-01/T-02/T-03 | High combined membrane and outbound trust risk | EXECUTED + SOURCE_TRACED, fragmented | UNDERCLAIM | Individual facts are stated; combined operator-facing blast radius is not load-bearing in STATUS/NEXT_ACTION. |
| G-01 | RED until shipped-build ODS-SEC-001/002 PASS/removal/waiver | Proposal + EXECUTED FAIL | PASS | Gate text stays RED. Yet the accepted control plane reports zero assurance/defect blocks, making the gate invisible at entry. |
| ODS-SEC-001…008 | Written safe invariants / future green path | DRAFT specs | OVERCLAIM | Calling these “cases” invites test connotations. They are not implemented runnable evidence. |
| `WHY_NOT_TO_TRUST_THIS_PROJECT.md` | Permanent distrust wall | Policy/prose | PASS | Strong and unusually honest. It cannot compensate for stale entrypoint state or enforce launch behavior. |
| `STATUS.json` / `STATUS.md` | Phase B ready; zero blocks | Generated/accepted control-plane declaration | FAIL | Factually stale after #72–#77 and materially misleading about known red gates and executed failures. |
| `NEXT_ACTION.md` | Phase C then Session 2 | Accepted control-plane declaration | STALE | Both Phase C parking comments and Session 2 receipts already exist. It sends the next seat backward. |
| Standard checks at inspected SHA | Doctor/tests/verify baseline green | Fresh local EXECUTED checks | FAIL | `doctor` FAIL; `verify` aborts on doctor; unittest includes `test_current_repository_doctor_has_no_errors` FAIL. Cause is installed `node_modules`, which is precisely why the earlier green claim is environment-qualified. |

## 4) Combined threat narrative (layman)

Today’s proven dev-path story is brutal: the embedded Agent is given the same browser identity as the host, so code running inside that frame can read and alter the host’s browser storage without asking the bridge; the frame also loads unpinned code from a public CDN and has no browser policy restricting scripts or connections; configured OpenAI/Groq/xAI/DeepSeek traffic defaults through a public proxy unless changed; in the observed pre-activation persistence state, a synthetic provider key was stored verbatim, and the host identity key is source-documented as raw plaintext; and bridge receipts are ordinary forgeable objects once code is already running in the trusted frame. A compromised Agent could therefore read or corrupt locally stored material, fabricate convincing bridge receipts, and use whatever network paths the browser permits. What is **not** proven: that activated provider keys remain plaintext, that the normal UI exposes pre-activation key saving, that any real key was taken, that the CDN or proxy is malicious, or that the same behavior was re-run against packaged `dist` output.

## 5) Process and epistemic failures

The Lab graded its own homework in four layers. First, it called prose-only ODS-SEC descriptions “cases,” then let hard gates cite those nonexistent tests. Second, it wrote stronger review rules but left them in a response rather than promoting them into the runbook or gates. Third, it merged honest red receipts without updating the accepted control plane, so the entrypoint displays zero blocks and an obsolete next action. Fourth, it treats local tool health as a baseline property while dependency installation itself makes doctor and verify fail.

Seat honesty improved only after failure. The Fable package initially omitted its mandated continuity break. The operator forced the later disclosure, and the record correctly says the body is `UNABLE_TO_PARTITION`. That means nobody may sell the response as pure Fable review. The later Opus receipts repeatedly say “independently re-verifies” while also denying independence; that wording is needlessly dangerous. Same-account and same-provider-family work is differential review, not corroboration.

Merge hygiene was narrow and good for #73–#77: only receipts landed. But paperwork did not fix a single risk. “FAIL is honest progress” is epistemically correct and operationally dangerous when STATUS does not carry the red consequence. Likewise, `CONTRADICTED` corrected overbroad bridge allegations, but a non-coder can easily mistake that label for safety. The receipts attempt to prevent this; the dashboard does not.

The Whoopsie log is partly load-bearing because it preserves embarrassing facts, especially the downgrade omission and T-06 dual story. It is also theater if it does not create a new entry when the exact failures recur. As of this baseline it omits: control-plane staleness after Session 2, Fable safeguards left unadopted, environment-dependent green claims, duplicate Phase-C parking comments, and CARD-13’s false runbook locator.

## 6) What was done WELL (begrudging, specific)

- CARD-04 used a fresh synthetic profile, recorded exact origin/storage observations, refused to dump full key bytes, bounded itself to dev output, and did not pretend the one-off probe could green G-01.
- CARD-11 stopped on plaintext, clearly separated provider keys from the identity key, and admitted the UI-reachability and activated-user gaps.
- CARD-06/07 corrected weak allegations instead of preserving scary claims for narrative convenience. Their residual risks were not erased.
- PRs #73–#77 were receipt-only by inspected GitHub file lists; no product patch was smuggled into evidence PRs.
- Phase B repaired the T-06 dual story while retaining git-history and no-CI caveats.
- The break-glass record includes the operator’s exact words and says `UNABLE_TO_PARTITION` rather than inventing model-boundary certainty.
- HARD_GATES and LIES_BY_OMISSION remain hard. No recent receipt claims G-01 green or calls documentation a fix.
- `WHY_NOT_TO_TRUST_THIS_PROJECT.md` tells the non-coder operator that acceptance is not expert verification and multi-AI agreement is not trust.

## 7) Residual unknowns and missing cards

1. **G-07 copy audit / CARD-17:** a launch can ignore every technical receipt if public copy still says “local-first,” “private,” or “safe” without the mandatory asterisk.
2. **Built output / CARD-12:** CARD-04 and CARD-11 used Vite dev. Whether packaged `dist` is equal, better, or worse is UNKNOWN.
3. **CI security coverage / CARD-19 and real G-08:** quarantine, bridge, and ODS security checks are not proven enforced on every change; G-08 is still only a proposal.
4. **Normal UI reachability for CARD-11:** whether a user can save a provider key before activation is UNKNOWN. Run both pre- and post-activation UI paths with synthetic keys.
5. **ODS-SEC implementation:** 001…008 remain specs, so the programme cannot show probe → fix → same probe green in a durable suite.
6. **T-05 / CARD-14:** diagnostic fingerprint content, consent, and future export allowlisting remain uncarded/unexecuted.
7. **T-08/T-14 / CARD-16 and CARD-20:** central approval enforcement and pending-import double-submit behavior remain SOURCE-level suspicions without live bounded probes.
8. **T-13 / CARD-15:** whether Electron actually ships is `UNABLE_TO_VERIFY`; if it does, `openExternal` and OS blast radius need a synthetic packaged-shell card.
9. **Dynamic bridge reload race:** CARD-07 explicitly left stale-window timing UNKNOWN.
10. **Browser/platform breadth:** CARD-04 is one Chromium execution. Cross-browser and extension/service-worker interactions are UNKNOWN.
11. **T-10 / CARD-18:** the current constitution says public visibility is reconciled, while the Fable proposal speaks of a public/private-design mismatch. The exact cold-drop disclosure gap needs a current entrypoint audit, not inherited wording.
12. **T-12 positive control:** there is no durable card defending the known-clean diagnostic sample against regression.

## 8) Explicit VETO additions (if any) beyond Fable’s list

```text
[ ] STATUS.json or NEXT_ACTION.md names a completed phase as current, or reports zero blocks while any launch gate is RED
[ ] A session cites a proposed card/rule/gate that was never promoted into the active runbook or HARD_GATES
[ ] “CONTRADICTED” is presented without the exact narrow hypothesis contradicted and every residual UNKNOWN beside it
[ ] A plaintext-key claim omits “pre-activation persistence path; normal UI reachability UNKNOWN; activated path not EXECUTED”
[ ] “Baseline green” lacks exact SHA, dependency/worktree state, commands, and current rerun results
[ ] A Whoopsie is marked closed because prose was added while the enforcement/test/control-plane failure remains open
```

## 9) Recommended next bounded tasks (no implementation)

1. **Control-plane truth audit (doc-only).** Success bar: propose exact `STATUS.json`/generated `STATUS.md`/`NEXT_ACTION.md` values that name Session 2 complete, G-01 RED, known open blocks, current doctor failure, and exactly one operator action. No risk may be called fixed.
2. **Built-output parity probe.** Success bar: synthetic `npm run build`/preview in a throwaway profile, then repeat the CARD-04 storage canary, CARD-13 CSP check, Agent lineage/quarantine check, and CARD-11 UI-path matrix against the built artifact; file exact commands and observations. Any later fix requires the same probe green.
3. **CARD-11 scope-closure probe.** Success bar: synthetic UI-driven pre-activation and activated flows, raw storage read after each, with no real key. A fix task, if later authorized, must fail closed before activation and pass the same UI probe afterward.
4. **Promotability review for Fable safeguards (doc-only).** Success bar: a proposal showing which of CARD-12…20, R1–R4, G-08, and VETOs belong in the active runbook/gates; explicit operator authorization required before mutation. Merely citing the response does not count.
5. **G-07/cold-drop copy audit (doc-only receipt).** Success bar: exhaustive path/line inventory of operator-visible privacy/local-first/safe claims with T-01–T-03 asterisk status; UNKNOWN for surfaces not inspected. No copy fixes folded into the audit.
6. **CI coverage evidence card (doc/read-only).** Success bar: exact workflow inspection showing which security commands run on which events. If absent, record FAIL. Any later CI fix must be followed by a red/green demonstration that a deliberate synthetic regression is caught.
7. **Approval/reload/Electron missing-card pack (proposal only).** Success bar: bounded synthetic steps, explicit stop conditions, and reachability preconditions for T-08, T-13, T-14, and CARD-07’s reload race. Electron is PRESENT_UNREACHABLE only with build/ship evidence; otherwise UNKNOWN.
8. **Whoopsie completeness audit (doc-only).** Success bar: append proposals for the missing process failures named in §5, each distinguishing “recorded,” “mitigated,” and “enforced.” A diary entry is not closure.

## 10) Non-claims

- Not a penetration-test certificate, security certification, or release clearance.
- Not independent corroboration. This Codex seat shares the operator account and AI-lab process; same-provider accounts and same-family seats are differential reviewers only.
- Not `ACTIVE`, not a gate promotion, and not authority to merge or fix anything.
- Not a claim that the activated crypto path is broken; it was SOURCE_TRACED, not executed here.
- Not a claim that a CDN, proxy provider, model provider, or third party acted maliciously.
- Not a claim that receipt-only merge scope makes the receipts true.
- Not a claim that this audit inspected every open branch or every BGEN PR. Where not verified: `UNABLE_TO_VERIFY`.
- “Merge audit” means accepted prose on `main`, not truth, repair, enforcement, or operator understanding.

## 11) Next for operator

**A) merge audit only.** This is the bounded next action that preserves the hostile record without pretending to repair anything.

**B) authorize control-plane refresh** should follow as a separate doc-only task because the current dashboard materially misleads the next seat.

Do **not** choose **C) open fix task for T-01 only** until the built-output and repeatable re-probe bar is written; otherwise fix pressure will produce another prose victory without durable evidence.

**D) stop and rest** remains valid. Nothing in this audit is ACTIVE, and urgency is not authority.
