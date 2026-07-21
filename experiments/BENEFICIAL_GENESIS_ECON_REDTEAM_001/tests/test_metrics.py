import sys
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from model import metrics


class TestMetrics(unittest.TestCase):
    def test_gini_zero_under_perfect_equality(self):
        allocation = {"a": 100, "b": 100, "c": 100, "d": 100}
        self.assertEqual(metrics.gini(allocation), Fraction(0))

    def test_gini_positive_under_inequality(self):
        allocation = {"a": 1, "b": 1, "c": 1, "d": 997}
        self.assertGreater(metrics.gini(allocation), Fraction(0))

    def test_gini_accepts_fraction_shares(self):
        # Governance weights are Fraction shares, not int units; gini must
        # work identically over either representation (E-003/E-005).
        int_alloc = {"a": 1, "b": 1, "c": 1, "d": 997}
        fraction_alloc = {k: Fraction(v, 1000) for k, v in int_alloc.items()}
        self.assertEqual(metrics.gini(int_alloc), metrics.gini(fraction_alloc))

    def test_hhi_bounds(self):
        equal = {"a": 250, "b": 250, "c": 250, "d": 250}
        concentrated = {"a": 1000, "b": 0, "c": 0, "d": 0}
        self.assertEqual(metrics.hhi(equal), Fraction(1, 4))
        self.assertEqual(metrics.hhi(concentrated), Fraction(1))

    def test_top_n_share_of_issued(self):
        allocation = {"a": 500, "b": 300, "c": 200}
        self.assertEqual(metrics.top_n_share_of_issued(allocation, 1), Fraction(1, 2))
        self.assertEqual(metrics.top_n_share_of_issued(allocation, 2), Fraction(4, 5))

    def test_top_n_share_of_pool_diverges_from_of_issued_when_undersubscribed(self):
        # E-005 repair target: of_pool and of_issued must be able to diverge
        # and must never be silently conflated in a single "share" field.
        allocation = {"a": 500, "b": 300, "c": 200}
        pool = 10_000
        self.assertEqual(metrics.top_n_share_of_issued(allocation, 1), Fraction(1, 2))
        self.assertEqual(metrics.top_n_share_of_pool(allocation, pool, 1), Fraction(500, 10_000))

    def test_unissued_remainder(self):
        allocation = {"a": 333, "b": 333, "c": 333}
        self.assertEqual(metrics.unissued_remainder(allocation, 1000), 1)

    def test_empty_allocation_is_defined(self):
        self.assertEqual(metrics.gini({}), Fraction(0))
        self.assertEqual(metrics.hhi({}), Fraction(0))
        self.assertEqual(metrics.top_n_share_of_issued({}, 1), Fraction(0))
        self.assertEqual(metrics.top_n_share_of_pool({}, 1000, 1), Fraction(0))


if __name__ == "__main__":
    unittest.main()
