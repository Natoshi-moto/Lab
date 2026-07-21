import sys
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from model import collusion


class TestConditionalAndExpectedRebate(unittest.TestCase):
    def test_conditional_arithmetic_is_exactly_one_for_one(self):
        # E-008 preserved finding: conditional on an arrangement existing at
        # zero extra cost, the reduction in charity retention equals exactly
        # the rebate amount. This must survive the repair unchanged.
        result = collusion.conditional_and_expected_rebate(
            donated_sats=1_000_000,
            rebate_rate=Fraction(3, 10),
            colluding_arrangement_exists=True,
        )
        self.assertEqual(Fraction(result["conditional"]["rebate_sats"]), Fraction(300_000))
        self.assertEqual(Fraction(result["conditional"]["charity_retained"]), Fraction(700_000))

    def test_low_access_probability_collapses_expected_rebate(self):
        # E-002 repair target: the *expected* (friction-adjusted) rebate for
        # a donor who does not already have a colluding arrangement must be
        # materially smaller than the conditional figure once access is rare
        # and costly.
        result = collusion.conditional_and_expected_rebate(
            donated_sats=1_000_000,
            rebate_rate=Fraction(1, 2),
            colluding_arrangement_exists=False,
            access_probability=Fraction(1, 20),
            arrangement_cost_sats=Fraction(20_000),
            enforcement_probability=Fraction(4, 5),
            detection_probability=Fraction(3, 10),
        )
        conditional_rebate = Fraction(result["conditional"]["rebate_sats"])
        expected_rebate = Fraction(result["expected_with_frictions"]["expected_rebate_sats"])
        self.assertLess(expected_rebate, conditional_rebate)
        self.assertLess(expected_rebate, conditional_rebate / 5)

    def test_never_claims_predictable_aggregate_destruction(self):
        # E-002: the module must never assert the over-generalized claim
        # regardless of parameters, since that claim requires assumptions
        # this function does not have (donor population access rates, etc).
        result = collusion.conditional_and_expected_rebate(
            donated_sats=1, rebate_rate=Fraction(1), colluding_arrangement_exists=True
        )
        self.assertFalse(result["claims"]["predictable_aggregate_destruction_of_charity_benefit"])

    def test_out_of_range_rejected(self):
        with self.assertRaises(ValueError):
            collusion.conditional_and_expected_rebate(
                donated_sats=1, rebate_rate=Fraction(2), colluding_arrangement_exists=True
            )


if __name__ == "__main__":
    unittest.main()
