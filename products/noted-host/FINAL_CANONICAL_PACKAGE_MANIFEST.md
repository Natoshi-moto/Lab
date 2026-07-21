# FINAL CANONICAL PACKAGE MANIFEST — Noted v0.01 Sweep 60.3

Date: 2026-05-28

## Package status

This package is the final canonical handoff package prepared from the accepted Sweep 60.3 baseline.

It includes:

- Full source tree from `noted-v0.01-sweep60_3.zip`.
- Generated app artifacts from Sweep 60.3, including `noted-v0.01.html`, `verse-studio.html`, and `dist/*`.
- Governance/state/report documents already present in the accepted baseline.
- `reports/SWEEP60_3_DELIVERY_REPORT.md`.
- Orchestrator acceptance materials under `orchestrator_acceptance/`.
- `AI_DESIGN_BRIEF.md`, explicitly marked as AI-generated guidance.

## Canonical constants

```text
build_commit:        83ebad57f9220ac57112f6bbc2ef3818c3a489015b141d4832e842587aded191
exporter_self_hash:  ac876d22546d7e027bbd04f9ad0026ea2842768565fcef2ad067f42e1d448ccb
DB_VERSION:          11
SCHEMA_VERSION:      10
IDB store count:     28
Canonical Canvas:    42 records / 67 links / 42 positions
Selector inventory:  646 data-test / 1 data-testid
```

## Evidence state

```text
SOURCE-VERIFIED: source/package baseline accepted
TEST-VERIFIED: npm ci, npm run typecheck, npm run build passed during Sweep 60.3 verification
RUNTIME-UNVERIFIED: Gate 59.5 diagnostic bundle still required
```

## Runtime gate

Before Sweep 63, use the rebuilt `noted-v0.01.html` from this package and export:

```text
Settings → Diagnostic → Export validation bundle
```

Then submit the downloaded `noted-diagnostic-bundle-*.json` for Gate 59.5 validation.

## AI design brief status

`AI_DESIGN_BRIEF.md` is intentionally included and clearly marked as AI-generated. It is not a replacement for source code, governance state, delivery reports, or runtime validation evidence.
