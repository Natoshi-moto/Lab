"""Independent adversarial probes for tribunal repair R1 / TRIB-F-001."""

from __future__ import annotations

import random
import sys
import unittest
from pathlib import Path


SUBJECT = Path(__file__).resolve().parents[2] / "BENEFICIAL_GENESIS_ECON_REDTEAM_001"
sys.path.insert(0, str(SUBJECT))

from model import allocation as alloc  # noqa: E402


class TestR1AdversarialMatrix(unittest.TestCase):
    donors = [("a", 100), ("b", 50)]

    def assert_rejected(self, call) -> None:
        with self.assertRaises(alloc.ParticipantValidationError):
            call()

    def test_controlling_counterexample_fails_closed(self):
        self.assert_rejected(
            lambda: alloc.random_lottery_component(
                [("a", 100)], 100, random.Random(1),
                lottery_share_bps=-1000, winners=1,
            )
        )

    def test_lottery_share_bps_type_negative_and_oversize(self):
        for bad in (True, False, 1.5, "1000", -1, -1000, 10_001):
            with self.subTest(value=bad):
                self.assert_rejected(
                    lambda bad=bad: alloc.random_lottery_component(
                        self.donors, 100, random.Random(1),
                        lottery_share_bps=bad, winners=1,
                    )
                )

    def test_early_bonus_bps_type_negative_and_oversize(self):
        for bad in (True, False, 1.5, "1000", -1, -1000, 10_001):
            with self.subTest(value=bad):
                self.assert_rejected(
                    lambda bad=bad: alloc.time_weighted(
                        self.donors, 100, {"a": 0, "b": 1},
                        epoch_open_block=0, epoch_close_block=1,
                        early_bonus_bps=bad,
                    )
                )

    def test_winners_type_and_negative_fail_closed(self):
        for bad in (True, False, 1.5, "1", -1, 0):
            with self.subTest(value=bad):
                self.assert_rejected(
                    lambda bad=bad: alloc.random_lottery_component(
                        self.donors, 100, random.Random(1),
                        lottery_share_bps=1000, winners=bad,
                    )
                )

    def test_oversized_winners_is_safely_bounded_by_population(self):
        result = alloc.random_lottery_component(
            self.donors, 100, random.Random(1),
            lottery_share_bps=10_000, winners=10**6,
        )
        self.assertLessEqual(sum(result.values()), 100)
        self.assertLessEqual(sum(units > 0 for units in result.values()), len(self.donors))

    def test_pool_type_and_negative_fail_closed(self):
        for bad in (True, False, 1.5, "100", -1, -1000):
            with self.subTest(value=bad):
                self.assert_rejected(
                    lambda bad=bad: alloc.random_lottery_component(
                        self.donors, bad, random.Random(1),
                        lottery_share_bps=1000, winners=1,
                    )
                )

    def test_oversized_integer_pool_remains_supply_conserving(self):
        pool = 10**100
        result = alloc.random_lottery_component(
            self.donors, pool, random.Random(1),
            lottery_share_bps=10_000, winners=2,
        )
        self.assertLessEqual(sum(result.values()), pool)
        alloc.enforce_supply_invariant(result, pool)

    def test_public_invariant_gate_rejects_bad_outputs(self):
        for bad in ({"a": 101}, {"a": -1}, {"a": True}, {"a": 1.5}):
            with self.subTest(allocation=bad):
                self.assert_rejected(lambda bad=bad: alloc.enforce_supply_invariant(bad, 100))


if __name__ == "__main__":
    unittest.main()
