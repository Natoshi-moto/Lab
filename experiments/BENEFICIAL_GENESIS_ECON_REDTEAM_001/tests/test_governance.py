import sys
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from model import governance as gov

ALLOCATION = {"whale": 600_000, "small_1": 200_000, "small_2": 200_000}


class TestGovernanceRules(unittest.TestCase):
    def test_none_rule_grants_no_weight(self):
        result = gov.governance_weights(ALLOCATION, "none")
        self.assertTrue(all(w == 0 for w in result["weights"].values()))
        self.assertFalse(result["transferable"])

    def test_nontransferable_equal_ignores_donation_size(self):
        result = gov.governance_weights(ALLOCATION, "nontransferable_equal")
        weights = set(result["weights"].values())
        self.assertEqual(weights, {Fraction(1, 3)})
        self.assertFalse(result["transferable"])

    def test_nontransferable_proportional_and_token_weighted_match_numerically(self):
        # E-003 repair: these two rules are numerically identical at the
        # point of computation; they differ only in the *durability* label
        # (nontransferable = frozen at genesis; token_weighted = moves with
        # the token on a secondary market). Tests must not silently assume
        # one is a snapshot of the other's "real" answer.
        frozen = gov.governance_weights(ALLOCATION, "nontransferable_proportional")
        token = gov.governance_weights(ALLOCATION, "token_weighted")
        self.assertEqual(frozen["weights"], token["weights"])
        self.assertFalse(frozen["transferable"])
        self.assertTrue(token["transferable"])

    def test_proportional_governance_can_cross_majority(self):
        result = gov.governance_weights(ALLOCATION, "token_weighted")
        control = gov.majority_threshold_control(result["weights"])
        self.assertTrue(control["crosses"][str(Fraction(1, 2))])

    def test_continuously_capped_renormalizes_to_sum_one(self):
        result = gov.governance_weights(ALLOCATION, "continuously_capped", cap_bps=1000)
        total = sum(result["weights"].values())
        self.assertEqual(total, Fraction(1))

    def test_continuously_capped_holds_whale_under_majority(self):
        result = gov.governance_weights(ALLOCATION, "continuously_capped", cap_bps=1000)
        control = gov.majority_threshold_control(result["weights"])
        self.assertFalse(control["crosses"][str(Fraction(1, 2))])

    def test_continuously_capped_requires_cap_bps(self):
        with self.assertRaises(ValueError):
            gov.governance_weights(ALLOCATION, "continuously_capped")

    def test_unknown_rule_rejected(self):
        with self.assertRaises(ValueError):
            gov.governance_weights(ALLOCATION, "made_up_rule")

    def test_majority_threshold_control_on_empty_weights(self):
        control = gov.majority_threshold_control({})
        self.assertFalse(control["crosses"][str(Fraction(1, 2))])
        self.assertIsNone(control["max_holder"])


if __name__ == "__main__":
    unittest.main()
