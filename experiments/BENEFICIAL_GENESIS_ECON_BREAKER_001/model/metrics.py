"""Concentration and welfare metrics with explicit denominators.

share_of_pool: allocation / fixed_pool
share_of_issued: allocation / total_issued

These can diverge under capped or floor-remainder schemes. Tables must label
which denominator is used.
"""

from __future__ import annotations

from typing import Any, Sequence


def gini(values: Sequence[float | int]) -> float:
    """Gini coefficient on a non-negative vector. 0 = equality, 1 = max inequality."""
    xs = [float(v) for v in values]
    if not xs:
        return 0.0
    if any(v < 0 for v in xs):
        raise ValueError("gini requires non-negative values")
    s = sum(xs)
    if s == 0:
        return 0.0
    ys = sorted(xs)
    n = len(ys)
    # Standard formula: sum_i (2i - n - 1) * y_i / (n * sum)
    acc = 0.0
    for i, y in enumerate(ys, start=1):
        acc += (2 * i - n - 1) * y
    return acc / (n * s)


def hhi(shares: Sequence[float | int]) -> float:
    """Herfindahl-Hirschman index on shares that should sum ~1 (or raw weights).

    If values sum to ~0, returns 0. Accepts either weights or fractions.
    Returns sum of squared *normalized* shares in [0, 1].
    """
    xs = [float(v) for v in shares]
    if not xs:
        return 0.0
    if any(v < 0 for v in xs):
        raise ValueError("hhi requires non-negative values")
    s = sum(xs)
    if s == 0:
        return 0.0
    return sum((v / s) ** 2 for v in xs)


def top_n_share(values: Sequence[float | int], n: int, *, denominator: float | int | None = None) -> float:
    """Sum of top-n values divided by denominator (default: sum of values)."""
    xs = sorted((float(v) for v in values), reverse=True)
    if n < 0:
        raise ValueError("n must be non-negative")
    top = sum(xs[:n])
    if denominator is None:
        denom = sum(xs)
    else:
        denom = float(denominator)
    if denom == 0:
        return 0.0
    return top / denom


def concentration_report(
    allocations: Sequence[dict[str, Any]],
    *,
    pool: int,
    total_issued: int,
) -> dict[str, Any]:
    """Full concentration bundle with both pool and issued denominators."""
    units = [int(a["allocation"]) for a in allocations]
    eligible = [int(a.get("eligible_sats", 0)) for a in allocations]
    return {
        "n_recipients": len(units),
        "pool": pool,
        "total_issued": total_issued,
        "gini_of_issued_units": gini(units),
        "hhi_of_issued_units": hhi(units),
        "top1_share_of_pool": top_n_share(units, 1, denominator=pool),
        "top1_share_of_issued": top_n_share(units, 1, denominator=total_issued if total_issued else None),
        "top10_share_of_pool": top_n_share(units, 10, denominator=pool),
        "top10_share_of_issued": top_n_share(units, 10, denominator=total_issued if total_issued else None),
        "gini_of_eligible_sats": gini(eligible),
        "hhi_of_eligible_sats": hhi(eligible),
        "denominator_note": (
            "share_of_pool uses fixed pool; share_of_issued uses actually issued units. "
            "Under floor remainder or caps these diverge; do not mix them."
        ),
    }
