"""Charity rebate / collusion incidence with access frictions.

Out-of-protocol: modeled as parameters, not crypto-detectable.
"""

from __future__ import annotations

from fractions import Fraction
from typing import Sequence


def charity_net_after_rebate(
    donated: int,
    *,
    rebate_rate: Fraction,
    access_share: Fraction,
) -> dict:
    """Net retained by charity when fraction access_share of donated volume
    can obtain rebate at rate rebate_rate.

    rebate_paid = floor(donated * access_share * rebate_rate)
    charity_net = donated - rebate_paid
    """
    if type(donated) is not int or donated < 0:
        raise ValueError("donated")
    if not isinstance(rebate_rate, Fraction):
        rebate_rate = Fraction(rebate_rate)
    if not isinstance(access_share, Fraction):
        access_share = Fraction(access_share)
    if rebate_rate < 0 or rebate_rate > 1 or access_share < 0 or access_share > 1:
        raise ValueError("rates in [0,1]")
    # exact: rebate on accessible volume
    accessible = (donated * access_share.numerator) // access_share.denominator
    rebate_paid = (accessible * rebate_rate.numerator) // rebate_rate.denominator
    net = donated - rebate_paid
    return {
        "donated": donated,
        "rebate_rate": str(rebate_rate),
        "access_share": str(access_share),
        "accessible_volume": accessible,
        "rebate_paid": rebate_paid,
        "charity_net": net,
        "net_share_of_donated": str(Fraction(net, donated) if donated else Fraction(0)),
    }


def rebate_incidence(
    donations_by_actor: Sequence[int],
    *,
    rebate_rate: Fraction,
    access_mask: Sequence[bool],
) -> dict:
    """Per-actor rebate when access_mask[i] means actor i has rebate access."""
    if len(donations_by_actor) != len(access_mask):
        raise ValueError("length mismatch")
    if not isinstance(rebate_rate, Fraction):
        rebate_rate = Fraction(rebate_rate)
    rebates = []
    for d, acc in zip(donations_by_actor, access_mask):
        if acc:
            r = (d * rebate_rate.numerator) // rebate_rate.denominator
        else:
            r = 0
        rebates.append(r)
    donated = sum(donations_by_actor)
    paid = sum(rebates)
    return {
        "donations": list(donations_by_actor),
        "access_mask": list(access_mask),
        "rebate_rate": str(rebate_rate),
        "rebates": rebates,
        "total_donated": donated,
        "total_rebate_paid": paid,
        "charity_net": donated - paid,
        "whale_with_access_extracts": max(
            (r for r, a in zip(rebates, access_mask) if a), default=0
        ),
    }


def whale_charity_collusion(
    whale_donation: int,
    others_donation: int,
    pool: int,
    *,
    rebate_rate: Fraction,
    token_value_per_unit: Fraction,
) -> dict:
    """Combined attack: whale donates, gets pro-rata allocation, receives rebate.

    Illustrating structural EV under *assumed* token_value_per_unit (not a price forecast).
    whale_alloc ≈ floor(P * w / T)
    whale_gross ≈ whale_alloc * v + rebate - whale_donation (opportunity on source)
    """
    from .allocation import allocate_proportional

    T = whale_donation + others_donation
    rec = allocate_proportional(pool, [whale_donation, others_donation])
    whale_alloc = rec["allocations"][0]
    rebate = (whale_donation * rebate_rate.numerator) // rebate_rate.denominator
    # value of allocation in abstract source units under assumed v
    # v is Fraction: value per genesis quantum in source-sats terms
    alloc_value = (whale_alloc * token_value_per_unit.numerator) // token_value_per_unit.denominator
    # net in source-sats accounting under assumptions
    net = alloc_value + rebate - whale_donation
    return {
        "whale_donation": whale_donation,
        "others_donation": others_donation,
        "pool": pool,
        "whale_alloc": whale_alloc,
        "rebate": rebate,
        "token_value_per_unit": str(token_value_per_unit),
        "alloc_value_assumed": alloc_value,
        "whale_net_assumed": net,
        "profitable_under_assumptions": net > 0,
        "charity_net": whale_donation + others_donation - rebate,
        "evidence_class": "conditional_model_under_assumed_v_and_rebate_access",
    }
