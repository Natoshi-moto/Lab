import json
import sys
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from model.scenario import run_scenario

HERE = Path(__file__).resolve().parent.parent
SCENARIOS_DIR = HERE / "scenarios"


def load(scenario_id: str) -> dict:
    with (SCENARIOS_DIR / f"{scenario_id}.json").open() as f:
        return json.load(f)


class TestScenarioDeterminism(unittest.TestCase):
    def test_every_scenario_is_reproducible(self):
        for path in SCENARIOS_DIR.glob("*.json"):
            with path.open() as f:
                manifest = json.load(f)
            r1 = run_scenario(manifest)
            r2 = run_scenario(manifest)
            self.assertEqual(r1, r2, f"{manifest['scenario_id']} is not deterministic")

    def test_allocation_never_exceeds_pool(self):
        for path in SCENARIOS_DIR.glob("*.json"):
            with path.open() as f:
                manifest = json.load(f)
            result = run_scenario(manifest)
            self.assertGreaterEqual(result["unissued_remainder"], 0)


class TestSybilSplitFinding(unittest.TestCase):
    def test_concave_scheme_is_profitably_split(self):
        result = run_scenario(load("05_sybil_split_concave"))
        probe = result["attack_analysis"]["sybil_split"]["attacker"]
        self.assertTrue(probe["sybil_split_is_profitable"])
        self.assertGreater(Fraction(probe["split_gain"]), Fraction(0))

    def test_pro_rata_scheme_is_not_profitably_split(self):
        result = run_scenario(load("06_sybil_split_control_pro_rata"))
        probe = result["attack_analysis"]["sybil_split"]["attacker"]
        self.assertFalse(probe["sybil_split_is_profitable"])
        self.assertLessEqual(Fraction(probe["split_gain"]), Fraction(0))

    def test_per_account_cap_is_defeated_by_splitting(self):
        result = run_scenario(load("26_sybil_split_capped_pro_rata"))
        probe = result["attack_analysis"]["sybil_split"]["attacker"]
        self.assertTrue(probe["sybil_split_is_profitable"])
        # single identity is bound by the 10% cap; split recovers most of the
        # attacker's true linear (uncapped) share.
        self.assertEqual(Fraction(probe["single_identity_share"]), Fraction(1, 10))
        self.assertGreater(Fraction(probe["split_total_share"]), Fraction(1, 2))


class TestRebateFinding(unittest.TestCase):
    def test_rebate_attack_gain_equals_rebate_amount(self):
        result = run_scenario(load("07_rebate_sweep"))
        for donor_id, row in result["attack_analysis"]["rebate_attack"].items():
            sats = next(d["sats"] for d in load("07_rebate_sweep")["donors"] if d["id"] == donor_id)
            expected_gain = Fraction(row["rebate_rate"]) * sats
            self.assertEqual(Fraction(row["rebate_attack_gain"]), expected_gain)
            if expected_gain > 0:
                self.assertGreater(Fraction(row["rebated_utility"]), Fraction(row["honest_utility"]))


class TestStolenKeyFinding(unittest.TestCase):
    def test_stolen_key_laundering_gain_is_full_gross_value_at_zero_cost(self):
        result = run_scenario(load("10_stolen_key_donation"))
        row = result["attack_analysis"]["stolen_key_laundering"]["stolen_key_attacker"]
        self.assertEqual(row["true_economic_cost_borne_by_attacker"], "0")
        self.assertGreater(Fraction(row["laundering_gain"]), Fraction(0))


class TestDenominatorShockFinding(unittest.TestCase):
    def test_late_surge_dilutes_early_donor(self):
        result = run_scenario(load("09_denominator_doubles_final_block"))
        shock = result["attack_analysis"]["denominator_shock"]
        self.assertGreater(Fraction(shock["dilution"]), Fraction(0))
        self.assertGreater(shock["post_shock_total_eligible"], shock["pre_shock_total_eligible"])


class TestUndersubscriptionFinding(unittest.TestCase):
    def test_trivial_donation_captures_entire_pool_when_undersubscribed(self):
        result = run_scenario(load("19_undersubscribed_pool"))
        self.assertEqual(result["unissued_remainder"], 0)
        self.assertEqual(
            result["concentration"]["by_beneficial_owner"]["top1_share"], "1"
        )


class TestGovernanceCapFinding(unittest.TestCase):
    def test_cap_keeps_single_owner_under_majority(self):
        result = run_scenario(load("14_governance_capped"))
        self.assertFalse(result["governance"]["crosses_simple_majority"])

    def test_proportional_governance_can_cross_majority(self):
        result = run_scenario(load("13_governance_proportional"))
        self.assertTrue(result["governance"]["crosses_simple_majority"])


class TestLockupFinding(unittest.TestCase):
    def test_longer_lockup_reduces_speculator_utility(self):
        r0 = run_scenario(load("15_lockup_0_months"))
        r12 = run_scenario(load("17_lockup_12_months"))
        u0 = Fraction(r0["donor_economics"]["1.5"]["per_donor"]["speculator"]["utility"])
        u12 = Fraction(r12["donor_economics"]["1.5"]["per_donor"]["speculator"]["utility"])
        self.assertGreater(u0, u12)


if __name__ == "__main__":
    unittest.main()
