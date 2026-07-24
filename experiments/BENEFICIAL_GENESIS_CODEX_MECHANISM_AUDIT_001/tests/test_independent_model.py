import importlib.util
import pathlib
import unittest
from fractions import Fraction as F

ROOT = pathlib.Path(__file__).parents[1]
SPEC = importlib.util.spec_from_file_location("independent_model", ROOT / "independent_model.py")
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)


class IndependentMechanismTests(unittest.TestCase):
    def test_conservation_boundaries(self):
        for pool in range(20):
            for weights in ([0], [1], [1, 1], [1, 2, 3], [0, 7, 99]):
                out, residual = M.alloc(list(weights), pool)
                self.assertEqual(sum(out) + residual, pool)
                self.assertGreaterEqual(residual, 0)

    def test_floor_split_penalty(self):
        unsplit, _ = M.alloc([7, 13], 101)
        split, _ = M.alloc([3, 4, 13], 101)
        self.assertLessEqual(sum(split[:2]), unsplit[0])

    def test_sqrt_sybil_gain(self):
        one, _ = M.sqrt_alloc([10_000, 10_000])
        split, _ = M.sqrt_alloc([100] * 100 + [10_000])
        self.assertGreater(F(sum(split[:100]), sum(split)), F(one[0], sum(one)))

    def test_cap_then_renormalize_not_hard_cap(self):
        self.assertEqual(M.cap_then_renormalize([100], F(1, 10)), [F(1)])

    def test_zero_denominator(self):
        self.assertEqual(M.alloc([0, 0], 7), ([0, 0], 7))

    def test_sign_reversals_present(self):
        r = M.run()
        self.assertEqual({x["sign"] for x in r["rebate_profit_sign_grid"]}, {-1, 1})
        self.assertTrue({-1, 1}.issubset({x["sign"] for x in r["welfare_sign_grid"]}))


if __name__ == "__main__":
    unittest.main()
