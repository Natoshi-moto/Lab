```yaml
skill_id: round-close-publication
version: 1.0
status: ACTIVE
last_used: 2026-07-22
roles_involved: [EVERY_AI_SEAT]
known_capable_tools: [Claude Code, Codex, Grok Code, ChatGPT, any seat that mutates or reports work]
one_line: End every real work round by publishing a durable seat report under communications/publications/rounds/.
mandatory_for: ALL_AI_ENTRY
```

# Round-close publication (MANDATORY)

**status_authority:** `NONE`  
**Class:** essential skill — every AI that enters this repository must know this skill and must run it at the end of every real work round.

## When to use this

- You finished a **round**, **task**, **session of real work**, **audit response**, **break card**, **implementation PR**, or **operator-directed block**.
- The operator says “close the round,” “file what you did,” “session end,” “publish your report,” or pastes a finished diff/receipt with no next step.
- You are about to walk away or switch major tracks after producing checkable work.

**Do not skip** because the work was “only docs,” “only a review,” or “only one PR.” If it changed the repo or the operator’s picture of progress, publish.

**Do not use this skill as a substitute for** `operations/process/SESSION_CLOSE.md`. Session-close owns `STATUS.json` + `NEXT_ACTION.md`. This skill owns the **public cumulative narrative** of seat work.

## Why this exists (operator preference)

1. AI sessions evaporate. Git history alone does not explain *why* a seat did something in plain language.
2. Over months, `communications/publications/rounds/` becomes a readable evolution log beside the code.
3. Strangers (and future seats) can see claims, non-claims, and scars without reconstructing every PR.
4. Forces the seat to state **what was verified vs merely claimed** — same discipline as `AGENTS.md` item on `UNABLE_TO_VERIFY`.

## Preconditions

- You know the current round label from `STATUS.json` (`current_round`, e.g. `R016`) **or** you invent a clear slug if work is outside R-numbers (e.g. `BGEN`, `NOTED`, `ORCH-001`, `AUDIT`).
- You can write under `communications/publications/` (proposal branch is fine).
- You have **not** finished control-plane honesty if you also touched STATUS — still run session-close separately when required.

## Roles, not tools

Any seat may file. Prefer the seat that **did** the work. A different seat may file only if they **inspected** the work and label themselves as secondary reporter with limitations.

Same-provider or multi-seat agreement in a publication is **not** independent corroboration. Say so.

## Interruption & partial completion

If the round was cut off mid-work:

- Still file a report with `status: INTERRUPTED` or `PARTIAL`.
- List what landed vs what did not.
- Do not claim green tests you did not run.
- Resume later by **appending a follow-up report** (new file), not by rewriting the old one silently.

## State recognition

| If the pasted text looks like… | That was… | Next action |
|---|---|---|
| PR merged / branch ready / receipt paths listed / “done for this session” | Work product ready to close | Go to **Steps** (write publication) |
| Operator says “what did you do?” or “file the round report” | Explicit trigger | Go to **Steps** |
| Paste is only code with no narrative | Incomplete close | Ask for round id if missing; still draft report from git/diff |
| Session-close receipt only, no publication | Control plane closed, public log missing | **File publication now** |
| Report file already exists for this seat+round+day and work is *new* | Prior report | **New file** with new slug or `-02` suffix; do not overwrite |
| Operator starting fresh with a task | Not close yet | Do the task; return here at end |

## Steps

### Step 1 — Establish facts from the repo (not from memory alone)

Run or restate only what you can defend:

```bash
git rev-parse HEAD
git status --short
git log --oneline -15
# If you ran checks this round, restate exact commands and exit codes.
```

Record:

- `main` or branch tip SHA  
- Round / task ids  
- Paths and PR numbers if any  
- Checks actually run (or `UNABLE_TO_VERIFY` / not run)

### Step 2 — Copy the template

```text
communications/publications/templates/ROUND_REPORT.md
→ communications/publications/rounds/<ROUND_OR_TRACK>/<UTC-DATE>_<seat>_<slug>.md
```

Examples:

```text
communications/publications/rounds/R016/2026-07-22_grok_session-close-t0.md
communications/publications/rounds/NOTED/2026-07-22_claude_card-04-t01-fail.md
communications/publications/rounds/AUDIT/2026-07-22_grok_blind-lab-audit.md
```

### Step 3 — Write the report (minimum fields)

Fill every section in the template. Minimum content:

1. **What I did** — concrete actions and paths  
2. **Why** — operator goal or task authority  
3. **What I verified** — commands + outcomes  
4. **What I did not check** — explicit list  
5. **What changed in the project** — evolution note (even if small)  
6. **Non-claims** — no token, no product greenwash, no false independence  
7. **status_authority: NONE**

### Step 4 — Update the publications index

Edit `communications/publications/INDEX.md`:

- Add one row at the **top** of the ledger table (newest first).  
- Do not delete older rows.

### Step 5 — Commit on a proposal branch (unless operator directed otherwise)

Suggested commit subject:

```text
Publish round report: <seat> <round> <one-line>
```

Do **not** edit frozen snapshots, tags, or audit targets as part of publishing.

### Step 6 — Only then consider the AI round closed

A round is **not** closed for an AI seat until:

- [ ] Publication file exists under `communications/publications/rounds/…`  
- [ ] `INDEX.md` row added  
- [ ] If the session also required control-plane update: session-close ritual done or explicitly deferred with operator acknowledgment  

## Relation to other objects

| Object | Role |
|--------|------|
| This skill | Public cumulative seat narrative |
| `operations/process/SESSION_CLOSE.md` | Operator scoreboard honesty |
| `operations/receipts/` | Machine/evidence receipts |
| `Whoopsie log/` | Accidents and misses |
| `AGENTS.md` | Mandatory entry rules (points here) |

## Anti-patterns (forbidden)

- Closing a multi-PR burst with only a chat summary  
- Soft-closing T-01 / CARD-11 / other reds by eloquence in a publication  
- Claiming independence because another seat “agreed”  
- Overwriting a previous publication file to erase a scar  
- Putting secrets, real keys, or private identity in publications  
- Treating publication as STATUS authority  

## Non-claims

- A publication is **not** a security certificate.  
- A publication is **not** promotion to canonical truth.  
- Completeness of the archive depends on seats actually filing; absence of a report is a process scar, not proof nothing happened.

status_authority: NONE
