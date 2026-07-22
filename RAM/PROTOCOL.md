# RAM protocol — seat-to-seat coordination

**status_authority:** `NONE`

## 1. Identity

Every post names:

| Field | Example |
|-------|---------|
| `seat` | `grok` / `claude` / `codex` / `chatgpt` / `other:<label>` |
| `utc` | ISO-8601 UTC |
| `tip` | `git rev-parse --short HEAD` if in a clone |
| `action_id` | short slug for this step |

## 2. Soft locks

**Before** editing a contended path or taking a multi-step task:

1. Check `RAM/locks/` for an open lock on that path/task.  
2. If open and **not stale** (< 2 hours UTC, or operator marked sticky): **do not stomp** — bus a `WAIT` or `REQUEST_RELEASE`.  
3. If free or stale: write `RAM/locks/<slug>.lock.md` with holder, paths, expires_utc.  
4. Update `BOARD.md` / `BOARD.json` `locks` list.  
5. On finish or abort: set lock status `RELEASED` or delete file + board row; bus `RELEASED`.

Stale lock rule: if `expires_utc` passed and holder tip is gone, **steal with bus note** `STOLE_STALE_LOCK` — never silent.

## 3. Bus messages (append-only)

Create:

```text
RAM/bus/messages/<UTC-compact>_<seat>_<slug>.md
```

Add a **newest-first** row to `RAM/bus/INDEX.md`.

### Message kinds

| kind | Meaning |
|------|---------|
| `CLAIM` | I am starting work; lock taken |
| `DONE` | Step finished; paths + SHA |
| `FAIL` | Step failed; do not build on it |
| `HANDOFF` | Next seat should continue; see handoffs/ |
| `WAIT` | Blocked on lock or operator |
| `RECOVERED` | Rebuilt state after crash/gap |
| `ALERT` | Operator chaos / conflict / do not merge yet |
| `REQUEST_RELEASE` | Please drop lock X |
| `NOTE` | Coordination note only |
| `EPISTEMIC` | Pointer to `communications/publications/epistemic/` filing |

Every message should include `semantic_class:` one of  
`OBSERVED | INFERENCE | OPERATOR_VERBATIM | PROPOSAL | RECEIPT | ALERT | HANDOFF`  
(see `docs/SEMANTIC_ROUTING_BRIDGE.md`).

### Minimum message body

```markdown
kind: DONE
seat: grok
utc: 2026-07-22T00:00:00Z
tip: abc1234
action_id: wire-ram
paths: [RAM/]
locks: [released:ram-bootstrap]
next: update BOARD
do_not: rewrite STATUS without session-close
```

## 4. Handoffs

For anything bigger than one message:

```text
RAM/handoffs/<UTC>_<from>_<to>_<slug>.md
```

Include: goal, done, not done, exact commands run, open risks, suggested next command.

## 5. Recovery (after crash, new seat, recording gap)

```text
1. git status && git rev-parse HEAD
2. Read user-disclosures/TODO_URGENT.md
3. Read RAM/BOARD.md
4. Read RAM/recovery/LAST.md if present
5. Read latest bus messages
6. Bus RECOVERED with what you believe is true
7. Only then start new work
```

Update `RAM/recovery/LAST.md` whenever you complete a meaningful action (overwrite is OK here — it is a pointer, not history; history is bus + git).

## 6. Anti-patterns (forbidden)

- Two seats editing `STATUS.json` without coordination  
- Claiming DONE without paths or tip  
- Holding locks across “I’ll be back tomorrow” without sticky + reason  
- Using RAM to soft-close product reds  
- Secrets in RAM (same rules as rest of public repo)  
- Treating RAM agreement as independent multi-party science  

## 7. Operator privilege

Operator may clear all locks and rewrite BOARD with a single bus `ALERT` note. Seats may not invent operator speech (use `user-disclosures/` for verbatim).
