"""Governance weight rules distinct from economic allocation transferability."""

from __future__ import annotations

from fractions import Fraction
from typing import Sequence

from .allocation import allocate_capped_pro_rata, allocate_proportional


def gov_proportional(economic_units: Sequence[int]) -> dict:
    total = sum(economic_units)
    weights = list(economic_units)
    return {
        "rule": "gov_proportional_to_economic_units",
        "weights": weights,
        "total": total,
        "shares": [str(Fraction(w, total) if total else Fraction(0)) for w in weights],
        "note": "Transferable economic units imply transferable governance under this rule.",
    }


def gov_capped(economic_units: Sequence[int], cap_share: Fraction = Fraction(1, 10)) -> dict:
    """Hard cap on governance share without renormalizing others (waste/quorum loss)."""
    total = sum(economic_units)
    if total == 0:
        return {"rule": "gov_hard_cap", "weights": list(economic_units), "cap_share": str(cap_share)}
    cap_w = (total * cap_share.numerator) // cap_share.denominator
    weights = [min(w, cap_w) for w in economic_units]
    tw = sum(weights)
    return {
        "rule": "gov_hard_cap_no_renorm",
        "cap_share": str(cap_share),
        "cap_weight": cap_w,
        "weights": weights,
        "total_weight": tw,
        "shares_of_capped_total": [
            str(Fraction(w, tw) if tw else Fraction(0)) for w in weights
        ],
        "shares_of_original_economic": [
            str(Fraction(w, total)) for w in economic_units
        ],
    }


def gov_cap_then_renormalize(
    economic_units: Sequence[int],
    cap_share: Fraction = Fraction(1, 10),
    identity: Sequence[str] | None = None,
) -> dict:
    """Governance weights via same cap-then-renormalize as capped allocation.

    Uses allocate_capped_pro_rata with pool = sum(units) as weight mass.
    """
    pool = sum(economic_units)
    if pool == 0:
        return {"rule": "gov_cap_then_renormalize", "weights": list(economic_units)}
    rec = allocate_capped_pro_rata(
        pool, economic_units, cap_share=cap_share, identity=identity
    )
    w = rec["allocations"]
    tw = sum(w)
    return {
        "rule": "gov_cap_then_renormalize",
        "cap_share": str(cap_share),
        "weights": w,
        "total_weight": tw,
        "shares": [str(Fraction(x, tw) if tw else Fraction(0)) for x in w],
        "identity_allocations": rec.get("identity_allocations"),
        "coalition_note": (
            "Many sub-cap identities controlled by one coalition can re-aggregate "
            "to above cap if identity binding is weak or transferable units re-delegate."
        ),
    }


def coalition_vs_cap(
    units_per_member: Sequence[int],
    *,
    cap_share: Fraction = Fraction(1, 10),
) -> dict:
    """Coalition of members each under cap; sum may exceed cap of single whale."""
    each = gov_cap_then_renormalize(units_per_member, cap_share=cap_share)
    as_one = gov_cap_then_renormalize([sum(units_per_member)], cap_share=cap_share)
    coal_share = Fraction(sum(each["weights"]), each["total_weight"] or 1)
    one_share = Fraction(sum(as_one["weights"]), as_one["total_weight"] or 1)
    return {
        "members": list(units_per_member),
        "coalition_gov_share_if_separate_ids": str(coal_share),
        "single_identity_gov_share": str(one_share),
        "splitting_increases_gov_power": coal_share > one_share,
        "evidence_class": "structural_pathway_under_identity_model",
    }
