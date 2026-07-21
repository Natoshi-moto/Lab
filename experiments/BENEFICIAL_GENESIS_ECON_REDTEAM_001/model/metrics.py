"""Concentration and welfare metrics over an allocation mapping.

Repair note (E-005 / BGEN-ECON-REV-005): the original version of this module
mixed denominators inconsistently — ``top_n_share`` divided by the fixed
``pool`` while ``hhi`` implicitly divided by the *issued* total, so a single
"concentration" report silently blended two different bases. This version
makes both bases explicit and never conflates them:

- ``*_of_issued`` metrics use the actually issued total as denominator.
- ``*_of_pool`` metrics use the fixed pool as denominator.

``gini`` and ``hhi`` are defined over the issued distribution only (a
"share of pool" version of either is not meaningful when most of the pool
is unissued — it would just measure how much of the pool went unissued,
which is already reported separately as ``unissued_remainder``).

All functions are pure and operate on plain dict/list inputs so they can be
unit-tested independently of the scenario runner. They accept either
``int`` (unit) allocations or ``Fraction`` (already-normalized share)
mappings, since governance weights in this package are represented as
Fraction shares rather than pool units.
"""

from __future__ import annotations

from fractions import Fraction
from typing import Mapping


Number = Fraction | int


def top_n_share_of_issued(allocation: Mapping[str, Number], n: int) -> Fraction:
    """Top-n holders' combined share of the *actually issued* total."""
    total = sum(allocation.values())
    if total == 0:
        return Fraction(0)
    ordered = sorted(allocation.values(), reverse=True)
    return Fraction(sum(ordered[:n])) / Fraction(total)


def top_n_share_of_pool(allocation: Mapping[str, int], pool: int, n: int) -> Fraction:
    """Top-n holders' combined share of the fixed pool (includes the effect
    of any unissued remainder — a scheme that issues little of the pool
    will show small shares here even if concentration among recipients,
    per ``top_n_share_of_issued``, is high).
    """
    if pool <= 0:
        return Fraction(0)
    ordered = sorted(allocation.values(), reverse=True)
    return Fraction(sum(ordered[:n]), pool)


def gini(allocation: Mapping[str, Number]) -> Fraction:
    """Population Gini coefficient over the issued distribution (0 = perfectly
    equal, approaches 1 under maximal concentration). Uses exact rational
    arithmetic so results are reproducible bit-for-bit. Defined only over
    actually-issued units/shares; unissued remainder has no holder and is
    out of scope for a concentration-among-holders metric by construction.
    """
    values = sorted(v for v in allocation.values())
    n = len(values)
    total = sum(values)
    if n == 0 or total == 0:
        return Fraction(0)
    weighted_sum = Fraction(0)
    for i, v in enumerate(values, start=1):
        weighted_sum += Fraction(i) * Fraction(v)
    return Fraction(2, n) * (weighted_sum / Fraction(total)) - Fraction(n + 1, n)


def hhi(allocation: Mapping[str, Number]) -> Fraction:
    """Herfindahl-Hirschman index on a 0..1 (not 0..10000) scale: sum of
    squared shares of the *issued* total. 1/N under perfect equality among
    N holders; 1 under single-holder concentration.
    """
    total = sum(allocation.values())
    if total == 0:
        return Fraction(0)
    total = Fraction(total)
    return sum((Fraction(v) / total) ** 2 for v in allocation.values())


def unissued_remainder(allocation: Mapping[str, int], pool: int) -> int:
    return pool - sum(allocation.values())


def as_float(value: Fraction) -> float:
    return float(value.numerator) / float(value.denominator)
