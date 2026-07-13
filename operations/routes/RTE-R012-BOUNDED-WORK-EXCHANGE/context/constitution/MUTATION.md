# Mutation constitution

## State transitions

```text
human objective
  -> task
  -> route pack
  -> attributed return
  -> validation
  -> proposal branch / pull request
  -> declared checks and review
  -> human-authorized merge
  -> receipt and index regeneration
```

## Rules

- No silent mutation: every durable change is attributable to a task, actor or operator action.
- Returns bind to the baseline from which they were produced.
- Stale returns are reported; they are not silently rebased and accepted.
- Generated indexes identify their source and can be rebuilt.
- Snapshots and tags are never edited in place.
- Audit target bytes are read-only. Observations append outside the target.
- Privileged execution accepts a known adapter and exact inputs, not unconstrained model-authored shell text.

## Git meaning

| Git state | Nexus meaning |
|---|---|
| uncommitted worktree | local staging, not accepted |
| branch | proposal line |
| pull request | reviewable mutation proposal |
| `main` | accepted working corpus |
| tag | historical anchor |
| deterministic snapshot | transportable exact target |

None of these states alone establishes factual truth.
