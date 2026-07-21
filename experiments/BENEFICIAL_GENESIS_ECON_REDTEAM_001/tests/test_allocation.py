import math
import random
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from model import allocation as alloc


DONORS = [("a", 10_000), ("b", 30_000), ("c", 60_000)]
POOL = 1_000_000


class TestAllocationInvariants(unittest.TestCase):
    def test_exact_pro_rata_never_exceeds_pool(self):
        result = alloc.exact_pro_rata(DONORS, POOL)
        self.assertLessEqual(sum(result.values()), POOL)
        for v in result.values():
            self.assertGreaterEqual(v, 0)

    def test_exact_pro_rata_matches_design_pack_rule(self):
        # allocation_i = floor(pool * eligible_i / total_eligible)
        result = alloc.exact_pro_rata(DONORS, POOL)
        total = sum(w for _, w in DONORS)
        for donor_id, w in DONORS:
            self.assertEqual(result[donor_id], (POOL * w) // total)

    def test_capped_pro_rata_respects_cap(self):
        result = alloc.capped_pro_rata([("whale", 900_000), ("small", 100_000)], POOL, cap_bps=1000)
        cap_units = (POOL * 1000) // 10_000
        self.assertLessEqual(result["whale"], cap_units)
        self.assertLessEqual(sum(result.values()), POOL)

    def test_concave_sqrt_favours_small_donors_relative_to_linear(self):
        linear = alloc.exact_pro_rata(DONORS, POOL)
        concave = alloc.concave_sqrt(DONORS, POOL)
        # smallest donor's share should not shrink under concave weighting
        total_linear = sum(linear.values())
        total_concave = sum(concave.values())
        self.assertGreaterEqual(
            concave["a"] / total_concave if total_concave else 0,
            linear["a"] / total_linear if total_linear else 0,
        )

    def test_time_weighted_rewards_earlier_blocks(self):
        donors = [("early", 100_000), ("late", 100_000)]
        blocks = {"early": 0, "late": 100}
        result = alloc.time_weighted(
            donors, POOL, donor_blocks=blocks, epoch_open_block=0, epoch_close_block=100, early_bonus_bps=5000
        )
        self.assertGreater(result["early"], result["late"])

    def test_random_lottery_component_is_seed_reproducible(self):
        r1 = alloc.random_lottery_component(DONORS, POOL, random.Random(7), lottery_share_bps=1000, winners=2)
        r2 = alloc.random_lottery_component(DONORS, POOL, random.Random(7), lottery_share_bps=1000, winners=2)
        self.assertEqual(r1, r2)
        self.assertLessEqual(sum(r1.values()), POOL)

    def test_governance_cap_reduces_max_weight(self):
        allocation = {"whale": 800_000, "small": 200_000}
        proportional = alloc.governance_weight(allocation, None, POOL)
        capped = alloc.governance_weight(allocation, 1000, POOL)
        self.assertEqual(proportional["whale"], 800_000)
        self.assertLessEqual(capped["whale"], (POOL * 1000) // 10_000)

    def test_concave_log_is_deterministic_given_same_inputs(self):
        r1 = alloc.concave_log(DONORS, POOL)
        r2 = alloc.concave_log(DONORS, POOL)
        self.assertEqual(r1, r2)


if __name__ == "__main__":
    unittest.main()
