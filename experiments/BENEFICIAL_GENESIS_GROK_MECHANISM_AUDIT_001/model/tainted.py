"""Tainted/unauthorized source-asset opportunity-cost sensitivity.

Cryptographic admission does not equal clean title. This grid shows when
an attacker with cost basis c (including seizure/legal risk haircut) and
expected allocation value would find donation-for-claim profitable under
assumed parameters. Not a prediction of real laundering volumes.
"""

from __future__ import annotations

from fractions import Fraction
from typing import Iterable

from .allocation import allocate_proportional


def attacker_net(
    tainted_sats: int,
    others_eligible: int,
    pool: int,
    *,
    retention_value_per_sat: Fraction,
    alloc_value_per_unit: Fraction,
    seizure_haircut_if_retain: Fraction = Fraction(0),
) -> dict:
    """Compare retain vs donate-and-claim under assumed values.

    retain_value = tainted_sats * retention * (1 - haircut)
    donate: lose tainted_sats on source (or their retention value), gain alloc * v
    """
    rec = allocate_proportional(pool, [tainted_sats, others_eligible])
    alloc = rec["allocations"][0]
    retain = (
        tainted_sats
        * retention_value_per_sat.numerator
        * (seizure_haircut_if_retain.denominator - seizure_haircut_if_retain.numerator)
    ) // (
        retention_value_per_sat.denominator * seizure_haircut_if_retain.denominator
    )
    # simpler: retention_value_per_sat already nets haircut if caller wants
    retain_simple = (tainted_sats * retention_value_per_sat.numerator) // retention_value_per_sat.denominator
    if seizure_haircut_if_retain > 0:
        retain_simple = (
            retain_simple
            * (seizure_haircut_if_retain.denominator - seizure_haircut_if_retain.numerator)
        ) // seizure_haircut_if_retain.denominator
    alloc_val = (alloc * alloc_value_per_unit.numerator) // alloc_value_per_unit.denominator
    # opportunity: forgoing retain_simple, gaining alloc_val (and any rebate=0 here)
    net_vs_retain = alloc_val - retain_simple
    return {
        "tainted_sats": tainted_sats,
        "others_eligible": others_eligible,
        "pool": pool,
        "alloc": alloc,
        "retain_value_assumed": retain_simple,
        "alloc_value_assumed": alloc_val,
        "net_vs_retain": net_vs_retain,
        "attack_profitable_under_assumptions": net_vs_retain > 0,
        "evidence_class": "conditional_model_parameter_sensitivity",
    }


def tainted_ev_grid(
    *,
    pool: int = 1_000_000_000,
    tainted_sats: int = 10_000_000,
    others_list: Iterable[int] = (10_000_000, 100_000_000, 1_000_000_000),
    retention_values: Iterable[Fraction] = (
        Fraction(1, 1),
        Fraction(1, 2),
        Fraction(1, 10),
        Fraction(0, 1),
    ),
    alloc_values: Iterable[Fraction] = (
        Fraction(0, 1),
        Fraction(1, 1000),
        Fraction(1, 100),
        Fraction(1, 10),
        Fraction(1, 1),
    ),
) -> list[dict]:
    rows = []
    for others in others_list:
        for rv in retention_values:
            for av in alloc_values:
                row = attacker_net(
                    tainted_sats,
                    others,
                    pool,
                    retention_value_per_sat=rv,
                    alloc_value_per_unit=av,
                )
                row["retention_value_per_sat"] = str(rv)
                row["alloc_value_per_unit"] = str(av)
                rows.append(row)
    return rows
