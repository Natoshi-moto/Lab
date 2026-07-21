"""Stolen/tainted-fund migration economics with explicit opportunity-cost
decomposition.

Repair note (E-001 / BGEN-ECON-REV-001): the original package hard-coded
``true_economic_cost_borne_by_attacker = 0`` and called the resulting gross
token value ``laundering_gain``, which is internally inconsistent with the
same scenario's ``donor_economics`` block charging the attacker the full
donated-sats cost. That the verifier cannot distinguish legal ownership
from cryptographic control is a real, verified pathway (the design pack's
own residual-risk list says so). It does not by itself prove *zero-cost,
fully profitable* laundering: holding and spending stolen Bitcoin, or
donating it, all carry an opportunity cost and risk profile of their own,
even when the legal/accounting cost basis is zero.

This module separates:

- ``legal_cost_basis`` — what the attacker paid/owns in an accounting
  sense (0 for genuinely stolen funds);
- ``source_asset_opportunity_value`` — the risk-adjusted value the
  attacker forgoes by not pursuing an alternative disposition of the
  stolen asset (sell OTC, mix, ransom, retain and wait);
- ``gross_token_output`` — the face value of the allocation received,
  under the scenario's own declared token-value assumption;
- ``risk_adjusted_token_value`` — gross output after a liquidation
  haircut and a migration-path seizure/detection risk adjustment;
- ``realizable_token_value`` — risk-adjusted value after this package's
  existing lock-up illiquidity discount (kept consistent with
  ``FORMAL_MODEL.md``'s one declared discount schedule rather than
  introducing a second, incompatible one);
- ``net_migration_profit`` — realizable token value minus the source-asset
  opportunity cost, minus legal cost basis, minus transaction cost.

Every number here is a declared modelling assumption swept over a
sensitivity grid, never an empirical or legal claim about any real
attacker's cost structure.
"""

from __future__ import annotations

from fractions import Fraction
from typing import Any


def decompose_tainted_fund_economics(
    *,
    donated_sats: int,
    allocation_units: int,
    token_value_per_unit: Fraction,
    legal_cost_basis: Fraction = Fraction(0),
    alternative_realization_fraction: Fraction = Fraction(7, 10),
    seizure_probability_alternative_path: Fraction = Fraction(3, 10),
    seizure_probability_migration_path: Fraction = Fraction(1, 5),
    liquidation_haircut: Fraction = Fraction(3, 20),
    lockup_months: int = 0,
    transaction_cost_sats: Fraction = Fraction(0),
) -> dict[str, Any]:
    """Return the full decomposition for one tainted-fund donor. All
    fraction-valued parameters are assumptions, not calibrated facts.
    """
    for name, value in (
        ("alternative_realization_fraction", alternative_realization_fraction),
        ("seizure_probability_alternative_path", seizure_probability_alternative_path),
        ("seizure_probability_migration_path", seizure_probability_migration_path),
        ("liquidation_haircut", liquidation_haircut),
    ):
        if not (Fraction(0) <= value <= Fraction(1)):
            raise ValueError(f"{name} must be in [0, 1]")
    if donated_sats < 0 or allocation_units < 0 or lockup_months < 0:
        raise ValueError("donated_sats, allocation_units, lockup_months must be non-negative")

    face = Fraction(donated_sats)
    source_asset_opportunity_value = (
        face * alternative_realization_fraction * (Fraction(1) - seizure_probability_alternative_path)
    )

    gross_token_output = Fraction(allocation_units) * token_value_per_unit
    after_haircut = gross_token_output * (Fraction(1) - liquidation_haircut)
    risk_adjusted_token_value = after_haircut * (Fraction(1) - seizure_probability_migration_path)

    lockup_discount_pct = min(lockup_months * 7, 70)
    lockup_discount = Fraction(100 - lockup_discount_pct, 100)
    realizable_token_value = risk_adjusted_token_value * lockup_discount

    net_migration_profit = (
        realizable_token_value
        - source_asset_opportunity_value
        - legal_cost_basis
        - transaction_cost_sats
    )

    return {
        "donated_sats": donated_sats,
        "allocation_units": allocation_units,
        "legal_cost_basis": str(legal_cost_basis),
        "source_asset_opportunity_value": str(source_asset_opportunity_value),
        "gross_token_output": str(gross_token_output),
        "risk_adjusted_token_value": str(risk_adjusted_token_value),
        "realizable_token_value": str(realizable_token_value),
        "net_migration_profit": str(net_migration_profit),
        "assumptions": {
            "token_value_per_unit": str(token_value_per_unit),
            "alternative_realization_fraction": str(alternative_realization_fraction),
            "seizure_probability_alternative_path": str(seizure_probability_alternative_path),
            "seizure_probability_migration_path": str(seizure_probability_migration_path),
            "liquidation_haircut": str(liquidation_haircut),
            "lockup_months": lockup_months,
            "lockup_discount": str(lockup_discount),
            "transaction_cost_sats": str(transaction_cost_sats),
        },
        "interpretation": {
            "pathway_exists": True,
            "pathway_note": (
                "cryptographic control admits a claim; legal ownership is not checked "
                "by the verifier (a design residual risk documented independently of "
                "this package)"
            ),
            "zero_cost_unconditionally_profitable_laundering_proven": False,
            "profitable_under_these_assumptions": net_migration_profit > 0,
        },
    }


def tainted_fund_sensitivity_grid(
    *,
    donated_sats: int,
    allocation_units: int,
    token_value_multipliers: list[Fraction],
    alternative_realization_fractions: list[Fraction],
) -> list[dict[str, Any]]:
    """Sweep token-value assumption and alternative-realization assumption,
    holding other parameters at this module's defaults, and report where
    net migration profit is positive vs. negative.
    """
    rows = []
    for mult in token_value_multipliers:
        for opp in alternative_realization_fractions:
            r = decompose_tainted_fund_economics(
                donated_sats=donated_sats,
                allocation_units=allocation_units,
                token_value_per_unit=mult,
                alternative_realization_fraction=opp,
            )
            rows.append(
                {
                    "token_value_per_unit": str(mult),
                    "alternative_realization_fraction": str(opp),
                    "net_migration_profit": r["net_migration_profit"],
                    "profitable": r["interpretation"]["profitable_under_these_assumptions"],
                }
            )
    return rows
