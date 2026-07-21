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


class ParticipantValidationError(ValueError):
    """Raised by ``validate_participants`` on any fail-closed rejection."""


def validate_participants(
    donors: Sequence[Donor],
    pool: int,
    *,
    cap_bps: int | None = None,
    winners: int | None = None,
) -> None:
    """Shared fail-closed input validator (E-005 micro-repair).

    Every public allocation function in this module calls this directly,
    rather than relying solely on the scenario runner's own checks, so the
    functions are safe to call independently (e.g. from tests or from a
    future caller that is not ``model/scenario.py``). Rejects:

    - a negative or non-``int`` ``pool`` (zero is allowed: schemes call each
      other with a sub-pool that can legitimately be zero, e.g. when
      ``random_lottery_component`` routes 100% of the pool to the lottery
      share, the pro-rata remainder sub-call receives ``pool=0``);
    - an out-of-range or non-``int`` ``cap_bps`` (when provided);
    - a non-positive or non-``int`` ``winners`` (when provided);
    - duplicate participant IDs;
    - empty or non-string participant IDs;
    - boolean, non-``int``, or negative contribution weights.

    ``bool`` is a subclass of ``int`` in Python, so every integer check here
    explicitly excludes ``bool`` with ``type(x) is not int`` rather than
    ``isinstance(x, int)``, which would silently accept ``True``/``False``.
    """
    if type(pool) is not int or pool < 0:
        raise ParticipantValidationError(f"pool must be a non-negative int, got {pool!r}")
    if cap_bps is not None and (type(cap_bps) is not int or not (0 < cap_bps <= 10_000)):
        raise ParticipantValidationError(f"cap_bps must be an int in (0, 10000], got {cap_bps!r}")
    if winners is not None and (type(winners) is not int or winners < 1):
        raise ParticipantValidationError(f"winners must be a positive int, got {winners!r}")
    if not isinstance(donors, (list, tuple)):
        raise ParticipantValidationError("donors must be a list/tuple of (id, weight) pairs")

    seen: set[str] = set()
    for entry in donors:
        if not (isinstance(entry, tuple) and len(entry) == 2):
            raise ParticipantValidationError(f"each donor entry must be an (id, weight) pair, got {entry!r}")
        donor_id, weight = entry
        if not isinstance(donor_id, str) or donor_id == "":
            raise ParticipantValidationError(f"participant id must be a non-empty string, got {donor_id!r}")
        if donor_id in seen:
            raise ParticipantValidationError(f"duplicate participant id: {donor_id!r}")
        seen.add(donor_id)
        if type(weight) is not int:
            raise ParticipantValidationError(
                f"contribution weight for {donor_id!r} must be an int, got {weight!r}"
            )
        if weight < 0:
            raise ParticipantValidationError(
                f"contribution weight for {donor_id!r} must be non-negative, got {weight}"
            )


def _safe_ratio_floor(pool: int, numerator: int, denominator: int) -> int:
    if denominator <= 0:
        return 0
    return (pool * numerator) // denominator


def exact_pro_rata(donors: Sequence[Donor], pool: int, **_params) -> dict[str, int]:
    validate_participants(donors, pool)
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
    validate_participants(donors, pool, cap_bps=cap_bps)
    raw = exact_pro_rata(donors, pool)
    cap_units = _safe_ratio_floor(pool, cap_bps, 10_000)
    return {donor_id: min(units, cap_units) for donor_id, units in raw.items()}


def concave_sqrt(donors: Sequence[Donor], pool: int, **_params) -> dict[str, int]:
    validate_participants(donors, pool)
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
    validate_participants(donors, pool)
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
    validate_participants(donors, pool)
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

    Repair note (E-005 / BGEN-ECON-REV-005): the original implementation
    drew winners with ``random.choices`` (sampling *with* replacement),
    so a single donor could occupy more than one of the ``winners`` slots
    despite the "winners" terminology implying distinct recipients. This
    version draws winners **without replacement**: each weighted draw
    removes the chosen donor from the remaining pool before the next
    draw, so at most one prize per donor and the slot count matches the
    number of distinct winners.
    """
    validate_participants(donors, pool, winners=winners)
    lottery_pool = _safe_ratio_floor(pool, lottery_share_bps, 10_000)
    pro_rata_pool = pool - lottery_pool
    allocation = exact_pro_rata(donors, pro_rata_pool)

    remaining_ids = [donor_id for donor_id, w in donors if w > 0]
    remaining_weights = [w for _, w in donors if w > 0]
    chosen: list[str] = []
    if remaining_ids and lottery_pool > 0:
        slots = min(winners, len(remaining_ids))
        for _ in range(slots):
            total_w = sum(remaining_weights)
            if total_w <= 0:
                break
            draw = rng.randrange(total_w)
            acc = 0
            pick = 0
            for idx, w in enumerate(remaining_weights):
                acc += w
                if draw < acc:
                    pick = idx
                    break
            chosen.append(remaining_ids.pop(pick))
            remaining_weights.pop(pick)
        prize = lottery_pool // max(len(chosen), 1) if chosen else 0
        for donor_id in chosen:
            allocation[donor_id] = allocation.get(donor_id, 0) + prize
    return allocation


SCHEMES: dict[str, Callable[..., dict[str, int]]] = {
    "EXACT_PRO_RATA": exact_pro_rata,
    "CAPPED_PRO_RATA": capped_pro_rata,
    "CONCAVE_SQRT": concave_sqrt,
    "CONCAVE_LOG": concave_log,
    "TIME_WEIGHTED": time_weighted,
}
