# Audit/repair report — BGEN-R1-SUPPLY-INVARIANT-REPAIR

## Authority

`status_authority: NONE`. Proposal only. Does not merge, promote, assign R-rounds, or authorize live activity.

## Binding

| Field | Value |
|-------|-------|
| Parent | Tribunal PR #46 / REPAIR_ACCEPTANCE_PLAN R1 |
| Findings | TRIB-F-001, TRIB-F-002, TRIB-F-008 |
| Base | `main` @ `8349de7a5978be6a9984aa33fd59ba3725ebaaca` |
| Branch | `grok/bgen-r1-synthesis-001` |

## What was wrong

Public `random_lottery_component` accepted `lottery_share_bps=-1000`. Integer floor math then expanded the pro-rata sub-pool:

```text
lottery_pool = floor(100 * -1000 / 10000) = -10
pro_rata_pool = 100 - (-10) = 110
total_issued = 110 > pool
unissued_remainder = -10
```

This falsified the package’s supply-conserving claim on a one-line adversarial input.

## What changed

1. Strict scheme-parameter validation (bool-excluded ints; bps in `[0, 10000]`; epoch ordering; positive `scale`).
2. `enforce_supply_invariant` on all public allocators and in `run_scenario`.
3. Regression + boundary tests (78 tests green; 27 scenario results byte-identical).
4. Unified thesis package routing strategy (protocol adoption / delayed unit / Gemini) so R1 is not derailed by narrative.

## What did not change

- Valid-input arithmetic intent (no new schemes; no result fixture rewrites).
- Design pack, Breaker pack, historical audits.
- Transfer regime research (still non-transferable/delayed default pending S1).

## Required next seat action

Independent different-family retest of **this PR’s exact repair commit**, binding the hash in a new receipt (pattern of PR #39). Do not treat this repair seat’s self-tests as that retest.
