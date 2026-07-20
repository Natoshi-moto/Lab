"""Allocation invariant and adversarial arithmetic tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

EXP = Path(__file__).resolve().parents[1]
if str(EXP) not in sys.path:
    sys.path.insert(0, str(EXP))

from protocol.allocation import (  # noqa: E402
    AllocationError,
    allocate_proportional,
    assert_supply_invariant,
    try_overflow_attack_vectors,
)
from protocol.constants import (  # noqa: E402
    DEFAULT_FIXED_BITCOIN_GENESIS_POOL,
    MAX_SATS,
)


class TestAllocation(unittest.TestCase):
    def test_floor_proportional_and_remainder_unissued(self) -> None:
        rec = allocate_proportional(
            fixed_bitcoin_genesis_pool=1000,
            eligible_by_nullifier=[
                ("aa" * 32, 1),
                ("bb" * 32, 1),
                ("cc" * 32, 1),
            ],
            epoch_id="e",
        )
        assert_supply_invariant(rec)
        self.assertEqual(rec["total_issued"], 999)
        self.assertEqual(rec["remainder_unissued"], 1)
        self.assertEqual(sum(r["allocation"] for r in rec["claims"]), 999)
        self.assertLessEqual(rec["total_issued"], 1000)

    def test_issuance_never_exceeds_pool(self) -> None:
        rec = allocate_proportional(
            fixed_bitcoin_genesis_pool=DEFAULT_FIXED_BITCOIN_GENESIS_POOL,
            eligible_by_nullifier=[
                ("11" * 32, 100_000),
                ("22" * 32, 250_000),
                ("33" * 32, 50_000),
                ("44" * 32, 75_000),
            ],
            epoch_id="e",
        )
        assert_supply_invariant(rec)
        self.assertLessEqual(rec["total_issued"], DEFAULT_FIXED_BITCOIN_GENESIS_POOL)
        self.assertEqual(
            rec["total_issued"] + rec["remainder_unissued"],
            DEFAULT_FIXED_BITCOIN_GENESIS_POOL,
        )

    def test_single_claim_takes_entire_pool(self) -> None:
        rec = allocate_proportional(
            fixed_bitcoin_genesis_pool=1_000_000,
            eligible_by_nullifier=[("ab" * 32, 999)],
            epoch_id="e",
        )
        self.assertEqual(rec["total_issued"], 1_000_000)
        self.assertEqual(rec["remainder_unissued"], 0)

    def test_rejects_bool_and_negative(self) -> None:
        with self.assertRaises(AllocationError) as ctx:
            allocate_proportional(
                fixed_bitcoin_genesis_pool=100,
                eligible_by_nullifier=[("aa" * 32, True)],  # type: ignore[list-item]
                epoch_id="e",
            )
        self.assertEqual(ctx.exception.code, "ARITHMETIC_OVERFLOW")

        with self.assertRaises(AllocationError):
            allocate_proportional(
                fixed_bitcoin_genesis_pool=-1,
                eligible_by_nullifier=[("aa" * 32, 1)],
                epoch_id="e",
            )

    def test_duplicate_nullifier_rejected(self) -> None:
        with self.assertRaises(AllocationError) as ctx:
            allocate_proportional(
                fixed_bitcoin_genesis_pool=100,
                eligible_by_nullifier=[("aa" * 32, 1), ("aa" * 32, 2)],
                epoch_id="e",
            )
        self.assertEqual(ctx.exception.code, "NULLIFIER_ALREADY_CONSUMED")

    def test_large_product_still_bounded(self) -> None:
        rec = allocate_proportional(
            fixed_bitcoin_genesis_pool=MAX_SATS,
            eligible_by_nullifier=[("aa" * 32, MAX_SATS), ("bb" * 32, 1)],
            epoch_id="e",
        )
        assert_supply_invariant(rec)
        self.assertLessEqual(rec["total_issued"], MAX_SATS)

    def test_overflow_attack_vectors_report(self) -> None:
        results = try_overflow_attack_vectors()
        self.assertTrue(any(r.get("case") == "large_product_floor" for r in results))
        self.assertTrue(all(
            r.get("ok") is True
            for r in results
            if r.get("case") in {"negative_pool", "bool_eligible", "float_eligible"}
        ))

    def test_canonical_order_by_nullifier(self) -> None:
        rec = allocate_proportional(
            fixed_bitcoin_genesis_pool=100,
            eligible_by_nullifier=[("ff" * 32, 10), ("00" * 32, 10)],
            epoch_id="e",
        )
        keys = [r["nullifier_hex"] for r in rec["claims"]]
        self.assertEqual(keys, sorted(keys))


if __name__ == "__main__":
    unittest.main()
