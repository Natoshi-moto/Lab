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

    def test_unknown_rule_rejected(self):
        with self.assertRaises(ValueError):
            gov.governance_weights(ALLOCATION, "made_up_rule")

    def test_majority_threshold_control_on_empty_weights(self):
        control = gov.majority_threshold_control({})
        self.assertFalse(control["crosses"][str(Fraction(1, 2))])
        self.assertIsNone(control["max_holder"])


class TestCapThenRenormalize(unittest.TestCase):
    """Micro-repair item 2: this rule must never be treated as a hard final
    per-holder cap. These tests prove, at 1/2/3-holder scale, that the
    *final* normalized weight can exceed the nominal clip fraction once
    renormalization redistributes the clipped-off remainder.
    """

    def test_renormalizes_to_sum_one(self):
        result = gov.governance_weights(ALLOCATION, "cap_then_renormalize", cap_bps=1000)
        total = sum(result["weights"].values())
        self.assertEqual(total, Fraction(1))

    def test_holds_whale_under_majority_in_the_tested_many_holder_scenario(self):
        result = gov.governance_weights(ALLOCATION, "cap_then_renormalize", cap_bps=1000)
        control = gov.majority_threshold_control(result["weights"])
        self.assertFalse(control["crosses"][str(Fraction(1, 2))])

    def test_requires_cap_bps(self):
        with self.assertRaises(ValueError):
            gov.governance_weights(ALLOCATION, "cap_then_renormalize")

    def test_reports_all_three_stages_distinctly(self):
        result = gov.governance_weights(ALLOCATION, "cap_then_renormalize", cap_bps=1000)
        self.assertIn("raw_proportional_weights", result)
        self.assertIn("pre_normalization_clipped_weights", result)
        self.assertIn("weights", result)
        # the whale's raw share (0.6) differs from its clipped share (0.1,
        # the cap) which differs again from its final renormalized share.
        self.assertNotEqual(
            result["raw_proportional_weights"]["whale"],
            result["pre_normalization_clipped_weights"]["whale"],
        )

    def test_one_holder_final_share_exceeds_nominal_clip(self):
        # A single holder clipped to 50% of pre-cap weight has nobody else
        # to renormalize against, so its final share snaps back to 100% —
        # far above the nominal 50% clip.
        allocation = {"only": 1_000_000}
        result = gov.governance_weights(allocation, "cap_then_renormalize", cap_bps=5_000)
        nominal_clip = Fraction(5_000, 10_000)
        self.assertEqual(result["pre_normalization_clipped_weights"]["only"], nominal_clip)
        self.assertGreater(result["weights"]["only"], nominal_clip)
        self.assertEqual(result["weights"]["only"], Fraction(1))

    def test_two_holder_final_share_exceeds_nominal_clip(self):
        allocation = {"a": 700_000, "b": 300_000}
        result = gov.governance_weights(allocation, "cap_then_renormalize", cap_bps=5_000)
        nominal_clip = Fraction(5_000, 10_000)
        self.assertGreater(result["weights"]["a"], nominal_clip)
        self.assertIn("a", result["holders_exceeding_nominal_cap_after_renormalization"])

    def test_three_holder_final_share_exceeds_nominal_clip(self):
        allocation = {"a": 500_000, "b": 300_000, "c": 200_000}
        result = gov.governance_weights(allocation, "cap_then_renormalize", cap_bps=4_000)
        nominal_clip = Fraction(4_000, 10_000)
        self.assertGreater(result["weights"]["a"], nominal_clip)
        self.assertIn("a", result["holders_exceeding_nominal_cap_after_renormalization"])

    def test_notes_disclose_not_a_hard_cap_rather_than_asserting_one(self):
        result = gov.governance_weights(ALLOCATION, "cap_then_renormalize", cap_bps=1000)
        joined_notes = " ".join(result["notes"]).lower()
        self.assertIn("not a hard final per-holder cap", joined_notes)
        self.assertIn("cap-then-renormalize", joined_notes)


if __name__ == "__main__":
    unittest.main()
