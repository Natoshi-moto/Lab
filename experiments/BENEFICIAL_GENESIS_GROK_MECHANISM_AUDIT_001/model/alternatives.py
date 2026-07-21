"""Transfer regime comparison holding product functions F1–F4 constant.

F1: charity receives source value
F2: migration binding / claim right
F3: finite genesis distribution
F4: permissionless claim under genesis parameters

Does not claim market prices.
"""

from __future__ import annotations

from fractions import Fraction


def compare_transfer_regimes() -> dict:
    """Structural comparison matrix (qualitative + mechanism properties)."""
    regimes = {
        "no_token": {
            "serves_F1": True,
            "serves_F2": False,
            "serves_F3": False,
            "serves_F4_claim": False,
            "transferable_economic_unit": False,
            "secondary_market_attack_surface": "none_from_allocation_unit",
            "governance_via_allocation": False,
            "speculative_demand_channel": False,
            "necessary_for_charity_payment": False,
            "notes": "Direct donation alone achieves F1; no migration receipt.",
        },
        "non_transferable_receipt": {
            "serves_F1": True,
            "serves_F2": True,
            "serves_F3": True,
            "serves_F4_claim": True,
            "transferable_economic_unit": False,
            "secondary_market_attack_surface": "low_direct",
            "governance_via_allocation": "only_if_receipt_grants_gov",
            "speculative_demand_channel": "weak_unless_gov_or_status",
            "necessary_for_charity_payment": False,
            "notes": "Holds F1–F4 without alienable token; recognition/migration proof.",
        },
        "delayed_transfer": {
            "serves_F1": True,
            "serves_F2": True,
            "serves_F3": True,
            "serves_F4_claim": True,
            "transferable_economic_unit": "after_delay",
            "secondary_market_attack_surface": "deferred",
            "governance_via_allocation": "depends",
            "speculative_demand_channel": "forward_markets_possible",
            "necessary_for_charity_payment": False,
            "notes": "Moves risk in time; may reintroduce markets via expectations.",
        },
        "transferable_allocation": {
            "serves_F1": True,
            "serves_F2": True,
            "serves_F3": True,
            "serves_F4_claim": True,
            "transferable_economic_unit": True,
            "secondary_market_attack_surface": "high",
            "governance_via_allocation": "if_linked",
            "speculative_demand_channel": True,
            "necessary_for_charity_payment": False,
            "notes": "Adds liquidity/speculation/gov capture channels not required for F1–F4.",
        },
        "proof_of_burn_migration": {
            "serves_F1": False,
            "serves_F2": True,
            "serves_F3": True,
            "serves_F4_claim": True,
            "transferable_economic_unit": "optional",
            "secondary_market_attack_surface": "depends_on_unit",
            "governance_via_allocation": "depends",
            "speculative_demand_channel": "depends",
            "necessary_for_charity_payment": False,
            "notes": "Destroys source value; does not fund charity (fails F1).",
        },
        "snapshot_airdrop_no_donation": {
            "serves_F1": False,
            "serves_F2": "partial_ownership_proof",
            "serves_F3": True,
            "serves_F4_claim": True,
            "transferable_economic_unit": "typical",
            "secondary_market_attack_surface": "high",
            "governance_via_allocation": "typical",
            "speculative_demand_channel": True,
            "necessary_for_charity_payment": False,
            "notes": "No charity payment; different public benefit theory.",
        },
        "charity_directed_fees": {
            "serves_F1": "ongoing_not_genesis",
            "serves_F2": False,
            "serves_F3": False,
            "serves_F4_claim": False,
            "transferable_economic_unit": "ledger_native",
            "secondary_market_attack_surface": "native_token",
            "governance_via_allocation": "n/a",
            "speculative_demand_channel": True,
            "necessary_for_charity_payment": False,
            "notes": "Different mechanism: continuous fees, not donation-bound genesis.",
        },
    }

    # Necessity verdict structural
    transfer_necessary_for = []
    for name, r in regimes.items():
        if r["transferable_economic_unit"] is True:
            # check if any F1-F4 uniquely needs it
            pass
    return {
        "product_functions_held_constant": ["F1", "F2", "F3", "F4"],
        "regimes": regimes,
        "structural_necessity_of_transferability_for_F1_to_F4": False,
        "reasoning": (
            "Non-transferable receipt and delayed-transfer achieve F1–F4 without "
            "immediate alienable units. Transferability is a product choice that "
            "enables secondary markets, not a requirement of charity-bound migration receipts."
        ),
        "dominance_caution": (
            "Do not call no-token dominant unless F2–F4 are dropped from required functions. "
            "Do not call transferable dominant unless additional functions (liquidity, "
            "collateral, tradable gov) are explicitly required and held constant."
        ),
        "evidence_class": "mechanism_structure_comparison",
    }


def undersubscription_share(pool: int, small_T: int, large_T: int) -> dict:
    """Allocation per sat rises as T falls (undersubscription)."""
    # one sat weight
    from .allocation import allocate_proportional

    a_small = allocate_proportional(pool, [1, small_T - 1])["allocations"][0] if small_T > 1 else allocate_proportional(pool, [small_T])["allocations"][0]
    a_large = allocate_proportional(pool, [1, large_T - 1])["allocations"][0]
    return {
        "pool": pool,
        "alloc_per_first_sat_at_T_small": a_small,
        "alloc_per_first_sat_at_T_large": a_large,
        "T_small": small_T,
        "T_large": large_T,
        "ratio_exact": str(Fraction(a_small, a_large) if a_large else "inf"),
        "note": "Extreme undersubscription makes each sat extremely valuable in allocation units — speculative coordination pathway.",
    }
