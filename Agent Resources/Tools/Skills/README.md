# Skills — reusable, resumable workflows

**Status: ACTIVE for essential router + `round-close-publication`. Other workflow slots may still be empty.**  
**status_authority:** `NONE`

## What this is for

A place to write down a workflow *once*, well enough that:

1. it can be reused without re-explaining it from scratch every session, and  
2. it survives the operator forgetting everything except what is in front of them right now — including mid-workflow, after pasting one piece of output back.

## Structure

```text
Skills/
  README.md                 — this file
  TEMPLATE_SKILL.md         — shape for new skills
  essential/
    INDEX.md                — router (MANDATORY read for every AI)
    round-close-publication.md
  workflows/                — multi-tool workflows
  bash-templates/           — parameterized command blocks

Agent Resources/proposed-features/   — AI feature pitches OPEN FOR SCRUTINY
  (not skills yet; operator accepts before build)
```

**Propose new skills/features:** [`../../proposed-features/README.md`](../../proposed-features/README.md)  
**Current open pack:** [`../../proposed-features/proposals/2026-07-22_grok_five-skill-pitches.md`](../../proposed-features/proposals/2026-07-22_grok_five-skill-pitches.md)
## Provider-agnostic by design

Skills assign **roles** (BUILDER, ATTACKER, DEBUGGER, VERIFIER, EVERY_AI_SEAT), never a locked product name. Swapping which tool fills a role mid-workflow is expected.

Constraint: the tool that **built** something should not be the only tool that **verifies or attacks** it for the same piece of work (same-family independence rule).

## Mandatory entry

Every AI landing in this repo is pointed at:

```text
Agent Resources/Tools/Skills/essential/INDEX.md
```

from root `AGENTS.md` (and `CLAUDE.md` / `README_START_HERE.md`). Reading the index is part of **entering** the repo.

### Mandatory skill in force

```text
essential/round-close-publication.md
```

At the end of every real work round, file a report under:

```text
communications/publications/rounds/
```

and add a row to `communications/publications/INDEX.md`.

## The resumability rule

> If the operator pastes output back with no other context, treat it as if they have forgotten every instruction except the one that produced that output. Identify which step just finished from the pasted content itself, state it back in one line, and give **only the next step** — not a recap of the whole workflow, and never an assumption that earlier steps were run correctly just because this one produced output.

Skills use **state tables**, not scripts that assume perfect memory.

## Relation to Lab governance

| Layer | Role |
|-------|------|
| Skills (this tree) | Operator/seat workflow routes |
| `operations/` | Tasks, receipts, audits |
| `communications/publications/` | Cumulative public seat reports |
| `STATUS.json` / session-close | Scoreboard authority |

A skill file is a **route**, not proof of what happened. History that matters as evidence belongs in `operations/` and/or publications.

## Non-claims

- Skills do not grant merge authority or status authority.  
- Following a skill does not make the product safe or independent.  
- An empty `workflows/` folder is honest emptiness, not a completed pipeline.
