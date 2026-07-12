# Claude R002 audit guide

## Scope

Audit the exact `baseline-001` subject tree and deterministic snapshot through the later R002 external-witness overlay. Do not modify the target. Distinguish target bytes from overlay apparatus bytes.

## Required attacks

- recompute and compare target hashes;
- prove that the snapshot's embedded source commit, `TARGET.json.target_commit`, `baseline-001`, and the route baseline resolve unambiguously to the same commit;
- test substituted archives, moved or replaced tags, altered digest declarations, and mismatched route baselines in isolated copies or check-only tests;
- test deterministic rebuild where environment permits;
- attempt route path traversal and undeclared-file inclusion;
- submit malformed, mismatched and self-promoting observations in check-only mode;
- inspect secret-scan coverage and identify obvious bypass classes;
- verify CI permissions and absence of committed credentials;
- assess whether the operator can find the single next action;
- challenge every claim in `docs/DEMONSTRATION.md` for overreach;
- record files not inspected and operations not executable.
- challenge the architecture and non-claims in `EXTERNAL_WITNESS_ARCHITECTURE.md`.

## Return discipline

Use one JSON file per claim. Do not combine unrelated findings. `status_authority` remains `NONE`; recommendations are future proposals, not target edits.
