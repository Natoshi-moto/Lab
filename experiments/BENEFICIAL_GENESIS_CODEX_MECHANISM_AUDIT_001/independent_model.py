#!/usr/bin/env python3
"""Independent exact-arithmetic mechanism probes; imports no subject modules."""
from __future__ import annotations

import json
from fractions import Fraction as F
from math import isqrt
from pathlib import Path

POOL = 1_000_000


def alloc(weights: list[int], pool: int = POOL) -> tuple[list[int], int]:
    if any(type(x) is not int or x < 0 for x in weights) or type(pool) is not int or pool < 0:
        raise ValueError("nonnegative integers required")
    total = sum(weights)
    out = [0] * len(weights) if total == 0 else [pool * x // total for x in weights]
    return out, pool - sum(out)


def sqrt_alloc(weights: list[int], pool: int = POOL) -> tuple[list[int], int]:
    return alloc([isqrt(x) for x in weights], pool)


def capped(weights: list[int], cap: int, pool: int = POOL) -> tuple[list[int], int]:
    raw, _ = alloc(weights, pool)
    out = [min(x, cap) for x in raw]
    return out, pool - sum(out)


def cap_then_renormalize(weights: list[int], cap_share: F) -> list[F]:
    total = sum(weights)
    if not total:
        return [F(0)] * len(weights)
    clipped = [min(F(x, total), cap_share) for x in weights]
    ctotal = sum(clipped)
    return [x / ctotal for x in clipped]


def welfare(*, gross: int, additional: F, displacement: F, rebate: F,
            rebate_access: F, taint_harm: F, other_harm: F) -> F:
    retained = F(gross) * (1 - rebate * rebate_access)
    incremental = retained * additional - F(gross) * displacement
    return incremental - F(gross) * (taint_harm + other_harm)


def donor_profit(*, contribution: int, token_multiple: F, rebate: F,
                 access: F, friction: F, opportunity_cost: F = F(1)) -> F:
    c = F(contribution)
    return c * token_multiple + c * rebate * access - c * friction - c * opportunity_cost


def q(x: F) -> str:
    return str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"


def run() -> dict:
    # Linear entitlement is split-invariant before floor, but floors penalize splits.
    unsplit, ur = alloc([7, 13], 101)
    split, sr = alloc([3, 4, 13], 101)
    # Concavity and per-identity caps reverse under free identity creation.
    sqrt_one, _ = sqrt_alloc([10_000, 10_000])
    sqrt_sybil, _ = sqrt_alloc([100] * 100 + [10_000])
    cap_one, _ = capped([10_000, 10_000], 100_000)
    cap_sybil, _ = capped([100] * 100 + [10_000], 100_000)

    gov = cap_then_renormalize([90, 10], F(1, 10))
    gov_single = cap_then_renormalize([100], F(1, 10))

    sign_grid = []
    for access in (F(0), F(1, 10), F(1, 2), F(1)):
        for token in (F(0), F(1, 2), F(1), F(3, 2)):
            p = donor_profit(contribution=100, token_multiple=token, rebate=F(4, 5),
                             access=access, friction=F(1, 20))
            sign_grid.append({"access": q(access), "token_multiple": q(token),
                              "profit": q(p), "sign": (p > 0) - (p < 0)})

    welfare_grid = []
    for additional in (F(0), F(1, 4), F(1)):
        for access in (F(0), F(1, 2), F(1)):
            w = welfare(gross=1000, additional=additional, displacement=F(1, 10),
                        rebate=F(4, 5), rebate_access=access,
                        taint_harm=F(1, 20), other_harm=F(1, 20))
            welfare_grid.append({"additional_fraction": q(additional), "rebate_access": q(access),
                                 "welfare": q(w), "sign": (w > 0) - (w < 0)})

    denominator = []
    for total in (1, 10, 1_000, 1_000_000):
        a, rem = alloc([total], POOL)
        denominator.append({"eligible_source": total, "allocation": a[0],
                            "units_per_source": q(F(a[0], total)), "remainder": rem})

    attacks = {
        "whale_plus_charity_rebate": "profitable iff token_multiple + rebate*access > opportunity_cost + friction",
        "exchange_plus_timing": "omnibus custody aggregates entitlement; privileged denominator information changes irreversible entry utility",
        "tainted_plus_rebate": "low private opportunity cost and rebate access expand the profitable region while social harm remains external",
        "sybil_plus_governance": "identity-based allocation mitigation fails before transferable or delegated governance is even acquired",
        "undersubscription_plus_speculation": "one minimum-unit donor receives the pool and can coordinate scarcity narratives; price response is UNABLE_TO_VERIFY",
        "miner_plus_denominator_shock": "censorship/inclusion near cutoff changes denominator and relative shares; probability and magnitude are UNABLE_TO_VERIFY",
        "charity_capture_plus_side_agreement": "exact-script payment cannot establish net retention or beneficial use",
        "secondary_accumulation_plus_governance": "transferable token-weighted control defeats genesis-only concentration limits"
    }

    result = {
        "schema": "bgen.codex-mechanism-results/v1",
        "arithmetic": "Python integers and Fraction except integer square root",
        "fixed_pool": {
            "unsplit": {"allocations": unsplit, "remainder": ur},
            "split": {"allocations": split, "remainder": sr},
            "same_actor_unsplit_units": unsplit[0],
            "same_actor_split_units": sum(split[:2]),
            "conservation_property_checked": all(sum(alloc([i, 101-i], 997)[0]) <= 997 for i in range(102))
        },
        "sybil_countermodels": {
            "sqrt_unsplit_actor_share": q(F(sqrt_one[0], sum(sqrt_one))),
            "sqrt_100_sybil_actor_share": q(F(sum(sqrt_sybil[:100]), sum(sqrt_sybil))),
            "cap_unsplit_actor_units": cap_one[0],
            "cap_100_sybil_actor_units": sum(cap_sybil[:100])
        },
        "cap_then_renormalize": {
            "weights_90_10_nominal_cap_10pct": [q(x) for x in gov],
            "single_holder_final_share_nominal_cap_10pct": q(gov_single[0]),
            "hard_cap_falsified": gov_single[0] > F(1, 10)
        },
        "denominator_sensitivity": denominator,
        "rebate_profit_sign_grid": sign_grid,
        "welfare_sign_grid": welfare_grid,
        "combined_attacks": attacks,
        "product_functions": {
            "payment": "UNSPECIFIED",
            "fees": "UNSPECIFIED",
            "staking": "UNSPECIFIED",
            "security_bonding": "UNSPECIFIED",
            "governance": "UNSPECIFIED",
            "bootstrap_ownership_distribution": "PLAUSIBLE_BUT_UNSPECIFIED_AS_REQUIREMENT",
            "recognition": "SUPPORTED_BY_RECEIPT_WITHOUT_TRANSFER",
            "store_of_value": "UNSPECIFIED_AND_NOT_DEMONSTRATED"
        }
    }
    return result


if __name__ == "__main__":
    result = run()
    target = Path(__file__).with_name("results") / "independent_results.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(target), "checks": result["fixed_pool"]["conservation_property_checked"]}))
