"""Metrics, governance renormalization, laundering, rebate tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from model.allocation import allocate  # noqa: E402
from model.governance import governance_weights, majority_threshold_control  # noqa: E402
from model.laundering import laundering_economics  # noqa: E402
from model.metrics import concentration_report, gini, hhi, top_n_share  # noqa: E402
from model.rebate import conditional_rebate_outcome  # noqa: E402


class TestMetrics(unittest.TestCase):
    def test_gini_equal(self):
        self.assertAlmostEqual(gini([1, 1, 1, 1]), 0.0)

    def test_gini_unequal(self):
        self.assertGreater(gini([0, 0, 0, 10]), 0.5)

    def test_hhi_monopoly(self):
        self.assertAlmostEqual(hhi([1, 0, 0]), 1.0)

    def test_top_n_denominators_differ(self):
        units = [100, 50, 25]
        pool = 1000
        issued = sum(units)
        self.assertAlmostEqual(top_n_share(units, 1, denominator=pool), 0.1)
        self.assertAlmostEqual(top_n_share(units, 1, denominator=issued), 100 / 175)

    def test_concentration_report_labels_both(self):
        # Three equal weights leave floor remainder so pool vs issued denominators diverge.
        alloc = allocate(
            pool=1000,
            contributions=[
                {"donor_id": "a", "eligible_sats": 1},
                {"donor_id": "b", "eligible_sats": 1},
                {"donor_id": "c", "eligible_sats": 1},
            ],
        )
        self.assertGreater(alloc["remainder_unissued"], 0)
        rep = concentration_report(alloc["allocations"], pool=1000, total_issued=alloc["total_issued"])
        self.assertIn("top1_share_of_pool", rep)
        self.assertIn("top1_share_of_issued", rep)
        self.assertNotEqual(rep["top1_share_of_pool"], rep["top1_share_of_issued"])


class TestGovernance(unittest.TestCase):
    def test_none_no_control(self):
        alloc = allocate(
            pool=1000,
            contributions=[
                {"donor_id": "whale", "eligible_sats": 99},
                {"donor_id": "a", "eligible_sats": 1},
            ],
        )
        g = governance_weights(allocations=alloc["allocations"], rule="none")
        maj = majority_threshold_control(g["weights"])
        self.assertFalse(maj["any_single_actor_controls"])

    def test_token_weighted_whale_control(self):
        alloc = allocate(
            pool=1000,
            contributions=[
                {"donor_id": "whale", "eligible_sats": 90},
                {"donor_id": "a", "eligible_sats": 10},
            ],
        )
        g = governance_weights(allocations=alloc["allocations"], rule="token_weighted")
        maj = majority_threshold_control(g["weights"], threshold=0.5)
        self.assertTrue(maj["any_single_actor_controls"])
        self.assertIn("whale", maj["controllers"])

    def test_capped_renormalizes(self):
        alloc = allocate(
            pool=1_000_000,
            contributions=[
                {"donor_id": "whale", "eligible_sats": 90},
                {"donor_id": "a", "eligible_sats": 5},
                {"donor_id": "b", "eligible_sats": 5},
            ],
        )
        g = governance_weights(
            allocations=alloc["allocations"],
            rule="continuously_capped",
            cap_fraction_of_issued=0.05,
        )
        self.assertAlmostEqual(g["weight_sum"], 1.0, places=9)
        self.assertGreater(g["weights"]["whale"], 0)
        # Pre-norm cap applied, then renorm: whale raw ~0.9 → min(0.9, 0.05)=0.05;
        # a,b raw ~0.05 → 0.05 each; renorm → equal thirds.
        self.assertIn("capped weights are renormalized to sum to 1.0", " ".join(g["notes"]))
        maj = majority_threshold_control(g["weights"], threshold=0.5)
        self.assertFalse(maj["any_single_actor_controls"])
        self.assertAlmostEqual(g["weights"]["whale"], 1.0 / 3.0, places=6)


class TestLaundering(unittest.TestCase):
    def test_separates_opportunity_from_legal_basis(self):
        r = laundering_economics(
            donated_sats=10_000_000,
            allocation_units=5_000_000,
            token_value_per_unit_in_sats=1.0,
            legal_cost_basis_sats=0.0,
            alternative_realization_fraction=0.7,
            seizure_probability_if_spend_source=0.3,
            seizure_probability_if_migrate=0.2,
            liquidation_haircut_on_token=0.15,
        )
        self.assertEqual(r["legal_cost_basis_sats"], 0.0)
        self.assertGreater(r["source_asset_opportunity_value"], 0.0)
        self.assertIn("net_laundering_profit", r)
        self.assertFalse(r["interpretation"]["zero_cost_profitable_laundering_proven"])
        # Gross token face may be high while net is negative after opportunity cost.
        self.assertNotEqual(
            r["net_laundering_profit"],
            r["gross_token_output"] - r["legal_cost_basis_sats"],
        )

    def test_high_token_can_be_profitable(self):
        r = laundering_economics(
            donated_sats=1000,
            allocation_units=1000,
            token_value_per_unit_in_sats=10.0,
            alternative_realization_fraction=0.1,
            seizure_probability_if_spend_source=0.9,
            seizure_probability_if_migrate=0.0,
            liquidation_haircut_on_token=0.0,
        )
        self.assertTrue(r["interpretation"]["profitable_under_these_assumptions"])


class TestRebate(unittest.TestCase):
    def test_conditional_one_for_one(self):
        o = conditional_rebate_outcome(
            donations_by_charity=[
                {"charity_id": "C", "donated_sats": 1000, "colluding": True, "rebate_rate": 0.4}
            ],
            access_probability=1.0,
            detection_probability=0.0,
        )
        self.assertAlmostEqual(o["conditional"]["total_rebate_sats"], 400.0)
        self.assertAlmostEqual(o["conditional"]["total_charity_retained"], 600.0)
        self.assertFalse(o["claims"]["predictable_aggregate_destruction_of_charity_benefit"])

    def test_low_access_reduces_expected(self):
        high = conditional_rebate_outcome(
            donations_by_charity=[
                {"charity_id": "C", "donated_sats": 1000, "colluding": False, "rebate_rate": 0.5}
            ],
            access_probability=1.0,
            enforcement_probability=1.0,
            detection_probability=0.0,
            rebate_rate_if_colluding=0.5,
        )
        low = conditional_rebate_outcome(
            donations_by_charity=[
                {"charity_id": "C", "donated_sats": 1000, "colluding": False, "rebate_rate": 0.5}
            ],
            access_probability=0.01,
            enforcement_probability=1.0,
            detection_probability=0.0,
            rebate_rate_if_colluding=0.5,
        )
        self.assertGreater(
            high["expected_with_frictions"]["total_rebate_sats"],
            low["expected_with_frictions"]["total_rebate_sats"],
        )


class TestScenariosDeterminism(unittest.TestCase):
    def test_all_scenarios_run_twice_identical(self):
        import json
        from model.scenario import run_scenario

        scenarios_dir = ROOT / "scenarios"
        for path in sorted(scenarios_dir.glob("*.json")):
            with path.open() as fh:
                spec = json.load(fh)
            a = run_scenario(spec)
            b = run_scenario(spec)
            self.assertEqual(a, b, msg=path.name)


if __name__ == "__main__":
    unittest.main()
