# Operator handoff — state of the repo, in plain language

**For:** you (the operator) — a systems thinker who does not code and does not use GitHub day-to-day.
**By:** Claude Fable 5 seat, 2026-07-23.
**status_authority:** `NONE` — this is orientation, not canon. Nothing here promotes any claim.

This is written the way you think — in flows, boundaries, states and feedback loops — not in code. Read it once; you don't need to memorise it.

---

## 1. GitHub, translated into systems language

You already understand this machine; it just has unfamiliar labels. Here is the whole mental model:

| GitHub word | What it actually is | Your systems intuition |
|---|---|---|
| **repo** | the whole project as one versioned object | the system boundary |
| **commit** | one saved checkpoint of a change | a state transition, timestamped and signed |
| **main** | the one accepted, canonical state | the "true" current state of the system |
| **branch** | a parallel draft that isn't accepted yet | a proposed state, running in a side-channel |
| **push** | copy your local work up to the shared public server | publishing a state to the outside world |
| **pull request (PR)** | a formal request to fold a branch into main | a proposal entering the review gate |
| **merge** | accept a PR into main | the gate opening: proposal → canon |
| **tag / release** | a frozen, named point in history | a preserved snapshot you can always return to |

**The single most important rule in your repo:** `main` is truth; everything else is a proposal until a *human* (you) authorises a merge. Branches and PRs cannot promote themselves. Passing tests do **not** make something accepted. This is written into `CLAUDE.md` and it is the backbone that keeps the structure from breaking.

**Two irreversibility facts to hold onto:**
- **Pushing is publishing.** Once a branch is pushed to your repo (which is **PUBLIC**), the outside world can see it. Deleting it later does not un-see it.
- **Merging is accepting.** It moves something into the canonical spine that other documents point back to. It's reversible in git, but the fact that it was accepted is on the record.

---

## 2. Are the fundamentals healthy? Mostly yes.

I ran the actual checks this session. Honest scorecard:

| Fundamental | State | Plain meaning |
|---|---|---|
| Test suite | **Healthy** (190 pass) | The core logic does what it says — *after* one setup step (below). |
| Build | **Healthy** | The Noted app compiles cleanly. |
| Verifiers (`nexus doctor` / `verify`) | **Healthy and honest** | They *fail loudly* when you corrupt a snapshot or plant a fake secret. A guard that is seen catching a real problem is worth far more than one that only ever says "PASS". Yours catch. |
| Secrets in history | **Clean** | No real credentials found. The only matches were fake placeholders inside audit examples. |

**The one setup gotcha (not a bug):** on a fresh copy, 11 tests fail until you run the dependency install (`npm ci`). It's a missing math library, nothing more. Anyone testing a clean clone must do this first, or they'll wrongly think the project is broken. Write this on the tin.

---

## 3. Where the hygiene is messy (and why it matters to *you* specifically)

- **Too many parallel worktrees.** There are ~15 `Lab-*` working copies on your machine, plus a DESTRUCTION VAULT and a DUPLICATE_QUARANTINE. **This is the exact condition that caused your 2026-07-22 whoopsie** — "lost track of which terminal I was in" under multi-terminal velocity. This isn't untidiness; it's a *safety hazard*. The fix is a rule, not a cleanup: **one task → one working copy → close it when done.** Fewer live surfaces = fewer places to lose yourself.
- **Leftover build files create false alarms.** After building the app, a `node_modules` folder sits around and makes `nexus doctor` report scary-looking errors (broken symlinks, odd vendor files). These are **not** your code and **not** part of what gets published — they're disposable. Don't panic when you see them; they can be deleted and regenerated anytime.
- **Proposals are piling up.** You have **13+ open PRs**, several days old (the publications roadmap, LOOM captures, the external web audit, skills drafts, etc.). Open proposals aren't harmful, but a growing stack of un-adjudicated ones is a signal that the *decision* step — you accepting or rejecting — is the bottleneck, not the *making* step. A system that only produces proposals and never resolves them drifts.
- **Declared ≠ enforced (the important one).** Your headline safety promise, `STRICT NO SALE`, is written everywhere but enforced nowhere in code yet: no automatic check blocks the forbidden money-words, and an old wallet screen with Send/Stake buttons is still reachable. This is the single most valuable thing to fix, because it's the gap between a manifesto and a system. (Details in my review under `operations/audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/`.)

---

## 4. What is public right now, and what protects you

**Public on `main`:** the whole repo, including the entire emergency-audit trail and your published cockiness whoopsie. That was intentional and it's consistent.

**Waiting as proposals (pushed, not accepted):** my pre-release red-team review; the unsealed self-diagnosis package (PR #102); and the dozen other open PRs.

**The rails that keep the structure from breaking** — you don't have to enforce these, they're built in:
1. `main` is the only truth; branches can't self-promote.
2. Every proposal is stamped `status_authority: NONE`.
3. Merges into `main` require a *human* decision.
4. GitHub **branch protection** physically refuses direct writes to `main` — changes must go through a PR. (We hit this together this session; it worked exactly as designed.)

**One rail that is currently a paper rule, so you know:** `main` also requires a "review approval" before merging — but because everything runs from one account, there is no second person to give that approval. So in practice, *you* merging anything to `main` requires an **owner override** ("merge without waiting for requirements") in the GitHub web page. That's not a bug you caused; it's what "solo project with team-shaped rules" looks like. Just know that the override is normal and is *you* consciously choosing to accept a proposal.

---

## 5. The things only you can decide

I will not decide these for you, and no AI should:
- **The fork you named:** swan-song for v0.0.1 vs. keep building "upwards." Both are legitimate; neither is a defeat.
- **The unresolved public/private conflict.** Your constitution still says "private repo," but the repo is public. This is flagged `HUMAN_DECISION_REQUIRED` and has been left open honestly. It's a genuine decision, not an oversight to paper over.
- **Whether to admin-merge** any given proposal into `main`.

---

## 6. If you remember only five things

1. **`main` = truth; a branch/PR = a proposal.** Nothing is accepted until *you* merge it.
2. **Pushing is public and permanent-ish. Merging is acceptance.** Slow down at both.
3. **One task, one terminal, one working copy** — this is your anti-whoopsie seatbelt.
4. **A guard only counts once you've watched it catch a real fault.** Prefer enforced checks over written promises. Your biggest open gap is `STRICT NO SALE` being promised but not enforced.
5. **The cockiness incident is proof your system works** — it caught its own operator. That's the property you're researching, demonstrated.

---

## 7. Non-claims

This document has no authority, lifts no emergency stop, and asserts nothing is safe. It is one AI seat's plain-language orientation for the operator. Verify anything load-bearing against `STATUS.json`, `NEXT_ACTION.md`, and the receipts before acting on it.
