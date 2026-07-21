"""Unit tests for independent allocation model."""

from __future__ import annotations

import sys
import unittest
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from model.allocation import (
    allocate_capped_pro_rata,
    allocate_concave_sqrt,
    allocate_proportional,
    floor_residual_split_demo,
    supply_ok,
    sybil_gain_concave,
)


class TestProportional(unittest.TestCase):
    def test_supply(self):
        rec = allocate_proportional(1_000_000, [1, 2, 3, 4])
        self.assertTrue(supply_ok(rec))
        self.assertEqual(rec["allocations"], [100000, 200000, 300000, 400000])

    def test_remainder(self):
        rec = allocate_proportional(100, [1, 1, 1])
        self.assertEqual(sum(rec["allocations"]), 99)
        self.assertEqual(rec["remainder_unissued"], 1)

    def test_split_no_gain(self):
        d = floor_residual_split_demo(1_000_000_000, 10_000_003, 9)
        self.assertTrue(d["split_never_increases_issued_to_splitter"])

    def test_sybil_sqrt(self):
        g = sybil_gain_concave(
            1_000_000_000, 1_000_000, 50, "sqrt", competitor=1_000_000
        )
        self.assertTrue(g["sybil_strictly_profitable"])
        # Alone in pool: no share to steal
        alone = sybil_gain_concave(
            1_000_000_000, 1_000_000, 50, "sqrt", competitor=0
        )
        # competitor=0 invalid for total weight if only zeros — use tiny competitor
        alone = sybil_gain_concave(
            1_000_000_000, 10_000_000, 10, "sqrt", competitor=1
        )
        self.assertTrue(alone["sybil_strictly_profitable"] or alone["sybil_gain"] >= 0)

    def test_cap_sybil(self):
        one = allocate_capped_pro_rata(
            1_000_000, [800_000, 200_000], cap_share=Fraction(1, 10), identity=["w", "r"]
        )
        parts = [40_000] * 20 + [200_000]
        ids = [f"w{i}" for i in range(20)] + ["r"]
        many = allocate_capped_pro_rata(
            1_000_000, parts, cap_share=Fraction(1, 10), identity=ids
        )
        self.assertGreater(
            sum(many["identity_allocations"][f"w{i}"] for i in range(20)),
            one["identity_allocations"]["w"],
        )


if __name__ == "__main__":
    unittest.main()
