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

    def test_random_lottery_component_draws_without_replacement(self):
        # E-005 / BGEN-ECON-REV-005 repair: the original implementation used
        # random.choices (with replacement), so "winners" could double-count
        # one donor. With a small population and many requested winner slots,
        # a with-replacement bug would show fewer distinct winners receiving
        # the prize than slots requested; without replacement, every donor
        # with positive weight wins at most once and all of them win when
        # slots >= population size.
        donors = [("a", 10), ("b", 10), ("c", 10)]
        result = alloc.random_lottery_component(
            donors, 3_000, random.Random(42), lottery_share_bps=10_000, winners=3
        )
        winners = [donor_id for donor_id, units in result.items() if units > 0]
        self.assertEqual(len(winners), 3, "all three donors must win exactly one slot each")
        self.assertEqual(len(set(winners)), 3, "no donor may occupy more than one winner slot")

    def test_concave_log_is_deterministic_given_same_inputs(self):
        r1 = alloc.concave_log(DONORS, POOL)
        r2 = alloc.concave_log(DONORS, POOL)
        self.assertEqual(r1, r2)


class TestSharedParticipantValidator(unittest.TestCase):
    """Direct tests against the public allocation functions themselves
    (micro-repair item 1): validation must not be something only
    model/scenario.py happens to provide. Every public allocation function
    is exercised here with the same bad-input classes.
    """

    PUBLIC_FUNCTIONS = (
        alloc.exact_pro_rata,
        alloc.capped_pro_rata,
        alloc.concave_sqrt,
        alloc.concave_log,
        alloc.time_weighted,
    )

    def test_duplicate_ids_rejected_by_every_public_function(self):
        bad = [("dup", 10), ("dup", 20)]
        for fn in self.PUBLIC_FUNCTIONS:
            with self.subTest(fn=fn.__name__):
                with self.assertRaises(alloc.ParticipantValidationError):
                    fn(bad, POOL)
        with self.assertRaises(alloc.ParticipantValidationError):
            alloc.random_lottery_component(bad, POOL, random.Random(1))

    def test_empty_id_rejected_by_every_public_function(self):
        bad = [("", 10)]
        for fn in self.PUBLIC_FUNCTIONS:
            with self.subTest(fn=fn.__name__):
                with self.assertRaises(alloc.ParticipantValidationError):
                    fn(bad, POOL)
        with self.assertRaises(alloc.ParticipantValidationError):
            alloc.random_lottery_component(bad, POOL, random.Random(1))

    def test_non_string_id_rejected_by_every_public_function(self):
        bad = [(123, 10)]
        for fn in self.PUBLIC_FUNCTIONS:
            with self.subTest(fn=fn.__name__):
                with self.assertRaises(alloc.ParticipantValidationError):
                    fn(bad, POOL)

    def test_boolean_weight_rejected_by_every_public_function(self):
        # bool is a subclass of int in Python; must not be silently accepted.
        bad = [("a", True)]
        for fn in self.PUBLIC_FUNCTIONS:
            with self.subTest(fn=fn.__name__):
                with self.assertRaises(alloc.ParticipantValidationError):
                    fn(bad, POOL)

    def test_non_integer_weight_rejected_by_every_public_function(self):
        for bad_weight in (10.5, "10", None):
            bad = [("a", bad_weight)]
            for fn in self.PUBLIC_FUNCTIONS:
                with self.subTest(fn=fn.__name__, weight=bad_weight):
                    with self.assertRaises(alloc.ParticipantValidationError):
                        fn(bad, POOL)

    def test_negative_weight_rejected_by_every_public_function(self):
        bad = [("a", -1)]
        for fn in self.PUBLIC_FUNCTIONS:
            with self.subTest(fn=fn.__name__):
                with self.assertRaises(alloc.ParticipantValidationError):
                    fn(bad, POOL)

    def test_invalid_pool_rejected(self):
        for bad_pool in (-1, 1.5, "100", None, True):
            with self.subTest(pool=bad_pool):
                with self.assertRaises(alloc.ParticipantValidationError):
                    alloc.exact_pro_rata(DONORS, bad_pool)

    def test_zero_pool_is_allowed(self):
        # Zero is a legitimate sub-pool (e.g. a fully-lottery split routes a
        # zero-sized pro-rata remainder), not an error.
        result = alloc.exact_pro_rata(DONORS, 0)
        self.assertEqual(sum(result.values()), 0)

    def test_invalid_cap_bps_rejected(self):
        for bad_cap in (0, -100, 10_001, 1.5, "1000", True):
            with self.subTest(cap_bps=bad_cap):
                with self.assertRaises(alloc.ParticipantValidationError):
                    alloc.capped_pro_rata(DONORS, POOL, cap_bps=bad_cap)

    def test_invalid_winners_rejected(self):
        for bad_winners in (0, -1, 1.5, "2", True):
            with self.subTest(winners=bad_winners):
                with self.assertRaises(alloc.ParticipantValidationError):
                    alloc.random_lottery_component(DONORS, POOL, random.Random(1), winners=bad_winners)

    def test_valid_input_still_succeeds(self):
        # The validator must not be so strict that it rejects ordinary,
        # well-formed input.
        result = alloc.exact_pro_rata(DONORS, POOL)
        self.assertEqual(sum(result.values()) <= POOL, True)


if __name__ == "__main__":
    unittest.main()
