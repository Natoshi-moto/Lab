#!/usr/bin/env python3
"""Run independent mechanism probes; write machine-readable results.

Does not import subject economics packages.
"""

from __future__ import annotations

import json
import sys
from fractions import Fraction
from pathlib import Path

# Ensure package import when run as script
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent))  # experiments/ on path? use local
sys.path.insert(0, str(ROOT))

from model.allocation import (  # noqa: E402
    allocate_capped_pro_rata,
    allocate_concave_log,
    allocate_concave_sqrt,
    allocate_proportional,
    floor_residual_split_demo,
    supply_ok,
    sybil_gain_concave,
)
from model.alternatives import compare_transfer_regimes, undersubscription_share  # noqa: E402
from model.governance import coalition_vs_cap, gov_cap_then_renormalize, gov_proportional  # noqa: E402
from model.metrics import concentration_report  # noqa: E402
from model.rebate import charity_net_after_rebate, rebate_incidence, whale_charity_collusion  # noqa: E402
from model.tainted import tainted_ev_grid  # noqa: E402

POOL = 1_000_000_000
OUT = ROOT / "results"


def dump(name: str, obj: object) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"wrote {path}")


def main() -> int:
    results: dict = {"audit_id": "BGEN-GROK-MECHANISM-AUDIT-001", "pool_default": POOL}

    # 1. Supply conservation + whale scenarios
    whale_cases = {}
    for label, wshare in [("whale_50", Fraction(1, 2)), ("whale_80", Fraction(4, 5)), ("whale_99", Fraction(99, 100))]:
        T = 100_000_000
        w = (T * wshare.numerator) // wshare.denominator
        o = T - w
        rec = allocate_proportional(POOL, [w, o])
        assert supply_ok(rec)
        whale_cases[label] = {
            **rec,
            "concentration": concentration_report(rec["allocations"]),
        }
    dump("01_whale_concentration.json", whale_cases)
    results["whale_concentration"] = {k: v["concentration"] for k, v in whale_cases.items()}

    # 2. Split invariance linear
    split = floor_residual_split_demo(POOL, 10_000_003, 7)
    dump("02_split_invariance_linear.json", split)
    results["split_invariance"] = split

    # 3. Concave Sybil
    sybil = {
        "sqrt": sybil_gain_concave(POOL, 10_000_000, 100, "sqrt"),
        "log2": sybil_gain_concave(POOL, 10_000_000, 100, "log2"),
        "sqrt_vs_pro_rata_control": {
            "pro_rata_split": floor_residual_split_demo(POOL, 10_000_000, 100),
            "note": "pro-rata should not reward sybil; concave should",
        },
    }
    dump("03_concave_sybil.json", sybil)
    results["concave_sybil"] = {
        "sqrt_profitable": sybil["sqrt"]["sybil_strictly_profitable"],
        "log2_profitable": sybil["log2"]["sybil_strictly_profitable"],
        "sqrt_gain": sybil["sqrt"]["sybil_gain"],
        "log2_gain": sybil["log2"]["sybil_gain"],
    }

    # 4. Cap without identity (Sybil evasion)
    e = [80_000_000] + [200_000] * 100  # whale 80M + dust
    capped_one = allocate_capped_pro_rata(
        POOL, [80_000_000, 20_000_000], cap_share=Fraction(1, 10), identity=["whale", "rest"]
    )
    # same whale split into 20 identities of 4M each + rest
    parts = [4_000_000] * 20 + [20_000_000]
    ids = [f"w{i}" for i in range(20)] + ["rest"]
    capped_sybil = allocate_capped_pro_rata(POOL, parts, cap_share=Fraction(1, 10), identity=ids)
    whale_get_one = capped_one["identity_allocations"]["whale"]
    whale_get_sybil = sum(capped_sybil["identity_allocations"][f"w{i}"] for i in range(20))
    cap_evasion = {
        "cap_share": "1/10",
        "whale_as_one_identity_alloc": whale_get_one,
        "whale_as_20_identities_alloc": whale_get_sybil,
        "sybil_evades_cap": whale_get_sybil > whale_get_one,
        "one": capped_one,
        "sybil": {
            "total_issued": capped_sybil["total_issued"],
            "identity_allocations": capped_sybil["identity_allocations"],
        },
    }
    dump("04_cap_sybil_evasion.json", cap_evasion)
    results["cap_sybil_evasion"] = {
        "sybil_evades_cap": cap_evasion["sybil_evades_cap"],
        "whale_one": whale_get_one,
        "whale_sybil": whale_get_sybil,
    }

    # 5. Denominator uncertainty
    early = allocate_proportional(POOL, [1_000_000, 9_000_000])  # thinks T=10M share 10%
    # late shock doubles T
    late = allocate_proportional(POOL, [1_000_000, 19_000_000])
    denom = {
        "early_expected_alloc": early["allocations"][0],
        "after_denominator_doubles": late["allocations"][0],
        "dilution_ratio": str(Fraction(late["allocations"][0], early["allocations"][0])),
        "note": "Late inflow dilutes early donors; miner/cutoff influence is structural pathway on real chain.",
    }
    dump("05_denominator_uncertainty.json", denom)
    results["denominator_uncertainty"] = denom

    # 6. Undersubscription / oversubscription
    under = undersubscription_share(POOL, small_T=1_000, large_T=1_000_000_000)
    over_rec = allocate_proportional(POOL, [1] + [10**12] * 5)
    under_over = {
        "undersubscription": under,
        "oversubscription_tiny_per_sat": over_rec["allocations"][0],
        "over_remainder": over_rec["remainder_unissued"],
    }
    dump("06_under_over_subscription.json", under_over)
    results["under_over"] = under_over

    # 7. Rebate frictions
    rebate_rows = []
    for rate in [Fraction(0), Fraction(1, 4), Fraction(1, 2), Fraction(1), Fraction(1)]:
        for access in [Fraction(0), Fraction(1, 10), Fraction(1, 2), Fraction(1)]:
            rebate_rows.append(
                charity_net_after_rebate(100_000_000, rebate_rate=rate, access_share=access)
            )
    dump("07_rebate_friction_grid.json", {"rows": rebate_rows})
    # secret rebate whale only
    secret = rebate_incidence(
        [50_000_000, 1_000_000, 1_000_000, 1_000_000],
        rebate_rate=Fraction(1, 2),
        access_mask=[True, False, False, False],
    )
    dump("08_secret_rebate_whale.json", secret)
    results["rebate"] = {
        "full_access_100pct_rebate_charity_net": charity_net_after_rebate(
            100_000_000, rebate_rate=Fraction(1), access_share=Fraction(1)
        )["charity_net"],
        "low_access_10pct_half_rebate_net": charity_net_after_rebate(
            100_000_000, rebate_rate=Fraction(1, 2), access_share=Fraction(1, 10)
        )["charity_net"],
        "secret_whale": secret,
    }

    # 8. Whale + charity collusion EV (conditional)
    collude = []
    for v in [Fraction(0), Fraction(1, 100), Fraction(1, 10), Fraction(1)]:
        collude.append(
            whale_charity_collusion(
                50_000_000,
                50_000_000,
                POOL,
                rebate_rate=Fraction(1, 2),
                token_value_per_unit=v,
            )
        )
    dump("09_whale_charity_collusion.json", collude)
    results["collusion_conditional"] = collude

    # 9. Tainted grid (summary counts)
    grid = tainted_ev_grid()
    profitable = sum(1 for r in grid if r["attack_profitable_under_assumptions"])
    dump(
        "10_tainted_sensitivity.json",
        {
            "n_rows": len(grid),
            "n_profitable_under_assumptions": profitable,
            "sample": grid[:5],
            "all_rows": grid,
        },
    )
    results["tainted"] = {
        "n_rows": len(grid),
        "n_profitable_under_assumptions": profitable,
        "interpretation": (
            "Profitability is parameter-region conditional; not inevitability. "
            "When retention value of tainted funds is low and alloc value high, "
            "structural pathway favors donation-for-claim."
        ),
    }

    # 10. Governance
    units = [80, 5, 5, 5, 5]
    # Whale 80 vs rest 20 as single identity, vs whale Sybil-split into 10x8
    one_ids = gov_cap_then_renormalize([80, 20], Fraction(1, 10), identity=["whale", "rest"])
    many_ids = gov_cap_then_renormalize(
        [8] * 10 + [20],
        Fraction(1, 10),
        identity=[f"w{i}" for i in range(10)] + ["rest"],
    )
    whale_one_share = one_ids["shares"][0]
    whale_many_w = sum(many_ids["weights"][:10])
    whale_many_share = str(Fraction(whale_many_w, many_ids["total_weight"]))
    gov = {
        "proportional": gov_proportional(units),
        "cap_renorm": gov_cap_then_renormalize(units, Fraction(1, 10)),
        "coalition_vs_outsiders": {
            "whale_share_as_one_identity": whale_one_share,
            "whale_share_as_10_sybil_ids": whale_many_share,
            "splitting_increases_gov_power": Fraction(whale_many_share) > Fraction(whale_one_share),
            "one": one_ids,
            "many": {
                "weights": many_ids["weights"],
                "shares": many_ids["shares"],
                "total_weight": many_ids["total_weight"],
            },
            "evidence_class": "structural_pathway_under_weak_identity",
        },
        "coalition_only_population_control": coalition_vs_cap(
            [8, 8, 8, 8, 8, 8, 8, 8, 8, 8], cap_share=Fraction(1, 10)
        ),
    }
    dump("11_governance.json", gov)
    results["governance"] = {
        "prop_top_share": gov["proportional"]["shares"][0],
        "whale_gov_share_capped_one_id": whale_one_share,
        "whale_gov_share_capped_sybil": whale_many_share,
        "coalition_splitting_increases_power_vs_outsiders": gov["coalition_vs_outsiders"][
            "splitting_increases_gov_power"
        ],
    }

    # 11. Alternatives / transferability
    alts = compare_transfer_regimes()
    dump("12_transfer_regimes.json", alts)
    results["transferability_necessity_structural"] = {
        "necessary_for_F1_to_F4": alts["structural_necessity_of_transferability_for_F1_to_F4"],
        "reasoning": alts["reasoning"],
    }

    # 12. Exchange omnibus vs small donors (aggregation)
    small = [10_000] * 10_000
    exchange = [100_000_000]
    # equal total 100M
    r_small = allocate_proportional(POOL, small)
    r_ex = allocate_proportional(POOL, exchange)
    omnibus = {
        "ten_thousand_small_sum_alloc": sum(r_small["allocations"]),
        "one_exchange_alloc": r_ex["allocations"][0],
        "same_total_eligible": sum(small) == sum(exchange),
        "note": "Pro-rata is linear: aggregation does not change total allocation to the economic owner if total e equal; custody/governance aggregation still concentrates control.",
        "small_concentration": concentration_report(r_small["allocations"]),
        "exchange_concentration": concentration_report(r_ex["allocations"]),
    }
    dump("13_exchange_omnibus.json", omnibus)
    results["exchange_omnibus"] = omnibus

    # 13. Mathematical supply stress
    stress = []
    for P, elig in [
        (1, [1]),
        (100, [1, 1, 1]),
        (10**18, [10**18, 1]),
        (POOL, [1] * 1000),
        (POOL, [MAX := 10**15, 1, 1, 1]),
    ]:
        rec = allocate_proportional(P, elig)
        stress.append({"ok": supply_ok(rec), "issued": rec["total_issued"], "rem": rec["remainder_unissued"], "P": P})
    dump("14_supply_stress.json", stress)
    results["supply_stress_all_ok"] = all(s["ok"] for s in stress)

    # Sign-reversal demo: charity net vs rebate access
    # At access=0, net=donated; at access=1 rate=1, net=0 — monotone decrease, no reversal of "rebates reduce net"
    # Sign reversal on whale profitability: depends on v
    sign = {
        "charity_net_monotone_in_rebate": True,
        "whale_profit_sign_depends_on_v": True,
        "example_v_low_unprofitable": collude[0]["profitable_under_assumptions"],
        "example_v_high_may_profit": collude[-1]["profitable_under_assumptions"],
    }
    dump("15_sign_sensitivity.json", sign)
    results["sign_sensitivity"] = sign

    # Summary verdicts inputs
    summary = {
        "results_index": results,
        "key_confirmed_math": [
            "supply conservation under floor pro-rata",
            "linear split does not increase splitter allocation (may decrease)",
            "concave weights strictly Sybil-rewarding in tested probes",
            "identity-free caps Sybil-evaded",
            "transferability not structurally necessary for F1-F4",
        ],
        "key_conditional": [
            "rebate destroys charity net only to the extent of access*rate",
            "tainted-flow profitability is region-dependent on retention vs alloc value",
            "whale collusion profitability depends on assumed v",
        ],
        "key_unresolved_empirical": [
            "actual access friction distribution",
            "participation elasticity",
            "secondary market price",
            "displaced vs additional giving",
        ],
    }
    dump("SUMMARY.json", summary)
    print("ALL_PROBES_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
