# Claude R001 audit guide

## Scope

Audit the exact `baseline-001` tag and deterministic snapshot. Do not modify the target. The current working tree may include the audit apparatus created after the baseline; distinguish target content from overlay content.

## Required attacks

- recompute and compare target hashes;
- test deterministic rebuild where environment permits;
- attempt route path traversal and undeclared-file inclusion;
- submit malformed, mismatched and self-promoting observations in check-only mode;
- inspect secret-scan coverage and identify obvious bypass classes;
- verify CI permissions and absence of committed credentials;
- assess whether the operator can find the single next action;
- challenge every claim in `docs/DEMONSTRATION.md` for overreach;
- record files not inspected and operations not executable.

## Return discipline

Use one JSON file per claim. Do not combine unrelated findings. `status_authority` remains `NONE`; recommendations are future proposals, not target edits.
