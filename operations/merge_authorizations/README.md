# Merge authorizations

## Why this exists

`main`'s branch protection used to require one approving GitHub review before
merge. That rule cannot be satisfied honestly here: every seat that works in
this repo — human or AI — commits under the single `Natoshi-moto` GitHub
account, and GitHub does not let an account approve its own pull request.
Leaving the rule in place would have meant either (a) it silently blocks every
merge forever, or (b) someone works around it with a second account that is
still, in substance, the same operator — which would *manufacture* the exact
problem this project's own `WHY_NOT_TO_TRUST_THIS_PROJECT.md` warns about:
governance text implying independent review that does not actually exist.

This directory replaces that unsatisfiable rule with an honest one:
**explicit, git-attributed, single-operator authorization, bound to one exact
commit.** It does not claim to be independent review. It claims to be what it
actually is — the operator's own recorded, deliberate go-ahead for one exact
version of the code, checked mechanically so it can't be silently reused for a
different, later commit.

## How it works

1. Before a pull request can merge, its author (or the operator) adds a file
   `PR-<number>.json` to this directory, on the PR's own branch, matching the
   schema below.
2. A required GitHub Actions check reads that file and passes only if:
   - the file exists,
   - `authorized_head_sha` exactly equals the PR's current head commit, and
   - the file is well-formed per the schema.
3. Any new commit pushed to the PR invalidates the previous authorization
   (the SHA no longer matches) and requires a fresh file — this replaces what
   GitHub's `require_last_push_approval` was trying to guarantee.

## Schema (`nexus.merge-authorization/v1`)

```json
{
  "schema": "nexus.merge-authorization/v1",
  "pr_number": 0,
  "authorized_head_sha": "<full 40-character commit sha this authorizes>",
  "authorized_by": "operator (GitHub: Natoshi-moto)",
  "authorized_at_utc": "<ISO-8601 UTC timestamp>",
  "statement": "<free text — what was reviewed and why it's approved>",
  "status_authority": "OPERATOR_EXPLICIT",
  "non_claims": [
    "This is not independent review.",
    "This authorization covers only the exact head SHA recorded above; a new commit requires a new file.",
    "This does not certify the PR's content is correct, safe, or complete — only that the operator explicitly reviewed and approved merging this exact commit."
  ]
}
```

## What this does not claim

- Not independent review — same single-operator repo as everywhere else in
  this project.
- Not a security, privacy, or correctness certification.
- Not a substitute for the actual verification gates (`nexus doctor`,
  `./nexus verify`, the test suite) — this only proves a human looked and
  said yes to *this exact commit*, not that the commit is good.
- Files in this directory are never deleted after merge; they stay as the
  historical record of who authorized what, and when.
