# Chronology and provenance — Beneficial Genesis economics record

**Task:** BGEN-EPISTEMIC-AUDIT-001 · **Subject:** `8349de7a5978be6a9984aa33fd59ba3725ebaaca` · **Authority:** none

All timestamps UTC, reconstructed from GitHub API metadata and the commit
graph, not from any package's own narrative. Commit times shown are the
recorded author dates (local offset +01:00 normalized where needed).

## Timeline

| When (UTC) | Event | Evidence |
|---|---|---|
| 2026-07-20 19:54:19 | Issue #33 opened: program roadmap; declares evidence lineage "43 agreements / 0 disagreements / 0 crashes" for the earlier technical retest | issue #33 body |
| 2026-07-20 19:55:39 | Issue #34 opened: BGEN-ECON-REDTEAM-001 task with 7 failure conditions and 3 allowed recommendations | issue #34 body |
| 2026-07-21 ~10:10 | `f45e946` Claude economics package added; `b588779` binds receipt | commit graph |
| 2026-07-21 10:12:11 | PR #35 opened (draft) with original recommendation `REJECT_OR_REDESIGN` | PR #35 createdAt; pre-repair FAILURE_CONDITIONS.md via `git show b588779` |
| 2026-07-21 10:17:09 | **Controlling adjudication** posted on PR #35 (REV-001…007, `INDEPENDENT_RECONSTRUCTION_REQUIRED`) — 4 minutes 58 seconds after the PR opened | PR #35 review 1 |
| 2026-07-21 10:21:38 | Issue #36 opened: Breaker task. Instructs the seat to **read the controlling review and independently address every REV item**, with a clean-room phase covering only PR #35 *changed-file contents* | issue #36 body |
| 2026-07-21 10:30:37 | Breaker `CLEANROOM_FREEZE.json` frozen; 72-file SHA-256 inventory of the unread Claude package (all 72 hashes verified correct by this audit); mechanism verdict `CONTINUE_WITH_CONDITIONS` already recorded pre-differential | CLEANROOM_FREEZE.json |
| 2026-07-21 10:32:48 | PR #37 opened (Grok Breaker), stacked on `claude/bgen-econ-redteam-001` | PR #37 |
| 2026-07-21 10:39:38 | Controlling adjudication accepts Breaker reconstruction "for package repair" | PR #37 review |
| 2026-07-21 10:41:09 | PR #37 merged into the PR #35 branch (`d8523b2`) | PR #37 mergedAt |
| 2026-07-21 10:41:50 | **Controlling repair contract** posted on PR #35: E-001…E-009, and a **"Required final disposition"** of `CONTINUE_WITH_CONDITIONS` / `ECONOMIC_GATE_PASS: false` — i.e. the final verdict was prescribed before the repair and retest were performed | PR #35 review 2 |
| 2026-07-21 10:42:03 | Issue #38 opened: repair task | issue #38 |
| 2026-07-21 ~11:12 | `00402a1` repair implemented; `a035890` receipt binding | commit graph |
| 2026-07-21 ~11:22 | `ded1a84` ("x", adds stray file `nonexistent`) and `838f7b9` (removes it) — operator noise, no package impact | commit graph |
| 2026-07-21 ~11:42 | `69b27a3` micro-repair (shared validator, `cap_then_renormalize` rename); `0cb2ec3` receipt binding (verified: touches only RECEIPT.json) | commit graph, `git show` |
| 2026-07-21 11:54:07 | PR #39 opened (Grok retest of repaired package at `0cb2ec3`) | PR #39 |
| 2026-07-21 11:58:35 | PR #39 merged into PR #35 branch (`de5dcd7`) | PR #39 mergedAt |
| 2026-07-21 12:00:24 | PR #35 merged to `main` → **subject commit `8349de7`** | PR #35 mergedAt |

Total elapsed time for the full economics cycle (initial package → controlling
review → "independent" breaker → repair → micro-repair → retest → merge):
**under 2 hours**.

## Provenance determinations

1. **Subject commits are bound correctly.** Every receipt's commit references
   were checked against the git graph: `b588779` (original submission),
   `d8523b2` (breaker merge), `a035890`/`69b27a3`/`0cb2ec3` (repair chain),
   `fa2e1f0`/`ef3c477`/`2ce6688` (retest chain) all exist with the claimed
   contents and parentage. The two-commit receipt-binding pattern
   (`repair_logic_commit` + follow-up binding commit) is accurate and the
   binding commits verifiably touch only the receipt file.

2. **Write scopes were respected.** Diffs of each task's commits stay inside
   the declared paths. Re-running both simulators at the subject produces
   zero byte diff, so committed results match committed code.

3. **Receipts accurately describe the commits they bind**, with one caveat:
   receipts record command summaries ("185 tests OK") without recording the
   dependency prerequisite (`npm ci`); in a fresh clone the lab suite fails
   environmentally until node modules are installed. Not a false claim, but
   a reproducibility gap in the receipts.

4. **Clean-room claims match the actual information exposure only at the
   file-content level.** The Breaker's CLEANROOM_FREEZE correctly inventories
   the unread Claude package (all 72 SHA-256 hashes verified by this audit)
   and its own disclosure honestly lists the controlling review as read
   pre-freeze. However, issue #36 *directed* the Breaker to address
   REV-001…007, which are themselves a detailed catalogue of the Claude
   package's alleged defects. The Breaker therefore knew, before its
   "independent" modelling, exactly which findings it was expected to
   confirm — and its pre-differential mechanism verdict
   (`CONTINUE_WITH_CONDITIONS`) matches the verdict direction implied by the
   controlling review it had already read. This is **directed verification
   with a file-level clean room**, not blind independent rediscovery. Later
   summary language ("independent reconstruction", "fresh different-family
   retest") is accurate about session/file state but invites overreading
   about conclusion-level independence.

5. **Later summaries accurately represent earlier evidence** in substance:
   issue #33's "43 agreements / 0 disagreements / 0 crashes" reproduces
   exactly (`node experiments/BENEFICIAL_GENESIS_RETEST_002/verify.mjs`), and
   the repaired package's descriptions of pre-repair defects were all
   verified against the actual pre-repair bytes (with-replacement lottery,
   missing renormalization, `true_economic_cost_borne_by_attacker = "0"`,
   "predicted — not merely possible" language, 6-of-7 failure-condition map).

6. **Failed/superseded conclusions remain distinguishable.** The original
   `REJECT_OR_REDESIGN` text is recoverable only from git history
   (`git show b588779:...`), but the repaired documents explicitly describe
   what was retracted and why, and receipts record
   `original_submission_commit`. Adequate.

7. **Provider diversity is asserted, not evidenced.** All issues, PRs,
   reviews, and merges were performed by one GitHub account (`Natoshi-moto`);
   commits are authored as "Natoshi-moto" or "Nexus Bootstrap". Branch
   prefixes (`claude/`, `grok/`, `codex/`) and receipt fields
   (`provider_model_label: "xAI Grok interactive CLI (grok-4.5 class)"`) are
   self-declared labels with no verifiable provenance (no signed commits, no
   session transcripts, no distinct accounts). The staged
   different-family-review narrative is *plausible* and internally
   consistent, but from repository evidence alone it is **unverifiable**, and
   AGENTS.md's own rule 9 (same-provider accounts are not automatically
   independent corroboration) cannot even be evaluated. Nothing in this audit
   assumes the labels are false; the point is that the record cannot prove
   them true.

8. **The controlling adjudications are the pivot of the whole record and
   have the weakest provenance.** They set REV-001…007, accepted the Breaker,
   prescribed E-001…E-009, and *prescribed the final disposition* before the
   repair happened. They are unsigned prose posted by the operator account
   within minutes of the artifacts they review (4m58s for a detailed
   line-referencing review of a multi-thousand-line package), with no seat
   receipt, no model label, and no stated method. Their technical content is
   high quality — this audit independently confirmed every implementation
   defect they alleged — but the record treats them as authoritative
   without ever subjecting them to the receipt/freeze discipline imposed on
   every other seat.
