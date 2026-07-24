# Experimental Sandbox → Nexus Lab promotion

**status_authority:** `NONE`

Sandbox makes experimentation cheap. Promotion makes claims expensive. The
public Sandbox is noncanonical; Lab `main` is accepted working state, not a
claim of truth. A promotion package is a request for review, never an automatic
bridge, copy operation, or status upgrade.

## Ordinary-language flow

```text
rough Sandbox work
→ exact frozen candidate
→ promotion package
→ small Lab PR
→ technical and adversarial review
→ plain-English operator card
→ accept / reject / return / park
```

The gate checks declarations and selected invariants. It does not fetch,
checkout, execute, copy, or trust Sandbox code. It reads remote Git metadata
only when resolving a declared tag. A passing gate is not proof of safety,
security, correctness, usefulness, independence, licence compatibility beyond
the declaration, successful reproduction, or deployment suitability.

## One contract, two modes

The single machine-readable contract is
`operations/process/experimental-sandbox-promotion.schema.json`. The PR
template, validator, workflow, and tests use the same field names.

### `LAB_INTERNAL`

For work that originated inside Lab, set every Sandbox field to exactly
`NOT_APPLICABLE`. Still declare the task or route, full Lab baseline commit,
authority, allowed scope, exact proposed files and each file's disposition,
claim, falsifier, evidence class, tests and detailed results, known failures,
known unknowns, non-claims, adversarial review, rights and licences, security
and privacy impact, Lab red impact, operator decision, and
`status_authority: NONE`.

### `SANDBOX_PROMOTION`

For Sandbox-origin work, declare exactly:

- repository `Natoshi-moto/Experimental-Sandbox`;
- a full 40-character commit SHA;
- a tag whose direct or peeled target resolves to that SHA;
- a record URL tied to that exact commit or tag, never a branch, `main`,
  `HEAD`, or `latest` URL;
- context, task or route, Lab baseline, authority, and allowed scope;
- the exact files proposed for Lab and whether each is copied, rewritten,
  independently reimplemented, documentation-only, or evidence-only;
- claim limits, falsifier, evidence class, test commands and detailed results;
- known failures, unknowns, non-claims, adversarial review, rights/licences,
  security/privacy impact, Lab red impact, and the operator decision requested.

The PR changed-file set must exactly equal the declared proposed-file set and
must remain inside the declared allowed scope. Nothing else is imported:
branches, histories, build output, generated files, dependencies, credentials,
local configuration, and unrelated experiments stay out unless deliberately
listed and reviewed.

### Composition with merge authorization

Promotion scope describes substantive Lab content only. When the trusted
GitHub pull-request event supplies a PR number, the validator may exclude one
and only one bookkeeping path from that substantive comparison:
`operations/merge_authorizations/PR-<CURRENT_PR_NUMBER>.json`. It does not
exclude the directory broadly, another PR's authorization, malformed paths,
reports, receipts, workflows, or any other file. The exact bookkeeping path is
not allowed in `files_proposed_for_lab` and is not added to the declared
substantive write scope.

The separate Human merge authorization workflow validates that bookkeeping
file. Both checks must pass before a merge is possible, but neither check is
proof of correctness, safety, security, rights compatibility, usefulness, or
suitability. Any substantive commit after an operator authorization makes that
authorization stale and requires a new exact-head decision.

## Rights and licence boundary

Every package declares the original author or source, source repository and
commit, source licence, modifications, third-party material, submitter rights,
whether proposed files can be accepted under Lab's MIT licence, and exceptions.
The gate checks that these declarations exist and are internally shaped. It
does not legally verify ownership or licence compatibility. An unresolved
rights question remains a merge blocker.

## Operator card and hard boundaries

The package must answer what this is, why it might matter, what happened, what
enters Lab, what stays in Sandbox, what was tested, what failed, what remains
unknown, what rights apply, who could be harmed, what reviewers disagree about,
what reversible decision is requested, and what is not being claimed.

Even rough Sandbox work must not publish secrets or credentials, expose private
personal material without deliberate consent, target systems without ownership
or explicit authorization, automatically write to Lab, automatically post
externally beyond the chosen GitHub action, claim Lab authority, claim safety
or correctness without evidence, or silently import incompatible rights.

Heavy process begins when someone asks to promote work, make a public factual or
safety claim, deploy, affect real users/money/infrastructure, merge into
accepted state, or publish consequential material.

The promotion workflow is read-only. It never approves or merges a PR, grants
Sandbox credentials, copies files, or turns tests into proof.
