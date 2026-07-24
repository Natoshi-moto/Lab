# PRE-CLEARANCE SANDBOX INVENTORY

**Operation:** `SANDBOX_OPERATIONAL_CLEARANCE_AND_MITHUB_ROADMAP_001`

**Status authority:** `NONE`

**Classification:** `PRE_CLEARANCE_LEGACY_STATE / MUST BE INVENTORIED, NOT ERASED`

## Why this file exists

Experimental-Sandbox was already used before the proposed Phase A clearance rails existed. Future clearance must not pretend it starts from an empty repository or that repository boundaries contain effects already made on the operator's machine.

This file records the minimum known pre-clearance state and the mandatory retrospective audit for the next controller. Fresh verification always outranks this snapshot.

## Observed public repository state

Observed Experimental-Sandbox `main`:

`82b9a3b2a60f008ba31d2f4a9228c9074e126b1c`

Known merged public layers include:

1. the original Sandbox charter, templates, checks and course material;
2. the Mithub Adjacent natural-language router and browser prototype;
3. the public operator board.

Known open work includes Experimental-Sandbox PR `#3`:

- title: `Add Hermes Prototype: white paper, spec, verification checklist`;
- branch: `sandbox/experiment/hermes-prototype`;
- observed head: `7943dcc089905d0d86ca0ef6a24ad5a3782e2d45`;
- state: open proposal, not accepted on Sandbox `main`;
- repository authority: `NONE`.

## Confirmed or credible pre-clearance debt

### 1. Real-target authorization is not mechanically explicit

The current `run-public-experiment` skill says to choose a legitimate test and the risk bands require scoped authority for red security work, but the public files do not ask the concrete load-bearing question:

> Do you own this target, or do you have written authorization to test it?

Until repaired, `SBX-BREAK-*` or loose instructions such as “break it” must never be interpreted as permission to test a real third-party system, account, network, person or service.

### 2. Sandbox `main` semantics conflict

`README.md` broadly calls Sandbox public history `noncanonical`, while `CHARTER.md` describes `main` as an append-only index containing accepted experiment records.

Future doctrine must reconcile this without rewriting history:

> Sandbox `main` may be canonical as shared history and context while remaining non-authoritative as truth, safety, legality, deployment suitability or Lab acceptance.

### 3. Main-branch review protection requires fresh verification

The public board records that Sandbox `main` lacked a required pull-request-review block when checked on 2026-07-23, although force-push/deletion protection and a status check were reported.

Repository settings can change without a Git commit. The next controller must verify the live branch-protection and ruleset state rather than repeating this historical observation as current fact.

### 4. Loose-language routing expands Sandbox action

The Mithub Adjacent contract deliberately interprets vague language generously inside Sandbox. It can route requests to `SANDBOX_WRITE`, external publication drafts and bounded Lab draft-PR preparation.

This is not automatic Lab mutation, but it increases the need for explicit stops around:

- credentials;
- external writes;
- paid APIs;
- real users;
- real targets;
- publishing identifiable allegations;
- local shell/desktop control;
- any action whose effects outlive a reversible repository branch.

### 5. Local-machine effects may already exist outside repository containment

Sandbox PR #3 records claims that Hermes Agent and Herdr were installed and configured locally, that a Claude hook and Hermes source/persona files were modified, and that local APIs can prompt, read, wait on and send text to running agent panes.

Those claims require fresh machine inspection. Even if PR #3 remains open and unmerged, any actual local installation, service, hook, credential, provider configuration or agent-control path already exists outside Sandbox Git history and must be audited separately.

Do not infer from `status_authority: NONE` that local effects are absent or harmless.

### 6. Public history is already public

Do not delete, force-rewrite or cosmetically sanitize pre-clearance history to manufacture a cleaner genesis. Preserve exact SHAs, classify limitations and add later corrective commits.

## Mandatory retrospective audit before Sandbox clearance

The roadmap and later Phase A operation must inventory at minimum:

1. Sandbox `main` and every retained branch;
2. open, merged and closed PRs;
3. issues and discussions containing experiments or operational instructions;
4. workflows, permissions, environments, deploy keys, webhooks, GitHub Apps and repository rulesets;
5. releases, packages, Pages/deployments and configured external publishing targets;
6. committed and historical secrets findings, with rotation evidence where applicable;
7. local Hermes/Herdr installations, services, hooks, MCP/ACP servers and socket endpoints;
8. local provider credentials and whether any agent can invoke shell, desktop, browser, GitHub or paid-service effects;
9. any experiment that touched a real user, real target, paid API, public claim about an identifiable party or external system;
10. every attempted or opened Lab promotion and its exact provenance.

Each item must be classified:

- `SAFE_TO_RETAIN_AS_HISTORY`
- `OPEN_PROPOSAL`
- `REQUIRES_CONTAINMENT`
- `REQUIRES_REPAIR`
- `REQUIRES_SECRET_ROTATION`
- `REQUIRES_RIGHTS_REVIEW`
- `REQUIRES_HARM_REVIEW`
- `UNABLE_TO_VERIFY`

## Immediate containment posture

Until the retrospective audit and Phase A rails are complete:

- do not merge Sandbox PR #3 merely because it is already public;
- do not run security tests against real targets without ownership or written authorization;
- do not grant a Sandbox agent credentials that can mutate Lab;
- do not treat local agent-to-agent automation as contained merely because its design documents live in Sandbox;
- do not claim Sandbox is operationally cleared;
- prefer text, synthetic data and isolated local code with no external writes;
- preserve all existing evidence and exact SHAs.

## Relationship to Lab and PR #118

This pre-clearance debt does not itself modify Lab `main`, PR #118 or its closed-world-economy proposal.

It does mean the future roadmap must distinguish:

1. reviewing and dispositioning PR #118;
2. auditing what Sandbox and the operator's machine already contain;
3. installing forward-looking Phase A rails;
4. formally clearing only an exact later Sandbox SHA.

No retrospective audit result authorizes merge, deletion, external targeting, money, deployment or history rewriting.
