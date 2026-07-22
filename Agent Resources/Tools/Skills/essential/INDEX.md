# Skills Index & Router

Read this first, in any session, before improvising a workflow from scratch
or before responding to a pasted output with no other context attached.

This applies **regardless of which AI is reading it** — Claude, Codex, Grok
Code, or anything else that lands in this repo. Skills here are written by
role (BUILDER, ATTACKER, DEBUGGER, VERIFIER), not by product name, so any
capable tool can pick one up mid-flight.

## How to use this — for whichever AI is reading it

1. **New request:** match it against the trigger column below. Open that
   skill file and follow its "When to use this" section to confirm the fit.
2. **Operator pastes output with no explanation:** do not ask them to
   recap. Do not assume prior steps ran correctly, and do not trust a
   tool's self-reported "done." Open the matching skill's *State
   recognition* table, match the pasted content against it, verify against
   real repo/tool state, state back in one line which step just finished,
   and give **only the next step**.
3. **Output looks interrupted, cut off, or claims completion with nothing
   checkable behind it:** default assumption is the underlying tool ran out
   of credits or context mid-step, not that it finished. Verify before
   advancing — see each skill's Interruption section.
4. **No skill matches:** proceed with the work normally. At session close,
   draft a new skill for it (see below) rather than letting the workflow
   evaporate.

## Index

| Skill | Trigger (what it sounds like when needed) | Path | Status |
|---|---|---|---|
| *(none committed yet)* | | | |

*This table is intentionally empty at draft time. The first row should be
the Codex-builds / Claude-Code-redteams workflow for Noted, once this
template is approved.*

## Session-close rule

Every session that does real work through a skill — or discovers a workflow
that should have been one — ends with **at least one** of:

- a **revision** to a skill that was used this session (a prompt that needed
  changing, a step that broke, a state-recognition row that didn't match
  reality), or
- a **new draft** for a workflow that isn't captured yet.

This is not optional busywork — it's the only thing that keeps this index
from going stale, and it costs context that would otherwise just be
discarded when the session ends.

## Subfolder map

- `essential/` — this router, and any skill used almost every session
- `workflows/` — heavier multi-tool workflows (build-then-redteam pattern
  and similar)
- `bash-templates/` — reusable parameterized command blocks, referenced
  *from* skills rather than standing alone
