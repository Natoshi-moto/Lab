# Handoff pack — BREAK session 2 (AI-agnostic)

**Date filed:** 2026-07-22  
**status_authority:** `NONE`  
**Operator:** human, non-coder, no CS training — copy/paste bus only  
**You:** any capable AI seat (Claude Code, Codex, Grok, ChatGPT, etc.)  
**Living spine tracker:** https://github.com/Natoshi-moto/Lab/issues/63  

Read this whole file before doing anything. Then follow §9 first actions.

---

## 0) One-sentence mission

Continue intentional, synthetic-only probing of Noted’s host↔Agent boundary (session 2 = harder cards), record evidence with honest labels, **do not implement “security fixes” unless the operator separately authorizes a fix task.**

---

## 1) Who the operator is (load-bearing)

- Cannot code; will not reliably relay half-remembered chat context  
- Approves merges; pastes full packets you give them; runs simple terminal blocks  
- Needs **one step at a time**, plain English, no jargon piles  
- Ring-0 authority for go/no-go, merge, waive, ACTIVE  

If you need a human decision: **stop** and ask one short plain question. Do not guess past scope.

---

## 2) What the Lab is (minimum)

- Public multi-AI research monorepo: `https://github.com/Natoshi-moto/Lab`  
- Local path often: `/home/anon/lab-adversary-pr`  
- `main` = accepted working state only after human merge  
- Proposals / PRs / AI agreement have **no** status authority  
- Never endorse real-world money/tokens/value  
- Multi-model agreement ≠ independent corroboration (track **model family**, not persona names)  
- Permanent distrust: `WHY_NOT_TO_TRUST_THIS_PROJECT.md`  

---

## 3) Story so far (what already happened)

### ORCH-001 cleanup (done on main)

| ID | What | PR / note |
|----|------|-----------|
| T1 | Green doctor / verify / 190 tests after `npm ci` | #64 merged |
| T2 | Re-synced `STATUS.json` + `NEXT_ACTION.md` away from stale PR #22 | #65 merged |
| T4 | Deleted shipped Agent **v0.12** + launch refs; `npm run t06:quarantine-check` | #66 merged |
| T5 | Break runbook with 11 cards + evidence labels | #67 merged |

### BREAK session 1 (done; receipts in this PR / folder)

Folder: `operations/receipts/BREAK_SESSION_20260722/`

| Card | Result |
|------|--------|
| CARD-01 T-06 recheck | **PASS** (v0.12 not shipped) |
| CARD-02 CDN unpinned | **FOUND** (expected) |
| CARD-03 default corsproxy | **FOUND** (expected) |
| CARD-05 postMessage `*` | **FOUND** |
| CARD-10 diagnostic bundle | **EXECUTED — clean UI keys today** |

Full validation bundle path (operator machine, may still exist):

`/home/anon/Downloads/noted-diagnostic-bundle-2026-07-22T02-39-42.json`

**Not claimed fixed:** T-01, T-02, T-03, bridge gaps. Finding them is success.

---

## 4) Where we are now

```text
Cleanup + runbook     DONE
Session 1 easy pokes  DONE
Session 2 harder pokes  ← YOU START HERE
Fixes                   NOT authorized yet
NWC / GITBRAID / BGEN money  PARKED (signal only)
```

**Round:** still `R016` (do not promote R017).  
**Mode (intent):** stop-line adopted, break-prep active.  
**Product under test:** `products/noted-host` (Noted) + scrubbed Agent `nexus-agent-v0.14-scrubbed.html`.

---

## 5) Your job in session 2

### In scope

1. Pull latest `main` (after this handoff PR merges, or stack on it).  
2. Re-run baseline: `./nexus doctor`, `products/noted-host` → `npm ci` if needed, `npm run t06:quarantine-check` (must PASS).  
3. Drive **CARD-04** first (T-01 same-origin / storage reach) per runbook — **synthetic only**.  
4. Only then, if operator agrees: CARD-06/07/08/09/11 as needed.  
5. Record every result under:

   `operations/receipts/BREAK_SESSION_<YYYYMMDD>/`

   using the template in the runbook §6.  
6. Use evidence labels exactly:

   `EXECUTED | SOURCE_TRACED | DECLARED_ONLY | PRESENT_UNREACHABLE | STUB_REFUSAL | CONTRADICTED | UNKNOWN`

7. Speak to the operator in **short plain steps** (one command or one browser action at a time).

### Out of scope (hard stop)

- Implementing T-01/T-02/T-03 “fixes,” CDN vendoring, Snooper UI, capability-registry productization  
- Importing NWC zip as product; building GITBRAID/CRL-BRAID continuity stack  
- Real API keys, real user content probes, third-party attacks, CDN abuse  
- Replacing scrubbed v0.14 with some other Agent lineage from Downloads  
- Promoting rounds; claiming ACTIVE/security cert; force-push; merge without operator  
- Renaming `verse-studio:*` keys  

### If operator only pastes a short “start session 2”

Treat this handoff + runbook as complete instructions. Start at §9.

---

## 6) Canonical documents (read order)

| Order | Path | Why |
|------:|------|-----|
| 1 | This file | Pickup |
| 2 | `operations/break-prep/ORCH_001_BREAK_RUNBOOK.md` | Cards, safety, labels |
| 3 | `operations/receipts/BREAK_SESSION_20260722/SESSION.md` | Session 1 story |
| 4 | `operations/receipts/BREAK_SESSION_20260722/CARD-RESULTS.md` | Session 1 evidence |
| 5 | `WHY_NOT_TO_TRUST_THIS_PROJECT.md` | Permanent non-trust |
| 6 | `operations/proposals/NOTED_SOVEREIGNTY_ASSAULT_001/THREAT_MODEL.md` | T-IDs (esp T-01) |
| 7 | `operations/proposals/NOTED_STOP_THE_LINE_001/HARD_GATES.md` | Gates |
| 8 | `products/noted-host/src/studios/nexusAgent/NexusAgentStudio.tsx` | iframe sandbox / agent path |
| 9 | `products/noted-host/src/bridges/nexusHostBridge.ts` | host postMessage |
| 10 | `AGENTS.md` | Seat rules |

Optional signal (not Lab authority): prior mining about bridge gaps, evidence labels, NWC as **test-vector ideas only**.

---

## 7) CARD-04 focus (session 2 primary)

**Layman goal:** Can the Agent chat window (iframe) read or write host notes/storage **without** going through the intended bridge checks?

**Threat:** T-01 (same-origin + `allow-same-origin` sandbox — see threat model).

**Rules for live probes:**

- Synthetic only; prefer a **clean browser profile** if operator has real notes  
- Never use real provider keys  
- Prefer document + minimal safe observation first (`SOURCE_TRACED`), then carefully `EXECUTED` steps from the runbook  
- If a step needs something that could destroy real data: stop and warn operator  

**Expected today (hypothesis):** residual risk is **high** until proven otherwise; do not soft-pedal.

**Done when:** receipt exists with label + commands + what was observed + residual risk stated.

---

## 8) How to work with the operator (bus protocol)

```text
AI  →  one short instruction block
Operator  →  runs it / pastes output
AI  →  interprets in plain English + next single step
```

End every work turn with:

```text
DONE: ...
EVIDENCE: EXECUTED | SOURCE_TRACED | ...
RECEIPT_PATH: ...
BLOCKERS: ...
NEXT_FOR_OPERATOR: ...
```

Open PRs for receipts; **operator merges** after review.  
Prefer branch names like: `seat/break-session-2-card-04`.

---

## 9) First actions for the new seat (do in order)

1. `git fetch origin && git checkout main && git pull origin main`  
2. Confirm files exist:  
   - `operations/break-prep/ORCH_001_BREAK_RUNBOOK.md`  
   - `operations/receipts/BREAK_SESSION_20260722/` (if missing, this handoff PR may not be merged yet — tell operator)  
3. `./nexus doctor`  
4. `cd products/noted-host && npm ci && npm run t06:quarantine-check`  
5. Tell operator in plain English: baseline OK or not  
6. Open CARD-04 in the runbook; give operator **one** first step only  
7. Continue until CARD-04 has a receipt  
8. Ask operator whether to continue session 2 cards or stop  

---

## 10) Paste packet for operator → new AI

Operator can paste the following block alone into a fresh AI session:

```text
You are picking up Natoshi-moto/Lab for BREAK session 2.

MANDATORY: Read and obey in full:
  operations/handoffs/BREAK_SESSION_2_HANDOFF.md

Also open:
  operations/break-prep/ORCH_001_BREAK_RUNBOOK.md
  operations/receipts/BREAK_SESSION_20260722/SESSION.md

Repo path (if present): /home/anon/lab-adversary-pr
Tracker: https://github.com/Natoshi-moto/Lab/issues/63

Operator is non-coder. One step at a time. Synthetic only. No fixes unless separately authorized.
status_authority: NONE.

Start at handoff §9. Primary card: CARD-04 (T-01). Record receipts under operations/receipts/BREAK_SESSION_<date>/.
When baseline is green, give the operator exactly one next command or browser action.
```

---

## 11) Non-claims (tattoo)

- Session 2 success ≠ secure product  
- FAIL on a hole = honest progress  
- PASS on a probe = that probe only  
- Self-report from the app about its own safety is weak evidence  
- Quarantine of v0.12 is launch-path only; git history still has old bytes  
- NWC FORMALIZED_CANDIDATE is unrelated shelf research unless operator reprioritizes  

---

## 12) Contact / continuity fields (fill at start of your turn)

```text
SEAT_NAME: <your product/family, e.g. Anthropic Claude Code / OpenAI Codex / xAI Grok>
MODEL_FAMILY: <OpenAI | Anthropic | Google | xAI | Other | Human>
MAIN_SHA_AT_START: <git rev-parse origin/main>
DIRTY_TREE: <yes/no>
DATE_UTC: <ISO date>
```

---

*End of handoff. If anything here conflicts with a newer human message from the operator, the human wins.*
