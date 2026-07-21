"""Independent Beneficial Genesis economics breaker model (clean-room).

Status authority: NONE. Synthetic agents and scenarios only.
Does not inspect or depend on BENEFICIAL_GENESIS_ECON_REDTEAM_001 sources.
"""

from .allocation import (
    AllocationError,
    allocate,
    ALLOCATION_RULES,
)
from .metrics import (
    concentration_report,
    gini,
    hhi,
    top_n_share,
)
from .laundering import laundering_economics
from .rebate import conditional_rebate_outcome
from .governance import governance_weights, majority_threshold_control
from .scenario import run_scenario

__all__ = [
    "AllocationError",
    "allocate",
    "ALLOCATION_RULES",
    "concentration_report",
    "gini",
    "hhi",
    "top_n_share",
    "laundering_economics",
    "conditional_rebate_outcome",
    "governance_weights",
    "majority_threshold_control",
    "run_scenario",
]
