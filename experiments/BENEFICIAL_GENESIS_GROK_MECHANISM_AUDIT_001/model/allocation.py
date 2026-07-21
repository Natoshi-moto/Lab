"""Fixed-pool allocation rules with exact integer arithmetic.

Independent reconstruction. Does not import DESIGN_001 or econ packages.
"""

from __future__ import annotations

from fractions import Fraction
from math import isqrt
from typing import Sequence


def _validate_pool_weights(pool: int, weights: Sequence[int]) -> tuple[int, list[int]]:
    if type(pool) is not int or pool <= 0:
        raise ValueError("pool must be positive int")
    cleaned: list[int] = []
    for w in weights:
        if type(w) is not int or w < 0:
            raise ValueError("weights must be non-negative ints")
        cleaned.append(w)
    if not cleaned:
        raise ValueError("empty weights")
    if sum(cleaned) <= 0:
        raise ValueError("total weight must be positive")
    return pool, cleaned


def allocate_proportional(pool: int, eligible: Sequence[int]) -> dict:
    """allocation_i = floor(P * e_i / T); remainder unissued."""
    P, e = _validate_pool_weights(pool, eligible)
    T = sum(e)
    allocs = [(P * ei) // T for ei in e]
    issued = sum(allocs)
    rem = P - issued
    if issued > P or rem < 0:
        raise AssertionError("supply broken")
    return {
        "rule": "proportional_floor",
        "pool": P,
        "eligible": list(e),
        "total_eligible": T,
        "allocations": allocs,
        "total_issued": issued,
        "remainder_unissued": rem,
        "shares_exact": [str(Fraction(a, P)) if P else "0" for a in allocs],
        "weight_shares_exact": [str(Fraction(ei, T)) for ei in e],
    }


def supply_ok(record: dict) -> bool:
    return (
        record["total_issued"] + record["remainder_unissued"] == record["pool"]
        and record["total_issued"] <= record["pool"]
        and sum(record["allocations"]) == record["total_issued"]
    )


def allocate_concave_sqrt(pool: int, eligible: Sequence[int]) -> dict:
    """Weight w_i = isqrt(e_i); then floor pro-rata on w. Integer-only."""
    P, e = _validate_pool_weights(pool, eligible)
    w = [isqrt(ei) for ei in e]
    if sum(w) <= 0:
        # all e_i in {0,1} with isqrt 0 or 1 — handle zeros
        w = [1 if ei > 0 else 0 for ei in e]
    Tw = sum(w)
    allocs = [(P * wi) // Tw for wi in w]
    issued = sum(allocs)
    return {
        "rule": "concave_sqrt_floor",
        "pool": P,
        "eligible": list(e),
        "weights": w,
        "total_weight": Tw,
        "allocations": allocs,
        "total_issued": issued,
        "remainder_unissued": P - issued,
    }


def allocate_concave_log(pool: int, eligible: Sequence[int]) -> dict:
    """Weight w_i = floor(1e6 * ln(1+e_i)) via integer log approximation.

    Uses binary search for floor(ln(1+e)*1e6) via exp series-free method:
    w = floor(1_000_000 * log(1+e)) approximated by integer log2 scaling:
    w_i = bit_length based: floor(1e6 * ln2 * log2(1+e)) with ln2~0.693147
    -> multiplier 693147 for log2.
    For exact comparability we use: w_i = max(1, (1+e).bit_length()-1) * scale
    plus fine factor — simpler deterministic: w_i = floor(1e6 * log(1+e))
    with math.log would be float. Prefer pure int:

    w_i = isqrt(e_i) * 1_000 + (e_i.bit_length())  # monotone concave-ish hybrid

    Better pure approach for log-like: w = floor(M * ln(1+e)) using
    integer inverse of exp is heavy. Use:
        w_i = 0 if e_i==0 else max(1, (e_i+1).bit_length() - 1)
    which is floor(log2(1+e)) — concave in continuous sense on powers of two.

    Document as log2_floor weights (explicit).
    """
    P, e = _validate_pool_weights(pool, eligible)
    w = [0 if ei == 0 else max(1, (ei + 1).bit_length() - 1) for ei in e]
    Tw = sum(w)
    if Tw <= 0:
        raise ValueError("zero total log-weight")
    allocs = [(P * wi) // Tw for wi in w]
    issued = sum(allocs)
    return {
        "rule": "concave_log2_floor",
        "pool": P,
        "eligible": list(e),
        "weights": w,
        "total_weight": Tw,
        "allocations": allocs,
        "total_issued": issued,
        "remainder_unissued": P - issued,
        "note": "weights are floor(log2(1+e_i)); integer-only concave-style alternative",
    }


def allocate_capped_pro_rata(
    pool: int,
    eligible: Sequence[int],
    *,
    cap_share: Fraction | None = None,
    identity: Sequence[str] | None = None,
) -> dict:
    """Per-identity cap on allocation share, then optional renormalize of surplus.

    If identity is None, each row is its own identity (caps apply per row only).
    Algorithm (cap-then-renormalize):
      1. Aggregate eligible by identity.
      2. raw_i = floor(P * E_id / T)
      3. cap_amount = floor(P * cap_share)
      4. capped identities get min(raw, cap); surplus redistributed pro-rata
         among uncapped identities by their eligible weights (iterate).
    """
    if cap_share is None:
        cap_share = Fraction(1, 10)
    if not isinstance(cap_share, Fraction):
        cap_share = Fraction(cap_share)
    P, e = _validate_pool_weights(pool, eligible)
    n = len(e)
    if identity is None:
        identity = [f"id_{i}" for i in range(n)]
    if len(identity) != n:
        raise ValueError("identity length mismatch")

    # Aggregate by identity
    from collections import defaultdict

    agg: dict[str, int] = defaultdict(int)
    for ident, ei in zip(identity, e):
        agg[ident] += ei
    ids = sorted(agg.keys())
    E = [agg[i] for i in ids]
    T = sum(E)
    cap_amount = (P * cap_share.numerator) // cap_share.denominator

    # Iterative cap-then-renormalize on remaining pool among free ids
    remaining_pool = P
    remaining_weight = dict(zip(ids, E))
    final: dict[str, int] = {i: 0 for i in ids}
    free = set(ids)
    # Bound iterations
    for _ in range(len(ids) + 2):
        if not free or remaining_pool <= 0:
            break
        Tw = sum(remaining_weight[i] for i in free)
        if Tw <= 0:
            break
        overflow = False
        tentative: dict[str, int] = {}
        for i in free:
            tentative[i] = (remaining_pool * remaining_weight[i]) // Tw
        newly_capped = []
        for i in free:
            # total so far + tentative vs cap
            if final[i] + tentative[i] > cap_amount:
                # take only up to cap
                take = max(0, cap_amount - final[i])
                final[i] += take
                remaining_pool -= take
                newly_capped.append(i)
                overflow = True
        if overflow:
            for i in newly_capped:
                free.discard(i)
            continue
        # no overflow: assign tentative and done
        for i in free:
            final[i] += tentative[i]
            remaining_pool -= tentative[i]
        free.clear()
        break

    issued = sum(final.values())
    # Map back to rows proportionally within identity (floor)
    row_allocs = [0] * n
    for ident in ids:
        idxs = [k for k, idn in enumerate(identity) if idn == ident]
        sub_e = [e[k] for k in idxs]
        sub_T = sum(sub_e)
        budget = final[ident]
        if sub_T == 0:
            continue
        for k, ei in zip(idxs, sub_e):
            row_allocs[k] = (budget * ei) // sub_T
        # remainder within identity stays unissued at row level but identity sum may leave dust
        dust = budget - sum(row_allocs[k] for k in idxs)
        if dust and idxs:
            # give dust to first row for conservation at identity level
            row_allocs[idxs[0]] += dust

    issued_rows = sum(row_allocs)
    return {
        "rule": "capped_pro_rata_cap_then_renormalize",
        "pool": P,
        "eligible": list(e),
        "identity": list(identity),
        "cap_share": str(cap_share),
        "cap_amount": cap_amount,
        "identity_allocations": {i: final[i] for i in ids},
        "allocations": row_allocs,
        "total_issued": issued_rows,
        "remainder_unissued": P - issued_rows,
        "identity_eligible": {i: agg[i] for i in ids},
    }


def floor_residual_split_demo(pool: int, eligible_atom: int, parts: int) -> dict:
    """Show linear pro-rata split invariance up to floor residuals.

    One claim of e vs parts claims of floor(e/parts) (+ remainder on last).
    Same total T if only this actor changes claim structure among themselves
    with fixed others empty: T = e in both cases.
    """
    if parts < 2:
        raise ValueError("parts >= 2")
    base = eligible_atom // parts
    rem = eligible_atom - base * parts
    split = [base] * parts
    split[-1] += rem
    single = allocate_proportional(pool, [eligible_atom])
    multi = allocate_proportional(pool, split)
    return {
        "eligible_atom": eligible_atom,
        "parts": parts,
        "split_eligible": split,
        "single_alloc": single["allocations"][0],
        "multi_alloc_sum": sum(multi["allocations"]),
        "multi_allocs": multi["allocations"],
        "single_remainder": single["remainder_unissued"],
        "multi_remainder": multi["remainder_unissued"],
        "split_never_increases_issued_to_splitter": sum(multi["allocations"])
        <= single["allocations"][0],
        "note": "Under pure pro-rata with fixed T=e, split cannot increase total floor allocation to the splitter; may decrease due to extra floors.",
    }


def sybil_gain_concave(
    pool: int,
    e: int,
    parts: int,
    rule: str = "sqrt",
    *,
    competitor: int = 10_000_000,
) -> dict:
    """Compare concave allocation for one actor vs Sybil split against a fixed competitor.

    Alone in the pool, Sybil cannot increase issued units (already ~100% of pool).
    Against a competitor, strict concavity of sqrt raises total weight of the splitter.
    """
    if rule == "sqrt":
        fn = allocate_concave_sqrt
    elif rule == "log2":
        fn = allocate_concave_log
    else:
        raise ValueError(rule)
    base = e // parts
    rem = e - base * parts
    split = [base] * parts
    split[-1] += rem
    one = fn(pool, [e, competitor])
    many = fn(pool, split + [competitor])
    one_actor = one["allocations"][0]
    many_actor = sum(many["allocations"][:-1])
    return {
        "rule": rule,
        "e": e,
        "parts": parts,
        "competitor": competitor,
        "split": split,
        "one_issued_to_actor": one_actor,
        "many_issued_to_actor": many_actor,
        "competitor_alloc_when_one": one["allocations"][1],
        "competitor_alloc_when_sybil": many["allocations"][-1],
        "sybil_gain": many_actor - one_actor,
        "sybil_strictly_profitable": many_actor > one_actor,
        "note": "Sybil gain measured against fixed competitor; alone-in-pool is uninformative for concave share theft.",
    }
