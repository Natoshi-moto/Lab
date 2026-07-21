"""Allocation alternatives for Beneficial Genesis economic modelling.

Normative design rule (from BENEFICIAL_GENESIS_DESIGN_001):

    allocation_i = floor(pool * eligible_sats_i / total_eligible_sats)
    remainder_unissued = pool - sum(allocation_i)   # never issued

This module implements that rule and comparison alternatives used by the
economic breaker. Integer arithmetic only. Fail-closed on duplicate IDs,
non-int types, and out-of-range values.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Sequence

MAX_SATS = 21_000_000 * 100_000_000  # Bitcoin max satoshis upper bound for inputs
DEFAULT_POOL = 1_000_000_000  # design DEFAULT_FIXED_BITCOIN_GENESIS_POOL

ALLOCATION_RULES = (
    "pro_rata",
    "capped_pro_rata",
    "concave_sqrt",
    "concave_log",
    "time_weighted",
    "lottery_without_replacement",
    "no_token",
)


class AllocationError(ValueError):
    def __init__(self, code: str, detail: str = "") -> None:
        self.code = code
        super().__init__(detail or code)


def _require_int(name: str, value: object, *, min_v: int = 0, max_v: int = MAX_SATS) -> int:
    if type(value) is not int:  # reject bool
        raise AllocationError("TYPE_ERROR", f"{name} must be exact int, got {type(value).__name__}")
    if value < min_v or value > max_v:
        raise AllocationError("RANGE_ERROR", f"{name} out of range: {value}")
    return value


def _normalize_contributions(
    contributions: Sequence[Mapping[str, Any]],
) -> list[dict[str, Any]]:
    if not isinstance(contributions, (list, tuple)) or not contributions:
        raise AllocationError("EMPTY_CONTRIBUTIONS", "need at least one contribution")
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for i, row in enumerate(contributions):
        if not isinstance(row, Mapping):
            raise AllocationError("TYPE_ERROR", f"contribution[{i}] not a mapping")
        donor_id = row.get("donor_id")
        if not isinstance(donor_id, str) or not donor_id:
            raise AllocationError("TYPE_ERROR", f"contribution[{i}].donor_id")
        if donor_id in seen:
            raise AllocationError("DUPLICATE_DONOR_ID", donor_id)
        seen.add(donor_id)
        sats = _require_int(f"contribution[{i}].eligible_sats", row.get("eligible_sats"), min_v=1)
        time_weight = row.get("time_weight", 1)
        if type(time_weight) is not int or time_weight < 1:
            raise AllocationError("TYPE_ERROR", f"contribution[{i}].time_weight")
        identity_id = row.get("identity_id", donor_id)
        if not isinstance(identity_id, str) or not identity_id:
            raise AllocationError("TYPE_ERROR", f"contribution[{i}].identity_id")
        out.append(
            {
                "donor_id": donor_id,
                "identity_id": identity_id,
                "eligible_sats": sats,
                "time_weight": time_weight,
                "label": row.get("label", donor_id),
            }
        )
    # Canonical order by donor_id for determinism.
    out.sort(key=lambda r: r["donor_id"])
    return out


def _floor_share(pool: int, weight: int, total_weight: int) -> int:
    if total_weight <= 0:
        raise AllocationError("ZERO_TOTAL", "total weight must be positive")
    return (pool * weight) // total_weight


def allocate(
    *,
    pool: int = DEFAULT_POOL,
    contributions: Sequence[Mapping[str, Any]],
    rule: str = "pro_rata",
    cap_sats_per_identity: int | None = None,
    lottery_seed: int = 0,
    lottery_winner_slots: int | None = None,
) -> dict[str, Any]:
    """Return a deterministic allocation record.

    Fields:
      - allocations: list of {donor_id, eligible_sats, weight, allocation,
        share_of_pool, share_of_issued}
      - total_eligible_sats, total_weight, total_issued, remainder_unissued
      - rule, pool
    """
    pool = _require_int("pool", pool, min_v=1)
    if rule not in ALLOCATION_RULES:
        raise AllocationError("UNKNOWN_RULE", rule)

    rows = _normalize_contributions(contributions)
    total_eligible = sum(r["eligible_sats"] for r in rows)

    if rule == "no_token":
        return {
            "rule": rule,
            "pool": pool,
            "total_eligible_sats": total_eligible,
            "total_weight": 0,
            "total_issued": 0,
            "remainder_unissued": pool,
            "allocations": [
                {
                    "donor_id": r["donor_id"],
                    "identity_id": r["identity_id"],
                    "eligible_sats": r["eligible_sats"],
                    "weight": 0,
                    "allocation": 0,
                    "share_of_pool": 0.0,
                    "share_of_issued": 0.0,
                    "label": r["label"],
                }
                for r in rows
            ],
            "notes": ["no_token: charity retains donations; no allocation units issued"],
        }

    # Build per-row weights.
    weights: list[int] = []
    notes: list[str] = []

    if rule == "pro_rata":
        weights = [r["eligible_sats"] for r in rows]

    elif rule == "capped_pro_rata":
        if cap_sats_per_identity is None:
            raise AllocationError("MISSING_CAP", "capped_pro_rata requires cap_sats_per_identity")
        cap = _require_int("cap_sats_per_identity", cap_sats_per_identity, min_v=1)
        # Aggregate by identity first for cap, then attribute back proportionally
        # within identity — here each row is treated as one claim unit; identity
        # cap applied to summed eligible by identity, then split across that
        # identity's rows by eligible share.
        by_id: dict[str, int] = {}
        for r in rows:
            by_id[r["identity_id"]] = by_id.get(r["identity_id"], 0) + r["eligible_sats"]
        capped_by_id = {i: min(s, cap) for i, s in by_id.items()}
        for r in rows:
            id_total = by_id[r["identity_id"]]
            id_capped = capped_by_id[r["identity_id"]]
            # integer share of identity's capped weight
            w = (id_capped * r["eligible_sats"]) // id_total if id_total else 0
            weights.append(w)
        notes.append(
            "capped_pro_rata is Sybil-vulnerable if identity_id is free to mint "
            "(permissionless address creation)"
        )

    elif rule == "concave_sqrt":
        # weight = floor(sqrt(sats)); concave so splitting can raise sum of weights
        weights = [int(math.isqrt(r["eligible_sats"])) for r in rows]
        notes.append(
            "concave_sqrt is split-exploitable without an identity layer: "
            "sqrt(a)+sqrt(b) > sqrt(a+b) for a,b>0"
        )

    elif rule == "concave_log":
        weights = [int(math.floor(math.log2(r["eligible_sats"] + 1))) for r in rows]
        notes.append(
            "concave_log is split-exploitable without an identity layer"
        )

    elif rule == "time_weighted":
        weights = [r["eligible_sats"] * r["time_weight"] for r in rows]
        notes.append(
            "time_weighted: higher time_weight models earlier commitment advantage; "
            "does not by itself prevent last-block sniping without sealed commitment"
        )

    elif rule == "lottery_without_replacement":
        # Weighted lottery over discrete winner slots; without replacement.
        # Each winner slot awards floor(pool / slots) units (remainder unissued).
        slots = lottery_winner_slots if lottery_winner_slots is not None else min(10, len(rows))
        slots = _require_int("lottery_winner_slots", slots, min_v=1, max_v=max(1, len(rows)))
        # Deterministic RNG from seed (stdlib only).
        import random

        rng = random.Random(lottery_seed)
        # Build ticket list by donor index proportional to sats (capped tickets for scale)
        # Use cumulative weights and sequential draws without replacement of donors.
        remaining = list(range(len(rows)))
        remaining_w = [r["eligible_sats"] for r in rows]
        winners: list[int] = []
        for _ in range(slots):
            total_w = sum(remaining_w[i] for i in remaining)
            if total_w <= 0 or not remaining:
                break
            draw = rng.randrange(total_w)
            acc = 0
            chosen_pos = 0
            for pos, idx in enumerate(remaining):
                acc += remaining_w[idx]
                if draw < acc:
                    chosen_pos = pos
                    break
            chosen_idx = remaining.pop(chosen_pos)
            winners.append(chosen_idx)
        per_slot = pool // slots if slots else 0
        weights = [0] * len(rows)
        # Represent lottery outcome as allocation directly below; weights mark winners.
        for widx in winners:
            weights[widx] = 1
        total_weight = sum(weights)
        allocations_units = [0] * len(rows)
        for widx in winners:
            allocations_units[widx] = per_slot
        total_issued = sum(allocations_units)
        remainder = pool - total_issued
        out_allocs = []
        for i, r in enumerate(rows):
            alloc = allocations_units[i]
            out_allocs.append(
                {
                    "donor_id": r["donor_id"],
                    "identity_id": r["identity_id"],
                    "eligible_sats": r["eligible_sats"],
                    "weight": weights[i],
                    "allocation": alloc,
                    "share_of_pool": (alloc / pool) if pool else 0.0,
                    "share_of_issued": (alloc / total_issued) if total_issued else 0.0,
                    "label": r["label"],
                }
            )
        return {
            "rule": rule,
            "pool": pool,
            "total_eligible_sats": total_eligible,
            "total_weight": total_weight,
            "total_issued": total_issued,
            "remainder_unissued": remainder,
            "allocations": out_allocs,
            "lottery_winners": [rows[i]["donor_id"] for i in winners],
            "lottery_seed": lottery_seed,
            "lottery_winner_slots": slots,
            "lottery_replacement": False,
            "notes": notes
            + [
                "lottery_without_replacement: each donor wins at most one slot; "
                "sampling is without replacement of donors"
            ],
        }

    else:
        raise AllocationError("UNKNOWN_RULE", rule)

    total_weight = sum(weights)
    if total_weight <= 0:
        # All weights zero (e.g. every sats=0 which we forbid, or log of 0)
        return {
            "rule": rule,
            "pool": pool,
            "total_eligible_sats": total_eligible,
            "total_weight": 0,
            "total_issued": 0,
            "remainder_unissued": pool,
            "allocations": [
                {
                    "donor_id": r["donor_id"],
                    "identity_id": r["identity_id"],
                    "eligible_sats": r["eligible_sats"],
                    "weight": 0,
                    "allocation": 0,
                    "share_of_pool": 0.0,
                    "share_of_issued": 0.0,
                    "label": r["label"],
                }
                for r in rows
            ],
            "notes": notes + ["zero total weight; nothing issued"],
        }

    allocations: list[dict[str, Any]] = []
    total_issued = 0
    for r, w in zip(rows, weights):
        alloc = _floor_share(pool, w, total_weight)
        total_issued += alloc
        allocations.append(
            {
                "donor_id": r["donor_id"],
                "identity_id": r["identity_id"],
                "eligible_sats": r["eligible_sats"],
                "weight": w,
                "allocation": alloc,
                "share_of_pool": (alloc / pool) if pool else 0.0,
                "share_of_issued": 0.0,  # filled below
                "label": r["label"],
            }
        )

    if total_issued > pool:
        raise AllocationError("ALLOCATION_EXCEEDS_POOL", f"{total_issued} > {pool}")

    for a in allocations:
        a["share_of_issued"] = (a["allocation"] / total_issued) if total_issued else 0.0

    return {
        "rule": rule,
        "pool": pool,
        "total_eligible_sats": total_eligible,
        "total_weight": total_weight,
        "total_issued": total_issued,
        "remainder_unissued": pool - total_issued,
        "allocations": allocations,
        "notes": notes,
    }


def prove_split_invariance_pro_rata(pool: int, parts: Sequence[int]) -> dict[str, Any]:
    """Show linear pro-rata is invariant to splitting one contribution into parts."""
    total = sum(parts)
    if total <= 0:
        raise AllocationError("ZERO_TOTAL", "parts")
    whole = allocate(
        pool=pool,
        contributions=[{"donor_id": "whole", "eligible_sats": total}],
        rule="pro_rata",
    )
    split = allocate(
        pool=pool,
        contributions=[
            {"donor_id": f"p{i}", "eligible_sats": p, "identity_id": "same"}
            for i, p in enumerate(parts)
            if p > 0
        ],
        rule="pro_rata",
    )
    return {
        "whole_allocation": whole["allocations"][0]["allocation"],
        "split_sum_allocation": sum(a["allocation"] for a in split["allocations"]),
        "split_invariant": whole["allocations"][0]["allocation"]
        == sum(a["allocation"] for a in split["allocations"])
        or abs(
            whole["allocations"][0]["allocation"]
            - sum(a["allocation"] for a in split["allocations"])
        )
        <= len(parts),  # floor residuals may differ by at most n-1
        "note": "exact equality of sum may differ by floor remainder distribution; "
        "share of contribution mass is preserved",
    }


def prove_concave_sybil_gain(pool: int, sats: int, n_splits: int) -> dict[str, Any]:
    """Demonstrate concave weight sum increases under address splitting."""
    if n_splits < 2 or sats < n_splits:
        raise AllocationError("RANGE_ERROR", "need sats >= n_splits >= 2")
    base = sats // n_splits
    rem = sats % n_splits
    parts = [base + (1 if i < rem else 0) for i in range(n_splits)]
    # Compare one whale vs split identities under concave_sqrt against a fixed peer.
    peer = sats  # peer matches total so relative gain is visible
    control = allocate(
        pool=pool,
        contributions=[
            {"donor_id": "whale", "eligible_sats": sats},
            {"donor_id": "peer", "eligible_sats": peer},
        ],
        rule="concave_sqrt",
    )
    sybil = allocate(
        pool=pool,
        contributions=[
            *[{"donor_id": f"s{i}", "eligible_sats": p, "identity_id": f"s{i}"} for i, p in enumerate(parts)],
            {"donor_id": "peer", "eligible_sats": peer},
        ],
        rule="concave_sqrt",
    )
    whale_ctrl = next(a for a in control["allocations"] if a["donor_id"] == "whale")["allocation"]
    whale_sybil = sum(
        a["allocation"] for a in sybil["allocations"] if a["donor_id"].startswith("s")
    )
    return {
        "control_whale_allocation": whale_ctrl,
        "sybil_sum_allocation": whale_sybil,
        "sybil_gain": whale_sybil - whale_ctrl,
        "sybil_strictly_better": whale_sybil > whale_ctrl,
        "n_splits": n_splits,
        "rule": "concave_sqrt",
    }
