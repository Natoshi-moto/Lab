# Skills Index & Router

**status_authority:** `NONE`  
**Mandatory for every AI that enters this repository.**

Read this first, in any session, before improvising a workflow from scratch
or before responding to a pasted output with no other context attached.

This applies **regardless of which AI is reading it** — Claude, Codex, Grok,
ChatGPT, or anything else that lands in this repo. Skills here are written by
**role**, not by product name.

## How to use this

1. **Enter the repo:** also obey root `AGENTS.md`. This index does not replace it.
2. **New request:** match it against the trigger column below. Open that skill and follow its "When to use this" section.
3. **End of every real work round:** run **`round-close-publication`** even if no other skill matched. This is not optional.
4. **Operator pastes output with no explanation:** do not demand a full recap. Open the matching skill’s *State recognition* table, match the paste, verify against real repo state, state which step finished in one line, give **only the next step**.
5. **Output looks interrupted or claims “done” with nothing checkable:** verify before advancing. Resume the **same** step if incomplete.
6. **No skill matches for the *work*:** proceed with the task. At round close, still file a **publication report**, and optionally draft a new skill rather than letting the workflow evaporate.

## Index

| Skill | Trigger | Path | Status | Mandatory? |
|---|---|---|---|---|
| **Round-close publication** | End of any real work round/session/task; “file what you did”; before walking away after checkable work | [`round-close-publication.md`](round-close-publication.md) | **ACTIVE** | **YES — every AI, every real round** |
| Nexus R002 blind audit (Claude skill package) | Commissioned R002-shaped audit only | [`.claude/skills/nexus-audit/SKILL.md`](../../../../.claude/skills/nexus-audit/SKILL.md) | ACTIVE (scoped) | Only when audit is commissioned |

*Add new rows when skills graduate from DRAFT. Do not leave dead ACTIVE skills — retire or delete.*

## Retirement policy

- A skill with `status: RETIRED` stays in git history but is removed from this table’s active triggers (or marked RETIRED in-row).
- Prefer **improve** over spawn when two skills overlap.
- Prefer **kill** a draft that was never used over letting the index rot with empty promises.

## Session / round close (two different things)

| Ritual | Owns | Path |
|--------|------|------|
| **Round-close publication** (this index) | Public narrative: what the seat did and why | `communications/publications/` |
| **Session-close** (control plane) | `STATUS.json` + `NEXT_ACTION.md` honesty | `operations/process/SESSION_CLOSE.md` |

Both may apply to the same operator block. Neither replaces the other.

## Subfolder map

- `essential/` — this router + skills used almost every session  
- `workflows/` — heavier multi-tool workflows  
- `bash-templates/` — parameterized command blocks referenced from skills  
