"""Nullifier uniqueness and domain-separation tests."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

EXP = Path(__file__).resolve().parents[1]
if str(EXP) not in sys.path:
    sys.path.insert(0, str(EXP))

from protocol.nullifier import (  # noqa: E402
    NullifierSet,
    compute_nullifier,
    domain_omission_attempt,
)


class TestNullifier(unittest.TestCase):
    def test_consume_once(self) -> None:
        ns = NullifierSet()
        n = compute_nullifier(
            source_chain="bitcoin-mainnet-semantics-synthetic",
            donation_txid_hex="ab" * 32,
            donation_vout=0,
        )
        self.assertIsNone(ns.consume(n))
        self.assertEqual(ns.consume(n), "NULLIFIER_ALREADY_CONSUMED")

    def test_different_vout_different_nullifier(self) -> None:
        a = compute_nullifier(
            source_chain="bitcoin-mainnet-semantics-synthetic",
            donation_txid_hex="ab" * 32,
            donation_vout=0,
        )
        b = compute_nullifier(
            source_chain="bitcoin-mainnet-semantics-synthetic",
            donation_txid_hex="ab" * 32,
            donation_vout=1,
        )
        self.assertNotEqual(a, b)

    def test_domain_omission_differs(self) -> None:
        n = compute_nullifier(
            source_chain="bitcoin-mainnet-semantics-synthetic",
            donation_txid_hex="cd" * 32,
            donation_vout=0,
        )
        bad = domain_omission_attempt(donation_txid_hex="cd" * 32, donation_vout=0)
        self.assertNotEqual(n, bad)

    def test_cross_chain_differs(self) -> None:
        a = compute_nullifier(
            source_chain="bitcoin-mainnet-semantics-synthetic",
            donation_txid_hex="ef" * 32,
            donation_vout=0,
        )
        b = compute_nullifier(
            source_chain="other-chain",
            donation_txid_hex="ef" * 32,
            donation_vout=0,
        )
        self.assertNotEqual(a, b)


if __name__ == "__main__":
    unittest.main()
