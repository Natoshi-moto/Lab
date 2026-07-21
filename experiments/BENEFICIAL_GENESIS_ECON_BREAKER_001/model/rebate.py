"""Conditional charity-rebate model (BGEN-ECON-REV-002).

The simulator may set rebate_rate exogenously to prove arithmetic incidence:
conditional on a rebate existing at stated cost, donor utility rises and charity
retention falls. That is not a behavioral prediction that rational donors
predictably destroy aggregate charity benefit.

Immutable genesis charity sets make "create a colluding charity" a nontrivial
capability, not a free donor action.
"""

from __future__ import annotations

from typing import Any, Sequence


def conditional_rebate_outcome(
    *,
    donations_by_charity: Sequence[dict[str, Any]],
    # Expected probability a donor can access a colluding rebate arrangement
    # for a given honest-looking charity in the genesis set.
    access_probability: float = 0.0,
    # Fixed search/negotiation cost in sats-equivalent to arrange a rebate.
    arrangement_cost_sats: float = 0.0,
    # Probability the side agreement is enforced (charity actually pays).
    enforcement_probability: float = 1.0,
    # Probability of detection leading to exclusion / clawback / legal loss.
    detection_probability: float = 0.0,
    # Expected loss if detected, as fraction of donated amount.
    detection_loss_fraction: float = 0.5,
    # Exogenous rebate rate conditional on successful collusion (0..1).
    rebate_rate_if_colluding: float = 0.0,
) -> dict[str, Any]:
    """Compute conditional and expected rebate incidence.

    donations_by_charity items:
      charity_id, donated_sats, colluding (bool), rebate_rate (optional override)
    """
    if not 0.0 <= access_probability <= 1.0:
        raise ValueError("access_probability in [0,1]")
    if not 0.0 <= enforcement_probability <= 1.0:
        raise ValueError("enforcement_probability in [0,1]")
    if not 0.0 <= detection_probability <= 1.0:
        raise ValueError("detection_probability in [0,1]")

    per_charity = []
    total_donated = 0
    total_conditional_rebate = 0.0  # if collusion exists at full rate
    total_expected_rebate = 0.0
    total_charity_retained_conditional = 0.0
    total_charity_retained_expected = 0.0
    total_expected_donor_net = 0.0

    for row in donations_by_charity:
        cid = row["charity_id"]
        donated = int(row["donated_sats"])
        colluding = bool(row.get("colluding", False))
        rate = float(row.get("rebate_rate", rebate_rate_if_colluding if colluding else 0.0))
        if rate < 0 or rate > 1:
            raise ValueError("rebate_rate in [0,1]")
        total_donated += donated

        # Conditional arithmetic: given collusion at rate, zero extra cost.
        cond_rebate = donated * rate
        cond_retained = donated - cond_rebate
        total_conditional_rebate += cond_rebate
        total_charity_retained_conditional += cond_retained

        # Behavioral / access model:
        # If already marked colluding, access_probability is treated as 1 for that row
        # (arrangement exists). Else donor must find access.
        p_access = 1.0 if colluding else access_probability
        p_pay = p_access * enforcement_probability
        expected_rebate = donated * rate * p_pay
        expected_detection_loss = donated * detection_loss_fraction * detection_probability * p_access
        expected_arrangement_cost = arrangement_cost_sats * p_access
        expected_donor_net_from_rebate = (
            expected_rebate - expected_detection_loss - expected_arrangement_cost
        )
        expected_retained = donated - expected_rebate

        total_expected_rebate += expected_rebate
        total_charity_retained_expected += expected_retained
        total_expected_donor_net += expected_donor_net_from_rebate

        per_charity.append(
            {
                "charity_id": cid,
                "donated_sats": donated,
                "colluding": colluding,
                "rebate_rate": rate,
                "conditional_rebate_sats": cond_rebate,
                "conditional_charity_retained": cond_retained,
                "expected_rebate_sats": expected_rebate,
                "expected_charity_retained": expected_retained,
                "expected_donor_net_from_rebate": expected_donor_net_from_rebate,
                "p_access": p_access,
            }
        )

    return {
        "total_donated_sats": total_donated,
        "conditional": {
            "total_rebate_sats": total_conditional_rebate,
            "total_charity_retained": total_charity_retained_conditional,
            "note": (
                "Conditional arithmetic only: assumes rebate arrangement exists at "
                "stated rate with zero arrangement/detection cost."
            ),
        },
        "expected_with_frictions": {
            "total_rebate_sats": total_expected_rebate,
            "total_charity_retained": total_charity_retained_expected,
            "total_expected_donor_net_from_rebate": total_expected_donor_net,
            "access_probability_default": access_probability,
            "arrangement_cost_sats": arrangement_cost_sats,
            "enforcement_probability": enforcement_probability,
            "detection_probability": detection_probability,
            "detection_loss_fraction": detection_loss_fraction,
        },
        "per_charity": per_charity,
        "claims": {
            "conditional_one_for_one_reduction": True,
            "predictable_aggregate_destruction_of_charity_benefit": False,
            "predictable_note": (
                "Cannot claim rational donors predictably destroy aggregate charity "
                "benefit without access, enforcement, detection, and genesis-set "
                "composition assumptions. Immutable genesis set makes adding a "
                "colluding charity a nontrivial capability."
            ),
        },
    }


def rebate_rate_sweep(
    donated_sats: int,
    rates: Sequence[float],
) -> list[dict[str, float]]:
    """Pure conditional incidence table for rates in [0,1]."""
    out = []
    for r in rates:
        o = conditional_rebate_outcome(
            donations_by_charity=[
                {"charity_id": "C", "donated_sats": donated_sats, "colluding": True, "rebate_rate": r}
            ],
            access_probability=1.0,
            enforcement_probability=1.0,
            detection_probability=0.0,
        )
        out.append(
            {
                "rebate_rate": float(r),
                "conditional_rebate": o["conditional"]["total_rebate_sats"],
                "conditional_retained": o["conditional"]["total_charity_retained"],
            }
        )
    return out
