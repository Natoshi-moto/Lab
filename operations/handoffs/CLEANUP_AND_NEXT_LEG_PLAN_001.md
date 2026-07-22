# Plan — Cleanup → next research leg

**ID:** `CLEANUP_AND_NEXT_LEG_PLAN_001`  
**Date:** 2026-07-22  
**status_authority:** `NONE`  
**Author seat:** Grok (xAI) — operator-requested plan  
**Operator:** human, non-coder — merge authority only  
**Tracker spine:** https://github.com/Natoshi-moto/Lab/issues/63  

---

## 0) One-sentence goal

**Land every honesty artifact on `main`, kill contradiction and PR clutter, finish the break-evidence pass under the VETO list, then enter the next research leg only with a single written mission and explicit non-goals.**

---

## 1) Where we are (facts on the ground)

| Fact | State |
|------|--------|
| `main` tip (as of plan write) | Session 2 handoff + session 1 receipts already merged (#69 path) |
| Round | R016 — **do not promote R017** as “next” without separate decision |
| Stop-the-line / VETO culture | Adopted as planning doctrine; gates still mostly RED |
| BREAK session 1 | Done (CDN, proxy, postMessage `*`, T-06 quarantine PASS) |
| BREAK session 2 | Ready, not run (CARD-04 T-01 primary) |
| PR #70 | Fable test-rigor review — **open**; local branch may still need break-glass push |
| Whoopsie log | Local branch `grok/whoopsie-log-001` — **not on main yet** |
| Product security fixes | **Not authorized** |
| Permanent distrust | `WHY_NOT_TO_TRUST_THIS_PROJECT.md` still load-bearing |

### Open PR noise (cleanup targets)

| Bucket | PRs | Plan disposition |
|--------|-----|------------------|
| **Land now** | #70 (+ glass), Whoopsie PR | Merge after short skim |
| **Likely close as dupe** | #68 (session 1 receipts — already on main via #69) | Confirm, then close |
| **Park (comment + leave draft or convert to draft)** | #62 GITBRAID, #61 adversary block, #60 membrane | Not next leg unless operator reprioritizes |
| **Park BGEN tribunal stack** | #40–#49 drafts | Research shelf; do not merge as “done” |
| **Park ancient spine** | #22, #23, #24, #14 | Leave draft / close with “not current spine” note |
| **Deps** | #1 dependabot checkout | Optional later; not blocking research |

---

## 2) Definition of “cleaned up”

Cleanup is **done** when all of these are true:

1. **Honesty on main:** Fable rigor response + break-glass Opus quote + Whoopsie log live on `main`.  
2. **No double story on T-06:** threat model / ODS-SEC-006 / cold-drop bar match launch-path reality (v0.12 gone; history residual still noted).  
3. **Control plane points at one spine:** `STATUS.json` + `NEXT_ACTION.md` name the current phase (not a dead PR).  
4. **PR board is readable:** land / close-dupe / park — no mystery “is this active?”  
5. **VETO checklist is the launch language law** until waived per gate.  
6. **Session 2 receipts filed** (or explicitly deferred with a dated reason).  
7. **Next leg** has a one-page mission: in scope, out of scope, success evidence, non-claims.

Cleanup is **not**: green security gates, product fixes, cold drop, R017 promotion, or multi-AI “consensus.”

---

## 3) Phased plan

### Phase A — Land honesty (do first, same day)

**Owner:** Grok drive + operator merge  

| Step | Action | Done when |
|------|--------|-----------|
| A1 | Push break-glass commit to `fable/break-test-rigor-review-001` if still ahead of origin | `gh pr view 70` includes glass files |
| A2 | Operator skims #70 (response + §0A + VETO); **merge** | #70 merged to main |
| A3 | Push `grok/whoopsie-log-001`, open PR, operator merge | `Whoopsie log/` on main |
| A4 | Confirm #68 is redundant vs main; **close** with note | #68 closed |
| A5 | Point `STATUS.json` / `NEXT_ACTION.md` at Phase B/C (not stale “only session 2” if mid-cleanup) | Control plane matches plan phase |

**Non-goals for A:** no product code, no ODS implementation, no BGEN merges.

---

### Phase B — Kill contradictions (short doc PR)

**Owner:** one AI seat (Grok or Claude) + operator merge  

| Step | Action | Done when |
|------|--------|-----------|
| B1 | De-stale **T-06** in: `THREAT_MODEL.md`, `ODS_SECURITY_CASES.md` ODS-SEC-006, `COLD_DROP_BAR.md` row 1 + footer | All three agree: launch-path clean; history residual non-claim retained |
| B2 | Optional: fix known **line-number drift** in runbook CARD-05 cites if still wrong | Grep matches docs |
| B3 | Add Whoopsie entry if de-stale reveals more “we said both things” cases | Index updated |
| B4 | Merge as `docs/de-stale-t06-after-pr66` (name flexible) | On main |

**Non-goals for B:** do not implement ODS-SEC; do not flip gates to GREEN by prose alone.

---

### Phase C — PR board hygiene (operator + drive chat)

**Owner:** operator (clicks) with a paste list from AI  

| Step | Action |
|------|--------|
| C1 | Comment on #62, #61, #60: `PARKED — not current spine; see CLEANUP_AND_NEXT_LEG_PLAN_001` |
| C2 | Comment on BGEN #40–#49: `PARKED shelf — Checkpoint 001 / no real-world value; not next leg` |
| C3 | #22 / #23 / #24 / #14: convert to draft if open, or close with `not current spine` |
| C4 | Leave #1 dependabot alone unless CI is on fire |
| C5 | Single GitHub issue (or update #63) checklist of phases A–F |

**Done when:** a stranger can open “Pull requests” and see ≤3 active non-draft items on the research spine.

---

### Phase D — Finish break evidence under VETO (research evidence, not fixes)

**Owner:** Session-2 seat + operator terminal/browser  

| Step | Action | Done when |
|------|--------|-----------|
| D1 | Paste VETO checklist at session start (from Fable §4.5 / response) | Operator has it in chat |
| D2 | Baseline: `doctor` / `npm ci` / `t06:quarantine-check` | PASS or stop |
| D3 | **CARD-04** T-01 (synthetic, clean profile if needed) | Receipt with label; UNKNOWN on H-sev = launch red |
| D4 | If energy: CARD-06/07/08/09/11 per runbook | Receipts filed |
| D5 | Explicitly **do not** implement fixes | No “while we’re here” patches |
| D6 | Session summary + residual risk in plain English | Folder under `operations/receipts/BREAK_SESSION_<date>/` |

**Done when:** T-01 has EXECUTED or honest UNKNOWN-as-red; session closed without feature creep.

---

### Phase E — Test-hardening proposals only (optional before next leg)

**Owner:** bounded task PR — **docs/spec only** unless operator opens a build task  

Fable already proposed; **land as proposal text**, not as product:

| Step | Action |
|------|--------|
| E1 | Append CARD-12… (or agreed subset) + label rules R1–R4 to runbook |
| E2 | Add meta-gate **G-08** (security checks must run in CI) to HARD_GATES proposal |
| E3 | Mark ODS-SEC-001…008 as `UNIMPLEMENTED = RED` in ODS_SECURITY_CASES |
| E4 | **Do not** implement Playwright/CI yet unless operator says “open build task B3” |

**Done when:** next seat cannot “forget” the holes Fable found; still no false GREEN.

---

### Phase F — Human decisions (unblocks classification)

**Owner:** operator only — one line each  

| ID | Question | Effect |
|----|----------|--------|
| F1 | Does **Electron** ship, or is `electron/` scaffolding? | T-13 live vs PRESENT_UNREACHABLE |
| F2 | Public-repo vs private-design privacy: **rewrite docs** vs **loud cold-drop disclosure**? | T-10 / G-07 path |
| F3 | Next research leg pick (see §5) | STATUS + NEXT_ACTION rewrite |

File answers under `operations/receipts/OPERATOR_DECISIONS_<date>/` or a short DEC note if you want formality.

---

### Phase G — Declare “ready for next leg”

**Gate checklist (all required):**

```text
[ ] A complete (honesty on main)
[ ] B complete (T-06 story one version)
[ ] C complete (PR board readable)
[ ] D complete or dated deferral on #63
[ ] E optional but recommended before any “we test security” claim
[ ] F1–F3 answered or explicitly “defer with reason”
[ ] VETO list still law for launch language
[ ] No ACTIVE / no real-world value endorsement
[ ] NEXT_ACTION names exactly one next-leg mission
```

Only then rewrite:

- `STATUS.json` → mode e.g. `RESEARCH_LEG_<NAME>_READY`  
- `NEXT_ACTION.md` → single operator action for that leg  

---

## 4) What “next leg of research” can mean (pick one)

Do **not** run these in parallel. Pick **one** primary.

### Leg option 1 — **Membrane evidence → minimal fix loop** (Recommended if goal is “Noted can be honest”)

```text
Mission: close the evidence bar for T-01/T-02/T-03 one at a time:
  probe (done/in D) → bounded fix task → same probe green → receipt
```

- Start with **T-01** (sandbox / origin split) only after D has a real EXECUTED result.  
- Still synthetic. Still no cold-drop marketing.  
- Hardest engineering; highest product integrity.

### Leg option 2 — **Test system becomes real** (Recommended if goal is “never grade our own homework”)

```text
Mission: implement ODS-SEC-001/002 + wire t06:quarantine-check + bridge:smoke into CI (G-08)
```

- No product “security theater” UI.  
- Makes gates *possible* to green by evidence.  
- Pairs well after E.

### Leg option 3 — **Simulator / creature economy host** (Noted Project OS direction)

```text
Mission: advance Noted as the system the sim is designed IN/FOR — Phase N only as written in CANONICAL_DIRECTION
```

- **Only if** stop-the-line matrix is waived or gates allow that work.  
- Default matrix: more Agent features need G-01/02/03 green or waived.  
- Without waiver, this leg is **blocked** — by design.

### Leg option 4 — **BGEN / protocol thesis shelf work**

```text
Mission: continue Beneficial Genesis research under Checkpoint 001 (no real-world value)
```

- Merge only what is research-labeled.  
- Do not reopen as product money.  
- Fine as parallel *reading*; bad as *main* if membrane is still open.

### Leg option 5 — **Lab meta (custody / PCX / R017+)**

```text
Mission: only if operator explicitly wants foundation research over Noted membrane
```

- R016 is on main; R017 GITBRAID is a **draft** — not automatic next.  
- Treat as new programme with its own task JSON.

**Default recommendation for “next leg” after cleanup:**  
**Leg 2 (make tests real) in parallel spirit with Leg 1’s first fix only after Session 2** — but if operator energy is limited, sequence: **D → E → Leg 2 → Leg 1**.

---

## 5) Standing non-goals (entire cleanup + next leg until rewritten)

- Real money, tokens, NWC-as-product, investment language  
- Cold drop “safe for private journals” while G-01/02/03 red  
- Claiming multi-AI agreement is independent  
- Softening LIES_BY_OMISSION / HARD_GATES without operator rewrite  
- Force-push, secret commits, mutating frozen baseline  
- Implementing fixes inside a “break session” PR  

---

## 6) Operator paste cards

### Card — “Run Phase A landings”

```text
Execute CLEANUP_AND_NEXT_LEG_PLAN_001 Phase A only.
Push break-glass to PR #70 if needed; open/push Whoopsie PR;
prepare close note for #68 if redundant.
Do not merge without my OK. Report URLs.
```

### Card — “Run Phase B de-stale”

```text
Execute CLEANUP Phase B: de-stale T-06 docs only.
One PR. No product code. status_authority NONE.
```

### Card — “Session 2 under VETO”

```text
BREAK session 2 per BREAK_SESSION_2_HANDOFF.md.
VETO checklist in force. Synthetic only. No fixes.
Primary CARD-04. One step at a time for non-coder operator.
```

### Card — “Pick next leg”

```text
Propose STATUS/NEXT_ACTION rewrite for leg option N from
CLEANUP_AND_NEXT_LEG_PLAN_001 §4. Wait for operator choice of N.
```

---

## 7) Success picture (end state)

```text
main
 ├── honesty: Fable rigor + Opus glass + Whoopsie log
 ├── one T-06 story
 ├── PR board: spine clear, shelf parked
 ├── session 2 evidence filed (or deferred in writing)
 ├── VETO list still bites
 └── NEXT_ACTION: exactly one research leg mission
```

You are then **ready for the next leg** — not “secure,” not “launchable,” not “done.”  
Ready means: **no self-contradiction, no mystery work, one mission.**

---

## 8) Immediate next step after this plan is accepted

**Phase A1–A3.** Everything else waits.

---

*status_authority: NONE. This plan is a map. Operator merges and picks the next leg.*
