"""Charity rebate/collusion economics with explicit access frictions.

Repair note (E-002 / BGEN-ECON-REV-002): the original package set
``rebate_rate`` exogenously and correctly proved the conditional
arithmetic (given a rebate arrangement at zero additional cost, donor
utility rises and charity retention falls by exactly the rebate amount).
It then over-generalized that result into "rational profit-seeking donor
behavior is predicted... to erode aggregate charity benefit," without
modelling the probability or cost of finding or sustaining a colluding
charity relationship. Beneficial Genesis's charity set is fixed at
genesis (an immutable registry per the design pack); "create a colluding
charity" is not a free action available to an arbitrary donor.

This module keeps the exact conditional arithmetic (never disputes it —
that part was correct) and adds an *expected*, friction-adjusted view
layered on top of it: access probability, arrangement cost, enforcement
probability, and detection probability/loss. The conditional and expected
numbers are reported side by side and are never merged into a single
"the" answer.
"""

from __future__ import annotations

from fractions import Fraction
from typing import Any


def conditional_and_expected_rebate(
    *,
    donated_sats: int,
    rebate_rate: Fraction,
    colluding_arrangement_exists: bool,
    access_probability: Fraction = Fraction(0),
    arrangement_cost_sats: Fraction = Fraction(0),
    enforcement_probability: Fraction = Fraction(1),
    detection_probability: Fraction = Fraction(0),
    detection_loss_fraction: Fraction = Fraction(1, 2),
) -> dict[str, Any]:
    """Compute both the conditional (arrangement assumed to exist) and the
    expected (frictions applied) rebate incidence for one donor.

    ``colluding_arrangement_exists=True`` models a donor for whom an
    arrangement is already in place (access probability is then treated
    as 1 for that donor specifically); otherwise ``access_probability``
    is the modelled chance an arbitrary donor can find and use one.
    """
    for name, value in (
        ("rebate_rate", rebate_rate),
        ("access_probability", access_probability),
        ("enforcement_probability", enforcement_probability),
        ("detection_probability", detection_probability),
        ("detection_loss_fraction", detection_loss_fraction),
    ):
        if not (Fraction(0) <= value <= Fraction(1)):
            raise ValueError(f"{name} must be in [0, 1]")
    if donated_sats < 0:
        raise ValueError("donated_sats must be non-negative")

    face = Fraction(donated_sats)

    conditional_rebate = face * rebate_rate
    conditional_retained = face - conditional_rebate

    p_access = Fraction(1) if colluding_arrangement_exists else access_probability
    p_paid = p_access * enforcement_probability
    expected_rebate = face * rebate_rate * p_paid
    expected_detection_loss = face * detection_loss_fraction * detection_probability * p_access
    expected_arrangement_cost = arrangement_cost_sats * p_access
    expected_donor_net_from_rebate = expected_rebate - expected_detection_loss - expected_arrangement_cost
    expected_retained = face - expected_rebate

    return {
        "donated_sats": donated_sats,
        "rebate_rate": str(rebate_rate),
        "conditional": {
            "rebate_sats": str(conditional_rebate),
            "charity_retained": str(conditional_retained),
            "note": (
                "conditional arithmetic only: assumes a rebate arrangement already "
                "exists at this rate, at zero additional arrangement/detection cost"
            ),
        },
        "expected_with_frictions": {
            "access_probability_used": str(p_access),
            "expected_rebate_sats": str(expected_rebate),
            "expected_charity_retained": str(expected_retained),
            "expected_donor_net_from_rebate": str(expected_donor_net_from_rebate),
            "arrangement_cost_sats": str(arrangement_cost_sats),
            "enforcement_probability": str(enforcement_probability),
            "detection_probability": str(detection_probability),
            "detection_loss_fraction": str(detection_loss_fraction),
        },
        "claims": {
            "conditional_one_for_one_reduction_holds": True,
            "predictable_aggregate_destruction_of_charity_benefit": False,
            "predictable_note": (
                "cannot claim rational donors predictably destroy aggregate charity "
                "benefit without access, enforcement, and detection assumptions; the "
                "immutable genesis charity set makes acquiring a colluding destination "
                "a nontrivial capability, not a free donor action"
            ),
        },
    }
