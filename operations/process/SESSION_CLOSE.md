# Session-close rule (T0)

**ID:** `PROCESS-SESSION-CLOSE-001`  
**Adopted:** 2026-07-22  
**status_authority:** `NONE`  
**Scar source:** Emergency stop / multi-terminal flow-state — receipts on main while STATUS lagged (see `EMERGENCY_STOP_AND_AUDIT_001.md`, Whoopsie entries).

---

## One sentence

```text
Receipt PRs may land evidence without rewriting the scoreboard.
A work session is not closed until a session-close updates STATUS.json + NEXT_ACTION.md
to match what actually landed (or explicitly records what is still open).
```

---

## Definitions

| Term | Meaning |
|------|---------|
| **Work session** | One continuous operator-directed block (one chat thread, one break session, one “land these N PRs” burst). Not wall-clock midnight. |
| **Evidence / receipt PR** | Adds handoffs, card receipts, whoopsies, experiment outputs, docs. **May not** be the only place that claims “we’re done” while STATUS still points at yesterday. |
| **Session-close** | A dedicated small PR (or final commit on the last PR of the block) whose **job** is control-plane honesty. |

---

## Rules

1. **Scoreboard owners:** Only session-close (or an explicitly labeled control-plane PR) should change:
   - `STATUS.json` → `STATUS.md` via `./nexus render-status`
   - `NEXT_ACTION.md`
2. **Evidence PRs:** Prefer **not** to touch STATUS/NEXT_ACTION unless the PR *is* the session-close. If a mid-session STATUS edit is unavoidable, the **session-close must still run** and may overwrite mid-session noise with the final truth.
3. **When to close:** Before the operator walks away, switches major track, starts a new multi-PR burst, or declares “done for now.” After any merge that changes what a stranger would think is “current.”
4. **What close must state:**
   - `main` SHA (or branch tip if pre-merge)
   - What landed (PR numbers / paths)
   - What is still red / open (do not invent zero defects if human-readable reds exist)
   - Exact next action id + one human sentence
   - Non-claims (no token, no product greenwash)
5. **Reds:** `open_defect_blocks: 0` does **not** mean “no product reds.” Keep `human_readable_reds` honest. Session-close must not soft-close T-IDs by eloquence.
6. **Whoopsie:** If STATUS was wrong mid-session and discovered later, file a Whoopsie (or note in close receipt) — do not rewrite history of evidence receipts.
7. **Size cap:** Session-close should be boring. Rule + STATUS + NEXT_ACTION + short receipt. Not a new research programme.
8. **Halt / clearance:** Session-close does not invent product launch authority or token authority. It only reports the true gate state.

---

## Minimal procedure (operator + seat)

```text
1. List merges / paths that landed this session.
2. git checkout main && git pull
3. MAIN_SHA=$(git rev-parse HEAD)
4. Fill operations/process/SESSION_CLOSE_TEMPLATE.md → save as
   operations/receipts/SESSION_CLOSE_<UTC-date>_<slug>/RECEIPT.md
5. Edit STATUS.json (last_completed_action, next_action_id, mode, reds).
6. ./nexus render-status
7. Edit NEXT_ACTION.md to match.
8. PR titled "Session close: <one line>"
9. Merge. Walk away or start the next *named* task only.
```

---

## Anti-patterns (forbidden)

- Five card PRs merged, STATUS still says “Phase B” or “backup pending”  
- `open_defect_blocks: 0` used as “we’re fine” while T-01 EXECUTED FAIL is on main  
- Session-close that “fixes” security in the same PR  
- Three seats each updating STATUS without a single close  
- Calling multi-AI agreement the closeout truth  

---

## Relation to other objects

| Object | Role |
|--------|------|
| `STATUS.json` | Machine scoreboard after close |
| `NEXT_ACTION.md` | Human next step after close |
| Evidence receipts | Append-only memory of what happened |
| Whoopsie log | When humans/seats missed the ritual |
| Research tasks | Start **after** close names them |

---

## Non-claims

- This ritual does not make the product safe.  
- This ritual does not replace audits or break probes.  
- A green doctor after close is not a security certificate.  

status_authority: NONE
