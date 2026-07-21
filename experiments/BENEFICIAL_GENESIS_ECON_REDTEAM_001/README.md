# BENEFICIAL_GENESIS_ECON_REDTEAM_001

Adversarial economics and mechanism-necessity analysis for Beneficial Genesis, for GitHub issue [#34](https://github.com/Natoshi-moto/Lab/issues/34) (`BGEN-ECON-REDTEAM-001`), parent program [#33](https://github.com/Natoshi-moto/Lab/issues/33).

**Authority:** propose / economic red-team only. Does not alter canonical status, assign an R-round, authorize live funds, select real charities, issue a token, or make legal conclusions. `status_authority: NONE`.

**Final recommendation: `REJECT_OR_REDESIGN`** for the transferable fixed-pool allocation token as currently specified. See `FAILURE_CONDITIONS.md` for the full disposition.

## Layout

| Path | Role |
|---|---|
| `MECHANISM_NECESSITY.md` | Track 1 — is a transferable token necessary? Alternatives comparison at the mechanism level. |
| `FORMAL_MODEL.md` | Assumptions and equations implemented by the simulator. |
| `ALTERNATIVES_COMPARISON.md` | Track 3 — allocation-rule alternatives comparison. |
| `FAILURE_CONDITIONS.md` | Disposition of each of the task's six failure conditions against executable evidence. |
| `NONCLAIMS_AND_OPEN_QUESTIONS.md` | What this package does not establish, and what remains open. |
| `model/` | Deterministic stdlib-Python simulator (allocation schemes, metrics, population generation, scenario runner). |
| `scenarios/*.json` | 26 scenario manifests covering the required adversarial scenarios. |
| `results/*.json` | Machine-readable per-scenario outputs (regenerable). |
| `results/TABLES.md` | Generated concentration/welfare/attack-profitability tables. |
| `tests/` | `unittest` suite: allocation invariants, metrics properties, and scenario-level adversarial findings. |
| `simulate.py` | Entry point: runs every manifest and regenerates `results/`. |

## Reproduction

From the repository root:

```bash
# Regenerate all scenario results
python3 experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/simulate.py

# Unit tests (allocation, metrics, adversarial findings, determinism)
python3 -m unittest discover -s experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001/tests -v
```

Every scenario is seeded and deterministic: re-running `simulate.py` reproduces `results/*.json` byte-for-byte (enforced by `tests/test_scenarios.py::TestScenarioDeterminism`), with the sole documented exception that the `CONCAVE_LOG` allocation scheme uses IEEE-754 `math.log1p` and is therefore reproducible per-toolchain rather than claimed bit-identical across all Python builds (see `NONCLAIMS_AND_OPEN_QUESTIONS.md`).

## Scope discipline

- Synthetic agents and scenarios only; no live charity addresses, donors, funds, or solicitation.
- No market-price prediction — token value is expressed only as a multiplier on a declared reference breakeven price.
- No change to the Beneficial Genesis cryptographic verifier (`experiments/BENEFICIAL_GENESIS_DESIGN_001/protocol/**`); this package is independent code that does not import or modify it.
- No legal conclusions; legal/economic issue surfaces are flagged for later qualified review (Track F of issue #33).

## Headline findings (see linked documents for full evidence)

1. The fixed pool is issued in full regardless of subscription level (`19_undersubscribed_pool`, `20_oversubscribed_pool`) — sale-like behaviour independent of transferability.
2. Every allocation rule that meaningfully reduces whale concentration for honest single identities (concave weighting, per-identity caps) is severely exploitable by free, unlinkable identity splitting in a permissionless Bitcoin-only design (`05_sybil_split_concave`, `26_sybil_split_capped_pro_rata`); linear pro-rata is split-invariant but does nothing to prevent whale concentration by size alone (`03_whale_99`).
3. Charity rebate/circularity attacks are unconditionally profitable and cryptographically undetectable, exactly equal to the rebate amount (`07_rebate_sweep`, `08_secret_rebate_whale`, `18_charity_set_single_vs_multi`).
4. Stolen-key donations launder the full gross token value at zero cost to the attacker, because cryptographic control is verified, not legal ownership (`10_stolen_key_donation`, `11_quantum_cutoff_freeze`).
5. Proportional governance lets a single honest whale cross simple majority by donation size alone (`13_governance_proportional`); an independently enforced cap prevents this at allocation time but this study cannot verify continuous post-genesis enforcement (`14_governance_capped`).

## Second-family review

Not yet performed for this submission (see `NONCLAIMS_AND_OPEN_QUESTIONS.md`, "Second-family review"). This is a single-seat (Designer/Red-Team) result pending independent review.
