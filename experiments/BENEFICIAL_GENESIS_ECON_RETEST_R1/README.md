# BGEN-R1-RETEST — different-family retest of TRIB-F-001 repair

## Decision

`REPAIRED_PACKAGE_PASS` for the tested R1 supply-invariant and parameter-validation domains only.

`ECONOMIC_GATE_PASS: false`

## Authority and binding

- `status_authority: NONE`
- Subject: draft PR #50 at `a591167a4046ef73762c78080a27898450b0f1e4`
- Repair logic: `3c83a13497be94f1cb5a05bec37f10ba81d8903b`
- Retest branch: `codex/bgen-r1-retest-001`
- Seat: OpenAI Codex, model string `GPT-5`
- Posture: different provider family from the Grok repair seat; not blind to the repair diff

The current subject HEAD is one receipt-binding commit after the repair logic commit. Source inspection confirmed that the binding commit changes only the repair receipt. The remote PR #50 head matched the tested HEAD at capture, so no subject staleness was observed.

## Result

The historical implementation at the repair commit's parent reproduced TRIB-F-001: one donor, pool 100, and `lottery_share_bps=-1000` returned 110 issued units. The repaired implementation rejects that input with `ParticipantValidationError` before allocation arithmetic.

The independent adversarial matrix covers bool, float, string, negative, and oversized values across `lottery_share_bps`, `early_bonus_bps`, `winners`, and `pool`. Invalid types and negative values fail closed. Basis points above 10,000 fail closed. Oversized positive `winners` is safely bounded to the donor population; a very large non-negative integer pool remains supply-conserving.

All 78 subject tests passed. The simulator regenerated all 27 scenarios, and SHA-256 hashes for all 29 result files were identical before and after execution; Git reported no subject-result diff.

## Scope and nonclaims

This package tests the R1 input gates, lottery counterexample, public supply gate, scenario regeneration, and the enumerated adversarial domains. It does not prove all possible callers, economic soundness, Sybil resistance, live readiness, legal status, transferability necessity, or production safety. It authorizes no merge or live activity and makes no change to `STATUS.json`.
