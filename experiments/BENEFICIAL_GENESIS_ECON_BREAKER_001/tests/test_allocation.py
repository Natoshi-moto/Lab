"""Allocation invariants and dual-check of key findings."""

from __future__ import annotations

import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from model.allocation import (  # noqa: E402
    AllocationError,
    allocate,
    prove_concave_sybil_gain,
    prove_split_invariance_pro_rata,
)


class TestProRata(unittest.TestCase):
    def test_supply_invariant(self):
        r = allocate(
            pool=1_000_000,
            contributions=[
                {"donor_id": "a", "eligible_sats": 30},
                {"donor_id": "b", "eligible_sats": 70},
            ],
            rule="pro_rata",
        )
        self.assertEqual(r["total_issued"] + r["remainder_unissued"], r["pool"])
        self.assertLessEqual(r["total_issued"], r["pool"])
        for a in r["allocations"]:
            expected = (r["pool"] * a["eligible_sats"]) // r["total_eligible_sats"]
            self.assertEqual(a["allocation"], expected)

    def test_duplicate_donor_fails_closed(self):
        with self.assertRaises(AllocationError) as ctx:
            allocate(
                pool=100,
                contributions=[
                    {"donor_id": "a", "eligible_sats": 1},
                    {"donor_id": "a", "eligible_sats": 2},
                ],
            )
        self.assertEqual(ctx.exception.code, "DUPLICATE_DONOR_ID")

    def test_bool_eligible_rejected(self):
        with self.assertRaises(AllocationError):
            allocate(
                pool=100,
                contributions=[{"donor_id": "a", "eligible_sats": True}],  # type: ignore[list-item]
            )

    def test_share_of_pool_vs_issued(self):
        r = allocate(
            pool=1000,
            contributions=[
                {"donor_id": "a", "eligible_sats": 1},
                {"donor_id": "b", "eligible_sats": 1},
                {"donor_id": "c", "eligible_sats": 1},
            ],
        )
        # floor remainders may leave remainder_unissued > 0
        for a in r["allocations"]:
            self.assertAlmostEqual(a["share_of_pool"], a["allocation"] / r["pool"])
            if r["total_issued"]:
                self.assertAlmostEqual(a["share_of_issued"], a["allocation"] / r["total_issued"])

    def test_split_invariance_mass(self):
        proof = prove_split_invariance_pro_rata(1_000_000, [100, 200, 300])
        # Floor residuals may differ slightly; mass preservation within n parts
        self.assertTrue(
            proof["split_invariant"]
            or abs(proof["whole_allocation"] - proof["split_sum_allocation"]) <= 3
        )


class TestConcaveSybil(unittest.TestCase):
    def test_sqrt_sybil_gain(self):
        proof = prove_concave_sybil_gain(1_000_000_000, 10_000, 10)
        self.assertTrue(proof["sybil_strictly_better"])
        self.assertGreater(proof["sybil_gain"], 0)

    def test_independent_math_sqrt_split(self):
        # Dual implementation: pure math without allocate()
        sats = 10000
        n = 10
        whole_w = math.isqrt(sats)
        part_w = n * math.isqrt(sats // n)
        self.assertGreater(part_w, whole_w)


class TestCapped(unittest.TestCase):
    def test_cap_reduces_whale_weight(self):
        unc = allocate(
            pool=1_000_000,
            contributions=[
                {"donor_id": "whale", "eligible_sats": 9000},
                {"donor_id": "a", "eligible_sats": 500},
                {"donor_id": "b", "eligible_sats": 500},
            ],
            rule="pro_rata",
        )
        cap = allocate(
            pool=1_000_000,
            contributions=[
                {"donor_id": "whale", "eligible_sats": 9000, "identity_id": "whale"},
                {"donor_id": "a", "eligible_sats": 500},
                {"donor_id": "b", "eligible_sats": 500},
            ],
            rule="capped_pro_rata",
            cap_sats_per_identity=1000,
        )
        w_unc = next(a for a in unc["allocations"] if a["donor_id"] == "whale")["allocation"]
        w_cap = next(a for a in cap["allocations"] if a["donor_id"] == "whale")["allocation"]
        self.assertLess(w_cap, w_unc)

    def test_sybil_defeats_cap_without_identity(self):
        # 10 identities of 1000 each vs honest 10000 with cap 1000
        syb = allocate(
            pool=1_000_000,
            contributions=[
                *[{"donor_id": f"s{i}", "eligible_sats": 1000, "identity_id": f"s{i}"} for i in range(10)],
                {"donor_id": "honest", "eligible_sats": 10000, "identity_id": "honest"},
            ],
            rule="capped_pro_rata",
            cap_sats_per_identity=1000,
        )
        sybil_sum = sum(a["allocation"] for a in syb["allocations"] if a["donor_id"].startswith("s"))
        honest = next(a for a in syb["allocations"] if a["donor_id"] == "honest")["allocation"]
        # Sybil total mass after cap: 10*1000=10000 equals honest capped 1000... wait honest is 10000 capped to 1000
        # so sybil gets 10x honest
        self.assertGreater(sybil_sum, honest)


class TestLottery(unittest.TestCase):
    def test_without_replacement_unique_winners(self):
        r = allocate(
            pool=1000,
            contributions=[
                {"donor_id": "a", "eligible_sats": 10},
                {"donor_id": "b", "eligible_sats": 10},
                {"donor_id": "c", "eligible_sats": 10},
                {"donor_id": "d", "eligible_sats": 10},
            ],
            rule="lottery_without_replacement",
            lottery_seed=7,
            lottery_winner_slots=3,
        )
        winners = r["lottery_winners"]
        self.assertEqual(len(winners), len(set(winners)))
        self.assertFalse(r["lottery_replacement"])

    def test_deterministic_seed(self):
        kwargs = dict(
            pool=1000,
            contributions=[
                {"donor_id": "a", "eligible_sats": 50},
                {"donor_id": "b", "eligible_sats": 30},
                {"donor_id": "c", "eligible_sats": 20},
            ],
            rule="lottery_without_replacement",
            lottery_seed=99,
            lottery_winner_slots=2,
        )
        r1 = allocate(**kwargs)
        r2 = allocate(**kwargs)
        self.assertEqual(r1["lottery_winners"], r2["lottery_winners"])


class TestNoToken(unittest.TestCase):
    def test_nothing_issued(self):
        r = allocate(
            pool=1000,
            contributions=[{"donor_id": "a", "eligible_sats": 5}],
            rule="no_token",
        )
        self.assertEqual(r["total_issued"], 0)
        self.assertEqual(r["remainder_unissued"], 1000)


if __name__ == "__main__":
    unittest.main()
