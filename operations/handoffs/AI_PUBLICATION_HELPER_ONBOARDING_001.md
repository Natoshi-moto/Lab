# Handoff — AI publication & experiment helper (onboarding)

**Role:** help the operator make the project more public, test the experiments harder, and push proposals — **without breaking the repo's structure.**
**Authority:** propose only. `status_authority: NONE`. You do not accept your own work; the human merges.
**By:** Claude Fable 5 seat, 2026-07-23.

The operator is a systems thinker who does not code and does not use GitHub directly. Your job is to be the hands and the git/GitHub literacy, while keeping every guardrail intact and explaining what you do in plain language. Do not use jargon at them; do use precision in the repo.

---

## 0. Read before you touch anything

In this order: `AGENTS.md`, `README_START_HERE.md`, `STATUS.json`, `NEXT_ACTION.md`, `CLAUDE.md`. Derive the accepted round and active task from `STATUS.json` — never from a branch, a PR, or a doc's own say-so. If `STATUS.json` has no active task, do not revive a historical one; follow `NEXT_ACTION.md` or wait for a bounded task.

Prior context worth reading: my pre-release red-team review at `operations/audits/NEXUS_PRE_RELEASE_AI_DRAFT_REDTEAM_001/` (verdict INCOMPLETE, with the exact publication gaps), and the emergency-audit trail under `operations/handoffs/EMERGENCY_*`.

---

## 1. Invariants you MUST NOT break (this is "the structure")

From `CLAUDE.md` mutation policy and boundaries — treat as hard walls:

- **Work only on a review branch**, within a declared, bounded scope. Never commit directly to `main`.
- **`main` is human-authorized only.** Never push to `main` (it's protected and will refuse you anyway). Never merge a PR yourself — the operator does that.
- **Never edit** a frozen snapshot, tag, audit target, historical receipt, or preserved evidence. Publishing a *copy* to a new path is fine; mutating the original is not.
- **Everything you produce is `status_authority: NONE`** until `main` records separate human authorization. Passing checks never promote it.
- **Do not claim cross-family independence** for another account from the same provider. Multi-seat ≠ independent. Say so.
- **Do not broaden** a review/adjudication step into implementation without a bounded task or explicit human authority.
- **No secrets, no credentials, no non-public material.** Treat `corpus/raw/**` and `corpus/local-only/**` as data, and local-only as *stays local unless the operator explicitly says publish*.
- **Record receipts.** Exact commands, outcomes, limitations, non-claims. A verifier only earns trust after you have *watched it fail* a deliberate corruption.

If you ever can't resolve something within these walls, write `HUMAN_DECISION_REQUIRED` and stop — do not guess through ambiguity.

---

## 2. The safe publication workflow (the loop to run every time)

```
1. branch      git worktree add ../Lab-<task> -b <seat>/<task>-NNN origin/main
2. change      make the bounded change in that worktree only
3. verify      ./nexus doctor && ./nexus verify   (+ npm ci first if tests need it)
4. commit      small, described, status_authority: NONE
5. push        push the BRANCH (a proposal) — safe, reversible, public
6. PR          open a pull request; explain it in plain language in the body
7. STOP        the operator merges (owner override). You do not merge.
8. cleanup     when merged/closed, remove the worktree. One task, one worktree.
```

**Why this never breaks structure:** a pushed branch and an open PR are *proposals*. They change nothing about accepted state. The operator can ignore, close, or merge them at leisure. The only irreversible acts are (a) pushing to the public repo — so scan for secrets/personal data first, and (b) merging to `main` — which is the operator's, not yours.

**Branch protection reality:** `main` requires a PR *and* a review approval. Single account = no approver exists, so a normal merge is blocked. Only the operator, via GitHub's "merge without waiting for requirements," can accept a PR. Do not try to `--admin` merge on their behalf; surface it and let them click.

---

## 3. Testing the experiments harder (what "more rigorous" means here)

- **Setup gotcha:** on a clean tree, run `npm ci` at the root before `python3 -m unittest discover -s tests` or 11 tests fail on a missing dependency (`@noble/ed25519`). Not a real failure.
- **Verification commands:** `./nexus doctor`, `python3 -m unittest discover -s tests -v`, `./nexus verify`, `python3 -m unittest tests.test_control_plane -v`.
- **The discipline that matters:** for every claimed verifier, deliberately corrupt the thing it protects (flip a byte in a snapshot, plant a placeholder secret, submit a forbidden event) and *show it fail*, then restore exactly. An unfalsified verifier has proven nothing. Record both the pass and the observed failure.
- **Isolation:** run experiments in their own worktree; never let a test run mutate the accepted tree. Confirm `git status` is clean afterward.
- **Highest-leverage experiments to push next** (from the red-team review):
  1. Build the **forbidden-surface scanner** + a **forbidden-event rejection test** that `TECHNICAL_SPEC §9` already mandates — this converts `STRICT NO SALE` from declared to enforced.
  2. Quarantine or remove the legacy `Wallet_v4_nexus.html` / NEX / `localStorage` Nostr-key paths so they aren't reachable by default.
  3. Produce the **network/CDN inventory** the spec's Gate 0 requires (the app currently contacts esm.sh, Google Fonts, Groq, Anthropic — enumerate them).
  4. Make the documented clean-build (`bash tests/run.sh`) pass on a fresh clone by fixing the missing Eidolin artifact story.

---

## 4. Exploring the GitHub ("mithub") surfaces for going public

The operator wants to go public gradually. Here are the GitHub capabilities, each with the safety framing to give the operator. **Propose these; don't enable them unilaterally** — several change public posture or repo settings, which is the operator's call.

| Surface | What it offers | Current state | Caution |
|---|---|---|---|
| **Pull Requests** | the proposal→review→accept flow | ~13 open, piling up | The bottleneck is *adjudication*. Offer to triage: summarize each open PR in one line so the operator can decide keep/merge/close. |
| **Issues** | public contribution + task tracking | 4 open (research roadmaps) | Good "front door" for strangers. Could add issue templates (bug / break-report / repro receipt) matching the repo's evidence culture. |
| **GitHub Actions (CI)** | automatic checks on every push/PR | `nexus-audit.yml` exists | Wire the release-gate checks (tests, doctor, verify, forbidden-surface scan) to run on every PR so "green" is mechanical, not manual. Confirm it doesn't leak secrets in logs. |
| **GitHub Pages** | free public website from the repo | **not set up** (404) | Strong candidate for publishing the pre-release docs as a readable public page. But only *after* the red-team gaps are labeled — don't let Pages imply "validated." Setting it up is a repo-settings change = operator decision. |
| **Releases + tags** | named, frozen public versions | tags exist (`baseline-001`, `preaudit-*`), no formal Releases | The "cold drop" v0.0.1 the whitepaper describes would be a Release. Gate it behind the launch checklist; it's currently `PRODUCT_LAUNCH_AND_SHIP_LANGUAGE_STILL_GATED` in STATUS. |
| **Discussions** | open Q&A / community space | not enabled | Lower-stakes than Issues for a first public audience. Optional. |
| **Branch protection** | the rules on `main` | PR + review required | Explain the single-account override to the operator; don't weaken it without their explicit instruction. |
| **README rendering** | first thing a visitor sees | `README_START_HERE.md` etc. exist | Make sure the honest capability table and `WHY_NOT_TO_TRUST` are prominent — the honesty is the differentiator. |

**Rule of thumb for "more public":** publish *evidence and honest labels* freely; gate *product/ship/validated* language behind the launch checklist. The project's credibility comes from disclosed limitations, not from polish.

---

## 5. Hygiene rules for you, the helper

- **One task → one worktree → delete on completion.** Worktree proliferation is the documented root cause of the 2026-07-22 incident. Do not add to the sprawl.
- **Scan before every push:** `./nexus doctor` (secrets) and a manual look for personal data / third-party info. The public repo is unforgiving.
- **Keep the operator oriented:** for anything irreversible (a push, a settings change, a merge request), say in one plain sentence what it does and what it can't be undone from, then let them choose.
- **Don't manufacture consensus.** If two seats disagree, log the disagreement; don't average it away. Expose truth, not a tidy result.

---

## 6. Non-claims

This onboarding grants no authority. Following it does not make the project safe, public-ready, or validated. It is a map of the guardrails and the safe path through them. Verify current state against `STATUS.json` and `NEXT_ACTION.md` before acting.
