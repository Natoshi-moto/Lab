"""Concentration and welfare metrics over an allocation mapping.

All functions are pure and operate on plain dict/list inputs so they can be
unit-tested independently of the scenario runner.
"""

from __future__ import annotations

from fractions import Fraction
from typing import Mapping, Sequence


def shares(allocation: Mapping[str, int], pool: int) -> dict[str, Fraction]:
    if pool <= 0:
        return {donor_id: Fraction(0) for donor_id in allocation}
    return {donor_id: Fraction(units, pool) for donor_id, units in allocation.items()}


def top_n_share(allocation: Mapping[str, int], pool: int, n: int) -> Fraction:
    if pool <= 0:
        return Fraction(0)
    ordered = sorted(allocation.values(), reverse=True)
    return Fraction(sum(ordered[:n]), pool)


def gini(allocation: Mapping[str, int]) -> Fraction:
    """Population Gini coefficient over allocated units (0 = perfectly equal,
    approaches 1 under maximal concentration). Uses exact rational
    arithmetic so results are reproducible bit-for-bit.
    """
    values = sorted(v for v in allocation.values())
    n = len(values)
    total = sum(values)
    if n == 0 or total == 0:
        return Fraction(0)
    cumulative = 0
    weighted_sum = Fraction(0)
    for i, v in enumerate(values, start=1):
        cumulative += v
        weighted_sum += Fraction(i * v)
    return Fraction(2, n) * Fraction(weighted_sum, total) - Fraction(n + 1, n)


def hhi(allocation: Mapping[str, int], pool: int) -> Fraction:
    """Herfindahl-Hirschman index on a 0..1 (not 0..10000) scale: sum of
    squared shares. 1/N under perfect equality among N holders; 1 under
    single-holder concentration.
    """
    total = sum(allocation.values())
    if total <= 0:
        return Fraction(0)
    return sum(Fraction(v, total) ** 2 for v in allocation.values())


def unissued_remainder(allocation: Mapping[str, int], pool: int) -> int:
    return pool - sum(allocation.values())


def as_float(value: Fraction) -> float:
    return float(value.numerator) / float(value.denominator)
