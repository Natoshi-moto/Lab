"""Allocation schemes for a fixed-pool donation-weighted allocation.

Every scheme takes an ordered list of ``(donor_id, weight_input)`` pairs and
an integer ``pool`` and returns an ``{donor_id: allocated_units}`` mapping.
Allocation is always integer, floor-based and never exceeds ``pool``; any
shortfall is reported by the caller as ``unissued_remainder``. This mirrors
the ``floor(pool * eligible_i / total_eligible)`` rule already used by the
Beneficial Genesis design pack (``experiments/BENEFICIAL_GENESIS_DESIGN_001``)
so that this red-team model stays consistent with the subject's own stated
allocation rule rather than inventing a new one.

Schemes are pure functions of their inputs. Non-determinism (e.g. the
lottery component) is threaded through an explicit ``random.Random``
instance so every run is reproducible from a published seed.
"""

from __future__ import annotations

import math
from typing import Callable, Mapping, Sequence

Donor = tuple[str, int]


def _safe_ratio_floor(pool: int, numerator: int, denominator: int) -> int:
    if denominator <= 0:
        return 0
    return (pool * numerator) // denominator


def exact_pro_rata(donors: Sequence[Donor], pool: int, **_params) -> dict[str, int]:
    total = sum(w for _, w in donors)
    return {donor_id: _safe_ratio_floor(pool, w, total) for donor_id, w in donors}


def capped_pro_rata(
    donors: Sequence[Donor], pool: int, cap_bps: int = 1000, **_params
) -> dict[str, int]:
    """Pro-rata allocation with a per-identity cap expressed in basis points of pool.

    Capped-off amounts are left unissued (not redistributed), matching the
    subject's own "remainder is unissued" convention rather than adding a
    second redistribution round that would need its own game-theoretic
    analysis.
    """
    raw = exact_pro_rata(donors, pool)
    cap_units = _safe_ratio_floor(pool, cap_bps, 10_000)
    return {donor_id: min(units, cap_units) for donor_id, units in raw.items()}


def concave_sqrt(donors: Sequence[Donor], pool: int, **_params) -> dict[str, int]:
    weights = {donor_id: math.isqrt(max(w, 0)) for donor_id, w in donors}
    total_weight = sum(weights.values())
    return {
        donor_id: _safe_ratio_floor(pool, weight, total_weight)
        for donor_id, weight in weights.items()
    }


def concave_log(donors: Sequence[Donor], pool: int, scale: int = 1_000_000, **_params) -> dict[str, int]:
    """log-weighted allocation. Uses ``math.log``, so weights are IEEE-754
    floats rounded to integer micro-weight units before the integer
    pro-rata step; this keeps the *allocation* integer and deterministic on
    a given platform/toolchain, but is not claimed to be bit-identical
    across all Python builds (see NONCLAIMS_AND_OPEN_QUESTIONS.md).
    """
    weights = {donor_id: int(math.log1p(max(w, 0)) * scale) for donor_id, w in donors}
    total_weight = sum(weights.values())
    return {
        donor_id: _safe_ratio_floor(pool, weight, total_weight)
        for donor_id, weight in weights.items()
    }


def time_weighted(
    donors: Sequence[Donor],
    pool: int,
    donor_blocks: Mapping[str, int] | None = None,
    epoch_open_block: int = 0,
    epoch_close_block: int = 1,
    early_bonus_bps: int = 5_000,
    **_params,
) -> dict[str, int]:
    """Rewards earlier donations with a linear bonus up to ``early_bonus_bps``
    (basis points of the donor's own weight) at the open block, decaying to
    zero at the close block.
    """
    donor_blocks = donor_blocks or {}
    span = max(epoch_close_block - epoch_open_block, 1)
    weighted: list[Donor] = []
    for donor_id, w in donors:
        block = donor_blocks.get(donor_id, epoch_close_block)
        block = min(max(block, epoch_open_block), epoch_close_block)
        progress_bps = ((block - epoch_open_block) * 10_000) // span
        bonus_bps = (early_bonus_bps * (10_000 - progress_bps)) // 10_000
        weighted.append((donor_id, w + (w * bonus_bps) // 10_000))
    return exact_pro_rata(weighted, pool)


def random_lottery_component(
    donors: Sequence[Donor],
    pool: int,
    rng,
    lottery_share_bps: int = 1_000,
    winners: int = 10,
    **_params,
) -> dict[str, int]:
    """Splits the pool into a pro-rata sub-pool and a weighted-lottery
    sub-pool. ``rng`` must be a ``random.Random`` instance seeded by the
    caller so results are reproducible.
    """
    lottery_pool = _safe_ratio_floor(pool, lottery_share_bps, 10_000)
    pro_rata_pool = pool - lottery_pool
    allocation = exact_pro_rata(donors, pro_rata_pool)

    ids = [donor_id for donor_id, w in donors if w > 0]
    weights = [w for _, w in donors if w > 0]
    if ids and lottery_pool > 0:
        prize = lottery_pool // max(winners, 1)
        chosen = rng.choices(ids, weights=weights, k=min(winners, len(ids)))
        for donor_id in chosen:
            allocation[donor_id] = allocation.get(donor_id, 0) + prize
    return allocation


def governance_weight(
    economic_allocation: Mapping[str, int], cap_bps: int | None, pool: int
) -> dict[str, int]:
    """Derives governance weight from economic allocation, optionally capped
    per-identity at ``cap_bps`` of pool and renormalized so weights still
    sum to (at most) ``pool`` units of governance power. ``cap_bps=None``
    means governance is exactly proportional to economic allocation.
    """
    if cap_bps is None:
        return dict(economic_allocation)
    cap_units = _safe_ratio_floor(pool, cap_bps, 10_000)
    return {donor_id: min(units, cap_units) for donor_id, units in economic_allocation.items()}


SCHEMES: dict[str, Callable[..., dict[str, int]]] = {
    "EXACT_PRO_RATA": exact_pro_rata,
    "CAPPED_PRO_RATA": capped_pro_rata,
    "CONCAVE_SQRT": concave_sqrt,
    "CONCAVE_LOG": concave_log,
    "TIME_WEIGHTED": time_weighted,
}
