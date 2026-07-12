# Read-only audit constitution

## Purpose

An audit challenges an exact frozen target without mutating it. It produces attributed, hash-bound observations rather than corrections applied in place.

## Blind-first method

1. Give the auditor the target, digest, charter, scope and return schema.
2. Withhold prior findings and author commentary.
3. Freeze and hash the blind output.
4. Only then may a separately labelled briefed pass receive prior rationale and findings.
5. Preserve the delta between blind and briefed results.

## Observation rules

- one claim per observation;
- exact target digest and target commit required;
- files seen and files not seen declared;
- reproduction, expected result, actual result and limitations declared;
- `status_authority` must be `NONE`;
- silence is not a pass;
- inability to execute is `UNABLE_TO_VERIFY`;
- absence of findings is `NO_FINDING_WITH_SCOPE`, never “correct”.

## Independence

Different accounts or models from one provider family can provide differential review. They are not automatically independent corroboration. The R001 Claude audit is classified `SAME_FAMILY_DIFFERENTIAL` relative to other Anthropic seats.

## Append-only overlay

Valid observations are appended to a hash-chained ledger outside the target. Ingestion verifies target binding and record hashes. An observation cannot directly mutate the implementation or promote its own classification.
