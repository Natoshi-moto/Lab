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

    def test_duplicate_donor_id_fails_closed(self):
        manifest = {
            "scenario_id": "duplicate_probe",
            "seed": 1,
            "pool_units": 1000,
            "allocation_scheme": "EXACT_PRO_RATA",
            "donors": [
                {"id": "same", "sats": 100},
                {"id": "same", "sats": 200},
            ],
        }
        with self.assertRaises(ValueError):
            run_scenario(manifest)


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
        self.assertEqual(Fraction(probe["single_identity_share_of_pool"]), Fraction(1, 10))
        self.assertGreater(Fraction(probe["split_total_share_of_pool"]), Fraction(1, 2))


class TestRebateFinding(unittest.TestCase):
    def test_conditional_arithmetic_is_exactly_one_for_one(self):
        # E-008 preserved finding, now under the repaired field names.
        manifest = load("07_rebate_sweep")
        result = run_scenario(manifest)
        for donor_id, row in result["attack_analysis"]["rebate_and_collusion"].items():
            sats = next(d["sats"] for d in manifest["donors"] if d["id"] == donor_id)
            rebate_rate = Fraction(row["rebate_rate"])
            expected = rebate_rate * sats
            self.assertEqual(Fraction(row["conditional"]["rebate_sats"]), expected)
            # scenarios 07/08/18 assume the arrangement already exists with
            # no frictions, so expected must equal conditional by default.
            self.assertEqual(
                Fraction(row["expected_with_frictions"]["expected_rebate_sats"]), expected
            )
            self.assertFalse(row["claims"]["predictable_aggregate_destruction_of_charity_benefit"])

    def test_low_access_scenario_shows_expected_far_below_conditional(self):
        result = run_scenario(load("27_rebate_access_frictions"))
        row = result["attack_analysis"]["rebate_and_collusion"]["arbitrary_donor_seeking_rebate"]
        conditional = Fraction(row["conditional"]["rebate_sats"])
        expected = Fraction(row["expected_with_frictions"]["expected_rebate_sats"])
        self.assertLess(expected, conditional / 5)


class TestTaintedFundFinding(unittest.TestCase):
    def test_decomposed_fields_present_and_pathway_disclosed(self):
        result = run_scenario(load("10_stolen_key_donation"))
        row = result["attack_analysis"]["tainted_fund_migration"]["stolen_key_attacker"]
        for field in (
            "legal_cost_basis",
            "source_asset_opportunity_value",
            "gross_token_output",
            "risk_adjusted_token_value",
            "realizable_token_value",
            "net_migration_profit",
        ):
            self.assertIn(field, row)
        self.assertTrue(row["interpretation"]["pathway_exists"])
        self.assertFalse(row["interpretation"]["zero_cost_unconditionally_profitable_laundering_proven"])

    def test_sensitivity_grid_present_with_mixed_outcomes(self):
        result = run_scenario(load("10_stolen_key_donation"))
        grid = result["attack_analysis"]["tainted_fund_sensitivity_grid"]
        outcomes = {row["profitable"] for row in grid}
        self.assertEqual(outcomes, {True, False})


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
            result["concentration"]["by_beneficial_owner"]["top1_share_of_pool"], "1"
        )


class TestGovernanceConditionality(unittest.TestCase):
    def test_governance_is_not_computed_unless_requested(self):
        # E-003 repair target: scenarios that do not opt in via
        # governance_rules must not default to any governance assumption.
        result = run_scenario(load("01_whale_50"))
        self.assertIsNone(result["governance"])

    def test_no_governance_rule_grants_no_control(self):
        result = run_scenario(load("13_governance_rules_comparison"))
        self.assertFalse(result["governance"]["none"]["crosses_simple_majority"])

    def test_nontransferable_equal_prevents_capture_by_size(self):
        result = run_scenario(load("13_governance_rules_comparison"))
        self.assertFalse(result["governance"]["nontransferable_equal"]["crosses_simple_majority"])

    def test_token_weighted_governance_can_cross_majority(self):
        result = run_scenario(load("13_governance_rules_comparison"))
        self.assertTrue(result["governance"]["token_weighted"]["crosses_simple_majority"])
        self.assertTrue(result["governance"]["token_weighted"]["transferable"])

    def test_nontransferable_proportional_matches_token_weighted_numerically(self):
        result = run_scenario(load("13_governance_rules_comparison"))
        prop = result["governance"]["nontransferable_proportional"]
        tok = result["governance"]["token_weighted"]
        self.assertEqual(prop["max_holder_share"], tok["max_holder_share"])
        self.assertFalse(prop["transferable"])
        self.assertTrue(tok["transferable"])

    def test_cap_then_renormalize_holds_whale_under_majority_in_this_scenario(self):
        # This holds in the tested many-holder (501-donor) population; it is
        # not a durable guarantee of the rule itself — see
        # TestCapThenRenormalizeIsNotAHardCap below and FAILURE_CONDITIONS.md.
        result = run_scenario(load("14_governance_cap_then_renormalize"))
        self.assertFalse(result["governance"]["cap_then_renormalize_500bps"]["crosses_simple_majority"])
        self.assertFalse(result["governance"]["cap_then_renormalize_1000bps"]["crosses_simple_majority"])

    def test_cap_then_renormalize_reports_all_three_stages_in_scenario_output(self):
        result = run_scenario(load("14_governance_cap_then_renormalize"))
        block = result["governance"]["cap_then_renormalize_500bps"]
        for field in (
            "raw_proportional_weights",
            "pre_normalization_clipped_weights",
            "final_normalized_weights",
        ):
            self.assertIn(field, block)


class TestCapThenRenormalizeIsNotAHardCap(unittest.TestCase):
    def test_small_population_final_share_can_exceed_nominal_clip(self):
        # Direct scenario-level proof (mirrors tests/test_governance.py at
        # the model layer) that a small, concentrated holder set can push a
        # holder's final governance share above the nominal cap fraction.
        manifest = {
            "scenario_id": "cap_then_renormalize_small_population_probe",
            "seed": 1,
            "pool_units": 1_000_000,
            "allocation_scheme": "EXACT_PRO_RATA",
            "governance_rules": [{"rule": "cap_then_renormalize", "cap_bps": 5_000}],
            "donors": [
                {"id": "only", "sats": 1_000_000, "group": "only"},
            ],
        }
        result = run_scenario(manifest)
        block = result["governance"]["cap_then_renormalize_5000bps"]
        nominal_clip = Fraction(1, 2)
        self.assertGreater(Fraction(block["final_normalized_weights"]["only"]), nominal_clip)


class TestLockupFinding(unittest.TestCase):
    def test_longer_lockup_reduces_speculator_utility(self):
        r0 = run_scenario(load("15_lockup_0_months"))
        r12 = run_scenario(load("17_lockup_12_months"))
        u0 = Fraction(r0["donor_economics"]["1.5"]["per_donor"]["speculator"]["utility"])
        u12 = Fraction(r12["donor_economics"]["1.5"]["per_donor"]["speculator"]["utility"])
        self.assertGreater(u0, u12)


if __name__ == "__main__":
    unittest.main()
