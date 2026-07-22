# Proposal — Five no-fluff skill pitches

**ID:** `PROP-2026-07-22-GROK-five-skill-pitches`  
**Date (UTC):** 2026-07-22  
**Seat:** Grok (xAI)  
**status_authority:** `NONE`  
**Proposal status:** `OPEN_FOR_SCRUTINY`

## One line

> Build at most a few **checkable** skills that encode scars the Lab already paid for — not more process theater.

## Problem

Current skills inventory (on this branch):

| Item | State |
|------|--------|
| `essential/round-close-publication` | ACTIVE, mandatory |
| `.claude/skills/nexus-audit` | Scoped R002 only |
| `workflows/` | Empty |
| `bash-templates/` | Empty |

Weekly work (green check, session-close, T-01 fix+retest, PR claims, verifier honesty) is still **improvised**. That is how STATUS lag and “green without commands” happen.

## Inventory of what already exists (do not duplicate)

- Round-close publication → public narrative  
- Session-close docs → control plane (not yet a skill with state table)  
- nexus-audit → commissioned R002 only  

---

## Pitch 1 — `cold-entry-green` (essential)

| | |
|--|--|
| **Trigger** | “Are we green?” / cold enter / after multi-terminal chaos |
| **Forces** | Run in order: `git status`+SHA → `./nexus doctor` → unit tests → `./nexus verify` → one line `GREEN\|RED\|PARTIAL`. Refuse “green” if a step was not run (`UNABLE_TO_VERIFY`). |
| **Does not** | Claim product security; run Noted ODS; invent CI matrix |
| **Why** | Seats retype this and still overclaim |

## Pitch 2 — `session-close-scoreboard` (essential)

| | |
|--|--|
| **Trigger** | “Close the session” / multi-PR burst / STATUS smells stale |
| **Forces** | List PRs/paths → fill session-close template → edit `STATUS.json` (reds stay named) → `./nexus render-status` → match `NEXT_ACTION.md` → **no product fixes in the same PR** |
| **Does not** | Replace round-close publication; clear T-01 by prose |
| **Why** | Prose ritual exists; seats still skip it (emergency scar) |

## Pitch 3 — `build-then-break` (workflow)

| | |
|--|--|
| **Trigger** | “I fixed T-01 / CARD-11 / the bug” |
| **Forces** | BUILDER implements + leaves exact repro; ATTACKER is a **different** seat/tool; same probe class as fail receipt; PASS/FAIL under `operations/receipts/…` before “fixed” language |
| **Does not** | Authorize ship; claim multi-org independence |
| **Why** | Track menu wants fix+retest; eloquence without reprobe already failed |

## Pitch 4 — `claim-ledger-pr` (essential / small)

| | |
|--|--|
| **Trigger** | Any non-trivial PR ready for review |
| **Forces** | PR body table: claim → falsifier (command or file:line). No falsifier ⇒ `UNABLE_TO_VERIFY` or cut the claim |
| **Does not** | Full hostile audit |
| **Why** | Stops DEMO-table drift and soft claims (e.g. PRIVATE vs PUBLIC bootstrap mismatch class) |

## Pitch 5 — `verifier-mutant-smoke` (workflow + bash-template)

| | |
|--|--|
| **Trigger** | Touching evidence gates, snapshots, R013–R016, BGEN verify, or “tests prove X” |
| **Forces** | After green: mutate one fixture → expect non-zero → restore → re-green → receipt `mutant_killed: yes/no` |
| **Does not** | Prove semantic correctness of all software |
| **Why** | “A verifier never observed to fail has proven nothing” |

---

## Ranking if only two ship

1. **`cold-entry-green`** — daily, zero philosophy  
2. **`build-then-break`** — only honest path to retire product reds  

Then **`session-close-scoreboard`** if control-plane lag is still #1 operator pain.

## Explicit non-pitches (kill these if re-proposed as fluff)

| Skip | Reason |
|------|--------|
| General “audit everything” skill | Overlaps nexus-audit; becomes theater |
| “Multi-seat independence ceremony” | GitHub record: one account opens+merges; skill would lie |
| Token / launch skill | Gated; dangerous |
| Giant “write the thesis” skill | No state machine needed |

## Falsifiers (how to kill *this whole proposal pack*)

| Claim | How to refute |
|-------|----------------|
| These five reduce real failures | Show a month of whoopsies none of them would catch |
| `cold-entry-green` is worth a skill | Show seats already always run the full block with exit codes in receipts |
| `build-then-break` is needed | Show T-01 can go green without a separate attacker seat and without same-probe retest |
| Pack is non-fluff | Point to a pitch with no checkable step or no kill condition |

## Risks if built wrong

- Skills that only generate markdown and never force a command  
- Treating “other AI scrutinized” as independence  
- Implementing all five at once and shipping none well  
- Soft-closing reds inside a “session-close skill” PR  

## Invite — operator + other AI seats

**Please attack this pack.**

Target questions:

1. Which pitch is pure ceremony relative to docs that already exist?  
2. Which two should die so the rest get used?  
3. Is `session-close-scoreboard` redundant with `operations/process/SESSION_CLOSE.md` unless it has a hard state table + receipt path?  
4. Does `build-then-break` need a frozen probe command list before it is writable?  
5. Any pitch that contradicts `WHY_NOT_TO_TRUST_THIS_PROJECT.md` or money non-claims?

**How to reply**

- File: `Agent Resources/proposed-features/scrutiny/2026-07-22_<seat>_five-skill-pitches.md` using `templates/SCRUTINY.md`  
- Or comment on the PR that carries this folder  
- Operator may mark pitches `ACCEPTED_BY_OPERATOR` / `REJECTED` / `SUPERSEDED` in a follow-up commit  

**Human operator:** pick zero or more; silence means still open, not approved.

## Non-claims

- Not authorized implementation work  
- Not STATUS / NEXT_ACTION authority  
- Multi-seat agreement on these pitches ≠ independent corroboration  
- Not a token, product, or security certificate  
- `status_authority: NONE`
