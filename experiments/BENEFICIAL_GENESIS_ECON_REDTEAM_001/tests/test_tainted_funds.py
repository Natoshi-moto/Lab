import sys
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from model import tainted_funds as tf


class TestTaintedFundDecomposition(unittest.TestCase):
    def test_decomposition_is_not_unconditionally_profitable(self):
        # E-001 repair target: profitability must depend on the assumption
        # grid, not be a fixed "always profitable at zero cost" fact. With a
        # low token-value multiplier and full alternative-realization value
        # (attacker could have realized 100% of face value elsewhere), net
        # migration profit must be able to go negative.
        result = tf.decompose_tainted_fund_economics(
            donated_sats=10_000_000,
            allocation_units=1_591_163,
            token_value_per_unit=Fraction(1, 2),
            alternative_realization_fraction=Fraction(1),
            seizure_probability_alternative_path=Fraction(0),
        )
        self.assertFalse(result["interpretation"]["profitable_under_these_assumptions"])
        self.assertLess(Fraction(result["net_migration_profit"]), Fraction(0))

    def test_decomposition_can_be_profitable_under_other_assumptions(self):
        result = tf.decompose_tainted_fund_economics(
            donated_sats=10_000_000,
            allocation_units=15_911_637,
            token_value_per_unit=Fraction(62847081, 100000000),
        )
        self.assertTrue(result["interpretation"]["profitable_under_these_assumptions"])

    def test_pathway_exists_is_always_true_but_zero_cost_claim_is_always_false(self):
        # The pathway-exists finding (crypto control != legal ownership) is
        # preserved (E-008); the old "zero-cost fully profitable" framing is
        # never asserted by this module regardless of parameters.
        for mult in (Fraction(0), Fraction(1), Fraction(10)):
            result = tf.decompose_tainted_fund_economics(
                donated_sats=1_000_000, allocation_units=100_000, token_value_per_unit=mult
            )
            self.assertTrue(result["interpretation"]["pathway_exists"])
            self.assertFalse(result["interpretation"]["zero_cost_unconditionally_profitable_laundering_proven"])

    def test_lockup_reduces_realizable_value(self):
        no_lockup = tf.decompose_tainted_fund_economics(
            donated_sats=10_000_000, allocation_units=10_000_000, token_value_per_unit=Fraction(1), lockup_months=0
        )
        with_lockup = tf.decompose_tainted_fund_economics(
            donated_sats=10_000_000, allocation_units=10_000_000, token_value_per_unit=Fraction(1), lockup_months=12
        )
        self.assertGreater(
            Fraction(no_lockup["realizable_token_value"]), Fraction(with_lockup["realizable_token_value"])
        )

    def test_out_of_range_fraction_params_rejected(self):
        with self.assertRaises(ValueError):
            tf.decompose_tainted_fund_economics(
                donated_sats=1, allocation_units=1, token_value_per_unit=Fraction(1),
                alternative_realization_fraction=Fraction(2),
            )

    def test_sensitivity_grid_shows_mixed_outcomes(self):
        rows = tf.tainted_fund_sensitivity_grid(
            donated_sats=10_000_000,
            allocation_units=15_911_637,
            token_value_multipliers=[Fraction(1, 2), Fraction(1), Fraction(3, 2)],
            alternative_realization_fractions=[Fraction(0), Fraction(3, 10), Fraction(7, 10), Fraction(1)],
        )
        self.assertEqual(len(rows), 12)
        outcomes = {row["profitable"] for row in rows}
        self.assertEqual(outcomes, {True, False}, "grid must contain both profitable and unprofitable cells")


if __name__ == "__main__":
    unittest.main()
