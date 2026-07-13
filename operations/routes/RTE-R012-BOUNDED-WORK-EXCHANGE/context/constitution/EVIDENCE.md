# Evidence constitution

## Evidence classes

| Class | Meaning | Valid source |
|---|---|---|
| `DRAFT` | Proposed or interpreted, not verified | human or AI proposal |
| `SOURCE` | Bound to an inspected source span or exact artifact | source record with locator |
| `TEST` | Bound to a deterministic test, proof, simulation, or tool result | execution receipt |
| `REVIEW` | Independently reviewed by a declared non-producer | attributed review record |
| `BLOCKED` | Failed a gate or cannot proceed under current assurance | gate or reviewer |
| `VOID` | Previously accepted claim was invalidated or superseded | contradiction or correction record |

## No-promotion invariant

```text
DRAFT + repetition           != SOURCE
SOURCE + confidence          != TEST
producer reviewing own work  != independent REVIEW
route-cache hit               != evidence
summary                       != source
commit or merge               != correctness
```

## Receipts

A receipt proves only the operation, inputs, environment and outputs it records. It does not prove that the operation was appropriate, exhaustive, secure or semantically correct.

## Audit observations

Audit observations are append-only signals with `status_authority: NONE`. Promotion requires a separately governed path: scope the claim, preregister the test where relevant, reproduce it, review it, and obtain human authorization for any status-bearing mutation.
