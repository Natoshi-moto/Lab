# Experimental Sandbox → Nexus Lab promotion

**status_authority:** `NONE`

Nexus Lab is canonical accepted working state. [`Experimental-Sandbox`](https://github.com/Natoshi-moto/Experimental-Sandbox) is public, reversible and noncanonical. A promotion is a request for Lab review, never a tunnel between repositories.

## Ordinary-language flow

```text
messy idea → public experiment → evidence and adversarial review
→ promotion package → small Lab PR → protected Human Gate
```

The operator should receive a plain decision card, not Git instructions.

## Required package

1. **Origin** — immutable Sandbox tag, full commit SHA and experiment record.
2. **Claim** — one falsifiable sentence.
3. **Falsifier** — what observable result would have killed it?
4. **Evidence** — reproduction command/output, or `DOCUMENTARY_ONLY`.
5. **Non-claims** — what the experiment does not establish.
6. **Adversarial review** — builder, breaker, evidence, rights and lay roles; model/provider and context disclosed; agreement does not imply independence.
7. **Red impact** — which known Lab red moves, which declared question deepens, or `NONE`.

The canonical template lives at:

`https://github.com/Natoshi-moto/Experimental-Sandbox/blob/main/templates/PROMOTION.md`

## Provenance

- Sandbox `main` is protected against force-push and deletion.
- Promotions cite an immutable tag and SHA.
- Lab’s promotion-origin workflow verifies the tag still resolves to that SHA.
- Reimplementation on a clean Lab branch must preserve that citation.
- No submodule, subtree or workflow credential crosses the boundary.

## AI context disclosure

Every proposing or reviewing seat states which repositories and experimental materials were in context. Same-provider seats are differential reviewers, not automatically independent.

## Operator card

Before `OPEN_LAB_PR`, translate the package into:

- What is this?
- Why does it matter to the declared project intent?
- What actually happened?
- What remains speculation?
- Who or what could be harmed?
- Was another project forked and under what rights?
- What did adversaries disagree about?
- Can this affect `main`?
- What exact, reversible change is requested?

## Hard boundaries

- No automatic merge.
- No hidden authority promotion.
- No snapshot mutation.
- No shared secrets or write credentials.
- No unverified provenance.
- No requirement that controversial ideas become polite before they become testable.
