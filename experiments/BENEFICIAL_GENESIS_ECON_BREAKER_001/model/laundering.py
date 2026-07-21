"""Stolen / tainted fund economics with explicit opportunity-cost decomposition.

Addresses BGEN-ECON-REV-001 independently:

The verifier cannot distinguish legal ownership from cryptographic control.
That pathway existence is distinct from proving zero-cost profitable laundering.

Net laundering profit must separate:
  - legal_cost_basis
  - source_asset_opportunity_value
  - gross_token_output
  - seizure / liquidation / lockup / transaction risk adjustments
  - net_laundering_profit
"""

from __future__ import annotations

from typing import Any


def laundering_economics(
    *,
    donated_sats: int,
    allocation_units: int,
    # Token value model: units of "source-sats-equivalent" per allocation unit.
    # 1.0 means modeler assumes token EV equals 1 sat of source value per unit
    # when total_eligible == pool under pro-rata (illustrative only).
    token_value_per_unit_in_sats: float,
    legal_cost_basis_sats: float = 0.0,
    # What the attacker could realize by alternative disposition of the stolen asset
    # (sell OTC, mix, ransom, retain), as a fraction of face value in [0, 1+].
    alternative_realization_fraction: float = 0.7,
    seizure_probability_if_spend_source: float = 0.3,
    seizure_probability_if_migrate: float = 0.2,
    liquidation_haircut_on_token: float = 0.15,
    lockup_months: float = 0.0,
    monthly_discount_rate: float = 0.01,
    transaction_risk_cost_sats: float = 0.0,
) -> dict[str, Any]:
    """Return decomposed attacker economics. All outputs are model-conditional."""

    if donated_sats < 0 or allocation_units < 0:
        raise ValueError("non-negative donated_sats and allocation_units required")

    face = float(donated_sats)
    # Opportunity value of keeping/using the stolen source asset, risk-adjusted.
    source_asset_opportunity_value = (
        face
        * alternative_realization_fraction
        * (1.0 - seizure_probability_if_spend_source)
    )

    gross_token_output_face = float(allocation_units) * float(token_value_per_unit_in_sats)
    # Liquidation haircut and migration-path seizure risk.
    after_haircut = gross_token_output_face * (1.0 - liquidation_haircut_on_token)
    after_seizure = after_haircut * (1.0 - seizure_probability_if_migrate)
    # Simple lockup discount: PV = V / (1+r)^m
    if lockup_months > 0:
        discount = (1.0 + monthly_discount_rate) ** lockup_months
        pv_token = after_seizure / discount
    else:
        discount = 1.0
        pv_token = after_seizure

    gross_token_output = gross_token_output_face
    risk_adjusted_token_value = pv_token
    net_laundering_profit = (
        risk_adjusted_token_value
        - source_asset_opportunity_value
        - float(transaction_risk_cost_sats)
    )

    # Also report a naive "legal cost basis zero" gross that overstates profitability.
    naive_zero_basis_gross = risk_adjusted_token_value - legal_cost_basis_sats

    return {
        "donated_sats": donated_sats,
        "allocation_units": allocation_units,
        "legal_cost_basis_sats": legal_cost_basis_sats,
        "source_asset_opportunity_value": source_asset_opportunity_value,
        "gross_token_output": gross_token_output,
        "risk_adjusted_token_value": risk_adjusted_token_value,
        "net_laundering_profit": net_laundering_profit,
        "naive_zero_basis_gross_minus_legal_basis": naive_zero_basis_gross,
        "assumptions": {
            "token_value_per_unit_in_sats": token_value_per_unit_in_sats,
            "alternative_realization_fraction": alternative_realization_fraction,
            "seizure_probability_if_spend_source": seizure_probability_if_spend_source,
            "seizure_probability_if_migrate": seizure_probability_if_migrate,
            "liquidation_haircut_on_token": liquidation_haircut_on_token,
            "lockup_months": lockup_months,
            "monthly_discount_rate": monthly_discount_rate,
            "transaction_risk_cost_sats": transaction_risk_cost_sats,
            "discount_factor": discount,
        },
        "interpretation": {
            "pathway_exists": True,
            "pathway_note": (
                "Cryptographic control of stolen keys admits a claim; legal ownership "
                "is not checked by the verifier (design residual risk)."
            ),
            "zero_cost_profitable_laundering_proven": False,
            "zero_cost_note": (
                "Net profit is conditional on token value, alternative realization, "
                "seizure probabilities, haircuts, and lockup. legal_cost_basis=0 does "
                "not imply source_asset_opportunity_value=0."
            ),
            "profitable_under_these_assumptions": net_laundering_profit > 0,
        },
    }


def laundering_sensitivity_grid(
    *,
    donated_sats: int,
    allocation_units: int,
    token_multipliers: list[float],
    opportunity_fractions: list[float],
) -> list[dict[str, Any]]:
    """Grid over token EV multiplier and alternative realization fraction."""
    rows = []
    for mult in token_multipliers:
        for opp in opportunity_fractions:
            r = laundering_economics(
                donated_sats=donated_sats,
                allocation_units=allocation_units,
                token_value_per_unit_in_sats=mult,
                alternative_realization_fraction=opp,
            )
            rows.append(
                {
                    "token_value_per_unit_in_sats": mult,
                    "alternative_realization_fraction": opp,
                    "net_laundering_profit": r["net_laundering_profit"],
                    "profitable": r["interpretation"]["profitable_under_these_assumptions"],
                    "source_asset_opportunity_value": r["source_asset_opportunity_value"],
                    "risk_adjusted_token_value": r["risk_adjusted_token_value"],
                }
            )
    return rows
