# Owner Plain-Language Gate

**Status:** standing safety rule for the benefit of the human owner.
**Applies to:** every AI seat, every human collaborator, every automated agent.
**This rule does not outrank** `STATUS.json`, the constitution, or
`WHY_NOT_TO_TRUST_THIS_PROJECT.md`. It sits *in front of* the human-authorization
gate, not above the record.

## The rule, in one sentence

**Before anything can reach ANY safety gate — merge, approve, accept, publish,
push to `main`, delete, or any other irreversible or outward-facing step — the
owner must first be told, in plain layman terms, exactly what the action does and
what becomes irreversible, and must knowingly say the go word.**

No bare "yes/no?" No jargon-only summary. No assuming the owner already
understood. If the plain-language explanation was not given, the gate is not open.

## Why this exists (and why it is deliberately un-slick)

The owner is the sole human authority over what becomes accepted state, and is
**not** a career engineer. Actions have been authorized in the past that the owner
did not fully understand at the moment of authorizing them. That is a safety
defect in the *process*, not in the owner.

This gate fixes the process. It is intentionally blunt, repetitive, and
"patronising." That is the point. Looking professional in public is explicitly
**not** a goal here; the owner not accidentally authorizing something they did not
understand **is** the goal. Keep it plain even where the public can see it.

## What counts as a "gate" (explanation required BEFORE it)

- `merge` / `approve` / `accept` / "land it" / "make it official"
- `push` or `commit` **to `main`** (any direct write to accepted state)
- `publish` anything outward-facing (public post, release, external send)
- `delete`, overwrite, or force-anything
- any step that is hard to reverse or leaves the machine

## What is SAFE and does NOT need the gate

- `propose` / `draft` / open a branch / open a pull request
- `commit` or `push` **to a branch** (a draft off to the side)
- read, inspect, search, verify, run tests

These are reversible drafts. They change nothing that is official.

## The required explanation — the plain-language card

Before asking the owner to open a gate, the agent MUST state, in plain words:

1. **What I am about to do** — in one sentence a non-engineer understands.
2. **What actually changes** — what becomes official / public / gone.
3. **What becomes irreversible** — what cannot easily be undone afterwards.
4. **What is NOT affected** — reassurance about what stays untouched.
5. **The one word that triggers it** — e.g. "say *merge* and it becomes official."

Only after the owner reads that and gives the go word does the gate open.

## The one-line reminder to stamp everywhere

> **Nothing official happens until the owner is told in plain English what they
> are about to do, and says the word. Drafts are always safe; only the go word
> changes the record.**

## Non-claims

- This rule is a process guardrail, not a cryptographic control. It does not by
  itself prevent a mistaken authorization; it makes an *uninformed* one far less
  likely by requiring the plain-language step first.
- Following this rule does not certify that the underlying change is correct,
  secure, or complete. It only ensures the owner authorized it knowingly.
