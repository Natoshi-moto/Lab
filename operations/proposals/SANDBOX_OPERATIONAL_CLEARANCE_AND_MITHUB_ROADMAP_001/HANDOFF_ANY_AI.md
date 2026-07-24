# HANDOFF — ANY AI CONTROLLER

**Operation:** `SANDBOX_OPERATIONAL_CLEARANCE_AND_MITHUB_ROADMAP_001`

**Status authority:** `NONE`

**Current state:** `ECONOMY BUILDER COMPLETE / INDEPENDENT ADVERSARIAL REVIEW PENDING / ROADMAP DORMANT`

## Read this first

The closed-world economy builder operation is no longer running or incomplete.

Its current verified public proposal is:

- **Lab draft PR:** `#118`
- **Title:** `Proposal: Closed-world economy invariants and harm gates`
- **Branch:** `claude/closed-world-economy-invariants-001`
- **Substantive head:** `caef0e7cd689e1e77a49413210116e7590322576`
- **Tree:** `2c044c46c5c23425f13a1bacd36236ce34957b3a`
- **Base:** `6c3a1e806baba1183553221f5c2f00125ce2be29`
- **Changed files:** `20`, all under `operations/proposals/CLOSED_WORLD_ECONOMY_INVARIANTS_001/`
- **Draft:** `true`
- **Merge authorization:** absent by design
- **Sandbox changes:** none

Observed builder verification:

- immutable-commit verification: `PASS`
- dedicated tests: `22/22 PASS`
- vectors: `4/4 valid PASS`; `50/50 hostile rejected for the declared reason`
- JSON and Python committed-blob checks: `PASS`
- `./nexus doctor`: `PASS`
- Promotion origin contract: `PASS`
- Nexus Audit: `PASS`
- Merge Authorization: expected `FAIL` because no authorization exists
- `./nexus verify`: `BLOCKED_BY_MISSING_DEPENDENCY` because `@noble/ed25519` is absent; do not silently install or treat this as package success

These facts were verified before this handoff update, but **you must freshly reverify live GitHub state**. Do not treat this paragraph as authority over newer repository evidence.

## Your role

You are the next control-layer assistant and the first different-family source-bound reviewer after Sonnet built PR #118.

Your job is:

1. recover live repository state;
2. adversarially inspect PR #118 from source;
3. record and adjudicate defects without relying on the builder summary;
4. coordinate bounded repairs if required;
5. obtain an explicit operator disposition for PR #118;
6. only after that gate, execute the separate Sandbox-clearance and Mithub-roadmap commission from a fresh branch.

Do not improvise a replacement vision. Do not ask the operator to restate the project when repository evidence is available.

Use plain English with the operator. Use exact paths, SHAs, commands, evidence classes and non-claims in repository artifacts.

## First response to the operator

Explain in substance:

> I found the queued continuation. Sonnet's builder work is parked in Lab draft PR #118 at the recorded SHA. I will first reverify and adversarially review the actual source. I will not merge it, authorize it, change Sandbox, or begin the roadmap until the review and disposition gate is complete.

## Step 1 — recover live state

Freshly verify:

1. current Lab `main` SHA;
2. current Experimental-Sandbox `main` SHA;
3. current `STATUS.json`, `NEXUS.json` and `WHY_NOT_TO_TRUST_THIS_PROJECT.md`;
4. PR #118 state, draft flag, head SHA, base SHA, changed files and CI;
5. PR #117 state and head SHA;
6. merged PR #110 promotion-gate state;
7. current open PRs and possible supersession or overlap;
8. local worktree state only if local tools expose it.

Stop and report `UNABLE_TO_VERIFY` rather than guessing.

## Step 2 — verify PR #118 identity

The expected immutable builder state is:

```text
PR: 118
HEAD: caef0e7cd689e1e77a49413210116e7590322576
TREE: 2c044c46c5c23425f13a1bacd36236ce34957b3a
BASE: 6c3a1e806baba1183553221f5c2f00125ce2be29
FILES: 20
SCOPE: operations/proposals/CLOSED_WORLD_ECONOMY_INVARIANTS_001/**
```

If the head has moved, do not reuse any review, approval or authorization tied to the old SHA. Inspect the new diff from source.

## Step 3 — perform the independent adversarial review

This is a review operation first. Do not edit PR #118 during initial inspection.

Inspect the actual files and diff, including at minimum:

1. `README.md`
2. `SOURCE_AND_CANON_MAP.md`
3. `THREAT_MODEL.md`
4. `INVARIANTS.md`
5. `PROHIBITED_CAPABILITIES.md`
6. `ALLOWED_INTERNAL_PRIMITIVES.md`
7. `EARNING_AND_RECOGNITION_MODEL.md`
8. `SECONDARY_MARKET_AND_LEAKAGE_MODEL.md`
9. `USER_HARM_AND_POWER_MODEL.md`
10. `HALT_AND_ESCALATION_RULES.md`
11. `CLAIMS_AND_NONCLAIMS.md`
12. `IMPLEMENTATION_GATES.md`
13. `CONTRADICTION_REGISTER.md`
14. `schema/closed_world_economy.schema.json`
15. `tools/validate_closed_world_economy.py`
16. `TEST_VECTORS.json`
17. `tests/test_closed_world_economy.py`
18. `HANDOFF_ANY_AI.md`
19. `RECEIPT.json`

Review for:

- source/canon misclassification;
- native vocabulary disguising a financial capability;
- redemption, transfer, pricing, exchange, account-sale or export seams;
- unofficial secondary-market response gaps;
- paid chance, loot-box, wagering or gambling-like combinations;
- minors and vulnerable-user exposure;
- coercive labour, status pressure or disguised wages;
- operator capture, confiscation, retaliation and appeal weakness;
- halt, containment and suspension conditions;
- contradiction suppression;
- prose/schema/validator/test-vector drift;
- validator fail-open behaviour, duplicate keys and malformed input;
- missing prohibited combinations rather than only missing individual flags;
- overclaims in the receipt or PR contract;
- changed-file scope, secrets, personal data, private URLs and local paths;
- stale or false dependency claims.

The known limitations that must not be summarized away include:

- `CR-02` and `CR-03`: existing shipped wallet/balance/earn surfaces remain outside this proposal and unfixed;
- no age-verification mechanism is proposed;
- no independent non-operator institutional review capacity exists;
- 50 hostile vectors are representative, not exhaustive;
- full Lab verification is blocked by the missing Node dependency.

A different model name is not automatically independence. State the reviewer relationship and limits honestly.

## Step 4 — return a defect ledger

Classify each finding as:

- `CONFIRMED_BLOCKER`
- `CONFIRMED_NONBLOCKING`
- `PLAUSIBLE_NEEDS_TEST`
- `FALSE_POSITIVE`
- `UNABLE_TO_VERIFY`

For every confirmed finding provide:

- exact file and line or object path;
- violated doctrine or invariant;
- concrete consequence;
- smallest repair;
- test or falsifier;
- whether the substantive SHA must change.

Do not treat a lack of findings as proof of safety, legality or external closure.

## Step 5 — repair loop if required

If confirmed defects exist:

1. keep the review evidence immutable;
2. commission a bounded repair on PR #118's branch or a clearly linked successor branch;
3. change only the declared economy package scope;
4. add or amend tests that reproduce the defect;
5. rerun the complete dedicated suite and immutable-commit verification;
6. re-review the new exact SHA;
7. invalidate all conclusions tied only to `caef0e7...` when substantive bytes change.

Do not allow the builder to self-certify the repair as independent review.

## Step 6 — economy disposition checkpoint

Before activating the roadmap, record exactly one:

- `ECONOMY_FRAMEWORK_ACCEPTED_ON_MAIN`
- `ECONOMY_FRAMEWORK_REVIEWED_BUT_OPEN`
- `ECONOMY_FRAMEWORK_REJECTED_OR_SUPERSEDED`
- `UNABLE_TO_VERIFY`

The operator must receive a plain-language decision card before any merge, authorization, rejection or closure action.

Nothing in this handoff pre-authorizes merging PR #118. The expected failing Merge Authorization check is a safety property, not a defect.

## Step 7 — activate the queued roadmap only after disposition

After the review is complete and the disposition is explicitly recorded, create a fresh branch and isolated worktree from the **then-current accepted Lab `main`**.

Suggested operation branch:

`chatgpt/sandbox-clearance-mithub-roadmap-execution-001`

Do not build the roadmap on PR #117's historical queue branch. Use `NEXT_OPERATION_PROMPT.md` as the commission, then revalidate it against current accepted state.

## Step 8 — required roadmap source inspection

Inspect and classify at least:

- current `STATUS.json` and `NEXUS.json`;
- `WHY_NOT_TO_TRUST_THIS_PROJECT.md`;
- merged PR #110 and its promotion-gate files;
- PR #118, its review evidence and final disposition;
- current Experimental-Sandbox `README.md` and `CHARTER.md`;
- Mithub Adjacent router and handoff material;
- current board state;
- Commons proposal PR #107 if still relevant;
- Outside Adversary proposal PR #108 if still relevant;
- Owner Plain-Language Gate proposal PR #112 if still relevant;
- housekeeping PR #116 if still relevant;
- broad Full Spectrum proposal PR #101 if still relevant;
- any newer accepted or superseding material.

Use:

- `ACCEPTED_MAIN`
- `MERGED_EVIDENCE`
- `OPEN_PROPOSAL`
- `HISTORICAL_ONLY`
- `SUPERSEDED`
- `UNABLE_TO_VERIFY`

Never promote chat memory or an open PR into accepted canon.

## Step 9 — preserve the clearance scope split

### Phase A blocks formal operator Sandbox clearance

Only:

- explicit Sandbox canon as shared history/context, not truth;
- hard red lines;
- entry and experiment templates;
- recovery/checkpoint method;
- merge/history policy;
- one wild-experiment drill;
- one recovery drill;
- one Lab-boundary drill;
- exact-SHA clearance receipt and operator authorization.

### Later work does not automatically block Phase A

- full personal Mithub architecture;
- permanent adversarial Mithub pilot;
- University v0;
- contributor portal;
- mature reputation or recognition mechanics;
- full corpus ingestion;
- Hermes integration;
- polished UI;
- complete expert-team staffing.

Do not turn the roadmap into an endless prerequisite machine.

## Step 10 — roadmap output boundary

The roadmap execution operation may:

- create a fresh Lab proposal branch;
- write only under its declared proposal scope;
- use the merged PR #110 `LAB_INTERNAL` contract;
- run deterministic checks;
- open a draft PR;
- stop with a plain-language decision card.

It may not:

- modify Experimental-Sandbox;
- merge PR #118 or PR #117;
- add merge authorization;
- write directly to Lab `main`;
- implement Mithub, University or an economy;
- deploy real users;
- authorize external value.

## Required final return

Return:

1. verified current Lab and Sandbox SHAs;
2. PR #118 review verdict and exact reviewed SHA;
3. defect ledger and repair status;
4. economy disposition;
5. roadmap execution branch;
6. roadmap draft PR and exact head;
7. Phase A blockers;
8. later non-blocking milestones;
9. source classifications;
10. tests, limitations and non-claims;
11. the next exact operator decision requested.

## Absolute non-authority

Nothing in this handoff authorizes:

- merging PR #118, PR #117 or any future roadmap;
- changing Sandbox;
- installing an economy;
- external value, redemption, transfer, pricing or markets;
- real-user deployment;
- deleting evidence or criticism;
- rewriting history;
- bypassing exact-SHA operator authorization.

Stop rather than silently broadening authority.
