# SKILL TEMPLATE — copy this file to draft a new skill

Delete this comment block when you copy it. Fill every section; delete ones that
truly don't apply rather than leaving them blank — an empty section reads as
"forgot," not "not applicable."

---

```yaml
skill_id: <kebab-case-unique-id>
version: 0.1
status: DRAFT            # DRAFT | ACTIVE | RETIRED
last_used: <YYYY-MM-DD or "never">
roles_involved: [BUILDER, ATTACKER, DEBUGGER, VERIFIER, ...]
known_capable_tools: [Codex, Claude Code, Grok Code, ...]   # examples, not a requirement
one_line: <the single sentence the router matches on>
```

## When to use this

Plain language: what does the operator say, or what situation comes up, that
means "this skill applies"? Write it the way the request actually sounds, not
the formal name of the workflow.

## Preconditions

What has to already be true before Step 1 — a branch exists, a file is
downloaded, a specific tool is authenticated, etc. If none, say "None."

## Roles, not tools

Steps below assign a **role** (BUILDER, ATTACKER/REDTEAM, DEBUGGER, VERIFIER),
never a specific product. The operator fills each role with whichever capable
coding AI they have available or have credits for at that moment — Codex,
Claude Code, Grok Code, or anything else — and it can differ every time the
skill runs. Swapping which tool plays a role mid-workflow, including
mid-attempt after a failure, is expected and not itself a problem worth
flagging.

The one constraint that matters: **the same tool should not fill both
BUILDER and VERIFIER/ATTACKER for the same piece of work.** A build and its
own redteam from the same seat is not independent review — same logic as
the Lab's own same-family rule.

## Interruption & partial completion — assume this, don't wait for it

Treat "the tool ran out of credits, context, or otherwise stopped before
finishing" as the **default risk on every step**, not an edge case. A
step's own claim that it finished — "done," "pushed," "tests pass" — is
not evidence. Evidence is something checkable independent of the tool's
say-so: `git status`/`git log`/`git diff`, a test command actually run, a
file that actually exists.

Before advancing past any step:
1. Verify against real repo/tool state, not the pasted transcript's claims.
2. If work is uncommitted, unpushed, or partially applied, say so plainly
   and treat the step as **not complete** — don't advance to the next role
   just because output was produced.
3. Resuming after an interruption re-enters the **same step**, possibly
   with a different tool filling the same role, not the next one.
4. Never assume a prior step's output was pushed anywhere. Check.

## State recognition — read this before doing anything else

This is the part that makes the skill resumable cold. Do not skip it, and do
not guess when a paste doesn't clearly match a row — ask which step number
the operator is on rather than assuming.

| If the pasted text looks like... | That was the output of... | Next action |
|---|---|---|
| *(fingerprint — a distinctive phrase, file structure, or error shape)* | Step 1 | Go to Step 2 |
| *(fingerprint)* | Step 2 | Go to Step 3 |
| Operator says "starting fresh" / gives no prior context | — | Go to Step 1 |
| Output cuts off mid-sentence, claims "done"/"pushed"/"passed" with no checkable evidence attached, or operator says it ran out of credits/stopped | Possibly interrupted or self-reported only | **Verify against real repo state before doing anything else** — see Interruption section. Resume the *same* step, not the next one |
| Doesn't match any row | — | **Ask** which step this is, don't assume |

## Steps

Each step is self-contained. Never write "as shown above" or "using the file
from step 2" inside a copy-paste block — restate whatever's needed so the
block works pasted in isolation.

### STEP 1 — `<short name>`

**Role:** `<BUILDER | ATTACKER | DEBUGGER | VERIFIER>` — any capable tool the
operator currently has available/credits for.

**Copy exactly, paste as-is:**
```
<verbatim prompt or command text — nothing to fill in, nothing implied>
```

**What "done" looks like:** *(one line — shape of expected output, not its
content)* — plus **what checkable evidence proves it**, not just what the
tool says.

**Bring the output back here.** Paste it in and I'll verify against real
state, confirm the step, then give you Step 2 only.

### STEP 2 — `<short name>`

*(same shape as Step 1)*

---

### ⚙ Function-call step (I run this myself)

Some steps don't need the operator to paste anything anywhere — I execute
them directly. Mark these distinctly so it's never ambiguous whether the
operator needs to go copy something:

> ⚙ **I RUN THIS.** No paste needed from you — just say go, or tell me to
> hold if you want to review first.

## Exit / success criteria

How do we both know the skill is actually complete, not just "out of steps"?

## Known failure modes

Where has this broken before, and what's the recovery? Fill in as it happens
— this section is expected to be empty on a brand-new draft.

## Revision log

| Date | Change | Why |
|---|---|---|
| *(fill on first use)* | | |
