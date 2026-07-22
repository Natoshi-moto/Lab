# Skills — reusable, resumable workflows

**Status: DRAFT — proposed, not yet in use. Review before anything gets built on top of it.**

## What this is for

A place to write down a workflow *once*, well enough that:

1. it can be reused without re-explaining it from scratch every session, and
2. it survives the operator forgetting everything except what's in front of them
   right now — including mid-workflow, after pasting one piece of output back.

That second property is the actual design constraint. It is easy to write a
workflow doc that works if the operator remembers what step they're on. It is
much harder — and much more useful — to write one that works if they don't.
Every skill file in this system is built around that harder case.

## Structure

```
Skills/
  README.md              — this file
  TEMPLATE_SKILL.md       — the shape every skill file follows
  essential/
    INDEX.md              — router: match a request to a skill, resume mid-flight
  workflows/               — multi-tool workflows (e.g. Codex builds, Claude Code redteams)
  bash-templates/          — reusable parameterized command blocks
```

- **`essential/`** holds the router and any skill used almost every session.
- **`workflows/`** holds heavier, multi-step, multi-tool skills — the Codex→Claude Code
  build-then-redteam pattern lives here once drafted.
- **`bash-templates/`** holds command blocks worth not retyping — not full skills,
  just parameterized snippets referenced *from* skills.

## Provider-agnostic by design

Skills assign **roles** — BUILDER, ATTACKER/REDTEAM, DEBUGGER, VERIFIER —
never a specific product. Codex, Claude Code, Grok Code, or anything else
capable can fill a role, and which tool fills which role is expected to
change run to run, including mid-workflow after an interruption. The one
fixed constraint: the tool that built something should not also be the one
that verifies or attacks it — same reasoning as the Lab's own same-family
independence rule.

Every skill also assumes, by default, that a step can die half-finished —
a tool running out of credits or context and not pushing its work is the
expected failure mode, not a surprise. Skills verify against real repo
state before trusting any tool's self-reported "done."

Every AI landing in this repo is pointed at `essential/INDEX.md` from
`AGENTS.md` (and `CLAUDE.md`) — reading it is part of entering the repo,
not an optional extra step.

## The rule this whole system exists to enforce

> If the operator pastes output back with no other context, treat it as if they have
> forgotten every instruction except the one that produced that output. Identify which
> step just finished from the pasted content itself, state it back in one line, and give
> **only the next step** — not a recap of the whole workflow, and never an assumption
> that earlier steps were run correctly just because this one produced output.

This is why every skill's step-by-step section is written as a **state table**, not a
script: the router needs to be able to look at arbitrary pasted text and say which row
of the table it matches, cold, without being told.

## Session-close rule (proposed)

Every session that runs real work through a skill should end with one of:
- a **revision** to the skill that was used (what broke, what prompt needed changing,
  what step was missing), or
- a **new draft** for a workflow that came up but isn't captured yet.

This costs nothing extra — it's context that would otherwise be discarded at session
end — and it's the only mechanism that keeps `essential/INDEX.md` from going stale.

## Non-claims

- Not validated yet — this is a proposed structure, first use will be the real test.
- Not a replacement for the Lab's own `operations/` receipt/task system — this is
  operator-facing workflow tooling, not a research governance record.
- A skill file is a **route**, not a source of truth about what actually happened —
  if a workflow's real history matters later, it belongs in `operations/`, not here.
