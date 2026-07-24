"""Independent mechanism models for BGEN-GROK-MECHANISM-AUDIT-001.

stdlib only. Does not import subject economics packages.
Exact integer / Fraction arithmetic.
"""

from .allocation import (
    allocate_proportional,
    allocate_concave_sqrt,
    allocate_concave_log,
    allocate_capped_pro_rata,
    floor_residual_split_demo,
    supply_ok,
)
from .metrics import gini, hhi, top_k_share, concentration_report
from .rebate import charity_net_after_rebate, rebate_incidence
from .governance import gov_proportional, gov_capped, gov_cap_then_renormalize
from .tainted import tainted_ev_grid
from .alternatives import compare_transfer_regimes

__all__ = [
    "allocate_proportional",
    "allocate_concave_sqrt",
    "allocate_concave_log",
    "allocate_capped_pro_rata",
    "floor_residual_split_demo",
    "supply_ok",
    "gini",
    "hhi",
    "top_k_share",
    "concentration_report",
    "charity_net_after_rebate",
    "rebate_incidence",
    "gov_proportional",
    "gov_capped",
    "gov_cap_then_renormalize",
    "tainted_ev_grid",
    "compare_transfer_regimes",
]
