# BGEN-CODEX-TECH-AUDIT-001

Independent technical/evidence audit of exact subject commit
`8349de7a5978be6a9984aa33fd59ba3725ebaaca`.

Authority is `REPORT_ONLY`; `status_authority` is `NONE`. This package does
not repair the subject, pass the economic gate, change `STATUS.json`, assign
an R-round, authorize live activity, or make legal conclusions.

## Reproduce

```bash
python3 experiments/BENEFICIAL_GENESIS_CODEX_TECH_AUDIT_001/adversarial_probe.py
```

The probe imports the frozen economics model read-only and emits canonical,
deterministic JSON to stdout. Its committed expected result is
`ADVERSARIAL_RESULTS.json`.

## Decision

`TECHNICAL_EVIDENCE_HOLD_FOR_REPAIR`

One bounded but real supply-invariant defect was reproduced: the public
lottery allocator accepts a negative `lottery_share_bps`, converts it into a
negative lottery sub-pool and an oversized pro-rata sub-pool, and returns more
units than the fixed pool. The scenario layer then reports a negative unissued
remainder instead of failing closed.

