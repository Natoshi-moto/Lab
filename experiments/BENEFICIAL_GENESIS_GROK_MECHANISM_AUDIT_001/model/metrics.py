"""Concentration and welfare-accounting metrics (model inputs, not prices)."""

from __future__ import annotations

from fractions import Fraction
from typing import Sequence


def gini(values: Sequence[int]) -> Fraction:
    """Gini coefficient on non-negative integers; 0 if all zero or empty.

    G = sum_i sum_j |x_i - x_j| / (2 n^2 mu)
    """
    xs = [int(v) for v in values]
    n = len(xs)
    if n == 0:
        return Fraction(0)
    total = sum(xs)
    if total == 0:
        return Fraction(0)
    s = 0
    for i in range(n):
        for j in range(n):
            s += abs(xs[i] - xs[j])
    # 2 * n^2 * mu = 2 * n * total
    return Fraction(s, 2 * n * total)


def hhi(values: Sequence[int]) -> Fraction:
    """Herfindahl-Hirschman on shares of sum; scale 0..1 as Fraction."""
    xs = [int(v) for v in values]
    total = sum(xs)
    if total == 0:
        return Fraction(0)
    return sum(Fraction(x, total) ** 2 for x in xs)


def top_k_share(values: Sequence[int], k: int) -> Fraction:
    xs = sorted((int(v) for v in values), reverse=True)
    total = sum(xs)
    if total == 0:
        return Fraction(0)
    return Fraction(sum(xs[:k]), total)


def concentration_report(allocations: Sequence[int]) -> dict:
    return {
        "n": len(allocations),
        "sum": sum(allocations),
        "top1_share": str(top_k_share(allocations, 1)),
        "top10_share": str(top_k_share(allocations, 10)),
        "gini": str(gini(allocations)),
        "hhi": str(hhi(allocations)),
    }
